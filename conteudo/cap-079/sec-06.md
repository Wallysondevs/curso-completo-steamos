Automação de verdade não é só "rodar na hora certa" — é manter o sistema saudável sem que você precise lembrar. O Steam Deck tem uma peculiaridade: ele é um console que você desliga e suspende o tempo todo, com uma raiz imutável e um disco SSD relativamente pequeno. Isso cria necessidades próprias de manutenção — limpar caches que crescem sem parar, monitorar o espaço em disco, girar logs, checar integridade — e esta seção transforma essas necessidades em um pipeline de manutenção automática com timers systemd e scripts bem comportados.

:::objetivos
- Mapear as tarefas de manutenção que fazem sentido no Steam Deck (caches, shaders, logs, espaço)
- Escrever um `maintenance.sh` que execute limpeza e verificação de forma segura
- Agendar a manutenção com um timer systemd, respeitando os hábitos de suspensão do Deck
- Implementar monitoramento de espaço em disco com alerta por notificação
- Registrar tudo no journal e validar o que foi feito

:::

## O que um Deck precisa manter

O SteamOS, deixado por conta própria, acumula detritos por três frentes:

1. **Shaders e cache do Vulkan/Steam.** O Steam pré-compila shaders em `~/.local/share/Steam/steamapps/shadercache/` e o Mesa guarda cache em `~/.cache/mesa_shader_cache/`. Com o tempo, shaders de jogos desinstalados ficam órfãos.
2. **Caches de navegador e do sistema.** O Steam Web Helper (`steamwebhelper`) e navegadores criam gigabytes de cache em `~/.cache/`.
3. **Logs e arquivos temporários.** Journals, pacotes temporários do desinstalador do Steam, `.xsession-errors` e congêneres.

Além disso, o SSD do Deck (64 GB a 1 TB, dependendo do modelo) enche depressa com jogos grandes + shaders. Monitorar espaço livre é prioridade número um.

```terminal
$ du -sh ~/.cache/ ~/.local/share/Steam/steamapps/shadercache/ 2>/dev/null
4.2G    /home/deck/.cache/
2.8G    /home/deck/.local/share/Steam/steamapps/shadercache/
```

Quase 7 GB só aí, numa máquina onde cada gigabyte conta.

:::atencao
Apagar shader cache tem um custo: os shaders são recompilados na próxima vez que você abrir cada jogo (gagueira inicial e alguns minutos de CPU alta). É uma troca legítima — libera espaço agora, paga em compilação depois. Scripts de limpeza devem **respeitar** isso: limpe o shader cache de jogos desinstalados, não o de jogos ativos, a menos que o espaço esteja crítico.
:::

## O script de manutenção

Um script de manutenção bem desenhado é **idempotente** (pode rodar N vezes sem efeito colateral) e **seguro por padrão** (prefere reportar a apagar). Abaixo, um `maintenance.sh` com estágios separados:

```terminal
$ cat ~/bin/maintenance.sh
#!/bin/bash
set -euo pipefail

log()  { echo "[maintenance] $*"; }
warn() { echo "[maintenance] AVISO: $*" >&2; }

# ------------------------------------------------------------
# ESTÁGIO 1: espaço em disco
# ------------------------------------------------------------
check_disk() {
    log "Verificando espaço em disco..."
    df -h / /home | awk 'NR>1 {print "  " $1, $6, "=", $5, "usado"}'
    local pct=$(df --output=pcent / | tail -1 | tr -dc '0-9')
    if [[ "$pct" -ge 90 ]]; then
        warn "DISCO QUASE CHEIO: ${pct}% usado na raiz (/)."
        return 1
    fi
    log "Espaço OK."
}

# ------------------------------------------------------------
# ESTÁGIO 2: caches seguros de limpar
# ------------------------------------------------------------
clean_safe_caches() {
    log "Limpando caches seguros..."
    # cache de miniaturas do Plasma (reconstruído sob demanda)
    rm -rf ~/.cache/thumbnails/* 2>/dev/null || true
    # arquivos temporários antigos
    find ~/.cache -type f -atime +30 -delete 2>/dev/null || true
    log "Limpeza segura concluída."
}

# ------------------------------------------------------------
# ESTÁGIO 3: shader cache órfão (jogos desinstalados)
# ------------------------------------------------------------
clean_orphan_shaders() {
    log "Procurando shader cache órfão..."
    local shader_root=~/.local/share/Steam/steamapps/shadercache
    [[ -d "$shader_root" ]] || { log "Sem diretório de shadercache."; return 0; }

    local removed=0
    local freed=0
    for appid_dir in "$shader_root"/*/; do
        local appid=$(basename "$appid_dir")
        # AppID presente nos manifestos instalados?
        if ! compgen -G ~/.local/share/Steam/steamapps/appmanifest_*.acf >/dev/null || \
           ! grep -q "\"appid\".*\"$appid\"" ~/.local/share/Steam/steamapps/appmanifest_*.acf 2>/dev/null; then
            local size=$(du -sm "$appid_dir" 2>/dev/null | cut -f1)
            freed=$((freed + size))
            rm -rf "$appid_dir"
            removed=$((removed + 1))
            log "  Removido shader órfão do AppID $appid (${size} MB)"
        fi
    done
    log "Shaders órfãos removidos: $removed (${freed} MB liberados)."
}

# ------------------------------------------------------------
# ESTÁGIO 4: relatório de integridade
# ------------------------------------------------------------
check_integrity() {
    log "Checando integridade do sistema de arquivos..."
    if command -v btrfs >/dev/null 2>&1; then
        sudo -n btrfs device stats / 2>/dev/null | head -5 || \
            warn "Sem acesso sudo para checar btrfs stats (rode com sudo)."
    else
        warn "btrfs não encontrado — pulando checagem de FS."
    fi
}

# ------------------------------------------------------------
# DISPATCHER
# ------------------------------------------------------------
main() {
    case "${1:-all}" in
        disk)     check_disk ;;
        caches)   clean_safe_caches ;;
        shaders)  clean_orphan_shaders ;;
        integrity) check_integrity ;;
        all)
            check_disk
            clean_safe_caches
            clean_orphan_shaders
            check_integrity
            ;;
        *) echo "Uso: $0 {disk|caches|shaders|integrity|all}"; exit 1 ;;
    esac
}

main "$@"
```

Alguns pontos de design:

- Cada estágio é uma função independente, e o `case` permite rodar um só estágio ou todos.
- `rm -rf` de shaders é precedido de checagem contra os manifestos instalados — nada de apagar shader de jogo ativo.
- O `|| true` em `rm`/`find` evita que ausência de arquivos quebre o `set -e`.
- O `check_integrity` usa `sudo -n` (não-interativo) para não travar o timer esperando senha.

:::dica
Sempre rode `debug` primeiro em modo "simulação" antes de deixar um script apagar coisas sozinho. Adicione um `DRY_RUN=1` que troca `rm -rf` por `echo "[dry-run] removeria"` e teste o fluxo completo. Só depois rode de verdade via timer.
:::

## Agendando com timer systemd

O timer de manutenção deve respeitar o fato de o Deck ser um dispositivo que suspende. Agende para um horário em que provavelmente está ligado ou use `Persistent=true` para executar na próxima ligada:

```terminal
$ cat ~/.config/systemd/user/maintenance.service
[Unit]
Description=Manutenção automática do Steam Deck

[Service]
Type=oneshot
ExecStart=%h/bin/maintenance.sh all
StandardOutput=journal
StandardError=journal

$ cat ~/.config/systemd/user/maintenance.timer
[Unit]
Description=Timer de manutenção semanal

[Timer]
OnCalendar=Sun 04:00
Persistent=true
RandomizedDelaySec=30m

[Install]
WantedBy=timers.target
```

O `RandomizedDelaySec=30m` (introduzido no systemd recente) dispersa a execução em até 30 min para não brigar com outras tarefas. Ative:

```terminal
$ systemctl --user daemon-reload
$ systemctl --user enable --now maintenance.timer
$ systemctl --user list-timers maintenance.timer
```

:::info
Manutenção não precisa ser só semanal. Tarefas leves e idempotentes (como `clean_safe_caches`) podem rodar diariamente; as pesadas e com custo de recompilação (shader órfão) ficam para semanal. Você pode ter dois timers apontando para o mesmo serviço com argumentos diferentes, ou dois serviços.
:::

