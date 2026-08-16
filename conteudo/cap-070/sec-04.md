Com o host configurado, o próximo passo é conectar o Steam Deck e começar a jogar. Esta seção cobre o fluxo de conexão, o mapeamento de controles, as configurações de overlay e o que fazer quando a conexão falha — porque, mais cedo ou mais tarde, ela vai falhar.

:::objetivos
- Conectar o Deck a um host Parsec
- Configurar gamepad, touchpad e gyro no streaming
- Usar o overlay de diagnóstico do Parsec
- Diagnosticar e corrigir problemas comuns de conexão
:::

## Primeira conexão

No Deck (Desktop Mode ou Modo Jogo), abra o Parsec. A interface mostra os hosts disponíveis na sua conta:

```terminal
$ flatpak run com.parsecgaming.parsec
```

A tela principal lista os computadores onde o Parsec está instalado e logado na mesma conta. Clique no host desejado e o Parsec estabelece a conexão.

Por baixo dos panos, o que acontece é:

```
1. Cliente (Deck) consulta o servidor de signaling do Parsec (via WebSocket)
2. Servidor informa o IP e porta do host
3. Cliente tenta conexão UDP direta (P2P) com o host
4. Se UDP falhar (NAT simétrica), cai para relay via servidores Parsec
5. Handshake concluído, stream de vídeo/áudio/input começa
```

Para ver esse processo no terminal (modo verbose):

```terminal
$ flatpak run --command=parsec com.parsecgaming.parsec --log-level=trace 2>&1 | grep -E 'connect|peer|UDP|relay'
[TRACE] connecting to peer abc123def456...
[TRACE] UDP direct connection established (12ms RTT)
[TRACE] video stream started: h264 1920x1080@60 50Mbps
```

A linha `UDP direct connection` é o cenário ideal. Se aparecer `relay connection`, a latência será maior — o tráfego passa por um servidor intermediário do Parsec.

## Gamepad e controles no Deck

O Deck tem um controle embutido rico: analógicos, D-pad, botões ABXY, gatilhos, touchpads, gyro e botões traseiros. O Parsec precisa expor tudo isso ao host como se fosse um gamepad Xbox 360 (XInput).

Por padrão, o Parsec traduz o controle do Deck para XInput automaticamente. Mas o touchpad e o gyro exigem configuração extra:

```terminal
$ cat ~/.parsec/config.txt | grep -i gamepad
host_gamepad = 1
host_gamepad_type = xbox
client_gamepad_deadzone = 0.05
client_gamepad_gyro = 1
```

:::info
O gyro do Deck aparece como mouse por padrão no SteamOS. Para que o Parsec o reconheça como giroscópio de controle (e não como mouse), você precisa ativar `client_gamepad_gyro = 1` E configurar o Steam Input para enviar o gyro como joystick (não como mouse). No modo Gaming, segure o botão Steam e vá em Configurações do Controle → Gyro → Como Joystick.
:::

### Touchpads como mouse ou como controle?

Os touchpads do Deck são extremamente versáteis. No Parsec, você pode usá-los como:

- **Mouse virtual** (padrão): o touchpad direito controla o ponteiro no host. Útil para jogos de estratégia/point-and-click.
- **Joystick virtual**: emule o analógico direito, para jogos de tiro.
- **Trackball**: rolagem inercial, boa para menus rápidos.

A configuração é feita no Steam Input, antes de abrir o Parsec. Edite o layout de controle do atalho "Parsec" na biblioteca Steam.

## O overlay de diagnóstico

Durante uma sessão Parsec, pressione **Ctrl+Shift+D** para abrir o overlay de diagnóstico:

```
┌─────────────────────────────────────────┐
│  Decode: 3.2ms   Encode: 4.1ms          │
│  Network: 8.5ms    Bitrate: 48 Mbps     │
│  FPS: 60/60       Dropped: 0 (0.0%)     │
│  Codec: H.264 HW  Res: 1920x1080        │
│  Connection: UDP Direct                 │
└─────────────────────────────────────────┘
```

Cada métrica importa:

