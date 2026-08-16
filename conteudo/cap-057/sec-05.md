Montar um disco manualmente resolve o problema na hora, mas no próximo boot a montagem desaparece — você teria que repetir o `mount` toda vez que ligar o Deck. Para discos que ficam permanentemente conectados (como um hub USB-C com SSD), a solução é o arquivo `/etc/fstab`, onde você declara quais discos devem ser montados automaticamente na inicialização. Esta seção ensina a escrever entradas de fstab seguras, testá-las antes de reiniciar e evitar o erro que trava o boot.

:::objetivos
- Entender a estrutura de uma linha do `/etc/fstab`
- Escrever entradas de fstab usando UUID como identificador
- Testar entradas com `mount -a` antes de reiniciar
- Evitar que um disco ausente impeça o boot com as opções `nofail` e `noauto`
- Recarregar a configuração do systemd após editar fstab
:::

## A anatomia de uma linha do fstab

O arquivo `/etc/fstab` (de *file system table*) é lido pelo systemd durante o boot. Cada linha descreve uma montagem com seis campos separados por espaços ou tabs:

```text
# <dispositivo>  <ponto>  <tipo>  <opções>  <dump>  <fsck>
```

Exemplo real:

```text
UUID=B2F4-1A08  /mnt/dados  exfat  defaults,nofail,uid=1000,gid=1000,noatime  0  0
```

| Campo | Significado |
|---|---|
| `UUID=B2F4-1A08` | O que montar — UUID, PARTUUID, LABEL ou caminho `/dev/` |
| `/mnt/dados` | Ponto de montagem (diretório precisa existir) |
| `exfat` | Tipo do sistema de arquivos (ou `auto` para detecção) |
| `defaults,nofail,...` | Opções de montagem, separadas por vírgula sem espaço |
| `0` (dump) | Backup com `dump` — quase sempre 0 hoje em dia |
| `0` (fsck) | Ordem de verificação no boot: 0 = não verifica, 1 = raiz, 2 = os demais |

As opções depois de `defaults` refinam o comportamento. `defaults` é um atalho para `rw,suid,dev,exec,auto,nouser,async`. Acrescentar `nofail` é a prática mais importante: se o disco não estiver presente, o boot continua normalmente em vez de travar.

## O UUID como âncora

Usar `/dev/sda1` no fstab é pedir para ter problema: conecte um pendrive extra e a ordem dos discos muda, e o que era `sda` vira `sdb`. O UUID resolve isso de vez:

```terminal
$ sudo blkid /dev/sda1
/dev/sda1: LABEL="DADOS" UUID="B2F4-1A08" TYPE="exfat"
```

A entrada no fstab fica:

```text
UUID=B2F4-1A08  /mnt/dados  exfat  defaults,nofail  0  0
```

Para discos exFAT ou FAT, o SteamOS atribui dono na montagem — você vai querer `uid=1000` (seu usuário, que no Deck é o `deck` com UID 1000) e `gid=1000` para poder ler e escrever:

```text
UUID=B2F4-1A08  /mnt/dados  exfat  defaults,nofail,uid=1000,gid=1000,noatime  0  0
```

## Testando antes de reiniciar

Editar o fstab e reiniciar sem testar é roleta russa — um erro de sintaxe ou um UUID errado e o boot pode cair numa shell de emergência. O comando `mount -a` monta tudo o que está no fstab e ainda não está montado, e é o teste canônico:

```terminal
$ sudo vim /etc/fstab
## ... edita e salva ...
$ sudo mount -a
## Se não houver saída, deu certo
$ mountpoint /mnt/dados
/mnt/dados is a mountpoint
$ ls /mnt/dados
artigos/   fotos/   notas.txt   videos/
```

Se houver erro de digitação, `mount -a` reclama na hora — e você corrige antes de reiniciar:

```terminal
$ sudo mount -a
mount: /mnt/dados: special device UUID=B2F4-1A0X does not exist.
```

Para desmontar o que o `mount -a` montou (sem afetar outras montagens):

