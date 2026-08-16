A Valve inclui o Remote Play em cada Steam Deck: um clique no botão de jogo e ele transmite de um PC rodando Steam para o Deck. Mas o Remote Play usa o encoder da Valve e depende do cliente Steam estar rodando no host — o que significa que ele não funciona com todos os jogos e não oferece acesso ao desktop completo. Para isso existe uma alternativa open-source que muitos consideram superior: **Sunshine** no host e **Moonlight** no cliente.

:::objetivos
- Comparar Steam Remote Play com o par Sunshine/Moonlight
- Entender o protocolo GameStream da NVIDIA e por que Sunshine o substitui
- Saber por que Moonlight é a engine de streaming preferida no Deck
- Identificar cenários onde cada solução brilha
- Conhecer os pré-requisitos de hardware e rede
:::

## Steam Remote Play versus Moonlight

O Steam Remote Play (antes chamado In-Home Streaming) usa o encoder proprietário da Valve, otimizado para jogos Steam. Ele é integrado ao cliente — basta estar logado nos dois dispositivos e clicar em "Jogar remotamente". As vantagens:

- **Zero configuração**: mesma conta Steam, mesma rede, botão verde.
- Integração com Steam Input: o Deck envia controles como se fossem do host.
- Wake-on-LAN built-in e gerenciamento de energia.

As limitações:

- Só funciona com jogos Steam (ou que aceitem ser lançados via Steam).
- Não transmite o desktop — você não pode usar o Deck como thin client.
- O encoder da Valve é competente mas não tão eficiente quanto o NVENC ou AMF.
- Latência variável; em redes Wi-Fi congestionadas, a qualidade cai.
- Depende do cliente Steam no host e no Deck.

O Moonlight (originalmente criado para o protocolo GameStream da NVIDIA) é um cliente de streaming universal. Sunshine é o servidor open-source que implementa o protocolo GameStream do lado do host, substituindo o componente da NVIDIA (que a própria NVIDIA descontinuou). Juntos:

- Transmitem qualquer jogo, inclusive não-Steam (GOG, Epic, emuladores).
- Transmitem o desktop inteiro — o Deck vira thin client completo.
- Suportam os encoders NVENC (NVIDIA), AMF/VCE (AMD) e VAAPI/QSV (Intel).
- Oferecem controle fino de bitrate, resolução, HDR e codec (H.264, HEVC, AV1).
- Funcionam em hosts Windows, Linux e macOS.
- Código aberto — sem dependência de fabricante.

## O protocolo GameStream

O protocolo GameStream foi criado pela NVIDIA para as placas GeForce com NVENC. Ele usa:

- **Captura**: o servidor captura o framebuffer da GPU (o que está sendo renderizado).
- **Codificação**: o encoder de hardware (NVENC, AMF, VAAPI) comprime em H.264 ou HEVC.
- **Transmissão**: os frames são enviados via UDP sobre a rede local, com baixíssimo overhead.
- **Decodificação**: o cliente (Deck) recebe e decodifica via hardware, renderizando na tela.
- **Entrada**: comandos do gamepad, teclado e mouse são enviados de volta ao host em tempo real.

Sunshine reimplementa o lado do servidor usando APIs modernas: DXGI Desktop Duplication no Windows, PipeWire/KMS no Linux. Ele expõe a mesma interface que o servidor GameStream da NVIDIA — então o Moonlight consegue se conectar a ele sem saber a diferença.

## Por que Sunshine/Moonlight no Steam Deck

O Steam Deck é o cliente ideal para streaming:

- **Tela 800p 16:10**: resolução baixa o suficiente para streaming local rodar a 90 ou 60 fps sem engasgos.
- **Wi-Fi 5/6E**: banda suficiente para bitrates altos (até 150 Mbps em HEVC).
- **Decodificação por hardware**: o APU Van Gogh/Aerith decodifica H.264 e HEVC em hardware, liberando a CPU.
- **Controles integrados**: o Moonlight mapeia os controles do Deck diretamente, com suporte a giroscópio e touchpads.
- **Modo Gaming**: o Moonlight pode ser adicionado como atalho Steam, rodando direto do modo Gaming.

Os casos de uso típicos:

1. **Jogos AAA no Deck com gráficos no máximo**: o PC potente renderiza; o Deck exibe.
2. **Jogos não-Steam**: títulos da Epic, GOG, Game Pass — sem gambiarras de Proton.
3. **Desktop remoto**: usar o Deck como thin client para trabalho leve.
4. **Emuladores pesados**: RPCS3, Yuzu, Xenia rodam no host com performance plena.
5. **Streaming fora de casa**: com VPN, jogar de qualquer lugar.

## Pré-requisitos

Do lado do **host** (PC com placa de vídeo dedicada):

- Windows 10/11 ou Linux com kernel 5.15+
- GPU NVIDIA (NVENC), AMD (AMF/VCE) ou Intel Arc (QSV)
- Sunshine instalado (versão estável atual, ≥ 0.21)
- Rede com fio (Ethernet) no host é fortemente recomendada

Do lado do **Deck**:

- SteamOS atualizado (3.5+)
- Moonlight instalado via Discover (Flatpak) ou AppImage
- Wi-Fi 5 GHz (preferencialmente) ou rede cabeada via dock/USB-C

Da **rede**:

- Roteador com suporte a 5 GHz e banda suficiente
- Latência < 5 ms entre host e cliente na rede local
- Para fora de casa: upload ≥ 20 Mbps no host, download ≥ 20 Mbps no Deck

## Resumo

- Steam Remote Play é prático e integrado, mas limitado a jogos Steam e sem acesso ao desktop.
- Sunshine + Moonlight são a alternativa open-source: universal, configurável e eficiente.
- O protocolo GameStream usa encoder de hardware no host e decoder de hardware no Deck.
- O Steam Deck é o cliente ideal pela tela 800p, controles integrados e decodificação por hardware.
- Com Sunshine/Moonlight, o Deck acessa qualquer jogo, de qualquer loja, em qualquer lugar.

## Exercícios

1. Liste três cenários onde o Steam Remote Play funciona bem e três onde você precisaria de Sunshine/Moonlight.
2. Abra o Steam no Deck, vá até as configurações de Remote Play e identifique as opções de qualidade (Fast, Balanced, Beautiful). Em qual delas o encoder do host faz mais diferença?
3. Execute `lspci | grep -i vga` no Deck para confirmar o hardware gráfico. Ele tem NVENC? Explique por que o Deck atua melhor como cliente de streaming do que como host.
4. Verifique a latência da sua rede local entre o Deck e seu PC principal com `ping -c 10 <ip-do-pc>`. Anote o tempo médio.
5. **Desafio.** Pesquise o codec AV1: ele é suportado para decodificação pelo Deck? E pelo Moonlight? Em que versão do Sunshine o suporte a AV1 foi adicionado?