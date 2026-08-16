O streaming do Steam Deck não é mágica — é compressão de vídeo, transporte de rede e controle remoto sobre protocolos que você pode inspecionar e ajustar. O Deck atua como servidor: captura a tela, codifica o sinal em tempo real e envia pelo Wi-Fi. O que chega ao cliente (PC, TV, celular) é uma transmissão espelhada, com latência baixa o suficiente para jogar. Entender as peças desse quebra-cabeça ajuda a otimizar a qualidade e diagnosticar problemas que a interface gráfica esconde.

:::objetivos
- Entender o fluxo de dados do streaming: captura, codificação, transporte e decodificação
- Diferenciar Steam Remote Play e Steam Link como tecnologias distintas
- Identificar os requisitos de hardware e rede de cada lado da transmissão
- Conhecer os codecs usados pelo SteamOS e suas implicações de desempenho
- Saber onde as configurações de streaming são armazenadas no disco
:::

## O fluxo de um frame até a tela remota

O streaming de jogos no SteamOS segue quatro etapas. **Captura**: a GPU do Deck renderiza o frame e, ao mesmo tempo, o copia para um buffer de streaming via hardware encoder (VA-API no caso da APU AMD Van Gogh). **Codificação**: o encoder comprime o frame em H.264 ou HEVC — o Deck escolhe automaticamente, mas você pode forçar a preferência. **Transporte**: os pacotes comprimidos são enviados via UDP (principal) e TCP (controle) sobre a rede local, usando portas que o Steam negocia dinamicamente. **Decodificação**: o cliente recebe os pacotes, descomprime com seu próprio hardware decoder e exibe na tela.

Todo esse ciclo se repete a 30 ou 60 vezes por segundo. A mágica está em fazer isso com latência inferior a 30 ms na rede local — tempo suficiente para apertar um botão e ver o resultado na tela remota sem perceber o atraso.

```terminal
$ nproc
8
$ lscpu | grep -i "model name"
Model name:                      AMD Custom APU 0405
$ vainfo 2>/dev/null | head -6
libva info: VA-API version 1.20.0
libva info: Trying to open /usr/lib/dri/radeonsi_drv_video.so
libva info: Found init function __vaDriverInit_1_20
vainfo: VA-API version: 1.20 (libva 2.20.0)
vainfo: Driver version: Mesa Gallium 24.0.5
vainfo: Supported profile and entrypoints
      VAProfileH264Main               : VAEntrypointVLD
      VAProfileH264High               : VAEntrypointVLD
      VAProfileHEVCMain               : VAEntrypointVLD
```

A saída do `vainfo` (Video Acceleration API) confirma que o Deck tem suporte de hardware para codificar H.264 e HEVC — as duas famílias de codec que o streaming usa. Sem esse suporte, a CPU faria a codificação por software, esquentando mais e reduzindo drasticamente a qualidade do jogo que está sendo transmitido.

## Steam Remote Play versus Steam Link

Embora os termos sejam usados como sinônimos na interface do Steam, eles representam camadas diferentes da mesma tecnologia.

**Steam Remote Play** é o protocolo: o conjunto de regras que define como o servidor captura, codifica e envia o sinal. Ele foi lançado em 2019 como evolução do antigo In-Home Streaming e unificou o streaming entre dispositivos Steam. Qualquer cliente Steam (PC, Mac, Linux) pode receber um stream Remote Play.

**Steam Link** originalmente era um hardware — um aparelho HDMI que a Valve vendeu entre 2015 e 2018. Hoje, Steam Link é o aplicativo cliente disponível para Android, iOS, Raspberry Pi e smart TVs Samsung. Ele implementa o mesmo protocolo Remote Play, mas roda como app standalone, sem precisar do cliente Steam completo.

```terminal
$ ls -la ~/.steam/steam/config/ | grep -i -E 'streaming|remote|link'
-rw-r--r-- 1 deck deck  2048 Aug 10 11:22 streaming_settings.vdf
-rw-r--r-- 1 deck deck  1024 Aug 10 11:22 remotetogether.json
```

