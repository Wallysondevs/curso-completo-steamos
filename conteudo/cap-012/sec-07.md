O `ryzenadj` que você usou até aqui é a ferramenta mais acessível para mexer nos limites da APU, mas não é a única. Existem parâmetros de energia que o `ryzenadj` não expõe, e há outro caminho: falar diretamente com a SMU (System Management Unit) da AMD. Esta seção mergulha nos controles finos — limite de temperatura, corrente elétrica e como monitorar a tensão que a APU está realmente recebendo.

:::objetivos
- Usar `ryzenadj --tctl-temp` para limitar a temperatura máxima da APU
- Ler a temperatura via `/sys/class/thermal/thermal_zone0/temp`
- Entender o que TDC e EDC significam e quando mexer neles
- Conhecer os limites do `ryzenadj` e o que fica para ferramentas de menor nível
:::

## Limite de temperatura como trava de segurança

Talvez o parâmetro mais importante depois do TDP seja o teto térmico. A flag `--tctl-temp` do `ryzenadj` define a temperatura máxima que a APU deve respeitar. Se o TDP está em 15 W mas a temperatura dispara, o chip reduz o clock para não ultrapassar esse teto — e você perde FPS sem ter mexido no TDP:

```terminal
$ sudo ryzenadj --tctl-temp=85
Sucessfully set tctl_temp to 85
```

O valor está em graus Celsius. A APU Aerith tem uma temperatura de junção máxima (`Tjmax`) de 95 °C definida pela AMD. Configurar `--tctl-temp` para 85 °C significa que você está apertando o freio 10 °C antes do limite de fábrica — uma escolha conservadora que reduz ruído de ventoinha e prolonga a vida útil do silício, mas pode custar alguns FPS em carga máxima.

Para ler a temperatura atual da APU, o kernel expõe as zonas térmicas:

```terminal
$ cat /sys/class/thermal/thermal_zone0/temp
72300
```

O valor está em **miligraus Celsius**. `72300` significa 72,3 °C. O Deck costuma ter duas ou três zonas térmicas (`thermal_zone0`, `thermal_zone1`, `thermal_zone2`), cada uma representando um sensor diferente no silício ou na placa. A `thermal_zone0` é tipicamente a temperatura da APU (`Tctl`). Para ver todas de uma vez:

```terminal
$ for z in /sys/class/thermal/thermal_zone*/temp; do echo "$z: $(cat $z)"; done
/sys/class/thermal/thermal_zone0/temp: 72300
/sys/class/thermal/thermal_zone1/temp: 68500
```

Monitore a temperatura enquanto ajusta o teto:

```terminal
$ watch -n 2 'echo "$(cat /sys/class/thermal/thermal_zone0/temp | awk "{print \$1/1000}") °C"'
```

:::atencao
Não configure `--tctl-temp` abaixo de 75 °C se você planeja jogar títulos AAA. Nessa temperatura, a APU reduz o clock agressivamente, e você pode perder 30% ou mais de FPS sem entender o motivo. O sintoma clássico: FPS oscilando sem razão aparente, com TDP longe do teto e GPU com clock baixo — o culpado é o limite térmico.
:::

## TDC e EDC: corrente, não potência

Além do TDP (limite de potência), a APU tem limites de **corrente**: o TDC (Thermal Design Current) e o EDC (Electrical Design Current). O TDC limita a corrente sustentada que pode fluir pelo regulador de tensão considerando a dissipação térmica; o EDC é um limite de pico de corrente elétrica, mais alto que o TDC e pensado para rajadas curtas.

No `ryzenadj --info`, esses campos podem aparecer como `disabled`:

```terminal
$ sudo ryzenadj --info | grep -E 'TDC|EDC'
TDC LIMIT VDD: disabled
TDC LIMIT SOC: disabled
EDC LIMIT VDD: disabled
```

"Isso significa que a Valve não programou esses limites na SMU da Aerith para o Steam Deck. Mexer em TDC e EDC sem entender exatamente o que está fazendo é desnecessário — e potencialmente perigoso, porque um limite de corrente mal configurado pode sobrecarregar os VRMs da placa-mãe.

:::perigo
Os limites de corrente (TDC/EDC) protegem o regulador de tensão da placa-mãe, não só o silício. Desabilitá-los ou subi-los demais pode literalmente danificar componentes da placa. No Steam Deck, onde o hardware é integrado e não substituível, isso significa uma máquina inutilizável. Se o `ryzenadj` mostra `disabled`, deixe como está.
:::

## Lendo a tensão da APU

A tensão que a APU recebe aparece de duas formas. O `sensors` mostra `vddgfx`, a tensão do domínio gráfico:

