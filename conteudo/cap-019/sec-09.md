Fechar o capítulo é também fechar o ciclo das duas faces do Steam Deck: saber sair do Modo Desktop de forma limpa, voltar ao Modo Jogo, e encerrar sessões e o próprio sistema sem corromper nada. Muita gente encerra na força bruta e se dá ao luxo de não perceber o prejuízo; num Linux corretamente desligado, os dados em disco permanecem íntegros e os serviços terminam em ordem. Esta seção reúne os comandos e os atalhos de saída.

:::objetivos
- Sair do Modo Desktop e voltar ao Modo Jogo pelo atalho e por comando
- Encerrar a sessão gráfica e desligar o sistema com segurança
- Entender a ordem correta de desligamento (sessão → sistema)
- Revisar os comandos centrais deste capítulo numa tabela de referência
:::

## Voltar ao Modo Jogo

O caminho do dia a dia é o atalho **"Retornar ao Modo de Jogo"**, que você já encontrou na área de trabalho. Ele faz mais do que "abrir o Steam": ele encerra a sessão do KWin/Plasma e entrega o controle de volta ao Gamescope, o compositor do Modo Jogo.

Há também a via por comando, útil em scripts ou quando o ícone não está à mão. O SteamOS expõe um comando próprio para a troca de sessão:

```terminal
$ steam -shutdown
```

Esse comando apenas encerra o Steam — não é a troca de sessão em si. Para devolver ao Modo Jogo de forma programática, o SteamOS moderno usa o atalho interno que o próprio ícone dispara:

```text
steamos-session-select  →  gamescope
```

O `steamos-session-select` é o script responsável por trocar a sessão ativa. Ao informar `gamescope`, ele orquestra o desligamento limpo do Plasma e a subida do Gamescope. Ele resume, em um comando, exatamente o que o ícone da área de trabalho faz.

:::nota
`steamos-session-select` aceita também `plasma` (ou `desktop`) para ir na direção inversa — do Modo Jogo para o Desktop. É a mesma troca que o menu de energia faz, só que acionável pela linha de comando.
:::

## Sair e encerrar a sessão gráfica

Às vezes você quer apenas encerrar a sessão do Desktop e voltar à tela de login — ou desligar o ambiente gráfico por completo. As opções de desligamento do KDE ficam no menu de aplicativos, no botão de energia:

```text
Menu de aplicativos  →  Sair  →  Desligar / Reiniciar / Sair da sessão
```

- **Sair da sessão** encerra o Plasma e volta ao gerenciador de sessão (ou ao Modo Jogo, no caso do Deck).
- **Reiniciar** desliga e religa a máquina inteira.
- **Desligar** encerra o sistema por completo.

Pelo terminal, o desligamento limpo é feito com o `systemctl poweroff` (ou `systemctl reboot` para reiniciar):

```terminal
$ systemctl poweroff
```

O comando não imprime nada visível — ele sinaliza ao `systemd` (o gerenciador de inicialização e serviços) para parar todos os serviços em ordem, sincronizar os discos e cortar a energia. É o oposto da força bruta: cada serviço recebe a chance de salvar seus dados antes de morrer.

:::atencao
Não desligue o Deck segurando o botão de força como hábito. Isso interrompe os serviços sem a sequência de desligamento, e, em casos raros, pode deixar o sistema de arquivos em estado que exige verificação no próximo boot. Reserve a força bruta para quando a máquina travar de vez e não responder.
:::

## Verificando processos antes de sair

Antes de encerrar, um hábito de quem trabalha com Linux é conferir se algo importante ainda está rodando. O `ps` (process status) lista os processos da sua sessão:

```terminal
$ ps -u deck --forest | head -20
    PID TTY          TIME CMD
   1102 ?        00:00:04 plasmashell
   1412 ?        00:00:07 kwin_wayland
   1590 ?        00:00:01 konsole
   1603 ?        00:00:00 firefox
   1620 ?        00:00:00  \_ WebExtensions
   1631 ?        00:00:00 ps
```

