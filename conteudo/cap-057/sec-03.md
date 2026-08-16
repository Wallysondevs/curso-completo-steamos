Saber inspecionar discos é o primeiro passo — mas é montando e desmontando manualmente que você adquire o reflexo de resolver problemas quando a montagem automática falha, ou quando precisa acessar um disco que o KDE não reconheceu. Os comandos `mount` e `umount` são as ferramentas manuais para essas situações. Esta seção cobre a sintaxe, as opções essenciais e o que fazer quando o disco se recusa a desmontar.

:::objetivos
- Montar uma partição manualmente em um diretório qualquer
- Usar opções de montagem comuns: `ro`, `noexec`, `noatime`, `sync`
- Desmontar com segurança usando `umount`
- Diagnosticar por que um disco está ocupado e forçar desmontagem
- Verificar pontos de montagem ativos e comparar com o `/proc/mounts`
:::

## O comando mount

Na sua forma mais simples, `mount` recebe dois argumentos: o dispositivo e a pasta de destino:

```terminal
$ sudo mkdir -p /mnt/backup
$ sudo mount /dev/sda1 /mnt/backup
$ ls /mnt/backup
artigos/   fotos/   notas.txt   videos/
```

O kernel detecta o sistema de arquivos automaticamente — você não precisa dizer que é exFAT ou ext4; o `mount` testa os sistemas de arquivos disponíveis e acerta sozinho na maioria dos casos. Se quiser forçar um tipo específico, use `-t`:

```terminal
$ sudo mount -t ntfs /dev/sdb1 /mnt/windows
```

Para ver tudo o que está montado naquele instante, execute `mount` sem argumentos:

```terminal
$ mount | head -7
proc on /proc type proc (rw,nosuid,nodev,noexec,relatime)
sysfs on /sys type sysfs (rw,nosuid,nodev,noexec,relatime)
/dev/nvme0n1p3 on /home type ext4 (rw,relatime)
/dev/nvme0n1p1 on /esp type ext4 (rw,relatime)
/dev/sda1 on /mnt/backup type exfat (rw,nosuid,nodev,noexec,noatime,fmask=0022,dmask=0022,uid=1000,gid=1000)
```

Cada linha mostra o dispositivo, o ponto de montagem, o tipo de sistema de arquivos e as opções ativas entre parênteses. As opções contam a história de como o disco foi montado: `rw` (leitura e escrita), `nosuid`, `nodev`, `noexec` são típicas de discos removíveis. As opções `uid=1000` e `gid=1000` aparecem quando o sistema monta discos exFAT ou FAT — sem dono nativo, o kernel atribui tudo a um usuário para que o disco seja utilizável.

## Opções de montagem que você usa de verdade

Nem todas as opções de montagem são relevantes no dia a dia. As que você vai encontrar ou usar deliberadamente são estas:

| Opção | Efeito |
|---|---|
| `ro` | Monta como somente leitura; nenhuma gravação é permitida |
| `rw` | Monta como leitura e escrita (padrão) |
| `noexec` | Impede execução de binários a partir desse disco |
| `nosuid` | Ignora bits SUID/SGID; essencial para discos removíveis |
| `noatime` | Não atualiza o timestamp de acesso dos arquivos, reduzindo desgaste em flash |
| `sync` | Gravações são feitas de forma síncrona (mais seguro, mais lento; bom para pendrives) |
| `async` | Gravações em buffer (padrão, mais rápido, risco de perda se desconectar sem desmontar) |
| `exec` | Permite execução de binários (padrão, mas removido em discos montados por udisks) |

```terminal
$ sudo mount -o ro,noexec,nosuid /dev/sdc1 /mnt/leitura
```

:::atencao
A opção `sync` escreve cada alteração imediatamente no disco, sem buffer. Em pendrives baratos isso pode ser desejável (você tira o pendrive e os dados já estão lá), mas em SSDs USB-C rápidos penaliza demais o desempenho. Prefira `async` e **sempre desmonte antes de desconectar** — assunto da última seção.
:::

## Desmontando com umount

Desmontar não é arrancar o disco da porta. O comando `umount` (sem "n" no meio) avisa ao kernel que deve finalizar escritas pendentes, esvaziar caches e liberar o disco:

```terminal
$ sudo umount /mnt/backup
```

Você pode passar tanto o ponto de montagem quanto o dispositivo:

```terminal
$ sudo umount /dev/sda1
## ou
$ sudo umount /mnt/backup
```

O comando `mountpoint` confirma se uma pasta é um ponto de montagem ativo:

```terminal
$ mountpoint /mnt/backup
/mnt/backup is a mountpoint
$ mountpoint /mnt/vazia
/mnt/vazia is not a mountpoint
```

## O problema clássico: dispositivo ocupado

Quando o `umount` reclama de "target is busy", algum processo está usando o disco:

```terminal
$ sudo umount /mnt/backup
umount: /mnt/backup: target is busy.
```

O `lsof` (ou o mais leve `fuser`) revela quem está segurando o disco:

```terminal
$ sudo fuser -mv /mnt/backup/
                     USER        PID ACCESS COMMAND
/mnt/backup:         ana        3412 f.c.. bash
                     ana        3510 f.c.. vim
```

Os processos de `ana` — um `bash` e um `vim` — têm arquivos abertos ou o diretório de trabalho dentro do disco. Para matá-los de uma vez e liberar o disco:

```terminal
$ sudo fuser -km /mnt/backup/
```

A opção `-k` envia SIGKILL para todos eles. Se preferir não matar processos, feche os programas manualmente nas outras abas do terminal e tente `umount` de novo.

Quando nem o `fuser` resolve, existe o `umount -l` (*lazy unmount*): ele desacopla o ponto de montagem imediatamente, e o kernel só libera o disco de verdade quando o último processo soltar a referência:

```terminal
$ sudo umount -l /mnt/teimoso
```

:::perigo
`umount -l` é uma faca afiada: o ponto de montagem some, processos que continuam escrevendo podem perder dados, e você não recebe nenhum erro. Use só quando já fechou tudo e o disco continua ocupado — e faça um `sync` antes.
:::

## /proc/mounts vs. /etc/mtab

Dois arquivos descrevem o que está montado, mas com origens diferentes:

```terminal
$ diff /proc/mounts /etc/mtab
## Normalmente idênticos, ou com pequenas diferenças em namespaces
```

`/proc/mounts` é a visão do kernel — verdade absoluta, gerada em tempo real. `/etc/mtab` é mantido pelo `mount` em userspace e pode ficar dessincronizado se você usar `mount` com namespaces. Para scripts e diagnósticos, sempre confie em `/proc/mounts`.

## Resumo

- `mount <dispositivo> <pasta>` monta uma partição; o tipo de sistema de arquivos é detectado automaticamente.
- Opções como `ro`, `noexec`, `nosuid`, `noatime` e `sync` controlam como o disco se comporta após montado.
- `umount <pasta>` desmonta; `mountpoint` confirma se a pasta é um ponto de montagem ativo.
- "Target is busy" significa que um processo ainda usa o disco; `fuser -mv` descobre qual.
- `umount -l` desmonta preguiçosamente — prático, mas arriscado se houver escritas pendentes.
- `/proc/mounts` é a fonte canônica do kernel sobre o que está montado.

## Exercícios

1. Monte um pendrive manualmente em `/mnt/meupendrive` usando `mount` com detecção automática. Confirme com `mountpoint`.
2. Monte o mesmo pendrive agora especificando o tipo de sistema de arquivos com `-t`. Compare as opções de montagem que aparecem em `/proc/mounts` para essa montagem.
3. Monte um pendrive com `-o ro` e tente criar um arquivo nele. Que mensagem de erro aparece?
4. Com o pendrive montado, abra um segundo terminal e entre no diretório do pendrive com `cd`. No primeiro terminal, tente `umount` e veja o erro. Use `fuser` para descobrir qual processo está segurando o disco. Feche-o e desmonte com sucesso.
5. **Desafio.** Monte um pendrive com a opção `sync` e copie um arquivo de 100 MB para ele medindo o tempo com `time`. Repita com `async`. Qual a diferença de tempo e por quê? (Use `dd` para gerar o arquivo de teste: `dd if=/dev/zero of=/tmp/teste bs=1M count=100`.)