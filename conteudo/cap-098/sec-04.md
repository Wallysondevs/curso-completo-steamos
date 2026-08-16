Um Steam Deck perdido ou roubado é um segundo problema — mais delicado que o valor do hardware. Se o SSD não estiver criptografado, qualquer pessoa que removê-lo consegue ler todos os seus arquivos, sessões de navegador e chaves SSH simplesmente conectando o disco a outro computador. A criptografia de disco com LUKS (Linux Unified Key Setup) resolve isso: sem a senha, o conteúdo do disco é ruído digital.

:::objetivos
- Entender o que o LUKS protege e o que não protege
- Identificar partições criptografadas com `lsblk` e `blkid`
- Adicionar e remover chaves de um slot do LUKS
- Criar um arquivo como volume criptografado para dados sensíveis
- Recuperar acesso a um volume LUKS com chave de backup
:::

## O que LUKS é e o que não é

LUKS opera no nível de bloco, não de arquivo. Ele criptografa uma partição (ou um arquivo-loop) inteira — cada setor gravado no disco é cifrado e cada setor lido é decifrado na RAM. O sistema de arquivos (ext4, Btrfs) mora dentro do volume LUKS e não sabe que está encriptado.

Isso significa que o LUKS protege **dados em repouso**: disco desligado, SSD removido, máquina suspensa no bolso. Mas ele não protege dados em uso — com o volume desbloqueado (aberto), qualquer processo do usuário que tem a chave pode ler os arquivos. E não protege contra keylogger, malware ou ataque físico com a máquina ligada.

No SteamOS, a partição raiz **não** é criptografada por padrão. Mas você pode criptografar um diretório de dados ou uma partição separada — e é isso que esta seção ensina.

## Detectando volumes LUKS

O kernel identifica cabeçalhos LUKS e os expõe no `lsblk`:

```terminal
$ lsblk -f
NAME        FSTYPE      FSVER LABEL       UUID                                 FSAVAIL FSUSE% MOUNTPOINTS
nvme0n1                                                                                       
├─nvme0n1p1 vfat        FAT16 boot        9A7C-...                               248M     ...
├─nvme0n1p2 ext4        1.0   rootfs      a1b2c3d4-...                           4.2G     ...
└─nvme0n1p3 crypto_LUKS 2     vault       e5f6g7h8-...                                          
```

A partição `nvme0n1p3` tem `FSTYPE=crypto_LUKS` — está crua, fechada. Para abri-la:

```terminal
$ sudo cryptsetup luksOpen /dev/nvme0n1p3 vault
Enter passphrase for /dev/nvme0n1p3: 
$ lsblk -f
nvme0n1p3 crypto_LUKS 2              vault    e5f6g7h8-...
└─vault   ext4         1.0           dados    z9x8y7w6-...               20G   ...
```

O dispositivo mapeado `/dev/mapper/vault` agora é um disco comum — pode ser montado com `mount /dev/mapper/vault /mnt/dados`.

## Gerenciando chaves: slots do LUKS

O cabeçalho LUKS2 tem 8 slots de chave. Cada slot guarda uma chave mestra criptografada com uma senha (ou arquivo de chave) diferente. Isso permite que duas pessoas tenham senhas distintas para o mesmo volume, ou que você mantenha uma senha de emergência no slot 7 e use um arquivo de chave no slot 0 para unlock automático.

```terminal
$ sudo cryptsetup luksDump /dev/nvme0n1p3
LUKS header information
Version:       	2
Keyslots:
  0: luks2
	Key:        512 bits
	Priority:   normal
  1: luks2
	Key:        512 bits
	Priority:   normal
```

Para adicionar uma chave de arquivo no slot 1:

```terminal
$ sudo dd if=/dev/urandom of=/root/vault-key.bin bs=32 count=1
$ sudo chmod 600 /root/vault-key.bin
$ sudo cryptsetup luksAddKey /dev/nvme0n1p3 /root/vault-key.bin --key-slot 1
Enter any existing passphrase:
```

Agora o slot 1 aceita o arquivo binário como chave, e o unlock pode ser automatizado (útil para montar no boot sem digitar senha, se o arquivo de chave estiver em uma partição segura).

