O modelo LCD do Steam Deck tem entrada de 3,5 mm para fone; o OLED não tem — a Valve removeu o conector para ganhar espaço interno e apostar em USB-C e Bluetooth. Isso faz do áudio um território de acessórios: DACs USB-C, fones Bluetooth e até saída de som pelo dock, via HDMI. O PipeWire (sucessor do PulseAudio) gerencia todas essas fontes e permite rotear o áudio para onde você quiser.

:::objetivos
- Entender as saídas de áudio disponíveis no Deck LCD e OLED
- Listar e alternar dispositivos de saída com `pactl` no PipeWire
- Reconhecer DACs USB e players por tipo de codec
- Diagnosticar fones Bluetooth que não aparecem ou não conectam
- Roteirar áudio entre fone, alto-falante e monitor HDMI
:::

## As saídas de áudio do Deck

O Deck tem quatro caminhos de áudio principais:

- **Alto-falantes internos** — dois frontais, gerenciados pelo codec da placa.
- **Fone de 3,5 mm** — só no modelo LCD.
- **USB-C / DAC** — áudio digital pelo conector, para DACs e fones USB.
- **HDMI/DisplayPort via dock** — áudio digital embutido no sinal de vídeo.

```terminal
$ pactl list short sinks
0	alsa_output.pci-0000_05_00.6.analog-stereo	PipeWire	s16le 2ch 44100Hz	RUNNING
1	alsa_output.pci-0000_05_00.1.hdmi-stereo	PipeWire	s16le 2ch 44100Hz	IDLE
```

O `pactl` (que fala com o PipeWire) lista dois *sinks*: o `analog-stereo` (alto-falante interno ou fone 3,5 mm do LCD) e o `hdmi-stereo` (áudio que sai pelo dock para o monitor). O `RUNNING` marca qual está ativo agora.

:::nota
O SteamOS 3.x usa PipeWire, que mantém compatibilidade com as ferramentas do PulseAudio — por isso `pactl` continua funcionando. O PipeWire também é o que roteia áudio para captura/streaming e gerencia o perfil Bluetooth.
:::

## Alternando a saída e roteando o som

Mudar a saída padrão é uma linha:

```terminal
$ pactl set-default-sink alsa_output.pci-0000_05_00.1.hdmi-stereo
$ pactl list short sinks | grep RUNNING
1	alsa_output.pci-0000_05_00.1.hdmi-stereo	PipeWire	s16le 2ch 44100Hz	RUNNING
```

Agora o som sai pelo monitor HDMI. Para rotear **só um aplicativo** para uma saída específica, o PipeWire permite isso com o `pw-cli`, mas no dia a dia do Deck a interface gráfica do modo Desktop (configurações de som) já faz o trabalho visualmente.

```terminal
$ pactl list sink-inputs short
42	1	64	PipeWire	application.name = "Steam"
```

O `sink-inputs` lista os fluxos de áudio ativos — aqui o Steam (id 42) está tocando no sink 1. Se você quisesse mover só o Steam para outro sink, o `pactl move-sink-input 42 <sink>` resolve.

:::dica
Quando você conecta o Deck num dock e num monitor com áudio, o PipeWire pode trocar a saída padrão para HDMI automaticamente. Se o som "sumiu" depois de plugar o dock, rode `pactl list short sinks` e cheque qual está `RUNNING` — provavelmente a saída HDMI assumiu.
:::

## DACs USB e o caminho do áudio limpo

Um DAC USB-C (Digital-to-Analog Converter) tira o áudio digital da porta USB-C e o converte para sinal analógico fora do Deck, com um chip dedicado. O resultado é som mais limpo e, em muitos casos, mais potência para fones de impedância alta. Para o Steam Deck, um *dongle* DAC simples (estilo Apple ou JSAUX) já melhora sensivelmente a qualidade em relação ao fone direto.

```terminal
$ sudo dmesg | grep -i -E 'usb|audio|snd' | tail -5
[   88.112340] usb 1-1: New USB device found, idVendor=2e4d, idProduct=5591
[   88.115870] usb 1-1: New USB device strings: Mfr=1, Product=2
[   88.118221] usb 1-1: Product: USB Audio
[   88.122890] usb 1-1: Manufacturer: Generic
[   88.130094] input: USB Audio as /devices/.../input/input12
```

