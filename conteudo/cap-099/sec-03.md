O processador é o componente que mais atrai benchmark, e também o mais fácil de medir errado. No Steam Deck — com um AMD Van Gogh/Aerith de oito threads, potência limitada e refrigeração compacta — o resultado de CPU depende tanto da carga térmica quanto do código em si. Esta seção ensina as ferramentas práticas para medir CPU de forma honesta, do benchmark sintético ao teste de carga que estressa os oito threads.

:::objetivos
- Medir vazão de CPU com `sysbench` em um e vários threads
- Usar `openssl speed` para comparar primitivas criptográficas
- Estressar todos os núcleos com `stress-ng` e observar o escalonamento
- Interpretar a diferença entre carga single-thread e multi-thread
- Relacionar frequência, potência e temperatura ao resultado bruto
:::

## Single-thread versus multi-thread

Nem toda carga de CPU é igual. Um *benchmark* **single-thread** roda em um único núcleo e mede a velocidade de uma trilha de execução — o que importa para tarefas que não paralelizam, como parte do tempo de carregamento e muito do código de jogos que depende de uma única thread principal. Um benchmark **multi-thread** dispara N threads simultâneas e mede a vazão agregada.

O Steam Deck é particularmente interessante aqui por causa do limite de potência (TDP). Quando um único núcleo está ativo, ele pode operar em frequência alta porque a potência total está sobrando. Quando os oito threads estão ativos, o TDP é dividido e cada núcleo cai para uma frequência menor. O resultado é que a máquina é proporcionalmente melhor em single-thread do que em multi-thread.

```terminal
$ sysbench cpu --threads=1 --cpu-max-prime=20000 --time=20 run
...
CPU speed:
    events per second:  1162.18

General statistics:
    total time:                          20.0010s
    total number of events:              23244
```

Com um thread, o `sysbench` calcula números primos até 20000 tantas vezes quanto conseguir em 20 segundos. Cada "evento" é um cálculo completo de primos. O número que importa é `events per second`: quantos cálculos de primalidade aquele único núcleo completa por segundo.

Repita com oito threads:

```terminal
$ sysbench cpu --threads=8 --cpu-max-prime=20000 --time=20 run
...
CPU speed:
    events per second:  7210.44

General statistics:
    total time:                          20.0002s
    total number of events:              144211
```

Repare na aritmética: 7210 / 1162 ≈ 6,2. Oito threads não entregam 8 vezes a vazão de um — elas entregam cerca de 6,2x. Essa "perda" é o efeito combinado de TDP compartilhado (frequência menor por núcleo) e contenção de cache/memória. O fator de escala real de 6,2x em 8 threads é típico de hardware com potência limitada.

:::nota
O parâmetro `--cpu-max-prime` controla o tamanho do cálculo de primos. Valores maiores fazem cada evento durar mais e reduzem a interferência de trocas de contexto, mas também disfarçam diferenças de curto prazo. Para comparar antes/depois, use **o mesmo valor de prime** em todas as rodadas — mudar o parâmetro muda o teste.
:::

## Comparando primitivas com openssl speed

O OpenSSL vem com um microbenchmark embutido que mede a vazão de várias operações criptográficas. É útil porque o AES e o SHA-256 são cargas bem definidas, amplamente usadas na prática (HTTPS, conexão Steam, hash de downloads), e o teste não depende de biblioteca gráfica nem de disco.

```terminal
$ openssl speed -seconds 5 aes-256-gcm sha256
Doing aes-256-gcm for 5s on 16 size blocks: 18374420 aes-256-gcm's in 5.00s
Doing sha256 for 5s on 64 size blocks: 7412980 sha256's in 5.00s
License: ...
The 'numbers' are in 1000s of bytes per second processed.
type             16 bytes     64 bytes    256 bytes   1024 bytes   8192 bytes  16384 bytes
aes-256-gcm      58798.16k    ...
sha256            94886.27k   103746.43k  105876.89k  106232.32k   106451.27k  106340.61k
```

A tabela mostra a vazão (em milhares de bytes por segundo) para vários tamanhos de bloco. Repare no SHA-256: com blocos pequenos a vazão é baixa (a operação é dominada pela latência de inicialização), e ela cresce e estabiliza conforme o bloco aumenta. Isso ilustra por que "MB/s" sozinho não conta a história inteira — o tamanho do bloco define se você está medindo latência ou vazão.

