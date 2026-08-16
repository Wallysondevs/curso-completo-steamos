Quando o Deck trava, reinicia sozinho ou um jogo não abre, o impulso natural é chutar soluções — desinstalar, formatar, reinstalar o sistema. Antes de qualquer ação destrutiva existe uma camada inteira de diagnóstico que lê as mensagens que o próprio sistema deixou para trás. A habilidade de extrair a causa de um problema a partir dos logs é o que separa quem conserta em 10 minutos de quem perde uma tarde.

:::objetivos
- Localizar e ler os logs do systemd com `journalctl`
- Usar o `dmesg` para problemas de hardware e kernel
- Filtrar logs por tempo, serviço e nível de severidade
- Correlacionar uma falha de jogo com as mensagens do sistema
- Construir um fluxo de diagnóstico metódico antes de recorrer a reinstalação
:::

## O journal do systemd como primeiro socorro

O `journalctl` é a porta de entrada para quase todo diagnóstico no SteamOS. O systemd captura a saída de todos os serviços e do kernel num único journal binário, e o `journalctl` filtra esse mar de mensagens por tempo, serviço, processo ou prioridade.

A pergunta mais comum no diagnóstico é "o que aconteceu desde que o problema começou?". O `journalctl` responde olhando para um intervalo de tempo:

```terminal
$ journalctl --since "2026-07-12 20:00" --until "2026-07-12 20:30"
Jul 12 20:14:03 steamdeck kernel: thermal thermal_zone0: critical temperature reached (95 C), shutting down
Jul 12 20:14:03 steamdeck systemd[1]: Starting Thermal Reboot Service...
Jul 12 20:14:04 steamdeck systemd[1]: Stopped target System Time Synchronized.
```

Em três linhas, o mistério do "reiniciou sozinho" se resolve: a temperatura atingiu 95°C e o kernel disparou o desligamento. O `--since`/`--until` delimitam a janela exata do incidente, transformando milhares de linhas em uma dúzia relevante.

Para acompanhar em tempo real (enquanto você reproduz o problema), use `-f`:

```terminal
$ journalctl -f
```

O `-f` segue o log como um `tail -f`. Deixe-o rodando num terminal, reproduza o travamento do jogo num outro, e a mensagem da falha aparece no instante em que ocorre.

## Filtrando por serviço e severidade

O journal inteiro é demais. O filtro por serviço (`-u`) isola as mensagens de um único daemon — útil quando o problema está localizado (o Bluetooth não conecta, o Wi-Fi caiu):

```terminal
$ journalctl -u NetworkManager --since today
Jul 12 08:12:44 steamdeck NetworkManager[712]: <info>  [1752318764.1234] device (wlan0): state change: activated -> disconnected
Jul 12 08:12:44 steamdeck NetworkManager[712]: <info>  [1752318764.1235] reason 'supplicant-failed'
```

O filtro por severidade (`-p`) mantém só as mensagens importantes, ignorando o ruído informativo:

```terminal
$ journalctl -p err --since today
Jul 12 08:12:44 steamdeck wpa_supplicant[820]: wlan0: CTRL-EVENT-DISCONNECTED bssid=3c:37:86:0a:b1:c4 reason=4
```

Os níveis, do mais grave ao mais leve: `emerg`, `alert`, `crit`, `err`, `warning`, `notice`, `info`, `debug`. O `-p err` mostra de `err` para cima (mais grave), o filtro padrão para o primeiro exame.

:::dica
Combine os filtros numa expressão só: `journalctl -u NetworkManager -p warning --since "1 hour ago"`. Cada filtro que você adiciona é uma dimensão que estreita o espaço de busca. Comece amplo (só `--since`), observe, e afunile conforme descobre qual serviço está envolvido.
:::

## dmesg: o diagnóstico de hardware

Enquanto o `journalctl` centraliza tudo, o `dmesg` mostra especificamente o buffer do kernel — as mensagens geradas pelo núcleo e pelos drivers durante o boot e em eventos de hardware. É o lugar para investigar dispositivos que somem, discos que não montam e erros de firmware.

```terminal
$ sudo dmesg -T | tail -20
[Sat Jul 12 20:14:03 2026] thermal_zone0: critical temperature reached (95 C), shutting down
[Sat Jul 12 20:14:03 2026] mce: [Hardware Error]: Machine check events logged
[Sat Jul 12 20:14:04 2026] amdgpu: Fatal error during GPU init
```

O `-T` converte os timestamps (que por padrão vêm em "segundos desde o boot") para data e hora legíveis. A linha do `mce` (Machine Check Exception) indica erro de hardware real — um chip reportando falha, não apenas um software travando. Filtrar por palavra-chave é o próximo passo:

