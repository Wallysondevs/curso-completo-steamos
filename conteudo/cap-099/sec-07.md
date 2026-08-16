Um sistema pode ser o mais rápido do mundo em benchmark curto e ainda travar, reiniciar ou perder desempenho depois de uma hora de carga. Teste de estabilidade é o primo disciplinado do benchmark: em vez de responder "quão rápido", ele responde "quanto tempo aguenta". No Steam Deck — hardware compacto, com refrigeração limitada e gestão de energia agressiva — a estabilidade térmica é a pergunta mais importante de todas.

:::objetivos
- Entender a diferença entre benchmark de vazão e teste de estabilidade
- Usar `stress-ng` para gerar carga sustentada em CPU, memória e E/S
- Observar throttling térmico e seu efeito no desempenho
- Executar um *soak test* longo e monitorar a temperatura
- Detectar instabilidade por queda de frequência, não por travamento

:::

## Estabilidade não é só "não travar"

A imagem mental de instabilidade é a tela congelando ou o reinício. Mas existe uma instabilidade mais sutil e mais comum no Steam Deck: o **throttling térmico**. Quando a temperatura sobe além do limite, o SoC reduz propositalmente a frequência para se proteger. O sistema não trava — ele fica lentamente mais lento.

Isso significa que um benchmark de 20 segundos pode reportar 12481 MiB/s enquanto o mesmo sistema, depois de 30 minutos de carga, sustenta apenas 9000 MiB/s. Se você estivesse comparando duas configurações com benchmarks curtos, poderia concluir que são iguais quando na verdade uma delas colapsa sob carga prolongada.

```terminal
$ stress-ng --cpu 8 --timeout 600s --metrics-brief
stress-ng: info:  [12347] dispatching hogs: 8 cpu
stress-ng: info:  [12347] successful run completed in 600.03s
stress-ng: info:  [12347] stressor       bogo ops real time  usr time  sys time   bogo ops/s   bogo ops/s/CPU
stress-ng: info:  [12347] cpu                5821140     600.00    4792.11    3.44       9701.90        1210.24
```

A chave é observar o `bogo ops/s/CPU` ao longo do tempo, não só o valor final. Se ele começa em 1210 e vai caindo, há throttling. Para enxergar isso, divida o teste em janelas ou monitore a frequência em paralelo (como verá na seção 8).

:::nota
O `stress-ng` reporta métricas agregadas ao final. Para detectar queda de desempenho no meio do teste, rode junto um monitor de frequência/temperatura num segundo terminal, ou use `stress-ng --metrics` com a flag `--sequential` para dividir a carga em fases. Alternativamente, execute várias rodadas curtas consecutivas e veja se o resultado de cada uma é estável.
:::

## Soak test: carga sustentada em tudo

Um *soak test* (teste de imersão) coloca carga simultânea em CPU, memória, E/S e GPU por um período longo — tipicamente 30 minutos a algumas horas. O objetivo não é medir número, é expor falhas que só aparecem com tempo: superaquecimento, vazamento de memória em driver, corrupção sob contenção.

```terminal
$ stress-ng --cpu 8 --vm 4 --hdd 2 --timeout 1800s --metrics-brief
stress-ng: info:  [12348] dispatching hogs: 8 cpu, 4 vm, 2 hdd
stress-ng: info:  [12348] successful run completed in 1800.00s
stress-ng: info:  [12348] stressor       bogo ops real time  usr time  sys time   bogo ops/s   bogo ops/s/CPU
stress-ng: info:  [12348] cpu               17463420     1800.00   14388.10   10.11       9701.90        1210.24
stress-ng: info:  [12348] vm                 832110      1800.00    4488.22   20.01       462.28        115.57
stress-ng: info:  [12348] hdd               184420      1800.00      44.12   320.10      102.45         51.22
```

