Muitos discos externos chegam ao Steam Deck já formatados em NTFS ou exFAT, porque vieram de um PC Windows ou foram comprados assim de fábrica. Esses dois sistemas de arquivos não têm um conceito nativo de dono e permissões à la Unix, o que cria uma camada de fricção: quem pode escrever, quais bits aparecem no `ls -l`, e por que às vezes o disco monta "somente leitura" sem aviso. Esta seção explica como o SteamOS traduz NTFS e exFAT para o modelo de permissões do Linux — e como contornar as armadilhas.

:::objetivos
- Entender por que NTFS e exFAT não têm permissões Unix nativas
- Ajustar dono e permissões na montagem com `uid`, `gid`, `umask`, `fmask` e `dmask`
- Usar o driver `ntfs-3g` e conhecer as opções específicas dele
- Diagnosticar discos NTFS montados como "somente leitura" por causa do fast startup do Windows
- Formatar um disco NTFS/exFAT com permissões previsíveis no SteamOS
:::

## Por que NTFS e exFAT são diferentes

ext4 e Btrfs guardam, para cada arquivo, um UID (dono), um GID (grupo) e um trio de bits de permissão. NTFS e exFAT foram desenhados para o Windows, onde o conceito de permissão é outro (ACLs no NTFS; praticamente nenhum no exFAT). Quando o Linux monta um desses discos, precisa **inventar** um dono e uma máscara de permissões, porque o disco não tem como armazená-los de verdade.

O kernel resolve isso na hora da montagem: você (ou o udisks2) informa "todos os arquivos deste disco pertencem ao UID 1000, com permissões 755 para diretórios e 644 para arquivos". O que você vê no `ls -l` é essa máscara aplicada uniformemente:

```terminal
$ ls -l /mnt/windows/
total 0
drwxr-xr-x 1 ana ana 32768 Jan 12 14:02 Documentos/
-rwxr-xr-x 1 ana ana   512 Jan 12 14:02 notas.txt
```

Repare que **todos** os arquivos pertencem a `ana`, independentemente de quem os criou no Windows. O dono verdadeiro, quem quer que fosse no Windows, foi descartado — ou melhor, nunca existiu no sentido Unix.

## As opções uid, gid e umask

As três opções que controlam essa tradução são:

| Opção | O que faz |
|---|---|
| `uid=<n>` | Define o dono de todos os arquivos (ex.: `uid=1000` para o usuário `deck`) |
| `gid=<n>` | Define o grupo de todos os arquivos |
| `umask=<octal>` | Máscara invertida aplicada a todos os arquivos e diretórios |
| `fmask=<octal>` | Máscara só para arquivos (arquivo) |
| `dmask=<octal>` | Máscara só para diretórios |

A `umask` funciona de trás para frente: ela **remove** bits. Um `umask=022` remove a escrita do grupo e de outros, dando o clássico `755` para diretórios e `644` para arquivos — o valor que o udisks2 usa por padrão para discos removíveis.

Montando manualmente com dono correto:

```terminal
$ sudo mount -t exfat -o uid=1000,gid=1000,umask=022 /dev/sda1 /mnt/dados
```

:::atencao
Para discos exFAT e FAT, o kernel aceita `uid`, `gid`, `umask`, `fmask` e `dmask` como opções nativas. O valor de UID do usuário principal do SteamOS é `1000`, mas confirme o seu com `id -u deck` ou `echo $UID` — assumir errado pode deixar o disco inacessível.
:::

## NTFS: ntfs-3g e o driver do kernel

O Linux tem dois caminhos para montar NTFS:

- **`ntfs3`** — driver dentro do kernel principal (a partir do 5.15), rápido e com suporte básico a permissões via opções `uid`/`gid`/`umask`.
- **`ntfs-3g`** — driver em userspace (FUSE), maduro, com suporte a escrita, journaling e opções avançadas como `windows_names` e `big_writes`.

No SteamOS 3.6 o kernel traz o `ntfs3`. Para montar com ele:

```terminal
$ sudo mount -t ntfs3 -o uid=1000,gid=1000,umask=022 /dev/sdb1 /mnt/windows
```

Para usar explicitamente o `ntfs-3g` (que é o que o Flatpak e algumas ferramentas esperam):

```terminal
$ sudo mount -t ntfs-3g -o uid=1000,gid=1000,umask=022 /dev/sdb1 /mnt/windows
```

O `ntfs-3g` aceita uma opção extra do mundo Windows, `windows_names`, que impede a criação de arquivos com caracteres inválidos no Windows (`: * ? " < > |`). Útil se o disco circula entre os dois sistemas:

```terminal
$ sudo mount -t ntfs-3g -o uid=1000,gid=1000,windows_names /dev/sdb1 /mnt/windows
```

## A maldição do fast startup do Windows

O Windows tem um recurso chamado **Fast Startup** que, em vez de desligar de verdade, hiberna o kernel para acelerar o próximo boot. Quando você desconecta um disco NTFS de um Windows com Fast Startup ligado, o sistema de arquivos fica marcado como "limpo, mas em hibernação" — o que, para o Linux, se traduz em risco de corrupção. O kernel se recusa a montar para escrita:

```terminal
$ sudo mount -t ntfs3 /dev/sdb1 /mnt/windows
mount: /mnt/windows: cannot mount /dev/sdb1 read-write, is read-only.
## ou
$ sudo mount -t ntfs-3g /dev/sdb1 /mnt/windows
The disk contains an unclean file system (0, 0).
Metadata kept in Windows cache, refused to mount.
Failed to mount '/dev/sdb1': Operation not permitted
The NTFS partition is in an unsafe state. Please resume and shutdown Windows fully.
```

A mensagem é clara: o NTFS está num "estado inseguro". Duas saídas:

1. **A correta**: conecte o disco num Windows, desligue o Fast Startup, e desligue o Windows por completo.
2. **A emergencial**: force a montagem assumindo o risco com `ntfsfix`, que limpa o flag de sujeira:

```terminal
$ sudo ntfsfix /dev/sdb1
Mounting volume... OK
Processing of $MFT and $MFTMirr completed successfully.
Checking the alternate boot sector... OK
NTFS volume version is 3.1.
NTFS partition /dev/sdb1 was processed successfully.
```

Depois monte normalmente. O `ntfsfix` **não** repara o sistema de arquivos por completo — para uma checagem verdadeira, o `chkdsk` do Windows é a ferramenta apropriada.

:::perigo
Forçar a montagem de um NTFS marcado como sujo pode corromper dados. Se o disco tem arquivos importantes, não force — leve ao Windows e desligue o Fast Startup corretamente antes de usá-lo no Deck.
:::

## Resultado no ls -l e a pergunta "por que é sempre igual?"

Depois de montado com `uid=1000,gid=1000,umask=022`, todo diretório mostra permissão `755` e todo arquivo, `644`, dono `deck`. Isso significa que você pode ler e escrever, mas também que **qualquer** usuário da máquina poderá ler — a `umask=022` deixa os bits de leitura para "outros". Se o disco for privado, use `umask=077`, que dá `700`/`600` e restringe tudo ao dono:

```terminal
$ sudo mount -t exfat -o uid=1000,gid=1000,umask=077 /dev/sda1 /mnt/privado
```

## Resumo

- NTFS e exFAT não armazenam permissões Unix; o Linux inventa dono e máscara na montagem.
- `uid`, `gid`, `umask`, `fmask` e `dmask` controlam essa tradução para discos exFAT/FAT.
- O SteamOS pode montar NTFS via driver de kernel `ntfs3` ou via `ntfs-3g` (FUSE).
- O Fast Startup do Windows marca o NTFS como sujo e o Linux recusa a montagem em escrita.
- `ntfsfix` limpa o flag de sujeira para emergências, mas não substitui o `chkdsk` do Windows.
- `umask=022` permite leitura de todos; `umask=077` restringe o disco ao dono.

## Exercícios

1. Monte um disco exFAT com `uid`, `gid` e `umask` explícitos. Verifique com `ls -l` que todos os arquivos têm o mesmo dono e as mesmas permissões.
2. Monte o mesmo disco exFAT com `umask=077` e compare as permissões no `ls -l` com o caso anterior. O que mudou nos bits de grupo e de outros?
3. Se tiver um disco NTFS, monte-o com `ntfs-3g` e a opção `windows_names`. Tente criar um arquivo chamado `teste:1.txt` — o que acontece?
4. Verifique o driver NTFS disponível no seu kernel com `cat /proc/filesystems | grep -i ntfs`. Quantos drivers NTFS aparecem? Monte uma vez com `-t ntfs3` e outra com `-t ntfs-3g` e compare a velocidade de listagem de um diretório grande.
5. **Desafio.** Pesquise as opções `big_writes`, `noatime` e `nls` do `ntfs-3g`. Monte um disco NTFS com combinação delas, depois confira as opções efetivamente aplicadas em `/proc/mounts` e explique o que cada uma faz.