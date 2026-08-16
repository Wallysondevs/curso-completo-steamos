Os jogos consomem dezenas de gigabytes, mas o sistema operacional do Deck cabe em menos de 5 GB — e mesmo assim sobrevive a atualizações que poderiam inutilizar a máquina. O segredo está em três decisões sobre como o disco é organizado: partições A/B, squashfs readonly e overlayfs. Entender o layout de partições do Deck é o que permite recuperar uma máquina que "não dá boot" sem perder a biblioteca de jogos.

:::objetivos
- Compreender o esquema de partições A/B e o mecanismo de rollback
- Identificar os sistemas de arquivos usados no Deck: ext4, squashfs, overlayfs e Btrfs
- Listar partições com `lsblk -f` e `findmnt`
- Entender o papel de swap via zram e a ausência de partição swap
- Diferenciar o que é imutável do que é persistente no disco do Deck
:::

## A/B root: duas partições, uma ativa

O esquema **A/B root** consiste em duas partições de sistema idênticas — `root-A` e `root-B`. Apenas uma está ativa em cada boot; a outra recebe a **próxima atualização**. Quando a Valve publica uma nova versão do SteamOS, ela é gravada na partição inativa, e o bootloader é configurado para tentar iniciar por ela. Se o boot falhar (kernel panic, falha de verificação, crash antes do modo gráfico), o firmware detecta a falha e rebota na partição anterior.

Esse design resolve o pior cenário de uma atualização de sistema: a máquina que não liga mais e exige um pendrive de recuperação. No Deck, uma atualização quebrada significa um reboot de 30 segundos de volta à versão funcional, sem perder `/home` nem os jogos. O custo é o dobro do espaço para o sistema — mas como cada partição root pesa cerca de 5 GB, é um custo baixo.

```terminal
$ lsblk -f
NAME   FSTYPE   FSVER LABEL        UUID                                 FSAVAIL FSUSE% MOUNTPOINTS
nvme0n1
├─nvme0n1p1 vfat  FAT32 esp          67E3-2FD1                              60M    10% /efi
├─nvme0n1p2 squashfs 4.0  rootfs-a    3f2b91ac-77de-4c15-9f0e-4a2d1c8b5e71      0   100% /
├─nvme0n1p3 squashfs 4.0  rootfs-b    a1c4d8e2-33bf-41a7-9d10-7e6f3a5b2c91      0   100% 
├─nvme0n1p4 ext4     1.0  var         d9e2b4f1-88ac-4e3d-9b50-1c7f8a4d2e36  128M    50% /var
└─nvme0n1p5 ext4     1.0  home        5a3c7f1e-99bd-4f2a-b3d1-8e4c6a9b2d77  400G    60% /home
```

Na saída do `lsblk -f` num Deck típico, `nvme0n1p2` e `nvme0n1p3` são `rootfs-a` e `rootfs-b`. Repare no `FSUSE% 100%` em ambas: são partições **squashfs**, somente-leitura. A que está montada em `/` é a ativa; a outra está vazia (sem ponto de montagem) e aguarda a próxima atualização. A ESP (`p1`, vfat) tem o bootloader, e `/home` (`p5`, ext4) guarda tudo que é seu.

## ext4, squashfs e overlayfs: cada um no seu papel

O **ext4** é o sistema de arquivos padrão do Linux para dados mutáveis: journaling maduro, recuperação rápida após queda de energia e desempenho previsível. No Deck, ele é usado na partição `/home` (seus arquivos, saves, biblioteca Steam) e em `/var` (logs, cache, estado de serviços). É o lugar onde tudo muda.

O **squashfs** é um sistema de arquivos **somente-leitura**, comprimido. As partições root do Deck (`root-A` e `root-B`) usam squashfs: o sistema inteiro, com seus binários, bibliotecas e configurações, é um único bloco comprimido que não pode ser alterado. Um rootfs de 5 GB em squashfs ocupa menos no disco e é montado diretamente como leitura — qualquer tentativa de escrever nele falha.

