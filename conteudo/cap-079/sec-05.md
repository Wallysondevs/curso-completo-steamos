Nem todo tipo de automação cabe num serviço systemd ou numa regra udev. Às vezes você quer que um programa abra na área de trabalho assim que o Plasma carregar, ou que um script rode exatamente uma vez na primeira inicialização pós-formatação. O ecossistema de autostart do SteamOS cobre esses casos com o padrão XDG Autostart — arquivos `.desktop` que o ambiente gráfico interpreta — e com hooks tradicionais como `~/.bash_profile` e `~/.profile`. Esta seção mostra quando usar cada um e como evitar que o Deck vire um carnaval de janelas piscando no boot.

:::objetivos
- Dominar o padrão XDG Autostart: arquivos `.desktop` em `~/.config/autostart/`
- Entender a diferença entre autostart da sessão gráfica, autostart do shell e autostart do sistema
- Controlar atraso, condições e visibilidade de programas de autostart
- Usar `~/.profile` e `~/.bash_profile` para scripts de login
- Diagnosticar por que um programa de autostart não aparece ou pisca e some
:::

## Os três pontos de entrada do autostart

Quando você liga o Deck e faz login, três camadas de autostart se sucedem. Cada uma com seu escopo e seu momento:

| Camada | Momento | O que colocar aqui | Exemplo |
|---|---|---|---|
| **Login shell** (`~/.profile`, `~/.bash_profile`) | login do usuário (antes do GUI) | variáveis de ambiente, aliases, path, agentes de chave | export PATH, ssh-agent |
| **Systemd de usuário** (`default.target`) | após login, antes/paralelo ao GUI | serviços e timers (seção 3) | syncthing.service |
| **XDG Autostart** (`~/.config/autostart/`) | sessão gráfica pronta (Plasma) | apps com janela, ícones na bandeja | Steam, Discord, Konsole |

A ordem importa: se seu script XDG Autostart depende de uma variável exportada no `~/.profile`, a variável já está lá quando a sessão sobe. Mas se depende de um serviço systemd que só termina de iniciar depois do Plasma, pode não estar — o systemd e o Plasma sobem em paralelo.

```terminal
$ cat ~/.bash_profile
# .bash_profile — executado no login shell
[[ -f ~/.bashrc ]] && . ~/.bashrc
export EDITOR=nano
export STEAMAPPS=~/.local/share/Steam/steamapps
```

:::info
No SteamOS, o KDE Plasma inicia uma sessão Wayland (via `startplasma-wayland`), que por sua vez lê `~/.config/autostart/`. Se você trocar manualmente para X11, o Plasma ainda lê os mesmos arquivos. A diferença é que no Wayland alguns apps que dependem de XWayland podem atrasar ou piscar — mais sobre isso adiante.
:::

## Arquivos XDG Autostart: o padrão `.desktop`

Cada item de autostart é um arquivo `.desktop` — o mesmo formato que os lançadores do menu de aplicativos. O mínimo:

```terminal
$ cat ~/.config/autostart/konsole.desktop
[Desktop Entry]
Type=Application
Name=Konsole (Autostart)
Exec=konsole
```

Salve, e na próxima sessão do Plasma o Konsole abre. Simples assim.

Mas esse arquivo mínimo esconde uma sutileza: sem `Hidden` e `X-KDE-autostart-condition`, ele abre **toda vez**, mesmo se você fechou o Konsole manualmente na sessão anterior. Para controle fino, o padrão oferece mais chaves:

```terminal
$ cat ~/.config/autostart/dolphin-autostart.desktop
[Desktop Entry]
Type=Application
Name=Dolphin no boot
Exec=dolphin --split ~/Downloads
Terminal=false
StartupNotify=false
X-KDE-autostart-condition=ksmserver
```

As chaves que importam:

| Chave | Valores | Efeito |
|---|---|---|
| `Hidden` | `true`/`false` | desativa sem apagar o arquivo |
| `Terminal` | `true`/`false` | abre em terminal (para scripts CLI) |
| `StartupNotify` | `true`/`false` | mostra ou suprime o "cursor ocupado" |
| `X-KDE-autostart-condition` | `ksmserver` | só inicia na restauração de sessão, não no boot limpo |
| `TryExec` | caminho para binário | se não existir, pula silenciosamente |

