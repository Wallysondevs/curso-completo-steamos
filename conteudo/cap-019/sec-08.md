O terminal é onde o Steam Deck deixa de ser "console" e vira de fato um computador. O aplicativo padrão se chama **Konsole**, o emulador de terminal do KDE, e é por ele que você vai instalar software, editar arquivos, diagnosticar problemas e — nas seções futuras deste curso — desbloquear tudo o que o SteamOS oferece. Esta seção é o cartão de visitas do terminal: abrir, entender o prompt, e rodar os primeiros comandos com consciência.

:::objetivos
- Abrir o Konsole e entender as partes do prompt
- Executar comandos e interpretar a saída e o código de retorno
- Navegar pelo sistema de arquivos com `pwd`, `ls` e `cd`
- Reconhecer o diretório pessoal e o superusuário no SteamOS
:::

## O Konsole e o prompt

O Konsole está no menu de aplicativos, na categoria Sistema (ou Utilitários), e também pode ser aberto pelo KRunner. Ao iniciá-lo, você vê uma janela escura com uma linha que convida a digitar — o **prompt**:

```terminal
(deck@steamdeck ~)$
```

Leia essa linha em três partes: o usuário (`deck`), o host após o `@` (`steamdeck`) e, entre parênteses, o diretório atual (`~`, que significa "seu diretório pessoal"). O `$` no fim indica que você é um usuário comum; quando o sistema quiser o superusuário, o sinal vira `#`.

:::nota
O `~` (til) é um atalho para o diretório pessoal do usuário — no caso, `/home/deck`. Em vez de digitar `/home/deck/Downloads`, você escreve `~/Downloads`. A mesma convenção vale para qualquer usuário Linux.
:::

## Os primeiros comandos

Três comandos resolvem 90% da desorientação inicial: `pwd` (onde estou), `ls` (o que há aqui) e `cd` (ir para outro lugar).

```terminal
$ pwd
/home/deck
$ ls
Desktop  Documents  Downloads  Music  Pictures  Public  Templates  Videos
$ cd Downloads
$ pwd
/home/deck/Downloads
```

O `pwd` (*print working directory*) imprime o caminho absoluto do diretório atual. O `ls` lista o conteúdo. O `cd` muda de diretório. Repare que, após `cd Downloads`, o prompt muda para refletir a nova localização — o `~` some e o caminho relativo aparece.

Para descer e subir na árvore, os atalhos `.` e `..` são essenciais:

```terminal
$ cd ..
$ pwd
/home/deck
$ ls ~/Documents
$ cd /
$ ls
bin  boot  etc  home  lib  media  opt  proc  run  sbin  sys  usr  var
```

`..` sobe um nível; `.` é o diretório atual. O `cd /` leva você à raiz do sistema de arquivos, de onde tudo se ramifica. A listagem da raiz mostra os diretórios clássicos do Linux (`bin`, `etc`, `home`, `usr`, `var`...) — assunto que o curso detalha em outro capítulo.

:::dica
O Konsole completa comandos e caminhos com a tecla `[[Tab]]`. Digite `cd Doc` e aperte Tab: o terminal completa para `cd Documents/`. Com teclado virtual, use a tecla Tab do layout; com teclado físico, é o atalho mais importante para economizar digitação.
:::

## Entendendo a saída e o erro

Nem toda execução termina bem, e o Linux é silencioso no sucesso e falante no erro — você precisa saber distinguir. O indicador é o **código de retorno** (*exit status*): `0` significa sucesso; qualquer outro número indica falha. O shell guarda esse código na variável `$?`.

```terminal
$ ls ~/Downloads
steamos-update-3.6.tar.gz
$ echo $?
0
$ ls ~/pasta-que-nao-existe
ls: cannot access '/home/deck/pasta-que-nao-existe': No such file or directory
$ echo $?
2
```

O primeiro `ls` teve sucesso, então `echo $?` imprime `0`. O segundo `ls` apontou para um diretório inexistente, gerando uma mensagem de erro na saída padrão de erro, e o código passou a ser `2`. Decorar os códigos não é necessário agora; basta o hábito de checar `$?` quando algo parece errado.

:::atencao
Uma pegadinha clássica de iniciante: a mensagem de erro aparece na tela, mas o código de retorno só fica em `$?` enquanto nada mais for executado. Se você rodar outro comando antes de checar `$?`, o valor já foi sobrescrito. Verifique `$?` *imediatamente* após o comando que interessa.
:::

## Sudo e o superusuário

O SteamOS, como todo Linux, separa o usuário comum do **root** (superusuário) por razões de segurança. Comandos administrativos pedem o prefixo `sudo`. No SteamOS 3.6, por design de console, o `sudo` para o usuário `deck` costuma não exigir senha:

```terminal
$ sudo whoami
root
$ sudo ls /root
```

O primeiro comando prova o ponto: com `sudo`, `whoami` responde `root` — temporariamente você se tornou o superusuário para aquele comando. O segundo lista o diretório pessoal do root, que o usuário comum não consegue abrir sem `sudo`.

Isso não significa que o sistema está "aberto". O SteamOS protege a raiz com o modelo de imagens somente-leitura: mesmo como root, alterações no sistema são revertidas na próxima atualização. O `sudo` existe para tarefas pontuais legítimas, não para transformar o Deck num sistema convencional.

```terminal
$ whoami
deck
$ sudo -l | head -5
User deck may run the following commands on steamdeck:
    (ALL : ALL) ALL
    (ALL : ALL) NOPASSWD: ALL
```

O `sudo -l` lista o que o usuário pode executar como root. A linha `NOPASSWD: ALL` confirma que o `deck` tem permissão irrestrita sem senha — uma escolha deliberada da Valve para não atrapalhar o fluxo de um console.

## Resumo

- O Konsole é o terminal do KDE; o prompt mostra usuário, host e diretório atual.
- `pwd` mostra o caminho atual, `ls` lista o conteúdo e `cd` navega entre diretórios.
- `~` é o diretório pessoal; `..` sobe um nível; `/` é a raiz do sistema.
- O código de retorno em `$?` indica sucesso (`0`) ou falha (qualquer outro valor).
- `sudo` executa comandos como root; no SteamOS 3.6, o `deck` tem `NOPASSWD: ALL`.
- O sistema de arquivos é somente-leitura por design, mesmo para o root.

## Exercícios

1. Abra o Konsole e rode `pwd`, `whoami` e `hostname`; explique, em uma frase, o que cada um revela sobre a sua sessão.
2. Liste o conteúdo da raiz com `ls /` e identifique cinco diretórios que você não conhecia.
3. Navegue até `~/Downloads` com `cd`, volte para `~` com `cd ..` ou `cd ~`, e confirme cada passo com `pwd`.
4. Gere um erro com `ls ~/nao-existe` e, imediatamente, cheque `echo $?`; explique por que o código não é `0`.
5. **Desafio.** Usando `sudo`, crie um diretório em `/tmp` com `sudo mkdir /tmp/deck-lab`, confirme com `ls -ld /tmp/deck-lab` e depois remova-o com `sudo rmdir /tmp/deck-lab`. Explique por que a criação em `/tmp` precisou de `sudo` enquanto a criação em `~/` (teste criando um diretório lá sem sudo) não precisou.
