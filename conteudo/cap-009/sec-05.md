A tela é o componente pelo qual você literalmente vê o Deck. O que o sistema enxerga, porém, não é "uma tela de 7 polegadas" — é um barramento, um controlador, um painel com timings e uma resolução. Esta seção cobre o que o Linux sabe sobre o display embutido do Deck, como inspecioná-lo e as diferenças de hardware entre os painéis LCD e OLED que o sistema operacional precisa tratar.

:::objetivos
- Identificar o painel do Deck via `sysfs` e EDID
- Diferenciar LCD (60Hz, IPS) e OLED (90Hz, HDR) pelo lado do sistema
- Ler a resolução nativa e as taxas de atualização disponíveis
- Inspecionar o backlight e o controle de brilho via `/sys`
- Entender como o Gamescope e o `amdgpu` gerenciam a exibição
:::

## Dois painéis, dois mundos

O Steam Deck existe em duas versões de tela:

- **LCD** — painel IPS de 7 polegadas, resolução 1280x800, taxa fixa de **60Hz**, brilho típico de 400 nits, gama de cores sRGB (~67% DCI-P3). É o painel dos modelos originais e ainda o mais comum.
- **OLED** — painel OLED de 7,4 polegadas, resolução 1280x800, taxa de **90Hz** com suporte a HDR (HDR10), brilho de até 1000 nits em pico, cobertura de ~110% DCI-P3.

Para o sistema operacional, a diferença não é cosmética. O painel OLED é reconhecido como um dispositivo de exibição com capacidades extras — HDR, taxa variável (VRR) até 90Hz e um mapeamento de cores diferente. O driver `amdgpu` consulta o **EDID** (Extended Display Identification Data) do painel para saber o que está conectado.

## Lendo o EDID: a certidão de nascimento do painel

O EDID é um bloco de 128 bytes (ou mais) que todo monitor envia ao sistema. O Deck não tem monitor externo, mas o painel embutido também reporta EDID — ele está disponível nos arquivos do `sysfs`:

```terminal
$ cat /sys/class/drm/card0-eDP-1/edid | hexdump -C | head -20
00000000  00 ff ff ff ff ff ff 00  0e 6f 16 22 00 00 00 00  |.........o."....|
00000010  00 1e 01 04 a5 1f 11 78  03 ee 95 a3 54 4c 99 26  |.......x....TL.&|
00000020  0f 50 54 00 00 00 01 01  01 01 01 01 01 01 01 01  |.PT.............|
00000030  01 01 01 01 01 01 4d d0  00 a0 f0 70 3e 80 30 20  |.....M....p>.0 |
00000040  35 00 55 50 21 00 00 1a  28 3c 00 a0 f0 70 3e 80  |5.UP!...( <...p>.|
...
```

Ler EDID bruto é obscuro. O pacote `edid-decode` transforma isso em algo legível:

```terminal
$ sudo apt install edid-decode
$ cat /sys/class/drm/card0-eDP-1/edid | edid-decode
edid-decode (hex):

Manufacturer: ANX Model 7530 Serial Number 1
Made in week 0 of 2022
Digital display
Maximum image size: 15 cm x 10 cm
Gamma: 2.20
Supported color formats: RGB 4:4:4
First detailed timing is the preferred timing
Display x,y Chromaticity:
  Red:   0.6396, 0.3291
  Green: 0.2998, 0.5986
  Blue:  0.1503, 0.0615
  White: 0.3125, 0.3281

Established timings supported:
  1280x800@60Hz
...
```

O fabricante "ANX" (Analogix) indica que o chip controlador do painel é um **ANX7530** — um bridge eDP que converte o sinal da GPU para o protocolo do painel LCD ou OLED. A resolução preferida aparece como `1280x800@60Hz` (LCD) ou `1280x800@90Hz` (OLED).

:::info
O `eDP-1` no caminho do sysfs significa *embedded DisplayPort*. O painel do Deck é conectado internamente via DisplayPort embarcado, e não via HDMI ou LVDS. É por isso que, no `xrandr`, você vê o display como `eDP` ou `eDP-1`.
:::

## Resolução e refresh rate via `xrandr`

O `xrandr` (X Resize and Rotate) consulta as resoluções e taxas que a GPU pode mandar para o painel:

```terminal
$ xrandr
Screen 0: minimum 16 x 16, current 1280 x 800, maximum 32767 x 32767
eDP-1 connected primary 1280x800+0+0 (normal left inverted right x axis y axis) 150mm x 100mm
   1280x800      60.00*+  90.00  
   1024x768      60.00  
   800x600       60.00    59.86  
   640x480       59.94  
```

