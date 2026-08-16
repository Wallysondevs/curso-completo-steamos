Quando o sistema não chega nem ao *emergency target* — o GRUB não aparece, o kernel entra em *panic*, ou a partição raiz foi tão corrompida que o initrd não monta — a última defesa antes da reinstalação completa é o **resgate por chroot**. Você inicia o aparelho por um sistema externo (um pendrive live ou o próprio ambiente de recuperação do SteamOS), monta as partições do sistema quebrado e "entra" nelas com `chroot`, operando como se estivesse dentro da instalação original.

:::objetivos
- Preparar um ambiente live para resgatar uma instalação de SteamOS
- Montar manualmente as partições necessárias para um chroot funcional
- Reparar GRUB, initramfs e fstab de dentro do chroot
- Recuperar a capacidade de boot sem reinstalar
:::

## Quando o chroot é necessário

O *emergency target* (seção 3) e o kernel anterior (seção 2) cobrem a maioria. O chroot é a fronteira seguinte, para quando:

- O GRUB foi sobrescrito ou o MBR/GPT ficou ilegível.
- O `initramfs` está corrompido e o kernel não monta a raiz.
- O `/etc/fstab` foi editado com UUID errado e nenhuma partição monta.
- Você removeu acidentalmente um pacote crítico (`systemd`, `bash`, `glibc`) e o sistema não sobe.

Nesses casos, você precisa de um sistema operacional **fora** do disco quebrado para poder operar. Um pendrive com uma ISO live do Arch Linux (ou a própria imagem de recuperação do SteamOS) serve.

```terminal
$ lsblk -f
NAME        FSTYPE FSVER LABEL       UUID                                 FSAVAIL FSUSE% MOUNTPOINTS
nvme0n1
├─nvme0n1p1 vfat   FAT32 ESP         3F2B-91AC                                             
├─nvme0n1p2 ext4   1.0   rootfs      a1b2c3d4-e5f6-7890-abcd-ef1234567890                  
├─nvme0n1p3 ext4   1.0   home        b2c3d4e5-f6a7-8901-bcde-f12345678901                  
```

O primeiro passo, já dentro do ambiente live, é enxergar as partições com `lsblk -f`. As colunas `FSTYPE` e `UUID` são o que interessa: você vai montar a raiz (`rootfs`) em algum ponto e, sobre ela, montar as partições auxiliares.

## Montando o quebrado para consertar

O roteiro de montagem é sempre o mesmo: raiz primeiro, depois as partições especiais que o sistema precisa para funcionar depois do chroot.

```terminal
# mount /dev/nvme0n1p2 /mnt
# mount /dev/nvme0n1p1 /mnt/boot
# mount -t proc proc /mnt/proc
# mount -t sysfs sys /mnt/sys
# mount -o bind /dev /mnt/dev
# mount -o bind /dev/pts /mnt/dev/pts
# mount -o bind /run /mnt/run
```

A montagem da raiz (`/mnt`) expõe o sistema de arquivos quebrado. As montagens seguintes são **virtuais**: `proc`, `sys` e os bind mounts de `dev`, `pts` e `run` injetam as interfaces do kernel e do systemd do ambiente live dentro do chroot, que de outro modo não teria acesso a processos, dispositivos nem ao barramento D-Bus.

:::atencao
A ordem importa: monte a raiz primeiro, depois `/boot` (ou a partição ESP, dependendo do layout do SteamOS), e só então os sistemas de arquivos virtuais. Se `/boot` tem sistema de arquivos próprio (FAT32 na ESP do UEFI), você **precisa** montá-lo antes de qualquer comando que toque no GRUB ou no kernel; senão o chroot opera com um `/boot` vazio.
:::

## Entrando no chroot e primeiros diagnósticos

Com as partições montadas, o `chroot` é um comando só:

```terminal
# chroot /mnt /bin/bash
```

A partir desse ponto, você está "dentro" do sistema quebrado com privilégios de root. Todo comando roda contra os binários e bibliotecas da instalação original, mas usando o kernel do live. Primeiro, entenda onde está e o que quebrou:

```terminal
# cat /etc/os-release | head -3
NAME="SteamOS"
VERSION="3.6 (Noble Numbat)"
ID="steamos"

# cat /etc/fstab | grep -v '^#' | grep -v '^$'
UUID=a1b2c3d4-e5f6-7890-abcd-ef1234567890 /     ext4  defaults  0 1
UUID=3F2B-91AC                            /boot vfat  defaults  0 1
UUID=b2c3d4e5-f6a7-8901-bcde-f12345678901 /home ext4  defaults  0 2
```

Compare os UUIDs do `fstab` com os UUIDs reais do `lsblk -f`. Se houve um acidente de clonagem de disco ou troca de partição, os UUIDs podem não bater, e o systemd fica esperando eternamente por um dispositivo que não existe. Corrigir o `fstab` com os UUIDs corretos é uma das reparações mais comuns dentro do chroot:

