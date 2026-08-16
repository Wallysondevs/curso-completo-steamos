O Steam Deck rodava liso a 60 fps ontem, e hoje está engasgando a 40, com a ventoinha no máximo e o aparelho quente. É um padrão que assusta, mas raramente é degradação de hardware — quase sempre é *throttling* (redução automática de frequência por temperatura ou energia), um processo em segundo plano que está sugando a CPU, ou um kernel que trocou o governador de desempenho. Esta seção ensina a medir, localizar e reverter a queda de desempenho.

:::objetivos
- Medir temperatura e frequência da CPU e GPU em tempo real
- Detectar throttling térmico e de energia antes de sentir nos jogos
- Localizar processos que consomem recursos em segundo plano
- Ajustar o governador de CPU e recuperar o perfil de desempenho
:::

## Medindo antes de opinar

Antes de mexer em qualquer configuração, você precisa de números. O Steam Deck expõe sensores de temperatura, frequência e consumo pelo subsistema `hwmon` do kernel, acessível via `/sys/class/hwmon/` ou por ferramentas como `sensors` e `mangohud`.

```terminal
$ sensors
amdgpu-pci-0400
Adapter: PCI adapter
vddgfx:      688.00 mV
fan1:           0 RPM  (min =    0 RPM, max = 7500 RPM)
edge:         +62.0°C  (crit = +105.0°C, hyst = +80.0°C)
junction:     +74.0°C  (crit = +110.0°C, hyst = +85.0°C)
mem:          +61.0°C  (crit = +105.0°C, hyst = +78.0°C)

nvme-pci-0100
Composite:    +48.0°C  (low  = -273.1°C, high = +83.8°C)

acpitz-acpi-0
Adapter: ACPI interface
temp1:        +60.0°C
```

A temperatura `junction` (a junção do semicondutor dentro do chip) é a mais crítica para throttling. O limite `crit` de 110 °C para a junção da GPU AMD é a fronteira a partir da qual o hardware reduz a frequência agressivamente para se proteger. Uma `junction` acima de 95 °C durante jogo pesado é normal; acima disso em modo ocioso, não.

:::info
O Steam Deck tem dois tipos de throttling: **PROCHOT** (limite térmico da CPU/GPU, que reduz frequência) e **PPT** (limite de potência do pacote, em watts, que limita corrente). O `sensors` mostra temperatura; para ver o estado real do throttling, leia os arquivos em `/sys/class/hwmon/hwmon*/temp*_throttle` — um `1` ali significa que o throttling está ativo naquele instante.
:::

## O que está queimando seus ciclos

Com as temperaturas anotadas, o próximo passo é descobrir *o que* está consumindo CPU e GPU. O `htop` é a ferramenta visual; no terminal, `top` em modo batch é mais direto para diagnóstico rápido.

```terminal
$ top -b -n 1 -o %CPU | head -12

top - 18:45:33 up 15:22,  2 users,  load average: 2.84, 1.91, 1.32
Tasks: 312 total,   2 running, 310 sleeping,   0 stopped,   0 zombie
%Cpu(s): 24.5 us,  8.2 sy,  0.0 ni, 62.1 id,  0.0 wa,  5.2 hi,  0.0 si,  0.0 st
MiB Mem :  14910.6 total,   1823.4 free,   5216.8 used,   7870.4 buff/cache
MiB Swap:   8192.0 total,   8192.0 free,      0.0 used.   9693.8 avail Mem

    PID USER      PR  NI    VIRT    RES  %CPU  %MEM     TIME+ COMMAND
   1234 ana       20   0  5.28g  2.12g  42.3  14.5  18:34.21 steam
    891 ana       20   0  1.23g 412.1m  18.7   2.8   5:12.87 gamescope
```

`%Cpu(s)` mostra que 24.5% do tempo a CPU está em modo usuário (jogos e aplicações) e 8.2% em kernel (drivers, sistema). O `id` (ocioso) de 62.1% indica que ainda há folga. Se `id` está próximo de zero, a CPU está saturada.

