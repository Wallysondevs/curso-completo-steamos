Latência é o intervalo entre o seu gesto e a resposta na tela, e em periféricos ela é composta de somas invisíveis: o tempo do rádio, a taxa de polling do aparelho, a fila de interrupções do kernel e o escalonamento de processos. No Steam Deck, um aparelho que funciona perfeitamente pode estar entregando o dobro da latência do que ele é capaz — simplesmente porque ninguém olhou para a taxa de polling e para a prioridade do processo.

:::objetivos
- Dividir a latência total de um periférico em componentes mensuráveis
- Medir e ajustar a taxa de polling de mouse e controle
- Entender o papel das interrupções USB e da prioridade de processo
- Usar `chrt` e `nice` para reduzir a latência do jogo

:::

## Decompondo a latência

A jornada de um clique de mouse até o disparo no jogo atravessa, em média, cinco estágios:

1. **Firmware do aparelho**: o sensor lê, o microcontrolador processa e monta o pacote.
2. **Taxa de polling**: quanto o pacote espera até o próximo intervalo de envio.
3. **Barramento e interrupção**: o pacote viaja por USB/Bluetooth e interrompe a CPU.
4. **Driver e fila de eventos**: o kernel entrega o evento ao processo do jogo.
5. **Render e apresentação**: o jogo processa e a tela exibe.

Você controla diretamente os estágios 2 e 4, e parcialmente o 5. O estágio 1 é fixo no hardware; o 3 depende do barramento. A lição central: a maior alavanca barata é a **taxa de polling**, que impõe um teto mínimo de latência igual a `1 / polling`.

## Polling na prática

A fórmula é direta: a `1000 Hz`, o aparelho só pode introduzir até `1 / 1000 = 1 ms` de espera; a `125 Hz`, até `8 ms`. Para mouses, a leitura da taxa atual (via `ratbagctl`) foi coberta no [capítulo de teclado e mouse](#/cap-083/sec-06). Para controles, a taxa costuma ser fixa e não configurável, mas a de mouses faz diferença real.

```terminal
$ ratbagctl wired-gaming-mouse rate get
125
$ ratbagctl wired-gaming-mouse rate set 1000
```

Mudou de `125` para `1000` — a latência mínima caiu de 8 ms para 1 ms. É a diferença entre "o cursor sempre chegou atrasado" e "parece colado na minha mão".

:::atencao
Polling alto não é grátis. A `1000 Hz`, o mouse gera 1000 interrupções por segundo, e cada interrupção acorda a CPU de um estado de repouso. Em uso normal não se nota; mas se você roda vários aparelhos a `1000 Hz` no mesmo hub USB, pode haver contenção. Em Bluetooth, subir o polling drena a bateria rápido — deixe `500 Hz` como meio-termo.
:::

## Interrupções USB e o barramento

Quando o pacote chega, o controlador USB dispara uma interrupção. O kernel atende a interrupção, lê o pacote e o coloca na fila do processo do jogo. A frequência com que essas interrupções acontecem é visível em `/proc/interrupts`:

```terminal
$ grep -E 'CPU0|xhci' /proc/interrupts | head -3
            CPU0       CPU1       CPU2       CPU3
 45:   15388412   12039845   11029384   14209384  IR-PCI-MSIX-0000:00:14.0  xhci_hcd
```

A coluna `xhci_hcd` marca as interrupções do controlador USB (xHCI). Os números altos são normais — cada pacote de mouse gera uma. Para reduzir latência, o que se faz não é "diminuir interrupções", e sim **garantir que o processo do jogo seja atendido rápido** depois da interrupção, o que leva ao próximo ponto.

## Prioridade de processo e escalonamento

O estágio 4 (entrega do evento ao jogo) depende do escalonador da CPU: quando o evento chega, quanto tempo o processo do jogo espera até ser escalonado? Se a CPU está ocupada com outros processos, a entrega atrasa. Duas ferramentas reduzem esse atraso: `nice`, que ajusta a prioridade de tempo compartilhado, e `chrt`, que muda a política de escalonamento.

```terminal
$ nice -n -10 gamescope -- %command%
```

Valores de `nice` negativos (de -1 a -20) aumentam a prioridade. O `-10` acima deixa o jogo (via `gamescope`, o compositor do Deck) mais prioritário que processos comuns. Mais agressivo é o `chrt`, que usa a política de tempo real:

```terminal
$ sudo chrt -f -p 80 $(pgrep -f 'game-name')
```

A política `-f` (FIFO) com prioridade `80` coloca o processo numa fila de tempo real — ele passa na frente de praticamente tudo. É a configuração usada por jogadores competitivos para domar a latência do estágio 4.

:::perigo
`chrt -f` com prioridade muito alta (ou num processo que trava em loop) pode congelar a máquina inteira, porque processos de tempo real famintos não cedem a CPU. Use prioridades moderadas (50–90) e nunca aplique tempo real em processos do sistema ou no kernel. Teste com `-p` (aplicar a um PID já existente) antes de embutir no lançamento.
:::

## Medindo o que importa

Latência de entrada é difícil de medir sem hardware especializado (câmera de alta velocidade). No software, o mais próximo é comparar o carimbo de tempo do evento no `evtest` com a resposta do jogo — mas isso captura só parte do caminho. Uma heurística honesta:

```terminal
$ evtest /dev/input/event4 | while read l; do echo "$(date +%s.%N) $l"; done
```

O carimbo mostra quando o kernel entregou o evento. Se você grava a tela do jogo com o mesmo relógio e compara o instante do clique com o do disparo, obtém uma aproximação do total. A regra prática é mais simples: **abaixe o polling que você controla, eleve a prioridade do jogo e use USB em vez de Bluetooth para jogos competitivos**.

:::nota
Para jogo competitivo, a ordem de prioridade dos periféricos segue a latência do barramento: teclado e mouse cabeados em USB a `1000 Hz` primeiro, depois controle em USB, e só então Bluetooth. O Bluetooth adiciona dezenas de milissegundos só na pilha de rádio, antes mesmo do polling.
:::

## Resumo

- A latência total é a soma de firmware, polling, barramento, entrega e render.
- A taxa de polling impõe um teto mínimo de `1 / polling` segundos.
- Subir polling de `125` para `1000 Hz` reduz a latência mínima de 8 ms para 1 ms.
- `/proc/interrupts` mostra as interrupções do controlador USB (`xhci_hcd`).
- `nice -n -10` e `chrt -f -p 80` aumentam a prioridade do jogo no escalonador.
- USB vence Bluetooth em latência; use cabo para jogo competitivo.

## Exercícios

1. Leia a taxa de polling atual do seu mouse com `ratbagctl rate get` (se compatível) e calcule a latência mínima correspondente com `1 / polling`.
2. Suba a taxa para `1000 Hz`, jogue por 10 minutos e anote se percebeu diferença. Depois volte ao valor original.
3. Rode `grep xhci /proc/interrupts` e observe os contadores. Gere tráfego movendo o mouse freneticamente e veja os números subirem.
4. Lance um jogo com `nice -n -10` e compare a sensação de resposta com o lançamento normal.
5. **Desafio.** Aplique `chrt -f -p` (com prioridade 60) ao processo de um jogo e meça o impacto. Depois desfaça e explique, em uma frase, por que não é seguro deixar essa configuração permanente.
