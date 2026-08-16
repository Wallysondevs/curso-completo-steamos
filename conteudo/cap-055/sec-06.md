No SteamOS, a porta de entrada para instalar software fora da loja Steam é o **Flatpak**, e todo o estado dele — apps, runtimes e configurações — vive em `~/.local`. Esse diretório é a segunda metade da dupla que faz o Steam Deck funcionar: se `~/.steam` cuida dos jogos, `~/.local` cuida das aplicações de desktop, dos saves de jogos nativos e dos dados de qualquer programa que você instalar no modo desktop.

:::objetivos
- Entender o papel do padrão XDG na organização de `~/.local`
- Localizar aplicações Flatpak instaladas e seus runtimes
- Distinguir saves de jogos nativos dentro de `~/.local/share`
- Identificar os arquivos `.desktop` que povoam o menu de aplicações
:::

## O padrão XDG e a árvore de ~/.local

O `~/.local` segue a especificação **XDG Base Directory**, o mesmo padrão que organiza `.config` e `.cache`. Dentro dele, a convenção define três ramos principais, cada um com uma missão clara:

```terminal
$ ls ~/.local
bin/     share/     state/
```

| Ramo | Função |
|---|---|
| `bin/` | Executáveis do próprio usuário (no `$PATH`) |
| `share/` | Dados de aplicação: apps, icons, saves, Flatpak |
| `state/` | Estado mutável (logs, histórico) que não deve ser sincronizado |

O `share` é de longe o mais importante no Steam Deck, pois abriga `~/.local/share/applications` (os atalhos do menu), `~/.local/share/Steam` (dados de jogos nativos) e `~/.local/share/flatpak` (os aplicativos Flatpak instalados por usuário).

## Aplicações Flatpak em ~/.local/share/flatpak

O Flatpak tem dois escopos de instalação: *system* (em `/var/lib/flatpak`, para todos os usuários) e *user* (em `~/.local/share/flatpak`, só para o `deck`). No Steam Deck, a instalação por usuário é a mais comum no modo desktop. Veja o que há dentro:

```terminal
$ ls ~/.local/share/flatpak
app/          exports/      overrides/    repo/
runtime/      exports/      overrides/    repo/
```

- `app/` — os aplicativos instalados (um subdiretório por AppID, ex.: `org.mozilla.firefox/`).
- `runtime/` — os runtimes que servem de base para os apps (org.freedesktop.Platform, org.kde.Platform).
- `exports/` — atalhos `.desktop` e ícones expostos para o sistema.
- `overrides/` — permissões sobrescritas por app.
- `repo/` — o repositório OSTree local do Flatpak.

Para listar os apps instalados de forma legível, use o próprio `flatpak`:

```terminal
$ flatpak list --user
Name               Application ID                Version   Branch
Firefox            org.mozilla.firefox           126.0      stable
Lutris             net.lutris.Lutris             0.5.17     stable
ProtonUp-Qt        net.davidotek.pupgui2         2.9.1      stable
```

O `flatpak list --user` mostra nome, AppID, versão e branch de cada aplicação no escopo do usuário. Compare com `flatpak list --system` para ver o que foi instalado globalmente.

:::dica
Um AppID é um identificador reverso de DNS (ex.: `org.mozilla.firefox`) e é o nome do subdiretório em `flatpak/app/`. Saber o AppID permite inspecionar, atualizar ou remover um app específico: `flatpak info org.mozilla.firefox`.
:::

## Saves de jogos nativos em ~/.local/share/Steam

Jogos *nativos* (Linux) não usam Proton nem `compatdata`; eles gravam saves diretamente em `~/.local/share/Steam`, seguindo a convenção de dados de aplicação:

```terminal
$ ls ~/.local/share/Steam
steamapps/            userdata/
```

Repare que isso ecoa a estrutura de `~/.steam`, mas é um caminho diferente. Os saves nativos tipicamente caem em pastas como `~/.local/share/Steam/steamapps/compatdata/` **não** — na verdade, muitos jogos nativos colocam saves em subpastas com o nome do jogo, e o Steam Cloud Sync os replica de/para a nuvem a partir daqui.

A regra prática para não se perder:

| Tipo de jogo | Onde fica o save |
|---|---|
| Jogo Proton (Windows) | `~/.steam/steam/steamapps/compatdata/<appid>/pfx/drive_c/users/steamuser/` |
| Jogo nativo (Linux) | `~/.local/share/<NomeDoJogo>/` ou `~/.config/<NomeDoJogo>/` |

Como cada jogo nativo escolhe sua própria pasta, a forma confiável de achar um save é listar os candidatos e procurar pelo nome do jogo ou pelo AppID.

## Arquivos .desktop e o menu de aplicações

Quando você instala um app Flatpak, um atalho aparece no menu do modo desktop. Esse atalho é um arquivo **`.desktop`**, um arquivo de texto no padrão freedesktop que descreve nome, ícone e comando de execução:

```terminal
$ ls ~/.local/share/applications
org.mozilla.firefox.desktop
net.lutris.Lutris.desktop
net.davidotek.pupgui2.desktop
```

O conteúdo é legível e editável:

```terminal
$ cat ~/.local/share/applications/org.mozilla.firefox.desktop
[Desktop Entry]
Name=Firefox
Exec=/usr/bin/flatpak run --branch=stable org.mozilla.firefox %U
Icon=org.mozilla.firefox
Type=Application
Categories=Network;WebBrowser;
```

A linha `Exec` é a chave: ela revela que o "atalho" na verdade invoca `flatpak run` contra o AppID. É por isso que um app Flatpak funciona sem nunca ter tocado em `/usr` — o binário real fica no runtime dentro de `~/.local/share/flatpak`.

:::nota
Se um app Flatpak instalar seus atalhos no escopo *system*, os `.desktop` correspondentes aparecem em `/var/lib/flatpak/exports/share/applications` em vez de `~/.local/share/applications`. A distinção reflete exatamente a diferença entre instalação por usuário e por sistema.
:::

## Resumo

- `~/.local` segue o padrão XDG, com `bin/`, `share/` e `state/`.
- Apps Flatpak por usuário ficam em `~/.local/share/flatpak/app/<AppID>/`.
- O `flatpak list --user` enumera os apps instalados com nome, AppID e versão.
- Saves de jogos nativos ficam em `~/.local/share`, não em `compatdata`.
- Arquivos `.desktop` em `~/.local/share/applications` povoam o menu do modo desktop.

## Exercícios

1. Rode `ls ~/.local/share/` e identifique os subdiretórios que correspondem ao padrão XDG.
2. Execute `flatpak list --user` e `flatpak list --system`. Qual escopo tem mais aplicações no seu Deck?
3. Escolha um AppID da lista e inspecione-o com `flatpak info <appid>`. Qual runtime ele usa?
4. Abra um arquivo `.desktop` com `cat` e interprete a linha `Exec`. O que o comando realmente faz?
5. **Desafio.** Encontre a pasta de save de um jogo nativo listando `~/.local/share` e `~/.config` em busca do nome do jogo. Compare o caminho com o de um save Proton em `compatdata`.