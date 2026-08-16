`ping` é o primeiro — e muitas vezes o único — comando de rede que a maioria das pessoas já usou. Ele envia pacotes ICMP Echo Request e espera pelos Echo Reply, medindo o tempo de cada ida e volta. Simples na superfície, o `ping` esconde detalhes de diagnóstico que o tornam a ferramenta de triagem mais rápida para problemas de streaming: perda de pacote, latência, jitter e até mudanças de rota.

:::objetivos
- Dominar as opções mais úteis do `ping` para diagnóstico
- Interpretar perda de pacote, RTT e mdev numa captura
- Usar `ping` para localizar onde a rede começa a falhar
- Distinguir o que o `ping` mede do que ele não mede
:::

## O que o ping realmente mede

Cada linha de resposta do `ping` carrega quatro informações: o endereço de origem do eco, o número de sequência (`icmp_seq`), o TTL — time-to-live, que decrementa a cada roteador atravessado — e o tempo em milissegundos. O `icmp_seq` permite detectar reordenação e perda: se a sequência pula de 3 para 5, o pacote 4 se perdeu ou chegou fora de ordem.

```terminal
$ ping -c 5 192.168.1.20
PING 192.168.1.20 (192.168.1.20) 56(84) bytes of data.
64 bytes from 192.168.1.20: icmp_seq=1 ttl=64 time=1.20 ms
64 bytes from 192.168.1.20: icmp_seq=2 ttl=64 time=1.31 ms
64 bytes from 192.168.1.20: icmp_seq=4 ttl=64 time=1.18 ms
64 bytes from 192.168.1.20: icmp_seq=5 ttl=64 time=1.22 ms
```

Repare: o `icmp_seq=3` não aparece. Um pacote se perdeu. Para uma sessão de streaming, uma perda isolada em 5 pode não parecer muito, mas em fluxo contínuo toda perda vira retransmissão ou frame ausente. O `ping` com contagem alta expõe esse padrão com clareza.

## As opções que de fato importam

Quatro flags cobrem 90% dos diagnósticos:

- `-c N` limita a quantidade de pacotes, para que o comando termine sozinho.
- `-i S` define o intervalo entre envios. O padrão é 1 segundo; reduzir para 0,2 s estressa o enlace e revela jitter que um pacote por segundo esconderia.
- `-s N` aumenta o tamanho do payload. O padrão é 56 bytes; pacotes maiores atravessam mais camadas e expõem fragmentação ou enlaces que caem com carga.
- `-f` (flood) dispara o máximo possível, sem esperar. Requer root e é agressivo — use com parcimônia, só em rede própria.

```terminal
$ ping -c 3 -s 1400 -i 0.2 192.168.1.20
PING 192.168.1.20 (192.168.1.20) 1400(1428) bytes of data.
1408 bytes from 192.168.1.20: icmp_seq=1 ttl=64 time=1.85 ms
1408 bytes from 192.168.1.20: icmp_seq=2 ttl=64 time=1.91 ms
1408 bytes from 192.168.1.20: icmp_seq=3 ttl=64 time=1.88 ms

--- 192.168.1.20 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 412ms
rtt min/avg/max/mdev = 1.850/1.880/1.910/0.025 ms
```

Payload de 1400 bytes aproxima o tamanho real dos pacotes de vídeo, que carregam centenas de bytes a mais que um ping comum. Se o enlace aguenta 1400 bytes com mdev baixo, ele carrega streaming. Se o mdev dispara só com payload grande, o suspeito muda para MTU, fragmentação ou um enlace que degrada sob carga.

:::dica
Para detectar problemas de MTU (tamanho máximo do quadro), use `ping -s N -M do`. O `-M do` proíbe fragmentação: se um payload grande retorna "Message too long" ou perde tudo, há um descompasso de MTU no caminho — causa clássica de streaming que mesmo assim navega na web.
:::

## Localizando a falha de dentro pra fora

O diagnóstico em camadas segue uma ordem: primeiro o próprio host, depois o roteador, depois o vizinho local, depois a internet. Cada passo isola um trecho.

