O subsistema de memória é o mais negligenciado no benchmarking amador — e, ironicamente, é o que mais afeta o desempenho percebido em desktops e jogos. O Steam Deck usa LPDDR5 unificada, compartilhada entre CPU e GPU, o que significa que largura de banda e latência de memória afetam tanto a velocidade de compilação quanto o framerate. Esta seção mostra como medir o que a RAM entrega de fato.

:::objetivos
- Medir largura de banda de memória com `sysbench memory`
- Entender a hierarquia de cache e seu impacto nos benchmarks
- Medir latência de acesso com `lmbench` e `lat_mem_rd`
- Identificar quando o benchmark está medindo cache, não RAM
- Relacionar largura de banda de memória com desempenho de GPU integrada
:::

## A hierarquia que engana

Antes de medir, é preciso entender o que você está medindo. A CPU não acessa RAM diretamente na maior parte do tempo. Entre ela e a memória existem três níveis de cache (L1, L2, L3), cada um progressivamente maior e mais lento. Quando você roda um benchmark que acessa um bloco de 64 KB repetidamente, ele cabe inteiro no cache L1 e o resultado não diz absolutamente nada sobre a RAM.

```terminal
$ getconf -a | grep CACHE
LEVEL1_ICACHE_SIZE     32768
LEVEL1_DCACHE_SIZE     32768
LEVEL2_CACHE_SIZE      524288
LEVEL3_CACHE_SIZE      4194304
```

Um L1 de 32 KB, L2 de 512 KB e L3 de 4 MB. Qualquer benchmark com *working set* menor que 4 MB está medindo cache, não RAM. Para medir banda de memória real o conjunto de trabalho precisa ser várias vezes maior que o cache L3 — no mínimo 16 MB ou mais.

:::info
A LPDDR5 do Steam Deck é compartilhada entre CPU e GPU, e a largura de banda dela (cerca de 102 GB/s na especificação do Van Gogh) é o principal limitador de desempenho gráfico. Toda textura, todo buffer de vértices e todo framebuffer passam por esse barramento. Quando você mexe em resolução e qualidade gráfica, está indiretamente testando a memória.
:::

## Largura de banda com sysbench memory

O `sysbench` tem um modo `memory` que escreve e lê blocos sequenciais em RAM, medindo vazão. É o benchmark mais direto para largura de banda.

```terminal
$ sysbench memory --memory-block-size=1K --memory-total-size=16G run
sysbench 1.0.20 (using bundled LuaJIT 2.1.0-beta3)

Running the test with following options:
Number of threads: 1
Block size: 1KiB
Total memory: 16384MiB
Operation: write

102400.00 MiB transferred (6826.67 MiB/sec)

General statistics:
    total time:                          15.0000s
    total number of events:              104857600
```

O bloco de 1 KB com total de 16 GB força o benchmark a operar bem além do cache L3 (4 MB). O resultado de 6826 MiB/s é a largura de banda de escrita sequencial vista por um único thread. Mas isso ainda é menos da metade da banda teórica — por quê?

Porque um único thread não consegue saturar o controlador de memória. A DDR5/LPDDR5 precisa de múltiplos acessos paralelos para atingir a banda máxima. Repetindo com múltiplos threads:

```terminal
$ sysbench memory --memory-block-size=1K --memory-total-size=16G --threads=8 run
...
102400.00 MiB transferred (12481.33 MiB/sec)

General statistics:
    total time:                          8.2030s
    total number of events:              104857600
```

Com 8 threads, a banda sobe de 6826 para 12481 MiB/s (≈83%). Ainda não é o máximo teórico, porque o `sysbench memory` é um benchmark sintético simples que não otimiza padrões de acesso para cada controlador.

```terminal
$ sysbench memory --memory-block-size=1M --memory-total-size=16G --threads=8 --memory-oper=read run
...
102400.00 MiB transferred (14628.57 MiB/sec)
```

Com blocos de 1 MB e apenas leitura, a banda sobe ainda mais (14628 MiB/s) porque o overhead de gerenciamento por bloco diminui e leituras são mais simples que escritas.

