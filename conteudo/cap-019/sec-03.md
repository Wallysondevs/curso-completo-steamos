Por trás do visual do Modo Desktop há uma pilha de software que decide, literalmente, qual pixel aparece onde. O Steam Deck tem duas pilhas diferentes convivendo: o Gamescope no Modo Jogo e o KWin com Wayland no Desktop. Entender minimamente essa arquitetura ajuda a diagnosticar aquela hesitação estranha da tela, a saber o que reiniciar quando algo trava e a não culpar o lado errado quando um problema surge.

:::objetivos
- Distinguir o papel do KWin, do Plasma e do Wayland
- Identificar a sessão gráfica ativa com `XDG_SESSION_TYPE`
- Relacionar Gamescope e KWin como compositores de sessões distintas
- Reiniciar a interface gráfica de forma segura
:::

## Quem desenha a tela

Num desktop Linux, desenhar janelas é dividido em camadas. O **compositor** é o programa que junta as janelas, aplica sombras, transparências e arredondamentos, e entrega o resultado final à tela. No Modo Desktop do Steam Deck, esse papel é do **KWin**, o compositor e gerenciador de janelas do KDE. O **Plasma** é o shell — o painel, o menu, o wallpaper — que roda *sobre* o KWin e conversa com ele.

O **Wayland** é o protocolo por onde os aplicativos conversam com o compositor. Ele substituiu o antigo X11 e traz vantagens importantes para um aparelho como o Deck: composição sempre ativa, melhor suporte a telas de alta densidade e ao toque, e isolamento entre aplicativos (um app não "olha" a janela do outro).

```terminal
$ echo $XDG_SESSION_TYPE
wayland
$ loginctl show-session $(loginctl | grep deck | awk '{print $1}') -p Type
Type=wayland
```

A primeira linha já é conhecida. A segunda usa o `loginctl` — a ferramenta que gerencia sessões de login — para confirmar, pelo próprio sistema, que a sessão do usuário `deck` é do tipo Wayland. São duas formas independentes de responder à mesma pergunta: "minha tela é gerenciada por Wayland ou por X11?"

:::nota
O X11 (também chamado X.Org) foi o sistema gráfico padrão do Linux por três décadas. O Wayland é o herdeiro, desenhado do zero para os usos modernos. No SteamOS 3.6, o Modo Desktop roda exclusivamente sobre Wayland; não há sessão X11 de fábrica para escolher no login.
:::

## Os dois compositores da máquina

É aqui que o Steam Deck se diferencia de um notebook comum. Um PC de mesa tem, em geral, um único compositor. O Deck tem dois, cada um dono de uma sessão:

| Sessão | Compositor | Foco |
|---|---|---|
| Modo Jogo | Gamescope | Jogos, controle, taxa de quadros |
| Modo Desktop | KWin | Janelas, aplicativos, produtividade |

O Gamescope é um compositor micro-otimizado para games: ele pode rodar um jogo numa resolução e escalá-lo para a tela nativa, aplicar *frame pacing* e interagir com o limite de FPS configurado no menu rápido. O KWin, por outro lado, é um compositor de desktop de propósito geral. São filosofias opostas, e é por isso que a Valve os mantém separados.

Essa separação explica um comportamento que confunde iniciantes: ao trocar de Modo Jogo para Desktop, *o jogo em execução fecha ou é suspenso*. Como são sessões distintas, não dá para manter um game rodando "por baixo" enquanto você usa o Desktop normalmente — trocar de sessão encerra a anterior.

```text
Gamescope (Modo Jogo)  ⇄  troca de sessão  ⇄  KWin/Plasma (Desktop)
```

:::info
Dá para rodar jogos *dentro* do Modo Desktop também — basta abrir o Steam no Desktop e iniciar um título. Nesse caso o jogo roda sob o KWin, não sob o Gamescope, e alguns recursos específicos do Gamescope (como certos limites de FPS e upscalers) funcionam de forma diferente ou não funcionam.
:::

## Reiniciar o Plasma sem derrubar tudo

Quando o painel some ou o menu para de responder, você não precisa reiniciar o Deck inteiro. É possível recarregar só o shell do Plasma, e até o compositor, preservando a sessão aberta.

