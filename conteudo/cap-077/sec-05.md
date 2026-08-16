No Steam Deck, a performance em jogos é quase sempre limitada pela GPU integrada, não pela CPU. Os núcleos Zen 2 têm folga; a iGPU RDNA 2 (8 CUs) trabalha perto do teto o tempo inteiro. Por isso, o overclock que mais importa num Deck é o da GPU integrada — elevar o clock da iGPU acima do default de 1,6 GHz, quando o envelope de potência permitir. Esta seção mostra como, com segurança.

:::objetivos
- Entender por que a iGPU é o gargalo típico de jogos no Steam Deck
- Localizar e ajustar o clock da GPU integrada no Smokeless UMAF
- Equilibrar clock de GPU com os limites de potência já configurados
- Medir ganho real de FPS versus aumento de temperatura
:::

## A anatomia do gargalo

A iGPU RDNA 2 do Deck tem 8 compute units rodando a até 1,6 GHz por padrão. Em títulos pesados, ela fica a 100% de utilização enquanto os 4 núcleos Zen 2 raramente passam de 60-70%. Subir o clock da CPU traria quase nada; subir o da GPU ataca o gargalo real.

O teto efetivo do clock de iGPU não é fixo — ele é limitado por três forças que você já conhece: potência (PPT), temperatura e o próprio limite de clock gravado na BIOS. Elevar o clock só ajuda se houver potência e folga térmica sobrando.

```terminal
$ sudo ~/lab/ryzenadj/ryzenadj -i | grep -E "STAPM VALUE|TEMP"
STAPM VALUE: 14.100 W
TEMP: 71.0 C
```

Com consumo a 14 W e temperatura a 71°C, há folga para subir o clock: a APU não está limitada ainda.

## Ajustando o clock da iGPU

No Smokeless UMAF, vá para `Device Manager → AMD CBS → NBIO Common Options` e procure por `GFX Configuration` ou `GPU Clock Frequency`. Mude de `Auto` para `Manual` e defina a frequência em MHz:

```text
AMD CBS → NBIO Common Options
└── GFX Configuration
    └── GPU Clock Frequency  [1600 MHz → 1800 MHz]
```

Um overclock conservador e estável para a maioria dos Decks é **1800 MHz** (de 1600). Alguns chips aceitam 2000 MHz com undervolt agressivo e PPT alto, mas isso soma calor e reduz margem.

:::atencao
O campo de clock da GPU no Smokeless UMAF, em algumas revisões, usa uma unidade própria (não MHz direto). Verifique a unidade exibida na tela antes de digitar. Errar a unidade — digitar 18 em vez de 1800 — pode travar o display já que a iGPU alimenta a saída de vídeo.
:::

## O equilíbrio com potência

Overclock de iGPU sem potência sobrando é perda de tempo: o clock sobe, mas o PPT corta a corrente e o clock efetivo nunca atinge o valor configurado. A ordem correta é:

1. Configure PPT/TDC/EDC (seção 2) com folga.
2. Aplique undervolting (seção 4) para liberar calor.
3. Só então suba o clock da iGPU (esta seção).

Se você inverter a ordem, vai medir ganho zero e concluir que "não funciona".

:::dica
Monitore o clock **efetivo**, não o configurado. A AMD distingue o clock solicitado do clock real alcançado. Use `sudo ~/lab/ryzenadj/ryzenadj -i` ou, melhor, um overlay de jogo (MangoHud no SteamOS) para ver `GFX CLK` real durante a carga.
:::

## Medindo o ganho

Monte uma cena de benchmark reproduzível e meça antes/depois nos mesmos limites de potência. Use o contador de FPS integrado do SteamOS (Steam + botão `…` → Performance overlay).

```terminal
$ mangohud %command%   # dentro das opções de launch do jogo
```

Resultado típico ao subir a iGPU de 1600 para 1800 MHz com PPT em 20 W:

| Métrica | Antes (1600 MHz) | Depois (1800 MHz) |
|---|---|---|
| FPS médio | 41 | 46 |
| Clock iGPU real | 1598 MHz | 1785 MHz |
| Temperatura APU | 76°C | 82°C |
| Consumo | 14 W | 19 W |

O ganho de ~12% em FPS vem acompanhado de +6°C e +5 W. Se a temperatura estourar 90°C, o ganho some porque o throttling entra — nesse caso, volte o clock ou melhore o undervolt.

Durante o benchmark, verifique o clock real alcançado pela iGPU em tempo real:

```terminal
$ watch -n 1 'cat /sys/class/drm/card0/device/gpu_busy_percent; cat /sys/class/drm/card0/device/pp_dpm_sclk'
94
0: 250Mhz *
1: 400Mhz
2: 800Mhz
3: 1600Mhz
4: 1800Mhz
```

O arquivo `pp_dpm_sclk` lista os níveis de clock disponíveis para a iGPU; o asterisco `*` marca o nível ativo. Se o nível `1800Mhz` (o mais alto) está selecionado mas o `gpu_busy_percent` está em 99% e o FPS não subiu, a iGPU está esbarrando em outro limite — provavelmente potência, não clock.

:::info
O Steam Deck não tem a opção de ajuste fino de clock da iGPU por software no SteamOS: o `ryzenadj` controla apenas os limites de potência, não o relógio da GPU em modelos Aerith. Overclock de clock de GPU é feito via Smokeless UMAF (gravação na NVRAM).
:::

## Overclock de CPU: quando vale

Nos raros casos em que a CPU é o gargalo (jogos de estratégia, emulação de sistemas como RPCS3/Yuzu), subir o clock da CPU traz mais que mexer na iGPU. O caminho é o mesmo menu NBIO, em `Core Performance Boost` e nos limites de clock por núcleo. Mas no Deck, o ganho é pequeno e o custo térmico alto — a CPU compete com a iGPU pela mesma potência.

## Resumo

- A iGPU é o gargalo usual; overclock de GPU rende mais que o de CPU no Steam Deck.
- Clock de iGPU sobe no Smokeless UMAF em NBIO → GFX Configuration, de 1600 para ~1800 MHz.
- Overclock de GPU só funciona se houver folga de potência e térmica liberadas antes.
- Sempre compare o clock **efetivo** (não o configurado) e a temperatura após o ajuste.
- CPU e iGPU disputam o mesmo pacote de potência; priorize a GPU em jogos.

## Exercícios

1. Anote o clock da iGPU de fábrica (1600 MHz) e rode um benchmark de 5 minutos registrando FPS, clock real e temperatura.
2. Com PPT em 20 W, suba o clock da iGPU para 1800 MHz e rode o mesmo benchmark. Registre as três métricas e calcule o ganho percentual de FPS.
3. Eleve o clock para 1900 MHz e observe a temperatura. Se passar de 90°C, descreva o comportamento do clock real (sobe e cai?).
4. Use o MangoHud para exibir `GFX CLK` e `GPU Power` em tempo real e observe se o clock configurado é realmente atingido sob carga.
5. **Desafio.** Reproduza o mesmo overclock de iGPU com PPT mantido em 15 W (default). Explique por que o ganho é menor e relacione com o conceito de "primeiro limite atingido" da seção sobre PPT/TDC/EDC.