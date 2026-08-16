Todo arquivo no Linux tem um dono, um grupo e nove bits de permissão que controlam leitura, escrita e execução. Parece básico — e é —, mas o SteamOS adiciona uma camada sutil: o modo *read-only* da raiz e o fato de o `deck` ser o único usuário humano da máquina fazem com que muitos tutoriais ignorem permissões, até que um script quebra ou um processo systemd se recusa a ler um arquivo. Esta seção cobre o modelo clássico e o umask, o mecanismo que define a permissão de arquivos novos.

:::objetivos
- Entender os bits `rwx` e as representações octal e simbólica
- Calcular permissões resultantes a partir do umask
- Corrigir permissões de serviços systemd de usuário
- Usar ACLs para permissões extras sem bagunçar o grupo
- Diagnosticar erros `Permission denied` com `stat` e `namei`
:::

## Os nove bits e a tríade dono-grupo-outros

Execute `ls -l` e leia a primeira coluna:

```terminal
$ ls -l ~/lab/script.sh
-rwxr-xr-x 1 deck deck 184 Jan 12 09:30 /home/deck/lab/script.sh
```

A string `-rwxr-xr-x` tem 10 caracteres. O primeiro (`-`) indica o tipo: `-` é arquivo comum, `d` diretório, `l` link simbólico. Os nove seguintes são três tríades: dono (`rwx`), grupo (`r-x`) e outros (`r-x`).

Cada tríade: `r` (read), `w` (write), `x` (execute). O valor octal é a soma: `r=4`, `w=2`, `x=1`. Então `rwx` é 7, `r-x` é 5, e `-rwxr-xr-x` é `0755` em octal.

```terminal
$ stat -c '%a %n' ~/lab/script.sh
755 /home/deck/lab/script.sh
```

Para diretórios, o bit `x` não significa "executar como programa", mas "atravessar" — listar o conteúdo (`r`) e entrar no diretório (`x`) são permissões separadas. Um diretório `r--` permite ver nomes de arquivos, mas não acessá-los; um diretório `--x` permite entrar nele se você souber o nome do arquivo, mas não listar.

```terminal
$ chmod 700 ~/lab/secreto
$ ls -ld ~/lab/secreto
drwx------ 2 deck deck 4096 Jan 12 10:00 /home/deck/lab/secreto
$ chmod 744 ~/lab/secreto
$ chmod go-rwx ~/lab/secreto
```

Os dois últimos comandos produzem o mesmo resultado. A forma simbólica (`go-rwx`) é mais legível para scripts; a octal (`700`) é mais concisa para comandos rápidos.

## O umask: por que arquivos novos já nascem 644

Quando um programa cria um arquivo, ele pede ao kernel uma permissão base (tipicamente `0666` para arquivos e `0777` para diretórios). O kernel subtrai o `umask` antes de gravar. O `umask` padrão no SteamOS é `0022`:

```terminal
$ umask
0022
```

Arquivos nascem com `0666 - 0022 = 0644` (`rw-r--r--`). Diretórios nascem com `0777 - 0022 = 0755` (`rwxr-xr-x`). A subtração é bit a bit, seguindo a lógica `permissão_pedida & ~umask`.

```terminal
$ umask 0077
$ touch teste-privado
$ ls -l teste-privado
-rw------- 1 deck deck 0 Jan 12 10:05 teste-privado
$ stat -c '%a' teste-privado
600
```

`umask 0077` removeu todas as permissões de grupo e outros. Esse é o umask mais restritivo comum para cenários de servidor. Para restaurar o padrão: `umask 0022`.

:::atencao
O `umask` é por processo e herdado pelo shell. Se você definir `umask 0077` no terminal, sub-shells e programas lançados dali herdam o valor. Para torná-lo permanente, escreva `umask 0077` no `~/.bashrc`, mas saiba que o SteamOS prefere `0022` por padrão — um desvio pode quebrar ferramentas que esperam que arquivos sejam legíveis por grupo.
:::

## Caso real: systemd de usuário com permissão errada

Serviços `systemd --user` (`.service` em `~/.config/systemd/user/`) leem arquivos como o `deck`. Se você criar um script que um timer chama, e esse script tiver permissão `600` com `root` como dono, o systemd do `deck` não o executa:

```terminal
$ systemctl --user start meu-script.service
Job for meu-script.service failed because the control process exited with error code.
$ systemctl --user status meu-script.service | tail -5
... /home/deck/scripts/backup.sh: Permission denied
```

A correção é ajustar dono e permissão:

```terminal
$ sudo chown deck:deck ~/scripts/backup.sh
$ chmod 755 ~/scripts/backup.sh
```

O `chown` troca o dono (antes de `:` ) e o grupo (depois). Se o grupo for omitido (`chown deck`), ele não muda. Para recursivo: `chown -R deck:deck ~/scripts`.

## ACLs: quando dono-grupo-outros não basta

O modelo clássico de três níveis (dono, grupo, outros) não resolve "o grupo A pode ler, o grupo B pode escrever e a usuária `maria` tem acesso total". ACLs (Access Control Lists) estendem permissões:

```terminal
$ getfacl ~/lab/compartilhado
# file: compartilhado
# owner: deck
# group: deck
user::rw-
group::r--
other::r--

$ setfacl -m u:ana:rw ~/lab/compartilhado
$ setfacl -m g:projeto:r ~/lab/compartilhado
$ getfacl ~/lab/compartilhado
...
user:ana:rw-
group:projeto:r--
```

O `ls -l` mostra um `+` no final das permissões quando há ACLs estendidas:

```terminal
$ ls -l ~/lab/compartilhado
-rw-rw-r--+ 1 deck deck 0 Jan 12 10:10 compartilhado
```

Para remover: `setfacl -x u:ana ~/lab/compartilhado`. Para zerar todas as ACLs extras: `setfacl -b`.

:::info
O SteamOS, por ser derivado do Debian, monta sistemas de arquivos ext4 e Btrfs com suporte a ACLs habilitado por padrão (opção `acl`). Em sistemas de arquivos montados via `mount -o noacl`, os comandos `setfacl` e `getfacl` falham com `Operation not supported`.
:::

## Diagnosticando Permission denied

Quando um comando falha com `Permission denied`, o caminho mais rápido é o `namei -l`:

```terminal
$ namei -l /home/deck/lab/secreto/notas.txt
f: /home/deck/lab/secreto/notas.txt
drwxr-xr-x root root /
drwxr-xr-x root root home
drwx------ deck deck deck
drwxr-xr-x deck deck lab
drwx------ deck deck secreto
-rw-r--r-- deck deck notas.txt
```

O `namei` percorre cada componente do caminho, listando permissões e dono. Se um componente nega acesso ao `deck`, a linha aparece e o diagnóstico é imediato — nesse exemplo, `secreto` tem modo `700` e só o dono `deck` entra, então está correto para o `deck`, mas qualquer outro usuário quebraria ali.

## Resumo

- Permissões são dono-grupo-outros com três bits cada: `r` (4), `w` (2), `x` (1).
- O `umask` subtrai permissões na criação: `0666 - 0022 = 0644` para arquivos e `0777 - 0022 = 0755` para diretórios.
- `chmod` ajusta permissões (octal ou simbólico); `chown` troca dono e grupo.
- ACLs (`setfacl`/`getfacl`) estendem o modelo clássico para permissões por usuário e grupo específicos.
- `namei -l` percorre o caminho e aponta exatamente qual diretório ou arquivo está negando acesso.
- Serviços systemd de usuário rodam como `deck` — arquivos que eles acessam precisam ter permissão compatível.

## Exercícios

1. Crie um arquivo, altere seu umask para `0077`, crie outro arquivo e compare as permissões dos dois com `stat -c '%a %n'`.
2. Crie um diretório `700` e um arquivo dentro dele. Tente ler esse arquivo com outro usuário (ou com `sudo -u nobody cat`). Explique a diferença entre permissão `r` no arquivo e `x` no diretório.
3. Adicione uma ACL que dê permissão de leitura e escrita ao usuário `root` num arquivo do `deck`. Confirme com `getfacl` e note o `+` no `ls -l`.
4. Use `namei -l /root/.bashrc` como `deck`. Em qual componente do caminho ocorre o bloqueio?
5. **Desafio.** Escreva um script que percorra todos os arquivos em `~/.local/share` e liste aqueles que têm permissão de escrita para "outros" (`o+w`). Use `find` com `-perm` e explique por que esses arquivos são um risco se houver serviços rodando na máquina.