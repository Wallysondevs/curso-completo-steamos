Enquanto o TDP define quanta energia o chip inteiro pode usar, o clock da GPU controla a velocidade com que os oito núcleos gráficos RDNA 2 operam. Como a maioria dos jogos no Deck é limitada pela GPU, esse número é a alavanca mais direta que você tem sobre FPS — e, diferente de desktops onde GPU e CPU são chips separados, aqui os dois disputam a mesma fatia de watts.

:::objetivos
- Entender a relação entre clock da GPU, voltagem e consumo
- Usar o menu rápido para fixar o clock da GPU no Modo Jogo
- Controlar o clock via MangoHud com a opção `GAMESCOPE_GPU_CLOCK`
- Verificar o clock atual via `/sys` e ferramentas de diagnóstico
:::

## GPU e CPU no mesmo cofre de watts

A APU do Steam Deck tem quatro núcleos de CPU e oito unidades de computação gráfica dentro do mesmo pacote, compartilhando o mesmo TDP. Quando um jogo puxa forte da GPU, a CPU recua; quando a física e a lógica de mundo saturam a CPU, a GPU perde espaço. É o fenômeno conhecido como **power sharing** entre CPU e GPU, e ele explica por que fixar o clock da GPU pode estabilizar o FPS mesmo sem aumentar o TDP.

Num PC de mesa, a placa de vídeo tem fonte própria e a CPU tem a dela; cada uma respeita seu próprio orçamento. No Deck não: os 15 W precisam servir aos dois. Se você fixar o clock da GPU em 1200 MHz com 10 W de TDP, está dizendo "quero 1200 MHz na GPU mesmo que a CPU tenha que encolher". Em jogos com física pesada, isso pode piorar o FPS em vez de melhorar. O oposto também acontece: em jogos de mundo aberto limitados pela GPU, travar o clock elimina as quedas de velocidade da GPU quando a carga na CPU oscila.

## Pelo menu rápido

O caminho mais prático está no mesmo menu de desempenho do Modo Jogo: `…` → desempenho → controle de **Clock da GPU**. Diferente do TDP (que é deslizante), aqui você escolhe um valor fixo: Desligado, 200 MHz, 400 MHz, … até 1600 MHz. A Valve oferece passos de 200 MHz porque a GPU RDNA 2 opera com intervalos discretos de multiplicador, e valores fora desses degraus são ignorados.

O que acontece quando você escolhe, digamos, 1200 MHz:

- A GPU tenta manter esse clock o tempo todo, consumindo a tensão necessária para sustentá-lo.
- O teto do TDP continua valendo — se o clock fixo exigir mais watts do que o TDP permite, a GPU desacelera sozinha, ignorando sua escolha.
- O clock da CPU passa a ser a "variável de ajuste": para caber no TDP, a CPU pode baixar seu próprio clock.

:::atencao
Fixar o clock da GPU **não** garante aquele clock; ele vira um alvo, não um contrato. Se a temperatura bater no limite (geralmente 95 °C na APU) ou o TDP não der conta, o hardware baixa o clock automaticamente. Por isso o TDP e o teto térmico precisam estar alinhados com o clock que você pede.
:::

## Via MangoHud

Fora do Modo Jogo, ou para ajustes mais finos nos parâmetros de lançamento de um jogo específico, o MangoHud é a ferramenta que traduz sua intenção de clock para o Gamescope. A variável de ambiente `GAMESCOPE_GPU_CLOCK` aceita o valor em MHz:

```terminal
$ GAMESCOPE_GPU_CLOCK=1200 mangohud %command%
```

Essa linha vai nos parâmetros de lançamento do jogo, nas propriedades dele na Steam. `%command%` é expandido pelo Steam Runtime para o binário real do jogo, e o `mangohud` injeta o overlay. O `GAMESCOPE_GPU_CLOCK=1200` só tem efeito dentro do Modo Jogo, porque o Gamescope é o compositor exclusivo dele — no Modo Desktop, essa variável é inofensiva.

Para verificar se o valor colou, o próprio MangoHud mostra o clock da GPU no overlay. Mas você também pode consultar o sistema de arquivos virtual do kernel, que expõe o clock em tempo real:

```terminal
$ cat /sys/class/drm/card0/device/pp_dpm_sclk
0: 200Mhz
1: 400Mhz
2: 600Mhz
3: 800Mhz
4: 1000Mhz
5: 1200Mhz *
6: 1400Mhz
7: 1600Mhz
```

O `*` ao lado de `1200Mhz` indica o degrau ativo. A lista completa mostra os oito níveis discretos que a GPU suporta — os mesmos passos que o menu rápido oferece. A GPU nunca opera em valores intermediários: se você pedir 1100 MHz, o hardware arredonda para o degrau mais próximo (no caso 1000 ou 1200).

## Quando fixar e quando não fixar

Fixar o clock da GPU é útil em cenários específicos, não como regra geral:

**Quando fixar:**
- Jogos com carga de CPU muito variável, onde a GPU sobe e desce o clock a cada frame, causando *stutter*.
- Títulos antigos ou emuladores cujo motor gráfico usa 30% da GPU mas oscila — travar em 400 MHz gasta menos energia que deixar a GPU "dar picos à toa".
- Gravação de gameplay ou streaming, onde você quer FPS estável e previsível, sem oscilações.

**Quando não fixar:**
- Jogos que alternam cenas indoor (GPU leve) e outdoor (GPU pesada): fixar baixo perde desempenho onde ele é necessário; fixar alto desperdiça energia onde não precisa.
- Jogos com limite de FPS já ativo: se o jogo está batendo 60 FPS estável, mexer no clock da GPU só vai aumentar o consumo, sem ganho de fluidez.
- Cenários onde a CPU é o gargalo: fixar a GPU não ajuda se o jogo é limitado por física e lógica.

:::dica
Combine TDP e clock da GPU em camadas: primeiro ajuste o TDP para o orçamento de bateria que você quer (por exemplo, 10 W), depois fixe o clock da GPU num valor que funcione dentro desse teto. Se o clock escolhido não couber nos 10 W, o sistema reduz o clock automaticamente — e você descobre o limite real, não o que pediu.
:::

## Lendo o clock em tempo real

Além do `pp_dpm_sclk`, o clock da GPU aparece em outras fontes do sistema. O `sensors` do pacote `lm_sensors` mostra temperaturas e clocks:

```terminal
$ sensors
k10temp-pci-00c3
Adapter: PCI adapter
Tctl:         +72.3°C

amdgpu-pci-0300
Adapter: PCI adapter
vddgfx:       +0.85 V
fan1:        3214 RPM
edge:         +71.0°C
slowPPT:      11.00 W
GPU Clock:    1200 MHz
```

O campo `GPU Clock` nessa saída vem direto do driver `amdgpu`, o mesmo que governa a GPU no kernel. É a fonte mais confiável fora do MangoHud porque não depende de overlay nenhum: é o kernel falando.

## Resumo

- No Deck, CPU e GPU compartilham o mesmo TDP; o clock da GPU é a alavanca mais direta para FPS.
- O menu rápido fixa o clock em passos de 200 MHz, os mesmos degraus discretos da GPU RDNA 2.
- `GAMESCOPE_GPU_CLOCK=1200` nos parâmetros de lançamento faz o mesmo via linha de comando.
- `cat /sys/class/drm/card0/device/pp_dpm_sclk` mostra o degrau ativo com `*`.
- `sensors` exibe GPU Clock, tensão vddgfx e potência slowPPT em tempo real.

## Exercícios

1. No Modo Jogo, fixe o clock da GPU em 1000 MHz e confira o valor ativo com `cat /sys/class/drm/card0/device/pp_dpm_sclk`.
2. Inicie um jogo 3D leve com o overlay do MangoHud exibindo o clock da GPU. Altere o clock para 800 MHz e depois para 1200 MHz e registre o impacto no FPS e no consumo mostrado.
3. Compare a saída de `sensors | grep 'GPU Clock'` com o `pp_dpm_sclk`. Os valores coincidem? Por que pode haver diferença?
4. Teste o mesmo jogo com clock da GPU automático e depois fixado. Em qual cenário o *frametime* é mais consistente?
5. **Desafio.** Com um jogo pesado rodando, fixe o clock da GPU em 1600 MHz e o TDP em 9 W. O clock sustentado de fato atinge 1600 MHz? Use `watch -n 1 'cat /sys/class/drm/card0/device/pp_dpm_sclk'` e `sudo ryzenadj --info` para explicar o que está limitando o quê.