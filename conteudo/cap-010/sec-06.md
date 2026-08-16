A linha de comando do Gamescope tem mais de quarenta flags documentadas. Saber escolher as certas para cada cenário — performance, qualidade visual, debugging ou compatibilidade — é o que separa o ajuste fino do chute. Esta seção organiza as opções por categoria e mostra como combiná-las em cenários reais, do Steam Deck portátil ao deck dockeado numa TV 4K.

:::objetivos
- Dominar as flags essenciais do Gamescope por categoria funcional
- Combinar flags de resolução, upscaling, fullscreen e HDR em cenários reais
- Diferenciar flags de entrada (`-w`/`-h`) das de saída (`-W`/`-H`)
- Criar perfis de linha de comando para situações comuns
- Entender o separador `--` e como passar argumentos para a aplicação filha
:::

## Categorias de flags e o mindset de composição

As flags do Gamescope se agrupam naturalmente em cinco categorias. Entender as categorias ajuda a compor comandos sem precisar decorar cada flag:

| Categoria | Flags principais | O que controlam |
|---|---|---|
| Resolução | `-w`, `-h`, `-W`, `-H` | Framebuffer interno vs. saída externa |
| Upscaling | `--fsr`, `--nis` | Algoritmo de escala quando `-w` < `-W` |
| Saída | `-f`, `-n`, `-O`, `--fullscreen` | Onde e como renderizar (DRM, janela, conector) |
| Cor/HDR | `--hdr-enabled`, `--hdr-itm-enable` | Pipeline de cor e tone mapping |
| Sincronização | `--adaptive-sync`, `--immediate-flips` | VRR, vsync e latência |

A distinção mais importante e menos óbvia é entre as flags minúsculas (`-w`, `-h`, `-r`) e as maiúsculas (`-W`, `-H`, `-R`). As minúsculas controlam o mundo que a aplicação **enxerga**; as maiúsculas controlam o que o painel **recebe**.

```terminal
$ gamescope -w 960 -h 600 -W 1920 -H 1080 -r 30 -R 60 --fsr -- %command%
```

Neste exemplo extremo: o jogo renderiza a 960×600 a 30 FPS (resolução e refresh internos), o Gamescope aplica FSR para escalar até 1920×1080 e entrega a 60 Hz no monitor externo. O jogo acredita estar num monitor 960×600@30Hz, e o monitor externo recebe 1080p@60Hz estável. O `-r` e `-R` seguem a mesma lógica: taxa de atualização interna vs. externa.

:::dica
A flag `-r` (refresh interno) é particularmente útil para economizar bateria: se o jogo está estável a 30 FPS, limitar o refresh interno a 30 Hz evita que a GPU renderize frames que nunca serão exibidos. Combine com `-R 60` para manter o painel a 60 Hz (VRR cuida da diferença) ou com `-R 30` para economizar ainda mais.
:::

## O separador `--` e argumentos do jogo

Tudo que vem depois de `--` na linha de comando do Gamescope é tratado como o comando filho e seus argumentos. É essencial usar o separador corretamente, especialmente quando o jogo tem suas próprias flags:

```terminal
$ gamescope -w 1280 -h 800 -W 1920 -H 1080 --fsr -f -- vkcube --width 1280 --height 800
```

Sem o `--`, o Gamescope tentaria interpretar `--width` como uma flag dele e reclamaria. Com o separador, `vkcube` e seus argumentos são preservados intactos e passados para `execvp()`.

:::atencao
Se você esquecer o `--`, o Gamescope pode interpretar flags do jogo como sendo dele. Por exemplo, `gamescope -f -- vkcube -f` passa `-f` para o `vkcube`. Mas `gamescope -f vkcube -f` é ambíguo — o Gamescope pode consumir o segundo `-f`. Em caso de comportamento estranho, sempre verifique se o separador está presente.
:::

## Perfis práticos de linha de comando

Cada situação pede um conjunto diferente de flags. Aqui estão quatro perfis que cobrem os cenários mais comuns do Steam Deck:

**Perfil 1 — Portátil, máxima bateria (30 FPS com FSR agressivo)**

```terminal
$ gamescope -w 640 -h 400 -W 1280 -H 800 -r 30 --fsr --adaptive-sync -- %command%
```

**Perfil 2 — Portátil, qualidade (resolução nativa, VRR)**

```terminal
$ gamescope -w 1280 -h 800 -W 1280 -H 800 --adaptive-sync -- %command%
```

**Perfil 3 — Dock, TV 1080p (FSR moderado)**

```terminal
$ gamescope -w 960 -h 600 -W 1920 -H 1080 -R 60 --fsr -- %command%
```

