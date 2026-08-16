O rEFInd é o boot manager mais citado no ecossistema do Steam Deck, mas não é o único. O Clover domina entre quem migrou do Hackintosh e quer um menu mais visual; o systemd-boot encaixa bem em setups com múltiplas distros systemd. Cada um resolve o mesmo problema com filosofia diferente — e cada um tem uma pegadinha no Deck.

:::objetivos
- Comparar Clover, systemd-boot e rEFInd na tela de 800p e na ESP de 64 MB
- Instalar e configurar o Clover com tema adaptado à tela do Deck
- Configurar o systemd-boot com `bootctl` e arquivos de entrada
- Entender as limitações de cada boot manager no contexto do SteamOS
- Escolher o boot manager certo para o seu cenário
:::

## Clover: visual e flexível

O Clover nasceu da cena Hackintosh — o desafio de fazer macOS rodar em hardware de PC — e herdou um menu caprichado: ícones grandes, preview de disco, resolução customizável. Na ESP de 64 MB do Deck, a instalação mínima do Clover cabe, mas os temas mais pesados não. Fique no tema "embedded", que é enxuto.

A instalação segue o mesmo princípio do rEFInd: copiar arquivos para a ESP e registrar o `.efi`:

```terminal
## Monte a ESP
$ sudo mount /dev/nvme0n1p1 /mnt

## Copie o Clover
$ sudo cp -r ~/Downloads/CloverV2-5160/X64/* /mnt/EFI/CLOVER/

## Registre a entrada
$ sudo efibootmgr -c -d /dev/nvme0n1 -p 1 -L Clover \
  -l '\EFI\CLOVER\CLOVERX64.efi'
```

A configuração principal está em `/mnt/EFI/CLOVER/config.plist`, um XML que define timeout, resolução, tema e opções de scan. Para a tela de 1280x800 do Deck LCD:

```xml
<key>ScreenResolution</key>
<string>1280x800</string>
<key>Timeout</key>
<integer>5</integer>
<key>DefaultVolume</key>
<string>SteamOS</string>
```

A detecção do Clover é baseada em *volumes*: ele varre partições FAT32 e HFS+, lê os `.efi` e monta o menu. Partições ext4/Btrfs de Linux comum não aparecem automaticamente — é preciso instalar o driver `VBoxHfs.efi` (já incluso) e, para ext4, o driver `ext4.efi`, que nem sempre acompanha o pacote oficial.

:::nota
O Clover tem um legado de compatibilidade com hardware Apple que não se aplica ao Deck: `SMBIOS`, DSDT patches, fix de ACPI. Para dual boot Windows + SteamOS, metade do `config.plist` é irrelevante. Não se assuste com o arquivo de configuração longo; as seções de Boot, GUI e SystemParameters são as únicas que você mexe.
:::

## systemd-boot: minimalista e direto

O `systemd-boot` (antigo `gummiboot`) é o boot manager nativo de distribuições que usam systemd, como Fedora, Bazzite e Arch. Ele é uma tela preta com texto branco, sem ícones — minimalista, mas funcional para quem não quer firulas.

A vantagem: é minúsculo (~32 KB o `.efi`), cabe em qualquer ESP, e sua configuração é feita com arquivos `.conf` de três linhas.

```terminal
## Instale na ESP (a partir de uma distro Fedora/Arch)
$ sudo bootctl install --esp-path=/mnt
```

Isso grava `systemd-bootx64.efi` em `ESP/EFI/systemd/` e em `ESP/EFI/BOOT/BOOTX64.EFI`. A partir daí, você cria entradas em `ESP/loader/entries/`:

```ini
## arquivo: /mnt/loader/entries/steamos.conf
title   SteamOS
linux   /steamos/vmlinuz-linux
initrd  /steamos/initramfs-linux.img
options root=UUID=abc123... ro quiet splash
```

O kernel e initramfs do SteamOS precisam ser copiados para dentro da ESP, porque o `systemd-boot` **não consegue ler ext4/Btrfs diretamente** — ele só acessa a própria partição ESP (FAT32). Isso significa que cada atualização do kernel do SteamOS exige recopiar os arquivos e, em certos casos, regerar a entrada.

