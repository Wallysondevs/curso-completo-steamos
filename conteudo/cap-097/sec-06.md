O Steam Deck é ótimo para acessar quando está na mesma rede Wi-Fi que o seu desktop. Mas e quando você está num hotel, o Deck na mochila ligado na rede do café, e quer transferir um save? E quando quer acessar o Deck de casa enquanto está no trabalho? É exatamente o que o Tailscale resolve: uma rede privada que se forma automaticamente entre seus dispositivos, em qualquer lugar, sem abrir portas no roteador nem configurar DDNS.

:::objetivos
- Entender o modelo de rede mesh do Tailscale e por que ele dispensa portas abertas
- Instalar o Tailscale no Steam Deck e autenticar o dispositivo
- Acessar o Deck pelo IP 100.x.x.x de qualquer rede
- Gerenciar dispositivos pela interface administrativa do Tailscale
- Integrar o Tailscale com o SSH já configurado nas seções anteriores
:::

## O que é uma rede mesh e por que ela muda o jogo

Uma VPN tradicional concentra o tráfego num servidor central: todos os clientes se conectam a ele, e ele roteia entre eles. Isso cria um gargalo e exige que você mantenha e configure um servidor. O Tailscale usa o modelo **mesh**: cada dispositivo se conecta diretamente aos outros, ponto a ponto, formando uma teia. O servidor de coordenação do Tailscale apenas apresenta os dispositivos uns aos outros e troca chaves públicas — depois disso, o tráfego flui direto, sem passar por terceiros.

Por baixo, o Tailscale usa o protocolo WireGuard, conhecido por ser rápido e enxuto. A mágica do Tailscale está em cima dele: autenticação integrada (conta Google, GitHub, Microsoft), distribuição automática de chaves, e NAT traversal para funcionar atrás de qualquer roteador sem você abrir porta nenhuma.

```terminal
$ ip -br addr show tailscale0
tailscale0       UP             100.101.102.103/32
```

Cada dispositivo recebe um IP fixo na faixa `100.64.0.0/10` (o espaço CGNAT). Esse IP não muda quando você troca de rede Wi-Fi — é a identidade do dispositivo na mesh.

:::nota
O endereço `100.x.x.x` parece público, mas vem de uma faixa reservada para CGNAT (Carrier-Grade NAT) que não é roteável na internet pública. O Tailscale aluga esse espaço para dar a cada nó um IP estável e único dentro da malha.
:::

## Instalando no Steam Deck

Há duas formas de instalar o Tailscale no SteamOS. A oficial (via repositório distro) e a manual. Como o SteamOS é Arch, o caminho mais limpo é pelo AUR, mas ele exige ferramentas de build que o modo desktop padrão não traz. A abordagem recomendada e estável é baixar o binário estático:

```terminal
$ sudo steamos-readonly disable
$ curl -fsSL https://tailscale.com/install.sh | sh
$ sudo systemctl enable --now tailscaled
$ sudo steamos-readonly enable
```

O script de instalação detecta a distro e configura o serviço `tailscaled` (o daemon) e o binário `tailscale` (o cliente). Depois de habilitar o daemon, você autentica o dispositivo:

```terminal
$ sudo tailscale up
To authenticate, visit:
        https://login.tailscale.com/a/abcdef123456
```

Abra o link no navegador, faça login com sua conta, e autorize o dispositivo. Alguns segundos depois:

```terminal
$ tailscale status
100.101.102.103  deck                 ana@  linux   -
100.98.0.1       desktop              ana@  macos  active; direct 192.168.1.5:41641, tx 560 rx 1.2k
```

A coluna `active; direct` indica que o `desktop` está alcançando o `deck` diretamente (mesmo NAT, conexão ponto a ponto). O `tx`/`rx` mostra tráfego trocado.

:::atencao
O comando `tailscale up` com `sudo` autentica como o usuário root no Tailscale. Isso é necessário porque o serviço `tailscaled` roda como root, mas cria uma pequena pegadinha: as preferências de login (como `--ssh` ou `--accept-dns`) passam a ser "por máquina". É o comportamento correto para um servidor headless como o Deck.
:::

## Acessando o Deck de qualquer lugar

