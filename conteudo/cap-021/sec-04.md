Quando você sabe o nome do arquivo mas não onde ele foi parar, o Dolphin oferece duas ferramentas complementares: filtro e busca. O filtro restringe a lista visível na pasta atual conforme você digita; a busca vasculha o sistema de arquivos inteiro, com opção de usar o índice de conteúdo do Baloo. Entender quando usar cada uma dessas ferramentas evita a frustração de vasculhar manualmente pastas e subpastas no Steam Deck.

:::objetivos
- Filtrar arquivos visíveis na pasta atual digitando caracteres
- Usar a busca do Dolphin com critérios como nome, tipo, tamanho e data
- Compreender o papel do Baloo como indexador de arquivos no KDE Plasma
- Controlar o Baloo via terminal com `balooctl`
- Realizar busca textual dentro do conteúdo de arquivos
:::

## Filtro: esconda o que você não quer ver

O filtro do Dolphin não gera uma nova lista de resultados — ele simplesmente oculta da pasta atual os arquivos cujo nome **não** contém o texto digitado. Basta começar a digitar com a pasta em foco (sem `[[Ctrl+L]]`, que selecionaria a barra de endereço). O campo de filtro aparece no canto inferior direito.

```terminal
$ dolphin ~/lab
## Na pasta ~/lab, comece a digitar "relat"
## Todos os arquivos que NÃO contêm "relat" no nome somem
## Pressione Esc para limpar o filtro
```

O filtro é instantâneo e opera sobre os nomes visíveis, nunca sobre o conteúdo. Se você tem 200 arquivos numa pasta e quer achar `notas-2025-04-17.txt`, digitar `notas` reduz a lista a alguns poucos itens — o suficiente para identificar visualmente o que você busca. O texto digitado não precisa ser o início do nome: `2025` também encontraria `notas-2025-04-17.txt`.

:::dica
O filtro aceita curinga (`*`) no meio do texto. Digitar `*.png` mostra apenas os arquivos com extensão `.png`, e `relat*2025` acha qualquer arquivo que comece com `relat` e contenha `2025` no nome. Isso é correspondência de padrão (*glob*), igual ao shell.
:::

## Busca: vasculhe o disco de verdade

A busca do Dolphin é acionada pelo atalho `[[Ctrl+F]]`. Diferente do filtro, ela vasculha recursivamente a partir da pasta atual (ou de qualquer local que você escolher) e retorna uma lista de resultados em uma nova aba. O painel de busca oferece critérios combináveis:

- Nome do arquivo (aceita `*` e `?`)
- Tipo (documento, imagem, áudio, vídeo)
- Intervalo de datas (modificado entre A e B)
- Tamanho (menor que, maior que, entre)
- Classificação (1 a 5 estrelas, se você usa esse recurso)
- Conteúdo do arquivo (busca dentro do texto)

```terminal
$ dolphin ~/lab
## Ctrl+F abre a busca a partir de ~/lab
## No campo "Nome", digite: notas*
## Clique em "Adicionar critério" → "Tamanho" → "Maior que" → 1 MB
## Clique em "Adicionar critério" → "Data de modificação" → "Últimos 7 dias"
```

Os critérios são combinados com E lógico (AND): o arquivo precisa atender **todos** os critérios ao mesmo tempo. Se você quer pesquisar por dois nomes diferentes (OU lógico), precisa fazer duas buscas separadas, ou usar o `|` no campo Nome — o Dolphin interpreta `relatorio|notas` como "relatorio OU notas" no nome.

## O indexador Baloo

A busca por conteúdo de arquivo depende de um serviço chamado **Baloo**, o indexador de arquivos do KDE. Ele lê arquivos em segundo plano e constrói um banco de dados com palavras-chave, metadados e posições no texto. Sem ele, a busca por conteúdo cai para uma leitura direta dos arquivos, que é ordens de grandeza mais lenta.

```terminal
$ balooctl status
Baloo File Indexer is running
Indexed 12542 / 18743 files
Waiting for content indexing
Current size of index is 384.2 MiB
```

