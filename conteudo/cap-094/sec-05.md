MangoHud é o overlay de desempenho que todo jogador do Steam Deck conhece: aquele canto superior esquerdo com FPS, temperatura, consumo de bateria e uso de GPU que aparece com um toque no botão `...` e a ativação da sobreposição de desempenho. Mas o que parece um simples contador é na verdade uma ferramenta de diagnóstico gráfica que expõe métricas do Vulkan, OpenGL e do sistema — e pode ser configurada em detalhe quando o modo Desktop está ativo.

:::objetivos
- Entender o que o MangoHud mede e como se integra ao Vulkan/OpenGL
- Ativar, desativar e configurar o overlay no modo de jogo
- Personalizar métricas exibidas via arquivo de configuração
- Usar o MangoHud como ferramenta de diagnóstico de desempenho
:::

## O que é o MangoHud

MangoHud é uma camada Vulkan — um módulo que se insere entre a aplicação gráfica e o driver, interceptando chamadas para medir o que está acontecendo. Ele funciona como overlay dentro do jogo, mas não é parte do jogo: é uma biblioteca carregada dinamicamente (`libMangoHud.so`) que o SteamOS ativa com uma variável de ambiente.

```terminal
$ ls /usr/share/vulkan/implicit_layer.d/MangoHud.json
/usr/share/vulkan/implicit_layer.d/MangoHud.json
```

O arquivo JSON em `implicit_layer.d` registra o MangoHud como camada Vulkan implícita — ou seja, qualquer aplicação Vulkan pode tê-lo ativado sem que o jogo saiba. No modo de jogo do Steam Deck, a Valve integrou essa ativação ao QAM (Quick Access Menu), tornando o liga/desliga trivial.

## Ativando o overlay de desempenho

No modo de jogo, você pressiona o botão `...` (três pontinhos), navega até a aba de desempenho (ícone de velocímetro) e ativa o controle deslizante "Overlay de desempenho". Quatro níveis estão disponíveis: desligado, básico (FPS), intermediário (FPS + tempo de frame + bateria) e avançado (todas as métricas juntas: GPU, CPU, temperatura, ventoinha, consumo, RAM, VRAM).

No modo Desktop, para qualquer jogo ou aplicação, você faz:

```terminal
$ mangohud %command%
```

Prefixar o comando com `mangohud` carrega a camada Vulkan. Para jogos Steam, você coloca nas opções de inicialização:

```
mangohud %command%
```

Isso funciona para jogos nativos e Proton. O MangoHud se liga automaticamente ao Vulkan ou ao OpenGL conforme a aplicação pede.

## O arquivo de configuração

O MangoHud lê um arquivo de configuração em busca de quais métricas mostrar, como formatá-las, e onde posicionar o overlay. O arquivo padrão fica em `~/.config/MangoHud/MangoHud.conf` — se não existir, o MangoHud usa um conjunto interno de padrões.

```terminal
$ mkdir -p ~/.config/MangoHud
$ nano ~/.config/MangoHud/MangoHud.conf
```

Um arquivo mínimo para replicar o overlay avançado do Steam Deck seria:

```ini
fps
frame_timing
cpu_stats
gpu_stats
ram
vram
temperature
battery
engine_version
```

Cada linha é uma métrica. Linhas começando com `#` são comentários e desativam a métrica. Você pode ter arquivos de configuração por jogo, nomeados como `MangoHud-<appid>.conf` no mesmo diretório, que sobrepõem o arquivo geral.

## Todas as métricas disponíveis

O MangoHud expõe dezenas de métricas, organizadas em categorias. As mais úteis para diagnóstico no Steam Deck:

| Métrica | O que mostra | Diagnóstico |
|---|---|---|
| `fps` | quadros por segundo atual | fluidez, gargalos |
| `frame_timing` | gráfico de tempo de frame | microstuttering |
| `cpu_stats` | uso, frequência e núcleos ativos da CPU | limite de CPU |
| `gpu_stats` | uso, frequência e temperatura da GPU | limite de GPU, térmico |
| `ram` | uso de RAM do sistema | falta de memória |
| `vram` | uso de VRAM (memória de vídeo) | texturas estourando |
| `battery` | carga, consumo em watts | vida de bateria |
| `temperature` | temperaturas CPU e GPU | thermal throttling |
| `io_stats` | leitura/escrita de disco | streaming, carregamento |

