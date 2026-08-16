O Proton-GE é a estrela, mas não é a única ferramenta que o ProtonUp-Qt gerencia. A mesma interface baixa uma pequena constelação de outras camadas de compatibilidade, cada uma com um nicho específico: Luxtorpeda para ports nativos de motores antigos, Boxtron para jogos DOS via DOSBox, e Roberta para jogos em ScummVM. Este capítulo seria incompleto sem uma volta por elas.

Entender o ecossistema inteiro te ajuda a não usar um martelo GE onde uma chave de fenda resolve melhor. E, tão importante quanto, mostra como gerenciar várias ferramentas diferentes sem virar uma bagunça no disco.

:::objetivos
- Conhecer as ferramentas além do Proton-GE que o ProtonUp-Qt instala
- Entender o nicho de Luxtorpeda, Boxtron e Roberta
- Gerenciar múltiplas builds de múltiplas ferramentas no mesmo diretório
- Escolher a ferramenta certa para cada tipo de jogo
:::

## O que mais o ProtonUp-Qt baixa

No mesmo seletor **Add version** em que você escolheu `GE-Proton9-25`, aparecem outras entradas além das builds GE. Elas são ferramentas de compatibilidade **distintas**, não versões do Proton:

| Ferramenta | Refere-se a | Serve para |
|---|---|---|
| `GE-Proton` | Proton com codecs extras | Jogos de Windows em geral |
| `Luxtorpeda` | Ports e engines nativos Linux | Jogos com reconstrução de engine (ex.: OpenXcom, scummvm) |
| `Boxtron` | DOSBox | Jogos clássicos de MS-DOS |
| `Roberta` | ScummVM | Aventuras point-and-click clássicas |

Todas seguem a mesma mecânica: baixam para `compatibilitytools.d` e são reconhecidas pelo Steam como "ferramentas de compatibilidade". A diferença está no que cada uma coloca para rodar debaixo do jogo.

## Luxtorpeda, Boxtron e Roberta em detalhe

A **Luxtorpeda** não traduz Windows — ela **substitui** o executável original por uma reimplementação nativa do motor. Para jogos cujo motor tem um port open-source maduro (como vários clássicos da era DOS/Windows antiga), isso significa rodar nativo no Linux, sem a camada de tradução do Proton, com ganhos de performance e fidelidade.

O **Boxtron** é uma ponte para o DOSBox, o emulador de MS-DOS. Você aponta ele para um jogo DOS adquirido na Steam e o Steam passa a abrir o DOSBox com configurações sensatas, controles mapeados e saída de áudio ajustada para o Linux, em vez de você configurar tudo à mão.

A **Roberta** faz o mesmo papel para o ScummVM, o motor que roda aventuras clássicas da LucasArts e da Sierra (Monkey Island, King's Quest, etc.). Ela detecta os arquivos do jogo e os alimenta ao ScummVM automaticamente.

:::exemplo
Você comprou um pacote de aventuras DOS dos anos 90 na Steam. Nativamente, o launcher antigo nem abre no Linux. Em vez de quebrar a cabeça com o Proton, você instala Boxtron (para DOS) ou Roberta (para ScummVM), força a ferramenta no jogo, e ele abre já rodando no emulador certo, com o Steam mantendo overlay e saves no lugar.
:::

## Como as ferramentas convivem no disco

Todas compartilham o mesmo diretório e a mesma lógica de nomeação. Depois de instalar algumas, o `compatibilitytools.d` vira um mosaico:

```terminal
$ ls -1 ~/.steam/steam/compatibilitytools.d/
GE-Proton9-25
GE-Proton9-27
Luxtorpeda
Boxtron
Roberta
```

Cada pasta de ferramenta comunitária mantém a estrutura que o Steam espera: o manifesto `compatibilitytool.vdf` e o script que o Steam invoca. Por isso elas aparecem na mesma lista suspensa de compatibilidade, misturadas com as builds do Proton — o Steam não distingue "Proton" de "outra tool", para ele é tudo "ferramenta de compatibilidade".

:::atencao
Ferramentas como Luxtorpeda, Boxtron e Roberta **não são versões do Proton**. Forçá-las num jogo de Windows moderno não vai "melhorar compatibilidade" — vai tentar encaixar o jogo num emulador ou num port que ele não tem, e provavelmente falhar. Use cada uma no seu nicho.
:::

## Gerenciando o conjunto sem se perder

Com várias ferramentas instaladas, a disciplina de nomes e limpeza começa a importar. Algumas orientações que evitam o caos:

- **Uma versão GE recente** + a anterior como reserva é o suficiente; não acumule cinco builds da mesma linha.
- As ferramentas comunitárias **não têm cadência de release** como o GE — baixe uma vez e atualize raramente, quando um jogo específico pedir.
- Anote mentalmente (ou num arquivo) qual jogo usa qual ferramenta, porque o Steam não centraliza essa relação num só lugar.

O comando abaixo dá uma visão consolidada do espaço que cada ferramenta ocupa, útil para decidir o que manter:

```terminal
$ du -sh ~/.steam/steam/compatibilitytools.d/* | sort -h
12M	 Roberta
65M	 Boxtron
80M	 Luxtorpeda
1.1G GE-Proton9-25
1.2G GE-Proton9-27
```

Repare na disparidade: as ferramentas de emulador são minúsculas (dezenas de MB), enquanto as builds GE dominam o disco (gigabytes). É mais um argumento para ser seletivo com o número de versões GE que você mantém — elas são, de longe, as mais caras em espaço.

## Resumo

- O ProtonUp-Qt instala, além do GE, Luxtorpeda, Boxtron e Roberta, todas em `compatibilitytools.d`.
- Luxtorpeda substitui o executável por um port nativo do motor; Boxtron liga ao DOSBox; Roberta, ao ScummVM.
- Para o Steam, todas são "ferramentas de compatibilidade" e aparecem na mesma lista suspensa.
- Essas ferramentas não são versões do Proton e devem ser usadas apenas no seu nicho específico.
- As builds GE pesam gigabytes; as ferramentas de emulador, dezenas de MB.
- Uma build GE recente + uma reserva bastam; acumular várias da mesma linha desperdiça espaço.

## Exercícios

1. No ProtonUp-Qt, abra **Add version** e liste todas as ferramentas que não são builds GE disponíveis para instalação.
2. Instale a Roberta e confirme com `ls ~/.steam/steam/compatibilitytools.d/` que ela foi adicionada ao lado das suas builds GE.
3. Compare o tamanho de todas as ferramentas instaladas com `du -sh ~/.steam/steam/compatibilitytools.d/* | sort -h` e identifique quais dominam o consumo de espaço.
4. Se tiver um jogo DOS ou uma aventura clássica na sua biblioteca, force Boxtron ou Roberta nele e observe o comportamento — ele abre no emulador correto?
5. **Desafio.** Justifique, com base nos tamanhos medidos, por que a recomendação de manter poucas versões GE se aplica ao GE mas quase não se aplica a Luxtorpeda/Boxtron/Roberta. Em seguida, proponha uma "política de retenção" para cada categoria.
