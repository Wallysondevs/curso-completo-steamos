O SteamInput não é só para jogos. Fora de qualquer título, o Deck está no modo `Desktop`, cujo layout padrão é um dos feitos de engenharia de UX mais discretamente geniais da Valve: transformar dois touchpads, analógicos e gatilhos num substituto funcional de mouse e teclado sem nunca pedir que você troque de contexto.

:::objetivos
- Entender o layout padrão do modo Desktop no Steam Deck
- Remapear atalhos do sistema (trocar de janela, abrir terminal, capturar tela)
- Configurar o teclado virtual para idiomas não-ingleses com acentos
- Criar atalhos de teclado personalizados com combinações de teclas
- Integrar atalhos do Steam com atalhos do KDE Plasma
:::

## O layout Desktop como ele realmente funciona

No modo Desktop, o SteamInput carrega o conjunto de ação padrão `Desktop`, que é essencialmente um layout feito para produtividade. A anatomia dele:

```text
Trackpad direito     → Mouse com clique esquerdo (toque = clique)
Trackpad esquerdo    → Scroll circular (borda) + clique do meio (centro)
Gatilho direito (R2) → Clique esquerdo
Gatilho esquerdo (L2) → Clique direito
Analógico esquerdo   → Setas direcionais (↑↓←→)
Botões A/B/X/Y       → Enter, Escape, Tab, Espaço
Botões de ombro      → Page Up / Page Down (L1/R1)
Botão Steam          → Abrir menu iniciar (Super)
Botão ... (QAM)      → Atalhos de sistema
```

Esse layout é o motivo de você conseguir usar o Deck como um mini-laptop sem mouse nem teclado externos: ele cobre 80% das interações de navegação, edição de texto leve e consumo de mídia.

```terminal
## Para ver qual layout está ativo no momento:
$ cat /proc/bus/input/devices | grep -c 'Steam'
6
## O número de dispositivos "Steam" varia: é normal ver 6 a 8 linhas,
## porque cada grupo de botões vira um dispositivo virtual separado.
```

:::nota
O modo Desktop usa o driver `libinput` do Linux, e o SteamInput atua como tradutor entre os eventos de hardware e os eventos de mouse/teclado que o X11 ou Wayland esperam. Por isso você não precisa configurar nada no sistema operacional — o Steam já fez.
:::

## Remapeando atalhos do sistema

O layout padrão é bom, mas pessoal. Você pode (e deve) ajustá-lo para o seu fluxo. Por exemplo: abrir o Konsole com um botão traseiro, ou capturar a tela com `R4` em vez de buscar o atalho de teclado do KDE.

```text
Botão R4 (traseiro direito superior)
  → Comportamento: Keyboard Key
  → Tecla: Ctrl+Alt+T
  → Modo: Regular Press
```

O `Ctrl+Alt+T` é o atalho universal do KDE para abrir o terminal. Com um botão dedicado a ele, você ganha um "botão de hacker" no Deck.

Outros atalhos que fazem sentido mapear em botões traseiros:

| Botão | Atalho | Efeito |
|---|---|---|
| `R4` | `[[Ctrl+Alt+T]]` | Abrir Konsole |
| `R5` | `[[Alt+Tab]]` | Trocar de janela |
| `L4` | `[[Meta+Shift+S]]` | Captura de tela com seleção (Spectacle) |
| `L5` | `[[Ctrl+W]]` | Fechar aba (navegador, Dolphin) |

O segredo é mapear ações que você faz 50 vezes por dia. Não adianta encher todos os botões traseiros com funções que você usa uma vez por mês — a memória muscular não gruda.

:::dica
Para descobrir o atalho de teclado de qualquer ação no KDE, vá em *Configurações do Sistema → Atalhos*. O campo "Atalho global" mostra a combinação exata que você deve passar para o SteamInput.
:::

## O teclado virtual e a questão dos acentos

O teclado virtual do Steam (`steam -gamepadui`) é ativado sempre que um campo de texto recebe foco no modo Big Picture. No modo Desktop, o comportamento depende: com o Steam rodando em segundo plano, o atalho `[[Steam+X]]` força o teclado virtual a aparecer (ou desaparecer).

```terminal
$ steam -gamepadui &
## Inicia o Steam em modo Big Picture (gamepad UI).
## O teclado virtual fica disponível globalmente enquanto este processo roda.
```

