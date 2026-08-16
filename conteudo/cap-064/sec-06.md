Uma sessão de Remote Play é tão boa quanto o pior elo da rede entre o Deck e o PC. Não importa quão potente seja o PC ou quão rápido o codificador: se o caminho de dados sofre com interferência, bufferbloat ou um roteador saturado, o vídeo vai engasgar. Esta seção trata de montar uma rede local que mantenha o streaming estável, com foco nas decisões que de fato importam.

:::objetivos
- Compreender por que o Remote Play local exige baixa latência e baixo jitter, não apenas banda alta
- Escolher entre Wi-Fi 5 GHz, Ethernet e adaptadores de rede para o Deck
- Diagnosticar interferência e congestionamento com ferramentas de linha de comando
- Aplicar QoS e priorização para proteger o fluxo de streaming
- Configurar o roteador para canais limpos e largura de banda adequada
:::

## Banda não é tudo: latência e jitter mandam

O Remote Play local usa entre 5 e 50 Mbit/s de banda — modesto se comparado a um download de jogo de 500 Mbit/s. O que importa não é quantos megabits você consegue enfiar por segundo, mas **quanto tempo cada pacote leva** (latência) e **quanto esse tempo varia** (jitter). Um link de 1 Gbit/s com jitter de 40 ms entrega um streaming péssimo, enquanto um link de 100 Mbit/s com jitter de 1 ms entrega uma experiência impecável.

O jitter é o inimigo mais traiçoeiro porque ele não aparece nos testes de velocidade convencionais. Um teste de download mede throughput em janelas longas; o Remote Play é sensível ao comportamento em janelas de milissegundos.

```terminal
$ ping -c 100 -i 0.02 -q 192.168.1.100
PING 192.168.1.100 56(84) bytes of data.

--- 192.168.1.100 ping statistics ---
100 packets transmitted, 100 received, 0% packet loss, time 2178ms
rtt min/avg/max/mdev = 0.712/1.805/12.340/1.982 ms
```

Repare no `mdev` (desvio médio) de 1,98 ms e no `max` de 12,34 ms. O ping médio é ótimo (1,8 ms), mas há um pico de 12 ms — sinal de jitter. Se picos desse tipo ocorrem várias vezes por segundo durante o streaming, o vídeo engasga mesmo com 0% de perda de pacotes.

## Wi-Fi 5 GHz versus 2,4 GHz versus Ethernet

O Steam Deck tem Wi-Fi dual-band e porta USB-C (que aceita adaptadores de rede cabeada). As três opções de conectividade têm perfis bem distintos:

| Conexão | Banda | Latência | Jitter | Suscetível a interferência |
|---|---|---|---|---|
| Wi-Fi 2,4 GHz | 50-150 Mbit/s | Alta | Alto | Muita (micro-ondas, vizinhos, Bluetooth) |
| Wi-Fi 5 GHz | 300-800 Mbit/s | Média | Médio | Média (paredes, distância) |
| Ethernet (via dock/USB-C) | 100/1000 Mbit/s | Baixa | Baixíssimo | Nenhuma (cabo) |

A banda de 2,4 GHz é notoriamente ruim para streaming: canais sobrepostos, interferência de Bluetooth (que o Deck usa para o controle) e micro-ondas. **Sempre prefira 5 GHz** ao jogar via Remote Play, e posicione o Deck com linha de visão para o roteador.

:::atencao
O Bluetooth do Steam Deck opera na faixa de 2,4 GHz e pode interferir com o Wi-Fi 2,4 GHz — os dois disputam o mesmo espectro. Paradoxalmente, o próprio controle do Deck pode degradar o streaming se você estiver no 2,4 GHz. Usar 5 GHz separa o controle (2,4 GHz) do vídeo (5 GHz), eliminando a disputa.
:::

## Ethernet no Deck: vale a pena?

O Deck não tem porta RJ-45, mas aceita adaptadores USB-C para Ethernet (com ou sem hub). Para sessões em que a latência é crítica — jogos de luta, FPS competitivo, ou simplesmente quem quer zero jitter — o cabo é a solução definitiva:

```terminal
$ ip link show enx00e04c534458
3: enx00e04c534458: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP mode DEFAULT group default qlen 1000
    link/ether 00:e0:4c:53:44:58 brd ff:ff:ff:ff:ff:ff
$ ping -c 10 -q 192.168.1.100
...
rtt min/avg/max/mdev = 0.312/0.408/0.612/0.071 ms
```

