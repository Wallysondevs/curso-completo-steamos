Depois de dominar arquivos, o próximo nível é enxergar o sistema em movimento: quais processos estão rodando, o que estão consumindo, quem está falando com quem pela rede. Esta seção cobre o arsenal de inspeção de processos (`ps`, `top`, `kill`) e rede (`ss`, `ip`, `ping`, `curl`), organizado em tabelas de referência rápida.

:::objetivos
- Listar e filtrar processos com `ps` e `top`
- Encerrar processos com `kill`, `pkill` e `killall` de forma controlada
- Inspecionar conexões de rede ativas com `ss`
- Gerenciar endereços e rotas com `ip`
- Diagnosticar conectividade com `ping`, `curl` e `ss`
:::

## Processos: o `ps` e o `top`

Um processo é um programa em execução. O `ps` tira um retrato instantâneo; o `top` (e seu sucessor `htop`) mostra uma visão ao vivo.

| Comando | O que faz |
|---|---|
| `ps` | Processos do shell atual |
| `ps aux` | Todos os processos, todos os usuários, com detalhes |
| `ps aux --sort=-%mem` | Ordena por uso de memória (decrescente) |
| `ps -ef` | Formato SysV: todos os processos em árvore de PPID |
| `ps -u ana` | Processos de um usuário específico |
| `ps -p 1241 -o pid,ppid,cmd` | Campos customizados de um PID |
| `pgrep sshd` | Acha o PID por nome do processo |
| `pgrep -u ana -f "steam"` | Busca por nome com padrão, de um usuário |
| `top` | Monitor em tempo real (tecla `q` para sair) |
| `htop` | Versão colorida e interativa (se instalada) |

```terminal
$ ps aux --sort=-%mem | head -5
USER       PID %CPU %MEM    VSZ   RSS TTY  STAT START   TIME COMMAND
ana       2140 12.5 18.2 4981232 1145520 ?   Sl   09:00   3:44 /usr/bin/steam
ana       2100  3.1  4.8 1203456 301200 ?   Ssl  09:00   0:51 /usr/bin/pipewire
ana       2110  0.8  2.1  889344 132200 ?   Ssl  09:00   0:12 /usr/bin/wireplumber
```

No SteamOS, o processo `steam` domina a memória — 18,2% — como esperado de um cliente de jogos. As colunas `%CPU` e `%MEM` e o campo `STAT` (de estado) são os mais consultados: `S` = sleeping, `R` = running, `Z` = zombie.

:::dica
O `ps aux` ordena por PID por padrão. Já `top` mostra por CPU. Para achar rapidamente o vilão de memória, `ps aux --sort=-%mem | head`; para o de CPU, `ps aux --sort=-%cpu | head`.
:::

## Encerrando processos

Às vezes um processo trava e precisa ser encerrado. O `kill` não "mata" de forma cega — ele envia **sinais**, e o processo decide como responder.

| Comando | O que faz |
|---|---|
| `kill 2140` | Envia SIGTERM (pedido educado de encerramento) |
| `kill -9 2140` | Envia SIGKILL (força brutal, sem chance de limpar) |
| `kill -15 2140` | SIGTERM explícito (equivalente ao default) |
| `kill -HUP 1241` | SIGHUP: pede recarga de configuração |
| `kill -l` | Lista todos os sinais disponíveis |
| `pkill steam` | Envia SIGTERM pelo nome do processo |
| `pkill -9 steam` | SIGKILL pelo nome |
| `killall sshd` | Mata todas as instâncias de um binário |
| `killall -HUP nginx` | HUP em todas as instâncias do nginx |

```terminal
$ kill -l | head -9
 1) SIGHUP	 2) SIGINT	 3) SIGQUIT	 4) SIGILL
 5) SIGTRAP	 6) SIGABRT	 7) SIGBUS	 8) SIGFPE
 9) SIGKILL
```

:::atencao
`kill -9` (SIGKILL) não deixa o processo liberar memória, fechar arquivos ou gravar estado — o kernel despeja o processo na hora. Prefira sempre `kill` (SIGTERM) primeiro e só recorra ao `-9` se o processo continuar vivo alguns segundos depois.
:::

## Rede: conexões com `ss`

O `ss` substituiu o antigo `netstat`. Ele lê direto das estruturas do kernel e é consideravelmente mais rápido.

| Comando | O que faz |
|---|---|
| `ss -t` | Conexões TCP ativas |
| `ss -u` | Conexões UDP |
| `ss -l` | Sockets em modo escuta (listening) |
| `ss -tln` | Sockets TCP escutando, com número de porta, sem resolver host |
| `ss -tlnp` | Igual ao anterior, mostrando o processo dono |
| `ss -s` | Estatísticas resumidas por protocolo |
| `ss -tan state established` | Só conexões estabelecidas |

```terminal
$ ss -tlnp
State  Recv-Q Send-Q Local Address:Port  Peer Address:Port  Process
LISTEN 0      128    0.0.0.0:22          0.0.0.0:*          users:(("sshd",pid=1241,fd=3))
LISTEN 0      128    127.0.0.1:631       0.0.0.0:*          users:(("cupsd",pid=858,fd=7))
```

