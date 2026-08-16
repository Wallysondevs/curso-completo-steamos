O Steam Input é o sistema que traduz os botões físicos do Deck em ações de software. Cada botão, analógico, touchpad e o giroscópio podem ser remapeados para teclas, atalhos de mouse, macros ou comandos do sistema. Entender o mapeamento é o que destrava o potencial máximo do hardware — especialmente para jogos que não têm suporte nativo a gamepad. Esta seção cobre a anatomia de um mapeamento e como configurá-lo.

:::objetivos
- Navegar pela interface de configuração do Steam Input
- Mapear botões para teclado, mouse e comandos do sistema
- Configurar touchpads como mouse e giroscópio como mira
- Criar e aplicar perfis por jogo ou globalmente
:::

## A anatomia de um mapeamento

Cada jogo no Steam pode ter um **perfil de controle** próprio, ou herdar um perfil global. O perfil define o que cada componente físico produz. A configuração fica no overlay Steam (Steam + menu do jogo), na aba "Configurações do controle".

| Componente físico | Tipos de ação comuns |
|---|---|
| Botões de face (A/B/X/Y) | Teclas de teclado, botões de gamepad, comandos |
| D-Pad | Teclas, direções, radial menu |
| Analógicos | Eixos de gamepad, mouse, WASD |
| Touchpads | Mouse, scroll, botões, menus radiais |
| Giroscópio | Mouse/mira por movimento físico |
| Bumpers (L1/R1) | Teclas, botões, toggles |
| Gatilhos (L2/R2) | Eixos analógicos, ativação em ponto do curso |
| Botões traseiros (L4/L5/R4/R5) | Qualquer coisa, incluindo macros |

```terminal
$ ls ~/.local/share/Steam/controller_config/
deck              deck_0            personalization
```

O diretório `controller_config` armazena os perfis em arquivos `.vdf` (formato Valve). O subdiretório `deck` guarda os mapeamentos padrão do aparelho; `personalization` guarda seus perfis personalizados.

## Mapeando um botão para teclado ou mouse

O caso de uso mais frequente é mapear botões para teclas quando um jogo só aceita teclado e mouse. Exemplo: um jogo antigo que usa `WASD` para movimento e mouse para câmera.

| Requisito do jogo | Mapeamento recomendado |
|---|---|
| Movimento WASD | Analógico esquerdo → WASD |
| Câmera/mira | Touchpad direito → mouse (região) |
| Interagir (tecla E) | Botão A → tecla E |
| Pular (espaço) | Botão B → espaço |
| Atacar (clique) | Gatilho R2 → clique esquerdo do mouse |
| Correr (shift) | Bumper R1 → Shift |
| Abrir mapa (M) | Botão traseiro L4 → tecla M |

A configuração é feita pela interface gráfica do Steam Input, mas o resultado é serializado em um arquivo que você pode inspecionar:

```terminal
$ grep -o '"bindings".*' ~/.local/share/Steam/controller_config/deck/*.vdf | head -c 300
"bindings" {"joystick_move" {"bindings" {"00" {"codetype" "keyboard" ...
```

O formato `.vdf` é um JSON com sintaxe própria (chaves sem aspas). Ver esses arquivos ajuda a entender por que um perfil "não pegou" — muitas vezes é um conflito entre o perfil do jogo e o perfil global.

:::dica
Sempre configure o **perfil por jogo** (não o global) ao mapear teclado e mouse. O perfil global afeta todos os jogos e pode quebrar o comportamento de títulos que já têm suporte nativo a gamepad.
:::

## Giroscópio e touchpads como mouse

O giroscópio é a arma secreta do Deck para tiro com precisão em jogos sem aim assist. Ele converte a rotação física do aparelho em movimento de cursor/mira.

| Configuração do giroscópio | Efeito |
|---|---|
| **Como mouse** | Rotação move o cursor (mira) |
| **Ativação: sempre ligado** | Giroscópio ativo o tempo todo |
| **Ativação: ao tocar no touchpad** | Só ativa quando o polegar toca o touchpad direito |
| **Ativação: ao puxar o gatilho** | Só ativa ao pressionar L2 (padrão comum para ADS) |
| **Sensibilidade** | Multiplicador de resposta ao movimento |

O touchpad direito, por padrão, age como mouse com "região": a posição do dedo mapeia para uma região da tela, não para deslocamento relativo. Isso permite "apontar" para um canto da tela tocando no canto equivalente do touchpad.

```terminal
$ evtest /dev/input/event12 2>&1 | grep -E 'ABS_(RX|RY)' | head -4
  Event type 3 (EV_ABS), code 3 (ABS_RX), value 124
  Event type 3 (EV_ABS), code 4 (ABS_RY), value 318
```

O giroscópio expõe seus valores pelo subsistema `evdev` como eixos absolutos `ABS_RX` e `ABS_RY`. O Steam Input lê esses eventos e os converte em movimento de mouse, aplicando a sensibilidade configurada.

:::atencao
O giroscópio consome bateria constantemente quando ativo no modo "sempre ligado". Prefira a ativação condicional ("ao tocar no touchpad" ou "ao puxar o gatilho") — o ganho de precisão é o mesmo e a autonomia aumenta em até 20 minutos nas sessões longas.
:::

## Resumo

- O Steam Input remapeia cada componente físico para teclado, mouse, gamepad ou comandos do sistema.
- Perfis por jogo têm prioridade sobre o perfil global; conflitos geram comportamento inesperado.
- Touchpad direito como "mouse de região" e giroscópio como "mouse" são os mapeamentos mais usados.
- Os perfis ficam em `.vdf` no diretório `controller_config/` como dados serializados.
- O giroscópio chega ao sistema como eixos `ABS_RX`/`ABS_RY` via evdev.

## Exercícios

1. Abra o Steam Input de um jogo que só aceita teclado e mapeie o analógico esquerdo para WASD. Teste o movimento e a diagonal.
2. Mapeie o touchpad direito como mouse de região e ajuste a sensibilidade até a mira ficar confortável. O que muda ao tocar em cantos diferentes?
3. Configure o giroscópio com ativação "ao puxar o gatilho L2". Teste mirar em um ponto fixo da tela balançando o Deck.
4. Localize o arquivo `.vdf` do seu perfil em `~/.local/share/Steam/controller_config/` e encontre a entrada do botão A. O que ela contém?
5. **Desafio.** Crie um perfil com dois "modos" (action sets): um para navegação de menu (D-Pad em setas, A em Enter) e outro para gameplay. Configure a troca entre os sets com um botão traseiro e explique quando cada set deve estar ativo.