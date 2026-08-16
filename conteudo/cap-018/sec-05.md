Numa tela de 7 polegadas, o tamanho de fonte é a diferença entre ler a descrição de um jogo e apertar os olhos para adivinhá-la. O SteamOS expõe duas alavancas relacionadas mas distintas: o **fator de escala da interface** (que reescala a UI inteira, incluindo ícones e botões) e o **tamanho de texto** (que age especificamente sobre a tipografia). Saber qual alavanca puxar — e onde cada uma mora no sistema — evita telas cortadas e textos que estouram o layout.

:::objetivos
- Distinguir escala de interface de tamanho de fonte
- Ajustar a escala da UI no Modo Jogo e confirmar em `config.vdf`
- Configurar o fator de escala de texto no desktop via `gsettings`
- Identificar o DPI físico do painel e seu impacto na legibilidade
- Diagnosticar layouts quebrados por escala excessiva
:::

## Escala de interface versus tamanho de fonte

A **escala de interface** multiplica todas as dimensões da UI: botões ficam maiores, grades da biblioteca ficam mais espaçadas, capas de jogo crescem. O **tamanho de fonte** muda apenas o texto. A diferença prática: aumentar a fonte sem aumentar a escala faz o texto crescer dentro de botões que continuam do mesmo tamanho — e isso pode cortar palavras longas.

No Modo Jogo, a alavanca principal é `SteamUIScale`, que controla a escala inteira. Ela aceita valores como `1.0` (100%), `1.25` (125%), `1.5` (150%):

```terminal
$ grep "SteamUIScale\|TextScale\|FontScale" ~/.local/share/Steam/config/config.vdf
"SteamUIScale"		"1.25"
```

Valor `1.25` significa que a interface está 25% maior que o padrão. Em versões mais recentes do SteamOS, potências de escala intermediárias são expostas no menu como porcentagens — "125%", "150%" — e o ajuste é aplicado ao vivo, sem reiniciar.

## Ajustando a fonte no desktop com gsettings

O desktop GNOME/SteamOS (na Área de Trabalho via KDE, ou em componentes que usam GTK) controla o fator de escala de texto por um valor diferente: a chave `text-scaling-factor`. Você pode lê-la e alterá-la pelo terminal:

```terminal
$ gsettings get org.gnome.desktop.interface text-scaling-factor
1.0
$ gsettings set org.gnome.desktop.interface text-scaling-factor 1.3
$ gsettings get org.gnome.desktop.interface text-scaling-factor
1.3
```

O `1.3` multiplica o tamanho de todas as fontes GTK por 1,3 (130%). O efeito é imediato nas aplicações que respeitam o tema GTK. Valores entre 1,2 e 1,5 são os mais confortáveis na prática sem quebrar o layout da maioria dos programas.

:::atencao
O `gsettings` do GNOME afeta aplicações **GTK**, não o ambiente KDE inteiro nem o Modo Jogo. O KDE Plasma usa seu próprio mecanismo em Configurações do Sistema → Aparência → Fontes. Como o SteamOS mistura componentes GTK e Qt, uma única alteração raramente cobre tudo — ajuste nos dois lugares para consistência.
:::

## O DPI físico do painel

Por trás da escala existe um valor físico: o **DPI** (pontos por polegada) do display. O painel do Steam Deck tem 1280×800 em 7 polegadas, o que dá por volta de 215 DPI — densidade alta para o tamanho, o que já exige alguma escala para leitura confortável em distância de console.

Você pode consultar o DPI que o sistema está usando para o X11 (na Área de Trabalho, não no Modo Jogo) com o `xdpyinfo`:

```terminal
$ xdpyinfo | grep -E "dimensions|resolution"
  dimensions:    1280x800 pixels (338x211 millimeters)
  resolution:    96x96 dots per inch
```

O `resolution: 96x96` é a densidade lógica padrão assumida pelo X11 — **não** o DPI real de 215. Essa divergência é exatamente o motivo de o texto aparecer pequeno demais: o sistema está desenhando como se o painel tivesse 96 DPI, quando ele na verdade tem o dobro disso. Ajustar a escala (no Modo Jogo) ou o `text-scaling-factor` (no desktop) compensa essa diferença.

## Escala demais quebra o layout

O perigo na direção oposta: aumentar demais. Com `SteamUIScale` em valores altos, elementos que não foram desenhados para o tamanho novo podem ser cortados da tela — um botão de "Confirmar" que escapa pela borda, uma descrição que vira "…" no meio.

O comportamento do gamescope diante de escala é relevante aqui, porque é ele quem dimensiona a superfície de desenho. Para conferir o modo de saída e se a superfície está correta, o log registra a resolução de composição:

```terminal
$ journalctl -u gamescope --no-pager | grep -i "output\|resolution\|scale" | tail -6
gamescope[842]: drm: HDMI output 1280x800@60.00Hz
gamescope[842]: wlserver: output scale 1
```

O `output scale 1` indica que o gamescope está renderizando a superfície na escala 1:1 física. A escala de UI do Steam (`SteamUIScale`) é aplicada **acima** disso, no desenho dos widgets, e é por isso que valores altos podem estourar o layout mesmo com o compositor em 1:1.

:::dica
Se um texto estiver cortado após aumentar a escala, reduza um degrau (ex.: de 1,5 para 1,25) em vez de abandonar o ajuste. A maioria dos cortes de layout no SteamOS acontece justamente no degrau mais alto, e o degrau intermediário costuma ser o equilíbrio ideal entre legibilidade e integridade.
:::

## Resumo

- Escala de interface (UI) e tamanho de fonte são alavancas diferentes; a primeira muda tudo, a segunda muda só o texto.
- `SteamUIScale` em `config.vdf` controla a escala do Modo Jogo (1.0, 1.25, 1.5).
- No desktop, `gsettings set org.gnome.desktop.interface text-scaling-factor 1.3` escala o texto GTK.
- O painel tem ~215 DPI reais, mas o sistema assume 96 DPI lógicos — daí a necessidade de escala.
- Escala excessiva corta elementos do layout; reduzir um degrau resolve sem abandonar o ajuste.

## Exercícios

1. Leia `grep "SteamUIScale" ~/.local/share/Steam/config/config.vdf` e anote o valor atual. Ele corresponde ao que você vê no menu de Configurações?
2. No desktop, execute `gsettings get org.gnome.desktop.interface text-scaling-factor`, depois altere para 1.3 e observe a diferença numa aplicação GTK.
3. Rode `xdpyinfo | grep resolution` e explique por que "96x96 dots per inch" não reflete o DPI físico do painel do Steam Deck.
4. Aumente a escala do Modo Jogo para o máximo, navegue pela biblioteca e encontre pelo menos um elemento cortado ou ilegível. Depois reduza para o degrau intermediário.
5. **Desafio.** Combine escala de interface e tamanho de fonte (desktop e Modo Jogo) para chegar à configuração mais legível *sem* quebrar layouts em duas aplicações distintas (uma GTK e uma Qt). Documente os valores finais e justifique cada escolha.