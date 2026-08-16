Servidores e home labs acumulam tarefas repetitivas rapidamente: limpar logs antigos, fazer backup dos volumes, renovar certificados, verificar saúde dos serviços, sincronizar arquivos. Fazer isso manualmente é insustentável e propenso a erro. A automação é o que separa um hobby de "funciona até alguém lembrar de mexer" de um sistema que se mantém sozinho. Nesta seção você transforma aquilo que já aprendeu sobre bash e systemd em ferramentas de manutenção autônoma.

:::objetivos
- Escrever scripts bash robustos e idempotentes para tarefas de manutenção
- Agendar execuções com systemd timers (substituto moderno do cron)
- Capturar saída, registrar logs e gerar notificações de sucesso e falha
- Tratar erros com `set -euo pipefail` e códigos de saída corretos
- Encadear scripts num fluxo de manutenção mensal e semanal
:::

## Por que timer systemd, não cron

O cron funciona e está em todo lugar, mas tem limitações que doem quando o sistema cresce: não registra logs estruturados automaticamente, não tem integração nativa com `journalctl`, e se uma execução falha você normalmente só descobre quando algo quebra. O systemd timer resolve esses pontos — cada disparo gera log no `journalctl`, executa o script como uma unidade (com todas as diretivas de isolamento que você já conhece) e expõe o estado via `systemctl`.

Comparação rápida:

| Aspecto | cron | systemd timer |
|---|---|---|
| Logs | manual (redirecionar p/ arquivo) | automático no `journalctl` |
| Isolamento | nenhum | `ProtectSystem`, `PrivateTmp`, `NoNewPrivileges` |
| Disparo perdido | some | pode ser recuperado (`Persistent=true`) |
| Estado | invisível | `systemctl status`, `list-timers` |
| Recursos | nenhum | `MemoryMax`, `CPUQuota` |

Para qualquer tarefa nova de automação, o timer systemd é a escolha padrão.

## O script robusto

O esqueleto de todo script de manutenção sério começa com estas três linhas:

```bash
#!/usr/bin/env bash
set -euo pipefail
```

- `set -e` — aborta se qualquer comando retornar código não-zero
- `set -u` — trata variável não definida como erro (pega typos)
- `set -o pipefail` — faz um `pipe` retornar erro se qualquer estágio falhar, não só o último

Sem isso, um script pode seguir executando cegamente depois de um `cd` que falhou ou de um `tar` que não encontrou o arquivo — e você só descobre o estrago depois. Com isso, ele para no primeiro problema.

Um script de backup diário dos volumes de container, com log estruturado:

```bash
#!/usr/bin/env bash
set -euo pipefail

DATA_DIR="${HOME}/.local/share/containers/storage/volumes"
BACKUP_DIR="${HOME}/backups"
DATE=$(date +%F)
LOG_TAG="backup-diario"

log()  { echo "[$(date +%H:%M:%S)] $*" | systemd-cat -t "$LOG_TAG"; }
falhar() { log "ERRO: $1"; exit 1; }

cd "$BACKUP_DIR" || falhar "diretório de backup inacessível"

# para os containers para consistência
podman ps --format '{{.Names}}' | xargs -r podman stop

tar -czf "volumes-${DATE}.tar.gz" -C "$(dirname "$DATA_DIR")" "$(basename "$DATA_DIR")"
log "backup criado: volumes-${DATE}.tar.gz ($(du -h volumes-${DATE}.tar.gz | cut -f1))"

# religa os containers que estavam rodando
podman start -a 2>/dev/null || true

# remove backups com mais de 30 dias
find "$BACKUP_DIR" -name 'volumes-*.tar.gz' -mtime +30 -delete
log "limpeza concluída; backups retidos de 30 dias para trás"
```

O detalhe que muda tudo é o `systemd-cat`: ele injeta a mensagem direto no journal, com a tag `backup-diario`, permitindo depois filtrar `journalctl -t backup-diario`. Sem isso, a saída do script some no vazio quando rodado via timer.

## Transformando o script num timer

Um timer tem duas unidades: o `.service` (que executa o script) e o `.timer` (que agenda o serviço).

`/etc/systemd/system/backup-diario.service`:

```ini
[Unit]
Description=Backup diário dos volumes de container
Requires=backup-diario.timer

[Service]
Type=oneshot
User=ana
ExecStart=/home/ana/.local/bin/backup-diario.sh
Nice=10
IOSchedulingClass=idle
```

`/etc/systemd/system/backup-diario.timer`:

```ini
[Unit]
Description=Executa backup-diaŕio todo dia às 03:00

[Timer]
OnCalendar=daily
AccuracySec=1min
Persistent=true

[Install]
WantedBy=timers.target
```

`Type=oneshot` indica tarefa que inicia e termina (em oposição a um daemon) e é o tipo correto para scripts de manutenção. `Nice=10` e `IOSchedulingClass=idle` reduzem a prioridade, para o backup não competir com o uso normal quando disparar às 3 da manhã. `Persistent=true` faz o timer recuperar um disparo que foi perdido porque o Deck estava desligado na hora agendada.

