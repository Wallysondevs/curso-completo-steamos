Abrir o Deck para consertar uma peça quebrada é reativo. A manutenção **preventiva** é o oposto: você abre antes que algo quebre, limpa, lubrifica, troca consumíveis (pasta térmica) e fecha — ganhando meses ou anos de vida extra do aparelho. Um Deck com manutenção preventiva anual chega aos 5 anos rodando como novo.

:::objetivos
- Montar um roteiro de manutenção preventiva anual
- Limpar ventilador, dissipador e carcaça sem danificar componentes
- Identificar sinais precoces de desgaste antes da falha
- Usar álcool isopropílico, pincel antiestático e ar comprimido corretamente
- Reavaliar a pasta térmica e os thermal pads como rotina
:::

## Por que manutenção preventiva

O Deck vive em ambiente hostil: bolsa, mochila, mãos suadas, poeira ambiente. Com o tempo:
- Poeira entra pela ventoinha e entope as aletas.
- Suor e oleosidade corroem os grips e botões.
- A pasta térmica endurece.
- Os conectores vibram e, raramente, o flat cable "anda".

Uma preventiva anual resolve tudo isso de uma vez.

```terminal
$ sudo journalctl -b -p err --no-pager | wc -l
```

Se esse contador de erros no boot atual está crescendo a cada mês, o sistema está te pedindo manutenção. Mas mesmo sem erros, a limpeza física é o equivalente a trocar o óleo do carro: não se espera o motor fundir.

## Roteiro de preventiva anual

1. **Medir saúde atual**: registre `sensors`, `smartctl`, capacidade de bateria (igual seção 4).
2. **Abrir o Deck** (seção 3) e desconectar bateria.
3. **Limpeza seca**: pincel antiestático + ar comprimido (lata ou compressor regulado) no dissipador, ventoinha e placa. Segure a ventoinha ao soprar para não girar loucamente.
4. **Limpeza úmida**: álcool isopropílico 99% em cotonete para contatos e carcaça.
5. **Inspeção visual**: cabos, parafusos, thermal pads, trilhas.
6. **Repasta da APU** (seção 6) se >2 anos ou se temperatura subiu.
7. **Remontagem, validação pós (seção 5) e fechamento.**

```terminal
$ date +%Y-%m-%d > ~/reparo-deck/ultima-preventiva.txt
$ sensors > ~/reparo-deck/sensors-$(date +%Y%m%d).log
```

Mantenha um log: data da última preventiva, temperaturas registradas, e qualquer anormalidade. Um ano depois, compare.

## Limpeza da ventoinha e dissipador

A ventoinha tem aletas minúsculas que entopem. O maior erro é soprar ar comprimido com a ventoinha livre — ela gira muito acima do limite e pode queimar o rolamento. Sempre **segure as pás com um dedo (luva antiestática) ou com um pino de plástico** ao soprar.

```terminal
$ cat /sys/class/hwmon/hwmon*/fan1_input
```

Compare o RPM em idle antes e depois da limpeza. Uma ventoinha suja tende a rodar mais alto porque o fluxo de ar é menor; depois de limpa, o RPM em idle cai.

:::dica
Se o seu Deck tem uma **grade interna** (malha na entrada de ar, popular em kits do AliExpress), ela reduz a entrada de poeira drasticamente — mas também reduz um pouco o fluxo. É um trade-off: menos poeira × ~1 °C extra em carga. Para quem joga em ambiente com cachorro/gato, a grade vale cada centavo.
:::

## Álcool isopropílico e pincel

Álcool isopropílico 99% (isopropanol) é o produto universal de limpeza de eletrônicos:
- Evapora sem deixar resíduo.
- Não corrói contatos nem trilhas.
- Remove gordura, oleosidade e resquícios de adesivo.

Use com **pincel antiestático** (cerdas macias) nos cantos da placa, e com **cotonete** nos contatos de botões. Nunca borrife direto — aplique no pincel/cotonete, depois no componente.

```terminal
$ # inspeção rápida da saúde do sistema após limpeza:
$ sudo dmesg | grep -iE 'error|fail|thermal'
```

## Sinais precoces de desgaste

A preventiva também é a hora de catar sinais que, ignorados, viram defeito:

- **Parafuso oxidado** ou soltando — troque antes que espanar.
- **Flat cable com vincos** — peça sobressalente já.
- **Grip soltando** — o adesivo da carcaça perde aderência; cole com adesivo dupla face próprio.
- **Borracha da alavanca analógica gasta** — as capinhas de borracha (joystick caps) são baratinhas.
- **Conector frouxo** — se o plug da bateria ou da ventoinha sai fácil, pode precisar de um retoque (mas isso é raro; se necessário, um micro ajuste com pinça).

```terminal
$ ls /sys/class/power_supply/ | grep -i bat
```

Verifique a bateria visualmente: se a superfície estiver **abaulada, ondulada ou rachada**, a célula está expandindo — o passo seguinte não é "preventiva", é troca imediata (seção 5).

## O papel do álcool isopropílico nos conectores

Flat cables e conectores oxidam com umidade. Limpar os contatos com isopropílico e deixar evaporar antes de reconectar é uma prática que resolve "malfunctiono intermitente" sem trocar peça.

:::atencao
Nunca use álcool comum (etanol, 70%) em eletrônicos. A água nos 30% restantes corrói contatos e o aditivo deixa resíduo pegajoso. Só isopropílico 99%.
:::

## Preventiva como hábito

Quem faz preventiva anual quase nunca enfrenta reparo de emergência. É o mesmo princípio do Linux: `journalctl -p err` semanal + `smartctl` mensal + `pacman -Syu` regular. Manutenção de hardware é só a extensão física dessa mentalidade.

A seção 9 fecha com o que fazer quando tudo isso falha: quando procurar assistência e como funciona a garantia da Valve.