```terminal
$ sudo umount /mnt/dados
```

:::atencao
Depois de editar o fstab, o systemd pode precisar de um aviso. Execute `sudo systemctl daemon-reload` para que ele releia as unidades de montagem geradas a partir do fstab. Sem isso, algumas opções (como dependências entre montagens) podem não ser respeitadas até o próximo boot.
:::

## nofail: o boot não pode depender do seu SSD externo

Sem `nofail`, o systemd espera que todo disco listado no fstab esteja presente na inicialização. Se o SSD USB-C estiver desconectado, o boot trava por 90 segundos e depois cai numa shell de emergência. Com `nofail`:

```text
UUID=B2F4-1A08  /mnt/dados  exfat  defaults,nofail,uid=1000,gid=1000  0  0
```

O disco será montado se estiver presente e será silenciosamente ignorado se não estiver. Para discos removíveis, `nofail` é quase sempre a escolha certa. A exceção é quando o disco contém algo crítico para o sistema (como `/var` ou `/home` em setups avançados), mas isso não se aplica a discos externos de dados.

:::info
A combinação `noauto` faz o oposto de `auto`: o disco **não** é montado no boot, mas você pode montá-lo depois manualmente com um simples `mount /mnt/dados` (porque o fstab fornece todos os parâmetros). Isso é útil para discos que você conecta e desconecta com frequência e quer controle explícito sobre quando montar.
:::

## Um fstab completo de exemplo

```terminal
$ cat /etc/fstab
# <file system>                             <mount point>  <type>  <options>                                              <dump> <pass>
UUID=3f2b91ac-77de-4c15-9f0e-4a2d1c8b5e71  /              ext4    defaults,noatime                                        0      1
UUID=B2F4-1A08                               /mnt/dados     exfat  defaults,nofail,uid=1000,gid=1000,noatime,dmask=0022  0      0
UUID=8a7b3c91-dd4e-4f12-a01b-5c3e9f2d6a11  /mnt/backup    ext4   defaults,nofail,noatime                                 0      2
```

A partição raiz (`/`) nunca leva `nofail` — sem ela o sistema não funciona. As partições de dados (`/mnt/dados`, `/mnt/backup`) levam `nofail` porque o sistema deve continuar funcionando mesmo sem esses discos.

## Resumo

- Cada linha do fstab tem 6 campos: dispositivo, ponto de montagem, tipo, opções, dump e fsck.
- Use `UUID=` como identificador; nunca confie em `/dev/sdX`, que muda entre boots.
- `defaults` expande para `rw,suid,dev,exec,auto,nouser,async` e serve como base para acrescentar opções.
- `nofail` impede que um disco ausente trave o boot; é obrigatório para discos removíveis.
- `mount -a` testa o fstab sem reiniciar; `systemctl daemon-reload` avisa o systemd das mudanças.
- `noauto` faz o disco não montar no boot, mas permite montá-lo depois com um `mount` curto.

## Exercícios

1. Identifique o UUID de um disco conectado com `blkid`. Escreva uma entrada de fstab para ele usando UUID e a opção `nofail`. Teste com `mount -a`.
2. Edite o fstab e introduza um erro de propósito (um UUID inexistente). Rode `mount -a` e veja a mensagem de erro. Corrija e teste de novo.
3. Adicione a opção `noauto` a uma entrada do fstab e reinicie. O disco foi montado? Agora monte-o apenas com `sudo mount /mnt/<ponto>` — repare que você não precisou digitar o dispositivo.
4. Crie uma entrada de fstab que monte um disco em `/mnt/leitura` como somente leitura (`ro`), sem execução de binários (`noexec`). Monte com `mount -a`, tente criar um arquivo e veja o erro.
5. **Desafio.** Configure duas entradas de fstab: uma para o disco físico e outra para montar uma imagem ISO via loopback (`mount -o loop`). Use a opção `x-systemd.requires=` para garantir que o ponto de montagem do diretório-pai exista antes de o loopback tentar montar. Teste com `mount -a`.