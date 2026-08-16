O Steam Deck tem uma única porta USB-C. Para conectar mouse, teclado, webcam, impressora, pendrive, monitor e carregador ao mesmo tempo, você passa por um **dock** ou **hub**, que multiplica essa porta em várias. Entender a topologia USB — quem está pendurado em quem, qual é a versão da porta (2.0, 3.0) e como o kernel enumera os dispositivos — evita surpresas como "o pendrive aparece mas o monitor não", ou "o carregador não dá conta".

:::objetivos
- Ler a árvore USB com `lsusb -t` e interpretar hubs e speeds
- Distinguir USB 2.0 de USB 3.0 e o impacto em periféricos
- Entender alimentação e o papel do USB-C Power Delivery no dock
- Diagnosticar queda de conexão em hubs USB lotados
:::

## A árvore USB pelo `lsusb -t`

O USB é hierárquico: existe um *root hub* (controlador) no chip, e a partir dele se penduram dispositivos ou outros hubs. Um dock é, na prática, um hub com circuitos extras (vídeo, rede, energia). O `lsusb -t` desenha essa árvore:

```terminal
$ lsusb -t
/:  Bus 04.Port 1: Dev 1, Class=root_hub, Driver=xhci_hcd/1p, 10000M
/:  Bus 03.Port 1: Dev 1, Class=root_hub, Driver=xhci_hcd/1p, 5000M
    |__ Port 1: Dev 2, If 0, Class=Hub, Driver=hub/4p, 5000M
        |__ Port 1: Dev 4, If 0, Class=Mass Storage, Driver=usb-storage, 5000M
        |__ Port 2: Dev 5, If 0, Class=Communications, Driver=r8152, 5000M
/:  Bus 02.Port 1: Dev 1, Class=root_hub, Driver=xhci_hcd/1p, 480M
    |__ Port 1: Dev 2, If 0, Class=Hub, Driver=hub/4p, 480M
        |__ Port 2: Dev 3, If 0, Class=Hub, Driver=hub/4p, 480M
/:  Bus 01.Port 1: Dev 1, Class=root_hub, Driver=xhci_hcd/1p, 480M
    |__ Port 1: Dev 2, If 0, Class=Human Interface Device, Driver=usbhid, 12M
```

O número no fim de cada linha é a **velocidade** da porta em megabits por segundo. Leia os valores-chave: `10000M` (10 Gbps = USB 3.1/3.2), `5000M` (5 Gbps = USB 3.0), `480M` (USB 2.0) e `12M` (USB 1.1). Cada Bus é um controlador raiz (`xhci_hcd`), e os `Class=Hub` são os pontos de multiplicação.

Nessa árvore, o pendrive (Mass Storage) e a placa de rede (Communications, `r8152`) estão num **hub de 5 Gbps** — ou seja, compartilham a largura de banda do USB 3.0. O teclado/mouse (Human Interface Device) está separado, num hub de 480 Mbps, porque periféricos de entrada não precisam de velocidade.

## USB 2.0 vs 3.0: por que o pendrive fica lento

A pergunta "por que minha cópia está travada em 40 MB/s" quase sempre se responde olhando a árvore. Se um SSD externo USB 3.0 (capaz de 400+ MB/s) está pendurado num hub de `480M`, ele negocia na velocidade mais baixa do elo mais lento do caminho — ou seja, USB 2.0 puro, ~40 MB/s de teto teórico.

```terminal
$ lsblk -o NAME,SIZE,TYPE,MOUNTPOINT
NAME        SIZE TYPE MOUNTPOINT
mmcblk0   119.1G disk
└─mmcblk0p1 64G part
nvme0n1   476.9G disk
├─nvme0n1p1 64M part
└─nvme0n1p2 476.9G part /
sda        14.9G disk
└─sda1     14.9G part /run/media/deck/PENDRIVE
```

O `lsblk` lista os dispositivos de **bloco** (discos) que o sistema enxerga, incluindo o pendrive conectado, que aparece como `sda` montado em `/run/media/deck/PENDRIVE`. O `lsblk` mostra *que* o pendrive está lá; o `lsusb -t` mostra *a que velocidade* ele está conectado. Os dois juntos fecham o diagnóstico.

:::dica
Para medir a velocidade real de um pendrive e confirmar se o elo USB está caprichando, use o `dd` com leitura do `/dev/zero` para um arquivo de teste dentro do pendrive e depois descarte. Uma taxa ao redor de 40 MB/s denuncia elo 2.0; acima de 100 MB/s, você está num elo 3.0 de verdade.
:::

