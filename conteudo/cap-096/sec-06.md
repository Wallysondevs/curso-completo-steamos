Quem sabe abrir o journal já está à frente de metade dos usuários. Quem sabe filtrá-lo está num nível acima: chega ao erro relevante em segundos, sem rolar telas de milhares de linhas. Esta seção ensina os filtros que realmente importam — por prioridade, por tempo, por correspondência de texto — e mostra como combiná-los para zerar no que interessa.

:::objetivos
- Filtrar o journal por nível de prioridade (`-p`) e identificar problemas reais
- Restringir por intervalo de tempo com `--since` e `--until`
- Buscar texto em mensagens sem depender de `grep`
- Acompanhar logs em tempo real com `-f` e `-n`
- Combinar múltiplos filtros numa única consulta produtiva
:::

## Prioridade: separando o ruído do sinal

Toda mensagem do journal tem um nível de prioridade herdado do syslog (RFC 5424). Os nomes são intuitivos e a ordem é crescente de gravidade:

| Número | Nome | Quando usar para filtrar |
|---|---|---|
| 0 | `emerg` | Sistema inutilizável (raríssimo) |
| 1 | `alert` | Ação imediata necessária |
| 2 | `crit` | Condição crítica |
| 3 | `err` | Erros — **seu ponto de partida padrão** |
| 4 | `warning` | Avisos que podem ser ignorados... ou não |
| 5 | `notice` | Condições normais mas significativas |
| 6 | `info` | Informação operacional (maioria das mensagens) |
| 7 | `debug` | Depuração, extremamente verboso |

O flag `-p` aceita tanto o nome quanto o número, e pode receber um operador de comparação. O mais útil no dia a dia:

```terminal
$ journalctl -b -p err --no-pager
Jan 15 09:12:33 steamdeck kernel: iwlwifi 0000:03:00.0: firmware: failed to load iwl-debug-yoyo.bin (-2)
Jan 15 09:12:34 steamdeck systemd[1]: Failed to start Load/Save RF Kill Switch Status.
Jan 15 09:13:18 steamdeck kernel: Bluetooth: hci0: unexpected event for opcode 0xfc2f
```

`-p err` mostra erros de nível 3 **para cima** (err, crit, alert, emerg). É o comando de triagem: toda vez que algo está estranho, rode isso primeiro. O contrário também é útil — excluir ruído:

```terminal
$ journalctl -b -p info --no-pager | wc -l
14892
$ journalctl -b -p warning --no-pager | wc -l
247
```

Em 14 mil linhas de `info`, só 247 são `warning` ou pior. A cada degrau de prioridade que você sobe, o volume cai exponencialmente — por isso `err` é o ponto ideal para começar.

:::dica
`-p 4` é o mesmo que `-p warning`, mas `-p 3..7` (intervalo de err até debug) ou `-p warning..err` também funcionam. Para excluir um nível, use a negação com `-p 3` (só err) ou `-p 4..0` (ordem invertida = do warning ao emerg).
:::

## Por tempo: a janela que importa

Se você sabe que o Wi-Fi caiu entre 13h40 e 13h50, não precisa ler 8 horas de journal. Os filtros de tempo aceitam datas completas, horários e palavras reservadas:

```terminal
$ journalctl --since "2025-01-15 13:40:00" --until "2025-01-15 13:50:00" --no-pager
Jan 15 13:47:05 steamdeck NetworkManager[833]: <info>  device (wlan0): link disconnected
Jan 15 13:47:06 steamdeck wpa_supplicant[1103]: wlan0: CTRL-EVENT-DISCONNECTED
Jan 15 13:47:12 steamdeck NetworkManager[833]: <info>  device (wlan0): Activation: starting
```

As palavras reservadas `today`, `yesterday`, `"2 hours ago"` e `"30 minutes ago"` cobrem a investigação imediata:

```terminal
$ journalctl --since "30 minutes ago" -p warning --no-pager
```

E para saber o que aconteceu nos segundos que antecederam um desligamento abrupto, o `--until` com data do boot anterior é imbatível. Combine `--since` e `--until` com `-u` e `-p` para restringir a janela ao mínimo.

## Seguindo em tempo real

O `-f` (follow) mantém o journal aberto e imprime novas entradas conforme elas chegam, como um `tail -f` faria num arquivo de log de texto:

