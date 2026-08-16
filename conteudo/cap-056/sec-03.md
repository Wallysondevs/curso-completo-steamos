ext4 é o padrão do Steam Deck, mas não é a única opção. O Btrfs oferece recursos que o ext4 não tem — snapshots, compressão transparente e checksums — e que podem valer muito para quem quer backup/rollback ou economizar espaço num cartão limitado. Esta seção mostra quando e como formatar o microSD em Btrfs e tirar proveito disso no Deck.

:::objetivos
- Entender o que o Btrfs traz além do ext4 (snapshots, compressão, checksum)
- Formatar o cartão em Btrfs com as opções adequadas para games
- Ativar compressão para economizar espaço
- Criar e restaurar snapshots com `btrfs subvolume`
- Pesar os prós e contras do Btrfs em microSD
:::

## Por que Btrfs no Deck

O Btrfs é um sistema de arquivos copy-on-write (CoW) com três recursos especialmente úteis no contexto de jogos:

- **Snapshots**: fotos instantâneas do estado do sistema de arquivos, quase sem custo. Úteis para "congelar" uma instalação boa antes de aplicar um mod ou patch arriscado, e voltar se algo quebrar.
- **Compressão (zstd/lzo)**: reduz o espaço ocupado em disco. Jogos com muitos arquivos comprimíveis (textos, texturas, assets legados) podem economizar até 20–40% — o que num cartão de 512 GB é muito.
- **Checksums de dados**: detectam corrupção silenciosa (bit rot), raro mas real em mídia flash que fica muito tempo sem uso.

O custo é mais gravação interna (CoW) e, em alguns cenários, mais uso de CPU para descomprimir. Em microSD, onde os ciclos de escrita são um recurso limitado, isso é um trade-off real, mas para a maioria dos usos o benefício do espaço economizado compensa.

## Formatando em Btrfs

O comando básico:

```terminal
$ sudo mkfs.btrfs -L SD -f /dev/mmcblk0p1
```

Opções úteis:

- `-L SD`: rótulo.
- `-f`: força (ignora sistemas de arquivos existentes).
- `-m single -d single`: modo de alocação simples (para um disco só), evitando a duplicação de metadados que o Btrfs usa em RAID.

Para um cartão simples, o recomendado é:

```terminal
$ sudo mkfs.btrfs -L SD -m single -d single -f /dev/mmcblk0p1
```

:::nota
Ao contrário do ext4, o Btrfs não tem uma flag `casefold` global no mkfs. Para jogos Proton que precisam de case-folding, o Btrfs ainda não oferece suporte maduro equivalente ao `-O casefold` do ext4. Se compatibilidade com muitos títulos Proton é prioridade, o ext4 continua sendo a escolha mais segura.
:::

## Montando e criando subvolumes

O Btrfs organiza snapshots e subvolumes de forma própria. Uma estrutura comum para o Deck:

```terminal
$ sudo mount /dev/mmcblk0p1 /mnt
$ sudo btrfs subvolume create /mnt/@games
$ sudo btrfs subvolume create /mnt/@steam
$ sudo umount /mnt
```

Depois, cada subvolume pode ser montado de forma independente ou gerenciado separadamente:

```terminal
$ sudo mount -o subvol=@games,compress=zstd /dev/mmcblk0p1 /run/media/deck/SD
```

## Compressão

A compressão pode ser ativada na montagem (temporária) ou como padrão do volume (persistente):

```terminal
## Ativar zstd na montagem
$ sudo mount -o compress=zstd /dev/mmcblk0p1 /run/media/deck/SD

## Ou definir como opção padrão gravada no volume
$ sudo btrfs property set /run/media/deck/SD compression zstd
```

O `zstd` é geralmente o melhor equilíbrio entre taxa de compressão e custo de CPU; `lzo`/`zlib` são alternativas mais rápidas ou mais agressivas, respectivamente.

## Snapshot e rollback

O fluxo clássico:

```terminal
## Criar snapshot do estado atual
$ sudo btrfs subvolume snapshot /run/media/deck/SD/@games /run/media/deck/SD/@games-backup-bom

## Ver algo quebrou mais tarde — restaurar (trocando o subvolume)
$ sudo btrfs subvolume delete /run/media/deck/SD/@games
$ sudo btrfs subvolume snapshot /run/media/deck/SD/@games-backup-bom /run/media/deck/SD/@games
```

:::dica
Snapshots Btrfs são instantâneos e baratos porque usam CoW: só as mudanças posteriores ocupam espaço novo. Você pode manter vários snapshots "bons" sem multiplicar o uso de disco — ótimo para experimentar mods em jogos grandes.
:::

## Vale a pena em microSD?

Resumo honesto:

- **A favor**: economia de espaço por compressão (relevante em cartões caros), snapshots para rollback, detecção de corrupção.
- **Contra**: CoW aumenta gravações (desgasta mais o flash), compressão consome CPU (menor em jogos que já comprimem assets), falta de case-fold maduro para Proton, menor adoção/teste na comunidade do Deck.

Para a maioria dos usuários que só quer jogar, ext4 (Modo Jogo) é mais simples e seguro. Btrfs é a escolha de quem quer controle avançado e entende o trade-off.

## Pontos-chave

- Btrfs soma snapshots, compressão e checksums ao que o ext4 oferece.
- Formate com `sudo mkfs.btrfs -L SD -m single -d single -f /dev/mmcblk0p1`.
- Compressão `zstd` economiza espaço mas custa CPU e gravações (CoW).
- Snapshots criam pontos de rollback baratos via `btrfs subvolume snapshot`.
- Btrfs não tem case-fold maduro como o ext4 — pesa contra ele em muitos jogos Proton.

## Exercícios

1. Formate um cartão em Btrfs com `-m single -d single` e liste os subvolumes com `sudo btrfs subvolume list`.
2. Crie subvolumes `@games` e `@steam` e monte `@games` com compressão zstd.
3. Crie um snapshot de `@games`, modifique um arquivo, e restaure via snapshot.
4. Habilite compressão como padrão com `btrfs property set ... compression zstd` e confirme com `btrfs property get`.
5. **Desafio.** Meça o espaço economizado pela compressão em um jogo real usando `du` antes e depois, e avalie se o ganho justifica o uso no seu caso.
