Undervolting é a arte de entregar menos tensão ao chip sem reduzir o relógio. A AMD fabrica cada lote de Zen 2 com uma margem de segurança grande, porque dois chips do mesmo wafer podem ter qualidade de silício ligeiramente diferente. Ao descobrir quanto de folga o *seu* chip tem e retirá-la, você reduz consumo e temperatura — e, num dispositivo com envelope térmico apertado como o Steam Deck, isso frequentemente traduz em mais FPS sustentado, não menos.

:::objetivos
- Entender por que a AMD vende chips com folga de tensão
- Usar o Curve Optimizer para deslocar a curva de tensão/frequência
- Calibrar o offset de undervolting por núcleo de forma segura
- Reconhecer sintomas de instabilidade causados por tensão insuficiente
:::

## Por que existe folga de tensão

A tensão de operação de um núcleo Zen 2 é descrita por uma **curva V-F** (tensão × frequência): para cada frequência, há uma tensão mínima teoricamente necessária. Como a AMD não testa cada chip individualmente, ela aplica uma curva que funciona no pior caso do lote — o "chip azarado". O seu chip, se veio de um lote melhor, aceita funcionar numa tensão mais baixa para a mesma frequência.

O **Curve Optimizer** deixa você deslocar essa curva inteira para baixo, em passos de 3 a 5 mV. Um offset negativo de −10 significa "entregue 10 unidades a menos de tensão em todos os pontos da curva".

:::info
O Curve Optimizer no Aerith (RDNA 2) do Steam Deck opera em passos inteiros, não em milivolts diretos. Um passo equivale a cerca de 3-5 mV. Valores típicos seguros ficam entre −5 e −20; além de −20, a maioria dos chips fica instável.
:::

## Acessando o Curve Optimizer

Dentro do Smokeless UMAF, o caminho é `Device Manager → AMD Overclocking → Curve Optimizer`. Você verá o modo em `Disabled` por padrão. Mude para `All Cores` para aplicar o mesmo offset a todos os núcleos, ou `Per Core` para calibrar núcleo a núcleo.

```text
Curve Optimizer
├── Curve Optimizer Mode  [All Cores]
├── All Core Curve Optimizer Magnitude  [ -10 ]
└── (Per Core) → Core 0..7 magnitude
```

Comece sempre por `All Cores` com um valor pequeno, como **−10**. A magnitude negativa reduz tensão; positiva aumenta. Não há razão para usar valores positivos em undervolting — positivo serve para dar mais tensão a um núcleo fraco e estabilizar overclock.

## Calibrando em passos

O processo correto é iterativo e paciente:

1. Aplique **−5**, salve, reinicie e rode 30 minutos de carga.
2. Se estável, aplique **−10** e repita.
3. Continue em passos de −5 até o primeiro sinal de instabilidade.
4. Volte dois passos acima do ponto de instabilidade (ex.: travou em −20, fique em −10) e rode 2 horas de teste.

```terminal
$ stress-ng --cpu 8 --timeout 600s
$ stress-ng --cpu 8 --cpu-method matrixprod --timeout 600s
```

O `stress-ng` está disponível no SteamOS e exercita os núcleos ao máximo. A segunda forma (matrixprod) é especialmente boa para detectar quedas de tensão, porque gera cálculos intensivos com dependência de dados.

:::perigo
Undervolting agressivo demais causa falhas silenciosas: corrupção de dados no disco, arquivos gravados com zero em vez do conteúdo, até panics de kernel que derrubam o sistema em plena gravação. Se o Deck travar durante uma escrita em disco, você pode corromper o sistema de arquivos. Sempre tenha backup antes de testar offsets altos.
:::

## Sintomas de instabilidade

Aprenda a reconhecer o primeiro sinal antes que vire dano:

- **Crash do jogo** nos primeiros segundos, sem congelamento do sistema — tensão baixa demais para o clock da GPU.
- **Reboot espontâneo** durante carga leve (menu, tela ociosa) — tensão baixa demais em *idle*, não em carga.
- **Erros de checksum** ou arquivos corrompidos após gravação — o sintoma mais perigoso, silencioso.
- **Mensagem `Machine Check Exception`** no `dmesg` — a APU detectou um erro de hardware corrigível.

```terminal
$ sudo dmesg | grep -i "mce\|machine check"
[  123.456] mce: [Hardware Error]: Machine check events logged
```

Se qualquer um desses aparecer, reduza a magnitude do offset (ex.: de −20 para −15) e teste de novo.

Visualize o processo de calibração com um registro de terminal:

```terminal
$ cat /tmp/undervolt-teste.log
[-05] stress-ng 30min: max 76°C, OK
[-10] stress-ng 30min: max 73°C, OK
[-15] stress-ng 30min: max 71°C, OK
[-20] stress-ng 18min: crash kernel panic, NÃO OK
>>> limite seguro: -15, margem: -10
```

Esse diário simples evita que você fique repetindo testes já feitos e documenta o limite do seu chip.

## O ganho real no Steam Deck

No Deck, undervolting de −15 a −20 bem-sucedido costuma produzir:

- **3-7°C** a menos sob carga, porque menos tensão gera menos calor proporcional ao quadrado da tensão (P = V²/R).
- **Menos throttling térmico** em sessões longas — o ganho indireto de performance.
- **Melhor autonomia** estimada, pois a potência total cai na mesma carga.

Em jogos com GPU pesada, o efeito mais notável é a ausência de quedas de clock após 20-30 minutos — a APU simplesmente se mantém no teto por mais tempo.

## Resumo

- O Curve Optimizer desloca a curva V-F inteira; passo negativo reduz tensão na mesma frequência.
- Comece em `All Cores` com −5 e suba em passos de −5 até o limite de estabilidade.
- Instabilidade aparece como crash, reboot em idle ou — pior — corrupção silenciosa de dados.
- `stress-ng` e o `dmesg` (MCE) são suas ferramentas de detecção.
- Um undervolt bem feito reduz temperatura e melhora o clock sustentado, sem tocar em potência.

## Exercícios

1. Aplique Curve Optimizer `All Cores` em −5 e rode `stress-ng --cpu 8 --timeout 300s`. Anote a temperatura máxima antes e depois.
2. Suba para −10 e −15, testando 20 minutos em cada patamar. Identifique o primeiro patamar em que surgiu instabilidade, se houve.
3. Use `sensors` (ou `ryzenadj -i`) para comparar a temperatura e o consumo com e sem undervolt sob a mesma carga.
4. Gere uma carga de escrita intensa (`sync; dd if=/dev/zero of=/tmp/teste bs=1M count=2048`) sob undervolt agressivo e verifique a integridade do arquivo com `md5sum`.
5. **Desafio.** Explique, com base na fórmula P = V²/R, por que reduzir a tensão em 5% reduz o calor gerado em mais de 5% — e como isso beneficia o clock sustentado num aparelho com dissipador limitado. Relacione com a seção sobre PPT/TDC/EDC.