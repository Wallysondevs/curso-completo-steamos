O SteamOS já é Linux, mas é um Linux com modo de leitura, atualização atômica e pacotes Flatpak como único método de instalação. Quem quer pacotes tradicionais, outro ambiente gráfico, kernel customizado ou só uma distro de laboratório, instala uma segunda distribuição Linux. A boa notícia é que duas distros Linux no mesmo disco se entendem melhor do que Windows e Linux — contanto que você saiba quem manda no boot.

:::objetivos
- Escolher uma distro compatível com o hardware do Steam Deck
- Instalar uma segunda distro Linux sem apagar o SteamOS
- Configurar o GRUB do segundo Linux para enxergar o SteamOS
- Registrar e organizar entradas EFI com `efibootmgr`
- Separar a ESP quando o espaço de 64 MB não bastar
:::

## Escolhendo a distro

Nem toda distro funciona no Deck sem ajustes. O hardware usa GPU AMD RDNA2/RDNA3 com aceleração Vulkan, tela rotacionada, Wi-Fi que às vezes exige firmware proprietário e controles que precisam de driver `hid-steam`. As distros que chegam mais perto de funcionar de primeira são:

| Distro | Diferencial no Deck |
|---|---|
| **Bazzite** (Fedora Atomic) | Modo jogo nativo, Steam Gaming Mode idêntico ao SteamOS, camada atômica |
| **Nobara** (Fedora) | Kernel e drivers otimizados para jogos, Proton-GE integrado |
| **Ubuntu 24.04 LTS** | Maior compatibilidade de pacotes, instalador testado, LTS |
| **EndeavourOS** (Arch) | Rolling release, AUR para tudo, wiki do Arch cobre o Deck |
| **ChimeraOS** | Transforma o Deck em console puro, modo jogo por padrão |

Bazzite e ChimeraOS são as que mais se aproximam da experiência SteamOS — ambas oferecem o modo jogo (gamescope) como sessão principal. Distros convencionais como Ubuntu e Fedora funcionam como num laptop: você vê o GNOME/KDE e abre a Steam em modo Big Picture.

