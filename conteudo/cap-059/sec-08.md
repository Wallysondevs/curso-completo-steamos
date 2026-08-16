Todas as ferramentas deste capítulo — Syncthing, Nextcloud, Dropbox, rclone — só valem alguma coisa se rodarem sem você lembrar de iniciá-las. O SteamOS é peculiar: ele tem um modo jogo no qual a sessão gráfica do desktop nem é iniciada, e é justamente nesse modo que os saves se acumulam. Esta seção ensina a usar **systemd user units** para que a sincronização e o salvamento automático aconteçam em segundo plano, de forma confiável, nos dois modos.

:::objetivos
- Entender o ciclo de vida do systemd de sessão no SteamOS
- Criar services e timers no `systemd --user`
- Agendar sincronização periódica e por evento
- Salvar saves automaticamente ao final de uma sessão de jogo
- Diagnosticar e ler logs de serviços que não rodaram
:::

## Por que systemd e por que `--user`

O systemd é o gerenciador de serviços e agendamento do SteamOS. Existem dois níveis: o de **sistema** (`systemd`, gerenciado com `sudo systemctl`) e o de **usuário** (`systemd --user`, gerenciado sem sudo). Serviços de sincronização de dados pessoais pertencem ao nível de usuário: eles falam com os arquivos de `~/`, não precisam de privilégio de root e vivem e morrem com a sessão do usuário `deck`.

A vantagem decisiva no Steam Deck: a sessão user do systemd é iniciada no login do `deck`, independentemente de o modo desktop estar aberto. Isso permite rodar serviços de fundo até quando o Deck está no modo jogo.

```terminal
$ systemctl --user is-system-running
running
$ systemctl --user list-timers --no-pager | head -5
NEXT                        LEFT       LAST                        PASSED  UNIT
Fri 2025-08-15 12:30:00 -03 28min left n/a                         n/a     rclone-sync.timer
```

## Onde vivem as units do usuário

As units que você cria manualmente vão em um diretório específico do usuário, não no `/etc/systemd/system` (que é do sistema e, no SteamOS, fica na partição somente-leitura de qualquer forma).

```terminal
$ mkdir -p ~/.config/systemd/user
$ ls ~/.config/systemd/user/
rclone-sync.service  rclone-sync.timer
```

- `~/.config/systemd/user/` — units criadas por você.
- `/usr/lib/systemd/user/` — units fornecidas por pacotes (não edite).
- `/run/user/$UID/systemd/user/` — estado em tempo de execução.

## Agendando com timers

Um timer dispara um service em intervalos ou em horários específicos. A seção 7 criou um timer simples; aqui vamos sofisticar.

### Por calendário (OnCalendar)

```ini
# ~/.config/systemd/user/save-sync.timer
[Unit]
Description=Disparar salvamento de saves

[Timer]
OnCalendar=hourly
RandomizedDelaySec=5min
Persistent=true

[Install]
WantedBy=timers.target
```

`OnCalendar=hourly` dispara a cada hora cheia. `RandomizedDelaySec=5min` adiciona um atraso aleatório de até 5 minutos para evitar que todos os dispositivos da casa batam na nuvem no mesmo instante. `Persistent=true` faz o timer disparar imediatamente após um boot se o horário previsto foi perdido (porque o Deck estava desligado) — essencial para um dispositivo que liga e desliga o tempo todo.

### Por monotonicidade (OnUnitActiveSec/Monotonic)

```ini
[Timer]
OnUnitActiveSec=30min
```

Aqui o gatilho é relativo à **última execução** do service, não ao relógio. Se você só quer "rode a cada 30 minutos depois da última vez", use `OnUnitActiveSec`. Para "rode a cada 30 minutos desde o boot", use `OnBootSec`/`OnUnitInactiveSec`.

```terminal
$ systemctl --user daemon-reload
$ systemctl --user enable --now save-sync.timer
Created symlink /home/deck/.config/systemd/user/timers.target.wants/save-sync.timer ...
$ systemctl --user list-timers --no-pager
NEXT                          LEFT       LAST  UNIT
Fri 2025-08-15 13:05:22 -03   4min left n/a    save-sync.timer
```

## Um service completo de saves automáticos

Agora juntamos tudo num exemplo real: um service que usa `rclone sync` para empurrar saves para a nuvem, com retry e log rotacionado.

```ini
# ~/.config/systemd/user/save-sync.service
[Unit]
Description=Salvar saves do Deck na nuvem (rclone sync)
Wants=network-online.target
After=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/bin/rclone sync %h/sync/saves gdrive:Saves/ \
    --filter-from %h/sync/filtros.txt \
    --log-file %h/.cache/save-sync.log \
    --log-level INFO
```

```terminal
$ cat ~/sync/filtros.txt
+ *.srm
+ *.sav
+ *.state
+ *.gba
- *
```

Detalhe importante: `Wants=network-online.target` e `After=network-online.target` dizem ao systemd para só rodar quando a rede estiver pronta. Sem isso, o `rclone` pode disparar antes do Wi-Fi conectar e falhar silenciosamente.

