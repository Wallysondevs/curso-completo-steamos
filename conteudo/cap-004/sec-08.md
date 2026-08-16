As duas gerações do Steam Deck não diferem só em tela, bateria e Wi-Fi — há uma série de diferenças menores que, somadas, pesam na decisão de compra e na experiência diária. Refrigeração mais silenciosa, controle maior da ventoinha, ajustes no botão liga/desliga, a qualidade do Bluetooth e até o brilho do LED de energia compõem o retrato completo. Muitas dessas diferenças são documentadas, mas quase nenhuma aparece num `lspci`.

Nesta seção você aprende o que muda nos detalhes e como inspecionar alguns deles pelo sistema.

:::objetivos
- Identificar as diferenças menores entre LCD e OLED (refrigeração, portas, LED)
- Entender por que o OLED é mais silencioso e frio
- Ler temperatura e velocidade da ventoinha pelo sistema
- Verificar a revisão e os sensores térmicos via `/sys`
- Reconhecer o que permaneceu igual entre as gerações
:::

## Refrigeração e ruído

O Steam Deck usa um único cooler com ventoinha e heatpipe para dissipar o calor da APU. A Valve ajustou a curva da ventoinha várias vezes ao longo da vida do LCD — as primeiras unidades eram notoriamente barulhentas em tom agudo — e, no OLED, redesenhou o módulo térmico: uma ventoinha maior que gira mais devagar, produzindo menos ruído para o mesmo resfriamento.

Somado ao chip de 6 nm (Sephiroth), que gera menos calor, o resultado é um OLED visivelmente mais silencioso e frio ao toque. Isso tem efeito prático: o clock máximo se sustenta por mais tempo antes de a ventoinha precisar acelerar, o que contribui para os pequenos ganhos de desempenho em sessões longas, mencionados na seção do processador.

A temperatura da APU é lida nos sensores expostos pelo kernel em `/sys/class/hwmon/`. O caminho varia, mas o padrão é:

```terminal
$ ls /sys/class/hwmon/
hwmon0  hwmon1  hwmon2
$ cat /sys/class/hwmon/hwmon1/temp1_input
52000
```

O valor `52000` está em milésimos de grau Celsius, ou seja, 52,0 °C. Para descobrir qual `hwmon` corresponde à APU (e não, por exemplo, ao NVMe ou ao Wi-Fi), leia o rótulo de cada um:

```terminal
$ for h in /sys/class/hwmon/hwmon*; do echo "$h: $(cat $h/name 2>/dev/null)"; done
/sys/class/hwmon/hwmon0: k10temp
/sys/class/hwmon/hwmon1: k10temp
/sys/class/hwmon/hwmon2: nvme
```

Os dois `k10temp` são sensores da CPU AMD; o `nvme` é o do SSD. Lendo `temp1_input` dos `k10temp` você acompanha a temperatura da APU em tempo real. Durante um jogo pesado, valores na casa de 80–90 °C são normais para o Deck, que tem orçamento térmico apertado.

:::atencao
O nome e a posição dos `hwmon` mudam entre kernels e unidades. Nunca assuma que `hwmon1` é sempre a CPU. Confirme pelo `name` (`k10temp`), e leia o `temp1_input` correspondente. Interpretar a temperatura do SSD (`nvme`) como se fosse a da APU leva a conclusões erradas sobre aquecimento.
:::

## A ventoinha e seu controle

A velocidade da ventoinha também é exposta via `hwmon`, normalmente no mesmo controlador que reporta a temperatura, com um arquivo `fan1_input` (velocidade atual em RPM) e `pwm1` (o sinal de controle):

```terminal
$ cat /sys/class/hwmon/hwmon2/fan1_input
3120
$ cat /sys/class/hwmon/hwmon2/pwm1
128
```

O `fan1_input` de `3120` significa 3120 rotações por minuto. O `pwm1` de `128` está numa escala de 0 a 255, onde 255 é potência máxima da ventoinha — 128 representa cerca de metade da capacidade de controle. Nem todos os kernels deixam escrever no `pwm1`; quando deixam, dá para controlar a ventoinha manualmente, mas o SteamOS já gerencia a curva automaticamente.

O Steam Deck expõe um controle de ventoinha mais amigável na interface (o menu de desempenho traz um botão para atualizar o controle e um modo de curva), e, na prática, a maioria dos usuários nunca mexe no `pwm1` por linha de comando. O valor é útil para diagnóstico: uma ventoinha travada em `0` com temperatura subindo indica falha; uma em `fan1_input` altíssimo sem jogo aberto pode apontar acúmulo de poeira.

:::dica
Para observar temperatura e ventoinha juntas em tempo real, rode `watch -n1 'cat /sys/class/hwmon/hwmon1/temp1_input /sys/class/hwmon/hwmon2/fan1_input'` (ajustando os caminhos ao seu sistema). Abra um jogo pesado e veja a temperatura subir puxando a ventoinha minutos depois — a inércia térmica em ação.
:::

