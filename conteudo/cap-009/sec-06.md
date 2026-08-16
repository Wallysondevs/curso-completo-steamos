O Steam Deck é, antes de qualquer outra coisa, um dispositivo alimentado por bateria. A APU, a tela, o Wi-Fi e o SSD consomem watts, e os watts disponíveis cabem num pacote de 40Wh (LCD) ou 50Wh (OLED). O Linux expõe esse estado em arquivos que você pode ler, e entender esses números ajuda a decidir o que desligar para estender uma sessão de jogo.

:::objetivos
- Identificar a bateria e seu estado via `upower` e `/sys/class/power_supply`
- Interpretar os campos de carga, saúde (capacity), voltagem e corrente
- Diferenciar os perfis de energia do SteamOS e seu impacto no TDP
- Relacionar o consumo da APU com a autonomia prática
- Monitorar a descarga em tempo real com ferramentas de linha de comando
:::

## Qual bateria está aí dentro

Os modelos LCD carregam uma bateria de **40Wh**; os OLED, de **50Wh**. A diferença de 10Wh, combinada com o chip Sephiroth mais eficiente (6nm), dá ao OLED cerca de 30-40% a mais de autonomia em cargas equivalentes — mesmo com a tela OLED consumindo um pouco mais que a IPS para brilhos altos em cenas escuras (onde pixels apagados gastam menos, mas pixels acesos gastam mais).

O `upower` (parte do systemd, já presente no SteamOS) é a ferramenta mais direta:

```terminal
$ upower -i /org/freedesktop/UPower/devices/battery_BAT1
  native-path:          BAT1
  vendor:               DTP
  model:                KT003850401
  serial:               00001
  power supply:         yes
  updated:              Dom 05 Jan 2026 14:30:22 -03 (32 seconds ago)
  has history:          yes
  has statistics:       yes
  battery
    present:             yes
    rechargeable:        yes
    state:               discharging
    warning-level:       none
    energy:              28,54 Wh
    energy-empty:        0 Wh
    energy-full:         38,91 Wh
    energy-full-design:  40,04 Wh
    energy-rate:         14,82 W
    voltage:             7,70 V
    charge-cycles:       147
    percentage:          73%
    capacity:            97,1%
    technology:          lithium-ion
```

O campo `energy-full-design` (40,04 Wh) é a capacidade nominal quando a bateria saiu da fábrica. `energy-full` (38,91 Wh) é o que ela aguenta hoje — com 147 ciclos, ela reteve 97,1% da capacidade original (`capacity`). `energy-rate` (14,82 W) é o consumo instantâneo: com esse ritmo, os 28,54 Wh restantes duram cerca de 1h55min.

:::dica
A fórmula de autonomia em horas é simples: `energy / energy-rate`. Você pode calcular de cabeça com os números do `upower`: `28,54 / 14,82 ≈ 1,93h`. Ajustar o TDP ou o brilho da tela mexe diretamente no `energy-rate`.
:::

## `/sys/class/power_supply/BAT1`: os mesmos dados, crus

Para scripting ou monitoramento de baixo nível, o sysfs expõe os mesmos dados sem o formato amigável do `upower`:

```terminal
$ ls /sys/class/power_supply/BAT1/
alarm           capacity_level  current_now   power/      serial_number  type
capacity        charge_full     cycle_count   present     status         uevent
capacity_error  charge_full_design  device/   powers/     subsystem/     voltage_min_design
capacity_error_margin  charge_now  hwmon0/      scope       technology    voltage_now
$ cat /sys/class/power_supply/BAT1/capacity
73
$ cat /sys/class/power_supply/BAT1/status
Discharging
$ cat /sys/class/power_supply/BAT1/voltage_now
7700000
$ cat /sys/class/power_supply/BAT1/current_now
1925000
```

`capacity` é o mesmo `percentage` do `upower` (73%). `voltage_now` está em microvolts: 7.700.000 µV = 7,7 V. `current_now` em microampères: 1.925.000 µA = 1,925 A. A potência é voltagem × corrente: 7,7 V × 1,925 A = 14,82 W — exatamente o `energy-rate` do `upower`.

Para ver todos os valores de uma vez, o `grep` direto sobre o diretório:

