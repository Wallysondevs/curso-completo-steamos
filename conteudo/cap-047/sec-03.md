A decisão mais concreta que o EmuDeck vai te obrigar a tomar — onde moram os jogos — é também a que mais gente erra e só descobre quando o disco lota. ROMs são pequenas (um cartucho de SNES passa de 1 MB) ou enormes (um jogo de PS2 pode passar de 4 GB). Entender o sistema de arquivos, o formato do cartão e o comportamento do SteamOS evita reinstalações inteiras por causa de uma escolha de formato mal feita.

:::objetivos
- Decidir entre SD card e SSD interno para as ROMs
- Entender os sistemas de arquivos aceitos (ext4, btrfs, FAT, exFAT) e seus limites
- Formatular um microSD corretamente para o SteamOS
- Mover uma instalação de ROMs de um armazenamento para outro
- Diagnosticar espaço livre com as ferramentas certas
:::

## Onde o EmuDeck coloca as coisas

A instalação pergunta onde você quer a raiz `Emulation`. Há duas respostas padrão: dentro do **armazenamento interno** (junto do home, no SSD NVMe) ou na **raiz do cartão microSD**. A escolha não é banal porque ROMs de consoles de CD/DVD são pesadas.

```terminal
$ df -h /home
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p6  456G  198G  236G  48% /home
$ df -h /run/media/deck/emudeck
Filesystem      Size  Used Avail Use% Mounted on
/dev/mmcblk0p1  477G   12G  465G   3% /run/media/deck/emudeck
```

No exemplo, o SSD interno tem 236 GB livres e o cartão, 465 GB livres. Para uma coleção de PS2 + GameCube, o cartão é claramente a escolha certa. Para uma coleção só de consoles de cartucho (que somam poucos gigabytes), o SSD interno resolve sem a complicação de um cartão extra.

:::dica
A convenção que o EmuDeck sugere — e que a comunidade adotou — é manter **emuladores no SSD** (eles são relativamente pequenos e se beneficiam da velocidade do NVMe) e **ROMs no microSD** (grandes, e a leitura sequencial de um cartão U3/A2 é mais que suficiente para jogos retrô). Essa separação também facilita trocar de cartão sem reinstalar os programas.
:::

## Sistemas de arquivos e a pegadinha do formato

O SteamOS, sendo Linux, lê e grava nativamente em sistemas de arquivos Linux: **ext4** e **btrfs**. O FAT32 e o exFAT, comuns em cartões que vêm formatados de fábrica ou usados em Windows, funcionam para leitura, mas trazem restrições — o FAT32 limita arquivos a 4 GB, o que quebra jogos de PS2 e GameCube que são arquivos únicos maiores que isso.

O problema clássico: você compra um microSD novo, ele vem em exFAT, e o EmuDeck (ou o próprio Steam) se recusa a usá-lo para ROMs grandes. A solução é formatar em ext4 (ou btrfs, se você usa SteamOS e quer os recursos de snapshots/cow).

:::perigo
Formatar um cartão **apaga tudo dentro dele**. Antes de qualquer comando de formatação, confirme que o dispositivo certo foi identificado (`lsblk`) e faça backup. Gravar num dispositivo errado — por exemplo, `mkfs` no `/dev/nvme0n1` em vez de `/dev/mmcblk0` — é uma perda de dados irreversível.
:::

## Formatando o microSD em ext4

O processo é feito pelo KDE no Desktop Mode (o utilitário KDE Partition Manager faz tudo por interface), mas pelo terminal fica explícito o que acontece em cada etapa. Primeiro, identifique o dispositivo:

```terminal
$ lsblk -o NAME,SIZE,TYPE,MOUNTPOINT,FSTYPE
NAME         SIZE TYPE MOUNTPOINT           FSTYPE
mmcblk0    476.9G disk
└─mmcblk0p1 476.9G part /run/media/deck/x   exfat
nvme0n1    476.9G disk
├─nvme0n1p1  64M  part                      vfat
...
```

O cartão aparece como `mmcblk0` e a única partição, em exFAT, como `mmcblk0p1`. Para formatá-la:

```terminal
$ sudo umount /dev/mmcblk0p1
$ sudo mkfs.ext4 -L emudeck /dev/mmcblk0p1
mke2fs 1.47.0 (5-Feb-2024)
Creating filesystem with 125169664 4k blocks and 31293184 inodes
Filesystem UUID: 3f2b91ac-77de-4c15-9f0e-4a2d1c8b5e71
Superblock backups stored on blocks:
        32768, 98304, 163840, 229376, 294912, ...
Allocating group tables: done
Writing inode tables: done
Creating journal (262144 blocks): done
Writing superblocks and filesystem accounting information: done
```

