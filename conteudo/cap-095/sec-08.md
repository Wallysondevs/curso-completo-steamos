Os comandos das seções anteriores resolvem problemas isolados: listar, copiar, ler. Mas a força do terminal está em **combinar** comandos para que a saída de um vire a entrada de outro. É isso que redirecionadores (`>`, `>>`), pipes (`|`) e subshells (`$( )`) fazem. Com essas três ferramentas, você passa de "usuário que digita comandos" para "usuário que monta pipelines de processamento de dados".

:::objetivos
- Redirecionar saída padrão para arquivos com `>` e `>>`
- Redirecionar erros com `2>` e combiná-los com `2>&1`
- Conectar comandos com pipes `|` e compor filtros
- Capturar a saída de comandos com substituição de processos `$( )`
- Entender stdin, stdout e stderr como os três fluxos de todo processo
:::

## Os três fluxos de todo processo

Quando um programa roda, o kernel entrega três arquivos abertos:

| Número | Nome | Apelido | Para onde vai por padrão |
|---|---|---|---|
| 0 | stdin | Entrada padrão | O teclado |
| 1 | stdout | Saída padrão | A tela (o terminal) |
| 2 | stderr | Erro padrão | A tela (o terminal também, mas separado) |

```terminal
$ ls ~/lab
dados  notas.txt  projeto  script.sh
$ ls ~/inexistente
ls: cannot access '/home/deck/inexistente': No such file or directory
```

A primeira linha foi para stdout. A segunda para stderr. Visualmente são iguais, mas internamente são canais diferentes — e você pode tratá-los separadamente.

## Redirecionando a saída: `>` e `>>`

`>` redireciona stdout para um arquivo. Se o arquivo existir, é **sobrescrito**. `>>` redireciona e **acrescenta** ao final.

```terminal
$ echo "primeira linha" > saida.txt
$ cat saida.txt
primeira linha
$ echo "segunda linha" > saida.txt
$ cat saida.txt
segunda linha
$ echo "terceira linha" >> saida.txt
$ cat saida.txt
segunda linha
terceira linha
```

Para redirecionar stderr, use `2>`:

```terminal
$ ls ~/lab ~/inexistente > lista.txt 2> erros.txt
$ cat lista.txt
/home/deck/lab:
dados
notas.txt
projeto
script.sh
$ cat erros.txt
ls: cannot access '/home/deck/inexistente': No such file or directory
```

Para jogar tudo no mesmo arquivo (stdout e stderr misturados):

```terminal
$ ls ~/lab ~/inexistente > tudo.txt 2>&1
$ cat tudo.txt
ls: cannot access '/home/deck/inexistente': No such file or directory
/home/deck/lab:
dados
notas.txt
projeto
script.sh
```

O `2>&1` diz "redirecione o descritor 2 (stderr) para onde o descritor 1 (stdout) está indo agora". A ordem importa: `2>&1 > arquivo` não funciona como esperado porque o `2>&1` captura o destino **atual** do stdout (a tela), não o destino futuro.

:::atencao
`> arquivo 2>&1` funciona. `2>&1 > arquivo` redireciona stderr para a tela (destino atual do stdout) e depois stdout para o arquivo — stderr continua na tela. A ordem é: redirecione stdout primeiro, depois aponte stderr para onde stdout está indo.
:::

## O descritor coringa: `/dev/null`

`/dev/null` é um buraco negro: tudo que é escrito nele desaparece. É o destino padrão para saída que você não quer ver.

```terminal
$ ls ~/lab ~/inexistente > /dev/null 2>&1
$ 
```

Nenhuma saída, nenhum erro. Útil em scripts onde você só se importa com o código de saída, não com o texto. Para jogar só os erros fora: `2>/dev/null`. Para jogar tudo fora: `&>/dev/null` (no Bash, `&>` equivale a `>arquivo 2>&1`).

## Pipes: a saída de um é a entrada de outro

O pipe `|` conecta stdout de um comando ao stdin do próximo. É o operador mais poderoso do shell Unix.

```terminal
$ ls -l ~/lab | grep txt
-rw-r--r-- 1 deck deck   33 Feb 21 11:15 saida.txt
-rw-r--r-- 1 deck deck    0 Feb 20 09:30 notas.txt
$ ls -l ~/lab | grep txt | wc -l
2
```

