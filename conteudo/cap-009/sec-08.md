Abaixo da APU, da tela e do SSD, existe uma camada de componentes que você quase não nota até eles falharem: os **controladores internos** — os chips e os dispositivos de entrada que fazem o Deck responder. Joysticks, botões, tela de toque, giroscópio, áudio, Wi-Fi, Bluetooth e um conjunto de sensores ambientais. O Linux os enxerga todos como dispositivos, e esta seção ensina a inventariá-los.

:::objetivos
- Mapear os controladores e dispositivos de entrada do Deck via `sysfs` e `/proc`
- Identificar o chip Wi-Fi/Bluetooth e o controlador de áudio
- Ler os sensores ambientais (temperatura ambiente, acelerômetro, luz)
- Entender como os controles (sticks, botões) são expostos ao sistema
- Usar `dmesg` e `lspci`/`lsusb` para confirmar o que está detectado e funcionando
:::

## Quem conversa com quem

O Deck não tem uma "placa para tudo". Ele espalha funções entre diversos chips, cada um falando por um barramento:

- **APU (Zen 2 + RDNA 2)** — CPU e GPU, que já cobrimos.
- **Controlador de entrada (embedded controller)** — agrega sticks, botões, touchpads e giroscópio.
- **Codec de áudio** — transforma sinais digitais em analógico para os alto-falantes e o fone.
- **Wi-Fi/Bluetooth** — um único chip combo, geralmente Realtek ou MediaTek, pendurado no barramento SDIO/PCIe ou USB.
- **Touchscreen** — um controlador I2C/do barramento de toque.
- **Sensores** — acelerômetro/giroscópio, sensor de luz ambiente, e a ventoinha/temperatura que já vimos.

A primeira tarefa é listar os barramentos. O `lspci` mostra o que está no PCI; o `lsusb`, o que está no USB:

```terminal
$ lspci -nn
00:00.0 Host bridge [0600]: Advanced Micro Devices, Inc. [AMD] Van Gogh Root Complex [1022:1635]
00:01.0 PCI bridge [0604]: Advanced Micro Devices, Inc. [AMD] Van Gogh PCIe GPP Bridge [1022:1637]
...
02:00.0 Non-Volatile memory controller [0108]: KIOXIA Corporation NVMe SSD [1e0f:0001]
04:00.0 VGA compatible controller [0300]: Advanced Micro Devices, Inc. [AMD/ATI] Van Gogh [1002:163f]
04:00.1 Audio device [0403]: Advanced Micro Devices, Inc. [AMD/ATI] Rembrandt Radeon HD Audio [1002:1640]
05:00.0 Network controller [0280]: Realtek Semiconductor Co., Ltd. RTL8822CE 802.11ac [10ec:c822]
```

Aqui dá para ver o SSD (KIOXIA), a GPU/áudio (Van Gogh) e o **Wi-Fi**: um Realtek RTL8822CE (802.11ac, Wi-Fi 5), presente nos primeiros Lotes. Os modelos mais novos podem trazer um chip diferente, da MediaTek ou com Wi-Fi 6.

## O que está pendurado no USB

Nem tudo no Deck é PCI. Touchscreen, Bluetooth (às vezes), e o hub interno de sensores aparecem no USB:

```terminal
$ lsusb
Bus 004 Device 001: ID 1d6b:0003 Linux Foundation 3.0 root hub
Bus 003 Device 002: ID 28de:1205 Valve Software Steam Deck Controller
Bus 003 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub
Bus 002 Device 001: ID 1d6b:0003 Linux Foundation 3.0 root hub
Bus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub
```

O que chama a atenção é `28de:1205 Valve Software Steam Deck Controller`. O `28de` é o vendor ID registrado pela própria Valve. Esse dispositivo é a forma como o sistema enxerga o conjunto de controles — sticks, botões, touchpads e giroscópio — expostos como um gamepad/controlador HID (Human Interface Device).

O `dmesg` conta a história dessa enumeração:

```terminal
$ sudo dmesg | grep -iE 'input|hid|controller' | head -10
[    2.148221] hid-generic 0003:28DE:1205.0001: hidraw0: USB HID v1.11 Device [Valve Software Steam Deck Controller] on usb-0000:05:00.3-2/input0
[    2.148339] input: Valve Software Steam Deck Controller as /devices/pci0000:00/.../input/input13
[    2.148450] input: Valve Software Steam Deck Controller Keyboard as /devices/.../input/input14
[    2.148561] input: Valve Software Steam Deck Controller Mouse as /devices/.../input/input15
```

O controlador se apresenta como três dispositivos de entrada: o gamepad, um teclado virtual e um mouse virtual. É por isso que os touchpads do Deck funcionam como mouse no desktop, e os botões, como teclas.

## Os controles em `/proc/bus/input/devices`

O inventário completo de dispositivos de entrada está em `/proc/bus/input/devices`, ou de forma mais amigável com `evtest` (do pacote de mesmo nome):

```terminal
$ grep -E 'Name|Handlers|Phys' /proc/bus/input/devices
...
N: Name="Valve Software Steam Deck Controller"
P: Phys=usb-0000:05:00.3-2/input0
H: Handlers=event4 js0 
...
N: Name="AT Translated Set 2 keyboard"
P: Phys=isa0060/serio0/input0
H: Handlers=sysrq kbd event5 leds 
...
N: Name="PC Speaker"
P: Phys=isa0061/input0
H: Handlers=kbd event6 
```

O handler `js0` (joystick 0) que aparece no controlador é o que muitos jogos e emuladores usam para ler os analógicos diretamente. O `event4` é o nó genérico de input do kernel. O teclado "AT Translated Set 2" é o teclado virtual que aparece quando o Steam abre o teclado em tela.

