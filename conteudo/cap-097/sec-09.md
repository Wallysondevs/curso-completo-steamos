As oito seções anteriores construíram cada peça isolada: o SSH, as chaves, o sshd endurecido, o firewall, o Tailscale e o diagnóstico. Agora elas se tornam um sistema coeso. Esta seção fecha o capítulo com duas tarefas que todo servidor — inclusive um Deck — precisa: endurecer ainda mais as defesas e automatizar a manutenção para que a segurança não dependa de você lembrar de rodar comandos.

:::objetivos
- Consolidar todas as camadas do capítulo num único estado seguro
- Adicionar proteção contra força bruta com fail2ban
- Automatizar a persistência de chaves, firewall e Tailscale com systemd
- Realizar um backup do estado de segurança e restaurá-lo
- Auditar periodicamente o sistema com um checklist verificável
:::

## A visão consolidada das camadas

Tudo o que foi configurado forma uma pilha com responsabilidades distintas e complementares:

| Camada | O que protege | Ferramenta |
|---|---|---|
| Autenticação | Quem entra | Chaves SSH (seção 2) |
| Política de acesso | Como entra | `sshd_config` (seção 3) |
| Filtragem de pacotes | O que alcança o serviço | nftables (seções 4-5) |
| Transporte externo | Como o acesso remoto viaja | Tailscale (seções 6-7) |
| Observabilidade | Quando algo falha | `ss`, `tcpdump`, `journalctl` (seção 8) |

Nenhuma camada sozinha resolve tudo — mas juntas, uma falha em uma não expõe o sistema, porque as outras seguram. É o princípio da *defesa em profundidade*. Revise o estado atual com dois comandos:

```terminal
$ systemctl is-enabled sshd tailscaled nftables
sshd.service: enabled
tailscaled.service: enabled
nftables.service: enabled
$ sudo nft list ruleset | wc -l
14
```

Três serviços habilitados e o ruleset carregado — o sistema sobrevive a um reboot com tudo de pé.

## fail2ban contra força bruta

Mesmo com `PasswordAuthentication no`, o sshd recebe tentativas de conexão de bots. Elas não entram, mas poluem logs e consomem conexões. O `fail2ban` observa os logs em tempo real e bloqueia IPs que falham repetidamente — uma camada de inteligência sobre o firewall.

No SteamOS (Arch), instale e configure:

```terminal
$ sudo steamos-readonly disable
$ sudo pacman -Sy --needed fail2ban
$ sudo systemctl enable --now fail2ban
$ sudo steamos-readonly enable
```

A configuração local sobrepõe a padrão:

```terminal
$ sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 3

[sshd]
enabled = true
port = 22
```

`maxretry = 3` significa três falhas em `findtime` (10 minutos) resultam em banimento de `bantime` (1 hora). Depois confira a ação:

```terminal
$ sudo fail2ban-client status sshd
Status for the jail: sshd
|- Filter
|  |- Currently failed: 1
|  |- Total failed:     1
|  `- File list:        /var/log/auth.log
`- Actions
   |- Currently banned: 0
   |- Total banned:     0
   `- Banned IP list:
```

O fail2ban injeta regras no `nftables` automaticamente, numa tabela própria (`f2b-table`), coexistindo com as suas.

:::atencao
O fail2ban precisa de um log de autenticação. No Arch/SteamOS, o `sshd` registra em `/var/log/auth.log` via journald. Se o fail2ban não contar falhas, verifique o `backend` e o `journalmatch` no `jail.local` — em systemd puro, prefira `backend = systemd`.
:::

## Automatizando com systemd

A segurança que depende de memória falha. Automatize a persistência com units do systemd que rodam no boot e reaplicam o estado desejado.

Um serviço que garante que as chaves do `deck` estão íntegras e o direito de acesso correto:

```ini
[Unit]
Description=Fix SSH host keys permissions
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/bin/chmod 600 /home/deck/.ssh/authorized_keys
ExecStart=/usr/bin/chmod 700 /home/deck/.ssh

[Install]
WantedBy=multi-user.target
```

Salve como `/etc/systemd/system/ssh-perms.service` e:

```terminal
$ sudo systemctl daemon-reload
$ sudo systemctl enable --now ssh-perms.service
```

Um segundo serviço reaplica o firewall a cada boot caso o arquivo `/etc/nftables.conf` tenha mudado:

```terminal
$ sudo systemctl enable nftables
$ sudo systemctl status nftables | grep -E 'Loaded|Active'
     Loaded: loaded (/usr/lib/systemd/system/nftables.service; enabled)
     Active: active (exited)