```terminal
$ sudo systemctl daemon-reload
$ sudo systemctl enable --now backup-diario.timer
Created symlink /etc/systemd/system/timers.target.wants/backup-diario.timer.
$ systemctl list-timers --all | grep backup
NEXT                        LEFT       LAST  PASSED  UNIT                  ACTIVATES
sun 2025-01-19 03:00:00 -03 12h left   n/a   n/a     backup-diario.timer   backup-diario.service
```

Para testar sem esperar até as 3 da manhã:

```terminal
$ sudo systemctl start backup-diario.service
$ journalctl -t backup-diario --since today
jan 18 14:41:03 steamdeck backup-diario[8521]: [14:41:03] backup criado: volumes-2025-01-18.tar.gz (1.2G)
jan 18 14:41:08 steamdeck backup-diario[8521]: [14:41:08] limpeza concluída; backups retidos de 30 dias para trás
```

## Notificação de falha

Backup silencioso que falha não adianta. O ideal é receber um aviso ativo quando algo dá errado. Dois mecanismos simples e sem dependência externa:

**Via `OnFailure=`** no serviço — faz o systemd disparar outra unidade quando esta falha:

```ini
[Unit]
OnFailure=notifica-falha@%n.service
```

**Via script de notificação** que usa `notify-send` (para notificações no desktop KDE) ou um webhook de chat:

```bash
#!/usr/bin/env bash
# /usr/local/bin/notifica.sh — envia mensagem para um canal (ex.: Discord/Slack/Telegram)
MENSAGEM="${1:-Falha em tarefa de manutenção}"
curl -s -X POST "https://discord.com/api/webhooks/SEU_WEBHOOK" \
  -H "Content-Type: application/json" \
  -d "{\"content\": \"❌ ${MENSAGEM}\"}" >/dev/null
```

O webhook de Discord/Slack/Telegram é um dos padrões mais baratos de alerta doméstico: você cria um canal privado, gera a URL, e qualquer script consegue mandar mensagem com `curl`. Funciona de qualquer lugar, no celular inclusive.

:::dica
Acumule scripts em `~/.local/bin/` e adicione ao `PATH`. É o diretório padrão do usuário para binários próprios, não polui o `/usr/local/bin` do sistema, e junto com `chmod +x` e um bom nome (`backup-diario.sh`, `limpa-logs.sh`, `checa-servicos.sh`) vira sua biblioteca pessoal de automação, versionável no Git.
:::

## Fluxos encadeados: semanal e mensal

Nem toda tarefa é diária. Um cenário real combina três frequências:

- **Diário**: backup incremental, rotação de logs, verificação de saúde dos containers
- **Semanal**: backup completo (dump de bancos), atualização de imagens de container
- **Mensal**: verificação de integridade de disco (`fstrim`, `btrfs scrub`), revisão de espaço

Você não precisa de timers separados para cada uma — um único timer `OnCalendar=weekly` pode ser a âncora do ciclo semanal, e outro `OnCalendar=monthly` para o mensal. O encadeamento vem da prática: o script semanal chama o diário como parte do fluxo, ou vice-versa, conforme a lógica.

```terminal
$ systemctl list-timers
NEXT                       LEFT       LAST  PASSED   UNIT                    ACTIVATES
sun 2025-01-19 03:00:00   12h left   n/a   n/a      backup-diario.timer     backup-diario.service
sun 2025-01-19 04:00:00   13h left   n/a   n/a      backup-semanal.timer    backup-semanal.service
sun 2025-02-02 04:30:00   3 weeks    n/a   n/a      manutencao-mensal.timer manutencao-mensal.service
```

Esse `list-timers` é seu painel de controle: numa olhada você vê tudo que o sistema faz sozinho e quando.

## Resumo

- systemd timers substituem o cron com vantagens: logs no journal, isolamento, recuperação de disparo perdido e estado visível.
- Todo script de manutenção começa com `set -euo pipefail` e para no primeiro erro em vez de seguir cego.
- Use `systemd-cat -t TAG` para registrar mensagens no journal; filtre depois com `journalctl -t TAG`.
- Timer usa duas unidades: um `.service` (`Type=oneshot`) que executa o script e um `.timer` que o agenda.
- `Nice=10` + `IOSchedulingClass=idle` mantêm o backup fora do caminho do uso normal; `Persistent=true` recupera disparos perdidos.
- Notifique falhas via `OnFailure=` ou webhook de Discord/Slack/Telegram — backup silencioso que falha não adianta.

## Exercícios

1. Escreva um script que lista os 10 maiores arquivos do `~/Downloads` e o salve em `~/.local/bin/maiores-arquivos.sh`, com `set -euo pipefail` e `systemd-cat`.
2. Crie as duas unidades (service + timer) para rodar o script da questão 1 diariamente. Confirme com `systemctl list-timers` e dispare manualmente com `systemctl start`.
3. Adicione uma cláusula de notificação: faça o script enviar um webhook para um canal de Discord ou Slack seu quando a lista de arquivos exceder um tamanho que você defina.
4. Escreva um script de backup dos volumes de container com rotação de 30 dias (como o modelo da seção) e valide que backups antigos são de fato removidos.
5. **Desafio.** Monte o fluxo completo de três frequências (diário/semanal/mensal) com `Persistent=true` em todos os timers. Desligue o Deck antes de um disparo agendado, religue depois, e confirme via `journalctl` que o timer recuperou o disparo perdido.