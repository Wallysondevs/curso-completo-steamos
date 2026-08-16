O overlay nativo mora dentro do Modo Jogo, mas boa parte da vida do Steam Deck acontece fora dele — no Modo Desktop, testando jogos fora da Steam, rodando aplicações Vulkan, experimentando. É aí que o MangoHud entra: um overlay equivalente, open source, que você controla inteiramente pelo terminal. Esta seção fecha o capítulo ensinando a domá-lo.

:::objetivos
- Entender o que é o MangoHud e como ele se relaciona com o overlay nativo
- Ativar o MangoHud em um jogo ou aplicação Vulkan
- Configurar métricas específicas via `MANGOHUD_CONFIG`
- Usar o MangoHud também como linha de comando no Desktop
:::

## O MangoHud em uma frase

O MangoHud é um programa de código aberto que injeta um overlay de desempenho em aplicações gráficas que usam Vulkan ou OpenGL. Ele funciona em qualquer distribuição Linux — e, portanto, também no Modo Desktop do SteamOS. É a ponte que leva os conceitos deste capítulo (FPS, frametime, GPU, bateria) para fora do ambiente fechado do Modo Jogo.

A diferença essencial em relação ao overlay nativo: o MangoHud é controlado por variáveis de ambiente, não por um menu. Você liga e configura por comandos, o que o torna infinitamente mais flexível — e um pouco menos amigável.

```terminal
$ which mangohud
/usr/bin/mangohud
$ mangohud --version
mangohud version 0.7.2
```

O binário `/usr/bin/mangohud` é ao mesmo tempo o carregador (que você põe na frente de um comando) e a ferramenta que gerencia o overlay. Versões no SteamOS ficam em torno da linha 0.7.x.

## Ligando o overlay do jeito mais simples

A forma mais simples de usar o MangoHud é prefixar um comando com `mangohud`. Ele carrega suas bibliotecas antes do programa-alvo e injeta o overlay nele. O teste clássico é o `vkcube`, um cubo 3D giratório que acompanha os pacotes Vulkan.

```terminal
$ mangohud vkcube
```

Ao rodar isso, uma janela com um cubo colorido giratório abre, e no canto superior esquerdo aparecem as métricas padrão do MangoHud: FPS, frametime, uso de GPU e CPU, entre outras. É o equivalente, em uma linha, ao nível 2 do overlay do Modo Jogo.

```terminal
$ # Saida tipica do terminal ao rodar o vkcube com overlay:
$ mangohud vkcube
Selected GPU 0: AMD Custom GPU 0405 (RADV VANGOGH), type: IntegratedGpu
```

A primeira linha mostra qual GPU foi selecionada — no Deck, a `AMD Custom GPU 0405`, o mesmo dispositivo que vimos via `glxinfo -B` na seção 5. O driver `RADV` é a implementação Vulkan de código aberto usada por padrão.

## Escolhendo quais métricas mostrar

O padrão do MangoHud já mostra bastante, mas o poder real está no `MANGOHUD_CONFIG`. Essa variável de ambiente recebe uma lista separada por vírgulas com os nomes das métricas que você quer exibir, e o MangoHud desenha exatamente aquilo.

```terminal
$ MANGOHUD_CONFIG=help mangohud vkcube
cpu_temp,gpu_temp,core_load,fps,frametime,ram,vram
```

O valor especial `help` faz o MangoHud listar os parâmetros disponíveis — e há dezenas. Para o nosso caso, a lista que importa do capítulo é esta:

| Parâmetro | O que mostra |
|---|---|
| `fps` | FPS atual |
| `frametime` | Frametime em ms |
| `fps_metrics` | média, 1% low e 0.1% low |
| `cpu_temp` | temperatura da CPU |
| `gpu_temp` | temperatura da GPU |
| `core_load` | carga por núcleo da CPU |
| `ram` | uso de RAM do sistema |
| `vram` | uso de VRAM |

Veja a diferença entre `core_load` e o percentual agregado que o overlay nativo mostra: o `core_load` desenha uma barrinha por núcleo, expondo exatamente o gargalo de núcleo único que discutimos na seção 5.

```terminal
$ MANGOHUD_CONFIG="fps,frametime,cpu_temp,gpu_temp,core_load,ram,vram" mangohud vkcube
```

Esse comando mostra, tudo de uma vez: FPS, frametime, as duas temperaturas, a carga por núcleo, e o uso de RAM e VRAM. É o nível 4 do Modo Jogo reconstruído por linha de comando, com o bônus da carga por núcleo.

