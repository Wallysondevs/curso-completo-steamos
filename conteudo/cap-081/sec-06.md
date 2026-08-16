Se o Proton resolve a compatibilidade de jogos de Windows, o **EmuDeck** resolve outra frente inteira: emular consoles antigos e portáteis no Steam Deck. Ele não é um emulador — é um instalador e organizador que baixa, configura e integra dezenas de emuladores ao Steam, transformando sua biblioteca em um hub de retrogames. Como quase todo o homebrew do Deck, ele vive na home e não exige jailbreak.

:::objetivos
- Entender o que o EmuDeck faz e o que ele não faz
- Instalar o EmuDeck e escolher seus componentes
- Organizar ROMs e BIOS na estrutura de diretórios correta
- Integrar jogos emulados à biblioteca do Steam pelo Steam ROM Manager
:::

## EmuDeck não é um emulador

A confusão mais comum é achar que o EmuDeck é o RetroArch ou algum emulador específico. Na verdade, ele é uma **camada de orquestração**: um instalador que baixa os emuladores (RetroArch, Dolphin, PCSX2, Ryujinx/Yuzu, DuckStation, etc.), configura controles, hotkeys e pastas, e os registra no Steam de forma coesa. Por baixo, cada emulador continua sendo o projeto original — o EmuDeck apenas os dispõe de forma consistente.

Isso significa que o EmuDeck assume duas responsabilidades críticas que, feitas à mão, custariam horas:

- **Configuração de controle.** Mapear os botões do Deck para cada sistema, com hotkeys padrão (ex.: `[[Steam]]` + `[[R1]]` para menu, `[[Steam]]` + `[[Select]]` para load state).
- **Organização de pastas.** Criar uma estrutura clara onde cada sistema tem seu diretório de ROMs e onde as BIOS são colocadas uma única vez.

Sem o EmuDeck, você conseguiria instalar o RetroArch via Flatpak, mas todo o trabalho de integração ao Steam e de padronização ficaria por sua conta.

## Instalando o EmuDeck

O instalador é um script Python que você baixa para o modo Desktop:

```terminal
$ cd ~/Downloads
$ curl -L https://github.com/dragoonDorise/EmuDeck/releases/latest/download/emudeck.desktop -o emudeck.desktop
$ chmod +x emudeck.desktop
$ ./emudeck.desktop
```

Ao rodar, ele abre um instalador gráfico que pergunta três coisas principais:

1. **Para onde instalar** — normalmente um cartão microSD (`/run/media/deck/...`) para não consumir o armazenamento interno.
2. **Quais emuladores** — RetroArch, Dolphin, PCSX2, e a lista continua.
3. **Se quer o Steam ROM Manager** — a ferramenta que adiciona os jogos ao Steam.

O EmuDeck é pesado e demora: dependendo dos emuladores escolhidos, ele baixa gigabytes de dados. É um processo que você faz uma vez e revisita nas atualizações.

## A estrutura de diretórios

O coração do EmuDeck é a pasta que ele cria, seja no SD card ou no SSD interno. Dentro dela vive tudo:

```terminal
$ ls /run/media/deck/emudeck/
Emulation/
  bios/
  roms/
    nes/
    snes/
    gba/
    ps2/
    gc/
ES-DE/
```

Dois diretórios importam mais:

- **`bios/`** — as BIOS de consoles que exigem firmware próprio (PlayStation, PlayStation 2, Saturn, etc.). Sem a BIOS correta, o emulador não inicia o jogo.
- **`roms/<sistema>/`** — um subdiretório por console, onde você despeja os arquivos de ROM correspondentes. O nome da pasta é padronizado (`gc` para GameCube, `ps2` para PlayStation 2), e o Steam ROM Manager usa exatamente esses nomes para identificar cada jogo.

:::nota
O EmuDeck não fornece ROMs nem BIOS — distribuir esses arquivos é ilegal na maioria dos países, e o projeto se mantém dentro da legalidade deixando isso para o usuário. Você deve extrair as BIOS dos seus próprios consoles e usar apenas ROMs de jogos que possui. O instalador configura tudo, mas a obtenção legal do conteúdo é responsabilidade sua.
:::

