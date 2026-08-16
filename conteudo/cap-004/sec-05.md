Conectividade é um daqueles componentes que ninguém lembra até faltar. No caso do Steam Deck, a diferença entre as gerações nesse quesito é enorme: o LCD saiu com Wi-Fi 5, o OLED saltou para Wi-Fi 6E e Bluetooth atualizado. Para quem baixa muitos jogos, faz streaming local ou joga online, essa mudança pode valer mais que a tela nova — e a forma de descobrir qual rádio está no seu aparelho é puro terminal.

Nesta seção você aprende a identificar e inspecionar o hardware de rede, o modem Wi-Fi e o Bluetooth do seu Steam Deck.

:::objetivos
- Comparar Wi-Fi 5 (LCD) e Wi-Fi 6E (OLED) em geração, bandas e velocidade
- Identificar o chip de rede com `lspci` e o `inxi`
- Associar o padrão (802.11ac vs 802.11ax) ao modelo do aparelho
- Ver o estado da conexão e a banda em uso por linha de comando
- Entender o papel do Bluetooth e dos codecs de áudio no uso portátil
:::

## Wi-Fi 5 contra Wi-Fi 6E, em números

O Steam Deck LCD usa um controlador **Realtek RTL8822CE**, que opera no padrão **802.11ac**, popularmente chamado **Wi-Fi 5**. Ele trabalha nas bandas de 2,4 GHz e 5 GHz, com taxas teóricas que, em condições ideais, ficam na casa de até 867 Mbps na banda de 5 GHz.

O OLED trocou o rádio por uma solução **Wi-Fi 6E** (padrão **802.11ax** com a banda estendida de 6 GHz). O Wi-Fi 6E traz três ganhos práticos: o 802.11ax é mais eficiente em ambientes com muitos dispositivos (por causa do OFDMA e do MU-MIMO), e a banda de 6 GHz adiciona canais novos, menos congestionados — útil em apartamentos lotados de redes vizinhas.

Há um porém importante e pouco comentado: para aproveitar o Wi-Fi 6E, o roteador também precisa suportá-lo. Na maioria das casas com roteador apenas Wi-Fi 5, o OLED opera em modo compatível (5 GHz), e o ganho real se limita ao rádio melhor — o que já ajuda, mas não entrega o 6 GHz prometido.

:::nota
Wi-Fi 6E é o Wi-Fi 6 (802.11ax) operando também na faixa de 6 GHz. O "E" de "Extended" se refere exatamente a essa banda adicional. Os nomes de marketing (Wi-Fi 5, 6, 6E) foram adotados pela Wi-Fi Alliance para substituir as siglas técnicas 802.11ac/ax, mas no Linux os drivers e o `lspci` ainda usam as siglas antigas — por isso as duas nomenclaturas convivem nesta seção.
:::

## Descobrindo o chip de rede

Assim como a GPU, o controlador de rede é um dispositivo PCI (ou USB) que o kernel enumera e o `lspci` lista. O comando chave é:

```terminal
$ lspci | grep -iE 'network|wireless|wifi|ethernet'
01:00.0 Network controller: Realtek Semiconductor Co., Ltd. RTL8822CE 802.11ac PCIe Wireless Network Adapter
```

A linha revela o fabricante (Realtek), o modelo do chip (`RTL8822CE`) e o padrão de rede (`802.11ac`). É essa última parte que identifica o aparelho: `802.11ac` é Wi-Fi 5 (LCD), enquanto um OLED apareceria com `802.11ax` (Wi-Fi 6E). O controlador também ganha uma linha própria no `inxi`, que já vimos na abertura:

```terminal
$ inxi -N
Network:   Device-1: Realtek RTL8822CE 802.11ac PCIe Adapter driver: rtw88_8822ce
```

Aqui aparece ainda o nome do **driver** em uso: `rtw88_8822ce`, o driver da Realtek embarcado no kernel do SteamOS. O driver é a peça de software que faz o kernel falar com o hardware, e vale anotar o nome porque problemas de Wi-Fi costumam ser diagnosticados olhando exatamente para ele.

Para ver o dispositivo com mais detalhe, incluindo largura do link PCI e versão da interface, use `lspci -v`:

```terminal
$ lspci -v -s 01:00.0
01:00.0 Network controller: Realtek Semiconductor Co., Ltd. RTL8822CE 802.11ac PCIe Wireless Network Adapter
	Subsystem: Realtek Semiconductor Co., Ltd. Device c822
	Flags: bus master, fast devsel, latency 0, IRQ 70
	Memory at 80100000 (64-bit, non-prefetchable) [size=1M]
	Capabilities: [40] Power Management version 3
	...
	Kernel driver in use: rtw88_8822ce
	Kernel modules: rtw88_8822ce
```

A linha `Kernel driver in use` confirma o driver ativo. Se um dia o Wi-Fi sumir após uma atualização, é aqui que você confere se o kernel conseguiu carregar o módulo correto.

:::dica
Para listar todos os dispositivos de rede de uma vez, sem filtro, prefira `lspci -k | grep -A3 -i network`. O `-k` mostra o driver associado a cada dispositivo, o que já adianta o diagnóstico de "Wi-Fi não aparece".
:::

## O estado da conexão e a banda em uso

Ter um chip Wi-Fi 6E não significa estar conectado em 6 GHz — a banda efetiva depende do ponto de acesso. Para ver onde o aparelho está conectado, o SteamOS usa o NetworkManager, e a ferramenta de linha de comando para perguntar a ele é o `nmcli`:

```terminal
$ nmcli device wifi list
IN-USE  BSSID              SSID              MODE   CHAN  RATE        SIGNAL  BARS  SECURITY
*       3C:37:86:0A:B1:C4  casa-de-ana       Infra  36    866 Mbit/s  68      ▂▄▆_  WPA2
        3C:37:86:0A:B1:C4  casa-de-ana       Infra  36    866 Mbit/s  45      ▂▄__  WPA2
        50:C7:BF:11:22:33  vizinho-2.4G      Infra  6     144 Mbit/s  90      ▂▄▆█  WPA2
```

A coluna `RATE` mostra a taxa negociada (866 Mbit/s no 5 GHz), e `CHAN` o canal — canais abaixo de 14 estão em 2,4 GHz, os demais em 5 GHz (e, num roteador 6E, os canais de 6 GHz aparecem numerados a partir de 1 com a letra correspondente no padrão). O `SIGNAL` é a intensidade em percentual, útil para diagnosticar distância ou interferência.

Para confirmar a conexão atual resumida:

```terminal
$ nmcli -f GENERAL.DEVICE,GENERAL.STATE,GENERAL.CONNECTION device show wlan0
GENERAL.DEVICE:                         wlan0
GENERAL.STATE:                          100 (connected)
GENERAL.CONNECTION:                     casa-de-ana
```

A interface Wi-Fi no Steam Deck costuma se chamar `wlan0` (o sistema usa nomes tradicionais, não os nomes "predictable" do systemd). O estado `100 (connected)` e o nome da conexão confirmam que está ligado.

:::atencao
O nome da interface de rede pode variar (`wlan0`, `wlp2s0`, etc.) entre instalações e kernels. Descubra o nome exato com `nmcli device status` ou `ip link`, e use esse nome nos comandos `nmcli device show` daqui em diante. Escrever `wlan0` de cabeça é a causa mais comum de "comando não retorna nada".
:::

## Bluetooth e o que ele agrega

O Bluetooth do Steam Deck serve, na prática, para duas coisas: conectar fones sem fio e, eventualmente, um controle externo. O LCD traz um rádio Bluetooth 5.0 embutido no mesmo módulo Realtek; o OLED subiu para uma revisão mais nova do rádio Bluetooth (5.3 em boa parte das unidades), o que melhora a estabilidade e o consumo em fones modernos.

Para ver o adaptador Bluetooth, o `hciconfig` (do pacote `bluez`) é o caminho clássico:

```terminal
$ hciconfig -a
hci0:	Type: Primary  Bus: USB
	BD Address: A4:5E:60:11:22:33  ACL MTU: 1021:6  SCO MTU: 255:12
	UP RUNNING
	RX bytes:316020 acl:0 sco:0 events:3026 errors:0
	TX bytes:4120966 acl:0 sco:0 commands:1873 errors:0
	Features: 0xff 0xff ...
	...
	LMP Version: 5.1 (0xa)  Subversion: 0x8822
```

A linha `LMP Version` informa a versão do Link Manager Protocol, que indica a versão do Bluetooth suportada (aqui 5.1). O endereço `BD Address` identifica o rádio, e o `Bus: USB` revela um detalhe: no Steam Deck o Bluetooth é exposto como dispositivo USB interno, mesmo estando fisicamente no mesmo chip do Wi-Fi.

Um ponto de dor conhecido no Steam Deck é a latência de áudio do Bluetooth — como o aparelho é usado para jogar, atraso entre o som e a imagem importa. O Bluetooth usa codecs (SBC, AAC, aptX, LDAC) cuja latência varia, e jogos são sensíveis a isso. O SteamOS gerencia o pareamento pela interface, mas o diagnóstico do codec negociado aparece no `bluetoothctl` quando você inspeciona o dispositivo conectado.

:::info
O codec de áudio Bluetooth negociado depende tanto do aparelho quanto dos fones. O SBC (obrigatório em todos os dispositivos) tem a maior latência, enquanto codecs como aptX Low Latency reduzem o atraso. Para jogos de ritmo, fones com baixa latência ou áudio cabeado continuam sendo a escolha mais segura — limitação de todas as plataformas portáteis, não só do Steam Deck.
:::

## Resumo

- LCD usa Realtek RTL8822CE com Wi-Fi 5 (802.11ac) em 2,4/5 GHz; OLED usa Wi-Fi 6E (802.11ax) com banda extra de 6 GHz.
- `lspci | grep -i network` revela o chip e o padrão; `inxi -N` acrescenta o driver (`rtw88_8822ce`).
- O padrão do chip (`802.11ac` vs `802.11ax`) identifica a geração do aparelho por linha de comando.
- Wi-Fi 6E exige roteador compatível; senão o OLED cai para 5 GHz em modo compatível.
- `nmcli device wifi list` mostra rede, canal, taxa, sinal e segurança; `nmcli device show` confirma o estado da conexão.
- Bluetooth é exposto como USB interno; a versão aparece no `hciconfig -a` (`LMP Version`) e a latência de áudio varia por codec.

## Exercícios

1. Rode `lspci | grep -iE 'network|wireless'` e identifique o chip, o padrão (802.11ac/ax) e, com isso, a geração do seu Steam Deck.
2. Confirme o nome do driver com `lspci -k | grep -A3 -i network` e anote-o.
3. Execute `nmcli device wifi list` e diga em qual banda e canal você está conectado, qual a taxa negociada e o sinal.
4. Descubra o nome da interface com `nmcli device status` e rode `nmcli device show <interface>` resumindo o estado.
5. **Desafio.** Combine `lspci`, `inxi -N` e `hciconfig -a` num mini-relatório de conectividade: determine se a unidade é LCD ou OLED pelo rádio Wi-Fi, registre a versão do Bluetooth e relacione com o que aprendeu na abertura (identificação por bateria). O padrão Wi-Fi e a capacidade de bateria concordam?
