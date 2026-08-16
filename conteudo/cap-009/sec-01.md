Tudo o que rola num Steam Deck — os jogos, o SteamOS, o desktop KDE — gira em torno de uma única peça de silício: a APU. Em vez de ter um processador (CPU) e uma placa de vídeo (GPU) separados, como num PC de mesa, o Deck concentra os dois no mesmo chip. Entender o que é uma APU e o que a da Valve tem por dentro explica por que esta máquina custa o que custa e entrega o que entrega.

:::objetivos
- Entender o conceito de APU e por que ela é a escolha certa para um portátil
- Identificar o modelo exato da APU do seu Deck (Aerith ou Sephiroth)
- Ler a CPU Zen 2 de 4 núcleos/8 threads com `lscpu` e `/proc/cpuinfo`
- Distinguir a parte de CPU da parte de GPU dentro do mesmo die
- Relacionar o processo de fabricação (7nm vs 6nm) ao consumo de energia
:::

## Por que uma APU, e não CPU + placa de vídeo

Num desktop gamer, a placa de vídeo é uma placa separada, encaixada num slot, com a própria memória, o próprio cooler e o próprio orçamento de energia (centenas de watts, às vezes). Isso é ótimo para desempenho, mas péssimo para um aparelho que precisa caber na mão, durar horas longe da tomada e não derreter.

Uma **APU** (*Accelerated Processing Unit*, um termo cunhado pela AMD) junta CPU e GPU no mesmo chip, compartilhando o mesmo silício, o mesmo controlador de memória e o mesmo pacote. As vantagens para o Deck são diretas: menos área de placa, menos calor, menos componentes para dar defeito e — o mais importante — um gasto de energia que cabe numa bateria de notebook.

A contrapartida é o teto de desempenho. A GPU integrada não tem memória dedicada; ela pede memória emprestada à RAM do sistema. Isso é mais lento do que a VRAM de uma placa dedicada, mas é o custo de ter algo do tamanho de um Deck com 1.6 TFLOPs de processamento gráfico.

:::nota
"APU" é uma marca da AMD para seus chips com gráficos integrados fortes. A Intel tem um conceito equivalente (CPU com *Iris*/Arc integrado), mas não usa a palavra APU. No Deck, toda a discussão é sobre APU AMD.
:::

## Aerith e Sephiroth: dois silícios, uma mesma família

A Valve encomendou à AMD dois chips sob medida para o Deck, batizados com nomes de personagens de *Final Fantasy VII*:

- **Aerith** — equipa os modelos **LCD** (os primeiros, e ainda os de 64GB/256GB/512GB com tela de 60Hz). Fabricado no processo de **7nm** da TSMC.
- **Sephiroth** — equipa os modelos **OLED** (de 512GB e 1TB, tela de 90Hz HDR). Fabricado no processo menor de **6nm**.

Os dois são, na prática, a mesma arquitetura: CPU **Zen 2** com 4 núcleos e 8 threads, e GPU **RDNA 2** com 8 unidades de computação (CUs). A diferença está no processo de fabricação: o die de 6nm é fisicamente menor e um pouco mais eficiente, o que ajuda o OLED a entregar mais bateria (50Wh contra 40Wh) com o mesmo ou melhor desempenho.

O nome real como o mundo vê o chip não é "Aerith": ele se identifica como **AMD Custom APU 0405** ou **Van Gogh**, o nome de código interno da linha. Você pode confirmar qual é o seu lendo o registro do firmware.

## Vendo a CPU por dentro com `lscpu`

O `lscpu` resume tudo o que o kernel sabe sobre o processador. É o primeiro comando para inspecionar o hardware:

```terminal
$ lscpu
Architecture:             x86_64
  CPU op-mode(s):         32-bit, 64-bit
  Address sizes:          48 bits physical, 48 bits virtual
  Byte Order:             Little Endian
CPU(s):                   8
  On-line CPU(s) list:    0-7
Vendor ID:                AuthenticAMD
  Model name:             AMD Custom APU 0405
    CPU family:           23
    Model:                144
    Thread(s) per core:   2
    Core(s) per socket:   4
    Socket(s):            1
    Stepping:             1
    CPU max MHz:          3500.0000
    CPU min MHz:          400.0000
    BogoMIPS:             5600.00
Virtualization features:  
  Virtualization:         AMD-V
Caches (sum of all):      
  L1d:                    128 KiB (4 instances)
  L1i:                    128 KiB (4 instances)
  L2:                     2 MiB (4 instances)
  L3:                     4 MiB (1 instance)
```

