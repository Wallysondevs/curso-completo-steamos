Chegou a hora de decidir: Lutris, Heroic ou Bottles? A resposta honesta é "depende", mas não é arbitrária — ela sai de duas perguntas: de onde vêm seus jogos e quanto controle fino você quer. Esta seção monta um comparativo prático, ferramenta por ferramenta, e termina com uma recomendação por cenário, para você parar de pular entre os três e instalar só o que resolve o seu caso.

:::objetivos
- Comparar Lutris, Heroic e Bottles em escopo, interface e controle
- Escolher a ferramenta certa para cada cenário de jogo
- Entender que as três podem coexistir e se complementar
- Reconhecer trade-offs de complexidade versus simplicidade
- Aplicar uma regra de decisão simples e reproduzível

:::

## As três, lado a lado

Antes de qualquer nuance, uma visão de cima:

| Dimensão | Lutris | Heroic | Bottles |
|---|---|---|---|
| Escopo | Qualquer fonte (GOG, Epic, itch.io, emuladores, local) | GOG e Epic apenas | Qualquer executável Windows, sem loja |
| Interface | Completa, mais opções | Limpa, pensada em controller | Detalhada, voltada a prefixo |
| Foco | Biblioteca + scripts | Biblioteca + instalação fácil | Prefixo Wine granular |
| Runner | Central, escolhido por jogo scriptado | Propriedade do jogo | Propriedade da garrafa |
| Melhor para | Fontes diversas, controle fino | GOG/Epic no Deck | Programas desktop, prefixos de referência |

A coluna que resume tudo é "Escopo". Cada ferramenta escolheu um recorte diferente, e as recomendações abaixo são quase consequência direta disso.

## Onde o Lutris vence

O Lutris ganha quando nenhuma das outras duas atende. Se você tem jogos da itch.io, instaladores `.exe` avulsos, ROMs ou quer um lugar só para emuladores ao lado de jogos de PC, ele é a única das três que abraça tudo isso num mesmo catálogo.

```terminal
$ lutris --list-games
Name              Runner               Installed
----------------------------------------------------
Hollow Knight     wine                 Yes
Itch game A       linux                Yes
NES classics      libretro             Yes
```

A listagem revela o alcance: um jogo nativo (`linux`), um de Windows (`wine`) e um de emulador (`libretro`) convivendo na mesma biblioteca. Heroic e Bottles não fazem isso.

:::dica
Se você já tem uma biblioteca grande e diversa, o Lutris costuma pagar o investimento de aprendizado. Quem só tem jogo de GOG e Epic, raramente precisa da complexidade dele — e o Heroic resolve com metade do atrito.
:::

## Onde o Heroic vence

O Heroic é imbatível no seu recorte. Para GOG e Epic, ele oferece a experiência mais curta do "baixar e jogar", com arte de capa, atualizações e integração "Add to Steam" que o Lutris reproduz com mais esforço. No Steam Deck, a ergonomia de controller e o gerenciamento de Proton por jogo fazem diferença no dia a dia.

```terminal
$ flatpak run com.heroicgameslauncher.hgl list
Games installed:
  Hollow Knight         epic     Proton - GE-Proton8-25
  Cyberpunk 2077        gog      Proton - GE-Proton8-27
```

O ponto sutil é que o Heroic também gerencia bem o **download** das lojas — retomada de downloads, cache e offline installers da GOG — áreas em que o Lutris patina. Para quem vive de GOG e Epic, não há muita discussão.

## Onde o Bottles vence

O Bottles não compete por biblioteca; compete por **controle de prefixo**. Quando você precisa ajustar uma dependência específica, testar uma versão de runner, ou rodar um programa de desktop Windows que não é jogo, ele é a ferramenta certa — e as outras duas nem entram na disputa.

```terminal
$ bottles --list
Name             Environment  Runner      Programs
----------------------------------------------------
contabilidade    application  wine-9.0    1
jogo-antigo      gaming       soda-7.0    3
```

A saída mostra o que as outras ferramentas não mostram: o número de **programas** dentro de cada garrafa. Isso é a assinatura do Bottles — ele trata o prefixo como um recipiente onde vários executáveis moram, não como um artefato invisível de um jogo.

:::nota
O Bottles é frequentemente usado junto com Lutris ou Heroic, não no lugar deles. Você instala o jogo no Heroic e usa o Bottles para abrir e ajustar o prefixo que o Heroic criou. São papéis complementares, não concorrentes.
:::

## Regra de decisão em três passos

Para fechar, uma heurística que cobre a maioria dos casos reais:

1. **Seus jogos vêm de GOG/Epic?** Use o Heroic. É o caminho mais rápido e confortável no Deck.
2. **Você tem fontes fora de GOG/Epic (itch.io, instaladores, emuladores)?** Use o Lutris para concentrar tudo.
3. **Precisa ajustar um prefixo, rodar programa desktop ou construir um prefixo de referência?** Use o Bottles, sozinho ou apontando para o prefixo de outra ferramenta.

:::exemplo
O setup de Ana no Deck: Heroic como launcher principal (GOG + Epic), Lutris só para a coleção de itch.io e um emulador, e Bottles para dois programas de trabalho e para depurar um jogo teimoso. As três coexistem, cada uma no seu papel, sem disputa.
:::

## Veredito por cenário

- **Só GOG/Epic, jogar rápido** → Heroic.
- **Fontes variadas, uma biblioteca só** → Lutris.
- **Programas Windows ou prefixo sob medida** → Bottles.
- **Duas das anteriores juntas** → combine; as ferramentas não se atropelam.

Nenhuma das três é "a melhor" em abstrato. A melhor é a que cobre o seu caso com menos complexidade sobrando. Instale o mínimo necessário e só adicione a próxima quando um cenário não atendido aparecer.

## Resumo

- Lutris vence em escopo: concentra GOG, Epic, itch.io, emuladores e jogos locais numa biblioteca.
- Heroic vence em ergonomia para GOG/Epic, com download robusto e integração ao Steam.
- Bottles vence em controle de prefixo e em programas de desktop Windows.
- As três podem coexistir e se complementar; Bottles frequentemente ajusta prefixos do Heroic.
- Regra de decisão: GOG/Epic → Heroic; fontes diversas → Lutris; prefixo/desktop → Bottles.
- Complexidade sobrando é custo: instale o mínimo que resolve o seu cenário.

## Exercícios

1. Monte a tabela comparativa acima numa folha e preencha a coluna "Escopo" com suas próprias palavras para cada ferramenta.
2. Liste seus jogos (Steam à parte) e classifique cada um pelo cenário: GOG/Epic, outra fonte, ou programa Windows. Conte quantos caem em cada.
3. Com base na regra de decisão, decida qual(is) ferramenta(s) instalar e explique em duas frases por quê.
4. Instale Heroic e Bottles juntos e confirme que os jogos do Heroic aparecem como prefixos que o Bottles consegue abrir (tela "add external bottle" ou similar).
5. **Desafio.** Reproduza o setup da Ana em resumo: Heroic para um jogo GOG/Epic, Lutris para um jogo itch.io, Bottles para um programa desktop. Num parágrafo, justifique por que nenhuma ferramenta sozinha cobriria os três.
