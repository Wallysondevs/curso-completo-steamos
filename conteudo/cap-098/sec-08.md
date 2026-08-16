Segurança não é só fechar portas — é saber que, se algo der errado, você consegue reconstruir o que aconteceu. Logs são a memória forense do sistema: registram logins, falhas de autenticação, comandos via `sudo`, desligamentos e até acessos a arquivos (se você pedir). Esta seção mostra como extrair informações de segurança do journal e de arquivos de log clássicos, e como configurar alertas básicos.

:::objetivos
- Consultar tentativas de login e falhas com `last`, `lastb` e `faillock`
- Navegar no journal filtrando por unidade, prioridade e horário
- Identificar uma tentativa de força bruta no log de autenticação
- Configurar `auditd` para registrar acessos a arquivos sensíveis
- Criar um script de verificação diária de anomalias
:::

## Quem entrou na sua máquina

Os comandos `last` e `lastb` leem `/var/log/wtmp` e `/var/log/btmp` (binários, não edite na mão) para reconstruir sessões passadas.

```terminal
$ last -n 10
deck     tty7         :0               Sun Jan 12 09:45   still logged in
deck     pts/0        192.168.1.15     Sun Jan 12 09:32 - 09:40  (00:08)
reboot   system boot  6.8.0-valve37    Sun Jan 12 09:30   still running
```

Cada linha: usuário, terminal (tty7 = console local, pts/0 = SSH ou terminal virtual), IP de origem no caso remoto, horário de início e fim. A linha `still logged in` indica sessão ativa.

As tentativas que falharam ficam em `lastb` (requer `sudo`):

```terminal
$ sudo lastb -n 5
root     ssh:notty    45.33.32.143    Sun Jan 12 03:17 - 03:17  (00:00)
admin    ssh:notty    45.33.32.143    Sun Jan 12 03:17 - 03:17  (00:00)
deck     ssh:notty    45.33.32.143    Sun Jan 12 03:17 - 03:17  (00:00)
```

O IP `45.33.32.143` tentou três usuários em sequência — uma assinatura clássica de bot de força bruta. Ter desligado `PasswordAuthentication` (seção anterior) torna essas tentativas inócuas, mas elas continuam aparecendo.

O `faillock` (parte do `pam_faillock`) mostra falhas recentes de autenticação local:

```terminal
$ sudo faillock --user deck
deck: 0
```

Zero falhas significa que ninguém errou a senha do `deck` recentemente. Para ver o histórico completo: `sudo faillock`.

## Navegando o journal como detetive

O `journalctl` centraliza logs do kernel, do systemd e dos serviços. Se você suspeita de atividade indesejada, comece filtrando por prioridade:

```terminal
$ journalctl -p err --since "2025-01-11" | head -20
```

Isso mostra tudo com nível `err` ou pior desde 11 de janeiro. Para restringir ao SSH:

```terminal
$ journalctl -u sshd --since "2025-01-12 03:00" --until "2025-01-12 04:00"
```

E é aqui que você encontra as tentativas do bot:

```text
Jan 12 03:17:22 steamdeck sshd[21933]: Failed password for root from 45.33.32.143 port 54321 ssh2
Jan 12 03:17:24 steamdeck sshd[21933]: Failed password for invalid user admin from 45.33.32.143 port 54322 ssh2
Jan 12 03:17:27 steamdeck sshd[21933]: Failed password for deck from 45.33.32.143 port 54323 ssh2
```

Três tentativas em cinco segundos do mesmo IP, três usuários diferentes — é um bot. Se `PasswordAuthentication` estiver desligado, essas linhas nem aparecem; o servidor rejeita antes da autenticação.

:::dica
Use `journalctl -f` para seguir os logs em tempo real e `journalctl --dmesg` para mensagens do kernel. O `journalctl -k` mostra logs de boot desde o início da inicialização atual. Em investigações de segurança, sempre comece com `-p err` e depois vá refinando por unidade (`-u`) e horário.
:::

## Configurando auditd para arquivos sensíveis

O `auditd` é o subsistema de auditoria do kernel Linux. Diferente do journal, ele registra eventos de syscall — acessos a arquivos, mudanças de permissão, execuções de programas. Instale-o e configure regras:

```terminal
$ sudo apt install auditd
$ sudo auditctl -w /home/deck/.ssh/id_ed25519 -p rwa -k chave-ssh
$ sudo auditctl -l
-w /home/deck/.ssh/id_ed25519 -p rwa -k chave-ssh
```

A regra diz: observe (`-w`) o arquivo da chave privada, registre leitura (`r`), escrita (`w`) e mudança de atributo (`a`), e marque com a etiqueta `chave-ssh`. Os eventos aparecem em `/var/log/audit/audit.log`:

```terminal
$ sudo ausearch -k chave-ssh --interpret --start recent
time->Sun Jan 12 11:02:15 2025
type=PROCTITLE msg=audit(...) proctitle=cat /home/deck/.ssh/id_ed25519
type=PATH msg=audit(...) name=/home/deck/.ssh/id_ed25519 ...
type=SYSCALL msg=audit(...) syscall=openat success=yes exit=3
```

Alguém (ou algum processo) leu a chave privada às 11:02:15. A segunda linha mostra o comando (`cat`). A terceira mostra a syscall (`openat`) e que teve sucesso.

:::atencao
O `auditd` gera volume de log proporcional às regras. Monitore o tamanho com `du -sh /var/log/audit` e configure rotação em `/etc/audit/auditd.conf` (opção `max_log_file`). Não crie regras amplas como `-w / -p wa` — isso logaria cada escrita do sistema e encheria o disco em minutos.
:::

## Script de verificação diária

Um script que roda via timer systemd e reporta anomalias é a última linha de defesa proativa. Exemplo auto-contido:

```terminal
$ cat ~/scripts/check-seguranca.sh
#!/bin/bash
echo "=== Falhas de autenticação nas últimas 24h ==="
sudo grep "$(date -d 'yesterday' '+%b %-d')" /var/log/auth.log | grep -i 'fail' | grep -v sudo | tail -10
echo ""
echo "=== Tentativas de sudo rejeitadas ==="
sudo grep 'authentication failure' /var/log/auth.log | tail -5
echo ""
echo "=== Portas em escuta (expostas) ==="
ss -ltnp | grep '0.0.0.0'
```

Salve em `~/scripts/check-seguranca.sh`, torne executável (`chmod 755`) e coloque num timer systemd diário para receber o relatório por e-mail ou arquivo.

:::info
O caminho exato do `auth.log` pode variar. Em sistemas com journal persistente, use `journalctl -u sshd --since "24 hours ago" | grep Failed` — mais portável e não depende de `/var/log/auth.log` existir.
:::

## Resumo

- `last` mostra sessões passadas; `lastb` mostra tentativas de login que falharam; `faillock` mostra falhas recentes de autenticação local.
- O `journalctl` centraliza logs do sistema: filtre por unidade (`-u`), prioridade (`-p`), tempo (`--since`, `--until`) e siga em tempo real (`-f`).
- Bots de força bruta aparecem como sequências de `Failed password` no log do `sshd` vindos do mesmo IP em segundos.
- O `auditd` registra eventos de syscall; regras com `auditctl -w` monitoram acessos a arquivos específicos.
- Um script diário de verificação com `grep`, `ss` e `journalctl` é a forma mais leve de auditoria contínua.

## Exercícios

1. Execute `last -n 20` e `sudo lastb -n 20`. Alguma sessão remota aparece? Algum IP suspeito tenta login?
2. Use `journalctl -u sshd --since "7 days ago" | grep Failed` e conte quantas tentativas de força bruta houve na última semana.
3. Instale o `auditd`, crie uma regra para monitorar leituras de `~/.bashrc` e acione um `cat ~/.bashrc` para gerar evento. Depois recupere o evento com `ausearch`.
4. Configure uma regra `auditctl -w /etc/ssh/sshd_config -p wa -k sshd-config` e edite o arquivo. O que aparece no `ausearch`?
5. **Desafio.** Escreva e ative um timer systemd que execute um script de auditoria todos os dias às 07:00 e grave a saída em `~/log/audit-$(date +%Y%m%d).txt`. O script deve relatar: portas expostas, falhas de login e arquivos com permissão `o+w` em `~/.local/share`.