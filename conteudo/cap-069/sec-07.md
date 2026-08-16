Antes de consertar qualquer enlace, você precisa ler o estado real da interface de rede — não o que o menu do sistema promete. Dois comandos fazem esse trabalho no SteamOS: `ip addr` mostra o endereçamento e o estado do link, e `ethtool` fala direto com o hardware para expor velocidade, duplex e estatísticas da camada física. Juntos, eles respondem "essa interface está saudável e negociou a velocidade certa?".

:::objetivos
- Ler endereçamento e estado de link com `ip addr`
- Usar `ethtool` para inspecionar velocidade, duplex e driver da Ethernet
- Detectar desnegociação de velocidade e erros de quadro
- Interpretar as estatísticas físicas para diagnosticar cabos e docks
:::

## Lendo o estado com `ip addr`

O `ip addr` substituiu o antigo `ifconfig` e é a fonte canônica do endereçamento IP no Linux moderno. A saída é organizada por interface, cada uma com uma lista de atributos e de endereços atribuídos.

```terminal
$ ip addr show eth0
2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP group default qlen 1000
    link/ether 3c:7c:3f:8a:11:2b brd ff:ff:ff:ff:ff:ff
    inet 192.168.1.20/24 brd 192.168.1.255 scope global dynamic noprefixroute eth0
       valid_lft 8560sec preferred_lft 8560sec
    inet6 fe80::3e7c:3fff:fe8a:112b/64 scope link
```

Os campos entre `<...>` são as flags do dispositivo. As duas decisivas: `UP` (a interface está administrativamente ativa) e `LOWER_UP` (a camada física detectou sinal — o cabo está conectado e o link, estabelecido). Sem `LOWER_UP`, o sistema acha que a interface existe, mas não há enlace real do outro lado.

A linha `link/ether` traz o endereço MAC, e `inet` traz o IPv4 com a máscara em notação CIDR (`/24`). O `state UP` na frente confirma, em texto, o que as flags já diziam.

:::dica
Prefira `ip -br addr` para uma visão resumida de todas as interfaces numa tabela de uma linha cada, e `ip -c addr` para saída colorida que destaca endereços e flags. Para ver só uma interface, adicione o nome: `ip addr show wlan0`.
:::

## O que `ethtool` sabe que ninguém mais sabe

O `ethtool` conversa com o driver da interface e extrai o que a camada IP não enxerga: a velocidade física negociada, o modo duplex, o link detectado pelo transceptor e as estatísticas de erros no nível do quadro.

```terminal
$ ethtool eth0
Settings for eth0:
        Supported ports: [ TP ]
        Supported link modes:   10baseT/Half 10baseT/Full
                                100baseT/Half 100baseT/Full
                                1000baseT/Full
        Supported pause frame use: Symmetric Receive-only
        Supports auto-negotiation: Yes
        Supported FEC modes: Not reported
        Advertised link modes:  10baseT/Half 10baseT/Full
                                100baseT/Half 100baseT/Full
                                1000baseT/Full
        Link partner advertised link modes:  10baseT/Half 10baseT/Full
                                             100baseT/Half 100baseT/Full
                                             1000baseT/Full
        Speed: 1000Mb/s
        Duplex: Full
        Auto-negotiation: on
        Port: Twisted Pair
        PHYAD: 0
        Transceiver: internal
        MDI-X: on
        Link detected: yes
```

Três linhas são a essência. `Speed: 1000Mb/s` e `Duplex: Full` juntas indicam uma porta Gigabit em full-duplex — o esperado para streaming. `Link detected: yes` confirma sinal físico. Se `Speed` aparecesse como `100Mb/s`, você teria um cabo, porta ou dock limitando o enlace a Fast Ethernet, o que estrangula o bitrate de vídeo para níveis de H.264 antigo.

## A desnegociação traiçoeira

A queda de `1000Mb/s` para `100Mb/s` é um dos defeitos mais comuns e mais silenciosos em docks USB. Um dos oito fios internos do cabo rompeu, a porta do roteador é Fast Ethernet, ou o dock negocia mal — e o sistema continua "funcionando", só que a um décimo da velocidade pretendida.

O `ethtool` também expõe a causa raiz nas estatísticas, que o `ip addr` não mostra:

