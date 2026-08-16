O Steam Deck é uma máquina de jogo, mas também é um computador cheio de dados que você não quer perder: saves de centenas de horas, configurações do Proton, bibliotecas do Steam e o próprio sistema. Como o SSD é a única peça de armazenamento interna, um defeito nele significa perder tudo de uma vez. Esta seção abre o capítulo mapeando o que existe dentro do disco, para que o backup faça sentido — você não clona às cegas, clona sabendo o que cada partição carrega.

:::objetivos
- Entender os riscos reais de não ter backup no Steam Deck
- Listar as partições do SSD e o papel de cada uma
- Distinguir o que é sistema, o que é dado de usuário e o que é regenerável
- Identificar o tamanho típico e o layout em SteamOS 3.6
- Escolher o que deve entrar obrigatoriamente no backup
:::

## Por que um SSD exige cuidado redobrado

Diferente de um disco mecânico, que costuma dar sinais antes de morrer (ruído, setores lentos), o SSD pode falhar de forma súbita. O controlador interno, responsável por mapear células de memória flash, pode simplesmente parar de responder — e aí nem `fsck` nem software de recuperação conseguem ler os dados.

Some a isso o fato de o Steam Deck usar um SSD em formato M.2 2230, trocável, mas pequeno. O sistema, os jogos e os saves dividem o mesmo espaço físico. Um erro de escrita durante uma atualização, um `dd` apontado para o disco errado, ou um defeito no chip transformam anos de progresso em nada em segundos.

:::perigo
Comandos de clonagem e restauração (`dd`, `partclone`, `Clonezilla`) escrevem direto no dispositivo, ignorando qualquer proteção de arquivo. Um único `of=/dev/` errado destrói o disco inteiro sem pedir confirmação. Neste capítulo inteiro, **confira o dispositivo antes de cada escrita** — a regra vale para todos os exemplos.
:::

## O layout do disco no SteamOS 3.6

O Steam Deck 3.6 usa um esquema de particionamento com oito partições por padrão. Vamos ver com o `lsblk`:

```terminal
$ lsblk -o NAME,SIZE,FSTYPE,LABEL,MOUNTPOINT /dev/nvme0n1
NAME        SIZE FSTYPE LABEL    MOUNTPOINT
nvme0n1   223.6G
├─nvme0n1p1   64M vfat   esp      /efi
├─nvme0n1p2   32M         efi-A
├─nvme0n1p3   32M         efi-B
├─nvme0n1p4    5G ext4   rootfs-A /
├─nvme0n1p5    5G ext4   rootfs-B
├─nvme0n1p6  256M ext4   var
├─nvme0n1p7  256M ext4   var-A
├─nvme0n1p8 207.1G ext4   home     /home
```

Aqui está o segredo do SteamOS: ele usa **partições A/B**. Existem duas cópias do firmware de boot (`efi-A`/`efi-B`) e duas do sistema (`rootfs-A`/`rootfs-B`). Só uma de cada fica ativa; a outra guarda a versão anterior, permitindo voltar quando uma atualização quebra algo. O `var` (dados variáveis do sistema, como logs e updates baixados) também tem sua contraparte.

## O que cada partição guarda

A tabela resume o papel e o tamanho de cada uma:

| Partição | Label | Conteúdo | Vale a pena no backup? |
|---|---|---|---|
| `p1` | `esp` | Carregador de boot EFI (systemd-boot) | Sim |
| `p2`/`p3` | `efi-A`/`efi-B` | Firmware de boot, duas gerações | Sim (ou regenerável) |
| `p4`/`p5` | `rootfs-A`/`rootfs-B` | Sistema raiz (read-only), duas gerações | Regenerável via reimagem |
| `p6` | `var` | Dados variáveis do sistema | Parcial |
| `p7` | `var-A` | Geração anterior do `var` | Não |
| `p8` | `home` | **Seus arquivos, saves, jogos, configs** | **Essencial** |

O ponto crítico é a partição `home` (`p8`): é ali que vivem seus saves locais, os jogos instalados e o diretório `~/.local/share/Steam`. A raiz `/` é read-only e pode ser reconstruída com a imagem de recuperação oficial da Valve — você não precisa fazer backup dela para recuperar o sistema. Mas o `home` é seu e só seu.

