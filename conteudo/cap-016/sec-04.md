Tearing é o defeito visual mais mal compreendido do jogo no PC: muita gente acha que é falta de potência, quando na verdade é falta de sincronia entre a GPU e o painel. VRR (Variable Refresh Rate, taxa de atualização variável) responde a isso fazendo a tela adaptar seu ritmo ao da GPU, em vez de forçar a GPU a acompanhar a tela. É a tecnologia que, na prática, torna o limitador de FPS menos crítico.

:::objetivos
- Entender o que causa o *screen tearing* e como reconhecê-lo
- Diferenciar V-Sync tradicional de VRR (FreeSync/Adaptive Sync)
- Compreender o papel do gamescope no VRR do SteamOS
- Identificar se seu display e cabo suportam VRR
:::

## O que é tearing, de novo, em câmera lenta

O tearing acontece quando o painel lê a memória de vídeo no meio de uma troca. A GPU desenha para um buffer e, quando termina um quadro, "vira" esse buffer para a tela. Se a tela estiver no meio de um ciclo de repintura quando o buffer vira, a metade de cima mostra o quadro velho e a de baixo o novo — a linha de rasgo horizontal que aparece, normalmente, durante movimentos rápidos de câmera.

Num painel de 60 Hz sem sincronia, a cada 16,6 ms a tela repinta. Se o jogo entrega 45 FPS, alguns buffers viram duas vezes por ciclo, outros uma; o rasgo aparece em posições diferentes a cada vez, tremulando. É isso que dá a sensação de "imagem rasgada" em jogos de ritmo rápido.

## V-Sync: o remédio clássico e seus efeitos colaterais

O jeito antigo de acabar com o tearing é o **V-Sync**, que obriga a GPU a esperar o início do próximo ciclo da tela antes de virar o buffer. Funciona: não há mais rasgo, porque a troca só acontece num ponto seguro. O custo é a **latência de entrada** — o jogo espera a tela, e você sente o atraso entre apertar o botão e ver a ação.

O segundo custo do V-Sync é o **stutter em múltiplos**. Se o jogo não consegue manter os 60 FPS da tela, o V-Sync "cai" para o próximo divisor — 30 FPS — e trava lá, descartando a capacidade de renderizar 55 ou 50. Desperdiça potência e cria engasgos quando a GPU oscila em torno do limite.

:::atencao
V-Sync e limitador de FPS não são a mesma coisa. O limitador apenas impede a GPU de ultrapassar um teto de FPS; o V-Sync força a sincronização com o ciclo da tela. Os dois podem ser combinados, mas cada um resolve um problema diferente: limite evita variação, V-Sync evita rasgo.
:::

## VRR: a tela que espera a GPU

O VRR inverte a relação. Em vez de a GPU esperar a tela, o painel ajusta **seu** período de repintura para acompanhar a chegada de cada novo quadro. Se o jogo entrega 47 FPS, a tela roda a 47 Hz naquele instante; se cai para 39, a tela segue para 39 Hz. Não há rasgo (cada quadro entra num ciclo próprio) nem a latência pesada do V-Sync.

No mundo AMD, o VRR se chama **FreeSync**; no mundo NVIDIA, **G-Sync**; o padrão aberto do DisplayPort é **Adaptive Sync**. Todos fazem a mesma coisa: sincronizar o refresh com a GPU, dentro de uma faixa de frequências que o painel suporta.

```terminal
$ xrandr --prop | grep -i -A1 vrr
	vrr_capable: 1
		range: (0, 1)
```

A propriedade `vrr_capable: 1` indica que o display plugado anuncia suporte a taxa variável. O valor `0` aponta para um painel fixo ou um cabo/adaptador que não transporta o sinal VRR — comum com conversores HDMI baratos.

## O gamescope como orquestrador de VRR

