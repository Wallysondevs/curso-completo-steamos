O esquema de cores do KDE é um conjunto nomeado de papéis — "View Background", "Button Text", "Selection Background" e dezenas de outros — que todo aplicativo Qt consulta quando desenha na tela. Quando o Steam Deck alterna para o Modo Desktop escuro, o que muda por baixo é o esquema de cores `BreezeDark`. Entender como editá-lo e trocá-lo dá um controle fino que o tema global não oferece.

:::objetivos
- Entender o que é um color scheme e sua relação com os temas globais
- Aplicar esquemas pela interface e pela linha de comando com `kwriteconfig6`
- Listar os esquemas instalados e abrir o editor de cores com `kcmshell6 colors`
- Editar papéis de cor individuais e exportar um esquema personalizado
- Corrigir problemas de contraste entre texto e fundo
:::

## Color scheme: o mapa de papéis

Um esquema de cores não é uma paleta aleatória; é um dicionário que associa **papéis semânticos** a cores. "Selection Background" é a cor de fundo quando você seleciona texto ou um arquivo; "View Background" é o fundo das listas e campos de texto; "Window Background" é o fundo das janelas. Ao mudar um papel, todo aplicativo que respeita o tema muda junto — é isso que torna o Plasma consistente visualmente.

Abra **Appearance & Style → Colors & Themes → Colors** (ou `kcmshell6 colors`) para ver a galeria de esquemas. O SteamOS vem com poucos: *Breeze*, *Breeze Dark*, *Breeze High Contrast* e *Breeze Light*.

```terminal
$ ls ~/.local/share/color-schemes/ /usr/share/color-schemes/
/usr/share/color-schemes/:
BreezeDark.colors   BreezeHighContrast.colors   BreezeLight.colors   Breeze.colors
```

Cada esquema é um arquivo `.colors`, essencialmente um bloco INI. Os que vêm com o sistema ficam em `/usr/share/color-schemes/`; os que você cria ou baixa vão para `~/.local/share/color-schemes/` e têm prioridade sobre os do sistema.

## Aplicando e alternando esquemas

Pela interface gráfica, clicar em um esquema o aplica na hora. Pela linha de comando, a ferramenta é o `kwriteconfig6`, que escreve diretamente no arquivo de configuração global:

```terminal
$ kwriteconfig6 --file kdeglobals --group General --key ColorScheme BreezeDark
```

Vamos decompor: `--file kdeglobals` escolhe o arquivo de destino; `--group General` e `--key ColorScheme` apontam para a chave exata; o último argumento (`BreezeDark`) é o valor. Depois de rodar, o Plasma precisa saber que algo mudou para repintar as janelas abertas:

```terminal
$ kreadconfig6 --file kdeglobals --group General --key ColorScheme
BreezeDark
```

Acima, `kreadconfig6` confirma o valor gravado. Repare que `kwriteconfig6`/`kreadconfig6` formam o par escrever/ler do mesmo arquivo — a simetria é fácil de lembrar.

:::atencao
Aplicar um esquema via `kwriteconfig6` não notifica imediatamente todas as janelas abertas. Aplicativos Qt já em execução podem manter a cor antiga até serem reabertos. Se a mudança não "pegar", abra um aplicativo novo (como o Dolphin) ou reinicie o plasma com `plasmashell --replace &`. Na interface gráfica, o System Settings faz essa propagação automaticamente.
:::

## Editando os papéis de cor

O editor de cores, acionado pelo botão de edição de um esquema ou abrindo `kcmshell6 colors` e clicando no lápis, mostra uma tabela com todos os papéis e o seletor de cor para cada um. Modificar "Selection Background" para um azul mais vibrante muda o destaque de seleção em todo o sistema, do Dolphin ao Konsole.

Para entender o que cada papel faz de verdade, o próprio arquivo `.colors` é a melhor documentação:

```terminal
$ head -30 /usr/share/color-schemes/BreezeDark.colors
[ColorEffects:Disabled]
Color=112,111,110
ColorAmount=0
ColorEffect=1
ContrastAmount=0.65
ContrastEffect=1
IntensityAmount=0
IntensityEffect=0

[Colors:Button]
BackgroundAlternate=53,54,58
BackgroundNormal=49,50,54
DecorationFocus=110,156,255
DecorationHover=110,156,255
ForegroundActive=188,190,192
ForegroundInactive=161,163,166
ForegroundLink=41,128,185
ForegroundNegative=218,68,84
ForegroundNeutral=201,206,209
ForegroundNormal=239,240,241
ForegroundPositive=39,174,96
ForegroundVisited=91,144,191
```

