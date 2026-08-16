Antes de diagnosticar qualquer problema de suspensão, você precisa de uma linha de base: o que o sistema acha que está acontecendo com o seu estado de energia agora, e o que ficou registrado das últimas transições. O Linux expõe todo esse estado através do sysfs (`/sys`) e dos logs do systemd, e saber ler essas fontes transforma um chute em diagnóstico.

:::objetivos
- Ler o estado de energia atual do sistema via `/sys/power`
- Consultar o histórico de boots e despertadas com `last` e `uptime`
- Inspecionar logs do systemd para reconstruir eventos de suspensão
- Identificar o que foi e o que não foi suspendido corretamente
:::

## O estado de energia, em tempo real

O caminho `/sys/power/` é o painel de controle do gerenciamento de energia do kernel. Cada arquivo ali é uma janela para um aspecto do estado atual. Os três que você precisa dominar:

```terminal
$ cat /sys/power/state
freeze mem disk
$ cat /sys/power/mem_sleep
[s2idle] deep
$ cat /sys/power/wakeup_count
0
```

O primeiro lista os estados de energia suportados. O segundo, qual variante S3 está ativa (já tratado em seção anterior). O terceiro, `wakeup_count`, é um contador crucial: incrementa a cada evento de wakeup. Se você lê-lo, obtém o valor atual; logo depois de uma retomada, comparar esse valor com o anterior revela se o sistema acordou por um evento esperado.

:::nota
`wakeup_count` só é realmente útil quando lido imediatamente antes de suspender: uma rotina confiável é ler o valor, suspender, e depois reler ao acordar. Se o contador aumentou, algo além da sua ação gerou o wakeup. Drivers de dispositivo às vezes "engolem" um evento de wakeup espúrio e apagam o contador, então trate a leitura como uma pista, não um veredito.
:::

## Reconstruindo o histórico de despertadas

Dois comandos pequenos respondem à pergunta "quando foi a última vez que esta máquina acordou?" de ângulos diferentes. O `uptime` mostra há quanto tempo o sistema está acordado **desde o último boot**, ignorando o tempo em suspensão:

```terminal
$ uptime
 23:04:11 up 2 days,  3:14,  1 user,  load average: 0.32, 0.28, 0.21
$ uptime -s
2025-08-10 19:50:03
$ uptime -p
up 2 days, 3 hours, 14 minutes
```

O `uptime -s` dá o instante exato do último boot, e `uptime -p` resume em linguagem humana. Note que se você suspendera o Deck ontem à noite e o acordou agora, o `uptime` continua contando de `2025-08-10` — o clock de tempo acordado não avança durante S3. O sistema está "acordado há 2 dias" mesmo tendo bootado há 3 dias de calendário, porque passou a noite em suspensão.

Para ver o histórico de boots e *shutdowns* (incluindo transições de energia registradas pelo utilitário `last`), use o `last` com foco em reboot:

```terminal
$ last reboot
reboot   system boot  6.8.0-valve36-1 Sat Aug 10 19:50   still running
reboot   system boot  6.8.0-valve36-1 Thu Aug  8 22:15 - Fri Aug  9 01:02 (02:47)
reboot   system boot  6.8.0-valve36-1 Wed Aug  7 08:30 - Thu Aug  8 12:10 (1+03:40)

wtmp begins Wed Aug  7 08:30:11 2025
```

Cada linha é um ciclo de vida: o kernel bootou (`system boot`), a data/hora, e quando terminou (com a duração entre parênteses). A primeira linha mostra `still running`. Isso distingue boots de verdade de retomadas de suspensão — note que **retomadas de S3 não aparecem aqui**, porque não há reboot. Essa ausência é, em si, uma informação valiosa.

## O log systemd é o diário da suspensão

O journal do systemd guarda cada transição de energia com timestamps. A unidade `systemd-suspend.service` é o ponto central, mas mensagens correlatas aparecem sob `systemd[1]`, `systemd-sleep`, e o kernel. Para ver a última suspensão e retomada:

```terminal
$ journalctl -u systemd-suspend -b -0
ago 12 22:09:58 steamdeck systemd[1]: Starting systemd-suspend.service - System Suspend...
ago 12 22:09:58 steamdeck systemd-sleep[3102]: Suspending system...
ago 12 22:10:12 steamdeck systemd-sleep[3102]: System resumed.
ago 12 22:10:13 steamdeck systemd[1]: systemd-suspend.service: Deactivated successfully.
```

A flag `-b -0` limita ao boot atual. O par `Suspending system...` e `System resumed.` delimita o período em S3 — entre 22:09:58 e 22:10:12, ou seja, 14 segundos de suspensão. Comparando os dois timestamps, você obtém exatamente quanto tempo a máquina ficou dormindo, sem depender de nenhum relógio interno do jogo.

Para filtrar só os eventos de retomada em todo o histórico:

```terminal
$ journalctl -u systemd-suspend | grep -c "System resumed"
14
```

Esse contador diz quantas retomadas aconteceram desde que o journal começou a ser gravado (o journal do Deck é persistente, então pode cobrir semanas). É uma forma rápida de saber se o aparelho anda acordando mais vezes do que você imagina.

## Cruzando boot, suspensão e retomada

Juntando as três fontes, você monta uma narrativa completa. Exemplo: `last reboot` mostra dois boots em três dias, mas `journalctl` mostra 14 retomadas. Conclusão: a máquina não está rebootando sozinha, está sendo suspensa e acordada frequentemente — comportamento normal para um portátil que você usa várias vezes ao dia.

```terminal
$ last -x | head -8
ana      tty7         :0               Fri Aug  9 01:02   still logged in
runlevel (to lvl 5)   6.8.0-valve36-1 Fri Aug  9 01:02   still running
reboot   system boot  6.8.0-valve36-1 Fri Aug  9 01:02 - Sat Aug 10 19:50 (1+18:48)
```

O `last -x` acrescenta eventos de runlevel e login na linha do tempo, dando contexto adicional: quem estava logado, quando o sistema mudou de nível de execução, e a duração de cada período.

:::atencao
Não confunda "o Deck acordou" com "o Deck rebootou". Retomada de suspensão é invisível para `last reboot` e não reinicia sessões de login nem o Gamescope. Se você suspeita de reboots espontâneos, a prova está em `last reboot` e no `journalctl -b` (que numera os boots: `-b -0` é o atual, `-b -1` o anterior). Um `journalctl -b -1` que mostra boot completo é evidência de reboot; a ausência dele indica que só houve suspensão.
:::

## Resumo

- `/sys/power/state` lista estados suportados; `mem_sleep` mostra a variante S3 ativa; `wakeup_count` conta eventos de despertar.
- `uptime -s`/`uptime -p` mostram o boot atual, sem contar o tempo em suspensão.
- `last reboot` lista ciclos de boot, e retomadas de S3 não aparecem ali — ausência que é informativa.
- `journalctl -u systemd-suspend` registra cada `Suspending system...` e `System resumed.` com timestamp.
- Cruzar `last` e `journalctl` revela a diferença entre reboots reais e meras retomadas.

## Exercícios

1. Rode `cat /sys/power/state`, `cat /sys/power/mem_sleep` e `cat /sys/power/wakeup_count` numa única sessão e registre os três valores.
2. Suspenda o Deck por 30 segundos e, ao acordar, rode `journalctl -u systemd-suspend -b -0`. Calcule a duração exata da suspensão pelos timestamps.
3. Compare `uptime -s` com a hora atual imediatamente após uma suspensão longa. O `uptime` "contou" o tempo dormindo? Justifique.
4. Execute `last reboot` e `last -x`. Liste, na sua máquina, quantos boots e quantos runlevels constam no histórico.
5. **Desafio.** Rode `journalctl -u systemd-suspend | grep "System resumed" | wc -l` e `last reboot | grep -c reboot`. Com os dois números, determine se o seu Deck reinicia mais do que suspende ou vice-versa, e escreva um diagnóstico de uma frase sobre o padrão de uso dele.