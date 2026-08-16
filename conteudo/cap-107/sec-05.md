Além dos três grandes — Steam Deck, ROG Ally e Legion Go —, existe um ecossistema vibrante de concorrentes menores. O MSI Claw é a aposta ousada da Intel no formato, enquanto Ayaneo, GPD e OneXPlayer formam a "cena de nicho" que existia antes do Deck e continua produzindo dispositivos intrigantes. Esta seção mapeia esse segundo escalão, avaliando o que cada um traz de único e por que raramente ameaçam os líderes.

:::objetivos
- Avaliar a aposta do MSI Claw na APU Intel Meteor Lake
- Conhecer a variedade de formatos da Ayaneo, GPD e OneXPlayer
- Entender por que o nicho premium raramente compete em preço ou suporte
- Identificar quando vale a pena considerar essas alternativas
:::

## MSI Claw: a Intel entra na briga

Em março de 2024, a MSI lançou o Claw, o primeiro handheld PC baseado em silício Intel — o Core Ultra 7 155H, da arquitetura Meteor Lake. A aposta é significativa porque a Intel não tinha presença relevante em GPUs integradas competitivas para jogos; o Claw foi o teste de fogo da Arc Graphics integrada.

```terminal
$ # Especificações do MSI Claw (modelo A1M)
$ echo "CPU: Intel Core Ultra 7 155H (6P+8E+2LPE, 16c/22t)"
$ echo "GPU: Arc Graphics 8 Xe-cores"
$ echo "Tela: 7" 1080p 120 Hz"
$ echo "Bateria: 53 Wh  |  RAM: 16 GB  |  MSRP: US$ 699"
CPU: Intel Core Ultra 7 155H (6P+8E+2LPE, 16c/22t)
GPU: Arc Graphics 8 Xe-cores
Tela: 7" 1080p 120 Hz
Bateria: 53 Wh  |  RAM: 16 GB  |  MSRP: US$ 699
```

O resultado foi morno no lançamento. A Arc Graphics integrada sofria de problemas de driver em jogos — especialmente títulos DirectX 9/11, que o Proton da Valve já resolveu na AMD, mas que no Windows/Intel continuavam problemáticos. Em desempenho puro, o Claw ficava abaixo do Z1 Extreme a TDPs altos, embora a CPU de 16 núcleos se saísse bem em tarefas de produtividade.

A MSI respondeu em 2025 com o Claw 8 AI+, já na arquitetura Lunar Lake (Core Ultra 7 258V), que trouxe a tão esperada melhoria de drivers e eficiência. Ainda assim, o Claw permanece uma proposta de nicho — para quem quer Intel especificamente ou encontra o modelo em promoção.