Aqui `--vm 4` faz quatro *workers* alocarem e escreverem memória freneticamente (estressa RAM e o subsistema de paginação), e `--hdd 2` faz dois *workers* martelarem o disco. As três cargas competindo exponham gargalos que nenhuma delas isoladamente revela — por exemplo, E/S estourando a latência quando a CPU está saturada com compressão de memória.

:::perigo
Um soak test de horas esquenta o Steam Deck de verdade e consome bateria rapidamente se não estiver na tomada. Use sempre o carregador, deixe a ventoinha exposta e **monitore a temperatura**. Se ultrapassar a faixa segura (acima de ~100 °C no SoC), interrompa o teste com [[Ctrl+C]] imediatamente.
:::

## Detectar instabilidade pela frequência, não pelo desligamento

O primeiro sintoma de superaquecimento no Steam Deck é a queda da frequência, muito antes de qualquer travamento. Acompanhar `scaling_cur_freq` durante o teste revela o problema cedo:

```terminal
$ watch -n 1 'cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq'
Every 1.0s: cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq

2795000
2795000
2795000
2140000
2140000
2795000
```

O valor alterna entre 2795 MHz (velocidade máxima) e 2140 MHz (reduzida). Essa oscilação é o controlador de energia respondendo à temperatura: quando o SoC esquenta, a frequência cai; quando esfria um pouco, sobe de novo. Um sistema saudável sob load moderado pode oscilar; um sistema com refrigeração insuficiente fica **preso** na frequência reduzida.

```terminal
$ stress-ng --cpu 8 --temp-path /tmp --timeout 120s --thermalstat
stress-ng: info:  [12349] thermal statistics:
stress-ng: info:  [12349] thermal zone 0: 89.25 C (critical 95.00 C)
stress-ng: info:  [12349] thermal zone 1: 78.40 C
```

O `--thermalstat` do `stress-ng` lê as zonas térmicas do sistema ao final e reporta a temperatura atingida (e a temperatura crítica). Compare com o limite do seu dispositivo (`cat /sys/class/thermal/thermal_zone0/trip_point_*`).

:::info
O Steam Deck tem o TDP (Thermal Design Power) configurável. No modo Gaming você pode limitar o TDP via menu de desempenho. Reduzir o TDP diminui temperatura e ruído, mas também capa a frequência. Um teste de estabilidade com TDP restrito mede a máquina operando naquele envelope térmico — que pode ser exatamente o que você quer para jogar no sofá por horas sem injetar calor demais.
:::

## Resumo

- Estabilidade mede "aguenta"; benchmark mede "quão rápido" — são questões diferentes e complementares.
- Throttling térmico é uma instabilidade silenciosa: reduz frequência sem travar o sistema.
- Soak test combina carga de CPU, memória e E/S por longos períodos para expor falhas tardias.
- Observe `scaling_cur_freq` durante o teste: queda e oscilação de frequência sinalizam superaquecimento.
- `stress-ng --thermalstat` reporta temperatura e limite crítico ao final do teste.
- Monitore temperatura com carregador conectado e refrigeração livre; interrompa se passar do limite seguro.

## Exercícios

1. Rode `stress-ng --cpu 8 --timeout 120s --thermalstat` e registre a temperatura máxima atingida e a frequência durante o pico.
2. Execute um soak test de 10 minutos com `--cpu 8 --vm 4 --hdd 2` e, em paralelo, monitore a frequência com `watch -n 1`. Houve queda de frequência?
3. Compare o `bogo ops/s/CPU` de um `stress-ng --cpu 8 --timeout 30s` rodado com a máquina fria versus logo após um soak test de 15 minutos. A diferença confirma throttling?
4. Liste as zonas térmicas com `ls /sys/class/thermal/` e leia suas temperaturas e `trip_point` críticos. Qual é a margem até o limite?
5. **Desafio.** Repita o soak test da questão 2 com o TDP limitado (via menu de desempenho do modo Gaming, se disponível) e depois sem limite. Compare temperatura máxima, frequência média e `bogo ops/s`. Qual configuração é mais adequada para jogar por horas seguidas, e por quê?