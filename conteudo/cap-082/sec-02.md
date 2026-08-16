O dock é o acessório que transforma o Steam Deck de portátil em desktop de verdade: liga um monitor, um teclado e um mouse, e ainda carrega o aparelho pelo mesmo cabo. Tudo isso passa por um único conector USB-C que negocia, em segundos, dados, vídeo e energia ao mesmo tempo. Entender essa negociação é o que separa quem compra o dock certo de quem cai em acessório que só espelha a tela pela metade.

:::objetivos
- Entender os modos que a porta USB-C do Deck negocia ao conectar um dock
- Diferenciar DisplayPort alt-mode de simples conversão para HDMI
- Conectar o Deck a um monitor externo e controlar resolução e frequência
- Identificar os limites de docks de terceiros por comando
- Diagnosticar monitores que não aparecem ou aparecem com resolução errada
:::

## O que acontece quando o dock encaixa

A porta USB-C do Steam Deck suporta USB 3.2 Gen 2 para dados e **DisplayPort 1.4 alt-mode** para vídeo. "Alt-mode" significa que alguns pares de fios do cabo, que normalmente carregam dados USB, são re-tarefados para transportar um sinal DisplayPort nativo. Não existe conversão de sinal nesse caminho — o monitor recebe DisplayPort puro, e o dock apenas o encaminha.

Quando o dock tem saída HDMI, a conversão DisplayPort → HDMI acontece **dentro do chip do dock**. É transparente para você, mas importa saber: essa conversão define o teto de resolução e de taxa de quadros que o HDMI vai suportar. Um dock bom entrega 4K a 60 Hz; um barato pode travar em 4K a 30 Hz ou em 1080p.

```terminal
$ sudo dmesg | grep -i -E 'altmode|displayport|ucsi' | tail -6
[   12.344120] ucsi_acpi USBC000:00: PPM init done
[   14.812330] usb 1-1: new high-speed USB device number 3 using xhci_hcd
[   15.091442] typec port0: alt mode 0: DisplayPort 1.4
[   15.092010] typec port0: alt mode 0: DisplayPort 1.4 active
```

A linha `typec port0: alt mode ... DisplayPort 1.4 active` é a confirmação de que a negociação funcionou. Se ela não aparecer, o vídeo pelo dock não vai funcionar, não importa o que o LED do dock indique. É o `dmesg` que diz a verdade.

## Conectando e lendo os monitores

No modo Desktop, o SteamOS trata o painel interno e o monitor externo como telas independentes. O comando `xrandr` é a porta de entrada para ver o que foi reconhecido.

```terminal
$ xrandr
Screen 0: minimum 8 x 8, current 3200 x 1080, maximum 16384 x 16384
eDP-1 connected primary 1280x800+0+0 (normal left inverted right x axis y axis) 286mm x 179mm
   1280x800      60.00*+  40.00
HDMI-A-1 connected 1920x1080+1280+0 (normal left inverted right x axis y axis) 480mm x 270mm
   1920x1080     60.00*+  50.00    59.94
   1280x720      60.00    50.00    59.94
```

A primeira linha diz a resolução virtual total (`current 3200 x 1080`): o painel interno `eDP-1` em 1280×800 mais o monitor `HDMI-A-1` em 1920×1080 colocado à direita (`+1280+0`). O asterisco marca o modo ativo, e o `+` o modo preferido anunciado pelo monitor via EDID.

O nome da conexão revela o caminho do sinal: saídas nativas DisplayPort aparecem como `DP-*`, e conversões para HDMI como `HDMI-A-*`. Se o seu dock só tem HDMI, verá sempre `HDMI-A-*`.

```terminal
$ cat /sys/class/drm/card0-HDMI-A-1/status
connected
$ cat /sys/class/drm/card0-HDMI-A-1/modes
1920x1080
1280x720
720x480
```

Os nós em `/sys/class/drm/` expõem o que o kernel enxerga diretamente do Direct Rendering Manager, sem a camada do X11. Ler `modes` aqui lista o que o monitor **realmente** anunciou via EDID — útil quando o `xrandr` mostra algo estranho.

:::dica
O painel interno do Deck roda nativamente a 1280×800 no LCD e 1280×800 no OLED. Ao espelhar a tela num monitor 4K, o SteamOS precisa escalar o conteúdo, e a imagem pode ganhar um atraso perceptível. Para jogar, prefira **estender** (extend) em vez de espelhar, ou configure o monitor externo como primário pelo modo Desktop.
:::

## Resolução, frequência e o teto de cada dock

O DisplayPort 1.4 do Deck consegue empurrar 4K a 60 Hz. Na prática, o gargalo quase nunca é o Deck, e sim o chip de conversão do dock ou a qualidade do cabo. A tabela resume os cenários comuns:

