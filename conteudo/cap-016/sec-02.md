O alvo de 40 FPS a 40 Hz virou a configuração favorita de quem joga no Steam Deck por um motivo matemático simples: é o menor custo que ainda mantém frame pacing perfeito num painel que consegue trabalhar a 40 Hz. Quem entende por que 40 funciona — e 30 "funciona" melhor que parece — domina o ajuste de desempenho mais rentável do aparelho.

:::objetivos
- Entender por que 40 FPS a 40 Hz entrega frame pacing perfeito
- Comparar 40 FPS/40 Hz com 30 FPS/60 Hz e 30 FPS/90 Hz
- Calcular o frame time de um alvo de FPS
- Configurar o painel do Deck para 40 Hz
:::

## Por que 40 bate exatamente com 40

Quando a tela roda a 40 Hz e a GPU entrega exatamente 40 FPS, cada ciclo da tela mostra um quadro novo, e só um. Não sobra frame esperando, não falta frame na hora de pintar. O frame time de cada quadro é `1000 / 40 = 25 ms`, constante do primeiro ao último segundo.

Compare com o clássico 30 FPS numa tela de 60 Hz. A tela repinta 60 vezes por segundo, mas só recebe 30 quadros. Cada quadro precisa ser exibido por **dois** ciclos da tela. Isso funciona — é o que há décadas de consoles fazem — mas o ritmo é um "duro, duro, duro": a imagem nova só aparece a cada 33,3 ms. Numa tela de 90 Hz, 30 FPS significa cada quadro exibido por três ciclos, de novo com ritmo perfeito, mas com a mesma latência de 33,3 ms.

40 Hz a 40 FPS, por outro lado, entrega um quadro novo a cada 25 ms. São 8,3 ms a menos de intervalo entre quadros que os 30 FPS — quase 20% mais fluido — usando apenas um terço a mais de potência de renderização.

:::exemplo
O Steam Deck OLED vem de fábrica com os alvos de 90, 45 e 30 FPS. Mas a comunidade notou que o painel OLED aceita 40 Hz por software, e o resultado virou padrão: jogos pesados que sofriam para manter 45 FPS passaram a rodar lisos, travados em 40, com ganho visível sobre os 30 FPS de antes — e com menos consumo de bateria que tentar 90.
:::

## A matemática do frame time

Todo alvo de FPS tem um frame time correspondente, calculado dividindo 1000 milissegundos pelo número de quadros. É a conta mais útil que um jogador de Deck pode decorar:

| FPS | Frame time |
|---|---|
| 30 | 33,3 ms |
| 40 | 25,0 ms |
| 45 | 22,2 ms |
| 60 | 16,6 ms |
| 90 | 11,1 ms |

O salto de 30 para 40 FPS reduz o frame time em 8,3 ms, que é exatamente a mesma redução de 40 para 60 (de 25,0 para 16,6 ms). Em termos de percepção, sair de 30 para 40 é proporcionalmente maior que sair de 40 para 60, porque a diferença relativa é maior na base menor. Isso explica por que 40 FPS "parece 60" para muita gente, enquanto 30 parece claramente mais lento.

Uma forma rápida de confirmar que o painel está de fato em 40 Hz é inspecionar o log do gamescope durante a troca:

```terminal
$ journalctl -u gamescope | grep -i 'refresh\|Hz' | tail -4
jan 15 18:22:00 steamdeck gamescope[781]: [gamescope] Refresh rate set to 90Hz
jan 15 18:22:14 steamdeck gamescope[781]: [gamescope] Refresh rate changed: 90Hz → 40Hz
jan 15 18:22:14 steamdeck gamescope[781]: [gamescope] Display mode: 1280x800 @ 40Hz
```

A linha `90Hz → 40Hz` é a prova de que o gamescope aceitou a troca. Sem essa evidência, você estaria confiando apenas na sensação — e a sensação engana.

## O painel OLED e os múltiplos

O painel do Steam Deck OLED opera nativamente a 90 Hz. A chave do "40 Hz" é que a tela aceita ser dirigida a taxas que são **múltiplos inteiros do seu período base**: 90, 45 e 30 são divisores de 90, mas 40 Hz é alcançado porque o controlador do painel consegue trabalhar com uma temporização que produz 40 atualizações por segundo com vazio compensado.