```terminal
$ sudo dmesg -T | grep -iE 'error|fail|warn|critical'
[Sat Jul 12 08:00:02 2026] EXT4-fs (mmcblk0p1): mounted filesystem with ordered data mode
[Sat Jul 12 20:14:03 2026] thermal_zone0: critical temperature reached (95 C)
```

Nem toda linha que casa com `error` é problema (a primeira é um "mounted filesystem" benigno que contém "ordered", não "error" — o grep pegou parte). Leia cada correspondência com ceticismo e contexto.

## O crash de um jogo, passo a passo

Um jogo que não abre ou fecha em segundos é o incidente mais comum, e o diagnóstico segue um roteiro fixo. Primeiro, tente abrir o jogo pela linha de comando e capture a saída:

```terminal
$ steam steam://rungameid/431960
```

O Steam (ou o Proton) imprime no terminal a razão da falha — biblioteca ausente, erro de DirectX, problema de driver. Se a saída não for suficiente, o journal captura o que o processo escreveu:

```terminal
$ journalctl --since "5 minutes ago" | grep -iE 'proton|steam|amdgpu|segfault'
Jul 12 22:10:11 steamdeck kernel: proton[4412]: segfault at 0 ip 00007f2b... sp 00007ffd... error 4 in libc.so.6
```

O `segfault` (violação de acesso à memória) aponta para um processo específico e uma biblioteca. A partir daí, o caminho se bifurca: se a biblioteca é do sistema, pode ser problema de driver (busque `amdgpu`); se é do Proton, pode ser incompatibilidade de versão (tente outra versão do Proton nas propriedades do jogo).

:::exemplo
Um jogo que rodava e parou de abrir após uma atualização: o `journalctl --since today` revelou `amdgpu: ring gfx timeout`, um erro de driver gráfico que apareceu junto com a atualização do kernel. A solução foi reverter o kernel para a versão anterior (rollback, seção 4) até uma atualização corrigir o driver. Sem o log, a tentativa seria reinstalar o jogo — que não resolveria nada, porque o problema era o driver.
:::

## O fluxo metódico antes de reinstalar

Reinstalar o sistema é a última carta, não a primeira. O fluxo metódico percorre, em ordem, as camadas do problema:

1. **Quando começou?** Correlacione com uma atualização, uma instalação, uma mudança de configuração. O `journalctl --since` e o histórico de atualizações (seção 4) respondem.
2. **Qual a mensagem?** `journalctl -p err` e `dmesg -T | grep -iE 'error|fail'` para colher a mensagem exata da falha.
3. **Qual componente?** O log aponta para um serviço (`-u`), um driver ou um processo. Isole-o.
4. **É reversível?** Se coincidiu com uma atualização, o rollback (snapshot, seção 4) desfaz o dano em minutos.
5. **Só então reinstale** — se e somente se as camadas anteriores não revelaram nada ou a reversão não foi possível.

Cada camada que você pula é tempo que reaparece depois, multiplicado. O diagnóstico barato agora é mais rápido que a reinstalação cara depois.

## Resumo

- `journalctl` é a porta de entrada dos logs; `--since`/`--until` delimitam a janela do incidente.
- `journalctl -u serviço` isola um daemon; `-p err` filtra por severidade; `-f` acompanha em tempo real.
- `journalctl -p err` mostra de `err` para cima, ignorando o ruído informativo.
- `dmesg -T` mostra o buffer do kernel com datas legíveis, ideal para falhas de hardware.
- Um jogo que quebra se diagnostica pela saída do Steam no terminal e por `segfault` no journal.
- Reinstalar é última opção; siga o fluxo: quando, qual mensagem, qual componente, é reversível, só então reinstale.

## Exercícios

1. Rode `journalctl --since "1 hour ago" | tail -50` e destaque as mensagens que indicam algo fora do normal. Se não houver, rode `journalctl -p notice --since today` e veja o que aparece.
2. Reproduza um problema (ou simule com `systemctl restart` de um serviço inofensivo, tipo `bluetooth`) e capture a saída com `journalctl -f` aberto em paralelo.
3. Use `journalctl -u NetworkManager -p warning --since today` e explique, para cada linha, se é algo que você precisaria corrigir.
4. Rode `sudo dmesg -T | grep -iE 'error|fail'` e classifique cada correspondência em problema real, aviso benigno ou falso positivo (casa com parte de outra palavra).
5. **Desafio.** Escolha um serviço do sistema (`systemctl --type=service --state=running`) e escreva um script `~/bin/diag-servico` que, dado o nome do serviço como argumento, imprime: o status, as últimas 20 linhas do `journalctl` daquele serviço, e o resultado de `systemctl is-active`. Teste com dois serviços diferentes. 