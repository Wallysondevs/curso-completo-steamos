Os touchpads e o giroscópio são o que separam o Steam Deck de qualquer outro portátil. Herdados do Steam Controller, os touchpads hápticos permitem mover um cursor de mouse com precisão milimétrica usando os polegares; o giroscópio, invisível, detecta a inclinação do aparelho e a traduz em movimento na tela. Juntos, eles se combinam no Steam Input para criar esquemas de controle impossíveis em um gamepad comum.

:::objetivos
- Entender a função e a sensibilidade dos touchpads quadrados do Steam Deck
- Distinguir entre giroscópio e acelerômetro e saber qual o Deck usa para controle fino
- Explorar o Steam Input como camada de tradução entre hardware físico e ação no jogo
- Ler os eventos de touchpad e giroscópio do kernel
- Configurar um perfil de giroscópio ativado por toque no touchpad
:::

## Touchpads: mais que um mouse de polegar

Cada touchpad do Steam Deck é um quadrado de aproximadamente 30 mm de lado com superfície texturizada. Eles usam sensores capacitivos de alta frequência de amostragem — a Valve nunca publicou o número exato, mas a taxa de polling percebida fica acima de 100 Hz, suficiente para não introduzir latência notável no cursor.

Diferente de trackpads de notebook, que emulam mouse relativo (com aceleração e imprecisão), os touchpads do Deck podem operar em dois modos: **relativo** (como trackpad, útil para modo Desktop) e **absoluto** (como tela sensível ao toque, em que o canto superior esquerdo do pad mapeia o canto superior esquerdo da tela). O Steam Input escolhe o modo conforme o perfil, e você pode trocar na configuração por jogo.

A sensação tátil ao deslizar o polegar é acompanhada por feedback **háptico**: pequenos motores lineares vibram com precisão para simular uma esfera de trackball girando, um clique de mouse ou um limite de área. O efeito é tão convincente que a primeira reação costuma ser achar que o pad está realmente se movendo.

```terminal
$ libinput list-devices | grep -A5 Touchpad
Device:           FTS3528:00 2808:1015 Touchpad
Kernel:           /dev/input/event5
Group:            10
Seat:             seat0, default
Size:             30x30mm
Capabilities:     pointer
```

O device `FTS3528:00` é o controlador dos touchpads, exposto via I²C como um dispositivo de ponteiro. O kernel o vê como um touchpad de 30×30 mm — que é o tamanho físico de cada um.

:::dica
No modo Desktop, os touchpads podem ser configurados para clicar com pressão (não só com toque). A sensibilidade da pressão é ajustável em Settings → Mouse & Touchpad. A pressão não é binária: o pad reporta valores analógicos que o SteamOS interpreta.
:::

## Giroscópio e acelerômetro: o sensor que você não vê

O Steam Deck carrega um IMU (Inertial Measurement Unit) de seis eixos: três eixos de giroscópio (rotação nos eixos pitch, yaw e roll) e três de acelerômetro (aceleração linear). Na prática, o Steam Input usa o giroscópio para controle de câmera fina — apontar uma arma, mirar um arco, ajustar a visada — e o acelerômetro para detectar gestos bruscos como sacudir o Deck.

O giroscópio mede velocidade angular (graus por segundo), não posição absoluta. Isso significa que ele é imune a drift de longo prazo, mas não sabe onde está "para cima". Para compensar, o Steam Input combina os dados do acelerômetro (que sabe onde a gravidade aponta) para corrigir a orientação. O resultado é um controle de câmera que pode ser configurado para ativar só quando seu polegar toca o touchpad direito ou o analógico.

```terminal
$ evtest /dev/input/event9 | head -20
Input driver version is 1.0.1
Input device ID: bus 0x19 vendor 0x28de product 0x1205 version 0x111
Input device name: "Valve Software Steam Deck Gyroscope"
Supported events:
  Event type 0 (EV_SYN)
  Event type 3 (EV_ABS)
    Event code 0 (ABS_X)
    Event code 1 (ABS_Y)
    Event code 2 (ABS_Z)
    Event code 3 (ABS_RX)
    Event code 4 (ABS_RY)
    Event code 5 (ABS_RZ)
```

Seis eixos — os primeiros três (`ABS_X` a `ABS_Z`) são o acelerômetro; os três seguintes (`ABS_RX` a `ABS_RZ`) são o giroscópio. Cada evento reporta valores inteiros de eixo que o Steam Input converte em rotação de câmera conforme a sensibilidade configurada.

:::nota
Por que giroscópio em vez de mouse? A mão humana é boa em movimentos rotacionais finos do punho, ruins em movimentos lineares milimétricos. O giroscópio explora justamente a rotação do punho — você mexe o Deck como se ele fosse uma câmera, e a tela acompanha. Quem migra do teclado e mouse se adapta em minutos; quem vem do analógico direito sofre mais, mas o resultado é mira muito mais precisa.
:::

## Steam Input: a cola entre hardware e jogo

Nenhum dos controles do Deck — touchpads, giroscópio, botões traseiros — chega diretamente ao jogo. Eles passam pelo **Steam Input**, uma camada de software que traduz sinais do hardware nos comandos que o jogo entende (XInput, teclado, mouse, ou uma mistura).

