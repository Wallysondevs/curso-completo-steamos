O streaming de jogos é, no fundo, uma conversa em tempo real entre duas máquinas: o host que codifica o jogo e o cliente que o exibe. Essa conversa só parece fluida quando os pacotes chegam **rápidos** e **em ritmo constante**. A qualidade da imagem depende do codec e do bitrate, mas a suavidade de uma sessão do Steam Remote Play é determinada pela latência. Antes de mexer em qualquer configuração, é preciso saber medir e ler os dois números que resumem a saúde de uma rede: o RTT e o jitter.

:::objetivos
- Entender a diferença entre latência, largura de banda e throughput
- Interpretar o RTT e o jitter reportados por ferramentas de rede
- Identificar onde a latência se acumula numa sessão de streaming local
- Estabelecer os valores de referência aceitáveis para jogos
:::

## Latência, largura de banda e throughput

As três palavras se confundem no dia a dia, mas descrevem coisas distintas — e só uma delas derruba uma partida.

**Largura de banda** é a capacidade do canal, medida em megabit por segundo (Mbps). É o "tamanho do cano": quanto mais largo, mais dados passam por segundo, no limite teórico. Uma conexão de 100 Mbps tem um cano até 100 Mbps.

**Throughput** é o quanto de fato atravessa o cano no seu caso, com as perdas do mundo real. Você contrata 100 Mbps, mas entre interferência, cabeamento velho e sobrecarga de protocolo, o throughput medido costuma ser menor.

**Latência** é o atraso: quanto tempo cada pacote leva para ir de um ponto a outro. É o "tempo de viagem", não o "tamanho do cano". Um cano largo pode ter água viajando devagar, e um cano fino pode entregar gotas quase instantaneamente.

Para streaming de jogo, o que mata não é o cano estreito (com 30 a 50 Mbps você já tem folga), e sim o atraso alto ou irregular. Apertar um botão no controle e ver o personagem reagir 150 ms depois é o que quebra a sensação de controle direto.

:::dica
Memorize a analogia: largura de banda é a **grossura** do cano, latência é o **comprimento** dele. Você pode ter fibra de 1 Gbps (cano grosso) e ainda assim latência ruim se a rota for longa e cheia de saltos.
:::

## RTT: o tempo de ida e volta

O valor que as ferramentas chamam de "ping", "latency" ou "RTT" (Round-Trip Time) é o tempo que um pacote leva para ir até o destino **e voltar**. Existe o one-way delay (só ida), mas na prática medimos o round-trip porque só o emissor conseguem marcar o tempo sem depender de relógios sincronizados entre máquinas.

Numa sessão de Remote Play na mesma rede local, o RTT é dominado por poucos fatores:

- **Cada salto** entre o host e o cliente (roteador, switch, ponto de acesso Wi-Fi).
- **O meio físico**: cabo de cobre/óptico é quase instantâneo; Wi-Fi adiciona retransmissões e filas.
- **O buffer do codec**: a rede entrega o pacote, mas o codificador e o decodificador guardam dados numa fila para suavizar oscilações, e essa fila vira atraso perceptível.

O `ping` mede o RTT básico da rede, sem os buffers de vídeo. Ele responde a pergunta "a rede em si é rápida?", e não "o jogo streamado é rápido?". O resto do atraso mora no pipeline de encoding/decoding, que você vê nas seções de codec e bitrate.

## Jitter: quando o ritmo não é constante

O RTT médio pode ser ótimo e a sessão ainda engasgar. O culpado é quase sempre o **jitter**, a variação do atraso entre pacotes consecutivos. Se cada pacote leva exatamente 3 ms, a experiência é perfeita. Se um leva 3 ms e o próximo leva 40 ms, o decodificador não sabe o que fazer: ou espera (e trava a imagem) ou desenha com o que tem (e aparecem artefatos).

```terminal
$ ping -c 20 192.168.1.1
PING 192.168.1.1 (192.168.1.1) 56(84) bytes of data.
64 bytes from 192.168.1.1: icmp_seq=1 ttl=64 time=1.20 ms
64 bytes from 192.168.1.1: icmp_seq=2 ttl=64 time=1.31 ms
64 bytes from 192.168.1.1: icmp_seq=3 ttl=64 time=1.18 ms
64 bytes from 192.168.1.1: icmp_seq=4 ttl=64 time=38.7 ms
64 bytes from 192.168.1.1: icmp_seq=5 ttl=64 time=1.22 ms
64 bytes from 192.168.1.1: icmp_seq=6 ttl=64 time=1.19 ms
...
--- 192.168.1.1 ping statistics ---
20 packets transmitted, 20 received, 0% packet loss, time 19040ms
rtt min/avg/max/mdev = 1.180/3.146/38.770/8.293 ms
```

A linha final é a que importa. O `avg` de 3,1 ms parece ótimo, mas repare no `mdev` (desvio médio) de 8,2 ms e no `max` de 38,7 ms: existe um pico isolado ali, no pacote número 4. Na linha do tempo de um jogo a 60 FPS, um único frame atrasado em 38 ms é um soluço visível.

