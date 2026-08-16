Antes de decidir se a bateria do seu Steam Deck ainda presta, você precisa saber lê-la. No Linux — e o SteamOS é um Linux — a bateria não é uma caixa-preta: o kernel expõe cada leitura do circuito de gerenciamento de energia em arquivos virtuais em `/sys`, e ferramentas como o `upower` resumem tudo numa linha legível. Esta seção te dá o vocabulário básico e os primeiros comandos.

:::objetivos
- Localizar os arquivos de bateria em `/sys/class/power_supply`
- Ler carga, capacidade e estado com `upower`
- Interpretar os campos de `energy_full`, `energy_now` e `capacity`
- Identificar o dispositivo certo quando existe mais de uma fonte de energia
- Criar um atalho para vigiar a bateria sem GUI
:::

## Onde o kernel esconde a bateria

Toda fonte de energia que o kernel reconhece aparece num diretório dentro de `/sys/class/power_supply`. No Steam Deck, normalmente há dois: a bateria (`BAT1`) e o adaptador de energia (`AC` ou `ADP1`), já que o console pode estar ou não no carregador.

```terminal
$ ls /sys/class/power_supply/
BAT1  AC
```

Cada pasta expõe um punhado de arquivos de texto. Os mais importantes para a saúde da bateria são `energy_now`, `energy_full`, `energy_full_design`, `status` e `capacity`. São leituras instantâneas vindas do microcontrolador da bateria, não estimativas de algum software:

```terminal
$ cat /sys/class/power_supply/BAT1/energy_now
18543000
$ cat /sys/class/power_supply/BAT1/energy_full
36810000
$ cat /sys/class/power_supply/BAT1/energy_full_design
40000000
$ cat /sys/class/power_supply/BAT1/status
Discharging
```

Os valores vêm em micro-watt-hora (µWh). Dividindo por um milhão você chega aos watt-hora que o fabricante anuncia: os `40000000` de `energy_full_design` são 40 Wh, a capacidade nominal da bateria do Steam Deck OLED. Repare que `energy_full` já é menor que o projeto — é o sinal mais honesto de desgaste, e vamos voltar a ele na seção sobre ciclos.

## `upower`: tudo numa linha só

Ler meia dúzia de arquivos a cada consulta é cansativo. O `upower` (do UPower, o daemon de energia) faz o trabalho sujo por você:

```terminal
$ upower -i /org/freedesktop/UPower/devices/battery_BAT1
  native-path:          BAT1
  vendor:               Simplo
  model:                BAT1-XX
  serial:               1234
  power supply:         yes
  updated:              seg 05 mai 2025 20:14:31 -03 (18 segundos atrás)
  has history:          yes
  has statistics:       yes
  battery
    present:             yes
    rechargeable:        yes
    state:               discharging
    energy:              18,54 Wh
    energy-empty:        0 Wh
    energy-full:         36,81 Wh
    energy-full-design:  40,00 Wh
    energy-rate:         10,82 W
    voltage:             7,69 V
    charge-cycles:       187
    percentage:          50%
    capacity:            92,025%
    technology:          lithium-ion
    temperature:         31,2 degrees C
```

Quase tudo que interessa está aqui. O `energy` (18,54 Wh) dividido por `energy-full` (36,81 Wh) dá os 50% de `percentage`. O `capacity` de 92% é a saúde da bateria: a relação entre o que ela ainda aguenta e o que aguentava quando saiu da fábrica. Já os `charge-cycles` de 187 são a peça central da próxima seção.

:::dica
Para pular o caminho longo do device, use `upower -e` para listar todos os dispositivos de energia e depois filtre. O caminho da bateria é o que contém `battery`, mas o nome exato (`BAT1`, `BAT0`) varia conforme o modelo.
:::

## Lendo a taxa de consumo

O campo `energy-rate` (10,82 W) é a potência sendo drenada **neste instante**. Ele muda a cada segundo porque depende do que você está fazendo. Um jogo pesado pode puxar 20 W; num menu de sistema, o Deck cai para 5 W ou menos. Esse número é a chave para entender por que a autonomia varia tanto — e será o assunto de uma seção dedicada daqui a pouco.

Quando o carregador está plugado, o `status` vira `Charging` e `energy-rate` passa a ser positivo (a energia entra em vez de sair):

```terminal
$ upower -i /org/freedesktop/UPower/devices/battery_BAT1 | grep -E 'state|energy-rate|percentage'
    state:               charging
    energy-rate:         38,401 W
    percentage:          63%
```

Aqui o Deck está recebendo cerca de 38 W. Se ligar o aparelho num carregador fraco ou num hub USB sem energia suficiente, esse número cai e o `state` pode até virar `discharging` mesmo com o cabo conectado — sinal de que o fornecimento não acompanha o consumo.

:::atencao
Nem todo carregador USB-C entrega os 45 W que o Steam Deck pede. Um carregador de celular de 20 W mantém o aparelho ligado, mas carrega devagar e, sob carga de jogo pesado, pode não dar conta — aí a bateria descarrega mesmo no cabo. Confira `energy-rate` positivo e crescente para saber se o carregador está mandando energia de verdade.
:::

## Um atalho para não repetir tudo

Se você consulta a bateria com frequência, vale criar um pequeno script que imprima só o essencial em duas linhas. Salve em `~/bin/bat` e torne executável.

```bash
#!/bin/bash
DEV=$(upower -e | grep battery | head -1)
upower -i "$DEV" | grep -E 'state|percentage|capacity|energy-rate|charge-cycles|energy-full'
```

```terminal
$ chmod +x ~/bin/bat
$ ~/bin/bat
    state:               discharging
    percentage:          47%
    capacity:            92,025%
    energy-rate:         9,21 W
    charge-cycles:       187
    energy-full:         36,81 Wh
```

Com o script pronto e os campos decorados, você tem a régua com que vai medir ciclos, consumo e desgaste nas próximas seções. A leitura é o pré-requisito de tudo o que vem depois.

## Resumo

- A bateria aparece como um diretório em `/sys/class/power_supply/BAT1`, com campos como `energy_now` e `energy_full` em µWh.
- `upower -i` resume carga, saúde, temperatura e ciclos numa saída única e legível.
- `capacity` é a saúde percentual: energia atual cheia dividida pela energia de projeto.
- `energy-rate` é a potência instantânea; negativa/positiva indica descarga ou carga.
- `charge-cycles` conta quantos ciclos completos de carga a bateria já acumulou.

## Exercícios

1. Liste as fontes de energia com `ls /sys/class/power_supply` e leia `energy_now`, `energy_full` e `status` da sua bateria, convertendo µWh para Wh.
2. Rode `upower -e` e depois `upower -i` no dispositivo de bateria. Anote `percentage`, `capacity` e `charge-cycles`.
3. Compare `capacity` com o número de ciclos. Com base apenas nesses dois valores, a saúde da sua bateria é coerente com o uso que você dá ao aparelho?
4. Crie o script `~/bin/bat` do exemplo e use-o três vezes ao longo do dia (idle, jogo leve, jogo pesado), anotando como `energy-rate` muda.
5. **Desafio.** Plugue um carregador de celular de baixa potência e rode `bat` durante um jogo pesado. O `state` continua `charging`? Interprete o que acontece com `energy-rate` e explique por que o aparelho pode descarregar mesmo no cabo.
