No Steam Deck, a interface desktop é um Plasma KDE completo — o mesmo ambiente usado por milhões de desktops Linux. Isso significa que, por baixo do visual da Valve, existe todo um motor de teclas de atalho herdado do KDE. Aprender a navegar nele pelo teclado transforma o Deck numa máquina de trabalho de verdade, e não só num console portátil.

:::objetivos
- Entender o papel do daemon `kglobalaccel` nos atalhos do Plasma
- Listar todos os atalhos registrados no sistema com `qdbus`
- Identificar os atalhos essenciais de navegação e janelas
- Aplicar atalhos básicos do KDE no modo desktop do Deck
:::

## Quem gerencia as teclas no Plasma

Quando você aperta [[Alt+F2]] no desktop do Deck e uma barra de busca aparece, não é o Steam, nem o kernel, quem atendeu o toque. É o **kglobalaccel**, um daemon do KDE que fica escutando combinações de teclas o tempo todo e dispara a ação associada a cada uma. Ele é acionado via D-Bus, o barramento de mensagens entre processos do Linux, e é por isso que todos os atalhos do Plasma podem ser consultados com a ferramenta `qdbus`.

O primeiro passo para entender os atalhos do seu Deck é pedir ao `kglobalaccel` a lista de componentes que ele conhece:

```terminal
$ qdbus org.kde.kglobalaccel / | head -20
/component
/MainApplication
/component/kwin
/component/plasmashell
/component/krunner
/component/yakuake
```

Cada caminho começando por `/component/` é um dono de atalhos. O `kwin` é o gerenciador de janelas e cuida de mover, fechar e alternar janelas; o `plasmashell` cuida do desktop e dos painéis; o `krunner` cuida da busca universal. A lista exata varia conforme os aplicativos que você instala.

:::nota
O D-Bus é o "sistema nervoso" do desktop Linux: processos conversam entre si mandando mensagens por caminhos como `/component/kwin`. O `qdbus` é apenas um cliente de linha de comando para fala nessa língua. Quando você usa a interface gráfica do SteamOS para mudar um atalho, por baixo dela o Plasma está mandando uma mensagem D-Bus ao `kglobalaccel`.
:::

## Como listar os atalhos de um componente

Pedir os nomes de atalho do `kwin` é um único comando D-Bus:

```terminal
$ qdbus org.kde.kglobalaccel /component/kwin org.kde.kglobalaccel.Component.shortcutNames
Window Close
Window Maximize
Window Minimize
Window Quick Tile Left
Window Quick Tile Right
Switch to Next Desktop
Switch One Desktop to the Right
Kill Window
Walk Through Windows
...
```

A saída vem uma linha por atalho, em ordem alfabética. Cada nome descreve uma ação, e a maioria é autoexplicativa. Note que não há teclas nesta lista — apenas os **nomes lógicos** das ações. A associação entre "fechar janela" e a combinação física de teclas vive em outro lugar: o arquivo de configuração `kglobalshortcutsrc`.

:::info
Os nomes de atalho são estáveis entre versões do KDE, mas a tecla associada pode mudar. Por isso o ideal é decorar a **ação** ("fechar janela", "ladrilhar à esquerda") e consultar o arquivo de configuração quando quiser saber qual tecla dispara aquela ação no seu Deck.
:::

## Onde as teclas de fato são definidas

O arquivo que amarra ação e tecla fica no diretório do usuário:

```terminal
$ grep shortcut ~/.config/kglobalshortcutsrc | head -10
[dolphin]
_k_friendly_name=Dolphin
_k_actions=...
open_in_new_tab=Ctrl+T,Ctrl+T,Open in New Tab
```

A linha `open_in_new_tab=Ctrl+T,Ctrl+T,Open in New Tab` tem três campos separados por vírgula: a tecla **padrão**, a **tecla atual** e o rótulo amigável. Quando as duas primeiras são iguais, você nunca customizou aquele atalho. Se forem diferentes, alguém (ou você) mudou a tecla, e o Plasma guarda a original para permitir restaurá-la.

```terminal
$ cat ~/.config/kglobalshortcutsrc | head -30
[plasmashell]
activate widget 37=Alt+F1,Alt+F1,Activate Application Launcher Widget
...
```

