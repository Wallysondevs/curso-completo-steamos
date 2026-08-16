Rodar jogos de Windows no Steam Deck vai muito além do Steam. Existe uma cena inteira de launchers que cuidam de bibliotecas da GOG, Epic Games, itch.io e até de instalações locais que você já tem em disco. O Lutris é o representante mais antigo e completo dessa categoria: um único lugar para somar todas as suas fontes de jogo, coordenar prefixos Wine e aplicar scripts de instalação mantidos pela comunidade. Entender o que ele é — e o que ele não é — evita a frustração de usar a ferramenta errada para o trabalho errado.

:::objetivos
- Entender o papel do Lutris como launcher universal de jogos
- Distinguir runner, fonte de jogo e prefixo Wine
- Identificar quando o Lutris resolve e quando ele complica
- Diferenciar o Lutris dos instaladores manuais de jogo
- Conhecer o papel dos scripts da comunidade no Lutris
:::

## Um launcher, não um emulador

Lutris não executa jogo nenhum por conta própria. Ele é um **launcher** — um gerenciador que organiza seus jogos de diversas origens e dispara outros programas para rodá-los. Esses programas são os chamados **runners**. Um runner pode ser o próprio Wine (para jogos de Windows), o Proton, um emulador como o RetroArch, ou até um navegador para jogos de HTML5.

A genialidade do projeto está em esconder essa complexidade. Em vez de você lembrar que o jogo X precisa de Wine com a flag `--no-sandbox`, que o jogo Y roda nativo e o Z precisa de um prefixo com bibliotecas específicas, o Lutris guarda tudo isso num perfil por jogo. Você clica em "Play" e ele monta o comando certo.

```terminal
$ flatpak info net.lutris.Lutris | head -4

Lutris - Open gaming platform

          ID: net.lutris.Lutris
         Ref: app/net.lutris.Lutris/x86_64/stable
```

O pacote Flatpak é a forma recomendada no Steam Deck: ele isola todos os componentes que o Lutris baixa (Wine, DXVK, drivers de runner) dentro de um sandbox, sem sujar o sistema base imutável do SteamOS.

## Fontes, runners e jogos

Vale separar três conceitos que o Lutris mistura de propósito. A **fonte** (source) é de onde o jogo vem: GOG, Epic, itch.io, uma pasta local ou um instalador `.exe` que você baixou. O **runner** é o motor que executa: Wine, Proton, native Linux, um emulador. O **jogo** é a receita final, que amarra uma fonte a um runner e a uma configuração específica.

Isso explica por que o Lutris "suporta" tanta coisa. Ele não precisa entender cada jogo: ele delega a execução ao runner certo e guarda as configurações. A peça que amarra tudo é o **script de instalação**, escrito em YAML, que diz ao Lutris como instalar e configurar um determinado título.

```terminal
$ lutris --help 2>&1 | head -20
usage: lutris [-h] [-d] [-v] [-l] [-i INSTALLER_FILE | INSTALLER_URL] [-b]
              [-j JSON_FILE] [GAME_SLUG]

Lutris 0.5.17

positional arguments:
  GAME_SLUG             Slug of the game to launch

options:
  -h, --help            show this help message and exit
  -d, --debug           Output debug messages in console
  -v, --version         Print the version and exit
  -l, --list-games      List all games in the library
  -i INSTALLER_FILE | INSTALLER_URL
                        Install a game from a FILE or URL
  -b, --install-binary  Install a game from a file
  -j JSON_FILE          JSON export file to open
```

O comando `lutris --help` já revela o desenho interno: você pode listar a biblioteca (`-l`), instalar a partir de um script (`-i`) ou abrir uma exportação JSON. No uso cotidiano, porém, quase tudo acontece pela interface gráfica — o CLI serve mais para automação e diagnóstico.

## Os scripts de instalação da comunidade

O coração do Lutris é o repositório de scripts de instalação mantido pela comunidade em `lutris/lutris` no GitHub. Cada script descreve passo a passo como um jogo deve ser instalado: qual runner usar, qual versão de Wine, quais winetricks aplicar, onde baixar complementos como o DXVK e qual atalho final criar.

```terminal
$ grep -c "runner" ~/.var/app/net.lutris.Lutris/data/lutris/installers/*.yml 2>/dev/null | head -5
$ ls ~/.var/app/net.lutris.Lutris/
config  data  cache
```

