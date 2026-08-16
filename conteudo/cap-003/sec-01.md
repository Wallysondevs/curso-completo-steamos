Antes de existir uma loja, uma plataforma de distribuição ou um sistema operacional baseado em Linux, existiu uma empresa de jogos que vendia cópias físicas em caixas de papelão. A Valve não nasceu como a "dona do Steam": nasceu em 1996, em Kirkland, Washington, fundada por dois ex-funcionários da Microsoft, Gabe Newell e Mike Harrington. Entender essa origem importa porque quase todas as decisões que levariam ao Steam Deck — e ao SteamOS — vêm de uma mesma tensão: uma desenvolvedora que queria controlar a própria distribuição.

:::objetivos
- Entender a origem da Valve e o contexto de seus fundadores
- Conhecer a engine GoldSrc e o papel de *Half-Life* na consolidação da empresa
- Localizar as datas-chave da Valve antes do lançamento do Steam
- Reconhecer a cultura de trabalho diferenciada da Valve como pano de fundo estratégico
:::

## Fundadores vindos da Microsoft

Gabe Newell passou 13 anos na Microsoft, onde trabalhou nas três primeiras versões do Windows. Mike Harrington, que co-fundou a Valve e saiu em 2000, também vinha de lá. Os dois juntaram economias e o conhecimento de como uma empresa grande lança software, e fizeram a aposta oposta: uma estrutura enxuta, sem gerentes formais, com foco absoluto em um único produto por vez.

Essa origem explica duas coisas que voltam a aparecer em toda a história da empresa. Primeiro, a Valve entende de plataformas e sistemas operacionais por dentro — o DNA de "dona de plataforma" está aí desde o dia um. Segundo, a empresa sempre quis fugir do modelo que a própria Microsoft representava: algo fechado, lento e controlado de fora. Essa vontade de independência é o fio que liga *Half-Life* ao Steam, ao SteamOS e ao Deck.

## A engine GoldSrc e o motor do sucesso

O primeiro jogo da Valve nasceu sobre uma engine licenciada da id Software — a base do *Quake* — que a Valve modificou profundamente até rebatizá-la de **GoldSrc**. Em 1998 saiu *Half-Life*, um marco que misturava narrativa em primeira pessoa com física e inteligência artificial de inimigos, e que virou sinônimo de "jogo que respeita a inteligência do jogador".

*Half-Life* vendeu milhões de cópias e deu à Valve caixa suficiente para fazer escolhas ousadas. A GoldSrc ainda alimentaria *Counter-Strike*, *Team Fortress Classic* e *Day of Defeat* — todos nascidos como modificações feitas pela comunidade e depois "adotados" pela Valve, num movimento que revelava outra característica permanente da casa: enxergar a comunidade como parceira, não como simples consumidora.

```text
Linha do tempo da Valve antes do Steam
─────────────────────────────────────────────────────
1996  Fundação da Valve por Gabe Newell e Mike Harrington
1998  Half-Life (engine GoldSrc) — sucesso mundial
1999  Counter-Strike surge como mod da comunidade
2000  Mike Harrington deixa a empresa
2002  Valve inicia o desenvolvimento interno do Steam
2003  Steam é lançado junto ao Counter-Strike 1.6
```

## A cultura do "flat structure"

A Valve ficou conhecida por uma estrutura horizontal: sem chefes, sem organograma, com os funcionários escolhendo em qual projeto trabalhar. No *employee handbook* que a empresa publicou, a comparação usada era a de uma empresa com "mesas com rodinhas", onde as pessoas literalmente se movem para onde o trabalho está. Essa liberdade produz tanto inovação quanto lentidão — projetos podem morrer por falta de tração interna, e outros, como o próprio Steam, podem sair do zero por iniciativa de pessoas que viram uma oportunidade.

