Junto com as Steam Machines, a Valve apresentou o **Steam Link**: a promessa de que seu jogo rodaria no PC forte do escritório e apareceria na TV da sala, sem precisar mover a máquina. A ideia central era o **streaming caseiro** — transmitir a imagem e o som do jogo pela rede local, enquanto os comandos do controle voltavam pelo mesmo caminho. O hardware do Steam Link foi descontinuado, mas o conceito sobreviveu como aplicativo e, mais tarde, viraria a base do Remote Play do Steam Devra e do streaming no próprio Steam Deck.

:::objetivos
- Entender o conceito de streaming caseiro de jogos
- Conhecer o hardware Steam Link e seu funcionamento
- Saber usar o aplicativo Steam Link e o Remote Play
- Reconhecer a relação entre streaming e a arquitetura do SteamOS
:::

## O conceito: jogar longe do PC

Streaming de jogos é diferente de streaming de vídeo. Num vídeo, o servidor só envia; num jogo, cada comando seu precisa ser processado e devolvido em milissegundos. A latência (o atraso entre apertar um botão e ver a resposta) é o inimigo número um. O Steam Link foi desenhado para minimizar essa latência dentro de casa, onde a rede é rápida e o cabo físico é uma opção.

O fluxo funciona assim: o PC principal (host) renderiza o jogo, captura o vídeo, comprime e envia pela rede. Do outro lado, o Steam Link recebe, descomprime e exibe, ao mesmo tempo que devolve os comandos do controle. Todo esse vai-e-vem precisa caber em menos de uma dezena de milissegundos para que a experiência seja jogável.

## O hardware: uma caixinha de US$ 50

O Steam Link original era um aparelho pequeno, lançado em 2015 por US$ 50, com saída HDMI, porta Ethernet, três portas USB para controles e até suporte a rede sem fio. Ele não rodava jogos localmente: era apenas um receptor fino. Essa simplicidade o tornava barato a ponto de ser quase um acessório, e não um console.

```text
Steam Link (hardware, 2015)
─────────────────────────────────────────────
Preço de lançamento    US$ 49,99
Vídeo                  1080p @ 60 fps
Conectividade          Ethernet, Wi-Fi 802.11ac
Portas                 3x USB 2.0, HDMI, micro-USB
Requisito              Um PC host rodando Steam
```

O aparelho foi descontinuado em 2018, mas não por falha técnica — o streaming funcionava bem em rede cabeadis. O que matou o hardware foi a constatação de que ele era desnecessário: a mesma função podia ser cumprida por um aplicativo instalado em qualquer TV, celular ou computador fraco.

## O aplicativo e o Remote Play

A Valve manteve o nome "Steam Link" vivo como **aplicativo gratuito** para Android, iOS, Raspberry Pi e até smart TVs. Paralelamente, o recurso **Remote Play** permite que um cliente Steam transmita jogos de outro computador. O princípio é o mesmo do hardware, mas o "receptor" virou software.

Na prática, você pode, hoje, rodar um jogo pesado no seu desktop e jogá-lo no sofá usando o Steam Deck como receptor, via Remote Play. O Deck ainda tem uma função extra: o **Streaming**, que permite transmitir a própria tela do Deck para outro dispositivo (como uma TV ou o celular), invertendo a direção do fluxo.

:::dica
Para a melhor experiência de Remote Play, conecte o host e o receptor por cabo Ethernet. O Wi-Fi 5 GHz funciona bem em cenários leves, mas o cabo elimina o jitter (variação de latência), que é o que mais atrapalha a sensação de resposta.
:::

## Streaming e o SteamOS

É tentador pensar o Steam Link como algo separado do SteamOS, mas os dois são irmãos. Ambos nasceram da mesma estratégia: separar o jogo do hardware onde ele roda. O Steam Link separa por distância (rede); o SteamOS separa por sistema operacional (Linux em vez de Windows). No fundo, a ideia é idêntica — fazer o catálogo do Steam chegar a qualquer lugar, em qualquer tela.

O SteamOS 3, no Deck, oferece o streaming de duas formas. A primeira é o Remote Play (o Deck como receptor ou transmissor). A segunda é a possibilidade de **instalar jogos que não rodam bem nativamente** e transferi-los para outro PC via streaming. Isso cria uma saída elegante para títulos com anti-cheat incompatível com Linux: em vez de rodá-los no Deck, roda-se no PC e transmite-se para o Deck.

:::nota
Jogos com anti-cheat em modo kernel frequentemente não funcionam no Proton, [como detalhado na seção sobre Proton](#/cap-003/sec-06). O streaming é uma das formas de contornar essa limitação: o jogo roda no Windows, e o Deck vira apenas a tela e o controle.
:::

## Um teste rápido de latência

A latência de rede é mensurável do próprio host. Um teste simples entre dois computadores da casa, usando `ping`, dá uma ideia grosseira do atraso que o streaming enfrentará:

```terminal
$ ping -c 5 192.168.1.105
PING 192.168.1.105 (192.168.1.105) 56(84) bytes of data.
64 bytes from 192.168.1.105: icmp_seq=1 ttl=64 time=1.2 ms
64 bytes from 192.168.1.105: icmp_seq=2 ttl=64 time=1.1 ms
64 bytes from 192.168.1.105: icmp_seq=3 ttl=64 time=1.3 ms
64 bytes from 192.168.1.105: icmp_seq=4 ttl=64 time=1.4 ms
64 bytes from 192.168.1.105: icmp_seq=5 ttl=64 time=1.2 ms

--- 192.168.1.105 ping statistics ---
5 packets transmitted, 5 received, 0% packet loss, time 8ms
rtt min/avg/max/mdev = 1.1/1.2/1.4/0.1 ms
```

Uma latência média de `1.2 ms` em rede cabeada é excelente para streaming. Valores acima de 10–15 ms já começam a ser perceptíveis em jogos de ação rápida, e perda de pacotes (`packet loss`) acima de zero indica que o Wi-Fi está sofrendo interferência.

:::atencao
O `ping` mede apenas o atraso da rede, não o atraso total do streaming, que inclui o tempo de captura, compressão e decodificação do vídeo — normalmente dezenas de milissegundos adicionais. Use o `ping` como teste de sanidade da rede, não como medida da latência de jogo.
:::

## Resumo

- O Steam Link (2015) fazia streaming caseiro do PC para a TV por US$ 50.
- Streaming de jogos exige latência baixa, o que favorece rede cabeada.
- O hardware foi descontinuado em favor do aplicativo Steam Link e do Remote Play.
- O Steam Deck pode ser receptor ou transmissor de streaming.
- Streaming é uma alternativa para jogos com anti-cheat incompatível com Linux.

## Exercícios

1. Em uma rede com dois computadores, meça a latência entre eles usando `ping -c 5 <ip>` e interprete o resultado.
2. Explique a diferença entre streaming de vídeo e streaming de jogo, destacando o papel da latência.
3. Liste as duas direções de streaming possíveis no Steam Deck e dê um exemplo de uso para cada uma.
4. Pesquise quais plataformas oferecem o aplicativo Steam Link hoje e em quais ele não existe mais.
5. **Desafio.** Configure um fluxo de Remote Play entre o seu Steam Deck e um computador rodando Steam, e experimente jogar um título leve. Registre a latência percebida e compare com o resultado do seu `ping`.