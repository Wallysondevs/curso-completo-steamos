Quando o streaming engasga, a culpa raramente é de uma única coisa. Pode ser o codec, o roteador, o canal Wi-Fi, o buffer do driver de vídeo, a oscilação de clock da GPU ou até o agendador de processos do kernel. Esta seção ensina a isolar cada variável com ferramentas de terminal, transformando um problema difuso ("o stream está ruim") em um diagnóstico preciso.

:::objetivos
- Medir latência de rede com precisão de milissegundos
- Isolar gargalos de encode, decode e rede separadamente
- Diagnosticar bufferbloat e perda de pacotes
- Identificar interferência Wi-Fi e saturação de canal
- Correlacionar métricas de streaming com contadores do kernel
:::

## A anatomia de um frame via streaming

Cada frame transmitido percorre um caminho com várias etapas, e cada etapa adiciona latência:

```
Render (host GPU) → Captura (framebuffer) → Encode (NVENC/AMF/VAAPI)
→ Network (UDP) → Decode (Deck GPU) → Display (tela do Deck)
```

O tempo total entre "apertei o botão" e "vi o resultado na tela" é a soma de:

```
latência_total = render + captura + encode + rede + decode + display
```

Cada termo pode ser medido ou estimado:

| Etapa | Quem mede | Valor típico (bom) | Valor típico (ruim) |
|---|---|---|---|
| Render | FPS do jogo | 16,7 ms (60 FPS) | 33 ms (30 FPS) |
| Captura | Parsec/Sunshine log | < 1 ms | 2–5 ms |
| Encode | Overlay Parsec (Encode) | 3–6 ms | 15+ ms |
| Rede | `ping` | 2–5 ms (local) | 30+ ms |
| Decode | Overlay Parsec (Decode) | 2–5 ms | 15+ ms |
| Display | Fixo do Deck | ~1 ms | ~1 ms |

## Medindo a rede com precisão

O `ping` dá o piso teórico da latência, mas o jitter (variação) é tão importante quanto a média:

```terminal
$ ping -c 50 -i 0.2 192.168.1.100
--- 192.168.1.100 ping statistics ---
50 packets transmitted, 50 received, 0% packet loss, time 10203ms
rtt min/avg/max/mdev = 1.8/3.2/12.4/2.3 ms
```

O `mdev` (desvio padrão) de 2,3 ms significa que a latência varia entre ~1 ms e ~5 ms na maioria dos pacotes. Um `mdev` acima de 5 ms já causa micro-stutter perceptível. Se o `max` for muito maior que o `avg` (aqui: 12,4 vs 3,2), há picos esporádicos — geralmente causados por bufferbloat ou interferência.

### Bufferbloat: o vilão silencioso

Bufferbloat ocorre quando o buffer do roteador enche e adiciona dezenas de milissegundos de latência extra. O teste clássico é o `ping` durante um download:

```terminal
# Terminal 1: inicie um download grande (ou speed test)
$ curl -o /dev/null http://speedtest.tele2.net/100MB.zip

# Terminal 2: observe o ping
$ ping -c 20 8.8.8.8
# Se a latência saltar de 10 ms para 200 ms durante o download,
# você tem bufferbloat.
```

A solução é ativar SQM (Smart Queue Management) no roteador — especificamente `fq_codel` ou `cake`. Se o seu roteador não suporta (muitos roteadores de ISP não suportam), limite o bitrate do Parsec para 60–70% da banda de upload disponível, deixando folga para o buffer.

```terminal
# No config.txt do Parsec (host), limite agressivo como workaround:
host_video_bitrate = 25   # se seu upload é 40 Mbps, use no máximo 25
```

### iperf3: medindo a banda real entre Deck e host

O `iperf3` mede a taxa de transferência TCP e UDP entre dois pontos — mais preciso que speed tests de internet:

```terminal
# No host (servidor):
$ iperf3 -s

# No Deck (cliente):
$ iperf3 -c 192.168.1.100 -u -b 50M -t 10
[ ID] Interval           Transfer     Bitrate         Jitter    Lost/Total Datagrams
[  5]   0.00-10.00  sec  59.6 MBytes  50.0 Mbits/sec  0.087 ms  0/42500 (0%)
[  5]   0.00-10.00  sec  sender
```

O resultado ideal: `Lost/Total = 0/42500 (0%)` e jitter abaixo de 1 ms. Se houver perda de datagramas (UDP), a qualidade do stream cai proporcionalmente.

## Diagnóstico do encode/decode

### No host: o encode está usando hardware?

```terminal
# AMD (Linux)
$ radeontop -c -l 1 2>/dev/null | grep -E 'UVD|VCE'
# Durante o streaming, o UVD (decode) ou VCE (encode) deve mostrar atividade.

# NVIDIA (Linux)
$ nvidia-smi encoders
Encoder 0:  [GPU 0]: Utilização 45%, Session count 1

# Intel
$ intel_gpu_top -l
```

Se a atividade do encoder for 0% ou muito baixa durante o streaming, o Parsec/Sunshine está usando software encoding — corrija o codec ou o driver.