## O que é regenerável (e o que não é)

Antes de clonar tudo, vale separar o essencial do descartável:

- **Regenerável sem dor**: os jogos em si (basta reinstalar pelo Steam), shaders compilados, o próprio sistema (imagem oficial de recuperação). Perdê-los custa tempo, não dados.
- **Irrecuperável**: saves locais de jogos sem Steam Cloud, configurações manuais, arquivos pessoais, senhas e chaves, ROMs e patches de emulação que você organizou.
- **Custoso de reconstruir**: a partição `home` inteira com sua organização, os `compatdata` do Proton (pastas com prefixos Wine que guardam saves de jogos não-Steam).

A regra de ouro: **faça backup sempre do `home`**. Clonar o disco inteiro é mais simples e cobre tudo, mas custa mais espaço e tempo. As próximas seções exploram os dois caminhos.

## Medindo o que está em jogo

Antes de planejar qualquer backup, vale quantificar o tamanho do que você pretende preservar. O `du` mede o espaço ocupado por diretórios; o `df` mostra o que a partição inteira contém:

```terminal
$ du -sh ~/.local/share/Steam/userdata/ ~/.local/share/Steam/steamapps/compatdata/
1.2G    /home/deck/.local/share/Steam/userdata/
38G     /home/deck/.local/share/Steam/steamapps/compatdata/
$ df -h /home /var
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p8  207G  145G   62G  70% /home
/dev/nvme0n1p6  256M   89M  167M  35% /var
```

Repare na ordem de grandeza: os `compatdata` (prefixos Proton com saves de jogos Windows) somam 38 GB — um dado real, irrecuperável, que some sem rastro se o disco falhar. `du` e `df` medem coisas levemente diferentes (`du` conta os dados; `df` conta o uso do sistema de arquivos), mas juntos dão a fotografia do que você precisa proteger.

## Checando a saúde do disco

Antes de confiar cegamente no SSD, é prudente olhar os contadores SMART, que registram a vida útil estimada e erros de mídia. O Deck expõe isso através do `smartctl` (pacote `smartmontools`):

```terminal
$ sudo smartctl -a /dev/nvme0n1 | grep -E 'Percentage Used|Media Errors|Data Units'
Percentage Used:                    3%
Media and Data Integrity Errors:    0
Data Units Read:                    14.2 TB
Data Units Written:                 9.7 TB
```

O campo `Percentage Used` mostra o desgaste da memória flash — num disco novo é 0% e vai subindo com os anos. `Media and Data Integrity Errors` diferente de zero é sinal de alerta: disco começando a falhar pede backup imediato e troca programada.

:::dica
Instale as ferramentas de inspeção com `sudo steamos-readonly disable && sudo pacman -S smartmontools parted gptfdisk` e reative depois com `sudo steamos-readonly enable`. Elas também serão úteis nas seções de clonagem e restauração.
:::

## Resumo

- O SSD pode falhar sem aviso, e o Deck concentra sistema, jogos e saves num único disco.
- O SteamOS 3.6 usa partições A/B para sistema, firmware e `var`, permitindo rollback.
- A partição crítica para backup é o `home` (`p8`), onde ficam saves, jogos e configurações.
- Sistema e jogos são regeneráveis; saves e dados pessoais não são.
- `dd`, `partclone` e `Clonezilla` escrevem direto no dispositivo — confira sempre o alvo.

## Exercícios

1. Rode `lsblk -o NAME,SIZE,FSTYPE,LABEL,MOUNTPOINT /dev/nvme0n1` no seu Deck e identifique as oito partições e seus labels.
2. Liste os jogos que você tem com saves exclusivamente locais (sem Steam Cloud) usando o cliente Steam.
3. Estime o tamanho do seu `home` com `du -sh ~` e compare com o tamanho total do SSD.
4. Identifique, dentro de `~/.local/share/Steam/steamapps/compatdata/`, quais pastas correspondem a jogos não-Steam que você instalou manualmente.
5. **Desafio.** Monte a partição `home` em modo somente-leitura num diretório (`mkdir -p /tmp/ver && sudo mount -o ro /dev/nvme0n1p8 /tmp/ver`), vasculhe sua estrutura e anote os três caminhos que você mais quer preservar num desastre.