O `dmesg` mostra o DAC sendo reconhecido como "USB Audio". Em seguida, ele aparece no PipeWire como um novo sink:

```terminal
$ pactl list short sinks | grep -i usb
2	alsa_output.usb-Generic_USB_Audio-00.analog-stereo	PipeWire	s16le 2ch 48000Hz	IDLE
```

Agora há três sinks, e o `usb-Generic_USB_Audio` pode ser definido como padrão para ouvir pelo fone plugado no DAC. A taxa de amostragem (`48000Hz`) aparece maior que a do alto-falante interno em alguns casos — sinal de que o DAC está reclamarando o sinal para a taxa nativa dele.

:::atencao
Nem todo fone USB funciona direto no Deck. Fones "gamer USB" com chip de som próprio e botão de mute são reconhecidos como dispositivos HID + áudio, e o botão de mute pode aparecer como um teclado extra. Se o fone USB não emitir som, rode `pactl list short sinks` e verifique se o sink USB existe e está `RUNNING` — às vezes basta definir o sink padrão manualmente.
:::

## Bluetooth no Deck

O áudio Bluetooth é o caminho mais comum para quem quer fones sem fio. O pareamento é feito no modo Desktop e persiste para o modo Gaming. A latência, porém, é a pegadinha: jogos exigem resposta imediata, e o codec padrão (SBC) tem atraso perceptível.

```terminal
$ bluetoothctl devices
Device 88:C9:E8:3B:1A:02 airpods-pro
Device 5C:FB:7C:E2:9D:41 JBL Live 660NC
```

O `bluetoothctl` lista dispositivos pareados. Para ver codec e qualidade do que está conectado, o PipeWire/BT dá detalhes internos, mas o `bluetoothctl info` mostra o básico do dispositivo.

```terminal
$ bluetoothctl info 88:C9:E8:3B:1A:02 | grep -E 'Name|Connected|Icon'
	Name: airpods-pro
	Connected: yes
	Icon: audio-headset
```

Para minimizar a latência em jogos, prefira fones que suportem codecs de baixa latência (aptX Low Latency, LDAC, ou o AAC dos AirPods quando o codec é bem negociado). Fones com modo "gaming" proprietário também ajudam, mas o limite físico do Bluetooth continua existindo — áudio sem fio sempre terá mais atraso que o 3,5 mm ou o DAC USB.

:::exemplo
Ana testou jogar um FPS com fones Bluetooth SBC e sentiu o som do tiro chegar "atrasado" em relação ao gatilho. Ao trocar para o fone de 3,5 mm no Deck LCD, o atraso sumiu. A lição: para jogos competitivos, prefira áudio com fio; Bluetooth fica ótimo para jogos casuais, navegação e filmes.
:::

## Resumo

- O Deck LCD tem fone 3,5 mm e o OLED não; ambos têm alto-falantes, USB-C e áudio via dock (HDMI/DP).
- `pactl list short sinks` lista as saídas; `set-default-sink` muda a padrão e `list sink-inputs` mostra fluxos por app.
- O PipeWire mantém compatibilidade com o PulseAudio, então `pactl` funciona no SteamOS 3.x.
- DACs USB aparecem como novos sinks (`usb-*`) e `dmesg` confirma o reconhecimento como "USB Audio".
- Áudio Bluetooth funciona, mas a latência do SBC incomoda em jogos competitivos; fio é sempre o caminho de menor atraso.

## Exercícios

1. Rode `pactl list short sinks` e identifique todos os sinks de saída disponíveis no seu Deck. Qual está `RUNNING`?
2. Conecte um fone 3,5 mm (LCD) ou um DAC USB (qualquer modelo) e veja como o novo sink aparece em `pactl`. Defina-o como padrão e confirme.
3. Com áudio tocando (ex.: um vídeo no navegador), rode `pactl list sink-inputs short` e identifique o fluxo do navegador. Mova-o para outro sink com `pactl move-sink-input`.
4. Pareie um fone Bluetooth no modo Desktop e rode `bluetoothctl info <MAC>` para ver nome e status de conexão.
5. **Desafio.** Jogue (ou assista a um vídeo) comparando a latência entre três saídas: alto-falante interno, fone com fio (3,5 mm ou DAC USB) e fone Bluetooth. Descreva a diferença percebida e relacione com o caminho do sinal em cada caso, usando `pactl` para mostrar a taxa de amostragem e o sink ativo de cada configuração.