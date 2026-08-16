Em junho de 2023, a Asus respondeu ao Steam Deck com o ROG Ally: um handheld Windows com a APU AMD Z1 Extreme, tela 1080p a 120 Hz e preço agressivo de US$ 699 (versão Z1 Extreme; a versão Z1 básica custava US$ 599). Foi a primeira tentativa séria de um grande fabricante de "vencer o Deck em performance", e sua trajetória — com a correção de rota do Ally X em 2024 — conta muito sobre os limites do formato. Esta seção cobre ambos.

:::objetivos
- Entender a aposta do ROG Ally em desempenho bruto e Windows
- Comparar as APUs Z1 Extreme e Z1 básica
- Analisar os problemas de bateria e ergonomia do primeiro Ally
- Avaliar as melhorias introduzidas pelo ROG Ally X
:::

## A APU Z1 Extreme e a promessa de performance

O coração do Ally é o AMD Ryzen Z1 Extreme, um chip derivado do Ryzen 7 7840U, com 8 núcleos Zen 4 e 12 CUs RDNA 3. Em comparação com o Aerith do Steam Deck (4 núcleos Zen 2, 8 CUs RDNA 2), é uma geração e meia à frente — e isso se traduz em números.

```terminal
$ # Especificações comparadas (dados de referência)
Z1 Extreme:  8c/16t Zen 4, 12 CU RDNA 3, até 8,6 TFLOPs
Aerith (Deck): 4c/8t Zen 2, 8 CU RDNA 2, até 1,6 TFLOPs
```

Na teoria, o Z1 Extreme tem mais que o dobro da potência gráfica. Na prática, a 30 W o Ally entrega 40–70% mais FPS que o Deck a 15 W em jogos exigentes. Mas essa vantagem tem um preço literal: para usar os 30 W é preciso ligar na tomada ou usar o "modo turbo" que drena a bateria em menos de uma hora.

