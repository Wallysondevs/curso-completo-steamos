BIOS é o conjunto de firmwares que os consoles originais executavam ao ligar — uma espécie de sistema operacional mínimo que o emulador precisa carregar antes de rodar o jogo. Sem a BIOS correta, o emulador de PlayStation, PS2 ou Dreamcast nem chega a abrir o disco. O erro é silencioso e frustrante, porque nada indica claramente que faltou um arquivo na pasta `bios/`. Esta seção mostra onde colocar cada firmware e como ter certeza de que ele é o certo.

:::objetivos
- Entender por que alguns emuladores exigem BIOS e outros não
- Saber o nome exato de arquivo que cada emulador espera
- Posicionar cada BIOS na pasta `bios/` correta
- Conferir a integridade de um firmware por checksum
- Diagnosticar o erro clássico de "emulador não inicia" por BIOS errada
:::

## Por que uns precisam e outros não

Emuladores de consoles simples — NES, SNES, Game Boy — recriam o hardware inteiro em software e dispensam BIOS: o jogo é carregado direto. Já consoles com sistema operacional próprio (PlayStation, PS2, Dreamcast, Saturn, e portáteis como GBA em alguns casos) exigem o firmware original, porque o emulador delega a ele funções como boot, memória e menus.

É uma distinção legal além de técnica: a BIOS é software proprietário da fabricante e **não acompanha o EmuDeck**. Você só pode obtê-la fazendo *dump* de um console que possui. O EmuDeck cria a pasta vazia e espera que você preencha com os arquivos legítimos.

## Onde colocar cada BIOS

A regra é simples: **tudo vai na pasta `Emulation/bios/`, sem subpastas**. O RetroArch e os emuladores standalone apontam para ali. O nome do arquivo, porém, precisa ser exatamente o esperado:

```terminal
$ ls -1 /run/media/mmcblk0p1/Emulation/bios/
dc_boot.bin
dc_flash.bin
gba_bios.bin
scph5501.bin
mpr-17933.bin
neogeo.zip
```

A tabela mostra os arquivos mais pedidos:

| Emulador | Arquivo(s) esperado(s) |
|---|---|
| Playstation (Beetle/DuckStation) | `scph5501.bin`, `scph5500.bin`, `scph5502.bin` |
| PlayStation 2 (PCSX2) | uma BIOS nomeada `.bin` (ex.: `SCPH-70012.bin`) |
| Dreamcast (Flycast) | `dc_boot.bin`, `dc_flash.bin` |
| Saturn | `mpr-17933.bin` (ou `sega_101.bin`) |
| Game Boy Advance (mGBA) | `gba_bios.bin` |
| Neo Geo | `neogeo.zip` |

:::atencao
O PCSX2 aceita várias BIOS e deixa você escolher a região pelo próprio menu. Um dump errado — por exemplo, uma BIOS truncada ou renomeada — faz o emulador travar na inicialização sem mensagem de erro útil. Sempre confira o checksum.
:::

## Conferindo o checksum de um firmware

Um dump de BIOS só é válido se tiver o mesmo *hash* (MD5/SHA) do arquivo original. Como não dá para "ver" se uma BIOS está correta, o checksum é a única prova confiável.

```terminal
$ md5sum scph5501.bin
490f666e1afb15d7366b406529d7a0e2  scph5501.bin
```

O hash conhecido da BIOS `scph5501.bin` (região americana) é justamente `490f666e...`. Números como esse estão documentados em páginas como o [Libretro BIOS page](https://docs.libretro.com/library/bios/) — consulte sempre antes de assumir que o arquivo serve.

```terminal
$ sha1sum dc_boot.bin
e10c53c2f8b90bab96ead2d36885862364a1b492  dc_boot.bin
```

## Diagnosticando "o emulador não abre"

A ausência ou o erro de BIOS se manifesta de duas formas: o jogo nem inicia (tela preta) ou o emulador abre e fecha na hora. Para confirmar que é BIOS e não outra coisa, rode o core pela linha de comando e observe o log:

```terminal
$ retroarch -L /run/media/mmcblk0p1/Emulation/bios/../tools/... 2>&1 | grep -iE 'bios|missing'
[INFO] BIOS found: /run/media/mmcblk0p1/Emulation/bios/scph5501.bin
```

A mensagem decisiva é o `BIOS found` (ou sua ausência). Se o core reporta `missing`, o arquivo está com nome errado ou em diretório errado — às vezes é questão de caixa alta/baixa (`SCPH5501.BIN` versus `scph5501.bin`).

:::dica
O RetroArch tem uma tela própria para isso: `Settings > Core > Manage Cores > Core Info`, que lista exatamente quais BIOS aquele core procura, com nome e status (presente/ausente). O DuckStation e o PCSX2 também têm um painel de BIOS em `Settings`.
:::

## Resumo

- BIOS é o firmware original do console que alguns emuladores exigem para funcionar.
- Todos os arquivos vão em `Emulation/bios/`, sem subpastas, com nome exato.
- PlayStation pede os `scph*.bin`; Dreamcast pede `dc_boot.bin`/`dc_flash.bin`; GBA pede `gba_bios.bin`.
- O checksum (`md5sum`, `sha1sum`) é a única prova de que o dump é válido.
- "Emulador não inicia" normalmente é BIOS ausente ou com nome/caixa errados.

## Exercícios

1. Liste sua pasta `Emulation/bios/` e confira quais arquivos da tabela você tem e quais faltam.
2. Calcule o `md5sum` da sua BIOS de PlayStation e compare com o hash documentado no Libretro.
3. Abra o `Core Info` de um core do RetroArch e anote o nome exato de BIOS que ele espera.
4. Reproduza o cenário de falha: renomeie temporariamente `gba_bios.bin` e observe o comportamento do mGBA, depois restaure.
5. **Desafio.** Escreva um pequeno script bash que verifique, para uma lista de arquivos de BIOS esperados, se cada um existe e se o `md5sum` confere com uma tabela sua — e imprima `OK` ou `FALHA` para cada item.