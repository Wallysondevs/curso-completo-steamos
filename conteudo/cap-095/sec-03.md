Navegar é meio caminho; manipular arquivos é a outra metade. Criar, copiar, mover e remover são as quatro operações que transformam um diretório vazio em um projeto organizado. No terminal, cada uma dessas operações tem um comando próprio com sintaxe enxuta — mas também com arestas que, ignoradas, levam à perda de dados. Esta seção cobre o básico com a profundidade que evita arrependimentos.

:::objetivos
- Criar arquivos vazios e diretórios com `touch` e `mkdir`
- Copiar arquivos e diretórios inteiros com `cp` e suas flags essenciais
- Mover e renomear com `mv`
- Remover arquivos e diretórios com `rm` e `rmdir`
- Entender quando cada operação é destrutiva e como se proteger
:::

## mkdir e touch: criando o que ainda não existe

`mkdir` (make directory) cria diretórios. Sem flags, cria um nível por vez. Com `-p`, cria toda a cadeia de uma vez — e não reclama se algum diretório já existir.

```terminal
$ cd ~/lab
$ mkdir projeto
$ ls -l
total 4
drwxr-xr-x 2 deck deck 4096 Feb 21 10:30 projeto
$ mkdir -p projeto/src/components
$ ls -R projeto
projeto:
src

projeto/src:
components
```

`-p` é a flag que torna `mkdir` prático: você declara a intenção final e ele resolve os intermediários. Já `touch` não cria diretórios — ele cria arquivos vazios ou atualiza a data de modificação de arquivos que já existem.

```terminal
$ touch README.md
$ ls -l README.md
-rw-r--r-- 1 deck deck 0 Feb 21 10:31 README.md
$ touch README.md
$ ls -l README.md
-rw-r--r-- 1 deck deck 0 Feb 21 10:32 README.md
```

Repare: o segundo `touch` não criou outro arquivo — ele só atualizou o timestamp. Isso é útil para forçar a recompilação de um projeto ou marcar que um arquivo foi revisado.

## cp: copiar sem surpresas

`cp` (copy) duplica arquivos. A sintaxe é `cp origem destino`. Se o destino for um diretório existente, o arquivo é copiado para dentro dele com o mesmo nome. Se for um caminho com nome de arquivo, a cópia ganha esse novo nome.

```terminal
$ cp README.md README.bak
$ ls -l README*
-rw-r--r-- 1 deck deck 0 Feb 21 10:31 README.bak
-rw-r--r-- 1 deck deck 0 Feb 21 10:32 README.md
$ mkdir backups
$ cp README.md backups/
$ ls -l backups/
total 0
-rw-r--r-- 1 deck deck 0 Feb 21 10:33 README.md
```

Para copiar diretórios inteiros, `cp -r` (recursivo):

```terminal
$ cp -r projeto projeto-backup
$ ls -R projeto-backup
projeto-backup:
src

projeto-backup/src:
components
```

:::atencao
`cp` sem `-r` em um diretório falha com `cp: -r not specified; omitting directory`. Isso é uma proteção — copiar uma árvore exige que você declare explicitamente que quer recursão. Não tente forçar com `*`; use `-r` ou `-a`.
:::

A flag `-a` (archive) vai além de `-r`: preserva permissões, timestamps, dono e grupo. É a escolha certa para backups:

```terminal
$ cp -a ~/lab ~/lab-backup-$(date +%Y%m%d)
$ ls -ld ~/lab-backup-20250221
drwxr-xr-x 4 deck deck 4096 Feb 21 10:30 /home/deck/lab-backup-20250221
```

## mv: mover é renomear

No Linux, mover e renomear são a mesma operação. O sistema de arquivos trata ambos como "mudar o ponteiro do nome", sem tocar nos dados. `mv` também serve para mover arquivos entre diretórios.

```terminal
$ mv README.bak README-v2.md
$ ls README*
README.md  README-v2.md
$ mv README-v2.md backups/
$ ls backups/
README.md  README-v2.md
```

