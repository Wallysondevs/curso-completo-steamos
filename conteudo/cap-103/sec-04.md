O `journalctl` é a porta de acesso aos logs centralizados do systemd. No lugar de dezenas de arquivos soltos em `/var/log/`, o systemd-journald grava tudo — kernel, serviços, cron, autenticação — num formato binário que só o `journalctl` sabe ler bem. Dominar seus filtros transforma "não sei o que deu errado" em "o serviço X falhou por causa de Y", sem adivinhação.

:::objetivos
- Ler os logs mais recentes e acompanhá-los em tempo real
- Filtrar logs por serviço, usuário e prioridade
- Navegar temporalmente com `--since`, `--until` e `--since yesterday`
- Entender como o journald armazena e rotaciona os logs
- Interpretar os campos de prioridade e de origem de cada mensagem
:::

## A primeira leitura: do básico ao tempo real

O comando `journalctl` sem argumentos despeja os logs em ordem cronológica, do mais antigo ao mais recente, paginados. Quase sempre você quer o contrário: o mais novo embaixo do nariz.

```terminal
$ journalctl -n 10
dez 13 09:02:11 steamdeck systemd[1]: Started Network Manager.
dez 13 09:02:11 steamdeck dbus-daemon[842]: [system] Successfully activated service 'org.freedesktop.nm...'
dez 13 09:02:12 steamdeck systemd[1]: Reached target Network.
dez 13 09:02:14 steamdeck kernel: input: AT Translated Set 2 keyboard as /devices/platform/i8042/serio0/input/input3
```

A tabela a seguir cobre o essencial:

| Comando | O que faz |
|---|---|
| `journalctl` | Mostra todos os logs, paginados |
| `journalctl -n 50` | Mostra as 50 mensagens mais recentes |
| `journalctl -f` | Acompanha em tempo real (Ctrl+C para sair) |
| `journalctl -e` | Pula direto para o final do log |
| `journalctl --no-pager` | Despeja tudo sem paginação |
| `journalctl -b` | Mostra só o boot atual |
| `journalctl -b -1` | Mostra o boot anterior |
| `journalctl --list-boots` | Lista todos os boots registrados, com IDs |
| `journalctl -b <ID>` | Mostra logs de um boot específico pelo ID |
| `journalctl -r` | Ordem reversa (mais recente primeiro) |

:::dica
`journalctl -f` é o equivalente a `tail -f` dos logs antigos, mas com uma vantagem: você pode combiná-lo com os filtros de serviço. `journalctl -u sshd -f` acompanha só o SSH em tempo real.
:::

## Filtrando por origem

O journald registra, para cada mensagem, de onde ela veio: qual serviço, qual usuário, qual binário. Filtrar por esses campos é o primeiro passo de qualquer diagnóstico.

| Comando | O que faz |
|---|---|
| `journalctl -u sshd` | Logs do serviço `sshd.service` |
| `journalctl -u sshd -u nginx` | Logs de dois serviços combinados |
| `journalctl -u steam` | Logs do daemon do Steam |
| `journalctl --user-unit app.service` | Logs de serviço de usuário (sem `sudo`) |
| `journalctl _UID=1000` | Logs de um usuário específico (pelo UID) |
| `journalctl _COMM=sshd` | Logs de um binário específico |
| `journalctl -k` | Só mensagens do kernel (equivale a `dmesg`) |
| `journalctl -p err` | Só mensagens com prioridade error ou pior |

```terminal
$ journalctl -u sshd --no-pager | head -5
dez 13 08:22:41 steamdeck sshd[1241]: Server listening on 0.0.0.0 port 22.
dez 13 09:15:03 steamdeck sshd[4322]: Accepted publickey for ana from 192.168.1.40 port 5... 
dez 13 09:15:03 steamdeck sshd[4322]: pam_unix(sshd:session): session opened for user ana(uid=1000)
```

As linhas mostram o ciclo completo de uma conexão SSH: o daemon escutando, a autenticação por chave pública aceita e a sessão aberta pelo PAM. Cada entrada traz o host, o timestamp, o processo e o PID.

## Filtrando por tempo

Quando o problema "aconteceu ontem", o filtro temporal é a via mais rápida. O `journalctl` aceita datas absolutas e expressões relativas.

| Comando | O que faz |
|---|---|
| `journalctl --since "2024-12-13 09:00:00"` | Logs a partir de uma data/hora |
| `journalctl --until "2024-12-13 10:00:00"` | Logs até uma data/hora |
| `journalctl --since "2024-12-13 09:00" --until "2024-12-13 10:00"` | Janela entre dois momentos |
| `journalctl --since today` | Logs de hoje |
| `journalctl --since yesterday` | Logs de ontem |
| `journalctl --since "1 hour ago"` | Logs da última hora |
| `journalctl --since "30 min ago"` | Logs da última meia hora |
| `journalctl --since -2h` | Logs das últimas 2 horas (sintaxe compacta) |

