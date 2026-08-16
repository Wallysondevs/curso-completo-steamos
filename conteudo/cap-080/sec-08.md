Você pode trocar de distro, de interface e de filosofia — mas o que decide se um jogo roda bem continua sendo a pilha que fica embaixo de tudo: o kernel, o driver de vídeo, o Mesa e o conjunto de periféricos que o sistema reconhece. Numa distro alternativa ao SteamOS, essa camada é mais sua responsabilidade do que nunca. Saber inspecionar drivers, entender HDR/VRR e manter gamepads e sensores funcionando é o que evita trocar de sistema para herdar os mesmos problemas.

:::objetivos
- Inspecionar kernel, driver e Mesa em qualquer distro de gaming
- Entender o papel do AMDGPU/Intel e do Mesa na renderização
- Verificar e ativar HDR e VRR quando o painel suporta
- Configurar gamepads, gyro e periféricos de entrada
- Diagnosticar problemas de driver e desempenho
:::

## A pilha que renderiza o jogo

Todo frame que aparece na tela percorre uma cadeia fixa: o jogo chama uma API gráfica (Vulkan ou OpenGL), o **Mesa** traduz essa chamada para o hardware, e o **driver do kernel** (AMDGPU ou i915) fala com a GPU. No SteamOS, a Valve ajusta e valida essa cadeia para você; numa distro alternativa, você precisa ao menos saber inspecioná-la.

```terminal
$ uname -r
6.12.9-200.fc41.x86_64
$ glxinfo -B | grep -E 'OpenGL (renderer|version)'
OpenGL renderer string: AMD Radeon Graphics (radeonsi, rembrandt, LLVM 18.1.6, DRM 3.59, 6.12.9-200.fc41.x86_64)
OpenGL version string: 4.6 (Compatibility Profile) Mesa 24.3.4
```

Essa saída condensa quase tudo que importa: o kernel (`6.12.9`), o driver OpenGL em uso (`radeonsi`, o driver Mesa para GPUs AMD) e a versão do Mesa (`24.3.4`). Em GPUs NVIDIA, o renderer mostraria o driver proprietário (`NVIDIA GeForce ...`) em vez do Mesa.

Para Vulkan — a API dominante hoje —, o equivalente é o `vulkaninfo`:

```terminal
$ vulkaninfo --summary 2>/dev/null | grep -E 'deviceName|driverName'
	deviceName        = AMD Radeon Graphics (RADV REMBRANDT)
	driverName        = radv
```

O `radv` é o driver Vulkan do Mesa para AMD. O `deviceName` confirmando "RADV" (e não o vulkan de software `llvmpipe`) é o sinal de que a aceleração por hardware está ativa de verdade.

## AMD, Intel e o caso NVIDIA

No mundo das distros gaming, a hierarquia de suporte é clara. **AMD e Intel** têm drivers abertos mantidos *dentro* do kernel e do Mesa — você atualiza o sistema e o driver melhora junto, sem instalar nada proprietário. É por isso que SteamOS, Bazzite e ChimeraOS orbitam essas duas marcas.

**NVIDIA** é o caso aparte: o driver "bom" (com DLSS, CUDA, desempenho pleno) é proprietário e não vive no kernel aberto da mesma forma. O Bazzite contorna isso com uma imagem dedicada que já embute o driver:

```terminal
$ nvidia-smi
+-----------------------------------------------------------------------------+
| NVIDIA-SMI 550.120     Driver Version: 550.120     CUDA Version: 12.4    |
|-------------------------------+----------------------+----------------------|
|   0  NVIDIA GeForce RTX ...   Off | 00000000:01:00.0 Off |              N/A |
```

O `nvidia-smi` é o comando que confirma que o driver proprietário carregou. Num ChimeraOS ou SteamOS (foco AMD), essa GPU vira dor de cabeça; no Bazzite NVIDIA, ela é o caminho oficial.

:::nota
A nomenclatura dos drivers AMD confunde no começo: existe `radeonsi` (OpenGL), `radv` (Vulkan) e, mais recentemente, `amdvlk` (o Vulkan alternativo da AMD, via `vulkan-radeon`). Para jogos, o `radv` (Mesa) é quase sempre a melhor escolha. Verificar qual está ativo com `vulkaninfo --summary` evita instalar `amdvlk` por engano e "perder" desempenho.
:::

## HDR e VRR na prática

HDR e VRR são os dois recursos que mais vendem painéis e os dois que mais dependem de toda a cadeia estar alinhada. O HDR passa por kernel + driver + compositor + jogo; o VRR passa por painel + cabo + driver + compositor.

Para descobrir se o sistema *enxerga* um painel HDR, o `drm_info` e o `edid-decode` leem os metadados da tela:

```terminal
$ edid-decode /sys/class/drm/card1-eDP-1/edid 2>/dev/null | grep -iE 'HDR|Colorimetry|EOTF'
    HDR Static Metadata Data Block
```