```

:::dica
Para validar que uma unit `oneshot` realmente executa sem erro, rode `sudo systemctl start ssh-perms.service` e depois `systemctl status ssh-perms.service`. Um `Active: active (exited)` com `exit code 0` é o sucesso esperado para serviços pontuais.
:::

## Backup do estado de segurança

Todo esse trabalho é configurável e, portanto, replicável. Extraia o essencial para um único diretório de backup:

```terminal
$ mkdir -p ~/seguranca-backup
$ cp /etc/ssh/sshd_config.d/90-deck.conf ~/seguranca-backup/
$ sudo nft list ruleset > ~/seguranca-backup/nftables.conf
$ cp ~/.ssh/authorized_keys ~/seguranca-backup/authorized_keys
$ cp /etc/fail2ban/jail.local ~/seguranca-backup/jail.local
$ tailscale status > ~/seguranca-backup/tailscale-status.txt
$ ls -l ~/seguranca-backup/
total 28
-rw------- 1 deck deck  231 Mar 10 15:00 authorized_keys
-rw-r--r-- 1 deck deck  442 Mar 10 15:00 jail.local
-rw-r--r-- 1 deck deck 1192 Mar 10 15:00 nftables.conf
-rw-r--r-- 1 deck deck  187 Mar 10 15:00 90-deck.conf
-rw-r--r-- 1 deck deck  890 Mar 10 15:00 tailscale-status.txt
```

Com esses cinco arquivos, você reconstitui automaticamente quase toda a configuração deste capítulo numa reinstalação limpa. Guarde o diretório com `rsync` para um destino externo (ver exercício 4).

:::perigo
O `authorized_keys` contém suas chaves públicas — não é segredo, mas revela quem tem acesso. O que **nunca** deve ir para backup desprotegido é a chave *privada* (`id_ed25519`). Ela fica no seu desktop, protegida por passphrase, e não é necessária para restaurar o servidor — apenas para acessá-lo.
:::

## Checklist de auditoria final

Reúna a verificação em um checklist executável. Rode estas linhas e confirme cada resultado:

```terminal
$ systemctl is-enabled sshd tailscaled nftables fail2ban
$ sudo nft list ruleset | grep -c 'policy drop'
$ ssh -o BatchMode=yes deck@100.101.102.103 'echo ok'
$ tailscale ping deck | grep -o via.*
$ sudo fail2ban-client status sshd | grep 'Total banned'
```

Cada linha verifica uma camada: serviços habilitados, firewall com `policy drop`, chave SSH funcionando sem senha (`BatchMode=yes` falha se pedir senha), rota Tailscale ativa, fail2ban operante.

| Verificação | Esperado |
|---|---|
| `systemctl is-enabled` | `enabled` para os quatro serviços |
| `policy drop` na input | ≥ 1 (a cadeia input com drop) |
| SSH BatchMode | retorna `ok` sem pedir senha |
| `tailscale ping` | `via IP` (direto) ou `via DERP` |
| fail2ban status | jail ssHD com contadores |

Execute o checklist periodicamente (mensal é razoável) e guarde o resultado. A segurança do Deck não é um evento, é um hábito.

## Resumo

- As cinco camadas (autenticação, política, firewall, transporte, observabilidade) somam-se em defesa em profundidade.
- O fail2ban bloqueia IPs com falhas repetidas de autenticação, integrando-se ao nftables.
- Units `oneshot` do systemd reaplicam permissões e estado no boot, sem depender de memória.
- Um backup mínimo (5 arquivos) permite reconstituir a segurança em caso de reinstalação.
- Um checklist executável mensal mantém a configuração verificável ao longo do tempo.

## Exercícios

1. Liste o estado consolidado com `systemctl is-enabled` para os quatro serviços e confirme que todos estão `enabled`.
2. Instale e configure o fail2ban, e simule três falhas de login para ver um IP ser banido em `fail2ban-client status sshd`. Depois desbanque manualmente.
3. Crie a unit `ssh-perms.service` e valide que ela executa com `systemctl start` e `systemctl status` (exit 0).
4. Monte o backup de segurança com os cinco arquivos mínimos e transporte-o para um destino externo (cartão, outro nó Tailscale) usando `rsync`. Restaure num diretório temporário e confira os arquivos.
5. **Desafio.** Transforme o checklist de auditoria num script `~/seguranca-audit.sh` que rode todas as verificações, imprima PASS/FAIL para cada uma e saia com código de erro (`exit 1`) se qualquer verificação falhar. Agende-o semanalmente com um timer do systemd. Descreva como esse script conecta todas as camadas vistas ao longo do capítulo.