O **overlayfs** é a camada que junta o readonly com o writable. Ele monta um sistema de arquivos de **lower** (squashfs, readonly) com um **upper** (diretório ou partição writable) e produz um único ponto de montagem que parece normal. O Deck usa overlayfs sobre `/` para permitir alterações temporárias durante a sessão — instalar um pacote com `pacman`, criar um arquivo em `/etc` — sem tocar na imagem squashfs.

```terminal
$ mount | grep overlay
overlay on / type overlay (rw,relatime,lowerdir=/dev/nvme0n1p2,upperdir=/var/lib/overlay/upper,workdir=/var/lib/overlay/work)
```

A linha mostra o overlay montado na raiz: o `lowerdir` é a partição squashfs (readonly), e o `upperdir` vive em `/var` (que é ext4, writable). Toda alteração vai para o upper, e o lower permanece intocado. No próximo boot, o upper é limpo — as alterações são efêmeras. É por isso que instalar um pacote com `pacman` no Deck sobrevive ao reboot, mas uma atualização de sistema oficial apaga o upper e recria tudo a partir do novo squashfs.

:::atencao
A efemeridade do overlayfs significa que editar arquivos em `/etc` diretamente **não** sobrevive a uma atualização de sistema da Valve. Para configurações persistentes, coloque arquivos em `/etc` que o sistema lê de `/var` ou use sobreposições específicas do SteamOS (o diretório `/etc/overlay/`). Brincar com o overlay sem entender o ciclo de vida pode sumir com configurações.
:::

## EFI System Partition e o layout completo

A **EFI System Partition (ESP)** é a partição FAT32 onde moram os bootloaders. No Deck, ela é montada em `/efi` e contém o bootloader da Valve e o firmware UEFI. Sem a ESP, a máquina não inicia — mas com 64 MB ela é minúscula e nunca é o gargalo de espaço.

```terminal
$ df -h
Filesystem      Size  Used Avail Use% Mounted on
overlay         4.6G  4.6G     0 100% /
/dev/nvme0n1p4  256M  128M  128M  50% /var
/dev/nvme0n1p5  900G  500G  400G  56% /home
/dev/nvme0n1p1   64M   60M  4.0M  94% /efi
```

O `df -h` mostra o layout em números: `/` com 4,6 GB (tudo ocupado, porque squashfs), `/var` com 256 MB (metade livre para o upper do overlay), `/home` com o resto do disco e `/efi` com 64 MB quase cheios. A partição `/home` é o único lugar com espaço de verdade — por isso tudo que você baixa, seja jogo, Flatpak ou mídia, vai para lá.

```terminal
$ findmnt
TARGET  SOURCE     FSTYPE   OPTIONS
/       overlay    overlay  rw,relatime,lowerdir=...,upperdir=...,workdir=...
├─/efi  /dev/nvme0n1p1 vfat rw,relatime,fmask=0022,dmask=0022
├─/var  /dev/nvme0n1p4 ext4 rw,relatime
└─/home /dev/nvme0n1p5 ext4 rw,relatime
```

O `findmnt` mostra a árvore de montagem num formato limpo, revelando o relacionamento hierárquico. `/efi`, `/var` e `/home` são montagens diretas; `/` é o overlay.

## Btrfs: o que não está (mas poderia estar)

O **Btrfs** é um sistema de arquivos moderno com snapshots, compressão, **COW** (*copy-on-write*) e desduplicação. Ele é o padrão de sistemas imutáveis como o Fedora Silverblue e o openSUSE MicroOS, mas **não** é usado no Deck. A Valve escolheu ext4 + squashfs + overlayfs para o modelo imutável do SteamOS, uma combinação mais simples e com menos histórico de bugs em cenários de atualização atômica.

