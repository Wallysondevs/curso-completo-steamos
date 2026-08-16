Adicionar jogos manualmente à Steam resolve o problema técnico, mas deixa a biblioteca visualmente pobre — capas cinzas com texto genérico, banners faltando, ícones padrão. O Steam ROM Manager (SRM) e o SteamGridDB existem para transformar essa experiência: eles escaneiam seus jogos, baixam artwork de alta qualidade e injetam tudo nos diretórios corretos da Steam.

:::objetivos
- Instalar e configurar o Steam ROM Manager via Flatpak
- Criar parsers para jogos não-Steam, emuladores e launchers
- Buscar e aplicar artwork do SteamGridDB automaticamente
- Entender a estrutura de grid images da Steam
- Corrigir artworks que não aplicam ou aparecem borradas
:::

## O que o SRM faz e por que você precisa dele

A Steam armazena artwork de jogos em arquivos de grid no diretório `~/.steam/steam/userdata/<seu-id>/config/grid/`. São cinco tipos de imagem:

| Tipo | Nome do arquivo | Dimensão recomendada |
|---|---|---|
| Capa vertical | `<appid>p.jpg` | 600×900 |
| Banner horizontal | `<appid>.jpg` | 920×430 |
| Logo | `<appid>_logo.png` | PNG com transparência |
| Ícone | `<appid>_icon.jpg` | 32×32 (qualquer resolução funciona) |
| Hero | `<appid>_hero.jpg` | 1920×620 |

```terminal
$ ls ~/.steam/steam/userdata/*/config/grid/ | head -10
-1234567890p.jpg
-1234567890.jpg
-1234567890_logo.png
-1234567890_icon.jpg
730p.jpg
730.jpg
730_logo.png
```

O SRM escaneia seus diretórios de jogos, identifica títulos por nome de arquivo ou por metadados, busca as imagens correspondentes no SteamGridDB (um banco comunitário com mais de 1 milhão de artworks) e grava os arquivos no diretório grid com o AppID correto.

:::info
O SteamGridDB (SGDB) é um site comunitário mantido por fãs — não é afiliado à Valve. Ele hospeda artworks em diversas resoluções e estilos (2D, 3D, alternativo, animado). O SRM usa a API do SGDB com uma chave que você gera gratuitamente no site.
:::

## Instalando e configurando o SRM

O SRM está no Discover como Flatpak:

```terminal
$ flatpak install flathub com.steamgriddb.SteamRomManager
$ flatpak run com.steamgriddb.SteamRomManager
```

Na primeira execução, o SRM pede algumas configurações:

1. **Steam Directory** — aponte para `~/.steam/steam/` (padrão)
2. **User Accounts** — selecione seu ID de usuário Steam (aquele número em `~/.steam/steam/userdata/`)
3. **SteamGridDB API Key** — gere uma em [steamgriddb.com/profile/preferences/api](https://www.steamgriddb.com/profile/preferences/api) e cole

Depois de configurado, o SRM funciona em dois modos: Preview (escaneia e mostra o que vai mudar) e Save (aplica as mudanças).

```terminal
$ flatpak run com.steamgriddb.SteamRomManager --help
Usage: steam-rom-manager [options]
Options:
  --no-api          Run without SteamGridDB
  --debug           Enable debug logging
```

:::dica
Antes de usar o SRM pela primeira vez, faça backup do diretório de grid: `cp -r ~/.steam/steam/userdata/*/config/grid ~/Backup/grid-backup/`. Se o SRM bagunçar algo, você restaura em segundos.
:::

## Criando parsers para seus jogos

Um **parser** no SRM é uma regra que diz: "escaneie este diretório, encontre executáveis com este padrão e adicione-os como jogos não-Steam". O SRM vem com parsers pré-configurados para emuladores (RetroArch, Dolphin, PCSX2 etc.), mas você pode criar parsers customizados.

Para jogos de PC não-Steam (GOG, Epic, itch.io), crie um parser com:

- **Parser Type**: `Glob`
- **ROMs Directory**: `~/Games/gog/` (ou a pasta onde estão seus jogos)
- **Executable**: `${filePath}` (usa o caminho completo do arquivo encontrado)
- **Title**: `${fileNameNoExt}` (extrai o título do nome do arquivo)
- **Steam Category**: `GOG`, `Epic`, `Itch.io` — cada parser pode ter sua categoria

Parsers mais avançados usam expressões regulares para extrair o nome do jogo de diretórios complexos:

```regex
^/home/deck/Games/gog/(?<title>[^/]+)/.*\.exe$
```

Isso captura "Stardew Valley" de `/home/deck/Games/gog/Stardew Valley/Stardew Valley.exe`.

```terminal
$ flatpak run com.steamgriddb.SteamRomManager --list-parsers
Parser "Glob - GOG"     → /home/deck/Games/gog/**/*.exe
Parser "Glob - Itch"    → /home/deck/Games/itch/**/*.sh
Parser "Glob - Epic"    → /home/deck/Games/epic/**/*.exe
```

## Buscando artwork no SteamGridDB

Com os parsers configurados, clique em **Preview**. O SRM escaneia os diretórios, encontra os jogos e busca artworks no SGDB. A tela de preview mostra cada jogo com as imagens encontradas — você pode selecionar manualmente entre as opções ou confiar no match automático.

O SRM prioriza artworks com maior número de votos e que correspondem ao nome exato do jogo. Se o match automático falhar (nome ambíguo, edição especial, tradução), você pode buscar manualmente:

```terminal
$ curl -H "Authorization: Bearer <sua-api-key>" \
       "https://www.steamgriddb.com/api/v2/search/autocomplete/Celeste"
{"success":true,"data":[{"id":1234,"name":"Celeste","types":["static","animated"]}]}
$ curl -H "Authorization: Bearer <sua-api-key>" \
       "https://www.steamgriddb.com/api/v2/grids/game/1234?dimensions=600x900"
{"success":true,"data":[{"url":"https://...celeste-cover.jpg","score":42},...]}
```

A API do SGDB é aberta e documentada. Você pode baixar artworks manualmente com `curl` e salvá-las no diretório grid, sem depender do SRM.

:::atencao
Animated artworks (`.webm` e `.apng`) são suportadas pelo SRM e pela Steam, mas consomem CPU para renderizar. No Game Mode, com vários jogos com capa animada, o scrolling da biblioteca pode ficar mais lento. Use com moderação — ou desative no SRM.
:::

## Aplicando e verificando

Depois de revisar a preview, clique em **Save to Steam**. O SRM:

1. Gera entradas no `shortcuts.vdf` para cada jogo encontrado
2. Baixa as imagens selecionadas do SGDB
3. Salva os arquivos no diretório `grid/` com o AppID correto
4. Opcionalmente, adiciona categorias Steam (para organizar a biblioteca)

Para verificar se tudo foi aplicado:

```terminal
$ ls -la ~/.steam/steam/userdata/*/config/grid/ | grep -i celeste
-rw-r--r-- 1 deck deck 245K Jan 15 15:30 -1234567890p.jpg
-rw-r--r-- 1 deck deck 180K Jan 15 15:30 -1234567890.jpg
-rw-r--r-- 1 deck deck  45K Jan 15 15:30 -1234567890_logo.png
-rw-r--r-- 1 deck deck  12K Jan 15 15:30 -1234567890_icon.jpg
```

Reinicie a Steam e os artworks aparecerão. Se não aparecerem, verifique:
- O AppID no nome do arquivo corresponde ao AppID no `shortcuts.vdf`
- As imagens têm extensão correta (`.jpg`, `.png`)
- O Steam está fechado enquanto o SRM escreve os arquivos (Steam lockea o grid)
- Você está no userdata correto (se houver mais de um usuário Steam na máquina)

## Resumo

- O Steam ROM Manager escaneia diretórios de jogos, busca artworks no SteamGridDB e grava no grid da Steam
- O diretório `~/.steam/steam/userdata/*/config/grid/` armazena capas, banners, logos, ícones e hero images
- Parsers definem regras de escaneamento; crie parsers customizados para GOG, Epic, itch.io e outras fontes
- O SteamGridDB tem API aberta — você pode buscar e baixar artworks com `curl` sem depender do SRM
- Sempre feche a Steam antes de usar o SRM e faça backup do diretório `grid/`

## Exercícios

1. Instale o SRM pelo Discover, configure a API key do SteamGridDB e gere um preview da sua biblioteca não-Steam.
2. Crie um parser customizado para sua pasta de jogos GOG. Verifique se ele encontra todos os jogos no preview.
3. Use `curl` para buscar artworks de um jogo diretamente da API do SteamGridDB. Baixe a capa mais votada e salve manualmente no diretório `grid/`.
4. Faça backup do diretório `grid/`, execute o SRM e aplique artworks. Reinicie a Steam e verifique se todos os jogos estão com capas corretas.
5. **Desafio.** Escreva um script que varre `~/Games/` em busca de executáveis, consulta a API do SteamGridDB para cada jogo encontrado, baixa a melhor capa e salva no diretório grid — sem usar o SRM. Seu script deve lidar com rate limiting da API e cachear resultados para evitar chamadas repetidas.