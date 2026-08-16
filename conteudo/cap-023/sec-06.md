O Steam Deck não tem uma porta Ethernet — mas um dock USB-C muda isso. Conectar o dock a um cabo de rede ativa uma interface Ethernet que o NetworkManager reconhece automaticamente, entrega um IP via DHCP e, na maioria das vezes, simplesmente funciona. Mas há detalhes: a preferência entre Wi-Fi e cabo, a velocidade negociada e o comportamento de docks diferentes que vale a pena conhecer para quando o "simplesmente funciona" falhar.

:::objetivos
- Entender como o Steam Deck reconhece o dock e ativa a interface Ethernet
- Comparar as rotas e métricas entre o Wi-Fi e o cabo do dock
- Diagnosticar a velocidade negociada e o driver em uso
- Forçar a preferência pelo cabo e resolver conflitos de rede simultânea
:::

## O dock detectado pelo kernel

Ao plugar um dock USB-C com porta Ethernet, o kernel precisa reconhecer três coisas: o controlador USB do dock, o adaptador de rede embutido nele e, por fim, a conexão elétrica do cabo. O `journalctl` captura exatamente essa sequência:

```terminal
$ journalctl -k -n 20 --no-pager | grep -E 'enp|eth|r8152|ax88179'
jun 05 19:01:12 steamdeck kernel: usb 2-1.2: New USB device found, idVendor=0bda, idProduct=8153
jun 05 19:01:12 steamdeck kernel: r8152 2-1.2:1.0 eth0: v1.12.13
jun 05 19:01:13 steamdeck kernel: r8152 2-1.2:1.0 enp3s0f3u1u2: renamed from eth0
```

Aqui, o chip `r8152` (Realtek, comum em docks USB-C) foi encontrado e a interface foi renomeada para `enp3s0f3u1u2` pelo esquema de nomes previsíveis. O NetworkManager, que monitora novos dispositivos, dispara o DHCP em seguida:

```terminal
$ nmcli device status
DEVICE          TYPE      STATE                   CONNECTION
wlan0           wifi      connected               Casa-5G
enp3s0f3u1u2    ethernet  connected               Ethernet direto
lo              loopback  unmanaged               --
```

Duas conexões ativas ao mesmo tempo: Wi-Fi e cabo. E é aqui que a confusão começa — qual delas está de fato levando o tráfego?

## Cabo versus Wi-Fi: a métrica decide

Com duas conexões de pé, o kernel precisa decidir por qual delas envia os pacotes. A decisão se baseia na **métrica** da rota: quanto menor o número, mais preferida é a rota. Por padrão, o NetworkManager atribui métrica mais baixa à Ethernet, então o cabo ganha automaticamente do Wi-Fi enquanto os dois estão conectados.

```terminal
$ ip route show default
default via 192.168.1.1 dev enp3s0f3u1u2 proto dhcp metric 100
default via 192.168.1.1 dev wlan0 proto dhcp metric 600
```

A Ethernet ficou com `metric 100` e o Wi-Fi com `metric 600`. O tráfego sai pelo cabo. Se você quiser forçar o contrário, troque a métrica da conexão desejada:

```terminal
$ nmcli connection modify "Ethernet direto" ipv4.route-metric 800
$ nmcli connection down "Ethernet direto" && nmcli connection up "Ethernet direto"
```

Depois disso, reconecte e confirme com `ip route show default`: a Ethernet agora tem `metric 800` e o Wi-Fi (`600`) ganha prioridade. A métrica é uma ferramenta de controle fino, não um quebra-galho — use quando você souber qual interface deve vencer naquela rede específica.

:::dica
Se você só quer desabilitar o Wi-Fi para garantir que o tráfego passe pelo cabo, o atalho mais rápido é `nmcli radio wifi off`. Isso desliga o rádio, não apenas desconecta; o ícone da bandeja some. Para reativar: `nmcli radio wifi on`.
:::

