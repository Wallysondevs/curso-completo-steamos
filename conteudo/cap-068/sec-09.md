O streaming local é direto: Deck e cliente na mesma rede, descoberta automática, latência baixa. Fora de casa, o buraco é mais embaixo. O Deck está atrás do NAT do seu roteador, o cliente está atrás de outro NAT (rede móvel, Wi-Fi do hotel, escritório), e a internet entre eles adiciona dezenas de milissegundos de latência. Ainda assim, é possível — e a Valve oferece caminhos oficiais e alternativas com VPN.

:::objetivos
- Entender as barreiras de NAT que impedem o streaming remoto direto
- Configurar o Steam Remote Play para acesso externo com UPnP ou port forwarding
- Medir a latência da internet e determinar se o streaming é viável
- Usar VPN (WireGuard, Tailscale) como alternativa ao port forwarding
- Avaliar riscos de segurança e configurar acesso remoto com proteção
:::

## O problema do NAT duplo

Dentro de casa, o Deck e o cliente estão no mesmo espaço de endereçamento privado (192.168.x.x). O roteador sabe entregar pacotes entre eles. Fora de casa, cada dispositivo está atrás do seu próprio NAT:

```text
Deck (192.168.1.50) → Roteador casa (IP público 203.0.113.45)
                         ↕ internet ↕
Celular (10.0.0.12) ← Roteador hotel/4G (IP público 198.51.100.32)
```

O cliente (celular) não tem como alcançar `192.168.1.50` — esse endereço só existe dentro da sua casa. O cliente precisa alcançar o IP público do seu roteador (`203.0.113.45`) e o roteador precisa encaminhar o tráfego para o Deck. É isso que o port forwarding faz.

## UPnP: o caminho automático

O Steam tenta configurar o port forwarding automaticamente via UPnP (Universal Plug and Play). Se o seu roteador suporta UPnP e está ativado, o Steam abre as portas necessárias sozinho, sem intervenção manual:

```terminal
## Verificando se o UPnP está ativo no roteador (via upnpc):
$ upnpc -l 2>/dev/null || echo "upnpc não instalado ou UPnP desabilitado"
List of UPnP devices found on the network:
 desc: http://192.168.1.1:5000/rootDesc.xml
 st: urn:schemas-upnp-org:device:InternetGatewayDevice:1

## Para instalar o miniupnpc e testar:
$ sudo apt install miniupnpc
$ upnpc -l
```

O comando `upnpc -l` lista os dispositivos UPnP na rede. Se o roteador aparecer, o Steam consegue negociar as portas. Se não, você precisa fazer port forwarding manual.

:::atencao
UPnP é conveniente, mas tem implicações de segurança: qualquer dispositivo na sua rede pode abrir portas no roteador. Se você tem dispositivos IoT ou visitantes frequentes no Wi-Fi, considere desligar o UPnP e fazer port forwarding manual — é mais seguro e mais previsível.
:::

## Port forwarding manual

Se o UPnP não estiver disponível, configure o port forwarding no roteador manualmente. As portas a encaminhar (do IP público para o IP do Deck) são as mesmas do streaming local:

| Porta externa | Protocolo | IP interno (Deck) | Porta interna |
|---|---|---|---|
| 27031 | UDP | 192.168.1.50 | 27031 |
| 27032 | UDP | 192.168.1.50 | 27032 |
| 27036 | TCP+UDP | 192.168.1.50 | 27036 |
| 27037 | TCP | 192.168.1.50 | 27037 |

Antes de criar as regras, reserve um IP fixo para o Deck no DHCP do roteador (DHCP Reservation / Static Lease). Se o IP do Deck mudar, o port forwarding para de funcionar.

```terminal
## No Deck, verifique o IP atual e o gateway (roteador):
$ ip addr show wlan0 | grep inet
    inet 192.168.1.50/24 brd 192.168.1.255 scope global dynamic noprefixroute wlan0
$ ip route | grep default
default via 192.168.1.1 dev wlan0 proto dhcp src 192.168.1.50 metric 600
```

O gateway `192.168.1.1` é o roteador. Acesse `http://192.168.1.1` no navegador e procure por "Port Forwarding", "Virtual Server" ou "NAT". Crie as quatro regras da tabela acima apontando para `192.168.1.50`.

## Testando a acessibilidade externa

Depois de configurar o port forwarding, teste de fora da rede local (use o 4G/5G do celular, não o Wi-Fi de casa):

