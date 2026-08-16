O sistema de dissipação do Steam Deck tem um único cooler com uma única ventoinha para evacuar o calor da APU. A curva de rotação de fábrica é conservadora — prioriza o silêncio em detrimento da temperatura. Quando você sobe limites de potência e faz undervolting, a temperatura da APU sobe, e a ventoinha precisa responder mais cedo. Esta seção ensina a ajustar a curva para manter o chip frio sem transformar o Deck num drone.

:::objetivos
- Entender os modos de controle da ventoinha expostos pelo Smokeless UMAF
- Configurar uma curva personalizada de temperatura × velocidade
- Equilibrar ruído acústico com temperatura da APU
- Testar a curva sob carga real de jogo
:::

## Onde configurar

No Smokeless UMAF, as opções da ventoinha ficam em `Device Manager → AMD PBS → FCH Common Options` ou, em algumas revisões de firmware, diretamente em `Smart Fan Control`:

```text
FCH Common Options
└── Fan Control
    ├── Fan Control Mode      [Manual]
    ├── Fan Start Temperature [40 °C]
    ├── Fan Full Speed Temperature [85 °C]
    ├── Fan Start PWM         [30 %]
    └── Fan Full PWM          [100 %]
```

No modo `Manual`, você define dois pontos (início e fim) e a ventoinha interpola linearmente entre eles. É uma curva de dois pontos, não uma tabela arbitrária — mas funciona bem no Deck, que tem gradiente térmico previsível.

:::nota
O modo `Auto` de fábrica usa uma curva mais complexa (com histerese e rampas) que o Smokeless UMAF não expõe completamente. Ao mudar para `Manual`, você perde a rampa suave — a ventoinha pode responder mais bruscamente.
:::

## Construindo uma curva segura

O objetivo é: a ventoinha deve começar audível (~40%) aos 55°C e ficar a 100% aos 88°C, antes que a APU atinja o limite de throttling (95°C).

```text
Fan Start Temperature: 50 °C
Fan Full Speed Temperature: 88 °C
Fan Start PWM: 25 %
Fan Full PWM: 100 %
```

Com esses valores:
- Abaixo de 50°C, a ventoinha gira a 25% (quase inaudível).
- Aos 70°C, está a aproximadamente 60% (audível, mas não incômoda).
- Aos 88°C, está a 100%. O throttling da APU começa nos 95°C, então há 7°C de margem.

:::perigo
Nunca configure `Fan Start PWM` abaixo de 15%: há um mínimo de tensão abaixo do qual a ventoinha do Deck não consegue partir e fica travada consumindo corrente, aquecendo o enrolamento. Mesmo que a interface aceite o valor, o motor pode sofrer danos por stall prolongado.
:::

## Lendo a velocidade atual no SteamOS

```terminal
$ cat /sys/class/hwmon/hwmon3/fan1_input
4213
```

O valor exibido é a rotação em RPM. A ventoinha do Deck original vai de ~2000 RPM (25%) até ~7300 RPM (100%). Para ver a temperatura junto:

```terminal
$ echo "Ventoinha: $(cat /sys/class/hwmon/hwmon3/fan1_input) RPM, APU: $(cat /sys/class/hwmon/hwmon3/temp1_input | awk '{print $1/1000}') °C"
Ventoinha: 4213 RPM, APU: 68.0 °C
```

Os números exatos dos índices `hwmon3` podem variar conforme a revisão do Deck; confira com `ls /sys/class/hwmon/hwmon*/name` qual expõe `fan1_input`.

## Testando a curva

Aplique a curva no Smokeless UMAF, salve e rode uma carga pesada por 15 minutos:

```terminal
$ stress-ng --cpu 8 --cpu-method matrixprod --timeout 900s
```

Enquanto isso, monitore temperatura e RPM:

```terminal
$ watch -n 2 'echo "T: $(cat /sys/class/hwmon/hwmon3/temp1_input | awk "{print \$1/1000}") °C  FAN: $(cat /sys/class/hwmon/hwmon3/fan1_input) RPM"'
```

Se a temperatura estabilizar entre 80 e 88°C com a ventoinha entre 70% e 100%, a curva está adequada. Se a ventoinha estiver a 100% e a temperatura acima de 92°C, você precisa de uma curva mais agressiva — ou reduzir os limites de potência configurados.

:::dica
A ventoinha do Deck acelera e desacelera com inércia: mudanças bruscas de PWM (ex.: de 30% para 80% em 1 segundo) causam um som de "zumbido crescente" perceptível. Se o seu perfil de carga alterna entre idle e carga máxima rapidamente (compilação de shaders, por exemplo), espere flutuações acústicas — é normal e não danifica.
:::

## Quando usar o modo Auto

Se você não subiu os limites de potência além dos 20 W e fez undervolting leve (−5 a −10), o modo `Auto` de fábrica costuma dar conta. A curva manual faz mais diferença quando:

- PPT foi para 22-25 W.
- O undervolt é agressivo (−15 ou mais) e o chip esquenta menos, permitindo que a ventoinha rode mais devagar sem prejuízo.
- Você joga em ambientes externos quentes (acima de 30°C), onde a curva de fábrica demora a reagir.

## Resumo

- A curva da ventoinha se ajusta no Smokeless UMAF em `FCH → Fan Control` no modo `Manual`.
- A curva de dois pontos interpola linearmente entre temperatura de início e fim.
- Comece com `Fan Start PWM` a 25% (50°C) e `Fan Full PWM` a 100% (88°C), 7°C antes do throttling.
- Monitore RPM via `/sys/class/hwmon/` e valide a curva com carga real de 15+ minutos.
- Nunca configure PWM mínimo abaixo de 15% — risco de travamento do motor da ventoinha.

## Exercícios

1. Anote a velocidade da ventoinha e a temperatura da APU em idle e após 10 minutos de carga com a curva Auto de fábrica.
2. Configure a curva manual sugerida (50°C/25% a 88°C/100%) e repita a medição. Compare RPM máxima e temperatura de equilíbrio.
3. Eleve `Fan Start Temperature` para 65°C e observe: a ventoinha demora mais a acelerar. Isso é desejável num Deck usado em ambiente frio?
4. Abaixe `Fan Full PWM` para 85% e veja se a temperatura estabiliza abaixo de 90°C. Se sim, você acaba de criar uma curva mais silenciosa.
5. **Desafio.** A ventoinha do Deck é controlada por PWM via EC (Embedded Controller). Explique por que o kernel Linux não vê a ventoinha como um dispositivo de controle genérico (`pwm1`) e por que a interface é apenas de leitura (`fan1_input`), não de escrita. Proponha uma ferramenta que burle isso — sem o Smokeless UMAF.