As seções anteriores apresentaram cada handheld individualmente. Esta seção os coloca lado a lado em uma comparação técnica rigorosa, dimensão por dimensão: processador, gráficos, memória, armazenamento, tela, bateria e conectividade. É a seção de consulta do capítulo — as tabelas aqui servem de referência para as decisões da [seção 9](#/cap-107/sec-09).

:::objetivos
- Consolidar as especificações de todos os handhelds em tabelas comparativas
- Entender o impacto de cada componente no desempenho real
- Comparar CPUs e GPUs entre gerações da AMD e da Intel
- Interpretar por que especificações iguais não produzem experiências iguais
:::

## CPUs e GPUs: a mesa de APUs

Todos os handhelds mainstream usam APUs (chips que combinam CPU e GPU num único silício), quase todas da AMD. A Intel entra com o Claw. A tabela resume:

| Handheld | APU | CPU | GPU | Processo |
|---|---|---|---|---|
| Steam Deck LCD | Aerith | 4c/8t Zen 2 | 8 CU RDNA 2 | 7 nm |
| Steam Deck OLED | Sephiroth | 4c/8t Zen 2 | 8 CU RDNA 2 | 6 nm |
| ROG Ally / Legion Go | Z1 Extreme | 8c/16t Zen 4 | 12 CU RDNA 3 | 4 nm |
| ROG Ally (base) | Z1 | 6c/12t Zen 4 | 4 CU RDNA 3 | 4 nm |
| MSI Claw | Core Ultra 7 155H | 16c/22t (P+E+LPE) | 8 Xe-core Arc | Intel 4 |

A hierarquia de GPU integrada é clara: Z1 Extreme > Aerith/Sephiroth > Z1 básico, com o Claw em posição variável dependendo do driver e do jogo. Mas a hierarquia de CPU não segue a mesma ordem — o Core Ultra 7 do Claw tem muito mais thread de CPU que qualquer outro, o que ajuda em produtividade, não em jogos (que são limitados pela GPU e pelo TDP).

```terminal
$ # Potência gráfica teórica (TFLOPs, FP32)
$ echo "Z1 Extreme ........... ~8,6 TFLOPs"
$ echo "Aerith (Deck) ........ ~1,6 TFLOPs"
$ echo "Z1 básico ............ ~1,0 TFLOPs"
Z1 Extreme ........... ~8,6 TFLOPs
Aerith (Deck) ........ ~1,6 TFLOPs
Z1 básico ............ ~1,0 TFLOPs
```

Atenção: TFLOPs medem pico teórico, não desempenho real. O Z1 Extreme tem 5× os TFLOPs do Deck, mas a diferença real de FPS a 15 W fica entre 15% e 50%, porque o Deck extrai mais desempenho por watt do seu silício.

## RAM e VRAM compartilhada

Nenhum handheld tem VRAM dedicada — todos compartilham a RAM do sistema com a GPU, configurando uma região como "VRAM". A quantidade e velocidade da RAM, portanto, afetam diretamente o desempenho gráfico.

| Handheld | RAM | Velocidade | Observação |
|---|---|---|---|
| Steam Deck LCD | 16 GB | LPDDR5 5500 MT/s | 4 GB fixos dedicáveis como VRAM |
| Steam Deck OLED | 16 GB | LPDDR5 6400 MT/s | mesma arquitetura |
| ROG Ally | 16 GB | LPDDR5 6400 MT/s | até 8 GB como VRAM |
| ROG Ally X | 24 GB | LPDDR5X 7500 MT/s | folga para sistema + VRAM |
| Legion Go | 16 GB | LPDDR5X 7500 MT/s | 3/4/6/8 GB configurável |
| MSI Claw | 16 GB | LPDDR5X 7500 MT/s | configurável na BIOS |

O Steam Deck tem um truque importante: o driver AMD informa à GPU uma VRAM mínima garantida de 1 GB e máxima de 8 GB, ajustando dinamicamente conforme o jogo pede. Isso evita o problema de "VRAM configurada demais roubando RAM do sistema" que aflige Ally e Legion Go, que exigem escolha manual na BIOS.

:::nota
Em títulos modernos como *Horizon Forbidden West* ou *Alan Wake 2*, 8 GB de VRAM já ficam apertados em 800p. O gerenciamento dinâmico do Deck e os 24 GB do Ally X são respostas diferentes para o mesmo problema. É o tipo de detalhe que não aparece em folha de especificações, mas decide a suavidade em jogos pesados.
:::

## Armazenamento: a diferença do M.2 2230

Todos os modelos usam SSD NVMe no formato M.2 2230 (o padrão compacto, de 30 mm), exceto o Ally X, que adotou o M.2 2280 (padrão de notebook, 80 mm) — pelos mesmos motivos de upgrade fácil.

| Handheld | Slot | Capacidade padrão | Upgrade |
|---|---|---|---|
| Steam Deck LCD | M.2 2230 | 64 GB eMMC / 256 / 512 GB | até 2 TB 2230 |
| Steam Deck OLED | M.2 2230 | 512 GB / 1 TB | até 2 TB 2230 |
| ROG Ally | M.2 2230 | 512 GB | até 2 TB 2230 |
| ROG Ally X | M.2 2280 | 1 TB | até 4 TB 2280 |
| Legion Go | M.2 2230 | 512 GB / 1 TB | até 2 TB 2230 |

O modelo base de 64 GB do Deck LCD merece menção especial: usava eMMC (memória flash lenta soldada), uma falha que a Valve corrigiu nas gerações seguintes. Todos os modelos atuais usam NVMe rápido.

```terminal
$ # Benchmark ilustrativo de SSD (leitura sequencial)
$ echo "eMMC 64GB (Deck base) ...... ~300 MB/s"
$ echo "NVMe M.2 2230 (Deck 512) ... ~3000 MB/s"
$ echo "NVMe 2280 (Ally X) ......... ~5000 MB/s"
eMMC 64GB (Deck base) ...... ~300 MB/s
NVMe M.2 2230 (Deck 512) ... ~3000 MB/s
NVMe 2280 (Ally X) ......... ~5000 MB/s
```

A diferença eMMC vs NVMe é brutal: 10× na leitura sequencial, o que se traduz em tempos de carregamento muito menores nos modelos com NVMe.

## Telas comparadas

A tela é onde os handhelds mais divergem, porque cada fabricante tomou uma decisão diferente sobre resolução, taxa e painel.

| Handheld | Painel | Tamanho | Resolução | Taxa | Brilho | Gama |
|---|---|---|---|---|---|---|
| Deck LCD | IPS | 7,0" | 1280×800 | 60 Hz | 400 nits | sRGB 67% |
| Deck OLED | OLED | 7,4" | 1280×800 | 90 Hz | 600 SDR / 1000 HDR | DCI-P3 110% |
| ROG Ally | IPS | 7,0" | 1920×1080 | 120 Hz | 500 nits | sRGB 100% |
| Legion Go | IPS | 8,8" | 2560×1600 | 144 Hz | 500 nits | DCI-P3 97% |
| MSI Claw | IPS | 7,0" | 1920×1080 | 120 Hz | 500 nits | sRGB 100% |

O Deck OLED é o único com painel OLED e HDR — ganha disparado em contraste e cores, mesmo com resolução nominal menor. O Legion Go ganha em tamanho e taxa. Ally e Claw ficam no meio-termo IPS 1080p/120 Hz.

## Bateria e consumo

A bateria é o calcanhar-de-aquiles da categoria, e os fabricantes divergem na estratégia:

| Handheld | Bateria | Autonomia AAA (15 W) |
|---|---|---|
| Steam Deck LCD | 40 Wh | ~1h50 |
| Steam Deck OLED | 50 Wh | ~2h45 |
| ROG Ally | 40 Wh | ~1h20 |
| ROG Ally X | 80 Wh | ~2h30 |
| Legion Go | 49,2 Wh | ~1h45 |
| MSI Claw | 53 Wh | ~2h |

O Ally X lidera em capacidade absoluta, mas o Deck OLED empata em autonomia com bateria 60% menor — prova de que eficiência (SteamOS + APU otimizada) supera capacidade bruta. Isso antecipa o tema central da [seção 7](#/cap-107/sec-07).

```terminal
$ # Eficiência: autonomia por Wh de bateria a 15 W
$ echo "Deck OLED:  50Wh / 2h45  -> ~18,2 Wh/h"
$ echo "Ally X:     80Wh / 2h30  -> ~32,0 Wh/h"
$ echo "(menor é melhor: o Deck consome quase metade)"
Deck OLED:  50Wh / 2h45  -> ~18,2 Wh/h
Ally X:     80Wh / 2h30  -> ~32,0 Wh/h
(menor é melhor: o Deck consome quase metade)
```

## Resumo

Na dimensão de hardware, o Z1 Extreme (Ally e Legion Go) lidera em potência bruta de GPU, o Deck OLED em qualidade de tela e o Ally X em RAM e bateria. Mas o padrão mais importante é que *eficiência* — frames por watt, gerenciamento dinâmico de VRAM, SSD NVMe rápido — vale mais que números brutos num dispositivo alimentado por bateria. Especificações iguais (a mesma Z1 Extreme no Ally e no Go) não produzem experiências iguais, porque tela, peso, software e firmware mudam o resultado final.

## Exercícios

1. Monte uma tabela combinando APU, RAM, bateria e preço dos seis handhelds. Qual combinação oferece melhor "potência por dólar" na sua análise?
2. Explique por que o Z1 Extreme com 5× os TFLOPs do Deck não produz 5× o FPS a 15 W. Use o conceito de gargalo de energia.
3. Compare o gerenciamento de VRAM do Steam Deck (dinâmico) com o do Ally/Legion Go (manual na BIOS). Qual é a vantagem de cada e para quem?
4. A diferença entre eMMC e NVMe no Deck base é de ~10× na leitura. Explique como isso impacta o tempo de carregamento e o *stutter* de streaming de texturas.
5. **Desafio.** Pesquise o que é M.2 2230 vs 2280 e por que a maioria dos handhelds usa o formato compacto. Que limitações de capacidade o 2230 impõe em relação ao 2280?