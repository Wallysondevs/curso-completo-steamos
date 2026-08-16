A latência de entrada é o calcanhar de Aquiles de qualquer streaming de jogos. Entre apertar um botão e ver a reação na tela do Deck, o sinal precisa viajar do controle ao PC, do PC de volta ao Deck como vídeo. Cada etapa soma milissegundos, e a soma é o que separa uma experiência fluida de uma sensação de "jogo navegando em gelatina". Esta seção decompõe esse caminho e mostra onde cortar tempo.

:::objetivos
- Decompor a latência total em captura, codificação, rede, decodificação e exibição
- Entender o papel do vsync e do framepacing no atraso percebido
- Medir o input lag real com técnicas simples
- Ajustar o pipeline para minimizar o atraso sem sacrificar estabilidade
- Reconhecer quando a latência não é culpa da rede
:::

## De onde vem cada milissegundo

O tempo total entre o comando e a resposta não é um número único — é uma cadeia de contribuições. Uma decomposição típica para uma sessão local em boas condições:

| Etapa | Origem | Latência típica | Como reduzir |
|---|---|---|---|
| Captura | GPU → encoder do PC | 1-4 ms | Usar NVFBC/NVENC, evitar captura por software |
| Codificação | Encoder do PC | 2-15 ms | Codificar por hardware, perfil mais rápido |
| Rede | PC → Deck (UDP) | 1-10 ms | Ethernet ou Wi-Fi 5 GHz, QoS |
| Decodificação | APU do Deck | 1-5 ms | Decodificação por hardware (já ativa) |
| Exibição | Frame buffer → tela | 8-16 ms | Desativar vsync extra no Deck, usar 60/90 Hz |
| **Total** | | **~15-50 ms** | |

Repare que a **exibição** costuma ser a etapa mais pesada, muitas vezes maior que a rede. A tela do Deck LCD opera a 60 Hz, o que significa um frame a cada ~16,7 ms. Se o frame chega logo depois do "deadline" de exibição, ele espera quase o frame inteiro para ser mostrado — adicionando até ~16 ms de atraso mesmo com rede perfeita.

## Vsync e framepacing: o vilão oculto

O vsync sincroniza a exibição com a taxa de atualização para evitar rasgos na tela (tearing). Mas ele adiciona latência porque o frame fica esperando o próximo ciclo do monitor. O problema se agrava quando há **vsync em cascata**: o jogo no PC tem vsync ligado, o encoder também espera, e o Deck adiciona seu próprio buffer de exibição.

```terminal
$ gamescope --help 2>&1 | grep -i vsync
  -V, --vsync              enable vsync
$ cat /sys/class/drm/card0/preferred_vsync 2>/dev/null
```

A regra de ouro no streaming é **deixar apenas um vsync ativo, no ponto final** — no compositor do Deck. No PC hospedeiro, desative o vsync do jogo e trave os fps por outro mecanismo (limitador de fps do próprio jogo, RTSS ou driver), de modo que a renderização não concorra com a codificação.

:::atencao
Muitos jogos têm duas opções confusas: **Vsync** (sincronização com o monitor) e **Frame Rate Limit** (limite de fps). Para streaming, você quer desligar o primeiro e ligar o segundo. Limitar a 60 fps sem vsync evita tanto o tearing (porque os frames são encaminhados ao encoder numa cadência controlada) quanto o atraso do vsync.
:::

## Medindo o input lag de verdade

A percepção humana confunde latência alta com jitter (variação). Um stream com latência média de 20 ms mas com picos de 60 ms parece pior do que um com 25 ms constantes. Medir com precisão ajuda a separar causa de sintoma:

**Método do contador.** Rode um contador de milissegundos (há sites e aplicativos que exibem um cronômetro de alta precisão) no PC hospedeiro. Aponte a câmera de um celular em modo de alta velocidade (240 fps ou mais) para o monitor do PC **e** para a tela do Deck ao mesmo tempo. A diferença entre os dois números vistos no frame congelado é a sua latência total.

**Método do gamepad.** Uma variante usa o botão do gamepad como gatilho: com o celular em câmera lenta, filmando o botão físico e a tela do Deck, aperte o botão e conte quantos frames passam até o jogo responder. Cada frame a 240 fps vale ~4,17 ms.

