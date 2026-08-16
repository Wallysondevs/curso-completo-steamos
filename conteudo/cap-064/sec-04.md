O Remote Play codifica o vídeo no PC e o transmite ao Deck. Isso significa que você está vendo um vídeo, não uma renderização nativa — e a qualidade dessa imagem depende de três parâmetros que interagem entre si: resolução, taxa de quadros e bitrate. Mexer num deles sem entender os outros é o erro mais comum de quem acha que o Remote Play "parece borrado".

:::objetivos
- Entender a relação entre resolução, bitrate e taxa de quadros no pipeline de streaming
- Configurar o bitrate dinâmico e manual para diferentes tipos de rede
- Escolher a resolução de saída com base na tela do Deck (1280×800 ou 1920×1080)
- Diagnosticar artefatos de compressão e diferenciá-los de queda de frames
- Aproveitar as opções de nitidez e suavização do cliente
:::

## A trindade do streaming: resolução, fps, bitrate

Imagine uma mangueira de água: a resolução é o diâmetro do cano, a taxa de quadros é a velocidade da água, e o bitrate é quantos litros por segundo a caixa d'água consegue fornecer. Se a mangueira é larga (4K) e a água corre rápido (120 fps), mas a caixa d'água é pequena (10 Mbit/s), a pressão cai — no streaming, a queda de pressão se traduz em artefatos de compressão, blocos de cor e perda de detalhe em movimento.

A tela do Steam Deck tem 1280×800 pixels (800p, proporção 16:10). Para essa resolução, as recomendações práticas de bitrate (em Mbit/s, para H.264) são:

| Resolução de transmissão | 30 fps | 60 fps | H.265/HEVC (reduz ~30%) |
|---|---|---|---|
| 720p (1280×720) | 5-8 Mbit/s | 10-15 Mbit/s | 3-6 / 7-12 |
| 800p (1280×800) | 7-10 Mbit/s | 12-18 Mbit/s | 5-8 / 9-14 |
| 1080p (1920×1080) | 12-18 Mbit/s | 20-30 Mbit/s | 9-14 / 15-22 |

O Steam Deck LCD usa 800p nativo, então transmitir acima de 800p é supérfluo — os pixels extras são descartados no downscale, consumindo banda à toa. No modelo OLED, a tela é ligeiramente maior (resolução similar), mas suporta 90 Hz e HDR — nesse caso, 1080p com HEVC só se justifica se você dockar o Deck numa TV.

## Bitrate: dinâmico versus fixo

O **bitrate dinâmico** deixa o Steam ajustar a taxa automaticamente com base na qualidade da rede, subindo o bitrate quando o link está limpo e reduzindo quando há congestionamento. A maioria dos usuários deve começar com ele ativo. O **bitrate fixo** (desabilitar o dinâmico e definir um valor manual no PC hospedeiro) só faz sentido em redes previsíveis — Ethernet dedicada ou Wi-Fi 5 GHz com canal livre.

```terminal
$ ping -c 100 -i 0.05 -q 192.168.1.100
PING 192.168.1.100 56(84) bytes of data.

--- 192.168.1.100 ping statistics ---
100 packets transmitted, 100 received, 0% packet loss, time 5012ms
rtt min/avg/max/mdev = 0.812/1.534/4.102/0.601 ms
```

Com um ping estável e desvio padrão abaixo de 1 ms, vale a pena testar bitrate fixo em 20-25 Mbit/s para 800p a 60 fps. Se o mdev sobe acima de 2 ms ou há perda de pacotes, mantenha o dinâmico.

:::atencao
No Steam Deck, o contador de desempenho (nível 4) mostra a linha "Streaming: X Mbit/s". Se esse número oscila muito num intervalo de segundos (ex.: salta de 12 para 3 e volta para 18), o *dynamic bitrate* está reagindo a variações de rede. Isso é normal — mas se o valor fica cravado no topo e o vídeo continua borrado, você pode estar com packet loss, não com falta de bitrate.
:::

## Diagnosticando artefatos: compressão versus perda de frames

Um erro clássico é atribuir todo problema visual a "bitrate baixo". Há duas famílias distintas de defeito visual:

**Artefatos de compressão.** Blocos de 8×8 ou 16×16 pixels visíveis em cenas com movimento rápido, degradê de céu ou folhagem. O bitrate é insuficiente para codificar a complexidade da cena. Solução: aumentar o bitrate ou reduzir resolução (menos pixels para codificar = menos compressão por pixel).

**Queda de frames (frame drop).** O stream "pula" um frame inteiro porque o pacote dele não chegou a tempo. A imagem dá um salto perceptível. Solução: reduzir o bitrate (menos dados = menos congestionamento), trocar de canal Wi-Fi ou usar Ethernet.

