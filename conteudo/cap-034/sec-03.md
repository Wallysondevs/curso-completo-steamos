Planilha é a ferramenta que mais gente evita, e por um bom motivo: ela não mostra o que está fazendo até você entender que referência circular, célula formatada como texto e `=SOMA()` com parâmetro errado são erros silenciosos. O LibreOffice Calc resolve o lado prático da equação — no Steam Deck ele abre arquivos `.xlsx`, grava `.ods`, e tem os mesmos recursos de tabela dinâmica e gráfico de qualquer suíte desktop. O foco aqui não é repetir um tutorial de planilha, mas mostrar como o Calc se comporta no Deck e quais recursos de produtividade você vai usar todos os dias.

:::objetivos
- Navegar pela interface do Calc no modo desktop do Steam Deck
- Entender a diferença entre CSV, `.ods` e `.xlsx` ao abrir e salvar
- Aplicar fórmulas com referências absolutas e relativas
- Criar uma tabela dinâmica com agrupamento e filtro
- Exportar gráficos para o Writer com vínculo vivo
:::

## O Calc no Deck: espaço e atalhos

Se você abre o Calc na tela de 7 polegadas do Deck, a primeira sensação é a de que faltam pixels. A grade de células é densa e os ícones das barras de ferramentas competem por espaço. Conecte o monitor externo: a experiência melhora radicalmente, e a resolução 1080p permite ver 40 linhas e 15 colunas confortavelmente.

Os atalhos que você precisa saber de cor no teclado físico:

| Atalho | Efeito |
|---|---|
| `[[Ctrl+Home]]` | Vai para a célula A1 |
| `[[Ctrl+Shift+End]]` | Seleciona até a última célula usada |
| `[[F2]]` | Edita a célula atual (sem precisar do mouse) |
| `[[Ctrl+D]]` | Preenche para baixo (copia a fórmula da primeira) |
| `[[F4]]` | Alterna referência relativa → absoluta durante a edição |

```terminal
$ flatpak run org.libreoffice.LibreOffice --calc
```

Se você quer abrir o Calc direto sem passar pelo centro de controle do LibreOffice, o comando acima funciona no Konsole. No dia a dia, clique no menu de aplicativos do KDE e digite "Calc".

## Os três formatos que você vai encontrar

Toda planilha no Deck vai cair num destes formatos:

| Extensão | Formato | Use quando |
|---|---|---|
| `.ods` | OpenDocument (nativo) | Você controla ambas as pontas; máxima compatibilidade com LibreOffice |
| `.xlsx` | Office Open XML | Você troca arquivos com usuários do Microsoft Excel |
| `.csv` | Texto puro com separador | Você está importando dados brutos de um sistema ou script |

O Calc abre `.xlsx` sem problema na maioria dos casos. A única limitação real são macros VBA — o LibreOffice simplesmente as ignora. Se a planilha depende de macros complexas, você precisará reescrevê-las em LibreOffice Basic ou em Python via extensão ScriptForge.

```terminal
$ head -5 ~/Downloads/exportado.csv
nome,email,cargo,data_admissao
Ana Souza,ana@exemplo.com,Analista,2025-01-10
Carlos Lima,carlos@exemplo.com,Desenvolvedor,2024-11-23
Marina Rocha,marina@exemplo.com,Gerente,2023-06-15
...
```

Para abrir um CSV corretamente no Calc, vá em **Arquivo → Abrir**, selecione o arquivo e **atenção à janela de importação**: escolha o separador correto (vírgula ou ponto e vírgula) e marque "Detectar números especiais" para que valores como `R$ 1.500,00` não virem texto. Se você errar o separador, todas as colunas despejam na primeira célula sem aviso.

## A fórmula que trava coluna e libera linha

O erro mais comum com fórmulas no Calc é copiar `=B2*C2` para baixo e descobrir que `=B3*C3` funciona, mas copiar para a direita e obter `=C2*D2` quando você queria manter a coluna B fixa. A diferença está no `$`:

```terminal
## Suponha coluna B = preço unitário, coluna C = quantidade
## A2 = B2 * C2 → arrastar para baixo funciona
## Mas se quiser fixar a coluna B ao arrastar para a direita:
## A2 = $B2 * C2
```

O `[[F4]]` dentro da edição de uma célula alterna entre quatro modos: `B2` (relativa), `$B$2` (absoluta), `B$2` (linha travada) e `$B2` (coluna travada). É mais rápido do que digitar cifrão manualmente.

