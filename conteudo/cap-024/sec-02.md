O Steam Deck é uma máquina pequena com três caminhos de saída de som: os alto-falantes estéreo embutidos, o jack de 3,5 mm na parte de baixo e qualquer headset Bluetooth pareado. Quem decide qual deles está ativo em cada momento é o WirePlumber, mas você pode — e muitas vezes precisa — assumir esse controle manualmente. É exatamente o que esta seção ensina: inspecionar as saídas, entender seus nomes e escolher qual deve ser a padrão.

:::objetivos
- Listar todas as saídas de áudio com `pactl list sinks`
- Entender o nome longo e o número de índice de cada sink
- Trocar a saída padrão com `pactl set-default-sink`
- Relacionar sinks (saídas) com sources (entradas)
- Reverter uma escolha ruim de saída sem reiniciar
:::

## Sinks: o vocabulário básico de todo o capítulo

No mundo PulseAudio/PipeWire, **sink** é o nome técnico de uma saída de áudio — qualquer coisa para onde o som "escorre". Os alto-falantes do Deck são um sink, o fone no jack é outro, o headset Bluetooth é um terceiro. A palavra source é a contraparte para as entradas (microfones), mas ficamos com os sinks agora.

Cada sink tem duas identidades: um **índice** numérico (`0`, `1`, `2`...) e um **nome longo** descritivo, como `alsa_output.pci-0000_04_00.5-platform-acp5x_mach.0.HiFi__hw_acp5x_1__sink`. O índice é volátil e pode mudar a cada reinício; o nome longo é estável e identifica o hardware de verdade. Você quase sempre quer usar o nome longo, que sobrevive a reinicializações.

O comando para ver tudo de uma vez é o `pactl list sinks`:

```terminal
$ pactl list sinks
Sink #0
	State: RUNNING
	Name: alsa_output.pci-0000_04_00.5-platform-acp5x_mach.0.HiFi__hw_acp5x_1__sink
	Description: Family 17h/19h HD Audio Controller Speaker
	Driver: PipeWire
	Sample Specification: float32le 2ch 48000Hz
	Channel Map: front-left,front-right
	Mute: no
	Volume: front-left: 32768 /  50% / -18.06 dB,   front-right: 32768 /  50% / -18.06 dB
	        balance 0.00
	Base Volume: 65536 / 100% / 0.00 dB
	Monitor Source: alsa_output.pci-0000_04_00.5-platform-acp5x_mach.0.HiFi__hw_acp5x_1__sink.monitor
	Latency: 33.28 ms
	Flags: HARDWARE DECIBEL_VOLUME LATENCY
	Properties:
		device.string = "2"
		device.profile.name = "HiFi: play (hw:acp5x,1)"
		device.description = "Family 17h/19h HD Audio Controller Speaker"
```

A saída é densa, mas os campos que importam agora são poucos. `Description` é o nome amigável que aparece na interface do SteamOS; `Name` é o identificador estável; `Volume` mostra o nível atual por canal (aqui 50%, codificado em três unidades equivalentes); `State: RUNNING` indica que há algo tocando naquele instante. O `Monitor Source` no fim é uma entrada fantasma que permite gravar o que está saindo — útil para captura de tela com som.

:::nota
O volume nas saídas do PipeWire aparece três vezes no mesmo campo: `32768 / 50% / -18.06 dB`. São três maneiras de expressar a mesma coisa: um valor absoluto interno (32768, que é metade do máximo 65536), o percentual amigável (50%) e o deslocamento em decibéis (-18.06 dB). Não se assuste com a redundância; é o mesmo número em três réguas.
:::

## Descobrindo qual sink está ativo agora

Antes de trocar qualquer coisa, você precisa saber onde o som está indo. O `pactl list sinks` já mostra o `State`, mas ele diz apenas se há fluxo naquele sink, não qual é o *padrão*. O sink padrão é aquele para onde os aplicativos novos são roteados automaticamente quando sobem.

Você descobre o padrão de duas formas. A mais direta está na linha `Default Sink` do `pactl info`:

```terminal
$ pactl info | grep -i sink
Default Sink: alsa_output.pci-0000_04_00.5-platform-acp5x_mach.0.HiFi__hw_acp5x_1__sink
Default Source: alsa_input.pci-0000_04_00.5-platform-acp5x_mach.0.HiFi__hw_acp5x_1__source
```

Aqui o padrão é o sink dos alto-falantes, e o source padrão é o microfone embutido. A alternativa moderna, com saída mais enxuta, é o `wpctl status`:

