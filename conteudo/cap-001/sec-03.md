O Steam Deck existe em duas gerações de hardware que dividem o mesmo nome e o mesmo software. O modelo original (2022) tem tela LCD; a revisão (2023) trouxe OLED, bateria maior, Wi-Fi mais rápido e um ventilador redesenhado. Escolher entre eles — ou simplesmente entender o que cada um oferece — exige ir além do marketing e olhar para os dados que o próprio sistema reporta.

:::objetivos
- Distinguir os modelos LCD e OLED por especificações objetivas de tela, bateria e conectividade
- Identificar qual modelo você possui sem abrir o aparelho
- Comparar as diferenças de painel (LCD IPS vs OLED HDR) e suas implicações
- Entender o impacto da bateria e do Wi-Fi no uso diário
- Ler informações de modelo e versão diretamente do hardware
:::

## Como saber qual modelo você tem

Antes de comparar, é preciso identificar o aparelho em mãos. A forma mais confiável é perguntar ao firmware, não ao olho. O SteamOS grava o identificador de modelo do sistema em arquivos sob `/sys` e `/etc`, e o hardware responde por si só.

```terminal
$ cat /sys/devices/virtual/dmi/id/product_name
Galileo
$ cat /sys/devices/virtual/dmi/id/product_version
1
$ cat /etc/os-release | grep -E 'NAME|VERSION_ID'
NAME="SteamOS"
VERSION_ID="3.6"
```

`Galileo` é o codinome interno do Deck LCD; o modelo OLED responde como `Jupiter`. Esses codinomes vêm do firmware SMBIOS/DMI e são a assinatura definitiva. O número de série pode ser confirmado com:

```terminal
$ cat /sys/devices/virtual/dmi/id/product_serial
FZ24AB123
```

A etiqueta no aparelho e a caixa também informam, mas a leitura via DMI não depende de ter acesso físico ao rótulo — e funciona por SSH ou no modo Desktop sem desmontar nada.

:::dica
Um atalho rápido: o modelo OLED tem o botão de energia em laranja/avermelhado e o logotipo Valve na tampa traseira em um tom diferente, mas o codinome `Jupiter`/`Galileo` via DMI é infalível. Nada de adivinhar pela cor da caixa.
:::

## A tela: IPS LCD contra OLED HDR

O painel é a diferença mais visível. O LCD usa um IPS de 7 polegadas, 1280×800, 60 Hz, com brilho típico de 400 nits e sem HDR. O OLED usa um painel de 7,4 polegadas, 1280×800, mas com taxa de atualização de até 90 Hz, brilho de pico de 1000 nits em conteúdo HDR e pretos verdadeiros — cada pixel emite a própria luz, então não existe a luz de fundo (backlight) que limita o contraste do LCD.

Essa diferença não é cosmética. Pixel a pixel, um OLED desligado é literalmente preto, o que dá contraste "infinito" e faz jogos de terror ou cenas noturnas terem profundidade que o IPS, com seu preto acinzentado por vazamento de backlight, não alcança. O suporte a HDR (High Dynamic Range) no OLED também muda a faixa de brilho: um flash de explosão pode atingir 1000 nits enquanto o resto da cena fica escuro.

```terminal
$ cat /sys/class/drm/card0-eDP-1/modes
1280x800
1280x720
800x600
640x480
```

O driver DRM (Direct Rendering Manager) do kernel lista os modos de vídeo suportados pelo painel. A resolução nativa é a mesma nos dois modelos — 1280×800, proporção 16:10 —, e o 90 Hz do OLED aparece como uma variação de taxa de atualização, não como resolução distinta.

:::info
A resolução 1280×800 (16:10) foi escolhida de propósito: é baixa o suficiente para a APU renderizar com folga e alta o suficiente para texto legível em modo Desktop. Em 16:10, você ganha linhas verticais extras em relação ao 16:9 (1280×720), úteis para HUDs e leitura.
:::

## Bateria, Wi-Fi e Bluetooth

O modelo OLED trouxe uma bateria maior: 50 Wh contra 40 Wh do LCD. Mas a melhoria de autonomia não vem só da capacidade — o chip Sephiroth de 6 nm consome menos, e o painel OLED, em conteúdo escuro, gasta menos que o IPS. O resultado líquido é de 30 a 50% mais tempo longe da tomada nas mesmas condições.

