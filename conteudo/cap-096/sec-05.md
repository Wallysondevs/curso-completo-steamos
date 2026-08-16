Se há um comando que todo usuário do Steam Deck deveria ter na ponta dos dedos, é o `journalctl`. Ele lê o *journal* — o banco de logs binários do `systemd` — e entrega, em frações de segundo, o que aconteceu no sistema desde o boot até o último erro de driver. Sem ele, você fica cego quando o Wi-Fi some, a atualização trava ou um serviço se recusa a subir. Esta seção apresenta os fundamentos: ler o journal do boot atual, de uma unidade específica e saber o que cada campo da saída significa.

:::objetivos
- Entender o que é o journal e como ele difere dos logs de texto tradicionais
- Navegar pelo journal do boot atual com `journalctl -b`
- Consultar os logs de uma unidade específica com `-u`
- Interpretar os campos de cada linha: timestamp, host, serviço e mensagem
- Conhecer as limitações do journal no SteamOS (persistência e raiz somente-leitura)
:::

## Um banco de logs, não um arquivo de texto

Antes do `systemd`, os logs do sistema ficavam em arquivos de texto dentro de `/var/log`: `syslog`, `messages`, `auth.log`. Quem quisesse investigar um problema usava `less` e `grep` nesses arquivos, que cresciam sem controle e exigiam rotação manual. O `journald` substituiu esse modelo por um banco binário indexado: cada entrada tem campos estruturados (timestamp, unidade, PID, prioridade, mensagem) e o `journalctl` consulta por qualquer um deles.

As vantagens práticas: o banco é muito mais rápido de filtrar, não corrompe quando o sistema desliga abruptamente, e cada boot é uma "sessão" separada que você pode acessar individualmente. A desvantagem: você não pode ler o arquivo com `cat` ou `less` — sempre precisa do `journalctl`.

```terminal
$ journalctl --no-pager | head -5
Jan 15 09:12:25 steamdeck systemd[1]: Starting Journal Service...
Jan 15 09:12:25 steamdeck systemd[1]: Started Journal Service.
Jan 15 09:12:25 steamdeck systemd-journald[312]: Journal started.
Jan 15 09:12:25 steamdeck systemd-journald[312]: Runtime Journal (/run/log/journal) is 8.0M, max 64.0M.
Jan 15 09:12:30 steamdeck kernel: Linux version 6.5.0-valve21-1-neptune-65
```

Cada linha é uma entrada, e cada entrada tem o mesmo formato: `<data> <hora> <host> <processo>[PID]: <mensagem>`. No exemplo, a primeira ação registrada no journal é ele mesmo iniciando e reportando seu tamanho — 8 MB, o que cabe em `/run` (memória). Depois vem o kernel, o gerenciador de rede e assim por diante.

## O journal de um boot específico

O comando mais usado deste capítulo inteiro é este:

```terminal
$ journalctl -b
```

Ele devolve todos os logs **do boot atual**, do primeiro ao último. Sem `-b`, o comando mostra tudo desde o início do journal, que pode incluir boots anteriores e ser imenso. O `-b` é o primeiro filtro que você aplica em toda investigação, porque restringe a busca ao cenário atual.

Para ver boots anteriores (extremamente útil quando o sistema travou e você quer saber o que houve no voo anterior):

```terminal
$ journalctl --list-boots
 0 40c3a1d... Wed 2025-01-15 09:12:25 -03—Wed 2025-01-15 14:30:01 -03
-1 5b2117f... Tue 2025-01-14 18:45:10 -03—Tue 2025-01-14 22:10:33 -03
-2 a8e92c4... Mon 2025-01-13 08:00:05 -03—Mon 2025-01-13 23:59:18 -03
```

Cada boot tem um ID (hash) e um intervalo de datas. O offset (0, -1, -2) é o que você passa para `journalctl -b -1` para ler o boot imediatamente anterior. É uma máquina do tempo: se o Deck congelou ontem, você reinicia, roda `journalctl -b -1` e vasculha os segundos antes do travamento.

```terminal
$ journalctl -b -1 --no-pager | tail -20
...
Jan 14 22:09:55 steamdeck kernel: steamdeck kernel: thermal thermal_zone0: critical temperature reached, shutting down
Jan 14 22:09:55 steamdeck systemd[1]: Reached target Shutdown.
```

Num cenário de superaquecimento, o log revela a sequência exata — a zona térmica atingiu o limite crítico e o sistema iniciou o desligamento ordeiro. Sem o journal do boot anterior, essa evidência desapareceria.

