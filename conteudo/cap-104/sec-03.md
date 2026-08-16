Cada instalação de pacote, cada Flatpak atualizado e cada jogo executado deixa para trás sobras que nunca são removidas automaticamente: pacotes baixados que ficaram no cache, dependências que ficaram órfãs, shaders compilados de jogos que você desinstalou. No Steam Deck, com SSD limitado, essas sobras são a diferença entre instalar mais um jogo ou não. Limpar é um ato de manutenção, mas também de respeito ao espaço que você tem.

:::objetivos
- Entender o que o cache do pacman acumula e como limpá-lo sem risco
- Remover pacotes órfãos com segurança
- Limpar o cache de shaders e a compatdata de jogos desinstalados
- Liberar espaço de Flatpak e remover runtimes órfãos
- Executar uma limpeza completa com critério, não com fúria destrutiva
:::

## O cache do pacman

Toda vez que você instala ou atualiza algo com `pacman`, o pacote `.pkg.tar.zst` baixado fica armazenado em `/var/cache/pacman/pkg`. A ideia é nobre: se você precisar reinstalar um pacote, não precisa baixar de novo. A consequência é menos nobre: esse diretório cresce indefinidamente.

```terminal
$ du -sh /var/cache/pacman/pkg
4.7G	/var/cache/pacman/pkg
$ ls /var/cache/pacman/pkg | wc -l
312
```

Quase 5 GB de pacotes que, na maioria, já estão instalados. A limpeza segura tem três níveis, do mais conservador ao mais agressivo:

```terminal
$ sudo pacman -Sc
Packages to keep:
  All locally installed packages

Cache directory: /var/cache/pacman/pkg/
:: Do you want to remove all other packages from cache? [Y/n] y
removing old packages from cache...
```

O `-Sc` mantém apenas as **versões atualmente instaladas** de cada pacote. As versões antigas (que você já substituiu via atualização) são removidas. Isso sozinho já recupera a maior parte do espaço, preservando a capacidade de reinstalar qualquer coisa sem internet. É a opção recomendada para a rotina semanal.

O `-Scc` é mais radical: remove o cache inteiro, inclusive a versão instalada. Você ainda pode reinstalar pacotes, mas terá que baixá-los de novo. Use apenas quando estiver com o espaço realmente crítico.

