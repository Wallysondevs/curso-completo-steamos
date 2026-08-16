Fechando o bloco de comandos essenciais, esta seção trata daquilo que dá segurança e vida ao sistema de arquivos: permissões, donos, espaço em disco e montagem. No SteamOS, entender permissões evita que você quebre o sistema com `sudo` na mão; entender `df`/`du` evita que um SSD lotado faça o desktop travar de surpresa.

:::objetivos
- Interpretar e alterar permissões com `chmod` em modos simbólico e octal
- Trocar dono e grupo com `chown` e `chgrp`
- Medir espaço em disco com `df` e `du`
- Entender o funcionamento básico de `mount`, `umount` e `/etc/fstab`
- Diagnosticar permissão negada e disco cheio com confiança
:::

## Permissões com `chmod`

Cada arquivo tem três conjuntos de permissões — dono (user), grupo (group) e outros (others) — cada um com leitura (`r`), escrita (`w`) e execução (`x`).

| Comando | O que faz |
|---|---|
| `chmod u+x script.sh` | Dá execução ao dono |
| `chmod g-w arquivo` | Remove escrita do grupo |
| `chmod o-rw arquivo` | Remove leitura e escrita dos outros |
| `chmod a+r arquivo` | Dá leitura para todos (all) |
| `chmod 755 script.sh` | `rwxr-xr-x`: dono total, grupo/outros leem e executam |
| `chmod 644 arquivo` | `rw-r--r--`: padrão de arquivo comum |
| `chmod 600 chave.pem` | `rw-------`: só o dono, dono lê e escreve |
| `chmod -R 755 pasta/` | Aplica recursivamente |
| `chmod u+x` **vs** `chmod +x` | `u+x` só dono; `+x` todos (obedece umask) |

```terminal
$ chmod 600 ~/.ssh/id_ed25519
$ ls -l ~/.ssh/id_ed25519
-rw------- 1 ana ana 411 dez 12 20:00 /home/ana/.ssh/id_ed25519
```

A chave privada SSH deve ter exatamente `600`: só o dono lê e escreve. Se estiver mais permissiva (ex.: `644`), o cliente `ssh` se recusa a usá-la por segurança — uma mensagem de erro que costuma confundir iniciantes.

:::dica
No modo octal, cada dígito é a soma de `r=4`, `w=2`, `x=1`. `755` = dono `4+2+1=7` (rwx), grupo `4+0+1=5` (r-x), outros `5` (r-x). Decorar esses três valores resolve 90% dos casos reais.
:::

## Donos e grupos com `chown` e `chgrp`

Permissões só fazem sentido em relação a um **dono** e um **grupo**. Trocar dono é tarefa de administrador.

| Comando | O que faz |
|---|---|
| `chown ana arquivo` | Troca o dono para `ana` |
| `chown ana:users arquivo` | Troca dono e grupo de uma vez |
| `chown -R ana:users pasta/` | Recursivamente |
| `chgrp users arquivo` | Troca só o grupo |
| `chgrp -R users pasta/` | Grupos recursivamente |
| `id` | Mostra seus UID, GID e grupos |
| `id ana` | Mostra UID, GID e grupos de outro usuário |

```terminal
$ id ana
uid=1000(ana) gid=1000(ana) grupos=1000(ana),27(sudo),108(vboxusers)
```

O `id` revela que `ana` pertence ao grupo `sudo` — por isso pode usar o comando `sudo`. No SteamOS, o usuário `deck` (padrão) também pertence a `sudo`. Grupos como `vboxusers` e `docker` concedem privilégios especiais a quem pertence a eles.

:::atencao
Adicionar um usuário ao grupo `docker` ou `sudo` dá poderes de root efetivo — é uma decisão de segurança, não de conveniência. Consulte os grupos de um usuário com `id <usuário>` antes de conceder algo.
:::

## Espaço em disco com `df` e `du`

`df` responde "quanto espaço cada sistema de arquivos tem livre"; `du` responde "o que está ocupando espaço".

| Comando | O que faz |
|---|---|
| `df -h` | Espaço por sistema de arquivos, em unidades legíveis |
| `df -h /` | Espaço do sistema de arquivos raiz apenas |
| `df -i` | Uso de inodes (arquivos podem esgotar antes do espaço) |
| `du -sh pasta/` | Tamanho total de uma pasta (s = summary) |
| `du -h --max-depth=1 ~/` | Tamanho de cada subpasta do home (um nível) |
| `du -ah ~/lab/ | sort -h | tail` | Maiores arquivos de um diretório |
| `ncdu ~/` | Navegador interativo de uso de disco (se instalado) |

