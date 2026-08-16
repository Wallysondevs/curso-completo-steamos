Antes de trocar qualquer peça, você precisa saber qual peça está quebrada — e, mais importante, ter certeza de que o defeito é mesmo físico e não de software. Um "problema de tela" muitas vezes é só um driver ou um cabo flat; um "problema de SSD" pode ser corrupção de sistema de arquivos. Esta seção ensina a separar as causas e a ler os sinais que o Linux deixa.

:::objetivos
- Separar defeito físico de defeito de software
- Ler os logs do kernel (`dmesg`, `journalctl`) para encontrar falhas de hardware
- Diagnosticar SSD, RAM, bateria e ventoinha via linha de comando
- Interpretar erros de tela, stick e botão
- Registrar um "estado de saúde" antes e depois do reparo
:::

## Físico ou software? A primeira triagem

A regra de ouro: **software é reversível, hardware é substituível**. Antes de abrir, descarte causas de software. O teste mais revelador é o **modo recuperação** e a reinstalação limpa: se o sintoma persiste com sistema zerado, é hardware.

```terminal
$ sudo journalctl -b -p err --no-pager | tail -30
```

O `journalctl` mostra os erros do boot atual. Falhas físicas típicas que aparecem aqui: `nvme` timeout, `i2c` read error (sensor), `wireless` hard blocked, `thermal` throttling, `cpu` temperature critical.

## Diagnóstico de SSD

O SSD é o componente com mais sinais diagnosticáveis no Linux. O `smartctl` lê os atributos SMART — contadores que o próprio drive registra de erros, temperatura e desgaste.

```terminal
$ sudo smartctl -a /dev/nvme0n1
```

Procure por: `Percentage Used` (desgaste da NAND, em NVMe), `Media and Data Integrity Errors`, `Critical Warning`, e `Temperature`. Um valor de `Percentage Used` perto de 100% indica fim de vida da memória flash.

```terminal
$ sudo nvme smart-log /dev/nvme0n1 | grep -iE 'critical|percentage|temperature'
```

O pacote `nvme-cli` dá outra visão. O campo `critical_warning` (em bitmask) dispara quando o drive degradou: reduzir capacidade, temperatura, ou falha de mídia. Qualquer valor não-zero merece backup imediato e troca.

:::atencao
Um SSD pode "funcionar" e ainda estar morrendo. Se o SMART começa a somar erros de integridade de mídia, faça backup **agora** — a falha total costuma ser súbita e sem aviso visual.
:::

## Diagnóstico de memória (RAM)

RAM do Deck é soldada na placa (não trocável), o que torna o diagnóstico mais relevante: se a RAM está com defeito, o caminho é RMA. Teste com `memtest86+` a partir de um pendrive de recuperação.

```terminal
$ sudo dmesg | grep -iE 'edac|mce|memory'
```

Erros de memória aparecem como **MCE** (Machine Check Exception) no `dmesg` ou como travamentos aleatórios e tela de "kernel panic". O `mcelog` (quando disponível) decodifica esses eventos e aponta o DIMM/banco defeituoso.

```terminal
$ free -h
              total        used        free
Mem:           14Gi       2.1Gi        11Gi
Swap:         8.0Gi          0B       8.0Gi
```

`free -h` mostra a RAM reconhecida pelo sistema. Se o Deck deveria ter 16 GiB e mostra 14 GiB, parte da memória pode estar reservada (iGPU) — isso é normal na APU, não é defeito. Só desconfie se o valor reconhecido for muito menor que o esperado.

## Diagnóstico de bateria

A bateria degrada com ciclos. O SteamOS e o Linux expõem o estado via sysfs.

```terminal
$ cat /sys/class/power_supply/BAT1/uevent
```

Os campos importantes: `POWER_SUPPLY_CAPACITY` (carga atual %), `POWER_SUPPLY_CYCLE_COUNT` (ciclos), `POWER_SUPPLY_CHARGE_FULL` vs `CHARGE_FULL_DESIGN` (capacidade real vs nominal). Se a capacidade real caiu para ~70% da nominal e o Deck desliga com 10% no medidor, a bateria está no fim.

```terminal
$ upower -i /org/freedesktop/UPower/devices/battery_BAT1 | grep -iE 'energy|capacity'
```

O `upower` resume o mesmo: `energy-full` (real) comparado a `energy-full-design`. Uma queda de 20–30% é o ponto comum de troca para quem joga longe da tomada.

:::dica
A bateria "infla" quando degrada exageradamente. Se a tampa traseira começar a estufar ou a tela descolar, **pare de usar e abra com cuidado** — bateria inflada é risco de incêndio. Procure assistência se não se sentir seguro.
:::

## Diagnóstico de ventoinha e temperatura

Ventoinha parada, ruidosa ou com RPM oscilando aparece direto nos sensores.

```terminal
$ sensors
```

Procure `fan1` (RPM) e as temperaturas `Tctl`/`Tdie`/`Composite`. Se a ventoinha deveria estar girando e o RPM é 0, ou o conector soltou, ou a fan morreu, ou o circuito de controle (PWM) falhou.

```terminal
$ cat /sys/class/hwmon/hwmon*/fan1_input 2>/dev/null
```

O sysfs dá o RPM bruto. Em carga (rode um jogo), a temperatura deve subir e a ventoinha responder. Se a temperatura sobe e a ventoinha não acompanha, o problema é físico (fan/conector) ou térmico (pasta seca).

## Diagnóstico de tela, stick e botões

**Tela** — artefatos, linhas, apagão: teste primeiro por software (outro display via dock ou o `xrandr`). Se o problema é só no painel interno em qualquer modo, suspeite do cabo flat ou do próprio display.

```terminal
$ cat /proc/bus/input/devices | grep -A4 -iE 'steam|valve'
```

**Sticks/botões** — o drift (movimento fantasma) e botão que não responde aparecem no subsistema de entrada. O `evtest` lê os eventos brutos e mostra o valor analógico em repouso.

```terminal
$ sudo evtest /dev/input/event<N>
```

Um stick saudável reporta eixo central perto de 0 (com pequena folga). Se o valor de repouso está longe de zero, é drift físico do potenciômetro — troca do stick (seção 7).

:::dica
Registre um "baseline" antes de qualquer reparo: capture `sensors`, `smartctl`, `dmesg` e a capacidade da bateria num arquivo. Depois da troca, repita e compare — se algo piorou, você sabe exatamente o que mudou.
:::

Com a causa localizada, a seção 5 cobre as três trocas mais comuns: tela, bateria e SSD.
