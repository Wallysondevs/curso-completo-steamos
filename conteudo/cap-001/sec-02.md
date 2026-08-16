O Steam Deck é, antes de tudo, um computador com arquitetura x86_64 — a mesma que equipa notebooks e desktops há décadas. A diferença é que, em vez de um processador Intel ou AMD de prateleira empacotado numa placa-mãe ATX, o Deck usa uma APU (Accelerated Processing Unit) customizada: CPU e GPU no mesmo chip de silício, projetada sob medida para a Valve pela AMD. Esse casamento entre x86 e design integrado é o que permite rodar Elden Ring e compilar código-fonte na mesma máquina portátil.

:::objetivos
- Entender o que é uma APU e como CPU e GPU compartilham recursos no Steam Deck
- Identificar os microarquiteturas Zen 2 e RDNA 2 e seu papel no desempenho
- Interpretar o conceito de TDP e como ele afeta bateria e performance
- Examinar as especificações do chip Aerith (LCD) e Sephiroth (OLED)
- Ler informações da APU diretamente do kernel com comandos padrão
:::

## O que é uma APU e por que ela importa

APU é o termo que a AMD usa para descrever um chip que junta CPU (núcleos de propósito geral) e GPU (núcleos gráficos) no mesmo pacote de silício, compartilhando o mesmo controlador de memória. Num desktop ou notebook tradicional com GPU dedicada, a CPU acessa a RAM do sistema enquanto a GPU tem sua própria VRAM (memória de vídeo), isolada e de alta velocidade. Na APU, todo mundo bebe do mesmo cano: CPU e GPU disputam a mesma largura de banda da RAM.

No Steam Deck, essa arquitetura unificada é uma vantagem e uma limitação. A vantagem: não existe cópia de dados entre "memória do sistema" e "memória da placa de vídeo". A textura que a GPU vai renderizar já está na RAM que a CPU usou para carregar o arquivo do disco. A limitação: com um barramento de 128 bits e memória LPDDR5 a 5500 MT/s (LCD) ou 6400 MT/s (OLED), a largura de banda total fica entre 88 e 102 GB/s — muito abaixo dos centenas de GB/s de uma GPU dedicada.

```terminal
$ lscpu | grep -E 'Model name|Architecture|CPU\(s\)|Thread|Core'
Architecture:             x86_64
  CPU(s):                 8
  Model name:             AMD Custom APU 0405
    Thread(s) per core:   2
    Core(s) per socket:   4
```

O `lscpu` revela o essencial: 4 núcleos físicos com SMT (Simultaneous Multi-Threading), totalizando 8 threads lógicas. O "Model name" reporta `AMD Custom APU 0405` porque a Valve encomendou um chip que não existe no catálogo de prateleira da AMD.

## Zen 2, RDNA 2 e o chip Aerith

O modelo LCD do Steam Deck usa o chip de codinome **Aerith** (sim, referência a Final Fantasy VII). A CPU emprega a microarquitetura **Zen 2** — a mesma dos Ryzen 3000 de desktop — com 4 núcleos operando entre 2,4 GHz (base) e 3,5 GHz (boost). A GPU é baseada em **RDNA 2**, com 8 unidades computacionais (CUs) rodando a até 1,6 GHz.

Essa combinação Zen 2 + RDNA 2 não é acidental: RDNA 2 é a mesma arquitetura do PlayStation 5 e do Xbox Series X|S. Isso significa que o Deck suporta em hardware o conjunto de instruções gráficas que os jogos modernos esperam (DirectX 12 Ultimate via Vulkan, ray tracing por hardware — ainda que com apenas 8 CUs seja mais uma curiosidade do que algo usável na prática).

```terminal
$ cat /proc/cpuinfo | grep -E 'model name|cpu MHz' | head -4
model name      : AMD Custom APU 0405
cpu MHz         : 1697.523
model name      : AMD Custom APU 0405
cpu MHz         : 2456.112
$ cat /proc/cpuinfo | grep -c processor
8
```

As frequências oscilam dinamicamente: no momento do comando acima, dois núcleos estavam em ~1,7 GHz e dois em ~2,4 GHz. O driver `amd-pstate` no kernel 6.8 gerencia essa dança de clocks centenas de vezes por segundo, reagindo a temperatura, carga e limite de TDP.

:::info
O modelo OLED troca o chip Aerith pelo **Sephiroth**, que usa o mesmo design Zen 2 + RDNA 2, mas fabricado num processo de 6 nm (contra 7 nm do Aerith). A diferença prática é menor dissipação de calor e clocks ligeiramente mais estáveis sob carga, não mais núcleos ou mais desempenho bruto.
:::

## TDP, bateria e o triângulo do desempenho portátil

TDP (Thermal Design Power) é a quantidade de calor que o sistema de resfriamento precisa dissipar, medida em watts. No Steam Deck, o TDP da APU pode ser ajustado entre 3 W e 15 W — e esse número controla diretamente o equilíbrio entre quadros por segundo e minutos de bateria.

