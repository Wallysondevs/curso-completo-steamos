Substituir fisicamente a bateria do Steam Deck — procedimento que você executou com a [troca da célula](#/cap-085/sec-04) e validou com os [testes de montagem](#/cap-085/sec-08) — é apenas a primeira metade do trabalho. A segunda metade, igualmente importante, é fazer com que o *fuel gauge* (medidor de combustível) do BMS (Battery Management System) reaprenda os parâmetros reais da nova célula. Sem essa calibração, o Steam Deck pode desligar com 15% indicados ou permanecer em 100% por horas, porque o algoritmo de estimação de estado de carga (SoC) ainda está operando com a curva de descarga da bateria antiga.

Este capítulo fecha o ciclo: você vai executar um procedimento completo de calibração, conferir os indicadores de saúde por `upower` e pelo sistema de arquivos `sysfs`, interpretar os números que aparecem e adotar práticas que prolongam a vida útil da célula nova. Se após tudo isso o comportamento continuar irregular, você saberá reconhecer uma bateria defeituosa e decidir os próximos passos.

:::objetivos
- Entender por que o percentual exibido pode ficar impreciso após a troca física da bateria
- Executar um ciclo completo de carga/descarga para recalibrar o medidor de combustível (fuel gauge) do BMS
- Ler e interpretar indicadores de saúde da bateria com `upower -i` e `/sys/class/power_supply/BAT1/`
- Adotar boas práticas de longevidade e reconhecer quando a calibração não resolve
:::

## Por que calibrar após a troca

O BMS do Steam Deck mantém internamente uma tabela que relaciona tensão da célula, corrente acumulada (coulomb counting) e estimativa de capacidade total. Quando você instala uma bateria nova, o BMS ainda "lembra" dos parâmetros da antiga — especialmente a resistência interna e a curva de descarga. O resultado prático:

* O percentual sobe rápido demais durante a carga (salta de 60% para 100% em minutos)
* O sistema desliga abruptamente com valores como 10% ou 15% ainda indicados na tela
* A autonomia real não bate com a expectativa, mesmo com `energy_full` nominal elevado

A calibração força o BMS a percorrer a faixa completa de operação — de tensão de corte inferior (~3,0 V por célula) até tensão de carga completa (~4,2 V por célula) — registrando quantos miliwatts-hora efetivamente entraram e saíram. Um único ciclo bem executado resolve a maioria dos casos.

:::info
**Capacidade nominal vs. capacidade real.** A capacidade *de projeto* (`energy_full_design` ou `charge_full_design`) é o valor de fábrica impresso na etiqueta da bateria (~40 Wh para o Steam Deck LCD, ~50 Wh para o OLED). A capacidade *atual* (`energy_full` ou `charge_full`) é o que o BMS estima que a célula consegue entregar agora. Imediatamente após a troca, `energy_full` pode aparecer artificialmente baixo; a calibração tende a elevá-lo para próximo do valor de projeto.
:::

## Procedimento de calibração completa

Execute a sequência abaixo com o Steam Deck fora do dock e em modo Desktop (KDE Plasma), onde você tem acesso ao terminal e ao `upower`. O processo leva algumas horas — planeje executá-lo durante um período em que você não precise usar o console.

**Passo 1 — Carga completa até 100% real.** Conecte o carregador original de 45 W. Deixe o Steam Deck carregando até o LED ficar verde e `upower` reportar `state: fully-charged`. Aguarde pelo menos mais 30 minutos com o carregador conectado depois de atingir 100% — isso permite que o BMS equalize as células e absorva carga residual (fase de *saturation charge*).

```terminal
$ upower -i /org/freedesktop/UPower/devices/battery_BAT1
  native-path:          BAT1
  power supply:         yes
  updated:              qua 15 out 2025 20:45:00 -03 (2 seconds ago)
  has history:          yes
  has statistics:       yes
  battery
    present:             yes
    rechargeable:        yes
    state:               fully-charged
    energy:              40,16 Wh
    energy-empty:        0 Wh
    energy-full:         40,16 Wh
    energy-full-design:  40,04 Wh
    energy-rate:         0 W
    voltage:             8,71 V
    charge-cycles:       1
    percentage:          100%
    capacity:            100,3%
    technology:          lithium-polymer
    icon-name:          'battery-full-charged-symbolic'
```

Note o campo `capacity`: 100,3% significa que a nova bateria entrega ligeiramente mais do que o valor de projeto — situação normal para células recém-fabricadas.

**Passo 2 — Descarga controlada até o desligamento.** Desconecte o carregador. Use o Steam Deck normalmente (jogando, navegando, reproduzindo vídeo) até que ele desligue sozinho por bateria crítica. Evite cargas pesadas de CPU/GPU artificiais — o ideal é uma descarga moderada e constante, que gera uma curva de tensão mais previsível para o BMS. Não conecte o carregador durante essa fase.

**Passo 3 — Repouso após desligamento.** Com o console desligado (tela preta, sem atividade), aguarde pelo menos 1 hora. Isso permite que a tensão da célula se recupere do *voltage sag* (queda sob carga) e estabilize próximo da tensão real de circuito aberto.

**Passo 4 — Carga ininterrupta até 100%.** Conecte o carregador com o Steam Deck desligado. Deixe carregar ininterruptamente até o LED verde. Ligue o console e, já no Desktop, confirme `state: fully-charged`. Anote os novos valores.

```terminal
$ upower -i /org/freedesktop/UPower/devices/battery_BAT1 | grep -E "(energy-full|capacity|percentage|charge-cycles|state)"
    state:               fully-charged
    energy-full:         39,87 Wh
    energy-full-design:  40,04 Wh
    percentage:          100%
    capacity:            99,6%
    charge-cycles:       2
```

O `energy-full` agora deve refletir a capacidade real entregue no ciclo anterior. `charge-cycles` incrementou para 2 — esperado, pois o ciclo completo de calibração conta como um ciclo de carga.

:::dica
**Calibração e o modo armazenamento.** Se a bateria nova veio com carga residual de fábrica (30-50%), você pode pular a carga inicial e começar direto pela descarga até desligamento. O importante é que o BMS registre pelo menos um ciclo completo de 0% a 100% sem interrupções. Alguns técnicos preferem executar dois ciclos consecutivos; o primeiro já resolve 90% dos casos de imprecisão.
:::

## Lendo indicadores de saúde pelo sysfs

Além do `upower`, você pode consultar diretamente os atributos do kernel em `/sys/class/power_supply/BAT1/`. Essa interface expõe os mesmos dados, mas com nomes ligeiramente diferentes e em microwatts-hora (`uWh`).

```terminal
$ ls /sys/class/power_supply/BAT1/
capacity        charge_full         cycle_count    model_name    serial_number  technology
capacity_level  charge_full_design  health         power_now     status          type
charge_now      current_now         manufacturer   present       subsystem       voltage_now

$ cat /sys/class/power_supply/BAT1/charge_full_design
40040000

$ cat /sys/class/power_supply/BAT1/charge_full
39870000

$ cat /sys/class/power_supply/BAT1/cycle_count
2

## Calculando capacidade percentual diretamente
$ echo "scale=2; $(cat /sys/class/power_supply/BAT1/charge_full) / $(cat /sys/class/power_supply/BAT1/charge_full_design) * 100" | bc
99.57
```

O arquivo `health` retorna um dos estados: `Good`, `Fair`, `Poor` ou `Unknown`. Se após dois ciclos completos o `health` permanecer como `Poor` ou `Fair`, a bateria pode ter defeito de fabricação.

A tabela a seguir reúne os principais indicadores e como interpretá-los:

| Métrico (`upower` / `sysfs`) | Interpretação |
|---|---|
| `capacity` ≥ 95% / `health: Good` | Bateria saudável, calibração bem-sucedida |
| `capacity` entre 80% e 94% | Célula usada ou com leve degradação; aceitável para bateria de reposição genérica |
| `capacity` < 80% / `health: Fair` | Degradação acentuada; investigar se é defeito ou célula antiga |
| `capacity` < 60% / `health: Poor` | Bateria defeituosa ou célula reciclada — providenciar substituição |
| `cycle_count` = 0 após vários ciclos | BMS pode não estar registrando; verificar firmware ou trocar bateria |
| `energy-full` oscilando ±15% entre ciclos | Mau contato no conector interno ou BMS descalibrado persistentemente |

## Práticas para longevidade da bateria nova

Depois de calibrar, você pode adotar algumas medidas que retardam a degradação natural da célula de lítio-polímero:

**Limite de carga em 80%.** Manter a bateria permanentemente em 100% acelera a oxidação do eletrólito. Se você usa o Steam Deck majoritariamente dockado ou conectado ao carregador, instale o plugin Decky Loader com PowerTools (ou similar) e ative o limite de carga em 80%. O BMS interrompe o carregamento nesse patamar, preservando a vida útil.

```terminal
## Verificando se o limite de carga está ativo (apenas leitura via sysfs)
$ cat /sys/class/power_supply/BAT1/charge_control_end_threshold
## Se o plugin estiver ativo, retorna um valor como 80; caso contrário, 100.
```

O suporte a `charge_control_end_threshold` depende de o kernel do SteamOS expor a interface — em alguns modelos e versões de BIOS o arquivo pode não existir. Se não estiver disponível, o próprio plugin gerencia o limite via software, cortando a carga antes do topo.

**Evite descarga profunda frequente.** Deixar a bateria descarregar até o desligamento automaticamente uma ou duas vezes (para calibrar) é aceitável e necessário. Tornar isso um hábito, por outro lado, acelera a degradação. O ideal é recarregar quando o indicador atingir entre 15% e 25%.

**Temperatura.** O Steam Deck dissipa calor internamente; sessões longas de jogo com o console apoiado em superfícies macias (cama, sofá) elevam a temperatura da bateria acima de 40 °C, o que encurta a vida útil. Sempre que possível, mantenha as entradas de ar traseiras desobstruídas.

**Armazenamento prolongado.** Se for guardar o Steam Deck por semanas ou meses, deixe a bateria entre 40% e 60% e desligue completamente (não apenas suspenda). O capítulo sobre [gerenciamento de energia e upower](#/cap-NNN/sec-NN) traz mais detalhes sobre estados de suspensão e consumo residual.

## Quando a calibração não resolve

Se, após dois ciclos completos de carga/descarga, você ainda observar:

* Desligamento abrupto com percentual acima de 20%
* `energy-full` consistentemente abaixo de 70% de `energy-full-design`
* `health` mantido como `Poor` independentemente dos ciclos
* `energy-full` que diminui a cada ciclo em vez de estabilizar

...a bateria provavelmente está defeituosa. Isso acontece com células de reposição de baixa qualidade, baterias que ficaram armazenadas por anos em condição de descarga profunda (tensão abaixo de 2,5 V), ou unidades com BMS incompatível. Nesses casos, a recomendação é acionar a garantia do fornecedor ou adquirir uma bateria de outra procedência.

Para confirmar o diagnóstico, você pode cruzar os dados de `upower` com a tensão da célula:

```terminal
$ upower -i /org/freedesktop/UPower/devices/battery_BAT1 | grep voltage
    voltage:             7,12 V
## Tensão muito abaixo de ~8,4 V em "fully-charged" indica célula danificada ou BMS com falha
```

O Steam Deck LCD opera com pack 2S (duas células em série, nominal 7,6 V, carga completa ~8,4-8,7 V). Um valor de `voltage` em `fully-charged` abaixo de 8,0 V é sinal claro de que uma das células não está atingindo carga plena.

## Resumo

* A calibração é indispensável após a troca física da bateria; sem ela, o percentual exibido pode ficar impreciso e o console pode desligar antes do esperado
* O procedimento consiste em carregar até 100%, descarregar até desligamento, aguardar repouso e carregar novamente de forma ininterrupta
* `upower -i` e `/sys/class/power_supply/BAT1/` fornecem os indicadores de saúde: `energy_full`, `capacity`, `cycle_count` e `health`
* Uma bateria nova e calibrada deve apresentar `capacity` ≥ 95% e `health: Good`
* Limitar a carga em 80% (via Decky/PowerTools), evitar descargas profundas frequentes e controlar a temperatura prolongam a vida útil
* Se após dois ciclos a calibração não estabilizar os valores, a bateria provavelmente está defeituosa e precisa ser substituída novamente

## Exercícios

1. Com o Steam Deck totalmente carregado, execute `upower -i /org/freedesktop/UPower/devices/battery_BAT1` e anote `energy-full`, `energy-full-design`, `capacity` e `charge-cycles`. Compare com os valores de `/sys/class/power_supply/BAT1/charge_full` e `charge_full_design`.

2. Execute um ciclo de calibração completo conforme descrito nesta seção. Ao final, registre novamente os mesmos parâmetros e verifique se `energy-full` aumentou ou estabilizou. Houve mudança no `capacity`?

3. Simule uma situação de diagnóstico: suponha que `capacity` esteja em 72% e `health` seja `Fair` após dois ciclos. Liste três possíveis causas e o que você faria para cada uma.

4. Utilizando apenas `sysfs`, crie um script de uma linha (ou pipeline) que calcule a capacidade percentual atual da bateria e exiba "SAUDAVEL" se ≥ 80%, "ATENCAO" se entre 60% e 79%, ou "DEFEITO" se < 60%.

5. **Exercício integrador do capítulo:** Documente todo o processo de troca e pós-troca em um relatório curto: descreva a desmontagem ([sec-04](#/cap-085/sec-04)), os cuidados com ESD e conectores, o resultado dos testes iniciais ([sec-08](#/cap-085/sec-08)), o procedimento de calibração executado e os valores finais de saúde da bateria. Esse relatório servirá como histórico para futuras manutenções do seu Steam Deck.