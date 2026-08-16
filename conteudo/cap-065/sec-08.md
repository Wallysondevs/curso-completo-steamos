O streaming local é a experiência mais fluida, mas a verdadeira mágica é jogar os jogos do seu PC de qualquer lugar: da casa de um amigo, do trabalho, do hotel. Sunshine + Moonlight permitem streaming remoto, e com uma VPN mesh como Tailscale ou WireGuard, a configuração é surpreendentemente simples.

:::objetivos
- Entender os requisitos de rede para streaming fora de casa
- Configurar Tailscale como VPN mesh entre host e Deck
- Configurar WireGuard como alternativa manual
- Ajustar bitrate e resolução para redes remotas
- Resolver problemas de NAT, double-NAT e CGNAT
:::

## Requisitos para streaming remoto

O streaming fora de casa depende de dois fatores: **largura de banda** e **latência**.

### Upload do host

O host transmite o stream pelo seu upload. Exija:

| Bitrate do stream | Upload mínimo do host |
|-------------------|----------------------|
| 20 Mbps | 25 Mbps |
| 30 Mbps | 38 Mbps |
| 50 Mbps | 63 Mbps |

Meça o upload do host:

```terminal
# No host
$ curl -s https://raw.githubusercontent.com/sivel/speedtest-cli/master/speedtest.py | python3 -
```

Se o upload for baixo (< 20 Mbps), reduza o bitrate do Sunshine para 15 Mbps ou use H.264 (mais eficiente em bitrates baixos que HEVC).

### Download do Deck

O Deck precisa baixar o stream. Em Wi-Fi de hotel, aeroporto ou café, a banda pode ser compartilhada e instável. Priorize redes 5 GHz e faça um speed test antes de streamar.

### Latência

Cada 100 km adiciona ~1 ms de latência (fibra óptica). Na prática:

- Mesma cidade: +5-10 ms.
- Estado vizinho: +15-30 ms.
- Outro país (mesmo continente): +50-100 ms.
- Transoceânico: +100-200 ms.

Latência total > 60 ms começa a ser perceptível em jogos de ação. Acima de 100 ms, apenas jogos de estratégia/turno são confortáveis.

## Tailscale: VPN mesh simplificada

O Tailscale cria uma rede mesh sobre WireGuard. Cada dispositivo ganha um IP fixo (`100.x.y.z`) e tráfego é criptografado ponto a ponto — sem servidor central passando os dados.

### Instalação no host (Windows/Linux)

```terminal
# Linux
$ curl -fsSL https://tailscale.com/install.sh | sh
$ sudo tailscale up

# Windows: baixar instalador de tailscale.com
```

### Instalação no Steam Deck

```terminal
$ sudo steamos-readonly disable
$ sudo pacman-key --init
$ sudo pacman-key --populate archlinux
$ sudo pacman -S tailscale
$ sudo systemctl enable --now tailscaled
$ sudo tailscale up
$ sudo steamos-readonly enable
```