## Energia: o USB-C Power Delivery e os limites

O dock oficial do Steam Deck entrega energia ao aparelho pelo mesmo cabo USB-C que carrega vídeo e dados, usando o padrão **USB Power Delivery (PD)**. O carregador original fornece 45 W, o suficiente para carregar o Deck enquanto ele joga; mas se o dock alimenta também SSD, webcam e outros periféricos, a conta muda.

Quando a alimentação é insuficiente, o kernel registra o problema e, em casos extremos, desliga o dispositivo:

```terminal
$ sudo dmesg | grep -i -E 'over-current|under-voltage|power'
[   92.104331] usb 1-1-port1: over-current condition
[   92.204331] hub 1-1:1.0: hub_port_status failed (err = -71)
```

`over-current condition` indica que um dispositivo naquela porta puxou mais corrente do que o hub pode fornecer, e o hub cortou a energia da porta. Isso derruba o dispositivo e, se for um hub intermediário, leva junto tudo que está pendurado nele. A solução é separar os dispositivos de maior consumo, usar um hub **alimentado** (que tem fonte própria) ou um carregador de maior potência (65 W+).

:::atencao
Nem todo hub barato respeita o padrão Power Delivery direitinho. Um hub sem um chip PD correto pode não repassar os 45 W do carregador ao Deck — o aparelho emite um aviso de "carregamento lento" e, jogando, a bateria pode até descarregar em vez de carregar. Teste sempre se o Deck reconhece a carga plena após plugar o dock.
:::

## Quando a porta USB "some" sozinha

Com muitos dispositivos pendurados, pode acontecer de um deles (ou um hub inteiro) sumir espontaneamente do sistema. O sintoma é o pendrive desmontar sozinho ou o teclado parar de responder do nada. O `dmesg` registra a queda e a recarga do driver:

```terminal
$ sudo dmesg | grep -i usb
[  312.771204] usb 3-1: USB disconnect, device number 4
[  312.784120] sd 8:0:0:0: [sda] tag#0 FAILED Result: hostbyte=DID_ERROR driverbyte=DRIVER_OK
[  312.784131] sd 8:0:0:0: [sda] No Caching mode page found
[  313.918401] usb 3-1: new high-speed USB device number 5 using xhci_hcd
```

A sequência `disconnect` seguida de `new high-speed USB device` mostra o dispositivo sendo desligado e re-enumerado, ganhando até um número novo (de `4` para `5`). Causas comuns: cabo com folga, hub sem alimentação suficiente (o dispositivo tenta puxar mais corrente do que o elo aguenta), ou interferência/conector sujo. Se a reconexão vira rotina, troque o cabo, use um hub alimentado e evite encadear muitos hubs em série — cada elo é um ponto de falha.

## Resumo

- `lsusb -t` desenha a hierarquia USB, com a velocidade de cada porta (`10000M`, `5000M`, `480M`, `12M`).
- Dispositivos pendurados num hub compartilham a largura de banda e negociam na velocidade do elo mais lento.
- `lsblk` lista os dispositivos de bloco (discos e pendrives) e onde estão montados.
- O USB-C Power Delivery alimenta o Deck pelo dock; energia insuficiente gera `over-current` no `dmesg` e quedas.
- Reconexões espontâneas aparecem no `dmesg` como `USB disconnect` + re-enumeração; geralmente é cabo, alimentação ou hub em série.

## Exercícios

1. Rode `lsusb -t` com o Deck no dock e identifique os hubs, a velocidade de cada porta e onde cada periférico está pendurado.
2. Conecte um pendrive e execute `lsblk` para achar o ponto de montagem; cruze com `lsusb -t` para descobrir em que velocidade o elo está.
3. Meça a velocidade de cópia do pendrive com `dd` e relacione o resultado com a velocidade do elo vista na árvore.
4. Rode `sudo dmesg | grep -i usb` e procure por `over-current` ou reconexões; explique o que encontrou (ou a ausência).
5. **Desafio.** Plogue vários periféricos famintos (SSD + webcam + carregador) e monitore `dmesg -w` em tempo real enquanto os conecta um a um. Registre em que ponto aparece `over-current` ou queda, e proponha um rearranjo que estabilize o conjunto.
