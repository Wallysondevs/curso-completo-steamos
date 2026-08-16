O streaming do Steam depende de um conjunto específico de portas UDP e TCP que precisam estar abertas e sem interferência de firewall ou isolamento de rede. Quando o cliente não encontra o Deck, ou o stream conecta e cai logo em seguida, o culpado quase sempre está na camada de rede. Saber quais portas o Steam usa e como inspecioná-las é a diferença entre tentar de tudo e resolver em dois minutos.

:::objetivos
- Conhecer as portas TCP e UDP usadas pelo Remote Play e Steam Link
- Inspecionar conexões de streaming em tempo real com `ss`
- Diagnosticar problemas de descoberta de servidor na rede local
- Verificar regras de firewall que podem bloquear o streaming
- Entender o papel do NAT, UPnP e multicast na descoberta de dispositivos
:::

## As portas do streaming

O Steam Remote Play usa um conjunto estável de portas. Conhecê-las ajuda a configurar firewalls, diagnosticar bloqueios e entender por que o streaming funciona em casa mas não no trabalho:

| Porta | Protocolo | Uso |
|---|---|---|
| 27031 | UDP | Descoberta de servidor (broadcast/multicast) e streaming de controle |
| 27032 | UDP | Streaming de áudio |
| 27036 | UDP/TCP | Streaming de vídeo e controle principal |
| 27037 | TCP | Sincronização de estado e comandos de controle |
| 27040 | TCP | Transferência de arquivos e atualizações de configuração |

As três primeiras (27031, 27032, 27036) são as críticas. Se qualquer uma delas estiver bloqueada, o stream não funciona. A 27036 é a mais importante: carrega o fluxo de vídeo comprimido, que é o grosso do tráfego.

```terminal
$ ss -tulnp | grep steam | sort
tcp   LISTEN 0      128        0.0.0.0:27036      0.0.0.0:*    users:(("steam",pid=1421,fd=38))
tcp   LISTEN 0      128        0.0.0.0:27037      0.0.0.0:*    users:(("steam",pid=1421,fd=39))
tcp   LISTEN 0      128      127.0.0.1:27060      0.0.0.0:*    users:(("steam",pid=1421,fd=42))
udp   UNCONN 0      0          0.0.0.0:27031      0.0.0.0:*    users:(("steam",pid=1421,fd=33))
udp   UNCONN 0      0          0.0.0.0:27032      0.0.0.0:*    users:(("steam",pid=1421,fd=34))
udp   UNCONN 0      0          0.0.0.0:27036      0.0.0.0:*    users:(("steam",pid=1421,fd=38))
```

Todas as portas de streaming estão escutando em `0.0.0.0` — ou seja, em todas as interfaces de rede, incluindo Wi-Fi. Se alguma delas estivesse em `127.0.0.1`, estaria acessível apenas localmente e o streaming não funcionaria. A porta `27060` só escuta em localhost porque é usada internamente pelo Steamworks, não para streaming.

## Durante o stream: conexões estabelecidas

Enquanto um stream está ativo, as portas que estavam em LISTEN/UNCONN passam a ter conexões ESTAB com o IP do cliente:

```terminal
$ ss -tunp | grep steam | grep ESTAB
tcp   ESTAB  0      0   192.168.1.50:27036  192.168.1.101:54321 users:(("steam",pid=1421,fd=42))
tcp   ESTAB  0      0   192.168.1.50:27037  192.168.1.101:54322 users:(("steam",pid=1421,fd=44))
udp   ESTAB  0      0   192.168.1.50:27031  192.168.1.101:54323 users:(("steam",pid=1421,fd=45))
udp   ESTAB  0      0   192.168.1.50:27032  192.168.1.101:54324 users:(("steam",pid=1421,fd=46))
udp   ESTAB  0      0   192.168.1.50:27036  192.168.1.101:54325 users:(("steam",pid=1421,fd=47))
```

O Deck (`192.168.1.50`) tem cinco conexões estabelecidas com o cliente (`192.168.1.101`). Três UDP para vídeo, áudio e controle, e duas TCP para sincronização e comandos. É assim que uma sessão de streaming saudável se parece no nível de rede.

