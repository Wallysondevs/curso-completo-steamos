Containers isolam processos; máquinas virtuais isolam sistemas operacionais inteiros. Quando você precisa rodar outro Linux com kernel diferente, uma instalação de Windows para testes, ou simular uma rede com vários nós que conversam entre si, container não basta — você quer uma VM. O Steam Deck, com virtualização por hardware (AMD-V) disponível no processador, é perfeitamente capaz de rodar VMs leves, e esta seção mostra como.

:::objetivos
- Entender a diferença entre container, VM e as tecnologias de virtualização por hardware
- Habilitar KVM no SteamOS e verificar o suporte no processador
- Criar e gerenciar VMs com QEMU, libvirt e virt-manager
- Alocar recursos (CPU, RAM, disco) e configurar rede entre VMs
- Usar VMs para isolar testes, redes e sistemas operacionais diferentes
:::

## Container vs. VM: quando cada um

As duas tecnologias parecem fazer a mesma coisa, mas isolam em camadas diferentes. Um **container** compartilha o kernel do host e isola processos, rede e filesystem. Uma **máquina virtual** roda um sistema operacional completo, com kernel próprio, sobre um hypervisor que emula (ou acelera) o hardware.

A diferença prática decide a ferramenta:

| Cenário | Use |
|---|---|
| Rodar uma aplicação com dependências próprias | Container |
| Rodar outro kernel (ex.: testar kernel 5.15) | VM |
| Rodar Windows ou outro Linux radicalmente diferente | VM |
| Isolar por segurança (superfície de escape) | VM |
| Simular uma rede com vários hosts independentes | VMs (ou rede de containers) |
| Muitas instâncias leves, pouca RAM | Containers |

O desempenho também difere: containers rodam em velocidade nativa (quase zero overhead); VMs pagam um custo de virtualização, mitigado pela aceleração por hardware.

:::nota
Existe um meio-termo crescente: as microVMs (como o Firecracker da AWS) e os containers de máquina (como o `systemd-nspawn`). Eles oferecem isolamento de kernel sem o overhead completo de emulação de hardware. Para o escopo deste curso, QEMU + KVM cobrem os casos práticos.
:::

## Habilitando KVM no SteamOS

A virtualização eficiente depende do **KVM** (Kernel-based Virtual Machine), o módulo do kernel que deixa as VMs usarem as instruções de virtualização do processador (AMD-V/SVM, no caso do Deck) diretamente. Sem ele, Tudo roda em emulação de software — uma ordem de magnitude mais lento.

Primeiro, confirme o suporte do processador:

```terminal
$ grep -E 'svm|vmx' /proc/cpuinfo | head -1
flags : fpu vme de pse ... svm ... 
```

O `svm` (secure virtual machine) é o flag da AMD; em processadores Intel seria `vmx`. Se ele aparece, o hardware suporta.

Verifique se o módulo KVM está carregado:

```terminal
$ lsmod | grep kvm
kvm_amd               155648  0
kvm                  1114112  1 kvm_amd
```

Se não estiver, carregue (o SteamOS normalmente já carrega, mas vale confirmar):

```terminal
$ sudo modprobe kvm_amd
```

E confirme que o grupo correto tem acesso ao dispositivo `/dev/kvm`:

```terminal
$ ls -l /dev/kvm
crw-rw---- 1 root kvm 10, 232 jan 18 14:00 /dev/kvm
```

## Instalando QEMU, libvirt e virt-manager

Três peças formam a pilha de virtualização no Linux:

- **QEMU** — o emulador/hypervisor que executa a VM propriamente dita
- **libvirt** — a camada de gerenciamento que abstrai QEMU e outros hypervisors, com uma API/CLI (`virsh`)
- **virt-manager** — a interface gráfica que conversa com o libvirt

Dentro do distrobox dev (ou em qualquer ambiente com pacotes):

```terminal
$ sudo pacman -S qemu-full libvirt virt-manager dnsmasq edk2-ovmf
$ sudo systemctl enable --now libvirtd
$ sudo usermod -aG libvirt ana
```

O `edk2-ovmf` fornece o firmware UEFI (OVMF) necessário para VMs com UEFI — indispensável para Windows 11 e recomendado para qualquer sistema moderno. O `dnsmasq` cuida do DHCP/NAT da rede virtual padrão.

Depois de reiniciar a sessão (para o grupo valer), confirme que o libvirt está saudável:

```terminal
$ virsh list --all
 Id   Name   State
--------------------

$ virsh net-list --all
 Name      State    Autostart   Persistent
---------------------------------------------
 default   active   yes         yes
```

A rede `default` (NAT) já está ativa — as VMs saem para a internet usando o Deck como roteador, sem expor portas.

:::dica
O `--now` em `systemctl enable --now` é um atalho que você deve internalizar: ele faz `enable` (inicia no boot) + `start` (inicia agora) num comando só. Vale para `libvirtd`, para o Nginx, para qualquer serviço de que você queira as duas coisas de uma vez.
:::

## Criando sua primeira VM

A forma mais simples é pelo `virt-manager` (GUI), mas a versão em CLI é mais didática e scriptável. Com o QEMU criando uma VM Arch Linux a partir de um ISO baixado:

```terminal
$ qemu-img create -f qcow2 vm-arch.qcow2 20G
Formatting 'vm-arch.qcow2', fmt=qcow2 size=21474836480 cluster_size=65536 lazy_refcounts=off

$ qemu-system-x86_64 \
    -enable-kvm \
    -m 4096 \
    -smp 4 \
    -cdrom archlinux-2025.01.01-x86_64.iso \
    -drive file=vm-arch.qcow2,format=qcow2 \
    -boot d \
    -nic user,model=virtio \
    -accel kvm
```

Decodificando: `-enable-kvm` e `-accel kvm` ligam a aceleração por hardware (a parte que faz diferença); `-m 4096` reserva 4 GB de RAM; `-smp 4` dá 4 vCPUs; `-drive` aponta o disco `qcow2` (formato com alocação sob demanda — o arquivo cresce conforme a VM grava); `-nic user,model=virtio` cria a interface de rede com o driver `virtio`, o mais rápido em VM Linux.

Pelo `virt-manager`, o mesmo processo é um assistente gráfico: *New VM → Local install media → selecionar ISO → RAM/CPU → disco*. Muitos preferem a GUI para o primeiro contato e mudam para o `virsh` conforme o gerenciamento fica repetitivo.

:::atencao
Com 16 GB de RAM no Deck, deixe pelo menos 4 GB para o host. Uma VM com 12 GB de RAM somada ao SteamOS e às aplicações do desktop pode levar o sistema a swap e travar. Comece com 4 GB por VM e suba só se a carga pedir.
:::

## Gerenciando VMs com virsh

O `virsh` é a linha de comando do libvirt. Os verbos essenciais:

```terminal
$ virsh list --all
 Id   Name       State
------------------------------
 -    vm-arch    shut off

$ virsh start vm-arch
Domain 'vm-arch' started

$ virsh list
 Id   Name       State
------------------------------
 3    vm-arch    running

$ virsh dominfo vm-arch | grep -E 'State|CPU|Memory'
State:          running
CPU(s):         4
Memory:         4194304 KiB
```

Para clonar uma VM (útil para testar mudanças sem estragar a original):

```terminal
$ virsh shutdown vm-arch
$ virt-clone --original vm-arch --name vm-arch-teste --auto-clone
Allocating 'vm-arch-teste.qcow2'  |  20 GB  00:02
Clone 'vm-arch-teste' created successfully.
```

O `virt-clone` faz uma cópia independente — você pode quebrar a clone à vontade e voltar para a original quando precisar.

## Redes: VMs conversando entre si

A rede `default` (NAT) é suficiente para sair para a internet, mas VMs isoladas umas das outras. Para simular uma rede onde elas se enxergam, crie uma rede isolada:

```terminal
$ cat rede-interna.xml
<network>
  <name>rede-interna</name>
  <forward mode='none'/>
  <bridge name='virbr-interna' stp='on' delay='0'/>
  <ip address='192.168.100.1' netmask='255.255.255.0'/>
</network>

$ virsh net-define rede-interna.xml
Network rede-interna defined from rede-interna.xml
$ virsh net-start rede-interna
$ virsh net-autostart rede-interna
```

`mode='none'` significa "sem NAT" — as VMs nessa rede só conversam entre si e com o host, sem sair para a internet. É o cenário clássico de laboratório: dois servidores, um cliente, sem risco de exposição. Anexe qualquer VM a essa rede colocando `-nic` numa segunda interface configurada para `rede-interna` no virt-manager, ou editando o XML.

Com duas VMs na `rede-interna`, você recria, no seu Deck, o tipo de ambiente de rede que os capítulos 97 e 98 ensinaram a configurar — agora com hosts separados de verdade, cada um com seu IP, seu `sshd`, seu firewall. É o passo que transforma exercício em experimento.

## Resumo

- Container isola processo e compartilha kernel; VM roda um SO completo com kernel próprio — escolha conforme o isolamento e o sistema alvo exigem.
- O flag `svm` (AMD) em `/proc/cpuinfo` indica suporte a virtualização por hardware; `kvm_amd` no `lsmod` confirma que o módulo está carregado.
- A pilha é QEMU (executa) + libvirt (gerencia) + virt-manager (GUI); `edk2-ovmf` dá firmware UEFI e `dnsmasq` faz o NAT da rede padrão.
- Disco `qcow2` cresce sob demanda; `virtio` é o driver de disco/rede mais rápido em VMs Linux.
- O `virsh` gerencia VMs por CLI: `list`, `start`, `shutdown`, `dominfo`, além de `virt-clone` para clonar.
- Redes isoladas (`forward mode='none'`) criam laboratórios onde as VMs conversam entre si sem exposição à internet.

## Exercícios

1. Verifique o suporte a virtualização: procure `svm`/`vmx` em `/proc/cpuinfo` e confirme se `kvm_amd` está em `lsmod`. Anote o resultado.
2. Instale a pilha QEMU + libvirt + virt-manager e confirme que `virsh net-list` mostra a rede `default` ativa.
3. Crie uma VM Linux leve (qualquer ISO) com 2 GB de RAM e disco `qcow2` de 15 GB. Instale o sistema e confirme que ele acessa a internet pela rede NAT.
4. Use `virsh` para desligar, iniciar e consultar o estado da VM. Depois faça um clone com `virt-clone` e confirme que o clone sobe independentemente.
5. **Desafio.** Crie uma rede isolada (`mode='none'`) e anexe duas VMs a ela. Dentro de uma, suba um servidor SSH (reaproveite o capítulo 97) e, da outra, conecte-se por IP usando chave SSH. Documente a topologia da rede que você montou.