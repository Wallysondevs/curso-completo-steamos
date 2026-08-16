O Steam Deck cabe na palma da mão, mas por dentro é um computador completo. O coração do aparelho é um chip da AMD que junta CPU, GPU e controladores num único encapsulamento — e entender como esse chip gerencia energia e temperatura é o primeiro passo para dominar o hardware do Deck. Os termos que você encontra em fóruns, análises e até na interface do Quick Access Menu têm significados bem concretos, e é isso que desmontamos aqui.

:::objetivos
- Compreender a arquitetura de uma APU e sua diferença para CPU + GPU discretas
- Identificar as microarquiteturas Zen 2 e RDNA 2 presentes no Steam Deck
- Interpretar o impacto do TDP na duração da bateria e no desempenho
- Entender SMT, boost clock e thermal throttling na prática
- Consultar informações da APU diretamente pelo terminal do Deck
:::

## De APU a SoC: o que está dentro do chip

Uma **APU** (*Accelerated Processing Unit*) é o nome comercial que a AMD dá a processadores que contêm CPU e GPU no mesmo *die* — a mesma pastilha de silício. Diferente de um notebook gamer tradicional, com CPU de um lado e GPU dedicada do outro, no Steam Deck as duas unidades compartilham o mesmo substrato, o mesmo controlador de memória e o mesmo orçamento térmico.

O Steam Deck LCD usa a APU **Aerith** (nome de código interno da Valve); o OLED usa a **Sephiroth**. Apesar dos nomes, ambas são baseadas no mesmo *die* AMD Van Gogh, fabricado em 7 nm (LCD) e 6 nm (OLED) — a microarquitetura interna é idêntica. Quando o chip também integra controladores de memória, PCI Express, USB, codecs de vídeo e o *display engine*, passa a ser chamado de **SoC** (*System on a Chip*). É por isso que a placa-mãe do Deck é tão compacta: o trabalho que num desktop ocuparia meia dúzia de chips discretos está concentrado ali.

```terminal
$ cat /proc/cpuinfo | grep -m1 "model name"
model name      : AMD Custom APU 0405
$ cat /proc/cpuinfo | grep "vendor_id" | head -1
vendor_id       : AuthenticAMD
```

A string `AMD Custom APU 0405` é como o kernel identifica a Aerith. O número `0405` é o ID de família do Van Gogh. Não espere encontrar "Steam Deck" nessa saída — a AMD trata o chip como produto *semi-custom*, e a identificação genérica é normal.

## Zen 2 e os 4 núcleos que seguram o jogo

A CPU da APU usa a microarquitetura **Zen 2**, a mesma dos Ryzen série 3000 de desktop. São 4 núcleos físicos, cada um capaz de executar 2 threads simultâneas graças ao **SMT** (*Simultaneous Multi-Threading*). O sistema enxerga 8 processadores lógicos.

SMT funciona duplicando as partes do núcleo que armazenam estado (registradores, contador de programa) mantendo uma única unidade de execução. Quando uma thread espera dados da memória, a outra usa as unidades aritméticas que ficariam ociosas. O ganho fica entre 20% e 40% em cargas bem paralelizadas — não dobra o desempenho, mas torna o uso dos recursos muito mais eficiente.

```terminal
$ lscpu
Architecture:             x86_64
CPU(s):                   8
  On-line CPU(s) list:    0-7
Vendor ID:                AuthenticAMD
  Model name:             AMD Custom APU 0405
    CPU family:           23
    Model:                144
    Thread(s) per core:   2
    Core(s) per socket:   4
    Socket(s):            1
    CPU max MHz:          3500.0000
    CPU min MHz:          400.0000
```

A linha `Thread(s) per core: 2` confirma o SMT. `Core(s) per socket: 4` são os núcleos físicos, e `CPU(s): 8` é a multiplicação dos dois. O clock máximo de 3,5 GHz é o **boost clock**: a frequência que o chip atinge sob carga, desde que haja margem térmica e elétrica.

## RDNA 2: a GPU integrada que faz tudo

A GPU do Van Gogh usa a microarquitetura **RDNA 2**, com 8 Compute Units (CUs), totalizando 512 *stream processors*. É a mesma arquitetura das Radeon RX 6000 e — mais importante — dos consoles Xbox Series X/S e PlayStation 5. Isso significa que os jogos são otimizados para esse conjunto de instruções desde o início da geração.

Cada CU contém 64 *shader cores*, unidades de textura, unidades de ray tracing (o Deck tem aceleração de ray tracing em hardware) e cache L0 dedicado. O clock da GPU varia entre 1,0 GHz e 1,6 GHz, controlado dinamicamente pelo *power management* do SoC.

```terminal
$ cat /sys/class/drm/card0/device/uevent
DRIVER=amdgpu
PCI_CLASS=30000
PCI_ID=1002:163F
$ cat /sys/class/drm/card0/device/device
0x163f
```

O `PCI_ID=1002:163F` identifica o dispositivo: `0x1002` é o vendor ID da AMD, `0x163F` é o device ID do Van Gogh. O driver `amdgpu` é o driver de código aberto da AMD no kernel, usado no Deck e em qualquer distribuição com GPU AMD moderna.

:::nota
Tanto o LCD quanto o OLED usam RDNA 2. Circulou especulação de que o OLED traria RDNA 3, mas a Valve manteve o mesmo silício — a litografia menor (6 nm) no Sephiroth trouxe ganhos marginais de eficiência energética, não um redesenho da GPU.
:::

