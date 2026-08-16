O Steam Deck é um console portátil, mas também é um computador completo — e poucos aplicativos deixam isso tão claro quanto o VLC. O reprodutor da VideoLAN toca praticamente qualquer arquivo de áudio e vídeo sem depender de codecs externos, lida com legendas, streaming de rede e até conversão de formatos. Se você baixou um vídeo, copiou uma mídia de um pendrive ou quer assistir a um stream IPTV, o VLC resolve sem reclamar.

:::objetivos
- Instalar o VLC via Flatpak e entender por que ele é a escolha padrão para reprodução de mídia
- Reproduzir arquivos locais, pastas inteiras e streams de rede
- Configurar legendas, faixas de áudio e atalhos de teclado úteis no Deck
- Diagnosticar problemas de codec e desempenho de vídeo na APU
:::

## Instalação e primeiro contato

O VLC está empacotado como Flatpak e a instalação é direta. O pacote já inclui todos os codecs necessários — ao contrário de outras distribuições Linux, você não precisa instalar `vlc` e depois correr atrás de `ffmpeg`, `libdvdcss` ou pacotes `-codecs` separados.

```terminal
$ flatpak install flathub org.videolan.VLC
Looking for matches…
org.videolan.VLC/x86_64/stable           3.0.21   flathub
Proceed with these changes to the system? [Y/n]: y
Installation complete.
```

Depois de instalado, o VLC aparece na biblioteca Steam ou no menu de aplicativos do modo Desktop. No primeiro lançamento, ele pergunta se você quer enviar estatísticas anônimas — responda como preferir e siga para a interface principal, que é propositalmente espartana: uma janela vazia com a barra de menus no topo.

Para abrir um arquivo, arraste-o para a janela ou use [[Ctrl+O]]. No Steam Deck, o touchpad direito funciona como mouse e o gatilho direito (`R2`) equivale ao clique esquerdo. Se estiver com um dock e teclado externo, os atalhos tradicionais de desktop funcionam normalmente.

## Tocando de tudo: local, rede e disco

O VLC aceita três formas de abrir mídia, e as três funcionam bem no Deck.

**Arquivos locais.** Vá em Mídia → Abrir arquivo (`[[Ctrl+O]]`) ou simplesmente arraste o arquivo para a janela. Para abrir uma pasta inteira com vários vídeos (uma temporada de série, por exemplo), use Mídia → Abrir diretório (`[[Ctrl+F]]`). O VLC monta uma lista de reprodução automaticamente e emenda um episódio no outro.

**Stream de rede.** O VLC entende URLs de streaming: HTTP, RTSP, RTMP, YouTube (via copiar URL da página). Vá em Mídia → Abrir stream de rede (`[[Ctrl+N]]`) e cole a URL.

```terminal
$ vlc https://www.example.com/video.mp4
VLC media player 3.0.21 Vetinari
[00007f8a4c0011c0] main libvlc: Running vlc with the default interface.
[00007f8a4c0a1b40] main input: Creating an input for 'https://www.example.com/video.mp4'
```

**DVD e Blu-ray.** Com um drive USB externo conectado ao dock, o VLC reconhece discos ópticos. Para DVDs com proteção, você pode precisar da biblioteca `libdvdcss` — ela já vem embutida na versão Flatpak.

:::dica
Para abrir um vídeo diretamente do terminal sem abrir a interface gráfica completa, use `vlc --play-and-exit arquivo.mkv`. Quando o vídeo terminar, o processo encerra — útil para scripts ou para economizar recursos no modo Desktop.
:::

## Legendas, áudio e atalhos no Deck

O VLC detecta legendas automaticamente se o arquivo `.srt` tiver o mesmo nome do vídeo e estiver na mesma pasta. Para carregar uma legenda manualmente: Legenda → Adicionar arquivo de legenda (`[[Ctrl+V]]`).

Os atalhos essenciais que funcionam bem nos controles do Deck (com o teclado virtual ou dock):

