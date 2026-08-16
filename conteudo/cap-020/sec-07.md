O **Overview** (também chamado de *launchpad de janelas*) é o recurso do Plasma que espalha todas as janelas abertas numa grade visível de uma vez, como se você desse um passo para trás e enxergasse a mesa inteira. Apertar `[[Meta+W]]` no Steam Deck enquanto está no Modo Desktop ativa essa visão — e o que ela mostra (e como ela funciona) é o tema desta seção.

:::objetivos
- Entender a diferença entre Overview, pager e alternador de janelas
- Ativar e desativar o Overview por atalho e por gesto
- Navegar, filtrar e fechar janelas pelo Overview
- Configurar o comportamento do Overview
- Diagnosticar travamentos da visão de overview
:::

## O que o Overview mostra

O Overview é uma tela de "zoom out" que exibe simultaneamente:

- Todas as janelas abertas **na área de trabalho atual**, em miniaturas clicáveis.
- Opcionalmente, as áreas de trabalho virtuais como faixas na lateral ou no topo.
- Uma barra de busca no topo que filtra janelas por título e também aceita comandos (semelhante ao KRunner, que você verá na seção de atalhos globais).

Ele não é uma área de trabalho adicional nem um alternador de janelas: é uma **visão panorâmica** que responde à pergunta "onde está aquela janela que eu abri?" sem precisar fazer `[[Alt+Tab]]` doze vezes.

:::info
No Plasma 5.27 do SteamOS, o Overview é implementado pelo efeito **Present Windows** do KWin combinado com o **Desktop Grid**. Em versões muito antigas do Plasma 5 (anteriores à 5.18), o comportamento era diferente e menos integrado — o SteamOS, felizmente, está numa versão madura desse recurso.
:::

## Ativando o Overview

O atalho principal no Plasma 5 é `[[Meta+W]]`. Há também o "hot corner" (canto quente) — você configurou algum canto da tela para disparar o Overview quando o cursor o atinge, e passar o dedo no trackpad até o canto ativa a visão.

Para configurar cantos quentes, vá nas Preferências do Sistema → Workspace → Comportamento do espaço de trabalho → Cantos da tela (Screen Edges). Pela linha de comando, dá para consultar a configuração atual:

```terminal
$ grep -A10 "ElectricBorders" ~/.config/kwinrc
[ElectricBorders]
TopLeft=None
TopRight=None
BottomLeft=None
BottomRight=None
```

Os valores possíveis para cada canto incluem `Overview`, `DesktopGrid`, `ApplicationLauncher` e outros. Ativá-los pelo arquivo:

```terminal
$ kwriteconfig5 --file kwinrc --group ElectricBorders --key TopLeft "Overview"
$ qdbus org.kde.KWin /KWin reconfigure
```

Depois do `reconfigure`, ao levar o cursor no canto superior esquerdo, o Overview deve disparar.

## Dentro do Overview: navegando

Uma vez ativado, você vê as miniaturas das janelas. O comportamento básico:

- **Clique** numa miniatura para trazer essa janela ao foco e sair do Overview.
- **Pressione `[[Esc]]`** ou `[[Meta+W]]` de novo para sair sem mudar de janela.
- **Digite texto** para filtrar janelas pelo título — conforme digita, as miniaturas que não batem com o filtro somem.
- **Botão do meio** ou **botão fechar** na miniatura para fechar uma janela direto dali.

Há ainda a opção de arrastar uma miniatura para uma área de trabalho diferente (se o pager estiver visível no Overview), o que torna a movimentação de janelas mais visual e menos dependente de menus de contexto.

:::dica
No Steam Deck, o trackpad direito é o melhor amigo do Overview: use-o para mover o cursor até o canto quente ou para `[[Ctrl]]`+click nas miniaturas. Com um teclado Bluetooth, o fluxo `[[Meta+W]]` → digitar parte do título → `[[Enter]]` é tão rápido quanto `[[Alt+Tab]]` e muito mais previsível quando há mais de cinco janelas.
:::

## Personalizando o Overview

O comportamento do Overview é configurável no módulo **Comportamento do espaço de trabalho** → **Efeitos da área de trabalho** do KWin. As opções incluem:

- Exibir ou ocultar o painel durante o Overview.
- Mostrar as áreas de trabalho como faixas.
- Ajustar a animação de entrada e saída (zoom, deslizamento, fade).

Para listar todos os efeitos do KWin e ver se o "Present Windows" está ativo:

```terminal
$ qdbus org.kde.KWin /Effects org.kde.kwin.Effects.activeEffects | tr ',' '\n' | grep -i present
```

O comando devolve os efeitos ativos. Se "presentwindows" não aparecer, o Overview pode estar desabilitado e o atalho não funcionará. Nesse caso, reative o efeito pela interface (Preferências do Sistema → Aparência e comportamento do KWin → Efeitos) ou pela configuração:

```terminal
$ kwriteconfig5 --file kwinrc --group Plugins --key presentwindowsEnabled true
$ qdbus org.kde.KWin /KWin reconfigure
```

## Quando o Overview não responde

Se `[[Meta+W]]` não faz nada, o diagnóstico segue esta ordem:

1. Confirme que o efeito está ativo (comando do `activeEffects` acima).
2. Verifique se o atalho está mapeado: Preferências → Atalhos → KWin → "Expor janelas".
3. Reinicie o compositor: `qdbus org.kde.KWin /KWin reconfigure`.

Se o efeito estiver ativo e o atalho mapeado e ainda assim nada acontece, tente alternar o compositor:

```terminal
$ qdbus org.kde.KWin /Compositor suspend
$ qdbus org.kde.KWin /Compositor resume
```

O `suspend` desliga a composição (efeitos visuais, transparências), e o `resume` religa. Às vezes o estado de suspensão do compositor fica travado, especialmente após o deck sair do modo de suspensão do sistema, e um resume explícito resolve.

## Resumo

- O Overview (`[[Meta+W]]`) espalha todas as janelas em miniaturas para navegação visual rápida.
- Ele combina o efeito Present Windows do KWin com a grade de áreas de trabalho, e aceita filtro por digitação.
- Cantos quentes (Screen Edges) no `kwinrc` podem disparar o Overview ao encostar o cursor nos cantos da tela.
- `activeEffects` confirma se o efeito está ativo; `reconfigure` + `suspend`/`resume` do compositor resolvem travamentos.
- Personalizações de animação e visibilidade ficam nos módulos de efeitos do KWin.

## Exercícios

1. Ative o Overview com `[[Meta+W]]` e identifique quantas janelas estão abertas na área atual.
2. Configure o canto superior esquerdo como "Overview" pelo `kwinrc` e `reconfigure`, e teste com o trackpad.
3. Filtre as janelas por título digitando parte do nome enquanto o Overview está aberto.
4. Liste os efeitos ativos do KWin com `activeEffects` e confirme que "presentwindows" está entre eles.
5. **Desafio.** Suspenda o compositor com `qdbus org.kde.KWin /Compositor suspend`, tente abrir o Overview (ele não vai funcionar), e depois restaure com `resume`. Explique por que a composição é essencial para o efeito de "expor janelas" funcionar.