## Velocidade negociada e o que esperar

A maioria dos docks USB-C tem chip Gigabit, mas a velocidade real depende do chip e do hub USB. O `ethtool` lê os parâmetros da camada física diretamente do driver:

```terminal
$ sudo ethtool enp3s0f3u1u2
Settings for enp3s0f3u1u2:
	Supported ports: [ MII ]
	Supported link modes:   10baseT/Half 10baseT/Full
	                        100baseT/Half 100baseT/Full
	                        1000baseT/Full
	Supported pause frame use: No
	Speed: 1000Mb/s
	Duplex: Full
	Port: MII
	PHYAD: 0
	Transceiver: internal
	Auto-negotiation: on
```

O `Speed: 1000Mb/s` e `Duplex: Full` confirmam que o cabo está negociando Gigabit. Se o campo `Speed` mostrar `100Mb/s`, desconfie do cabo, do dock ou de uma porta Fast Ethernet no outro lado. A linha `Auto-negotiation: on` significa que o adaptador e o switch combinaram a velocidade mais alta possível — isso é normal e esperado.

:::atencao
Se o dock exibe `Speed: Unknown!` ou `Link detected: no`, o problema está antes do sistema operacional: o cabo pode estar solto, o dock pode não ter reconhecido o adaptador, ou o driver (`r8152`, `ax88179_178a`) pode não ter sido carregado. Confira com `lsusb | grep -i ethernet` se o hardware foi detectado pelo menos como dispositivo USB.
:::

## O IP pelas mãos do DHCP

Quando o dock recebe o IP, o NetworkManager executa o mesmo ritual de qualquer conexão nova. O lease DHCP aparece no log:

```terminal
$ journalctl -u NetworkManager | grep -i 'dhcp.*enp'
jun 05 19:01:15 steamdeck NetworkManager[712]: <info>  dhcp4 (enp3s0f3u1u2): activation: beginning transaction
jun 05 19:01:16 steamdeck NetworkManager[712]: <info>  dhcp4 (enp3s0f3u1u2): state changed new lease, address=192.168.1.43
```

O `state changed new lease` e o endereço confirmam que o DHCP respondeu. É a mesma sequência de qualquer Wi-Fi, mas aqui a latência do DHCP tende a ser menor porque não há escaneamento de canais — o cabo é um meio dedicado.

:::exemplo
Em torneios locais ou LAN parties, o dock é a escolha preferida exatamente por eliminar a flutuação do Wi-Fi. Conecte o dock, o IP sobe em segundos, e a latência fica estável o tempo todo — sem interferência de canais, micro-ondas ou paredes.
:::

## Resumo

- O Steam Deck reconhece docks USB-C pelo kernel; o adaptador Ethernet aparece como `enp...` no `nmcli device status`.
- Com Wi-Fi e cabo ativos, a métrica da rota decide: Ethernet ganha (`metric 100`) contra Wi-Fi (`metric 600`).
- `ethtool` exibe a velocidade negociada (Gigabit ou 100Mbps) e o estado do link físico.
- O DHCP do dock funciona como qualquer conexão cabeada, negociado em segundos, e o log do NetworkManager registra o lease.

## Exercícios

1. Ligue o dock com cabo e identifique o novo dispositivo Ethernet em `nmcli device status` e `ip addr`.
2. Rode `ip route show default` e confirme que a métrica da Ethernet é menor que a do Wi-Fi; explique o que isso significa para o tráfego.
3. Use `sudo ethtool <interface>` para ler a velocidade negociada. Sua rede está em 1000Mb/s?
4. Desligue o rádio Wi-Fi com `nmcli radio wifi off`, confirme que só a Ethernet fica ativa e note se houve queda de ping.
5. **Desafio.** Conecte o dock e, com Wi-Fi e cabo ativos, altere `ipv4.route-metric` da rede Ethernet para um valor maior que o do Wi-Fi e verifique com `ip route` qual rota venceu.