```terminal
$ journalctl -u sshd -f &
$ journalctl -u sshd -f -n 0
```

A diferença entre os dois é sutil mas importante: sem `-n 0`, o `-f` primeiro despeja as últimas 10 linhas e depois segue. Com `-n 0`, ele mostra só o que chegar **depois** do comando — limpo, sem histórico. Use isso num terminal lateral enquanto você executa a ação suspeita em outro, vendo o log surgir ao vivo.

:::atencao
`journalctl -f` bloqueia o terminal até [[Ctrl+C]]. Se você esquecer e fechar a janela, o processo morre. Em investigações longas, rode num terminal separado ou mande para o fundo (`&`).
:::

## Buscas, combinações e o que evitar

O journal tem seu próprio mecanismo de busca (`-g`), que usa expressões regulares, mas na prática o canal mais rápido ainda é casar `journalctl` com `grep` no final do pipe:

```terminal
$ journalctl -b -u NetworkManager --no-pager | grep -i "disconnect\|error\|fail"
Jan 15 13:47:05 steamdeck NetworkManager[833]: <info>  device (wlan0): link disconnected
```

Aqui o pipe com `grep` é mais flexível do que os filtros nativos porque você pode usar expressões arbitrárias. Mas cuidado com um erro comum: nunca mande `journalctl | grep` sem antes restringir com `-b` ou `-u`. Sem eles, o grep vai varrer todo o histórico, o que pode levar minutos e trazer ruído de semanas atrás.

O `-o verbose` (saída detalhada) revela os campos estruturados de cada entrada — útil quando você precisa do PID exato ou do caminho do binário:

```terminal
$ journalctl -b -n 3 -o verbose --no-pager
...
    FIELD           VALUE
    MESSAGE=        device (wlan0): Activation: successful
    PRIORITY=       6
    _SYSTEMD_UNIT=  NetworkManager.service
    _PID=           833
    _COMM=          NetworkManager
    _HOSTNAME=      steamdeck
    ...
```

Cada entrada é um documento com dezenas de campos (`_PID`, `_COMM`, `_SYSTEMD_UNIT`, `_UID`, `_EXE`, etc.) e o `-o verbose` os despeja. O `-o json-pretty` faz o mesmo em JSON, ideal para scripts. Esses formatos são o que tornam o journal superior aos arquivos de texto: você filtra por campo, não por regex.

:::exemplo
**Cenário: travamento no boot.** Ana notou que o Deck demorava 30 segundos a mais para carregar o desktop depois da última atualização. Ela rodou `journalctl -b -p warning --since "2 minutes ago"` durante o próximo boot e viu que o `systemd-udevd` ficava preso por 28 segundos esperando um dispositivo Bluetooth que não existia mais. Com o nome do dispositivo, removeu o pareamento antigo e o boot voltou ao normal.
:::

## Resumo

- `-p err` é o filtro de triagem padrão: mostra erros de nível 3 para cima e tem muito menos volume que `info`.
- `--since` e `--until` aceitam datas, horários e palavras como `today`, `yesterday` e `"30 minutes ago"`.
- `-f` acompanha em tempo real; `-n 0` com `-f` mostra apenas o que chegar depois do comando.
- Combine `-b`, `-u`, `-p`, `--since` e `grep` para zerar no evento relevante em vez de rolar milhares de linhas.
- `-o verbose` ou `-o json-pretty` expõem os campos estruturados (PID, unidade, binário) de cada entrada.

## Exercícios

1. Rode `journalctl -b -p err` e anote quantas linhas aparecem; depois compare com `journalctl -b -p warning` e explique a diferença.
2. Filtre os logs das últimas duas horas com `journalctl --since "2 hours ago" -p warning` e identifique o aviso mais frequente.
3. Abra dois terminais: em um rode `journalctl -f -n 0`, no outro peça um `systemctl restart` num serviço seguro; registre o que o journal capturou ao vivo.
4. Use `journalctl -b -o json-pretty -n 5` e localize, em cada entrada, os campos `_PID`, `_SYSTEMD_UNIT` e `PRIORITY`.
5. **Desafio.** Com base no boot atual, escreva uma consulta que mostre apenas erros e avisos da unidade `kernel` que ocorreram nos primeiros 60 segundos de boot (dica: `--since` com `-b` e o timestamp do `ActiveEnterTimestamp` do PID 1, obtido com `systemctl show`).