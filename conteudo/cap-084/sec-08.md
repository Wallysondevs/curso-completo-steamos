Dos três upgrades deste capítulo, o de botões é o mais acessível e o mais satisfatório de fazer: é barato, é reversível e não mexe em eletrônica sensível — você troca plástico, borracha e, no máximo, uma membrana condutiva. Mas "fácil" não significa "à toa": botões têm orientação, membranas têm lado certo e uma mola de D-pad perdida transforma um jogo de luta em pesadelo. O segredo está na organização das peças miúdas.

:::objetivos
- Entender como botões, D-pad e membranas funcionam em conjunto
- Remover os botões de face e o D-pad sem danificar presilhas
- Distinguir membrana condutiva gasta de botão quebrado
- Instalar botões novos, molas e membranas na orientação correta
- Diagnosticar cliques com teste de input após a montagem
:::

## Anatomia de um botão no Deck

Um botão de face do Steam Deck é a soma de três partes: a **tampa plástica** (a peça que seu dedo toca), a **membrana condutiva** (uma cúpula de borracha com uma pastilha de carbono na base) e o **contato na placa** (dois pontos dourados que a pastilha fecha ao ser pressionada). Não há interruptor mecânico; o clique e a resposta vêm da cúpula de borracha colapsando.

```terminal
$ evtest /dev/input/event3
Event: type 1 (EV_KEY), code 304 (BTN_SOUTH), value 1
Event: type 1 (EV_KEY), code 304 (BTN_SOUTH), value 0
```

O botão `A` aparece como `BTN_SOUTH` (código 304). O `value 1` é o pressionar, o `value 0` o soltar. Esse par pressiona/solta é o diagnóstico fundamental: um botão "morto" não emite nada; um botão "grudado" emite `value 1` sem nunca soltar — sintoma clássico de membrana rasgada ou suja.

## Removendo os botões de face

Acesse os botões pela traseira da carcaça frontal, depois de separar as metades (seções anteriores). Cada botão de face é uma peça com uma pequena **aba de travamento** que impede que ele caia para fora. Destaque a membrana com a pinça e empurre o botão para dentro, que ele se solta da face. Guarde cada botão em um compartimento separado — eles têm formatos ligeiramente diferentes e misturá-los causa encaixe torto.

```terminal
$ ls -l /dev/input/by-id/ | grep -i -E 'event|joystick'
```

Antes de desmontar, liste os nós de input para ter o mapa do que deve responder depois. Se um `BTN_NORTH` (botão `Y`) parar de responder após a remontagem, você terá como apontar para o botão específico em vez de "algum botão está estranho".

:::perigo
Não use chave de fenda para fazer alavanca nos botões. As presilhas de plástico da carcaça e as abas internas dos botões são finas e quebram com força lateral. Use sempre a espátula ou a parte plana da piolet, e empurre o botão para o lado de dentro, nunca force para fora pela frente.
:::

## Membranas: o vilão silencioso

Na maioria dos casos de botão com falha, o culpado é a **membrana**: a cúpula de borracha perde a elasticidade com o tempo, ou a pastilha de carbono se desgasta e para de fechar o contato. Trocar só a membrana é mais barato que trocar o botão inteiro, e é frequentemente tudo o que o problema pede. A orientação importa: a pastilha de carbono precisa ficar voltada para a placa.

```terminal
$ sudo dmesg -T | tail -5
[fev17 15:22] input: Valve Software Steam Deck Controller as /devices/.../input/input31
```

O `dmesg` registra a (re)detecção do controlador como dispositivo de input. Após remontar e religar, essa linha — ou a ausência de erros logo abaixo dela — é um primeiro indício de que as peças voltaram ao lugar e o controlador foi registrado de novo pelo kernel.

## D-pad, molas e o centro

O D-pad é uma peça única em cruz que balança sobre um **pivô central** e, em muitos modelos, usa **molas** ou um disco de borracha para centralizar. Ao removê-lo, cuidado redobrado com essas peças pequenas: uma mola que voa longe é a diferença entre "trocou em 10 minutos" e "caçando peça no chão por uma hora". Registre a posição original antes de soltar.

```terminal
$ evtest /dev/input/event3
Event: type 3 (EV_ABS), code 16 (ABS_HAT0X), value -1
Event: type 3 (EV_ABS), code 16 (ABS_HAT0X), value 1
```

O D-pad é reportado como um *hat switch* (`ABS_HAT0X`/`ABS_HAT0Y`), não como quatro botões independentes. Os valores `-1`/`1` são as direções: esquerda/direita num eixo, cima/baixo no outro. Testar as quatro diagonais depois garante que o pivô voltou ao centro e que nenhuma mola ficou fora do lugar.

:::dica
Ao remontar, use uma bandeja magnética (ou uma folha de papel com divisórias) para separar parafusos e peças por etapa. Botões de face, membrana, mola do D-pad e parafusos de cada região devem ter compartimento próprio — o custo de se perder é minutos de procura, e o custo de montar errado é reabrir tudo.
:::

## Reinstalando e testando

Monte na ordem inversa: membranas (com carbono para a placa), botões (com a aba encaixada), D-pad (com pivô e mola no centro). Feche a carcaça, religue e vá ao teste de input. Percorra todos os botões de face, o D-pad nas quatro diagonais e os gatilhos — cada um deve produzir um par `value 1`/`value 0` limpo.

```terminal
$ evtest /dev/input/event3 | grep -E 'BTN|HAT' 
```

Filtrar a saída por `BTN` e `HAT` deixa o teste focado nos botões e no D-pad, sem o ruído dos eixos analógicos. Pressione cada botão uma vez e confira no terminal o par pressiona/solta correspondente — se algum botão não aparecer, o problema está na membrana ou no encaixe daquele botão específico.

## Resumo

- Botão = tampa plástica + membrana condutiva + contato na placa; o clique vem da cúpula de borracha.
- `evtest` mostra cada botão como `BTN_*` com par `value 1`/`value 0` (pressiona/solta).
- A falha mais comum está na membrana gasta, não no botão em si; a pastilha de carbono fica voltada para a placa.
- D-pad é um *hat switch* (`ABS_HAT0X`/`ABS_HAT0Y`); pivô e molas centrais precisam voltar ao lugar.
- Organização magnética/dividida das peças evita a perda de componentes miúdos.

## Exercícios

1. Com `evtest`, pressione cada botão de face e registre o código `BTN_*` correspondente a `A`, `B`, `X`, `Y`.
2. Teste o D-pad nas quatro direções e quatro diagonais. Cada uma delas gera qual combinação de `ABS_HAT0X`/`ABS_HAT0Y`?
3. Segure um botão pressionado por alguns segundos e observe a saída do `evtest`. Quantos eventos `value 1` aparecem até você soltar? O que isso revela sobre *auto-repeat*?
4. Liste os nós de input com `ls -l /dev/input/by-id/` e anote qual corresponde ao controlador do Deck, antes de qualquer desmontagem.
5. **Desafio.** Explique a diferença entre o D-pad ser reportado como *hat switch* (eixos) e os botões serem eventos discretos (teclas). Por que isso dificulta mapear "cima + esquerda" no D-pad como dois botões simultâneos em alguns jogos, e como o Steam Input contorna isso?
