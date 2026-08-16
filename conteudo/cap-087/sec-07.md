O Steam Deck pode passar semanas "estacionado" na mesa, plugado, ou conectado a uma dock como desktop. Nesses cenários, manter a bateria em 100% o tempo todo é o que mais desgasta a célula. A saída é limitar a carga a um teto — e há como fazer isso, com ressalvas, no modo desktop.

:::objetivos
- Entender por que limitar a carga a ~80% protege a bateria
- Identificar o mecanismo de limite disponível no SteamOS
- Ajustar o teto de carga no modo desktop
- Ler e verificar o estado do limite aplicado
- Reverter o limite quando precisar da carga completa

:::

## O custo de morar em 100%

Na seção de ciclos você viu que permanecer parado em estados de carga extremos acelera a degradação. Um Deck dockado, sempre no carregador, vive em 100% 24 horas por dia — o pior cenário para a química, mesmo sem nenhum ciclo sendo "gasto" em uso. A célula envelhece só de ficar cheia e quente.

O limite de carga resolve isso de forma cirúrgica: em vez de 100%, o sistema para de carregar a 80% (ou outro teto) e o aparelho opera dali, direto da fonte. É exatamente o recurso que notebooks premium oferecem como "modo preservação de bateria".

```terminal
$ upower -i /org/freedesktop/UPower/devices/battery_BAT1 | grep -E 'state|percentage|energy-full'
    state:               charging
    percentage:          80%
    energy-full:         36,81 Wh
```

Quando o limite funciona, a leitura estabiliza em 80% e o `state` alterna entre `charging` e `fully-charged` no teto, sem nunca ir além.

## Como o SteamOS encara o limite

O SteamOS usa a mesma base do Arch Linux, então o controle fino da bateria passa pelo kernel e pelos drivers da plataforma — mas a Valve não expõe um botão "limite de carga" na interface do modo de jogo. Isso significa que o limite existe no nível de hardware/kernel, porém acessível via configuração que, no SteamOS imutável, exige atenção.

O ponto importante: no modo de jogo não há atalho. O trabalho acontece no **modo desktop**, e mesmo lá depende de o driver da sua revisão expor o parâmetro. Modelos e lotes diferentes podem se comportar diferente.

:::atencao
O SteamOS usa um sistema de arquivos com a raiz somente-leitura por padrão. Ferramentas de tweak que mexem em `/sys` funcionam, pois `/sys` é virtual, mas **instalar** pacotes ou scripts de inicialização pode exigir desbloquear a escrita temporariamente. Prefira soluções que toquem apenas nos arquivos virtuais do kernel, não na raiz do sistema.
:::

## Aplicando o teto via `/sys`

O controle de carga, quando suportado, aparece como arquivos virtuais na pasta da bateria. O nome varia (`charge_control_end_threshold`, `charge_stop_threshold` e similares), então o primeiro passo é verificar o que sua revisão oferece:

```terminal
$ ls /sys/class/power_supply/BAT1/ | grep -E 'charge|threshold'
charge_control_end_threshold
```

A leitura mostra o teto atual (100 é o padrão sem limite). Escrever `80` nele muda onde o carregamento para:

```terminal
$ cat /sys/class/power_supply/BAT1/charge_control_end_threshold
100
$ echo 80 | sudo tee /sys/class/power_supply/BAT1/charge_control_end_threshold
80
$ cat /sys/class/power_supply/BAT1/charge_control_end_threshold
80
```

Com o teto em 80, o Deck carrega até 80% e fica por ali, alimentado pela fonte. A escrita exige `sudo` porque `/sys` pertence ao root; é por isso que o comando usa `tee` em vez de um `>` simples, que falharia por permissão.

:::dica
O teto só vale enquanto o valor estiver gravado — desligar e religar pode restaurar o padrão 100, dependendo do driver. Para fixar de verdade, é preciso um serviço systemd ou script de inicialização que reaplique o valor a cada boot. Teste gravando manualmente primeiro e, só depois, automatize.
:::

## Verificando e revertendo

Depois de aplicar, confirme que o comportamento segue a configuração: com o cabo conectado e a bateria abaixo do teto, o `state` deve ser `charging`; ao atingir o teto, o carregamento para mesmo com o cabo plugado.

```terminal
$ upower -i /org/freedesktop/UPower/devices/battery_BAT1 | grep -E 'state|percentage'
    state:               fully-charged
    percentage:          80%
```

`fully-charged` em 80% é o sinal de que o teto pegou: o sistema considera "cheio" no seu novo limite. Para reverter quando for viajar e quiser a carga máxima, é só escrever `100` de volta:

```terminal
$ echo 100 | sudo tee /sys/class/power_supply/BAT1/charge_control_end_threshold
```

Deixe o aparelho recarregar até 100% normalmente antes de sair da tomada. A reversão é o que faz do limite uma ferramenta de uso contínuo, ligada e desligada conforme a ocasião, e não um fork irreversível.

:::nota
Nem toda bateria de Steam Deck expõe `charge_control_end_threshold`; em algumas revisões o driver não implementa esse controle, e a gravação falha com "No such file" ou "Operation not permitted". Nesse caso não há software que resolva — a alternativa é o hábito manual de desplugar perto de 80%, ou aceitar o funcionamento do próprio gerenciamento da Valve.
:::

## Resumo

- Ficar estacionado em 100% degrada a célula mesmo sem ciclos de uso.
- Limitar a carga a ~80% protege a bateria em uso fixo/dockado.
- O controle, quando suportado, vive em `/sys/class/power_supply/BAT1/charge_control_end_threshold`.
- Escrever no arquivo exige `sudo`; teto pode não persistir entre boots sem automação.
- Reverter é escrever `100` de volta; nem toda revisão expõe o parâmetro.

## Exercícios

1. Liste `/sys/class/power_supply/BAT1/` e verifique se o seu aparelho expõe algum arquivo de threshold de carga. Qual nome ele usa?
2. Leia o valor atual do threshold e explique o que `100` significa no contexto do limite de carga.
3. Aplique o teto `80` com `sudo tee`, confirme a escrita e observe o `state`/`percentage` ao atingir o teto.
4. Reverta para `100` e observe a bateria voltar para `fully-charged` em 100%.
5. **Desafio.** Escreva um pequeno serviço systemd (arquivo `.service` + `ExecStart` que grava o teto) que reaplique o limite a cada boot, e explique por que a escrita isolada se perde ao reiniciar. Se sua revisão não suporta o threshold, proponha e justifique a alternativa manual.
