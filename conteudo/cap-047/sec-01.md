O Steam Deck roda SteamOS, um Linux imutável feito para a biblioteca Steam — mas boa parte do apelo da máquina está no fato de ela ser, no fundo, um PC aberto. É aí que entra o EmuDeck: um instalador que baixa, configura e organiza dezenas de emuladores num único fluxo, poupando horas de trabalho manual que, num Linux de mesa comum, você faria um a um.

:::objetivos
- Entender o que o EmuDeck faz e o que ele não faz
- Identificar os componentes (retroarch, standalone, Steam ROM Manager) que ele orquestra
- Reconhecer por que ele funciona tão bem no SteamOS especificamente
- Avaliar se o EmuDeck é a ferramenta certa para o seu caso de uso
- Planejar a instalação sabendo onde os arquivos vão parar
:::

## O problema que o EmuDeck resolve

Emular um videogame antigo exige três coisas que quase nunca vêm juntas: um **núcleo de emulação** (o programa que interpreta o hardware do console), um **conjunto de arquivos BIOS** (firmwares proprietários que os emuladores quase nunca distribuem por questões legais) e uma **configuração de controle** que traduza os botões do Deck para o layout de um SNES, um PlayStation ou um Nintendo DS.

Num PC Linux, montar isso para um único console já é trabalho: descobrir qual núcleo do RetroArch usar, baixar as BIOS, mapear o gamepad, apontar as pastas. Multiplique por vinte consoles e você tem um fim de semana inteiro perdido. O EmuDeck existe para reduzir isso a uma instalação, feita majoritariamente por uma interface gráfica.

```terminal
$ flatpak list | grep -i -E "retroarch|emulator|duck"
EmuDeck        net.retrodeck.emudeck       1.1.0   stable  system
```

O EmuDeck em si não é um emulador — é um **gerenciador de configuração**. Ele age como um orquestrador: baixa os emuladores via Flatpak e AppImage, cria a árvore de diretórios em `~/Emulation`, coloca cada arquivo no lugar certo e escreve os perfis de controle. Depois de instalado, ele quase não é mais necessário no dia a dia; quem faz o trabalho de rodar os jogos são os emuladores que ele deixou prontos.

## Os três pilares do conjunto

Para entender o EmuDeck, vale separar o que ele instala em três camadas.

**RetroArch**, a suíte multi-núcleo. É um único executável que carrega "núcleos" (cores) diferentes para cada console: um núcleo para NES, outro para Mega Drive, outro para Game Boy Advance. O EmuDeck instala o RetroArch via Flatpak e já baixa a maior parte dos núcleos populares, além de ativar o *hotkey menu* que abre o menu de controle durante o jogo.

**Emuladores standalone.** Alguns consoles têm emuladores dedicados melhores que os núcleos do RetroArch — o `PPSSPP` para PSP, o `PCSX2` para PlayStation 2, o `Dolphin` para GameCube e Wii. O EmuDeck instala cada um separadamente e escreve neles as mesmas convenções de teclado, pasta e resolução.

**Steam ROM Manager (SRM).** O programa que "enxerga" suas ROMs e as publica como atalhos na biblioteca do Steam, com arte de capa. Sem ele, você abriria o EmuDeck a cada sessão; com ele, `Super Mario World` aparece na biblioteca do Steam como se fosse um jogo nativo.

```terminal
$ ls ~/Emulation
bios  roms  saves  storage  tools
```

A árvore `~/Emulation` é o contrato que o EmuDeck estabelece no seu home: `bios` recebe os firmwares, `roms` tem uma subpasta por console, `saves` guarda os save states e `storage` acumula arte, cache e dados de cada emulador. Entender essa árvore agora evita erro depois, quando você tiver que apontar uma ROM para a pasta certa.

## Por que funciona tão bem no SteamOS

O SteamOS é um sistema de arquivos **imutável**: a raiz `/` é somente-leitura, e tudo que o usuário instala vive em `~/.local`, `~/Applications` ou nos Flatpaks em `/var/lib/flatpak`. O EmuDeck respeita exatamente esse modelo — nada que ele faz toca a parte protegida do sistema, o que significa que uma atualização do SteamOS não desfaz a instalação.

