Quando o SteamOS não inicia, trava no logo ou você precisa reinstalar o sistema, são os atalhos de boot que salvam a situação. Diferente dos atalhos normais, estes são acionados **antes** do sistema operacional carregar — durante o POST do firmware UEFI. Esta seção documenta cada combinação de botões de recovery, o que ela faz e quando usar.

:::objetivos
- Acessar o menu de boot (Boot Manager) do Steam Deck
- Entrar na imagem de recovery do SteamOS
- Entender o reset de fábrica e suas variantes
- Distinguir reset total, reset de usuário e reinstalação
:::

## Combinações de boot no power-on

Todas as combinações a seguir exigem que o Deck esteja **desligado**. Segure os botões indicados e então pressione o botão de energia; mantenha tudo segurado até ouvir o "chime" (beep) do firmware.

| Combinação | Resultado |
|---|---|
| **Volume −** + **Power** | Abre o **Boot Manager** — escolhe entre boot do SSD, microSD ou USB |
| **Volume +** + **Power** | Abre o **BIOS/UEFI Setup** para configurar firmware |
| **Volume −** + **`...` (Quick Access)** + **Power** | Boot forçado pelo **recovery** (imagem de recuperação) |
| **Power (segurar 12s)** | Força desligamento do controlador embutido (EC reset) |
| **Power (segurar 3s)** | Menu de desligamento/reinício normal |

O Boot Manager e o Setup são telas rudimentares, controladas pelo firmware da Valve e não pelo SteamOS. Neles, a navegação é feita com o D-Pad (ou setas do teclado externo) e o botão A (ou Enter) confirma.

```terminal
$ efibootmgr
BootCurrent: 0000
BootOrder: 0000,0001,0002
Boot0000* SteamOS
Boot0001* EFI USB Device
Boot0002* EFI Network
```

O comando `efibootmgr` (rodando no Modo Desktop) lista as entradas de boot registradas na NVRAM. A ordem acima mostra o SteamOS como padrão, seguido de USB e rede — você pode reordenar essas entradas ou criar atalhos para boot por USB sem depender do menu de recovery.

## A imagem de recovery e quando usá-la

A **imagem de recovery** é um sistema operacional mínimo que a Valve distribui num arquivo `.img` para gravar num pendrive. Ela faz três coisas que o SteamOS normal não faz:

| Função da recovery | Descrição |
|---|---|
| **Reinstall SteamOS** | Reinstala o sistema preservando `/home` e os jogos |
| **Reimage SteamOS** | Apaga tudo (zera o disco) e reinstala do zero |
| **Recovery tools** | Shell de emergência para reparos manuais no disco |

Para criar um pendrive de recovery, grave a imagem com `dd` (ou o balenaEtcher no Windows/macOS). O comando abaixo é **destrutivo** para o dispositivo de destino.

```terminal
# dd if=steamdeck-recovery-4.img of=/dev/sdX bs=4M status=progress conv=fsync
3825+1 records in
3825+1 records out
16043212800 bytes (16 GB, 15 GiB) copied, 289.4 s, 55.4 MB/s
```

:::perigo
O argumento `of=` deve apontar **exatamente** para o pendrive (`/dev/sdX`), nunca para um disco do sistema (`/dev/nvme0n1`). Um `dd` errado pode apagar o SSD inteiro do Deck, incluindo jogos e saves. Confirme o dispositivo com `lsblk` antes de executar.
:::

A imagem de recovery atual (versão 4.x) tem cerca de 15 GB e precisa de um pendrive de pelo menos 16 GB. A gravação leva de 3 a 10 minutos dependendo do pendrive.

## Reset de fábrica sem pendrive

Além da recovery por USB, o SteamOS oferece redefinição pela própria interface, útil quando o sistema ainda boota mas você quer limpar uma conta.

| Método | Onde fica | O que apaga |
|---|---|---|
| **Reset de fábrica (full)** | Modo Jogo > Configurações > Sistema > "Restaurar padrões" | Tudo: contas, jogos, configurações |
| **Logout de todas as contas** | Modo Jogo > Configurações > Sistema | Apenas sessões de usuário |

```terminal
$ lsblk -o NAME,SIZE,FSTYPE,MOUNTPOINT
NAME        SIZE FSTYPE MOUNTPOINT
nvme0n1      512G
├─nvme0n1p1  64M  vfat
├─nvme0n1p2  32M  vfat
├─nvme0n1p3  32M  vfat
├─nvme0n1p4   4G  ext4   /
├─nvme0n1p5   4G  ext4
├─nvme0n1p6   4G  ext4
└─nvme0n1p8 474G  ext4   /home
```

O layout de partições acima explica por que o "reinstall" preserva `/home`: ele só sobrescreve as partições de sistema (`p1`–`p6`), enquanto `/home` (na `p8`) permanece intacta. O "reimage" zera todas, incluindo a `p8`.

:::nota
O SteamOS usa o esquema A/B de partições (`p5` e `p6` como slots). O "reinstall" grava no slot inativo e alterna, o que torna o processo reversível até certo ponto — uma atualização quebrada pode ser revertida para o slot anterior mantendo o boot on.
:::

## Resumo

- Volume − + Power abre o Boot Manager; Volume + + Power abre o Setup UEFI.
- A imagem de recovery tem 15 GB e oferece "reinstall" (preserva `/home`) e "reimage" (apaga tudo).
- Gravar a recovery com `dd` é destrutivo e exige confirmação do dispositivo com `lsblk`.
- O reset de fábrica pode ser feito pela interface, sem pendrive, mas apaga contas e jogos.
- O layout A/B de partições torna o reinstall reversível ao alternar entre slots.

## Exercícios

1. Desligue o Deck e reinicie segurando Volume − + Power. O Boot Manager lista quais opções? Registre a ordem das entradas.
2. Execute `efibootmgr` no Modo Desktop e compare a `BootOrder` com o que o Boot Manager exibiu. Há divergência?
3. Baixe a imagem de recovery oficial da Valve (verifique a URL no site da Steam) e grave num pendrive com `dd`. Cronometre a gravação.
4. Com o pendrive de recovery pronto, faça boot pelo Boot Manager e entre nas "Recovery tools". Liste os discos com `lsblk` e identifique cada partição.
5. **Desafio.** Sem gravar nada, use `lsblk` e `fdisk -l` para desenhar o layout completo do SSD do seu Deck e rotular cada partição (sistema, slot A/B, home). Depois explique, com base nesse layout, por que o "reinstall" preserva seus saves.