```terminal
$ ping -c 3 127.0.0.1
## loopback, testa a pilha TCP/IP local
3 packets transmitted, 3 received, 0% packet loss
$ ping -c 3 192.168.1.1
## roteador/gateway, testa o trecho até a porta de saída
rtt min/avg/max/mdev = 0.45/0.49/0.52/0.02 ms
$ ping -c 3 192.168.1.20
## o outro host da sessão, testa o caminho completo
rtt min/avg/max/mdev = 1.20/1.28/1.35/0.05 ms
$ ping -c 3 8.8.8.8
## internet, testa a rota de saída e o provedor
rtt min/avg/max/mdev = 11.2/11.6/11.9/0.3 ms
```

Leia de cima para baixo. Se o loopback falha, o problema é a pilha local (raro). Se falha no gateway mas o loopback passa, o problema está entre você e o roteador (cabo, Wi-Fi, switch). Se o host local falha mas o gateway responde, o problema está no alvo ou entre roteador e alvo. Esse mapa mental transforma "a rede está lenta" em uma localização concreta.

## O que o ping não vê

O `ping` é ICMP, e redes reais frequentemente tratam ICMP de forma diferente do tráfego de vídeo. Roteadores podem priorizar ou até descartar ICMP sob carga; um firewall pode silenciar eco sem afetar o streaming. Resultado: um `ping` perfeito não garante sessão perfeita, e um `ping` ruim pode ser falso alarme.

Além disso, o `ping` mede o caminho da camada de rede, sem os buffers de codec. Uma sessão pode ter RTT de rede ótimo e ainda engasgar por problemas de encode — como visto na [discussão de latência](#/cap-069/sec-01). Ele é o primeiro passo, nunca o diagnóstico final.

:::atencao
Não conclua "a rede está ótima" por um `ping -c 4` com zero de perda. Quatro pacotes em intervalos de 1 segundo escondem jitter intermitente. Para streaming, rode contagens altas (`-c 100`) com intervalo curto (`-i 0.2`) e olhe o `mdev` e o `max`, não só o `avg`.
:::

## Rastreando a rota

Quando o problema está além do gateway, o `ping` também serve de sonda de rota. O TTL de cada resposta indica quantos roteadores o pacote atravessou até voltar. Variar o TTL manualmente revela os saltos:

```terminal
$ ping -c 1 -t 1 8.8.8.8
From 192.168.1.1 icmp_seq=1 Time to live exceeded
$ ping -c 1 -t 2 8.8.8.8
From 10.0.0.1 icmp_seq=1 Time to live exceeded
$ ping -c 1 -t 3 8.8.8.8
64 bytes from 8.8.8.8: icmp_seq=1 ttl=117 time=11.4 ms
```

Cada "Time to live exceeded" vem de um roteador diferente (aqui o gateway 192.168.1.1 e depois o 10.0.0.1 do provedor). Esse é o mecanismo por trás do `traceroute`. Para streaming local ele quase nunca é necessário, mas quando o cliente acessa o host pela internet, saber fazer esse rastreio manual ajuda a identificar se a demora está no trecho doméstico ou no provedor.

## Resumo

- `ping` envia ICMP Echo Request e mede RTT, perda, TTL e jitter por pacote.
- Flags essenciais: `-c` (contagem), `-i` (intervalo), `-s` (tamanho), `-M do` (proíbe fragmentação).
- Diagnostique de dentro pra fora: loopback, gateway, host local, internet — cada passo isola um trecho.
- `ping` mede ICMP, não o tráfego de vídeo; use contagens altas e intervalo curto para ver jitter.
- Variando o TTL você reconstrói a rota manualmente, base do `traceroute`.

## Exercícios

1. Rode `ping -c 100 -i 0.2` para o roteador e para o outro host da sessão. Compare perda, `avg` e `mdev` dos dois alvos.
2. Use `ping -s 1400 -c 10` no enlace local e explique o que um mdev alto com payload grande indica sobre MTU ou degradação sob carga.
3. Teste o caminho em camadas (loopback, gateway, host, internet) e escreva qual trecho da sua rede está mais saudável.
4. Rode `ping -s 2000 -M do 192.168.1.20` e veja se surge fragmentação. O que o resultado diz sobre o MTU do caminho?
5. **Desafio.** Reconstrua manualmente os primeiros saltos até `8.8.8.8` variando `-t` de 1 em 1, e identifique em qual salto o RTT dá o maior salto. Relacione esse salto com a decisão de jogar Remote Play local (cabo) versus remoto (internet) do capítulo sobre rede cabeada.
