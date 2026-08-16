O arquivo `/etc/ssh/sshd_config` tem cerca de 130 linhas comentadas e umas 5 ativas. A maioria das pessoas mexe em duas ou três e nunca mais volta. Só que o SSH é a porta de entrada do seu Deck — cada diretiva que você ajusta reduz a superfície de ataque ou evita um bloqueio acidental. Esta seção percorre as configurações que importam para um dispositivo móvel como o Deck: porta, usuários permitidos, timeouts, e o delicado equilíbrio entre segurança e conveniência.

:::objetivos
- Entender a estrutura do `sshd_config` e como testar mudanças sem derrubar a sessão ativa
- Alterar a porta padrão e restringir usuários que podem fazer login
- Configurar timeouts e limites de autenticação para redes hostis
- Diferenciar autenticação por chave, senha e PAM no contexto do SteamOS
- Criar um `sshd_config` seguro e adaptado ao uso móvel do Deck
:::

## Testando sem se trancar do lado de fora

A regra número um ao editar `sshd_config`: nunca reinicie o sshd sem testar. O OpenSSH tem um modo de validação e um modo de execução paralela que salvam você:

```terminal
$ sudo sshd -t
$ sudo sshd -t -f /etc/ssh/sshd_config.d/90-custom.conf
```

Se `sshd -t` não emitir nada, a sintaxe está correta. Para testar uma nova configuração sem derrubar conexões existentes, inicie uma segunda instância do sshd em outra porta:

```terminal
$ sudo steamos-readonly disable
$ sudo /usr/bin/sshd -p 2222 -d
debug1: sshd version OpenSSH_9.6p1
debug1: private host key #0: ssh-rsa SHA256:...
debug1: private host key #1: ecdsa-sha2-nistp256 SHA256:...
debug1: private host key #2: ssh-ed25519 SHA256:...
debug1: rexec_argv[0]='/usr/bin/sshd'
debug1: rexec_argv[1]='-p'
debug1: rexec_argv[2]='2222'
debug1: rexec_argv[3]='-d'
debug1: Set /proc/self/oom_score_adj from 0 to -1000
debug1: Bind to port 2222 on 0.0.0.0.
Server listening on 0.0.0.0 port 2222.
```

A flag `-d` roda em primeiro plano com saída de depuração. Conecte-se por outra janela com `ssh -p 2222 deck@IP`. Se funcionar, sua configuração é segura. `[[Ctrl+C]]` encerra a instância de teste. A instância principal na porta 22 nunca foi interrompida.

:::atencao
Nunca teste configurações reiniciando `systemctl restart sshd` com uma única sessão aberta. Se houver erro de sintaxe ou regra que bloqueie seu usuário, você perde o acesso. Mantenha sempre uma sessão de backup ativa enquanto testa.
:::

## Porta e escuta seletiva

A porta 22 é o alvo número um de scanners automatizados. Mover o sshd para uma porta alta reduz drasticamente o ruído nos logs — não é segurança por obscuridade, é redução de atrito:

```text
Port 2222
```

Mas no Steam Deck isso tem uma implicação prática: se você usa redes corporativas, universitárias ou de hotéis, portas altas podem estar bloqueadas no firewall de saída. A porta 443 (HTTPS) quase sempre está aberta, e o sshd pode escutar nela também:

```text
Port 22
Port 443
```

O sshd aceita múltiplas diretivas `Port`. Você pode escutar na 22 para acesso local e na 443 para contornar firewalls restritivos. Outra diretiva relevante para o Deck, que tem Wi-Fi e pode ter adaptador USB-C Ethernet:

```text
ListenAddress 192.168.1.105
ListenAddress 100.64.0.5
```

Amarre o sshd a endereços específicos se você sabe quais interfaces são confiáveis — por exemplo, só escutar no IP do Tailscale (100.x.x.x) e não no Wi-Fi público.

## Restringindo usuários e grupos

Por padrão, qualquer usuário com shell válido pode fazer login via SSH. No Deck, `deck` é o único usuário humano; `root` não tem senha, mas pode ter chave. Restrinja:

```text
AllowUsers deck
PermitRootLogin prohibit-password
```