```terminal
$ grep '' /sys/class/power_supply/BAT1/{capacity,status,voltage_now,current_now,cycle_count,capacity_level} 2>/dev/null
/sys/class/power_supply/BAT1/capacity:73
/sys/class/power_supply/BAT1/status:Discharging
/sys/class/power_supply/BAT1/voltage_now:7700000
/sys/class/power_supply/BAT1/current_now:1925000
/sys/class/power_supply/BAT1/cycle_count:147
/sys/class/power_supply/BAT1/capacity_level:Normal
```

## TDP e perfis de energia

O TDP (*Thermal Design Power*) da APU do Deck é configurável entre 4W e 15W. O SteamOS expõe três perfis na interface do QAM, mas por baixo o controle é feito escrevendo no driver do kernel via `sysfs`:

- **Baixo consumo** — TDP perto de 4-8W. Útil para jogos 2D, indies e emulação. A GPU fica limitada, mas a bateria dura horas a mais.
- **Equilibrado** — TDP na faixa dos 10-12W. É onde o Deck passa a maior parte do tempo.
- **Alto desempenho** — TDP em 15W. A GPU atinge suas frequências máximas e o Deck esquenta, mas a bateria some rápido.

O TDP da APU é consultável, para quem quiser ver o que o firmware está aplicando:

```terminal
$ cat /sys/class/hwmon/hwmon4/power1_cap
15000000
```

O valor está em microwatts: 15.000.000 µW = 15W. Esse é o teto configurado. O consumo real, como você viu no `energy-rate` do `upower`, é o da máquina inteira (APU + tela + SSD + Wi-Fi + perdas).

:::atencao
Alterar o TDP por script (`echo 10000000 > /sys/class/hwmon/hwmon4/power1_cap`) funciona, mas o SteamOS reaplica o perfil selecionado na interface ao abrir qualquer jogo. Se você precisa de um perfil personalizado e persistente, use o plugin **PowerTools** no Decky Loader, que escreve nesses mesmos arquivos com regras por jogo.
:::

## Quanto cada componente consome

A conta grosseira de consumo do Deck em jogo pesado:

| Componente | Consumo típico | Nota |
|---|---|---|
| APU (CPU+GPU) | 10-15W | Depende do TDP configurado |
| Tela (LCD 60Hz) | 1-2W | Brilho máximo ~2,5W |
| Tela (OLED 90Hz) | 1,5-3,5W | Varia com conteúdo (HDR gasta mais) |
| SSD NVMe ativo | 3-5W | Pico durante loading |
| Wi-Fi + Bluetooth | 1-2W | Transmissão ativa |
| Placa-mãe + perdas | 1-3W | Reguladores de voltagem, trilhas |

O total fica entre 15 e 25W. Com uma bateria de 40Wh, isso dá entre 1h36min e 2h40min de autonomia. O modelo OLED, com 50Wh e chip mais eficiente, entrega 2h a 4h no mesmo cenário.

## Resumo

- Modelos LCD têm bateria de 40Wh; OLED, de 50Wh (íons de lítio).
- `upower -i` mostra carga, saúde, voltagem, corrente e consumo instantâneo.
- `/sys/class/power_supply/BAT1/` expõe os mesmos dados em valores brutos (µV, µA).
- O TDP da APU varia de 4W a 15W via perfis do SteamOS; o cap atual está em `/sys/class/hwmon/hwmon*/power1_cap`.
- Consumo do Deck sob carga típica: 15-25W; autonomia entre 1h30min e 4h conforme modelo e perfil.
- Autonomia restante = `energy` ÷ `energy-rate` do `upower`.

## Exercícios

1. Execute `upower -i /org/freedesktop/UPower/devices/battery_BAT1`. Qual a capacidade atual da bateria em Wh e quantos ciclos de carga ela tem?
2. Leia a voltagem e a corrente com `cat /sys/class/power_supply/BAT1/voltage_now` e `current_now`. Multiplique para obter a potência em watts e compare com o `energy-rate` do `upower`.
3. Abra um jogo pesado e, em paralelo, monitore `energy-rate` no `upower` a cada 30 segundos. Ele fica estável ou oscila? Qual o valor médio?
4. Altere o perfil de energia no QAM e veja se `cat /sys/class/hwmon/hwmon4/power1_cap` muda. O que o cap em microwatts representa?
5. **Desafio.** Com o Deck em idle e brilho no máximo, anote o `energy-rate`. Depois, com o mesmo brilho, abra um jogo leve e um pesado e anote. Calcule a autonomia estimada nos três cenários. Qual componente (tela, APU, SSD) você acha que explica a maior fatia da diferença entre idle e jogo pesado?