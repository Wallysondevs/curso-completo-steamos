O preview é a etapa mais subestimada do SRM — e a mais importante para quem quer uma biblioteca que preste. É ali que você vê, antes de qualquer gravação, quantos atalhos serão criados, com que título, com que arte e com que comando. Pular o preview é a causa número dois de "adicionei jogos com capa errada e agora tenho duzentos atalhos para apagar". Esta seção ensina a ler cada coluna do preview, validar o que importa e decidir com confiança se é hora de gravar.

:::objetivos
- Interpretar cada coluna e campo do preview do SRM
- Validar títulos, comandos e arte antes de gravar
- Identificar entradas problemáticas e corrigi-las na fonte
- Entender a diferença entre "não achou arte" e "arte não atribuída"
- Ajustar parâmetros globais e reparsear seletivamente
:::

## O que o preview mostra

Depois de rodar o parse, o SRM monta uma tabela. Cada linha é um jogo candidato, e as colunas principais são:

| Coluna | O que mostra |
|---|---|
| Título | O nome processado pelos filtros |
| App ID | O identificador interno do Steam se já existir (vazio para novo) |
| Plataforma | A categoria do parser (SNES, GBA, etc.) |
| Comando | O comando completo que será gravado |
| Arte | Status da capa/banner/ícone — encontrada, pendente ou falha |

A coluna de arte talvez seja a mais importante do preview: é onde você decide se um jogo entra com capa bonita ou com o quadrado cinza genérico.

```terminal
## Simulação do que o preview lista (conceitualmente)

Título                   Plataforma   Arte
Super Mario World        SNES         ✓ (3/3)
Zelda - Link to the Past SNES         ✓ (3/3)
F-Zero                   SNES         ✗ (0/3) — sem match
```

Num preview de três jogos, duas capas encontradas e uma ausente: é o momento de intervir. Você pode corrigir o título de busca do F-Zero, trocar a fonte de arte ou aceitar o jogo sem capa.

## Validando o comando

Cada linha do preview, se expandida, mostra o comando exato que será executado ao clicar no jogo. É sua chance de detectar erros que passaram batidos no parser:

```terminal
## Preview do comando para Super Mario World (SNES)

/home/deck/.var/app/org.libretro.RetroArch/.../retroarch \
  -L "/home/deck/.var/app/org.libretro.RetroArch/.../cores/snes9x_libretro.so" \
  "/home/deck/Emulation/roms/snes/Super Mario World.sfc"
```

Três coisas gritam erro aqui se estiverem erradas: o caminho do binário `retroarch`, o caminho do core `.so` e o caminho da ROM. Se qualquer um desses não existir, o atalho vai falhar silenciosamente — o Steam tenta executar, o processo morre e você volta para a biblioteca sem mensagem de erro.

:::dica
Pegue um jogo de amostra no preview, copie o comando dele e cole no terminal do desktop. Se o jogo abrir, o comando está correto. Se não, o erro no terminal (arquivo não encontrado, core não carregado, ROM não localizada) diz exatamente o que ajustar no parser — antes de gerar cem atalhos quebrados.
:::

## O status da arte

O SRM busca arte em fontes que você configura — quase sempre o SteamGridDB. Para cada jogo, ele consulta a fonte uma vez e classifica:

- **Match exato**: encontrou o jogo pelo nome, baixou capa + banner + ícone.
- **Match aproximado**: encontrou algo próximo, mas você deve revisar.
- **Sem match**: a busca não retornou nada.

A diferença entre "match aproximado" e "sem match" é sutil: no aproximado, o SRM *trouxe* algo mas não tem certeza de que é o jogo certo; no sem match, não há o que exibir. Ambos pedem intervenção, mas o aproximado é mais perigoso — você pode aceitar inconscientemente a capa do jogo errado.

```terminal
$ find /home/deck/.steam/steam/userdata/367540/config/grid/ -name '*.png' | head -5
291550_hero.png
291550_logo.png
291550_p.png
```

