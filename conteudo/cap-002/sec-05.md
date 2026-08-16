O Steam Deck não é só um console. Segure o botão de energia, escolha "Alternar para Área de Trabalho", e você cai num desktop Linux de verdade: o KDE Plasma. É o outro lado da moeda do SteamOS, pensado para mouse, teclado e produtividade — o oposto complementar do Modo Jogo. Esta seção apresenta o Plasma, como trocá-lo por terminal e o que ele revela sobre a arquitetura de dupla personalidade do SteamOS.

:::objetivos
- Entender o papel do Modo Desktop (KDE Plasma) no SteamOS
- Trocar entre Modo Jogo e Modo Desktop
- Identificar o Plasma e seus processos em execução
- Explorar o terminal e oDiscover dentro do desktop
:::

## O segundo rosto do SteamOS

O SteamOS tem duas personalidades, e isso é uma decisão de design, não um acidente. O Modo Jogo (Gamescope) é otimizado para gamepad e tela cheia; o Modo Desktop (KDE Plasma) é otimizado para mouse, teclado, janelas e tarefas que pedem um desktop tradicional: editar um arquivo, navegar na web, instalar um aplicativo, usar um terminal.

O Plasma é um ambiente de desktop completo mantido pela comunidade KDE. Traz gerenciador de arquivos (Dolphin), terminal (Konsole), centro de configurações e o compositor **KWin** — que aqui substitui o Gamescope como responsável pela tela.

```terminal
$ ps aux | grep -i kwin | grep -v grep | head -3
deck   2345  0.8  0.9 987654 76543 ?  Ssl  11:02  0:05 /usr/bin/kwin_wayland --wayland
```

Repare: no Modo Desktop, quem domina o display é o `kwin_wayland`, rodando sobre Wayland. O Gamescope não está na jogada aqui. Uma única máquina, dois compositores, um ativo por vez.

:::nota
O SteamOS 3.6 usa Plasma sobre Wayland no desktop. O Wayland é o protocolo de servidor gráfico que vem substituindo o X11 no mundo Linux. Em versões muito antigas do SteamOS 3, o desktop caía para X11 em alguns cenários, mas o 3.6 consolidou o Wayland como padrão.
:::

## Trocando de modo

A forma amigável de trocar é pelo menu: no Modo Jogo, botão de energia → "Alternar para Área de Trabalho". No Modo Desktop, há um atalho "Retornar ao Modo de Jogo" na área de trabalho. Mas existe também o caminho por linha de comando, que mostra que a troca é, na verdade, uma troca de sessão gerenciada pelo `systemd`.

```terminal
$ steamos-session-select plasma
Switching to desktop session...
$ steamos-session-select gamescope
Switching to gaming session...
```

Os dois comandos fazem a ponte entre os modos. O `steamos-session-select` informa ao gerenciador de sessão qual "sessão" deve assumir no próximo instante: `plasma` para o desktop ou `gamescope` para o Modo Jogo. A troca exige um logout/relogin da sessão gráfica, porque não dá para ter os dois compositores disputando a mesma tela ao mesmo tempo.

Na prática, ao alternar, você vê a sessão fechar e outra iniciar — o equivalente a trocar de usuário, mas mantendo o mesmo `deck` logado.

## O desktop por linha de comando

Quem vem do mundo do servidor pode achar estranho "usar um terminal dentro de um desktop", mas no SteamOS o Konsole (o terminal do Plasma) é a ferramenta mais importante para tarefas avançadas. É lá que você roda `steamos-readonly`, `flatpak`, `rauc`, `journalctl`.

```terminal
$ echo $XDG_SESSION_TYPE
wayland
$ echo $XDG_CURRENT_DESKTOP
KDE
$ hostname
steamdeck
```

As variáveis de ambiente `XDG_SESSION_TYPE` e `XDG_CURRENT_DESKTOP` confirmam o que está rodando: Wayland como tipo de sessão gráfica e KDE como desktop atual. Elas são a forma rápida — e inequívoca — de saber em qual "personalidade" você está num dado momento.

```terminal
$ uname -r
6.5.0-valve16-1-neptune-65-g0a3a2c1
```

