O Steam Deck é, antes de tudo, um computador Linux com tela de 7 a 7,4 polegadas. Quem conecta um monitor, um teclado e um mouse transforma o portátil num desktop completo — e o SteamOS foi desenhado para essa transição ser quase invisível. O segredo mora no próprio hardware: a porta USB-C do deck fala **DisplayPort Alt Mode**, o que significa que ela transporta vídeo, energia e dados pelo mesmo cabo.

Por baixo dos panos, quem cuida de tudo é o **KScreen**, o daemon do KDE Plasma responsável por detectar monitores, aplicar resoluções e posicionar telas. Entender essa arquitetura evita a confusão clássica de quem vinha do Windows e espera um "painel de controle de vídeo".

:::objetivos
- Entender o que é DisplayPort Alt Mode e o que a porta USB-C do deck entrega
- Distinguir o papel do KScreen do papel tradicional de "driver de vídeo"
- Listar os monitores detectados com `kscreen-doctor -o`
- Identificar a tela interna (`eDP`) e as saídas do dock (`HDMI`/`DP`)
- Usar `xrandr --query` como segunda fonte de verdade sobre o que está conectado
:::

## A física da porta: USB-C com DisplayPort Alt Mode

A porta USB-C do deck não é um conector de vídeo "de mentira". Ela carrega os quatro pares diferenciais de alta velocidade que, dependendo do modo negociado, podem virar dados USB, um stream DisplayPort, ou uma mistura dos dois. Quando você pluga um dock, o chip Controladora de Modo Alternativo negocia com o outro lado e reserva uma fração dessas pistas para vídeo.

É por isso que o deck — sem dock dedicado — consegue empurrar até **4K a 60 Hz ou até 120 Hz** dependendo da resolução e do padrão do monitor. O DisplayPort Alt Mode sobre USB-C entrega, na prática, DisplayPort 1.4, com largura de banda suficiente para 4K@120 com Display Stream Compression (DSC) habilitado no alvo.

O comando `kscreen-doctor` é a porta de entrada do usuário para tudo isso. Ele usa o D-Bus para falar com o daemon do KScreen:

```terminal
$ kscreen-doctor -o
Output: 1 eDP-1
	priority 2
	Modes:  9:1280x800@60*!  10:1280x800@60  11:1280x800@60  12:1280x800@120  13:1152x768@60  14:1024x768@60  15:800x600@60  16:640x480@60  17:640x480@60
	Geometry: 0,0 1280x800
	Scale: 1
	Rotation: 1
	Overscan: 100
	Vrr: Never
	RgbRange: unknown
```
A linha `Output: 1 eDP-1` identifica a tela interna. `eDP` significa *embedded DisplayPort*, nome técnico da conexão do painel embutido — sempre presente, mesmo sem nada plugado na porta USB-C.

## Onde o dock entra nessa história

A tela interna usa eDP, mas os monitores externos chegam **só** via USB-C/DisplayPort Alt Mode. Um dock converte esse sinal para saídas físicas de HDMI e DisplayPort, e cada uma vira uma "saída" no KScreen com nome próprio.

O padrão de nomenclatura segue o conector físico:

| Nome de saída | O que representa |
|---|---|
| `eDP-1` | Painel interno do deck |
| `HDMI-A-1` | Porta HDMI do dock |
| `DP-1`, `DP-2` | Portas DisplayPort do dock |
| `USB-C-1` | Saída USB-C de um dock que repassa Alt Mode |

Conecte um monitor HDMI ao dock e observe a mudança:

```terminal
$ kscreen-doctor -o
Output: 1 eDP-1
	priority 2
	Modes:  9:1280x800@60*!  10:1280x800@60  12:1280x800@120
	Geometry: 0,0 1280x800
	Scale: 1
Output: 2 HDMI-A-1
	priority 1
	Modes:  1:1920x1080@60  2:1920x1080@60*  3:1920x1080@50  4:1280x720@60
	Geometry: 1280,0 1920x1080
	Scale: 1
```

O asterisco (`*`) marca o modo ativo; `!` marca o modo preferido. Repare que o monitor externo ganhou `priority 1`, ou seja, virou o monitor primário — aquele que recebe os painéis e a barra de tarefas. O `Geometry: 1280,0` diz que ele foi colocado à direita da tela interna.

## xrandr: a segunda fonte de verdade

O KScreen é a camada amigável, mas por trás dele o X11/Wayland expõe o hardware via **RandR**. O comando `xrandr --query` lista tudo com um vocabulário mais cru, útil para diagnóstico:

```terminal
$ xrandr --query
Screen 0: minimum 16 x 16, current 3200 x 1080, maximum 32767 x 32767
eDP-1 connected primary 1280x800+0+0 (normal left inverted right x axis y axis) 248mm x 155mm
   1280x800      59.91*+  119.92
   1152x768      59.99
   1280x800      40.00
HDMI-A-1 connected 1920x1080+1280+0 (normal left inverted right x axis y axis) 527mm x 296mm
   1920x1080     60.00*+  50.00   59.94   30.00
   1280x720      60.00    50.00   59.94
```

Aqui `3200 x 1080` é a resolução **virtual total** — a soma das duas telas lado a lado. `+1280+0` na linha do HDMI confirma a posição à direita do painel interno. Quando um monitor não aparece no `xrandr`, o problema está na camada de conexão física ou no dock, não no KScreen.

:::nota
Num deck o `xrandr` reflete o que o KScreen configurou, mas os dois nem sempre concordam na hora exata da conexão. Se o KScreen ainda não processou o hotplug, o `xrandr` mostra o estado anterior. Para o dia a dia, confie no `kscreen-doctor`; use `xrandr` para investigar.
:::

## Resumo

- A porta USB-C do deck usa DisplayPort Alt Mode, transportando vídeo, energia e dados num cabo só.
- A tela interna é a saída `eDP-1`; monitores externos aparecem como `HDMI-A-1`, `DP-1` ou `USB-C-1` via dock.
- O KScreen é o daemon do Plasma que detecta, posiciona e configura os monitores.
- `kscreen-doctor -o` mostra resolução, geometria, escala e o modo ativo (marcado com `*`).
- `xrandr --query` serve como segunda fonte, expondo a resolução virtual total e as posições `+x+y`.

## Exercícios

1. Com nada plugado, rode `kscreen-doctor -o` e registre o nome, a resolução e a taxa da tela interna.
2. Conecte um monitor ao dock e rode `kscreen-doctor -o` de novo. Qual saída nova apareceu e qual `priority` ela recebeu?
3. Rode `xrandr --query` e explique, com suas palavras, o que significa o campo `current` da linha `Screen 0`.
4. Desconecte o monitor de surpresa (sem "ejetar") e rode `kscreen-doctor -o` imediatamente. A saída refletiu a mudança na hora ou precisou de um instante?
5. **Desafio.** Conecte dois monitores ao dock (HDMI + DP) e registre o `Geometry` de cada um no `kscreen-doctor -o`. Depois calcule a resolução virtual esperada no `xrandr --query` e confira se bate.
