Os dois touchpads que ladeiam a tela do Steam Deck são herdeiros diretos do Steam Controller, lançado pela Valve em 2015. Na época, a ideia de substituir alavancas por trackpads hápticos foi recebida com ceticismo. Hoje, quase uma década depois, são esses mesmos touchpads que fazem o deck ser um dispositivo de jogo viável para gêneros que nunca deram certo em console: estratégia, point-and-click, simuladores de voo, e qualquer coisa que dependa de um cursor de precisão.

:::objetivos
- Entender a herança tecnológica do Steam Controller nos touchpads do deck
- Configurar o touchpad como mouse, conjunto de botões ou menu radial
- Ajustar sensibilidade, zona morta e resposta háptica (haptics)
- Ler a posição bruta do touchpad via evtest
:::

## De onde vieram os touchpads

O Steam Controller foi um fracasso comercial e um triunfo de engenharia. Vendeu pouco — a Valve liquidou o estoque em 2019 por US$ 5 a unidade — mas estabeleceu três princípios que o deck herdou integralmente: superfície sensível ao toque com resposta háptica, giroscópio sincronizado ao toque do touchpad, e software de configuração que trata cada entrada como uma "ação" abstrata, não como um botão.

Os touchpads do deck têm 32,5 mm de largura cada um, formato quadrado, e são capazes de detectar toque, posição do dedo (absoluta e relativa), pressão e até movimento do dedo quando o touchpad está "clicado". A resposta háptica é gerada por atuadores eletromagnéticos que vibram em frequências ajustáveis — não é o "motorzinho" genérico dos controles comuns.

<terminal>
$ ls -d /sys/class/input/event*/device/name 2>/dev/null | while read f; do
  echo -n "$f: "; cat "$f" 2>/dev/null
done | grep -i "Valve\|steam"
/sys/class/input/event2/device/name: Valve Software Steam Controller
/sys/class/input/event3/device/name: Valve Software Steam Controller
</terminal>

O deck expõe vários nós de dispositivo ao kernel. Dois deles carregam o nome `Valve Software Steam Controller` — um tipicamente gerencia botões e o outro gerencia touchpads e giroscópio. Não existe um "driver de touchpad" separado; o hardware inteiro do controle é tratado como um único dispositivo composto.

## Touchpad como mouse

A configuração mais útil (e a padrão de fábrica no template "Gamepad with Mouse Trackpad") é o touchpad direito operando como mouse. O dedo deslizando na superfície move o cursor; o clique do touchpad equivale ao clique esquerdo do mouse.

<terminal>
$ grep -i "trackpad\|touchpad" ~/.local/share/Steam/logs/controller_ui.txt 2>/dev/null | tail -6
[Steam Input] Right trackpad set as mouse (relative mode)
[Steam Input] Right trackpad sensitivity: 1.20
[Steam Input] Right trackpad acceleration: medium
[Steam Input] Left trackpad set as radial menu
</terminal>

Três parâmetros chave afetam a experiência do touchpad-mouse:

- **Sensitivity (sensibilidade):** Controla quanto o cursor se move para cada milímetro de deslize. Valores entre 1.0 e 1.5 são confortáveis para a maioria dos jogos.
- **Acceleration (aceleração):** Faz o cursor se mover mais quando o deslize é rápido. Em jogos de tiro, aceleração "medium" é um bom meio-termo; em jogos de estratégia, muitos preferem desligada.
- **Trackball mode:** Ativa um "efeito de inércia" — você desliza e solta o dedo, e o cursor continua girando como uma bola de trackball física, perdendo velocidade aos poucos.

:::dica
O trackball mode com fricção baixa é excelente para navegar menus e mapas grandes. Ative o "Friction" em "Low" e experimente dar "petelecos" curtos no touchpad em vez de arrastar o dedo o tempo todo.
:::

## Touchpad como botoeira ou menu radial

O touchpad esquerdo, no template de fábrica, costuma vir como menu radial. É um círculo dividido em fatias (normalmente de 4 a 12), cada uma associada a uma tecla ou ação. Você toca na direção da fatia e ela dispara.

A utilidade disso aparece rápido: num RPG com barra de atalhos de 1 a 9, você coloca os itens favoritos num radial de 8 fatias e acessa qualquer um sem tirar o polegar esquerdo da posição de repouso.

