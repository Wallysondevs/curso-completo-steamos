Cada seção deste capítulo entregou uma peça do quebra-cabeça. Steam Cloud, conflitos, SteamCMD, múltiplos decks, saves não-Steam, Syncthing, backup offline e integridade — ferramentas que funcionam sozinhas, mas que brilham quando integradas em um fluxo único. Esta seção final amarra tudo num pipeline pessoal de sincronização: um script orquestrador que, com um comando, verifica a saúde de todos os saves, sincroniza com a nuvem e com o backup local, e relata o que precisa de atenção. É a diferença entre "eu acho que meus saves estão seguros" e "eu sei que estão".

:::objetivos
- Projetar a arquitetura de um pipeline de sincronização pessoal
- Escrever um script orquestrador que integra SteamCMD, rsync, sha256sum e Syncthing
- Implementar hooks de pré e pós-jogo para validação automática
- Criar um dashboard de status textual para todos os saves
- Agendar o pipeline completo com timer systemd
:::

## A arquitetura do pipeline

O pipeline tem três estágios e roda em três momentos diferentes:

| Estágio | Quando roda | O que faz |
|---|---|---|
| **Pré-jogo** | Ao abrir qualquer jogo | Verifica se o Steam Cloud baixou saves sem conflito, valida checksums |
| **Pós-jogo** | Ao fechar qualquer jogo | Verifica integridade do save recém-escrito, dispara rsync e Syncthing |
| **Diário** | 3h da manhã via timer | Backup offline completo, verificação de integridade de todos os saves, relatório |

O script orquestrador é o ponto de entrada único:

```terminal
$ ~/saves-pipeline.sh status
           Steam Cloud: 7 sincronizados, 1 pendente (ELDEN RING)
           Saves locais: 23 arquivos, 892 MB
               Checksums: 22 OK, 1 ALTERADO (ER0000.sl2)
              Syncthing: conectado a 2 dispositivos, 0 conflitos
     Backup offline (rsync): último em 2025-04-20 03:00, sucesso
       Backup offline (tar): último em 2025-04-19 03:00, sucesso
```

## O script orquestrador

Abaixo, a espinha dorsal do pipeline. Cada função encapsula uma ferramenta apresentada nas seções anteriores:

