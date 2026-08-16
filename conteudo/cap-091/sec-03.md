A imagem está baixada e verificada. Agora ela precisa virar um dispositivo de boot — e é aqui que o arquivo de 7,7 GiB se transforma em algo que o firmware UEFI do Deck aceita executar. A gravação não é uma cópia de arquivos: é uma transferência byte a byte que recria a tabela de partições e o conteúdo exatamente como a Valve empacotou. Uma gravação malfeita é a causa mais comum de "o Deck não entra no recovery".

:::objetivos
- Escolher um pendrive rápido e de tamanho suficiente
- Gravar a imagem com `dd` no Linux e com Rufus/Balena Etcher no Windows
- Verificar que o pendrive ficou bootável verificando suas partições
- Entender os erros comuns de gravação e como evitá-los
:::

## Escolhendo o pendrive certo

A imagem descompactada tem cerca de 7,7 GiB, então um pendrive de 8 GB nominal não basta: o "8 GB" de fábrica costuma entregar entre 7,2 e 7,5 GiB utilizáveis. O mínimo seguro é **16 GB**. Além do tamanho, a velocidade importa mais do que parece: um pendrive USB 2.0 barato pode levar quarenta minutos para inicializar o ambiente de recovery, enquanto um USB 3.0 de boa qualidade faz o mesmo em menos de cinco.

```terminal
$ lsblk -o NAME,SIZE,TYPE,TRAN,RM /dev/sda
NAME   SIZE TYPE TRAN RM
sda   14.7G disk usb   1
```

Cartão microSD no slot do Deck também funciona como dispositivo de recovery, com uma ressalva: o leitor interno do Deck é significativamente mais lento que uma porta USB-C com adaptador. Se você tem pressa, pendrive USB-C direto (sem hub) ou pendrive USB-A num dock com porta USB 3.0 é a combinação mais rápida.

:::dica
Rotule o pendrive fisicamente com fita crepe e caneta depois de gravar. Seis meses depois, quando o Deck travar de novo, você vai agradecer por não ter que testar cinco pendrives pretos idênticos até achar o certo.
:::

## Gravando com `dd` no Linux

No Linux o caminho é direto: `dd` lê o arquivo e escreve no dispositivo de bloco. O cuidado aqui é milimétrico — errar o `of=` (output file) pode sobrescrever o disco errado. Identifique o dispositivo com `lsblk` antes de qualquer comando.

```terminal
$ lsblk -o NAME,SIZE,MODEL | grep -E 'sd|nvme'
sda           14.7G Ultra_USB_3.0
nvme0n1      953.9G KINGSTON SNV2S1000G
$ sudo dd if=steamdeck-recovery-4.img of=/dev/sda bs=4M status=progress conv=fsync
7948206080 bytes (7.9 GB, 7.4 GiB) copied, 142 s, 55.9 MB/s
1896+1 records in
1896+1 records out
7948206080 bytes (7.9 GB, 7.4 GiB) copied, 143.5 s, 55.4 MB/s
```

Cada parte desse comando tem uma razão de ser: `bs=4M` define blocos de 4 MiB — grande o bastante para ser rápido, pequeno o bastante para não engasgar no buffer do kernel; `status=progress` mostra o andamento em tempo real; `conv=fsync` garante que o cache de escrita seja drenado para o dispositivo antes de `dd` reportar "pronto". Sem `conv=fsync`, o comando pode terminar enquanto dados ainda estão no buffer da controladora USB, e remover o pendrive nesse instante corrompe a gravação.

```terminal
$ sudo sync
$ sudo blockdev --flushbufs /dev/sda
```

Depois do `dd`, o `sync` e o `blockdev --flushbufs` são redundância defensiva. Remova o pendrive com segurança pelo gerenciador de arquivos ou com `udisksctl power-off -b /dev/sda`.

:::perigo
`of=/dev/sda` destrói **todo o conteúdo** do dispositivo de destino. Confira três vezes o nome do disco com `lsblk`. Se você confundir `/dev/sda` (pendrive) com `/dev/nvme0n1` (SSD interno), perde o Deck. O `dd` não pergunta confirmação — ele obedece.
:::

## Gravando no Windows: Rufus e Balena Etcher

