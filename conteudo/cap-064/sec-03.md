O Steam Deck é o cliente ideal do Remote Play: já vem com o cliente Steam completo, os controles são detectados como um gamepad virtual unificado, e a Valve cuidou para que o streaming seja acessível com dois toques. Mas o modo desktop do Deck — um ambiente KDE Plasma completo — adiciona uma camada que merece cuidados próprios, especialmente porque o usuário `deck` roda num sistema imutável que protege o `/usr` de modificações.

:::objetivos
- Conectar o Deck ao PC hospedeiro pela primeira vez e parear os dois dispositivos
- Diferenciar o modo de jogo (gamescope) do modo desktop e suas implicações no streaming
- Configurar os controles do Deck como entrada unificada para o jogo hospedado
- Entender o papel do `uinput` e por que o gamepad virtual funciona sem drivers extras
- Ajustar preferências do cliente que afetam a experiência (HDR, taxa, audio)
:::

## Primeira conexão e pareamento

Com o PC hospedeiro já configurado (seção 2), ligue o Deck no **modo de jogo** (gamescope) e aguarde a biblioteca carregar. Jogos que estão instalados apenas no PC aparecem na sua lista do Deck com um indicador de transmissão — normalmente um ícone de seta/ondas ou o texto "Stream" no lugar do botão "Instalar".

```terminal
$ flatpak list | grep -i steam
Steam	com.valvesoftware.Steam	stable	system
$ ps aux | grep -i gamescope
deck      1204  0.3  1.1 1847568 174564 ?  Ssl  15:02   0:01 /usr/bin/gamescope --nested-mode ...
```

A linha do `gamescope` revela o compositor do modo de jogo. O Remote Play no modo de jogo roda como uma composição do cliente Steam embutido, sem expor o desktop KDE. Isso é o que garante a latência baixa e o comportamento de console: o gamepad virtual é injetado direto pelo `uinput`, sem camada de tradução.

| Passo | Onde | O que fazer |
|---|---|---|
| 1 | PC | Deixar o jogo desejado instalado e o Steam logado |
| 2 | Deck | Abrir o jogo na biblioteca e escolher **Transmitir** em vez de baixar |
| 3 | Deck | Aguardar o Steam localizar o PC e iniciar a sessão |
| 4 | Deck | Validar que o indicador de stream aparece no jogo aberto |

:::nota
O primeiro pareamento pode pedir um código de 4 dígitos exibido no PC. Esse código é uma autenticação de dispositivos, não de rede — ele grava a confiança entre os dois clientes Steam na sua conta. Depois de pareados, as conexões seguintes são automáticas.
:::

## Modo de jogo versus modo desktop

O mesmo streaming funciona nos dois modos, mas com diferenças reais de experiência:

**Modo de jogo (gamescope).** Interface de console, teclas e botões mapeados, HDR nativo no modelo OLED, e o stream ocupa a tela inteira com o mínimo de sobrecarga. É o caminho recomendado para 99% dos casos.

**Modo desktop (KDE).** Você tem acesso ao Steam desktop completo e pode, por exemplo, ajustar o tunelamento de rede ou rodar o `flatpak` para instalar ferramentas. Mas o gamepad do Deck vira mouse/teclado (mapping padrão do KDE), e é preciso segurar o botão Steam enquanto mexe nos trackpads. O streaming em si funciona igual, porém sem o polimento de console.

```terminal
$ steamdeck --switch-to-desktop
$ # (de volta ao modo de jogo)
$ steamdeck --switch-to-gamemode
```

Esses comandos alternam o Deck entre os dois modos sem reiniciar. Em sistemas que não têm o wrapper `steamdeck`, use `qdbus org.kde.Shutdown /Shutdown logout` no desktop para voltar à interface de sessão e relogar no modo de jogo.

