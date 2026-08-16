O Steam Deck não é um aparelho único: desde 2022 a Valve vende duas gerações de hardware sob o mesmo nome, e cada uma se desdobra em edições com armazenamento e acabamento diferentes. Saber identificar o modelo exato é o primeiro passo antes de qualquer reparo, troca de SSD, ajuste de TDP ou escolha de jogo. A boa notícia: quase tudo pode ser descoberto por dentro do SteamOS, sem abrir o aparelho nem ler a caixa.

Nesta seção você aprende a situar os dois modelos — o LCD original e o OLED — e a descobrir, por linha de comando, em qual deles está rodando o sistema.

:::objetivos
- Diferenciar o Steam Deck LCD do Steam Deck OLED pelos números que importam
- Identificar o exato modelo da sua unidade com comandos do próprio sistema
- Entender por que o nome "Steam Deck" esconde hardware bem diferente
- Reconhecer as edições de armazenamento de cada geração
- Preparar o terreno para comparar tela, bateria e conectividade nas próximas seções
:::

## Dois hardwares, um só nome

Quando a Valve lançou o Steam Deck em fevereiro de 2022, existia um único projeto de hardware, baseado no processador AMD codinome **Aerith**. Esse chip de 7 nanômetros combina CPU e GPU num só pacote — o que a AMD chama de APU — e foi desenhado sob medida para rodar numa máquina portátil com bateria e refrigeração limitadas. Ele alimenta todo o Steam Deck LCD, nas três edições de armazenamento de 64 GB, 256 GB e 512 GB.

Em novembro de 2023 a Valve lançou a segunda geração, o Steam Deck OLED. Por fora ele parece quase igual, mas internamente trocou praticamente tudo o que interessava: a tela, a bateria, o módulo de rede, o processo de fabricação do processador e até o sistema de refrigeração. A APU passou a ser o codinome **Sephiroth**, fabricado em 6 nanômetros — um refinamento do mesmo projeto, mais eficiente em energia.

A confusão é proposital e merece atenção: o site e a loja vendem ambos como "Steam Deck", e os jogos rodam de forma quase idêntica entre eles. Mas para quem administra a máquina, as diferenças práticas são grandes: a bateria do OLED dura visivelmente mais, a tela roda a 90 Hz contra 60 Hz, e o Wi-Fi salta de uma geração para outra. É por isso que a identificação correta do hardware vem antes de tudo.

:::nota
O Steam Deck LCD original de 2022 não foi descontinuado de uma vez. Durante meses conviveram no mercado o modelo de 64 GB (com armazenamento eMMC, mais lento que NVMe) e a linha OLED. Hoje o LCD sobrevive apenas em edições renovadas ou no mercado de usados — por isso saber reconhecer cada um evita pagar preço de OLED por um LCD.
:::

## Modelo, processador e memória em um comando

Uma das ferramentas mais completas para resumir hardware no Linux é o `inxi`, que já vem instalado no SteamOS em edições recentes. Ele agrega CPU, memória, placa de vídeo e muito mais em poucas linhas. Comece pelo caminho mais direto:

```terminal
$ inxi -F
System:    Host: steamdeck Kernel: 6.8.0-valve3-1-neptune-65 x86_64 bits: 64
           Desktop: KDE Plasma 5.27.10 Distro: SteamOS 3.6
Machine:   Type: Portable System: Valve product: Jupiter v: 1
           Mobo: Valve model: Jupiter serial: FWVA2345678
           UEFI: Valve v: F7A0120 date: 11/15/2023
CPU:       Info: quad core model: AMD Custom APU 0405 bits: 64 type: MT MCP
           cache: L2: 2 MiB L3: 4 MiB
           Speed (MHz): avg: 2450 min/max: 400/3500 cores: 1: 2450 2: 2450 3: 2450 4: 2450
           5: 2450 6: 2450 7: 2450 8: 2450
Graphics:  Device-1: AMD VanGogh driver: amdgpu v: kernel
           Display: wayland server: X.org driver: amdgpu
           resolution: 1: 1280x800
           API: EGL v: 1.5 drivers: radeonsi
           renderer: AMD Custom GPU 0405 (radeonsi vangogh ACO LLVM 16.0.6 DRM 3.57)
Memory:    total: 16 GiB available: 14.6 GiB used: 2.1 GiB (14%)
Battery:   ID-1: BAT1 charge: 38.5 Wh (100.0%) condition: 38.5/40.0 Wh (96.2%)
Drives:    Local Storage: total: 476.94 GiB used: 321.11 GiB (67.3%)
           ID-1: /dev/nvme0n1 model: ESMP512GKB4C3-E13TS size: 476.94 GiB
Network:   Device-1: Realtek RTL8822CE 802.11ac PCIe Adapter driver: rtw88_8822ce
Bluetooth: Device-1: Realtek Bluetooth Radio type: USB driver: btusb
```

