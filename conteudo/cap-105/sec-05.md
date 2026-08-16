Os controles são a diferença entre o Steam Deck e um notebook comum. Quando um analógico começa a "andar sozinho" (drift), um botão para de responder ou o touchpad fica errático, a experiência de jogo desmorona na hora. Esta seção cobre o que dá para resolver por software — e o que inevitavelmente exige troca de peça.

Uma distinção importante logo de saída: o Steam Deck tem dois caminhos de input. Os controles físicos **nativos** (sticks, botões de face, D-pad) chegam ao kernel como eventos via `evtest`. Mas os **botões traseiros** (`L4`/`L5`/`R4`/`R5`) e os **touchpads** só funcionam através do Steam Input — no Modo Desktop sem o Steam rodando, eles ficam mudos. Saber qual caminho está quebrado diz se o problema é driver, firmware ou hardware.

:::objetivos
- Distinguir drift (problema físico do stick) de má calibração (problema de software)
- Usar `evtest` para confirmar qual botão ou eixo está emitindo evento errado
- Ajustar zonas mortas e curvas de resposta no Steam Input
- Saber quando um controle externo (Bluetooth/USB) é a causa, não o Deck
- Identificar quando a solução é trocar o analógico (hardware) em vez de configurar
:::

## Tabela de controles

| Sintoma | Causa provável | Solução |
|---|---|---|
| Analógico "anda sozinho" (drift) | Desgaste do potenciômetro, sujeira, eixo gasto | Aumente a zona morta no Steam Input; limpe com ar comprimido; se > 20% de drift, troque o analógico |
| Drift só em certos jogos | Jogo tem zona morta mínima ou usa eixo sem filtro | Ajuste a zona morta no layout específico daquele jogo (Steam Input → Joystick) |
| Botão não responde (um só) | Membrana gasta, sujeira no contato, botão traseiro mapeado errado | `evtest` confirma se o evento some; reconfigure o Steam Input; troque a peça se não emitir evento |
| Touchpad não responde no Desktop | Steam não está rodando, perfil de Desktop errado | Garanta o Steam aberto; cheque o layout "Desktop" no Steam Input |
| Touchpad errático (cursor pula) | Sensibilidade alta, toque acidental, firmware | Ajuste sensibilidade/haptic no Steam Input; calibre; atualize firmware |
| Giroscópio não funciona | Gyro desligado no layout, sem gatilho de ativação | Ligue Gyro no Steam Input e defina o botão de ativação (ex.: tocar no stick direito) |
| Controle externo não conecta | Pareamento expirado, cabo ruim, conflito de inputs | Refazer pareamento (veja seção 2); teste outro cabo/porta USB-C |
| Todos os botões do jogo ignorados mas desktop ok | Jogo capturou input de outro dispositivo, layout errado | Cheque a ordem dos dispositivos no Steam Input; force o gamepad correto |
| Vibração/haptic parou de funcionar | Serviço de haptic pausado, bateria fraca do controle | Teste `fftest`; verifique configuração de vibração no Steam Input |

## Confirmando o drift com evtest

Antes de trocar peça, confirme que o problema é mesmo físico. O `evtest` mostra os valores crus de cada eixo do analógico — o valor de repouso deveria ser ~0 (ou o centro, no caso de eixos absolutos), e o drift aparece como um desvio constante desse repouso.

```terminal
$ sudo evtest
No device specified, trying to scan all of /dev/input/event*
Available devices:
/dev/input/event5:  Valve Software Steam Deck
Select the device event number [0-10]: 5
...
Event: time ..., type 3 (EV_ABS), code 0 (ABS_X), value 32768
```

Para um stick que em repouso deveria reportar o centro (tipicamente 32768 num range 0–65535), um valor estável em 33500 ou 32000 indica drift: o stick "descansou" fora do centro físico. Se o valor **oscila** muito mesmo parado, é sujeira ou potenciômetro gasto.

```terminal
# Uma leitura rápida do eixo absoluto também vem por sysfs (varia por modelo):
$ cat /sys/class/input/js*/device/../device/properties
```

A regra prática:

- **Drift constante e pequeno** (< 5–8% do range) → resolva com zona morta.
- **Drift que piora com o tempo ou oscila** → limpeza ou troca de potenciômetro.
- **Eixo morto (não muda o valor ao mover)** → cabo interno solto ou potenciômetro quebrado; troca de peça.

:::dica
O ajuste de zona morta no SteamOS fica em **Steam → Configurações → Controle → Calibração**, ou por jogo em **Steam Input → Editar Layout → Joystick → Zona morta**. Uma zona morta de 8–12% neutraliza drift leve sem prejudicar a resposta; acima disso o controle já fica "borrachudo".
:::

## Botões que não respondem: separando software de hardware

Um botão que "morreu" pode ser qualquer coisa entre um mapeamento apagado e uma membrana fisicamente gasta. O `evtest` é o árbitro: se o botão **emite evento** quando você pressiona, o problema é software (mapeamento); se **não emite nada**, é hardware.

