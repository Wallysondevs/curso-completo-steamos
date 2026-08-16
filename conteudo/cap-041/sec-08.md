Otimizar às cegas não leva a lugar nenhum. Antes de mexer em qualquer parâmetro de desempenho, você precisa enxergar o que o jogo está fazendo: FPS, tempo de quadro, uso de CPU e GPU, temperatura e consumo. O MangoHud é um overlay de código aberto que sobrepõe essas métricas diretamente na tela do jogo, e no Steam Deck ele é disparado pelo comando `mangohud` antes do `%command%`.

:::objetivos
- Entender o que é MangoHud e o que ele monitora
- Ativar o overlay com `mangohud %command%`
- Configurar quais métricas aparecem na tela
- Medir FPS, 1% baixo e uso de CPU/GPU durante o jogo
- Usar o MangoHud para guiar decisões de otimização
:::

## O que é e por que você precisa disso

MangoHud é um overlay OpenGL/Vulkan que se injeta no processo do jogo e desenha um painel de telemetria por cima da renderização. Ele lê os contadores de FPS, uso de CPU, frequência e temperatura da GPU, uso de memória e consumo de energia — tudo em tempo real, sem sair do jogo.

Para o Steam Deck, é a ferramenta número um de diagnóstico de desempenho, porque dá números concretos em vez de sensações. "Parece travado" vira "o 1% baixo caiu para 18 ms".

```text
mangohud %command%
```

Diferente das variáveis de ambiente, `mangohud` é um **comando** que envolve o jogo: ele injeta o MangoHud no processo e depois o executa. Por isso fica à esquerda do `%command%`, no lugar das variáveis.

:::nota
No Steam Deck, o MangoHud costuma já vir instalado junto com a imagem do sistema. Se não estiver, pode ser instalado via Flatpak ou pelo gerenciador de pacotes do desktop. O comando é o mesmo: `mangohud`.
:::

## Ligando e lendo o painel

Ao rodar com `mangohud %command%`, o canto superior esquerdo (na configuração padrão) passa a exibir o painel de métricas. Ele mostra, na ordem típica:

| Métrica | O que significa |
|---|---|
| FPS | Quadros por segundo atuais |
| frametime | Tempo médio de cada quadro em milissegundos |
| 1% low / 0.1% low | Piores quadros (1% e 0.1%), a medida de engasgo |
| CPU | Uso médio dos núcleos |
| GPU | Uso da GPU, frequência e temperatura |
| RAM/VRAM | Memória de sistema e de vídeo usadas |
| Watt | Consumo de energia do APU |

O valor mais revelador para engasgos é o **1% low**: se ele despenca dos 60 FPS do máximo, você tem *stutter*, mesmo que o FPS médio esteja bonito.

```terminal
$ MANGOHUD=1 %command%
```

Esta é uma forma alternativa de ativar, via variável de ambiente `MANGOHUD=1`, que tem o mesmo efeito que o comando `mangohud` em muitos setups. As duas são equivalentes na prática para a Steam, mas `mangohud %command%` é a mais óbvia de ler.

## Configurando o painel

O MangoHud é configurável via arquivo. O arquivo global fica em `/usr/share/doc/mangohud/` e a cópia do usuário em `~/.config/MangoHud/MangoHud.conf`:

```ini
background_alpha=0.4
fps
frametime
cpu_stats
gpu_stats
ram
vram
```

Cada palavra-chave liga um módulo do painel. Este exemplo mostra FPS, tempo de quadro, estatísticas de CPU e GPU e uso de memória. Você pode adicionar ou remover linhas para deixar o painel mais enxuto, ou ajustar a posição e a transparência.

```terminal
$ ls ~/.config/MangoHud/ 2>/dev/null
MangoHud.conf
```

Se o diretório ainda não existir, crie e escreva o arquivo. O MangoHud lê a configuração do usuário em preferência ao global, então você personaliza sem mexer nos arquivos do sistema.

:::dica
Para medir desempenho de forma limpa, deixe o painel com o mínimo: `fps`, `frametime` e `gpu_stats` bastam na maioria dos casos. Muita informação na tela atrapalha a leitura durante a partida e ainda consome um pouco de CPU para desenhar o próprio overlay.
:::

## Do número à decisão

O MangoHud só tem valor se você transformar os números em ação. O fluxo de decisão é:

- **GPU saturada (perto de 99%) e FPS baixo** → reduza resolução ou ative FSR ([ver seção sobre FSR](#/cap-041/sec-06)), ou baixe qualidade gráfica.
- **CPU saturada e GPU ociosa** → teste `WINEFSYNC` ([ver seção sobre Fsync](#/cap-041/sec-07)) ou feche processos de fundo.
- **FPS alto mas 1% low despencando** → problema de *stutter* de shader; investigue cache ([ver seção DXVK_ASYNC](#/cap-041/sec-03)).
- **Temperatura alta e frequência caindo** → limitação térmica; mexa no TDP ou na ventilação.

```terminal
$ mangohud %command%
## jogue por 10 minutos prestando atenção na GPU e no 1% low
```

Durante os testes, deixe a sessão rodar alguns minutos antes de registrar números, porque os primeiros segundos incluem carregamento e compilação de shaders que distorcem a média.

:::atencao
O MangoHud **não** deve ficar ligado em partidas competitivas onde ele possa distrair ou ser banido pelo anti-cheat. Alguns jogos com anti-cheat bloqueiam overlays que se injetam no processo. Use-o para medir e desligue quando não precisar mais.
:::

## Resumo

- MangoHud é um overlay de telemetria que mede FPS, frametime, CPU, GPU, memória e consumo em tempo real.
- Ativa com `mangohud %command%` ou `MANGOHUD=1`.
- O **1% low** é a métrica-chave para detectar engasgos, mais que o FPS médio.
- O painel é configurável em `~/.config/MangoHud/MangoHud.conf`.
- Os números devem guiar a decisão: GPU saturada → FSR; CPU saturada → Fsync; stutter → cache de shaders.

## Exercícios

1. Rode um jogo com `mangohud %command%` e identifique cada métrica do painel.
2. Anote, durante 5 minutos de jogo, FPS médio, 1% low, uso de GPU e temperatura.
3. Crie um `~/.config/MangoHud/MangoHud.conf` enxuto com apenas `fps`, `frametime` e `gpu_stats`.
4. Determine, para um jogo à sua escolha, se ele é CPU-bound ou GPU-bound usando os contadores.
5. **Desafio.** Combine o MangoHud com uma das otimizações anteriores (FSR, Fsync ou cache) e apresente, com os números, se a mudança ajudou o seu caso específico.