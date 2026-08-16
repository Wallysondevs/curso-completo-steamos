O Steam Deck não é um videogame fechado: ao sair do Modo Big Picture e entrar no Modo Desktop, você cai num sistema Linux completo, com o KDE Plasma 5 como ambiente gráfico. O Plasma é a "cara" daquele desktop — o painel em baixo, o menu, as janelas e a bandeja são todos obra dele. Saber que camada é responsável pelo quê evita que você confunda um travamento do Plasma com um problema do sistema, e ensina onde reiniciar cada coisa.

:::objetivos
- Entender o que é o KDE Plasma e qual versão roda no SteamOS 3.x
- Descobrir a versão instalada do Plasma com `plasmashell --version`
- Distinguir o Plasma do restante da sessão gráfica (Wayland, KWin, Steam)
- Identificar o processo responsável pelo desktop em execução
- Reiniciar o shell gráfico sem derrubar a sessão inteira
:::

## Do que é feito o "desktop" do Steam Deck

Quando você liga o Steam Deck no Modo Desktop, várias peças entram em cena. Listar cada uma resolve a pergunta "quem faz o quê" de uma vez por todas:

- O **KWin** é o gerenciador de janelas: desenha bordas, move, redimensiona e aplica sombras.
- O **Plasma Shell** (`plasmashell`) é o shell da área de trabalho: pinta o fundo, mantém o painel, o menu Kickoff, os widgets e a bandeja.
- O **KDE Plasma Desktop** é o projeto de "desktop" que integra tudo isso numa experiência coesa.
- A **Steam**, rodando em modo `-steamos`, é quem costuma aparecer primeiro em modo gaming — mas no desktop ela é só mais uma janela.

O termo **Plasma** no dia a dia acaba valendo pelo conjunto: a pessoa diz "o Plasma travou" quando, na verdade, foi o painel que sumiu. Tecnicamente, o painel sumir é problema do `plasmashell`.

```terminal
$ ps -e | grep -E 'kwin|plasmashell|steam' | head -10
  823 ?        00:00:02 kwin_x11
 1201 ?        00:00:11 plasmashell
 2156 ?        00:00:03 steam
```

Aqui a coluna `kwin_x11` entrega uma pista importante: esse shell está rodando sobre o X11. O SteamOS 3.x roda o desktop KDE sobre o protocolo **X11** (não Wayland) por uma decisão de compatibilidade da Valve, um detalhe que revisitaremos nas seções sobre desempenho.

## Que versão do Plasma é essa

O SteamOS 3.x é baseado no KDE Plasma **5.27**, série LTS (long-term support) que a Valve escolheu justamente por estabilidade. Confirmar a versão é simples e devolve a resposta direto do binário:

```terminal
$ plasmashell --version
plasmashell 5.27.11
```

Esse `5.27.11` é a versão de patch dentro da série 5.27. Como o SteamOS congela o ambiente para garantir que os jogos rodem igual para todo mundo, não espere o Plasma 6 rodando nativamente no sistema imutável — ele não vem por atualização automática do `pacman` como num Arch comum.

:::info
O Plasma 6 (série 6.x, com KDE Frameworks 6 e Qt 6) é o sucessor lançado em 2024. O SteamOS 3.x segue no Plasma 5.27 porque o objetivo da Valve é estabilidade e não a versão mais nova do desktop. Não confunda "desatualizado" com "instável": a série 5.27 continua recebendo correções dentro do ciclo do SteamOS.
:::

Uma maneira complementar de inspecionar a versões das bibliotecas do KDE é perguntar ao próprio framework:

```terminal
$ kf5-config --version
Qt: 5.15.10
KDE Frameworks: 5.115.0
kf5-config: 1.0
```

A saída mostra o **Qt 5.15** (o toolkit que o Plasma 5 usa para desenhar janelas e widgets) e o **KDE Frameworks 5.115** (as bibliotecas sobre as quais o shell é construído). É o nível de detalhe que importa quando um widget de terceiros reclama de versão incompatível.

## Onde mora a configuração

O Plasma guarda quase toda a sua configuração em arquivos no diretório do usuário, e boa parte dela é editável pela ferramenta de linha de comando `kwriteconfig5` (no Plasma 5) — sem precisar navegar nas janelinhas das preferências. O parâmetro `--file` diz qual arquivo, e os dois grupos seguintes indicam seção, chave e valor.

