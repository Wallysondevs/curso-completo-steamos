Fullscreen é um território disputado no Linux. Para um jogo, fullscreen deveria significar "eu controlo a tela inteira, nada de compositor no meio do caminho". Para o compositor, significa "abri mão do controle e agora rezo para o jogo devolver os buffers corretamente". O Gamescope resolve esse conflito de forma radical: ele **é** o controle total, e o fullscreen é o estado natural, não uma exceção negociada.

:::objetivos
- Entender como o Gamescope gerencia modo fullscreen real via DRM direct scanout
- Diferenciar fullscreen real do fullscreen emulado por compositores de desktop
- Usar a flag `-f` para forçar fullscreen imediato
- Diagnosticar trocas de modo de vídeo e sincronização vertical
- Entender a relação entre Gamescope, VRR/Adaptive Sync e tearing
:::

## Fullscreen de verdade vs. fullscreen de mentira

Num desktop Linux com KWin ou Mutter, quando um jogo pede fullscreen, o compositor tipicamente faz uma concessão: desenha o buffer do jogo diretamente no plano de overlay da GPU (direct scanout), pulando a etapa de composição. Isso reduz a latência, mas vem com letras miúdas: se qualquer outra coisa quiser desenhar na tela — uma notificação, o overlay de volume, o Alt+Tab — o compositor precisa retomar o controle, desfazer o direct scanout e recompor tudo. Essa transição leva frames e pode causar gagueira (stutter) e tearing.

O Gamescope não negocia: ele nasce em fullscreen. Não há outras janelas para compor, não há notificações de desktop, não há Alt+Tab para um navegador. O Steam Overlay e as notificações do Steam são renderizados pelo próprio Gamescope como parte da cena, e não como elementos externos que interrompem o direct scanout.

```terminal
$ gamescope -f -w 1280 -h 800 -- vkcube
```

A flag `-f` força o Gamescope a iniciar em fullscreen imediato — sem bordas, sem decorações, tomando o plano inteiro. Quando executado no Modo Jogo, o `-f` é redundante porque o Gamescope já está em fullscreen. No modo nested, o `-f` faz o Gamescope abrir como janela fullscreen (equivalente a pressionar `[[F11]]` no navegador), não como fullscreen exclusivo de DRM.

## O caminho do pixel até o painel

Para entender por que o fullscreen do Gamescope é diferente, vale seguir o caminho de um pixel do jogo até o painel LCD:

1. O jogo renderiza um quadro no seu framebuffer Vulkan (resolução interna: `-w`×`-h`).
2. O Gamescope recebe esse buffer via swapchain e, se necessário, aplica FSR/NIS (upscaling).
3. O Gamescope compõe o Steam Overlay sobre o buffer do jogo.
4. Se a resolução externa (`-W`×`-H`) for compatível com um modo DRM atômico, o buffer final é colocado diretamente no plano primário do CRTC — isso é o **direct scanout**, zero cópias extras.
5. A GPU envia o scanout pelo conector eDP para o painel.

```terminal
$ gamescope -w 1280 -h 800 -W 1280 -H 800 -O ,eDP-1 -- vkcube
wlserver: [backend/drm/backend.c:202] DRM universal planes: primary, cursor, overlay_0, overlay_1
wlserver: [backend/drm/drm.c:86] connector eDP-1: 1280x800@60Hz
```

A linha `DRM universal planes` mostra que o Gamescope detectou os planos de hardware disponíveis: `primary` (onde o buffer do jogo vai), `cursor` (mouse via hardware, sem latência) e dois `overlay` (para vídeo ou elementos adicionais). O conector `eDP-1` está no modo 1280×800 a 60 Hz, exatamente a resolução externa configurada.

:::info
CRTC (Cathode Ray Tube Controller) é o nome herdado da era dos tubos de raios catódicos. Hoje, é o bloco de hardware da GPU que lê um framebuffer da memória e gera o sinal de vídeo para o conector. O Steam Deck tem um CRTC associado ao `eDP-1`.
:::

## Adaptive Sync e o problema do tearing

O Steam Deck suporta Adaptive Sync (VRR — Variable Refresh Rate) no painel interno. Com VRR ativo, o painel ajusta dinamicamente sua taxa de atualização para casar com o framerate do jogo, eliminando tearing sem o custo de latência do vsync tradicional. O Gamescope controla isso via flag `--adaptive-sync`:

```terminal
$ gamescope --adaptive-sync -w 1280 -h 800 -W 1280 -H 800 -O ,eDP-1 -- vkcube
wlserver: [backend/drm/drm.c:107] connector eDP-1: VRR enabled (range: 40-60 Hz)
```

A saída `VRR enabled (range: 40-60 Hz)` confirma que o painel aceita taxas variáveis entre 40 e 60 Hz. Se o jogo renderiza a 47 FPS, o painel opera a 47 Hz, e cada quadro chega inteiro — sem tearing, sem stutter de pulo de frame.

:::atencao
O Adaptive Sync no Gamescope é **opcional** e precisa ser habilitado explicitamente. No Steam Deck, a Valve o habilita por padrão no Modo Jogo. Se você estiver experimentando com Gamescope manualmente no Modo Desktop (sem `-n`), precisa passar `--adaptive-sync` ou o painel ficará fixo em 60 Hz. Em modo nested (`-n`), o VRR não está disponível porque o Gamescope não controla o DRM.
:::

## O que acontece quando o jogo troca de resolução

Muitos jogos, especialmente títulos mais antigos ou ports de console, trocam a resolução do monitor ao iniciar. Num desktop, isso faz o KWin renegociar o modo de vídeo — as janelas se rearrumam, o wallpaper pisca. No Gamescope, a troca de resolução do jogo é absorvida pelo compositor:

```terminal
$ gamescope -w 1280 -h 800 -W 1920 -H 1080 --fsr -f -- %command%
```

Aqui, o jogo acredita estar rodando a 1280×800 (resolução interna), mas o Gamescope está enviando 1920×1080 para o monitor externo (resolução externa) com FSR. Se o jogo, no meio da execução, pedir para trocar para 1920×1080, o Gamescope redimensiona o framebuffer interno, mas a saída externa permanece estável — nenhuma renegociação de modo de vídeo, nenhuma tela preta.

Isso é especialmente útil no Steam Deck quando conectado a uma TV 4K: você pode manter o jogo renderizando a 720p ou 800p internamente, escalar via FSR para 1080p ou 1440p, e o sinal HDMI permanece estável. A TV nunca perde o sinal durante a transição.

## Resumo

- O Gamescope implementa fullscreen real via DRM direct scanout, sem as concessões que compositores de desktop precisam fazer.
- O caminho do pixel: framebuffer do jogo → upscaling (FSR/NIS) → composição do overlay → direct scanout → painel.
- A flag `-f` força fullscreen imediato; no Modo Jogo, o Gamescope já opera em fullscreen por padrão.
- Adaptive Sync (`--adaptive-sync`) permite VRR no painel interno do Deck (40-60 Hz), eliminando tearing sem latência extra.
- Trocas de resolução do jogo são absorvidas pelo Gamescope; a saída para o monitor/TV permanece estável, sem renegociação de modo.

## Exercícios

1. No Modo Jogo, execute `gamescope -f -w 1280 -h 800 -- glxgears` e compare o comportamento com `gamescope -n -w 1280 -h 800 -- glxgears` no Modo Desktop. Qual é a diferença prática?
2. Leia os logs do Gamescope durante o boot: `journalctl -b | grep gamescope | head -20`. Identifique as linhas de detecção de DRM, conectores e VRR.
3. Com um monitor externo conectado via USB-C, execute `gamescope -w 1280 -h 800 -W 1920 -H 1080 -O ,DP-1 -- vkcube`. A saída aparece no monitor externo? Qual conector o Gamescope escolheu?
4. No Modo Jogo, desabilite o Adaptive Sync nas configurações do Steam Deck (Settings → Display → Enable Unified Frame Limit Management). Jogue um título com framerate variável por 5 minutos e observe tearing. Habilite novamente e compare.
5. **Desafio.** Conecte o Steam Deck a um monitor 4K. Execute um jogo com `-w 1280 -h 720 -W 3840 -H 2160 --fsr`. Usando `mangohud`, meça framerate e tempo de frame. Depois mude `-W 1920 -H 1080` e compare. O custo do upscaling para 4K é mensurável?