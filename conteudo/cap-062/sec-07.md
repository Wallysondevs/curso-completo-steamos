O dual boot está instalado, o rEFInd apresenta o menu, e numa manhã você liga o Deck e ele vai direto pro Windows — ou pior, para um terminal preto que diz "boot device not found". Problemas de boot têm causas previsíveis e, quase sempre, recuperação simples. Diagnosticar sem pânico é a diferença entre gastar dez minutos ou reinstalar tudo.

:::objetivos
- Diagnosticar alterações no `BootOrder` da NVRAM e restaurar a prioridade
- Lidar com entradas fantasmas e entradas quebradas no `efibootmgr`
- Recuperar o boot sem mexer no disco, usando o menu de firmware
- Corrigir a tela preta pós-instalação de dual boot
- Criar um pendrive de emergência com rEFInd portátil
:::

## O BootOrder mudou sozinho

O sintoma é clássico: o Deck liga e vai direto para o Windows, sem passar pelo rEFInd. A causa: uma atualização do Windows ou do SteamOS escreveu a NVRAM e mudou a ordem. O diagnóstico é imediato:

```terminal
$ sudo efibootmgr
BootCurrent: 0000
BootOrder: 0001,0000,0003
Boot0000* SteamOS
Boot0001* Windows Boot Manager
Boot0003* rEFInd
```

O Windows está em `0001` e aparece antes do `0000` (SteamOS) e `0003` (rEFInd). É um reset comum durante atualizações cumulativas — o Windows insiste em ser o primeiro.

```terminal
## Corrija: rEFInd primeiro, depois SteamOS, Windows por último
$ sudo efibootmgr -o 0003,0000,0001
```

