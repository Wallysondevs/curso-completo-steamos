Os percentuais de GPU e CPU que o overlay mostra no canto da tela são os números mais mal interpretados do mundo do desempenho. "GPU a 99% é bom ou ruim?" depende inteiramente do contexto. Esta seção desmonta os mitos e fornece a chave de leitura correta para a APU do Steam Deck.

:::objetivos
- Interpretar os percentuais de GPU e CPU no overlay do SteamOS
- Distinguir gargalo de GPU, gargalo de CPU e equilíbrio
- Compreender por que o Steam Deck usa uma APU com memória unificada
- Diagnosticar qual componente está limitando o desempenho em cada cenário
:::

## O que o percentual significa — e o que não significa

O overlay mostra a GPU como um percentual de ocupação. Intuitivamente, "ocupação alta" soa como algo ruim, mas em jogos é o contrário: GPU em 99% é o estado ideal de uma placa de vídeo. Significa que ela está sendo alimentada com trabalho suficiente para operar na capacidade máxima — o jogo está usando tudo o que a placa pode oferecer.

Já a CPU em 99%, com GPU baixa, é o sinal de problema. Significa que o processador não está dando conta de preparar os comandos que a GPU executaria, e a placa de vídeo fica ociosa esperando. É o gargalo de CPU, o temido "CPU-bound".

```terminal
$ # Cenario 1: GPU-bound (saudavel, a GPU e o limite)
$ # GPU 99% | CPU 41% | FPS 47 -> o jogo usa toda a GPU; a CPU sobra
$ # para ganhar FPS: abaixe a qualidade grafica ou a resolucao
$
$ # Cenario 2: CPU-bound (problematico, a CPU e o limite)
$ # GPU 61% | CPU 92% | FPS 38 -> a CPU nao consegue alimentar a GPU
$ # para ganhar FPS: reduzir qualidade grafica nao ajuda muito;
$ #                    reduza distancia de visao, multidões ou física
```

A regra prática: **GPU perto de 100% com CPU folgada é normal em jogo 3D pesado. CPU alta com GPU baixa é gargalo de processador.**

## A APU unificada do Steam Deck

A arquitetura do Steam Deck afeta diretamente a leitura desses percentuais. Diferente de um PC de mesa, onde CPU e GPU são chips separados com memórias independentes, o Deck usa uma **APU** (Accelerated Processing Unit) — um único chip que contém tanto os núcleos de CPU (Zen 2) quanto os de GPU (RDNA 2).

As implicações para o monitoramento:

- A memória é **unificada**: os mesmos 16 GB de RAM são compartilhados entre CPU e GPU, alocados dinamicamente. Quando a GPU pede mais VRAM, sobra menos RAM para o sistema, e vice-versa.
- O orçamento de energia também é unificado: a APU inteira divide um TDP máximo (tipicamente 15 W no Deck). Se a GPU está puxando 12 W, sobram 3 W para a CPU — e a CPU pode ser forçada a baixar seus clocks.
- O aquecimento é compartilhado: núcleos de CPU e GPU moram no mesmo die e dissipam calor juntos. Se um lado esquenta, o outro perde margem de boost.

```terminal
$ # Verificando detalhes da APU pelo terminal (Modo Desktop)
$ glxinfo -B | grep -i -E 'device|memory|video'
    Device: AMD Custom GPU 0405 (vangogh, LLVM 18.1.8, DRM 3.57, 6.8.0-valve3-1)
    Video memory: 512MB
    Unified memory: no
$ # Atencao: "Unified memory: no" no glxinfo e um artefato do driver
$ # A arquitetura do Deck e sim unificada; o driver reporta diferente
```

O dado importante aqui é o nome do dispositivo: `AMD Custom GPU 0405 (vangogh)`. "Van Gogh" é o codinome da APU do Steam Deck, com CPU Zen 2 e GPU RDNA 2 integrados no mesmo silício.

:::info
O `glxinfo -B` reporta "Unified memory: no" por limitação do driver AMDGPU, não porque a memória não seja unificada. O kernel trata a memória do Deck como unificada e aloca dinamicamente entre CPU e GPU via CMA (Contiguous Memory Allocator). O número real de VRAM disponível pode ser consultado com `cat /sys/class/drm/card0/device/mem_info_vram_total`.
:::

## Diagnosticando quem é o culpado

Quando o FPS está abaixo do desejado, você precisa decidir: a culpa é da GPU ou da CPU? A resposta determina qual configuração mexer.

