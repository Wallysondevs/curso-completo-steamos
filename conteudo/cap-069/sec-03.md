Bitrate é a quantidade de dados que o codec produz por segundo, e é o botão mais direto que você tem para trocar qualidade por fluidez. Alta demais, a taxa estoura o enlace e gera perda de pacotes; baixa demais, a imagem vira uma sopa de blocos. Entre esses dois extremos mora o ponto ótimo, que varia com a resolução, o frame rate e o conteúdo do jogo.

:::objetivos
- Entender a relação entre resolução, frame rate e bitrate
- Estimar o bitrate necessário para cada combinação de resolução/FPS
- Identificar os sintomas de bitrate alto demais ou baixo demais
- Ajustar o limite de bitrate no Steam Remote Play
:::

## A aritmética de resolução e frame rate

Bitrate não existe no vácuo: ele precisa ser proporcional ao volume de informação visual que você empurra por segundo. Duas variáveis comandam esse volume.

**Resolução** define quantos pixels há em cada frame. Passar de 1080p (1920×1080) para 4K (3840×2160) **quadruplica** os pixels — são quatro vezes mais detalhes para o codec descrever. Para a mesma qualidade por pixel, o bitrate precisa multiplicar-se, embora na prática o codec aproveite a redundância e o aumento seja menor que 4×.

**Frame rate** define quantos frames novos aparecem por segundo. Duplicar de 30 para 60 FPS não dobra o bitrate necessário, porque frames consecutivos são muito parecidos e o codec só transmite a diferença. Ainda assim, cenas com muito movimento a 60 FPS pedem bem mais dados do que a mesma cena parada.

A conta de referência aproximada, para H.264 em qualidade boa:

| Resolução @ FPS | Bitrate recomendado (H.264) |
|---|---|
| 720p @ 60 | 8 a 15 Mbps |
| 1080p @ 60 | 15 a 30 Mbps |
| 1440p @ 60 | 25 a 50 Mbps |
| 4K @ 60 | 45 a 80 Mbps |