Se o problema se repetir a cada atualização, a blindagem definitiva é instalar o rEFInd no caminho de fallback `ESP/EFI/BOOT/bootx64.efi`, como descrito [na seção do rEFInd](#/cap-062/sec-05). O firmware sempre tenta esse caminho quando o primeiro `BootOrder` falha ou é alterado.

## Entradas fantasmas e entradas quebradas

Instalar e remover sistemas deixa rastros. O `efibootmgr` acumula entradas que apontam para arquivos `.efi` que já não existem:

```terminal
$ sudo efibootmgr
Boot0000* SteamOS
Boot0001* Windows Boot Manager
Boot0002* Ubuntu              ## ← o .efi foi apagado, mas a entrada ficou
Boot0003* rEFInd
```

A entrada `0002` não atrapalha o boot (o firmware pula arquivos inexistentes), mas suja a lista. Para limpá-la:

```terminal
$ sudo efibootmgr -b 0002 -B
```

Verifique se o arquivo de fato não existe antes de apagar:

```terminal
$ esp
$ ls /mnt/EFI/ubuntu/  ## se retornar "No such file or directory", pode apagar
$ unesp
```

Entradas quebradas são diferentes: o arquivo `.efi` existe, mas não carrega (tela preta, retorno imediato ao menu). Nesse caso, recrie a entrada com o caminho corrigido, em vez de apagar:

```terminal
## Descubra o caminho correto dentro da ESP
$ esp
$ find /mnt/EFI -name '*.efi'
/mnt/EFI/BOOT/bootx64.efi
/mnt/EFI/steamos/steamcl.efi
/mnt/EFI/refind/refind_x64.efi
/mnt/EFI/Microsoft/Boot/bootmgfw.efi
$ unesp

## Atualize a entrada com o caminho exato
$ sudo efibootmgr -b 0003 -L 'rEFInd' -l '\EFI\refind\refind_x64.efi'
```

## Tela preta após instalar o segundo sistema

Ligou, o rEFInd aparece, você escolhe SteamOS e... preto. Nada. Esse sintoma tem três causas comuns, em ordem de probabilidade:

### 1. O Windows desativou o Secure Boot (ou ativou e o kernel não assina)

O SteamOS 3.6 assina seus binários, mas em certas combinações de firmware + Secure Boot, o kernel se recusa a carregar. A solução: entre no setup do firmware (vol+ ao ligar, no Deck LCD; setup via BIOS no OLED), e **desative** Secure Boot. Esse é o estado padrão de fábrica do Deck e o mais compatível com dual boot.

### 2. A partição root apontada não é a que está ativa

O SteamOS alterna entre `rootfs-a` e `rootfs-b` a cada atualização atômica. Se o rEFInd aponta fixamente para `nvme0n1p4`, mas o slot ativo agora é `nvme0n1p5`, o kernel tenta montar a raiz errada:

```terminal
## No menu do rEFInd, selecione o SteamOS e tecle F2 ou Insert
## Edite a linha de opções do kernel e confira root=/dev/nvme0n1p??
```

O parâmetro `root=` deve apontar para a partição `rootfs` ativa no momento. Para saber qual é:

```terminal
$ sudo steamos-readonly status
## ou
$ lsblk -o NAME,MOUNTPOINT /dev/nvme0n1 | grep '/$'
├─nvme0n1p4 /
```

### 3. O initramfs está ausente ou corrompido

O SteamOS atualiza o initramfs junto com o kernel, mas se a atualização foi interrompida, o arquivo em `/boot/initramfs-*.img` pode estar truncado. O menu de emergência do rEFInd tem uma opção "fallback initramfs" que tenta um initramfs genérico.

## O menu de firmware como saída de emergência

Independente do estado do disco, o menu de firmware do Deck sempre funciona — porque está na ROM, não no SSD. Desligue, segure **vol-** e ligue: o menu aparece com:

- **Continue**: inicia o sistema padrão.
- **Boot Manager**: lista as entradas da NVRAM e permite escolher uma.
- **Boot From File**: navegador de arquivos que lê qualquer ESP do sistema.

O **Boot From File** é o canivete suíço do boot: mesmo que a NVRAM esteja vazia, você navega pela ESP e executa manualmente qualquer `.efi`. É assim que se testa um boot manager recém-instalado ou se inicia o SteamOS quando o `BootOrder` foi zerado.

## Criando um pendrive de emergência com rEFInd

Um pendrive formatado como ESP com rEFInd é a bala de prata: liga em qualquer máquina, detecta os discos e oferece boot. Nada de chroot, nada de reinstalar.

```terminal
## Num pendrive /dev/sda, crie uma GPT com uma partição ESP
$ sudo parted /dev/sda mklabel gpt
$ sudo parted /dev/sda mkpart primary fat32 1MiB 100%
$ sudo parted /dev/sda set 1 boot on
$ sudo parted /dev/sda set 1 esp on
$ sudo mkfs.vfat -F32 /dev/sda1

## Monte e instale o rEFInd nele
$ sudo mount /dev/sda1 /mnt
$ sudo mkdir -p /mnt/EFI/BOOT
$ sudo cp ~/Downloads/refind-bin-0.14.2/refind/refind_x64.efi /mnt/EFI/BOOT/bootx64.efi
$ sudo cp -r ~/Downloads/refind-bin-0.14.2/refind/* /mnt/EFI/BOOT/
$ sudo umount /mnt
```

Esse pendrive é genérico: funciona no Deck, em qualquer PC, com qualquer sistema. Guarde-o na gaveta.

:::dica
Se o seu Dock USB-C não reconhece o pendrive no menu de firmware, conecte o pendrive direto ao Deck. O firmware do Deck é seletivo com hubs — alguns docks alimentam a porta USB antes de o firmware inicializar o controlador, e o pendrive não aparece na lista.
:::

## Resumo

- `efibootmgr -o 0003,0000,0001` restaura a ordem quando o Windows a reescreve.
- Entradas fantasmas (`-b X -B`) limpam a NVRAM; entradas quebradas se corrigem com o caminho certo.
- Tela preta ao escolher SteamOS: cheque Secure Boot (desativar), `root=` (qual slot), initramfs (se existe).
- O menu de firmware (vol- + power) e **Boot From File** são o escape quando nada na NVRAM funciona.
- Um pendrive formatado como ESP com rEFInd inicia qualquer sistema sem tocar no disco.

## Exercícios

1. Rode `sudo efibootmgr` e identifique se alguma entrada aponta para um `.efi` que não existe (`find /mnt/EFI -name '*.efi'`).
2. Altere o `BootOrder` para uma ordem diferente da atual, reinicie, confirme que mudou e restaure a ordem original.
3. Entre no menu de firmware, vá em **Boot From File** e navegue até `EFI/steamos/steamcl.efi` — inicie o SteamOS a partir dele.
4. Crie um pendrive de emergência com rEFInd, teste o boot no Deck e confirme que ele detecta os sistemas do disco interno.
5. **Desafio.** Simule um cenário de NVRAM zerada: apague todas as entradas com `efibootmgr -b X -B` (exceto a atual), reinicie pelo pendrive de emergência, e restaure a entrada padrão com `efibootmgr -c`.