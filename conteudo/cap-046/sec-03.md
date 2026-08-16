Uma biblioteca de emulação sem organização vira uma pasta de arquivos soltos que ninguém encontra. O EmuDeck resolve isso automatizando a parte chata — criar pastas, baixar emuladores, configurar o Steam Rom Manager — e deixando você com uma experiência próxima de console. Nesta seção você roda o instalador, entende o que ele muda no sistema e configura a detecção de jogos para transformar ROMs em "jogos" do Steam.

:::objetivos
- Entender o que o EmuDeck automatiza e por que ele é o padrão de fato no Deck
- Instalar o EmuDeck a partir do Modo Desktop
- Navegar pela estrutura de pastas que o instalador cria
- Configurar o Steam Rom Manager e adicionar jogos ao Steam
- Compreender o custo de manter essa automação e onde ela escreve no sistema
:::

## O EmuDeck como automação, não como emulador

O EmuDeck não é um emulador. É um **orquestrador**: um conjunto de scripts que baixa, instala e configura uma pilha inteira de emuladores e front-ends, além de configurar o Steam Rom Manager para publicar seus jogos como atalhos da Steam. Quem vem de instalar tudo à mão sente a diferença de imediato — o que tomava uma tarde se resolve em minutos.

Ele baixa RetroArch com uma seleção de cores, os emuladores standalone (Dolphin, PCSX2, RPCS3, Cemu, entre outros) e um front-end opcional, além de criar a árvore `Emulation/` com subpastas de BIOS, saves e ROMs já na estrutura certa. Por baixo, tudo continua sendo Flatpak; o EmuDeck apenas automatiza o que você faria manualmente.

:::nota
O EmuDeck escreve a maior parte da configuração em dois lugares: dentro de `~/Emulation/` (sua árvore de arquivos) e dentro de `~/.var/app/...` (os diretórios dos próprios Flatpaks). Conhecer esses caminhos ajuda a resolver problema depois, porque o instalador não esconde nada — ele apenas organiza.
:::

## Instalando a partir do Modo Desktop

A instalação requer o Modo Desktop e um navegador. O fluxo oficial é baixar o instalador do site do projeto e executá-lo; ele detecta o Steam Deck, pergunta o formato de armazenamento (SD, interno ou SSD externo) e avança sozinho.

```terminal
$ cd ~/Downloads
$ curl -L https://github.com/EmuDeck/emu-deck/raw/main/install.sh -o install.sh
$ chmod +x install.sh
$ ./install.sh
```

O instalador abre uma janela gráfica (é um app baseado em web/Electron, não um script puro de terminal). Ele pergunta em qual dispositivo colocar a pasta `Emulation/` e se você quer instalar o EmulationStation-DE como front-end adicional. As escolhas padrão são as recomendadas para a maioria.

:::atencao
O instalador do EmuDeck baixa executáveis e scripts de várias fontes e escreve fora do sandbox usual do Flatpak. Isso é aceitável e é o que a comunidade usa, mas significa que você deve baixar o instalador **somente do site oficial** (ou do repositório oficial no GitHub), nunca de links aleatórios. Verificar a origem é um cuidado de segurança básico que se aplica a qualquer instalador externo.
:::

## A árvore que o EmuDeck cria

Depois da instalação, a pasta `~/Emulation/` tem uma estrutura previsível. É aqui que você coloca ROMs, BIOS e é aqui que o Steam Rom Manager vai procurar os jogos.

```terminal
$ ls -1 ~/Emulation/
bios/
roms/
saves/
tools/
EmulationStation-DE/
```

Dentro de `roms/`, cada subpasta corresponde a uma plataforma, e o nome precisa seguir a convenção exata que o EmuDeck e o Steam Rom Manager esperam:

```terminal
$ ls -1 ~/Emulation/roms/
gba/
gbc/
genesis/
n64/
nds/
nes/
psx/
snes/
switch/
wiiu/
```

:::dica
O EmuDeck tem um recurso chamado "BIOS checker" (verificador de BIOS) dentro da interface, que escaneia `~/Emulation/bios/` e informa exatamente quais arquivos de firmware estão faltando para cada sistema. É a forma mais prática de saber o que falta antes de tentar rodar um jogo e se frustrar com tela preta.
:::

## Publicando jogos com o Steam Rom Manager

O que transforma uma ROM em "jogo" da Steam é o Steam Rom Manager (SRM). Ele escaneia as pastas de ROMs, identifica cada jogo por um banco de nomes e cria atalhos não-Steam com arte de capa, emulador e argumentos corretos. Ao terminar, os jogos aparecem na biblioteca Steam como se fossem nativos.

```terminal
$ flatpak list | grep -i -E 'emudeck|steam-rom|srm'
Steam ROM Manager	net.steamgrid.SRM	system	flathub
```

O SRM funciona com "parsers" — um por plataforma — que definem o emulador a ser chamado e o template de argumentos. Por exemplo, o parser de SNES aponta para o RetroArch com o core `snes9x`, enquanto o de GameCube aponta para o Dolphin. O botão **Preview → Generate app list → Save to Steam** monta os atalhos; reiniciar a Steam (ou alternar para o Game Mode) os faz aparecer.

:::atencao
O SRM só enxerga jogos que estejam nas **subpastas com o nome exato** esperado pelo parser. Uma ROM de SNES em `roms/supernintendo/` (com nome errado) será ignorada silenciosamente. Quando um jogo "não aparece", o primeiro lugar a olhar é o nome da pasta, não o emulador.
:::

## Resumo

- O EmuDeck não é emulador; é um orquestrador que automatiza instalação e configuração de emuladores e front-ends.
- Ele baixa RetroArch + standalone (Dolphin, PCSX2, RPCS3, Cemu) como Flatpaks e cria a árvore `~/Emulation/`.
- A instalação é via `curl` do instalador oficial e uma interface gráfica que pergunta o local de armazenamento.
- A pasta `~/Emulation/roms/` tem uma subpasta por plataforma com nomes convencionados que você deve respeitar.
- O verificador de BIOS escaneia `~/Emulation/bios/` e informa o que está faltando.
- O Steam Rom Manager usa parsers por plataforma para gerar atalhos não-Steam com arte e emulador corretos.

## Exercícios

1. Instale o EmuDeck a partir do Modo Desktop e confirme que a pasta `~/Emulation/` foi criada com `ls ~/Emulation/`.
2. Liste as subpastas de `~/Emulation/roms/` e compare com a lista de parsers do Steam Rom Manager, anotando qualquer diferença.
3. Rode o verificador de BIOS do EmuDeck e liste os arquivos que ele aponta como ausentes.
4. Coloque uma ROM de teste na subpasta correta, rode o SRM (Preview → Generate → Save) e confirme a aparição do jogo na Steam.
5. **Desafio.** Quebre de propósito: mova aquela mesma ROM para uma subpasta com nome errado e mostre, com o SRM aberto, que o jogo desaparece — depois explique qual etapa da detecção depende do nome exato da pasta.
