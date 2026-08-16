Nem toda acessibilidade é visual ou auditiva. Para muita gente com mobilidade reduzida, a barreira está em apertar botões físicos — seja a força necessária, seja a posição dos controles, seja a necessidade de pressionar dois botões ao mesmo tempo. O SteamOS trata isso com o **Steam Input**, um sistema de remapeamento profundo que permite recolocar qualquer ação em qualquer botão, além de suportar **controles adaptativos** externos como o Xbox Adaptive Controller. Esta é a seção mais poderosa para quem precisa de entrada sob medida.

:::objetivos
- Compreender o papel do Steam Input no remapeamento de botões
- Configurar controles adaptativos como o Xbox Adaptive Controller
- Ativar toggles para manter pressionamento sem segurar
- Mexer em repetição e tempo de pressionamento de tecla
- Permitir acessibilidade no jogo com ajuste de zonas mortas e gatilhos
:::

## Steam Input: a camada de tradução de botões

O Steam Input é a tecnologia da Valve que fica **entre** o controle físico e o jogo. Ele recebe os sinais brutos do gamepad (ou teclado, ou controle adaptativo) e os traduz conforme um **perfil de configuração**. Isso significa que o jogo não precisa saber qual botão você apertou — ele recebe o comando já mapeado.

A consequência para acessibilidade é enorme: você pode dizer "o botão A do jogo agora é o gatilho esquerdo do meu controle", ou "o pressionar X faz o mesmo que o botão traseiro L4". O jogo nem precisa oferecer opções de remapeamento — o Steam Input resolve por baixo.

O perfil de configuração por controle vive na pasta do Steam, em `~/.local/share/Steam/controller_config/`. Você pode listar os perfis que já criou:

```terminal
$ ls ~/.local/share/Steam/controller_config/
personalization		vdf
```

O conteúdo em `vdf` são os arquivos de perfil serializados. A presença desses diretórios confirma que o Steam Input está ativo na sua instalação. A edição desses arquivos à mão é desencorajada — o caminho correto é a interface gráfica de configuração de entrada no Modo Jogo.

## Controles adaptativos: hardware externo

O SteamOS reconhece controllers por USB ou Bluetooth pelo padrão *HID*. O **Xbox Adaptive Controller** (XAC), da Microsoft, é um hub com entradas para interruptores (switches) e sensores que pessoas com mobilidade reduzida operam com pés, cabeça ou boca. Ele aparece para o SteamOS como um gamepad comum — e, com o Steam Input, todos os seus inputs podem ser remapeados.

Para confirmar que um controle adaptativo foi detectado, o kernel registra o evento de conexão USB no `dmesg`:

```terminal
$ dmesg | grep -i "xinput\|hid\|xbox\|adaptive" | tail -6
[  214.441088] usb 3-2: new full-speed USB device number 6 using xhci_hcd
[  214.620412] usb 3-2: New USB device found, idVendor=045e, idProduct=0b0a
[  214.620416] usb 3-2: New USB device strings: Mfr=1, Product=2, SerialNumber=3
[  214.620418] usb 3-2: Product: XBOX Adaptive Controller
[  214.648201] input: Generic X-Box pad as /devices/pci0000:00/0000:00:14.0/usb3/3-2/3-2:1.0/input/input31
```

A linha `Product: XBOX Adaptive Controller` é a confirmação. O `idVendor=045e` é o identificador da Microsoft. Uma vez registrado como `input31`, o dispositivo fica disponível para o Steam Input e para qualquer ferramenta de teste.

## Toggles e "mantém pressionado" sem segurar

Um dos recursos mais transformadores para acessibilidade motora é o **toggle** (alternância). Normalmente, para correr num jogo você segura um botão continuamente. Com o toggle ativado no Steam Input, um único toque liga o "pressionar" e outro toque desliga. Isso elimina a necessidade de sustentar força por longos períodos.

