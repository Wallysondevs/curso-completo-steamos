Se o seu osso é um **NAS** em casa, ou um computador que sempre fica ligado compartilhando uma pasta, as transferências pontuais ficam pequenas perto do valor de *montar* esse compartilhamento no Deck como se fosse um disco local. É aí que entram o SMB/Samba (o protocolo do Windows e dos NAS) e o NFS (o protocolo tradicional do Linux/UNIX).

:::objetivos
- Diferenciar SMB/Samba de NFS e quando usar cada um
- Acessar compartilhamentos SMB no Dolphin (`smb://`)
- Montar compartilhamentos SMB/CIFS permanentemente via fstab
- Montar exportações NFS
- Lidar com credenciais e permissões de forma segura
:::

## SMB/Samba vs. NFS

- **SMB/Samba** é o protocolo de compartilhamento do Windows, agora o padrão *de facto* de quase todo NAS doméstico. É interoperável com tudo e suporta autenticação por usuário/senha. Desvantagem: overhead maior.
- **NFS** é o protocolo nativo do Linux/UNIX, mais rápido e leve que o SMB, mas menos amigável a Windows e com autenticação por IP/cliente (não por senha simples).

Regra prática: se o compartilhamento já existe num NAS/Windows, use **SMB**; se você controla um servidor Linux e quer velocidade, **NFS**.

## Acessando por SMB no Dolphin

O caminho mais rápido é navegar pelo Dolphin (modo Desktop). Na barra de endereço:

```terminal
smb://192.168.1.10/compartilhamento
```

O Dolphin pede usuário e senha e monta o compartilhamento na árvore lateral ("Rede"). A partir daí, é arrastar-e-soltar como qualquer pasta.

## Montando SMB via linha de comando

Para acesso persistente ou via script, monte com `mount.cifs`:

```terminal
# instalar utilitários (cifs-utils) se não vierem
$ sudo pacman -S cifs-utils

# montar manualmente
$ sudo mount -t cifs //192.168.1.10/pasta /mnt/nas \
    -o username=usuario,uid=1000,gid=1000,iocharset=utf8
```

Para que sobreviva a reboot, adicione ao `/etc/fstab` (guardando credenciais num arquivo protegido, nunca em texto puro na linha):

```terminal
# /etc/fstab
//192.168.1.10/pasta /mnt/nas cifs credentials=/etc/samba/creds,uid=1000,gid=1000,noauto,x-systemd.automount 0 0
```

O arquivo `/etc/samba/creds` guarda `username=` e `password=` com permissão `600` (só root lê). As opções `noauto,x-systemd.automount` montam sob demanda, sem atrasar o boot.

## Montando NFS

Se o servidor exporta NFS:

```terminal
# instalar o cliente NFS
$ sudo pacman -S nfs-utils

# montar
$ sudo mount -t nfs 192.168.1.10:/export/pasta /mnt/nfs

# fstab (persistente)
192.168.1.10:/export/pasta /mnt/nfs nfs defaults,noauto,x-systemd.automount 0 0
```

## Permissões e idiossincrasias

- Em SMB montado como `uid=1000,gid=1000`, os arquivos pertencem ao usuário `deck`, evitando o clássico "arquivo só de leitura".
- NFS respeita UID/GID do servidor: se os IDs não baterem entre Deck e servidor, use `idmapd` ou a opção `all_squash` no servidor.
- Compartilhamentos grandes podem exigir `rsync` ou uma montagem cuidadosa para evitar lentidão (o Dolphin sobre SMB é conveniente, mas não otimizado para mover terabytes).

## Pontos-chave

- SMB/Samba é o padrão dos NAS/Windows; NFS é a opção Linux mais rápida.
- `smb://IP/pasta` no Dolphin dá acesso imediato por senha.
- `mount.cifs` / `mount.nfs` + fstab tornam o acesso persistente e sob demanda.
- Credenciais vão em arquivo `600`, não na linha do fstab.
- Ajuste `uid`/`gid` (SMB) ou o mapeamento de IDs (NFS) para permissões corretas.

## Exercícios

1. Acesse um compartilhamento SMB existente pelo Dolphin usando `smb://`.
2. Monte o mesmo compartilhamento manualmente com `mount.cifs` e liste o conteúdo.
3. Adicione a entrada ao `/etc/fstab` com credenciais em arquivo e verifique a montagem sob demanda.
4. Se tiver um servidor NFS, monte uma exportação e compare a velocidade de cópia com o SMB.
5. **Desafio.** Monte um compartilhamento como `noauto,x-systemd.automount` e demonstre que ele monta sozinho ao acessar a pasta.
