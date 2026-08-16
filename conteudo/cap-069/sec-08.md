A interface sem fio é uma fera diferente da Ethernet: em vez de um cabo com velocidade fixa, ela negocia modulação, canal e potência com um ponto de acesso, e tudo isso muda a cada segundo. Duas famílias de comandos inspecionam esse mundo: a moderna `iw` (via o netlink do kernel) e a antiga `iwconfig` (via extensões Wireless do kernel, hoje legadas). Dominar as duas é necessário porque, em ferramentas e scripts antigos, a `iwconfig` ainda aparece.

:::objetivos
- Inspecionar o estado do rádio sem fio com `iw dev`
- Ler a associação atual, o canal e o sinal da rede conectada
- Entender por que `iwconfig` é legado e quando ainda aparece
- Diagnosticar problemas de sinal, canal e banda no Wi-Fi do Deck
:::

## A árvore do Wi-Fi com `iw`

O `iw` entende a arquitetura real do Wi-Fi no Linux: não existe simplesmente "o Wi-Fi", mas um **phy** (o rádio físico), sobre o qual operam uma ou mais **interfaces** virtuais (a STA cliente, um AP, um monitor). O comando `iw dev` lista essas relações.

```terminal
$ iw dev
phy#0
        Interface wlan0
                ifindex 3
                wdev 0x1
                addr 3c:7c:3f:8a:11:2b
                type managed
                txpower 22.00 dBm
```

Aqui há um `phy#0` (o rádio) carregando uma única interface `wlan0` do tipo `managed` — o modo normal de cliente, que se associa a um ponto de acesso. O `txpower` de 22 dBm é o teto de potência de transmissão da região regulatória. Outros tipos que você pode ver: `AP`, `monitor`, `mesh`.

:::nota
`dBm` é decibel-milWatt: uma escala logarítmica de potência. 30 dBm = 1 W; 20 dBm = 0,1 W; 0 dBm = 1 mW. Cada queda de 3 dBm é metade da potência. Como a escala é logarítmica, a diferença entre "sinal -40 dBm" e "-70 dBm" é enorme, não de 30 "unidades".
:::

## Lendo a associação: `iw dev wlan0 link`

O comando mais útil para streaming é o `link`, que descreve a associação ativa com o ponto de acesso: qual rede, em qual canal, a que taxa e com que sinal.

```terminal
$ iw dev wlan0 link
Connected to 3c:37:86:0a:b1:c4 (on wlan0)
        SSID: CasaWiFi-5G
        freq: 5180
        RX: 19531250 bytes (81241 packets)
        TX: 4218750 bytes (15233 packets)
        signal: -52 dBm
        rx bitrate: 780.0 MBit/s VHT-MCS 9 80MHz short GI
        tx bitrate: 780.0 MBit/s VHT-MCS 9 80MHz short GI
        bss flags: short-preamble short-slot-time
        dtim period: 2
        beacon int: 100
```

Leia os quatro campos que decidem a experiência. `freq: 5180` (MHz) coloca a conexão na faixa de 5 GHz — o que você quer para streaming. `signal: -52 dBm` é um sinal bom; acima de -60 dBm é confortável, e pior que -75 dBm começa a doer. `rx/tx bitrate: 780 Mbit/s` com `VHT-MCS 9 80MHz` mostra a modulação Wi-Fi 5 (VHT) no topo, com largura de canal de 80 MHz. Juntos, esses campos dizem que a sessão tem margem de sobra.