## Portas, botões e o que ficou igual

No quesito conexões físicas, as duas gerações são idênticas: uma porta **USB-C** (com DisplayPort e carga), o conector **P2 de 3,5 mm** para fone, o slot **microSD** e os botões de volume e energia. A porta USB-C é a única entrada/saída de dados e vídeo — tudo passa por um dock, que é vendido separadamente.

O OLED trouxe pequenos refinamentos mecânicos: a Valve reforçou a tela e mudou a textura do acabamento. O LED de energia também foi ajustado, e o botão liga/desliga ganhou uma resposta mais firme em algumas unidades. Nada disso aparece em comandos — são melhorias de fabricação que só o contato físico revela.

Um item que **não** mudou e vale registrar: a resolução de tela (1280×800) e o desempenho de APU são os mesmos, então a biblioteca de jogos é inteiramente compatível entre as gerações. Isso tem um significado prático forte — quem tem um LCD não perde nada em compatibilidade ao conviver com quem tem OLED, e os saves na nuvem transitam entre as duas máquinas sem atrito.

:::info
O SteamOS é o mesmo nas duas gerações: uma única imagem de sistema serve para LCD e OLED, e a Valve detecta o hardware no boot para ativar os recursos específicos (90 Hz, HDR, controle de ventoinha do OLED). É uma decisão de engenharia que simplifica as atualizações e explica por que você nunca "escolhe o modelo" ao instalar — o sistema se ajusta sozinho.
:::

## A ventoinha, a temperatura e a geração

Por fim, uma observação de diagnóstico: a relação entre temperatura e ventoinha pode, indiretamente, denunciar a geração. O OLED tende a operar mais frio e com ventoinha mais lenta sob a mesma carga, justamente pela combinação de chip de 6 nm com módulo térmico maior. Dois aparelhos rodando o mesmo jogo, lado a lado, costumam mostrar o OLED alguns graus abaixo do LCD.

Isso não é um identificador confiável por si só — depende de temperatura ambiente, estado da pasta térmica e sujeira acumulada — mas é um sinal coerente com o que você já leu nas seções de processador e bateria. A sequência de identificação robusta continua sendo a mesma: bateria (40 vs 50 Wh) e Wi-Fi (ac vs ax) fecham o diagnóstico; temperatura e ventoinha apenas corroboram.

| Aspecto | LCD | OLED |
|---|---|---|
| Silêncio sob carga | audível | mais silencioso |
| Temperatura da APU | tende a mais alta | tende a mais baixa |
| Portas físicas | USB-C, P2, microSD | idênticas |
| Resolução / APU | 1280×800 / 1,6 TFLOPs | idênticas |
| Imagem de sistema | SteamOS único | o mesmo |

O aprendizado desta seção é duplo: você ganhou as ferramentas (`hwmon`) para monitorar o calor por dentro e entendeu que as diferenças "menores" do OLED — silêncio e temperatura — derivam diretamente das mudanças maiores de processador e projeto térmico, fechando o ciclo das seções anteriores.

## Resumo

- O OLED redesenhado usa ventoinha maior e mais lenta, além da APU de 6 nm, ficando mais silencioso e frio.
- As temperaturas ficam em `/sys/class/hwmon/hwmon*/temp1_input`, em milésimos de °C; 52000 = 52 °C.
- O `name` de cada hwmon (`k10temp`, `nvme`) identifica a qual componente o sensor pertence.
- A ventoinha é lida em `fan1_input` (RPM) e controlada por `pwm1` (0–255).
- Portas físicas (USB-C, P2, microSD) e resolução/APU são idênticas entre as gerações.
- Uma única imagem de SteamOS serve aos dois modelos; o sistema detecta o hardware no boot.

## Exercícios

1. Liste `/sys/class/hwmon/` e leia o `name` de cada controlador, identificando quais são da APU (`k10temp`) e quais do SSD (`nvme`).
2. Leia a temperatura da APU com `cat /sys/class/hwmon/hwmonX/temp1_input` (usando o caminho correto) e converta para °C.
3. Encontre e leia `fan1_input` e `pwm1`. A ventoinha está girando? Em que nível de controle?
4. Com um jogo aberto, rode um `watch -n1` monitorando temperatura e ventoinha por 60 segundos e descreva o comportamento.
5. **Desafio.** Combine o monitoramento térmico com a bateria da seção 3: durante 10 minutos de jogo, registre temperatura, `fan1_input` e `energy-rate` (do `upower`). Explique, em prosa, como chip eficiente + ventoinha + consumo se relacionam, e se os números são coerentes com uma unidade LCD ou OLED.
