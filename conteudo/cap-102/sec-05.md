Quando você aperta o botão Steam e o jogo aparece na tela do Deck, quem desenhou aquela imagem foi o **Gamescope** — o compositor que a Valve escreveu especificamente para um aparelho de jogos. Ele é muito mais do que um "display": controla resolução, upscaling, HDR e ritmo de quadros de um jeito que um compositor de desktop comum simplesmente não faz. Entender Gamescope, Wayland e FSR é entender por que o Deck entrega performance onde um desktop não entregaria.

:::objetivos
- Entender o Gamescope como microcompositor Wayland criado pela Valve
- Compreender o modelo do Wayland e a relação com o X11 via XWayland
- Usar as flags de upscaling (FSR, NIS, integer scaling) do Gamescope
- Configurar resolução interna e externa com `-w`/`-h` e `-W`/`-H`
- Observar o Gamescope em execução e depurar com `WAYLAND_DEBUG`
:::

## Gamescope: o microcompositor da Valve

O **Gamescope** é um microcompositor **Wayland** criado pela Valve. Um compositor comum junta as janelas de todos os apps numa tela; o Gamescope faz algo mais específico: ele pega **um** jogo e o renderiza dentro de uma "bolha" controlada, onde a Valve pode mexer na resolução, aplicar upscaling, forçar o ritmo de quadros e gerenciar HDR sem depender do jogo colaborar.

No Deck, o Gamescope **é** o compositor do modo de jogo (Game Mode). Ligar o aparelho direto para a Steam é ligar o Gamescope. No modo desktop, um compositor KDE tradicional (o KWin) assume; por isso o comportamento gráfico muda tanto entre os dois modos.

```terminal
$ ps aux | grep gamescope
deck       812  12.4  3.1 2143552 253400 ?  SLsl 12:01  1:27 gamescope --xwayland-count 2 -e -W 1280 -H 800 -w 1280 -h 800 --hdr-enabled --steam
deck       944  0.0  0.0   4384  716 ?        S    12:01  0:00 grep gamescope
```

A linha longa do processo revela a configuração real do Deck: `-W 1280 -H 800` é a resolução da tela física (o painel do Deck), `-w 1280 -h 800` a resolução interna de renderização, `--hdr-enabled` liga o HDR e `--steam` indica a integração com o modo Big Picture. Em um Deck, as duas resoluções costumam coincidir; o truque entra quando elas divergem.

## Wayland: cada app no seu buffer

O **Wayland** é o protocolo de display que substitui o **X11/Xorg**. No modelo antigo, o X server desenhava tudo e redirecionava janelas; no Wayland, cada aplicativo desenha no seu próprio buffer de pixels, e o **compositor** — no nosso caso o Gamescope — junta todos os buffers e produz a imagem final na tela. É um desenho mais simples e mais seguro: um app não consegue bisbilhotar a janela do vizinho nem capturar a tela inteira sem passar pelo compositor.

O Gamescope age como compositor Wayland: os jogos que já falam Wayland entregam seu buffer diretamente. Mas muitos jogos ainda são escritos para **X11**. Para esses, o Gamescope lança um **XWayland** — um servidor X11 que traduz as chamadas antigas para o mundo Wayland. É por isso que você vê `--xwayland-count 2` no processo acima: dois servidores X virtuais prontos para jogos legados.

```terminal
$ gamescope --help
usage: gamescope [options...] -- [command...]

Options:
  -w, --width  WIDTH          resolução interna de renderização
  -h, --height HEIGHT         altura interna de renderização
  -W, --output-width  WIDTH   resolução da tela de saída
  -H, --output-height HEIGHT  altura da tela de saída
  -F, --filter  fsr|nis|...   filtro de upscaling
  -f, --fullscreen            tela cheia
      --hdr-enabled           habilita HDR
```

A distinção entre os dois pares de flags é o coração do Gamescope no uso avançado. `-w`/`-h` definem em que resolução o jogo **renderiza**; `-W`/`-H` definem em que resolução a tela **exibe**. Se você deixar o jogo renderizar em 960×600 e sair em 1280×800, o Gamescope faz o upscaling — e é aí que entram os filtros.

## FSR, NIS e integer scaling: os filtros de upscaling

O **FSR** (*FidelityFX Super Resolution*) é a técnica de upscaling espacial da AMD. O Gamescope implementa o **FSR 1.0**, que pega a imagem de baixa resolução e a reconstrói numa resolução maior com um algoritmo de nitidez. O resultado: você pode reduzir a resolução interna do jogo para ganhar FPS e deixar o Gamescope reconstruir a imagem, com perda de qualidade bem menor do que o simples "esticar" linear.

O **NIS** (*NVIDIA Image Scaling*) é a alternativa da NVIDIA, também suportada pelo Gamescope, com o mesmo espírito: um filtro de upscaling que o compositor aplica na imagem final. E o **integer scaling** ("pixel perfect") faz o oposto dos dois — em vez de suavizar, ele multiplica cada pixel por um inteiro (2×, 3×) para preservar os pixels nítidos de jogos retrô, sem blur.

```terminal
$ gamescope -w 960 -h 600 -W 1280 -H 800 -F fsr -f -- %command%
$ gamescope -w 640 -h 480 -W 1280 -H 960 -F integer -f -- %command%
```

