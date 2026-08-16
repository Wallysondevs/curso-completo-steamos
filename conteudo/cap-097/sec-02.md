Senha no SSH é como cadeado de brinquedo: funciona, mas qualquer pessoa na mesma rede pode tentar adivinhar, e bots escaneiam a porta 22 o tempo inteiro. Chaves criptográficas resolvem isso com um par de arquivos — um segredo que fica com você e um selo público que você coloca no Deck. Depois de configurado, o acesso é transparente: você digita `ssh deck@steamdeck` e entra, sem senha e sem risco de força bruta.

:::objetivos
- Gerar um par de chaves ED25519 e entender a diferença entre chave pública e privada
- Copiar a chave pública para o Steam Deck com segurança
- Desabilitar a autenticação por senha no sshd
- Organizar múltiplas chaves com `~/.ssh/config`
- Recuperar o acesso quando a chave é perdida
:::

## Por que chaves em vez de senhas

Uma senha SSH viaja pela rede (criptografada dentro do túnel, mas ainda assim digitada por um humano). Uma chave privada nunca sai da sua máquina — o que viaja é uma assinatura digital que prova que você possui a chave, sem revelá-la. Além de mais seguro, é mais rápido: o SSH não pergunta nada, só conecta.

O SteamOS usa OpenSSH, que suporta vários algoritmos de chave. O ED25519 é a recomendação atual: tão seguro quanto RSA 3072 bits, com chaves minúsculas e operações mais velozes — ideal para o hardware modesto do Deck.

```terminal
$ ssh-keygen -t ed25519 -C "ana@desktop"
Generating public/private ed25519 key pair.
Enter file in which to save the key (/home/ana/.ssh/id_ed25519):
Enter passphrase (empty for no passphrase):
Enter same passphrase again:
Your identification has been saved in /home/ana/.ssh/id_ed25519
Your public key has been saved in /home/ana/.ssh/id_ed25519.pub
The key fingerprint is:
SHA256:qXnMBjcKqBvQ4vJi7WpGle0mvWxEGCjwcFItfNe2CkQ ana@desktop
The key's randomart image is:
+--[ED25519 256]--+
|    o=+o    .    |
|   . o=o.  o .   |
|    . +.+. .+    |
|     o =. .o .   |
|    . o.S.. .    |
|     . o.. o     |
|      . . o o    |
|       . o oE    |
|        .o+o     |
+----[SHA256]-----+
```

O `-C "ana@desktop"` é um comentário que identifica de qual máquina veio essa chave — útil quando você tem várias. A passphrase é opcional mas recomendada: ela protege a chave privada caso alguém copie o arquivo.

:::nota
Se você já tem uma chave SSH na sua máquina, não precisa gerar outra. Use a existente — cada chave pública pode ser copiada para quantos servidores quiser. O par é como uma chave física: você guarda a cópia secreta e distribui cópias da fechadura.
:::

## Copiando a chave para o Deck

O comando `ssh-copy-id` automatiza o processo: ele conecta no Deck, pede a senha uma última vez, e adiciona sua chave pública ao arquivo `~/.ssh/authorized_keys` do usuário `deck`:

```terminal
$ ssh-copy-id deck@192.168.1.105
/usr/bin/ssh-copy-id: INFO: Source of key(s) to be installed: "/home/ana/.ssh/id_ed25519.pub"
/usr/bin/ssh-copy-id: INFO: attempting to log in with the new key(s), to filter out any that are already installed
/usr/bin/ssh-copy-id: INFO: 1 key(s) remain to be installed -- if you are prompted now it is to install the new keys
(deck@192.168.1.105) Password:

Number of key(s) added: 1

Now try logging into the machine, with:   "ssh 'deck@192.168.1.105'"
and check to make sure that only the key(s) you wanted were added.
```

Depois desse comando, o acesso é direto — sem senha:

```terminal
$ ssh deck@192.168.1.105
(deck@steamdeck) $
```

