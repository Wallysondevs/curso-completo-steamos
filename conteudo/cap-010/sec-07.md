Gamescope e MangoHud são ferramentas independentes que se complementam como se tivessem sido projetadas juntas. O Gamescope controla a tela; o MangoHud mede o que está acontecendo dentro dela. Juntos, formam o par de ferramentas de diagnóstico mais importante do Steam Deck — e a configuração correta de ambos é o que permite transformar "o jogo está lento" em "a GPU está a 98% com thermal throttling a 85°C, preciso reduzir o TDP".

:::objetivos
- Entender como o MangoHud injeta o overlay de performance sobre o Gamescope
- Configurar o MangoHud com variáveis de ambiente e arquivo de configuração
- Interpretar as métricas do overlay (GPU%, CPU%, frametime, thermal throttle)
- Usar o MangoHud para logging contínuo de performance via `--log`
- Diagnosticar gargalos comuns com a dupla Gamescope + MangoHud
:::

## Como o MangoHud desenha sobre o Gamescope

MangoHud é uma camada Vulkan e OpenGL — um `VK_LAYER` que se insere entre a aplicação e o driver. Quando a aplicação chama `vkQueuePresentKHR()` para exibir um frame, a camada do MangoHud intercepta a chamada, desenha o overlay no framebuffer e só então passa o buffer adiante. Para o Gamescope, o overlay é parte do quadro — ele não sabe que o MangoHud está ali.

```terminal
$ MANGOHUD=1 gamescope -w 1280 -h 800 -W 1280 -H 800 -- vkcube
```

Com `MANGOHUD=1`, o `vkcube` carrega a camada MangoHud. O cubo gira e, no canto superior esquerdo, aparecem FPS, uso de GPU, uso de CPU e temperatura. O Gamescope recebe o quadro já com o overlay desenhado e o trata como qualquer outro quadro — compõe o Steam Overlay por cima e entrega para o DRM.

A mágica está no fato de que o MangoHud opera **antes** do Gamescope, não depois. Isso significa que o overlay do MangoHud também passa pelos filtros do Gamescope — FSR, NIS, tone mapping HDR. Na prática, isso faz com que o texto do overlay possa parecer levemente suavizado quando FSR está ativo, mas continua perfeitamente legível.

:::info
O MangoHud funciona como uma *Vulkan implicit layer*. O loader Vulkan lê a variável de ambiente `VK_INSTANCE_LAYERS` ou o registro de layers do sistema, carrega `libMangoHud.so` entre a aplicação e o driver, e a camada intercepta as funções de apresentação e submissão de comandos. Como o Gamescope é um compositor, não um driver, ele está "acima" do MangoHud na pilha.
:::

## Configurando o MangoHud além do padrão

A variável `MANGOHUD=1` ativa as métricas padrão (FPS, GPU%, CPU%, frametime). Mas o MangoHud tem dezenas de parâmetros configuráveis via `MANGOHUD_CONFIG`:

```terminal
$ MANGOHUD_CONFIG=fps,gpu_load,cpu_load,gpu_temp,cpu_temp,ram,vram,battery,throttling,frame_timing,position=top-left,font_scale=1.2 gamescope -w 1280 -h 800 -- vkcube
```

Este comando mostra FPS, carga de GPU e CPU, temperaturas, uso de RAM e VRAM, bateria restante, indicador de thermal throttling, gráfico de frametime, posiciona o overlay no canto superior esquerdo e aumenta a fonte em 20%. O resultado é um painel de diagnóstico completo que cabe numa única linha de comando.

Para métricas persistentes, é melhor usar um arquivo de configuração. O MangoHud procura `~/.config/MangoHud/MangoHud.conf` por padrão:

```ini
fps
gpu_load
cpu_load
gpu_temp
cpu_temp
ram
vram
battery
throttling
frame_timing
position=top-left
font_scale=1.2
round_corners=8.0
background_alpha=0.4
```

```terminal
$ mkdir -p ~/.config/MangoHud
$ cat > ~/.config/MangoHud/MangoHud.conf << 'EOF'
fps
gpu_load
cpu_load
gpu_temp
cpu_temp
ram
vram
battery
throttling
frame_timing
position=top-left
font_scale=1.2
round_corners=8.0
background_alpha=0.4
EOF
$ MANGOHUD=1 gamescope -w 1280 -h 800 -- vkcube
```

Com o arquivo salvo, `MANGOHUD=1` já carrega a configuração completa — sem precisar de `MANGOHUD_CONFIG` toda vez.

:::dica
Crie múltiplos arquivos de configuração para cenários diferentes e aponte para eles com `MANGOHUD_CONFIGFILE`. Por exemplo: `MANGOHUD_CONFIGFILE=~/.config/MangoHud/benchmark.conf` para medições e `MANGOHUD_CONFIGFILE=~/.config/MangoHud/minimal.conf` para jogar. Assim você alterna entre overlay completo e overlay minimalista sem reescrever nada.
:::

## Logging: quando o overlay não basta

Ver o overlay durante o jogo ajuda a diagnosticar problemas em tempo real, mas para análise posterior — ou para compartilhar dados em fóruns — o logging contínuo do MangoHud é mais útil:

