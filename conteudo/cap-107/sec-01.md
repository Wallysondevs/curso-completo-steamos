O ano de 2022 marcou um ponto de inflexão com o lançamento do Steam Deck: a Valve provou que um PC x86 completo cabe num portátil com ergonomia de console e preço competitivo. Dois anos depois, o mercado está povoado por pelo menos meia dúzia de concorrentes diretos, cada um atacando um recorte diferente — potência bruta, tela grande, versatilidade híbrida ou ecossistema Windows. Esta seção traça o mapa do território antes de mergulharmos nos comparativos detalhados.

:::objetivos
- Entender como o Steam Deck criou e redefiniu a categoria de handhelds PC
- Identificar os principais concorrentes e suas propostas de valor
- Conhecer os critérios que serão usados nas comparações ao longo do capítulo
- Contextualizar o papel do SteamOS como diferencial competitivo
:::

## De protótipos a categoria de mercado

Handhelds x86 não nasceram com o Steam Deck. A GPD Win já produzia portáteis com Windows desde 2016, e a Aya Neo lançou seu primeiro modelo em 2021. Eram produtos de nicho, caros (£800–£1200), com ergonomia questionável e suporte de software praticamente inexistente. A Valve mudou a equação em três frentes.

**Preço agressivo.** O Steam Deck LCD de 64 GB custava US$ 399 — menos da metade de um Aya Neo equivalente. A Valve subsidiava o hardware, contando com a receita da Steam Store para compensar. Nenhum concorrente tinha esse modelo de negócio.

**APU personalizada.** Em vez de usar um chip de notebook genérico, a Valve trabalhou com a AMD para criar o Aerith: 4 núcleos Zen 2, 8 unidades RDNA 2, arquitetura otimizada para 15 W. A combinação de CPU modesta com GPU generosa foi uma escolha consciente — em telas de 800p, o gargalo quase sempre é a GPU.

**SteamOS 3.** Um sistema operacional feito para o formato: interface com controles, suspensão/resumo estilo console, camada de compatibilidade Proton integrada. Nenhum concorrente tinha nada parecido em 2022.

O resultado: mais de 4 milhões de unidades vendidas até o final de 2024, segundo estimativas da Omdia. A categoria deixou de ser hobby para virar mercado.

## Quem são os concorrentes

Em 2025, o cenário competitivo se divide em três grupos:

| Grupo | Modelos | Proposta |
|---|---|---|
| Primeira onda (pós-Deck) | ROG Ally (2023), Legion Go (2023) | Mais potência, Windows, telas melhores |
| Segunda onda (revisões) | ROG Ally X (2024), Steam Deck OLED (2023) | Refinamento: bateria, tela, resfriamento |
| Nicho premium | Ayaneo (2S, Kun, Flip), GPD Win (4, Mini), OneXPlayer | Variedade de formatos, preço elevado |
| Intel | MSI Claw (2024) | APU Intel Meteor Lake, ousadia técnica |

O mercado explode de opções — e a escolha começa pela pergunta fundamental:

```terminal
$ # A pergunta que divide o mercado
$ echo "SteamOS (Steam Deck) -> experiência de console, Linux"
$ echo "Windows (Ally, Go, Claw) -> compatibilidade total, Game Pass"
SteamOS (Steam Deck) -> experiência de console, Linux
Windows (Ally, Go, Claw) -> compatibilidade total, Game Pass
```

Cada um deles será detalhado nas próximas seções. Por enquanto, o que importa é a divisão fundamental: **SteamOS vs Windows**. Essa escolha de sistema impacta desempenho em TDP baixo, suspensão/resumo, compatibilidade com anti-cheat e experiência de console — e é o fio condutor do capítulo.

## Os critérios de comparação

Ao longo das próximas oito seções, cada handheld será avaliado em seis dimensões:

1. **Hardware bruto.** CPU, GPU, RAM, armazenamento e tela — o que a folha de especificações diz.
2. **Desempenho real.** FPS em jogos representativos nos modos de 10 W, 15 W e 25 W, com atenção ao *frametime* (consistência frame a frame, medida em milissegundos).
3. **Bateria e eficiência.** Autonomia em diferentes TDPs, porque potência sem bateria não serve para portátil.
4. **Sistema operacional.** Experiência com SteamOS e com Windows, incluindo suspensão/resumo, interface com controle e manutenção.
5. **Ergonomia e construção.** Peso, empunhadura, calor, ruído de ventoinha, qualidade dos botões.
6. **Ecossistema e preço.** Custo de entrada, acessórios, dock, comunidade, peças de reposição.