```terminal
$ journalctl --since "1 hour ago" --priority=warning
dez 13 08:42:10 steamdeck kernel: usb 1-2: device descriptor read/64, error -110
dez 13 08:42:11 steamdeck kernel: usb 1-2: device not accepting address 3, error -110
```

Combinar janela temporal com nível de prioridade é o padrão de ouro para achar o que quebrou **sem** afogar em ruído. Aqui, um pendrive problemático gerou erros USB `-110` (timeout de leitura).

## Prioridades e campos estruturados

Cada mensagem do journald carrega uma prioridade syslog e dezenas de campos estruturados. Entendê-los permite filtros cirúrgicos.

| Prioridade | Nome | Uso |
|---|---|---|
| `0` | `emerg` | Sistema inutilizável |
| `1` | `alert` | Ação imediata necessária |
| `2` | `crit` | Condição crítica |
| `3` | `err` | Erro |
| `4` | `warning` | Aviso |
| `5` | `notice` | Condição normal, mas notável |
| `6` | `info` | Informativo |
| `7` | `debug` | Depuração |

```terminal
$ journalctl -p 3 -b
dez 13 08:22:45 steamdeck systemd-modules-load[431]: Failed to find module 'vboxdrv'
```

O `-p 3` equivale a `-p err` e mostra tudo com prioridade `err`, `crit`, `alert` ou `emerg` desde o boot. A mensagem revela que o systemd tentou carregar um módulo do VirtualBox que não existe — inofensivo, mas aparece como erro.

:::info
O journald também grava campos como `_SYSTEMD_UNIT`, `_PID`, `_UID`, `_GID`, `_HOSTNAME` e `SYSLOG_IDENTIFIER`. Você pode filtrar por qualquer um usando `journalctl _SYSTEMD_UNIT=sshd.service`, por exemplo. A lista completa de campos sai com `journalctl -o verbose`.
:::

## Formatos de saída

O formato padrão é legível, mas há situações em que você quer JSON para tratar com ferramentas externas, ou compacto para caber em telas estreitas.

| Comando | O que faz |
|---|---|
| `journalctl -o short` | Formato padrão (padrão do terminal) |
| `journalctl -o short-iso` | Timestamp ISO 8601 completo |
| `journalctl -o short-full` | Timestamp completo + todos os campos básicos |
| `journalctl -o verbose` | Todos os campos estruturados de cada mensagem |
| `journalctl -o json` | Saída em JSON, uma mensagem por linha |
| `journalctl -o json-pretty` | JSON formatado e legível |
| `journalctl -o cat` | Só a mensagem, sem timestamp nem metadados |
| `journalctl -o export` | Formato binário exportável (para arquivamento) |

```terminal
$ journalctl -u sshd -n 1 -o json-pretty
{
        "__CURSOR" : "s=8f3a...",
        "_SYSTEMD_UNIT" : "sshd.service",
        "MESSAGE" : "Accepted publickey for ana from 192.168.1.40 port 53122 ssh2",
        "PRIORITY" : "6",
        ...
}
```

O `-o json-pretty` combina bem com `jq` para processamento: `journalctl -o json | jq 'select(._SYSTEMD_UNIT=="sshd.service") | .MESSAGE'`.

## Resumo

- `journalctl -n`, `-f` e `-e` cobrem o essencial: recente, tempo real e fim do log
- `-u` filtra por serviço; `_UID`, `_COMM` e `_SYSTEMD_UNIT` são filtros por campo
- `--since`/`--until` aceitam datas absolutas e expressões como `yesterday` ou `1 hour ago`
- `-b`, `-b -1` e `--list-boots` isolam logs por boot, essencial para crash e reboot
- `-p` filtra por prioridade syslog de `0` (emerg) a `7` (debug)
- `-o json`/`verbose` expõem os campos estruturados para processamento com `jq`

## Exercícios

1. Acompanhe os logs do sistema em tempo real com `journalctl -f`. Em outro terminal, inicie ou pare um serviço e observe as mensagens aparecerem.
2. Liste todos os boots registrados com `journalctl --list-boots` e compare as mensagens de `error` entre o boot atual e o anterior.
3. Filtre as mensagens do daemon SSH das últimas 2 horas usando `--since` e `-u`. Identifique uma tentativa de login bem-sucedida e uma falha.
4. Use `journalctl -p warning -b` para listar todos os avisos do boot atual. Classifique mentalmente quais merecem investigação.
5. **Desafio.** Extraia todas as mensagens de `err` do boot atual em JSON e use `jq` para contar quantas vieram de cada serviço: `journalctl -b -p err -o json | jq -r '._SYSTEMD_UNIT' | sort | uniq -c | sort -rn`.