```terminal
$ cat ~/saves-pipeline.sh
#!/bin/bash
set -euo pipefail

STEAMCMD=~/steamcmd/steamcmd.sh
STEAM_USER=ana
ALL_SAVES=~/all-saves
MANIFEST="$ALL_SAVES/manifest.sha256"
BACKUP_DEST=/run/media/deck/BACKUP/saves

# ------------------------------------------------------------
# ESTÁGIO 1: verificação de integridade
# ------------------------------------------------------------
check_integrity() {
    echo "=== Verificando integridade dos saves ==="
    if [ ! -f "$MANIFEST" ]; then
        echo "AVISO: manifest.sha256 não encontrado. Gere com: sha256sum \$(find ...)"
        return 1
    fi
    pushd "$ALL_SAVES" > /dev/null
    sha256sum -c manifest.sha256 --quiet 2>&1 || true
    local failed=$(sha256sum -c manifest.sha256 --quiet 2>&1 | grep -c "FAILED" || true)
    popd > /dev/null
    if [ "$failed" -gt 0 ]; then
        echo "ALERTA: $failed arquivo(s) com checksum divergente"
        return 1
    fi
    echo "OK: todos os checksums conferem"
}

# ------------------------------------------------------------
# ESTÁGIO 2: status do Steam Cloud
# ------------------------------------------------------------
check_steam_cloud() {
    echo "=== Verificando Steam Cloud ==="
    local total=0 pending=0
    for manifest in ~/.local/share/Steam/steamapps/appmanifest_*.acf; do
        local appid=$(basename "$manifest" | grep -oP '\d+')
        local status=$("$STEAMCMD" +login "$STEAM_USER" +cloud_status "$appid" +quit 2>/dev/null | \
            grep "Synced:" | grep -oP '(yes|no)')
        total=$((total + 1))
        if [ "$status" = "no" ]; then
            pending=$((pending + 1))
            local name=$(grep '"name"' "$manifest" | head -1 | grep -oP '"\K[^"]+(?="$)')
            echo "  PENDENTE: $name ($appid)"
        fi
    done
    echo "  $total jogos, $pending pendentes"
}

# ------------------------------------------------------------
# ESTÁGIO 3: status do Syncthing
# ------------------------------------------------------------
check_syncthing() {
    echo "=== Verificando Syncthing ==="
    local api="http://localhost:8384/rest"
    local conn=$(curl -s "$api/system/connections" 2>/dev/null | \
        python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('connections',{})))" 2>/dev/null || echo "0")
    local conflicts=$(find "$ALL_SAVES" -name "*.sync-conflict-*" 2>/dev/null | wc -l)
    echo "  Dispositivos conectados: $conn"
    echo "  Conflitos pendentes: $conflicts"
    if [ "$conflicts" -gt 0 ]; then
        echo "  ATENÇÃO: conflitos de sincronização encontrados:"
        find "$ALL_SAVES" -name "*.sync-conflict-*" -exec ls -lh {} \;
    fi
}

# ------------------------------------------------------------
# ESTÁGIO 4: backup offline
# ------------------------------------------------------------
do_backup() {
    echo "=== Executando backup offline ==="
    if ! mountpoint -q "$BACKUP_DEST" 2>/dev/null; then
        echo "ERRO: destino de backup ($BACKUP_DEST) não está montado"
        return 1
    fi
    rsync -a --delete "$ALL_SAVES/" "$BACKUP_DEST/"
    echo "OK: rsync concluído para $BACKUP_DEST"
    # Atualiza manifest de checksums
    find "$ALL_SAVES" -type f -not -name "*.sha256" -not -path "*/.stversions/*" \
        -exec sha256sum {} \; > "$MANIFEST"
    echo "OK: manifest.sha256 atualizado"
}

# ------------------------------------------------------------
# ESTÁGIO 5: dashboard de status
# ------------------------------------------------------------
show_status() {
    echo ""
    echo "=============================================="
    echo "  DASHBOARD DE SAVES — $(date '+%Y-%m-%d %H:%M')"
    echo "=============================================="
    echo ""
    check_integrity || true
    echo ""
    check_steam_cloud || true
    echo ""
    check_syncthing || true
    echo ""
    local last_backup=$(stat --format='%y' "$BACKUP_DEST/" 2>/dev/null || echo "N/A")
    echo "  Último backup offline: $last_backup"
    echo ""
    echo "=============================================="
}

# ------------------------------------------------------------
# DISPATCHER
# ------------------------------------------------------------
case "${1:-status}" in
    status)   show_status ;;
    backup)   do_backup ;;
    integrity) check_integrity ;;
    cloud)    check_steam_cloud ;;
    syncthing) check_syncthing ;;
    all)      check_integrity && check_steam_cloud && check_syncthing && do_backup ;;
    *)        echo "Uso: $0 {status|backup|integrity|cloud|syncthing|all}" ;;
esac
```

O script é um dispatcher: cada comando (`status`, `backup`, `integrity`, etc.) roda o estágio correspondente. O comando `all` roda tudo em sequência — ideal para o timer diário.

## Hooks de pré e pós-jogo

O Steam não expõe hooks oficiais para "antes de abrir jogo" e "depois de fechar jogo". Mas você pode criar um wrapper que intercepta o comando `steam -applaunch`:

```terminal
$ cat ~/bin/steam-launch
#!/bin/bash
APPID="$1"

echo "[PRE-JOGO] Verificando saves antes de iniciar AppID $APPID..."
~/saves-pipeline.sh integrity

echo "[STEAM] Iniciando jogo..."
steam -applaunch "$APPID"

# Espera o processo do jogo terminar (polling)
sleep 5
while pgrep -f "steamapps/common" > /dev/null 2>&1; do
    sleep 5
done

echo "[PÓS-JOGO] Jogo fechado. Verificando integridade..."
~/saves-pipeline.sh integrity

echo "[PÓS-JOGO] Disparando backup incremental..."
rsync -a ~/all-saves/ /run/media/deck/BACKUP/saves/ 2>/dev/null || \
    echo "AVISO: backup offline indisponível"

echo "[PÓS-JOGO] Aguardando Steam Cloud sincronizar..."
sleep 10
~/saves-pipeline.sh cloud
```

O script não é perfeito — o polling por `steamapps/common` é frágil se você rodar jogos do mesmo diretório —, mas cobre o caso mais comum de "abrir jogo, jogar, fechar jogo".

## Timer systemd definitivo

O pipeline diário roda como um timer systemd de usuário:

```terminal
$ cat ~/.config/systemd/user/saves-pipeline.service
[Unit]
Description=Pipeline completo de verificacao e backup de saves
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=%h/saves-pipeline.sh all
StandardOutput=journal
StandardError=journal

$ cat ~/.config/systemd/user/saves-pipeline.timer
[Unit]
Description=Timer diario do pipeline de saves

[Timer]
OnCalendar=03:00
Persistent=true

[Install]
WantedBy=timers.target

$ systemctl --user daemon-reload
$ systemctl --user enable --now saves-pipeline.timer
```

