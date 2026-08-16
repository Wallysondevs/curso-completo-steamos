Processador, placa de vídeo e bateria vivem nas entranhas do aparelho, mas o que o usuário sente é a autonomia. Nesse quesito, o Steam Deck OLED não evoluiu só trocando uma bateria maior: a Valve mexeu na eficiência do chip e, com isso, a duração da carga subiu de forma desproporcional ao simples aumento de 40 para 50 Wh. Entender essa relação — capacidade, consumo e medição — é o que separa quem lê especificação de quem administra o aparelho de verdade.

Nesta seção você aprende a medir a bateria real do seu Steam Deck e a interpretar os números que o sistema oferece.

:::objetivos
- Comparar a autonomia real dos modelos LCD e OLED e os fatores por trás dela
- Ler carga, capacidade e ciclo de carga pelo sistema de arquivos e pelo `upower`
- Monitorar taxa de consumo e estimar tempo restante
- Entender por que o OLED rende mais mesmo com ganho de APU modesto
- Interpretar saúde de bateria e sinais de desgaste em unidades usadas
:::

## Por que o OLED dura mais

A autonomia é consequência de uma fração simples: capacidade da bateria dividida pelo consumo do aparelho. O LCD tem **40 Wh**; o OLED tem **50 Wh** — um ganho de 25% na capacidade. Mas a duração de uso subiu mais que isso porque o consumo também caiu.

Duas mudanças explicam o consumo menor. Primeiro, a APU **Sephiroth** é fabricada em 6 nanômetros contra os 7 nanômetros do Aerith: o transistor menor chaveia com menos energia elétrica, então o mesmo trabalho de jogo custa menos. Segundo, a própria tela OLED, por apagar pixels pretos, gasta menos em cenas escuras — e o painel menor de 90 Hz, em conteúdos leves, também ajuda a esticar a carga.

O resultado prático, medido pela Valve e por reviews da época: o LCD rende algo entre 2 e 8 horas dependendo da carga (de jogos AAA pesados até uso leve), enquanto o OLED fica entre 3 e 12 horas nas mesmas condições. A diferença é mais visível justamente nos cenários leves, onde o painel e o chip eficientes têm mais peso relativo.

:::nota
A "autonomia" que as lojas citam é sempre uma estimativa em condições específicas, nunca uma promessa. A Valve descreve faixas amplas exatamente porque o Steam Deck pode puxar de poucos watts (menu, jogo 2D) até mais de 20 W (AAA pesado + tela no máximo). Por isso a medição própria, feita abaixo, importa mais que o número de marketing.
:::

## Lendo a carga atual

A forma mais direta de saber a carga da bateria é ler o arquivo virtual que o kernel mantém para o dispositivo:

```terminal
$ cat /sys/class/power_supply/BAT1/capacity
76
$ cat /sys/class/power_supply/BAT1/status
Discharging
$ cat /sys/class/power_supply/BAT1/energy_now
38000000
```

O `capacity` devolve a carga em porcentagem (aqui 76%). O `status` informa o estado — `Discharging`, `Charging`, `Full` ou `Unknown`. O `energy_now` é a energia disponível naquele instante, em µWh; com 76% de uma bateria de 50 Wh, o valor de `38000000` µWh (38 Wh) bate certo.

Os arquivos de `/sys/class/power_supply/BAT1/` são muitos, e cada um responde a uma pergunta diferente:

| Arquivo | O que informa |
|---|---|
| `capacity` | carga atual em % |
| `status` | carregando / descarregando / cheia |
| `energy_now` | energia disponível agora (µWh) |
| `energy_full` | capacidade que a bateria retém hoje (µWh) |
| `energy_full_design` | capacidade de projeto (µWh) |
| `charge_now` / `charge_full` | mesmo conceito, em µAh, em alguns drivers |

A distinção entre `energy_full` e `energy_full_design` é a chave para medir desgaste: a bateria nasce com `full` igual a `design`, e com o tempo o `full` encolhe. É exatamente isso que o `upower` resume em `capacity` percentual.

:::dica
Divida os valores em µWh por 1 000 000 para obter watt-hora. Bateria cheia de um OLED novo mostra `energy_now` e `energy_full` ao redor de `50000000` (50 Wh); num LCD, ao redor de `40000000` (40 Wh). Esse número também serve de identificação de geração, como vimos na seção de abertura.
:::

## Taxa de consumo e tempo restante

A carga diz onde você está; a taxa de consumo diz a que velocidade a bateria esvazia. O `energy_now` sozinho não dá essa informação — é preciso observar como ele varia no tempo, ou ler o valor de potência que o sistema já calcula.

O `upower` expõe o consumo instantâneo no campo `energy-rate`:

```terminal
$ upower -i /org/freedesktop/UPower/devices/battery_BAT1
  ...
  energy:               38.0 Wh
  energy-full:          50.0 Wh
  energy-full-design:   50.0 Wh
  energy-rate:          12.4 W
  voltage:              7.6 V
  percentage:           76%
  ...
```

