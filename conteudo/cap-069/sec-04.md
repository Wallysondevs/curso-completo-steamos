Nenhuma decisão de rede afeta tanto o streaming quanto a escolha entre **cabo** e **Wi-Fi**. O cabo é determinístico: os elétrons viajam por um condutor dedicado, sem disputa, sem colisão, sem interferência. O Wi-Fi é um meio compartilhado e sujeito a rádio, onde cada pacote disputa o espectro com vizinhos, paredes e eletrodomésticos. Este é o capítulo que explica por que, no Steam Deck, as duas interfaces têm papéis diferentes.

:::objetivos
- Entender por que o cabo é determinístico e o Wi-Fi é compartilhado
- Reconhecer as limitações da conexão sem fio do Steam Deck
- Escolher a topologia certa para cada papel no Remote Play
- Medir a diferença prática entre as duas interfaces na sua rede
:::

## O cabo é uma linha privada

Numa porta Ethernet 1000BASE-T, os dois lados conectam-se com pares de cobre trançado, e a sinalização é **full-duplex**: o host transmite e recebe ao mesmo tempo, em canais separados, sem arbitragem. Não existe "colisão" porque cada par fala numa direção. O resultado é uma latência baixa, estável, na casa de frações de milissegundo, e um jitter praticamente nulo.

É por isso que, ceteris paribus, o cabo sempre ganha do Wi-Fi para o trecho que carrega a sessão. A diferença não é só de capacidade — é de **previsibilidade**, que é exatamente o que o buffer de vídeo precisa para não soluçar.

```terminal
$ ping -c 10 192.168.1.20
PING 192.168.1.20 (192.168.1.20) 56(84) bytes of data.
64 bytes from 192.168.1.20: icmp_seq=1 ttl=64 time=0.48 ms
64 bytes from 192.168.1.20: icmp_seq=2 ttl=64 time=0.51 ms
64 bytes from 192.168.1.20: icmp_seq=3 ttl=64 time=0.47 ms
64 bytes from 192.168.1.20: icmp_seq=4 ttl=64 time=0.50 ms
64 bytes from 192.168.1.20: icmp_seq=5 ttl=64 time=0.49 ms
...
```

Veja a coluna `time`: os valores variam de 0,47 a 0,51 ms, um desvio de centésimos. Esse é o perfil de assinatura de um enlace cabeado saudável — RTT baixo e mdev minúsculo, pronto para carregar bitrate alto sem soluço.

:::dica
O cabo não precisa ir até o cliente para valer a pena. A regra de ouro do Remote Play é: **o host no cabo**. O Deck que joga (cliente) pode ficar no Wi-Fi, mas o Deck que codifica e envia deve conversar com o roteador por Ethernet para eliminar o salto sem fio do remetente.
:::

## O Wi-Fi é uma sala cheia

No Wi-Fi, o espectro é compartilhado entre todos os dispositivos no mesmo canal, inclusive os do vizinho. O protocolo (CSMA/CA) exige que cada estação **escute antes de transmitir** e espere o meio ficar livre; quando há colisão ou interferência, o pacote é **retransmitido**. Cada retransmissão é um atraso extra e uma fonte de jitter.

Some a isso a física do rádio: paredes grossas, distância, micro-ondas ligado, Bluetooth ativo (que disputa a faixa de 2,4 GHz) e o próprio corpo humano atenuam o sinal. Em condições ruins, o Wi-Fi negocia uma modulação mais conservadora, cai o throughput e, pior, o jitter explode.

É o jitter, não a velocidade nominal, que derruba a sessão. A interface pode reportar "link 866 Mbps" e ainda assim entregar uma experiência horrível, porque aquele número é a taxa máxima teórica da modulação negociada, não o throughput real sob disputa.

## O Steam Deck e suas interfaces

O Steam Deck tem um único conector USB-C. Para usar cabo, você passa por um dock (ou hub) que expõe a porta Ethernet por USB. Duas camadas de tradução entram em cena: USB-C carrega um controlador Ethernet (geralmente Realtek, no caso dos docks e do dock oficial da Valve), e o kernel o expõe como uma interface de rede comum.

O Wi-Fi do Deck é uma placa que opera em 2,4 GHz e 5 GHz. Para streaming, a faixa de 5 GHz (ou 6 GHz, onde suportada) é praticamente obrigatória: mais canais, menos congestionamento e menos interferência típica. Deixar o Deck preso em 2,4 GHz é uma das causas mais comuns de Remote Play ruim.

