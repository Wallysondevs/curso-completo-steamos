Até 2024, HDR no Linux era um território fragmentado: o kernel suportava, o DRM suportava, mas cada compositor e cada toolkit interpretava os metadados de cor de um jeito diferente. O Steam Deck 2024 (OLED) mudou isso ao trazer um painel HDR de fábrica e um Gamescope com suporte completo a HDR — não como um patch experimental, mas como parte do pipeline de renderização principal. Entender como o Gamescope gerencia espaço de cores é o primeiro passo para tirar proveito do painel OLED.

:::objetivos
- Entender o pipeline de cor do Gamescope: PQ, rec.2020, EOTF e tone mapping
- Habilitar HDR via linha de comando com `--hdr-enabled`
- Verificar se o conteúdo está sendo processado em HDR via `journalctl`
- Diferenciar HDR nativo de HDR emulado em painéis SDR
- Diagnosticar problemas de washed out colors e metadados incorretos
:::

## O que "HDR" significa no contexto do Gamescope

HDR (High Dynamic Range) não é só "cores mais vibrantes". Tecnicamente, significa que cada pixel carrega informação de luminância codificada numa curva de transferência perceptual (EOTF — Electro-Optical Transfer Function), tipicamente a curva PQ (Perceptual Quantizer, padronizada como SMPTE ST 2084), com um espaço de cor amplo (rec.2020 ou DCI-P3) e profundidade de cor de 10 ou 12 bits por canal.

Num monitor SDR, um pixel branco tem luminância de cerca de 250-350 nits, codificado como (255, 255, 255) em 8 bits. Num painel HDR, o branco pode atingir 1000 nits, e a curva PQ codifica valores de 0 a 10000 nits em 10 bits — mas de forma não linear, dedicando mais bits aos tons escuros (onde o olho humano é mais sensível) e menos aos tons brilhantes.

```terminal
$ gamescope --hdr-enabled -w 1280 -h 800 -W 1280 -H 800 -O ,eDP-1 -- vkcube
wlserver: [backend/drm/drm.c:180] connector eDP-1: HDR static metadata: ST 2084, EOTF: PQ
wlserver: [backend/drm/drm.c:185] connector eDP-1: HDR10 supported, EDID primaries: red(0.680,0.320) green(0.265,0.690) blue(0.150,0.060) white(0.313,0.329)
wlserver: [backend/drm/drm.c:190] connector eDP-1: max luminance: 1000 cd/m², min luminance: 0.0050 cd/m²
```

A saída mostra três informações fundamentais: a EOTF é PQ (ST 2084), o painel declara suporte HDR10 com as primárias de cor do EDID e a luminância máxima é 1000 cd/m² com mínima de 0,005 cd/m² (preto quase absoluto, característico do OLED). O Gamescope lê esses metadados do EDID do painel e configura o pipeline de cor adequadamente.

## O pipeline de cor do Gamescope

O Gamescope implementa um gerenciamento de cor em três estágios:

1. **Entrada**: a aplicação entrega frames em SDR (sRGB, 8 bits) ou HDR (rec.2020 + PQ, 10 bits via Vulkan `VK_COLOR_SPACE_HDR10_ST2084_EXT`).
2. **Composição interna**: o Gamescope trabalha em espaço de cor linear com ponto flutuante de 16 bits por canal (fp16). Todas as transformações — FSR, NIS, overlay do Steam — operam nesse espaço linear.
3. **Saída**: o framebuffer linear é convertido para o espaço do painel (rec.2020 + PQ para HDR, sRGB + gamma 2.2 para SDR) e entregue ao DRM com os metadados HDR corretos via propriedades `HDR_OUTPUT_METADATA` e `COLORSPACE`.

```terminal
$ journalctl -u gamescope --since "2 min ago" | grep -i -E 'hdr|color|eotf'
Nov 14 11:30:42 steamdeck gamescope[1432]: wlserver: HDR output enabled (PQ, rec.2020)
Nov 14 11:30:42 steamdeck gamescope[1432]: wlserver: Color management: 3D LUT loaded (65x65x65)
Nov 14 11:30:42 steamdeck gamescope[1432]: wlserver: Shaper LUT: 4096 entries
```

A `3D LUT` (lookup table tridimensional, 65×65×65 amostras) mapeia cores do espaço linear interno para o espaço do painel. O `Shaper LUT` de 4096 entradas aplica a curva PQ. Essas estruturas são carregadas na GPU como texturas 3D e aplicadas no último estágio do pipeline, antes do scanout.

