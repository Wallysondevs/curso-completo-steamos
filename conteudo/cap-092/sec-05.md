O Steam Deck usa um esquema de particionamento incomum, com 9 partições GPT no layout padrão. Entender o que cada uma faz é o pré-requisito para qualquer operação avançada — seja redimensionar para dual boot, trocar o SSD por um maior ou diagnosticar falhas de boot. Esta seção abre o capô do particionamento: layout, propósito de cada partição e como interagir com elas sem destruir o sistema.

:::objetivos
- Mapear as 9 partições padrão do SteamOS e o propósito de cada uma
- Compreender o esquema A/B das partições de sistema
- Consultar e interpretar a tabela de partições GPT
- Saber como o SteamOS usa overlays em vez de escrita direta na raiz
:::

## O layout de partições em detalhe

A tabela abaixo resume as 9 partições do layout padrão após uma instalação limpa do SteamOS:

| Partição | Tamanho | Tipo | Propósito |
|---|---|---|---|
| p1 (esp) | 64M | vfat | ESP primário (firmware) |
| p2 (efi-A) | 32M | — | EFI boot A (reserva) |
| p3 (efi-B) | 32M | — | EFI boot B (reserva) |
| p4 (rootfs-A) | 5G | ext4 | Sistema raiz slot A |
| p5 (rootfs-B) | 5G | ext4 | Sistema raiz slot B |
| p6 (/efi) | 256M | vfat | EFI ativa (bootloader) |
| p7 (/) | 5G | ext4 | Raiz montada como readonly |
| p8 (/var) | 5G | ext4 | Dados variáveis do sistema |
| p9 (/home) | ~resto | ext4 | Dados do usuário |

```terminal
$ sudo fdisk -l /dev/nvme0n1
Disk /dev/nvme0n1: 476.94 GiB, 512110190592 bytes, 1000215216 sectors
Disk model: ...
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disklabel type: gpt
Device            Start        End   Sectors   Size Type
/dev/nvme0n1p1      34      65569     65536    32M EFI System
/dev/nvme0n1p2   65570     131105     65536    32M EFI System
/dev/nvme0n1p3  131106     196641     65536    32M EFI System
/dev/nvme0n1p4  196642   10678785  10482144     5G Linux filesystem
/dev/nvme0n1p5 10678786   21148929  10470144     5G Linux filesystem
/dev/nvme0n1p6 21148930   21660129    511200   256M EFI System
/dev/nvme0n1p7 21660130   32149153  10489024     5G Linux filesystem
/dev/nvme0n1p8 32149154   42638177  10489024     5G Linux filesystem
/dev/nvme0n1p9 42638178 1000215215 957577038 456.6G Linux filesystem
```

O `fdisk` mostra a tabela GPT com setores e tamanhos exatos. As partições 1-3 são pequenas e relacionadas ao firmware/boot; 4-5 são slots A/B do sistema base; 6 é a EFI ativa; 7-8 são os mountpoints `/` e `/var`; e 9 absorve o resto do disco.

## O esquema A/B de atualização

As partições 4 e 5 (rootfs-A e rootfs-B) são dois slots de sistema. Quando o SteamOS recebe uma atualização, ela é instalada no slot inativo. Se o boot no slot novo falha, o firmware automaticamente tenta o slot antigo — é o mesmo mecanismo usado pelo Android e Chrome OS.

```terminal
$ sudo rauc status
=== System Info ===
Compatible:  steamdeck
Variant:    amd64
Booted from: A (rootfs.0)
Activated:  A (rootfs.0)
Slot rootfs.0:
  State:     booted
  Parent:    (none)
  Mountpoint: /
Slot rootfs.1:
  State:     good
  Parent:    (none)
```

O `rauc status` (disponível no modo recovery ou com ferramentas adicionais) mostra qual slot está ativo. Um slot com estado `booted` é o corrente; o outro com `good` significa que a atualização foi validada e está pronta para boot na próxima troca.

