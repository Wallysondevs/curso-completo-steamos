A seção anterior ensinou a sintaxe do nftables. Agora ela vira política: um firewall real, adequado ao Steam Deck como dispositivo móvel que alterna entre redes domésticas, públicas e a VPN. O objetivo não é transformar o Deck num roteador corporativo, mas garantir que, ao abrir o SSH para conveniência, você não esteja abrindo também para o mundo.

:::objetivos
- Projetar uma política de firewall com `policy drop` como padrão na cadeia `input`
- Permitir tráfego essencial: SSH, Tailscale, mDNS e respostas a conexões locais
- Tornar as regras persistentes entre reinicializações
- Proteger o firewall contra auto-bloqueio durante a configuração remota
- Auditar o ruleset com `nft list ruleset` e verificar a política aplicada
:::

## Política de cadeia: accept vs. drop

A decisão mais importante no design do firewall é a política padrão das cadeias. `policy accept` é seguro para teste: se você errar uma regra, o tráfego ainda flui. `policy drop` é seguro para produção: se você esquecer de liberar algo, aquilo para de funcionar — mas nada de indesejado entra.

No Deck, faz sentido `policy drop` na cadeia `input`: tráfego que chega de fora só entra se você explicitamente permitir. Na `output`, mantemos `policy accept`: o Deck precisa sair para a internet (Steam, downloads, Tailscale) sem que cada destino seja liberado um a um.

```terminal
$ sudo nft add table inet firewall
$ sudo nft add chain inet firewall input { type filter hook input priority 0 \; policy drop \; }
$ sudo nft add chain inet firewall output { type filter hook output priority 0 \; policy accept \; }
```

Repare no `policy drop` na cadeia `input`. A partir desse momento, toda conexão de entrada é bloqueada — inclusive a sua sessão SSH atual, se você estiver configurando remotamente. É por isso que o próximo passo é crítico.

:::atencao
Nunca mude a política para `drop` numa sessão remota sem antes adicionar a regra que permite seu próprio tráfego. A ordem é: crie a tabela com `policy accept`, adicione todas as regras, teste, e só então troque para `policy drop` com `nft chain inet firewall input '{ policy drop; }'`. Se você aplicar `policy drop` primeiro, trava tudo.
:::

## O conjunto mínimo de regras

Eis um firewall inicial para o Deck com SSH ativo:

```terminal
$ sudo nft add rule inet firewall input ct state established,related accept
$ sudo nft add rule inet firewall input iif lo accept
$ sudo nft add rule inet firewall input icmp type echo-request accept
$ sudo nft add rule inet firewall input ip6 nexthdr icmpv6 accept
$ sudo nft add rule inet firewall input udp dport 5353 accept
$ sudo nft add rule inet firewall input tcp dport 22 accept
```

O que cada linha faz:

| Regra | Motivo |
|---|---|
| `ct state established,related accept` | Permite respostas a conexões iniciadas pelo Deck (Steam, navegador, ping) |
| `iif lo accept` | Tráfego de loopback — essencial para comunicação entre processos locais |
| `icmp type echo-request accept` | Permite ping IPv4 — útil para diagnóstico |
| `ip6 nexthdr icmpv6 accept` | Equivalente para IPv6 (Neighbor Discovery depende de ICMPv6) |
| `udp dport 5353 accept` | mDNS (Bonjour/Avahi) — descoberta de serviços na rede local |
| `tcp dport 22 accept` | SSH — a razão de existir do firewall |

A essa altura, já podemos trocar para `policy drop` com segurança:

```terminal
$ sudo nft add chain inet firewall input '{ type filter hook input priority 0; policy drop; }'
Error: Could not process rule: File exists
```

Ops — a cadeia já existe. Para alterar só a política, usamos uma sintaxe diferente:

```terminal
$ sudo nft chain inet firewall input '{ policy drop; }'
$ sudo nft list chain inet firewall input
table inet firewall {
        chain input {
                type filter hook input priority filter; policy drop;
                ct state established,related accept
                iif lo accept
                icmp type echo-request accept
                ip6 nexthdr icmpv6 accept
                udp dport 5353 accept
                tcp dport 22 accept
        }
}
```

## Permitindo o Tailscale

