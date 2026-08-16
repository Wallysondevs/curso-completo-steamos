Os controles são a parte do Deck que mais sofre desgaste mecânico, e entre eles o **manche analógico (stick)** é o campeão de defeitos — o famoso *drift*. Botões, gatilhos e o touchpad também falham com o tempo. Felizmente, a Valve vende todas essas peças como módulos de reposição, e a troca está entre as mais acessíveis.

:::objetivos
- Entender o drift do stick e a diferença entre potenciômetro e hall effect
- Trocar os sticks analógicos (esquerdo/direito) do Deck
- Reconhecer e substituir botões e membranas desgastados
- Calibrar e testar controles após a troca via `evtest`/Steam Input
- Conhecer as opções de upgrade (hall effect, sticks de terceiros)
:::

## O que é drift e por que acontece

O stick analógico mede a posição através de um **potenciômetro** — uma trilha resistiva que o eixo desliza. Com o tempo e o uso, essa trilha desgasta, acumula sujeira e começa a reportar um leve desvio mesmo com o eixo em repouso. Resultado: seu personagem anda sozinho, a câmera gira sozinha.

```terminal
$ sudo evtest --grab /dev/input/event<N>
```

O `evtest` lê em tempo real os eventos. Com o stick em repouso, o eixo X/Y deve reportar valores centrais (tipicamente 128 de 0–255 em um ADC de 8 bits, ou próximo de 0 em valores normalizados). Um desvio constante indica drift.

:::dica
Antes de condenar o stick, limpe-o pelo software: a Steam UI tem uma zona morta (deadzone) que você pode aumentar para mascarar drift leve. Se o drift some ao aumentar a deadzone de 0 para ~10%, é desgaste inicial — você pode conviver por um tempo ou trocar.
:::

## Potenciômetro vs. hall effect

A solução definitiva para drift é o stick **hall effect**: em vez de trilha resistiva, ele usa sensores magnéticos que não tocam e não desgastam. Sticks hall effect de terceiros (GuliKit e outros) existem para o Deck e são o upgrade preferido de quem joga muito.

```terminal
$ printf 'Potenciometro: barato, desgasta, drift com o tempo.\n'
$ printf 'Hall effect: magnetico, sem contato, praticamente sem drift.\n'
```

A troca é idêntica — o stick hall effect é um drop-in (mesmo formato e conector). A diferença é que ele pode precisar de calibração de centro um pouco diferente; alguns kits trazem placa de calibração própria.

## Troca do stick (dificuldade: baixa–média)

Cada stick é um módulo: placa do stick + eixo + bucha. Ele fica sob a tampa traseira, preso por 3 parafusos e conectado por um flat cable.

**Passos:**
1. Deck aberto, bateria desconectada.
2. Identifique o stick a trocar (esquerdo ou direito); os módulos são espelhados, não troque de lado.
3. Remova os 3 parafusos do stick.
4. Solte a trava do flat cable (spudger) e desconecte.
5. Remova o stick velho; instale o novo no mesmo sentido, conecte o flat, recoloque os parafusos.

```terminal
$ sudo evtest /dev/input/event<N>
# depois: centralize o stick e veja o repouso em X/Y
```

Após a troca, rode `evtest` novamente e confirme que o repouso está centralizado. Se houver desvio residual, ajuste a deadzone na Steam UI.

:::atencao
Os flat cables dos sticks são finos e curtos. Solte a trava (levante o clipe escuro com spudger) **antes** de puxar o cabo, e reconecte alinhado reto — flat cable torto pode não fazer contato em todos os pinos e gerar botão fantasma.
:::

## Botões, gatilhos e membranas

Atrás de cada botão (A/B/X/Y, direcional, bumpers) há uma **membrana de borracha condutiva** ou um microswitch. Com o tempo a borracha resseca e o botão perde o "click" e a resposta. A Valve vende as membranas e o conjunto de botões como peças separadas.

```terminal
$ cat /proc/bus/input/devices | grep -iE 'steam|valve|deck'
```

Este comando lista os dispositivos de entrada. O Deck aparece como um bloco (ou vários) com os eixos e botões mapeados. Use `evtest` para apertar cada botão e ver o evento (KEY/BTN) registrar — um botão que não emite evento é mecânico (membrana/microswitch), não software.

**Troca de membrana/botão** exige abrir mais profundamente (remover a placa do controle), o que sobe a dificuldade. Siga o guia iFixit específico do seu modelo, pois a posição dos parafusos e cabos muda entre LCD e OLED.

## Touchpads e vibração

Os touchpads também são módulos com cabo próprio. Se um touchpad parou de responder ou treme, verifique o conector antes de trocar — muitos "defeitos" de touchpad são só flat cable mal encaixado após uma abertura anterior.

```terminal
$ sudo xinput list | grep -i touchpad
```

O `xinput` lista os dispositivos de apontamento. Confirme que o touchpad aparece; se aparecer mas não responder, é mecânico; se nem aparecer, o cabo/conector pode estar solto.

## Opções de upgrade

- **Hall effect sticks** — fim do drift.
- **Botões de reposição** com cores/formatos sob medida (custom).
- **TPU/grips** novos para restaurar a pegada da carcaça.
- **MicroSD de alta velocidade** (não é "físico" mas é a substituição mais barata de expandir).

```terminal
$ lsblk -o NAME,MODEL,TRAN | grep -iE 'nvme|mmc'
```

A seção 8 fecha o capítulo com a manutenção preventiva — o trabalho de rotina que, bem feito, evita a maioria dessas trocas.
