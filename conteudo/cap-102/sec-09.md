O Steam Deck entrega performance de jogo numa APU de 15 W, e isso só é possível porque cada watt é disputado entre CPU, GPU e orçamento térmico. As ferramentas de monitoramento e ajuste — MangoHud, governor da CPU, TDP manual e gerenciamento de energia da GPU — formam um painel de controle que, dominado, faz a diferença entre 1h30 e 4h de bateria num jogo AAA. Nesta seção, cada termo desse ecossistema de desempenho ganha uma definição precisa e o contexto de como o Deck o usa.

:::objetivos
- Usar o MangoHud e entender os níveis de overlay de performance do Deck
- Compreender frametime, frame pacing e o papel do limitador de FPS
- Identificar o governor da CPU e a política de escalonamento ativa
- Entender DPM da GPU, thermal throttling e limite manual de TDP
- Monitorar temperatura, clocks e energia via `/sys` e `sensors`
:::

## MangoHud e MangoApp: o overlay de performance

O **MangoHud** é um overlay de monitoramento específico para jogos rodando em Vulkan e OpenGL. Ele desenha, por cima do jogo, informações como **FPS** (quadros por segundo), **frametime** (tempo de cada quadro em milissegundos), uso e temperatura de CPU e GPU, consumo de RAM e VRAM, além de clock da GPU e uso de bateria. É o equivalente, no mundo Linux, do MSI Afterburner + RTSS no Windows.

No Deck, o MangoHud é acionado pelo botão "…" (três pontinhos), na opção **Performance overlay**. A Valve integrou o MangoHud ao sistema e definiu **quatro níveis** progressivos de detalhe. O nível 1 mostra só FPS; o nível 2 adiciona frametime; o nível 3 entra com CPU, GPU e RAM; e o nível 4 é a visão completa, com clocks, temperaturas e até gráfico de frametime em tempo real.

```terminal
$ mangohud vkcube
$ mangohud --dlsym %command%
```

O primeiro exemplo roda um cubo Vulkan de demonstração com o MangoHud por cima. O segundo mostra a flag típica que você coloca nas opções de lançamento de um jogo na Steam: `mangohud --dlsym %command%`. O `--dlsym` é um método de injeção alternativo que contorna alguns problemas com jogos que usam carregamento dinâmico.

O **MangoApp** é a aplicação da Valve que configura esse overlay — é o frontend gráfico que você enxerga no painel de performance. Ele comunica com o MangoHud via um socket e permite ligar/desligar o overlay e escolher o nível de detalhe sem editar arquivos de configuração manualmente. No modo desktop, o MangoApp também aparece como um aplicativo independente.

:::dica
O MangoHud tem um arquivo de configuração, `~/.config/MangoHud/MangoHud.conf`, onde você pode afinar cada métrica e posicionar o overlay. Mas no Deck, o MangoApp sobrescreve parte dessas configurações. Para personalizações que não brigam com a Valve, edite o conf e veja o que persiste entre sessões de jogo.
:::

## Frametime, frame pacing e limitador de FPS

O **frametime** é o tempo que a GPU levou para renderizar um único quadro, medido em milissegundos. Ele é a métrica mais importante de suavidade — mais importante que o FPS médio. A razão: você pode ter 60 FPS de média e ainda assim sentir travadas, porque a média esconde picos. Se 59 quadros saíram em 10 ms e um saiu em 55 ms, a média ainda dá ~16,7 ms (60 FPS), mas aquele quadro de 55 ms foi sentido como um congelamento de três quadros.

O **frame pacing** é a **uniformidade** dos frametimes. Um pacing perfeito significa que cada quadro entrega exatamente o mesmo intervalo — todos a 16,7 ms para 60 FPS. É o pacing que faz o jogo parecer "liso" mesmo em FPS mais baixo; e é a falta de pacing que faz um jogo a 45 FPS médios parecer pior que um a 30 FPS travados.

O **limitador de FPS** (FPF, *frame limiter*) é a ferramenta que resolve isso. Ele impõe um teto: 30, 40 ou 60 FPS. A vantagem não é só suavidade — é também bateria. Limitar a 30 FPS em vez de deixar a GPU disparar a 60 economiza watts que viram minutos de bateria. No Deck, o limitador está no mesmo painel de performance, ao lado do overlay.