## TDP, boost e o gerenciamento térmico

**TDP** (*Thermal Design Power*) é a quantidade de calor que o arrefecimento precisa dissipar, em watts. No Deck, o TDP da APU pode ser configurado entre 3 W e 15 W no Quick Access Menu (botão `...`). É um controle direto: quanto mais watts, mais desempenho e menos bateria; quanto menos, mais autonomia e menos frames por segundo.

A Valve projetou o Deck para operar com folga a 15 W. A ventoinha e o heat pipe mantêm o chip abaixo de 90 °C nesse patamar, e o boost clock é atingido em rajadas — não sustentado por horas, porque o consumo subiria além do envelope térmico. Quando a temperatura se aproxima do limite (tipicamente 95-100 °C), entra o **thermal throttling**: o SoC reduz progressivamente o clock para diminuir a geração de calor, o que o usuário percebe como queda de FPS. No Deck isso é raro em operação normal, mas pode ocorrer em ambientes quentes ou com a saída de ar obstruída.

```terminal
$ sensors
amdgpu-pci-0400
Adapter: PCI adapter
vddgfx:        1.20 V
edge:         +67.0°C
PPT:          14.80 W
slowPPT:       14.80 W

nvme-pci-0100
Adapter: PCI adapter
Composite:    +52.0°C

BAT1-acpi-00
Adapter: ACPI interface
in0:          7.60 V
curr1:        1.50 A
```

O `sensors` (do pacote `lm_sensors`) lê os sensores expostos pelo kernel. `edge` é a temperatura da borda do die da APU. `PPT` (*Package Power Tracking*) mostra o consumo instantâneo em watts: 14,8 W, perto do limite configurado. O `slowPPT` é a média móvel, usada para decisões de throttling de longo prazo.

:::dica
No Quick Access Menu, o *Performance Overlay* mostra TDP, GPU clock e temperatura em tempo real. Se você quer os mesmos dados sem sair do terminal, `sensors` entrega — e pode ser usado via SSH com o Deck dockado.
:::

## A relação entre watts e bateria

A bateria do LCD tem 40 Wh (watt-hora). Com a APU consumindo 15 W constantes, a conta é direta: 40 ÷ 15 ≈ 2,6 horas de jogo intenso, sem contar tela, áudio e Wi-Fi. Na prática, jogos pesados ficam entre 1,5 e 2 horas. Reduzir o TDP para 8 W dobra a autonomia, e títulos 2D ou indies passam de 5 horas. Por isso o controle de TDP é a principal alavanca de autonomia: cada jogo tem um perfil de consumo diferente, e um jogo que roda bem a 40 FPS com 6 W não precisa dos 15 W disponíveis.

```terminal
$ cat /sys/class/power_supply/BAT1/energy_now
28500000
$ cat /sys/class/power_supply/BAT1/energy_full
40000000
$ cat /sys/class/power_supply/BAT1/status
Discharging
```

Os valores estão em microwatt-hora (μWh): `28500000` = 28,5 Wh restantes, `40000000` = 40 Wh de capacidade total. Dividindo um pelo outro, você tem a porcentagem real, sem arredondamentos da interface. [A seção sobre desempenho](#/cap-102/sec-09) explora o governador de frequência e os estados de sono do SoC.

## Resumo

- APU é CPU + GPU no mesmo die; SoC é APU + controladores, codecs e I/O num chip só. O Deck usa o AMD Van Gogh (Aerith/Sephiroth).
- A CPU tem 4 núcleos Zen 2 com SMT, gerando 8 threads; a GPU tem 8 CUs RDNA 2 com ray tracing em hardware.
- TDP configurável de 3 W a 15 W é a principal alavanca entre desempenho e autonomia (40 Wh no LCD).
- Boost clock de até 3,5 GHz (CPU) é atingido em rajadas; thermal throttling reduz clocks acima de ~95 °C.
- `lscpu`, `sensors` e os arquivos em `/sys/class/power_supply/` e `/sys/class/drm/` expõem essas informações no terminal.
- SMT permite que cada núcleo físico execute 2 threads, com ganho real de 20-40% em cargas paralelas.

## Exercícios

1. Execute `lscpu` no seu Deck e localize `Thread(s) per core`, `Core(s) per socket` e `CPU(s)`. Multiplique as duas primeiras e confira se o resultado bate com `CPU(s)`. Anote o `CPU max MHz`.
2. Com `sensors`, identifique a temperatura `edge` da APU e o `PPT` atual. Abra um jogo pesado e rode `sensors` de novo via SSH — quanto o PPT subiu? A temperatura passou de 80 °C?
3. Navegue até `/sys/class/power_supply/BAT1/` e leia `energy_full`, `energy_now` e `status`. Converta os valores para Wh e calcule a porcentagem manualmente. Compare com o ícone da bateria no modo jogo.
4. O arquivo `/sys/class/drm/card0/device/uevent` contém o device ID do Van Gogh (`0x163F`). Pesquise na [PCI ID Repository](https://pci-ids.ucw.cz/) qual a string associada a esse ID.
5. **Desafio.** Rode `sudo dmesg | grep -i amdgpu` e `sudo dmesg | grep -i "thermal"`, anotando os timestamps entre colchetes. O que inicializou primeiro — a GPU ou o sistema térmico? Por que essa ordem importa?