:::nota
A lição do Claw reforça a tese da [seção 1](#/cap-107/sec-01): drivers maduros valem mais que silício novo. A AMD tem anos de otimização em GPUs integradas para jogos via Linux/Proton e Windows; a Intel Arc integrada está anos atrás nesse quesito específico, independentemente do quão bom o hardware pareça no papel.
:::

## Ayaneo: a fábrica de formatos

A Ayaneo é a empresa que mais lança handhelds no mundo — por vezes três ou quatro modelos por ano, cada um explorando um formato diferente. Antes do Deck, ela era a referência do nicho; depois, reposicionou-se como a opção "premium e variada".

| Modelo | Formato | Destaque |
|---|---|---|
| Ayaneo 2S | Clássico | APU 7840U, tela 1200p, acabamento premium |
| Ayaneo Kun | Grande | Tela 8,4", touchpads, bateria 75 Wh |
| Ayaneo Flip DS | Dobrável | Duas telas estilo Nintendo DS/3DS |
| Ayaneo Slide | Deslizante | Teclado físico deslizante |
| Ayaneo Air | Compacto | OLED, tamanho reduzido |

A variedade é impressionante e genuinamente útil para quem procura um formato específico que os grandes não oferecem. O Flip DS, por exemplo, é o único handheld x86 com duas telas — um sonho para emulação de DS/3DS e para multitarefa.

O problema é o preço. Os modelos premium da Ayaneo custam de US$ 800 a US$ 1500, frequentemente com envio direto da China (crowdfunding via Indiegogo), garantia difícil de acionar e suporte de software limitado. A qualidade de construção é alta, mas o pós-venda é o calcanhar-de-aquiles da marca.

```terminal
$ # Preços típicos da Ayaneo (2024-2025, MSRP)
$ echo "Ayaneo 2S ........ ~US$ 1000"
$ echo "Ayaneo Kun ....... ~US$ 1200"
$ echo "Ayaneo Flip DS ... ~US$ 900-1300"
$ echo "Steam Deck OLED .. ~US$ 549 (referência)"
Ayaneo 2S ........ ~US$ 1000
Ayaneo Kun ....... ~US$ 1200
Ayaneo Flip DS ... ~US$ 900-1300
Steam Deck OLED .. ~US$ 549 (referência)
```

## GPD Win: a veterana do teclado

A GPD foi pioneira nos handhelds x86 e mantém uma identidade própria: **teclado físico embutido**. O GPD Win 4 (2023) parece um PSP com teclado deslizante; o GPD Win Mini (2024) é um clamshell compacto.

Essa escolha atende a um público específico — quem quer um *UMPC* (ultra-mobile PC) de verdade, com a capacidade de digitar comandos, configurar servidores ou mexer em código sem carregar teclado externo. Os modelos GPD rodam Windows (ou Linux, com suporte comunitário) e têm screens de 1080p com APUs AMD Ryzen 7840U/8840U.

```terminal
$ # GPD Win Mini (2024) em resumo
$ echo "APU: Ryzen 7 8840U (Zen 4, RDNA 3)"
$ echo "Tela: 7" 1080p 120 Hz, clamshell"
$ echo "Teclado: físico integrado"
$ echo "Bateria: 44 Wh | MSRP: ~US$ 900"
APU: Ryzen 7 8840U (Zen 4, RDNA 3)
Tela: 7" 1080p 120 Hz, clamshell
Teclado: físico integrado
Bateria: 44 Wh | MSRP: ~US$ 900
```

Como a Ayaneo, a GPD sofre com preço alto e pós-venda limitado no Ocidente. Mas para o nicho de "PC de bolso com teclado", não há substituto direto nos grandes fabricantes.

## OneXPlayer e o resto

A OneXPlayer (One-Netbook) ocupa um espaço similar ao da Ayaneo — dispositivos premium com telas grandes e APUs potentes, como o OneXFly e o OneXPlayer 2 Pro. A OneXPlayer também fez um movimento interessante: o **OneXPlayer X1**, um híbrido tablet/handheld com controles destacáveis e tela de 11 polegadas, cruzando a linha entre handheld e tablet PC.

Há ainda a Valve, claro, e outros experimentos pontuais de fabricantes de celular e console. Mas o padrão se repete: fora dos três grandes, o que existe é variedade e potência a preço premium, com suporte inconsistente.

## Quando considerar o segundo escalão

A regra prática para decidir se compensa fugir dos líderes:

- **Formato específico.** Duas telas (Flip DS), teclado clamshell (GPD Win Mini), tela gigante (Kun) — se nenhum grande oferece o que você precisa, o nicho é a única opção.
- **Orçamento alto e tolerância a risco.** Se US$ 1500 não assusta e você aceita esperar por crowdfunding e lidar com garantia difícil.
- **Curiosidade técnica.** Para colecionadores e entusiastas, a variedade é um fim em si mesma.

Fora isso, os três grandes — Deck, Ally e Legion Go — oferecem mais valor, melhor suporte e ecossistema mais maduro pelo dinheiro. O segundo escalão é fascinante, mas raramente é a escolha racional para o usuário comum.

## Resumo

O MSI Claw é a aposta da Intel na categoria, com a APU Core Ultra 7 e Arc Graphics — tecnicamente ousada, mas limitada por drivers imaturos no lançamento, corrigidos parcialmente no Claw 8 AI+ (Lunar Lake). Ayaneo, GPD e OneXPlayer formam o nicho premium que existia antes do Deck: impressionante variedade de formatos (duas telas, clamshell, teclado deslizante) a preços de US$ 800 a US$ 1500, com pós-venda limitado. O segundo escalão vale para quem busca formato específico ou tem orçamento alto e tolerância a risco — não como alternativa racional aos líderes.

## Exercícios

1. Explique por que o MSI Claw, apesar do hardware tecnicamente competitivo, teve recepção morna no lançamento. Relacione com drivers e a tese da [seção 1](#/cap-107/sec-01).
2. Liste três formatos de handheld que os grandes fabricantes *não* oferecem e que só existem no nicho premium. Qual deles você acharia mais útil e por quê?
3. Pesquise o preço de um Ayaneo Flip DS e de um Steam Deck OLED 512 GB. Construa um argumento de custo-benefício defendendo cada um para públicos diferentes.
4. Qual é o calcanhar-de-aquiles comum a Ayaneo, GPD e OneXPlayer? Explique como isso afeta a decisão de compra de um usuário no Brasil.
5. **Desafio.** O Claw 8 AI+ usa a arquitetura Lunar Lake, com cores E (eficiência) e P (performance) heterogêneos. Pesquise como essa arquitetura difere do design homogêneo do Z1 Extreme e o que isso significa para jogos.