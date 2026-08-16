Dual boot não é a única forma de ter vários sistemas à disposição — e, em muitos casos, nem a melhor. Máquinas virtuais, WSL, containers, `kexec` e até múltiplos SSDs em paralelo resolvem o mesmo problema com custos e riscos bem diferentes. Chegar ao setup certo é uma questão de entender o trade-off, não de decorar receita.

:::objetivos
- Comparar dual boot, VM, WSL/containers e `kexec` para cada cenário de uso
- Rodar Windows dentro do SteamOS com QEMU/KVM e avaliar desempenho
- Usar WSL/Containers quando só o espaço de usuário Linux importa
- Trocar de sistema sem reiniciar com `kexec`
- Aplicar um checklist de decisão e de backup para setups multi-OS
:::

## O mapa das opções multi-OS

Cada técnica de "rodar outro sistema" tem um custo diferente em desempenho, risco e complexidade:

| Técnica | Sistemas simultâneos | Desempenho | Risco de dados | Quando usar |
|---|---|---|---|---|
| Dual boot | Um por vez | Nativo | Alto (particionar) | Jogos exigentes, anti-cheat |
| VM (QEMU/KVM) | Simultâneos | ~90% com GPU passthrough | Baixo | Testar, Windows ocasional |
| WSL/containers | Simultâneos | Nativo (CPU) | Baixíssimo | Linha de comando Linux |
| `kexec` | Troca sem reboot | Nativo | Médio | Trocar kernel/sistema rápido |
| SSD externo | Um por vez | Nativo (USB/Thunderbolt) | Baixo | Segundo sistema ocasional |

O erro mais comum é tratar dual boot como solução universal quando a necessidade real era "rodar um binário do Windows ou uma ferramenta de linha de comando Linux de vez em quando". Nesse caso, VM e WSL resolvem em minutos o que o dual boot resolve em horas — e sem tocar no particionamento.

## Máquina virtual com QEMU/KVM no SteamOS

O SteamOS tem kernel com suporte a KVM, e o QEMU empacotado em Flatpak roda satisfatoriamente. Para Windows com aceleração gráfica, o caminho é o GPU passthrough — complexo, mas recompensador.

```terminal
## Verifique se a virtualização por hardware está disponível
$ grep -E '(vmx|svm)' /proc/cpuinfo | head -1
flags ... vmx ... 
```

A saída com `vmx` (Intel) ou `svm` (AMD) confirma o suporte. Uma VM básica de Windows sem passthrough de GPU serve para Office, utilitários e aplicações leves — mas não para jogos, porque a placa de vídeo fica no emulador paravirtual.

O GPU passthrough completo (passar a APU/GPU para dentro da VM) exige:

- VFIO e driver `vfio-pci` carregado, isolando a GPU;
- IOMMU ativado no firmware e no kernel (`amd_iommu=on`);
- uma segunda GPU para o host (no Deck, a integrada faz os dois papéis, o que complica).

Por isso, no Deck, VM geralmente significa "Windows de produtividade", enquanto "jogar Windows nativamente" continua sendo território do dual boot ou do SSD externo.

:::nota
O `looking-glass` + `IVSHMEM` é a técnica que devolve a imagem da GPU da VM para o host sem cabo ou monitor extra. Funciona bem em desktops com GPU dedicada; no Steam Deck, o hardware integrado limita as opções. Para referência, a documentação oficial do Arch Linux (que o SteamOS usa como base) cobre o assunto em profundidade.
:::

## WSL e containers Linux

O caso inverso também existe: você tem Windows no Deck e sente falta de ferramentas Linux — shell, `ssh`, `rsync`, scripts. Em vez de instalar uma distro inteira em dual boot, o **WSL2** (Windows Subsystem for Linux) entrega um kernel Linux rodando sobre o Windows, com acesso ao shell e a quase todo o ecossistema:

```terminal
## No Windows, instale o WSL
C:\> wsl --install -d Ubuntu-24.04
C:\> wsl
usuario@DESKTOP:~$ uname -r
5.15.153.1-microsoft-standard-WSL2
```

O WSL2 compartilha o kernel com a VM leve da Microsoft, mas o espaço de usuário é Ubuntu completo: `apt`, systemd (com `systemd=true` no `/etc/wsl.conf`), até Docker. O desempenho de CPU e I/O é próximo do nativo; o que não há é aceleração gráfica 3D paravirtual para jogos.

