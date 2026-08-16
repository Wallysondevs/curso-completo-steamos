"A internet não funciona" é a frase mais vaga — e a mais comum — que se ouve quando algo quebra. No SteamOS, você tem um arsenal de quatro comandos que respondem qualquer pergunta de conectividade em menos de um minuto: `ping` para testar o alcance, `ip route` para conferir o caminho, `dig` para interrogar o DNS e `resolvectl` para inspecionar a resolução de nomes que o sistema está usando. Esta seção monta o roteiro de diagnóstico na ordem certa.

:::objetivos
- Seguir um fluxo de diagnóstico em quatro etapas: alcance, rota, DNS e serviço
- Usar `ping` para testar conectividade básica e latência
- Interpretar a saída de `dig` e `resolvectl` para diagnosticar resolução de nomes
- Identificar quando o problema está no cliente (Deck) versus na infraestrutura (roteador, provedor, servidor DNS)
:::

## O roteiro em quatro passos

Quando a conexão falha, o instinto é abrir dez abas e testar tudo ao mesmo tempo — e aí ninguém entende nada. Siga esta ordem e você isola o problema em no máximo quatro comandos:

| Ordem | Pergunta | Comando |
|---|---|---|
| 1 | O Deck alcança a internet? | `ping 1.1.1.1` |
| 2 | A rota padrão está correta? | `ip route` |
| 3 | O DNS está resolvendo nomes? | `dig archlinux.org` |
| 4 | O serviço está saudável? | `systemctl status NetworkManager systemd-resolved` |

Se o passo 1 falha, o problema é de alcance (Wi-Fi, cabo, roteador, provedor). Se o 1 funciona mas o 3 falha, o problema é DNS. Se os três primeiros passam, o problema não é de rede — é da aplicação, do firewall ou do servidor destino. Vamos detalhar cada passo.

## Passo 1: ping — o pulso da rede

O `ping` manda pacotes ICMP e espera a resposta. Se o destino responder, há rota de ida e volta funcionando:

```terminal
$ ping -c 4 1.1.1.1
PING 1.1.1.1 (1.1.1.1) 56(84) bytes of data.
64 bytes from 1.1.1.1: icmp_seq=1 ttl=59 time=12.3 ms
64 bytes from 1.1.1.1: icmp_seq=2 ttl=59 time=11.8 ms
64 bytes from 1.1.1.1: icmp_seq=3 ttl=59 time=12.1 ms
64 bytes from 1.1.1.1: icmp_seq=4 ttl=59 time=11.5 ms

--- 1.1.1.1 ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3005ms
rtt min/avg/max/mdev = 11.511/11.925/12.263/0.285 ms
```

`1.1.1.1` é um IP de propósito-geral da Cloudflare, e um alvo melhor que `8.8.8.8` para testes porque responde consistentemente a ICMP. Os números-chave são `0% packet loss` e o `time=` médio: perda de pacotes acima de 2% já causa engasgos em jogos, e latência acima de 80 ms começa a incomodar.

Se o `ping` falha com `Destination Host Unreachable`, o pacote não sabe para onde ir — em geral, a rota padrão está ausente. Se o erro for `Network is unreachable`, a interface nem sequer está `UP`.

:::dica
Use `ping -c 4 <IP>` com limite de quatro pacotes. Sem `-c`, o `ping` roda indefinidamente e você precisa interromper com `[[Ctrl+C]]`.
:::

## Passo 2: ip route — o mapa da saída

Se o `ping` falha, o próximo suspeito é a rota. `ip route` mostra exatamente qual porta de saída o kernel escolheu para o tráfego padrão:

```terminal
$ ip route
default via 192.168.1.1 dev wlan0 proto dhcp metric 600
192.168.1.0/24 dev wlan0 proto kernel scope link src 192.168.1.42
```

Duas entradas bastam. A primeira (`default via`) é a rota para onde vão os pacotes que não são da rede local — sem ela, só a rede local responde. A segunda (`192.168.1.0/24`) é a rota da própria rede, que permite falar com o roteador e com outros dispositivos no mesmo Wi-Fi. Se nenhuma `default` aparece, você perdeu o gateway, e o culpado costuma ser o DHCP que falhou ou um perfil `manual` incompleto.

## Passo 3: dig — quem resolve os nomes

O `ping 1.1.1.1` funciona, mas `ping archlinux.org` falha? O problema é DNS. O `dig` interroga servidores diretamente e revela a anatomia da consulta:

