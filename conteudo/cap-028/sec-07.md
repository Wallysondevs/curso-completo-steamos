Instalar e rodar um aplicativo Flatpak é apenas o começo. Para usar o Steam Deck como ferramenta de trabalho, você precisa entender o ciclo de vida completo: como inspecionar o que está instalado, quanto espaço cada aplicativo ocupa, como atualizar, como limpar o que não usa mais e como diagnosticar quando algo não abre. Esta seção é o manual de manutenção do seu acervo Flatpak.

:::objetivos
- Listar aplicativos e runtimes com informações completas
- Inspecionar um aplicativo específico (versão, runtime, permissões, tamanho)
- Atualizar aplicativos e runtimes de forma seletiva
- Remover aplicativos órfãos e runtimes não utilizados
- Diagnosticar problemas de execução com logs

:::

## Inventário: o que está instalado

O comando mais importante para manutenção é `flatpak list`. Ele é o equivalente ao `dpkg -l` do mundo Flatpak — mostra tudo que está instalado, com metadados ricos.

```terminal
$ flatpak list
Name                     Application ID                    Version          Branch      Installation
Firefox                  org.mozilla.firefox               133.0.3          stable      system
Steam                    com.valvesoftware.Steam           1.0.0.81         stable      system
Discord                  com.discordapp.Discord            0.0.79           stable      user
Krita                    org.kde.krita                     5.2.6            stable      user
Freedesktop Platform     org.freedesktop.Platform          24.08.34         24.08       system
Mesa                     org.freedesktop.Platform.GL.default 24.3.2        24.08       system
KDE Application Platform org.kde.Platform                   6.7             6.7         system
```

A coluna `Installation` revela um detalhe importante: `system` significa instalado em `/var/lib/flatpak`, para todos os usuários; `user` significa instalado em `~/.local/share/flatpak`, só para o seu usuário `ana`. No Steam Deck (que por padrão tem um único usuário), a diferença prática é pequena, mas importa quem pode atualizar ou remover o aplicativo: aplicativos `system` exigem `sudo` para remover; `user` não.

Os modificadores `--app` e `--runtime` filtram a lista:

```terminal
$ flatpak list --app
Name         Application ID              Version    Branch   Installation
Firefox      org.mozilla.firefox         133.0.3    stable   system
Steam        com.valvesoftware.Steam     1.0.0.81   stable   system
Discord      com.discordapp.Discord      0.0.79     stable   user
Krita        org.kde.krita               5.2.6      stable   user
```

Para uma visão mais técnica, `flatpak list --columns=all` exibe colunas extras como o runtime associado, a arquitetura e a origem (repositório). É o comando a usar quando você quer entender a estrutura completa sem abrir dez janelas.

## Inspecionando um aplicativo

Para mergulhar num aplicativo específico, use `flatpak info` seguido do ID. A saída padrão já traz um resumo rico:

```terminal
$ flatpak info org.mozilla.firefox
Firefox - Browse the web

         ID: org.mozilla.firefox
        Ref: app/org.mozilla.firefox/x86_64/stable
       Arch: x86_64
     Branch: stable
    Version: 133.0.3
    License: MPL-2.0
     Origin: flathub
 Collection: org.flathub.Stable
 Installation: system
    Installed: 243.1 MB
     Runtime: org.freedesktop.Platform/x86_64/24.08
         Sdk: org.freedesktop.Sdk/x86_64/24.08
      Commit: 8a3f2b9c4d1e5f6a7b8c9d0e1f2a3b4c5d6e7f8a
      Parent: c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9
```

Os campos úteis: `Installed` (tamanho em disco), `Runtime` (o runtime que o aplicativo usa), `Origin` (de qual repositório veio) e `Commit` (o hash OSTree que identifica exatamente esta versão). Para ver apenas o tamanho:

```terminal
$ flatpak info --show-size org.mozilla.firefox
243.1 MB
$ flatpak info --show-runtime org.mozilla.firefox
org.freedesktop.Platform/x86_64/24.08
```

E para ver as permissões (o que já exploramos na seção 2), `--show-permissions`. Com esses três modificadores, você tem, em três comandos, uma foto completa de qualquer aplicativo Flatpak.

## Atualizando com controle

O Flatpak atualiza de forma explícita — diferentemente do Snap, nada acontece sozinho. O comando `flatpak update` atualiza tudo, mas aceita filtros para atualização seletiva.

```terminal
$ flatpak update
Looking for updates...
 1. [✓] org.mozilla.firefox                       stable  u 133.0.2 → 133.0.3
 2. [✓] org.freedesktop.Platform                   24.08  u 24.08.30 → 24.08.34
Updates complete.
```

Para atualizar um único aplicativo:

```terminal
$ flatpak update org.mozilla.firefox
```

O símbolo `u` na coluna de versão significa *update* — a versão antiga e a nova aparecem lado a lado, separadas pela seta `→`. A lista `[✓]` mostra o progresso conforme cada pacote é aplicado.

:::dica
Você pode ver o que seria atualizado sem aplicar nada usando `flatpak update --dry-run`. É útil no Steam Deck para decidir se vale a pena gastar banda agora ou adiar para quando estiver numa rede melhor.
:::

Se você quiser desativar atualizações automáticas de um aplicativo específico (por exemplo, um que está estável e você não quer arriscar a troca), o Flatpak não tem um comando direto, mas permite "segurar" a versão mantendo-a fora da varredura com `flatpak mask`:

```terminal
$ flatpak mask org.mozilla.firefox
$ flatpak update
Looking for updates...
 1. [✓] org.freedesktop.Platform  24.08  u 24.08.30 → 24.08.34
```

Repare que, após o `mask`, o Firefox não aparece mais na lista de atualizações — o Flatpak o ignora. Para reverter, `flatpak mask --remove org.mozilla.firefox`.

## Limpando o que não usa

Com o tempo, runtimes antigos e aplicativos órfãos se acumulam. O Steam Deck de 64 GB sente isso rápido. Existem três comandos de limpeza com propósitos distintos:

```terminal
$ flatpak uninstall --unused
Uninstalling unused runtimes:
  org.freedesktop.Platform                        23.08
  org.gnome.Platform                              45
  org.kde.Platform                                5.15
```

`--unused` remove runtimes que **nenhum** aplicativo instalado está usando. Se você atualizou o Flatpak de uma branch anual para outra, a branch antiga fica órfã e é candidata à remoção. É seguro: o Flatpak só remove o que não tem dependentes.

```terminal
$ flatpak uninstall --unused --dry-run
```

O `--dry-run` mostra o que *seria* removido sem remover. Rode sempre isso primeiro para conferir a lista antes de confirmar.

Para remover um aplicativo específico:

```terminal
$ flatpak remove org.gimp.GIMP
  ID                    Branch  Op
  org.gimp.GIMP         stable  r
```

E para fazer uma faxina mais profunda, removendo também os dados do aplicativo em `~/.var/app`:

```terminal
$ flatpak remove --delete-data org.gimp.GIMP
```

O `--delete-data` apaga também a pasta `~/.var/app/org.gimp.GIMP`, removendo configurações e cache. Sem essa flag, os dados são preservados — úteis se você pretende reinstalar e retomar de onde parou.

## Diagnosticando quando algo não abre

Quando um aplicativo Flatpak não abre, o primeiro passo é rodá-lo pelo terminal e ver o erro. Em vez do atalho do menu, use `flatpak run`:

```terminal
$ flatpak run org.mozilla.firefox
bwrap: Can't mount proc on /newroot/proc: Operation not permitted
```

Esse erro específico (`bwrap: Can't mount proc`) indica um problema com o *bubblewrap* — a ferramenta que o Flatpak usa para montar os *namespaces*. Geralmente acontece quando há limitação de privilégios ou um módulo de segurança interferindo. Ver os logs em tempo real é essencial para diagnóstico.

```terminal
$ flatpak run --verbose org.mozilla.firefox
F: Opening user flatpak installation at path /home/ana/.local/share/flatpak
F: Opening system flatpak installation at path /var/lib/flatpak
F: Allocated instance id 138339
F: bwrap() failed with error: Operation not permitted
```

O `--verbose` liga os logs internos do Flatpak (prefixados com `F:`) e mostra exatamente onde a execução falha. Também é possível verificar a integridade da instalação:

```terminal
$ flatpak repair
```

O `flatpak repair` verifica o repositório OSTree local e corrige arquivos corrompidos. É o equivalente a um `fsck` do mundo Flatpak — vale rodar após uma remoção abrupta de energia ou quando vários aplicativos pararam de abrir ao mesmo tempo.

:::atencao
Aplicativos Flatpak não abrem — ou abrem e fecham na hora — por três causas comuns: (1) falta de runtime (roda `flatpak update` para baixar dependências), (2) permissões insuficientes (`flatpak info --show-permissions` para conferir), ou (3) dados corrompidos em `~/.var/app` (apague a pasta do aplicativo e recomece limpo). Dê esses três passos antes de assumir que o aplicativo está quebrado.
:::

## Resumo

- `flatpak list` (com `--app`/`--runtime`) inventaria tudo que está instalado, por sistema ou por usuário.
- `flatpak info` com `--show-size`, `--show-runtime` e `--show-permissions` inspeciona um aplicativo em profundidade.
- `flatpak update` atualiza explicitamente; `--dry-run` simula e `flatpak mask` segura um aplicativo.
- `flatpak uninstall --unused` remove runtimes órfãos; `--delete-data` apaga também os dados do aplicativo.
- `flatpak run --verbose` e `flatpak repair` são as primeiras ferramentas de diagnóstico quando algo não abre.

## Exercícios

1. Rode `flatpak list --columns=all` e monte uma tabela com os cinco maiores aplicativos (use `flatpak info --show-size` para ordenar).
2. Use `flatpak update --dry-run` para ver se há atualizações pendentes sem aplicá-las. Depois decida: há algum aplicativo que você gostaria de segurar com `flatpak mask`?
3. Rode `flatpak uninstall --unused --dry-run` e anote quantos runtimes órfãos existem. Se for seguro, remova-os de verdade.
4. Escolha um aplicativo que você usa pouco e remova-o com `flatpak remove` (sem `--delete-data`). Depois verifique se a pasta em `~/.var/app` ainda existe e reinstale com `flatpak install`.
5. **Desafio.** Provoque um erro: mascare um aplicativo com `flatpak mask`, depois tente `flatpak update` e observe que ele é ignorado. Em seguida, desmascare com `flatpak mask --remove`, rode `flatpak repair` e `flatpak update` novamente. Documente o estado antes e depois de cada passo.
