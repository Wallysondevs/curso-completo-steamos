A memória e o armazenamento definem o que cabe no seu Steam Deck e com que rapidez aquilo carrega. São duas coisas diferentes que muita gente confunde: a RAM mantém o que está em uso naquele instante; o SSD e o microSD guardam o que persiste entre reinícios. Saber ler ambos no sistema evita surpresas — desde um jogo que não instala por falta de espaço até microSDs lentos que travam mundos abertos.

:::objetivos
- Distinguir RAM de armazenamento e ler cada um com comandos do sistema
- Entender a memória unificada LPDDR5 e por que ela é compartilhada com a GPU
- Identificar o SSD NVMe interno e sua capacidade usada
- Avaliar o slot microSD e os limites de velocidade do barramento
- Diagnosticar espaço em disco, swap e montagem de volumes
:::

## RAM unificada: 16 GB que CPU e GPU disputam

O Steam Deck tem 16 GB de memória LPDDR5 soldados na placa — não há como expandir. Diferente de um desktop com GPU dedicada, onde a placa de vídeo tem sua própria VRAM, aqui CPU e GPU compartilham a mesma memória física através da APU. O kernel reserva dinamicamente parte dela para a GPU, usando o driver `amdgpu` para alocar buffers de vídeo conforme cada jogo pede.

```terminal
$ free -h
               total        used        free      shared  buff/cache   available
Mem:            14Gi       2.6Gi       8.3Gi        12Mi       3.5Gi        11Gi
Swap:          4.0Gi          0B       4.0Gi
```

O total reportado é ~14 GiB porque o firmware e a GPU integrada já reivindicam uma fatia fixa do endereço de memória antes de o kernel terminar de inicializar. As colunas importam: `used` é o que os processos ocupam de fato, `buff/cache` é memória que o kernel usa como cache de disco (recuperável a qualquer momento) e `available` é o que um novo jogo pode pedir sem pressionar a troca para swap.

```terminal
$ cat /proc/meminfo | grep -E 'MemTotal|CmaTotal|MemFree'
MemTotal:       14618048 kB
CmaTotal:         524288 kB
MemFree:         8723456 kB
```

O campo `CmaTotal` expõe a página de memória contígua reservada para DMA (Direct Memory Access) — usada por dispositivos que precisam de buffer contíguo, incluindo parte do pipeline gráfico. É um detalhe técnico que raramente precisa de ajuste, mas prova que a memória do Deck não é um bloco monolítico à disposição da CPU.

:::nota
O swap de 4 GB no SteamOS serve mais como rede de segurança do que como desempenho. Com 14 GB utilizáveis, o Deck raramente troca para disco em jogos; quando o faz, um SSD NVMe absorve o impacto melhor que um microSD faria.
:::

## O SSD NVMe interno

O armazenamento principal é uma unidade NVMe (Non-Volatile Memory Express) conectada ao barramento PCIe — no modelo LCD de 64 GB, um módulo eMMC; nas versões maiores e em todos os OLED, um SSD M.2 2230 real. NVMe é o protocolo que deixa o SSD falar direto com a APU por PCIe, com latência de microssegundos e filas paralelas de comandos.

```terminal
$ df -h / /home
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p5   455G   89G  342G  21% /
/dev/nvme0n1p5   455G   89G  342G  21% /home
```

No SteamOS 3.6, a partição raiz e o `/home` vivem no mesmo sistema de arquivos A/B da unidade, montados a partir de `/dev/nvme0n1p5`. O SSD de 512 GB aparece como ~455 GB utilizáveis porque o fabricante conta em GB decimais (1 GB = 10⁹ bytes) enquanto o sistema conta em GiB (2³⁰ bytes), além do espaço reservado para o layout de partições A/B da Valve.

```terminal
$ lsblk -o NAME,SIZE,TYPE,MOUNTPOINT,MODEL
NAME        SIZE TYPE MOUNTPOINT          MODEL
nvme0n1   476.9G disk                     KIOXIA KBG40ZNS512G
├─nvme0n1p1   64M part
├─nvme0n1p2   32M part
├─nvme0n1p3  512M part
├─nvme0n1p4  4.5G part
├─nvme0n1p5  55.7G part /
├─nvme0n1p6   55G part
├─nvme0n1p7 191.1G part /home
└─nvme0n1p8  170G part
```

O `lsblk` revela o particionamento real do SteamOS. As duas partições raiz (`p5` e `p6`, ~55 GB cada) são o esquema A/B da Valve: uma é a ativa, a outra guarda a versão anterior do sistema para rollback automático em caso de atualização quebrada. O grosso do espaço vai para `/home` (`p7`), onde ficam seus jogos e dados.

## O slot microSD e seus limites de velocidade