Por que mencioná-lo, então? Porque quem vê a palavra "imutável" associada ao SteamOS costuma associar automaticamente a Btrfs, já que os dois conceitos andam juntos em muitas distribuições. No Deck, a imutabilidade vem de squashfs, não de snapshots Btrfs. Se você formatar um cartão SD, pode escolher ext4 ou Btrfs — mas o sistema interno é ext4 puro para dados mutáveis.

:::nota
O cartão SD do Deck é formatado em ext4 por padrão, com suporte a case-folding (para compatibilidade com jogos Windows). Você pode reformatar com Btrfs se quiser compressão, mas o case-folding do Btrfs é menos testado no cenário Proton; por isso o padrão da Valve é ext4 também no SD.
:::

## Swap e zram: compressão em RAM, não em disco

O Deck **não** tem partição de swap tradicional. Em vez de reservar gigabytes do SSD para troca de páginas, ele usa **zram** — um dispositivo de swap que comprime dados em RAM. Funciona assim: quando a RAM aperta, páginas menos usadas são comprimidas (em vez de escritas no disco) e mantidas na própria RAM comprimida. Como a compressão é rápida e atinge taxas de 3:1 ou mais, o custo de CPU é pago com juros em latência: descomprimir de RAM é muito mais rápido do que ler do SSD.

```terminal
$ swapon --show
NAME       TYPE       SIZE USED PRIO
/dev/zram0 partition  7.2G   0B  100
$ zramctl
NAME       ALGORITHM DISKSIZE  DATA COMPR TOTAL STREAMS MOUNTPOINT
/dev/zram0 lz4           7.2G    0B    0B    0B       4 [SWAP]
```

O `swapon --show` confirma que o único swap ativo é `zram0` — e está zerado, porque o Deck tem RAM suficiente para a maioria dos cenários. O `zramctl` detalha: o algoritmo de compressão é `lz4` (rápido, boa taxa), o tamanho alocado é metade da RAM (7,2 GB num modelo de 16 GB), e há 4 streams paralelas (uma por núcleo efetivo). A coluna `COMPR` com 0B mostra que nada foi comprimido até agora — o que é normal em uso leve.

:::dica
Se você estiver num modelo de 64 GB (eMMC), o zram é ainda mais importante: além de ser mais rápido, evita desgaste de células flash com escrita de swap. A decisão da Valve de usar zram sem swap em disco é uma das razões pelas quais o modelo de 64 GB sobreviveu bem mesmo com tão pouco espaço.
:::

## Resumo

- O esquema A/B root mantém duas partições squashfs; a inativa recebe a atualização e o boot retorna à anterior se falhar.
- ext4 é usado em `/home` e `/var` para dados mutáveis com journaling maduro.
- squashfs compacta o rootfs readonly; overlayfs junta squashfs (lower) com upper writable para alterações efêmeras.
- A ESP é a partição FAT32 de boot; o layout típico inclui ESP, root-A, root-B, `/var` e `/home`.
- Btrfs não é usado no Deck; a imutabilidade vem de squashfs, não de snapshots.
- O Deck usa zram (swap comprimido em RAM) em vez de partição swap, com algoritmo lz4 e streams paralelas.

## Exercícios

1. Rode `lsblk -f` no seu Deck e identifique as partições squashfs. Qual delas está montada em `/` e qual está sem montagem?
2. Execute `df -h` e anote o tamanho e uso de cada partição. A partição root está em 100% conforme o esperado para squashfs?
3. Rode `mount | grep overlay` e identifique os caminhos de `lowerdir` e `upperdir`. O que acontece se você criar um arquivo em `/etc/teste` e reiniciar?
4. Execute `swapon --show` e `zramctl`. Qual é o algoritmo de compressão e qual a proporção do tamanho do zram em relação à RAM total?
5. **Desafio.** Compare o layout do Deck com o de um sistema imutável moderno (Fedora Silverblue). Quais tecnologias cumprem o mesmo papel em cada um? Relacione squashfs+overlayfs com Btrfs snapshots e explique por que a Valve escolheu o caminho que escolheu.