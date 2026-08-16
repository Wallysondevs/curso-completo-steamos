Num rato e teclado com monitores de densidades diferentes, o texto ora fica minúsculo ora gigante. Esse é o problema do **scaling** (escala) por monitor: o sistema precisa desenhar uma janela a um tamanho que faça sentido em cada painel, mesmo que um tenha 1280 pixels e o outro 3840. No SteamOS, o KScreen gerencia a escala de cada saída de forma independente — e é isso que permite um deck "pequeno e nítido" ao lado de um 4K "grande e legível".

Dominar o scaling é o que separa um setup onde você dá zoom em tudo manualmente de um onde a interface se ajusta sozinha a cada conexão.

:::objetivos
- Entender o que é escala e como ela difere de resolução
- Ler e definir a escala de cada monitor com `kscreen-doctor`
- Calcular a escala adequada a partir da densidade de pixels (DPI)
- Aplicar scaling com `xrandr --scale` quando o KScreen não basta
- Diagnosticar janelas borradas causadas por scale fracionário
:::

## Resolução não é tamanho físico

Um monitor 4K de 27 polegadas e um 1080p de 24 têm a mesma "área de trabalho" útil? Não. O 4K espreme 3840 pixels na mesma largura física, então tudo fica menor. A grandeza que captura isso é a **densidade de pixels** (DPI ou PPI). Quanto maior o DPI, mais o sistema precisa "ampliar" os elementos para manter o tamanho legível.

A escala é esse fator de ampliação. Com `Scale: 2` num monitor 4K, uma janela de 400×300 *lógicos* é desenhada a 800×600 físicos. A resolução continua 3840×2160; o que muda é a relação entre o tamanho do elemento na tela e o pixel.

O `kscreen-doctor -o` expõe isso linha a linha:

```terminal
$ kscreen-doctor -o
Output: 1 eDP-1
	Geometry: 0,0 1280x800
	Scale: 1
Output: 2 HDMI-A-1
	Geometry: 1280,0 3840x2160
	Scale: 2
```

A tela interna em `Scale: 1` e o 4K externo em `Scale: 2` é o setup típico: o portátil mantém escala nativa, o monitor grande dobra o tamanho dos elementos para equivaler a uma área lógica de 1920×1080.

## Ajustando a escala por monitor

O subcomando `scale` aceita valores inteiro e fracionário:

```terminal
$ kscreen-doctor output.HDMI-A-1.scale.1.5
$ kscreen-doctor -o
Output: 2 HDMI-A-1
	Geometry: 1280,0 3840x2160
	Scale: 1.5
```

Aqui `1.5` (não `1,5` — ponto decimal, não vírgula) faz o 4K renderizar como se tivesse uma área útil de 2560×1440 lógicos. É a escala que muitos consideram o "ponto ideal" para 4K em 27", equilibrando espaço e legibilidade.

Para voltar ao padrão, basta `scale.1`.

:::nota
A função `globalScale` do Plasma escala **todos** os monitores de uma vez, mas o KScreen permite `scale` individual por saída. É essa granularidade que falta em muitos sistemas e que no deck simplesmente funciona, graças à separação por-output do KScreen.
:::

## Escala fracionária e o fantasma do blur

Escalas como `1.25` ou `1.5` são "fracionárias" e, no SteamOS 3.6 sob Wayland, funcionam bem na maioria dos apps. Mas nem todo aplicativo XWayland (a ponte para apps X11 legados) respeita o fator, resultando em fonte borrada ou janela com bordas serrilhadas.

O `xrandr` oferece uma abordagem alternativa para o mesmo resultado, escalando o framebuffer em vez do desenho:

```terminal
$ xrandr --output HDMI-A-1 --scale 1.25x1.25
$ xrandr --query | grep HDMI
HDMI-A-1 connected 3072x1728+1280+0 (normal left inverted right x axis y axis)
```

Note que o `xrandr --scale` altera a resolução **lógica** reportada: 3840/1.25 = 3072. É uma abordagem mais grosseira (escala todo o framebuffer, com custo de nitidez no texto), por isso prefere-se o `kscreen-doctor output.<id>.scale` quando possível.

:::atencao
`xrandr --scale` em valor fracionário produz texto ligeiramente borrado, porque interpola pixels. Se a nitidez do texto é prioridade (terminal, editor), use escala **inteira** (`2x`) ou o `kscreen-doctor scale` nativo do Wayland, que escala em nível de aplicativo com muito melhor resultado tipográfico.
:::

## Escolhendo a escala certa com base no DPI

A regra prática: divida a densidade real pela densidade de referência (aprox. 96 DPI, o "1x" histórico). Um 4K de 27" tem ~163 PPI, o que dá 163/96 ≈ 1,7 — por isso `1.5` ou `2` são os valores naturais. Um 1440p de 27" tem ~109 PPI, então `1.0` ou `1.25` bastam.

Você não precisa calcular tudo na mão; o KScreen aplica uma heurística automática na primeira conexão. O problema é quando a heurística erra — e aí o comando resolve:

```terminal
$ kscreen-doctor output.HDMI-A-1.scale.2
$ kscreen-doctor output.eDP-1.scale.1
```

:::dica
Se os elementos no monitor externo ficarem grandes demais ou pequenos demais depois de um ajuste, ajuste em passos de `0.25` (`1.25`, `1.5`, `1.75`) e observe o texto do terminal. A escala certa é aquela em que um bloco de código de 80 colunas preenche a tela sem sobrar nem faltar.
:::

## Resumo

- Escala é o fator de ampliação dos elementos; resolução é o total de pixels — são coisas distintas.
- `Scale: 1` na tela interna e `Scale: 2` num 4K externo é o setup típico exibido no `-o`.
- `kscreen-doctor output.<id>.scale.<fator>` define a escala por monitor (ponto decimal, não vírgula).
- Escala fracionária pode borrar apps XWayland; apps Wayland nativos escalam com nitidez.
- `xrandr --scale NxN` escala em nível de framebuffer, mais grosseiro que o scale do KScreen.
- A escala ideal deriva do DPI: divida o PPI por ~96 para achar o fator próximo.

## Exercícios

1. Rode `kscreen-doctor -o` e registre o `Scale` atual de cada saída conectada.
2. Aplique `kscreen-doctor output.HDMI-A-1.scale.1.5` e observe o tamanho dos ícones e do texto; depois retorne a `1`.
3. Compare `xrandr --scale 1.25x1.25` com o `scale.1.25` do kscreen-doctor. Qual deixa o texto do terminal mais nítido?
4. Com o monitor 4K conectado, calcule o PPI (largura física em polegadas está na EDID, ou meça com régua) e proponha a escala teoricamente ideal.
5. **Desafio.** Integre com a seção de posicionamento: monte interno + externo, defina escala `2` no externo e reposicione ambos para que a transição do mouse entre as bordas seja contínua (sem "degrau" de altura).
