Quando a RAM aperta, o Linux não trava — ele empurra páginas de memória para fora da RAM, para um espaço de troca chamado **swap**. Na teoria, swap é um arquivo ou partição no disco. No Steam Deck, porém, a escolha mais comum é outro mecanismo: o **zram**, que comprime dados dentro da própria RAM em vez de escrevê-los no SSD. Entender a diferença entre esses dois mundos é o pré-requisito para mexer em qualquer tweak de memória.

:::objetivos
- Distinguir swap em disco, zram e o papel de cada um
- Identificar o swap ativo no SteamOS e seu tamanho real
- Entender o custo de compressão do zram
- Ler o estado da memória com `swapon` e `/proc/swaps`
- Saber quando aumentar ou reduzir o swap ajuda de fato
:::

## O que é swap, afinal

A RAM guarda dados que a CPU usa agora; o swap é a extensão dela. Quando o sistema precisa de mais memória do que tem, o kernel escolhe páginas "menos usadas" e as move para o swap, liberando RAM para o processo ativo. O preço é a lentidão: escrever e ler do disco é ordens de magnitude mais lento que acessar RAM.

Quem decide o que sai da RAM é o kernel, guiado por um parâmetro central chamado `vm.swappiness` — que será o assunto da [próxima seção](#/cap-076/sec-03). O swap em si é só o *recipiente*. No Linux clássico, esse recipiente é um arquivo (`/swapfile`) ou uma partição dedicada.

```terminal
$ swapon --show
NAME       TYPE      SIZE   USED PRIO
/swapfile  file      8G   512M   -2
```

Aqui vemos um único swap de 8 GB em arquivo, com 512 MB em uso e prioridade `-2`. A prioridade decide a ordem quando há vários swaps: valores maiores são usados antes. Um detalhe importante: `SIZE` é o tamanho configurado, não o quanto está realmente ocupado no disco — se você tem 8 GB de swap, o arquivo ocupa 8 GB de disco desde o primeiro dia.

## Por que o Steam Deck prefere zram

O Steam Deck tem um SSD, e SSDs têm número limitado de escritas. Usar swap em disco num jogo que "faz swap" toda hora desgasta o SSD e introduz travadas. O zram resolve isso de um jeito esperto: em vez de gravar no disco, ele cria um dispositivo de bloco **na RAM** que comprime os dados antes de armazenar.

A analogia é um arquivo ZIP automático. Páginas de memória que o kernel mandaria para o swap em disco são comprimidas (tipicamente com LZ4 ou ZSTD) e guardadas na própria RAM. Se os dados comprimem bem — e memória de jogo costuma comprimir razoavelmente, porque texturas e estruturas têm repetição — você "ganha" RAM sem tocar no SSD.

```terminal
$ zramctl
NAME       ALGORITHM DISKSIZE   DATA  COMPR  TOTAL STREAMS MOUNT
/dev/zram0 lz4         8G     512M  214M   216M       4
```

Repare nas colunas. `DISKSIZE=8G` é o espaço virtual que o zram simula; `DATA=512M` é o quanto de dados não comprimidos ele está segurando; `COMPR=214M` é o quanto aquilo virou depois da compressão. Ou seja, 512 MB de memória viraram 214 MB — uma economia real. Se a taxa de compressão cai (por exemplo, dados já comprimidos como vídeo ou áudio), o zram aproxima-se de um swap comum em custo.

:::info
O SteamOS 3.6 costuma vir com um zram de aproximadamente 50% da RAM física (cerca de 8 GB num Deck de 16 GB). Isso não é um swap em disco — é memória comprimida. Ferramentas como o CryoUtilities propõem aumentar esse valor, com o trade-off de gastar mais CPU para comprimir/descomprimir.
:::

## Lendo o que está ativo agora

Dois comandos bastam para mapear a memória de troca do sistema. O primeiro é o `swapon`, já visto; o segundo é o `/proc/swaps`, que mostra a mesma informação de forma crua:

```terminal
$ cat /proc/swaps
Filename                                Type            Size    Used    Priority
/dev/zram0                              partition       8388604 524288  100
```

Aqui o swap é o `/dev/zram0`, com prioridade `100` (muito acima do `-2` do arquivo de exemplo anterior). Prioridade alta significa que o zram é o swap preferido: o kernel só recorre ao swap em disco quando o zram está cheio. Essa hierarquia — zram rápido primeiro, disco lento depois — é o desenho ideal para um dispositivo com SSD.

Para ver o panorama completo da memória, `free -h` junta RAM e swap numa leitura só:

```terminal
$ free -h
               total        used        free      shared  buff/cache   available
Mem:            15Gi       6.1Gi       2.3Gi       512Mi       6.9Gi       8.4Gi
Swap:          8.0Gi          0B       8.0Gi
```

O número que importa para engasgos é a coluna `available`: quanta memória o sistema ainda consegue oferecer sem recorrer a swap pesado. `used` inclui cache, que o kernel pode descartar a qualquer momento, então não se assuste com `used` alto — assuste-se com `available` baixo.

## Quando aumentar o swap faz sentido

O CryoUtilities tornou popular a ideia de aumentar o swap do Deck. O argumento: jogos grandes, como os que carregam mundos abertos, pressionam a RAM, e mais espaço de "respiro" evita que o kernel mate processos por falta de memória (o famoso *Out-of-Memory killer*, OOM).

A contraprova: se o jogo não encosta no swap, aumentá-lo não muda nada — é espaço alocado sem retorno. E se o jogo *depende* de swap, o ganho de estabilidade vem acompanhado de lentidão, porque trocar dados com zram não é de graça.

:::atencao
Mais swap não é mais RAM. Ele evita que o sistema morra de OOM, mas não devolve a velocidade da memória física. Se um jogo faz swap constantemente, o sintoma real é falta de RAM — e a solução honesta é fechar aplicativos em segundo plano ou reduzir o orçamento de VRAM, não inflar o swap até o infinito.
:::

## Resumo

- Swap é a extensão da RAM: páginas pouco usadas saem da memória física para um recipiente (arquivo, partição ou zram).
- O zram comprime páginas dentro da própria RAM e devolve espaço sem escrever no SSD — ideal para o Deck.
- `swapon --show`, `cat /proc/swaps` e `free -h` revelam o swap ativo, tamanho, uso e prioridade.
- No SteamOS, o zram tem prioridade alta e é usado antes de qualquer swap em disco.
- Aumentar swap evita OOM, mas não substitui RAM nem elimina a lentidão de troca.

## Exercícios

1. Rode `swapon --show` e `zramctl` e escreva, lado a lado, o tamanho, o uso e a prioridade de cada dispositivo de troca.
2. Usando `free -h`, identifique quanto há de `available` e explique por que `used` alto não é sinônimo de problema.
3. Gere uma carga de memória e observe o zram reagir (ex.: um script que aloca memória com `stress` ou `sysbench`). A taxa de compressão subiu ou caiu?
4. Compare `DATA` e `COMPR` no `zramctl` após a carga: qual foi a economia real de compressão?
5. **Desafio.** Explique por que aumentar o zram para 100% da RAM física seria uma má ideia, relacionando com o custo de CPU da compressão e a [seção sobre swappiness](#/cap-076/sec-03).
