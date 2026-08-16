Até aqui, a automação foi pensada para o modo Desktop ou para rodar em segundo plano de forma invisível. Mas o Steam Deck tem uma segunda identidade: o Gaming Mode, a interface de console construída sobre o compositor Gamescope. Nele não há desktop, não há `notify-send`, e qualquer janela que você tente abrir simplesmente não aparece — ou pior, expulsa o usuário para o desktop. Integrar automação ao Gaming Mode exige conhecer como o Gamescope funciona e que tipos de automação fazem sentido ali. Esta seção fecha esse ciclo.

:::objetivos
- Entender o Gamescope como compositor e como ele encaixa no ciclo de vida do Gaming Mode
- Descobrir quais automações fazem sentido dentro do Gaming Mode e quais são inviáveis
- Usar `steamos-session-select`, `systemctl` e variáveis de sessão para detectar e transicionar modos
- Integrar scripts ao ciclo "jogo aberto / jogo fechado" no Steam
- Implementar notificações e persistência que funcionem em ambos os modos

:::

## O que é o Gaming Mode, tecnicamente

O Gaming Mode não é um programa separado — é uma sessão de sistema diferente. Enquanto o Desktop Mode é uma sessão Plasma Wayland, o Gaming Mode é uma sessão Gamescope: um compositor Wayland de tela cheia, otimizado para rodar um único aplicativo (o Steam) com o jogo em foco.

```terminal
$ systemctl status gamescope-session.service
● gamescope-session.service - Gamescope compositing session
     Loaded: loaded (/usr/lib/systemd/system/gamescope-session.service; static)
     Active: active (running)
```

A transição entre `steam-rt`/desktop e `gamescope` é feita por um selector de sessão:

```terminal
$ steamos-session-select plasma      # vai para o Desktop Mode
$ steamos-session-select gamescope   # vai para o Gaming Mode
```

A consequência prática para automação: quando você está no Gaming Mode, **o systemd de usuário ainda está rodando** (como vimos na seção 1), mas a **sessão gráfica é outra**. Não há desktop, não há bandeja, e `notify-send` fala com um servidor de notificações que não existe lá.

:::info
O Gamescope é o mesmo componente usado pelo modo de jogo das sessões e pelo Steam Big Picture em outros dispositivos. Ele roda o Steam como um cliente Wayland e aplica recursos como troca de taxa de atualização, HDR e upscaling FSR. Entender isso é chave: qualquer automação "visual" precisa falar a língua do Gamescope, não a do Plasma.
:::

## O que funciona (e o que não funciona) no Gaming Mode

Antes de escrever qualquer automação, classifique o que faz sentido:

| Tipo de automação | No Gaming Mode | Nota |
|---|---|---|
| Serviço/timer systemd de fundo | ✅ | invisível, roda nos dois modos |
| Script que loga em arquivo/journal | ✅ | sem interface necessária |
| `notify-send` | ❌ | não há servidor de notificação |
| Abrir janela/app gráfico | ❌ | expulsaria para o desktop |
| Interagir com o Steam/jogo | ⚠️ | limitado, via APIs e DB |
| Detectar qual modo está ativo | ✅ | via sessão/variáveis |

A regra prática: no Gaming Mode, automação é **invisível e reativa** — monitorar, logar, reagir a estado — não "abrir um programa". Qualquer coisa que precise de tela ou de interação do usuário pertence ao Desktop Mode.

```terminal
$ # detectar o modo de sessão atual
$ echo $XDG_SESSION_TYPE
wayland
$ loginctl show-session $(loginctl | awk '/deck/ {print $1; exit}') -p Type
Type=wayland
```

Nas sessões Gamescope, `XDG_SESSION_TYPE` também é `wayland`, então essa variável não distingue os modos. Um discriminador mais confiável é checar o compositor ou a presença do processo gamescope:

```terminal
$ pgrep -x gamescope >/dev/null && echo "Gaming Mode" || echo "Desktop Mode"
Gaming Mode
```

Ou, mais robusto, o nome da sessão do display:

```terminal
$ loginctl list-sessions --no-legend | awk '{print $1}' | while read s; do
    loginctl show-session "$s" -p Desktop 2>/dev/null | grep -q gamescope && echo "gamescope ativo"
  done
```

## Detectando o modo dentro de um script

Um serviço de automação frequentemente precisa saber em qual modo está para se comportar corretamente. Encapsule isso numa função reutilizável:

