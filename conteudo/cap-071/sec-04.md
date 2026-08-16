Você tem uma RTX 4070 parada no escritório e um Steam Deck nas mãos no sofá. O que a Valve oferece para unir os dois chama-se **Steam Remote Play**: o jogo roda no PC host, e o Deck recebe um stream de vídeo e áudio enquanto devolve os comandos. É a solução de streaming *integrada e nativa* da Steam — sem instalar mais nada e sem depender de internet externa. O antigo hardware **Steam Link** e seu app cumprem o mesmo papel, mas em televisores, celulares e tablets.

:::objetivos
- Entender o modelo cliente-servidor do Steam Remote Play: jogo no host, stream no Deck
- Configurar o Remote Play no PC host e iniciar um stream a partir do Steam Deck
- Medir latência e banda da rede local para avaliar a viabilidade do streaming
- Conhecer os codecs e os perfis de qualidade (Fast, Balanced, Beautiful)
- Julgar quando o streaming local compensa — e quando é melhor rodar no próprio Deck
:::

## Como o Remote Play funciona

O mecanismo é elegante e você já viu o pipeline na [Seção 1](#/cap-071/sec-01): o Deck vira um *cliente fino*. O PC host captura o frame renderizado pela própria GPU (NVENC no caso NVIDIA, AMF na AMD, QSV na Intel), codifica em H.264 ou HEVC, envia pela rede e o Deck decodifica em hardware — o chip Van Gogh descodifica HEVC/H.264 gastando poucos miliwatts.

**O ponto-chave**: a GPU 3D do Deck fica essencialmente ociosa. Quem trabalha duro é o host. Por isso o Deck esfria, a ventoinha silencia e a bateria rende 6-8 horas num jogo que, nativo, drenaria em 2.

Do lado do host, o custo também é pequeno — mas existe:

- **Encode na GPU do host**: tipicamente 1-3% de uso, dedicado ao codificador
- **A renderização continua normal**: o host precisa rodar o jogo na resolução e qualidade desejadas
- **CPU**: a Steam também pode usar encode por software em máquinas sem encoder, mas aí o custo dispara

:::info
**Dupla utilidade**: o Steam Remote Play também funciona fora de casa, atravessando a internet (Streaming Remoto pela Internet). Porém a qualidade cai conforme a latência sobe. O foco aqui é o caso local — que é onde a experiência realmente brilha.
:::

## Requisitos de rede

Streaming de vídeo em tempo real é sensível a duas métricas: **latência** (tempo de ida e volta de um pacote) e **banda** (quantidade de dados por segundo). Aqui estão os números práticos.

| Requisito | Wi-Fi 5 (802.11ac) | Wi-Fi 6 (802.11ax) | Ethernet via dock |
|-----------|-------------------|-------------------|-------------------|
| Latência típica | 3-8 ms | 1-4 ms | <1 ms |
| Banda útil | 200-800 Mbps | 400-1200 Mbps | 1000 Mbps (Gigabit) |
| Estabilidade | Boa | Melhor (OFDMA reduz fila) | Excelente |
| Verdicto | Funciona | Recomendado | Ideal |

A banda real exigida pelo stream é menor do que muita gente imagina:

- **10 Mbps** — 720p a 30 FPS, qualidade compacta
- **20 Mbps** — 800p a 60 FPS em HEVC (típico do Deck)
- **50 Mbps** — pico com perfil Beautiful em cenas complexas

Ou seja, **15-50 Mbps** é a faixa de trabalho realista. Qualquer rede Wi-Fi 5 decente entrega isso — o problema quase nunca é banda, e sim *estabilidade* e *latência*, agravadas por interferência, paredes e distância do roteador.

A regra de ouro: **o host deve estar no cabo**. Um PC gamer conectado por Ethernet ao roteador elimina metade do caminho sem fio e estabiliza a experiência. O Deck pode ficar no Wi-Fi — mas de preferência 5 GHz, perto do roteador.

:::dica
**Dock vale ouro para streaming**: conecte o Deck a um dock com porta Ethernet e você elimina o link sem fio por completo. Latência cai para a casa de 1 ms de rede, e o stream fica imune a interferência do micro-ondas, vizinhos e paredes.
:::

Vamos medir a latência real entre o Deck e o host:

```terminal
## Descubra o IP do Deck e faça ping no PC host
$ ip -br addr show wlan0
wlan0    UP     192.168.1.105/24

## Ping no PC gamer (host)
$ ping -c 10 192.168.1.20
PING 192.168.1.20 (192.168.1.20) 56(84) bytes of data.
64 bytes from 192.168.1.20: icmp_seq=1 ttl=64 time=3.42 ms
64 bytes from 192.168.1.20: icmp_seq=2 ttl=64 time=2.98 ms
64 bytes from 192.168.1.20: icmp_seq=3 ttl=64 time=4.11 ms
64 bytes from 192.168.1.20: icmp_seq=4 ttl=64 time=3.05 ms
64 bytes from 192.168.1.20: icmp_seq=5 ttl=64 time=3.87 ms
64 bytes from 192.168.1.20: icmp_seq=6 ttl=64 time=3.22 ms
64 bytes from 192.168.1.20: icmp_seq=7 ttl=64 time=5.44 ms
64 bytes from 192.168.1.20: icmp_seq=8 ttl=64 time=3.31 ms
64 bytes from 192.168.1.20: icmp_seq=9 ttl=64 time=3.10 ms
64 bytes from 192.168.1.20: icmp_seq=10 ttl=64 time=3.56 ms

--- 192.168.1.20 ping statistics ---
10 packets transmitted, 10 received, 0% packet loss
time 9054ms
rtt min/avg/max/mdev = 2.980/3.606/5.440/0.685 ms
```

Latência média de 3,6 ms, com um pico de 5,4 ms. Isso é Wi-Fi 5 típico: **perfeitamente jogável**, mas já suficiente para notar a diferença quando comparado ao cabo. Note o `mdev` de 0,685 ms — o *jitter* (variação) importa tanto quanto a média, pois é ele que causa engasgos visíveis.

Para confirmar que a banda não será o gargalo, um teste de throughput:

```terminal
## iperf3 no host (servidor) — execute no PC gamer primeiro:
##   iperf3 -s

## No Deck, rode o cliente contra o host
$ iperf3 -c 192.168.1.20 -t 10
Connecting to host 192.168.1.20, port 5201
[  5] local 192.168.1.105 port 54230 connected to 192.168.1.20 port 5201
[ ID] Interval           Transfer     Bitrate         Retr
[  5]   0.00-1.00   sec  23.4 MBytes   196 Mbits/sec   12
[  5]   1.00-2.00   sec  25.1 MBytes   210 Mbits/sec    0
[  5]   2.00-3.00   sec  24.8 MBytes   208 Mbits/sec    3
[  5]   3.00-4.00   sec  22.1 MBytes   185 Mbits/sec    9
[  5]   4.00-5.00   sec  24.3 MBytes   204 Mbits/sec    2
[  5]   5.00-6.00   sec  25.0 MBytes   210 Mbits/sec    1
[  5]   6.00-7.00   sec  24.6 MBytes   206 Mbits/sec    4
[  5]   7.00-8.00   sec  23.9 MBytes   200 Mbits/sec    8
[  5]   8.00-9.00   sec  24.5 MBytes   206 Mbits/sec    0
[  5]   9.00-10.00  sec  24.9 MBytes   209 Mbits/sec    2
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
[ ID] Interval           Transfer     Bitrate         Retr
[  5]   0.00-10.00  sec   243 MBytes   203 Mbits/sec    41             sender
[  5]   0.00-10.00  sec   242 MBytes   203 Mbits/sec                  receiver
```

~203 Mbps sustentados — muito acima dos 50 Mbps que o stream exige no pior caso. A coluna `Retr` (retransmissões) mostra 41 pacotes perdidos/reenviados em 10 segundos: normal para Wi-Fi, e a razão pela qual o cabo é preferível quando possível. Sobra banda com folga.

## Configuração no host

Habilitar o Remote Play no PC é um passo único nas configurações da Steam:

1. No PC host, abra **Steam → Configurações → Remote Play**
2. Ative **"Habilitar Remote Play"**
3. Em **Opções avançadas do host**, ajuste conforme sua máquina:
   - **Habilitar codificação por hardware** — deve estar ligado (NVENC/AMF/QSV)
   - **Habilitar codificação por software** — ative apenas se não houver encoder por hardware
   - **Priorizar tráfego de rede** — útil para reduzir latência em redes cheias
   - **Mudar resolução do desktop para corresponder ao cliente** — ajuda em setups de múltiplos monitores

O host também precisa estar **logado na mesma conta Steam** que o Deck. O stream é amarrado à conta: não há mecanismo de convidado como no Moonlight, embora contas da mesma família (Steam Families) possam compartilhar a biblioteca.

:::atencao
**Encoder é obrigatório para boa experiência**: se o host não tiver codificação por hardware (ou ela estiver desligada), a Steam usa o x264 por software — o que rouba CPU do próprio jogo, eleva a latência de encode e pode derrubar o FPS no host. Confirme que o encoder está ativo antes de culpar a rede.
:::

Não há "instalação" no lado do Deck: o cliente Remote Play é parte do próprio sistema SteamOS. A única exigência é estar na mesma rede local (ou usar o Streaming Remoto pela Internet, fora do escopo aqui).

## Iniciando o stream no Deck

Com o host ligado e logado, o processo no Deck é trivial:

1. Abra a **biblioteca Steam** e selecione um jogo instalado no PC host
2. Ao lado do botão verde **Jogar**, note a **seta para baixo** (`▾`)
3. Clique na seta e escolha o host na lista que aparece (ex.: `DESKTOP-GAMER`)
4. A Steam inicia a sessão: o jogo abre no PC e o stream aparece no Deck

Enquanto o stream está ativo, um pequeno indicador aparece na tela. Para ver estatísticas de desempenho em tempo real, ative a sobreposição:

```terminal
## Dentro do jogo em stream, abra a sobreposição com o botão Steam
## Verifique o overlay de performance nas configurações rápidas (…)
## Alternativa: observar logs do cliente Remote Play

$ journalctl --user -f | grep -iE "remote|stream|codec"
Dec 14 11:32:07 steamdeck steam[1241]: Remote Play session started: appid=1086940 host=192.168.1.20
Dec 14 11:32:08 steamdeck steam[1241]: Video codec negotiated: HEVC (H.265)
Dec 14 11:32:08 steamdeck steam[1241]: Resolution: 1280x800 @ 60 FPS
Dec 14 11:32:08 steamdeck steam[1241]: Target bitrate: 20000 kbps
Dec 14 11:32:09 steamdeck steam[1241]: Encoding: hardware (NVENC)
Dec 14 11:32:09 steamdeck steam[1241]: Network latency: 4 ms
Dec 14 11:32:09 steamdeck steam[1241]: Decode latency: 5 ms
```

O log revela o que importa: codec HEVC negociado, 800p a 60 FPS, 20 Mbps, encoder NVENC no host e latência de rede de 4 ms com 5 ms de decodificação. Some encode (~3-6 ms) + rede (~4 ms) + decode (~5 ms) e você chega à latência total típica de **10-20 ms extras** — com o grosso vindo do encode/decode, não da rede.

## Codecs e perfis de qualidade

O Remote Play da Steam oferece três presets que equilibram qualidade visual contra custo de computação e banda:

| Perfil | Codec preferido | Bitrate típico | Custo de encode | Quando usar |
|--------|----------------|----------------|-----------------|-------------|
| **Fast** | H.264 | 3-8 Mbps | Baixo | Host fraco ou rede ruim |
| **Balanced** | HEVC (H.265) | 8-20 Mbps | Médio | Padrão, melhor custo-benefício |
| **Beautiful** | HEVC | 20-50 Mbps | Alto | Host potente + rede excelente |

Alguns pontos que a tabela não conta:

- **H.264 é mais compatível e barato de codificar**, mas menos eficiente — precisa de mais bits para a mesma qualidade, e escurece cenas escuras com artefatos de "blocos".
- **HEVC comprime ~40% melhor** que H.264 na mesma qualidade, mas depende de o cliente decodificar em hardware (o Deck decodifica HEVC nativamente).
- **AV1** ainda não é usado pelo Remote Play oficial (a Valve não o expõe no preset), ficando a cargo de soluções como Moonlight/Sunshine — tema da [Seção 5](#/cap-071/sec-05).

A escolha prática é quase sempre **Balanced**: entrega 60 FPS a 800p com qualidade muito boa e latência discreta. **Beautiful** só faz sentido em host parrudo com o Deck no cabo ou Wi-Fi 6 impecável; **Fast** é a saída de emergência para host modesto.

:::perigo
**Compressão em cenas escuras é o calcanhar do streaming**: ambientes noturnos, sombras e neblina sofrem com os chamados *artefatos de banding* — degrades visíveis onde deveria haver transição suave. Jogos de terror e atmosféricos (como *Alan Wake 2* ou *Resident Evil*) revelam isso com crueldade. Se a imagem "cinza" nessas cenas incomoda, suba o bitrate ou considere rodar nativo.
:::

## Limitações honestas do Remote Play

Antes de vender o streaming como bala de prata, anote as limitações reais:

**Latência extra de 5-15 ms mesmo em LAN perfeita.** Em gêneros de reação — FPS competitivo, fighting, rhythm games — isso é perceptível para quem tem reflexo treinado. Em RPGs, estratégia e aventura, é irrelevante.

**Dependência do host.** O PC precisa estar ligado, logado e com o jogo instalado. Se o Windows decidir reiniciar para atualizar no meio da sessão, o stream cai junto.

**Qualidade nunca é pixel-perfect.** Por melhor que seja o bitrate, há compressão — e ela se concentra em cenas escuras e em movimento rápido com muitos detalhes (folhagem, chuva, confete).

**Sem acesso a todas as funções.** O Remote Play espelha o jogo, mas a integração com atalhos de teclado, múltiplos monitores do host e algumas sobreposições pode ser limitada.

## Quando vale a pena

A pergunta certa não é "Remote Play funciona?", e sim "Remote Play compensa *para esse jogo, agora*?". Use estas diretrizes:

**Vale a pena quando:**

- O jogo é **AAA pesado** que o Deck não segura acima de 30 FPS no low — *Cyberpunk 2077*, *Alan Wake 2*, *Starfield*
- É um **jogo de estratégia ou RTS com mouse**, onde o PC gamer com monitor grande e mouse preciso supera a tela de 7 polegadas — *Total War*, *Civilization*, *Anno*
- Você quer **bateria longa** jogando no sofá, na cama ou no quintal, perto do roteador
- O host está **no cabo** e o jogo é de **ritmo lento/médio**

**Não vale a pena quando:**

- O jogo **roda bem nativo** (indies, títulos mais antigos) — o streaming só adiciona latência e perda de qualidade
- É **FPS competitivo** ou **fighting** onde cada milissegundo conta
- O host é **fraco ou está no Wi-Fi** — aí o stream herda os problemas do host
- Você está **fora de casa** sem acesso garantido ao PC

:::nota
**Regra de bolso**: se o jogo mantém 40 FPS estáveis nativamente no Deck, jogue nativo. Se ele mal chega a 30 no low e você tem um PC parrudo no cabo, faça streaming. A decisão, afinada por jogo, é o tema da [Seção 9](#/cap-071/sec-09).
:::

## Steam Link físico vs app

O nome **Steam Link** causa confusão porque designa duas coisas distintas, e uma delas está morta.

**Steam Link físico (hardware)** — um pequeno aparelho lançado em 2015 que ligava a Steam a uma TV via HDMI, rodando um cliente de streaming dedicado. Foi **descontinuado em 2018** e hoje só existe no mercado de usados. Nada nele faz falta: o app moderno o substitui com folga.

**Steam Link (app)** — o sucessor em software, disponível gratuitamente para **Android, iOS/iPadOS, Apple TV, Android TV e Samsung TV**. Ele cumpre exatamente o papel do hardware antigo: transforma qualquer TV ou celular num cliente Remote Play. O app exige parear com o PC host (por código ou conta) e aceita controles Bluetooth ou touchscreen.

Para o universo do Steam Deck, o app importa menos: o Deck já é o cliente perfeito de fábrica. Mas saber que ele existe fecha o quadro — a Valve quer que você jogue seu PC em *qualquer* tela da casa.

| Característica | Steam Link (hardware, 2015) | Steam Link (app, atual) | Steam Deck |
|----------------|----------------------------|------------------------|------------|
| Status | Descontinuado (2018) | Ativo | Ativo (cliente nativo) |
| Plataforma | TV via HDMI | Android/iOS/TV | SteamOS |
| Resolução máx. | 1080p | 4K (conforme dispositivo) | 800p |
| Codec | H.264 | H.264/HEVC | H.264/HEVC |
| Controles | Bluetooth/USB | Bluetooth/touch | Integrados |

## Diagnóstico: quando o stream engasga

Se a imagem congela, dá artefatos ou a latência dispara, siga a trilha de diagnóstico do mais provável ao mais raro:

1. **Host no Wi-Fi?** Coloque no cabo — resolve a maioria dos casos
2. **Encoder por software ativo?** Confira nas opções avançadas do host
3. **Interferência no Wi-Fi do Deck?** Aproxime-se do roteador, use 5 GHz
4. **Bitrate alto demais?** Baixe de Beautiful para Balanced
5. **Rede congestionada?** Outros downloads grandes na mesma rede competem pela banda

Um teste rápido de perda de pacotes revela interferência:

```terminal
## Ping com contagem maior para detectar perda de pacotes
$ ping -c 100 192.168.1.20 | tail -3
100 packets transmitted, 93 received, 7% packet loss, time 99130ms
rtt min/avg/max/mdev = 2.901/12.442/88.113/14.520 ms
```

`7% packet loss` com picos de 88 ms é a assinatura clássica de Wi-Fi ruim. Numa rede assim, o stream vai engasgar visivelmente — resolva a camada de rede antes de culpar a Valve.

## Resumo

- O Steam Remote Play faz o jogo rodar no PC host e envia vídeo/áudio ao Deck, que devolve os inputs — a GPU do Deck fica praticamente ociosa
- Latência extra típica é de 5-15 ms em LAN; banda exigida fica entre 15-50 Mbps, com ~20 Mbps sendo o ponto ideal para 800p/60 FPS
- O host deve usar encoder por hardware e, de preferência, estar conectado por cabo Ethernet; o Deck funciona bem em Wi-Fi 5 e melhor ainda em Wi-Fi 6 ou dock
- Configura-se habilitando o Remote Play nas configurações da Steam e iniciando o jogo pelo menu dropdown ao lado do botão Jogar no Deck
- Os presets Fast, Balanced e Beautiful trocam qualidade por custo de encode e banda; cenas escuras são o ponto fraco da compressão
- O app Steam Link (Android/iOS/TV) substituiu o hardware descontinuado e mantém a mesma função em outras telas

## Exercícios

1. No Steam Deck, meça a latência até o seu PC host com `ping -c 10 <ip-do-host>`. Registre a média (`avg`), o pico (`max`) e o jitter (`mdev`). Classifique sua rede como ideal (<5 ms), aceitável (<15 ms) ou problemática.

2. Habilite o Remote Play no seu PC host e inicie um jogo leve (indie ou 2D) via streaming no Deck, usando o menu dropdown ao lado do botão Jogar. Anote o preset de qualidade usado e o codec negociado (visível no log ou na sobreposição).

3. Instale o `iperf3` no host e no Deck, rode um teste de 10 segundos (`iperf3 -c <ip> -t 10`) e compare o bitrate obtido com a faixa de 15-50 Mbps exigida pelo stream. Documente o resultado.

4. Escolha três jogos da sua biblioteca e, para cada um, decida entre "rodar nativo" ou "fazer streaming", justificando com base no gênero (latência tolerável?) e na exigência gráfica (o Deck aguenta?).

5. **Desafio integrador**: Configure uma sessão completa de Remote Play para um jogo AAA pesado, com o host no cabo e o Deck no Wi-Fi. Durante 15 minutos de jogo, anote: (a) o preset usado, (b) a latência percebida, (c) a temperatura e o nível da bateria do Deck, e (d) qualquer artefato de compressão em cenas escuras. Depois repita o teste com o jogo rodando nativamente no Deck e produza uma tabela comparando qualidade, latência, conforto térmico e bateria. Conclua, com base nos dados, qual modo você adotaria para esse jogo no seu cotidiano.