```terminal
$ systemctl --user enable --now save-sync.service
$ systemctl --user status save-sync.service --no-pager
● save-sync.service - Salvar saves do Deck na nuvem (rclone sync)
     Loaded: loaded (/home/deck/.config/systemd/user/save-sync.service; enabled)
     Active: inactive (dead) since Fri 2025-08-15 13:05:23 -03; 3s ago
    Process: 4321 ExecStart=/usr/bin/rclone sync ... (code=exited, status=0/SUCCESS)
```

Um service `Type=oneshot` roda uma vez e morre com status `inactive (dead)` — isso é **esperado** e normal. O `status=0/SUCCESS` é o que importa: o sync terminou sem erro.

## Salvando ao final de uma sessão (gatilho por evento)

Timers por calendário são bons para backups regulares, mas o melhor momento para salvar saves é exatamente quando você acabou de jogar. O systemd permite reagir a eventos através de *path units* e gatilhos.

Uma abordagem prática no Steam Deck: monitorar uma pasta de saves e disparar o sync quando ela muda.

```ini
# ~/.config/systemd/user/saves.path
[Unit]
Description=Monitorar mudanças na pasta de saves

[Path]
PathChanged=%h/sync/saves

[Install]
WantedBy=paths.target
```

```ini
# ~/.config/systemd/user/saves.service
[Unit]
Description=Sync disparado por mudança em saves

[Service]
Type=oneshot
ExecStart=/usr/bin/rclone sync %h/sync/saves gdrive:Saves/ --quiet
```

```terminal
$ systemctl --user enable --now saves.path
$ touch ~/sync/saves/novo.sav
$ journalctl --user -u saves.service -n 5 --no-pager
```

A *path unit* observa a pasta e, ao detectar mudança (`PathChanged`), ativa o service. Ele não dispara em cascata infinita: o sync em si não altera os arquivos locais (só envia), então não há loop.

:::dica
Use `PathChanged` com cuidado em pastas muito ativas — cada pequena escrita dispara um sync. Para saves, que mudam pouco (a cada save manual ou checkpoint), é o gatilho ideal. Para pasta com dezenas de mudanças por segundo, use `DirectoryNotEmpty` ou o timer por calendário.
:::

## Diagnosticando quando "não rodou"

Quando um service não faz o esperado, o `journalctl` do usuário é o primeiro lugar a olhar.

```terminal
$ journalctl --user -u save-sync.service -n 30 --no-pager
Aug 15 13:05:23 steamdeck rclone[4321]: 2025/08/15 13:05:23 ERROR : gdrive:Saves: Failed to sync: connection reset
```

Cada execução do service gera entradas no journal do usuário. Erros de rede, de token expirado e de falta de espaço aparecem aqui com o prefixo `rclone[...]`.

```terminal
## Serviços do usuário e seu estado atual
$ systemctl --user list-units --type=service --state=failed --no-pager
  UNIT                LOAD   ACTIVE SUB    DESCRIPTION
● save-sync.service   loaded failed failed Salvar saves do Deck na nuvem (rclone sync)
```

:::atencao
Um erro silencioso clássico: o timer está habilitado, o service está `enabled`, mas o sync nunca acontece porque o token OAuth do rclone expirou. O `journalctl` mostra `oauth2: cannot fetch token` nesse caso. Renove com `rclone config reconnect gdrive:` e teste com `rclone about gdrive:`.
:::

## Resumo

- Serviços de dados pessoais usam `systemd --user`, disponível mesmo em modo jogo no SteamOS.
- Crie units em `~/.config/systemd/user/`; recarregue com `systemctl --user daemon-reload`.
- `OnCalendar` dispara por relógio; `OnUnitActiveSec` por tempo desde a última execução; `Persistent=true` recupera disparos perdidos no boot.
- `Wants=/After=network-online.target` evita falha por rede ainda não conectada.
- *Path units* disparam sync quando uma pasta de saves muda.
- Diagnostique com `journalctl --user -u <nome>` e `systemctl --user list-units --state=failed`.

## Exercícios

1. Crie um service `Type=oneshot` que rode `rclone sync --dry-run` e um timer `OnCalendar=hourly`. Verifique com `systemctl --user list-timers`.
2. Adicione `Persistent=true` e `RandomizedDelaySec` ao timer e explique o efeito de cada um num dispositivo que liga/desliga.
3. Crie uma *path unit* que monitore uma pasta de saves e dispare um sync. Teste com `touch` e leia o `journalctl`.
4. Provoque um erro (ex.: desligue a rede) e observe o status `failed` no `systemctl --user`. Depois investigue o journal.
5. **Desafio.** Monte um pipeline completo: um timer de backup diário (`OnCalendar=daily`), uma path unit para saves, e um service de retry que roda `rclone sync` com `--retries 3 --low-level-retries 3`. Documente no journal que todos os três estão ativos e funcionando.