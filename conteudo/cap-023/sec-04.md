Uma VPN cria um túnel criptografado entre o seu Deck e um servidor remoto, fazendo todo o tráfego sair por aquele servidor como se você estivesse em outro lugar. No Modo Desktop, o NetworkManager é capaz de tratar a VPN como mais um perfil de conexão — com suporte nativo a OpenVPN e WireGuard. Você pode configurá-la pela interface do KDE ou pelo `nmcli`, e é isso que esta seção destrincha.

:::objetivos
- Entender o papel do plugin de VPN do NetworkManager e os perfis OpenVPN e WireGuard
- Importar um arquivo `.ovpn` de configuração pelo `nmcli`
- Ativar e desativar uma VPN e conferir o tunelamento do tráfego
- Reconhecer quando a VPN está funcionando de verdade (e não apenas "conectada")
:::

## VPN como perfil do NetworkManager

O NetworkManager não faz a criptografia sozinho: ele delega o trabalho pesado a programas como o `openvpn` ou o `wireguard`, através de **plugins**. No SteamOS, o suporte a esses dois é o que cobre a imensa maioria dos provedores. Uma vez que você importa a configuração do seu provedor, a VPN aparece na lista de conexões como qualquer Wi-Fi, e ativá-la é tão simples quanto escolher uma rede.

O plugin precisa estar instalado. Para OpenVPN e WireGuard, respectivamente:

```terminal
$ sudo apt install network-manager-openvpn network-manager-openvpn-gnome
$ sudo apt install wireguard-tools
```

O pacote `network-manager-openvpn` fornece o plugin em si, e o sufixo `-gnome` traz o diálogo gráfico correspondente. Depois disso, um perfil de tipo `vpn` já pode ser criado.

:::perigo
Instalar pacotes no SteamOS fora do contexto esperado pode conflitar com o modelo de sistema imutável. O SteamOS usa um sistema de arquivos de raiz somente-leitura em camadas; prefira instalar esses pacotes num ambiente onde o overlay de escrita esteja ativo, e tenha consciência de que atualizações do sistema podem reverter mudanças. Alternativas como o pacote Flatpak ou o WireGuard já embarcado merecem atenção antes de mexer na raiz.
:::

## Importando um arquivo `.ovpn`

Provedores comerciais (e muitos servidores próprios) entregam um arquivo `.ovpn` — um texto com a configuração do OpenVPN embutida. O `nmcli` importa esse arquivo e o transforma num perfil gerenciado:

```terminal
$ nmcli connection import type openvpn file ~/Downloads/meu-servidor.ovpn
Connection 'meu-servidor' (7f1a2b3c-4d5e-4f68-9a0b-1c2d3e4f5a6b) successfully added.
```

A partir daqui, `meu-servidor` aparece em `nmcli connection show` com tipo `vpn`. Para ativá-lo, basta conectar como faria com qualquer rede:

```terminal
$ nmcli connection up meu-servidor
Connection successfully activated (D-Bus active path: /org/freedesktop/NetworkManager/ActiveConnection/5)
```

O comando devolve o caminho D-Bus da conexão ativa — um detalhe interno, mas o "successfully activated" é o sinal que importa. Para desligar, o inverso:

```terminal
$ nmcli connection down meu-servidor
```

## WireGuard do jeito simples

O WireGuard é mais novo, mais leve e muito mais rápido que o OpenVPN, e o NetworkManager o trata com o mesmo carinho. Em vez de importar um `.ovpn`, você cria um perfil de tipo `wireguard` apontando para um arquivo de configuração `.conf`:

```terminal
$ nmcli connection import type wireguard file ~/Downloads/wg0.conf
Connection 'wg0' (3c2d4e5f-6a7b-4c8d-0e1f-2a3b4c5d6e7f) successfully added.
```

O arquivo `.conf` do WireGuard segue um formato próprio com as seções `[Interface]` e `[Peer]`, contendo a chave privada e o endpoint do servidor:

```conf
[Interface]
Address = 10.10.0.2/24
PrivateKey = 0PyDk...=
DNS = 1.1.1.1

[Peer]
PublicKey = ZBBBB...=
Endpoint = vpn.exemplo.com:51820
AllowedIPs = 0.0.0.0/0
```

O `AllowedIPs = 0.0.0.0/0` é o que roteia **todo** o tráfego pelo túnel. Para ativar, o mesmo `nmcli connection up wg0`.

:::atencao
Na primeira vez que usar uma conexão VPN criada por importação, o NetworkManager pode armazenar a senha/chave em um *agente de segredos* (no KDE, o KWallet), pedindo uma senha para desbloquear. Se a ativação ficar parada pedindo "secrets", é o KWallet que está esperando a liberação, não um erro de conexão.
:::

## Provando que o túnel funciona

"Conectado" no `nmcli` não significa que o tráfego realmente saiu pela VPN. A prova definitiva é comparar seu IP público antes e depois de ativar o túnel:

```terminal
$ nmcli connection show --active
NAME        UUID                                  TYPE      DEVICE
wlan0       e6e1f0a1-9c31-4a86-8f5d-2b3a7d0c9e12  wifi      wlan0
meu-servidor 7f1a2b3c-4d5e-4f68-9a0b-1c2d3e4f5a6b vpn       wlan0
```

Repare que o perfil `meu-servidor` aparece com `TYPE vpn` mas na coluna `DEVICE` ainda mostra `wlan0` — a VPN roda sobre o Wi-Fi, não substitui o dispositivo físico. E para ver a mudança de rota:

```terminal
$ ip route
default via 10.10.0.1 dev wg0 proto static
default via 192.168.1.1 dev wlan0 proto dhcp metric 100
10.10.0.0/24 dev wg0 proto kernel scope link src 10.10.0.2
```

Quando o túnel está ativo, aparecem duas rotas `default`: a da VPN (`dev wg0`, para o tráfego tunelado) e a original do Wi-Fi (`dev wlan0`, com `metric` maior, usada apenas para alcançar o próprio servidor VPN). A existência da rota `dev wg0` é a confirmação de que seu tráfego está saindo pelo túnel.

:::dica
Para checar o IP público que o mundo enxerga, o `curl` resolve: `curl -s ifconfig.me`. Compare o número com a VPN desligada e ligada — se forem diferentes e o segundo corresponder ao servidor VPN, o túnel está íntegro.
:::

## Resumo

- O NetworkManager trata a VPN como um perfil de conexão comum, delegando a criptografia a plugins como OpenVPN e WireGuard.
- `nmcli connection import type openvpn file <arquivo.ovpn>` transforma uma config OpenVPN em perfil gerenciado.
- WireGuard é importado de forma análoga com `type wireguard` e um arquivo `.conf` com `[Interface]` e `[Peer]`.
- `nmcli connection up/down <perfil>` ativa e desativa a VPN; `ip route` revela a rota `dev wg0` que prova o tunelamento.

## Exercícios

1. Instale o suporte a OpenVPN (se ainda não estiver) e verifique com `nmcli connection show` se já existe algum perfil do tipo `vpn`.
2. Crie ou obtenha um arquivo `.ovpn` de exemplo e importe-o com `nmcli connection import`; liste os perfis para confirmar o tipo.
3. Ative e desative a VPN com `nmcli connection up/down` e observe a diferença em `nmcli connection show --active`.
4. Com a VPN ligada, rode `ip route` e identifique a rota `default` que aponta para `dev wg0` (ou `tun0` no OpenVPN).
5. **Desafio.** Compare `curl -s ifconfig.me` com a VPN ligada e desligada; explique por que o IP mudou e o que isso prova sobre o túnel.