`TryExec` é particularmente útil no SteamOS: garante que o autostart só tenta abrir se o programa existe, evitando erros em sistemas recém-formatados ou após desinstalar algo.

## Atraso e ordem: duas abordagens

O Plasma carrega todos os `.desktop` do autostart em paralelo, mas às vezes você precisa que um espere o outro. Há dois caminhos:

**Caminho 1: `X-KDE-autostart-phase`.** O Plasma 5/6 permite fases de autostart (0, 1, 2). Apps na fase 0 carregam antes dos da fase 1, que carregam antes dos da fase 2:

```terminal
X-KDE-autostart-phase=1
```

**Caminho 2: delay no próprio script.** Mais universal (funciona em qualquer DE) e mais controlado:

```terminal
$ cat ~/.config/autostart/delayed-script.desktop
[Desktop Entry]
Type=Application
Name=Script com delay
Exec=bash -c "sleep 5 && /home/deck/bin/late-startup.sh"
```

Ou, se preferir encapsular:

```terminal
$ cat ~/bin/late-startup.sh
#!/bin/bash
set -euo pipefail
sleep 3
# coisas que precisam da rede e do desktop prontos
```

A combinação `sleep 5` + script dedicado é mais portável e permite testar o script sozinho sem passar pelo autostart. A desvantagem é que o `sleep` é um chute — não é garantia de nada, só de atraso.

:::dica
Para esperar uma condição real em vez de `sleep`, use um loop com timeout: `for i in {1..30}; do if curl -s http://localhost:8384/rest/system/status >/dev/null 2>&1; then break; fi; sleep 2; done`. Isso espera até 60 segundos pelo Syncthing estar respondendo — bem mais robusto que `sleep 30`.
:::

## Autostart condicional: nem sempre, nem nunca

Às vezes você quer que um script rode só em certas condições. O `~/.config/autostart/` aceita lógica condicional se o `Exec` for um script que testa o ambiente:

```terminal
$ cat ~/.config/autostart/smart-launcher.desktop
[Desktop Entry]
Type=Application
Name=Smart Launcher
Exec=~/bin/smart-launcher.sh
```

```terminal
$ cat ~/bin/smart-launcher.sh
#!/bin/bash
# Só abre certos apps se estiver num monitor externo
readonly DISPLAY_PORT=$(kreadconfig5 --file kscreenrc --group "ScreenConnectors" --key "DP-1" 2>/dev/null || echo "")
if [[ -n "$DISPLAY_PORT" ]] && [[ "$DISPLAY_PORT" == *"Enabled"* ]]; then
    # monitor externo conectado — inicia apps de produtividade
    dolphin &
    kate &
else
    # só o Deck — modo portátil
    :
fi
```

O script checa a configuração do KScreen (gerenciador de monitores do Plasma) para decidir se está em dock ou portátil. Esse padrão — script que decide e age — é a maneira mais flexível de ter autostart condicional.

## `.profile` vs `.bash_profile` vs `.bashrc`

O SteamOS (Arch) segue a convenção: `.bash_profile` roda uma vez no login shell; `.bashrc` roda em todo shell interativo (cada terminal aberto). O `.profile` é o fallback genérico (sh) quando `.bash_profile` não existe:

```terminal
$ cat ~/.bash_profile
[[ -f ~/.bashrc ]] && . ~/.bashrc

# Agentes e variáveis de ambiente — só uma vez por sessão
eval "$(ssh-agent -s)" 2>/dev/null || true
export PATH="$HOME/bin:$PATH"
```

Já o `.bashrc` é o lugar de aliases, prompt e funções interativas — coisas que precisam estar em todo terminal, mas que não precisam rodar no login sem terminal:

```terminal
$ cat ~/.bashrc
alias ll='ls -la'
alias update-flatpak='flatpak update -y'
export GPG_TTY=$(tty)
```