No Windows, duas ferramentas gratuitas dominam o cenário. O **Rufus** é o mais rápido e oferece mais controle. O **Balena Etcher** (agora `balenaEtcher`) é mais simples: arrasta o `.img`, seleciona o dispositivo, clica em Flash.

No Rufus, o fluxo é: selecione o pendrive em "Device", clique em "Select" e escolha o arquivo `.img` (não o `.bz2` — descompacte antes com 7-Zip ou WinRAR), mantenha "Partition scheme" como MBR e "Target system" como BIOS or UEFI, e clique em "Start". O Rufus pergunta se deve gravar no modo DD ou ISO — escolha **DD Image mode**, não ISO, porque a imagem é raw e não um ISO 9660.

```terminal
$ # Equivalente no Linux com Rufus — não roda no Deck, mas ilustra:
$ # O Rufus internamente faz algo similar a:
$ # dd if=imagem.img of=/dev/sda bs=1M
```

:::atencao
Usar o modo ISO (não DD) no Rufus com uma imagem raw produz um pendrive que o Deck reconhece como entidade de boot, mas que trava em loop na inicialização. Se o recovery não passa da tela preta, revise: usou DD Image mode?
:::

## Confirmando que o pendrive está bootável

Depois de gravar, verifique as partições do pendrive. Uma imagem de recovery corretamente gravada deve mostrar pelo menos duas partições: uma FAT32 (EFI) e uma ext4 (raiz do sistema).

```terminal
$ sudo fdisk -l /dev/sda
Disk /dev/sda: 14.69 GiB, 15770353664 bytes, 30801472 sectors
Device     Boot Start     End Sectors  Size Id Type
/dev/sda1  *     2048 1048575 1046528  511M 83 Linux
/dev/sda2     1048576 2070527 1021952  499M ef EFI (FAT-12/16/32)
/dev/sda3     2070528 19387903 17317376 8.3G 83 Linux
```

Três partições: a primeira de boot (511 MiB, tipo Linux), a segunda EFI (499 MiB, tipo EFI) e a terceira com o sistema propriamente dito (8,3 GiB). Ver essa estrutura no `fdisk` é a confirmação de que a gravação ocorreu sem truncamento.

```terminal
$ sudo blkid /dev/sda*
/dev/sda1: LABEL="boot" UUID="a3b2c1f0-..." TYPE="ext4"
/dev/sda2: LABEL="efi" UUID="67E3-1F2A" TYPE="vfat"
/dev/sda3: LABEL="rootfs" UUID="b1c2d3e4-..." TYPE="ext4"
```

Se o `blkid` não mostrar essas labels ("boot", "efi", "rootfs"), o pendrive pode ter sido gravado incorretamente ou o arquivo pode estar truncado — volte ao `sha256sum` da seção 2.

## Resumo

- Pendrive de no mínimo 16 GB, USB 3.0 de preferência; microSD funciona mas é mais lento.
- No Linux, grave com `dd if=imagem.img of=/dev/sda bs=4M status=progress conv=fsync` após identificar o dispositivo correto com `lsblk`.
- No Windows, use Rufus com DD Image mode (não ISO) ou Balena Etcher.
- `sync` e `blockdev --flushbufs` garantem que o cache foi drenado antes de remover o pendrive.
- Verifique a gravação com `fdisk -l` e `blkid` — três partições com labels boot, efi e rootfs confirmam que o pendrive está íntegro.

## Exercícios

1. Conecte um pendrive de 16 GB ou maior e identifique seu nome de dispositivo com `lsblk`. Anote o tamanho exato em GiB.
2. Grave a imagem com `dd` e meça o tempo total. Qual foi a taxa de transferência média? Compare-a com a velocidade teórica da porta USB.
3. Rode `sudo fdisk -l` e `sudo blkid` no pendrive. Quantas partições aparecem, qual o tipo de cada uma e qual label está associada a cada uma?
4. Remova o pendrive, reinsira-o e execute `sudo fsck -n /dev/sda3` (a partição maior). O sistema de arquivos está limpo?
5. **Desafio.** Compare o checksum SHA256 da partição `rootfs` do pendrive com o checksum da partição correspondente no arquivo `.img`. Use `dd` com `skip=` e `count=` para ler só a partição 3 do pendrive e `cmp` para comparar com o offset correto do arquivo da imagem.