No Direção do SteamOS, o equivalente é o **containers**: `distrobox`, `podman` e `docker` criam ambientes de outras distros sobre o sistema base, sem nova partição. É o jeito certo de "ter Fedora no SteamOS" para desenvolver ou testar pacotes:

```terminal
## No SteamOS, crie um container Arch
$ distrobox create --name arch --image archlinux:latest
$ distrobox enter arch
arch@box:~$ sudo pacman -Syu
```

## Trocando de sistema sem reiniciar: kexec

O `kexec` troca o kernel em execução por outro, pulando o POST do firmware e o boot loader. É uma reinicialização "morna": o novo kernel assume a memória direto, sem passar pela UEFI nem pela ESP.

```terminal
## Carregue um kernel novo
$ sudo kexec -l /boot/vmlinuz-6.11 --initrd=/boot/initramfs-6.11.img \
    --append="root=UUID=abc123 ro quiet splash"
## E execute a troca
$ sudo kexec -e
```

O `kexec` não faz dual boot no sentido tradicional — ele troca o kernel do **mesmo sistema** ou de outro, mas sem reescrever NVRAM nem tocar no layout. Serve para trocar rapidamente entre kernels (testar um driver novo, pular um kernel problemático) mais do que alternar entre SOs completos. Seu custo: o novo kernel precisa estar acessível no sistema de arquivos atual.

:::atencao
O `kexec` não reinicializa o hardware. Drivers que dependem de reset de firmware (GPU, controladores de rede, alguns SSDs NVMe) podem herdar estado da sessão anterior e se comportar de forma instável. Para trocar de sistema operacional de verdade, o reboot completo continua sendo o caminho confiável.
:::

## Decidindo com um checklist

Diante de "preciso de outro sistema", responda estas quatro perguntas antes de abrir o `parted`:

1. **O uso é frequente ou esporádico?** Esporádico → SSD externo ou VM. Frequente e exigente → dual boot.
2. **Preciso de GPU/anti-cheat nativo?** Jogos anticheat kernel (Vanguard, FaceIt) só rodam em Windows nativo → dual boot ou SSD Windows.
3. **É só ferramenta de linha de comando?** WSL ou `distrobox` resolvem sem particionar.
4. **Quanto risco de dados aceito?** Particionar é a operação de maior risco; VM/container quase não tocam o disco.

Para quem já tem (ou quer) um setup multi-OS, um regime de backup fecha o pacote:

```terminal
## Snapshot e backup do SteamOS antes de mexer em qualquer boot
$ sudo btrfs subvolume snapshot -r /home /home/.snapshots/$(date +%F)
## ou, no ext4, rsync para disco externo
$ rsync -av --delete ~/ /run/media/deck/BackupHD/home/
```

:::dica
Mantenha sempre um pendrive de emergência com rEFInd e um live Linux à mão, como montado na [seção de troubleshooting](#/cap-062/sec-07). Com ele, qualquer experimento de boot — dual boot, VM com passthrough, kexec, SSD externo — deixa de ter "ponto sem volta".
:::

## Resumo

- Dual boot é a opção certa para desempenho nativo e anti-cheat; VM, WSL e containers cobrem o resto com menos risco.
- QEMU/KVM roda Windows no SteamOS; GPU passthrough é complexo e limitado no hardware integrado.
- `distrobox`/`podman` trazem outras distros Linux ao SteamOS sem particionar.
- `kexec` troca kernel sem reiniciar, mas não zera o hardware e não substitui o dual boot.
- Decida por frequência de uso, necessidade de GPU nativa, tipo de ferramenta e tolerância a risco; faça backup antes de tocar no disco.

## Exercícios

1. Verifique o suporte a virtualização com `grep -E '(vmx|svm)' /proc/cpuinfo` e anote se seu modelo tem IOMMU ativado (`dmesg | grep -i iommu`).
2. Crie um container com `distrobox create` e `distrobox enter`, instale um pacote e saia — confirme que o SteamOS base ficou intacto.
3. Rode `sudo kexec -l` com o kernel atual e `-e` para executar uma troca morna; observe as diferenças na inicialização.
4. Liste o `dmidecode -t system` e identifique se há suporte a SSD externo bootável via USB/Thunderbolt na sua máquina.
5. **Desafio.** Escreva um documento de decisão comparando dual boot, VM e WSL/containers para o SEU caso concreto (jogos que usa, ferramentas que precisa, tolerância a risco) e indique, com justificativa, a técnica vencedora.