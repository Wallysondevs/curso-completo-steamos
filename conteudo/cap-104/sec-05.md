Monitorar é diferente de vigiar. Vigiar é olhar o `top` o dia inteiro sem propósito; monitorar é deixar um programa coletar métricas em segundo plano e só chamar sua atenção quando algo sai do normal. No Steam Deck, cuja saúde térmica e de armazenamento determina a experiência de jogo, um monitoramento proativo com scripts simples alerta você sobre o problema antes que ele vire uma engrenagem travando no meio de uma partida.

:::objetivos
- Definir indicadores de saúde que valem a pena monitorar continuamente
- Coletar métricas de CPU, temperatura, memória e disco com scripts
- Escrever alertas que disparam apenas quando um limiar é ultrapassado
- Usar o systemd timer para executar a verificação periodicamente
- Registrar um histórico de métricas para detectar tendências de longo prazo
:::

## O que monitorar (e por quê)

Nem tudo merece seu alerta. Um alarme a cada 5 minutos sobre qualquer variação vira ruído, e ruído se ignora. Os indicadores que realmente importam no Steam Deck são poucos, e cada um sinaliza um tipo específico de problema:

**Temperatura da APU.** A APU (CPU+GPU combinadas do Deck) começa a fazer *thermal throttling* — reduzir frequência para não esquentar demais — por volta dos 95°C. Monitorar a temperatura sob carga revela se a pasta térmica envelheceu ou se a ventoinha está falhando.

**Espaço em disco.** Como visto na seção 1, é o indicador mais precoce de degradação. Um disco que passa de 80% degrada E/S e pode impedir atualizações.

**Memória disponível.** O Steam Deck tem RAM compartilhada entre CPU e GPU. Se a RAM livre zera, o sistema passa a usar swap, e o desempenho despenca.

**Frequência da CPU.** A frequência real (não a nominal) revela se o *throttling* está acontecendo. Uma APU cravada em 400 MHz sob carga é sinal de superaquecimento ou limite de energia.

```terminal
$ sensors
coretemp-isa-0000
Adapter: ISA adapter
Package id 0:  +61.0°C  (high = +95.0°C, crit = +105.0°C)
Core 0:       +60.0°C  (high = +95.0°C, crit = +105.0°C)
Core 1:       +61.0°C  (high = +95.0°C, crit = +105.0°C)

nvme-pci-0100
Adapter: PCI adapter
Composite:    +42.0°C  (low  =  -5.0°C, high = +83.0°C)
```

Note que cada sensor expõe seus próprios limiares (`high`, `crit`). O kernel e os drivers já definem os valores seguros; seu script só precisa comparar a leitura atual contra eles.

## Coletando métricas com um script

O `sensors`, o `free` e o `df` são as fontes. O truque é extrair só o número, de forma que o script possa compará-lo com um limiar:

```bash
#!/bin/bash
# ~/bin/health — verifica limites e alerta se ultrapassados

# Temperatura da APU (em °C)
TEMP=$(sensors 2>/dev/null | awk '/Package id 0/{gsub(/[^0-9.]/,"",$4); print $4; exit}')
TEMP=${TEMP:-0}

# Espaço em disco na raiz (em %)
DISK=$(df -h / | awk 'NR==2{gsub(/%/,"",$5); print $5}')

# Memória livre (em MB)
FREE=$(free -m | awk '/Mem:/{print $7}')

ALERTAS=0

if [ "${TEMP%.*}" -ge 95 ]; then
  echo "[ALERTA] Temperatura da APU em ${TEMP}°C — possível throttling"
  ALERTAS=1
fi

if [ "$DISK" -ge 80 ]; then
  echo "[ALERTA] Disco raiz em ${DISK}% de uso"
  ALERTAS=1
fi

if [ "$FREE" -lt 1000 ]; then
  echo "[ALERTA] Memória livre abaixo de 1 GB (${FREE} MB)"
  ALERTAS=1
fi

if [ "$ALERTAS" -eq 0 ]; then
  echo "[OK] Temperatura ${TEMP}°C, disco ${DISK}%, memória livre ${FREE} MB"
fi
```

A extração com `awk` e `gsub` remove símbolos (`°C`, `%`, `+`) e deixa só o número. O `-ge`/`-lt` do bash compara inteiros diretamente. O script é o coração do monitoramento: silencioso quando tudo está bem, barulhento exatamente quando não está.

```terminal
$ ~/bin/health
[OK] Temperatura 61°C, disco 67%, memória livre 9216 MB
```

## Alertas que só falam quando importa

Um script que só imprime na tela não monitora nada — ele espera você lembrar de rodá-lo. O alerta real acontece em três cenários: aviso visual, notificação no desktop, ou registro persistente.

O sistema de notificações do SteamOS (via `notify-send`) exibe um aviso na tela sem interromper o jogo:

```bash
TEMP=96
DISK=83
if [ "$TEMP" -ge 95 ]; then
  notify-send -u critical "Deck superaquecendo" \
    "APU a ${TEMP}°C. Verifique a ventoinha."
fi
```

