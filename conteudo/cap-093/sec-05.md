Você liga o Steam Deck, entra no modo jogo, e o controle — seja o embutido, seja um DualSense pareado — simplesmente não responde. O sistema sabe que ele está ali (o LED acende, o Bluetooth mostra "conectado"), mas o jogo ignora os comandos. A causa está quase sempre numa das três camadas entre o toque e a ação: o nó de entrada no `/dev`, o Steam Input ou o foco da janela no modo desktop.

:::objetivos
- Confirmar que os eventos do controle chegam ao `/dev/input`
- Diagnosticar erro de pareamento e associação Bluetooth
- Reprogramar o Steam Input quando o layout trava
- Corrigir foco e ordem de janela no modo desktop
:::

## O controle está visível para o kernel?

O passo zero é confirmar que os eventos físicos estão gerando dados no subsistema de entrada. Para isso existe o `evtest`, que imprime cada pressionamento de botão e movimento de eixo em tempo real.

```terminal
$ sudo evtest
No device specified, trying to scan all of /dev/input/event*
Available devices:
/dev/input/event0:  Power Button
/dev/input/event1:  AT Translated Set 2 keyboard
/dev/input/event6:  Valve Software Steam Deck Controller
/dev/input/event9:  Sony Interactive Entertainment DualSense Wireless Controller
Select the device event number [0-9]: 9
Event: time 1733198521.192421, type 1 (EV_KEY), code 305 (BTN_SOUTH), value 1
Event: time 1733198521.476301, type 1 (EV_KEY), code 305 (BTN_SOUTH), value 0
...
```

Selecione o número correspondente ao seu controle e aperte um botão — se os eventos aparecem com `value 1` (pressionou) e `value 0` (soltou), o hardware e o kernel estão **perfeitos**. O problema está acima: Steam Input, foco ou mapeamento. Se nada aparecer, o controle não está gerando eventos e a investigação recai sobre pareamento, driver ou o próprio dispositivo.

```terminal
$ sudo evtest /dev/input/event9 | head -20
```

Passar o dispositivo diretamente (sem o menu interativo) é útil quando você já sabe qual `event*` corresponde ao controle — economiza a etapa de seleção e pode ser usado em scripts de diagnóstico.

:::dica
Para descobrir qual `event*` é o controle sem ficar chutando número, use `ls -la /dev/input/by-id/`. Os links simbólicos apontam para os dispositivos com nomes legíveis como `...DualSense...` ou `...Steam_Deck_Controller...`.
:::

## Bluetooth que pareou mas não conecta de volta

O segundo cenário mais comum: o controle estava funcionando ontem, mas hoje não conecta, e o ícone de Bluetooth gira sem parar. O problema geralmente é o pareamento que expirou ou o controle que está tentando conectar em outro aparelho simultaneamente.

```terminal
$ bluetoothctl devices
Device 84:62:1A:3C:9F:B1 DualSense Wireless Controller
$ bluetoothctl info 84:62:1A:3C:9F:B1
Device 84:62:1A:3C:9F:B1 (public)
        Name: DualSense Wireless Controller
        Alias: DualSense Wireless Controller
        Paired: yes
        Trusted: yes
        Blocked: no
        Connected: no
        LegacyPairing: no
```

O controle está pareado (`Paired: yes`) e confiável (`Trusted: yes`), mas não conectado. Tente conectar manualmente e observar o erro:

```terminal
$ bluetoothctl connect 84:62:1A:3C:9F:B1
Attempting to connect to 84:62:1A:3C:9F:B1
Failed to connect: org.bluez.Error.Failed br-connection-profile-unavailable
```

`br-connection-profile-unavailable` significa que o BlueZ não consegue negociar o perfil de entrada HID. Isso acontece quando o controle foi pareado antes via outro perfil (áudio, por exemplo) e o perfil de entrada não está disponível. A solução mais rápida é remover e refazer o pareamento:

```terminal
$ bluetoothctl remove 84:62:1A:3C:9F:B1
Device has been removed
$ bluetoothctl scan on  # coloque o controle em modo de pareamento agora
$ bluetoothctl pair 84:62:1A:3C:9F:B1
$ bluetoothctl trust 84:62:1A:3C:9F:B1
$ bluetoothctl connect 84:62:1A:3C:9F:B1
```

