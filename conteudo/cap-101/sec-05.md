O Modo Desktop do SteamOS roda o KDE Plasma 5.27 sobre uma base Debian — o mesmo ambiente que você encontraria num desktop Linux convencional. Isso significa que todos os atalhos de teclado do Plasma funcionam, mas adaptados ao formato do Deck: sem teclado físico, você invoca muitos deles pelo teclado virtual ou por combinações mapeadas no Steam Input. Esta seção lista os atalhos de teclado do Plasma que mais importam no contexto do Deck.

:::objetivos
- Usar atalhos de teclado padrão do KDE Plasma no Steam Deck
- Alternar entre janelas, áreas de trabalho virtuais e aplicativos
- Gerenciar janelas (mover, maximizar, fechar) por atalho
- Invocar o menu de aplicativos e o runner sem o mouse
:::

## Atalhos globais de sistema

Os atalhos globais do Plasma funcionam em qualquer janela, mesmo quando ela não tem foco. A tabela abaixo reúne os mais usados. Lembre-se: no Deck sem teclado físico, você pode dispará-los pelo teclado virtual (Steam + X) ou criar mapeamentos de botão.

| Atalho | Ação |
|---|---|
| [[Ctrl+Alt+T]] | Abre o Konsole (terminal) |
| [[Alt+F2]] | Abre o KRunner (barra de comandos) |
| [[Super]] (tecla Meta) | Abre o menu de aplicativos (launcher) |
| [[Ctrl+Alt+L]] | Bloqueia a tela |
| [[Print]] | Captura de tela (abre o Spectacle) |
| [[Ctrl+Alt+Del]] | Menu de logout/shutdown |
| [[Alt+F1]] | Abre o menu de aplicativos (alternativo ao Super) |
| [[Ctrl+Esc]] | Mostra o System Activity (gerenciador de processos) |

O **KRunner** (Alt+F2) é um dos recursos mais úteis: ele busca aplicativos, arquivos, comandos e até faz cálculos e conversões — tudo digitando numa linha única, sem navegar menus.

```terminal
$ krunner --help 2>&1 | head -3
Usage: krunner [options]
KRunner provides fast access to applications, files and commands.
```

:::dica
No Deck, a forma mais ergonômica de usar atalhos de teclado é ligar um teclado Bluetooth ou USB-C. Mas se você está só com os controles, abra o teclado virtual (Steam + X) e digite o comando no KRunner — o atalho Alt+F2 pode ser mapeado para um botão traseiro via Steam Input.
:::

## Gerenciamento de janelas

O Plasma implementa o paradigma de "tiling" e "snap" com atalhos que posicionam janelas na metade esquerda, direita ou em tela cheia.

| Atalho | Ação |
|---|---|
| [[Alt+Tab]] | Alterna entre janelas abertas |
| [[Alt+Shift+Tab]] | Alterna na ordem inversa |
| [[Super+Esquerda]] | Encaixa janela na metade esquerda |
| [[Super+Direita]] | Encaixa janela na metade direita |
| [[Super+Cima]] | Maximiza a janela |
| [[Super+Baixo]] | Restaura/minimiza a janela |
| [[Alt+F4]] | Fecha a janela ativa |
| [[Super+W]] | Mostra visão geral de todas as janelas |

```terminal
$ qdbus org.kde.KWin /KWin org.kde.KWin.currentDesktop
1
$ qdbus org.kde.KWin /KWin org.kde.KWin.numberOfDesktops
4
```

O `qdbus` permite inspecionar e controlar o KWin (o gerenciador de janelas do Plasma) via D-Bus. A saída mostra o desktop virtual atual e o total de desktops virtuais — você pode alterná-los por atalho ou via script.

## Áreas de trabalho virtuais e aplicativos

O Plasma oferece múltiplas áreas de trabalho virtuais (desktops), úteis para separar jogos, terminal e navegador em contextos distintos.

| Atalho | Ação |
|---|---|
| [[Ctrl+F1]] … [[Ctrl+F4]] | Alterna para o desktop virtual 1 a 4 |
| [[Ctrl+Alt+Esquerda]] | Desktop virtual anterior |
| [[Ctrl+Alt+Direita]] | Próximo desktop virtual |
| [[Super+Q]] | Mostra o alternador de atividades |

:::nota
No SteamOS, o Modo Desktop já vem com 4 desktops virtuais configurados (como mostra a saída do `qdbus` acima). Isso é herança da Valve, que pré-configura o Plasma para multitarefa com o padrão de 4 áreas de trabalho.
:::

Os atalhos globais do Plasma não são fixos: eles podem ser listados e até remapeados pela linha de comando. O comando a seguir lista todos os atalhos registrados no KGlobalAccel, o serviço que gerencia os atalhos de teclado do Plasma:

```terminal
$ qdbus org.kde.kglobalaccel /component/kwin org.kde.kglobalaccel.Component.shortcutNames | head -10
Window Quick Tile Left
Window Quick Tile Right
Window Maximize
Window Minimize
Switch One Desktop to the Left
Switch One Desktop to the Right
Kill Window
Show Desktop Grid
Switch Window
Walk Through Windows
```

Cada nome de atalho lista uma ação do KWin, e o atalho de teclado associado pode ser consultado individualmente com `shortcutInfo`. Isso permite descobrir — sem abrir o painel de configurações — qual combinação de teclas foi atribuída a cada ação, o que é valioso quando o sistema foi personalizado e a memória não acompanha.

## Resumo

- Ctrl+Alt+T abre o Konsole e Alt+F2 abre o KRunner, os dois atalhos mais importantes do Modo Desktop.
- Super + setas encaixam e maximizam janelas por tiling do KWin.
- Alt+Tab alterna janelas; Ctrl+F1 a F4 alterna entre os 4 desktops virtuais.
- O `qdbus` inspeciona e controla o KWin via D-Bus, permitindo scripts de automação.
- Sem teclado físico, os atalhos podem ser disparados pelo teclado virtual ou mapeados em botões via Steam Input.

## Exercícios

1. No Modo Desktop, pressione Alt+F2 e digite "nota". O KRunner lista o aplicativo de notas? Quantos resultados aparecem antes de terminar de digitar?
2. Abra duas janelas (Konsole e Firefox) e use Super+Esquerda e Super+Direita para colocá-las lado a lado. Capture a tela com Spectacle.
3. Execute `qdbus org.kde.KWin /KWin org.kde.KWin.numberOfDesktops` e depois alterne entre os desktops com Ctrl+F1 e Ctrl+F2. O número retornado confere?
4. Mapeie o atalho Alt+F2 (KRunner) para o botão traseiro `L4` via Steam Input. Teste se o KRunner abre sem teclado físico.
5. **Desafio.** Crie um script bash que use `qdbus` para mover a janela atualmente focada para o desktop virtual 2 e depois ative aquele desktop. Execute pelo KRunner e valide o comportamento.