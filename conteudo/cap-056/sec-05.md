Formatar o cartão é só metade do caminho. A outra metade é montá-lo corretamente — e garantir que ele volte montado após cada reinício. Nesta seção você verá como montar manualmente com `mount`, entender onde o SteamOS monta por padrão e configurar a montagem automática, para que o cartão esteja sempre disponível quando você ligar o Deck.

:::objetivos
- Entender pontos de montagem no Linux e onde o SteamOS monta o cartão
- Montar manualmente com `mount` e desmontar com `umount`
- Configurar montagem automática via `/etc/fstab` e udisks
- Identificar o cartão por UUID ou LABEL de forma estável
- Diagnosticar problemas de montagem (cartão não aparece)
:::

## Pontos de montagem e o SteamOS

No Linux, não existem "unidade C:" ou "D:". Cada sistema de arquivos é anexado (montado) a uma pasta — o ponto de montagem. O SteamOS, no Modo Desktop, usa o `udisks` para montar mídia removível automaticamente em `/run/media/<usuário>/<rótulo>`:

```terminal
$ lsblk -o NAME,LABEL,MOUNTPOINT
NAME        LABEL MOUNTPOINT
mmcblk0p1   SD    /run/media/deck/SD
```

O `deck` é o usuário padrão do SteamOS, e `SD` o rótulo que você definiu na formatação. No Modo Jogo, o Steam gerencia o cartão internamente e expõe apenas a lógica de armazenamento da biblioteca.

## Montagem manual com mount

Para montar manualmente:

```terminal
## Criar o ponto de montagem (uma vez)
$ sudo mkdir -p /mnt/sd

## Montar
$ sudo mount /dev/mmcblk0p1 /mnt/sd

## Usar
$ ls /mnt/sd

## Desmontar
$ sudo umount /mnt/sd
```

O `mount` aceita opções úteis, dependendo do sistema de arquivos:

```terminal
## ext4 com opções comuns
$ sudo mount -o noatime /dev/mmcblk0p1 /mnt/sd

## Btrfs com subvolume e compressão
$ sudo mount -o subvol=@games,compress=zstd /dev/mmcblk0p1 /mnt/sd

## exFAT com permissões úteis
$ sudo mount -o uid=1000,gid=1000 /dev/mmcblk0p1 /mnt/sd
```

- `noatime`: não grava o horário de acesso a cada leitura — reduz gravações no flash (bom para microSD).
- `subvol=@games,compress=zstd`: seleciona subvolume e compressão no Btrfs.
- `uid=1000,gid=1000`: faz os arquivos pertencerem ao seu usuário no exFAT (que não tem permissões nativas).

:::dica
`noatime` (ou `relatime`, que é o padrão moderno) diminui escritas desnecessárias no cartão. Como microSD tem número limitado de ciclos de gravação, montar com `noatime` é uma prática recomendada para prolongar a vida útil.
:::

## Montagem automática com /etc/fstab

O `/etc/fstab` monta sistemas de arquivos automaticamente no boot. Para adicionar o cartão de forma estável, use o `UUID` (identificador único) em vez do nome de dispositivo, que pode mudar:

```terminal
## Descobrir o UUID
$ sudo blkid /dev/mmcblk0p1
/dev/mmcblk0p1: UUID="a1b2c3d4-..." LABEL="SD" TYPE="ext4"
```

Adicione a linha no `/etc/fstab` (edite com `sudo nano /etc/fstab`):

```
UUID=a1b2c3d4-...  /mnt/sd  ext4  defaults,noatime,nofail  0  2
```

- `UUID=...`: identifica o cartão independentemente da ordem de detecção.
- `/mnt/sd`: ponto de montagem.
- `ext4`: sistema de arquivos.
- `defaults,noatime,nofail`: opções — `nofail` evita que o boot pare se o cartão não estiver no slot.
- `0 2`: dump (0) e ordem de verificação (2).

Para testar sem reiniciar:

```terminal
$ sudo mount -a
$ lsblk -o NAME,LABEL,MOUNTPOINT
```

:::atencao
Editar o `/etc/fstab` com um UUID errado ou ponto de montagem inexistente pode deixar o sistema com um volume não montado (ou, em `fstab` mal formado, atrapalhar o boot). Use sempre `nofail` para o cartão — assim, o Deck inicia normalmente mesmo com o slot vazio.
:::

## fstab vs. udisks no Deck

Duas formas coexistem:

- **udisks (padrão no Modo Desktop)**: monta na hora, em `/run/media/deck/<rótulo>`, sem tocar em fstab. Suficiente para uso casual e intercâmbio.
- **fstab**: monta no boot, em um ponto fixo (`/mnt/sd`), ideal para quem depende do cartão para bibliotecas fixas, serviços ou scripts que esperam um caminho estável.

Para a biblioteca Steam, o Modo Jogo já trata o cartão sozinho. O fstab é mais útil quando você quer um caminho fixo para scripts, backups automáticos ou serviços.

## Diagnosticando "cartão não monta"

Se o cartão não aparece:

```terminal
## Ver se o kernel detectou o dispositivo
$ dmesg | tail -n 20
$ lsblk

## Tentar montar manualmente e ver o erro
$ sudo mount /dev/mmcblk0p1 /mnt/sd
```

Erros comuns:

- **"wrong fs type / bad superblock"**: sistema de arquivos corrompido ou não suportado — rode `sudo fsck.ext4 -f` (ext4) ou `sudo btrfs check` (Btrfs).
- **"can't find in /etc/fstab"**: dispositivo/partição não existe — confirme com `lsblk` se o cartão foi detectado.
- **"unknown filesystem type 'exfat'"**: falta o pacote `exfatprogs` — instale.

## Pontos-chave

- No Linux, monta-se o cartão numa pasta (ponto de montagem); o SteamOS usa `/run/media/deck/<rótulo>` via udisks.
- Montagem manual: `sudo mount /dev/mmcblk0p1 /mnt/sd`; desmontar com `umount`.
- Monte com `noatime` para reduzir gravações e prolongar o microSD.
- Use UUID (não `/dev/mmcblk0p1`) no `/etc/fstab`, com `nofail`.
- Teste o fstab com `sudo mount -a`; use `dmesg` e `lsblk` para diagnosticar.

## Exercícios

1. Monte seu cartão manualmente em `/mnt/sd` e desmonte com `umount`.
2. Descubra o UUID com `sudo blkid` e escreva uma linha de fstab correta (com `nofail`) para ele.
3. Teste a configuração com `sudo mount -a` e confirme com `lsblk`.
4. Monte com `noatime` e explique por que isso ajuda a vida útil do microSD.
5. **Desafio.** Remova o cartão com fstab ativo e reinicie; confirme que o boot não falha graças ao `nofail`.