:::info
O Deck tem tela com **VRR** (FreeSync), então limitar a 40 FPS ou 50 FPS é perfeitamente viável e suave — o painel ajusta a taxa de atualização para casar com o FPS. O "ponto doce" de muitos jogos no Deck é 40 FPS: está no meio do caminho entre 30 (fluidez mínima) e 60 (custo energético alto), e com VRR parece muito melhor do que 30.
:::

## CPU governor e escalonamento de frequência

O **CPU governor** é a política que decide a **frequência do processador** a cada instante. O kernel do Linux oferece vários governors; os três mais relevantes no Deck são:

- **performance**: a CPU fica na frequência máxima o tempo todo. Rápido, mas consome bateria.
- **powersave**: a CPU fica na frequência mínima o tempo todo. Econômico, mas lento.
- **schedutil**: o governor padrão do Deck, que delega a decisão ao escalonador de processos. A frequência sobe quando há demanda e desce quando não há.

```terminal
$ cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor
schedutil
$ cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_available_governors
performance powersave schedutil
$ cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq
1800000
```

A primeira linha confirma o `schedutil` como governor ativo no Deck. A segunda lista os governors **disponíveis** nesse kernel e hardware. A terceira lê a frequência atual — 1,8 GHz — que sobe e desce dinamicamente conforme o `schedutil` decide. O **scaling driver** (o `cpufreq` da AMD) é quem executa a troca de frequência, obedecendo ao governor.

O `schedutil` é o melhor compromisso para um portátil: ele reage em microssegundos (porque o escalonador já tem a informação de carga) e não desperdiça energia quando o Deck está ocioso. Você pode trocar temporariamente para `performance` escrevendo no mesmo arquivo virtual, mas o SteamOS reaplica o `schedutil` a cada boot.

```terminal
$ grep MHz /proc/cpuinfo | head -4
cpu MHz         : 1397.000
cpu MHz         : 1397.000
cpu MHz         : 2800.000
cpu MHz         : 2800.000
```

O `/proc/cpuinfo` mostra a frequência por núcleo lógico. No exemplo, dois núcleos estão em 1,4 GHz (baixa demanda) e dois em 2,8 GHz (trabalhando). É o `schedutil` ajustando núcleo a núcleo em tempo real — um refinamento que o governador `performance` não faria.

## DPM, thermal throttling e TDP manual

O **DPM** (*Dynamic Power Management*) é o equivalente do governor, mas para a **GPU AMD**. Ele gerencia os estados de clock do chip gráfico: `auto` deixa o driver decidir com base na carga; `low` e `high` forçam o clock mínimo ou máximo; e `manual` permite controle fino. No Deck, o padrão é `auto`.

```terminal
$ cat /sys/class/drm/card0/device/power_dpm_force_performance_level
auto
```

A GPU fica em `auto`, e o driver AMD sobe e desce o clock conforme a cena do jogo. Forçar `high` pode estabilizar um jogo que sofre com oscilação, mas come bateria sem dó. O campo `card0` é a GPU integrada (a APU Van Gogh); máquinas com dGPU teriam `card1`.

O **thermal throttling** é o mecanismo de proteção térmica: quando a temperatura da APU atinge o limite, o firmware **reduz os clocks** para evitar dano. No Deck, o throttle começa por volta dos 90-95 °C, e o desligamento de emergência ocorre perto dos 100 °C. É normal o Deck operar entre 70 e 85 °C sob carga pesada; o importante é que o clock **não** esteja sendo cortado (throttling).

```terminal
$ sensors
amdgpu-pci-0400
Adapter: PCI adapter
vddgfx:      800.00 mV
fan1:        4500 RPM
edge:         +78.0°C
junction:     +85.0°C
mem:          +70.0°C
PPT:          15.00 W
```

O `sensors` (do pacote `lm-sensors`) lê os sensores da APU. A `edge` é a temperatura da borda do chip (a mais citada), a `junction` é o ponto quente (sempre mais alta), e `PPT` é o consumo total do pacote em watts — 15 W é o limite padrão do Deck. O `fan1` a 4500 RPM com 78 °C é um perfil de ventilador típico do Deck sob jogo.

