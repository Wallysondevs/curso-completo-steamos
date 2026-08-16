## 7. Latência, codecs e qualidade de imagem

Você já ouviu falar em "latência", "bitrate", "codec" — mas o que realmente acontece entre o frame renderizado no host e o pixel aceso na tela do seu Steam Deck? Esta seção desconstrói o pipeline de streaming frame a frame, para que você entenda onde cada milissegundo é gasto e como cada decisão (codec, rede, resolução) afeta o resultado final. Se o capítulo anterior foi sobre *o que fazer*, este é sobre *por que funciona assim*.

:::objetivos
- Decompor a latência total do streaming em suas quatro etapas fundamentais
- Comparar os codecs H.264, HEVC e AV1 em qualidade, desempenho e suporte de hardware
- Relacionar bitrate, resolução e framerate com artefatos visuais típicos
- Entender o impacto do Wi-Fi versus Ethernet no jitter e na estabilidade
- Conhecer as capacidades reais de decode de hardware do Deck (LCD e OLED)
:::

### O pipeline de latência: do host ao Deck

Quando você aperta um botão no Deck e espera a resposta visual, o tempo total decorrido — a **latência fim a fim** — é a soma de várias etapas. Vamos decompô-las com valores típicos para um setup Wi-Fi 5 GHz bem configurado:

| Etapa | O que acontece | Latência típica |
|---|---|---|
| **Encode** | GPU do host captura e codifica o frame | 2–8 ms |
| **Rede (TX)** | Pacote entra na fila e é transmitido | 1–3 ms (Ethernet) / 3–10 ms (Wi-Fi 5 GHz) |
| **Rede (propagação)** | Tráfego no ar ou cabo | <1 ms (LAN) / 5–30 ms (WAN/Internet) |
| **Decode** | GPU do Deck decodifica o frame | 1–5 ms |
| **Display** | Frame buffer → tela | <1 ms (60 Hz) / ~16 ms pior caso |

Somando os valores medianos em LAN cabeada: **5 a 12 ms**. Em Wi-Fi 5 GHz limpo: **10 a 25 ms**. Em Wi-Fi 2.4 GHz congestionado ou com interferência: **30 a 80 ms** — e é aí que a experiência desanda.

O ponto crítico é que essas latências **não são fixas**. O encode varia com a complexidade da cena (muita folhagem, partículas, movimento rápido exigem mais bitrate e, portanto, mais tempo de encode em alguns codecs). A rede varia com interferência, número de clientes no canal e distância. É por isso que 30 ms podem ser perfeitamente aceitáveis num RPG por turnos, mas arruínam a precisão de um *headshot* em CS2.

### Onde a latência mora: encode, rede e decode

**Encode no host** — essa é, na maioria dos setups, a maior fatia individual. A GPU do host precisa capturar o frame final do framebuffer, passá-lo pelo encoder de hardware (NVENC na NVIDIA, AMF na AMD, QuickSync na Intel) e produzir o stream comprimido. Encoders de hardware modernos operam na casa de 2–8 ms para 1080p60, mas podem subir para 12–16 ms em 4K. Se você usa encode por software (x264 no OBS, por exemplo), esse número dispara para 30–80 ms — **nunca faça isso para streaming de jogos em tempo real**.

**Rede** — o vilão mais imprevisível. No papel, um pacote TCP/UDP leva frações de milissegundo num cabo Ethernet. Na prática, Wi-Fi introduz *jitter* (variação da latência) porque o canal é compartilhado e half-duplex: o roteador transmite para um cliente por vez. Cada dispositivo adicional disputando o mesmo canal — um celular sincronizando fotos, uma TV smart buffering Netflix — adiciona rajadas de latência que o olho percebe como *micro-stuttering*.