```terminal
$ ethtool -S eth0 | grep -iE "error|drop|fcs|coll|carrier"
     rx_crc_errors: 0
     rx_frame_errors: 0
     rx_fifo_errors: 0
     tx_fifo_errors: 0
     collisions: 0
     carrier_changes: 1
```

`rx_crc_errors` e `rx_frame_errors` diferentes de zero denunciam cabos defeituosos ou interferência: quadros chegam corrompidos e são descartados. `carrier_changes` contando eventos revela uma interface que "cai e volta" — sintoma clássico de dock mal alimentado ou cabo com mau contato, e que se traduz em quedas de sessão de streaming.

:::atencao
Um `carrier_changes` subindo é pior do que uma velocidade baixa fixa. Enlace que cai e volta derruba a sessão de Remote Play e pode passar despercebido porque o sistema renegocia rápido. Zere a contagem antes do teste (com `ethtool -S eth0 > /dev/null` não dá para zerar; anote o valor inicial e meça a variação) e monitore.
:::

## Inspecionando o dock e o hardware

No Deck, a interface Ethernet é exposta por um dock USB-C, o que adiciona uma camada a investigar quando o link se comporta mal. O `ethtool -i` mostra o driver em uso, revelando qual chip Ethernet o dock carrega:

```terminal
$ ethtool -i eth0
driver: r8152
version: 6.8.0-51-generic
firmware-version:
expansion-rom-version:
bus-info: usb-0000:03:00.0-2
supports-statistics: yes
supports-test: no
```

O `driver: r8152` é o driver do controlador Realtek de rede USB — exatamente o chip usado em docks como o oficial da Valve. O `bus-info: usb-...` confirma que a interface mora num barramento USB, não num PCIe nativo. Entender essa camada ajuda: se o dock perde energia, negocia a porta USB abaixo de 3.0, ou o cabo USB-C é de má qualidade, a interface Ethernet inteira degrada, independentemente do cabo de rede.

Para a interface sem fio, o equivalente ao `ethtool` é a família `iw`, que você explora na [seção sobre o rádio Wi-Fi](#/cap-069/sec-08).

## Juntando o quadro completo

Um diagnóstico físico completo mistura os dois comandos em sequência, do enlace ao endereço:

```terminal
$ ip -br addr show eth0
eth0             UP             192.168.1.20/24
$ ethtool eth0 | grep -E "Speed|Duplex|Link detected"
        Speed: 1000Mb/s
        Duplex: Full
        Link detected: yes
$ ethtool -S eth0 | grep -iE "error|collisions|carrier"
     rx_crc_errors: 0
     collisions: 0
     carrier_changes: 1
```

Essa tríade de três linhas resume a saúde física: interface ativa com IP, Gigabit full-duplex, e zero erros de quadro. Se qualquer uma divergir do esperado, você sabe exatamente em qual camada investigar — antes de culpar o codec, o bitrate ou o jogo.

## Resumo

- `ip addr` mostra flags, endereços e estado de link; `LOWER_UP` confirma enlace físico ativo.
- `ethtool` lê velocidade, duplex e detecção de link diretamente do driver/hardware.
- `Speed: 100Mb/s` trai cabo, porta ou dock limitando o enlace a Fast Ethernet.
- `ethtool -S` expõe erros de CRC, de quadro e mudanças de carrier que denunciam cabos e docks ruins.
- `ethtool -i` revela o driver e o barramento, útil para identificar o chip do dock USB-C do Deck.

## Exercícios

1. Rode `ip -br addr` e identifique, para cada interface, se está `UP` e qual endereço IPv4 carrega.
2. Execute `ethtool eth0` e confirme `Speed`, `Duplex` e `Link detected`. Se a velocidade for 100 Mb/s, investigue o cabo ou a porta.
3. Leia `ethtool -S eth0 | grep -iE "error|collision|carrier"` e anote os contadores; repita após uma sessão longa e veja se algum subiu.
4. Descubra qual chip/driver o seu dock usa com `ethtool -i eth0` e relacione com o barramento USB exibido em `bus-info`.
5. **Desafio.** Simule um cabo ruim (ou apenas imagine o cenário) e explique, usando `Speed`, `rx_crc_errors` e `carrier_changes`, como cada sintoma apontaria para a causa física antes de você culpar a rede lógica ou o streaming.