Com o Tailscale rodando, o Deck ganha um endereço estável. Do seu desktop, em qualquer rede:

```terminal
$ ssh deck@100.101.102.103
(deck@steamdeck) $
```

Funciona idêntico ao IP local — porque, do ponto de vista do SSH, é só mais um IP. A diferença é que agora o caminho passa pelo túnel WireGuard, criptografado de ponta a ponta, atravessando NATs automaticamente.

Combine isso com o `~/.ssh/config` da seção 2:

```text
Host deck-local
    HostName 192.168.1.105
    User deck
    IdentityFile ~/.ssh/id_ed25519

Host deck-vpn
    HostName 100.101.102.103
    User deck
    IdentityFile ~/.ssh/id_ed25519
```

Agora `ssh deck-local` usa a rede doméstica (mais rápido, sem túnel) e `ssh deck-vpn` funciona de qualquer lugar.

## A interface administrativa

O console web do Tailscale (`login.tailscale.com/admin`) é onde você gerencia todos os dispositivos: renomear, aprovar chaves, revogar acesso, aplicar ACLs. Alguns comandos equivalentes no CLI:

```terminal
$ tailscale status --json | jq '.Self.DNSName'
"deck.tailnet-abc123.ts.net"

$ tailscale set --hostname deck
$ tailscale ip -4
100.101.102.103
```

O `tailscale set --hostname deck` renomeia o dispositivo — útil para ter nomes claros na mesh. O `tailscale ip -4` mostra o próprio IPv4 do nó. E o DNS mágico do Tailscale (`deck.tailnet-abc123.ts.net`) permite acessar o Deck por nome, sem decorar IP:

```terminal
$ ssh deck@deck.tailnet-abc123.ts.net
```

:::dica
Use o MagicDNS do Tailscale para não precisar decorar IPs. Cada dispositivo ganha um nome `hostname.tailnet-xxxx.ts.net`. Verifique se o MagicDNS está habilitado no console admin (padrão em contas novas) e conecte-se por nome.
:::

## Tailscale e o SSH do sistema

O Tailscale oferece um `--ssh` próprio que gerencia chaves SSH automaticamente. É conveniente, mas sobrepõe-se ao OpenSSH que você já configurou. A recomendação aqui é manter os dois separados: use o OpenSSH do sistema para acesso por chave (seções 2 e 3) e o Tailscale apenas como camada de rede. Isso dá a você controle fino sobre quem entra e como, sem depender do console do Tailscale para a política de acesso.

Se preferir a simplicidade do Tailscale SSH, saiba que ele desativa o `sshd` do sistema e assume o controle da porta 22 no endereço Tailscale apenas — o SSH local continua intacto. Para quem já investiu nas configurações das seções anteriores, o OpenSSH puro é o caminho mais previsível.

## Resumo

- O Tailscale forma uma rede mesh ponto a ponto sobre WireGuard, sem servidor central de tráfego.
- Cada nó recebe um IP fixo `100.x.x.x` que não muda ao trocar de rede.
- A instalação no SteamOS usa o script oficial `tailscale.com/install.sh` e o daemon `tailscaled`.
- `tailscale up` gera um link de autenticação; o dispositivo aparece no console admin após o login.
- O SSH por Tailscale funciona igual ao local; o MagicDNS permite acesso por nome de host.

## Exercícios

1. Instale o Tailscale no Deck, autentique e confirme que o dispositivo aparece no console admin.
2. Do seu desktop (ou celular, com o app Tailscale), conecte-se ao Deck por SSH usando o endereço `100.x.x.x`.
3. Acesse o console admin e renomeie o dispositivo para algo descritivo. Verifique com `tailscale status` que a mudança propagou.
4. Habilite o MagicDNS e teste o acesso por nome (`ssh deck@deck.tailnet-xxx.ts.net`). O que acontece quando o MagicDNS está desligado?
5. **Desafio.** Configure dois blocos no `~/.ssh/config` — `deck-local` e `deck-vpn` — e meça a latência de cada um com `ping`. Compare os resultados quando ambos os dispositivos estão na mesma rede vs. em redes diferentes (mesmo que você tenha que usar o celular na rede móvel para simular). Explique por que o caminho "local" é preferível quando disponível.