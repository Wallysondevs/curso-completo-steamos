Quando um periférico não aparece, não conecta ou se comporta mal, a culpa raramente está no periférico — quase sempre é um elo na cadeia entre ele e o sistema: o rádio desligado, o kernel que não carregou o driver, um conflito de módulo ou um problema no cabelo do barramento. Esta seção ensina a percorrer essa cadeia de trás para frente usando duas ferramentas centrais: o `dmesg` (o diário do kernel) e o `rfkill` (o estado físico dos rádios sem fio).

:::objetivos
- Ler o diário do kernel com `dmesg` filtrado por USB e Bluetooth
- Entender e manipular o `rfkill` para ligar e desligar rádios
- Correlacionar um dispositivo USB ao seu driver
- Diagnosticar a ausência de hardware com mensagens de erro do kernel
:::

## O diário do kernel como primeira parada

Toda vez que um dispositivo é conectado, desconectado ou falha na inicialização, o kernel escreve no seu buffer de mensagens. O `dmesg` lê esse buffer, e a filtragem por `grep` leva você direto ao que interessa. A forma mais usada neste capítulo é filtrar por USB:

```terminal
$ sudo dmesg | grep -i usb
[    3.201134] usbcore: registered new interface driver usb-storage
[    3.215867] usbcore: registered new interface driver usbhid
[    3.216010] usbhid: USB HID core driver
[  145.821120] usb 3-2: Product: HD Pro Webcam C920
[  145.821134] usb 3-2: Manufacturer: Logitech
```

As três primeiras linhas são do **boot**: o kernel registrando os drivers de armazenamento (`usb-storage`) e de dispositivos de entrada (`usbhid`). As duas últimas são de uma conexão recente — note o carimbo `[ 145.82...]`, que é o tempo em segundos desde o boot. Misturar mensagens de boot com mensagens de conexão é a pegadinha clássica: o `dmesg` mostra tudo em ordem cronológica, então você precisa prestar atenção ao carimbo de tempo.

Para filtrar por Bluetooth, o mesmo padrão:

```terminal
$ sudo dmesg | grep -i bluetooth
[    4.112105] Bluetooth: Core ver 2.22
[    4.112142] Bluetooth: HCI device and connection manager initialized
[    4.112150] Bluetooth: HCI socket layer initialized
[    4.112158] Bluetooth: L2CAP socket layer initialized
[    4.116291] Bluetooth: hci0: BCM: chip id 107
[    4.118401] Bluetooth: hci0: firmware Patch file not found (-2)
```

Veja a última linha: `firmware Patch file not found (-2)`. O adaptador Bluetooth do Deck usa um chip Broadcom (`BCM`) que precisa de um arquivo de firmware para funcionar; quando esse arquivo não está disponível, o rádio não sobe — e nenhum `pair` do `bluetoothctl` vai funcionar, por mais que você tente. Essa é a diferença entre "o rádio está desligado" (resolve com `rfkill` ou `power on`) e "o rádio nem inicializou" (resolve com firmware/atualização).

:::nota
O buffer do `dmesg` é circular: mensagens antigas podem ser sobrescritas conforme outras chegam. Para o histórico persistente de *todas* as mensagens do kernel desde o boot, use o `journalctl -k` (ou `journalctl -b -k` para só o boot atual), que lê o mesmo conteúdo mas sem a limitação do buffer.
:::

## `rfkill`: o interruptor dos rádios

`rfkill` é o subsistema do Linux que controla o **bloqueio físico dos rádios** — Wi-Fi, Bluetooth, WWAN (modem celular) e UWB. É o equivalente digital do interruptor de hardware que alguns notebooks têm. Quando um rádio está "hard blocked" ou "soft blocked", o sistema age como se ele nem existisse, por mais que o driver esteja carregado.

```terminal
$ rfkill list
0: phy0: Wireless LAN
	Soft blocked: no
	Hard blocked: no
1: hci0: Bluetooth
	Soft blocked: no
	Hard blocked: no
```

Cada rádio tem um índice (`0`, `1`...), um nome (`phy0` para Wi-Fi, `hci0` para Bluetooth), o tipo (`wlan`, `bluetooth`) e dois estados: `Soft blocked` (bloqueio por software, que você muda com comando) e `Hard blocked` (bloqueio por hardware, interruptor físico ou tecla de avião). Para o Bluetooth funcionar, os dois precisam estar em `no`.

Para desbloquear um rádio via software:

```terminal
$ rfkill unblock bluetooth
$ rfkill list
1: hci0: Bluetooth
	Soft blocked: no
	Hard blocked: no
```

`rfkill unblock bluetooth` remove o bloqueio por software do rádio Bluetooth; `block` faz o contrário. Se o `Hard blocked` ficasse em `yes`, nenhum comando resolveria — seria um interruptor físico (que o Deck não tem como hardware dedicado, então Hard blocked no Deck quase sempre indica um problema de firmware ou de gerenciamento de energia, não um botão). 