A saída acima mostra a estrutura criada pelo Flatpak do Lutris na sua home: `config` guarda a biblioteca e as preferências, `data` guarda os runners e scripts baixados, e `cache` guarda instaladores temporários. Conhecer esses caminhos importa na hora de limpar, fazer backup ou depurar.

:::nota
Os scripts de instalação são o que torna o Lutris viável para quem não quer virar especialista em Wine. Até 2021, eles eram o atalho padrão para fazer jogos "difíceis" rodarem. Hoje, com a maturidade do Proton e do Heroic, essa função perdeu um pouco de espaço, mas continua sendo a razão de muita gente escolher o Lutris.
:::

## Quando o Lutris é a escolha certa

O Lutris brilha quando você tem muitas perguntas de origem diferentes. Se você mistura jogos nativos de Linux, jogos da itch.io, instaladores `.exe` antigos comprados em lojas que já fecharam e até emuladores, o Lutris concentra tudo numa única biblioteca. O Heroic cobre GOG e Epic; o Lutris cobre "todo o resto".

Ele também é a melhor ferramenta para quem quer controle fino. Você pode editar manualmente as opções de runner de cada jogo, escolher a versão exata de Wine, injetar variáveis de ambiente e configurar saída em controle de jogo — coisas que o Heroic esconde sob uma interface mais enxuta.

:::dica
Quem vem de muitos anos de Linux costuma já ter um histórico de jogos no Lutris. Se esse é seu caso, o arquivo `~/.var/app/net.lutris.Lutris/config/lutris/games/*.yml` contém cada jogo cadastrado, e dá para migrar a biblioteca inteira copiando a pasta config — bom assunto para o capítulo sobre backup de jogos.
:::

A contrapartida é a complexidade percebida. A interface do Lutris expõe mais opções do que o Heroic, o que assusta iniciantes. E a qualidade dos scripts varia: um script popular é excelente, um script obscuro pode estar desatualizado. Saber julgar quando um script presta é metade da habilidade com o Lutris.

## Lutris versus a instalação manual

Para fechar a ideia, vale contrastar o Lutris com o caminho "cru": criar uma pasta, baixar um Wine, apontar o executável e torcer. O manual te ensina muito sobre Wine, mas não escala — cada jogo vira um projeto, cada atualização quebra algo e não há biblioteca central para lembrar o que você instalou.

```terminal
$ ls ~/Games/
game1-prefix   game2-prefix   game3-prefix
$ lutris -l 2>&1
```

A ausência de biblioteca é o problema. Sem o Lutris (ou equivalente), você precisa de convenções próprias de nomes (`game1-prefix`, `game2-prefix`) e memória para lembrar qual prefixo pertence a qual jogo. O Lutris resolve exatamente isso: o nome do jogo, o runner e o prefixo ficam registrados juntos, recuperáveis a qualquer momento e exportáveis em JSON.

## Resumo

- Lutris é um launcher que organiza jogos e delega execução a runners como Wine, Proton e emuladores.
- Um jogo no Lutris amarra uma fonte (GOG, Epic, itch.io, local) a um runner e a uma configuração.
- Os scripts de instalação da comunidade, em YAML, automatizam instalações difíceis.
- O Flatpak `net.lutris.Lutris` isola runners e prefixos do sistema imutável do SteamOS.
- O Lutris é ideal para fontes diversas e controle fino; o Heroic cobre melhor só GOG e Epic.
- `lutris --help`, `-l` (listar) e `-i` (instalar por script) são as opções essenciais de CLI.

## Exercícios

1. Instale o Lutris pelo Flatpak e confirme a instalação com `flatpak info net.lutris.Lutris`. Anote a versão reportada.
2. Rode `lutris --list-games` (ou use a interface) e observe a biblioteca vazia inicial. Liste os runners disponíveis no painel de preferências.
3. Navegue pela interface e localize onde ficam as três categorias: fontes, runners e jogos. Escreva em uma frase o que cada uma faz.
4. Explore a pasta `~/.var/app/net.lutris.Lutris/` e identifique o que há em `config`, `data` e `cache` depois de uma primeira execução.
5. **Desafio.** Sem instalar nada ainda, abra o repositório de scripts do Lutris e escolha um jogo clássico da GOG. Leia o YAML e explique, em três frases, quais runners e complementos (winetricks, DXVK) o script declara e por quê.
