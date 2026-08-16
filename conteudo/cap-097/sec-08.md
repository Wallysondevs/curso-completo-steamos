Rede funciona até parar de funcionar — e quando para, a diferença entre minutos e horas de sofrimento está em saber por onde começar. SSH não conecta, o Tailscale não derruba, o firewall bloqueou algo que não devia: cada sintoma aponta para uma camada diferente da pilha. Esta seção dá a você um método de isolamento e as ferramentas certas para cada camada, do socket local ao pacote na rede.

:::objetivos
- Isolar problemas de rede camada por camada, do local ao remoto
- Inspecionar sockets abertos e processos associados com `ss` e `lsof`
- Diagnosticar conectividade TCP/UDP com `nc` e latência com `mtr`
- Ler logs do systemd e do Tailscale para encontrar a causa raiz
- Capturar e interpretar tráfego com `tcpdump`
:::

## O método: isolar a camada

Todo problema de rede é respondível por uma de quatro perguntas, nesta ordem. Pule etapas e você vai caçar fantasma:

1. **O serviço está ouvindo?** — o processo local está na porta certa?
2. **O firewall local permite?** — as regras nftables estão liberando esse fluxo?
3. **O caminho até o destino existe?** — roteamento e alcance de rede?
4. **O destino responde?** — o problema é meu ou dele?

Essa sequência, do processo ao destino remoto, elimina variáveis uma a uma. Comece sempre pela camada 1.

## O serviço está ouvindo?

`ss` substitui o antigo `netstat` e mostra sockets com riqueza de detalhes:

```terminal
$ ss -tlnp
State   Recv-Q  Send-Q  Local Address:Port    Peer Address:Port  Process
LISTEN  0       128     0.0.0.0:22            0.0.0.0:*          users:(("sshd",pid=812,fd=3))
LISTEN  0       128     [::]:22               [::]:*              users:(("sshd",pid=812,fd=4))
LISTEN  0       128     127.0.0.53:53         0.0.0.0:*          users:(("systemd-resolve",pid=410,fd=14))
```

As flags `-tlnp` significam: TCP (`-t`), listen (`-l`), numérico (`-n`, sem resolver nomes), e processo (`-p`). A saída mostra o `sshd` ouvindo na porta 22 tanto em IPv4 (`0.0.0.0:22`) quanto IPv6 (`[::]:22`), e o resolvedor DNS do systemd em `127.0.0.53:53`.

Se a porta esperada não aparece, o serviço não está rodando ou ouviu em outro lugar:

```terminal
$ ss -tlnp | grep -c 22
0
$ systemctl status sshd
○ sshd.service - OpenSSH Daemon
     Loaded: loaded (/usr/lib/systemd/system/sshd.service; disabled)
     Active: inactive (dead)
```

O `grep -c 22` retornou `0` — nenhuma porta 22 aberta. O `systemctl status` confirma: serviço desabilitado e morto. Diagnóstico fechado em dois comandos.

:::dica
`ss -tulnp` adiciona `-u` (UDP) para mostrar também serviços UDP como o `tailscaled` (porta 41641) e mDNS (5353). Para filtrar por processo: `ss -tlnp | grep tailscale`.
:::

Para mapear portas de forma mais ampla, `lsof` cruza arquivos, sockets e processos:

```terminal
$ sudo lsof -i -P -n | grep -E 'sshd|tailscale'
sshd      812   root    3u  IPv4  22011  0t0  TCP *:22 (LISTEN)
tailscaled 901  root   12u  IPv4  24530  0t0  UDP *:41641
```

`-i` filtra por rede, `-P -n` evita resolução (mais rápido). Cada linha liga um processo a um socket — o `tailscaled` escutando UDP 41641, por exemplo.

## O firewall local permite?

Se o serviço ouve mas você não conecta de fora, o próximo suspeito é o firewall. Liste as regras e procure a política e as regras relevantes:

```terminal
$ sudo nft list ruleset
$ sudo nft list chain inet firewall input
```

Depois, verifique os contadores para saber se pacotes estão sendo dropados:

```terminal
$ sudo nft list counters
```

Se uma regra com `counter` está incrementando enquanto você tenta conectar, ali está o gargalo. Para testar de forma controlada, insira temporariamente uma regra de `log` no final da cadeia `input`:

```terminal
$ sudo nft insert rule inet firewall input log prefix "INPUT-END: "
$ sudo dmesg | tail -20 | grep INPUT-END
[INPUT-END: IN=wlan0 OUT= MAC=... SRC=192.168.1.50 DST=192.168.1.105 PROTO=TCP SPT=54321 DPT=22 ...
```

O pacote aparece chegando na regra de log — o firewall não está bloqueando antes. Se não aparecer, alguma regra anterior já o capturou (ou o dropou silenciosamente).

:::atencao
Não esqueça de remover a regra de `log` de diagnóstico depois. `sudo nft delete rule inet firewall input log prefix "INPUT-END: "` — regras de log silencioso acumulam ruído e podem mascarar o problema original.
:::

## O caminho até o destino existe?

Com o serviço e o firewall ok, o problema está na rota ou no destino. `ping` testa alcance básico (ICMP), mas muitos destinos bloqueiam ICMP — `nc` testa uma porta específica:

```terminal
$ nc -zv 100.101.102.103 22
Connection to 100.101.102.103 22 port [tcp/ssh] succeeded!

$ nc -zvu 100.101.102.103 41641
Connection to 100.101.102.103 41641 port [udp/*] succeeded!
```

