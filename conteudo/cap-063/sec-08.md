O Deck no Windows é uma máquina aberta: você pode empurrar a APU para os 15 W de TDP da especificação ou limitá-la a 5 W para estender a bateria. O SDTPerformance dá acesso a esses controles que, no SteamOS, ficam dentro do quick menu — e ainda oferece overlay de telemetria que o SteamOS não expõe com essa granularidade.

:::objetivos
- Ajustar TDP, clocks de CPU e GPU pelo SDTPerformance
- Configurar um overlay de desempenho com FPS, temperaturas e clocks
- Entender o impacto do TDP na autonomia da bateria
- Ativar FSR (FidelityFX Super Resolution) pelo driver para ganhar quadros
- Criar perfis de desempenho por jogo

:::

## O que é TDP e por que importa no portátil

TDP (*Thermal Design Power*) é o teto de potência que a APU pode consumir. No Deck, o valor nominal é 15 W para a Aerith (chip Van Gogh do LCD) e algo similar na Sephiroth (OLED), mas a APU pode operar acima disso em rajadas curtas (boost). Limitar o TDP significa dizer ao chip: "não passe de X watts" — e cada watt a menos é minuto adicional de bateria.

O trade-off é direto: mais TDP = mais frames = menos bateria. Menos TDP = menos frames = mais autonomia. O SDTPerformance expõe o TDP em um slider:

```terminal
$ # No PowerShell, a leitura da APU mostra o consumo atual:
$ powercfg /energy /duration 5
```

Jogos 2D e indies não precisam de 15 W; 5 W bastam e dobram a duração da bateria. Jogos AAA empurram o teto e sugam a bateria em 90 minutos — saber ajustar por jogo é a diferença entre terminar uma sessão ou ficar no meio.

:::dica
O "ponto doce" de eficiência da APU do Deck LCD é entre 8 W e 10 W: acima disso o ganho de desempenho por watt adicional cai (é a região de *diminishing returns*). Abaixo de 5 W, jogos 3D começam a engasgar. Teste cada jogo e anote o TDP mínimo estável — sua bateria agradece.
:::

## O overlay de telemetria

O SDTPerformance desenha um OSD (*on-screen display*) sobre o jogo, alimentado pelo RTSS. Ele mostra FPS, uso de CPU e GPU em %, temperatura, clock da GPU em MHz, consumo da APU em watts e taxa de quadros 1% low (métrica de engasgo).

O overlay aparece e some com um atalho configurável (padrão `[[Ctrl+Win+H]]` via botão Steam + seta para cima) e o nível de detalhe é ajustável: do básico (só FPS) ao completo (todas as métricas).

```terminal
$ # O RTSS expõe a telemetria no tray:
$ tasklist | findstr RTSS
RTSS.exe                    12384 Console                    1      8.192 K
```

Antes e depois de mudar o TDP, compare a leitura de potência da APU para confirmar que o limite foi aplicado de verdade:

```terminal
$ # HWiNFO em modo sensor mostra o consommationo real da APU:
CPU Package Power: 9.7 W   (limitado a 10 W pelo SDT)
GPU Clock        : 1500 MHz
GPU Temperature  : 71 C
```

O campo `1% low` do overlay é o indicador de fluidez mais confiável. Se o FPS médio é 60 mas o 1% low é 18, você sente engasgos mesmo com a média alta — é sinal de que o TDP está baixo demais ou o clock da GPU está sendo cortado.

## Limitando FPS e temperatura

O SDTPerformance também oferece **framerate cap**: um limite suave de quadros por segundo que o RTSS impõe antes de a GPU renderizar o próximo frame. Cap em 30, 40 ou 60 FPS reduz o consumo porque a GPU não trabalha desnecessariamente para gerar quadros que o painel de 60 Hz nunca vai exibir.

A temperatura do chip é o termômetro final: acima de 90 °C o cooler acelera e o ruído sobe. Se a ventoinha está sempre no máximo, baixar o TDP ou o framerate cap alguns pontos reduz temperatura e ruído — e o SDTPerformance mostra isso em tempo real.

:::atencao
Limitar o TDP a valores muito baixos com o framerate cap desligado causa *stutter* severo: o clock da GPU oscila bruscamente entre o teto e o piso. Se for limitar TDP, ative também o framerate cap para estabilizar a entrega de quadros. Os dois controles são ligados — um sem o outro pode piorar a experiência.
:::

## FSR e o benefício do upscaling

O Steam Deck tem uma tela nativa de 1280×800. Rodar o jogo em 960×600 e aplicar FSR (FidelityFX Super Resolution) pelo driver AMD gera um ganho significativo de quadros com perda pequena de nitidez.

No SDTPerformance, o FSR é ativado com um toggle. O jogo precisa ser configurado para uma resolução abaixo da nativa (ex.: 960×600), e o FSR faz o upscale para 1280×800. Para jogos pesados, essa é a alavanca de desempenho mais barata, e funciona em qualquer título — não depende de o jogo ter suporte a FSR internamente, porque o upscale é feito no driver.

## Perfis de desempenho por jogo

O SDTPerformance permite salvar configurações por executável, assim como o SDTController: você define TDP, cap de FPS, clocks de GPU e overlay para cada jogo, e o SDT aplica automaticamente quando o processo entra em primeiro plano.

Isso reproduz o comportamento do SteamOS, onde cada jogo tem seu próprio perfil de TDP no quick menu. A diferença é que no Windows você tem granularidade maior e não depende de shader cache ou camada de tradução.

## Resumo

- TDP é o teto de potência da APU: mais watts = mais frames, menos bateria.
- O overlay do SDTPerformance (via RTSS) mostra FPS, temperatura, clocks e 1% low.
- Framerate cap reduz consumo e temperatura; combine com limite de TDP.
- O FSR no driver permite upscale de qualquer jogo, ganhando quadros.
- Perfis por jogo aplicam TDP, cap e clocks automaticamente.

## Exercícios

1. Ative o overlay do SDTPerformance e jogue por 10 minutos com todas as métricas visíveis. Anote FPS médio, 1% low e temperatura máxima.
2. Reduza o TDP de um jogo de 15 W para 8 W. Quanto caiu o FPS? Quanto subiu a autonomia estimada da bateria?
3. Ative o framerate cap em 30 FPS e compare a fluidez e o consumo com o mesmo jogo sem cap. O 1% low mudou?
4. Configure resolução 960×600 em um jogo pesado e ative FSR no SDTPerformance. Compare nitidez × FPS com a resolução nativa.
5. **Desafio.** Use o `powercfg /batteryreport` no PowerShell para gerar um relatório de bateria. Jogue com dois perfis diferentes (alto TDP e baixo TDP) e compare as curvas de descarga. O que a curva revela sobre o boost da APU?