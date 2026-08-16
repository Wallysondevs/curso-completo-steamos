Instalar um segundo sistema no disco interno do Deck exige redesenhar o mapa de partições, e é aqui que os acidentes acontecem. Uma partição apagada por engano pode levar junto a biblioteca de jogos inteira. Antes de encolher qualquer coisa, você precisa entender a tabela GPT, o esquema A/B do SteamOS e onde exatamente é seguro cortar.

:::objetivos
- Ler a tabela de partições com `parted` e interpretar o layout A/B do SteamOS
- Planejar o espaço necessário para Windows e para outra distro Linux
- Redimensionar a partição `home` para liberar espaço sem perder dados
- Criar a ESP, partições NTFS e Btrfs com o comando `parted`
- Proteger os dados com um backup antes de qualquer alteração
:::

## Conhecendo o terreno com `parted`

O `lsblk` mostra tamanhos; o `parted` mostra o mapa de partições com os setores e o tipo de cada uma. O disco do Deck usa **GPT** (*GUID Partition Table*), o padrão moderno que substituiu o MBR.

```terminal
$ sudo parted /dev/nvme0n1 print
Model: Samsung SSD 990 EVO 500GB (nvme)
Disk /dev/nvme0n1: 500GB
Sector size (logical/physical): 512B/512B
Partition Table: gpt
Disk Flags:

Number  Start   End     Size    File system  Name  Flags
 1      4096B   68,7MB  68,7MB  fat32             esp   boot, esp
 2      68,7MB  102MB   33,6MB                    efi-a
 3      102MB   136MB   33,6MB                    efi-b
 4      136MB   5339MB  5203MB  ext4              rootfs-a
 5      5339MB  10,5GB  5203MB  ext4              rootfs-b
 6      10,5GB  10,8GB  268MB                     var-a
 7      10,8GB  11,1GB  268MB                     var-b
 8      11,1GB  500GB   489GB   ext4              home
```

Repare no padrão: as partições `a` e `b` têm o mesmo tamanho. É o esquema de atualização atômica — enquanto você usa a `rootfs-a`, uma atualização pode ser gravada na `rootfs-b` e ativada na próxima reinicialização. Essas partições pequenas (`rootfs`, `efi`, `var`) são **intocáveis**. O único candidato a ceder espaço é a `home`, a partição 8, que é enorme e guarda jogos, saves e o que você instala em Flatpak.

## Quanto espaço liberar

O tamanho que você reserva para o segundo sistema depende do que ele fará:

| Sistema | Mínimo confortável | Com jogos |
|---|---|---|
| Windows 11 | 80–100 GB | 200 GB ou mais |
| Windows 10 | 60 GB | 150 GB |
| Distro Linux (uso geral) | 40 GB | 100 GB |
| Bazzite/Fedora para jogos | 60 GB | 200 GB |

O Windows é o mais guloso: o sistema sozinho passa dos 30 GB, e atualizações e jogos empurram o uso para cima depressa. Se o seu caso é Windows para dois ou três títulos incompatíveis com Proton, comece em 120 GB e ajuste. Uma distro Linux de uso geral vive confortável em 40 GB, mas qualquer coisa com Flatpak e Steam incha rápido.

:::dica
Antes de decidir o tamanho, olhe o que já ocupa o `home`:

```terminal
$ df -h /home
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p8  489G  312G  177G  44% /home
```

Deixe sempre uma folga de 10–15% na partição do SteamOS, além do espaço do jogo novo previsto. Disco cheio demais começa a perder desempenho em Btrfs/ext4 com múltiplas escritas.
:::

## Backup antes de tocar no disco

Nenhuma ferramenta redimensiona partição de forma 100% garantida. Um pico de energia no meio do processo pode corromper o sistema de arquivos. A regra é uma só:

:::perigo
Redimensionar partições **pode destruir dados** em caso de falha (queda de energia, cabo solto, bug de driver). Faça backup do que não pode perder antes de executar `parted`, `gparted` ou qualquer utilitário de reparticionamento. Não há "desfazer" depois que o disco foi reescrito.
:::

O caminho mais simples é copiar os arquivos importantes para um disco externo:

```terminal
$ rsync -av --progress ~/ /run/media/deck/BackupHD/home/
```

Para um retrato completo e restaurável do sistema, vale estudar `btrfs send`/`receive` ou uma imagem com `dd` — mas eu começaria pelo `rsync` dos diretórios que têm valor (jogos podem ser baixados de novo; saves, configs e projetos, muitas vezes não).

## Redimensionando a `home`

O redimensionamento é feito com o sistema desligado, porque não se pode encolher ao vivo a partição montada. O jeito mais à prova de erro é usar um **live USB** de qualquer distribuição (ou o próprio pendrive de recovery do SteamOS) e o `gparted`, que faz o trabalho gráfico. Pela linha de comando, a sequência é:

```terminal
## 1) desmontar a partição home (a partir de um live USB)
# umount /home

## 2) verificar o sistema de arquivos antes
# e2fsck -f /dev/nvme0n1p8

## 3) encolher o ext4 para 260 GB (e os dados acompanham)
# resize2fs /dev/nvme0n1p8 260G

## 4) encolher a partição GPT no mesmo tamanho
# parted /dev/nvme0n1 resizepart 8 270GB
```

A ordem importa: primeiro o sistema de arquivos (`resize2fs`), depois a partição (`resizepart`), e sempre deixando a partição alguns GB **maior** que o sistema de arquivos para não truncar dados. Errar essa ordem é a causa número um de perda de dados em dual boot.

:::atencao
O `resize2fs` aceita encolher **somente** sistemas de arquivos desmontados — e ext4. O `home` do SteamOS é ext4, então funciona. Mas se você formatou o `home` como Btrfs em algum setup alternativo, o comando é outro (`btrfs filesystem resize`), e o encolhimento online tem restrições. Confira o sistema de arquivos real com `lsblk -f` antes de escolher a ferramenta.
:::

## Criando as novas partições

Com o espaço livre criado no fim do disco, você grava as partições do novo sistema. Para o Windows, uma única partição NTFS costuma bastar:

```terminal
# parted /dev/nvme0n1 mkpart primary ntfs 270GB 470GB
# parted /dev/nvme0n1 set 9 msftdata on
```

Para uma distro Linux, o padrão é separar a ESP (ou reaproveitar a existente), uma raiz e, opcionalmente, um home:

```terminal
## raiz do segundo Linux (ext4 ou btrfs)
# parted /dev/nvme0n1 mkpart primary ext4 270GB 350GB
# parted /dev/nvme0n1 mkpart primary ext4 350GB 400GB
```

A decisão entre **reaproveitar a ESP** ou **criar uma nova** merece atenção. A ESP do Deck tem só 64 MB, e empilhar três boot managers ali (SteamOS + Windows + Linux) pode estourar o espaço. Muitos guias de dual boot preferem deixar a ESP original intacta e criar uma ESP dedicada, maior, para o segundo sistema — o firmware lê qualquer ESP. Quando criar, marque a flag `boot, esp`:

```terminal
# parted /dev/nvme0n1 set 9 boot on
# parted /dev/nvme0n1 set 9 esp on
```

:::info
A diferença entre `mkpart primary` e `mkpart` com flag explícita é cosmética no GPT — o `parted` preserva os nomes por compatibilidade com discos MBR antigos, mas toda partição GPT é "primária" na prática. O que importa são as flags e, sobretudo, o sistema de arquivos que você grava por cima com `mkfs.ntfs` ou `mkfs.ext4`.
:::

## Verificando o resultado

Depois de criar as partições, grave os sistemas de arquivos e confira:

```terminal
# mkfs.ntfs -Q -L win_games /dev/nvme0n1p9
# mkfs.ext4 -L fedora_root /dev/nvme0n1p10
# lsblk -o NAME,SIZE,FSTYPE,LABEL /dev/nvme0n1
NAME          SIZE FSTYPE LABEL
nvme0n1p8    260G   ext4
nvme0n1p9    200G   ntfs   win_games
nvme0n1p10    80G   ext4   fedora_root
```

O disco está pronto para receber os instaladores, que escreverão seus arquivos nas partições recém-criadas — assunto da [instalação do Windows](#/cap-062/sec-03) e do [segundo Linux](#/cap-062/sec-04).

## Resumo

- O layout A/B do SteamOS faz das partições `esp`, `efi`, `rootfs` e `var` áreas intocáveis; só a `home` cede espaço.
- Use `parted print` para ver o mapa GPT e `df -h /home` para dimensionar o corte.
- Redimensione primeiro o sistema de arquivos (`resize2fs`) e depois a partição (`resizepart`), com folga entre os dois.
- Windows pede 80–200 GB em NTFS; uma distro Linux de jogos pede 60–200 GB em ext4/Btrfs.
- Reaproveite a ESP (64 MB) com cuidado ou crie uma ESP dedicada maior para o segundo sistema.

## Exercícios

1. Rode `sudo parted /dev/nvme0n1 print` e descreva, em uma frase, o propósito de cada partição numerada.
2. Com `df -h /home` e `lsblk -f`, determine quanto espaço você poderia liberar com segurança na sua máquina (não execute nada).
3. Monte um live USB, rode `e2fsck -f` numa partição ext4 **secundária** (não a do sistema) e observe sem redimensionar.
4. Num pendrive de teste, use `parted` para criar uma tabela GPT, duas partições de tamanhos diferentes e grave `mkfs.ext4` e `mkfs.ntfs` em cada uma.
5. **Desafio.** Simule o plano completo de particionamento da sua máquina em texto: partição a encolher, novo tamanho do `resize2fs`, novo limite do `resizepart`, e as linhas `parted mkpart` para cada novo sistema — com valores coerentes com o `parted print` que você obteve no exercício 1.