A opção `-L emudeck` rotula o volume, e o SteamOS monta o cartão em `/run/media/deck/emudeck` usando esse rótulo, o que deixa o caminho estável entre reinicializações. Sem rótulo, o sistema monta por UUID e o caminho muda conforme o rótulo anterior.

:::nota
O SteamOS monta cartões com rótulo em `/run/media/deck/<rótulo>`. Por isso vale dar um rótulo descritivo (`emudeck`, `roms`, `retro`) já na formatação. Isso também ajuda o EmuDeck a reencontrar a pasta após um reboot, já que o caminho não muda.
:::

## btrfs: a escolha mais "SteamOS"

O sistema de arquivos nativo do SteamOS no armazenamento interno é o **btrfs**, e há quem prefira manter o cartão no mesmo formato por consistência e pelos recursos extras (snapshots, compressão, checksums). A formatação é análoga:

```terminal
$ sudo mkfs.btrfs -f -L emudeck /dev/mmcblk0p1
```

O btrfs permite compressão transparente com `compress=zstd`, o que economiza espaço em ROMs que comprimem bem — embora ROMs de PS2 já venham em formatos comprimidos (CHD), reduzindo o ganho. Para a vasta maioria dos usuários, ext4 no cartão é mais simples e igualmente recomendado; btrfs é opção de quem já convive com ele no SSD.

## Movendo ROMs entre armazenamentos

Se você instalou tudo no SSD e depois decidiu migrar para o cartão (ou vice-versa), não precisa reinstalar o EmuDeck. Basta mover a pasta de ROMs e apontar o novo caminho. O `rsync` preserva permissões, datas e retoma transferências interrompidas:

```terminal
$ rsync -avP ~/Emulation/roms/ /run/media/deck/emudeck/Emulation/roms/
sending incremental file list
roms/
roms/ps2/
roms/ps2/game.chd
       4,123,456,789 100%   62.55MB/s    0:01:02 (xfr#1, to-chk=42/44)
```

As flags `-a` (archive, preserva tudo), `-v` (verboso) e `-P` (progresso + retomada parcial) fazem a transferência ser segura de interromper e retomar. Depois, no EmuDeck, você reabre o instalador e informa o novo caminho das ROMs — o programa se reconfigura sem tocar nos emuladores já instalados.

:::atencao
Movimentar ROMs enquanto um emulador está aberto, ou enquanto o SRM está lendo a pasta, pode corromper a varredura ou deixar o save state apontando para o lugar antigo. Feche os jogos, feche o SRM e só então mova. Depois de mover, rode o SRM de novo para regenerar os atalhos apontando para o cartão.
:::

## Resumo

- ROMs de consoles de CD/DVD são pesadas; escolher o armazenamento certo evita ficar sem espaço.
- O padrão recomendado é emuladores no SSD e ROMs no microSD de alta velocidade.
- exFAT e FAT32 limitam (FAT32 corta em 4 GB); ext4 e btrfs são os formatos nativos do SteamOS.
- `mkfs.ext4 -L emudeck` formata o cartão e o rotula para montagem estável.
- O rótulo define o ponto de montagem em `/run/media/deck/<rótulo>`.
- `rsync -avP` migra ROMs entre armazenamentos com segurança e retomada.

## Exercícios

1. Rode `lsblk -o NAME,SIZE,FSTYPE,LABEL,MOUNTPOINT` e identifique o SSD interno e o cartão microSD, com seus sistemas de arquivos e rótulos.
2. Verifique o espaço livre real de cada armazenamento com `df -h` e compare com o tamanho estimado da sua biblioteca de ROMs.
3. Se você tiver um cartão em exFAT/FAT32, explique (sem formatar ainda) por que ele é problemático para ROMs maiores que 4 GB e qual comando o resolve.
4. Simule uma migração criando uma pasta de teste com arquivos grandes e usando `rsync -avP` para movê-la entre dois diretórios; confirme que as permissões foram preservadas com `ls -l`.
5. **Desafio.** Formate um cartão como ext4 com rótulo, monte-o, crie uma ROM de teste de 5 GB (com `truncate -s 5G teste.iso`), e demonstre que ela ocupa corretamente mais de 4 GB — provando que o limite do FAT32 sumiu. Depois, desmonte com `umount` e verifique se o rótulo reaparece após reinserir.
