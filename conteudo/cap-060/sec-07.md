Você tem a imagem, o pendrive de resgate e um SSD vazio. Agora é a hora da verdade: transformar aquela imagem de volta num sistema que boota e funciona exatamente como antes. Esta seção cobre a restauração usando `dd`, Clonezilla e `partclone`, com atenção especial ao redimensionamento de partições quando o disco destino é de tamanho diferente.

:::objetivos
- Restaurar uma imagem `dd` para um disco novo de mesmo tamanho
- Usar o Clonezilla para restaurar uma imagem `partclone`
- Restaurar uma imagem comprimida com `gunzip | dd`
- Redimensionar a partição `home` após restauração em disco maior
- Validar que o sistema restaurado boota e funciona

:::

## Restaurando imagem `dd`: o caminho direto

Se você gerou a imagem com `dd`, a restauração é a mesma operação, com `if` e `of` trocados:

```terminal
$ sudo dd if=/mnt/backup/ssd-deck.img of=/dev/nvme0n1 bs=4M status=progress conv=fsync
234275321856 bytes (234 GB, 218 GiB) copied, 3189 s, 73,5 MB/s
```

A imagem vai para o disco inteiro (`nvme0n1`, sem número de partição). Isso restaura a tabela de partições junto, e depois de concluído o disco é idêntico ao original. O `conv=fsync` no final garante que o cache foi descarregado — sem ele, o comando pode encerrar com dados ainda no buffer e você puxa o pendrive achando que está tudo certo.

Se a imagem está comprimida com `gzip`, descomprima em linha durante a restauração:

```terminal
$ gunzip -c /mnt/backup/ssd-deck.img.gz | sudo dd of=/dev/nvme0n1 bs=4M status=progress conv=fsync
```

:::perigo
`of=/dev/nvme0n1` destrói **tudo** no disco destino. Se você apontar para o disco errado (ex.: o disco do backup, também conectado), perde a imagem original e fica sem nada. Confirme com `lsblk` qual é qual antes de rodar.
:::

## Restaurando via Clonezilla

Se a imagem foi feita com Clonezilla (arquivos `.aa`, `.info`, metadados), o caminho é o assistente de restauração:

1. Boot pelo pendrive do Clonezilla.
2. Escolha **device-image** → **restoredisk**.
3. Aponte a origem: o diretório onde está a imagem.
4. Selecione o destino (`nvme0n1`).
5. Aceite as opções sugeridas (`-p reboot`, `-g auto`).

O Clonezilla restaura a tabela de partições primeiro, depois cada partição usando `partclone`. Ao final, o disco está pronto para bootar. A vantagem de usar o assistente: ele valida checksums dos arquivos da imagem e avisa se algo está corrompido.

## Restaurando com `partclone` manualmente

Se você tem uma imagem `partclone` (`.img` ou `.img.gz` de cada partição) e quer controle fino, pode restaurar partição por partição:

```terminal
$ sudo partclone.ext4 -r -s /mnt/backup/home-ptcl.img -o /dev/nvme0n1p8
Partclone v0.3.27 http://partclone.org
Starting to restore image (-) to device (/dev/nvme0n1p8)
Elapsed: 00:12:35, Remaining: 00:00:00, Completed: 100.0%
Total Time: 00:12:35, Ave. Rate: 500.0MB/min, 100.00% completed!
```

`-r` é restore, `-s` é source (imagem), `-o` é output (dispositivo de bloco). Repare que o destino aqui é uma partição (`nvme0n1p8`), não o disco inteiro. Isso é útil quando você quer restaurar só o `home` sem mexer no sistema — como numa migração onde o sistema ficou igual, mas você quer seus dados de volta.

:::atencao
Restaurar partições individuais requer que a **tabela de partições** já exista no disco destino. Se o disco estiver zerado, recrie as partições com `sgdisk` ou `fdisk` antes, ou restaure a tabela via Clonezilla/backup.
:::

## Redimensionando `home` após restaurar em disco maior

Se o disco novo é maior que o antigo, após a restauração sobra espaço não alocado no final do disco. A partição `home` (a última, `p8`) é a candidata natural a absorver esse espaço. O fluxo com `growpart` e `resize2fs`:

```terminal
## após restaurar a imagem
$ sudo growpart /dev/nvme0n1 8
CHANGED: partition=8 start=12345678 old: size=207.1G end=45678901 new: size=907.1G end=99999999
$ sudo e2fsck -f /dev/nvme0n1p8
$ sudo resize2fs /dev/nvme0n1p8
resize2fs 1.47.0 (5-Feb-2023)
Resizing the filesystem on /dev/nvme0n1p8 to 237756416 (4k) blocks.
The filesystem on /dev/nvme0n1p8 is now 237756416 (4k) blocks long.
```

`growpart 8` expande a partição nº 8 para usar o espaço contíguo disponível. `e2fsck -f` força verificação prévia (obrigatório antes do resize). `resize2fs` então expande o sistema de arquivos ext4 dentro da partição. O processo é **online**: você pode fazer isso já bootado no sistema restaurado, com o `home` montado, e o espaço extra aparece instantaneamente.

## Validando a restauração

Depois de restaurar, não reinicie direto no escuro. Valide:

1. **Monte as partições** em modo leitura e liste arquivos conhecidos:
   ```terminal
   $ sudo mount -o ro /dev/nvme0n1p8 /mnt/home
   $ ls /mnt/home/deck/Documents/
   ```
2. **Verifique o bootloader**: o Clonezilla restaura o `esp` (EFI) junto; confira com `efibootmgr` que a entrada do SteamOS existe.
3. **Calcule um checksum** rápido de alguns arquivos grandes contra o backup.

Se tudo conferir, reboot sem o pendrive. O Deck deve entrar no SteamOS como se nada tivesse acontecido — seus saves, configurações e até o mesmo wallpaper estarão lá.

## Resumo

- `dd if=imagem of=/dev/nvme0n1` restaura o disco inteiro; com `gunzip`, descomprime em linha.
- Clonezilla restaura via assistente `restoredisk`, validando checksums dos arquivos da imagem.
- `partclone.ext4 -r` restaura uma partição individual, útil para `home` apenas.
- `growpart` + `resize2fs` expandem `home` para aproveitar espaço extra em discos maiores.
- Valide montando partições, conferindo bootloader e verificando arquivos antes do reboot.

## Exercícios

1. Restaure uma imagem `dd` de uma partição pequena (`nvme0n1p7`) para um destino e monte em modo leitura para conferir.
2. Restaure com Clonezilla a imagem da partição criada no capítulo 5 e valide com `diff -r`.
3. Simule a restauração de uma imagem comprimida com `gunzip -c | dd` para um arquivo (não para disco!) e confira o checksum.
4. Crie uma partição num disco de teste, expanda-a com `growpart` e redimensione o sistema de arquivos com `resize2fs`.
5. **Desafio.** Faça um ciclo completo: gere imagem de uma partição, apague-a, recrie a tabela, restaure a imagem, monte e valide com `sha256sum` antes e depois.