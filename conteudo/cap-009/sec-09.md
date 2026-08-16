Ver cada peça isoladamente ensina a anatomia do Deck, mas um diagnóstico real exige olhar a máquina inteira de uma vez. Esta seção junta tudo numa única varredura de hardware: como gerar um relatório completo do sistema, cruzar as informações dos comandos anteriores e responder, em poucos minutos, à pergunta que resume o capítulo — "o que exatamente tem dentro deste Deck e está tudo funcionando?".

:::objetivos
- Gerar um inventário completo de hardware com `lshw` e `inxi`
- Consolidar CPU, memória, disco, GPU, rede e sensores num único relatório
- Identificar componentes ausentes ou com driver/firmware faltando
- Cruzar as leituras de temperatura, memória e energia com a carga atual
- Produzir um "diagnóstico de 5 minutos" do Deck
:::

## Por que consolidar

Os comandos vistos até aqui — `lscpu`, `free`, `lsblk`, `nvme list`, `lspci`, `lsusb`, `sensors`, `vulkaninfo` — são cirúrgicos. Cada um responde a uma pergunta, mas nenhum responde a todas. Quando você precisa de um retrato rápido (troca de SSD, suporte, venda da máquina, suspeita de defeito), o ideal é um comando que agrega.

Duas ferramentas fazem isso bem no SteamOS: o **`lshw`** (do pacote de mesmo nome), voltado a hardware, e o **`inxi`**, um informante de sistema mais "humano" popular em fóruns de suporte. As duas leem as mesmas fontes — sysfs, DMI, PCI, USB — mas organizam o resultado de forma diferente.

## `lshw`: a radiografia completa

O `lshw` (list hardware) varre barramentos e monta uma árvore. Sem filtro, ele é longo; com os filtros certos, vira o inventário definitivo:

```terminal
$ sudo lshw -short
H/W path            Device     Class          Description
=========================================================
                               system         Valve Jupiter (Steam Deck)
/0                             bus            Motherboard
/0/0                           memory         14GiB System Memory
/0/4                           processor      AMD Custom APU 0405
/0/100                         bridge         Van Gogh Root Complex
/0/100/1.1/0                   bridge         Van Gogh PCIe GPP Bridge
/0/100/1.3/0      nvme0        storage        NVMe SSD
/0/100/1.3/0/0                 volume          EFI FAT
/0/100/4                       display        Van Gogh [Radeon Graphics]
/0/100/4.1                     multimedia     Rembrandt Radeon HD Audio
/0/100/5                       network        RTL8822CE 802.11ac
/0/1                           system         Steam Deck Controller
/0/2  BAT1                      power          Battery
```

O `-short` condensa cada dispositivo numa linha: path, device node, classe e descrição. A árvore mostra a hierarquia real — a APU como `processor`, a GPU como `display` pendurada no root complex, o SSD como `storage`, o Wi-Fi como `network`, o controlador como `system`, a bateria como `power`.

Para um componente específico, você desce aos detalhes:

```terminal
$ sudo lshw -class display
  *-display
       description: VGA compatible controller
       product: Van Gogh [Radeon Graphics]
       vendor: Advanced Micro Devices, Inc. [AMD/ATI]
       physical id: 4
       bus info: pci@0000:04:00.0
       version: c1
       width: 64 bits
       clock: 33MHz
       capabilities: pm vga_controller bus_master cap_list
       configuration: driver=amdgpu latency=0
       resources: ioport:1000(size=256) memory:... 
```

A linha `configuration: driver=amdgpu` confirma, no `lshw`, o mesmo driver que o `lsmod` mostrou. É um bom ponto de cruzamento: se aqui dissesse `driver=N/A`, você teria um problema de driver de GPU.

## `inxi`: o relatório de fórum

O `inxi` gera um resumo copiável, o formato padrão quando alguém pede "as specs" num fórum ou ticket de suporte:

```terminal
$ inxi -Fxz
System:
  Kernel: 6.5.0-valve37-1 x86_64 bits: 64 compiler: gcc v: 13.2.0
  Desktop: KDE Plasma 5.27.11 Distro: SteamOS 3.6.21
Machine:
  Type: Laptop System: Valve product: Jupiter v: N/A
  serial: <superuser required>
  Mobo: Valve model: Jupiter serial: <superuser required>
  UEFI: Valve v: F7A0121 date: 12/15/2024
CPU:
  Info: quad core model: AMD Custom APU 0405 bits: 64 type: MT MCP cache:
  L2: 2 MiB
  Speed (MHz): avg: 1397 min/max: 400/3500 cores: 1: 1397 2: 1397
  3: 1397 4: 1397 5: 1397 6: 1397 7: 1397 8: 1397
Graphics:
  Device-1: AMD Van Gogh [Radeon Graphics] driver: amdgpu v: kernel
  Display: wayland server: X.org v: 1.21.1.11 driver: X: loaded: amdgpu
  resolution: 1280x800~39Hz
  API: EGL v: 1.5 drivers: radeonsi, swrast
  API: OpenGL v: 4.6 renderer: AMD Radeon Graphics (vangogh)
Audio:
  Device-1: AMD Rembrandt Radeon High Definition Audio driver: snd_hda_intel
Memory:
  System RAM: total: 16 GiB available: 13.98 GiB used: 2.1 GiB
Partition:
  ID-1: / size: 4.86 GiB used: 3.1 GiB fs: ext4 dev: /dev/nvme0n1p4
Network:
  Device-1: Realtek RTL8822CE 802.11ac driver: rtw88_8822ce
Battery:
  ID-1: BAT1 charge: 73% condition: 38.9/40.0 Wh volts: 7.7 min: 7.6
```

