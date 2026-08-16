Enquanto o Lutris tenta abraçar o mundo inteiro, o Heroic Games Launcher escolheu um recorte e faz isso muito bem: GOG e Epic Games. Nasceu em 2020 como uma alternativa de código aberto ao launcher oficial da Epic (que nunca chegou de verdade ao Linux) e hoje é, junto com o Lutris, uma das duas portas de entrada padrão para jogos fora do Steam no Steam Deck. Entender o Heroic é entender por que uma ferramenta focada às vezes vence uma mais geral.

:::objetivos
- Entender o foco do Heroic em GOG e Epic
- Distinguir o Heroic base (HTTPS) do Heroic Flatpak
- Reconhecer o papel do Legendary e do gogdl por baixo
- Diferenciar a UI do Heroic da do Lutris
- Saber quando o Heroic substitui o Lutris
:::

## Um recorte claro: duas lojas

O Heroic não tenta ser universal. Ele administra exatamente duas bibliotecas — GOG e Epic — e faz isso com uma interface limpa, pensada para controller e tela pequena. Essa limitação é uma vantagem: sem dezenas de opções de runner expostas, o fluxo de "logar, baixar, jogar" fica curto, e a configuração de Proton/Wine por jogo fica escondida atrás de uma tela de ajustes que a maioria nem precisa abrir.

Por baixo do capô, o Heroic delega o trabalho pesado a dois programas de linha de comando que ele embute: o **Legendary**, um client de código aberto para a Epic Games, e o **gogdl** (ou o antigo `gog`), para a GOG. Você não precisa instalar nada disso — o Heroic traz junto — mas conhecê-los ajuda a depurar, porque os erros de download frequentemente vêm dessas camadas.

```terminal
$ flatpak info com.heroicgameslauncher.hgl | head -4

Heroic Games Launcher - An Open Source GOG and Epic games launcher

          ID: com.heroicgameslauncher.hgl
         Ref: app/com.heroicgameslauncher.hgl/x86_64/stable
```

O ID do Flatpak é `com.heroicgameslauncher.hgl`. Note o `hgl` no final: é o que diferencia o pacote oficial do Flathub de forks ou versões antigas que circulavam com nomes parecidos.

## Interface moderna, pensada no Deck

A maior virtude do Heroic é a ergonomia. A biblioteca mostra capas grandes, o modo de instalação lista opções de Wine/Proton com descrições amigáveis ("Proton GE — melhor compatibilidade"), e há integração com o modo de jogo do Steam Deck, permitindo adicionar atalhos dos jogos direto na Steam.

O controle fica perto, mas não some: em cada jogo você acessa "Settings" e vê versão de Proton, opções de prefixo, variáveis de ambiente e atalho para abrir o `winecfg` ou o `winetricks` daquele prefixo.

:::dica
Para cada jogo da Epic, o Heroic deixa você escolher um Proton diferente. Isso é uma diferença real de mentalidade em relação ao Lutris: no Lutris o runner é central, no Heroic é uma propriedade do jogo. Para quem tem bibliotecas grandes, o modelo do Heroic costuma ser mais rápido de navegar.
:::

## O papel do Legendary e do gogdl

Não é raro ver um download da Epic travar ou dar erro de autenticação no Heroic. Quando isso acontece, a mensagem de erro quase sempre vem do Legendary, não do Heroic. Vale entender minimamente como essa camada funciona.

```terminal
$ flatpak run com.heroicgameslauncher.hgl --help 2>&1 | head -20
Usage: heroic [options] [command]

Options:
  -V, --version              output the version number
  -h, --help                 display help for command

Commands:
  launch <appName>           launch a game
  list                       list installed games
  auth                       authenticate to a store
  install [options] <appName>
  help [command]             display help for command
```

O CLI do Heroic espelha o que a interface faz: `auth` para autenticar, `install` para baixar, `launch` para rodar, `list` para ver o que está instalado. É útil para automação, mas quase todo mundo usa só a interface.

:::nota
O Legendary nasceu porque a Epic nunca lançou um client oficial para Linux. Ele fala o mesmo protocolo da Epic Store, autenticando e baixando os mesmos arquivos, mas sem o DRM do launcher. O gogdl faz equivalente para a GOG, inclusive baixando os instaladores offline `.sh`/`.exe`. Isso explica por que o Heroic consegue instalar até os "offline installers" da GOG, algo valioso para guardar backups.
:::

## Heroic versus Lutris, em uma frase

Se o Lutris é o canivete suíço, o Heroic é a faca de cozinha afiada para duas tarefas específicas. Para GOG e Epic, o Heroic costuma ser mais agradável; para "todo o resto" (itch.io, instaladores soltos, emuladores, fontes exóticas), o Lutris continua necessário.

A boa notícia é que os dois podem coexistir. Como ambos usam o Legendary para a Epic, dá até para compartilhar o cache de downloads em alguns setups, e os jogos instalados por um não interferem no outro. Muita gente rica em jogos na Epic usa o Heroic como launcher principal e deixa o Lutris para o que o Heroic não alcança.

## Quando o Heroic é a escolha certa

Escolha o Heroic quando quase toda a sua biblioteca fora do Steam vem da GOG e da Epic. Você ganha instalação em poucos cliques, atualizações automáticas via Flatpak e uma experiência de controller que rivaliza com o modo de jogo do Steam.

Escolha também o Heroic se você quer adicionar esses jogos à Steam com atalhos e arte de capa organizados automaticamente — o Heroic tem uma função "Add to Steam" que faz isso sem esforço manual, conectando-se diretamente à biblioteca do Deck.

```terminal
$ ls ~/Games/Heroic/
Epic  GOG  Prefixes
```

A estrutura de pastas do Heroic mantém as duas lojas separadas (`Epic` e `GOG`) e dedica uma pasta `Prefixes` para os prefixos Wine/Proton. Isso facilita backup e limpeza, diferente do Lutris, que mistura tudo em `~/Games/` por jogo.

## Resumo

- O Heroic Games Launcher é focado em GOG e Epic, com interface limpa e pensada para controller.
- Ele usa o Legendary (Epic) e o gogdl (GOG) como backend de linha de comando.
- O Flatpak `com.heroicgameslauncher.hgl` é a instalação recomendada no SteamOS.
- A escolha de Proton/Wine é uma propriedade por jogo, não um runner central como no Lutris.
- A função "Add to Steam" conecta os jogos do Heroic ao modo de jogo do Deck.
- A estrutura `~/Games/Heroic/{Epic,GOG,Prefixes}` separa lojas e prefixos, facilitando backup.

## Exercícios

1. Instale o Heroic pelo Flatpak e confirme com `flatpak info com.heroicgameslauncher.hgl`. Anote a versão.
2. Explore `flatpak run com.heroicgameslauncher.hgl --help` e liste os comandos disponíveis. Compare com o `lutris --help` da seção anterior.
3. Autentique uma conta da GOG ou Epic e observe a estrutura criada em `~/Games/Heroic/`.
4. Navegue pela tela de Settings de um jogo já instalado (ou de um gratuito) e identifique a versão de Proton selecionada e o caminho do prefixo.
5. **Desafio.** Use a função "Add to Steam" do Heroic para enviar um jogo à biblioteca do Steam e, depois, verifique o atalho criado em `~/.local/share/applications/`. Explique o que aquele arquivo `.desktop` contém.