```terminal
$ df -h
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p2  233G  178G   42G  81% /
/dev/nvme0n1p1  511M  6.1M  505M   2% /boot/efi

$ du -sh ~/lab/
3.1G    /home/ana/lab/
```

O `df` mostra que a raiz tem 42 GB livres (19% livres) — saudável. O `du` revela que o diretório `~/lab/` pesa 3,1 GB. Para achar o que ocupa espaço, desça a árvore com `--max-depth=1` repetidamente.

:::dica
Para achar rapidamente os dez maiores arquivos de um diretório inteiro: `find ~/ -type f -size +100M -exec ls -lh {} \; | sort -k5 -h -r | head`. É a junção do `find` da seção de arquivos com ordenação por tamanho.
:::

## Montagem com `mount`, `umount` e `fstab`

Montar é anexar um sistema de arquivos à árvore de diretórios. O `/etc/fstab` define o que sobe no boot.

| Comando | O que faz |
|---|---|
| `mount` | Lista tudo que está montado |
| `mount /dev/sdb1 /mnt/usb` | Monta uma partição num ponto |
| `mount -o ro /dev/sdb1 /mnt/usb` | Monta em modo somente leitura |
| `umount /mnt/usb` | Desmonta pelo ponto de montagem |
| `umount /dev/sdb1` | Desmonta pelo dispositivo |
| `lsblk` | Lista discos e partições em árvore |
| `cat /etc/fstab` | Mostra as montagens do boot |

```terminal
$ lsblk
NAME        MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
nvme0n1     259:0    0   238G  0 disk
├─nvme0n1p1 259:1    0   511M  0 part /boot/efi
└─nvme0n1p2 259:2    0 237.5G  0 part /
```

O `lsblk` mostra o NVMe de 238 GB dividido em duas partições: a EFI (`/boot/efi`, 511 MB) e a raiz (`/`, o restante). É a primeira coisa a olhar antes de montar qualquer coisa manualmente — saber o nome do device real.

:::perigo
Desmontar (`umount`) um sistema de arquivos que está em uso causa perda de dados. Antes, feche programas que usem aquele ponto e verifique com `lsof +f -- /mnt/ponto` ou `mount` se ainda há processos referenciando-o. Montar sobre um diretório que já tem conteúdo **esconde** (não apaga) os arquivos originais até desmontar.
:::

## Diagnóstico rápido: "permission denied" e disco cheio

Dois sintomas concentram a maioria dos problemas desta seção, e cada um tem um comando de primeira linha.

```terminal
$ ./script.sh
bash: ./script.sh: Permissão negada

$ df -h /
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p2  233G  231G     0 100% /
```

No primeiro caso, a permissão de execução falta — `chmod u+x script.sh` resolve. No segundo, o disco está 100% cheio — o desktop inteiro começa a falhar, do navegador ao Steam. A sequência de resgate é: `df -h` para confirmar, `du -sh` para descer até o diretório guloso, e `flatpak uninstall --unused` (da primeira seção) ou limpeza de logs (`journalctl --vacuum-size`, da seção 5) para liberar.

:::atencao
Disco 100% não é só "sem espaço para salvar" — o systemd e vários serviços precisam gravar logs e arquivos temporários para funcionar. A sessão gráfica pode nem subir. Trate disco cheio como incidente de prioridade alta.
:::

## Resumo

- `chmod` altera permissões em modo simbólico (`u+x`) ou octal (`755`); `600` é o mínimo para chaves
- `chown -R usuario:grupo` troca dono e grupo recursivamente; `id` revela grupos e privilégios
- `df -h` mostra espaço por filesystem; `du -sh` mede o tamanho de uma pasta
- `lsblk` lista discos e partições; `mount`/`umount` anexam e soltam filesystems
- Disco cheio e "permissão negada" têm diagnósticos diretos com `df` e `chmod`

## Exercícios

1. Crie um arquivo, use `ls -l` para ler as permissões, e converta `644` para `600` com `chmod`. Depois reverta com `chmod 644`.
2. Tome um script e dê permissão de execução com `chmod u+x`. Teste a execução. Depois remova a permissão de escrita do grupo e explique o efeito.
3. Use `du -sh` no seu home e depois desça um nível com `--max-depth=1` para identificar a subpasta mais pesada.
4. Rode `df -h` e `df -i` e explique a diferença entre ficar sem espaço e ficar sem inodes.
5. **Desafio.** Crie um arquivo de teste de 200 MB, monte uma imagem de loop (`dd` + `mkfs.ext4` + `mount -o loop`), copie o arquivo para dentro, confira com `df -h`, desmonte e verifique com `lsblk` que a imagem some da árvore. Documente cada passo.