Um tema do CSS Loader é, no fim das contas, um punhado de arquivos de texto que dizem ao navegador embutido do Steam "pinte isto assim, oculte aquilo, aumente aquela fonte". Quem entende como essas regras são aplicadas — e contra o quê — consegue prever por que um tema funciona e por que outro quebra, e deixa de tratar a personalização como magia. Esta seção abre a caixa-preta.

:::objetivos
- Entender a anatomia de um tema do CSS Loader (manifesto e folhas de estilo)
- Reconhecer o papel dos seletores CSS e da especificidade na sobrescrita
- Identificar o alvo de um tema na interface (páginas SP internas)
- Ler a variáveis de tema e flags no `theme.json`
- Saber depurar um tema que não aplica usando o console do webview
:::

## A anatomia de um tema

Cada tema instalado é uma pasta com, no mínimo, dois arquivos: um manifesto e uma ou mais folhas CSS. Veja um tema real, o popular *Clean Gameview*:

```terminal
$ find ~/homebrew/themes/Clean\ Gameview -maxdepth 2
/home/deck/homebrew/themes/Clean Gameview/theme.json
/home/deck/homebrew/themes/Clean Gameview/preview.png
/home/deck/homebrew/themes/Clean Gameview/shared.css
/home/deck/homebrew/themes/Clean Gameview/patches.css
/home/deck/homebrew/themes/Clean Gameview/gameview.css
```

O `theme.json` descreve o tema para o CSS Loader; o `preview.png` é a miniatura exibida no painel; e os `.css` contêm as regras de fato. Repare na separação: `gameview.css` mexe na página do jogo, enquanto `patches.css` aplica correções pontuais em outros lugares. Vamos ler o manifesto:

```json
{
  "name": "Clean Gameview",
  "author": "SuchMeme",
  "version": "v2.2",
  "target": "SP",
  "manifest_version": 8,
  "description": "Renova a página do jogo com fundo limpo.",
  "spec": "v3",
  "tabs": ["CSS Loader", "Game View"]
}
```

Dois campos merecem destaque. `target` define o alvo: `SP` significa *Steam Page*, ou seja, as páginas internas da interface (`steammobile`/`steamui`). `tabs` controla em qual aba do painel do CSS Loader o tema aparece. O `manifest_version` e `spec` dizem ao backend qual formato de parser usar — e por isso temas antigos (spec `v2`) às vezes quebram quando o CSS Loader sobe de versão.

## Seletores e a arte da sobrescrita

Como o alvo é CSS puro, tudo gira em torno de **seletores**. Um seletor aponta para um elemento da interface; a regra que ele carrega altera a aparência daquele elemento. Um tema simples para deixar a biblioteca escura e arredondar as capas pode ser assim:

```css
/* gameview.css */
.gamepadtabbedpage_PageHeader_1U7vH {
  background: #0e141b !important;
}

.BasicUI .appportrait_CapsuleArt_2XHtT {
  border-radius: 12px !important;
  transition: transform .15s ease;
}
```

Dois detalhes explicam o funcionamento. Primeiro, os nomes de classe terminam em sufixos embaralhados (`_1U7vH`, `_2XHtT`): o Steam compila o CSS com *CSS Modules*, um processo que gera hashes curtos para evitar colisão de nomes. Por isso você nunca encontrará uma classe com nome bonito como `.page-header` — todas são ofuscadas. Segundo, o `!important` após cada valor: é ele que garante que a regra do tema **vence** a regra original da Valve, mesmo que a original tenha especificidade maior.

Isso leva à regra de ouro do diagnóstico: se um tema não aplica, quase sempre é um dos três motivos:

| Sintoma | Causa provável |
|---|---|
| Nada muda | O tema não está ativado, ou o `target` não bate com a página aberta |
| Alguns elementos mudam, outros não | Selector incorreto (a Valve renomeou a classe numa atualização) |
| O tema some ao navegar | O CSS só se aplica a uma página que não é a atual |

## As páginas SP por baixo

A interface do Steam é um conjunto de **páginas internas** servidas pelo processo do cliente, que o webview carrega como URLs `steammobile://` internas. O CSS Loader injeta as folhas nessas páginas conforme o `target` do tema:

```terminal
$ cat ~/homebrew/themes/Clean\ Gameview/theme.json | grep -i target
  "target": "SP",
```

O valor `SP` cobre as páginas principais (`library`, `store`, `gameview`). Temas de teclado usam um alvo específico para a página do teclado, e por isso são tratados em separado na [seção do teclado virtual](#/cap-074/sec-05). Entender que a interface é feita de páginas ajuda a explicar por que um tema que muda a biblioteca pode não alterar nada na loja: são páginas distintas, carregadas separadamente.

:::nota
A ofuscação de classes por *CSS Modules* é deliberada na engenharia do Steam. Para os autores de tema, isso significa que os seletores são **código vivo**: a Valve renomeia classes a cada grande atualização do cliente, e os mantenedores de tema precisam caçar os novos nomes. É a principal razão pela qual temas quebram silenciosamente.
:::

## Depurando um tema que não aplica

O CSS Loader expõe um console simplificado, mas dá para enxergar a interface por dentro usando o modo de desenvolvedor do webview. O primeiro passo de qualquer diagnóstico é confirmar que o tema está carregado:

```terminal
$ ls ~/homebrew/themes/ | grep -i clean
Clean Gameview
$ cat ~/homebrew/themes/Clean\ Gameview/theme.json | grep '\"name\"'
  "name": "Clean Gameview",
```

Se o tema existe em disco mas não aparece no painel, o problema está no manifesto (JSON malformado ou `spec` não suportado). O `python` do sistema valida o JSON para você:

```terminal
$ python3 -m json.tool ~/homebrew/themes/Clean\ Gameview/theme.json > /dev/null && echo "JSON OK"
JSON OK
```

Um JSON com erro de sintaxe faria o `python` devolver a linha e coluna do problema — e o CSS Loader, por tabela, ignoraria o tema inteiro sem reclamar alto.

:::dica
Ative um tema por vez. Com vários temas de interface ativos, os `!important` competem entre si na ordem de injeção, e o resultado final se torna imprevisível. Isolar o tema quebrado é mais rápido do que depurar a soma de três temas.
:::

## Resumo

- Um tema é uma pasta com `theme.json` (manifesto) e folhas `.css`, mais uma `preview.png` opcional.
- `target: "SP"` significa que o tema mira as páginas internas do Steam (`steammobile`/`steamui`).
- O Steam ofusca as classes com *CSS Modules*, gerando nomes como `.gamepadtabbedpage_PageHeader_1U7vH`.
- O `!important` garante que a regra do tema sobrescreva a regra original da Valve.
- Se o tema não aplica, valide o JSON com `python3 -m json.tool` e confirme se o alvo bate com a página aberta.

## Exercícios

1. Escolha um tema instalado e liste sua estrutura com `find`. Identifique manifesto, folhas de estilo e miniatura.
2. Abra o `theme.json` do tema e anote os valores de `name`, `target` e `spec`. Explique o que cada um faz.
3. Rode `python3 -m json.tool` no manifesto de cada tema em `~/homebrew/themes/` e veja se algum deles tem JSON inválido.
4. Localize, em um arquivo `.css` de um tema, pelo menos três seletores com sufixo ofuscado e descreva o que cada seleção parece alterar.
5. **Desafio.** Relacione o `!important` do CSS com o conceito de especificidade. Explique por que, sem `!important`, muitas regras de tema não sobreviveriam à regra original da Valve, e proponha uma alternativa que não use `!important` à força.
