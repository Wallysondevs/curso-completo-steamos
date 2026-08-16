O Steam Deck é um PC, e PCs se conectam a monitores, teclados, mouses, controles e discos. A única porta de dados — USB-C — faz todo esse trabalho, mas só quando você entende o que o conector é capaz de entregar. O dock (vendido à parte ou de terceiros) transforma o Deck de portátil em desktop, e a saída de vídeo por DisplayPort alt-mode é o segredo por trás dessa mágica.

:::objetivos
- Entender o que a porta USB-C do Deck entrega: dados, vídeo e energia
- Distinguir os modos USB (host/device) e o DisplayPort alt-mode
- Conectar o Deck a um monitor externo e ajustar resolução
- Reconhecer limites de hubs e docks de terceiros
- Diagnosticar falhas de saída de vídeo e carregamento
:::

## A porta USB-C como porta de tudo

O conector USB-C do Steam Deck não é apenas um formato físico, mas um conjunto de capacidades negociadas eletronicamente entre o Deck e o que estiver do outro lado. O controlador USB dele suporta USB 3.2 Gen 2 (10 Gbps), o que dá transferências de até ~1 GB/s para SSDs externos rápidos.

A mesma porta também entrega **Power Delivery** (PD) para carregar a bateria, até 45 W (15 V / 3 A). E, graças ao **DisplayPort alt-mode**, os pinos do cabo podem ser reutilizados para transportar um sinal de vídeo DisplayPort 1.4 em vez de dados USB — é assim que um único cabo liga o Deck a um monitor 4K e ainda carrega ao mesmo tempo.

```terminal
$ lsusb -t
/:  Bus 001.Port 001: Dev 001, Class=root_hub, Driver=xhci_hcd/2p, 10000M
    |__ Port 001: Dev 002, If 0, Class=Hub, Driver=hub/4p, 5000M
```

O `lsusb -t` mostra a árvore USB com as velocidades negociadas. `xhci_hcd` é o controlador USB 3.x, e os `10000M` (10 Gbps) confirmam o padrão Gen 2. Conectando um hub no Port 001, ele aparece como uma bifurcação de 4 portas a 5 Gbps — a velocidade cai pela metade no hub porque o próprio hub é Gen 1, não o Deck.

:::dica
Para transferências rápidas, ligue o disco externo **direto** na porta USB-C, não através de um hub. Cada intermediário negocia a velocidade de novo e pode limitar o barramento. Use `lsusb -t` para verificar a velocidade real negociada em cada link.
:::

## O dock: transformando o portátil em desktop

O dock oficial da Valve (e docks compatíveis de terceiros) resolve três necessidades de uma vez: fornece energia (via PD), espelha vídeo (DisplayPort ou HDMI) e multiplica portas USB para teclado, mouse e controles. Ele não adiciona processamento gráfico — o dock é passivo, apenas redistribui sinais e alimenta o Deck.

```terminal
$ xrandr | grep -E 'connected|disconnected'
eDP-1 connected primary 1280x800+0+0
HDMI-A-1 connected 1920x1080+1280+0
```

O `xrandr` mostra o painel interno `eDP-1` e o monitor externo `HDMI-A-1`, que aparece ligado em 1920×1080, colocado à direita do painel interno (`+1280+0`). O SteamOS, em modo Desktop, trata os dois como monitores independentes; você pode espelhar ou estender.

A saída DisplayPort do Deck, via alt-mode, consegue empurrar até 4K a 60 Hz ou resoluções maiores com taxas menores. O HDMI aparece só se o dock converter DisplayPort para HDMI internamente — o que a maioria faz. Monitores que só têm HDMI dependem dessa conversão, que é transparente para você mas pode introduzir um atraso de alguns milissegundos.

```terminal
$ cat /sys/class/drm/card0-HDMI-A-1/status
connected
$ cat /sys/class/drm/card0-HDMI-A-1/modes
1920x1080
1920x1080i
1280x720
720x480
```

Ler o status e os modos suportados diretamente do DRM confirma o que o monitor anuncia via EDID (Extended Display Identification Data). O EDID é uma tabela que todo monitor envia ao ser conectado, informando resoluções e taxas suportadas.

## Energia pelo dock e o problema da descarga

Um dock bom fornece energia suficiente para manter o Deck carregado mesmo sob carga máxima de 15 W de TDP. Um dock ruim — ou uma fonte fraca — entrega menos, e aí o Deck consome mais do que recebe: a bateria descarrega mesmo plugado.

