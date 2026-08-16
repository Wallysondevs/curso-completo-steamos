O KIO não serve apenas para arquivos locais. Ele transforma URLs de serviços remotos — `sftp://`, `fish://`, `smb://`, `ftp://` — em diretórios navegáveis dentro do Dolphin, como se fossem pastas no seu SSD. Isso significa que você não precisa do `sshfs`, do `mount.cifs` ou de qualquer comando de montagem para acessar um servidor remoto. Basta digitar a URL na barra de endereço.

:::objetivos
- Acessar servidores remotos via Dolphin usando as URLs do KIO
- Entender a diferença entre os protocolos suportados: SFTP, Fish, Samba, FTP
- Comparar o acesso via KIO com a montagem via `sshfs`
- Navegar, copiar e editar arquivos remotos como se fossem locais
- Diagnosticar falhas de conexão com as mensagens de erro do KIO
:::

## URLs que viram pastas

A barra de endereço do Dolphin aceita URLs com esquema de protocolo. Digitar `sftp://servidor` abre uma conexão SSH para o servidor e mostra seu conteúdo como uma árvore de diretórios. A autenticação acontece na primeira conexão: o Dolphin pede usuário e senha, ou usa a chave SSH que você já tem configurada.

```terminal
$ dolphin sftp://ana@192.168.1.50
## Abre o Dolphin mostrando o home da usuária ana no servidor 192.168.1.50
## A barra de endereço mostra sftp://ana@192.168.1.50/home/ana
## Qualquer operação de arquivo funciona: copiar, renomear, apagar, editar
```

O comando acima não monta nada. O KIO traduz cada clique, arraste ou abertura de arquivo em uma operação remota. Para o usuário, a experiência é idêntica à de uma pasta local. Isso inclui editar arquivos: ao abrir um `.txt` remoto com duplo clique, o Dolphin baixa o arquivo para um diretório temporário, abre no Kate e, quando você salva, faz o upload de volta.

:::dica
Se você já tem chaves SSH configuradas em `~/.ssh/id_rsa` ou `~/.ssh/id_ed25519`, o Dolphin as usa automaticamente para `sftp://` e `fish://`. Não precisa digitar senha a cada conexão — o agente SSH do sistema (`ssh-agent`) gerencia a autenticação.
:::

## O cardápio de protocolos

O KIO suporta vários esquemas, cada um com sua finalidade:

| Esquema | Protocolo | Quando usar |
|---|---|---|
| `sftp://` | SSH File Transfer Protocol | Servidores Linux com SSH; o mais seguro e confiável |
| `fish://` | Files transferred over Shell protocol | Alternativa ao SFTP quando o servidor não tem subsistema SFTP |
| `smb://` | Samba / SMB | Compartilhamentos Windows, NAS doméstico, pendrive de roteador |
| `ftp://` | File Transfer Protocol | Servidores FTP legados; evite se possível (senha em texto puro) |
| `webdav://` | WebDAV | Serviços de nuvem com suporte WebDAV (Nextcloud, ownCloud) |
| `nfs://` | Network File System | Servidores NFS na rede local |

```terminal
$ dolphin fish://deck@steamdeck.local
## Acessa o Steam Deck pela rede via Fish
## Útil se o subsistema SFTP não estiver habilitado no Deck
```

O protocolo `fish://` é menos comum que `sftp://`, mas resolve uma situação real: servidores antigos ou embarcados que têm shell SSH mas não carregaram o subsistema `sftp-server`. Ele funciona enviando comandos de shell pelo SSH e interpretando a saída — mais lento, mas compatível com praticamente qualquer servidor Unix.

```terminal
$ dolphin smb://192.168.1.1/compartilhamento
## Abre um compartilhamento Samba do roteador ou NAS na rede local
## O Dolphin pede usuário/senha do compartilhamento, não do Linux
```

Para `smb://`, o Dolphin pede autenticação específica do compartilhamento. A senha fica armazenada no cofre de senhas do KDE (`kwallet`), que é desbloqueado automaticamente no login.

## KIO vs sshfs: montar ou não montar

O `sshfs` monta um sistema de arquivos remoto via FUSE, criando um ponto de montagem local (`/mnt/servidor/`). O KIO acessa arquivos sob demanda, sem ponto de montagem algum. Cada abordagem tem seu lugar.

