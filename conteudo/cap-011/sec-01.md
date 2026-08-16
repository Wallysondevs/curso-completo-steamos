Um jogo "rodando liso" é uma impressão, mas uma impressão que dá para medir. O SteamOS coloca na sua mão um instrumento de medição que a maioria dos consoles esconde: o overlay de desempenho, um painel de números que flutua sobre o jogo e mostra o que a máquina está fazendo naquele instante — quadros por segundo, tempo de renderização, temperatura, uso de memória e mais. Entender os quatro níveis desse overlay é o primeiro passo para falar de desempenho com números em vez de achismo.

:::objetivos
- Entender o que é o overlay de desempenho e por que ele existe no SteamOS
- Conhecer os quatro níveis de detalhe do overlay do Modo Jogo
- Saber em qual nível cada métrica aparece
- Entender a diferença entre o overlay do Modo Jogo e o MangoHud
:::

## Por que um console tem um medidor de desempenho

O Steam Deck é um PC com cara de console, e herda dos dois mundos. De console, ele herda a experiência "aperte e jogue", sem instalação de driver, sem configuração gráfica obrigatória. De PC, herda a transparência: você pode abrir o capô e ver, em tempo real, o que acontece com o hardware enquanto o jogo roda.

O overlay de desempenho é a materialização dessa herança. Ele não é um recurso escondido para desenvolvedores; é uma ferramenta de usuário, acionada por dois toques, que ajuda em três situações concretas:

- **Descobrir por que um jogo trava** — se o FPS despenca, você vê na hora se é a GPU lotada, a CPU gargalando ou a temperatura subindo.
- **Ajustar configurações gráficas** — baixar a resolução ou a qualidade de sombra só faz sentido se você consegue ver o ganho de FPS na tela.
- **Administrar a bateria** — limitar a potência e ver o impacto direto no consumo energético.

O overlay fica sempre em cima do jogo, desenhado pela própria camada de composição do SteamOS (o gamescope), e não interfere no que o jogo está renderizando. Ele lê métricas que o próprio sistema expõe.

:::nota
O nome técnico dessa camada é **compositor** (do inglês *compositor*). No SteamOS, o compositor do Modo Jogo se chama **gamescope**, um programa mantido pela Valve que desenha janelas, aplica escala e injeta o overlay. É ele que permite rodar um jogo em 800p e escalar para a tela de 1280×800 do Deck.
:::

## Os quatro níveis

O overlay do Modo Jogo tem quatro níveis de detalhe, numerados de 1 a 4. Cada nível acrescenta uma camada de informação sobre a anterior. A lógica é: do nível 1, que mostra só o essencial e quase não atrapalha a visão do jogo, até o nível 4, que empilha praticamente todas as métricas disponíveis e cobre boa parte da tela.

```terminal
$ cat /usr/share/steamos/overlay-levels.txt
nivel 1 : fps
nivel 2 : fps, frametime, cpu, gpu
nivel 3 : nivel 2 + ram, vram, temperatura
nivel 4 : nivel 3 + bateria, potência, percentuais detalhados
```

A tabela abaixo resume o que cada nível acrescenta, sem pretender ser exaustiva (os rótulos exatos mudam ligeiramente entre versões do SteamOS):

| Nível | Métricas adicionadas | Uso típico |
|---|---|---|
| 1 | FPS | Checagem rápida de fluidez |
| 2 | Frametime, CPU, GPU | Diagnóstico de gargalo |
| 3 | RAM, VRAM, temperatura | Investigação de stutter e memória |
| 4 | Bateria, potência, tudo detalhado | Afinação fina de energia e perfil |

Nos níveis mais baixos, as métricas aparecem como valores crus, em texto pequeno no canto. No nível 4, o SteamOS desenha pequenos gráficos de histórico — linhas que mostram a evolução do frametime e do uso de CPU/GPU nos últimos segundos, o que ajuda muito a enxergar picos que um número instantâneo esconde.

:::dica
Decore o atalho: aperte o botão físico `...` (o de três pontinhos, embaixo do touchpad direito), desça até o ícone de **bateria** na barra vertical, e ali está o controle de **desempenho**. A alternância de nível é feita por uma barra deslizante ou por toques sucessivos, dependendo da versão do SteamOS.
:::

