Em outubro de 2023, a Lenovo entrou na briga com o Legion Go — o handheld mais marcado pelo "e se". Com uma tela de 8,8 polegadas e 144 Hz, controles destacáveis estilo Switch e a mesma APU Z1 Extreme do ROG Ally, ele apostou tudo na versatilidade. O resultado é o maior, mais pesado e mais ambicioso dos concorrentes diretos do Deck, com pontos fortes únicos e compromissos inevitáveis. Esta seção examina a proposta.

:::objetivos
- Entender a aposta do Legion Go em tela grande e formato híbrido
- Avaliar os controles destacáveis e o modo FPS (mouse vertical)
- Comparar o Legion Go com o ROG Ally, que usa a mesma APU
- Identificar os pontos fracos do Legion Go e como a Lenovo os aborda
:::

## A tela: 8,8 polegadas e 144 Hz

O Legion Go tem a maior e mais rápida tela da categoria. É um painel IPS de 8,8 polegadas, 2560×1600 (16:10), 144 Hz e 500 nits. Para efeito de comparação, o Steam Deck OLED tem 7,4 polegadas e 90 Hz; o Ally, 7 polegadas e 120 Hz.

As vantagens são óbvias: mais área útil para jogos com texto pequeno (como RPGs e estratégia), decisões de UI menos congestionadas e uma experiência de consumo de mídia muito superior — assistir a um filme no Go é genuinamente agradável, o que não se pode dizer dos displays de 7 polegadas.

O custo também é óbvio. A resolução nativa de 2560×1600 é *inatingível* para a Z1 Extreme na maioria dos jogos 3D. Na prática, o Go joga em 800p ou 1200p com upscaling para a tela — e o painel grande consome bateria de forma proporcional.

```terminal
$ # Resoluções típicas de jogo no Legion Go
$ echo "Nativo ......... 2560x1600 (só jogos 2D / indies)"
$ echo "1200p ......... 1920x1200 (meio-termo, com FSR)"
$ echo "800p .......... 1280x800  (3D pesado, upscaled)"
Nativo ......... 2560x1600 (só jogos 2D / indies)
1200p ......... 1920x1200 (meio-termo, com FSR)
800p .......... 1280x800  (3D pesado, upscaled)
```

O painel de 144 Hz é um luxo que poucos jogos aproveitam — títulos leves esportivos (*Rocket League*, *Counter-Strike*) alcançam essas taxas, mas AAA fica em 40–60 FPS. Ainda assim, os 144 Hz dão margem de fluidez para jogos competitivos e emulação.

## Controles destacáveis e o modo FPS

A marca registrada do Legion Go são os **controles destacáveis**, no estilo do Nintendo Switch. Cada lado desliza para fora dos trilhos, transformando o corpo principal em um tablet de 8,8 polegadas. Mas a Lenovo foi além do Switch com uma ideia própria: o **modo FPS**.

O controle direito tem um sensor óptico na base. Ao destacá-lo e encaixá-lo num suporte magnético em forma de puck, ele vira um mouse vertical — o jogador o desliza sobre a mesa como um mouse de verdade, enquanto o esquerdo (ou teclado) cuida do movimento. É uma solução engenhosa para shooters competitivos num formato que historicamente odeia mouse.

```terminal
$ # Fluxo de uso do modo FPS
$ echo "1. Destacar o controle direito"
$ echo "2. Encaixar no puck magnético"
$ echo "3. O sensor óptico vira mouse"
$ echo "4. Mapear botões para WASD no controle esquerdo"
1. Destacar o controle direito
2. Encaixar no puck magnético
3. O sensor óptico vira mouse
4. Mapear botões para WASD no controle esquerdo
```

A execução é criativa, mas tem atritos: os controles destacados ficam sem bateria própria (carregam pelo trilho), o suporte magnético é pequeno para mãos grandes, e alternar entre modos exige reconfiguração mental a cada troca. É uma daquelas features que impressiona em demo e subutilizada no dia a dia.

## Windows sob a marca Legion Space

Como o Ally, o Legion Go roda Windows 11, com o launcher próprio **Legion Space** fazendo o papel de interface. O Legion Space nasceu claramente imaturo — reviews de lançamento apontaram bugs, falta de atualização de TDP em tempo real e biblioteca confusa.

