A seção anterior ensinou a navegar e filtrar logs. Esta vai um passo além: usar o `journalctl` como ferramenta de **caça a falhas** — rastrear um processo pelos logs, monitorar especificamente o kernel, acompanhar uma unidade desde o boot e entender como o journald gerencia o disco. É aqui que o socorrista chega depois que o sistema travou.

:::objetivos
- Rastrear um processo específico por PID e por binário
- Analisar logs do kernel com filtros avançados
- Usar o cursor do journald para leitura incremental
- Acompanhar unidades de sistema e de usuário separadamente
- Gerenciar o tamanho e a retenção dos logs com `vacuum`
:::

## Rastreando um processo pelos logs

Quando um daemon derruba conexões ou consome CPU, você tem um PID e quer toda a história daquele processo. O journald grava o PID em cada mensagem — basta filtrá-lo.

```terminal
$ journalctl _PID=1241
dez 13 08:22:41 steamdeck sshd[1241]: Server listening on 0.0.0.0 port 22.
dez 13 08:22:41 steamdeck sshd[1241]: Server listening on :: port 22.
```

| Comando | O que faz |
|---|---|
| `journalctl _PID=1241` | Logs de um PID específico |
| `journalctl _PID=1241 --since "1 hour ago"` | Logs do PID numa janela de tempo |
| `journalctl _COMM=sshd` | Logs de todas as instâncias de um binário |
| `journalctl _EXE=/usr/sbin/sshd` | Logs pelo caminho completo do executável |
| `journalctl _SYSTEMD_UNIT=sshd.service _PID=1241` | Cruzando unit e PID |
| `journalctl _UID=1000 _COMM=su` | Logs do binário `su` para um usuário |

:::dica
O `_PID` só existe se o processo escreveu no journald enquanto rodava com aquele PID. PIDs são reutilizados após reinícios — sempre combine `_PID` com `--since` para não pegar mensagens de um processo antigo que reutilizou o mesmo número.
:::

## Kernel em foco

O `journalctl -k` substitui o antigo `dmesg`, mas com filtros muito mais ricos, porque o journald indexa as mensagens do kernel com os mesmos campos estruturados do resto.

| Comando | O que faz |
|---|---|
| `journalctl -k` | Todas as mensagens do kernel do boot atual |
| `journalctl -k -b -1` | Mensagens do kernel do boot anterior |
| `journalctl -k --since today` | Mensagens do kernel só de hoje |
| `journalctl -k -p err` | Só erros do kernel |
| `journalctl -k -g "usb|bluetooth"` | Filtra por expressão regular (com `-g`) |
| `journalctl -k --no-hostname -o short-monotonic` | Timestamp monotônico, sem hostname |

```terminal
$ journalctl -k -p err --since "10 min ago"
dez 13 09:40:02 steamdeck kernel: Bluetooth: hci0: command 0x1011 tx timeout
dez 13 09:40:02 steamdeck kernel: Bluetooth: hci0: unexpected event for opcode 0x1011
```

Essas duas linhas apontam para firmware Bluetooth respondendo com atraso — um sintoma clássico de módulo `btusb` com problema, não de configuração de sistema. Saber ler o kernel é saber que o culpado está no hardware/firmware, não no seu `bluetooth.service`.

:::nota
O `-g` (ou `--grep`) aplica expressão regular POSIX **nas mensagens**. Diferente de `grep` externo, ele filtra antes de paginar, então você ainda navega com as setas. Use `-g "pattern"` em vez de `| grep` sempre que quiser manter a paginação.
:::

## Cursor e leitura incremental

O journald mantém um **cursor** — uma posição opaca no fluxo de logs — para que ferramentas possam retomar a leitura de onde pararam, sem perder nem repetir mensagens.

| Comando | O que faz |
|---|---|
| `journalctl --show-cursor` | Exibe o cursor junto com as mensagens |
| `journalctl --after-cursor="cursor_string"` | Mostra só mensagens após um cursor |
| `journalctl -n 1 --show-cursor` | Pega o cursor da última mensagem |
| `journalctl --until-cursor="cursor_string"` | Mostra só até um cursor |

```terminal
$ journalctl -n 1 --show-cursor
-- cursor: s=8f3a...c0

dez 13 09:41:00 steamdeck sshd[4322]: Received disconnect from 192.168.1.40 port 5...
```

