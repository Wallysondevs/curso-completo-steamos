Cartões falsos, remoções abruptas, quedas de energia, sistemas de arquivos corrompidos: o microSD tem seus modos de falha, e a maioria deles é recuperável — se você souber o que fazer. Esta seção cobre testes de integridade, checagem e reparo de sistemas de arquivos, recuperação de espaço e prevenção da perda de dados.

:::objetivos
- Testar se um microSD é genuíno e tem a capacidade anunciada
- Checar e reparar ext4/Btrfs/exFAT com fsck e ferramentas específicas
- Recuperar espaço e identificar arquivos corrompidos
- Prevenir corrupção com boas práticas de ejeção e energia
- Saber quando o cartão deve ser substituído
:::

## Testando autenticidade e capacidade

Cartões falsificados são um problema real: a controladora mente sobre a capacidade e, ao atingir o limite real, começa a sobrescrever dados silenciosamente. O teste clássico é escrever no cartão inteiro e ler de volta:

```terminal
## Ver a capacidade real detectada pelo kernel
$ lsblk -b -o NAME,SIZE /dev/mmcblk0

## Escrever dados determinísticos e ler de volta (destrutivo!)
$ sudo badblocks -wsv /dev/mmcblk0
```

O `badblocks -wsv` faz escrita destrutiva em quatro padrões e reporta blocos ruins. Para um teste de leitura (no volume formatado) sem perder dados:

```terminal
$ sudo badblocks -sv /dev/mmcblk0p1
```

:::perigo
`badblocks -w` (modo escrita) **destrói todos os dados** do cartão. Rode apenas em cartão vazio/descartável. O modo `-s` (sem `-w`) é só leitura e seguro.
:::

Para um teste abrangente de falsificação (dentro do Deck), a ferramenta `f3` é a referência:

```terminal
$ sudo pacman -S f3
$ f3probe --destructive /dev/mmcblk0
$ f3write /run/media/deck/SD && f3read /run/media/deck/SD
```

O `f3probe` detecta rapidamente o tamanho real, e `f3write`/`f3read` validam a integridade de ponta a ponta.

## Checando e reparando ext4

Para ext4:

```terminal
## Desmontar primeiro
$ sudo umount /dev/mmcblk0p1

## Verificar e corrigir erros
$ sudo fsck.ext4 -f /dev/mmcblk0p1

## Ou, se houver aviso de superbloco corrompido, usar backup
$ sudo e2fsck -b 32768 /dev/mmcblk0p1
```

- `-f`: força a checagem mesmo se o volume parecer limpo.
- `-y`: responde "sim" a todas as correções (útil para automatizar).
- `e2fsck -b 32768`: usa um superbloco de backup quando o principal está ilegível.

## Checando e reparando Btrfs

Btrfs tem ferramentas próprias:

```terminal
## Checar integridade (volume desmontado)
$ sudo btrfs check /dev/mmcblk0p1

## Ver erros e contadores (montado)
$ sudo btrfs device stats /run/media/deck/SD

## Re-escrubar para detectar corrupção via checksum
$ sudo btrfs scrub start /run/media/deck/SD
$ sudo btrfs scrub status /run/media/deck/SD
```

O `scrub` lê todos os dados e metadados, comparando com os checksums — é a forma de detectar corrupção silenciosa que o ext4 não consegue.

## Checando e reparando exFAT

Para exFAT:

```terminal
$ sudo umount /dev/mmcblk0p1
$ sudo fsck.exfat /dev/mmcblk0p1
```

O `fsck.exfat` verifica e repara inconsistências do exFAT. Se o volume estiver gravemente corrompido e não montar, a recuperação pode exigir ferramentas de PC (Windows `chkdsk`), já que o exFAT é um formato Microsoft.

## Recuperando espaço e vendo estado de saúde

```terminal
## Espaço e uso
$ df -h /run/media/deck/SD

## Estado de saúde do device (se suportado)
$ sudo mmc extcsd read /dev/mmcblk0 2>/dev/null || \
  sudo smartctl -a /dev/mmcblk0 2>/dev/null

## Listar arquivos grandes (bons candidatos a mover/apagar)
$ sudo du -ah /run/media/deck/SD | sort -rh | head -20
```

:::dica
Muitos controladores de microSD fazem "wear leveling" e reportam vida útil via `mmc extcsd` (campos `EXT_CSD_DEVICE_LIFE_TIME_EST`). Se o cartão está antigo e você notou lentidão ou erros crescentes, considere substituí-lo antes de confiar dados importantes a ele.
:::

## Prevenção: as práticas que evitam corrupção

- **Ejete sempre** (`umount` + `sync`) antes de remover o cartão.
- **Não remova durante escrita**: feche jogos e aguarde o Steam liberar antes de puxar.
- **Evite quedas de energia**: no Modo Desktop, desligue de forma limpa; evite puxar o cabo.
- **Use `noatime`** na montagem para reduzir gravações.
- **Faça backup**: cartão não é backup; copie saves importantes para outro lugar.

## Pontos-chave

- Cartões falsos mentem a capacidade; teste com `badblocks -wsv` (destrutivo) ou `f3`.
- ext4: `fsck.ext4 -f`; superbloco corrompido → `e2fsck -b 32768`.
- Btrfs: `btrfs check`, `btrfs scrub` (detecta corrupção por checksum).
- exFAT: `fsck.exfat`; corrupção grave pode exigir `chkdsk` no Windows.
- Previna com ejeção correta, `noatime`, e substituindo cartões antigos.

## Exercícios

1. Rode `lsblk -b -o NAME,SIZE` e compare a capacidade real com a anunciada no rótulo.
2. Num cartão descartável, rode `sudo badblocks -wsv` e interprete qualquer bloco ruim.
3. Desmonte um cartão ext4 e rode `sudo fsck.ext4 -f`, observando o relatório.
4. Se tiver Btrfs, rode `btrfs scrub` e confira o `btrfs device stats`.
5. **Desafio.** Instale o `f3` e rode `f3probe --destructive` num cartão suspeito; compare o tamanho real com o rotulado.
