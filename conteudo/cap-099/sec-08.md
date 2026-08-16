Rodar benchmark sem monitorar o sistema é correr vendado: você vê o número final mas não sabe o que estava acontecendo nos bastidores enquanto ele era medido. Temperatura, frequência, uso de memória, swap, interrupções — cada uma dessas métricas conta uma parte da história. Esta seção equipa você com as ferramentas para monitorar o sistema durante o benchmark, não depois.

:::objetivos
- Monitorar temperatura, frequência e tensão com `sensors` e `turbostat`
- Coletar métricas do sistema com `sar` (sysstat) durante benchmarks
- Registrar uso de CPU por processo com `pidstat`
- Configurar um loop de coleta que roda em paralelo ao benchmark
- Correlacionar quedas de desempenho com eventos do sistema
:::

## O terminal da direita: sensores

Durante qualquer teste de carga a prática elementar é abrir um segundo terminal e manter uma janela de monitoramento visível. As três ferramentas mais úteis são `sensors` (temperatura e tensão), `turbostat` (frequência e potência) e `top`/`htop` (processos).

```terminal
$ sensors
amdgpu-pci-0400
Adapter: PCI adapter
vddgfx:        0.81 V
fan1:         1832 RPM
edge:         +67.0°C
junction:     +72.3°C
mem:          +64.1°C

k10temp-pci-00c3
Tctl:         +71.8°C

nvme-pci-0100
Composite:    +58.0°C
Sensor 1:     +58.0°C
```

O `sensors` mostra a GPU (`amdgpu`), o sensor da CPU (`k10temp`) e o SSD NVMe. No Steam Deck, a temperatura `junction` da GPU e `Tctl` da CPU costumam estar próximas porque dividem o mesmo encapsulamento. O `edge` é a temperatura da borda do die, geralmente mais baixa. A `fan1` mostra a rotação da ventoinha — útil para entender se o sistema está tentando compensar o calor (RPM subindo) ou já está no limite.

O `turbostat` vai mais fundo: é uma ferramenta da Intel portada para AMD que lê contadores de desempenho diretamente.

```terminal
$ sudo turbostat --quiet --show PkgWatt,PkgTmp,Avg_MHz --interval 2
PkgWatt   PkgTmp   Avg_MHz
8.42      67       2391
15.31     78       2780
15.48     82       2784
15.29     84       2782
```

Cada linha é uma amostra a cada 2 segundos. `PkgWatt` é a potência do pacote em watts, `PkgTmp` a temperatura do die, `Avg_MHz` a frequência média dos núcleos. Nesta amostra a potência estabilizou em ~15.3 W, a temperatura subiu de 67 °C para 84 °C e a frequência ficou travada no máximo (~2780 MHz). É um sistema operando dentro do envelope, sem throttling.

```terminal
$ sudo turbostat --quiet --show PkgWatt,PkgTmp,Avg_MHz --interval 2
PkgWatt   PkgTmp   Avg_MHz
8.51      65       2130
14.92     79       2784
15.51     91       2780
15.03     95       2310
14.78     95       2140
```

Já aqui, aos 95 °C, a frequência começou a cair de 2780 MHz para 2310 MHz e depois 2140 MHz — throttling térmico. A potência também caiu levemente. Este é exatamente o tipo de dado que explica por que um benchmark de 30 segundos e um de 5 minutos dão resultados diferentes.

:::dica
`turbostat` precisa de permissão de root e do módulo `msr` carregado (`sudo modprobe msr`). Se ele falhar, use `sudo sensors` e `cat /sys/devices/system/cpu/cpu*/cpufreq/scaling_cur_freq` como fallback.
:::

## Coleta contínua com sar

Monitorar é olhar; coletar é registrar para análise posterior. O `sar` (System Activity Reporter), do pacote `sysstat`, registra métricas em segundo plano enquanto você faz outra coisa. Ele é ideal para acoplar a um benchmark: você dispara o `sar`, roda o benchmark, para o `sar` e analisa o log.

```terminal
$ sudo apt install sysstat
$ sudo systemctl enable --now sysstat
$ sar -u 2 10 > /tmp/cpu_bench.log &
[1] 23456
$ sysbench cpu --threads=8 --time=20 run
$ cat /tmp/cpu_bench.log
02:30:45        CPU     %user     %nice   %system   %iowait    %steal     %idle
02:30:47        all     87.21      0.00      2.15      0.00      0.00     10.64
02:30:49        all     87.34      0.00      2.11      0.00      0.00     10.55
02:30:51        all     87.10      0.00      2.20      0.00      0.00     10.70
...
Average:        all     87.25      0.00      2.14      0.00      0.00     10.61
```

O `sar -u 2 10` coleta uso de CPU a cada 2 segundos por 10 amostras (20 segundos totais). Durante o benchmark de CPU, o `%user` estabilizou em ~87% — note que `sysbench cpu` com 8 threads não chega a 100% de `%user` porque parte do trabalho é em `%system` e porque há overhead de troca de contexto. Os ~10% de `%idle` indicam que, apesar dos 8 threads, o processador ainda respirava.

