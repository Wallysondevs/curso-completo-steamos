Emulação é a arte de fingir, em software, que você tem um computador que não existe mais na sua mesa. Um emulador é um programa que lê as imagens de ROM de um videogame antigo e reproduz, instrução por instrução, o comportamento do hardware original — CPU, chip de som, processador gráfico, memória. No Steam Deck isso deixa de ser curiosidade de retrogamer e vira um dos argumentos mais fortes da plataforma, porque a máquina reúne em um único aparelho portátil a potência de um PC e a ergonomia que essas plataformas nunca tiveram.

:::objetivos
- Entender o que é emulação e por que o Steam Deck é um terreno fértil para ela
- Distinguir emulação de outras formas de rodar software de outras plataformas
- Reconhecer a diferença entre núcleos de emulação e os front-ends que os organizam
- Identificar os componentes de hardware do Deck que favorecem a emulação
- Mapear o que a Valve permite (e o que ela não impede) em relação a emuladores
:::

## Emular não é portar, nem virtualizar

Antes de falar do Deck, vale separar três conceitos que se confundem o tempo todo. **Emulação** reproduz o hardware inteiro de outro sistema por software: o emulador interpreta as instruções de máquina que foram escritas para, digamos, o processador MOS 6502 do NES e traduz cada uma para o x86_64 do Deck em tempo real. **Portar** é recompilar o código-fonte de um jogo para rodar nativamente na arquitetura de destino; não existe emulação, o jogo vira um programa comum do Linux. **Virtualização** roda um sistema operacional completo dentro de outro, mas o processador continua sendo aquele que o programa espera — não há tradução de conjunto de instruções.

A diferença prática importa porque cada uma tem um custo de desempenho distinto. Um emulador paga um preço alto em CPU, porque interpretar instruções alheias é caro. Um port usa o processador diretamente e, em geral, roda perto da velocidade nativa. A virtualização fica no meio: quase nativa para a CPU, mas com a sobrecarga de um sistema convidado inteiro.

:::nota
O termo "emulador" às vezes é usado como sinônimo errado de "front-end". O emulador é o motor que executa o jogo; o front-end (RetroArch, EmulationStation, EmuDeck) é a vitrine que organiza bibliotecas, baixa arte de capa e chama o emulador certo para cada jogo. Você pode ter vários emuladores debaixo de um único front-end.
:::

## Por que o Deck é uma plataforma natural para isso

O Steam Deck nasce como um PC Linux x86_64 em formato portátil com controles integrados. Essa combinação resolve três problemas clássicos de quem emula. Primeiro, a **arquitetura x86_64**: a esmagadora maioria dos emuladores maduros é escrita e otimizada para essa arquitetura, então nada precisa ser "portado para ARM" como aconteceria num Raspberry Pi ou num celular. Segundo, o **controle embutido**: os analógicos, o D-pad, os botões de face e os quatro botões traseiros (L4, L5, R4, R5) cobrem quase todas as plataformas antigas sem acessório extra. Terceiro, o **ecossistema Linux**: emuladores open source como RetroArch, Dolphin, PCSX2 e RPCS3 são cidadãos de primeira classe no Linux, distribuídos em pacotes Flatpak prontos.

A potência também sobra para as gerações baixas e médias. A APU AMD presente no Deck (CPU Zen 2 de quatro núcleos e GPU RDNA 2) roda plataformas até a quinta e sexta geração — SNES, Mega Drive, PlayStation 1, Nintendo 64 — com folga brutal, mantendo frames altos e bateria tranquila. É só quando se sobe para Wii U, PlayStation 3 e Switch que a APU começa a trabalhar de verdade, como as seções seguintes vão detalhar.

:::info
As três plataformas mais pesadas de emular têm ciclos de vida diferentes mesmo no Deck. O RPCS3 (PlayStation 3) depende fortemente de CPU e de compilação de shaders; o Cemu (Wii U) já é mais equilibrado entre CPU e GPU; o Dolphin (GameCube/Wii) é o mais maduro dos três e roda grande parte da biblioteca a 60 FPS sem esforço.
:::

## O que a Valve permite — e o que ela não faz

É comum ouvir que a Valve "apoia" emulação no Deck. O que de fato acontece é mais sutil e vale entender. A Valve **não bloqueia** emuladores: como o Deck roda SteamOS que, no modo desktop, é um Linux Arch com acesso total, você pode instalar qualquer Flatpak que quiser, incluindo RetroArch e companhia. Isso é uma consequência do caráter aberto da plataforma, e não um compromisso oficial da Valve com a emulação.

