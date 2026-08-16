Instalar o Bazzite é a parte fácil — é o mesmo instalador gráfico do Fedora. A parte que define se você vai tirar proveito real do sistema vem depois, e tem nome: `ujust`, a camada de atalhos que transforma dezenas de comandos em receitas de uma linha. Dominar a instalação e o `ujust` é o que separa quem instala o Bazzite "por instalar" de quem o usa como ferramenta de manutenção diária.

:::objetivos
- Baixar e gravar a imagem correta do Bazzite para o seu hardware
- Concluir a instalação e o primeiro boot com sessão correta
- Entender o que é o `ujust` e como ele se relaciona ao `just`
- Usar recipes do `ujust` para tarefas comuns de gaming
- Atualizar o sistema com `rpm-ostree upgrade` e limpar a casa
:::

## Escolhendo e gravando a imagem

O ponto de partida é o site do Bazzite, que oferece um seletor de imagem com três perguntas: aparelho (portátil ou desktop), ambiente (GNOME, KDE) e GPU (AMD/Intel ou NVIDIA). A resposta monta o nome da imagem que você vai baixar — e, mais importante, a imagem já sai com os drivers certos embutidos.

Depois de baixar o `.iso`, grave num pendrive com o Fedora Media Writer (recomendado) ou com o `dd`, que no Linux é imediato:

```terminal
$ lsblk -o NAME,SIZE,MODEL | grep -iE 'sda|sdb|usb'
sdb       14.9G USB SanDisk 3.2Gen1
$ sudo dd if=./bazzite-deck-stable.iso of=/dev/sdb bs=4M status=progress oflag=sync
1533542400 bytes (1.5 GB, 1.4 GiB) copied, 42 s, 36.5 MB/s
```

:::perigo
O `dd` grava no disco indicado por `of=` **sem perguntar nada** e sobrescreve partições inteiras. Confirme o dispositivo com `lsblk` antes de qualquer `dd`: escrever no disco errado apaga o sistema da máquina. Use `/dev/sdb` (o pendrive), nunca `/dev/sdb1` (uma partição).
:::

## O instalador e o primeiro boot

Com o pendrive bootável, o instalador é o `Anaconda`, o mesmo do Fedora. As escolhas importantes cabem em duas telas: o **disco de destino** (apague a partição antiga com cuidado se for dedicar a máquina) e o **usuário inicial**. O Bazzite não pede para você escolher entre "deck" ou "desktop" aqui — isso já veio definido na imagem que você baixou.

No primeiro boot, a variante `deck` cai direto na sessão Gamescope/Steam, como um console. A variante `desktop` cai no GDM, onde você pode escolher entre a sessão do ambiente gráfico e, em alguns setups, a sessão de jogo. Para confirmar o que está rodando:

```terminal
$ echo $XDG_SESSION_TYPE
wayland
$ loginctl list-sessions
SESSION  UID USER   SEAT  TTY
      2 1000 deck   seat0
```

A sessão `deck` no lugar do seu usuário indica o modo console. `XDG_SESSION_TYPE=wayland` confirma que o compositor Wayland (o Gamescope, na variante deck) está no controle da tela.

## `ujust`: o canivete suíço do Bazzite

O `ujust` é um wrapper do **just**, um executor de receitas inspirado no `make`, mas que roda comandos em vez de compilar. O Bazzite embarca centenas de recipes prontas que automatizam tarefas que costumam exigir tutoriais: instalar emuladores, configurar virtualização, instalar drivers NVIDIA, mexer no GRUB.

```terminal
$ ujust --list
Available recipes:
    bazzite-arch              Setup Arch in Distrobox
    clean-system              Clean system package cache
    configure-grub            Configure GRUB
    distrobox-nvidia          Setup NVIDIA in Distrobox
    emudeck-setup             Install EmuDeck
    install-steam-proton      Install Steam and Proton
    setup-virtualization      Setup virtualization
    ...
```

Para ver o que uma recipe faz antes de rodá-la, o `just` mostra o corpo do comando:

```terminal
$ ujust clean-system
==> Limpando caches do sistema e do usuário
sudo rpm-ostree cleanup -m
sudo dnf clean all
flatpak uninstall --unused -y
```

Cada recipe é um arquivo `*.just` simples e legível. A boa notícia: você pode escrever as suas. As recipes pessoais ficam em `~/.config/just/` e aparecem no `ujust --list` junto com as do sistema.

