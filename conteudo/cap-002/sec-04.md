Quando você liga o Steam Deck direto para jogar, você não está olhando para um desktop Linux comum. Está olhando para o Gamescope, um compositor gráfico escrito pela Valve especificamente para jogos. Ele é uma peça tão central do SteamOS que dá nome ao modo que o usuário vê na inicialização: o Modo Jogo. Entender o que é um compositor e por que o Gamescope é diferente é essencial para compreender o que o SteamOS faz de único.

:::objetivos
- Entender o papel de um compositor gráfico no Linux
- Diferenciar o Gamescope de compositores de desktop como o KWin
- Conhecer as capacidades únicas do Gamescope (escala, HDR, FSR)
- Identificar o Gamescope em execução e seus processos
:::

## O que é um compositor

Num sistema gráfico Linux moderno, existe uma camada entre os programas e a tela, responsável por juntar as imagens de várias janelas e decidir o que vai para cada pixel. Essa camada é o **compositor**. Sem ele, cada aplicativo desenharia direto no framebuffer e brigaria com os outros pela tela.

No desktop do Ubuntu, esse trabalho é feito pelo Mutter (GNOME). No KDE, pelo KWin. Cada desktop tem o seu. O Gamescope é o compositor do SteamOS — mas ele não foi projetado para janelas de escritório; foi projetado para uma única tarefa: renderizar jogos da melhor forma possível.

```terminal
$ ps aux | grep -i gamescope | grep -v grep
deck   1234  2.1  1.4 1234567 98765 ?  Ssl  10:23  0:12 /usr/bin/gamescope ...
```

O Gamescope aparece como processo do usuário `deck`, rodando em segundo plano desde o boot. É ele que detém a tela no Modo Jogo, não um KWin ou um GNOME Shell escondido.

## Por que um compositor só para jogos

Um compositor de desktop precisa equilibrar dezenas de janelas, transparências, efeitos e redimensionamentos. Isso custa desempenho, e em jogos cada milissegundo de latência importa. O Gamescope joga todo esse equilíbrio fora e otimiza para o caso que o usuário do Deck se importa: **um jogo em tela cheia**.

As capacidades que fazem o Gamescope brilhar:

- **Escala independente.** O jogo pode renderizar em 720p e o Gamescope escala para a tela de 800p (ou 1280x800 nativo) sem reconfigurar nada.
- **Escala fracionária e FSR.** O jogo renderiza numa resolução menor e o Gamescope faz upscale com FSR (FidelityFX Super Resolution) — o mesmo truque que permite "engarrafar" mais taxa de quadros em jogos pesados.
- **HDR.** Suporte a alto alcance dinâmico, coordenando o pipeline de cor com o OLED do Deck.
- **Limite de taxa de quadros e VRR.** Controle de FPS e sincronização adaptativa (30/40/45/60 fps), essencial para bateria e fluidez.

Essas coisas vivem no compositor porque é ele que tem a palavra final sobre cada quadro que vai para a tela. Colocá-las no jogo seria impossível — você não controla o código dos jogos que instala.

:::nota
O Gamescope começou como um projeto interno da Valve para o Steam Deck e hoje é código aberto. Ele também funciona fora do SteamOS, em desktops Arch e Fedora, como um compositor de "janela aninhada" para rodar jogos com escala e HDR — mas no Steam Desktop é nativo e tem a tela inteira.
:::

## O Modo Jogo na prática

O Modo Jogo é a interface default que aparece quando você liga o Deck. É a "casca" do Steam rodando sobre o Gamescope: biblioteca de jogos, loja, configurações, tudo em um formato pensado para navegação com controle (gamepad), não com mouse e teclado.

A integração entre Steam e Gamescope é profunda. Quando você lança um jogo, o Gamescope toma uma decisão de composição inteira: o jogo vira o "cliente" e a interface do Steam é suspensa ou sobreposta. Isso reduz o overhead em relação a um desktop que deixa KDE + Steam + jogo convivendo.

```terminal
$ journalctl -u steam -b | head -20
-- Boot 5adc2f6b... --
jan 12 10:22:50 steamdeck systemd[1]: Started Steam Big Picture Mode.
jan 12 10:22:52 steamdeck steam[980]: Steam Runtime launch service...
jan 12 10:22:54 steamdeck gamescope[1234]: Starting gamescope session...
jan 12 10:22:55 steamdeck steam[980]: CDesktopMode cannot be used in this session
```

