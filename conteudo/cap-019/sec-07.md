O Modo Desktop do Steam Deck, por menor que seja a tela, herda toda a gestão de janelas e áreas de trabalho do KDE Plasma. Isso significa que você pode empilhar aplicativos, alternar entre eles, enviá-los para "telas virtuais" diferentes e usar o painel como central de controle. Quem domina esses conceitos trabalha no Deck com a mesma fluidez de um notebook — e sem se perder entre janelas sobrepostas.

:::objetivos
- Manipular janelas: mover, redimensionar, minimizar e maximizar
- Entender o conceito de áreas de trabalho virtuais
- Usar atalhos do painel para alternar entre tarefas
- Fixar aplicativos favoritos no painel e na área de trabalho
:::

## A anatomia de uma janela no Plasma

Toda janela do KDE Plasma tem a mesma estrutura básica:

- **Barra de título** no topo, com o nome do aplicativo e o nome do arquivo aberto (se houver).
- Três botões à direita: minimizar (`_`), maximizar (`□`) e fechar (`×`).
- Um menu discreto no canto esquerdo da barra (o botão do ícone), com opções como "Mover", "Redimensionar" e "Sempre no topo".

Esses controles são pequenos numa tela de 7 polegadas, mas respondem bem ao toque e, com um pouco de prática, ao cursor do touchpad. Para redimensionar sem usar o menu, arraste qualquer borda ou canto da janela com o touchpad + `[[R2]]`.

```text
Arrastar borda  →  redimensiona
Arrastar barra de título  →  move a janela
Clicar em □  →  maximiza (janela ocupa a tela toda)
Clicar em _  →  minimiza (vai para o painel)
```

O KDE também oferece atalhos de teclado que aceleram esse trabalho. Como o Deck não tem teclado físico, você pode usar um teclado externo ou o teclado virtual:

| Ação | Atalho |
|---|---|
| Fechar janela atual | `[[Alt+F4]]` |
| Mover janela | `[[Alt+Espaço]]` → `M` (usando o KRunner para o menu) |
| Maximizar / restaurar | tecla do atalho do KWin ou clique duplo na barra de título |
| Alternar entre janelas | `[[Alt+Tab]]` (com teclado externo) |

:::dica
O atalho `[[Alt+F4]]` funciona com teclado externo fechando a janela em foco. Sem teclado, o jeito mais prático é clicar no `×` com o touchpad ou toque. Para alternar entre janelas sem teclado, use o painel — cada botão de app aberto equivale a uma janela.
:::

## Áreas de trabalho virtuais

Um recurso que brilha em telas pequenas: as **áreas de trabalho virtuais**. São "telas extras" que o KWin cria — você pode ter uma área com o navegador, outra com o terminal e uma terceira com o Dolphin, e alternar entre elas.

No painel, o ícone chamado **Pager** (gerenciador de áreas de trabalho) mostra miniaturas das áreas disponíveis. Por padrão o SteamOS cria uma ou duas, mas você pode adicionar mais. Clicar numa miniatura troca de área; arrastar uma janela sobre a miniatura a envia para aquela área.

```text
Área 1: navegador e notas   |   Área 2: terminal e monitor   |   Área 3: mídia
```

A vantagem prática: em vez de empilhar seis janelas numa tela de 7 polegadas e perder tempo com `[[Alt+Tab]]`, você separa tarefas por área e alterna entre elas com um clique. Para o Steam Deck, isso é quase um requisito de usabilidade.

:::nota
O KWin chama áreas de trabalho virtuais de *Virtual Desktops*. A terminologia varia entre ambientes de desktop: o GNOME as trata como espaços de trabalho dinâmicos no *Overview*, enquanto o KDE as mantém estáticas e configuráveis. Ambas as abordagens resolvem o mesmo problema — mais espaço lógico que o tamanho físico da tela.
:::

## O painel como central de controle

O painel do Plasma não é só um lugar onde os ícones moram. Ele é interativo e configurável:

- Cada aplicativo aberto vira um **botão** no painel. Clicar minimiza ou restaura a janela. Clicar com `[[L2]]` (direito) abre um menu com "Fechar", "Mover para área de trabalho" etc.
- A **bandeja do sistema** agrupa ícones de notificação e de serviços de fundo: rede, bateria, volume, Steam, updates. Clicar em cada um abre um mini painel.
- Clicar com `[[L2]]` no painel abre um menu para **editar o painel**, o que permite adicionar widgets (relógio analógico, previsão do tempo, notas) e reposicioná-lo.

