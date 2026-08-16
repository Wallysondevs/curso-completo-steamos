A maior preocupação de quem usa o Deck longe da tomada não é o consumo durante o jogo — é o consumo enquanto o aparelho está "dormindo". Você fecha a tela achando que está em pausa, mas a bateria continua sendo drenada para manter a RAM viva. A pergunta que todo mundo faz é: quanto exatamente? E a resposta depende de variáveis que você pode medir, ajustar e, em certa medida, controlar.

:::objetivos
- Medir o consumo real da bateria em suspensão no Deck
- Entender o que drena bateria além da RAM durante S3
- Ajustar fontes de wakeup para reduzir consumo residual
- Estimar a autonomia em suspensão com base nos dados de energia
:::

## A verdade sobre o consumo em S3

O Steam Deck tem uma bateria de aproximadamente 40 Wh (watt-hora). Com um consumo típico em S3 profundo variando entre 0,3 W e 0,8 W, uma conta rápida: 40 Wh ÷ 0,5 W = 80 horas de suspensão contínua, ou cerca de 3 dias. Na prática, a maioria dos usuários reporta algo entre 5% e 10% de dreno por dia, o que bate com as contas — 5% de 40 Wh = 2 Wh, ÷ 24 h = 0,083 W médio.

Mas esses números são de laboratório. Wi-Fi ligado, Bluetooth ativo, periféricos USB conectados ou um jogo que não foi pausado corretamente empurram o consumo para 1 W ou mais. Isso corta a autonomia em suspensão pela metade.

```terminal
$ cat /sys/class/power_supply/BAT1/uevent
POWER_SUPPLY_NAME=BAT1
POWER_SUPPLY_TYPE=Battery
POWER_SUPPLY_STATUS=Discharging
POWER_SUPPLY_CHARGE_FULL_DESIGN=5313000
POWER_SUPPLY_CHARGE_FULL=5120000
POWER_SUPPLY_CHARGE_NOW=4890000
POWER_SUPPLY_VOLTAGE_NOW=7600000
POWER_SUPPLY_CURRENT_NOW=78000
POWER_SUPPLY_CAPACITY=95
```

Nesse instantâneo, o Deck está descarregando a 78 mA com 7,6 V, o que dá 0,59 W. Com a tela desligada e o sistema em S3, esse valor cairia drasticamente. Para medir o consumo real em suspensão, você precisa registrar `CHARGE_NOW` antes de suspender e depois de algumas horas, calculando a diferença.

:::dica
Monte um experimento simples: anote `cat /sys/class/power_supply/BAT1/charge_now`, suspenda por exatamente 4 horas, acorde e leia novamente. A diferença em µAh (microampère-hora), multiplicada pela voltagem nominal de ~7,7 V, dá o consumo em watt-hora. Divida por 4 para obter a potência média em watts.
:::

## O que drena bateria durante a suspensão

A RAM em self-refresh é o consumidor inevitável: módulos LPDDR5 como os do Deck consomem entre 0,1 W e 0,3 W nesse modo. Mas há outros suspeitos:

**Controlador USB.** Mesmo em S3, algumas portas USB mantêm alimentação (é o chamado *USB charging in sleep*). Se você deixa um pendrive, um hub USB-C ou um adaptador de rede conectado, esses dispositivos podem continuar consumindo energia, e pior: podem impedir que o controlador USB entre no estado de baixo consumo.

**Wi-Fi e Bluetooth.** A menos que o driver explicitamente desligue o rádio, o chip pode permanecer em modo de escuta passiva, consumindo 0,1 W a 0,3 W. É o suficiente para receber notificações e pacotes de manutenção da rede — mas também para drenar bateria.

**LEDs e circuitos auxiliares.** O LED de status do Deck, o controlador de brilho da tela e o circuito de áudio podem não desligar completamente se o firmware não estiver configurado para isso.

```terminal
$ cat /sys/class/power_supply/BAT1/power_now
590000
```

Aqui o consumo instantâneo é 590.000 µW = 0,59 W com o Deck acordado e ocioso. Em S3 profundo, esse valor é reportado como zero porque o circuito de medição também dorme — mas o dreno é real e precisa ser medido indiretamente ao longo do tempo.

