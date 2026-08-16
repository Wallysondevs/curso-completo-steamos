A bateria do Steam Deck tem 40 Wh (watt-hora) de capacidade. Isso significa que, se o sistema consumir 40 W constantes, a bateria dura exatamente uma hora. Na prática, o Deck consome entre 7 W e 25 W no total, dependendo do jogo, do brilho da tela e — crucialmente — do TDP. Esta seção conecta os watts que você configurou às horas que você ganha ou perde.

:::objetivos
- Calcular autonomia a partir da capacidade da bateria e do consumo medido
- Entender o consumo total do Deck (APU + tela + outros componentes)
- Usar `/sys/class/power_supply/` e `upower` para ler a bateria
- Saber como o TDP, o brilho e o Wi-Fi afetam o tempo de jogo
:::

## De watts a horas

A conta é direta: autonomia (horas) = capacidade da bateria (Wh) ÷ consumo total do sistema (W). Com 40 Wh de bateria:

| Consumo total | Autonomia teórica | Cenário típico |
|---|---|---|
| 25 W | 1,6 h | Jogo AAA com TDP máximo, brilho alto, Wi-Fi ligado |
| 18 W | 2,2 h | Jogo AAA com TDP reduzido (10 W), brilho médio |
| 12 W | 3,3 h | Jogo indie 3D, TDP 6 W, brilho baixo |
| 7 W | 5,7 h | Emulador de SNES, TDP 3 W, modo avião |

O consumo total não é só o TDP da APU. A tela de 7 polegadas (LCD ou OLED) consome entre 2 W e 4 W, dependendo do brilho. O Wi-Fi, o SSD NVMe e o controlador de áudio somam mais 1 a 2 W. Por isso, reduzir o TDP de 15 W para 10 W economiza 5 W da APU, mas o sistema total cai de ~22 W para ~17 W — uma redução de cerca de 23%, que se traduz diretamente em 23% a mais de tempo de jogo.

## Lendo a bateria pelo sistema

O subsistema de energia expõe o estado da bateria em dois lugares: `/sys/class/power_supply/BAT1/` (ou `BAT0`, dependendo da revisão) para leitura direta do kernel, e `upower` para uma visão mais amigável.

```terminal
$ upower -i /org/freedesktop/UPower/devices/battery_BAT1
  native-path:          BAT1
  vendor:               BYD
  model:                DELL 4K8YF12
  serial:               12345
  power supply:         yes
  updated:              seg 08 jan 2025 14:32:17 -03 (33 seconds ago)
  has history:          yes
  has statistics:       yes
  battery
    present:             yes
    rechargeable:        yes
    state:               discharging
    warning-level:       none
    energy:              31.45 Wh
    energy-empty:        0.00 Wh
    energy-full:         38.12 Wh
    energy-full-design:  40.04 Wh
    energy-rate:         18.34 W
    voltage:             7.678 V
    time to empty:       1.7 hours
    percentage:          82%
    capacity:            95.2%
    technology:          lithium-ion
```

Os campos mais informativos: `energy` (carga restante em Wh), `energy-full` (carga máxima atual — degrada com o tempo), `energy-full-design` (capacidade original de fábrica) e `energy-rate` (consumo instantâneo em watts). `time to empty` é uma estimativa calculada dividindo `energy` por `energy-rate`, e o `capacity` mostra o percentual de desgaste: 95,2% significa que a bateria perdeu 4,8% da capacidade original.

:::nota
O `energy-full-design` do Deck é 40,04 Wh. Se o seu `capacity` está abaixo de 90%, a bateria já perdeu autonomia perceptível. Isso é normal após centenas de ciclos — baterias de íon de lítio se degradam. Nenhum ajuste de TDP reverte esse desgaste, mas limitar o consumo ajuda a extrair o máximo do que sobrou.
:::

O mesmo dado, cru e direto do kernel, fica em:

```terminal
$ cat /sys/class/power_supply/BAT1/energy_now
31450000
$ cat /sys/class/power_supply/BAT1/energy_full_design
40040000
$ cat /sys/class/power_supply/BAT1/power_now
18340000
```

Os valores estão em **micro-watt-hora** (energia) e **micro-watt** (potência). Divida por 1.000.000 para obter Wh e W. Essa é a fonte que `upower` consulta, e você pode usar em scripts para monitoramento sem dependências extras.