:::nota
O esquema A/B explica por que o sistema "imutável" pode ser atualizado: o slot inativo recebe a nova imagem, e um reboot troca os papéis. Se algo quebrar, o firmware detecta a falha e volta ao slot anterior automaticamente.
:::

## A raiz imutável e os overlays

A partição `/` (p7) é montada como `read-only`. Para permitir alterações (configurações de rede, pacotes instalados pelo usuário), o SteamOS usa um sistema de overlays (`overlayfs`) que redireciona escritas para `/var` (p8). É por isso que o reset de fábrica "limpa" o sistema sem regravar a imagem.

```terminal
$ mount | grep ' / '
/dev/nvme0n1p7 on / type ext4 (ro,relatime,errors=remount-ro)
```

A montagem `ro` confirma que `/` não pode ser alterada diretamente. Os overlays estão em `/var/lib/overlays/` e são gerenciados pelo sistema. Quando você instala um pacote com `pacman` ou edita um arquivo em `/etc`, a alteração vai para o overlay, não para a partição física.

```terminal
$ ls /var/lib/overlays/
etc  usr  var
```

Essas três pastas dentro de `/var/lib/overlays/` capturam alterações em `/etc`, `/usr` e `/var` respectivamente. Entender essa arquitetura é fundamental: se você corromper um overlay, pode estar a um reboot de perder todas as suas personalizações de sistema.

:::atencao
Alterar diretamente um arquivo na partição raiz requer remontá-la como `rw` (`sudo mount -o remount,rw /`), e a alteração será persistida na partição física, não no overlay. Isso raramente é necessário e pode deixar o sistema inconsistente com futuras atualizações A/B.
:::

## Redimensionando partições

Ao trocar o SSD por um maior, a partição 9 (`/home`) pode ser expandida para usar o espaço novo. O SteamOS não faz isso automaticamente — o recovery "Reimage" cria a tabela de fábrica e deixa o resto do disco para `/home`, mas se você clonou o disco com `dd`, a partição 9 termina no mesmo lugar de antes.

```terminal
$ sudo parted /dev/nvme0n1 unit GiB print free
```

O `parted` com `print free` mostra o espaço não alocado após a última partição. Para expandir a p9, use `sudo parted /dev/nvme0n1 resizepart 9 100%` e depois `sudo resize2fs /dev/nvme0n1p9` para expandir o sistema de arquivos.

:::dica
Redimensionar partições com o sistema em execução só funciona se for a última partição (p9) e se não houver partição depois. A p9 é sempre a última, então é segura para expandir a quente.
:::

## Resumo

- O layout padrão tem 9 partições GPT: p1-p3 para firmware/boot, p4-p5 slots A/B, p6 EFI, p7 `/`, p8 `/var`, p9 `/home`.
- O esquema A/B permite atualizações seguras com rollback automático em caso de falha.
- `/` é montada `read-only`; alterações vão para overlays em `/var/lib/overlays/`.
- A partição 9 (`/home`) absorve a maior parte do disco e pode ser redimensionada após troca de SSD.
- Consulte a tabela com `fdisk -l` ou `parted print free` antes de qualquer modificação.

## Exercícios

1. Execute `sudo fdisk -l /dev/nvme0n1` e copie a tabela de partições para seu caderno, anotando o propósito de cada partição.
2. Rode `mount | grep ' / '` e confirme que a raiz está montada como `ro`. Explique como o sistema aplica alterações mesmo assim.
3. Liste o conteúdo de `/var/lib/overlays/` e explique qual o destino de cada overlay.
4. Com `parted /dev/nvme0n1 unit GiB print free` (apenas leitura), localize quanto espaço livre existe após a última partição.
5. **Desafio.** Projete um plano de redimensionamento para um Steam Deck que teve o SSD trocado de 512 GB para 1 TB por clonagem com `dd`: quais comandos você usaria para expandir a p9 e o filesystem?