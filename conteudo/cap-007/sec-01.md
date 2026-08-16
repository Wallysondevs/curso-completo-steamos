Uma conta Steam não é só um login: ela guarda os jogos que você comprou, o progresso salvo na nuvem, a lista de amigos e — o que mais pesa em qualquer discussão de segurança — ela pode valer centenas (ou milhares) de reais em títulos. No Steam Deck, a conta é o próprio sistema operacional, então entender onde ficam as credenciais e como protegê-las é o ponto de partida de tudo o que vem neste capítulo.

:::objetivos
- Entender o que é e por que ativar o Steam Guard
- Localizar e ler os arquivos de autenticação da conta no Deck
- Identificar o seu SteamID64 e entender o que ele representa
- Proteger as credenciais armazenadas em `loginusers.vdf` e `config.vdf`
- Gerenciar sessões ativas e autorizações da conta
:::

## O que o Steam Guard protege

Steam Guard é a autenticação em duas etapas da Valve. Ativado, ele exige, além da senha, um código que só você tem — gerado no aplicativo Steam do celular ou enviado por e-mail — para entrar em um dispositivo novo. É a diferença entre "alguém descobriu minha senha" e "alguém descobriu minha senha e agora tem acesso à minha biblioteca".

O Steam Deck entra nessa equação de um jeito particular: como ele é o próprio cliente Steam, a primeira autenticação já acontece durante a experiência inicial de configuração. Depois que você aceita, ele guarda um *token* de login local para não pedir senha toda vez que liga. Esse token fica num arquivo, e é crucial entender o que ele representa.

```terminal
$ cat ~/.steam/steam/config/loginusers.vdf
"users"
{
	"[SEU_STEAM_ID64]"
	{
		"AccountName"		"ana"
		"PersonaName"		"ana"
		"RememberPassword"		"1"
		"MostRecent"		"1"
		"Timestamp"		"1734012345"
		"TokenID"		"[TOKEN_OMITIDO]"
		"UseUinString4Cache"		"1"
		"WantsOfflineMode"		"0"
		"SkipOfflineModeWarning"		"0"
	}
}
```

Esse é o arquivo `loginusers.vdf`, formato VDF (*Valve Data Format*), uma variante de texto aninhada com chaves que a Valve usa em vários arquivos de configuração. Os campos revelam muito: `AccountName` é o nome da conta, `RememberPassword` igual a `1` indica que o cliente guardou o login, e `TokenID` é exatamente o token de sessão que permite reautenticar sem senha. Note que escrevemos `[SEU_STEAM_ID64]` e `[TOKEN_OMITIDO]` no lugar dos valores reais — você nunca deve colar esses valores verdadeiros em lugar nenhum.

:::atencao
Nunca compartilhe, publique em screenshot, envie por chat ou comite num repositório o conteúdo de `loginusers.vdf` ou qualquer token do Steam. Quem tiver o `TokenID` (junto de outros dados da máquina) pode autenticar como você sem conhecer sua senha. Isso inclui o `SteamID64`: ele não é secreto, mas em combinação com outras informações ajuda a engenharia social. Trate o diretório `~/.steam` como o cofre da sua conta.
:::

## De onde vem o SteamID64

O SteamID64 é o identificador numérico universal da sua conta — aquele número grande usado em banimentos, perfis e na API da Valve. É diferente do `AccountName` (seu nome de login), que nunca muda, e do `PersonaName` (o nome de exibição, que você troca quando quiser).

O SteamID64 aparece em vários lugares. Um deles é o próprio `loginusers.vdf`, como vimos. Outro é o arquivo de configuração global do cliente:

```terminal
$ cat ~/.steam/steam/config/config.vdf
"InstallConfigStore"
{
	"Software"
	{
		"Valve"
		{
			"Steam"
			{
				"AutoUpdateWindowEnabled"		"0"
				"ContentStatsID"		"[SEU_STEAM_ID64]"
				"RecentApp"		"2792310"
			}
		}
	}
}
```

Aqui o `ContentStatsID` costuma guardar o mesmo valor do SteamID64. O `RecentApp` igual a `2792310` é o *appid* do último jogo aberto — cada jogo no catálogo Steam tem um número único desses, e `2792310` é o ID atribuído ao jogo *Balatro*, usado apenas como exemplo. Prestar atenção a esses números ensina a navegar no "backstage" da conta sem depender da interface gráfica.

## Conferindo o estado da autenticação

O jeito mais direto de ver se o cliente reconhece sua conta como logada é olhar o perfil via linha de comando. O `steamcmd` é um cliente em modo texto do Steam, distinto da interface do Deck, e serve para tarefas de servidor e de inspeção. Ele aceita um login por argumento, mas há um aviso importante:

```terminal
$ steamcmd +login ana +quit
Password:
```

