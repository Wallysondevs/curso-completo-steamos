Entre as skins de software e a troca de case, existe uma faixa intermediária de personalização que muita gente pula: os detalhes de luz e acabamento. Retroiluminação de LED, adesivos internos, botões translúcidos que captam luz, ajustes finos de cor e brilho. Boa parte disso é barata, reversível e não exige abrir o aparelho — e as que exigem, exigem o mínimo. Esta seção cobre LEDs, iluminação ambiente e os acabamentos que dão o toque final sem o risco de um shell swap completo.

:::objetivos
- Distinguir personalização de LED de acabamento físico
- Conhecer as opções de iluminação para o Steam Deck e como controlá-las
- Ajustar brilho, cor e temperatura de cor da tela por software
- Aplicar adesivos e películas sem danificar a carcaça
- Combinar iluminação com skins para um resultado coerente
:::

## O Steam Deck não tem RGB nativo

Um ponto de partida importante: o Steam Deck **não** tem LEDs RGB endereçáveis de fábrica, como muitos PCs gamer. A iluminação que ele traz é mínima — o LED de status ao lado do conector de energia (que acende ao carregar) e a retroiluminação do próprio display. Então "deixar o Deck colorido" passa por **acessórios externos** e por **partes translúcidas** que deixam vazar a luz do display ou de fitas de LED adicionadas.

```terminal
$ ls /sys/class/leds/ 2>/dev/null
input3::capslock  input3::numlock  input3::scrolllock  phy0-led
```

A pasta `/sys/class/leds/` lista os LEDs controláveis por software. Num Steam Deck, você provavelmente verá apenas os LEDs de teclado (nem sempre presentes) e o `phy0-led`, que é o LED de atividade do Wi-Fi/Bluetooth. Nada de uma interface RGB completa — confirmação de que a iluminação é um projeto *seu*, não um recurso do sistema.

## Ajustando a tela: brilho, cor e temperatura

A personalização mais imediata não é adicionar luz, e sim controlar a que já existe. O Steam Deck permite ajustar brilho por software, e no modo desktop o KDE oferece correção de cor e controle de temperatura (o modo *Night Color*, que reduz o azul à noite).

```terminal
$ brightnessctl -l 2>/dev/null
Device 'amdgpu_bl0' of class 'backlight':
	Current brightness: 120 (100%)
	Max brightness: 120
$ brightnessctl set 50% 2>/dev/null
```

O `brightnessctl` conversa com a retroiluminação via o subsistema `backlight`. Controlar o brilho por linha de comando é útil para scripts (diminuir de noite, por exemplo) e para entender o que as configurações gráficas fazem por baixo.

:::dica
Reduzir o brilho é uma das personalizações com maior retorno real: consome menos bateria e reduz o esforço dos olhos. Antes de gastar com um case fancy, experimente automatizar o brilho conforme o horário — é a "personalização" mais invisível e mais útil de todas.
:::

## LEDs externos e fitas adesivas

Quem quer luz de verdade recorre a três caminhos, em ordem crescente de invasividade:

- **Fitas de LED USB** coladas por dentro de um case transparente, alimentadas pela porta USB-C (com hub, já que a porta fica ocupada).
- **Skid-plates e adesivos com LED** que usam a energia de contatos ou de um pequeno controlador.
- **Botões e grips translúcidos** que captam a luz da tela ou de uma fita interna, mudando a aparência sem fonte de luz própria adicional.

As fitas USB são as mais populares porque não exigem mexer no circuito: você cola a fita no interior do case, conecta o controlador ao USB-C e usa um controle para mudar cor e padrão. O custo é a ergonomia — fica um cabo saindo do aparelho.

```terminal
$ lsusb | grep -i -E "led|rgb|hub"
Bus 001 Device 004: ID 0a12:0001 Cambridge Silicon Radio, Ltd Bluetooth Dongle (HCI mode)
```

O `lsusb` lista os dispositivos no barramento USB. Se a sua fita ou hub aparecer aqui, você confirma que ela foi reconhecida pelo sistema — embora o controle de cor seja normalmente feito pelo controle remoto da fita, não por software.

## Películas, adesivos e acabamentos

A camada de personalização "de superfície" é a mais acessível e reversível: películas para a tela (anti-reflexo ou de privacidade), *skins* adesivas de vinil para a carcaça (não confundir com skins de software — aqui é o adesivo físico) e grips de fita para melhorar a pegada.

Aplicar adesivo de vinil bem exige paciência e calor suave (um secador de cabelo) para o vinil acomodar as curvas. A chave é limpeza absoluta da superfície antes — qualquer poeira vira bolha permanente.

:::atencao
Película e adesivo de vinil deixam resíduo de cola na carcaça ao serem removidos, especialmente após meses de calor. Isso não danifica o plástico original, mas exige limpeza com álcool isopropílico. Se você é do tipo que troca de adesivo com frequência, prefira as marcas que garantem remoção sem resíduo.
:::

## Coerência: luz e skin juntas

O erro estético mais comum é empilhar personalizações sem relação entre si — uma skin de software azul, botões vermelhos, case verde e LED roxo. O resultado raramente agrada. O segredo é escolher uma **direção** e deixar cada camada apontar para ela.

Uma regra prática com três passos resolve: defina a cor principal, escolha uma neutra de apoio e reserve uma cor de acento para no máximo um elemento (botões **ou** LED, não ambos). Assim as camadas conversam em vez de competir.

```text
Direção "silêncio": cinza-escuro (skin) + preto (case) + acento âmbar só no LED
Direção "retrô": bege (skin) + botões translúcidos âmbar + sem LED extra
```

A personalização de luz e acabamento, feita com critério, é a que mais se aproxima de "design" — e é a que menos arrisca o aparelho.

## Resumo

- O Steam Deck não tem RGB nativo; `/sys/class/leds/` mostra só LEDs de status e Wi-Fi.
- A luz pessoal vem de fitas USB, botões translúcidos e adesivos, não do firmware.
- `brightnessctl` controla a retroiluminação por software e serve para automação.
- O KDE oferece Night Color (temperatura de cor) no modo desktop.
- Adesivos e películas são reversíveis, mas pedem superfície limpa e calor suave para aplicar.
- Coerência estética (cor principal + neutra + acento único) evita o efeito "colcha de retalhos".

## Exercícios

1. Rode `ls /sys/class/leds/` e liste os LEDs que seu aparelho expõe. Explique por que não há interface RGB completa.
2. Leia o brilho atual com `brightnessctl`, ajuste para 50% e depois para 100%, observando a mudança no consumo declarado da bateria (se disponível).
3. No modo desktop, ative o Night Color e ajuste a temperatura de cor para o período noturno. Anote a diferença percebida.
4. Escolha uma direção estética (cor principal, neutra e acento) e anote como cada camada — skin, botões, case, LED — a respeitaria.
5. **Desafio.** Escreva um pequeno script (em `bash`) que leia a hora atual e, usando `brightnessctl`, reduza o brilho para 40% após as 22h. Explique como você o agendaria para rodar automaticamente.
