Um firewall é um filtro de pacotes: ele decide, com base em regras, qual tráfego de rede entra, sai ou é descartado silenciosamente. Num notebook ou servidor, o firewall fecha portas que não deveriam estar abertas; no Steam Deck, ele é a linha que separa "console que joga na minha rede" de "máquina que qualquer um acessa pela internet". O SteamOS baseia-se no `nftables`, e por cima dele o `ufw` oferece uma interface acessível.

:::objetivos
- Entender a diferença entre `iptables`, `nftables` e `ufw`
- Listar portas abertas e processos que as escutam
- Configurar regras básicas com `ufw`
- Habilitar o firewall sem se trancar para fora
- Inspecionar as regras ativas com `nft list ruleset`
:::

## Quem está escutando agora

Antes de escrever regras, descubra o que já está aberto. Dois comandos respondem juntos: `ss` mostra sockets em escuta (listening), e `ss -ltnp` cruza isso com o processo dono.

```terminal
$ ss -ltnp
State  Recv-Q Send-Q Local Address:Port  Peer Address:Port  Process
LISTEN 0      128    0.0.0.0:22          0.0.0.0:*          users:(("sshd",pid=812,fd=3))
LISTEN 0      128    [::]:22            [::]:*              users:(("sshd",pid=812,fd=4))
LISTEN 0      4096   127.0.0.1:631      0.0.0.0:*          users:(("cupsd",pid=704,fd=7))
```

A leitura é direta: o `sshd` escuta na porta 22 em **todas** as interfaces (`0.0.0.0` e `[::]`), então está acessível de fora da máquina; o `cupsd` (servidor de impressão) escuta só em `127.0.0.1`, o loopback, então ninguém de fora chega nele. Essa distinção — se o bind é em `0.0.0.0` ou `127.0.0.1` — é a primeira pergunta de qualquer auditoria.

```terminal
$ ss -ltn | awk 'NR>1 {print $4}' | sort -u
0.0.0.0:22
127.0.0.1:631
[::]:22
```

:::nota
O `ss` substituiu o antigo `netstat`, obsoleto. Ele lê direto do kernel via netlink, é mais rápido e não depende de ter os binários dos processos. Para quem vinha do `netstat`, o equivalente é `ss -tulpn`.
:::

## nftables por baixo, ufw por cima

O kernel filtro de pacotes moderno é o `nftables`, que unificou o ecossistema antigo (`iptables`, `ip6tables`, `arptables`, `ebtables`). Escrever regras `nftables` na mão é poderoso, mas verboso; o `ufw` (Uncomplicated Firewall) gera essas regras a partir de comandos humanos como `ufw allow 22`.

No SteamOS, o `ufw` costuma vir **inativo** por padrão — o aparelho confia na ausência de serviços expostos. Verifique o estado:

```terminal
$ sudo ufw status verbose
Status: inactive
```

A estratégia mais segura é a *default deny*: nega tudo que entra, permite tudo que sai, e abre só o que você usa de verdade. Para não se trancar para fora numa sessão SSH, sempre permita a porta 22 **antes** de ativar.

```terminal
$ sudo ufw default deny incoming
Default incoming policy changed to 'deny'
$ sudo ufw default allow outgoing
Default outgoing policy changed to 'allow'
$ sudo ufw allow ssh
Rule added
```

Se você não usa SSH, pule o `allow ssh`. Talvez queira liberar apenas o que joga online usa — a maioria dos jogos usa tráfego de saída (que já está liberado), então o modo `deny incoming` não atrapalha o matchmaking.

```terminal
$ sudo ufw enable
Firewall is active and enabled on system startup
$ sudo ufw status
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
22/tcp (v6)                ALLOW       Anywhere (v6)
```

:::atencao
Habilitar `deny incoming` com o SSH ativo e sem um `allow` para a porta 22 corta sua própria conexão remota. Se estiver logado por SSH, a sessão existente sobrevive, mas conexões novas falharão. Nunca faça isso numa máquina à qual você só tem acesso remoto.
:::

## Inspecionando as regras reais

O `ufw` não é um daemon separado — ele traduz comandos para `nftables`. Para ver o que de fato está carregado no kernel:

```terminal
$ sudo nft list ruleset | head -30
table ip filter {
	chain ufw-before-input {
		type filter hook input priority filter; policy accept;
		...
	}
	...
}
```

Quando você precisa diagnosticar por que uma porta está sendo bloqueada ou aberta, é aqui que olha, não no `ufw status`. O `nft` mostra as chains com seus hooks de kernel e a prioridade, e é a fonte da verdade sobre o tráfego real.

:::dica
Para testar uma regra sem se comprometer com ela, use `ufw --dry-run allow 8080`. Ele mostra a regra que seria criada sem aplicá-la. Útil para validar sintaxe de intervalos e listas de portas (ex.: `ufw allow 8000:8010/tcp`).
:::

## Cenário: bloquear um intervalo

Digamos que você queira permitir SSH apenas a partir da sua rede local (`192.168.1.0/24`) e negar o resto. Encadeie regras específicas antes da política geral:

```terminal
$ sudo ufw allow from 192.168.1.0/24 to any port 22 proto tcp
Rule added
$ sudo ufw deny 22/tcp
Rule denied
$ sudo ufw status numbered
Status: active

     To                         Action      From
     --                         ------      ----
[ 1] 22/tcp                     ALLOW       192.168.1.0/24
[ 2] 22/tcp                     DENY        Anywhere
```

O `ufw` processa as regras em ordem — a primeira que casar vence. A regra `[1]` permite a rede local, e `[2]` nega todo o resto. Para remover, use o número: `sudo ufw delete 2`.

## Resumo

- `ss -ltnp` mostra portas em escuta e o processo dono; bind em `0.0.0.0` significa acessível externamente, `127.0.0.1` é só loopback.
- O `nftables` é o filtro do kernel; o `ufw` é a camada amigável que gera regras `nftables`.
- A política *default deny* de entrada, com saída permitida, é o ponto de partida seguro para o Steam Deck.
- Libere a porta 22 (ou a sua de acesso remoto) **antes** de `ufw enable` para não se trancar para fora.
- `nft list ruleset` mostra as regras reais carregadas no kernel, incluindo as chains do `ufw`.
- Regras são avaliadas em ordem; use `ufw status numbered` e `ufw delete N` para gerenciar.

## Exercícios

1. Liste tudo que está escutando na sua máquina com `ss -ltnp` e classifique cada porta como "loopback" ou "exposta".
2. Ative o `ufw` com política `deny incoming`, permitindo apenas SSH, e confirme com `ufw status verbose`.
3. Compare `ufw status numbered` com `sudo nft list ruleset`. Aponte qual bloco do `nft` corresponde a cada regra do `ufw`.
4. Bloqueie a porta 22 e depois rode `ufw status` e tente uma nova conexão SSH a partir de outra máquina (ou de `ssh localhost`). Restaure em seguida.
5. **Desafio.** Use `sudo nft add rule ip filter input ip saddr 10.0.0.66 drop` para bloquear um IP específico, confirme o bloqueio, e depois remova com `nft flush table`. Explique por que essa regra manual some se algo reiniciar o `ufw`.