## Integrando à biblioteca do Steam

Depois de colocar as ROMs nas pastas, o passo final é o **Steam ROM Manager** (SRM). Ele varre a estrutura do EmuDeck, gera atalhos do Steam para cada jogo (com artwork, se você mandar), e os adiciona como entradas não-Steam:

```terminal
$ find /run/media/deck/emudeck/Emulation/roms/ -type f | head -10
/run/media/deck/emudeck/Emulation/roms/nes/Super Mario Bros.nes
/run/media/deck/emudeck/Emulation/roms/nes/The Legend of Zelda.nes
/run/media/deck/emudeck/Emulation/roms/gba/Metroid Fusion.gba
```

O SRM lê cada arquivo, cruza com um banco de metadados para puxar capa, título e arte, e gera um *steam shortcut* para cada. O resultado é que seus jogos de NES, GBA e PS2 aparecem lado a lado com os jogos nativos na biblioteca do modo jogo.

:::dica
Além do SRM, o EmuDeck também instala o **EmulationStation-DE** (ES-DE), um front-end unificado que reúne todos os emuladores numa única interface bonita — similar a uma loja de retrogames. Se você prefere não poluir a biblioteca do Steam com centenas de atalhos, use somente o ES-DE e abra-o como um único jogo "não-Steam". É a escolha mais organizada para coleções grandes.
:::

## Onde isso mora e por que sobrevive

Assim como o Proton personalizado e o Decky, o EmuDeck se instala fora de `/usr`:

```terminal
$ du -sh ~/Applications 2>/dev/null
4.1G	/home/deck/Applications
```

Os binários e apps ficam em `~/Applications`, as configurações e ROMs no SD card ou no SSD. Nada disso depende do modo leitura. Uma atualização do sistema não apaga nem seus emuladores nem suas ROMs — no máximo o Steam ROM Manager (que é um Flatpak) pode precisar de atualização para a versão nova do cliente Steam.

Há uma exceção importante: o EmuDeck **pode** oferecer instalar componentes de sistema adicionais (como drivers de firmware para certos controles) que exigem o modo leitura desabilitado. Esses são opcionais e marcados como avançados. Se você recusar, o núcleo do EmuDeck continua funcionando sem jailbreak.

## Resumo

- O EmuDeck é um orquestrador que instala e configura dezenas de emuladores, não um emulador em si.
- A instalação é um script (`emudeck.desktop`) que baixa emuladores, controles e pastas; ROMs e BIOS ficam por conta do usuário.
- A estrutura divide-se em `bios/` (firmwares de console) e `roms/<sistema>/` (um diretório por console).
- O Steam ROM Manager gera atalhos do Steam com artwork para cada ROM; o EmulationStation-DE é a alternativa unificada.
- Tudo instala em `~/Applications` e no SD card/SSD, imune a atualizações do sistema.
- Componentes de sistema opcionais podem exigir jailbreak, mas o núcleo do EmuDeck não.

## Exercícios

1. Instale o EmuDeck apontando para um SD card e escolha pelo menos três emuladores (ex.: RetroArch, Dolphin, PCSX2). Confirme a criação de `Emulation/bios/` e `Emulation/roms/`.
2. Liste a estrutura de diretórios do EmuDeck e identifique os nomes de pasta padronizados para três consoles diferentes (`ls /run/media/deck/emudeck/Emulation/roms/`).
3. Coloque uma ROM (de um jogo que você possui) na pasta correta e rode o Steam ROM Manager para gerar o atalho. O jogo apareceu na biblioteca do Steam com capa?
4. Compare abrir o jogo pelo atalho do SRM versus abrir o EmulationStation-DE. Qual fluxo você prefere para uma coleção de 200 jogos e por quê?
5. **Desafio.** Investigue qual emulador exige BIOS e onde ela deve ser colocada para o PlayStation 2 (`ps2/`). Explique a diferença entre um emulador que usa HLE (high-level emulation, sem BIOS) e um que exige a BIOS original — e por que o EmuDeck não pode fornecer essa BIOS para você.