**Decode no Deck** — a APU Van Gogh (LCD) e a Sephiroth (OLED) possuem blocos dedicados de decode por hardware. Para H.264 e HEVC, o decode consome 1–3 ms na maioria dos cenários. AV1 é suportado apenas na Sephiroth (OLED) e via decode híbrido; no LCD, AV1 cai para decode por software, o que **inviabiliza** streaming em tempo real com esse codec.

### Codecs: a matemática da compressão

Cada codec resolve o mesmo problema — comprimir uma sequência de imagens em tempo real — com abordagens diferentes. A escolha do codec determina a relação entre qualidade, bitrate e latência.

#### H.264 (AVC)

O veterano. Suportado por absolutamente tudo, de smartphones de 2012 a GPUs de datacenter. **Prós**: encode e decode ultra-rápidos (1–3 ms em hardware), latência mínima, compatibilidade universal. **Contras**: eficiência de compressão inferior — para atingir qualidade "transparente" (onde você não distingue do nativo), H.264 precisa de 30–50% mais bitrate que HEVC. Em 1080p60, espere usar **20–40 Mbps** para qualidade boa. Artefatos típicos: *macroblocking* (blocos quadrados visíveis em áreas escuras ou com gradiente), *banding* (faixas de cor em vez de gradiente suave).

#### HEVC (H.265)

O sucessor. **Prós**: compressão ~50% mais eficiente que H.264 — mesma qualidade visual com metade do bitrate. 1080p60 fica excelente com **10–25 Mbps**; 4K60 com **30–60 Mbps**. **Contras**: encode mais pesado (3–8 ms), decode exige hardware mais recente. No Steam Deck, ambas as revisões suportam decode HEVC por hardware. Artefatos: bem menos macroblocking, mas pode apresentar *blur* sutil em movimento rápido quando o bitrate é insuficiente.

#### AV1

O futuro. Royalty-free, desenvolvido pela Alliance for Open Media (Google, Netflix, Amazon, Mozilla). **Prós**: compressão ~30% melhor que HEVC na mesma qualidade. 4K HDR a 20–40 Mbps é viável. **Contras**: encode por hardware ainda é raro (GPUs NVIDIA RTX 40, Intel Arc, AMD RDNA 3+). No Steam Deck, apenas o modelo OLED (Sephiroth, 6 nm) tem suporte a decode AV1 por hardware. O LCD (Van Gogh, 7 nm) **não decodifica AV1 em hardware** — tentar usar AV1 nele resultará em latência altíssima e uso de CPU a 100%. Artefatos: tende a suavizar detalhes finos (film grain synthesis), o que pode incomodar em jogos com texturas muito detalhadas.

```terminal
## Verificar capacidades de decode de hardware no Steam Deck
$ vainfo
Trying display: wayland-0
vainfo: VA-API version: 1.20 (libva 2.20.1)
vainfo: Driver version: Mesa Gallium driver 24.0.5 for AMD Radeon Graphics (radeonsi, vangogh, LLVM 18.1.2, DRM 3.57, 6.5.0-valve9-1)
vainfo: Supported profile and entrypoints
      VAProfileH264ConstrainedBaseline: VAEntrypointVLD
      VAProfileH264Main:               VAEntrypointVLD
      VAProfileH264High:               VAEntrypointVLD
      VAProfileHEVCMain:               VAEntrypointVLD
      VAProfileHEVCMain10:             VAEntrypointVLD
      VAProfileVP9Profile0:            VAEntrypointVLD
      VAProfileNone:                   VAEntrypointVideoProc
```

Note a ausência de `VAProfileAV1Profile0` — isso é o LCD (Van Gogh). No OLED, o `vainfo` lista o perfil AV1. Se você tem o modelo LCD e quer streaming 4K, HEVC é seu teto.

### Bitrate, resolução e a tabela da verdade

Bitrate é o orçamento de dados por segundo que o codec pode gastar para representar cada frame. Quanto mais pixels por segundo você empurra (resolução × framerate), mais bitrate precisa para manter a qualidade. A tabela abaixo resume recomendações práticas testadas em LAN:

| Resolução / Framerate | H.264 (Mbps) | HEVC (Mbps) | AV1 (Mbps) | Qualidade esperada |
|---|---|---|---|---|
| 720p @ 30 fps | 10–15 | 5–10 | 4–8 | Boa |
| 720p @ 60 fps | 15–25 | 8–15 | 6–12 | Boa |
| 1080p @ 30 fps | 15–25 | 8–15 | 6–12 | Muito boa |
| 1080p @ 60 fps | 25–50 | 15–30 | 10–25 | Excelente (transparente) |
| 1440p @ 60 fps | 40–80 | 25–50 | 18–35 | Excelente |
| 4K @ 60 fps | 80–150 | 50–100 | 35–70 | Excelente (transparente com HEVC/AV1) |

:::dica
**Qualidade "transparente"** é o ponto em que você não consegue distinguir o stream do nativo em uma comparação lado a lado em movimento. Para H.264 em 1080p60, isso geralmente exige ≥40 Mbps. Com HEVC, 25 Mbps já chegam lá.
:::

```terminal
## Medir throughput real da rede entre host e Deck
$ iperf3 -c 192.168.1.100 -t 10 -i 1
Connecting to host 192.168.1.100, port 5201
[  5] local 192.168.1.50 port 48210 connected to 192.168.1.100 port 5201
[ ID] Interval           Transfer     Bitrate         Retr  Cwnd
[  5]   0.00-1.00   sec  11.2 MBytes  94.0 Mbits/sec    0    385 KBytes
[  5]   1.00-2.00   sec  10.8 MBytes  90.6 Mbits/sec    0    385 KBytes
[  5]   2.00-3.00   sec  10.5 MBytes  88.1 Mbits/sec    0    385 KBytes
[  5]   3.00-4.00   sec  11.0 MBytes  92.3 Mbits/sec    0    385 KBytes
[  5]   4.00-5.00   sec  10.9 MBytes  91.5 Mbits/sec    0    385 KBytes
[  5]   5.00-6.00   sec  10.7 MBytes  89.8 Mbits/sec    0    385 KBytes
[  5]   6.00-7.00   sec  7.2 MBytes   60.4 Mbits/sec    3    298 KBytes
[  5]   7.00-8.00   sec  10.8 MBytes  90.6 Mbits/sec    0    385 KBytes
[  5]   8.00-9.00   sec  10.9 MBytes  91.5 Mbits/sec    0    385 KBytes
[  5]   9.00-10.00  sec  10.6 MBytes  88.9 Mbits/sec    0    385 KBytes
- - - - - - - - - - - - - - - - - - - - - - - - -
[ ID] Interval           Transfer     Bitrate         Retr
[  5]   0.00-10.00  sec   105 MBytes  87.7 Mbits/sec    3             sender
[  5]   0.00-10.00  sec   104 MBytes  87.0 Mbits/sec                  receiver
```

Veja o momento em que a taxa caiu para 60 Mbps com 3 retransmissões — isso é **jitter de Wi-Fi** em ação. Seu stream de 50 Mbps sobreviveria? Sim, mas aquela retransmissão teria causado um *stutter* perceptível por 100–200 ms.

### Medindo latência na prática

Tanto o Moonlight quanto o Remote Play oferecem overlays de estatísticas. Saber lê-los é essencial para diagnosticar problemas.

**Moonlight (Sunshine + Moonlight)** — pressione o atalho de overlay (Ctrl+Alt+Shift+S, configurável) durante a sessão. Você verá:

- **Host processing latency (ms)** — tempo que o host levou para capturar e codificar o frame. Ideal: <8 ms.
- **Network latency (ms)** — tempo de ida e volta do pacote (RTT). Ideal: <5 ms em LAN.
- **Decoder latency (ms)** — tempo que o Deck levou para decodificar. Ideal: <5 ms.
- **Frames dropped by network** — frames perdidos por congestionamento. Ideal: 0. Se >0 por minuto, reduza o bitrate ou mude para 5 GHz.

