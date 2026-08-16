O SteamOS não é um Linux comum: parte do disco é travada para escrita e o que você instala de verdade mora em poucos lugares muito bem definidos. Antes de copiar qualquer arquivo, vale entender essa geografia — onde o sistema vive, onde os seus dados vivem e por que a raiz (`/`) aparece com tão pouca coisa. Esta seção desenha o mapa completo do disco de um Steam Deck.

:::objetivos
- Mapear a árvore de diretórios do padrão FHS no SteamOS
- Identificar quais partições o SteamOS cria em um disco novo
- Interpretar a saída de `lsblk`, `mount` e `df -h`
- Entender por que arquivos em `/` somem após uma atualização
:::

## O mapa geral segundo o FHS

O SteamOS segue o *Filesystem Hierarchy Standard* (FHS), a convenção que diz onde cada tipo de arquivo deve ficar em qualquer Linux. Conhecer os ramos principais evita que você procure um log no lugar errado ou tente escrever num diretório que o sistema simplesmente não deixa.

```text
/               raiz; no SteamOS 3.6 é read-only
├── /bin        binários essenciais (symlink para /usr/bin)
├── /etc        configurações do sistema
├── /usr        programas, bibliotecas e dados compartilhados
├── /var        arquivos mutáveis (logs, cache, filas)
├── /home       dados dos usuários (deck)
├── /tmp        arquivos temporários, apagados no boot
├── /opt        software empacotado fora do /usr
├── /boot       kernel e initramfs (ou ESP montada aqui)
└── /run        estado volátil em RAM (só em memória)
```

A diferença crucial do SteamOS é que a maior parte dessa árvore — `/usr`, `/bin`, `/etc`, `/sys` — faz parte de uma imagem imutável. Você consegue *ler* tudo, mas qualquer escrita em `/usr` ou `/etc` (fora de pontos específicos) é descartada ou bloqueada. Os lugares onde você de fato grava são poucos e ficam em partições separadas: `/home`, `/var` e a partição EFI.

## O disco físico visto com lsblk

O particionamento padrão de um Steam Deck de 64 GB (ou qualquer modelo, com tamanhos diferentes) tem uma cara bem específica. Use o `lsblk` para enxergar os *block devices* — discos e partições — aninhados em árvore:

```terminal
$ lsblk
NAME        MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
mmcblk0     179:0    0  59.7G  0 disk
├─mmcblk0p1 179:1    0    64M  0 part /esp
├─mmcblk0p2 179:2    0     2M  0 part
├─mmcblk0p3 179:3    0    32M  0 part /efi
├─mmcblk0p4 179:4    0     8G  0 part /
├─mmcblk0p5 179:5    0     8G  0 part
├─mmcblk0p6 179:6    0   256M  0 part /var
├─mmcblk0p7 179:7    0   256M  0 part
├─mmcblk0p8 179:8    0  43.2G  0 part /var/tmp, /var/log, /var/cache/pacman, /home
```

Note o padrão em pares: `/` (p4) tem um gêmeo vazio (p5), assim como `/var` (p6) tem o p7. São as partições **A/B**: o SteamOS guarda duas cópias do sistema e alterna entre elas a cada atualização. Só a partição *ativa* aparece em `MOUNTPOINTS`; a outra fica adormecida esperando o próximo update.

:::nota
O identificador `mmcblk0` (eMMC) aparece no Steam Deck por ele usar armazenamento embutido do tipo MultiMediaCard. Em um SSD NVMe, o nome seria algo como `nvme0n1`, mas a estrutura lógica das partições é idêntica.
:::

## O que está montado agora com mount

`lsblk` mostra o disco; `mount` mostra o ponto de vista do sistema de arquivos em uso — o que realmente está montado neste instante, com opções e origem de cada montagem:

```terminal
$ mount | grep -E '/dev/(mmcblk0|nvme)'
/dev/mmcblk0p4 on / type ext4 (ro,relatime)
/dev/mmcblk0p6 on /var type ext4 (rw,relatime)
/dev/mmcblk0p8 on /home type ext4 (rw,relatime)
devtmpfs on /dev type devtmpfs (rw,nosuid,noexec,relatime,size=...)
tmpfs on /tmp type tmpfs (rw,nosuid,nodev)
```

A opção `ro` (read-only) colada em `/` é a assinatura do root imutável. Compare com `rw` em `/var` e `/home`: é exatamente aí que o SteamOS autoriza escrita. Tudo o que vier montado como `tmpfs` ou `devtmpfs` existe só em RAM e some no desligamento.

## Espaço livre real com df -h

O `df` (disk free) responde a pergunta prática: quanto espaço sobra em cada ponto de montagem?

```terminal
$ df -h
Filesystem      Size  Used Avail Use% Mounted on
/dev/mmcblk0p4  8.0G  3.1G  4.6G  41% /
devtmpfs        5.8G     0  5.8G   0% /dev
/dev/mmcblk0p6  256M  118M  124M  48% /var
/dev/mmcblk0p8   43G   18G   24G  43% /home
tmpfs           5.8G   12M  5.8G   1% /tmp
```

A flag `-h` formata os tamanhos em unidades legíveis (G, M, K). Repare que `/home` e `/var` somam o grosso do espaço utilizável; `/` é pequeno e quase sempre fica perto de 40–60% de uso, porque a imagem do sistema tem tamanho quase fixo.

:::dica
`df -h` mostra espaço *por sistema de arquivos montado*, não por diretório. Para descobrir o tamanho de uma pasta específica dentro de `/home`, você vai usar `du` — que aparece na seção final deste capítulo.
:::

## Resumo

- O SteamOS segue o FHS, mas mantém a maior parte do sistema numa imagem imutável.
- Um disco padrão tem partições A/B para `/` e `/var`, além de `/home` e uma EFI dedicada.
- `lsblk` enxerga discos e partições em árvore; `mount` mostra o que está montado e com quais opções.
- O root `/` monta em modo `ro`, enquanto `/var` e `/home` montam em `rw`.
- `df -h` revela o espaço livre real por ponto de montagem.

## Exercícios

1. Rode `lsblk` e liste, em ordem, cada partição do seu disco com seu ponto de montagem. Quantos pares A/B o seu Steam Deck apresenta?
2. Execute `mount | grep -E 'on /( |var |home )'` e identifique, com base na opção `ro` ou `rw`, quais pontos aceitam escrita.
3. Compare a saída de `df -h /` com `df -h /home`. Que partição tem mais espaço disponível e por quê?
4. Descubra o nome do dispositivo do seu armazenamento (é `mmcblk0`, `nvme0n1` ou outro?) e explique a diferença entre eMMC e NVMe.
5. **Desafio.** Verifique se há uma partição pairada sem ponto de montagem com `lsblk -f`. Depois, proponha uma hipótese para o papel dessa partição baseado no que aprendeu sobre o esquema de atualização A/B.
