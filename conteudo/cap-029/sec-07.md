Instalar é fácil. Saber o que já está instalado, quanto espaço ocupa e como remover o que não serve mais é outra história. Com o tempo, o Steam Deck acumula aplicativos Flatpak, runtimes e sobras que consomem espaço precioso no SSD. O Discover oferece uma visão clara do que está instalado, e o terminal permite ir mais fundo.

Esta seção trata da gestão do inventário: listar, inspecionar, remover e limpar. No Steam Deck — com frequentemente apenas 64 GB ou 256 GB de armazenamento no modelo base — essa disciplina é mais do que organização: é necessidade.

:::objetivos
- Listar aplicativos e runtimes instalados no Discover e no terminal
- Inspecionar detalhes de um Flatpak instalado (versão, tamanho, permissões)
- Remover aplicativos corretamente, incluindo resíduos
- Gerenciar runtimes órfãos e espaço em disco
:::

## A aba "Instalado" do Discover

Na barra lateral do Discover, "Instalado" lista tudo o que está no sistema, incluindo Flatpaks e (se aplicável) complementos KDE. Cada entrada mostra:

- Ícone e nome do aplicativo
- Tamanho em disco (aproximado)
- Botão "Remover" (ou "Abrir" se for um aplicativo)

Clicar numa entrada abre a página de detalhes, idêntica à página de antes da instalação, mas com opções de "Abrir" e "Remover" em vez de "Instalar".

O Discover, porém, **não** mostra runtimes na lista "Instalado" — ele foca em aplicativos e complementos. Para ver a foto completa, incluindo os runtimes que ocupam a maior parte do espaço, você precisa do terminal.

## Listando pelo terminal

O comando `flatpak list` é a fonte da verdade:

```terminal
$ flatpak list --app
Nome                           Application ID                            Versão        Ramo
Firefox                        org.mozilla.firefox                       134.0         stable
Kdenlive                       org.kde.kdenlive                          24.12.1       stable
Discover                       org.kde.discover                          5.27.11       stable
```

O `--app` restringe a aplicativos, escondendo runtimes. Para ver os runtimes:

```terminal
$ flatpak list --runtime
Nome                                       Application ID                       Versão    Ramo
Freedesktop Platform                       org.freedesktop.Platform             24.08.12   24.08
Freedesktop Platform                       org.freedesktop.Platform             23.08.22   23.08
KDE Application Platform                   org.kde.Platform                      6.7        6.7
GNOME Application Platform ver 47          org.gnome.Platform                     47         47
Mesa                                      org.freedesktop.Platform.GL.default  24.3.2     24.08
```

Repare nos runtimes duplicados: `org.freedesktop.Platform` aparece na versão 24.08 **e** na 23.08. Isso acontece porque aplicativos diferentes dependem de versões diferentes do runtime, e o Flatpak mantém ambas instaladas. É normal, mas cada runtime pode ocupar centenas de megabytes.

Para uma visão com tamanhos:

```terminal
$ flatpak list --columns=name,application,size
Nome                      Application ID                          Tamanho instalado
Firefox                   org.mozilla.firefox                     198.5 MB
Kdenlive                  org.kde.kdenlive                        1.2 GB
Discover                  org.kde.discover                        54.9 MB
```

O campo `Tamanho instalado` soma o aplicativo e seu runtime dedicado. Valores como 1,2 GB para o Kdenlive não são exagero — editores de vídeo carregam dezenas de bibliotecas.

## Inspecionando um aplicativo instalado

Para detalhes completos de um aplicativo instalado:

```terminal
$ flatpak info org.mozilla.firefox
Firefox - Fast, Private & Safe Web Browser

          ID: org.mozilla.firefox
         Ref: app/org.mozilla.firefox/x86_64/stable
        Arch: x86_64
      Branch: stable
      Origin: flathub
  Collection: org.flathub.Stable
Installation: system
   Installed: 198.5 MB
      Runtime: org.freedesktop.Platform/x86_64/24.08
          Sdk: org.freedesktop.Sdk/x86_64/24.08

      Commit: 6e2f3a1b9c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f
      Parent: 1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b
```

Os campos relevantes para a gestão são `Installed` (tamanho em disco), `Runtime` (qual base ele usa) e `Origin` (de qual remote veio). O `Commit` é o hash OSTree que identifica exatamente qual versão está instalada — essencial para auditoria e para reproduzir ambientes.