As cores estão em formato RGB decimal (três números de 0 a 255). Cada grupo `[Colors:X]` descreve um conjunto de elementos — `Button` cobre os botões, `View` cobre as listas e áreas de conteúdo, `Window` cobre o fundo das janelas. `Foreground` é a cor do texto, `Background` o fundo, e os sufixos indicam o estado: `Normal`, `Active`, `Inactive`, `Positive`, `Negative`.

## Exportando um esquema personalizado

Quando você edita um esquema no editor e salva, o Plasma grava um novo arquivo `.colors` no seu home. Dá para criar também à mão, copiando e modificando um existente:

```terminal
$ cp /usr/share/color-schemes/BreezeDark.colors ~/.local/share/color-schemes/DeckCustom.colors
$ kwriteconfig6 --file ~/.local/share/color-schemes/DeckCustom.colors \
  --group "Colors:Selection" --key BackgroundNormal "30,60,120"
```

Agora aparece um esquema chamado `DeckCustom` na galeria (o nome vem do nome do arquivo, não de uma chave interna). Editar à mão é rápido para ajustes pontuais; para exploração visual, o editor de cores é mais seguro porque mostra o resultado na hora.

:::nota
O formato `.colors` é extenso e documentado na wiki do KDE. Os sufixos `Normal`, `Active`, `Inactive`, `Alternate` e os prefixos `Foreground`/`Background` seguem uma convenção estável há anos, então um esquema criado no Plasma 5 continua funcionando no Plasma 6.
:::

## Contraste e acessibilidade

O esquema *Breeze High Contrast* existe para quem precisa de diferença máxima entre texto e fundo. Aplicá-lo melhora a legibilidade no Deck em ambientes com muita luz refletida na tela:

```terminal
$ kwriteconfig6 --file kdeglobals --group General --key ColorScheme BreezeHighContrast
$ lookandfeeltool -a org.kde.breezedark.desktop
```

O segundo comando não troca o esquema de volta para o padrão de uma vez — ele reaplica o tema global, que por sua vez pode sobrescrever o color scheme que você acabou de definir. É um detalhe importante: **tema global e color scheme não são independentes**. O tema global define o esquema de cores padrão dele; aplicar o tema depois de ajustar cores manualmente desfaz seu ajuste.

## Resumo

- Um color scheme mapeia papéis semânticos (view background, selection, button text) para cores RGB, mantendo a consistência visual.
- Esquemas do sistema vivem em `/usr/share/color-schemes/`; os personalizados, em `~/.local/share/color-schemes/`.
- `kwriteconfig6 --file kdeglobals --group General --key ColorScheme <nome>` troca o esquema pela linha de comando.
- `kreadconfig6` lê o valor da chave; `kcmshell6 colors` abre o editor visual.
- Aplicar um tema global depois de ajustar cores manualmente sobrescreve o esquema de cores.
- O esquema *Breeze High Contrast* melhora a legibilidade em condições de luz difícil.

## Exercícios

1. Liste os esquemas disponíveis com `ls /usr/share/color-schemes/ ~/.local/share/color-schemes/` e abra `kcmshell6 colors` para comparar com a galeria visual.
2. Troque o esquema para `BreezeLight` com `kwriteconfig6`, confirme com `kreadconfig6` e observe a mudança abrindo um novo aplicativo.
3. Edite a cor de seleção do esquema ativo na interface gráfica, salve e descubra qual arquivo `.colors` foi criado no seu home.
4. Crie um esquema copiando o BreezeDark com `cp` para `~/.local/share/color-schemes/` e mude uma única cor de `ForegroundNormal` no grupo `Colors:Selection` com `kwriteconfig6`.
5. **Desafio.** Aplique o `BreezeHighContrast`, depois rode `lookandfeeltool -a org.kde.breezedark.desktop`. Verifique com `kreadconfig6` qual esquema acabou ativo e explique, usando o que você aprendeu sobre a relação tema/color scheme, por que aplicar o tema global desfez a troca de cores. Dica: inspecione `~/.config/kdeglobals` antes e depois.