```terminal
$ dig archlinux.org +short
95.216.144.21
$ dig archlinux.org
...
;; Got answer:
;; ->>HEADER<<- opcode: QUERY, status: NOERROR, id: 30147
;; QUESTION SECTION:
;archlinux.org.                 IN      A

;; ANSWER SECTION:
archlinux.org.          300     IN      A       95.216.144.21

;; Query time: 24 msec
;; SERVER: 127.0.0.53#53(127.0.0.53) (UDP)
```

A flag `+short` devolve só o IP, útil para scripts. A saída longa mostra o servidor consultado (`SERVER: 127.0.0.53`, o stub local do `systemd-resolved`), o tempo de resposta (`Query time: 24 msec`) e o `status: NOERROR`, que significa "o nome existe e eu achei".

Se o `status` for `NXDOMAIN`, o nome não existe nos servidores de DNS — talvez você tenha digitado errado ou o domínio expirou. Se for `SERVFAIL`, o servidor DNS consultado está quebrado. Essas distinções ajudam a apontar o culpado rapidamente.

```terminal
$ dig nome-que-nao-existe-xyz123.org
...
;; ->>HEADER<<- opcode: QUERY, status: NXDOMAIN, id: 15234
...
```

## Passo 4: o estado dos serviços

Por último, confirme que ambos os serviços essenciais estão ativos:

```terminal
$ systemctl is-active NetworkManager systemd-resolved
active
active
```

`active` nos dois significa que o daemon de rede e o resolvedor estão de pé. Se um deles retornar `inactive`, reative:

```terminal
$ sudo systemctl restart NetworkManager
$ sudo systemctl restart systemd-resolved
```

E se mesmo assim o problema persistir, o `journalctl` entrega o histórico detalhado de cada um.

## Diagnóstico em ação

Vamos montar o cenário real: você está no dock, mas o navegador não carrega nada. Execute os três passos:

```terminal
$ ping -c 2 1.1.1.1
ping: connect: Network is unreachable
$ ip route | grep default
$
$ nmcli device status
DEVICE          TYPE      STATE                   CONNECTION
wlan0           wifi      connected               Casa-5G
enp3s0f3u1u2    ethernet  connected               Ethernet direto
```

O `ping` falha com `Network is unreachable` e `ip route` não mostra `default`. Mas duas interfaces estão conectadas. O problema? Duas redes com gateways conflitantes, e o NetworkManager pode ter descartado a rota padrão esperando uma delas "vencer". A solução rápida: `nmcli radio wifi off` para forçar só o cabo, e uma rota default aparece.

:::atencao
Quando duas interfaces têm IPs no mesmo range (ex.: ambas `192.168.1.x`), o roteamento local fica ambíguo. O kernel escolhe a interface com a métrica mais baixa, mas a rota `default` pode sumir se as duas vierem de DHCP com gateways idênticos. É por isso que o cenário de Wi-Fi + dock exige atenção às métricas e, em alguns casos, desligar uma das interfaces.
:::

## Resumo

- Siga a ordem: `ping` → `ip route` → `dig` → `systemctl status` para isolar o problema em alcance, rota, DNS ou serviço.
- `ping -c 4 1.1.1.1` testa alcance; `0% packet loss` e latência baixa indicam caminho saudável.
- `ip route` confirma a rota padrão; a ausência de `default` indica gateway perdido.
- `dig <domínio>` revela se o DNS está funcionando; `NXDOMAIN` é erro de nome; `SERVFAIL` é erro do servidor.

## Exercícios

1. Execute `ping -c 4 1.1.1.1` e anote a latência média e o percentual de perda de pacotes.
2. Rode `ping -c 4 archlinux.org` e depois `dig archlinux.org +short`; compare as saídas e explique por que o `ping` usa o resolvedor local enquanto o `dig` interroga o DNS diretamente.
3. Simule um problema: desconecte o Wi-Fi (`nmcli device disconnect wlan0`) e execute o roteiro de diagnóstico. Em qual passo ele falha?
4. Pergunte a um domínio inexistente com `dig dominio-falso-xyz.com` e identifique o código `NXDOMAIN` na resposta.
5. **Desafio.** Force um erro de DNS configurando um servidor DNS inválido no perfil (`ipv4.dns 10.255.255.255`), reconecte e tente `ping archlinux.org`. Depois use `dig @1.1.1.1 archlinux.org` (ignorando o resolvedor local) para provar que o problema é o DNS, não a conectividade.