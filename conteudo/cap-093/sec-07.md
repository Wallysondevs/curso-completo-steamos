Em todas as seções anteriores, `journalctl` apareceu como a ferramenta que respondia à pergunta "o que aconteceu". Esta seção é dedicada a dominá-la de vez — não só os comandos básicos, mas os filtros, as saídas formatadas e as consultas que transformam o journal de um mar de texto num interrogatório produtivo. Porque, na prática, você passa mais tempo lendo logs do que executando comandos de reparo.

:::objetivos
- Filtrar o journal por prioridade, unidade, boot e intervalo de tempo
- Formatar a saída para extrair só o que interessa
- Cruzar mensagens de kernel, systemd e aplicação numa cadeia causal
- Rastrear um incidente do primeiro sintoma à causa raiz
:::

## O journal não é um arquivo de texto

Diferente do clássico `/var/log/syslog` que existia no mundo SysV init, o `journald` do systemd armazena logs em formato binário estruturado. Cada entrada tem campos indexados: prioridade, unidade de sistema, processo, UID, ID do boot e muito mais. Isso permite consultas que seriam impossíveis com `grep` puro.

```terminal
$ journalctl --no-pager | wc -l
118342
```

Cento e dezoito mil linhas de log numa máquina que subiu há poucas horas. É por isso que você nunca lê o journal cru: você sempre **filtra**.

```terminal
$ journalctl -b -p warning --no-pager | head -5
Dec 03 14:22:01 steamdeck kernel: ACPI BIOS Error (bug): Could not resolve symbol [\_SB.PCI0.GPP0], AE_NOT_FOUND
Dec 03 14:22:01 steamdeck kernel: ACPI Error: AE_NOT_FOUND, During name lookup/catalog
```

Aqui, `-b` limita ao boot atual, `-p warning` pega prioridade warning ou pior (emerg, alert, crit, err, warning). As duas primeiras linhas já mostram um erro ACPI de BIOS — inofensivo na maioria dos casos, mas é o tipo de mensagem que assusta quem lê o journal cru sem filtrar.

## Os filtros que você vai usar toda semana

Há seis filtros de uso diário. Memorize-os — eles cobrem 90% das consultas de diagnóstico:

| Filtro | Exemplo | O que faz |
|---|---|---|
| `-b` | `journalctl -b` | boot atual |
| `-b -1` | `journalctl -b -1` | boot anterior |
| `-p` | `journalctl -p err` | prioridade mínima (emerg..debug) |
| `-u` | `journalctl -u NetworkManager` | unidade systemd |
| `--since` / `--until` | `--since "10 min ago"` | janela temporal |
| `-k` | `journalctl -k` | só mensagens do kernel (atalho para `dmesg`) |

Eles se combinam. Por exemplo, para ver os erros do NetworkManager no boot anterior:

```terminal
$ journalctl -b -1 -u NetworkManager -p err --no-pager
Dec 02 21:03:15 steamdeck NetworkManager[712]: <error> device (wlan0): Activation: failed for connection 'AnaHome'
Dec 02 21:03:15 steamdeck NetworkManager[712]: <error> device (wlan0): state change: failed -> disconnected
```

Em duas linhas você sabe: ontem à noite houve falha de ativação na conexão `AnaHome`. A causa pode estar em linhas anteriores do mesmo journal (falta de sinal, senha mudada) — basta tirar o filtro `-p err` e ampliar a janela de tempo.

## O caminho do incidente: kernel → systemd → aplicação

Os problemas mais difíceis de diagnosticar são os que atravessam camadas: um erro de I/O no kernel gera uma falha de montagem no systemd, que gera um crash de aplicação que você vê. O `journalctl` permite seguir essa cadeia combinando múltiplos filtros.

```terminal
$ journalctl -b -1 -o short-monotonic -p err | tail -6
[+142.441s] steamdeck kernel: I/O error, dev nvme0n1, sector 845120 op READ
[+142.482s] steamdeck systemd[1]: Failed to mount /home.
[+142.513s] steamdeck systemd-coredump[812]: Process 712 (steam) of user 1000 dumped core.
```

Com `-o short-monotonic`, o timestamp mostra segundos desde o boot em vez de data/hora, o que facilita ver a distância temporal entre eventos. Em 0.072 segundo, um erro de disco no kernel virou falha de montagem, que derrubou o Steam. A cadeia causal está nua.

:::dica
`-o json-pretty` exporta o journal em JSON, campo a campo. É útil para scripts ou para inspecionar metadados que não aparecem na saída padrão: UID, SELinux context, cgroup, e até o `_PID` e `_EXE` do processo emissor. Experimente com `journalctl -b -n1 -o json-pretty` para ver a estrutura de uma única mensagem.
:::

