No Steam Deck não existe "memória de vídeo" separada. Os 16GB de RAM são **unificados** — a CPU e a GPU disputam o mesmo balde, negociados pelo driver e pelo kernel. Essa arquitetura, chamada **UMA** (*Unified Memory Architecture*), é o que permite que o Deck pese 669 gramas e rode jogos AAA sem uma placa de vídeo dedicada. Mas também impõe limites que afetam cada jogo de um jeito.

:::objetivos
- Entender o conceito de memória unificada e como ele difere de uma dGPU
- Inspecionar a RAM disponível com `free` e `/proc/meminfo`
- Verificar o tipo, a largura de banda e a frequência da LPDDR5
- Interpretar a alocação automática de memória entre CPU e GPU
- Diagnosticar situações de esgotamento de RAM com ferramentas do sistema
:::

## UMA: o que é e por que você precisa saber

Num PC com placa de vídeo dedicada, a CPU tem a sua RAM (DDR4/DDR5, tipicamente de 16GB a 64GB) e a GPU tem a dela (GDDR6/GDDR6X, de 8GB a 24GB). Texturas, buffers de vértice e framebuffers vivem na VRAM da GPU, e só vão para a RAM do sistema quando estouram. Há duas memórias fisicamente separadas, com barramentos separados e controladores separados.

O Deck elimina essa divisão: há um único bloco de 16GB de **LPDDR5**, soldado na placa (não expansível), sentado no mesmo controlador de memória que serve tanto a CPU Zen 2 quanto a GPU RDNA 2. A sigla LPDDR significa *Low Power DDR* — é o mesmo tipo de memória que se encontra em smartphones e ultrabooks, priorizando eficiência energética sobre latência absoluta.

A grande sacada é que CPU e GPU **compartilham ponteiros**. Um buffer alocado pela GPU pode ser lido pela CPU sem cópia — não há barreira PCI Express no meio. Isso elimina latência e overhead, e é o motivo de APIs modernas como DirectX 12 e Vulkan terem modos de memória compartilhada que brilham especialmente no Deck.

A desvantagem: os 16GB são o teto. Diferente de um desktop onde você troca os pentes, no Deck 16GB é para sempre.

## Medindo a RAM com `free`

O comando `free` é o jeito mais direto de ver o estado da RAM:

```terminal
$ free -h
               total        used        free      shared  buff/cache   available
Mem:            14Gi       2.1Gi       8.4Gi       234Mi       4.0Gi        12Gi
Swap:          8.0Gi          0B       8.0Gi
```

A linha que importa: `total` mostra ≈14Gi, não 16Gi, porque cerca de 2GB são reservados pelo firmware e pelo driver da GPU para buffers essenciais e não aparecem como "disponíveis" para a CPU. Entre os 14Gi restantes, a alocação entre CPU e GPU é dinâmica: o driver `amdgpu` pede memória conforme o jogo demanda, e a devolve quando o jogo fecha.

O `available` (à direita) é a métrica mais honesta: quanto de RAM o sistema ainda consegue oferecer a quem pedir, incluindo aquilo que hoje está em cache mas pode ser descartado.

:::dica
Os 2GB "sumidos" são normais. Você pode confirmar quanto a GPU reservou com:

```terminal
$ cat /sys/class/drm/card0/device/mem_info_vram_total
$ cat /sys/class/drm/card0/device/mem_info_vram_used
```

Os arquivos mostram, em bytes, o total reservado e o usado no momento. Some e veja que isso NÃO é o limite real — a GPU pode pegar mais RAM do sistema quando precisar.
:::

## `/proc/meminfo` em detalhes

O `free` é o resumo; o `/proc/meminfo` é o relatório completo:

```terminal
$ cat /proc/meminfo | head -20
MemTotal:       14658776 kB
MemFree:         8805092 kB
MemAvailable:   12340448 kB
Buffers:           23496 kB
Cached:          3978324 kB
SwapCached:            0 kB
Active:          3740504 kB
Inactive:        1640364 kB
Active(anon):    1398652 kB
Inactive(anon):   355944 kB
Active(file):    2341852 kB
Inactive(file):  1284420 kB
Unevictable:       51468 kB
Mlocked:              72 kB
SwapTotal:       8388604 kB
SwapFree:        8388604 kB
Dirty:               272 kB
Writeback:             0 kB
AnonPages:       1378408 kB
Mapped:           739960 kB
```

O `MemTotal` de 14.658.776 kB confere com os ≈14Gi do `free`. Os campos `Active(anon)` e `Inactive(anon)` mostram páginas de memória anônima (heap, stacks, alocações de `malloc`) que não estão atreladas a nenhum arquivo. `Active(file)` e `Inactive(file)` são páginas de cache de disco — podem ser descartadas se a pressão de memória aumentar.

Para o Deck, o que interessa de fato é `MemAvailable`: quando esse número cai abaixo de 500MB, o sistema começa a trocar páginas para o disco (swap), e o jogo engasga.

