Quem só usa o padrão "botão A pula, botão X ataca" está deixando a metade mais poderosa do Steam Deck na mesa: os dois touchpads, os quatro botões traseiros, o giroscópio e o *SteamInput*. A ideia central desta seção é uma só, e ela muda tudo o que vem depois — um controle do Deck não precisa ter uma função fixa por botão. A mesma tecla pode significar coisas diferentes dependendo do *modo* em que você está.

:::objetivos
- Entender o modelo de configuração do SteamInput em camadas
- Distinguir os três conjuntos de ação (actions sets) e quando alternar entre eles
- Localizar onde os arquivos de configuração ficam gravados no disco
- Confirmar, via terminal, que o controle e os touchpads são vistos como dispositivos de entrada
- Reconhecer a diferença entre o padrão clássico e o mapeamento avançado
:::

## O modelo mental: conjuntos de ação

Todo layout do SteamInput é feito de **conjuntos de ação** (action sets). Pense neles como "páginas" de um livro: em cada página os mesmos botões físicos têm funções diferentes. Um jogo pode ter uma página para "andar no mundo", outra para "dirigir veículo" e outra para "menu". Ao trocar de página, o botão `A` que antes pulava passa a acelerar — sem que você precise apertar um modificador o tempo todo.

O padrão clássico de console é o caso-limite de uma página só. O avançado usa várias, e troca entre elas de forma automática.

```text
Conjunto de ação "Mundo"      botao A = pular
Conjunto de ação "Veiculo"    botao A = acelerar
Conjunto de ação "Menu"       botao A = confirmar
```

Cada conjunto tem nome, e você define o que dispara a troca. Os gatilhos mais comuns são um botão dedicado, um *chord* (combinação mantida) ou um evento do próprio jogo — como entrar num veículo.

## Os três conjuntos padrão e o que eles mudam

O SteamInput já entrega três conjuntos prontos em qualquer layout, antes mesmo de você criar um:

| Conjunto padrão | Quando é ativo |
|---|---|
| `In Game` | Jogando normalmente |
| `Menu` | Dentro de um menu do próprio jogo |
| `Desktop` | Fora do jogo, no modo desktop do Steam |

No Steam Deck o conjunto `Desktop` é especial: ele faz os trackpads virarem mouse e o gatilho direito virar clique, para você navegar pelo SteamOS sem teclado. Essa é a razão de o menu do sistema funcionar tão bem na ponta dos dedos.

O que importa entender não é a lista em si, mas que **o mesmo hardware físico é remapeado por completo** conforme o conjunto ativo. Não é um "ajuste fino"; é uma troca de contexto.

## Onde o SteamInput guarda essas configurações

Toda configuração de controle é um arquivo de texto no formato VDF (Valve Data Format, a mesma cara dos `.vdf` de configuração da Valve). Eles não ficam em lugar misterioso — ficam dentro da sua home, no diretório do Steam.

```terminal
$ find ~/.local/share/Steam -name '*.vdf' | head -12
/home/deck/.local/share/Steam/config/config.vdf
/home/deck/.local/share/Steam/config/loginusers.vdf
/home/deck/.local/share/Steam/config/steamcontroller_amap_config.vdf
/home/deck/.local/share/Steam/controller_base/templates/gamepad_basic.vdf
/home/deck/.local/share/Steam/controller_base/templates/gamepad_joystick_trackpad.vdf
/home/deck/.local/share/Steam/controller_base/templates/handheld_neptune.vdf
/home/deck/.local/share/Steam/controller_base/templates/keyboard_mouse.vdf
/home/deck/.local/share/Steam/controller_base/actionsets/empty.vdf
```

Duas pastas importam aqui. `controller_base/templates/` guarda os **templates** da Valve — os pontos de partida que aparecem quando você vai criar um layout do zero. E há configurações pessoais, gravadas conforme você edita. O arquivo mais revelador para inspecionar é o template oficial do próprio Deck.

```terminal
$ head -20 ~/.local/share/Steam/controller_base/templates/handheld_neptune.vdf
"controller_mappings"
{
    "version"    "3"
    "revision"   "22"
    "title"      "Official Layout for Steam Deck"
    "description"    "Standard Gamepad"
    "group_source_bindings"
    {
        "bindings"
        {
            "bind_lower"    "button_A"
            "bind_upper"    "button_B"
            "bind_lower_layer"    "button_X"
            "bind_upper_layer"    "button_Y"
        }
    }
}
```