**Remote Play (Steam nativo)** — pressione F6 (no teclado físico ou virtual) para ativar as estatísticas no canto da tela: latência total, bitrate atual e resolução do stream.

**Steam Link** — ative o overlay de performance nas configurações do app. Mostra latência de rede, taxa de quadros e pacotes perdidos.

:::atencao
Se o *decoder latency* no Moonlight estiver consistentemente acima de 10 ms, você pode estar usando um codec sem suporte de hardware (AV1 no LCD) ou com resolução acima do que o decoder aguenta. Reduza a resolução ou troque para HEVC/H.264 imediatamente.
:::

### Artefatos visuais: o que cada codec esconde (ou revela)

Todo codec com perdas introduz artefatos. Reconhecê-los ajuda a diagnosticar se você precisa de mais bitrate, codec diferente ou se é hora de desistir do Wi-Fi.

**Macroblocking** — blocos quadrados (8×8 ou 16×16 pixels) visíveis, especialmente em áreas escuras, neblina ou gradientes suaves. Típico de H.264 com bitrate insuficiente. HEVC e AV1 reduzem drasticamente esse efeito porque usam blocos de tamanho variável (até 64×64) e melhores preditores intra-frame.

**Banding** — faixas de cor distintas onde deveria haver um gradiente contínuo (céu ao entardecer, fumaça). Ocorre em todos os codecs quando o bitrate é baixo demais, mas é mais pronunciado no H.264 (8-bit, 4:2:0 chroma). HEVC 10-bit e AV1 10-bit praticamente eliminam banding visível.

**Blur em movimento** — perda de nitidez durante cenas de movimento rápido (giro de câmera, ação intensa). É o codec sacrificando detalhes espaciais para caber no orçamento de bitrate. Aumentar o bitrate resolve; trocar de H.264 para HEVC também.

**Screen tearing no stream** — não confundir com tearing de V-Sync. Ocorre quando o frame chega pela metade ao decoder. Moonlight e Remote Play usam buffering para evitar isso, mas o buffer adiciona latência. Configurar `vsync=1` no Moonlight e ativar V-Sync no host ajuda.

```terminal
## Verificar codecs disponíveis no ffmpeg do Deck
$ ffmpeg -codecs 2>/dev/null | grep -E "h26[45]|hevc|av1"
 DEV.LS h264                 H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10 (decoders: h264 h264_v4l2m2m h264_vulkan ) (encoders: libx264 libx264rgb)
 D.V.L. hevc                 H.265 / HEVC (High Efficiency Video Coding) (decoders: hevc hevc_v4l2m2m hevc_vulkan ) (encoders: libx265)
 DEV.L. av1                  Alliance for Open Media AV1 (decoders: av1 av1_vulkan libdav1d ) (encoders: libaom-av1 libsvtav1)
```

Note os decoders com sufixo `_vulkan` e `_v4l2m2m` — são os caminhos de aceleração por hardware que o Mesa expõe. O `libdav1d` (decoder de AV1 por software) está disponível, mas como você já sabe, **não é usável em tempo real** no Deck LCD.

### Wi-Fi vs Ethernet: por que o jitter importa mais que o throughput

Seu roteador anuncia "1200 Mbps" na caixa. Você mede 500 Mbps no `iperf3`. Ótimo, certo? **Errado.** O que importa para streaming não é o throughput médio, é a **consistência**. Um stream de 30 Mbps que sofre 5 quedas para 5 Mbps por frame causa mais dano que um stream constante de 20 Mbps.

O Wi-Fi, por natureza, introduz jitter porque:

- É **half-duplex** — o rádio transmite ou recebe, nunca ambos ao mesmo tempo
- Sofre **co-channel interference** — seus vizinhos no mesmo canal brigam pelo espectro
- Tem **bufferbloat** — o buffer do roteador enche e causa latência em rajada
- É afetado por **distância e obstáculos** — cada parede entre você e o AP reduz o sinal em 3–6 dB

O Deck, para piorar, tem antenas modestas e está geralmente atrás das suas mãos (que são sacos de água salgada excelentes para absorver RF a 5 GHz).

**Mitigações práticas**: use 5 GHz exclusivamente (6 GHz/Wi-Fi 6E se disponível), escolha um canal DFS vazio (varredura com `iw dev wlan0 scan | grep -E "SSID|freq|signal"`), posicione o roteador a menos de 5 metros com linha de visada, e remova dispositivos desnecessários da rede 5 GHz durante sessões de jogo.

:::perigo
**Wi-Fi 2.4 GHz é incompatível com streaming de jogos.** O espectro é tão poluído (microondas, Bluetooth, babás eletrônicas, 30 vizinhos no canal 6) que você terá jitter constante de 20–80 ms, tornando qualquer jogo de ação injogável. Reserve 2.4 GHz para navegação web e IoT — nunca para streaming de jogos.
:::

### Resumo

- A latência total do streaming decompõe-se em **encode (2–8 ms) + rede (1–10 ms LAN) + decode (1–5 ms) + display (<1 ms)**; em Wi-Fi 5 GHz limpo, espere 10–25 ms fim a fim
- **H.264** é o codec universal — rápido, compatível, mas sedento por bitrate; **HEVC** oferece o dobro de eficiência com suporte total de hardware no Deck; **AV1** é o futuro, mas só o Deck OLED (Sephiroth) tem decode por hardware
- Bitrate insuficiente manifesta-se como **macroblocking** (H.264), **banding** (todos) e **blur em movimento**; a tabela de recomendações serve como ponto de partida para ajustes
- Meça a latência real com o overlay do **Moonlight** (Ctrl+Alt+Shift+S) ou **Remote Play** (F6); decoder latency acima de 10 ms indica codec sem aceleração de hardware
- **Wi-Fi é sobre consistência, não velocidade** — jitter destrói a experiência muito antes da falta de throughput; use 5 GHz, canal limpo e linha de visada com o roteador

### Exercícios

1. Execute `vainfo` no seu Steam Deck (tanto LCD quanto OLED) e identifique quais codecs têm suporte de decode por hardware. Compare com os codecs disponíveis no Sunshine do seu host. Monte a melhor combinação possível para streaming 1080p60.

2. Com o iperf3 entre host e Deck, faça 3 medições de 30 segundos cada em diferentes horários do dia. Anote o throughput médio, mínimo e o número de retransmissões. O throughput mínimo é pelo menos o dobro do bitrate que você está usando?

3. Inicie uma sessão de streaming com Moonlight e ative o overlay de estatísticas. Em três jogos diferentes (um RPG, um FPS, um jogo de plataforma 2D), anote a latência de host, rede e decode. Qual etapa contribui mais para a latência em cada gênero?

4. Configure duas sessões idênticas (mesmo jogo, mesma resolução) com H.264 a 30 Mbps e HEVC a 20 Mbps. Observe áreas escuras e movimento rápido. Anote diferenças de macroblocking e blur. Em qual cenário você preferiria cada codec?

5. **Desafio integrador**: monte um "laboratório de latência" completo. No host, instale o Sunshine e configure três perfis: H.264 1080p60 25 Mbps, HEVC 1080p60 20 Mbps e HEVC 4K60 50 Mbps. No Deck, use o Moonlight e o overlay para medir latência em cada perfil. Depois, repita as medições com o Deck conectado via dock Ethernet (se disponível) e compare com Wi-Fi 5 GHz. Produza uma tabela comparativa e determine qual combinação oferece a melhor relação qualidade-latência para o seu setup específico. Documente as conclusões em um arquivo `~/lab/streaming-benchmark.md`.