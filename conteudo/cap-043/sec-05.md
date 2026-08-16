Se o Heroic é um canivete para Epic e GOG, o Lutris é um arsenal inteiro. Ele gerencia dezenas de runners (Wine, Proton, DOSBox, ScummVM, RetroArch, browsers para jogos em Flash), tem uma biblioteca comunitária de scripts de instalação que automatizam dependências complexas e roda praticamente qualquer jogo que já existiu — de títulos AAA de 2024 a adventures point-and-click de 1989.

:::objetivos
- Instalar o Lutris no Steam Deck via Flatpak
- Entender o modelo de runners e scripts de instalação
- Instalar jogos da GOG, Epic e itch.io pelo Lutris
- Criar scripts de instalação customizados com YAML
- Integrar jogos do Lutris na Steam com artwork
:::

## O modelo Lutris: runners, plataformas e scripts

O Lutris não instala jogos — ele gerencia **runners** (motores de execução) e **scripts de instalação** (receitas YAML/JSON que dizem como preparar o ambiente). Quando você clica em "Install" num jogo da biblioteca do Lutris, o que acontece é:

1. O script de instalação é baixado do repositório comunitário (lutris.net)
2. O Lutris cria um prefixo Wine isolado para aquele jogo
3. Dependências (DirectX, Visual C++, .NET, fontes) são instaladas automaticamente
4. O executável do jogo é configurado com os argumentos corretos
5. O jogo aparece na biblioteca do Lutris, pronto para lançar

```terminal
$ flatpak install flathub net.lutris.Lutris
$ flatpak run net.lutris.Lutris
$ ls ~/.var/app/net.lutris.Lutris/data/lutris/
runners/  games/  pga.db  runtime/
```

O banco SQLite `pga.db` armazena a biblioteca local de jogos do Lutris. Cada jogo tem um `id` interno, um `runner`, um `directory` e flags de configuração.

:::dica
O Lutris Flatpak inclui todos os runers populares pré-instalados. Para ver a lista: `flatpak run net.lutris.Lutris --list-runners`. Para instalar runners adicionais: `flatpak run net.lutris.Lutris --install-runner <nome>`.
:::

## Instalando jogos de qualquer loja

O Lutris conecta-se às suas contas da GOG, Epic, Humble Bundle e itch.io. Na barra lateral, clique em cada ícone de loja, faça login e sua biblioteca aparece automaticamente. O fluxo de instalação é idêntico para todas: clique no jogo, escolha "Install", revise o script e confirme.

Para jogos GOG, o Lutris baixa o instalador oficial, extrai com `innoextract` (quando possível) e configura o prefixo. Para Epic, ele usa o Legendary internamente — o mesmo backend do Heroic. Para Humble Bundle e itch.io, ele baixa os arquivos diretamente da CDN de cada loja.

```terminal
$ ls ~/Games/lutris/
celeste/           stardew-valley/   hollow-knight/
```

O diretório padrão de instalação é `~/Games/lutris/`, mas você pode mudar nas configurações globais ou por jogo.

:::info
O Lutris mantém uma distinção importante: **jogos Linux nativos** rodam diretamente no sistema, sem Wine. Jogos Windows rodam via runner Wine/Proton. Jogos de consoles antigos rodam via emuladores. O Lutris detecta automaticamente o tipo e escolhe o runner adequado com base no script de instalação.
:::

## Runners: quando usar cada um

O Lutris suporta mais de 20 runners. Os que mais importam no Steam Deck:

| Runner | Para |
|---|---|
| Wine (lutris-7.2) | Jogos Windows em geral, estável |
| wine-ge (lutris) | Jogos Windows com patches recentes |
| Proton (da Steam) | Jogos Windows que funcionam melhor com Proton |
| Linux | Jogos nativos, sem camada de tradução |
| DOSBox | Jogos de MS-DOS |
| ScummVM | Adventures point-and-click clássicos |
| RetroArch | Emulação multi-console |
| Browser | Jogos em HTML5/Flash/Web |

```terminal
$ flatpak run net.lutris.Lutris --list-runners
wine (lutris-7.2-6)          [installed]
wine-ge (lutris-GE-Proton8-26) [installed]
linux                        [installed]
dosbox                       [installed]
scummvm                      [installed]
retroarch                    [installed]
browser                      [installed]
```