Cada dimensão importa de forma diferente conforme o perfil de uso. O capítulo inteiro converge para a [seção 9](#/cap-107/sec-09), onde cruzamos critérios com cenários reais.

## O critério oculto: baixo TDP

Um handheld não é um desktop. A maioria dos benchmarks de review foca em 25 W ou 30 W — o modo turbo na tomada. Mas a experiência real de jogar no sofá ou no metrô acontece entre 8 W e 15 W, onde a eficiência energética domina o desempenho.

O Steam Deck foi projetado para essa faixa. O Aerith entrega ~80% do seu potencial máximo já a 10 W, enquanto chips como o Z1 Extreme precisam de 18-20 W para mostrar vantagem. Isso explica por que, em reviews "no papel", o Ally parece muito superior, mas em gameplay real a 15 W a diferença encolhe consideravelmente.

```terminal
$ # Exemplo: FPS relativo em Cyberpunk 2077 (720p, low)
$ # (normalizado: Deck LCD a 15W = 100%)
$ echo "Deck LCD (Aerith) .. 15W: 100%  |  10W: ~85%"
$ echo "ROG Ally (Z1E) ..... 15W: 130%  |  10W: ~95%"
$ echo "Ally Turbo 30W ..... 30W: 175%  |  (na tomada)"
Deck LCD (Aerith) .. 15W: 100%  |  10W: ~85%
ROG Ally (Z1E) ..... 15W: 130%  |  10W: ~95%
Ally Turbo 30W ..... 30W: 175%  |  (na tomada)
```

O capítulo inteiro usa essa lente: **a melhor APU não é a mais potente, é a que entrega mais frames por watt na faixa de 8 a 15 W.**

## O que esperar deste capítulo

As seções 2 a 5 apresentam cada handheld em detalhe. A [seção 6](#/cap-107/sec-06) faz o comparativo técnico lado a lado com tabelas e números. A [seção 7](#/cap-107/sec-07) é o coração do capítulo: SteamOS versus Windows, a decisão que define a experiência. A [seção 8](#/cap-107/sec-08) cobre o que as especificações não capturam — como o dispositivo *sente* nas mãos depois de duas horas. A [seção 9](#/cap-107/sec-09) fecha com recomendações por cenário e orçamento.

```terminal
$ # Mapa do capítulo
$ echo "Sec 1: Panorama      Sec 6: Hardware"
$ echo "Sec 2-5: Dispositivos  Sec 7: SO"
$ echo "Sec 8: Ergonomia      Sec 9: Escolha"
Sec 1: Panorama      Sec 6: Hardware
Sec 2-5: Dispositivos  Sec 7: SO
Sec 8: Ergonomia      Sec 9: Escolha
```

:::nota
Este capítulo foi escrito com dados disponíveis até abril de 2025. Preços mencionados são em dólares americanos (MSRP de lançamento) e refletem o mercado norte-americano. O cenário brasileiro — importação, garantia e preço final — é abordado na [seção 9](#/cap-107/sec-09).
:::

## Resumo

O Steam Deck criou a categoria de handhelds PC x86 ao combinar preço agressivo, APU otimizada para baixo TDP e SteamOS. A resposta da indústria veio em duas ondas: primeiro com mais potência e Windows (ROG Ally, Legion Go), depois com refinamentos (Ally X, Deck OLED). O critério central de comparação não é o desempenho máximo, mas a eficiência entre 8 e 15 W — onde esses dispositivos realmente operam longe da tomada.

## Exercícios

1. Liste os seis critérios de comparação apresentados nesta seção e, para cada um, anote qual você considera mais importante no seu uso pessoal. Justifique em uma frase.
2. Pesquise o preço atual (abril de 2025) de três handhelds mencionados na tabela em lojas brasileiras ou no Mercado Livre. Converta para dólar pela cotação do dia e compare com o MSRP original.
3. Explique com suas palavras por que "mais potência" não significa necessariamente "melhor experiência" num handheld. Use o conceito de TDP na sua resposta.
4. O Steam Deck original de 64 GB custava US$ 399. Pesquise quanto custa hoje um notebook gamer com GPU dedicada equivalente (GTX 1050 Ti ou similar) e compare. O que essa diferença diz sobre o modelo de negócio da Valve?
5. **Desafio.** A GPD Win já produzia handhelds x86 antes do Steam Deck. Pesquise o GPD Win 3 (2021) e compare suas especificações com o Steam Deck LCD. Em quais aspectos a Valve acertou que a GPD errou?