Compare com o Wi-Fi: o mdev caiu de 1,98 ms para 0,071 ms, e o pico de 12 ms desapareceu. O `fq_codel` (Fair Queuing with Controlled Delay) no qdisc é um algoritmo de controle de latência que mantém o buffer de rede raso, reduzindo o bufferbloat.

:::dica
Adaptadores USB-C Ethernet com chip RTL8153 ou AX88179 são os mais compatíveis com o SteamOS (kernel Linux). Evite chips exóticos sem driver mainline — o SteamOS imutável dificulta instalar drivers de terceiros.
:::

## QoS: protegendo o stream do resto da família

Quando alguém na casa faz um download grande ou assiste 4K ao mesmo tempo, o buffer do roteador enche e o streaming sofre (fenômeno chamado **bufferbloat**). O QoS (Quality of Service) prioriza pacotes sensíveis à latência — como os do Remote Play — na fila do roteador.

Roteadores modernos oferecem modos de QoS/SQM (Smart Queue Management) com nomes variados: "Adaptive QoS" (ASUS), "SQM" ou "Cake" (OpenWrt), "Smart QoS" (TP-Link). A regra de priorização ideal é classificar o tráfego do jogo por porta ou por dispositivo.

```terminal
$ tc -s qdisc show dev enx00e04c534458
qdisc fq_codel 0: root refcnt 2 limit 10240p flows 1024 quantum 1514 target 5.0ms interval 100.0ms memory_limit 32Mb
 Sent 9438538 bytes 8123 pkt (dropped 0, overlimits 0 requeues 0)
```

No lado do dispositivo, o `fq_codel` já faz uma forma de controle de latência. Mas o ponto crítico é o **router**, onde o buffer compartilhado se enche. Habilitar SQM no roteador (se suportado) é o ajuste com o melhor custo-benefício para eliminar o bufferbloat de casa.

:::info
Se você usa um roteador OpenWrt, os scripts `sqm` e `cake` são a solução clássica: eles mantêm as filas curtas e forçam o algoritmo a descartar cedo em vez de acumular pacotes. Para quem não quer mexer no firmware, a alternativa simples é agendar downloads grandes para horários em que ninguém está jogando — grosseiro, mas eficaz.
:::

## Diagnosticando a rede no Deck

Para medir o throughput real e o jitter entre Deck e PC, use o `iperf3` (instalável como flatpak ou via `pacman` em modo desktop):

```terminal
$ iperf3 -c 192.168.1.100 -u -b 30M -t 10
Connecting to host 192.168.1.100, port 5201
[  5] local 192.168.1.50 port 5201 connected to 192.168.1.100 port 5201
[ ID] Interval           Transfer     Bitrate         Jitter    Lost/Total Datagrams
[  5]   0.00-10.00  sec  35.6 MBytes  29.9 Mbits/sec  0.042 ms  0/25431 (0%)
```

Este teste UDP a 30 Mbit/s é exatamente o perfil de tráfego do Remote Play. Os valores que importam: **Jitter** de 0,042 ms (excelente) e **Lost** de 0/25431 (nenhuma perda). Se o jitter subir acima de 2 ms ou houver datagramas perdidos num teste limpo, o problema está no enlace — persiga o canal Wi-Fi ou o cabo, antes de mexer em qualquer outra coisa.

## Resumo

- Streaming local depende de latência e jitter baixos, não de banda alta; um link de 100 Mbit/s estável supera um 1 Gbit/s com jitter.
- Sempre prefira Wi-Fi 5 GHz ao 2,4 GHz; o Bluetooth do controle disputa espectro na faixa de 2,4 GHz.
- Ethernet via dock/USB-C é a solução definitiva para zero jitter, com chips RTL8153/AX88179.
- Bufferbloat no roteador é a causa mais comum de engasgos quando outras pessoas usam a rede; QoS/SQM resolve.
- `iperf3 -u` reproduz o perfil de tráfego do streaming e expõe jitter e perda que o ping não mostra.

## Exercícios

1. Compare `ping` no 2,4 GHz e no 5 GHz com o Deck na mesma posição. Qual tem menor mdev (jitter)? Quanto?
2. Se tiver um adaptador USB-C, meça o mdev no Ethernet e compare com o melhor valor de Wi-Fi que você registrou.
3. Rode `iperf3 -c [IP-PC] -u -b 30M -t 10` e registre o jitter e a perda de datagramas no seu enlace.
4. Durante um streaming, gere tráfego concorrente (ex.: um download grande em outro dispositivo) e observe o contador de desempenho do Deck. O bitrate cai? O framepacing piora?
5. **Desafio.** Se seu roteador suporta QoS/SQM, ative-o e repita o teste do exercício 4. Meça a diferença no jitter e no framepacing antes e depois.