## Reduzindo o consumo ao mínimo

Se você quer maximizar a autonomia em suspensão — por exemplo, para deixar o Deck na mochila por um fim de semana inteiro —, algumas ações têm impacto mensurável:

- **Desconecte periféricos USB.** Qualquer coisa conectada à porta USB-C pode manter o controlador ativo.
- **Desligue Wi-Fi e Bluetooth antes de suspender.** No modo de jogo, o menu rápido (botão `[[...]]`) oferece a opção de alternar o modo avião.
- **Feche o jogo se não for retomar em minutos.** Um jogo congelado ocupa RAM, mas não aumenta o consumo da RAM em self-refresh. O problema é outro: se o jogo deixou a GPU em um estado de performance alto antes do freeze, o driver pode não conseguir reduzir clocks de memória de vídeo, e você paga por isso.

```terminal
$ rfkill list
0: hci0: Bluetooth
        Soft blocked: no
        Hard blocked: no
1: phy0: Wireless LAN
        Soft blocked: no
        Hard blocked: no
$ rfkill block wlan
$ rfkill block bluetooth
$ rfkill list
0: hci0: Bluetooth
        Soft blocked: yes
        Hard blocked: no
1: phy0: Wireless LAN
        Soft blocked: yes
        Hard blocked: no
```

Bloquear Wi-Fi e Bluetooth via `rfkill` antes de suspender garante que os rádios não tentarão manter conexões durante S3. O `soft blocked` significa que o kernel bloqueou, mas o hardware ainda pode ser religado por software; `hard blocked` (via switch físico) é mais raro no Deck moderno.

:::atencao
Desligar o Wi-Fi antes de suspender interrompe downloads em andamento. A seção sobre downloads detalha como o Steam lida com isso. Se você depende de downloads noturnos, manter o Wi-Fi ligado e o Deck na tomada é a abordagem correta.
:::

## Estimando a autonomia real

Com os números que você coletou do seu próprio Deck — dreno em % por hora de suspensão —, monte uma tabela mental:

| Dreno por hora | Autonomia em S3 (bateria 100%) |
|---|---|
| 0,25 % | ~400 horas (16 dias) |
| 0,5 % | ~200 horas (8 dias) |
| 1 % | ~100 horas (4 dias) |
| 2 % | ~50 horas (2 dias) |

A maioria dos Decks em condições normais (sem periféricos, com Wi-Fi desligado) fica na faixa de 0,3 % a 0,7 % por hora — o suficiente para uma semana longe da tomada com uso intermitente. Se os seus números forem muito piores, vale investigar com as ferramentas desta seção.

## Resumo

- O consumo típico em S3 no Deck é de 0,3 W a 0,8 W; com bateria de 40 Wh, a autonomia teórica é de 50 a 130 horas.
- `charge_now`, `current_now` e `voltage_now` em `/sys/class/power_supply/BAT1/` permitem medir o consumo indiretamente.
- USB, Wi-Fi e Bluetooth são os principais drenadores além da RAM em self-refresh.
- `rfkill block wlan` e `rfkill block bluetooth` desligam os rádios antes da suspensão.
- Medir a queda de carga ao longo de horas de suspensão é mais confiável que confiar no valor instantâneo de `power_now`.

## Exercícios

1. Anote `charge_now` antes de uma suspensão de 2 horas e depois. Calcule a potência média em watts durante S3.
2. Liste os dispositivos de rádio com `rfkill list` e bloqueie Wi-Fi e Bluetooth. Suspenda por 1 hora e compare o dreno com o teste anterior.
3. Inspecione `/sys/class/power_supply/BAT1/uevent` e explique o que significam `CHARGE_FULL_DESIGN`, `CHARGE_FULL` e `CHARGE_NOW`.
4. Repita o teste de dreno em suspensão com um hub USB-C conectado (sem alimentação externa). A diferença é significativa?
5. **Desafio.** Escreva um script que registre `charge_now` e a hora atual, suspenda o sistema por um período determinado e, ao acordar, calcule e imprima o dreno percentual por hora. Use `rtcwake` (consulte `man rtcwake`) para automatizar a suspensão com despertar programado.