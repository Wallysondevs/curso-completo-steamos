Quando o streaming falha — tela congelada, imagem pixelada, áudio robótico ou desconexão súbita — a interface gráfica do Steam raramente explica o motivo. Os sintomas são vagos, mas as causas são diagnosticáveis com ferramentas de linha de comando. Esta seção cobre o protocolo de diagnóstico: da checagem óbvia (a rede está funcionando?) até a inspeção detalhada dos logs do Steam.

:::objetivos
- Diagnosticar falhas de streaming com `ping`, `ss`, `iw` e `journalctl`
- Correlacionar sintomas visuais (artefatos, congelamento, queda) com causas de rede
- Ler os logs do Steam para identificar erros de codec e conexão
- Testar perda de pacotes, jitter e MTU como causas de streaming ruim
- Usar o `steam` com flags de debug para capturar logs detalhados
:::

## Protocolo de diagnóstico: do simples ao profundo

Quando o streaming falha, siga esta ordem. Cada etapa descarta um conjunto de causas:

**Etapa 1: A rede está viva?** Um `ping` entre Deck e cliente responde em 2 segundos.

```terminal
$ ping -c 5 192.168.1.101
PING 192.168.1.101 (192.168.1.101) 56(84) bytes of data.
From 192.168.1.50 icmp_seq=1 Destination Host Unreachable
From 192.168.1.50 icmp_seq=2 Destination Host Unreachable
...
## Host unreachable: o cliente não está na rede ou o IP mudou.
## Verifique o IP do cliente e se ele está ligado.
```

Se o ping funciona, passe para a etapa 2. Se não, o problema é de conectividade básica — Wi-Fi desligado, IP errado, cliente fora da rede.

**Etapa 2: As portas do Steam estão abertas?** Execute `ss -tulnp | grep steam` no Deck e verifique se as portas 27031, 27032 e 27036 estão em LISTEN/UNCONN.

**Etapa 3: O cliente está visível?** Se o Steam Link não acha o Deck, tente o pareamento manual: no Steam Link, vá em Settings > Computers > Add Computer e digite o IP do Deck.

**Etapa 4: Há perda de pacotes?** Um `ping` prolongado revela packet loss:

```terminal
$ ping -c 100 -i 0.1 192.168.1.101 | tail -5
--- 192.168.1.101 ping statistics ---
100 packets transmitted, 94 received, 6% packet loss, time 10123ms
rtt min/avg/max/mdev = 2.180/8.456/145.321/22.134 ms
```

Perda de 6% e um desvio padrão de 22 ms (com máximo de 145 ms) indicam uma rede Wi-Fi instável. Para streaming, a perda de pacotes precisa ser **zero ou próxima de zero**. Qualquer perda visível em `ping` se traduz em artefatos ou congelamento no stream.

**Etapa 5: O sinal Wi-Fi está fraco?** O comando `iw dev wlan0 link` mostra a potência do sinal:

```terminal
$ iw dev wlan0 link | grep -E 'signal|bitrate|freq'
	freq: 2462
	signal: -78 dBm
	rx bitrate: 144.4 MBit/s
```

Sinal de -78 dBm é fraco (perto do limite) e a frequência 2462 MHz é 2.4 GHz. Essa combinação é inadequada para streaming — o bitrate de recepção de apenas 144 Mbps (quando o esperado em 5 GHz é 500–866 Mbps) confirma. A solução é trocar para 5 GHz ou aproximar-se do roteador.

## Lendo os logs do Steam

Quando as etapas de rede passam mas o streaming ainda falha, o problema está no software. O Steam escreve logs detalhados em `~/.steam/steam/logs/`:

```terminal
$ ls -lt ~/.steam/steam/logs/ | head -5
-rw-r--r-- 1 deck deck  125432 Aug 16 18:45 streaming_log.txt
-rw-r--r-- 1 deck deck   89456 Aug 16 18:45 remote_connections.txt
-rw-r--r-- 1 deck deck   45231 Aug 16 18:45 vrserver.txt
```

O arquivo `streaming_log.txt` é o diário completo do streaming: cada tentativa de conexão, codec negociado, bitrate selecionado e erro. Procure por linhas com `ERROR`, `FAIL` ou `timeout`:

```terminal
$ grep -i -E 'error|fail|timeout' ~/.steam/steam/logs/streaming_log.txt | tail -20
[2025-08-16 18:42:11] ERROR: Failed to initialize encoder: VA-API device not available
[2025-08-16 18:42:11] Streaming session aborted: encoder initialization failed
```

Se aparecer "VA-API device not available", o hardware encoder não está acessível — possível causa: driver de vídeo corrompido após atualização do sistema, ou outro processo bloqueando o dispositivo. Reiniciar o Steam (ou o Deck) normalmente resolve.

```terminal
$ grep -i "codec" ~/.steam/steam/logs/streaming_log.txt | tail -10
[2025-08-16 18:40:05] Negotiated codec: H.264 (client preference)
[2025-08-16 18:40:05] Encoder: AMD AMF H.264, Decoder: client-reported H.264
[2025-08-16 18:40:05] Bitrate: 15000 kbps, Resolution: 1920x1080 @ 60 FPS
```

Aqui o log confirma codec, bitrate e resolução negociados. Se o codec não for o esperado (você configurou HEVC mas aparece H.264), o cliente não suporta HEVC e o Steam fez fallback silenciosamente.

## Steam com flags de debug

Para problemas persistentes, execute o Steam pelo terminal com a flag `-streamingdebug` — ela ativa logs mais verbosos especificamente para streaming:

```terminal
$ steam -streamingdebug > /tmp/steam_debug.log 2>&1 &
```

Com o Steam rodando nesse modo, reproduza o problema e depois inspecione `streaming_log.txt`, que agora terá muito mais detalhes: negociação de codec, buffers de rede, estatísticas de frames perdidos e timestamps de cada etapa do pipeline.

:::perigo
Não execute `steam` como root. O Steam foi projetado para rodar no espaço do usuário, e executá-lo com `sudo` pode corromper permissões de arquivos em `~/.steam`, além de ser um risco de segurança.
:::

## MTU e fragmentação

Um problema sutil que causa streaming ruim é o MTU (Maximum Transmission Unit) inadequado. Se o MTU da rede for menor que o esperado, os pacotes de vídeo (que são grandes, até 1500 bytes) são fragmentados, aumentando a latência e o risco de perda:

```terminal
$ ip link show wlan0 | grep mtu
3: wlan0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP mode DORMANT group default qlen 1000
```

MTU 1500 é o padrão para Ethernet e Wi-Fi. Se aparecer um valor menor (ex.: 1492, comum em PPPoE, ou 1280, comum em túneis), o stream pode sofrer com fragmentação excessiva. Ajuste o MTU com `sudo ip link set dev wlan0 mtu 1500` (se a rede suportar).

## Resumo

- Siga o protocolo de diagnóstico em ordem: `ping` → `ss` → descoberta → perda de pacotes → sinal Wi-Fi → logs.
- Perda de pacotes acima de 0% em `ping -c 100` é inaceitável para streaming; investigue o sinal Wi-Fi ou interferência.
- `~/.steam/steam/logs/streaming_log.txt` contém o registro de codec negociado, bitrate e erros de encoder.
- Execute `steam -streamingdebug` para logs detalhados de streaming durante sessões de depuração.
- MTU diferente de 1500 pode causar fragmentação de pacotes de vídeo e aumentar a latência.

## Exercícios

1. Simule uma falha: desligue o Remote Play no Deck e tente conectar do cliente. Leia `streaming_log.txt` e encontre a mensagem de erro correspondente.
2. Execute `ping -c 100 -i 0.1` entre Deck e cliente durante 10 segundos. A perda de pacotes é zero? Se houver perda, investigue com `iw dev wlan0 link`.
3. Force um cenário de codec não suportado: configure o cliente (se possível) para HEVC e o servidor para H.264. O que o `streaming_log.txt` registra sobre a negociação?
4. Inicie o Steam com `steam -streamingdebug`, reproduza um problema de streaming e localize no log a linha que mostra o bitrate e a resolução negociados.
5. **Desafio.** Use `tc` para simular perda de pacotes: `sudo tc qdisc add dev wlan0 root netem loss 3%`. Inicie um stream e observe o comportamento visual. Depois, aumente para 10% e veja se o stream sequer conecta. Remova com `sudo tc qdisc del dev wlan0 root`.