Com HEVC, corte esses valores pela metade para a mesma qualidade — é literalmente o "metade do bitrate" que vimos no [comparativo de codecs](#/cap-069/sec-02).

## A janela que o Remote Play oferece

No cliente Steam, as opções de streaming deixam você escolher resolução e frame rate, e normalmente deixam o bitrate em "automático". O modo automático tenta medir o enlace e ajustar sozinho — conveniente, mas nem sempre ótimo.

```terminal
$ steam -bigpicture
## No cliente, abra Configurações > Remote Play > Opções avançadas do cliente
## Limite de largura de banda: Automático / 3 / 5 / 10 / 15 / 20 / 25 / 30 / 40 / 75 Mbps
## Quadros por segundo: Automático / 30 / 60
## Resolução: Automático / 480p / 720p / 1080p
```

O campo "Limite de largura de banda" é exatamente o teto de bitrate. Deixá-lo em "Automático" faz o algoritmo subir e descer a taxa conforme a rede oscila. Fixá-lo num número tem duas utilidades: impedir que o algoritmo tente ultrapassar a capacidade real do seu enlace, e dar previsibilidade para o diagnóstico.

:::dica
Comece sempre pelo automático e anote o que ele escolhe em condições estáveis. Depois fixe um valor um ou dois degraus **abaixo** do teto medido do enlace. Deixar folga de 10 a 15% absorve picos de jitter sem virar perda de pacote.
:::

## Os dois sintomas e seus diagnósticos

Bitrate errado grita de duas maneiras opostas, e saber distingui-las evita mexer no lugar errado.

**Bitrate baixo demais** produz **artefatos de compressão**: blocos visíveis, borrão nas bordas de objetos em movimento, "dente de serra" em texto e gradientes com faixas de cor. A imagem não trava — ela está lá, mas feia e pastosa. A rede está entregando tudo; falta é orçamento de dados.

**Bitrate alto demais** produz **engasgos e perda**: a imagem congela por instantes, o áudio pica, aparece a mensagem "conexão lenta". O enlace não dá conta do fluxo, o buffer esvazia e o client para para recuperar. Aqui não falta qualidade — sobra dado para o cano.

O diagnóstico correto exige separar os dois. Se a imagem é constante e apenas brega, aumente o bitrate (ou a resolução está alta demais para o bitrate). Se congela e perde, reduza o bitrate ou a resolução até caber no enlace.

```terminal
$ ping -i 0.2 192.168.1.20
PING 192.168.1.20 (192.168.1.20) 56(84) bytes of data.
64 bytes from 192.168.1.20: icmp_seq=1 ttl=64 time=2.1 ms
64 bytes from 192.168.1.20: icmp_seq=2 ttl=64 time=2.3 ms
64 bytes from 192.168.1.20: icmp_seq=45 ttl=64 time=89.4 ms
64 bytes from 192.168.1.20: icmp_seq=46 ttl=64 time=91.7 ms
64 bytes from 192.168.1.20: icmp_seq=47 ttl=64 time=2.2 ms
...
```

Repare no padrão: durante um pico de bitrate, o RTT dispara para ~90 ms por alguns pacotes e volta. Esse "soluço em bloco" é o buffer do enlace enchendo e esvaziando — assinatura clássica de bitrate acima da capacidade, não de sinal fraco contínuo.

## Resolução alta × bitrate fixo: a verdade incômoda

Uma armadilha comum é cravar 4K ou 1080p e um bitrate modesto, achando que ganha qualidade. Na prática o oposto acontece: com resolução alta e bitrate baixo, cada pixel recebe pouquíssimos dados, e o codec gera uma imagem **mais feia do que** a mesma cena em 720p com bitrate adequado.

A regra é simples: resolução e bitrate andam juntos. Se o enlace só aguenta 15 Mbps com conforto, 1080p a 60 FPS em H.264 vai sofrer; 720p a 60 FPS no mesmo enlace sai limpo. Muitas vezes a forma mais barata de "melhorar" a imagem é **baixar** a resolução, não subi-la.

:::atencao
Resolução maior com o mesmo bitrate reduz a qualidade **por pixel**. Não transforme "4K" em meta religiosa: no streaming, a meta é o maior bitrate útil por pixel que o enlace comporta sem perder pacotes. Uma imagem 1440p limpa derrota uma 4K toda blocada.
:::

## Dimensionando o seu enlace

Antes de escolher qualquer número, meça o teto real do caminho entre host e cliente. O `iperf3` responde com precisão — já no [diagnóstico de throughput](#/cap-069/sec-06) você roda o teste completo. Por ora, guarde a regra de bolso:

```terminal
$ iperf3 -c 192.168.1.20
Connecting to host 192.168.1.20, port 5201
[  5] local 192.168.1.10 port 51234 connected to 192.168.1.20 port 5201
[ ID] Interval           Transfer     Bitrate         Retr
[  5]   0.00-10.00  sec  112 MBytes  93.9 Mbits/sec    0 sender
[  5]   0.00-10.00  sec  111 MBytes  93.4 Mbits/sec      receiver
```

Esse enlace entrega ~94 Mbps. Aplicando a folga de 15%, o teto seguro de bitrate de streaming gira em torno de 75 a 80 Mbps — que na verdade sobra para qualquer resolução razoável. O gargalo do streaming doméstico raramente é a capacidade bruta; é a estabilidade (jitter) e a escolha de resolução/bitrate coerente.

Uma vez que você tem o teto, monte a decisão assim: defina a resolução pelo tamanho e distância da tela do cliente, calcule o bitrate-alvo pela tabela do codec escolhido, e só então confira se esse valor, com folga, cabe no enlace medido.

## Resumo

- Bitrate é a taxa de dados por segundo; precisa escalar com resolução e frame rate.
- HEVC exige cerca de metade do bitrate do H.264 para a mesma qualidade.
- Bitrate baixo demais gera artefatos; alto demais gera engasgos e perda de pacotes.
- Resolução alta com bitrate baixo pode piorar a imagem em vez de melhorá-la.
- Meça o teto do enlace com `iperf3` e deixe 10 a 15% de folga antes de fixar o limite.

## Exercícios

1. Calcule, pela tabela da seção, o bitrate-alvo para 1080p@60 em H.264 e em HEVC. Anote a diferença.
2. No cliente Steam, alterne o limite de bitrate entre um valor baixo (3 Mbps) e o automático. Descreva visualmente a diferença de qualidade em uma cena com movimento rápido.
3. Execute `ping -i 0.2 192.168.1.20` durante uma sessão e identifique, no padrão de RTT, se o enlace está sendo estourado (picos em bloco) ou se há sinal fraco contínuo.
4. Escolha uma resolução acima da suportada pelo seu enlace e escreva por que ela produziria uma imagem pior do que uma resolução menor com o bitrate certo.
5. **Desafio.** Meça o teto do enlace com `iperf3`, aplique a folga e proponha uma configuração completa (codec, resolução, frame rate e bitrate fixo) para uma sessão de Remote Play 1080p. Justifique cada número usando o que aprendeu neste capítulo sobre codec, bitrate e latência.
