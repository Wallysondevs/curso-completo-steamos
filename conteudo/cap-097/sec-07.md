O Tailscale da seção anterior conecta dispositivos entre si. Agora ele vira uma ferramenta de roteamento: o Deck pode rotear tráfego para uma sub-rede inteira (subnet router), servir como ponto de saída para toda a sua internet (exit node) e ter o comportamento refinado por ACLs. Esses recursos elevam o Tailscale de "SSH remoto facilitado" para "infraestrutura de rede pessoal".

:::objetivos
- Distinguir subnet router, exit node e relay/derp
- Configurar o Deck como subnet router para alcançar dispositivos além dele
- Usar o Deck como exit node para rotear todo o tráfego por ele
- Escrever ACLs para controlar quais dispositivos falam com quais
- Depurar problemas de roteamento com `tailscale ping` e `tailscale netcheck`
:::

## Subnet router: alcançando o que está atrás do Deck

Por padrão, o Tailscale só conecta os dispositivos que rodam o cliente. Se você tem, na sua casa, uma impressora, um NAS ou uma câmera IP na rede `192.168.1.0/24`, eles não aparecem na mesh — até você transformar um nó em **subnet router**.

Um subnet router é um dispositivo da mesh que "anuncia" uma rede externa. Quando você o ativa, os outros nós do Tailscale passam a rotear o tráfego destinado àquela sub-rede através dele. O Deck, sempre ligado em casa, é um candidato natural:

```terminal
$ sudo tailscale up --advertise-routes=192.168.1.0/24
```

Depois de anunciar, a rota precisa ser aprovada no console admin (Tailscale exige aprovação explícita por segurança):

```terminal
$ tailscale status
100.101.102.103  deck    ana@  linux   active; offers 192.168.1.0/24
```

A palavra `offers` indica que a rota foi anunciada mas ainda não aprovada. Aprove-a no console, e o status muda:

```terminal
$ tailscale status
100.101.102.103  deck    ana@  linux   active; relay "fra", tx 1220 rx 940
```

Agora, do laptop em qualquer lugar do mundo, você acessa a impressora pelo IP local dela: `http://192.168.1.50`, e o tráfego flui pelo túnel até o Deck, que o entrega na rede doméstica.

:::nota
Para o subnet router funcionar de verdade, o IP forwarding precisa estar ativo no Deck. O Tailscale normalmente cuida disso, mas se a rota não funcionar, verifique:

```terminal
$ sudo sysctl net.ipv4.ip_forward
net.ipv4.ip_forward = 1
```

Se estiver `0`, ative com `sudo sysctl -w net.ipv4.ip_forward=1` e torne persistente em `/etc/sysctl.d/`.
:::

## Exit node: toda a internet pelo Deck

Um **exit node** é mais radical: ele roteia *todo* o tráfego de internet do cliente, não apenas uma sub-rede. É útil quando você está numa rede Wi-Fi pública e quer que todo o tráfego saia pela sua conexão doméstica (mais segura, e com seu IP de casa).

Para fazer o Deck virar exit node:

```terminal
$ sudo tailscale up --advertise-exit-node
```

No console admin, aprovado o exit node, os clientes podem escolhê-lo:

```terminal
$ tailscale set --exit-node=deck
$ tailscale status
100.101.102.103  deck    ana@  linux   active; direct 192.168.1.5:41641
100.98.0.1       laptop  ana@  macos  active; exit node via deck
```

O `exit node via deck` na linha do laptop confirma que todo o tráfego dele agora sai pelo Deck. Para voltar ao normal:

```terminal
$ tailscale set --exit-node=
```

:::perigo
Um exit node direciona todo o tráfego de internet do cliente por ele. Isso significa que o Deck passa a ser o ponto onde todo esse tráfego emerge — com implicações de privacidade (seu ISP vê tudo) e de largura de banda (a conexão de casa vira gargalo). Use com consciência, e nunca como substituto de VPN de privacidade de terceiros.
:::

## Relay e DERP: quando o direto não é possível

O ideal do mesh é conexão direta entre nós. Mas NATs agressivos, CGNAT ou firewalls corporativos às vezes impedem o handshake direto. Nesse caso, o Tailscale recorre a servidores **DERP** (relay), que encaminham o tráfego criptografado quando o caminho direto falha.

```terminal
$ tailscale ping deck
pong from deck (100.101.102.103) via 192.168.1.5:41641 in 3ms          # direto
```

vs.

```terminal
$ tailscale ping deck
pong from deck (100.101.102.103) via DERP(fra) in 28ms                 # relay
```

