O modo "Rescue" da imagem de recuperação é um terminal Linux completo, com acesso total ao disco e às ferramentas de particionamento. Quando a interface gráfica não resolve — seja porque a tabela de partições está corrompida, porque a EFI sumiu ou porque você quer controlar exatamente o layout — é aqui que se trabalha. O terminal do recovery expõe `parted`, `sgdisk`, `mkfs`, `dd` e todo o ferramental de bloco do Linux.

:::objetivos
- Acessar o terminal de recuperação e identificar os dispositivos
- Recriar a tabela de partições manualmente com `parted` e `sgdisk`
- Formatar e restaurar sistemas de arquivos corrompidos
- Reconstruir a partição EFI e o bootloader
:::

## Entrando no terminal de recuperação

No menu de boot do recovery, escolha "Rescue (terminal)". O sistema carrega um ambiente mínimo com kernel, bash e as ferramentas de bloco padrão do Linux. O teclado virtual aparece na tela; um teclado USB físico é altamente recomendado.

```terminal
steamdeck-recovery ~ # lsblk -o NAME,SIZE,FSTYPE,MOUNTPOINTS
NAME        SIZE FSTYPE MOUNTPOINTS
nvme0n1   476.9G
├─nvme0n1p1  64M
├─nvme0n1p2  32M
├─nvme0n1p3  32M
├─nvme0n1p4   5G
├─nvme0n1p5   5G
├─nvme0n1p6 256M vfat
├─nvme0n1p7   5G ext4
├─nvme0n1p8   5G ext4
└─nvme0n1p9 456.6G ext4
```

O shell do recovery roda como root (`#`). O primeiro comando deve ser `lsblk` para confirmar que o NVMe está visível e para inspecionar a tabela corrente. Se as partições estão presentes mas vazias (sem `FSTYPE`), você está diante de um disco que precisa ser reconstruído.

## Recriando a tabela de partições com parted

Se a tabela GPT estiver corrompida ou você quiser recriar manualmente (ex: ao trocar o SSD), o `parted` é a ferramenta interativa. O layout padrão do SteamOS pode ser reproduzido com uma sequência de comandos.

```terminal
steamdeck-recovery ~ # parted -s /dev/nvme0n1 mklabel gpt
steamdeck-recovery ~ # parted -s /dev/nvme0n1 \
  mkpart primary 1MiB 65MiB \
  mkpart primary 65MiB 97MiB \
  mkpart primary 97MiB 129MiB \
  mkpart primary 129MiB 5249MiB \
  mkpart primary 5249MiB 10369MiB \
  mkpart primary 10369MiB 10625MiB \
  mkpart primary 10625MiB 15625MiB \
  mkpart primary 15625MiB 20625MiB \
  mkpart primary 20625MiB 100%
```

O `mklabel gpt` cria uma tabela GPT vazia. Os `mkpart` subsequentes definem as 9 partições com tamanhos aproximados aos de fábrica. A partição 9 usa `100%` para ocupar o resto do disco — prática idêntica à do recovery oficial.

:::atencao
Os tamanhos acima são aproximados (setores 1MiB-alinhados). Para uma réplica exata do layout de fábrica, prefira `sgdisk` com backup da tabela original, como mostrado a seguir.
:::

## Usando sgdisk para clonar e restaurar tabelas

O `sgdisk` (parte do pacote `gptfdisk`) permite fazer backup e restore da tabela de partições como arquivo binário. Se você tem um Steam Deck funcionando, pode salvar a tabela e usá-la para recriar o layout exato depois.

```terminal
# No aparelho funcional, salve a tabela:
$ sudo sgdisk --backup=partition-table.bin /dev/nvme0n1

# No recovery, restaure:
steamdeck-recovery ~ # sgdisk --load-backup=partition-table.bin /dev/nvme0n1
steamdeck-recovery ~ # sgdisk -G /dev/nvme0n1   # randomiza GUIDs únicos
```

A restauração recria as partições com os mesmos setores de início e fim, mesmos tipos e mesmos nomes. O `-G` randomiza os GUIDs de partição — necessário porque dois discos não podem ter GUIDs idênticos no mesmo sistema.

:::dica
Guarde uma cópia da `partition-table.bin` junto com seus backups. Se o SSD morrer e você comprar um novo, bastam dois comandos para recriar a estrutura exata: `sgdisk --load-backup` seguido de `sgdisk -G`.
:::

## Formatando sistemas de arquivos

Depois de recriar as partições, é preciso formatar cada uma com o filesystem correto. As partições EFI (p1, p2, p3, p6) usam `vfat`; as demais (p4, p5, p7, p8, p9) usam `ext4`.