O `inxi -Fxz` é o `lshw` "de gente": reúne kernel, desktop, CPU (com min/max MHz), GPU (com driver e resolução), áudio, memória, partições, rede e bateria. O `-F` pede o relatório completo; `-x` e `-z` adicionam detalhe e ocultam dados sensíveis respectivamente.

O kernel `6.5.0-valve37-1` e o UEFI `F7A0121` são sinais de que este é um SteamOS genuíno, não um Arch/Debian genérico — distro raiz do curso.

:::dica
O `inxi` nem sempre está instalado no SteamOS por padrão. Instale com `sudo apt install inxi`. O `lshw` também: `sudo apt install lshw`. Ambos são leituras read-only; não alteram nada no sistema.
:::

## O roteiro do diagnóstico de 5 minutos

Com as ferramentas em mãos, o checklist prático (cada passo um comando que você já viu):

1. **Identidade** — `inxi -Fxz | head -20` ou `lshw -short`. O que a máquina é, qual firmware.
2. **CPU e memória** — `lscpu` e `free -h`. Núcleos, threads, RAM total e disponível.
3. **GPU** — `lspci -nn | grep VGA` + `glxinfo -B | grep -E 'renderer|direct'`. Driver e aceleração ativos?
4. **Disco** — `lsblk` + `nvme list` + `nvme smart-log`. Modelo, layout, saúde.
5. **Rede** — `lspci | grep Network` e `iw dev` (para ver a interface Wi-Fi e o link).
6. **Sensores e energia** — `sensors` + `upower -i`. Temperatura, ventoinha, bateria.

O cruzamento final: se `glxinfo` diz `direct rendering: Yes` e a temperatura de junção está sob controle, a pilha gráfica está íntegra. Se `nvme smart-log` tem `critical_warning: 0` e `percentage_used` baixo, o disco está saudável. Se a bateria mostra `capacity` acima de 80% com poucos ciclos, o hardware é jovem.

## Ausências e problemas comuns

Nem sempre o inventário vem limpo. Três situações frequentes:

- **Driver N/A no `lshw`** — o kernel detectou o dispositivo, mas nenhum driver o reivindicou. Em GPU, quase sempre falta firmware `amdgpu` (o pacote `linux-firmware` do SteamOS).
- **`glxinfo` lento ou `renderer: llvmpipe`** — `llvmpipe` é renderização por software (CPU). Se aparecer, a aceleração por `amdgpu` não está funcionando; jogos vão sofrer.
- **Dispositivo ausente do `lspci`/`lsusb`** — se o Wi-Fi sumiu, por exemplo, pode ser driver desabilitado ou hardware com defeito físico. O `dmesg | grep -i 'error\|fail'` ajuda a contar a história.

:::atencao
`llvmpipe` no `glxinfo` ou no `inxi` é o sinal de "algo errado" mais comum que aparece após uma instalação ou atualização malsucedida de firmware. Se a GPU deveria estar acelerando com `amdgpu` e você vê `llvmpipe`, confira primeiro o `dmesg` para mensagens de firmware ausente — não reinstale o sistema antes disso.
:::

## Um script de inventário para guardar

Para não redigitar tudo, você pode criar um pequeno script que junta o essencial:

```bash
#!/bin/bash
# inventario.sh — retrato do hardware do Steam Deck
echo "== CPU =="; lscpu | grep -E 'Model name|Core|Thread|MHz'
echo "== MEMÓRIA =="; free -h | head -2
echo "== GPU =="; lspci -nn | grep VGA; glxinfo -B 2>/dev/null | grep -E 'renderer|direct'
echo "== DISCO =="; lsblk -o NAME,SIZE,TYPE,MOUNTPOINT | grep -E 'nvme|mmcblk'
echo "== REDE =="; lspci | grep -i network
echo "== TEMPERATURA =="; sensors | grep -E 'edge|junction|fan'
echo "== BATERIA =="; upower -i /org/freedesktop/UPower/devices/battery_BAT1 | grep -E 'energy-full|percentage|capacity'
```

Salve como `~/lab/inventario.sh`, dê permissão de execução e rode:

```terminal
$ chmod +x ~/lab/inventario.sh
$ ~/lab/inventario.sh
```

O output vira seu "documento de hardware" sempre que precisar de um retrato rápido ou precisar enviar specs para alguém.

## Resumo

- `lshw -short` monta uma árvore de todos os dispositivos com hierarquia e driver.
- `lshw -class display` mostra a GPU com o driver `amdgpu` associado.
- `inxi -Fxz` gera um relatório consolidado, ideal para compartilhar specs ou pedir suporte.
- O diagnóstico de 5 minutos cruza identidade, CPU, memória, GPU, disco, rede e sensores.
- `driver=N/A` (lshw) e `renderer: llvmpipe` (glxinfo) são sinais de driver/firmware ausente.
- Um script de inventário consolida os comandos do capítulo inteiro num único retrato.

## Exercícios

1. Instale `lshw` e `inxi` e gere o inventário completo com cada um. Aponte uma informação que só aparece num deles.
2. Rode `sudo lshw -short` e confira se a GPU está com `display` e o SSD com `storage`. Há algum dispositivo listado como `UNCLAIMED`?
3. Compare `lshw -class display` com o `glxinfo -B` da seção de GPU. O driver em `configuration: driver=` bate com o renderer do OpenGL?
4. Salve e execute o script `inventario.sh` acima. O retrato completo sai em quantos segundos? Guarde o output de referência.
5. **Desafio.** Produza o diagnóstico de 5 minutos completo do seu Deck e escreva uma conclusão de duas frases sobre a saúde geral do aparelho, citando ao menos: temperatura de junção, saúde do NVMe (percentage_used), capacidade da bateria e aceleração de GPU. Se encontrar `llvmpipe` ou `driver=N/A`, investigue com `dmesg` antes de concluir.