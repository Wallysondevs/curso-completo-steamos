O `cron` dominou o agendamento de tarefas no Unix por quarenta anos. O `systemd` introduziu seu próprio mecanismo — os *timers* —, e embora o cron ainda funcione, os timers são mais precisos, mais integráveis com o journal e mais adaptados ao SteamOS. Esta seção ensina a listar os timers que já rodam no sistema, a ler seus calendários e a entender como um timer dispara um serviço.

:::objetivos
- Listar timers ativos e seus últimos disparos com `systemctl list-timers`
- Entender a relação entre um `.timer` e o `.service` que ele dispara
- Ler expressões `OnCalendar` e `OnBootSec`
- Diferenciar timers do sistema de agendamentos do SteamOS
- Reconhecer quando usar um timer em vez de um serviço "always on"
:::

## Quem já está agendado no sistema

Mesmo num Steam Deck recém-ligado, vários timers estão discretamente ativos. O comando de inspeção principal é o `list-timers`:

```terminal
$ systemctl list-timers --no-pager
NEXT                        LEFT           LAST                        PASSED   UNIT                    ACTIVATES
Wed 2025-01-15 14:00:00 -03 4min 42s left  Wed 2025-01-15 13:00:00 -03 55min ago fstrim.timer            fstrim.service
Wed 2025-01-15 14:15:21 -03 20min left     Wed 2025-01-15 13:45:21 -03 10min ago systemd-tmpfiles-clean.timer systemd-tmpfiles-clean.service
Thu 2025-01-16 00:00:00 -03 10h left       Tue 2025-01-15 09:12:25 -03 4h 43min ago logrotate.timer      logrotate.service
Thu 2025-01-16 00:00:00 -03 10h left       Tue 2025-01-15 09:12:25 -03 4h 43min ago shadow.timer         shadow.service

4 timers listed.
```

Cada linha é um timer com seis colunas de inteligência: o **próximo** disparo (`NEXT`), quanto tempo **falta** (`LEFT`), quando foi o **último** disparo (`LAST`), há quanto **tempo** foi (`PASSED`), o **nome** do timer e o **serviço que ele ativa**. O `fstrim.timer`, por exemplo, dispara a cada hora o `fstrim.service` — que manda o SSD descartar blocos não usados e manter o desempenho. É um clássico de tarefa que não precisa de um serviço rodando o tempo todo: o timer acorda, executa e volta a dormir.

O timer mais importante do Steam Deck (em termos de espaço) é o `fstrim.timer`. Se você notar lentidão progressiva no SSD, verifique se ele está disparando:

```terminal
$ systemctl status fstrim.timer --no-pager | head -5
● fstrim.timer - Discard unused blocks once a week
     Loaded: loaded (/usr/lib/systemd/system/fstrim.timer; enabled)
     Active: active (waiting) since Wed 2025-01-15 09:12:25 -03; 4h 44min ago
    Trigger: Wed 2025-01-15 14:00:00 -03; 4min 17s left
   Triggers: ● fstrim.service
```

A linha `Trigger` mostra o próximo disparo com contagem regressiva; a `Triggers` confirma qual serviço será ativado. Se `Triggers` aponta para uma unidade `inactive (dead)`, você já sabe que o serviço não está rodando o tempo todo — o timer o invoca, ele faz seu trabalho e termina.

:::info
No SteamOS, a atualização do sistema é conduzida pelo `steamos-update`, que não é um timer do systemd comum — é disparado pelo cliente Steam em resposta ao botão "Verificar atualizações". Já o `fstrim`, o `systemd-tmpfiles-clean` (limpeza de temporários) e outros são timers padrão que rodam discretamente sem você perceber.
:::

## A anatomia de um timer

Um timer é a união de dois arquivos: um `.timer` que define **quando** disparar e um `.service` de mesmo nome que define **o que** fazer. O `.timer` é o calendário; o `.service`, o executor. Para inspecionar a expressão de agendamento:

```terminal
$ systemctl cat fstrim.timer
# /usr/lib/systemd/system/fstrim.timer
[Unit]
Description=Discard unused blocks once a week
Documentation=man:fstrim

[Timer]
OnCalendar=hourly
AccuracySec=1h
Persistent=true

[Install]
WantedBy=timers.target
```

`OnCalendar=hourly` é a expressão que agenda. Ela pode assumir formas desde as mais simples até as precisas:

| Expressão | Significado |
|---|---|
| `hourly` | A cada hora (na hora cheia) |
| `daily` | Todo dia à meia-noite |
| `weekly` | Toda segunda-feira à meia-noite |
| `Mon..Fri 06:00` | Segunda a sexta às 6h |
| `*-*-01 03:00` | Dia 1º de todo mês às 3h |
| `Mon *-08,09-* 08:00` | Toda segunda-feira de agosto e setembro às 8h |

`AccuracySec` é um truque importante: ele permite que o `systemd` agrupe vários timers que disparam em horários próximos, evitando acordar o sistema várias vezes seguidas — economia de bateria que importa no Deck. `Persistent=true` significa que, se o timer perdeu um disparo (porque o Deck estava desligado), ele executa assim que possível, em vez de pular.

:::dica
Timers que disparam em intervalos fixos (não em horários de calendário) usam `OnBootSec=`, `OnUnitActiveSec=` e similares em vez de `OnCalendar`. Por exemplo, `OnBootSec=5min` dispara 5 minutos após o boot, independentemente do horário do relógio. Use `OnCalendar` para "toda terça às 3h" e `OnBootSec` para "5 minutos depois de ligar".
:::

## Lendo o log de execução de um timer

Quando o timer dispara, o serviço que ele ativa deixa rastros no journal. Mas o timer em si também loga:

```terminal
$ journalctl -u fstrim.timer --no-pager
Jan 15 09:12:25 steamdeck systemd[1]: Started Discard unused blocks once a week.
Jan 15 10:00:00 steamdeck systemd[1]: fstrim.timer: Will now trigger fstrim.service
Jan 15 11:00:00 steamdeck systemd[1]: fstrim.timer: Will now trigger fstrim.service
```

E o serviço disparado tem seus próprios logs:

```terminal
$ journalctl -u fstrim.service --no-pager
Jan 15 10:00:00 steamdeck systemd[1]: Starting Discard unused blocks...
Jan 15 10:00:01 steamdeck fstrim[28431]: /home: 120 GiB trimmed
Jan 15 10:00:01 steamdeck systemd[1]: fstrim.service: Deactivated successfully.
```

O ciclo completo: o timer acorda, puxa o serviço, o serviço executa, loga o que fez (120 GB liberados de blocos não usados) e se desativa — não fica rodando em segundo plano. Isso economiza recursos e é exatamente o padrão que você vai replicar ao escrever seu próprio timer.

## Timers versus serviços "always on"

Um erro comum de quem vem do mundo de scripts é manter um serviço rodando em loop com `sleep` em vez de usar um timer:

```bash
## Não faça isso — serviço acordado 24h/dia fazendo nada
while true; do
    /usr/local/bin/meu_script.sh
    sleep 3600
done
```

Com um timer, o equivalente é: um arquivo `.timer` com `OnCalendar=hourly` e um `.service` que chama o script. O timer dorme entre disparos; o serviço vive segundos. A diferença de consumo de RAM e CPU é brutal quando você escala para dezenas de tarefas, e o journal fica muito mais limpo — cada execução é rastreável, com timestamp próprio e sem ruído de loop.

## Resumo

- `systemctl list-timers` mostra próximo disparo, último disparo e o serviço ativado para cada timer.
- Todo timer é um calendário (`.timer`) que dispara um executor (`.service`) de mesmo nome.
- `OnCalendar` agenda por horário (`daily`, `Mon..Fri 06:00`); `OnBootSec` agenda relativo ao boot.
- `Persistent=true` recupera disparos perdidos enquanto o Deck estava desligado.
- Timers são superiores a loops `sleep` em serviços porque dormem entre execuções e geram logs limpos.

## Exercícios

1. Rode `systemctl list-timers` e identifique o timer com o menor `LEFT` (mais próximo de disparar) e o que está há mais tempo sem disparar (`PASSED`).
2. Inspecione o `fstrim.timer` com `systemctl cat fstrim.timer` e traduza cada diretiva da seção `[Timer]` para uma frase em português.
3. Veja o log do `fstrim.service` com `journalctl -u fstrim.service` e anote quanto espaço foi liberado na última execução.
4. Compare `systemctl list-timers` com `systemctl list-units --type=timer` e explique por que as duas listas podem ter diferenças.
5. **Desafio.** Crie seu próprio par `.timer` + `.service` que execute um script toda quarta-feira às 3h da manhã (use `OnCalendar=Wed 03:00`). Não precisa implementar o script — apenas crie os arquivos de unidade em `/etc/systemd/system`, rode `daemon-reload`, habilite e inicie o timer, e confirme com `list-timers` que ele aparece agendado.