Digitar o mesmo comando longo pela quinta vez no dia é o tipo de atrito que afasta as pessoas do terminal. O Bash resolve isso com três ferramentas complementares: aliases encurtam comandos frequentes, o histórico recupera o que você já digitou, e os arquivos de configuração do shell tornam tudo permanente. Esta seção fecha o capítulo mostrando como transformar o terminal de ferramenta funcional em ambiente personalizado.

:::objetivos
- Criar e gerenciar aliases com `alias` e `unalias`
- Navegar e pesquisar no histórico de comandos com `[[Ctrl+R]]` e `history`
- Personalizar o prompt do Bash com `PS1`
- Entender a hierarquia de arquivos de configuração do shell
- Conhecer alternativas ao Bash disponíveis no SteamOS
:::

## Aliases: apelidos para comandos

`alias` cria um atalho: uma palavra que o shell expande para um comando (ou sequência de comandos) antes de executar.

```terminal
$ alias ll='ls -lh'
$ ll ~/lab
total 16K
drwxr-xr-x 2 deck deck 4,0K Feb 21 10:30 dados
-rw-r--r-- 1 deck deck   33 Feb 21 11:15 saida.txt
drwxr-xr-x 3 deck deck 4,0K Feb 21 11:00 projeto
-rwx------ 1 deck deck   22 Feb 21 11:00 script.sh
$ alias la='ls -la'
$ alias ..='cd ..'
$ alias ...='cd ../..'
```

`alias` sem argumentos lista todos os aliases ativos. `unalias` remove:

```terminal
$ alias
alias ..='cd ..'
alias ...='cd ../..'
alias la='ls -la'
alias ll='ls -lh'
$ unalias ...
$ alias
alias ..='cd ..'
alias la='ls -la'
alias ll='ls -lh'
```

Aliases só existem na sessão atual. Para persistir, adicione ao `~/.bashrc`:

```terminal
$ cat >> ~/.bashrc << 'EOF'
alias ll='ls -lh'
alias la='ls -la'
alias ..='cd ..'
alias grep='grep --color=auto'
alias df='df -h'
alias free='free -h'
EOF
$ source ~/.bashrc
```

:::dica
Aliases que você vai querer imediatamente no Steam Deck: `alias sysupdate='steamos-update check'`, `alias temp='sensors'`, `alias ports='ss -tlnp'`. O último mostra quais portas TCP estão abertas no seu sistema — útil para depuração.
:::

Aliases não aceitam argumentos posicionais (`$1`, `$2`). Se precisar parametrizar, escreva uma função:

```terminal
$ mkcd() { mkdir -p "$1" && cd "$1"; }
$ mkcd ~/lab/novo-projeto
$ pwd
/home/deck/lab/novo-projeto
```

## Histórico: o que você já digitou

O Bash grava cada comando num arquivo (`~/.bash_history`) e oferece atalhos para recuperá-los.

```terminal
$ history | tail -5
 1243  cd ~/lab
 1244  ls -lh
 1245  grep steam /etc/os-release
 1246  vim ~/.bashrc
 1247  history | tail -5
```

As teclas de navegação no histórico:

| Atalho | Ação |
|---|---|
| `[[↑]]` / `[[↓]]` | Comando anterior / próximo (na ordem cronológica) |
| `[[Ctrl+R]]` | Busca reversa incremental: digite trechos e o Bash mostra o match mais recente |
| `[[Ctrl+R]]` repetido | Próximo match na busca reversa |
| `[[Ctrl+G]]` | Cancela a busca reversa |
| `!!` | Repete o último comando inteiro |
| `!$` | Insere o último argumento do comando anterior |
| `!ls` | Executa o último comando que começa com `ls` |

```terminal
$ ls -lh ~/lab
total 16K
...
$ !!
ls -lh ~/lab
total 16K
...
$ echo primeiro segundo terceiro
primeiro segundo terceiro
$ echo !$
echo terceiro
terceiro
```

:::atencao
`!!` é útil, mas perigoso. Se o último comando foi `rm -rf ~/lab/temp` e você digita `sudo !!` sem querer, você acaba de rodar `sudo rm -rf ~/lab/temp` com poder de root. Verifique `history` ou use `[[Ctrl+R]]` antes de repetir comandos com `sudo`.
:::

Para buscar um comando antigo, `[[Ctrl+R]]` é imbatível:

