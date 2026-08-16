O `ping` fala ICMP, um tráfego que roteadores e hots muitas vezes tratam como cidadão de segunda classe. Para medir a capacidade real do enlace que vai carregar o vídeo, você precisa gerar tráfego de verdade, do tipo TCP e UDP, entre duas máquinas. É exatamente isso que o `iperf3` faz: satura o caminho e reporta o throughput, a retransmissão e — no modo UDP — o jitter e a perda. É o padrão-ouro do diagnóstico de streaming.

:::objetivos
- Entender por que o `iperf3` mede o que o `ping` não consegue
- Rodar um teste completo de throughput entre host e cliente
- Interpretar retransmissão TCP e jitter/perda UDP
- Usar as medições para dimensionar o bitrate do streaming
:::

## Por que saturar o enlace

O `ping` envia pacotes minúsculos, um de cada vez, sem estresse. O streaming, ao contrário, empurra um fluxo contínuo e pesado. Muitos enlaces degradam especificamente **sob carga**: buffers cheios, filas de prioridade, controle de tráfego do roteador. Só saturar o caminho revela essa degradação.

O `iperf3` faz isso com arquitetura cliente-servidor. Numa ponta você sobe o servidor (que apenas ouve e descarta); na outra, o cliente dispara tráfego na direção escolhida e por um tempo definido. No fim, a ferramenta imprime taxa, e, dependendo do protocolo, métricas de confiabilidade.

```terminal
$ iperf3 -s
-----------------------------------------------------------
Server listening on 5201
-----------------------------------------------------------
```

O servidor fica escutando na porta 5201 (padrão). É preciso que ele esteja rodando na máquina **oposta** à que vai medir — normalmente o host do Remote Play, ou um notebook, no mesmo segmento de rede do cliente. Sem o servidor ativo, o cliente não tem com quem falar.

## O teste TCP: throughput sustentado

No modo padrão, o `iperf3` usa TCP. É o cenário que mais se parece com o streaming real (que também usa transporte orientado a conexão): mede quantos megabits por segundo o caminho sustenta de forma confiável.

```terminal
$ iperf3 -c 192.168.1.20
Connecting to host 192.168.1.20, port 5201
[  5] local 192.168.1.10 port 52144 connected to 192.168.1.20 port 5201
[ ID] Interval           Transfer     Bitrate         Retr
[  5]   0.00-10.00  sec   104 MBytes  87.0 Mbits/sec    0 sender
[  5]   0.00-10.00  sec   104 MBytes  86.8 Mbits/sec      receiver
[ ID] Interval           Transfer     Bitrate         Retr  Cwnd
[  5]   0.00-10.00  sec   104 MBytes  87.0 Mbits/sec    0    882 KBytes sender
[  5]   0.00-10.00  sec   104 MBytes  86.8 Mbits/sec          receiver
```

Leia a coluna `Bitrate` do remetente (sender): 87 Mbits/sec. A coluna `Retr` mostra quantas retransmissões o TCP precisou — aqui zero, sinal de enlace limpo. Retransmissão alta indica perda de pacote, que o TCP disfarça reduzindo a janela (coluna `Cwnd`) e, portanto, o throughput.

:::nota
O `iperf3` por padrão testa **uma** direção (cliente → servidor). Para streaming, que é em boa parte unidirecional (host → cliente), isso pode bastar. Use `-R` para inverter a direção e medir o caminho de volta, ou `--bidir` para as duas direções simultaneamente. Enlaces assimétricos (típico em Wi-Fi) exibem resultados bem diferentes em cada sentido.
:::

## O teste UDP: jitter e perda expostos

O TCP esconde a perda: ele retransmite o que sumiu, então você só vê o throughput cair. Para medir **quanta** perda e **quanto** jitter o caminho inflige cru, o `iperf3` oferece o modo UDP, que manda pacotes sem confirmação e conta os que não voltaram.

```terminal
$ iperf3 -c 192.168.1.20 -u -b 50M
Connecting to host 192.168.1.20, port 5201
[  5] local 192.168.1.10 port 59120 connected to 192.168.1.20 port 5201
[ ID] Interval           Transfer     Bitrate         Total Datagrams
[  5]   0.00-10.00  sec  59.6 MBytes  50.0 Mbits/sec  42692
[ ID] Interval           Transfer     Bitrate         Jitter    Lost/Total Datagrams
[  5]   0.00-10.00  sec  59.6 MBytes  50.0 Mbits/sec  0.041 ms  1/42692 (0.0023%)
```