```terminal
$ cat ~/bin/is-gaming-mode
#!/bin/bash
# Sai 0 se estiver no Gaming Mode (gamescope), 1 caso contrário
pgrep -x gamescope >/dev/null 2>&1
```

```terminal
$ cat ~/bin/mode-aware-task.sh
#!/bin/bash
set -euo pipefail

if ~/bin/is-gaming-mode; then
    echo "[mode-aware] Gaming Mode: fazendo trabalho silencioso"
    # fluxo invisível: logar, sincronizar, monitorar
else
    echo "[mode-aware] Desktop Mode: pode notificar na GUI"
    notify-send "Task concluída" "Rodando no Desktop Mode" 2>/dev/null || true
fi
```

Essa bifurcação — "se gamescope, silencioso; senão, notifica" — é o padrão mais útil para um script que serve aos dois modos.

## Reagindo ao ciclo de jogo

O Steam não expõe hooks oficiais de "jogo abriu" / "jogo fechou", mas o estado dos jogos é rastreável por duas vias: o processo (`steam` + `reaper`) e o banco de dados local do Steam. Um monitor simples via polling:

```terminal
$ cat ~/bin/game-monitor.sh
#!/bin/bash
set -euo pipefail

# Processos de jogo típicos aparecem sob gamescope/steam quando um app roda
detect_running_game() {
    # steamwebhelper/steam sempre rodam; procuramos processos de jogo
    pgrep -f "steamapps/common" >/dev/null 2>&1
}

prev=0
while true; do
    if detect_running_game && [[ $prev -eq 0 ]]; then
        echo "[game-monitor] JOGO INICIADO: $(date '+%H:%M:%S')"
        prev=1
    elif ! detect_running_game && [[ $prev -eq 1 ]]; then
        echo "[game-monitor] JOGO FECHADO: $(date '+%H:%M:%S')"
        prev=0
    fi
    sleep 5
done
```

O polling por `steamapps/common` é uma heurística (vista também em capítulos de saves): detecta quando um jogo instalado ali está em execução. Não é perfeito — joga com binários fora dali, ou o próprio `steam` em casos raros — mas cobre o fluxo mais comum. Para precisão máxima, consulte a API do Steam local (o cliente expõe estado via `steam` + `-applaunch`/logs), mas a heurística de processo já resolve a maioria dos casos.

Embrulhe como serviço de usuário para que rode nos dois modos, sempre:

```terminal
$ cat ~/.config/systemd/user/game-monitor.service
[Unit]
Description=Monitora o ciclo de abertura/fechamento de jogos

[Service]
Type=simple
ExecStart=%h/bin/game-monitor.sh
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

```terminal
$ systemctl --user daemon-reload
$ systemctl --user enable --now game-monitor.service
$ journalctl --user -u game-monitor.service -f
```

## Hooks de jogo para automação de segunda natureza

Com um monitor rodando, você pode encadear consequências automáticas ao abrir/fechar jogos — o mesmo conceito de "hooks" que aparece na automação de saves, mas generalizado:

- **Ao abrir jogo:** desligar notificações, mudar perfil de energia (`powerprofilesctl`), subir prioridade de processo.
- **Ao fechar jogo:** disparar backup de saves, sincronizar nuvem, restaurar perfil.

```terminal
$ cat ~/bin/game-hooks.sh
#!/bin/bash
set -euo pipefail

on_game_start() {
    echo "[hooks] Jogo iniciado — aplicando perfil de jogo"
    # perfil de desempenho (se o deamon estiver disponível)
    command -v powerprofilesctl >/dev/null 2>&1 && \
        powerprofilesctl set performance 2>/dev/null || true
}

on_game_stop() {
    echo "[hooks] Jogo fechado — rodando pós-jogo"
    # dispara backup (serviço/timer) e sincronização
    systemctl --user start backup.service 2>/dev/null || true
}

