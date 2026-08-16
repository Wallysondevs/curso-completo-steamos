Num console como o Steam Deck, é comum ter vários produtores de som ao mesmo tempo: o jogo com a trilha, o navegador tocando um vídeo, uma chamada de voz e talvez a notificação do sistema. O PipeWire mantém cada um desses fluxos como uma entidade separada com volume e mudo próprios, e dá a você controle fino sobre cada app — sem depender dos sliders da interface. Esta seção ensina a enxergar e manipular esses fluxos, os *streams*.

:::objetivos
- Listar os streams (fluxos) de reprodução ativos
- Ler o volume individual de cada aplicativo
- Ajustar volume e mudo de um stream específico
- Mover um stream de uma saída para outra
- Relacionar os streams com os sinks da seção anterior
:::

## Sinks versus streams: dois níveis, de novo

Na seção anterior você aprendeu que o PipeWire controla volume em duas camadas: o **sink** (a saída global) e o **stream** (a contribuição de cada programa). Agora é hora de operar a segunda camada. Enquanto o sink é o "tubo" por onde o som sai, cada stream é uma torneira ligada a esse tubo, com seu próprio registro.

A vantagem prática é imediata: você baixa o volume só do jogo sem tocar na chamada de voz, ou silencia o navegador mantendo a música. No Modo Jogo o SteamOS expõe isso de forma limitada, mas pela linha de comando o controle é total.

O comando para listar os streams de reprodução é o `pactl list sink-inputs` (o termo "sink-input" é o nome histórico do PulseAudio para um stream que alimenta um sink):

```terminal
$ pactl list sink-inputs
Sink Input #12
	Driver: PipeWire
	Client: 64
	Sink: 58
	Sample Specification: float32le 2ch 48000Hz
	Mute: no
	Volume: front-left: 65536 / 100% / 0.00 dB,   front-right: 65536 / 100% / 0.00 dB
	        balance 0.00
	Resample method: PipeWire
	Properties:
		application.name = "Firefox"
		media.name = "AudioStream"
		node.name = "Firefox"
		application.process.id = "1823"
```

Cada bloco é um aplicativo reproduzindo som. Os campos `application.name` (aqui `Firefox`), o índice no topo (`Sink Input #12`) e o `Volume` (100%) são os que você vai usar. Repare também no campo `application.process.id`, que liga o stream ao processo do sistema — útil para matar um app teimoso.

## Lendo o volume por aplicativo

Antes de ajustar, enxergue o panorama. Quem está executando esses comandos importa — tudo roda como usuário `deck` no host `steamdeck`, e o `pactl` reflete essa sessão:

```terminal
$ whoami
deck
$ hostname
steamdeck
$ pactl list sink-inputs | grep -E "Sink Input|application.name|Volume"
Sink Input #12
	application.name = "Firefox"
	Volume: front-left: 32768 /  50% / -18.06 dB,   front-right: 32768 /  50% / -18.06 dB
Sink Input #15
	application.name = "Steam"
	Volume: front-left: 65536 / 100% / 0.00 dB,   front-right: 65536 / 100% / 0.00 dB
```

Aqui você vê o Firefox em 50% e o Steam em 100%, cada um com seu próprio índice (`#12` e `#15`). O índice do stream é o que você passa ao `pactl` para fazer o ajuste.

## Ajustando volume e mudo de um stream

Com o índice em mãos, o comando é praticamente idêntico ao do sink, trocando `set-sink` por `set-sink-input`:

```terminal
$ pactl set-sink-input-volume 12 40%
$ pactl list sink-inputs | grep -A1 "Sink Input #12" | grep Volume
	Volume: front-left: 26214 /  40% / -23.86 dB,   front-right: 26214 /  40% / -23.86 dB
```

O stream 12 (Firefox) caiu para 40%. O mudo segue o mesmo padrão, com `set-sink-input-mute`:

```terminal
$ pactl set-sink-input-mute 15 1
$ pactl set-sink-input-mute 15 0
```

Silenciar um stream específico é o remédio certo para o caso clássico do "notificação tocando por cima do jogo": em vez de baixar tudo, você cala só aquele app.

:::atencao
O índice do stream (`#12`, `#15`) muda a cada vez que um aplicativo reinicia ou um novo sobe. Ele não tem relação com o índice do sink. Ao automatizar, identifique o stream pelo `application.name` (com `grep`) e extraia o índice na hora, em vez de decorar o número.
:::

## Movendo um stream para outra saída

Uma das operações mais poderosas do PipeWire é rotear um único aplicativo para uma saída diferente da global. Isso resolve o cenário "música no fone enquanto o jogo sai nos alto-falantes", ou o contrário. O comando move um stream pelo índice:

```terminal
$ pactl move-sink-input 12 alsa_output.pci-0000_04_00.5-platform-acp5x_mach.0.HiFi__hw_acp5x_1__sink
```

Após o comando, o stream 12 passa a alimentar o sink indicado, ignorando o padrão global. Para movê-lo de volta ao padrão, o curinga `@DEFAULT_SINK@` pode ser usado como destino:

```terminal
$ pactl move-sink-input 12 @DEFAULT_SINK@
```

Isso devolve o Firefox à saída padrão, o que é útil depois de testes. A operação é instantânea e não interrompe a reprodução.

:::exemplo
Você pluga um headset Bluetooth para uma chamada, mas o jogo continua saindo nos alto-falantes. Com o `pactl list sink-inputs` você acha que o jogo é o stream `#15` (Steam) e a chamada é o `#18` (Discord). Move a chamada para o fone com `pactl move-sink-input 18 <sink-bluetooth>` e deixa o jogo onde está — som de jogo na sala e voz só para você.
:::

## A relação entre stream e sink no `wpctl`

Se você prefere a sintaxe do `wpctl` ao `pactl`, o volume de stream também aparece por lá — embora com menos nomes amigáveis. O `wpctl status` lista os streams na seção `Audio`, identificados como nós do tipo `Stream/Output/Audio`. Cada stream tem seu próprio ID, e você pode ajustar o volume com `wpctl set-volume <id>` e movê-lo com `wpctl set-target <id> <sink-id>`. A lógica é a mesma, os números é que mudam.

## Resumo

- Stream é o fluxo de áudio de cada aplicativo; sink é a saída. Cada stream tem volume e mudo próprios.
- `pactl list sink-inputs` lista os streams com índice, `application.name` e volume por canal.
- `pactl set-sink-input-volume <índice> <valor>` ajusta o volume de um app isolado.
- `pactl set-sink-input-mute <índice> <1|0>` silencia só aquele stream.
- `pactl move-sink-input <índice> <sink>` roteia um app para uma saída diferente da global.

## Exercícios

1. Com um jogo ou navegador tocando áudio, rode `pactl list sink-inputs | grep -E "Sink Input|application.name|Volume"` e anote o índice de cada app.
2. Baixe o volume de um dos streams para 30% com `pactl set-sink-input-volume` e confira com o `grep`.
3. Silencie e dessilencie um stream com `pactl set-sink-input-mute`, observando que os outros apps não são afetados.
4. Plugue um fone e mova um stream para ele com `pactl move-sink-input`; depois retorne com `@DEFAULT_SINK@`.
5. **Desafio.** Escreva um loop de shell que rode `pactl list sink-inputs` a cada dois segundos, extraia o `application.name`, e aumente em 5% o volume do stream cujo nome for "Steam" — usando `grep`, `awk` e `pactl set-sink-input-volume` dentro do loop. Interrompa com `[[Ctrl+C]]`.