Após `tailscale up` nos dois dispositivos, ambos aparecem na [console do Tailscale](https://login.tailscale.com/admin/machines) com IPs `100.x.y.z`.

### Conectando Moonlight via Tailscale

No Deck, o Moonlight detecta o host via broadcast mDNS — que não funciona via Tailscale (mDNS é local). Então é preciso adicionar o host manualmente:

1. Abra o Moonlight (GUI).
2. Clique em **Add Host Manually**.
3. Digite o IP Tailscale do host (ex.: `100.72.45.100`).
4. Se já estiver pareado localmente, o Moonlight reconhece o certificado — não precisa re-parear.

Pela linha de comando:

```terminal
$ moonlight pair 100.72.45.100
$ moonlight stream 100.72.45.100 --desktop --bitrate 20000 --fps 60
```

O bitrate foi reduzido para 20 Mbps — streaming remoto pede conservadorismo.

### NAT traversal

O Tailscale usa STUN, DERP (relay) e NAT-PMP/PCP para furar NATs. Em 90% dos casos, a conexão é direta (ponto a ponto). Se ambos os lados estiverem atrás de NATs simétricos ou CGNAT, o Tailscale usa relays DERP — aí a latência aumenta (o relay fica na nuvem do Tailscale). Verifique:

```terminal
$ tailscale status
100.72.45.100  host-pc    user@    linux   active; direct 192.168.1.100:41641
```

Se aparecer `relay` em vez de `direct`, a conexão não é ponto a ponto — espere latência maior.

## WireGuard manual (alternativa ao Tailscale)

Se preferir não usar serviço de terceiro, monte um túnel WireGuard:

### No host (servidor)

```terminal
# /etc/wireguard/wg0.conf
[Interface]
Address = 10.0.0.1/24
ListenPort = 51820
PrivateKey = <chave-privada-host>

[Peer]
# Deck
PublicKey = <chave-publica-deck>
AllowedIPs = 10.0.0.2/32
```

### No Deck (cliente)

```terminal
# /etc/wireguard/wg0.conf
[Interface]
Address = 10.0.0.2/24
PrivateKey = <chave-privada-deck>

[Peer]
# Host
PublicKey = <chave-publica-host>
Endpoint = <ip-publico-host>:51820
AllowedIPs = 10.0.0.1/32
PersistentKeepalive = 25
```

Inicie no Deck:

```terminal
$ sudo wg-quick up wg0
```

Adicione o host no Moonlight como `10.0.0.1`.

### Port forwarding

Se o host estiver atrás de CGNAT (operadora não entrega IP público), o WireGuard manual não funciona sem um relay externo (VPS). O Tailscale resolve isso automaticamente com DERP.

## Wake-on-LAN remoto

Para ligar o host remotamente, você precisa de WoL (Wake-on-LAN). O Tailscale facilita:

```terminal
# No Deck
$ tailscale ping 100.72.45.100  # "Ping" via Tailscale; envia WoL se PC estiver dormindo
```

Alternativa manual: se você tem um dispositivo sempre ligado na rede do host (Raspberry Pi, NAS), use-o para disparar WoL:

```terminal
$ wakeonlan <mac-address-do-host>
```

O Moonlight também tem WoL integrado: se o host estiver dormindo e você tentar conectar, ele envia magic packet. Certifique-se de que o WoL está habilitado na BIOS e no driver de rede do host.

## Perfil de streaming remoto

Crie um perfil no Sunshine ou use parâmetros do Moonlight otimizados para streaming remoto:

```terminal
# Perfil "Remoto": economia de banda
$ moonlight stream 100.72.45.100 --desktop \
  --resolution 1280x800 \
  --fps 60 \
  --bitrate 15000 \
  --codec h264 \
  --no-surround
```

H.264 em bitrates baixos (10-20 Mbps) costuma ter menos artefatos que HEVC. Reserve HEVC para 30+ Mbps.

### Adaptive bitrate

O Moonlight tem um modo de bitrate adaptativo (Settings → Video → **Bitrate mode**: Adaptive). Nesse modo, ele ajusta o bitrate conforme a qualidade da rede. Útil para streaming remoto com Wi-Fi instável, mas pode causar oscilação de qualidade perceptível.

## Segurança

- **Senha forte no Sunshine**: a interface web é local, mas se exposta via VPN, precisa de senha robusta.
- **HTTPS na interface web**: o Sunshine gera certificado auto-assinado. Aceite no primeiro acesso.
- **Tailscale**: tráfego criptografado WireGuard, modelo zero-trust — cada dispositivo é autenticado.
- **Não exponha portas diretamente**: nunca faça port forwarding das portas do Sunshine (47989-48010) no roteador. Use a VPN como camada de segurança.

## Resumo

- Streaming remoto requer upload ≥ 25 Mbps no host e download equivalente no Deck.
- Tailscale cria VPN mesh ponto a ponto com IPs fixos; Moonlight conecta via esses IPs.
- WireGuard manual é alternativa, mas requer IP público ou relay para CGNAT.
- Reduza bitrate para 15-20 Mbps e use H.264 em redes remotas.
- Wake-on-LAN via Tailscale ou Moonlight built-in liga o host remotamente.
- Nunca exponha as portas do Sunshine diretamente na internet; use VPN.

## Exercícios

1. Instale o Tailscale no host e no Deck. Confirme com `tailscale status` que ambos aparecem com IPs `100.x.y.z`.
2. Meça o upload do host com `speedtest-cli`. Qual o bitrate máximo que você consegue sustentar?
3. Adicione o host manualmente no Moonlight pelo IP do Tailscale e faça um stream remoto usando Wi-Fi de outro local (ex.: roteador 4G do celular). Anote a latência total no overlay.
4. Compare H.264 e HEVC a 15 Mbps no streaming remoto. Qual codec apresenta menos artefatos nesse bitrate baixo?
5. **Desafio.** Configure WireGuard manual entre Deck e host, sem Tailscale. Teste a conexão com `ping 10.0.0.1` e depois faça um stream via Moonlight. Qual a diferença de latência comparada ao Tailscale?