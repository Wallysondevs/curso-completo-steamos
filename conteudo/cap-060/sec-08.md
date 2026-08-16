O upgrade mais comum no Steam Deck é trocar o SSD por um maior — de 64 GB ou 512 GB para 1 TB, por exemplo. O objetivo não é apenas copiar dados: é levar todo o seu sistema, saves e configurações para o disco novo **aproveitando o espaço extra**. Esta seção cobre o fluxo completo da migração, do backup prévio ao redimensionamento final.

:::objetivos
- Planejar a migração: backup, ferramentas e disco novo
- Clonar disco para disco com `dd` preservando o boot
- Redimensionar a partição `home` para usar o disco maior
- Migrar preservando o layout A/B do SteamOS
- Validar e bootar o sistema migrado

:::

## Planejando a migração sem precipitação

Antes de abrir o Deck, faça a lição de casa:

1. **Faça backup total** (imagem `dd` ou Clonezilla) no disco velho, como visto nas seções anteriores. Se algo der errado, você tem a volta.
2. **Compre o SSD certo**: formato M.2 2230, interface NVMe (PCIe). O Deck usa esse formato compacto — não confunda com M.2 2280 ou SATA.
3. **Verifique compatibilidade de tamanho**: o novo disco deve ser **igual ou maior** que o antigo. Para aproveitar o espaço, maior é o caminho.
4. **Tenha um adaptador/leitor NVMe M.2 USB** para conectar o disco novo ao Deck se for clonar com o sistema velho ainda no lugar.

A migração tem dois caminhos: com disco-velho-ainda-instalado (clonagem via adaptador USB) ou com disco-velho-removido (restauração a partir de imagem). O primeiro é o mais direto.

## Clonando o disco inteiro para o novo SSD

Com o disco novo num adaptador USB e o velho no slot interno, conecte o adaptador ao Deck via hub USB-C. Identifique os dois dispositivos:

```terminal
$ lsblk -o NAME,SIZE,MODEL
NAME        SIZE MODEL
nvme0n1   223.6G  (SSD interno velho)
sda       931.5G  (SSD novo 1TB via adaptador USB)
```

Agora clone o disco inteiro — a tabela de partições e o bootloader vão junto:

```terminal
$ sudo dd if=/dev/nvme0n1 of=/dev/sda bs=4M status=progress conv=fsync
```

Aqui `if` é o disco velho e `of` é o novo. Repare que, com `dd`, o clone é byte a byte: o disco novo ficará com **exatamente** o mesmo layout e tamanho de partições do velho, sobrando espaço não alocado no final. O próximo passo é reivindicar esse espaço.

:::perigo
Nesta operação, `if` e `of` apontam para dois discos físicos que podem se parecer muito no nome. Verifique com `lsblk -o NAME,SIZE,MODEL` e confirme pelo **tamanho** — o velho (223G) e o novo (931G) têm tamanhos bem diferentes, o que ajuda a não errar.
:::

## Reivindicando o espaço extra com `growpart` e `resize2fs`

Depois de clonar e trocar os discos fisicamente, boote o Deck com o SSD novo. A partição `home` (`p8`, a última) pode ser expandida sobre o espaço não alocado:

```terminal
$ sudo growpart /dev/nvme0n1 8
$ sudo e2fsck -f /dev/nvme0n1p8
$ sudo resize2fs /dev/nvme0n1p8
```

Ou, tudo numa sequência com verificação no meio:

```terminal
$ df -h /home
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p8  207G  145G   62G  70% /home
$ sudo growpart /dev/nvme0n1 8 && sudo e2fsck -f /dev/nvme0n1p8 && sudo resize2fs /dev/nvme0n1p8
$ df -h /home
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p8  907G  145G  762G  16% /home
```

De 207 GB para 907 GB. O `resize2fs` opera online e expande o ext4 dentro da partição sem mover um byte dos dados existentes — seus jogos e saves ficam intactos.

## Preservando o layout A/B do SteamOS

