Antes de copiar, mover ou apagar qualquer arquivo, você precisa saber onde está e o que existe ao redor. Os comandos de navegação são os mais usados do terminal — um usuário típico roda `ls` dezenas de vezes por dia e `cd` quase tantas quanto. São comandos simples, mas cada um acumula flags que transformam a navegação de "olhar uma lista" para "extrair exatamente a informação que importa".

:::objetivos
- Listar arquivos e diretórios com `ls` e suas flags de ordenação e filtro
- Navegar na árvore de diretórios com caminhos absolutos, relativos e atalhos
- Confirmar a localização atual com `pwd`
- Visualizar a hierarquia de diretórios com `tree`
- Compreender a diferença entre `/`, `~`, `.` e `..`
:::

## ls: o comando que você mais vai usar

`ls` lista o conteúdo de um diretório. Sem argumentos, lista o diretório atual. Com um caminho, lista aquele diretório. Com flags, muda o formato e os critérios de exibição.

```terminal
$ ls
Desktop  Documents  Downloads  Music  Pictures  Videos  lab
$ ls -l
total 28
drwxr-xr-x 2 deck deck 4096 Feb 18 14:21 Desktop
drwxr-xr-x 2 deck deck 4096 Feb 18 14:21 Documents
drwxr-xr-x 2 deck deck 4096 Feb 20 09:15 Downloads
drwxr-xr-x 2 deck deck 4096 Feb 18 14:21 Music
drwxr-xr-x 2 deck deck 4096 Feb 18 14:21 Pictures
drwxr-xr-x 2 deck deck 4096 Feb 18 14:21 Videos
drwxr-xr-x 2 deck deck 4096 Feb 21 10:00 lab
```

A flag `-l` ativa o formato longo: permissões, número de links, dono, grupo, tamanho em bytes, data da última modificação e nome. O `d` na primeira coluna indica diretório; `-` indica arquivo comum.

```terminal
$ ls -la
total 72
drwx------ 16 deck deck 4096 Feb 21 10:00 .
drwxr-xr-x  3 root root 4096 Feb 15 18:00 ..
-rw-------  1 deck deck  220 Feb 18 14:21 .bashrc
drwxr-xr-x  2 deck deck 4096 Feb 18 14:21 .config
-rw-r--r--  1 deck deck   42 Feb 19 09:30 .gitconfig
drwxr-xr-x  2 deck deck 4096 Feb 18 14:21 .local
```

Com `-a`, o `ls` revela os arquivos ocultos — aqueles cujo nome começa com `.`. Os dois primeiros, `.` e `..`, são especiais: `.` é o próprio diretório e `..` é o diretório pai. Eles existem em qualquer diretório do sistema e são a base da navegação relativa.

Mais algumas flags que você vai usar com frequência:

```terminal
$ ls -lh
total 28K
drwxr-xr-x 2 deck deck 4,0K Feb 18 14:21 Desktop
drwxr-xr-x 2 deck deck 4,0K Feb 18 14:21 Documents
-rw-r--r-- 1 deck deck  12K Feb 21 10:00 notas.txt
$ ls -lt
total 28
-rw-r--r-- 1 deck deck 12288 Feb 21 10:00 notas.txt
drwxr-xr-x 2 deck deck  4096 Feb 21 10:00 lab
drwxr-xr-x 2 deck deck  4096 Feb 20 09:15 Downloads
drwxr-xr-x 2 deck deck  4096 Feb 18 14:21 Documents
drwxr-xr-x 2 deck deck  4096 Feb 18 14:21 Desktop
```

`-h` (human-readable) converte bytes em K, M ou G. `-t` ordena por data de modificação, do mais recente para o mais antigo. `-r` inverte a ordem.

:::dica
Combine flags: `ls -ltrh` lista tudo em formato longo, ordenado por data com o mais antigo no topo e tamanhos legíveis. É o meu atalho para "o que foi mexido aqui nas últimas horas?".
:::

## cd e a anatomia dos caminhos

`cd` (change directory) muda o diretório atual. Ele aceita tanto caminhos absolutos (que começam com `/`) quanto relativos (que usam `.` e `..`).