```terminal
## Copie kernel e initrd do SteamOS para a ESP
$ sudo cp /boot/vmlinuz-* /mnt/steamos/vmlinuz-linux
$ sudo cp /boot/initramfs-*.img /mnt/steamos/initramfs-linux.img
```

:::atencao
O systemd-boot exige que kernel e initramfs estejam dentro da ESP, o que no SteamOS vira um ritual de manutenção: toda atualização do kernel (que ocorre com atualizações do sistema) requer recopiar os arquivos para a ESP. Um boot manager que lê partições Linux (rEFInd, Clover com `ext4.efi`) evita essa dança.
:::

O `loader.conf` define o comportamento global:

```ini
## /mnt/loader/loader.conf
default steamos
timeout 5
console-mode keep
```

Para o Windows, o `systemd-boot` detecta automaticamente a entrada `Windows Boot Manager` sem precisar de arquivo `.conf`. Já para kernels Linux de outras distros, é preciso criar manualmente.

## Comparação lado a lado

| Aspecto | rEFInd | Clover | systemd-boot |
|---|---|---|---|
| Tamanho do `.efi` | ~900 KB | ~500 KB | ~32 KB |
| Detecção automática de kernels Linux | Sim | Precisa de driver ext4 | Não (copia para ESP) |
| Detecção do Windows Boot Manager | Sim | Sim | Sim |
| Tema visual nativo | Sim | Sim (avançado) | Não (só texto) |
| Sobrevive a update sem manutenção | Sim | Sim | Não (kernel) |
| Cabe em ESP de 64 MB com tema | Sim | Sim (mínimo) | Sim (sobra) |

## Montando a ESP e gerenciando arquivos

Independente do boot manager, você vai montar a ESP com frequência. Automatizar isso evita erro de digitar o dispositivo a cada vez:

```terminal
## Adicione em ~/.bashrc uma função
esp() { sudo mount /dev/nvme0n1p1 /mnt; echo 'ESP em /mnt'; }
unesp() { sudo umount /mnt; echo 'ESP desmontada'; }

## E recarregue
$ source ~/.bashrc
$ esp
ESP em /mnt
```

Para listar o que ocupa espaço na ESP:

```terminal
$ esp
$ du -sh /mnt/EFI/*
2.3M    /mnt/EFI/CLOVER
10M     /mnt/EFI/Microsoft
1.1M    /mnt/EFI/refind
512K    /mnt/EFI/steamos
512K    /mnt/EFI/ubuntu
$ df -h /mnt
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p1   64M   15M   50M  23% /mnt
```

A ESP de 64 MB comporta SteamOS + Windows + rEFInd + mais uma distro. Com cinco ou mais, o cenário aperta. A [seção de particionamento](#/cap-062/sec-02) já cobriu a criação de uma ESP maior para esses casos.

## Resumo

- Clover tem visual rico, herança Hackintosh e exige driver `ext4.efi` para ler partições Linux.
- systemd-boot é mínimo (32 KB), rápido, mas exige copiar kernel e initramfs para a ESP a cada atualização.
- rEFInd é o meio-termo: detecção automática, visualização gráfica e manutenção zero.
- A ESP de 64 MB comporta três a quatro boot managers; monitore com `du -sh /mnt/EFI/*`.
- Automatize montar e desmontar a ESP com funções no `~/.bashrc`.

## Exercícios

1. Instale o Clover na ESP do Deck (ou num pendrive formatado como ESP), configure `config.plist` para 1280x800 e timeout 5.
2. Crie uma entrada `steamos.conf` para o systemd-boot, copiando kernel e initramfs do SteamOS para a ESP.
3. Compare o espaço ocupado por cada boot manager com `du -sh /mnt/EFI/*` e registre qual cabe com folga.
4. Escreva as funções `esp()` e `unesp()` no seu `~/.bashrc` e teste o ciclo montar/desmontar três vezes.
5. **Desafio.** Instale os três boot managers na mesma ESP, crie entradas na NVRAM para todos, alterne entre eles com `efibootmgr -n` e decida qual você usaria no dia a dia — justificando com base no que cada um exige de manutenção.