```terminal
steamdeck-recovery ~ # mkfs.vfat -F 32 /dev/nvme0n1p6
steamdeck-recovery ~ # mkfs.ext4 -F /dev/nvme0n1p7
steamdeck-recovery ~ # mkfs.ext4 -F /dev/nvme0n1p8
steamdeck-recovery ~ # mkfs.ext4 -F /dev/nvme0n1p9
```

As partições 1-3 não precisam de formatação — são usadas pelo firmware diretamente e serão populadas pela imagem de recuperação. As partições 4 e 5 (slots A/B) também são populadas pela imagem, não formatadas manualmente.

```terminal
steamdeck-recovery ~ # mount /dev/nvme0n1p7 /mnt
steamdeck-recovery ~ # mount /dev/nvme0n1p8 /mnt/var
steamdeck-recovery ~ # mount /dev/nvme0n1p9 /mnt/home
steamdeck-recovery ~ # mount /dev/nvme0n1p6 /mnt/efi
```

Montar as partições recém-formatadas permite verificar que tudo está acessível. Mas atenção: neste ponto os diretórios ainda estão vazios — a imagem do sistema ainda precisa ser extraída.

## Reconstruindo a partição EFI

Se a EFI foi corrompida e o sistema não inicia, é possível reconstruí-la manualmente. Os arquivos de bootloader (systemd-boot) precisam estar na partição 6 com a estrutura de diretórios correta.

```terminal
steamdeck-recovery ~ # mkdir -p /mnt/efi/EFI/BOOT
steamdeck-recovery ~ # cp /usr/lib/systemd/boot/efi/systemd-bootx64.efi /mnt/efi/EFI/BOOT/bootx64.efi
steamdeck-recovery ~ # efibootmgr --create --disk /dev/nvme0n1 --part 6 \
  --label "SteamOS" --loader '\EFI\BOOT\bootx64.efi'
```

O `efibootmgr` registra a entrada no firmware UEFI. Sem essa entrada, o firmware não sabe de qual partição carregar o bootloader, mesmo que os arquivos estejam presentes. O caminho usa backslashes (notação UEFI), não barras normais do Linux.

:::atencao
O caminho no `efibootmgr` deve usar `\` (backslash) como delimitador — é o formato que a UEFI espera. Usar `/` aqui resulta em entrada de boot que não funciona.
:::

## Restaurando as imagens do sistema

As partições 4 e 5 contêm as imagens do sistema base (`rootfs`). Elas são populadas pelo script de recovery a partir de arquivos dentro da própria imagem ISO. No modo manual, você pode copiá-las do pendrive:

```terminal
steamdeck-recovery ~ # mount /dev/sda1 /mnt/usb
steamdeck-recovery ~ # dd if=/mnt/usb/rootfs-A.img of=/dev/nvme0n1p4 bs=4M status=progress
steamdeck-recovery ~ # dd if=/mnt/usb/rootfs-B.img of=/dev/nvme0n1p5 bs=4M status=progress
```

Esses arquivos `.img` vêm dentro da ISO de recuperação. Se você estiver usando a imagem oficial, o modo "Reimage" faz isso automaticamente — o procedimento manual acima é para situações de emergência ou recuperação parcial.

## Resumo

- O terminal "Rescue" da imagem de recuperação oferece shell root com ferramentas de bloco.
- Recrie a tabela de partições com `parted mklabel gpt` + `mkpart`, ou restaure de backup com `sgdisk --load-backup`.
- Formate EFI com `mkfs.vfat -F 32` e dados com `mkfs.ext4 -F`.
- Reconstrua o bootloader com `efibootmgr` apontando para `\EFI\BOOT\bootx64.efi` na partição 6.
- As imagens do sistema (slots A/B) podem ser restauradas com `dd` a partir dos arquivos `.img` da ISO.

## Exercícios

1. Liste todas as partições do seu Steam Deck com `lsblk -o NAME,SIZE,FSTYPE` e compare com a tabela da seção 5.
2. Faça um backup da tabela de partições com `sgdisk --backup` e guarde o arquivo.
3. Descreva o propósito de cada etapa: `mklabel gpt`, `mkfs.vfat`, `mkfs.ext4`, `efibootmgr`.
4. Explique por que as partições 1-3 não são formatadas manualmente.
5. **Desafio.** Escreva um script de reconstrução completa: assumindo um SSD zerado, o script deve recriar partições, formatar, montar e restaurar o bootloader — tudo a partir do terminal de recuperação.