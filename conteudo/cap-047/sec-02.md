O instalador do EmuDeck oferece dois caminhos para a mesma árvore final de arquivos: um guiado, onde você responde poucas perguntas, e um manual, onde cada emulador é uma escolha sua. A diferença não está no resultado — está no nível de controle e na quantidade de software que acaba instalada. Escolher errado não estraga nada, mas saber o que cada modo decide por você torna a primeira instalação muito menos frustrante.

:::objetivos
- Entender a diferença entre Easy Mode e Custom Mode
- Executar o download e a instalação do EmuDeck de forma segura
- Decidir quando cada modo é a melhor escolha
- Conhecer os parâmetros que o Custom Mode expõe
- Conferir a instalação do ponto de vista do terminal
:::

## Baixando e preparando o instalador

O EmuDeck é distribuído como um descarregador gráfico para Linux, disponível em `emudeck.com`. O processo no SteamOS começa no **Desktop Mode**, porque o instalador é uma aplicação de desktop com janelas, não algo que rode dentro do Game Mode.

```terminal
$ cd ~/Downloads
$ chmod +x EmuDeck.desktop
$ ./EmuDeck.desktop
```

O arquivo `EmuDeck.desktop` é um pequeno *launcher* com instruções de download embutidas — a execução dele baixa o instalador real para `~/Applications` e o registra no menu de aplicativos do KDE. A partir daí, abrir o EmuDeck fica a um clique no menu Iniciar, como qualquer programa instalado.

:::atencao
Sempre baixe o instalador do site oficial (`emudeck.com`). Versões "espelhadas" em sites de terceiros já foram usadas para distribuir malware. Depois de rodar, confira que o aplicativo aparece como `net.retrodeck.emudeck` no `flatpak list` ou como binário em `~/Applications`, nunca como um script obscuro na raiz do home.
:::

## O fluxo do Easy Mode

O Easy Mode é o caminho recomendado para a primeira instalação. Ele faz uma série de escolhas sensatas sem perguntar: instala o RetroArch com uma coleção ampla de núcleos, ativa os emuladores standalone mais comuns (PPSSPP, PCSX2, Dolphin, entre outros), cria a árvore `~/Emulation` e já prepara o Steam ROM Manager com parsers padrão para as pastas de ROMs mais usadas.

O usuário só responde a duas ou três perguntas de verdade: **onde** instalar (SD card ou armazenamento interno) e **qual dispositivo** aquela máquina é (Steam Deck, ROG Ally etc.). O resto o instalador resolve sozinho, inclusive escrevendo os perfis de controle de que a próxima seção trata.

```terminal
$ ls ~/Applications
EmuDeck.AppImage
$ ls ~/Emulation/tools/launchers
EmuDeck.sh
```

O resultado é uma instalação "bom o bastante para 90% dos casos", nas palavras do próprio projeto. A desvantagem é o inverso da vantagem: você herda software que talvez não use, e alguns núcleos do RetroArch ficam instalados sem que você saiba o nome deles.

## O que o Custom Mode destrava

O Custom Mode mostra a lista completa de emuladores e suítes disponíveis, cada um com um *toggle* individual, além de opções de configuração avançada. É aqui que você decide, por exemplo, **não** instalar o emulador de DS se só vai jogar Mega Drive, ou habilitar o `mGBA` standalone no lugar do núcleo de GBA do RetroArch.

Além da seleção de emuladores, o Custom Mode expõe ajustes que ficam escondidos no modo guiado: esquema de *hotkeys* alternativo, caminho customizado para as ROMs, opção de ligar ou desligar o SRM e até perfis de desempenho (como resolução interna padrão de cada emulador 3D).

:::dica
Se você não sabe qual emulador usar para um console, instale primeiro o Easy Mode e depois reabra o instalador para **ajustar** — o EmuDeck é reentrante, o que significa que rodá-lo de novo não desfaz o que já existe; ele apenas adiciona ou remove peças. Começar simples e refinar depois é mais produtivo do que tentar acertar tudo de primeira no Custom Mode.
:::

