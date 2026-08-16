Além das grandes lojas, existe um ecossistema vibrante de distribuidoras menores que vendem jogos DRM-free, bundles beneficentes e títulos independentes que nunca chegaram à Steam. Itch.io e Humble Bundle são as duas principais, mas há também a Zoom Platform, a IndieGala, a Fanatical e a própria loja do Lutris. Cada uma tem sua peculiaridade no Steam Deck.

:::objetivos
- Instalar o cliente itch.io nativo para Linux e gerenciar jogos offline
- Resgatar bundles da Humble Bundle e instalar via Lutris
- Navegar pela Zoom Platform e IndieGala no Steam Deck
- Gerenciar bibliotecas fragmentadas com uma estrutura de diretórios única
- Automatizar a extração e organização de jogos DRM-free de múltiplas fontes
:::

## Itch.io: o paraíso indie com cliente nativo

O itch.io é a maior plataforma de jogos independentes do mundo. Diferente da Epic e da GOG, o itch.io tem um cliente nativo para Linux — e ele funciona bem no Steam Deck. Instale pelo Discover:

```terminal
$ flatpak install flathub io.itch.itch
$ flatpak run io.itch.itch
```

O cliente itch.io é leve, baseado em Electron, e gerencia downloads, atualizações e execução de jogos. Ele detecta automaticamente se o jogo tem build nativa para Linux e a prefere; se não, baixa a versão Windows e a executa com Wine internamente (usando o `itch-wine`).

```terminal
$ ls ~/.itch/
apps/   bundles/   butler/   dlcs/   itch.db
$ ls ~/.itch/apps/
celeste/   a-short-hike/   into-the-breach/
```

O banco SQLite `itch.db` armazena sua biblioteca. O cliente itch também funciona como gerenciador de atualizações — ele verifica periodicamente se há novas builds dos jogos instalados.

:::dica
Muitos desenvolvedores no itch.io distribuem builds Linux e Windows lado a lado. Se um jogo tem build nativa, o itch a prefere. Se você quiser forçar a versão Windows (para usar Proton com DXVK, por exemplo), vá nas configurações do jogo no cliente e troque a plataforma.
:::

## Jogos itch.io sem o cliente

O itch.io permite baixar os jogos pelo navegador sem instalar cliente nenhum. As builds vêm em `.zip` ou `.tar.gz` — extraia e execute. Essa é a abordagem mais leve para o Steam Deck e a que dá mais controle.

```terminal
$ mkdir -p ~/Games/itch
$ cd ~/Games/itch
$ unzip ~/Downloads/celeste-linux.zip -d celeste/
$ chmod +x celeste/Celeste.sh
$ ./celeste/Celeste.sh
```

Depois de testado, crie um `.desktop` ou adicione como jogo não-Steam. O itch.io também fornece uma chave de API que permite baixar jogos por linha de comando com o `butler` (a ferramenta de linha de comando do itch):

```terminal
$ butler login
Enter your itch.io API key: ********************************
$ butler download user/game-slug ~/Games/itch/game-slug/
Downloading 45/45 files (230 MiB)...
Done.
```

O `butler` é a maneira mais rápida de baixar jogos itch.io em scripts e automatizações.

## Humble Bundle: bundles, Trove e Choice

A Humble Bundle opera em três modalidades:

- **Bundles**: pacotes temáticos com preço mínimo. Você recebe chaves Steam (na maioria) e links para download DRM-free. As chaves Steam você sabe usar; os downloads DRM-free vêm como `.zip`, `.tar.gz` ou instaladores `.sh`.
- **Humble Trove**: biblioteca de jogos DRM-free exclusiva para assinantes Humble Choice. São dezenas de jogos indie com download direto, sem chave — baixe o arquivo e jogue.
- **Humble Choice**: assinatura mensal que dá ~8 jogos por mês, quase sempre chaves Steam.

O ponto fraco da Humble no Steam Deck é que não há cliente nativo. Você acessa o site, baixa os arquivos e gerencia manualmente.

```terminal
$ ls ~/Games/humble/
trove/    bundles/    choice/
$ ls ~/Games/humble/trove/
wizard-of-legend/     mind-scanners/     moonscars/
```

:::exemplo
Para jogos da Humble Trove, o fluxo ideal é: baixar pelo navegador → extrair → criar `.desktop` → adicionar à Steam. Para bundles com dezenas de jogos, use o Lutris para gerenciar as instalações — ele tem integração com Humble Bundle e puxa sua biblioteca automaticamente após login.
:::