O Steam Input organiza os comandos em **ações** e **ativadores** (*activators*). Uma ação é "olhar ao redor", "mirar com precisão", "recarregar", "abrir inventário". Um ativador é o que dispara a ação: "giroscópio ativado ao tocar o touchpad direito". O perfil de controle mapeia tudo — e cada jogo pode ter seu próprio perfil, com comunidade de usuários compartilhando suas configurações.

```terminal
$ ls ~/.local/share/Steam/steamapps/common/SteamControllerConfig/ | head -10
workshop
usercontent
controller_neptune.vdf
controller_neptune_gamepad+mouse+gyro.vdf
```

Os arquivos `.vdf` (Valve Data Format) no diretório de configuração armazenam cada perfil. `neptune` é o codinome interno do Deck como controlador. Você pode abrir esses arquivos com qualquer editor de texto — são pares chave-valor em formato VDF, legíveis e editáveis.

A potência real do Steam Input está na **combinatória**: giroscópio + toque no pad direito, bumpers como modificadores que alteram completamente o layout, gatilhos que fazem uma coisa até metade do curso e outra depois. Jogos que nunca sonharam com giroscópio (Skyrim, Cyberpunk, Dark Souls) passam a ter controle de câmera fina porque o Steam Input emula mouse e teclado onde o jogo espera um gamepad.

:::exemplo
Num FPS típico, uma configuração comum é: touchpad direito = mouse (rápido, para virar 180°), giroscópio = mouse (lento, ativado ao tocar o touchpad, para correção fina de mira), `L2` = botão direito do mouse no meio do curso e `R5` = recarregar. O jogo nem sabe que existe giroscópio — recebe só eventos de mouse.
:::

## O giroscópio no kernel e o gyro-to-mouse

Para quem quer ver o giroscópio cru, sem a camada do Steam, os eventos estão em `/dev/input/`. O dispositivo IMU reporta valores angulares e de aceleração o tempo todo, mesmo em modo de jogo.

```terminal
$ sudo evtest --grab /dev/input/event9 2>&1 | head -30
Input device name: "Valve Software Steam Deck Gyroscope"
Testing ... (interrupt to exit)
Event: time 1734567890.123456, type 3 (EV_ABS), code 3 (ABS_RX), value -127
Event: time 1734567890.123456 -------------- SYN_REPORT ------------
Event: time 1734567890.125789, type 3 (EV_ABS), code 3 (ABS_RX), value -132
```

Os valores negativos em `ABS_RX` indicam rotação anti-horária (ou para a direita) no eixo X do giroscópio. O Steam Input coleta esses eventos a ~200 Hz e aplica uma curva de sensibilidade antes de gerar movimento de mouse — inacreditavelmente suave, desde que configurada direito.

```terminal
$ find /sys/devices/ -name '*imu*' -o -name '*gyro*' -o -name '*accel*' 2>/dev/null | head -5
/sys/devices/platform/AMDI0041:00/i2c-0/i2c-IMU0001:00
```

O IMU do Deck é um chip conectado via I²C (barramento interno de baixa velocidade para sensores) e aparece sob a plataforma AMD. A localização exata varia com a versão do kernel, mas o padrão de nomenclatura é consistente.

## Resumo

- Os touchpads quadrados de 30 mm operam em modo relativo ou absoluto, com feedback háptico por motores lineares.
- O giroscópio de três eixos mede velocidade angular e é combinado com o acelerômetro para controle de câmera fina.
- O Steam Input é a camada de software que traduz hardware físico em comandos de jogo (XInput, teclado, mouse).
- Os perfis de controle em `.vdf` são editáveis e a comunidade compartilha configurações por jogo.
- Eventos brutos de touchpad e giroscópio podem ser lidos via `/dev/input/` com `evtest` e `libinput`.

## Exercícios

1. No modo Desktop, abra Settings → Mouse & Touchpad e experimente ajustar a pressão de clique do touchpad. Depois abra um editor de texto e escreva uma frase usando apenas o touchpad direito como mouse e o esquerdo para rolagem — como foi a experiência?
2. Execute `libinput list-devices` e localize a entrada do touchpad FTS3528:00. Anote o nó `/dev/input/event*` correspondente.
3. Com `evtest`, encontre o dispositivo "Valve Software Steam Deck Gyroscope". Incline o Deck devagar para a direita e veja os valores de eixo mudarem. Qual eixo (`ABS_RX` ou `ABS_RY`) responde à rotação horizontal?
4. Abra um perfil de controle de um jogo no Steam (pelo Game Mode, Steam Input → View Layout) e espiçe quantas camadas de ativadores o giroscópio tem — há ativadores diferentes para "touch no pad" e "touch no analógico"?
5. **Desafio.** Configure um perfil Steam Input para seu jogo favorito onde o giroscópio só ativa ao tocar o touchpad direito e, ao mesmo tempo, o touchpad esquerdo se transforma em um teclado virtual com 4 teclas (1-4) mapeadas para hotkeys. Teste por 15 minutos e descreva o que funcionou e o que ainda precisa de ajuste fino.