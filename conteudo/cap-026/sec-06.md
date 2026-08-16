O Steam Deck vem com uma câmera embutida? Não. Mas o Modo Desktop — rodando KDE Plasma sobre um kernel Linux — suporta qualquer webcam USB que siga o padrão UVC (USB Video Class), que cobre praticamente toda câmera USB fabricada nos últimos quinze anos. Seja para uma chamada de vídeo no Discord ou uma transmissão, plugar uma webcam no dock e fazer funcionar é simples; diagnosticar quando não funciona é o que pede o terminal.

:::objetivos
- Verificar se uma webcam USB é detectada via `lsusb`
- Confirmar o driver UVC em uso com `dmesg`
- Listar os dispositivos de vídeo no `/dev/video*`
- Testar a captura básica com o pacote `v4l-utils`
:::

## O padrão UVC: o que faz a webcam funcionar

A classe UVC (USB Video Class) é um padrão da indústria que define como câmeras USB reportam suas capacidades ao sistema operacional — resoluções, formatos de compressão, taxas de quadros — sem precisar de driver proprietário. O kernel Linux tem um driver UVC robusto desde 2009, e quando você conecta uma webcam USB, esse driver é carregado automaticamente.

O primeiro sinal de que a câmera foi detectada pelo kernel é o aparecimento dela no barramento USB:

```terminal
$ lsusb | grep -i cam
Bus 003 Device 004: ID 046d:0825 Logitech, Inc. HD Pro Webcam C920
```

O par `046d:0825` confirma Logitech C920, uma webcam UVC comum. Só de aparecer no `lsusb` já sabemos que o kernel enxergou o hardware — mas não sabemos se o driver UVC subiu ou se algo falhou na inicialização da câmera.

O `dmesg` responde essa pergunta. O kernel emite mensagens específicas quando carrega o módulo `uvcvideo`:

```terminal
$ sudo dmesg | grep -i uvc
[  145.821120] usb 3-2: Product: HD Pro Webcam C920
[  145.821134] usb 3-2: Manufacturer: Logitech
[  145.912375] uvcvideo: Found UVC 1.00 device HD Pro Webcam C920 (046d:0825)
[  145.945221] uvcvideo 3-2:1.0: Entity type for entity Extension 4 was not initialized!
[  145.945228] uvcvideo 3-2:1.0: Entity type for entity Processing 2 was not initialized!
[  145.945233] uvcvideo 3-2:1.0: Entity type for entity Camera 1 was not initialized!
[  145.945301] input: HD Pro Webcam C920 as /devices/pci0000:00/0000:00:08.1/0000:04:00.3/usb3/3-2/input/input21
```

Duas partes para ler aqui. Primeiro, `Found UVC 1.00 device`: o driver reconheceu o dispositivo como UVC versão 1.00 — isso é bom, o dispositivo é padronizado. Depois, as mensagens `Entity type ... was not initialized` são **avisos** (não erros) que aparecem em muitas webcams e não afetam o funcionamento. Se a webcam não funcionasse, você veria um `error` real, como `uvcvideo: Failed to query ...`.

## Mapeando o dispositivo de vídeo

Uma vez que o driver UVC está carregado, o kernel expõe a câmera como um arquivo de dispositivo em `/dev/video*`. É ali que os aplicativos (navegador, OBS Studio, Discord) vão abrir para ler o fluxo de vídeo:

```terminal
$ ls -l /dev/video*
crw-rw----+ 1 root video 81, 0 Aug 16 14:10 /dev/video0
crw-rw----+ 1 root video 81, 1 Aug 16 14:10 /dev/video1
```

Apareceram **dois** dispositivos de vídeo: `/dev/video0` e `/dev/video1`. Isso é normal em webcams C920 (e muitas outras), porque a câmera expõe dois dispositivos: um para o fluxo de vídeo principal (com compressão H.264), outro que reporta apenas metadados (como zoom e pan). O aplicativo certo saberá qual usar.

Para confirmar qual é qual sem depender de dedução, o pacote `v4l-utils` traz o `v4l2-ctl`, que interroga cada dispositivo pela suas capacidades:

