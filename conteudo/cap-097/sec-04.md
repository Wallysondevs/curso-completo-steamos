O kernel Linux tem um subsistema de filtragem de pacotes chamado Netfilter. Durante duas décadas, a ferramenta para configurá-lo foi o `iptables` — poderosa, mas com sintaxe prolixa e quatro tabelas separadas que não conversavam entre si. Em 2014 nasceu o `nftables`, substituto oficial que unifica tudo numa sintaxe coesa e expressiva. No SteamOS 3.6, `nftables` já é o padrão: o `iptables` legado ainda existe por compatibilidade, mas as regras que você escreve em `nft` são traduzidas diretamente para o mesmo Netfilter de forma mais eficiente.

:::objetivos
- Entender a arquitetura do nftables: tabelas, cadeias e regras
- Criar uma tabela com cadeias de entrada e saída
- Escrever regras que filtram por porta, IP e protocolo
- Inspecionar e depurar o conjunto de regras ativo
- Diferenciar `nftables` do `iptables` legado no SteamOS
:::

## Tabelas, cadeias e regras

O nftables organiza a filtragem em três níveis hierárquicos. A **tabela** é o contêiner mais externo — ela pertence a uma família de protocolos (`ip`, `ip6`, `inet`, `arp`, `bridge`, `netdev`). Dentro da tabela moram as **cadeias** (*chains*), que definem em que ponto do caminho do pacote as regras serão avaliadas: `input` (pacotes destinados a esta máquina), `output` (pacotes originados aqui) e `forward` (pacotes roteados através). As **regras** são as instruções propriamente ditas: "se origem é X e porta é Y, aceite".

A família `inet` cobre IPv4 e IPv6 simultaneamente — você escreve a regra uma vez e ela vale para os dois protocolos. É a escolha recomendada para a maioria dos casos.

```terminal
$ sudo nft list ruleset
```
O comando acima mostra tudo o que está ativo no momento. Num SteamOS recém-instalado, a saída costuma ser vazia ou mínima — o firewall não vem configurado.

## Criando sua primeira tabela e cadeia

Uma tabela `inet` com cadeias de input e output é o esqueleto mínimo:

```terminal
$ sudo nft add table inet filtro
$ sudo nft add chain inet filtro input { type filter hook input priority 0 \; }
$ sudo nft add chain inet filtro output { type filter hook output priority 0 \; }
```

O que cada parte significa:

- `inet filtro` — tabela chamada `filtro` na família `inet` (IPv4 + IPv6).
- `type filter hook input` — esta cadeia se conecta ao gancho (*hook*) `input` do Netfilter.
- `priority 0` — define a ordem entre cadeias do mesmo hook; 0 é o padrão.
- As chaves `{ }` precisam ser escapadas no shell com `\;` ou envolvidas em aspas.

```terminal
$ sudo nft list table inet filtro
table inet filtro {
        chain input {
                type filter hook input priority filter; policy accept;
        }
        chain output {
                type filter hook output priority filter; policy accept;
        }
}
```

A política padrão (`policy accept`) significa que, se nenhuma regra bater, o pacote é aceito. É um ponto de partida permissivo que não quebra nada — mais adiante mudaremos para `policy drop`.

:::nota
A prioridade pode ser um número ou um nome simbólico: `filter` é um alias para `priority 0`. Existem `mangle` (-150), `dstnat` (-100), `srcnat` (100) e outras. Para filtragem básica, `filter` (0) é o que você usa.
:::

## Primeiras regras

Regras no nftables são expressões que batem contra campos do pacote. A sintaxe é legível:

```terminal
$ sudo nft add rule inet filtro input tcp dport 22 accept
$ sudo nft add rule inet filtro input tcp dport 2222 accept
$ sudo nft add rule inet filtro input icmp type echo-request accept
$ sudo nft add rule inet filtro input ct state established,related accept
```

A primeira regra aceita TCP na porta 22 (SSH). A segunda, na 2222. A terceira aceita ping (`icmp type echo-request`). A quarta é crucial: aceita pacotes que pertencem a conexões já estabelecidas (respostas a conexões que nós iniciamos) ou relacionadas (como uma conexão de dados FTP associada a uma conexão de controle). Sem ela, você precisaria de regras de output simétricas para cada conexão.

```terminal
$ sudo nft list table inet filtro
table inet filtro {
        chain input {
                type filter hook input priority filter; policy accept;
                tcp dport 22 accept
                tcp dport 2222 accept
                icmp type echo-request accept
                ct state established,related accept
        }
        chain output {
                type filter hook output priority filter; policy accept;
        }
}
```

Ordem importa: as regras são avaliadas de cima para baixo e a primeira que bate decide o destino do pacote. Coloque regras específicas antes das genéricas.

