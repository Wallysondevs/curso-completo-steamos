Depois do login, a prioridade seguinte é acertar a conta Steam e os ajustes de privacidade. O Steam Deck mistura duas esferas: o perfil público que seus amigos veem na comunidade Steam e o que fica salvo localmente no aparelho. Privacidade aqui não é só "quem vê o que eu jogo" — é também decidir o que a Valve sincroniza, o que fica em nuvem e quem consegue entrar na sua máquina fisicamente.

:::objetivos
- Diferenciar perfil público Steam de configurações locais do Deck
- Localizar e entender os arquivos de configuração do cliente
- Ajustar a visibilidade do perfil e do status de jogo
- Proteger o acesso local com PIN e controles de login
- Entender o que a sincronização em nuvem grava e onde
:::

## Perfil público versus dados locais

O perfil Steam tem visibilidade própria, gerenciada na comunidade. Ele controla se seu nome, lista de amigos, inventário e histórico de jogos são públicos, só para amigos ou privados. Essas preferências ficam **no servidor da Valve**, não no aparelho — mudam de dispositivo para dispositivo junto com a conta.

Já os dados locais (configuração do cliente, controles, preferências de download) vivem em arquivos dentro de `~/.steam` e `~/.local/share/Steam`. Vale separar mentalmente os dois: mexer num arquivo local não muda sua privacidade pública, e vice-versa.

O perfil público é lido e escrito pelo cliente, mas dá para confirmar o que está salvo localmente sobre o usuário:

```terminal
$ grep -E '"(PersonaName|AccountName|AccountID)"' ~/.steam/steam/config/loginusers.vdf
        "AccountName"        "ana"
        "PersonaName"        "Ana"
        "AccountID"          "76561198012345678"
```

`PersonaName` é o nome que aparece publicamente; `AccountName` é o login usado para entrar (e nunca é mostrado publicamente). O `AccountID` (SteamID) é o identificador único e imutável da conta.

## Configuração local do cliente Steam

O cliente Steam guarda a maior parte das preferências em arquivos `.vdf` (formato *Valve Data Format*, uma estrutura de chaves e valores parecida com JSON, mas com sintaxe própria). O arquivo principal é o `config.vdf`:

```terminal
$ ls ~/.steam/steam/config/
config.vdf  dialogconfig.vdf  loginusers.vdf  steam_ui.txt  libraryfolders.vdf
```

O `config.vdf` concentra dezenas de opções. É possível inspecionar trechos específicos com `grep` para ver, por exemplo, se o overlay e o status de jogo estão ativos:

```terminal
$ grep -iE 'AlwaysShow|Overlay|Cloud' ~/.steam/steam/config/config.vdf | head -8
        "AutoCloudSave"            "1"
        "CloudEnabledByDefault"    "1"
```

`AutoCloudSave=1` e `CloudEnabledByDefault=1` indicam que o salvamento em nuvem está ligado por padrão. Isso significa que, ao fechar um jogo, o estado do salvamento é enviado para os servidores da Valve e baixado em outros aparelhos. Para quem se preocupa com privacidade ou tem conexão limitada, é este o flag a revisar.

:::atencao
Editar `.vdf` manualmente enquanto o cliente Steam está aberto pode ser sobrescrito na próxima gravação do cliente. Feche o cliente (ou o modo Gaming) antes de alterar esses arquivos, e sempre mantenha uma cópia de segurança antes de mexer.
:::

## Status de jogo e "invisível"

O modo "invisível" (aparecer offline) é uma das opções de privacidade mais usadas. Ele não desliga a conta — apenas faz você aparecer offline para os amigos, enquanto continua jogando e usando as funções online. O estado é controlado pelo cliente, mas há um reflexo no processo e em arquivos locais que dá para observar:

```terminal
$ pgrep -a steam | grep -i steamwebhelper
1430 /home/deck/.local/share/Steam/ubuntu12_32/steamwebhelper
```

O que importa aqui é o conceito: o status (online, ausente, invisível, offline) é um atributo de *presença* mantido pelo cliente e comunicado aos servidores. Não há um "modo invisível do sistema" no SteamOS — o sistema continua com rede ativa, relógio sincronizando e atualizações em segundo plano, mesmo quando você aparece offline no Steam.

:::nota
"Aparecer offline" (invisível) não é o mesmo que tirar o Deck do ar. Quem quiser isolamento total de rede — sem cloud, sem atualização, sem telemetria — precisa desligar o Wi-Fi (via `nmcli device disconnect wlan0`) ou usar o modo avião, não apenas o status do Steam.
:::

## Protegendo o acesso físico

A privacidade local começa no acesso ao aparelho. O Steam Deck não exige senha para entrar no modo Gaming por padrão, mas oferece um PIN de login que impede outra pessoa de abrir sua conta. Além do PIN, o desktop KDE usa a senha do usuário `deck`:

```terminal
$ passwd --status deck
deck P 08/16/2025 0 99999 7 -1
```

A coluna `P` indica que há senha definida para `deck`. Sem senha, o campo seria `NP` ou `L`. Definir (ou trocar) a senha do usuário `deck` é uma camada adicional de proteção para quando o aparelho entra no modo Desktop:

```terminal
$ passwd
Changing password for deck.
Current password:
New password:
Retype new password:
passwd: password updated successfully
```

O PIN do modo Gaming e a senha do `deck` são independentes: o PIN protege a interface de jogos, a senha protege o desktop e o `sudo`. Cada um vale para sua camada.

:::dica
Combine três camadas para um Deck realmente seu: PIN no modo Gaming, senha forte no usuário `deck` (usada no `sudo`) e Steam Guard na conta. Mesmo com o aparelho roubado, o invasor terá trabalho em cada fronteira antes de chegar a seus dados e à sua biblioteca.
:::

## Resumo

- Perfil Steam (público) e configurações locais (`.vdf`) são coisas distintas; privacidade pública vive na Valve.
- `loginusers.vdf` guarda `AccountName`, `PersonaName` e `AccountID` da conta logada.
- `config.vdf` concentra preferências do cliente, incluindo flags de nuvem (`AutoCloudSave`).
- Modo invisível é presença, não isolamento de rede; para cortar a rede, desconecte o Wi-Fi.
- PIN do modo Gaming e senha do `deck` são independentes; `passwd --status deck` mostra se há senha.

## Exercícios

1. Rode `grep -E '"(PersonaName|AccountName|AccountID)"' ~/.steam/steam/config/loginusers.vdf` e identifique os três campos da sua conta.
2. Liste o conteúdo de `~/.steam/steam/config/` e explique a função de `config.vdf` e `loginusers.vdf`.
3. Verifique os flags de nuvem com `grep -iE 'Cloud' ~/.steam/steam/config/config.vdf` e descreva o estado atual.
4. Execute `passwd --status deck` e interprete o resultado: a senha do seu `deck` está definida?
5. **Desafio.** Feche o cliente Steam, faça uma cópia de `config.vdf` (`cp config.vdf config.vdf.bak`) e investigue com `grep` quais opções relacionadas a "offline" ou "Cloud" existem. Depois explique a diferença entre o status "invisível" do Steam e o isolamento real de rede via `nmcli`.
