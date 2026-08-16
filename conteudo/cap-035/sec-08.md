Gravar a própria tela e transmitir ao vivo parece tarefa de máquina potente com placa de vídeo dedicada. O Steam Deck, surpreendentemente, faz as duas coisas com o OBS Studio — a ferramenta de código aberto padrão da indústria de streaming. Como a APU do Deck tem um codificador de vídeo por hardware (VCN, baseado na arquitetura AMD), gravar a 1080p e transmitir para Twitch ou YouTube é perfeitamente viável, mesmo enquanto um jogo roda em segundo plano.

:::objetivos
- Instalar o OBS Studio e configurar cenas e fontes
- Gravar a tela com aceleração por hardware via encoder AMD
- Transmitir ao vivo para Twitch/YouTube com chave de stream
- Ajustar taxa de bits e resolução para a realidade da APU do Deck
:::

## Instalação e o conceito de cenas

O OBS Studio está no Flathub:

```terminal
$ flatpak install flathub org.obsproject.Studio
Looking for matches…
org.obsproject.Studio/x86_64/stable   30.2.3    flathub
Proceed with these changes to the system? [Y/n]: y
Installation complete.
```

A mentalidade central do OBS é a de **cenas** e **fontes**. Uma **cena** é uma tela inteira que você monta (por exemplo: "Gameplay", "Tela de pausa", "Tela final"). Cada cena contém **fontes** — elementos sobrepostos: a captura da tela, a câmera (webcam), texto, imagens, alertas, navegador. Você troca de cena durante a transmissão, e o OBS recompõe a imagem combinando as fontes.

O primeiro passo é montar uma cena útil. Na caixa "Cenas" (canto inferior esquerdo), clique em `+` e crie a cena "Principal". Na caixa "Fontes", clique em `+` e adicione uma "Captura de Tela (XSHM)". Essa fonte mostra tudo o que aparece na tela do Deck.

:::dica
Em vez de capturar a tela inteira, você pode capturar uma janela específica (fonte "Captura de Janela (Xcomposite)") ou um jogo em fullscreen (fonte "Captura de Jogo"). Capturar a janela específica evita que notificações e pop-ups apareçam na gravação.
:::

## Configurando o encoder AMD para gravação

O segredo do desempenho do Deck no OBS está em usar o codificador por hardware, não a CPU. Abra Configurações → Saída (Output) → Modo de Saída "Avançado" → aba "Gravação":

- **Encoder:** selecione "Hardware (AMD, H.264)" — é o encoder VCN da APU.
- **Taxa de bits (Bitrate):** 10.000 a 15.000 kbps para 1080p60.
- **Controle de taxa:** CQP com valor CQ entre 18 e 22 (quanto menor, mais qualidade e maior o arquivo).

Para validar que o encoder AMD está disponível:

```terminal
$ flatpak run org.obsproject.Studio --version
OBS Studio 30.2.3
$ flatpak run org.obsproject.Studio 2>&1 | grep -i 'encoder\|amd\|vcn' | head -5
```

Se a captura ou o encoder falharem, o OBS escreve o motivo no log. Você pode ler o log atual em Help → Logs → Mostrar log.

Com o encoder por hardware, o impacto no desempenho do jogo é mínimo — a APU dedica o bloco VCN à gravação enquanto a GPU continua renderizando o jogo. É a mesma técnica que os consoles usam para gravar gameplay sem queda de FPS.

## Transmissão ao vivo para Twitch e YouTube

Para transmitir, você precisa de uma **chave de stream** — um token que o OBS usa para autenticar no serviço. No Twitch: Dashboard → Configurações → Stream. No YouTube: YouTube Studio → Transmissão ao vivo → "Criar" → "Transmitir".

Cole a chave em Configurações → Transmissão (Stream) → Serviço "Twitch" ou "YouTube - RTMPS", e na caixa "Chave de transmissão" cole a chave. As configurações recomendadas para o Deck:

- **Serviço:** Twitch (ou YouTube - RTMPS)
- **Servidor:** automático, ou o mais próximo da sua região
- **Bitrate:** 4.500 a 6.000 kbps (Twitch recomenda até 6.000; YouTube aceita mais)
- **Encoder:** Hardware (AMD, H.264)
- **Resolução de saída:** 1280×720 ou 1920×1080
- **FPS:** 30 ou 60

:::atencao
Chave de stream é um segredo — qualquer pessoa com ela pode transmitir no seu canal. Nunca mostre a chave numa captura de tela, nunca cole em chat, nunca comite num repositório Git. Para o YouTube, use o modo "Transmitir agora" que gera uma chave temporária válida para aquela sessão.
:::

Você também pode transmitir apenas para o YouTube em modo "ao vivo" criando uma transmissão agendada; o OBS se conecta e o YouTube distribui o stream. Comece a transmissão com o botão "Iniciar transmissão" (ou [[Ctrl+Enter]]).

## Ajustes para a realidade da APU

Transmitir e jogar ao mesmo tempo pressiona a APU em duas frentes: GPU (renderizar o jogo) e encoder (codificar o stream). Algumas escolhas práticas:

- **720p60 em vez de 1080p60:** reduz a carga do encoder pela metade e é indistinguível na maioria das visualizações móveis.
- **30 FPS para jogos mais pesados:** jogos que rodam a 30 FPS no Deck não ganham nada com streaming a 60 FPS — o stream não pode ter mais quadros que o jogo gera.
- **Taxa de bits modesta:** 4.500 kbps é um bom equilíbrio entre qualidade e estabilidade no Twitch. Bitrates muito altos (8.000+) exigem banda de upload estável e aumentam o risco de buffer para quem assiste.

```terminal
$ speedtest-cli --simple 2>/dev/null || echo "Instale o speedtest-cli para medir o upload"
Ping: 12 ms
Download: 320.44 Mbit/s
Upload: 42.15 Mbit/s
```

A regra prática: seu upload precisa ser pelo menos **duas vezes** o bitrate escolhido, com folga. Com 42 Mbit/s de upload, transmitir a 6.000 kbps é tranquilo.

:::info
O OBS para Linux usa VA-API para o encoder AMD. No Deck, o backend é o VA-API sobre a APU Van Gogh. Se o encoder "Hardware (AMD, H.264)" não aparecer na lista, verifique se os drivers Mesa e `libva` estão instalados — no Flatpak, eles vêm embutidos no runtime do OBS, então normalmente funciona de primeira.
:::

## Resumo

- O OBS Studio é instalado com `flatpak install flathub org.obsproject.Studio` e organiza a gravação em cenas e fontes.
- Use o encoder "Hardware (AMD, H.264)" para gravar com impacto mínimo no jogo, aproveitando o bloco VCN da APU.
- Transmitir exige chave de stream do Twitch ou YouTube; trate a chave como segredo absoluto.
- Para o Deck, prefira 720p60 ou 1080p30 com bitrate entre 4.500 e 6.000 kbps.
- Meça o upload real: ele precisa ser pelo menos o dobro do bitrate escolhido.

## Exercícios

1. Instale o OBS e crie uma cena "Principal" com uma fonte "Captura de Tela (XSHM)". Grave 30 segundos de tela e localize o arquivo de saída.
2. Configure o encoder "Hardware (AMD, H.264)" em Configurações → Saída → Gravação. Grave novamente e compare o uso de CPU (com `htop`) entre o encoder por hardware e por software (`x264`).
3. Crie uma segunda cena com uma imagem de "pausa" (pode ser um PNG qualquer criado no Krita) e alterne entre as cenas durante uma gravação de teste.
4. Meça sua velocidade de upload (instale o `speedtest-cli` se necessário) e determine o bitrate máximo seguro para transmitir, aplicando a regra do dobro.
5. **Desafio.** Configure uma transmissão de teste no YouTube (chave gerada em "Transmitir agora"), transmita 5 minutos de gameplay a 720p60 e 4.500 kbps, e depois assista ao VOD resultante. O stream ficou fluido ou com congelamentos? Ajuste o bitrate com base no que observou.