Para o propósito deste curso, o que importa é a consequência estratégica: uma empresa assim não precisa convencer uma hierarquia para entrar em hardware, em Linux ou em realidade virtual. Basta que algumas pessoas decidam que aquilo vale a pena. É essa frouxidão organizacional que permitiu, anos depois, que a Valve apostasse ao mesmo tempo em Steam Machines, Steam Controller e na preparação do terreno para o Deck.

:::nota
O *handbook* da Valve ("Handbook for New Employees") circulou amplamente pela internet a partir de 2012 e virou leitura obrigatória em cursos de cultura organizacional. A ideia central é que a ausência de gerentes aumenta a agilidade, mas transfere para cada pessoa toda a responsabilidade de decidir no que não trabalhar.
:::

## De desenvolvedora a dona de plataforma

A passagem de "fabricante de jogos" para "operadora de loja e plataforma" não foi um plano traçado em 1996. Ela foi praticamente forçada pelas dores da distribuição de software na virada do século. Quando a Valve lançava uma atualização de *Counter-Strike*, ela precisava negociar com os portais de download, pagar por banda e ainda lidar com a fragmentação de versões entre os jogadores. O multiplayer online sofria com isso: se uma parte da base rodava uma versão antiga, as partidas quebravam.

É aqui que nasce o Steam, cujo primeiro papel não foi vender jogos, e sim **atualizar jogos automaticamente**. A ideia de uma loja veio depois, sobre essa infraestrutura de atualização e autenticação. Entender essa ordem inverte a narrativa comum e esclarece por que, duas décadas depois, o SteamOS carrega no nome a mesma marca: para a Valve, o Steam sempre foi mais infraestrutura do que vitrine.

:::dica
Ao estudar a história da Valve, lembre-se da regra que vale para quase toda empresa de tecnologia: o grande produto raramente nasce como grande produto. O Steam nasceu como um atualizador para resolver um problema operacional de *Counter-Strike*.
:::

## A semente que virou plataforma

É instrutivo fechar este recorte conectando o passado ao presente. A empresa que fundou Gabe Newell hoje tem seu próprio sistema operacional, e o nome da empresa aparece espalhado pelo SteamOS. No terminal, isso é visível em qualquer instalado padrão:

```terminal
$ steamcmd +quit
Redirecting stderr to '/home/deck/Steam/logs/stderr.txt'
[  0%] Checking for available updates...
[----] Verifying installation...
Steam Console Client (c) Valve Corporation - version 1738026274
-- type 'quit' to exit --
Loading Steam API...OK
```

O `steamcmd` é o "Console Client" da Valve — uma versão do Steam sem interface gráfica, usada para administrar servidores e automatizar downloads. Ele está disponível no SteamOS e em qualquer Linux, e carrega no rodapé a assinatura que remete à origem: "Valve Corporation". É o mesmo software que, trinta anos antes, foi imaginado como um simples atualizador de *Counter-Strike*.

## Resumo

- A Valve foi fundada em 1996 por Gabe Newell e Mike Harrington, ex-Microsoft.
- *Half-Life* (1998), sobre a engine GoldSrc, consolidou financeiramente a empresa.
- A GoldSrc também alimentou *Counter-Strike*, *Team Fortress Classic* e *Day of Defeat*.
- A cultura "flat" da Valve permitiu apostas simultâneas em distribuição, hardware e Linux.
- O Steam nasceu como atualizador automático de jogos, não como loja.

## Exercícios

1. Escreva em três frases a relação entre a origem da Valve na Microsoft e sua obsessão por controlar a própria distribuição.
2. Liste os jogos que surgiram como modificações da comunidade e foram adotados pela Valve, explicando por que esse padrão foi importante.
3. Pesquise o ano de lançamento de *Half-Life 2* e associe-o ao reforço do Steam como plataforma obrigatória.
4. Explique, com suas palavras, por que dizer "o Steam nasceu como loja" é historicamente impreciso.
5. **Desafio.** Compare a estrutura organizacional "flat" da Valve com a de uma empresa tradicional de jogos e escreva um parágrafo sobre como essa diferença pode ter acelerado a entrada da Valve em hardware (Steam Machines, Deck).