O SteamOS depende do esquema A/B: duas raízes, dois firmwares, dois `var`. Na clonagem com `dd`, **tudo isso vem junto** porque você copiou o disco inteiro, não só o `home`. Isso é crucial — clonar apenas a partição `home` e instalar o sistema do zero teria um resultado diferente (funcionaria, mas perderia o estado A/B, volta de versão e configurações de sistema).

Ao clonar o disco inteiro, você preserva:

- As duas raízes (`rootfs-A` e `rootfs-B`), permitindo rollback.
- As duas gerações de firmware de boot.
- O `esp` (EFI) com o bootloader correto.
- O `home` com todos os dados.

Por isso, **prefira sempre clonar o disco inteiro**, não apenas partições avulsas, ao migrar de SSD.

## Lidando com Btrfs (caso use) e partições alternativas

Se você converteu o `home` para Btrfs (alguns usuários fazem), o redimensionamento muda de ferramenta. Em vez de `resize2fs`, usa-se `btrfs filesystem resize`:

```terminal
$ sudo btrfs filesystem resize max /home
Resize '/home' of 'max'
```

E a expansão da partição continua com `growpart`. Use `lsblk -f` para ver o tipo de sistema de arquivos antes de escolher a ferramenta — aplicar `resize2fs` numa partição Btrfs, ou `btrfs` numa ext4, não funciona.

:::atencao
`growpart` expande a partição, mas o **sistema de arquivos** dentro dela precisa de uma ferramenta compatível para crescer junto. A dupla `growpart` + `resize2fs` é para ext4; `growpart` + `btrfs filesystem resize` é para Btrfs. Misturar as ferramentas falha silenciosamente ou deixa o espaço inacessível.
:::

## Migrando com restauração a partir de imagem

Quando você não tem o disco velho disponível (já queimou, vendeu), a migração vira restauração: faça a imagem do disco velho antes de removê-lo, depois restaure no novo e redimensione. O fluxo:

1. Faça a imagem `dd`/Clonezilla do disco velho (seções [2](#/cap-060/sec-02) e [5](#/cap-060/sec-05)).
2. Instale o disco novo.
3. Boot pelo pendrive de resgate e restaure a imagem (seção [7](#/cap-060/sec-07)).
4. Boot no sistema restaurado e redimensione `home` com `growpart` + `resize2fs`.

Funciona igual, só que a imagem atua como ponte entre os dois discos no tempo.

## Validando a migração

Depois de clonar e redimensionar, valide antes de considerar o trabalho encerrado:

1. `df -h /home` — o tamanho deve refletir o disco novo.
2. Rode um jogo que tinha saves locais e confira que o progresso está lá.
3. Confira com `efibootmgr` que a entrada de boot aponta para o disco certo.
4. Guarde o disco velho (se ainda funciona) como "disco de emergência" por algumas semanas — uma migração só é dada como concluída depois de um uso real sem surpresas.

## Resumo

- Migração = backup completo + troca de SSD + clone do disco inteiro + redimensionamento.
- `dd if=/dev/nvme0n1 of=/dev/sda` clona tudo, incluindo tabela de partições e layout A/B.
- `growpart` + `resize2fs` expandem `home` para absorver o espaço extra (ext4).
- Para Btrfs, use `btrfs filesystem resize max` em vez de `resize2fs`.
- Clone disco inteiro, nunca só partições, para preservar o esquema A/B do SteamOS.
- Valide com `df -h`, teste de saves e `efibootmgr`.

## Exercícios

1. Liste os discos com `lsblk -o NAME,SIZE,MODEL` e identifique interno, externo e adaptador antes de qualquer clone.
2. Faça a imagem `dd` do disco velho para um arquivo num disco externo (backup prévio à migração).
3. Num disco de teste, clone o disco-velho para o maior e rode `growpart` na última partição.
4. Redimensione o sistema de arquivos com `resize2fs` (ou `btrfs filesystem resize` conforme o tipo) e confirme com `df -h`.
5. **Desafio.** Complete uma migração real: backup, clonagem, troca física, boot e redimensionamento — e documente o tempo total e os pontos de risco que você encontrou.