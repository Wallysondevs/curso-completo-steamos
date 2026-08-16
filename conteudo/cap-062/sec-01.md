O Steam Deck é um PC com formato de console, e nada impede que ele rode mais de um sistema operacional ao mesmo tempo no disco. Quem joga títulos incompatíveis com Proton, precisa de utilitários só do Windows ou quer experimentar outra distro Linux sem abrir mão do modo jogo, recorre ao **dual boot**: dois ou mais sistemas instalados lado a lado, escolhidos a cada ligada.

:::objetivos
- Diferenciar boot loader de boot manager e entender o papel de cada um
- Entender a cadeia de boot do Steam Deck, do firmware à partição ESP
- Identificar a ESP e as entradas de boot com `lsblk` e `efibootmgr`
- Reconhecer os limites do GRUB tradicional no Steam Deck
- Avaliar quando o dual boot vale a pena em vez de um disco externo
:::

## A cadeia de boot em poucas palavras

Ligar o Deck dispara uma sequência fixa de etapas. O **firmware UEFI** inicializa o hardware e procura uma partição especial chamada **ESP** (*EFI System Partition*), formatada em FAT32. Dentro dela estão os arquivos `.efi` — pequenos programas que fazem o sistema começar de fato.

Aqui entra uma distinção que evita metade da confusão do capítulo:

- **Boot loader** é o programa que *carrega* um sistema operacional. Recebe o controle, localiza o kernel, carrega a imagem na memória e a executa. O GRUB é o exemplo clássico.
- **Boot manager** é o programa que *escolhe* qual sistema carregar. Ele não inicia nada por conta própria; apenas apresenta um menu e passa o controle ao boot loader (ou ao kernel) escolhido. rEFInd e Clover são boot managers.

Na prática, o GRUB faz os dois papéis — é um boot manager com um boot loader embutido. rEFInd, ao contrário, é um boot manager puro: ao escolher uma opção, ele encontra o arquivo `.efi` (ou o kernel Linux) e o executa, sem carregar nada por si.

## A ESP no Steam Deck

O SteamOS usa um esquema de partições A/B. Dá para vê-lo com `lsblk`:

```terminal
$ lsblk -o NAME,SIZE,FSTYPE,LABEL,PARTLABEL /dev/nvme0n1
NAME             SIZE FSTYPE LABEL                PARTLABEL
nvme0n1        476.9G
├─nvme0n1p1       64M vfat                        esp
├─nvme0n1p2       32M                              efi-a
├─nvme0n1p3       32M                              efi-b
├─nvme0n1p4        5G ext4                        rootfs-a
├─nvme0n1p5        5G ext4                        rootfs-b
├─nvme0n1p6      256M                              var-a
├─nvme0n1p7      256M                              var-b
└─nvme0n1p8    465.5G ext4                        home
```

A partição `esp` é pequena (64 MB), formatada em `vfat` e guarda os `.efi` dos sistemas instalados. É nela que um boot manager como o rEFInd se instala. As partições `efi-a` e `efi-b` são do mecanismo de atualização atômica do SteamOS e não devem ser mexidas manualmente.

Para ver as entradas que o firmware conhece:

```terminal
$ efibootmgr
BootCurrent: 0000
Timeout: 2 seconds
BootOrder: 0000,0001,2001,2002,2003
Boot0000* SteamOS
Boot0001* Windows Boot Manager
Boot2001* EFI USB Device
```

Cada `BootNNNN` é uma entrada gravada na NVRAM do firmware, apontando para um `.efi` dentro da ESP. O `BootOrder` decide quem roda primeiro; o `Timeout` é quantos segundos o menu fica na tela antes de escolher sozinho.

## Por que o GRUB tradicional não é a melhor escolha

Em qualquer PC "normal", o GRUB resolve o dual boot: ele descobre os sistemas instalados, monta um menu e carrega o kernel de cada um. No Steam Deck, porém, há três pedras no caminho.

**O root é imutável.** O SteamOS monta a raiz como somente leitura (`steamos-readonly`), e o GRUB é instalado tipicamente dentro do sistema que ele inicia. Editar `/boot/grub/grub.cfg` exige desbloquear e remontar o sistema, que é revertido na próxima atualização.