## O que os números medem, de fato

Antes de detalhar cada métrica nas próximas seções, vale fixar o vocabulário, porque os rótulos do overlay usam abreviações em inglês que aparecem sem tradução:

- **FPS** (*frames per second*) — quantos quadros completos o jogo entrega por segundo. É a medida mais intuitiva de fluidez, mas não a mais precisa.
- **Frametime** — o tempo, em milissegundos, que cada quadro levou para ser produzido. É o inverso conceitual do FPS e conta a história com mais honestidade.
- **GPU / CPU** — percentual de ocupação da placa de vídeo e do processador.
- **VRAM** — a memória dedicada da GPU.
- **RAM** — a memória principal do sistema.
- **Temp** — temperatura, em graus Celsius, dos componentes monitorados.

A relação entre FPS e frametime é matemática: `FPS = 1000 / frametime`. A 60 FPS, cada quadro leva cerca de 16,7 ms. A 30 FPS, 33,3 ms. Guarde esses dois números de referência; eles voltam o tempo todo.

```terminal
$ echo "FPS alvo   frametime correspondente"
$ for fps in 30 40 60 90 120; do printf "  %3d FPS  ->  %.1f ms\n" "$fps" "$(echo "scale=1; 1000/$fps" | bc)"; done
FPS alvo   frametime correspondente
   30 FPS  ->  33.3 ms
   40 FPS  ->  25.0 ms
   60 FPS  ->  16.7 ms
   90 FPS  ->  11.1 ms
  120 FPS  ->   8.3 ms
```

O último comando usa `bc` para fazer a conta, mas você não precisa dele para usar o overlay — a tabela mental de 16,7 ms e 33,3 ms basta para a maioria dos diagnósticos.

## Overlay do Modo Jogo versus MangoHud

É fácil confundir as duas coisas, porque ambas mostram números sobre o jogo. São ferramentas distintas que servem a contextos distintos.

O **overlay do Modo Jogo** é a opção nativa, integrada ao gamescope, acionada pelo botão `...`. Funciona em qualquer jogo lançado no Modo Jogo, sem instalação, e tem os quatro níveis prontos. Sua limitação: só existe dentro da sessão do Modo Jogo.

O **MangoHud** é um programa separado, open source, que injeta um overlay semelhante em jogos rodando no Modo Desktop (ou em qualquer aplicação Vulkan/OpenGL). Ele aparece na nossa jornada na última seção deste capítulo e é o caminho a seguir quando você quer monitorar algo fora da interface padrão do Deck.

```terminal
$ which mangohud
/usr/bin/mangohud
$ which gamescope
/usr/bin/gamescope
```

Os dois coexistem no sistema. Você pode ignorar o MangoHud completamente e viver só com o overlay nativo; mas quem faz experimentos no Desktop, ou testa jogos fora da Steam, acaba precisando dele.

## Resumo

- O overlay de desempenho é o medidor nativo do SteamOS, acionado pelo botão `...` no Modo Jogo.
- Ele tem quatro níveis: o 1 mostra só FPS; o 2 acrescenta frametime, CPU e GPU; o 3 traz RAM, VRAM e temperatura; o 4 inclui bateria e potência.
- FPS e frametime são inversos: `FPS = 1000 / frametime`; 60 FPS equivalem a 16,7 ms.
- O overlay é desenhado pelo gamescope, o compositor do Modo Jogo mantido pela Valve.
- O MangoHud é uma alternativa separada, usada principalmente no Modo Desktop.

## Exercícios

1. Abra qualquer jogo no Modo Jogo, aperte `...`, ative o overlay e circule os quatro níveis, anotando o que muda de um para o outro.
2. Com o jogo em 60 FPS, registre o valor de frametime mostrado e confirme que ele fica perto de 16,7 ms.
3. Compare o que o nível 2 mostra de CPU e GPU com o nível 4: os valores batem ou o nível 4 traz uma leitura mais fina?
4. Liste mentalmente (ou no papel) qual métrica você consultaria primeiro para cada sintoma: travada, aquecimento, bateria acabando rápido.
5. **Desafio.** Rode `which mangohud` e `which gamescope` no terminal de um Modo Desktop e explique, com suas palavras, por que os dois programas podem coexistir sem conflito.
