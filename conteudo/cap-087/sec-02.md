Todo mundo já ouviu que "bateria de lítio desgasta com o uso", mas o que exatamente conta como uso? A resposta está num número que o sistema registra sozinho: o ciclo de carga. Entender o que é um ciclo — e o que **não** é — muda completamente a forma de cuidar do aparelho.

:::objetivos
- Definir ciclo de carga e o equívoco comum sobre ele
- Relacionar ciclos, `capacity` e desgaste químico
- Entender o papel da temperatura e do estado de carga no envelhecimento
- Ler o contador de ciclos do seu aparelho
- Ajustar hábitos que estendem a vida útil real da bateria

:::

## O que é (e o que não é) um ciclo

Um **ciclo de carga** não é sinônimo de "uma vez que plugou no carregador". A indústria define ciclo como o consumo acumulado equivalente a 100% da capacidade. Se você descarrega de 80% até 30% (50% da capacidade) num dia e faz o mesmo no dia seguinte, isso conta **um** ciclo no final dos dois dias — mesmo tendo plugado duas vezes.

```terminal
$ upower -i /org/freedesktop/UPower/devices/battery_BAT1 | grep charge-cycles
    charge-cycles:       187
```

Esses 187 significam que a bateria já entregou energia acumulada equivalente a 187 vezes a capacidade cheia dela, não que você a descarregou completamente 187 vezes. O contador é cumulativo e nunca zera; ele é a régua de tempo de vida do componente.

:::nota
A bateria do Steam Deck (como a maioria das de lítio-íon atuais) é especificada para manter em torno de 80% da capacidade original depois de 500 a 1000 ciclos. Você vê isso refletido no campo `capacity`: com 187 ciclos e 92% de saúde, o desgaste está dentro do esperado; com 187 ciclos e 60%, algo está fora do normal — calor excessivo, carga mal armazenada ou um lote ruim.
:::

## Por que a capacidade cai

O `energy_full` (capacidade cheia **atual**) é sempre menor que o `energy_full_design` (a de fábrica), e a diferença cresce com o tempo. Isso acontece por desgaste químico irreversível dentro das células: a cada ciclo, uma parte minúscula do lítio reage com o eletrólito e forma depósitos que não participam mais da reação. O resultado é que a célula passa a guardar menos energia e a resistência interna sobe.

```terminal
$ cat /sys/class/power_supply/BAT1/energy_full_design
40000000
$ cat /sys/class/power_supply/BAT1/energy_full
36810000
$ python3 -c "print(round(36810000/40000000*100, 1), '%')"
92.0 %
```

Essa conta simples produz o mesmo `capacity` que o `upower` exibe. Ela funciona porque `energy_full` é a capacidade que a bateria **consegue** atingir hoje ao carregar até 100%, e `energy_full_design` é o valor gravado pelo fabricante. A diferença entre elas é o seu desgaste acumulado.

:::atencao
`energy_full` não é uma constante. Ele é recalculado pelo microcontrolador após cargas completas e pode oscilar alguns por cento entre leituras. Não se assuste com flutuações pequenas; o que importa é a tendência ao longo de meses, não a variação de um dia para o outro.
:::

## Os dois vilões: calor e extremos de carga

O envelhecimento químico não é linear. Dois fatores aceleram brutalmente o processo, e ambos estão sob o seu controle.

**Calor.** Temperaturas altas aceleram as reações químicas — inclusive as que degradam a bateria. Jogar por horas com o Deck quente, deixar no sol ou carregar num lugar abafado encurta a vida do componente mais do que o simples número de ciclos sugeriria. Você leu a temperatura na seção anterior.

**Estados de carga extremos.** Ficar parado em 100% ou em 0% estressa as células. Permanecer semanas plugado em 100% é pior do que passar o mesmo período entre 40% e 60%. Isso não significa que você deva evitar carregar até o fim; significa que **deixar o aparelho morando nesses extremos** é o que custa caro.

```terminal
$ upower -i /org/freedesktop/UPower/devices/battery_BAT1 | grep temperature
    temperature:         41,7 degrees C
```

Se a leitura de temperatura passa dos 40 °C com frequência durante o uso normal, é hora de rever ventilação e carga de trabalho — não só pelo conforto, mas pela longevidade da célula.

## Hábitos que realmente ajudam

Com os dois vilões em mente, as recomendações deixam de ser folclore:

- **Evite descarregar até desligar** com frequência. Desligar em 5% de vez em quando não mata nada, mas fazer disso rotina acelera o desgaste.
- **Não deixe dias e dias em 100%** se não vai usar. Se for guardar por mais de uma semana, deixe entre 40% e 60%.
- **Prefira cargas ambientadas.** O Deck carrega mais rápido a frio e devagar perto do fim, por isso o gerenciamento já faz o trabalho pesado — sua parte é não somar calor desnecessário.
- **Cargas parciais são normais.** Plugar de 30% até 80% duas vezes "custa" o mesmo ciclo que uma carga completa, mas estressa menos a química.

:::dica
O SteamOS não expõe por padrão um "limite de carga" configurável em 80% na interface do modo de jogo, mas há ferramentas e scripts para isso no modo desktop. Voltaremos ao limite de carga na seção sobre modo desktop — por ora, o hábito manual de desplugar perto dos 80–90% já ajuda em cenas de uso fixo na mesa.
:::

## Resumo

- Um ciclo equivale a 100% de capacidade consumida de forma acumulada, não a uma carga completa.
- `charge-cycles` é o contador cumulativo de tempo de vida da bateria.
- `capacity` = `energy_full` ÷ `energy_full_design`, e cai por desgaste químico irreversível.
- Calor e permanência em estados de carga extremos aceleram o envelhecimento.
- Cargas parciais e evitar extremos prolongados estendem a vida útil real.

## Exercícios

1. Leia `charge-cycles`, `energy_full` e `energy_full_design` do seu aparelho e calcule o `capacity` na mão, comparando com o valor do `upower`.
2. Anote a temperatura da bateria em três momentos (idle, 30 min de jogo, carregando). Qual cenário aquece mais e por quê?
3. Estime quantos ciclos por semana você faz com base no seu uso. Em quantos anos você atingiria 500 ciclos?
4. Procure nos arquivos de `/sys/class/power_supply/BAT1` algum campo chamado `cycle_count` (alguns firmwares usam esse nome). Compare com `charge-cycles` do `upower`.
5. **Desafio.** Mantenha um registro de uma semana: a cada carga, anote % inicial e % final e some os deltas. No fim, divida a soma por 100 e compare com quantos ciclos o contador avançou no período. Os números batem? O que uma eventual diferença revela sobre a precisão do contador?