O arquivo `~/.ssh/authorized_keys` no Deck agora contém sua chave pública. Você pode verificá-lo:

```terminal
$ cat ~/.ssh/authorized_keys
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGV4YW1wbGVrZXlmb3J0aGVzdGVhbWRlY2tjb3Vyc2U= ana@desktop
```

:::dica
Se `ssh-copy-id` falhar com `Permission denied`, verifique se o usuário `deck` tem senha definida. No SteamOS, rode `passwd` no Deck antes de usar `ssh-copy-id` — ou copie a chave manualmente: `cat ~/.ssh/id_ed25519.pub | ssh deck@IP 'cat >> ~/.ssh/authorized_keys'`.
:::

## Desabilitando senha no SSH

Com a chave funcionando, a senha se torna um risco desnecessário. Edite `/etc/ssh/sshd_config` no Deck:

```terminal
$ sudo steamos-readonly disable
$ sudo nano /etc/ssh/sshd_config
```

Encontre e ajuste estas linhas:

```text
PasswordAuthentication no
ChallengeResponseAuthentication no
UsePAM yes
```

Depois reinicie o serviço e trave o sistema:

```terminal
$ sudo systemctl restart sshd
$ sudo steamos-readonly enable
```

Teste a conexão antes de fechar o terminal atual — um `PasswordAuthentication no` mal configurado pode trancá-lo do lado de fora:

```terminal
$ ssh deck@192.168.1.105
(deck@steamdeck) $
```

Se a conexão cair com `Permission denied (publickey)`, sua chave não está sendo oferecida. Use `ssh -v` para depurar, ou `ssh -i ~/.ssh/id_ed25519` para especificar a chave explicitamente.

## Organizando com `~/.ssh/config`

Digitar o IP toda vez cansa. O arquivo `~/.ssh/config` cria apelidos e aplica opções automaticamente:

```text
Host deck
    HostName 192.168.1.105
    User deck
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

Depois disso, `ssh deck` é suficiente. O `ServerAliveInterval` envia um pacote keepalive a cada 60 segundos, evitando que o roteador derrube conexões ociosas — comum em redes domésticas.

```terminal
$ ssh deck
(deck@steamdeck) $
```

Você pode ter quantos blocos `Host` quiser: `deck-casa`, `deck-trabalho`, `deck-vpn`, cada um com seu IP ou endereço Tailscale.

## Resumo

- Chaves SSH são mais seguras e mais rápidas que senhas; ED25519 é o algoritmo recomendado.
- `ssh-keygen -t ed25519` gera o par; `ssh-copy-id deck@IP` instala a chave pública no Deck.
- O arquivo `~/.ssh/authorized_keys` no Deck lista as chaves autorizadas — uma por linha.
- `PasswordAuthentication no` no `sshd_config` fecha a porta para força bruta, mas teste a chave antes.
- `~/.ssh/config` no cliente cria apelidos e aplica opções como keepalive automaticamente.

## Exercícios

1. Gere um par de chaves ED25519 com comentário identificando sua máquina. Liste o conteúdo da chave pública e explique qual parte revela o algoritmo e qual é a chave propriamente dita.
2. Copie a chave para o Deck usando `ssh-copy-id`. Depois, confira que a entrada em `authorized_keys` é idêntica ao conteúdo do `.pub`.
3. Desabilite `PasswordAuthentication` no Deck, reinicie o sshd e teste a conexão. Depois reverta a configuração e explique o que aconteceria se a chave fosse perdida.
4. Crie um bloco `Host deck` no seu `~/.ssh/config` e teste a conexão usando apenas o apelido. Adicione `ServerAliveInterval` e explique por que isso ajuda em redes instáveis.
5. **Desafio.** Configure duas chaves diferentes — uma do seu desktop e outra do seu notebook — para acessar o Deck. Depois, remova temporariamente uma delas do `authorized_keys` e comprove que o acesso dessa máquina é bloqueado enquanto a outra continua funcionando. Restaure a chave e explique o modelo de confiança: cada chave é uma "fechadura" independente.