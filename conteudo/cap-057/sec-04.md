O Steam Deck tem porta USB-C e uma relação pragmática com formatos de disco: ele lê quase tudo, mas a escolha do sistema de arquivos dita se você terá permissões Unix, se o disco funcionará plugado num Windows e se a performance será decente. Esta seção compara os quatro sistemas de arquivos que importam para discos externos e ensina a formatar cada um com `mkfs`.

:::objetivos
- Comparar ext4, exFAT, NTFS e Btrfs para o cenário de disco externo
- Entender as implicações de permissão, compatibilidade e journaling de cada formato
- Formatar um disco ou partição com `mkfs.ext4`, `mkfs.exfat` e `mkfs.ntfs`
- Escolher o sistema de arquivos certo para cada cenário (só Deck, Deck+Windows, só mídia)
- Identificar as limitações do exFAT e FAT32 para arquivos grandes
:::

## Quatro candidatos, quatro histórias

| Sistema | Dono/Permissões | Compatível com Windows | Tamanho máximo de arquivo | Journaling |
|---|---|---|---|---|
| **ext4** | Sim (UID/GID nativos) | Não (sem driver) | 16 TiB | Sim |
| **exFAT** | Não (atribuído na montagem) | Sim (nativo) | 16 EiB | Não |
| **NTFS** | Parcial (via ntfs-3g) | Sim (nativo) | 16 EiB | Sim (via ntfs-3g) |
| **Btrfs** | Sim (UID/GID nativos) | Não (sem driver) | 16 EiB | Sim (CoW) |

**ext4** é o sistema de arquivos mais maduro do Linux. Suporta permissões Unix com precisão — cada arquivo tem dono, grupo e bits de modo — e o journaling protege contra corrupção em quedas de energia. A desvantagem é brutal: um disco ext4 conectado a um PC Windows é simplesmente invisível, a menos que você instale drivers de terceiros.

**exFAT** é o formato herdado da Microsoft, otimizado para flash (cartões SD, pendrives). Não tem journaling, não entende permissões Unix, mas é suportado nativamente por Windows, macOS, Linux, Android, câmeras e videogames. Para um disco que você pluga no Deck *e* no notebook do trabalho, exFAT é a escolha de menor atrito.

**NTFS** é o sistema de arquivos do Windows, com journaling completo. O Linux lê e escreve NTFS via `ntfs-3g` (userspace) ou pelo driver `ntfs3` mais novo (kernel 5.15+). A performance é inferior ao ext4 e as permissões Unix são simuladas — mas se o disco já veio formatado em NTFS, você não precisa reformatar.

**Btrfs** é o mais moderno dos quatro, com compressão, snapshots e checksums por bloco. O SteamOS 3.6 usa Btrfs em algumas partições internas. Para disco externo, o principal atrativo é a compressão transparente e a possibilidade de enviar/receber snapshots, mas a complexidade extra raramente compensa fora de cenários muito específicos.

## Formatando com mkfs

Formatar **destrói todos os dados** da partição. Sempre confira o alvo com `lsblk` antes. Cada sistema de arquivos tem seu próprio `mkfs.*`:

```terminal
## ext4 — a escolha padrão para discos que só vivem no Linux
$ sudo mkfs.ext4 -L "BACKUP" /dev/sda1
mke2fs 1.47.0 (5-Feb-2023)
Creating filesystem with 122096384 4k blocks and 30531584 inodes
Filesystem UUID: 8f3b2d1c-994e-4a1b-b7c2-e8d3f5a0126b
Superblock backups stored on blocks:
	32768, 98304, 163840, 229376, 294912, 819200, 884736, 1605632
Allocating group tables: done
Writing inode tables: done
Creating journal (262144 blocks): done
Writing superblocks and filesystem accounting information: done
```

Os primeiros 5% dos blocos são reservados para o root (`-m 5`). Em discos de dados, reduzir esse percentual libera espaço:

```terminal
$ sudo mkfs.ext4 -m 0 -L "DADOS" /dev/sdb1
```