No SteamOS, quem negocia o VRR é o **gamescope**, o compositor baseado em Wayland que cuida de toda a exibição. Ele detecta se o painel é capaz de VRR, negocia a faixa de frequências e decide quando o modo variável entra em ação.

Uma sutileza importante: no Steam Deck, o VRR é mais útil com **monitores externos** compatíveis. O painel embutido OLED tem comportamento próprio, dirigido a taxas fixas (90, 45, 40, 30), e o gamescope se encarrega de mapear o limite de FPS para essas taxas — o que, no fim, entrega uma fluidez equivalente, embora por outro mecanismo.

```terminal
$ journalctl -u gamescope | grep -i -E 'vrr|refresh|rate'
jan 12 15:40:02 steamdeck gamescope[781]: [gamescope] Refresh rate set to 90Hz
jan 12 15:40:02 steamdeck gamescope[781]: [gamescope] VRR capable display detected
jan 12 15:40:02 steamdeck gamescope[781]: [gamescope] VRR range: 48-144 Hz
```

Aqui o gamescope reportou um monitor externo com faixa VRR de 48 a 144 Hz. Isso significa que, entre 48 e 144 FPS, a tela acompanha a GPU quadro a quadro, sem rasgo. Abaixo de 48 FPS, o painel sai do modo variável e o V-Sync assume — por isso o limite de FPS ainda tem papel mesmo com VRR ligado.

## VRR não anula o limitador

Com VRR ativo, a tela acompanha qualquer FPS dentro da faixa, então muita gente conclui que não precisa mais de limitador. Quase: o VRR elimina o *tearing*, mas não o *stutter* causado por frame times irregulares, e não a latência de uma GPU saturando a 100%. Travar o FPS num teto um pouco abaixo do máximo reduz a latência e estabiliza o frame time, mesmo dentro da faixa VRR.

Por isso o fluxo recomendado em monitores externos é: ligar o VRR **e** limitar o FPS num valor seguro da faixa (por exemplo, 60 FPS numa faixa de 48–144). Você ganha o fim do rasgo do VRR e a consistência do limitador.

A verificação completa de que VRR + limitador estão ativos se faz combinando as duas checagens:

```terminal
$ xrandr --prop | grep -i vrr_enabled
	vrr_enabled: 1
$ MANGOHUD_CONFIG=fps_limit=60 mangohud %command%
```

Com `vrr_enabled: 1` e `fps_limit` em 60, o monitor acompanha a GPU dentro da faixa e o teto evita que ela escape do range onde o VRR opera.

## Resumo

- Tearing é o rasgo na imagem causado por troca de buffer no meio de um ciclo da tela.
- V-Sync elimina o rasgo ao sincronizar com o ciclo, mas adiciona latência e trava em divisores.
- VRR (FreeSync/Adaptive Sync) faz a tela variar sua taxa acompanhando a GPU, sem rasgo e com menos latência.
- `xrandr --prop | grep vrr` revela se o display anuncia capacidade de taxa variável.
- O gamescope negocia o VRR no SteamOS, útil sobretudo com monitores externos.
- VRR elimina tearing, não stutter — o limitador de FPS continua valendo para consistência e latência.

## Exercícios

1. Num jogo de câmera rápida e V-Sync desligado, mova a câmera com força e localize a linha de rasgo. Depois ligue o V-Sync e compare.
2. Conecte um monitor externo com FreeSync e rode `xrandr --prop | grep -i vrr`. O que `vrr_capable` informa na sua máquina?
3. Altere entre V-Sync ligado e desligado no mesmo jogo e meça a latência percebida ao mirar. Em qual modo a resposta do controle parece mais imediata?
4. Rode `journalctl -u gamescope | grep -i vrr` com o monitor VRR conectado e confira a faixa de frequências reportada.
5. **Desafio.** Explique por que, numa faixa VRR de 48–144 Hz, um limite de FPS em 60 é mais estável que deixar o jogo livre — conectando os conceitos de frame time, latência e faixa de operação do painel.