```terminal
$ wpctl status
PipeWire 'pipewire-0' [1.0.7, deck@steamdeck, cookie:1234567890]
 └─ Clients:
        41. wireplumber                     [1.0.7, deck@steamdeck]
        53. pipewire                        [1.0.7, deck@steamdeck]
        62. xdg-desktop-portal              [1.0.7, deck@steamdeck]

Audio
 ├─ Devices:
 │      46. Family 17h/19h HD Audio Controller [alsa]
 │
 ├─ Sinks:
 │  *   58. Family 17h/19h HD Audio Controller Speaker [vol: 0.50]
 │
 └─ Sources:
 │      59. Family 17h/19h HD Audio Controller Microphone [vol: 1.00]
 │
Video
 └─ ...
```

Repare no asterisco `*` ao lado do sink `58`. É essa marcação do `wpctl` que aponta o sink padrão. A sintaxe é mais legível que o `pactl list sinks` completo, e o `[vol: 0.50]` já resume o volume. As duas ferramentas leem o mesmo estado.

## Trocando a saída padrão

Quando você pluga um fone no jack, o WirePlumber normalmente faz a troca sozinho por uma regra interna: o fone recém-conectado vira o padrão. Mas existem casos em que você quer forçar — por exemplo, manter o som nos alto-falantes mesmo com o jack ocupado, ou selecionar um headset Bluetooth que acabou de parear.

O comando é o `pactl set-default-sink`, recebendo o **nome longo** do sink de destino:

```terminal
$ pactl set-default-sink alsa_output.pci-0000_04_00.5-platform-acp5x_mach.0.HiFi__hw_acp5x_1__sink
$ pactl info | grep -i "default sink"
Default Sink: alsa_output.pci-0000_04_00.5-platform-acp5x_mach.0.HiFi__hw_acp5x_1__sink
```

A mudança de padrão vale para os **próximos** aplicativos. Um programa que já estava tocando no sink antigo permanece lá até que você o mova manualmente (assunto da seção sobre volume por aplicativo). Para trocar o padrão sem decorar o nome longo você pode usar o `@DEFAULT_SINK@`, um curinga que o `pactl` expande sozinho — útil em scripts:

```terminal
$ pactl set-default-sink @DEFAULT_SINK@
```

Isso, porém, apenas reafirma o padrão atual. O curinga brilha em conjunto com a troca de volume (vista adiante), não na seleção. Para selecionar por nome amigável, prefira o `wpctl set-default`, que aceita o **índice** numérico mostrado pelo `wpctl status`:

```terminal
$ wpctl set-default 58
$ wpctl status | grep -A1 "Sinks:"
 ├─ Sinks:
 │  *   58. Family 17h/19h HD Audio Controller Speaker [vol: 0.50]
```

:::atencao
O índice numérico (`58`, no exemplo) **não é estável**. Ele é atribuído na ordem em que os dispositivos aparecem na sessão e pode mudar depois de reiniciar ou de parear um novo fone. Use o índice para ajustes rápidos, mas grave o nome longo em qualquer script ou configuração permanente.
:::

## Resumo

- Sink é a saída de áudio; source é a entrada. Todo o capítulo gira em torno dessa distinção.
- `pactl list sinks` despeja o detalhe completo, com nome longo, descrição e volume por canal.
- O sink padrão é apontado por `pactl info` (linha `Default Sink`) e pelo asterisco no `wpctl status`.
- `pactl set-default-sink <nome>` troca o padrão para os próximos aplicativos, sem afetar os que já tocam.
- `wpctl set-default <índice>` faz o mesmo pelo número curto, menos digitação mas não persistente por si só.
- O curinga `@DEFAULT_SINK@` representa o sink padrão atual em scripts e comandos de volume.

## Exercícios

1. Rode `pactl list sinks` e copie, para cada saída listada, o campo `Description` e o campo `Name`. Qual deles você usaria num script?
2. Execute `wpctl status` e identifique, observando o asterisco `*`, qual é o sink padrão da sua sessão.
3. Plugue um fone no jack de 3,5 mm e rode `pactl list sinks` de novo. O que mudou no `State` e qual sink virou padrão?
4. Use `pactl set-default-sink` com o nome longo dos alto-falantes e confirme a troca com `pactl info | grep -i "default sink"`.
5. **Desafio.** Escreva um script de uma linha que grave o nome do sink padrão atual numa variável e o imprima, usando substituição de comando com `pactl info | grep ... | cut ...`. Depois troque o padrão para o jack e refaça o script para confirmar que o valor mudou.