Com `energy-rate` em `12.4 W` (o consumo naquele instante) e `energy` em 38 Wh, dá para estimar o tempo restante: 38 Wh ÷ 12,4 W ≈ 3,06 horas. O `upower` às vezes traz esse cálculo pronto num campo `time to empty`, mas ele é uma estimativa pontual, válida só enquanto o consumo se mantém.

Para uma medição mais honesta, amostre a carga em dois momentos e calcule a média. Por exemplo, com 10 minutos de jogo pesado:

```terminal
$ cat /sys/class/power_supply/BAT1/energy_now
38000000
$ sleep 600
$ cat /sys/class/power_supply/BAT1/energy_now
35600000
```

A bateria perdeu 38 000 000 − 35 600 000 = 2 400 000 µWh (2,4 Wh) em 600 segundos. Isso dá um consumo médio de 2,4 Wh ÷ 600 s × 3600 = 14,4 W — um valor típico de jogo 3D moderado. Com a energia cheia de 50 Wh, a autonomia estimada nesse ritmo seria de cerca de 3,5 horas.

:::atencao
O `energy-rate` oscila muito: um pico de carregamento de cena e a tela no máximo puxam o número para cima por segundos. Nunca tire conclusão de uma única leitura de `energy-rate`; a média sobre alguns minutos (amostragem com `sleep`) é sempre mais confiável.
:::

## Saúde e ciclos: o retrato de uma bateria usada

Toda bateria de íon-lítio perde capacidade a cada ciclo de carga. O Steam Deck, como qualquer notebook, expõe esse histórico. Os campos que importam são `charge-cycles` (quantos ciclos completos já foram feitos) e a razão entre `energy-full` e `energy-full-design`.

```terminal
$ cat /sys/class/power_supply/BAT1/cycle_count
214
$ upower -i /org/freedesktop/UPower/devices/battery_BAT1 | grep -E 'capacity|charge-cycles|energy-full'
  energy-full:          44.3 Wh
  energy-full-design:   50.0 Wh
  capacity:            88.6%
  charge-cycles:        214
```

A unidade do exemplo é um OLED com 214 ciclos e 88,6% de saúde: ela já entrega 44,3 Wh em vez dos 50 originais. É um desgaste normal para um aparelho de uso diário há mais de um ano. Com 88,6% de saúde, a autonomia efetiva cai de aproximadamente 12 para 10,6 horas no uso leve — algo que só a medição revela.

Para um aparelho usado, esse é o número que define o preço justo: uma bateria a 88% vale mais que uma a 70%, que por sua vez indica uso intenso ou idade avançada. A Valve não vende a bateria como peça avulsa com facilidade, então a saúde conta muito na compra de usados.

:::perigo
Nunca confie em `capacity` percentual (o campo de carga) para julgar saúde — ele mostra o quanto a bateria está carregada, não o quanto ela ainda aguenta. O indicador de saúde é a razão `energy_full ÷ energy_full_design` (ou o `capacity` que o `upower` calcula a partir deles). Ler só a carga e concluir "bateria boa" é o erro mais comum na avaliação de usados.
:::

## Resumo

- A autonomia é capacidade ÷ consumo: o LCD tem 40 Wh, o OLED 50 Wh (25% a mais).
- O OLED dura além dos 25% porque a APU de 6 nm e o painel eficiente reduzem o consumo.
- `/sys/class/power_supply/BAT1/capacity` dá a carga em %, `status` o estado e `energy_now` a energia em µWh.
- `upower -i .../battery_BAT1` traz `energy-rate` (consumo em W), que permite estimar tempo restante.
- Amostrar `energy_now` em dois instantes e dividir pelo intervalo dá o consumo médio real em watts.
- A saúde de bateria é `energy_full / energy_full_design`, refletida no `capacity` e nos `charge-cycles` do `upower`.

## Exercícios

1. Leia `capacity`, `status` e `energy_now` da bateria e registre os três valores agora.
2. Com o aparelho desconectado, rode `upower -i .../battery_BAT1` e anote `energy-rate` e `energy`. Estime o tempo restante dividindo um pelo outro.
3. Amostre `energy_now`, espere 5 minutos (`sleep 300`) e leia de novo. Calcule o consumo médio em watts e compare com o `energy-rate` instantâneo.
4. Rode `cat /sys/class/power_supply/BAT1/cycle_count` e o `upower` completo. Sua unidade tem quantos ciclos e qual a saúde percentual?
5. **Desafio.** Estime a autonomia máxima do seu aparelho no uso leve: fixe brilho em 30% (via backlight da seção de tela), deixe um vídeo ou menu rodando por 15 minutos e amostre a energia. Converta o consumo médio em horas de uso com a capacidade cheia e compare com a faixa declarada pela Valve para o seu modelo.
