Todo o capítulo até aqui pressupôs que as coisas funcionam. Esta última seção cobre o inverso: quando o disco não monta, quando monta mas some, quando o kernel grita nos logs e quando você desconfia que há corrupção. Reunimos uma sequência de diagnóstico e as ferramentas de recuperação — além da prática que previne a maioria dos desastres: a remoção segura.

:::objetivos
- Seguir uma sequência de diagnóstico quando um disco não monta ou some
- Ler o `dmesg` e o `journalctl` para achar a causa raiz de falhas de montagem
- Verificar e reparar sistemas de arquivos com `fsck` (e suas variantes)
- Usar `sync` e `udisksctl power-off` para remoção segura de discos
- Escolher a ferramenta certa para recuperar dados de um disco corrompido
:::

## A sequência de diagnóstico

Quando um disco falha, não tateie às cegas. Siga esta ordem, da camada mais baixa à mais alta:

```terminal
## 1. O kernel ainda vê o dispositivo?
$ lsblk
## Se o disco sumiu da lista, o problema é de conexão física ou driver USB.

## 2. O dispositivo aparece, mas a partição? E o sistema de arquivos?
$ sudo blkid /dev/sdX1
## TYPE= vazio significa sem sistema de arquivos reconhecível (ou corrompido).

## 3. O que o kernel registrou nos últimos segundos?
$ sudo dmesg | tail -30
## Mensagens de I/O error, reset ou sense key apontam o problema físico.

## 4. O que o systemd/jornal registrou sobre a tentativa de montagem?
$ journalctl -b -e | grep -iE 'mount|udisks|sdX' | tail -20
```

A regra de ouro: **o `dmesg` e o `journalctl` quase sempre apontam a causa.** Em vez de adivinhar, leia o que o kernel e o systemd relataram.

## Lendo os sintomas no dmesg

A mensagem de erro no `dmesg` diz muito sobre a natureza do problema. Alguns padrões comuns:

```terminal
$ sudo dmesg | tail -20
[ 1122.014521] usb 2-1: new SuperSpeed USB device number 4 using xhci_hcd
[ 1122.031944] usb 2-1: New USB device found, idVendor=04e8, idProduct=61f5
[ 1122.501001] usb 2-1: reset SuperSpeed USB device number 4 using xhci_hcd
[ 1123.122308] sd 6:0:0:0: [sdb] tag#0 FAILED Result: hostbyte=DID_ERROR driverbyte=DRIVER_OK
[ 1123.122313] sd 6:0:0:0: [sdb] tag#0 CDB: Read(10) 28 00 00 00 00 00 00 00 08 00
[ 1125.234911] sd 6:0:0:0: [sdb] tag#0 I/O error, dev sdb, sector 0 op 0x0:(READ) flags 0x0 phys_seg 1 prio class 2
```

Padrões que essa saída revela:

- **`reset SuperSpeed USB device`** repetido: cabo ruim, porta com mau contato ou insuficiência de energia na porta USB-C. Troque o cabo ou use um hub com alimentação externa.
- **`I/O error`** seguido de `DID_ERROR`: o dispositivo deixou de responder no meio de uma leitura. Pode ser o cabo, o controlador ou o próprio disco.
- **`blk_update_request: critical medium error`**: erro de mídia — setor defeituoso no disco. Candidato a `fsck` ou substituição.

O carimbo `[ 1122.014521 ]` é o tempo desde o boot, em segundos — útil para correlacionar com o momento em que você conectou o cabo.

## fsck: verificando e reparando sistemas de arquivos

`fsck` (de *file system check*) verifica a integridade do sistema de arquivos e, quando pode, repara. Cada sistema de arquivos tem seu verificador específico, e o `fsck` apenas chama o certo:

| Sistema de arquivos | Verificador |
|---|---|
| ext4 | `e2fsck` (via `fsck.ext4`) |
| exFAT | `exfatfsck` (via `fsck.exfat`) |
| NTFS | `ntfsfix` (limitado) ou `chkdsk` no Windows |
| Btrfs | `btrfs check` |

A regra de segurança: **nunca rode `fsck` num sistema de arquivos montado**. Desmonte primeiro:

```terminal
$ sudo umount /dev/sdb1
$ sudo fsck -f /dev/sdb1
fsck from util-linux 2.39.3
e2fsck 1.47.0 (5-Feb-2023)
Pass 1: Checking inodes, blocks, and sizes
Pass 2: Checking directory structure
Pass 3: Checking directory connectivity
Pass 4: Checking reference counts
Pass 5: Checking group summary information
DADOS: 152834/30531584 files (0.4% non-contiguous), 4210324/122096384 blocks
```

`-f` força a verificação mesmo quando o disco parece limpo. Para ext4, os cinco "passes" verificam estruturas diferentes: inodes e blocos, diretórios, conectividade, contagem de referências e o resumo final.

Para exFAT:

```terminal
$ sudo fsck.exfat /dev/sda1
exfatprogs version : 1.2.2
Dados: clean. 152834 files, 2546112 timestamps on drive
```

:::perigo
`fsck` pode modificar o disco ao reparar. Se os dados são insubstituíveis, **faça uma imagem antes** com `dd` (`sudo dd if=/dev/sdb1 of=/caminho/imagem.img bs=4M status=progress`) e rode o `fsck` sobre a imagem, não sobre o disco. Nunca repare sem backup quando o conteúdo importa.
:::

## A remoção segura (e sua ausência)

O erro mais comum — e o mais destrutivo — é arrancar o disco do USB-C sem desmontar. O Linux mantém escritas em **cache** na RAM e as descarrega no disco em lotes (modo `async`). Se você desconecta antes de esvaziar o cache, arquivos ficam pela metade e o sistema de arquivos pode corromper.

A sequência segura:

```terminal
## 1. Garante que todas as escritas em cache foram para o disco
$ sync

## 2. Desmonta (ou deixa o udisks2 cuidar de tudo)
$ udisksctl unmount -b /dev/sda1
Unmounted /dev/sda1.

## 3. Corta a energia do disco (opcional, para HDDs mecânicos)
$ udisksctl power-off -b /dev/sda
```

Para o usuário de desktop, o caminho correto é o ícone de eject no Dolphin — que por baixo executa exatamente essa sequência via udisks2. O `sync` manual é a garantia extra para o terminal.

:::dica
Antes de desconectar um pendrive em que você acabou de copiar arquivos, veja se o LED dele parou de piscar — mas **não confie só nisso**. O LED indica atividade, mas nem todos os discos têm LED, e o cache pode ter sido descarregado há segundos. `sync` + `umount` é a garantia real.
:::

## Recuperando dados quando já foi corrompido

Se o desastre já aconteceu, esta ordem minimiza o dano:

1. **Pare de escrever no disco imediatamente.** Cada gravação pode sobrescrever dados recuperáveis.
2. **Faça uma imagem bit a bit** com `dd` (ou `ddrescue` para discos com setores ruins).
3. **Rode o `fsck`** sobre a imagem, não sobre o disco original.
4. Se o `fsck` não resolver, use ferramentas de recuperação como `testdisk` (recupera partições e arquivos apagados) e `photorec` (recupera arquivos por assinatura de conteúdo, ignorando o sistema de arquivos):

```terminal
$ sudo apt install testdisk   ## no Arch: sudo pacman -S testdisk
$ sudo testdisk /dev/sdb
$ sudo photorec /dev/sdb1
```

:::atencao
`testdisk` e `photorec` são software de instalação opcional e podem não estar disponíveis na imagem padrão do SteamOS (que tem o sistema raiz somente leitura). No Arch, instale com `pacman`; no SteamOS, prefira rodá-los via um container ou noutra máquina Linux. Nunca instale software no mesmo disco que você está tentando recuperar.
:::

## Resumo

- Siga a sequência `lsblk` → `blkid` → `dmesg` → `journalctl` para localizar a causa de uma falha.
- `I/O error` e `reset USB device` no `dmesg` apontam para cabo, energia ou disco com defeito.
- `fsck` verifica e repara sistemas de arquivos; use `fsck.ext4`, `fsck.exfat` ou `ntfsfix` conforme o tipo.
- Nunca rode `fsck` num disco montado; faça uma imagem `dd` antes de reparar dados insubstituíveis.
- Remoção segura = `sync` + `udisksctl unmount` (+ `power-off`), ou o eject do Dolphin.
- Para discos corrompidos, `ddrescue`, `testdisk` e `photorec` são as ferramentas de recuperação.

## Exercícios

1. Desconecte um disco sem desmontar (num pendrive de teste), reconecte e rode `sudo dmesg | tail -20`. Que mensagens o kernel emitiu sobre a conexão e desconexão?
2. Crie um arquivo-bloco, formate como ext4 e monte via loopback. Desmonte e rode `fsck -f` sobre ele. Depois, monte-o de novo e tente rodar `fsck` sem desmontar — que aviso você recebe?
3. Copie um arquivo grande para um pendrive, rode `sync`, e meça o tempo. Repita sem `sync` e compare. Observe também se o LED do pendrive continua piscando após o comando terminar.
4. Use `journalctl -b -e | grep -i mount` para encontrar registros de montagens do boot atual. Encontre em que ponto um disco foi montado e por quem (udisks ou fstab).
5. **Desafio.** Gere propositalmente um sistema de arquivos corrompido: crie um arquivo-bloco, formate como ext4, monte, escreva dados, desmonte, e sobrescreva os primeiros setores com `dd if=/dev/urandom of=bloco.img bs=512 count=10`. Tente montar e rode `fsck -f`. O que o `fsck` encontra? Isso ilustra por que backup vem antes de reparo.