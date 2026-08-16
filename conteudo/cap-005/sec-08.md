O Steam Deck tem um plano de fundo sonoro que o usuário só percebe quando algo falha: a ventoinha. Ela é controlada por firmware e pelo driver térmico do kernel, e seu comportamento — silêncio, rugido ou desligamento por superaquecimento — é previsível se você souber ler os sensores do APU. Esta seção ensina a monitorar temperatura, brilho e o estado da bateria diretamente pelo terminal, sem depender do overlay do modo Gaming.

:::objetivos
- Monitorar temperatura do APU com sensores do kernel
- Controlar o brilho da tela pelo terminal
- Ler o estado da bateria, ciclos e nível de carga
- Interpretar alertas térmicos nos logs do sistema
- Entender os thresholds que disparam a ventoinha e o throttling
:::

## Lendo a temperatura

O APU (Accelerated Processing Unit) do Deck — um chip AMD customizado que une CPU e GPU — expõe sensores de temperatura via `/sys/class/hwmon`. O caminho exato varia com o kernel, mas o diretório é previsível:

```terminal
$ ls /sys/class/hwmon/
hwmon0  hwmon1  hwmon2
```

Cada entrada `hwmonN` corresponde a um dispositivo com sensores. Para o APU AMD, basta encontrar qual deles contém as temperaturas:

```terminal
$ cat /sys/class/hwmon/hwmon*/name
acpitz
nvme
amdgpu
```

`amdgpu` é o driver da GPU integrada. Os arquivos `temp*_input` dentro desse diretório mostram as temperaturas em milésimos de grau Celsius:

```terminal
$ cat /sys/class/hwmon/hwmon2/temp1_input
48000
$ cat /sys/class/hwmon/hwmon2/temp2_input
52000
$ cat /sys/class/hwmon/hwmon2/temp3_input
43500
```

Os valores `48000`, `52000` e `43500` significam 48 °C, 52 °C e 43,5 °C. O `temp1` costuma ser a borda do chip (edge), `temp2` é o hotspot (o ponto mais quente do die), e `temp3` é o sensor da memória ou um segundo núcleo.

Para quem prefere uma leitura consolidada, o pacote `lm_sensors` (instalável via Flatpak) oferece o comando `sensors`, mas para uma checagem rápida nada vence um `cat` direto no hwmon:

```terminal
$ for f in /sys/class/hwmon/hwmon2/temp*_input; do
>   label=$(cat ${f%_input}_label 2>/dev/null || echo "sensor")
>   val=$(( $(cat "$f") / 1000 ))
>   echo "$label: ${val}°C"
> done
edge: 48°C
junction: 52°C
mem: 43°C
```

:::nota
O APU do Steam Deck é projetado para operar até ~95 °C (hotspot). Temperaturas de 70–85 °C durante jogos pesados são normais e não indicam defeito. O kernel faz *throttling* (redução de frequência) a partir de ~90 °C para proteger o silício.
:::

## Brilho, tela e backlight

O brilho da tela do Deck é controlado pelo subsistema `backlight`, exposto em `/sys/class/backlight/`. Ajustar por ali é direto e funciona sem interface gráfica:

```terminal
$ ls /sys/class/backlight/
amdgpu_bl1
$ cat /sys/class/backlight/amdgpu_bl1/brightness
180
$ cat /sys/class/backlight/amdgpu_bl1/max_brightness
255
```

O brilho atual é `180` de `255` máximo (cerca de 70%). Para alterá-lo, escreva o valor diretamente no arquivo (requer `sudo`, porque o dispositivo pertence ao root):

```terminal
$ echo 100 | sudo tee /sys/class/backlight/amdgpu_bl1/brightness
100
```

Para voltar ao máximo: `echo 255 | sudo tee ...`. Essa técnica é útil para scripts de automação ou quando o overlay gráfico não responde.

## Bateria: nível, ciclos e saúde

O subsistema de bateria fica em `/sys/class/power_supply/`. No Deck, o diretório relevante é `BAT1`:

```terminal
$ ls /sys/class/power_supply/BAT1/
capacity  charge_full  charge_full_design  charge_now  current_now  status  technology  type  uevent  voltage_now
```

