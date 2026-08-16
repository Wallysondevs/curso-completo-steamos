Ao longo deste capítulo você ouviu o nome **Gamescope** várias vezes — "o compositor que desenha o Modo Jogo por cima". Esta seção fecha o ciclo com uma olhada honesta, mas sem mergulhar fundo (a análise completa fica [no capítulo sobre o Gamescope](#/cap-010/sec-01)). Aqui o objetivo é um só: entender por que existe um compositor dedicado, como ele aparece nos processos e o que acontece quando ele cai.

:::objetivos
- Entender o papel de um compositor gráfico e por que o Deck usa um próprio
- Identificar o processo Gamescope e seus argumentos de linha de comando
- Relacionar Gamescope, Steam e o jogo na árvore de processos
- Observar como o Gamescope trata resolução e escala
- Reconhecer o que uma queda do Gamescope significa para a sessão

:::

## O que é um compositor

Num desktop Linux, o **compositor** é o programa que pega a imagem de cada janela e a reúne numa única imagem final exibida na tela. O KDE Plasma usa o KWin, o GNOME usa o Mutter. O Gamescope é isso, mas com uma missão menor e mais especializada: em vez de gerenciar dezenas de janelas redimensionáveis, ele compõe uma superfície principal (o Steam) e, quando há um jogo, a superfície do jogo, aplicando transformações de escala.

A motivação da Valve para escrever o próprio compositor é pragmática e vem da experiência com o big picture no PC. Um compositor de desktop "completo" é pesado e impõe decisões (como bufferização e sincronização vertical) que atrapalham jogos. O Gamescope foi feito para dar controle fino sobre **ritmo de quadro, escala e captura** — exatamente o que um console portátil precisa e o que o KWin não oferecia.

## O Gamescope na árvore de processos

Você já viu o `gamescope` no `ps`, mas a linha completa merece releitura por inteiro, incluindo os argumentos:

```terminal
$ ps -o pid,ppid,user,args -C gamescope
  PID  PPID USER     COMMAND
 2214   980 deck     gamescope --backend drm --steam --xwayland-count 2 --output-width 1280 --output-height 800
```

Cada argumento conta uma parte da história:

| Argumento | Significado |
|---|---|
| `--backend drm` | Renderiza direto na placa de vídeo via DRM (sem passar por um X/Wayland intermediário) |
| `--steam` | Modo integrado ao Steam/SteamOS (comportamento específico de console) |
| `--xwayland-count 2` | Mantém servidores XWayland para rodar jogos X11 (dois, para o Steam e o jogo) |
| `--output-width/height` | Resolução nativa da tela do Deck (1280×800) |

O `--backend drm` é o mais importante de entender: ele dispensa todo o stack de janelas e fala direto com o driver de vídeo. Por isso o Modo Jogo é mais leve que o desktop e por isso o Gamescope consegue segurar 60 FPS estáveis onde um compositor comum penaria.

Quando um jogo sobe, a árvore ganha um ramo: o Gamescope vira o "pai" da superfície do jogo (ou o Steam é o pai do processo do título, dependendo da configuração). Usar o `pstree` deixa a hierarquia visível:

```terminal
$ pstree -p $(pgrep -f 'gamescope --steam' | head -1) | head -20
gamescope(2214)─┬─gamescope-xwm(2231)
                ├─steam(2260)─┬─steamwebhelper(2261)─┬─...
                │             └─reaper(5610)
                └─Xwayland(2288)
```

Repare nos filhos do Gamescope: um `Xwayland` (para jogos X11 via Proton), o `steam` (a interface) e seu `steamwebhelper`. A leitura em prosa: o Gamescope é o **topo** da sessão gráfica — se ele morre, tudo o que depende dele cai junto.

## Escala, resolução e o limite de FPS

O Gamescope é quem faz o trabalho de **escala** quando um jogo roda numa resolução diferente da tela. Se um jogo renderiza a 720p (1280×720) mas a tela é 800p (1280×800), é o Gamescope que estica a imagem, opcionalmente com FSR (o escalonador da AMD) para suavizar. É por isso que mudar a resolução do jogo não "quebra" a tela: o compositor absorve a diferença.

O **limitador de FPS** do menu rápido (que você ajustou na seção 3) também é uma função do Gamescope, não do jogo. O compositor controla o ritmo em que apresenta os quadros na tela, independentemente de quantos o jogo produz. Isso é o que permite "travar em 40" num jogo que internamente quer rodar a 90: o Gamescope simplesmente descarta/atrasa frames.

```terminal
$ gamescope --help 2>/dev/null | grep -iE 'limit|fps|scaler|fsr' | head -12
```

A saída lista flags como `-r, --refresh`, `-o, --max-scale` e opções de `--scaler`/`--fsr`. É a prova de que o que você ajusta por botão no menu rápido corresponde a uma flag de linha de comando do Gamescope.

## O que acontece quando o Gamescope cai

Se o processo Gamescope termina (bug, driver, memória), a sessão gráfica do Modo Jogo **inteira** termina com ele. Na prática você vê a tela piscar e o Deck voltar para a tela de "inicializando" ou reiniciar a sessão — não é um desligamento do sistema, mas um reinício da sessão gráfica. O kernel e os processos de fundo (serviços, SSH) sobrevivem.

Para ver a "cena do crime", o journal registra a queda:

```terminal
$ journalctl -b | grep -iE 'gamescope|segfault|drm' | tail -12
```

Linhas com `segfault` em `gamescope`, ou erros de `drm` (o backend), indicam a causa. Como regra, uma queda esporádica não é alarmante; quedas repetidas pedem investigação de driver ou de uma atualização mal aplicada — e aí você já está no território do diagnóstico, que a última seção do capítulo e o capítulo 10 aprofundam.

:::nota
Não confunda **queda do Gamescope** com **queda do Steam**. Se o Steam fecha ou trava, o Gamescope pode continuar vivo mostrando uma tela preta ou congelada, porque ele só compõe o que o Steam entrega. A distinção aparece no `journalctl`: quem deu `segfault` foi o `steam` ou o `gamescope`?
:::

## Resumo

- Um compositor reúne imagens de janelas numa tela; no Deck esse papel é do Gamescope.
- A Valve fez o Gamescope para controlar frame pacing, escala e captura com precisão de console.
- `gamescope --backend drm --steam` renderiza direto no driver, sem stack de janelas.
- O Gamescope é o topo da sessão; `pstree` mostra Steam, Xwayland e reaper como filhos dele.
- O limitador de FPS e o FSR do menu rápido são funções do Gamescope, não do jogo.
- Se o Gamescope cai, a sessão gráfica do Modo Jogo cai junto, mas não o sistema.

## Exercícios

1. Rode `ps -o pid,ppid,user,args -C gamescope` e explique, em uma frase, o que cada argumento faz.
2. Use `pstree -p <pid>` sobre o Gamescope e desenhe (por escrito) a hierarquia até o jogo.
3. Consulte `gamescope --help` e identifique a flag que corresponde ao limitador de FPS que você usou na seção 3.
4. Procure no `journalctl -b` qualquer menção a `gamescope` e descreva se houve alguma queda ou erro.
5. **Desafio.** Cause e interprete: force um reinício da sessão do Modo Jogo (menu → Energia → reiniciar sessão, ou equivalente) e observe no `journalctl` a sequência de parada/subida do `gamescope`. Explique por que a tela pisca mas o sistema não desliga, apoiando-se no conceito de sessão gráfica vs. processos de fundo.
