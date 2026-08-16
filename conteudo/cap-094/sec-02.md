Se o `dmesg` conta a história do hardware, o `journalctl` conta a história do sistema inteiro — serviços, aplicações, agendador, autenticação, tudo que se conecta ao systemd. O SteamOS é construído sobre systemd, e todo o seu funcionamento em modo Desktop passa pelo journal, o banco de dados binário de logs que o systemd mantém. Dominar o `journalctl` é a diferença entre vasculhar mensagens à deriva e apontar com precisão o que falhou e quando.

:::objetivos
- Entender o que o journal systemd armazena e por que é binário
- Navegar por boot, serviço e intervalo de tempo
- Filtrar por unidade, prioridade e identificador
- Persistir logs e investigar boots anteriores
:::

## O journal do systemd

O journal é diferente dos arquivos de log tradicionais em `/var/log`. Em vez de um texto por serviço, ele centraliza tudo em um formato binário indexado, com campos estruturados (unidade, prioridade, processo, mensagem). Isso permite consultas muito mais expressivas do que `grep` em arquivos soltos — e é exatamente o que o `journalctl` explora.

```terminal
$ journalctl -n 10
fev 20 10:12:33 steamdeck systemd[1]: Started User Manager for UID 1000.
fev 20 10:12:34 steamdeck steam[2819]: Game 1234560 started
fev 20 10:12:35 steamdeck kernel: amdgpu 0000:04:00.0: amdgpu: ring gfx uses VM inv eng 0
```

Cada linha tem carimbo, host, processo e mensagem. O `[1]` depois de `systemd` é o PID, e o texto `Started User Manager` veio do próprio init. Como tudo converge para o journal, um único comando vasculha fontes que antes exigiriam meia dúzia de arquivos diferentes.

## Filtrando por boot

O journal separa cada inicialização em um "boot" numerado. O boot atual é `-b`; os anteriores são `-b -1`, `-b -2`, e assim por diante. Isso resolve um problema clássico: o erro que travou o deck ontem ainda está registrado, mesmo que você já tenha reiniciado — e continua acessível.

```terminal
$ journalctl -b -p err -n 15
fev 20 09:58:01 steamdeck systemd-modules-load[412]: could not find module by name='v4l2loopback'
fev 20 09:58:02 steamdeck kernel: tpm tpm0: A TPM error (256) occurred attempting to determine PCRS
```

`-p err` limita às mensagens de prioridade error ou pior. A combinação `-b -p err` é o "abre-alas" do diagnóstico: em um único comando você vê todos os erros do boot atual, de todos os serviços, em ordem cronológica. É o ponto de partida de quase toda pista.

```terminal
$ journalctl --list-boots
-2  3d2c4b... 2025-02-18 08:00:00 ... 
-1  9f8e1a... 2025-02-19 18:30:00 ...
 0  b7c1d2... 2025-02-20 10:00:00 ...
```

`--list-boots` mostra todos os boots registrados (desde que a persistência esteja ligada). O boot `0` é sempre o atual, e os negativos vão retrocedendo. Saber quantos boots o journal guarda ajuda a entender até onde sua memória de diagnóstico alcança.

## Rastreando um serviço específico

Cada unidade do systemd tem seu próprio fluxo de mensagens dentro do journal. O parâmetro `-u` filtra pela unidade, permitindo isolar o histórico de um serviço (como o Steam, o `steamos-update` ou o gerenciador de rede) sem que as mensagens dos outros poluam a leitura.

```terminal
$ journalctl -u steam -n 20 --no-pager
fev 20 10:12:00 steamdeck steam[2819]: Starting Steam client
fev 20 10:12:01 steamdeck steam[2819]: Loaded Steam runtime (soldier)
fev 20 10:12:40 steamdeck steam[2819]: Game 1234560 terminated with signal 11 (SIGSEGV)
```

A última linha é ouro: o jogo morreu com `SIGSEGV` (segmentation fault), um acesso a memória inválida. Isso te diz, sem abrir o jogo de novo, que houve um crash de processo — e o código de sinal (`11`) aponta para onde olhar. Cruzar esse dado com o `dmesg` da mesma hora fecha o diagnóstico.

:::dica
Use `--no-pager` quando estiver redirecionando a saída para um arquivo (`journalctl -u steam > log.txt`). O pager interativo (`less`) não faz sentido dentro de um pipe e pode truncar o que você captura.
:::

## Intervalos de tempo

Muitas vezes você sabe *quando* o problema aconteceu, mas não *qual* serviço o causou. Os filtros `--since` e `--until` recortam o journal por intervalo de tempo, aceitando formatos legíveis como `today`, `yesterday`, `-1 hour` ou timestamps completos.

