No modo Gaming, o Steam Deck é um console com controles integrados. No modo Desktop, ele vira um PC Linux com a mesma pilha de entrada que qualquer notebook: teclado, mouse e qualquer controle USB ou Bluetooth são reconhecidos automaticamente. A mágica adicional é o Steam Input, que intercepta esses dispositivos e permite remapear qualquer entrada para qualquer função — e é aqui que o Deck vai de PC comum a canivete suíço de input.

:::objetivos
- Conectar e inspecionar teclado, mouse e controles via USB e Bluetooth
- Mapear qual dispositivo físico corresponde a qual nó de evento do kernel
- Entender como o Steam Input intercepta e re-roteia eventos de input
- Diagnosticar dispositivos que não respondem ou geram eventos errados
- Configurar perfis de controle para jogos que não têm suporte nativo
:::

## A árvore de dispositivos de entrada

Quando você conecta um teclado USB ao dock, o kernel cria um novo nó em `/dev/input/` e o associa a um driver. O sistema não faz distinção entre "periférico do Deck" e "acessório plugado" — tudo vira evento de input.

```terminal
$ ls -l /dev/input/ | head -10
total 0
drwxr-xr-x 2 root root     100 Jan  1  2020 by-path
crw-rw---- 1 root input 13, 80 Jan  1  2020 event0
crw-rw---- 1 root input 13, 81 Jan  1  2020 event1
crw-rw---- 1 root input 13, 82 Jan  1  2020 event2
crw-rw---- 1 root input 13, 83 Jan  1  2020 event3
crw-rw---- 1 root input 13, 84 Jan  1  2020 event4
crw-rw---- 1 root input 13, 85 Jan  1  2020 event5
...
```

Para identificar qual `event*` é qual dispositivo, o caminho mais direto é o `libinput`:

```terminal
$ libinput list-devices | grep -A1 -E 'Device:|Kernel:'
Device:           Valve Software Steam Deck
Kernel:           /dev/input/event5
--
Device:           Logitech K120
Kernel:           /dev/input/event9
--
Device:           SteelSeries Rival 3
Kernel:           /dev/input/event10
```

Aqui o Deck expõe seus controles nativos em `event5`, um teclado USB Logitech K120 em `event9` e um mouse SteelSeries Rival 3 em `event10`. Cada dispositivo é independente — mas o Steam Input pode juntá-los se você quiser.

## O Steam Input como camada de tradução

O Steam Input não é só um remapeador de botão: é um middleware que intercepta eventos de input **antes** de eles chegarem ao jogo e os traduz conforme um perfil. Isso significa que um controle de Xbox pode ser visto pelo jogo como teclado e mouse, ou vice-versa, ou que o toque do touchpad direito pode ser um movimento de mouse, um scroll, uma tecla ou um macro.

```terminal
$ lsusb | grep -E 'Controller|Keyboard|Mouse'
Bus 001 Device 004: ID 045e:028e Microsoft Corp. Xbox360 Controller
Bus 001 Device 005: ID 046d:c31c Logitech, Inc. Wireless Keyboard K120
Bus 001 Device 006: ID 1038:1720 SteelSeries ApS Rival 3
```

O `lsusb` confirma que o kernel reconhece os três dispositivos: controle Xbox 360, teclado e mouse. O Steam Input, rodando como parte do Steam, detecta o controle Xbox e o adiciona ao gerenciador de controles. A partir daí, cada jogo pode receber um perfil diferente.

:::dica
No modo Desktop, o Steam Input só funciona se o Steam estiver rodando (mesmo em segundo plano). Se o Steam não estiver ativo, controles Xbox e PlayStation funcionam como gamepads padrão via `joydev` do kernel — sem remapeamento. Para testar se o controle é visto cru, use `evtest` ou `jstest`.
:::

## Diagnóstico: quando o dispositivo some

O cenário mais frustrante é conectar o teclado e nada acontecer. A ordem de investigação é:

```terminal
$ sudo dmesg | tail -10 | grep -i -E 'usb|input|hid'
[   45.223110] usb 2-1: new full-speed USB device number 3 using xhci_hcd
[   45.374892] usb 2-1: New USB device found, idVendor=046d, idProduct=c31c
[   45.376120] input: Logitech K120 as /devices/pci0000:00/0000:00:08.1/0000:05:00.3/usb2/2-1/2-1:1.0/0003:046D:C31C.0003/input/input9
[   45.377841] hid-generic 0003:046D:C31C.0003: input,hidraw2: USB HID v1.11 Keyboard [Logitech K120] on usb-0000:05:00.3-1/input0
```

