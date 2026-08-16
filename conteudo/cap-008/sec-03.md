Cada atualização segura do SteamOS esconde uma estrutura de disco que pouca gente vê: o sistema operacional não mora numa única partição, mas em duas — A e B. Enquanto uma delas roda o jogo que você está jogando, a outra fica quieta, esperando receber a próxima versão. Entender esse esquema é a chave para entender por que atualizar o Steam Deck raramente dá errado de forma irreversível.

:::objetivos
- Compreender o conceito de atualização atômica com partições A/B
- Identificar as partições do esquema A/B em disco com `lsblk`
- Entender o papel separado das partições de sistema e da partição de dados (`var`)
- Enxergar o que está montado em `/` e `/var` com `df -h`
:::

## Duas cópias do sistema, uma só dos seus dados

Imagine dois "sistemas operacionais" idênticos instalados lado a lado no mesmo disco, mas visíveis como um só. É exatamente isso que o SteamOS faz. O disco tem dois conjuntos de partições:

- **rootfs-A e rootfs-B**: as duas imagens do sistema (raiz `/`).
- **var-A e var-B**: duas áreas que guardam dados que mudam (`/var`, onde ficam logs, cache de atualização, estado do flatpak etc.).

Quando o sistema está rodando, apenas **uma** dessas duplas está ativa: ou o par A ou o par B. A outra dupla está montada de forma mínima ou nem montada, aguardando a próxima atualização.

A graça do esquema está no que aparece **fora** dessas duplas: a partição de dados do usuário (`/home`), que é **única** e não é duplicada. Seus jogos, saves, capturas de tela e configurações não ficam na partição A nem na B — ficam na sua própria partição, que sobrevive intacta a qualquer atualização e a qualquer troca entre A e B.

## Vendo o layout com lsblk

O comando `lsblk` ("list block devices") desenha a árvore de discos e partições. No Steam Deck, a saída revela o esquema A/B de imediato:

```terminal
$ lsblk
NAME        MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
nvme0n1     259:0    0   476.9G  0 disk
├─nvme0n1p1 259:1    0      64M  0 part
├─nvme0n1p2 259:2    0      32M  0 part /efi
├─nvme0n1p3 259:3    0       5G  0 part /
├─nvme0n1p4 259:4    0       5G  0 part /var
├─nvme0n1p5 259:5    0       5G  0 part
├─nvme0n1p6 259:6    0       5G  0 part
├─nvme0n1p7 259:7    0     256M  0 part /efs
├─nvme0n1p8 259:8    0   456.4G  0 part /home
```

Repare na coluna `MOUNTPOINTS`: as partições 3 e 4 estão montadas em `/` e `/var` — elas são o par **ativo** (neste exemplo, o "A"). As partições 5 e 6, com o mesmo tamanho de 5G mas **sem** ponto de montagem, são o par inativo ("B"), esperando a próxima atualização.

Nem sempre o `lsblk` usa os nomes literais `rootfs-A` e `rootfs-B`. Dependendo da versão e do hardware, a Valve pode usar números de partição (`p3`, `p4`, `p5`, `p6`) em vez de rótulos. O que nunca muda é a **forma**: dois blocos de sistema (~5G cada) e dois blocos de `var` (~5G cada), um par montado e outro par apagado. É dessa simetria que vem a robustez.

Em algumas imagens, pedir explicitamente o rótulo da partição revela os nomes canônicos do esquema:

```terminal
$ lsblk -o NAME,SIZE,PARTLABEL,MOUNTPOINTS
NAME        SIZE PARTLABEL       MOUNTPOINTS
nvme0n1p3     5G rootfs-A        /
nvme0n1p4     5G var-A           /var
nvme0n1p5     5G rootfs-B
nvme0n1p6     5G var-B
nvme0n1p8 456.4G home            /home
```

A coluna `PARTLABEL` entrega os nomes do esquema A/B sem ambiguidade: `rootfs-A`, `var-A`, `rootfs-B`, `var-B`. O `home` aparece sozinho, confirmando que seus dados não são duplicados. Quando os rótulos existem, essa é a forma mais direta de responder "onde está cada coisa"; quando não existem, você cai na interpretação por simetria de tamanhos da saída anterior.