No modelo OLED, `1280x800` aparece com dois valores: `60.00` e `90.00`. O asterisco marca o modo ativo e o `+` indica o preferido. No LCD, só o `60.00` existe. `xrandr` também mostra resoluções menores que o Deck pode usar — útil para jogos que exigem menos pixel ou para debug.

A resolução `1280x800` é uma proporção 16:10, não 16:9. A Valve escolheu 16:10 de propósito: há mais altura para menus, textos e barras de ferramentas, e menos faixas pretas em jogos antigos (que, ironicamente, também usavam 16:10 e 4:3).

:::dica
Se você conectar o Deck a um monitor externo (dock USB-C), o `xrandr` lista também `HDMI-A-1` ou `DP-1`. A GPU Van Gogh suporta até 4K@60Hz externo, mas o desempenho em jogos a essa resolução será mínimo.
:::

## Brilho e backlight pelo sysfs

O controle de brilho do Deck é exposto pelo kernel em `/sys/class/backlight/`. No caso do painel embutido:

```terminal
$ ls /sys/class/backlight/
amdgpu_bl1
$ cat /sys/class/backlight/amdgpu_bl1/max_brightness
255
$ cat /sys/class/backlight/amdgpu_bl1/brightness
180
```

O driver `amdgpu` expõe o backlight com o nome `amdgpu_bl1`. O `max_brightness` em 255 significa que a escala vai de 0 a 255. O valor atual (`180`) reflete o brilho que o usuário configurou pelo QAM (Quick Access Menu) do Steam.

No modelo OLED, a interface de backlight funciona de forma diferente — OLEDs não têm backlight; cada pixel emite luz própria. Ainda assim o kernel expõe um pseudocontrole que opera sobre o brilho do painel como um todo.

```terminal
$ cat /sys/class/backlight/amdgpu_bl1/actual_brightness
180
$ cat /sys/class/backlight/amdgpu_bl1/bl_power
0
```

O `bl_power` em `0` indica que o painel está ligado (não em suspend). Se o Deck desligar a tela após inatividade, esse valor vai para `4`.

## HDR no OLED: o que o sistema vê

O suporte a HDR no Deck OLED não é automático. O kernel e o driver precisam negociar as cores com o painel, e essa negociação aparece no `dmesg`:

```terminal
$ sudo dmesg | grep -i hdr
[    1.917234] amdgpu 0000:04:00.0: [drm] HDR10+ supported on eDP-1
[    1.917236] amdgpu 0000:04:00.0: [drm] Content Protection enabled on eDP-1
```

A linha `HDR10+ supported` confirma que a GPU reconhece o painel OLED como capaz de receber metadados HDR. O `Content Protection` (HDCP) é habilitado para streaming de conteúdo protegido. Na prática, o SteamOS usa o compositor **Gamescope** para gerenciar o mapeamento de cores HDR e a aplicação de curvas de transferência, e é por isso que o suporte a HDR passa pelo Steam, não pelo desktop KDE.

## Resumo

- O Deck tem dois painéis: LCD IPS de 60Hz e OLED de 90Hz com HDR — ambos 1280x800 (16:10).
- O EDID do painel está em `/sys/class/drm/card0-eDP-1/edid` e é decodificado com `edid-decode`.
- `xrandr` lista resoluções e refresh rates; o `*+` marca o modo atual e preferido.
- O brilho é controlado via `/sys/class/backlight/amdgpu_bl1/` com escala de 0 a 255.
- O painel OLED reporta `HDR10+` ao kernel e depende do Gamescope para mapeamento de cores.
- O painel do Deck é conectado via eDP (DisplayPort embutido), com chip bridge Analogix ANX7530.

## Exercícios

1. Rode `xrandr` e identifique a resolução atual e as taxas de atualização disponíveis. Seu painel é 60Hz ou 90Hz?
2. Decodifique o EDID do painel: `cat /sys/class/drm/card0-eDP-1/edid | edid-decode`. Quem é o fabricante? A resolução preferida bate com o `xrandr`?
3. Leia e altere o brilho via terminal: veja `cat /sys/class/backlight/amdgpu_bl1/brightness`, depois escreva um valor entre 0 e 255 com `echo`. Confirme que o brilho da tela muda.
4. Execute `sudo dmesg | grep -iE 'eDP|edid|hdr|backlight'` e leia as mensagens do boot relacionadas ao painel. Há alguma menção a HDR?
5. **Desafio.** Conecte o Deck a um monitor externo (dock USB-C) e rode `xrandr` novamente. Compare a resolução máxima do monitor externo com a do painel embutido. Por que o Deck consegue exibir 4K no monitor externo mas mantém 1280x800 no painel?