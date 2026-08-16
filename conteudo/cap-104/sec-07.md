O limite mais concreto de um Steam Deck não é o processador nem a memória: é o armazenamento. Com bibliotecas de jogos que passam de 100 GB, o espaço do SSD interno (ou do SD card) é um recurso que exige gestão ativa. Saber descobrir o que ocupa cada gigabyte — e o que pode ser removido sem dor — é um hábito que transforma a pergunta angustiante "qual jogo eu apago?" em decisões informadas.

:::objetivos
- Mapear o uso de disco do sistema inteiro e por diretório
- Usar `ncdu` para navegação interativa e `du` para relatórios precisos
- Identificar os maiores consumidores típicos no Steam Deck
- Entender formatos de partição e pontos de montagem de mídia removível
- Planejar a realocação de dados entre SSD interno e SD card
:::

## O mapa do disco, em camadas

Antes de apagar qualquer coisa, você precisa do mapa. O `df -h` dá a visão macro (quanto cada partição usa); o `du` revela a culpabilidade (quem, dentro de uma pasta, está comendo o espaço).

```terminal
$ df -h
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p4  456G  402G   31G  93% /
/dev/nvme0n1p1  511M   38M  474M   8% /boot
/dev/mmcblk0p1  477G  120G  357G  25% /run/media/deck/sdcard
```

O disco interno (`nvme0n1p4`) está em 93% — crítico. O SD card (`mmcblk0p1`) tem 357 GB livres. A solução provável não é apagar, e sim realocar dados para o cartão. Mas antes de decidir o que move, você precisa saber o que ocupa o SSD.

```terminal
$ du -sh ~/* ~/.* 2>/dev/null | sort -h | tail -8
8.9G	/home/deck/Documents
12G	/home/deck/.local/share/Steam/steamapps/compatdata
18G	/home/deck/.local/share/Steam/steamapps/shadercache
34G	/home/deck/.local/share/Steam/steamapps/common
188G	/home/deck/.local/share/Steam/steamapps/steamapps
```

O `du -sh` soma o tamanho de cada caminho, o `sort -h` ordena por tamanho humano (reconhecendo G > M > K), e o `tail -8` mostra só os maiores. Em uma olhada, fica claro que a pasta Steam concentra quase tudo.

## ncdu: navegação interativa sobre o disco

Quando o `du` não é suficiente para achar o que ocupa espaço, o `ncdu` (NCurses Disk Usage) oferece uma interface interativa para percorrer diretórios. Ele varre uma pasta, ordena por tamanho e deixa você entrar e sair com as setas do teclado.

```terminal
$ ncdu ~/.local/share/Steam/steamapps
--- /home/deck/.local/share/Steam/steamapps ----------
  188.0 GiB [##########]  steamapps
   34.1 GiB [##        ] /common
   18.2 GiB [#         ] /shadercache
   12.0 GiB [#         ] /compatdata
    0.9 GiB [          ] /workshop
    0.3 GiB [          ]  libraryfolders.vdf
```

Dentro do `ncdu`, as teclas mais úteis: setas para navegar, `Enter` para entrar, `d` para apagar uma entrada, `g` para alternar entre porcentagem e barras, e `q` para sair. É uma ferramenta essencial para a limpeza seletiva da seção 3.

:::dica
O `ncdu` pode não estar instalado por padrão no SteamOS. Instale com `sudo pacman -S ncdu` (lembrando de desativar o modo somente-leitura antes e reativar depois). Alternativa sempre presente: `du -ah /caminho | sort -h | tail -20`, que lista os 20 maiores arquivos individuais, não só diretórios.
:::

## Os vilões típicos do armazenamento no Deck

A experiência mostra que, no Steam Deck, quatro coisas concentram a esmagadora maioria do espaço, sempre na mesma ordem:

**1. A pasta `common`** — os jogos em si. Cada jogo instalado fica em `steamapps/common/<AppID>/`, e o tamanho varia de centenas de MB a mais de 100 GB (jogos AAA). É o único item que você remove com dor — porque ali está o que você joga.

**2. O `shadercache`** — shaders pré-compilados. Ocupa em média 10 a 20% do tamanho dos jogos instalados, e como visto na seção 3, deixa órfãos quando jogos são desinstalados.

**3. A `compatdata`** — os prefixos Wine/Proton. Cada jogo compatível tem sua própria "garrafa" que pode chegar a vários GB, e que também deixa órfãos.

**4. O `workshop`** — mods baixados da Steam Workshop, que o Steam nem sempre remove quando você desinstala o jogo base.

```terminal
$ du -sh ~/.local/share/Steam/steamapps/workshop/content/*
1.2G	/home/deck/.local/share/Steam/steamapps/workshop/content/431960
436M	/home/deck/.local/share/Steam/steamapps/workshop/content/123456
```

