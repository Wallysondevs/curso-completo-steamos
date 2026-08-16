Todo processo tem um ambiente: um dicionário de `CHAVE=VALOR` que o shell passa para os programas que executa. Variáveis como `HOME`, `PATH` e `USER` determinam onde seus arquivos ficam, quais comandos estão disponíveis e como os programas se comportam. No SteamOS, entender variáveis de ambiente é especialmente relevante porque o Modo Jogo e o Modo Desktop herdam ambientes diferentes — e bugs sutis nascem dessa diferença.

:::objetivos
- Listar todas as variáveis de ambiente com `env` e `printenv`
- Ler, criar e remover variáveis no shell
- Entender o `PATH` e como o shell encontra comandos
- Diferenciar variáveis de shell (locais) de variáveis de ambiente (exportadas)
- Persistir variáveis nos arquivos de configuração do Bash
:::

## Lendo o ambiente

O comando `env` imprime todas as variáveis de ambiente do processo atual — tipicamente entre 40 e 80 entradas.

```terminal
$ env | head -10
HOME=/home/deck
USER=deck
SHELL=/bin/bash
PATH=/usr/local/bin:/usr/bin:/bin:/opt/bin
LANG=en_US.UTF-8
PWD=/home/deck
LOGNAME=deck
XDG_SESSION_TYPE=wayland
TERM=xterm-256color
DISPLAY=:0
```

`printenv` faz o mesmo, mas permite consultar uma variável específica sem `grep`:

```terminal
$ printenv HOME
/home/deck
$ printenv NONEXISTENT
$ echo $?
1
```

O código de saída `1` (acessível via `$?` — falaremos mais na seção 8) indica que a variável não existe. `echo $HOME` também funciona, mas `printenv` é mais explícito e não confunde variável de shell com variável de ambiente.

## Criando, exportando e destruindo

Uma variável local do shell só existe na sessão atual e não é herdada por processos filhos. Uma variável de ambiente (exportada) é passada para todo comando que você executar.

```terminal
$ MEU_NOME="ana"
$ echo $MEU_NOME
ana
$ bash -c 'echo $MEU_NOME'
           ← vazio!
$ export MEU_NOME="ana"
$ bash -c 'echo $MEU_NOME'
ana
```

O `bash -c` inicia um shell filho e executa o comando entre aspas. Sem `export`, o filho não enxerga a variável. Com `export`, enxerga. Essa distinção é a fonte de metade dos bugs em scripts de shell.

```terminal
$ export MEU_NOME="ana"
$ echo $MEU_NOME
ana
$ unset MEU_NOME
$ echo $MEU_NOME
           ← vazio
$ printenv MEU_NOME
$ echo $?
1
```

`unset` remove a variável tanto do ambiente quanto do shell local. Não tem undo.

:::dica
Para adicionar um diretório ao `PATH` temporariamente: `export PATH="$PATH:/home/deck/bin"`. Para tornar permanente, coloque isso no `~/.bashrc`. Mas **nunca** faça `export PATH="~/bin:$PATH"` — o `~` dentro de aspas duplas não expande, e você vai quebrar seu PATH. Use `$HOME` ou o caminho absoluto.
:::

## PATH: como o shell encontra comandos

Quando você digita `ls`, o shell não procura em todo o disco — ele consulta a variável `PATH`, que contém uma lista de diretórios separados por `:`. O primeiro diretório que contiver um executável com o nome `ls` ganha.

```terminal
$ echo $PATH
/usr/local/bin:/usr/bin:/bin:/opt/bin
$ which ls
/usr/bin/ls
$ which which
/usr/bin/which
```

`which` (ou `command -v`, que é mais portável) mostra qual executável seria invocado. Se o comando não estiver em nenhum diretório do `PATH`, você precisa usar o caminho completo:

```terminal
$ which meu-script
$ /home/deck/bin/meu-script
Olá, SteamOS!
$ cd ~/bin && ./meu-script
Olá, SteamOS!
```