```terminal
$ pwd
/home/deck
$ cd /usr/share
$ pwd
/usr/share
$ cd ..
$ pwd
/usr
$ cd ../lib
$ pwd
/lib
$ cd ~
$ pwd
/home/deck
$ cd -
/usr
```

A tabela de atalhos que todo shell entende:

| Atalho | Significado |
|---|---|
| `~` | Diretório home do usuário (`/home/deck`) |
| `.` | Diretório atual (útil para scripts e comandos como `cp`) |
| `..` | Diretório pai (um nível acima) |
| `-` | Diretório anterior (onde você estava antes do último `cd`) |
| `/` | Raiz do sistema de arquivos |

`cd` sem argumentos equivale a `cd ~`: volta para a home. `cd /` vai para a raiz.

:::atencao
No Linux, os caminhos são case-sensitive: `Documents` e `documents` são diretórios diferentes. No Windows, não. Esse é um dos tropeços mais comuns de quem migra.
:::

## pwd: onde estou mesmo?

`pwd` (print working directory) imprime o diretório atual como caminho absoluto. Parece trivial, mas salva vidas em duas situações: quando o prompt está configurado para mostrar só o último componente do caminho, e quando você está dentro de um link simbólico e quer saber o caminho físico real.

```terminal
$ cd /usr/lib
$ pwd
/usr/lib
$ pwd -P
/usr/lib
$ cd /lib
$ pwd
/lib
$ pwd -P
/usr/lib
```

No SteamOS, `/lib` é um link simbólico para `/usr/lib`. `pwd` normal mostra o caminho lógico (o que você usou para chegar); `pwd -P` resolve os links e mostra o caminho físico no disco.

## tree: a hierarquia de uma vez

`tree` não vem instalado no SteamOS, mas você pode instalá-lo — ou melhor, não pode, porque a raiz é imutável. A solução é usar o `find` como substituto, ou instalar via flatpak ou distrobox. Mas como referência, eis o que o `tree` entrega:

```terminal
$ tree ~/lab
/home/deck/lab
├── dados
│   ├── entrada.csv
│   └── saida.csv
├── notas.txt
└── scripts
    └── limpeza.sh

2 directories, 3 files
```

Sem `tree`, você pode improvisar com:

```terminal
$ find ~/lab -maxdepth 2 -not -path '*/\.*' | sort
/home/deck/lab
/home/deck/lab/dados
/home/deck/lab/dados/entrada.csv
/home/deck/lab/dados/saida.csv
/home/deck/lab/notas.txt
/home/deck/lab/scripts
/home/deck/lab/scripts/limpeza.sh
```

`-maxdepth 2` limita a profundidade; `-not -path '*/\.*'` exclui arquivos ocultos. O `sort` garante ordem alfabética.

## Resumo

- `ls` lista arquivos; com `-l`, mostra permissões e metadados; com `-a`, revela arquivos ocultos; com `-lh`, tamanhos em formato humano.
- `cd` navega por caminhos absolutos (`/home/deck/lab`), relativos (`../lab`) ou atalhos (`~`, `-`, `..`).
- `pwd` confirma o diretório atual; `pwd -P` resolve links simbólicos e mostra o caminho físico.
- `tree` (ou `find` como substituto) exibe a hierarquia de diretórios de uma vez.
- Caminhos no Linux são case-sensitive; `Documents` ≠ `documents`.

## Exercícios

1. Execute `ls -la /` e identifique cinco diretórios cuja finalidade você conhece. Leia a descrição de dois que você não conhece usando `man hier` ou uma busca rápida.
2. Navegue até `/usr/share` com `cd`, volte para a home com `cd ~`, depois retorne ao diretório anterior com `cd -`. Quantos comandos `cd` você usou? Qual atalho foi mais rápido?
3. Crie uma estrutura de diretórios em `~/lab` com `mkdir -p ~/lab/a/b/c`, depois liste recursivamente com `find ~/lab -type d | sort`. Quantos níveis de profundidade você criou?
4. Compare a saída de `ls -l` e `ls -lh` no diretório `/boot`. Qual flag mostra o tamanho dos arquivos de forma mais legível?
5. **Desafio.** Use `cd /` e depois `ls -la`. Sem usar `cd`, liste o conteúdo da sua home usando apenas um caminho como argumento para `ls`. Em seguida, use `ls -la ~/..` e explique o que esse comando está listando.