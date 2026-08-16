Latência e qualidade visual são os dois lados de uma mesma moeda no streaming: aumentar o bitrate melhora a imagem, mas pode aumentar a latência; priorizar codecs mais eficientes reduz o tamanho dos pacotes, mas exige mais do hardware. Entender como essas variáveis se relacionam permite ajustar o equilíbrio certo para cada jogo e cada rede.

:::objetivos
- Entender as quatro componentes da latência total de streaming
- Medir encode latency, network latency e decode latency separadamente
- Comparar H.264 e HEVC em qualidade por bitrate e custo computacional
- Ajustar resolução, FPS e bitrate para minimizar latência
- Interpretar o performance overlay do Steam em tempo real
:::

## As quatro fatias da latência

Quando você aperta um botão no controle conectado ao cliente e vê o resultado na tela, o tempo total é a soma de quatro etapas:

**Input latency** (~1–2 ms). Tempo entre o controle enviar o comando e o cliente empacotar e despachar pela rede. É a menor fatia e a mais difícil de reduzir — o Bluetooth do controle e o polling rate já são otimizados.

**Network latency** (1–30 ms local, 20–100 ms remoto). Tempo de ida e volta do pacote na rede. Na rede local com Wi-Fi 5 GHz, gira em torno de 2–5 ms. Com Ethernet, menos de 1 ms. Fora de casa (internet), domina a latência total.

**Encode latency** (3–12 ms). Tempo que o Deck gasta comprimindo cada frame. Depende do codec (H.264 é mais rápido que HEVC), da resolução (720p mais rápido que 1080p) e da carga da GPU (se o jogo já está usando 100% da GPU, a codificação compete por recursos).

**Decode/Display latency** (5–20 ms). Tempo que o cliente gasta descomprimindo e exibindo o frame. Dominada pelo hardware decoder do cliente — dispositivos modernos fazem isso em 5 ms, mas smart TVs antigas podem levar 30 ms ou mais.

```terminal
## Medindo a network latency entre Deck e cliente:
$ ping -c 10 -i 0.2 192.168.1.101
PING 192.168.1.101 (192.168.1.101) 56(84) bytes of data.
64 bytes from 192.168.1.101: icmp_seq=1 ttl=64 time=2.31 ms
64 bytes from 192.168.1.101: icmp_seq=2 ttl=64 time=2.45 ms
64 bytes from 192.168.1.101: icmp_seq=3 ttl=64 time=3.12 ms
64 bytes from 192.168.1.101: icmp_seq=4 ttl=64 time=2.18 ms
64 bytes from 192.168.1.101: icmp_seq=5 ttl=64 time=2.67 ms
64 bytes from 192.168.1.101: icmp_seq=6 ttl=64 time=2.89 ms
64 bytes from 192.168.1.101: icmp_seq=7 ttl=64 time=2.54 ms
64 bytes from 192.168.1.101: icmp_seq=8 ttl=64 time=2.33 ms
64 bytes from 192.168.1.101: icmp_seq=9 ttl=64 time=2.76 ms
64 bytes from 192.168.1.101: icmp_seq=10 ttl=64 time=2.41 ms

--- 192.168.1.101 ping statistics ---
10 packets transmitted, 10 received, 0% packet loss, time 1860ms
rtt min/avg/max/mdev = 2.180/2.566/3.120/0.291 ms
```

Latência média de 2.57 ms com desvio padrão de 0.29 ms — a rede está excelente e estável. Um desvio padrão alto (acima de 5 ms) indica jitter, que causa oscilações de qualidade e engasgos no stream.

## H.264 versus HEVC na prática

A escolha entre H.264 e HEVC é a decisão de codec mais impactante no streaming. O performance overlay do Steam mostra qual codec está em uso, mas não conta a história completa:

| Característica | H.264 (AVC) | HEVC (H.265) |
|---|---|---|
| Encode latency | ~3–5 ms | ~6–12 ms |
| Bitrate para 1080p@60 aceitável | 20–30 Mbps | 10–15 Mbps |
| Compatibilidade | Universal | Dispositivos pós-2017 |
| Qualidade em baixo bitrate | Artefatos visíveis em cenas rápidas | Melhor compressão, menos artefatos |
| Custo de GPU no Deck | Baixo | Moderado |

