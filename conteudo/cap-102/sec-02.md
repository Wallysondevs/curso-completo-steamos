A tela é o último estágio de um pipeline que começa na GPU e termina nos seus olhos. Entre os dois acontece uma negociação de taxas de atualização, formatos de cor e largura de banda — até algo dar errado: tearing, cores lavadas, ou um cabo que deveria aguentar 4K a 120 Hz e não aguenta. Estes termos descrevem essa negociação, e o Steam Deck os expõe de forma mais explícita que qualquer console.

:::objetivos
- Entender como o VRR elimina tearing e o porquê dos 40 Hz no Deck
- Diferenciar FreeSync, FreeSync Premium e VRR genérico
- Compreender HDR e a diferença entre 8-bit e 10-bit de cor
- Explicar como o DSC comprime o sinal de vídeo sem perdas visíveis
- Inspecionar modos de vídeo e saídas no terminal do Deck
:::

## VRR: quando a tela obedece ao jogo

Uma tela tradicional tem *refresh rate* fixo — 60 Hz, por exemplo —, desenhando um novo quadro 60 vezes por segundo. Um jogo, porém, não produz frames em intervalos regulares, e o tempo de render de cada quadro flutua. Quando essas duas cadências se desencontram, surge o *tearing*: duas metades de quadros diferentes na mesma varredura.

A solução clássica é o vsync, que obriga o jogo a esperar a tela — mas adiciona latência e, quando o jogo não mantém 60 FPS, cai para 30 FPS. O **VRR** (*Variable Refresh Rate*) inverte a lógica: é a tela que ajusta a própria taxa para casar com a cadência do jogo, eliminando tearing sem os saltos do vsync.

O Deck suporta VRR na tela integrada (OLED) e em monitores externos. O sweet spot de **40 Hz** é a aplicação mais elegante: com a tela a 40 Hz e o jogo a 40 FPS, cada frame ocupa exatamente uma varredura (25 ms), com estabilidade visual de 60 FPS e um terço a menos de custo.

```terminal
$ gamescope --help | grep -A2 -i "refresh"
  --ref                          use explicit refresh rate
  --force-windows-fullscreen     force full screen windows
  --framerate-limit <n>          limit the framerate
```

O gamescope, o compositor do Deck, expõe refresh rate e limite de framerate como flags. No modo jogo, o deslizador de *Framerate Limit* no Quick Access Menu ajusta tela e limite de quadros em conjunto, e os 40 Hz aparecem porque dividem limpo a varredura do painel OLED.

## FreeSync e os padrões por trás do nome

**FreeSync** é a marca da AMD para a implementação de VRR sobre DisplayPort e HDMI. Por baixo, ela usa o padrão **Adaptive-Sync** da VESA, que o Deck também respeita: monitores "VRR compatível" (inclusive alguns "G-SYNC Compatible") funcionam com GPUs AMD.

| Nível | Significado ||---|---|| FreeSync | VRR básico || FreeSync Premium | 120 Hz+ e LFC || FreeSync Premium Pro | Premium + HDR |O **LFC** (*Low Framerate Compensation*) duplica quadros quando o jogo cai abaixo da faixa mínima da tela (ex.: 30 FPS num painel 48-120 Hz), mantendo a varredura dentro da faixa suportada sem tearing.
```terminal
$ cat /sys/class/drm/card0-*/modes
1440x900
```

O diretório `/sys/class/drm/` contém os *connectors* do DRM (a interface de vídeo do kernel). Cada `card0-*` representa uma saída — o painel interno (eDP) ou a saída DisplayPort via USB-C. O arquivo `modes` lista as resoluções que o conector anuncia, uma por linha: no painel interno do LCD, um único modo nativo de 1440x900.

## HDR: mais luz e mais passos de cor

**HDR** (*High Dynamic Range*) é a expansão simultânea de duas coisas: o brilho máximo (de ~250 nits do SDR para 600-1000 nits) e a profundidade de cor (de 8 para 10 bits por canal). Os dois andam juntos porque, para representar o espaço entre um preto profundo e um branco muito brilhante sem *banding* (degraus visíveis entre tons), você precisa de mais degraus de codificação.

A **profundidade de cor** é o número de bits por canal. Em 8-bit, cada canal tem 256 níveis (16,7 milhões de combinações); em 10-bit, 1024 níveis (mais de um bilhão). Isso suaviza transições em gradientes de céu, névoa e fogo, onde o 8-bit mostra degraus visíveis.

O Steam Deck OLED tem painel HDR com suporte real a 10-bit, e o SteamOS 3.6 ativou HDR também em jogos via renderização *shader-based*. O LCD é SDR de 8-bit.

```terminal
$ xrandr --query
Screen 0: minimum 16 x 16, current 1440 x 900, maximum 32767 x 32767
eDP-1 connected primary 1440x900+0+0 300mm x 190mm
   1440x900      60.00*+
$ xrandr --properties | grep -i "colorspace"
	Colorspace: 
		supported: Default, BT709_YCC, opRGB, BT2020_RGB, BT2020_YCC
```

O `xrandr` inspeciona a configuração de vídeo. `1440x900 60.00*+` marca o modo ativo (`*`) e o preferido (`+`). A propriedade `Colorspace` lista os espaços suportados — `BT2020` é o espaço de cores do HDR, presente mesmo sem painel HDR, porque a GPU sabe conversar com ele.

:::info
O HDR no Linux é gerenciado em camadas: o gamescope faz a composição em HDR e o *tone mapping* para o painel. Em monitores externos, o DisplayPort 1.4 transmite HDR10 sem compressão até 4K — acima disso o DSC entra.
:::

## DSC e a matemática da largura de banda

