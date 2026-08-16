Navegar e manipular arquivos resolve metade do trabalho; ler o que está dentro deles resolve a outra. Seja um log de erro, um arquivo de configuração ou a saída de um script, você precisa de comandos que mostrem o conteúdo de forma eficiente — do arquivo inteiro às primeiras ou últimas linhas, passando pela busca de padrões. Esta seção cobre o quinteto essencial de leitura.

:::objetivos
- Exibir o conteúdo completo de arquivos com `cat` e entender quando ele é inadequado
- Navegar por arquivos longos com `less` usando os atalhos de teclado
- Extrair as primeiras ou últimas linhas com `head` e `tail`
- Buscar padrões de texto com `grep` e suas flags mais produtivas
- Combinar leitura e filtro em pipelines simples
:::

## cat: despejar e concatenar

`cat` (concatenate) lê arquivos e joga o conteúdo na tela. É rápido, direto e — para arquivos com mais de 50 linhas — completamente inadequado.

```terminal
$ cat /etc/os-release
NAME="SteamOS"
PRETTY_NAME="SteamOS 3.6"
VERSION_ID="3.6"
HOME_URL="https://www.steamdeck.com/"
$ cat /etc/os-release /etc/hostname
NAME="SteamOS"
PRETTY_NAME="SteamOS 3.6"
VERSION_ID="3.6"
steamdeck
```

O segundo comando mostra a verdadeira vocação do `cat`: concatenar múltiplos arquivos em sequência. O nome é `cat` de concatenate, não de "cat" de catalogue.

`cat` também é usado para criar arquivos rapidamente com entrada do teclado, embora seja pouco prático (um editor como `nano` é melhor para isso):

```terminal
$ cat > lembrete.txt
Revisar logs do systemd amanhã.
^C
$ cat lembrete.txt
Revisar logs do systemd amanhã.
```

`[[Ctrl+D]]` (não `[[Ctrl+C]]`) encerra a entrada; `[[Ctrl+C]]` cancela. Mas para edição de verdade, vá de `nano`.

## less: o paginador que resolve o problema do cat

`less` abre arquivos em modo paginado: uma tela por vez, com navegação completa por teclado. É um programa interativo — você entra nele, navega e sai com `q`.

```terminal
$ less /var/log/pacman.log
```

Dentro do `less`, os atalhos essenciais:

| Tecla | Ação |
|---|---|
| `[[Espaço]]` ou `[[PageDown]]` | Avança uma tela |
| `b` ou `[[PageUp]]` | Volta uma tela |
| `[[↓]]` / `[[↑]]` | Uma linha para baixo / cima |
| `g` | Vai para o início do arquivo |
| `G` | Vai para o fim do arquivo |
| `/padrão` | Busca `padrão` para frente |
| `?padrão` | Busca `padrão` para trás |
| `n` | Próxima ocorrência da busca |
| `N` | Ocorrência anterior da busca |
| `q` | Sai do `less` |

:::dica
`less` tem esse nome porque substituiu o `more` — o paginador original do Unix — e é "less is more". Uma piada da época que virou padrão. Na prática, `more` ainda existe mas não vale a pena: `less` faz tudo que `more` faz e mais.
:::

## head e tail: as pontas do arquivo

`head` mostra as primeiras linhas; `tail`, as últimas. Ambos mostram 10 linhas por padrão, controláveis com `-n`.

```terminal
$ head -n 3 /etc/passwd
root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin
$ tail -n 5 /etc/passwd
avahi:x:122:128:Avahi mDNS daemon,,,:/run/avahi-daemon:/usr/sbin/nologin
deck:x:1000:1000:Steam Deck User,,,:/home/deck:/bin/bash
systemd-coredump:x:996:996:systemd Core Dumper:/:/usr/sbin/nologin
rpcuser:x:34:34:RPC Service User:/var/lib/nfs:/usr/sbin/nologin
dnsmasq:x:999:65534:dnsmasq:/var/lib/dnsmasq:/usr/sbin/nologin
```

O verdadeiro poder do `tail` está em `-f` (follow), que mantém o arquivo aberto e mostra novas linhas conforme elas são escritas — essencial para acompanhar logs em tempo real:

```terminal
$ tail -f /var/log/pacman.log
[2025-02-21 10:40:12] [ALPM] installed steamdeck-utils (1.2.3-1)
[2025-02-21 10:40:15] [ALPM] transaction completed
```