Aqui `-b 50M` injeta 50 Mbps de carga. As colunas que importam: `Jitter` (0,041 ms — excelente) e `Lost/Total` (1 de 42.692 pacotes, 0,0023% — desprezível). Esse é o perfil de um enlace pronto para streaming. Se você subir a carga com `-b` até a perda começar a aparecer, acha o limite verdadeiro do caminho.

:::atencao
O teste UDP é o que revela jitter de verdade, diferente do `mdev` aproximado do `ping`. Perda acima de 1% ou jitter acima de 5 ms num teste de 50 Mbps já se traduz em engasgos visíveis no Remote Play, mesmo que o throughput TCP "pareça" bom — porque o TCP estava apenas cobrindo as perdas com retransmissão e janela menor.
:::

## Dimensionando o bitrate a partir da medição

Com os dois números em mãos, você define o bitrate com ciência, não com chute. O fluxo lógico:

1. Meça o throughput TCP sustentado (ex.: 87 Mbps).
2. Rode o UDP na carga-alvo do streaming (ex.: 30 Mbps para 1080p@60 HEVC) e confira jitter < 5 ms e perda < 1%.
3. Deixe folga: o bitrate do streaming deve ficar em torno de 50 a 70% do throughput TCP medido, para absorver picos sem estourar.

```terminal
$ iperf3 -c 192.168.1.20 -u -b 30M -t 15
...
[ ID] Interval           Transfer     Bitrate         Jitter    Lost/Total Datagrams
[  5]   0.00-15.00  sec  53.6 MBytes  30.0 Mbits/sec  0.38 ms   0/38403 (0%)
```

Aqui, 30 Mbps com jitter de 0,38 ms e perda zero: esse enlace aguenta 1080p HEVC com folga de sobra. Se o mesmo teste mostrar perda, reduza o bitrate-alvo ou resolva o enlace antes de mexer no cliente Steam.

## Erros comuns ao medir

- **Servidor e cliente no mesmo host.** Medir `localhost` com `iperf3 -c 127.0.0.1` testa a pilha local e a RAM, não a rede. Sempre coloque o servidor na outra máquina.
- **Medir via Wi-Fi com o servidor também no Wi-Fi.** O tráfego faz ida e volta pelo mesmo meio compartilhado, duplicando a disputa. Para isolar o enlace, cabeie o servidor.
- **Confundir Mbit/s com MB/s.** O `iperf3` reporta `Mbits/sec` (megabits). O bitrate do Steam também é em Mbps. Não converta errado.
- **Testar por pouco tempo.** Dez segundos é o mínimo; picos de interferência aparecem em janelas maiores. Use `-t 30` quando suspeitar de instabilidade.

:::dica
Para testar o enlace Wi-Fi do Deck especificamente, suba o servidor no roteador ou num host cabeado (`iperf3 -s`), e rode o cliente no Deck (`iperf3 -c <ip-do-servidor> -u -b 30M`). Isso isola o salto sem fio como variável, como você aprendeu na [comparação cabo × Wi-Fi](#/cap-069/sec-04).
:::

## Resumo

- `iperf3` satura o enlace com tráfego real TCP/UDP, revelando o que o `ping` (ICMP) não vê.
- O modo TCP reporta throughput sustentado e retransmissões; retransmissão alta = perda disfarçada.
- O modo UDP reporta jitter e perda explícitos — as métricas que importam para streaming.
- Para streaming, busque jitter < 5 ms e perda < 1% na carga-alvo, com bitrate em 50–70% do throughput TCP.
- Sempre rode o servidor na máquina oposta; testar localhost mede a pilha local, não a rede.

## Exercícios

1. Suba `iperf3 -s` no outro host e rode `iperf3 -c <ip>`. Anote o throughput TCP sustentado e o número de retransmissões.
2. Rode `iperf3 -c <ip> -u -b 30M` e registre jitter e perda. O enlace está apto para 1080p@60 HEVC pelos critérios da seção?
3. Inverta a direção com `-R` e compare: o caminho de volta tem throughput diferente? O que isso diz sobre a simetria do enlace?
4. Aumente a carga UDP em degraus (`-b 10M`, `30M`, `60M`, `90M`) até a perda começar a subir. Em que taxa o enlace "quebra"?
5. **Desafio.** Combine as medições deste capítulo: determine o throughput TCP do enlace, ache o ponto de perda no UDP, aplique a regra de 50–70% e proponha o bitrate máximo seguro — justificando contra o que você escolheu nas seções de bitrate e codec.