:::atencao
O "bitrate" que o `iw` mostra é a **taxa de modulação negociada** (a velocidade teórica do enlace de rádio naquele instante), não o throughput real. Ele pode ler 780 Mbit/s enquanto o tráfego útil é um décimo disso. Para o número que importa de verdade, cruze com o [teste de `iperf3`](#/cap-069/sec-06).
:::

## Varrendo o ambiente com `iw dev wlan0 scan`

Quando o sinal está fraco, a pergunta seguinte é "estou num canal congestionado?". O `iw` varre os pontos de acesso ao redor e lista canais, frequências e sinais dos vizinhos.

```terminal
$ sudo iw dev wlan0 scan | grep -E "freq:|signal:" | head -12
        freq: 2412
        signal: -41.00 dBm
        freq: 2437
        signal: -52.00 dBm
        freq: 2462
        signal: -48.00 dBm
        freq: 5180
        signal: -52.00 dBm
        freq: 5500
        signal: -80.00 dBm
        freq: 5745
        signal: -89.00 dBm
```

A varredura mostra três APs na faixa de 2,4 GHz (2412, 2437, 2462) e três na de 5 GHz. Repare que um vizinho em 5 GHz está a -89 dBm (fraco) e outro a -52 dBm. Se o seu AP está no canal 5180 junto de um vizinho forte, mudar de canal reduz a disputa. A varredura é a evidência crua para a decisão de trocar de canal ou de banda.

:::dica
O `scan` precisa de privilégio (`sudo`) e pode derrubar momentaneamente a associação em algumas placas. Rode-o quando puder, e para uma visão menos intrusiva use o mapa de canais do roteador ou ferramentas como `nmcli device wifi list`.
:::

## `iwconfig`: o legado que ainda responde

O `iwconfig` pertence às extensões Wireless do kernel (WEXT), uma API antiga que o `iw` e o netlink substituíram. Ele não entende conceitos novos como canais de 160 MHz ou Wi-Fi 6 (HE), e por isso mostra valores truncados ou ausentes. Ainda assim, aparece em scripts, tutoriais e sistemas mais velhos — e continua revelando o essencial em uma linha.

```terminal
$ iwconfig wlan0
wlan0     IEEE 802.11  ESSID:"CasaWiFi-5G"
          Mode:Managed  Frequency:5.18 GHz  Access Point: 3C:37:86:0A:B1:C4
          Bit Rate=780 Mb/s   Tx-Power=22 dBm
          Retry short limit:7   RTS thr:off   Fragment thr:off
          Power Management:on
          Link Quality=62/70  Signal level=-48 dBm
          Rx invalid nwid:0  Rx invalid crypt:0  Rx invalid frag:0
          Tx excessive retries:37  Invalid misc:0   Missed beacon:0
```

Três detalhes valiosos que o `iw link` não dá com a mesma naturalidade. `Power Management:on` indica o modo de economia de energia — útil em um portátil como o Deck, mas que pode adicionar latência de despertar do rádio durante o streaming. `Tx excessive retries:37` conta retransmissões por disputa de canal, um sinal de interferência. `Missed beacon:0` mostra se o AP está sumindo (perder beacons precedem desconexões).

:::info
`iwconfig` é considerado obsoleto; para hardware moderno, sempre prefira `iw`. Mantenha-o no repertório para diagnóstico rápido e para ler scripts alheios, mas trate seus números como parciais em placas Wi-Fi 5/6/7.
:::

## Power management: o vilão discreto

O campo `Power Management:on` merece atenção redobrada num dispositivo que se supõe sempre na tomada durante streaming. Com economia de energia ativa, o rádio pode adormecer entre rajadas e acordar com atraso, injetando exatamente o tipo de jitter intermitente que arruína uma sessão.

```terminal
$ sudo iw dev wlan0 set power_save off
$ iw dev wlan0 get power_save
Power save: off
```

Desligar o power save (no Deck, via `iw` ou no gerenciador de rede) é uma das otimizações mais baratas para Remote Play via Wi-Fi. O custo é um pouco mais de bateria; enquanto você está plugado e jogando, não faz diferença perceptível.

## Resumo

- `iw dev` mapeia o rádio (`phy`) e as interfaces virtuais, e mostra o tipo e a potência.
- `iw dev wlan0 link` revela SSID, frequência/banda, sinal em dBm e taxa de modulação negociada.
- `iw dev wlan0 scan` lista canais e sinais dos vizinhos, base para escolher canal menos congestionado.
- `iwconfig` é legado (WEXT) mas ainda expõe power management, retransmissões e beacons perdidos.
- Desligar o power save (`iw dev wlan0 set power_save off`) reduz jitter em sessões de streaming.

## Exercícios

1. Rode `iw dev` e identifique o `phy` e o tipo da interface Wi-Fi (`managed`, `AP`, etc.).
2. Execute `iw dev wlan0 link` e anote frequência/banda, sinal em dBm e a taxa de modulação. Classifique a qualidade do sinal.
3. Varra `sudo iw dev wlan0 scan | grep -E "freq:|signal:"` e identifique se o seu canal tem vizinhos fortes disputando.
4. Compare a saída de `iwconfig wlan0` com `iw dev wlan0 link`. Quais campos o legado omite ou trunca na sua placa?
5. **Desafio.** Verifique `iw dev wlan0 get power_save`, desligue-o durante uma sessão de streaming e meça (com `ping -i 0.2` e `iperf3 -u`) se o jitter melhora. Relacione o resultado com a recomendação de manter o host no cabo da seção sobre cabo × Wi-Fi.