:::dica
A ordem dos parâmetros em `MANGOHUD_CONFIG` define a ordem em que aparecem na tela. Quer o FPS em cima de tudo? Coloque `fps` primeiro. Essa pequena liberdade de ordenação é uma das vantagens do MangoHud sobre o overlay fixo do Modo Jogo.
:::

## O MangoHud também roda sozinho

Além de prefixar comandos, o MangoHud pode ser usado diretamente sobre uma aplicação Steam, configurado como opção de inicialização. Mas há um uso menos óbvio e igualmente útil: rodá-lo "vazio", para confirmar que a instalação e a seleção de GPU funcionam antes de qualquer jogo.

```terminal
$ /usr/bin/mangohud --dlsym glxinfo -B | head -5
name of display: :0
display: :0  screen: 0
direct rendering: Yes
    Device: AMD Custom GPU 0405 (vangogh, LLVM 18.1.8, DRM 3.57, 6.8.0-valve3-1)
    Video memory: 512MB
```

Chamar `/usr/bin/mangohud` com o caminho completo nesse contexto serve para demonstrar que o binário é o mesmo invocado por `which`. Na prática cotidiana, `mangohud <comando>` já resolve o caminho, mas saber que o binário real vive em `/usr/bin/mangohud` ajuda a depurar instalações.

:::nota
O parâmetro que completa a trinca de fluidez que estudamos é o `fps_metrics`. Ele exibe, além do FPS atual, o **mínimo, o 1% low e o 0.1% low** — exatamente as métricas da seção 4, agora com nome explícito e sem ambiguidade de rótulo:

```terminal
$ MANGOHUD_CONFIG="fps,fps_metrics,frametime" mangohud vkcube
```
:::

## Quando usar cada overlay

Ao fim do capítulo, a decisão é limpa:

- **Modo Jogo, jogando pela Steam:** use o overlay nativo (botão `...`). É instantâneo, não exige configuração e tem os quatro níveis prontos.
- **Modo Desktop, testando jogos fora da Steam ou aplicações gráficas:** use o MangoHud, moldado pelo `MANGOHUD_CONFIG`.
- **Precisando de métricas que o overlay nativo não dá (carga por núcleo, 1% low explícito):** o MangoHud também resolve, mesmo dentro do Modo Jogo, via opções de inicialização.

```terminal
$ # Resumo de uso do MangoHud:
$ mangohud vkcube                                      # overlay padrao
$ MANGOHUD_CONFIG="fps,frametime" mangohud vkcube      # so 2 metricas
$ MANGOHUD_CONFIG=help mangohud --dlsym                # lista parametros
$ /usr/bin/mangohud --version                          # versao instalada
```

:::atencao
Se o overlay do MangoHud **não aparecer** num jogo, as causas mais comuns são: o jogo usa Direct3D sem camada Vulkan (MangoHud não injeta em D3D direto), a variável `MANGOHUD_CONFIG` está vazia de forma inesperada, ou o jogo foi lançado de um atalho que não passa pelo carregador. Teste primeiro com `mangohud vkcube` para isolar se o problema é o MangoHud ou o jogo específico.
:::

## Resumo

- O MangoHud é um overlay open source para Vulkan/OpenGL, usado no Modo Desktop do SteamOS.
- `mangohud <comando>` liga o overlay com métricas padrão; `mangohud vkcube` é o teste clássico.
- `MANGOHUD_CONFIG="a,b,c"` seleciona e ordena exatamente as métricas exibidas.
- `core_load` mostra carga por núcleo, e `fps_metrics`, o 1% low — recursos ausentes no overlay nativo.
- O binário vive em `/usr/bin/mangohud`; `MANGOHUD_CONFIG=help` lista todos os parâmetros.

## Exercícios

1. Rode `mangohud vkcube` e identifique as métricas padrão. Depois feche e rode `mangohud --version`.
2. Monte um overlay só de FPS e frametime com `MANGOHUD_CONFIG="fps,frametime"` e confirme a ordem na tela.
3. Exiba a trinca de fluidez completa usando `fps_metrics` e interprete média, 1% low e 0.1% low do cubo.
4. Mostre carga por núcleo com `core_load` e compare com o percentual agregado do overlay nativo.
5. **Desafio.** Reconcilie todo o capítulo: use `MANGOHUD_CONFIG="cpu_temp,gpu_temp,core_load,fps,frametime,ram,vram"` num jogo pesado, e escreva um parágrafo de diagnóstico completo — gargalo (GPU ou CPU), consistência (1% low/frametime), memória, temperatura e consumo — cobrindo os assuntos das seções 3 a 8.