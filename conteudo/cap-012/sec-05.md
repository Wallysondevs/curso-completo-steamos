Depois de três seções sobre ferramentas e alavancas, você precisa da pergunta que justifica todo o esforço: "mexer no TDP muda quantos FPS, exatamente?" A resposta não é um número único — depende do jogo, da cena, do limite que está atuando (GPU ou CPU) e da temperatura ambiente. Esta seção te dá método para medir, não dogma para repetir.

:::objetivos
- Entender por que o impacto do TDP no FPS depende do gargalo do jogo
- Usar o MangoHud como instrumento de medição, não só como overlay
- Interpretar frametime, percentis e médias em vez de olhar só o FPS
- Saber identificar quando o TDP não é o limite — e parar de mexer nele
:::

## O gargalo manda

Todo jogo tem um componente que limita o FPS em cada instante. Se o jogo está limitado pela GPU, reduzir o TDP reduz o clock da GPU, e o FPS cai na mesma proporção aproximada. Se o jogo está limitado pela CPU (física pesada, muitos NPCs, draw calls excessivas), mexer no TDP pode não fazer diferença nenhuma — a CPU não precisa de 15 W para entregar o máximo que o jogo pede dela.

Isso significa que a mesma redução de TDP (digamos, de 15 W para 10 W) produz resultados radicalmente diferentes:

| Jogo | Gargalo | 15 W | 10 W | Impacto |
|---|---|---|---|---|
| Portal 2 | GPU | 60 FPS | 60 FPS | Nenhum (tão leve que 10 W bastam) |
| Cyberpunk 2077 (médio) | GPU | 38 FPS | 28 FPS | ~26% de perda |
| Factorio (megabase) | CPU | 42 UPS | 41 UPS | Quase nulo |
| Elden Ring (aberto) | GPU/CPU misto | 40 FPS | 34 FPS | ~15% de perda |

A tabela não é lei universal — é um exemplo de como o tipo de jogo importa mais que o valor absoluto do TDP. O que você leva desta seção é o **método** para descobrir a curva de FPS × TDP do seu jogo favorito, não um número mágico.

## Instrumentando com MangoHud

O overlay do MangoHud não serve só para exibir FPS. Com os parâmetros certos, ele vira um laboratório portátil. A configuração do MangoHud fica em `~/.config/MangoHud/MangoHud.conf` (global) ou em arquivos por jogo. Para esta medição, você quer os campos que mostram consumo e clock:

```
fps
frametime
gpu_stats
cpu_stats
gpu_power
cpu_power
```

O `gpu_power` (em watts) é o dado mais importante para correlacionar FPS com TDP. Se ele estiver abaixo do teto que você configurou, o jogo não está usando toda a potência disponível — e reduzir o TDP seria grátis.

```terminal
$ ls ~/.config/MangoHud/
MangoHud.conf
$ cat ~/.config/MangoHud/MangoHud.conf
fps
frametime
gpu_power
cpu_power
gpu_temp
```

Para ativar o overlay com essa configuração, o parâmetro de lançamento é `mangohud %command%`. Se o jogo usa Vulkan, o MangoHud se injeta automaticamente; se usa OpenGL, você pode precisar de `mangohud --dlsym %command%`.

## Lendo frametime, não só FPS

FPS médio engana. Dois setups podem ter a mesma média de 40 FPS com experiências completamente diferentes: um entrega 40 FPS lisos (25 ms por frame) e o outro alterna entre 60 FPS (16,6 ms) e 20 FPS (50 ms), gerando *stutter* constante. A média esconde a oscilação.

O `frametime` — o tempo que cada frame leva para ser renderizado, em milissegundos — conta a história real. Um frametime estável é mais importante que uma média alta. O MangoHud pode exibir o frametime como gráfico de barras ou como número, e você quer olhar para os **picos**: se um frame a cada 30 dispara para 80 ms, você sente um engasgo, mesmo que os outros 29 frames tenham sido rápidos.