Onde `--show-cursor` imprime o cursor, `--after-cursor` o consome. É o mecanismo que monitoradores de log (como `journald` agents e coletores de métricas) usam para processar cada mensagem exatamente uma vez.

:::info
Em scripts, o padrão completo é: gravar o cursor da última linha lida (`journalctl -n 1 --show-cursor | tail -1`), persistir em arquivo, e na próxima execução ler tudo após ele. Assim nenhuma mensagem se perde entre execuções, mesmo que o daemon reinicie.
:::

## Unidades de sistema versus unidades de usuário

O systemd distingue o escopo de **sistema** (um daemon global) do escopo de **usuário** (serviços que rodam no contexto de uma sessão logada). O `journalctl` respeita essa divisão.

```terminal
$ journalctl --user -u pipewire -n 5
dez 13 09:00:11 steamdeck pipewire[2100]: mod.x11-bell: X11 bell module loaded
dez 13 09:00:11 steamdeck pipewire[2100]: pw.context: 0 parsed context
```

| Comando | O que faz |
|---|---|
| `journalctl --user` | Logs de unidades de usuário (sem `sudo`) |
| `journalctl --user -u pipewire` | Logs de um serviço de usuário específico |
| `journalctl -u sshd` | Logs de uma unidade de sistema (requer privilégio frequentemente) |
| `journalctl --system` | Logs de unidades de sistema explicitamente |

:::atencao
No SteamOS, serviços como `pipewire`, `pipewire-pulse` e `wireplumber` rodam no escopo **usuário**, não no de sistema. Procurar os logs deles com `journalctl -u pipewire` (sem `--user`) não encontra nada. É uma pegadinha clássica ao depurar áudio.
:::

## Tamanho, retenção e vacuum

O journald grava em `/var/log/journal/` e, se não for limitado, cresce sem parar. O `--vacuum` foi feito para essa faxina.

| Comando | O que faz |
|---|---|
| `journalctl --disk-usage` | Mostra quanto disco os logs ocupam |
| `journalctl --vacuum-size=500M` | Apaga logs antigos até ficar com 500 MB no máximo |
| `journalctl --vacuum-time=7d` | Apaga logs com mais de 7 dias |
| `journalctl --vacuum-files=5` | Mantém só os 5 arquivos de log mais recentes |
| `journalctl --vacuum-size=100M --vacuum-time=2weeks` | Combina os dois limites (vale o menor) |

```terminal
$ journalctl --disk-usage
Archived and active journals take up 1.2G in the file system.

$ journalctl --vacuum-size=500M
Deleted archived journal /var/log/journal/.../system@000...journal (512.0M).
Vacuuming done, freed 512.0M of archived journals from /var/log/journal/....
```

O `--disk-usage` primeiro reporta o consumo, e o `--vacuum-size` remove arquivos arquivados (rotacionados) começando do mais antigo, até atingir o limite.

:::perigo
O `--vacuum` **não** é reversível. Mensagens removidas dos logs arquivados se perdem para sempre. Antes de rodar, confirme com `--disk-usage` que você realmente precisa, e prefira `--vacuum-time` (que respeita a idade) a `--vacuum-size` agressivo demais.
:::

## Resumo

- `_PID`, `_COMM` e `_EXE` rastreiam a história de um processo; combine com `--since` para evitar PIDs reutilizados
- `journalctl -k` é o `dmesg` moderno, com filtros `-p` e `-g` sobre as mensagens do kernel
- O cursor permite leitura incremental sem perder nem duplicar mensagens
- `--user` e `--system` separam o escopo da sessão do escopo do sistema
- `--disk-usage` monitora; `--vacuum-size/time/files` limpa com critérios de tamanho, idade e contagem

## Exercícios

1. Encontre o PID do processo `sshd` com `pgrep sshd` e extraia todos os logs dele com `journalctl _PID=<pid>`.
2. Lista as mensagens de kernel com erro dos últimos 30 minutos usando `journalctl -k -p err --since "30 min ago"`. Tente identificar se alguma merece ação.
3. Capture o cursor da última mensagem com `--show-cursor`, gere alguns logs novos (iniciando/parando um serviço) e leia só as mensagens após o cursor.
4. Descubra quanto espaço os logs ocupam com `--disk-usage` e, se for muito, limpe com `--vacuum-time=14d`.
5. **Desafio.** Depure áudio: rode `journalctl --user -u pipewire -u wireplumber -n 30`, identifique se há mensagens de erro e proponha um filtro por prioridade que mostre apenas os problemas na hora do boot.