Para digitar em português com acentos, o layout do teclado virtual do Steam tem suporte a pressionamento longo: segure `A` e deslize para escolher entre `A`, `Á`, `À`, `Ã`, `Â`, `Ä`. O mesmo vale para `C` (Ç), `N` (Ñ) e vogais. Não é tão rápido quanto um teclado físico ABNT2, mas cobre o essencial.

:::atencao
O teclado virtual do Steam e o teclado virtual do KDE (`onboard` ou `maliit`) são entidades diferentes e **não se coordenam**. Se você estiver no modo Desktop com o Steam fechado, o `Steam+X` não faz nada e o KDE tentará abrir o teclado dele. Escolha um ecossistema e fique nele para evitar confusão.
:::

## Criando atalhos de teclado personalizados

O SteamInput suporta combinações de até 5 teclas simultâneas. Para criar um atalho que não está em nenhum menu, use o modo `Chord`:

```text
Botão R4 → Modo: Chord
  → Tecla 1: Ctrl
  → Tecla 2: Shift
  → Tecla 3: N
```

Isso envia `Ctrl+Shift+N` — criar nova pasta no Dolphin. O modo `Chord` é diferente do `Multi-Key` em macros: aqui as teclas são pressionadas juntas (simultâneas), não em sequência.

## Integrando atalhos do Steam com o KDE Plasma

O KDE Plasma do SteamOS 3.6 já vem com atalhos globais que o SteamInput pode invocar. Alguns são obscuros mas transformadores:

```text
Meta + P            → Alternar entre modos de exibição (interno / externo / estendido)
Meta + Shift + ←/→  → Mover janela para o monitor esquerdo/direito
Ctrl + F10          → Maximizar/restaurar janela
Alt + F3            → Menu de operações da janela
```

Mapear `Meta + P` para um botão traseiro, por exemplo, permite trocar da tela do Deck para um monitor externo com um toque — sem precisar cutucar as configurações de vídeo.

```terminal
## Liste os atalhos globais registrados no KDE:
$ kwriteconfig5 --file ~/.config/kglobalshortcutsrc --list | head -20
## Saída longa; use grep para filtrar por ação:
$ kwriteconfig5 --file ~/.config/kglobalshortcutsrc --list | grep -i terminal
## A saída mostra a ação e o atalho atribuído.
```

:::exemplo
Num fluxo de "deck dockeado", mapeie `L4` = `Meta+P` (alternar monitor), `R4` = `Ctrl+Alt+T` (terminal), `L5` = `Alt+Tab` (trocar janela) e `R5` = `Meta+Shift+S` (captura). O Deck vira uma estação de trabalho portátil com 4 botões dedicados às ações mais repetitivas.
:::

## Resumo

- O layout `Desktop` do SteamInput transforma touchpads, analógicos e botões em mouse e teclado virtuais.
- Trackpad direito = mouse, esquerdo = scroll, analógico = setas, face buttons = Enter/Esc/Tab/Espaço.
- Remapear botões traseiros para `Ctrl+Alt+T`, `Alt+Tab` e atalhos do KDE elimina fricção de produtividade.
- O teclado virtual do Steam aceita acentos via pressão longa; não conflite com o teclado do KDE.
- O modo `Chord` envia combinações simultâneas de teclas (até 5), diferente de macros sequenciais.
- `kwriteconfig5` lista atalhos globais do KDE que você pode mapear para botões físicos.

## Exercícios

1. Liste os atalhos globais do KDE com `kwriteconfig5 --file ~/.config/kglobalshortcutsrc --list` e escolha dois que você não conhecia. Mapeie-os nos botões traseiros.
2. Abra o Konsole com `R4` e o navegador com `R5` usando o modo `Chord` (ex.: `Ctrl+Alt+T` e `Meta+B`). Teste os dois em sequência rápida.
3. Configure `L4` como `Meta+P` e teste alternar entre a tela do Deck e um monitor externo com um toque.
4. Escreva um parágrafo usando o teclado virtual com acentos (á, ç, ã, ê). Cronometre e compare com o teclado físico.
5. **Desafio.** Projete um layout Desktop pessoal com 4 botões traseiros e 2 camadas: uma para navegação e outra para edição de texto. Justifique cada escolha com base no seu fluxo real de uso do Deck fora de jogos.