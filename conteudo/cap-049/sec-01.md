O RetroArch resolve nove em cada dez casos da retrogaming com um único frontend, mas existe uma fronteira em que ele deixa de ser a melhor escolha: os consoles de sexta geração em diante. PlayStation 2, GameCube, Wii, PS3, Wii U e os Xbox — nessa faixa, cada emulador é um projeto maduro, com décadas de otimização específica, e embora vários tenham um *core* libretro, a versão dedicada quase sempre roda melhor, expõe mais opções e recebe correções antes. Este capítulo percorre esses emuladores **standalone** e a configuração que faz cada um render o máximo num Steam Deck.

:::objetivos
- Entender quando trocar o RetroArch por um emulador standalone
- Mapear qual emulador cobre cada console moderno
- Reconhecer os pontos fortes e fracos de cada projeto
- Escolher a versão correta (Flatpak, AppImage ou nativa) para o SteamOS
- Preparar o terreno para as configurações das próximas seções
:::

## Por que o core libretro perde a corrida

O RetroArch é um *frontend* que carrega *cores* (núcleos de emulação) seguindo a API libretro. Essa camada une tudo num só lugar, mas também é um intermediário a mais. Em plataformas leves — NES, SNES, Mega Drive, GBA — o custo desse intermediário é irrelevante. Em PS2, GameCube e Wii, ele começa a pesar, e em PS3 e Wii U simplesmente não existe core equivalente: o RPCS3 e o Cemu são projetos autônomos com código muito específico para serem engessados num formato genérico.

Um emulador standalone conversa direto com a GPU, controla o próprio JIT (compilador em tempo de execução), mantém o cache de shaders do seu jeito e atualiza com frequência própria. É por isso que o PCSX2 standalone costuma manter 60 FPS onde o core libretro engasga, e que o Dolphin standalone tem recurso de textura em alta resolução que o core nunca portou.

:::nota
A regra prática é simples: até a quinta geração (PS1, Saturn, N64), o RetroArch é campeão. Da sexta em diante (PS2, GameCube, Wii), os standalones disputam sério. Da sétima em diante (PS3, Wii U, 360), só existe standalone.
:::

## Quem cobre o quê

Antes de mexer em qualquer configuração, vale fixar o mapa dos consoles modernos e seus emuladores de referência no Steam Deck.

| Console | Emulador | Situação no Deck |
|---|---|---|
| PlayStation 2 | PCSX2 | Excelente, 60 FPS na maioria |
| GameCube / Wii | Dolphin | Excelente, alta resolução fácil |
| PlayStation 3 | RPCS3 | Bom, exige ajuste por jogo |
| Wii U | Cemu | Bom, shaders exigem paciência |
| Xbox clássico | Xemu | Bom, poucos jogos pesados |
| Xbox 360 | Xenia | Experimental, poucos títulos jogáveis |

O `Xenia` merece uma ressalva honesta: ele não tem porta oficial para Linux ainda. No Deck, ele funciona via camada de tradução (a mesma família de tecnologia do Proton), o que custa desempenho e limita a lista de títulos. Já o `Xemu` roda nativo e é bem mais estável.

## Como instalar no SteamOS

No SteamOS, o caminho oficial de instalação é o **Discover** (loja gráfica do KDE), que entrega aplicações em formato **Flatpak** — empacotamento isolado que não depende dos pacotes do sistema base, importante porque o sistema de arquivos do SteamOS é somente leitura fora de algumas áreas.

```terminal
$ flatpak search pcsx2
Name      Description                     Application ID
PCSX2     PS2 emulator                   net.pcsx2.PCSX2
```
```terminal
$ flatpak install -y net.pcsx2.PCSX2 net.kuribo64.cemu org.DolphinEmu.dolphin-emu
```

Depois da instalação, os emuladores aparecem no menu de aplicativos do modo Desktop e também podem ser adicionados à biblioteca Steam (assunto da seção final). Um detalhe importante: por serem Flatpaks, os diretórios de configuração ficam isolados em `~/.var/app/`, e não nos caminhos tradicionais que os tutoriais de PC costumam citar.

```terminal
$ ls ~/.var/app/
net.pcsx2.PCSX2
net.kuribo64.cemu
org.DolphinEmu.dolphin-emu
```

:::dica
Se você instalou o EmuDeck, ele já baixa e configura todos esses emuladores de uma vez, com diretórios padronizados em `~/Emulation/` e controles pré-mapeados. Ainda assim, entender cada um individualmente é o que te salva quando algo quebra.
:::

## A versão correta faz diferença

Nem toda versão vale a pena no Deck. O conselho geral para o hardware AMD (APU Van Gogh, com iGPU RDNA 2) é:

- **Flatpak**: a escolha padrão e mais prática, com isolamento e atualização automática via Discover.
- **AppImage**: um executável único, útil para testar builds experimentais sem instalar nada, mas sem integração de menu.
- **Build nativa (AUR)**: possível tecnicamente no SteamOS, porém desaconselhada — o sistema é read-only e você perde a limpeza do Flatpak.

Para o PCSX2 especificamente, há um ponto de virada: a partir da versão 1.7 (as *nightly builds*), o projeto abandonou o backend antigo e estabilizou o **Vulkan** como renderizador principal, o que melhorou muito o desempenho em GPU AMD. Usar uma build velha (1.6, ainda em alguns pacotes antigos) é receita para travamento.

## Resumo

- Emuladores standalone conversam direto com a GPU e vencem os cores libretro nos consoles da sexta geração em diante.
- PCSX2, Dolphin, RPCS3, Cemu, Xemu e Xenia são os projetos de referência para cada console moderno.
- No SteamOS, o caminho padrão é instalar por Flatpak via Discover ou `flatpak install`.
- Os dados de configuração dos Flatpaks ficam em `~/.var/app/`, e não nos caminhos tradicionais de PC.
- Xenia ainda não tem build nativa de Linux e roda via camada de tradução, com compatibilidade reduzida.

## Exercícios

1. Liste os emuladores Flatpak instalados com `flatpak list` e identifique qual deles corresponde a cada console moderno.
2. Abra o Discover e localize os seis emuladores deste capítulo. Anote o *Application ID* de cada um.
3. Com `ls ~/.var/app/`, confirme em qual diretório cada Flatpak guarda sua configuração e localize a pasta de um emulador que você já tenha aberto.
4. Pesquise na documentação do PCSX2 qual é a versão mínima recomendada atualmente e verifique qual versão você tem instalada com `flatpak info net.pcsx2.PCSX2`.
5. **Desafio.** Compare a página de compatibilidade do RPCS3 com a do Dolphin: quais critérios cada projeto usa para classificar um jogo como "jogável"? Explique por que um jogo pode ser "playable" num e "broken" noutro sem que nenhum dos dois esteja errado.