```terminal
## exFAT — para discos que circulam entre sistemas
$ sudo mkfs.exfat -n "TRANSFER" /dev/sdc1
mkexfatfs 1.3.0
Creating... done.
Flushing... done.
File system created successfully.
```

```terminal
## NTFS — formato Windows com ferramentas Linux
$ sudo mkfs.ntfs -f -L "WINDATA" /dev/sdd1
```

:::perigo
`mkfs` não pede confirmação. Se você errar o dispositivo, destrói o que estiver lá — inclusive o disco do sistema. Confira duas vezes com `lsblk` e `sudo blkid` antes de apertar Enter.
:::

## FAT32: o sobrevivente que não morre

FAT32 ainda é o padrão de fábrica de muitos pendrives e cartões SD, mas tem uma limitação inaceitável para uso moderno: arquivos individuais não podem passar de **4 GiB**. Um arquivo `.mkv` de 6 GiB simplesmente não cabe, e a cópia falha com "File too large" quando chega nos 4 GiB.

```terminal
$ cp filme.mkv /mnt/pendrive/
cp: error writing '/mnt/pendrive/filme.mkv': File too large
```

Se seu disco ou pendrive veio em FAT32, considere reformatar em exFAT — você ganha compatibilidade cruzada sem o limite de arquivo.

## O trade-off do journaling

Journaling (presente em ext4 e NTFS) é um diário de operações: antes de modificar o sistema de arquivos, o kernel anota no journal o que pretende fazer. Se a energia cair no meio da operação, o journal tem a receita para desfazê-la ou completá-la. O preço é um pouco mais de escrita no disco, o que em flash pode encurtar a vida útil — mas em SSDs modernos é irrelevante.

exFAT não tem journaling. Para dados que você só lê (ROMs, mídia), isso é aceitável e até preferível. Para um disco onde você edita arquivos o dia inteiro, o journaling é uma camada de segurança que vale a pena.

:::info
O SteamOS 3.6 monta discos exFAT com a opção `discard`, que informa ao firmware do SSD quais blocos estão livres. Isso mantém a performance de escrita alta em SSDs externos com suporte a TRIM.
:::

## Resumo

- ext4 é o melhor sistema de arquivos para discos que só se conectam ao Deck e a outras máquinas Linux.
- exFAT é a escolha de compatibilidade: funciona no Deck, Windows e macOS, sem limite de 4 GiB como o FAT32.
- NTFS é suportado pelo Deck via ntfs-3g; mantenha se o disco já veio formatado do Windows e você não quer reformatar.
- Btrfs oferece compressão e snapshots, mas para discos externos raramente compensa a complexidade.
- `mkfs.ext4`, `mkfs.exfat` e `mkfs.ntfs` formatam partições; o UUID muda a cada formatação.
- FAT32 não comporta arquivos acima de 4 GiB — troque por exFAT se esbarrar nesse limite.

## Exercícios

1. Liste os sistemas de arquivos dos discos atualmente conectados com `lsblk -f`. Anote o tipo de cada partição.
2. Crie um arquivo de 1 GiB cheio de zeros com `dd if=/dev/zero of=/tmp/bloco bs=1M count=1024` e formate-o como ext4 com `mkfs.ext4 /tmp/bloco`. Monte-o via loopback com `sudo mount -o loop /tmp/bloco /mnt/teste` e confira com `df -h /mnt/teste`.
3. Com o arquivo-bloco ainda montado, crie um diretório e um arquivo dentro dele. Desmonte, reformate como exFAT (`mkfs.exfat`) e remonte. Os arquivos ainda estão lá? Por quê?
4. Identifique um pendrive ou cartão SD que esteja em FAT32 usando `lsblk -f`. Quanto espaço livre ele tem? Se você tentasse copiar um arquivo de 5 GiB para ele, o que aconteceria?
5. **Desafio.** Pesquise a diferença entre `mkfs.ext4` com `-O ^has_journal` e o padrão com journal. Em que cenário desabilitar o journal num disco externo faria sentido? Monte um loopback sem journal e compare o espaço disponível com `df`.