A configuração fica nas opções avançadas de cada botão no editor de perfil do Steam Input: **Configuração do Botão → Ativar alternância (Toggle)**. Para teclas do teclado físico no desktop, a repetição e o *delay* de pressionamento são controlados por `gsettings`:

```terminal
$ gsettings get org.gnome.desktop.peripherals.keyboard repeat
true
$ gsettings get org.gnome.desktop.peripherals.keyboard repeat-interval
30
$ gsettings get org.gnome.desktop.peripherals.keyboard delay
500
```

O `repeat-interval 30` é o intervalo em milissegundos entre repetições de uma tecla mantida pressionada; o `delay 500` é o tempo (ms) que a tecla precisa ser segurada antes de começar a repetir. Aumentar o `delay` evita acionamentos acidentais para quem tem tremores; reduzir o `repeat-interval` ajuda quem tem movimentos lentos a preencher texto.

:::nota
Os ajustes de `gsettings` para teclado afetam o **desktop** e aplicações GTK, não os toggles do Steam Input, que são por-controle e por-botão no Modo Jogo. São duas camadas distintas de "repetição", e é útil saber qual delas um determinado cenário exige.
:::

## Zonas mortas e curso dos gatilhos

Para quem tem controle motor fino limitado, os analógicos são os mais difíceis: a **zona morta** (deadzone) é a região central pequena onde o movimento é ignorado, e um analógico muito sensível dispara ações involuntárias. O Steam Input permite alargar a zona morta de cada analógico e reduzir a sensibilidade dos gatilhos analógicos (L2/R2).

Na interface do editor de perfil, em **Analógicos → Zona morta**, você define a porcentagem do curso central que será ignorada. Um valor alto dá mais "folga" antes de qualquer registro; um valor baixo deixa o controle mais responsivo. Não há um valor único correto — depende da amplitude de movimento e da firmeza de quem joga.

:::dica
Comece com a zona morta em torno de 20–30% e ajuste para baixo conforme o jogador ganha confiança. O gatilho é um processo de calibração iterativa, e o Steam Input mostra um gráfico em tempo real do movimento do analógico — use esse gráfico para ver se o repouso da mão já dispara leituras.
:::

## Botões físicos do deck como atalhos de acessibilidade

O próprio Steam Deck tem **botões traseiros** (L4, L5, R4, R5) que, por padrão, são espelhos de outros botões. No Steam Input, você pode atribuir funções dedicadas — inclusive macros de acessibilidade, como alternar o toggle de correr ou ativar um menu radial de comandos.

A ideia é simples: em vez de mover o polegar por toda a superfície, concentre as ações essenciais nos botões traseiros, que exigem menos deslocamento. Um perfil bem desenhado transforma o deck num controle adaptativo por si só.

## Resumo

- O Steam Input traduz sinais do controle para o jogo através de um perfil de remapeamento.
- O Xbox Adaptive Controller aparece no kernel como um pad HID (`idVendor=045e`) e é totalmente remapeável.
- O toggle (alternância) elimina a necessidade de manter botões pressionados por longos períodos.
- `gsettings` controla repetição e delay de teclado no desktop; o Steam Input controla toggles por botão no Modo Jogo.
- Zonas mortas altas e gatilhos menos sensíveis ajudam quem tem controle motor fino limitado.

## Exercícios

1. Conecte um controle (ou o Xbox Adaptive Controller) e confirme a detecção com `dmesg | grep -iE "hid|xbox|adaptive"`.
2. No editor de perfil do Steam Input, remapeie uma ação do jogo para o botão traseiro L4 e teste no jogo.
3. Ative o toggle no botão de correr/andar e confirme que um único toque alterna a ação sem segurar.
4. Liste `ls ~/.local/share/Steam/controller_config/` e explique o que a existência de `vdf` indica sobre seus perfis.
5. **Desafio.** Configure um perfil completo para mobilidade reduzida: três ações essenciais nos botões traseiros, toggle em correr, zona morta em 30% nos dois analógicos. Documente cada decisão e justifique por que ela reduz a carga motora.