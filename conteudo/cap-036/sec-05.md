O hardware do Steam Deck — uma APU AMD Zen 2 com 4 núcleos e 8 threads, gráficos RDNA 2 e 16 GB de RAM unificada — não é só capaz de rodar jogos. É capaz de **compilar** na velocidade de um notebook intermediário, e entender como extrair o máximo disso transforma o Deck de "gambiarra" em "estação de trabalho portátil". Compilar código nessa APU ainda é uma das aplicações mais honestas do hardware, porque usa exatamente o que ele tem de melhor: núcleos x86_64 com caches decentes e acesso rápido à memória.

:::objetivos
- Mapear a APU do Deck: núcleos, threads e memória unificada disponíveis para build
- Compilar C/C++ com `-j` adequado usando Make e Ninja/Meson
- Medir o tempo de compilação e comparar otimizações `-O0` vs `-O2`
- Usar ccache para acelerar recompilações incrementais
- Compilar projetos Python/nativos em modo release sem esgotar a RAM

:::
## Conhecendo a APU antes de compilar

Antes de disparar um build, vale saber o que a máquina entrega. Os números-chave do Deck saem de `/proc/cpuinfo` e de `free`:

```terminal
$ grep -c ^processor /proc/cpuinfo
8
$ grep -m1 "model name" /proc/cpuinfo
model name      : AMD Custom APU 0405
$ free -h
               total        used        free      shared  buff/cache   available
Mem:            14Gi       2.1Gi       5.8Gi       1.2Gi       6.9Gi       9.8Gi
Swap:           1.0Gi          0B       1.0Gi
```

O `grep -c ^processor` retorna 8, que são os **threads** (4 núcleos físicos × 2 threads SMT), não os núcleos. A "Custom APU 0405" é o codinome interno da Valve para o chip Van Gogh, base Zen 2. Com 14 GB utilizáveis de RAM e cerca de 10 GB livres, há folga para builds razoáveis.

:::nota
Em máquinas x86_64, SMT (simultaneous multithreading) faz cada núcleo físico aparecer como dois processadores lógicos. Os 8 "processors" do Deck são, na verdade, 4 núcleos físicos. Na hora de escolher `-j`, o valor ideal fica em torno do **número de núcleos físicos mais 1**, ou seja, `-j5`, não `-j8` — compilar em 8 threads SMT pode até ser mais lento por causa da contenção de cache e do acesso à RAM unificada.
:::

## O básico: make -j e o consumo de núcleos

O caso mais comum é um projeto com Makefile. Compilar sem `-j` usa um núcleo só — um desperdício completo num chip de 4 núcleos:

```terminal
$ cd ~/lab/projetinho
$ time make
cc -Wall -O2 -c -o main.o main.c
cc -Wall -O2 -c -o lib.o lib.c
cc -o prog main.o lib.o
make  0.62s user 0.12s system 98% cpu 0.756 total
```

Repare no `98% cpu` — o processo usou praticamente um núcleo inteiro. Agora com paralelismo:

```terminal
$ make clean >/dev/null
$ time make -j5
cc -Wall -O2 -c -o main.o main.c
cc -Wall -O2 -c -o lib.o lib.c
cc -o prog main.o lib.o
make -j5  0.64s user 0.15s system 178% cpu 0.443 total
```

O `178% cpu` mostra que dois núcleos lógicos foram usados simultaneamente. Num projeto pequeno a diferença é modesta; em dezenas de arquivos `.c`, o ganho de `-j5` sobre serial chega a 3–4×. Para o Make descobrir dependências automaticamente sem um Makefile elaborado, use `make -j$(nproc)` — lembrando que `nproc` devolve 8 (threads), então prefira fixar `-j5`.

## Ninja e Meson: builds mais rápidos por design

O Ninja é um sistema de build paralelo por padrão — não precisa de flag para usar todos os núcleos. O Meson gera builds Ninja, e essa dupla é hoje o padrão em projetos GNOME, systemd e boa parte do ecossistema Linux:

```terminal
$ cd ~/lab/meu-projeto
$ meson setup build
The Meson build system
Version: 1.6.1
Source dir: /home/deck/lab/meu-projeto
Build dir: /home/deck/lab/meu-projeto/build
...
Build targets in project: 5
$ meson compile -C build
[1/5] Compiling C object src/lib.o
[2/5] Compiling C object src/main.o
[3/5] Linking target lib/libmeu.so
[4/5] Linking target src/meuapp
[5/5] Compiling C object tests/teste.p/teste.c.o
```

