Controlar volume não é só arrastar um slider na interface do Modo Jogo. O PipeWire expõe esse controle por linha de comando com uma precisão que a interface não tem — inclusive a possibilidade de definir um volume exato em percentual, silenciar um canal específico ou mudar o nível de uma saída sem tocá-la na tela. O `wpctl` é a ferramenta nativa e mais direta para isso, e é o foco desta seção.

:::objetivos
- Ler o volume atual de cada saída com `wpctl status`
- Definir volume absoluto e relativo com `wpctl set-volume`
- Silenciar e dessilenciar com `wpctl set-mute`
- Ajustar volume pelo curinga `@DEFAULT_SINK@` via `pactl`
- Entender a diferença entre volume de sink e volume de stream
:::

## Lendo o volume sem abrir a interface

O primeiro passo é sempre saber onde você está. O `wpctl status` já resume os volumes numa coluna, mas para um valor limpo e único você pede o volume de um sink específico:

```terminal
$ wpctl get-volume @DEFAULT_AUDIO_SINK@
Volume: 0.50
```

O valor `0.50` significa 50%, expresso em escala de 0.0 a 1.0 (e podendo passar de 1.0 se houver sobreamplificação, o chamado *over-amplification*). O curinga `@DEFAULT_AUDIO_SINK@` é aceito pelo `wpctl` para apontar a saída padrão sem decorar nomes nem índices.

Se quiser mais contexto, o `wpctl status` completo é a visão de painel — e revela o usuário `deck` na sessão atual:

```terminal
$ wpctl status
PipeWire 'pipewire-0' [1.0.7, deck@steamdeck, cookie:1234567890]
 └─ Clients:
        41. wireplumber                     [1.0.7, deck@steamdeck]
        53. pipewire                        [1.0.7, deck@steamdeck]

Audio
 ├─ Devices:
 │      46. Family 17h/19h HD Audio Controller [alsa]
 ├─ Sinks:
 │  *   58. Family 17h/19h HD Audio Controller Speaker [vol: 0.50]
 │      63. Family 17h/19h HD Audio Controller Headphones [vol: 0.00]
 └─ Sources:
  *   59. Family 17h/19h HD Audio Controller Microphone [vol: 1.00]
```

Aqui há dois sinks reais: os alto-falantes em 50% e o fone (jack) em 0%. O asterisco continua marcando o padrão, e o `deck@steamdeck` confirma o usuário e o host da sessão.

## Definindo volume absoluto e relativo

O `wpctl set-volume` aceita três formas de dizer "quanto". A mais simples é o valor absoluto:

```terminal
$ wpctl set-volume @DEFAULT_AUDIO_SINK@ 0.65
$ wpctl get-volume @DEFAULT_AUDIO_SINK@
Volume: 0.65
```

As duas formas relativas são mais úteis no dia a dia, porque você quer "aumentar um pouco" sem calcular: use o sinal de `+` ou `-` seguido de um valor, ou a notação de percentual com o mesmo sinal.

```terminal
$ wpctl set-volume @DEFAULT_AUDIO_SINK@ 5%+
$ wpctl get-volume @DEFAULT_AUDIO_SINK@
Volume: 0.70
$ wpctl set-volume @DEFAULT_AUDIO_SINK@ 10%-
$ wpctl get-volume @DEFAULT_AUDIO_SINK@
Volume: 0.60
```

O `5%+` soma cinco pontos percentuais ao volume atual; o `10%-` subtrai dez. A sintaxe corresponde ao comportamento dos botões de volume do Steam Deck, que avançam em degraus discretos. Para o mesmo efeito pela via PulseAudio, o comando clássico é o `pactl set-sink-volume`:

```terminal
$ pactl set-sink-volume @DEFAULT_SINK@ +5%
$ pactl set-sink-volume @DEFAULT_SINK@ 60%
```

Repare que o `pactl` aceita o percentual diretamente (`60%`) enquanto o `wpctl` espera a fração (`0.60`) ou o formato `60%`. São duas ferramentas, duas convenções — vale não misturar.

