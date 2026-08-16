O pendrive está pronto. Agora você precisa convencer o Steam Deck a usá-lo em vez do SSD interno — e o caminho para isso é um botão de volume que a maioria dos usuários só descobre quando o sistema para de ligar. A sequência é física: dedo no volume, dedo no power, um chime, um menu. Tudo acontece antes do SteamOS, antes do GRUB, antes de qualquer arquivo de configuração que um boot quebrado poderia corromper.

:::objetivos
- Executar a sequência de inicialização pelo Boot Manager do Deck
- Distinguir as entradas de boot e escolher o pendrive correto
- Diagnosticar por que o Deck às vezes "não vê" o pendrive
- Iniciar o ambiente de recovery e entender o tempo de carga
:::

## Volume (-) + Power: a porta de entrada

O Steam Deck tem um firmware UEFI que, como todo PC moderno, oferece um menu de boot acessível antes de qualquer sistema operacional. A combinação para chegar lá é:

1. **Desligue completamente** o Deck — não é suspender, é desligar. Segure o power por 10 segundos se o sistema estiver travado.
2. **Segure o botão de diminuir volume** (Volume Down, o de baixo, marcado com `-`).
3. **Pressione e solte o power** enquanto mantém o volume pressionado.
4. Quando ouvir o **chime** (som de inicialização), **solte os dois botões**.

```terminal
## Nenhum terminal aqui — isso acontece fora do sistema.
## A saída é o Boot Manager na tela do Deck.
```

A tela mostra um fundo escuro com uma lista de opções de boot. O controle do Deck funciona nesse menu: use o direcional para navegar, [[A]] para selecionar. O touchscreen também funciona.

:::dica
Se o Deck não desliga (tela congelada, sistema travado), mantenha o power pressionado por 10 a 15 segundos até a tela apagar completamente. Solte, aguarde dois segundos e recomece a sequência.
:::

## Lendo o Boot Manager

O menu lista dispositivos, não sistemas operacionais. Uma entrada típica do Boot Manager se parece com:

```terminal
Boot Manager
EFI USB Device (Kingston DataTraveler 3.0)
EFI Hard Drive (KINGSTON SNV2S1000G)
EFI SD/MMC Card
SteamOS (KINGSTON SNV2S1000G)
```

A entrada com `USB` no nome é seu pendrive. A entrada `SteamOS` é o SSD interno — **não selecione essa**, ou você vai simplesmente iniciar o sistema instalado (se ele ainda funcionar) e perder a viagem ao recovery.

:::atencao
Se o pendrive aparece duas vezes (ex.: `EFI USB Device` e `SteamOS (USB)`), escolha a que **não** contém "SteamOS" no nome. Selecionar `SteamOS (USB)` pode levar a um loop de instalação em que o Deck reinstala o sistema repetidamente, porque a imagem se confunde com uma instalação normal.
:::

Selecione a entrada USB com o direcional e pressione [[A]]. A tela escurece por alguns segundos e depois mostra o logo do Steam Deck em branco sobre fundo preto — sinal de que o kernel da imagem começou a carregar.

## Quando o pendrive não aparece

Há três causas comuns para o Boot Manager não listar o pendrive:

**Porta ou adaptador.** Pendrive USB-A num hub USB-C barato pode não ser reconhecido pelo firmware. Prefira pendrive USB-C direto ou um dock alimentado (como o da Valve). Conectores USB-C com mau contato também falham — experimente inverter o plug.

**Gravação incorreta.** Se a imagem foi gravada como arquivo (cópia simples) em vez de raw (`dd`), a tabela de partições não está no início do dispositivo e o firmware não identifica a partição EFI. Releia a seção 3 e regrave.

**Formato da partição EFI.** O firmware UEFI do Deck só reconhece partições FAT32 com o tipo correto de GUID (`C12A7328-F81F-11D2-BA4B-00A0C93EC93B`). Se a gravação truncou a imagem ou corrompeu o início, a EFI fica ilegível.

```terminal
$ sudo fdisk -l /dev/sda | grep -A2 "EFI"
/dev/sda2     1048576 2070527 1021952  499M ef EFI (FAT-12/16/32)
```