```terminal
$ cat /sys/class/drm/card0/modes
1280x800p60
```

O arquivo `/sys/class/drm/card0/modes` mostra que a tela do Deck LCD opera a 1280×800 a 60 Hz (modelo OLED mostrará a 90 Hz). Se você está transmitindo a 60 fps mas exibindo a 60 Hz, há um alinhamento próximo de 1 frame por ciclo — o ideal. Transmitir a 90 fps numa tela de 60 Hz desperdiça metade do trabalho de encode.

## Reduzindo o atraso na prática

Ordenados do maior para o menor impacto:

1. **Elimine vsync duplicado** — deixe só o do Deck ativo; desative no jogo e use limitador de fps no PC.
2. **Priorize a rede cabeada** ou Wi-Fi 5 GHz com canal limpo (mais na seção 6).
3. **Escolha perfil de encode rápido** ("Rápida" em vez de "Bonita") quando o jogo exige reflexo — o custo visual é pequeno e o ganho de latência é real.
4. **Transmita na taxa nativa da tela** (60 fps no LCD, 90 fps no OLED) para casar os ciclos de exibição.
5. **Feche o pipeline de captura de software** — confirme que o *hardware encoding* está ativo (seção 2).

:::dica
No Steam Deck, o overlay de desempenho nível 4 mostra duas métricas cruciais para latência: **Frame pacing** e **Streaming**. Se o framepacing mostra picos regulares (a barra sobe e desce uniformemente), a culpa é da cadência do stream, não da rede. Se os picos são aleatórios, procure interferência de Wi-Fi ou carga no roteador.
:::

## Quando a latência não é a rede

Antes de culpar o Wi-Fi, descarte os suspeitos internos. Um PC hospedeiro saturado — CPU a 100% em outros processos, disco fazendo indexing, antivírus escaneando — adiciona latência de captura e encode que nenhuma rede conserta. O mesmo vale para o Deck com muitos processos em segundo plano no modo desktop.

```terminal
$ top -bn1 | head -12
top - 16:44:15 up 1 day,  3:12,  2 users,  load average: 1.35, 1.12, 0.98
Tasks: 246 total,   2 running, 244 sleeping,   0 stopped,   0 zombie
%Cpu(s):  8.2 us,  2.1 sy,  0.0 ni, 89.1 id,  0.5 wa,  0.1 hi,  0.0 si,  0.0 st
MiB Mem :  15848.4 total,   6210.2 free,   5128.9 used,   4509.3 buff/cache
```

Um load average de 1,35 em CPU parada de 89% idle indica que o PC está essencialmente ocioso — nenhuma gargalo de CPU para adicionar latência ao streaming. Se o load sobe acima do número de núcleos durante o jogo, o encoder disputa ciclos com o jogo e a latência cresce.

## Resumo

- A latência total é a soma de captura, codificação, rede, decodificação e exibição — a exibição costuma ser a maior parcela.
- Vsync em cascata é o erro mais comum: deixe apenas o do Deck ativo e limite fps no PC por outro meio.
- Um stream com latência média baixa mas jitter alto parece pior que um com latência constante.
- Perfil "Rápida" reduz latência de encode em troca de pequena perda visual.
- Carga de CPU no PC (antivírus, indexing) adiciona latência que a rede não conserta.

## Exercícios

1. Com o método do contador (câmera lenta filmando PC e Deck), meça sua latência total de streaming em duas condições: vsync do jogo ligado e desligado. Qual a diferença?
2. Decomponha: usando `ping` para a rede e o overlay nível 4 para o framepacing, estime quanto da sua latência vem da rede versus da exibição.
3. Teste perfis "Rápida" vs "Bonita" num jogo de ação e note se a diferença de responsividade é perceptível.
4. Verifique a taxa da sua tela (`cat /sys/class/drm/card0/modes`) e compare com a taxa de transmissão configurada. Estão casadas?
5. **Desafio.** Sature o PC hospedeiro com um processo pesado (ex.: `stress --cpu 4`) durante o streaming e meça o impacto na latência. Isso prova que latência de encode é independente da rede.