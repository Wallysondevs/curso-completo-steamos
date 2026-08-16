Antes de mexer em qualquer curva de ventoinha, você precisa entender a arquitetura física que remove o calor do Steam Deck: um conjunto de heat pipe, dissipador de aletas e uma única ventoinha radial, tudo empacotado numa caixa fina. O design dita o comportamento térmico — por que a ventoinha gira mais quando você segura o aparelho de certa forma, por que a entrada de ar entupida derruba o FPS em minutos e por que a temperatura "ideal" não é a menor possível. Esta seção explica o hardware e o fluxo de ar, de fora para dentro.

:::objetivos
- Entender a função do heat pipe, do dissipador e da ventoinha radial
- Localizar as entradas e saídas de ar do Steam Deck
- Explicar por que o fluxo de ar bloqueado causa throttling rápido
- Relacionar orientação de uso com eficiência de resfriamento
- Conhecer a diferença entre resfriamento passivo e ativo
:::

## De onde vem e para onde vai o calor

Todo o calor do Deck é gerado num único chip, o APU, que troca energia elétrica por trabalho e dissipa o restante como calor. Esse calor precisa de um caminho de fuga: primeiro ele atravessa a pasta térmica e o dissipador de contato, depois viaja pelo heat pipe até as aletas, e por fim é levado embora pelo ar que a ventoinha empurra.

A ordem importa. Se o contato entre o die e o dissipador estiver ruim (pasta seca, parafusos mal torcados), nenhuma velocidade de ventoinha resolve: o calor fica preso no chip. Se o heat pipe estiver danificado (situação rara), o transporte para as aletas falha. E se as aletas estiverem cobertas de poeira, o ar não as atravessa e o calor se acumula na saída.

Você pode confirmar qual parte está ativa olhando para o sensor da placa e comparando com o die:

```terminal
$ cat /sys/class/hwmon/hwmon3/temp1_input
52000
$ cat /sys/class/hwmon/hwmon0/temp1_input
86000
```

Quando a diferença entre o die (86 °C) e a placa (52 °C) é grande, o calor está saindo do die e chegando ao dissipador — o problema está nas aletas ou no fluxo de ar. Quando ambos estão muito próximos e altos, o calor não está se movendo do die para o dissipador.

## O heat pipe e a bomba de calor

O heat pipe é um tubo de cobre selado, parcialmente preenchido com um fluido em baixa pressão. No lado quente (sobre o APU), o fluido evapora e absorve energia; o vapor migra para o lado frio (as aletas), condensa devolvendo o calor, e o líquido retorna por capilaridade. Esse ciclo funciona como uma "bomba de calor" passiva, sem partes móveis, transferindo dezenas de watts com diferença mínima de temperatura.

:::nota
O heat pipe é um exemplo clássico de **mudança de fase** aproveitando o calor latente de vaporização — o mesmo princípio do seu freezer, em escala menor. Por isso ele transfere muito mais calor que uma barra de cobre sólida do mesmo tamanho.
:::

## A ventoinha radial e o fluxo de ar

Diferente das ventoinhas axiais dos desktops (que empurram o ar ao longo do eixo), o Deck usa uma ventoinha **radial** (também chamada de blower): o ar entra pelo centro, perpendicular à placa, e é expelido tangencialmente pela borda. Esse formato é baixo o bastante para caber numa caixa fina e empurra o ar por um duto estreito, o que é eficiente para vencer a resistência das aletas densas.

O fluxo no Deck segue uma rota específica: o ar frio entra pela **grade traseira** (atrás da tela, na metade superior), passa pelo APU e pelo dissipador, e é expelido pela **grade superior** (perto do botão de energia). Tapar qualquer uma dessas duas janelas quebra o ciclo:

```terminal
$ cat /sys/class/hwmon/hwmon*/name
k10temp
amdgpu
nvme
steamdeck-hwmon
```

O sensor `steamdeck-hwmon` é o que a Valve usa para ler a ventoinha e a temperatura da placa. É ele que revela a rotação (RPM) real do blower, como veremos na próxima seção.

:::atencao
Apoiar o Deck sobre uma almofada, colcha ou o próprio colo tampa a grade traseira e faz o ar quente recircular dentro da caixa. Em carga alta, isso derruba o clock em segundos. Use o aparelho sobre superfície rígida, ou segure-o deixando a grade livre.
:::

## Orientação de uso e acúmulo de poeira

A ventoinha radial também é a principal porta de entrada de poeira: o fluxo constante arrasta partículas que se depositam nas aletas. Com o tempo, a camada de poeira age como isolante e também como obstáculo ao ar. A limpeza periódica (seção 8) é parte da manutenção, não apenas cosmética.

A posição de uso influencia a eficiência. Na vertical com a grade superior para cima, o ar quente sobe naturalmente e o duto trabalha a favor. Deitado sobre a mesa com a grade traseira livre, o fluxo também é bom. De cabeça para baixo ou com a mão cobrindo a grade superior, você reduz a vazão e aumenta a temperatura de regime.

Quanto vale essa diferença? Um teste simples com `sensors` em duas posições revela:

```terminal
$ sensors | grep -E "fan1|Tdie"
Tdie:         +78.0°C
fan1:        4800 RPM

## girando o Deck 180° (grade superior para baixo) e aguardando 60 segundos:
Tdie:         +84.0°C
fan1:        5800 RPM
```

A grade obstruída força a ventoinha a girar mais rápido para manter o mesmo fluxo, mas o ar quente que deveria escapar fica preso dentro da caixa — resultado: mais ruído e mais calor.

:::dica
Para avaliar rapidamente se o resfriamento está íntegro, coloque a mão (sem tocar) sobre a grade superior durante um jogo pesado: você deve sentir um fluxo de ar morno constante. Se a grade estiver quente mas sem fluxo, ou se o ar sair frio enquanto o `sensors` marca 90 °C, há obstrução no duto.
:::

## Resumo

- O calor do APU flui por pasta térmica, dissipador, heat pipe e aletas até ser expelido pelo ar.
- O heat pipe transfere calor por evaporação/condensação de um fluido interno — é uma bomba de calor passiva.
- A ventoinha radial (blower) do Deck puxa ar pela grade traseira e expulsa pela grade superior.
- Bloquear entradas ou saídas de ar quebra o fluxo e provoca throttling em segundos sob carga.
- Poeira acumulada nas aletas age como isolante e obstrução, reduzindo a vazão ao longo do tempo.

## Exercícios

1. Identifique fisicamente as grades de entrada e saída de ar do seu Deck. Descreva o trajeto completo do ar.
2. Com `sensors` aberto, jogue por 5 minutos e depois cubra a grade traseira com a mão por 30 segundos. O que acontece com a temperatura e o RPM?
3. Acenda uma lanterna contra a grade traseira e observe se as aletas do dissipador estão visíveis e limpas. Descreva o que vê.
4. Compare a temperatura de regime jogando na vertical (grade para cima) e deitado sobre uma superfície. Há diferença mensurável?
5. **Desafio.** Explique, usando o conceito de heat pipe e condução, por que um Deck com pasta térmica ressecada esquenta em idle mas não melhora mesmo com a ventoinha a 100%. Onde exatamente o gargalo se forma?