:::dica
O `evtest` permite "fazer escutar" um dispositivo e ver os eventos crus ao apertar botões. Rode `sudo evtest` e selecione o controlador do Deck, depois mexa nos botões — cada apertar gera um evento de tipo `EV_KEY` com um código. É a forma mais crua de debugar um botão que "não responde".
:::

## Áudio e o codec que roteia o som

O áudio do Deck sai da APU, mas é controlado por um codec. No `lsmod` e no `aplay` (ALSA) você vê a pilha de som:

```terminal
$ aplay -l
**** List of PLAYBACK Hardware Devices ****
card 0: Generic [HD-Audio Generic], device 0: ALC289 Analog [ALC289 Analog]
  Subdevices: 1/1
  Subdevice #0: subdevice #0
card 0: Generic [HD-Audio Generic], device 3: HDMI 0 [HDMI 0]
  Subdevices: 1/1
  Subdevice #0: subdevice #0
```

O codec **ALC289** (Realtek) cuida do fone de 3,5 mm e dos alto-falantes embutidos. O "HDMI 0" é a saída de áudio digital que vai junto do vídeo quando você conecta o Deck a uma TV — o mesmo dispositivo `04:00.1 Audio device` que o `lspci` mostrou.

```terminal
$ lsmod | grep -E 'snd|snd_hda'
snd_hda_codec_realtek   126976  1
snd_hda_codec_generic    94208  1 snd_hda_codec_realtek
snd_hda_intel           57344  3
snd_hda_codec          172032  3 snd_hda_codec_generic,snd_hda_codec_realtek,snd_hda_intel
```

O módulo `snd_hda_codec_realtek` confirma o codec Realtek carregado, `snd_hda_intel` é o driver HDA (High Definition Audio) que fala com o controlador da APU.

## Sensores ambientais: luz, aceleração e orientação

O Deck tem sensores que ajustam o brilho automático (sensor de luz) e detectam orientação/movimento (acelerômetro/giroscópio). Eles aparecem no subsistema IIO (*Industrial I/O*) do kernel:

```terminal
$ ls /sys/bus/iio/devices/
iio:device0  iio:device1  iio:device2
$ for d in /sys/bus/iio/devices/iio:device*; do echo "$d: $(cat $d/name)"; done
/sys/bus/iio/devices/iio:device0: accel_3d
/sys/bus/iio/devices/iio:device1: als
/sys/bus/iio/devices/iio:device2: gyro_3d
```

O `accel_3d` é o acelerômetro (detecta inclinação e movimento), o `gyro_3d` é o giroscópio (rotação), e o `als` é o *ambient light sensor* (sensor de luz ambiente). Este último é o que faz o brilho automático do Deck.

Para ler a luz ambiente atual:

```terminal
$ cat /sys/bus/iio/devices/iio:device1/in_illuminance_input
128
```

O valor em lux (128 → ambiente interno com luz moderada). O brilho automático do SteamOS usa isso; se o brilho "muda sozinho", é esse sensor agindo.

:::info
Nem todo giroscópio do Deck fica habilitado o tempo todo. Alguns sensores são ligados apenas quando um jogo ou a interface pede (o giroscópio de mira, por exemplo). Isso economiza energia — leituras IIO constantes têm custo de CPU e bateria.
:::

## Colocando tudo junto no `dmidecode`

Para o inventário da placa num único comando, o `dmidecode` despeja a DMI/SMBIOS, a identidade do chassi e da placa-mãe:

```terminal
$ sudo dmidecode -t baseboard | grep -E 'Manufacturer|Product|Version'
	Manufacturer: Valve
	Product Name: Jupiter
	Version: Not Specified
$ sudo dmidecode -t system | grep -E 'Manufacturer|Product|Version'
	Manufacturer: Valve
	Product Name: Jupiter
	Family: Steam Deck
```

"**Jupiter**" é o nome de código do projeto Steam Deck na documentação da Valve e do firmware. Ele aparece por toda parte, de strings de firmware a nomes de arquivos no sistema de atualização.

## Resumo

- O Deck espalha funções entre APU, controlador de entrada, codec de áudio, Wi-Fi/BT e sensores.
- `lspci -nn` lista SSD, GPU, áudio e o chip de rede (ex.: Realtek RTL8822CE).
- `lsusb` revela o "Steam Deck Controller" (`28de:1205`), o gamepad HID exposto pela Valve.
- `/proc/bus/input/devices` e `evtest` mostram controles, teclado virtual e nós `js0`/`event*`.
- O codec de áudio ALC289 (Realtek) aparece em `aplay -l` e nos módulos `snd_hda_*`.
- Sensores IIO (`accel_3d`, `gyro_3d`, `als`) fornecem movimento, rotação e luz ambiente.
- O nome de código do projeto é "Jupiter", visível em `dmidecode`.

## Exercícios

1. Rode `lsusb` e encontre o dispositivo "Valve Software Steam Deck Controller". Qual é o vendor ID (`28de`) e o produto (`1205`)?
2. Execute `lspci -nn` e identifique o chip de rede sem fio. Anote o modelo e pesquise se suporta Wi-Fi 5 ou 6.
3. Liste os sensores: `ls /sys/bus/iio/devices/` e leia o `name` de cada um. Qual sensor mede luz ambiente e qual mede rotação?
4. Use `sudo evtest`, selecione o controlador do Deck e pressione alguns botões. Quantos eventos você vê ao mover um analógico?
5. **Desafio.** Correlacione áudio e hardware: rode `aplay -l` e `lspci -nn | grep Audio`. Explique a relação entre o dispositivo PCI `04:00.1` e o codec ALC289. Por que o "HDMI 0" é listado como dispositivo de áudio separado dos alto-falantes?