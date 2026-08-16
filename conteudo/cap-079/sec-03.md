A ferramenta mais poderosa de automação no Steam Deck é o systemd — em particular o sistema de usuário (`systemd --user`). Diferente de um `cron` clássico ou de scripts soltos, o systemd oferece dependências, reinicialização automática, logs integrados no journal e timers precisos. E porque o sistema de usuário roda fora do Desktop e do Gaming Mode, é o mecanismo ideal para serviços que devem estar sempre de pé no seu Deck. Esta seção ensina a criar, gerenciar e depurar seus próprios serviços de usuário.

:::objetivos
- Entender a diferença entre serviços de sistema e serviços de usuário e quando usar cada um
- Escrever unit files (`.service`) e habilitá-los com `systemctl --user`
- Usar `WantedBy`, `After`, `Requires` e `OnFailure` para compor dependências
- Agendar tarefas com timers (`.timer`) no lugar do cron
- Ler logs no journal e depurar serviços que falham ao iniciar
:::

## Serviço de sistema vs serviço de usuário

O systemd tem dois "árbitros" no Steam Deck, e confundi-los é a fonte mais comum de erros:

| Aspecto | Sistema (`systemctl`) | Usuário (`systemctl --user`) |
|---|---|---|
| Roda como | root | usuário `deck` |
| Unidade em | `/etc/systemd/system/`, `/usr/lib/systemd/system/` | `~/.config/systemd/user/` |
| Inicia | no boot | no login do usuário |
| Sobrevive a atualização | depende (overlay em `/etc`) | sempre (em `/home`) |
| Precisa de root | sim (para instalar) | não |

Para automação pessoal no SteamOS, o **serviço de usuário** é a escolha padrão: não requer privilégios, não é apagado por atualizações do sistema imutável, e pode ser gerenciado inteiramente a partir do seu `$HOME`. Serviços de sistema ficam reservados para o que realmente precisa de root ou de rodar antes do login (ex.: montar disco, configurar rede).

```terminal
$ systemctl --user status
● steamdeck
    State: running
     Jobs: 0 queued
   Failed: 0 units
```

O alvo `steamdeck` no topo indica que o sistema de usuário está vivo e saudável.

## O primeiro serviço de usuário

Um serviço mínimo que escreve uma linha de log ao iniciar:

```terminal
$ cat ~/.config/systemd/user/hello-deck.service
[Unit]
Description=Serviço de exemplo que saúda o Deck
After=network-online.target
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=%h/bin/hello-deck
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=default.target
```

As diretivas-chave:

- **`After=` / `Wants=`** — ordenação e dependência "fraca". `Wants=network-online.target` pede (não exige) rede; `After=` garante ordem. Bom para scripts que usam a internet.
- **`Type=oneshot`** — o serviço roda um comando e termina; systemd considera concluído quando o processo sai. Ideal para tarefas pontuais. O padrão (`simple`) é para processos que ficam rodando.
- **`%h`** — atalho para o `$HOME` do usuário (`/home/deck`). Existem outros especificadores (`%u` = usuário, `%E` = diretório de config).
- **`WantedBy=default.target`** — liga este serviço ao alvo padrão do usuário, fazendo-o iniciar no login.

Instale e teste:

```terminal
$ systemctl --user daemon-reload
$ systemctl --user enable --now hello-deck.service
$ systemctl --user status hello-deck.service
● hello-deck.service - Serviço de exemplo que saúda o Deck
     Loaded: loaded (/home/deck/.config/systemd/user/hello-deck.service; enabled)
     Active: inactive (dead)
```

Como é `oneshot`, ele já rodou e terminou — o `Active: inactive (dead)` é esperado. O log está no journal:

```terminal
$ journalctl --user -u hello-deck.service --no-pager
mai 01 10:15:01 steamdeck hello-deck[3841]: Olá do Steam Deck: steamdeck
```

:::info
`enable` cria os symlinks que ligam o serviço ao alvo do `WantedBy`; `--now` também o inicia na hora. Sempre que editar um unit file, rode `systemctl --user daemon-reload` antes — systemd não recarrega unidades automaticamente.
:::

## Serviços de longa duração

Para um processo que fica rodando (um daemon), mude o `Type` para `simple` e deixe-o gerenciado pelo systemd. Um exemplo real no contexto do Deck: um serviço que mantém o cliente Syncthing (sincronização de saves) rodando:

```terminal
$ cat ~/.config/systemd/user/syncthing.service
[Unit]
Description=Syncthing para sincronização de saves
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=%h/bin/syncthing serve --no-browser --home=%h/.config/syncthing
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

Aqui `Restart=on-failure` e `RestartSec=5` fazem o systemd relançar o processo 5 segundos após uma falha — comportamento que um script nu jamais teria. Outras opções de `Restart` incluem `always` e `on-abnormal`.

```terminal
$ systemctl --user enable --now syncthing.service
$ systemctl --user status syncthing.service
● syncthing.service - Syncthing para sincronização de saves
     Active: active (running) since Wed 2025-04-30 10:20:00 UTC; 2h ago
```

`active (running)` agora, porque é um processo persistente.

## Compondo dependências

O verdadeiro valor do systemd está em declarar relações entre unidades. Imagine que seu serviço de backup deve rodar *depois* da rede e *apenas se* um diretório existir:

```terminal
[Unit]
Description=Backup automático de saves
After=network-online.target syncthing.service
Requires=syncthing.service
ConditionPathExists=%h/all-saves

