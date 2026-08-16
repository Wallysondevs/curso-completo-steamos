O `dd` puro funciona, mas gera uma imagem gigantesca e não avisa nada durante a cópia até o fim. Felizmente, ele aceita uma série de parâmetros que tornam o processo seguro, rápido e econômico. Esta seção mostra como usar tamanho de bloco otimizado, barra de progresso, compressão em tempo real e uma trava de segurança que impede sobrescrever o disco errado.

:::objetivos
- Ajustar `bs` e `count` para controlar precisamente o que é copiado
- Usar `status=progress` para monitorar a cópia ao vivo
- Combinar `dd` com `pv` para barra de progresso avançada
- Comprimir com `gzip` em linha para reduzir o tamanho da imagem
- Proteger o disco fonte com `iflag=direct,fullblock`
:::

## Tamanho de bloco: o que `bs=4M` realmente faz

Sem `bs`, o `dd` usa 512 bytes por transferência — o tamanho do setor legado. Para um SSD NVMe que opera em blocos de 4K a 2M, isso significa milhões de operações minúsculas, com throughput pífio:

```terminal
$ sudo dd if=/dev/nvme0n1p1 of=/tmp/test.img bs=512
131072+0 records in
131072+0 records out
67108864 bytes (67 MB, 64 MiB) copied, 8.43 s, 8.0 MB/s

$ sudo dd if=/dev/nvme0n1p1 of=/tmp/test2.img bs=4M
16+0 records in
16+0 records out
67108864 bytes (67 MB, 64 MiB) copied, 0.27 s, 249 MB/s
```

Mesma partição de 64 MiB: com `bs=512`, 8,4 segundos; com `bs=4M`, 0,27 segundos — **30× mais rápido**. A regra prática: para SSD NVMe, use `bs=4M`; para dispositivos USB lentos ou SD cards, `bs=1M`.

:::info
`bs=4M` só funciona bem porque o Linux usa páginas de memória para buffer. O kernel lê 4 MiB de uma vez num buffer, depois descarrega para o destino. Blocos maiores que o buffer do kernel não trazem ganho adicional e podem até piorar o desempenho.
:::

## Monitorando com `status=progress` e `pv`

O sinalizador `status=progress` é nativo do `dd` desde o coreutils 8.24 e mostra bytes copiados, tempo decorrido e velocidade:

```terminal
$ sudo dd if=/dev/nvme0n1 of=/mnt/ssd.img bs=4M status=progress
234275321856 bytes (234 GB, 218 GiB) copied, 3200 s, 73,0 MB/s
```

Quando você quer barra de progresso visual e ETA, o `pv` (pipe viewer) oferece mais:

```terminal
$ sudo dd if=/dev/nvme0n1 bs=4M | pv -s 234275321856 | dd of=/mnt/ssd.img bs=4M
 120GiB 0:15:32 [ 130MiB/s] [============>               ] 51% ETA 0:14:45
```

`-s` informa ao `pv` o tamanho total esperado para calcular a porcentagem corretamente. Sem ele, o `pv` mostra bytes processados mas não sabe quanto falta:

```terminal
$ sudo dd if=/dev/nvme0n1 bs=4M | pv | dd of=/mnt/ssd.img bs=4M
  75GiB 0:09:45 [ 131MiB/s] [     <=>                       ]
```

O `pv` é útil especialmente em cópias longas: você vê de relance se a velocidade caiu, se travou ou se vai acabar em meia hora.

## Comprimindo em linha com `gzip`

A imagem crua ocupa o tamanho do disco, mas a maior parte é espaço vazio (zeros). Comprimir em tempo real reduz drasticamente:

```terminal
$ sudo dd if=/dev/nvme0n1 bs=4M | gzip -c > /mnt/ssd-deck.img.gz
$ ls -lh /mnt/ssd-deck.img.gz
-rw-r--r-- 1 root root 48G Mar 22 15:02 /mnt/ssd-deck.img.gz
```

De 218 GiB brutos para 48 GiB comprimidos — uma redução de quase 5×, típica quando o disco tem muito espaço livre. A desvantagem: para restaurar, você precisa descomprimir antes de escrever no disco. E o `gzip` é single-thread; para maior velocidade com compressão paralela, use `pigz`:

```terminal
$ sudo dd if=/dev/nvme0n1 bs=4M | pigz -c > /mnt/ssd-deck.img.gz
$ ls -lh /mnt/ssd-deck.img.gz
-rw-r--r-- 1 root root 44G Mar 22 15:05 /mnt/ssd-deck.img.gz
```

O `pigz` usa todos os núcleos disponíveis e é a opção mais rápida para compressão em linha. No SteamOS — que é baseado em Arch, não em Debian — os pacotes se instalam com `pacman`, e o sistema de arquivos raiz é read-only por padrão:

```terminal
$ sudo steamos-readonly disable
$ sudo pacman -S pigz
resolving dependencies...
looking for conflicting packages...
Packages (1) pigz-2.8-1
Total Installed Size:  0.14 MiB
:: Proceed with installation? [Y/n]
$ sudo steamos-readonly enable
```

Repare nos dois `steamos-readonly`: você desativa a proteção da raiz só durante a instalação e reativa em seguida. Deixar o sistema gravável o tempo todo enfraquece a atualização A/B do SteamOS. O `pv` e o `gzip` já vêm instalados; só o `pigz` costuma precisar ser adicionado.

:::atencao
Comprimir em linha esconde erros do `dd`. Se o disco fonte tiver setores ilegíveis, o `dd` termina silenciosamente com código de sucesso, mas o `gzip` comprime o que recebeu — inclusive os dados corrompidos. Sempre verifique o código de saída e, se possível, calcule checksum da imagem restaurada contra o original.
:::

## Protegendo o disco fonte: `iflag=fullblock`

Por padrão, `dd` pode retornar menos bytes do que solicitou numa leitura, especialmente em dispositivos especiais. O flag `iflag=fullblock` força o `dd` a reler até obter o bloco completo, evitando que bytes sejam perdidos:

```terminal
$ sudo dd if=/dev/nvme0n1 of=/mnt/ssd.img bs=4M iflag=fullblock conv=fsync status=progress
```

`conv=fsync` descarrega o cache de escrita ao final, garantindo que a imagem esteja íntegra no disco destino antes de o comando encerrar. Combine sempre os três — `bs=4M`, `iflag=fullblock`, `conv=fsync` — para imagens que você vai usar como restauração.

## Resumo

- `bs=4M` acelera a cópia em até 30× comparado ao padrão 512 bytes.
- `status=progress` mostra progresso nativo; `pv` adiciona barra visual e ETA.
- `gzip` / `pigz` comprime em linha, reduzindo drasticamente imagens com muito espaço livre.
- `iflag=fullblock` impede leituras parciais; `conv=fsync` garante que a gravação foi completa.
- O combo seguro: `bs=4M iflag=fullblock conv=fsync status=progress`.

## Exercícios

1. Faça três cópias de uma partição pequena com `bs=512`, `bs=1M` e `bs=4M`, registrando o tempo de cada uma com `time`.
2. Adicione `pv` ao pipeline de uma cópia, com e sem `-s`, e compare as barras de progresso.
3. Gere uma imagem com compressão `gzip` e compare o tamanho com uma imagem sem compressão.
4. Refaz o exercício 3 com `pigz` e meça o tempo de compressão com `time`.
5. **Desafio.** Faça um pipeline completo combinando `dd`, `pv` e `pigz`, calcule o `sha256sum` da imagem comprimida resultante, descomprima com `gunzip` e verifique que o hash da imagem crua confere com o hash do dispositivo fonte.