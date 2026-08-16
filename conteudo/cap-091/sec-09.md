Todo problema que os três ícones de escrita resolvem começou, em algum momento, como um problema que alguém poderia ter entendido antes de apagar qualquer coisa. O quarto ícone — o Terminal with repair tools — é a porta para esse entendimento. Com um shell de root, ferramentas de partição e a imagem do SteamOS montada ao alcance, você pode diagnosticar, reparar manualmente e só então decidir se a reimagem, a reinstalação ou a limpeza são mesmo necessárias. Esta seção fecha o capítulo com o que o terminal oferece, como reparar o boot manualmente e como verificar que a recuperação deu certo.

:::objetivos
- Usar o Terminal with repair tools para diagnosticar antes de apagar
- Montar as partições do disco interno e inspecionar seu conteúdo
- Reparar o bootloader e corrigir problemas de partição manualmente
- Verificar, após qualquer operação, que o sistema ficou consistente
:::

## O que o terminal de repair oferece

O ícone do terminal abre um Konsole já autenticado com privilégios de root (o usuário `deck` tem `sudo` sem senha nesse ambiente). O que o torna "de repair" não é um comando mágico, mas o conjunto de ferramentas pré-instaladas na imagem:

```terminal
$ which sgdisk gdisk fdisk parted mkfs.ext4 fsck mount chroot efibootmgr bootctl btrfs
/usr/bin/sgdisk
/usr/bin/gdisk
/usr/bin/fdisk
/usr/sbin/parted
/usr/sbin/mkfs.ext4
/usr/sbin/fsck
/usr/bin/mount
/usr/sbin/chroot
/usr/bin/efibootmgr
/usr/bin/bootctl
/usr/bin/btrfs
```

Com essas ferramentas você pode inspecionar a tabela de partições, checar sistemas de arquivos, montar partições, chroot para dentro do sistema instalado e mexer diretamente no bootloader. É, em essência, um Linux de resgate completo.

:::dica
O ambiente de recovery tem acesso à internet (via Wi-Fi) se você configurar a rede. Para configurações rápidas, o `nmcli` está disponível: `nmcli device wifi connect "SUA_REDE" password "SENHA"`. Isso permite baixar ferramentas extras ou consultar documentação sem sair do terminal.
:::

## Inspecionando o disco antes de qualquer decisão

A primeira providência é entender o estado do disco. A sequência de diagnóstico começa com a tabela de partições e desce até os sistemas de arquivos:

```terminal
$ sudo gdisk -l /dev/nvme0n1
GPT fdisk (gdisk) version 1.0.10
[...]
Number  Start (sector)    End (sector)  Size       Code  Name
   1            2048          133119   64.0 MiB    8300  Linux filesystem
   2          133120          264191   64.0 MiB    8300  Linux filesystem
   3          264192          329727   32.0 MiB    EF00  EFI System
   4          329728         10815527   5.0 GiB     8300  rootfs-A
   5        10815528         21390847   5.0 GiB     8300  rootfs-B
   6        21390848         21915135   256.0 MiB   EF00  EFI System
   7        21915136         22439423   256.0 MiB   EF00  EFI System
   8        22439424      2000409230   938.5 GiB   0700  home
```

Se a tabela está íntegra (GPT presente, oito partições com códigos coerentes), o problema provavelmente é de arquivo de sistema ou bootloader — e nem reimagem nem reparticionamento são necessários. Em seguida, cheque os sistemas de arquivos:

```terminal
$ sudo fsck -n /dev/nvme0n1p4
fsck from util-linux 2.39.3
e2fsck 1.47.0 (5-Feb-2023)
rootfs-A: clean, 112582/327680 files, 1098421/1310720 blocks
$ sudo fsck -n /dev/nvme0n1p5
rootfs-B: clean, 112582/327680 files, 1098421/1310720 blocks
$ sudo fsck -n /dev/nvme0n1p8
home: clean, 184726/58982400 files, 8945621/235903744 blocks
```

Três "clean" seguidos é o diagnóstico mais reconfortante possível: os sistemas de arquivos estão consistentes, e o problema — se existe — está no bootloader ou na configuração, não na estrutura do disco.

## Chroot para dentro do sistema instalado

Quando a tabela e os sistemas de arquivos estão íntegros, mas o Deck não inicializa, a técnica de `chroot` permite "entrar" no sistema instalado e executar comandos como se estivesse logado nele:

```terminal
$ sudo mount /dev/nvme0n1p4 /mnt
$ sudo mount /dev/nvme0n1p6 /mnt/efi
$ sudo mount --bind /dev /mnt/dev
$ sudo mount --bind /proc /mnt/proc
$ sudo mount --bind /sys /mnt/sys
$ sudo chroot /mnt /bin/bash
[root@steamdeck /]# 
```

Dentro do chroot, você pode rodar `steamos-update check`, inspecionar logs em `/var/log`, reinstalar o bootloader ou investigar qualquer configuração que esteja impedindo o boot. Esta é a ferramenta de reparo mais poderosa à disposição e evita operações destrutivas em muitos casos.

:::nota
O chroot monta a raiz A ou B, mas o Deck alterna entre elas. Se você chroot na A quando a B está ativa, está editando o slot errado. Confirme qual é o ativo com `bootctl status` antes, e monte a partição correspondente.
:::

## Reparando o bootloader manualmente

