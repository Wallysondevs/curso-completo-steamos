A tela é a diferença mais imediata entre as duas gerações do Steam Deck — e também a mais fácil de sentir sem abrir nenhum terminal. Enquanto o LCD original usa um painel IPS de 7 polegadas padrão, o OLED troca tudo por um painel HDR com cores mais saturadas, pretos verdadeiros e taxa de atualização maior. O que muitos não sabem é que parte dessas características é recuperável por software, direto do SteamOS, mesmo sem conhecer a especificação de fábrica.

Nesta seção você aprende o que muda entre os painéis em termos concretos e como investigar a tela da sua unidade por linha de comando.

:::objetivos
- Comparar as especificações de tela do LCD e do OLED
- Ler resolução, taxa de atualização e modo atual da tela pelo sistema
- Entender o que HDR e 90 Hz significam na prática para jogos
- Ajustar brilho a partir da interface de `/sys`
- Reconhecer o acabamento do vidro (padrão vs antirreflexo) nas edições de 512 GB
:::

## Os números que separam os painéis

O Steam Deck LCD saiu com um painel IPS de 7 polegadas, resolução **1280×800**, taxa de atualização de **60 Hz** e brilho típico de **400 nits**. É uma tela honesta para a época: 16:10, razoavelmente luminosa, mas com o contraste limitado que caracteriza o IPS — o preto, na prática, é um cinza escuro iluminado por trás.

O OLED substituiu o painel por um **7,4 polegadas HDR OLED**, ligeiramente maior, com a mesma resolução 1280×800 mas taxa de **90 Hz** e pico de brilho de **1000 nits** em conteúdo HDR. As diferenças vão além do número: como cada pixel OLED emite sua própria luz, um pixel preto fica literalmente apagado, o que produz contraste "infinito" e pretos reais. A resposta de cada pixel é também quase instantânea, o que reduz o rastro em movimento em jogos rápidos.

Na resolução há um ponto curioso: os dois são 1280×800, então o OLED não ganha em nitidez bruta — ele tem a mesma densidade de pixels num painel um pouco maior. O ganho está em cor, contraste, brilho de pico e fluidez (90 Hz contra 60 Hz), não em definição.

:::nota
O padrão HDR (High Dynamic Range) permite que a tela exiba uma faixa de brilho muito maior entre o mais escuro e o mais claro da mesma cena. Um jogo com suporte a HDR mostra, por exemplo, o sol estourando de brilho enquanto uma caverna permanece profunda na mesma imagem. O painel OLED alcança isso sem a "névoa" de luz que o IPS adiciona nos cantos escuros.
:::

## Lendo a tela pelo sistema

O kernel expõe a resolução e a taxa de atualização ativas por meio do `wayland-info` ou, de forma mais crua, lendo direto os arquivos de `/sys/class/drm`. No SteamOS, que usa a sessão gráfica Gamescope (Wayland), a forma mais estável de confirmar resolução e frequência é perguntar ao sistema de *display*:

```terminal
$ cat /sys/class/drm/card0-eDP-1/modes
1280x800
$ cat /sys/class/drm/card0-eDP-1/mode
```

O arquivo `modes` lista as resoluções suportadas pelo painel (aqui, apenas `1280x800`, a nativa). O arquivo `mode` mostra a resolução mais a frequência daquele instante. O campo de frequência, no entanto, é o que mais interessa para diferenciar os modelos — e ele pode ser lido com mais clareza consultando o refresh rate ativo.

Uma abordagem mais robusta usa o `wlr-randr` (quando disponível) ou simplesmente o Gamescope, que é o compositor padrão do SteamOS:

```terminal
$ xrandr --listmonitors
Monitors: 1
 0: +eDP-1 1280/210x800/135+0+0  eDP-1
```

