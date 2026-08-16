Se existe uma única funcionalidade que torna o Steam Deck viável como plataforma de jogos, é o FSR integrado ao Gamescope. Rodar um título AAA a 1280×800 no painel nativo já é apertado para a APU customizada da Valve, e o que torna jogável um título pesado a 30 ou 40 FPS é justamente a capacidade de renderizar numa resolução menor e entregar o quadro escalado com qualidade que não parece um borrão. E o melhor: você não precisa configurar nada dentro do jogo.

:::objetivos
- Entender o funcionamento do AMD FidelityFX Super Resolution (FSR 1.0) embutido no Gamescope
- Configurar jogos com resolução interna reduzida e upscaling via Steam Deck UI
- Usar a flag `--fsr` na linha de comando para upscaling global
- Comparar o custo visual do FSR com o ganho de performance
- Relacionar FSR, resolução interna (`-w`/`-h`) e resolução externa (`-W`/`-H`)
:::

## Por que upscaling importa num portátil

O Steam Deck renderiza num painel de 1280×800 pixels — menos de 1 megapixel. Parece modesto comparado aos 8,3 megapixels de um monitor 4K, mas a APU AMD Van Gogh que move o Deck tem 1,6 teraflops de poder de computação, e isso precisa ser dividido entre geometria, iluminação, pós-processamento e texturas. Em jogos pesados como *Cyberpunk 2077* ou *Elden Ring*, rodar a 800p nativo pode derrubar o framerate abaixo do aceitável.

A solução clássica é baixar a resolução dentro do jogo para 960×600 ou até 640×400, mas isso entrega um borrão — o painel de 800p precisa interpolar 60% mais pixels do que realmente recebeu, e o resultado parece fora de foco. O FSR resolve isso com um algoritmo de upscaling espacial que detecta bordas e reconstrói detalhes com muito mais inteligência que um filtro bilinear.

:::info
O FSR 1.0 integrado ao Gamescope é a versão espacial do algoritmo — ele opera quadro a quadro, sem informações de quadros anteriores. O FSR 2.0 e superiores usam dados temporais (motion vectors, depth buffer) e precisam ser implementados dentro do jogo. O Gamescope só oferece FSR 1.0, mas com a vantagem de funcionar com **qualquer** jogo ou aplicação, sem exceção.
:::

## A matemática do FSR no Gamescope

O funcionamento é simples: você define uma resolução interna menor que a externa, e o Gamescope aplica o filtro FSR no upscaling. Na linha de comando, a resolução interna é `-w`/`-h` e a externa é `-W`/`-H`. Quando a interna é menor e a flag `--fsr` está presente, o upscaling usa FSR em vez de um filtro bilinear barato.

```terminal
$ gamescope -w 960 -h 600 -W 1280 -H 800 --fsr -- glxgears
```

Aqui, `glxgears` desenha a 960×600. O Gamescope recebe esse framebuffer, aplica o FSR para escalar até 1280×800 e entrega o resultado no painel. O programa filho nem sabe que foi escalado — ele acredita estar rodando numa tela 960×600.

Na prática do Steam Deck, você não digita essa linha. O controle de resolução interna fica na barra de performance (QAM — Quick Access Menu), no controle deslizante de *Scaling Filter*. Quando você seleciona FSR ali, o Steam configura automaticamente o Gamescope com os parâmetros adequados para a resolução que você escolheu no jogo.

## Medindo o impacto com vkmark

O `vkmark` é um benchmark Vulkan leve, ideal para testar cenários de upscaling sem depender de um jogo comercial. Ele renderiza cenas sintéticas e reporta o framerate médio. Vamos comparar três configurações:

```terminal
$ vkmark --benchmark 60
==========================================
    vkmark version 2023.04
==========================================
[vertex] device-local:                            FPS:  187
[texture] anisotropy:                             FPS:  142
[shading] gouraud:                                FPS:  132
[effect2d] blur:                                  FPS:   63
                                    vkmark score:  131
==========================================
```

Esta é a execução base a 1280×800 nativo. Agora reduzimos a resolução interna pela metade (640×400) e escalamos com filtro bilinear vs. FSR:

```terminal
$ gamescope -w 640 -h 400 -W 1280 -H 800 -f -- vkmark --benchmark 60
```

No modo bilinear (sem `--fsr`), o ganho de performance é grande — o benchmark salta para cerca de 210 pontos — mas o resultado visual mostra bordas serrilhadas e perda de nitidez em texturas. Com `--fsr`:

```terminal
$ gamescope -w 640 -h 400 -W 1280 -H 800 -f --fsr -- vkmark --benchmark 60
```

O framerate é o mesmo (a carga de renderização é idêntica), mas a qualidade visual sobe consideravelmente: as bordas das janelas do benchmark ficam mais definidas e o texto pequeno permanece legível.

:::dica
O custo computacional do FSR 1.0 é irrisório — menos de 0,2 ms de GPU time no Steam Deck. Isso significa que você pode deixá-lo ligado o tempo todo sem impacto mensurável de performance. O verdadeiro ganho vem da resolução interna menor, não do filtro em si.
:::

## FSR, TDP e a equação da bateria

O FSR não é só sobre framerate. Ele tem um efeito colateral importante no Steam Deck: ao reduzir a carga na GPU, você pode reduzir o TDP (Thermal Design Power) sem perder performance, o que alonga a duração da bateria. O raciocínio é simples: se um jogo roda a 40 FPS a 800p com GPU a 90% de uso, rodar a 600p com FSR talvez bata os mesmos 40 FPS com GPU a 60%, e aí você pode limitar o TDP da APU para 8 W em vez de 12 W, ganhando de 30 a 45 minutos de bateria extra.

```terminal
$ cat /sys/class/hwmon/hwmon5/power1_average
9864000
```

Essa leitura mostra o consumo instantâneo da APU em microwatts (~9,86 W). Com FSR ativo e resolução reduzida, esse valor pode cair de 2 a 4 W em jogos GPU-bound, dependendo do título.

:::atencao
Nem todo jogo se beneficia de FSR. Se o jogo for CPU-bound — como *Factorio*, *RimWorld* ou emuladores de Switch — reduzir a resolução não vai melhorar o framerate porque o gargalo está em outro lugar. Nesses casos, o FSR apenas degrada a imagem sem benefício. Use o overlay de performance (nível 4) para ver se a GPU está acima de 85% antes de ativar o FSR.
:::

## Resumo

- O Gamescope integra FSR 1.0 como filtro de upscaling disponível para qualquer aplicação, sem suporte do jogo.
- A flag `--fsr` ativa o FSR; a resolução interna (`-w`/`-h`) menor que a externa (`-W`/`-H`) aciona o upscaling.
- O FSR 1.0 é um algoritmo espacial puro, sem dados temporais; funciona quadro a quadro com custo computacional praticamente zero.
- O ganho real vem da redução de resolução interna: menos pixels para renderizar, mais FPS ou menos consumo de bateria.
- Jogos CPU-bound não se beneficiam de FSR; verifique o overlay de performance antes de ativar.

## Exercícios

1. Execute `vkmark --benchmark 60` nativo (800p) e anote o score. Depois execute dentro do Gamescope com `-w 640 -h 400` sem FSR e com `--fsr`. Compare os três scores e a qualidade visual percebida.
2. No Modo Jogo do Steam Deck, abra um jogo 3D pesado. No QAM, alterne entre os filtros Linear, Nearest e FSR com resolução interna a 50%. Descreva a diferença visual entre os três.
3. Com `mangohud` ativo (configure `MANGOHUD_CONFIG=fps,gpu_power`), jogue por 5 minutos com e sem FSR. Compare o consumo médio de GPU reportado pelo MangoHud.
4. Leia o arquivo `/sys/class/hwmon/hwmon5/power1_average` durante uma sessão de jogo com e sem FSR. Converta os microwatts para watts e estime o impacto na bateria de 40 Wh do Steam Deck.
5. **Desafio.** Escreva um script que lance um jogo com Gamescope em duas configurações (nativo e FSR), capture o framerate com MangoHud por 60 segundos, e produza uma tabela comparativa com FPS médio, 1% low e consumo de GPU. Rode com `vkmark` e um jogo real.