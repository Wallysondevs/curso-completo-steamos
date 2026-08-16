Cloud gaming é uma briga contra a física: cada milissegundo de latência é um pacote que atravessou roteadores, switches e fibras entre você e o datacenter. Quando o stream engasga ou o controle demora para responder, o instinto é culpar o serviço — mas nove em cada dez vezes o problema está na sua rede local. Esta seção ensina a medir, interpretar e corrigir latência usando ferramentas que já estão no SteamOS.

:::objetivos
- Medir latência de rede até os servidores da NVIDIA e Microsoft
- Diagnosticar bufferbloat e perda de pacotes com ferramentas padrão
- Interpretar métricas de jitter e seu impacto no streaming
- Otimizar o Wi-Fi doméstico para cloud gaming
- Usar MTR para identificar onde a latência é introduzida na rota
:::

## Latência não é só ping

O `ping` mede o tempo que um pacote ICMP leva para ir e voltar — o RTT (Round-Trip Time). Para cloud gaming, o que importa é o RTT até o servidor de streaming, mais o jitter (variação do RTT) e a perda de pacotes. Um RTT de 20 ms com jitter de 2 ms é excelente. Um RTT de 20 ms com jitter de 20 ms é injogável para shooters.

```terminal
$ ping -c 20 -i 0.2 4.2.2.2
PING 4.2.2.2 (4.2.2.2) 56(84) bytes of data.
64 bytes from 4.2.2.2: icmp_seq=1 ttl=50 time=18.4 ms
64 bytes from 4.2.2.2: icmp_seq=2 ttl=50 time=18.1 ms
64 bytes from 4.2.2.2: icmp_seq=3 ttl=50 time=18.7 ms
[...]
64 bytes from 4.2.2.2: icmp_seq=20 ttl=50 time=17.9 ms

--- 4.2.2.2 ping statistics ---
20 packets transmitted, 20 received, 0% packet loss, time 3803ms
rtt min/avg/max/mdev = 17.8/18.2/18.9/0.311 ms
```

O `-i 0.2` envia pacotes a cada 200 ms — mais rápido que o padrão de 1 segundo, revelando jitter de curta duração que um ping lento deixaria escapar. O `mdev` de 0.311 ms é o desvio padrão do RTT: abaixo de 1 ms, o jitter é insignificante.

:::nota
`4.2.2.2` é um DNS público da Level 3, mas serve como alvo de ping genérico. Para medir latência até o servidor de cloud gaming real, você precisa descobrir o IP para o qual o navegador está enviando tráfego — veja o exercício 5 no final da seção.
:::

## O inimigo silencioso: bufferbloat

Bufferbloat é o excesso de buffer em roteadores domésticos. Quando você satura o upload (alguém fazendo backup de fotos, torrent, upload de vídeo), o roteador acumula pacotes em filas enormes em vez de descartá-los. O resultado: a latência dispara de 20 ms para 300 ms ou mais, e o stream congela.

```terminal
$ ping -c 50 google.com &
$ # agora gere tráfego de upload com:
$ curl -o /dev/null https://speed.hetzner.de/100MB.bin
[...]
64 bytes from google.com: icmp_seq=32 ttl=115 time=342 ms
64 bytes from google.com: icmp_seq=33 ttl=115 time=415 ms
64 bytes from google.com: icmp_seq=34 ttl=115 time=287 ms
```

Enquanto o upload está saturado, o ping a `google.com` salta de ~20 ms para centenas de milissegundos. Isso é bufferbloat clássico. A solução depende do seu roteador:

- Se o roteador suporta **SQM** (Smart Queue Management) — como `fq_codel` ou `cake` — habilite. Roteadores OpenWrt, Ubiquiti e alguns ASUS têm essa opção.
- Se o roteador não suporta SQM, limite a banda de upload dos outros dispositivos durante sessões de cloud gaming.
- Conecte o Deck via Ethernet (com dock ou hub USB-C) para eliminar o Wi-Fi como variável.

```terminal
$ sudo tc -s qdisc show dev wlan0
qdisc noqueue 0: root refcnt 2
 Sent 0 bytes 0 pkt (dropped 0, overlimits 0 requeues 0)
 backlog 0b 0p requeues 0
qdisc mq 0: parent :1
 Sent 3847291 bytes 8923 pkt (dropped 0, overlimits 0 requeues 10)
 backlog 0b 0p requeues 10
```

O campo `requeues` mostra pacotes reenfileirados — se o número cresce rápido durante o streaming, há bufferbloat no caminho. O `tc` (traffic control) expõe as disciplinas de fila do kernel. Um `requeues` alto indica que o kernel está reenviando pacotes porque o buffer do hardware (placa Wi-Fi) está cheio.

## MTR: o mapa da latência

O `ping` mostra o destino, mas não o caminho. O `mtr` (My TraceRoute) combina ping e traceroute em tempo real, mostrando cada salto entre você e o servidor, com perda de pacotes e latência por salto.

