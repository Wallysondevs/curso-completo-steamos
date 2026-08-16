Na parte de trás do Steam Deck, onde seus dedos médio e anular descansam, ficam quatro botões que a maioria dos controles não tem: os **grip buttons** (R4, R5, L4 e L5). Eles são a resposta da Valve a um problema clássico — num shooter ou num jogo de ação rápida, tirar o polegar da alavanca pra apertar um botão de frente custa tempo e mira. Com os grips, você ganha quatro entradas extras sem mover os polegares de lugar.

:::objetivos
- Identificar os quatro grip buttons do deck e seus nomes padrão
- Mapear um grip para uma ação ou tecla no configurador
- Usar grips para substituir o clique das alavancas (L3/R3)
- Verificar a leitura dos botões via evtest
:::

## Quatro botões que vivem atrás

O deck tem, na traseira, quatro botões de pás: `L4` e `L5` do lado esquerdo, `R4` e `R5` do lado direito. O número mais baixo fica mais próximo do centro do console; o mais alto, mais para as bordas. Por padrão, na maioria dos templates, `R4` e `L4` não fazem nada — é um espaço em branco proposital que a Valve deixa para você preencher.

Eles não são "botões extras" no sentido físico de um circuito novo — são entradas digitais como qualquer outra, apenas posicionadas onde os dedos que não fazem nada podem alcançá-las. É essa posição que os torna valiosos, não a eletrônica.

<terminal>
$ steam -gamepadui 2>/dev/null &
[1] 4821
</terminal>

O `steam -gamepadui` abre o Steam já no modo de interface para controle (a chamada "Big Picture" moderna do deck). Embora a configuração de grips em si seja feita pelos menus, subir o Steam assim é o jeito de garantir que você está na interface certa quando for mapear botões. Na prática, no deck, você já vive dentro dela o tempo todo.

## Mapeando um grip para uma ação

O fluxo é: dentro do configurador de controles do jogo, escolha o grip (por exemplo `R4`), toque em **Add Command** e atribua uma ação da lista — que pode ser uma tecla do teclado (`Space`, `E`), um botão do controle (`A`, `B`) ou um comando composto.

Um caso clássico: em jogos que usam `Sprint` ou `Correr` no clique da alavanca (`L3`/`R3`), mover isso para um grip elimina o desgaste do clique e evita o erro de apertar a alavanca sem querer no meio da troca de direção.

<terminal>
$ cat ~/lab/layout-grip.vdf 2>/dev/null | head -30
"controller_mappings"
{
        "group"
        {
                "id"                    "4"
                "mode"                  "four_buttons"
                "inputs"
                {
                        "button_a"
                        {
                                "activators"    { "Full_Press" { "bindings" { "binding" "key_press SPACE, Sprint" } } }
                        }
                }
        }
}
</terminal>

Esse trecho (editado para fins didáticos) mostra a anatomia interna de um mapeamento: o grip pertence a um `group` com `mode` `four_buttons`, e cada botão tem um ou mais `activators` — gatilhos de ativação como `Full_Press` — que por sua vez carregam um `binding`, aqui um `key_press` da tecla `SPACE` rotulada como "Sprint". Você não precisa escrever isso à mão; a interface gera exatamente essa estrutura ao salvar.

## Grip como substituto de L3/R3

O clique das alavancas é uma das entradas mais usadas e mais desconfortáveis do deck. Dois usos típicos de grip resolvem isso de uma vez:

- **R4 = clique do analógico direito (R3).** Em FPS, o R3 costuma ser "mirar / mirar com a arma". Mover para o R4 deixa a mira firme e evita mudar a sensibilidade sem querer.
- **L4 = clique do analógico esquerdo (L3).** O L3 é o clássico "correr". No grip, correr deixa de interferir no movimento.

<terminal>
$ grep -i "grip\|back button\|paddle" ~/.local/share/Steam/logs/controller_ui.txt 2>/dev/null | tail -6
[Steam Input] R4 mapped to key_press SPACE
[Steam Input] L4 mapped to button_a
[Steam Input] Grip zone calibrated (R4, R5, L4, L5)
</terminal>

