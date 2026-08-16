Se o frametime é a lupa, o 1% low é o microscópio. Onde o FPS médio diz "60" e o frametime mostra um espinho, o 1% low quantifica o pior 1% da experiência: o valor abaixo do qual só 1% dos quadros caem. É o número que responde à pergunta certa: "quão ruim fica quando fica ruim?"

:::objetivos
- Entender o que é 1% low e como ele se diferencia do FPS mínimo
- Interpretar o 1% low como indicador de consistência de fluidez
- Relacionar 1% low com frametime para diagnóstico preciso
- Saber onde o 1% low aparece no overlay do SteamOS
:::

## Média, mínimo absoluto e 1% low

Três números podem descrever a fluidez de um jogo: a média de FPS, o mínimo absoluto (o pior frame de todos) e o 1% low. Cada um tem um papel, e confundi-los é um erro clássico.

O **mínimo absoluto** é fácil de enganar: um único frame de 2 segundos durante a tela de carregamento derruba o mínimo para 0,5 FPS, mas não representa como o jogo roda de verdade em combate ou exploração. Já o **1% low** pega todos os frames, ordena do pior para o melhor, descarta o 1% mais lento e mostra o maior valor entre os que sobraram — ou seja, é o "pior frame que ainda faz parte do jogo normal", ignorando as anomalias mais extremas.

```terminal
$ # Exemplo de distribuicao de frametimes em 1000 frames:
$ # media FPS: 60.2  (16.6 ms)
$ # minimo absoluto: 12 FPS (83 ms)   <- um unico frame na tela de loading
$ # 1% low: 48 FPS  (20.8 ms)         <- o pior quadro jogavel
$ # conclusão: o jogo e estavel, mas ha quedas perceptiveis em explosões
```

Ferramentas como o MangoHud chamam essa métrica de `1% low`. O overlay do Modo Jogo, nos níveis 3 e 4, passa a exibir um valor equivalente — às vezes rotulado como "mínimo" mas comportando-se como 1% low na prática. O nome varia, então preste atenção ao comportamento: se o "mínimo" não explodiu para 0,5 FPS na tela de carregamento, é porque ali está o 1% low.

## O 1% low conta a história da experiência

Dois jogos podem ter 60 FPS de média e serem radicalmente diferentes:

- Jogo A: 1% low de 55 FPS — os quadros mais lentos ainda são rápidos. Experiência suave, sem surpresas.
- Jogo B: 1% low de 28 FPS — o jogo "anda bem" mas dá solavancos bruscos que o olho registra como desconforto.

```terminal
$ # Jogo A (estavel):    media 60 FPS | 1% low 55 FPS | frametime 16.7 ms (plano)
$ # Jogo B (instavel):   media 60 FPS | 1% low 28 FPS | frametime espinhado
$ # Ambos têm "60 FPS", mas a experiência é totalmente diferente
```

A diferença entre 55 e 28 no 1% low é o que separa um jogo "liso" de um "engasgado". Por isso o 1% low virou a métrica padrão dos canais de benchmark: ele é mais representativo da sensação real do que a média.

:::nota
Em placas com memória limitada como a do Steam Deck — 16 GB compartilhados entre RAM do sistema e VRAM — o 1% low tende a piorar quando a VRAM estoura e o jogo começa a paginar texturas. Monitorar o 1% low junto com a VRAM (seção 6) é a combinação mais poderosa para detectar esse tipo de gargalo.
:::

## Jitter: quando o frametime oscila sem motivo aparente

Existe um fenômeno mais sutil que o engasgo grande: o **jitter de frame**. Não é um espinho de 200 ms; é uma oscilação constante do frametime entre, digamos, 14 ms e 20 ms, numa taxa alvo de 16,7 ms. O FPS médio continua alto, o 1% low continua razoável, mas a imagem parece "trêmula" ou "não tão lisa quanto deveria".

