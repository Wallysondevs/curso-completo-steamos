Montar um disco exige saber qual dispositivo `/dev/` corresponde à partição certa. Nomes como `/dev/sda1` são convenientes no terminal, mas mudam conforme a ordem de detecção do hardware — e em máquinas com várias portas USB-C, isso acontece o tempo todo. Esta seção ensina a inspecionar discos, partições e seus metadados únicos com três ferramentas: `lsblk`, `blkid` e `fdisk`.

:::objetivos
- Usar `lsblk` com diferentes opções para inspecionar a hierarquia de discos
- Extrair UUIDs, rótulos e tipos de sistema de arquivos com `blkid`
- Listar partições e tabelas de partição com `fdisk`
- Saber quando confiar em UUID, rótulo ou PARTUUID para identificar um disco
- Identificar discos recém-conectados sem precisar vasculhar `/dev` manualmente
:::

## lsblk: a árvore em uma olhada

O `lsblk` (de *list block*) é o primeiro comando depois de conectar um disco. Sem argumentos, ele imprime a hierarquia de dispositivos de bloco como uma árvore:

```terminal
$ lsblk
NAME        MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
nvme0n1     259:0    0 953.9G  0 disk
├─nvme0n1p1 259:1    0   260M  0 part /esp
├─nvme0n1p2 259:2    0    64M  0 part /efi
└─nvme0n1p3 259:3    0 953.6G  0 part /home
sda          8:0    0 476.9G  0 disk
└─sda1       8:1    0 476.9G  0 part /run/media/ana/DADOS
```

A coluna `RM` (removable) com `1` indica mídia removível — útil para distinguir pendrives e discos USB de armazenamento fixo. A coluna `RO` diz se é somente leitura. Mas `lsblk` faz mais com as opções certas. A mais útil é `-f`, que acrescenta sistema de arquivos, UUID e rótulo:

```terminal
$ lsblk -f /dev/sda
NAME FSTYPE FSVER LABEL  UUID                                 FSAVAIL FSUSE% MOUNTPOINTS
sda1 exfat  1.0   DADOS  B2F4-1A08                             200.3G    58% /run/media/ana/DADOS
```

Aqui aparece o UUID do exFAT (`B2F4-1A08`), que não segue o formato longo do ext4. O campo `FSAVAIL` mostra espaço livre; `FSUSE%` dá o percentual de ocupação.

:::dica
`lsblk -o NAME,SIZE,TYPE,MOUNTPOINTS,FSTYPE,UUID,LABEL` permite montar uma coluna exatamente com os campos que você precisa. É ótimo para scripts onde você quer apenas UUIDs e pontos de montagem.
:::

## blkid: o RG da partição

Enquanto `lsblk` lê do sysfs e do udev, o `blkid` consulta o **atributo de bloco** diretamente do disco. Ele funciona até para discos que ainda não estão montados — desde que o kernel consiga ler os primeiros setores. Por isso é a ferramenta mais confiável para descobrir UUIDs de discos recém-conectados.

```terminal
$ sudo blkid /dev/sda1
/dev/sda1: LABEL="DADOS" UUID="B2F4-1A08" BLOCK_SIZE="512" TYPE="exfat" PARTUUID="a1b2c3d4-01"
```

Aqui `TYPE` é o sistema de arquivos detectado pelo kernel. O `PARTUUID` é um identificador da **partição** dentro da tabela de partições (GPT), diferente do `UUID` que identifica o sistema de arquivos. Para montagem via `fstab`, você pode usar tanto `UUID=` quanto `PARTUUID=`, mas `UUID` é mais portátil porque sobrevive a alterações na tabela de partições.

Para listar todos os dispositivos de uma vez:

```terminal
$ sudo blkid
/dev/nvme0n1p1: UUID="3f2b91ac-77de-4c15-9f0e-4a2d1c8b5e71" BLOCK_SIZE="4096" TYPE="ext4" PARTLABEL="esp" PARTUUID="c1d2e3f4-01"
/dev/nvme0n1p3: LABEL="rootfs" UUID="8a7b3c91-dd4e-4f12-a01b-5c3e9f2d6a11" BLOCK_SIZE="4096" TYPE="ext4" PARTUUID="c1d2e3f4-03"
/dev/sda1: LABEL="DADOS" UUID="B2F4-1A08" BLOCK_SIZE="512" TYPE="exfat" PARTUUID="a1b2c3d4-01"
```

