Se o sistema de automação do Steam Deck tem uma língua nativa, ela é Bash. Não porque seja a melhor linguagem — mas porque é a que está sempre lá, a que o próprio sistema usa nos seus scripts de manutenção e a que exige zero instalação numa raiz imutável. Esta seção estabelece os fundamentos de Bash no contexto específico do SteamOS: como escrever scripts robustos, as armadilhas que a shell impõe, e os padrões que as seções seguintes vão usar a todo momento.

:::objetivos
- Escrever scripts Bash robustos com os guardas essenciais (`set -euo pipefail`, shebang, permissões)
- Entender variáveis, expansão, condicionais e loops no contexto de tarefas reais do Deck
- Tratar argumentos, flags e saída de erro de forma idiomática
- Ler e manipular arquivos com `grep`, `sed`, `awk` e `jq` quando a necessidade exigir
- Adotar um esqueleto de script reutilizável como ponto de partida
:::

## O esqueleto mínimo

Todo script confiável no SteamOS começa com o mesmo esqueleto. Não é pedantismo — é o que separa um script que "funciona na minha máquina" de um que sobrevive a um reboot e a uma atualização:

```terminal
$ cat ~/bin/hello-deck
#!/bin/bash
set -euo pipefail

echo "Olá do Steam Deck: $(hostname)"
```

Depois, torne-o executável:

```terminal
$ chmod +x ~/bin/hello-deck
$ hello-deck
Olá do Steam Deck: steamdeck
```

Vamos decodificar cada guarda, porque eles mudam completamente o comportamento:

| Guarda | Efeito |
|---|---|
| `#!/bin/bash` | shebang: diz ao kernel qual interpretador usar |
| `set -e` | aborta o script se qualquer comando retornar erro (exit != 0) |
| `set -u` | aborta se uma variável não definida for usada |
| `set -o pipefail` | um pipeline falha se *qualquer* comando do encadeamento falhar |

Sem `set -euo pipefail`, o Bash segue em frente silenciosamente diante de erros — o que, numa automação noturna, significa que você descobre o problema dias depois, pelo sintoma, e não pela causa.

:::atencao
`set -e` tem uma pegadinha clássica: ele **não** dispara em comandos dentro de `if`, `while`, ou no lado esquerdo de `&&`/`||`, porque nesses contextos o código de retorno é usado como condição, não como erro. Da mesma forma, um comando no fim de um pipeline precisa de `pipefail` para ser pego. Se um trecho precisa "falhar sem derrubar o script", envolva-o com `if cmd; then ...; else ...; fi` ou `cmd || true`.
:::

## Variáveis e expansão

O Bash tem dois modos de expansão que causam 99% dos bugs de iniciante: com e sem aspas. A regra de ouro: **aspas duplas sempre, a menos que você tenha um motivo explícito para não usá-las.**

```terminal
$ save_dir="~/My Games/Saves"
$ echo "$save_dir"      # correto
~/My Games/Saves
$ echo $save_dir        # errado: a expansão "divide" no espaço
~/My Games/Saves
```

O exemplo parece o mesmo, mas internamente `$save_dir` sem aspas vira dois argumentos separados (`~/My` e `Games/Saves`). Para qualquer caminho que contenha espaço — e saves e jogos estão cheios deles — isso quebra comandos. Use `"$var"` sempre.

Já as chaves e aspas simples têm papéis distintos:

```terminal
$ game="Stardew Valley"
$ echo "${game} — ${#game} caracteres"
Stardew Valley — 14 caracteres
$ echo 'Literal: $game não expande'
Literal: $game não expande
```

- `"$var"` → expande o valor, protege contra word-splitting.
- `'$var'` → literal, nada expande.
- `${var}` → demarca o nome da variável (obrigatório em `${game}s`, por exemplo).
- `$(...)` → substituição de comando, o jeito moderno de capturar saída.

```terminal
$ appid=$(grep -oP '^\s*"appid"\s+"\K\d+' ~/.local/share/Steam/steamapps/appmanifest_413150.acf)
$ echo "AppID do Stardew Valley: $appid"
AppID do Stardew Valley: 413150
```

## Condicionais e testes

O Bash faz decisões com `[[ ... ]]` (preferido sobre o antigo `[ ... ]`, mais permissivo e sem word-splitting). Os operadores mais usados no contexto do Deck:

```terminal
$ if [[ -d ~/.local/share/Steam ]]; then
    echo "Steam instalado"
  fi

$ if [[ "$(id -u)" -eq 0 ]]; then
    echo "Rodando como root — evite para automação de usuário"
  fi
```

Testes de arquivo são onipresentes em automação:

| Teste | Verdadeiro quando |
|---|---|
| `-e arquivo` | arquivo existe (qualquer tipo) |
| `-f arquivo` | é arquivo regular |
| `-d diretório` | é diretório |
| `-x arquivo` | é executável |
| `-s arquivo` | existe e não está vazio |
| `-n "$var"` | string não vazia |

```terminal
$ backup="/run/media/deck/BACKUP"
$ if [[ -d "$backup" && -w "$backup" ]]; then
    echo "Destino montado e gravável"
  else
    echo "Backup indisponível" >&2
  fi
```

O `>&2` envia a mensagem para o stderr — o canal de erro — em vez do stdout. Separar os canais é essencial: scripts que compõem scripts só devem emitir o "resultado" no stdout e os avisos no stderr.

## Loops e iteração

Dois trabalhos repetem-se tanto que merecem loops próprios. O `for` itera sobre listas:

```terminal
$ for acf in ~/.local/share/Steam/steamapps/appmanifest_*.acf; do
    name=$(grep -oP '^\s*"name"\s+"\K[^"]+' "$acf" | head -1)
    echo "$name"
  done
```