:::info
A APU AMD Van Gogh do Deck tem suporte de hardware para ambos os codecs. A diferença de encode latency entre H.264 e HEVC no Deck é pequena (2–5 ms extras para HEVC) porque o encoder é dedicado — não compete com os shaders do jogo. Em PCs sem hardware encoder, a diferença seria muito maior.
:::

A regra prática: use HEVC se o cliente suportar e a rede for o gargalo (banda limitada). Use H.264 se a compatibilidade for mais importante ou se a latência adicional do HEVC for perceptível em jogos de ritmo intenso.

## O impacto do limite de FPS

Muita gente não percebe que o Deck continua renderizando o jogo na taxa normal enquanto transmite. Se o jogo roda a 60 FPS no Deck e o stream está configurado para 30 FPS, o encoder descarta metade dos frames — e o Deck gastou GPU renderizando frames que ninguém vê.

```terminal
## Ativando o MangoHud para ver FPS de renderização e FPS de stream:
$ MANGOHUD=1 steam
## No overlay, compare "Game FPS" com "Stream FPS" durante o streaming.
```

A recomendação: se você vai transmitir a 30 FPS (para economizar banda ou bateria), limite o jogo a 30 FPS também. O Deck gasta menos energia, aquece menos e o stream não perde frames intermediários, o que reduz micro-stuttering.

## Compensando uma rede ruim

Se a rede está congestionada e você não pode trocar de canal ou de banda, há três alavancas para manter o stream jogável:

**Reduza a resolução antes de reduzir o bitrate.** Cair de 1080p para 720p com o mesmo bitrate melhora a qualidade por pixel e reduz a latência de encode. Um stream 720p a 10 Mbps parece melhor que 1080p a 10 Mbps.

**Desligue o tráfego de fundo.** Pausar downloads, fechar streams de vídeo e desligar atualizações automáticas libera banda. No Deck, verifique se não há downloads ativos na Steam:

```terminal
$ ss -tunp | grep -c ESTAB
14
## Muitas conexões estabelecidas podem indicar tráfego de fundo.
## Feche navegadores, lojas e atualizações automáticas.
```

**Force o codec mais rápido.** Se o problema for latência de encode e não largura de banda, force H.264. Se o problema for banda, force HEVC. A escolha manual em Settings > Remote Play > Advanced > Preferred Codec substitui a detecção automática.

:::atencao
A latência total acima de 60 ms torna jogos de ação (FPS, luta, ritmo) frustrantes. Abaixo de 30 ms, a maioria das pessoas não nota diferença em relação ao jogo local. RPGs, estratégia e aventuras point-and-click permanecem jogáveis até 100 ms — o cérebro compensa o atraso em interações mais lentas.
:::

## Resumo

- Latência total = input (~1 ms) + rede (1–30 ms local) + encode (3–12 ms) + decode/display (5–20 ms).
- HEVC comprime melhor (metade do bitrate do H.264), mas adiciona 2–5 ms de encode latency no Deck.
- Limitar o FPS do jogo ao FPS do stream economiza GPU, bateria e reduz micro-stuttering.
- Em redes congestionadas, reduza a resolução antes do bitrate; força HEVC se o problema for banda, H.264 se for latência.
- Latência total abaixo de 30 ms é imperceptível; acima de 60 ms prejudica jogos de ritmo rápido.

## Exercícios

1. Durante um stream, abra o performance overlay (`[[Ctrl+Shift+Tab]]`) e anote as quatro latências separadamente. Qual é a maior fatia na sua rede?
2. Meça a network latency com `ping -c 20 -i 0.2` entre Deck e cliente. O desvio padrão (mdev) é menor que 2 ms? Se não, investigue a causa do jitter.
3. Faça dois streams do mesmo jogo: um com HEVC, outro com H.264. Compare a qualidade visual (especialmente em cenas com movimento rápido) e a latência de encode no overlay.
4. Limite o FPS do jogo a 30 e configure o stream para 30 FPS. Depois, jogue com o jogo a 60 FPS e stream a 30. Sinta a diferença de fluidez e verifique o consumo de bateria.
5. **Desafio.** Use `tc` (traffic control) no Deck para simular uma rede ruim: `sudo tc qdisc add dev wlan0 root netem delay 20ms loss 2%`. Inicie um stream e observe o comportamento. Depois remova com `sudo tc qdisc del dev wlan0 root`. O que o packet loss causa no stream — congelamento, artefatos ou queda de resolução?