```terminal
$ mtr -r -c 30 static-01.nvidia.com
Start: 2025-08-12T14:30:00-0300
HOST: steamdeck                    Loss%   Snt   Last  Avg  Best  Wrst StDev
  1. _gateway                       0.0%    30    1.2  1.5  1.1   2.8   0.4
  2. 192.168.1.1                    0.0%    30    1.8  2.1  1.6   3.2   0.4
  3. 10.22.0.1                      0.0%    30    6.4  7.1  5.8   9.3   0.9
  4. 187.16.45.2                    0.0%    30    8.2  8.9  7.9  18.3   2.1
  5. 187.16.45.1                    0.0%    30   14.1 14.8 13.2  16.9   0.8
  6. as15169.saopaulo.sp.ix.br      0.0%    30   15.2 15.8 14.9  16.4   0.3
  7. 108.170.251.1                  0.0%    30   17.1 17.4 16.8  18.3   0.4
  8. 34.120.78.120                  0.0%    30   18.1 18.3 17.9  18.8   0.2
```

Leitura do MTR: os primeiros dois saltos são sua rede local (~1-2 ms). O terceiro salto é o gateway do seu provedor (~7 ms). Do quarto em diante é a internet pública. Note que a latência acumula: 15 ms no salto 6 (São Paulo, IX.br) é a distância geográfica; dali até o servidor NVIDIA (salto 8) são só mais 3 ms.

:::atencao
Perda de pacote no meio do caminho (saltos 4-6) não é necessariamente um problema se o destino final tem 0% de perda. Roteadores intermediários frequentemente descartam ICMP em favor de tráfego real, mas o destino final responde. O que importa é a coluna `Loss%` no último salto.
:::

## Otimizando o Wi-Fi para cloud gaming

O Wi-Fi é half-duplex: só um dispositivo transmite por vez. Cada dispositivo adicional na rede disputa o tempo de antena. Em uma casa com 10 dispositivos, o Deck perde cerca de 20-30% do tempo de antena para os outros.

Medidas práticas que fazem diferença mensurável:

1. **Use 5 GHz exclusivamente.** A banda de 2,4 GHz tem apenas 3 canais não sobrepostos (1, 6, 11) e é usada por micro-ondas, Bluetooth e vizinhos.
2. **Selecione um canal livre.** Use o aplicativo WiFi Analyzer no celular para ver quais canais estão saturados e escolha o mais vazio.
3. **Force o canal manualmente no roteador.** O Auto às vezes coloca você no mesmo canal do vizinho.
4. **Aproxime o Deck do roteador.** A 5 metros com parede, o sinal cai 6-10 dBm. A 10 metros com duas paredes, cai 20+ dBm — o suficiente para reduzir o bitrate de 866 Mbps para 200 Mbps.

```terminal
$ iw dev wlan0 link
Connected to 3c:37:86:0a:b1:c4 (on wlan0)
	SSID: Casa-5G
	freq: 5180
	signal: -48 dBm
	rx bitrate: 866.7 MBit/s VHT-MCS 8 80MHz VHT-NSS 2
	tx bitrate: 780.0 MBit/s VHT-MCS 8 80MHz VHT-NSS 2
$ iw dev wlan0 station dump | grep -E 'signal|bitrate|tx.*retry'
	signal:         -48 dBm
	signal avg:     -48 dBm
	rx bitrate:     866.7 MBit/s
	tx bitrate:     780.0 MBit/s
	tx retry:       124
```

O `tx retry` conta retransmissões. Em uma sessão de cloud gaming de 1 hora, menos de 500 retransmissões é aceitável. Mais de 5000 indica que o canal está congestionado ou o sinal é fraco — e cada retransmissão adiciona latência.

## Resumo

- O `ping -i 0.2` com 20 pacotes mede RTT e jitter; `mdev` abaixo de 2 ms é excelente para cloud gaming.
- Bufferbloat é a causa mais comum de latência explosiva; habilite SQM (`fq_codel` ou `cake`) no roteador.
- O `mtr` mostra a latência salto a salto; o que importa é a perda de pacotes no destino final, não nos intermediários.
- `iw dev wlan0 link` e `iw dev wlan0 station dump` mostram a qualidade do sinal Wi-Fi e retransmissões.
- No Wi-Fi, use 5 GHz, canal vazio e proximidade física do roteador; Ethernet via dock elimina o Wi-Fi como variável.

## Exercícios

1. Execute `ping -c 20 -i 0.2 8.8.8.8` e calcule o `mdev`. Depois faça o mesmo ping enquanto alguém assiste Netflix em 4K na mesma rede. O `mdev` mudou?
2. Gere tráfego de upload com `curl` para um arquivo grande e execute `ping` simultaneamente. Se o ping saltar de ~20 ms para >200 ms, seu roteador sofre de bufferbloat.
3. Instale o `mtr` com `sudo pacman -S mtr` (se disponível) e execute `mtr -r -c 20 xbox.com`. Qual salto introduz a maior latência?
4. Execute `iw dev wlan0 station dump | grep -E 'tx.*retry'` antes e depois de uma sessão de cloud gaming de 30 minutos. Quantas retransmissões ocorreram?
5. **Desafio.** Durante uma sessão de cloud gaming, use `ss -tunp` para identificar o IP do servidor de streaming. Execute `mtr` contra esse IP e compare a rota com a do `ping` genérico. Os saltos são os mesmos? Há diferença de latência?