Cada `|` adiciona um estágio ao pipeline. O comando à esquerda não sabe que sua saída está sendo consumida por outro; o da direita não sabe que sua entrada vem de outro. Essa ignorância mútua é o segredo da composabilidade.

Exemplos de pipelines que você vai usar constantemente:

```terminal
$ dmesg | grep -i nvme | head -5
$ find ~/lab -type f -name "*.txt" | sort
$ cat /etc/passwd | cut -d: -f1 | sort | head -10
$ ps aux | grep steam | grep -v grep
$ ls -lh ~/Downloads | sort -k5 -h -r | head -10
```

O último é um clássico: "quais são os 10 maiores arquivos da minha pasta de Downloads?".

:::dica
`grep padrão | grep -v grep` elimina a linha do próprio `grep` que aparece na lista de processos. É um incômodo irritante que todo usuário de terminal aprende a resolver no segundo dia.
:::

## Substituição de comando: `$( )`

`$(comando)` executa o comando e insere sua saída no lugar. É como capturar stdout dentro de uma string.

```terminal
$ echo "A data de hoje é $(date)"
A data de hoje é Fri Feb 21 11:20:00 -03 2025
$ echo "O kernel é $(uname -r)"
O kernel é 6.8.0-valve3-1-neptune-64
$ ls -l $(which bash)
-rwxr-xr-x 1 root root 1267048 Sep  5  2024 /usr/bin/bash
```

A sintaxe antiga com crases `` `comando` `` ainda funciona, mas `$( )` é preferível: aninha corretamente e não some dentro de marcações Markdown.

```terminal
$ echo "Total de arquivos em /etc: $(find /etc -type f 2>/dev/null | wc -l)"
Total de arquivos em /etc: 1482
$ echo "Arquivos .conf: $(find /etc -name '*.conf' 2>/dev/null | wc -l)"
Arquivos .conf: 312
```

## Códigos de saída e `$?`

Todo comando retorna um código de saída (exit code): `0` para sucesso, qualquer outro valor para erro. A variável `$?` guarda o código do último comando.

```terminal
$ ls ~/lab
dados  notas.txt  projeto  script.sh
$ echo $?
0
$ ls ~/inexistente
ls: cannot access '/home/deck/inexistente': No such file or directory
$ echo $?
2
$ grep "inexistente" ~/lab/notas.txt
$ echo $?
1
```

`grep` retorna `0` se encontrou algo, `1` se não encontrou, `2` se houve erro. Essa convenção permite que scripts tomem decisões:

```terminal
$ if grep -q "steam" /etc/os-release; then echo "É SteamOS"; fi
É SteamOS
```

A flag `-q` (quiet) suprime a saída — só o código de saída interessa.

## Resumo

- Todo processo tem stdin (0), stdout (1) e stderr (2); os três são independentes.
- `>` sobrescreve, `>>` acrescenta; `2>` redireciona stderr; `2>&1` junta stderr ao stdout.
- `|` conecta stdout de um comando ao stdin do próximo, permitindo pipelines de filtros.
- `$(comando)` captura a saída e a insere como texto; é a forma moderna de substituição de comando.
- `$?` guarda o código de saída do último comando: `0` = sucesso, qualquer outro = erro.

## Exercícios

1. Rode `ls ~/lab ~/inexistente > /tmp/saida.txt 2> /tmp/erros.txt` e examine ambos os arquivos. Qual conteúdo foi para cada um?
2. Conte o número de arquivos `.md` no diretório atual e abaixo com `find ~/lab -name "*.md" -type f 2>/dev/null | wc -l`.
3. Gere uma lista dos 5 maiores arquivos na sua home com `ls -lhS ~ | head -6`. Depois refaça com `find ~ -type f -exec du -h {} + 2>/dev/null | sort -hr | head -5`.
4. Crie um arquivo com as primeiras 20 linhas de `dmesg` usando `dmesg 2>/dev/null | head -20 > /tmp/dmesg-top20.txt`. Confira com `wc -l`.
5. **Desafio.** Combine `find`, `xargs` e `grep` para encontrar todos os arquivos `.sh` no seu `~/lab`, verificar quais contêm a palavra `echo` e salvar a lista em `/tmp/scripts-com-echo.txt`. Depois, explique por que `find ~/lab -name '*.sh' | xargs grep -l echo > /tmp/out.txt` funciona, mas `find ~/lab -name '*.sh' | grep -l echo` não.