O Ninja já paraleliza automaticamente, então você não precisa de `-j`. Para liberar o máximo de núcleos, ele satura os 8 threads por padrão — mas em builds pesados na APU, você pode limitar com `meson compile -C build -j 5` para não esgotar a RAM unificada enquanto joga ou usa o desktop.

## Acelerando recompilação com ccache

Recompilar o mesmo código várias vezes é comum em ciclos de desenvolvimento. O `ccache` guarda o resultado das compilações anteriores e reusa quando o arquivo e as flags não mudaram:

```terminal
$ sudo pacman -S ccache
$ export CC="ccache gcc"
$ export CXX="ccache g++"
$ ccache -z   # zera as estatísticas
Statistics cleared
$ make -j5
$ ccache -s
Hits:              34 / 34 (100.0%)
  Direct:          34 / 34 (100.0%)
Misses:             0 / 34 ( 0.0%)
Cache size (GB):    0.04 / 5.00 ( 0.8%)
```

Na primeira compilação o cache é só gravado (misses); na segunda, o `Hits: 100%` mostra que tudo veio do cache, reduzindo o tempo a uma fração. O truque funciona bem dentro do container de desenvolvimento — instale o `ccache` via `pacman` ou no SDK.

:::dica
Configure o `ccache` com um limite maior para projetos grandes: `ccache --max-size=10G`. No Deck com eMMC, mantenha o cache em `/home` (o padrão já é `~/.cache/ccache`) para não gastar a partição do sistema nem competir com o shader cache dos jogos.
:::

## Compilar sem travar a máquina

A RAM unificada é o gargalo escondido da compilação no Deck. Um build de `-j8` num projeto grande pode consumir 12 GB e travar o desktop, porque a GPU divide a mesma memória. O controle está em limitar jobs e em usar `nice` para baixar a prioridade:

```terminal
$ nice -n 10 make -j4
```

O `nice -n 10` diz ao escalonador que esse processo pode esperar — jogos e desktop têm prioridade. Combine com `-j4` (um job por núcleo físico) para builds que rodam em segundo plano sem congelar nada.

```terminal
$ nice -n 10 meson compile -C build -j 4
```

Isso é especialmente útil se você quer deixar o Deck compilando um projeto enquanto assiste a algo ou joga um título leve em modo desktop.

:::atencao
Nunca lance um build pesado com swap ativa e 100% da RAM comprometida: no Deck, o swap padrão é um arquivo de 1 GB, e quando ele esgota o kernel mata processos (`OOM killer`) — às vezes o próprio `meson` ou, pior, o compositor Wayland. Monitore com `watch -n 2 free -h` durante builds grandes e reduza `-j` se a coluna `available` cair muito.
:::

## Resumo

- A APU Custom 0405 tem 4 núcleos físicos e 8 threads SMT; `nproc` retorna 8, mas `-j5` é o sweet spot para builds.
- `make -j5` paraleliza a compilação; o tempo de CPU (coluna `%cpu` do `time`) revela quantos núcleos foram usados.
- Ninja/Meson já paralelizam por padrão e são o build system preferido no ecossistema Linux.
- `ccache` mantém um cache de compilações e acelera recompilações incrementais (hits próximo de 100%).
- RAM unificada é o gargalo: use `nice` e limite `-j` para compilar sem congelar o desktop.

## Exercícios

1. Rode `grep -c ^processor /proc/cpuinfo` e `free -h`, e anote quantos núcleos físicos, threads e GB de RAM livre você tem.
2. Compile um projeto C de teste com `make` serial e `make -j5`; compare o `%cpu` e o tempo usando `time`.
3. Configure `ccache` (`ccache --max-size=5G`) e compile o mesmo projeto duas vezes; verifique o `ccache -s` e explique o que mudou entre a primeira e a segunda.
4. Rode `nice -n 10 make -j4` em segundo plano e, durante o build, verifique a responsividade do desktop com `top`.
5. **Desafio.** Use `meson setup build && meson compile -C build -j 4` num projeto GNOME pequeno. Depois, com `watch -n 2 free -h` aberto em outro terminal, aumente para `-j 8` e observe a queda de `available`. Explique por que `-j 8` em 8 threads pode ser mais lento que `-j 4` em 4 núcleos físicos na APU.