## LPDDR5 a 5500 MT/s: a banda que alimenta a GPU

A memória do Deck roda no padrão LPDDR5 a aproximadamente **5500 MT/s** (*megatransfers per second*). Na prática, como o barramento é de 128 bits (quatro canais de 32 bits cada), a largura de banda efetiva é algo como:

```
5500 MT/s × 128 bits / 8 bits por byte = 88 GB/s
```

Esse número é baixo comparado aos 400-600 GB/s de uma placa de vídeo dedicada, mas é o suficiente para 1280x800 a 60-90 FPS em boa parte dos títulos. O barramento de 128 bits é o mesmo encontrado em APUs de notebook da linha Ryzen 6000, e é parte do motivo pelo qual o Deck consegue rodar *Elden Ring* ou *Cyberpunk 2077* em configurações baixas/médias.

O `dmidecode` revela, para quem tem acesso root, os detalhes físicos da RAM:

```terminal
$ sudo dmidecode --type memory
# dmidecode 3.5
Getting SMBIOS data from sysfs.
SMBIOS 3.3.0 present.

Handle 0x0024, DMI type 17, 40 bytes
Memory Device
	Array Handle: 0x0022
	Type: LPDDR5
	Type Detail: Synchronous
	Speed: 5500 MT/s
	Manufacturer: Micron Technology
	Serial Number: 00000000
	Part Number: MT62F1G32D2DS-026 WT:B
	Rank: 2
	Configured Memory Speed: 5500 MT/s
	Minimum Voltage: 0.5 V
	Maximum Voltage: 0.5 V
	Configured Voltage: 0.5 V
```

Os 0,5V do LPDDR5 são metade da voltagem da DDR4 de desktop (1,2V) — o que explica parte da eficiência térmica da máquina.

:::info
Os chips de LPDDR5 do Deck são soldados na placa-mãe (não há slots SODIMM). Isso permite que as trilhas de cobre entre o controlador e a memória sejam mais curtas, reduzindo ruído, latência e consumo de energia. A contrapartida, como já dito, é que você não troca.
:::

## Diagnóstico de esgotamento: quando os 16GB não bastam

Se o jogo fecha sozinho ou o frame cai abruptamente e o Deck volta ao menu com um erro "not enough memory", é a UMA que bateu no teto. Você pode ver a situação no momento crítico:

```terminal
$ free -w -h
               total        used        free      shared     buffers       cache   available
Mem:            14Gi        13Gi       234Mi       1.8Gi        12Mi       856Mi       198Mi
Swap:          8.0Gi       3.2Gi       4.8Gi
```

Com `available` em 198MB e 3.2GB em swap, o sistema já está fazendo malabarismo. A solução no Deck: feche outros aplicativos (o navegador no desktop usa RAM demais), reduza texturas e sombras no jogo, ou aceite que há títulos que vão consumir mais de 16GB combinados.

:::atencao
O SteamOS usa swap por padrão (arquivo ou partição). Com SSD NVMe, o swap não dói como num HD mecânico, mas ainda assim é ordens de grandeza mais lento que a LPDDR5. Se o jogo começar a acessar swap constantemente, você sentirá travamentos de vários segundos.
:::

## Resumo

- O Deck tem memória unificada (UMA): CPU e GPU compartilham os mesmos 16GB de LPDDR5.
- `free -h` mostra ≈14Gi disponíveis; ~2GB são reservados para firmware/GPU.
- `/proc/meminfo` detalha a alocação; `MemAvailable` é o número-chave para saber se sobra RAM.
- A memória roda a 5500 MT/s com barramento de 128 bits, resultando em cerca de 88 GB/s de banda.
- A GPU não tem VRAM dedicada — ela aloca da RAM do sistema, dinamicamente, via driver `amdgpu`.
- Diagnostique esgotamento com `free` e observe swap; RAM cheia = engasgos e fechamentos de jogo.

## Exercícios

1. Rode `free -h` com o Deck em idle e compare o `available` com o `total`. Qual a diferença e para onde foi?
2. Use `cat /proc/meminfo | grep -E '^(MemTotal|MemAvailable|SwapTotal|SwapFree)'` para obter um resumo. Depois veja `cat /proc/meminfo | grep -iE '(dirty|writeback)'`. O que Dirty > 0 significa?
3. Execute `sudo dmidecode --type memory` e identifique `Speed` e `Type`. A velocidade bate com os 5500 MT/s?
4. Abra um jogo pesado, volte ao desktop (sem fechar) e rode `free -h`. Compare o `used` e o `available` com os valores do exercício 1. O jogo consumiu quantos GB?
5. **Desafio.** Calcule a largura de banda teórica: `5500 × 128 / 8` e converta para GB/s. Depois compare com a banda de VRAM de uma placa de desktop (procure `GDDR6 bandwidth`). Por que a GPU RDNA 2 do Deck, mesmo com menos banda, não deixa jogos 2D ou indies travando?