O verdadeiro vilão de desempenho costuma ser um processo que você nem sabia que estava rodando: um Flatpak atualizando em segundo plano, o indexador de arquivos (`baloo` no KDE Plasma), ou o Steam baixando atualizações enquanto você joga.

```terminal
$ systemctl --user list-units --state=running | grep -iE 'update|backup|index|sync|baloo'
  baloo_file.service loaded active running Baloo File Indexer Service
```

O `baloo`, indexador de arquivos do KDE Plasma, é um consumidor sorrateiro: depois de copiar muitos arquivos ou tirar screenshots, ele varre tudo e consome disco e CPU sem avisar. No modo jogo ele deveria estar desativado; se não estiver, é uma configuração que sobrou do modo desktop.

## Throttling: quando o hardware se defende

Throttling não é bug — é mecanismo de proteção. Mas quando ele dispara durante o jogo sem motivo aparente (as temperaturas estão normais), pode ser um falso positivo ou um sensor quebrado.

```terminal
$ cat /sys/class/hwmon/hwmon3/temp1_throttle
0
$ cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor
powersave
$ cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq
1399996
```

Aqui, `temp1_throttle` está em 0 (sem throttling), mas `scaling_governor` está em `powersave` — o governador de economia está mantendo a CPU em 1.4 GHz mesmo com jogo rodando. É uma causa comum de "desempenho caiu do nada": alguma atualização ou troca de perfil energético mudou o governador.

```terminal
# echo performance > /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor
# cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq
3499992
```

Mudar o governador para `performance` na mão (como root) é uma correção imediata que salta a frequência de 1.4 GHz para 3.5 GHz. O SteamOS deveria gerenciar isso automaticamente pelo modo jogo, mas nem sempre acerta. O arquivo `/sys` é volátil — a mudança se perde no reboot.

:::perigo
Forçar `performance` permanentemente e jogar com o aparelho no carregador dentro da capa pode atingir temperaturas de desligamento forçado (>105 °C). O governador `schedutil` é o padrão mais seguro: acelera sob demanda mas respeita o teto térmico e a bateria.
:::

## O suspeito da bateria

Um Steam Deck com bateria abaixo de 10% reduz o desempenho mesmo que você peça o contrário — o firmware limita a corrente para evitar desligamento súbito. A diferença de fps entre 100% e 5% de bateria pode chegar a 30%.

```terminal
$ cat /sys/class/power_supply/BAT1/capacity
8
$ cat /sys/class/power_supply/BAT1/status
Discharging
```

Se `capacity` está abaixo de 15 e `status` é `Discharging`, o throttling por bateria é quase certo. A solução não é software — é plugar o carregador e medir de novo.

## Resumo

- `sensors` mostra temperatura de CPU, GPU e SSD; `junction` acima de 95 °C em jogo é normal, acima em ocioso não.
- `top -b -n 1 -o %CPU` revela o processo que está queimando ciclos em segundo plano.
- `baloo` e atualizações do Steam em segundo plano são os vilões mais comuns de queda de fps.
- `scaling_governor` em `powersave` pode derrubar o desempenho; `performance` resolve, mas `schedutil` é o equilíbrio.
- `/sys/class/hwmon/hwmon*/temp*_throttle` com valor `1` confirma throttling ativo.
- Bateria abaixo de 10-15% força redução de desempenho por firmware, independente de qualquer configuração.

## Exercícios

1. Rode `sensors` durante cinco minutos de jogo e compare as temperaturas `edge` e `junction`. Elas ficam estáveis ou sobem continuamente?
2. Identifique os três processos que mais consomem CPU na sua sessão atual com `ps aux --sort=-%cpu | head -4`. Algum deles é surpreendente?
3. Verifique o governador atual de cada núcleo com `cat /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor`. Todos estão iguais?
4. Monitore o arquivo de throttling uma vez por segundo por 30 segundos durante um jogo: `watch -n 1 cat /sys/class/hwmon/hwmon3/temp1_throttle`. O throttling foi acionado?
5. **Desafio.** Compare a temperatura `junction` com e sem o carregador plugado durante o mesmo trecho de jogo. A diferença de temperatura é maior ou menor do que a diferença de fps? Explique o que isso revela sobre a relação entre energia, calor e desempenho.