A instalação do Heroic é rápida, mas o que faz a diferença no Steam Deck são os detalhes de configuração: escolher o Proton certo por jogo, apontar o caminho do prefixo e garantir que o download não coma o disco errado. Nesta seção você percorre o fluxo completo, do `flatpak install` ao primeiro jogo rodando, passando pela autenticação das duas lojas e pela escolha de runner.

:::objetivos
- Instalar o Heroic pelo Flatpak no SteamOS
- Autenticar contas GOG e Epic dentro do Heroic
- Escolher e gerenciar versões de Proton/Wine por jogo
- Definir onde ficam downloads e prefixos
- Rodar um jogo e confirmar o resultado via disco e CLI
:::

## Instalando e abrindo

O Heroic está no Flathub e instala com um comando simples. Ele não depende de lojas oficiais, então não há pacote da Valve envolvido — é 100% Flatpak, e por isso acompanha o ciclo de release do projeto sem esperar a Valve.

```terminal
$ flatpak install flathub com.heroicgameslauncher.hgl
Looking for matches…
Required runtime for com.heroicgameslauncher.hgl/x86_64/stable (runtime/org.freedesktop.Platform/x86_64/23.08) found in remote flathub
Do you want to install it? [Y/n]: y

 1. com.heroicgameslauncher.hgl  x86_64  stable flathub

Proceed with these changes to the system installation? [Y/n]: y
```

Depois de instalada, a primeira execução abre um assistente que pergunta onde você quer guardar os jogos. O padrão é `~/Games/Heroic`. Aceite o padrão ou aponte para um cartão SD, se tiver espaço limitado no interno — assunto retomado na seção sobre organização.

:::atencao
Por padrão o Flathub instala no escopo do usuário, mas sistemas multiusuário podem pedir escopo `system`. No Steam Deck de uso pessoal isso raramente importa; o que importa é não misturar versões Flatpak antigas instaladas em escopos diferentes, senão aparecem dois Heroic no menu.
:::

## Autenticação das duas lojas

A autenticação abre um navegador embutido (ou uma página no navegador padrão) e usa o fluxo OAuth da própria loja. Para a Epic, você loga com sua conta; para a GOG, idem. O Heroic guarda os tokens em arquivos de configuração dentro do próprio sandbox Flatpak.

```terminal
$ ls ~/.var/app/com.heroicgameslauncher.hgl/config/heroic/
legendaryConfig  gogdlConfig  store  config.json
```

Repare que há um arquivo de configuração separado para cada backend: `legendaryConfig` cuida da Epic, `gogdlConfig` da GOG. Um `store` e um `config.json` guardam o resto. Esse isolamento é proposital: se a Epic falhar, a GOG continua funcionando, e dá para apagar o config de uma loja sem afetar a outra.

:::dica
Tokens de autenticação da Epic expiram de tempos em tempos e o Heroic avisa. Se um jogo da Epic parar de baixar do nada com erro de login, vá em "Log in" e refaça a autenticação antes de mexer em qualquer outra coisa — é o diagnóstico mais comum.
:::

## Escolhendo Proton e Wine por jogo

Antes de instalar, você define (ou deixa o padrão) o runner. O Heroic embute versões de Proton e Wine baixadas automaticamente, e permite escolher por jogo. A tela de instalação mostra uma lista puxada dos "Wine Managers" que o Heroic conhece.

```terminal
$ flatpak run com.heroicgameslauncher.hgl install 2>&1 | head -12
Usage: heroic install [options] <appName>

Install a game or application

Options:
  -p, --platform <platform>        Pick platform (gog/epic)
  -r, --wine-version <version>     Wine/Proton version to use
  -b, --base-path <path>           Installation base path
  --skip-download                  Skip the download
  -h, --help                       display help for command
```

O CLI espelha as opções da interface: `--platform` escolhe a loja, `--wine-version` o runner, `--base-path` o destino. Num uso normal você faz tudo na interface, mas o `--wine-version` revela o quanto essa escolha é central: cada jogo tem a sua.

:::info
O Heroic mantém uma pasta própria de runners dentro do sandbox Flatpak, geralmente em `~/.var/app/com.heroicgameslauncher.hgl/config/heroic/tools/`. Versões Proton-GE baixadas aparecem lá e podem ser reaproveitadas entre jogos, do mesmo jeito que o Lutris reaproveita os runners de Wine.
:::

## Instalando e rodando um jogo

Com loja autenticada e runner escolhido, o fluxo é: buscar o jogo na biblioteca, clicar em "Install", confirmar com "Install" e aguardar. O Heroic baixa via Legendary/gogdl e monta o prefixo automaticamente na primeira execução.

```terminal
$ flatpak run com.heroicgameslauncher.hgl list
Games installed:
  Hollow Knight         epic     Proton - GE-Proton8-25
```

A saída mostra jogo, loja e runner por linha — um resumo fiel do estado da sua biblioteca. Para rodar sem a interface:

```terminal
$ flatpak run com.heroicgameslauncher.hgl launch "Hollow Knight"
```

Depois do primeiro lançamento, o prefixo fica em `~/Games/Heroic/Prefixes/`. Você pode abrir esse prefixo no Bottles ou no `winecfg` para ajustes finos, se precisar.

## Confirmando o que foi criado no disco

Vale inspecionar o resultado para entender a anatomia do Heroic no disco, principalmente antes de fazer backup.

```terminal
$ ls ~/Games/Heroic/
Epic  GOG  Prefixes
$ ls ~/Games/Heroic/Prefixes/
Hollow-Knight
$ ls ~/Games/Heroic/Epic/
HollowKnight
```

Três pastas com papéis distintos: `Epic` e `GOG` guardam os arquivos dos jogos, separados por loja; `Prefixes` guarda os prefixos Wine/Proton, um por jogo. Essa separação é uma das razões de o Heroic ser fácil de fazer backup: você copia `~/Games/Heroic/` inteiro e leva jogos e prefixos juntos.

## Resumo

- O Heroic instala via `flatpak install flathub com.heroicgameslauncher.hgl`.
- Cada loja tem config próprio (`legendaryConfig` para Epic, `gogdlConfig` para GOG).
- A versão de Proton/Wine é escolhida por jogo, na instalação ou em Settings.
- Downloads de jogos ficam em `~/Games/Heroic/Epic` e `~/Games/Heroic/GOG`.
- Prefixos ficam em `~/Games/Heroic/Prefixes/`, um por jogo.
- `heroic list` e `heroic launch` espelham a biblioteca e a execução pela CLI.

## Exercícios

1. Instale o Heroic e rode o assistente da primeira execução, escolhendo um diretório de jogos. Anote onde ficou a pasta.
2. Autentique uma conta da GOG ou Epic e localize os arquivos `legendaryConfig`/`gogdlConfig` no sandbox Flatpak.
3. Instale um jogo gratuito e observe o download acontecer; depois confira `heroic list` e a estrutura em `~/Games/Heroic/`.
4. Troque a versão de Proton de um jogo já instalado em Settings e rode-o de novo pela CLI com `heroic launch`.
5. **Desafio.** Instale o mesmo jogo duas vezes, uma na pasta interna e outra no cartão SD (ou outra pasta), mudando o `--base-path`. Compare o espaço usado e explique, em duas frases, como os prefixos ficam separados dos arquivos do jogo.