Com `[[Ctrl+C]]` você interrompe o follow. Para logs do systemd, `journalctl -f` é a alternativa nativa que veremos no [capítulo sobre systemd](#/cap-096/sec-05).

## grep: a agulha no palheiro

`grep` busca texto dentro de arquivos usando padrões — texto fixo ou expressões regulares. Ele imprime as linhas que contêm o padrão.

```terminal
$ grep deck /etc/passwd
deck:x:1000:1000:Steam Deck User,,,:/home/deck:/bin/bash
$ grep -i steam /etc/passwd
deck:x:1000:1000:Steam Deck User,,,:/home/deck:/bin/bash
$ grep -v nologin /etc/passwd
root:x:0:0:root:/root:/bin/bash
sync:x:4:65534:sync:/bin:/bin/sync
deck:x:1000:1000:Steam Deck User,,,:/home/deck:/bin/bash
```

`-i` torna a busca case-insensitive. `-v` inverte: mostra as linhas que **não** contêm o padrão. `-n` mostra o número da linha, `-c` conta quantas linhas casaram e `-r` busca recursivamente em diretórios.

```terminal
$ grep -rn "steamos" /etc/ 2>/dev/null | head -5
/etc/os-release:1:NAME="SteamOS"
/etc/os-release:2:PRETTY_NAME="SteamOS 3.6"
/etc/steamos-release:1:SteamOS 3.6
/etc/issue:1:SteamOS 3.6 \n \l
```

O `2>/dev/null` suprime mensagens de erro (arquivos sem permissão de leitura, por exemplo). Falaremos mais sobre isso na seção 8.

:::dica
Para buscas em arquivos grandes, `grep` é ordens de magnitude mais rápido que abrir o arquivo no `less` e procurar manualmente. Um `grep -c padrão arquivo.log` conta ocorrências em milissegundos.
:::

## Nano: o editor de emergência

Nem `cat` nem `less` editam. Quando você precisa alterar um arquivo de configuração rapidamente e não quer abrir o editor gráfico (Kate, por exemplo), `nano` é o editor de terminal mais acessível do SteamOS.

```terminal
$ nano ~/.bashrc
```

Os comandos do nano ficam no rodapé da tela: `^` significa `[[Ctrl]]`. `[[Ctrl+O]]` salva (Write Out), `[[Ctrl+X]]` sai. Não tem curva de aprendizado — você abre, digita, salva e sai. Para edições mais complexas, existe o `vim`, mas ele merece um capítulo próprio [ver seção sobre editores avançados](#/sec-098).

## Resumo

- `cat` exibe arquivos inteiros ou concatena vários; para arquivos longos, use `less`.
- `less` é o paginador interativo: navegue com `[[Espaço]]`, `b`, `/busca`, `q` para sair.
- `head -n N` mostra as primeiras N linhas; `tail -n N` mostra as últimas; `tail -f` acompanha em tempo real.
- `grep` busca padrões em arquivos; `-i` ignora maiúsculas, `-v` inverte, `-r` busca recursivamente.
- `nano` é o editor de terminal mínimo para alterações rápidas em arquivos de configuração.

## Exercícios

1. Use `cat /proc/cpuinfo` e depois repita com `less /proc/cpuinfo`. Qual foi mais confortável de navegar? Dentro do `less`, busque por `model name` usando `/`.
2. Extraia as 5 primeiras e as 5 últimas linhas de `/etc/passwd` com `head` e `tail`. Combine as duas saídas colando no terminal — você consegue ver o arquivo inteiro?
3. Rode `grep -c bash /etc/passwd` para contar quantos usuários usam Bash como shell padrão. Depois, liste esses usuários com `grep bash /etc/passwd | cut -d: -f1`.
4. Execute `tail -f /var/log/pacman.log` (ou outro log que exista), abra outro terminal e simule uma ação. As linhas novas apareceram? Interrompa com `[[Ctrl+C]]`.
5. **Desafio.** Use `grep -rn "steam" /etc/ 2>/dev/null | wc -l` para contar quantas linhas nos arquivos de configuração em `/etc/` mencionam "steam". Depois, modifique o comando para mostrar apenas os nomes dos arquivos que contêm o termo (dica: `grep -rl`). O que o `2>/dev/null` faz e por que ele é necessário aqui?