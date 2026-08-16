Antes de qualquer parser, você precisa do SRM rodando no seu Steam Deck — e há duas maneiras de obtê-lo, cada uma com implicações diferentes para quem usa o sistema imutável do SteamOS. O caminho natural é deixar o EmuDeck cuidar da instalação; o caminho manual é baixar o pacote do SRM e configurar do zero. Esta seção cobre a instalação, o primeiro launch e os ajustes de usuário que você deve fazer uma única vez.

:::objetivos
- Instalar o SRM via Flatpak ou AppImage no SteamOS
- Entender as diferenças entre as duas formas de distribuição
- Fazer o primeiro launch e entender as opções do usuário Steam
- Configurar o caminho da pasta do Steam usada pelo SRM
- Preparar o ambiente para a primeira varredura de ROMs
:::

## Duas formas de instalar

O SRM é distribuído de duas maneiras: como **AppImage** (um arquivo único executável que você baixa e roda) e como **Flatpak** (disponível no Flathub). No Steam Deck, o Flatpak é o caminho de menor atrito, porque o Discover cuida de instalar e atualizar por você, e o EmuDeck já usa essa rota.

```terminal
$ flatpak search steam rom manager
Name            Description                       Application ID
Steam ROM Man…  An app for managing ROMs in Steam  com.steamgriddb.steam-rom-manager
$ flatpak install flathub com.steamgriddb.steam-rom-manager
Required runtime for com.steamgriddb.steam-rom-manager/x86_64/master (org.freedesktop.Platform/x86_64/23.08) found in remote flathub, do you want to install it? [Y/n]: y
```

O identificador oficial é `com.steamgriddb.steam-rom-manager`. Depois de instalar, o SRM aparece no menu de aplicativos do desktop — ou, se você já tiver o EmuDeck, ele o registra para você.

A alternativa AppImage é útil quando você quer uma versão específica ou quando o Flatpak não está disponível:

```terminal
$ wget https://github.com/SteamGridDB/steam-rom-manager/releases/latest/download/steam-rom-manager.AppImage
$ chmod +x steam-rom-manager.AppImage
$ ./steam-rom-manager.AppImage
```

:::nota
O AppImage não "instala" nada no sistema: é um executável autocontido que empacota as dependências junto. A consequência prática é que você é responsável por baixar as atualizações manualmente, enquanto o Flatpak atualiza via Discover.
:::

## O primeiro launch

Ao abrir o SRM pela primeira vez, você cai numa tela de boas-vindas que pede a confirmação de uma configuração sensível: qual **usuário Steam** e qual **caminho da instalação do Steam** o SRM deve usar. Essa etapa importa mais do que parece, porque todos os atalhos e as artes serão gravados dentro da pasta daquele usuário específico.

Se você nunca mexeu nisso, o SRM detecta sozinho e mostra algo como:

```terminal
Steam directory:    ~/.steam/steam
Steam user(s) found: 1
```

No Steam Deck típico há um único usuário, então não há ambiguidade. Ainda assim, confira se o caminho exibido bate com o seu — o usuário `deck` do SteamOS mantém tudo em `/home/deck/.steam/steam`.

```terminal
$ ls -d ~/.steam/steam
/home/deck/.steam/steam
```

O SRM guarda essas preferências num arquivo de configuração próprio, separado do Steam. Depois desse primeiro launch, os ajustes ficam persistentes e você não precisa repeti-los a cada uso.

## A pasta que o SRM grava

Vale entender *onde* o SRM escreve, porque isso aparece em todo o restante do capítulo. Os dois destinos são:

| Destino | Caminho | Conteúdo |
|---|---|---|
| Atalhos | `~/.steam/steam/userdata/<id>/config/shortcuts.vdf` | Lista de itens externos |
| Arte | `~/.steam/steam/userdata/<id>/config/grid/` | Capas, banners e ícones |

O `<id>` é um número identificador do usuário Steam, único por conta. Se houver mais de um usuário, cada um tem sua própria subpasta, e o SRM precisa saber em qual delas escrever. É exatamente por isso que o primeiro launch pergunta o usuário.

```terminal
$ ls ~/.steam/steam/userdata/
367540
$ ls ~/.steam/steam/userdata/367540/config/
grid/  shortcuts.vdf  localconfig.vdf
```

Aqui o usuário tem id `367540` e tanto a pasta `grid/` quanto o `shortcuts.vdf` já existem (o Steam os cria no primeiro login). Se a pasta `grid/` não existisse, o SRM a criaria ao gravar a primeira arte.

:::atencao
O `id` de usuário não é o seu nome de login nem o seu SteamID64 público. É um número interno que o Steam atribui localmente. Não tente adivinhá-lo; deixe o SRM detectá-lo, ou use `ls ~/.steam/steam/userdata/` para vê-lo.
:::

## Primeira varredura de teste

Antes de configurar parsers de verdade, vale fazer um teste mínimo para confirmar que a instalação está íntegra. O SRM tem uma aba de *parsers* vazia por padrão — você precisa adicionar pelo menos um para que a varredura encontre algo. Criaremos o parser completo na próxima seção, mas o teste de sanidade aqui é só confirmar que o SRM enxerga a pasta do Steam e consegue listar o que já existe:

```terminal
$ ls ~/.steam/steam/userdata/367540/config/grid/ | head -5
291550_hero.png
291550_logo.png
291550_p.png
```

Ver você alguns arquivos de arte com nomes no formato `<appid>_<tipo>.png` é o sinal de que o Steam já baixou capas para jogos instalados. O SRM vai escrever arquivos no mesmo formato — essa pasta é o destino final de toda arte que ele encontra.

:::dica
Faça um backup do `shortcuts.vdf` antes da primeira gravação de verdade, mesmo que o arquivo esteja vazio ou quase vazio. Um backup custa uma linha e salva você de reconstruir dezenas de atalhos à mão depois de uma configuração errada:

```terminal
$ cp ~/.steam/steam/userdata/367540/config/shortcuts.vdf ~/shortcuts.vdf.bak
```
:::

## Resumo

- O SRM pode ser instalado como Flatpak (`com.steamgriddb.steam-rom-manager`) ou baixado como AppImage.
- No Steam Deck, o Flatpak via Discover (ou via EmuDeck) é o caminho com menos atrito.
- O primeiro launch pede o usuário Steam e o caminho da instalação, usados para gravar atalhos e arte.
- O SRM escreve em `shortcuts.vdf` (atalhos) e na pasta `grid/` (imagens), ambas sob `userdata/<id>/config/`.
- O `id` de usuário é um número interno, detectável em `~/.steam/steam/userdata/`.
- Uma varredura de teste só encontra algo depois que ao menos um parser é criado.

## Exercícios

1. Instale o SRM via Flatpak e confirme a instalação com `flatpak info com.steamgriddb.steam-rom-manager`. Anote a versão exibida.
2. Identifique o `id` do seu usuário Steam com `ls ~/.steam/steam/userdata/` e liste o conteúdo da pasta `grid/` correspondente.
3. Faça um backup do seu `shortcuts.vdf` atual usando `cp`, como na dica acima, e confira o tamanho do arquivo com `ls -l`.
4. Abra o SRM e localize a configuração de diretório do Steam e de usuário. Confirme se os valores batem com os que você viu no terminal.
5. **Desafio.** Compare as duas formas de distribuição: baixe o AppImage da última release, rode `./steam-rom-manager.AppImage --version` (ou veja `file` no binário) e explique em uma frase por que o Flatpak é preferível num sistema imutável como o SteamOS.
