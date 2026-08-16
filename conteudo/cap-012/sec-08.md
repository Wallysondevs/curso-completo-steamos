TDP e temperatura são dois lados da mesma moeda: você limita o TDP para controlar a temperatura, e a temperatura força o TDP para baixo quando o sistema esquenta demais. No meio do caminho está a ventoinha — o único componente mecânico ativo do Deck e o principal responsável pelo ruído que você ouve enquanto joga. Ajustar sua curva é o último passo do controle de energia.

:::objetivos
- Entender como a ventoinha do Deck é controlada pelo firmware e pelo kernel
- Ler a rotação atual via `sensors` e `/sys/class/hwmon`
- Conhecer as limitações de alterar a curva de ventoinha no SteamOS
- Saber onde está o firmware de controle e por que ele é travado
:::

## Como a ventoinha decide girar

O controle da ventoinha no Steam Deck segue uma hierarquia: o **firmware embarcado** (o controlador embutido, ou EC) lê sensores de temperatura e decide a rotação, independentemente do sistema operacional. O kernel do Linux pode **ler** a rotação e, em teoria, **escrever** um valor de PWM, mas o EC pode ignorar essa escrita se o firmware julgar que a temperatura está perigosamente alta.

Isso é diferente de um PC montado, onde a placa-mãe entrega o controle total das ventoinhas ao sistema operacional via PWM. No Deck, a Valve optou por um firmware conservador: a ventoinha **sempre** gira o suficiente para manter a APU abaixo do `Tjmax`, e o máximo que o usuário consegue é sugerir um comportamento mais ou menos agressivo via software.

A rotação atual pode ser lida de duas formas:

```terminal
$ sensors | grep fan
fan1:        3214 RPM

$ cat /sys/class/hwmon/hwmon3/fan1_input
3214
```

O valor está em RPM (rotações por minuto). Em modo ocioso, a ventoinha do Deck gira entre 2000 e 3000 RPM — praticamente inaudível. Em carga máxima, pode ultrapassar 6000 RPM, onde o ruído se torna perceptível mas ainda controlado. Acima de 7000 RPM, o ruído é alto e indica que a temperatura está perto do limite.

## Por que não há curva "configurável" no SteamOS

No Windows, ferramentas como MSI Afterburner e FanControl permitem desenhar curvas de ventoinha com precisão. No Linux, o `sensors-detect` e o módulo `pwmconfig` fazem algo similar para PCs. No Steam Deck, essas ferramentas **não funcionam como esperado** porque:

1. O controlador embarcado (EC) tem a palavra final, não o kernel.
2. A Valve não expôs uma interface de firmware para reprogramar a curva.
3. O driver `amdgpu` gerencia a ventoinha da GPU integrada, e ele delega ao EC.

O caminho `/sys/class/hwmon/hwmonX/pwm1` existe e aceita escritas manuais, mas o efeito é transitório e limitado:

```terminal
$ echo 128 | sudo tee /sys/class/hwmon/hwmon3/pwm1
128
$ cat /sys/class/hwmon/hwmon3/pwm1
128
```

O valor vai de 0 (ventoinha parada) a 255 (ventoinha no máximo). `128` representa ~50% do ciclo de trabalho. Contudo, o EC pode sobrescrever essa escolha em segundos, especialmente se a temperatura subir. É uma "sugestão", não uma ordem — e o firmware é livre para ignorá-la.

:::perigo
Nunca escreva `0` em `pwm1` durante um jogo pesado. Se o EC não intervir a tempo, a APU pode atingir o `Tjmax` de 95 °C e desligar por proteção térmica — e desligamentos térmicos repetidos degradam o silício. A ventoinha é sua aliada, não sua inimiga.
:::

## O que você pode e não pode fazer

Você **pode**:
- Ler a rotação atual com `sensors` ou `/sys/class/hwmon`.
- Monitorar a correlação entre temperatura e RPM para entender o comportamento padrão.
- Usar o menu rápido para alternar entre o perfil de ventoinha original e um perfil "atualizado" que a Valve lançou, que é mais agressivo em temperaturas baixas.

Você **não pode** sem risco:
- Reprogramar a curva de ventoinha permanentemente.
- Desligar a ventoinha durante o jogo.
- Forçar RPMs que o firmware considera inseguras.

:::info
O perfil de ventoinha "atualizado" da Valve foi lançado em 2022 como resposta a reclamações de ruído. Ele mantém a ventoinha em RPM mais baixa até a APU atingir ~60 °C, depois acelera mais rápido. A troca entre os perfis fica em Configurações → Sistema → Ventoinha, no Modo Jogo.
:::

## Temperatura ambiente e a ventoinha

Um fator que nenhum software controla é a temperatura do ar que entra no Deck. A ventoinha puxa ar da traseira e sopra sobre o dissipador. Se o ar ambiente estiver a 35 °C (um dia quente de verão, ou jogando no sol), a ventoinha precisa girar muito mais rápido para remover o mesmo calor do que num ambiente a 20 °C.

Isso explica por que o Deck parece "mais barulhento" em dias quentes: a ventoinha não está com defeito — ela está compensando a temperatura ambiente. Não há ajuste de software que resolva física: 40 Wh de calor precisam sair do chassi de qualquer jeito. Se você está no calor, aumentar o TDP tem penalidade dupla: mais calor gerado e menos eficiência na dissipação.

```terminal
$ uptime
 15:42:13 up  2:34,  1 user,  load average: 0.81, 0.64, 0.58
```

O `uptime` não mostra temperatura, mas mostra há quanto tempo o Deck está ligado. Se você está jogando há duas horas num dia quente, o sistema inteiro já aqueceu — chassi, bateria, tela — e a ventoinha está trabalhando contra um gradiente térmico pior do que no primeiro minuto. É por isso que benchmarks de 15 minutos podem enganar: o comportamento térmico do minuto 45 é diferente do minuto 5.

## Resumo

- A ventoinha do Deck é controlada pelo firmware embarcado (EC), não diretamente pelo kernel.
- `sensors` e `/sys/class/hwmon/hwmonX/fan1_input` informam a RPM atual.
- O pwm (`pwm1`) aceita escritas manuais, mas o EC pode ignorá-las por segurança.
- O perfil "atualizado" da Valve é a única opção segura para mudar o comportamento da ventoinha.
- Temperatura ambiente afeta drasticamente a eficiência do arrefecimento e o ruído percebido.

## Exercícios

1. Rode `sensors | grep fan` com o Deck ocioso e depois sob `stress --cpu 8`. Qual o RPM máximo atingido?
2. Leia `/sys/class/hwmon/hwmon*/fan1_input` e identifique qual `hwmon` corresponde ao sensor da ventoinha. Anote o caminho exato.
3. Escreva um valor de PWM com `echo N | sudo tee /sys/class/hwmon/hwmon3/pwm1` e observe por 30 segundos. O valor se manteve ou o EC o sobrescreveu?
4. Alterne entre os dois perfis de ventoinha no Modo Jogo e, com um jogo pesado, compare o RPM médio após 5 minutos em cada perfil.
5. **Desafio.** Crie um loop em bash que registre RPM, temperatura (`thermal_zone0/temp`) e timestamp a cada 5 segundos por 10 minutos de jogo. Plote os dados (mesmo que mentalmente) e identifique em que temperatura a ventoinha começa a acelerar significativamente.