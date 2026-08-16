O controle do Steam Deck é, ao mesmo tempo, o maior trunfo da emulação portátil e a maior fonte de frustração quando o mapeamento não bate. Um gamepad de Super Nintendo, um de Nintendo 64 e um de GameCube têm layouts radicalmente diferentes, e o Steam Input — a camada que traduz os botões físicos do Deck em comandos — é a ponte que reconcilia tudo. Esta seção domina esse mapeamento.

:::objetivos
- Entender como o Steam Input traduz os controles físicos do Deck em comandos por jogo
- Mapear corretamente as plataformas de layout próprio, como N64 e GameCube
- Lidar com controles externos, inclusive com ordem de jogadores
- Usar os botões traseiros e os trackpads de forma produtiva
- Armazenar e reutilizar perfis de controle por plataforma
:::

## O Steam Input como camada de tradução

Todo botão físico do Deck — A, B, X, Y, os dois analógicos, o D-pad, os gatilhos, os quatro botões traseiros e os dois trackpads — é traduzido pelo Steam Input antes de chegar ao jogo. No desktop Linux, um controle aparece como um dispositivo comum (`/dev/input/event*`); o Steam Input intercepta e reescreve esses eventos para que qualquer emulador os entenda como um controle virtual.

Isso significa que você tem duas camadas de mapeamento possíveis: a do **Steam Input** (transforma o físico do Deck em um gamepad virtual) e a do **emulador** (transforma o gamepad virtual nos botões do console emulado). Saber em qual camada mexer é metade do trabalho.

```terminal
$ ls /dev/input/event* 2>/dev/null | head
/dev/input/event0
/dev/input/event1
/dev/input/event2
/dev/input/event3
```

Esses são os dispositivos de entrada crus. O Steam Input opera acima deles, então o emulador nunca vê o botão físico; vê o que o Steam Input decidiu enviar. É por isso que um mesmo botão pode ter significados diferentes em jogos diferentes sem mexer em nada no emulador.

:::nota
Dentro do RetroArch, a configuração de botões usa um sistema de "RetroPad" com uma dúzia de posições lógicas (A, B, X, Y, L1, R1, etc.) que é independente do console emulado. O core mapeia, então, o RetroPad para o console real. São, na prática, três camadas: físico → Steam Input → RetroPad → console.
:::

## Plataformas de layout exótico: N64 e GameCube

O problema aparece em consoles cujos controles não são um "padrão ABXY". O Nintendo 64 tem um analógico central e seis botões de face dispostos em "M" (A, B e os quatro C-buttons); o GameCube tem um layout assimétrico com um A gigante e um B pequeno. Transportar isso para o Deck exige decisão, não há mapeamento "certo".

A convenção mais confortável para o N64 é usar o **analógico direito como os C-buttons** (câmera) e o analógico esquerdo como o analógico do N64, deixando A e B nos botões de face. Alternativas existem, mas essa preserva a intuição de câmera no analógico.

```terminal
$ flatpak run org.libretro.RetroArch --verbose 2>&1 | grep -i 'port 1' | head -3
[INFO] [Joypad]: Found joypad driver: "udev"
[INFO] [Joypad]: Port 1 connected
```

A saída confirma o driver de joystick (`udev`, o padrão no Linux) e que o controle virtual está conectado na porta 1. No RetroArch, o mapeamento se faz em **Settings → Input → Port 1 Controls**, atribuindo cada botão do RetroPad ao botão físico desejado.

:::dica
Em vez de reconfigurar o RetroArch à mão, use os **perfis de controle do Steam Input**: crie um template por plataforma ("N64 — C-buttons no analógico direito", "GameCube — A grande no botão A") e salve. Depois é só aplicar o template ao atalho não-Steam do jogo, e o emulador fica intocado. Isso centraliza a decisão numa camada só.
:::

## Controles externos e ordem de jogadores

Emulação é social, e o Deck suporta controles externos por Bluetooth ou USB. O desafio clássico é a **ordem dos jogadores**: quando um controle externo conecta, ele pode assumir a porta 1, empurrando o controle do Deck para a porta 2. Em jogos de dois jogadores, isso bagunça quem é quem.

```terminal
$ flatpak run org.libretro.RetroArch --verbose 2>&1 | grep -iE 'port [0-9] connected'
[INFO] [Joypad]: Port 1 connected
[INFO] [Joypad]: Port 2 connected
```

A abordagem robusta é fixar qual dispositivo vai em qual porta. No RetroArch, isso se controla em **Settings → Input → Port 2 Binds** e no menu de "Device Index", onde você escolhe explicitamente qual controle físico alimenta cada porta, em vez de deixar o emulador decidir pela ordem de conexão.

:::atencao
Ao usar controle externo, desligue o Steam Input para aquele dispositivo se houver conflito, ou defina o "controller order" no overlay do Steam. O sintoma de conflito é botão duplicado: um pressiona e o jogo registra dois. A regra é que cada camada de tradução deve ser aplicada uma única vez — não deixe o Steam Input e o RetroArch remapeando o mesmo botão ao mesmo tempo.
:::

## Trackpads e botões traseiros como cartas na manga

Os dois trackpads e os quatro botões traseiros são recursos que os consoles emulados nunca tiveram, e é exatamente aí que você ganha. Um trackpad configurado como "mouse region" resolve menus de jogos de point-and-click (PC, DOS); o outro pode virar um seletor rápido de save states.

Os botões traseiros são os mais úteis: para um jogo de Game Boy, por exemplo, mapear L4 para "trocar paleta" ou R4 para "fast-forward" (avanço rápido, essencial em RPGs) elimina diálogos e caminhadas lentas.

```terminal
$ flatpak run org.libretro.RetroArch --verbose 2>&1 | grep -i 'hotkey' | head -3
[INFO] [Core]: Enable hotkeys: yes
[INFO] [Core]: Fast forward hotkey: toggle
```

Os "hotkeys" são combinações de teclas/modos do RetroArch (ex.: segurar um botão + outro para fast-forward). Vincular essas funções — fast-forward, save state, load state — aos botões traseiros via Steam Input é a forma mais limpa de ganhar atalhos sem sacrificar botões de face do jogo.

## Resumo

- O Steam Input traduz os botões físicos do Deck em um gamepad virtual antes de o emulador ver qualquer coisa.
- Existem três camadas de mapeamento: físico → Steam Input → RetroPad → console emulado.
- N64 e GameCube exigem decisão de layout; a convenção comum é C-buttons no analógico direito.
- A ordem de jogadores pode inverter portas; fixe o "device index" por porta em vez de aceitar a ordem de conexão.
- Trackpads e botões traseiros (L4/R4/L5/R5) são ótimos para fast-forward, save states e menus de mouse.
- Perfis de Steam Input por plataforma centralizam o mapeamento numa camada e evitam mexer no emulador.

## Exercícios

1. Identifique os dispositivos de entrada com `ls /dev/input/event*` e explique em qual ponto o Steam Input intervém.
2. Crie no RetroArch um mapeamento de Port 1 para SNES e descreva onde cada botão físico foi parar.
3. Monte um template de Steam Input para N64 com C-buttons no analógico direito e aplique a um jogo de N64.
4. Conecte um controle externo e reproduza (e corrija) o problema de inversão de portas num jogo de dois jogadores.
5. **Desafio.** Vincule fast-forward e save state aos botões traseiros via Steam Input, e valide com o log `--verbose` do RetroArch que os hotkeys foram acionados, sem perder nenhum botão de face do jogo.
