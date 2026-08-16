Quando você quer *controle de verdade* sobre os arquivos do Deck — mover, renomear, sincronizar, executar em lote, automatizar — nada vence o SSH. Ele abre uma shell remota no Deck a partir de qualquer outro computador, e seu par de protocolos irmãos, `scp` e `sftp`, transportam arquivos sobre a mesma segurança do SSH. O SteamOS já traz o servidor embutido; basta ligá-lo.

:::objetivos
- Ativar o servidor SSH no SteamOS de forma persistente
- Autenticar por senha e, idealmente, por chave
- Usar `scp`, `sftp` e `rsync` para transferir arquivos
- Montar o Deck como pasta no Dolphin via `sftp://`
- Proteger o acesso contra tentativas de intrusão
:::

## Ativando o SSH

O servidor OpenSSH (`sshd`) vem instalado, mas desativado. Ative para a sessão atual e torne persistente:

```terminal
# no Deck, no modo Desktop (Konsole)
$ sudo systemctl enable --now sshd
```

Por padrão, a conta `deck` não tem senha definida (o SteamOS usa login automático). Para poder entrar via SSH com senha, defina uma senha para o `deck`:

```terminal
$ passwd
```

Anote o IP do Deck para conectar de outro PC:

```terminal
$ ip addr show | grep "inet "
    inet 192.168.1.42/24 ...
```

## Conectando e transferindo

Do outro PC (Linux/macOS/Windows com client SSH):

```terminal
# shell remota
$ ssh deck@192.168.1.42

# copiar arquivo do PC para o Deck (scp)
$ scp ./jogo.iso deck@192.168.1.42:~/ROMs/

# copiar do Deck para o PC
$ scp deck@192.168.1.42:~/saves/save.srm .

# SFTP interativo
$ sftp deck@192.168.1.42
sftp> put arquivo.bin
sftp> get foto.png
```

No **Dolphin** (gerenciador de arquivos do Plasma), você navega no Deck como se fosse uma pasta local digitando a URL na barra de endereço:

```terminal
sftp://deck@192.168.1.42/home/deck
```

Isso é a forma mais confortável do dia a dia: arrastar-e-soltar entre Janelas, com o Deck aparecendo como um disco de rede.

## A vantagem do rsync

`rsync` transfere apenas as diferenças e preserva permissões/timestamps — ideal para backups e espelhos:

```terminal
# espelhar uma pasta local para o Deck, sem retransmitir o que já existe
$ rsync -avP --delete ./meus-roms/ deck@192.168.1.42:~/Emulation/roms/

# puxar saves do Deck para o PC (backup)
$ rsync -avP deck@192.168.1.42:~/Emulation/saves/ ./backup-saves/
```

As opções: `-a` (archive, preserva tudo), `-v` (verboso), `-P` (progresso + retomável), `--delete` (remove no destino o que sumiu na origem).

## Chave pública em vez de senha

Para não digitar senha toda vez (e para scripts), use autenticação por chave:

```terminal
# no PC, gerar um par de chaves (se ainda não tiver)
$ ssh-keygen -t ed25519

# copiar a chave pública para o Deck
$ ssh-copy-id deck@192.168.1.42
```

Depois disso, o login é automático. Você pode então **desativar o login por senha** no Deck (mais seguro), editando `/etc/ssh/sshd_config` com `PasswordAuthentication no` e recarregando o serviço.

## Segurança

Um SSH aberto na rede é uma porta convidativa. Contenha o risco:

- Use chave pública e desative senha.
- Altere a porta padrão (22) se o Deck ficar exposto a redes públicas.
- Mantenha o serviço ativo só quando precisar (`systemctl stop sshd` quando terminar).
- No `firewalld`, restringa o SSH a IPs da sua rede local.

## Pontos-chave

- SSH = controle total; ative com `sudo systemctl enable --now sshd` + senha no `deck`.
- `scp` copia pontualmente; `sftp` é interativo; `rsync -avP` espelha com eficiência.
- `sftp://deck@IP/...` no Dolphin traz o Deck como pasta local.
- Chave pública (`ssh-copy-id`) elimina senha e habilita scripts.
- Desative senha e feche o serviço quando não estiver usando.

## Exercícios

1. Ative o SSH e defina uma senha para o usuário `deck`.
2. Conecte de outro PC com `ssh deck@IP` e liste o diretório home.
3. Transfira um arquivo nos dois sentidos usando `scp`.
4. Abra `sftp://deck@IP/...` no Dolphin e arraste um arquivo entre as janelas.
5. **Desafio.** Configure login por chave (`ssh-copy-id`), desative `PasswordAuthentication` e confirme que o login sem senha continua funcionando.
