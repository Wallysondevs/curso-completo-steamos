Toda APU moderna opera dentro de um triângulo de limites que a AMD chama de PPT, TDC e EDC. Modificar esses três números — mesmo sem tocar em tensão ou relógio — muda o teto térmico e elétrico do chip, e é a partir deles que qualquer ajuste de performance começa. Se você entender PPT, TDC e EDC, as próximas seções sobre undervolting e overclock farão sentido imediato.

:::objetivos
- Distinguir PPT (potência), TDC (corrente térmica) e EDC (corrente elétrica de pico)
- Interpretar o que cada limite faz quando a APU atinge 100% de carga
- Configurar os três valores no Smokeless UMAF para o Steam Deck
- Prever o efeito de cada ajuste no desempenho sustentado em jogos
:::

## O triângulo de limitação da APU

A APU do Steam Deck (Aerith, baseada em Zen 2 + RDNA 2) nunca quebra os três limites ao mesmo tempo — ela esbarra no primeiro que atingir. Eles formam um envelope de operação:

- **PPT** (Package Power Tracking): é o limite de potência total do pacote, em watts. Somou CPU + GPU + controlador de memória + interconexão. Se o PPT for 15 W, a APU nunca puxa mais que isso do VRM.
- **TDC** (Thermal Design Current): é o limite de corrente sustentada, em amperes, que o regulador de tensão pode fornecer sem superaquecer. Pense nele como o limite que importa em cargas longas (30+ minutos de jogo).
- **EDC** (Electrical Design Current): é o limite de corrente de pico, em amperes, que o VRM aguenta por rajadas curtas. Importa em cargas transientes — o frame que dispara o clock da GPU por 200 ms.

Quando você joga, o que acontece é uma dança entre esses três. Num primeiro momento o EDC permite um pico de corrente; em seguida o PPT corta por potência; e depois de minutos, se a temperatura do VRM subir, o TDC assume e reduz o teto efetivo.

:::info
No Steam Deck, o VRM foi projetado para entregar até cerca de 25 W sustentados, mas a Valve limitou o pacote a 15 W por firmware. A limitação não está no hardware — está nos defaults da BIOS e, em parte, no driver do kernel que a SteamOS carrega.
:::

## Lendo os limites atuais

Com o RyzenAdj (que será detalhado na seção 3), você lê os limites atuais sem tocar em nada:

```terminal
$ ryzenadj -i
CPU Family: Rembrandt (Aerith)
SMU Version: 90.06.00
STAPM LIMIT: 15.000 W
PPT LIMIT FAST: 20.000 W
PPT LIMIT SLOW: 15.000 W
TDC LIMIT (VDD): 10.000 A
TDC LIMIT (SOC): 2.500 A
EDC LIMIT (VDD): 150.000 A
EDC LIMIT (SOC): 15.000 A
```

O campo `STAPM LIMIT` (Skin Temperature Aware Power Management) é o PPT "inteligente" — ele leva em conta a temperatura da carcaça do Deck e reduz a potência antes que o plástico esquente demais. No Steam Deck, o STAPM e o PPT Slow costumam ter o mesmo valor. Os limites `SOC` se referem à parte não-CPU da APU (GPU, codec de vídeo, controlador de memória) e os `VDD` à parte de CPU.

## Ajustando PPT, TDC e EDC no Smokeless UMAF

No menu que você já aprendeu a acessar — `Device Manager → AMD Overclocking → Precision Boost Overdrive` — mude o PBO de `Auto` para `Manual`. Aparecem os três campos:

- **PPT Limit [W]**: digite um valor em mW (miliwatts). Exemplo: `20000` para 20 W.
- **TDC Limit [A]**: em mA. Exemplo: `12000` para 12 A.
- **EDC Limit [A]**: em mA. Exemplo: `160000` para 160 A.

Uma receita conservadora para o Steam Deck que sobe performance sem esquentar demais:

```text
PPT Limit:  20000 (20 W)
TDC Limit:  12000 (12 A)
EDC Limit: 160000 (160 A)
```

Esses valores aumentam o teto de potência de 15 W para 20 W, mantendo a corrente dentro do que o VRM do Deck aguenta. O ganho em jogos com GPU pesada (como *Cyberpunk 2077*) pode chegar a 10-12% de FPS, porque a APU deixa de limitar prematuramente.

