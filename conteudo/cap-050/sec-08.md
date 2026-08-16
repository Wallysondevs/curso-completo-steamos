O cartão SD é, para a maioria dos usuários, o lar definitivo da biblioteca de emulação. Mas o *sistema de arquivos* que ele usa importa mais do que parece: o EmuDeck depende de *symlinks* e de permissões que só sistemas nativos do Linux suportam bem. Esta seção explica como o cartão é montado, por que ext4/btrfs é a escolha certa e o que acontece (e o que fazer) quando algo sai do lugar.

:::objetivos
- Entender como o SteamOS monta o cartão SD
- Diferenciar ext4, btrfs, exFAT e NTFS para o caso de uso do Deck
- Verificar e corrigir symlinks quebrados
- Mover a biblioteca entre cartão e armazenamento interno
- Montar o cartão de forma previsível
:::

## Como o cartão é montado

O SteamOS monta cartões removíveis automaticamente em `/run/media/<usuario>/<label>` (ou `/run/media/mmcblk0p1/` quando há um único cartão). O caminho exato aparece no `lsblk`:

```terminal
$ lsblk -f
NAME        FSTYPE FSVER LABEL  UUID                                 MOUNTPOINTS
mmcblk0
└─mmcblk0p1 btrfs        9095455 a0f2...-...-...  /run/media/mmcblk0p1
nvme0n1
├─nvme0n1p4 ext4   1.0   rootfs c3e8...-...-...  /
```

Aqui o cartão (`mmcblk0p1`) está em **btrfs** e o SSD interno em **ext4**. Repare que o sistema de arquivos é uma propriedade do cartão, definida quando você o formatou — não algo que o SteamOS impõe.

## Por que ext4 e btrfs

O EmuDeck cria *symlinks* do `Emulation/saves/` para dentro dos diretórios dos emuladores (Flatpaks que vivem em `~/.var/app/`). Um cartão em **exFAT** ou **NTFS** não representa esses links corretamente:

```terminal
$ ls -l Emulation/saves/duckstation
lrwxrwxrwx 1 deck deck 48 ... Emulation/saves/duckstation -> ~/.var/app/org.duckstation.DuckStation/data/duckstation
```

Em exFAT, esse `->` simplesmente não existe: o link vira um arquivo comum ou deixa de funcionar, e os saves "somem" porque o emulador grava num lugar que não é mais apontado de volta. A tabela resume:

| Sistema | Suporte a symlink | Permissões POSIX | Veredito para EmuDeck |
|---|---|---|---|
| ext4 | sim | sim | ótimo |
| btrfs | sim | sim | ótimo |
| exFAT | não | não | evite |
| NTFS | parcial | não | evite |

O SteamOS formata cartões em ext4 por padrão dentro do próprio modo de jogo, o que cobre o caso ideal. Se você comprou um cartão pré-formatado em exFAT, reformate antes de instalar o EmuDeck.

## Detectando symlinks quebrados

Um link aponta para um destino que pode deixar de existir — por exemplo, se o Flatpak foi reinstalado e o diretório mudou. O `find` caça esses casos:

```terminal
$ find Emulation/saves -xtype l
Emulation/saves/yuzu -> /home/deck/.var/app/org.yuzu_emu.yuzu/data/yuzu  (broken)
```

`-xtype l` lista apenas links cujo destino não pode ser resolvido. Cada linha dessas é um save que parou de funcionar. A correção depende do caso: reinstalar o emulador (que recria o diretório) ou refazer o link apontando para o destino novo.

## Movendo a biblioteca para outro lugar

O EmuDeck oferece migração com um clique (no menu do aplicativo), mas dá para entender o que ela faz por baixo: move os dados e refaz os links. O essencial é **não** mover na mão com `mv` puro, senão os symlinks ficam apontando para o caminho antigo.

```terminal
$ rsync -av --progress /run/media/mmcblk0p1/Emulation/ /home/deck/Emulation/
```

Depois da cópia, todos os *launchers* e configs que apontam para `/run/media/mmcblk0p1/Emulation` precisariam ser atualizados para `/home/deck/Emulation`. A ferramenta do EmuDeck faz exatamente essa varredura e substituição — por isso "copiar manualmente" resolve o grosso, mas costuma quebrar launchers e saves de emulador.

:::atencao
Antes de migrar, feche o jogo e o modo desktop abertos sobre o cartão. Migrar com um emulador rodando pode deixar um arquivo de save pela metade, corrompido. Sempre faça um [backup de saves](#/cap-050/sec-06) antes de mover qualquer coisa.
:::

## Montando de forma previsível

Se você troca de cartão com frequência, o caminho `/run/media/mmcblk0p1` pode confundir. Para ter um ponto fixo, espere montar por UUID via `fstab` ou use o `mount --bind`. O `blkid` revela o UUID:

```terminal
$ sudo blkid /dev/mmcblk0p1
/dev/mmcblk0p1: UUID="a0f2..." BLOCK_SIZE="4096" TYPE="btrfs"
```

Montar por UUID garante que o mesmo cartão sempre apareça no mesmo caminho, independente da ordem em que outros dispositivos foram ligados — útil quando há vários cartões ou um pendrive junto.

## Resumo

- O SteamOS monta o cartão em `/run/media/mmcblk0p1` (ou por rótulo), visível no `lsblk -f`.
- ext4 e btrfs suportam os symlinks que o EmuDeck precisa; exFAT/NTFS, não.
- `find Emulation/saves -xtype l` revela links quebrados (saves que pararam de funcionar).
- Migrar a biblioteca exige atualizar launchers e symlinks — use a ferramenta do EmuDeck.
- Montar por UUID torna o caminho do cartão previsível entre trocas.

## Exercícios

1. Rode `lsblk -f` e anote o sistema de arquivos e o UUID do seu cartão SD e do SSD interno.
2. Verifique se há symlinks quebrados na sua biblioteca com `find Emulation -xtype l`.
3. Identifique, em um emulador seu, um symlink de save e mostre para onde ele aponta com `ls -l`.
4. Simule (em diretórios de teste) uma migração com `rsync` e observe o que acontece com os links copiados.
5. **Desafio.** Proponha o conteúdo de uma entrada `fstab` que monte seu cartão por UUID num caminho fixo, explicando cada campo — sem aplicar ainda, apenas justificando.