**Perfil 4 — Dock, TV 4K HDR**

```terminal
$ gamescope -w 1280 -h 720 -W 3840 -H 2160 -R 60 --fsr --hdr-enabled -- %command%
```

Cada perfil conta uma história. O Perfil 1 diz: "a bateria é prioridade, o jogo entrega 30 FPS estáveis e a qualidade pode ser sacrificada". O Perfil 4 diz: "estou na sala, conectado na TV OLED, quero a melhor imagem possível com HDR, e a resolução de renderização pode ser 720p porque o FSR sobe para 4K".

## Flags menos conhecidas que salvam o dia

Além das flags de uso diário, o Gamescope tem opções que resolvem problemas pontuais que aparecem em fóruns e subreddits:

```terminal
$ gamescope --help 2>&1 | grep -E '^\s+--' | head -30
  --fsr                         use AMD FidelityFX Super Resolution 1.0
  --nis                         use NVIDIA Image Scaling
  --nearest                     use nearest neighbor filtering
  --fsr-sharpness               FSR sharpness (0..20, default: 0)
  --stretch                     stretch output to fill display
  --force-grab-cursor           always grab the cursor
  --force-windows-fullscreen    force windows inside to fullscreen
  --borderless                  borderless window mode
  --expose-wayland              expose wayland socket
  --stats-path                  path to write frame statistics
```

Algumas joias escondidas:

- `--fsr-sharpness 5` ajusta o nível de nitidez do FSR. O padrão é 0 (sem sharpening adicional), mas valores entre 2 e 5 podem recuperar detalhes em texturas que o upscaling suavizou. Acima de 10, artefatos de ringing aparecem.
- `--stretch` força o conteúdo a preencher a tela inteira, distorcendo a proporção se necessário. Útil para jogos antigos com aspect ratio fixo 4:3 que deixam barras pretas.
- `--force-windows-fullscreen` faz com que toda janela X11 dentro do Gamescope seja tratada como fullscreen, mesmo que a aplicação peça modo janela.
- `--stats-path /tmp/gamescope-stats` grava estatísticas de frame (tempo de GPU, tempo de composição, FPS) em arquivo, úteis para gerar gráficos de performance.

```terminal
$ gamescope -w 1280 -h 800 -W 1280 -H 800 --fsr --fsr-sharpness 4 --stats-path /tmp/fs.log -- glxgears
$ cat /tmp/fs.log | tail -5
frame: 29176, gpu_time: 0.31ms, comp_time: 0.02ms, fps: 59.9
frame: 29177, gpu_time: 0.28ms, comp_time: 0.02ms, fps: 60.0
frame: 29178, gpu_time: 0.33ms, comp_time: 0.01ms, fps: 60.0
```

Com `glxgears`, o tempo de GPU é irrisório (0,3 ms) e o tempo de composição também (0,02 ms). Com um jogo pesado, esses números vão para 10-30 ms e 0,5-2 ms respectivamente, e o arquivo de estatísticas permite traçar exatamente onde o tempo de frame está sendo gasto.

## Resumo

- As flags do Gamescope se organizam em cinco categorias: resolução, upscaling, saída, cor/HDR e sincronização.
- Flags minúsculas (`-w`, `-h`, `-r`) controlam o que a aplicação enxerga; maiúsculas (`-W`, `-H`, `-R`) controlam o que o painel recebe.
- O separador `--` isola as flags do Gamescope dos argumentos da aplicação filha; esquecê-lo causa erros sutis.
- Quatro perfis típicos cobrem os cenários: bateria, qualidade, dock 1080p e dock 4K HDR.
- Flags como `--fsr-sharpness`, `--stretch` e `--stats-path` resolvem problemas pontuais que as flags principais não cobrem.

## Exercícios

1. Execute `gamescope --help` e classifique cada flag em uma das cinco categorias (resolução, upscaling, saída, cor/HDR, sincronização). Crie a sua "cola" pessoal.
2. Monte o Perfil 1 (bateria) e execute `vkmark` com ele. Depois monte o Perfil 2 (qualidade) e compare os scores. Qual foi a diferença percentual?
3. Use `--stats-path` para capturar estatísticas de frame durante 60 segundos de `vkmark`. Calcule FPS médio, 1% low e tempo médio de GPU a partir do arquivo.
4. Experimente `--fsr-sharpness` com valores 0, 5, 10 e 20. Em que ponto os artefatos de ringing se tornam inaceitáveis para você?
5. **Desafio.** Escreva um script `gamescope-launcher.sh` que receba um perfil (battery, quality, dock1080, dock4k) como argumento e monte a linha de comando correspondente. Inclua detecção automática de conectores com `cat /sys/class/drm/card0-*/status`.