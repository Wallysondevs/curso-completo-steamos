TDP, GPU clock e limite de quadros formam o triângulo do desempenho no Steam Deck — três controles interdependentes que determinam se um jogo roda fluido ou a bateria desaparece em 40 minutos. Esta seção desce ao nível técnico de cada um: o que significam, como ajustá-los no perfil individual e, principalmente, como interpretar o resultado no terminal.

:::objetivos
- Entender o que TDP, clock de GPU e FPS significam no SoC Aerith
- Ajustar cada controle em um perfil individual de forma eficaz
- Monitorar o impacto dos ajustes com sensores do sistema
- Interpretar a relação entre limite de energia e estabilidade de quadros
- Identificar quando o FSR deve ou não ser usado junto com esses controles
:::

## O triângulo TDP/GPU/FPS

O Steam Deck usa um SoC AMD customizado (codinome Aerith, arquitetura Zen 2 + RDNA 2) onde CPU e GPU dividem o mesmo orçamento de energia. **TDP** (*Thermal Design Power*) é o teto máximo, em watts, que o processador pode consumir. Quando você limita o TDP, o hardware decide como distribuir a verba entre CPU e GPU — e é por isso que reduzir TDP demais pode afetar tanto a física do jogo quanto os gráficos.

O **clock da GPU** é um controle manual, em megahertz, que fixa a frequência da parte gráfica. Em jogos que sobram CPU mas faltam gráficos, travar o clock da GPU numa frequência estável (ex.: 1600 MHz) pode reduzir oscilações e *stuttering* mais do que mexer no TDP.

O **limite de FPS** atua como um teto de renderização: em vez de o jogo produzir quantos quadros conseguir, você diz "até aqui". Combinado com TDP, é a forma mais direta de balancear bateria.

:::dica
40 FPS é o "ponto doce" do Deck: fica exatamente no meio entre 30 e 60 e, matematicamente, cada frame dura 25 ms — uma cadência percebida como muito mais fluida que 30 fps (33 ms) com custo de energia apenas moderado.
:::

## Conferindo os sensores em tempo real

O Steam Deck expõe sensores de hardware via sistema de arquivos `sysfs`, e o kernel AMD disponibiliza métricas de consumo, temperatura e frequência. Você pode confirmar se o perfil de TDP está funcionando lendo esses sensores:

```terminal
$ cat /sys/devices/virtual/powercap/*/energy_uj 2>/dev/null
$ cat /sys/class/hwmon/hwmon0/temp1_input
$ cat /sys/class/hwmon/hwmon1/freq1_input
```

Esses arquivos virtuais (na verdade, interfaces do kernel via `sysfs`) informam, respectivamente: consumo acumulado em microjoules, temperatura do SoC em miligraus Celsius e frequência atual da GPU em kHz. Os caminhos exatos podem variar entre revisões do SteamOS, mas a lógica é sempre a mesma: um `cat` num arquivo do `/sys` devolve o valor do sensor.

```terminal
$ cat /sys/class/hwmon/hwmon0/temp1_input
65000
$ cat /sys/class/hwmon/hwmon1/in0_input
7800
```

Nesta amostra, a temperatura está em `65000` (ou seja, 65°C, porque o valor está em miligraus Celsius — divida por 1000). O `in0_input` de `7800` pode ser a tensão de entrada em milivolts (7,8 V). Com o perfil de TDP ativo, a temperatura deve estabilizar dentro do envelope térmico do Deck, e esses sensores são a prova objetiva.

## Mapeando o que o perfil grava

Quando você define TDP, GPU clock ou FPS num perfil individual, o Steam escreve os valores no bloco do jogo. É possível simular no terminal o formato final usando um bloco `text`:

```text
"PerformanceProfile"
{
    "fpsLimit"      "40"
    "tdpLimit"      "11"
    "gpuClock"      "1600"
    "fsrEnabled"    "0"
    "scalingFilter" "0"
}
```

Cada chave tem um significado preciso: `fpsLimit` é o teto de quadros; `tdpLimit` é o limite de energia em watts; `gpuClock` é a frequência fixa da GPU em MHz (ausente ou `0` significa "automático"); `fsrEnabled` e `scalingFilter` controlam o FSR, que será abordado na [seção 6](#/cap-013/sec-06). A sintaxe VDF não usa vírgulas nem dois-pontos, e a indentação com tabs é uma convenção da Valve.

:::atencao
Fixar o clock da GPU num valor muito alto com TDP baixo é inútil: a GPU nunca vai atingir aquela frequência porque não terá energia suficiente. O hardware simplesmente ignora a instrução além do que a verba permite. Prefira ajustar o TDP e deixar o clock em automático até sentir necessidade de estabilizar manualmente.
:::

## TDP fixo vs TDP variável

No SteamOS, o limite de TDP é um **teto rígido**: o SoC pode consumir menos, mas nunca mais. Em jogos leves, o consumo natural já fica abaixo do teto, então o ajuste não afeta o desempenho — e essa é a melhor situação: você define um teto alto o suficiente para não atrapalhar ninguém, e os jogos leves simplesmente usam menos energia por conta própria. O problema é quando um jogo "estoura" o teto e começa a oscilar — aí o limite de TDP se torna o regulador.

```terminal
$ cat /sys/class/hwmon/hwmon1/power1_average
10500
```

Esse arquivo (quando presente) mostra o consumo médio em miliwatts. `10500` = 10,5 W, que é um valor típico para jogos AAA moderados no Deck. Se você definiu `tdpLimit 10`, está no limite; se definiu `12`, há folga. Monitorar antes de ajustar evita cortar energia demais.

## A regra de ouro da combinação

A ordem em que você pensa nos três deveria ser: primeiro o **limite de FPS** (qual a fluidez mínima aceitável?), depois o **TDP** (quanto de energia você está disposto a gastar para manter esse FPS?) e, por último, o **clock de GPU** (só se houver oscilação que os outros dois não resolveram). Essa ordem minimiza o tempo de ajuste e respeita o fato de que FPS e TDP se bastam na maioria dos casos.

## Resumo

- TDP limita o consumo máximo em watts; GPU clock fixa a frequência; FPS limita os quadros.
- Sensores em `/sys/class/hwmon/` permitem verificar temperatura, consumo e frequência em tempo real.
- O perfil grava `fpsLimit`, `tdpLimit` e `gpuClock` como chaves VDF no bloco do jogo.
- Fixar GPU clock sem TDP suficiente é ineficaz; prefira ajustar TDP e manter GPU em automático.
- A ordem recomendada de ajuste é: FPS → TDP → GPU clock, nessa sequência.

## Exercícios

1. Com um jogo aberto, leia os sensores de temperatura e energia (`cat /sys/class/hwmon/*/temp1_input`, `cat /sys/class/hwmon/*/power1_average`) e anote os valores.
2. Crie dois perfis para o mesmo jogo: um com `tdpLimit 8` e outro com `tdpLimit 15`. Jogue 2 minutos com cada e compare a temperatura.
3. Explique por que fixar `gpuClock 1600` com `tdpLimit 6` não faz sentido, usando o conceito de orçamento de energia.
4. No `localconfig.vdf`, localize o bloco de um perfil e identifique quais dos três campos (fps, tdp, gpu) estão definidos e quais estão ausentes.
5. **Desafio.** Combine os sensores de `/sys` com um loop simples (`while true; do cat ...; sleep 2; done`) e monitore o consumo antes e depois de aplicar um perfil de TDP. Relacione a diferença observada com o valor gravado em `tdpLimit`.