Para ver só os atalhos de um grupo, filtre pela seção:

```terminal
$ grep -A30 '^\[kwin\]' ~/.config/kglobalshortcutsrc | head -12
[kwin][KDEKeyboardLayoutSwitcher]
Switch to Next Keyboard Layout=Ctrl+Alt+K,Ctrl+Alt+K,Switch to Next Keyboard Layout
[kwin]
Window Close=Alt+F4,Alt+F4,Close Window
Window Maximize=Meta+Up,Meta+Up,Maximize Window
```

Aqui começa a aparecer a tecla `Meta` — no Deck, essa tecla é o botão **Steam**. Quando a documentação do KDE diz `Meta+Up`, no seu Deck você aperta Steam + direcional para cima.

## Os primeiros atalhos que valem a pena

Nem tudo precisa de configuração. O Plasma já vem com um conjunto de atalhos que funcionam de imediato no modo desktop do Deck:

| Ação | Tecla | Efeito |
|---|---|---|
| Busca universal (KRunner) | [[Alt+F2]] ou [[Alt+Space]] | Abre a barra de busca de aplicativos e comandos |
| Terminal Konsole | [[Ctrl+Alt+T]] | Abre o terminal |
| Fechar janela | [[Alt+F4]] | Fecha a janela ativa |
| Alternar janelas | [[Alt+Tab]] | Cicla entre janelas abertas |
| Maximizar janela | [[Steam+Up]] | Maximiza |
| Ladrilhar à esquerda | [[Steam+Left]] | Encaixa a janela na metade esquerda |
| Mostrar desktop | [[Steam+D]] | Minimiza todas as janelas |

Teste um deles agora: abra o Konsole com [[Ctrl+Alt+T]] e rode o comando que lista os atalhos do plasmashell para ver o que mais existe por aí.

```terminal
$ qdbus org.kde.kglobalaccel /component/plasmashell org.kde.kglobalaccel.Component.shortcutNames | head -15
Activate Application Launcher
Activate Task Manager Entry 1
Activate Task Manager Entry 2
Cycle Through Open Windows
Manage Activities
Show Activity Manager
Show Desktop
Show On-Screen Display
Toggle Overview
```

Os `Task Manager Entry` são os aplicativos fixados na barra de tarefas: o atalho os abre pela posição, do primeiro ao décimo, sem mouse.

:::dica
No Deck, o atalho mais subutilizado é [[Alt+Space]]. Ele abre o KRunner mesmo com a mão longe do touchpad, e de lá você digita o nome de qualquer aplicativo ou comando — mais rápido que navegar pelo menu Iniciar com os trackpads.
:::

## Resumo

- O `kglobalaccel` é o daemon do Plasma que escuta e dispara os atalhos de teclado via D-Bus.
- `qdbus org.kde.kglobalaccel /component/kwin ...shortcutNames` lista as ações do gerenciador de janelas.
- A associação entre ação e tecla física fica em `~/.config/kglobalshortcutsrc`.
- Nomes de atalho são estáveis; as teclas podem variar por versão ou por customização.
- `[[Alt+F2]]` abre o KRunner, `[[Ctrl+Alt+T]]` abre o terminal e `[[Steam+Up]]` maximiza a janela.
- No Deck, a tecla `Meta` do KDE corresponde ao botão Steam.

## Exercícios

1. Rode `qdbus org.kde.kglobalaccel /component/kwin org.kde.kglobalaccel.Component.shortcutNames` e conte quantos atalhos de janela existem.
2. Use `grep '^Meta' ~/.config/kglobalshortcutsrc` (ou filtre o arquivo) para listar todos os atalhos que usam a tecla Steam/Meta.
3. Feche uma janela de três formas diferentes: botão X, [[Alt+F4]] e pelo menu da janela. Observe o resultado idêntico.
4. Abra o KRunner com [[Alt+F2]] e digite `konsole` — confirme que ele localiza o terminal sem você usar o mouse.
5. **Desafio.** Descubra qual componente é dono do atalho `Show Desktop` usando `grep` no `kglobalshortcutsrc`, e depois dispare essa ação sem teclado usando o próprio `qdbus` para invocá-la.