Para monitorar o consumo em tempo real enquanto mexe no TDP, um `watch` simples mostra a potência instantânea atualizando a cada dois segundos:

```terminal
$ watch -n 2 'echo "Consumo: $(cat /sys/class/power_supply/BAT1/power_now | awk "{print \$1/1000000}") W"'
Every 2.0s: echo "Consumo: $(cat /sys/class/power_supply/BAT1/power_now | awk "{print \$1/1000000}") W"

Consumo: 18.34 W
```

Deixe esse terminal aberto enquanto ajusta o TDP no outro. A queda no número é instantânea e confirma que o `ryzenadj` foi aplicado — sem precisar reexecutar `ryzenadj --info`.

## Quanto cada watt a menos entrega

A matemática inversa também é útil: quantos minutos de jogo você ganha por watt economizado? Com 40 Wh de bateria e um consumo base de 20 W, a autonomia é de 2 horas. Reduzir 1 W (para 19 W) eleva para 2,10 horas — um ganho de 6 minutos. Reduzir 5 W (para 15 W) eleva para 2,67 horas — 40 minutos extras.

O ganho marginal de cada watt economizado **cresce** à medida que o consumo total diminui, porque a divisão `40 ÷ consumo` é uma hipérbole. De 25 W para 15 W você ganha 64 minutos. De 10 W para 5 W você ganha 240 minutos. Por isso o TDP baixo é tão poderoso em jogos leves: o jogo já é leve, e baixar o TDP só aumenta a folga da bateria.

## O fantasma do consumo "fantasma"

Mesmo com o TDP no mínimo (3 W) e o jogo pausado, o Deck consome entre 5 W e 7 W. Esse piso de consumo vem de componentes que o TDP não controla: a tela (maior vilão), o Wi-Fi, o áudio, o SSD ocioso e a própria placa-mãe. Para maximizar bateria em viagens longas, o TDP é só metade da história. As outras alavancas:

- **Brilho da tela:** reduza para 30–50% em ambientes internos. Economia de 1 a 2 W.
- **Modo avião:** desative Wi-Fi e Bluetooth se o jogo for offline. Economia de 0,5 a 1 W.
- **Limite de FPS:** 30 FPS em vez de 60 FPS reduz a carga da GPU e, portanto, o consumo. Às vezes economiza mais watts que mexer no TDP.
- **Perfil de energia da Steam:** o menu rápido tem perfis predefinidos que combinam TDP, FPS e clock da GPU.

:::dica
A combinação mais econômica para voos longos: TDP 6 W, limite de 30 FPS, brilho 30%, modo avião. Nessa configuração, muitos jogos indie rodam por mais de 5 horas — e o Deck mal esquenta.
:::

## Resumo

- A bateria do Deck tem 40 Wh; autonomia = 40 ÷ consumo total do sistema.
- Consumo total = TDP da APU + ~4 W (tela, Wi-Fi, SSD, controladores).
- `upower -i` e `/sys/class/power_supply/BAT1/` mostram carga, consumo e desgaste da bateria.
- Cada watt economizado rende mais minutos quando o consumo total já é baixo (hipérbole).
- Brilho, Wi-Fi e limite de FPS complementam o TDP na economia de bateria.

## Exercícios

1. Rode `upower -i` e anote `energy-rate` e `time to empty` com o Deck desplugado e um jogo rodando. Qual o consumo total medido?
2. Com o mesmo jogo e mesma cena, reduza o TDP de 15 W para 10 W e anote o novo `energy-rate`. Calcule o ganho de autonomia em minutos.
3. Leia `/sys/class/power_supply/BAT1/energy_full` e `/sys/class/power_supply/BAT1/energy_full_design`. Qual o percentual de desgaste da sua bateria?
4. Teste o jogo mais leve que você tem instalado com TDP 3 W e brilho mínimo. O consumo total (`energy-rate`) chega a quantos watts?
5. **Desafio.** Crie um script bash que leia `power_now` a cada 30 segundos por 10 minutos de jogo, calcule a média e estime a autonomia. Execute-o com dois TDPs diferentes e compare a estimativa do script com o `time to empty` do `upower`.