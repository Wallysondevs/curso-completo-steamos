Todo chip que trabalha gera calor, e calor demais é o inimigo do desempenho. O termo **thermal throttling** descreve o mecanismo pelo qual o Deck reduz a frequência da APU quando a temperatura sobe demais, para evitar danos. O sistema de refrigeração — uma ventoinha e um tubo de calor — é o que decide quanto tempo você joga em desempenho máximo antes de o chip começar a se conter. O Linux expõe tudo isso nos sensores de temperatura.

:::objetivos
- Entender o que é thermal throttling e por que ele é proteção, não defeito
- Ler as temperaturas da APU e da placa via `thermal_zone*` e `sensors`
- Identificar os pontos de trip (gatilho) de temperatura configurados
- Verificar a rotação da ventoinha e o estado da refrigeração
- Diagnosticar superaquecimento e distinguir throttle de gargalo de GPU
:::

## A física do problema

A APU do Deck, em 15W de TDP, dissipa calor que precisa ir para algum lugar. O caminho é físico: o chip encosta num **spreader** de cobre, que se conecta a um **tubo de calor** (heat pipe) que leva o calor até o radiador, onde uma **ventoinha** sopra ar frio para fora por uma grelha na parte superior do aparelho.

Se a ventoinha trava, o radiador entope de poeira ou o aparelho é usado num ambiente a 40°C, o calor não escoa. A temperatura do silício sobe, e o firmware age: reduz o clock da CPU e da GPU — o **throttling** — trocando desempenho por segurança. O Deck não queima; ele fica lento.

O ponto de throttle do Deck fica tipicamente na casa dos **95-100°C** na junção da APU. Antes disso, a partir de uns 80-85°C, a ventoinha já acelera para tentar segurar a temperatura sem cortar clock.

:::nota
"Junção" (junction, ou `Tctl`) é a temperatura na interface interna do chip, medida por um sensor dentro do silício. Ela é sempre mais alta que a temperatura do dissipador ou do ar que sai da grelha. As leituras que você vê com `sensors` são a `Tctl`.
:::

## Lendo as zonas térmicas do kernel

O kernel agrupa sensores em **zonas térmicas** (`thermal_zone*`) dentro do `/sys`. Cada zona tem um `type`, uma temperatura atual e os limites de trip:

```terminal
$ for z in /sys/class/thermal/thermal_zone*; do echo "$z: $(cat $z/type) = $(cat $z/temp) m°C"; done
/sys/class/thermal/thermal_zone0: acpitz = 43000 m°C
/sys/class/thermal/thermal_zone1: x86_pkg_temp = 52000 m°C
```

Para facilitar a leitura — o valor vem em milésimos de grau Celsius (52000 = 52°C):

```terminal
$ cat /sys/class/thermal/thermal_zone1/temp
52000
$ cat /sys/class/thermal/thermal_zone1/type
x86_pkg_temp
```

A zona `acpitz` é o sensor "térmico do ACPI" (uma leitura reportada pela BIOS/placa), e `x86_pkg_temp` é a temperatura do pacote da CPU, o número que importa para jogos. Converta mentalmente dividindo por 1000 — ou deixe o `awk` fazer isso.

Os pontos de disparo ficam em `trip_point_*`:

```terminal
$ for t in /sys/class/thermal/thermal_zone1/trip_point_*_temp; do echo "$t: $(cat $t)"; done
/sys/class/thermal/thermal_zone1/trip_point_0_temp: 95000
/sys/class/thermal/thermal_zone1/trip_point_1_temp: 99000
/sys/class/thermal/thermal_zone1/trip_point_2_temp: 105000
```

Aqui a zona 1 passa a fazer algo (acelerar ventoinha, jogar clock) em 95°C, e o corte crítico acontece em 105°C. Esses valores são definidos pelo firmware do Deck e podem variar entre LCD e OLED.

:::dica
Um monitor contínuo de temperatura, atualizado a cada segundo, sem instalar nada:

```terminal
$ watch -n1 'cat /sys/class/thermal/thermal_zone1/temp | awk "{print \$1/1000 \" °C\"}"'
```
:::

## `sensors`: tudo num lugar só

O pacote `lm-sensors` (comando `sensors`) agrega leituras de temperatura, voltagem e rotação de ventoinha:

```terminal
$ sensors
amdgpu-pci-0400
Adapter: PCI adapter
vddgfx:        1.05 V  
vddnb:         0.95 V  
edge:         +52.0°C  
junction:     +68.0°C  
mem:          +54.0°C  
PPT:           18.00 W  (avg = 18.00 W)

BAT1-acpi-0
Adapter: ACPI interface
in0:           7.70 V  

nvme-pci-0200
Adapter: PCI adapter
Composite:    +34.0°C  
Sensor 1:     +34.0°C  
Sensor 2:     +38.0°C  

acpitz-acpi-0
Adapter: ACPI interface
temp1:        +43.0°C
```

