A CPU do Steam Deck é só metade da história. A outra metade — e, para jogos, a metade que mais importa — é a GPU integrada: uma **RDNA 2** com 8 unidades de computação. É ela que desenha os 1280x800 pixels na tela e que define, na prática, se um jogo roda bem ou não. Esta seção explica como ler essa GPU pelo lado do sistema e o que os números dela significam de verdade.

:::objetivos
- Identificar a GPU RDNA 2 do Deck via `lspci` e drivers
- Traduzir "8 CUs" e "1.6 TFLOPs FP32" em capacidade real de jogo
- Confirmar o driver AMD em uso com `lsmod` e o firmware carregado
- Ler informações da GPU com `vulkaninfo` e `glxinfo`
- Entender por que a memória da GPU é a RAM do sistema
:::

## RDNA 2 em 8 unidades de computação

A GPU do Deck pertence à arquitetura **RDNA 2** — a mesma família dos chips gráficos dos consoles Xbox Series e das placas Radeon RX 6000. Cada **unidade de computação** (CU) é um bloco com 64 processadores de fluxo dedicados a cálculos de ponto flutuante. Oito CUs dão 512 processadores de fluxo no total.

O número que a Valve divulga — **até 1.6 TFLOPs FP32** — é a medida de pico da capacidade de cálculo de precisão simples (FP32), o tipo de operação dominante em renderização de jogos. "TFLOPs" é trilhões de operações de ponto flutuante por segundo. Para comparar: uma Radeon RX 6700 XT de desktop ultrapassa 13 TFLOPs. O Deck está, com folga, no território de "portátil", não de "substituto de desktop".

O que mantém os jogos rodando bem aqui é a resolução: 1280x800 tem 1/5 dos pixels de um monitor 1440p. A GPU precisa preencher muito menos pixels por frame, então 1.6 TFLOPs rendem muito mais do que renderiam empurrando uma tela grande.

## Encontrando a GPU pelo barramento PCI

No Linux, todo dispositivo PCI é visto pelo kernel e listado com `lspci`. A GPU integrada aparece como parte da APU, mas ainda responde como função PCI:

```terminal
$ lspci -nn | grep -i vga
04:00.0 VGA compatible controller [0300]: Advanced Micro Devices, Inc. [AMD/ATI] Van Gogh [1002:163f] (rev c1)
```

O `[1002:163f]` é o par **vendor:device** (1002 = AMD, 163f = a GPU Van Gogh). Esse id é a identidade digital do silício e o que o driver usa para decidir como conversar com ele. O `04:00.0` é o endereço no barramento PCI — irrelevante para o uso diário, mas útil para correlacionar com mensagens de erro.

Para ver também o dispositivo de áudio que o HDMI/DisplayPort da GPU expõe (o Deck roteia o som pelo mesmo controlador):

```terminal
$ lspci -nn | grep -iE 'vga|audio|multimedia'
04:00.0 VGA compatible controller [0300]: Advanced Micro Devices, Inc. [AMD/ATI] Van Gogh [1002:163f] (rev c1)
04:00.1 Audio device [0403]: Advanced Micro Devices, Inc. [AMD/ATI] Rembrandt Radeon High Definition Audio Controller [1002:1640]
```

## O driver amdgpu e seu firmware

A GPU do Deck é tocada pelo driver **`amdgpu`**, o driver open-source da AMD para suas GPUs modernas. No SteamOS ele já vem carregado, e você confirma isso inspecionando os módulos:

```terminal
$ lsmod | grep amdgpu
amdgpu               8175616  12
gpu_sched              65536  1 amdgpu
drm_buddy              28672  1 amdgpu
drm_display_helper    217088  1 amdgpu
ttm                   110592  1 amdgpu
amddrm_ttm_helper      20480  1 amdgpu
i2c_algo_bit           16384  1 amdgpu
```

O `amdgpu` usa vários módulos auxiliares: `gpu_sched` (escalonamento de trabalho na GPU), `ttm` (gerência de memória de vídeo), `drm_*` (infraestrutura de exibição). O número em `Used by` (12) indica quantas outras coisas dependem dele.

Além do driver, a GPU precisa de **firmware** — microcódigo binário assinado pela AMD que o driver carrega no chip na inicialização. Falta de firmware é uma causa clássica de tela preta ou GPU sem aceleração:

```terminal
$ sudo dmesg | grep -i amdgpu | head -6
[    1.823314] amdgpu 0000:04:00.0: amdgpu: Fetched VBIOS from VFCT
[    1.823320] amdgpu 0000:04:00.0: amdgpu: ATPX version 1, functions 0x00000000
[    1.973411] amdgpu 0000:04:00.0: amdgpu: VRAM: 512M 0x000000F400000000 - 0x000000F41FFFFFFF (512M used)
[    1.973413] amdgpu 0000:04:00.0: amdgpu: GART: 1024M 0x0000000000000000 - 0x000000003FFFFFFF
[    1.973422] amdgpu 0000:04:00.0: amdgpu: PSP is resuming...
[    1.973452] amdgpu 0000:04:00.0: amdgpu: ring gfx uses VM inv eng 0 on hub 0
```

