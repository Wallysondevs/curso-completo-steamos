Os controles da linha Xbox — desde o Xbox 360 até a linha Series — são nativos do ecossistema Microsoft e, por ironia, funcionam tão bem no Linux quanto os da própria Sony. O driver `xpad` vive dentro do kernel desde o início dos anos 2000 e cobre praticamente todos os modelos. A diferença de experiência entre eles está mais no transporte (dongle sem fio, Bluetooth, USB) do que no driver.

:::objetivos
- Conectar controles Xbox por USB e confirmar o driver `xpad`
- Usar o dongle oficial da Microsoft com o driver alternativo `xone`
- Entender as limitações do Bluetooth nos modelos mais antigos
- Parear controles genéricos que emulam o protocolo Xbox
:::

## Xbox por USB: a rota infalível

Conecte qualquer controle Xbox por USB e o `xpad` assume. A confirmação vem em dois lugares: no `dmesg` e na listagem de módulos.

```terminal
$ sudo dmesg | grep -i xpad
[  342.119034] xpad 0003:045E:02EA.0001: input,hidraw5: USB HID v1.11 Gamepad [Generic X-Box pad] on usb-0000:00:14.0-2/input0
$ lsmod | grep xpad
xpad                   57344  0
ff_memless             20480  1 xpad
```

O módulo `ff_memless` — que aparece como dependente do `xpad` — é o driver de *force feedback* simplificado, responsável pela vibração. O `xpad` suporta vibração em todos os modelos cabeados, mas a intensidade e o padrão dependem do jogo.

:::nota
O ID de vendedor `045E` pertence à Microsoft. O ID de produto varia: `02EA` (Xbox One S), `0B13` (Xbox Series X), `028E` (Xbox 360). O kernel reconhece todos e usa o mesmo driver `xpad` para a família inteira.
:::

## O dongle sem fio e o driver xone

Os controles Xbox usam um protocolo de rádio proprietário no dongle oficial da Microsoft, não Bluetooth. Esse dongle não funciona com o `xpad` padrão — ele precisa do driver `xone`, mantido pela comunidade.

No SteamOS, `xone` não vem no kernel padrão, mas está disponível como módulo DKMS (*Dynamic Kernel Module Support*). Para instalá-lo é preciso desabilitar o modo somente-leitura (consulte o [capítulo sobre jailbreak](#/cap-081/sec-02)) e instalar o pacote via `pacman` ou compilar do GitHub.

```terminal
$ git clone https://github.com/medusalix/xone
$ cd xone
$ sudo make install
$ sudo modprobe xone-dongle
$ lsmod | grep xone
xone_dongle            32768  0
xone_wired             24576  0
xone_gip               65536  2 xone_dongle,xone_wired
```

Depois de carregar o módulo, o dongle aparece como `dmesg | grep xone` e os controles pareiam pelo botão de sincronia do próprio dongle, sem `bluetoothctl`. A vibração e o áudio pelo controle também funcionam.

:::dica
Se você joga com vários controles Xbox (até oito), o dongle oficial é a única rota viável — o Bluetooth padrão só aceita dois controles por vez e a latência sobe com múltiplos aparelhos. O protocolo proprietário foi projetado para lidar com oito controles simultâneos.
:::

## Modelos com Bluetooth

A partir do Xbox One S (revisão 2016), os controles ganharam Bluetooth — mas só uma revisão. Os modelos originais Xbox One (sem Bluetooth) só conectam via USB ou dongle. Identifique o seu pela carcaça: se a região ao redor do botão Xbox é lisa (sem o detalhe plástico da parte de cima), ele tem Bluetooth.

```terminal
$ bluetoothctl scan on
Discovery started
[NEW] Device F4:6D:3F:XX:XX:XX Xbox Wireless Controller
```

O pareamento via `bluetoothctl` segue o mesmo ritual do DualSense (`scan`, `pair`, `trust`, `connect`), mas com uma diferença sutil: os controles Xbox costumam pedir confirmação de pareamento no `bluetoothctl` com pergunta de PIN. Responda `yes` e o kernel resolve o resto.

:::atencao
A vibração por Bluetooth não funciona com o `xpad` padrão. É uma limitação do subsistema de força de feedback via Bluetooth no kernel Linux. Se você quer vibração sem fio em controle Xbox, a única saída é o dongle oficial com o `xone`.
:::

## Controles genéricos e clones

Existe um mercado imenso de controles "compatíveis com Xbox" — da 8BitDo, Gamesir e similares — que se anunciam como Xbox 360 ou Xbox One no descritor HID. O kernel os trata como controles Microsoft genuínos e aplica o `xpad`. O Steam Input também os enxerga normalmente.

```terminal
$ lsusb | grep -i pad
Bus 001 Device 008: ID 2dc8:3106 8BitDo Ultimate C gamepad
$ sudo dmesg | tail -4
[  523.110488] xpad 0003:2DC8:3106.0003: input,hidraw9: USB HID v1.11 Gamepad [8BitDo Ultimate C] on usb-0000:00:14.0-3/input0
```

Repare que o fabricante é 8BitDo (`2DC8`), mas o driver que assume é o `xpad`. Isso funciona porque o controle declarou compatibilidade HID com o layout Xbox.

:::perigo
Controles muito baratos (genéricos "sem marca") às vezes não implementam o descritor HID corretamente. O kernel pode reconhecê-los como genérico e carregar apenas o `hid` básico — sem vibração, sem giroscópio, e com os botões mapeados em ordem errada. Antes de comprar, pesquise se o modelo específico aparece na base de dados de `lsusb` do Linux.
:::

## Resumo

- O driver `xpad` cobre todos os controles Xbox por USB, com suporte a vibração.
- O dongle oficial exige o driver `xone` (DKMS), mas suporta até oito controles com vibração.
- Controles Xbox com Bluetooth funcionam via `bluetoothctl`, mas perdem vibração.
- Modelos anteriores ao Xbox One S não têm Bluetooth; só conectam por USB ou dongle.
- Controles de terceiros compatíveis com Xbox usam o mesmo driver `xpad`.
- Clones baratos podem carregar apenas o driver `hid` genérico, sem recursos avançados.

## Exercícios

1. Conecte um controle Xbox por USB, identifique-o com `lsusb` e confirme o módulo carregado com `lsmod | grep xpad`.
2. Se você tem um controle com Bluetooth, tente o pareamento via `bluetoothctl` e verifique com `bluetoothctl info` se `Connected` está `yes`.
3. Teste a vibração: abra um jogo que a suporte e compare o comportamento em USB (com vibração) e em Bluetooth (provavelmente sem).
4. Com o controle conectado em USB, rode `cat /proc/bus/input/devices | grep -A 5 xpad` e identifique os arquivos `event*` que correspondem ao controle.
5. **Desafio.** Se você tem acesso ao dongle oficial, instale o `xone` pelo GitHub e compare a latência e a vibração contra o Bluetooth. Anote qual oferece a melhor experiência e por quê.