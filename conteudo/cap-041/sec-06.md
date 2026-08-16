O Steam Deck tem uma tela de 1280×800 pixels, mas muitos jogos são executados em resolução interna menor para não estourarem o orçamento de GPU, e então reescalados para preencher a tela. O FSR (*FidelityFX Super Resolution*) da AMD é o algoritmo de upscaling que entra nesse momento. No Proton, o parâmetro `WINE_FULLSCREEN_FSR` liga o FSR diretamente na saída, reescalando o jogo com um filtro de boa qualidade sem mexer nas configurações dele.

:::objetivos
- Entender o que o FSR faz e onde ele se encaixa na pilha do Proton
- Ativar o FSR com `WINE_FULLSCREEN_FSR=1`
- Ajustar a resolução do jogo para que o FSR atue
- Medir o efeito visual e de desempenho do FSR
- Comparar FSR embutido da engine com o FSR do Proton
:::

## O que o FSR resolve

Quando você reduz a resolução de um jogo de 1280×800 para 960×600, a GPU renderiza menos 36% dos pixels. O ganho em FPS é palpável — mas a imagem fica borrada, porque o display do Deck continua sendo 1280×800 e precisa esticar essa imagem menor. O FSR entra como filtro de reescalonamento: ele pega a imagem de baixa resolução, aplica um algoritmo de bordas e contraste para preservar detalhes, e entrega uma imagem final que parece melhor do que o esticamento bruto.

A mágica do `WINE_FULLSCREEN_FSR` é que ele funciona **dentro do Proton**, sem que o jogo saiba. O jogo acredita que está em tela cheia nativa; o Proton intercepta a saída e aplica o FSR.

```text
WINE_FULLSCREEN_FSR=1 %command%
```

Com essa linha, todo jogo que rodar em uma resolução menor que a da tela passa automaticamente pelo FSR do Proton. O jogo não precisa implementar FSR por conta própria.

:::info
`WINE_FULLSCREEN_FSR` é uma funcionalidade do Proton e das builds do Wine da Valve. Ela não existe no Wine upstream. É um dos patches que a Valve mantém especificamente para o Deck.
:::

## Como configurar corretamente

O fluxo é: você abre o jogo, vai nas opções de vídeo, escolhe uma resolução **menor que a nativa** (por exemplo, 960×600 ou 1024×640) e marca o modo de tela como **Tela cheia** (Fullscreen), não "Janela" nem "Janela sem borda". Só assim o Proton sabe que deve aplicar o FSR.

```terminal
$ WINE_FULLSCREEN_FSR=1 %command%
```

Agora, dentro do jogo, vá em **Opções → Vídeo** e configure:
- Modo de exibição: `Tela cheia` (ou Fullscreen)
- Resolução: `960 × 600` (ou outra menor que a nativa)

Ao escolher uma resolução divisível exatamente pela nativa (1280÷2=640, 800÷2=400 → 640×400), o FSR trabalha com um fator de escala inteiro, o que tende a produzir a imagem mais limpa. Resoluções quebradas como 999×581 funcionam, mas o algoritmo tem mais trabalho e o resultado pode piorar.

:::dica
Um bom conjunto de teste: resolução nativa do Deck é 1280×800. Resoluções-alvo comuns para FSR são 960×600 (75%), 1024×640 (80%) e 640×400 (50%). Comece com 960×600 e só desça se o FPS ainda não estiver satisfatório.
:::

## Comparando com e sem FSR

O jeito mais confiável de avaliar o FSR é fazer capturas de tela do mesmo quadro com e sem ele, ampliando para ver detalhes. No terminal, uma comparação rápida de FPS pode ser feita com o MangoHud, mas a qualidade visual é mais importante que o número — o FSR pode melhorar a fluidez sem aumentar o FPS, e é o olho que julga.

Com o FSR ativo e resolução reduzida, o contador de FPS sobe porque a GPU processa menos pixels. O custo do FSR em si é pequeno (menos de 1 ms), então o saldo é positivo. O trade-off está na nitidez: texto pequeno pode tremer, bordas finas podem exibir serrilhado.

```terminal
$ WINE_FULLSCREEN_FSR=1 MANGOHUD=1 %command%
```

Rodando com o MangoHud, você vê lado a lado o ganho de FPS e a resolução real. O MangoHud reporta a resolução de renderização (a menor, escolhida no jogo), não a de saída. Confirme no canto da tela.

Uma forma rápida de conferir a resolução real de renderização é perguntar ao processo do jogo, quando ele expõe essa informação no log:

```terminal
$ WINE_FULLSCREEN_FSR=1 WINEDEBUG=-all PROTON_LOG=1 steam -applaunch 1234560
$ grep -iE "resolution|render" ~/steam-1234560.log | tail -3
info:  ResizeBuffers: (960 x 600) -> (1280 x 800)
```

A linha `ResizeBuffers` mostra o par transformador: o jogo renderizou em `960 x 600` e o Proton entregou `1280 x 800` — exatamente a assinatura do FSR em ação.

:::atencao
O FSR do Proton é uma implementação mais simples (FSR 1.0 espacial) que o FSR 2.0/3.0 das engines. Ele não usa dados temporais, não reconstrói movimento e não é tão nítido quanto o FSR 2. Se o seu jogo tem FSR 2.0 nas próprias opções, use o FSR do jogo e **desligue** o FSR do Proton — os dois FSRs funcionando em cascata pioram a imagem.
:::

## Quando não usar

Há cenários em que `WINE_FULLSCREEN_FSR=1` atrapalha:

- Jogos 2D com pixel art, onde o reescalonamento borra os pixels duros do estilo artístico.
- Jogos que já rodam na resolução nativa sem engasgos (o FSR é desnecessário e mal ativado, mas pode interagir com o compositor).
- Jogos com FSR 2.0 próprio (como dito acima: use o do jogo, não o Proton).

## Resumo

- `WINE_FULLSCREEN_FSR=1` liga o FSR 1.0 no Proton, reescalando a imagem sem o jogo saber.
- O jogo precisa estar em **tela cheia** e em **resolução menor que a nativa** para o FSR atuar.
- Resoluções com fator de escala inteiro (640×400, 960×600) produzem o melhor resultado.
- O FSR do Proton é espacial (FSR 1.0); para jogos com FSR 2.0 próprio, prefira o do jogo.
- O ganho é real: menos pixels renderizados = mais FPS, com qualidade de imagem aceitável.

## Exercícios

1. Rode um jogo 3D em 960×600 com `WINE_FULLSCREEN_FSR=1` e anote o FPS. Depois rode em 1280×800 sem FSR e compare.
2. Faça captura de tela do mesmo quadro com e sem FSR e compare a nitidez do texto e das bordas.
3. Teste o FSR em resoluções não divisíveis (ex.: 1024×600) e compare com 960×600.
4. Rode um jogo que já tem FSR 2.0 nas opções e compare o resultado visual com o FSR do Proton.
5. **Desafio.** Combine `WINE_FULLSCREEN_FSR=1` com `DXVK_HUD=fps` e explique, com os números, a relação entre resolução de renderização, FPS e qualidade de imagem.