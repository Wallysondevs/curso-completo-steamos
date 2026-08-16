Um dos recursos mais surpreendentes do streaming no Steam Deck é a possibilidade de jogar cooperativamente com amigos que não têm o jogo instalado — ou sequer possuem o jogo. Esta seção explora os modos cooperativos do Parsec, Steam Remote Play Together e alternativas, com foco em configurar dois Decks (ou um Deck + um PC) para sessões de multiplayer local via rede.

:::objetivos
- Configurar sessões cooperativas via Parsec (modo Shared)
- Entender o Steam Remote Play Together e suas limitações
- Conectar múltiplos controles em um único Deck para coop local + remoto
- Diagnosticar e minimizar a latência em sessões multiplayer
:::

## O modelo Parsec: um jogo, dois lugares

O Parsec trata um convidado remoto como se fosse um controle extra plugado no host. Isso significa que o jogo roda **em apenas uma máquina** (o host) e o amigo vê exatamente a mesma tela que você — mas com o controle dele controlando o segundo jogador. O convidado não precisa de conta Steam, não precisa ter o jogo e não precisa de GPU potente: qualquer notebook, tablet ou até celular com o app Parsec serve.

Para ativar o modo cooperativo no Parsec:

1. No host, abra o Parsec e clique em **Arcade** (ou habilite `host_allow_guests = 1` no `config.txt`)
2. Gere um link de convite ou compartilhe o código da sala
3. O amigo abre o Parsec (qualquer plataforma), cola o link e se conecta
4. O Parsec pergunta: "Joystick ou teclado?" — escolha joystick
5. Pronto: o controle do amigo aparece como Player 2 no host

```terminal
# No config.txt do host Parsec, as configurações relevantes:
host_allow_guests = 1
host_max_guests = 4
host_gamepad = 1
host_input = 1
```

O `host_max_guests` define quantos jogadores simultâneos são permitidos. Para jogos com suporte a 4 jogadores locais (como Overcooked, Gang Beasts ou TowerFall), configure `host_max_guests = 4` e convide três amigos.

### A mágica do input forwarding

O que torna isso possível é que o Parsec captura dispositivos de entrada do cliente e os injeta no host como se fossem dispositivos físicos. No Linux (host), você pode ver isso acontecendo:

```terminal
$ ls /dev/input/by-id/ | grep parsec
usb-Parsec_Controller_1-event-joystick
usb-Parsec_Controller_2-event-joystick
```

No Windows (host), os gamepads aparecem como "Parsec Virtual Controller" no Gerenciador de Dispositivos.

## Steam Remote Play Together: a alternativa integrada

O Steam tem seu próprio modo cooperativo, o Remote Play Together. A diferença fundamental é que ele é integrado ao Steam:

- O host clica com botão direito no jogo → Remote Play Together
- O Steam gera um link que abre direto no cliente Steam do amigo
- O amigo precisa ter conta Steam (mas não precisa ter o jogo)
- A Valve fornece relay se a conexão P2P falhar

```terminal
# No Deck, o Remote Play Together não tem configuração de terminal —
# é tudo via interface Steam. Mas o processo aparece como:
$ ps aux | grep streaming_client
# ... o mesmo binário do Remote Play normal, mas com flag --together
```

A limitação: o Remote Play Together só funciona com jogos que **declaram suporte** ao recurso. Nem todo jogo local multiplayer da Steam suporta. Jogos de outras lojas, emuladores ou títulos antigos ficam de fora. Já o Parsec funciona com qualquer coisa que rode no host — literalmente qualquer executável.

## Dois Decks, uma tela: cenários práticos

### Cenário 1: Você tem o jogo, o amigo tem um Deck também

Você (host) roda o jogo no seu Deck e transmite via Parsec. O amigo (cliente) conecta com outro Deck, laptop ou tablet. Ambos jogam o mesmo jogo: você como P1 no controle físico do Deck, o amigo como P2 via streaming.

### Cenário 2: O jogo roda no PC, os dois Decks são clientes

O PC gamer potente faz o trabalho pesado. Dois Decks se conectam ao PC via Parsec. Ambos veem a mesma tela, cada um controlando um personagem. A latência é a mesma para os dois (P2P direta), e o jogo roda a 60 FPS no ultra — coisa que nenhum Deck conseguiria sozinho.

