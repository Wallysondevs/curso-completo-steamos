Estima-se que cerca de 8% dos homens e 0,5% das mulheres tenham algum tipo de daltonismo — uma fatia grande o suficiente para que a Valve tenha incluído filtros de cor diretamente no Modo Jogo. No SteamOS, três filtros cobrem os tipos mais comuns de deficiência visual cromática: protanopia (vermelho), deuteranopia (verde) e tritanopia (azul). Entender como eles funcionam e como escolher o correto evita a frustração de jogos que dependem de diferenciação de cor — como distinguir amigos de inimigos num HUD.

:::objetivos
- Identificar os três tipos de daltonismo cobertos pelo SteamOS
- Ativar e alternar entre filtros de cor no Modo Jogo
- Verificar a chave de configuração que persiste a escolha
- Testar o filtro correto com ferramentas de simulação visual
- Saber quando o filtro do compositor é preferível ao filtro do jogo
:::

## Os três filtros nativos do SteamOS

O menu de Acessibilidade do Modo Jogo oferece três opções de daltonismo, mais a opção "Nenhum":

1. **Protanopia** — ausência de sensibilidade ao vermelho. Quem tem protanopia confunde vermelho com verde, e ambos tendem a parecer marrom ou cinza.
2. **Deuteranopia** — ausência de sensibilidade ao verde. É a forma mais comum (cerca de 6% dos homens). O verde parece bege, e a distinção entre verde e vermelho some.
3. **Tritanopia** — ausência de sensibilidade ao azul. Muito mais rara; quem tem confunde azul com verde e amarelo com rosa.

Cada filtro aplica uma **matriz de transformação cromática** sobre a imagem final renderizada. Ou seja, ele não altera o pixel original do jogo — ele transforma a cor na saída do compositor, depois que tudo já foi desenhado. Isso significa que o filtro funciona em **qualquer jogo**, sem que o jogo precise saber que ele existe.

O arquivo `config.vdf` registra o filtro ativo na chave `ColorBlindMode`:

```terminal
$ grep "ColorBlindMode" ~/.local/share/Steam/config/config.vdf
"ColorBlindMode"		"2"
```

Os valores típicos: `0` = nenhum, `1` = protanopia, `2` = deuteranopia, `3` = tritanopia. A correspondência pode variar ligeiramente entre versões, mas a ordem lógica é sempre essa.

## Como os filtros funcionam tecnicamente

A transformação cromática do SteamOS opera em espaço RGB. Para cada pixel, o compositor aplica uma multiplicação matricial 3×3 que desloca os canais de cor. O resultado é uma imagem onde a informação que o olho daltônico não consegue distinguir é transportada para outro canal que ele distingue bem.

Fora do Modo Jogo, você pode simular o efeito no Linux com utilitários como o `gammastep` ou o próprio driver `amdgpu`. Embora não sejam os filtros exatos do SteamOS, eles oferecem uma referência de como a tela se altera:

```terminal
$ gammastep -O 4000 &
```

O `-O` ajusta a temperatura de cor (4000 K, tom mais quente), que é uma transformação cromática diferente do daltonismo, mas útil para entender como um shader pode alterar toda a saída. O filtro de daltonismo do SteamOS é uma versão mais específica e clinicamente orientada desse conceito.

## Escolhendo o filtro certo: o teste visual

A interface do Modo Jogo exibe um **gradiente de cores** ao lado de cada opção, como uma prévia do efeito. A recomendação é: ative um, olhe para um jogo com HUD colorido e veja se você consegue distinguir elementos que antes pareciam iguais.

Um teste clássico são as **placas de Ishihara** (os círculos com bolinhas coloridas que formam números). Embora você não tenha essas placas na interface do SteamOS, muitos jogos têm cenários equivalentes: um HUD com barras de vida verde e vermelha, ou um minimapa onde aliados são azuis e inimigos vermelhos.

