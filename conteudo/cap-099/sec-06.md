Medir GPU no Linux não é trivial como no Windows, onde bastam GPU-Z, Afterburner e 3DMark. No Steam Deck o caminho é mais interessante: o MangoHud sobrepõe métricas em tempo real sobre o jogo, bibliotecas Vulkan expõem contadores de desempenho e ferramentas de linha de comando permitem benchmark sem interface gráfica. Esta seção cobre o essencial para medir o que a APU entrega de fato.

:::objetivos
- Configurar e interpretar o overlay do MangoHud
- Medir frametime, FPS e percentis com ferramentas embutidas
- Usar `vulkaninfo` e `vkcube` para benchmark sintético de GPU
- Entender a diferença entre GPU-bound e CPU-bound e como identificá-la
- Registrar e comparar sessões de benchmark de jogos
:::

## MangoHud: o painel do piloto

O MangoHud é um overlay Vulkan/OpenGL que exibe FPS, frametime, temperatura, uso de CPU/GPU e dezenas de outras métricas diretamente sobre o jogo. No Steam Deck ele vem pré-instalado e é ativado pelo menu de desempenho do modo Gaming, mas no modo Desktop você controla diretamente.

```terminal
$ mangohud glxgears
## glxgears abre com overlay mostrando FPS, GPU%, frametime graph
$ mangohud --config /tmp/mango.conf vkcube
```

Sem precisar abrir jogo nenhum, você pode testar o overlay com `vkcube` (demo Vulkan). O MangoHud lê um arquivo de configuração (`~/.config/MangoHud/MangoHud.conf`) onde você escolhe quais métricas aparecem.

```terminal
$ cat ~/.config/MangoHud/MangoHud.conf
fps
frametime
gpu_stats
cpu_stats
core_load
ram
vram
fps_limit=60
```

A configuração mínima para benchmark exibe FPS, frametime, uso de GPU e uso de CPU. Para registrar em arquivo (em vez de só olhar o overlay), o MangoHud escreve um log com todas as métricas quadro a quadro:

```terminal
$ MANGOHUD_CONFIG=output_file=/tmp/bench.csv,log_interval=100 mangohud %command%
$ head /tmp/bench.csv
frametime,gpu_temp,cpu_temp,gpu_load,cpu_load,ram_used,vram_used,fps
8.234,67.0,72.5,98,45,4.2,1.8,60
8.198,67.0,72.6,97,46,4.2,1.8,60
16.451,67.5,73.0,99,48,4.3,1.9,59
```

Cada linha é um frame (ou uma amostra a cada 100 frames, dependendo do `log_interval`). A primeira coluna é o frametime em milissegundos: o tempo que a GPU levou para renderizar aquele quadro. Olhar só o FPS médio esconde o que realmente incomoda — frametimes esporádicos de 33 ms (30 FPS) no meio de uma sequência a 8 ms (120 FPS) são percebidos como gagueira mesmo que a média feche em 105 FPS.

:::dica
Para benchmark de jogo, é melhor fazer um *percurso controlado*: uma volta numa pista de corrida, uma área específica com movimentos predefinidos, um replay. Assim você compara frametimes da mesma cena antes e depois da sua mudança. Ficar andando livremente e comparar médias de sessões diferentes é receita para conclusão falsa.
:::

## Identificando GPU-bound vs CPU-bound

Num benchmark de jogo, saber quem está limitando o FPS é tão importante quanto o número. Com GPU a 99% e CPU a 45%, o jogo é **GPU-bound**: aumentar a resolução piora o FPS, mas trocar a CPU não ajudaria. Com CPU a 90% (especialmente uma thread a ~100%) e GPU a 60%, o jogo é **CPU-bound**: baixar a resolução não melhora o FPS, mas fechar processos de fundo pode.

O MangoHud mostra isso em tempo real: as barras de `GPU` e `CPU` indicam o uso percentual. Se a GPU não chega perto de 99%, há um gargalo antes dela — pode ser CPU, memória, ou até sincronização vertical (VSync).