A linha `VRAM: 512M` presta a uma leitura errada: o Deck não tem 512MB de memória de vídeo dedicada. Esse valor é só a reserva mínima relatada pelo firmware. A GPU na verdade usa a RAM unificada do sistema — semântica que se aprofunda na seção de memória.

## Confirmando a aceleração Vulkan e OpenGL

Dois comandos dizem, sem ambiguidade, se a GPU está com aceleração 3D funcionando. O primeiro fala com o Vulkan:

```terminal
$ vulkaninfo --summary
==========
VULKANINFO
==========

Vulkan Instance Version: 1.3.275

Instance Extensions: count = 22
...

GPU0:
	apiVersion         = 1.3.267 (4206603)
	driverVersion      = 24.1.0 (98516992)
	vendorID           = 0x1002
	deviceID           = 0x163f
	deviceType         = PHYSICAL_DEVICE_TYPE_INTEGRATED_GPU
	deviceName         = AMD Radeon Graphics (RADV VANGOGH)
	driverName         = radv
```

O `deviceName` "RADV VANGOGH" é a assinatura: `RADV` é o driver Vulkan open-source da Mesa para GPUs AMD, e `VANGOGH` é o nome de código do chip. O campo `INTEGRATED_GPU` confirma que a placa está dentro da APU, sem memória dedicada.

O segundo confere o OpenGL, o caminho usado por muitos jogos mais antigos e pelo desktop:

```terminal
$ glxinfo -B
name of display: :0
display: :0  screen: 0
direct rendering: Yes
Memory info (GL_ATI_meminfo):
    VBO free memory - total: 12925 MB, largest block: 12925 MB
    VBO free aux. memory - total: 3241 MB, largest block: 3241 MB
    Texture free memory - total: 12925 MB, largest block: 12925 MB
OpenGL vendor string: AMD
OpenGL renderer string: AMD Radeon Graphics (vangogh, LLVM 18.1.2, DRM 3.57)
OpenGL core profile version string: 4.6 (Core Profile) Mesa 24.1.0
OpenGL core profile shading language version string: 4.60
```

`direct rendering: Yes` é a linha que importa — significa que o OpenGL fala direto com a GPU via `amdgpu`, sem passar por software lento. O "total: 12925 MB" (≈13GB) mostra a GPU enxergando quase toda a RAM de 16GB como memória disponível.

:::dica
Se `glxinfo` ou `vulkaninfo` não forem encontrados, instale as ferramentas com:

```bash
sudo apt install mesa-utils vulkan-tools
```

Elas são pacotes pequenos e essenciais para diagnosticar GPU.
:::

## Encontrando (e entendendo) o gargalo

Num Deck, raramente a CPU limita primeiro; o orçamento é quase sempre da GPU e da memória de vídeo compartilhada. Sinais de que você está no limite da GPU: quedas de frame em cenas com muitos efeitos visuais, mesmo com os 4 núcleos ociosos. Sinais de limite na CPU: quedas em cenas cheias de agentes, física ou AIs, com a GPU folgada.

Você observa isso, de forma simples, deixando o `top` de olho enquanto joga: se os núcleos ficam perto de 100% e a GPU (visível por ferramentas como o overlay do próprio Steam) fica ociosa, o limite é CPU — e vice-versa.

:::atencao
O overlay de desempenho do Steam (nível 2 ou superior) mostra GPU e CPU separadamente. É a forma mais rápida de saber o gargalo num jogo específico sem instalar nada, e costuma ser mais confiável do que medições por software em jogos que usam o compositor do Gamescope.
:::

## Resumo

- A GPU integrada é RDNA 2 com 8 CUs (512 processadores de fluxo) e até 1.6 TFLOPs FP32.
- `lspci -nn | grep VGA` identifica a GPU como "Van Gogh" com id `1002:163f`.
- O driver é o `amdgpu`, carregado como módulo junto de `ttm`, `gpu_sched` e `drm_*`.
- A GPU usa a RAM do sistema (unificada), não VRAM dedicada — o "512M VRAM" do firmware é só reserva mínima.
- `vulkaninfo --summary` mostra o driver RADV/VANGOGH; `glxinfo -B` confirma `direct rendering: Yes`.
- A baixa resolução (1280x800) faz 1.6 TFLOPs renderizar bem mais do que numa tela grande.

## Exercícios

1. Rode `lspci -nn | grep VGA` e anote o id `vendor:device`. Confirme que começa com `1002` (AMD).
2. Execute `lsmod | grep amdgpu` e explique o papel de `ttm` e de `gpu_sched` na lista.
3. Rode `vulkaninfo --summary` e localize o `deviceName`. O que "RADV" e "VANGOGH" indicam?
4. Compare `glxinfo -B` com um jogo aberto e com ele fechado. O campo `Texture free memory` muda? Por quê?
5. **Desafio.** Correlacione `lspci` e `dmesg`: rode `sudo dmesg | grep amdgpu` e identifique a linha que informa a reserva de VRAM. Depois relacione essa linha com o que o `glxinfo -B` reporta como memória total disponível para texturas.
