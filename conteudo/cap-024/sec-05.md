Falar é tão crítico quanto ouvir. O Steam Deck tem microfones embutidos, um jack de 3,5 mm que aceita headsets com microfone e suporte a microfones Bluetooth. A parte de entrada do PipeWire é simétrica às saídas: o sink vira **source**, e o volume de saída vira **ganho de captura**. Tudo o que você aprendeu sobre sinks tem equivalente aqui, começando pela inspeção.

:::objetivos
- Listar as fontes de captura com `pactl list sources`
- Entender a diferença entre source real e monitor source
- Ajustar o ganho do microfone via `pactl set-source-volume`
- Alternar entre microfone embutido e headset com `pactl set-default-source`
- Gravar um teste rápido de captura com `pw-record`
:::

## Sources: os sinks do mundo invertido

Se você entendeu sinks, entende sources em dois minutos. **Source** é o termo do PipeWire para qualquer entrada de áudio. O Deck normalmente expõe pelo menos estas fontes:

- O microfone interno, parte do mesmo chip AMD ACP5x que cuida dos alto-falantes.
- O jack de 3,5 mm, que além de fone aceita headsets com microfone TRRS (quatro polos).
- O microfone de qualquer headset Bluetooth pareado.
- Uma ou mais **fontes monitor**, que não são microfones de verdade e sim a gravação do que está saindo pelas saídas.

O comando espelho do `pactl list sinks` é o `pactl list sources`. Tudo roda como usuário `deck` no host `steamdeck`:

```terminal
$ pactl list sources
Source #59
	State: RUNNING
	Name: alsa_input.pci-0000_04_00.5-platform-acp5x_mach.0.HiFi__hw_acp5x_1__source
	Description: Family 17h/19h HD Audio Controller Microphone
	Driver: PipeWire
	Sample Specification: float32le 2ch 48000Hz
	Mute: no
	Volume: front-left: 32768 /  50% / -18.06 dB,   front-right: 32768 /  50% / -18.06 dB

Source #60
	State: IDLE
	Name: alsa_output.pci-0000_04_00.5-platform-acp5x_mach.0.HiFi__hw_acp5x_1__sink.monitor
	Description: Monitor of Family 17h/19h HD Audio Controller Speaker
	Monitor of Sink: alsa_output.pci-0000_04_00.5-platform-acp5x_mach.0.HiFi__hw_acp5x_1__sink
```

A source `#59` é o microfone real do Deck, com `State: RUNNING` indicando que alguém está capturando. A source `#60` começa com `Monitor of ...` — essa é a fonte monitor do sink dos alto-falantes, que grava o que está saindo. É como ela que o OBS captura o som do jogo quando você faz streaming.

:::dica
A convenção de nomenclatura do ALSA distingue: `alsa_input.*` são entradas reais, `alsa_output.*.monitor` são as monitoras. Basta olhar o prefixo do campo `Name` para saber se é microfone ou gravação da saída.
:::

## Ajustando o ganho de captura

O ganho do microfone é o equivalente ao volume do sink. Se ninguém te ouve na chamada, o primeiro suspeito não é o fone quebrado — é o ganho zerado. O ajuste segue a mesma sintaxe de volume, trocando `sink` por `source`:

```terminal
$ pactl set-source-volume alsa_input.pci-0000_04_00.5-platform-acp5x_mach.0.HiFi__hw_acp5x_1__source 75%
$ pactl list sources | grep -A2 "Source #59" | grep Volume
	Volume: front-left: 49152 /  75% / -7.44 dB,   front-right: 49152 /  75% / -7.44 dB
```

O mudo da captura também existe e é independente:

```terminal
$ pactl set-source-mute @DEFAULT_SOURCE@ 1
$ pactl set-source-mute @DEFAULT_SOURCE@ toggle
```

O curinga `@DEFAULT_SOURCE@` aponta a entrada padrão, assim como `@DEFAULT_SINK@` aponta a saída. A maioria das chamadas de voz pega a entrada padrão, então silenciar a source padrão é silenciar o microfone para todos os apps.

## Alternando entre microfones

Quando você pluga um headset no jack, o WirePlumber tipicamente troca a source padrão para o microfone do headset. Mas essa troca pode falhar, e aí sua voz some da chamada enquanto o microfone interno do Deck ainda está capturando o vento. O comando de troca é espelho do sink:

