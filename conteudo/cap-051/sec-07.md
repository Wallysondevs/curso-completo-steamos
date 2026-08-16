Metade do valor do SRM está em gerar atalhos; a outra metade está em vesti-los. Um atalho sem arte é um retângulo cinza indistinguível, e na biblioteca Steam isso é como não estar lá. Esta seção cobre as fontes de arte, o SteamGridDB como padrão de facto, os formatos esperados pelo Steam e como conseguir um visual profissional mesmo para jogos obscuros.

:::objetivos
- Entender os três tipos de imagem que o Steam espera por jogo
- Conhecer o SteamGridDB e como o SRM o consulta
- Baixar arte manualmente quando o SRM não acha
- Ajustar capas, banners e ícones diretamente na pasta de grid do Steam
- Substituir arte automática por escolhas manuais específicas
:::

## Os três tipos de imagem

O Steam espera três imagens diferentes para cada item da biblioteca (seja jogo instalado ou atalho externo):

| Tipo | Descrição | Uso no Steam |
|---|---|---|
| **Capa** (*grid*) | Retrato vertical, 600x900 px | A imagem principal na grade da biblioteca |
| **Banner** (*hero*) | Panorama horizontal, 1920x620 px | O fundo que aparece ao selecionar o jogo |
| **Ícone** (*logo*) | Logotipo transparente sobre fundo escuro | O cabeçalho na página do jogo |

No modo jogo do Steam Deck, a capa é soberana: é o que você vê ao navegar pela grade da sua biblioteca. O banner aparece quando você seleciona o jogo, e o ícone coroa a página de detalhes. Um jogo sem capa some na grade; um jogo sem banner aparece com fundo preto ao ser selecionado; um jogo sem ícone mostra um texto genérico.

```terminal
$ ls ~/.steam/steam/userdata/367540/config/grid/ | grep -i 'mario\|zelda' | head -6
291550_hero.png    # banner: "personagem/jogo/cena horizontal"
291550_logo.png    # ícone: logotipo transparente
291550_p.png       # capa (p = poster/portrait): vertical
```

