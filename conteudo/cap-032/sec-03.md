O Steam Deck tem uma tela generosa e alto-falantes surpreendentemente bons, mas o SteamOS não traz um reprodutor de mídia local decente fora da interface da Steam. Para assistir a vídeos que você baixou, ouvir música sem usar streaming e reproduzir qualquer formato que apareça na frente, o VLC é imbatível: lê praticamente tudo, é leve e tem uma versão Flatpak mantida pela própria comunidade VideoLAN.

:::objetivos
- Instalar o VLC pelo Flathub e verificar codecs disponíveis
- Reproduzir um vídeo e uma música por linha de comando
- Configurar a saída de áudio para o dispositivo correto no Deck
- Entender como o VLC Flatpak acessa arquivos de mídia fora do sandbox
:::

## Instalação e primeiros passos

O VLC está no Flathub com o App ID `org.videolan.VLC`. A instalação é direta:

```terminal
$ flatpak install org.videolan.VLC
Looking for matches…
Found similar ref(s) for 'org.videolan.VLC' in remote 'flathub' (system).
Use this remote? [Y/n]: Y

        ID                                          Branch          Op           Remote           Download
 1. [✓] org.videolan.VLC                           stable          i            flathub          49,1 MB / 49,2 MB
 2. [✓] org.videolan.VLC.Locale                    stable          i            flathub          12,5 MB / 12,5 MB

Installation complete.
```

Para testar direto do terminal com um arquivo qualquer:

```terminal
$ flatpak run org.videolan.VLC ~/Downloads/exemplo.mp4
VLC media player 3.0.21 Vetinari
[00007f4a1c001160] main libvlc: Running vlc with the default interface.
```

O VLC no Flatpak, por causa do sandbox, só enxerga as pastas que têm permissão explícita. Felizmente ele recebe acesso `filesystems=host` por padrão (você pode confirmar com `flatpak info --show-permissions org.videolan.VLC`), então lê qualquer arquivo do disco sem barreiras. Isso é uma exceção necessária para um reprodutor de mídia; a maioria dos Flatpaks é bem mais restritiva.

## O VLC toca (quase) tudo

O diferencial do VLC não é a interface — que é funcional mas datada — e sim os codecs embutidos. Ele não depende dos codecs do sistema: traz os seus próprios, compilados dentro do Flatpak. Isso significa que, num Deck recém-formatado, você roda um `.mkv` com H.265 sem instalar nada extra.

```terminal
$ flatpak run org.videolan.VLC ~/Downloads/filme.mkv
VLC media player 3.0.21 Vetinari
[00007f1a28001160] main libvlc: Running vlc with the default interface.
[00007f1a2400e860] avcodec decoder: Using Video Toolbox for hardware decoding
```

Repare na última linha: `Video Toolbox` é a API da GPU AMD do Deck para decodificar vídeo em hardware. O VLC detecta isso automaticamente, o que significa menos consumo de bateria durante a reprodução — algo crítico num portátil.

:::dica
Para testar se a decodificação por hardware está ativa, abra o VLC, vá em Ferramentas > Preferências > Entrada / Codecs e confira que a opção "Decodificação acelerada por hardware" está como "Automático". No terminal, um vídeo em 4K sem aceleração consome ~30% de CPU; com aceleração cai para menos de 5%.
:::

## Linha de comando para reprodução rápida

O VLC aceita comandos por terminal que ajudam a testar rapidamente uma mídia ou a reproduzir playlists sem abrir a interface gráfica completa:

```terminal
$ flatpak run org.videolan.VLC --play-and-exit ~/Downloads/musica.flac
$ flatpak run org.videolan.VLC --random ~/Música/*
$ flatpak run org.videolan.VLC --fullscreen ~/Downloads/apresentacao.mp4
```

A flag `--play-and-exit` é particularmente útil: reproduz o arquivo e encerra o processo, sem deixar janela aberta. Combinada com scripts, você consegue transformar o Deck numa jukebox que toca uma playlist e fecha sozinha.

## Configurando o dispositivo de áudio

O Steam Deck tem duas saídas de som: os alto-falantes internos e o conector P2 / USB-C (para fones). Em certos setups com dock, pode aparecer uma terceira via HDMI. Para escolher onde o VLC manda o som, você pode usar a interface gráfica (Áudio > Dispositivo de áudio), mas também dá para forçar pelo terminal:

```terminal
$ flatpak run org.videolan.VLC --aout=alsa ~/Downloads/musica.mp3
$ flatpak run --env=ALSA_OUTPUT=hdmi org.videolan.VLC ~/Downloads/filme.mkv
```

A primeira forma seleciona o módulo de saída `alsa` dentro do VLC. A segunda injeta uma variável de ambiente no sandbox para influenciar o ALSA, útil quando o VLC não detecta a saída correta sozinho.

:::atencao
Em docks USB-C baratos, o Steam Deck às vezes roteia o áudio para a saída errada (fica mudo). Antes de culpar o VLC, confira a saída de som padrão do sistema clicando no ícone de volume da bandeja do KDE. Se o dispositivo errado estiver selecionado, o VLC apenas obedece ao sistema.
:::

## Resumo

- O VLC instala com `flatpak install org.videolan.VLC` e traz codecs próprios que dispensam instalação extra.
- O Flatpak do VLC recebe `filesystems=host`, permitindo acesso a qualquer arquivo do disco.
- Ele detecta automaticamente a GPU AMD do Deck para decodificação acelerada de vídeo (menos consumo de bateria).
- `--play-and-exit` reproduz e encerra; `--random` toca uma lista em ordem aleatória; `--fullscreen` abre direto em tela cheia.
- O dispositivo de áudio pode ser controlado pelo menu interno do VLC ou pelo ícone de volume do sistema.

## Exercícios

1. Instale o VLC e reproduza um arquivo `.mp4` qualquer pela linha de comando (`flatpak run org.videolan.VLC <arquivo>`).
2. Crie uma pequena playlist manual: junte três arquivos de música numa pasta e rode `flatpak run org.videolan.VLC --random <pasta>/*`.
3. Verifique se a decodificação por hardware está ativa abrindo um vídeo e lendo a saída do terminal — procure pela linha `avcodec decoder: Using`.
4. Teste a flag `--play-and-exit` com um arquivo de música; observe se o VLC fecha a janela sozinho ao final.
5. **Desafio.** Conecte o Deck a um monitor via dock USB-C, instale o comando `pactl list short sinks` dentro do Flatpak ou pelo `nsenter`, descubra os sinks de áudio disponíveis e faça o VLC reproduzir um arquivo especificamente no HDMI.