:::perigo
Remover o slot errado com `cryptsetup luksKillSlot` destrói permanentemente o acesso via aquela chave — não há recuperação. Antes de remover, confira com `luksDump` qual slot está em uso e, principalmente, **mantenha pelo menos dois slots funcionais** enquanto mexe.
:::

## Volume criptografado com arquivo (sem reparticionar)

Se o disco já está todo em uso, você não precisa reparticionar. Crie um arquivo grande, associe-o a um dispositivo de loop e criptografe por cima:

```terminal
$ dd if=/dev/zero of=/home/deck/cofre.img bs=1M count=2048 status=progress
2147483648 bytes (2.1 GB) copied, 3.2 s, 640 MB/s
$ sudo losetup -f /home/deck/cofre.img
$ sudo losetup -a
/dev/loop0: [0:103]: ... (/home/deck/cofre.img)
$ sudo cryptsetup luksFormat /dev/loop0
WARNING!
========
This will overwrite data on /dev/loop0 irrevocably.
Are you sure? (Type 'yes' in capital letters): YES
Enter passphrase for /dev/loop0: 
$ sudo cryptsetup open /dev/loop0 cofre --key-file=-
```

Depois de formatar o mapper (`sudo mkfs.ext4 /dev/mapper/cofre`) e montá-lo, o arquivo `cofre.img` guarda os dados cifrados. Para desmontar e fechar:

```terminal
$ sudo umount /mnt/cofre
$ sudo cryptsetup close cofre
$ sudo losetup -d /dev/loop0
```

:::nota
O `losetup` associa um arquivo comum a um dispositivo de bloco (`/dev/loop0`). É o mesmo mecanismo que o SteamOS usa para montar o sistema de arquivos raiz a partir de uma imagem. O arquivo `.img` pode ser copiado, feito backup e transportado como qualquer outro arquivo — mas só o LUKS e a senha revelam seu conteúdo.
:::

## Recuperação, backup de cabeçalho e senha perdida

O cabeçalho LUKS é o único ponto de entrada do volume. Se ele for sobrescrito, o volume é irrecuperável mesmo com a senha correta. Por isso:

```terminal
$ sudo cryptsetup luksHeaderBackup /dev/nvme0n1p3 --header-backup-file /home/deck/backup-header.bin
$ sudo cryptsetup luksHeaderBackup --header-backup-file /home/deck/backup-header.bin /dev/nvme0n1p3
```

Guarde esse arquivo em local seguro (pendrive offline, cofre digital). Restaurar: `cryptsetup luksHeaderRestore`.

:::dica
Se você esquecer a senha de um slot, mas ainda tiver outro slot funcional, faça login com o slot funcional e adicione uma nova senha: `cryptsetup luksAddKey`. A senha esquecida pode ser removida depois com `luksKillSlot`. Nunca fique com um único slot ocupado — isso é a causa #1 de perda de dados em volumes LUKS domésticos.
:::

## Resumo

- LUKS criptografa em nível de bloco: protege o disco em repouso, mas não um sistema ligado com o volume aberto.
- `lsblk -f` mostra `crypto_LUKS` para partições fechadas; `cryptsetup luksOpen` as desbloqueia.
- O cabeçalho LUKS2 tem até 8 slots; você pode ter senhas e arquivos de chave diferentes, inclusive um slot de emergência.
- Arquivos `.img` com `losetup` + `cryptsetup` permitem criar cofres criptografados sem reparticionar o disco.
- Faça backup do cabeçalho LUKS (`luksHeaderBackup`) e nunca fique com um único slot ocupado.

## Exercícios

1. Use `lsblk -f` e `blkid` para verificar se alguma partição do seu Steam Deck já é LUKS. O que o `crypto_LUKS` indica?
2. Crie um arquivo `.img` de 512 MB, associe a um loop, formate como LUKS (com dois slots: senha e arquivo de chave) e monte-o com ext4.
3. Adicione uma terceira senha ao volume do exercício 2, liste os slots com `luksDump` e remova a primeira senha. Confirme que a terceira ainda funciona.
4. Faça backup do cabeçalho LUKS do volume criado e salve em `/tmp`. Depois tente restaurar (simulação — não precise quebrar nada).
5. **Desafio.** Crie dois volumes LUKS: um com `--type luks2` e outro com `--type luks1`. Compare a saída de `cryptsetup luksDump` de ambos e liste três diferenças visíveis (campos que só existem no cabeçalho LUKS2).