`handheld_neptune` é o nome interno do Steam Deck (a APU dele é uma "Van Gogh"/"Aerith", e o codinome de produto é *Neptune*). A `version` e a `revision` contam a idade do formato.

:::nota
O formato VDF é um mapa chave-valor aninhado, parecido com JSON mas sem vírgulas obrigatórias e com chaves sem aspas. Por isso você consegue ler com `cat`, `grep` e até com o editor de texto — mas editar na mão é pedir por erro. O próprio Steam valida e reescreve esses arquivos.
:::

## O controle é, de fato, um dispositivo de entrada do Linux

Antes de qualquer mágica do SteamInput, o kernel precisa ver os botões. E vê. O Steam Deck expõe seus controles como dispositivos de entrada padrão, que o Linux trata como joystick e teclado virtuais.

```terminal
$ xinput list
⎡ Virtual core pointer                     id=2    [master pointer  (3)]
⎜   ↳ Steam Deck Controller                id=6    [slave  pointer  (2)]
⎣ Virtual core keyboard                    id=3    [master keyboard (2)]
    ↳ Steam Deck Controller                id=7    [slave  keyboard (3)]
```

Repare na letra miúda interessante: o mesmo `Steam Deck Controller` aparece duas vezes — como *pointer* (id 6) e como *keyboard* (id 7). Isso é o SteamInput fingindo ser mouse e teclado para o jogo. O jogo não precisa saber que existe um controle físico; para ele, alguém está mexendo um mouse e apertando teclas.

O teste definitivo de que os eventos físicos chegam até o kernel é o `evtest`, que imprime cada evento em tempo real.

```terminal
$ sudo evtest
No device specified, trying to scan all of /dev/input/event*
Available devices:
/dev/input/event0:   AT Translated Set 2 keyboard
/dev/input/event3:   Steam Deck Controller
/dev/input/event8:   Steam Deck Main Buttons
/dev/input/event9:   Steam Deck JoyStick R
/dev/input/event10:  Steam Deck JoyStick L
/dev/input/event11:  Steam Deck TrackPad R
/dev/input/event12:  Steam Deck TrackPad L
Select the device event number [0-12]:
```

Cada touchpad e cada analógico são um nó separado de `/dev/input/event*`. Essa granularidade é o que permite ao SteamInput interceptar cada peça e reencaminhar como mouse, teclado ou o que você quiser.

:::dica
Para ver um evento vivo, rode `sudo evtest /dev/input/event11`, mexa o touchpad direito e observe linhas como `type 3 (EV_ABS), code 0 (ABS_X), value 812`. O valor entre 0 e ~1600 é a posição do dedo no pad.
:::

## Resumo

- O SteamInput organiza cada layout em **conjuntos de ação**: páginas em que o mesmo botão tem função diferente.
- O Deck já vem com `In Game`, `Menu` e `Desktop`, e o `Desktop` faz os trackpads virarem mouse.
- As configurações ficam em arquivos `.vdf` dentro de `~/.local/share/Steam/`.
- O template oficial do Deck é o `handheld_neptune.vdf`.
- `xinput list` mostra o controle como mouse e teclado virtuais ao mesmo tempo.
- `evtest` prova que cada botão, analógico e touchpad é um nó separado de `/dev/input/event*`.

## Exercícios

1. Liste os templates disponíveis com `find ~/.local/share/Steam/controller_base/templates -name '*.vdf'` e anote quantos são.
2. Rode `xinput list` e explique, em uma frase, por que o Steam Deck Controller aparece como pointer e como keyboard.
3. Use `sudo evtest` sem argumentos para listar os dispositivos e identifique qual número corresponde ao touchpad direito.
4. Abra o `handheld_neptune.vdf` com `cat` e localize o bloco `group_source_bindings`. O que ele sugere sobre os botões `bind_lower` e `bind_upper`?
5. **Desafio.** Com `sudo evtest /dev/input/event11` em um terminal e o touchpad direito no outro, pressione o pad em um canto e depois no canto oposto. Compare os valores de `ABS_X` e `ABS_Y` e proponha como um "menu radial" usaria esses dois eixos para detectar em qual setor seu dedo está.
