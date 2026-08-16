A versão Stable é a espinha dorsal do Proton. Quando você instala o Steam no SteamOS e não mexe em nada, os jogos compatíveis rodam com a versão Stable mais recente. Ela passa por um ciclo de testes que envolve a Valve, os desenvolvedores de jogos verificados e o beta público antes de chegar ao status de "recomendada para todos".

:::objetivos
- Entender o ciclo de release das versões Stable do Proton
- Interpretar a numeração de versão e o arquivo `version` local
- Listar todas as builds Stable disponíveis no sistema
- Identificar qual versão está ativa como padrão global
:::

## O ciclo de releases Stable

Uma versão Stable do Proton — como a 8.0 ou a 9.0 — nasce de vários meses de trabalho no Experimental. Quando a Valve julga que o conjunto de patches está maduro, ela congela uma snapshot, numera com uma versão maior e a promove a Stable. A partir daí essa versão só recebe correções de bugs e atualizações de compatibilidade para jogos novos, mas nunca muda de comportamento para jogos que já funcionavam.

Depois do lançamento inicial, a Valve publica subversões com numeração no terceiro dígito:

```terminal
$ cat ~/.steam/steam/steamapps/common/Proton\ 9.0/version
9.0-4
$ cat ~/.steam/steam/steamapps/common/Proton\ 8.0/version
8.0-5
```

O formato é `MAJOR.MINOR-BUILD`. A `9.0-4` é a quarta build pública da linha 9.0. Cada build pode trazer dezenas de correções, mas nunca muda a linha base do Wine nem do DXVK que aquela versão usa internamente.

Essa imutabilidade da base é a principal garantia da Stable. Imagine que você participa de um campeonato de um jogo competitivo usando a 9.0: você pode deixar o Steam atualizar para a `9.0-4`, `9.0-5` e assim por diante, com a confiança de que o jogo continuará se comportando da mesma forma, porque as mudanças entre subversões são apenas correções incrementais, nunca trocas de motor de tradução. Quando a Valve quer trocar o Wine ou o DXVK de verdade, ela sobe o número maior — de 9.0 para 10.0, por exemplo — e é aí que o comportamento pode mudar de forma perceptível.

:::info
A linha 8.0 foi lançada em abril de 2023 e a 9.0 em maio de 2024. A Valve costuma manter duas linhas Stable simultâneas: a atual (9.0) e a anterior (8.0), para que jogos que dependem de comportamentos específicos da versão antiga continuem funcionando. Eventualmente a linha mais antiga é descontinuada.
:::

## Como o Steam escolhe a versão padrão

Nas configurações globais do Steam, existe um campo "Steam Play" que define qual versão do Proton é usada para todos os jogos sem uma seleção específica. No SteamOS, esse campo vem preenchido com a Stable mais recente.

```terminal
$ grep -A5 '"SteamPlay"' ~/.steam/steam/config/config.vdf
```

O `config.vdf` é um arquivo no formato KeyValues da Valve — não é JSON, mas é legível e editável. A chave relevante é `"DefaultCompatTool"`, que aponta para o nome interno da versão (ex.: `"proton_9.0"`).

Você pode alterar o padrão global sem abrir a interface gráfica, editando esse arquivo com cuidado. A mudança afeta todos os jogos que não têm uma seleção individual — jogos já configurados com uma versão específica continuam com ela, pois a escolha por jogo tem precedência sobre a global. Essa hierarquia de duas camadas (global e por jogo) é o que permite que a maioria dos títulos rode na Stable enquanto apenas alguns problemáticos usam Experimental ou GE.

## Consultando todas as Stable instaladas

Além de listar as pastas, você pode inspecionar os metadados de cada versão pelo arquivo `compatibilitytool.vdf`:

```terminal
$ for d in ~/.steam/steam/steamapps/common/Proton*/; do
>   echo "=== $(basename "$d") ==="
>   cat "$d/version" 2>/dev/null
>   echo
> done
=== Proton 8.0 ===
8.0-5

=== Proton 9.0 ===
9.0-4

=== Proton Experimental ===
experimental-9.0.20250317

=== Proton Hotfix ===
hotfix-20250314-eldr
```

O laço percorre todas as pastas que começam com `Proton` e imprime o conteúdo do arquivo `version`. Note que cada família tem seu próprio esquema de versionamento — a Experimental usa data, a Hotfix inclui um identificador do jogo.

Comparar as versões entre si é instrutivo. A 8.0-5 tem build número mais alto que a 9.0-4 (`-5` vs `-4`), mas a 9.0 está numa linha mais nova do Wine e do DXVK. É por isso que o número da build, sozinho, não indica qual versão é "melhor" — a linha maior (`MAJOR.MINOR`) pesa mais que a build (`-BUILD`). Em caso de dúvida, a documentação da Valve sempre recomenda a linha maior mais recente.

:::dica
Se um jogo para de funcionar depois de uma atualização do Proton, volte para a linha anterior nas propriedades do jogo. A Valve mantém a 8.0 disponível exatamente para isso. Nos testes internos da Valve, regressões são raras, mas acontecem — especialmente em títulos menos populares.
:::

## Resumo

- A versão Stable nasce do congelamento de uma snapshot madura do Experimental.
- O número segue o formato `MAJOR.MINOR-BUILD` (ex.: `9.0-4`), gravado no arquivo `version`.
- A Valve mantém duas linhas Stable simultâneas (8.0 e 9.0) para retrocompatibilidade.
- O `config.vdf` guarda a ferramenta padrão na chave `DefaultCompatTool`.
- Regressões em jogos menos populares são raras mas possíveis; a 8.0 serve de fallback.

## Exercícios

1. Liste todas as versões Stable instaladas com `ls ~/.steam/steam/steamapps/common/ | grep Proton` e leia o `version` de cada uma.
2. Use o laço `for` visto na seção para imprimir, de uma vez, o `version` de todas as pastas `Proton*`.
3. Localize a chave `DefaultCompatTool` no `config.vdf` e anote qual versão é o padrão global do seu sistema.
4. Compare as datas de modificação (`ls -ld`) das linhas 8.0 e 9.0 e explique qual delas continua recebendo atualizações.
5. **Desafio.** Descubra qual build da linha 9.0 você tem e verifique no changelog do GitHub da Valve se existe uma build mais nova. Escreva o que mudou entre a sua e a mais recente.