```terminal
$ netstat -s | grep -i "segments retrans"
    345 segments retransmitted
$ ss -ti | grep -A 1 "192.168"
ESTAB  0  0  192.168.1.50:45312  192.168.1.100:27036
     cubic wscale:7,7 rto:208 rtt:1.234/0.512 mss:1448 pgst:0 bytes:12480
```

O `netstat -s` mostra retransmissões TCP totais; o `ss -ti` exibe métricas em tempo real por conexão, com RTT e RTO. Mas o Remote Play usa UDP — esses indicadores são úteis apenas como proxy de saúde geral da rede.

Para o streaming especificamente, o overlay de desempenho do Steam (nível 4) mostra perda de frames no campo **Streaming**. Uma versão programática de consulta ao contador do Steam não existe como CLI, mas o `iw` pode ler estatísticas de rádio e correlacionar com perda:

```terminal
$ iw dev wlan0 station dump | grep -i -E "signal|bitrate|tx retry"
        signal:         -48 dBm
        rx bitrate:     866.7 MBit/s VHT-MCS 9 80MHz short GI
        tx bitrate:     866.7 MBit/s VHT-MCS 9 80MHz short GI
        tx retries:     12
```

Um sinal de -48 dBm com 866 Mbit/s de largura de banda de rádio e apenas 12 retransmissões desde que o Deck conectou é um enlace limpo. Se o sinal cai abaixo de -65 dBm, as retransmissões sobem e o streaming começa a perder pacotes.

## Nitidez e suavização no cliente

No Deck, as opções **Automática**, **Rápida**, **Equilibrada** e **Bonita** são atalhos para presets de codificação que mexem em três variáveis ao mesmo tempo: bitrate máximo, perfil de codificação H.264 (Baseline/Main/High) e presets do codificador (priorizar velocidade vs. qualidade):

| Perfil | Bitrate máx. | Codificação | Uso |
|---|---|---|---|
| Rápida | ~10 Mbit/s | H.264 Baseline, preset fast | Menos latência, imagem ok |
| Equilibrada | ~20 Mbit/s | H.264 Main, preset medium | Bom compromisso custo/qualidade |
| Bonita | ~30-50 Mbit/s | H.264 High, preset slow | Máxima qualidade, mais latência de encode |

A diferença prática: em "Bonita", o encode no PC pode adicionar 3-5 ms a mais de latência em troca de uma imagem mais limpa. Para RPGs e jogos de turno, vale a pena. Para jogos de ação rápida, "Equilibrada" ou "Rápida" podem fazer mais diferença na jogabilidade do que a melhora visual.

:::dica
Em jogos com muito texto pequeno ou interfaces complexas (RPGs, simuladores), a diferença entre "Rápida" e "Bonita" é gritante — os caracteres ficam ilegíveis nos modos de bitrate baixo. Nesse caso, subir para "Bonita" ou reduzir a resolução para 720p (em vez de 800p) pode melhorar a legibilidade mais do que qualquer outro ajuste.
:::

## Resumo

- A tela de 800p do Deck é o sweet spot: bitrate de 12-18 Mbit/s para 60 fps H.264, 9-14 Mbit/s para HEVC.
- Bitrate dinâmico é o padrão recomendado; fixo só em redes estáveis com mdev de ping abaixo de 1 ms.
- Artefatos de compressão (blocos) indicam bitrate insuficiente para a cena; frame drops (salto) indicam perda de pacotes.
- O perfil "Equilibrada" é o melhor compromisso para a maioria dos jogos no Deck.
- Reduzir a resolução pode melhorar a qualidade visual mais que aumentar o bitrate, porque há menos pixels para comprimir.

## Exercícios

1. Transmita o mesmo jogo nos quatro perfis (Automática, Rápida, Equilibrada, Bonita) e compare a legibilidade de texto e nitidez de bordas. Qual perfil entrega o melhor custo-benefício na sua rede?
2. Ative o contador de desempenho nível 4 (seção 8) e observe o bitrate durante 2 minutos. Ele oscila? Qual o valor máximo e o mínimo registrados?
3. Faça dois testes na mesma cena de jogo: um com 800p e 15 Mbit/s, outro com 1080p e 15 Mbit/s. Qual parece mais nítido no Deck? Por quê?
4. Se sua rede permite, teste HEVC vs H.264: no mesmo bitrate fixo, a imagem melhora com HEVC?
5. **Desafio.** Escolha um jogo com movimento rápido (corrida, ação) e um com cena estática (estratégia, puzzle) e determine, para cada um, o bitrate mínimo no qual os artefatos de compressão ficam imperceptíveis. Os valores são iguais?