## fdisk: a tabela de partições

O `fdisk` tradicionalmente serve para criar e apagar partições, mas também é uma ferramenta só de leitura excelente para inspecionar a tabela de partições de um disco:

```terminal
$ sudo fdisk -l /dev/sda
Disk /dev/sda: 476.94 GiB, 512110190592 bytes, 1000215216 sectors
Disk model: Samsung PSSD T7
Units: sectors of 1 * 512 = 512 bytes
Sector size (logical/physical): 512 bytes / 512 bytes
I/O size (minimum/optimal): 512 bytes / 512 bytes
Disklabel type: gpt
Disk identifier: A1B2C3D4-E5F6-7890-ABCD-EF1234567890

Device     Start        End    Sectors   Size Type
/dev/sda1   2048 1000213167 1000211120 476.9G Microsoft basic data
```

A linha `Disk model` mostra o nome humano do dispositivo (aqui um SSD Samsung T7). `Disklabel type: gpt` indica tabela GPT — esperada para discos modernos. A coluna `Type` mostra o tipo da partição conforme a especificação; "Microsoft basic data" é típico de discos formatados em Windows.

:::atencao
`fdisk -l` sem `sudo` pode não mostrar todos os discos, porque acessar o dispositivo de bloco exige privilégios de leitura que pertencem ao grupo `disk`. Se o comando sair em branco ou mostrar "Permission denied", execute com `sudo`.
:::

## UUID, rótulo e PARTUUID: qual escolher

| Identificador | Vive em | Exemplo | Quando usar |
|---|---|---|---|
| `UUID=` | Sistema de arquivos | `B2F4-1A08` (exFAT), `3f2b...5e71` (ext4) | fstab, 99% dos casos |
| `PARTUUID=` | Tabela de partições (GPT) | `a1b2c3d4-01` | Discos clonados onde UUID coincide |
| `LABEL=` | Sistema de arquivos | `DADOS` | Fácil de lembrar, mas colidível |
| `/dev/sdX` | Kernel (dinâmico!) | `/dev/sda1` | Montagem manual rápida; nunca em fstab |

O UUID é gerado no momento da formatação e permanece o mesmo até a partição ser reformatada. Ele é a escolha mais segura para referências persistentes. O rótulo é amigável para humanos mas pode colidir se você tiver dois discos com o mesmo nome. O PARTUUID do GPT é uma alternativa para situações específicas como discos clonados — dois discos clonados herdam o mesmo UUID do sistema de arquivos, mas terão PARTUUIDs diferentes.

## Resumo

- `lsblk` mostra a hierarquia disco → partição → ponto de montagem em formato de árvore.
- `lsblk -f` acrescenta sistema de arquivos, UUID, rótulo e espaço livre.
- `blkid` consulta metadados direto do disco, funciona sem montar a partição.
- `fdisk -l` expõe a tabela de partições (GPT/MBR), o modelo do disco e o tipo de cada partição.
- `UUID=` é o identificador preferido para montagem persistente; `/dev/sdX` é volátil e pode mudar.
- Rótulos (`LABEL=`) são amigáveis mas não garantem unicidade.

## Exercícios

1. Conecte dois pendrives ou um disco USB e rode `lsblk -f`. Compare os UUIDs: algum deles é do tipo curto (exFAT/FAT) e o outro do tipo longo (ext4/NTFS)?
2. Use `sudo blkid` e encontre uma partição que aparece em `lsblk` mas que não está montada. Qual é o `TYPE` dela?
3. Execute `sudo fdisk -l /dev/sda` (substituindo pelo disco correto). O disco usa GPT ou MBR? Qual é o tipo da primeira partição?
4. Com o disco conectado, extraia o UUID e o PARTUUID da partição principal. Escreva as duas linhas que usariam cada um desses identificadores numa entrada de fstab.
5. **Desafio.** Escreva um comando de uma linha que use `lsblk -o` para listar apenas nome, tamanho, tipo e ponto de montagem, filtrando por discos removíveis (dica: use `lsblk -o NAME,SIZE,TYPE,RM,MOUNTPOINTS` e filtre com `grep` ou `awk`).