Um Deck que liga mas cai num prompt "BootDevice Not Found" ou numa tela preta após o chime frequentemente tem o bootloader corrompido — e isso é reparável sem tocar nos dados. O SteamOS usa `systemd-boot`, e a reparação envolve reinstalar as entradas EFI:

```terminal
$ sudo mount /dev/nvme0n1p6 /mnt
$ ls /mnt/EFI/SteamOS/
steamos-A.efi
steamos-B.efi
$ bootctl status
System:
     Firmware: UEFI 2.70
  Secure Boot: disabled
```

Se os arquivos `.efi` estão ausentes ou corrompidos, copie-os de volta a partir da imagem do SteamOS no pendrive, ou reinstale o `systemd-boot` dentro de um chroot. Em casos de entrada EFI faltando no firmware, o `efibootmgr` cria uma nova:

```terminal
$ sudo efibootmgr --create --disk /dev/nvme0n1 --part 6 \
    --label "SteamOS" --loader '\EFI\SteamOS\steamos-A.efi'
BootCurrent: 0000
BootOrder: 0001,0000
Boot0001* SteamOS
```

A nova entrada `0001` aponta para o `steamos-A.efi`. Na próxima inicialização, o firmware encontra o bootloader e o Deck sobe.

:::atencao
Reparar o bootloader manualmente preserva tudo, mas exige precisão: gravar na partição EFI errada ou apontar o `efibootmgr` para um `.efi` inexistente pode piorar o problema. Se você não se sente seguro, a reinstalação (que refaz o bootloader automaticamente) é o caminho mais estável.
:::

## Quando partir para a operação destrutiva

O terminal de reparo também é onde você percebe que a operação destrutiva é inevitável. Sinais de que a reimagem é a única saída:

- `gdisk -l` reporta "GPT: not present" ou "invalid partition table" e nenhuma partição reconhecível.
- `fsck` reporta erros que `fsck -y` não resolve (superbloco ilegível, inodes órfãos em massa).
- Você identifica que o disco inteiro foi regravado por um instalador externo (Windows, por exemplo).
- Faltam partições essenciais (`rootfs-A` e `rootfs-B` não existem).

Nesses casos, o terminal cumpriu seu papel: deu a certeza de que não havia alternativa mais suave. A reimagem da seção 6 então se aplica.

## Verificando o sucesso depois de qualquer operação

Qualquer que tenha sido o caminho — reimage, reinstall, clear data ou reparo manual — a verificação final é sempre a mesma. O Deck precisa: (1) iniciar, (2) montar `/home`, (3) ter bootloader coerente.

```terminal
$ sudo bootctl status | grep -E "ESP|File"
         ESP: /dev/nvme0n1p6
        File: /EFI/SteamOS/steamos-A.efi
$ lsblk -o NAME,FSTYPE,LABEL,MOUNTPOINTS /dev/nvme0n1
NAME        FSTYPE LABEL    MOUNTPOINTS
nvme0n1p4   ext4   rootfs-A
nvme0n1p5   ext4   rootfs-B
nvme0n1p6   vfat   efi      /esp
nvme0n1p8   ext4   home     /home
$ sudo fsck -n /dev/nvme0n1p8
home: clean, 42/58982400 files, 2210/235903744 blocks
```

Um `/home` montado, um bootloader apontando para um `.efi` válido e um `fsck` limpo são a tríade que confirma a saúde do sistema. Se os três batem, o Deck está íntegro — e o capítulo de recuperação pode ser fechado.

:::dica
Documente o que você fez: anote a data, a versão da imagem de recovery usada, a operação escolhida e o resultado. Seis meses depois, quando algo der errado de novo, esse registro é o ponto de partida mais rápido para o diagnóstico.
:::

## Resumo

- O Terminal with repair tools é um Linux de resgate completo, com `sgdisk`, `fsck`, `mount`, `chroot`, `efibootmgr` e `bootctl`.
- O diagnóstico começa por `gdisk -l` (tabela) e desce a `fsck -n` (sistemas de arquivos): "GPT not present" ou erros irrecuperáveis indicam reimagem.
- O `chroot` permite operar dentro do sistema instalado para reparar sem apagar; confirme o slot ativo antes.
- O bootloader `systemd-boot` pode ser reparado manualmente com `bootctl` e `efibootmgr`, preservando dados.
- A verificação final é tríplice: bootloader coerente, `/home` montada e `fsck` limpo.

## Exercícios

1. Inicialize o recovery, abra o Terminal e rode `gdisk -l /dev/nvme0n1`. Copie a tabela de partições e classifique cada partição pelo seu código (EF00, 8300, 0700).
2. Execute `fsck -n` em `rootfs-A`, `rootfs-B` e `home`. Os três estão "clean"? Se um não está, o que os erros sinalizam?
3. Monte a raiz ativa e a `efi`, faça `ls /mnt/EFI/SteamOS/` e liste os arquivos `.efi` presentes. Quantos são e o que cada nome indica?
4. Reproduza um chroot manual: monte raiz, efi, e faça bind de `/dev`, `/proc`, `/sys`, depois entre com `chroot /mnt /bin/bash`. Rode `cat /etc/os-release` de dentro do chroot.
5. **Desafio.** Simule uma falha de bootloader: desmonte tudo, execute `efibootmgr` para listar as entradas atuais e, então, descreva (sem apagar nada) qual comando você usaria para recriar uma entrada bootable se a `Boot0001* SteamOS` tivesse desaparecido. Justifique cada argumento do `efibootmgr --create`.