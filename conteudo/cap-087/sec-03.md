Saber o percentual de carga diz pouco sobre por que a bateria acaba rápido. Para isso você precisa medir o **consumo** — quantos watts o aparelho está drenando agora, e o quê exatamente está drenando. Esta seção transforma as leituras estáticas em medição de energia em tempo real.

:::objetivos
- Ler a potência instantânea de consumo e de carga
- Amostrar `power_now` ao longo do tempo com `watch`
- Usar `powertop` para identificar quem consome watts
- Diferenciar consumo de CPU, GPU e tela no Steam Deck
- Registrar consumo por atividade para comparar cenários

:::

## A potência em tempo real

O mesmo circuito que conta ciclos também mede, a cada instante, quanta energia está entrando ou saindo. No `/sys`, isso aparece como `power_now` (e o `upower` traduz para `energy-rate`):

```terminal
$ cat /sys/class/power_supply/BAT1/power_now
10820000
```

Como `power_now` vem em **micro-watts**, `10820000` são 10,82 W. Quando o aparelho está descarregando, esse número é positivo (sai energia); plugado e carregando, o firmware costuma reportar o fluxo com sinal que depende do driver — por isso as leituras de `energy-rate` no carregamento merecem atenção extra ao sinal.

Uma leitura isolada vale pouco, porque o consumo oscila a cada frame. A ferramenta certa é o `watch`, que re-amostra o comando a cada intervalo:

```terminal
$ watch -n 2 cat /sys/class/power_supply/BAT1/power_now
Every 2,0s: cat /sys/class/power_supply/BAT1/power_now

10820000
```

Saia com `[[Ctrl+C]]`. Com isso rodando num terminal ao lado, você observa o consumo subir e descer em tempo real conforme troca de jogo, abaixa o brilho ou fecha processos.

## Convertendo watts em algo palpável

Watts são abstratos até você cruzar com a capacidade. Se a bateria ainda guarda 36,81 Wh (medido na seção de leitura) e você consome 10,82 W, a autonomia teórica restante é simples:

```terminal
$ python3 -c "print(round(36.81/10.82, 2), 'horas')"
3.4 horas
```

Isso é energia total dividida por potência. Na prática o consumo não é constante — um jogo pesado pode puxar o dobro —, mas o número dá a régua para comparar cenários: "neste jogo, a 9 W, tenho 4 horas; naquele, a 18 W, só 2". Medir é o que torna a autonomia previsível em vez de um mistério.

:::dica
Para uma leitura contínua e bonita, combine `watch` com a conversão imediata em watts e o percentual:

```terminal
$ watch -n 2 'awk "{printf \"%.2f W  |  %.0f%%\\n\", \$1/1000000, \$1/1000000/36.81*100}" /sys/class/power_supply/BAT1/power_now'
```

Ajuste o `36.81` para o seu `energy_full` em Wh. O resultado é um "velocímetro" de consumo no próprio terminal.
:::

## Quem está comendo watts: `powertop`

Saber que o consumo é 10 W é o começo; descobrir **o quê** consome exige outro instrumento. O `powertop`, da Intel, sonda o hardware e estima o consumo por subsistema e por processo:

```terminal
$ sudo powertop
```

Dentro da interface interativa, a aba *Overview* mostra o consumo total estimado e a *Device stats* / *Tunables* lista o que está acordado. A saída em modo não-interativo é mais fácil de escanear:

```terminal
$ sudo powertop --html=/tmp/powertop.html
```

Isso gera um relatório HTML com o breakdown de consumo e os "tunables" — ajustes que o `powertop` considera subótimos, como um dispositivo USB que não entra em suspensão. Nem todo tunable faz sentido aplicar às cegas no Deck (alguns economizam migalhas e podem atrapalhar periféricos), mas o relatório aponta exatamente onde está o gasto.

:::nota
O `powertop` pode não vir instalado no SteamOS por padrão. No modo desktop, instale pelo Discover ou, com o acesso de escrita liberado, via pacote. Como o SteamOS usa sistema de arquivos com leitura ativa restrita, vale conferir a seção sobre modo desktop antes de mexer no sistema.
:::

## O que puxa mais no Deck

No Steam Deck há uma hierarquia clara de consumo, e saber ela evita otimizar o lugar errado:

| Componente | Peso típico | O que controla |
|---|---|---|
| APU (CPU+GPU) | dominante em jogos | limite de TDP, taxa de quadros |
| Tela + backlight | ~1 a 3 W | brilho |
| Wi-Fi/Bluetooth | fração de watt | ligado/desligado |
| Tela desligada/idle | mínimo | suspensão |

A maior alavanca não é o brilho, mas o **quadro por segundo e o limite de energia da APU**. Travar a 40 FPS ou limitar o TDP no menu de desempenho do SteamOS corta o consumo da CPU/GPU de forma muito mais expressiva do que apagar o Wi-Fi. Medir com `watch` deixa isso evidente: mude o limite de TDP e veja `power_now` cair na hora.

```terminal
Every 2,0s: awk '{printf "%.2f W\n", $1/1000000}' /sys/class/power_supply/BAT1/power_now

21,30 W
```

A leitura de 21,30 W é o cenário sem limite, num jogo exigente. Aplicando um limite de TDP de 8 W e travando FPS, o mesmo jogo cai para perto de 12 W — e a autonomia praticamente dobra, com perda modesta de fluidez. É economia medida, não chute.

## Resumo

- `power_now` (µW) e `energy-rate` (W) medem a potência instantânea que entra ou sai.
- `watch -n` re-amostra a leitura para acompanhar a flutuação em tempo real.
- Autonomia teórica = `energy_full` ÷ `power_now`, mas o consumo não é constante.
- `powertop` estima o consumo por subsistema e lista tunables de economia.
- No Deck, limitar TDP e FPS da APU economiza mais do que apagar Wi-Fi ou abaixar brilho.

## Exercícios

1. Rode `watch -n 2 cat /sys/class/power_supply/BAT1/power_now` e observe a leitura em idle e num jogo leve. Anote os dois valores em watts.
2. Calcule a autonomia teórica em dois cenários usando `energy_full` dividido pela potência medida.
3. Instale e rode `sudo powertop --html=/tmp/powertop.html` e abra o relatório. Liste os três "tunables" que indicam maior gasto.
4. Num jogo, meça o consumo com o limite de TDP no máximo e depois no mínimo; anote a diferença em watts e a diferença de FPS percebida.
5. **Desafio.** Crie o "velocímetro" de consumo do bloco `:::dica` e use-o enquanto liga/desliga Wi-Fi e muda o brilho. Qual mudança teve maior efeito proporcional no `power_now`? Compare com o resultado do exercício 4 e explique por que limitar a APU é a alavanca dominante.
