Antes de acusar um jogo ou o Steam Input por um controle que não responde, você precisa saber ler o que o kernel está vendo. Duas ferramentas dominam esse diagnóstico: `lsusb`, que lista o que foi conectado, e `evtest`, que mostra os eventos crus em tempo real. Saber usar as duas separa um problema de hardware real de uma simples falha de mapeamento.

:::objetivos
- Listar dispositivos conectados com `lsusb` e ler seus IDs
- Inspecionar os nós de entrada com `udevadm info`
- Capturar eventos crus em tempo real com `evtest`
- Mapear um evento de botão ao código numérico do kernel
:::

## O que o kernel enxerga

`lsusb` pergunta ao barramento USB quais aparelhos estão ligados naquele instante. A saída é compacta, mas carregada de informação:

```terminal
$ lsusb
Bus 001 Device 003: ID 054c:0df2 Sony Corp. DualSense wireless controller (PS5)
Bus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub
Bus 002 Device 002: ID 045e:02ea Microsoft Corp. Xbox One S controller
```

Cada linha traz, nesta ordem: o barramento (`Bus 001`), o endereço (`Device 003`), o par `ID vendedor:produto` e uma descrição amigável. O par de IDs hexadecimais é a chave universal — `054c:0df2` é o DualSense, `045e:02ea` é o Xbox One S, e nenhum driver muda isso.

Para uma visão mais rica, use `lsusb -v` (verbose) ou, melhor ainda, o `udevadm`, que expõe tudo que o udev (o gerenciador de dispositivos) sabe sobre um nó:

```terminal
$ udevadm info -q all -n /dev/input/event5
P: /devices/pci0000:00/0000:00:14.0/usb1/1-1/1-1:1.0/0003:054C:0DF2.0009/input/input9/event5
N: input/event5
E: ID_VENDOR=Sony_Corp
E: ID_MODEL=DualSense_wireless_controller
E: ID_INPUT_JOYSTICK=1
E: ID_INPUT=1
```

A propriedade `ID_INPUT_JOYSTICK=1` é a que importa: ela marca o nó como joystick, e é isso que o Steam Input e os jogos usam para classificá-lo. Um controle pode aparecer no `lsusb`, mas se o `udev` não o marca como entrada, ele não chega ao jogo.

## A ponte entre USB e /dev/input

Cada aparelho de entrada ganha um ou mais nós `event*` em `/dev/input`. O caminho em `/dev/input/by-id` é mais legível porque embute o fabricante e o modelo:

```terminal
$ ls /dev/input/by-id | grep -iE 'sony|microsoft|xbox'
usb-Sony_Corp_DualSense_wireless_controller-event-joystick
usb-Microsoft_Corp_Xbox_One_S_controller-event-joystick
```

O sufixo `-event-joystick` é a pista de que aquele nó é o dispositivo completo, não um subcomponente (alguns controles expõem `event-kbd` separado para o teclado embutido ou o touchpad). Para o diagnóstico, você quer o `-event-joystick`.

## Vendo os eventos em tempo real

`evtest` abre um nó de entrada e imprime cada evento conforme ele acontece. É a ferramenta definitiva para responder "o controle está enviando alguma coisa?".

```terminal
$ sudo evtest
No device specified, trying to scan all of /dev/input/event*
Available devices:
/dev/input/event5:	DualSense wireless controller
/dev/input/event6:	Xbox One S controller
Select the device event number [0-6]: 5
Input driver version is 1.0.1
Input device ID: bus 0x3 vendor 0x54c product 0xdf2 version 0x111
Input device name: "DualSense wireless controller"
Testing ... (interrupt to exit)
Event: time 1731530000.123456, type 3 (EV_ABS), code 0 (ABS_X), value -327
Event: time 1731530000.156789, type 3 (EV_ABS), code 1 (ABS_Y), value 512
Event: time 1731530000.200001, type 1 (EV_KEY), code 304 (BTN_SOUTH), value 1
Event: time 1731530000.245678, type 1 (EV_KEY), code 304 (BTN_SOUTH), value 0
```

Enquanto você mexe no stick e aperta botões, o `evtest` despeja as linhas. Os campos-chave são:

- `type 3 (EV_ABS)` — evento de eixo analógico (stick, gatilho);
- `code 0 (ABS_X)` / `code 1 (ABS_Y)` — qual eixo mudou;
- `type 1 (EV_KEY)` — evento de botão;
- `code 304 (BTN_SOUTH)` — qual botão;
- `value 1` / `value 0` — pressionado e solto.

:::dica
Se você mexe no controle e **nada** aparece no `evtest`, o problema é físico (cabo, rádio, bateria). Se os eventos aparecem mas o jogo não responde, o problema é de mapeamento — Steam Input, perfil errado ou jogo fora do Steam. Essa distinção economiza horas de reinstalação desnecessária.
:::

## Interpretando os códigos dos botões

Os nomes como `BTN_SOUTH` são definidos pelo próprio kernel no cabeçalho de eventos. O mesmo botão físico ganha o nome por posição geográfica (`SOUTH`, `NORTH`, `EAST`, `WEST`), não pela letra pintada no controle — porque a letra muda entre fabricantes (o "A" do Xbox é o "X" do PlayStation, mas ambos são `BTN_SOUTH`).

```terminal
$ grep -E 'BTN_(SOUTH|NORTH|EAST|WEST)' /usr/include/linux/input-event-codes.h
#define BTN_SOUTH		0x130
#define BTN_EAST		0x131
#define BTN_NORTH		0x132
#define BTN_WEST		0x133
```

O Steam Input então traduz `BTN_SOUTH` (valor `0x130`, decimal 304) para a ação que o jogo espera. É essa indireção que permite que um DualSense e um Xbox — com letras pintadas em posições diferentes — funcionem de forma idêntica no mesmo jogo.

## Resumo

- `lsusb` lista aparelhos conectados com o par `ID vendedor:produto`.
- `udevadm info` revela propriedades como `ID_INPUT_JOYSTICK` que classificam o nó.
- `/dev/input/by-id` oferece caminhos legíveis com o nome do fabricante.
- `evtest` captura eventos crus em tempo real e é o teste definitivo de hardware.
- `EV_ABS` são eixos analógicos; `EV_KEY` são botões, com `value 1`/`0` para pressão.
- Botões são nomeados por posição (`BTN_SOUTH`), não pela letra pintada.

## Exercícios

1. Rode `lsusb` com o controle conectado e anote o par `ID xxxx:xxxx`. Confirme qual fabricante ele pertence.
2. Use `udevadm info -q all -n /dev/input/eventX` (substitua pelo seu nó) e localize a propriedade `ID_INPUT_JOYSTICK`.
3. Abra `evtest` no seu controle e pressione cada um dos quatro botões frontais. Anote qual código (`BTN_*`) cada letra gera.
4. Movimente o stick esquerdo devagar e observe os valores de `ABS_X`/`ABS_Y`. Qual é o valor de repouso (centro)?
5. **Desafio.** Usando o `evtest`, determine se o gatilho (`L2`) é reportado como eixo analógico (`EV_ABS`) ou como botão (`EV_KEY`) — e relacione isso com a possibilidade de "gatilho analógico gradual" discutida no capítulo.
