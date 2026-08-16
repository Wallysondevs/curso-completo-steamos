VRAM e RAM são os dois tipos de memória que o overlay monitora, e a confusão entre elas gera diagnósticos errados. No Steam Deck, a relação é ainda mais íntima do que num PC comum, porque os 16 GB são compartilhados dinamicamente entre o sistema e a placa de vídeo. Saber ler esses dois números previne travadas misteriosas e crashes de "out of memory".

:::objetivos
- Diferenciar VRAM e RAM e saber o que cada uma armazena
- Ler os valores de memória no overlay do SteamOS
- Entender o esquema de memória unificada da APU do Steam Deck
- Diagnosticar estouro de memória e suas consequências
:::

## Dois tipos de memória, dois papéis

**RAM** (Random Access Memory, memória do sistema) é onde ficam o código do jogo em execução, as estruturas de dados, o estado do mundo e o restante do sistema operacional. O Steam Deck tem 16 GB de RAM que, na arquitetura unificada, também alimentam a GPU.

**VRAM** (Video RAM, memória de vídeo) é a memória que a GPU usa para armazenar texturas, buffers de geometria, mapas de sombra e o framebuffer que está sendo desenhado. Em placas de vídeo discretas, a VRAM é um banco separado de chips GDDR (por isso um PC tem, digamos, 16 GB de RAM *e* 8 GB de VRAM dedicada). No Deck, como explicado na seção 5, essa VRAM é um pedaço dinâmico dos mesmos 16 GB físicos.

```terminal
$ # Diferença conceitual:
$ # RAM  -> contém o que a CPU manipula: lógica, estado, física
$ # VRAM -> contém o que a GPU renderiza: texturas, geometria, buffers
$ # No Steam Deck, ambas saem do mesmo pool de 16 GB físicos
```

Quando um jogo carrega uma textura de 4K, ela vai para a VRAM. Quando ele calcula a física de milhares de partículas, isso ocupa RAM (e CPU). Jogos modernos usam as duas de forma intensa, mas por motivos diferentes.

## Lendo memória no overlay

No nível 3 em diante, o overlay passa a mostrar duas barras ou valores de memória, normalmente rotuladas `RAM` e `VRAM`. Os valores aparecem em GB, como `VRAM 5.2 GB` ou `RAM 11.4 GB`.

```terminal
$ # Leitura tipica do overlay em jogo 3D pesado:
$ # VRAM 6.4 GB | RAM 11.2 GB | FPS 42
$ #
$ # Leitura em jogo indie leve:
$ # VRAM 1.1 GB | RAM 8.3 GB  | FPS 60
```

Repare num detalhe importante: o valor de VRAM mostrado raramente chega a "16 GB", mesmo no jogo mais pesado. Isso acontece porque a GPU reporta quanto do pool compartilhado ela está usando *naquele instante*, e o sistema reserva uma parte fixa mínima para o SteamOS. O teto efetivo para jogos costuma girar em torno de 8 GB de VRAM máxima no Deck.

:::nota
O SteamOS reserva parte da RAM para o gamescope, o compositor que desenha a interface e o overlay. Por isso, do total físico de 16 GB, a quantidade disponível para jogos é um pouco menor. Você pode ver o total real com `free -h` no Modo Desktop, que mostra as colunas `total`, `used` e `available`.
:::

## O que acontece quando a memória estoura

O comportamento de estouro é diferente para cada tipo:

**VRAM cheia.** Quando a GPU precisa de mais VRAM do que há, o sistema começa a "paginá-la" — mover texturas da memória rápida para a RAM (ou até para o disco, no pior caso). Isso gera as travadas periódicas de carregamento de textura: o jogo roda a 60 FPS, de repente congela por 200 ms enquanto uma textura é copiada, e volta. É o clássico sintoma de VRAM estourada.

```terminal
$ # Sintoma de VRAM estourada:
$ # FPS 60 | frametime 16.7 ms   (normal)
$ # FPS 58 | frametime 180.0 ms  (textura sendo paginada)
$ # VRAM 7.9 GB / 8.0 GB         (no teto, confirmando o estouro)
```

**RAM cheia.** Quando a RAM do sistema esgota, as consequências são mais severas. O kernel começa a matar processos (o *OOM killer*) para liberar memória, e o jogo ou o próprio gamescope pode ser derrubado de uma hora para outra, sem aviso.

```terminal
$ # Monitorando a RAM do sistema no Modo Desktop durante um jogo:
$ free -h
               total        used        free      shared  buff/cache   available
Mem:            14Gi       9.1Gi       1.2Gi       1.3Gi       3.8Gi       4.6Gi
Swap:           1.0Gi       0.0Gi       1.0Gi
```

A coluna `available` é a mais honesta: é o quanto realmente pode ser usado sem despejar cache. Se `available` chegar perto de zero durante um jogo, prepare-se para um crash por falta de memória.

:::atencao
No Steam Deck não há como "aumentar" a VRAM com um ajuste de BIOS como em PCs comuns. A alocação é automática e dinâmica, gerenciada pelo kernel via CMA. Históricas opções tipo "VRAM 4 GB fixa" não existem no firmware padrão do Deck — a APU negocia a divisão sozinha, e forçar valores manualmente pode até reduzir o desempenho.
:::

## Caches de shader e a memória

Uma peculiaridade do SteamOS que tem relação direta com RAM é o sistema de **shader cache**. A Steam pré-compila shaders de jogos e os guarda em disco; quando o jogo roda, esses shaders são carregados na RAM. É um trade-off: menos travadas de compilação (como vimos na seção 3), mas mais uso de RAM.

```terminal
$ # Verificando o tamanho dos caches de shader no Modo Desktop:
$ du -sh ~/.local/share/Steam/steamapps/shadercache 2>/dev/null
3.1G	/home/deck/.local/share/Steam/steamapps/shadercache
$ du -sh ~/.local/share/Steam/steamapps/compatdata 2>/dev/null
5.6G	/home/deck/.local/share/Steam/steamapps/compatdata
```

O `compatdata` é a pasta do Proton (a camada de compatibilidade que roda jogos de Windows). Juntos, `shadercache` e `compatdata` podem consumir vários gigabytes de disco — relevantes num aparelho com SSD limitado. Quando o espaço aperta, limpar caches antigos libera disco, e indiretamente alivia a pressão de memória em jogos que fazem cache agressivo.

## Resumo

- RAM guarda o que a CPU processa; VRAM guarda o que a GPU renderiza.
- No Steam Deck, RAM e VRAM saem do mesmo pool de 16 GB compartilhados, alocados dinamicamente.
- VRAM cheia causa travadas periódicas de textura; RAM cheia pode derrubar o jogo pelo OOM killer.
- O teto prático de VRAM no Deck fica em torno de 8 GB, abaixo dos 16 GB físicos.
- O shader cache e o Proton consomem disco e afetam o uso de memória indiretamente.

## Exercícios

1. Num jogo pesado, anote VRAM e RAM no overlay e compare com os valores de um jogo leve. Qual muda mais?
2. No Modo Desktop, rode `free -h` antes e durante um jogo e observe a coluna `available` cair.
3. Procure o teto de VRAM do seu Deck: rode um jogo com texturas em ultra e veja se a VRAM estaciona num valor máximo.
4. Rode `du -sh ~/.local/share/Steam/steamapps/shadercache` e veja quanto de disco os shaders estão usando.
5. **Desafio.** Observe o frametime enquanto a VRAM fica cheia num jogo de mundo aberto. Relacione os espinhos de frametime com a paginação de textura e explique por que o sintoma (seção 3) e a causa (VRAM cheia) são a mesma moeda.
