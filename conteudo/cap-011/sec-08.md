O Steam Deck é, antes de tudo, um aparelho portátil — e a bateria é o recurso mais escasso de todos. Um jogo pode rodar lindo, mas se drena a carga em quarenta minutos, a experiência está incompleta. O nível 4 do overlay revela o consumo em tempo real, permitindo enxergar exatamente quanto cada jogo e cada configuração custam em energia.

:::objetivos
- Ler o consumo energético e a porcentagem de bateria no overlay
- Entender a relação entre TDP, calor e duração de bateria
- Estimar a duração da bateria a partir do consumo em watts
- Usar o limite de potência para maximizar a autonomia
:::

## O que o nível 4 mostra de energia

O nível 4 do overlay é o único que traz as métricas de energia, e elas aparecem em duas formas complementares: a **porcentagem de bateria** restante e o **consumo instantâneo em watts**. Alguns builds do SteamOS também mostram uma estimativa de tempo restante e a tensão da bateria.

```terminal
$ # Leitura tipica do nivel 4 durante jogo pesado:
$ # Bateria 74% | consumo 22.4 W | FPS 52
$ #
$ # Durante jogo leve (travado a 40 FPS):
$ # Bateria 74% | consumo 9.1 W  | FPS 40
```

O consumo em watts é o dado mais valioso, porque a partir dele você calcula a duração. O Deck tem uma bateria de aproximadamente 40 Wh (watt-hora) na versão original. A conta é direta: divida a capacidade pelo consumo.

```terminal
$ # Calculo de autonomia (bateria de ~40 Wh):
$ # consumo 20 W -> 40 Wh / 20 W = 2.0 horas
$ # consumo 10 W -> 40 Wh / 10 W = 4.0 horas
$ # consumo 7 W  -> 40 Wh / 7 W  = 5.7 horas
$ # consumo 25 W -> 40 Wh / 25 W = 1.6 horas
```

A regra mental: **a 20 W, o Deck dura cerca de 2 horas; a 10 W, cerca de 4 horas.** Todo watt que você economiza de consumo se converte diretamente em minutos de jogo.

:::nota
A capacidade da bateria do Steam Deck é de 40 Wh no modelo LCD e levemente reduzida/diferente no OLED, mas na mesma ordem de grandeza. O consumo total do aparelho inclui tela, áudio, Wi-Fi e o próprio SoC. O número em watts do overlay reflete essencialmente o consumo do SoC (a APU), que é o grande vilão em jogos — a tela representa uma fatia bem menor.
:::

## TDP: o botão que controla tudo

O TDP (Thermal Design Power) é o limite de potência que você permite que a APU consuma. No painel de desempenho do Modo Jogo, há um controle deslizante que vai de uns 3 W até 15 W (o máximo do Deck). Baixar o TDP reduz consumo e calor, mas também reduz o desempenho — é um trade-off que você controla manualmente.

```terminal
$ # Impacto do TDP no mesmo jogo (Midori em cena aberta):
$ # TDP 15 W -> FPS 60 | consumo 21 W | temp 84 C | bateria ~1.9 h
$ # TDP 10 W -> FPS 49 | consumo 14 W | temp 72 C | bateria ~2.8 h
$ # TDP 6 W  -> FPS 30 | consumo 9 W  | temp 61 C | bateria ~4.4 h
```

Repare como o mesmo jogo passa de "2 horas" para "4,4 horas" só limitando o TDP, em troca de cair de 60 para 30 FPS. Para muitos jogos — especialmente os de ritmo lento, como RPGs e aventuras gráficas — 30 FPS estáveis são uma troca excelente por dobro de autonomia.

:::dica
O TDP é sua alavanca mais poderosa de autonomia, mais até que baixar brilho ou desligar Wi-Fi. Em jogos com cenas calmas, trave o FPS em 30 ou 40 e empurre o TDP para baixo até o jogo começar a perder estabilidade — depois devolva um pouco. Esse procedimento encontra o "ponto doce" entre desempenho e bateria.
:::

## Lendo o consumo em tempo real no Desktop

