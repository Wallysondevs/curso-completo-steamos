A emulação de Switch só vale a pena quando os controles respondem como no console real. O Steam Deck tem vantagem única: seus controles nativos incluem touchpads, giroscópio e botões traseiros, que o Steam Input pode mapear para funções que o Switch não expõe por padrão. Esta seção cobre o mapeamento, o giroscópio nos jogos que o usam e a integração com o modo jogo.

:::objetivos
- Mapear os controles do Deck para o layout do Switch
- Configurar giroscópio e sensores para jogos que exigem movimento
- Integrar o emulador com o Steam Input e o modo jogo
- Resolver conflitos de controle entre o emulador e o Steam
:::

## O mapeamento do Deck para o controle Pro

O Switch usa o Pro Controller como referência: dois analógicos clicáveis, d-pad, quatro botões de face, quatro gatilhos (dois digitais + dois analógicos) e botões Home/Capture. O layout do Steam Deck é quase idêntico, com a diferença dos touchpads e botões traseiros extras.

O Yuzu oferece pré-configurações prontas. Em **Emulation → Configure → Controls**, escolha o perfil **Steam Deck** ou mapeie manualmente. O Ryujinx tem input configurável em **Options → Settings → Input**, com suporte a gamepad via SDL.

```terminal
$ # O Yuzu detecta o controle via SDL
[   0.512] Input                            <Info>    Configured SDL gamepad: Steam Deck Controller
```

O mapeamento básico fica assim:

| Controle do Deck | Função no Switch | Botão do Pro Controller |
|---|---|---|
| A / B / X / Y | Confirmar / cancelar / ações | A / B / X / Y (espelhados) |
| D-pad | Movimentação em menus | D-pad |
| Analógicos L/R | Movimento / câmera | Analógicos |
| L/R (bumpers) | L / R | L / R |
| L2/R2 (gatilhos) | ZL / ZR | ZL / ZR |
| Steam / Quick Access | Home | Home |

:::atencao
O Deck inverte as posições de A/B e X/Y em relação ao layout que o emulador assume por padrão (o Switch usa confirmação em "A" à direita; o Steam Decks usa "A" à direita também, mas o emulador pode mapear por posição física em vez de rótulo). Sempre teste o jogo e ajuste se a confirmação parecer trocada.
:::

## Giroscópio e sensores de movimento

Vários jogos de Switch exigem giroscópio ou acelerômetro — da mira por movimento em *Splatoon* e *Breath of the Wild* aos quebra-cabeças de *Mario Kart*. O Deck tem giroscópio integrado, e ambos os emuladores podem expô-lo como CemuHook (o protocolo padrão de entrada de movimento).

No Yuzu: **Emulation → Configure → Controls**, aba **Motion**, habilite a emulação de giroscópio e aponte para o controle. No Ryujinx: **Options → Settings → Input**, habilite **Motion Controls**.

```terminal
$ # O giroscópio aparece como sensor via SDL
$ ls /dev/input/by-path/ | grep -i accelerometer
platform-spi0.0-event-joystick
```

O ajuste fino é a sensibilidade. Giroscópio muito sensível torna a mira tremida; pouco sensível exige movimentos exagerados. Comece no padrão e ajuste por jogo.

:::dica
Para jogos de tiro com mira por movimento, mapeie o giroscópio para ativar apenas ao tocar um touchpad ou um botão traseiro — assim você não fica movendo a tela sem querer. O Steam Input permite esse "gyro on touch".
:::

## Integração com o Steam Input

Se você lança o emulador direto do modo jogo (sem o Steam ROM Manager), o Steam trata o controle como se fosse um gamepad comum, passando-o ao emulador via SDL. Isso funciona na maioria dos casos, mas o Steam Input pode "consumir" o giroscópio, impedindo que chegue ao emulador.

Dois caminhos possíveis:
1. **Deixar o Steam Input desativado** para o atalho do emulador (controle em "Gamepad"), passando o gamepad cru ao emulador, que faz o mapeamento.
2. **Usar o Steam Input** para mapear botões extras (traseiros, touchpads) e deixar o giroscópio com o emulador.

O caminho 1 é mais simples e evita conflito de giroscópio. O caminho 2 é mais poderoso, mas exige desativar a emulação de movimento no emulador para não duplicar.

```terminal
$ # Verifique se o Steam interceptou o controle
$ MANGOHUD=1 flatpak run org.yuzu_emu.yuzu
[   0.520] Input  <Warning>  Gamepad 0 reports 0 motion axes (Steam Input may be active)
```

A mensagem "0 motion axes" indica que o giroscópio não chegou ao emulador — o Steam o consumiu.

## Configurando por jogo os controles

Jogos diferentes pedem layouts diferentes. Um RPG de turno não usa o d-pad para movimento; um jogo de luta precisa do d-pad preciso. Use os perfis de controle específicos.

No Yuzu, além do mapeamento global, você pode criar um **Input Profile** por jogo em **Properties → Controls**. No Ryujinx, perfis de input são salvos por controlador.

:::exemplo
Você quer jogar *Super Smash Bros. Ultimate*, que depende de direcionais rápidos. Mapear o d-pad do Deck para o analógico esquerdo (entrada digital) evita diagonais acidentais e melhora a precisão dos comandos de movimento do Smash.
:::

## Resolvendo controles que somem ou duplicam

Problema clássico: o jogo registra dois inputs para cada apertar (o Steam manda o gamepad + o emulador também captura via SDL cru). Isso causa saltos duplos ou navegação pulando itens.

Correções:
1. Desative o Steam Input para o atalho (Gamepad template com todas as bindings zeradas)
2. No emulador, reduza para um único dispositivo de input (desmarque mouse/teclado se não usar)
3. Desconecte controles físicos extras que possam estar causando conflito

```terminal
$ # Liste os dispositivos que o emulador vê
$ flatpak run org.yuzu_emu.yuzu --config 2>&1 | grep -i input
```

## Resumo

- O layout do Deck mapeia quase 1:1 para o Pro Controller, com A/B e X/Y em posições físicas distintas.
- Giroscópio e acelerômetro são expostos via SDL e podem emular o CemuHook para jogos de movimento.
- O Steam Input pode "roubar" o giroscópio; a mensagem "0 motion axes" confirma o conflito.
- Perfis de controle por jogo resolvem casos como o d-pad do Smash.
- Input duplicado resolve-se desativando uma das duas camadas (Steam Input ou captura SDL crua).

## Exercícios

1. Mapeie os controles do Deck no Yuzu e jogue 10 minutos de um jogo 2D. A confirmação A/B está na posição correta?
2. Habilite o giroscópio e teste a mira por movimento em um jogo que a use (ex.: *Breath of the Wild*).
3. Crie um perfil de controle específico para um jogo de luta, mapeando o d-pad para o analógico.
4. Reproduza o problema de input duplicado e corrija-o desativando o Steam Input ou zerando o gamepad template.
5. **Desafio.** Use `evtest` no modo desktop para inspecionar os eventos brutos do giroscópio do Deck (device `accelerometer`). Identifique quais eixos reportam movimento quando você gira o aparelho.