```bash
# ~/.config/just/update.just
atualizar:
    ujust clean-system
    rpm-ostree upgrade
    flatpak update -y
```

Depois de escrever, `ujust atualizar` executa os três passos em sequência. É assim que se constrói um fluxo de manutenção pessoal em cima do sistema.

## Atualizando o sistema atômico

A atualização do Bazzite tem dois níveis distintos, e confundi-los é um erro comum. O sistema base sobe com `rpm-ostree upgrade`, que puxa um deploy novo da imagem OCI e deixa tudo pronto para o próximo boot. Os Flatpaks — onde vivem Steam, emuladores e a maioria dos apps — atualizam em paralelo com `flatpak update`.

```terminal
$ rpm-ostree upgrade
Pulling manifest: ostree-image-signed:docker://ghcr.io/ublue-os/bazzite-deck:stable
Importing: 82 packages
Upgraded:
  kernel 6.12.7-200.fc41 -> 6.12.9-200.fc41
  mesa-vulkan-drivers 24.3.2 -> 24.3.4
  ...
Run "systemctl reboot" to start a reboot
```

A saída deixa claro o modelo atômico: os pacotes foram **importados** para um novo deploy, não "instalados por cima". Nada muda no sistema em execução até você reiniciar. Esse é o motivo pelo qual o Bazzite quase nunca deixa a máquina num estado meio quebrado entre uma sessão e outra.

```terminal
$ flatpak update -y
Looking for updates…
        ID                                    Branch  Op  Remote  Download
 1.	com.valvesoftware.Steam                  stable  u   flathub  < 42.0 MB
 2.	org.libretro.RetroArch                  stable  u   flathub  < 18.4 MB
```

:::atencao
`rpm-ostree upgrade` aplica no **próximo boot**. Se você rodar o upgrade, continuar jogando e desligar, o deploy novo só assume quando ligar de novo. Para ver o que está pendente, use `rpm-ostree status` e compare o deploy marcado com `●` (em uso) e o pendente. Para voltar atrás depois de um upgrade ruim, `rpm-ostree rollback`.
:::

## Limpando a casa e o espaço em disco

Sistemas atômicos acumulam artefatos — deploys antigos, camadas removidas, Flatpaks órfãos — e em portáteis com eMMC ou SSD pequeno isso morde rápido. O `ujust` tem recipes específicas para isso, e vale automatizá-las:

```terminal
$ ujust clean-system
==> Limpando caches
$ sudo ostree admin cleanup
$ flatpak uninstall --unused -y
```

O `ostree admin cleanup` remove deploys antigos que não são mais necessários, liberando espaço que o `rpm-ostree upgrade` vai reutilizar. Manter dois ou três deploys é saudável (dá margem para rollback); deixar vinte é desperdício.

## Resumo

- Escolha a imagem pelo seletor do site (aparelho, ambiente, GPU) e grave com Fedora Media Writer ou `dd`.
- O instalador é o `Anaconda` do Fedora; a variante já veio definida na imagem baixada.
- `ujust` é um wrapper do `just` que expõe recipes para tarefas comuns, e aceita recipes pessoais em `~/.config/just/`.
- A atualização atômica se divide em `rpm-ostree upgrade` (base, próximo boot) e `flatpak update` (apps).
- `rpm-ostree status` mostra o deploy em uso e o pendente; `rpm-ostree rollback` desfaz um upgrade ruim.
- `clean-system` e `ostree admin cleanup` liberam espaço acumulado por deploys e caches antigos.

## Exercícios

1. Baixe a imagem do Bazzite adequada ao seu hardware e confira o nome da variante no seletor. Grave num pendrive e verifique com `lsblk` o tamanho e o dispositivo.
2. Em um sistema já instalado, rode `ujust --list` e escolha três recipes que você ainda não usou. Leia o corpo de cada uma com `ujust <nome>` antes de executar.
3. Escreva uma recipe pessoal em `~/.config/just/` que execute sua rotina de manutenção (limpeza + upgrade + flatpak update) e chame-a pelo `ujust`.
4. Execute `rpm-ostree status` e descreva, a partir da saída, qual deploy está em uso, qual está pendente e quantos deploys antigos existem.
5. **Desafio.** Configure uma atualização automática com `systemd` (uma unidade `timer` que roda `rpm-ostree upgrade` + `flatpak update` em horário de pouco uso). Explique a escolha do `OnCalendar` e como evitar que a atualização interrompa uma partida em andamento.
