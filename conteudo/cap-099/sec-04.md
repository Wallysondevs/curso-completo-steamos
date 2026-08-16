O disco é o gargalo mais comum em máquinas modernas e o menos compreendido. Um SSD pode entregar 3 GB/s sequencial mas despencar para 40 MB/s em carga aleatória de blocos pequenos — e é essa carga aleatória que importa para abrir programas, carregar jogos e navegar em menus. Nesta seção você aprende a medir E/S com as ferramentas certas para cada regime.

:::objetivos
- Medir vazão sequencial com `hdparm` e `dd` de forma comparável
- Usar `fio` para benchmark aleatório com IOPS e latência
- Entender a diferença entre leitura sequencial, aleatória e mista
- Identificar quando o cache do sistema está distorcendo a medição
- Testar E/S com `stress-ng` em modo `hdd` para simular carga
:::

## O problema do dd como benchmark

O `dd` é a ferramenta mais usada para "medir disco", e é também a mais mal usada. O principal problema: o kernel mantém um cache de páginas que absorve escritas e serve leituras sem tocar no disco. Um `dd` que termina em fração de segundo pode ter apenas enchido a RAM, sem jamais ter enfileirado uma única operação real no SSD.

```terminal
$ dd if=/dev/zero of=/tmp/testfile bs=1M count=1024 conv=fdatasync
1073741824 bytes (1.1 GB, 1.0 GiB) copied, 0.8421 s, 1.3 GB/s
```

A flag `conv=fdatasync` força uma sincronia física ao final e dá um resultado mais honesto — mas ainda mede apenas escrita sequencial de zeros (pior caso para compressão, melhor caso para controle do SSD). Dados reais têm tamanhos variados, compressibilidade variada e padrões de acesso muito mais caóticos.

Para leitura, o problema é pior: se o arquivo acabou de ser escrito, ele está em cache e o `dd` de leitura vai medir a velocidade da RAM, não do disco.

```terminal
$ echo 3 | sudo tee /proc/sys/vm/drop_caches
3
$ dd if=/tmp/testfile of=/dev/null bs=1M status=progress
1073741824 bytes (1.1 GB) copied, 2.3102 s, 464 MB/s
```

Agora sim: o `drop_caches` expulsou o arquivo da RAM e o `dd` de leitura foi forçado a ler do SSD. O resultado caiu de algo que seria "alguns GB/s" para 464 MB/s — esta é a velocidade real do dispositivo.

:::perigo
`drop_caches` não causa perda de dados (só descarta cache, não dirty pages), mas descartar cache de produção em servidor pode degradar performance temporariamente. No Steam Deck, num benchmark, é seguro. Para ser ainda mais preciso, você pode usar `fio` com `direct=1`, que ignora o cache completamente.
:::

## fio: a ferramenta profissional

O Flex I/O Tester (`fio`) é o padrão da indústria para benchmark de disco. Ele permite especificar o padrão de acesso exato: tamanho de bloco, sequencial ou aleatório, leitura ou escrita ou misto, quantos jobs concorrentes, com ou sem cache do sistema. A complexidade assusta, mas três receitas cobrem 80% dos casos.

Leitura sequencial (o que importa para abrir arquivos grandes):

```terminal
$ fio --name=seq-read --ioengine=libaio --direct=1 --rw=read --bs=1M --size=1G --numjobs=1 --runtime=20 --time_based --group_reporting
...
  READ: bw=2341MiB/s (2455MB/s), 2341MiB/s-2341MiB/s (2455MB/s-2455MB/s), io=20.0GiB (21.5GB), run=8742-8742msec
```

Leitura aleatória de blocos pequenos (o que importa para carregar programas e jogos):

```terminal
$ fio --name=rand-read --ioengine=libaio --direct=1 --rw=randread --bs=4k --size=1G --numjobs=1 --runtime=20 --time_based --group_reporting
...
  READ: bw=51.2MiB/s (53.7MB/s), 51.2MiB/s-51.2MiB/s (53.7MB/s-53.7MB/s), io=1024MiB (1074MB), run=20001-20001msec
  lat (usec): min=14, max=821, avg=24.87, stdev=11.31
```

A diferença é brutal: 2341 MiB/s sequencial contra 51 MiB/s aleatório 4K. O SSD não é "lento" ou "rápido" no vácuo — o padrão de acesso define o resultado. A linha `lat` mostra a latência média de cada operação (24.87 microssegundos), métrica fundamental que o `dd` jamais mostra.

