Configurar encoder e bitrate é meio caminho. A outra metade é a rede: o streaming de jogos é tráfego UDP em tempo real — não há retransmissão como no TCP. Cada pacote perdido é um frame que nunca chega ao Deck. Esta seção mergulha nos parâmetros de rede que fazem a diferença entre uma experiência fluida e uma apresentação de slides.

:::objetivos
- Diagnosticar a latência e perda de pacotes na rede local
- Configurar o roteador para priorizar tráfego de streaming
- Ajustar parâmetros de buffer e fragmentação no Sunshine
- Entender e evitar bufferbloat
- Comparar Wi-Fi 5 GHz, 6 GHz e Ethernet no Deck
:::

## Diagnóstico de rede: ping e iperf3

Antes de mexer em qualquer configuração, meça o estado atual da rede entre Deck e host.

### Latência (ping)

```terminal
# No Deck
$ ping -c 50 -i 0.2 <ip-do-host>

--- 192.168.1.100 ping statistics ---
50 packets transmitted, 50 received, 0% packet loss, time 10034ms
rtt min/avg/max/mdev = 1.234/2.456/12.345/1.890 ms
```

O que olhar:

- **Packet loss**: 0% é mandatório. Qualquer perda vira artefato visual.
- **avg**: < 3 ms com host cabeado e Deck no Wi-Fi 5 GHz é ótimo.
- **max**: picos > 20 ms indicam interferência ou congestionamento.
- **mdev** (jitter): < 2 ms é excelente; > 5 ms causa oscilação no bitrate.

### Throughput (iperf3)

Instale `iperf3` no host e no Deck:

```terminal
# No host (servidor)
$ iperf3 -s

# No Deck (cliente)
$ iperf3 -c <ip-do-host> -t 30 -u -b 100M
```

O parâmetro `-u` usa UDP, `-b 100M` simula tráfego de streaming a 100 Mbps. Observe:

- **Jitter**: deve ficar abaixo de 2 ms.
- **Lost/total datagrams**: perto de 0%.
- **Throughput**: deve ser estável e próximo ao bitrate configurado.

Se o UDP perder pacotes mesmo com throughput baixo, o roteador está com bufferbloat.

## Bufferbloat: o inimigo silencioso

Bufferbloat é quando o roteador acumula pacotes em buffers enormes em vez de descartá-los — causando latência explosiva sob carga. Teste com:

```terminal
# No Deck (ou qualquer dispositivo na rede)
$ ping -c 100 google.com
# Enquanto isso, no host, gere tráfego pesado:
$ curl -o /dev/null http://speedtest.tele2.net/100MB.zip
```

Se o ping para o Google subir de 10 ms para 200+ ms durante o download, há bufferbloat. A solução:

1. **Ative SQM (Smart Queue Management)** no roteador: procure por "QoS", "SQM", "fq_codel" ou "CAKE" nas configurações.
2. **Limite o bandwidth** do download/upload a 90-95% do valor contratado — isso evita que o buffer do modem encha.
3. **Use Ethernet no host** e reduza tráfego concorrente (torrents, backups em nuvem) durante o streaming.

Roteadores com OpenWrt, pfSense ou OPNsense têm SQM nativo. Nos roteadores de consumo, procure "Gaming QoS" ou "Prioridade de tráfego".

## Parâmetros de rede no Sunshine

O Sunshine expõe alguns ajustes avançados em Configuration → Advanced ou via `sunshine.conf`:

### Fragment size (MTU do stream)

Pacotes grandes de vídeo podem ser fragmentados pelo IP — cada fragmento é um ponto de falha. Reduzir o tamanho máximo do datagrama UDP pode diminuir perdas em redes ruidosas:

```ini
# Tamanho máximo do payload UDP em bytes
# Default: 1024; reduzir para 800 ou 512 em Wi-Fi congestionado
fragment_size = 1024
```

### FEC (Forward Error Correction)

O Sunshine pode enviar dados redundantes para recuperar pacotes perdidos sem retransmitir:

```ini
# Número de pacotes FEC por grupo (0 = desabilitado)
# Aumenta overhead de banda mas reduz impacto de perda
fec_packets_per_group = 0  # 0 a 5
```

Com 0% de packet loss, deixe FEC desabilitado. Se houver perda (1-2%), `fec_packets_per_group = 2` pode compensar.

### Client-side buffer

O Moonlight mantém um buffer de frames para absorver jitter de rede. Aumentar reduz frame drops mas aumenta latência:

No Moonlight: Settings → Advanced → **Video buffer size**.

- Padrão: 1 frame (~16 ms a 60 fps).
- Redes instáveis: 2-3 frames. Cada frame extra adiciona ~16 ms de latência.

## Wi-Fi vs Ethernet no Deck

### Wi-Fi 5 GHz

O Deck suporta Wi-Fi 5 (802.11ac) no modelo LCD e Wi-Fi 6E (802.11ax) no OLED. No modo 5 GHz:

- Throughput real: 200-400 Mbps.
- Latência típica ao roteador: 1-3 ms.
- Suscetível a interferência de vizinhos, micro-ondas e paredes.

Dicas para Wi-Fi de streaming:

- Use canal 5 GHz fixo, não "Auto". Prefira canais não sobrepostos (36, 40, 44, 48 ou DFS 52-144).
- Largura de canal: 80 MHz (não 160 MHz — 160 MHz é mais suscetível a interferência).
- Distância do roteador: < 10 metros, sem paredes entre Deck e roteador.

### Ethernet via dock/USB-C

O Deck com dock USB-C e Ethernet cabeada é a melhor experiência possível:

- Latência ao roteador: < 1 ms.
- Throughput estável: 1 Gbps.
- Zero interferência.

Mesmo um adaptador USB-C para Ethernet barato transforma a experiência. Para streaming sério, é o upgrade mais barato e eficaz.

```terminal
# Verificar link da Ethernet no Deck
$ ethtool eth0  # ou enp5s0, dependendo do dock
Speed: 1000Mb/s
Duplex: Full
```

## Otimização no roteador

Configurações recomendadas no roteador para streaming:

| Ajuste | Valor recomendado | Por quê |
|--------|-------------------|---------|
| Canal 5 GHz | Manual (36-48) | Evita saltos de canal automáticos |
| Largura de canal | 80 MHz | Equilíbrio velocidade/estabilidade |
| QoS / SQM | Ativado (fq_codel ou CAKE) | Elimina bufferbloat |
| Prioridade UDP | Porta 48010 com prioridade alta | O stream Sunshine usa essa porta |
| UPnP | Desabilitado (se possível) | Evita mapeamentos indesejados |
| Band Steering | Desabilitado | Força 5 GHz, não deixa o dispositivo migrar para 2.4 GHz |
| Wi-Fi 6 (OFDMA) | Habilitado (no OLED) | Menor latência com múltiplos dispositivos |

## Streaming local com gráfico de rede

Durante o stream, abra as estatísticas (`Ctrl+Alt+Shift+Z`) e monitore:

- **Network latency**: se oscilar muito, verifique interferência Wi-Fi.
- **Frames dropped by network**: se > 1%, aumente o buffer ou reduza bitrate.
- **Frames dropped by decoder**: se > 0%, o Deck não está dando conta — reduza FPS ou resolução.

No host, monitore o Sunshine com:

```terminal
# Logs em tempo real
# Linux
$ journalctl --user -u sunshine -f

# Windows (PowerShell)
> Get-Content "$env:AppData\sunshine\sunshine.log" -Wait
```

## Resumo

- Meça latência com `ping` e throughput UDP com `iperf3` antes de ajustar.
- Bufferbloat causa latência explosiva sob carga; resolva com SQM/QoS no roteador.
- Fragmentation size e FEC ajustam resiliência a perdas; em redes boas, mantenha defaults.
- Ethernet via dock no Deck é o upgrade mais impactante para streaming.
- Roteador: canal fixo 5 GHz, largura 80 MHz, QoS ativado.
- O overlay de estatísticas do Moonlight é a bússola para diagnosticar problemas de rede.

## Exercícios

1. Execute `ping -c 100 <ip-do-host>` do Deck e anote avg, max e mdev. Há perda de pacotes?
2. Instale `iperf3` no host e no Deck (Flatpak: `iperf3`). Execute um teste UDP a 50 Mbps por 30 segundos. Qual foi o jitter e a perda?
3. Teste bufferbloat: faça um download pesado no host e meça o ping do Deck para o roteador (`ping 192.168.x.1`). A latência disparou?
4. Se possível, conecte o Deck via Ethernet (dock) e repita o teste de latência. Qual a diferença no avg do ping?
5. **Desafio.** No Sunshine, experimente `fec_packets_per_group = 2` e compare com FEC desligado: faça dois streams de 5 minutos do mesmo jogo, em condições de leve perda de pacotes (afaste-se do roteador), e compare os frame drops no overlay.