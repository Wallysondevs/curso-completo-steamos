Até aqui, cada botão do layout corresponde a um comando de jogo ou a uma tecla. Mas o SteamInput é uma máquina de Turing disfarçada de driver de controle: ele pode disparar uma **sequência** de comandos com um único botão, atrasar entre eles e até alternar entre duas ações. Isso se chama **macro**, e bem usada vira um superpoder.

:::objetivos
- Entender os modos de disparo: regular press, start press, release press e turbo
- Criar macros de até 8 comandos em sequência com delays
- Usar o modo *toggle* para alternar entre dois estados
- Reconhecer os limites: macros são locais, não automatizam scripting
- Inspecionar como o SteamInput representa macros no arquivo VDF
:::

## Além do disparo simples: os modos de pressão

O modelo mais básico de um botão é "apertei → disparou". O SteamInput oferece quatro maneiras de disparar um mesmo botão, dependendo de *quando* você quer que a ação aconteça:

| Modo | Dispara | Caso de uso |
|---|---|---|
| `Regular Press` | Quando o botão é pressionado e sustentado | Ação normal ("atirar", "pular") |
| `Start Press` | Só no primeiro frame da pressão | Abrir menu, acionar habilidade única |
| `Release Press` | Só quando você solta o botão | Carregar golpe e soltar, mirar e atirar |
| `Turbo` | Repetidamente enquanto mantém pressionado | Disparo automático, correr sem cansar o dedo |

O `Release Press` é o menos óbvio e o mais útil em jogos que distinguem "carregar" de "disparar": você segura `X` para carregar o arco e, ao soltar, o `Release Press` envia o comando de disparo. O `Turbo`, por sua vez, transforma um botão de "apertar toda hora" em "segurar e deixar rolar" — essencial em jogos com *quick-time events* repetitivos.

:::dica
Em jogos que exigem apertar `A` freneticamente para correr ou nadar, mapeie um botão traseiro com `Turbo A` a 30 Hz. Seu polegar agradece e o personagem corre igual.
:::

## Macros: uma sequência com um botão só

Uma macro é uma lista de comandos executados em ordem, com atraso configurável entre eles. Uma macro típica de *fighting game* poderia ser:

```text
Botão R5 → Modo: Macro
  1. Pressionar L1 (delay: 100 ms)
  2. Pressionar X (delay: 50 ms)
  3. Pressionar Baixo + X (delay: 150 ms)
  4. Soltar Baixo + X
  5. Pressionar Y (delay: 80 ms)
  6. Pressionar R1
```

Cada linha da macro tem um comando e um tempo de espera até a próxima. O tempo é em milissegundos, e o mínimo prático é ~30 ms — abaixo disso, o jogo pode não registrar o input (depende da engine e do *polling rate* do controle).

Uma macro de até 8 passos cobre combos, sequências de crafting, comandos de esquadrão em RTS — qualquer coisa que siga uma receita fixa.

:::atencao
Macros do SteamInput **não são scripts Turing-completos**. Elas não têm loops, condições, leitura de tela nem branches. Se você precisa de automação complexa (loops, espera por pixel, condicionais), isso não é mais SteamInput — é ferramenta externa, como `xdotool` ou AutoHotkey (no Windows). Dentro do Deck, o equivalente seria `ydotool`, mas ele não integra com o SteamInput.
:::

## Inspecionando macros no VDF

No arquivo de configuração, uma macro aparece como um bloco `activators` com múltiplos `bindings` sequenciais, cada um com `delay`:

```terminal
$ grep -A 20 'macro' ~/.local/share/Steam/controller_base/templates/handheld_neptune.vdf 2>/dev/null || echo "Nenhuma macro no template base"
Nenhuma macro no template base
```

O template oficial não inclui macros, então vamos inspecionar um layout personalizado que as contenha:

```terminal
$ find ~/.local/share/Steam -name '*.vdf' -exec grep -l 'activators' {} \; 2>/dev/null | head -3
/home/deck/.local/share/Steam/config/steamcontroller_amap_config.vdf
```

O `steamcontroller_amap_config.vdf` contém o mapa de ativação (*activator map*) — é onde os modos de disparo e macros são registrados para cada controle já configurado na máquina.

## Toggle: o botão que fica ligado

Entre macro e botão simples existe o **toggle**: um botão que, ao ser pressionado, alterna entre dois estados. Pressionou uma vez → liga (e mantém). Pressionou de novo → desliga.

```text
Botão R4 → Modo: Toggle
  Estado A: W (andar para frente, mantido)
  Estado B: nenhum comando
```

Isso é diferente de turbo (que repete) e diferente de macro (que dispara uma fila). O toggle mantém uma tecla pressionada continuamente até você pressionar de novo. É útil para:

- Correr ou andar sem segurar nada (toggle `Shift`)
- Agachar e manter agachado (toggle `Ctrl`)
- Lanterna ligada/desligada em jogos de terror

:::nota
O toggle é "hold toggle", não "fire toggle". Ele não repete o comando; ele o mantém pressionado. Para um jogo que espera ver `Shift` pressionado, o toggle é transparente — o jogo acha que seu dedo está lá.
:::

## Resumo

- O SteamInput oferece quatro modos de disparo: `Regular Press`, `Start Press`, `Release Press` e `Turbo`.
- `Release Press` dispara ao soltar o botão, ideal para carregar-e-disparar.
- Macros são sequências de até 8 comandos com delays em milissegundos, sem loops nem condições.
- O toggle mantém uma tecla pressionada até o próximo toque — diferente de turbo que repete.
- O arquivo `steamcontroller_amap_config.vdf` registra os activator maps de todos os controles.
- Macros complexas (loops, condicionais) exigem ferramentas externas como `ydotool`, fora do escopo do SteamInput.

## Exercícios

1. Mapeie um botão traseiro com `Turbo A` e teste num jogo que exige pressionar `A` repetidamente. Ajuste a taxa (Hz) até achar o mínimo que o jogo ainda registra.
2. Crie uma macro de 4 passos que faça `Ctrl+1` → delay 100 ms → `Ctrl+2` → delay 100 ms → `Ctrl+3` → delay 100 ms → `Ctrl+4` e teste num jogo com barra de habilidades numeradas.
3. Configure `R4` como toggle de `Shift` e descreva a diferença de conforto em relação a segurar `Shift` o tempo todo.
4. Compare `Release Press` com `Regular Press` para o mesmo botão de ataque: qual deles dispara o comando mais cedo? Como isso afeta o timing do jogo?
5. **Desafio.** Combine macro com camada: crie uma camada ativada por `L5` onde `R5` executa uma macro de combo de 6 passos. Soltando `L5`, `R5` volta ao comportamento normal. Teste num jogo de luta e avalie se o combo sai consistente.