No Steam Deck, o Game Mode é o ambiente onde você joga de verdade — mas ele também tem seus próprios atalhos, específicos do Steam, que não aparecem no `kglobalshortcutsrc` nem respondem ao KDE. Conhecê-los evita a frustração de tentar usar um atalho "de desktop" dentro do jogo e ver que nada acontece.

:::objetivos
- Listar os atalhos do Steam no Game Mode
- Entender como eles coexistem com os atalhos do KDE
- Saber quando um atalho é do Steam e quando é do KDE
- Usar o overlay e os atalhos de sistema sem sair do jogo
:::

## Onde os atalhos do Steam vivem

Diferente do KDE, onde tudo é arquivo de configuração e D-Bus acessível, os atalhos do Game Mode são internos ao cliente Steam. Eles não são configuráveis por `kwriteconfig6` nem listáveis por `qdbus`. A Valve mantém esse controle fechado — o que é compreensível, já que são atalhos de sistema que precisam funcionar mesmo quando o Plasma nem está rodando.

No Game Mode, o compositor ativo é o `gamescope`, não o KWin. É o `gamescope` que desenha o overlay do Steam por cima do jogo, e é ele que captura as combinações de tecla com o botão Steam antes que cheguem a qualquer outra camada. Por isso [[Steam+X]] abre o teclado virtual **dentro de um jogo** — o `gamescope` intercepta e age, sem envolver o KDE.

```terminal
$ ps -ef | grep gamescope | head -3
deck      1203     1  2 14:00 tty7  00:02:34 /usr/bin/gamescope -e ...
```

O processo `gamescope` substitui o KWin no Game Mode. É um compositor mínimo, otimizado para jogos, que lida com o overlay do Steam e com os atalhos de sistema do gamepad.

## Os atalhos essenciais do Game Mode

A Valve documenta os atalhos no próprio Steam, mas a lista prática que você usa todo dia é esta:

| Atalho | Efeito |
|---|---|
| [[Steam]] | Abre/fecha a interface do Steam sobre o jogo |
| [[Steam+X]] | Abre o teclado virtual |
| [[Steam+B]] | Atalho "voltar", cancela ou fecha |
| [[... (três pontos) + A]] | Atalho "Enter" no gamepad |
| [[... + Y]] | Atalho "Escape" no gamepad |
| [[... + X]] | Atalho "Space" no gamepad |
| [[Steam+L1]] | Abre a lupa / zoom da tela |
| [[Steam + direcional]] | Navega entre elementos do Steam |
| [[Steam + direcional direito]] | Move o cursor (modo mouse) |

O botão `...` (três pontos) do lado direito do Deck é um segundo modificador, separado do `Steam`. A Valve o reservou para emular teclas comuns de teclado: Enter, Escape, Space, Tab. A combinação `... + X` = Espaço é a mais útil, especialmente em jogos que pedem pulo com espaço e você quer pular com o gamepad.

:::dica
No Game Mode, o atalho [[Steam+L1]] ativa a lupa, mas você pode configurar o nível de zoom e o atalho nas configurações de acessibilidade do Steam (Steam → Configurações → Acessibilidade → Lupa). O zoom é de tela cheia, não de região — é literalmente ampliar a imagem como um todo.
:::

## Quando o atalho não funciona

O erro mais comum com atalhos no Deck é tentar usar um atalho do KDE no Game Mode, ou vice-versa. A regra prática:

- Se você está **com a interface Steam visível** (overlay ou menu inicial), os atalhos são do Steam.
- Se está **no desktop do Plasma**, com barra de tarefas e wallpaper, os atalhos são do KDE.
- Se está **dentro de um jogo em execução**, o Steam captura os atalhos de sistema; atalhos do KDE não passam.

```terminal
$ qdbus org.kde.kglobalaccel /component/kwin org.kde.kglobalaccel.Component.shortcutNames | wc -l
42
```

O número acima mostra quantos atalhos o KWin tem no modo desktop — mas nenhum deles funciona se você está no Game Mode com `gamescope` no comando. É outra sessão, outro compositor, outro gerenciador de atalhos.

:::atencao
Se você está no desktop do Plasma e aperta [[Steam]] e algo estranho acontece (como abrir o Steam em vez de simplesmente emitir `Meta`), é porque o cliente Steam está rodando em segundo plano e capturou a tecla antes do KDE. Para evitar: feche o Steam pelo ícone da bandeja antes de usar o desktop intensivamente com atalhos `Meta`, ou troque o atalho de abertura do Steam nas configurações do próprio Steam.
:::

## O atalho que não existe mas deveria

Há uma lacuna conhecida: o Game Mode não expõe um atalho nativo para abrir um terminal. Você pode abrir o Konsole no modo desktop com [[Ctrl+Alt+T]], mas no Game Mode isso não funciona — o KWin não está rodando, e o Steam não tem um atalho "abrir terminal".

A saída é adicionar um jogo "não Steam" que lance o terminal, ou usar o modo desktop para tarefas de shell:

```terminal
$ konsole
```

No Game Mode, o Steam permite adicionar atalhos para aplicativos externos, incluindo o Konsole. Basta adicionar o `konsole` como jogo (Steam → Adicionar jogo não Steam → `/usr/bin/konsole`), e você pode abri-lo de dentro do Game Mode, embora isso coloque o terminal sobre a interface do Steam, não dentro dela.

## Resumo

- No Game Mode, os atalhos são geridos pelo `gamescope` e pelo Steam, não pelo KDE.
- [[Steam+X]] abre teclado virtual; [[Steam+L1]] ativa a lupa; `... + X/Y/A/B` emulam teclas de teclado.
- O botão `...` é um segundo modificador no Deck, usado para Enter, Escape, Space e Tab.
- Atalhos do KDE ([[Ctrl+Alt+T]], [[Alt+F2]]) não funcionam no Game Mode porque o KWin não está ativo.
- Para abrir terminal no Game Mode, adicione o Konsole como atalho de jogo não Steam.
- Verifique se o Steam está capturando a tecla `Meta` antes do KDE no modo desktop.

## Exercícios

1. No Game Mode, pressione [[Steam+X]] e confirme que o teclado virtual aparece sobre o jogo.
2. Use `... + Y` dentro de um jogo para enviar Escape e abrir o menu de pausa.
3. Adicione o Konsole como "jogo não Steam" e abra-o de dentro do Game Mode; observe o comportamento.
4. Volte ao modo desktop e rode `ps -ef | grep gamescope` para ver se o `gamescope` ainda está ativo.
5. **Desafio.** No desktop, verifique se o Steam está capturando a tecla `Meta` fechando o Steam pela bandeja e testando [[Meta+Up]] (maximizar); depois reabra o Steam e faça o mesmo teste, comparando os resultados.