O Tailscale usa WireGuard (UDP) e comunicação direta entre nós da mesh. Se você instalou o Tailscale (seções 6 e 7), precisa liberar seu tráfego:

```terminal
$ sudo nft add rule inet firewall input iifname tailscale0 accept
$ sudo nft add rule inet firewall input udp dport 41641 accept
```

A interface `tailscale0` é criada pelo Tailscale. Aceitar tráfego nela cobre toda a comunicação entre nós da mesh. A porta 41641 é o default do WireGuard para estabelecimento de túnel direto (NAT traversal).

Se você também usa o Tailscale como exit node ou subnet router, precisará de regras de forward — mas isso fica para a seção 7.

:::dica
Para listar interfaces de rede e confirmar o nome da interface do Tailscale: `ip -br link show | grep tail`. O nome pode ser `tailscale0`, `tailscale0` com VLANs, ou outro, dependendo da configuração.
:::

## Persistência entre reinicializações

Regras do nftables vivem em memória e somem no reboot. Para persistir:

```terminal
$ sudo steamos-readonly disable
$ sudo nft list ruleset > /etc/nftables.conf
$ sudo systemctl enable nftables
$ sudo steamos-readonly enable
```

O SteamOS 3.6 traz o serviço `nftables.service` que carrega `/etc/nftables.conf` no boot. Habilite-o uma vez e esqueça:

```terminal
$ sudo systemctl status nftables
● nftables.service - nftables
     Loaded: loaded (/usr/lib/systemd/system/nftables.service; enabled)
     Active: active (exited) since Mon 2025-03-10 14:22:18 -03; 2s ago
```

Sempre que editar regras, regrave o arquivo de configuração:

```terminal
$ sudo nft list ruleset | sudo tee /etc/nftables.conf
```

:::nota
O SteamOS, como mencionado, usa atualizações atômicas com partição raiz readonly. O arquivo `/etc/nftables.conf` sobrevive porque `/etc` é writable mesmo com readonly ativado — apenas a raiz `/` e `/usr` são travadas. Mesmo assim, é prudente manter uma cópia de backup em `/home/deck/nftables.conf.bak`.
:::

## Teste e verificação

Antes de considerar o firewall pronto, faça uma verificação completa. De outra máquina na mesma rede:

```terminal
$ ssh deck@192.168.1.105        # deve funcionar
$ ping 192.168.1.105            # deve responder
$ nmap -p 22 192.168.1.105     # deve mostrar open
$ nmap -p 80 192.168.1.105     # deve mostrar filtered (não closed!)
```

Portas `filtered` significam que o firewall está dropando — exatamente o que queremos. Portas `closed` indicam que não há firewall, apenas nada escutando.

No próprio Deck, confirme que a política está ativa:

```terminal
$ sudo nft list ruleset | head -20
$ sudo nft list counters
```

## Resumo

- Use `policy drop` na cadeia `input` e `policy accept` na `output` — entrada controlada, saída livre.
- As regras mínimas cobrem: tráfego de resposta (`established,related`), loopback, ping, mDNS e SSH.
- Nunca troque para `policy drop` remotamente sem antes adicionar a regra que permite sua sessão.
- O Tailscale precisa da interface `tailscale0` liberada e da porta UDP 41641 para NAT traversal.
- Persista as regras em `/etc/nftables.conf` e habilite `nftables.service` para carregá-las no boot.

## Exercícios

1. Partindo de `policy accept`, construa o conjunto de regras da seção, teste cada uma (ping, SSH, mDNS) e só então troque para `policy drop`.
2. Execute `nmap -p 22,80,443,5353` contra o IP do Deck a partir de outra máquina. Interprete a diferença entre `open`, `closed` e `filtered`.
3. Salve o ruleset em `/etc/nftables.conf`, reinicie o Deck e confirme que as regras sobreviveram com `nft list ruleset`.
4. Remova a regra que permite `icmp type echo-request` e tente pingar o Deck de outra máquina. O que acontece? Depois restaure.
5. **Desafio.** Crie um script `/home/deck/firewall.sh` que gere todo o ruleset e grave em `/etc/nftables.conf`. O script deve ser idempotente (rodar múltiplas vezes sem duplicar regras) e incluir uma regra adicional de `counter` no final da cadeia `input` para contar pacotes que chegaram até ali sem bater em regra anterior — útil para detectar tráfego não previsto.