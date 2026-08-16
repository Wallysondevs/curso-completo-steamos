FPS é o número que todo mundo fala, mas frametime é o número que de fato explica a fluidez. Um jogo pode exibir "60 FPS" na média e ainda assim parecer engasgado, porque a média esconde os picos de demora em quadros isolados. Aprender a ler os dois juntos — e a enxergar o que cada um revela — é o que separa um diagnóstico correto de uma conclusão apressada.

:::objetivos
- Entender a relação matemática entre FPS e frametime
- Ler os valores de FPS e frametime no overlay
- Reconhecer quando a média de FPS esconde um problema de fluidez
- Usar o frametime para identificar engasgos isolados
:::

## Por que frametime conta a verdade

FPS é uma média por segundo: soma-se quantos quadros foram entregues em um segundo e divide-se. O problema é que "60 FPS" pode significar sessenta quadros espaçados uniformemente (cada um a 16,7 ms do anterior) — perfeito — ou cinquenta e nove quadros rápidos e um único quadro que levou 200 ms para sair. A média continua dando perto de 60, mas o seu olho sentiu o travão daquele quadro de 200 ms.

Frametime é a medida por quadro: quanto tempo cada frame individual levou. É a granularidade que falta à média. Por isso a regra prática do capítulo: **confie no FPS para ter o panorama, no frametime para enxergar o detalhe**.

```terminal
$ # Frametime alvo para taxas comuns:
$ #   60 FPS  ->  16.7 ms por quadro (uniforme)
$ #   40 FPS  ->  25.0 ms por quadro
$ #   30 FPS  ->  33.3 ms por quadro
$ # Um quadro de 200 ms numa sequência de 60 FPS = "travada" perceptível
```

Quando o frametime é estável, o gráfico do nível 4 no overlay parece uma linha reta com leves ondulações. Quando há engasgos, a linha desenha espinhos — picos verticais que sobem de repente e voltam. Um espinho de 100 ms corresponde a uma sensação clara de parada, um "hiccup" que dura uma fração de segundo mas o olho registra.

## Lendo os dois números no overlay

Nos níveis 1 e 2, o overlay mostra o FPS em destaque. No nível 2 em diante, o frametime aparece logo abaixo ou ao lado, geralmente na forma `17.2 ms`. Os dois andam de mãos dadas, e você deve lê-los sempre juntos.

```terminal
$ # Exemplo de leitura do overlay em tres instantes diferentes:
$ # instante A: FPS 60 | frametime 16.7 ms   -> saudavel, uniforme
$ # instante B: FPS 59 | frametime 17.0 ms   -> saudavel, leve variacao
$ # instante C: FPS 58 | frametime 82.0 ms   -> travada isolada, media alta
```

No instante C, o FPS caiu só de 60 para 58, mas o frametime saltou para 82 ms — mais de quatro vezes o alvo. Foi exatamente o tipo de engasgo que a média de FPS mascara. Se você estivesse olhando só o FPS, acharia que tudo está bem; olhando o frametime, viu o problema real.

:::nota
Por que os jogos "seguram" um frame de 82 ms? Causas comuns incluem: carregamento assíncrono de textura no meio da cena, compilação de *shader* na hora (o famoso "stutter de compilação"), ou a CPU ocupada com outra tarefa exatamente naquele instante. O frametime aponta *onde* e *quando*; a causa você investiga com as outras métricas.
:::

## O stutter de compilação de shader

Um dos espinhos de frametime mais comuns no Steam Deck é a compilação de *shader* em tempo real. Shaders são pequenos programas que rodam na GPU para desenhar superfícies, luzes e efeitos. Muitos jogos os compilam na primeira vez que um efeito aparece — e essa compilação congela o frame.

```terminal
$ # Sintoma classico: frametime estavel, depois um espinho de 100-300 ms
$ # justamente quando um efeito novo aparece na tela (explosao, agua, reflexo)
$ # FPS 60 | frametime 16.7 ms   (antes)
$ # FPS 55 | frametime 215.0 ms  (durante a compilacao do shader) <-- espinho
$ # FPS 60 | frametime 16.8 ms   (depois, volta ao normal)
```

Esse tipo de engasgo tende a desaparecer depois que o *shader cache* está completo — por isso jogos que a Steam pré-compila shaders rodam mais lisos na segunda execução. Quando você vê espinhos que diminuem com o tempo de jogo, a causa quase sempre é compilação de shader, não falta de hardware.

:::dica
Para distinguir stutter de compilação de shader de um gargalo real de hardware, observe o padrão: o de compilação é **esporádico e some** (o jogo fica liso depois de um tempo); o gargalo de hardware é **constante e não some** (o frametime fica alto o tempo todo numa cena pesada). Esse teste de "melhora ou persiste?" é rápido e muito revelador.
:::

## Quando o FPS é suficiente

Nem sempre você precisa do frametime. Para decidir rapidamente se uma configuração gráfica vale a pena — por exemplo, baixar de "Alto" para "Médio" — o FPS médio é a métrica certa, porque é barato de ler e compara de forma direta.

```terminal
$ # Teste rapido de configuracao: rodar a mesma cena e comparar o FPS
$ # qualidade Alta      -> FPS 34
$ # qualidade Media     -> FPS 52
$ # qualidade Baixa     -> FPS 61
$ # conclusao: Media entregou +18 FPS com perda visual aceitavel
```

Nesse cenário, o frametime entra como confirmação: se em "Média" o FPS subiu para 52 mas o frametime continua espinhando, o ganho de média não compensou — o jogo continua engasgando. Média alta com frametime irregular é o pior dos mundos: você acha que melhorou, mas a experiência segue ruim.

## Resumo

- FPS é uma média por segundo; frametime é o tempo de cada quadro individual.
- `FPS = 1000 / frametime`: 60 FPS = 16,7 ms, 30 FPS = 33,3 ms por quadro.
- Um pico isolado de frametime (ex.: 82 ms) é uma travada que o FPS médio esconde.
- O stutter de compilação de shader é esporádico e desaparece; o gargalo de hardware é constante.
- Use FPS para comparar configurações e frametime para diagnosticar fluidez.

## Exercícios

1. Num jogo estável, anote FPS e frametime por 30 segundos. Confirme que os valores respeitam a fórmula `1000 / FPS`.
2. Procure um momento de travada e registre o frametime exato do pico. O FPS médio mudou muito naquele instante?
3. Rode uma cena pesada e compare FPS em três níveis de qualidade gráfica, anotando também o frametime de cada um.
4. Identifique se um engasgo é de compilação de shader ou de gargalo: observe se ele some ou persiste após alguns minutos.
5. **Desafio.** Usando o que aprendeu sobre gamescope na seção 1, explique por que medir frametime no nível do compositor pode capturar engasgos que o contador do próprio jogo não mostra.
