O Flatpak é o sistema de empacotamento que traz aplicativos de desktop ao SteamOS: navegadores, editores, emuladores independentes, o próprio Lutris e o Heroic Games Launcher. Cada app Flatpak carrega junto um **runtime** — uma base de bibliotecas que pode ter centenas de megabytes — e, quando você desinstala um app, o runtime frequentemente fica para trás. Saber limpar Flatpak corretamente recupera gigabytes que você nem sabia que estavam presos.

:::objetivos
- Entender a relação entre aplicativos Flatpak e seus runtimes
- Listar aplicativos, runtimes e dependências instaladas
- Desinstalar aplicativos e remover runtimes que ficaram órfãos
- Usar o `flatpak uninstall --unused` e outras opções de limpeza
- Recuperar espaço de apps Flatpak antigos em `~/.var`
:::

## A camada Flatpak no SteamOS

Embora o SteamOS seja focado em jogos, o Flatpak dá a ele um ecossistema de aplicativos no modo Desktop. Cada app é distribuído num formato imutável (OSTree), com versões e atualizações versionadas. Isso significa que atualizar um app **não apaga** a versão anterior imediatamente — ela fica em cache para permitir rollback. O resultado é que, com o tempo, o diretório de Flatpak engorda:

```terminal
$ du -sh ~/.local/share/flatpak
9.8G   flatpak
```

Desses 9,8 GB, uma boa fração pode ser runtime de apps que você já removeu. É o Flatpak equivalent ao "temp files" do Windows.

## Listando apps e runtimes

O primeiro passo é enxergar o que está instalado, separando aplicativos de runtimes:

```terminal
$ flatpak list --app
Name                  Application ID               Version   Branch
Heroic Games Launcher com.heroicgameslauncher.hgl  2.15.2    stable
Lutris                net.lutris.Lutris            0.5.17    stable
Flatseal              com.github.tchx84.Flatseal   2.2.0     stable

$ flatpak list --runtime
Name               Application ID                Version   Branch
Freedesktop Platf. org.freedesktop.Platform      23.08.21  23.08
Mesa               org.freedesktop.Platform.GL.  24.0.4    23.08
KDE Application    org.kde.Platform              6.6.0     6.6
```

Repare na terceira linha do runtime: `org.freedesktop.Platform.GL` (o driver Mesa). Cada runtime base puxa dependências adicionais, e múltiplas versões do mesmo runtime (`23.08`, `24.08`, `6.6`) podem coexistir — uma para cada app que exige uma versão específica.

## Desinstalando apps e removendo o que sobra

Desinstalar um app Flatpak é direto:

```terminal
$ flatpak uninstall com.heroicgameslauncher.hgl
```

Mas isso **não** remove o runtime que o Heroic trouxe. Para limpar as dependências que ficaram órfãs, o Flatpak tem um comando específico:

```terminal
$ flatpak uninstall --unused
```

O `--unused` analisa todos os runtimes e remove os que nenhum app instalado utiliza mais. É o equivalente exato do `autoremove` do apt, e é o comando mais importante desta seção. Em instalações acumuladas, ele frequentemente libera de 1 a 4 GB:

```terminal
$ flatpak uninstall --unused

        ID                                   Branch        Arch
 1.     org.freedesktop.Platform.GL.default  22.08         x86_64
 2.     org.gnome.Platform                   45            x86_64
 3.     org.kde.Platform                     5.15-23.08    x86_64

Proceed with these changes to the system installation? [Y/n]:
```

:::atencao
O Flatpak pode operar em duas "instalações": `system` (acessível a todos os usuários) e `user` (só você, em `~/.local/share/flatpak`). No SteamOS, apps instalados pelo Discover costumam ir para o `system`, que exige `sudo`. Se o `flatpak uninstall` reclamar de permissão, adicione `sudo` ou use `--user` para mirar a instalação do usuário.
:::

## Apps Flatpak e os dados em ~/.var

Cada app Flatpak guarda seus dados, configurações e caches em `~/.var/app/<ID>/`. Quando você desinstala o app, o `flatpak uninstall` **não** apaga esses dados por padrão — eles ficam como lixo. Para apagar junto:

```terminal
## Desinstala o app E seu diretório de dados
$ flatpak uninstall --delete-data com.heroicgameslauncher.hgl
```

Ou, se você já desinstalou o app mas o `~/.var/app/` ficou, remova manualmente:

```terminal
$ du -sh ~/.var/app/*
4.2G   com.heroicgameslauncher.hgl

$ rm -rf ~/.var/app/com.heroicgameslauncher.hgl
```

:::nota
Alguns gerenciadores de jogos Flatpak — principalmente o Heroic — armazenam os *jogos instalados* e seus prefixos dentro de `~/.var/app/`. Antes de apagar esse diretório, confira se não há títulos instalados ali que você quer manter. O Heroic guarda os jogos em `~/.var/app/com.heroicgameslauncher.hgl/data` por padrão.
:::

## Entendendo o cache de atualização do Flatpak

Além dos runtimes órfãos, o Flatpak mantém um cache de atualizações via OSTree em `~/.local/share/flatpak/repo`. Toda vez que você atualiza um app, a versão anterior do objeto não é removida imediatamente — o OSTree faz garbage collection sob demanda, não automaticamente:

```terminal
$ du -sh ~/.local/share/flatpak/repo
3.1G    repo
```

Desses 3,1 GB, boa parte pode ser objetos não referenciados por nenhum app. Para forçar uma coleta de lixo:

```terminal
$ flatpak repair --user
```

O `flatpak repair --user` varre o repositório local, remove objetos órfãos e reindexa o que ficou. É seguro e pode liberar de 500 MB a 2 GB sem desinstalar nada.

:::info
O `flatpak repair` está disponível a partir do Flatpak 1.12 (presente no SteamOS 3.6). Em versões mais antigas, o equivalente é `ostree prune --repo=~/.local/share/flatpak/repo --refs-only`, mas o `repair` é mais abrangente e recomendado.
:::

## Um fluxo completo de limpeza

Para fechar a seção com uma rotina reproduzível:

```terminal
## 1. Veja o que está instalado
$ flatpak list --app
$ flatpak list --runtime

## 2. Desinstale apps que você não usa (e os dados junto)
$ flatpak uninstall --delete-data <app-id>

## 3. Remova runtimes órfãos
$ flatpak uninstall --unused

## 4. Confirme o espaço liberado
$ du -sh ~/.local/share/flatpak
```

## Resumo

- Cada app Flatpak puxa runtimes que ficam para trás após a desinstalação do app.
- `flatpak list --app` e `--runtime` separam os dois grupos para inspeção.
- `flatpak uninstall --unused` remove runtimes órfãos e é o principal comando de limpeza.
- Dados de apps em `~/.var/app` não são apagados por padrão; use `--delete-data`.
- Flatpak em `system` pode exigir `sudo`; `--user` mira a instalação do usuário.

## Exercícios

1. Liste os apps e runtimes instalados e separe-os em duas listas.
2. Rode `flatpak uninstall --unused` e anote quantos GB de runtimes foram liberados.
3. Verifique o tamanho de `~/.var/app` e identifique diretórios de apps que você não tem mais.
4. Desinstale um app Flatpak que você não usa com `--delete-data` e confirme a remoção dos dados.
5. **Desafio.** Compare o espaço em disco antes e depois de uma rotina completa (`list` → `uninstall` → `unused` → `delete-data`), registrando cada etapa. Depois explique por que desinstalar app *não* é suficiente para liberar espaço.