### Cenário 3: Modo híbrido (um Deck local + um remoto)

Você e um amigo estão no mesmo sofá, cada um com seu Deck. O jogo roda no Deck de vocês, mas um terceiro amigo conecta remotamente via Parsec. O host fica sendo um dos Decks na sala.

```terminal
# Verificar a carga do Deck como host Parsec + jogo rodando:
$ htop
# CPU: ~80% (jogo + encode Parsec)
# RAM: ~12 GB (jogo pesado)
# GPU: ~95% (renderização + encode VAAPI)
```

:::atencao
Rodar jogo **e** transmitir como host Parsec ao mesmo tempo no Deck exige bastante da APU. Jogos leves (indies, 2D) funcionam bem. Jogos AAA recentes podem sofrer com queda de FPS porque o encode compete por recursos da GPU com a renderização. Nesse caso, prefira um PC externo como host.
:::

## Sincronização de áudio no modo cooperativo

Quando dois jogadores compartilham o mesmo stream, o áudio também é compartilhado — ambos ouvem a mesma saída de som. Isso pode ser confuso se os jogadores estão em ambientes diferentes (áudio ambiente do amigo vaza no microfone). Soluções:

```terminal
# No Windows (host): Voicemeeter para criar mixagem separada
# No Linux (host): PulseAudio/PipeWire com null-sink
$ pactl load-module module-null-sink sink_name=game_audio
$ pactl load-module module-combine-sink slaves=alsa_output.pci-0000_04_00.1.analog-stereo,game_audio
```

No cliente Parsec, o microfone é capturado e enviado ao host como dispositivo de entrada. Se preferir comunicação por voz separada (Discord, Steam Chat), desabilite o microfone no Parsec e use o chat de voz externo:

```terminal
# No config.txt do cliente (Deck):
client_capture_mic = 0
```

## Jogos recomendados para coop via streaming

Nem todo jogo local multiplayer funciona bem via streaming. A latência extra (mesmo que pequena) pode arruinar a experiência em jogos de precisão. A tabela abaixo classifica gêneros por tolerância:

| Gênero | Tolerância à latência | Exemplos |
|---|---|---|
| Luta (precisão de frame) | Muito baixa (0–5 ms extra) | Street Fighter, Tekken |
| Plataforma de precisão | Baixa (0–10 ms) | Celeste, Super Meat Boy |
| Ação cooperativa | Média (10–30 ms) | It Takes Two, Cuphead |
| Party / casual | Alta (30–50 ms) | Overcooked, Among Us |
| Estratégia / turnos | Muito alta (50+ ms) | Civilization, Into the Breach |

A regra prática: se o jogo exige apertar botões com precisão de frames, a experiência cooperativa via streaming vai frustrar. Se o jogo é casual, party ou por turnos, a latência adicional é imperceptível.

**Em resumo:** o streaming cooperativo transforma jogos locais multiplayer em experiências compartilhadas pela internet. O Parsec lidera nesse cenário por suportar qualquer jogo e não exigir conta Steam dos convidados. O Steam Remote Play Together é uma alternativa integrada, mas com alcance limitado. Para a melhor experiência, mantenha o host cabeado, escolha jogos tolerantes a latência e configure os controles antes da sessão.

## Exercícios

1. Convide um amigo para uma sessão Parsec: você como host no Deck, ele como cliente. Joguem Overcooked ou similar por 15 minutos e anote as impressões de latência.
2. No host, durante a sessão cooperativa, monitore o uso da GPU: `radeontop` (AMD) ou `nvidia-smi` (NVIDIA). O encode está consumindo quantos % da GPU?
3. Teste o limite: adicione 2, 3 e 4 jogadores simultâneos no mesmo host. Em que ponto o desempenho do jogo começa a cair?
4. Compare a experiência do Remote Play Together (Steam) com a do Parsec no mesmo jogo. Qual foi mais fácil de configurar? Qual teve menor latência?
5. **Desafio.** Configure uma sessão cooperativa em que o host é um PC Windows headless (sem monitor) e os clientes são 2 Steam Decks. Documente os ajustes necessários de display virtual, áudio e controle.