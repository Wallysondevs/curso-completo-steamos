Se o Wine resolve o problema das chamadas de sistema, o DXVK resolve o problema do gráfico — e é ele o principal responsável pelo desempenho de jogos Windows no Steam Deck. Sem DXVK, o Proton usaria o wined3d, que traduz Direct3D para OpenGL, com resultados bem inferiores. Esta seção explica como a tradução DirectX→Vulkan funciona, por que Vulkan é a peça-chave e como inspecionar o DXVK em ação.

:::objetivos
- Entender como DXVK traduz Direct3D 9, 10 e 11 para Vulkan
- Identificar a versão do DXVK empacotada no Proton
- Ativar o HUD do DXVK para diagnóstico em tempo real
- Interpretar métricas como FPS, draw calls e tempo de GPU
- Configurar variáveis de ambiente para ajustar o comportamento do DXVK
:::

## Por que Vulkan e por que não OpenGL

Durante anos, a única opção para rodar Direct3D no Linux era o wined3d, o tradutor embutido no Wine que converte chamadas D3D para OpenGL. O problema é que OpenGL foi projetado numa época em que GPUs tinham pipeline fixo, e as extensões necessárias para jogos modernos são frágeis e inconsistentes entre fabricantes. O resultado: jogos rodando, mas com desempenho errático e bugs visuais.

Vulkan é uma API gráfica de baixo nível, lançada pelo Khronos Group em 2016, que expõe o hardware da GPU de forma explícita. Onde OpenGL esconde o gerenciamento de memória e a fila de comandos, Vulkan obriga o programador a controlar tudo — o que é trabalhoso para escrever código do zero, mas ideal para traduzir outra API. Direct3D 11 também é de baixo nível (ainda que menos que Vulkan), e o mapeamento entre os dois é natural.

O DXVK (DirectX-to-Vulkan) explora essa semelhança. Ele aparece como uma `d3d11.dll` e `dxgi.dll` falsas, que o jogo carrega achando que são as originais da Microsoft. Quando o jogo chama `DrawIndexed()`, o DXVK monta um comando equivalente em Vulkan e o despacha para a GPU. A mágica é que o driver Vulkan do Linux — fornecido pelo `radv` (Mesa/AMD) ou pelo `amdvlk` (AMDGPU-PRO) — é otimizado para o hardware, enquanto o driver OpenGL raramente recebe o mesmo cuidado.

## O DXVK dentro do Proton

O Proton empacota o DXVK como um conjunto de DLLs que substituem as bibliotecas Direct3D do Wine. Elas ficam dentro da árvore `dist/lib64/wine/dxvk/`:

```terminal
$ ls ~/.steam/steam/steamapps/common/Proton\ 9.0/dist/lib64/wine/dxvk/
d3d10.dll
d3d10_1.dll
d3d10core.dll
d3d11.dll
d3d9.dll
dxgi.dll
```

Cada `.dll` corresponde a uma versão do Direct3D: `d3d9.dll` para Direct3D 9, `d3d10*.dll` para Direct3D 10, `d3d11.dll` para Direct3D 11 — e `dxgi.dll` para a infraestrutura de troca de buffers (swap chain). Quando o Proton cria um prefixo novo, ele copia essas DLLs para dentro do prefixo, sobrepondo as versões originais do Wine.

A versão do DXVK pode ser encontrada nas notas de release do Proton ou inspecionando logs:

```terminal
$ WINEPREFIX=~/.steam/steam/steamapps/compatdata/1086940/pfx \
  ~/.steam/steam/steamapps/common/Proton\ 9.0/dist/bin/wine \
  ~/.steam/steam/steamapps/common/Proton\ 9.0/dist/lib64/wine/dxvk/setup_dxvk.sh install
DXVK 2.4.1 installed successfully
```

O `setup_dxvk.sh` é o script que o Proton usa internamente para instalar as DLLs num prefixo. Rodá-lo manualmente pode ser útil quando você está depurando um prefixo manual.

## O HUD do DXVK: métricas em tempo real

O DXVK oferece um HUD sobreposto que exibe FPS, tempos de GPU e GPU, uso de memória e estatísticas de pipeline — essencial para entender por que um jogo está lento. A ativação é feita por variável de ambiente:

```terminal
$ DXVK_HUD=1 WINEPREFIX=~/.steam/steam/steamapps/compatdata/1086940/pfx \
  ~/.steam/steam/steam/steamapps/common/Proton\ 9.0/proton run game.exe

[HUD exibido no canto superior esquerdo durante o jogo]
  GPU: 97%  |  MEM: 2.1 GiB  |  VRAM: 5.8 GiB
  FPS:  58  |  frame: 4.7 ms
  D3D11 draw calls: 1420  |  submissions: 8
```

O HUD mostra:

