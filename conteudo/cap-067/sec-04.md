Com o console pareado, o próximo passo é acertar os parâmetros de streaming. O Chiaki expõe controles que o app oficial da Sony esconde: codec, resolução, bitrate e buffer de áudio. A combinação certa desses valores é o que separa uma imagem nítida e responsiva de uma experiência cheia de artefatos e atraso. Esta seção mostra como calibrar cada parâmetro ao seu ambiente de rede e ao tipo de jogo.

:::objetivos
- Configurar resolução, FPS e codec conforme a capacidade da rede
- Entender a relação entre bitrate, qualidade visual e latência
- Ajustar o buffer de áudio para evitar cortes e dessincronia
- Criar perfis de configuração para cenários diferentes
- Medir o impacto de cada ajuste com métricas objetivas
:::

## Resolução e taxa de quadros: o ponto de partida

O primeiro ajuste é definir a resolução e a taxa de quadros que o console vai enviar. Isso não depende da tela do Deck (que é 1280x800), mas sim da capacidade da rede e do hardware do console:

| Console | Resolução máxima | FPS máximo | Codec nativo |
|---|---|---|---|
| PS4 (base) | 720p | 60 | H.264 |
| PS4 Pro | 1080p | 60 | H.264 |
| PS5 | 1080p | 60 | H.265 |

No Chiaki4Deck, essas opções ficam no menu de configuração do console, acessível clicando no ícone de engrenagem ao lado do nome do console na tela principal.

```terminal
## Configurações recomendadas de fábrica para teste inicial:
## Resolução: 720p
## FPS: 60
## Codec: H.264
## Bitrate: 10000
```

Esses são valores conservadores que funcionam em praticamente qualquer rede. A partir deles, você sobe progressivamente até encontrar o limite da sua conexão.

:::dica
Comece sempre pelo mínimo e vá subindo. É mais produtivo encontrar o ponto onde o streaming quebra do que tentar adivinhar o máximo teórico — o que funciona às 2 da manhã pode não funcionar às 8 da noite com mais dispositivos na rede.
:::

## Codec: H.264 vs H.265

A escolha do codec é o ajuste de maior impacto na qualidade percebida. O PS5 (e apenas o PS5) suporta H.265, que comprime o vídeo com mais eficiência: para a mesma qualidade visual, o bitrate necessário é cerca de 40% menor.

```terminal
## Exemplo de consumo de banda por cenário (valores aproximados):

## H.264, 1080p, 60 FPS: ~15-20 Mbps
## H.265, 1080p, 60 FPS: ~10-12 Mbps
## H.264, 720p, 60 FPS:  ~8-10 Mbps
## H.265, 720p, 60 FPS:  ~5-7 Mbps
```

A troca do codec no Chiaki é feita na tela de configuração do console ou, se estiver usando a linha de comando, no arquivo de configuração:

```terminal
$ cat ~/.config/chiaki/config.json | grep codec
    "codec": "h264",
```

Para PS5 com boa rede, trocar para H.265 é a primeira otimização recomendada. O ganho é perceptível mesmo em 720p, com cores mais precisas e menos artefatos de blocos em áreas escuras. Em PS4, essa opção não está disponível — o hardware simplesmente não tem encoder H.265 para streaming.

:::info
O H.265 exige decodificação por hardware no lado do cliente. O Steam Deck, com sua APU AMD Van Gogh, decodifica H.265 em hardware sem esforço — o impacto no uso de CPU e bateria é insignificante comparado ao H.264.
:::

## Bitrate: a variável mais sensível

O bitrate controla quantos bits por segundo o console envia para o Deck. Valores mais altos produzem imagem mais nítida, mas exigem mais banda e podem aumentar a latência se a rede não acompanhar. O Chiaki permite valores entre 3000 e 30000 kbps:

```terminal
## Teste progressivo de bitrate:
$ chiaki --stream --host 192.168.1.151 --bitrate 5000   ## Mínimo aceitável
$ chiaki --stream --host 192.168.1.151 --bitrate 10000  ## Bom para 720p
$ chiaki --stream --host 192.168.1.151 --bitrate 15000  ## Bom para 1080p H.265
$ chiaki --stream --host 192.168.1.151 --bitrate 20000  ## Excelente, se a rede aguentar
```

O sintoma de bitrate baixo demais é fácil de identificar: a imagem fica "borrada" ou com blocos visíveis, especialmente em cenas de movimento rápido ou áreas escuras. O sintoma de bitrate alto demais é mais sutil: a latência sobe gradualmente e podem aparecer engasgos periódicos, porque o buffer de rede enche e precisa ser esvaziado.

```terminal
$ iperf3 -c 192.168.1.151 -t 10
Connecting to host 192.168.1.151, port 5201
[  5] local 192.168.1.50 port 52344 connected to 192.168.1.151 port 5201
[ ID] Interval           Transfer     Bitrate
[  5]   0.00-10.00  sec   200 MBytes   168 Mbits/sec
```