O padrão é `<appid>_<tipo>.png`. Para atalhos externos (sem AppID), o SRM gera um identificador próprio baseado no nome. Você verá o resultado na [seção sobre geração](#/cap-051/sec-08).

## Corrigindo no preview antes de reparsear

Se algo está errado, você tem duas opções: corrigir entrada por entrada no preview, ou voltar ao parser e ajustá-lo, depois reparsear. A escolha depende da escala do problema:

| Problema | Onde corrigir |
|---|---|
| Um jogo com nome errado | Preview (edição pontual do título de busca) |
| Todos os jogos com sujeira no nome | Voltar ao parser e ajustar os filtros |
| Um jogo a menos que o esperado | Voltar ao parser e revisar o glob |
| Uma plataforma inteira sem arte | Voltar ao parser e trocar a fonte de arte |

A edição no preview é prática para exceções; o reparse é a resposta certa para regra geral. Se você mexeu no parser e clicou em parse de novo, as edições pontuais feitas no preview **se perdem**, porque o SRM reavalia tudo do zero. Essa é a contrapartida: preview serve para conferir, não para reter ajustes manuais finos entre varreduras.

## A decisão de gravar

Com o preview validado, o botão de *Save to Steam* (ou *Generate App List*) é a última etapa. Duas confirmações antes de clicar:

1. **O Steam está fechado?** Se não estiver, feche agora. O `shortcuts.vdf` carregado na memória do Steam vai sobrescrever o que o SRM escrever.
2. **Você tem backup do `shortcuts.vdf`?** Um `cp` no terminal antes de gerar é o seu desfazer.

```terminal
$ cp ~/.steam/steam/userdata/367540/config/shortcuts.vdf ~/shortcuts.vdf.bak-$(date +%Y%m%d-%H%M%S)
```

Coloquei a data no nome do backup. Depois de gerar, você pode comparar o antes e o depois com `diff` para ver exatamente o que o SRM adicionou.

```terminal
$ diff ~/shortcuts.vdf.bak-20260202-143000 ~/.steam/steam/userdata/367540/config/shortcuts.vdf | head -20
```

:::perigo
Gravar no SRM com o Steam aberto é o erro mais comum deste capítulo. O Steam, ao fechar, exporta o `shortcuts.vdf` que tem na memória — e apaga tudo que o SRM acabou de escrever. O sintoma é clássico: você gerou, viu "sucesso", abriu o Steam e não há atalho nenhum. A única solução é fechar o Steam, reabrir o SRM e gerar de novo. Não há perda de dados do SRM (ele mantém a sessão), mas é uma perda de tempo previsível.
:::

## Resumo

- O preview lista título, plataforma, comando e status da arte de cada jogo antes da gravação.
- Validar o comando no terminal com um jogo de amostra evita cem atalhos quebrados.
- O status da arte distingue match exato, aproximado e ausente — o aproximado é o mais perigoso.
- Edições pontuais no preview se perdem ao reparsear; correções de regra geral devem ir no parser.
- Antes de gravar: Steam fechado, backup do `shortcuts.vdf` com data.
- Um `diff` entre o backup e o arquivo pós-geração mostra exatamente o que mudou.

## Exercícios

1. Rode o parse de uma plataforma e examine o preview: quantos jogos aparecem? Todos têm arte?
2. Copie o comando de um jogo do preview e cole no terminal. O jogo abriu? Se não, o que o erro diz?
3. Identifique no preview um jogo com arte ausente. Altere o título de busca e veja se a arte aparece.
4. Simule uma edição pontual no preview (mude o título de um jogo) e depois reparseie. A edição sobreviveu?
5. **Desafio.** Gere os atalhos, feche o SRM e compare o novo `shortcuts.vdf` com o backup usando `diff`. Quantas entradas foram adicionadas? O que o formato das linhas novas revela sobre como o Steam armazena atalhos?