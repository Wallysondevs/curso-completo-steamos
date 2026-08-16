O número que aparece no canto da tela — "restam 2h13" — é uma previsão, não uma verdade. Saber como essa previsão é calculada te livra de duas frustrações: a de confiar demais nela e a de achar que a bateria "está mentindo" quando o valor pula. Esta seção mostra o que há por trás da estimativa e como fazer a sua, melhor do que a do sistema.

:::objetivos
- Entender como o sistema estima o tempo restante
- Ler o tempo de vida estimado do firmware via `upower`
- Calcular autonomia a partir de energia e potência medidos
- Explicar por que a estimativa oscila e quando ela erra
- Usar um histórico curto para suavizar a previsão

:::

## A previsão de fábrica

O firmware da bateria e o `upower` fornecem suas próprias estimativas de tempo restante. O `upower` expõe uma tabela de histórico (as últimas taxas e tempos) e um campo de tempo até vazio/cheio:

```terminal
$ upower -i /org/freedesktop/UPower/devices/battery_BAT1 | grep -E 'time to|energy-rate'
    energy-rate:         9,87 W
    time to empty:       3,7 hours
    time to full:        1,2 hours
```

O `time to empty` (3,7 horas) é `energy` restante dividido pela taxa média recente. Ele não lê o futuro: usa a **última taxa conhecida** e assume que ela se mantém. É por isso que, no instante em que você abre um jogo pesado, o número que dizia "4 horas" despenca para "1h30" em segundos. A previsão é uma extrapolação do presente, não uma promessa.

:::nota
O histórico que alimenta essa estimativa vive no próprio daemon. `upower -i` mostra `has history: yes` e, com a opção certa, expõe as taxas recentes. O kernel, por sua vez, só fornece o instantâneo. A "inteligência" da previsão está na média que o UPower faz sobre a taxa, não em nenhuma medição futura.
:::

## A conta que você já sabe fazer

Você já tem as duas peças: energia disponível e potência consumida. A autonomia é a divisão, e a novidade é só transformar horas decimais em horas e minutos.

```terminal
$ python3 -c "
energy_free = 36.81 - 18.54   # Wh disponíveis
rate = 9.87                    # W medidos
h = energy_free / rate
print(f'{int(h)}h {int((h - int(h)) * 60):02d}min')
"
1h 51min
```

Aqui, com 18,54 Wh já consumidos de uma bateria de 36,81 Wh, restam 18,27 Wh. A 9,87 W, isso dá 1h51. Como o consumo não é constante, esse número é um **teto otimista** se a taxa atual for baixa, e uma **subestimativa** se for alta. A utilidade está em recalcular a cada cenário, não em confiar num único valor.

## Por que a estimativa oscila

Três motivos explicam os solavancos no tempo restante:

1. **A taxa muda o tempo todo.** GPU renderiza mais frames num corte, o Wi-Fi sincroniza, o ventilador acelera. A cada mudança, a divisão muda.
2. **A média usa uma janela curta.** O sistema não olha o consumo da última hora inteira; usa os últimos segundos ou minutos. Um pico breve contamina a previsão.
3. **`energy_full` é arredondado.** O próprio valor da capacidade cheia oscila entre leituras, como visto na seção de ciclos, o que adiciona ruído na base da conta.

```terminal
Every 5,0s: awk '{printf "%.0f%% -> %.2f W\n", $1/1000000/32.05*100, $1/1000000}' /sys/class/power_supply/BAT1/energy_now

47% -> 11,40 W
47% -> 18,72 W
46% ->  9,31 W
```

Repare que o percentual mal se move enquanto a potência pula de 9 a 18 W. O tempo restante, que depende da potência, é quem sofre o tranco — por isso a bateria "parece imprevisível" quando na verdade é o consumo que é.

## Suavizando com um histórico curto

Se você quer uma previsão mais estável que a do sistema, tire a média da potência ao longo de alguns minutos. Um script simples em `python` amostra a taxa N vezes, numa janela, e divide a energia restante pela média:

```python
import time, glob

def read(p):
    with open(p) as f:
        return int(f.read().strip())

bat = glob.glob("/sys/class/power_supply/BAT1")[0]
samples = []
for _ in range(30):
    samples.append(read(bat + "/power_now"))
    time.sleep(2)

avg = sum(samples) / len(samples)
energy_now = read(bat + "/energy_now")
h = energy_now / avg
print(f"taxa média: {avg/1e6:.2f} W")
print(f"autonomia estimada: {int(h)}h {int((h-int(h))*60):02d}min")
```

```terminal
$ python3 estima.py
taxa média: 10,91 W
autonomia estimada: 1h 42min
```

A média sobre 60 segundos absorve os picos curtos e entrega um número mais útil que a leitura crua. A mesma técnica serve ao contrário: medindo a potência média de um jogo inteiro, você descobre a autonomia **real** naquele título, que é o dado que importa para planejar uma viagem.

:::dica
Para medir a autonomia real de um título, carregue até 100%, anote `energy_now` inicial, jogue 30 minutos e anote de novo. A energia consumida dividida pelo tempo dá a potência média real; a energia cheia dividida por essa potência dá a autonomia honesta daquele jogo. É a forma mais confiável de decidir o que cabe numa viagem longe da tomada.
:::

## Resumo

- `time to empty`/`time to full` do `upower` extrapolam a taxa recente, não leem o futuro.
- Autonomia = energia disponível ÷ potência; a conversão para horas/minutos é simples.
- A estimativa oscila porque a potência flutua e a janela de média é curta.
- `energy_full` oscilante adiciona ruído à base do cálculo.
- Média de potência sobre um minuto suaviza a previsão; medir um jogo inteiro dá a autonomia real.

## Exercícios

1. Rode `upower -i` e anote `time to empty` e `energy-rate`. Recalcule a autonomia manualmente; os valores batem?
2. Observe durante 10 minutos num jogo como `time to empty` pulou. Colete 5 leituras e explique a causa do pulo.
3. Escreva um script que amostre `power_now` 30 vezes (2 s de intervalo) e imprima a taxa média e a autonomia estimada.
4. Meça a autonomia real de um jogo: carregue a 100%, jogue 30 min cronometrados e calcule a potência média e a autonomia real daquele título.
5. **Desafio.** Compare a autonomia real (exercício 4) com a previsão que o `upower` dava no início da sessão. O erro foi para mais ou para menos? Proponha — e implemente — uma melhoria na estimativa que reduza esse erro, explicando a premissa por trás dela.
