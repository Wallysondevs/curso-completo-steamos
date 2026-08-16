Jogos de estratégia, simuladores de voo, RPGs isométricos — todo o gênero que foi feito para mouse tem o mesmo problema num portátil: a tela é pequena e a ponta do dedo cobre 40 pixels. A solução no SteamInput se chama **mouse region**: o touchpad inteiro é mapeado diretamente para uma região da tela, em escala 1:1. Você toca no canto superior esquerdo do pad e o cursor vai para o canto superior esquerdo do minimapa.

:::objetivos
- Configurar uma mouse region no touchpad esquerdo ou direito
- Mapear o pad para áreas específicas como minimapa, inventário e barra de habilidades
- Criar múltiplas regiões com modos de disparo distintos
- Entender a relação entre resolução da tela, posição absoluta e sensibilidade
- Reconhecer jogos que mais se beneficiam de mouse region
:::

## Mouse absoluto vs. mouse relativo

Um mouse normal é **relativo**: você move 2 cm para direita, o cursor anda 300 pixels, não importa onde ele estava. Uma mouse region é **absoluta**: a posição do seu dedo no touchpad corresponde a uma posição fixa na tela. A analogia mais próxima é uma mesa digitalizadora Wacom: o canto superior esquerdo da mesa é sempre o canto superior esquerdo do monitor.

```text
Touchpad (resolução ~1500×1500 unidades)   Tela do Deck (1280×800 px)
┌──────────────────┐                       ┌──────────────────┐
│  x=0,y=0         │                       │  cursor aqui     │
│                   │         ──→           │                  │
│         x=max     │        mapeia         │          cursor  │
│         y=max     │        diretamente    │          aqui    │
└──────────────────┘                       └──────────────────┘
```

Isso resolve o problema de "arrastar cursor": em vez de empurrar o mouse 5 vezes para atravessar a tela, você pousa o dedo onde quer. Em combate tenso, é a diferença entre mirar e perder.

## Configurando uma mouse region para o minimapa

O caso de uso mais frequente é mapear o touchpad esquerdo para a região do minimapa, num MOBA ou RPG. Você quer clicar no minimapa para mover a câmera ou enviar um ping sem desviar o polegar direito dos botões de ação.

```text
Botão: Trackpad Esquerdo
  → Comportamento: Mouse Region
  → Região:         Superior esquerdo (0, 0) a (300, 300)
  → Clique ao tocar: Botão esquerdo do mouse
  → Feedback tátil: Leve (para sentir que "pisou" no mapa)
```

No editor, você define a região com coordenadas de tela em pixels: `X inicial`, `Y inicial`, `Largura` e `Altura`. Para o Deck, a tela é 1280×800, então um minimapa típico ocupa de 200×200 a 350×350 pixels no canto.

:::dica
Ative o **feedback tátil** (haptics) para mouse regions. Como o dedo cobre a área, você não vê o cursor — mas sente quando "entrou" em outra zona. O motor háptico do Deck pulsa de leve a cada borda de região.
:::

## Múltiplas regiões: uma para cada painel do jogo

O touchpad pode hospedar mais de uma mouse region, com divisões. Um layout avançado para estratégia em tempo real pode mapear:

```text
Trackpad direito dividido em três zonas:
  ┌──────────┬──────────┐
  │ Minimapa │  Tela    │
  │ (região  │ principal│
  │  150×150)│ (cursor  │
  │          │  normal) │
  ├──────────┴──────────┤
  │   Barra de comandos │
  │   (região inferior) │
  └─────────────────────┘
```

O segredo está em definir regiões que **não se sobreponham** e usar o modo de ativação correto — `click` (toque) ou `hover` (passar por cima). Para a tela principal o comportamento pode ser `Cursor Move` (relativo), enquanto o minimapa é `Mouse Region` (absoluto).

## O modo deslocamento (scroll)

