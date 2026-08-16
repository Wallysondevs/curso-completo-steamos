Até agora você viu *o quê* está montado. Mas como o sistema decide o que montar e com quais opções? A resposta está no `/etc/fstab` e no sistema de arquivos subjacente — que no SteamOS é o **Btrfs**, com subvolumes e snapshots herdados do ecossistema openSUSE e adaptados para a Valve. Entender isso fecha o círculo da anatomia do disco.

:::objetivos
- Ler e interpretar o `/etc/fstab` do SteamOS
- Entender subvolumes Btrfs e como o SteamOS os usa
- Listar subvolumes com `btrfs subvolume list`
- Compreender por que a Valve trocou ext4 por Btrfs em modelos recentes
:::

## O fstab como receita de montagem

O arquivo `/etc/fstab` é uma tabela de texto que o systemd lê no boot para saber o que montar. No SteamOS, ele é bem enxuto:

```terminal
$ cat /etc/fstab
# Static information about the filesystems.
# See fstab(5) for details.
#
# / was on /dev/mmcblk0p4
/dev/mmcblk0p4    /           ext4    ro,defaults,noatime    0 1
# /home was on /dev/mmcblk0p8
/dev/mmcblk0p8    /home       ext4    rw,defaults,noatime    0 2
# /var was on /dev/mmcblk0p6
/dev/mmcblk0p6    /var        ext4    rw,defaults,noatime    0 2
```

Cada linha segue a estrutura clássica de seis colunas:

| Coluna | Significado |
|---|---|
| `device` | Dispositivo (ou UUID) a montar |
| `mountpoint` | Onde montar na árvore |
| `fstype` | Tipo do sistema de arquivos |
| `options` | Opções de montagem |
| `dump` | Backup com `dump` (0 = não) |
| `pass` | Ordem de verificação no boot (1 = root primeiro, depois 2) |

As opções reveladoras: `/` usa `ro` (read-only) e `defaults,noatime` (sem registro de tempo de acesso para reduzir escrita), enquanto `/home` e `/var` usam `rw`. Essa tripla de linhas em `fstab` é o que materializa o modelo de três partições independentes.

## UUIDs: por que o fstab real não usa /dev/mmcblk0p4

Na verdade, o `fstab` de produção do SteamOS provavelmente usa UUIDs em vez de nomes de dispositivo, porque `mmcblk0` pode mudar de nome se você conectar um dock com leitor de cartão. O formato com UUID é:

```text
UUID=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee / ext4 ro,defaults,noatime 0 1
```

Para descobrir os UUIDs das suas partições:

```terminal
$ blkid
/dev/mmcblk0p4: UUID="e8a3f..." BLOCK_SIZE="4096" TYPE="ext4" PARTLABEL="rootfs-A"
/dev/mmcblk0p6: UUID="92b7c..." BLOCK_SIZE="4096" TYPE="ext4" PARTLABEL="var-A"
/dev/mmcblk0p8: UUID="1d4f2..." BLOCK_SIZE="4096" TYPE="ext4" PARTLABEL="home"
```

O `blkid` imprime UUID, TYPE e PARTLABEL de cada partição. A PARTLABEL é um rótulo GPT legível, definido na tabela de partições, e é o que o `lsblk` mostra na coluna LABEL quando você usa `lsblk -o name,label,uuid`.

:::dica
Use UUIDs em vez de `/dev/sdXY` nos seus próprios `fstab` (em máquinas que não sejam Steam Deck). É uma blindagem contra renomeações de dispositivo: o UUID nunca muda, mesmo se você trocar o disco de porta SATA ou slot NVMe.
:::

## Btrfs e subvolumes no SteamOS

Até o SteamOS 3.4, o sistema de arquivos padrão era ext4 em todas as partições. A partir do 3.5, modelos mais recentes começaram a usar **Btrfs** em vez de ext4 para `/` e `/home`. A diferença prática vem dos **subvolumes**: pastas tratadas como raízes virtuais, que podem ter snapshots tirados independentemente.