```terminal
$ sudo touch /boot/grub/grub.cfg
touch: cannot touch '/boot/grub/grub.cfg': Read-only file system
```

O `touch` falha porque a partição raiz está montada somente leitura. Para um GRUB que precisa escrever esse arquivo a cada `update-grub`, isso é um obstáculo permanente — e é por isso que boot managers que vivem só na ESP, fora do root imutável, encaixam melhor.

**O layout A/B confunde o `os-prober`.** As duas cópias de root confundem a detecção automática de outros sistemas, e o script pode montar a partição errada.

**O tamanho da ESP.** Com 64 MB, a ESP do Deck é apertada para encaixar GRUB completo mais Windows e mais um boot manager — mas é de sobra para um boot manager puro, enxuto.

Por isso a comunidade converge para boot managers leves — rEFInd e Clover — que cabem na ESP, não mexem no root imutável e apresentam um menu visual com os sistemas disponíveis.

:::nota
O menu de boot do firmware do Deck fica escondido por padrão. Para acessá-lo, desligue o aparelho, segure **[[vol-]]** e toque no botão de **power**. Solte o `vol-` ao ouvir o *chime* e surgirá o *Boot Manager* do firmware, com as entradas gravadas na NVRAM. É a saída de emergência para testar um `.efi` de um pendrive sem mexer na configuração.
:::

## Quando o dual boot faz sentido

Antes de particionar o disco, vale pesar a alternativa mais simples: um **disco externo**. Um SSD NVMe em *case* USB-C, ou até um SD card, pode carregar um Windows ou um Bazzite sem tocar no disco interno — basta segurar `vol-` no boot e escolher o disco USB.

O dual boot no disco interno só compensa quando:

- você precisa do desempenho do NVMe interno (jogos antivetor, compilações);
- quer o segundo sistema sempre presente, sem depender de pendurar hardware;
- o uso é frequente o suficiente para justificar dividir o espaço.

Se o segundo sistema é de uso ocasional, o disco externo poupa a dor de cabeça de reparticionar — e de desfazer tudo depois, como veremos [na seção sobre desfazer dual boot](#/cap-062/sec-08).

:::dica
Nada obriga os dois sistemas a compartilharem o mesmo disco. Um dos setups mais limpos para o Deck é: SteamOS no NVMe interno, Windows ou Fedora num SSD externo, e o rEFInd instalado na ESP interna apontando para fora. Você ganha o menu bonito do rEFInd sem encolher o `home` do SteamOS.
:::

## Resumo

- Boot loader carrega o sistema; boot manager escolhe qual carregar. rEFInd e Clover são boot managers.
- O firmware UEFI lê os `.efi` da partição ESP, a `nvme0n1p1` (64 MB, FAT32) no Deck.
- `efibootmgr` mostra e altera as entradas de boot gravadas na NVRAM.
- O GRUB tradicional encaixa mal no SteamOS por causa do root imutável, do layout A/B e da ESP apertada.
- Disco externo carregável no boot é a alternativa mais simples ao dual boot interno.

## Exercícios

1. Rode `lsblk -o NAME,SIZE,FSTYPE,LABEL,PARTLABEL /dev/nvme0n1` e identifique na sua máquina as partições `esp`, `efi-a`, `efi-b` e `home`.
2. Execute `efibootmgr` e anote o `BootCurrent`, o `BootOrder` e o `Timeout` atuais da sua máquina.
3. Monte a ESP com `sudo mount /dev/nvme0n1p1 /mnt` e liste com `ls /mnt/EFI` quais sistemas já deixaram arquivos `.efi` ali. Desmonte com `sudo umount /mnt`.
4. Desligue o Deck e entre no menu de boot do firmware segurando **vol-** e ligando. Anote quais entradas aparecem além do SteamOS.
5. **Desafio.** Explique, com base no que viu em `efibootmgr` e na ESP montada, por que apagar o Windows do disco sem limpar a NVRAM deixa um "fantasma" no menu de boot — e proponha os dois comandos que resolveriam isso.