Emparelhado com a mouse region, o **modo deslocamento** resolve o gesto que mais falta num controle: a roda do mouse. No SteamInput, você pode configurar o touchpad para virar uma "roda circular": deslizar o dedo em círculo na borda do pad faz scroll contínuo.

```text
Botão: Trackpad Esquerdo
  → Comportamento: Scroll Wheel (roda)
  → Tipo: Circular (borda externa)
  → Direção: Vertical
  → Sensibilidade: Média
```

O modo circular é o mais natural para o gesto do polegar: deslizar o dedo ao redor da borda do touchpad é mecanicamente confortável e não cansa. O Deck usa isso no modo Desktop por padrão — a borda direita do trackpad direito faz scroll vertical.

```terminal
$ cat /proc/bus/input/devices | grep -A 5 -i 'trackpad'
N: Name="Steam Deck TrackPad R"
H: Handlers=event11 
B: PROP=0
B: EV=10000b
B: KEY=70000 0 0 0 0
B: ABS=3
--
N: Name="Steam Deck TrackPad L"
H: Handlers=event12 
B: PROP=0
B: EV=10000b
B: KEY=70000 0 0 0 0
B: ABS=3
```

As flags `EV=10000b` e `ABS=3` confirmam: cada trackpad suporta eventos absolutos (`ABS`) — essenciais para mouse region — e relativos (`REL`) para scroll. O bit `EV` inclui `EV_REL` (0x02) e `EV_ABS` (0x03), por isso ambos os modos funcionam sem conflito.

Para ver a resolução real do touchpad e entender a escala do mapeamento:

```terminal
$ sudo evtest /dev/input/event11 2>&1 | grep -E 'Max|Min'
    Min      0
    Max  16384
    Min      0
    Max  16384
```

Com uma resolução de 16384×16384 unidades, cada pixel da tela do Deck (1280×800) corresponde a aproximadamente 12,8 unidades do touchpad. Por isso o mapeamento 1:1 parece "grudar" no lugar certo — a resolução do sensor é cerca de 13× maior que a da tela.

:::exemplo
Num jogo de construção como *Cities: Skylines* ou *Factorio*, mapeie: touchpad esquerdo = mouse region sobre o painel de construção, touchpad direito = scroll circular + clique para selecionar. O resultado é um portátil que joga quase como um desktop com mouse nos 60% mais usados da interface.
:::

## Resumo

- Mouse region mapeia o touchpad 1:1 para uma área da tela (absoluto), não para movimento relativo do cursor.
- É ideal para minimapas, inventários, barras de habilidade e painéis de construção.
- O feedback háptico ajuda a "sentir" onde o dedo está sem olhar.
- Múltiplas regiões não sobrepostas cabem no mesmo touchpad, cada uma com seu modo de ativação.
- O modo deslocamento circular usa a borda do touchpad como roda do mouse, com scroll contínuo.
- O trackpad do Deck expõe capacidades `ABS` e `REL` no `/proc/bus/input/devices`, o que habilita os dois modos.

## Exercícios

1. Configure o touchpad esquerdo como mouse region sobre o quadrante superior esquerdo da tela (0,0 a 400,400). Teste num jogo com minimapa e relate se o clique funciona onde você espera.
2. Ative o feedback háptico e compare a sensação com e sem ele. Descreva em uma frase qual a diferença prática.
3. Crie duas mouse regions não sobrepostas no touchpad direito: uma para o canto inferior esquerdo e outra para o canto inferior direito. Confirme que o dedo dispara comandos diferentes em cada zona.
4. Configure o touchpad esquerdo como scroll circular e teste num navegador ou leitor de documentos. Ajuste a sensibilidade até o scroll ficar confortável.
5. **Desafio.** Combine mouse region com uma camada: na camada base, o touchpad esquerdo é mouse region (minimapa); ao segurar `L4`, uma camada transforma o mesmo pad em scroll circular para zoom. Explique por que essa combinação economiza um botão dedicado para zoom.