No Modo Desktop, a bateria e o consumo também são acessíveis por terminal, através dos arquivos virtuais que o kernel expõe em `/sys/class/power_supply`.

```terminal
$ cat /sys/class/power_supply/BAT1/capacity
74
$ cat /sys/class/power_supply/BAT1/status
Discharging
$ cat /sys/class/power_supply/BAT1/power_now
23040000
```

Os valores explicam-se assim: `capacity` é a porcentagem (74%); `status` mostra se está carregando ou descarregando; `power_now` é a potência em **microwatts** — 23040000 µW = 23,04 W. Para converter em watts, divida por um milhão.

```terminal
$ # Convertendo microwatts para watts:
$ echo "scale=1; $(cat /sys/class/power_supply/BAT1/power_now) / 1000000" | bc
23.0
```

Esses arquivos permitem scriptar seu próprio monitor de bateria, sem depender do overlay. É a mesma fonte que o nivel 4 consome.

## Estimando autonomia de verdade

O overlay dá um número instantâneo, mas a duração real depende do perfil de uso. Um número instantâneo de 20 W num momento de explosão não representa a média de um jogo que fica em 9 W nos momentos calmos. Para estimar de verdade, observe o consumo médio em 10–15 minutos de jogo típico.

```terminal
$ # Metodologia para estimar autonomia:
$ # 1. Jogue por 15 min representativos (combate, exploracao, menus)
$ # 2. Anote o consumo medio (nao o pico)
$ # 3. Divida 40 pela media: 40 / media = horas de jogo
$ # Exemplo: media 11.5 W -> 40 / 11.5 = 3.5 horas
```

:::atencao
Não confie na estimativa de "tempo restante" que alguns overlays mostram: ela oscila muito com picos instantâneos e engana. O número confiável é o **consumo médio**, medido por você ao longo de alguns minutos, dividido pela capacidade da bateria.
:::

## A bateria e o calor andam juntos

Não há como falar de bateria sem lembrar da seção anterior: consumo (watts) e temperatura (graus) são o mesmo fenômeno visto de dois ângulos. A quase totalidade da energia que a APU consome vira calor. Por isso, tudo o que você faz para economizar bateria (baixar TDP, travar FPS) também esfria o aparelho — e tudo o que esquenta o Deck também gasta bateria.

```terminal
$ # Duas faces da mesma moeda:
$ # TDP alto  -> mais consumo (W) + mais calor (C) + menos bateria
$ # TDP baixo -> menos consumo (W) + menos calor (C) + mais bateria
```

Isso encerra um ciclo virtuoso: travar o FPS baixa o consumo, que baixa a temperatura, que reduz o ruído da ventoinha e aumenta a autonomia — tudo com um único ajuste.

## Resumo

- O nível 4 mostra a porcentagem de bateria e o consumo instantâneo em watts.
- A autonomia se calcula dividindo a capacidade (~40 Wh) pelo consumo: 20 W ≈ 2 h, 10 W ≈ 4 h.
- O TDP é o limite de potência da APU e é a alavanca mais forte de economia de energia.
- No Desktop, os arquivos em `/sys/class/power_supply/BAT1/` expõem capacidade e `power_now` em microwatts.
- Consumo e calor são o mesmo fenômeno: reduzir um reduz o outro.

## Exercícios

1. No nível 4, registre o consumo em watts em três cenários (menu, exploração, combate) e calcule a média.
2. Trave o FPS em 30 e depois em 60 num jogo, anotando a diferença de consumo em watts entre os dois.
3. Abaixe o TDP progressivamente (15 → 10 → 6 W) e anote FPS, watts e temperatura em cada patamar.
4. No Desktop, leia `capacity` e `power_now` de `/sys/class/power_supply/BAT1/` e converta a potência para watts.
5. **Desafio.** Calcule a autonomia real de um jogo: jogue 15 minutos representativos, meça a média de consumo, e compare o resultado com uma estimativa baseada só no pico. Explique por que o pico engana, conectando com a ideia de média vs. instantâneo das seções 3 e 4.