Se o tipo não for `ef` (EFI), o Deck não reconhece. Regrave a imagem.

## O que acontece durante a carga

Depois que você seleciona o pendrive, o firmware UEFI carrega o bootloader da partição EFI. Dali, o kernel Linux da imagem inicia e monta suas partições em memória. Esse processo, do chime ao desktop de recovery, leva de 2 a 10 minutos dependendo da velocidade do pendrive.

```terminal
## Durante a carga, você verá:
## 1. Logo do Steam Deck (1-3 min)
## 2. Cursor piscando no canto superior esquerdo (30 seg)
## 3. KDE Plasma carregando (1-2 min)
## 4. Área de trabalho de recovery com 4 ícones
```

Paciência é essencial. Um pendrive USB 2.0 pode ficar vários minutos na tela preta com cursor piscando — isso não é travamento, é o sistema lendo blocos lentamente. Se depois de 20 minutos nada mudou, aí sim desligue e revise a gravação.

:::info
O ambiente de recovery usa um servidor X11 com uma sessão KDE Plasma mínima. Isso significa que nem o modo jogo nem os drivers de GPU otimizados do SteamOS estão ativos — a tela pode piscar durante a transição do framebuffer para o Xorg, especialmente em Decks OLED.
:::

## Uma vez no desktop

Quando o KDE Plasma carregar, você verá uma área de trabalho com fundo azul escuro e quatro ícones dispostos verticalmente no canto esquerdo. Não há barra de tarefas, não há menu iniciar — só esses ícones. A interação nesse ambiente é por touchscreen; o controle não funciona aqui. Se seu Deck tem um dock com teclado e mouse, conecte antes de ligar — o ambiente de recovery reconhece USB.

```terminal
$ # O recovery monta o disco interno automaticamente?
$ lsblk
NAME        MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
sda           8:0    1  14.7G  0 disk 
├─sda1        8:1    1   511M  0 part 
├─sda2        8:2    1   499M  0 part 
└─sda3        8:3    1   8.3G  0 part /
nvme0n1     259:0    0 953.9G  0 disk 
├─nvme0n1p1 259:1    0    64M  0 part 
├─nvme0n1p2 259:2    0    32M  0 part 
...
```

Repare: o SSD interno (`nvme0n1`) aparece no `lsblk`, mas **não está montado**. O sistema de recovery detecta o disco, lê a tabela de partições, mas não monta nada automaticamente — cada ícone da área de trabalho decide o que montar e onde. Essa cautela evita que um sistema corrompido no disco interno tente executar código no ambiente de recovery.

## Resumo

- A sequência é Volume Down + Power, soltar ao ouvir o chime, e selecionar o USB no Boot Manager.
- O Boot Manager lista dispositivos: selecione a entrada USB que **não** contém "SteamOS" para evitar loop de instalação.
- Pendrive não aparece? Confira porta USB-C direta, regrave com `dd` e verifique se a partição EFI está com tipo correto.
- A carga leva de 2 a 10 minutos; USB 2.0 pode demorar vários minutos na tela preta — não é travamento.
- O desktop de recovery monta o SSD interno como dispositivo de bloco, mas não monta partições automaticamente.

## Exercícios

1. Desligue completamente o Deck e pratique a sequência Volume Down + Power. No Boot Manager, anote todas as entradas que aparecem.
2. Inicie pelo pendrive de recovery e meça o tempo entre pressionar [[A]] no Boot Manager e ver os quatro ícones na tela. O tempo combina com a velocidade do seu pendrive?
3. Se você tem outro pendrive ou microSD com sistema, conecte ambos e liste o Boot Manager de novo: quantas entradas USB aparecem? Como diferenciá-las?
4. Com o desktop de recovery carregado, abra o terminal (ícone "Terminal with repair tools") e execute `lsblk`. O SSD interno está listado? Suas partições estão montadas?
5. **Desafio.** Durante a carga do recovery, o kernel emite mensagens no framebuffer que somem quando o X11 assume. Reinicie com `loglevel=7` no kernel cmdline da imagem (edite a linha de boot pelo GRUB do recovery) e veja quantas mensagens de detecção de hardware o kernel emite antes do ambiente gráfico.