O arquivo `streaming_settings.vdf` armazena as preferências globais de streaming. É um arquivo de texto no formato Valve Data Format (VDF), legível com `cat` e editável se necessário — embora a interface do Steam seja o caminho recomendado.

## O que cada ponta precisa

Do lado do **servidor** (Deck), o requisito mais importante é uma rede Wi-Fi estável de 5 GHz e o hardware encoder da GPU — que todo Deck tem. O jogo está rodando localmente no Deck, então o desempenho depende da capacidade da máquina de renderizar e codificar ao mesmo tempo. Em jogos pesados, isso pode significar uma queda de 5 a 10 FPS enquanto o stream está ativo.

Do lado do **cliente** (dispositivo que recebe), o requisito é bem mais modesto: hardware decoder de vídeo compatível com H.264 ou HEVC e uma tela. Até um Raspberry Pi 4 serve. A entrada (controle, teclado, mouse) é capturada no cliente e enviada de volta ao Deck pelo mesmo canal de controle.

Antes de iniciar o primeiro stream, confirme que a rede está saudável com uma checagem rápida de latência:

```terminal
$ ping -c 3 192.168.1.101
PING 192.168.1.101 (192.168.1.101) 56(84) bytes of data.
64 bytes from 192.168.1.101: icmp_seq=1 ttl=64 time=2.31 ms
64 bytes from 192.168.1.101: icmp_seq=2 ttl=64 time=2.45 ms
64 bytes from 192.168.1.101: icmp_seq=3 ttl=64 time=2.18 ms

--- 192.168.1.101 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2003ms
rtt min/avg/max/mdev = 2.180/2.313/2.450/0.110 ms
```

Latência abaixo de 3 ms e zero perda de pacotes — a rede está pronta para streaming. Se o ping mostrar valores acima de 10 ms ou perda de pacotes, resolva a rede antes de culpar o Steam.

:::dica
O Deck não precisa estar conectado a um monitor externo para fazer streaming. Ele pode estar com a tela apagada (modo dock sem monitor) e ainda assim transmitir — o encoder da GPU funciona independentemente da saída de vídeo física. Isso é útil para economizar bateria quando você transmite para a TV.
:::

## Resumo

- O streaming segue quatro etapas: captura na GPU, codificação via VA-API, transporte UDP/TCP e decodificação no cliente.
- Steam Remote Play é o protocolo; Steam Link é o app cliente que implementa esse protocolo em dispositivos não-Steam.
- O Deck usa o encoder de hardware da APU AMD para H.264 e HEVC, verificável com `vainfo`.
- As configurações de streaming ficam em `~/.steam/steam/config/streaming_settings.vdf`.
- O cliente de streaming precisa apenas de hardware decoder de vídeo e uma rede estável; o jogo roda só no Deck.

## Exercícios

1. No Deck, execute `vainfo` e identifique os perfis H.264 e HEVC suportados. Anote qual versão da VA-API está em uso.
2. Abra o arquivo `~/.steam/steam/config/streaming_settings.vdf` com `cat` e localize entradas como `bitrate`, `resolution` e `preferredCodec`. O que está configurado atualmente?
3. Com o streaming ativo entre Deck e outro dispositivo, execute `ss -tunp | grep steam` e tente identificar as conexões UDP e TCP usadas pelo processo `steam`.
4. Pesquise na documentação da Valve (ou no próprio Steam) qual é a diferença entre "Remote Play" e "Remote Play Together" — são usos diferentes do mesmo protocolo?
5. **Desafio.** Rode um jogo leve no Deck enquanto monitora `top` ou `htop` em outra janela. Inicie um stream para outro dispositivo e observe o consumo de CPU antes e durante o stream. Quanto o encoder de hardware aumenta o uso da CPU? Se houver diferença, explique por que o hardware encoder não elimina totalmente o custo.