A presença de um "HDR Static Metadata Data Block" no EDID indica que o painel anuncia suporte a HDR. A partir daí, o compositor (Gamescope) precisa estar lançado com as flags de HDR ativas, como visto na seção sobre Gamescope.

```terminal
$ gamescope --hdr-enabled --steam
```

Para o VRR, o ponto de partida é o driver e a conexão física:

```terminal
$ cat /sys/module/amdgpu/parameters/freesync_video 2>/dev/null
```

O FreeSync (nome AMD do VRR) precisa de um painel compatível e de um cabo de boa qualidade — DisplayPort ou HDMI 2.1. Um hub USB-C barato no meio do caminho aniquila o VRR silenciosamente.

:::atencao
HDR com a cadeia quebrada não "falha com erro" — ele mostra a imagem lavada, com cores mortas ou um brilho estranho. Se o HDR parecer pior que o SDR, o problema quase nunca é o painel, e sim um elo fora do lugar (jogo sem saída HDR, compositor sem a flag, ou EDID não lido). Teste desligando a flag antes de culpar o hardware.
:::

## Gamepads, gyro e entrada

A experiência de console depende tanto da entrada quanto do vídeo. Gamepads modernos (Xbox, DualSense, Switch Pro, e os controles nativos dos handhelds) usam o `hid-playstation`/`hid-nintendo`/`xpad` no kernel, e o Steam Input faz o mapeamento de alto nível por cima.

```terminal
$ lsusb | grep -iE 'xbox|sony|nintendo|controller'
Bus 003 Device 002: ID 054c:0df2 Sony Corp. DualSense wireless controller
$ evtest 2>/dev/null | grep -i 'playstation\|dualsense'
```

O `evtest` enumera os dispositivos de entrada e confirma que o kernel criou um nó de evento para o gamepad. O gyro (giroscópio) de controles como o DualSense e o Steam Controller aparece como um eixo adicional no mesmo dispositivo — o Steam Input o expõe como "giroscópio" para ser mapeado.

```terminal
$ ls /dev/input/by-id/ | grep -iE 'dualsense|xbox|controller'
```

O diretório `/dev/input/by-id/` lista os nós por identificador estável, o que ajuda a escrever regras de configuração ou a descobrir se um hub USB está duplicando entradas (causa clássica de "controle mexeu sozinho").

## Diagnosticando desempenho

Quando o jogo está lento, a ordem de investigação é: **temperatura/TDP → driver → compositor**. Num portátil, o throttling térmico é a primeira suspeita, e o Bazzite expõe os limites:

```terminal
$ sensors | grep -iE 'Tctl|Package|edge'
Tctl:         +78.0°C
```

Temperatura acima de ~90 °C com queda de FPS é o retrato do throttling. Num handheld, reduzir o TDP ou o FPS alvo resolve mais que mexer em driver. Se a temperatura está boa e o FPS continua baixo, aí sim vale olhar se a aceleração está ativa (`glxinfo`/`vulkaninfo`) e se o compositor não está forçando resolução alta demais.

```terminal
$ MANGOHUD=1 %command%
```

O MangoHud (facilitado nas distros gaming) sobrepõe FPS, temperatura, clock de GPU/CPU e uso — a forma mais direta de ver, em tempo real, qual recurso é o gargalo.

## Resumo

- A renderização passa por kernel + Mesa + driver; `glxinfo -B` e `vulkaninfo --summary` revelam qual está ativo.
- AMD (`radeonsi`/`radv`) e Intel têm drivers abertos integrados; NVIDIA exige imagem dedicada no Bazzite.
- `edid-decode` revela HDR no EDID; VRR (FreeSync) depende de painel, cabo e driver alinhados.
- `lsusb`/`evtest`/`/dev/input/by-id/` confirmam gamepads e gyro; hubs USB podem duplicar entradas.
- `sensors` detecta throttling térmico; MangoHud sobrepõe as métricas em tempo real.

## Exercícios

1. Rode `glxinfo -B` e `vulkaninfo --summary`. Identifique o renderer, o driver (radeonsi/radv/NVIDIA) e a versão do Mesa. Está tudo acelerado por hardware?
2. Verifique o suporte a HDR do seu painel com `edid-decode` e relate se o bloco de metadados HDR existe.
3. Conecte um gamepad e confirme-o com `lsusb` e `evtest`. Descubra o nó em `/dev/input/by-id/` e teste um eixo (analógico) com `evtest` apontando para o dispositivo.
4. Rode um jogo com `MANGOHUD=1` e capture a temperatura e o FPS. Se houver throttling, registre em que temperatura ele começou.
5. **Desafio.** Ative HDR de ponta a ponta num jogo compatível: confirme o EDID, lance o Gamescope com `--hdr-enabled`, e rode o jogo com saída HDR. Se a imagem ficar lavada, isole (por eliminação) qual elo da cadeia está errado e proponha a correção.