:::dica
Varie o `--memory-block-size` entre 1K, 64K e 1M mantendo o resto fixo. A banda cresce conforme o bloco cresce — mas só até certo ponto. A partir do tamanho em que a banda estabiliza, você encontrou o *ponto de saturação* do controlador de memória. Esse é o número que importa para comparar antes/depois.
:::

## Medindo latência: o que realmente importa

Largura de banda é vazão; latência de memória é o tempo entre o processador pedir um dado e recebê-lo. Quando uma thread de jogo percorre uma árvore de objetos espalhados pela RAM, cada acesso paga a latência cheia — e isso acontece milhões de vezes por segundo. Latência de memória alta causa *stutter* mesmo com banda sobrando.

O `lmbench` (Latency Microbenchmark) contém o `lat_mem_rd`, que mede a latência média de acesso para vários tamanhos de *working set*:

```terminal
$ lat_mem_rd 64 128
"stride=128
0.00049 1.953
0.00098 1.954
0.00195 1.954
0.00293 1.954
...
0.06250 1.958
0.12500 1.959
0.25000 2.055
0.50000 2.424
1.00000 3.220
2.00000 4.058
4.00000 5.140
8.00000 7.422
16.00000 12.181
32.00000 20.834
64.00000 65.233
128.00000 78.451
```

A primeira coluna é o tamanho do *working set* em megabytes; a segunda é a latência média em nanossegundos. O padrão é revelador:

- Até 0.0625 MB (64 KB): ~1.96 ns — está no cache L1.
- 0.25 a 4 MB: a latência sobe de 2.05 para 5.14 ns — cache L2 e L3.
- 8 MB em diante: a latência salta para 7.42 ns, depois 12.18 ns, e em 128 MB chega a 78.45 ns — é a RAM real, com TLB misses e tudo.

O *joelho* da curva — o ponto em que a latência salta — indica o tamanho efetivo do último cache. Em hardware com APU como o Steam Deck, essa transição é suave (não há um degrau abrupto), mas o padrão é claro.

:::atencao
O `lat_mem_rd` precisa ser compilado; ele não vem instalado no SteamOS. Se você não tiver o `lmbench`, pode usar uma alternativa simplificada com `sysbench memory --memory-oper=read --memory-block-size=1` que, embora não produza a curva detalhada por tamanho, dá uma aproximação da latência de acesso em regime de RAM.
:::

## Resumo

- A hierarquia L1/L2/L3 oculta a RAM; benchmarks com *working set* menor que o L3 medem cache, não memória.
- `sysbench memory` com `--memory-total-size` muito maior que o L3 (≥16 GB) mede largura de banda real da RAM.
- Um único thread não satura o controlador de memória; para medir banda máxima, use `--threads=8`.
- Variação de `--memory-block-size` revela o ponto de saturação do controlador.
- Latência de memória (medida por `lat_mem_rd`) importa mais que banda para padrões de acesso aleatório, comuns em jogos.
- A RAM LPDDR5 do Steam Deck é unificada: GPU e CPU competem pela mesma banda; otimizações gráficas são indiretamente otimizações de memória.

## Exercícios

1. Rode `sysbench memory` com `--memory-block-size=1K`, `64K` e `1M`, todos com `--threads=8`. Monte uma tabela com tamanho de bloco × banda e explique a tendência.
2. Compare `sysbench memory --memory-oper=read` com `--memory-oper=write` (mesmo tamanho de bloco e threads). Qual é mais rápido? Pesquise por que.
3. Se o `lmbench` estiver disponível, rode `lat_mem_rd 64 128` e identifique na curva os pontos de transição de cache.
4. Estime o `LEVEL3_CACHE_SIZE` do seu Deck com `getconf`. Se você rodar um benchmark com *working set* exatamente desse tamanho, o que espera medir — cache ou RAM?
5. **Desafio.** Rode `sysbench memory --threads=8` enquanto executa um jogo leve em segundo plano (ou o próprio `glxgears`). A banda disponível cai em que proporção? Isso explica por que o framerate cai quando o sistema está sob pressão de memória?