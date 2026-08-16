Você tem um PC parrudo na mesa e um Steam Deck nas mãos. Em vez de instalar o jogo duas vezes, rezar para o save sincronizar via nuvem e aceitar uma qualidade gráfica menor no Deck, existe um caminho mais inteligente: rodar o jogo no PC e transmitir a imagem para o Deck pela rede local. Isso é o Steam Remote Play, uma funcionalidade embutida no cliente Steam que transforma o Steam Deck em um terminal de jogo fino, com aceleração por hardware e latência baixa o suficiente para a maioria dos gêneros.

:::objetivos
- Compreender a arquitetura de captura, codificação, transmissão e decodificação do Remote Play
- Diferenciar streaming local, remoto e Steam Link físico
- Identificar os codecs usados e o papel do hardware de cada ponta
- Avaliar se seu PC está pronto para hospedar sessões de Remote Play
- Conhecer os limites de gêneros onde o streaming é viável
:::

## O que acontece entre o clique e o pixel

Quando você inicia uma sessão de Remote Play, quatro estágios se sucedem em pipeline, cada um adicionando uma fração de latência:

**Captura.** O Steam no PC hospedeiro captura o frame renderizado pela GPU diretamente do buffer de saída — sem precisar passar pela saída HDMI física. Isso é feito via APIs de baixo nível: NVFBC (NVIDIA Frame Buffer Capture) em GPUs NVIDIA, AMF Encoder em GPUs AMD, ou DirectX Graphics Infrastructure em GPUs Intel.

**Codificação.** O frame bruto é comprimido por um codificador de vídeo por hardware. O Steam Remote Play usa majoritariamente H.264, com suporte experimental a H.265/HEVC em hardware compatível. O codificador do hospedeiro precisa ser rápido — estamos falando de codificar 60 quadros por segundo com latência de poucos milissegundos.

**Transmissão.** Os pacotes codificados trafegam pela rede local. O Steam usa UDP com um protocolo próprio de transporte que prioriza baixa latência sobre integridade perfeita — um frame perdido é descartado, não retransmitido, porque retransmitir um frame de 16 ms que chegaria 50 ms depois é pior do que pular o frame.

**Decodificação e exibição.** O Steam Deck recebe os pacotes, o decodificador de hardware da APU Aerith os converte de volta em frames e os exibe na tela. Simultaneamente, o Deck envia de volta os comandos dos controles — analógicos, botões, giroscópio e touchpads — pelo mesmo canal UDP.

```terminal
$ cat /sys/class/drm/card0/device/gpu_busy_percent
12
$ vainfo
libva info: VA-API version 1.20.0
libva info: Trying to open /usr/lib/dri/radeonsi_drv_video.so
libva info: Found init function __vaDriverInit_1_20
vainfo: VA-API version: 1.20 (libva 2.20.0)
vainfo: Driver version: Mesa Gallium driver 23.3.6 for AMD Custom APU 0405
      VAProfileH264High               : VAEntrypointVLD
      VAProfileH264High               : VAEntrypointEncSlice
      VAProfileHEVCMain               : VAEntrypointVLD
      VAProfileHEVCMain               : VAEntrypointEncSlice
```

A saída do `vainfo` no Steam Deck mostra que a APU customizada da AMD suporta decodificação e codificação H.264 e HEVC via VA-API — o que significa que o Deck consegue decodificar o stream sem pesar na CPU. A GPU fica em ~12% de uso durante uma sessão de streaming, contra 85-95% rodando o jogo nativamente.

:::info
O Steam Deck LCD e o modelo OLED usam a mesma APU Aerith (TSMC 7 nm, Zen 2 + RDNA 2). Ambos decodificam H.264 e H.265 em hardware sem diferença de latência. A diferença relevante para streaming está na tela: o OLED tem taxa de atualização de 90 Hz e HDR, enquanto o LCD roda a 60 Hz com cores SDR. Se o jogo no PC hospedeiro renderiza acima de 60 fps em HDR, o modelo OLED aproveita isso melhor.
:::

## Não é só para casa: os três modos de conexão

Embora este capítulo foque no streaming local, o Steam Remote Play opera em três modos distintos e vale a pena entender o que os diferencia:

| Modo | Rede | Latência típica | Uso principal |
|---|---|---|---|
| **Local** | LAN (Wi-Fi 5 GHz ou Ethernet) | 3-15 ms de rede + encode/decode | Jogar no Deck dentro de casa |
| **Remoto** | Internet (4G/5G ou Wi-Fi externo) | 30-100 ms de rede + encode/decode | Jogar fora de casa |
| **Steam Link físico** | LAN, dispositivo dedicado | Similar ao local | TV da sala, sem Deck |