A conectividade sem fio também mudou. O LCD usa um chip que suporta Wi-Fi 5 (802.11ac); o OLED subiu para Wi-Fi 6E (802.11ax, banda de 6 GHz). Na prática, o Wi-Fi 6E reduz latência de streaming e congestionamento em redes cheias, além de permitir downloads mais rápidos quando o roteador suporta. O Bluetooth passou de 5.0 (LCD) para 5.3 (OLED), com codecs de áudio mais novos.

```terminal
$ iw dev | grep -E 'Interface|channel|ssid'
Interface wlan0
	ssid MinhaRede
	channel 149 (5745 MHz), width: 80 MHz
$ rfkill list bluetooth
0: hci0: Bluetooth
	Soft blocked: no
	Hard blocked: no
```

A interface `wlan0` conectada no canal 149 da faixa de 5 GHz, com largura de 80 MHz, é típica de Wi-Fi 5. Num OLED com Wi-Fi 6E, você veria canais na faixa de 6 GHz (acima de 5925 MHz) quando associado a um roteador compatível.

## O que NÃO mudou entre os modelos

É tentador achar que o OLED é "um Deck melhor" em tudo. Não é. A APU tem o mesmo projeto Zen 2 + RDNA 2 com 8 CUs; a memória segue LPDDR5 (ainda que em clocks mais altos); o armazenamento continua sendo SSD NVMe interno expansível por microSD; os controles, touchpads e giroscópio são idênticos em layout.

Ou seja, o desempenho bruto em jogos é praticamente o mesmo. O que muda é autonomia, tela e conectividade — fatores de conforto e experiência, não de potência. Um LCD com TDP máximo roda os mesmos jogos nas mesmas configurações que um OLED.

```terminal
$ free -h | head -2
               total        used        free      shared  buff/cache   available
Mem:            14Gi       2.1Gi        11Gi        10Mi       387Mi        11Gi
```

Os 16 GB de LPDDR5 são reportados como ~14 GB usáveis; o kernel reserva parte para o firmware e a GPU integrada. Esse número é idêntico nos dois modelos.

:::atencao
Não confunda a "versão" do produto com a capacidade de SSD. Tanto o LCD quanto o OLED foram vendidos em versões de 64 GB, 256 GB, 512 GB e 1 TB (e depois outras). A adição de uma unidade OLED não alterou a APU — cuidado com vendedores que anunciam "OLED mais rápido".
:::

## Resumo

- O modelo LCD usa codinome `Galileo`; o OLED, `Jupiter` — legíveis via DMI em `/sys/devices/virtual/dmi/id/`.
- O painel LCD é IPS 7" 60 Hz sem HDR; o OLED é 7,4" até 90 Hz com HDR e 1000 nits de pico.
- A resolução nativa é 1280×800 (16:10) nos dois modelos.
- O OLED tem bateria de 50 Wh (LCD 40 Wh), Wi-Fi 6E (LCD Wi-Fi 5) e Bluetooth 5.3 (LCD 5.0).
- A APU, a memória e o desempenho bruto são equivalentes; as diferenças são de tela, autonomia e conectividade.

## Exercícios

1. Execute `cat /sys/devices/virtual/dmi/id/product_name` para descobrir se seu Deck é `Galileo` (LCD) ou `Jupiter` (OLED).
2. Leia a resolução atual do painel com `cat /sys/class/drm/card0-eDP-1/modes` e confirme se a taxa de atualização aparece em alguma entrada.
3. Verifique sua placa de rede sem fio com `lspci | grep -i network` ou `iw dev`. O chip é compatível com Wi-Fi 5 ou Wi-Fi 6E?
4. Execute `cat /sys/class/power_supply/BAT1/energy_full` (ou `charge_full`) para ler a capacidade total da bateria em Wh/µAh. Esse valor bate com 40 Wh ou 50 Wh?
5. **Desafio.** Compare os dois modelos fazendo uma leitura cruzada: rode `uptime`, `free -h` e `df -h` num Deck seu e, se tiver acesso a outro Deck (ou a um relato confiável), compare. As diferenças de desempenho de memória e CPU são mensuráveis? Conclua com uma frase fundamentada nos números, não em impressões.