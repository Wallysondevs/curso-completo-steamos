O controle do Steam Deck não é um gamepad comum: além dos botões e gatilhos, ele tem dois touchpads capacitivos, giroscópio e quatro botões traseiros. Fazer tudo isso falar a língua do Windows — que só entende XInput — é o que o SDTController resolve, e fazer **bem** exige um passeio pelas configurações.

:::objetivos
- Diferenciar o controle físico do controle virtual XInput
- Mapear botões, gatilhos e botões traseiros no SDTController
- Configurar os touchpads como mouse, joystick ou trackpad de câmera
- Ativar o giroscópio e definir sua sensibilidade
- Ajustar o perfil por jogo ou usar o modo XInput genérico

:::

## Físico versus virtual: a ponte que o SDT faz

O Windows enxerga o controle físico do Deck como um dispositivo HID com dezenas de botões, mas os jogos não sabem o que fazer com ele — esperam um gamepad XInput padrão, com os 14 botões e 2 analógicos que todo jogo conhece. O SDTController constrói essa ponte: lê o físico, aplica seu mapeamento e entrega um "Xbox 360 Controller" virtual ao sistema.

O resultado prático: para o jogo, você está usando um controle de Xbox. Para você, nada muda — exceto que agora os touchpads e o giroscópio também podem virar entrada, porque o SDT os converte em mouse, joystick ou teclas.

```terminal
$ # No PowerShell, o controle virtual aparece como:
$ Get-PnpDevice -Class HIDClass | Where-Object {$_.FriendlyName -like "*Xbox*"}
OK    Xbox 360 Controller for Windows  HID\VID_045E&PID_028E
```

Para que o jogo enxergue só o virtual, o físico precisa estar escondido — e é aí que o HidHide (instalado na seção anterior) atua:

## Mapeando botões, gatilhos e os quatro traseiros

A configuração básica do SDTController cobre o que todo jogo espera: `A/B/X/Y`, D-pad, analógicos, `L1/L2` e `R1/R2`. O que exige atenção são os **quatro botões traseiros** (`L4/L5/R4/R5`), que não têm equivalente no XInput padrão. No SDT você os mapeia para qualquer botão existente (como `Y` para alternar arma) ou para teclas do teclado.

Os gatilhos (`L2/R2`) podem ser analógicos (para acelerar de leve num jogo de corrida) ou digitais (resposta imediata em shooter). O SDTControl oferece um ajuste de **deadzone** (zona morta) e curva de resposta para os analógicos — vale reduzir o deadzone se você sente que o personagem "demora a virar".

:::dica
Para jogos que usam muito os botões traseiros, mapeie `L4`/`R4` como `L3`/`R3` (o clique dos analógicos). Clicar o analógico é ergonomicamente ruim no Deck; jogar esse clique para os botões traseiros elimina o desconforto sem perder a função.
:::

## Touchpads: mouse, joystick ou trackpad de câmera

Os dois touchpads são a maior diferença para um gamepad comum, e o SDT permite três modos por pad:

| Modo | Indicado para |
|---|---|
| Mouse | Jogos de estratégia, menus, navegar no desktop |
| Joystick | Emular o analógico direito em jogos que não suportam mouse |
| Trackpad de câmera | Giro suave e preciso, com inércia configurável |

O modo **Mouse** transforma o pad esquerdo em mouse + clique (toque = botão esquerdo), perfeito para jogos point-and-click ou para controlar o Windows no modo desktop. O modo **Joystick** faz o pad direito virar um analógico virtual, útil em jogos antigos. O **Trackpad de câmera** é o favorito em FPS: ele emula a câmera com precisão de mouse, mas reporta como joystick para o jogo.

```terminal
$ # Uma vez mapeado, o touchpad em modo mouse aparece como:
$ Get-PnpDevice -Class Mouse
OK    HID-compliant mouse  HID\VID_28DE&PID_1205
```

Para enumerar todos os dispositivos ocultos e ativos do controle de uma vez, o `Get-PnpDevice` filtra pelo VID da Valve:

```terminal
$ Get-PnpDevice -PresentOnly | Where-Object {$_.InstanceId -like "*VID_28DE*"}
OK    Steam Deck Controller        HID\VID_28DE&PID_1205&MI_00
OK    Xbox 360 Controller for Windows  HID\VID_045E&PID_028E
OK    HID-compliant mouse          HID\VID_28DE&PID_1205
```

Aqui aparecem, lado a lado, o controle físico (`Steam Deck Controller`, VID 28DE da Valve) e o virtual (`Xbox 360`, VID 045E da Microsoft). O HidHide esconde o primeiro do Windows para que só o segundo chegue ao jogo.

## Giroscópio: mira com o movimento do aparelho

O giroscópio é o recurso que diferencia o Deck de qualquer controle comum. Ativá-lo permite mirar inclinando o aparelho — a técnica que jogadores de Switch conhecem bem. No SDTController, o giro pode ser mapeado para o **mouse** (mirar solto) ou para o **analógico direito** (mirar dentro do jogo).

A configuração essencial é o **gyro always on** versus **ativado por gatilho**: deixar o giro sempre ligado causa deriva constante; ativá-lo só quando você segura `L2` (mirar) é o padrão preferido em shooters. Ajuste também a sensibilidade — giro alto demais vira sacolejo, baixo demais não vira nada.

:::atencao
O giroscópio em modo "analógico" tem um teto de velocidade imposto pelo próprio jogo (o analógico virtual tem um limite de deslocamento). Para mira rápida de verdade, mapeie o giro para **mouse**, não para analógico. Isso só funciona se o jogo aceitar entrada mista de controle + mouse ao mesmo tempo.
:::

## Perfis por jogo

O SDTController guarda a configuração num perfil global, mas permite amarrar mapeamentos específicos a executáveis. Assim, um FPS pode ter giro-atrelado-a-gatilho e touchpad como câmera, enquanto um RPG de turno usa touchpad como mouse e botões traseiros como atalhos.

Para jogos da Steam com suporte nativo a controle, o caminho inverso costuma ser melhor: desligue o SDTController para aquele título e deixe o Steam Input cuidar do mapeamento. A regra de bolso: **SDT fora da Steam, Steam Input dentro da Steam**.

## Resumo

- O SDTController traduz o controle físico para um "Xbox 360 Controller" virtual.
- Os quatro botões traseiros não têm equivalente XInput; mapeie-os manualmente.
- Os touchpads suportam modos Mouse, Joystick e Trackpad de câmera.
- O giroscópio funciona melhor mapeado para mouse e ativado por gatilho.
- Use SDT fora da Steam e Steam Input dentro da Steam para evitar duplo-input.

## Exercícios

1. Abra o SDTController e confirme, no PowerShell, que o "Xbox 360 Controller for Windows" aparece como dispositivo. Qual VID/PID ele reporta?
2. Mapeie `L4` e `R4` para `L3` e `R3`. Teste em qualquer jogo com clique de analógico e avalie o conforto.
3. Configure o touchpad direito em modo Mouse e tente navegar no desktop do Windows só com ele. O que o toque faz?
4. Ative o giroscópio vinculado ao gatilho `L2` em modo mouse. Teste num FPS gratuito e ajuste a sensibilidade até sentir controle.
5. **Desafio.** Crie dois perfis no SDTController (um para FPS, outro para RPG de turno) e configure-os para ativar automaticamente por executável. Documente como o SDT detecta o jogo em execução.