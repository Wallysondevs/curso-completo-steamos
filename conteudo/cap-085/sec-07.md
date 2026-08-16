Dentro do Steam Deck, a comunicação entre a placa-mãe, a tela e os demais periféricos é feita quase toda por **cabos flat** — também chamados de **cabo flex**, **FPC** (*Flexible Printed Circuit*, ou seja, "circuito impresso flexível") ou simplesmente *flat cable*. Diferente de um fio redondo comum, o flat é uma lâmina fina e larga, com trilhas de cobre impressas sobre uma base de plástico (geralmente poliimida). Essa geometria permite que ele dobre em lugares apertados e que dezenas de vias sejam conectadas de uma vez só através de um único conector.

Nesta seção você vai conhecer os três tipos de conexão que aparecem com mais frequência na manutenção do aparelho: o **conector ZIF** do display (com tranca *flip-up*), o flat do touch/digitizador e os conectores retos *push-in*. Também vamos ver como abrir e fechar cada trava sem danificar o flex, como inspecionar trilhas dobradas ou rasgadas, como limpar contatos com isopropanol e como diagnosticar a perda do touchscreen pela linha de comando.

Antes de prosseguir, vale reler a [seção da tela](#/cap-085/sec-06), já que o conector do display é o destino final de boa parte dos cuidados descritos aqui.

:::objetivos
- Identificar os três tipos de conector flat presentes no Steam Deck: ZIF *flip-up*, flat do digitizador e *push-in* reto.
- Abrir e fechar trancas ZIF sem forçar ou rasgar o flex.
- Inspecionar trilhas dobradas, rasgadas ou oxidadas e limpar contatos com isopropanol.
- Diagnosticar, via terminal, quando o touchscreen deixa de funcionar por flat do digitizador desconectado.
:::

---

## Conector ZIF do display e a tranca flip-up

O conector que liga a tela à placa-mãe é do tipo **ZIF** (*Zero Insertion Force*, "força de inserção zero"). Isso significa que, quando a trava está aberta, o cabo entra e sai sem atrito — você não empurra nada contra resistência. A trava é do estilo ***flip-up***: uma barra plástica (ou metálica) que se levanta em dobradiça, liberando o encaixe, e que se abaixa para prender o flat no lugar.

:::atencao
As trancas ZIF são **extremamente frágeis**. A barra *flip-up* não foi feita para ser puxada com unha, chave de fenda ou pinça pela ponta errada — isso quebra as dobradiças laterais. Levante-a sempre **por igual**, usando uma espátula de plástico macio (spudger) sob as duas laterais ao mesmo tempo, ou a ponta cega de uma pinça apoiada no centro. Um clique suave ao fechar é normal; um estalo seco ao abrir pode ser a dobradiça indo embora.
:::

O procedimento recomendado é:

1. Desligue o aparelho e **desconecte a bateria** antes de mexer em qualquer flex.
2. Localize o conector do display, geralmente protegido por uma fita adesiva ou por uma abraçadeira de plástico.
3. Com o spudger, levante a barra *flip-up* pelas laterais até ela ficar na vertical (ou levemente inclinada para trás).
4. Puxe o flat pelo corpo do cabo, nunca pelas trilhas expostas na ponta.
5. Para reconectar, insira o flat reto, alinhado, até o fundo (a linha de referência impressa no flex deve encostar na boca do conector).
6. Abaixe a barra *flip-up* devagar e confirme que ela travou dos dois lados.

O flat do display do Steam Deck carrega alimentação do backlight, sinais de imagem (eDP/DisplayPort embarcado) e dados de controle. Por isso ele é mais largo e tem mais vias que um flat comum de teclado.

---

## O flat do touch e os conectores retos push-in

O **digitizador** (a camada sensível ao toque, colada sobre o painel LCD) tem seu próprio flat, mais fino e com menos vias que o do display. Esse cabo sobe pela lateral do painel e se conecta à placa-mãe em um conector que, dependendo da revisão, pode ser outro ZIF *flip-up* ou um conector **reto *push-in***.

O *push-in* (às vezes chamado de *board-to-board* ou *FPC lock*) não tem barra móvel: o cabo é simplesmente inserido e preso por um mecanismo interno de pressão, ou por uma tampa deslizante que se desloca na horizontal. A regra é a mesma do ZIF: **nunca force**. Se o flat não entra, é porque a trava de deslize não foi puxada para fora antes, ou porque você está tentando inserir inclinado.

Áudio, controles (analógicos/botões) e alguns sensores também usam conectores retos *push-in*, mas o mais delicado de todos continua sendo o do digitizador, porque a trilha é longa, estreita e passa por uma região de dobra quando a tela é remontada.

---

## Abrindo e fechando travas sem danificar

A manutenção de flats se resume a uma sequência de movimentos lentos e sem pressa. Um bom hábito é fotografar cada conector **antes** de abrir, para saber a orientação correta da barra e a posição da linha de referência do cabo na remontagem.

:::atencao
Jamais use a ponta metálica da pinça diretamente sobre as trilhas douradas do flat. O cobre exposto risca com facilidade, e um risco profundo **interrompe a via**, deixando a tela ou o touch parcialmente mortos. Ao segurar o flex, use os dedos (limpos e secos) pelas bordas laterais ou a pinça pela parte de trás, onde não há contatos.
:::

Ao fechar uma trava ZIF, apoie o dedo na parte central da barra e pressione até ouvir o clique. Depois, passe uma unha levemente sob as extremidades para confirmar que ambas estão presas. Uma barra travada só de um lado deixa o flat solto na outra borda, o que pode causar faixas verticais na imagem, toque intermitente ou ausência total de sinal.

Para o *push-in* deslizante, o erro mais comum é reintroduzir o cabo com a tampa na posição "fechada". Puxe a tampa primeiro (na direção da seta impressa no conector ou para fora do cabo), insira o flat até o fundo e, só então, empurre a tampa de volta.

---

## Inspeção de trilhas e limpeza de contatos

Antes de culpar uma peça nova por defeito, inspecione o flat antigo contra a luz:

- **Dobra forte (vinco):** uma dobra em 180° pode quebrar a microtrilha internamente, sem sinal visível na superfície. Em flats que serão substituídos, isso costuma ser o ponto de falha.
- **Rasgo ou corte:** qualquer fenda na borda que alcance uma trilha interrompe a via correspondente.
- **Oxidação/escurecimento:** contatos dourados esverdeados ou foscos perdem condução.
- **Delaminação:** o plástico de cobertura levantado das trilhas é sinal de superaquecimento ou de puxão incorreto.

A limpeza dos **contatos** é feita com **isopropanol** (idealmente 99%) e um cotonete ou pincel antiestático. Esfregue suavemente sobre os dedos dourados do flex e, se possível, sobre os contatos internos do conector (com o aparelho desligado). Deixe evaporar por completo antes de reconectar — o isopropanol evapora em segundos e não deixa resíduo, ao contrário de álcool comum, que tem água e aditivos.

---

## Diagnosticando o touch pela linha de comando

Quando o painel liga e mostra imagem, mas o toque não responde, o suspeito número um é o flat do digitizador desconectado ou mal encaixado. O SteamOS (base Arch, versão 3.6) oferece ferramentas prontas para confirmar se o sistema enxerga o controlador de toque.

Liste os dispositivos de entrada reconhecidos pelo kernel:

```terminal
$ cat /proc/bus/input/devices | grep -iA3 touch
## Saída esperada quando o digitizador está conectado:
N: Name="Wacom HID 4860 Finger"
P: Phys=usb-0000:03:00.3-1/input0
H: Handlers=mouse0 event4
B: PROP=0
```

Se o flat estiver solto, o controlador de toque **não aparece** nessa lista. Outra forma é usar o `libinput`:

```terminal
$ libinput list-devices | grep -iB2 -A4 touch
## Sem o digitizador conectado, a busca não retorna nenhum dispositivo de toque.
Device:           Wacom HID 4860 Finger
Kernel:           /dev/input/event4
Group:            5
Capabilities:     touch
```

O log do kernel também registra a detecção quando a unidade *hid-multitouch* encontra o controlador:

```terminal
$ sudo dmesg | grep -i multitouch
## Com o digitizador conectado, você vê linhas como:
[    3.214581] input: Wacom HID 4860 Finger as /devices/pci0000:00/0000:00:08.1/0000:03:00.3/usb1/1-1/1-1:1.0/0003:056A:4860.0001/input/input5
[    3.214702] hid-multitouch 0003:056A:4860.0001: input,hidraw0: USB HID v1.11 Device [Wacom HID 4860 Finger] on usb-0000:03:00.3-1/input0
```

A ausência dessas linhas após uma troca de tela, somada à imagem funcionando normalmente, indica fortemente que o flat do touch não está encaixado. Reabra o aparelho, confira a trava do conector do digitizador e refaça a inserção. Depois, valide novamente com `cat /proc/bus/input/devices` ou com um teste rápido de toque na interface.

Para acompanhar em tempo real os eventos de toque (útil para confirmar que o controlador existe, mas não gera eventos):

```terminal
$ sudo libinput debug-events --device /dev/input/event4
## Toque na tela; se o flat estiver bom, aparecem linhas TOUCH_DOWN/TOUCH_UP:
 event4   TOUCH_DOWN    +2.00s   0 (0) 1200.00/600.00
 event4   TOUCH_UP      +2.10s
```

---

## Principais conectores flat do Steam Deck

A tabela abaixo resume os conectores flat mais comuns durante a manutenção de tela e periféricos:

| Conexão | Função | Vias (aprox.) | Tipo de trava |
|---|---|---|---|
| Flat do display (eDP) | Sinal de imagem + backlight | 30–40 | ZIF *flip-up* |
| Flat do digitizador | Toque (touchscreen) | 10–12 | ZIF *flip-up* ou *push-in* |
| Flat dos analógicos/botões | Controles das laterais | 6–12 | *push-in* reto |
| Flat do áudio/headphone | Placa de áudio e jacks | 8–16 | *push-in* |
| Flat dos sensores (girômetro) | Sensor de movimento | 4–8 | *push-in* |

Os números de vias variam conforme a revisão de hardware; o importante é reconhecer o **tipo de trava** para abrir corretamente.

---

## Resumo

- O conector do display é **ZIF** com trava *flip-up*: levante a barra por igual antes de puxar o flat.
- O flat do **digitizador** é mais fino e usa ZIF ou *push-in*; a desconexão dele derruba o touch, mas não a imagem.
- Conectores retos **push-in** prendem o cabo por pressão ou tampa deslizante; insira sempre com a trava liberada.
- Inspecione flats contra a luz procurando **vinco, rasgo, oxidação e delaminação**; limpe contatos apenas com isopropanol.
- Use `cat /proc/bus/input/devices`, `libinput list-devices` e `dmesg | grep multitouch` para confirmar se o touch foi detectado.
- Uma trava ZIF fechada só de um lado causa toque intermitente ou faixas na imagem.

## Exercícios

1. Descreva, em ordem, os passos para abrir e fechar o conector ZIF do display sem quebrar a barra *flip-up*.
2. Qual comando lista os dispositivos de entrada do kernel e qual saída indica que o controlador de toque **não** está presente?
3. Explique a diferença entre um conector ZIF *flip-up* e um conector reto *push-in*, citando um exemplo de uso de cada no Steam Deck.
4. Liste quatro tipos de dano que uma inspeção visual contra a luz pode revelar em um flat, e diga qual solvente usar na limpeza dos contatos.
5. **Integrador:** após trocar a tela, o painel exibe imagem, mas o toque não responde. Monte um roteiro completo de diagnóstico: o que inspecionar fisicamente no flat do digitizador, quais comandos rodar no terminal (com a saída esperada em cada cenário) e como confirmar a correção após reconectar.