Mas mais útil que uma notificação pontual é o **histórico**. Registrar cada leitura num arquivo permite detectar tendências — a temperatura que sobe semana a semana, o disco que enche aos poucos. É a diferença entre reagir a um problema e prevê-lo.

```bash
LOG="$HOME/lab/monitor/metrics.tsv"
[ -d "$(dirname "$LOG")" ] || mkdir -p "$(dirname "$LOG")"
printf '%s\t%s\t%s\t%s\n' \
  "$(date -Is)" "$TEMP" "$DISK" "$FREE" >> "$LOG"
```

O formato TSV (separado por tab) é legível por humanos e fácil de plotar depois. Um único `tail` mostra o histórico:

```terminal
$ tail -3 ~/lab/monitor/metrics.tsv
2026-07-12T09:00:01-03:00	58	64	10240
2026-07-12T10:00:01-03:00	61	64	9984
2026-07-12T11:00:01-03:00	64	64	9728
```

Veja a temperatura subindo 58 → 61 → 64 conforme o dia esquenta. Nenhuma leitura isolada é alarmante, mas a tendência conta a história.

## Agendando com systemd timer

O script é inútil sem agendamento. Um timer de systemd executa o `health` a cada hora (ou a cada 15 minutos, se você quiser mais granularidade) e registra o resultado. A estrutura é a mesma da seção 1, com uma frequência maior:

```ini
# ~/.config/systemd/user/health.timer
[Unit]
Description=Verificação de saúde horária do Deck

[Timer]
OnCalendar=*-*-* *:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

```terminal
$ systemctl --user enable --now health.timer
$ systemctl --user list-timers --no-pager | grep health
NEXT                        LEFT    LAST  PASSED  UNIT
Sun 2026-07-12 12:00:00 -03 8min    -     -       health.timer
```

Uma verificação por hora produz 24 linhas por dia no histórico, 168 por semana. É suficiente para detectar tendências de curto prazo, e leve o bastante para não custar quase nada de CPU.

:::dica
Se você quer granularidade fina durante uma sessão de jogo para avaliar *throttling*, rode o script em loop manual com um intervalo curto, em vez de alterar o timer permanente:

```terminal
$ while true; do ~/bin/health; sleep 30; done
```

Isso dá uma leitura a cada 30 segundos durante o teste, sem sobrecarregar o timer de produção.
:::

## Encontrando a causa de um alerta

O alerta aponta o sintoma, não a causa. Um `health` gritando "temperatura 96°C" durante o jogo pede diagnóstico: a ventoinha está girando? O fluxo de ar está obstruído? A pasta térmica secou?

```terminal
$ cat /sys/class/thermal/thermal_zone0/temp
96000
$ cat /sys/class/thermal/cooling_device0/cur_state
0
```

O valor `96000` em `thermal_zone0/temp` está em **milésimos de grau** — 96°C. O diretório `/sys/class/thermal` expõe térmicas e dispositivos de resfriamento diretamente do kernel. O `cooling_device0/cur_state` em `0` pode indicar que a ventoinha está desligada quando deveria estar ativa — um caminho de investigação claro.

Quando o alerta é de disco, a primeira pergunta é "o que cresceu?". A seção 7 responde com `ncdu` e `du`. Quando é memória, o `top` ordenado por uso revela o processo culpado. O monitoramento te diz **que** algo está errado; o diagnóstico te diz **o quê** — e cada um tem seu capítulo e suas ferramentas.

## Resumo

- Monitore poucos indicadores: temperatura da APU, espaço em disco, memória livre e frequência da CPU.
- Extraia apenas o número das saídas com `awk`/`gsub` para poder compará-lo contra um limiar.
- Alertas devem falar só quando um limiar é ultrapassado; do contrário viram ruído ignorado.
- Registre leituras num arquivo TSV para detectar tendências, não só valores isolados.
- Um systemd timer horário executa a verificação; um loop manual cobre granularidade fina em testes.
- `/sys/class/thermal` expõe térmicas e resfriamento diretos do kernel para diagnosticar superaquecimento.

## Exercícios

1. Rode `sensors`, `df -h /` e `free -m` e anote os três valores como seu baseline. Identifique em cada saída qual número seu script deve extrair.
2. Escreva um script `~/bin/health` que extraia temperatura, uso de disco e memória livre e imprima `[OK]` ou `[ALERTA]` conforme limiares que você definir.
3. Configure um systemd timer para rodar o `health` a cada hora e confirme com `systemctl --user list-timers`.
4. Deixe o script rodando por um dia e depois leia o histórico TSV com `tail`. Há alguma tendência visível na temperatura ou no disco?
5. **Desafio.** Adicione ao script a leitura de `cat /sys/class/thermal/thermal_zone0/temp` (que vem em milésimos de grau) e faça o alerta usar esse valor como fonte alternativa caso `sensors` não esteja instalado. Teste com `sensors` instalado e, se puder, removendo-o temporariamente.