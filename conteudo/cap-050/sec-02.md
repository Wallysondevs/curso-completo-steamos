ROM é um arquivo que representa o conteúdo de um cartucho ou de um disco. O que muita gente não percebe de início é que **o nome da pasta onde a ROM está é o que diz ao emulador de qual sistema ela é** — não o conteúdo do arquivo. Colocar uma ROM de Super Nintendo dentro da pasta de Mega Drive faz o emulador de Mega Drive tentar (e falhar) em abrir um formato que não é o dele. Esta seção ensina a mapear cada sistema para a sua subpasta correta.

:::objetivos
- Entender como o EmuDeck descobre os sistemas a partir dos nomes das subpastas
- Memorizar as subpastas dos sistemas mais comuns
- Conhecer os formatos de arquivo aceitos por cada emulador
- Lidar com ROMs comprimidas e multi-arquivo
- Usar o `file` para identificar o formato real de uma ROM
:::

## Como o Emulator detecta o sistema

Dentro de `Emulation/roms/`, cada sistema tem uma subpasta com um nome convencionado. O EmuDeck (e o Steam ROM Manager, e o EmulationStation) varre essas pastas e, pelo *nome da pasta*, decide qual emulador e qual *core* usar. Por isso os nomes são fixos e não devem ser renomeados.

```terminal
$ ls -1 /run/media/mmcblk0p1/Emulation/roms/
3ds/
dreamcast/
gba/
gc/
genesis/
nds/
nes/
n64/
psx/
ps2/
psp/
snes/
switch/
wii/
```

Esses são os nomes canon. Um pequeno desvio (por exemplo, `snes/` virar `supernintendo/`) faz o sistema sumir da biblioteca — discreto, mas fatal.

## As pastas que você mais vai usar

Vale decorar pelo menos os sistemas que você realmente joga. A tabela relaciona subpasta, console e extensões típicas:

| Subpasta | Sistema | Extensões comuns |
|---|---|---|
| `nes/` | Nintendo (NES) | `.nes` |
| `snes/` | Super Nintendo | `.sfc`, `.smc` |
| `n64/` | Nintendo 64 | `.n64`, `.z64`, `.v64` |
| `gb/`, `gba/` | Game Boy / Advance | `.gb`, `.gbc`, `.gba` |
| `genesis/` | Mega Drive / Genesis | `.md`, `.gen`, `.bin` |
| `psx/` | PlayStation | `.chd`, `.cue`+`.bin`, `.pbp` |
| `ps2/` | PlayStation 2 | `.iso`, `.chd` |
| `gc/`, `wii/` | GameCube / Wii | `.iso`, `.rvz`, `.wbfs` |
| `nds/`, `3ds/` | Nintendo DS / 3DS | `.nds`, `.3ds`, `.cia` |
| `switch/` | Nintendo Switch | `.nsp`, `.xci` |
| `psp/` | PSP | `.iso`, `.cso` |
| `arcade/` | Arcade (MAME/FBNeo) | `.zip` |

:::nota
Os nomes variam um pouco conforme a fonte de ROM. Um dump de SNES pode vir como `.sfc` (formato do aparelho) ou `.smc` (formato de copiadora antiga). O conteúdo é o mesmo; o que importa é a pasta certa.
:::

## Verificando o formato real de um arquivo

Rom uma extensão errada pode estar no lugar certo e mesmo assim falhar. A ferramenta `file` inspeciona o conteúdo em vez do nome:

```terminal
$ file roms/snes/mario.smc
roms/snes/mario.smc: [... ] Super Famicom ROM image
$ file roms/psx/game.bin
roms/psx/game.bin: data
$ file roms/psx/game.cue
roms/psx/game.cue: ASCII text, with CRLF line terminators
```

No terceiro caso, o `game.bin` aparece como `data` — isso é normal: o conteúdo de um CD fica num arquivo genérico `.bin` e a estrutura (faixas, offsets) vive no `.cue` que o acompanha. O emulador precisa dos **dois juntos** para montar o disco.

## Discos multi-arquivo e compressão

Jogos de CD costumam trazer vários arquivos, e há duas conversões que simplificam a vida:

- **CHD** (`MAME Compressed Hunks of Data`): converte um `.cue`/`.bin` (ou vários) em um único `.chd` comprimido, sem perda. É o formato recomendado para PS1, Dreamcast, Saturn e arcade.
- **PBP** (do PSP, formato EBOOT): empacota discos de PS1 em um só arquivo, útil para múltiplos CDs.

```terminal
$ ls -lh roms/psx/
-rw-r--r-- 1 deck deck 612M game.chd
-rw-r--r-- 1 deck deck 3.6M game.cue
-rw-r--r-- 1 deck deck 712M game.bin
```

Repare que, se você deixar o `.cue` e o `.bin` **e** também o `.chd` na mesma pasta, o EmulationStation pode listar o jogo duas vezes. Escolha um formato e apague os outros.

:::atencao
ROMs em `.zip` funcionam para a maioria dos sistemas de cartucho (NES, SNES, Mega Drive, GBA, arcade), mas **não** para jogos de disco. Não comprima um ISO de PS2 em ZIP e espere que o PCSX2 o abra — use `.chd` ou deixe o `.iso` solto.
:::

## Resumo

- O EmuDeck identifica o sistema pelo *nome da subpasta* dentro de `roms/`, nunca pelo conteúdo do arquivo.
- Cada sistema tem uma pasta canon (como `snes`, `psx`, `gc`) que não deve ser renomeada.
- Extensões como `.sfc`/`.smc` são equivalentes; o que importa é a pasta certa.
- Jogos de CD em `.cue`+`.bin` devem ficar juntos; o ideal é converter para `.chd`.
- `file` revela o formato real de um arquivo quando a extensão é suspeita.

## Exercícios

1. Liste as subpastas de `roms/` e anote, para cada uma que você usa, uma extensão de arquivo válida.
2. Use `file` em três ROMs suas de sistemas diferentes e confirme se o formato bate com a pasta onde está.
3. Identifique um jogo de CD que esteja em `.cue`+`.bin` e anote o tamanho dos dois arquivos juntos.
4. Procure um jogo que apareça duplicado na biblioteca (`.chd` + `.cue`/`.bin` na mesma pasta) e remova o formato redundante.
5. **Desafio.** Construa um comando `find` que liste, na pasta `roms/`, todos os arquivos `.zip` que estão *dentro* das pastas de sistemas de disco (`psx`, `ps2`, `gc`, `wii`), sinalizando possíveis erros de formato.