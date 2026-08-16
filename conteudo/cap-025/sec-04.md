Dois monitores ligados é um quebra-cabeça de geometria: quem fica à esquerda, quem é o principal, o que acontece com a tela do deck. O SteamOS trata cada saída como um retângulo dentro de um "mosaico" maior, e o KScreen é quem arruma esses retângulos. Aprender a dizer ao sistema "este monitor fica à direita daquele" é mais que cosmético — é o que faz o mouse atravessar a borda certa.

Existem dois modos fundamentais de usar dois monitores, e vale conhecê-los pelo nome antes de mexer nos comandos.

:::objetivos
- Entender a diferença entre espelhamento (mirror/clone) e extensão (extend)
- Definir qual monitor é o primário com `kscreen-doctor`
- Posicionar um monitor à direita ou à esquerda com `kscreen-doctor` e `xrandr`
- Rotacionar e reposicionar saídas usando `--right-of`, `--left-of` e `--above`
- Reparar a geometria quando o sistema "embaralha" a posição das telas
:::

## Espelhar ou estender: dois modos, um comando

**Espelhar** (ou *clone*) faz os dois monitores mostrarem a mesma imagem; **estender** (ou *estender desktop*) soma as áreas, dando a você uma superfície de trabalho contínua. Para jogar ou apresentar, espelhar costuma bastar; para produtividade, estender é o padrão.

O KScreen descreve a posição de cada tela pelo par `Geometry: x,y larguraxaltura`, onde `x,y` é o canto superior esquerdo daquele monitor dentro do mosaico. Dois monitores espelhados aparecem sobrepostos na mesma coordenada:

```terminal
$ kscreen-doctor -o
Output: 1 eDP-1
	Geometry: 0,0 1280x800
Output: 2 HDMI-A-1
	Geometry: 0,0 1280x800
```

As duas telas em `0,0` é a assinatura do espelhamento: ocupam o mesmo lugar, então mostram o mesmo conteúdo. Para separá-las, coloque o monitor externo numa coordenada ao lado e ele passa a estender.

## Escolhendo o monitor primário

O primário é aquele que recebe a barra de tarefas, os ícones e a maioria dos painéis. Num setup deck+dock, a escolha natural é o monitor externo — maior e ergonômico — deixando a tela interna como auxiliar.

```terminal
$ kscreen-doctor output.HDMI-A-1.primary
$ kscreen-doctor output.eDP-1.position.1280,0
$ kscreen-doctor -o
Output: 1 eDP-1
	priority 1
	Geometry: 1280,0 1280x800
Output: 2 HDMI-A-1
	priority 2
	Geometry: 0,0 1920x1080
```

Aqui o HDMI virou `priority 2` (maior prioridade = primário) e foi puxado para a origem `0,0`, enquanto o painel interno foi empurrado para `1280,0`, à direita. Note que `priority` e `Geometry` andam juntos: definir o primário reposiciona, e reposicionar redefine prioridades.

## Posicionando com xrandr: --right-of e --left-of

O `xrandr` oferece atalhos verbais muito mais intuitivos que coordenadas cruas. `--right-of`, `--left-of`, `--above` e `--below` posicionam um monitor em relação a outro sem você calcular pixel nenhum:

```terminal
$ xrandr --output HDMI-A-1 --auto --primary --right-of eDP-1
$ xrandr --output eDP-1 --auto --left-of HDMI-A-1
```

`--auto` é o curinga que pede ao sistema para usar o modo preferido daquele monitor; `--primary` marca o monitor principal na mesma tacada. O comando `--right-of eDP-1` coloca o HDMI imediatamente à direita do painel interno, alinhado pelo topo.

Para um monitor vertical (ótimo para código), entra a rotação:

```terminal
$ xrandr --output HDMI-A-1 --auto --rotate right --right-of eDP-1
$ xrandr --query | grep HDMI
HDMI-A-1 connected 1080x1920+1280+0 right (normal left inverted right x axis y axis)
```

Repare que a resolução agora é `1080x1920` (invertida) e a palavra `right` entre parênteses indica a rotação aplicada. Um monitor 1080p girado vira um painel de 1920 de altura.

:::dica
O `--rotate` aceita `left`, `right`, `inverted` e `normal`. Combine `right` com `--right-of` para um segundo monitor vertical de leitura ao lado da tela principal — o setup preferido de quem lê logs e diffs o dia inteiro.
:::

## Quando a geometria fica embaralhada

Às vezes o KScreen posiciona o monitor novo numa coordenada aleatória, fazendo o mouse "sumir" por cima ou por baixo. Isso acontece com docks que reportam hotplug fora de ordem. A correção é mandar a posição absoluta:

```terminal
$ kscreen-doctor output.HDMI-A-1.position.0,0
$ kscreen-doctor output.eDP-1.position.1920,0
```

O primeiro coloca o HDMI na origem; o segundo joga a tela interna para a direita dele (`1920` é a largura do HDMI). Definir posições absolutas elimina qualquer ambiguidade de "em relação a quê".

:::atencao
Coordenadas `x,y` usam o canto superior esquerdo e crescem para a direita (`x`) e para baixo (`y`). Um `position` com `y` negativo coloca o monitor **acima** da origem — útil para empilhar telas, mas fácil de errar. Quando o cursor some, rode `kscreen-doctor -o` e confira se alguma tela ficou com coordenada negativa inesperada.
:::

## Resumo

- Espelhar = mesma imagem nas duas telas (mesma `Geometry`); estender = áreas somadas lado a lado.
- `output.<id>.primary` define o monitor principal; `priority` maior indica primário no `-o`.
- `xrandr --right-of` / `--left-of` / `--above` posicionam por relação, sem calcular pixel.
- `--rotate right|left|inverted|normal` gira o monitor; a resolução inverte no relatório.
- `output.<id>.position.x,y` define posição absoluta e desembaralha geometrias erradas.

## Exercícios

1. Com o monitor conectado, rode `kscreen-doctor -o` e identifique se o estado atual é espelhado ou estendido pela `Geometry`.
2. Torne o HDMI o primário e o posicione à direita do painel interno num único `xrandr`, usando `--primary` e `--right-of`.
3. Gire o monitor externo para `right` e confirme no `xrandr --query` que a resolução reportada inverteu para `1080x1920`.
4. Reproduza um "embaralhamento": desconecte e reconecte o dock várias vezes e observe se a posição muda. Corrija com `kscreen-doctor output.<id>.position`.
5. **Desafio.** Monte um setup de três telas (interna + HDMI + DP) e defina por posição absoluta a ordem desejada. Depois confira a coerência somando as larguras no `xrandr --query` (o `current` do `Screen 0` precisa bater com a soma).
