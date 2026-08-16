Habilitar SSH num Steam Deck é útil: você transfere arquivos, gerencia pacotes e edita configurações pelo teclado do computador principal em vez de cutucar a tela. Mas abrir uma porta de shell remoto também é a ação mais arriscada que você pode tomar em segurança doméstica — um SSH mal configurado é o vetor de invasão mais comum em máquinas Linux. Esta seção mostra como habilitar o SSH com chaves, desligar autenticação por senha e endurecer o `sshd`.

:::objetivos
- Habilitar o servidor SSH no SteamOS
- Gerar e usar chaves SSH no lugar de senha
- Desabilitar login como root e autenticação por senha
- Entender o arquivo `known_hosts` e o TOFU (Trust On First Use)
- Configurar um `authorized_keys` com opções restritivas
:::

## Habilitando o servidor SSH

No SteamOS, o `sshd` costuma estar instalado mas inativo. Ative e inicie:

```terminal
$ sudo systemctl enable --now sshd
Created symlink /etc/systemd/system/multi-user.target.wants/sshd.service ...
$ sudo systemctl status sshd | head -3
● sshd.service - OpenSSH Daemon
     Loaded: loaded (/lib/systemd/system/sshd.service; enabled)
     Active: active (running) since Sun 2025-01-12 10:00:00 -03
```

