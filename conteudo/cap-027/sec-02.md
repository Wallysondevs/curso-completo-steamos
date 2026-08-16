O KDE delega a gestão das janelas a um componente separado: o **KWin**, o gerenciador de janelas do Plasma. É ele quem decide onde uma janela nasce, como ela se move e o que acontece com as teclas que mexem nela. Dominar os atalhos do KWin é o que separa quem usa o Deck com mouse de quem o usa como uma máquina rápida, sem tirar as mãos do lugar.

:::objetivos
- Reconhecer o papel do KWin na composição e gestão de janelas
- Aplicar atalhos de mover, fechar, maximizar e ladrilhar janelas
- Alternar entre áreas de trabalho virtuais pelo teclado
- Entender o atalho de "matar" janela travada
:::

## O que o KWin faz por você

Todo ambiente gráfico precisa responder a uma pergunta básica: quando você aperta uma tecla, o sistema precisa saber se ela é um atalho global (vale para o desktop todo) ou um caractere a ser entregue à aplicação em foco. O KWin fica no meio dessa decisão. As combinações que ele reivindica — como [[Alt+Tab]] — são interpretadas por ele antes de chegarem a qualquer aplicativo.

É por isso que, num jogo rodando em janela, apertar [[Alt+Tab]] não digita nada na tela: o KWin intercepta a tecla e alterna a janela. Esse modelo de "atalho global vs. tecla de aplicativo" é central para entender por que alguns atalhos funcionam em todo lugar e outros só dentro de um programa.

```terminal
$ ps -ef | grep -i kwin | grep -v grep
deck     2142  2102  2 14:05 ?        00:03:12 /usr/bin/kwin_wayland
```

O processo `kwin_wayland` indica que o Deck roda o KWin sobre Wayland, o protocolo gráfico moderno do Linux. É esse processo que compõe as janelas na tela e que recebe os atalhos de janela.

## Mover, fechar e maximizar

O conjunto mais útil de atalhos do KWin gira em torno de manipular a janela ativa. Repare que o Steam Deck usa a tecla **Steam** no lugar da `Meta` tradicional:

```terminal
$ grep -A20 '^\[kwin\]$' ~/.config/kglobalshortcutsrc | grep -Ei 'close|maximize|minimize|move|tile' | head -10
Window Close=Alt+F4,Alt+F4,Close Window
Window Maximize=Meta+Up,Meta+Up,Maximize Window
Window Minimize=Meta+Down,Meta+Down,Minimize Window
Window Quick Tile Left=Meta+Left,Meta+Left,Quick Tile Window to the Left
Window Quick Tile Right=Meta+Right,Meta+Right,Quick Tile Window to the Right
Window Quick Tile Top=Meta+PageUp,Meta+PageUp,Quick Tile Window to the Top
```

Cada linha segue o padrão `ação=tecla padrão, tecla atual, rótulo`. A família de "Quick Tile" é especialmente valiosa no Deck, porque a tela é relativamente pequena e encaixar duas janelas lado a lado é a forma mais confortável de trabalhar com duas coisas ao mesmo tempo — um tutorial aberto de um lado e o terminal do outro.

:::exemplo
Cenário real: você está seguindo um guia no navegador e precisa copiar comandos para o terminal. Aperte [[Steam+Left]] para encaixar o navegador na metade esquerda, clique no terminal, aperte [[Steam+Right]] e pronto: os dois ficam lado a lado, sem arrastar borda com o trackpad.
:::

O atalho "matar janela" merece destaque porque resolve a situação mais comum de travamento:

```terminal
$ grep -i 'Kill Window' ~/.config/kglobalshortcutsrc
Window Operations Menu=Alt+F3,Alt+F3,Window Operations Menu
```

O KWin também expõe o menu de operações da janela via [[Alt+F3]], de onde você pode forçar o fechamento sem procurar o botão X.

:::atencao
O atalho "Kill Window" (geralmente [[Ctrl+Alt+Esc]]) transforma o cursor em uma caveira e **mata** a janela que você clicar. É a última cartada para aplicativos travados — mas não salve nada em aberto nela, porque o processo é encerrado na hora, sem confirmação.
:::

## Áreas de trabalho virtuais