O `workshop/content/<AppID>` segue a mesma lógica de AppID dos outros: cruze com os jogos instalados para achar mods órfãos.

## Formatos, partições e pontos de montagem

Para realocar dados com segurança, você precisa entender a anatomia do armazenamento. O comando `lsblk` mostra os discos, partições e pontos de montagem de forma hierárquica:

```terminal
$ lsblk -f
NAME        FSTYPE FSVER LABEL      UUID                                 FSAVAIL FSUSE% MOUNTPOINTS
nvme0n1                                                                                 
├─nvme0n1p1 vfat   FAT32 EFI        1A2B-3C4D                             473.7M     7% /boot
├─nvme0n1p2 ext4   1.0   rootfs     e2f1b4a7-...                            30G    93% /
└─nvme0n1p4 btrfs         home      3f2b91ac-...
mmcblk0                                                                                 
└─mmcblk0p1 ext4   1.0   sdcard     a1b2c3d4-...                           357G    25% /run/media/deck/sdcard
```

Cada linha revela: o nome do dispositivo (`nvme0n1` = SSD NVMe interno, `mmcblk0` = SD card), o sistema de arquivos (`vfat` para o boot EFI, `ext4` ou `btrfs` para os dados), e o ponto de montagem. Saber qual partição abriga o quê é pré-requisito para mover dados.

O sistema de arquivos importa para o tipo de mídia. O SSD interno usa `btrfs` (que habilita snapshots e compressão); um SD card formatado em `ext4` é rápido para Linux puro, mas `exFAT` é necessário se você quiser lê-lo no Windows também. Mídia removível não monta em local fixo — o `mount` automático do SteamOS usa `/run/media/deck/<label>`, como visto na seção 2.

## Planejando a realocação

Com o mapa em mãos, a decisão de "o que mover para o SD card" é uma troca explícita entre velocidade e espaço. O SSD interno é muito mais rápido que o SD card (NVMe vs. flash de cartão). Jogos que dependem de carregamento rápido (texturas grandes, streaming de mundo aberto) ficam no SSD; jogos leves ou antigos podem ir para o cartão sem perda perceptível.

O Steam gerencia tudo isso pela interface: **Configurações → Armazenamento** permite criar uma biblioteca no SD card e mover jogos entre unidades. Pelo terminal, equivale a mexer em `steamapps/libraryfolders.vdf` e mover as pastas com `mv` + link simbólico (técnica da seção 2).

```terminal
$ grep -i path ~/.local/share/Steam/steamapps/libraryfolders.vdf
  "path"		"/home/deck/.local/share/Steam"
  "path"		"/run/media/deck/sdcard/SteamLibrary"
```

Ver duas bibliotecas listadas — uma no SSD, outra no SD card — é o estado saudável de um Deck com biblioteca grande. O hábito de revisar esse arquivo periodicamente, junto ao `df -h`, mantém a realocação sempre sob seu controle.

## Resumo

- O `df -h` mostra a ocupação por partição; o `du -sh ... | sort -h` revela quais diretórios são culpados.
- `ncdu` oferece navegação interativa por tamanho, essencial para limpeza seletiva.
- No Deck, `common`, `shadercache`, `compatdata` e `workshop` concentram o espaço na pasta Steam.
- `lsblk -f` mostra discos, partições, sistemas de arquivos e pontos de montagem.
- SSD interno (NVMe) é rápido; SD card é mais lento — jogue os jogos pesados no SSD, os leves no cartão.
- Realocação via Steam (ou `mv` + link simbólico) transforma espaço livre em decisão estratégica, não em remorso.

## Exercícios

1. Rode `df -h` e `lsblk -f` e descreva, em prosa, quantos dispositivos de armazenamento seu Deck tem, em que formato cada um está e quanto de espaço livre há em cada um.
2. Use `du -sh ~/* ~/.* 2>/dev/null | sort -h | tail -10` para listar os dez maiores itens do seu home. Aponte os três que poderiam ser reduzidos.
3. Se `ncdu` estiver instalado, navegue até `steamapps` e encontre os três maiores subdiretórios. Se não, use `du` e `sort` para o mesmo resultado.
4. Cruze `workshop/content` com os jogos instalados e identifique mods órfãos (AppID sem `appmanifest`). Anote quanto espaço eles ocupam.
5. **Desafio.** Crie uma segunda biblioteca Steam no SD card (via interface ou editando `libraryfolders.vdf` com cuidado) e mova um jogo leve para lá. Meça com `df -h` o antes e o depois no SSD interno, e tente abrir o jogo a partir do cartão para confirmar que funciona.