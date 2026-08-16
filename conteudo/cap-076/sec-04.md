A CPU não endereça a RAM byte por byte — ela usa uma tabela que traduz endereços virtuais (o que o programa vê) em endereços físicos (o que o chip de memória tem). Cada entrada dessa tabela cobre uma **página** de 4 KB, o que significa que um pedaço de 2 MB de RAM exige 512 entradas. O **Transparent Huge Pages** (THP) do Linux troca essas páginas de 4 KB por páginas de 2 MB ou 1 GB, reduzindo a sobrecarga de tradução e — na teoria — acelerando o acesso à memória. Na prática, tudo depende do jogo.

:::objetivos
- Entender o que são páginas de memória e por que o tamanho importa
- Diferenciar huge pages explícitas e transparentes (THP)
- Identificar se o THP está ativo, ausente ou em modo `madvise`
- Avaliar quando THP ajuda e quando atrapalha jogos no Deck
- Saber ligar e desligar THP em tempo real
:::

## Páginas, tabelas e o TLB

Um processo no Linux acredita ter a RAM só para si. Essa ilusão é mantida pela MMU (*Memory Management Unit*), que traduz cada endereço virtual acessado em um endereço físico real. A tabela de páginas é o dicionário dessa tradução. Com páginas de 4 KB, cada 2 MB de memória mapeada custa 512 entradas na tabela.

A CPU mantém uma cache dessas traduções em uma estrutura minúscula chamada **TLB** (*Translation Lookaside Buffer*). Quando o endereço que o programa quer já está no TLB, a tradução é instantânea. Quando não está — o chamado *TLB miss* — a CPU precisa percorrer a tabela, o que custa dezenas de ciclos. Páginas maiores reduzem o número de entradas na tabela e aumentam a chance de um hit no TLB, especialmente em cargas com grandes alocações contíguas.

```terminal
$ grep -i "Huge" /proc/meminfo
AnonHugePages:    612352 kB
ShmemHugePages:        0 kB
FileHugePages:         0 kB
HugePages_Total:       0
HugePages_Free:        0
HugePages_Surp:        0
Hugepagesize:       2048 kB
Hugetlb:               0 kB
```

Nessa saída, o THP está ativo e já há 612 MB alocados como páginas anônimas de 2 MB (`AnonHugePages`). Não há huge pages explícitas (`HugePages_Total=0`), que seriam reservadas estaticamente com `hugetlbfs`. O SteamOS não usa huge pages estáticas; o que importa aqui é o mecanismo transparente.

## O que o THP faz automaticamente

O Transparent Huge Pages tenta, de forma automática e sem intervenção do programa, promover páginas de 4 KB para 2 MB. A palavra "transparente" é o ponto: o jogo não pediu, o desenvolvedor não marcou nada, o kernel detectou um bloco contíguo grande e promoveu.

A promoção tem custo. O kernel precisa achar blocos de 2 MB contíguos na RAM física, e isso pode exigir **compactação de memória** — mover páginas para criar um bloco livre grande. Esse processo é a thread `khugepaged`, que você encontra no `htop` e que aparece no `ps`:

```terminal
$ ps aux | grep khugepaged
root          82  0.0  0.0      0     0 ?        SN   00:00  0:00 [khugepaged]
```

O `khugepaged` varre a memória periodicamente, agrupando páginas e promovendo. Em cargas de baixa fragmentação (um jogo que aloca buffers grandes de uma vez, como texturas e geometria), o saldo é positivo: menos TLB miss, mais banda para a GPU. Em cargas que alocam e liberam memória freneticamente, a thread gasta CPU juntando cacos que se espalham de novo no frame seguinte.

## Ligar, desligar e medir

O THP é controlado pelo arquivo `/sys/kernel/mm/transparent_hugepage/enabled`. Ele aceita três valores:

```terminal
$ cat /sys/kernel/mm/transparent_hugepage/enabled
always [madvise] never
```

As opções são `always` (promove tudo que puder, agressivo), `madvise` (só promove se o programa pediu com `madvise()` — padrão do SteamOS 3.6) e `never` (desliga completamente). O valor entre colchetes é o atual.

```terminal
# echo always > /sys/kernel/mm/transparent_hugepage/enabled
$ cat /sys/kernel/mm/transparent_hugepage/enabled
[always] madvise never
```

