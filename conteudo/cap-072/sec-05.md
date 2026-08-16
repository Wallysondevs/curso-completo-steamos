A biblioteca Steam é só metade dos jogos que rodam no Steam Deck. A outra metade vem de GOG, Epic Games, Itch.io, emuladores via EmuDeck, executáveis avulsos de十几年 atrás e jogos instalados via Lutris ou Heroic Games Launcher. Nenhum deles tem Steam Cloud. O progresso desses jogos mora no seu disco e só no seu disco — se o SSD pifar ou você resetar o deck, é game over. Esta seção mapeia onde cada tipo de jogo guarda saves e como unificar isso em uma estratégia de backup.

:::objetivos
- Mapear os locais de save de jogos não-Steam: Proton, native Linux, Wine e emuladores
- Entender a estrutura de `compatdata/` e como achar saves dentro de prefixos Proton
- Usar o Heroic e o Lutris para descobrir caminhos de save declarados pelos jogos
- Consolidar todos os saves não-Steam em uma única árvore para backup
- Proteger saves de emuladores instalados via EmuDeck
:::

## As quatro categorias de saves não-Steam

Jogos fora do Steam caem em quatro mundos diferentes, cada um com sua própria convenção de onde salvar:

| Categoria | Exemplo | Onde salva |
|---|---|---|
| Linux nativo (Flatpak/AppImage) | Stardew Valley via GOG | `~/.local/share/`, `~/.config/`, `~/.var/app/` |
| Proton (adicionado ao Steam) | The Witcher 3 via GOG | `compatdata/<AppID>/pfx/drive_c/users/steamuser/Documents/` |
| Wine via Lutris/Heroic | Cyberpunk 2077 via Epic | `~/Games/`, prefixo Wine do Heroic |
| Emuladores (EmuDeck) | Zelda BOTW, Pokémon | `~/Emulation/saves/` |

Cada uma dessas categorias precisa de uma abordagem diferente de descoberta. Não adianta decorar caminhos — o que funciona é saber **como** achar o caminho para qualquer jogo.

## A árvore `compatdata/` e o prefixo Proton

Quando você adiciona um jogo não-Steam e força o uso de Proton, o Steam cria um prefixo Wine isolado em `~/.local/share/Steam/steamapps/compatdata/<AppID>/`. Esse prefixo é um disco `C:` falso onde o jogo acredita estar rodando em Windows. Os saves caem nos locais típicos do Windows, traduzidos para caminhos Linux:

```terminal
$ ls ~/.local/share/Steam/steamapps/compatdata/ | head -5
1245620/
2254740/
413150/
$ ls ~/.local/share/Steam/steamapps/compatdata/1245620/pfx/drive_c/users/steamuser/
AppData/
Desktop/
Documents/
Saved Games/
```

Os caminhos mais comuns de saves Windows, traduzidos para dentro do prefixo Proton:

- `Documents/My Games/<NomeDoJogo>/`
- `Documents/<NomeDoJogo>/`
- `Saved Games/<NomeDoJogo>/`
- `AppData/Local/<NomeDoJogo>/`
- `AppData/LocalLow/<Desenvolvedor>/<Jogo>/`
- `AppData/Roaming/<Desenvolvedor>/<Jogo>/`

:::dica
O `find` é seu melhor amigo para localizar saves desconhecidos. Dentro do prefixo, arquivos de save costumam ter extensões como `.sav`, `.dat`, `.sl2`, `.save`, `.srm`, `.state`. Um padrão de busca útil:

```terminal
$ find ~/.local/share/Steam/steamapps/compatdata/1245620/pfx/ -type f \
    \( -iname "*.sav" -o -iname "*.dat" -o -iname "*.save" -o -iname "*.srm" \) \
    -not -path "*/Windows/*" -not -path "*/Microsoft/*" 2>/dev/null
```
:::

Mas cuidado: o prefixo Proton não contém só saves. Ele tem o jogo inteiro instalado, configurações do Wine, e dados de compatibilidade. Um prefixo pode ter dezenas de gigabytes. Você quer extrair só os saves, não fazer backup do prefixo todo.

## Jogos nativos Linux fora do Steam

Jogos instalados via Flatpak (Discover, Heroic flatpak) seguem o padrão de diretórios do Flatpak: cada aplicativo tem sua própria árvore em `~/.var/app/<app-id>/`. Dentro dela, réplicas de `~/.local/share/`, `~/.config/` e `~/.cache/`:

```terminal
$ ls ~/.var/app/com.heroicgameslauncher.hgl/
cache/ config/ data/
$ ls ~/.var/app/com.heroicgameslauncher.hgl/data/
Heroic/
```

Já jogos nativos baixados diretamente (GOG offline installers, Itch.io, AppImage) salvam nos diretórios padrão do sistema — os mesmos que um jogo nativo do Steam usaria:

```terminal
$ find ~/.local/share/ ~/.config/ -maxdepth 3 -type d \
    \( -iname "*saves*" -o -iname "*savegames*" -o -iname "*progress*" \) 2>/dev/null
/home/deck/.local/share/StardewValley/Saves
/home/deck/.local/share/Terraria/Players
/home/deck/.config/unity3d/TeamCherry/HollowKnight/Saves
```

## Heroic Games Launcher e Lutris

Tanto Heroic (Epic + GOG) quanto Lutris armazenam metadados sobre onde cada jogo salva. No Heroic, a informação fica em `~/.var/app/com.heroicgameslauncher.hgl/config/heroic/` (Flatpak) ou `~/.config/heroic/` (nativo). Cada jogo instalado tem uma entrada com o caminho do prefixo Wine e, para jogos nativos, o caminho do executável — o save estará próximo.

