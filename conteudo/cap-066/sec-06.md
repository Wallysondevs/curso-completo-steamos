Você configurou os dois serviços. Agora a pergunta inevitável: qual usar em cada situação? A resposta não é "depende" — é uma matriz de decisão que cruza seu catálogo de jogos existente, sua tolerância a latência, o tipo de jogo e o quanto você está disposto a pagar. Esta seção compara GeForce NOW e Xbox Cloud Gaming em seis dimensões objetivas, com dados que você pode verificar no seu próprio Deck.

:::objetivos
- Comparar latência, qualidade de imagem e bitrate entre os dois serviços
- Entender o impacto do modelo de negócios (compra vs assinatura) na escolha
- Avaliar a estabilidade de cada serviço no SteamOS
- Conhecer as limitações específicas de cada plataforma no Deck
- Escolher o serviço certo para cada cenário de uso
:::

## Latência medida no Deck

A latência total é a soma da latência de rede (ida e volta ao datacenter), da latência de codificação (servidor comprime o frame), da latência de decodificação (Deck descomprime) e da latência de entrada (gamepad → servidor). Medir cada componente exige ferramentas de rede que você verá na [próxima seção](#/cap-066/sec-07), mas a percepção subjetiva já revela diferenças.

```terminal
$ ping -c 10 static-01.nvidia.com
PING static-01.nvidia.com (34.120.78.120) 56(84) bytes of data.
64 bytes from 34.120.78.120: icmp_seq=1 ttl=54 time=18.2 ms
64 bytes from 34.120.78.120: icmp_seq=2 ttl=54 time=17.8 ms
[...]
--- static-01.nvidia.com ping statistics ---
10 packets transmitted, 10 received, 0% packet loss, time 9015ms
rtt min/avg/max/mdev = 17.3/18.1/19.4/0.612 ms
```

A NVIDIA opera datacenters em mais de 30 regiões. O servidor mais próximo do sudeste brasileiro (São Paulo, AWS sa-east-1) responde em ~18 ms. A Microsoft Azure, onde roda o xCloud, tem presença semelhante em São Paulo. A latência de rede costuma ser similar entre os dois — na casa de 15 a 35 ms em condições ideais.

O diferencial está na latência de codificação: a NVIDIA usa GPUs dedicadas (RTX 4080 no tier Ultimate) com NVENC de 8ª geração, que codifica um frame 1080p em menos de 2 ms. O Xbox Series X do xCloud usa um encoder de hardware Microsoft proprietário, mais lento (~4 ms). No total, o GeForce NOW Ultimate entrega o frame ao Deck cerca de 2 a 5 ms mais rápido que o xCloud — perceptível em shooters competitivos, irrelevante em RPGs e estratégia.

## Catálogo: comprar vs assinar

Esta é a diferença mais importante e a razão pela qual muitos usuários mantêm os dois serviços.

**GeForce NOW**: você joga o que já comprou. Se sua biblioteca Steam tem 300 jogos e 80 deles estão no catálogo GeForce NOW, você já tem 80 motivos para usar o serviço. Jogos como *Cyberpunk 2077*, *Baldur's Gate 3* e *Elden Ring* funcionam com save na nuvem — você começa no PC, continua no Deck via cloud e termina no PC.

**Xbox Cloud Gaming**: você joga o que está no Game Pass. O catálogo muda todo mês, e lançamentos do Xbox Game Studios entram no dia do lançamento. Se você não tem biblioteca Steam grande, o Game Pass oferece centenas de jogos por uma mensalidade fixa. Mas você não "possui" nada — se o jogo sair do catálogo, seu save fica inacessível até reativar a assinatura ou comprar o jogo.

| Dimensão | GeForce NOW | Xbox Cloud Gaming |
|---|---|---|
| Modo de acesso | Jogos comprados em lojas PC | Catálogo por assinatura |
| Sincronização de save | Steam Cloud / loja nativa | Xbox Cloud Save |
| Jogos que saem do catálogo | Continua acessível (você comprou) | Inacessível até comprar |
| Mods | Limitado (nem toda loja suporta) | Não suportado |
| Jogos gratuitos (F2P) | Sim (Fortnite, Warframe, etc.) | Alguns (Fortnite via navegador) |

:::dica
Se você joga no PC e no Deck, o GeForce NOW com sincronização Steam Cloud é imbatível: você alterna entre os dispositivos sem transferir save manualmente. O xCloud salva no ecossistema Xbox — seu save não conversa com a versão Steam do mesmo jogo.
:::

## Qualidade de imagem na tela do Deck

Ambos entregam 1080p no máximo, mas a tela do Deck é 800p. O navegador faz downscale — e a qualidade desse downscale varia.

O stream do GeForce NOW a 1080p reduzido para 800p pelo Chrome resulta em uma imagem levemente mais nítida que o necessário, com um efeito colateral positivo: bordas de objetos ficam anti-aliasadas naturalmente. O custo é banda: você baixa pixels que não vai ver.

O xCloud a 1080p reduzido pelo Edge sofre com artefatos de compressão em cenas escuras — o encoder do Xbox é otimizado para TV a 3 metros de distância, não para uma tela de 7 polegadas a 30 cm do rosto. Em jogos com cenas noturnas, o macroblocking é visível.

```terminal
$ cat /sys/class/drm/card0-eDP-1/modes
1280x800
```

A única resolução nativa do painel do Deck é 1280×800. Qualquer stream em resolução diferente passa por escala, o que consome um pouco de GPU. Com o FSR do gamescope ativo, o impacto visual da escala é menor, mas o ideal seria receber o stream já em 800p — algo que nenhum dos dois serviços oferece nativamente.

## Estabilidade no SteamOS

O GeForce NOW no Chrome é mais estável que o xCloud no Edge. O motivo é simples: o Chrome é o navegador mais testado do mundo para streaming de vídeo, e o GeForce NOW é essencialmente um stream WebRTC — a mesma tecnologia do YouTube e Google Meet. O xCloud usa uma pilha proprietária da Microsoft que o Edge implementa, mas o Edge no Linux é um cidadão de segunda classe comparado ao Edge no Windows.

Problemas conhecidos no Edge Flatpak para SteamOS 3.6:

- O modo kiosk às vezes falha ao recuperar o token de login após suspensão do Deck.
- O áudio pode dessincronizar após 40+ minutos de sessão (bug no pipewire + Edge).
- A vibração do controle não funciona no Edge Linux (a API Gamepad Trigger Rumble é Windows-only no Edge).

```terminal
$ journalctl -xe --no-pager | grep -i edge | tail -5
Aug 12 14:23:05 steamdeck pipewire[1284]: spa.alsa: front:2: snd_pcm_avail failed: Broken pipe
Aug 12 14:23:05 steamdeck pipewire[1284]: pw.node: (edge-alsa-32) suspended -> error (Start error: Broken pipe)
```

O erro de *broken pipe* no pipewire é o sintoma típico da dessincronia de áudio do Edge. Reiniciar o Edge resolve, mas interrompe a sessão de jogo.

## Quando usar cada um

A matriz de decisão prática:

- **Você tem biblioteca Steam grande e joga no PC também** → GeForce NOW como plataforma principal, xCloud como complemento para lançamentos Game Pass.
- **Você só joga no Deck e não tem biblioteca Steam** → Xbox Cloud Gaming como plataforma principal. O Game Pass Ultimate dá acesso imediato a centenas de jogos.
- **Você joga shooters competitivos** → GeForce NOW Ultimate (RTX 4080, menor latência de codificação, 120 FPS em alguns jogos).
- **Você quer jogar lançamentos do Xbox no dia um** → só o xCloud oferece isso (Starfield, Hellblade 2, Avowed).
- **Você tem limite de dados** → GeForce NOW consome mais banda (~15-25 Mbps a 1080p vs ~10-15 Mbps no xCloud por conta do codec mais eficiente da Microsoft).

## Resumo

- GeForce NOW vence em latência de codificação (NVENC ~2 ms vs encoder Xbox ~4 ms) e estabilidade no SteamOS.
- Xbox Cloud Gaming vence em custo-benefício (catálogo por assinatura) e acesso a lançamentos Xbox no dia um.
- O GeForce NOW é ideal para quem já tem biblioteca Steam; o xCloud é ideal para quem começa do zero.
- Ambos fazem streaming a 1080p com downscale para 800p; o GeForce NOW entrega imagem mais nítida na tela do Deck.
- O Edge Flatpak no Linux tem bugs de áudio e vibração que o Chrome não tem.

## Exercícios

1. Abra o mesmo jogo disponível nos dois serviços (ex.: *Fortnite*) e compare a qualidade visual e a latência. Anote qual parece mais responsivo.
2. Meça o consumo de dados de cada serviço: jogue 15 minutos em cada um e compare o tráfego com `nethogs` ou `iftop` no Modo Desktop.
3. Compare o tempo de carregamento do jogo: cronometre do clique em "Jogar" até o menu principal no GeForce NOW e no xCloud. Qual é mais rápido? Por quê?
4. No GeForce NOW, abra um jogo que você tem na Steam e verifique se o save sincronizou corretamente. Depois, jogue no PC e veja se o progresso aparece no Deck.
5. **Desafio.** Mantenha os dois serviços abertos em abas lado a lado no Modo Desktop (precisa de dois navegadores ou duas janelas). Inicie o mesmo jogo nos dois e execute a mesma ação (ex.: girar a câmera 360°). Qual chega primeiro na tela? Use a câmera do celular em slow-motion (240 fps) para medir a diferença.