:::info
No SteamOS, por padrão, o journal **não** é persistente em disco — ele vive em `/run/log/journal`, que é volátil (RAM) e se perde ao desligar. O histórico entre boots só existe se a persistência foi ativada (criando `/var/log/journal`). Para ativá-la, veja [a seção 6](#/cap-096/sec-06). Essa é uma escolha consciente da Valve para reduzir escritas no SSD.
:::

## Logs de uma unidade específica

Se o `status` mostra as *últimas* dez linhas, o `journalctl -u` mostra **tudo** daquela unidade. É o passo seguinte em todo diagnóstico:

```terminal
$ journalctl -u NetworkManager --no-pager | tail -8
Jan 15 09:12:31 steamdeck NetworkManager[833]: <info>  device (wlan0): Activation: starting
Jan 15 09:12:31 steamdeck NetworkManager[833]: <info>  device (wlan0): state change: ip-check -> secondaries
Jan 15 09:12:33 steamdeck NetworkManager[833]: <info>  device (wlan0): state change: ip-check -> secondaries (reason 'none')
Jan 15 09:12:33 steamdeck NetworkManager[833]: <info>  device (wlan0): state change: secondaries -> activated
Jan 15 09:12:33 steamdeck NetworkManager[833]: <info>  device (wlan0): Activation: successful
Jan 15 13:47:05 steamdeck NetworkManager[833]: <info>  device (wlan0): link disconnected (reason 'user-requested')
Jan 15 13:47:12 steamdeck NetworkManager[833]: <info>  device (wlan0): Activation: starting connection 'Casa_2.4G'
Jan 15 13:47:13 steamdeck NetworkManager[833]: <info>  device (wlan0): Activation: successful
```

As entradas contam a história do Wi-Fi desde o boot: ativação bem-sucedida às 09:12, depois uma desconexão às 13:47 (pedida pelo usuário — provavelmente um `nmcli device disconnect`) e reconexão seis segundos depois. Combinar `-b` com `-u` é o clássico de diagnóstico:

```terminal
$ journalctl -b -u steamos-update --no-pager
```

Isso mostra apenas o que o serviço de atualização fez neste boot. Sem `-b`, você veria entradas de meses; com `-b`, só o relevante agora.

## O formato de uma entrada e o que extrair dele

Cada linha do journal tem esta estrutura, que merece tradução:

```text
Mês Dia HH:MM:SS host processo[PID]: mensagem
```

- **Timestamp** — sem ano, porque o journal assume que você sabe em que ano está. A omissão poupa bytes e limpeza visual.
- **Host** — `steamdeck` no nosso caso, mas se você acessa VPS remotas, o hostname diferencia a origem.
- **Processo[PID]** — o nome do binário que emitiu a mensagem e seu PID no momento da emissão. `systemd[1]` é o PID 1; `kernel` aparece sem PID porque não é um processo de espaço de usuário.
- **Mensagem** — o texto livre, frequentemente prefixado com um marcador de nível (`<info>`, `<warn>`, `<error>`), mas sem padronização rígida.

O que o journal entrega, na prática, é contexto: você vê *quem* falou (unidade), *quando* (timestamp até o segundo) e *o que* (mensagem). A [seção 6](#/cap-096/sec-06) vai refinar isso com filtros de prioridade, intervalos de tempo e saída em tempo real.

:::dica
O journal pode ser imenso — milhões de linhas. Antes de despejá-lo na tela, restrinja com `-b` (este boot), `-u` (esta unidade) ou `-n 50` (últimas 50 linhas). Sempre combine pelo menos dois filtros para não se afogar nos dados.
:::

## Resumo

- O `journald` substituiu os arquivos de texto (`/var/log/syslog`) por um banco binário indexado, consultado com `journalctl`.
- `journalctl -b` restringe ao boot atual; `--list-boots` lista todos e `-b -1` acessa o anterior.
- `journalctl -u unidade` mostra todos os logs daquela unidade; combine com `-b` para o boot atual.
- Cada entrada tem timestamp, host, processo[PID] e mensagem; o PID é do momento da emissão.
- No SteamOS, o journal padrão é volátil (RAM); persistência precisa ser ativada manualmente.

## Exercícios

1. Rode `journalctl -b --no-pager | head -20` e identifique as três primeiras unidades que aparecem após o kernel.
2. Execute `journalctl --list-boots` e anote quantos boots estão registrados; se houver mais de um, leia as últimas 15 linhas do anterior com `journalctl -b -1 | tail -15`.
3. Filtre os logs do `NetworkManager` neste boot com `journalctl -b -u NetworkManager` e localize a linha de ativação bem-sucedida do Wi-Fi.
4. Replique o diagnóstico da seção: procure, no boot atual, entradas do `kernel` com `journalctl -b -k` (atalho para `-b` + kernel) e identifique o modelo do seu adaptador Wi-Fi.
5. **Desafio.** Se o seu journal atual não tem persistência (está em `/run`), ative-a criando o diretório `/var/log/journal` (como root) e reinicie. Depois rode `journalctl --list-boots` de novo e compare a quantidade de boots disponíveis antes e depois.