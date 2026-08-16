A TV da sala é o destino mais natural para o streaming do Deck: tela grande, sofá e um controle na mão. O aplicativo Steam Link está disponível para smart TVs Samsung (2017 em diante), Apple TV (via App Store), Android TV e Fire TV. E se sua TV não for inteligente, um Raspberry Pi 4 com o Steam Link resolve por menos de R$ 300,00.

:::objetivos
- Instalar e configurar o Steam Link na TV ou em dispositivo HDMI
- Parear com o Deck e iniciar o primeiro stream
- Ajustar resolução e proporção para TVs 4K
- Conectar controles Bluetooth à TV ou ao dispositivo Steam Link
- Reduzir input lag com modo jogo da TV e ajustes de rede
:::

## Instalando o Steam Link na TV

Para smart TVs Samsung, o Steam Link está na loja de apps da própria TV (Samsung App Store). Para Android TV (Sony, Philips, TCL, Xiaomi Mi Box, NVIDIA Shield), está na Google Play Store. Fire TV e Apple TV seguem o mesmo caminho em suas respectivas lojas. A instalação é um clique.

Para TVs burras (ou se você prefere um dispositivo dedicado), o Steam Link para Raspberry Pi é um sistema operacional completo — não um app. Você grava a imagem num cartão microSD e o Pi liga direto no Steam Link, sem desktop, sem terminal. A imagem oficial está em `https://www.raspberrypi.com/software/` (use o Raspberry Pi Imager e escolha Steam Link na categoria "Media player OS").

```terminal
## No Raspberry Pi, depois de ligar (acessível via SSH se habilitado):
$ cat /etc/os-release 2>/dev/null || cat /etc/steamlink-release
NAME="Steam Link"
VERSION="1.3.11"
BUILD="stable"
```

O Pi detecta automaticamente o Deck na rede e pede para parear. É literalmente ligar, conectar o HDMI e jogar.

## Pareando com o Deck

Com o Steam Link aberto na TV, ele escaneia a rede local e lista os servidores disponíveis. Toque no nome do Deck. A TV exibe um código PIN de quatro dígitos. No Deck, uma notificação aparece: "Steam Link is requesting to pair — enter PIN XXXX". Digite o código e os dois dispositivos estarão pareados permanentemente.

```terminal
## No Deck, enquanto o Steam Link está escaneando:
$ ss -tunp | grep steam | grep -E '27031|27036'
udp   UNCONN 0      0          0.0.0.0:27031       0.0.0.0:*    users:(("steam",pid=1421,fd=33))
udp   UNCONN 0      0          0.0.0.0:27036       0.0.0.0:*    users:(("steam",pid=1421,fd=38))
```

As portas UDP de descoberta (27031 e 27036) já estão abertas mesmo antes do pareamento — é por elas que o Steam Link encontra o Deck na rede via broadcast/multicast. Se o Steam Link não encontra o Deck, o problema quase sempre é a rede: verifique se ambos estão na mesma sub-rede e se o isolamento de cliente (AP Isolation) está desligado no roteador.

## Ajustando para a tela grande

TVs 4K têm quatro vezes mais pixels que 1080p, e o Deck não consegue codificar 4K em tempo real para a maioria dos jogos. A tela do Deck é 1280x800; a melhor estratégia é transmitir em 1080p e deixar a TV fazer o upscaling — o resultado visual é muito bom e a latência é menor.

No Steam Link (TV), vá em Settings > Streaming e configure:

| Opção | Recomendação |
|---|---|
| Resolution | 1080p (mesmo em TV 4K) |
| Framerate | Auto ou 60 FPS |
| Bitrate | Auto (ou 20 Mbps para fixo) |
| Codec | HEVC se suportado, senão H.264 |
| Bandwidth limit | Unlimited (rede local) |

:::atencao
Toda TV moderna tem **input lag** — atraso entre receber o sinal HDMI e exibir na tela. Ative o **Modo Jogo** (Game Mode) da TV antes de fazer streaming. Em algumas TVs, o input lag cai de 80 ms para 15 ms com essa única configuração. Sem ela, jogar via streaming é frustrante, não importa quão boa seja a rede.
:::

## Conectando controles

O Steam Link na TV aceita controles por Bluetooth direto e por USB (com adaptador OTG, dependendo do dispositivo). Controles Bluetooth emparelhados com a TV são enviados ao Deck como se estivessem conectados diretamente a ele.

Para parear um controle com o Steam Link: abra Settings > Controller > Pair New Controller. Coloque o controle em modo de pareamento (no DualSense, segure `[[PS]]` + `[[Create]]`; no Xbox, segure o botão de pareamento na parte de cima). O Steam Link reconhece e mapeia automaticamente.

```terminal
## No Steam Link (Raspberry Pi), listando controles Bluetooth:
$ ls -l /dev/input/js*
crw-rw---- 1 root input 13, 0 Aug 16 16:10 /dev/input/js0
crw-rw---- 1 root input 13, 1 Aug 16 16:10 /dev/input/js1
```

Os dispositivos `js0` e `js1` são joysticks detectados — o Steam Link os traduz para o protocolo do Steam Input e o Deck os recebe como controles nativos.

## Resumo

- O Steam Link está disponível como app para smart TVs Samsung, Android TV, Apple TV e Fire TV, ou como OS dedicado para Raspberry Pi.
- O pareamento usa PIN de quatro dígitos; a descoberta depende de UDP broadcast nas portas 27031 e 27036.
- Transmita em 1080p mesmo para TVs 4K; o upscaling da TV é eficiente e a latência é menor.
- O Modo Jogo da TV é obrigatório — reduz o input lag de dezenas de milissegundos para níveis jogáveis.
- Controles Bluetooth emparelhados com o Steam Link funcionam como se estivessem conectados diretamente ao Deck.

## Exercícios

1. Instale o Steam Link na sua TV ou num Raspberry Pi e faça o pareamento com o Deck. Registre o código PIN e o tempo até a conexão ser estabelecida.
2. No Stream Link, compare a qualidade visual entre resolução 720p, 1080p e Auto. Há diferença perceptível na sua TV? E na latência?
3. Ative e desative o Modo Jogo da TV durante um stream. Sinta a diferença no input lag. Se houver um medidor de latência no jogo (como o de fighting games), use-o.
4. Conecte dois controles Bluetooth ao Steam Link e jogue um jogo cooperativo local no Deck. Ambos funcionam simultaneamente?
5. **Desafio.** Configure um Raspberry Pi 4 como Steam Link dedicado. Meça o tempo de boot (da energia até a tela de seleção de servidor) e compare com o tempo de abrir o app Steam Link numa smart TV. Qual é mais rápido?