O CryoUtilities recomenda `always`. A justificativa é que jogos tendem a alocar buffers grandes contíguos (texturas, geometria) e se beneficiam de páginas de 2 MB sem ter que pedir explicitamente. O contraponto: com `always`, o `khugepaged` trabalha mais e, sob memória fragmentada, o esforço de compactação pode gerar latência perceptível como micro-stutter.

:::atencao
A troca de `madvise` para `always` não é inofensiva. Em jogos que fazem muitas alocações pequenas e liberações rápidas (emuladores, engines legadas com garbage collection), o `always` pode aumentar o uso de CPU do `khugepaged` e reduzir FPS. Meça antes e depois, como sempre.
:::

## Onde THP brilha e onde tropeça

Há cenários bem documentados onde THP=`always` melhora jogos no Deck. Mundos abertos com grandes distâncias de visão são o caso clássico: a alocação de geometria e texturas é feita em blocos grandes, e o TLB miss cai sensivelmente. Alguns usuários reportam ganhos de 3-5% nos 1% low FPS em títulos como Cyberpunk 2077 ou Red Dead Redemption 2.

Por outro lado, jogos 2D leves, emuladores e engines que fazem alocações erráticas podem sofrer com fragmentação induzida pelo `khugepaged`. O sintoma não é um FPS médio menor, e sim picos de latência: o jogo está a 60 FPS, mas um frame ocasional demora o dobro.

:::dica
Você pode medir a atividade do THP em tempo real com `cat /proc/vmstat | grep -i thp`. As linhas `thp_fault_alloc` e `thp_collapse_alloc` indicam quantas páginas foram promovidas. Se `compact_stall` sobe junto, o kernel está sofrendo para compactar — sinal de que o `always` pode estar forçando a barra.
:::

## Qual a diferença para o jogo

A pergunta honesta: o desenvolvedor já não pede huge pages se precisar? Sim, mas nem sempre. Muitos jogos Windows convertidos via Proton não usam `madvise(MADV_HUGEPAGE)` porque a API do Windows não tem o conceito. Quem converte para Vulkan via DXVK/VKD3D pode ou não marcar as alocações de VRAM como candidatas a huge pages — depende da engine e da camada de tradução.

Por isso o `always` aparece como opção: ele cobre o caso de jogos que se beneficiariam mas não pedem. A desvantagem é que ele também cobre processos que não se beneficiam e pagam o custo da compactação.

```terminal
$ watch -n0.5 'cat /proc/vmstat | grep -E "thp|compact_stall"'
thp_fault_alloc 2401
thp_fault_fallback 38
thp_collapse_alloc 512
compact_stall 0
```

Neste snapshot, o THP está saudável: `fault_alloc` alto, `fallback` baixo (poucas tentativas que falharam), `compact_stall=0` (zero paradas por compactação). Se o `fallback` ou `stall` disparar durante o jogo, reduza para `madvise` e refaça o teste.

## Resumo

- Páginas de 4 KB são a unidade padrão de tradução de endereços; huge pages de 2 MB reduzem TLB miss e aceleram acessos a blocos grandes.
- O THP promove páginas automaticamente, sem que o programa peça.
- `always` força a promoção para tudo; `madvise` respeita a dica do programa; `never` desliga.
- Jogos com alocações grandes contíguas ganham; jogos com alocações erráticas podem sofrer stutter por compactação.
- O `khugepaged` é o processo que faz o trabalho sujo; monitorar `compact_stall` revela se ele está pesando.

## Exercícios

1. Leia `/proc/meminfo | grep -i huge` e explique quanto de memória está em páginas grandes e de que tipo.
2. Altere o THP para `never`, rode um jogo por 10 minutos, depois altere para `always` e compare os 1% low FPS. Anote os valores.
3. Durante um jogo pesado, monitore `compact_stall` e `thp_fault_fallback` com o THP em `always`. Os números disparam?
4. Identifique o PID do `khugepaged` e verifique o tempo de CPU acumulado (campo `Time` no `ps`). Ele cresce mais com `always` ou `madvise`?
5. **Desafio.** Explique por que um jogo Windows rodando via Proton não se beneficia automaticamente de `madvise(MADV_HUGEPAGE)` mesmo que o código original use `VirtualAlloc` com grandes buffers.