Agora o SSH escuta na porta 22 em todas as interfaces — verifique com `ss -ltnp | grep 22`. Antes de fazer qualquer outra coisa, certifique-se de que seu firewall permite a porta (seção [firewall](#/cap-098/sec-03)) e que você tem acesso local — não queira trancar-se para fora.

## Chaves em vez de senhas

Autenticação por senha via SSH é frágil: bots escaneiam a internet por portas 22 abertas e tentam combinações comuns (`deck:deck`, `root:root`) milhares de vezes por minuto. A solução canônica é usar chaves assimétricas: você gera um par de chaves (pública e privada) e coloca a pública no Steam Deck. Quem não tem a chave privada não entra — nem vê a tela de senha.

Gere o par na sua máquina cliente (não no Deck):

```terminal
$ ssh-keygen -t ed25519 -C "ana@notebook" -f ~/.ssh/steamdeck_ed25519
Generating public/private ed25519 key pair.
Enter passphrase (empty for no passphrase): 
Your identification has been saved in ~/.ssh/steamdeck_ed25519
Your public key has been saved in ~/.ssh/steamdeck_ed25519.pub
```

O algoritmo Ed25519 é moderno, rápido e de chave curta. Se seu cliente for antigo, use RSA 4096 (`-t rsa -b 4096`). A passphrase que você define protege a chave privada — sem ela, quem roubar o arquivo da chave tem acesso.

Copie a chave pública para o Deck:

```terminal
$ ssh-copy-id -i ~/.ssh/steamdeck_ed25519.pub deck@steamdeck.local
/usr/bin/ssh-copy-id: INFO: Source of key(s) to be installed: ...
deck@steamdeck.local's password: 
Number of key(s) added: 1
```

Agora a chave pública está em `/home/deck/.ssh/authorized_keys` no Deck, e você consegue conectar sem digitar senha:

```terminal
$ ssh -i ~/.ssh/steamdeck_ed25519 deck@steamdeck.local
[deck@steamdeck ~]$
```

## Endurecendo o sshd

Com as chaves funcionando, é hora de fechar as portas que sobraram abertas. Edite `/etc/ssh/sshd_config`:

```terminal
$ sudo steamos-readonly disable
$ sudo vim /etc/ssh/sshd_config
```

As mudanças essenciais:

```conf
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
X11Forwarding no
```

Depois recarregue o serviço e reative o read-only:

```terminal
$ sudo systemctl reload sshd
$ sudo steamos-readonly enable
```

Teste imediatamente numa **segunda sessão** — não feche a atual, pois se houver erro de configuração você perde acesso. Na segunda sessão, tente conectar por senha:

```terminal
$ ssh -o PreferredAuthentications=password deck@steamdeck.local
Permission denied (publickey).
```

A mensagem `Permission denied (publickey)` indica que o servidor recusou senha e só aceita chave — exatamente o que você configurou.

:::perigo
Desligar `PasswordAuthentication` sem ter uma chave funcionando **tranca você para sempre** do acesso remoto, e a recuperação exige console físico. Antes de mudar essa opção, confirme que `ssh -i sua_chave deck@steamdeck.local` funciona e que a chave está no `authorized_keys`.
:::

## authorized_keys com esteroides

Cada linha do `authorized_keys` aceita opções que limitam o que aquela chave específica pode fazer. As mais úteis para um Steam Deck:

```terminal
$ cat ~/.ssh/authorized_keys
from="192.168.1.0/24",no-port-forwarding,no-agent-forwarding,command="/usr/bin/systemctl status" ssh-ed25519 AAAAC3... ana@notebook
```

- `from=` restringe de quais IPs a chave é aceita.
- `no-port-forwarding` impede tunelamento de portas.
- `no-agent-forwarding` bloqueia o encaminhamento do agente SSH.
- `command=` força um comando fixo — qualquer tentativa de rodar outra coisa é ignorada.

Essa última é poderosa para automação: você deixa uma chave no Deck cujo único propósito é verificar o status do systemd, sem shell interativo.

## known_hosts e TOFU

Na primeira conexão, o SSH pergunta:

```terminal
$ ssh deck@steamdeck.local
The authenticity of host 'steamdeck.local (192.168.1.32)' can't be established.
ED25519 key fingerprint is SHA256:9aBcDeFgHiJkLmNoPqRsTuVwXyZaBcDeFgHiJk.
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

Isso é o modelo TOFU — *Trust On First Use*. Você confia na primeira vez e o SSH grava a chave do host em `~/.ssh/known_hosts`. Em conexões futuras, se a chave do host mudar, o SSH grita — e com razão, porque pode ser um ataque man-in-the-middle.

Para evitar essa pergunta em scripts (mas com segurança), pré-popule o `known_hosts`:

```terminal
$ ssh-keyscan -t ed25519 steamdeck.local >> ~/.ssh/known_hosts
```

:::dica
O `ssh-keyscan` varre as chaves do host sem iniciar conexão. Use quando estiver na rede local, antes de sair de casa, e o arquivo `known_hosts` estará pronto para conexões remotas via internet.
:::

## Resumo

- Habilite o `sshd` com `systemctl enable --now sshd`; verifique com `ss -ltnp`.
- Chaves Ed25519 (`ssh-keygen -t ed25519`) substituem senhas e eliminam o risco de força bruta.
- `ssh-copy-id` copia a chave pública para o Deck; `authorized_keys` é o arquivo de destino.
- Desabilite `PasswordAuthentication yes → no` e `PermitRootLogin no` no `sshd_config` depois de confirmar que a chave funciona.
- Opções no `authorized_keys` ( `from=`, `no-port-forwarding`, `command=`) limitam o escopo de cada chave.
- `known_hosts` implementa TOFU — respeite seus alertas, eles são a defesa contra MITM.

## Exercícios

1. Gere um par de chaves Ed25519, copie a chave pública para o Deck e faça login remoto sem senha.
2. Desabilite `PasswordAuthentication` no `sshd_config`, recarregue o serviço e confirme que login por senha é recusado.
3. Adicione a opção `from="192.168.1.0/24"` à sua linha em `authorized_keys` e teste a conexão de dentro e de fora da rede local (use um hotspot do celular para simular "fora").
4. Limpe seu `known_hosts`, conecte-se de novo, e compare a fingerprint exibida com `ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub` no Deck.
5. **Desafio.** Crie uma segunda chave no `authorized_keys` com a opção `command="/home/deck/scripts/status.sh"` onde `status.sh` imprime uptime, espaço em disco e temperatura. Teste que essa chave não consegue shell interativo nem executar outro comando.