```terminal
$ sensors | grep vddgfx
vddgfx:       +0.85 V
```

O caminho via `/sys` oferece a tensão do núcleo da CPU (`VDDCR_SOC` ou similar, dependendo da revisão do kernel):

```terminal
$ cat /sys/class/hwmon/hwmon3/in0_input
850
```

O valor `850` é em milivolts, equivalente a 0,85 V. Essa leitura vem direto do controlador de tensão da placa-mãe e tende a ser mais precisa que qualquer estimativa indireta. A tensão oscila conforme a carga e o clock; em modo ocioso, valores de 0,65 V a 0,75 V são comuns. Em carga máxima, a tensão sobe para sustentar o clock — é exatamente isso que o undervolt tenta conter.

## A temperatura do sistema além da APU

O Deck não aquece só na APU. O SSD NVMe, o chip de Wi-Fi e a bateria também geram calor e afetam a temperatura percebida nas mãos. O `sensors` lista todos os sensores disponíveis:

```terminal
$ sensors
amdgpu-pci-0300
Adapter: PCI adapter
vddgfx:       +0.85 V
fan1:        3214 RPM
edge:         +71.0°C
slowPPT:      11.00 W
GPU Clock:    1200 MHz

k10temp-pci-00c3
Adapter: PCI adapter
Tctl:         +72.3°C

nvme-pci-0100
Adapter: PCI adapter
Composite:    +48.0°C
Sensor 1:     +48.0°C

acpitz-acpi-0
Adapter: ACPI interface
temp1:        +45.0°C
```

- `amdgpu-pci-0300.edge`: borda do die da GPU.
- `k10temp-pci-00c3.Tctl`: temperatura de controle da CPU (a que o `--tctl-temp` usa).
- `nvme-pci-0100.Composite`: temperatura do SSD NVMe.
- `acpitz-acpi-0.temp1`: zona térmica da placa-mãe reportada pela ACPI.

Se o SSD NVMe bater 70 °C, o próprio firmware dele reduz o desempenho para se proteger, independentemente do TDP da APU. Com isso, loadings ficam mais lentos — outro exemplo de como o limite térmico do sistema inteiro importa, não só o da APU.

## O que o ryzenadj não faz

O `ryzenadj` cobre os parâmetros que a SMU expõe por uma interface pública. Mas há coisas que ele não alcança:

- **Curva de ventoinha:** controlada pelo firmware do Deck, não pela SMU da AMD. Só se altera por ferramentas de firmware ou scripts que escrevem em `/sys/class/hwmon/hwmonX/pwm1`.
- **Clock da GPU:** como você viu na seção sobre fixação de clock, o `ryzenadj` não mexe em GPU — quem controla é o Gamescope e o driver `amdgpu`.
- **Tensão da GPU (vddgfx):** `ryzenadj` atua via Curve Optimizer só nos núcleos de CPU; a GPU integrada tem outro controlador de tensão.
- **Parâmetros do carregador:** a velocidade de carga, o limite de carga máxima (útil para preservar a bateria) e o modo "pass-through" ficam em outro domínio.

Saber onde o `ryzenadj` termina é tão importante quanto saber o que ele faz. Se o ajuste que você quer não está no `ryzenadj --info`, você precisa de outra ferramenta — e possivelmente de outro capítulo.

## Resumo

- `--tctl-temp=85` limita a temperatura da APU; abaixo de 75 °C causa perda agressiva de FPS.
- `/sys/class/thermal/thermal_zone0/temp` informa a temperatura em miligraus Celsius.
- TDC e EDC controlam corrente elétrica; no Deck aparecem como `disabled` e não devem ser alterados.
- `sensors` mostra temperatura de GPU, CPU, SSD e placa-mãe numa única execução.
- `ryzenadj` não controla ventoinha, clock de GPU nem tensão gráfica — cada domínio tem sua ferramenta.

## Exercícios

1. Leia a temperatura atual da APU com `cat /sys/class/thermal/thermal_zone0/temp` e converta para Celsius.
2. Aplique `sudo ryzenadj --tctl-temp=85`, rode `stress --cpu 8 --timeout 60s` e monitore a temperatura. Ela respeitou o teto?
3. Execute `sensors` e identifique a temperatura do SSD NVMe. Ela está acima de 60 °C sob carga?
4. Liste todas as zonas térmicas do sistema e determine qual sensor corresponde a qual componente.
5. **Desafio.** Combine `--tctl-temp=80` com TDP 12 W e rode um benchmark de GPU por 5 minutos. O FPS caiu? Se sim, qual limite foi atingido primeiro: o TDP ou a temperatura? Use `watch` com `ryzenadj --info` e a leitura de thermal_zone para fundamentar sua resposta.