```terminal
## Pressione Ctrl+R e digite:
grep
(reverse-i-search)`grep': grep -rn "steam" /etc/ 2>/dev/null
## Pressione Enter para executar, ou Ctrl+R de novo para match anterior
```

## Personalizando o prompt com PS1

A variável `PS1` controla o prompt. O SteamOS usa um prompt padrão enxuto; você pode turbiná-lo.

```terminal
$ echo $PS1
\[\e]0;\u@\h: \w\a\]\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$
deck@steamdeck:~$
```

Os códigos de escape:

| Código | Significado |
|---|---|
| `\u` | Nome do usuário |
| `\h` | Hostname |
| `\w` | Caminho completo do diretório atual |
| `\W` | Só o último componente do caminho |
| `\t` | Hora atual (HH:MM:SS) |
| `\d` | Data atual |
| `\$` | `$` para usuário, `#` para root |
| `\n` | Nova linha |

Exemplo de prompt com data, hora e quebra de linha:

```terminal
$ export PS1='[\d \t] \u@\h:\w\n\$ '
[Fri Feb 21 11:30:00] deck@steamdeck:~/lab
$ 
```

Para deixar permanente, coloque no `~/.bashrc`:

```bash
export PS1='[\t] \u@\h \[\033[01;32m\]\w\[\033[00m\]\$ '
```

O `\[\033[01;32m\]` é um código ANSI que torna o caminho verde. Pode parecer criptografia alienígena, mas você não precisa decorar — existem geradores online de PS1.

## Os arquivos de configuração

Quando o Bash inicia, ele lê uma hierarquia de arquivos. Saber qual editar evita "colei no lugar errado e não funcionou":

| Arquivo | Quando é lido | Para que serve |
|---|---|---|
| `/etc/profile` | Login de qualquer usuário | Configurações globais do sistema |
| `~/.bash_profile` | Login do Bash (se existir) | Configurações de login pessoais |
| `~/.profile` | Login (fallback se não houver `.bash_profile`) | Compatibilidade com outros shells |
| `~/.bashrc` | Todo shell interativo | Aliases, prompt, funções, variáveis |
| `/etc/bash.bashrc` | Todo shell interativo (antes do `~/.bashrc`) | Configurações globais para todos |

A regra prática: edite `~/.bashrc` para personalizações. Só mexa em `/etc/profile` ou `/etc/bash.bashrc` se souber o que está fazendo — e lembre-se de que, no SteamOS, `/etc` pode ser somente-leitura dependendo do estado do `steamos-readonly`.

## Além do Bash: Fish e Zsh

O Bash não é o único shell disponível. No SteamOS, você pode instalar alternativas via `pacman` (com o sistema em modo gravável) ou via Distrobox:

**Fish (Friendly Interactive SHell)** vem com autocompletar inteligente, syntax highlighting em tempo real e histórico baseado em contexto, sem configuração nenhuma. É o shell "batteries included" — instale e use.

**Zsh** é o meio-termo entre Bash e Fish: mantém compatibilidade com scripts Bash e adiciona autocompletar avançado, correção ortográfica e um ecossistema de plugins chamado Oh My Zsh.

```terminal
$ fish
Welcome to fish, the friendly interactive shell
Type help for instructions
deck@steamdeck ~/lab> echo $SHELL
/usr/bin/fish
deck@steamdeck ~/lab> exit
$ 
```

:::info
O Fish não é compatível com a sintaxe do Bash para scripts. Um script com `#!/bin/bash` continua rodando no Bash, independentemente do shell interativo. Você pode usar Fish como shell diário e escrever scripts em Bash — eles não entram em conflito.
:::

## Resumo

- `alias nome='comando'` cria atalhos; persista no `~/.bashrc`.
- `history` lista comandos passados; `[[Ctrl+R]]` busca reversa incremental; `!!` repete o último.
- `PS1` controla o prompt com códigos como `\u`, `\h`, `\w` e sequências ANSI para cores.
- `~/.bashrc` é o arquivo certo para personalizações do shell interativo.
- Fish e Zsh são alternativas com mais recursos de usabilidade; Fish é plug-and-play.

## Exercícios

1. Crie aliases para `ls -lh` (`ll`), `ls -la` (`la`) e `cd ..` (`..`). Teste cada um e confira com `alias`.
2. Use `[[Ctrl+R]]` para encontrar o último `grep` que você executou. Depois, recupere o último argumento do comando anterior com `!$`.
3. Customize seu `PS1` para mostrar a hora atual, o usuário e o diretório abreviado (`\W`) no formato `[HH:MM] user dir$`. Teste e depois adicione ao `~/.bashrc`.
4. Liste todo o histórico com `history`, filtre por `grep` com `history | grep alias` e repita um comando específico pelo número usando `!N` (substitua N pelo número).
5. **Desafio.** Instale o Fish (`sudo pacman -S fish`, se o sistema estiver gravável, ou via Distrobox), configure-o como shell padrão por 10 minutos com `fish` e compare: o que o Fish acerta que o Bash erra? Depois, escreva uma função em Bash chamada `extract()` que descompacta arquivos `.tar.gz`, `.tar.bz2`, `.zip` e `.7z` detectando a extensão automaticamente. Adicione-a ao `~/.bashrc`.