O Plasma permite ter vários desktops virtuais, cada um com seu conjunto de janelas. No Steam Deck isso é útil para separar "modo jogo" de "modo trabalho" no desktop, sem fechar nada: um desktop com o Steam e os jogos, outro com o terminal e o editor.

Os atalhos de troca de desktop também vivem no KWin:

```terminal
$ grep -iE 'desktop' ~/.config/kglobalshortcutsrc | grep -Ei 'switch|next|previous' | head -8
Switch to Next Desktop=Ctrl+F2,Ctrl+F2,Switch to Next Desktop
Switch to Previous Desktop=Ctrl+F3,Ctrl+F3,Switch to Previous Desktop
Switch One Desktop to the Right=Ctrl+Alt+Right,Ctrl+Alt+Right,Switch One Desktop to the Right
Switch One Desktop to the Left=Ctrl+Alt+Left,Ctrl+Alt+Left,Switch One Desktop to the Left
```

Há duas famílias de atalho aqui. `Switch to Next/Previous Desktop` salta para o próximo da lista; `Switch One Desktop to the Right/Left` move o foco e, combinado com uma tecla de arraste, também transporta a janela ativa junto. A diferença é sutil mas importa quando você quer reorganizar seu trabalho.

:::dica
Para mover a janela ativa para outro desktop **junto com o foco**, use [[Ctrl+Alt+Shift+Arrow]]. É o hábito que separa quem usa desktops virtuais de quem só os conhece de nome: trabalhar e arrumar o espaço ao mesmo tempo.
:::

## Um mapa rápido dos atalhos de janela

| Ação | Tecla | Resultado |
|---|---|---|
| Fechar janela | [[Alt+F4]] | Encerra a janela ativa |
| Maximizar | [[Steam+Up]] | Ocupa a tela toda |
| Minimizar | [[Steam+Down]] | Recolhe para a barra |
| Ladrilhar esquerda/direita | [[Steam+Left/Right]] | Metade da tela |
| Menu de operações | [[Alt+F3]] | Menu com fechar, mover, sempre no topo |
| Alternar janelas | [[Alt+Tab]] | Cicla entre abertas |
| Próximo desktop | [[Ctrl+F2]] | Salta para o desktop seguinte |
| Matar janela | [[Ctrl+Alt+Esc]] | Cursor vira caveira e mata no clique |

O KWin é configurável pela interface gráfica, mas conhecer o arquivo e o D-Bus te dá um mapa exato do que está ativo no seu Deck, sem abrir nenhum painel.

```terminal
$ qdbus org.kde.kglobalaccel /component/kwin org.kde.kglobalaccel.Component.shortcutNames | grep -iE 'tile|desktop|maximize' | head -10
Switch One Desktop Down
Switch One Desktop to the Left
Switch One Desktop to the Right
Switch One Desktop Up
Switch to Desktop 1
Switch to Next Desktop
Window Maximize
Window Quick Tile Bottom
Window Quick Tile Left
```

## Resumo

- O KWin é o gerenciador de janelas do Plasma e intercepta os atalhos globais de janela.
- No Deck o processo aparece como `kwin_wayland`, rodando sobre o protocolo Wayland.
- `Window Quick Tile` encaixa janelas em metades da tela, ideal para a tela pequena do Deck.
- `Kill Window` ([[Ctrl+Alt+Esc]]) mata uma janela travada sem confirmação.
- Áreas de trabalho virtuais são alternadas com `Switch to Next/Previous Desktop`.
- O arquivo `kglobalshortcutsrc` e o `qdbus` revelam todos os atalhos do KWin.

## Exercícios

1. Liste todos os atalhos do componente `kwin` com `qdbus` e separe mentalmente os de janela dos de desktop.
2. Abra duas janelas (navegador e terminal) e ladrilhe-as com [[Steam+Left]] e [[Steam+Right]]; depois desfaça com [[Steam+Up]].
3. Use `grep 'Switch.*Desktop' ~/.config/kglobalshortcutsrc` para identificar o mapa completo de troca de desktops virtuais.
4. Crie um segundo desktop virtual e mova o terminal para ele usando [[Ctrl+Alt+Shift+Right]].
5. **Desafio.** Abra um aplicativo que você possa sacrificar e mate-o usando [[Ctrl+Alt+Esc]]; depois confirme pelo comando `ps -ef | grep -i <nome>` que o processo de fato sumiu.