:::atencao
O valor `mdev` do `ping` não é exatamente o jitter definido em RFC, mas serve como proxy rápido. Para uma medição séria de jitter você desvia-se de ICMP e mede com tráfego real, como o `iperf3` faz no [teste de UDP](#/cap-069/sec-06).
:::

## Onde a latência se acumula

Numa sessão local, some mentalmente os atrasos em cadeia:

| Etapa | Atraso típico |
|---|---|
| Leitura do frame na GPU + encode | 5 a 15 ms |
| Fila de rede e transmissão (cabo) | 1 a 3 ms |
| Fila de rede e transmissão (Wi-Fi) | 5 a 30 ms |
| Buffer jitter do cliente | 2 a 10 ms |
| Decode + apresentação do frame | 3 a 10 ms |

No cabo, cabem uns 20 a 40 ms de ponta a ponta — o cérebro interpreta isso como "instantâneo". No Wi-Fi congestionado, a soma passa dos 60 a 80 ms, e o olho treinado já nota o atraso entre o comando e a resposta na tela.

É por isso que a recomendação clássica para Remote Play é priorizar o cabo entre o host e o roteador, mesmo que o cliente fique no Wi-Fi. Eliminar o salto sem fio do lado do host já corta boa parte do jitter.

## Os números que você quer ver

Antes de definir esses limites, vale confirmar que a máquina enxerga o enlace local e resolve nomes sem depender de DNS externo. O `ping` também revela se o problema é de rota ou de resolução:

```terminal
$ ping -c 3 192.168.1.20
PING 192.168.1.20 (192.168.1.20) 56(84) bytes of data.
64 bytes from 192.168.1.20: icmp_seq=1 ttl=64 time=1.22 ms
64 bytes from 192.168.1.20: icmp_seq=2 ttl=64 time=1.19 ms
64 bytes from 192.168.1.20: icmp_seq=3 ttl=64 time=1.24 ms

--- 192.168.1.20 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2029ms
rtt min/avg/max/mdev = 1.190/1.217/1.240/0.020 ms
```

Nenhuma perda e mdev de 0,02 ms: o caminho interno está estável. Compare com um alvo externo quando a sessão for remota — a diferença de perfil entre os dois é o que separa o trecho que você controla do que não controla.

Como regra de bolso para rede local:

- **RTT < 10 ms** no `ping` para o roteador: excelente, cabo ou Wi-Fi próximo.
- **RTT entre 10 e 30 ms**: aceitável, com atenção ao jitter.
- **RTT > 50 ms** ou **perda de pacote > 1%**: o streaming vai sofrer, qualquer que seja o bitrate.
- **mdev estável** (muito menor que o avg): sinal saudável, pouca oscilação.

Esses valores valem para o caminho interno. Quando o cliente está fora de casa pela internet, o RTT pula para dezenas ou centenas de milissegundos porque entram roteadores da operadora, e aí o controle fino que este capítulo ensina deixa de decidir tudo sozinho.

```terminal
$ ping -c 5 8.8.8.8
PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.
64 bytes from 8.8.8.8: icmp_seq=1 ttl=118 time=11.4 ms
64 bytes from 8.8.8.8: icmp_seq=2 ttl=118 time=11.8 ms
64 bytes from 8.8.8.8: icmp_seq=3 ttl=118 time=11.6 ms
64 bytes from 8.8.8.8: icmp_seq=4 ttl=118 time=12.1 ms
64 bytes from 8.8.8.8: icmp_seq=5 ttl=118 time=11.5 ms
```

Comparar o RTT para o roteador (1 ms) com o RTT para a internet (11 ms) mostra que a porta de saída está numa fibra decente, e que praticamente todo o atraso da sessão interna vem do trecho local — que é exatamente onde você consegue intervir.

## Resumo

- Latência é o atraso do pacote; largura de banda é a capacidade do canal; throughput é o que de fato passa.
- RTT é o tempo de ida e volta, lido no campo `time` do `ping`.
- Jitter é a variação do atraso; o `mdev` do `ping` dá um indício, e o `iperf3` mede com precisão.
- Numa sessão local, a latência se acumula em encode, transmissão, buffer e decode — não só na rede.
- Para streaming local, busque RTT < 10 ms ao roteador e mdev pequeno; Wi-Fi congestionado é a fonte mais comum de jitter.

## Exercícios

1. Rode `ping -c 20 192.168.1.1` (ou o IP do seu roteador) e anote `avg`, `max` e `mdev`. Classifique o resultado em excelente, aceitável ou ruim pelos critérios da seção.
2. Repita o teste para `8.8.8.8`. Explique por que o RTT para a internet é maior e qual parcela você pode ou não controlar.
3. Execute `ping -c 100 192.168.1.1` e procure por picos: quantos pacotes ficaram acima de 2× o valor médio? Isso indica jitter alto?
4. Faça um gráfico mental do caminho do pacote entre host e cliente e aponte, com base na tabela da seção, em qual etapa você suspeita que está o maior atraso do seu setup.
5. **Desafio.** Rode o mesmo `ping` com o notebook conectado via cabo e depois via Wi-Fi no mesmo ponto da casa. Compare `avg` e `mdev` das duas capturas e relacione a diferença com a decisão de manter o host no cabo — usando o que você aprendeu sobre jitter aqui e sobre codec/bitrate nas próximas seções.
