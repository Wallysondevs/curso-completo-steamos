No modo desktop, o Steam Deck vira um PC compacto — e um teclado mecânico com mouse gaming muda completamente a produtividade. Mas "gaming" quase nunca é plug-and-play: mouses de alta DPI têm memória interna, perfis e taxas de polling que vêm com configurações de fábrica ruins. Entender como o Linux vê esses aparelhos permite destravar o desempenho que a placa oferece.

:::objetivos
- Conectar teclado e mouse e identificar seus nós de entrada
- Entender DPI, polling rate e como eles interagem
- Configurar mouses compatíveis com `ratbagd` e `ratbagctl`
- Ajustar sensibilidade no sistema sem depender do app do fabricante
:::

## Teclado e mouse aos olhos do kernel

Assim como controles, teclado e mouse são aparelhos HID expostos em `/dev/input`. A diferença é que eles costumam gerar **dois** nós por aparelho: um para o modo teclado e outro para o modo mouse (ou para o teclado embutido, no caso de mouses com muitos botões).

```terminal
$ ls /dev/input/by-id | grep -iE 'logitech|razer|keyboard'
usb-Logitech_G_PRO_Wireless-event-mouse
usb-Logitech_G_PRO_Wireless-if01-event-kbd
usb-Keychron_Keychron_K8-event-kbd
```

O mouse Logitech G Pro acima expõe `event-mouse` e, no `if01`, um teclado virtual — usado para enviar macros e atalhos gravados na memória do aparelho. Um teclado mecânico comum expõe só o `event-kbd`.

:::nota
O "teclado virtual" de muitos mouses e teclados gaming serve para o firmware do aparelho injetar sequências de teclas (macros) como se viessem de um teclado real. É por isso que um mouse pode "digitar" sem ser, de fato, um teclado.
:::

## DPI e a primeira grande pegadinha

DPI (*dots per inch*) é a resolução do sensor: quantos passos o mouse reporta por polegada percorrida. Mouses gaming anunciam valores absurdos (20.000 DPI ou mais) e vêm de fábrica num valor alto. Em telas de alta resolução, isso resulta num cursor que atravessa a tela inteira com um milímetro de movimento.

```terminal
$ xinput list | grep -iE 'mouse|pointer'
⎜   ↳ Logitech G PRO Wireless Mouse    	id=10	[slave  pointer  (2)]
$ xinput list-props 10 | grep -iE 'accel|transform'
	libinput Accel Speed (401):	0.000000
	libinput Accel Profile Enabled (412):	1, 1
```

O `xinput` mostra as propriedades que o `libinput` (a biblioteca de entrada do ambiente gráfico) aplica. O `Accel Speed` em `0.0` significa aceleração neutra; valores positivos aceleram o cursor. Para mouses gaming, a recomendação é deixar a aceleração em zero e ajustar a sensibilidade **no DPI do firmware**, não na aceleração do sistema.

:::atencao
Aceleração de mouse (`Accel Speed` positivo) embaralha a relação entre movimento físico e cursor, o que destrói a memória muscular em jogos de tiro. Para jogo competitivo, mantenha `Accel Speed` em `0` e ajuste o DPI do aparelho até o cursor ficar confortável. Aceleração é útil só para uso de escritório.
:::

## Ajustando a sensibilidade sem o app do fabricante

A maioria dos fabricantes (Logitech, Razer, Corsair) tem apps de configuração só para Windows. No Linux, o projeto **libratbag** reimplementa esse controle via `ratbagd` (daemon) e `ratbagctl` (CLI). Nem todo mouse é suportado, mas a lista é ampla.

```terminal
$ ratbagctl list
wired-gaming-mouse:	Logitech G502 HERO
```

Com o aparelho identificado igual ao do Windows, você lê e ajusta perfis:

```terminal
$ ratbagctl wired-gaming-mouse profile 0 get-active
$ ratbagctl wired-gaming-mouse dpi get
0: 400
$ ratbagctl wired-gaming-mouse dpi set 800
```

Assim você muda DPI, taxa de polling e até o LED do mouse sem depender do software proprietário. O `ratbagd` fala com o firmware do mouse diretamente por USB. Se o seu modelo não aparece no `ratbagctl list`, ele não é suportado — e a alternativa é ajustar por um botão físico de troca de DPI que muitos mouses têm embutido.

## Taxa de polling

Polling rate é quantas vezes por segundo o mouse reporta a posição ao computador. O padrão é `125 Hz` (a cada 8 ms), mas mouses gaming sobem para `500 Hz` ou `1000 Hz` (1 ms). O ganho é latência percebida: a `1000 Hz`, o cursor responde 8× mais rápido que a `125 Hz`.

```terminal
$ ratbagctl wired-gaming-mouse rate get
1000
$ ratbagctl wired-gaming-mouse rate set 1000
```

Taxas altas custam CPU e bateria, mas num mouse cabeado gaming o custo é desprezível. Em wireless, deixe em `500 Hz` se quiser bateria; em `1000 Hz` se quiser resposta máxima.

## Teclado e o modo de jogo

Teclados mecânicos não têm "DPI", mas têm duas coisas que importam: **anti-ghosting / N-key rollover** (quantas teclas podem ser pressionadas e registradas ao mesmo tempo) e **modo de jogo** (desativa `Esc`/teclas que fecham janelas durante o jogo).

```terminal
$ evtest /dev/input/event3 | grep -c 'value 1'
```

Não há configuração de rollover no sistema — é decidido pelo hardware e pelo modo como o teclado se anuncia. Teclados com N-key rollover via USB exigem um descritor HID especial; os mais baratos limitam a 6 teclas simultâneas (6KRO). Para verificar o seu, teste pressionar várias teclas ao mesmo tempo num editor e conte quantas são registradas.

:::dica
O modo de jogo do teclado (`Fn` + alguma tecla, varia por fabricante) desativa teclas problemáticas por firmware, então não aparece no Linux. O que você faz no sistema é remapear teclas via Steam Input ou `xmodmap`, mas isso é outro assunto — o firmware do teclado continua soberano sobre o rollover.
:::

## Resumo

- Teclado e mouse são aparelhos HID com nós `event-kbd` e `event-mouse`.
- Mouses gaming com macros expõem um segundo nó de "teclado virtual".
- DPI é resolução do sensor; sensibilidade fina deve ir no DPI, não na aceleração.
- `xinput` expõe as propriedades do `libinput` como `Accel Speed`.
- `ratbagctl` reimplementa o controle de DPI/DPI/polling/LED via `ratbagd`.
- Polling alto (1000 Hz) reduz latência ao custo de bateria e CPU.

## Exercícios

1. Liste `/dev/input/by-id` e identifique os nós do seu mouse e teclado. Algum aparelho expõe dois nós?
2. Rode `xinput list` e encontre o `id` do seu mouse. Depois verifique `Accel Speed` com `xinput list-props`.
3. Se seu mouse é suportado, liste-o com `ratbagctl list` e leia o DPI atual com `ratbagctl dpi get`.
4. Mude a taxa de polling para `1000` com `ratbagctl rate set 1000` e sinta a diferença de resposta.
5. **Desafio.** Teste o rollover do seu teclado pressionando `A`, `S`, `D`, `F`, `J`, `K`, `L` juntas num editor. Quantas registram? Pesquise se o seu modelo tem N-key rollover e relacione com o resultado.