```terminal
$ cat /sys/class/power_supply/BAT1/status
Discharging
$ cat /sys/class/power_supply/BAT1/capacity
81
$ cat /sys/class/power_supply/ucsi-source-psy-0-00072/online
1
```

O `ucsi-source-psy-0-00072` é o controlador USB-C que reporta se há um fornecedor de energia conectado (`online 1`). Se o dock estiver alimentando mas o status da bateria continuar `Discharging`, o dock não está entregando os watts que o Deck pediu — típico de fontes de terceiros com PD insuficiente.

:::atencao
O Steam Deck exige uma fonte que negocie Power Delivery a 15 V. Uma fonte USB-C comum de celular, mesmo de 65 W, pode não entregar os 15 V esperados se só anunciar 20 V. Nesse caso o Deck entra em carregamento lento ou não carrega sob carga. Verifique o status real com `cat /sys/class/power_supply/ucsi-source-psy-*/*`, não apenas se o LED acendeu.
:::

## Periféricos: teclado, mouse, controle e áudio

No modo Desktop, o Deck vira um Linux normal e aceita qualquer periférico USB compatível. Teclado e mouse são plug-and-play; controles de outras marcas (DualShock 4, DualSense, Xbox) também aparecem e são capturados pelo Steam Input.

```terminal
$ lsusb
Bus 003 Device 002: ID 045e:028e Microsoft Corp. Xbox360 Controller
Bus 003 Device 003: ID 046d:c31c Logitech, Inc. Wireless Keyboard K120
Bus 003 Device 004: ID 04d9:fc30 Holtek Semiconductor, Inc. USB Gaming Mouse
```

Cada dispositivo reporta seu `VID:PID` (Vendor ID : Product ID). O controle Xbox 360 (`045e:028e`) é reconhecido de imediato — o kernel já embute o driver `xpad` para a família Xbox. O Steam Input então intercepta os eventos e pode remapear o controle como quiser, inclusive misturando-o com os touchpads do próprio Deck.

Para áudio, o modelo LCD tem entrada de 3,5 mm; o OLED não. Em ambos, áudio via USB-C (DAC, híbrido) ou Bluetooth funciona. A saída de som pelo monitor HDMI também aparece como dispositivo de áudio separado.

```terminal
$ pactl list short sinks
0	alsa_output.pci-0000_05_00.1.hdmi-stereo	module-alsa-card.c	s16le 2ch 44100Hz	SUSPENDED
1	alsa_output.pci-0000_05_00.6.analog-stereo	module-alsa-card.c	s16le 2ch 48000Hz	RUNNING
```

O PipeWire (sucessor do PulseAudio) lista as saídas: `hdmi-stereo` é o áudio digital que vai pelo dock para o monitor, e `analog-stereo` é o alto-falante interno ou fone de 3,5 mm. A coluna final mostra qual está ativa (`RUNNING`).

## Resumo

- A porta USB-C do Deck entrega dados (USB 3.2 Gen 2), vídeo (DisplayPort alt-mode) e energia (PD 45 W) num único conector.
- O dock é passivo: redistribui sinais e alimenta o Deck, sem adicionar GPU.
- `xrandr`, `lsusb -t` e os nós `/sys/class/drm/` revelam vídeo, velocidade USB e monitores conectados.
- Uma fonte fraca faz o Deck descarregar mesmo plugado; o controlador `ucsi-source-psy` reporta a negociação PD.
- Periféricos USB (teclado, mouse, controles) são plug-and-play e capturados pelo Steam Input.

## Exercícios

1. Conecte o Deck a um monitor externo via dock e rode `xrandr`. O monitor aparece como `HDMI-A-*` ou `DP-*`? Em que resolução?
2. Com o monitor conectado, leia `cat /sys/class/drm/card0-HDMI-A-*/modes` (ajuste o nome) e liste as resoluções que o monitor anuncia via EDID.
3. Execute `lsusb -t` antes e depois de plugar um hub USB e compare as velocidades negociadas em cada nível da árvore.
4. Conecte um teclado USB e um mouse ao dock. Confirme que aparecem em `lsusb` e, com `evtest`, veja os eventos de tecla gerados ao digitar.
5. **Desafio.** Plugue o Deck numa fonte USB-C de celular (não a original) e deixe um jogo pesado rodando. Monitore `cat /sys/class/power_supply/BAT1/status` a cada 30 segundos por 5 minutos. A bateria sobe, desce ou fica estável? Explique o resultado com base na negociação de Power Delivery que você inspecionou em `ucsi-source-psy`.