**DSC** (*Display Stream Compression*) é um algoritmo de compressão de vídeo *visually lossless* — sem perda perceptível — usado para espremer resoluções e taxas altas em cabos com banda insuficiente.
No Deck, as saídas USB-C usam **DisplayPort Alt Mode** (DP 1.4) ou **HDMI Alt Mode** (HDMI 2.0):
Para 4K a 120 Hz em 10-bit, o sinal descomprimido exige ~39 Gbit/s; o DisplayPort 1.4 entrega no máximo 25,92 Gbit/s. O DSC comprime o stream a 2,5:1–3:1 antes da transmissão, e o monitor descomprime do outro lado — daí "visualmente sem perdas".

No Deck, as saídas de vídeo são via USB-C, em **DisplayPort Alt Mode** (DP 1.4) ou **HDMI Alt Mode** (conectando a HDMI 2.0). As limitações de cada uma definem o teto prático:

| Saída | Banda máxima | Teto prático (sem DSC) |
|---|---|---|
| DisplayPort 1.4 | 25,92 Gbit/s | 4K a 60 Hz, 8-bit |
| HDMI 2.0 | 18 Gbit/s | 4K a 60 Hz (4:2:0), 1440p a 144 Hz |

```terminal
$ cat /sys/class/drm/card0-DP-1/modes
[... 42 linhas omitidas ...]
3840x2160      60.00
3840x2160      30.00
2560x1440     144.00
1920x1080     120.00
1280x800       60.00
```

Esse conector mostra o que o monitor anuncia: 4K@60 e 1440p@144 no mesmo painel. 4K@120 não aparece — além da banda do DP 1.4 sem DSC.

:::atencao
Nem todo dock USB-C suporta DisplayPort Alt Mode, e alguns dividem a banda entre vídeo e USB 3.0 — caindo para USB 2.0 nas portas adicionais quando o vídeo 4K está ativo. Causa comum de "o 4K não aparece" é um cabo HDMI antigo, limitado a 10,2 Gbit/s.
:::

## Scaling e frame pacing: os ajustes que mudam a percepção

**Scaling** é renderizar o jogo numa resolução interna menor e ampliá-la para a resolução da tela. O **FSR** (FidelityFX Super Resolution) é o upscaler da AMD incluído no Deck: o jogo renderiza a 800p e o FSR reconstrói para 900p nativo. O **NIS** (NVIDIA Image Scaling) é o equivalente da NVIDIA, disponível via gamescope. E o **integer scaling** é o caso em que cada pixel é duplicado por um fator inteiro — 720p para 1440p é exatamente 2x —, preservando bordas nítidas em pixel art.
**Scaling** é renderizar o jogo em resolução menor e ampliar. O **FSR** (FidelityFX Super Resolution) é o upscaler da AMD: renderiza a 800p e reconstrói para 900p nativo. O **NIS** (NVIDIA Image Scaling) está disponível via gamescope. O **integer scaling** duplica pixels por fator inteiro (720p→1440p), preservando bordas nítidas em pixel art.
A **frame pacing** é a regularidade temporal com que os quadros são apresentados. 30 FPS com cada frame durando exatamente 33,3 ms parecem suaves; 30 FPS oscilando entre 20 e 46 ms parecem engasgados, mesmo com a mesma média. Consoles têm frame pacing melhor que PCs porque o hardware é fixo.

```terminal
$ gamescope --help | grep -iE "fsr|nis|integer"
  -F, --fsr <fsr-mode>           enable AMD FSR upscaling
  -n, --nis <nis-mode>           enable NVIDIA NIS upscaling
  -i, --integer                  integer scaling
```

O gamescope aplica FSR, NIS e integer scaling como flags de composição, independentes do jogo. [A seção sobre o gamescope](#/cap-102/sec-05) detalha a orquestração no modo jogo.

## Resumo

- VRR faz a tela adaptar a taxa de atualização à cadência do jogo, eliminando tearing sem a latência do vsync.
- FreeSync é a marca AMD do VRR; os níveis Premium adicionam LFC e HDR.
- HDR expande brilho e profundidade de cor; 10-bit dá 1024 níveis por canal contra 256 do 8-bit, suavizando gradientes.
- DSC comprime o vídeo de forma "visualmente sem perdas" para caber em cabos com banda limitada; DP 1.4 e HDMI 2.0 definem o teto do Deck.
- FSR, NIS e integer scaling são formas de upscaling via gamescope; frame pacing mede a regularidade da apresentação dos quadros.
- `xrandr`, `gamescope --help` e `/sys/class/drm/` expõem modos, cores e refresh rates pelo terminal.

## Exercícios

1. Conecte o Deck a um monitor externo e rode `cat /sys/class/drm/card0-DP-1/modes`. Liste os três modos de maior resolução e compare com o manual do monitor — todos os modos anunciados aparecem?
2. Rode `xrandr --query` e identifique o conector ativo, o modo corrente (`*`) e o preferido (`+`). Descreva em uma frase o que cada símbolo significa.
3. Com `xrandr --properties`, procure a propriedade `Colorspace` e liste os valores suportados. O seu monitor anuncia `BT2020`? Isso significa que ele é HDR?
4. No Quick Access Menu, ajuste o Framerate Limit para 40 Hz num jogo pesado e observe o overlay: o consumo de watts caiu comparado a 60 FPS? Anote os números.
5. **Desafio.** Calcule a largura de banda para 1440p a 144 Hz em 8-bit 4:4:4 (use ~24 bits por pixel). Compare com os 18 Gbit/s do HDMI 2.0 e os 25,92 Gbit/s do DisplayPort 1.4. Qual saída aguenta esse modo sem DSC, e por quê?