O Steam Deck não é um console no sentido tradicional — é um PC x86_64 com Linux que cabe nas suas mãos. Cada botão, cada sensor e cada centímetro do gabinete foi pensado para resolver um problema real de quem joga no sofá, no ônibus ou na cama. Entender o hardware externo é o primeiro passo para usar o Deck com segurança e tirar proveito de controles que vão muito além de um gamepad comum.

:::objetivos
- Identificar cada controle físico e sua função primária no Steam Deck
- Entender o papel dos touchpads, giroscópio e gatilhos analógicos no input
- Distinguir entre os modelos LCD e OLED pela aparência externa
- Localizar os conectores físicos e suas capacidades
- Interpretar os LEDs de status e o feedback tátil do aparelho
:::

## O layout frontal: sticks, botões e touchpads

A face do Steam Deck é dominada por uma tela de 7 polegadas (LCD) ou 7,4 polegadas (OLED), mas o que chama atenção de imediato é a quantidade de controles. Ao contrário de um teclado e mouse, o Deck foi desenhado para que suas mãos jamais precisem se deslocar — cada dedo tem uma função atribuída por padrão.

Os dois **analógicos** ficam na parte superior, paralelos, no estilo simétrico que a Valve adotou desde o Steam Controller. Abaixo deles, o **D-pad digital** à esquerda e os quatro **botões de face** (`A`, `B`, `X`, `Y`) à direita. No centro, dois **touchpads quadrados** com feedback háptico: cerca de 30 mm de lado, sensíveis à pressão e com uma taxa de amostragem alta o suficiente para movimentos precisos do cursor — herança direta do Steam Controller original.

Abaixo dos touchpads ficam o botão **Steam** (esquerda) e o botão **Quick Access** ou `...` (direita). O primeiro abre o menu principal do SteamOS; o segundo invoca um painel lateral com ajustes rápidos de brilho, volume, desempenho e notificações. Nos cantos inferiores, dois alto-falantes frontais disparam o som em direção a você, e não para os lados como em muitos notebooks.

```terminal
$ lsusb | grep -i valve
Bus 001 Device 004: ID 28de:1205 Valve Software Steam Deck
```

O dispositivo USB listado acima é o controlador embutido que gerencia botões, touchpads e sensores — o Steam Deck se apresenta ao próprio kernel como um periférico USB interno.

## Laterais, topo e base: o que cada face oferece

A borda superior concentra quase toda a conectividade e ventilação. Da esquerda para a direita:

- **Botão de volume** (físico, duas teclas: + e −).
- **Grade de ventilação** — a saída de ar do cooler único, que aspira pela traseira e expele pelo topo. Em carga pesada, o fluxo de ar é perceptível mas surpreendentemente silencioso.
- **Conector USB-C** com suporte a USB 3.2 Gen 2, DisplayPort 1.4 alt-mode e carregamento via Power Delivery (45 W máximos, 15 V / 3 A). É a única porta de dados do aparelho.
- **Botão de energia** com LED branco integrado.
- **LED de status** tricolor (branco/verde/laranja) que indica estado da bateria e carregamento.

A borda inferior abriga apenas o **slot microSD UHS-I** e os microfones estéreo. Não há entrada para fone de ouvido de 3,5 mm no modelo OLED — a Valve removeu o conector físico nessa revisão, contando com Bluetooth ou USB-C para áudio com fio.

```terminal
$ cat /sys/class/power_supply/BAT1/capacity
78
$ cat /sys/class/power_supply/BAT1/status
Discharging
```

O sistema de arquivos virtual `/sys` expõe o estado da bateria em tempo real. A capacidade em porcentagem e o status (`Charging`, `Discharging` ou `Full`) são lidos direto do controlador de carga pelo kernel, sem intermediação de userspace.