## Decidindo qual modo usar

A regra prática é simples: **Easy Mode para a maioria, Custom Mode para quem já sabe o que quer**. A tabela resume os fatores.

| Situação | Modo recomendado |
|---|---|
| Primeira instalação, sem preferência de emulador | Easy Mode |
| Vai emular poucos consoles específicos | Custom Mode |
| Quer atenção ao controle fino de hotkeys e resolução | Custom Mode |
| MicroSD novo, espaço folgado, pressa para jogar | Easy Mode |
| Quer entender cada peça instalada | Custom Mode, com leitura da seção seguinte |

O que não muda em nenhum dos dois modos é a árvore `~/Emulation` e a separação lógica entre bios, roms e saves. O modo escolhido afeta *quantos* programas acabam instalados e *quais* perfis são escritos — não o desenho geral da instalação.

## Conferindo o que foi instalado

Depois de fechar o instalador, vale olhar o que aconteceu no sistema pelos olhos do terminal, que não tem a ilusão da interface. Os emuladores modernos chegam quase todos como Flatpak; alguns legados vêm como AppImage.

```terminal
$ flatpak list --app | grep -i -E "retro|duck|ppsspp|pcsx2|dolphin"
org.libretro.RetroArch         1.19.1  stable  flathub  system
org.ppsspp.PPSSPP              1.17.1  stable  flathub  system
net.pcsx2.PCSX2                2.0.2   stable  flathub  system
org.DolphinEmu.dolphin-emu    2407    stable  flathub  system
```

Essa lista confirma o que o instalador declarou ter feito. Cada linha é um Flatpak no repositório `flathub` instalado em modo `system`, o padrão no SteamOS. Se algum emulador esperado não aparecer, o problema está na rodada de instalação — motivo para religar a conexão de rede e rodar o instalador de novo, não para assumir que "instalou por baixo dos panos".

O mesmo vale para a árvore de diretórios, que deve existir mesmo antes de você colocar uma ROM sequer dentro dela:

```terminal
$ ls ~/Emulation
bios  roms  saves  storage  tools
$ ls ~/Emulation/roms
gb  gba  gbc  nes  snes  ...  ps2  psp
```

As pastas de ROMs já vêm criadas e nomeadas segundo uma convenção (geralmente a extensão de ROM ou o apelido do console em minúsculas). Colocar o arquivo `.gba` na pasta `gba` é o que faz o SRM, na seção 6, classificar o jogo corretamente.

## Resumo

- O EmuDeck é baixado como `.desktop` no Desktop Mode e se instala como AppImage em `~/Applications`.
- O Easy Mode instala uma coleção ampla e padrão com o mínimo de perguntas.
- O Custom Mode permite habilitar ou desabilitar cada emulador individualmente.
- O instalador é reentrante: rodar de novo ajusta a instalação sem desfazê-la.
- Flatpaks em `flathub` são o mecanismo de entrega da maioria dos emuladores modernos.
- As pastas de ROMs em `~/Emulation/roms` já vêm criadas e nomeadas por console.

## Exercícios

1. No Desktop Mode, abra o instalador e percorra o Easy Mode até a tela de confirmação **sem concluir**, apenas para observar quais escolhas ele declara que fará.
2. Liste os Flatpaks instalados com `flatpak list --app` antes e depois de uma instalação Easy Mode e compare as listas.
3. Usando o Custom Mode, localize o *toggle* de um emulador específico (ex.: mGBA) e descreva o que o rótulo ao lado dele informa.
4. Verifique o conteúdo de `~/Emulation/roms` e confirme se a pasta correspondente ao console que você pretende emular existe.
5. **Desafio.** Rode `flatpak info org.libretro.RetroArch` e interprete ao menos três campos da saída (branch, ref, tamanho instalado). Depois, compare com `flatpak info net.retrodeck.emudeck` e explique por que o EmuDeck em si é muito menor do que a soma dos emuladores.
