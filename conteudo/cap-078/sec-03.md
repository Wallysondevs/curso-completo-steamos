Entre os kernels alternativos para Linux, o **Xanmod** é o mais popular na comunidade gamer por uma razão concreta: ele reúne patches de escalonamento, configurações de preempção agressivas e otimizações de compilação voltadas para reduzir latência e melhorar a responsividade. No Steam Deck, ele aparece como uma alternativa recorrente ao linux-neptune para quem quer extrair alguns milissegundos de resposta — mas com custos que precisam ser pesados.

:::objetivos
- Entender o que o Xanmod muda em relação ao kernel mainline
- Diferenciar os escalonadores CFS, BMQ, PDS e BORE
- Avaliar o impacto real dos patches de performance em jogos no Deck
- Identificar os riscos e as perdas ao usar Xanmod no SteamOS
:::

## O que o Xanmod agrega ao kernel

O projeto Xanmod (`https://xanmod.org`) é uma distribuição do kernel que pega a árvore mainline e aplica uma coleção de patches focados em desempenho de desktop e games. Não é um fork radical — é o mesmo Linux, com configurações e patches escolhidos com curadoria para reduzir latência e melhorar fluidez. Os pilares são:

- **Escalonador alternativo:** substitui o CFS por BMQ, PDS ou BORE (dependendo da build).
- **Preempção mais agressiva:** `PREEMPT` completo em vez de `PREEMPT_DYNAMIC`, permitindo que tarefas de alta prioridade interrompam quase qualquer ponto do kernel.
- **Timer de alta resolução:** `CONFIG_HZ=1000` em vez dos 300 Hz do linux-neptune, reduzindo o atraso de eventos periódicos.
- **Otimizações de compilação:** uso de `-O3` e CPU-specifc flags (x86-64-v3) que geram binários mais rápidos em hardware moderno.

A diferença de configuração pode ser vista diretamente:

```terminal
$ cat /boot/config-6.6-xanmod | grep -E '^CONFIG_HZ=|^CONFIG_PREEMPT'
CONFIG_PREEMPT=y
CONFIG_PREEMPT_DYNAMIC is not set
CONFIG_HZ=1000
$ cat /proc/config.gz | zgrep -E '^CONFIG_HZ=|^CONFIG_PREEMPT'
CONFIG_PREEMPT_DYNAMIC=y
CONFIG_HZ=300
```

## Os escalonadores em comparação

O escalonador é a parte do kernel que decide qual thread roda em qual núcleo e por quanto tempo. O linux-neptune usa o **CFS** (Completely Fair Scheduler), o padrão do mainline desde 2007. O Xanmod oferece alternativas:

| Escalonador | Filosofia | Pontos fortes | Pontos fracos |
|---|---|---|---|
| CFS | Justiça "perfeita" por peso | Maduro, previsível, testado | Latência máxima alta sob carga mista |
| BMQ | Fila múltipla com balanceamento | Melhor throughput multithread | Menos justiça entre processos |
| PDS | Prioridade + deadline | Baixa latência em desktop | Menos testado em servidor |
| BORE | Foco em interatividade/responsividade | Tela reage rápido sob carga | Overhead ligeiramente maior |

O veredito prático é nuançado. Para o Steam Deck, que tem **4 núcleos / 8 threads**, o gargalo raramente é o escalonador — é a APU disputando o mesmo orçamento de energia entre CPU e GPU. Um escalonador "melhor" não multiplica FPS; ele reduz os **picos de latência** e melhora a fluidez percebida quando o sistema está ocupado.

:::nota
O termo do momento na comunidade é o **BORE** (Burst-Oriented Response Enhancer), que os builds recentes do Xanmod adotaram como padrão. Ele tenta priorizar tarefas que acabaram de "acordar" e esperam resposta rápida — exatamente o padrão de um jogo esperando input do controle.
:::

## Impacto real em jogos no Deck

É importante calibrar a expectativa. Benchmarks comparando linux-neptune com Xanmod no Deck mostram:

```terminal
$ vblank_mode=1 glxgears   # throughput bruto — quase idêntico
# linux-neptune:  ~10980 frames em 5s  (~2196 FPS)
# xanmod:        ~10940 frames em 5s  (~2188 FPS)
```

O throughput de renderização muda menos de 1%. O que muda é a **consistência de frame time** — e isso aparece em jogos, não em `glxgears`. O ganho do Xanmod no Deck é mais perceptível em:

- Streaming + jogo simultâneos (o jogo sofre menos com a competição de CPU)
- Emulação (RPCS3, Yuzu) que depende de muitos threads pequenos
- Áudio em tempo real (monitoring, produção musical)
- Jogos com micro-stutter causado por escalonamento, não por shader compilation

Para o jogador médio de SteamOS jogando nativamente, a diferença é frequentemente invisível. O esforço de instalar Xanmod só compensa se você sente um problema específico de responsividade ou atraso.

:::atencao
O Xanmod não contém os drivers Valve (`steamdeck_hid`, `steamdeck_fan`, `steamdeck_gyro`). Ao instalar, você perde giroscópio, mapeamento avançado de controles e o controle granular da ventoinha. Isso é um custo **permanente** enquanto você estiver nesse kernel, não um detalhe temporário.
:::

## Resumo

- O Xanmod agrega escalonadores alternativos (BMQ/PDS/BORE), `PREEMPT=y` e `CONFIG_HZ=1000` ao kernel mainline.
- O linux-neptune usa CFS, `PREEMPT_DYNAMIC` e `CONFIG_HZ=300` — configurações mais conservadoras.
- O ganho do Xanmod está na latência máxima e na consistência de frame time, não no throughput bruto (mudança < 1%).
- No Deck, o gargalo costuma ser o orçamento de energia da APU, não o escalonador.
- Instalar Xanmod implica perder os módulos Valve de controles, giroscópio e ventoinha.

## Exercícios

1. Confira o seu escalonador e o timer: `zgrep -E 'CONFIG_HZ|CONFIG_PREEMPT' /proc/config.gz`. Compare com o que o Xanmod oferece e explique a diferença.
2. Rode `vblank_mode=1 glxgears` por alguns segundos e anote o FPS. Depois carregue o sistema com `stress -c 4` em paralelo e veja como o FPS reage — isso é o que o escalonador afeta.
3. Liste os processos que mais competem por CPU com o seu jogo rodando: `top -o %CPU`. Haveria ganho com um escalonador diferente?
4. Visite `https://xanmod.org` e localize a versão com patches de CPU x86-64-v3. Por que essa build não é a padrão mesmo sendo mais rápida?
5. **Desafio.** Use `cyclictest` para medir a latência máxima do linux-neptune sob carga (`stress -c 8` em paralelo). Pesquise os números típicos do Xanmod no mesmo hardware e escreva um comparativo honesto sobre quando a diferença importa.