Escrita aleatória (o que importa para bancos de dados, logs, savegames frequentes):

```terminal
$ fio --name=rand-write --ioengine=libaio --direct=1 --rw=randwrite --bs=4k --size=1G --numjobs=4 --runtime=20 --time_based --group_reporting
...
  WRITE: bw=128MiB/s (134MB/s), 32.0MiB/s-32.0MiB/s per job
  lat (usec): min=14, max=2510, avg=124.92, stdev=65.12
```

Quatro jobs concorrentes de escrita aleatória 4K produzem 128 MiB/s agregados e latência média de 125 µs — muito maior que a leitura por causa da complexidade interna do SSD (tradução de endereço, garbage collection). O `stdev` de 65 µs indica que há operações muito mais lentas que a média, e são justamente essas que causam "micro-travamentos" perceptíveis.

:::dica
A flag `--direct=1` é a chave para medir o disco real, não o cache. Quando você omite essa flag, o `fio` usa E/S com buffer e os resultados podem ser 5 a 10 vezes maiores — você está medindo RAM, não SSD. Use `direct=1` sempre para benchmark de hardware; use sem `direct=1` apenas quando quiser medir "como a aplicação sente", que inclui o efeito do cache.
:::

## hdparm: leitura rápida de parâmetros

O `hdparm` é mais antigo e mais simples que o `fio`. Ele serve para duas coisas: medir leitura sequencial com buffer e ler parâmetros do dispositivo. Não substitui o `fio`, mas é um atalho útil quando você só quer uma confirmação rápida.

```terminal
$ sudo hdparm -tT /dev/nvme0n1

/dev/nvme0n1:
 Timing cached reads:   8210 MB in  2.00 seconds = 4105.18 MB/sec
 Timing buffered disk reads: 1874 MB in  3.00 seconds = 624.67 MB/sec
```

O `-t` mede leitura do disco (com buffer mínimo), o `-T` mede leitura do cache. A diferença entre 4105 MB/s (cache) e 624 MB/s (disco) mostra o impacto do cache — e por que benchmarks sem controle de cache são inúteis.

```terminal
$ sudo hdparm -I /dev/nvme0n1 | head -20

/dev/nvme0n1:
ATA device, with non-removable media
	Model Number:       Samsung SSD 980 PRO 1TB
	Firmware Revision:  5B2QGXA7
	Transport:          NVM Express
	...
	Data Set Management TRIM supported (limit 8 blocks)
	Deterministic read ZEROs after TRIM
```

O `-I` mostra informações do dispositivo: modelo, firmware, suporte a TRIM. É útil para documentar no baseline exatamente qual hardware está sendo medido.

## Resumo

- `dd` sem `conv=fdatasync` ou `drop_caches` mede o cache, não o disco — o número mais comum e mais enganoso.
- `fio --direct=1` com `--rw=randread` e `--bs=4k` é o padrão-ouro para medir latência e IOPS reais.
- A diferença entre leitura sequencial (GB/s) e aleatória 4K (dezenas de MB/s) no mesmo SSD chega a 50x.
- `hdparm -tT` é um atalho para confirmar velocidades — não substitui um benchmark completo.
- Latência (`lat`) e desvio padrão (`stdev`) importam mais que vazão para a percepção de fluidez.
- Documente sempre o modelo exato do SSD com `hdparm -I` ou `smartctl`.

## Exercícios

1. Meça a escrita sequencial com `dd` sem `fdatasync`, depois com `fdatasync`, depois com `oflag=direct`. Explique as diferenças entre os três valores.
2. Use `fio` para medir leitura aleatória 4K com `direct=1` e `numjobs=1`. Anote a vazão e a latência média. Depois repita com `direct=0` e compare.
3. Rode `fio` com `--rw=randrw --rwmixread=70 --bs=4k` (70% leitura, 30% escrita aleatória). A vazão agregada é mais próxima da leitura pura ou da escrita pura? Por quê?
4. Identifique o modelo do SSD no seu Deck com `sudo hdparm -I` e pesquise as especificações de IOPS do fabricante. Seu `fio` chegou perto dos valores declarados?
5. **Desafio.** Rode o mesmo benchmark `fio` de leitura aleatória 4K com o SSD quase vazio e com ele perto de 90% cheio (use arquivos grandes temporários). A latência piora? Investigue o conceito de *write amplification* e relacione com o resultado.