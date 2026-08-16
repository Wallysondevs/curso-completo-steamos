Comprar o SSD errado é o erro mais caro e evitável de todo este capítulo. O Steam Deck aceita um tipo específico de unidade — **M.2 2230 NVMe** — e nada maior encaixa fisicamente. Dentro dessa categoria ainda há diferenças de geração PCIe, de tipo de flash e de presença de memória cache que afetam tanto a velocidade quanto a vida útil. Escolher bem é um exercício de leitura de especificação, não de sorte.

:::objetivos
- Entender o formato físico M.2 2230 e por que é obrigatório
- Distinguir PCIe Gen3 de Gen4 e o que o Deck realmente aproveita
- Comparar flash TLC e QLC e o papel do cache DRAM
- Ler a especificação de uma unidade antes de comprar
- Calcular a capacidade e o custo-benefício de cada faixa
:::

## O que significa "2230"

A sigla M.2 descreve o conector; o número que a segue descreve as dimensões em milímetros: **22** de largura por **30** de comprimento. Os SSDs mais comuns de notebook são 2280 (22×80), compridos demais para o Deck. O compartimento interno do Steam Deck, em ambos os modelos, acomoda apenas o 2230. Tentar enfiar um 2280 não só não fecha a tampa como pode danificar o conector.

```terminal
$ ls -l /dev/disk/by-id/nvme-*
lrwxrwxrwx 1 root root 13 fev 17 14:02 /dev/disk/by-id/nvme-KINGSTON_OM3PDP3512B -> ../../nvme0n1
```

A listagem `/dev/disk/by-id` mostra o nome completo da unidade e é o jeito mais confiável de confirmar o que está instalado. Note que o tamanho físico não aparece por aí — você confirma o 2230 pela etiqueta impressa na própria unidade ou pela ficha do fabricante do modelo.

:::perigo
Comprar um 2242 ou 2280 "porque estava mais barato" e tentar instalar no Deck é erro grave: a unidade não fixa, o conector sofre tensão e há risco de curto. O formato **2230 é inegociável** — vale para LCD e OLED.
:::

## Gen3 ou Gen4? O gargalo real

Todos os Steam Deck, incluindo o OLED, têm a interface do SSD limitada na prática a **PCIe 3.0 x4**, o que dá um teto teórico em torno de 3.5 GB/s. Unidades **PCIe 4.0** funcionam normalmente — elas são retrocompatíveis e caem para a velocidade da Gen3 — mas você não vai ver os 7 GB/s anunciados. Isso torna o Gen3 um melhor custo-benefício: desempenho idêntico no Deck por menos dinheiro.

```terminal
$ sudo lspci -vnn | grep -A12 -i nvme
01:00.0 Non-Volatile memory controller: Phison Electronics Corporation 
        (prog-if 02 [NVM Express])
        LnkCap: Port #0, Speed 8GT/s, Width x4
        LnkSta: Speed 8GT/s (ok), Width x4
```

O campo `LnkSta` (link status) confirma a negociação real: `8GT/s` é Gen3 e `x4` são as quatro pistas. Se você instalar um SSD Gen4, verá o link baixar para `8GT/s` — a prova de que o barramento do Deck é quem limita, não a unidade.

## TLC, QLC e o cache DRAM

O flash que guarda os dados vem em dois sabores comuns: **TLC** (triple-level cell, 3 bits por célula) e **QLC** (quad-level cell, 4 bits). O QLC empilha mais dados na mesma área, então é mais barato, mas é mais lento para gravação sustentada e, em tese, desgasta mais rápido. Para um console que baixa jogos grandes de uma vez, TLC é a escolha mais segura.

O **DRAM cache** é uma memória separada que o controlador usa de tabela de endereços. Unidades sem DRAM usam o "host memory buffer" (HMB), pegando RAM do sistema emprestada. No Deck isso funciona, mas unidades com DRAM costumam manter o desempenho mais estável sob carga. Nenhuma das duas é obrigatória — são critérios de desempate, não de eliminação.

```terminal
$ sudo smartctl -a /dev/nvme0n1 | grep -iE 'Model|Firmware|Capacity|Percentage Used'
Model Number:      KINGSTON OM3PDP3512B-A01
Total NAND Capacity: 512 GB
Percentage Used:   2%
```

O `smartctl` lê a saúde da unidade por dentro. O campo **Percentage Used** é o mais importante na hora de comprar usado: unidades de segunda mão com esse número alto (próximo de 100) já esgotaram a vida útil projetada. Para SSD novo, ele deve começar zerado.

## O que exigir antes de comprar

Monte uma checklist mínima. A unidade precisa ser **2230**, **NVMe** (não SATA — o Deck ignora M.2 SATA), de preferência **Gen3** (ou Gen4 que será limitado), flash **TLC**, e uma garantia razoável. Capacidades típicas: 512 GB, 1 TB e 2 TB. O 2 TB cabe no Deck, mas os modelos 2230 de 2 TB escasseiam e têm preço premium.

```terminal
$ df -h /home
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p8  466G   391G   52G  89% /home
```

Calcule o espaço de que você precisa olhando para o seu uso real, não para o desejo. Se `/home` (onde vivem os jogos instalados) está em 89%, um upgrade para 1 TB dobra a folga; para 2 TB, quadruplica. Deixe margem para o cache de shader do Steam, que cresce silenciosamente com o tempo.

## Resumo

- O Deck exige SSD **M.2 2230 NVMe**; 2242/2280 não servem em nenhum modelo.
- A interface real é PCIe 3.0 x4 (8 GT/s); SSD Gen4 funciona, mas é limitado ao teto Gen3.
- Flash TLC é mais robusto e rápido que QLC; DRAM cache é critério de desempate, não obrigatório.
- `lspci -vnn` mostra a negociação do link e `smartctl` revela a saúde (Percentage Used) da unidade.
- 1 TB é o ponto de equilíbrio de custo-benefício para a maioria dos jogadores.

## Exercícios

1. Com `sudo lspci -vnn | grep -A12 -i nvme`, identifique a geração PCIe (8GT/s = Gen3) e a largura (x4) do seu SSD atual.
2. Rode `sudo smartctl -a /dev/nvme0n1` e anote Model Number, Firmware Version e Percentage Used. O que Percentage Used diferente de zero significa?
3. Compare no `df -h` os pontos de montagem `/` e `/home`. Por que o espaço de jogos vive em `/home` e não na raiz do sistema?
4. Pesquise o preço de três SSDs 2230 (um TLC, um QLC e um Gen4) da mesma capacidade. Qual deles oferece melhor custo por gigabyte *no contexto do Deck*, e por quê?
5. **Desafio.** Explique, usando o conceito de HMB (host memory buffer), por que um SSD sem DRAM ainda funciona no Steam Deck — e proponha um cenário de uso em que a ausência de DRAM se torne perceptível.