No modo remoto, a Valve atua como intermediária usando STUN/TURN para furar NATs — seu Deck e seu PC não precisam estar na mesma rede, mas o tráfego de vídeo e controle é ponto a ponto sempre que possível. Se ambos estiverem atrás de NAT restritivo, os servidores da Valve retransmitem o stream, o que adiciona latência.

:::atencao
O Remote Play **local** não funciona offline — a Valve exige que ambos os clientes Steam estejam autenticados nos servidores dela para iniciar a sessão. Sem internet nem para logar, o Remote Play recusa-se a emparelhar, mesmo que PC e Deck estejam no mesmo switch Ethernet. O Moonlight+Sunshine (que veremos na seção 9) não tem essa limitação.
:::

## Quais jogos são bons candidatos

O streaming local adiciona entre 3 e 15 ms de latência de rede, mais o tempo de codificação e decodificação (2-8 ms). O total fica tipicamente entre 5 e 25 ms de latência adicional. Isso torna o Remote Play perfeitamente jogável para RPGs, estratégia, aventura, simulação, jogos casual e a maioria dos single-player. Mas para jogos de ritmo competitivo ou que exigem timing de precisão milimétrica, a latência adicional pode ser perceptível.

```terminal
$ ping -c 5 -q 192.168.1.100
PING 192.168.1.100 (192.168.1.100) 56(84) bytes of data.

--- 192.168.1.100 ping statistics ---
5 packets transmitted, 5 received, 0% packet loss, time 4003ms
rtt min/avg/max/mdev = 1.234/2.108/3.567/0.782 ms
```

Com um ping médio de 2 ms entre o Deck e o PC, você está na zona ideal. Até ~8 ms de ping, o streaming é confortável para a maioria dos jogos. Entre 8 e 15 ms, jogos de ação rápida começam a mostrar um leve descolamento entre o comando e a resposta. Acima de 25 ms constantes, o Remote Play local está em zona de atenção — provavelmente há interferência no Wi-Fi ou bufferbloat.

Mas atenção: ping baixo não garante banda suficiente. O Remote Play precisa de 15-30 Mbit/s sustentados. O `ping` mede latência de um único pacote, não largura de banda. Para isso, o `iperf3` (detalhado na seção 6) faz uma medição mais realista do enlace:

```terminal
$ iperf3 -c 192.168.1.100 -t 5
Connecting to host 192.168.1.100, port 5201
[  5] local 192.168.1.50 port 5201 connected to 192.168.1.100 port 5201
[ ID] Interval           Transfer     Bitrate         Retr
[  5]   0.00-5.00   sec  56.2 MBytes  94.3 Mbits/sec    0             sender
[  5]   0.00-5.00   sec  55.9 MBytes  93.8 Mbits/sec                  receiver
```

Com 94 Mbit/s estáveis e zero retransmissões, há largura de sobra. Se o `iperf3` mostra menos de 30 Mbit/s ou retransmissões frequentes, o enlace está no limite para streaming.

## Resumo

- O Remote Play captura frames do PC, codifica em H.264, transmite por UDP e decodifica no Deck via aceleração de hardware.
- A latência adicional total fica entre 5 e 25 ms em LAN — suficiente para tudo exceto jogos competitivos de reflexo.
- O Steam exige autenticação online mesmo para streaming local; sem internet o Remote Play não inicia.
- A APU Aerith do Steam Deck tem decodificação H.264 e HEVC por hardware, mantendo a CPU livre durante o streaming.
- O Remote Play opera em três modos: local (LAN), remoto (internet) e via Steam Link físico, com diferenças grandes de latência.

## Exercícios

1. Execute `vainfo` no seu Steam Deck e verifique quais codecs a APU suporta para decodificação (`VLD`) e codificação (`EncSlice`). O HEVC está disponível?
2. Faça um ping entre o Deck e o PC hospedeiro (`ping -c 20 192.168.x.x`). Qual é o desvio padrão (mdev)? Ele é maior ou menor que o ping médio?
3. Inicie uma sessão de Remote Play com um jogo de ação e outro de estratégia. Perceba a diferença de experiência e anote em qual gênero a latência incomoda mais.
4. No PC hospedeiro, abra o Gerenciador de Tarefas (Windows) ou o `radeontop` (Linux) durante o streaming e observe o uso do encoder de vídeo. Qual percentual da GPU está sendo usado para codificação?
5. **Desafio.** Compare a latência de um jogo rodando nativamente no Deck com o mesmo jogo via Remote Play local. Use a câmera lenta de um celular (240 fps ou mais) para medir o tempo entre apertar um botão e a resposta na tela. Quantos frames de diferença você encontra?