:::info
No Steam Deck OLED, a Valve calibra cada painel de fábrica e armazena a LUT de calibração no firmware. O Gamescope carrega essa LUT no boot, garantindo que as cores sejam precisas sem depender de perfil ICC no espaço de usuário.
:::

## HDR em painel SDR: o que acontece

O Steam Deck LCD original (pré-OLED) tem painel SDR. Se você passar `--hdr-enabled` nele, o Gamescope não falha — ele faz **tone mapping**: converte o conteúdo HDR para SDR usando um operador de tone mapping (tipicamente Reinhard ou ACES aproximado) que comprime a faixa dinâmica alta para caber nos ~350 nits do painel LCD.

```terminal
$ gamescope --hdr-enabled -w 1280 -h 800 -- vkcube
wlserver: [backend/drm/drm.c:198] connector eDP-1: no HDR support in EDID, falling back to SDR
wlserver: [backend/drm/drm.c:200] connector eDP-1: tone mapping HDR content to SDR
```

O jogo ou aplicação ainda pode enviar conteúdo HDR, e o Gamescope vai aceitar, mas o resultado no painel será SDR com cores mapeadas. Isso é útil para desenvolvimento (testar HDR sem hardware HDR), mas não oferece a experiência HDR real.

:::atencao
Conteúdo SDR exibido num pipeline HDR pode parecer "lavado" (washed out) se o tone mapping não estiver configurado corretamente. Isso acontece quando uma aplicação SDR é tratada como HDR e seus valores sRGB são interpretados como PQ. No Steam Deck, a Valve resolve isso explicitamente: o Steam Client detecta se o conteúdo é SDR ou HDR e informa o Gamescope via protocolo Wayland privado (`gamescope_swapchain_override`). Se você estiver rodando o Gamescope manualmente, conteúdo SDR será exibido corretamente porque o Gamescope assume SDR como padrão.
:::

## Conferindo o estado HDR em tempo real

O Gamescope expõe informações de cor via `gamescope` protocol e também via o sistema de depuração do DRM:

```terminal
$ cat /sys/kernel/debug/dri/0/state 2>/dev/null | grep -A5 "colorspace"
colorspace: Default
```

Se HDR estiver ativo, o campo muda:

```terminal
$ sudo cat /sys/kernel/debug/dri/0/state | grep -A5 "colorspace"
colorspace: BT2020_RGB
```

A propriedade `colorspace` no estado atômico do DRM mostra `BT2020_RGB` quando o Gamescope está enviando HDR. Essa é a verificação definitiva de que o pipeline HDR está funcionando ponta a ponta, independentemente do que os logs dizem.

## Resumo

- O Gamescope implementa HDR com pipeline de cor em três estágios: entrada (SDR/HDR) → composição linear fp16 → saída (PQ + rec.2020 via 3D LUT).
- A flag `--hdr-enabled` ativa HDR no Gamescope; os metadados vêm do EDID do painel.
- O Steam Deck OLED tem calibração de fábrica com LUT 65×65×65 carregada pelo Gamescope no boot.
- Em painéis SDR, o Gamescope aplica tone mapping automático; o conteúdo é aceito mas exibido em SDR.
- `/sys/kernel/debug/dri/0/state` confirma se o pipeline está enviando `BT2020_RGB` (HDR) ou `Default` (SDR).

## Exercícios

1. No Steam Deck OLED (ou com `--hdr-enabled` em outro hardware), execute `gamescope --hdr-enabled -w 1280 -h 800 -- vkcube` e inspecione `journalctl -b | grep -i "hdr\|eotf\|colorspace" | tail -20`.
2. Compare a saída de `sudo cat /sys/kernel/debug/dri/0/state | grep colorspace` com e sem `--hdr-enabled`. O que muda?
3. Execute um vídeo HDR de teste com `mpv --vo=gpu-next --target-colorspace-hint --target-peak=1000` dentro do Gamescope com `--hdr-enabled`. A imagem parece correta ou lavada?
4. No Steam Deck LCD, ative `--hdr-enabled`. O Gamescope reporta tone mapping? As cores parecem diferentes de quando a flag não está presente?
5. **Desafio.** Com `--hdr-enabled` ativo, use `vulkaninfo --summary` dentro do Gamescope para listar as extensões Vulkan disponíveis. Encontre `VK_EXT_hdr_metadata` e `VK_EXT_swapchain_colorspace`. Explique como essas extensões permitem que um jogo envie metadados HDR diretamente para o compositor.