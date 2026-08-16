Um Steam Deck só vira máquina de trabalho de verdade quando está no dock, ligado a um monitor, teclado e mouse externos. Nesse cenário, os atalhos deixam de ser conveniência e passam a ser o jeito normal de operar — e alguns comportamentos mudam em relação ao uso portátil. Esta seção cobre o que muda e como tirar proveito do dock.

:::objetivos
- Entender o que muda nos atalhos quando o Deck está no dock
- Configurar teclado físico externo e multitelas
- Usar atalhos de produtividade com monitor grande e teclado completo
- Diferenciar o modo desktop dockado do uso portátil
:::

## O Deck dockado é outro computador

Quando o Steam Deck entra no dock oficial (ou num hub USB-C), ele vira um desktop convencional: saída de vídeo externa, teclado e mouse USB, Ethernet. O sistema operacional é o mesmo, mas a forma de operar muda — e os atalhos acompanham essa mudança.

A primeira diferença aparece na tecla `Meta`. No modo portátil, `Meta` é o botão Steam físico do aparelho. No dock, com teclado externo, `Meta` é a tecla Windows/Super do teclado — funcionalmente idêntica para o KDE, mas agora há uma tecla dedicada a ela, o que libera o botão Steam para continuar sendo atalho da Valve.

```terminal
$ xdotool key super
```

Num teclado externo, o `xdotool key super` pressiona exatamente a tecla Windows. O KDE trata `Meta`, `Super` e o botão Steam do Deck como a mesma tecla modificadora. O que muda é só onde essa tecla fica fisicamente.

:::nota
O dock do Steam Deck usa o modo DisplayPort Alt Mode sobre USB-C para o vídeo, e o hub adiciona portas USB-A e Ethernet. Do ponto de vista do sistema, é tudo padrão: o monitor aparece como uma saída comum, o teclado como um HID, e nada disso exige configuração especial no SteamOS.
:::

## Gerenciando múltiplas telas por atalho

Com um monitor externo, o Deck tem duas telas: a interna do aparelho e a externa. O KWin organiza isso com o conceito de "screens" (telas) e o atalho que move a janela entre elas é o mais importante do fluxo dockado:

```terminal
$ grep -iE 'screen|output' ~/.config/kglobalshortcutsrc | head -10
Window to Screen 0=Meta+Shift+Right,Meta+Shift+Right,Window to Screen 0
Window to Screen 1=Meta+Shift+Left,Meta+Shift+Left,Window to Screen 1
```

O atalho "Window to Screen N" move a janela ativa para a tela vizinha sem arrastar com o mouse. Num fluxo de trabalho com referência numa tela e edição na outra, é o movimento mais repetido — e dominá-lo elimina o maior atrito do uso dockado.

```terminal
$ xdotool key super+shift+right
```

O comando acima move a janela ativa para a tela do lado direito. É a mesma coisa que o atalho, mas via script, permitindo automatizar a arrumação do espaço de trabalho inteiro com um único disparo.

:::dica
Combine "Quick Tile" com "Window to Screen": primeiro mova a janela para a tela certa com [[Steam+Shift+Right]], depois encaixe-a numa metade com [[Steam+Left]]. Dois atalhos bastam para posicionar qualquer janela em qualquer quadrante das duas telas, sem tocar no mouse.
:::

## Produtividade com teclado completo

O teclado externo traz de volta teclas que o Deck não tem fisicamente: `Home`, `End`, `PageUp`, `PageDown`, o teclado numérico e todas as teclas de função. Isso destrava atalhos que no modo portátil exigiam combinações contorcionistas.

| Tarefa | Atalho no teclado externo | Por que importa dockado |
|---|---|---|
| Ir ao início da linha | `Home` | editar texto/terminal rápido |
| Ir ao fim da linha | `End` | idem |
| Mover janele entre telas | [[Steam+Shift+Left/Right]] | fluxo multitelas |
| Alternar layout de teclado | [[Meta+Space]] | teclado físico com outro idioma |
| Lançar terminal | [[Ctrl+Alt+T]] | trabalho em shell |
| Fechar janela | [[Alt+F4]] | dispensar o mouse |

O teclado físico também permite o que o virtual dificulta: segurar modificadores. Digitar `Ctrl+Shift+V` (colar sem formatação no terminal) é trivial no teclado e penoso no virtual. Por isso, tarefas que envolvem shell ficam muito mais rápidas no dock.

```terminal
$ setxkbmap -query
layout:     us
variant:    
```

Se o teclado externo estiver com layout diferente do esperado (ABNT2, por exemplo), o `setxkbmap -query` mostra o layout ativo, e `setxkbmap br` troca para ABNT2 na hora. É o ajuste mais comum ao conectar um teclado novo no dock.

## O que continua igual

Nem tudo muda. Os atalhos do KDE e do Steam são idênticos no dock e no portátil, porque dependem do sistema, não do formato do aparelho. O que muda é **ergonomia**: no dock você tem mais teclas físicas e telas maiores, então os atalhos de janela e multitelas ganham protagonismo, enquanto os de OSK perdem relevância.

```terminal
$ qdbus org.kde.kglobalaccel /component/kwin org.kde.kglobalaccel.Component.shortcutNames | grep -iE 'screen|tile' | head
Window Quick Tile Bottom
Window Quick Tile Left
Window Quick Tile Right
Window to Screen 0
Window to Screen 1
```

A lista de atalhos do KWin é a mesma nas duas situações — a diferença é só quais você usa com frequência.

:::exemplo
Cenário real: dock com monitor 27", teclado mecânico e mouse. Você abre o terminal na tela interna do Deck para monitorar logs e o editor na tela externa. Move o editor com [[Steam+Shift+Right]], maximiza com [[Steam+Up]], e usa `Home`/`End` para editar. O Deck portátil virou uma workstation, e os atalhos é que fazem a transição ser fluida.
:::

## Resumo

- No dock, a tecla `Meta` do KDE passa a ser a tecla Windows/Super do teclado externo.
- "Window to Screen N" ([[Steam+Shift+Left/Right]]) move janelas entre as telas interna e externa.
- O teclado externo restaura teclas como `Home`, `End` e o teclado numérico, que o Deck não tem fisicamente.
- `setxkbmap -query` e `setxkbmap br` verificam e ajustam o layout do teclado externo.
- Os atalhos do KDE e do Steam são os mesmos no dock e no portátil; muda a ergonomia.
- Combinar "Quick Tile" com "Window to Screen" posiciona janelas em qualquer quadrante sem mouse.

## Exercícios

1. Conecte o Deck a um monitor e rode `setxkbmap -query` para confirmar o layout do teclado externo.
2. Mova uma janela entre as telas usando [[Steam+Shift+Right]] e depois encaixe-a com [[Steam+Left]].
3. Use `grep 'Window to Screen' ~/.config/kglobalshortcutsrc` para ver o mapa completo de movimentação entre telas.
4. Liste os atalhos do KWin com `qdbus` e separe os que só fazem sentido com múltiplas telas.
5. **Desafio.** Escreva um script que use `xdotool` para, numa única execução, mover a janela ativa para a tela externa e maximizá-la — e associe-o a um atalho customizado.