| Ação | Atalho |
|---|---|
| Pausar / reproduzir | `[[Espaço]]` |
| Tela cheia | `[[F]]` ou duplo clique |
| Avançar 10 s | `[[Alt+Direita]]` |
| Recuar 10 s | `[[Alt+Esquerda]]` |
| Próxima faixa | `[[N]]` |
| Volume | `[[Ctrl+Cima]]` / `[[Ctrl+Baixo]]` |
| Legenda anterior/próxima | `[[V]]` (ciclar) |
| Faixa de áudio | `[[B]]` (ciclar) |

Para alternar entre faixas de áudio (útil em arquivos com dublagem e áudio original): clique com o botão direito no vídeo, vá em Áudio → Faixa de áudio e escolha. O atalho [[B]] também alterna entre as faixas disponíveis.

:::atencao
Se o vídeo está travando ou com áudio dessincronizado, não é o VLC — é a APU do Deck sofrendo com codecs pesados. Prefira H.264 em vez de AV1 ou H.265 (HEVC) para arquivos locais. O VLC tem aceleração por hardware via VA-API, mas codecs muito novos dependem de decodificação por software e consomem CPU.
:::

## Conversão rápida com o VLC

O VLC também converte formatos — não substitui o HandBrake, mas resolve conversões pontuais sem instalar mais nada. Vá em Mídia → Converter / Salvar (`[[Ctrl+R]]`), adicione o arquivo, clique em Converter / Salvar, escolha o perfil (ex.: "Video - H.264 + MP3 (MP4)") e defina o destino.

```terminal
$ vlc -I dummy input.mkv --sout='#transcode{vcodec=h264,acodec=mp3,vb=2000,ab=192}:std{access=file,mux=mp4,dst=output.mp4}' vlc://quit
```

Esse comando faz o mesmo sem interface gráfica: transcodifica `input.mkv` para H.264 com 2000 kbps de vídeo e 192 kbps de áudio, salvando como `output.mp4`. O `-I dummy` suprime a interface para rodar em segundo plano — útil se você estiver fazendo outra coisa no modo Desktop.

## Resumo

- O VLC Flatpak já inclui todos os codecs; instale com `flatpak install flathub org.videolan.VLC`.
- Ele reproduz arquivos locais, pastas, streams de rede (HTTP, RTSP) e discos ópticos com drive externo.
- Legendas `.srt` são detectadas automaticamente se tiverem o mesmo nome do arquivo de vídeo.
- A APU do Deck tem aceleração via VA-API; codecs como AV1 e HEVC podem pesar — prefira H.264.
- O VLC também converte formatos via interface gráfica ou linha de comando com `--sout`.

## Exercícios

1. Instale o VLC e abra um arquivo de vídeo qualquer. Use [[F]] para tela cheia e [[Espaço]] para pausar. Teste os atalhos [[N]] e [[B]] com um arquivo que tenha múltiplas faixas de áudio.
2. Baixe uma legenda `.srt` para um vídeo que você tem e coloque-a na mesma pasta com o mesmo nome. O VLC carregou automaticamente? Se não, carregue manualmente com Legenda → Adicionar arquivo de legenda.
3. Abra um stream de rede: copie a URL de um vídeo público (como um trailer em MP4) e use Mídia → Abrir stream de rede. O streaming funcionou sem buffer?
4. Converta um trecho de 30 segundos de um vídeo para H.264 com o comando `vlc -I dummy` mostrado na seção. Verifique o arquivo de saída com `ls -lh` e compare o tamanho com o original.
5. **Desafio.** Use `vlc --longhelp | grep -i 'accelerat\|vaapi\|vdpau'` para listar as opções de aceleração de hardware disponíveis. Depois, rode um vídeo 4K HEVC e monitore o uso da CPU com `htop`. A aceleração está sendo usada? Experimente forçar com `--avcodec-hw=vaapi`.