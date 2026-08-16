Os nomes de ROM baixados da internet raramente são os que você quer ver na sua biblioteca: vêm em caixa alta, com região entre parênteses, com revisão, com tag de grupo de dump e com "USA", "Europe" e "(Rev 1)" colados no final. Se você deixar o SRM usar o nome do arquivo cru, sua biblioteca Steam vira uma lista ilegível. Esta seção ensina a lapidar títulos com filtros e a controlar o que entra e o que fica de fora.

:::objetivos
- Entender por que os nomes de ROM precisam de limpeza
- Aplicar filtros de título (regex e substituições) para normalizar nomes
- Remover tags de região, revisão e caixa alta
- Excluir entradas indesejadas do resultado
- Manter a consistência entre o título do atalho e o nome da arte

:::

## De onde vêm os nomes feios

Uma ROM de SNES costuma chegar com um nome assim:

```text
Super Mario World (USA) (Rev 1) [!].sfc
```

O SRM, sem nenhum filtro, propõe o título "Super Mario World (USA) (Rev 1) [!]". É preciso, mas horrível. O que você quer é só "Super Mario World". O problema se repete em lote: centenas de ROMs, todas com o mesmo tipo de sujeira, e seria inviável renomear uma a uma.

A solução é o **filtro de título** do parser: uma lista de regras que transforma o nome-base do arquivo no título final. Cada regra é uma substituição — normalmente uma regex que casa a sujeira e a substitui por nada (ou por texto limpo).

## Os filtros como substituições

O SRM aplica os filtros em ordem, de cima para baixo, sobre o nome-base do arquivo. O bloco mais comum é uma sequência de regexes que remove as tags:

| Regex | Substitui por | Efeito |
|---|---|---|
| `\s*\(USA\)` | *(vazio)* | remove a região entre parênteses |
| `\s*\(Europe\)` | *(vazio)* | idem para Europa |
| `\s*\(Japan\)` | *(vazio)* | idem para Japão |
| `\s*\(Rev \d\)` | *(vazio)* | remove a revisão |
| `\s*\[[^\]]*\]` | *(vazio)* | remove qualquer tag entre colchetes |
| `\s*[!+b]` | *(vazio)* | remove marcas de *good dump* |

Aplicadas em sequência sobre o nome original, essas regras o transformam em "Super Mario World". A ordem importa: você quer remover primeiro as tags mais específicas e, por último, a regex genérica que varre qualquer colchete — se a genérica vier antes, as específicas viram no-op.

```terminal
$ echo 'Super Mario World (USA) (Rev 1) [!]' | sed -E 's/ *\(USA\)//; s/ *\(Rev [0-9]\)//; s/ *\[[^]]*\]//; s/  */ /'
Super Mario World
```

O `sed` acima reproduz, no terminal, exatamente o que os filtros do SRM fazem — útil para testar sua sequência de regexes antes de configurá-la na interface.

:::dica
Para testar seus filtros sem abrir o SRM, use `sed -E` com a mesma ordem de regras, separadas por `;`. Se a saída no terminal ficar boa para uma amostra de dez ROMs, ela ficará boa para a biblioteca inteira, porque as ROMs de uma mesma plataforma seguem o mesmo padrão de nome.
:::

## Caixa alta e separadores

Dois ajustes além da remoção de tags costumam fazer diferença. O primeiro é a **caixa alta**: dumps antigos chegam em `SUPER MARIO WORLD.SFC`, e você quer "Super Mario World". O segundo são os **separadores**: alguns nomes usam `_` (underscore) em vez de espaço, herança de nomes de arquivo sem espaço.

O SRM tem opções específicas para ligar/desligar a normalização de caixa (para *Title Case*) e a troca de underscores por espaços, então você não precisa escrever regex para esses dois casos — basta marcar as opções.

```terminal
$ echo 'SUPER_MARIO_WORLD' | sed -E 'y/_/ /' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2))} 1'
Super Mario World
```