Repare na coluna que importa: `Thread(s) per core: 2` multiplicado por `Core(s) per socket: 4` dá os `CPU(s): 8` que aparecem no topo. O sistema operacional enxerga 8 processadores lógicos, mas há só 4 núcleos físicos — cada um executa duas threads simultâneas via **SMT** (*Simultaneous Multi-Threading*), o "Hyper-Threading" da AMD.

O `CPU max MHz` de 3500 reflete o turbo do Zen 2 do Deck (3,5GHz de pico). O valor muda de modelo para modelo, mas a arquitetura é idêntica.

## Lendo cada núcleo em `/proc/cpuinfo`

O `lscpu` agrega; o `/proc/cpuinfo` mostra um bloco por processador lógico. É verbose, mas deixa visível a simetria entre os 8 "CPUs" que o kernel enxerga:

```terminal
$ grep -E 'model name|core id|siblings|cpu MHz' /proc/cpuinfo
processor	: 0
model name	: AMD Custom APU 0405
cpu MHz		: 1397.559
core id		: 0
siblings	: 8

processor	: 1
model name	: AMD Custom APU 0405
cpu MHz		: 1397.559
core id		: 1
siblings	: 8
...
```

O campo `core id` revela a verdade física: os processadores 0, 1, 2 e 3 têm `core id` 0, 1, 2 e 3, e os processadores 4 a 7 repetem esses mesmos ids — porque são as segundas threads dos mesmos 4 núcleos. O `cpu MHz` de 1397 aqui mostra a CPU em idle, bem abaixo do turbo, economizando bateria graças ao escalonamento dinâmico de frequência do kernel.

:::dica
Para ver a frequência de cada núcleo em tempo real, sem repetir o `/proc/cpuinfo` inteiro, use:

```terminal
$ watch -n1 "grep 'cpu MHz' /proc/cpuinfo"
```
:::

## Zen 2 e o que isso significa para jogar

O Zen 2 (2019) não é a arquitetura mais nova da AMD — o Deck não usa Zen 3 nem Zen 4. A Valve escolheu Zen 2 por dois motivos: ele já era maduro e barato quando o Deck foi projetado, e gasta pouca energia. Quatro núcleos Zen 2 a 3,5GHz seguram bem a maioria dos jogos que rodam bem na resolução nativa do Deck (1280x800), que é baixa o bastante para o gargalo ficar quase sempre na GPU, não na CPU.

Isso não quer dizer que o Deck nunca limita por CPU. Jogos de estratégia, simulação e títulos com muita física (ou muito NPC) tendem a saturar antes os 4 núcleos. Mas, na prática, para o alvo da plataforma, a CPU raramente é o fator decisivo.

:::info
O processo de fabricação em **nanômetros** (7nm, 6nm) mede, grosso modo, o tamanho dos transistores no chip. Menos nanômetro = transistores menores = mais componentes por área e menor consumo por operação. O salto do Aerith (7nm) para o Sephiroth (6nm) não muda a arquitetura, mas refina a eficiência energética.
:::

## Resumo

- O Deck usa uma APU AMD, que funde CPU e GPU num único chip que compartilha memória e controle de energia.
- Existem dois silícios: Aerith (LCD, 7nm) e Sephiroth (OLED, 6nm), ambos Zen 2 + RDNA 2.
- A CPU tem 4 núcleos físicos e 8 threads (SMT), com frequência de até ~3,5GHz no turbo.
- `lscpu` resume o processador; `/proc/cpuinfo` detalha cada um dos 8 processadores lógicos.
- O `core id` repetido em `/proc/cpuinfo` prova que há 4 núcleos reais e não 8.
- Zen 2 foi escolhido por maturidade, custo e eficiência; a GPU é o gargalo típico, não a CPU.

## Exercícios

1. Rode `lscpu` e identifique, na saída, o `Model name`, o número de núcleos e o de threads. Confirme que `Threads per core` × `Cores per socket` = `CPU(s)`.
2. Use `grep -c '^processor' /proc/cpuinfo` para contar os processadores lógicos. Confira se bate com o `nproc`.
3. Com `grep 'cpu MHz' /proc/cpuinfo`, observe a frequência em idle. Rode algo pesado (abra um jogo ou rode `stress --cpu 4`) e veja a frequência subir ao turbo de 3,5GHz.
4. Descubra se seu Deck é Aerith ou Sephiroth. Uma pista: `cat /sys/class/thermal/thermal_zone0/type` e o `Model name` do `lscpu`. Depois, compare com o que o manual do modelo informa.
5. **Desafio.** Sem olhar a próxima seção, liste o que mudaria de comportamento no sistema se a Valve tivesse escolhido 6 núcleos Zen 2 em vez de 4, e diga qual componente (CPU ou GPU) você acha que limitaria menos os jogos 2D versus os 3D pesados.