Mover um arquivo para um diretório que já contém um arquivo com o mesmo nome **sobrescreve** o destino sem aviso. Para evitar desastres, use `mv -i` (interativo), que pergunta antes de sobrescrever:

```terminal
$ echo "versao 1" > a.txt
$ echo "versao 2" > b.txt
$ mv -i a.txt b.txt
mv: overwrite 'b.txt'? n
$ ls a.txt b.txt
a.txt  b.txt
```

:::dica
Para quem prefere segurança máxima, `alias mv='mv -i'` no `.bashrc` torna o comportamento interativo o padrão. A desvantagem é que scripts e movimentações em lote param para pedir confirmação.
:::

## rm: o comando que não tem lixeira

`rm` (remove) apaga arquivos. E "apaga" significa **apaga mesmo** — não vai para a Lixeira do KDE, não tem `undelete`, não tem undo. O arquivo some do sistema de arquivos e, em SSD com TRIM ativado, a recuperação é praticamente impossível.

```terminal
$ touch temporario.txt
$ ls temporario.txt
temporario.txt
$ rm temporario.txt
$ ls temporario.txt
ls: cannot access 'temporario.txt': No such file or directory
```

Para diretórios, `rm -r` (recursivo). Para forçar sem confirmação, `rm -f`. O combo `rm -rf` é o mais perigoso do sistema:

```terminal
$ rm -rf ~/lab/projeto-backup
$ ls ~/lab/projeto-backup
ls: cannot access '/home/deck/lab/projeto-backup': No such file or directory
```

:::perigo
**Nunca, em hipótese alguma, digite `sudo rm -rf /` ou `sudo rm -rf /*`.** O primeiro apaga o sistema inteiro (incluindo discos montados, se não houver proteção). O segundo faz o mesmo. Nem mesmo com `--no-preserve-root` você deve testar isso. Se alguém sugerir esse comando num fórum como "solução", essa pessoa está fazendo uma piada destrutiva. No SteamOS, o sistema imutável oferece alguma proteção, mas os diretórios montados como `overlay` e os discos externos seriam destruídos.
:::

`rmdir` só remove diretórios vazios — e por isso mesmo é seguro contra acidentes:

```terminal
$ mkdir vazio
$ rmdir vazio
$ ls vazio
ls: cannot access 'vazio': No such file or directory
$ mkdir -p cheio/sub
$ rmdir cheio
rmdir: failed to remove 'cheio': Directory not empty
```

## Resumo

- `mkdir` cria diretórios; `mkdir -p` cria toda a cadeia de uma vez.
- `touch` cria arquivos vazios ou atualiza o timestamp de arquivos existentes.
- `cp` copia arquivos; `cp -r` copia diretórios; `cp -a` preserva metadados para backups.
- `mv` move e renomeia; com `-i`, pede confirmação antes de sobrescrever.
- `rm` remove permanentemente (sem lixeira); `rm -rf` é destrutivo e irreversível.
- `rmdir` remove diretórios vazios e falha se houver conteúdo — é o seguro por padrão.

## Exercícios

1. Crie a estrutura `~/lab/projeto/src/utils/` com um único comando `mkdir`. Depois crie um arquivo vazio `helpers.sh` dentro de `utils/` com `touch`.
2. Copie o diretório `utils/` para `utils-backup/` preservando timestamps. Use `ls -l` para comparar as datas.
3. Mova `helpers.sh` de `utils-backup/` para `~/lab/projeto/` renomeando-o para `lib.sh` — tudo num único comando `mv`.
4. Crie um diretório chamado `lixo` com três arquivos vazios dentro. Remova o diretório inteiro com `rm -r`. Depois tente recriar e remover com `rmdir`. O que acontece?
5. **Desafio.** Pesquise a diferença entre `cp -r` e `cp -a` copiando um arquivo com permissão de execução (`chmod +x script.sh`). Qual flag preserva a permissão? Depois, explique por que `rm -rf ~/lab` é perigoso, mas `rm -rf ~/lab/` (com barra no final) é ainda mais — e como a expansão de variáveis como `rm -rf $VAZIA/lab` pode se transformar em `rm -rf /lab`.