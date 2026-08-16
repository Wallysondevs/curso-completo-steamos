O `dd` é a ferramenta de clonagem mais crua; o Clonezilla é a mais amigável para quem quer um fluxo guiado e imagens pequenas. Por baixo dos panos ele usa o `partclone`, que — diferentemente do `dd` — entende sistemas de arquivos e copia **só os blocos usados**, gerando imagens muito menores. Esta seção ensina a usar o Clonezilla para criar e restaurar uma imagem completa do SSD do Deck.

:::objetivos
- Entender a diferença entre `dd` (setores) e `partclone` (blocos usados)
- Criar mídia bootável do Clonezilla
- Gerar uma imagem completa do disco com o assistente do Clonezilla
- Entender as opções de destino (local, rede, SSH)
- Restaurar uma imagem salva

:::

## Por que `partclone` gera imagens menores

O `dd` é cego: copia todos os setores do disco, usados ou não. O `partclone` (Clonando participitações) lê o sistema de arquivos e copia somente os blocos que contêm dados de verdade. Num SSD de 223 GB com 40 GB ocupados, a diferença é brutal:

| Ferramenta | Imagem gerada | Por quê |
|---|---|---|
| `dd` | ~223 GB | copia espaço vazio também |
| `partclone.ext4` | ~40 GB (antes da compressão) | lê só blocos usados |
| Clonezilla (partclone + gzip) | ~15–25 GB | blocos usados + compressão |

O Clonezilla é, na prática, um conjunto de scripts que orquestra `partclone`, `gzip`/`zstd` e a restauração de bootloader/tabela de partições. Ele faz em modo guiado o que você faria manualmente com vários comandos.

:::info
`partclone` tem um binário por sistema de arquivos: `partclone.ext4`, `partclone.ntfs`, `partclone.btrfs`, `partclone.fat32`. O SteamOS, que usa ext4 nas partições principais, é bem atendido pelo `partclone.ext4`.
:::

Para ver a diferença na prática, compare o `partclone` com o `dd` numa mesma partição. Imaginando a partição `home` com 145 GB usados de 207 GB:

```terminal
$ sudo partclone.ext4 -c -s /dev/nvme0n1p8 -o /mnt/backup/home-ptcl.img
Partclone v0.3.27 http://partclone.org
Starting to clone device (/dev/nvme0n1p8) to image (/mnt/backup/home-ptcl.img)
Total Time: 00:14:20, Ave. Rate: 480MB/min, 100.00% completed!
Syncing... OK!
$ ls -lh /mnt/backup/home-ptcl.img
-rw-r--r-- 1 root root 145G Mar 22 14:20 /mnt/backup/home-ptcl.img
```

O `-c` é *clone*, `-s` é source (partição), `-o` é output (imagem). O arquivo final tem ~145 GB — só os blocos usados — enquanto um `dd` da mesma partição geraria 207 GB, incluindo o espaço vazio.

## Criando a mídia bootável

O Clonezilla roda a partir de um pendrive ou cartão SD. O jeito mais simples é gravando a imagem ISO com o próprio `dd` (atenção ao dispositivo!):

```terminal
$ lsblk --fs
NAME    FSTYPE LABEL      MOUNTPOINT
sda                       
└─sda1  vfat   VENTOY     
$ sudo dd if=clonezilla-live-3.1.3-27-amd64.iso of=/dev/sda bs=4M status=progress conv=fsync
```

Antes de gravar, confirme que `/dev/sda` é realmente o pendrive (repare no `lsblk` que `sda1` tem label `VENTOY` ou similar — é removível). Gravar a ISO no SSD interno com esse `dd` seria o desastre dos desastres.

:::perigo
Gravar uma ISO de boot com `dd of=/dev/sda` **apaga todo o pendrive** e tudo o que estiver nele. Verifique o dispositivo com `lsblk` imediatamente antes, e desconecte qualquer outro disco removível para eliminar ambiguidade.
:::

Uma alternativa mais flexível é o **Ventoy**, que permite copiar várias ISOs para o pendrive e escolher qual bootar no menu — útil se você quiser levar Clonezilla, GParted e a imagem de recuperação da Valve no mesmo pendrive.