## Zoom Platform, IndieGala, Fanatical

A **Zoom Platform** é uma loja focada em jogos DRM-free, muitos deles clássicos restaurados. O cliente é Windows-only, mas os instaladores baixados são independentes. No Steam Deck, baixe pelo navegador e instale com o Lutris.

A **IndieGala** vende bundles e jogos individuais. A maioria das compras fornece chaves Steam, então o fluxo é padrão. Os downloads DRM-free, quando disponíveis, vêm como `.zip` ou instalador.

A **Fanatical** (antiga Bundle Stars) é similar — majoritariamente chaves Steam, ocasionalmente downloads diretos.

Para todas elas, a estratégia no Steam Deck é a mesma:

```terminal
$ tree ~/Games/ -L 1
~/Games/
├── epic/
├── gog/
├── humble/
├── itch/
├── lutris/
├── amazon/
├── steam/      # symlink para jogos Steam já instalados
└── outros/     # zoom, fanatical, indiegala
```

Uma árvore de diretórios consistente torna mais fácil encontrar, fazer backup e recriar sua biblioteca.

:::nota
A Zoom Platform usa instaladores customizados com criptografia própria. O `innoextract` não funciona com eles. Nesses casos, instale via Wine/Proton como jogo não-Steam e depois mova o prefixo para sua estrutura `~/Games/`.
:::

## Script de organização: `organize-drms.sh`

Conforme sua biblioteca DRM-free cresce, manter tudo organizado manualmente vira um problema. Um script ajuda:

```bash
#!/bin/bash
# organize-drms.sh — organiza downloads DRM-free por fonte
BASE="$HOME/Games"
mkdir -p "$BASE"/{gog,itch,humble,trove,outros}

for zip in "$HOME"/Downloads/*.zip; do
    [ -e "$zip" ] || continue
    echo "Encontrado: $zip"
    read -p "Fonte (gog/itch/humble/trove/outros)? " fonte
    read -p "Nome do jogo? " nome
    mkdir -p "$BASE/$fonte/$nome"
    unzip "$zip" -d "$BASE/$fonte/$nome"
    echo "$(date): $nome → $fonte" >> "$HOME/Documents/games-log.txt"
done
```

Guarde esse script em `~/bin/organize-drms.sh` e execute-o sempre que baixar jogos novos pelo navegador.

```terminal
$ bash ~/bin/organize-drms.sh
Encontrado: /home/deck/Downloads/celeste-linux.zip
Fonte (gog/itch/humble/trove/outros)? itch
Nome do jogo? celeste
Archive: /home/deck/Downloads/celeste-linux.zip
  inflating: celeste/Celeste.sh
  inflating: celeste/data/game.dat
...
$ cat ~/Documents/games-log.txt
2025-01-15 14:22: celeste → itch
```

## Resumo

- O itch.io tem cliente nativo Linux (Flatpak) e CLI (`butler`); prefira o cliente para conveniência, a CLI para automação
- A Humble Bundle opera com chaves Steam e downloads DRM-free; gerencie os DRM-free em `~/Games/humble/`
- Lojas menores (Zoom Platform, IndieGala, Fanatical) seguem o mesmo padrão: baixe, extraia, crie `.desktop`
- Mantenha uma árvore de diretórios consistente em `~/Games/` com subpastas por loja
- Scripts de organização evitam que sua biblioteca DRM-free vire um caos de arquivos espalhados

## Exercícios

1. Instale o cliente itch.io pelo Discover e faça login. Instale um jogo gratuito e execute-o. O cliente detectou a build Linux automaticamente?
2. Acesse o Humble Bundle pelo navegador. Se você for assinante Choice, entre no Trove e baixe um jogo DRM-free. Extraia, execute e adicione à Steam.
3. Use o `butler` para baixar um jogo do itch.io por linha de comando. Compare o tempo de download com o cliente gráfico.
4. Crie a árvore `~/Games/{gog,itch,humble,trove,outros}` e mova todos os seus jogos DRM-free existentes para as pastas corretas.
5. **Desafio.** Escreva um script que varre `~/Games/` e gera um arquivo `inventory.json` com: nome do jogo, loja de origem, caminho do executável, tamanho em disco e data da última modificação. Use `jq` para formatar o JSON. Agende esse script com `systemd-timer` para rodar semanalmente.