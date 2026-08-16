O Steam Deck nasceu para rodar jogos, mas dentro dele existe um computador Linux completo esperando para ser usado. O Modo Jogo — aquela interface de biblioteca, loja e atalhos — é uma sessão especializada chamada *Gamescope*, pensada para controles e para o desempenho dos games. O Modo Desktop é a outra face da mesma máquina: um ambiente de trabalho convencional, com janelas, menu, navegador e terminal, baseado no KDE Plasma. Saber transitar entre os dois é a porta de entrada para instalar aplicativos, mexer em arquivos e tirar do Deck muito mais que partidas.

:::objetivos
- Entender a diferença entre Modo Jogo (Gamescope) e Modo Desktop (KDE Plasma)
- Trocar para o Modo Desktop pelo menu de energia
- Confirmar que a sessão de desktop usa Wayland
- Reconhecer o atalho que alterna entre as duas sessões
:::

## Duas sessões, um só sistema

Por trás da troca de interface há dois programas distintos. O Modo Jogo roda sobre o **Gamescope**, um compositor criado pela Valve feito sob medida para jogos: ele captura a entrada do controle, gerencia a resolução da tela e entrega os frames na taxa certa, sem as camadas de um desktop convencional no caminho. Já o Modo Desktop roda o **KDE Plasma** sobre o **KWin**, o gerenciador de janelas do KDE, usando o protocolo **Wayland** para desenhar a tela.

A palavra importante aqui é *sessão*. Quando você está no Modo Jogo, o Gamescope é a sessão gráfica ativa; quando troca para Desktop, essa sessão é encerrada (ou suspensa) e outra — o Plasma — assume. Eles não ficam "abertos ao mesmo tempo" disputando a GPU na forma ingênua. Na prática, porém, o Steam continua rodando em segundo plano no Desktop, pronto para voltar ao Modo Jogo num clique.

:::nota
O nome Gamescope aparece nos logs do sistema como `gamescope` ou, em sessões Wayland, como `gamescope -e`. Ele é o equivalente, para o Modo Jogo, ao que o KWin é para o Desktop: o programa que desenha tudo na tela e decide o que recebe qual tecla e qual clique.
:::

## Trocando pelo menu de energia

A forma mais direta de sair do Modo Jogo é o menu de energia. Com o controle (ou o toque, se seu modelo tiver tela sensível), abra o menu lateral — o botão `[[Steam]]` do Deck abre o menu rápido, e também há o atalho pelo ícone de energia no canto. Dentro dele, a opção que interessa é **"Trocar para Desktop"**.

```text
Menu rápido  →  botão de energia  →  Trocar para Desktop
```

A tela escurece por um instante, como se a máquina fosse reiniciar, e então o Plasma aparece com o wallpaper padrão do Steam Deck. É uma troca de sessão completa, não um aplicativo que abre por cima do jogo. Por isso demora alguns segundos: o compositor muda, os serviços do desktop sobem e a GPU troca de modo.

Depois que o Desktop carrega, vale confirmar que você está mesmo numa sessão gráfica nova. O comando que entrega essa informação é `echo $XDG_SESSION_TYPE`, que lê uma variável de ambiente definida no login:

```terminal
$ echo $XDG_SESSION_TYPE
wayland
$ echo $XDG_SESSION_DESKTOP
KDE
```

A resposta `wayland` confirma que o Plasma está desenhando via Wayland, não via X11. A segunda variável, `XDG_SESSION_DESKTOP`, identifica o ambiente: no Steam Deck ela aponta para `KDE`.

:::dica
Se alguma vez o Desktop parecer travado ou a tela ficar preta após a troca, não desligue pelo botão de força ainda. Espere cerca de 20 segundos: a primeira carga do Plasma depois de várias sessões acumuladas pode ser lenta. Se persistir, mantenha o botão liga/desliga pressionado para reiniciar — o SteamOS é robusto e raramente perde dados nisso.
:::

## O caminho de volta

A volta ao Modo Jogo é simétrica. No Desktop há um atalho chamado **"Retornar ao Modo de Jogo"** (ou *Return to Gaming Mode*), normalmente um ícone no desktop e também na bandeja do sistema, no canto inferior direito. Clicar nele encerra a sessão do Plasma e devolve você ao Gamescope.

Existe ainda a opção de encerrar o Modo Jogo por completo a partir do Desktop, para desligar a interface de games sem reiniciar. O comando que faz isso é o cliente do Steam:

```terminal
$ steam -shutdown
```

Isso fecha o Steam — e, com ele, a possibilidade de voltar ao Modo Jogo pelo atalho, até que você o reinicie. É útil quando se quer liberar memória ou quando o Steam entrou num estado estranho e precisa ser reiniciado "do zero".

```terminal
$ steam -shutdown
Shutting down Steam...
$ steam
steam.sh[2451]: Running Steam on steamos 3.6 liberating steamdeck...
```

O segundo comando religa o Steam em modo texto no terminal, útil para ver mensagens de erro na subida. Repare no hostname `steamdeck` e no usuário `deck` — são os padrões de toda sessão do SteamOS.

:::atencao
Rodar `steam -shutdown` dentro do Modo Jogo não é a forma de sair dele; você simplesmente mataria o Steam a partir de um terminal externo. Para alternar de interface, use sempre o menu de energia ou o atalho do Desktop. E fique atento: com o Steam fechado, o ícone "Retornar ao Modo de Jogo" não funciona até o Steam voltar a rodar.
:::

## Resumo

- O Modo Jogo usa o compositor Gamescope; o Modo Desktop usa KDE Plasma sobre KWin e Wayland.
- A troca de interface é uma troca de sessão gráfica, não um aplicativo por cima.
- `echo $XDG_SESSION_TYPE` devolve `wayland` no Desktop, e `XDG_SESSION_DESKTOP` devolve `KDE`.
- O Desktop oferece um atalho "Retornar ao Modo de Jogo" para voltar ao Gamescope.
- `steam -shutdown` encerra o Steam por completo, e `steam` o religa a partir do terminal.

## Exercícios

1. No Modo Jogo, troque para o Desktop pelo menu de energia e cronometre quanto tempo leva até a área de trabalho aparecer.
2. Abra o terminal e execute `echo $XDG_SESSION_TYPE` e `echo $XDG_SESSION_DESKTOP`. Anote os dois valores e explique com uma frase o que cada um significa.
3. Localize o atalho "Retornar ao Modo de Jogo" na área de trabalho e na bandeja do sistema, descrevendo onde encontrou cada um.
4. Volte ao Modo Jogo e, em seguida, ao Desktop outra vez, para se familiarizar com o tempo e com o visual de cada transição.
5. **Desafio.** No terminal do Desktop, rode `steam -shutdown`, observe o que acontece com o atalho de retorno ao Modo de Jogo e, depois, religue o Steam com `steam`. Relate o comportamento em poucas linhas — sem reiniciar a máquina.
