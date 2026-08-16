Quando você conecta um SSD USB-C ou um pendrive no Steam Deck, nada de mágico acontece por baixo dos panos: o kernel detecta o hardware, atribui um nome em `/dev`, e algum processo precisa "pendurar" o sistema de arquivos desse disco numa pasta do sistema para que os arquivos fiquem acessíveis. Esse pendurar tem nome técnico — **montar** — e a pasta onde o disco aparece é o **ponto de montagem**. Entender esses dois conceitos é o alicerce de tudo o que vem depois neste capítulo, da montagem manual até o `fstab` e as permissões do Flatpak.

:::objetivos
- Entender a diferença entre dispositivo de bloco, partição e sistema de arquivos
- Reconhecer o papel do diretório `/dev` e do esquema de nomes dos discos
- Explicar o que é um ponto de montagem e como a árvore única de diretórios funciona
- Ler a hierarquia de discos, partições e montagens com `lsblk`
- Localizar onde discos externos aparecem depois de montados
:::

## Discos são dispositivos de bloco

No Linux, quase tudo é representado como um arquivo. Um disco rígido, um SSD ou um pendrive aparecem como **dispositivos de bloco**: arquivos especiais dentro de `/dev` que, em vez de guardar texto, representam acesso direto ao hardware. "De bloco" porque você lê e grava neles em pedaços de tamanho fixo (os blocos), não byte a byte como num arquivo de texto.

```terminal
$ ls -l /dev/sd*
brw-rw---- 1 root disk 8,  0 Jan 12 14:02 /dev/sda
brw-rw---- 1 root disk 8, 16 Jan 12 14:02 /dev/sdb
brw-rw---- 1 root disk 8, 17 Jan 12 14:02 /dev/sdb1
```

Repare no `b` no começo da linha: é isso que diz "dispositivo de bloco". O disco inteiro é `/dev/sdb`, e as partições dentro dele são `/dev/sdb1`, `/dev/sdb2` e assim por diante. No Steam Deck, o SSD interno NVMe costuma aparecer como `/dev/nvme0n1`, e um disco externo USB-C como `/dev/sda` ou `/dev/sdb`.

:::nota
O nome do dispositivo depende da ordem em que o kernel detecta o hardware. `/dev/sda` não é "o primeiro disco que você comprou" — pode mudar entre um boot e outro conforme a ordem de detecção. É exatamente por isso que, mais adiante, usamos identificadores estáveis como UUID em vez de nomes de `/dev`.
:::

## Partições separam, o sistema de arquivos organiza

Um disco novo é um vazio de blocos numerados. Para ele guardar arquivos, dois passos são necessários: primeiro **particionar** (dividir o disco em uma ou mais regiões), depois **formatar** (criar um sistema de arquivos em cada partição). O sistema de arquivos é quem transforma blocos brutos em diretórios, nomes, permissões e donos — a estrutura que comandos como `ls` e `cp` conseguem navegar.

Um disco pode ter uma partição única ou várias, cada uma com seu próprio sistema de arquivos. No Steam Deck, ao conectar um disco externo formatado como exFAT ou NTFS, você normalmente encontra uma única partição ocupando o disco inteiro.

## A árvore única de diretórios

No Linux não existe "unidade C:" ou "unidade D:" como no Windows. Existe **uma** árvore de diretórios começando na raiz `/`, e todos os discos são pendurados em algum galho dela. O disco interno que contém o sistema está montado na raiz; discos extras aparecem em pastas como `/run/media/` ou `/mnt/`.

```terminal
$ lsblk
NAME        MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
nvme0n1     259:0    0 953.9G  0 disk
├─nvme0n1p1 259:1    0   260M  0 part /esp
├─nvme0n1p2 259:2    0    64M  0 part /efi
└─nvme0n1p3 259:3    0 953.6G  0 part /home
sda          8:0    0 476.9G  0 disk
└─sda1       8:16   0 476.9G  0 part /run/media/ana/DADOS
```

A coluna `MOUNTPOINTS` conta a história: as partições do SSD interno aparecem em `/esp`, `/efi` e `/home`; a partição do disco externo `/dev/sda1` está pendurada em `/run/media/ana/DADOS`. Quando você navega até essa pasta, está na verdade lendo o disco externo, como se ele fosse só mais um diretório.

## Onde os discos externos aparecem

O SteamOS, por ser baseado em Arch/Ubuntu e usar a área de trabalho KDE Plasma, monta discos removíveis automaticamente num caminho previsível. O padrão costuma seguir o esquema `/run/media/<usuário>/<rótulo>`:

```terminal
$ ls /run/media/ana/
DADOS   BACKUP   SANDBISK
```

Cada subpasta é o rótulo (label) de um disco conectado. Se o disco não tiver rótulo, o sistema usa o UUID ou um identificador genérico no lugar. Você também é livre para montar qualquer disco em qualquer pasta vazia que criar — montagem manual é assunto da próxima seção.

:::dica
Para criar seu próprio ponto de montagem, basta um diretório comum: `sudo mkdir -p /mnt/meudisco`. O diretório precisa existir e estar vazio; se já contiver arquivos, eles ficam "escondidos" enquanto o disco estiver montado por cima.
:::

## Resumo

- Dispositivos de bloco em `/dev` representam discos e pendrives; partições ganham sufixos numéricos como `sda1`.
- Particionar divide o disco; formatar cria o sistema de arquivos que organiza arquivos e diretórios.
- O Linux tem uma árvore única de diretórios; montar é pendurar um disco numa pasta (ponto de montagem).
- `lsblk` mostra a hierarquia disco → partição → ponto de montagem em uma olhada.
- No SteamOS, discos removíveis aparecem normalmente em `/run/media/<usuário>/<rótulo>`.
- Nomes de `/dev` podem mudar entre boots; identificadores estáveis (UUID) são preferidos.

## Exercícios

1. Conecte um pendrive e rode `lsblk`. Identifique, na saída, qual é o disco inteiro e qual é a partição, e anote o ponto de montagem que o SteamOS escolheu.
2. Liste o conteúdo de `/dev` filtrando por dispositivos de disco com `ls -l /dev/ | grep -E '^(b)'`. Quantos dispositivos de bloco aparecem na sua máquina?
3. Use `lsblk -f` para ver, além dos pontos de montagem, o sistema de arquivos de cada partição. Qual sistema de arquivos seu pendrive usa?
4. Crie um ponto de montagem vazio em `/mnt/teste` e confirme com `ls -la` que ele está vazio. (Ainda não vamos montar nada — isso fica para a próxima seção.)
5. **Desafio.** Observe a saída de `lsblk` duas vezes: com e sem o disco externo conectado. Explique por que o nome `/dev/sdX` do disco externo pode não ser o mesmo entre os dois momentos, e qual campo de `lsblk` você usaria para confirmar que é o mesmo disco físico.
