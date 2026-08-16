A grande vantagem do Chrome no Deck é que ele resolve de fábrica o maior calo do Firefox: codecs proprietários e DRM. Se você já perdeu uma tarde tentando fazer o Firefox tocar o Netflix e nada funcionou, provavelmente a resposta é instalar o Chrome e não configurar mais nada. Mas essa conveniência tem custo: o Chrome coleta telemetria por padrão, pesa mais na RAM e não é software livre. A decisão de instalá-lo deve ser consciente.

:::objetivos
- Instalar o Chrome via Flatpak e entender suas permissões de sandbox
- Habilitar aceleração por hardware no Chrome dentro do Deck
- Usar o Chrome como plataforma de videoconferência (Meet, Zoom web)
- Comparar o consumo real de recursos entre Chrome e Firefox no Deck
:::

## Instalação e primeiras impressões

O Chrome Flatpak usa o runtime `org.freedesktop.Platform` e, assim como o Firefox, roda isolado. A diferença aparece já na primeira execução: o Chrome se oferece para importar favoritos do Firefox, criar atalhos no menu KDE e — se você deixar — sincronizar tudo com sua conta Google.

```terminal
$ flatpak install com.google.Chrome
Looking for matches…
Found ref ‘app/com.google.Chrome/x86_64/stable’ in remote ‘flathub’ (system).
Is this ok [Y/n]: Y
Installing… done
$ flatpak run com.google.Chrome &
[1] 3842
```

Depois de instalado, verifique as permissões com `flatpak info`:

```terminal
$ flatpak info --show-permissions com.google.Chrome | head -12

[Context]
shared=network;ipc;
sockets=x11;wayland;pulseaudio;system-bus;

[File System]
host-etc:ro
xdg-download:rw
xdg-run/pipewire-0
```

Repare em três diferenças em relação ao Firefox: o Chrome pede acesso ao PulseAudio desde a instalação (`pulseaudio`), ao system-bus e ao diretório `host-etc` em modo somente leitura. O acesso ao PulseAudio é o que permite que o microfone funcione em chamadas web sem configuração adicional — o Firefox no Flatpak também consegue, mas precisa do PipeWire como intermediário.

## Aceleração por hardware

No Deck, o Chrome detecta a GPU AMD automaticamente via Mesa, mas a aceleração de vídeo (VA-API) pode não estar ativada. Para confirmar:

```terminal
$ flatpak run com.google.Chrome --enable-features=VaapiVideoDecode \
  'chrome://gpu'
```

Na página `chrome://gpu`, procure por "Video Decode". Se estiver em "Software only", a aceleração está ausente. O SteamOS com GPU AMD usa o driver `radeonsi` via Mesa, e o Chrome Flatpak, por padrão, não carrega a biblioteca `libva`. A solução passa por instalar o runtime com suporte a VA-API ou ativar a flag `--enable-features=VaapiVideoDecode,UseSkiaRenderer` no lançamento.

:::dica
Para não digitar flags toda vez, edite o atalho no menu KDE: clique com botão direito no ícone do Chrome → Edit Application → aba Application → campo Arguments. Cole `--enable-features=VaapiVideoDecode` lá e o Chrome sempre abrirá com aceleração.
:::

## Chrome como plataforma de videoconferência

Aqui o Chrome brilha. Google Meet, Zoom web, Microsoft Teams e Jitsi reconhecem o Chrome imediatamente, sem pedir plugins. O segredo está no conjunto de codecs que o Chrome embute: H.264, VP8, VP9 e AV1 vêm compilados dentro do binário.

```terminal
$ flatpak run com.google.Chrome 'https://meet.google.com/landing'
```

No primeiro acesso, o Chrome pede permissão de microfone e câmera. Conceda. Diferentemente do Firefox, o Chrome no Flatpak não precisa que você configure manualmente o PipeWire — ele usa o PulseAudio que o Flatpak vê via socket, e a câmera aparece via Video4Linux (V4L2) se o dispositivo for compatível.

:::atencao
Câmeras USB que exigem firmware proprietário (Logitech Brio 4K, algumas cams da Razer) podem aparecer como dispositivo, mas sem imagem. Isso não é culpa do Chrome: o kernel do SteamOS não carrega o firmware proprietário porque o sistema é imutável. Nesse caso, só uma câmera UVC genérica funciona — ou usar o celular como webcam via DroidCam, [ver a seção sobre câmera externa](#/cap-033/sec-07).
:::

## O custo em RAM e bateria

O Chrome consome mais RAM que o Firefox, e no Deck isso importa porque a RAM é compartilhada com os jogos. Um teste simples:

```terminal
$ flatpak run org.mozilla.firefox &
$ flatpak run com.google.Chrome &
$ ps aux | grep -E 'firefox|chrome' | awk '{print $6, $11}' | sort -rn | head -5
1224560 /app/chrome/chrome
1183400 /app/chrome/chrome
952300 /app/chrome/chrome
687120 /app/firefox/firefox
544900 /app/firefox/firefox
```

A sexta coluna é a RSS (memória residente) em kilobytes. O Chrome frequentemente ocupa entre 30% e 50% mais RAM que o Firefox com as mesmas abas abertas, porque ele separa cada aba em um processo independente. Isso é bom para segurança (uma aba que trava não mata o navegador), mas ruim para um dispositivo com 16 GB de RAM que já está rodando Cyberpunk 2077.

## Resumo

- O Chrome resolve DRM e codecs de fábrica: Netflix, Meet e Zoom web funcionam sem configuração.
- A sandbox do Flatpak dá ao Chrome acesso ao PulseAudio e ao system-bus, suficientes para microfone e notificações.
- A aceleração via VA-API pode estar desativada no Flatpak; a flag `--enable-features=VaapiVideoDecode` resolve.
- O Chrome consome mais RAM que o Firefox, mas isola abas em processos independentes contra crashes.
- Câmeras USB com firmware proprietário podem não funcionar independentemente do navegador.

## Exercícios

1. Instale o Chrome e abra `chrome://gpu`. Copie a seção "Video Acceleration Information" e explique cada linha.
2. Lance o Chrome com `--enable-features=VaapiVideoDecode` e compare o consumo de CPU ao rodar um vídeo 4K no YouTube com e sem a flag.
3. Acesse o Google Meet e faça uma chamada de teste. Depois, faça o mesmo no Firefox. Qual dos dois reconheceu microfone e câmera primeiro?
4. Monitore o consumo de RAM do Chrome com 5, 10 e 20 abas abertas usando `ps aux | grep chrome`. Anote a RSS total.
5. **Desafio.** Configure o Chrome como "installed PWA" para o Xbox Cloud Gaming: abra o site, clique nos três pontos → "Save and share" → "Install Xbox Cloud Gaming". Depois, lance o atalho do menu KDE e explique por que isso é útil no Deck.