:::nota
O tamanho de 5G por partição de sistema pode variar entre versões do SteamOS; em alguns builds é menor. O que importa não é o número exato, e sim a presença de **dois** conjuntos espelhados. Seu disco pode até usar rótulos amigáveis como `rootfs-A`, `rootfs-B`, `var-A`, `var-B` dependendo do particionamento.
:::

## O que está montado em / e /var

O `df -h` mostra uso de espaço dos sistemas de arquivos montados. Ele complementa o `lsblk` ao confirmar qual par está ativo **agora**:

```terminal
$ df -h
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p3  4.9G  4.1G  716M  86% /
/dev/nvme0n1p8  456G  287G  169G  63% /home
/dev/nvme0n1p4  4.9G  2.2G  2.6G  46% /var
```

Aqui, `/` vem da partição 3 (`p3`) e `/var` da partição 4 (`p4`) — a dupla A. A partição 8 (`p8`, com seus 456G) é o seu `/home`, que não participa do esquema A/B. A porcentagem `Use%` de `/` perto de 86% é normal num sistema imutável: a imagem preenche quase toda a partição dedicada a ela, e você não tem como (nem deve) liberar espaço ali escrevendo arquivos.

## Por que a atualização é atômica

"Atômica" vem de "átomo", que historicamente significava "indivisível". Uma operação atômica é aquela que não tem estado intermediário: ou acontece por inteiro, ou não acontece. A atualização do SteamOS é atômica porque:

1. Ela escreve a imagem nova **na partição inativa**, nunca por cima da ativa.
2. Só depois de a escrita terminar e a assinatura ser verificada, a partição inativa é marcada como "a próxima a iniciar".
3. A troca efetiva acontece num único instante, no boot.

Se a energia cair durante o download, nada muda: a partição ativa continua rodando o sistema anterior. Se cair durante a escrita, a partição inativa fica com a imagem incompleta — e simplesmente não é usada, porque nunca chegou a ser marcada como confiável. Não existe o "sistema pela metade" que aflige quem atualiza por pacotes.

É a mesma ideia por trás das atualizações de firmware de celulares e de sistemas embarcados. A Valve pegou esse padrão da indústria e aplicou a um Linux de uso geral.

:::atencao
O esquema A/B protege o **sistema**. Ele não protege, por si só, os dados em `/home`. Um bug de jogo ou uma falha de disco ainda pode corromper saves. O A/B resolve o problema de "o SO quebrou e não liga mais"; backup de saves continua sendo responsabilidade sua (ou do Steam Cloud).
:::

## Resumo

- O SteamOS mantém duas cópias do sistema (raiz e `/var`), chamadas de partições A e B.
- Apenas um par (A ou B) está montado e ativo a cada instante; o outro fica parado, pronto para a atualização.
- `/home` é uma partição única, fora do esquema A/B, e preserva jogos e saves entre atualizações.
- `lsblk` exibe a árvore de partições; `df -h` mostra qual par está montado em `/` e `/var` agora.
- Atualização atômica escreve na partição inativa e só troca no boot, eliminando o "sistema pela metade".

## Exercícios

1. Rode `lsblk` e identifique as partições de sistema. Quantas partições de ~5G existem, e quantas estão montadas?
2. Execute `df -h` e anote qual partição está montada em `/` e qual em `/var`. Compare com a saída do `lsblk` — os números batem?
3. Descubra qual par (A ou B) está ativo na sua máquina. Você está no par `p3/p4` ou `p5/p6`?
4. Verifique o espaço usado em `/` com `df -h /`. Por que o `Use%` fica alto mesmo sem você gravar nada lá?
5. **Desafio.** Relacione o esquema A/B com o capítulo sobre imutabilidade (`steamos-readonly`). Se a raiz é somente leitura e a atualização nunca toca a partição ativa, explique o que aconteceria com a partição inativa se você pedisse uma atualização **duas vezes** seguidas sem reiniciar entre elas. A segunda sobrescreveria a primeira? Por quê?