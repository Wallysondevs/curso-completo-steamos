O giroscópio do Steam Deck é um sensor de movimento de seis eixos (IMU) que mede rotação e aceleração. Sozinho, ele pode virar mouse. Combinado com o que você aprendeu até aqui — camadas, modos de disparo e mouse regions — ele vira uma ferramenta de precisão que rivaliza com um mouse de mesa.

:::objetivos
- Ativar o giroscópio como mouse e como joystick virtual
- Configurar a ativação condicional: sempre, ao tocar o touchpad, ao segurar um botão
- Ajustar sensibilidade, suavização e zona morta do giroscópio
- Combinar giroscópio com radial menu para seleção gestual
- Entender como o kernel vê o sensor IMU do Deck
:::

## O sensor que o Deck tem e como o kernel o vê

A IMU do Steam Deck é um chip Bosch (geralmente BMI160 ou BMI260) que fala com o kernel via barramento I²C. O kernel o expõe como dois dispositivos de entrada: um acelerômetro e um giroscópio.

```terminal
$ cat /proc/bus/input/devices | grep -A 3 -i -E 'gyro|accel|imu'
N: Name="ST LIS3LV02DL Accelerometer"
H: Handlers=event5 
B: PROP=0
B: EV=9
--
```

A saída pode variar conforme o hardware exato (LCD vs. OLED, revisão da placa), mas o padrão é um evento de acelerômetro e um de giroscópio separados. O SteamInput lê esses eventos e os converte em movimento de mouse ou de analógico.

```terminal
$ sudo evtest /dev/input/event5 2>&1 | head -20
## Gire o Deck devagar e observe valores de ABS_RX, ABS_RY e ABS_RZ.
## Cada eixo representa rotação em torno de um eixo espacial.
```

:::info
O giroscópio do Deck mede **rotação**, não translação. Girar o Deck para a esquerda gera valores negativos no eixo de guinada (yaw); girar para cima gera valores no eixo de arfagem (pitch). O SteamInput traduz isso em movimento de mouse ou de analógico conforme a configuração.
:::

## Ativando o giroscópio como mouse

O comportamento mais comum é "giroscópio = mouse". Você inclina o Deck e o cursor se move, como se a tela fosse uma janela para o mundo 3D.

```text
Giroscópio
  → Comportamento: As Mouse
  → Ativação: Touch (ao tocar o touchpad direito)
  → Sensibilidade horizontal: 2.5
  → Sensibilidade vertical:   2.0
  → Suavização: 20%
```

O parâmetro mais importante é a **ativação**. Deixar o giroscópio sempre ligado gera tremor em cenas paradas (sua mão nunca está perfeitamente imóvel). Os modos de ativação resolvem:

| Ativação | Comportamento | Use quando |
|---|---|---|
| `Always On` | Sempre ativo | Navegação, menus |
| `Touch` | Ativo quando o dedo toca o touchpad direito | Jogos de tiro (mirar ao tocar) |
| `Button Chord` | Ativo enquanto segura um botão (ex.: `L2`) | Mirar com gatilho |
| `Joystick Deflection` | Ativo ao mover o analógico | Condução, voo |

O modo `Touch` é o mais usado por jogadores de FPS: você usa o touchpad para giro grosseiro e, ao pousar o dedo para ajuste fino, o giroscópio entra em cena. A transição é fluida porque o cérebro dissocia "mover o dedo" de "inclinar o Deck".

:::dica
Sensibilidade vertical ligeiramente menor que a horizontal (ex.: 2.5 H, 2.0 V) compensa o fato de que o movimento de pitch (cima/baixo) tem menos amplitude natural de pulso que o yaw (esquerda/direita). Teste e ajuste até parecer natural.
:::

## Giroscópio como joystick virtual

Alguns jogos não aceitam mouse + gamepad simultâneos; eles esperam que a mira venha do analógico direito. Para esses, o giroscópio pode emular um analógico:

```text
Giroscópio
  → Comportamento: As Joystick
  → Saída: Right Joystick
  → Ativação: Always On
```

O modo joystick é menos preciso que o modo mouse (a saída é limitada pela zona circular do analógico), mas é a única opção para jogos que travam o input híbrido. Se o jogo aceita mouse + gamepad simultâneo, sempre prefira `As Mouse`.

## Combinando giroscópio com radial menu

Aqui a coisa fica interessante. Você pode usar o giroscópio como gatilho de ativação para um radial menu: incline o Deck para uma direção e o menu aparece naquela fatia.

```text
Giroscópio → Ativador de Radial Menu (touchpad direito)
  Inclinar para cima → seleciona setor 1
  Inclinar para baixo → seleciona setor 5
```

Isso é particularmente útil em jogos de combate veicular ou espacial, onde o gesto físico de inclinar combina com a ação na tela (inclinar para subir, inclinar para mergulhar). A curva de aprendizado é mais longa que o touchpad puro, mas a imersão é total.

:::atencao
O giroscópio do Deck tem *drift* — deriva natural do sensor que faz o cursor se mover mesmo com o Deck parado. A zona morta (dead zone) corrige isso ignorando movimentos abaixo de um limiar. Comece com 5% e suba até o cursor parar de tremer sozinho. Se precisar de mais de 15%, recalibre o giroscópio pelo menu de sistema.
:::

## Resumo

- O Deck tem uma IMU (acelerômetro + giroscópio) exposta como dispositivos de entrada no `/proc/bus/input/devices`.
- O giroscópio pode emular mouse (preciso) ou joystick (compatível com jogos que não aceitam input híbrido).
- A ativação condicional (`Touch`, `Button Chord`, `Joystick Deflection`) evita tremor e drift em cenas paradas.
- Sensibilidade vertical menor que a horizontal compensa a amplitude natural reduzida do pitch.
- O giroscópio pode ativar setores de um radial menu, criando atalhos gestuais imersivos.
- Drift é normal; corrija com dead zone de 5% a 15% ou recalibração via menu de sistema.

## Exercícios

1. Localize o giroscópio com `cat /proc/bus/input/devices | grep -i -E 'gyro|accel|imu'` e anote o nome do dispositivo.
2. Ative o giroscópio como mouse com ativação `Touch` e teste num FPS. Ajuste a sensibilidade até conseguir mirar num ponto fixo sem ultrapassá-lo.
3. Compare o mesmo jogo com giroscópio `As Mouse` e `As Joystick`. Descreva a diferença de fluidez e precisão.
4. Aumente a dead zone de 0% para 10% e observe o cursor. Qual o valor mínimo que elimina o drift na sua unidade?
5. **Desafio.** Combine giroscópio com mouse region: configure o giroscópio como mouse (touch) para a tela principal e o touchpad esquerdo como mouse region para o minimapa. Jogue uma partida e relate se a divisão de tarefas (giro = mira, pad = mapa) funciona intuitivamente.