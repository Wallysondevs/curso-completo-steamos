Nem todo jogo clássico saiu do forno perfeito. Muitos chegaram truncados, mal traduzidos ou incompletos, e coube aos fãs terminarem o serviço. O Steam Deck, por rodar RetroArch, Dolphin, mGBA e afins como cidadãos de primeira classe, herda de graça tudo o que essas comunidades construíram em décadas: traduções de fãs, ROM hacks, patches de qualidade de vida e uma cena homebrew vibrante.

:::objetivos
- Diferenciar ROM hack, tradução de fãs, patch e homebrew
- Entender o papel do checksum (ROM "limpa"/headered/headless) no patching
- Localizar as pastas onde RetroArch e EmuDeck guardam ROMs e patches
- Escolher a ferramenta certa para cada formato de patch
- Reconhecer a diferença entre patching "em disco" e "em tempo de execução" (softpatching)
:::

## O que significa cada termo

A comunidade de emulação tem um vocabulário específico que vale a pena fixar antes de mergulhar:

- **ROM hack**: qualquer modificação da imagem original do jogo. Pode ser uma correção simples (bugfix), uma reformulação (balanceamento), um conteúdo novo (fases, personagens) ou uma conversão de idioma.
- **Tradução de fãs (fan translation)**: um tipo específico de ROM hack cujo único objetivo é trocar o idioma do jogo, normalmente injetando fontes e texto traduzido no ROM.
- **Patch**: o arquivo que aplica a modificação. Em vez de distribuir o ROM inteiro modificado (o que seria pirataria), o autor distribui apenas as *diferenças* entre o ROM original e o modificado, num formato como `.ips`, `.ups`, `.bps` ou `.xdelta`.
- **Homebrew**: software novo, escrito do zero por fãs, para rodar num console. Pode ser um jogo, um utilitário, um emulador ou um clone. Não é derivado de nada — é criação original.

## Por que patching usa checksum

Um patch é construído contra uma versão *exata* do ROM. Se o seu dump diferir em um único byte, o patch falha ou gera um ROM corrompido. Por isso, as distribuições de patches costumam especificar o hash esperado:

```terminal
$ sha1sum SuperMarioKart.sfc
7f7b51c9c9d11a5f0f7f8a9bd0e9f2e8e3e8a2a1  SuperMarioKart.sfc
```

As ferramentas de patching multiformato verificam o checksum internamente e avisam quando o ROM não corresponde. Cabe a você garantir que o ROM de entrada seja o "bom": a versão correta da região, sem header, sem formato interleaved.

## ROM "limpa", headered e headless

Este é o primeiro obstáculo de quem começa: o mesmo jogo pode existir em três variantes de arquivo que diferem em bytes mas representam a mesma coisa.

- **Headered**: o arquivo tem um cabeçalho (ex.: 512 bytes em SNES/SFC, 16 bytes em NES) antes do ROM propriamente dito. Muitos dumps antigos vinham assim.
- **Headless (limpo)**: só o ROM, sem cabeçalho. É o formato que bancos como No-Intro padronizam.
- **Interleaved / byte-swapped**: alguns dumps antigos de cartuchos vêm com bytes trocados de ordem, fruto do hardware de dumping.

Patches quase sempre exigem o ROM *headless* e com o checksum do banco No-Intro. Se o patch pedir "Smurfs (USA) (Rev 1) [b1]" e você tiver a versão errada, não vai funcionar.

## Onde as coisas vivem no EmuDeck/RetroArch

Conhecer a árvore de diretórios evita horas de "onde coloquei isso?":

```terminal
$ ls ~/Emulation/roms/
amiga/   gba/   gb/   gc/   n64/   nes/   snes/    switch/ ...
```

Cada console tem sua pasta, e dentro dela os ROMs. Os patches não precisam viver junto do ROM — você pode manter um diretório separado:

```terminal
$ mkdir -p ~/Emulation/patches ~/Emulation/homebrew
```

O EmuDeck centraliza todas as bios, saves e saves-states em `~/Emulation/bios`, `~/Emulation/saves` e `~/Emulation/states`, respectivamente. Patches aplicados em disco geram um *novo* ROM que você mesma nomeia e organiza.

## Patching em disco vs. softpatching

Existem duas filosofias para aplicar um patch:

- **Em disco (hardpatching)**: você gera um arquivo `.gba`/`.sfc`/`.iso` já modificado e guarda na pasta de ROMs. Vantagem: funciona em *qualquer* emulador ou console físico. Desvantagem: gera duplicatas e dificulta reverter.
- **Softpatching (runtime)**: o emulador aplica o patch em memória, na hora de carregar, sem tocar no ROM original. O RetroArch suporta isso nativamente — basta colocar o `.ips`/`.bps` com o mesmo nome do ROM. Vantagem: ROM original intacto, múltiplos patches alternáveis. Desvantagem: só funciona em emuladores que implementam isso.

```terminal
## Softpatching no RetroArch: mesmo nome, extensão .ips/.bps ao lado do ROM
$ ls ~/Emulation/roms/gba/
Pokemon\ Emerald\ (USA).gba
Pokemon\ Emerald\ (USA).ips
```

## Pontos-chave

- ROM hack modifica o jogo; patch é o arquivo de diferenças; homebrew é software original.
- Todo patch exige o ROM de entrada exato (checksum No-Intro, headless).
- EmuDeck organiza ROMs, bios, saves e states em `~/Emulation/`.
- Softpatching mantém o ROM original intacto e permite alternar patches.

## Exercícios

1. Baixe um ROM público/abandonware legal, calcule seu `sha1sum` e compare com o checksum listado no banco No-Intro.
2. Identifique se um ROM de SNES que você tem é headered ou headless (cheque o tamanho do arquivo: múltiplo limpo vs. +512 bytes).
3. Copie um ROM junto de um `.ips` de mesmo nome e confirme que o RetroArch aplica o softpatch ao carregar.
4. Crie a estrutura `~/Emulation/patches` e `~/Emulation/homebrew` e mova seus arquivos de patch para lá.
5. **Desafio.** Pegue um ROM com header, remova-o (ferramenta de escolha), recalcule o hash e aplique um patch que exigia o ROM headless.