Para trocar o runner de um jogo já instalado: clique com botão direito → **Configure** → aba **Runner options**. Você pode mudar de Wine para wine-ge sem reinstalar nada.

## Scripts de instalação: lendo e escrevendo

Os scripts de instalação do Lutris são arquivos YAML. Você pode vê-los antes de instalar — o Lutris mostra o script completo na tela de revisão. Saber ler esses scripts ajuda a diagnosticar problemas e a criar seus próprios.

```yaml
name: Celeste (GOG)
game_slug: celeste-gog
runner: wine
script:
  game:
    exe: drive_c/Games/Celeste/Celeste.exe
    prefix: $GAMEDIR
  installer:
  - task:
      name: create_prefix
      prefix: $GAMEDIR
  - execute:
      command: innoextract -d $GAMEDIR/drive_c/Games/Celeste $installer
  wine:
    version: lutris-7.2-6
    dxvk: true
    vkd3d: true
```

Cada script tem três seções principais: `game` (onde está o executável e o prefixo), `installer` (passos para preparar o ambiente) e `wine` (configurações do runner). A variável `$GAMEDIR` aponta para o diretório de instalação do jogo, e `$installer` é o caminho do arquivo baixado.

:::exemplo
Você comprou um jogo indie no itch.io que não tem script de instalação no Lutris. Crie um script mínimo:

```yaml
name: Meu Jogo Indie
game_slug: meu-jogo-indie
runner: linux
script:
  game:
    exe: $GAMEDIR/start.sh
  installer:
  - extract:
      src: $installer
      dst: $GAMEDIR
```

Salve como `.yml`, vá em Lutris → "+" → "Install from a local install script" e selecione o arquivo.
:::

## Integração com a Steam

Depois de instalado o jogo no Lutris, clique com botão direito → **Create steam shortcut**. O Lutris gera um atalho que o Steam detecta. Mas há um detalhe: o atalho do Lutris invoca o Flatpak, que por sua vez invoca o Lutris, que invoca o runner, que invoca o jogo. Essa cadeia adiciona latência de abertura.

Para um atalho mais direto, você pode extrair a linha de comando real que o Lutris usa:

```terminal
$ flatpak run net.lutris.Lutris --output-script celeste
#!/bin/bash
export WINEPREFIX="/home/deck/Games/lutris/celeste"
export WINE="/home/deck/.var/app/net.lutris.Lutris/data/lutris/runners/wine/lutris-7.2-6/bin/wine"
cd "/home/deck/Games/lutris/celeste/drive_c/Games/Celeste"
"$WINE" "Celeste.exe"
```

Use esse script como `Exec=` no `.desktop` em vez de depender do Lutris como intermediário.

```terminal
$ bash ~/Games/lutris/celeste/launch.sh
```

:::atencao
Se você atualizar o runner Wine no Lutris, o caminho do binário muda. Scripts extraídos manualmente com `--output-script` precisam ser regenerados. Ou você pode apontar para um symlink estável que você mesmo gerencia.
:::

## Resumo

- O Lutris gerencia runners (Wine, DOSBox, emuladores) e scripts de instalação (YAML) que automatizam dependências
- Conecte suas contas GOG, Epic, Humble e itch.io na barra lateral para ver a biblioteca unificada
- Scripts de instalação definem prefixo, dependências e configurações do runner; você pode criar os seus
- O Lutris Flatpak inclui os runners mais populares; use `--list-runners` para ver quais estão disponíveis
- Extraia scripts de lançamento com `--output-script` para criar atalhos Steam mais diretos e rápidos

## Exercícios

1. Instale o Lutris pelo Discover e conecte sua conta da GOG. Instale um jogo leve usando o script da comunidade.
2. Liste os runners instalados com `flatpak run net.lutris.Lutris --list-runners`. Troque o runner de um jogo de Wine padrão para wine-ge e teste.
3. Leia o script de instalação de um jogo antes de instalar. Identifique as seções `game`, `installer` e `wine`.
4. Use `--output-script` para gerar um script de lançamento independente de um jogo Lutris. Execute-o fora do Lutris para confirmar que funciona.
5. **Desafio.** Crie um script de instalação YAML para um jogo que você tenha em instalador offline (ex.: um `.exe` da GOG que não está no repositório do Lutris). Instale via "Install from a local install script", teste, corrija o que falhar e depois submeta o script para o repositório comunitário do Lutris.