O comando `plasmashell --replace` derruba o `plasmashell` atual e sobe outro no lugar. No SteamOS, o jeito mais seguro é primeiro interromper o processo antigo e depois iniciar um novo em segundo plano:

```terminal
$ pkill plasmashell
$ plasmashell --replace &
```

O `pkill` encerra o processo pelo nome; o `plasmashell --replace` inicia uma instância nova avisando que deve substituir qualquer uma que ainda exista; o `&` no fim joga o processo para segundo plano e devolve o terminal a você. Por alguns segundos o painel e o menu somem e reaparecem — é o comportamento esperado.

Para o compositor, o KWin tem atalhos próprios de reinício. Dependendo da versão, `kwin_wayland --replace` faz o papel análogo:

```terminal
$ kwin_wayland --replace
```

Em versões mais novas do Plasma, há também `kwin --replace`. Se o processo do KWin travar de vez, ele costuma ser reiniciado automaticamente pelo próprio Plasma, e a tela pisca rapidamente — sinal de recuperação, não de falha permanente.

:::atencao
Recarregar o Plasma ou o KWin não fecha seus aplicativos abertos, mas há risco de perder algum diálogo não salvo em situações extremas. Não use esses comandos "por esporte": eles servem para quando a interface já travou. Antes de recarregar o KWin, salve o que estiver aberto.
:::

## Enxergando a sessão por baixo

O sistema guarda a informação de sessão em arquivos que você pode inspecionar. O `loginctl` também lista as sessões ativas com mais detalhe:

```terminal
$ loginctl list-sessions
SESSION  UID USER  SEAT  TTY
      2 1000 deck  seat0 tty1
```

Há uma única sessão de login para o `deck` na `tty1`, o terminal virtual 1. É nela que o Plasma roda. O fato de aparecer apenas uma sessão mostra que Modo Jogo e Desktop realmente não coexistem: é uma ou outra.

Por fim, um olhar sobre os processos confirma a divisão. Você pode procurar pelos nomes dos programas-chave:

```terminal
$ pgrep -a kwin_wayland
1412 /usr/bin/kwin_wayland --wayland-fd 8 --socket wayland-0
$ pgrep -a plasmashell
1102 /usr/bin/plasmashell
```

O `pgrep -a` mostra o PID e a linha de comando completa de cada processo. Ver `kwin_wayland` e `plasmashell` juntos é a assinatura de um Desktop saudável sobre Wayland. Se no lugar de `kwin_wayland` você visse algo como `kwin_x11`, seria sinal de uma sessão X11 — algo que não deveria acontecer de fábrica no SteamOS 3.6.

## Resumo

- O KWin é o compositor do Modo Desktop; o Plasma é o shell que roda sobre ele.
- Wayland é o protocolo gráfico do Desktop, substituindo o X11.
- O Modo Jogo usa o compositor Gamescope, em sessão separada do KWin.
- Trocar de sessão encerra a anterior; não há como manter jogo e desktop ativos ao mesmo tempo.
- `plasmashell --replace` e `kwin_wayland --replace` recarregam a interface sem reiniciar a máquina.
- `loginctl` e `pgrep -a` revelam a sessão ativa e os processos de composição em execução.

## Exercícios

1. Execute `echo $XDG_SESSION_TYPE` e o comando `loginctl` da seção; confirme que ambos apontam para `wayland`.
2. Liste as sessões com `loginctl list-sessions` e explique por que aparece apenas uma sessão do usuário `deck`.
3. Use `pgrep -a kwin_wayland` e `pgrep -a plasmashell` para localizar os dois processos-chave e anotar seus PIDs.
4. Force uma recarga do shell com `pkill plasmashell && plasmashell --replace &` e descreva o que acontece na tela durante a recarga.
5. **Desafio.** Inicie um jogo leve pelo Steam no Modo Desktop e, com ele rodando, abra outro terminal e rode `pgrep -a gamescope`. Depois feche o jogo e rode de novo. Explique por que o Gamescope não aparece ao jogar dentro do Desktop — relacionando com o conteúdo desta seção.
