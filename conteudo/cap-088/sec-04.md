A ventoinha do Steam Deck não gira em velocidade aleatória: um controlador embarcado (EC) decide, várias vezes por segundo, quanto de RPM o blower deve ter com base na temperatura atual. O mesmo controlador lê o PWM (modulação por largura de pulso) que regula a velocidade e o expõe via `steamdeck-hwmon`. Esta seção mostra como o controle funciona por dentro e como observar as decisões do sistema em tempo real, sem alterar nada ainda.

:::objetivos
- Entender o papel do controlador embarcado (EC) no controle da ventoinha
- Ler a rotação (RPM) e o duty cycle de PWM via `hwmon`
- Observar a rampa da ventoinha conforme a temperatura sobe
- Entender histerese e por que a ventoinha não reage instantaneamente
- Identificar os limites que disparam resposta da ventoinha
:::

## Quem manda na ventoinha

A ventoinha é controlada pelo **EC** (embedded controller), um microcontrolador de baixo consumo na placa-mãe que trabalha mesmo quando o sistema principal está parcialmente adormecido. O kernel se comunica com ele por um protocolo proprietário, e o driver `steamdeck-hwmon` traduz essa comunicação em arquivos legíveis em `sysfs`.

O controle usa **PWM** (Pulse Width Modulation): o sinal liga e desliga rapidamente a alimentação da ventoinha, e a fração de tempo ligado — o duty cycle — determina a velocidade média. Duty cycle de 100% significa tensão total e rotação máxima; 30% significa uma fração menor e menos ruído.

```terminal
$ ls /sys/class/hwmon/hwmon3/
name  fan1_input  fan1_target  temp1_input  pwm1
```

## Lendo RPM e alvo do PWM

Os arquivos relevantes do `steamdeck-hwmon` são `fan1_input` (rotação real atual, em RPM), `fan1_target` (rotação que o EC está perseguindo) e `pwm1` (o duty cycle em vigor, de 0 a 255 ou em percentual, conforme a implementação):

```terminal
$ cat /sys/class/hwmon/hwmon3/fan1_input
4820
$ cat /sys/class/hwmon/hwmon3/fan1_target
5000
$ cat /sys/class/hwmon/hwmon3/temp1_input
74000
```

Aqui a ventoinha gira a 4820 RPM, perseguindo um alvo de 5000 RPM, com a placa a 74 °C. A diferença pequena entre o valor real e o alvo é normal: o EC usa um PID (controle proporcional-integral-derivativo) que aproxima o real do alvo gradualmente, em vez de pular direto.

:::nota
A ventoinha do Deck gira entre cerca de 0 (parada, em idle frio) e aproximadamente 7000 RPM no modo Gaming sob carga máxima. Em alguns firmwares, o limite superior chega a mais de 7000 RPM no modo Desktop, por isso o barulho incomoda.
:::

## A curva de resposta e a histerese

A relação entre temperatura e RPM não é linear nem instantânea. O firmware carrega uma **curva** — uma tabela que mapeia faixas de temperatura para velocidades-alvo — e só altera a ventoinha quando a temperatura cruza certos limiares. Por isso a ventoinha não dispara no instante em que você abre um jogo: ela espera o die aquecer alguns graus além do limiar de entrada.

Este atraso deliberado é a **histerese**: o sistema evita a ventoinha ficar "bombando" (ligando e desligando toda vez que a temperatura oscila 1 °C na fronteira). Em troca, a temperatura flutua numa faixa, em vez de ficar pregada num número exato.

```terminal
$ watch -n 1 'cat /sys/class/hwmon/hwmon3/fan1_input /sys/class/hwmon/hwmon0/temp1_input'
```

O comando acima, rodando em um terminal durante uma partida, mostra a dança entre temperatura e RPM: a temperatura sobe além do limiar, o RPM sobe em resposta, a temperatura cai, e o RPM se mantém por mais alguns segundos antes de baixar — a histerese em ação.

## Observando a resposta a uma carga

Para ver a rampa completa, combine a leitura da ventoinha com uma carga controlada, como na seção 2:

```terminal
$ stress --cpu 8 --timeout 60s & 
$ while true; do printf "%s %s°C %sRPM\n" "$(date +%H:%M:%S)" \
   "$(( $(cat /sys/class/hwmon/hwmon0/temp1_input) / 1000 ))" \
   "$(cat /sys/class/hwmon/hwmon3/fan1_input)"; sleep 2; done
14:22:31 61°C 2100RPM
14:22:33 68°C 2400RPM
14:22:35 75°C 3400RPM
14:22:37 81°C 4700RPM
14:22:39 86°C 5600RPM
14:22:41 88°C 6400RPM
```

Repare no degrau: a ventoinha não acompanha proporcionalmente do início, ela salta entre patamares conforme a temperatura cruza os limiares da curva. O degrau mais alto (6400 RPM) aproxima-se do ponto em que o controle já está agindo para evitar o throttling.

:::dica
Se a ventoinha parecer "presa" em RPM alto mesmo com o APU frio, rode `systemctl status` do serviço responsável pelo controle (no SteamOS, o `steamos-hwmon`/gerenciador do modo Gaming). Uma reinicialização do modo Gaming costuma recalibrar a curva e soltar a ventoinha.
:::

## Resumo

- A ventoinha é governada pelo EC (controlador embarcado), exposto pelo driver `steamdeck-hwmon`.
- `fan1_input` (RPM), `fan1_target` (alvo) e `pwm1` (duty cycle) descrevem o estado do controle.
- O controle por PWM regula a velocidade variando a fração de tempo em que a ventoinha recebe tensão.
- A curva de ventoinha mapeia faixas de temperatura para RPM-alvo, com histerese para evitar oscilação.
- A ventoinha do Deck opera de ~0 RPM (frio) até mais de 7000 RPM sob carga máxima.

## Exercícios

1. Liste os arquivos do `steamdeck-hwmon` e identifique quais correspondem a fan, PWM e temperatura da placa.
2. Anote `fan1_input` em repouso por 2 minutos e confirme se a ventoinha chega a parar totalmente.
3. Durante uma partida, rode um loop que registre temperatura e RPM a cada 2 segundos. Identifique os degraus da curva.
4. Compare `fan1_input` com `fan1_target` sob carga. A diferença entre real e alvo é maior em subida ou descida?
5. **Desafio.** Explique, usando os conceitos de curva e histerese, por que a ventoinha demora a desligar depois que você fecha um jogo — e descreva o que aconteceria se a histerese fosse zero.