:::dica
Se você vir apenas conexões TCP e nenhuma UDP estabelecida, o firewall do cliente ou do roteador pode estar bloqueando UDP. Isso resulta em stream travando, congelando ou caindo — o vídeo tenta ir por TCP (retransmissão garantida), mas a latência sobe e o buffer não acompanha.
:::

## Diagnóstico de descoberta: por que o cliente não acha o Deck

O Steam Link e o cliente Steam encontram o Deck via broadcast/multicast UDP na porta 27031. Se o Deck está ligado, o Remote Play ativado, mas o cliente não enxerga o servidor, o problema está na descoberta.

**Causa 1: Isolamento de cliente (AP Isolation).** Muitos roteadores e pontos de acesso têm uma opção chamada "AP Isolation", "Client Isolation" ou "Privacy Separator". Quando ativada, dispositivos na mesma rede Wi-Fi não podem se comunicar diretamente — cada um só fala com o roteador. Isso quebra o broadcast do Steam.

```terminal
## Teste rápido: o celular está na mesma rede? O Deck o enxerga?
$ ping -c 3 192.168.1.105
PING 192.168.1.105 (192.168.1.105) 56(84) bytes of data.
64 bytes from 192.168.1.105: icmp_seq=1 ttl=64 time=3.21 ms
...
## Se o ping falhar e ambos estiverem no mesmo Wi-Fi, AP Isolation está ativo.
```

**Causa 2: Sub-redes diferentes.** Dispositivos em VLANs diferentes ou em redes separadas (ex.: Deck no Wi-Fi 5 GHz e PC no cabo Ethernet, mas com segmentação de rede) não recebem o broadcast um do outro. Verifique com `ip addr`:

```terminal
$ ip addr show wlan0 | grep inet
    inet 192.168.1.50/24 brd 192.168.1.255 scope global dynamic noprefixroute wlan0
```

O Deck está na sub-rede `192.168.1.0/24`. O cliente precisa estar na mesma sub-rede para a descoberta automática funcionar. Se estiver em `192.168.2.0/24`, por exemplo, o broadcast não alcança.

**Causa 3: Firewall no Deck.** Embora o SteamOS não tenha firewall ativo por padrão, se você instalou ou ativou `firewalld` ou `iptables`, as portas UDP podem estar bloqueadas:

```terminal
$ sudo iptables -L -n | head -10
Chain INPUT (policy ACCEPT)
target     prot opt source               destination

Chain FORWARD (policy ACCEPT)
target     prot opt source               destination

Chain OUTPUT (policy ACCEPT)
target     prot opt source               destination
```

Políticas `ACCEPT` significam que o firewall não está bloqueando nada. Se houvesse regras `DROP` ou `REJECT`, as portas do streaming precisariam ser liberadas explicitamente.

## Resumo

- O streaming usa UDP nas portas 27031 (descoberta/controle), 27032 (áudio) e 27036 (vídeo), e TCP em 27036/27037 (controle).
- `ss -tulnp | grep steam` mostra as portas em escuta; `ss -tunp | grep steam | grep ESTAB` mostra conexões ativas.
- AP Isolation no roteador impede a descoberta do Deck; `ping` entre dispositivos é o teste mais rápido.
- Dispositivos precisam estar na mesma sub-rede para descoberta automática via broadcast/multicast.
- O SteamOS não tem firewall ativo por padrão; verifique com `iptables -L -n` se suspeitar de bloqueios.

## Exercícios

1. Com o Steam aberto e Remote Play ativado, execute `ss -tulnp | grep steam` e anote quais portas estão em escuta e em quais interfaces.
2. Inicie um stream para outro dispositivo e, durante a transmissão, execute `ss -tunp | grep steam | grep ESTAB`. Quantas conexões UDP e TCP estão ativas?
3. Teste o AP Isolation: com Deck e celular no mesmo Wi-Fi, execute `ping` do Deck para o IP do celular. Funciona? Se não, procure "AP Isolation" nas configurações do roteador.
4. Verifique `ip addr show` no Deck e no dispositivo cliente. Eles estão na mesma sub-rede? Qual é o endereço de broadcast?
5. **Desafio.** Use `tcpdump` no Deck para capturar o tráfego de descoberta: `sudo tcpdump -i wlan0 port 27031`. Abra o Steam Link no celular e observe os pacotes de broadcast. Descreva a troca de mensagens que acontece até o pareamento.