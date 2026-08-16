O Steam Deck é um PC, e como todo PC, pode rodar mais de um sistema operacional. O dual boot — tipicamente SteamOS + Windows — exige ajustes no particionamento porque o layout de fábrica consome praticamente todo o disco com as 9 partições do SteamOS. Esta seção mostra como encolher `/home`, criar espaço para o segundo sistema e configurar o bootloader para alternar entre eles sem perder a conveniência do SteamOS.

:::objetivos
- Reduzir a partição `/home` para liberar espaço para outro SO
- Criar partições adicionais mantendo as 9 originais intactas
- Configurar o bootloader para escolher entre SteamOS e Windows
- Evitar os erros comuns que levam a SteamOS não iniciar após dual boot
:::

## Reduzindo o /home para abrir espaço

A partição 9 (`/home`) ocupa quase todo o disco. Para abrir espaço sem destruir o sistema, é preciso desmontar `/home`, encolher o sistema de arquivos com `resize2fs` e depois reduzir a partição com `parted`. O sistema precisa estar rodando a partir do pendrive de recuperação para desmontar `/home`.

```terminal
steamdeck-recovery ~ # e2fsck -f /dev/nvme0n1p9
steamdeck-recovery ~ # resize2fs /dev/nvme0n1p9 200G
steamdeck-recovery ~ # parted /dev/nvme0n1 resizepart 9 201GiB
```

O `resize2fs` encolhe o sistema de arquivos primeiro (200G neste exemplo), depois o `parted` reduz a partição para um tamanho ligeiramente maior (201 GiB) para dar margem. A ordem importa: se você reduzir a partição antes do filesystem, os dados no final do disco serão truncados.

:::atencao
Sempre faça backup antes de encolher um sistema de arquivos. O `resize2fs` é seguro, mas um desligamento no meio da operação pode corromper dados. Com o aparelho na energia (não só na bateria), o risco é muito baixo.
:::

## Criando partições para o segundo sistema

Com espaço livre após a p9, crie as partições para o Windows (ou outra distribuição Linux). O Windows exige pelo menos uma partição de sistema (NTFS) e pode precisar de uma partição ESP adicional se a atual (p6) for pequena demais.

```terminal
steamdeck-recovery ~ # parted -s /dev/nvme0n1 \
  mkpart primary ntfs 201GiB 351GiB \
  mkpart primary fat32 351GiB 351.5GiB
steamdeck-recovery ~ # mkfs.ntfs -f /dev/nvme0n1p10
steamdeck-recovery ~ # mkfs.vfat -F 32 /dev/nvme0n1p11
```

As partições 10 e 11 são adições ao layout original. A p10 (NTFS) hospedará o Windows; a p11 (vfat) pode servir como ESP adicional se o Windows reclamar do tamanho da p6 (256 MB costumam bastar, mas instalações do Windows 11 às vezes exigem mais).

:::nota
O Windows tende a sobrescrever a entrada de boot do SteamOS ao se instalar. Por isso, muitos preferem instalar o Windows primeiro (ocupando o disco todo), depois instalar o SteamOS que detecta o Windows e configura o dual boot automaticamente. A ordem inversa dá mais trabalho.
:::

## Configurando systemd-boot para dual boot

O SteamOS usa `systemd-boot` como gerenciador de boot. Para adicionar o Windows ao menu, crie uma entrada em `/efi/loader/entries/` e configure o timeout para dar tempo de escolher.

```terminal
steamdeck-recovery ~ # cat > /mnt/efi/loader/entries/windows.conf << 'EOF'
title   Windows
efi     \EFI\Microsoft\Boot\bootmgfw.efi
EOF
steamdeck-recovery ~ # cat > /mnt/efi/loader/loader.conf << 'EOF'
timeout 5
default steamos
EOF
```

Com o `timeout 5`, o menu de boot aparece por 5 segundos antes de iniciar o sistema padrão (`steamos`). Se você não configurar timeout, o systemd-boot inicia o SteamOS diretamente sem dar chance de escolher — o que contraria o propósito do dual boot.