```terminal
# blkid /dev/nvme0n1p2
/dev/nvme0n1p2: UUID="a1b2c3d4-e5f6-7890-abcd-ef1234567890" BLOCK_SIZE="4096" TYPE="ext4" PARTLABEL="rootfs"
# nano /etc/fstab   # ajuste o UUID se necessário
```

## Reparando GRUB e initramfs

O chroot é o lugar certo para reconstruir o boot. Se o GRUB sumiu, regrave-o no disco e recrie o arquivo de configuração:

```terminal
# grub-install --target=x86_64-efi --efi-directory=/boot --bootloader-id=SteamOS
Installing for x86_64-efi platform.
Installation finished. No error reported.
# grub-mkconfig -o /boot/grub/grub.cfg
Generating grub configuration file ...
Found linux image: /boot/vmlinuz-6.1.52-valve
Found initrd image: /boot/initramfs-6.1.52-valve.img
done
```

Se foi o `initramfs` que corrompeu (kernel sobe, mas trava no "root device not found"), recrie-o:

```terminal
# mkinitcpio -P
==> Building image from preset: /etc/mkinitcpio.d/linux.preset: 'default'
==> Starting build: 6.1.52-valve
  -> Running build hook: [base]
  -> Running build hook: [udev]
  -> Running build hook: [filesystems]
==> Image generation successful
```

:::info
O SteamOS usa `mkinitcpio` (do Arch Linux) para gerar a imagem initramfs, não `update-initramfs` (do Debian/Ubuntu). O comando `mkinitcpio -P` reconstrói as imagens para todos os kernels instalados segundo os arquivos de preset em `/etc/mkinitcpio.d/`.
:::

## Reinstalando pacotes críticos

Se o problema foi remoção acidental de um pacote fundamental, o `pacman` dentro do chroot (com rede funcional — lembre-se de copiar o `/etc/resolv.conf` antes de entrar no chroot) reinstala:

```terminal
# cp /etc/resolv.conf /mnt/etc/resolv.conf   # antes do chroot, no live
# chroot /mnt /bin/bash
# pacman -S linux-firmware systemd base
```

O `base` é o metapacote que puxa `bash`, `coreutils`, `systemd` e outras dependências fundamentais. Reinstalá-lo cobre a maioria dos casos de "deletei sem querer".

:::perigo
Nunca execute `pacman -Syu` (upgrade completo) de dentro do chroot com kernel do live. O kernel do live pode ser de versão diferente do que os pacotes esperam, e módulos de kernel podem ser compilados para a versão errada. Faça upgrade só quando o sistema voltar a bootar normalmente.
:::

## Saindo e testando

Para sair do chroot com segurança:

```terminal
# exit
# umount -R /mnt
# reboot
```

O `umount -R` (recursivo) desmonta `/mnt` e tudo que estava montado abaixo dele (`/mnt/dev`, `/mnt/proc`, etc.) na ordem correta. Depois é remover o pendrive live e torcer — se o reparo foi bem feito, o SteamOS volta ao GRUB e sobe normalmente.

## Resumo

- Chroot é a última defesa antes de reinstalar, para quando o sistema não chega nem ao emergency target.
- O roteiro de montagem é: raiz, `/boot` (se partição própria), depois `proc`, `sys`, `dev`, `dev/pts`, `run`.
- Dentro do chroot, compare UUIDs do `fstab` com `blkid` — UUIDs errados são a causa mais comum de "não monta".
- `grub-install` + `grub-mkconfig` restauram o boot; `mkinitcpio -P` recria o initramfs corrompido.
- Copie `/etc/resolv.conf` antes de entrar no chroot se precisar de rede; use `pacman -S`, não `-Syu`.
- Saia com `exit`, desmonte com `umount -R /mnt` e reinicie.

## Exercícios

1. Liste as partições do seu disco com `lsblk -f` e anote UUID, tipo de sistema de arquivos e tamanho de cada uma.
2. Simule a preparação de um chroot: monte sua raiz em `/mnt/teste` (como readonly), depois monte `/proc` e `/sys` nela e confirme que `ls /mnt/teste` mostra a estrutura do seu sistema.
3. Compare os UUIDs do seu `/etc/fstab` com os do `lsblk -f` e verifique se estão iguais. Se houver divergência, anote-a e explique se ela é um bug ou uma partição não usada.
4. Gere uma nova configuração de GRUB com `sudo grub-mkconfig -o /boot/grub/grub.cfg` dentro da sessão normal e leia as primeiras 20 linhas do arquivo para entender sua estrutura.
5. **Desafio.** Sem consultar documentação externa: usando um pendrive com uma ISO live do Arch Linux (ou simulando no papel), descreva a sequência completa de comandos para recuperar um sistema cujo `/etc/fstab` tem todos os UUIDs apontando para partições que não existem (por exemplo, após clonagem de disco). Inclua como descobrir os UUIDs corretos e como garantir que o sistema volte a montar todas as partições.