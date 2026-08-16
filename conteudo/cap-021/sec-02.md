Movimentar-se entre pastas é o verbo mais conjugado num gerenciador de arquivos. O Dolphin oferece meia dúzia de atalhos de teclado para navegação que, uma vez decorados, tornam o mouse desnecessário para a maior parte das tarefas de organização. No Steam Deck, onde o trackpad substitui o mouse e digitar caminhos pode ser mais rápido que arrastar o cursor, esses atalhos brilham.

:::objetivos
- Dominar os atalhos de teclado essenciais do Dolphin: voltar, avançar, subir nível e ir para barra de endereço
- Alternar entre os modos de visualização: ícones, compacto e detalhes
- Ordenar e agrupar arquivos por nome, tamanho, data e tipo
- Editar o caminho manualmente na barra de endereço com autocompletar
- Navegar pela árvore de diretórios com o atalho [[F7]]
:::

## Atalhos que poupam cliques

A navegação no Dolphin segue a mesma lógica de um navegador web: você avança, recua, sobe um nível e pode digitar o caminho manualmente. Cada ação tem uma tecla.

| Ação | Atalho | Equivalente mental |
|---|---|---|
| Voltar | `[[Alt+←]]` | "quero a pasta de onde vim" |
| Avançar | `[[Alt+→]]` | "quero voltar para onde estava depois de ter voltado" |
| Subir um nível | `[[Alt+↑]]` | "quero o diretório pai" |
| Barra de endereço | `[[Ctrl+L]]` | "quero digitar o caminho" |
| Ir para Home | `[[Alt+Home]]` | "me leva para casa" |
| Recarregar | `[[F5]]` | "mostre o que realmente está no disco agora" |

Desses, `[[Alt+↑]]` merece destaque: ele sobe na hierarquia, indo de `/home/deck/lab/projetos/2025` para `/home/deck/lab/projetos`, enquanto o botão voltar (`[[Alt+←]]`) apenas desfaz o histórico de navegação — são conceitos diferentes. Se você entrou em `lab` vindo de um atalho que apontava direto para `/etc`, o `[[Alt+↑]]` sobe para `/home/deck`, mas `[[Alt+←]]` volta para `/etc`.

```terminal
$ dolphin /home/deck/lab/projetos/2025
```

No exemplo, o Dolphin abre direto na pasta `2025`. De lá, `[[Alt+↑]]` leva a `projetos`, depois `lab`, depois `deck`, e assim sucessivamente. O atalho `[[Ctrl+L]]` é o canivete suíço: ele seleciona a barra de endereço inteira e permite digitar qualquer caminho, com autocompletar ativado pela tecla `[[Tab]]`.

:::dica
A barra de endereço do Dolphin aceita o atalho `~` (til) para o home, assim como o shell. Digitar `~/lab` e pressionar `[[Enter]]` abre `/home/deck/lab` instantaneamente, sem digitar o caminho inteiro.
:::

## Os três modos de visualização

O Dolphin oferece três modos principais de visualização, acessíveis pelo menu Ver ou pelos atalhos:

| Modo | Atalho | Ideal para |
|---|---|---|
| Ícones | `[[Ctrl+1]]` | pastas com imagens, vídeos ou arquivos visuais |
| Compacto | `[[Ctrl+2]]` | listas densas com muitas entradas |
| Detalhes | `[[Ctrl+3]]` | comparar tamanhos, datas e permissões lado a lado |

```terminal
$ dolphin --split ~/lab ~/Downloads
```

O comando acima abre o Dolphin com duas pastas simultâneas (split view), mas mantendo cada painel independente no modo de visualização. A alternância entre modos com `[[Ctrl+1]]` a `[[Ctrl+3]]` é tão rápida que você pode usá-la como filtro mental: mude para Detalhes quando quiser ver tamanhos e datas, volte para Ícones ao explorar screenshots.

O modo Detalhes exibe colunas que podem ser personalizadas: clique com o botão direito no cabeçalho das colunas e marque ou desmarque os campos.

