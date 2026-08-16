Nem sempre o jogo que você quer aparece com selo Verified. Às vezes ele é `Unsupported` por um anti-cheat; outras vezes é `Unknown` simplesmente porque ninguém testou. O Steam Deck, porém, não é uma caixa fechada: ele tem um modo desktop completo, acesso a `flatpak` e a capacidade de rodar jogos de fora do Steam. Esta seção abre as duas portas laterais — o lado Linux do aparelho e o mundo dos jogos não-Steam.

:::objetivos
- Alternar entre o Game Mode e o modo desktop do SteamOS
- Identificar a instalação Flatpak do Steam e de outros aplicativos
- Entender o que são jogos não-Steam e como entram na biblioteca
- Reconhecer o Proton e a camada de compatibilidade por baixo da loja
- Avaliar o que é "nativo Linux" versus "via Proton"
:::

## O SteamOS por trás da loja

O SteamOS é uma distribuição Linux com duas faces. A face que você vê ao ligar é o Game Mode, a interface de console. A outra é o **modo desktop**, um ambiente KDE Plasma completo onde o Deck vira um notebook com tela de 800p. É nesse modo desktop que se abrem as portas para instalar software fora do catálogo da Valve.

```terminal
$ flatpak list | grep -i steam
Steam	com.valvesoftware.Steam	1.0.0.79	system	-
```

O `flatpak list` mostra os aplicativos instalados no formato Flatpak — o sistema de empacotamento sandbox usado pelo SteamOS para aplicativos de desktop. A linha filtrada por `steam` revela que o cliente Steam (`com.valvesoftware.Steam`) também é distribuído como Flatpak no SteamOS. O `system` indica instalação em escopo de sistema, não só de usuário.

:::nota
O SteamOS usa uma combinação: o sistema base é imutável (A/B, como veremos em capítulos de administração), e os aplicativos de usuário chegam via Flatpak. Por isso `flatpak list` é a sua janela oficial para "o que eu instalei fora dos jogos". Jogos do Steam **não** aparecem aqui — só aplicativos de desktop.
:::

## Jogos nativos vs. jogos via Proton

Uma distinção que atravessa todo o capítulo merece aqui o seu desfecho técnico. Alguns jogos têm **build nativo para Linux**: o executável foi compilado para Linux e roda direto no SteamOS. A maioria, porém, só tem build para Windows, e o Deck os roda através do **Proton** — a camada de compatibilidade da Valve baseada no Wine que traduz chamadas do Windows para o Linux em tempo real.

Na prática, para o usuário, a diferença é invisível: você aperta "Jogar" e funciona. Mas ela explica por que o selo Verified existe e por que alguns jogos falham (anti-cheat que inspeciona o kernel do Windows e não funciona sob Proton).

```terminal
$ steam steam://open/proton
```

Não existe uma página Proton na loja, mas o cliente expõe a versão instalada do Proton. Você pode confirmar os runtimes de compatibilidade presentes com:

```terminal
$ ls ~/.local/share/Steam/steamapps/common/ | grep -i proton
Proton - Experimental
Proton 9.0
Proton Hotfix
```

Cada diretório `Proton *` em `common/` é uma versão do Proton instalada na máquina, usada quando um jogo Windows roda. A "Experimental" é a versão de testes mais recente; a "9.0" é uma major estável; "Hotfix" é correção pontual. Escolher qual Proton usar por jogo é um ajuste avançado que aparece quando um título não funciona na versão padrão.

## Adicionando jogos não-Steam

"Jogo não-Steam" é qualquer executável que você roda pela biblioteca do Steam sem ter comprado na loja: um título do GOG, um emulador, um jogo de itch.io ou um programa qualquer. O Steam permite adicionar agora um atalho externo, e o Deck herda esse recurso.

O fluxo é pela interface (Adicionar um jogo não-Steam → escolher o executável). Por baixo dos panos, o Steam registra esses atalhos num arquivo de configuração:

```terminal
$ cat ~/.local/share/Steam/config/shortcuts.vdf
"shortcuts"
{
	"0"
	{
		"appid"		"-1234567890"
		"AppName"		"Celeste (GOG)"
		"Exe"		"/home/deck/games/celeste/Celeste"
		"LaunchOptions"		"%command%"
	}
}
```