:::info
O hardware do Steam Deck (APU AMD com instruções AVX e os aceleradores AES-NI/SHA) faz o `openssl` usar rotinas otimizadas em assembly. Se você comparar com um desktop mais novo, valores de AES maiores são em grande parte consequência dessas extensões de instrução, não de mais núcleos.
:::

## Estressando os oito threads de verdade

O `stress-ng` é a ferramenta de carga mais versátil. Diferente do `sysbench`, que mede e reporta, o `stress-ng` foca em **gerar carga contínua e controlada** sobre um subsistema específico. No modo CPU, ele permite escolher o método de estresse (operações inteiras, ponto flutuante, etc.).

```terminal
$ stress-ng --cpu 8 --cpu-method matrixprod --cpu-load 100 --timeout 30s --metrics-brief
stress-ng: info:  [12345] setting to a 30 second run per stressor
stress-ng: info:  [12345] dispatching hogs: 8 cpu
stress-ng: info:  [12345] successful run completed in 30.03s
stress-ng: info:  [12345] stressor       bogo ops real time  usr time  sys time   bogo ops/s   bogo ops/s/CPU
stress-ng: info:  [12345] cpu                 315420      30.00      230.11      0.18      10514.01        1210.22
```

A métrica `bogo ops/s` ("bogus operations", operações fictícias) é uma unidade arbitrária — ela não tem correspondência física, mas é **comparável** entre execuções do mesmo método. É perfeita para antes/depois: você não se importa com o valor absoluto, só com a variação relativa quando muda alguma coisa.

O `--cpu-load 100` significa "estressar até atingir 100% de um núcleo por thread". Você pode reduzir para 50% e observar que o `stress-ng` intercala períodos de trabalho e pausa para manter a média — útil para simular carga parcial.

```terminal
$ stress-ng --cpu 4 --cpu-load 50 --timeout 10s --metrics-brief
stress-ng: info:  [12346] dispatching hogs: 4 cpu
stress-ng: info:  [12346] successful run completed in 10.00s
stress-ng: info:  [12346] stressor       bogo ops real time  usr time  sys time   bogo ops/s   bogo ops/s/CPU
stress-ng: info:  [12346] cpu                  52640      10.00       20.02      0.04       5264.01        1316.01
```

Com carga de 50% em 4 threads, o `usr time` total (20.02 s) é metade dos `real time × threads` (40 s), confirmando que cada thread trabalhou metade do tempo.

:::atencao
`stress-ng --cpu 8` sem `--timeout` roda até você interromper, esquentando a máquina indefinidamente. **Sempre** coloque um `--timeout`. E não rode benchmark de CPU com o Deck na mão sobre uma cama ou sofá: a entrada de ar obstruída muda a temperatura e distorce o resultado.
:::

## Resumo

- Single-thread mede uma trilha de execução; multi-thread mede vazão agregada de N threads concorrentes.
- O Steam Deck perde eficiência multi-thread por causa do TDP compartilhado (8 threads rendem ~6x, não 8x).
- `sysbench cpu` reporta `events per second`; mantenha `--cpu-max-prime` idêntico entre comparações.
- `openssl speed` mede vazão de primitivas criptográficas e revela o efeito do tamanho de bloco.
- `stress-ng` gera carga controlada; `bogo ops/s` é uma unidade comparável entre execuções, não absoluta.
- Sempre use `--timeout` no `stress-ng` e meça com refrigeração livre.

## Exercícios

1. Rode `sysbench cpu --threads=1` e `--threads=8` com o mesmo `--cpu-max-prime`. Calcule o fator de escala e compare com o valor teórico de 8x.
2. Use `openssl speed -seconds 3 sha256` e observe como a vazão varia entre bloco de 16 bytes e de 16384 bytes. Explique a diferença.
3. Gere carga com `stress-ng --cpu 8 --timeout 20s` e, em outro terminal, observe o `top` ou `htop`. Todos os threads reportam ~100% de uso?
4. Meça `bogo ops/s` do `stress-ng --cpu 4 --cpu-load 100` e depois `--cpu-load 50`. O `bogo ops/s/CPU` muda entre os dois? O que isso diz sobre a frequência?
5. **Desafio.** Rode o mesmo `sysbench cpu --threads=8` duas vezes: uma com o deck na sua mão normal e outra com ele sobre uma superfície fria e ventilada, aguardando esfriar entre as duas. Compare `events per second` e explique a diferença usando o conceito de throttling térmico da seção 8.