O log fica no journal:

```terminal
$ journalctl --user -u saves-pipeline --since "1 day ago" --no-pager
Apr 20 03:00:01 steamdeck systemd[1291]: Starting Pipeline completo de verificacao e backup de saves...
Apr 20 03:00:02 steamdeck saves-pipeline.sh[3841]: === Verificando integridade dos saves ===
Apr 20 03:00:02 steamdeck saves-pipeline.sh[3841]: OK: todos os checksums conferem
Apr 20 03:00:15 steamdeck saves-pipeline.sh[3841]: === Verificando Steam Cloud ===
Apr 20 03:00:15 steamdeck saves-pipeline.sh[3841]:   7 jogos, 1 pendente (ELDEN RING)
Apr 20 03:00:17 steamdeck saves-pipeline.sh[3841]: === Executando backup offline ===
Apr 20 03:00:25 steamdeck saves-pipeline.sh[3841]: OK: rsync concluído para /run/media/deck/BACKUP/saves
Apr 20 03:00:25 steamdeck systemd[1291]: saves-pipeline.service: Succeeded.
```

## Indo além: o que este pipeline não cobre

O pipeline automatiza verificação, backup e relatório — mas há coisas que exigem sua atenção:

- **Resolução de conflitos do Steam Cloud:** o pipeline detecta saves pendentes e conflitos de Syncthing, mas a decisão de qual versão fica ainda é sua. O script pode, no máximo, apresentar os timestamps lado a lado.
- **Primeira configuração:** antes de o pipeline funcionar, você precisa ter mapeado os saves não-Steam, instalado SteamCMD e Syncthing e criado o primeiro backup.
- **Espaço em disco:** o pipeline verifica checksums, mas não monitora espaço livre. Um `df -h` no `show_status` é uma adição trivial e recomendada.

:::dica
Guarde o script `saves-pipeline.sh` em um repositório git (pode ser local mesmo, `git init ~/saves-pipeline`). A cada alteração, faça commit. Se um dia o script for modificado por uma atualização de sistema ou você trocar de deck, clonar o repositório restaura toda a lógica de sincronização em segundos.
:::

## Resumo

- O pipeline integra SteamCMD, rsync, sha256sum e Syncthing em cinco estágios: integridade, cloud, Syncthing, backup offline e dashboard.
- O script `saves-pipeline.sh` funciona como dispatcher: `status` para visão geral, `backup` para rsync, `all` para tudo.
- Hooks de pré e pós-jogo, via wrapper do `steam -applaunch`, validam saves antes de abrir e depois de fechar o jogo.
- O timer systemd roda o pipeline diariamente às 3h; logs ficam no journal.

:::atencao
O `set -euo pipefail` no topo do script faz qualquer falha em um estágio interromper o estágio seguinte **quando rodado via `all`**. Se o `check_integrity` retornar `1`, o `do_backup` nunca executa — e você pode ir dormir achando que tem backup quando na verdade o pipeline abortou no primeiro estágio. No dispatcher, os estágios individuais (`status`, `cloud`, etc.) capturam falhas com `|| true`, mas o `all` não. Decida conscientemente: abortar em cascata ou continuar mesmo com aviso.
:::
- O pipeline detecta problemas, mas a resolução de conflitos e o mapeamento inicial dos saves dependem de você.

## Exercícios

1. Copie o script `saves-pipeline.sh`, ajuste os caminhos para sua máquina e execute `./saves-pipeline.sh status`. Corrija cada erro reportado até o dashboard aparecer limpo.
2. Implemente os hooks de pré e pós-jogo com o wrapper `steam-launch`. Abra um jogo, jogue 2 minutos, feche. O que o script reportou?
3. Adicione ao `show_status` uma verificação de espaço livre em disco (`df -h` no destino de backup e no `$HOME`). Se menos de 10% estiver livre, exiba um alerta.
4. Provoque uma falha em cada estágio: apague um arquivo de save (checksum falha), jogue offline (cloud pendente), desconecte o outro dispositivo (Syncthing desconectado), desmonte o destino (backup falha). O pipeline reporta cada falha claramente?
5. **Desafio.** Transforme o pipeline em um daemon simples: um script que fica rodando em loop com `sleep 300` (5 min) e, a cada iteração, executa `check_integrity` e `check_syncthing`. Se algo mudar desde a última iteração (checksums, conexões, conflitos), escreve uma entrada de log. Isso transforma o pipeline de "verificação diária" para "monitoramento contínuo".