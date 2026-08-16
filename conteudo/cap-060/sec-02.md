O Linux oferece uma ferramenta brutalmente simples para clonar discos: o `dd`. Ele não entende de arquivos, pastas ou sistemas de arquivos — copia bytes brutos de um dispositivo para outro, do primeiro ao último. É exatamente isso que você quer quando precisa de uma imagem fiel de um disco inteiro. Aqui você aprende a usar o `dd` para gerar uma imagem do SSD do Steam Deck e, mais importante, a entender o que está fazendo antes de apertar Enter.

:::objetivos
- Entender o modelo de entrada/saída do `dd` (if/of)
- Clonar um disco inteiro para um arquivo de imagem
- Identificar o dispositivo do SSD com segurança antes de clonar
- Entender a limitação de espaço (a imagem tem o tamanho do disco, não dos dados)
- Clonar disco para disco em um único comando
:::

## O modelo de `dd`: entrada e saída brutas

O nome `dd` vem de *data definition*, mas a memória que importa é `if` (*input file*) e `of` (*output file*). O comando lê de `if`, bloco a bloco, e escreve em `of`, sem entender o conteúdo. Copiar um disco inteiro é, na essência, uma linha:

```terminal
$ sudo dd if=/dev/nvme0n1 of=/home/deck/backup/ssd.img
```

`if=/dev/nvme0n1` é o SSD inteiro (o device, sem número de partição). `of=ssd.img` é o arquivo de imagem que vai recebê-lo. O `sudo` é obrigatório: ler o dispositivo cru exige privilégio de root. O comando só termina quando o último byte for lido.

:::atencao
`/dev/nvme0n1` (o disco todo) é diferente de `/dev/nvme0n1p8` (uma partição). Clonar `/dev/nvme0n1` copia a tabela de partições, o bootloader e todas as partições de uma vez. Clonar `nvme0n1p8` copia só o `home`. Não confunda os dois.
:::

## Identificando o dispositivo antes de clonar

Antes de qualquer `dd`, confirme qual é o disco certo. O comando `lsblk` mostra a árvore de dispositivos; o `--fs` revela os sistemas de arquivos, o que ajuda a não confundir o SSD interno com um pendrive conectado:

```terminal
$ lsblk --fs
NAME        FSTYPE LABEL   UUID                                 MOUNTPOINT
sda                                                             
└─sda1      vfat   VENTOY  4E21-0000                            
nvme0n1                                                         
├─nvme0n1p1 vfat   esp     ...
├─nvme0n1p8 ext4   home    ...
```

Repare em `sda1` com label `VENTOY`: é um pendrive. O SSD interno é o `nvme0n1`. Escrever a imagem num disco errado, ou ler do disco errado, é o erro clássico — por isso este passo de identificação é sagrado.

:::perigo
Um `dd` com `of=` apontado para o dispositivo errado **sobrescreve** o que estiver lá, sem aviso e sem lixeira. Tenha certeza absoluta do caminho. Se houver pendrives ou cartões conectados, desconecte-os ou confirme cada `of=` letra por letra.
:::

## Gerando a imagem completa

O destino da imagem precisa estar em outro disco — jamais dentro do próprio SSD que você está clonando, senão o arquivo cresce sobre a fonte. Use um disco externo montado (ex.: `mount /dev/sdb1 /mnt`):

```terminal
$ df -h /mnt
Filesystem      Size  Used Avail Use% Mounted on
/dev/sdb1       466G   12G  430G   1% /mnt
$ sudo dd if=/dev/nvme0n1 of=/mnt/ssd-deck.img bs=4M status=progress
234275321856 bytes (234 GB, 218 GiB) copied, 3210 s, 73,0 MB/s
55880+1 records in
55880+1 records out
234275321856 bytes (234 GB, 218 GiB) copied, 3210.2 s, 73,0 MB/s
```

`bs=4M` define o bloco de transferência em 4 megabytes (acelera muito a cópia), e `status=progress` exibe uma barra de progresso ao vivo. Repare no detalhe importante: o arquivo final tem **o tamanho do disco inteiro** (218 GiB), não do que está ocupado nele. Um SSD de 223 GB gera uma imagem de 223 GB mesmo que só 40 GB estejam preenchidos, porque `dd` copia também o espaço vazio.

## Por que a imagem pesa o disco inteiro

O `dd` copia byte a byte, incluindo zeros do espaço livre. Não há compressão nem deduplicação — ele não sabe o que é dado útil. Para um disco de 223 GB, isso significa reservar 223 GB no destino. As consequências práticas:

- O destino precisa ter **mais** espaço livre que o tamanho do disco-fonte.
- Backups "inteiros" frequentes ficam caros e lentos.
- A solução são as ferramentas que **entendem o sistema de arquivos** (partclone, Clonezilla) ou a **compressão por cima** do `dd` — assunto da próxima seção.

Ainda assim, o `dd` tem um valor inegociável: a imagem é uma fotografia perfeita, bootável, que pode ser gravada de volta em qualquer disco de tamanho igual ou maior. É o padrão-ouro de fidelidade.

## Clonando disco para disco

O `dd` também copia direto de um SSD para outro, sem passar por um arquivo intermediário. É o caminho para migrar para um disco novo imediatamente:

```terminal
$ sudo dd if=/dev/nvme0n1 of=/dev/sdb bs=4M status=progress conv=fsync
```

`conv=fsync` força o esvaziamento dos buffers ao final, garantindo que todos os dados realmente chegaram ao disco antes de o comando encerrar. O disco destino (`sdb`) deve ser **igual ou maior** que o fonte.

:::nota
Clonar disco para disco é rápido quando os dois estão no mesmo barramento, mas o destino precisa estar vazio ou aceitar a sobrescrita total. Migração para SSD maior, com aproveitamento do espaço extra, é o tema da [seção 8](#/cap-060/sec-08).
:::

## Resumo

- `dd` copia bytes brutos de `if` para `of`, sem entender o conteúdo.
- `if=/dev/nvme0n1` lê o disco inteiro (com tabela de partições); `nvme0n1p8` lê só uma partição.
- `bs=4M status=progress` acelera e mostra o progresso da cópia.
- Uma imagem `dd` tem o tamanho do disco inteiro, não dos dados ocupados.
- `conv=fsync` garante que tudo foi gravado antes de encerrar.
- Sempre confirme `if` e `of` — erro de `of` destrói dados.

## Exercícios

1. Rode `lsblk --fs` e identifique o SSD interno (`nvme0n1`) e qualquer disco externo conectado.
2. Monte um disco externo e gere uma imagem de uma partição pequena (ex.: `nvme0n1p1`, de 64M) com `dd if=... of=... bs=1M status=progress`.
3. Compare o tamanho da imagem gerada com o tamanho da partição usando `ls -lh` e `lsblk`.
4. Verifique a integridade da imagem calculando `sha256sum` dela duas vezes e conferindo que os valores coincidem.
5. **Desafio.** Clone uma partição pequena para um disco de mesmo tamanho, depois monte a cópia em modo leitura (`mount -o ro`) e compare uma árvore de diretórios com `diff -r` entre original e cópia.