## Alerta de disco cheio

O disco cheio é o problema mais urgente de um Deck — e o mais fácil de automatizar com alerta. Um serviço/timer específico que só verifica espaço e notifica quando está crítico:

```terminal
$ cat ~/.config/systemd/user/disk-alert.service
[Unit]
Description=Alerta de disco quase cheio

[Service]
Type=oneshot
ExecStart=%h/bin/disk-alert.sh
```

```terminal
$ cat ~/bin/disk-alert.sh
#!/bin/bash
set -euo pipefail

pct=$(df --output=pcent / | tail -1 | tr -dc '0-9')
if [[ "$pct" -ge 90 ]]; then
    # Notificação visual (funciona no Desktop Mode)
    if command -v notify-send >/dev/null 2>&1; then
        notify-send -u critical "Disco quase cheio" \
            "A raiz do Steam Deck está ${pct}% cheia. Libere espaço."
    fi
    echo "[disk-alert] DISCO CRÍTICO: ${pct}%" >&2
    exit 1
fi
```

Para notificar também no Gaming Mode, a abordagem muda (não há `notify-send` ali) — a seção 7 cobre como integrar com o ambiente do Gamescope.

```terminal
$ cat ~/.config/systemd/user/disk-alert.timer
[Timer]
OnCalendar=*-*-* *:0/20
[Install]
WantedBy=timers.target
```

O timer roda a cada 20 minutos. Um alerta de disco crítico que só roda às 4h da manhã não serve de nada; usar gravidade importa.

## Logs e validação

Manutenção automática sem registro é manutenção invisível. O journal guarda a história, e você pode consultá-la:

```terminal
$ journalctl --user -u maintenance.service --since "1 month ago" --no-pager
$ journalctl --user -u maintenance.service --since "2 weeks ago" \
    | grep -c "Removido shader órfão"
```

Para validar que a automação está fazendo diferença, acompanhe métricas ao longo do tempo:

```terminal
$ # espaço liberado acumulado (aproximação via logs)
$ journalctl --user -u maintenance.service --no-pager \
    | grep -oP '\(\K[0-9]+ MB liberados' | awk '{s+=$1} END {print s " MB liberados no total"}'
```

Se o script nunca reporta nada liberado, ou ele não roda, ou o Deck está saudável. Saber qual dos dois é a diferença entre automação e ilusão de automação.

## Resumo

- Manutenção do Deck foca em três frentes: shaders/cache, caches gerais e espaço em disco.
- `maintenance.sh` em estágios (disk, caches, shaders, integrity) é idempotente e seguro por padrão; `case` permite rodar estágios isolados.
- Timers systemd com `OnCalendar`, `Persistent=true` e `RandomizedDelaySec` agendam levando em conta a suspensão do Deck.
- Apagar shader cache tem custo de recompilação: limpe só o de jogos desinstalados.
- Alerta de disco cheio roda com alta frequência (20 min) e notifica no Desktop; Gaming Mode requer abordagem própria (seção 7).
- O journal registra tudo; consultas agregadas validam que a automação está de fato trabalhando.

## Exercícios

1. Copie o `maintenance.sh`, rode `./maintenance.sh disk` e depois `./maintenance.sh all`. Quanto espaço o estágio de shaders reporta no seu Deck?
2. Adicione um modo `DRY_RUN=1` ao script que substitua `rm -rf` por `echo`. Rode `all` em dry-run e confira se o que seria apagado faz sentido.
3. Instale o `maintenance.timer` e inspecione com `systemd-analyze calendar "Sun 04:00"` quando será a próxima execução. A expressão corresponde ao que você quer?
4. Escreva o `disk-alert.sh` e o timer de 20 minutos. Encha temporariamente o disco com `fallocate -l 5G ~/tmp/bolha` e aguarde o alerta. Remova o arquivo depois.
5. **Desafio.** Crie um segundo timer diário que rode apenas `clean_safe_caches`, e um relatório mensal que some o espaço liberado a partir do journal (como no exemplo). Automatize a geração desse relatório num arquivo `~/maintenance-report.txt`.