```terminal
$ journalctl --since "2025-02-20 10:00:00" --until "2025-02-20 10:15:00" -p warning
```

Esse comando responde à pergunta "o que deu warning entre 10h e 10h15?". É o recorte ideal quando você percebeu o sintoma num horário específico — por exemplo, quando o jogo travou às 14h — e quer ver tudo que o sistema registrou na vizinhança daquele instante.

```terminal
$ journalctl --since yesterday
$ journalctl --since "-30 min"
```

Os formatos relativos (`-30 min`, `-1 hour`) são práticos para "o que mudou desde que comecei a testar".

## Prioridades e campos estruturados

Além de `-p` (prioridade) e `-u` (unidade), o journal expõe campos nomeados que você pode consultar com precisão cirúrgica. Identificador do processo (`_PID`), binário executável (`_COMM`), usuário (`_UID`) e muitos outros estão disponíveis na notação `CAMPO=valor`.

```terminal
$ journalctl _COMM=steam -n 10
$ journalctl _PID=2819
$ journalctl _UID=1000 --since today
```

Filtrar por `_COMM=steam` traz mensagens do processo Steam sem se restringir à unidade. É útil quando um processo é lançado fora do sistema de unidades — ou quando você acompanhou um PID específico de um crash report.

:::nota
O identificador de unidade (`-u`) e o filtro por processo (`_COMM`) são complementares: um serviço pode rodar muitos processos, e um processo pode nascer fora de um serviço. Use um, o outro, ou ambos conforme o que você está caçando.
:::

## Persistência dos logs

Por padrão, o journal pode ser mantido apenas em memória (volátil) ou persistido em disco, dependendo da configuração em `/etc/systemd/journald.conf` e da existência do diretório `/var/log/journal`. No Steam Deck, vale conferir se os logs sobrevivem a um reboot — caso contrário, você perde o registro de um crash assim que desliga.

```terminal
$ journalctl --disk-usage
Archived and active journals take up 64.0M in the file system.

$ ls -ld /var/log/journal
drwxr-xr-x 4 root root 4096 fev 20 10:00 /var/log/journal
```

Se `/var/log/journal` existe, a persistência está ativa e os logs sobrevivem ao reboot. O `--disk-usage` mostra quanto os arquivos ocupam — útil para saber se o journal está consumindo espaço demais no SSD de 64 GB, onde cada gigabyte conta.

```terminal
$ sudo journalctl --vacuum-size=50M
Deleted archived journal /var/log/journal/.../system@...journal.
Vacuuming done, freed 14.0M of archived journals.
```

O `--vacuum-size` poda logs antigos até caber no limite indicado. Num deck com pouco espaço, essa é uma manutenção ocasional saudável — mas lembre-se de que ela apaga histórico de diagnóstico.

## Tabela de filtros essenciais

| Filtro | Efeito |
|---|---|
| `-b` / `-b -1` | boot atual / boot anterior |
| `-p err` | só prioridade error ou pior |
| `-u steam` | mensagens da unidade `steam` |
| `--since` / `--until` | recorte por tempo |
| `_COMM=steam` / `_PID=2819` | campo estruturado |
| `-f` | seguir novas mensagens (como `tail -f`) |
| `-o json-pretty` | saída estruturada completa |

## Resumo

- O journal systemd centraliza logs de serviços, kernel e aplicações em formato binário indexado.
- `-b` seleciona o boot; `-b -1`, `-b -2` acessam boots anteriores.
- `-u` filtra por unidade, `-p` por prioridade, `_COMM=` e `_PID=` por campo estruturado.
- `--since`/`--until` recortam por tempo; `-f` segue em tempo real.
- A persistência (`/var/log/journal`) decide se os logs sobrevivem ao reboot; `--vacuum-size` gerencia o espaço usado.

## Exercícios

1. Rode `journalctl -b -p err` e liste os erros do boot atual com seus serviços de origem.
2. Use `journalctl --list-boots` e acesse o boot anterior com `-b -1`; compare os erros encontrados.
3. Filtre as mensagens da unidade `steam` com `-u steam` e identifique o último jogo iniciado e seu evento de término.
4. Recorte o journal de um intervalo de 10 minutos usando `--since` e `--until`; descreva o que o sistema registrou.
5. **Desafio.** Verifique se a persistência está ativa (`ls /var/log/journal`), meça o uso com `--disk-usage` e faça um `--vacuum-size` para um valor razoável. Explique o trade-off entre economia de espaço e retenção de histórico.