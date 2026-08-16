Se existe um argumento que faz qualquer dono de Steam Deck considerar o streaming, é este: a diferença de consumo entre rodar um jogo localmente e recebê-lo via rede é brutal — fator de 3× a 6×. A bateria que dura 1h40min no *Cyberpunk 2077* local pode passar de 7 horas via Moonlight.

:::objetivos
- Compreender o TDP da APU Van Gogh e como ele se traduz em consumo total do sistema
- Comparar o gasto energético de jogar localmente (renderização 3D) versus decodificar vídeo (streaming)
- Aprender a medir consumo, temperatura e TDP com MangoHud, sysfs e sensores
- Avaliar o impacto térmico de cada modo — ventoinha, temperatura da APU, conforto ao segurar
- Identificar os cenários reais em que a economia de bateria pesa mais que a latência do streaming
:::

## O TDP da APU: de onde vem o consumo

O coração do Steam Deck é a APU AMD Van Gogh (Aerith): CPU Zen 2 (4c/8t, 3.5 GHz) e GPU RDNA 2 (8 CUs, 1.6 GHz) no mesmo pacote. O TDP (*Thermal Design Power*) vai de **~4W a 15W** — e dita quase todo o consumo.

O TDP é controlado pelo driver `amd-pstate`. O valor do QAM é o limite térmico da APU, mas o consumo total soma tela (~2-3W), LPDDR5 (~2W), Wi-Fi/Bluetooth (~1-2W), SSD (~1-3W) e controladores.

A conta aproximada para o Deck LCD (40 Wh de bateria):

| Componente | Consumo típico (W) |
|---|---|
| APU (jogo pesado) | 10–15 |
| APU (streaming) | 2–4 |
| Tela (800p, ~200 nits) | 2–3 |
| RAM + controladores | 2–3 |
| Wi-Fi ativo | 1–2 |
| SSD (leitura/escrita) | 1–3 |
| Ventoinha (carga alta) | 0.5–1 |

Some tudo e você tem ~18–25W jogando localmente contra ~7–10W fazendo streaming. Divida 40 Wh por esses números e a matemática aparece.

```terminal
## Lendo os limites de TDP da APU
$ cat /sys/class/hwmon/hwmon4/power1_cap
15000000
## 15.000.000 microwatts = 15W (TDP máximo configurado)

$ cat /sys/class/hwmon/hwmon4/power1_average
11234567
## ~11.2W sendo consumidos agora pela APU (jogo rodando)
```

:::info
O arquivo `power1_cap` mostra o teto em **microwatts** (divida por 1.000.000 para watts). O `power1_average` é a leitura instantânea do consumo da APU — o "quanto está gastando agora".
:::

## Jogar localmente: a APU no limite

Quando você roda um AAA no Deck — nativo ou Proton — CPU e GPU disputam o orçamento de 15W. Em *Cyberpunk 2077*, GPU consome ~12W, CPU ~3W; em *Cities: Skylines*, inverte.

O consumo total fica entre **18 e 25 watts**:

- **Jogo pesado (25W)**: ~1h36min
- **Jogo médio (20W)**: ~2h
- **Jogo leve / indie (12W)**: ~3h20min

AAA moderno raramente passa de 2 horas. O MangoHud mostra TDP, watts, temperatura e ventoinha ao vivo.

```terminal
## Instalar e configurar MangoHud no Steam Deck
$ sudo steamos-readonly disable
$ sudo pacman -Sy mangohud
## Depois, adicione como opção de lançamento no jogo:
## mangohud %command%

## Rodando um jogo com overlay completo de energia
$ mangohud --config=full glxgears
## (no Steam, basta colocar: mangohud %command% nas propriedades do jogo)
```

Com o overlay ativo, os números típicos em *Elden Ring* (local, médio, 30 FPS):

```terminal
## Exemplo do overlay MangoHud durante jogo local
## (valores típicos de Elden Ring no Deck)
GPU: 98%  1.2GHz  |  CPU: 45%  2.8GHz
TDP: 12.8W  |  GPU: 10.2W  |  CPU: 2.6W
TEMP: 78°C  (junc: 82°C)  |  FAN: 5200 RPM
BATT: 67%  |  22.3W total  |  1h 12min restante
FPS: 30  |  frame: 33.3ms
```

Note: **22.3W total**, **78°C**, ventoinha a **5200 RPM**. A estimativa de 1h12min restante confere: 26.8 Wh restantes ÷ ~22W ≈ 1.2 horas. O Deck trabalha no limite térmico.

### Medindo pela bateria diretamente

O sysfs expõe a bateria em tempo real:

```terminal
## Lendo dados brutos da bateria (BAT1 no Deck LCD)
$ cat /sys/class/power_supply/BAT1/current_now
5890000
## 5.890.000 µA = 5.89 A sendo drenados agora

$ cat /sys/class/power_supply/BAT1/voltage_now
7660000
## 7.660.000 µV = 7.66 V (tensão da bateria)

## Potência instantânea: P = V × I
## 7.66V × 5.89A ≈ 45.1W... ops, esse é o carregador!
## Com bateria descarregando, a corrente aparece negativa:
$ cat /sys/class/power_supply/BAT1/current_now
-2890000
## -2.89 A → P = 7.66V × 2.89A ≈ 22.1W de descarga
## Confere com o MangoHud!
```

:::dica
**Watt = Volt × Ampère**. No Deck, a bateria opera a ~7.7V nominal. Corrente negativa significa descarregando; positiva, carregando. Um script `batstat` faz essa conta automaticamente.
:::

## Streaming: o Deck vira um decodificador de vídeo

Agora o cenário oposto: você abre o Moonlight e inicia *Cyberpunk 2077* no ultra com ray tracing. O Deck recebe um stream HEVC 800p a 60 FPS — e a GPU 3D fica **praticamente ociosa**.

O chip Van Gogh tem um bloco dedicado (ASIC) para decodificar H.264, HEVC e VP9 — um circuito fixo e extremamente eficiente: decodificar HEVC 800p60 consome **menos de 1W adicional**. A CPU mal sai do idle.

O consumo total cai para **~5–8W**:

- APU: 2–4W (decode de vídeo + CPU idle)
- Tela: 2–3W
- Wi-Fi: 1–2W (tráfego constante, ~15 Mbps)
- RAM/controladores: ~2W
- Ventoinha: ~0W (passiva ou rotação mínima)

Com 40 Wh: **5 a 7 horas contínuas**.

O overlay do MangoHud durante streaming confirma a brutalidade da diferença:

```terminal
## MangoHud durante streaming via Moonlight (Cyberpunk 2077 no ultra)
GPU: 12%  0.4GHz  |  CPU: 8%  1.2GHz
TDP: 3.1W  |  GPU: 0.8W  |  CPU: 2.3W
TEMP: 42°C  (junc: 45°C)  |  FAN: 0 RPM
BATT: 89%  |  6.8W total  |  5h 14min restante
FPS: 60  |  frame: 16.7ms  |  decode: 2.1ms
```

Compare linha a linha com o *Elden Ring* local: TDP **12.8W → 3.1W**, temperatura **78°C → 42°C**, ventoinha **5200 RPM → 0 RPM**, bateria estimada **1h12min → 5h14min**. O jogo está visualmente *melhor* (ultra + RT), e o Deck, frio e silencioso.

:::exemplo
**Caso extremo — Cyberpunk 2077**: rodando localmente no Deck (low, FSR equilibrado, 30 FPS), o sistema consome ~22W e a bateria dura ~1h50min. O mesmo jogo via Moonlight do PC gamer (ultra, RT, 60 FPS) consome ~7W no Deck e a bateria dura ~5h40min. **Fator 3.1× de economia** — e você ainda joga com qualidade visual impossível no hardware local. Se for cloud (GeForce Now), o consumo é similar (~6-8W), mas a latência sobe.
:::

### O segredo: decode ASIC vs renderização 3D

Por que a diferença é tão grande? A resposta está na arquitetura do silício.

Renderizar um frame 3D exige milhares de núcleos shader em paralelo, acessando texturas e calculando iluminação. Cada frame de *Cyberpunk 2077* mobiliza as 8 CUs a ~1.6 GHz, ~12W só nisso.

Decodificar HEVC usa um bloco fixo que só descomprime vídeo — sem shaders, texturas ou paralelismo. É um circuito dedicado, ordens de grandeza mais barato.

**Analogia**: renderizar 3D é cozinhar do zero; decodificar vídeo é micro-ondas.

## Calor, ventoinha e conforto

Consumo elétrico vira calor. Cada watt consumido dentro do Deck precisa ser dissipado pelo heat pipe, pela ventoinha e pela carcaça.

### Jogando localmente

Com ~22W de consumo, a APU atinge **70–85°C** (junção), a ventoinha gira a **4500–6200 RPM** e o ar sai a **~45–55°C**. A carcaça central fica morna (38–42°C), perceptível nas mãos. O ruído é audível — especialmente nos LCD com ventoinha Delta.

```terminal
## Temperaturas via lm_sensors
$ sensors | grep -E "edge|junction|fan"
iwlwifi_1-virtual-0
Adapter: Virtual device
temp1:        +38.0°C  

nvme-pci-0100
Adapter: PCI adapter
Composite:    +48.0°C  

amdgpu-pci-0400
Adapter: PCI adapter
edge:         +56.0°C  
junction:     +63.0°C  
## ↑ 63°C na junção — modo leve / idle após streaming

## Agora durante jogo local pesado:
amdgpu-pci-0400
Adapter: PCI adapter
edge:         +74.0°C  
junction:     +82.0°C  
fan1:        5489 RPM
## ↑ 82°C na junção, ventoinha a 5489 RPM
```

