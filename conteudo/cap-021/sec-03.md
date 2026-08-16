Navegar por abas e ver duas pastas lado a lado são duas formas de atacar o mesmo problema: você quase nunca trabalha com uma única pasta de cada vez. Mover um arquivo de Downloads para Projetos, comparar o conteúdo de duas versões de uma pasta, copiar da mídia externa para o SSD — tudo isso pede uma segunda visão. O Dolphin resolve com abas (uma pilha de pastas) e split view (duas pastas simultâneas na mesma janela).

:::objetivos
- Criar, alternar e fechar abas com atalhos de teclado
- Distinguir quando usar abas versus split view
- Dominar os atalhos do split view e mover o foco entre os painéis
- Arrastar arquivos de um painel para outro de forma precisa
- Reabrir as abas da última sessão
:::

## Abas: uma pilha de pastas

Aba no Dolphin funciona como aba de navegador: cada uma é uma pasta independente, com seu próprio histórico de navegação e seu próprio modo de visualização. A barra de abas fica no topo, logo abaixo da barra de ferramentas, e some quando há uma única aba.

| Ação | Atalho |
|---|---|
| Nova aba | `[[Ctrl+T]]` |
| Fechar aba | `[[Ctrl+W]]` |
| Próxima aba | `[[Ctrl+PageDown]]` |
| Aba anterior | `[[Ctrl+PageUp]]` |
| Ir para aba específica | `[[Ctrl+1]]` a `[[Ctrl+9]]` |

O atalho `[[Ctrl+T]]` abre uma nova aba exibindo o mesmo diretório da aba atual. A partir daí, você navega para onde quiser sem perder a pasta original. Isso é a essência das abas: manter **contextos paralelos** de navegação.

```terminal
$ dolphin ~/lab
## Pressione Ctrl+T (nova aba, mesmíssima pasta ~/lab)
## Na nova aba, use Ctrl+L, digite ~/Downloads e Enter
## Agora você tem: aba 1 em ~/lab, aba 2 em ~/Downloads
## Use Ctrl+1 e Ctrl+2 para alternar entre elas
```

O bloco acima monta o cenário clássico: uma aba de origem (`~/lab`) e uma aba de destino (`~/Downloads`). Com `[[Ctrl+1]]` e `[[Ctrl+2]]` você salta entre elas instantaneamente, mais rápido do que qualquer navegação clicada.

:::dica
O Dolphin lembra as abas abertas quando você fecha a janela. Na reabertura, ele restaura a sessão — a menos que você tenha fechado cada aba com `[[Ctrl+W]]`. Para forçar o reinício sem abas, feche todas as abas antes de fechar a janela, ou desative a opção em Configurações → Geral → Comportamento → "Mostrar abas que estavam abertas".
:::

## Split view: duas pastas lado a lado

Se as abas empilham pastas no tempo, o split view coloca duas pastas **simultaneamente** na tela. O atalho é `[[F3]]`, e ele divide a área central em dois painéis verticais. Clicar em qualquer um dos painéis o torna o **ativo** — é para ele que as ações (abrir, copiar, apagar) se dirigem.

```terminal
$ dolphin --split ~/Downloads ~/lab
```

O argumento `--split` na linha de comando já abre o Dolphin com os dois painéis mostrando as duas pastas indicadas. Internamente, é o equivalente gráfico de pressionar `[[F3]]` e navegar cada painel até o destino. O painel da esquerda é o ativo por padrão.

A graça do split view é a transferência direta: você arrasta um arquivo do painel esquerdo para o direito (ou vice-versa) e o Dolphin pergunta se quer **mover** ou **copiar**. Arrastar com o trackpad do Deck exige precisão, então o teclado entra em cena.

:::atencao
Arrastar entre painéis no modo split **move** o arquivo por padrão quando origem e destino estão no mesmo sistema de arquivos, mas **copia** quando são sistemas de arquivos diferentes (por exemplo, do SSD interno para um pendrive montado). Para forçar a escolha, arraste segurando `[[Ctrl]]` (copiar) ou `[[Shift]]` (mover). Esse comportamento é uma armadilha clássica de quem organiza arquivos entre a memória e o disco.
:::

## Foco: para onde vão seus comandos

Com dois painéis, sempre existe uma pergunta no ar: "o que acontece se eu pressionar Enter agora?" A resposta é: a ação do painel **ativo**. O painel ativo tem a barra de título levemente colorida ou um contorno destacado. Para mudar o foco sem mouse, o Dolphin usa atalhos específicos.

| Ação | Atalho |
|---|---|
| Alternar foco entre painéis | `[[Tab]]` (quando foco está num painel) |
| Ativar/desativar split | `[[F3]]` |
| Fechar o painel ativo | `[[Ctrl+Shift+F3]]` |

Cada painel do split mantém seu próprio modo de visualização e ordenação. Você pode ter o painel esquerdo em ícones e o direito em detalhes, algo útil quando a esquerda é uma pasta de imagens (visual) e a direita uma pasta de destino (metadados).

```terminal
$ dolphin --split ~/lab ~/Downloads
## F3 para fechar o split, mantendo o painel ativo
## F3 de novo para reabrir o split com os dois painéis
## Tab alterna o foco entre esquerda e direita
```

A alternância `[[F3]]` liga e desliga o split, mas não perde o estado: ao reabrir, os painéis voltam exatamente às pastas onde estavam. Isso faz do `[[F3]]` um "zoom" temporário de comparação — abre, confere, fecha.

## Resumo

- `[[Ctrl+T]]` abre nova aba, `[[Ctrl+W]]` fecha, e `[[Ctrl+1]]` a `[[Ctrl+9]]` saltam para uma aba específica.
- Abas mantêm contextos paralelos de navegação; split view mostra dois deles simultaneamente.
- `[[F3]]` alterna o split view; `dolphin --split pastaA pastaB` o abre já dividido pela linha de comando.
- O painel ativo dita para onde vão as ações; `[[Tab]]` move o foco entre os painéis.
- Arrastar entre painéis move no mesmo sistema de arquivos e copia entre sistemas diferentes, salvo se você forçar com `[[Ctrl]]` ou `[[Shift]]`.

## Exercícios

1. Abra o Dolphin em `~/lab`, pressione `[[Ctrl+T]]` e, na nova aba, navegue até `~/Downloads` com `[[Ctrl+L]]`. Alterne entre as abas com `[[Ctrl+1]]` e `[[Ctrl+2]]`.
2. Pressione `[[F3]]` e use `[[Tab]]` para alternar o foco três vezes, observando como o painel ativo muda de destaque.
3. Crie um arquivo de teste com `echo "teste" > ~/lab/movendo.txt` e arraste-o de `~/lab` para `~/Downloads` em split view. Ele foi movido ou copiado? Por quê?
4. Feche e reabra o Dolphin. As abas da sessão anterior foram restauradas? Relacione o resultado com a opção de restauração de sessão.
5. **Desafio.** Use `dolphin --split` para comparar o conteúdo de duas pastas que parecem iguais (por exemplo, duas pastas de backup). Combine o split view com o modo Detalhes (`[[Ctrl+3]]`) e a ordenação por data para identificar qual arquivo é mais recente em cada uma.