[Service]
Type=oneshot
ExecStart=%h/bin/do-backup
```

- **`Requires=`** — dependência "forte": se `syncthing.service` falhar, este também falha. (Prefira `Wants=` para dependências opcionais que não devem derrubar a cadeia.)
- **`ConditionPathExists=`** — pré-condição: se `~/all-saves` não existir, o serviço nem tenta iniciar e fica com `Condition failed`. Útil para não rodar backup quando o disco externo não está montado.

Para lidar com falhas, há `OnFailure`:

```terminal
[Unit]
Description=Backup automático de saves

[Service]
Type=oneshot
ExecStart=%h/bin/do-backup
OnFailure=notify-failure.service
```

Quando `do-backup` falha, o systemd dispara `notify-failure.service` automaticamente — você pode usar isso para enviar uma notificação para a tela (tema da seção 7).

## Timers no lugar do cron

O SteamOS não traz `cron` por padrão, e você não precisa dele: os timers do systemd são superiores (integrem ao journal, aceitam `Persistent`, são monolíticos com o serviço). Um timer que roda o backup diariamente às 3h:

```terminal
$ cat ~/.config/systemd/user/backup.timer
[Unit]
Description=Timer diário de backup

[Timer]
OnCalendar=03:00
Persistent=true

[Install]
WantedBy=timers.target
```

Pontos importantes:

- **`OnCalendar=03:00`** — agenda para 3h. Aceita expressões ricas: `*-*-* 03:00:00`, `Mon..Fri 18:00`, `hourly`, `daily`, `*:0/15` (a cada 15 min).
- **`Persistent=true`** — se o Deck estava desligado às 3h, o timer dispara ao ligar (recupera a execução perdida). Essencial num dispositivo portátil que desliga toda noite.

Ative e inspecione:

```terminal
$ systemctl --user enable --now backup.timer
$ systemctl --user list-timers --no-pager
NEXT                        LEFT      LAST                        PASSED  UNIT          ACTIVATES
Thu 2025-05-01 03:00:00 UTC 7h left   Wed 2025-04-30 03:00:00 UTC 17h ago backup.timer  backup.service
```

Repare que o timer ativa um serviço de mesmo nome (`backup.service`). A convenção do systemd: se `backup.timer` existe, ele ativa `backup.service`. Você pode nomear o serviço de outra forma e apontar com `Unit=backup.service` na seção `[Timer]`.

:::atencao
Um timer sem `Persistent=true` **pula** a execução se o aparelho estiver desligado no horário. Num Steam Deck, que é desligado/ suspenso o tempo todo, isso significa backups que simplesmente nunca acontecem. Sempre avalie se `Persistent=true` faz sentido — para a maioria dos casos de backup e manutenção, faz.
:::

## Depurando serviços que não iniciam

Três comandos resolvem 90% dos problemas:

```terminal
$ # 1. A unidade carregou e o que ela faria?
$ systemctl --user cat hello-deck.service

$ # 2. Por que não subiu? (erro de sintaxe, condição, dependência)
$ systemctl --user status hello-deck.service

$ # 3. O que o processo disse antes de morrer?
$ journalctl --user -u hello-deck.service -n 50 --no-pager
```

Erros comuns e suas causas:

| Sintoma | Causa provável |
|---|---|
| `Loaded: error` / `not-found` | esqueceu `daemon-reload`, ou caminho do unit file errado |
| `status=203/EXEC` | `ExecStart` aponta para binário inexistente ou sem permissão de execução |
| `Condition ... failed` | pré-condição (`ConditionPathExists`) falhou |
| `status=127` | comando não encontrado dentro do script (PATH restrito do systemd) |
| `inactive (dead)` logo após `enable` | `oneshot` já terminou — confira o journal |

:::info
O PATH de um serviço systemd é restrito (não herda seu `.bashrc`). Use caminhos absolutos em `ExecStart` ou defina `Environment=PATH=/usr/local/bin:/usr/bin:/bin`. Confiar no PATH do shell interativo é uma armadilha clássica.
:::

## Resumo

- Serviços de usuário (`systemctl --user`) rodam como `deck`, vivem em `~/.config/systemd/user/` e sobrevivem a atualizações — a escolha padrão para automação pessoal.
- `Type=oneshot` para tarefas pontuais, `Type=simple` para daemons; `Restart=on-failure` adiciona resiliência.
- `After`/`Wants`/`Requires`/`ConditionPathExists` e `OnFailure` expressam dependências e reações a falhas.
- Timers (`.timer`) substituem o cron: `OnCalendar`, `Persistent=true` e integração com o journal.
- `systemctl --user cat/status` e `journalctl --user -u` são o trio de depuração; o PATH restrito e o `daemon-reload` são as armadilhas mais comuns.

## Exercícios

1. Instale o `hello-deck.service` da seção, habilite com `--now` e leia a saída no `journalctl --user`. Depois edite o `ExecStart` para um caminho inexistente, rode `daemon-reload` e observe o erro `status=203`.
2. Crie um serviço `Type=simple` que rode um `sleep infinity` (ou um loop) e habilite. Confirme o `active (running)` e mate o processo com `kill` para ver o `Restart=on-failure` agindo.
3. Escreva um timer `.timer` com `Persistent=true` para rodar um comando seu a cada 15 minutos. Use `systemd-analyze calendar` para validar sua expressão `OnCalendar`.
4. Adicione `ConditionPathExists=` a um serviço, aponte para um caminho que não existe e inicie. O estado deve mostrar `Condition failed`. Crie o caminho e reinicie — funciona agora?
5. **Desafio.** Encadeie dois serviços com `Requires=` e `After=`, e um terceiro com `OnFailure=` que registre a falha num arquivo de log. Provoque uma falha no primeiro e verifique que o terceiro disparou, inspecionando o journal.
