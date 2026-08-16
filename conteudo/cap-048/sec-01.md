A maioria dos emuladores nasce como um programa fechado: cada um tem sua própria interface, seus próprios atalhos e sua própria forma de guardar configurações. O RetroArch inverte essa lógica. Ele é um *frontend* único que carrega dezenas de emuladores diferentes — chamados de **cores** — todos compilados na forma de uma biblioteca dinâmica com uma interface comum. É isso que faz dele o "canivete suíço": uma vez que você domina o RetroArch, dominou a configuração de NES, SNES, Mega Drive, PlayStation e Arcade de uma só vez.

:::objetivos
- Entender a separação entre frontend (RetroArch) e núcleos (cores libretro)
- Reconhecer as vantagens de ter uma interface única para dezenas de emuladores
- Identificar as responsabilidades que ficam com o core e as que ficam com o frontend
- Localizar os principais diretórios de configuração no SteamOS
- Compreender por que um core depende de uma versão específica da API libretro
:::

## Dois programas, um só processo

Quando você roda um emulador tradicional, tem nas mãos um executável que faz tudo: lê a ROM, emula o hardware, desenha o vídeo e captura o teclado. O RetroArch quebra essa responsabilidade em duas camadas que conversam por uma API chamada **libretro**.

A camada de cima é o **frontend** — o programa `retroarch` que você abre no Deck. Ele cuida do que é genérico e independente do console: o menu, o controle, a rede, a gravação, a parte de vídeo e áudio. A camada de baixo é o **core**, um arquivo `.so` que emula um sistema específico. O core do SNES sabe transformar um arquivo `.sfc` numa tela de jogo e pede ao frontend para apresentá-la.

```terminal
$ ls ~/.var/app/org.libretro.RetroArch/config/retroarch/cores/
bsnes_libretro.so
mupen64plus_next_libretro.so
snes9x_libretro.so
genesis_plus_gx_libretro.so
```

O benefício prático é enorme. Você tem **um único menu** para configurar controle, **um único** sistema de save states, **um único** atalho para o menu rápido. Tudo isso independe de qual console está emulando naquele momento.

:::nota
Nem todo emulador do mundo virou core libretro. Como a API exige um protocolo de entrada/saída específico, os autores precisam adaptar o código. Por isso nem sempre o core disponível no RetroArch é o emulador "mais preciso" de um sistema — às vezes o emulador autônomo é melhor mantido.
:::

## Por que a API libretro importa

Quando o frontend carrega um core, os dois precisam falar a mesma língua. Essa língua é a API libretro, que define funções com nomes como `retro_run()`, `retro_load_game()` e `retro_set_video_refresh()`. O core chama essas funções para pedir um frame novo ou para avisar que quer ler o gamepad; o frontend implementa cada uma com o comportamento dele (desenhar na tela, vibrar o controle, etc.).

Uma consequência prática: **core e frontend têm versões casadas**. Um core compilado contra uma versão antiga da API pode não carregar num RetroArch novo. Na prática você quase nunca percebe isso, porque o *Core Updater* baixa tudo já compilado e compatível — mas explica o erro `Failed to load content` quando alguém tenta usar um core `.so` baixado solto da internet.

:::dica
Se um core baixado manualmente não carrega, primeiro atualize o RetroArch e deixe o Core Updater refazer o download. Cores "avulsos" costumam ter ABI incompatível.
:::

## Onde cada coisa mora no Deck

Como o RetroArch chega ao SteamOS pelo Flatpak, os arquivos ficam isolados do sistema, sob `~/.var/app/org.libretro.RetroArch/`. É importante conhecer a árvore antes de mexer, porque Shaders e saves ficam em pontos diferentes:

```terminal
$ ls ~/.var/app/org.libretro.RetroArch/config/retroarch/
autoconfig/  config/        cores/  savestates/
shaders/     playlists/     saves/  system/
```

Os diretórios-chave:

| Diretório | O que guarda |
|---|---|
| `cores/` | os `.so` de cada emulador baixado |
| `system/` | BIOS e arquivos de sistema dos consoles (necessários para PS1, Saturn, etc.) |
| `saves/` | saves em RAM persistidos durante o jogo |
| `savestates/` | os save states (estados salvos) criados pelo RetroArch |
| `shaders/` | shaders `.slang` baixados para o visual CRT |
| `playlists/` | as listas de jogos por sistema (`.lpl`) |

O arquivo principal de configuração é `retroarch.cfg`, dentro de `config/`. Tudo o que você muda pelo menu vai para lá.

## Qual core usar para qual console

Embora o menu liste vários cores por sistema, a comunidade criou preferências bem estabelecidas. A tabela abaixo resume as escolhas mais seguras para um Steam Deck:

| Sistema | Core recomendado | Observação |
|---|---|---|
| NES / Famicom | `mesen` | precisão altíssima |
| SNES | `snes9x` ou `bsnes` | bsnes é mais fiel, snes9x é mais leve |
| Mega Drive / CD | `genesis_plus_gx` | também cobre Master System e Game Gear |
| Game Boy / Color / Advance | `mgba` / `gambatte` | mgba para GBA |
| PlayStation | `beetle_psx` | exige BIOS em `system/` |
| Nintendo 64 | `mupen64plus_next` | o mais equilibrado no Deck |
| Arcade | `fbneo` | FinalBurn Neo, ótimo para CPS/Neo Geo |

```terminal
$ ls ~/.var/app/org.libretro.RetroArch/config/retroarch/cores/ | wc -l
14
```

Ter 14 cores instalados é comum e barato: cada um ocupa de 1 a 20 MB. O gargalo nunca é o core, e sim ter as BIOS certas para os sistemas que as exigem.

## Resumo

- RetroArch é um frontend que carrega emuladores (cores) na forma de bibliotecas `.so` via API libretro.
- Frontend cuida do genérico (menu, controle, vídeo, rede); core cuida da emulação específica de cada sistema.
- Core e frontend têm ABI casada — use sempre o Core Updater em vez de baixar `.so` avulsos.
- No Flatpak tudo vive em `~/.var/app/org.libretro.RetroArch/config/retroarch/`, com subpastas para cores, saves, shaders e BIOS.
- Cada sistema tem cores recomendados pela comunidade (mesen, snes9x, genesis_plus_gx, beetle_psx, fbneo).

## Exercícios

1. Abra o RetroArch e vá em *Main Menu > Information > System Information*. Anote a versão do frontend e confira se o diretório de configuração bate com o caminho Flatpak descrito acima.
2. Liste o conteúdo da pasta `cores/` pelo terminal e relacione cada `.so` com o console que ele emula.
3. Explique, em uma frase, por que um core de emulador não carrega se foi baixado de uma fonte aleatória.
4. Compare as responsabilidades de frontend e core: liste três coisas que o RetroArch faz por você e que um emulador autônomo teria que implementar sozinho.
5. **Desafio.** Escolha um console da tabela de cores recomendados e, ainda sem ter lido as seções seguintes, descreva o caminho completo que você imagina percorrer no menu para baixar o core e abrir uma ROM — e o que provavelmente dará errado na primeira tentativa.
