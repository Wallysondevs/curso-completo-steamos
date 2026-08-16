O Konsole é o emulador de terminal padrão do KDE Plasma e, no SteamOS, a porta de entrada para toda a administração do sistema. Ele compartilha os atalhos de teclado consagrados do mundo Unix — os mesmos do Bash e do GNU Readline — e adiciona atalhos próprios de emulador. Esta seção cobre ambos os conjuntos, porque são coisas distintas e confundir um com o outro é uma fonte comum de frustração.

:::objetivos
- Editar a linha de comando com atalhos de edição do Readline
- Recuperar e pesquisar comandos do histórico
- Gerenciar abas e janelas do Konsole
- Matar processos travados sem fechar o terminal
:::

## Edição da linha de comando (Readline)

O Bash usa a biblioteca GNU Readline para edição da linha. Seus atalhos funcionam em qualquer terminal — e também em muitos outros programas interativos. Eles são a diferença entre digitar e *navegar* rapidamente.

| Atalho | Ação |
|---|---|
| [[Ctrl+A]] | Move cursor para o início da linha |
| [[Ctrl+E]] | Move cursor para o fim da linha |
| [[Ctrl+U]] | Apaga do cursor até o início da linha |
| [[Ctrl+K]] | Apaga do cursor até o fim da linha |
| [[Ctrl+W]] | Apaga a palavra anterior |
| [[Ctrl+Esquerda/Direita]] | Move por palavra |
| [[Ctrl+L]] | Limpa a tela (mesmo que `clear`) |
| [[Alt+B]] / [[Alt+F]] | Move uma palavra para trás / frente |
| [[Ctrl+C]] | Interrompe o comando em execução (SIGINT) |
| [[Ctrl+D]] | Fim de arquivo (EOF); fecha o shell se linha vazia |
| [[Ctrl+R]] | Busca reversa no histórico |

```terminal
$ echo "testando atalhos"
testando atalhos
$ ^testando^editando
echo "editando atalhos"
editando atalhos
```

O operador `^antiga^nova` (substituição de história) é um atalho do próprio Bash — reaproveita o último comando trocando uma substring. Combina perfeitamente com a busca `Ctrl+R` para correções rápidas sem redigitar tudo.

:::dica
Muitos atalhos Readline podem ser redefinidos no `~/.inputrc`, mas os padrões acima cobrem 95% do uso diário. Não reinvente: memória muscular de `Ctrl+A`/`Ctrl+E` vale mais que qualquer personalização.
:::

## Histórico e recuperação de comandos

O histórico do Bash fica em `~/.bash_history` e acumula os comandos de todas as sessões. Navegá-lo com eficiência é uma habilidade central.

| Atalho | Ação |
|---|---|
| [[Seta Cima]] | Comando anterior |
| [[Seta Baixo]] | Próximo comando |
| [[Ctrl+R]] | Busca reversa incremental no histórico |
| [[Ctrl+R (de novo)]] | Próxima ocorrência (continua a busca para trás) |
| [[Alt+.]] | Insere o último argumento do comando anterior |
| [[!!]] | Reexecuta o último comando (substituição) |
| [[!$]] | Último argumento do último comando |
| [[!string]] | Executa o comando mais recente que começa com `string` |

```terminal
$ sudo apt update
[... 12 linhas omitidas ...]
$ !!
sudo apt update
[... 12 linhas omitidas ...]
```

O `!!` reexecuta o comando anterior — útil para repetir `sudo` após esquecer de usá-lo. O `!$` reaproveita só o último argumento, evitando redigitar caminhos longos.

:::atencao
História com `!string` pode ser perigosa: se você digitar `!rm` por engano quando não pretendia, o shell executa o último comando `rm` imediatamente. Use `Ctrl+R` para **visualizar** o comando antes de dar Enter — é mais seguro.
:::

## Abas e janelas do Konsole

O Konsole, como outros emuladores modernos, suporta abas e divisão de tela. Os atalhos são específicos do Konsole (não do shell). A divisão de tela é particularmente útil para monitorar logs de um lado enquanto se edita um comando do outro — recurso que os atalhos do Readline puro não oferecem, pois pertencem ao emulador e não ao shell.

| Atalho | Ação |
|---|---|
| [[Ctrl+Shift+T]] | Nova aba |
| [[Ctrl+Shift+N]] | Nova janela |
| [[Ctrl+Shift+W]] | Fecha a aba atual |
| [[Ctrl+Shift+Left/Right]] | Alterna entre abas |
| [[Ctrl+Shift+D]] | Divide a aba verticalmente |
| [[Ctrl+Shift+)]] | Divide a aba horizontalmente |
| [[Ctrl+Shift+C]] | Copia seleção |
| [[Ctrl+Shift+V]] | Cola |
| [[F11]] | Tela cheia |

```terminal
$ echo $TERM
xterm-256color
$ echo $SHELL
/bin/bash
```

O Konsole informa ao shell o terminal (`$TERM`) e o shell em uso (`$SHELL`). Saber o valor de `$TERM` importa quando você usa programas que desenham interface (como `htop` ou `vim`) — eles adaptam a renderização com base nessa variável. O valor `xterm-256color` indica suporte a 256 cores e à maioria das sequências de escape modernas, o que permite interfaces ricas em cores, barras de progresso e cursores posicionados — recursos invisíveis até você abrir um terminal básico sem essa capacidade.

## Resumo

- Ctrl+A/Ctrl+E movem o cursor para início/fim; Ctrl+U/Ctrl+K apagam trechos da linha.
- Ctrl+R faz busca reversa no histórico e é mais seguro que substituições `!string`.
- `!!` e `!$` reaproveitam o último comando ou seu último argumento.
- O Konsole adiciona Ctrl+Shift+Letra para abas, divisão e copiar/colar.
- O histórico vive em `~/.bash_history` e sobrevive entre sessões.

## Exercícios

1. Digite um comando longo como `sudo pacman -S --needed base-devel git` e, sem apagar, use Ctrl+U e Ctrl+K para testar os atalhos de edição.
2. Execute alguns comandos e depois recupere um deles com Ctrl+R. Digite uma substring e confirme que a busca é incremental.
3. Abra 3 abas no Konsole com Ctrl+Shift+T e alterne entre elas com Ctrl+Shift+Left/Right. Depois divida uma aba com Ctrl+Shift+D.
4. Teste `!$`: execute `ls /usr/share/doc` e depois `cd !$`. Você foi para `/usr/share/doc`?
5. **Desafio.** Use `history | tail -20` para ver os últimos 20 comandos e identifique pelo menos 3 comandos que você poderia ter recuperado com `!$` ou `Ctrl+R` em vez de redigitar. Reescreva-os usando os atalhos e confirme que funcionam.