`AllowUsers deck` é uma lista branca: só `deck` entra, ninguém mais. `PermitRootLogin prohibit-password` permite root só com chave — nunca com senha. Se você quer bloquear root completamente:

```text
PermitRootLogin no
```

:::perigo
Nunca configure `PermitRootLogin yes` com `PasswordAuthentication yes`. É a combinação que bots de SSH exploram. No Steam Deck, que você carrega para redes públicas, isso é especialmente perigoso.
:::

Para cenários em que várias pessoas usam o Deck (raro, mas possível), `AllowGroups` filtra por grupo:

```text
AllowGroups sshusers
```

## Timeouts e limites de autenticação

Redes públicas significam latência variável e possíveis tentativas de conexão indesejadas. Estas diretivas ajustam o comportamento:

```text
LoginGraceTime 30
MaxAuthTries 3
MaxSessions 2
ClientAliveInterval 120
ClientAliveCountMax 2
```

`LoginGraceTime 30` dá 30 segundos para o cliente se autenticar — se demorar mais, o sshd fecha a conexão. `MaxAuthTries 3` permite três tentativas de chave ou senha antes de encerrar. `ClientAliveInterval` e `ClientAliveCountMax` juntos significam que o servidor envia um probe a cada 120 segundos e, após duas falhas consecutivas (4 minutos sem resposta), derruba a sessão — liberando recursos de conexões zumbis.

```terminal
$ sudo sshd -T | grep -E 'LoginGraceTime|MaxAuthTries|ClientAlive'
logingracetime 30
maxauthtries 3
clientaliveinterval 120
clientalivecountmax 2
```

O `sshd -T` despeja a configuração efetiva (após processar includes e defaults). É a melhor forma de conferir se suas mudanças pegaram.

## Arquivos drop-in em `sshd_config.d`

Em vez de editar o arquivo principal e arriscar conflitos com atualizações do SteamOS, use um arquivo drop-in:

```terminal
$ sudo mkdir -p /etc/ssh/sshd_config.d
$ sudo nano /etc/ssh/sshd_config.d/90-deck.conf
```

```text
Port 22
PermitRootLogin no
PasswordAuthentication no
AllowUsers deck
LoginGraceTime 30
MaxAuthTries 3
ClientAliveInterval 120
ClientAliveCountMax 2
```

O diretório `sshd_config.d/` é incluído automaticamente pelo OpenSSH no SteamOS 3.6. Arquivos com extensão `.conf` são lidos em ordem alfabética — o prefixo `90-` garante que suas configurações venham depois das padrão e as sobrescrevam.

```terminal
$ sudo sshd -t
$ sudo systemctl restart sshd
$ sudo steamos-readonly enable
```

## Resumo

- Sempre teste configurações com `sshd -t` e idealmente com uma segunda instância em porta diferente.
- Mover o SSH para uma porta alta reduz ruído de scans, mas a porta 443 contorna firewalls restritivos.
- `AllowUsers deck` e `PermitRootLogin no` são a dupla mínima de segurança para um dispositivo móvel.
- `LoginGraceTime`, `MaxAuthTries` e `ClientAliveInterval` protegem contra conexões lentas e tentativas de força bruta.
- Prefira arquivos drop-in em `/etc/ssh/sshd_config.d/` para isolar suas customizações das atualizações do SteamOS.

## Exercícios

1. Liste a configuração efetiva do sshd com `sshd -T` e explique pelo menos cinco diretivas que aparecem na saída.
2. Inicie uma segunda instância do sshd na porta 2222 com `-d`, conecte-se a ela e encerre com `[[Ctrl+C]]`. A sessão original na porta 22 continuou funcionando?
3. Crie um arquivo `/etc/ssh/sshd_config.d/90-deck.conf` com as configurações recomendadas e teste com `sshd -t`.
4. Configure `AllowUsers` para um nome de usuário incorreto e tente conectar. O que acontece? Reverta e explique por que listas brancas são mais seguras que listas negras.
5. **Desafio.** Simule um ataque de força bruta contra seu Deck: use `sshpass` ou um loop com `ssh` tentando senhas erradas e observe os logs (`journalctl -u sshd -f`). Depois ative `MaxAuthTries 3` e repita. Qual a diferença de comportamento?