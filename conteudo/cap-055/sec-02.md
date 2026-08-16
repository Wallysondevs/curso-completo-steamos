A característica mais comentada do SteamOS — e a que mais confunde quem vem de distribuições comuns — é o root imutável. Você pode até editar um arquivo em `/etc` e vê-lo mudar na hora, mas a mudança é descartada na próxima atualização. Entender o mecanismo por trás disso muda a forma como você instala software e mantém a máquina.

:::objetivos
- Entender o modelo de atualização atômica por partições A/B
- Identificar quais diretórios sobrevivem entre atualizações
- Testar a natureza read-only do root na prática
- Contornar a imutabilidade do modo correto
:::

## Por que congelar o /usr e o /etc

Numa distribuição tradicional, o `apt` ou o `pacman` escrevem arquivos em `/usr`, `/lib` e `/etc` a cada pacote instalado. Isso funciona, mas tem um custo: qualquer pacote malicioso ou bug pode corromper o sistema aos poucos, e uma atualização interrompida no meio deixa a máquina num estado inconsistente.

O SteamOS escolheu o caminho oposto. O sistema operacional é empacotado como uma **imagem completa e autocontida**, e as atualizações substituem a imagem inteira de uma vez — ou nada é alterado, ou tudo é alterado. Não existe estado "meio atualizado". Essa é a essência da atualização *atômica*.

Na prática, o SteamOS usa duas partições geminadas (o par A/B que você viu em `lsblk` na seção anterior). Enquanto o sistema roda na partição A, a atualização é gravada inteira na partição B; no reboot, um flag troca e o sistema passa a iniciar a partir da B. Se algo der errado, basta voltar para a A.

## Testando a imutabilidade com as próprias mãos

O jeito mais rápido de sentir o root imutável é tentar escrever nele. Crie um arquivo em `/usr` e veja o que acontece:

```terminal
$ touch /usr/teste.txt
touch: cannot touch '/usr/teste.txt': Read-only file system
```

O erro "Read-only file system" é a mensagem clássica. Mas repare que a imutabilidade não é uniforme: alguns arquivos em `/etc` parecem aceitáveis à escrita por meio de exceções. Tente listar os sistemas de arquivos em modo leitura:

```terminal
$ mount | grep ' on / '
/dev/mmcblk0p4 on / type ext4 (ro,relatime)
```

A opção `ro` está gravada no *montador*, não no disco. Isso é importante: se você desmontar e remontar o root com `rw`, consegue escrever temporariamente — mas a imagem será sobrescrita na próxima atualização atômica, então a mudança não persiste de verdade.

## O que sobrevive e o que é descartado

A regra de ouro do SteamOS é simples: **tudo que fica nas partições separadas sobrevive; tudo que fica dentro da imagem do sistema não**. Isso inclui:

| Local | Sobrevive à atualização? |
|---|---|
| `/home/deck` | Sim (partição própria) |
| `/var` (logs, cache) | Sim (partição própria) |
| `/usr`, `/bin`, `/lib` | Não (imagem do sistema) |
| `/etc` | Não (imagem do sistema) |
| `/opt` | Não (imagem do sistema) |
| `/boot` / `/esp` / `/efi` | Sim (partição própria) |

É por isso que instalar um pacote com `pacman` ou `apt` diretamente no root não funciona de forma durável no SteamOS: o pacote gravado em `/usr` desaparece no próximo update do sistema. O jeito aprovado de instalar software é via **Flatpak** (que grava em `/home` e `/var/lib/flatpak`) ou pelo próprio Steam, nunca tocando no `/usr`.

:::atencao
Não use `pacman -S` pensando em instalar algo permanente. No SteamOS 3.6, o root é uma imagem gerenciada pelo SteamOS, e qualquer pacote que você adicionar ao `/usr` será varrido na próxima atualização. Para ferramentas extras, prefira um container, um overlay ou o modo Flatpak.
:::

## Desbloqueando a escrita com steamos-readonly

O SteamOS oferece um utilitário próprio para alternar a proteção do root quando você precisa de fato mexer (por exemplo, para uma manutenção pontual):

```terminal
$ sudo steamos-readonly disable
$ sudo mount -o remount,rw /
```

Depois de remontar em `rw`, o root aceita escrita até que você reverta:

```terminal
$ sudo steamos-readonly enable
$ sudo mount -o remount,ro /
```

Em versões anteriores (`steamos-readonly` no SteamOS 3.4 e 3.5), o comando era o preferido para liberar o sistema. Nas mais recentes, a forma muda ligeiramente, mas a ideia é a mesma: o bloqueio é deliberado e reversível, e não um defeito.

:::perigo
Desbloquear o root e modificar `/usr` ou `/etc` invalida a atualização atômica limpa e pode deixar a partição B dessincronizada. Só faça isso se souber exatamente o que está removendo ou consertando, e volte para `ro` assim que terminar.
:::

## Resumo

- O SteamOS atualiza por partições A/B: a nova imagem é gravada inteira e ativada no reboot.
- O root monta em `ro`; qualquer escrita direta em `/usr` ou `/etc` falha com "Read-only file system".
- `/home` e `/var` vivem em partições próprias e sobrevivem às atualizações.
- Software permanente deve ser instalado via Flatpak ou Steam, nunca via `pacman` no root.
- `steamos-readonly disable/enable` alterna a proteção para manutenção pontual.

## Exercícios

1. Rode `touch /usr/foo` e registre a mensagem de erro exata. Depois repita o teste em `/home/deck/foo` e em `/var/foo` e explique a diferença.
2. Use `mount | grep ' on / '` para confirmar a opção `ro`. Que outra coluna confirma que se trata da imagem do sistema?
3. Liste três diretórios que sobrevivem à atualização e três que não, com base na tabela desta seção.
4. Tente `df -h /usr` e depois `df -h /home`. Por que `/usr` aparece sem uma entrada própria no `df`?
5. **Desafio.** Explique, em uma frase, por que um jogo instalado pelo Steam continua presente após uma atualização do SteamOS, enquanto um binário copiado manualmente para `/usr/bin` desaparce.