```terminal
$ ls ~/.var/app/com.heroicgameslauncher.hgl/data/Heroic/Games/Heroic/
$ cat ~/.config/heroic/gog/config.json | python3 -c "
import sys, json
data = json.load(sys.stdin)
for app, info in data.get('games', {}).items():
    print(f\"{info.get('title', app)}: {info.get('install_path', 'N/A')}\")
" 2>/dev/null || echo "Formato pode variar entre versões"
```

O Heroic também oferece, na interface gráfica, o botão "Open Save Folder" nas configurações de cada jogo — se o jogo declarou o caminho na GOG ou Epic. Para automação, você pode inspecionar o arquivo `goglibrary.json` ou `epiclibrary.json`:

```terminal
$ find ~/.var/app/com.heroicgameslauncher.hgl/ ~/.config/heroic/ \
    -name "*.json" -path "*gog*" 2>/dev/null | head -3
/home/deck/.var/app/com.heroicgameslauncher.hgl/config/heroic/gog/saveLocations.json
```

## Emuladores e EmuDeck

O EmuDeck unifica os saves de todas as plataformas emuladas em `~/Emulation/saves/`. Dentro dela, cada emulador tem sua subpasta:

```terminal
$ ls ~/Emulation/saves/
retroarch/   yuzu/   ryujinx/   dolphin/   pcsx2/   duckstation/   cemu/
```

Alguns emuladores como RetroArch e Dolphin permitem configurar o caminho de save. O EmuDeck já ajusta tudo para a árvore `~/Emulation/saves/` automaticamente. Mas se você instalou emuladores manualmente, cada um terá seu próprio diretório:

| Emulador | Caminho padrão de saves |
|---|---|
| RetroArch | `~/.var/app/org.libretro.RetroArch/config/retroarch/saves/` |
| Dolphin | `~/.local/share/dolphin-emu/Wii/title/` e `GC/` |
| PCSX2 | `~/.config/PCSX2/memcards/` |
| Yuzu | `~/.local/share/yuzu/nand/user/save/` |
| Ryujinx | `~/.config/Ryujinx/bis/user/save/` |
| DuckStation | `~/.local/share/duckstation/memcards/` |
| Cemu | `~/.local/share/Cemu/mlc01/usr/save/` |

```terminal
$ du -sh ~/Emulation/saves/
1.8G    /home/deck/Emulation/saves/
$ find ~/Emulation/saves/ -type f | wc -l
487
```

:::nota
Emuladores de consoles que usam save states (como RetroArch com `.state` e `.srm`) geram arquivos muito maiores que saves originais de cartucho (4 KB a 128 KB). Uma pasta de saves de emulação pode passar de 2 GB facilmente. Se for sincronizar com Syncthing ou nuvem, considere excluir save states e manter só os saves de bateria (`.srm`, `.sav`).
:::

## Consolidando tudo em uma única árvore

Com os caminhos mapeados, você pode criar uma hierarquia simbólica que concentre todos os saves não-Steam em um só lugar — facilitando backup com `tar`, `rsync` ou Syncthing:

```terminal
$ mkdir -p ~/all-saves/{steam,proton,native,heroic,emulation}
$ # Saves Steam normais (symlink para não duplicar)
$ ln -s ~/.local/share/Steam/userdata/207304170/ ~/all-saves/steam/userdata
$ # Prefixos Proton com saves identificados
$ mkdir -p ~/all-saves/proton/1245620/
$ cp -r ~/.local/share/Steam/steamapps/compatdata/1245620/pfx/drive_c/users/steamuser/Documents/ \
    ~/all-saves/proton/1245620/
$ # Emuladores
$ ln -s ~/Emulation/saves/ ~/all-saves/emulation/saves
$ # Nativos Linux
$ cp -r ~/.local/share/StardewValley/Saves ~/all-saves/native/stardew/
```

Manter essa árvore atualizada exige scripts que você verá na [seção sobre pipeline](#/cap-072/sec-09). Por ora, o importante é saber que todo save tem um caminho e que você pode encontrá-lo.

## Resumo

- Jogos não-Steam salvam em quatro mundos: Linux nativo, prefixo Proton (`compatdata/`), prefixo Wine do Heroic/Lutris e emuladores via EmuDeck.
- Dentro de `compatdata/<AppID>/pfx/drive_c/users/steamuser/`, os saves seguem as convenções do Windows: `Documents/`, `Saved Games/`, `AppData/`.
- Heroic e Lutris expõem metadados de save; o EmuDeck já centraliza em `~/Emulation/saves/`.
- `find` com extensões como `.sav`, `.sl2`, `.save`, `.srm` é a ferramenta universal para localizar saves desconhecidos.
- Consolidar saves via symlinks em uma árvore única (`~/all-saves/`) prepara o terreno para backup automatizado.

## Exercícios

1. Liste todos os jogos não-Steam que você tem instalados e classifique cada um em uma das quatro categorias (nativo, Proton, Heroic/Lutris, emulação).
2. Para um jogo Proton, use `find` para localizar o arquivo de save principal dentro de `compatdata/`. Cronometre: quanto tempo levou para achar?
3. Acesse a interface do Heroic e use o botão "Open Save Folder" de três jogos. O caminho que ele abre bate com o que você encontraria com `find`?
4. Crie a árvore `~/all-saves/` com symlinks para todos os saves que você mapeou. Calcule o tamanho total com `du -sh ~/all-saves/`.
5. **Desafio.** Escreva um script que percorra todos os diretórios em `compatdata/`, identifique o nome do jogo (olhando o `appmanifest` ou o `config.json` dentro do prefixo) e imprima uma tabela `Nome do Jogo | AppID | Caminho do Save`. Use apenas ferramentas de terminal, sem Python.