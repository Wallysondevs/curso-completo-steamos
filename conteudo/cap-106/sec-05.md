O Steam Deck é um console Steam antes de tudo, mas a biblioteca de jogos de qualquer pessoa vai muito além da loja da Valve: Epic Games Store, GOG, Amazon Prime Gaming, jogos antigos, emuladores e títulos que só existem em instaladores `.exe`. A integração desses mundos com a interface Steam — que é o modo como você quer jogar, com gamepad e modo de jogo — depende de um pequeno arsenal de launchers. Esta seção apresenta cada um com o problema que resolve.

:::objetivos
- Instalar e configurar o Heroic Games Launcher para Epic, GOG e Amazon
- Usar o Lutris como plataforma de scripts de instalação e gerenciamento
- Integrar jogos não-Steam com o BoilR para que apareçam com arte na interface Steam
- Entender o SteamTinkerLaunch como canivete suíço de tweaks por jogo
:::

## Heroic Games Launcher: Epic, GOG e Amazon no Deck

O [Heroic Games Launcher](https://heroicgameslauncher.com) é a ponte mais polida entre o Steam Deck e seus jogos nas lojas concorrentes. Ele é um cliente nativo Linux (não um Wine rodando um launcher Windows) que se conecta às APIs da Epic, GOG e Amazon, baixa e gerencia os jogos diretamente. O Heroic integra as versões de Proton/Wine que você já tem e expõe configuração de runner por jogo, igual à Steam.

A instalação é um Flatpak de um clique:

```terminal
$ flatpak install flathub com.heroicgameslauncher.hgl
```

Uma vez logado nas contas, sua biblioteca aparece. Cada jogo pode ser configurado com runner, prefixo e flags de Wine independentemente. O próprio Heroic inclui um gerenciador de Proton/Wine — você pode baixar Proton GE, Wine GE e outros runners sem sair do aplicativo.

:::dica
O Heroic tem um modo "Console" que pode ser ativado nas configurações. Ele simplifica a interface e a deixa navegável com gamepad, o que faz diferença se você prefere usar o Heroic direto no modo de jogo em vez de adicionar cada jogo individual à Steam.
:::

## Lutris: o ecossistema de scripts

O [Lutris](https://lutris.net) é anterior ao Steam Deck e cobre um território que o Heroic não alcança: scripts de instalação comunitários. Enquanto o Heroic baixa jogos de lojas via API, o Lutris executa scripts que os próprios usuários escreveram para instalar e configurar um jogo corretamente — dependências, workarounds, versão exata do Wine. Isso é especialmente útil para jogos antigos, títulos abandonware e instaladores físicos.

A força do Lutris é também sua fraqueza: scripts da comunidade podem estar desatualizados. Verifique a data da última edição do script e leia os comentários antes de confiar.

```terminal
$ flatpak install flathub net.lutris.Lutris
```

Depois de instalado, você navega pelo catálogo de scripts no site [lutris.net](https://lutris.net/games/) ou adiciona jogos manualmente. A integração com a Steam é possível via "Create steam shortcut" dentro do Lutris, mas muitos usuários preferem usar o BoilR (abaixo) para consolidar a arte e o atalho.

:::info
O Lutris também gerencia emuladores via scripts — mas para emulação no Deck, o ecossistema já tem uma ferramenta mais especializada: o EmuDeck, que veremos na seção 6.
:::

## BoilR: enchendo a biblioteca Steam

O problema que o [BoilR](https://github.com/PhilipK/BoilR) resolve é estético e funcional: jogos adicionados manualmente à Steam como "non-Steam game" aparecem sem arte de capa, sem banner e com nome genérico. O BoilR escaneia seus launchers — Heroic, Lutris, emuladores — e os adiciona automaticamente à Steam com a arte correta baixada do SteamGridDB.

```terminal
$ flatpak install flathub io.github.philipk.boilr
```

Uma vez executado, o BoilR detecta automaticamente jogos do Heroic, do Lutris e de emuladores configurados. Você seleciona quais quer importar, e ele cria os atalhos na Steam com a arte baixada. O resultado é que sua biblioteca Steam parece coesa — jogos da Epic e da GOG sentados ao lado dos nativos da Steam, com as mesmas capas e banners.

:::dica
O SteamGridDB ([steamgriddb.com](https://www.steamgriddb.com)) é o repositório de arte que o BoilR consulta. Se um jogo específico está com arte ruim, você pode subir uma arte melhor no SteamGridDB — a comunidade mantém um padrão de qualidade surpreendentemente alto, com assets nos tamanhos exatos que a Steam espera.
:::

## SteamTinkerLaunch: o canivete suíço

O [SteamTinkerLaunch](https://github.com/sonic2kk/steamtinkerlaunch) é uma ferramenta de granularidade extrema. Ele se integra como uma ferramenta de compatibilidade na Steam: você seleciona "SteamTinkerLaunch" como opção na lista de Proton, e ao iniciar o jogo, uma interface de configuração aparece com dezenas de opções — MangoHud, FSR, GameMode, comandos personalizados antes e depois do jogo, e por aí vai.

Ele é útil quando o menu de compatibilidade de um jogo não expõe o que você precisa, mas também é fácil se perder na quantidade de opções. Não é uma ferramenta de uso diário, mas quando você precisa de controle fino — um script que monta um diretório antes do jogo, uma variável de ambiente que só aquele jogo usa — é ela que resolve.

## Resumo

- Heroic conecta Steam Deck às bibliotecas da Epic, GOG e Amazon com cliente nativo.
- Lutris oferece scripts comunitários de instalação, especialmente útil para jogos antigos.
- BoilR adiciona jogos não-Steam à biblioteca Steam com arte correta do SteamGridDB.
- SteamTinkerLaunch é controle fino: variáveis de ambiente, scripts e tweaks por jogo.
- A integração com a interface Steam é o objetivo final de todas essas ferramentas.

## Exercícios

1. Instale o Heroic Games Launcher, conecte sua conta Epic (ou crie uma gratuita, se não tiver) e baixe um jogo gratuito. Adicione-o à Steam usando o atalho do próprio Heroic.
2. Instale o BoilR e escaneie sua máquina. Quantos jogos não-Steam ele encontrou? Importe-os e verifique se as artes de capa foram baixadas corretamente.
3. Navegue pelo [lutris.net](https://lutris.net/games/) e encontre o script de instalação de um jogo clássico que você jogou no passado. Leia o script e identifique que dependências ele instala.
4. Configure o SteamTinkerLaunch como ferramenta de compatibilidade para um jogo, abra o menu de configuração e explore as opções disponíveis. Qual opção você achou mais útil e qual pareceu redundante com o que a Steam já faz?
5. **Desafio.** Pegue um jogo da GOG ou da Amazon (via Heroic), adicione-o com o BoilR, ajuste a arte no SteamGridDB se necessário e execute-o no modo de jogo. Documente o fluxo inteiro em no máximo cinco passos.