Cada arquivo tem uma informação específica. Os mais relevantes:

```terminal
$ cat /sys/class/power_supply/BAT1/capacity
87
$ cat /sys/class/power_supply/BAT1/status
Discharging
$ cat /sys/class/power_supply/BAT1/charge_full
4884000
$ cat /sys/class/power_supply/BAT1/charge_full_design
5313000
```

`capacity` é o percentual atual (87%). `status` indica se está carregando (`Charging`), descarregando (`Discharging`) ou cheio (`Full`). `charge_full` é a capacidade máxima atual em microampère-hora (µAh), e `charge_full_design` é a capacidade de fábrica. A diferença entre os dois mostra o desgaste: `4884000 / 5313000 ≈ 0,92`, ou seja, a bateria reteve 92% da carga original.

:::dica
Para calcular a saúde da bateria em uma linha: `echo "scale=2; $(cat /sys/class/power_supply/BAT1/charge_full) / $(cat /sys/class/power_supply/BAT1/charge_full_design) * 100" | bc`. O `bc` é uma calculadora de precisão arbitrária; se não estiver instalado, `flatpak search bc` resolve.
:::

## Ventoinha e logs térmicos

O comportamento da ventoinha é registrado nos logs do kernel. Quando a temperatura sobe demais ou o throttling é acionado, mensagens aparecem no `dmesg`:

```terminal
$ sudo dmesg | grep -iE 'thermal|fan|throttl' | tail -8
[  512.348122] amdgpu 0000:04:00.0: [drm] GPU throttling enabled
[  512.421045] thermal thermal_zone0: Trip point[0] temperature=95000, type=critical
```

A linha `GPU throttling enabled` aparece quando o kernel reduz a frequência para baixar a temperatura; é um aviso, não um erro. O trip point a 95 °C (`95000`) indica onde o desligamento de emergência seria acionado.

Se a ventoinha estiver sempre no máximo ou sempre desligada, o problema pode ser do firmware do controlador embutido (EC). O kernel expõe a rotação em alguns modelos:

```terminal
$ cat /sys/class/hwmon/hwmon0/fan1_input 2>/dev/null
3200
```

O valor `3200` é a rotação em RPM. Nem todo kernel `-neptune` expõe esse arquivo, mas quando expõe, ele é a prova de que a ventoinha está girando.

:::atencao
Se o Deck desligar sozinho durante um jogo sem aviso de bateria baixa, o motivo mais provável é superaquecimento. Antes de abrir o hardware, rode `sudo journalctl -b -1 | grep -iE 'thermal|temp|critical'` para ver os logs do boot anterior e confirmar se houve trip térmico.
:::

## Resumo

- Sensores de temperatura do APU ficam em `/sys/class/hwmon/hwmon*/`, com valores em milésimos de °C.
- `edge`, `junction` e `mem` são os três principais sensores; hotspot até ~95 °C é seguro.
- Brilho da tela se lê e se ajusta em `/sys/class/backlight/amdgpu_bl1/brightness` (0–255).
- Bateria: `capacity` é o % atual, `status` o estado, e `charge_full / charge_full_design` mede a saúde.
- Logs térmicos (`sudo dmesg`) registram throttling e trip points; o desligamento por calor deixa rastro no `journalctl` do boot anterior.

## Exercícios

1. Localize o sensor de temperatura do APU em `/sys/class/hwmon/` e leia `temp1_input`, convertendo para °C.
2. Leia o brilho atual da tela com `cat /sys/class/backlight/amdgpu_bl1/brightness` e ajuste para um valor menor com `sudo tee`.
3. Liste os arquivos de `/sys/class/power_supply/BAT1/` e calcule a saúde da bateria comparando `charge_full` e `charge_full_design`.
4. Rode `sudo dmesg | grep -iE 'thermal|fan|throttl'` e interprete as mensagens encontradas.
5. **Desafio.** Crie um script de uma linha (usando `for`, `cat` e aritmética de shell) que leia todos os `temp*_input` de `hwmon2`, converta para °C e exiba com o rótulo do sensor. Depois, compare com a leitura do `sensors` (se instalado) e explique eventuais diferenças.