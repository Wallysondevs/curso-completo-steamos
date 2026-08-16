Toda imagem que aparece na tela do Steam Deck — da animação de boot à sobreposição do Steam Overlay — passa por um único programa antes de chegar ao painel LCD. Esse programa é o Gamescope, o compositor Wayland que a Valve escreveu para jogos e mantém como parte fundamental do SteamOS. Ele é um dos motivos pelos quais a experiência de console no Deck é tão distinta de um desktop Linux comum, e entender o que ele faz ajuda a diagnosticar problemas de performance e a tirar proveito de recursos como FSR e HDR.

:::objetivos
- Entender o papel do Gamescope como microcompositor Wayland do SteamOS
- Identificar se o Gamescope está em execução e quais argumentos foram passados
- Diferenciar o Gamescope de compositores de desktop como Mutter e KWin
- Ler a árvore de processos para visualizar a relação entre Steam, Gamescope e GPU
- Instalar e inspecionar o Gamescope em modo janela para testes
:::

## O que acontece entre a GPU e seus olhos

No Linux tradicional, a cadeia é longa. A aplicação desenha num buffer, entrega para o servidor gráfico (antes X11, hoje Wayland), que entrega para o compositor do ambiente — Mutter no GNOME, KWin no KDE — e o compositor finalmente entrega os buffers para o kernel, que fala com a GPU, que manda para o monitor. Cada elo dessa corrente introduz latência, consome recursos e precisa lidar com o fato de que a janela do jogo pode estar em foco ou não, redimensionada ou fullscreen.

No Steam Deck, a Valve cortou a corrente pela metade. O SteamOS não executa um ambiente de desktop na sessão de jogos: o que você vê é o Steam Client rodando diretamente sobre o Gamescope, que fala com o DRM/KMS do kernel, que fala com a GPU. Não há GNOME, não há KDE, não há um compositor Wayland de uso geral.

```terminal
$ ps aux | grep gamescope
deck      1432  3.1  2.4 5284992 397824 ?     Ssl  11:42   0:42 /usr/bin/gamescope --generate-drm-mode cvt --xwayland-count 2 -w 1280 -h 800 -W 1280 -H 800 -O ,eDP-1 -- /usr/bin/steamos-session
deck      1847  0.0  0.0   9472  2048 pts/1    S+   12:05   0:00 grep gamescope
```

A saída revela o essencial: o Gamescope é o pai da sessão (`steamos-session` é o filho), está configurado para a resolução nativa do Deck (1280×800), usa DRM para conversar com o painel (`eDP-1` é o conector do LCD embutido) e mantém dois servidores XWayland (`--xwayland-count 2`) para retrocompatibilidade com aplicações que ainda dependem de X11.

:::info
XWayland é uma camada de compatibilidade que traduz chamadas do protocolo X11 para Wayland. O Steam Client e muitos jogos ainda usam X11 internamente, então o Gamescope mantém dois servidores XWayland: um para o cliente Steam e outro reserva para jogos que precisam de uma pilha X11 isolada.
:::

## Microcompositor, não compositor de desktop

Compositores de desktop como Mutter e KWin são programas grandes. Eles gerenciam múltiplas janelas com decorações independentes, lidam com arrastar e redimensionar, cuidam de monitores mistos com escalas diferentes, renderizam sombras e animações CSS. Tudo isso é irrelevante — e até prejudicial — para uma máquina de jogos.

O Gamescope é um **microcompositor**. Ele faz essencialmente três coisas: pega o buffer da aplicação filha (o Steam ou um jogo), aplica transformações de escala e espaço de cores se necessário, e entrega o resultado para o painel via atomic modesetting do DRM. Como ele sabe que existe exatamente uma aplicação em tela cheia por vez, pode tomar atalhos que um compositor de desktop não pode.

```terminal
$ cat /proc/$(pgrep gamescope)/cmdline | tr '\0' ' '
/usr/bin/gamescope --generate-drm-mode cvt --xwayland-count 2 -w 1280 -h 800 -W 1280 -H 800 -O ,eDP-1 -- /usr/bin/steamos-session
```