```terminal
steamdeck-recovery ~ # ls /mnt/efi/loader/entries/
steamos.conf  windows.conf
```

Ambas as entradas devem coexistir na pasta `entries`. O `steamos.conf` é criado automaticamente pela instalação; o `windows.conf` é adicionado manualmente. Se o Windows for instalado depois, ele pode apagar o `steamos.conf` — mantenha uma cópia de segurança.

:::dica
No Steam Deck, segurar `Vol -` ao ligar mostra o menu de boot do firmware, que também lista as entradas UEFI. Se o dual boot quebrar, o menu de firmware ainda permite escolher entre os dois sistemas enquanto você repara.
:::

## Alternativa: rEFInd como gerenciador gráfico

Para quem prefere um menu de boot com interface gráfica e detecção automática de sistemas, o `rEFInd` é uma alternativa ao systemd-boot. Ele escaneia o disco, encontra kernels e bootloaders, e monta um menu visual sem precisar de configuração manual por entrada.

```terminal
steamdeck-recovery ~ # pacman -S refind
steamdeck-recovery ~ # refind-install
```

No SteamOS, a instalação do `rEFInd` exige remontar `/` como `rw` e instalar o pacote. Após `refind-install`, ele se registra como gerenciador de boot padrão e, no próximo boot, mostra ícones para cada sistema encontrado.

:::atencao
Instalar pacotes no SteamOS fora do overlay (com `/` em `rw`) sobrevive ao reset de fábrica porque a alteração vai para a partição física. Mas uma atualização de sistema pode sobrescrever a partição `/` — nesse caso o rEFInd some e o systemd-boot volta a ser o padrão.
:::

## Ciladas comuns do dual boot

A maior fonte de problemas é o Windows sobrescrever o bootloader. Durante a instalação ou após uma atualização grande (ex: 22H2 para 23H2), o Windows pode reescrever a entrada de boot UEFI e remover o SteamOS. Outro erro: redimensionar a p9 com o SteamOS rodando (montada) — isso corrompe o sistema de arquivos.

```terminal
steamdeck-recovery ~ # efibootmgr
BootCurrent: 0002
Timeout: 0 seconds
Boot0001* SteamOS
Boot0002* USB Device
Boot0003* Windows Boot Manager
```

Use `efibootmgr` para verificar se ambas as entradas existem. Se a entrada do SteamOS sumiu, recrie-a com `efibootmgr --create --disk /dev/nvme0n1 --part 6 --label "SteamOS" --loader '\EFI\BOOT\bootx64.efi'`. A entrada do Windows geralmente sobrevive porque o próprio Windows a recria.

## Resumo

- Reduza `/home` com `resize2fs` antes de `parted resizepart` — a ordem é filesystem primeiro, partição depois.
- Crie partições NTFS para Windows e, se necessário, vfat adicional para ESP.
- Adicione entrada Windows ao systemd-boot em `/efi/loader/entries/windows.conf` e configure `timeout` no `loader.conf`.
- rEFInd é uma alternativa gráfica que detecta sistemas automaticamente, mas requer instalação com `/` em `rw`.
- Verifique entradas UEFI com `efibootmgr` após instalar/atualizar qualquer sistema.

## Exercícios

1. Calcule quanto espaço você liberaria reduzindo `/home` para 150G no seu Steam Deck: qual o tamanho atual e quanto sobraria?
2. Simule em um pedaço de papel: desenhe as 9 partições originais + 2 novas (p10 NTFS, p11 vfat) com os tamanhos e pontos de início/fim.
3. Crie, como teste, um arquivo `windows.conf` fictício na sua máquina e explique cada linha.
4. Execute `efibootmgr` (apenas leitura) e liste todas as entradas de boot presentes.
5. **Desafio.** Descreva um plano de recuperação para o cenário: você instalou Windows depois do SteamOS, o SteamOS sumiu do boot, mas as partições 1-9 estão intactas. Quais comandos você usa no recovery para trazer o SteamOS de volta ao menu?