Com 15 W de TDP, a APU entrega o máximo de desempenho, mas a bateria de 40 Wh (LCD) ou 50 Wh (OLED) se esgota em cerca de 1,5 a 2 horas em jogos pesados. Reduzindo o TDP para 8 W, a duração dobra, mas os clocks da CPU e GPU caem proporcionalmente. A arte de usar o Deck em modo portátil é encontrar o TDP mínimo que ainda mantém a taxa de quadros aceitável para o jogo em questão.

```terminal
$ cat /sys/class/hwmon/hwmon5/power1_cap
15000000
$ cat /sys/class/hwmon/hwmon5/temp1_input
68000
```

O primeiro valor está em microwatts: 15.000.000 μW = 15 W. É o teto de consumo da APU. O segundo é a temperatura do chip em miligraus Celsius: 68.000 = 68 °C. Ambos são lidos do sensor físico no silício, via driver `k10temp`.

:::dica
No menu Quick Access (botão `...`), a aba de desempenho (Performance) expõe um controle deslizante de TDP. Para ver o efeito em tempo real, abra o overlay de desempenho nível 4 e compare o clock da GPU e o consumo em watts com TDP a 5 W, 10 W e 15 W enquanto roda o mesmo jogo.
:::

## Lendo o hardware a fundo: PCI e sensores

Por ser uma APU x86_64, o Steam Deck expõe seu hardware aos comandos de diagnóstico que qualquer usuário Linux conhece. O barramento PCI revela a GPU, o controlador NVMe, o USB e outros periféricos integrados. O comando `lspci` lista tudo.

```terminal
$ lspci | head -8
00:00.0 Host bridge: Advanced Micro Devices, Inc. [AMD] VanGogh Root Complex
00:00.2 IOMMU: Advanced Micro Devices, Inc. [AMD] VanGogh IOMMU
00:01.0 Host bridge: Advanced Micro Devices, Inc. [AMD] VanGogh PCIe Dummy Host Bridge
00:01.2 PCI bridge: Advanced Micro Devices, Inc. [AMD] VanGogh PCIe GPP Bridge
00:01.3 PCI bridge: Advanced Micro Devices, Inc. [AMD] VanGogh PCIe GPP Bridge
00:08.0 Host bridge: Advanced Micro Devices, Inc. [AMD] VanGogh PCIe Dummy Host Bridge
00:08.1 PCI bridge: Advanced Micro Devices, Inc. [AMD] VanGogh PCIe GPP Bridge
00:18.0 Host bridge: Advanced Micro Devices, Inc. [AMD] VanGogh Data Fabric
```

A família é **VanGogh** — codinome AMD do silício que deu origem aos chips Aerith e Sephiroth. O `Root Complex` é o ponto de entrada do barramento PCIe; os bridges conectam os periféricos (NVMe, Wi-Fi, USB). Repare que não há slot PCIe físico — tudo é interligado no mesmo pacote de silício ou na placa-mãe.

```terminal
$ sensors 2>/dev/null | grep -E 'Tctl|edge|junction'
Tctl:         +68.2°C  
Tccd1:        +65.0°C  
edge:         +68.0°C  
junction:     +69.1°C
```

`sensors` (do pacote `lm_sensors`) lê os mesmos dados térmicos de `/sys/class/hwmon`, mas em formato legível. `Tctl` é a temperatura de controle — o valor que o firmware usa para decidir se acelera ou reduz o cooler. `Tccd1` é o sensor dentro do die da CPU. `edge` e `junction` vêm do sensor da GPU.

## Resumo

- A APU do Steam Deck integra CPU Zen 2 (4 núcleos, 8 threads) e GPU RDNA 2 (8 CUs) no mesmo chip, compartilhando memória LPDDR5.
- O chip Aerith (LCD, 7 nm) e o Sephiroth (OLED, 6 nm) têm o mesmo design, mas o segundo dissipa menos calor.
- O TDP ajustável (3–15 W) controla o equilíbrio entre desempenho e duração da bateria.
- Comandos como `lscpu`, `lspci`, `sensors` e leitura de `/sys/class/hwmon` revelam as entranhas do hardware em tempo real.
- A largura de banda da memória (88–102 GB/s) é o principal gargalo da APU, e não a velocidade dos núcleos.

## Exercícios

1. Execute `lscpu` no seu Deck e confirme: quantos núcleos físicos? Quantas threads? Qual a frequência máxima reportada em `CPU max MHz`?
2. Rode `watch -n 1 'cat /sys/class/hwmon/hwmon*/temp1_input 2>/dev/null'` enquanto abre um jogo exigente. A temperatura sobe quantos graus em 30 segundos?
3. Use `lspci -v | grep -A8 VGA` para encontrar a GPU da APU no barramento PCI. Anote o endereço de memória e o driver em uso.
4. Leia o TDP atual com `cat /sys/class/hwmon/hwmon*/power1_cap`. Depois altere o TDP pelo menu Quick Access para 8 W e repita a leitura. O valor mudou?
5. **Desafio.** Com `sensors -u` (modo raw), colete as temperaturas de `Tctl` e `Tccd1` em três situações: em repouso, rodando um jogo leve (TDP 5 W) e um jogo pesado (TDP 15 W). Calcule o delta térmico entre repouso e carga máxima. O cooler consegue manter a temperatura abaixo de 90 °C com TDP máximo por 10 minutos?