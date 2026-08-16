Se o aparelho desliga com "18% de bateria" ou salta de 40% para 12% de repente, o problema raramente é a célula em si — é o **medidor** que perdeu a calibragem. O circuito que estima a carga deriva com o tempo, e recalibrar é a correção mais barata antes de pensar em trocar a bateria.

:::objetivos
- Entender por que o medidor de carga deriva
- Identificar sintomas de medidor descalibrado
- Realizar um ciclo completo de calibração com segurança
- Interpretar `energy_full` antes e depois do processo
- Separar descalibração de desgaste real

:::

## O medidor não é um copo medidor

O chip que reporta `percentage` não mede um nível físico como um boia mede água numa caixa. Ele **estima** a carga contando coulombs que entram e saem (o chamado *coulomb counting*) e casando isso com a tensão das células. Com o tempo, pequenos erros nessa contagem se acumulam, e a referência do que é "cheio" e "vazio" se desloca.

O sintoma clássico é coerente com isso e não com defeito químico: o aparelho desliga "do nada" com percentual alto, ou fica preso em 100% por meia hora antes de cair. A célula está bem; a régua é que está torta.

```terminal
$ upower -i /org/freedesktop/UPower/devices/battery_BAT1 | grep -E 'percentage|energy-full|energy-full-design'
    percentage:          100%
    energy-full:         36,81 Wh
    energy-full-design:  40,00 Wh
```

Aqui a saúde (`energy-full` vs `energy-full-design`) segue 92%, então o desgaste é modesto. Se, ainda assim, o aparelho desliga aos "15%", o diagnóstico aponta para descalibração, não para uma célula morta. É importante não trocar bateria boa por causa de medidor preguiçoso.

## O que a calibragem faz

Calibrar é ensinar ao medidor de novo onde ficam os extremos reais. O processo padrão consiste em três fases:

1. **Carregar até 100%** e deixar mais um pouco na tomada para o chip marcar o topo real com folga.
2. **Descarregar até desligar sozinho**, sem recarregar no meio, para o chip ver o fundo de verdade.
3. **Recarregar até 100% sem interromper**, para o chip gravar a nova capacidade cheia.

A descarga completa é a parte que "paga" a calibragem: é só nela que o firmware mede, pela queda de tensão nas células, onde fica de fato o 0%. As duas cargas completas em torno dela registram o 100%.

:::atencao
A descarga até desligar é exatamente o hábito que a seção de ciclos mandou **evitar como rotina**. A diferença está na frequência: uma calibragem profunda a cada poucos meses é aceitável e útil; fazer isso toda semana é perder vida útil à toa. Calibre com parcimônia.
:::

## Executando o ciclo na prática

Não há um comando mágico de calibragem; o processo é físico e conduzido pelo uso. O que o sistema oferece é a **observação** dos marcos. Comece deixando carregar e confirme o estado:

```terminal
$ upower -i /org/freedesktop/UPower/devices/battery_BAT1 | grep -E 'state|percentage'
    state:               fully-charged
    percentage:          100%
```

Depois, descarregue — jogando ou deixando um vídeo em loop — até o aparelho se desligar sozinho. Não ligue de novo para "esticar" o fundo: o desligamento automático é parte da medição. Por fim, recarregue de uma vez só até voltar a `fully-charged` e confira o novo `energy_full`:

```terminal
$ upower -i /org/freedesktop/UPower/devices/battery_BAT1 | grep -E 'energy-full|percentage|state'
    state:               fully-charged
    energy-full:         35,10 Wh
    percentage:          100%
```

Repare: `energy_full` **mudou** de 36,81 Wh para 35,10 Wh. Isso não é a bateria piorando num dia — é o medidor agora relatando a capacidade real com mais honestidade. Se, após calibrar, o aparelho parou de desligar nos 15%, o problema era a régua, não a célula.

## Calibragem vs. desgaste: como distinguir

A pergunta que fecha o diagnóstico é: depois de calibrar, o `energy_full` estabiliza numa saúde coerente com os ciclos, ou continua despencando?

| Sinal | Interpretação |
|---|---|
| Desligava em 15%, após calibrar passa a desligar em ~2% | Descalibração; célula saudável |
| `energy_full` cai pouco e estabiliza após calibrar | Medidor corrigido; siga em frente |
| Mesmo calibrada, desliga cedo e `energy_full` segue caindo | Desgaste real; considere troca |

A calibragem é ao mesmo tempo correção e ferramenta de diagnóstico. Ela força o `energy_full` a se reconciliar com a química real — e o resultado revela, sem romantismo, se o problema era medição ou desgaste.

:::dica
Não confunda calibragem com "carregar a primeira vez por 12 horas" — isso era mito das baterias antigas de NiCd. Em lítio-íon, o ciclo completo descrito aqui é o suficiente, e cargas longas além do `fully-charged` não acrescentam nada além de calor.
:::

## Resumo

- O medidor estima carga por contagem de coulombs e deriva com o tempo.
- Desligar com percentual alto e ficar preso em 100% são sintomas de descalibração.
- Calibrar = carregar até 100%, descarregar até desligar e recarregar completo sem interrupção.
- Após calibrar, `energy_full` costuma se corrigir para um valor mais realista.
- Se o desgaste persiste mesmo calibrado, o problema é a célula, não o medidor.

## Exercícios

1. Anote o `energy_full` e `percentage` atuais. Há sinais de descalibração no seu aparelho hoje?
2. Execute um ciclo de calibração completo (charge → discharge até desligar → charge). Documente os marcos de estado com `upower`.
3. Compare o `energy_full` antes e depois da calibragem. Quanto mudou, em Wh e em %?
4. Depois do ciclo, observe por alguns dias se o desligamento prematuro sumiu ou persiste.
5. **Desafio.** Antes de calibrar, registre por uma semana os percentuais de desligamento de cada sessão. Depois da calibragem, refaça o registro e entregue um mini-relatório (tabela) correlacionando a diferença entre os dois períodos com a variação do `energy_full`, concluindo se a causa era medição ou desgaste.