:::dica
O curinga `@DEFAULT_SINK@` (com `pactl`) e `@DEFAULT_AUDIO_SINK@` (com `wpctl`) poupam o trabalho de descobrir o índice do sink. Nos comandos de volume, prefira sempre o curinga: ele elimina a classe de erro mais comum, que é aplicar volume no sink errado por ter um índice desatualizado.
:::

## Silenciando e dessilenciando

Mudo é um estado separado do volume: você pode silenciar um sink em 80% e depois dessilenciar, e ele volta para 80%. O `wpctl set-mute` alterna esse estado, com `1` para ligar o mudo e `0` para desligar, ou a palavra `toggle` para inverter:

```terminal
$ wpctl set-mute @DEFAULT_AUDIO_SINK@ 1
$ wpctl get-volume @DEFAULT_AUDIO_SINK@
Volume: 0.60
Muted: yes
$ wpctl set-mute @DEFAULT_AUDIO_SINK@ toggle
$ wpctl get-volume @DEFAULT_AUDIO_SINK@
Volume: 0.60
Muted: no
```

Note que o volume permaneceu `0.60` durante todo o processo — o mudo apenas sobrepôs um "desligado" por cima, sem alterar o nível. A via PulseAudio equivalente é o `pactl set-sink-mute`:

```terminal
$ pactl set-sink-mute @DEFAULT_SINK@ 1
$ pactl set-sink-mute @DEFAULT_SINK@ toggle
```

A distinção entre volume e mudo importa na prática: um problema clássico de "sem som" no Deck é o sink estar mudo com o volume aparentemente alto, porque o indicador da interface mostra o volume e não o estado de mudo em alguns casos.

:::atencao
Não confunda silenciar o sink com silenciar um stream (aplicativo). O `set-mute` no sink cala **tudo** que passa por aquela saída; o mudo de um stream só cala aquele programa. Quando só um jogo está sem som e o resto funciona, o problema é o volume do stream, não o do sink — assunto da próxima seção.
:::

## Onde o volume "de verdade" mora

Vale fechar com a distinção conceitual que evita a maioria dos erros. O PipeWire controla o volume em dois níveis independentes que se multiplicam:

- O **volume do sink** é a saída como um todo, o "grosso" do controle — é o que os botões do Deck mexem.
- O **volume do stream** é a contribuição de cada aplicativo dentro do mix.

Quando você ajusta o sink, move o teto global; quando ajusta um stream, move a participação de um programa naquele teto. Os comandos desta seção mexem no primeiro nível. O segundo, o volume por aplicativo, é exatamente o que a próxima seção destrincha — e é onde mora a maioria dos ajustes finos do dia a dia.

## Resumo

- `wpctl get-volume @DEFAULT_AUDIO_SINK@` devolve o volume em fração (0.0 a 1.0) e o estado de mudo.
- `wpctl set-volume` aceita valor absoluto, soma/subtração (`5%+`, `10%-`) e percentual direto.
- `pactl set-sink-volume @DEFAULT_SINK@ +5%` é a forma equivalente na via PulseAudio, com percentuais.
- `wpctl set-mute` e `pactl set-sink-mute` alternam mudo com `1`, `0` ou `toggle`, sem alterar o volume.
- Volume de sink (global) e volume de stream (por app) são níveis diferentes que se multiplicam.

## Exercícios

1. Rode `wpctl get-volume @DEFAULT_AUDIO_SINK@` e anote o valor. Ele bate com o slider da interface do SteamOS?
2. Aumente o volume em 10 pontos com `wpctl set-volume @DEFAULT_AUDIO_SINK@ 10%+` e confira com `get-volume`.
3. Silencie o sink com `wpctl set-mute @DEFAULT_AUDIO_SINK@ 1` e dessilencie com `toggle`, observando que o volume não muda.
4. Repita o passo 2 usando a via PulseAudio: `pactl set-sink-volume @DEFAULT_SINK@ +10%` e compare.
5. **Desafio.** Deixe o sink mudo, rode um arquivo de áudio e depois use `wpctl set-mute` para restaurar. Em seguida, identifique com `wpctl status` se existe um sink "Headphones" em 0% e explique por que plugar o fone pode "roubar" o som mesmo com os alto-falantes em volume alto.