O `via DERP(fra)` revela que a conexão está passando por um relay na região de Frankfurt, não direto. Isso é transparente e seguro (o tráfego é criptografado de ponta a ponta, o relay só repassa bytes opacos), mas é mais lento. Para diagnosticar por que o direto falha:

```terminal
$ tailscale netcheck

Report:
        * UDP: true
        * IPv4: yes, 192.168.1.5:41641
        * IPv6: no
        * MappingVariesByDestIP: false
        * HairPinning: false
        * Nearest DERP: 3 (fra)
```

O `UDP: true` e `IPv4: yes` indicam que o NAT traversal tem as condições para funcionar. `HairPinning: false` (comum em roteadores domésticos baratos) pode impedir conexão direta entre dois dispositivos atrás do mesmo NAT — o Tailscale então usa DERP.

## ACLs: quem fala com quem

As ACLs do Tailscale são um arquivo JSON no console admin (ou via `tailscale set` em contas com "policy file" habilitado). Elas definem, no estilo firewall, quais dispositivos podem acessar quais portas de quais outros:

```json
{
  "groups": {
    "group:decks": ["ana@example.com"]
  },
  "acls": [
    {
      "action": "accept",
      "src": ["group:decks"],
      "dst": ["tag:deck:*"]
    },
    {
      "action": "accept",
      "src": ["tag:deck"],
      "dst": ["tag:deck:22", "tag:deck:80"]
    }
  ],
  "tagOwners": {
    "tag:deck": ["ana@example.com"]
  }
}
```

Este exemplo usa **tags** (identificadores aplicados a dispositivos no console, independentes de qual usuário os autenticou). A primeira ACL permite qualquer dispositivo do grupo `decks` acessar qualquer porta de qualquer dispositivo com a tag `deck`. A segunda restringe o tráfego entre os próprios decks às portas 22 e 80.

Para aplicar tags a um dispositivo:

```terminal
$ sudo tailscale up --advertise-tags=tag:deck
```

:::dica
Tags resolvem um problema real: quando você autentica dispositivos com sua conta pessoal, todos eles herdam seus privilégios de ACL. Tags permitem atribuir um dispositivo a um "papel" (ex: `tag:deck`) e então escrever ACLs contra esse papel, independentemente de quem autenticou o nó. É o jeito certo de gerenciar múltiplos dispositivos compartilhados.
:::

## Rotas anunciadas vs. rotas aceitas

Um detalhe que confunde: anunciar uma rota (`--advertise-routes`) não basta — ela precisa ser aceita por quem vai usá-la. Do lado do cliente, o Tailscale só instala rotas de subnets que ele aceitou:

```terminal
$ tailscale set --accept-routes=true
$ tailscale status
100.101.102.103  deck    ana@  linux   active; direct 192.168.1.5:41641
	192.168.1.0/24 via 100.101.102.103
```

A linha `192.168.1.0/24 via 100.101.102.103` no status do cliente confirma que a rota do Deck foi aceita e está ativa. Sem `--accept-routes=true`, o cliente ignora os anúncios.

## Resumo

- Subnet router anuncia redes externas para a mesh; exige `--advertise-routes` + aprovação no console.
- Exit node roteia todo o tráfego de internet do cliente; use `--advertise-exit-node` e o cliente escolhe com `--exit-node`.
- Quando o caminho direto falha, o Tailscale usa relay DERP — mais lento, porém igualmente criptografado.
- `tailscale ping` e `tailscale netcheck` diagnosticam conexão direta vs. relay e a capacidade de NAT traversal.
- ACLs (com tags) controlam quais dispositivos falam com quais portas; clientes precisam de `--accept-routes` para usar subnets anunciadas.

## Exercícios

1. Anuncie a rota da sua rede doméstica (`--advertise-routes=192.168.1.0/24`), aprove-a no console e verifique o `tailscale status` do Deck.
2. Use `tailscale ping deck` a partir de outro dispositivo e identifique se a conexão é direta (`via IP`) ou relay (`via DERP`). Registre a latência.
3. Ative o exit node no Deck e, em outro dispositivo, rode `tailscale set --exit-node=deck`. Confirme com `tailscale status` e depois desfaça com `--exit-node=`.
4. Escreva uma ACL no console que bloqueie o acesso à porta 22 do Deck para todos exceto o seu desktop. Teste o acesso de outro dispositivo e observe a negação.
5. **Desafio.** Combine as seções anteriores: configure o Deck como subnet router + exit node, configure o firewall nftables (seção 5) para liberar apenas o necessário, e escreva um documento descrevendo o fluxo de um pacote do seu laptop (na rede móvel) até a impressora da sua casa — passando pelo túnel WireGuard, o NAT traversal, a interface `tailscale0` e a sub-rede doméstica.