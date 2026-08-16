O Steam Deck roda um kernel Linux com código fechado da AMD, controladores de ventoinha customizados da Valve e patches de escalonamento que não existem em nenhuma outra distribuição. Esse kernel tem nome: **linux-neptune**. Ele não é o kernel genérico que você encontraria num Ubuntu — é uma árvore mantida pela Valve especificamente para o hardware do Deck, e conhecê-la é o primeiro passo antes de pensar em trocar ou estender qualquer coisa.

:::objetivos
- Identificar o kernel linux-neptune e suas diferenças para o mainline
- Consultar a versão, os patches e a árvore de origem do kernel em execução
- Entender os patches customizados da Valve: AMD SFH, Steam Deck HID e Steam Controller
- Localizar a árvore pública do linux-neptune e navegar pelos branches
- Saber quando um patch da Valve chega ao mainline e o que isso muda
:::

## O que torna o linux-neptune especial

O linux-neptune é um fork do kernel Linux mantido pela Valve em `https://gitlab.com/evlaV/linux-integration`. A cada nova versão do SteamOS, a Valve sincroniza esse fork com uma release estável do kernel mainline e aplica uma pilha de patches que ainda não foram aceitos upstream:

```terminal
$ uname -r
6.5.0-valve3-1-neptune-61
$ cat /proc/version
Linux version 6.5.0-valve3-1-neptune-61 (deck@steamos-build) (gcc (GCC) 13.2.0, GNU ld (GNU Binutils) 2.41) #1 SMP PREEMPT_DYNAMIC Mon, 15 Jan 2025 14:30:00 +0000
```

A string `6.5.0-valve3-1-neptune-61` revela que este kernel é baseado no 6.5 mainline, com três revisões da Valve (`valve3`), uma iteração de compilação (`-1`) e o contador de build `-61`. O sufixo `-neptune` é exclusivo do SteamOS — você não encontra em Arch, Ubuntu, Fedora ou Debian.

Os patches principais incluem:

| Patch | Função |
|---|---|
| AMD SFH (Sensor Fusion Hub) | Drivers para o giroscópio e acelerômetro do Deck |
| Steam Deck HID | Mapeamento dos controles: botões, touchpads, sticks analógicos |
| Steam Controller via USB | Suporte ao controle quando conectado por fio |
| Quirk de áudio ACP | Correções para o codec de áudio AMD Van Gogh |
| Curva de ventoinha | Driver `steamdeck-fan` com controle térmico customizado |
| PCIe ASPM para o Wi-Fi | Economia de energia na interface PCIe do chip Wi-Fi |

## Como a Valve empacota e distribui

No SteamOS 3.6 (baseado em Arch), o kernel é distribuído como um pacote `linux-neptune`. A atualização segue o ritmo do sistema imutável: a cada release do SteamOS, um novo kernel é compilado, assinado e enviado junto com a imagem do sistema. Isso significa que você **não** recebe atualizações de kernel isoladas — elas sempre vêm casadas com uma nova versão completa do SteamOS.

```terminal
$ pacman -Qi linux-neptune | head -12
Name            : linux-neptune
Version         : 6.5.0.valve3-1
Description     : The Linux Neptune kernel and modules for SteamOS
Architecture    : x86_64
URL             : https://gitlab.com/evlaV/linux-integration
Licenses        : GPL2
Provides        : linux
Depends On      : coreutils  linux-firmware  mkinitcpio
Required By     : steamdeck-dkms  jupiter-fan-control
Install Date    : Tue 14 Jan 2025 09:22:41 AM -03
```

O pacote `linux-neptune` entrega três arquivos para o `/boot`: a imagem do kernel (`vmlinuz-linux-neptune`), o initramfs (`initramfs-linux-neptune.img`) e o mapa de símbolos (`System.map-linux-neptune`). Além disso, os headers (`linux-neptune-headers`) são um pacote separado, necessário para compilar módulos com DKMS.

:::info
O SteamOS não usa o kernel `linux` padrão do Arch (`linux` ou `linux-lts`). Se você instalar o pacote `linux` genérico, ele será colocado ao lado do neptune, mas o GRUB continua apontando para o neptune como padrão. Trocar o kernel padrão exige editar a configuração do bootloader.
:::

## Onde o código vive e como inspecionar patches

A árvore pública está em `https://gitlab.com/evlaV/linux-integration`. O branch principal (`linux-6.5.y`) contém o kernel estável mais os patches da Valve aplicados como commits individuais — é possível ler cada um com `git log`. Para saber exatamente o que a Valve modificou em relação ao mainline:

```bash
git clone https://gitlab.com/evlaV/linux-integration.git
cd linux-integration
git log --oneline v6.5..valve/linux-6.5.y -- drivers/hid/ drivers/platform/x86/
```

No próprio Steam Deck, sem clonar o repositório, você pode inspecionar os módulos carregados que são específicos do hardware:

```terminal
$ lsmod | grep -E 'steam|neptune|jupiter'
steamdeck_fan         16384  0
jupiter_button        20480  0
steamdeck_hid         28672  0
steamdeck_gyro        16384  0
$ modinfo steamdeck_hid
filename:       /lib/modules/6.5.0-valve3-1-neptune-61/kernel/drivers/hid/steamdeck-hid.ko.xz
description:    Steam Deck HID driver
author:         Valve Corporation
license:        GPL
depends:        hid
name:           steamdeck_hid
```

A presença desses módulos com autor "Valve Corporation" é a assinatura digital do linux-neptune. Nenhum kernel genérico os inclui — se você trocar de kernel, esses módulos param de carregar, e o giroscópio, os botões extras e a ventoinha deixam de funcionar.

## Resumo

- O linux-neptune é um fork do kernel Linux mantido pela Valve com patches para o hardware específico do Steam Deck.
- A string `6.5.0-valve3-1-neptune-61` identifica a base mainline (6.5), as revisões da Valve (`valve3`) e o build (`-61`).
- Os patches cobrem giroscópio, controles, áudio, ventoinha e gerenciamento de energia do chip Wi-Fi.
- O kernel é distribuído como pacote `linux-neptune` no SteamOS, atualizado apenas junto com releases completas do sistema.
- O código-fonte está disponível em `gitlab.com/evlaV/linux-integration` e os patches podem ser inspecionados com `git log`.

## Exercícios

1. Execute `uname -r` e `modinfo steamdeck_hid` no seu Deck. Copie o campo `vermagic` e explique o que cada parte dele significa.
2. Conte quantos módulos assinados pela Valve estão carregados: `lsmod | grep -i valve`. Liste as dependências de cada um com `modinfo`.
3. Clone o repositório `linux-integration` e use `git log --oneline v6.5..valve/linux-6.5.y` para listar todos os patches da Valve. Escolha um patch cujo assunto você não entende e pesquise o que ele faz.
4. Compare a versão do seu `linux-neptune` com a última tag disponível no GitLab. Você está atualizado? Se não, quais patches novos foram adicionados?
5. **Desafio.** No repositório clonado, gere um diff entre o mainline e o branch da Valve apenas para o driver `steamdeck-hid.c`. Explique cada bloco do diff — o que a Valve adicionou que o mainline não tem?