O arquivo `/proc/<pid>/cmdline` mostra exatamente os argumentos com que o processo foi lançado. Nele vemos dois pares de resolução: `-w 1280 -h 800` é a resolução **interna** — o tamanho do framebuffer que as aplicações enxergam. `-W 1280 -H 800` é a resolução **externa** — o tamanho real da saída para o painel. Quando os dois pares são iguais, não há upscaling nem downscaling; veremos a diferença nas próximas seções quando entrarmos em FSR.

:::dica
Para descobrir rapidamente se o Gamescope está rodando com os parâmetros esperados, use `pgrep gamescope` para obter o PID e depois `cat /proc/<pid>/cmdline | tr '\0' ' '`. O `tr` converte os separadores nulos em espaços legíveis — sem ele, a saída parece grudada.
:::

## Onde o Gamescope vive na árvore de processos

O Gamescope não é um serviço systemd tradicional. Ele é lançado pelo gerenciador de sessão como processo raiz da sessão gráfica do Modo Jogo, e tudo o que roda nessa sessão é filho ou neto dele. Dá para ver isso com `pstree`:

```terminal
$ pstree -p $(pgrep gamescope | head -1)
gamescope(1432)───steamos-session(1451)───steam(1512)─┬─steamwebhelper(1603)─┬─{steamwebhelper}(1611)
                                                       │                      └─{steamwebhelper}(1620)
                                                       ├─steam(1578)
                                                       └─{steam}(1599)
```

O Gamescope (PID 1432) é a raiz. Abaixo dele, o `steamos-session` (1451), e abaixo deste, o `steam` (1512) com seus subprocessos. Se o Gamescope morrer, toda a árvore morre junto — você volta para a tela de login. Isso explica por que um crash gráfico no Modo Jogo faz você cair para o SDDM (o gerenciador de login do KDE Plasma no Modo Desktop).

Quando você alterna para o Modo Desktop, o Gamescope **não** está rodando. A sessão Plasma usa o KWin como compositor. Você pode confirmar isso comparando a lista de processos nos dois modos:

```terminal
$ pgrep -a gamescope
1432 /usr/bin/gamescope --generate-drm-mode cvt --xwayland-count 2 -w 1280 -h 800 -W 1280 -H 800 -O ,eDP-1 -- /usr/bin/steamos-session
```

No Modo Desktop, esse mesmo comando retorna vazio. O Gamescope é exclusivo do Modo Jogo, e isso é deliberado: o Modo Desktop existe para tarefas de produtividade onde um compositor completo como o KWin é mais adequado.

## Resumo

- O Gamescope é o microcompositor Wayland que roda no Modo Jogo do SteamOS, responsável por tudo que aparece na tela.
- Ele é mais enxuto que compositores de desktop porque sabe que existe uma aplicação fullscreen por vez e pode tomar atalhos.
- No Steam Deck, o Gamescope é o pai da árvore de sessão: filho `steamos-session`, neto `steam`, com dois XWayland para compatibilidade.
- `ps aux | grep gamescope` mostra o processo em execução; `cat /proc/<pid>/cmdline` revela os argumentos exatos.
- O Gamescope roda apenas no Modo Jogo; no Modo Desktop, o compositor é o KWin do KDE Plasma.

## Exercícios

1. No Modo Jogo do Steam Deck, abra um terminal (ou acesse via SSH) e execute `pgrep -a gamescope`. Copie a linha de comando completa e anote cada flag que você reconhece.
2. Use `pstree -p $(pgrep gamescope)` para visualizar a árvore de processos. Quantos processos netos do Gamescope estão rodando?
3. Alterne para o Modo Desktop e execute `pgrep -a kwin_wayland`. Compare o PID e os argumentos com os do Gamescope no Modo Jogo.
4. Leia o arquivo `/proc/$(pgrep gamescope)/cmdline` com e sem o `tr '\0' ' '`. Explique por que a conversão de caracteres nulos é necessária.
5. **Desafio.** No Modo Jogo, execute `sudo cat /proc/$(pgrep gamescope)/maps | head -30`. Identifique as bibliotecas compartilhadas (`libwayland`, `libdrm`, `libvulkan`) que o Gamescope mapeia e explique o que cada uma faz no contexto da renderização.