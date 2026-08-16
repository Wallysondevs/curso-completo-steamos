Nem tudo no disco do Steam Deck é `/`, `/var` ou `/home`. Há duas partições menores que cumprem papéis de bastidores: a **ESP** (EFI System Partition) que entrega o bootloader ao firmware, e a **swap** (ou ZRAM) que serve como memória extra comprimida. Elas são pequenas, mas quando somem, o Deck não liga — ou engasga com um jogo pesado.

:::objetivos
- Localizar a partição EFI e entender seu conteúdo
- Interpretar o papel da ESP no processo de boot
- Distinguir swap em disco de ZRAM em memória
- Diagnosticar swap com `swapon` e `free -h`
:::

## A partição EFI: uma portinha para o firmware

Toda placa UEFI (e o Steam Deck tem uma) espera encontrar uma **ESP** — uma partição formatada em FAT32, com tipo GPT `EF00`, que contém pelo menos um arquivo `.efi` de bootloader. No `lsblk` você viu:

```terminal
$ lsblk -f /dev/mmcblk0
NAME        FSTYPE FSVER LABEL       UUID
mmcblk0
├─mmcblk0p1 vfat   FAT16 esp         1234-ABCD
├─mmcblk0p2
├─mmcblk0p3 vfat   FAT32 efi         5678-EF01
├─mmcblk0p4 ext4   1.0   rootfs-A    aaaaaaaa-...
...
```

Há duas partições FAT aqui: `p1` (`esp`, 64 MB, FAT16) e `p3` (`efi`, 32 MB, FAT32). A `esp` contém o bootloader da Valve (e dados de firmware), enquanto a `efi` guarda entradas de boot específicas. Na prática, o que te interessa é que nenhuma delas deve ser mexida manualmente; o SteamOS as gerencia sozinho durante a instalação e as atualizações.

:::perigo
Apagar ou corromper a ESP (`mmcblk0p1` ou `mmcblk0p3`) pode deixar o Steam Deck sem boot. Se precisar limpar algo, use o volume manager do próprio SteamOS ou ferramentas como `efibootmgr` — nunca delete partições EFI à mão.
:::

## O que tem dentro da ESP

Monte (ou liste com o ponto de montagem existente) e veja:

```terminal
$ ls /esp
EFI/        steamos/        boot.scr        locks/
```

O conteúdo típico:

```text
/esp/
├── EFI/
│   ├── BOOT/BOOTX64.EFI     bootloader fallback UEFI
│   └── steamos/             entradas de boot do SteamOS
├── steamos/                 kernel, initramfs e configuração do sistema
│   ├── vmlinuz-a
│   ├── vmlinuz-b
│   ├── initramfs-a.img
│   └── initramfs-b.img
├── boot.scr                 script de boot U-Boot (modelos ARM)
└── locks/                   controle de partição ativa A/B
```

Os kernels e initramfs têm versões `-a` e `-b` porque o esquema A/B também se aplica ao boot: quando o sistema alterna entre as partições de root, o kernel correspondente é carregado da ESP. O arquivo `locks/` contém o indicador de qual partição (`A` ou `B`) deve ser inicializada.

## Swap: o que o Steam Deck usa

O Steam Deck tem RAM fixa (16 GB nos modelos OLED e nos LCD mais recentes) e usa **swap** para o caso de a memória física acabar. Mas, ao contrário do Linux de desktop típico, o SteamOS **não reserva uma partição de swap em disco**. Em vez disso, ele usa **ZRAM**: um dispositivo de bloco em RAM que comprime os dados antes de armazená-los.

```terminal
$ swapon --show
NAME       TYPE       SIZE USED PRIO
/dev/zram0 partition  5.8G  24M   100
```

Isso significa que o swap ocupa espaço da própria RAM, comprimido tipicamente em 3:1 ou mais com LZ4. O tamanho padrão é metade da RAM física. A vantagem: é extremamente rápido (swap em disco seria lento demais no eMMC) e não desgasta o armazenamento.

## Conferindo memória e swap com free -h

A visão mais direta de RAM + swap é o `free -h`:

```terminal
$ free -h
               total        used        free      shared  buff/cache   available
Mem:            14Gi       3.9Gi       6.1Gi        96Mi       4.8Gi        10Gi
Swap:          5.8Gi        24Mi       5.8Gi
```

- `Mem: total` é a RAM física (16 GB declarados como 14 GiB).
- `Swap: total` é o tamanho do ZRAM.
- `available` é a estimativa do kernel de quanta memória está realmente livre para um novo processo (considera caches que podem ser descartados).

Pouco swap em uso (24 MiB para 5.8 GiB disponíveis) é saudável: indica que o sistema não está sob pressão de memória. Se o swap usado bater consistentemente acima de 1 GB, é sinal de que um jogo ou processo está exigindo mais RAM do que o Deck tem.

:::dica
Quer ver as estatísticas de compressão do ZRAM? O kernel expõe tudo em `/sys/block/zram0/`:

```terminal
$ cat /sys/block/zram0/mm_stat
```
O campo `compr_data_size` mostra o tamanho real em RAM dos dados em swap; compare com `orig_data_size` para calcular a taxa de compressão.
:::

## O boot na prática

Juntando as peças: o firmware UEFI lê a ESP, carrega o bootloader, que por sua vez carrega o kernel (da ESP), o kernel monta o root (da partição A ativa), o root ativa ZRAM como swap, monta `/var` e `/home` (de suas partições), e o systemd dispara o resto. Sem a ESP, o processo nem começa; sem o ZRAM (swap), ele começa mas pode travar sob carga pesada.

```terminal
$ findmnt /esp
TARGET SOURCE        FSTYPE OPTIONS
/esp   /dev/mmcblk0p1 vfat   rw,relatime,fmask=...
```

A partição `/esp` é a única montagem FAT do sistema — outra razão pela qual ela se destaca no `mount`. FAT é usado aqui porque o firmware UEFI só entende FAT, não ext4 nem Btrfs.

## Resumo

- A ESP (FAT32, ~64 MB) contém bootloader, kernel, initramfs e controle A/B.
- Ela é essencial para o boot; apagá-la deixa o Deck sem ligar.
- O SteamOS usa ZRAM como swap, comprimindo dados na própria RAM.
- `swapon --show` confirma o dispositivo de swap; `free -h` mostra RAM+swap em uso.
- O esquema A/B também se aplica aos kernels e initramfs na ESP.

## Exercícios

1. Rode `lsblk -f` e localize as partições FAT. Qual delas é a ESP e qual é a EFI reservada?
2. Liste o conteúdo de `/esp` e identifique os arquivos de kernel (`vmlinuz-*`). Quantos há?
3. Execute `swapon --show` e `free -h`. Qual é o tamanho do swap e quanta RAM está realmente livre?
4. Leia o conteúdo de `/sys/block/zram0/orig_data_size` e `/sys/block/zram0/compr_data_size`. Qual é a taxa de compressão?
5. **Desafio.** Simule uma alta pressão de swap: abra várias abas pesadas no Firefox Flatpak até o swap começar a crescer em `free -h`. Depois feche tudo e veja o swap ser liberado.