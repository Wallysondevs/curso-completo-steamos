Nada estraga um jogo de plataforma ou de luta como a sensação de que o personagem responde "um pouco depois" do seu comando. Essa demora é a **latência de entrada**, e ela é somada em cada etapa do caminho: o controle, o jogo, o driver e a tela. O RetroArch tem três ferramentas para atacar essa fila — *frame delay*, *runahead* e *preemptive frames* — e esta seção explica as duas últimas, as mais poderosas do emulador.

:::objetivos
- Entender de onde vem a latência de entrada numa emulação
- Usar o *runahead* para "esconder" frames de processamento
- Configurar *preemptive frames* e escolher cores compatíveis
- Ligar o contador de latência para medir o ganho real
- Evitar os efeitos colaterais (instabilidade e áudio) do runahead mal ajustado
:::

## De onde vem o atraso

Numa emulação ingênua, o fluxo de um frame é: lê o controle, roda a lógica do jogo, renderiza, envia à tela. O problema é que o frame que a tela exibe foi calculado **com o estado do jogo de antes** de você apertar o botão — e, quando há mais uma fila de buffers no meio, isso soma vários frames de atraso.

```terminal
$ retroarch --features | grep -i runahead
Runahead:     Available
```

O RetroArch chama essa pilha de *input latency*. Na prática, jogos de luta e tiro em consoles antigos toleram entre 1 e 3 frames de delay; acima disso, o controle parece "molenga".

:::nota
A latência não vem só do emulador. Uma TV com pós-processamento ligado ou um controle Bluetooth pode adicionar dezenas de milissegundos. O runahead só ataca a fatia que o RetroArch controla.
:::

## O que o runahead faz

O *runahead* (literalmente "rodar à frente") é uma ideia elegante: em vez de esperar os estados anteriores, o emulador **roda todas as combinações possíveis** de entrada do frame seguinte em paralelo, descarta as que não aconteceram e usa a que casou com o seu botão. Na prática, o programa "adivinha" o futuro do jogo uma quantidade de frames à frente e, quando o seu comando chega, a resposta já estava pronta.

É por isso que o runahead **consome mais CPU**: ele emula o jogo uma vez para cada possibilidade de entrada. Um núcleo leve (NES, SNES) aguenta bem; um mais pesado (Saturn, PS2) pode não ter folga. O benefício, porém, é direto: menos frames entre o seu dedo e a resposta na tela.

```terminal
$ cat retroarch.cfg | grep -i runahead
runahead_enabled = "true"
runahead_frames = "2"
$ retroarch --features | grep -i runahead
Runahead:     Available
```

O valor de `runahead_frames` diz quantos frames "no futuro" o emulador pré-calcula. O padrão recomendado é 1 ou 2; valores altos multiplicam o custo sem ganho perceptível. Num Deck com APU quad-core Zen 2, o runahead em 2 frames nos cores de 8 e 16 bits raramente passa de 50% de CPU — sobra bastante margem.

## Preemptive frames e cores compatíveis

O runahead anda de mãos dadas com os **preemptive frames**, que usam uma técnica complementar para cortar a espera do buffer de vídeo. Juntos, os dois conseguem cancelar boa parte da latência acumulada.

A pegadinha: **nem todo core suporta runahead**. A opção só funciona em cores que foram adaptados para esse recurso, e alguns — sobretudo os mais complexos ou com timing delicado — ficam instáveis quando ele está ligado.

```terminal
Settings > Latency > Preemptive Frames: ON
Settings > Latency > Runahead > Runahead Frames: 1
```

Os *preemptive frames* atuam na fila de renderização, adiantando o envio de frame antes que o anterior termine de ser exibido. A soma dos dois recursos é o que permite a um Deck atingir latência comparável à do console original — ou até menor, quando o jogo tolera runahead em 2 frames.

:::atencao
O runahead pode causar crashes ou áudio estourado se o core não tiver suporte ou se `runahead_frames` for alto demais. Ligue em 1 frame, teste por dez minutos e só então suba. Se o áudio falhar, desative o runahead antes de qualquer outra coisa.
:::

## Medindo o ganho de verdade

A sensação de "ficou melhor" pode enganar. O RetroArch traz um contador que mede a latência real de entrada em milissegundos, para que você veja o número em vez de confiar na impressão.

```terminal
Settings > Latency > Runahead > Display Latency Statistics: ON
```

Com o contador ligado, um jogo que reportava 60 ms pode cair para 25 ms com runahead em 2 frames. É a diferença entre apertar o pulo e o personagem sair do chão "na hora" ou meio segundo depois.

:::dica
A regra de ouro do runahead: ligue em **1 frame**, confirme estabilidade, suba para 2 só se o CPU estiver folgado (veja o uso no contador de FPS do RetroArch). Acima de 3, o ganho é marginal e o risco de quebra sobe muito.
:::

## Resumo

- A latência de entrada é a soma de atrasos entre o controle e a resposta na tela.
- O runahead pré-calcula o estado do jogo alguns frames à frente e descarta o que não aconteceu.
- `runahead_frames` controla o horizonte de "adivinhação"; 1 ou 2 é o padrão seguro.
- Nem todo core suporta runahead; cores pesados podem travar ou engasgar.
- O contador de latência exibe o ganho em ms para validar a configuração em vez de só "achar" que melhorou.

## Exercícios

1. Ative o contador de latência e anote o valor de um jogo sem runahead.
2. Ligue o runahead em 1 frame no mesmo jogo e compare o novo valor de latência.
3. Teste `runahead_frames = 2` e observe o consumo de CPU no contador de FPS; volte para 1 se engasgar.
4. Experimente o runahead em um core sabidamente incompatível e observe o comportamento (áudio/trava).
5. **Desafio.** Combine runahead, *frame delay* e *vsync desligado* num jogo de luta e meça a latência final; depois explique qual dos três trouxe o maior ganho e por quê.