O que a Valve faz ativamente é **não distribuir conteúdo protegido**. Os emuladores são legais e estão em lojas como o Discover (a loja de Flatpaks do KDE); o que é ilegal é distribuir as ROMs (as imagens dos jogos) e as BIOS de consoles, que continuam sob copyright. Por isso nenhum emulador do Discover vem com jogo algum — você providencia suas próprias cópias.

```terminal
$ flatpak remote-ls flathub | grep -i -E 'retroarch|dolphin|pcsx2|rpcs3'
Dolphin Emulator                             org.DolphinEmu.dolphin-emu
PCSX2                                        net.pcsx2.PCSX2
RPCS3                                        net.rpcs3.RPCS3
RetroArch                                    org.libretro.RetroArch
```

O retrato do "nada vem junto" aparece na primeira execução de um emulador recém-instalado: ele abre, mas não tem sequer uma lista de jogos, porque o conteúdo é responsabilidade sua.

```terminal
$ flatpak run org.libretro.RetroArch
[INFO] RetroArch 1.19.1
[INFO] [Content]: No content loaded.
[INFO] [Playlist]: No playlists found.
```

A ausência de playlists e de conteúdo é o estado esperado de um emulador limpo — não é erro. A distinção entre o programa (livre e distribuído) e o conteúdo (protegido e não distribuído) é exatamente o que essas três linhas mostram.

:::atencao
Um cuidado de contorno: no **Game Mode** (a interface principal estilo console do Deck), os emuladores aparecem como "jogos não-Steam" e funcionam normalmente. Mas a Valve ajusta o Proton, a camada de compatibilidade com Windows, para jogos vendidos na Steam — não para emuladores. Emuladores Linux rodam nativos e não dependem de Proton; só use Proton para emuladores que existam apenas em versão Windows, e aí os resultados variam.
:::

## O vocabulário que você vai ouvir em toda seção

Três termos aparecem em todas as seções deste capítulo e merecem definição antes de avançar. **ROM** é o despejo (dump) binário do conteúdo de um cartucho, disco ou fita — no jargão, "a ROM" virou sinônimo do jogo em si, mesmo para plataformas de CD. **BIOS** (ou firmware) é o software interno do console original que alguns emuladores exigem para reproduzir fielmente menus e comportamento. **Core** é a palavra que o RetroArch usa para o motor de emulação; cada console tem seu core, e trocar de core é trocar de emulador sem trocar de front-end.

A forma como você obtém ROMs e BIOS é o único lado juridicamente cinza do assunto, e este capítulo assume que você joga apenas cópias de jogos que possui legitimamente (dumping do seu próprio cartucho, por exemplo). As seções técnicas a seguir não dependem de onde a ROM veio.

```terminal
$ ls -1 ~/Emulation/roms/
gb/
gba/
genesis/
nes/
psx/
snes/
```

A estrutura acima — uma pasta por plataforma — é o formato que o EmuDeck e a maioria dos front-ends esperam encontrar. Nomes de pasta padronizados e minúsculos evitam metade dos problemas de detecção automática que aparecem quando se organiza a biblioteca à mão.

## Resumo

- Emulação reproduz o hardware alheio por software; é diferente de portar (recompilar) e de virtualizar (rodar outro SO).
- O Deck favorece a emulação por ser x86_64, ter controles integrados e rodar Linux, onde os emuladores são nativos.
- A APU Zen 2 + RDNA 2 sobra para gerações até PS1/N64 e só trabalha duro em Wii U, PS3 e Switch.
- A Valve não bloqueia emuladores nem distribui ROMs; emuladores são legais, ROMs e BIOS protegidas não vêm junto.
- ROM, BIOS e core são os três termos centrais do vocabulário de emulação usado nas próximas seções.
- Emuladores Linux rodam nativos no Game Mode; Proton é para jogos de Windows, não para emuladores nativos.

## Exercícios

1. Liste, com `flatpak remote-ls flathub`, três emuladores disponíveis no Flathub e anote, para cada um, qual plataforma ele emula.
2. Explique, em duas frases, a diferença entre emulador e front-end, citando um exemplo concreto de cada um.
3. Abra o Modo Desktop e localize a loja Discover; encontre o RetroArch e verifique se ele aparece como Flatpak e em qual remoto (`flathub`).
4. Pesquise no seu Deck o atalho de alternar entre Game Mode e Modo Desktop e escreva os passos para instalar um Flatpak no Modo Desktop.
5. **Desafio.** Sem instalar nada, liste os diretórios em `~/Emulation/roms/` (ou crie-os) e proponha uma estrutura de pastas que o EmuDeck reconheceria, explicando por que o nome exato de cada pasta importa para a detecção automática.