```terminal
$ sudo btrfs subvolume list /
ID 256 gen 42 top level 5 path @
ID 257 gen 38 top level 5 path @home
ID 258 gen 15 top level 5 path @snapshots
```

Neste layout típico de Btrfs style openSUSE:

- `@` é o subvolume root do sistema.
- `@home` é o subvolume de `/home`, separado para que um snapshot do sistema não afete seus dados.
- `@snapshots` guarda snapshots automáticos (gerenciados pelo snapper).

A beleza do Btrfs para o SteamOS é que um snapshot é instantâneo e ocupa quase zero bytes — ele usa copy-on-write, então só o que muda entre o momento do snapshot e agora consome espaço. Num eventual rollback, o sistema simplesmente aponta o boot para o subvolume do snapshot.

## Verificando se seu Deck usa Btrfs ou ext4

Nem todo Steam Deck tem Btrfs. Para conferir:

```terminal
$ findmnt -t btrfs
TARGET   SOURCE           FSTYPE OPTIONS
/        /dev/mmcblk0p4[/@] btrfs  rw,relatime,ssd,space_cache,subvol=/@
```

Se `findmnt -t btrfs` retornar linhas, seu Deck usa Btrfs; se não retornar nada, use `findmnt -t ext4` para confirmar que é ext4. A presença de `subvol=/@` na coluna OPTIONS é a assinatura visual do layout Btrfs.

:::info
**Versões do SteamOS e sistema de arquivos:** modelos com SteamOS 3.4 e anteriores usam ext4 universalmente. O 3.5 introduziu Btrfs em lotes de produção. O 3.6 (Noble Numbat) pode vir com Btrfs ou ext4 dependendo da região e do modelo. O comportamento funcional do usuário é o mesmo em ambos: a diferença só aparece na hora de tirar snapshot ou fazer rollback.
:::

## Snapshots e rollback com snapper

Se seu Deck usa Btrfs, você pode aproveitar o `snapper` (pré-instalado em alguns SKUs) para listar snapshots:

```terminal
$ sudo snapper list
 # | Type   | Pre # | Date                     | User | Description
---+--------+-------+--------------------------+------+--------------
 0 | single |       |                          | root | current
 1 | single |       | 2025-01-10 14:00:00      | root | pre-update
 2 | post   |     1 | 2025-01-10 14:05:00      | root | post-update
```

Cada snapshot é um ponto no tempo. O `pre-update` é tirado antes de uma atualização atômica; o `post-update`, depois. Se o update quebrar algo, você pode reverter ao snapshot 1 sem perder os dados em `/home` (porque `@home` é um subvolume independente).

## Resumo

- O `fstab` descreve o que montar, onde e com quais opções — `/` ro, `/home` e `/var` rw.
- UUIDs são preferíveis a nomes de dispositivo no `fstab` porque são estáveis.
- SteamOS modernos podem usar Btrfs com subvolumes separados (`@`, `@home`, `@snapshots`).
- `findmnt -t btrfs` confirma se seu Deck está em Btrfs; o `subvol=/@` nas opções é a assinatura.
- Snapshots com `snapper` (em Btrfs) permitem rollback sem afetar `/home`.

## Exercícios

1. Leia seu `/etc/fstab` e identifique as opções de montagem de cada partição. Há `noatime` em todas?
2. Rode `blkid` e compare os UUIDs com o que aparece no `fstab`. Algum UUID difere do que você esperava?
3. Execute `findmnt -t btrfs` e `findmnt -t ext4`. Qual está em uso no seu Deck?
4. Se estiver em Btrfs, liste os subvolumes com `sudo btrfs subvolume list /`. Quantos há e qual o nome de cada um?
5. **Desafio.** Em um sistema Btrfs, crie um arquivo de teste em `/home/deck/teste_btrfs.txt`, tire um snapshot manual com `sudo btrfs subvolume snapshot /home /home_snap`, apague o arquivo e verifique se ele ainda aparece ao montar o snapshot em outro ponto.