| Saída do dock | Melhor cenário | Pior cenário (dock barato) |
|---|---|---|
| DisplayPort 1.4 | 4K @ 60 Hz | 4K @ 30 Hz |
| HDMI 2.0 | 4K @ 60 Hz | 1080p @ 60 Hz |
| HDMI 1.4 (antigo) | 1080p @ 60 Hz | 720p |

Para ver a taxa real negociada com o monitor, consulte o modo ativo no `xrandr` — o `60.00*` ao lado da resolução é a frequência em Hz.

```terminal
$ xrandr --output HDMI-A-1 --mode 1920x1080 --rate 60
$ xrandr | grep 'HDMI-A-1 connected'
HDMI-A-1 connected 1920x1080+1280+0 (normal left inverted right x axis y axis) 480mm x 270mm
```

O primeiro comando força o modo 1080p a 60 Hz na saída HDMI; o segundo confirma que a mudança foi aplicada. Se o modo solicitado não existir na lista de `modes`, o `xrandr` simplesmente recusa — é sinal de que o cabo ou o dock não entregam a largura de banda necessária.

:::atencao
A taxa de quadros é a primeira vítima de cabo ruim. Um cabo USB-C que só foi certificado para dados pode até acender a imagem, mas a 30 Hz ou com perda intermitente de sinal. Para 4K @ 60 Hz, use cabo USB-C com suporte a DisplayPort alt-mode (idealmente "4K60" ou "DP 1.4" na especificação) e, de preferência, curto — cabo longo piora a integridade do sinal.
:::

## Quando o monitor não aparece

O problema mais comum em docks é o monitor ligar, mas o Deck não reconhecer nada. A ordem de investigação é sempre a mesma.

```terminal
$ sudo dmesg | tail -20 | grep -i -E 'dp|hdmi|hpd|typec'
[  220.118004] typec port0: alt mode 0: DisplayPort 1.4
[  220.118881] typec port0: alt mode 0: DisplayPort 1.4 active
[  222.807416] i915 0000:04:00.0: [drm] HPD interrupt received
```

`HPD` é o *hot-plug detect*: o pulso que o monitor envia ao ser conectado. Se a negociação alt-mode apareceu mas não há `HPD interrupt`, o problema costuma estar no cabo HDMI/DP entre o dock e o monitor, não no Deck.

```terminal
$ cat /sys/class/drm/card0-HDMI-A-1/status
disconnected
```

`disconnected` mesmo com o monitor aceso indica que o EDID não chegou. Tente: trocar o cabo externo, ligar o monitor **antes** de plugar o dock, ou testar outro dock. Se nada resolver, o chip de conversão do dock é o suspeito principal.

:::perigo
Evite conectar e desconectar o dock repetidamente em rápida sucessão enquanto o Deck está sob carga. A negociação de alt-mode e Power Delivery gera picos de corrente que, em docks sem proteção, podem danificar a porta USB-C do Deck. Espere o `dmesg` estabilizar antes de reconectar.
:::

## Resumo

- O vídeo do dock usa DisplayPort alt-mode: sinal DP nativo re-tarefado nos fios do USB-C, sem conversão.
- Saída HDMI existe porque o chip do dock converte DP → HDMI, e esse chip define o teto de resolução/frequência.
- `xrandr` mostra monitores conectados, resolução ativa e frequência; o asterisco marca o modo ativo.
- Os nós `/sys/class/drm/card0-*/` revelam status e modos anunciados via EDID direto do kernel.
- `dmesg` confirma a negociação (`DisplayPort 1.4 active`) e a chegada do sinal (`HPD interrupt`).

## Exercícios

1. Conecte o Deck a um monitor via dock e rode `xrandr`. O monitor aparece como `DP-*` ou `HDMI-A-*`? Em que resolução e frequência?
2. Com o monitor conectado, leia `cat /sys/class/drm/card0-HDMI-A-*/modes` (ajuste o nome) e confira se a resolução ativa está na lista de modos anunciados.
3. Force a saída externa para uma resolução diferente com `xrandr --output <saida> --mode <resolucao> --rate 60` e confirme a mudança.
4. Desconecte o cabo HDMI/DP do dock mantendo o dock ligado ao Deck. Observe `dmesg` e o status em `/sys/class/drm/`. Que mensagens aparecem e desaparecem?
5. **Desafio.** Usando o que você aprendeu na seção sobre energia (Power Delivery) e nesta, monte um teste de estresse: plugue o dock, rode um vídeo 4K no monitor externo e monitore simultaneamente `cat /sys/class/power_supply/BAT1/status` a cada 30 s. A bateria carregou, descarregou ou ficou estável durante o uso intenso de vídeo? Explique os dois fenômenos (vídeo e carga) juntos.