```terminal
## Fórmula com referência absoluta a uma célula de taxa (linha 1):
## C2 = B2 * (1 + $A$1)  →  taxa fixa na célula A1 para todas as linhas
```

:::atencao
No Calc em português, o separador de argumentos de função é **ponto e vírgula** (`;`), não vírgula. `=SOMA(A1;A10)`, não `=SOMA(A1,A10)`. Se você escrever com vírgula, o Calc interpreta como texto e a fórmula não calcula — e não há mensagem de erro vermelha, só um `#NOME?` discreto na célula.
:::

## Tabela dinâmica em três cliques

A tabela dinâmica (*pivot table*) é o recurso que transforma mil linhas de dados brutos num resumo de uma página. Suponha que você tenha uma planilha de vendas com colunas: `vendedor`, `produto`, `data`, `valor`. Para saber o total vendido por vendedor e por mês:

1. Selecione todo o intervalo de dados (incluindo o cabeçalho).
2. Vá em **Dados → Tabela Dinâmica → Criar**. O Calc automaticamente detecta o intervalo.
3. Arraste `vendedor` para "Campos de linha", `data` para "Campos de coluna" e `valor` para "Campos de dados".

O Calc agrupa automaticamente datas por ano e mês se você clicar com botão direito numa data e escolher **Agrupar → Meses**. O resultado é um resumo que cabe na tela do Deck sem rolagem horizontal, mesmo no monitor pequeno.

:::info
Tabelas dinâmicas do LibreOffice Calc são compatíveis de ida e volta com o Excel na maior parte dos casos: abrir uma `.xlsx` com tabela dinâmica funciona; salvar como `.xlsx` também. A formatação condicional e os campos calculados sobrevivem à exportação. A exceção são medidas DAX e o modelo de dados do Power Pivot, que são específicos do Excel e não têm equivalente no Calc.
:::

## Gráfico vivo no Writer

Uma das integrações mais subestimadas da suíte é colar um gráfico do Calc no Writer com **vínculo dinâmico**. Isso significa que, quando os dados da planilha mudam, o gráfico no documento de texto atualiza sozinho.

O procedimento: crie o gráfico no Calc, selecione-o, `[[Ctrl+C]]`. No Writer, vá em **Editar → Colar especial → Colar vínculo**. Escolha "Gráfico do LibreOffice Calc". Pronto — salve ambos os arquivos na mesma pasta para não quebrar o caminho relativo do vínculo.

```terminal
$ ls ~/Documents/projeto/
dados-vendas.ods   relatorio-trimestral.odt
```

Se você mover o `.ods` para outra pasta depois de criar o vínculo, o Writer perde a referência e mostra um retângulo vazio no lugar do gráfico. Mantenha os arquivos juntos ou use caminhos absolutos se o relatório for fixo.

## Resumo

- O Calc no Deck funciona melhor com monitor externo; `[[F2]]` edita célula, `[[F4]]` alterna referências.
- CSV exige escolher corretamente separador e detecção de números na janela de importação.
- `$B2` trava coluna, `B$2` trava linha, `$B$2` trava ambos; isso define se a fórmula sobrevive ao arraste.
- Tabelas dinâmicas resumem dados em segundos; a compatibilidade com `.xlsx` é boa para a maioria dos casos.
- Gráficos colados como vínculo no Writer atualizam automaticamente quando os dados do Calc mudam.

## Exercícios

1. Crie uma planilha com 20 linhas de dados fictícios (nome, valor, quantidade). Use `=SOMA()` na coluna de valor e confira com `[[Ctrl+Shift+End]]` se o intervalo está correto.
2. Baixe um CSV público (por exemplo, do Portal Brasileiro de Dados Abertos) e importe no Calc. Identifique o separador correto e confirme que todas as colunas ficaram em células separadas.
3. Monte uma fórmula com referência absoluta a uma célula de taxa e arraste para 10 linhas. Depois altere a taxa e veja se todas as linhas recalcularam.
4. A partir dos dados do exercício 1, crie uma tabela dinâmica com total por nome. Agrupe por qualquer campo categórico adicional que tiver.
5. **Desafio.** Crie um gráfico de barras no Calc, cole como vínculo no Writer, feche ambos os arquivos e altere um valor na planilha. Reabra o Writer e confirme se o gráfico atualizou. Se não atualizou, descubra por que o vínculo quebrou.