A saída de `balooctl status` mostra se o indexador está ativo, quantos arquivos foram indexados e o tamanho atual do índice. No Steam Deck, o Baloo vem habilitado por padrão, mas você pode pausá-lo para economizar bateria ou desligá-lo completamente.

```terminal
$ balooctl suspend
$ balooctl resume
$ balooctl disable
$ balooctl enable
```

Com `suspend`, o Baloo pausa temporariamente — útil durante uma cópia grande de arquivos ou durante uma sessão de jogo via Modo Desktop. Com `disable`, ele é desativado de forma persistente e não reinicia no próximo boot.

:::atencao
Desabilitar o Baloo permanentemente torna a busca por conteúdo de arquivo **extremamente** lenta, porque o Dolphin passa a ler cada arquivo sob demanda em vez de consultar o índice. Se o índice estiver consumindo muita CPU, prefira `balooctl suspend` durante o período de carga e `balooctl resume` depois.
:::

## Busca textual: quando o nome não basta

Com o Baloo ativo, a busca por conteúdo funciona como uma pesquisa dentro do texto dos arquivos. No critério "Conteúdo do arquivo", você digita uma palavra ou frase, e o Dolphin consulta o índice. A mágica está em tipos de arquivo que você talvez não imagine que sejam indexáveis:

```terminal
$ balooctl index ~/lab/notas.txt
```

O comando `balooctl index` força a indexação de um caminho específico, sem esperar o indexador passar por ele naturalmente. É útil para pastas recém-criadas que você sabe que vai consultar em seguida. O complemento é `balooctl clear`, que apaga o índice de um caminho.

```terminal
$ balooctl search "steamdeck tdp"
/home/deck/lab/artigo-tdp.md
/home/deck/lab/tuning-gpu.txt
```

O `balooctl search` faz a mesma busca do Dolphin, mas pela linha de comando. O argumento é texto livre, e os resultados são caminhos absolutos. É o equivalente CLI do campo de busca do Dolphin com o critério "Conteúdo do arquivo" ativo.

## Resumo

- O filtro do Dolphin (digitar com a pasta em foco) oculta itens que não batem com o nome; é instantâneo e opera na pasta atual.
- `[[Ctrl+F]]` abre a busca completa, que vasculha recursivamente com critérios combináveis (nome, tipo, tamanho, data, conteúdo).
- O Baloo é o indexador de arquivos do KDE; `balooctl status` mostra o progresso, e `balooctl suspend/resume` controla a pausa.
- `balooctl search "termo"` faz busca textual por conteúdo via linha de comando, equivalente ao critério de conteúdo do Dolphin.
- Desabilitar o Baloo (`balooctl disable`) torna a busca por conteúdo lenta, mas economiza CPU durante sessões de jogo.

## Exercícios

1. Abra o Dolphin em `~` e comece a digitar `bash`. Quantos arquivos permanecem visíveis? Pressione `[[Esc]]` e repita com `*.bash`. Compare os resultados.
2. Use `[[Ctrl+F]]` para buscar arquivos modificados nos últimos 7 dias a partir de `~`. Adicione o critério de tamanho "Maior que 10 MB". Quantos resultados aparecem?
3. Execute `balooctl status` e anote o número de arquivos indexados e o tamanho do índice. Depois pause com `balooctl suspend`, copie um arquivo PDF para `~/lab` e force a indexação com `balooctl index`.
4. Use `balooctl search "steam"` e compare com o resultado de buscar `steam` no Dolphin via `[[Ctrl+F]]` com o critério "Conteúdo do arquivo". Os resultados batem?
5. **Desafio.** Desabilite o Baloo com `balooctl disable`, faça uma busca por conteúdo de arquivo no Dolphin e meça o tempo. Reabilite com `balooctl enable`, aguarde a indexação parcial e refaça a mesma busca. Qual a diferença de tempo? O que isso revela sobre o funcionamento do índice?