O KDE Plasma que roda no Steam Deck não é um enfeite — é a interface que você usa sempre que sai do Modo Jogo para o Modo Desktop. Cada janela, cada ícone na bandeja e cada animação de alternância entre áreas de trabalho passa por um único ponto central: o System Settings. Saber navegar nesse hub é o que separa o usuário que só aceita o padrão daquele que ajusta cada detalhe para o jeito como o Deck é usado — com touchscreen, touchpads e uma tela de 800p.

:::objetivos
- Localizar e abrir o System Settings por três caminhos diferentes no Steam Deck
- Navegar pelas categorias principais e usar a barra de busca com eficiência
- Entender a arquitetura modular do KDE (kcontrol modules ou KCMs)
- Lançar módulos individuais pela linha de comando com `kcmshell6`
- Identificar quais categorias afetam a aparência e quais afetam o comportamento do sistema
:::

## Abrindo o System Settings

No Modo Desktop do SteamOS, o caminho mais curto é clicar no ícone de engrenagem no painel inferior ou no menu Application Launcher (o equivalente ao menu Iniciar). Mas há outros jeitos que são úteis quando você está com o teclado virtual ou um teclado físico conectado ao dock.

```terminal
$ systemsettings
```

O comando `systemsettings` dispara a janela principal. Se você executá-lo pelo [[Konsole]] e fechar o terminal em seguida, o System Settings morre junto — a menos que rode em segundo plano:

```terminal
$ systemsettings &
[1] 3841
```

O `&` desacopla o processo do terminal, deixando a janela viva mesmo se você fechar o Konsole. No Steam Deck isso é especialmente útil porque você costuma abrir o terminal, lançar a configuração e fechar o terminal para liberar espaço na tela de 7,4 polegadas.

:::dica
Pressionar `[[Alt+Space]]` ou `[[Meta]]` (a tecla Steam mapeada como Super) e digitar "system settings" também funciona: o KRunner, o lançador embutido do Plasma, encontra e abre o módulo.
:::

## A grade de categorias

A tela principal do System Settings é uma grade de ícones organizados por categorias. No SteamOS 3.6, com Plasma 6, as categorias visíveis logo de cara são:

| Categoria | O que controla |
|---|---|
| Appearance & Style | Temas globais, cores, fontes, cursores, decoração de janelas |
| Workspace | Comportamento do desktop, atalhos, áreas de trabalho virtuais |
| Hardware | Tela, áudio, energia, Bluetooth, entrada (touchscreen, teclado) |
| Network | Wi-Fi, firewall, proxies |
| Personalization | Usuários, idioma, acessibilidade |

Cada categoria se desdobra em subpáginas quando clicada. Por exemplo, entrar em **Appearance & Style** revela itens como *Colors & Themes*, *Fonts*, *Cursor* e *Window Decorations* — tudo o que este capítulo vai destrinchar.

## Módulos independentes: os KCMs

O System Settings não é um programa monolítico. Cada página é um **KCM** (*KDE Control Module*), um pequeno plugin `.so` que o `systemsettings` carrega sob demanda. A grande vantagem é que você pode abrir qualquer KCM diretamente, sem passar pela grade de categorias, usando o comando `kcmshell6`.

```terminal
$ kcmshell6 --list | head -12

kcm_accessibility          - Improve accessibility for disabled persons
kcm_activities             - Configure your file manager's Activities
kcm_autostart              - Manage programs that run on startup
kcm_baloofile              - Configure File Search
kcm_bluetooth              - Configure Bluetooth settings
kcm_breezestyleconfig      - Widget Style Configuration
kcm_colors                 - Choose color scheme
kcm_componentchooser       - Choose default system components
kcm_cursortheme            - Configure cursor theme
kcm_desktoppaths           - Change location important files are stored
kcm_energy                 - Configure power management
kcm_feedback               - Configure touch feedback settings
```

A listagem completa passa de 80 módulos. O parâmetro `--list` mostra o nome interno (à esquerda) e a descrição (à direita). Para abrir um módulo diretamente:

```terminal
$ kcmshell6 colors
```

Esse comando abre a página de esquemas de cores sem passar pela tela principal — perfeito para atalhos e scripts, e será usado várias vezes nas próximas seções.

:::nota
No Plasma 6, `kcmshell6` substituiu o antigo `kcmshell5` do Plasma 5. Se você encontrar tutoriais antigos mencionando `kcmshell5`, o equivalente moderno é sempre com o sufixo `6`.
:::

## A barra de busca

No canto superior do System Settings há um campo de busca. Digitar "font" traz resultados instantâneos de várias categorias: a página de fontes, a de cursor (porque o tema do cursor também pode afetar o tamanho da fonte nos tooltips) e a de acessibilidade (que oferece aumento de fonte do sistema).

A busca cobre o nome interno de cada KCM e palavras-chave das descrições. No Steam Deck, onde a precisão do touchscreen pode tornar a navegação por ícones um pouco imprecisa, a busca é o método mais rápido de chegar a qualquer ajuste.

## Resumo

- O System Settings (`systemsettings`) é a central única de configuração visual e comportamental do KDE Plasma no SteamOS.
- Você pode abri-lo pelo ícone no painel, pelo menu, pelo KRunner (`[[Meta]]` e digitar) ou pelo terminal com `systemsettings &`.
- Cada página interna é um KCM independente; use `kcmshell6` para abrir qualquer uma diretamente pela linha de comando.
- A barra de busca global é o caminho mais rápido para encontrar ajustes específicos, especialmente na tela pequena do Deck.
- `kcmshell6 --list` exibe todos os módulos disponíveis, com nome interno e descrição.

## Exercícios

1. Abra o System Settings e explore cada uma das cinco categorias principais. Anote três subpáginas de Appearance & Style que você não sabia que existiam.
2. No terminal, execute `kcmshell6 --list` e identifique o nome interno do módulo de fontes. Depois abra esse módulo diretamente com `kcmshell6 <nome>`.
3. Use a barra de busca do System Settings para digitar "cursor" e observe quantas páginas diferentes retornam resultados. Abra cada uma delas e compare.
4. Execute `kcmshell6 --list | wc -l` e depois `kcmshell6 --list | grep -i -E 'theme|color|font|cursor'`. O Plasma realmente separa cada aspecto visual em um módulo próprio?
5. **Desafio.** Abra o System Settings pelo terminal com `systemsettings &`, feche o Konsole e verifique se a janela continua aberta. Depois execute `systemsettings` sem o `&`, feche o terminal e explique a diferença — qual o PID pai do processo em cada caso?