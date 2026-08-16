Frame pacing é a arte de entregar cada quadro no instante certo, e frame time é a régua que mede se isso está acontecendo. Um jogo pode reportar 60 FPS médios e ainda assim parecer cheio de engasgos — porque a média esconde os quadros que chegaram atrasados. Medir frame time é o jeito certo de diagnosticar fluidez.

:::objetivos
- Entender a diferença entre FPS médio e frame time individual
- Identificar as causas comuns de *stutter* e *hitching*
- Medir frame time com o overlay do SteamOS e com mangohud
- Relacionar frame time constante com refresh rate fixo
:::

## FPS é média; frame time é verdade

O FPS que aparece no canto da tela é, na prática, uma média calculada numa janela de tempo recente. Se em um segundo o jogo entrega 30 quadros, a média é "30 FPS" — mas isso não diz nada sobre como esses 30 quadros foram distribuídos. Eles podem ter vindo num bloco compacto no início do segundo, deixando a segunda metade do segundo sem imagem nova, e a média continuaria idêntica.

O **frame time** mede o intervalo entre um quadro e o próximo. Num alvo de 60 FPS, cada frame time ideal é `1000 / 60 ≈ 16,6 ms`. Se 59 quadros chegam a cada 16,6 ms e um demora 100 ms, a média do FPS mal se move, mas você *sente* aquele quadro de 100 ms como um engasgo momentâneo.

```terminal
$ MANGOHUD_CONFIG=fps_limit=60,frame_timing=1 mangohud %command%
```

O parâmetro `frame_timing=1` liga o gráfico de frame time no mangohud, e o `fps_limit=60` trava a renderização em 60 FPS. Olhar o gráfico (não o número) é o que revela se o ritmo é estável. Uma linha horizontal chata é o objetivo; picos verticais são quadros atrasados.

## De onde vêm os picos de frame time

Picos de frame time têm causas bem distintas, e o diagnóstico muda conforme o formato do pico. As três fontes mais comuns no Deck:

**Carregamento de textura.** Quando um objeto novo entra na cena e o jogo precisa carregar da RAM (ou pior, do SSD) para a VRAM, um único quadro dispara para centenas de milissegundos. É o *hitching* clássico de engine que faz *streaming* agressivo.

**Compilação de shader.** O SteamOS pré-compila shaders justamente para evitar isso, mas títulos não verificados, ou jogando direto do executável sem o cache do Proton, compilam shader em tempo de execução, gerando picos em rajada nas primeiras passadas por cada área.

**Gargalo de CPU.** Quando o limite não é a GPU, mas o escalonamento de threads no CPU, os frame times oscilam em padrão irregular e frequente, acompanhado de uso de CPU alto. Isso é comum em títulos de mundo aberto lotados.

```terminal
$ journalctl -u gamescope | tail -20
jan 12 14:02:11 steamdeck gamescope[781]: [gamescope] Refresh rate set to 90Hz
jan 12 14:02:11 steamdeck gamescope[781]: [gamescope] Reading info from VRR capable display
jan 12 14:02:15 steamdeck gamescope[781]: [gamescope] vblank failed to flip: -ETIME
jan 12 14:02:15 steamdeck gamescope[781]: [gamescope] vblank failed to flip: -ETIME
```

As linhas `vblank failed to flip: -ETIME` no log do gamescope indicam que o compositor não conseguiu apresentar o quadro no slot de tempo do vblank — um sintoma clássico de frame time maior que o período da tela. Ver os logs é a forma de confirmar que um engasgo vem do apresentador, e não da cena.

## Frame time vs refresh rate: o casamento

Frame pacing perfeito só existe quando o frame time do jogo é **igual ou submúltiplo** do período do refresh rate. Numa tela de 90 Hz, o período é `1000 / 90 ≈ 11,1 ms`. Para pintar sem engasgo, cada quadro do jogo deve caber em 11,1 ms — ou em 22,2 ms (45 FPS), ou em 33,3 ms (30 FPS).

Se o frame time é 14 ms numa tela de 90 Hz, ele não cabe em 11,1 ms nem em 22,2: alguns quadros pegam um slot, outros dois, e o ritmo "pula". É exatamente esse desalinho que o limite de FPS resolve: ao travar o jogo em 45 FPS, cada quadro ocupa 22,2 ms e encaixa perfeitamente em dois ciclos da tela.

:::dica
Para ver o problema com os próprios olhos, rode um jogo sem limitador numa tela de 90 Hz, observe o frame time, depois trave em 45 FPS. O gráfico estabiliza mesmo que a média de FPS seja *menor* que antes — é a prova de que consistência vence média.
:::

## Medindo o que importa

Duas ferramentas cobrem a medição no deck: o overlay nativo do SteamOS (ativado no menu `...` em Desempenho) e o mangohud, mais configurável. O overlay mostra FPS e frame time em tempo real; o mangohud permite desenhar o gráfico histórico, expor percentis e travar o FPS na linha de comando — o assunto da seção dedicada ao limitador.

A leitura mais útil é o **1% low** (ou *0.1% low*): o frame time médio dos piores 1% dos quadros. Um jogo com média de 60 FPS mas 1% low de 25 FPS vai parecer muito pior que um jogo estável de 40 FPS com 1% low também em 40. O 1% low é o "pior caso que você realmente sente".

O mangohud pode expor o 1% low numericamente no overlay, e é a métrica que separa um jogo "rodando bem" de um jogo "rodando bem na média":

```terminal
$ MANGOHUD_CONFIG=fps_limit=40,fps=1,frametime=1,show_fps_limit=1 mangohud %command%
```

Com `show_fps_limit=1` o overlay exibe o teto configurado (40 FPS) e o frametime real. O número de FPS pode cravar em 40, mas se o frametime oscilar entre 20 e 35 ms, o 1% low está abaixo de 40 — e você sente.

## Resumo

- FPS é média; frame time é o intervalo real entre quadros, e é ele que o olho sente.
- O frame time ideal para 60 FPS é 16,6 ms; para 40 FPS, 25 ms; para 30 FPS, 33,3 ms.
- Picos de frame time vêm de carregamento de textura, compilação de shader ou gargalo de CPU.
- `vblank failed to flip` no log do gamescope indica quadro apresentado fora do slot da tela.
- Frame pacing perfeito exige frame time igual ou submúltiplo do período do refresh rate.
- O 1% low é a métrica mais honesta de fluidez percebida.

## Exercícios

1. Num jogo com overlay do SteamOS, observe o frame time por dois minutos e anote os dois maiores picos que vir.
2. Compare o FPS médio com o 1% low (se disponível no seu overlay) e explique a diferença em uma frase.
3. Rode `journalctl -u gamescope -n 30` durante uma sessão e procure mensagens de `vblank` ou `flip` que indiquem quadros atrasados.
4. Use `MANGOHUD_CONFIG=frame_timing=1 mangohud %command%` e identifique, no gráfico, onde o jogo faz *streaming* de textura.
5. **Desafio.** Num jogo que você conhece bem, meça o frame time em 30 FPS/60 Hz, 40 FPS/40 Hz e 45 FPS/45 Hz, e relacione cada resultado com o período do refresh rate, explicando qual configuração teve menor variância e por quê.
