Ajustar desempenho sem medir é o mesmo erro que o capítulo sobre benchmarking descreveu com outras palavras — e este capítulo herdou essa lição. As ferramentas desta seção não melhoram o desempenho diretamente; elas *revelam* o desempenho, mostrando na tela o que está acontecendo por baixo. Sem elas, você está otimizando no escuro, confiando na sensação de "ficou melhor". São o instrumento de medição de quem leva o ajuste a sério.

:::objetivos
- Usar o MangoHud para exibir FPS, temperatura e uso de CPU/GPU em jogos
- Configurar o GOverlay para personalizar o MangoHud graficamente
- Controlar clocks e TDP com o CoreCtrl e entender seus limites
- Entender o papel do Gamescope como compositor de jogos do SteamOS
:::

## MangoHud: o velocímetro do jogo

O [MangoHud](https://github.com/flightlessmango/MangoHud) é um overlay de desempenho para aplicações Vulkan e OpenGL. Ele desenha, em cima do jogo, informações como FPS, tempo de quadro, uso de CPU/GPU, temperatura, consumo de energia e voltagem — exatamente os números que você precisa para saber se seu ajuste surtiu efeito. No Steam Deck ele já vem pré-instalado e pode ser ativado pelo menu de desempenho da Steam, mas a versão "crua" e configurável é o MangoHud.

A ativação em qualquer jogo usa a variável de ambiente:

```terminal
$ MANGOHUD=1 %command%
```

Dentro do cliente Steam, você coloca isso nas opções de inicialização do jogo. Alternativamente, nos jogos não-Steam gerenciados pelo Lutris ou Heroic, há um toggle específico "Enable MangoHud" nas configurações do jogo.

O MangoHud mostra, no canto superior esquerdo por padrão, uma coluna de métricas que você pode expandir ou reduzir. Para quem só quer FPS, o overlay da própria Steam resolve; o MangoHud serve quando você precisa de mais — temperatura, frametime (o gráfico que revela *stutter*), uso de memória e energia.

```terminal
$ cat ~/.config/MangoHud/MangoHud.conf
fps_limit=0
fps
frametime
cpu_stats
gpu_stats
temp
```

O arquivo de configuração controla quais métricas aparecem. É texto puro, e cada linha liga ou desliga uma métrica. Você pode editá-lo diretamente, mas o GOverlay (abaixo) torna o processo visual.

:::nota
Frametime importa mais que FPS médio. Um jogo a 60 FPS que tem picos de frametime "parece" menos fluido que um a 45 FPS constante. O MangoHud desenha o gráfico de frametime, e é nele — não no número de FPS — que você detecta *stutter* real.
:::

## GOverlay: configurando o MangoHud sem editar texto

O [GOverlay](https://github.com/benjamimgois/goverlay) é a interface gráfica oficial para editar a configuração do MangoHud (e do rival vkBasalt). Em vez de editar `MangoHud.conf` à mão, você alterna checkboxes, posiciona o overlay arrastando na tela e define cores e fontes.

```terminal
$ flatpak install flathub io.github.benjamimgois.goverlay
```

O GOverlay escreve o arquivo de configuração por você. A vantagem não é só comodidade — é também evitar erros de sintaxe que silenciosamente desativam métricas. Para quem quer o MangoHud posicionado em outro canto, com fonte maior (útil na tela do Deck), ou com um conjunto diferente de métricas por jogo, o GOverlay acelera o processo de horas para minutos.

## CoreCtrl: controle de clocks e TDP

O [CoreCtrl](https://gitlab.com/corectrl/corectrl) é voltado a CPUs e GPUs AMD (que é o coração do Steam Deck), e permite ajustar frequência, voltagem e limites de potência. No Deck, ele é a forma mais direta de fazer *undervolt* e controlar TDP fora dos presets limitados do menu Steam.

```terminal
$ flatpak install flathub org.corectrl.CoreCtrl
```

O CoreCtrl precisa de permissões de root para escrever nos registradores de power management; por isso envolve configurar um polkit rule (`/etc/polkit-1/rules.d/90-corectrl.rules`). A documentação oficial indica o passo a passo exato.

:::perigo
*Undervolt* agressivo e limite de TDP baixo demais podem causar travamentos, artefatos visuais e, em casos extremos, corromper dados se o sistema congela no meio de uma escrita. Faça mudanças pequenas, teste estabilidade por tempo prolongado e mantenha um perfil padrão para reverter rapidamente.
:::

O CoreCtrl complementa — não substitui — o menu de desempenho da Steam. O menu da Steam oferece presets seguros e rápidos; o CoreCtrl oferece controle fino para quem sabe exatamente o que está fazendo e quer extrair o último grau de silício.

## Gamescope: o compositor que tudo sustenta

O [Gamescope](https://github.com/ValveSoftware/gamescope) merece menção não porque você o configura manualmente, mas porque entender seu papel explica muito do comportamento do Deck. É o microcompositor desenvolvido pela Valve para o SteamOS — um Wayland compositor dedicado a rodar um jogo em isolamento, com suporte a upscaling (FSR), frame limiting e modo janela independente da resolução da tela.

O Steam Deck roda todos os jogos dentro do Gamescope por padrão. Isso explica por que você pode, por exemplo, rodar um jogo em 640×480 com FSR upscaling para a resolução nativa — é o Gamescope que faz a ponte entre a resolução interna do jogo e a resolução da tela. Fora do Deck, você pode invocá-lo manualmente:

```terminal
$ gamescope -w 1280 -h 800 -f -- %command%
```

Que força a resolução de 1280×800 a tela cheia (`-f`) para o comando que vier depois. É um recurso raramente necessário no Deck, mas saber que ele existe ajuda a entender de onde vêm as opções de FSR e frame-limit que você usa todos os dias no menu de desempenho.

## Resumo

- MangoHud é o overlay de métricas (FPS, frametime, CPU/GPU, temperatura) para Vulkan/OpenGL.
- Frametime revela *stutter* melhor que FPS médio; o MangoHud desenha ambos.
- GOverlay edita a configuração do MangoHud de forma gráfica, eliminando erro de sintaxe.
- CoreCtrl controla clocks/TDP em hardware AMD e exige polkit configurado.
- Gamescope é o compositor da Valve que habilita FSR e frame-limiting nativos no Deck.

## Exercícios

1. Ative o MangoHud num jogo via `MANGOHUD=1 %command%` e observe frametime e FPS. Há picos de frametime em cenas específicas? Anote onde.
2. Instale o GOverlay, mova o overlay para o canto superior direito e adicione métricas de consumo de energia. Confira no jogo se a mudança apareceu.
3. Abra o menu de desempenho da Steam e compare as opções de FSR e frame-limit com o que o Gamescope oferece por linha de comando. Em que o menu é mais limitado?
4. Instale o CoreCtrl, configure o polkit rule e crie um perfil de TDP 3 W menor que o padrão. Rode um jogo e compare temperatura e frametime com o perfil padrão.
5. **Desafio.** Monte um experimento de benchmarking completo: escolha um jogo, meça com MangoHud o frametime médio numa cena fixa, aplique uma mudança (TDP via CoreCtrl ou ajuste de FSR no Gamescope) e meça de novo. Registre antes/depois num arquivo, como recomenda o capítulo de benchmarking.