- **GPU**: percentual de uso da GPU. Abaixo de 90% com FPS baixo sugere gargalo de CPU.
- **MEM**: uso de RAM do sistema. Se chegar perto do limite físico (16 GB no Deck), o jogo vai engasgar.
- **VRAM**: memória da GPU. No Steam Deck, a VRAM é compartilhada com a RAM (UMA), então o número reflete alocação do driver.
- **FPS**: quadros por segundo. Abaixo de 30 indica problema de desempenho; travado em 30 ou 60 pode ser o Gamescope limitando (ver [seção sobre Gamescope](#/cap-031/sec-07)).
- **D3D11 draw calls**: quantas chamadas de desenho o jogo emitiu no último frame. Acima de 3000-4000, o jogo é pesado em draw calls, e o DXVK sente.

A variável `DXVK_HUD` aceita valores compostos para mostrar métricas específicas:

| Valor | O que mostra |
|---|---|
| `1` ou `full` | Todas as métricas padrão |
| `fps` | Apenas FPS |
| `frametimes` | Gráfico de tempo de frame |
| `memory` | Uso de memória e VRAM |
| `drawcalls` | Contagem de draw calls |
| `pipelines` | Compilação de pipeline |
| `version` | Versão do DXVK |
| `compiler` | Atividade do compilador de shaders |

```terminal
$ DXVK_HUD=fps,frametimes MANGOHUD=1 \
  ~/.steam/steam/steamapps/common/Proton\ 9.0/proton run game.exe
```

A combinação `DXVK_HUD` com `MANGOHUD=1` (MangoHud, uma sobreposição mais genérica) é comum durante depuração, mas os dois podem brigar se sobrepostos. Em geral, escolha um ou outro.

## Cache de estado e stutter de compilação

Quando um jogo Direct3D roda pela primeira vez, o DXVK precisa compilar os *pipelines* Vulkan correspondentes. Isso causa **stutter de compilação**: micro-travamentos que só acontecem na primeira vez que uma cena ou efeito é renderizado. O Steam Deck mitiga isso com o **Fossilize**, um sistema que grava o estado dos pipelines e os compartilha via Steam Cloud. Da segunda vez em diante, o cache já está compilado e o stutter desaparece.

O HUD pode confirmar se o stutter é de compilação:

```terminal
$ DXVK_HUD=pipelines,compiler \
  ~/.steam/steam/steamapps/common/Proton\ 9.0/proton run game.exe

[HUD mostra "pipelines: 0" quando compilação está em andamento]
```

Enquanto o número de pipelines sobe rapidamente e o FPS cai, você está testemunhando compilação ao vivo. Depois que estabiliza, o desempenho normaliza. Isso explica por que um jogo pode parecer engasgado nos primeiros minutos e liso depois: não é o Proton, é o shader cache esquentando.

:::dica
Se um jogo sofre de stutter mesmo depois de várias execuções, o cache de shaders pode estar corrompido ou o jogo não suporta Fossilize. Desative o cache de shaders do Steam nas propriedades do jogo e reative: o Steam baixa um cache novo da nuvem. Se persistir, o problema está em outro lugar — driver, CPU ou configuração do jogo.
:::

## Ajustes via variáveis de ambiente

O DXVK responde a várias variáveis que podem resolver problemas específicos:

```terminal
$ DXVK_ASYNC=1 DXVK_FRAME_RATE=60 DXVK_HUD=1 \
  WINEPREFIX=~/.steam/steam/steamapps/compatdata/1086940/pfx \
  ~/.steam/steam/steamapps/common/Proton\ 9.0/proton run game.exe
```

As variáveis mais relevantes:

| Variável | Efeito |
|---|---|
| `DXVK_HUD` | Ativa a sobreposição de diagnóstico |
| `DXVK_ASYNC=1` | Compilação assíncrona de pipelines (reduz stutter, pode causar artefatos visuais) |
| `DXVK_FRAME_RATE=N` | Limita FPS a N (útil para jogos que não têm limitador interno) |
| `DXVK_CONFIG="d3d9.maxAvailableMemory=2048"` | Limita a memória reportada para jogos D3D9 mal-comportados |
| `DXVK_STATE_CACHE_PATH` | Define onde o cache de estado é salvo |

Essas variáveis podem ser passadas nas opções de lançamento do Steam: `DXVK_HUD=1 %command%` no campo de opções de inicialização do jogo. O `%command%` é expandido pelo Steam para o comando real que inicia o jogo.

:::atencao
`DXVK_ASYNC=1` é uma faca de dois gumes. Ele reduz o stutter perceptível, mas ao custo de mostrar texturas ou objetos ainda não compilados (artefatos visuais breves). Use apenas em jogos que travam muito na primeira execução e depois desative para a experiência definitiva.
:::

## Resumo

- O DXVK traduz Direct3D 9/10/11 para Vulkan, substituindo o wined3d baseado em OpenGL do Wine vanilla.
- Vulkan é a chave do desempenho: API de baixo nível com drivers maduros no Linux (`radv`).
- O DXVK empacotado no Proton fica em `dist/lib64/wine/dxvk/` e é instalado no prefixo via `setup_dxvk.sh`.
- `DXVK_HUD=1` ativa sobreposição com FPS, draw calls, uso de GPU e compilação de pipelines.
- O stutter de primeira execução é normal e vem da compilação de pipelines; o Fossilize armazena cache para execuções futuras.
- Variáveis como `DXVK_ASYNC`, `DXVK_FRAME_RATE` e `DXVK_CONFIG` permitem ajustes finos por jogo.

## Exercícios

1. Ative `DXVK_HUD=full` nas opções de lançamento de um jogo Steam e anote FPS, uso de GPU e número de draw calls durante 5 minutos de jogo.
2. Rode o mesmo jogo com `DXVK_HUD=pipelines`. Anote quantos pipelines são compilados nos primeiros 30 segundos e relacione com o stutter que você percebe.
3. Compare o desempenho (FPS) de um jogo com e sem `DXVK_FRAME_RATE=30` nas opções de lançamento. O limite foi respeitado?
4. Liste as DLLs DXVK presentes em `dist/lib64/wine/dxvk/` de uma versão do Proton. Para cada DLL, identifique qual versão do Direct3D ela traduz.
5. **Desafio.** Mova o cache de shaders de um jogo específico (`~/.steam/steam/steamapps/shadercache/<appid>/`) para outro lugar e execute o jogo novamente. Descreva o que acontece com o desempenho nos primeiros minutos e explique por que o Fossilize é essencial no Steam Deck.