Isso contrasta com distribuições de PC, onde o EmuDeck também roda, mas com resultados menos previsíveis. No Deck, a Valve garante um stack gráfico, um controlador e um modo de jogo estáveis; o EmuDeck aposta em cima dessa estabilidade. O resultado prático é que a mesma instalação funciona tanto em **Game Mode** (a interface padrão do Steam) quanto em **Desktop Mode** (o KDE Plasma embutido).

:::info
O EmuDeck suporta outros aparelhos além do Deck — ROG Ally, Legion Go e até distribuições Linux de desktop —, mas o foco principal do projeto e a experiência mais testada continuam sendo o Steam Deck. As instruções deste capítulo assumem SteamOS 3.6 (Noble Numbat).
:::

## O que o EmuDeck NÃO faz

É importante ajustar expectativas, porque muita gente chega esperando um "netflix de ROMs". O EmuDeck **não fornece jogos, nem BIOS, nem chaves de criptografia**. Por questões legais, ele instala só os emuladores — o software de código aberto — e deixa de fora tudo que é conteúdo protegido: os jogos (ROMs) e os firmwares (BIOS) você precisa obter por conta própria, de mídia que você possua.

Ele também não é um *launcher* universal que substitui o Steam. O atalho de cada jogo é gerado pelo SRM e aparece como entrada de biblioteca do Steam — o EmuDeck só reaparece quando você volta ao Desktop Mode para ajustar alguma coisa.

:::atencao
Baixar ROMs de jogos que você não possui viola leis de direitos autorais na maioria dos países. O curso se limita a configurar o software; a origem legal dos arquivos (dump de cartucho próprio, homebrew, jogos em domínio público) é responsabilidade sua. Existe um ecossistema inteiro de *homebrew* e jogos licenciados gratuitamente que não envolve pirataria.
:::

## Planejando antes de instalar

Antes de abrir o instalador, duas decisões moldam tudo: **onde os arquivos vão viver** e **qual modo de instalação usar**. A primeira diz respeito a espaço — ROMs de PS2 e GameCube passam fácil de 1 GB cada, e um microSD de 512 GB pode ser a diferença entre uma biblioteca confortável e a tela de "sem espaço". A segunda é sobre controle: o instalador oferece um caminho guiado (Easy Mode) e um caminho manual (Custom Mode), que a próxima seção detalha.

O melhor conselho para quem está começando é: use um microSD dedicado para os jogos e mantenha o SSD interno para o sistema e para os emuladores. Isso mantém as ROMs portáveis e evita disputa de espaço com a biblioteca nativa do Steam. O detalhe dos sistemas de arquivos — e a pegadinha do formato do SD card — é assunto da seção seguinte.

## Resumo

- O EmuDeck é um orquestrador de configuração, não um emulador em si.
- Ele instala RetroArch, emuladores standalone e o Steam ROM Manager como três camadas que se completam.
- A árvore `~/Emulation` organiza bios, roms, saves, storage e tools num contrato de pastas previsível.
- Ele funciona bem no SteamOS porque respeita a imutabilidade do sistema e não toca em `/`.
- EmuDeck não fornece ROMs nem BIOS; esses arquivos vêm de mídia que você possui.
- A decisão de armazenamento (SD vs SSD) deve ser tomada antes da instalação.

## Exercícios

1. Liste o que já existe no seu home com `ls -la ~` e identifique se alguma pasta relacionada a emulação (como `~/Emulation`) já foi criada por uma instalação anterior.
2. Pesquise no site oficial do EmuDeck quais consoles são suportados e anote três que você pretende emular, junto do tamanho médio das ROMs de cada um.
3. Usando `flatpak list`, verifique quais aplicativos Flatpak já estão instalados no seu Deck e se o RetroArch (`org.libretro.RetroArch`) já figura entre eles.
4. Estime o espaço que sua biblioteca de ROMs consumirá e compare com o espaço livre do SSD interno (`df -h /home`) e do microSD, se houver.
5. **Desafio.** Sem instalar nada ainda, desenhe no papel a árvore de pastas que o EmuDeck criará em `~/Emulation` e, para cada uma das cinco subpastas (bios, roms, saves, storage, tools), escreva uma frase explicando o que ela guarda e por que separá-las evita dor de cabeça num backup.