- **Decode (ms):** tempo que o Deck leva para decodificar o frame. Abaixo de 5 ms é excelente (decode por hardware).
- **Encode (ms):** tempo que o host leva para codificar. Abaixo de 6 ms é hardware; acima de 10 ms sugere software.
- **Network (ms):** latência de rede entre cliente e host. Soma do RTT físico mais buffer de jitter.
- **Bitrate (Mbps):** banda efetiva consumida. Se flutuar muito, há congestionamento.
- **FPS:** frames recebidos / esperados. O segundo número deve ser 60 (ou 90 no OLED).
- **Dropped:** frames perdidos. Acima de 1% é preocupante — indica rede ou encode sobrecarregado.
- **Codec + HW/SW:** confirma se a decodificação no Deck está usando hardware (`HW`). Se aparecer `SW`, o Flatpak não tem acesso ao `dri`.

```terminal
# Verificar se o Deck está decodificando por hardware:
$ vainfo 2>/dev/null | grep -i profile
...
VAProfileH264High               : VAEntrypointVLD
VAProfileHEVCMain               : VAEntrypointVLD
```

Se `vainfo` lista `H264High`, o hardware suporta decodificação acelerada. O Flatpak do Parsec detecta automaticamente.

## Problemas comuns de conexão e soluções

| Sintoma | Causa provável | Solução |
|---|---|---|
| Parsec não encontra o host | Host offline ou contas diferentes | Verifique se o Parsec está rodando no host e a conta é a mesma |
| Conexão cai após alguns segundos | Firewall bloqueando UDP 8000–8004 | Abra as portas no roteador/firewall do host |
| Tela preta, mas áudio funciona | Display virtual não configurado | Ative `host_virtual_display` no host |
| Latência alta (50+ ms) | Conexão via relay em vez de P2P | Verifique NAT; se possível, use UPnP ou encaminhamento de portas |
| Artefatos verdes/rosados | Codec incompatível ou driver desatualizado | Troque para `h264` e atualize os drivers de GPU do host |
| Gamepad não funciona | Flatpak sem acesso a `/dev/input` | Execute `flatpak override --user --device=all` |

### Diagnóstico de conectividade via terminal

Antes mesmo de abrir o Parsec, você pode testar se a conectividade básica existe entre Deck e host:

```terminal
# Teste de ping (latência mínima teórica)
$ ping -c 10 -i 0.2 192.168.1.100
--- 192.168.1.100 ping statistics ---
10 packets transmitted, 10 received, 0% packet loss
rtt min/avg/max/mdev = 2.1/3.4/8.2/1.9 ms

# Teste de porta UDP (se o host tem netcat)
# No host: nc -ul 8000
# No Deck:
$ echo "test" | nc -u -w1 192.168.1.100 8000

# Verificar se as portas Parsec estão acessíveis
$ nmap -sU -p 8000-8004 192.168.1.100 2>/dev/null
PORT     STATE         SERVICE
8000/udp open|filtered irdmi
8001/udp open|filtered vcom-tunnel
```

## Jogando em redes externas (WAN)

O Parsec funciona fora de casa, mas a latência sobe. Para a melhor experiência remota:

```terminal
# No Deck, meça o RTT até o host via internet:
$ ping -c 10 <seu-ip-publico>
rtt avg = 28.4 ms   # aceitável para jogos casuais
rtt avg = 62.1 ms   # limite para jogos de ação
rtt avg = 95.3 ms   # inviável para ação, ok para estratégia
```

Reduza o bitrate proporcionalmente: se sua conexão de upload no host é 20 Mbps, configure `host_video_bitrate = 15` para deixar folga.

**Em resumo:** a conexão Deck→host no Parsec é P2P UDP sempre que possível. O overlay `Ctrl+Shift+D` é seu painel de diagnóstico durante o jogo. Gamepad, gyro e touchpads exigem configuração no Steam Input. Problemas de conexão se resolvem inspecionando portas, NAT e codecs.

## Exercícios

1. Conecte o Deck ao host via Parsec e abra o overlay (Ctrl+Shift+D). Anote: decode time, network time, codec, e FPS.
2. Teste a diferença entre conexão local (mesmo Wi-Fi) e remota (dados móveis). O network time mudou quanto?
3. Configure o gyro do Deck como joystick no Steam Input e teste num jogo de tiro via Parsec. O movimento é suave ou entrecortado?
4. Force o codec para `h265` no `config.txt` do host e conecte novamente. O decode time no Deck aumentou? O bitrate caiu?
5. **Desafio.** Simule uma conexão ruim com `tc` (traffic control): no host, adicione 30 ms de latência artificial com `tc qdisc add dev eth0 root netem delay 30ms`. Jogue por 2 minutos e relate a experiência. Remova com `tc qdisc del dev eth0 root`.