```text
Clicar app no painel  →  minimiza/restaura
L2 no app no painel   →  menu: fechar, mover, fixar
L2 no painel vazio    →  editar painel, adicionar widgets
```

Você pode **fixar** aplicativos favoritos ao painel: abra o app, clique com `[[L2]]` no botão e escolha "Fixar no Painel". O ícone permanece ali mesmo com o app fechado, servindo de atalho permanente. É a forma mais rápida de manter navegador, terminal e Dolphin a um clique.

## Maximizar espaço numa tela pequena

Três truques do KDE que são especialmente úteis no Deck:

1. **Maximizar e restaurar rápido**: clique duplo na barra de título (ou no canto) maximiza ou restaura a janela. No touchpad, um duplo toque + `[[R2]]` faz o mesmo.
2. **Janela fixa no topo**: clique direito na barra de título → *More Actions* → *Keep Above Others*. Útil para manter um vídeo ou terminal visível enquanto o navegador ocupa o resto da tela.
3. **Esconder a barra de título**: no `systemsettings` → *Aparência* → *Janelas* → *Decorações*, você pode configurar a decoração para ter barra de título fina ou ocultável, recuperando pixels preciosos.

```terminal
$ systemsettings kcm_kwindecoration
```

O comando acima abre diretamente a tela de decoração de janelas do KWin. A partir dela, escolha o tema *Breeze* e ajuste o tamanho dos botões — uma configuração que muitos usuários de Deck fazem para ganhar espaço vertical.

:::atencao
Reduzir demais o tamanho dos botões da janela pode dificultar o clique com o touchpad. Na dúvida entre espaço e usabilidade, no Deck de 7 polegadas, prefira a usabilidade — as áreas de trabalho virtuais resolvem melhor a falta de espaço que botões minúsculos.
:::

## Painel e widget de energia

A bandeja do sistema inclui um widget de energia que merece menção. Ele mostra a carga da bateria e, no Deck, também a temperatura e o estado da ventoinha. Clicar no ícone abre um painel com controles de brilho e economia de energia — opções que também existem no Modo Jogo, mas com apresentação diferente.

Para ver o status da bateria pelo terminal:

```terminal
$ cat /sys/class/power_supply/BAT1/status
Discharging
$ cat /sys/class/power_supply/BAT1/capacity
78
```

A primeira linha diz se a bateria está descarregando, carregando ou cheia. A segunda mostra a porcentagem restante. Como o nome do dispositivo de bateria pode variar (o Deck usa `BAT1`), você pode listar o diretório para conferir:

```terminal
$ ls /sys/class/power_supply/
BAT1  ADP0
```

`ADP0` é o adaptador de energia; `BAT1` é a bateria. Ambos expõem dados via `sysfs`, o mesmo mecanismo de arquivos virtuais do kernel que você já visitou com `/proc`.

## Resumo

- Toda janela do KDE tem barra de título, botões minimizar/maximizar/fechar e menu de contexto.
- Áreas de trabalho virtuais separam tarefas e são essenciais em telas pequenas.
- O painel mostra apps abertos, bandeja do sistema e permite fixar favoritos.
- Clique duplo na barra de título maximiza/restaura; `[[Alt+F4]]` fecha a janela (com teclado externo).
- `/sys/class/power_supply/BAT1/status` e `capacity` mostram o estado da bateria via terminal.
- A decoração de janelas é ajustável pelo `systemsettings kcm_kwindecoration`.

## Exercícios

1. Abra três aplicativos, minimize dois e alterne entre eles clicando nos botões do painel.
2. Crie uma segunda área de trabalho virtual e mova uma janela do navegador para ela; depois alterne entre as áreas pelo Pager do painel.
3. Fixe o Dolphin ao painel, feche-o e reabra pelo ícone fixado.
4. Consulte a bateria com `cat /sys/class/power_supply/BAT1/status` e `cat /sys/class/power_supply/BAT1/capacity` e compare com o ícone da bandeja.
5. **Desafio.** Com quatro aplicativos abertos, configure três áreas de trabalho virtuais, distribua os aplicativos entre elas e atribua a cada área uma "função" (ex.: navegação, mídia, terminal). Feche todos os aplicativos sem usar o `×` das janelas — apenas pelos menus de contexto do painel. Descreva o resultado.