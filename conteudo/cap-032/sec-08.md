Gravar gameplay, fazer streaming para o Twitch ou simplesmente capturar a tela para reportar um bug: para tudo isso o OBS Studio é o padrão da indústria, gratuito e de código aberto. No Steam Deck ele ganha um papel extra — gravar partidas com a GPU AMD via hardware, liberando o processador para o próprio jogo.

:::objetivos
- Instalar o OBS Studio via Flathub e entender suas limitações no modo jogo
- Configurar uma cena com captura de tela e câmera
- Habilitar a codificação via GPU (VAAPI/AMF) para reduzir a carga no CPU
- Gravar e testar um arquivo de saída no modo desktop
:::

## Instalação e o aviso importante

O OBS está no Flathub como `com.obsproject.Studio`:

```terminal
$ flatpak install com.obsproject.Studio
Looking for matches…
Found similar ref(s) for 'com.obsproject.Studio' in remote 'flathub' (system).
Use this remote? [Y/n]: Y

        ID                                          Branch          Op           Remote           Download
 1. [✓] com.obsproject.Studio                      stable          i            flathub         122,9 MB / 123,1 MB
 2. [✓] com.obsproject.Studio.Locale               stable          i            flathub           3,7 MB / 3,7 MB

Installation complete.
```

:::atencao
O OBS captura a tela do **modo desktop**. No modo jogo (Game Mode), a interface roda em um compositor separado e o OBS não consegue capturá-la diretamente — o jogador precisa estar rodando no modo desktop, ou você precisa de uma placa de captura externa. Para gravar partidas, o caminho prático é: jogue no modo desktop, ou use o gravador nativo da Steam (botão [[Steam]] + [[R]] no modo jogo) e edite depois.
:::

## Criando a primeira cena

Ao abrir o OBS, você começa com uma cena vazia. O fluxo mínimo: adicionar uma fonte de captura de tela, uma de áudio e começar a gravar.

```terminal
$ flatpak run com.obsproject.Studio
info: OBS 30.2.3 (linux)
info: CPU Name: AMD Custom APU 0405
info: ---------------------------------
info: base resolution:       1280x800
info: output resolution:     1280x800
```

Na janela do OBS:

1. Em "Fontes", clique em `+` e escolha "Captura de tela (PipeWire)" — essa é a fonte certa no SteamOS, que usa PipeWire para áudio e vídeo no desktop.
2. Nomeie a fonte e confirme. A cena passa a mostrar sua área de trabalho.
3. Em "Controles", clique em "Iniciar gravação".

O OBS salva o arquivo em `~/Videos` por padrão, no formato MKV/MP4 conforme a configuração.

## Por que PipeWire (e não XComposite)

O `flatpak` do OBS escolhe a fonte de captura compatível com o servidor gráfico. No SteamOS moderno, o desktop KDE roda sobre Wayland, e a captura de tela no Wayland passa pelo **PipeWire** (via portal XDG). Por isso a fonte se chama "Captura de tela (PipeWire)" e não "Captura de tela (X11)".

```terminal
$ flatpak info --show-permissions com.obsproject.Studio
[Context]
shared=network;ipc;
sockets=x11;wayland;pulseaudio;pipewire;
devices=dri;
filesystems=xdg-videos;xdg-pictures;
```

Repare no `sockets=...pipewire` e no `filesystems=xdg-videos;xdg-pictures`. O OBS Flatpak já vem com o acesso necessário ao PipeWire e às pastas de vídeo/imagem, então a configuração é mínima.

## Codificação por hardware na GPU

O ponto crítico no Deck é não competir com o jogo por CPU. O OBS permite usar a GPU AMD para codificar o vídeo via VAAPI, o que libera os núcleos de CPU para o jogo:

```terminal
$ flatpak run com.obsproject.Studio --verbose
info: ---------------------------------
info: VAAPI: API version 1.20
info: FFmpeg VAAPI H264 renderer loaded
info: FFmpeg VAAPI H265 renderer loaded
info: AMF (Advanced Media Framework) loaded
```

No OBS: Configurações → Saída → modo "Avançado" → aba Gravação → Encoder de vídeo = `FFmpeg VAAPI H264` (ou H265). Essa é a escolha que aproveita a GPU do Deck.

:::dica
Teste qual encoder consome menos energia no seu caso. Regra geral: VAAPI H264 é o mais compatível (qualquer player reproduz); VAAPI H265/HEVC gera arquivos menores, mas alguns reprodutores antigos não leem. Para streaming ao Twitch/YouTube, use H264 (maior compatibilidade).
:::

## Gravando na prática

Com a cena pronta e o encoder por hardware, o ciclo completo de gravação é:

```terminal
$ flatpak run com.obsproject.Studio
# Iniciar gravação (atalho: Ctrl+Shift+R)
# Parar gravação (atalho: Ctrl+Shift+R novamente)
info: [ffmpeg muxer: 'simple_file_output'] Writing file '/home/deck/Videos/2025-08-15 20-30-00.mkv'...
info: [ffmpeg muxer: 'simple_file_output'] Output of file complete, audio and video shutdown successful
```

O OBS grava os arquivos com carimbo de data e hora no nome. Depois você reproduz o `.mkv` no VLC (instalado na seção anterior) para conferir o resultado.

:::nota
O formato padrão MKV é mais robusto que MP4: se o sistema travar no meio da gravação, o MKV preserva o que foi gravado até o último segundo, enquanto o MP4 pode corromper o arquivo todo. Se você precisa de MP4 final, grave em MKV e converta depois, ou use a opção "Remux" do próprio OBS (Arquivo → Remux gravações).
:::

## Resumo

- O OBS instala com `flatpak install com.obsproject.Studio` e captura a tela do modo desktop via PipeWire.
- No modo jogo o OBS não captura diretamente; use a gravação nativa da Steam (`Steam` + `R`) ou jogue no desktop.
- A fonte correta no SteamOS é "Captura de tela (PipeWire)", compatível com o Wayland do KDE.
- O encoder `FFmpeg VAAPI H264/H265` usa a GPU AMD e libera a CPU para o jogo.
- O formato MKV é mais seguro contra corrupção; converta/remux para MP4 só ao final.

## Exercícios

1. Instale o OBS e crie uma cena com uma única fonte "Captura de tela (PipeWire)". Inicie e pare a gravação, e confira o arquivo em `~/Videos`.
2. Configure a saída para usar o encoder `FFmpeg VAAPI H264`. Grave 60 segundos de um vídeo qualquer e compare o uso de CPU (com o comando `htop` ou `top`) entre VAAPI e o encoder padrão x264.
3. Adicione uma segunda fonte de entrada de áudio (seu microfone) à cena e verifique pelo medidor de volume que ela está captando.
4. Use a ferramenta "Remux gravações" (Arquivo → Remux) para converter um `.mkv` gravado em `.mp4` e reproduza o resultado no VLC.
5. **Desafio.** Combine OBS com a seção de edição de imagem: grave um clipe, extraia um frame (com `flatpak run --command=ffmpeg` se disponível), recorte-o no GIMP e use-o como miniatura/miniature do vídeo.