Aqui `1280/210x800/135` traz as dimensões físicas do painel em milímetros: 210×135 mm, o que corresponde aproximadamente a 7 polegadas na diagonal — um indício de que se trata da geração LCD (o OLED teria medidas um pouco maiores, perto de 7,4"). A resolução nativa única de 1280×800, igual nos dois, não separa os modelos sozinha; é preciso cruzar com a frequência.

Para confirmar a taxa máxima suportada, o SteamOS guarda essa informação no EDID, o bloco de dados que o painel reporta ao sistema. Uma leitura útil:

```terminal
$ cat /sys/class/drm/card0-eDP-1/edid | edid-decode | grep -E 'Manufacturer|Maximum|Detailed mode'
Manufacturer: VLV
Maximum image size: 16 cm x 10 cm
Detailed mode: Clock 68.850 MHz, 1280 mm x 800 mm
               1280 1304 1320 1360 hborder 0
                800  801  805  848 vborder 0
               +hsync +vsync
```

O fabricante `VLV` (Valve) e o tamanho máximo de imagem aparecem no EDID. A taxa de 90 Hz do OLED só é negociada quando o Gamescope ativa o modo correspondente; no LCD ela simplesmente não existe no conjunto de modos detalhados. Por isso, a ausência de um modo de 90 Hz no EDID é, na prática, a assinatura do painel LCD.

:::atencao
O Steam Deck é cheio de peculiaridades no subsistema gráfico por causa do Gamescope: alguns utilitários clássicos como `xrandr` mostram informação incompleta ou ausente, porque a sessão roda em Wayland, não em X11. Prefira os arquivos de `/sys/class/drm/` e o EDID para leitura confiável, e evite tirar conclusões só com `xrandr`.
:::

## Brilho e o backlight via /sys

O brilho da tela é controlado por um controlador de *backlight* que o kernel expõe em `/sys/class/backlight`. Tanto o LCD quanto o OLED aparecem ali — no LCD é o LED que ilumina o painel por trás, e no OLED o driver mapeia o "brilho" para o nível de emissão dos pixels.

```terminal
$ ls /sys/class/backlight/
amdgpu_bl1
$ cat /sys/class/backlight/amdgpu_bl1/brightness
128
$ cat /sys/class/backlight/amdgpu_bl1/max_brightness
255
```

O valor de `brightness` vai de 0 a `max_brightness` (aqui `255`). Ler o arquivo retorna o nível atual; escrever nele muda o brilho imediatamente. Para mexer é preciso permissão de escrita, o que normalmente exige `sudo`:

```terminal
$ sudo sh -c 'echo 200 > /sys/class/backlight/amdgpu_bl1/brightness'
$ cat /sys/class/backlight/amdgpu_bl1/brightness
200
```

A escala de 0 a 255 não mapeia linearmente para a percepção humana, mas é exatamente a mesma interface que os atalhos de brilho do sistema usam por baixo. No aparelho, os botões de volume + o Steamos Quick Access Menu ajustam esse mesmo valor.

:::dica
O nome do controlador pode variar entre unidades (`amdgpu_bl0`, `amdgpu_bl1`, `acpi_video0`). Use `ls /sys/class/backlight/` para descobrir o nome exato antes de escrever. Em alguns kernels o `brightness` aceita apenas escrita via `tee` com root; o padrão `sudo sh -c 'echo ... > ...'` funciona na maioria dos casos.
:::

## HDR, 90 Hz e o que muda no jogo

A taxa de 90 Hz do OLED não significa que todo jogo rodará a 90 quadros por segundo — significa que a tela consegue atualizar a imagem até 90 vezes por segundo, e o Gamescope pode aproveitar isso quando a APU entrega quadros suficientes. Num jogo leve ou com limitador desativado, a diferença de fluidez entre 60 e 90 Hz é perceptível; em títulos pesados presos perto de 40–60 fps, o ganho prático é menor.

O HDR, por sua vez, é opcional por jogo. Nem todo título tem suporte, e ativá-lo muda o pipeline de cor. No SteamOS 3.6, o HDR é habilitado por jogo no menu de propriedades, e a sessão Gamescope re-negocia o modo assim que o jogo pede. O painel LCD não tem HDR de fábrica, então essa opção simplesmente não aparece ou fica acinzentada.

Vale lembrar que o tamanho físico também mudou: 7,4" contra 7". Em resolução idêntica (1280×800), isso significa pixels ligeiramente maiores no OLED comparado ao LCD — a densidade cai de cerca de 215 PPI para perto de 206 PPI. Ninguém nota isso no uso normal, mas é o tipo de detalhe que aparece numa comparação técnica honesta.

| Característica | LCD | OLED |
|---|---|---|
| Diagonal | 7,0" | 7,4" |
| Tecnologia | IPS | HDR OLED |
| Resolução | 1280×800 | 1280×800 |
| Taxa | 60 Hz | 90 Hz |
| Brilho | 400 nits | até 1000 nits (HDR) |
| Vidro (edição 512 GB) | antirreflexo | antirreflexo |
| Vidro (demais edições) | padrão brilhante | padrão brilhante |

Um detalhe que costuma confundir: o vidro **antirreflexo** não é exclusivo do OLED. Ele equipa a edição de 512 GB do LCD e também as edições de 512 GB e 1 TB do OLED. Nas edições de entrada (64 GB do LCD, 512 GB "standard" em algumas regiões) o vidro é o normal, mais brilhante e suscetível a reflexos.

## Resumo

- LCD: 7" IPS 1280×800 a 60 Hz e 400 nits; OLED: 7,4" HDR OLED 1280×800 a 90 Hz e até 1000 nits.
- Os dois painéis têm a mesma resolução nativa; o OLED ganha em cor, contraste, pico de brilho e fluidez.
- `/sys/class/drm/card0-eDP-1/modes` lista as resoluções suportadas e o EDID revela o fabricante (`VLV`) e os modos detalhados.
- O brilho é lido e escrito em `/sys/class/backlight/<controlador>/brightness`, na escala de 0 a `max_brightness`.
- 90 Hz e HDR são recursos do OLED; o HDR depende de suporte por jogo e é re-negociado pelo Gamescope.
- O vidro antirreflexo equipa as edições de 512 GB (LCD) e 512 GB/1 TB (OLED), não todas as unidades.

## Exercícios

1. Liste `/sys/class/backlight/` e leia `brightness` e `max_brightness`. Anote o nome do controlador da sua unidade.
2. Altere o brilho para 50% da escala com `sudo sh -c 'echo N > /sys/class/backlight/<ctl>/brightness'` e confirme a leitura.
3. Leia `/sys/class/drm/card0-eDP-1/modes` e, se o `edid-decode` estiver disponível, decodifique o EDID procurando o fabricante e os modos detalhados. Há indício de 90 Hz?
4. Usando `xrandr --listmonitors`, extraia as dimensões físicas do painel em mm e estime a diagonal em polegadas, comparando com 7,0" (LCD) e 7,4" (OLED).
5. **Desafio.** Combine a leitura de backlight e EDID com a capacidade de bateria da seção anterior (`/sys/class/power_supply/BAT1/energy_full_design`). Escreva um pequeno roteiro de diagnóstico que determine, em três comandos, se uma unidade é LCD ou OLED e qual o acabamento do vidro esperado.
