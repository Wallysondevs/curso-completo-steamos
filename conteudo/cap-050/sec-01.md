O EmuDeck não distribui seus arquivos por acaso: ele constrói uma árvore de diretórios previsível e simétrica, pensada para que você nunca precise adivinhar onde um arquivo deve ir. Saber ler essa estrutura é a diferença entre um setup que "simplesmente funciona" e uma tarde inteira caçando por que o jogo não abre. Esta seção caminha pela hierarquia de cima a baixo.

:::objetivos
- Entender a organização de alto nível da pasta `Emulation`
- Diferenciar as pastas `roms`, `bios`, `saves` e `storage`
- Reconhecer onde ficam as ferramentas e os launchers do EmuDeck
- Saber escolher entre instalar no armazenamento interno ou no cartão SD
- Usar o `tree` e o `ls` para explorar a estrutura real do seu Deck
:::

## Onde o EmuDeck mora

Ao final da instalação, o EmuDeck cria uma pasta chamada `Emulation`, seja na raiz do cartão SD (`/run/media/mmcblk0p1/Emulation`) ou na raiz do armazenamento interno (`/home/deck/Emulation`). Tudo o que diz respeito à emulação — jogos, BIOS, saves, ferramentas — fica dentro dela, num único lugar fácil de transportar e de fazer backup.

```terminal
$ ls -1 /run/media/mmcblk0p1/Emulation
bios/
roms/
saves/
storage/
tools/
```

Cada uma dessas cinco pastas tem uma responsabilidade bem definida. Entender isso agora evita erro depois: muita gente joga a BIOS na pasta de ROMs (ou o contrário) e não entende por que o emulador reclama de arquivo ausente.

## As cinco pastas principais

A tabela resume o papel de cada uma:

| Pasta | Conteúdo | Exemplo |
|---|---|---|
| `roms/` | Os jogos, agrupados por sistema em subpastas | `roms/snes/` |
| `bios/` | BIOS e firmware exigidos por emuladores (PS1, PS2, Dreamcast…) | `bios/scph5501.bin` |
| `saves/` | Save states e jogos salvos, organizados por emulador | `saves/retroarch/saves/` |
| `storage/` | Armazenamento interno de emuladores pesados (Yuzu, Ryujinx, Citra) | `storage/yuzu/nand/` |
| `tools/` | O próprio EmuDeck, o Steam ROM Manager e mídias baixadas | `tools/launchers/` |

A pasta `storage/` costuma causar confusão porque duplica parcialmente a função das outras. Ela existe porque alguns emuladores (os de Switch e de 3DS, principalmente) precisam de uma estrutura interna grande — *NAND*, firmware, shaders — que o EmuDeck mantém à parte para não poluir `bios/` e `saves/`.

## Olhando a árvore de verdade

O melhor jeito de fixar a estrutura é explorá-la com o próprio terminal. O `tree` mostra a hierarquia resumida; se ele não estiver instalado, o `ls -R` faz um trabalho aproximado.

```terminal
$ tree -L 2 /run/media/mmcblk0p1/Emulation | head -30
Emulation
├── bios
│   ├── dc_boot.bin
│   ├── dc_flash.bin
│   └── scph5501.bin
├── roms
│   ├── dreamcast/
│   ├── gba/
│   ├── psx/
│   └── snes/
├── saves
│   └── retroarch/
├── storage
│   └── yuzu/
└── tools
    ├── emulators/
    └── launchers/
```

Repare que a árvore é **rasa e regular**: dois níveis bastam para localizar quase qualquer coisa. É isso que torna o backup trivial — você copia a pasta `Emulation` inteira e leva tudo junto.

## Armazenamento interno versus cartão SD

A primeira decisão real é *onde* instalar. O EmuDeck oferece duas opções durante o setup:

- **Cartão SD** (recomendado pela maioria): mantém a mídia pesada fora do SSD interno, fácil de trocar e de levar para outro Deck.
- **Armazenamento interno**: mais rápido para carregar, especialmente em jogos de PS2 e Switch, mas compete com os jogos de PC pelo SSD.

```terminal
$ df -h / /run/media/mmcblk0p1
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p4  932G  214G  718G  23% /
/dev/mmcblk0p1  477G  301G  176G  64% /run/media/mmcblk0p1
```

O comando mostra os dois candidatos lado a lado. Se o cartão está quase cheio e o SSD interno tem folga, vale migrar — o assunto da [seção sobre migração](#/cap-050/sec-09). A escolha não é definitiva: o EmuDeck tem ferramenta própria para mover a pasta depois.

:::atencao
O cartão SD precisa estar formatado como **ext4** ou **btrfs** para aceitar os *symlinks* que o EmuDeck cria (links entre `saves/` e os diretórios reais dos emuladores). Um cartão em exFAT ou NTFS "funciona" para guardar ROMs, mas quebra a integração de saves. Mais detalhes em [cartão SD e sistema de arquivos](#/cap-050/sec-08).
:::

## Resumo

- O EmuDeck concentra tudo em uma pasta `Emulation`, no cartão SD ou no armazenamento interno.
- As cinco pastas principais são `roms`, `bios`, `saves`, `storage` e `tools`, cada uma com função única.
- `storage/` guarda o armazenamento interno de emuladores pesados como Yuzu e Ryujinx.
- A estrutura é rasa e regular, o que torna backup e migração simples.
- O cartão SD deve estar em ext4 ou btrfs para suportar os symlinks de saves.

## Exercícios

1. Liste o conteúdo da sua pasta `Emulation` com `ls -1` e identifique, em voz alta, o papel de cada subpasta.
2. Use `tree -L 2` (ou `ls -R`) para mapear a árvore do seu setup e anote onde estão suas ROMs de um sistema específico.
3. Rode `df -h / /run/media/mmcblk0p1` e calcule: quanto espaço de ROMs você conseguiria colocar em cada um dos dois destinos?
4. Descubra se o seu cartão SD está em ext4/btrfs ou exFAT com `lsblk -f`. Explique o que isso implica para os saves.
5. **Desafio.** Sem apagar nada, proponha um plano de migração da pasta `Emulation` do cartão para o SSD interno considerando os volumes apontados no exercício 3 — e confira na seção 9 se o seu raciocínio bate com o procedimento oficial.