```terminal
$ pactl set-default-source alsa_input.pci-0000_04_00.5-platform-acp5x_mach.0.HiFi__hw_acp5x_1__source
$ pactl info | grep "Default Source"
Default Source: alsa_input.pci-0000_04_00.5-platform-acp5x_mach.0.HiFi__hw_acp5x_1__source
```

O `wpctl status` também mostra as sources com o asterisco de padrão, usando a mesma sintaxe de `wpctl set-default`:

```terminal
$ wpctl status | grep -A3 "Sources:"
 ├─ Sources:
 │  *   59. Family 17h/19h HD Audio Controller Microphone [vol: 0.75]
 │      60. Monitor of Family 17h/19h HD Audio Controller Speaker
```

## Gravando um teste com `pw-record`

O PipeWire vem com uma ferramenta de captura nativa chamada `pw-record`, mais leve que as alternativas. Ela grava da source padrão e joga a saída num arquivo WAV. Para um teste rápido, três segundos bastam:

```terminal
$ pw-record -P stream.capture.props='{ target.object=59 }' /tmp/teste.wav
... grave alguns segundos e pressione Ctrl+C ...
$ file /tmp/teste.wav
/tmp/teste.wav: RIFF (little-endian) data, WAVE audio, stereo 48000 Hz, float32
```

A opção `-P` passa propriedades ao PipeWire, e `target.object=59` especifica qual source capturar (o número vem do `wpctl status`). Depois, reproduza com `pw-play /tmp/teste.wav` e ouça o resultado no sink padrão.

:::atencao
O microfone interno do Deck fica na parte frontal, entre as grades dos alto-falantes. Ele capta bem a voz a até 50 cm, mas também capta o ruído dos botões e das ventoinhas. Nas chamadas, prefira um headset com microfone dedicado, que isola a voz do ruído ambiente.
:::

## Sources em ação: monitorando a captura

Além de listar e ajustar, você pode monitorar o nível da captura em tempo real com o `pactl subscribe`. Ele emite eventos sempre que algo muda — inclusive quando uma source aparece, some ou tem o volume alterado:

```terminal
$ pactl subscribe
Event 'new' on source #61
Event 'change' on source #59
```

No exemplo, a source `#61` (headset recém-plugado) foi criada, e a `#59` (microfone interno) teve o volume alterado. O `pactl subscribe` é a ferramenta de "olhar por baixo" quando você quer saber se o sistema reagiu à sua ação — ele não mente e não filtra. Para interromper, `[[Ctrl+C]]`.

```terminal
$ pactl subscribe | grep source
Event 'change' on source #59
Event 'remove' on source #61
```

A linha `remove` mostra o headset sendo desconectado. É a confirmação instantânea de que o WirePlumber reagiu à remoção física e removeu a source do grafo do PipeWire.

## Resumo

- Sources são as entradas de áudio; o Duplo do PipeWire com sinks é simétrico em comandos.
- `pactl list sources` mostra microfones reais e fontes monitor; o prefixo `alsa_input` vs `alsa_output` distingue.
- `pactl set-source-volume` e `pactl set-source-mute` ajustam ganho e mudo da captura.
- `pactl set-default-source` troca a entrada padrão, e o `wpctl status` mostra qual é com asterisco.
- `pw-record -P ... /tmp/teste.wav` captura da source escolhida para um arquivo WAV reproduzível com `pw-play`.

## Exercícios

1. Liste suas sources com `pactl list sources` e separe as que têm prefixo `alsa_input` (reais) das que têm `alsa_output` (monitor).
2. Ajuste o ganho do microfone para 85% e confira com `pactl list sources | grep Volume`.
3. Use `pw-record` para gravar cinco segundos da sua voz e reproduza com `pw-play`. O volume da gravação está adequado?
4. Silencie a source padrão com `pactl set-source-mute @DEFAULT_SOURCE@ 1`, execute `pw-record` e veja o arquivo resultante — ele tem silêncio?
5. **Desafio.** Conecte um headset TRRS no jack, execute `pactl list sources` e identifique a nova source. Depois escreva um pequeno script que compare as sources antes e depois da conexão (usando `diff` ou `comm`) e imprima qual source foi adicionada.