```terminal
$ v4l2-ctl --device=/dev/video0 --list-formats-ext
ioctl: VIDIOC_ENUM_FMT
	Type: Video Capture

	[0]: 'YUYV' (YUYV 4:2:2)
		Size: Discrete 640x480
			Interval: Discrete 0.033s (30.000 fps)
		Size: Discrete 1280x720
			Interval: Discrete 0.033s (30.000 fps)
		Size: Discrete 1920x1080
			Interval: Discrete 0.033s (30.000 fps)
	[1]: 'H264' (H.264, compressed)
		Size: Discrete 640x480
			Interval: Discrete 0.033s (30.000 fps)
		Size: Discrete 1280x720
			Interval: Discrete 0.033s (30.000 fps)
		Size: Discrete 1920x1080
			Interval: Discrete 0.033s (30.000 fps)
$ v4l2-ctl --device=/dev/video1 --list-formats-ext
ioctl: VIDIOC_ENUM_FMT
	Type: Video Capture

	[0]: 'MJPG' (Motion-JPEG, compressed)
		Size: Discrete 640x480
			Interval: Discrete 0.033s (30.000 fps)
```

O `/dev/video0` suporta YUYV (não comprimido, qualidade máxima) e H.264 (comprimido, eficiente para streaming) em até 1080p a 30 fps. O `/dev/video1` é o secundário, com apenas MJPEG. Se você está configurando o OBS ou o Discord, aponte para o `/dev/video0` — é o que interessa.

:::dica
O `v4l2-ctl --all` mostra tudo: versão do driver, controles disponíveis (brilho, contraste, foco automático), resoluções e o estado atual. É o equivalente a um `bluetoothctl info` para a webcam — um comando só que resume o dispositivo inteiro.
:::

## Testando a captura

Antes de abrir o aplicativo, teste a captura na linha de comando para isolar onde está o problema — se a câmera funciona no `ffplay` (parte do `ffmpeg`) mas não no navegador, a causa é o navegador, não a câmera:

```terminal
$ ffplay /dev/video0
```

Se o `ffmpeg` não estiver instalado (o SteamOS pode não o incluir), uma alternativa mais leve é o `fswebcam`, que tira uma foto simples:

```terminal
$ sudo pacman -S fswebcam
$ fswebcam -r 1280x720 --no-banner captura.jpg
--- Opening /dev/video0...
Trying source module v4l2...
/dev/video0 opened.
Delaying 0 seconds...
Capturing frame...
Captured frame in 0.04 seconds.
Processing captured image...
Writing JPEG image to 'captura.jpg'.
```

O arquivo `captura.jpg` gerado prova que o pipeline inteiro — kernel, driver UVC, dispositivo `/dev/video0` e o aplicativo de captura — está funcionando. Se `fswebcam` funciona mas o Discord ou navegador não, o problema está na permissão de acesso ao dispositivo ou na configuração do aplicativo.

:::atencao
Webcams UVC no Linux podem falhar silenciosamente em aplicativos Flatpak (como versões sandboxed do Discord ou navegadores), porque o sandbox do Flatpak pode bloquear o acesso a `/dev/video*`. A solução é conceder permissão via `flatpak override --user --device=all <app-id>` ou usar a versão nativa (não-sandboxed) do aplicativo.
:::

## Resumo

- Webcams USB são suportadas via driver UVC do kernel, carregado automaticamente ao conectar.
- `lsusb | grep -i cam` mostra se o dispositivo aparece no barramento USB; `dmesg | grep uvc` confirma o reconhecimento do driver.
- Dispositivos de vídeo aparecem como `/dev/video0`, `/dev/video1`, etc.; webcams frequentemente expõem dois.
- `v4l2-ctl --list-formats-ext` lista resoluções e formatos suportados por cada dispositivo.
- `fswebcam` testa o pipeline de captura com uma foto isolada, útil para isolar problemas do aplicativo.

## Exercícios

1. Conecte uma webcam USB e rode `lsusb` para identificar o `ID vendor:product`.
2. Execute `sudo dmesg | grep -i uvc` e identifique a linha `Found UVC ... device`. Há avisos? Eles são erros ou mensagens esperadas?
3. Liste os dispositivos em `/dev/video*` e use `v4l2-ctl --list-formats-ext` para descobrir a resolução máxima de cada um.
4. Capture uma foto com `fswebcam -r 1280x720 --no-banner teste.jpg` e abra o arquivo para confirmar.
5. **Desafio.** Rode `v4l2-ctl --all` em `/dev/video0` e, a partir da saída, identifique quais controles (brilho, contraste, foco, zoom) sua câmera oferece. Teste alterar um deles com `v4l2-ctl -d /dev/video0 -c brightness=128` e capture uma nova foto para comparar.