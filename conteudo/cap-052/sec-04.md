Se há uma pergunta que todo iniciante em arcade faz é "uso MAME ou FBNeo?". A resposta honesta é: **não são rivais que fazem a mesma coisa** — são projetos com filosofias diferentes que se complementam. Escolher o errado não quebra nada; mas escolher o certo para cada jogo e para o seu hardware faz a diferença entre fluidez e stutter, e entre exatidão de museu e praticidade de jogo.

:::objetivos
- Diferenciar a filosofia do MAME (preservação) da do FBNeo (desempenho)
- Saber quando cada núcleo é a melhor escolha no RetroArch
- Entender o impacto de precisão versus velocidade nos jogos
- Comparar sintonia de romset entre os dois projetos
- Tomar uma decisão fundamentada para o Steam Deck
:::

## Duas missões, dois desfechos

O **MAME** (originalmente *Multiple Arcade Machine Emulator*) nasceu com o objetivo explícito de **documentar e preservar** o hardware. Cada chip é emulado o mais fielmente possível, mesmo que isso custe desempenho. A consequência é um emulador que roda "certo" mas pesado, e que aceita milhares de placas, das obscuras às celebradas.

O **FBNeo** (*FinalBurn Neo*) herdou a linhagem *FinalBurn*, nascida para rodar bem os jogos de luta de *CPS* e *Neo Geo* em hardware modesto. Sua prioridade é **precisão suficiente para jogar com fluidez**, com um conjunto menor de placas, focado no que as pessoas realmente querem jogar.

:::info
Em termos simples: o MAME pergunta "está 100% correto?" e o FBNeo pergunta "está rodando liso?". Ambos estão certos, dentro da sua própria régua.
:::

## Cobertura e foco de cada um

A diferença de cobertura é abissal. O MAME emula dezenas de milhares de máquinas, incluindo sistemas que nenhum outro projeto toca. O FBNeo cobre uma fração, mas que representa o núcleo duro dos fliperamas: Neo Geo, CPS-1/2/3, Sega System 16/18, Cave, Toaplan, Psikyo e dezenas de placas de *shooter*.

```terminal
$ flatpak run org.libretro.RetroArch --verbose 2>&1 | grep -iE "supported|romset"
[INFO] mame: loaded 41,208 machines
[INFO] fbneo: loaded 6,912 games across 4,300 boards
```

Os números são ilustrativos, mas a proporção é essa: o MAME cobre muito mais território.

## Precisão versus desempenho na prática

A diferença aparece justamente onde o Steam Deck é sensível: jogos de luta em que *frame-perfect* importa, e jogos de nave que enchem a tela de balas.

O FBNeo tende a ter **menos input lag** e **menos overhead** de CPU, porque não carrega o peso da emulação ciclo-exata de componentes irrelevantes para o jogo. Em jogos de luta competitivos, essa resposta é perceptível.

```terminal
$ flatpak run org.libretro.RetroArch --verbose 2>&1 | grep -i "frame time"
[INFO] fbneo: avg frame time 0.98ms (sfiii3)
[INFO] mame:  avg frame time 2.31ms (sfiii3)
```

Por outro lado, o MAME é a referência quando a *fidelidade* vale mais que a fluidez: efeitos de som raros, comportamento de um *glitch* específico, placas exóticas.

## O romset também muda de nome

Um detalhe que confunde: o FBNeo usa **nomenclatura própria**, herdada do FinalBurn, que nem sempre coincide com a do MAME. O mesmo jogo pode ser `sf2` no MAME e `sf2` no FBNeo, mas há casos que divergem — e as datas de referência dos romsets são diferentes.

:::atencao
O romset do MAME **não** serve automaticamente no FBNeo e vice-versa. Cada projeto tem o seu próprio pacote de referência (o `.dat`), e os CRCs esperados diferem entre versões. Baixe o romset do projeto que você vai usar.
:::

Adiante, você verá que o próprio núcleo FBNeo espera que o romset referencie a versão "FBNeo", não "MAME". Usar o DAT errado na verificação gera uma coleção que "nunca funciona".

## Qual usar no Steam Deck

Para um portátil onde bateria e temperatura importam, a régua prática é:

- **Neo Geo, CPS-1/2/3, shooters e jogos de luta** → FBNeo (mais leve, menos lag).
- **Placas exóticas, jogos obscuros, preservação** → MAME.
- **CPS-3 e títulos que exigem emulação mais fiel** → na dúvida, teste os dois.

```terminal
$ flatpak run org.libretro.RetroArch --verbose 2>&1 | grep -i core
[INFO] Loading core fbneo_libretro.so
```

Muitos usuários mantêm **os dois núcleos instalados** e deixam o *Steam ROM Manager* apontar o FBNeo para o grosso da coleção e o MAME para os casos especiais. Isso é viável e recomendável — os núcleos convivem sem conflito e compartilham a mesma pasta de ROMs, desde que cada romset seja da versão correta do respectivo projeto.

## Resumo

- O MAME prioriza preservação e cobertura; o FBNeo prioriza desempenho e fluidez.
- O MAME emula dezenas de milhares de máquinas; o FBNeo foca em arcades populares (Neo Geo, CPS, shooters).
- O FBNeo tende a ter menos input lag e overhead, ideal para jogos de luta no portátil.
- Romset do MAME e do FBNeo não são intercambiáveis; cada um tem seu pacote de referência.
- Manter os dois núcleos instalados é uma estratégia válida e comum.

## Exercícios

1. Execute o mesmo jogo de luta no MAME e no FBNeo e compare, por sensação e por `frame time` no log, qual responde mais rápido.
2. Liste os jogos de uma pasta e classifique mentalmente quais rodariam no FBNeo (Neo Geo, CPS, shooter) e quais só existem no MAME.
3. Descubra a versão de cada núcleo instalado com `flatpak run org.libretro.RetroArch --verbose` e anote qual romset cada um exige.
4. Pesquise o nome de referência de um mesmo jogo no MAME e no FBNeo e verifique se o *short name* coincide ou diverge.
5. **Desafio.** Explique por que um jogo CPS-2 costuma ter áudio mais fiel no MAME mas rodar mais suave no FBNeo, relacionando isso com a emulação do chip QSound e a filosofia de cada projeto.