:::atencao
No SteamOS, o sistema de arquivos raiz é somente-leitura por padrão. Para usar `pacman` normalmente (instalar, atualizar, limpar), é preciso desativar a proteção com `sudo steamos-readonly disable` e reativá-la ao final com `sudo steamos-readonly enable`. Consulte o [capítulo sobre gerenciamento de pacotes](#/cap-011/sec-04) para o procedimento completo e os riscos.
:::

## Pacotes órfãos e dependências sobrando

Quando você desinstala um programa, as dependências que ele puxou nem sempre vão junto. Elas ficam para trás como pacotes órfãos: instalados, mas sem nenhum outro pacote que os requeira.

```terminal
$ pacman -Qtd
lib32-libvdpau 1.5-3
libvdpau 1.5-3
python-markupsafe 2.1.5-1
```

A flag `-Qtd` lista os órfãos (`-t` de *orphans*, `-d` de *deps*). Antes de remover, confira se algum deles é de fato necessário — às vezes um pacote parece órfão porque foi instalado manualmente por você e nada o declara como dependência. A boa prática é revisar a lista antes:

```terminal
$ pacman -Qtdq
lib32-libvdpau
libvdpau
python-markupsafe
$ sudo pacman -Rns $(pacman -Qtdq)
```

O `-Rns` remove o pacote (`-R`), junto de suas dependências não mais necessárias (`-n` de *nosave*, `-s` de *recursive*). O `-q` em `-Qtdq` produz a lista em formato puro, só nomes, pronta para o comando de remoção. Rode `pacman -Qtd` antes, leia, e só então remova.

```terminal
$ pacman -Rns python-markupsafe
checking dependencies...

Package (1)  Old Version  Net Change
python-markupsafe  2.1.5-1  -0.02 MiB

Total Removed Size:  0.02 MiB

:: Do you want to remove these packages? [Y/n] y
```

## Shadercache e compatdata: os gigantes invisíveis

Os dois maiores consumidores de espaço no Steam Deck raramente são os jogos em si. O **shader cache** guarda os shaders pré-compilados (para evitar stutter no primeiro carregamento), e a **compatdata** guarda as "garrafas" Wine/Proton que emulam o ambiente Windows de cada jogo.

```terminal
$ du -sh ~/.local/share/Steam/steamapps/shadercache
18G	/home/deck/.local/share/Steam/steamapps/shadercache
$ du -sh ~/.local/share/Steam/steamapps/compatdata
22G	/home/deck/.local/share/Steam/steamapps/compatdata
```

O problema: quando você desinstala um jogo, o shader cache dele tende a ficar órfão — uma pasta identificada por um AppID numérico que não corresponde mais a nenhum jogo instalado. Descobrir quais sobraram exige cruzar os AppIDs.

```terminal
$ ls ~/.local/share/Steam/steamapps/shadercache | head
123456
234567
345678
$ ls ~/.local/share/Steam/steamapps/ | grep appmanifest
appmanifest_123456.acf
appmanifest_345678.acf
```

O AppID `234567` tem pasta de shader mas não tem `appmanifest` correspondente — é órfão de um jogo desinstalado e pode ser removido. Um script faz essa checagem automaticamente, mas a seção 7 detalha as ferramentas prontas para isso.

:::dica
O Steam tem uma interface gráfica para isso: **Configurações → Armazenamento → Cache de shaders**. Por ela você limpa o cache de todos os jogos de uma vez. Mas o controle fino, AppID a AppID, só pelo terminal — e é ali que você recupera os gigabytes que a interface esconde.
:::

Na compatdata, cada pasta numerada é o prefixo Wine de um jogo. Os AppIDs órfãos seguem a mesma lógica do shader cache: cruze com `appmanifest` e remova quem não tem equivalente.

## Flatpak: runtimes que ninguém usa

O Flatpak tem o mesmo problema do pacman, em dobro: além do cache, ele acumula **runtimes** — grandes coleções de bibliotecas compartilhadas (Freedesktop, KDE, GNOME) que ficam para trás quando o último aplicativo que as usava é removido.

```terminal
$ flatpak list
Name                     Application ID                 Version  Branch
Mesa                     org.freedesktop.Platform.GL.default  24.3   24.08
Freedesktop Platform     org.freedesktop.Platform        24.08   24.08
KDE Application Platform org.kde.Platform                6.5     6.5
Firefox                  org.mozilla.firefox             137.0  stable
$ flatpak uninstall --unused

        ID                                Branch
 1.     org.freedesktop.Platform.GL.default 23.08

Proceed with these changes to the system installation? [Y/n] y
```

O `flatpak uninstall --unused` identifica sozinho os runtimes que não são mais exigidos por nenhum aplicativo instalado e os remove. É seguro e deve entrar na rotina semanal. Para esvaziar também o cache de download:

```terminal
$ flatpak list --columns=all | wc -l
$ sudo du -sh /var/lib/flatpak/repo
5.1G	/var/lib/flatpak/repo
```

Runtimes são os responsáveis por boa parte desse tamanho, não os aplicativos em si. Um `--unused` mensal mantém tudo sob controle.

## Resumo

- O cache do pacman em `/var/cache/pacman/pkg` acumula pacotes baixados; `sudo pacman -Sc` remove as versões antigas.
- `pacman -Qtd` lista pacotes órfãos; revise antes de remover com `sudo pacman -Rns $(pacman -Qtdq)`.
- No SteamOS, desative o modo somente-leitura (`steamos-readonly disable`) antes de mexer no pacman.
- Shader cache e compatdata deixam pastas órfãs por AppID quando jogos são desinstalados.
- `flatpak uninstall --unused` remove runtimes de que nenhum aplicativo precisa mais.
- Limpeza é rotina com critério, não fúria destrutiva; sempre revise a lista antes de remover.

## Exercícios

1. Meça `du -sh /var/cache/pacman/pkg` e conte os pacotes com `ls | wc -l`. Anote o tamanho antes e depois de `sudo pacman -Sc`.
2. Liste os pacotes órfãos com `pacman -Qtd`. Para cada um, tente descobrir (via `pacman -Qi nome`) por que ele ainda está instalado antes de decidir removê-lo.
3. Cruze `ls ~/.local/share/Steam/steamapps/shadercache` com os arquivos `appmanifest_*.acf` e liste os AppIDs órfãos. Remova um deles e confirme o espaço liberado com `du`.
4. Rode `flatpak uninstall --unused` e registre quais runtimes foram removidos e quanto espaço voltou para o sistema.
5. **Desafio.** Escreva um script `~/bin/orphan-report` que combina as quatro checagens deste capítulo — cache do pacman, pacotes órfãos, shader cache órfão e runtimes Flatpak — num único relatório com a estimativa de espaço recuperável em cada categoria, sem modificar nada.