```ini
# Exemplo de config com diagnóstico completo
fps
frametime
cpu_stats
cpu_temp
gpu_stats
gpu_temp
battery
ram
vram
io_stats
engine_version
```

Com tudo ligado, o overlay fica denso — mas na hora de diagnosticar "o jogo está lento por quê?", ter CPU, GPU e temperatura lado a lado te diz em segundos se o gargalo é processamento (CPU 100%), gráfico (GPU 100%) ou térmico (temperatura > 90 °C e frequências caindo).

## Posição, tamanho e cores

O MangoHud aceita parâmetros de apresentação no arquivo de configuração. A posição padrão (`top_left`) pode ser mudada, o tamanho da fonte ajustado, e cores de fundo e texto personalizadas para legibilidade.

```ini
position=top_left
font_size=24
background_alpha=0.4
text_color=FFFFFF
gpu_color=FF8800
cpu_color=00FF88
```

Num deck com a tela de 800p, `font_size=24` é legível; no dock com um monitor 1080p ou 4K, talvez você queira `font_size=32` ou maior. Ajustar cores e fundo ajuda a ler o overlay sobre cenários claros ou escuros.

:::dica
Use `background_alpha=0.6` ou superior se estiver capturando tela para compartilhar — o texto fica legível independentemente do fundo do jogo, o que importa quando você manda um print para a comunidade.
:::

## MangoHud como ferramenta de diagnóstico

Quando um jogo "engasga", o overlay responde duas perguntas em tempo real: o que está limitando (CPU, GPU ou ambos) e se há componente térmico envolvido. Esse diagnóstico instantâneo direciona o que você vai ajustar — baixar resolução (se GPU), reduzir draw distance (se CPU), limpar ventoinhas (se térmico).

```terminal
$ mangohud --dlsym glxgears
```

Um teste rápido com `glxgears` mostra o overlay sobre uma aplicação OpenGL simples, confirmando que o MangoHud está funcionando antes de aplicá-lo a um jogo pesado.

Se a métrica de `cpu_stats` mostra frequências muito abaixo do esperado (por exemplo, 1.2 GHz quando a APU Van Gogh suporta até 3.5 GHz), e ao mesmo tempo a temperatura está acima de 95 °C, você tem uma confirmação visual de **thermal throttling** — o sistema está deliberadamente reduzindo a velocidade para não ferver. A solução não é mexer em driver, é limpar ventoinha ou verificar pasta térmica.

## Resumo

- MangoHud é uma camada Vulkan/OpenGL que sobrepõe métricas de desempenho em qualquer jogo.
- No modo de jogo, o overlay é ativado pelo QAM (botão `...` → aba de desempenho) com quatro níveis.
- No modo Desktop, `mangohud %command%` ativa o overlay para qualquer aplicação gráfica.
- O arquivo `~/.config/MangoHud/MangoHud.conf` controla quais métricas, posição e cores.
- CPU, GPU e temperatura lado a lado respondem se o gargalo é processamento, gráfico ou térmico.

## Exercícios

1. No modo Desktop, rode `mangohud glxgears` e observe o overlay básico; confirme que FPS e GPU aparecem.
2. Crie um `~/.config/MangoHud/MangoHud.conf` com ao menos 6 métricas (fps, cpu_stats, gpu_stats, ram, battery, temperature).
3. Ative o overlay avançado no modo de jogo (QAM) para um jogo, e registre: a) FPS médio, b) uso de CPU, c) uso de GPU, d) temperatura.
4. Mude a posição do overlay para `bottom_right` e fonte para `font_size=32`; teste e depois reverta.
5. **Desafio.** Com o overlay avançado ligado, rode um jogo até a temperatura da GPU estabilizar. Anote FPS e temperatura. Depois, use `ryzenadj` (seção futura) ou abaixe o TDP no QAM e meça de novo. Compare e relate se o limite foi CPU, GPU ou térmico.