Essa medição com `iperf3` mostra a banda real entre o Deck e o console. Para streaming 1080p H.265 a 60 FPS, você precisa de pelo menos 12 Mbps estáveis — o que significa que a banda medida deve ser pelo menos o dobro disso (24 Mbps) para absorver picos e oscilações.

## Ajuste de buffer de áudio

Problemas de áudio — cortes, estalos, dessincronia com o vídeo — quase sempre vêm do buffer de áudio configurado no Chiaki. Esse valor controla quantos milissegundos de áudio o cliente acumula antes de começar a tocar:

```terminal
## Configuração de buffer no Chiaki (em milissegundos):
## Valor padrão: 4000 (4 ms) — muito baixo para Wi-Fi
## Recomendado para Wi-Fi: 8000-12000
## Recomendado para Ethernet (Deck com dock): 4000-6000
```

O trade-off é claro: buffer maior reduz cortes de áudio, mas aumenta a latência percebida. Em jogos de ritmo como RPGs, um buffer de 12000 ms é imperceptível; em shooters competitivos, cada milissegundo conta, então vale testar valores menores.

```terminal
$ cat ~/.config/chiaki/config.json | grep audio
    "audio_buffer_size": 8000,
    "audio_device": "default",
```

Se o áudio continua estalando mesmo com buffer alto, o problema pode estar no servidor PulseAudio do SteamOS. Verifique se há outros aplicativos consumindo áudio simultaneamente:

```terminal
$ pactl list short sinks
0       alsa_output.pci-0000_04_00.5-platform-acp5x_mach.0.HiFi__hw_acp5x_1__sink       module-alsa-card.c      s16le 2ch 44100Hz RUNNING
```

:::dica
Se você joga com fones Bluetooth conectados ao Deck, o buffer de áudio precisa ser ainda maior (16000 ou mais), porque o codec Bluetooth adiciona sua própria latência. Nesse cenário, prefira fones com codec de baixa latência (aptX LL) ou use a saída P2 do Deck.
:::

## Criando perfis para cenários diferentes

A configuração ideal para jogar um RPG no sofá não é a mesma para um jogo de luta competitivo. O Chiaki permite salvar perfis por console, e cada um pode ter configurações diferentes:

```terminal
## Exemplo de perfis no Chiaki4Deck:

## Perfil "Qualidade" (RPG, aventura, single-player):
## Resolução: 1080p, FPS: 60, Codec: H.265, Bitrate: 20000, Audio buffer: 12000

## Perfil "Desempenho" (ação, tiro, luta):
## Resolução: 720p, FPS: 60, Codec: H.265, Bitrate: 10000, Audio buffer: 6000

## Perfil "Economia" (bateria, longe do roteador):
## Resolução: 540p, FPS: 30, Codec: H.264, Bitrate: 5000, Audio buffer: 12000
```

A resolução menor consome menos banda e menos bateria do Deck, já que o decoder de vídeo trabalha menos. Em situações de sinal Wi-Fi fraco (abaixo de -65 dBm), reduzir a resolução é a forma mais eficaz de manter o streaming estável.

## Resumo

- Comece com 720p, H.264 e 10000 kbps; suba progressivamente até encontrar o limite da sua rede.
- H.265 no PS5 reduz o bitrate necessário em ~40% comparado ao H.264, com qualidade visual similar.
- O bitrate ideal é limitado pela banda real da rede, medida com `iperf3`; mantenha pelo menos o dobro do bitrate configurado como margem.
- Buffer de áudio entre 8000 e 12000 ms resolve a maioria dos problemas de áudio em Wi-Fi; em Ethernet, 4000 ms é suficiente.
- Perfis de configuração permitem alternar rapidamente entre qualidade máxima e desempenho otimizado.

## Exercícios

1. Meça a banda real entre seu Deck e o console com `iperf3 -c <ip-do-console> -t 15`. Qual é o bitrate máximo sustentável?
2. Configure dois perfis no Chiaki: um para qualidade (1080p, H.265, bitrate alto) e outro para desempenho (720p, H.265, bitrate moderado). Jogue por 5 minutos em cada perfil e anote suas impressões subjetivas.
3. Teste o buffer de áudio em três valores: 4000, 8000 e 12000. Em qual deles você percebe cortes? Em qual deles percebe atraso em relação ao vídeo?
4. Com o Deck longe do roteador (sinal abaixo de -60 dBm), reduza a resolução para 540p. O streaming continua jogável? A que distância do roteador a qualidade se torna inaceitável?
5. **Desafio.** Escreva um script que execute `iperf3` entre Deck e console, leia o resultado e sugira automaticamente as configurações ideais de codec, resolução e bitrate para o Chiaki. O script deve considerar uma margem de segurança de 50% sobre o bitrate medido.