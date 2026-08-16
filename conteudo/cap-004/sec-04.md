O processador do Steam Deck é o coração que decide quantos quadros por segundo o jogo entrega — e a Valve o escolheu de forma atípica: em vez de um chip genérico de notebook, encomendou à AMD uma APU sob medida, batizada de Aerith na primeira geração e Sephiroth na segunda. Conhecer essa peça por dentro ajuda a entender os limites de desempenho, o porquê do TDP apertado e o que de fato mudou entre as duas gerações.

Nesta seção você aprende a enxergar a APU pelo sistema: núcleos, threads, cache, frequência e até os TFLOPs de GPU que a Valve divulga.

:::objetivos
- Comparar as APUs Aerith (7 nm) e Sephiroth (6 nm) núcleo a núcleo
- Ler o número de cores, threads e a frequência atual pelo sistema
- Entender o papel da GPU integrada e do TDP no desempenho
- Interpretar os dados de CPU expostos em `/proc` e `/sys`
- Reconhecer por que o desempenho de jogo quase não mudou entre gerações
:::

## Aerith vs Sephiroth: o que mudou de verdade

A APU do LCD é a **Aerith**, fabricada em 7 nanômetros. Ela combina uma CPU de 4 núcleos / 8 threads baseada na arquitetura **Zen 2** com uma GPU integrada **RDNA 2** de 8 unidades de computação (CU). A Valve estima o desempenho da GPU em até **1,6 TFLOPs**, um número que ajuda a dimensionar a classe do hardware — uma placa de vídeo de desktop de entrada da mesma época ficava na faixa de poucos TFLOPs também.

A APU do OLED é a **Sephiroth**, fabricada em 6 nanômetros. Aqui está o ponto que muita gente entende errado: em desempenho bruto, ela é praticamente a mesma coisa. Continua 4 núcleos / 8 threads Zen 2, 8 CU de RDNA 2 e ~1,6 TFLOPs. O ganho do nó de 6 nm não é velocidade, é **eficiência**: o mesmo trabalho consome menos energia e gera menos calor.

Isso é deliberado. A Valve manteve a compatibilidade de desempenho entre gerações — os jogos rodam igual nos dois modelos — e usou a energia economizada para esticar a bateria e reduzir a temperatura, não para subir o clock. O resultado é o que você viu na seção de bateria: autonomia maior sem mudança perceptível de fps.

:::nota
TFLOPs (tera Floating-point Operations Per Second, ou trilhão de operações de ponto flutuante por segundo) mede o pico teórico da GPU: quantas operações matemáticas ela consegue despachar por segundo no teto do clock. É um número útil para comparar classes de hardware, mas ruim para prever fps real, que depende também de memória, largura de banda e do jogo. Trate o "1,6 TFLOPs" como referência de classe, não como medidor de desempenho no jogo A ou B.
:::

## Núcleos, threads e a CPU vista por dentro

O Linux expõe a CPU num arquivo de texto que resume tudo o que o `lscpu` e ferramentas gráficas leem por baixo. O `/proc/cpuinfo` lista cada processador lógico (thread) com seus detalhes:

```terminal
$ lscpu
Architecture:             x86_64
CPU op-mode(s):           32-bit, 64-bit
CPU(s):                   8
On-line CPU(s) list:      0-7
Thread(s) per core:       2
Core(s) per socket:       4
Socket(s):                1
Vendor ID:                AuthenticAMD
Model name:               AMD Custom APU 0405
CPU family:               23
Model:                    144
Thread(s) per core:       2
Core(s) per socket:       4
CPU min MHz:              400.0000
CPU max MHz:              3500.0000
```

A leitura principal: `CPU(s): 8` é o total de threads, e `Core(s) per socket: 4` com `Thread(s) per core: 2` explica a aritmética — 4 núcleos físicos, cada um com 2 threads (o multithreading simultâneo da AMD, o SMT). O nome `AMD Custom APU 0405` identifica a peça sob medida, que não tem um "Ryzen" comercial.

A frequência aparece em `CPU min MHz` (400) e `CPU max MHz` (3500), o que revela o intervalo de clock. O fato de a frequência variar tanto — de 400 MHz em repouso até 3,5 GHz em pico — é o recurso de escalonamento dinâmico que poupa bateria no menu e acelera no jogo.

Para ver a frequência **atual** de cada núcleo, em vez do intervalo, o caminho é o `/sys`:

```terminal
$ cat /proc/cpuinfo | grep "cpu MHz" | head -4
cpu MHz         : 2450.000
cpu MHz         : 2450.000
cpu MHz         : 2450.000
cpu MHz         : 2450.000
$ cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq
2450000
```

No exemplo, os quatro primeiros núcleos estão a 2450 MHz (2,45 GHz) no momento da leitura — um valor de meio de carga. O `scaling_cur_freq` de `/sys` devolve a frequência em kHz, então `2450000` é 2,45 GHz.

:::dica
Para acompanhar a frequência em tempo real enquanto um jogo roda, use um loop curto: `watch -n1 "grep 'cpu MHz' /proc/cpuinfo"`. Você verá o clock subir ao abrir um jogo e despencar ao voltar ao menu — é o escalonamento de frequência trabalhando, e uma boa demonstração de por que o consumo (e a bateria) variam tanto.
:::

## A GPU integrada e a memória compartilhada

A GPU RDNA 2 de 8 CU não tem memória dedicada: compartilha os **16 GB de RAM LPDDR5** com a CPU. Isso é típico de APUs e tem consequências — a "VRAM" não é fixa, e sim um valor negociado com o jogo.