O comando pede a senha interativamente — e não faça a versão `+login ana minhasenha` com a senha em claro na linha de comando:

:::perigo
Nunca digite a senha na linha de comando (`steamcmd +login ana minhasenha`). O argumento fica visível no histórico do shell (`~/.bash_history`), em `ps` enquanto o processo roda e em logs. O `steamcmd` permite omitir a senha e responder ao prompt, que é a forma segura. Também prefira sempre autenticação com Steam Guard, que o `steamcmd` solicita quando a conta exige.
:::

Como o `loginusers.vdf` já guarda a sessão, na prática o cliente gráfico do Deck não precisa de `steamcmd` para o uso diário. O `steamcmd` aparece aqui porque é o caminho de inspeção quando você automatiza instalações ou administra servidores de jogos dedicados.

## Onde as contas ficam no disco

Além do `~/.steam`, existe um diretório irmão que confunde muita gente:

```terminal
$ ls ~/.local/share/Steam
appcache
compat
config
controller_base
logs
music
steamapps
userdata
```

`~/.steam/steam` e `~/.local/share/Steam` estão relacionados: na instalação padrão do Linux, o `~/.local/share/Steam` costuma ser o diretório "real" onde vivem jogos (`steamapps`) e o `userdata`, enquanto `~/.steam/steam` guarda configuração. O `userdata` é especialmente importante:

```terminal
$ ls ~/.local/share/Steam/userdata
[SEU_STEAM_ID64]
```

Dentro de `userdata/[SEU_STEAM_ID64]` ficam os saves locais, screenshots e, em alguns jogos, configurações por usuário. Por isso o SteamID64 vale ouro na hora de fazer backup seletivo ou mover a biblioteca para outro disco — assunto que aparece de novo neste capítulo na parte de organização.

## Encerrando sessões de um lugar só

Quando você quer "sair de todos os lugares", o caminho oficial é pelo cliente ou pelo site: **Conta → Detalhes da conta → Segurança da conta → Desautorizar todos os dispositivos**. Existe uma forma de visualizar o mesmo estado localmente, útil para conferir se o Deck ainda se considera logado:

```terminal
$ grep -i "remember" ~/.steam/steam/config/loginusers.vdf
		"RememberPassword"		"1"
```

Se o valor for `1`, o cliente guardou a sessão e vai entrar direto. Esse é um bom hábito de verificação antes de vender, emprestar ou formatar o Deck: saber que o arquivo guarda a sessão é o lembrete de que formatar o disco não desloga automaticamente de tudo — a desautorização precisa ser feita no servidor da Valve, na sua conta.

:::dica
Antes de vender ou doar o Deck, faça três coisas nesta ordem: (1) desautorize os dispositivos na conta Steam pelo site; (2) faça *factory reset* pelo modo de recuperação do Deck; (3) troque a senha. Desautorizar primeiro garante que, mesmo que fique algum resíduo, o token antigo deixa de valer.
:::

## Resumo

- Steam Guard é a autenticação em duas etapas da Valve e é essencial em contas com jogos comprados.
- `loginusers.vdf` guarda o token de sessão; `config.vdf` traz o SteamID64 no campo `ContentStatsID`.
- O SteamID64 é diferente do `AccountName` (login) e do `PersonaName` (nome de exibição).
- Nunca exponha tokens ou `loginusers.vdf`; use placeholders como `[TOKEN_OMITIDO]` em qualquer anotação.
- `steamcmd +login ana` pede a senha no prompt; evite colocar senha em claro na linha de comando.
- `~/.local/share/Steam/userdata/[SEU_STEAM_ID64]` guarda saves e screenshots locais da conta.

## Exercícios

1. Rode `cat ~/.steam/steam/config/loginusers.vdf` e identifique os campos `AccountName`, `RememberPassword` e `TokenID`. Anote (sem expor o token) o que cada um significa.
2. Execute `cat ~/.steam/steam/config/config.vdf` e localize o campo `ContentStatsID`. Confirme se o valor bate com o SteamID64 da sua conta visto no perfil do Steam.
3. Liste o conteúdo de `~/.local/share/Steam/userdata` com `ls ~/.local/share/Steam/userdata` e explique por que o nome da subpasta corresponde ao seu SteamID64.
4. Rode `grep -i "remember" ~/.steam/steam/config/loginusers.vdf` e descreva o que o resultado diz sobre o estado de login atual do Deck.
5. **Desafio.** Sem usar `steamcmd` com senha em claro, entre no site do Steam pela sua conta, desautorize dispositivos, e depois descreva — sem executar por enquanto — o que aconteceria com a sessão do Deck se você não desautorizasse antes de um factory reset. Relacione com o que estudamos sobre `loginusers.vdf`.