```terminal
$ sudo evtest /dev/input/event5
...
Event: time ..., type 1 (EV_KEY), code 304 (BTN_SOUTH), value 1   # A pressionado
Event: time ..., type 1 (EV_KEY), code 304 (BTN_SOUTH), value 0   # A solto
```

No exemplo, o botão `BTN_SOUTH` (o `A` do gamepad) responde com `value 1` (pressionado) e `value 0` (solto). Se você pressiona fisicamente e o `evtest` não mostra nenhuma linha, o contato físico está comprometido.

Os botões traseiros, como já avisado, **não aparecem no `evtest`** — eles são processados pelo firmware do controlador Steam e só chegam ao userspace via Steam Input:

```
:::atencao
Se você está em Modo Desktop sem o Steam aberto, `L4`/`L5`/`R4`/`R5` e os touchpads **não funcionam por padrão**. Antes de concluir que estão quebrados, abra o Steam. Muitos "defeitos" de botão traseiro são, na verdade, o Steam fechado.
```

## O touchpad errático

O touchpad do Deck é sensível à pressão e tem feedback háptico — duas variáveis que amplificam a percepção de "errático" quando mal configuradas. Três ajustes costumam resolver:

1. **Sensibilidade** — o touchpad rastreia o dedo por capacitância; sensibilidade alta demais faz o cursor pular em toques leves acidentais. Reduza em Steam Input → Touchpad.
2. **Feed háptico** — o "clique" tátil dispara em cada pressão; se está muito sensível, o pad parece ter vida própria. Ajuste a força do clique.
3. **Zona morta do toque** — dá para definir uma área de borda onde o toque não conta, evitando ativações acidentais com a palma.

Se o cursor **trava e pula** em intervalos regulares (não é sensibilidade, é padrão), suspeite de interferência de rádio (o touchpad compartilha controlador com o Wi-Fi em alguns modelos) — afaste o Deck de fontes de 2.4 GHz e teste de novo.

```terminal
# Listar dispositivos de input e seus nomes (para achar o touchpad correto):
$ sudo libinput list-devices | grep -A8 'Valve\|Touchpad'
```

## Controle externo e conflito de dispositivos

Quando você conecta um controle externo (Xbox, DualSense, 8BitDo), o Steam trata cada um como um dispositivo de input separado. Um jogo pode ficar "confuso" se o layout errado for atribuído ao controle errado.

```terminal
# Listar gamepads vistos pelo kernel:
$ ls /dev/input/js*
/dev/input/js0  /dev/input/js1
```

Cada `js*` é um gamepad. O Steam Input permite reordenar a prioridade dos dispositivos (qual é o "jogador 1"). Se um jogo ignora o controle novo e obedece o embutido, provavelmente o embutido ainda é o primário:

1. Abra **Steam → Configurações → Controle**.
2. Em **Ordem dos controles**, mova o externo para cima.
3. Ou desligue o controle embutido no layout (Steam Input → layout do jogo → desativar gamepad interno).

:::nota
Referências aprofundadas: Steam Input e layouts (cap. 14–15), giroscópio e touchpads no hardware (cap. 1), Bluetooth/pareamento (cap. 26), e troca física de analógicos (cap. 84).
:::

## Resumo

- Drift pequeno e constante → zona morta; drift que cresce/oscila → limpeza ou troca do potenciômetro.
- O `evtest` é o árbitro definitivo: emite evento = software (mapeamento); não emite = hardware.
- Botões traseiros e touchpads não geram eventos crus no kernel — dependem do Steam Input e do Steam rodando.
- Touchpad "errático" geralmente é sensibilidade/háptico/zona de toque mal ajustados, não defeito.
- Conflito de controles vem de ordem de prioridade errada no Steam Input, não de hardware.

## Exercícios

1. Execute `sudo evtest` e selecione o dispositivo do Deck. Movimente o analógico esquerdo e observe os valores de raio (`ABS_X`/`ABS_Y`) em repouso. Há drift? Qual o valor de centro exibido?
2. Pressione cada botão de face no `evtest` e anote o `code` (BTN_SOUTH, BTN_WEST etc.). Pressione agora `L4` e `R4` — eles geram eventos? Explique o resultado.
3. Ajuste a zona morta do analógico esquerdo para 5%, depois para 15%, e jogue algo que exija precisão. Qual degradou mais a resposta?
4. Conecte um controle externo e execute `ls /dev/input/js*` antes e depois. Quantos gamepads o kernel viu? Qual é o primário no Steam Input?
5. **Desafio.** Consulte o capítulo de troca de analógicos e identifique, no seu modelo (LCD ou OLED), o procedimento correto para substituir o stick. Você não precisa executar a troca — apenas documente os passos, as ferramentas e o risco (ex.: fita da bateria, conectores frágeis).