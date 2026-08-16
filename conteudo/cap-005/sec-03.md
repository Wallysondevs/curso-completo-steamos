A conta Steam é a chave da experiência do Deck: ela destrava sua biblioteca de jogos, sincroniza o salvamento em nuvem e define como a máquina se comporta em relação a familiares e amigos. O login no SteamOS não é um mero formulário — envolve o Steam Guard, um fator de autenticação que protege a conta contra roubo de senha. Entender esse fluxo evita o cenário clássico de ficar travado fora depois de trocar de aparelho.

:::objetivos
- Entrar na conta Steam e compreender o papel do Steam Guard
- Localizar os arquivos de configuração do cliente Steam no disco
- Entender onde ficam as credenciais e o que elas contêm
- Reconhecer o fluxo de logout e os efeitos sobre dados locais
- Conectar o login Steam às permissões do usuário `deck` no sistema
:::

## O que acontece quando você entra

Ao entrar no modo Gaming e preencher os dados da conta Steam, o cliente armazena credenciais e tokens no diretório `~/.steam`. Esse diretório, que já existia desde o primeiro boot, passa a conter os dados de identidade do usuário que fez login:

```terminal
$ ls -la ~/.steam
total 12
drwx------  6 deck deck 4096 Aug 16 13:58 .
drwxr-xr-x 24 deck deck 4096 Aug 16 14:02 ..
drwx------  3 deck deck 4096 Aug 16 13:58 root
drwx------  4 deck deck 4096 Aug 16 14:03 steam
drwx------  3 deck deck 4096 Aug 16 13:58 ubuntu
```

O diretório `steam` guarda a configuração do cliente; o `root` e o `ubuntu` são resquícios de compatibilidade com versões antigas do cliente Steam (que nasceu em máquinas Ubuntu). As permissões `drwx------` (apenas o dono) protegem os arquivos contra leitura por outros usuários do sistema.

O usuário local do SteamOS chama-se `deck`, e é com ele que você faz login no desktop. O login na Steam acontece *dentro* do cliente, sobre o usuário `deck`, ou seja, todos os jogos e arquivos pertencem a `deck`:

```terminal
$ whoami
deck
$ id
uid=1000(deck) gid=1000(deck) groups=1000(deck),998(wheel),27(video),993(steam)
```

Repare no grupo `steam` e no grupo `video`. O primeiro dá acesso aos dispositivos de controle/jogos, e o segundo permite escrever na placa de vídeo (necessário para renderização e GameScope). Esses grupos são atribuídos por padrão e explicam por que o `deck` consegue rodar jogos sem `sudo`.

## Steam Guard e o fator extra

O Steam Guard é a autenticação em duas etapas da Valve. Ao entrar num aparelho novo, a Valve envia um código por aplicativo ou e-mail, e só depois libera o login. A presença do Steam Guard muda o que fica salvo no disco: em vez de só uma senha, o cliente guarda um *token* de sessão com validade, e o aparelho passa a constar como "autorizado".

Para verificar se este Deck está autorizado, o dado relevante fica dentro do cliente, mas dá para confirmar a existência da sessão ativa inspecionando os arquivos de cache:

```terminal
$ ls ~/.steam/steam/config/
config.vdf  loginusers.vdf  steam_ui.txt  ...
$ cat ~/.steam/steam/config/loginusers.vdf
"users"
{
    "76561198012345678"
    {
        "AccountName"        "ana"
        "PersonaName"        "Ana"
        "RememberPassword"   "1"
        "MostRecent"         "1"
        "Timestamp"          "1723820311"
    }
}
```

O `loginusers.vdf` lista os usuários que já entraram neste Deck, com o `AccountName` (login), o `PersonaName` (nome público) e o flag `RememberPassword`. O SteamID `76561198012345678` é o identificador numérico único da conta. Não há senha em texto puro nesse arquivo — a senha, quando "lembrada", fica protegida pelo cofre de credenciais do sistema.

:::atencao
`RememberPassword=1` significa que o cliente guardou a senha para logins futuros no `deck`. Se outra pessoa tiver acesso físico ao Deck, ela poderá entrar na sua conta sem digitar senha. Em aparelhos compartilhados, desligue essa opção nas configurações do cliente Steam ou ative o PIN de login.
:::

## Desconectando e os efeitos no disco

Fazer logout remove a sessão ativa, mas **não** apaga os jogos instalados nem as configurações. O que muda é o token de sessão: ao sair e entrar com outra conta, os jogos continuam no disco, mas cada conta vê apenas sua própria biblioteca licenciada. O diretório de jogos instalados vive fora do `~/.steam`, na partição de dados:

```terminal
$ ls ~/.local/share/Steam/steamapps/common/ 2>/dev/null | head -5
Portal 2
Half-Life 2
Stardew Valley
Celeste
```

Este é um ponto importante de arquitetura: o SteamOS separa o *sistema* (raiz somente-leitura, `read-only`) da *partição de dados* (onde moram jogos e o `~` do `deck`). Por isso jogos instalados sobrevivem a uma troca de conta e até a alguns processos de recuperação do sistema.

:::nota
A raiz do SteamOS vem montada em modo somente-leitura para proteger o sistema de alterações acidentais e facilitar atualizações atômicas. Isso será detalhado na seção sobre a primeira atualização. Por ora, basta saber que tudo o que você cria como `deck` fica na partição gravável de dados.
:::

## Conferindo o estado da conta pela linha de comando

O cliente Steam em si não expõe uma API JSON simples para checar login, mas você pode confirmar que o processo está rodando e a qual usuário ele pertence:

```terminal
$ pgrep -a steam | head -3
1421 /home/deck/.local/share/Steam/ubuntu12_32/steam
1430 /home/deck/.local/share/Steam/ubuntu12_32/steamwebhelper
```

O `steamwebhelper` é o processo responsável pela interface embutida (a "webview") que renderiza a loja e a comunidade. Se o cliente estiver travado na tela de login, matar o processo e relançar (`steam` no terminal, ou reiniciando o modo Gaming) costuma resolver, sem perder o login salvo.

## Resumo

- O login Steam grava tokens e a lista de usuários em `~/.steam/steam/config/loginusers.vdf`.
- O usuário local `deck` pertence aos grupos `steam` e `video`, que dão acesso a controles e GPU sem `sudo`.
- Steam Guard adiciona um fator extra; o Deck autorizado passa a constar como aparelho confiável.
- `RememberPassword=1` guarda a senha e exige cuidado em aparelhos compartilhados.
- Logout não apaga jogos: eles vivem na partição de dados (`~/.local/share/Steam/steamapps/`).

## Exercícios

1. Rode `id` e liste os grupos do usuário `deck`, explicando o papel dos grupos `steam` e `video`.
2. Abra `~/.steam/steam/config/loginusers.vdf` e identifique o `AccountName` e o SteamID da conta logada.
3. Execute `ls ~/.local/share/Steam/steamapps/common/` e veja quais jogos já estão presentes no disco do seu Deck.
4. Rode `pgrep -a steam` e identifique o processo `steamwebhelper`, explicando sua função.
5. **Desafio.** No modo Desktop, abra um terminal e navegue até `~/.steam/steam/config/`. Compare os campos de `loginusers.vdf` com a explicação da seção e proponha um comando (`grep`) que liste apenas os `PersonaName` de todos os usuários que já entraram na máquina.
