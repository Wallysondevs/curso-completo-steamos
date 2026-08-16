Antes de trocar qualquer peça do Steam Deck — tela, ventoinha, SSD, analógicos — você **precisa** desconectar a bateria. Pular essa etapa não é um atalho; é um convite ao desastre. Um toque acidental da chave de fenda nos contatos errados pode provocar curto-circuito, queimar componentes da placa-mãe ou, no pior cenário, iniciar um foco de incêndio. Além disso, o Steam Deck pode ligar sozinho com o simples movimento de uma peça ou com o toque no touchpad, reiniciando enquanto você está com as mãos dentro do console. Esta seção ensina o procedimento completo: drenar a carga, identificar os dois conectores da bateria, removê-los na ordem correta e isolar tudo com segurança.

:::objetivos
- Verificar e drenar a carga da bateria para abaixo de 25% antes da desmontagem
- Identificar o conector de alimentação multi-cabos e o flat de dados BMS
- Executar a desconexão na ordem correta: primeiro o flat de dados, depois o de alimentação
- Isolar o conector solto com fita ou barreira não condutiva
- Compreender os riscos de curto-circuito e as medidas de mitigação
:::

## 3.1 Por que a ordem importa

A bateria do Steam Deck possui dois conectores independentes que chegam à placa-mãe. O **conector de alimentação** (multi-cabos, geralmente 4 a 6 fios) transporta a energia principal — é por ele que a bateria entrega tensão de operação ao sistema. O **flat de dados BMS** (Battery Management System) é uma fita flexível mais fina, responsável por comunicação digital entre o microcontrolador da bateria e a EC (*Embedded Controller*) da placa. Ele informa nível de carga, temperatura, ciclos e status de saúde.

Se você desconectar primeiro o cabo de alimentação com o sistema energizado ou com carga residual significativa, o BMS ainda estará ativo e poderá interpretar a perda súbita de carga como falha, travando registradores internos ou até bloqueando a bateria como medida de proteção. Já desligar primeiro o flat de dados faz o BMS entrar em estado de *shipping mode* (modo de transporte), cortando a comunicação antes da remoção física da alimentação. Por isso a ordem é irrevogável: **flat de dados → conector de alimentação**.

:::perigo
**Risco de curto-circuito e incêndio.** O conector de alimentação da bateria do Steam Deck carrega tensão suficiente para gerar faíscas se os pinos forem curto-circuitados por uma ferramenta metálica. Segundo o guia iFixit, essa é uma das etapas mais críticas de qualquer reparo do console. Jamais trabalhe com a bateria conectada. Se o conector puxado entrar em contato com trilhas da placa, você pode perder o Steam Deck instantaneamente.
:::

## 3.2 Verificando o nível de carga pelo SteamOS

Antes de abrir o console, você deve garantir que a bateria esteja com carga abaixo de 25%. Baterias de íon-lítio são menos instáveis quando parcialmente descarregadas, e a Valve recomenda essa faixa por segurança. Enquanto ainda estiver com o SteamOS rodando, execute os comandos a seguir no terminal.

Abra o Konsole como usuária `ana` e inspecione o subsistema de bateria pelo sysfs:

```terminal
$ cat /sys/class/power_supply/BAT1/charge_now
4200000
$ cat /sys/class/power_supply/BAT1/charge_full
17500000
$ echo "scale=2; 4200000 / 17500000 * 100" | bc
24.00
```

No exemplo acima, `charge_now` indica a carga atual em µAh (microampères-hora) e `charge_full` a capacidade máxima. O cálculo resultou em 24%, dentro do limite seguro. Se o valor estiver acima de 25%, drene a bateria com uso normal ou com um estresse artificial:

```terminal
$ stress-ng --cpu 4 --timeout 300s
## Deixa os 4 núcleos em 100% por 5 minutos; monitore com upower
$ upower -i /org/freedesktop/UPower/devices/battery_BAT1 | grep percentage
    percentage:          31%
```

Repita até cair abaixo de 25%. Outra abordagem útil é verificar se a bateria está descarregando ativamente (sem o carregador conectado):

```terminal
$ cat /sys/class/power_supply/BAT1/status
Discharging
$ upower -i /org/freedesktop/UPower/devices/battery_BAT1 | grep -E "(state|percentage|time)"
    state:               discharging
    percentage:          22%
    time to empty:       0,8 hours
```

:::dica
Se o Steam Deck estiver conectado ao carregador USB-C, o status será `Charging` ou `Fully charged`. O comando `upower -d` lista todos os dispositivos de energia e é útil para confirmar que não há fonte externa injetando corrente enquanto você mexe nos conectores.
:::

## 3.3 Identificando os dois conectores fisicamente

Com o backplate removido (procedimento da seção 1, preparação e ESD), você verá a placa-mãe, o dissipador e a blindagem da bateria. Localize os dois conectores:

1. **Flat de dados BMS** — uma fita flexível marrom ou laranja que sai do pacote da bateria e se conecta à placa-mãe perto do canto inferior direito. O conector tem uma trava basculante (*flip-lock*) preta ou cinza. É fino, similar a um flat de touchpad.

2. **Conector de alimentação** — um feixe de fios pretos com terminação branca ou cinza, geralmente com abas laterais ou um *pull-tab* (lingueta de puxar) transparente ou azul. Conecta-se próximo ao centro da placa, à direita do SSD. O encaixe é do tipo "fricção com trava", mais robusto que o flat.