:::atencao
Antes de remover o pareamento, certifique-se de que o controle não está conectado a nenhum outro aparelho (PS5, celular, outro PC). O Bluetooth é monogâmico: um controle pareado em dois lugares diferentes fica pingando entre os dois, e o sintoma é "conectou por 2 segundos e caiu".
:::

## Steam Input travou no layout errado

O Steam Input é a camada proprietária que traduz eventos crus em ações de jogo. Às vezes ele "trava" num layout que você não escolheu — teclas erradas, giroscópio invertido, ou o controle simplesmente não responde dentro do jogo (mas funciona nos menus do Steam).

```terminal
$ find ~/.local/share/Steam/ -name "*.vdf" -path "*controller*" | head -5
/home/ana/.local/share/Steam/config/config.vdf
/home/ana/.local/share/Steam/steamapps/common/SteamControllerConfigs/...
```

A solução canônica, embora não tenha linha de terminal, é abrir o Steam em modo Big Picture, ir até *Configurações do controle* e aplicar um layout oficial ou limpar o layout travado. Pelo terminal, você pode ao menos verificar que o arquivo de configuração existe e não está corrompido:

```terminal
$ file ~/.local/share/Steam/config/config.vdf
/home/ana/.local/share/Steam/config/config.vdf: ASCII text
```

Um `config.vdf` ilegível (binário, vazio ou com permissão errada) pode ser deletado — o Steam o recria com valores padrão no próximo lançamento.

:::dica
Se o controle funciona no modo Big Picture mas não nos jogos, o problema não é driver — é o overlay do Steam que não está injetando a tradução. No modo desktop, abrir o jogo fora do Steam (direto pelo executável ou Flatpak) contorna o Steam Input e o controle pode parar de responder. Sempre lance jogos pelo Steam quando depender de mapeamento.
:::

## Foco de janela no modo desktop

No modo desktop do SteamOS, o gerenciador de janelas (KWin) pode dar foco a uma janela que não é o jogo — o controle vai para o sistema operacional, não para o jogo. O sintoma clássico: os analógicos movem o cursor do mouse em vez do personagem.

```terminal
$ xdotool getactivewindow getwindowname
Discover
```

Se `getactivewindow` diz `Discover` e você está dentro de um jogo, o foco está na loja, não no jogo. Pressionar `[[Alt+Tab]]` na interface ou clicar dentro da janela do jogo resolve. A linha de comando pode forçar o foco se você souber o título da janela:

```terminal
$ xdotool search --name "The Witcher" windowactivate
```

Isso é mais útil em scripts de lançamento do que no uso cotidiano, mas mostra por que o problema acontece: no modo desktop, o controle compete pela atenção do gerenciador de janelas, algo que o modo jogo (gamescope) abstrai completamente.

## Resumo

- `evtest` confirma se os eventos do controle estão chegando ao kernel; é a primeira pergunta a responder.
- `ls -la /dev/input/by-id/` revela qual `event*` é o controle, sem adivinhação.
- `bluetoothctl connect` com `br-connection-profile-unavailable` indica que o perfil HID não negociou — remova e repareie.
- `Steam Input travado` mostra-se como controle funcional nos menus mas morto nos jogos; limpar o layout resolve.
- No modo desktop, o foco de janela (`xdotool`) pode roubar os eventos do jogo; o modo jogo não sofre disso.
- Controle piscando e caindo sugere pareamento duplo (outro aparelho); remova de todos e repareie só no Deck.

## Exercícios

1. Localize seu controle no `/dev/input/by-id/` e anote o caminho exato. Depois confirme com `evtest` que os eventos de um botão chegam.
2. Com `bluetoothctl devices` e `bluetoothctl info <mac>`, inspecione o estado atual do seu controle. Há alguma flag com valor suspeito?
3. Force um problema controlado: `rfkill block bluetooth`, depois `rfkill unblock bluetooth`, e observe com `bluetoothctl` como o estado `Connected` vai e volta.
4. Examine o conteúdo de `/dev/input/by-id/` e identifique quais dispositivos são o teclado, o mouse e o controle. Quantos nós `event*` no total?
5. **Desafio.** Sem consultar a seção 9 do capítulo 83 sobre regras udev, tente explicar por que um controle conectado por USB não aparece no `evtest` — e qual o comando que você usaria para criar uma regra udev que garanta permissão de leitura (0666) para qualquer controle conectado.