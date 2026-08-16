Se traduções são o hack "invisível" que deixa o jogo legível, os ROM hacks completos são o outro extremo: modificações profundas que mudam mecânica, balanceamento, conteúdo e até o gênero do jogo. O Steam Deck é uma máquina excelente para revisitá-los, porque muitos hacks consertam justamente o que o envelhecimento deixou áspero.

:::objetivos
- Classificar ROM hacks por tipo (bugfix, improvement, overhaul, total conversion)
- Reconhecer hacks que dependem de expansão de ROM (mais memória)
- Aplicar hacks que exigem pré-requisitos em cadeia
- Entender o impacto no save (compatibilidade de save files)
- Usar randomizers e seus formatos de saída específicos
:::

## A taxonomia dos hacks

- **Bugfix**: corrige glitches e bugs do original. Ex.: destravamento de softlocks, correção de save corrompido.
- **Improvement / Quality-of-life**: adiciona conveniências — corrida (run), mapas, "save em qualquer lugar", tradução de menus, correção de FOV.
- **Rebalance**: mexe em números — dano, dinheiro, dificuldade — para reequilibrar o jogo.
- **Overhaul**: reformula sistemas inteiros. Ex.: *Final Fantasy VI: Brave New World* (atributos e magias redesenhados), *Pokémon Crystal Clear* (mapa aberto).
- **Total conversion**: cria um jogo novo sobre a engine original. Ex.: as dezenas de "hacks de Pokémon" com nova região e história.

## Hacks com expansão de ROM

Alguns hacks adicionam tanto conteúdo que não cabem no cartucho original, então expandem o ROM para um tamanho maior (muitas vezes usando mapas de memória alternativos). O sintoma típico é um ROM de saída com tamanho incomum:

```terminal
$ ls -la rom-modificado.gba
-rw-r--r-- 1 deck deck 33554432  rom-modificado.gba   # 32MB, maior que o original de 16MB
```

Isso normalmente não é problema no emulador (que aloca RAM conforme o header), mas pode quebrar em hardware físico ou flashcarts antigos. No Deck, via emulador, funciona sem ressalvas.

## Hacks em cadeia

Muitos hacks presumem que outro hack já foi aplicado antes. O README descreve a cadeia: "aplicar base fix → depois sprite fix → depois este hack". Quebrar a ordem gera ROM corrompido ou crash.

```terminal
$ flips --apply base-fix.bps "Pokemon Emerald (USA).gba" etapa1.gba
$ flips --apply sprite-fix.bps etapa1.gba etapa2.gba
$ flips --apply meu-hack.bps etapa2.gba "Pokemon Emerald Final.gba"
```

Guarde as etapas intermediárias comentadas, ou automatize num script (como no capítulo 03) para não se perder.

## Compatibilidade de saves

Um ponto frequentemente negligenciado: o save de um ROM hack raramente é compatível com o original, ou com outros hacks. Alguns hacks usam o mesmo formato de save (dá para reaproveitar), outros mudam a estrutura (save corrompido).

Regra prática: **use uma pasta de saves separada para cada hack**, ou ao menos não misture states com saves. O EmuDeck permite configurar diretórios de save por emulador — e, no RetroArch, cada ROM tem seus saves nomeados de forma independente, o que já ajuda.

```terminal
$ ls ~/Emulation/saves/gba/
Pokemon\ Emerald\ (USA).sav
Pokemon\ Emerald\ Final.sav     # save do hack, separado
```

## Randomizers

Randomizadores são um caso especial de ROM hack *gerado localmente*: você roda uma ferramenta (muitas vezes em Java ou navegador) que embaralha itens, inimigos, mapas ou progressão, e gera um ROM novo. Exemplos famosos:

- **A Link to the Past Randomizer** (item randomizer)
- **Super Metroid Randomizer**
- **Pokémon randomizers** (encontros, movimentos)
- **Final Fantasy / RPG randomizers** (itens, lojas)

Muitos rodam como `.jar` (Java) ou como página web que entrega o `.sfc`/`.gba` pronto. No Deck, Java está disponível e os randomizers de página produzem um ROM que você só precisa colocar na pasta:

```terminal
## Rodando um randomizer .jar
$ java -jar alttpr.jar --rom "Zelda ALttP (USA).sfc" --seed 123456
$ mv "Zelda ALttP - seed123456.sfc" ~/Emulation/roms/snes/
```

O conceito de "seed" é central: o mesmo seed gera sempre o mesmo jogo, o que permite compartilhar corridas e competições com outros jogadores.

## Verificando integridade pós-hack

Hacks complexos podem ter bugs próprios. Antes de se comprometer a uma run longa, faça um teste rápido:

1. Carregue o ROM e percorra os primeiros minutos de jogo.
2. Confira se há glitches gráficos ou crashes em cenas específicas.
3. Verifique o fórum/página do hack para "known issues".
4. Mantenha o patch source e o ROM base guardados para reaplicar se uma versão nova do hack sair.

## Pontos-chave

- Hacks variam de bugfix a total conversion; leia o README para entender o escopo.
- Expansão de ROM é normal nos emuladores do Deck.
- Cadeias de hacks exigem ordem exata de aplicação.
- Saves de hacks costumam ser incompatíveis entre si e com o original.
- Randomizers geram ROM novo a partir de um seed reproduzível.

## Exercícios

1. Aplique um improvement hack a um jogo de SNES e liste o que mudou na experiência.
2. Aplique uma cadeia de dois hacks na ordem correta e depois propositalmente na ordem errada, observando o que quebra.
3. Separe saves de dois hacks diferentes do mesmo jogo e confirme que não se sobrescrevem no EmuDeck.
4. Gere um ROM aleatorizado com seed fixo e confirme que gerar de novo com o mesmo seed produz um ROM idêntico.
5. **Desafio.** Aplique um fantranslation + um improvement hack que sejam compatíveis entre si (mesma base) e documente a cadeia completa com hashes.