:::info
Se o plano é jogar na segunda distro, confirme que o **gamescope** (compositor do modo jogo do SteamOS) está disponível no repositório da distro. Sem ele, você não tem o overlay de performance, FSR integrado, limitador de FPS nem HDR. A [seção sobre gamescope no SteamOS](#/cap-046/sec-03) explica o compositor em detalhes.
:::

## O passo a passo da instalação

O processo é similar ao do Windows, mas o instalador Linux tende a ser mais educativo sobre partições. Comece com a distro num pendrive (Ventoy continua sendo a ferramenta certa).

```terminal
## Baixe o ISO e copie para o Ventoy
$ curl -L -o ~/Downloads/Bazzite-stable.iso https://download.bazzite.gg/bazzite-stable.iso
$ cp ~/Downloads/Bazzite-stable.iso /run/media/deck/Ventoy/
```

No instalador, ao chegar na tela de particionamento, escolha **particionamento manual**. Localize a partição que você criou para a distro (ex.: `nvme0n1p10`, 80 GB) e configure:

- **Ponto de montagem**: `/` (raiz)
- **Formatação**: `ext4` ou `btrfs`
- **Formatar**: sim

O instalador perguntará onde colocar o boot loader. As opções são:

1. **Na ESP existente** (`nvme0n1p1`): a distro coloca um diretório `/EFI/ubuntu/`, `/EFI/fedora/` etc. nessa partição, ao lado do `/EFI/steamos/`. Funciona, mas a ESP de 64 MB pode lotar com três ou mais sistemas.

2. **Numa ESP separada**: se você criou uma ESP maior (ex.: `nvme0n1p9`, 512 MB), escolha-a. O firmware do Deck lê múltiplas ESPs.

3. **Na raiz da própria distro**: possível, mas desnecessariamente complicado — o firmware UEFI não carrega `.efi` de dentro de partições ext4. Só ESP FAT32 funciona.

O ideal é usar a ESP original se você tem só SteamOS + uma distro; para três ou mais sistemas, a ESP de 512 MB é mais segura.

## Registrando a nova entrada EFI

Terminada a instalação, o GRUB da nova distro assume o boot. Se você não vê o SteamOS no menu, não se assuste — o `os-prober` não consegue montar as partições A/B corretamente. Adicione uma entrada manual:

```terminal
## Na distro nova, crie um arquivo de boot customizado
# nano /etc/grub.d/40_steamos
```

```bash
#!/bin/sh
exec tail -n +3 $0
menuentry "SteamOS" {
    insmod part_gpt
    insmod ext2
    set root=(hd0,gpt4)
    linux /boot/vmlinuz-* root=/dev/nvme0n1p4 ro quiet splash
    initrd /boot/initramfs-*-img
}
```

Depois regenere o `grub.cfg`:

```terminal
# update-grub
# grub-mkconfig -o /boot/grub/grub.cfg
```

Entretanto, a solução mais elegante para gerenciar múltiplos Linux + SteamOS é instalar um **boot manager** como rEFInd, que detecta automaticamente kernels e `.efi` sem depender de scripts de configuração — [assunto da próxima seção](#/cap-062/sec-05).

## Gerenciando as entradas com `efibootmgr`

Cada sistema instalado ganha uma entrada na NVRAM. Para listá-las e organizá-las:

```terminal
$ sudo efibootmgr
BootCurrent: 0000
Timeout: 2 seconds
BootOrder: 0000,0001,0003
Boot0000* SteamOS
Boot0001* Fedora
Boot0003* Ubuntu
```

Remova entradas fantasmas (restos de instalações passadas):

```terminal
$ sudo efibootmgr -b 0002 -B
```

Isso apaga a entrada `0002` da NVRAM. **Não apague** a entrada do SteamOS (`0000` no exemplo) nem a do sistema que você está usando no momento. Se estiver em dúvida, reinicie antes de deletar.

```terminal
## Redefina a ordem: SteamOS primeiro, Ubuntu depois
$ sudo efibootmgr -o 0000,0003
```

O SteamOS tem um timeout padrão de 2 segundos — quase não dá tempo de apertar nada. Para subir para 5 segundos:

```terminal
$ sudo efibootmgr -t 5
```

## Compartilhando o `home` entre distros

Uma dúvida recorrente: posso compartilhar a partição `home` entre SteamOS e a outra distro? A resposta é: **não diretamente, nem de forma segura**.

O SteamOS usa um esquema de usuário único (`deck`, UID 1000), mas cada distro tem seu próprio conjunto de pacotes, versões, arquivos de configuração (`.config/`, `.local/`) e, mais importante, versões diferentes dos aplicativos que gravam nesses diretórios. Um GNOME 47 mexer no `~/.config/gtk-4.0` que o SteamOS espera de outra forma quebra uma das duas interfaces.

O caminho seguro é compartilhar apenas uma **pasta de dados**, não o home inteiro:

```terminal
## Crie uma partição de dados exfat ou ntfs e monte-a nos dois lados
# mkfs.exfat -L compartilhado /dev/nvme0n1p11

## No SteamOS:
$ echo 'LABEL=compartilhado /mnt/compartilhado exfat defaults,uid=1000,gid=1000 0 0' | sudo tee -a /etc/fstab

## Na outra distro: mesma linha, ajustando uid/gid se o usuário não for 1000
```

## Resumo

- Bazzite, Nobara, Ubuntu, EndeavourOS e ChimeraOS são as distros mais testadas no Steam Deck.
- No particionamento manual, monte a raiz na partição criada e aponte o boot loader para a ESP.
- O GRUB da nova distro não detecta o SteamOS automaticamente; adicione uma entrada manual ou instale rEFInd.
- `efibootmgr` lista, remove (-b X -B) e reordena (-o) as entradas EFI na NVRAM.
- Não compartilhe o home inteiro entre distros; use uma partição de dados exfat/ntfs montada nos dois lados.

## Exercícios

1. Escolha uma das distros listadas, baixe o ISO e crie um pendrive de instalação com Ventoy.
2. Inicie o instalador, vá até o particionamento manual e identifique cada partição pelo tamanho — sem aplicar mudanças.
3. Na sua distro principal, execute `sudo efibootmgr`, anote todas as entradas e remova uma entrada de teste (criada num pendrive, por exemplo).
4. Crie um arquivo `/etc/grub.d/40_steamos` na distro secundária com uma entrada manual para o SteamOS e regenere o `grub.cfg`.
5. **Desafio.** Formate um pendrive como ESP (FAT32, flag `esp`), instale o rEFInd nele e teste inicializar pelo menu de firmware sem tocar na ESP interna do Deck.