## Gerando a imagem com o assistente

Depois de bootar pelo pendrive, o Clonezilla abre um menu em modo texto. O fluxo para criar uma imagem de disco inteiro:

1. Escolha **"Clonezilla live"** (modo padrão).
2. Em *mode*, escolha **"device-image"** (disco → arquivo de imagem).
3. Em *destination*, escolha **local_dev** para gravar num disco local conectado (ou `ssh_server` para enviar pela rede).
4. Selecione o disco-fonte (`nvme0n1`) e o disco-destino (o externo montado).
5. O assistente sugere as opções; aceite `-p reboot` (rebootar ao fim), `-sfsck` (verificar partição-fonte) e `-z1p` (compressão gzip paralela).

Ao final, o Clonezilla grava a imagem num diretório com data e hora (ex.: `2026-Mar-22-14-img`), junto de arquivos de configuração de partição, tabela e bootloader.

```terminal
## estrutura da imagem gerada pelo Clonezilla
$ ls /mnt/backup/2026-Mar-22-14-img/
blkdev.list   info-dmi.txt     nvme0n1-ext4-home.aa        sdb-pt.sf
blkid.list    nvme0n1-chs.sf   nvme0n1-ext4-home.info     ...
```

Cada partição vira um par de arquivos: o conteúdo comprimido (`.aa`) e seus metadados (`.info`), além dos arquivos de partição e bootloader. Juntos formam a imagem restaurável.

## Escolhendo o destino: local ou rede

Clonezilla aceita quatro destinos de imagem:

- **local_dev** — disco ou pendrive USB conectado diretamente (o mais comum no Deck, via hub USB-C).
- **ssh_server** — envia a imagem para outro computador via SSH (fonte e destino não precisam estar no mesmo lugar).
- **samba_server** — grava num compartilhamento Windows/Samba da rede.
- **nfs_server** — grava num compartilhamento NFS.

Para a maioria dos usuários do Deck, o `local_dev` com um SSD externo de capacidade maior que o disco interno é o caminho mais simples. O `ssh_server` é poderoso quando você quer guardar o backup longe da máquina física, num NAS ou servidor doméstico.

## Restaurando uma imagem

A restauração é o fluxo inverso, também guiado:

1. No menu de *mode*, escolha **"device-image"** e depois **"restoredisk"** (imagem → disco).
2. Aponte para a imagem salva e para o disco-destino.
3. Confirme. O Clonezilla restaura a tabela de partições, o bootloader e o conteúdo de cada partição.

Como a imagem do Clonezilla é por partição, restaurar num disco de tamanho diferente exige redimensionar as partições depois — assunto das seções [7](#/cap-060/sec-07) e [8](#/cap-060/sec-08).

:::atencao
Restaurar uma imagem **apaga o disco de destino** por completo. Tenha certeza de que apontou para o disco certo. No Clonezilla, além do nome (`nvme0n1` vs `sdb`), confira o tamanho exibido no passo de seleção — dois discos de tamanhos idênticos são fáceis de confundir.
:::

## Resumo

- `partclone` copia só blocos usados, gerando imagens muito menores que o `dd`.
- O Clonezilla orquestra `partclone` + compressão + restauração de bootloader em modo guiado.
- Grave a ISO com `dd` (confira o dispositivo) ou use Ventoy para múltiplas ISOs.
- O fluxo `device-image` cria e restaura imagens de disco inteiro.
- Destinos possíveis: disco local, SSH, Samba e NFS.

## Exercícios

1. Baixe a ISO do Clonezilla e grave num pendrive com `dd`, confirmando o dispositivo com `lsblk` antes.
2. Boote pelo pendrive e navegue até o menu de escolha de modo sem iniciar nenhuma operação.
3. Crie uma imagem de uma partição pequena (ex.: `nvme0n1p7` de 256M) com o Clonezilla e confira os arquivos gerados.
4. Explore o diretório da imagem e identifique os pares `.aa`/`.info` de cada partição.
5. **Desafio.** Restaure a imagem da partição pequena num disco destino de teste e valide com `diff -r` que o conteúdo bate com o original.
