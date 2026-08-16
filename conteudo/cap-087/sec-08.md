Trocar a bateria é caro, e trocar por engano é caro e inútil. Antes de abrir o aparelho, você precisa separar três condições que se parecem muito: descalibração (já resolvida), desgaste normal (convive-se) e falha real (exige troca). Esta seção ensina a reconhecer cada uma pelos números e pelos sinais físicos.

:::objetivos
- Listar os sintomas que indicam falha real de bateria
- Ler saúde, ciclos e temperatura para cruzamento de diagnóstico
- Reconhecer sinais físicos como inchaço e calor anormal
- Diferenciar desgaste normal de defeito
- Decidir com critério quando trocar

:::

## Os sintomas que realmente pesam

Nem toda queda de autonomia é motivo de troca. Os sinais que apontam para problema sério são específicos e, em geral, combinados:

- **Desligamento abrupto com carga alta**, mesmo **depois** de uma calibragem bem feita.
- **Autonomia desabando** para uma fração do que era — não 10% a menos, mas metade ou menos.
- **Inchaço físico** do aparelho: a tampa traseira abaulada, o vidro do trackpad pressionando para fora, o Deck não assentando mais reto na mesa.
- **Calor localizado** na região da bateria sem uso pesado, ou bateria que aquece mesmo em idle.
- **Carga que não segura**: vai a 100% em minutos e esvazia em minutos.

Qualquer um desses isolados merece investigação; dois ou mais juntos são um caso forte.

:::perigo
O inchaço de bateria de lítio é risco de incêndio. Se o Deck estiver abaulado, pare de usar e de carregar imediatamente, e procure assistência ou descarte adequado. **Não fure, não tente "esvaziar" e não continue carregando** um aparelho com bateria inchada.
:::

## O retrato pelos números

Os números que você aprendeu a ler formam, juntos, um diagnóstico. Cruze os três principais campos do `upower`:

```terminal
$ upower -i /org/freedesktop/UPower/devices/battery_BAT1 | grep -E 'charge-cycles|capacity|energy-full|temperature'
    charge-cycles:       743
    energy-full:         22,14 Wh
    energy-full-design:  40,00 Wh
    capacity:            55,35%
    temperature:         43,0 degrees C
```

Aqui o quadro é de desgaste avançado e coerente: 743 ciclos e `capacity` de 55% andam juntos. Uma bateria com essa saúde oferece pouco mais da metade da autonomia original, esquenta mais (a resistência interna subiu) e se aproxima do fim útil. É o caso típico em que a troca se justifica — após confirmar que uma calibragem não "devolve" capacidade fantasma.

Os mesmos dados, lidos direto do kernel, contam a história sem o resumo do `upower`:

```terminal
$ cat /sys/class/power_supply/BAT1/energy_full_design /sys/class/power_supply/BAT1/energy_full
40000000
22140000
$ cat /sys/class/power_supply/BAT1/cycle_count
743
```

Repare na falha concreta: dos 40 Wh de projeto, sobraram 22,14 Wh — a bateria perdeu quase metade da capacidade física. O `cycle_count` (743) fecha o pareamento com a queda. Quando a leitura crua já mostra essa relação, não há calibragem que recupere os watt-hora que a química deixou de guardar.

Compare com um cenário suspeito: `capacity` caindo rápido (10% em semanas) com **poucos** ciclos. Isso foge do desgaste normal e sugere defeito de lote ou dano por calor/mau armazenamento.

## Separando desgaste normal de defeito

| Observação | Diagnóstico | Ação |
|---|---|---|
| `capacity` ~90% com 200 ciclos | Desgaste normal | Seguir usando |
| Desliga cedo, some após calibrar | Descalibração | Nada a trocar |
| `capacity` 55% com 700+ ciclos | Fim de vida útil | Trocar é legítimo |
| `capacity` caindo com poucos ciclos | Defeito/dano | Investigar causa (calor, lote) |
| Inchaço físico | Falha crítica | Parar e trocar já |

A distinção-chave é a **coerência entre ciclos e capacidade** e a **resposta à calibragem**. Troca baseada só em "dura pouco" sem olhar esses fatores é aposta, não diagnóstico.

Um teste rápido expõe o defeito na prática. Com o Deck parado num menu simples (carga leve), observe o consumo e o `time to empty`:

```terminal
$ upower -i /org/freedesktop/UPower/devices/battery_BAT1 | grep -E 'energy-full|time to empty|state'
    state:               discharging
    energy-full:         22,14 Wh
    time to empty:       1,9 hours
```

Uma bateria nominalmente de 40 Wh que, cheia, entrega menos de 2 horas de autonomia **em idle** é um sinal vermelho independente de qualquer percentual. Cruze esse número com o `capacity` baixo e você tem um defeito — não um problema de medidor.

:::atencao
`capacity` abaixo de 80% é o marco comum da indústria para "bateria degradada", mas não é uma sentença de troca automática. Se o Deck ainda cumpre seu uso num dia (uma sessão de jogo), dá para estender a vida útil reduzindo a carga de trabalho, como visto na seção de economia. Troque quando a autonomia deixa de atender **o seu** uso, não quando cruza um número arbitrário.
:::

## Cuidando da causa antes de trocar

Se o diagnóstico aponta desgaste, vale atacar a causa antes de gastar com peça nova — senão a bateria nova sofrerá o mesmo destino. As causas mais comuns de morte precoce você já conhece do capítulo:

- **Calor crônico** — jogo pesado sem ventilação, carregamento em ambiente quente.
- **Estacionamento em 100%** por semanas (o cenário da seção de limite de carga).
- **Descargas profundas repetidas** até desligar.

Eliminar a causa é parte da decisão de troca: uma célula nova em ambiente corrigido dura os anos que deveria; em ambiente tóxico, é dinheiro jogado fora.

:::dica
Antes de decidir trocar, faça uma "prova final" de honestidade: calibre, meça a autonomia real de um jogo referência e registre os três números (`capacity`, `charge-cycles`, autonomia medida). Com isso na mão, a decisão vira uma comparação objetiva contra a autonomia de fábrica — não uma impressão.
:::

## Resumo

- Sinais sérios incluem desligamento precoce pós-calibragem, inchaço e calor localizado.
- `capacity`, `charge-cycles` e `energy-full` cruzados formam o diagnóstico numérico.
- Desgaste normal é coerente com os ciclos; queda rápida com poucos ciclos sugere defeito.
- Troque quando a autonomia deixa de atender seu uso, não por um número arbitrário.
- Bateria inchada é risco de incêndio: pare e procure assistência imediatamente.

## Exercícios

1. Colete `capacity`, `charge-cycles` e `energy-full` do seu aparelho e escreva uma frase de diagnóstico (desgaste normal? fim de vida? defeito?).
2. Inspecione fisicamente o Deck: a tampa está reta? Algum abaulamento? O aparelho assenta reto na mesa?
3. Rode uma sessão de 20 min e meça a temperatura da bateria antes e depois. Aquece em idle? Aquece demais sob carga?
4. Calibre (se ainda não fez) e meça a autonomia real de um jogo referência; compare com a autonomia esperada pelo `energy_full`.
5. **Desafio.** Produza um mini-laudo de uma página: cruze os números coletados com os sinais físicos e emita um veredito fundamentado — "seguir usando", "reduzir carga e reavaliar em X meses" ou "trocar" — citando os valores que sustentam cada conclusão.