:::atencao
Confundir `rfkill` com o estado do daemon é um erro comum. O `rfkill` controla o **rádio** (se há sinal físico para transmitir); o `systemctl status bluetooth` controla o **daemon** (se o software que gerencia o rádio está de pé). Um rádio desbloqueado com o daemon parado é tão inútil quanto o contrário — os dois precisam estar bem.
:::

## Correlacionando dispositivo a driver

Quando um periférico conecta mas o driver não é o certo (ou não há driver algum), o sintoma é o mesmo: o dispositivo aparece no `lsusb` mas não "funciona" — sem som, sem vídeo, sem entrada. A pergunta seguinte é: *qual driver o kernel associou a ele?* O próprio `lsusb` responde quando você pede os detalhes:

```terminal
$ lsusb -t
/:  Bus 03.Port 1: Dev 1, Class=root_hub, Driver=xhci_hcd/1p, 5000M
    |__ Port 1: Dev 2, If 0, Class=Hub, Driver=hub/4p, 5000M
        |__ Port 1: Dev 4, If 0, Class=Mass Storage, Driver=usb-storage, 5000M
```

A coluna `Driver=` mostra o módulo do kernel que assumiu cada dispositivo (`usb-storage` para o disco, `hub` para o hub, `r8152` para a placa de rede no exemplo da seção anterior). Se um dispositivo aparece com a classe certa mas com o driver errado ou vazio, há duas possibilidades: o módulo não está carregado, ou o kernel não tem suporte para aquele chip específico.

A forma de listar os módulos carregados e filtrar pelo que interessa é o `lsmod` (que você já viu em capítulo anterior) combinado com `grep`:

```terminal
$ lsmod | grep -E 'uvc|btusb|snd_usb'
uvcvideo              139264  0
btusb                  81920  2 btrtl,btbcm
snd_usb_audio         401408  1
```

Aqui estão os três drivers de periféricos mais relevantes deste capítulo: `uvcvideo` (webcams), `btusb` (Bluetooth, com as dependências `btrtl` e `btbcm`) e `snd_usb_audio` (áudio USB). A coluna `Used by` com `0` em `uvcvideo` indica que o módulo está carregado mas nenhum dispositivo o está usando *naquele instante* — não que ele seja inútil.

## O fluxo de diagnóstico completo

Juntando tudo, o diagnóstico de "meu periférico não funciona" segue uma ordem que vai do mais grosseiro ao mais fino:

```terminal
$ rfkill list            # o rádio está desbloqueado? (se for sem fio)
$ systemctl status bluetooth   # o daemon está ativo? (se for Bluetooth)
$ lsusb                  # o kernel enxerga o dispositivo?  (se for USB)
$ sudo dmesg | grep -i -E 'usb|bluetooth|firmware'   # houve erro na enumeração?
$ lsmod | grep -E 'uvc|btusb|usb_storage'            # o driver certo está carregado?
```

Cada comando elimina uma camada. Na prática, noventa por cento dos casos caem em três respostas: rádio bloqueado (`rfkill`), daemon parado (`systemctl`), ou erro de firmware/enumeração visível no `dmesg`. O restante é hardware com driver ausente ou cabo/conector defeituoso — que você confirma trocando de porta, de cabo e de dock.

## Resumo

- `dmesg` é o diário do kernel; filtre por `grep -i usb`, `bluetooth` ou `firmware` para achar mensagens de enumeração e falha.
- As mensagens do `dmesg` trazem carimbo de tempo em segundos desde o boot; não confunda mensagens de boot com conexões recentes.
- `rfkill list` mostra o estado dos rádios; `Soft blocked`/`Hard blocked` precisam ambos estar `no` para o sem fio funcionar.
- `lsusb -t` (coluna `Driver=`) e `lsmod` correlacionam dispositivo a módulo de kernel.
- O diagnóstico segue a ordem rádio → daemon → dispositivo → driver, do mais grosseiro ao mais fino.

## Exercícios

1. Rode `rfkill list` e transcreva o estado de `Soft blocked` e `Hard blocked` de cada rádio.
2. Execute `sudo dmesg | grep -i bluetooth` e identifique se há a linha `firmware Patch file not found` ou algo equivalente.
3. Conecte um pendrive e use `lsusb -t` para descobrir qual `Driver=` o kernel atribuiu a ele.
4. Filtre os módulos com `lsmod | grep -E 'uvc|btusb|usb_storage'` e interprete a coluna `Used by`.
5. **Desafio.** Bloqueie o Bluetooth com `rfkill block bluetooth`, verifique no `rfkill list`, depois tente um `bluetoothctl scan on` e registre o erro. Desbloqueie com `rfkill unblock bluetooth` e confirme que o escaneamento volta a funcionar.