O log do serviço `steam` (a unidade `systemd` `steam.service`) revela o ecossistema: o `systemd` inicia o serviço do Steam em "Big Picture Mode", que por sua vez conversa com o Gamescope. A linha sobre `CDesktopMode` em "this session" é um sinal de que o Modo Jogo e o Modo Desktop são sessões separadas — não dá para ter os dois ao mesmo tempo na mesma tela.

## Gamescope e a tela do Deck

O Steam Deck tem uma tela de 1280x800 (LCD) ou de resolução mais alta no OLED, e o Gamescope é o responsável por casar o que o jogo produz com o que o painel exibe. Nada disso exige que você configure resolução manualmente.

```terminal
$ gamescope --help 2>&1 | head -20
Usage: gamescope [options...] -- [command...]
Options:
  -W, --nested-width  width of the nested window
  -H, --nested-height height of the nested window
  -w, --default-width width of the internal render target
  -h, --default-height height of the internal render target
  -f, --fullscreen   make the window fullscreen
  --integer-scale    force integer scaling
  --fsr-sharpness    FSR sharpness (0..20)
  --hdr-enabled      enable HDR support (experimental)
```

As opções expõem as capacidades: `-w/-h` controlam o target interno de renderização (para onde o jogo desenha), `--integer-scale` força escala inteira (para pixel art nítida), `--fsr-sharpness` ajusta a nitidez do FSR. No Steam Desktop, o usuário não mexe nisso via linha de comando — o Steam traduz os controles de "desempenho" do Modo Jogo para essas flags.

:::dica
No Modo Jogo, o menu de desempenho (botão `[[...]]` → "⚡ desempenho") é a interface amigável do Gamescope. Limite de FPS, VRR, FSR, TDP — tudo ali vira opções do compositor. Você quase nunca precisa tocar na linha de comando para usar o Gamescope no Deck.
:::

## Gamescope vs o resto do mundo

É útil entender onde o Gamescope termina e onde o resto começa. O Gamescope é o compositor do Modo Jogo — não um ambiente de desktop. Ele não fornece gerenciador de arquivos, barra de tarefas nem terminal. Para isso existe o outro lado do SteamOS, o Modo Desktop com KDE Plasma, que veremos na próxima seção.

Essa separação é o coração da arquitetura do SteamOS: dois modos, dois compositores, um mesmo sistema por baixo. O Gamescope fica com a função de jogar; o KWin (dentro do Plasma) fica com a função de desktope — e o usuário alterna entre eles com um reboot ou uma troca de sessão.

## Resumo

- Um compositor é a camada que junta as imagens das janelas e entrega a tela; no Modo Jogo, essa camada é o Gamescope.
- O Gamescope foi escrito pela Valve para renderizar jogos em tela cheia, não para o desktop.
- Escala independente, FSR, HDR e limite de FPS vivem no Gamescope, liberando o jogo dessas tarefas.
- O Modo Jogo é o Steam em "Big Picture Mode" rodando sobre o Gamescope, controlado por gamepad.
- O `journalctl -u steam` expõe o ecossistema: `systemd` inicia o Steam, que conversa com o Gamescope.
- Gamescope (jogo) e KWin/Plasma (desktop) são compositores distintos de dois modos diferentes do mesmo sistema.

## Exercícios

1. Com `ps aux | grep -i gamescope | grep -v grep`, confirme que o Gamescope está em execução e anote o caminho do binário e o usuário dono do processo.
2. Rode `journalctl -u steam -b | head -30` e identifique pelo menos duas linhas que mencionem o Gamescope ou o Big Picture Mode. O que elas sugerem sobre a ordem de inicialização?
3. Examine as opções do Gamescope com `gamescope --help 2>&1 | head -40` (rode no Modo Desktop). Localize as flags de escala (`-w/-h`), FSR e HDR, e escreva uma frase sobre o que cada uma faz.
4. No Modo Jogo, abra o menu de desempenho (`[[...]]`) e observe as opções de limite de FPS, VRR e FSR. Tente mapear cada uma delas para uma flag que você viu no `--help`.
5. **Desafio.** Rode `systemctl status steam` no Modo Desktop e anote o estado da unidade. Depois reinicie no Modo Jogo (ou informe-se pela documentação) e explique por que o serviço `steam` parece ter um comportamento diferente nos dois modos, ligando isso à separação Gamescope/KWin.