O **TDP limit** (limite manual de TDP) é exatamente o que o nome sugere: você configura, no painel de performance do Deck, um teto de **potência da APU** menor que o padrão. Baixar de 15 W para 10 W, por exemplo, aumenta a duração da bateria — e com FSR ativo e limite de 30 FPS, muitos jogos AAA rodam perfeitamente aceitáveis nessa faixa. É a combinação de TDP + FSR + limitador de FPS que define o orçamento energético da sua sessão.

```terminal
$ cat /sys/class/drm/card*/device/hwmon/hwmon*/temp1_input
78000
```

O `temp1_input` em `/sys` reporta a temperatura em **miligraus Celsius** — o valor `78000` é 78,0 °C, casando com o que vimos no `sensors`. A diferença é que `/sys` é lido direto do kernel, sem dependência de `lm-sensors`, e está sempre disponível.

:::perigo
Forçar `power_dpm_force_performance_level` para `high` com o Deck sem ventilação adequada (ex.: jogando debaixo de um cobertor) pode levar ao throttling em minutos. O TDP manual baixo é seguro; forçar clocks é seguro só para diagnóstico. A Valve já escolheu o `auto` por bons motivos.
:::

## FSR e upscaling como aliados do TDP

O **FSR** (*FidelityFX Super Resolution*), que já apareceu na seção sobre Gamescope, merece uma menção aqui pelo seu papel na equação de desempenho. Ao reduzir a resolução interna de renderização e deixar o Gamescope fazer o upscaling, você reduz a carga na GPU — e, portanto, o consumo. Um jogo renderizando internamente a 960×600 com FSR consome menos watts do que o mesmo jogo a 1280×800 nativo. Combinado com o TDP manual, o FSR é um multiplicador de bateria: menos resolução → menos watts → mesma carga de bateria dura mais horas.

Essa conexão fecha o círculo dos termos de desempenho: o **MangoHud** mostra o que está acontecendo, o **governor** decide a frequência de CPU, o **DPM** gerencia a GPU, o **TDP limit** impõe o teto, o **limitador de FPS** impõe o pacing, e o **FSR** reduz o custo base. Dominar cada um é dominar quantas horas de Elden Ring cabem entre uma tomada e outra.

## Resumo

- O MangoHud é o overlay de FPS, frametime, CPU, GPU e temperatura; o Deck o expõe em quatro níveis pelo painel de performance.
- Frametime mede o tempo de cada quadro; frame pacing é a uniformidade dos frametimes; o limitador de FPS estabiliza o pacing e economiza bateria.
- O CPU governor `schedutil` ajusta a frequência dinamicamente por demanda, lido em `/sys/devices/system/cpu/cpu0/cpufreq/`.
- DPM `auto` gerencia clocks da GPU; `sensors` e `/sys/class/drm/.../temp1_input` monitoram temperatura e evitam thermal throttling.
- O TDP manual (painel de performance) limita a potência da APU; combinado com FSR e limitador de FPS, maximiza a bateria.
- Cada peça — MangoHud, governor, DPM, TDP, limitador e FSR — é um controle independente do mesmo orçamento de watts.

## Exercícios

1. Rode `cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor` e confirme que o governor é `schedutil`. Liste os governors disponíveis e explique, numa frase, o que cada um faria.
2. Execute `sensors` num momento de carga (jogo aberto) e compare as temperaturas `edge` e `junction`. Qual é a diferença e por que a `junction` é sempre mais alta?
3. Leia `cat /sys/class/drm/card0/device/power_dpm_force_performance_level` e confirme que a GPU está em `auto`. Qual é o efeito teórico de trocar para `high`?
4. Abra um jogo, ative o overlay nível 4 e observe frametime e clock da GPU por 2 minutos. Identifique um pico de frametime e anote o que mais mudou naquele momento (clock da GPU, temperatura, uso de CPU).
5. **Desafio.** Combine TDP manual (10 W), limitador de FPS (40 FPS) e FSR (960×600) num jogo pesado. Monitore com MangoHud nível 4 e documente: temperatura, frametime médio e potência reportada em watts. Compare com o mesmo jogo sem restrições e explique a economia de bateria em termos de cada termo desta seção.