:::nota
O filtro de cor do SteamOS é **global** — ele afeta tudo: loja, biblioteca, configurações, jogo. Isso é bom para consistência, mas significa que cores que você vê na loja (como banners promocionais) também passam pelo filtro. Não existe filtro por jogo; ou está ligado, ou não.
:::

## Filtros de cor no compositor versus no jogo

Muitos jogos modernos — *Destiny 2*, *Overwatch 2*, *The Last of Us* — oferecem seus **próprios** modos de daltonismo nas configurações internas. A pergunta inevitável: usar o filtro do jogo ou o do SteamOS?

A resposta depende de quem processa a cor por último. O gamescope renderiza primeiro o jogo e depois aplica o filtro do SteamOS. Se você ativar o filtro do jogo **e** o do SteamOS, as transformações se acumulam e o resultado será incorreto — como aplicar dois óculos de sol sobrepostos.

A regra prática: se o jogo tem filtro de daltonismo dedicado, **use o do jogo** e desligue o do SteamOS. O filtro do jogo sabe quais elementos são críticos (HUD, marcadores, time) e pode otimizar só eles, em vez de aplicar uma matriz genérica em tudo.

:::dica
Para jogos antigos ou indies sem opções internas de daltonismo, o filtro do SteamOS é a salvação. É o caso de clássicos emulados, títulos da era PS1/PS2 e jogos de estúdios pequenos que não tinham orçamento para acessibilidade cromática.
:::

## Daltonismo e relatórios de bugs

Se um filtro parece "não fazer diferença", há dois cenários possíveis. O primeiro: você não tem o tipo de daltonismo correspondente àquele filtro — ele transforma cores que você já distingue, e o efeito parece sutil. O segundo: o filtro está com a intensidade incorreta ou o compositor não está aplicando a matriz.

Nesse segundo caso, o journal do gamescope pode conter pistas:

```terminal
$ journalctl -u gamescope --no-pager | grep -i "color\|shader\|filter"
gamescope[842]: wlserver: color management disabled
gamescope[842]: Failed to load color shader: invalid matrix
```

Uma mensagem como `Failed to load color shader` indica que o filtro solicitado não conseguiu ser carregado pelo compositor — algo raro, mas possível após atualizações de driver ou do próprio gamescope. A solução padrão é reiniciar o Modo Jogo ou alternar o filtro para "Nenhum" e reativá-lo.

## Resumo

- O SteamOS oferece três filtros de daltonismo: protanopia (1), deuteranopia (2) e tritanopia (3), registrados em `ColorBlindMode`.
- Cada filtro aplica uma matriz 3×3 sobre o RGB final, afetando qualquer jogo globalmente.
- Se o jogo tem filtro próprio, prefira o filtro do jogo e desligue o do SteamOS.
- Ferramentas como `gammastep` ajudam a simular transformações cromáticas fora do Modo Jogo.
- Mensagens de erro no log do gamescope revelam filtros que não carregaram corretamente.

## Exercícios

1. No Modo Jogo, alterne entre os três filtros e descreva como cada um altera a aparência da biblioteca (capas, botões, menus).
2. Rode `grep "ColorBlindMode" ~/.local/share/Steam/config/config.vdf` antes e depois de mudar o filtro para deuteranopia. O valor bate com o esperado?
3. Execute `gammastep -O 4000` no desktop e observe a tela por 30 segundos. Depois mate com `pkill gammastep`. Compare a sensação com a ativação do filtro de daltonismo.
4. Escolha um jogo que tenha HUD colorido (barras de vida, minimapa). Teste-o com todos os três filtros e registre qual deles trouxe mais distinção — ou se nenhum ajudou.
5. **Desafio.** Inspecione `journalctl -u gamescope | grep -iE "color|shader|filter"` e, se houver mensagens de erro, proponha uma explicação para cada uma ligando-as ao pipeline do compositor. Se não houver erros, explique por que o log está limpo em um sistema saudável.