```terminal
$ # Teste do "zoom" (procedimento de diagnostico):
$ # 1. Olhe o FPS atual: 35
$ #    GPU 98% | CPU 44% --- parece GPU-bound
$ # 2. Reduza a resolucao ou a qualidade grafica
$ #    -> FPS sobe para 51? Entao era GPU-bound confirmado
$ #    -> FPS continua 35? Entao o gargalo e outro (CPU, RAM, engine)
$ # 3. Se o FPS nao subiu, reduza distancia de visao ou qualidade de NPCs
$ #    -> FPS sobe? Era CPU-bound
```

Esse procedimento de duas etapas é infalível. Ele testa primeiro a hipótese de gargalo de GPU (baixando qualidade gráfica) e, se o FPS não responder, testa a hipótese de gargalo de CPU (baixando simulação).

:::dica
Em jogos com "multidões" ou "simulação de física", a CPU pode estar alta mesmo com pouca coisa na tela. É o caso clássico de *Cities: Skylines*, *Factorio* em bases grandes, ou *Baldur's Gate 3* no Ato 3 com muitos NPCs. Nesses jogos, baixar a qualidade gráfica não adianta nada; você precisa mexer em população, distância de visão ou física.
:::

## A GPU da Steam Deck em números

Para ter referência do que esperar em cada faixa de FPS, os percentuais costumam se comportar assim em jogos representativos:

```terminal
$ # Comportamento tipico da APU Van Gogh em jogos reais:
$ #
$ # Jogo leve / indie 2D (ex.: Stardew Valley, Celeste):
$ #   GPU 30-50% | CPU 15-25% | FPS 60 travado
$ #
$ # Jogo 3D otimizado (ex.: Doom Eternal, config Medio):
$ #   GPU 95-99% | CPU 35-50% | FPS 50-60
$ #
$ # Jogo 3D pesado (ex.: Cyberpunk 2077, config Baixo):
$ #   GPU 99-100% | CPU 55-70% | FPS 28-35
$ #
$ # Jogo CPU-bound (ex.: Baldur's Gate 3 Ato 3):
$ #   GPU 55-70% | CPU 80-99% | FPS 22-30
```

Em jogos otimizados como Doom Eternal, ver GPU no teto e CPU sobrando é o cenário ideal — o jogo extrai tudo da placa. Já em Cyberpunk 2077, com ambos GPU e CPU altos, o Deck está no limite da APU inteira; não há muito o que fazer além de aceitar os 30 FPS ou usar FSR.

:::atencao
O percentual de CPU que o overlay mostra é um **agregado de todos os núcleos**. Um jogo que usa só um núcleo (como muitos títulos mais antigos) pode mostrar CPU 25% e mesmo assim estar CPU-bound — porque aquele núcleo específico está em 100% enquanto os outros três estão ociosos. O overlay do SteamOS não mostra uso por núcleo, mas o MangoHud (seção 9) sim.
:::

## Resumo

- GPU em 99% com CPU folgada é o estado ideal e significa que o jogo está usando toda a placa de vídeo.
- CPU alta com GPU baixa indica gargalo de processador; reduzir qualidade gráfica não resolve.
- O Steam Deck usa uma APU com memória e energia unificadas, o que faz GPU e CPU competirem pelos mesmos recursos.
- O teste do "zoom" em duas etapas (reduzir gráfico → depois reduzir simulação) diagnostica qual é o gargalo.
- O percentual de CPU do overlay é agregado; um único núcleo a 100% pode passar despercebido.

## Exercícios

1. Abra um jogo 3D, observe GPU e CPU por 60 segundos, e classifique: a maior parte do tempo o jogo é GPU-bound ou CPU-bound?
2. Faça o teste do "zoom": reduza a qualidade gráfica e anote quanto o FPS melhora. Depois reduza a distância de visão e compare.
3. Abra um jogo leve (indie 2D) e um pesado (AAA 3D) e compare os percentuais de GPU e CPU — o que muda?
4. No Modo Desktop, rode `glxinfo -B` e localize o nome do dispositivo GPU. Confirme que ele corresponde à APU Van Gogh.
5. **Desafio.** Usando `htop` no Modo Desktop durante um jogo pesado, compare o uso por núcleo da CPU com o percentual agregado do overlay. Algum núcleo está em 100% enquanto o overlay mostra um número muito menor?