A Lenovo respondeu com atualizações frequentes, e em 2025 o Legion Space está consideravelmente mais estável, oferecendo perfis de TDP (Quiet/Balanced/Performance/Custom), overlay de métricas e gestão de biblioteca. Mas continua sendo um patch sobre o Windows, não uma experiência de console — a mesma ressalva do Ally na [seção 3](#/cap-107/sec-03).

```terminal
$ # Perfis de TDP no Legion Space
$ echo "Quiet ......... 8W"
$ echo "Balanced ...... 15W"
$ echo "Performance ... 20W"
$ echo "Custom ........ 5-30W"
Quiet ......... 8W
Balanced ...... 15W
Performance ... 20W
Custom ........ 5-30W
```

## Peso e ergonomia

O Legion Go é o grandão da categoria: 854 g com os controles, contra 640 g do Deck OLED e 678 g do Ally X. São mais de 200 g de diferença para o Deck — uma quantidade que se sente nitidamente após 30–40 minutos de jogo.

Para compensar, a Lenovo incluiu um **kickstand traseiro** (suporte retrátil) que permite apoiar o tablet na mesa e usar os controles destacados — o "modo tabletop" do Switch, em formato maior. É aí que o Go brilha: como um mini-PC com controles sem fio. Mas no colo, como um handheld convencional, o peso é o seu maior inimigo.

:::nota
O peso extra não é gratuito: vem da tela de 8,8", da bateria de 49,2 Wh e do sistema de trilhos e kickstand. Cada grama é uma decisão de design. Para quem prioriza portabilidade real, o Go pune; para quem vê o aparelho como híbrido de tablet/PC/handheld, o peso se justifica.
:::

## Legion Go contra o ROG Ally

Os dois usam a mesma APU Z1 Extreme e rodam Windows, então a comparação é quase de "fôrma" em torno do mesmo motor:

| Aspecto | ROG Ally (X) | Legion Go |
|---|---|---|
| APU | Z1 Extreme | Z1 Extreme |
| Tela | 7" 1080p 120 Hz | 8,8" 1600p 144 Hz |
| Bateria | 40 Wh / 80 Wh (X) | 49,2 Wh |
| RAM | 16 / 24 GB | 16 GB |
| Controles | fixos | destacáveis + modo FPS |
| Peso | 608 / 678 g | 854 g |
| MSRP | US$ 699 / 799 | US$ 699 |

O Legion Go entrega mais tela, mais versatilidade e o modo FPS pelo mesmo preço do Ally original — mas pesa bem mais, tem bateria intermediária e a RAM de 16 GB (contra os 24 GB do Ally X). A escolha depende do que se valoriza: o Go é o deck do "e se", o Ally X é o refinamento.

## Resumo

O Legion Go aposta na versatilidade: tela de 8,8 polegadas a 1600p/144 Hz, controles destacáveis no estilo Switch e um modo FPS único que transforma o controle em mouse. Com a mesma Z1 Extreme do Ally, entrega desempenho equivalente, mas paga o preço em peso (854 g) e numa resolução nativa que a APU não sustenta — forçando a jogar em 800p/1200p com upscaling. É o handheld mais "híbrido", ideal para quem quer um mini-PC/tablet portátil, não para quem prioriza portabilidade pura.

## Exercícios

1. Explique o trade-off entre a tela grande do Legion Go e a duração de bateria. Por que um painel 1600p consome mais que um 800p, mesmo exibindo a mesma imagem upscaled?
2. Descreva o modo FPS e proponha um cenário de jogo em que ele seja genuinamente melhor que um trackpad ou um controle convencional.
3. Compare o Legion Go com o Ally X em uma tabela de quatro linhas: tela, bateria, RAM e peso. Qual você escolheria para jogar *Baldur's Gate 3* (texto pesado, sessões longas)? Justifique.
4. O Legion Go tem 854 g. Pesquise o peso de um Nintendo Switch OLED e de um smartphone comum. O que a comparação diz sobre a categoria de handhelds PC?
5. **Desafio.** Pesquise o que é *FSR* (FidelityFX Super Resolution) e explique como ele permite jogar em 800p e exibir em 1600p com qualidade razoável. Por que isso é essencial para o Legion Go?