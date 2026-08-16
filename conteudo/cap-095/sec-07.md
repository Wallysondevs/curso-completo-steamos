O Steam Deck vem com o usuário `deck` configurado para usar `sudo` — ele pode elevar privilégios para root digitando a própria senha. Isso é conveniente, mas cria um risco que não existiria se a Valve tivesse escondido o root completamente: comandos com `sudo` ignoram o sistema imutável, ignoram permissões de arquivo e executam com poder total sobre a máquina. Esta seção explica o modelo de permissões do Linux, o que o `sudo` realmente faz e — mais importante — quais comandos você **nunca** deve rodar com ele.

:::objetivos
- Ler e interpretar permissões de arquivo com `ls -l`
- Modificar permissões com `chmod` e entender a notação octal e simbólica
- Compreender o modelo de usuário/root do SteamOS e o papel do `sudo`
- Identificar comandos que nunca devem ser executados com `sudo`
- Conhecer o comando `sudo -k` e o cache de credenciais
:::

## O modelo de permissões em 30 segundos

Todo arquivo no Linux tem três conjuntos de permissões: dono (user), grupo (group) e outros (others). Cada conjunto pode ter leitura (`r`), escrita (`w`) e execução (`x`).

```terminal
$ ls -l ~/.bashrc
-rw-r--r-- 1 deck deck 220 Feb 18 14:21 /home/deck/.bashrc
```

Lendo da esquerda para a direita:

| Trecho | Significado |
|---|---|
| `-` | Arquivo comum (`d` seria diretório, `l` seria link) |
| `rw-` | Dono (`deck`) pode ler e escrever, não executar |
| `r--` | Grupo (`deck`) pode ler, não escrever nem executar |
| `r--` | Outros (qualquer usuário) podem ler, não escrever nem executar |
| `deck deck` | Dono = `deck`, grupo = `deck` |

Para arquivos executáveis, o `x` aparece:

```terminal
$ ls -l /usr/bin/ls
-rwxr-xr-x 1 root root 142144 Sep  5  2024 /usr/bin/ls
```

Aqui o dono é `root` e o arquivo é executável por todos. Para diretórios, o `x` significa "permissão de entrar" (atravessar), não "executar":

```terminal
$ ls -ld ~/Documents
drwxr-xr-x 2 deck deck 4096 Feb 18 14:21 /home/deck/Documents
```

## chmod: mudando permissões

`chmod` altera permissões. Existem duas sintaxes: simbólica (mais legível) e octal (mais rápida para quem já decorou).

**Simbólica:** `chmod [quem][+/-/=][o quê]`. `u` = user (dono), `g` = group, `o` = others, `a` = all.

```terminal
$ echo "#!/bin/bash\necho oi" > script.sh
$ ls -l script.sh
-rw-r--r-- 1 deck deck 22 Feb 21 11:00 script.sh
$ chmod u+x script.sh
$ ls -l script.sh
-rwxr--r-- 1 deck deck 22 Feb 21 11:00 script.sh
$ ./script.sh
oi
```

**Octal:** cada dígito é a soma de `r=4`, `w=2`, `x=1`.

```terminal
$ chmod 755 script.sh
$ ls -l script.sh
-rwxr-xr-x 1 deck deck 22 Feb 21 11:00 script.sh
```

| Octal | Simbólico | Significado |
|---|---|---|
| `755` | `rwxr-xr-x` | Dono pode tudo; grupo e outros só leem e executam |
| `644` | `rw-r--r--` | Dono lê e escreve; outros só leem |
| `600` | `rw-------` | Só o dono lê e escreve (ideal para chaves SSH) |
| `700` | `rwx------` | Só o dono pode tudo (ideal para diretórios privados) |

:::dica
`chmod 600 ~/.ssh/id_rsa` é o mantra de todo tutorial de SSH. Uma chave privada com permissão `644` (legível por outros) é recusada pelo `ssh`. O erro `Permissions 0644 for '~/.ssh/id_rsa' are too open` é exatamente essa verificação de segurança.
:::

## O que o sudo realmente faz

`sudo` (superuser do) executa um comando como outro usuário — tipicamente root. Não é "dar permissão de root para o comando", é "rodar o comando **como se você fosse root**".

```terminal
$ whoami
deck
$ sudo whoami
[sudo] password for deck: 
root
```

Quando você usa `sudo` pela primeira vez numa sessão, ele pede sua senha. Depois, um **cache de credenciais** mantém a autenticação por 15 minutos (padrão). Durante esse tempo, novos `sudo` não pedem senha — e é aí que mora o perigo: você pode digitar `sudo` na frente de um comando destrutivo sem a fricção da senha.

```terminal
$ sudo -k
$ sudo whoami
[sudo] password for deck: 
root
```