Aplicado o ajuste no Smokeless UMAF, ao reiniciar você pode conferir que os novos limites foram gravados na NVRAM:

```terminal
$ ryzenadj -i | grep -E "STAPM LIMIT|TDC LIMIT|EDC LIMIT"
STAPM LIMIT:  20.000 W
TDC LIMIT VDD: 12.000 A
EDC LIMIT VDD: 160.000 A
```

Se os valores aparecerem como `15.000 W` / `10.000 A` / `150.000 A`, o ajuste não foi salvo — volte ao Smokeless UMAF e confirme a gravação com `F10`.

:::perigo
Passar de 25 W de PPT no Deck original é arriscado. O VRM entrega, mas o sistema de dissipação não foi projetado para evacuar mais que ~25 W de calor contínuo. Temperaturas da APU acima de 95°C sustentadas por minutos aceleram a degradação do silício.
:::

## Como cada limite se manifesta no jogo

Imagine uma cena pesada: muitos NPCs, draw distance longa, partículas. Ao longo de 30 segundos de renderização:

1. **Frame 0–200 ms**: o EDC permite pico de corrente para a GPU disparar o clock. Se EDC estiver baixo, esse pico não acontece e o clock sobe mais devagar.
2. **Segundos 0–5**: o PPT limita o consumo total. Se PPT = 15 W, a APU reparte a potência entre CPU e GPU — e uma pode roubar da outra.
3. **A partir do minuto 5**: o TDC limita a corrente sustentada, porque o VRM já está quente. Se TDC estiver baixo, o clock cai mesmo que a temperatura da APU ainda seja aceitável.

Aumentar o PPT sozinho, sem aumentar TDC e EDC, tem efeito limitado em cargas longas: o TDC baixo vira o gargalo depois de alguns minutos.

Para ver os três limites em tempo real durante um jogo, abra dois terminais: um com o jogo rodando, outro com o seguinte monitor:

```terminal
$ watch -n 1 'ryzenadj -i | grep -E "STAPM|TDC|EDC|TEMP"'
Every 1.0s: ryzenadj -i | grep -E "STAPM|TDC|EDC|TEMP"

STAPM LIMIT:  20.000 W   STAPM VALUE:  19.200 W
TDC LIMIT VDD: 12.000 A   TDC VALUE VDD: 11.450 A
EDC LIMIT VDD: 160.000 A  EDC VALUE VDD: 124.000 A
TEMP: 78.3 C
```

Quando o `STAPM VALUE` cola no `STAPM LIMIT` e a temperatura não paranormal, o gargalo é potência. Quando o `TDC VALUE` cola no `TDC LIMIT` com STAPM frouxo, o VRM já está quente e limitando corrente.

:::dica
Em jogos de corrida ou simuladores, onde o frametime é mais sensível, aumentar ligeiramente o EDC (de 150 A para 170 A) pode suavizar picos de frame-time sem alterar PPT nem TDC — pois o ganho é só no transitório.
:::

## Resumo

- PPT é o teto de potência total (W); TDC é corrente sustentada (A); EDC é corrente de pico (A).
- A APU respeita os três e para no primeiro limite que atingir, em qualquer instante.
- O Steam Deck sai de fábrica com STAPM/PPT de 15 W; subir para 20 W é seguro e traz ganho real.
- Ajustar os três juntos evita que o TDC vire gargalo após minutos de jogo.
- Nunca ultrapasse 25 W de PPT sem teste térmico rigoroso.

## Exercícios

1. Com o RyzenAdj, anote os valores de fábrica de PPT (Slow), TDC e EDC do seu Deck e compare com os defaults listados nesta seção.
2. Calcule: se o PPT é 15 W e a APU opera com VDD a ~1,1 V sob carga, qual é a corrente aproximada em A que fluiria? (Use I = P/V.) Compare com o valor de TDC.
3. Configure PPT = 20 W, TDC = 12 A, EDC = 160 A no Smokeless UMAF e rode um benchmark de 10 minutos. Anote FPS médio e temperatura máxima antes e depois.
4. Reduza apenas o EDC para 120 A, mantendo PPT = 20 W e TDC = 12 A. Descreva o que muda no frametime durante os primeiros segundos de carga.
5. **Desafio.** Investigue por que a Valve escolheu 15 W de STAPM e não 25 W, considerando que o VRM suporta a corrente mais alta. Relacione sua resposta com troca de calor na carcaça e conforto ao segurar o Deck.