## Removendo aplicativos

No Discover, remover é um clique: abra o aplicativo instalado, clique em "Remover", confirme. No terminal:

```terminal
$ flatpak uninstall org.kde.kdenlive

        ID                               Ramo       Op   Remote
 1. [✓] org.kde.kdenlive                  stable     r    flathub

Desinstalando…
```

A letra `r` na coluna `Op` significa *removal*. O `flatpak uninstall` pergunta se você também quer remover runtimes que ficarem órfãos.

Para remover sem deixar resíduos, você pode combinar com a limpeza automática:

```terminal
$ flatpak uninstall --unused
```

O `--unused` remove runtimes e extensões que não são mais necessários por nenhum aplicativo instalado. É o "coletor de lixo" do Flatpak e a forma mais segura de recuperar espaço sem quebrar nada.

:::dica
Depois de desinstalar vários aplicativos, sempre rode `flatpak uninstall --unused`. Ele remove os runtimes órfãos que o Discover não mostra, e que muitas vezes são a maior parte do espaço consumido. Pode recuperar centenas de megabytes em minutos.
:::

## Gerenciando o espaço em disco

No Steam Deck, o espaço é o recurso mais escasso. Uma rotina saudável de gestão:

```terminal
$ df -h /home /var/lib/flatpak
Filesystem      Size  Used Avail Use% Mounted on
/dev/mmcblk0p8   60G   48G   12G  80% /home
/dev/mmcblk0p8   60G   48G   12G  80% /var/lib/flatpak
```

O `/var/lib/flatpak` e o `/home` costumam estar na mesma partição no Steam Deck (a partição de dados do usuário). Por isso, Flatpaks e seus jogos competem pelo mesmo espaço.

Para ver quanto do seu espaço é Flatpak:

```terminal
$ du -sh /var/lib/flatpak
$ du -sh /home/deck/.local/share/flatpak
```

O primeiro é a instalação de sistema (aplicativos instalados pelo Discover com escopo system); o segundo é a instalação de usuário (aplicativos instalados com `--user`).

:::atencao
Um cartão microSD montado em `/run/media/deck/` é um destino comum para expandir armazenamento, mas o Flatpak por padrão não instala aplicativos lá. Se você quiser mover a instalação para outro disco, é um processo avançado que envolve reconfigurar a localização do remote e o diretório de instalação — fora do escopo do Discover. Use o microSD para jogos e dados, não para Flatpaks.
:::

## Resumo

- O Discover lista aplicativos instalados na aba "Instalado", mas não mostra runtimes.
- `flatpak list --app` e `flatpak list --runtime` são a fonte da verdade, separando aplicativos de runtimes.
- `flatpak info <id>` revela versão, tamanho, runtime, origem e commit de qualquer Flatpak instalado.
- `flatpak uninstall <id>` remove um aplicativo; `flatpak uninstall --unused` remove runtimes órfãos.
- No Steam Deck, Flatpaks e jogos dividem a mesma partição de dados; gerenciar espaço é essencial.

## Exercícios

1. Execute `flatpak list --app` e `flatpak list --runtime`. Liste separadamente aplicativos e runtimes, anotando a versão de cada runtime.
2. Use `flatpak list --columns=name,size` para ordenar os aplicativos por tamanho (`flatpak list --columns=name,size | sort -k2 -h`). Qual aplicativo ocupa mais espaço na sua máquina?
3. Escolha um aplicativo que você não usa mais e remova-o: primeiro pelo Discover (botão "Remover") e confirme com `flatpak list --app`. Depois rode `flatpak uninstall --unused` e anote quanto espaço foi liberado.
4. Execute `df -h /home` antes e depois de instalar um aplicativo grande. Quanto espaço a instalação consumiu de fato? Compare com `flatpak info <id> | grep Installed`.
5. **Desafio.** Faça uma auditoria completa de espaço: some o tamanho de todos os seus Flatpaks (`flatpak list --columns=size`), todos os seus runtimes, e veja quanto isso representa do total do `/home` via `df -h`. Proponha três ações concretas para reduzir o consumo de espaço, e execute pelo menos uma delas (instale algo menor no lugar de algo maior, remova um runtime órfão, ou desinstale um aplicativo que você não usa desde que comprou o Deck).