<terminal>
$ cat << 'EOF' > /tmp/radial_test.vdf
// Exemplo conceitual: radial menu de 8 direções
// cada slice dispara uma tecla numérica
"radial_menu"
{
    "menu_style"    "radial"
    "slices"        "8"
    "slice_0"       { "binding" "key_press 1" "label" "Poção de Vida" }
    "slice_1"       { "binding" "key_press 2" "label" "Poção de Mana" }
    "slice_2"       { "binding" "key_press 3" "label" "Bomba" }
    "slice_3"       { "binding" "key_press 4" "label" "Mapa" }
    "slice_4"       { "binding" "key_press 5" "label" "Montaria" }
    "slice_5"       { "binding" "key_press 6" "label" "Inventário" }
    "slice_6"       { "binding" "key_press 7" "label" "Diário" }
    "slice_7"       { "binding" "key_press 8" "label" "Sistema" }
}
EOF
</terminal>

Esse `.vdf` conceitual mostra a anatomia de um radial de 8 direções. Cada fatia (`slice_0` a `slice_7`) leva um `binding` (a tecla que ela dispara) e um `label` (o texto que aparece na sobreposição visual do deck). A interface gráfica escreve exatamente essa estrutura ao salvar.

O radial pode ter de 2 a 20 fatias. Na prática, mais de 12 começa a ficar difícil de acertar com o polegar — o touchpad é grande, mas o polegar tem área de contato generosa e a precisão angular cai.

## Lendo a posição do toque

Quando o dedo encosta no touchpad, o kernel recebe eventos de posição absoluta. O `evtest` mostra isso como eventos `EV_ABS` com código `ABS_X` e `ABS_Y`.

<terminal>
$ sudo timeout 5 evtest /dev/input/event3 2>&1 | grep -E "ABS_X|ABS_Y" | head -10
Event: time 1736974812.123456, type 3 (EV_ABS), code 0 (ABS_X), value 1840
Event: time 1736974812.123456, type 3 (EV_ABS), code 1 (ABS_Y), value 980
Event: time 1736974812.133567, type 3 (EV_ABS), code 0 (ABS_X), value 1835
Event: time 1736974812.133567, type 3 (EV_ABS), code 1 (ABS_Y), value 975
Event: time 1736974812.143678, type 3 (EV_ABS), code 0 (ABS_X), value 1828
Event: time 1736974812.143678, type 3 (EV_ABS), code 1 (ABS_Y), value 968
</terminal>

Os valores vão tipicamente de 0 a cerca de 3270 em cada eixo. A cada 10 milissegundos, a posição do dedo é amostrada. O Steam Input lê esse fluxo e o converte, dependendo do modo, em movimento relativo de mouse, ângulo de radial ou zona de toque. É essa leitura crua que explica por que o touchpad pode ser tão versátil: o hardware manda coordenadas, e o software decide o que elas significam.

## Resumo

- Os touchpads do deck são herdeiros diretos do Steam Controller de 2015, com atuadores hápticos eletromagnéticos.
- O touchpad direito como mouse, com trackball mode, é a configuração mais usada e resolve o problema do cursor em console.
- O touchpad esquerdo como menu radial permite acesso a atalhos sem mover o polegar.
- A resposta háptica não é um motor genérico — é gerada por atuadores de frequência ajustável.
- A posição do toque chega ao kernel via eventos `EV_ABS` com coordenadas `ABS_X`/`ABS_Y`.

## Exercícios

1. Num jogo que exija cursor (estratégia ou point-and-click), ative o trackball mode com fricção "Low" e jogue por quinze minutos. Compare com o modo mouse padrão.
2. Crie um menu radial de 6 fatias no touchpad esquerdo para um RPG e mapeie itens frequentes (mapa, inventário, poção).
3. Use `sudo timeout 10 evtest /dev/input/eventN` para capturar a posição do dedo no touchpad e anote os valores máximo e mínimo de `ABS_X` e `ABS_Y`.
4. No configurador, alterne entre resposta háptica "High", "Medium", "Low" e "Off" e sinta a diferença ao navegar menus com o touchpad.
5. **Desafio.** Com `evtest` capturando eventos de um touchpad, toque em cada canto da superfície e registre as coordenadas. Depois calcule a resolução efetiva em pontos por milímetro (o touchpad mede aproximadamente 32,5 mm de lado). Por que a resolução do sensor é muito maior que a precisão de um polegar humano?