Quando você conecta o Deck ao dock oficial (ou a um hub USB-C), o Modo Desktop vira uma estação de trabalho completa, e aí teclado e mouse externos deixam de ser acessórios eventuais para se tornar o jeito principal de operar. SteamOS reconhece teclados e mouses Bluetooth e USB sem configuração alguma — os drivers genéricos do kernel cobrem praticamente todos os modelos. Mas "funcionar" e "funcionar bem" são duas coisas diferentes, especialmente no que diz respeito a layouts de teclado, atalhos e o comportamento do touchpad do Deck quando um mouse externo está ativo.

:::objetivos
- Parear teclado e mouse Bluetooth usando o mesmo fluxo do `bluetoothctl`
- Verificar via `lsusb` quais dispositivos USB o Deck detecta
- Entender como o SteamOS escolhe o layout de teclado
- Ajustar o comportamento do touchpad quando um mouse externo está presente
:::

## Teclado e mouse Bluetooth

Teclados e mouses Bluetooth se pareiam exatamente como os controles da seção anterior. A diferença prática é que muitos teclados pedem um código PIN durante o pareamento — o `bluetoothctl` exibe a solicitação no terminal e espera que você digite o PIN no próprio teclado que está pareando (um loop que parece circular, mas funciona: você digita no teclado e o código é enviado naquele canal de pareamento antes da conexão estar plena).

```terminal
[bluetooth]# scan on
Discovery started
[NEW] Device 08:3E:8E:4D:1C:A6 MX Keys Mini
[NEW] Device F0:22:1C:71:B4:3D MX Master 3S
[bluetooth]# pair 08:3E:8E:4D:1C:A6
Attempting to pair with 08:3E:8E:4D:1C:A6
[agent] Passkey: 921874
[CHG] Device 08:3E:8E:4D:1C:A6 Paired: yes
Pairing successful
[bluetooth]# trust 08:3E:8E:4D:1C:A6
[CHG] Device 08:3E:8E:4D:1C:A6 Trusted: yes
[bluetooth]# connect 08:3E:8E:4D:1C:A6
Attempting to connect to 08:3E:8E:4D:1C:A6
[CHG] Device 08:3E:8E:4D:1C:A6 Connected: yes
```

A linha `[agent] Passkey: 921874` é a parte crítica: o sistema gera um código, você o digita no teclado que está pareando e, se os números conferirem, o pareamento avança. Esse mecanismo impede que um vizinho conecte um teclado ao seu Deck sem você notar.

Com mouse é mais simples — não há PIN, e o pareamento é transparente. Depois de pareados, teclado e mouse reaparecem automaticamente sempre que o Deck liga e o Bluetooth está ativo.

## O que o Deck vê no USB

Quando você conecta teclado e mouse via USB (diretamente no dock ou via hub), o kernel detecta o dispositivo e o associa a um driver. O comando `lsusb` lista todos os dispositivos USB que o kernel enxerga naquele instante, com o identificador de fornecedor (`ID vendor:product`) e uma descrição textual:

```terminal
$ lsusb
Bus 004 Device 001: ID 1d6b:0003 Linux Foundation 3.0 root hub
Bus 003 Device 002: ID 046d:c548 Logitech, Inc. USB Receiver
Bus 003 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub
Bus 001 Device 003: ID 0bda:8153 Realtek Semiconductor Corp. RTL8153 Gigabit Ethernet Adapter
Bus 001 Device 002: ID 0bda:0411 Realtek Semiconductor Corp. 4-Port USB 3.0 Hub
Bus 001 Device 001: ID 1d6b:0003 Linux Foundation 3.0 root hub
Bus 002 Device 003: ID 28de:1200 Valve Software Steam Deck Controller
Bus 002 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub
```

Nessa saída, o Deck está conectado a um dock que expõe um hub USB 3.0 (`0bda:0411`), um adaptador de rede Gigabit (`0bda:8153`) e um receptor Logitech (`046d:c548`). O `Valve Software Steam Deck Controller` no Bus 002 é o controle embutido do Deck — ele está sempre lá, mesmo que você esteja usando um controle externo.

A coluna `ID vendor:product` é o par de hexadecimais que identifica unicamente o fabricante e o modelo. Jogando no Google ou em sites como `linux-hardware.org`, você descobre se o kernel tem driver nativo para aquele chip.

:::dica
Para filtrar apenas o que mudou, conecte o dispositivo e rode `lsusb` antes e depois. Outro truque é `lsusb -t`, que exibe a árvore hierárquica: qual dispositivo está pendurado em qual hub e em qual porta, útil para entender a topologia de um dock com múltiplas portas USB.
:::

## Layout de teclado: o que muda no Modo Desktop