O kernel continua sendo o mesmo `linux-neptune` do Modo Jogo, com uma string de versão que carrega a tag `-valve` e o sufixo `-neptune`. Isso é importante: o Modo Desktop não é "outro sistema". É o mesmo SteamOS, com o mesmo kernel, o mesmo Filesystem imutável, apenas com uma sessão gráfica diferente por cima.

## Instalar e navegar com o Discover

O KDE traz o **Discover**, a loja de aplicativos do Plasma. No SteamOS, ele é a cara amigável do Flatpak — a via oficial de instalação de apps, como veremos na próxima seção. Em vez de `pacman`, você abre o Discover, busca, clica em instalar.

O Discover fala com o repositório Flatpak (Flathub) e com o aplicativo de atualização. Ele é a interface do usuário final para algo que também dá para fazer por terminal:

```terminal
$ flatpak remote-list
Name    Options
flathub system
```

O `flatpak remote-list` mostra os repositórios configurados. O `flathub` aparece como o único remoto em um SteamOS novo, marcado como `system` (instalado para todo o sistema, embora os apps em si vivam em `/home`). O Discover é só um front-end bonito para isso.

:::dica
Se você prefere linha de comando ou se o Discover travar, os comandos `flatpak search`, `flatpak install` e `flatpak run` fazem exatamente o que o Discover faz por trás dos panos. Vale ter os dois na manga — o Discover para o dia a dia e o `flatpak` para automação e diagnóstico.
:::

## Dois modos, um só contrato

A tentação é tratar o Modo Desktop como uma "porta dos fundos" onde as regras do SteamOS não valem. Não valem o contrário: o contrato da imutabilidade e do Flatpak segue valendo no desktop. Você até pode abrir um terminal, desativar o `steamos-readonly` e instalar algo com `pacman` — mas a próxima atualização vai desfazer, e o risco de quebrar o boot é real.

O Modo Desktop é onde você faz o que o console não faz, mas dentro das regras do console: aplicativos via Flatpak, arquivos em `/home`, configurações na home do `deck`.

```terminal
$ ls ~
Desktop Downloads Documents Music Pictures Videos
$ ls /home/deck/.var/app
```

O diretório `~/.var/app` é onde os aplicativos Flatpak guardam seus dados por aplicativo. Ver essa pasta já populada é o sinal de que o Flatpak está em uso — a diferença estrutural entre "instalei um programa" e "configurei meu desktop".

## Resumo

- O KDE Plasma é o Modo Desktop do SteamOS, otimizado para mouse e teclado, em contraste com o Modo Jogo.
- No desktop, o compositor é o `kwin_wayland` (Wayland), não o Gamescope.
- `steamos-session-select plasma` e `steamos-session-select gamescope` trocam entre as sessões.
- `XDG_SESSION_TYPE=wayland` e `XDG_CURRENT_DESKTOP=KDE` confirmam o modo atual.
- O Modo Desktop é o mesmo sistema do Modo Jogo: mesmo kernel `linux-neptune`, mesma imutabilidade.
- O Discover é a interface gráfica do Flatpak, a via oficial de instalação de apps.

## Exercícios

1. No Modo Desktop, rode `echo $XDG_SESSION_TYPE` e `echo $XDG_CURRENT_DESKTOP`. Anote os valores e explique o que cada um confirma.
2. Use `ps aux | grep -i kwin | grep -v grep` para confirmar que o KWin está ativo. Compare com o que você viu sobre o Gamescope no Modo Jogo.
3. Execute `hostname` e `uname -r`. Por que o hostname e o kernel são os mesmos dos dois modos? Escreva uma frase ligando isso à ideia de "um sistema, dois modos".
4. Abra o Discover e busque por um aplicativo simples (ex.: um editor de texto). Depois rode `flatpak remote-list` e `flatpak list | head` no terminal e relacione o que o Discover mostra com o que o Flatpak informa.
5. **Desafio.** Rode `steamos-session-select gamescope` (digitando no terminal do Modo Desktop) e observe a troca de sessão. Ao voltar, execute `steamos-session-select plasma`. Anote quanto tempo cada troca leva e o que muda na tela — e explique por que não é possível ter Gamescope e KWin ativos simultaneamente.
