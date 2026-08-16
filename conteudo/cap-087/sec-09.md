Chegou a hora de fechar o ciclo: você leu, mediu, calibrou e economizou. O que falta é transformar tudo isso num procedimento repetível — um checklist que condensa o capítulo em passos, e um pequeno script que reúne os números-chave num relance só. É o seu "exame de bateria" de rotina.

:::objetivos
- Consolidar o diagnóstico da bateria num único painel
- Construir um script que resume saúde, ciclos e consumo
- Aplicar um checklist periódico de manutenção
- Tomar a decisão final (usar, ajustar ou trocar) com base em dados
- Registrar um histórico para acompanhar a tendência ao longo do tempo

:::

## Um painel de bateria num script

Em vez de espalhar consultas, faça um único script que imprima o essencial. Ele junta leitura (`upower`), saúde calculada e consumo instantâneo numa saída organizada:

```bash
#!/bin/bash
DEV=$(upower -e | grep battery | head -1)
INFO=$(upower -i "$DEV")

echo "=== Bateria do Steam Deck ==="
echo "$INFO" | grep -E 'state|percentage|capacity|energy-rate' | sed 's/^ *//'
echo "---"
echo "$INFO" | grep -E 'charge-cycles|energy-full:|energy-full-design:|temperature' | sed 's/^ *//'

FULL=$(cat /sys/class/power_supply/BAT1/energy_full)
NOW=$(cat /sys/class/power_supply/BAT1/energy_now)
PWR=$(cat /sys/class/power_supply/BAT1/power_now)
echo "---"
echo "wh_cheio: $((FULL/1000000)) Wh | wh_agora: $((NOW/1000000)) Wh | $((PWR/1000000)) W"
```

```terminal
$ ~/bin/bat-health
=== Bateria do Steam Deck ===
state:               discharging
percentage:          47%
capacity:            92,02%
energy-rate:         9,87 W
---
charge-cycles:       187
energy-full:         36,81 Wh
energy-full-design:  40,00 Wh
temperature:         31,2 degrees C
---
wh_cheio: 36 Wh | wh_agora: 17 Wh | 9 W
```

Salve como `~/bin/bat-health` e torne executável. É o ponto de partida de qualquer avaliação: em segundos você vê saúde, ciclos, temperatura e consumo.

:::dica
Use o `energy-rate` do painel para recalcular a autonomia na hora: divida `wh_cheio` (ou o restante) pela potência. Com o script aberto, você tem o diagnóstico **e** a previsão no mesmo terminal, sem mudar de ferramenta.
:::

## O checklist periódico

Avalie a bateria em três níveis de frequência. A rotina só funciona se for leve.

**Mensal (30 segundos):**
- rode `~/bin/bat-health` e anote `capacity`, `charge-cycles` e `temperature`;
- confira se o aparelho desliga de forma coerente com o percentual exibido.

**A cada 3–6 meses:**
- faça uma calibragem completa (carga → descarga até desligar → carga);
- meça a autonomia real de um jogo referência;
- compare o `capacity` atual com o do período anterior.

**Anual:**
- inspeção física (abaulamento, aquecimento localizado);
- revisão de hábitos (uso fixo, estacionamento em 100%, calor);
- decisão explícita: seguir, ajustar ou trocar.

A graça do checklist é a **tendência**, não a leitura isolada. Um `capacity` que cai 5% ao ano é normal; 5% ao mês é alerta.

## Mantendo um histórico

Para ver a tendência, guarde uma linha por medição num arquivo de log. Uma entrada simples com data e os três números serve:

```bash
echo "$(date -Iseconds) cap=$(...)" >> ~/bat-log.csv
```

Ou, integrando ao script, um formato de linha único fácil de plotar depois:

```terminal
$ cat ~/bat-log.csv
2025-03-01, 187, 92.0, 31
2025-06-01, 195, 90.4, 32
2025-09-01, 204, 88.1, 33
```

Com poucas linhas você percebe se o desgaste é linear e saudável ou se acelerou. O histórico é o que transforma um capítulo de leitura numa prática de manutenção contínua.

```terminal
$ tail -3 ~/bat-log.csv
2025-09-01, 204, 88.1, 33
2025-12-01, 212, 86.5, 30
2026-03-01, 221, 84.9, 34
```

Repare na tendência: ciclos sobem de forma constante e `capacity` cai devagar, sem degraus. É o retrato de uma bateria saudável envelhecendo no ritmo esperado — exatamente o que o acompanhamento revela.

## A decisão final em uma árvore

Tudo o que o capítulo ensinou converge para uma pergunta: o que fazer com a bateria agora? A resposta é uma árvore de decisão simples, alimentada pelos números que você já sabe coletar:

```text
Inchaço físico ou calor anormal?
  ├─ sim → PARAR e trocar/assistência (perigo)
  └─ não → desliga cedo?
       ├─ sim → calibrar (sec-05)
       │     ├─ resolveu? → era medição
       │     └─ persiste? → capacity coerente com ciclos?
       │          ├─ sim → fim de vida útil → trocar
       │          └─ não → investigar causa (calor, hábito)
       └─ não → atende seu uso?
             ├─ sim → seguir usando + checklist mensal
             └─ não → ajustar hábitos/limite de carga e reavaliar
```

A árvore ordena as conclusões das seções anteriores numa sequência acionável. Cada "sim" ou "não" remete ao critério (e à seção) que o justifica.

:::nota
A troca de bateria no Steam Deck é um procedimento que envolve abrir o aparelho, remover cola e barreira térmica e usar peças compatíveis com seu modelo (LCD vs OLED têm baterias diferentes). Se for trocar, faça com peça de reposição adequada e siga um guia específico da sua revisão — ou deixe para assistência autorizada.
:::

## Resumo

- Um script `bat-health` consolida saúde, ciclos, temperatura e consumo em um painel.
- Checklist mensal/trimestral/anual torna a avaliação uma rotina leve e repetível.
- Um log CSV acompanha a tendência de `capacity` e ciclos no tempo.
- A decisão final é uma árvore: perigo físico → calibrar → interpretar capacity → trocar ou ajustar.
- Troca exige peça compatível com o modelo (LCD/OLED) e cuidado com a abertura do aparelho.

## Exercícios

1. Escreva e execute o script `~/bin/bat-health` e confira se todos os campos aparecem corretamente no seu aparelho.
2. Crie o arquivo `~/bat-log.csv` com a primeira linha (data, ciclos, capacity, temperatura) e defina um lembrete para a próxima medição.
3. Rode o checklist mensal completo e registre o resultado. Há algum sinal de alerta?
4. Use a árvore de decisão para emitir seu veredito atual e escreva uma frase justificando com seus números.
5. **Desafio.** Integre tudo: faça o script gravar automaticamente a linha no `bat-log.csv` a cada execução e imprimir, além do painel, a variação do `capacity` desde a primeira medição registrada. Rode duas vezes com intervalo e mostre a tendência.