```terminal
$ mkdir ~/remoto && sshfs ana@192.168.1.50:/home/ana ~/remoto
$ ls ~/remoto
Documentos  Imagens  lab  projetos
$ fusermount -u ~/remoto
```

Com `sshfs`, qualquer aplicativo — até um que não conhece rede — enxerga a pasta remota como local. Isso é útil para scripts, builds e ferramentas de linha de comando. A desvantagem é que a conexão cai se a rede oscilar e requer remontagem manual.

```terminal
$ dolphin sftp://ana@192.168.1.50
## O Dolphin usa o KIO sem montagem alguma
## Outros aplicativos (que não sejam KDE) NÃO enxergam essa conexão
## É leve e reconecta automaticamente
```

O KIO resolve o problema de forma mais leve: não há montagem, não há FUSE, e reconexões são automáticas. A contrapartida é que apenas aplicativos KDE (que usam a KDE Frameworks) enxergam o diretório remoto via KIO. Um `ls` no terminal não vê `sftp://...` — para isso, `sshfs` ainda é necessário.

:::atencao
Não confunda o Dolphin com o terminal: se você abrir `sftp://servidor` no Dolphin e depois abrir um Konsole, o `ls` e o `cd` não funcionam sobre aquele caminho remoto. Para operações de linha de comando sobre o servidor, use `sshfs` para montar ou `ssh ana@servidor` para uma sessão interativa.
:::

## Diagnosticando falhas

Quando uma conexão KIO falha, o Dolphin exibe uma barra de erro no topo da janela com o motivo. As mensagens mais comuns são:

```terminal
## Tente uma URL inválida para ver o erro:
$ dolphin ftp://servidor-inexistente
## Erro: "Could not connect to host servidor-inexistente: Name or service not known"
```

Erros de nome ("Name or service not known") indicam DNS ou que o nome do host está errado. Erros de conexão ("Connection refused") significam que o serviço não está rodando na porta esperada. Erros de autenticação ("Authentication failed") apontam para usuário, senha ou chave SSH incorretos.

```terminal
$ dolphin sftp://ana@192.168.1.50:2222
## Especifica porta 2222 em vez da padrão 22
## Útil quando o SSH do servidor escuta em porta não padrão
```

Para diagnosticar mais a fundo, você pode testar a conectividade SSH fora do Dolphin:

```terminal
$ ssh -v ana@192.168.1.50
[...verbose debug output...]
debug1: Authentication succeeded (publickey)
```

Se o `ssh` funciona no terminal e `sftp://` não funciona no Dolphin, o problema pode ser o `kwallet` (cofre de senhas corrompido) ou uma chave SSH com permissões erradas (`chmod 600 ~/.ssh/id_*` resolve).

## Resumo

- O KIO transforma URLs de protocolos (`sftp://`, `fish://`, `smb://`) em pastas navegáveis sem montagem.
- `sftp://` é o mais usado e seguro; `fish://` serve de fallback quando o subsistema SFTP não está disponível.
- `smb://` acessa compartilhamentos Windows e NAS; a autenticação é armazenada no `kwallet`.
- O `sshfs` monta uma pasta remota visível para todos os aplicativos; o KIO expõe apenas para aplicativos KDE.
- Erros de conexão no Dolphin podem ser testados com `ssh -v` no terminal para isolar se o problema é de rede ou do KIO.

## Exercícios

1. Se você tem acesso a outro computador com SSH na rede, abra `dolphin sftp://USUARIO@IP` e navegue até o home remoto. Copie um arquivo de lá para `~/lab` arrastando entre abas.
2. Teste a diferença: monte a mesma pasta remota com `sshfs USUARIO@IP:/home ~/remoto`, liste com `ls ~/remoto`, depois abra o Dolphin na pasta montada e compare a velocidade de navegação.
3. Use `ssh -v USUARIO@IP` para ver os detalhes da conexão SSH. Que tipo de autenticação foi usado: `password` ou `publickey`?
4. No Dolphin, acesse um compartilhamento `smb://` se houver na rede local. Se não houver, tente `smb://localhost` e observe a mensagem de erro.
5. **Desafio.** Configure uma chave SSH dedicada para o Dolphin: `ssh-keygen -t ed25519 -f ~/.ssh/dolphin_key`. Adicione-a ao servidor remoto e configure o `~/.ssh/config` com uma entrada `Host` que usa essa chave. Depois acesse `sftp://HostAlcunha` no Dolphin e verifique que a chave correta foi usada.