O `while read` itera sobre linhas de um arquivo ou de um pipeline — o padrão para processar saídas longas:

```terminal
$ find ~/.local/share/Steam/userdata -name "remotecache.vdf" | while read -r vdf; do
    echo "Cloud cache: $vdf"
  done
```

Aqui `read -r` evita que o Bash interprete barras invertidas do caminho. É um detalhe que se você não usar, um dia morde.

:::dica
Ao iterar nomes de arquivo, prefira `for ... in .../*.txt` (glob) a `for ... in $(ls *.txt)` (subshell do `ls`). O glob não quebra com espaços e nomes estranhos; o `ls` combinado com word-splitting quebra.
:::

## Argumentos, flags e mensagens de erro

Um script útil aceita argumentos e responde a erros. O padrão `case` para dispatch de subcomandos já apareceu em capítulos anteriores e é a forma idiomática:

```terminal
$ cat ~/bin/steamos-info
#!/bin/bash
set -euo pipefail

usage() {
    echo "Uso: $0 {version|kernel|gpu|all}" >&2
    exit 1
}

show_version() { grep -oP 'VERSION_ID="\K[^"]+' /etc/os-release; }
show_kernel()  { uname -r; }
show_gpu()     { lspci | grep -i vga; }

case "${1:-}" in
    version) show_version ;;
    kernel)  show_kernel ;;
    gpu)     show_gpu ;;
    all)     show_version; show_kernel; show_gpu ;;
    *)       usage ;;
esac
```

Repare em `"${1:-}"`: se nenhum argumento for passado, a expansão vira string vazia e cai no `*` (uso), em vez de estourar com `set -u` por `$1` indefinido.

## Ferramentas de texto na ponta dos dedos

Automação no SteamOS frequentemente significa ler arquivos VDF/ACF (formato da Valve), logs e saídas. As quatro ferramentas que cobrem 95% dos casos:

```terminal
$ # grep: filtrar linhas
$ grep -i "steam" /etc/os-release
$ # sed: transformar/substituir
$ grep -oP 'NAME="\K[^"]+' /etc/os-release | sed 's/ /_/g'
$ # awk: trabalhar com colunas
$ df -h / | awk 'NR==2 {print "Espaço livre:", $4}'
$ # jq: JSON estruturado (quando existe)
$ curl -s http://localhost:8384/rest/system/status | jq '.uptime'
```

`grep -oP` com `\K` é um truque valioso no contexto da Valve: extrai só o valor, descartando o prefixo — como no `appid` e no `name` dos manifestos ACF vistos acima.

:::info
`jq` pode não estar instalado no SteamOS de fábrica. Se precisar de parse de JSON sem poder instalar, o Python 3 vem embutido e faz o trabalho: `python3 -c "import sys,json; print(json.load(sys.stdin)['uptime'])"`. As seções seguintes preferem Python para JSON e Bash para o resto.
:::

## Um esqueleto reutilizável

Juntando tudo, este é o template que as próximas seções assumem como base. Copie para `~/bin/template.sh` e adapte:

```terminal
$ cat ~/bin/template.sh
#!/bin/bash
set -euo pipefail

# ------------------------------------------------------------
# Nome:  template.sh
# Uso:   template.sh <subcomando> [opções]
# ------------------------------------------------------------

readonly SCRIPT_NAME="$(basename "$0")"

log()  { echo "[$SCRIPT_NAME] $*"; }
warn() { echo "[$SCRIPT_NAME] AVISO: $*" >&2; }
die()  { echo "[$SCRIPT_NAME] ERRO: $*" >&2; exit 1; }

usage() {
    echo "Uso: $0 <subcomando>" >&2
    exit 1
}

main() {
    case "${1:-}" in
        start) log "iniciando..." ;;
        stop)  log "parando..." ;;
        *)     usage ;;
    esac
}

main "$@"
```

Com `log`, `warn` e `die` centralizados, todo script ganha saída consistente e erros que se autodescrevem — o que mais adiante facilita ler o journal do systemd.

## Resumo

- Todo script começa com `#!/bin/bash` e `set -euo pipefail`; o trio de guardas é o que impede falhas silenciosas.
- Aspas duplas em toda expansão (`"$var"`) protegem contra nomes com espaço, onipresentes em jogos e saves.
- `[[ ... ]]` para testes, `case ... esac` para dispatch, `for`/`while read -r` para iteração.
- Argumentos com `"${1:-}"` e um `usage()` tornam scripts utilizáveis por outras pessoas (e por você, semanas depois).
- `grep -oP` com `\K`, `sed`, `awk` e Python/jq para JSON cobrem o parse de VDF, ACF e logs.
- Um esqueleto com `log`/`warn`/`die` padroniza a saída e prepara os logs para o journal.

## Exercícios

1. Crie o `hello-deck` com o esqueleto mínimo, torne-o executável e rode. Em seguida, remova o `set -u` e tente usar uma variável indefinida — qual a diferença de comportamento?
2. Escreva um script que percorra todos os `appmanifest_*.acf` e imprima uma tabela `AppID — Nome` usando `grep -oP`. Anime-se: são os mesmos padrões das seções de Steam Cloud.
3. Converta um comando seu de uso diário (ex.: limpar cache, listar jogos instalados) num script com `case` que aceite subcomandos. Documente o uso com `usage()`.
4. Use `find ... | while read -r` para listar todos os `remotecache.vdf` e, para cada um, mostrar o tamanho total da pasta `local/` correspondente. Aplique aspas duplas em todas as expansões.
5. **Desafio.** Escreva um script que aceite flags com `getopts` (ex.: `-v` para modo verboso, `-d` para dry-run) e integre ao esqueleto `log`/`warn`/`die`. Teste combinações de flags e argumentos posicionais.