on_game_start
sleep_until_game_closes
on_game_stop
```

O problema do `powerprofilesctl`: no SteamOS, o gerenciamento de energia é controlado pelo Gamescope/Steam e pela Valve, não pelo `power-profiles-daemon` padrão. Mudar perfil de energia manualmente pode brigar com o sistema. A lição: **em automação de Gaming Mode, prefira integrar com as ferramentas da Valve em vez de sobrescrevê-las**.

:::atencao
Não lute contra o gerenciamento de energia e frequência da Valve. O Gaming Mode ajusta clocks, TDP e frame pacing de forma agressiva e dinâmica. Scripts que mexem em `cpupower`, `gamemode` ou TDP pelo usuário podem causar gagueira, superaquecimento ou conflito com o Gamescope. Automação de Gaming Mode deve trabalhar **ao redor** do jogo (saves, logs, backup), não dentro do pipeline de renderização.
:::

## Notificações que sobrevivem aos dois modos

Como não há `notify-send` no Gaming Mode, como avisar o usuário de algo importante? Opções em ordem crescente de complexidade:

1. **Arquivo de status lido na próxima ida ao Desktop:** simples e robusto. O script escreve um flag; um autostart no Desktop o lê e notifica.

```terminal
$ # no script (qualquer modo)
$ echo "disco crítico: 92%" > ~/.config/autostart/pending-alerts.txt

$ # no Desktop Mode, um autostart lê e exibe
$ cat ~/bin/read-pending-alerts.sh
#!/bin/bash
f=~/.config/autostart/pending-alerts.txt
[[ -s "$f" ]] && notify-send -u critical "Alertas pendentes" "$(cat "$f")" && rm -f "$f"
```

2. **`steamos-notification` / DBus do Steam:** versões do SteamOS expõem notificações via DBus que aparecem como toasts no Gaming Mode. A API não é estável entre versões, então trate como experimental.

3. **Ligado ao timer de manutenção:** o alerta de disco cheio (seção 6) pode, em vez de `notify-send`, escrever no arquivo de alertas pendentes — e o Desktop os exibe na próxima vez.

A opção 1 é a mais confiável e não depende de nenhuma API interna da Valve.

## Orquestrando a troca de modo

Você pode automatizar a própria troca entre modos para cenários como "ao conectar no dock, ir para o Desktop; ao desconectar, voltar ao Gaming Mode". Isso une udev (seção 4) + selector de sessão:

```terminal
$ cat ~/bin/dock-mode-switch.sh
#!/bin/bash
set -euo pipefail

# chamado pela regra udev ao conectar/desconectar o dock
if [[ -e /sys/class/drm/card0-DP-1/status ]] && \
   [[ "$(cat /sys/class/drm/card0-DP-1/status)" == "connected" ]]; then
    echo "[dock] monitor externo conectado — indo para Desktop Mode"
    steamos-session-select plasma
fi
```

:::dica
Transições automáticas de sessão podem ser bruscas: o usuário pode estar no meio de um jogo. Antes de trocar de modo automaticamente, checar se há um jogo em execução (com o monitor da seção anterior) e abortar a troca se houver é uma cortesia essencial.
:::

## Resumo

- O Gaming Mode é uma sessão Gamescope (compositor Wayland de tela cheia); o systemd de usuário roda nele, mas não há desktop nem `notify-send`.
- A regra: no Gaming Mode, automação é invisível e reativa; janela e notificação GUI são privilégio do Desktop Mode.
- `pgrep -x gamescope` (encapsulado em `is-gaming-mode`) é o discriminador confiável de modo.
- O ciclo de jogo é rastreável por polling de processos; pode-se montar "hooks" de abrir/fechar jogo para backup e perfis.
- Não se deve sobrescrever o gerenciamento de energia/clock da Valve; trabalhe ao redor do jogo.
- Alertas que valem nos dois modos usam um arquivo de status escrito em qualquer modo e lido/notificado no Desktop.

## Exercícios

1. Entre no Gaming Mode e, via SSH, rode `pgrep -x gamescope` e `systemctl --user status`. Confirme que o gamescope está ativo e o systemd de usuário rodando.
2. Escreva o `is-gaming-mode` e um script `mode-aware` que bifurque comportamento (silencioso vs. notificação). Teste nos dois modos.
3. Instale o `game-monitor.service`, abra e feche um jogo, e acompanhe o `journalctl --user -u game-monitor.service -f`. As transições foram detectadas?
4. Implemente o fluxo de alertas pendentes: um script que escreve `pending-alerts.txt` e um autostart no Desktop que o lê e notifica. Teste o ciclo completo.
5. **Desafio.** Combine udev + selector de sessão: crie uma regra que, ao conectar um monitor externo, dispare um script que só troca para o Desktop se nenhum jogo estiver rodando. Documente as checagens de segurança que você adicionou.