Os jogos instalados usam o AppID como prefixo (aqui, `291550`). Os atalhos externos gerados pelo SRM usam um hash derivado do nome do jogo — a [seção seguinte](#/cap-051/sec-08) descreve como esse hash é calculado.

## O SteamGridDB

O SteamGridDB é um repositório comunitário de imagens curadas exatamente para esse propósito: cobrir jogos que o Steam oficial não cobre (ROMs e jogos de outras lojas). O SRM se integra com ele por padrão, usando a API pública:

```terminal
## Exemplo conceitual — a API é chamada pelo SRM internamente

Busca: "Super Mario World"
Plataforma: "Nintendo SNES"
Tipos: grid, hero, logo
```

A melhor prática é criar uma conta no [SteamGridDB](https://www.steamgriddb.com), gerar uma chave de API e fornecê-la ao SRM. Sem chave, a API pública tem limites de requisição menores e você pode esbarrar em rate limit se tiver muitos jogos.

:::dica
Configure a chave de API do SteamGridDB no SRM (Settings → SteamGridDB API Key). Com ela, o SRM puxa imagens de resolução máxima sem throttling e você pode usar filtros avançados como "preferir estático ao animado" e "preferir capa vertical à horizontal".
:::

## Quando o SRM não acha arte

Três motivos explicam a grande maioria dos casos de arte ausente no preview:

1. **Nome de busca errado** — o título usado para consultar o SteamGridDB não bate com o nome canônico do jogo.
2. **Jogo obscuro ou regional** — o SteamGridDB simplesmente não tem imagens para aquele título específico.
3. **Rate limit** — sem chave de API, o SRM excedeu o limite de consultas por minuto.

Para o primeiro caso, o remédio é ajustar o título de busca (você já viu na [seção de filtros](#/cap-051/sec-05)). Para o segundo, é fazer upload manual de arte, como detalhado a seguir. Para o terceiro, é fornecer uma chave de API ou reduzir o número de parsers rodando simultaneamente.

```terminal
## Verificar se um jogo existe no SteamGridDB

$ curl -s "https://www.steamgriddb.com/api/v2/search/autocomplete/Super%20Mario%20World" \
  -H "Authorization: Bearer $SGDB_API_KEY" | jq '.data[0].name'
"Super Mario World"
```

Uma busca rápida via `curl` confirma se o jogo existe no banco. Se a API retorna vazio, você sabe que precisa buscar arte em outro lugar ou criar a sua.

## Injetando arte manualmente

Se o SRM não achou ou se você prefere uma imagem específica, pode injetá-la diretamente na pasta de grid do Steam. É literalmente um arquivo PNG com o nome certo no local certo:

```terminal
$ cp ~/Downloads/super-mario-world-capa.png \
  ~/.steam/steam/userdata/367540/config/grid/0123456789_p.png
```

O nome do arquivo precisa bater com o **shortcut ID** (um número único que o SRM gera para cada atalho) e o sufixo indica o tipo: `_p` para capa (*poster*), `_hero` para banner, `_logo` para ícone. Depois de copiar, reinicie o Steam (ou simplesmente vá para a página do jogo) — o Steam detecta o arquivo novo automaticamente.

:::nota
Você não precisa fechar o Steam para trocar arquivos da pasta `grid/`. O Steam recarrega as imagens ao navegar até o jogo. Isso é diferente do `shortcuts.vdf`, que só é lido na inicialização. Imagens você altera a quente.
:::

## Dimensões e formatos

O Steam aceita PNG e JPEG em qualquer resolução, mas três resoluções são de facto para Steam Deck:

| Tipo | Resolução recomendada | Proporção |
|---|---|---|
| Capa (*grid*) | 600 × 900 px | 2:3 (retrato) |
| Banner (*hero*) | 1920 × 620 px | ≈ 3:1 (panorâmico) |
| Ícone (*logo*) | Transparente, ~800 px de largura | PNG com canal alpha |

Se você está criando sua própria arte, comece no GIMP ou no Photopea com essas dimensões. O site SteamGridDB tem templates e uma comunidade ativa que cobre até jogos fan-translated e hacks de ROM.

```terminal
$ file ~/.steam/steam/userdata/367540/config/grid/*_p.png | head -3
0123456789_p.png: PNG image data, 600 x 900, 8-bit/color RGB
9876543210_p.png: PNG image data, 600 x 900, 8-bit/color RGBA
```

O comando `file` confirma as dimensões. Imagens de capa fora das proporções ideais ainda funcionam, mas o Steam as estica ou comprime, resultado em arte borrada ou com barras — um detalhe que separa uma biblioteca amadora de uma profissional.

:::exemplo
Num cenário real, você quer capa para um ROM hack como "Super Metroid — Redesign". O SteamGridDB pode não ter. Você usa o Screenshot do jogo, recorta no GIMP para 600×900 px, adiciona o título com a fonte de Super Metroid e salva como PNG. Cola na pasta `grid/` com o nome certo e pronto: o jogo tem capa exatamente como os oficiais.
:::

## Resumo

- O Steam espera três imagens por jogo: capa (600×900 px), banner (1920×620 px) e ícone (logo transparente).
- O SteamGridDB é o banco comunitário padrão; forneça uma chave de API para evitar rate limits.
- Arte ausente no preview geralmente é nome de busca errado, jogo obscuro ou limite de requisição.
- Imagens podem ser injetadas manualmente na pasta `grid/` do Steam, com nome `<shortcut_id>_p.png` etc.
- O Steam recarrega imagens da pasta `grid/` a quente, sem necessidade de reinicialização.
- Manter as dimensões de referência garante que as imagens não apareçam esticadas ou borradas.

## Exercícios

1. Liste quantos arquivos de cada tipo (`_p.png`, `_hero.png`, `_logo.png`) existem na sua pasta `grid/`.
2. Crie uma conta no SteamGridDB, gere uma chave de API e configure-a no SRM.
3. Encontre um jogo no preview com arte ausente. Busque manualmente no SteamGridDB e, se existir, baixe e coloque na pasta `grid/` com o nome correto.
4. Abra uma imagem de capa no GIMP (ou no visualizador) e confirme que a resolução é 600×900. Se não for, explique o que o Steam faria com ela.
5. **Desafio.** Escolha um jogo de ROM sem arte em banco nenhum. Crie uma capa do zero (capture de tela + texto) e injete-a manualmente, confirmando que o Steam a mostra no modo jogo.