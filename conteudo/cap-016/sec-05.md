O limitador de FPS do SteamOS é a ferramenta mais imediata para domar o desempenho do Deck: um seletor no menu de desempenho que trava os quadros em um teto e, com ele, ajusta o refresh rate do painel. Entender o que esse seletor faz por baixo — e como replicá-lo pelo terminal — transforma o ajuste de "palpite" em decisão informada.

:::objetivos
- Usar o limitador de FPS do Modo Jogo de forma consciente
- Entender a relação entre o limite de FPS e o refresh rate ajustado
- Conferir o clock da GPU e como o limite influencia o consumo
- Replicar o limite pelo terminal com mangohud
:::

## O seletor do Modo Jogo

No Modo Jogo, o botão `...` abre o painel de desempenho, e a seção de "Limite de quadros" (ou *Frame Rate Limit*) oferece alvos como 90, 60, 45, 40 e 30 FPS. Ao escolher um, o SteamOS faz duas coisas em sequência: ajusta o refresh rate do painel quando necessário e injeta um teto de renderização no jogo.

A mágica está nesse casamento automático. Escolher 40 FPS num Deck OLED, por exemplo, também baixa o painel para 40 Hz, entregando o frame pacing perfeito discutido nas seções anteriores, sem que você precise mexer em `xrandr` manualmente.

:::info
O conjunto exato de alvos varia com o modelo: o Steam Deck LCD (painel 60 Hz) oferece 60, 30, 20; o OLED (90 Hz) adiciona 90, 45, 40. Os alvos são sempre divisores ou taxas suportadas pelo painel de cada aparelho.
:::

## O que o limite muda no hardware

Travar o FPS não é só um truque de software: ele tem efeito direto no consumo e no calor, porque a GPU deixa de trabalhar a 100% quando não precisa. O clock da GPU, no Steam Deck, é gerenciado dinamicamente, e o kernel expõe o estado atual em arquivos do DRM.

```terminal
$ cat /sys/class/drm/card0/device/pp_dpm_sclk
0: 200Mhz
1: 300Mhz
2: 400Mhz
3: 600Mhz
4: 800Mhz
5: 1200Mhz
6: 1400Mhz
7: 1600Mhz *
```

O arquivo `pp_dpm_sclk` lista os degraus de clock da GPU (sclk, o clock de shader), com o ativo marcado por `*`. Neste estado, a GPU está no degrau mais alto, 1600 MHz — típico de jogo rodando sem limite, espremendo cada quadro. Travar o FPS num alvo confortável tende a deixar o clock acomodado num degrau intermediário, gastando menos e esquentando menos.

:::dica
Observe o `pp_dpm_sclk` antes e depois de ativar o limite de FPS num jogo. A queda no degrau ativo é a prova visual de que o limite "liberou" a GPU, o que se traduz em menos ventoinha e mais bateria.
:::

## Replicando pelo terminal com mangohud

O limitador do Modo Jogo é conveniente, mas o terminal te dá o mesmo controle — e mais fino — via mangohud. O mangohud é o overlay que o SteamOS usa, e sua variável `MANGOHUD_CONFIG` aceita `fps_limit` como um dos parâmetros.

```terminal
$ MANGOHUD_CONFIG=fps_limit=40 mangohud %command%
```

Lançado assim, o jogo abre com o overlay e o teto de 40 FPS aplicado. A vantagem sobre o menu é que você pode fixar qualquer valor, incluindo os que o Modo Jogo não expõe, e combinar com outros parâmetros (frame timing, percentis, etc.).

Para quem prefere não depender da variável de ambiente a cada lançamento, o mangohud aceita um arquivo de configuração. No SteamOS, o arquivo padrão fica em `~/.config/MangoHud/MangoHud.conf`, e um limite pode ser fixado ali:

```conf
fps_limit=40
frame_timing=1
```

## Onde o limitador entra no pipeline

O limite de FPS age na **apresentação**, não na simulação. O jogo continua simulando a física e o input na taxa dele; o compositor (gamescope) é que segura a troca de buffer para não exceder o teto. Isso tem duas consequências. Primeira: limitar FPS **não** reduz a latência do input diretamente — a latência vem de saturar a GPU, e o limite ajuda a evitar essa saturação. Segunda: um limite abaixo da capacidade da GPU reduz a latência média, porque a fila de quadros em espera diminui.

É por isso que o ajuste favorito de quem joga competitivo no Deck é travar ligeiramente **abaixo** do máximo sustentável: a GPU nunca enche a fila, e o tempo entre apertar e ver a ação cai.

Para ver a diferença de latência na prática, o mangohud pode exibir um gráfico de frametimes junto do limite, permitindo comparar antes e depois:

```terminal
$ MANGOHUD_CONFIG=fps_limit=40,frame_timing=1,output_file=/tmp/mangohud.log mangohud %command%
$ tail -5 /tmp/mangohud.log
[15:30:01] fps: 40.0 frametime: 25.0ms gpu: 45%
[15:30:02] fps: 40.0 frametime: 25.0ms gpu: 45%
[15:30:03] fps: 40.0 frametime: 24.9ms gpu: 44%
```

Com `output_file`, o mangohud registra cada leitura em disco para análise posterior. A GPU a 45% confirma que o limite liberou a unidade — sem ele, estaria a 99% e cada novo quadro entraria numa fila de espera maior.

## Resumo

- O Modo Jogo expõe limites de FPS que, junto, ajustam o refresh rate do painel.
- Os alvos variam por modelo: LCD oferece 60/30/20; OLED adiciona 90/45/40.
- Limitar FPS derruba o clock da GPU, visível em `pp_dpm_sclk`, reduzindo consumo e calor.
- `MANGOHUD_CONFIG=fps_limit=40 mangohud %command%` replica o limite pelo terminal.
- O limite age na apresentação (gamescope), não na simulação do jogo.
- Travar abaixo do máximo sustentável reduz a latência ao evitar a fila de quadros cheia.

## Exercícios

1. Num jogo pesado, anote o FPS médio sem limite. Depois ative o limite de 40 no Modo Jogo e compare fluidez e consumo de bateria percebido.
2. Com o jogo aberto sem limite, rode `cat /sys/class/drm/card0/device/pp_dpm_sclk`. Depois ative o limite e repita: qual degrau de clock ficou ativo em cada caso?
3. Lance um jogo com `MANGOHUD_CONFIG=fps_limit=40 mangohud %command%` e verifique, no overlay, se o teto foi respeitado.
4. Crie (ou edite) `~/.config/MangoHud/MangoHud.conf` com `fps_limit=40` e confirme que vale para os lançamentos seguintes.
5. **Desafio.** Determine empiricamente o FPS máximo sustentável de um jogo (aumente o teto até o frame time deixar de ser constante) e então configure o limite 10% abaixo desse valor. Relacione o resultado com latência de entrada e fila de quadros.