No primeiro exemplo, o jogo renderiza em 960×600 e o Gamescope faz upscaling FSR para 1280×800. No segundo, um jogo retrô renderiza em 640×480 e sai em 1280×960 — exatamente 2× em cada eixo, então cada pixel original vira um bloco 2×2 perfeito. O `-- %command%` é o marcador que, nas opções de lançamento da Steam, diz ao Gamescope "execute daqui para frente como o jogo".

:::dica
O `-F fsr` também aceita um parâmetro de nitidez: `-F fsr --fsr-sharpness 3`. O valor vai de 0 (mais suave) a 20 (mais nítido), com 0 desligando o efeito de nitidez. Para descobrir os filtros disponíveis na sua build, rode `gamescope --help` e procure a lista de `--filter`.
:::

## HDR e frame pacing controlado

O **HDR** no Gamescope não é um simples liga/desliga do monitor. O compositor gerencia **tone mapping** — a conversão do conteúdo de alta faixa dinâmica para o que o painel consegue exibir — e controla a saída HDR de ponta a ponta. Com `--hdr-enabled`, o Gamescope negocia um pipeline HDR com a GPU e a tela, e faz o mapeamento de tons quando o conteúdo está fora da faixa do display.

Além do HDR, o Gamescope impõe **frame pacing** forçado: ele controla o ritmo de apresentação dos quadros e o **VRR** (taxa de atualização variável), entregando cada quadro no momento certo em vez de depender da boa vontade do jogo. Isso reduz micro-travadas e *stutter* em jogos que não têm bom pacing por conta própria.

```terminal
$ WAYLAND_DEBUG=1 gamescope -w 1280 -h 800 -- %command% 2>&1 | grep -i -E 'format|modifier|buffer' | head -10
```

O `WAYLAND_DEBUG=1` liga o log de protocolo do Wayland, mostrando cada mensagem trocada entre o jogo e o compositor. É um recurso de diagnóstico pesado — o log é gigantesco —, mas filtrar por termos como `format` e `modifier` ajuda a ver qual formato de pixels e qual *modifier* de layout o jogo negocia com o Gamescope. Quando um jogo renderiza com cores erradas ou falha ao abrir, esse é o lugar para investigar.

:::nota
FSR 1.0 é um upscaling **espacial** puro: ele não usa informação de quadros anteriores, ao contrário do FSR 2/3 que usa dados temporais e *motion vectors*. Por isso a qualidade do FSR do Gamescope é boa, mas não chega à dos upscalers temporais integrados aos próprios jogos. A vantagem é universalidade: funciona em qualquer jogo, sem suporte do engine.
:::

## Compositor: a camada que junta tudo

O termo **compositor** merece seu próprio lugar no glossário: é o programa que pega a imagem de cada aplicativo e compõe a tela final, na ordem certa (o *z-order*), aplicando vsync para sincronizar com a taxa de atualização do painel. Sem compositor, cada app desenharia por conta própria e as janelas se sobreporiam sem coordenação.

No modo desktop do Deck, o compositor é o KWin (do KDE Plasma). No modo de jogo, é o Gamescope. A troca entre os dois é o que o modo de jogo orquestra ao iniciar: ele mata o KWin e lança o Gamescope com as flags do `ps aux` que vimos, entregando o fullscreen de volta à Steam.

```terminal
$ cat ~/.config/environment.d/gamescope-session.conf 2>/dev/null || echo "arquivo não existe no Deck"
arquivo não existe no Deck
```

A configuração de boot do Gamescope não fica num arquivo que você edita à mão — ela é montada pela sessão de jogo do SteamOS. Por isso a forma mais confiável de saber como o Gamescope está rodando é o `ps aux | grep gamescope`, não a procura por um arquivo de configuração.

## Resumo

- Gamescope é o microcompositor Wayland da Valve; no Deck ele é o compositor do modo de jogo e aplica upscaling, HDR e frame pacing.
- No Wayland cada app desenha no próprio buffer e o compositor junta tudo; o Gamescope é esse compositor no modo jogo.
- Jogos X11 legados rodam dentro do Gamescope via XWayland, que traduz as chamadas antigas.
- FSR 1.0 (AMD), NIS (NVIDIA) e integer scaling são os filtros de upscaling que o Gamescope aplica na imagem final.
- `-w`/`-h` definem a resolução de renderização e `-W`/`-H` a de saída; o upscaling acontece quando elas divergem.
- Com `--hdr-enabled` o Gamescope gerencia tone mapping e HDR; `WAYLAND_DEBUG=1` expõe a negociação de protocolo.

## Exercícios

1. Execute `ps aux | grep gamescope` no modo de jogo e anote os valores de `-w`, `-h`, `-W` e `-H`. Eles coincidem ou divergem?
2. No terminal, rode `gamescope --help` e liste os filtros disponíveis em `--filter` na sua build. Anote qual é o padrão.
3. Escolha um jogo e, nas opções de lançamento, adicione `gamescope -w 960 -h 600 -W 1280 -H 800 -F fsr -f -- %command%`. Compare o desempenho e a nitidez antes e depois.
4. Rode um jogo com `WAYLAND_DEBUG=1 gamescope -- %command% 2> wayland.log` e, com `grep`, encontre a mensagem de negociação de formato de buffer.
5. **Desafio.** Teste o integer scaling num jogo retrô que roda em 640×480, mirando uma saída 2× exata. Explique por que o FSR seria a escolha errada para esse jogo e relacione a resposta com a diferença entre upscaling espacial e escalonamento por múltiplos inteiros.