Para testes de TDP, a métrica útil é o **frametime no percentil 99** (P99): o tempo do frame mais lento entre os 99% melhores. Um P99 baixo significa fluidez; um P99 alto significa stutter. O MangoHud não calcula P99 nativamente, mas o `MangoHud-log` exporta frametimes para CSV:

```terminal
$ mangohud --output-file /tmp/bench.csv %command%
$ head -5 /tmp/bench.csv
frame_timing,0.016723
frame_timing,0.016801
frame_timing,0.033455
frame_timing,0.016712
frame_timing,0.016698
```

Com o CSV em mãos, você calcula percentis com qualquer ferramenta — até um script Python de cinco linhas resolve.

:::dica
Para medir o impacto do TDP, fixe a cena: fique parado olhando para o mesmo lugar no jogo, alterne o TDP, espere 5 segundos para estabilizar e colete 60 segundos de frametimes. Comparar cenas diferentes invalida a medição — um campo aberto e um corredor interno têm demandas de GPU completamente distintas.
:::

## A curva TDP × FPS na prática

Monte seu próprio teste. Em um terminal, fixe o TDP e monitore:

```terminal
$ sudo ryzenadj -a 15000 -b 15000 -c 15000
$ watch -n 2 'sudo ryzenadj --info | grep "STAPM VALUE"'
```

Em outro, rode o jogo com logging de frametime. Repita para 12 W, 10 W, 8 W, 6 W. A curva que surgir dos dados provavelmente terá um "joelho": um ponto onde cada watt a menos custa pouco FPS (trecho plano) e um ponto onde cada watt a menos derruba o FPS (trecho íngreme). Esse joelho é o ponto ideal de operação para aquele jogo — o equilíbrio entre eficiência e fluidez.

:::exemplo
Para a Ana, no Cyberpunk 2077, a curva fica assim: 15 W = 38 FPS, 12 W = 36 FPS, 10 W = 28 FPS, 8 W = 19 FPS. O joelho está entre 12 W e 10 W — abaixo de 10 W o FPS despenca. Se a Ana quiser jogar no sofá por uma hora e meia, 12 W entrega quase o mesmo FPS que 15 W com muito menos calor. Esse número é **dela**, com a cena e a versão do Proton que ela usou. O seu número será diferente.
:::

## Resumo

- O impacto do TDP no FPS depende do gargalo: GPU-limitado cai proporcionalmente; CPU-limitado mal se altera.
- MangoHud configurado com `gpu_power` e `frametime` é o laboratório de medição do Deck.
- Frametime estável importa mais que FPS médio; olhe para picos, não só para a média.
- A curva TDP × FPS tem um "joelho" onde eficiência e fluidez se equilibram.
- Testes controlados (mesma cena, mesmo tempo, alternância de TDP) produzem dados confiáveis.

## Exercícios

1. Configure o MangoHud para exibir `gpu_power`, `cpu_power` e `frametime`. Inicie qualquer jogo 3D e observe se o consumo da GPU chega perto do teto de TDP.
2. Escolha um jogo e uma cena fixa. Meça o FPS médio (visual, pelo overlay) em 15 W, 12 W, 10 W e 8 W. Monte uma tabela com os quatro valores.
3. Habilite o log de frametimes com `mangohud --output-file /tmp/bench.csv %command%` e abra o CSV. Identifique o maior frametime registrado — isso foi um stutter visível?
4. Repita o teste do exercício 2 em um jogo 2D ou indie. O impacto do TDP foi maior ou menor que no jogo 3D? Por quê?
5. **Desafio.** Com os dados de frametime em CSV, calcule o frametime médio e identifique quantos frames superaram 33,3 ms (equivalente a menos de 30 FPS). Compare esse contador entre 15 W e 10 W no mesmo jogo. O que dói mais na experiência: a média menor ou os picos acima de 33 ms?