O `appid` negativo é a assinatura de jogo não-Steam: a Valve reserva IDs negativos para conteúdo adicionado pelo usuário, que não tem página na loja. O `Exe` aponta para o binário local, e `LaunchOptions` permite passar argumentos (aqui o padrão `%command%`, que o cliente substitui pelo executável). Entender esse arquivo desmistifica o "instalar jogo de fora".

:::dica
Para um jogo não-Steam aproveitar o Proton, você marca "Forçar o uso de uma ferramenta de compatibilidade" nas propriedades e escolhe uma versão do Proton. É assim que se roda um executável Windows de fora do Steam usando a mesma camada que os jogos da loja usam.
:::

## Instalando um cliente alternativo via Flatpak

Além de adicionar jogos, você pode instalar outros clientes de loja pelo Flatpak — o GOG Galaxy, o Heroic Games Launcher (para GOG e Epic) ou o Lutris. O gesto é o mesmo do `flatpak` comum:

```terminal
$ flatpak list
Nome	Application ID	Version	Branch	Instalação
Steam	com.valvesoftware.Steam	1.0.0.79	stable	system
Heroic	com.heroicgameslauncher.hgl	2.15.0	stable	user
```

Aqui o `flatpak list` completo mostra o Steam e o Heroic instalados lado a lado. O Heroic em escopo `user` (não `system`) é uma escolha comum para quem quer instalar sem tocar no sistema. Ter dois clientes no mesmo aparelho mostra o ponto central desta seção: o Deck é Linux, e Linux roda mais do que a loja oficial.

## O limite das portas laterais

Nem tudo são flores. Anti-cheat de kernel, codecs proprietários e alguns launchers de terceiros continuam a ser os três fantasmas do Deck fora da loja. O `grep` dos logs de compatibilidade, visto na seção do Verified, volta a valer:

```terminal
$ grep -ri "unsupported\|anti" ~/.steam/steam/logs/ 2>/dev/null | head -5
[Compat] appid 268750 -> Unsupported (anti-cheat)
[Compat] appid 730    -> Playable (VAC may not run under Proton)
```

Linhas como "VAC may not run under Proton" (VAC é o anti-cheat da Valve) avisam que mesmo dentro da loja, o anti-cheat é o divisor entre "roda" e "não roda". Fora da loja, a situação é idêntica, sem o conforto do selo. Por isso, para jogo de terceiros, a checagem manual no ProtonDB ou na comunidade vira obrigatória.

## Resumo

- O SteamOS tem Game Mode (console) e modo desktop (KDE), cada um com uma vocação.
- `flatpak list | grep -i steam` mostra o cliente Steam instalado como Flatpak no SteamOS.
- Jogos nativos Linux rodam direto; jogos Windows rodam via Proton, camada baseada no Wine.
- `ls common/ | grep -i proton` lista as versões de Proton instaladas.
- Jogos não-Steam têm `appid` negativo e ficam em `shortcuts.vdf` com o `Exe` do binário local.
- Anti-cheat de kernel é o principal motivo para jogos serem `Unsupported`, dentro e fora da loja.

## Exercícios

1. Rode `flatpak list | grep -i steam` e confirme o `Application ID` do cliente Steam no seu Deck.
2. Execute `ls ~/.local/share/Steam/steamapps/common/ | grep -i proton` e liste as versões de Proton instaladas. Qual é a mais estável?
3. Adicione um jogo não-Steam pela interface e depois inspecione `cat ~/.local/share/Steam/config/shortcuts.vdf`. Qual é o `appid` e por que ele é negativo?
4. Liste todos os Flatpaks com `flatpak list` e identifique quais são clientes de loja (Steam, Heroic, Lutris etc.).
5. **Desafio.** Tome um jogo Windows de fora do Steam, adicione-o como não-Steam, force o Proton nas propriedades e rode-o. Depois confirme nos logs (`grep -i proton ~/.steam/steam/logs/`) que uma camada de compatibilidade foi acionada, ligando o resultado à seção do Deck Verified.
