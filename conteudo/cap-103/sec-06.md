Esta seção inicia o bloco de comandos essenciais do dia a dia, focado em arquivos e diretórios. É a base sobre a qual todo o resto se apoia: antes de instalar um app com Flatpak ou depurar um serviço com systemctl, você precisa navegar, copiar, mover e encontrar arquivos. As tabelas seguem o formato cheatsheet, mas cada uma ganha contexto suficiente para que o comando faça sentido.

:::objetivos
- Navegar e inspecionar diretórios com `ls`, `cd` e `pwd`
- Copiar, mover, renomear e remover arquivos com segurança
- Buscar arquivos por nome, tipo e conteúdo com `find` e `grep`
- Ler arquivos de forma incremental com `cat`, `less`, `head` e `tail`
- Compreender a diferença entre `cp -r` destrutivo e preservação de metadados
:::

## Navegação e inspeção

O primeiro contato com qualquer máquina começa por saber onde você está e o que existe.

| Comando | O que faz |
|---|---|
| `pwd` | Mostra o diretório atual (print working directory) |
| `cd ~/lab` | Entra no diretório `lab` dentro do home |
| `cd ..` | Sobe um nível |
| `cd -` | Volta ao diretório anterior |
| `ls` | Lista arquivos (sem ocultos) |
| `ls -la` | Lista tudo, incluindo ocultos, com detalhes |
| `ls -lh` | Tamanhos legíveis (K, M, G) |
| `ls -lt` | Ordena por data de modificação |
| `ls -R` | Lista recursivamente |
| `file arquivo` | Identifica o tipo real do arquivo (magic bytes) |

```terminal
$ ls -lh
total 24K
-rw-r--r-- 1 ana ana  12K dez 13 09:00 relatorio.pdf
-rwxr-xr-x 1 ana ana  1.2K dez 13 08:30 backup.sh
drwxr-xr-x 3 ana ana 4.0K dez 12 21:15 lab
```

A coluna de permissões (`-rw-r--r--`), o dono (`ana ana`), o tamanho (`12K`) e a data revelam muito antes de você abrir qualquer arquivo. O `file` complementa o `ls` identificando o conteúdo real — um `relatorio.pdf` pode ser, na verdade, um script disfarçado.

## Copiar, mover e remover

Estas operações são as mais destrutivas do Linux. O `rm` não tem lixeira — o que ele apaga, apaga para sempre.

| Comando | O que faz |
|---|---|
| `cp origem destino` | Copia um arquivo |
| `cp -r pasta/ destino/` | Copia diretório recursivamente |
| `cp -a pasta/ destino/` | Copia preservando permissões, donos e timestamps |
| `cp -i origem destino` | Pergunta antes de sobrescrever |
| `mv origem destino` | Move ou renomeia |
| `mv -n origem destino` | Não sobrescreve arquivo existente |
| `rm arquivo` | Remove um arquivo |
| `rm -r pasta/` | Remove diretório recursivamente |
| `rm -i arquivo` | Pergunta antes de cada remoção |
| `mkdir -p a/b/c` | Cria diretórios aninhados de uma vez |
| `rmdir pasta` | Remove diretório vazio (seguro) |

```terminal
$ cp backup.sh backup.sh.bak
$ mv backup.sh.bak ~/lab/scripts/
$ rm -i old-report.pdf
rm: remover arquivo comum 'old-report.pdf'? y
```

:::perigo
`rm -rf` é a combinação mais perigosa que existe: recursivo (`-r`) e sem perguntar (`-f`). Um `rm -rf /` ou `rm -rf ~/lab ` (com espaço sobrando) pode apagar o sistema ou a pasta errada. Sempre confira o caminho, e prefira `rm -ri` para operações importantes.
:::

## Buscar arquivos com `find`

O `find` é o canivete suíço da busca por metadados: nome, tamanho, data, tipo, permissão.

| Comando | O que faz |
|---|---|
| `find . -name "*.md"` | Busca por nome (glob) |
| `find . -iname "relatório*"` | Busca por nome ignorando maiúsculas |
| `find . -type f` | Só arquivos regulares |
| `find . -type d` | Só diretórios |
| `find . -size +10M` | Arquivos maiores que 10 MB |
| `find . -mtime -7` | Modificados nos últimos 7 dias |
| `find . -mtime +30` | Modificados há mais de 30 dias |
| `find . -user ana` | Arquivos de um usuário |
| `find . -perm 644` | Arquivos com permissão exata |
| `find . -empty` | Arquivos e diretórios vazios |