`-z` é "scan" (não envia dados), `-v` verboso, `-u` UDP. O primeiro testa a porta SSH do Deck via Tailscale; o segundo, a porta WireGuard UDP.

Quando o destino tem vários hops e a latência é intermitente, `mtr` combina `ping` e `traceroute` num relatório contínuo:

```terminal
$ mtr -rwc 10 8.8.8.8
HOST: steamdeck            Loss%   Snt   Last   Avg  Best  Wrst StDev
  1.|-- 192.168.1.1          0.0%    10    2.1   2.2   1.9   2.6   0.2
  2.|-- 100.64.0.1           0.0%    10   15.3  16.1  14.8  18.2   1.1
  3.|-- 108.170.228.1        0.0%    10   22.9  21.5  20.1  25.3   1.7
  4.|-- 8.8.8.8              0.0%    10   23.1  22.8  22.0  24.4   0.6
```

Se a perda (`Loss%`) saltar num hop específico e persistir nos seguintes, o problema está naquele salto. Perda no hop 1 (o roteador) indica problema local de Wi-Fi; perda perto do fim indica congestão no caminho.

## Os logs do sistema

O `journalctl` centraliza os logs do systemd. Para SSH:

```terminal
$ journalctl -u sshd -n 30 --no-pager
$ journalctl -u sshd -f
```

A primeira mostra as 30 últimas entradas do sshd; a segunda acompanha em tempo real. Para o Tailscale:

```terminal
$ journalctl -u tailscaled -n 50 --no-pager
$ tailscale status
```

Logs de autenticação SSH frequentemente revelam a causa de `Permission denied`: chave não oferecida, algoritmo desabilitado, ou usuário fora do `AllowUsers`:

```terminal
$ journalctl -u sshd | grep -E 'invalid|refused|failed'
sshd[812]: Invalid user bob from 192.168.1.50 port 54321
sshd[812]: Connection closed by invalid user bob 192.168.1.50 port 54321
```

:::dica
Para depurar o handshake SSH em detalhe máximo, use `ssh -vvv` no cliente. As linhas `debug1:` revelam exatamente qual chave foi tentada, qual método de autenticação o servidor aceita e por que a conexão falhou. É mais rápido que bisbilhotar logs do servidor.
:::

## Capturando pacotes com tcpdump

Quando nada acima responde, capture os pacotes reais. O `tcpdump` mostra o que está entrando e saindo na interface:

```terminal
$ sudo tcpdump -i wlan0 port 22 -n -c 20
tcpdump: verbose output suppressed, use -v or -vv for full protocol decode
listening on wlan0, link-type EN10MB (Ethernet), capture size 262144 bytes
14:03:11.224410 IP 192.168.1.50.54321 > 192.168.1.105.22: Flags [S], seq 12345, win 65535
14:03:12.230112 IP 192.168.1.50.54321 > 192.168.1.105.22: Flags [S], seq 12345, win 65535
14:03:14.241005 IP 192.168.1.50.54321 > 192.168.1.105.22: Flags [S], seq 12345, win 65535
```

O que vemos: três pacotes `[S]` (SYN) chegando do cliente `192.168.1.50` para a porta 22, sem resposta `[S.]` (SYN-ACK). O servidor está recebendo pedidos de conexão, mas não responde — o firewall está dropando silenciosamente. Se fosse `[S] [S] [S]` e depois `[S.]`, o handshake estaria completando e o problema seria outro (autenticação).

```terminal
$ sudo tcpdump -i tailscale0 -n -c 10
```

Capturar na interface `tailscale0` mostra o tráfego que trafega dentro do túnel WireGuard já descriptografado — útil para ver se o Tailscale está entregando os pacotes ao sistema.

:::perigo
`tcpdump` captura o conteúdo dos pacotes, incluindo credenciais em tráfego não criptografado. Em redes que não são suas, capture apenas o necessário (`port 22`, `-c 20`) e evite gravar payloads inteiros (`-s 0` grava tudo). Para inspecionar payloads, use `-A` (ASCII) ou `-X` (hex) com responsabilidade.
:::

## Resumo

- Isole camada a camada: serviço ouvindo → firewall → rota → destino.
- `ss -tlnp` mostra sockets em escuta e o processo dono; `lsof -i` cruza processos e portas.
- `nc -z` testa uma porta específica (TCP ou UDP) quando `ping` não basta.
- `mtr` revela em qual hop começa a perda de pacotes; `journalctl -u` centraliza os logs do serviço.
- `tcpdump` mostra pacotes reais: SYN sem SYN-ACK = firewall dropando; SYN-ACK = handshake ok.

## Exercícios

1. Com o sshd parado, rode `ss -tlnp` e confirme que a porta 22 sumiu. Depois inicie o serviço e rode de novo. Compare as saídas.
2. Use `nc -zv` para testar as portas 22 e 41641 do seu Deck a partir de outro dispositivo. Interprete os resultados de cada uma.
3. Rode `mtr -rwc 10 8.8.8.8` e identifique em qual hop começa a maior variação de latência. Há perda? Em qual salto?
4. Gere uma falha de autenticação SSH (usuário errado) e localize a causa lendo `journalctl -u sshd`. Repita com `ssh -vvv` no cliente e compare.
5. **Desafio.** Capture com `tcpdump` o handshake de uma conexão SSH bem-sucedida e de uma bloqueada (adicione uma regra `drop` temporária no nftables). Explique a diferença entre os dois dumps em termos de flags TCP (SYN, SYN-ACK, ACK) — e remova a regra de bloqueio ao final.