```terminal
$ # Exemplo de jitter: frametimes oscilando entre 14 e 20 ms
$ # frame 1: 15.2 ms
$ # frame 2: 17.8 ms
$ # frame 3: 14.1 ms
$ # frame 4: 19.6 ms
$ # frame 5: 16.0 ms
$ # A média dá perto de 16.6 ms (60 FPS), mas a variância é alta
```

Causas comuns de jitter no Steam Deck incluem:

- **Limite de FPS não alinhado com a taxa do display** — se o display roda a 60 Hz e você trava o jogo a 40 FPS, os frames não casam com o refresh e a oscilação é inevitável.
- **Problema de sincronização** — V-Sync ativada junto com outro limitador pode criar "batimentos".
- **CPU com picos intermitentes** — processos de fundo roubando ciclos por milissegundos.

A solução mais simples é sempre casar o limite de FPS com um divisor inteiro da taxa de refresh: para 60 Hz, use 30 ou 60 FPS; para 90 Hz (Deck OLED), use 30, 45 ou 90 FPS. O SteamOS oferece esse controle exato no mesmo painel de desempenho onde fica o overlay.

:::atencao
O Steam Deck LCD tem taxa de refresh fixa de 60 Hz; o Deck OLED vai até 90 Hz. Ajustar o limite de FPS para um valor que não divide a taxa do display é a causa mais frequente de jitter em jogos tecnicamente "rodando bem". Sempre verifique a taxa do display (`Configurações > Tela > Taxa de atualização`) antes de fixar um limite de FPS.
:::

## Interpretando os três juntos

A trinca média, 1% low e frametime forma o diagnóstico completo de fluidez:

| Métrica | O que revela | Bom | Ruim |
|---|---|---|---|
| Média FPS | Panorama geral | ≥ 40 no Deck portátil | Abaixo de 30 |
| 1% low | Quedas representativas | Próximo da média (ex.: 55 com média 60) | Menos da metade da média |
| Frametime | Consistência quadro a quadro | Linha plana no gráfico | Espinhos frequentes |

```terminal
$ # Exemplo de diagnostico completo:
$ # media FPS: 60   (bom)
$ # 1% low:    53   (aceitável, perto da media)
$ # frametime:      plano, raros espinhos   (saudavel)
$ # veredito: jogo fluido
```

O diagnóstico só está completo quando os três concordam, ou quando a discordância entre eles conta uma história específica — como a média alta com 1% low baixo, que aponta para um problema de consistência.

## Resumo

- O 1% low é o pior quadro que ainda representa o jogo real; diferente do mínimo absoluto, ignora anomalias extremas.
- Dois jogos podem ter a mesma média de FPS e experiências totalmente diferentes por causa do 1% low.
- O jitter é a oscilação fina do frametime que não chega a ser um engasgo, mas rouba a sensação de fluidez.
- Jitter costuma vir de limite de FPS não alinhado com a taxa de refresh do display.
- O diagnóstico completo de fluidez combina média de FPS, 1% low e a curva de frametime.

## Exercícios

1. Num jogo com o overlay no nível 4, identifique o valor de 1% low (ou "mínimo") e compare-o com a média. Os dois estão próximos ou distantes?
2. Ajuste o limite de FPS para um valor que não divide a taxa de refresh do Deck (ex.: 50 FPS num display de 60 Hz) e observe se o frametime começa a oscilar.
3. Depois, ajuste para 30 FPS ou 60 FPS e compare a estabilidade do frametime com a do exercício 2.
4. Deixe o overlay ligado numa tela de carregamento e observe o "mínimo absoluto". Compare com o 1% low da jogabilidade.
5. **Desafio.** Rode `mangohud vkcube` no Modo Desktop, ative a exibição de 1% low via `MANGOHUD_CONFIG="fps,frametime,fps_metrics"` e interprete a diferença entre FPS médio, 1% low e 0.1% low.