A saída mostra o SSH escutando em todas as interfaces (`0.0.0.0:22`) e o CUPS restrito ao localhost (`127.0.0.1:631`). A coluna `Process` revela qual daemon é dono de cada porta — essencial para descobrir "o que está ocupando a porta 22?".

## Rede: endereços e rotas com `ip`

O `ip` da suíte `iproute2` substituiu o obsoleto `ifconfig`. Ele cobre endereços, rotas, links e vizinhos.

| Comando | O que faz |
|---|---|
| `ip addr` | Lista endereços de todas as interfaces |
| `ip addr show wlan0` | Endereços de uma interface específica |
| `ip link` | Lista interfaces (estado up/down) |
| `ip link set wlan0 up` | Sobe uma interface |
| `ip route` | Tabela de rotas |
| `ip route get 8.8.8.8` | Mostra por qual rota um destino sai |
| `ip neigh` | Tabela ARP (vizinhos na LAN) |
| `ip -s link` | Estatísticas de tráfego por interface |

```terminal
$ ip addr show wlan0
3: wlan0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP group default qlen 1000
    link/ether 3c:37:86:0a:b1:c4 brd ff:ff:ff:ff:ff:ff
    inet 192.168.1.23/24 brd 192.168.1.255 scope global dynamic noprefixroute wlan0
```

A interface `wlan0` está `UP`, com MAC `3c:37:86:0a:b1:c4` e IP `192.168.1.23/24` obtido via DHCP (`dynamic`). O `state UP` confirma que o link físico está ativo; `LOWER_UP` indica que também há conectividade de camada 2.

## Diagnóstico de conectividade

Para saber se a rede chega aonde deveria, o trio `ping`, `curl` e `ss` cobre quase tudo.

| Comando | O que faz |
|---|---|
| `ping -c 4 8.8.8.8` | Testa conectividade ICMP (4 pacotes) |
| `ping -c 4 steamdeck` | Testa resolução de nome + conectividade |
| `curl -I https://flathub.org` | Baixa só os cabeçalhos HTTP |
| `curl -o arquivo https://...` | Baixa um arquivo |
| `curl -s https://api... | jq` | Pipeline para JSON em API |
| `traceroute 8.8.8.8` | Mostra o caminho (hops) até o destino |
| `nslookup flathub.org` | Consulta DNS manualmente |
| `ss -s` | Resumo do estado da pilha de rede |

```terminal
$ ping -c 4 8.8.8.8
PING 8.8.8.8 (8.8.8.8) 56(84) bytes of data.
64 bytes from 8.8.8.8: icmp_seq=1 ttl=117 time=18.2 ms
64 bytes from 8.8.8.8: icmp_seq=2 ttl=117 time=17.9 ms
64 bytes from 8.8.8.8: icmp_seq=3 ttl=117 time=18.1 ms
64 bytes from 8.8.8.8: icmp_seq=4 ttl=117 time=18.0 ms

--- 8.8.8.8 ping statistics ---
4 packets transmitted, 4 received, 0% packet loss, time 3005ms
```

Zero por cento de perda e latência estável de ~18 ms significam um caminho de rede saudável até o DNS do Google. Quando o `ping` falha mas a navegação funciona, é comum que o destino (ou a rede) bloqueie ICMP — por isso o `curl` complementa o teste.

## Resumo

- `ps aux --sort=-%mem` acha o maior consumidor de memória; `ps aux --sort=-%cpu` o de CPU
- `kill` envia sinais; SIGTERM é educado, SIGKILL (`-9`) é última instância
- `pkill` e `killall` encerram por nome em vez de PID
- `ss -tlnp` mostra quem está escutando em qual porta, e qual processo é o dono
- `ip addr`, `ip link` e `ip route` substituem o antigo `ifconfig`
- `ping` testa alcance, `curl` testa aplicação HTTP e DNS, `traceroute` mapeia o caminho

## Exercícios

1. Liste os cinco processos que mais consomem memória e os cinco que mais consomem CPU. Identifique quais são serviços do sistema e quais são seus.
2. Inicie um processo com `sleep 500 &`, descubra seu PID com `pgrep sleep`, envie SIGTERM e confirme que ele morreu. Repita usando `kill -9` e compare as saídas.
3. Use `ss -tlnp` para listar todas as portas em escuta e identificar o processo dono de cada uma. Anote qual porta o SSH e o CUPS usam.
4. Verifique o endereço IP da sua interface ativa com `ip addr`, a rota padrão com `ip route` e o caminho até `8.8.8.8` com `ip route get 8.8.8.8`.
5. **Desafio.** Faça um diagnóstico completo de conectividade: `ping -c 3` um host, depois `curl -I` um site HTTPS, e finalmente `ss -tan state established` para ver as conexões estabelecidas do seu processo de navegação. Escreva qual camada cada comando está testando.