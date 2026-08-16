Existe um atalho no Steam Deck que todo dono descobre nos primeiros minutos e usa a vida inteira: segurar o botão **Steam** e apertar X. Ele abre o teclado virtual em qualquer lugar do sistema, inclusive dentro de jogos. É o `Steam+X`, e embora pareça um truque da Valve, ele se apoia numa pilha de software Linux que vale a pena conhecer.

:::objetivos
- Entender o atalho Steam+X e quando usá-lo
- Compreender o papel do teclado virtual (`Maliit`/on-screen keyboard) no Wayland
- Simular pressionamentos de tecla com `xdotool`
- Diferenciar atalhos da Valve (Steam) dos atalhos do KDE (Meta)
:::

## O teclado virtual no contexto do Wayland

Num desktop tradicional, quem fornece o teclado na tela é um componente chamado **on-screen keyboard** (OSK). No Wayland, esse papel costuma ser do Maliit, o teclado virtual padrão de várias distribuições. No Steam Deck, a Valve integrou a abertura dele ao botão Steam, mas a infraestrutura por trás é a mesma do ecossistema Linux.

```terminal
$ systemctl --user status maliit-keyboard 2>/dev/null | head -8
```

A combinação `Steam+X` é um atalho do nível da Valve, mapeado via `gamescope` (o compositor do Modo Jogo) ou pelo próprio Steam. Ele não aparece no `kglobalshortcutsrc` porque não é um atalho do Plasma — é um atalho do Steam, tratado numa camada acima do KDE. Essa distinção é central para não se perder: nem toda tecla que funciona no Deck vem do KDE.

:::info
A tecla **Steam** cumpre dois papéis que podem confundir. No modo desktop, ela é a tecla `Meta` do KDE — por isso [[Meta+Up]] maximiza janela. Mas combinada com as teclas de rosto (A, B, X, Y, direcionais), ela vira `Steam+X`, `Steam+B` e afins, que são atalhos **do Steam**, não do Plasma. São camadas diferentes usando o mesmo botão físico.
:::

## O que o Steam+X faz de fato

Segurar Steam e apertar X faz o sistema forçar a exibição do teclado virtual, mesmo num campo de texto de jogo que normalmente não pediria teclado. É a saída universal para digitar nome de personagem, buscar servidor, ou preencher um formulário no navegador em modo desktop.

O efeito é idêntico ao que o OSK faz quando deteta um campo de texto focado, mas **forçado manualmente**:

```terminal
$ qdbus org.kde.KWin /KWin org.kde.KWin.setVirtualKeyboardGeometry 0 0 1280 0 2>/dev/null
```

A linha acima mostra o tipo de chamada D-Bus que o KWin usa para informar ao compositor onde posicionar o teclado virtual (aqui, geometria de exemplo). Não é algo que você chama no dia a dia — mas revela que o "teclado na tela" é apenas mais uma superfície que o compositor desenha, com posição e tamanho controláveis.

:::nota
No modo desktop, se o teclado virtual não aparecer quando você toca num campo, normalmente é porque o KWin não detetou que o campo de entrada pediu teclado. O `Steam+X` contorna exatamente isso ao forçar a exibição. É a razão pela qual ele é tão prático: não depende da deteção automática.
:::

## Simulando teclas com xdotool

A ferramenta `xdotool` digitá e envia eventos de teclado para o servidor gráfico, como se fossem pressionamentos reais. No Steam Deck ela é útil para criar scripts que automatizam sequências de teclas — inclusive a própria abertura de coisas que normalmente exigem o botão Steam.

```terminal
$ xdotool key ctrl+alt+t
```

O comando acima simula o pressionar de [[Ctrl+Alt+T]], que abre o Konsole — exatamente como se você apertasse as teclas. O `xdotool key` aceita nomes de tecla no formato `modificador+tecla`, e também sequências:

```terminal
$ xdotool key super+up
$ xdotool type "texto digitado automaticamente"
$ xdotool key Return
```

A primeira linha simula [[Steam+Up]] (maximizar), a segunda "digita" uma string, e a terceira envia Enter. Juntas, elas formam a base de qualquer macro de automação no desktop do Deck.

:::atencao
O `xdotool` envia eventos via X11. Quando o aplicativo roda sob Wayland nativo, alguns eventos podem não chegar se o aplicativo não expõe uma porta XWayland. Para automação de teclado em aplicações Wayland puras, o recurso equivalente é o `ydotool` ou a camada de acessibilidade do KWin. Verifique antes de montar uma macro crítica em cima do `xdotool`.
:::

## Steam+X vs. atalhos KDE: um mapa

Para não se perder entre as camadas, aqui está o resumo de quem manda em quê:

| Camada | Exemplo | Onde se configura |
|---|---|---|
| Steam (Valve) | [[Steam+X]] abrir teclado, [[Steam+B]] voltar | Cliente Steam, não no KDE |
| KDE global | [[Alt+F2]] KRunner, [[Ctrl+Alt+T]] terminal | `kglobalshortcutsrc` / System Settings |
| KWin | [[Steam+Left]] ladrilhar, [[Alt+Tab]] alternar | componente `kwin` |
| Aplicativo | [[Ctrl+S]] salvar num editor | dentro do próprio app |

A regra prática: se o atalho usa o botão Steam combinado com tecla de rosto e não funciona fora do Steam, é atalho da Valve. Se funciona em qualquer aplicativo e está listado no `kglobalshortcutsrc`, é atalho do KDE.

```terminal
$ xdotool key super+x
```

Curiosamente, se você rodar isso no modo desktop, o `xdotool` simula `Meta+X` — que **não** é o mesmo que `Steam+X` da Valve. O `Steam+X` é capturado pelo Steam antes de virar `Meta+X` para o KDE, justamente por ser de uma camada proprietária acima do Plasma.

## Resumo

- `Steam+X` abre o teclado virtual em qualquer lugar, forçando o OSK sem depender da deteção automática.
- O teclado virtual no Wayland é uma superfície que o compositor desenha, com geometria controlável via D-Bus.
- A tecla Steam é simultaneamente a tecla `Meta` do KDE e o modificador dos atalhos da Valve.
- `xdotool key` simula pressionamentos, útil para macros e automação no desktop.
- Atalhos da Valve e do KDE vivem em camadas diferentes e não se configuram no mesmo lugar.
- `xdotool` roda sobre X11/XWayland e pode não alcançar aplicativos Wayland puros.

## Exercícios

1. No modo desktop, abra um campo de texto e dispare o teclado virtual com [[Steam+X]]; depois confirme que [[Meta+X]] (via `xdotool key super+x`) **não** abre o teclado.
2. Use `xdotool key ctrl+alt+t` para abrir o Konsole sem tocar no teclado físico.
3. Escreva um comando `xdotool` que simule maximizar a janela ativa e depois "digite" uma linha de texto.
4. Liste os atalhos do KWin com `qdbus` e identifique quais usam a tecla `Meta`; relacione-os com o botão Steam.
5. **Desafio.** Monte um script `.sh` que use `xdotool` para pegar a janela ativa, movê-la para a esquerda e digitar um comando no terminal — e associe esse script a um atalho customizado como no capítulo anterior.