O bloco `amdgpu-pci-0400` é o coração do diagnóstico: `edge` (borda do chip), `junction` (a temperatura crítica de junção) e `mem` (memória da GPU). O `PPT` (Package Power Tracking) é o consumo da APU em watts — útil para ver o TDP real em uso. Repare que `junction` (68°C aqui) é sempre a mais alta das três.

Se quiser ver só a ventoinha:

```terminal
$ sensors | grep -i fan
fan1:         3200 RPM
```

## A ventoinha, pelo lado do sistema

A ventoinha do Deck é controlada pelo firmware (e, em alguns casos, pelo `systemd` via hwmon). Você vê a rotação em RPM no bloco do hwmon:

```terminal
$ ls /sys/class/hwmon/
hwmon0  hwmon1  hwmon2  hwmon3  hwmon4
$ grep . /sys/class/hwmon/hwmon*/name
/sys/class/hwmon/hwmon0/name:amdgpu
/sys/class/hwmon/hwmon1/name:nvme
/sys/class/hwmon/hwmon2/name:acpitz
/sys/class/hwmon/hwmon3/name:BAT1
/sys/class/hwmon/hwmon4/name:jc42
$ cat /sys/class/hwmon/hwmon0/fan1_input
3200
```

`jc42` é um sensor externo de temperatura (chip de monitoramento). O `fan1_input` 3200 RPM é a rotação atual. Em idle, o Deck reduz a ventoinha a ~0 RPM (passivo) para economizar energia e silêncio; sob carga, sobe progressivamente até próximo de 6000-7000 RPM.

:::atencao
Ventoinha em 0 RPM em idle é **normal** no Deck — o controle é adaptativo. Só é motivo de preocupação se, com a temperatura de junção acima de 85°C, a ventoinha continuar parada. Isso indica falha de hardware (ou de firmware de controle), e aí o throttle vai cortar o desempenho para proteger o chip.
:::

## Distinguindo throttle de gargalo

Nem toda queda de FPS é thermal throttling. Para saber se o Deck está limitando o clock por temperatura, observe dois sinais juntos:

1. A temperatura de junção (`junction`) presa em ~95-100°C;
2. A frequência da CPU caindo abaixo do turbo mesmo com os núcleos em uso.

O segundo você vê com:

```terminal
$ watch -n1 'grep "cpu MHz" /proc/cpuinfo'
```

Se a temperatura está em 95°C e os MHz não sobem para 3500, é throttle térmico. Se a temperatura está em 70°C e os FPS caem mesmo assim, o gargalo é outro — provavelmente a GPU (8 CUs) que já atingiu o limite sem superaquecer.

:::perigo
Nunca tampe as saídas de ar do Deck com capas que cubram a grelha superior, e evite jogar apoiado em colchão ou cobertor. O ar precisa entrar e sair. Bloquear a ventilação transforma qualquer sessão longa em throttle permanente e desgasta o chip a longo prazo.
:::

## Resumo

- Thermal throttling é a redução automática de clock da APU para proteger o silício do calor excessivo.
- O calor sai por spreader → heat pipe → radiador → ventoinha; obstrução leva a throttle.
- Temperaturas ficam em `/sys/class/thermal/thermal_zone*/temp` (em milésimos de °C) e em `sensors`.
- `x86_pkg_temp` é a temperatura do pacote da CPU; `junction` (no `amdgpu`) é a mais crítica.
- Os pontos de trip (95°C, 105°C) estão em `trip_point_*_temp`.
- A ventoinha aparece em `sensors` e `/sys/class/hwmon/*/fan1_input`; 0 RPM em idle é normal.
- Throttle = alta temperatura + clock baixo sob carga; gargalo de GPU = temperatura baixa + FPS baixo.

## Exercícios

1. Rode `sensors` e identifique a leitura `junction` do bloco `amdgpu`. Anote também `PPT` e a temperatura do NVMe.
2. Leia `cat /sys/class/thermal/thermal_zone1/temp` e converta para °C. Compare com o valor do `sensors`.
3. Liste os trip points: `ls /sys/class/thermal/thermal_zone*/trip_point_*_temp` e leia os valores. Qual a diferença entre o primeiro e o último trip?
4. Abra um jogo exigente e monitore `junction` + `fan1_input` por alguns minutos. A ventoinha acelerou? A temperatura estabilizou em quanto?
5. **Desafio.** Com um jogo rodando, verifique se há throttle: monitore `grep 'cpu MHz' /proc/cpuinfo` e a temperatura de junção ao mesmo tempo. Se a temperatura travar em ~95°C e o clock cair, você confirmou throttle. Se não, explique qual é o gargalo real, baseando-se no conteúdo da seção sobre GPU.