:::atencao
Não coloque programas gráficos no `~/.bash_profile`. O login shell roda **antes** do Plasma e não tem display (`$DISPLAY` é vazio). Programas gráficos iniciados ali falharão com "cannot open display". Use o XDG Autostart para tudo que depende de GUI.
:::

## Depurando o autostart

"Eu coloquei o arquivo lá e não abriu." O fluxo de diagnóstico:

```terminal
$ # 1. O arquivo é válido?
$ grep -v '^#' ~/.config/autostart/meu-app.desktop
$ desktop-file-validate ~/.config/autostart/meu-app.desktop

$ # 2. O Exec roda manualmente?
$ bash -c "$(grep '^Exec=' ~/.config/autostart/meu-app.desktop | cut -d= -f2-)"

$ # 3. Hidden não está true?
$ grep 'Hidden' ~/.config/autostart/meu-app.desktop

$ # 4. O que o Plasma registrou?
$ journalctl --user -b -g autostart --no-pager
```

O `desktop-file-validate` (parte do pacote `desktop-file-utils`, presente no SteamOS) aponta erros de sintaxe. O journal geralmente registra quando um autostart falha ou é pulado.

Erros comuns:

| Sintoma | Causa |
|---|---|
| Não abre, sem erro | `Hidden=true`, ou `TryExec` apontando binário ausente |
| Pisca e some | app abriu e fechou sozinho (rode o `Exec` no terminal para ver o erro) |
| Abre mas sem ícone na bandeja | faltou `StartupNotify=false` ou o app não oferece bandeja |
| Abre duplicado | sessão do Plasma restaurou + autostart abriu de novo |

## Autostart mínimo de um Deck produtivo

Exemplo de um conjunto enxuto de autostart para um Steam Deck usado também como desktop:

```terminal
$ ls ~/.config/autostart/
01-nextcloud-client.desktop
02-syncthingtray.desktop
03-kitty-terminal.desktop

$ cat ~/.config/autostart/01-nextcloud-client.desktop
[Desktop Entry]
Type=Application
Name=Nextcloud (Background)
Exec=nextcloud --background
TryExec=/usr/bin/nextcloud
Hidden=false
StartupNotify=false
```

A numeração no prefixo do nome não é parte do padrão, mas o Plasma lê os arquivos em ordem alfabética — e muitos usuários usam prefixos (`01-`, `02-`) para documentar a ordem desejada.

## Resumo

- Três camadas de autostart: login shell (`.profile`/`.bash_profile`), systemd de usuário e XDG Autostart (`.desktop`).
- Arquivos `.desktop` em `~/.config/autostart/` são o padrão para apps GUI; usam o mesmo formato dos lançadores do menu.
- `Hidden`, `TryExec`, `X-KDE-autostart-phase` e condicionais no `Exec` dão controle sobre quando e se um app abre.
- Scripts no `.bash_profile` exportam ambiente; no `.bashrc` definem aliases interativos. Jamais lance GUI no `.bash_profile`.
- `desktop-file-validate` + `journalctl --user -b -g autostart` diagnosticam autostarts quebrados.
- Condicionais no script (não no `.desktop`) são a forma mais flexível de decidir "abre ou não abre".

## Exercícios

1. Crie um autostart mínimo com `Exec=konsole`, reinicie a sessão Plasma e confirme que o Konsole abre. Depois adicione `Hidden=true` e veja que não abre mais.
2. Escreva um script de autostart condicional que detecta se há um monitor externo conectado (`kscreen-doctor -o` ou `kreadconfig5`) e, se houver, inicia um aplicativo diferente do que iniciaria no Deck sozinho.
3. Crie um `.desktop` com `TryExec` apontando para um binário que não existe. O que acontece? O Plasma registra o erro no journal?
4. Compare o `.bash_profile` do usuário `deck` com o `.bashrc`. Identifique o que deveria estar em cada um e mova alguma linha que esteja no lugar errado.
5. **Desafio.** Crie um autostart que usa um loop de polling em vez de `sleep`: espere por uma condição real (ex.: arquivo de lock aparecer, porta TCP aberta) com timeout, e então abra o app. Registre o sucesso ou timeout no journal.