No Modo Jogo o teclado virtual é o padrão QWERTY americano e você não tem muita escolha. No Modo Desktop (KDE Plasma), o layout do teclado externo é configurável pelo módulo gráfico de idioma e teclado do sistema. O SteamOS lê essa configuração e aplica ao teclado físico conectado, mas ele pode não herdar o layout correto se o teclado não for ABNT2 (no Brasil) — especialmente grave no caso de teclas como `ç`, `~` e acentos.

O layout ativo no sistema está disponível via `localectl`, que mostra o que está configurado para o console e para o ambiente gráfico:

```terminal
$ localectl status
   System Locale: LANG=en_US.UTF-8
       VC Keymap: us
      X11 Layout: br
       X11 Model: pc105
     X11 Variant: nodeadkeys
```

Aqui o `X11 Layout: br` indica que no ambiente gráfico (onde você vai usar o teclado externo) o layout brasileiro está ativo. O `VC Keymap: us` é o layout do console virtual (aquele que você acessa com `[[Ctrl+Alt+F3]]`), que permanece americano. Para trocar o layout gráfico:

```terminal
$ sudo localectl set-x11-keymap br pc105 nodeadkeys
$ localectl status
   System Locale: LANG=en_US.UTF-8
       VC Keymap: us
      X11 Layout: br
       X11 Model: pc105
     X11 Variant: nodeadkeys
```

A variante `nodeadkeys` é a recomendada: sem ela, caracteres como `´` e `^` viram "teclas mortas" que esperam uma segunda tecla para compor, o que atrapalha programação e navegação em terminal.

:::atencao
O layout de teclado configurado pelo KDE (via interface gráfica) pode sobrescrever o que você definir com `localectl`. Se o teclado voltar ao layout errado depois de um reboot, confira primeiro o System Settings do Plasma — a configuração gráfica tem a última palavra nesse caso.
:::

## Touchpad, mouse e o Modo Desktop no dock

Quando você conecta o Deck ao dock com um mouse externo, o sistema detecta dois dispositivos apontadores: o mouse físico e a tela sensível ao toque (mais o touchpad se for um modelo de teclado com touchpad). O Plasma sabe lidar com múltiplos dispositivos, mas pode haver conflito se o touchpad do Deck continuar ativo enquanto você digita — a palma da mão aciona o cursor acidentalmente.

A solução é desabilitar o touchpad do Deck quando um mouse está conectado, algo que o sistema não faz sozinho. No KDE Plasma você encontra essa opção em System Settings → Input Devices → Touchpad → "Disable when mouse is plugged in". Se quiser fazer por linha de comando, pode desligar o dispositivo via `xinput`:

```terminal
$ xinput list
⎡ Virtual core pointer                    	id=2	[master pointer  (3)]
⎜   ↳ Steam Deck Touchpad                    	id=11	[slave  pointer  (2)]
⎜   ↳ Logitech MX Master 3S                  	id=14	[slave  pointer  (2)]
...
$ xinput disable 11
```

O ID `11` corresponde ao touchpad do Deck; desabilitá-lo remove o ponteiro até o próximo reboot ou até um `xinput enable 11`. Essa técnica também serve para desabilitar o controle embutido quando você joga com controle externo — basta localizar o `Steam Deck Controller` na lista do `xinput`.

## Resumo

- Teclados e mouses Bluetooth usam o mesmo fluxo `pair` → `trust` → `connect` do `bluetoothctl`, com teclados frequentemente exigindo um PIN.
- `lsusb` lista todo dispositivo USB detectado pelo kernel com o par `ID vendor:product`.
- O layout do teclado externo é controlado por `localectl` via `set-x11-keymap`; o KDE pode sobrescrever essa configuração.
- Variedade `nodeadkeys` impede que acentos e til fiquem como teclas mortas, o que incomoda em terminal.
- `xinput list` e `xinput disable` desligam dispositivos apontadores específicos, como o touchpad do Deck quando um mouse externo está ativo.

## Exercícios

1. Pareie um teclado Bluetooth e documente o PIN exibido pelo `[agent]` durante o pareamento.
2. Rode `lsusb` antes e depois de conectar um mouse USB via dock. Identifique a nova linha pelo `ID vendor:product`.
3. Execute `localectl status` e anote o `X11 Layout` ativo. Se não for `br`, use `sudo localectl set-x11-keymap br pc105 nodeadkeys` para trocar.
4. Liste os dispositivos com `xinput list`, localize o touchpad do Deck e desabilite-o com `xinput disable <id>`. Depois reabilite.
5. **Desafio.** Combine o `lsusb` com o `lsusb -t` enquanto o Deck está conectado a um dock com múltiplos periféricos USB. Desenhe (em texto) a árvore resultante e identifique qual hub físico corresponde a qual entrada do gabinete do dock.