O driver da AMD no SteamOS é o `amdgpu`, e ele aparece no `lspci` como o dispositivo VanGogh (a microarquitetura da Aerith):

```terminal
$ lspci | grep -iE 'vga|display|amdgpu'
04:00.0 VGA compatible controller: Advanced Micro Devices, Inc. [AMD/ATI] VanGogh [AMD Custom GPU 0405] (rev ae)
```

O mesmo dispositivo pode ser inspecionado em detalhe com `lspci -v`, que mostra o driver em uso e a região de memória. A linha `VanGogh` confirma a microarquitetura; no OLED o chip Sephiroth ainda se reporta com o mesmo identificador VanGogh, já que é uma revisão do mesmo projeto — mais um motivo para não tentar separar as gerações só pela GPU.

A alocação de memória para a GPU é controlada no SteamOS pela BIOS/UEFI numa faixa que a Valve ajustou ao longo das atualizações (tipicamente alguns gigabytes reservados, com o restante compartilhado dinamicamente). No sistema, dá para conferir o total de RAM e quanto está em uso:

```terminal
$ free -h
               total        used        free      shared  buff/cache   available
Mem:            14Gi       2.3Gi       8.1Gi        97Mi       4.2Gi        11Gi
Swap:           1.0Gi          0B       1.0Gi
```

O `total` de 14 Gi (de 16 GiB físicos, com parte reservada à GPU/BIOS) e o `available` de 11 Gi mostram a memória à disposição do sistema. Quanto a GPU "pega" é dinâmico: em jogos pesados o driver aumenta a alocação gráfica, reduzindo o `free` — sem que isso seja vazamento, é o compartilhamento de APU em ação.

:::atencao
Não confunda "16 GB LPDDR5" (a RAM física do aparelho, igual nas duas gerações) com "VRAM". O Steam Deck não tem uma VRAM de tamanho fixo como uma placa de vídeo dedicada. Se um jogo reporta "8 GB de VRAM", esse número é uma estimativa da memória compartilhada que o driver expõe, não um banco separado de chips.
:::

## Por que os jogos rodam parecido

Como a CPU (4C/8T Zen 2) e a GPU (8 CU RDNA 2 ~1,6 TFLOPs) não mudaram entre Aerith e Sephiroth, o desempenho de jogo é, na prática, idêntico. As pequenas diferenças em benchmarks vêm do gerenciamento térmico mais folgado do OLED — o chip mais eficiente aquece menos, sustenta o clock máximo por mais tempo e às vezes entrega 1–2 fps a mais em sessões longas.

O verdadeiro teto é o **TDP** (Thermal Design Power), o orçamento de energia que a Valve limita para manter o aparelho portátil, silencioso e friável. O Steam Deck permite ajustar esse teto na interface (o menu de desempenho deixa baixar o TDP para economizar bateria), o que altera diretamente o clock e o fps. É o equilíbrio entre desempenho, calor e autonomia que define a experiência — não a diferença de nó de fabricação.

| Componente | LCD (Aerith) | OLED (Sephiroth) |
|---|---|---|
| Nó | 7 nm | 6 nm |
| CPU | 4C/8T Zen 2 | 4C/8T Zen 2 |
| GPU | 8 CU RDNA 2 | 8 CU RDNA 2 |
| Desempenho GPU | ~1,6 TFLOPs | ~1,6 TFLOPs |
| RAM | 16 GB LPDDR5 | 16 GB LPDDR5 |
| Efeito real | — | menor consumo/calor |

O que define a experiência de jogo entre as duas gerações não é o processador, e sim a tela (90 Hz e HDR no OLED) e a bateria (50 Wh). O chip é essencialmente o mesmo — e é bom que seja, pois garante zero fragmentação de compatibilidade entre os dois aparelhos.

## Resumo

- Aerith (7 nm) e Sephiroth (6 nm) têm a mesma CPU (4C/8T Zen 2) e a mesma GPU (8 CU RDNA 2).
- O ganho do nó de 6 nm é eficiência (menos consumo e calor), não velocidade — 1,6 TFLOPs nas duas gerações.
- `lscpu` mostra 8 threads em 4 núcleos e o intervalo de clock (400 a 3500 MHz).
- A frequência atual por núcleo está em `/proc/cpuinfo` (`cpu MHz`) e em `/sys/.../cpufreq/scaling_cur_freq` (em kHz).
- `lspci | grep -i vga` identifica a GPU como VanGogh com driver `amdgpu`.
- Os 16 GB de LPDDR5 são compartilhados entre CPU e GPU; `free -h` mostra o total e o disponível.
- Desempenho de jogo é praticamente idêntico entre gerações; a diferença real está na tela e na bateria.

## Exercícios

1. Rode `lscpu` e anote `CPU(s)`, `Core(s) per socket`, `Thread(s) per core` e `CPU max MHz`. Explique a relação entre esses números.
2. Capture a frequência de pelo menos dois núcleos com `grep "cpu MHz" /proc/cpuinfo` em repouso e, se possível, com um jogo aberto, comparando os valores.
3. Identifique a GPU com `lspci | grep -i vga` e confirme a presença do driver `amdgpu` com `lspci -v`.
4. Rode `free -h` e explique o que cada coluna (`total`, `used`, `available`) significa numa APU de memória compartilhada.
5. **Desafio.** Acompanhe a frequência por 60 segundos com `watch -n1 "grep 'cpu MHz' /proc/cpuinfo"` enquanto abre e fecha um jogo. Descreva o padrão de subida/descida do clock e relacione com o consumo de bateria medido na seção anterior (`energy-rate` do `upower`).