:::dica
O LED de status pisca em laranja quando a bateria está abaixo de 10% e fica branco fixo quando a carga está completa. Se o Deck não liga mesmo conectado ao carregador, segure o botão de energia por 12 segundos — isso força um reset do controlador embutido (EC).
:::

## Os gatilhos e bumpers: analógico encontra digital

Na parte traseira superior, os **bumpers** `L1` e `R1` são botões digitais de curso curto com um clique nítido. Logo abaixo, os **gatilhos analógicos** `L2` e `R2` percorrem um curso mais longo e reportam ao sistema um valor entre 0 e 65535 (16 bits de precisão), não apenas ligado/desligado.

Essa faixa analógica é essencial para jogos de corrida (acelerador e freio progressivos) e também pode ser configurada no Steam Input para ativar ações diferentes em pontos distintos do curso — disparar uma arma no meio do percurso do gatilho, por exemplo, ou ativar o modo giroscópio quando o gatilho está totalmente pressionado.

Abaixo dos gatilhos, na face traseira do Deck, quatro **botões traseiros** (`R4`, `R5`, `L4`, `L5`) podem ser mapeados para qualquer tecla, macro ou combinação. Eles não têm função no layout padrão de gamepad — existem exclusivamente para o Steam Input.

```terminal
$ evtest --grab /dev/input/event5 | head -6
Input driver version is 1.0.1
Input device ID: bus 0x3 vendor 0x28de product 0x1205 version 0x111
Input device name: "Valve Software Steam Deck"
Supported events:
  Event type 0 (EV_SYN)
  Event type 1 (EV_KEY)
```

O dispositivo de eventos de input expõe cada botão, eixo e sensor como um nó em `/dev/input/`. Com a ferramenta `evtest`, você vê em tempo real os keycodes e valores absolutos que o Deck envia ao kernel — útil para diagnosticar drift nos analógicos ou para scripts de automação.

:::atencao
Os botões traseiros `L4`/`L5`/`R4`/`R5` não aparecem como botões independentes no kernel. Eles são processados pelo firmware do controlador Steam e só chegam ao userspace através do Steam Input. Se você estiver em modo Desktop sem o Steam rodando, eles simplesmente não funcionam.
:::

## Resumo

- O Steam Deck tem dois analógicos, D-pad, botões de face, dois touchpads hápticos, bumpers, gatilhos analógicos e quatro botões traseiros.
- A borda superior concentra o USB-C (dados, vídeo e carga), botão de energia com LED, controle de volume e saída de ar.
- O slot microSD fica na borda inferior; o modelo OLED não possui conector de 3,5 mm para fone.
- Os gatilhos `L2`/`R2` reportam valores analógicos de 16 bits e o Steam Input permite configurar ações por faixa de curso.
- Os botões traseiros dependem do Steam Input e não são expostos diretamente ao kernel como eventos de input.

## Exercícios

1. Localize fisicamente cada controle mencionado nesta seção no seu Steam Deck. Pressione `L4` e `R4` — eles fazem clique? O curso dos gatilhos `L2`/`R2` é suave e uniforme?
2. Execute `cat /sys/class/power_supply/BAT1/capacity` e `cat /sys/class/power_supply/BAT1/status`. Compare os valores exibidos com o que aparece no menu Quick Access do SteamOS.
3. Conecte um hub USB-C ao Deck e execute `lsusb` antes e depois. Quantos dispositivos novos aparecem na listagem?
4. Use `find /dev/input/ -name 'event*' -exec udevadm info --name={} \; 2>/dev/null | grep -A2 Steam` para identificar qual arquivo `/dev/input/event*` corresponde ao controlador do Deck.
5. **Desafio.** Com o SteamOS em modo Desktop, abra o Konsole e execute `evtest` como root. Selecione o dispositivo "Valve Software Steam Deck" e pressione cada botão do Deck, um por vez. Anote o código (`code`) de cada botão. Quais botões geram eventos e quais não geram? Explique por que alguns controles físicos ficam invisíveis ao `evtest`.