`sudo -k` invalida o cache imediatamente. Crie o hábito de rodar `sudo -k` depois de terminar uma sessão de administração.

:::perigo
O cache do `sudo` é por sessão de terminal, não por comando. Se você autenticou no Konsole aba 1, a aba 2 também tem o cache válido. Se alguém — ou um script malicioso — rodar `sudo rm -rf /home` nessa janela, não haverá pedido de senha.
:::

## Comandos que NUNCA devem levar sudo

A regra de ouro: se você não entende exatamente o que o comando faz, não coloque `sudo` na frente. Abaixo, a lista negra:

**`sudo rm -rf /` ou `sudo rm -rf /*`** — Apaga o sistema de arquivos inteiro. O SteamOS imutável protege parte do sistema, mas `/home`, `/var` e discos montados seriam destruídos.

**`sudo chmod -R 777 /`** — Torna todos os arquivos do sistema legíveis, graváveis e executáveis por qualquer usuário. O sistema não volta a funcionar depois disso.

**`sudo chown -R usuario:grupo /`** — Transfere a posse de todos os arquivos para um usuário. Serviços param de funcionar porque perdem acesso aos seus próprios arquivos.

**`sudo dd if=arquivo of=/dev/nvme0n1`** — Sobrescreve o disco inteiro, tabela de partições incluída. É um dos poucos comandos que destrói até o esquema A/B.

**`sudo pacman -Syu` seguido de `reboot` sem verificar conflitos** — No SteamOS, o `pacman` pode instalar pacotes que conflitam com a imagem do sistema. Na próxima atualização da Valve, o sistema pode ficar inconsistente.

**`sudo steamos-readonly disable` e esquecer de reabilitar** — Não é destrutivo imediatamente, mas deixa o sistema vulnerável por tempo indefinido.

```terminal
$ sudo rm -rf /home/deck/lab   ← destrutivo mas localizado
$ sudo rm -rf /                ← destrutivo e total
```

A diferença entre os dois é um caminho. Antes de todo `sudo rm -rf`, respire fundo e releia o caminho três vezes.

## chown: mudando dono e grupo

`chown` transfere a posse de um arquivo. É um comando restrito ao root — você não pode "dar" um arquivo para outro usuário sendo um usuário comum.

```terminal
$ sudo chown deck:deck arquivo.txt
$ ls -l arquivo.txt
-rw-r--r-- 1 deck deck 22 Feb 21 11:00 arquivo.txt
$ sudo chown -R deck:deck ~/lab/projeto
$ ls -ld ~/lab/projeto
drwxr-xr-x 3 deck deck 4096 Feb 21 11:00 /home/deck/lab/projeto
```

A flag `-R` aplica recursivamente a todo o conteúdo do diretório. Use com cautela: `sudo chown -R root:root /home/deck` transformaria sua home em propriedade do root e você perderia acesso aos seus próprios arquivos.

## Resumo

- Permissões são `rwx` para dono, grupo e outros; `ls -l` mostra o octeto completo.
- `chmod` altera permissões; `755` (rwxr-xr-x) é o padrão para executáveis, `644` (rw-r--r--) para arquivos, `600` (rw-------) para chaves.
- `sudo` executa comandos como root; o cache dura 15 minutos; `sudo -k` invalida.
- Nunca use `sudo` com `rm -rf /`, `chmod -R 777 /`, `chown -R /`, `dd` sobre o disco ou `pacman` sem entender as consequências.
- `chown` muda o dono do arquivo e requer root; `-R` aplica recursivamente.

## Exercícios

1. Liste os arquivos do `/usr/bin` que começam com `s` e têm permissão `rwsr-xr-x` (setuid) usando `ls -l /usr/bin/s* | grep rws`. O que o `s` no lugar do `x` do dono significa?
2. Crie um script `~/lab/secreto.sh` com `echo "#!/bin/bash\necho segredo" > ~/lab/secreto.sh`. Torne-o executável só para você com `chmod 700`. Verifique com `ls -l`.
3. Teste o cache do `sudo`: rode `sudo whoami`, depois `sudo -k` e `sudo whoami` novamente. O segundo pediu senha? Explique por que.
4. Crie um arquivo `~/lab/compartilhado.txt`, mude o grupo para `wheel` com `sudo chown deck:wheel compartilhado.txt` e dê permissão de escrita para o grupo com `chmod 664`. Peça para outro usuário (se houver) tentar editar o arquivo.
5. **Desafio.** Execute `ls -l /etc/shadow` e explique por que esse arquivo pertence ao root e tem permissão `640` ou `600`. Depois, pesquise o que aconteceria se alguém rodasse `sudo chmod 644 /etc/shadow` — quais seriam as consequências de segurança?