```terminal
$ sar -r 2 10
02:31:15    kbmemfree   kbavail kbmemused  %memused kbbuffers  kbcached  kbcommit   %commit
02:31:17      5871232  11872342    985432      9.21    122334   5872980   2438120     23.11
02:31:19      5820110  11823450   1102554     10.32    121987   5921810   2440031     23.14
```

`-r` coleta memória. `kbavail` é o que o sistema considera disponível para novos processos; `%commit` é a fração da RAM+swap já prometida. Durante um benchmark que aloca memória (`stress-ng --vm`), observar `%commit` subindo e `kbavail` caindo revela se o sistema está perto de ativar o OOM Killer.

## pidstat: quem está comendo o quê

O `pidstat`, também do pacote `sysstat`, mostra uso de CPU, memória e E/S por processo, não por sistema. Se durante o benchmark algo estranho apareceu no `sar`, você usa o `pidstat` para identificar o culpado.

```terminal
$ pidstat 2 10
02:32:01   UID       PID    %usr %system  %guest   %wait    %CPU   CPU  Command
02:32:03  1000     12347   98.50   1.50    0.00    0.00  100.00     3  stress-ng-cpu
02:32:03  1000      5120    0.50   0.50    0.00    0.00    1.00     1  kwin_x11
02:32:03  1000      4890    0.00   0.50    0.00    0.00    0.50     2  plasmashell
```

Aqui o `stress-ng` está consumindo 100% de um núcleo (thread 3), enquanto `kwin_x11` (compositor KDE) e `plasmashell` aparecem com consumo residual. Se durante um benchmark de disco aparecesse um processo ocupando 30% de I/O no `pidstat`, você saberia que o benchmark não está sozinho.

:::atencao
O `sysstat` no SteamOS pode não vir instalado. Se `sar` e `pidstat` não estiverem disponíveis, instale com `sudo apt install sysstat` e habilite a coleta com `sudo systemctl enable sysstat`. A coleta do `sar` grava em `/var/log/sysstat/` e roda em segundo plano independentemente — mesmo quando você não está monitorando, ela está lá.
:::

## O loop de coleta: amarre tudo

Para um benchmark sério, o ideal é ter um script que dispara a coleta, roda o benchmark e salva tudo junto. Algo simples:

```terminal
$ cat ~/lab/bench-wrap.sh
#!/bin/bash
TS=$(date +%Y%m%d_%H%M%S)
DIR=~/lab/bench-$TS
mkdir -p "$DIR"

## coleta em background
sar -u 1 > "$DIR/cpu.log" 2>&1 &
SAR_PID=$!
sensors > "$DIR/sensors_antes.txt"

## roda o benchmark
echo "=== $(date) Início ===" >> "$DIR/resultado.txt"
sysbench cpu --threads=8 --time=30 run >> "$DIR/resultado.txt"
echo "=== $(date) Fim ===" >> "$DIR/resultado.txt"

## para a coleta
kill $SAR_PID
sensors > "$DIR/sensors_depois.txt"
echo "Resultados em $DIR"
```

Rodar `bash ~/lab/bench-wrap.sh` produz uma pasta com logs de CPU (`sar`), temperaturas antes e depois, e a saída do benchmark — tudo organizado por timestamp. Repetir o mesmo script antes e depois de uma mudança de configuração mantém a metodologia idêntica e comparável.

## Resumo

- `sensors` mostra temperatura (GPU, CPU, SSD), tensão e RPM da ventoinha em tempo real.
- `turbostat` lê potência (W), temperatura e frequência diretamente dos contadores da CPU.
- `sar` coleta métricas de CPU, memória e E/S em segundo plano com intervalo definido.
- `pidstat` identifica o consumo por processo e revela interferência de serviços indesejados.
- Amarre coleta (`sar`) e benchmark num script para garantir metodologia idêntica entre comparações.
- Sem monitoramento, um benchmark mais lento "depois" pode ser explicado por throttling, não pela sua mudança.

## Exercícios

1. Antes de rodar qualquer benchmark, execute `sensors` e anote temperaturas de CPU, GPU e SSD em repouso.
2. Em um terminal, rode `sar -u 1 30 > /tmp/cpu.log &` e em outro `sysbench cpu --threads=8 --time=25 run`. Depois calcule o `%user` médio do log.
3. Use `turbostat` (ou `sensors` + `scaling_cur_freq` em loop) durante um `stress-ng --cpu 8 --timeout 120s`. A frequência se manteve constante?
4. Rode `pidstat 1 10` durante um benchmark de disco (`fio`). Há algum processo alheio ao benchmark consumindo I/O?
5. **Desafio.** Escreva seu próprio `bench-wrap.sh` (baseado no modelo acima) que coleta `sar -u`, `sar -r` e `sensors` antes e depois, rode um benchmark à sua escolha e empacote tudo numa pasta com timestamp. Execute-o uma vez com o Deck frio e outra vez logo após um soak test de 10 minutos. Compare os resultados.