O ponto crítico — retomado na [seção 1](#/cap-107/sec-01) — é que **a 10–15 W o Z1 Extreme não mostra a mesma superioridade.** A arquitetura Zen 4 + RDNA 3 foi projetada para notebooks a 28–54 W, e sua eficiência em TDP muito baixo é inferior. A 10 W, o Ally fica atrás do Deck em vários títulos, porque os 8 núcleos competem por um orçamento de energia insuficiente.

## A versão Z1 básica: um erro de posicionamento

A Asus lançou também uma versão mais barata com o Z1 (não-Extreme): 6 núcleos Zen 4 e apenas 4 CUs RDNA 3. A intenção era competir com o Deck LCD de US$ 399. O resultado foi o oposto.

Com só 4 CUs, o Z1 básico entrega performance gráfica *inferior* à do Steam Deck — e roda Windows, que consome mais recursos de sistema. Era um produto pior pelo mesmo preço, e a recepção foi dura. O Z1 básico foi descontinuado silenciosamente, e hoje o mercado trata o Ally como sinônimo do Z1 Extreme.

:::nota
A lição do Z1 básico é dupla: reduzir CUs (unidades de computação da GPU) até o ponto de perder para hardware mais antigo é fatal, e o Windows impõe um "pedágio" de overhead que um chip fraco não consegue pagar. A [seção 7](#/cap-107/sec-07) detalha esse overhead.
:::

## O problema da bateria

O pecado original do Ally é a bateria de 40 Wh — a mesma do Steam Deck LCD, mas alimentando um hardware muito mais sedento. O resultado é a pior autonomia da categoria nos modos de desempenho.

```terminal
$ # Autonomia aproximada (ROG Ally, brilho 200 nits)
$ echo "Elden Ring (15W) ...... ~1h20"
$ echo "Cyberpunk (Turbo 30W) . ~50min"
$ echo "Stardew (Silent 10W) .. ~2h45"
Elden Ring (15W) ...... ~1h20
Cyberpunk (Turbo 30W) . ~50min
Stardew (Silent 10W) .. ~2h45
```

Em modo turbo (30 W), a bateria de 40 Wh esvazia em menos de uma hora — autonomia que compromete o propósito de "portátil". Mesmo em modo equilibrado (15 W), o Ally fica visivelmente atrás do Steam Deck OLED (50 Wh) e do Deck LCD (40 Wh, mas hardware mais eficiente).

A consequência prática: o Ally é ótimo como "portátil de sofá perto da tomada", mas fraco como "portátil de viagem". A Asus reconheceu o erro com o Ally X.

## O ROG Ally X: a correção de rota

Em julho de 2024, a Asus lançou o Ally X. A APU é a *mesma* Z1 Extreme — não houve upgrade de chip —, mas o dispositivo foi reformulado nos pontos que importavam:

| Aspecto | ROG Ally | ROG Ally X |
|---|---|---|
| Bateria | 40 Wh | 80 Wh (dobro) |
| RAM | 16 GB LPDDR5 | 24 GB LPDDR5X-7500 |
| Armazenamento | 512 GB | 1 TB (M.2 2280) |
| Porta | 1× USB-C (com a XG Mobile proprietária) | 2× USB4 (padrão) |
| Peso | 608 g | 678 g |

O dobro de bateria (80 Wh) ataca diretamente o principal defeito, e a RAM extra (24 GB) dá folga tanto para o sistema quanto para a VRAM compartilhada. A troca da porta proprietária XG Mobile por USB4 padrão corrigiu outra crítica — o conector da Asus era caro e raramente usado.

```terminal
$ # Autonomia aproximada (ROG Ally X)
$ echo "Elden Ring (17W) ..... ~2h30"
$ echo "Stardew (10W) ........ ~5h30"
Elden Ring (17W) ..... ~2h30
Stardew (10W) ........ ~5h30
```

O Ally X praticamente dobra a autonomia do Ally original em jogo AAA, colocando-o no mesmo patamar do Steam Deck OLED — embora a um preço maior (US$ 799 MSRP).

## Windows e Armoury Crate

O Ally roda Windows 11, e a Asus tenta cobrir os buracos da experiência com o **Armoury Crate SE**, um launcher com interface própria para controle. Ele oferece três perfis de TDP (Silent/10 W, Performance/15 W, Turbo/30 W), tela de jogo com métricas e gestão de biblioteca.

Funciona razoavelmente, mas não resolve os problemas estruturais do Windows num portátil: a suspensão/resumo não é confiável, o teclado virtual é irritante, atualizações do sistema interrompem o gameplay e mais da metade da biblioteca exige navegação com o mouse ou toque na tela. A [seção 7](#/cap-107/sec-07) aprofunda essa comparação.

Para quem quer o SteamOS, o Ally não é a resposta — mas o Ally X ganhou apoio de projetos como o **Bazzite**, uma distribuição Linux imutável com interface idêntica ao SteamOS que roda nos handhelds Windows (abordada na [seção 7](#/cap-107/sec-07)).

## Resumo

O ROG Ally apostou em desempenho bruto com a APU Z1 Extreme e tela 1080p/120 Hz, vencendo o Deck em FPS máximo, mas pagando o preço em bateria (40 Wh) e na experiência crua do Windows. A versão Z1 básica foi um erro de posicionamento, mais fraca que o Deck pelo mesmo preço. O Ally X de 2024 corrige o essencial — dobrando a bateria para 80 Wh, subindo para 24 GB de RAM e 1 TB — sem trocar a APU, reposicionando o produto como a opção "Deck potente" a US$ 799.

## Exercícios

1. Compare as APUs: quantos núcleos de CPU e quantas CUs de GPU têm o Aerith, o Z1 Extreme e o Z1 básico? Interprete por que o Z1 básico perde até para o Deck.
2. Explique por que a vantagem de 40–70% do Z1 Extreme a 30 W não se sustenta a 10–15 W. Relacione com o conceito de "frames por watt" da [seção 1](#/cap-107/sec-01).
3. Calcule a autonomia teórica: bateria de 40 Wh, consumo de 30 W no modo turbo. Qual a autonomia máxima? Compare com os ~50 min reais e explique a diferença (perdas, outros consumidores).
4. Liste três problemas da experiência Windows num handheld que o Armoury Crate SE *não* consegue resolver.
5. **Desafio.** O Ally X usa USB4 padrão no lugar da XG Mobile proprietária. Pesquise o que era a XG Mobile e por que padrões abertos tendem a vencer no longo prazo em acessórios.