```terminal
## No Deck, descubra o IP público:
$ curl -s ifconfig.me
203.0.113.45
```

Do celular (fora do Wi-Fi de casa), abra o Steam Link, vá em Settings > Computers > Add Computer e digite o IP público `203.0.113.45`. Se o port forwarding estiver correto, o Steam Link encontra o Deck e pede o PIN de pareamento.

```terminal
## Teste de conectividade da porta 27036 via UDP (do cliente externo):
$ nc -zvu 203.0.113.45 27036
Connection to 203.0.113.45 27036 port [udp/*] succeeded!
```

:::perigo
Expor portas do Steam Deck na internet significa que qualquer pessoa que descubra seu IP público pode tentar se conectar ao Remote Play. Use um PIN forte, mantenha o Steam atualizado e considere desligar o port forwarding quando não estiver usando. A alternativa com VPN é mais segura.
:::

## VPN como alternativa

Em vez de expor portas, você pode colocar o Deck e o cliente na mesma rede virtual via VPN. O WireGuard é leve, rápido e não adiciona latência significativa (< 2 ms). O Tailscale é uma camada sobre WireGuard que configura tudo automaticamente:

```terminal
## Instalando o Tailscale no Deck (modo Desktop):
$ curl -fsSL https://tailscale.com/install.sh | sh
$ sudo tailscale up
## Autentique no navegador e o Deck ganha um IP 100.x.y.z.
## Instale o Tailscale no celular também.
## Agora, no Steam Link do celular, adicione o IP 100.x.y.z como servidor.
```

Com ambos os dispositivos na mesma rede Tailscale (ou WireGuard), o streaming funciona como se estivessem na mesma rede local — descoberta automática, portas acessíveis, sem exposição à internet pública. A latência adicional é mínima (o overhead do WireGuard é de ~1 ms).

## Vale a pena? Limites práticos

Streaming remoto pela internet é viável, mas tem limites:

- **Latência mínima prática:** 30–50 ms em condições ideais (fibra em casa + 5G no celular, mesma cidade).
- **Latência típica:** 60–100 ms (4G, distâncias maiores).
- **Largura de upload necessária:** pelo menos 10 Mbps de upload na internet de casa (o Deck envia vídeo, consome upload, não download).
- **Jogos viáveis:** RPGs, estratégia, aventura, visual novels, simuladores.
- **Jogos difíceis:** FPS competitivo, luta, ritmo — a latência adicional é perceptível.

```terminal
## Medindo a velocidade de upload da internet de casa:
$ curl -s https://speedtest.net 2>/dev/null || echo "Use o speedtest-cli:"
$ speedtest-cli --simple
Ping: 12.45 ms
Download: 350.80 Mbit/s
Upload: 45.22 Mbit/s
```

Com 45 Mbps de upload, você consegue transmitir a 20 Mbps (1080p HEVC) tranquilamente, sobrando banda para outras coisas. Com menos de 8 Mbps de upload, mesmo 720p pode engasgar.

## Resumo

- Fora de casa, o NAT impede o acesso direto ao Deck; é preciso port forwarding (UPnP ou manual) ou VPN.
- UPnP automatiza o port forwarding, mas tem implicações de segurança; o manual é mais controlado.
- As portas a expor: UDP 27031, 27032, 27036 e TCP 27036, 27037.
- VPN (WireGuard/Tailscale) é a alternativa mais segura: mesma rede virtual, sem exposição pública.
- Streaming remoto exige pelo menos 10 Mbps de upload; latência de 30–100 ms é esperada.

## Exercícios

1. Verifique se o UPnP está ativo no seu roteador com `upnpc -l` (instale `miniupnpc` se necessário). O Steam consegue abrir portas automaticamente?
2. Configure port forwarding manual no roteador para as portas do Steam (27031, 27032, 27036, 27037) apontando para o IP do Deck.
3. Teste a acessibilidade externa: do celular no 4G/5G (Wi-Fi desligado), tente adicionar o IP público da sua casa no Steam Link. O PIN de pareamento aparece?
4. Instale o Tailscale no Deck e no celular. Compare a latência de `ping` via Tailscale com a latência de `ping` via IP público com port forwarding. Qual é menor?
5. **Desafio.** Configure um túnel WireGuard manual entre o Deck (servidor) e um PC fora de casa (cliente). Meça a latência adicional do túnel com `ping` e faça um stream via VPN. Compare a experiência com o port forwarding direto — há diferença perceptível na qualidade ou latência do jogo?