```terminal
$ ip -br addr
lo               UNKNOWN        127.0.0.1/8
wlan0            UP             192.168.1.15/24
eth0             UP             192.168.1.20/24
```

Aqui aparecem as duas interfaces. `wlan0` é o rádio sem fio e `eth0` é a Ethernet trazida pelo dock USB. Ver ambas `UP` ao mesmo tempo é comum no Deck: o sistema pode rotear tráfego por qualquer uma, conforme a métrica de rota que cada uma recebe. Para sessões, convém saber qual está de fato levando os pacotes.

:::atencao
Wi-Fi ativo **ao mesmo tempo** que o cabo não torna a conexão mais rápida — o sistema escolhe uma rota. Pior: se você quer que a sessão use o cabo, o rádio ligado pode continuar associado e concorrer pelo espectro, servindo de distração. Em setups críticos, desligue o Wi-Fi quando o cabo estiver em uso: `nmcli radio wifi off`.
:::

## Quando cada um vence

A escolha não é "cabo sempre". Existe um trade-off prático:

| Interface | Vantagem | Quando usar |
|---|---|---|
| Ethernet (dock) | Latência e jitter mínimos, determinístico | Host de Remote Play, transferências grandes, torneio |
| Wi-Fi 5 GHz | Mobilidade, sem cabo | Cliente de Remote Play em movimento, uso portátil |

O padrão que funciona para a maioria: o **host** (o Deck forte que roda o jogo) fica no dock com cabo; o **cliente** (o outro Deck ou notebook) fica no Wi-Fi 5 GHz, perto do roteador. O salto sem fio fica no lado de quem recebe, que é muito menos sensível a jitter do que o lado que envia dados em tempo real.

## Medindo a diferença na sua casa

O jeito certo de decidir é medir as duas interfaces no mesmo ponto, sem chute. Rode o teste abaixo primeiro com o cabo e depois com o Wi-Fi:

```terminal
$ ping -c 30 192.168.1.1
## ... com eth0 ...
rtt min/avg/max/mdev = 0.451/0.489/0.612/0.031 ms
$ sudo nmcli radio wifi off && sudo nmcli device disconnect eth0
$ sudo nmcli device disconnect wlan0 && sudo nmcli device connect wlan0
$ ping -c 30 192.168.1.1
## ... com wlan0 ...
rtt min/avg/max/mdev = 1.811/3.405/18.942/2.911 ms
```

Compare as duas linhas de resumo. No cabo, 0,49 ms de média com mdev de 0,03 ms. No Wi-Fi, 3,4 ms de média (aceitável), mas mdev de 2,9 ms e pico de 18,9 ms — o jitter que o cabo simplesmente não tem. É essa margem que, multiplicada por milhares de pacotes por minuto, vira soluços na tela.

Essa medição é mais confiável que qualquer regra, porque captura o seu ambiente real: a distância ao roteador, as paredes, os vizinhos. Repita em horários diferentes; a rede sem fio muda com o tráfego dos outros e vale medir mais de uma vez.

## Resumo

- Cabo é full-duplex e determinístico, com RTT e jitter na casa de frações de milissegundo.
- Wi-Fi é meio compartilhado com arbitragem CSMA/CA, sujeito a retransmissões e interferência.
- O Steam Deck usa o dock USB-C para expor a interface Ethernet; a placa sem fio opera em 2,4 e 5 GHz.
- Para Remote Play, coloque o host no cabo e deixe o cliente no Wi-Fi 5 GHz, perto do roteador.
- Meça as duas interfaces no mesmo ponto com `ping` e compare `mdev`, não só a média.

## Exercícios

1. Liste as interfaces ativas com `ip -br addr` e identifique qual é a Ethernet e qual é o Wi-Fi.
2. Rode `ping -c 30 192.168.1.1` no cabo e no Wi-Fi e compare `avg` e `mdev`. Qual interface tem mais jitter?
3. No Dock do Deck, confirme a velocidade negociada da porta Ethernet com `ethtool eth0` e anote a linha `Speed`.
4. Desligue o Wi-Fi com `nmcli radio wifi off`, rode o `ping` de novo só no cabo, e explique por que a sessão não fica mais rápida com os dois links ligados ao mesmo tempo.
5. **Desafio.** Monte um experimento: host no cabo + host no Wi-Fi, sempre com o cliente no Wi-Fi, medindo `mdev` para o roteador nas duas configurações. Relacione o resultado com a recomendação de manter o host cabeado, e preveja como isso interage com o bitrate escolhido na seção anterior.
