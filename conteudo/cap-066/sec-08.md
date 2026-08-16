O stream de cloud gaming chega ao Deck como um vídeo comprimido. O codec, a resolução e o bitrate determinam se você vê texturas nítidas ou uma sopa de blocos. O Deck decodifica esse vídeo usando aceleração de hardware — a mesma VA-API que você viu no [capítulo sobre codecs e streaming local](#/cap-064/sec-07). Entender o que acontece entre o datacenter e a tela do Deck permite extrair a melhor qualidade possível de cada serviço.

:::objetivos
- Entender os codecs usados por GeForce NOW e xCloud
- Configurar o navegador para forçar o melhor codec disponível
- Monitorar a decodificação de hardware no Deck
- Ajustar bitrate e resolução para o equilíbrio ideal
- Diagnosticar artefatos de compressão e suas causas
:::

## Qual codec cada serviço usa

O streaming de jogos usa codecs de vídeo em tempo real — diferentes dos codecs de arquivo (H.264 em MP4), eles sacrificam compressão por velocidade. Cada frame precisa ser codificado e decodificado em milissegundos.

**GeForce NOW** usa H.264 (AVC) como padrão, com HEVC (H.265) e AV1 disponíveis em tiers superiores. No plano Priority, você recebe H.264 a 1080p60 com bitrate entre 15 e 25 Mbps. No Ultimate, o AV1 entra em cena: mesma qualidade com 30% menos banda, ou qualidade superior na mesma banda.

**Xbox Cloud Gaming** usa uma variante proprietária de H.264 otimizada para baixa latência, com bitrate entre 8 e 15 Mbps. A Microsoft não divulga detalhes do encoder, mas análises de tráfego mostram um perfil H.264 High com B-frames desabilitados (para reduzir latência de codificação).

```terminal
$ vainfo | grep -A1 -E 'H264|HEVC|AV1'
      VAProfileH264Main               : VAEntrypointVLD
      VAProfileH264High               : VAEntrypointVLD
      VAProfileHEVCMain               : VAEntrypointVLD
      VAProfileHEVCMain10             : VAEntrypointVLD
```

O Deck, via APU AMD Van Gogh, decodifica H.264 e HEVC em hardware. AV1 é decodificado por software (a APU não tem decoder AV1 fixo), o que consome CPU e bateria. Para o GeForce NOW, prefira H.264 ou HEVC no Deck; AV1 só vale a pena se você estiver dockado com um monitor 4K e a qualidade extra for perceptível.

## Forçando o codec no navegador

Tanto Chrome quanto Edge negociam o codec automaticamente com o servidor via WebRTC. Você pode influenciar essa negociação desabilitando codecs que não quer:

```terminal
$ flatpak run com.google.Chrome \
  --kiosk \
  --disable-features=UseAv1Decoder \
  --enable-features=UseH265Decoder \
  --window-size=1280,800 \
  "https://play.geforcenow.com"
```

`--disable-features=UseAv1Decoder` força o Chrome a recusar AV1 na negociação WebRTC, caindo para HEVC ou H.264. `--enable-features=UseH265Decoder` habilita HEVC, que por padrão pode estar desabilitado no Chrome Linux.

No Edge, as flags equivalentes são:

```terminal
$ flatpak run com.microsoft.Edge \
  --kiosk \
  --disable-features=msAv1Decoder \
  --enable-features=msHEVCDecoder \
  --window-size=1280,800 \
  "https://www.xbox.com/play"
```

:::atencao
Forçar HEVC quando o servidor não oferece HEVC resulta em fallback para H.264, não em erro. Mas forçar um codec que o hardware não suporta (ex.: AV1 em GPU antiga) resulta em decodificação por software — a CPU sobe, a bateria derrete e o stream engasga.
:::

## Monitorando a decodificação de hardware

O comando `radeontop` mostra a utilização da GPU AMD em tempo real, incluindo o bloco de decodificação de vídeo (UVD/VCN). Com ele, você confirma se o vídeo está sendo decodificado em hardware.

```terminal
$ radeontop -d - --once 2>/dev/null | grep -i 'uvd\|vcn\|decode'
UVD: 0.00%
VCN: 0.12%
```

Se a porcentagem do VCN (Video Core Next, o decoder de hardware da AMD) está acima de zero durante um stream, a decodificação é por hardware. Se está zerada e a CPU (`htop`) mostra 40%+ em um thread do Chrome, a decodificação é por software — algo está errado com a aceleração VA-API.

O navegador também expõe estatísticas internas. No Chrome, acesse `chrome://media-internals/` enquanto o stream está rodando. Procure pela tag `<video>` ativa e expanda `Video Decoder`. O campo `video_decoder_name` deve mostrar `MojoVideoDecoder` ou `VaapiVideoDecoder` — este último confirma aceleração VA-API.

```terminal
$ flatpak run com.google.Chrome "chrome://media-internals/"
```

A página `chrome://media-internals/` é um portal de diagnóstico que lista todo elemento de mídia ativo no navegador, com métricas de frame drop, buffer e codec em uso. É a ferramenta mais útil para depurar qualidade de streaming que você nunca ouviu falar.

## Bitrate: quanto é suficiente

O olho humano percebe artefatos de compressão a partir de uma certa proporção de bits por pixel por frame. Para 800p a 60 FPS:

| Bitrate | Qualidade percebida | Quando usar |
|---|---|---|
| 5-8 Mbps | Artefatos visíveis em movimento, blocos em cenas escuras | Inaceitável para jogos |
| 10-15 Mbps | Bom para a maioria dos jogos; artefatos só em cenas complexas | Padrão do xCloud |
| 15-25 Mbps | Excelente; artefatos raros | Padrão do GeForce NOW Priority |
| 25-50 Mbps | Qualidade máxima perceptível na tela do Deck | GeForce NOW Ultimate, overkill para 800p |

O xCloud a 15 Mbps e o GeForce NOW Priority a 25 Mbps são mais que suficientes para a tela de 800p do Deck. Bitrates maiores que 25 Mbps não trazem ganho visual perceptível em 800p — você está baixando informação que o painel não consegue exibir.

```terminal
$ nethogs wlan0 2>&1 | head -5
NetHogs version 0.8.7
  PID USER     PROGRAM                       DEV   SENT   RECEIVED
 3245 deck     chrome                        wlan0 0.125  2.450 KB/sec
```

O `nethogs` mostra tráfego por processo. O valor em KB/s convertido para Mbps (multiplique por 8 e divida por 1000) dá o bitrate instantâneo. Durante uma sessão de GeForce NOW, o recebido deve ficar entre 1.5 e 3.0 MB/s (12-24 Mbps).

:::dica
Se o bitrate oscila muito (ex.: 2.5 MB/s, depois 0.3 MB/s, depois 2.8 MB/s), o Adaptive Bitrate (ABR) do serviço está reagindo a flutuações de rede. Isso é normal, mas se as quedas forem frequentes, o problema é o Wi-Fi, não o serviço.
:::

## Artefatos e suas causas

Saber ler artefatos de vídeo ajuda a diagnosticar onde está o problema:

- **Macroblocks (quadrados coloridos)**: bitrate insuficiente. Aumente nas configurações do serviço ou mude para um codec mais eficiente (HEVC/AV1).
- **Screen tearing (rasgo horizontal)**: o Deck está exibindo frames fora de sincronia com o VSync. Ative VSync no menu Quick Access.
- **Blur em movimento**: o encoder está usando muito motion blur para economizar bitrate. Reduza a complexidade visual do jogo (desligue motion blur, reduza detalhes).
- **Frame fantasma (ghosting)**: artefato de codec com B-frames. Tente forçar HEVC, que lida melhor com cenas de movimento rápido.

```terminal
$ glxinfo | grep -i "opengl renderer"
OpenGL renderer string: AMD Radeon Graphics (vangogh, LLVM 17.0.6, DRM 3.57, 6.8.0-valve3-1)
```

O renderizador OpenGL (e Vulkan) do Deck é a GPU Van Gogh integrada. Ela não tem decoder AV1 em hardware. Se você forçar AV1 no GeForce NOW e a CPU disparar, volte para H.264 — a qualidade visual extra não compensa o custo térmico.

## Resumo

- GeForce NOW usa H.264 (padrão), HEVC e AV1; Xbox Cloud Gaming usa H.264 proprietário com B-frames desabilitados.
- A APU Van Gogh do Deck decodifica H.264 e HEVC em hardware (VCN), mas AV1 é software.
- Flags do Chrome/Edge controlam quais codecs são oferecidos na negociação WebRTC.
- `radeontop` e `chrome://media-internals/` confirmam se a decodificação é por hardware.
- Para 800p60, 15-25 Mbps são suficientes; acima de 25 Mbps o ganho visual é imperceptível na tela do Deck.

## Exercícios

1. Execute `vainfo` e liste todos os perfis H.264, HEVC e AV1 suportados. Sua APU suporta HEVC Main10 (HDR)?
2. Durante uma sessão de GeForce NOW, abra `chrome://media-internals/` e identifique o codec em uso (`video_codec_name`). Anote também os frames descartados (`total_frame_drop`).
3. Use `nethogs` para medir o bitrate real do stream em Mbps. Compare com o valor configurado no GeForce NOW (se aplicável).
4. Force HEVC com `--enable-features=UseH265Decoder` e compare visualmente com o H.264 padrão. Em cenas de movimento rápido, a diferença é perceptível?
5. **Desafio.** Com o Deck dockado em um monitor 1080p, teste o GeForce NOW Ultimate (se disponível) com AV1 habilitado. Meça o uso de CPU com `htop` — a decodificação AV1 por software eleva a temperatura da APU? Compare com o mesmo jogo em H.264.