```terminal
$ kwriteconfig5 --file plasmarc --group General --key "ToolTipDelay" 500
$ kwriteconfig5 --file plasmarc --group General --key "ToolTipDelay"
500
```

O segundo comando lê de volta o valor que acabamos de gravar. O arquivo correspondente fica em `~/.config/plasmarc`:

```terminal
$ cat ~/.config/plasmarc
[General]
ToolTipDelay=500
```

Esse padrão `[Seção]` + `chave=valor` é o formato INI que o KDE adota em toda a sua configuração. Entender isso é o que permite ajustar dezenas de coisas via script em vez de clicar, um caminho que você explorará na seção sobre personalização avançada.

:::nota
No Plasma 5 o binário é `kwriteconfig5`; no Plasma 6 ele virou `kwriteconfig6`. A Valve mantém o 5 no SteamOS 3.x, então use sempre a forma com `5`. Se um dia o SteamOS migrar para o Plasma 6, o comando certo muda — fique atento à versão que o `plasmashell --version` devolveu acima.
:::

## Reiniciar o shell sem reiniciar o sistema

O ponto mais útil deste capítulo inteiro: quando o painel some, os widgets congelam ou o fundo fica preto, você quase nunca precisa desligar o deck. Basta reiniciar o `plasmashell`. Ele será relançado automaticamente com as configurações intactas.

O jeito mais direto no SteamOS é pedir ao shell que termine e aguardar o respawn automático:

```terminal
$ kquitapp5 plasmashell
$ kstart plasmashell
```

O `kquitapp5` encerra a aplicação pelo nome, e o `kstart` a relança em background. Se o shell não voltar sozinho, o segundo comando garante que ele volte. Outra forma, mais "bruta" porém eficaz, usa `killall` contra o processo:

```terminal
$ killall plasmashell
```

Como o Plasma é supervisionado nesse contexto, derrubar o processo costuma disparar a recriação imediata do painel e do desktop. Se nada disso resolver, o último recurso é reiniciar a sessão gráfica inteira — mas isso fecha seus aplicativos, então deixe para quando o desktop estiver completamente irrecuperável.

:::dica
No Steam Deck, o gatilho prático para reiniciar o Plasma quando até o teclado sumiu: abra um terminal pelo atalho `[[Ctrl+Alt+T]]` (ou pelo Konsole no menu) e rode `killall plasmashell`. É mais rápido que reiniciar o console inteiro e não fecha seus jogos em segundo plano.
:::

## Resumo

- O KDE Plasma é o ambiente gráfico do Modo Desktop; `plasmashell` é o processo do shell e o KWin é o gerenciador de janelas.
- O SteamOS 3.x roda o Plasma 5.27 (LTS) sobre Qt 5.15, e a Valve o mantém assim por estabilidade.
- `plasmashell --version` e `kf5-config --version` revelam a versão do shell e das bibliotecas do KDE.
- A configuração do Plasma vive em arquivos INI em `~/.config`, editáveis por `kwriteconfig5`.
- `kquitapp5 plasmashell` + `kstart plasmashell` (ou `killall plasmashell`) reiniciam o shell sem fechar a sessão.

## Exercícios

1. Rode `plasmashell --version` e `kf5-config --version` e anote as três versões (Plasma, Qt e Frameworks) do seu deck.
2. Use `ps -e | grep -E 'kwin|plasmashell'` e identifique se o seu KWin roda sobre X11 (`kwin_x11`) ou Wayland (`kwin_wayland`).
3. Escreva uma chave de configuração com `kwriteconfig5 --file plasmarc --group General --key "MinhaChave" "teste"` e leia de volta para confirmar.
4. Reinicie o Plasma com `killall plasmashell` e observe o painel sumindo e retornando sozinho ao longo de alguns segundos.
5. **Desafio.** Sem reiniciar o sistema, simule um travamento: mate o `plasmashell` com `killall -STOP plasmashell` (SIGSTOP, congela sem matar), tente usar o painel, e depois retome com `killall -CONT plasmashell`. Explique por que o painel "travou" sem nenhum outro sintoma no sistema.