A linha final mostra que o Steam Input calibra os quatro grips como uma "zona" única. Isso importa porque a posição dos dedos varia de mão para mão — a calibração ajusta o ponto exato em que uma pressão conta como acionamento.

:::dica
Se seus dedos médios encostam nos grips sem querer e disparam ações acidentais, em vez de desmapear o botão, experimente primeiro ajustar a **zona morta** do grip no configurador. Muitas vezes o problema é sensibilidade, não o mapeamento.
:::

## Vendo os grips pelo olhar do kernel

Abaixo de toda a camada do Steam Input, o hardware do deck é exposto ao Linux como um dispositivo de entrada comum. O `evtest` lê os eventos crus de qualquer `/dev/input/event*` e deixa você "ver" os botões físicos sendo pressionados em tempo real.

<terminal>
$ sudo evtest 2>/dev/null | head -20
No device specified, trying to scan all of /dev/input/event*
Available devices:
/dev/input/event0:      Power Button
/dev/input/event1:      AT Translated Set 2 keyboard
/dev/input/event2:      Valve Software Steam Controller
/dev/input/event3:      Valve Software Steam Controller
/dev/input/event4:      Valve Software Steam Controller
Select the device event number [0-5]: 
</terminal>

O deck aparece, para o kernel, como vários dispositivos "Valve Software Steam Controller" — normalmente um por grupo de entradas (botões, alavancas, touchpads, giroscópio). Isso reforça a ideia da seção anterior: o controle do deck não é um XInput nativo; é um conjunto de dispositivos de entrada que o Steam Input entende e depois traduz.

<terminal>
$ sudo evtest /dev/input/event2 2>/dev/null | head -12
Input driver version is 1.0.1
Input device ID: bus 0x3 vendor 0x28de product 0x1205 version 0x0111
Input device name: "Valve Software Steam Controller"
Supported events:
  Event type 0 (EV_SYN)
  Event type 1 (EV_KEY)
    Event code 304 (BTN_SOUTH)
    Event code 305 (BTN_EAST)
    Event code 307 (BTN_NORTH)
    Event code 308 (BTN_WEST)
```

Aqui o `evtest` lista os códigos de botão que aquele dispositivo emite. Os grips, em muitos firmwares, aparecem como códigos `BTN_TRIGGER_HAPPY` (uma faixa de botões genéricos) — é assim que o hardware expõe quatro botões "não padronizados" para o kernel antes de o Steam Input dar nomes bonitos como R4 e R5.

:::atencao
Nunca considere a numeração de `/dev/input/event*` estável: ela pode mudar entre boots e entre atualizações de sistema. Para automatizar, identifique o dispositivo pelo nome (`Valve Software Steam Controller`) e não pelo número do evento.
:::

## Resumo

- O deck tem quatro grips traseiros: L4/L5 à esquerda e R4/R5 à direita.
- Grips são valiosos por posição: permitem agir sem tirar o polegar das alavancas.
- Mover Sprint/Correr de L3/R3 para um grip reduz desconforto e acionamentos acidentais.
- Cada botão tem `activators` (como Full_Press) que disparam `bindings`, visíveis no `.vdf`.
- No kernel, o controle aparece como vários dispositivos "Valve Software Steam Controller", e os grips usam códigos genéricos.

## Exercícios

1. No configurador de um jogo de tiro, atribua `R4` à tecla `Space` (ou a ação de pular) e jogue por dez minutos. Observe se a posição do dedo é natural.
2. Rode `sudo evtest` sem argumentos e anote quantos dispositivos "Valve Software Steam Controller" aparecem e seus números de evento.
3. Com `sudo evtest /dev/input/eventN`, pressione os quatro grips e assista aos eventos EV_KEY aparecerem. Registre o código de cada um.
4. Mova a ação de "correr" de `L3` para `L4` num jogo de mundo aberto e compare a ocorrência de acionamentos acidentais antes e depois.
5. **Desafio.** Usando `evtest` para ler um dos dispositivos, segure um grip e observe o padrão de eventos `EV_KEY`/`BTN_TRIGGER_HAPPY`. Depois explique, com base no que viu, por que o Steam Input precisa da camada de tradução para que um jogo qualquer entenda esse botão.