A saída revela o essencial em cada bloco. `Machine: product: Jupiter` é o codinome interno da Valve para a placa; `System: Valve` confirma o fabricante. A CPU aparece como `AMD Custom APU 0405`, com `quad core` e `type: MT` (multithreading): 4 núcleos físicos, 8 threads. A GPU vem como `AMD VanGogh` — nome técnico da microarquitetura do Aerith — com driver `amdgpu`, e a tela em `1280x800` revela a resolução comum aos dois modelos.

Muitos detalhes que diferenciam LCD e OLED estão escondidos aí: a bateria (`40.0 Wh` aponta LCD), o disco (`ESMP512GKB4C3` é o SSD NVMe de 512 GB) e, sobretudo, o controlador de rede `Realtek RTL8822CE 802.11ac`, o Wi-Fi 5 do modelo LCD. O OLED apareceria com um chip bem diferente, como você verá na seção de conectividade.

:::dica
Se o `inxi` não existir na sua instalação, instale-o com `sudo steamos-readonly disable && sudo pacman -S inxi` e depois reative o modo somente-leitura com `sudo steamos-readonly enable`. Alternativamente, o SteamOS traz o `lspci` e os arquivos de `/sys` que cobrem a maior parte das mesmas informações — temas das próximas seções.
:::

## A bateria entrega o modelo sem nuances

O `inxi -F` já mostrou a bateria, mas existe uma forma ainda mais cirúrgica de ler a capacidade projetada — o número que a Valve usa nas especificações e que diferencia claramente os modelos. A capacidade de projeto fica exposta no sistema de arquivos virtual `/sys`:

```terminal
$ cat /sys/class/power_supply/BAT1/capacity
100
$ cat /sys/class/power_supply/BAT1/energy_full
40000000
$ cat /sys/class/power_supply/BAT1/energy_full_design
40000000
```

Os valores vêm em microampères-hora ou miliwatts-hora, dependendo do driver. No Steam Deck o `energy_full` reporta em **micro-watt-hora** (µWh), então `40000000` é exatamente **40 Wh** — a capacidade de projeto do LCD. O OLED exibe `50000000` (50 Wh). Converta dividindo por um milhão.

Repare que `capacity` mostra `100`, a carga atual em porcentagem, não a saúde. A saúde vem da comparação entre `energy_full` (o que a bateria retém hoje) e `energy_full_design` (o que saiu da fábrica). No exemplo os dois são iguais — bateria nova; com o uso, o primeiro número cai.

O utilitário `upower` entrega exatamente essas mesmas informações já convertidas para uma unidade legível:

```terminal
$ upower -i /org/freedesktop/UPower/devices/battery_BAT1
  native-path:          BAT1
  vendor:               MURATA
  model:                AP18C7K
  power supply:         yes
  updated:              Thu 20 Feb 2025 08:14:32 AM -03 (29 seconds ago)
  has history:          yes
  has statistics:       yes
  present:             yes
  rechargeable:        yes
  state:               fully-charged
  warning-level:       none
  energy:              40.0 Wh
  energy-empty:        0.0 Wh
  energy-full:         40.0 Wh
  energy-full-design:  40.0 Wh
  energy-rate:         0.0 W
  voltage:             8.525 V
  charge-cycles:       14
  percentage:          100%
  capacity:            100.0%
  technology:          lithium-ion
  icon-name:          'battery-full-symbolic'
```

