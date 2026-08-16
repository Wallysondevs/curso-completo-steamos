Além do mapeamento simples de botão, o Steam Input oferece recursos avançados que transformam o Deck num controlador programável: chords, action sets, camadas e menus radiais. Esses conceitos permitem multiplicar as funções de um único botão e criar macros compostas. Esta seção explica cada um e mostra como combiná-los em fluxos reais.

:::objetivos
- Entender chords e action layers como modificadores de estado
- Configurar action sets para trocar perfis em tempo de jogo
- Criar menus radiais em touchpads para acesso rápido a ações
- Montar macros de múltiplos passos com atrasos
:::

## Chords e action layers

Um **chord** é uma combinação de botões que, ao serem pressionados em sequência ou simultaneamente, ativam uma camada diferente de ações. É o equivalente a `Ctrl`+`C` no teclado — mas aplicado aos botões do Deck.

| Conceito | O que faz | Quando usar |
|---|---|---|
| **Chord** | Combinação de dois botões dispara ação própria | Atalhos raros que não merecem botão dedicado |
| **Action layer** | Troca temporária do mapeamento enquanto um botão é segurado | Modos "segurar para alternar" (ex.: gatilho muda tudo) |
| **Action set** | Troca completa de perfil com um botão | Estados distintos: menu vs. jogo |
| **Menu radial** | Touchpad vira um menu circular de opções | Acesso rápido a 4–12 ações |

O caso mais clássico de action layer é um jogo de tiro: enquanto você segura `L2` (mira/ADS), o giroscópio tem sensibilidade reduzida para precisão; ao soltar, volta à sensibilidade normal. Isso é uma **layer** aplicada ao gatilho.

```terminal
$ ls ~/.local/share/Steam/controller_config/deck/
24c9aaaa.vdf  personalization/  template/
```

Os templates (`template/`) guardam perfis reutilizáveis exportados pela comunidade. Você pode importar um template com chords já prontos e adaptá-lo ao seu jogo, em vez de construir do zero.

## Montando uma macro multi-passo

Uma macro é uma sequência de ações disparada por um único botão. No Steam Input, macros suportam múltiplos passos com atrasos configuráveis entre eles.

| Passo | Ação comum | Exemplo |
|---|---|---|
| 1 | Pressionar tecla/modificador | `Ctrl` (segurar) |
| 2 | Pressionar tecla principal | `Shift` + `P` |
| 3 | Atraso (delay) | 120 ms |
| 4 | Soltar teclas | Soltar tudo |

Um exemplo prático: mapear o botão traseiro `L5` para abrir um menu que normalmente exigiria `Ctrl`+`Shift`+`M` e depois `Enter`. A macro pressiona tudo em sequência, com atrasos para o jogo registrar cada evento.

:::atencao
Macros com muitos passos e atrasos curtos podem ser "engolidas" por jogos que amostram input em baixa frequência. Se uma macro não funciona, aumente os atrasos para 100–200 ms e teste passo a passo antes de culpar o mapeamento.
:::

## Menus radiais em touchpads

O menu radial transforma um touchpad (ou o analógico) num mostrador circular: toque num dos setores para disparar a ação associada. É a forma mais eficiente de acessar de 4 a 12 comandos sem desviar o olhar do jogo.

| Configuração | Opções |
|---|---|
| Número de setores | 4, 6, 8 ou 12 |
| Feedback | Haptic (vibração) ao passar por setor |
| Ação por setor | Qualquer tecla, botão ou comando |
| Ativação | Toque simples, clique ou segurar |

Um uso comum é o menu radial no touchpad esquerdo para armas ou habilidades: 8 setores, cada um trocando para uma arma ou ativando uma habilidade. Basta tocar no setor correspondente.

```terminal
$ python3 -c "import evdev; d=evdev.InputDevice('/dev/input/event13'); print(d.name, d.capabilities(verbose=True)[2][:6])"
Steam Deck Touchpad 1 [('ABS_X', 0), ('ABS_Y', 1), ('ABS_PRESSURE', 2), ('ABS_MT_POSITION_X', 3), ('ABS_MT_POSITION_Y', 4), ('ABS_MT_TRACKING_ID', 5)]
```

O touchpad se apresenta ao kernel como dispositivos `evdev` com múltiplos eixos (`ABS_X`, `ABS_Y`, além de eixos multitouch `ABS_MT_*`). O Steam Input usa o `ABS_PRESSURE` para distinguir toque leve de clique firme — é isso que permite "toque simples" e "clique" como ações diferentes no menu radial.

:::dica
Para menus radiais rápidos, configure o touchpad para ativar a ação **no toque** (não no clique). Isso reduz o tempo de resposta a uma fração de segundo — essencial em jogos competitivos onde cada frame conta.
:::

Os action sets, por sua vez, são o recurso de reorganização mais drástica: mudam o perfil inteiro com o pressionar de um botão. No sistema de arquivos, cada action set vira uma seção distinta dentro do `.vdf`:

```terminal
$ head -20 ~/.local/share/Steam/controller_config/deck/*.vdf | grep -E '(action_set|group_source)'
"action_set" {"default" {"bindings" { ... }}}
"group_source" "button_diamond"
```

A saída mostra que cada action set tem seu próprio bloco `"action_set"` no arquivo de perfil. Um perfil com dois action sets terá dois blocos desses — um para "menu" e um para "jogo", por exemplo. Saber ler essa estrutura é útil para depurar por que um botão funciona num set e não no outro: muitas vezes o binding foi definido apenas num dos sets e no outro não.

## Resumo

- Chords são combinações de botões que disparam ações sem botão dedicado.
- Action layers trocam o mapeamento temporariamente enquanto um modificador está segurado.
- Action sets trocam perfis completos entre estados (menu vs. jogo).
- Macros suportam múltiplos passos com atrasos configuráveis entre eventos.
- Menus radiais em touchpads oferecem acesso a 4–12 ações com um toque por setor.

## Exercícios

1. Crie um chord com o botão Steam + D-Pad que dispare uma captura de tela. Teste se funciona dentro de um jogo.
2. Configure um action layer no gatilho L2 que reduza a sensibilidade do giroscópio enquanto pressionado. Compare a precisão com e sem a layer.
3. Monte uma macro no botão traseiro R5 que pressione Ctrl+Shift+M, espere 150 ms e pressione Enter. Teste num editor ou navegador.
4. Crie um menu radial de 8 setores no touchpad esquerdo para trocar de arma/habilidade. Teste os feedbacks hápticos em cada setor.
5. **Desafio.** Combine dois action sets (menu e jogo) com um chord de troca. No set "menu", o touchpad esquerdo navega com mouse; no set "jogo", vira menu radial. Documente o fluxo de troca e verifique se o estado persiste ao minimizar o jogo.