:::atencao
No modo desktop, some a sobreposição do Remote Play (o botão para abrir o menu de sessão) pode ficar escondida atrás de janelas. Se o jogo streamado "travar" sem responder, mova o mouse para o canto superior da tela — é onde a barra de controles do streaming costuma aparecer no desktop.
:::

## Os controles como entrada unificada

O ponto alto do Remote Play no Deck é que o jogo hospedado no PC recebe um **gamepad virtual completo**. Isso acontece porque o Steam injeta os eventos de entrada através do `uinput`, um módulo do kernel Linux que permite criar dispositivos de entrada virtuais em software. Os botões, analógicos, giroscópio, touchpads e os botões traseiros do Deck são todos empacotados e enviados ao hospedeiro como um único controle.

```terminal
$ lsmod | grep uinput
uinput                 20480  1
$ ls /dev/uinput
/dev/uinput
```

Com o `uinput` carregado e o device node presente, o Steam consegue criar o gamepad virtual. No SteamOS esse módulo já vem carregado por padrão; no modo desktop de outras distros, pode ser necessário `modprobe uinput` — embora no Deck isso seja raramente um problema.

:::dica
Quer usar o Deck como controle *físico* para o PC (sem transmitir o vídeo para a telinha)? O Remote Play também encaminha a entrada. Basta minimizar o stream no hospedeiro e jogar olhando para o monitor do PC, usando o Deck puramente como controle sem fio de baixa latência.
:::

## Preferências do cliente no Deck

No Deck, acesse **Configurações → Remote Play** (no modo desktop) ou o menu rápido do jogo streamado (botão **...**) para ajustar:

- **Habilitar transmissão de áudio** — envia o som do PC para o Deck. Ligado por padrão.
- **Transmitir microfone** — encaminha o microfone do chat para o PC. Útil em multiplayer.
- **Qualidade do vídeo** — Automática, Rápida, Equilibrada ou Bonita. A "Automática" usa o *dynamic bitrate* do hospedeiro; as demais fixam um teto.
- **Prioridade de entrada** — em sessões onde há jitter, priorizar "Entrada" reduz o atraso do controle ao custo de um possível corte de frame.

```terminal
$ grep -i "remote" ~/.steam/steam/config/config.vdf | head -5
	"StreamingClient"		"1"
	"AllowCompleteScreen"		"1"
```

O arquivo `config.vdf` do Steam guarda configurações locais; o trecho acima apenas ilustra onde ficam as chaves de streaming. Não edite esse arquivo à mão — use sempre a interface para evitar corromper a configuração.

## Resumo

- O Deck detecta jogos do PC como "Stream" na biblioteca; a primeira conexão pode pedir um código de pareamento de 4 dígitos.
- O modo de jogo (gamescope) entrega a melhor experiência de streaming; o modo desktop expõe o KDE mas sem o polimento de console.
- Os controles do Deck viram um gamepad virtual via módulo `uinput`, enviado integralmente ao hospedeiro.
- HDR e 90 Hz só fazem diferença real no modelo OLED; no LCD o stream é 60 Hz SDR.
- O menu rápido (botão `...`) permite alternar qualidade de vídeo, áudio, microfone e prioridade de entrada durante a sessão.

## Exercícios

1. No Deck, abra um jogo instalado só no PC e confirme que a opção é **Transmitir** (não baixar). Quanto tempo leva da confirmação até a imagem aparecer?
2. Pareie os dois dispositivos e, depois, verifique que a segunda conexão já não pede código.
3. Compare a mesma sessão no modo de jogo e no modo desktop. Onde a sobreposição do Remote Play aparece em cada um?
4. Confirme o `uinput` carregado com `lsmod | grep uinput` e `ls /dev/uinput` no modo desktop.
5. **Desafio.** Use o Deck como controle físico para o PC: inicie o stream, mas jogue olhando para o monitor do PC. Meça se a latência de entrada percebida melhora em relação a jogar no Deck com a tela dele como saída.