### Jogando via streaming

Com ~6–8W, o Deck mal aquece: APU em **40–50°C**, ventoinha **parada ou mínima** (0–2000 RPM, inaudível), carcaça fria. Você joga por horas sem calor nem ruído.

Implicações práticas:

- **Jogar na cama**: streaming não incomoda parceiro(a) — zero ruído, zero calor
- **Clima quente**: jogo local esquenta mais no verão; streaming ignora o ambiente
- **Sessões longas**: o conforto do streaming é idêntico na hora 1 e na hora 5

:::atencao
**Nem pense em tampar as saídas de ar**. No jogo local, o Deck precisa expelir calor ativamente. Apoiar em travesseiro ou coberta bloqueia as entradas e causa thermal throttling — a APU reduz frequência para não superaquecer. No streaming é menos crítico, mas mantenha as aberturas livres.
:::

## Quando a bateria importa mais que a latência

A decisão entre local e streaming é situacional. O consumo vira o fator dominante em cenários específicos.

### Viagens longas (avião, trem, ônibus interestadual)

Num voo de 6 horas, *Elden Ring* local morre em ~2h e streaming é inviável. **Estratégia**: jogos leves — *Hades*, *Dead Cells*, *Stardew Valley* — que consomem 8–12W e entregam 3–5 horas. No trem com 4G/5G instável, cloud é arriscado; local é mais seguro.

### Jogatinas na cama ou sofá (casa, mesma rede)

PC no escritório, Deck na cama: Moonlight entrega a melhor qualidade com **zero ruído e zero calor**, bateria que dura a noite toda.

### Sessões casuais longas (domingo chuvoso)

Se você quer passar a tarde inteira jogando sem se preocupar com tomada, o streaming resolve. No modo local, você pararia para recarregar a cada 2 horas.

### Situações sem acesso a tomada (parque, praia, acampamento)

Sem tomada e sem Wi-Fi, o streaming é inviável — local é a única escolha. TDP 8–10W, FPS 30, brilho 50%: *Hades* estica para ~4 horas.

### O trade-off fundamental

| Situação | Melhor modo | Bateria | Por quê |
|---|---|---|---|
| Voo / transporte offline | Local (indie/leve) | 3–5h | Sem rede, baixo consumo |
| Casa, PC gamer ligado | Streaming local | 5–7h | Qualidade + conforto |
| Casa, sem PC, tomada perto | Local (AAA) | 1.5–2h | Hardware aproveitado |
| Casa, sem PC, sem tomada | Local (indie) | 3–5h | Economia forçada |
| Café / hotel, Wi-Fi ok | Cloud ou local | 3–7h | Cloud se a rede aguentar |
| Qualquer lugar com 5G bom | Cloud | 6–7h | Bateria máxima, franquia de dados |

:::dica
**Regra prática**: tomada por perto + latência mínima → jogue local. Longe da tomada ou qualidade máxima → streame. Sem rede → local com TDP reduzido.
:::

## Resumo

- O TDP da APU Van Gogh vai de ~4W a 15W; localmente, o sistema consome 18–25W totais (1.5–3h de bateria)
- No streaming, a APU usa o decodificador ASIC (<1W); o sistema cai para 5–8W totais (5–7h de bateria)
- A diferença entre renderizar 3D e decodificar vídeo pode chegar a **6×**, pois o ASIC é muito mais eficiente que os shaders
- MangoHud, sysfs (`current_now`/`voltage_now`) e `sensors` medem TDP, consumo e temperatura em tempo real
- Local esquenta o Deck a 70–85°C com ventoinha audível; streaming mantém 40–50°C e silêncio
- Viagens pedem jogos locais leves; sessões em casa pedem streaming para conforto máximo

## Exercícios

1. Com o MangoHud, abra um AAA e depois um indie 2D. Anote TDP, temperatura da junção, RPM e bateria estimada em cada caso. Calcule a diferença percentual de consumo.

2. Leia `/sys/class/power_supply/BAT1/current_now` e `voltage_now` durante jogo pesado e durante streaming. Multiplique para obter os watts. Os valores batem com o MangoHud?

3. Reduza o TDP no QAM para 8W, limite FPS a 30 e jogue um AAA por 15 minutos. Compare temperatura e ruído com o TDP aberto (15W). Valeu a economia de bateria?

4. Simule uma "sessão de cama": streame via Moonlight por 30 minutos e depois jogue o mesmo jogo localmente por 30 minutos. Compare calor na carcaça, ruído e percentual de bateria gasto.

5. **Desafio integrador**: Planeje uma viagem de 8 horas de ônibus interestadual com o Deck e um power bank de 45W/74 Wh (uma recarga durante o trajeto). Monte um "cardápio" de jogos maximizando as horas de diversão: quais em modo local, quais em streaming (se houver 5G) e em que momentos recarregar. Apresente a conta de Wh consumidos e justifique cada escolha.