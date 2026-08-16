Com uma tela de 7 polegadas e resolução limitada, o Steam Deck se beneficia mais do que qualquer desktop comum do recurso de **múltiplas áreas de trabalho**. Elas funcionam como mesas virtuais separadas: numa você deixa o navegador, noutra o terminal, noutra um jogo. Isso mantém cada contexto limpo e evita a bagunça de dezenas de janelas empilhadas na mesma tela pequena.

:::objetivos
- Distinguir atividades de áreas de trabalho no Plasma
- Criar, renomear e alternar áreas de trabalho virtuais
- Mover janelas entre áreas de trabalho
- Usar o `kstart` para lançar aplicativos numa área específica
- Configurar o pager e atalhos de troca de área
:::

## Áreas de trabalho vs. atividades

Antes de mexer na prática, é preciso desfazer uma confusão frequente. O Plasma oferece **dois** conceitos parecidos mas distintos:

- **Áreas de trabalho** (virtual desktops): você alterna a *visão* das janelas. Todas as janelas continuam existindo ao mesmo tempo; você só escolhe qual conjunto está visível. É o recurso clássico de "trocar de mesa".
- **Atividades** (activities): você alterna *contextos* completos — cada atividade pode ter seu próprio wallpaper, seus próprios widgets, atalhos e até aplicativos padrão. É uma camada acima, para separar modos de uso (trabalho, jogo, estudo).

No uso diário do deck, as **áreas de trabalho** são o que você quer para organizar janelas. As **atividades** são ótimas para separar, por exemplo, um "modo portátil" com widgets de bateria em destaque de um "modo desktop" mais limpo. Esta seção foca nas áreas de trabalho.

:::nota
Uma analogia que ajuda: áreas de trabalho são mesas diferentes na mesma sala, e você gira a cabeça entre elas. Atividades são salas diferentes, cada uma decorada e mobiliada do seu jeito. Você pode trocar de mesa sem trocar de sala, e vice-versa.
:::

## Gerenciando áreas de trabalho

Por padrão o SteamOS vem com uma única área de trabalho ativa, embora o pager (o widgetzinho que mostra as áreas) já apareça no painel. Para criar mais, há dois caminhos:

1. Pelo **pager** no painel: o botão com o sinal de `+` no canto.
2. Pelas **Preferências do sistema**: Workspace → Virtual Desktops.

A configuração das áreas também fica em arquivo, no `kwinrc` (configuração do KWin, o gerenciador de janelas):

```terminal
$ grep -A5 "Desktops" ~/.config/kwinrc
[Desktops]
Name_1=Trabalho
Name_2=Jogos
Number=2
Rows=1
```

Aqui vemos duas áreas nomeadas (`Trabalho` e `Jogos`), com `Number=2`. O parâmetro `Rows` controla o arranjo do pager (quantas linhas). Você pode editar essas chaves com o `kwriteconfig5`, que por padrão escreve no `kwinrc` se você apontar o `--file` certo:

```terminal
$ kwriteconfig5 --file kwinrc --group Desktops --key Number 3
```

Depois de mudar via arquivo, o KWin precisa reler a configuração. O reinício do compositor resolve:

```terminal
$ qdbus org.kde.KWin /KWin reconfigure
```

O `reconfigure` via D-Bus faz o KWin aplicar a nova configuração sem reiniciar a sessão gráfica inteira — o equivalente "suave" de um restart.

## Alternando e movendo janelas

Alternar entre áreas tem atalhos de teclado padrão no Plasma. Os mais usados no deck (onde o teclado físico é raro, mas você pode ter um teclado bluetooth ou usar o teclado virtual):

- `[[Ctrl+F1]]` a `[[Ctrl+F4]]` — ir direto para a área 1, 2, 3, 4.
- `[[Ctrl+Alt+Seta]]` — navegar entre áreas adjacentes.

Para mover uma janela para outra área, o botão direito na barra de título oferece **Mover para a área de trabalho** → escolher a área. Por linha de comando, o `kstart` lança um app já numa área específica:

```terminal
$ kstart --desktop 2 konsole
```

A flag `--desktop 2` coloca a nova janela do Konsole diretamente na área 2. Com `--alldesktops`, o aplicativo aparece em todas as áreas de uma só vez (útil para um gerenciador de monitoramento, por exemplo):

```terminal
$ kstart --alldesktops ksysguard
```

:::dica
Use `--alldesktops` para aplicativos que você quer sempre à mão, como um monitor de temperatura ou um relógio grande, e `--desktop N` para isolar contextos: jogos na área 2, desenvolvimento na área 3. Assim o `[[Ctrl+F2]]` vira um "ir para jogos" instantâneo.
:::

## O pager no painel

O **pager** é o widget que mostra miniaturas das áreas de trabalho no painel. Clique numa miniatura para trocar de área; arraste uma janela da miniatura para outra área para movê-la. É a forma mais tátil de gerenciar áreas no deck, sem depender de teclado.

Se o pager não estiver no painel, adicione-o pelo modo de edição (que você domina da [seção sobre o painel](#/cap-020/sec-02)). Ele se chama **Pager** na lista de widgets. Dá para ter também um pager maior na área de trabalho (o widget de navegação de desktops), mas no deck o compacto do painel é o que cabe melhor.

## Resumo

- Áreas de trabalho alternam a visão das janelas; atividades alternam contextos completos (wallpaper, widgets, atalhos).
- A configuração das áreas fica em `~/.config/kwinrc`, na seção `[Desktops]`, com chaves `Number`, `Rows` e `Name_*`.
- `qdbus org.kde.KWin /KWin reconfigure` aplica mudanças de configuração do KWin sem reiniciar a sessão.
- `kstart --desktop N` lança um app numa área específica; `--alldesktops` o espalha por todas.
- O pager no painel permite trocar de área e mover janelas por arrasto nas miniaturas.

## Exercícios

1. Crie duas áreas de trabalho e nomeie-as (por exemplo, "Trabalho" e "Jogos") pela interface ou pelo `kwinrc`.
2. Alterne entre elas usando `[[Ctrl+F1]]` e `[[Ctrl+F2]]` e confirme que as janelas "somem" e "reaparecem" conforme a área.
3. Lance um Konsole na área 2 com `kstart --desktop 2 konsole` e verifique em qual área ele abriu.
4. Movimente uma janela entre áreas arrastando-a pela miniatura no pager do painel.
5. **Desafio.** Configure `Number=3` via `kwriteconfig5 --file kwinrc`, aplique com o `reconfigure` do KWin, e depois adicione um widget de pager ao painel. Explique por que a chave `Number` sozinha não criou os nomes das novas áreas (`Name_3`).