Se o `dmesg` mostra `New USB device found` mas o teclado não digita, o problema está entre o kernel e o servidor gráfico (X11/Wayland). Reinicie o Steam ou o modo Desktop. Se `dmesg` **não** mostra nada, o problema é físico: cabo, porta ou dispositivo queimado.

```terminal
$ cat /proc/bus/input/devices | grep -A4 'Logitech'
I: Bus=0003 Vendor=046d Product=c31c Version=0111
N: Name="Logitech K120"
P: Phys=usb-0000:05:00.3-1/input0
S: Sysfs=/devices/pci0000:00/0000:00:08.1/0000:05:00.3/usb2/2-1/2-1:1.0/0003:046D:C31C.0003/input/input9
```

O `/proc/bus/input/devices` lista tudo que o subsistema de input enxerga com detalhes que `libinput` resume — útil para ver `Vendor=046d Product=c31c` e confirmar que o VID:PID bate com `lsusb`.

:::atencao
Hubs baratos às vezes "derrubam" o barramento USB do Deck. Se conectar um teclado num hub barato e o `dmesg` mostrar erros do tipo `-71` ou `device descriptor read/64 error`, o hub é suspeito. Conecte o teclado direto na porta USB-C e veja se funciona. Se funcionar, troque de hub.
:::

## Controles de outras plataformas

O Deck suporta controle Xbox (todos), DualShock 4 (PS4), DualSense (PS5) e Nintendo Switch Pro Controller, tanto por USB quanto por Bluetooth. Cada um tem suas peculiaridades:

```terminal
$ lsusb | grep -E 'Sony|DualSense'
Bus 001 Device 007: ID 054c:0ce6 Sony Corp. DualSense wireless controller (PS5)
```

O DualSense é reconhecido nativamente e o Steam Input o expõe com todos os recursos — touchpad, giroscópio, gatilhos adaptativos e até o LED. O `hid-playstation` do kernel (embutido no kernel do SteamOS) é o driver por trás disso.

```terminal
$ libinput list-devices | grep -A6 'DualSense'
Device:           Sony Interactive Entertainment DualSense Wireless Controller
Kernel:           /dev/input/event11
Group:            4
Seat:             seat0, default
Capabilities:     keyboard, pointer, touch
```

O `libinput` mostra que o DualSense aparece com capacidades de `keyboard, pointer, touch` — o touchpad do controle é reconhecido como ponteiro. Isso abre possibilidades como usar o touchpad do DualSense para controlar o cursor no modo Desktop.

:::dica
Se o DualSense funcionar por USB mas não por Bluetooth, entre no modo Desktop, abra as configurações de Bluetooth e faça o pareamento. O SteamOS usa o BlueZ como stack Bluetooth, e o pareamento persiste entre modos.
:::

## Resumo

- Todo periférico USB e Bluetooth vira um nó `/dev/input/event*` gerenciado pelo kernel.
- `libinput list-devices` mapeia nomes amigáveis para nós de evento; `lsusb` confirma VID:PID.
- O Steam Input intercepta eventos e os traduz por perfil de jogo; sem o Steam rodando, controles funcionam como gamepads padrão via `joydev`.
- `dmesg` e `/proc/bus/input/devices` diagnosticam quando um dispositivo não é reconhecido.
- Controles Xbox, PlayStation e Nintendo Switch Pro são suportados nativamente, inclusive por Bluetooth.

## Exercícios

1. Conecte um teclado USB ao Deck e rode `libinput list-devices`. Identifique o nó `event*` do teclado e anote suas capacidades (keyboard, pointer, etc.).
2. Use `sudo evtest` (escolha o nó do teclado) e pressione `W`, `A`, `S`, `D`. Anote os keycodes. Para que servem esses keycodes no contexto de um jogo que usa WASD?
3. Conecte um controle que não seja o nativo do Deck (Xbox, PS4, PS5, Switch) e veja como ele aparece em `lsusb` e `libinput`.
4. No modo Desktop, feche o Steam e abra `jstest --event /dev/input/js0` (ajuste o device). Mexa os analógicos — os valores absolutos aparecem em tempo real?
5. **Desafio.** Conecte um teclado USB e um mouse USB ao dock, entre no modo Desktop e abra o Steam. Configure um perfil de Steam Input para um jogo que não tem suporte a controle nativo: mapeie WASD para o analógico esquerdo, mouse para o touchpad direito e `E` (interagir) para o botão `A`. Jogue 5 minutos e relate se a tradução do Steam Input foi fiel ou se houve latência/erros de mapeamento.