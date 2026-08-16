FPS e refresh rate são dois números que todo mundo conversa como se fossem a mesma coisa, e não são. Um é produzido pela GPU; o outro é a capacidade física da tela. Entender a diferença é o primeiro passo para entender por que um jogo "travando" nem sempre é culpa do jogo — muitas vezes é a tela e o jogo batendo em ritmos incompatíveis.

:::objetivos
- Distinguir FPS (quadros por segundo gerados) de refresh rate (Hz da tela)
- Entender o que acontece quando um número não casa com o outro
- Identificar o refresh rate da sua tela pelo SteamOS
- Reconhecer as taxas suportadas por um display
:::

## Dois relógios, uma tela

O **FPS** (*frames per second*, quadros por segundo) é quantas imagens a GPU consegue terminar de desenhar a cada segundo. É um número que varia o tempo todo: numa cena leve subiu para 90, numa explosão caiu para 55. O **refresh rate** é a frequência fixa (ou quase fixa) em que a tela repinta o que está na memória de vídeo, medida em hertz (Hz). Uma tela de 60 Hz atualiza a imagem 60 vezes por segundo, chovesse ou fizesse sol.

Quando esses dois relógios não combinam, acontece o **tearing**: a tela começa a pintar um quadro novo no meio do processo, e a metade de cima mostra o frame anterior enquanto a metade de baixo já mostra o próximo. É aquela linha horizontal de "rasgo" na imagem. O problema não é falta de potência; é falta de sincronia.

```terminal
$ xrandr --query | grep -E ' connected|Hz'
eDP-1 connected primary 1280x800+0+0 (normal left inverted right x axis y axis)
   1280x800      60.00*+  90.00    60.00
```

A saída mostra o painel do Steam Deck (`eDP-1`) com o modo ativo marcado com `*` (60 Hz) e o preferido com `+`. O display oferece duas frequências: 60 Hz e 90 Hz. Repare que a própria tela do Deck é um caso especial — ela é um painel OLED de 90 Hz que também aceita 60 Hz, e, como veremos, o gamescope consegue extrair dela taxas intermediárias como 45 Hz.

## O que o FPS "de verdade" significa

FPS não é um número único; é uma média escondendo uma curva. Dois jogos que reportam "60 FPS" podem ter experiências totalmente diferentes: um entrega os 60 quadros uniformemente (um a cada 16,6 ms) e outro entrega 59 quadros em 5 ms e um demorando 700 ms. A média é a mesma; a fluidez, não.

Por isso ferramentas sérias medem o **frame time**, o tempo que cada quadro individual leva para ser renderizado, em vez do FPS. Um frame time constante de 16,6 ms é perfeito para 60 Hz. Um frame time oscilando entre 8 ms e 30 ms gera *stutter* — aquela sensação de "engasgo" que o número de FPS sozinho não denuncia.

:::nota
O FPS que você vê no overlay de performance do SteamOS é calculado a partir dos frame times recentes, não contado quadro a quadro. Um pico de demora num único frame derruba a leitura média por um instante, ainda que o jogo esteja tecnicamente "a 60".
:::

## Refresh rate não se negocia com o jogo

O refresh rate é uma propriedade do painel e do link que o conecta à GPU. Em telas de notebook e no Deck, o painel embutido negocia sua lista de modos no boot, e o que aparece em `xrandr` é o cardápio disponível. Num monitor externo via DisplayPort, a lista pode ser bem maior.

```terminal
$ xrandr --query
DP-1 connected 2560x1440+2560+0 (normal left inverted right x axis y axis)
   2560x1440     144.00*+ 120.00    60.00    30.00
HDMI-1 disconnected (normal left inverted right x axis y axis)
```

Aqui o monitor externo `DP-1` é um painel de 144 Hz, ativo em 144, e aceita também 120, 60 e 30 Hz. Saber essa lista importa porque o limitador de FPS que vamos configurar nas próximas seções precisa de um alvo que **divida** o refresh rate — 40 FPS só casa perfeitamente com uma tela que rode a 40, 80 ou 120 Hz, e não a 144.

## Hz, múltiplos e divisores

A relação entre FPS e refresh rate ideal é de **divisão exata**. Numa tela de 90 Hz, os alvos de FPS que produzem frame pacing perfeito são os divisores de 90: 90, 45 e 30. Numa tela de 60 Hz, os alvos são 60, 30, 20 (e 15). É por isso que o Steam Deck, com painel de 90 Hz, oferece de fábrica os limites de 90, 45 e 30 — além do 40 e do 60 disponíveis via configuração, que são abordados logo adiante.

Quando o FPS não divide o refresh rate — por exemplo 60 FPS numa tela de 144 Hz — cada frame novo chega num instante ligeiramente diferente do ciclo da tela, e o tearing aparece em frequência constante. O VRR, assunto de uma seção própria, resolve exatamente isso fazendo a tela esperar a GPU em vez do contrário.

Você pode verificar as taxas suportadas pelo kernel diretamente:

```terminal
$ cat /sys/class/drm/card0-eDP-1/modes
1280x800
1280x800
1280x800
```

Cada linha é um modo de resolução que o painel declarou. O `edid-decode` revela as taxas associadas:

```terminal
$ cat /sys/class/drm/card0-eDP-1/edid | edid-decode | grep -A2 'Detailed Timing'
Detailed Timing #1: 1280x800 @ 90.000 Hz
Detailed Timing #2: 1280x800 @ 60.000 Hz
Detailed Timing #3: 1280x800 @ 45.000 Hz
Detailed Timing #4: 1280x800 @ 40.000 Hz
```

## Resumo

- FPS é quantos quadros a GPU produz por segundo; refresh rate é quantas vezes a tela repinta por segundo.
- FPS é variável e depende da cena; refresh rate é uma propriedade (quase) fixa do painel.
- Quando os dois não casam, aparece o tearing, uma linha de rasgo na imagem.
- `xrandr --query` lista os modos do display com o ativo marcado por `*` e o preferido por `+`.
- O frame time individual é uma métrica mais honesta que o FPS médio para julgar fluidez.
- Alvos de FPS que dividem exatamente o refresh rate produzem frame pacing ideal.

## Exercícios

1. Rode `xrandr --query` e identifique o modo ativo (com `*`) e o preferido (com `+`) do seu painel principal. Anote a lista de frequências disponíveis.
2. Liste os alvos de FPS que dividem exatamente o refresh rate ativo da sua tela. Para 90 Hz, por exemplo, eles são 90, 45 e 30.
3. Ative o overlay de performance do SteamOS num jogo e compare o FPS reportado com a sensação de fluidez. Há momentos em que o número está alto mas o jogo parece "engasgar"?
4. Num monitor externo, use `xrandr --rate` para trocar a frequência e observe se a lista de modos disponíveis muda conforme o cabo (HDMI vs DisplayPort).
5. **Desafio.** Sabendo que o painel do Deck é um OLED de 90 Hz, proponha por que 40 FPS a 40 Hz é um alvo popular no aparelho mesmo sem 40 dividir 90 — e guarde essa hipótese para conferir na próxima seção.