O `./` antes do nome do script é obrigatório por segurança: o shell nunca procura executáveis no diretório atual a menos que você explicite. Isso impede que um script malicioso chamado `ls` no seu diretório atual sequestre o comando.

:::atencao
Colocar `.` no `PATH` (`export PATH=".:$PATH"`) é uma prática perigosa. Permite que qualquer script no diretório atual sobrescreva comandos do sistema. Um atacante poderia colocar um arquivo chamado `sudo` no `/tmp` e esperar você executá-lo.
:::

## Variáveis que todo Steam Deck usa

Algumas variáveis são específicas do SteamOS e controlam o comportamento do Modo Jogo e do Proton:

```terminal
$ printenv | grep -i steam
STEAM_COMPAT_MOUNTS=/run/media/mmcblk0p1
STEAM_RUNTIME=/home/deck/.local/share/Steam/ubuntu12_32/steam-runtime
$ printenv | grep -i display
WAYLAND_DISPLAY=wayland-0
DISPLAY=:0
```

`STEAM_COMPAT_MOUNTS` informa ao Proton onde montar unidades externas. `WAYLAND_DISPLAY` e `DISPLAY` indicam que a sessão gráfica está rodando no Wayland com camada de compatibilidade X11.

## Persistindo variáveis

Variáveis definidas no terminal morrem com o terminal. Para persistir, você precisa adicioná-las aos arquivos de inicialização do shell:

```terminal
$ echo 'export EDITOR=nano' >> ~/.bashrc
$ source ~/.bashrc
$ echo $EDITOR
nano
```

O arquivo `~/.bashrc` é executado a cada shell interativo aberto. `~/.profile` (ou `~/.bash_profile`, se existir) é executado uma vez no login. A distinção importa:

| Arquivo | Quando executa |
|---|---|
| `~/.bashrc` | Todo shell interativo novo (cada aba do Konsole) |
| `~/.profile` | Uma vez, no login gráfico ou TTY |
| `~/.bash_profile` | Se existir, substitui `~/.profile` para o Bash |

:::info
No SteamOS, por padrão, `~/.bash_profile` não existe e `~/.profile` é enxuto. A maior parte da configuração do shell fica em `~/.bashrc`, que é o lugar certo para `export`, `alias` e customizações do prompt.
:::

## Resumo

- `env` e `printenv` listam variáveis de ambiente; `echo $VAR` lê uma variável específica.
- `export VAR=valor` torna a variável visível para processos filhos; sem `export`, ela é local do shell.
- `PATH` lista diretórios onde o shell procura executáveis; `which` revela qual caminho resolve primeiro.
- `./script` é obrigatório para executar algo no diretório atual; `.` no `PATH` é perigoso.
- Variáveis persistem em `~/.bashrc` (shell interativo) e `~/.profile` (login).

## Exercícios

1. Execute `env | sort > /tmp/ambiente.txt` e conte quantas variáveis existem com `wc -l /tmp/ambiente.txt`.
2. Crie uma variável local `TESTE_LOCAL=ola`, verifique com `echo` e depois tente lê-la de um subshell com `bash -c 'echo $TESTE_LOCAL'`. Exporte-a e repita o teste.
3. Descubra onde está o comando `python` com `which python` e `command -v python`. Se não existir, tente `python3`. Em qual diretório do `PATH` ele está?
4. Adicione um diretório `~/bin` ao `PATH` editando `~/.bashrc` e recarregue com `source ~/.bashrc`. Crie um script simples em `~/bin/hello` com `#!/bin/bash` e `echo "funcionou"`, torne-o executável com `chmod +x` e rode `hello` de qualquer diretório.
5. **Desafio.** Abra o Modo Jogo e volte ao Modo Desktop. Execute `env` e compare com a saída que você salvou em `/tmp/ambiente.txt`. Quais variáveis mudaram? Identifique pelo menos uma que só existe no Modo Desktop e uma que reflete o estado do hardware.