```terminal
$ mangohud --cfgfile /tmp/bench.conf vkcube --present_mode 0
```

Rodar `vkcube` sem VSync permite ver a GPU atingir 99% (se for o caso). Com VSync ativo, o FPS fica travado no refresh rate e a GPU pode reportar 45% de uso — você não está medindo capacidade, está medindo sincronização.

## Benchmark sintético: vulkaninfo e vkcube

Para um benchmark de GPU que não depende de jogo, o ecossistema Vulkan fornece ferramentas que já vêm no SteamOS. O `vulkaninfo` lista as capacidades da GPU e, com a flag `--show-formats`, expõe centenas de detalhes. Já o `vkcube` renderiza um cubo giratório e reporta FPS na saída do terminal.

```terminal
$ vkcube
Selected GPU 0: AMD Radeon Graphics (RADV VANGOGH), type: IntegratedGpu
[1]  FPS: 2943  Frame time: 0.339 ms
[2]  FPS: 4056  Frame time: 0.246 ms
[3]  FPS: 4384  Frame time: 0.228 ms
[4]  FPS: 4427  Frame time: 0.226 ms
```

O `vkcube` é sintético demais para representar um jogo real (o cubo é trivial para a GPU), mas é útil para detectar regressões: se o FPS do `vkcube` caiu pela metade depois de uma atualização de driver, algo está errado.

Para um benchmark Vulkan mais substancial, o `vkmark` (se instalado) oferece cenas variadas:

```terminal
$ vkmark --fullscreen
========================================
    vkmark 2022.01
========================================
[vertex] device-local:                                    FPS: 1641
[texture] texture anisotropy=1:                           FPS: 1893
[effect2D] blur:                                         - FPS: 703
...
                                   vkmark Score: 1247
========================================
```

A pontuação final agrega várias cenas e é comparável entre execuções. Anote o *score* e as condições do teste.

:::info
No Steam Deck, o driver Vulkan usado é o RADV (*Radeon Vulkan*), parte do projeto Mesa. A versão do Mesa é crítica para desempenho. Você pode verificá-la com `vulkaninfo | grep driverInfo` ou `glxinfo | grep "OpenGL version"`. Atualizações do Mesa frequentemente trazem ganhos de 5 a 15% em jogos sem mudar o hardware.
:::

## Resumo

- MangoHud sobrepõe FPS, frametime e métricas de hardware durante jogos e pode exportar CSV quadro a quadro.
- Frametime importa mais que FPS médio: latências esporádicas causam *stutter* que a média esconde.
- GPU-bound (GPU a 99%) vs CPU-bound (thread principal a ~100%) define qual componente limitante otimizar.
- `vkcube` e `vkmark` são benchmarks sintéticos Vulkan para detectar regressões de driver.
- Benchmark com percurso controlado é confiável; benchmark com jogo livre não é.
- O driver RADV/Mesa é central para desempenho gráfico no Steam Deck.

## Exercícios

1. Ative o MangoHud com `mangohud vkcube` e observe as barras de GPU e CPU. A qual percentual a GPU chega? E a CPU?
2. Configure o MangoHud para exportar CSV com `output_file` e rode `vkcube` por 15 segundos. Calcule a média e o percentil 99 do frametime a partir do CSV.
3. Use `vulkaninfo | grep -i 'driver\|deviceName\|apiVersion'` e documente o driver Vulkan, o nome do dispositivo e a versão da API.
4. Rode o mesmo jogo (ou `vkcube`) com e sem o carregador conectado. O FPS muda? Por que o modo de energia da bateria afeta a GPU?
5. **Desafio.** Grave uma sessão de jogo com MangoHud logando CSV durante um percurso controlado. Depois troque uma configuração gráfica (ex.: qualidade de textura de Alta para Média) e repita o mesmo percurso. Compare as distribuições de frametime com um histograma simples (pode usar `sort`, `uniq -c` e `head`). A mudança afetou mais a média ou os p99?