:::nota
Em algumas revisões de hardware do Steam Deck LCD, o conector de alimentação usa um layout de 6 pinos em duas fileiras; na versão OLED, o flat de dados pode estar mais próximo da dobradiça central. Sempre compare visualmente com o guia de serviço da iFixit antes de puxar.
:::

## 3.4 Executando a desconexão passo a passo

Agora que você já drenou a carga, calçou a pulseira antiestática e está com a bancada organizada (veja [seção 1 — ESD e preparação](#/cap-085/sec-01)), siga a sequência.

**Passo 1 — Flat de dados BMS.** Use uma espátula de náilon (*spudger*) ou a unha para levantar delicadamente a trava basculante do conector flat. Ela se abre em direção ao cabo. Depois de solta, puxe o flat para fora, segurando pelas laterais da fita, nunca pelos fios expostos. Deposite o flat sobre a blindagem da bateria de forma que os contatos não toquem metal.

```terminal
## Antes de desconectar, verifique que o BMS está respondendo:
$ cat /sys/class/power_supply/BAT1/capacity
22
$ cat /sys/class/power_supply/BAT1/cycle_count
48
## Após desconectar o flat:
$ cat /sys/class/power_supply/BAT1/capacity
cat: /sys/class/power_supply/BAT1/capacity: No such device
```

A perda do dispositivo `/sys/class/power_supply/BAT1` confirma que a comunicação BMS foi cortada e o kernel não enxerga mais a bateria.

**Passo 2 — Conector de alimentação.** Agarre o *pull-tab* ou a base plástica do conector com firmeza e puxe para cima, perpendicular à placa-mãe. Não use força excessiva; se ele estiver emperrado, faça alavanca suave com a espátula nos cantos, alternando os lados.

```terminal
## Neste ponto, nenhum sinal de alimentação da bateria:
$ cat /sys/class/power_supply/BAT1/voltage_now
cat: /sys/class/power_supply/BAT1/voltage_now: No such device
```

**Passo 3 — Isolar.** Enrole uma pequena tira de fita isolante ou *kapton* na ponta do conector de alimentação, cobrindo os contatos metálicos expostos. Posicione o conector isolado sobre a blindagem da bateria ou fixe-o com fita crepe na carcaça, longe de regiões onde você vai trabalhar. O flat de dados também pode ficar sob uma aba de fita.

:::atencao
Não deixe o conector de alimentação solto e balançando. Se ele tocar qualquer pad de solda da placa, você pode criar um caminho de baixa resistência e queimar trilhas ou o CI de gerenciamento de energia. Essa dica vale ouro e evita o famoso "era só uma troca de tela, agora não liga mais".
:::

## 3.5 Verificação final e preparação para o reparo

Com os dois conectores isolados, pressione o botão **Power** por 10 segundos para drenar qualquer carga residual nos capacitores da placa-mãe. Conecte o carregador USB-C por 3 segundos e desconecte — isso garante que o CI de carga não esteja segurando tensão fantasma.

Agora você pode seguir para o reparo desejado: remoção da ventoinha, troca da tela ou, se for o caso, a substituição completa da bateria tratada na [seção 4 — Substituição da bateria](#/cap-085/sec-04). Se em algum momento precisar reconectar para testar, a ordem inversa se aplica: **primeiro o conector de alimentação, depois o flat de dados BMS**.

:::info
Se após a reconexão o Steam Deck não ligar imediatamente, não se assuste. Baterias que entraram em *shipping mode* precisam de um "golpe de carga": conecte o carregador original de 45 W por pelo menos 5 minutos e tente ligar novamente. O LED branco piscando três vezes indica que o modo de transporte foi desativado.
:::

---

## Resumo

- Drene a bateria abaixo de 25% e confira com `cat /sys/class/power_supply/BAT1/charge_now` e `upower -i` antes de abrir o console
- Identifique o flat de dados BMS (fino, com trava basculante) e o conector de alimentação multi-cabos (com *pull-tab*)
- A ordem de desconexão é obrigatória: primeiro o flat de dados, depois o de alimentação — reverter isso pode travar o BMS
- Isole os conectores com fita isolante ou kapton assim que removidos; jamais deixe pinos expostos sobre a placa
- Pressione o botão Power por 10 segundos após a desconexão para descarregar capacitores residuais
- Na reconexão, inverta a ordem: alimentação primeiro, flat de dados por último

---

## Exercícios

1. Com o Steam Deck ligado e a bateria acima de 50%, execute `upower -i` e anote `capacity`, `percentage` e `time to empty`. Repita a cada 5 minutos de uso intenso e plote a curva de descarga (papel ou planilha). Compare com a estimativa do comando `stress-ng` usado por 10 minutos.

2. Abra o console e, antes de desconectar qualquer cabo, fotografe os dois conectores da bateria com o celular. No terminal, descreva em um arquivo `conectores.txt` as cores, o formato da trava e a posição relativa de cada um. Compare com o guia iFixit para sua revisão de hardware.

3. Simule a desconexão do flat BMS no sysfs: pesquise qual módulo do kernel gerencia o `BAT1` (`lsmod | grep battery` ou `modinfo axp288_fuel_gauge`) e redija um parágrafo explicando por que o dispositivo some do sysfs quando o flat é removido.

4. **Desafio prático integrador:** Realize o procedimento completo da seção 3, da drenagem até o isolamento dos conectores. Documente cada passo com prints do terminal registrando os valores de carga antes e depois. Em seguida, reconecte tudo e registre o momento em que o dispositivo `BAT1` reaparece no sysfs. Produza um mini-relatório em Markdown com os comandos, saídas e tempos medidos.