## Seguindo o rastro de um serviço específico

Quando um serviço falha sistematicamente, o `journalctl -u` combinado com `--since` é o microscópio certo. Suponha que você desconfia do `steamos-session` depois de voltar da suspensão:

```terminal
$ journalctl -u steamos-session --since "30 min ago" --no-pager
Dec 03 14:15:02 steamdeck systemd[1812]: Started SteamOS session.
Dec 03 14:15:05 steamdeck gamescope-session[1921]: Running SteamOS session in gamescope
Dec 03 14:28:53 steamdeck systemd[1812]: steamos-session.service: Main process exited, code=killed, status=9/KILL
Dec 03 14:28:53 steamdeck systemd[1812]: steamos-session.service: Failed with result 'signal'.
```

A sessão subiu às 14:15 e foi morta com `SIGKILL` (status 9) às 14:28. SIGKILL vindo do sistema, sem você matar, sugere que o *out-of-memory killer* (OOM) do kernel agiu — a memória encheu, o kernel escolheu uma vítima e liquidou o `gamescope`. Confirmar isso requer ver as mensagens do kernel na mesma janela:

```terminal
$ journalctl -k --since "14:25" --until "14:30" --no-pager | grep -i oom
Dec 03 14:28:52 steamdeck kernel: oom-kill:constraint=CONSTRAINT_NONE,nodemask=(null),cpuset=/,mems_allowed=0,global_oom,task_mem=4200MB,task=steam,pid=2015,uid=1000
Dec 03 14:28:53 steamdeck kernel: Out of memory: Killed process 2015 (steam) total-vm:5200000kB, anon-rss:4200000kB, file-rss:3500kB, shmem-rss:8000kB, UID:1000
```

O OOM matou o Steam, que consumia 4.2 GB de RAM. A sessão caiu junto. O que deveria ser um "desempenho caiu e fechou" era, na verdade, um vazamento de memória.

## O journal é persistente (e cresce)

No SteamOS, o journal é armazenado em disco e sobrevive a reinicializações. Isso é bom para diagnóstico e ruim para espaço se não houver limite.

```terminal
$ journalctl --disk-usage
Archived and active journals take up 384.0M on disk.
$ journalctl --vacuum-size=200M
Deleted archived journal /var/log/journal/8a3b4d.../user-1000.journal (42.0M).
Vacuuming done, freed 42.0M of archived journals from /var/log/journal/.
```

`--vacuum-size` define um teto; `--vacuum-time=7d` mantém só os últimos sete dias. Num aparelho de 64 GB, 384 MB em logs é espaço que poderia ser jogo.

:::atencao
Nunca apague `/var/log/journal` manualmente com `rm -rf` — o journald pode estar com o arquivo aberto e corromper o banco. Use `journalctl --rotate` e `journalctl --vacuum-time=1s` para forçar rotação e esvaziamento limpos.
:::

## Resumo

- O journal é binário e indexado; usar `grep` puro nele perde metadados — sempre filtre com `journalctl`.
- `-b`, `-p`, `-u`, `--since`, `--until` e `-k` são os seis filtros de uso diário.
- `-o short-monotonic` alinha os eventos num eixo de segundos desde o boot, expondo a cadeia causal.
- Combinar `journalctl -u <serviço>` com `journalctl -k` na mesma janela conecta falhas de aplicação a causas de kernel.
- OOM killer aparece como `Out of memory: Killed process` no kernel; a vítima cai com status `9/KILL`.
- `journalctl --disk-usage` e `--vacuum-size` controlam o espaço ocupado pelos logs em disco.

## Exercícios

1. Conte o número de linhas de log do boot atual com cada prioridade (`emerg`, `alert`, `crit`, `err`, `warning`) usando `journalctl -b -p <nível> --no-pager | wc -l`.
2. Localize todas as mensagens de erro do seu último boot com `journalctl -b -1 -p err` e classifique cada uma por camada: kernel, systemd ou aplicação.
3. Use `--since "1 hour ago" --until "now"` para ver tudo o que aconteceu na última hora. Há alguma mensagem de warning que se repete em padrão periódico?
4. Escolha um serviço ativo (`systemctl list-units --state=running | head -10`) e inspecione seu log com `journalctl -u <serviço> -b`. O serviço registrou erros neste boot?
5. **Desafio.** Combine `journalctl -b -o json-pretty` com `jq` (se instalado) para listar todas as unidades que geraram mensagens de erro no boot atual, sem repetições. Se `jq` não estiver disponível, escreva o filtro equivalente usando apenas `journalctl` e `awk`.