No Steam Deck, a GPU é uma AMD RDNA2, e o driver gráfico usado pelo Proton é o RADV — o driver Vulkan de código aberto do projeto Mesa. Esse driver expõe uma série de botões de ajuste de desempenho através da variável `RADV_PERFTEST`. São *switches* experimentais e de otimização que podem mudar o FPS de forma significativa, mas que também podem introduzir instabilidade se mal usados.

:::objetivos
- Entender o papel do driver RADV na pilha gráfica do Steam Deck
- Ativar otimizações do RADV com `RADV_PERFTEST`
- Reconhecer os valores mais usados: `aco`, `gpl` e outros
- Medir o efeito de cada flag com o HUD
- Evitar combinações perigosas ou instáveis
:::

## De onde vêm esses botões

O Steam Deck não usa o driver proprietário da NVIDIA nem o `amdgpu-pro`; usa o **Mesa**, um projeto que reúne os drivers de código aberto para várias GPUs. Dentro do Mesa, o `radv` é o driver Vulkan específico para placas AMD. E ele tem duas classes de opções: as estáveis (comportamento padrão) e as experimentais, agrupadas sob `RADV_PERFTEST`.

A variável funciona como uma lista de flags separadas por vírgula:

```text
RADV_PERFTEST=aco,gpl %command%
```

Cada flag liga um comportamento. Algumas já são o padrão em builds recentes, e passá-las é redundante; outras são experimentais e podem variar de uma versão do Mesa para outra.

:::info
`aco` e `gpl` já são ativados por padrão no Mesa moderno do SteamOS 3.6. Historicamente eram os grandes ganhos (o compilador de shaders ACO e o *Graphics Pipeline Library*), por isso ainda circulam na comunidade. Hoje, passá-los é inofensivo mas frequentemente desnecessário.
:::

## As flags que valem conhecer

A lista muda com o tempo, mas algumas aparecem com frequência nas discussões da comunidade:

| Flag | O que faz |
|---|---|
| `aco` | Usa o compilador de shaders ACO (mais rápido que o LLVM antigo) |
| `gpl` | Habilita a Graphics Pipeline Library, reduzindo o custo de compilar pipelines |
| `sam` | *Smart Access Memory* — permite acesso direto à VRAM para ganho em algumas cargas |
| `nggc` | *NGG Culling* — habilita o modo NGG da RDNA2 para melhorar culling de geometria |
| `nort` | Desativa o *ray tracing* do RADV |

Nem toda flag ajuda todo jogo. O `gpl`, por exemplo, reduz o *stutter* de compilação em jogos DirectX 12 via VKD3D; o `sam` pode trazer ganho em jogos pesados de textura. A melhor abordagem é testar uma flag por vez e medir.

```terminal
$ RADV_PERFTEST=gpl %command%
```

Teste isolado: ligue apenas `gpl`, rode, anote o desempenho. Depois `sam`, e assim por diante. Combinar tudo de uma vez torna impossível saber qual flag ajudou (ou atrapalhou).

Para experimentar várias flags rapidamente sem reabrir o jogo pela interface, rode pela linha de comando e alterne os valores entre execuções:

```terminal
$ RADV_PERFTEST=gpl steam -applaunch 1174180
## jogue alguns minutos e anote
$ RADV_PERFTEST=sam steam -applaunch 1174180
## jogue de novo e compare
```

Cada `steam -applaunch` inicia uma sessão nova com a flag escolhida. É mais rápido que editar o campo de inicialização a cada teste, e você mantém as execuções separadas para comparar números.

## Medindo com o HUD do RADV

O RADV tem seu próprio HUD de desempenho, ligado pela variável `RADV_PERFTEST`, mas há um jeito mais direto de ver FPS e uso de GPU: o HUD do próprio DXVK ou o MangoHud ([ver a seção sobre MangoHud](#/cap-041/sec-08)). Para confirmar que uma flag foi aceita, rode com mensagens do driver ativas:

```terminal
$ RADV_DEBUG=startup %command%
```

O `RADV_DEBUG=startup` imprime, na saída, as opções com as quais o driver foi inicializado. É a forma de confirmar que a flag chegou ao RADV e não foi ignorada por ser redundante ou inválida. A saída aparece no log do Proton, não na tela do jogo, então rode pela linha de comando para vê-la.

:::atencao
Flags experimentais podem **quebrar** um jogo que funcionava. Se um título começar a apresentar artefatos ou travamentos logo após você adicionar um `RADV_PERFTEST`, remova a flag antes de qualquer outra investigação. A regra de ouro: uma mudança por vez, revertível a qualquer momento.
:::

## O que esperar de ganho

Os ganhos de `RADV_PERFTEST` são, na maioria dos casos, de alguns pontos percentuais de FPS ou de redução de *stutter* — perceptíveis no 1% baixo, não no FPS máximo. Não há flag que dobre o desempenho de um jogo. O valor real dessas opções está em casos específicos:

- `gpl` em jogos DirectX 12 (via VKD3D) com muito *stutter* de compilação.
- `sam` em jogos com orçamento de VRAM apertado no Deck.
- `nggc` em jogos com geometria pesada (muitos polígonos na tela).

Para a maioria dos jogos, o melhor "ajuste de GPU" do Deck continua sendo o **limite de TDP** e o **limite de FPS** na interface do próprio SteamOS, porque controlam o consumo e a temperatura com efeito mais previsível que flags experimentais do driver.

:::dica
Antes de caçar flags, meça o seu baseline. Rode o jogo com o MangoHud ligado, anote FPS médio e 1% baixo, depois teste uma flag por vez e compare. Sem baseline, "parece que ficou melhor" não é medição.
:::

## Resumo

- O Steam Deck usa o driver RADV (Mesa), com opções de desempenho expostas por `RADV_PERFTEST`.
- As flags são passadas separadas por vírgula, ex.: `RADV_PERFTEST=aco,gpl %command%`.
- `aco` e `gpl` já são padrão no Mesa moderno; hoje são redundantes na maioria dos builds.
- `sam`, `nggc` e `nort` controlam acesso à VRAM, culling de geometria e ray tracing.
- `RADV_DEBUG=startup` confirma as opções com que o driver foi inicializado.

## Exercícios

1. Rode um jogo com `RADV_DEBUG=startup` pela linha de comando e leia as opções de inicialização do driver.
2. Meça o FPS e o 1% baixo de um jogo sem flags (baseline), usando MangoHud.
3. Teste `RADV_PERFTEST=gpl` isoladamente e compare com o baseline.
4. Teste `RADV_PERFTEST=sam` e veja se há diferença em um jogo pesado de textura.
5. **Desafio.** Escolha um jogo com *stutter* e monte um experimento: baseline, depois `gpl`, depois `nggc`, anotando resultados. Escreva qual flag teve efeito e defenda com os números.