### No Deck: o decode está usando hardware?

```terminal
$ vainfo 2>/dev/null | grep -A 10 "VAProfileH264"
VAProfileH264High               : VAEntrypointVLD
VAProfileH264High               : VAEntrypointEncSlice
```

`VLD` (Variable-Length Decoding) é o suporte de decode. Se aparecer, a GPU do Deck decodifica H.264 por hardware. Durante o streaming:

```terminal
$ watch -n 1 'cat /sys/class/drm/card0/device/gpu_busy_percent'
# Deve mostrar atividade, mas não 100% — se estiver em 100%,
# o decode está no limite.
```

## Ferramentas avançadas: MTR e smokeping

O `mtr` combina `ping` e `traceroute` em tempo real, mostrando onde a latência se acumula em cada salto:

```terminal
$ mtr -r -c 50 192.168.1.100
Start: 2025-08-16T15:30:00+0000
HOST: deck              Loss%   Snt   Last   Avg  Best  Wrst StDev
  1. 192.168.1.1         0.0%    50    1.2   1.5   0.9   8.3   1.1
  2. 192.168.1.100       0.0%    50    2.1   2.4   1.8   5.2   0.7
```

Em rede local, normalmente há apenas 2 saltos: Deck → roteador → host. Se o `StDev` entre salto 1 (roteador) for alto, o problema é o Wi-Fi entre Deck e roteador. Se for no salto 2, é o enlace entre roteador e host.

## Wi-Fi: canal, sinal e interferência

O Deck usa Intel Wi-Fi 6E (ou Wi-Fi 5 nos modelos LCD mais antigos). A qualidade do sinal pode ser inspecionada com:

```terminal
$ iw dev wlan0 link
Connected to 01:23:45:67:89:ab (on wlan0)
        SSID: MinhaRede
        freq: 5180
        signal: -45 dBm
        tx bitrate: 866.6 MBit/s VHT-MCS 9 80MHz short GI
```

- **signal:** acima de -50 dBm é excelente; entre -50 e -65 é bom; abaixo de -70 dBm começa a degradar.
- **freq:** 5 GHz (5180–5825 MHz) é obrigatório para streaming. 2,4 GHz sofre de interferência e latência alta.
- **tx bitrate:** o valor máximo teórico. Se for menor que o esperado, o Deck negociou uma modulação inferior (sinal fraco ou interferência).

```terminal
# Listar redes Wi-Fi e canais ao redor:
$ nmcli dev wifi list | sort -k7 -n
# Escolha um canal 5 GHz com menor interferência.
```

## Correlacionando tudo: o script de diagnóstico

Junte as métricas em um script que roda enquanto você joga:

```terminal
$ cat ~/lab/stream-diag.sh
#!/bin/bash
echo "=== STREAM DIAGNOSTIC ==="
echo "--- Ping ---"
ping -c 5 -i 0.2 $1 2>/dev/null | tail -1
echo "--- Wi-Fi ---"
iw dev wlan0 link 2>/dev/null | grep -E 'signal|bitrate|freq'
echo "--- GPU Decode ---"
cat /sys/class/drm/card0/device/gpu_busy_percent 2>/dev/null
echo "--- PipeWire ---"
pactl info 2>/dev/null | grep "Server Name"
echo "--- Flatpak Permissions ---"
flatpak override --show com.parsecgaming.parsec 2>/dev/null
echo "========================="
```

Execute-o com `watch`:

```terminal
$ watch -n 2 'bash ~/lab/stream-diag.sh 192.168.1.100'
```

Durante uma sessão de streaming, mantenha esse terminal aberto (em outra aba ou SSH) e observe as métricas em tempo real. Quando o stream engasgar, olhe para o terminal — a métrica que variou naquele exato momento é o culpado.

**Em resumo:** o diagnóstico de streaming é uma ciência de isolação. Separe as variáveis (rede, encode, decode, Wi-Fi) e meça cada uma com a ferramenta certa: `ping` + `iperf3` para rede, `radeontop`/`nvidia-smi` para encode, `vainfo` para decode, `iw` para Wi-Fi. O script de diagnóstico unifica tudo em uma tela só.

## Exercícios

1. Execute `ping -c 50 -i 0.2 <host>` e anote min/avg/max/mdev. Há picos (max muito maior que avg)?
2. Rode `iperf3 -c <host> -u -b 50M -t 10` e anote perda de datagramas e jitter. Se a perda for > 0%, investigue com `mtr`.
3. Durante uma sessão de streaming, execute `iw dev wlan0 link` a cada 30 segundos. O sinal varia muito? O tx bitrate cai em algum momento?
4. Teste bufferbloat: faça um download grande enquanto pinga o host. A latência aumentou? Em quantos ms?
5. **Desafio.** Monte o script `stream-diag.sh`, inicie uma sessão Parsec e provoque um problema (desconecte a Ethernet do host, force-o a usar Wi-Fi). O script capturou a mudança? Qual métrica foi a primeira a disparar?