## Bloqueando e registrando

Para bloquear, use `drop` (silencioso) ou `reject` (avisa o remetente):

```terminal
$ sudo nft add rule inet filtro input tcp dport 23 drop
$ sudo nft add rule inet filtro input tcp dport 3389 log prefix "RDP-BLOCKED: " reject
```

A primeira descarta silenciosamente conexões na porta 23 (Telnet). A segunda registra no kernel log antes de rejeitar na porta 3389 (RDP), com um prefixo customizado que facilita a busca:

```terminal
$ sudo dmesg | grep RDP-BLOCKED
[RDP-BLOCKED: IN=wlan0 OUT= MAC=aa:bb:cc:dd:ee:ff SRC=192.168.1.50 DST=192.168.1.105 ...
```

:::dica
Use `log prefix` com moderação — cada pacote que bate na regra gera uma linha de log. Num ataque real, isso pode inundar o `dmesg`. Prefira `counter` para estatísticas sem o custo do log, e `log` apenas para depuração temporária.
:::

## Inspecionando e depurando

Além de `nft list ruleset`, você pode listar partes específicas e ver estatísticas:

```terminal
$ sudo nft list table inet filtro -a
$ sudo nft list counters
$ sudo nft monitor
```

A flag `-a` mostra os handles (identificadores numéricos) de cada regra. Útil para deletar regras específicas sem reescrever tudo:

```terminal
$ sudo nft delete rule inet filtro input handle 7
```

O `nft monitor` entra em modo "ao vivo": cada adição, remoção ou pacote que bate em regra com counter aparece na tela. É o equivalente do nftables ao `tail -f`:

```terminal
$ sudo nft monitor
add rule inet filtro input tcp dport 8080 accept
```

Para começar do zero, destrua a tabela inteira:

```terminal
$ sudo nft delete table inet filtro
```

:::perigo
`nft delete table` remove instantaneamente todas as regras daquela tabela. Se sua política era `drop` e você remove a tabela, o tráfego volta a fluir — o que pode ser o que você quer ou um risco, dependendo do contexto. Verifique com `nft list ruleset` antes de apagar.
:::

## nftables vs. iptables no SteamOS

O SteamOS 3.6 inclui ambos. O `iptables` legado ainda funciona via módulos de compatibilidade (`xt_nat`, `xt_conntrack`), mas as regras que você escreve com `iptables` não aparecem no `nft list ruleset` — e vice-versa. Eles operam sobre o mesmo Netfilter, mas em camadas diferentes. A recomendação é clara: use `nftables` para tudo novo. Migrar regras existentes de `iptables` para `nft` é facilitado pelo tradutor `iptables-translate`:

```terminal
$ iptables-translate -A INPUT -p tcp --dport 22 -j ACCEPT
nft add rule ip filter INPUT tcp dport 22 counter accept
```

O tradutor não é perfeito — regras complexas com módulos obscuros podem não traduzir — mas cobre a vasta maioria dos casos.

| Ferramenta | Estado no SteamOS 3.6 |
|---|---|
| `nftables` | Nativo, recomendado para novas regras |
| `iptables-legacy` | Presente por compatibilidade; use `iptables-translate` para migrar |
| `iptables-nft` | Traduz comandos `iptables` para `nftables` internamente; prefira `nft` direto |

## Resumo

- nftables organiza regras em tabelas (família de protocolo), cadeias (hook) e regras (condição → ação).
- A família `inet` aplica regras a IPv4 e IPv6 simultaneamente.
- `ct state established,related` é essencial para firewall stateful — aceita respostas sem regras de output simétricas.
- `nft list ruleset` mostra tudo; `nft -a` revela handles para deletar regras individuais.
- No SteamOS, prefira `nftables` sobre `iptables`; `iptables-translate` ajuda na migração.

## Exercícios

1. Crie uma tabela `inet filtro` com cadeias `input` e `output`. Liste o ruleset e confirme que ambas têm `policy accept`.
2. Adicione regras para aceitar SSH (porta 22), HTTP (80) e HTTPS (443) apenas na cadeia `input`. Teste com `nft list table inet filtro`.
3. Acrescente `ct state established,related accept` e explique por que, sem essa regra, conexões iniciadas pelo Deck (como `curl`) parariam de receber resposta.
4. Use `log prefix` para registrar pacotes bloqueados e localize as mensagens no `dmesg`. Depois remova a regra de log e substitua por `counter`.
5. **Desafio.** Traduza um conjunto de regras `iptables` de um script legado (que você mesmo escreve com pelo menos 4 regras) para `nftables` usando `iptables-translate`. Compare os dois rulesets e explique qualquer diferença.