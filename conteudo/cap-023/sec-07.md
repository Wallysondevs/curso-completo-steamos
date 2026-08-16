DHCP é cômodo: você liga, o roteador entrega um IP, e tudo funciona. Mas há cenários — um servidor local, uma LAN sem DHCP, ou um laboratório de rede — em que você precisa fixar o IP e o DNS na mão. O NetworkManager trata isso com o método `manual` no perfil de conexão, e a configuração pode ser feita tanto pela GUI quanto pelo `nmcli`.

:::objetivos
- Configurar um endereço IP fixo, máscara e gateway pelo `nmcli`
- Associar um servidor DNS personalizado ao perfil de conexão
- Validar a configuração com `ip addr`, `ip route` e `resolvectl status`
- Diferenciar DNS global (do sistema) de DNS por perfil do NetworkManager
:::

## O método manual

Toda conexão do NetworkManager tem uma seção `[ipv4]` que, por padrão, usa `method=auto`. Trocar para `method=manual` significa "não me dê DHCP; eu vou informar o IP, a máscara e o gateway". O `nmcli` escreve esses campos com uma sintaxe compacta:

```terminal
$ nmcli connection modify "Ethernet direto" \
    ipv4.method manual \
    ipv4.addresses 192.168.1.100/24 \
    ipv4.gateway 192.168.1.1 \
    ipv4.dns "1.1.1.1 8.8.8.8"
```

Depois de modificar, a conexão precisa ser reativada para aplicar:

```terminal
$ nmcli connection down "Ethernet direto"
$ nmcli connection up "Ethernet direto"
Connection successfully activated (D-Bus active path: /org/freedesktop/NetworkManager/ActiveConnection/7)
```

O par `192.168.1.100/24` significa IP `192.168.1.100` com máscara de 24 bits (`255.255.255.0`). O gateway `192.168.1.1` é o roteador para onde vão os pacotes cujo destino não está na rede local.

:::perigo
Antes de fixar um IP, verifique se ele não está no range do DHCP do roteador. Se o DHCP entregar o mesmo IP que você fixou para outro dispositivo, os dois vão duelar com conflito de endereço e nenhum funcionará direito. Olhe no painel do roteador o range DHCP (por exemplo, `.100` a `.200`) e escolha um número fora desse intervalo.
:::

## Conferindo o que foi feito

Três comandos, três confirmações. O IP e a máscara vêm pelo `ip addr`, o gateway pelo `ip route`, e o DNS pela combinação de `resolvectl` e do perfil no NetworkManager:

```terminal
$ ip addr show enp3s0f3u1u2 | grep inet
    inet 192.168.1.100/24 brd 192.168.1.255 scope global noprefixroute enp3s0f3u1u2
$ ip route | grep default
default via 192.168.1.1 dev enp3s0f3u1u2 proto static metric 100
$ nmcli connection show "Ethernet direto" | grep ipv4
ipv4.method:                            manual
ipv4.dns:                               1.1.1.1,8.8.8.8
ipv4.addresses:                         192.168.1.100/24
ipv4.gateway:                           192.168.1.1
```

A linha `ip route` exibe `proto static` para a rota padrão — é o sinal de que ela foi definida manualmente, não por DHCP. O `metric 100` é o valor padrão para Ethernet; você pode sobrescrevê-lo com `ipv4.route-metric` se desejar.

## DNS: o que o sistema realmente usa

O sistema de DNS do SteamOS tem dois níveis. O NetworkManager pode definir o DNS por perfil (campo `ipv4.dns`), mas o daemon `systemd-resolved` é quem de fato recebe as consultas e as encaminha. O `resolvectl` mostra o estado consolidado:

```terminal
$ resolvectl status
Global
         Protocols: -LLMNR -mDNS -DNSOverTLS DNSSEC=no/unsupported
  resolv.conf mode: stub

Link 2 (wlan0)
    Current Scopes: DNS
         Protocols: +DefaultRoute +LLMNR -mDNS -DNSOverTLS DNSSEC=no/unsupported
Current DNS Server: 192.168.1.1
       DNS Servers: 192.168.1.1

Link 3 (enp3s0f3u1u2)
    Current Scopes: DNS
         Protocols: +DefaultRoute +LLMNR -mDNS -DNSOverTLS DNSSEC=no/unsupported
Current DNS Server: 1.1.1.1
       DNS Servers: 1.1.1.1 8.8.8.8
```

Repare: a interface `wlan0` ainda usa o DNS do DHCP (`192.168.1.1`), enquanto `enp3s0f3u1u2` mostra os servidores que configuramos (`1.1.1.1` e `8.8.8.8`). Isso acontece porque o DNS no NetworkManager é **por perfil**: cada conexão pode ter seus próprios servidores. O `systemd-resolved` consolida as consultas e decide para qual servidor mandar cada uma.

:::nota
O SteamOS usa o `systemd-resolved` no modo `stub` (veja `resolv.conf mode: stub`). Nesse modo, `/etc/resolv.conf` aponta para `127.0.0.53`, que é o stub listener local do resolved. Não edite esse arquivo manualmente; use `nmcli connection modify` ou a GUI para alterar o DNS, e o resolved refletirá a mudança.
:::

## IP fixo pela GUI do KDE

O mesmo resultado se alcança sem terminal: em System Settings → Rede → Conexões, edite a conexão desejada e vá para a aba **IPv4**. Mude o método de "Automático (DHCP)" para "Manual" e preencha os endereços:

- **Endereço IP** — `192.168.1.100`
- **Máscara** — `255.255.255.0`
- **Gateway** — `192.168.1.1`
- **DNS** — `1.1.1.1, 8.8.8.8`

Clique em "Aplicar" e reconecte. O perfil salvo no disco agora contém:

```ini
[ipv4]
method=manual
address1=192.168.1.100/24,192.168.1.1
dns=1.1.1.1;8.8.8.8;
```

É exatamente o que o `nmcli` teria escrito. A diferença é que pela GUI você não precisa lembrar a sintaxe da flag `ipv4.addresses`.

## Resumo

- `nmcli connection modify <NOME> ipv4.method manual ipv4.addresses <IP/MÁSCARA> ipv4.gateway <GW> ipv4.dns "<DNS1> <DNS2>"` fixa IP e DNS.
- Reative a conexão com `nmcli connection down` seguido de `up` para aplicar as mudanças.
- `resolvectl status` mostra o DNS que cada interface está usando; o `systemd-resolved` consolida as consultas.
- Pela GUI, a aba IPv4 de uma conexão permite escolher "Manual" e preencher IP, máscara, gateway e DNS.

## Exercícios

1. Anote os valores atuais de IP, gateway e DNS da sua conexão cabeada com `ip addr`, `ip route` e `resolvectl status`.
2. Configure um IP fixo (fora do range DHCP do roteador) com `nmcli connection modify`, reconecte e valide com os três comandos.
3. Troque o método de volta para `auto` com `nmcli connection modify "Ethernet direto" ipv4.method auto`, reconecte e veja o IP mudar de volta.
4. Edite o DNS do perfil para usar apenas `1.1.1.1` e confirme no `resolvectl status` que o servidor aparece na interface correta.
5. **Desafio.** Crie um perfil de conexão separado com IP fixo num range diferente (ex.: `10.0.0.100/24`) e conecte os dois perfis alternadamente, observando como o `ip addr` reflete a mudança.