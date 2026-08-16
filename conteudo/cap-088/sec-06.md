Thermal throttling é o mecanismo que protege o APU do Steam Deck quando a temperatura se aproxima do limite de segurança: em vez de deixar o silício queimar, o chip reduz a própria frequência e a tensão, trocando desempenho por sobrevivência. Todo Deck sofre throttling em algum momento — a questão é saber se ele está acontecendo nos momentos certos (carga extrema, ventilação bloqueada) ou se virou rotina por defeito de refrigeração. Esta seção ensina a detectar, medir e interpretar o throttling.

:::objetivos
- Entender o que é throttling e por que ele é desejável
- Conhecer os limites térmicos do APU (trip points) e o papel de Tctl
- Detectar throttling pela queda de frequência e pelo log do kernel
- Medir a perda de desempenho com `stress` e contagem de FPS
- Separar throttling térmico de gargalo de GPU/CPU
:::

## Por que o chip se limita

O silício tem um teto físico: acima de certa temperatura, o semicondutor degrada e pode falhar. O teto de projeto do APU do Deck é de **100 °C**, mas o firmware começa a reduzir clocks bem antes, por volta de 90–95 °C em `Tctl`. Essa folga existe porque `Tctl` é uma média com atraso — um hotspot interno pode estar mais quente do que o valor reportado.

O throttling não é uma emergência, é uma política: o controlador de energia do chip reduz multiplicador e tensão em degraus, espera a temperatura ceder, e só então volta a subir. O resultado visível é uma queda de FPS que surge "do nada" quando a grade de ar está bloqueada ou a pasta térmica está seca.

:::nota
Há um segundo tipo de limitação com o qual o throttling é confundido: o **power throttling**. O APU do Deck tem TDP configurável (4–15 W); atingir o teto de potência também reduz clock, mas por razão de energia, não de calor. A seção sobre monitoramento distingue os dois.
:::

## Os trip points e o valor de Tctl

O kernel expõe os limiares de temperatura — chamados **trip points** — que disparam ações de proteção. No `k10temp` do Deck, eles podem ser consultados:

```terminal
$ cat /sys/class/thermal/thermal_zone0/trip_point_*
```

Cada `thermal_zone` agrupa um sensor e seus trip points. Um trip point do tipo `critical` executaria um desligamento de emergência; trip points do tipo `hot` geram throttle. No Deck, o valor que importa é o `Tctl`, porque é ele que o firmware monitora para decisões de throttle.

:::info
Nem todos os trip points são expostos em `sysfs` no SteamOS. Parte da lógica de throttle do APU roda dentro do firmware do chip (o PMFW — power management firmware), fora do alcance do kernel. Por isso, em vez de ler trip points, costuma ser mais prático observar a frequência caindo em tempo real.
:::

## Detectando throttling pela frequência

O indicador mais confiável de throttling é a **frequência dos núcleos** caindo abaixo do boost esperado mesmo sob carga constante. O kernel expõe o clock atual em `cpufreq`:

```terminal
$ grep MHz /proc/cpuinfo
cpu MHz		: 3500.000
cpu MHz		: 3500.000
cpu MHz		: 1400.000
cpu MHz		: 1400.000
```

Se metade dos núcleos despenca para ~1400 MHz enquanto os outros se mantêm em 3500 MHz durante uma carga que deveria saturar todos, você está vendo throttle (ou o escalonador reduzindo núcleos ociosos — por isso é preciso comparar com carga).

O comando mais claro é monitorar o clock durante uma carga controlada:

```terminal
$ stress --cpu 8 --timeout 30s &
$ watch -n 1 'grep MHz /proc/cpuinfo | awk "{s+=\$4; n++} END {print s/n \" MHz (média)\"}"'
```

Se a média começa em ~3500 MHz e, após alguns segundos, colapsa para ~1400 MHz enquanto a temperatura se mantém em 90+ °C, o throttling térmico está ativo.

## O log do kernel e a confirmação

O kernel registra eventos térmicos em `dmesg`/`journalctl`. Mensagens de throttle costumam aparecer como alertas do driver térmico:

```terminal
$ sudo journalctl -k | grep -iE "thermal|throttl" | tail -5
kernel: mce: CPU4: Package temperature above threshold, cpu clock throttled
kernel: CPU4: Core temperature above threshold, cpu clock throttled
```

Linhas com "cpu clock throttled" são a assinatura do throttling sendo acionado e, depois, revertido ("below threshold"). Acumular muitas dessas linhas durante jogos leves é sinal de que a refrigeração não está dando conta.

:::atencao
Nem todo evento "thermal" no log é throttling do APU. Linhas sobre `nvme` ou sobre o `amdgpu` podem indicar o SSD ou a GPU limitando. Leia a linha inteira antes de concluir — o dispositivo afetado aparece no texto.
:::

## Throttling térmico vs. gargalo de GPU

Um erro comum é atribuir toda queda de FPS a temperatura. Em jogos limitados pela GPU, a frequência da GPU pode cair por demanda (a cena ficou mais leve) sem qualquer relação com calor. A regra de ouro: throttling térmico só se confirma quando a temperatura está perto do teto (90+ °C) **e** a frequência cai sob carga **e** as mensagens de "clock throttled" aparecem. Se a temperatura está em 70 °C e o FPS caiu, o gargalo é outro.

## Resumo

- Thermal throttling reduz clock e tensão do APU para proteger o silício quando a temperatura sobe demais.
- O teto de projeto é ~100 °C, mas o throttle começa em `Tctl` por volta de 90–95 °C.
- Trip points em `thermal_zone` e o firmware PMFW disparam as ações de proteção.
- A queda da frequência em `/proc/cpuinfo` sob carga constante é o indicador mais prático de throttle.
- Mensagens "cpu clock throttled" no `journalctl -k` confirmam o evento térmico.

## Exercícios

1. Com `stress --cpu 8` rodando, monitore a frequência média em `/proc/cpuinfo`. Em que temperatura a média começa a cair?
2. Rode `journalctl -k | grep -i throttl` e anote quantas vezes o kernel registrou "cpu clock throttled" nas últimas semanas.
3. Bloqueie a grade traseira durante um jogo pesado por 20 segundos. Meça a queda de FPS e a subida de temperatura.
4. Compare o clock dos núcleos em idle e sob carga. Como você distingue núcleos ociosos de núcleos com throttle?
5. **Desafio.** Execute uma carga de CPU e uma de GPU (um jogo) simultaneamente e identifique, pelo clock e pela temperatura, se o Deck entra em throttle térmico ou em power throttle (teto de 15 W) primeiro. Justifique com os valores medidos.