```terminal
$ MANGOHUD_CONFIG=fps,gpu_load,cpu_load,gpu_temp,throttling,output_file=/tmp/bench.csv MANGOHUD=1 gamescope -w 1280 -h 800 -- vkmark --benchmark 60
$ head -10 /tmp/bench.csv
frame,fps,gpu_load,cpu_load,gpu_temp,throttling
0,0.00,12,8,42,0
1,58.21,35,22,44,0
2,59.87,48,28,46,0
3,60.00,52,31,48,0
4,59.95,55,33,50,0
5,60.00,56,34,52,0
6,59.98,57,35,53,0
7,59.99,57,35,54,0
8,60.00,57,35,55,0
```

Cada linha do CSV é um frame. O campo `throttling` merece atenção especial: `0` significa sem throttling, `1` indica throttling por temperatura, `2` por TDP, `3` por corrente. Se essa coluna mostrar algo diferente de zero por mais de alguns frames consecutivos, você tem um problema de resfriamento ou de limite de energia.

```terminal
$ cat /tmp/bench.csv | awk -F, 'NR>1 {sum+=$2; count++; if($2<min||min=="") min=$2} END {print "FPS médio:", sum/count, "| 1% low:", min}'
FPS médio: 59.87 | 1% low: 58.21
```

Com um pipeline simples de `awk`, você extrai FPS médio e 1% low do CSV, sem planilha eletrônica e sem software proprietário.

## Diagnóstico de gargalos comuns

A dupla Gamescope + MangoHud revela três categorias de gargalo que respondem de forma diferente às flags do Gamescope:

**GPU-bound**: GPU > 90%, CPU < 50%. A solução passa por reduzir a resolução interna (`-w`/`-h` menores) e ativar FSR. O framerate sobe proporcionalmente.

**CPU-bound**: GPU < 70%, CPU > 80% em pelo menos um núcleo. Reduzir a resolução **não ajuda** — o MangoHud mostra GPU com folga e framerate estagnado. Nesse caso, desative o FSR (ele só adiciona carga) e foque em reduzir draw calls ou simulação no jogo.

**Thermal throttling**: GPU e CPU com uso moderado, mas framerate caindo após alguns minutos. A coluna `throttling` no log do MangoHud mostra valores > 0. A solução não está no Gamescope, mas na refrigeração ou no TDP cap.

```terminal
$ MANGOHUD_CONFIG=fps,gpu_load,cpu_load,gpu_temp,cpu_temp,throttling,output_file=/tmp/diag.csv MANGOHUD=1 gamescope -w 1280 -h 800 -W 1280 -H 800 -- %command%
## Jogue por 10 minutos
$ cat /tmp/diag.csv | awk -F, 'NR>1 && $6>0 {print "Frame", $1, "throttling:", $6, "GPU temp:", $5}'
Frame 18453 throttling: 1 GPU temp: 85
Frame 18454 throttling: 1 GPU temp: 85
Frame 18455 throttling: 1 GPU temp: 86
```

Este pipeline revela exatamente quando o throttling começa (frame 18453, aos ~5 minutos de jogo) e a temperatura associada (85°C). Com essa informação, você pode ajustar a curva de ventoinha ou o limite de TDP nas configurações do Steam Deck.

:::atencao
O MangoHud adiciona uma sobrecarga pequena, mas mensurável: entre 0,1 e 0,5 ms de GPU time por frame. Para a grande maioria dos cenários, isso é irrelevante, mas se você estiver fazendo benchmarks de micro-otimização, meça com e sem MangoHud para isolar o custo da camada.
:::

## Resumo

- O MangoHud é uma camada Vulkan/OpenGL que desenha o overlay **antes** do Gamescope compor o quadro final.
- `MANGOHUD=1` ativa as métricas padrão; `MANGOHUD_CONFIG` personaliza posição, métricas e estilo.
- Arquivos de configuração em `~/.config/MangoHud/` permitem setups persistentes e múltiplos perfis.
- O logging via `output_file` gera CSV quadro a quadro, analisável com ferramentas simples como `awk`.
- A dupla Gamescope + MangoHud classifica gargalos em GPU-bound, CPU-bound ou thermal throttling, cada um com estratégia de mitigação diferente.

## Exercícios

1. Execute `MANGOHUD=1 gamescope -n -w 1280 -h 800 -- vkcube` e verifique se o overlay aparece. Depois desabilite com `MANGOHUD=0` e confirme que some.
2. Crie dois arquivos de configuração: `minimal.conf` (apenas FPS) e `full.conf` (todas as métricas). Altere entre eles durante a execução de `vkmark` usando `MANGOHUD_CONFIGFILE`.
3. Gere um log CSV de 5 minutos de `vkmark` com `output_file=/tmp/vkmark.csv`. Use `awk` para calcular FPS médio, FPS mínimo (1% low) e temperatura média da GPU.
4. Com `MANGOHUD_CONFIG=throttling`, jogue um título pesado por 15 minutos. O indicador de throttling mostrou valores diferentes de zero? Em caso positivo, qual foi a temperatura da GPU no momento?
5. **Desafio.** Escreva um script que execute um benchmark com MangoHud em três resoluções internas diferentes (800p, 600p, 400p) dentro do Gamescope, colete os CSVs e produza um gráfico de barras em ASCII mostrando FPS médio vs. resolução. Use apenas `bash`, `awk` e `gnuplot` (ou `graph`).