```terminal
$ find . -type f -name "*.log" -mtime +7 -ls
  129021     8 -rw-r--r--   1 ana  ana  7440 dez  5 10:11 ./velho.log
```

O `-ls` no final faz o `find` imprimir no formato do `ls`, poupando um `| xargs ls`. A busca retorna apenas `velho.log`, o único `.log` com mais de 7 dias.

:::dica
Combine `find` com `-exec` para agir sobre os resultados: `find . -name "*.tmp" -exec rm {} \;` remove todos os `.tmp` encontrados. O `{}` é substituído pelo caminho de cada arquivo, e `\;` encerra o comando.
:::

## Buscar conteúdo com `grep`

O `find` localiza por metadados; o `grep` localiza **dentro** dos arquivos, por conteúdo.

| Comando | O que faz |
|---|---|
| `grep "erro" arquivo.log` | Busca uma string literal |
| `grep -i "error" *.log` | Ignora maiúsculas |
| `grep -r "flathub" ~/lab/` | Busca recursivamente num diretório |
| `grep -n "erro" arquivo.log` | Mostra o número da linha |
| `grep -v "debug" arquivo.log` | Inverte: mostra tudo exceto as linhas com "debug" |
| `grep -c "error" arquivo.log` | Conta ocorrências |
| `grep -E "erro|falha|crash" arquivo.log` | Expressão regular (alternância) |
| `grep -w "ana" arquivo` | Palavra inteira (não "banana") |
| `grep -A 3 -B 1 "error" arquivo.log` | Mostra contexto: 3 linhas depois, 1 antes |

```terminal
$ grep -n -A 2 "Failed" /var/log/pacman.log
14:error: Failed to commit transaction
15-conflicting files:
16-opt/steam/foo: exists in filesystem
```

O `-n` localiza a linha exata (14), e o `-A 2` mostra as duas linhas seguintes, que explicam a causa do erro de commit. Sem contexto, a mensagem isolada é enigmática.

## Ler arquivos de forma incremental

Nem todo arquivo merece ser aberto inteiro. Para logs e configs grandes, a leitura seletiva é o caminho.

| Comando | O que faz |
|---|---|
| `cat arquivo` | Despeja tudo de uma vez |
| `less arquivo` | Paginador interativo (setas, `/busca`, `q` para sair) |
| `head -20 arquivo` | Primeiras 20 linhas |
| `tail -20 arquivo` | Últimas 20 linhas |
| `tail -f arquivo` | Acompanha em tempo real (Ctrl+C para sair) |
| `wc -l arquivo` | Conta linhas |
| `wc -w arquivo` | Conta palavras |
| `nl arquivo` | Numera as linhas |

```terminal
$ tail -f ~/lab/app.log
[09:41:00] INFO  conexão estabelecida
[09:41:03] INFO  dados enviados (128 KB)
[09:41:05] ERROR timeout ao receber resposta
```

O `tail -f` mantém o arquivo aberto e imprime cada linha nova conforme ela é gravada — a ferramenta certa para observar um processo gravando log ao vivo, em paralelo ao `journalctl -f` da seção anterior.

## Resumo

- `ls -lh` e `file` revelam tipo, tamanho e permissões antes de abrir qualquer arquivo
- `cp -a` preserva metadados; `mv` renomeia; `rm` não tem lixeira
- `find` busca por nome, tipo, tamanho, data e permissão; `-exec` age sobre os resultados
- `grep -r -n -E` busca conteúdo com contexto de linha e expressões regulares
- `less`, `head`, `tail -f` e `wc` permitem leitura seletiva de arquivos grandes

## Exercícios

1. Liste o diretório atual com `ls -la` e identifique pelo menos um arquivo oculto. Explique o que cada campo da coluna de permissões significa.
2. Crie uma estrutura de diretórios aninhada com `mkdir -p lab/a/b/c`, copie um arquivo para o nível mais fundo com `cp -a` e compare o timestamp do original com o da cópia.
3. Use `find` para localizar todos os arquivos `.log` com mais de 7 dias no seu home, e em seguida remova apenas os vazios (`find ... -empty -delete`).
4. No diretório de logs, use `grep -rn "error" .` ignorando maiúsculas/minúsculas e mostrando contexto de uma linha após cada ocorrência.
5. **Desafio.** Combine as ferramentas: encontre todos os arquivos com mais de 10 MB (`find -size +10M`), e para cada um desses, use `tail -n 5` sobre os que forem `.log` para ver o final — tudo num único pipeline.