A normalização em *Title Case* tem um porém: palavras que devem ficar em minúsculo no meio do título ("of", "and", "the") ou siglas que devem ficar em maiúsculo ("III", "USA") vão aparecer "erradas". O SRM geralmente permite exceções, mas o ajuste fino dessas exceções é trabalho de pente fino no preview, não de regra global.

## Excluindo o que não deve entrar

Nem toda varredura deve virar atalho. Três categorias de arquivo costumam exigir **exclusão** explícita:

- **Biografias e protótipos**: dumps não-oficiais, betas e homebrew que você não quer na biblioteca principal.
- **Duplicatas por região**: o mesmo jogo em versão USA e Europe, das quais você só quer uma.
- **Arquivos não-jogo**: patches `.ips`, traduções, saves e `readme` que por acaso caiam no glob.

O SRM permite excluir por duas vias: ajustando o glob para não casar o que você não quer, ou excluindo a entrada individual no **preview** (que é onde você revisa, na [próxima seção](#/cap-051/sec-06)).

```terminal
$ ls ~/Emulation/roms/snes/ | grep -iE '\(.*(beta|proto|unl).*\)'
Zelda - Parallel Worlds (Unl).sfc
```

Um padrão de nome com "beta", "proto" ou "unl" é um sinal forte de dump indesejado. Varrer e excluir esses antes do save mantém a biblioteca limpa.

:::atencao
Excluir pelo preview é por jogo e não é persistente entre varreduras: se você rodar o parse de novo, a entrada excluída reaparece. Para uma exclusão *permanente*, mexa no glob ou num filtro que elimine o padrão de nome. Senão você excluirá o mesmo dump toda vez.
:::

## Título versus nome da arte

Há uma sutileza que causa dor de cabeça: o SRM busca a arte (capa, banner) usando um nome que pode não ser o título que você lapidou. Se o filtro transformou o nome demais — por exemplo, de "Legend of Zelda, The - A Link to the Past" para "A Link to the Past" — a busca de arte pode não achar nada, porque o banco de imagens usa outro nome canônico.

O SRM tem um campo de **título de busca** separado do título de exibição, justamente para isso: você exibe "A Link to the Past" no Steam, mas busca a arte por "The Legend of Zelda: A Link to the Past".

| Campo | Valor | Uso |
|---|---|---|
| Título de exibição | A Link to the Past | o que aparece no Steam |
| Título de busca | The Legend of Zelda: A Link to the Past | o que o SRM manda para o banco de arte |

Em geral, prefira filtrar o mínimo necessário e, quando a busca falhar, corrija o título de busca no preview, em vez de estragar o título de exibição.

## Resumo

- Nomes de ROM vêm com sujeira (região, revisão, tag de dump) que precisa ser removida em lote.
- Os filtros de título são substituições aplicadas em ordem sobre o nome-base do arquivo.
- Caixa alta e underscores têm opções próprias no SRM, sem necessidade de regex.
- Exclusões por preview não são persistentes; para excluir sempre, ajuste glob ou filtro.
- O título de busca pode diferir do título de exibição para achar a arte correta.
- Teste a sequência de filtros no terminal com `sed -E` antes de configurá-la na interface.

## Exercícios

1. Pegue dez nomes de ROM de uma pasta e liste as tags que você quer remover (região, revisão, colchetes).
2. Escreva uma sequência de `sed -E` que remova essas tags, e rode sobre a amostra para conferir o resultado.
3. Configure os mesmos filtros no parser do SRM e compare o título do preview com o do `sed`. Eles batem?
4. Identifique na sua pasta arquivos com "beta", "proto" ou "unl" e decida se entram ou saem da biblioteca.
5. **Desafio.** Encontre um jogo que existe em duas regiões. Configure para manter apenas uma, explique qual mecanismo (glob, filtro ou exclusão) você usou e por que ele é persistente ou não.