O único meio oficial de expandir armazenamento é o slot microSD na borda inferior. O barramento é UHS-I, com pico teórico de ~104 MB/s — mas na prática os cartões entregam entre 60 e 95 MB/s de leitura sequencial e bem menos de escrita aleatória. Isso é suficiente para rodar jogos (sequências, não aleatórios puros), mas mundos abertos que fazem streaming constante de texturas podem engasgar em microSDs baratos.

```terminal
$ mount | grep mmcblk
/dev/mmcblk0p1 on /run/media/deck/EXT4 type ext4 (rw,nosuid,nodev,relatime)
$ lsblk /dev/mmcblk0
NAME        MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
mmcblk0     179:0    0 465.8G  0 disk
└─mmcblk0p1 179:1    0 465.8G  0 part /run/media/deck/EXT4
```

O cartão aparece como `/dev/mmcblk0` — o prefixo `mmcblk` é a assinatura de mídia eMMC/SD no Linux. O SteamOS monta cartões formatados em ext4 em `/run/media/deck/<label>`. Cartões vendidos prontos costumam vir em exFAT; o Deck consegue ler, mas para melhor desempenho e compatibilidade com permissões, a Valve formata em ext4 quando você pede pelo modo de jogo.

:::dica
Prefira cartões microSD com selo A2 (Application Performance Class 2), que garantem escrita aleatória mínima maior — justamente o que jogos com muitos saves e shaders exigem. A classe de vídeo (V30) fala só de gravação sequencial de vídeo, não de desempenho de jogo.
:::

## Espaço, shaders e para onde ele vai

Quem usa o Deck por alguns meses percebe que o espaço some mais rápido que a soma dos jogos instalados. O vilão são os **shaders**: o SteamOS baixa e compila caches de shader (pequenos programas gráficos pré-compilados) para cada jogo, e eles podem ocupar gigabytes. A Valve armazena esses caches em `/home/deck/.local/share/Steam/steamapps/shadercache`.

```terminal
$ du -sh /home/deck/.local/share/Steam/steamapps/shadercache
4.3G	/home/deck/.local/share/Steam/steamapps/shadercache
$ du -sh /home/deck/.local/share/Steam/steamapps/common
311G	/home/deck/.local/share/Steam/steamapps/common
```

No exemplo, os caches de shader somam 4,3 GB adicionais além dos 311 GB de arquivos de jogo. Desinstalar um jogo nem sempre apaga o cache correspondente; vale revisar o diretório de tempos em tempos.

```terminal
$ df -h /home/deck/.local/share/Steam
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p7   191G  175G   8.6G  96% /home/deck/.local/share/Steam
```

Com 96% de uso, qualquer download novo falha. A leitura preventiva de `df -h` sobre o diretório do Steam é o exame mais rápido antes de tentar instalar um jogo de 100 GB que não vai caber.

:::atencao
Nunca remova arquivos de shader cache enquanto o jogo correspondente estiver em execução. O Steam recompila o cache na próxima inicialização, e apagar com o jogo aberto pode corromper o diretório e forçar uma recompilação completa — sem dano permanente, mas com perda de tempo e travamentos.
:::

## Resumo

- O Deck tem 16 GB de LPDDR5 soldados, compartilhados entre CPU e GPU via APU; `free -h` e `/proc/meminfo` mostram o estado.
- O SSD interno é NVMe (ou eMMC no LCD de 64 GB); `lsblk` revela o esquema de partições A/B do SteamOS.
- As partições raiz (~55 GB cada) são espelhadas para rollback automático; o espaço de jogo fica em `/home`.
- O microSD é UHS-I (máx ~104 MB/s); cartões A2 são melhores para jogos.
- Caches de shader em `shadercache` podem ocupar gigabytes e nem sempre somem ao desinstalar o jogo.

## Exercícios

1. Rode `free -h` e explique, em uma frase, a diferença entre as colunas `used`, `buff/cache` e `available`.
2. Liste os discos com `lsblk -o NAME,SIZE,TYPE,MOUNTPOINT` e identifique qual partição está montada em `/` e qual em `/home`.
3. Insira um microSD e descubra em que dispositivo ele aparece (`/dev/mmcblk0`?) com `lsblk`. Para onde ele foi montado?
4. Meça o espaço dos shaders com `du -sh /home/deck/.local/share/Steam/steamapps/shadercache` e compare com `du -sh .../common`. O cache é relevante na sua instalação?
5. **Desafio.** Esvazie espaço de forma segura: execute `df -h /home`, identifique um jogo que você não joga há tempos, desinstale-o pelo Steam e depois verifique se o cache de shader correspondente sumiu com `du -sh`. Se não sumiu, localize a pasta residual e documente por que o Steam não a removeu.