```terminal
$ cat ~/.config/dolphinrc | grep -A5 "\[DetailsMode\]"
[DetailsMode]
Columns=Name,Size,Date,Permissions,Type
PreviewsShown=true
```

A chave `Columns` lista exatamente as colunas visíveis no modo Detalhes. A ordem importa: `Name,Size,Date,Permissions,Type` é a ordem da esquerda para a direita na tela. Você pode editar essa linha manualmente e reiniciar o Dolphin para ver o efeito imediatamente.

## Ordenação e agrupamento

Clicar no cabeçalho de uma coluna no modo Detalhes ordena por aquele campo; um segundo clique inverte a ordem. O que poucos descobrem é que o Dolphin também suporta **agrupamento**: no menu Ver → Agrupar Por, você escolhe uma categoria (tipo, data, tamanho) e os arquivos são separados visualmente em seções com cabeçalho.

Do teclado, o atalho `[[Ctrl+4]]` abre o painel de pastas laterais; `[[F7]]` mostra ou esconde o painel de árvore, que exibe a hierarquia completa do sistema de arquivos numa lista indentada. Esse painel é um navegador alternativo: clicar numa pasta nele a abre no painel principal sem perder a visão de onde você está na árvore.

```terminal
$ dolphin ~/lab
## No Dolphin: pressione F7 para abrir a árvore
## Pressione Ctrl+3 para alternar para detalhes
## Clique duas vezes no cabeçalho "Tamanho" para ordenar por tamanho
## Depois clique em "Data" para ordenar pela data de modificação
```

O que o bloco acima descreve é um fluxo de inspeção: você abre uma pasta, ativa a árvore para se localizar na hierarquia, muda para detalhes para ver metadados e ordena por tamanho para achar arquivos grandes, depois por data para encontrar os mais recentes. Tudo sem mouse.

:::nota
A tecla `[[F7]]` funciona como alternância (toggle): pressiona uma vez para abrir o painel de árvore, pressiona de novo para fechá-lo. O mesmo vale para `[[F9]]` (painel lateral), `[[F11]]` (exibir/esconder a barra de menus) e — importantíssimo — `[[F4]]` (terminal embutido), que veremos na seção dedicada.
:::

## Resumo

- `[[Alt+↑]]` sobe um nível na hierarquia, enquanto `[[Alt+←]]` volta no histórico; são conceitos distintos.
- `[[Ctrl+L]]` seleciona a barra de endereço, que aceita `~`, autocompletar com `[[Tab]]` e até URLs remotas.
- Os três modos de visualização (`[[Ctrl+1]]`, `[[Ctrl+2]]`, `[[Ctrl+3]]`) cobrem de ícones grandes a tabelas densas com metadados.
- O arquivo `~/.config/dolphinrc` define as colunas do modo Detalhes na chave `Columns` sob o grupo `[DetailsMode]`.
- `[[F7]]` abre o painel de árvore para navegar pela hierarquia completa sem perder a visão do diretório atual.

## Exercícios

1. Abra o Dolphin em `~/Downloads` e pratique a sequência: `[[Alt+↑]]`, `[[Alt+←]]`, `[[Alt+→]]`, `[[Alt+↑]]` repetidas vezes. Anote mentalmente a diferença entre subir na hierarquia e voltar no histórico.
2. Pressione `[[Ctrl+1]]`, `[[Ctrl+2]]` e `[[Ctrl+3]]` no mesmo diretório. Qual modo mostra mais arquivos de uma vez? Qual é o melhor para comparar tamanhos?
3. No modo Detalhes, clique com o botão direito no cabeçalho e adicione a coluna "Permissões". Depois leia `~/.config/dolphinrc` e confirme que a coluna nova aparece na chave `Columns`.
4. Pressione `[[F7]]` e navegue pela árvore até `/usr/share`. Sem fechar a árvore, use `[[Ctrl+L]]` para digitar `~/lab` e veja como a árvore acompanha a barra de endereço.
5. **Desafio.** Abra dois diretórios diferentes em splits com `dolphin --split ~/lab ~/Downloads`. Em cada painel, use um modo de visualização diferente (ícones de um lado, detalhes do outro). Explique em que cenário de organização isso é útil.