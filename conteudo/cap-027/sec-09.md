Você já viu os atalhos isolados: KDE, KWin, Steam, KRunner, `xdotool`. A produtividade de verdade aparece quando eles se combinam em fluxos — uma sequência de teclas que executa uma tarefa inteira. Esta seção fecha o capítulo juntando as peças num fluxo de trabalho coeso para o Steam Deck.

:::objetivos
- Combinar atalhos do KDE, KWin e Steam num único fluxo
- Construir macros de `xdotool` integradas a atalhos customizados
- Diagnosticar rapidamente por que um atalho não dispara
- Memorizar o mapa essencial de atalhos por camada
:::

## O mapa completo por camada

Antes de combinar, fixe o mapa de quem faz o quê. É a cola mental que evita tentar o atalho errado na camada errada:

| Camada | Disparador | Atalhos representativos |
|---|---|---|
| Steam / Game Mode | Botão Steam + rosto | [[Steam+X]], [[Steam+L1]], `... + Y` |
| KDE global | `kglobalaccel` | [[Alt+F2]], [[Ctrl+Alt+T]], [[Alt+Tab]] |
| KWin (janelas) | componente `kwin` | [[Steam+Up]], [[Steam+Left]], matar janela |
| KRunner | `krunner`/[[Alt+Space]] | busca, cálculo, conversão |
| Customizado | `[custom]` + `.desktop` | qualquer comando que você criar |

Funções de `xdotool` não são uma camada de "atalho" — são um mecanismo para **simular** teclas, e podem ser chamadas de dentro de qualquer atalho customizado ou script.

## Um fluxo de trabalho completo

Imagine a tarefa recorrente: abrir um terminal, ir até o diretório do projeto, posicionar a janela à esquerda e lançar um monitor de logs à direita. Você faz isso no teclado externo do dock em segundos:

```terminal
$ cd ~/lab && konsole &
$ xdotool key super+left
```

Mas isso ainda é manual. O poder vem de encapsular o fluxo num script e amarrá-lo a uma tecla:

```bash
#!/bin/bash
# abre terminal de trabalho e arranja as janelas
konsole --profile trabalho &
sleep 1
xdotool key super+left
konsole --profile monitor &
sleep 1
xdotool key super+right
```

O script `~/.local/bin/fluxo-trabalho.sh` usa `xdotool key super+left` para encaixar cada janela na metade correta. Para associá-lo a uma tecla, registre um atalho customizado (como na seção sobre atalhos customizados):

```terminal
$ kwriteconfig6 --file kglobalshortcutsrc --group custom --key "fluxo-trabalho" "Ctrl+Alt+W,none,Fluxo de Trabalho"
$ chmod +x ~/.local/bin/fluxo-trabalho.sh
```

Agora [[Ctrl+Alt+W]] dispara o fluxo inteiro. É a diferença entre "saber atalhos" e "ter produtividade": o atalho deixa de fazer uma ação e passa a fazer uma **tarefa**.

:::dica
Use `sleep` pequeno (1 segundo) entre os comandos do `xdotool` que dependem da janela anterior já ter aberto. Sem o `sleep`, o `xdotool key` pode disparar antes de a janela existir, e o encaixe "erra" a janela. Ajuste o valor conforme a velocidade do seu Deck.
:::

## Diagnosticando um atalho que não dispara

Quando nada acontece ao apertar uma tecla, o problema quase sempre está numa destas causas — e cada uma tem um teste:

1. **Camada errada.** Atalho do KDE apertado no Game Mode (ou vice-versa). Teste: `qdbus ...shortcutNames` lista a ação? Se não, ela não existe naquela camada.
2. **Conflito de tecla.** Duas coisas reivindicam a mesma combinação. Teste: `grep -n 'a-tecla' ~/.config/kglobalshortcutsrc`.
3. **Sem recarga.** Editou o arquivo e o Plasma não releu. Teste: reinicie com `kquitapp5 plasmashell && kstart5 plasmashell`.
4. **Steam capturando `Meta`.** O cliente Steam intercepta a tecla no desktop. Teste: feche o Steam e tente `[[Steam+Up]]` de novo.

```terminal
$ qdbus org.kde.kglobalaccel /component/kwin org.kde.kglobalaccel.Component.shortcutNames | grep -i 'close'
Window Close
```

O comando acima verifica se `Window Close` existe como ação do KWin. Se aparece, a ação está registrada — o problema, se houver, é na tecla ou na camada, não na existência da ação.

:::atencao
O sintoma "funcionava e parou" quase sempre é um conflito novo: você instalou um aplicativo que registrou a mesma tecla. O `grep` no arquivo revela a duplicação. Remova o atalho do aplicativo infrator ou remapeie o seu — não deixe duas ações disputando a mesma tecla, porque o comportamento passa a ser imprevisível (às vezes uma vence, às vezes a outra).
:::

## A lista de referência final

Estes são os atalhos que valem ser decorados, organizados por finalidade:

| Finalidade | Atalho | Camada |
|---|---|---|
| Busca universal | [[Alt+F2]] / [[Alt+Space]] | KDE/Runner |
| Terminal | [[Ctrl+Alt+T]] | KDE |
| Teclado virtual | [[Steam+X]] | Steam |
| Fechar janela | [[Alt+F4]] | KWin |
| Maximizar | [[Steam+Up]] | KWin |
| Ladrilhar esquerda/direita | [[Steam+Left/Right]] | KWin |
| Alternar janelas | [[Alt+Tab]] | KWin |
| Mover entre telas | [[Steam+Shift+Left/Right]] | KWin |
| Menu de operações | [[Alt+F3]] | KWin |
| Matar janela | [[Ctrl+Alt+Esc]] | KWin |

Ter essa tabela em mãos (ou na memória) cobre praticamente todo o dia a dia no deck e no dock.

```terminal
$ grep -cE '=' ~/.config/kglobalshortcutsrc
87
```

O número acima é a contagem aproximada de entradas no arquivo — oitenta e tantas ações disponíveis. Você não precisa de todas; precisa das doze da tabela, mais as customizadas que criou para o seu jeito de trabalhar.

## Resumo

- Cada camada (Steam, KDE, KWin, KRunner, custom) tem seus atalhos, e a cola mental é o mapa por camada.
- Combinações de `xdotool` + atalho customizado transformam uma tecla num fluxo inteiro.
- Conflito de tecla, camada errada e falta de recarga são as três causas mais comuns de falha.
- `grep`, `qdbus` e a reinicialização do plasmashell são as ferramentas de diagnóstico.
- Gravar um fluxo em script com `sleep` entre passos evita disparos fora de ordem.
- Uma dúzia de atalhos bem decorados cobre praticamente todo o uso do Deck.

## Exercícios

1. Importe a tabela de referência final como um post-it (ou arquivo) e, num dia de uso, marque quais você usou de fato.
2. Escreva um script com dois comandos `konsole` e dois `xdotool key super+left/right`, e rode-o manualmente para validar o resultado.
3. Associe esse script a um atalho customizado com `kwriteconfig6` e dispare-o pela tecla.
4. Provoque um conflito proposital (duas entradas com a mesma tecla) e diagnostique-o com `grep`.
5. **Desafio.** Crie um atalho customizado que, em um único disparo, mude para outro desktop virtual, abra o terminal e ladrilhe a janela — integrando KWin, KRunner e `xdotool` num fluxo só.
