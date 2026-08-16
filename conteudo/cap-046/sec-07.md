Uma das emulações mais recompensadoras no Steam Deck é a do PlayStation 2, porque o PCSX2 amadureceu a ponto de rodar grande parte da biblioteca com upscale e framerate melhor que o console original. Mas "grande parte" não é "tudo", e alguns títulos exigem ajuste fino. Nesta seção você instala, configura e leva o PCSX2 a entregar o melhor que o Deck permite — e aprende o que é uma BIOS e por que ela é a peça que destrava tudo.

:::objetivos
- Entender a arquitetura do PS2 e por que a emulação dele depende da BIOS
- Instalar o PCSX2 no Deck via Flatpak e posicionar BIOS e jogos
- Configurar resolução interna, renderer e upscale para o hardware do Deck
- Diagnosticar queda de FPS e aplicar ajustes por jogo
- Criar o atalho não-Steam e validar no Game Mode
:::

## A máquina que o PCSX2 precisa reproduzir

O PlayStation 2 é um console de arquitetura notoriamente estranha, e entender isso explica metade das dificuldades de emulação. Ele tem uma CPU principal (a Emotion Engine) acompanhada de um processador de vetores (VU0/VU1), uma GPU (Graphics Synthesizer) e uma CPU extra do PS1 internamente para retrocompatibilidade. Vários desses componentes rodam em paralelo, com temporização apertada.

O PCSX2 precisa orquestrar tudo isso em software. A **BIOS** é o firmware do console — o software de inicialização que vive dentro dele — e sem ela o emulador não reproduz o comportamento de boot, os menus e a proteção de memória. É a peça legalmente protegida que nenhum emulador distribui.

:::nota
A BIOS do PS2 é considerada software proprietário, diferente de um jogo. Por isso o PCSX2 exige que você forneça o arquivo (tipicamente `SCPH-XXXXX.bin`) despejado do seu próprio console. Emuladores de PS2 são legais; a BIOS só é legal se obtida por dumping do hardware que você possui. Este capítulo assume esse caminho.
:::

## Instalação e posicionamento de arquivos

O PCSX2 no Deck é um Flatpak, e a instalação segue o padrão já visto. A diferença está na organização: o emulador procura a BIOS num diretório específico, e os jogos (ISOs) em outro.

```terminal
$ flatpak install -y flathub net.pcsx2.PCSX2
$ flatpak run net.pcsx2.PCSX2 --version
PCSX2 2.0.2
```

Na primeira execução, o PCSX2 pede a pasta da BIOS. Se você usa o EmuDeck, ela já está mapeada para `~/Emulation/bios/`; se instalou à mão, fica dentro da árvore do Flatpak. Verifique onde o emulador espera o arquivo:

```terminal
$ find ~/.var/app/net.pcsx2.PCSX2 -maxdepth 4 -type d -name bios 2>/dev/null
/home/deck/.var/app/net.pcsx2.PCSX2/config/PCSX2/bios
```

Coloque o arquivo de BIOS nesse diretório e reinicie o emulador. O PCSX2 exibe a BIOS detectada na tela de configuração; se a lista estiver vazia, o arquivo está no lugar errado ou com nome incorreto.

:::atencao
O erro mais comum de quem começa é colocar a BIOS junto com os ISOs. O PCSX2 **não** procura BIOS na pasta de jogos: ele procura no diretório de BIOS definido em **Settings → BIOS**. Manter as duas coisas separadas (BIOS em `bios/`, jogos em `roms/ps2/`) evita confusão e facilita backups seletivos.
:::

## Configurando para o hardware do Deck

Os dois ajustes que mais movem o ponteiro no Deck são o **renderer** e a **resolução interna**. O renderer define se a emulação da GPU é feita por software (preciso, mas pesado e limitado a resolução nativa) ou por hardware (rápido, permite upscale, mas pode introduzir glitches visuais em alguns jogos).

```terminal
$ flatpak run net.pcsx2.PCSX2 2>&1 | grep -i -E 'renderer|vulkan|adapter' | head -5
[PCSX2] Renderer: Vulkan (AMD AMD Custom GPU 0405)
```

A saída ideal mostra `Vulkan` e a GPU do Deck sendo usada. O Vulkan é o renderer recomendado no Deck por acesso de baixo nível ao driver AMD RDNA 2. A resolução interna, em **Settings → Graphics → Rendering**, é o multiplicador de upscale: 2x (algo como 1280x896) costuma ser o ponto de equilíbrio no Deck, e 3x já começa a custar.

:::dica
Comece com renderer Vulkan e resolução interna 2x, e só aumente se o FPS ficar cravado em 60. Para jogos que apresentam glitches visuais com upscale por hardware, o "software renderer" é a muleta: ele corrige a imagem ao custo de perder o upscale, usando CPU em vez de GPU. É uma troca que você decide por jogo.
:::

## Diagnóstico e ajuste por jogo

Nem todo jogo de PS2 roda a 60 FPS no Deck, e o sintoma varia: queda generalizada de FPS, travadas ao carregar, ou glitches gráficos. O primeiro passo é medir com o overlay do Steam, observando se quem satura é a CPU ou a GPU.

```terminal
$ flatpak run net.pcsx2.PCSX2 --nogui --fullscreen "~/Emulation/roms/ps2/jogo.iso" 2>&1 | grep -iE 'FPS|throttle|skip' | head -5
```

O PCSX2 tem "speed hacks" e presets de emulação (Safe, Balanced, Aggressive) que alteram a precisão em troca de velocidade. Comece no preset **Balanced** e só recorra ao Aggressive se um jogo específico estiver abaixo do alvo — ele pode introduzir artefatos em troca de FPS.

:::atencao
Ajuste de desempenho por jogo deve ser feito com **um jogo por vez**, porque o que ajuda um título pode piorar outro. O PCSX2 salva ajustes por jogo em arquivos de configuração separados, então você pode ter o "Aggressive" para um jogo pesado e o "Safe" para um leve, sem conflito. É esse isolamento que permite otimizar a biblioteca inteira sem degradar nada.
:::

## Resumo

- O PS2 tem arquitetura paralela e complexa (Emotion Engine, VU, GS), o que explica o custo de emulação.
- A BIOS é firmware proprietário; o PCSX2 exige que você a forneça por dumping, nunca a distribui.
- BIOS e ISOs ficam em diretórios separados: `bios/` e `roms/ps2/`, nunca juntos.
- O renderer Vulkan com a GPU do Deck e resolução interna 2x são o ponto de partida recomendado.
- Software renderer corrige glitches ao custo do upscale; é decisão por jogo.
- Presets (Safe/Balanced/Aggressive) trocam precisão por velocidade e podem ser isolados por título.

## Exercícios

1. Instale o PCSX2 via Flatpak e confirme a versão com `flatpak run net.pcsx2.PCSX2 --version`.
2. Localize com `find` o diretório de BIOS do PCSX2 e registre o caminho exato que o emulador espera.
3. Configure Vulkan + resolução interna 2x e rode um jogo, anotando FPS e uso de GPU pelo overlay de desempenho.
4. Reproduza um glitch visual trocando para software renderer e explique a troca de custo (GPU→CPU) que ocorreu.
5. **Desafio.** Selecione um jogo pesado, meça o FPS no preset Balanced e no Aggressive, e decida documentado: vale a pena o risco de artefato pelo ganho de FPS? Relacione com a régua de gerações da seção sobre desempenho.