Aqui a leitura é imediata: `energy-full-design` de `40.0 Wh` fecha o diagnóstico de modelo LCD. O `charge-cycles` conta os ciclos completos de carga já vividos — bom indicador de desgaste em usados — e `capacity` é a saúde percentual, que começa perto de 100% e cai com os anos.

:::atencao
Não confunda os dois arquivos chamados `capacity` do `/sys`. O `capacity` (relativo à carga) é percentual instantâneo; a saúde de longo prazo é a razão `energy_full / energy_full_design`. Um Steam Deck LCD usado com `energy_full` em `36000000` (36 Wh) ainda funciona, mas entrega 90% da autonomia original — informação que muda o preço justo de um usado.
:::

## Qual é o seu, afinal

Com as três fontes reunidas, a identificação vira uma tabela de decisão simples. Se a bateria de projeto é 40 Wh e o Wi-Fi é `802.11ac` (Wi-Fi 5), você tem um LCD. Se é 50 Wh com controlador `802.11ax` (Wi-Fi 6E), o aparelho é OLED. A próxima seção detalha a tela, que por si só também entrega o modelo.

| Sinal observado | LCD (2022) | OLED (2023) |
|---|---|---|
| Bateria de projeto | 40 Wh | 50 Wh |
| APU / microarquitetura | Aerith / VanGogh (7 nm) | Sephiroth (6 nm) |
| Wi-Fi | 802.11ac (Wi-Fi 5) | 802.11ax (Wi-Fi 6E) |
| Tela | IPS 60 Hz | HDR OLED 90 Hz |
| Taxa de quadro | até 60 Hz | até 90 Hz |

O caminho que você percorreu — `inxi -F`, os arquivos de `/sys/class/power_supply/` e o `upower` — responde "qual Steam Deck é o meu" sem abrir a tampa traseira. As seções seguintes aprofundam cada sinal, começando pela tela, a diferença mais visível a olho nu.

## Resumo

- O Steam Deck LCD (2022) e o OLED (2023) compartilham o nome, mas diferem em tela, bateria, Wi-Fi, processo da APU e acabamento.
- A APU do LCD é a Aerith (7 nm, microarquitetura VanGogh); a do OLED é a Sephiroth (6 nm).
- `inxi -F` resume o hardware e mostra produto (`Jupiter`), APU, GPU, bateria, disco e controlador de rede.
- `/sys/class/power_supply/BAT1/energy_full_design` expõe a capacidade de projeto em µWh: 40 000 000 (40 Wh) no LCD, 50 000 000 (50 Wh) no OLED.
- `upower -i .../battery_BAT1` entrega as mesmas informações já convertidas, com `charge-cycles` e saúde percentual.
- A bateria (40 vs 50 Wh) e o Wi-Fi (802.11ac vs 802.11ax) formam a identificação mais confiável por linha de comando.

## Exercícios

1. Rode `inxi -F` e anote os campos `product`, `Graphics` (Device-1) e `Network` (Device-1). A partir deles, diga se a máquina é LCD ou OLED.
2. Execute `cat /sys/class/power_supply/BAT1/energy_full_design` e converta o valor para watt-hora. Ele bate com 40 Wh ou 50 Wh?
3. Rode `upower -i /org/freedesktop/UPower/devices/battery_BAT1` e compare `energy-full` com `energy-full-design`. Se a máquina for usada, há queda de saúde?
4. Sem usar `inxi`, identifique o controlador de rede com `lspci | grep -i network` e confirme se o padrão é 802.11ac ou 802.11ax.
5. **Desafio.** Combinando o que viu aqui com a leitura do boot, rode `sudo dmesg | grep -iE 'battery|wifi|amdgpu' | head -20` e explique em prosa, a partir dessas mensagens, qual geração de Steam Deck está em execução — cruzando com a capacidade de bateria da seção anterior.