A flag `-u deck` filtra os processos do usuário `deck`, e `--forest` desenha a árvore de parentesco: você vê `kwin_wayland` e `plasmashell` (o desktop), o `konsole` (onde você digita) e o `firefox`, com sua subárvore `WebExtensions` indentada. O `\_` mostra processos-filho.

Essa visão dá duas informações úteis: o que será encerrado se você sair da sessão, e se há algum processo que você esqueceu de fechar (um download, um editor com trabalho não salvo).

:::dica
Para uma visão mais rica, experimente `ps -u deck -o pid,comm,etime` — ela mostra, além do nome, o **tempo decorrido** (`etime`) desde que cada processo começou. Processos antigos que você não reconhece podem ser o motivo de lentidão, e encerrá-los antes de desligar garante um boot limpo.
:::

## Reiniciando o shell com consciência

Se o objetivo não é desligar, mas apenas "recarregar" a interface depois de uma travada, os comandos vistos na seção sobre Wayland voltam a valer. Eles encerram só a camada gráfica, preservando a sessão de login e os processos de fundo:

```terminal
$ plasmashell --replace &
```

Esse é o "reinício suave" do desktop. Ele é seguro para uso quando o painel ou o menu pararam de responder, e bem menos agressivo que um `systemctl poweroff`. Reescrever esse comando aqui — e não só na seção 3 — reforça que o desligamento tem níveis: fechar um app, recarregar o shell, encerrar a sessão, desligar o sistema.

## Tabela de referência do capítulo

| Comando / atalho | O que faz |
|---|---|
| Menu de energia → Trocar para Desktop | Entra no Modo Desktop (KDE Plasma) |
| "Retornar ao Modo de Jogo" | Volta ao Gamescope |
| `steamos-session-select gamescope` | Troca de sessão por comando |
| `echo $XDG_SESSION_TYPE` | Mostra se a sessão é `wayland` |
| `plasmashell --replace` | Recarrega o shell do Plasma |
| `systemctl --user status plasma-plasmashell` | Estado do serviço do shell |
| `steam -shutdown` | Encerra o Steam |
| `systemctl poweroff` | Desliga o sistema com ordem |
| `ps -u deck --forest` | Lista processos da sessão |
| `cat /sys/class/power_supply/BAT1/status` | Estado da bateria |

## Resumo

- O atalho "Retornar ao Modo de Jogo" encerra o Plasma e devolve ao Gamescope.
- `steamos-session-select gamescope` realiza a mesma troca por linha de comando.
- `systemctl poweroff` desliga com ordenação; botão de força só em último caso.
- O menu de aplicativos oferece Sair, Reiniciar e Desligar.
- `ps -u deck --forest` mostra os processos que serão afetados ao sair.
- O desligamento tem níveis: fechar app → recarregar shell → sair da sessão → desligar sistema.

## Exercícios

1. Anote os processos abertos com `ps -u deck --forest` e identifique o `plasmashell` e o `kwin_wayland` na saída.
2. Usando apenas o menu (não o ícone da área de trabalho), saia da sessão do Desktop e observe qual tela aparece em seguida; depois volte.
3. Cheque a bateria com `cat /sys/class/power_supply/BAT1/status` antes de desconectar o carregador, e novamente depois, registrando a diferença.
4. Execute `steamos-session-select gamescope` (depois de salvar seu trabalho no Desktop) e confirme que você voltou ao Modo Jogo; então retorne ao Desktop.
5. **Desafio.** Faça um "desligamento completo em dois estágios": primeiro recarregue o shell com `plasmashell --replace &`, confirme que voltou, depois encerre a sessão pelo menu e, por fim, rode `systemctl poweroff` a partir de um terminal aberto no Modo Jogo (use o Modo Jogo → Desktop se precisar). Ao religar, relate a sequência e explique a diferença entre cada um dos três níveis de desligamento.