Na prática o gamescope — o compositor do SteamOS — negocia essa taxa com o DRM do kernel, e não o `xrandr` diretamente. Isso explica por que, no menu do Modo Jogo, você vê 40 Hz disponível mesmo sem ele aparecer na lista crua de `xrandr`.

```terminal
$ xrandr --query | grep -E ' connected|40'
eDP-1 connected primary 1280x800+0+0 (normal left inverted right x axis y axis)
   1280x800      90.00*+   45.00    40.00    60.00
```

Neste exemplo hipotético, o agente de exibição já expõe 40 Hz como um modo válido, ao lado de 45, 60 e 90. A lista real varia conforme a versão do kernel e o firmware do painel.

## Travando em 40 de verdade

Limitar o FPS **sem** ajustar o refresh rate é meio caminho andado. Se você trava a GPU em 40 FPS mas deixa a tela em 60 Hz, o resultado é um ritmo irregular: alguns quadros duram um ciclo da tela, outros dois, e o *stutter* aparece. O truque do sweet spot é travar os dois números no mesmo valor — ou em valores que dividam exatamente.

No Modo Jogo do SteamOS isso é feito numa única tela: o menu de desempenho (o botão `...`) deixa você escolher o limite de quadros e, junto, o refresh rate do painel. Travou em 40 e pôs a tela em 40 Hz, o frame pacing fica perfeito. As seções seguintes mostram como forçar o equivalente pelo terminal, que é o que interessa a quem mexe por baixo do capô.

O resultado do casamento pode ser verificado na prática combinando o `xrandr` e o mangohud:

```terminal
$ xrandr --output eDP-1 --mode 1280x800 --rate 40
$ MANGOHUD_CONFIG=fps_limit=40,fps=1,frametime=1 mangohud %command%
$ xrandr --query | grep -E ' connected|40'
eDP-1 connected primary 1280x800+0+0 (normal left inverted right x axis y axis)
   1280x800      90.00+   45.00    40.00*   60.00
```

Com o `*` em 40.00 e o `fps_limit` em 40, o frame time do mangohud deve marcar 25,0 ms constante — a confirmação numérica do sweet spot.

:::atencao
Trocar o refresh rate pelo menu enquanto um jogo está aberto pode não surtir efeito imediato em títulos que capturam o modo de vídeo no arranque. Se o 40 Hz não "colar", feche o jogo, ajuste o painel, e reabra.
:::

## Resumo

- 40 FPS a 40 Hz tem frame time constante de 25 ms — frame pacing perfeito.
- 30 FPS numa tela de 60 Hz exibe cada quadro por dois ciclos, com intervalo de 33,3 ms.
- Sair de 30 para 40 FPS reduz o frame time em 8,3 ms, ganho proporcionalmente maior que 40→60.
- O painel OLED do Deck roda 40 Hz por software via gamescope, mesmo sendo nativo de 90 Hz.
- Limitar FPS sem casar o refresh rate gera *stutter*; o ideal é travar os dois juntos.
- O Modo Jogo expõe o par limite de FPS + refresh rate numa única tela de desempenho.

## Exercícios

1. Monte uma tabela com os frame times de 30, 40, 45, 60 e 90 FPS e verifique as contas com uma calculadora.
2. No Modo Jogo, abra um título pesado e alterne entre 30 FPS (tela 90 Hz) e 40 FPS (tela 40 Hz). Compare a fluidez e anote a sensação de cada um.
3. Use o overlay de performance para observar o frame time (em ms) em cada configuração. Ele bate com os valores da tabela?
4. Confira, no menu de desempenho, se o seu Deck expõe 40 Hz para o painel embutido. Se sim, veja se o alvo de 40 aparece como opção de FPS.
5. **Desafio.** Explique, em termos de divisores e frame time, por que 40 FPS a 40 Hz é "melhor" que 45 FPS a 45 Hz em um jogo que mal sustenta 45 — relacionando consumo de GPU, latência e fluidez.
