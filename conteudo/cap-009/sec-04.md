A APU e a RAM resolvem processamento. Falta onde guardar os jogos. O Steam Deck usa **SSD NVMe** no formato M.2 2230 — minúsculo, mas rápido o bastante para carregamentos instantâneos. Há também o slot para microSD, mas esta seção foca no armazenamento interno: como ele aparece para o sistema, como inspecioná-lo e o que a interface PCIe Gen 3 x4 significa no mundo real.

:::objetivos
- Identificar o SSD via `lsblk`, `nvme list` e `sudo lshw`
- Interpretar as partições padrão do SteamOS e seus sistemas de arquivos
- Entender o formato M.2 2230 e por que ele não é um NVMe comum
- Medir o desempenho do SSD com ferramentas do sistema
- Verificar a saúde e a temperatura do NVMe via SMART
:::

## SSD no Deck: M.2 2230, NVMe, Gen 3

O formato físico do SSD é **M.2 2230**: 22 mm de largura por 30 mm de comprimento — mais curto que os M.2 2280 (de 80 mm) comuns em notebooks e desktops. A Valve o aparafusa atrás de uma blindagem metálica que funciona tanto como dissipador térmico quanto como proteção contra interferência eletromagnética. Você pode trocá-lo, mas precisa de um SSD 2230: um 2280 literalmente não cabe.

O protocolo é **NVMe** (Non-Volatile Memory Express) sobre **PCIe Gen 3 x4**. O "x4" significa 4 linhas PCIe — cada linha Gen 3 entrega aproximadamente 1 GB/s, totalizando algo perto de 4 GB/s de largura de banda teórica. Na prática, a latência do NVMe é o que torna os carregamentos de jogo quase instantâneos, mais do que a banda máxima.

Os modelos LCD de 64GB usam **eMMC** (uma espécie de cartão de memória soldado, mais lento), e não NVMe. Esses são os que mais se beneficiam de um upgrade de SSD, embora a Valve desencoraje a abertura da máquina.

:::atencao
Trocar o SSD do Deck é possível, mas implica riscos: o parafuso traseiro é autorroscante, a blindagem pode danificar componentes se removida com força, e o SSD novo precisa ser compatível com PCIe Gen 3 (um Gen 4 funciona, mas na velocidade Gen 3). Além disso, a bateria deve ser desconectada ou estar abaixo de 25% antes de qualquer mexida interna.
:::

## Vendo o disco com `lsblk`

O `lsblk` (*list block devices*) é o jeito mais rápido de ver discos e partições:

```terminal
$ lsblk -o NAME,SIZE,TYPE,MOUNTPOINT,FSTYPE,LABEL,MODEL
NAME        SIZE TYPE  MOUNTPOINT              FSTYPE LABEL        MODEL
mmcblk0   238.8G disk                                                
├─mmcblk0p1  64M part  /efi                    vfat   EFI           
├─mmcblk0p2  32M part                          vfat   EFI-B         
├─mmcblk0p3 256M part                          ext4   ROOT-B        
├─mmcblk0p4   5G part  /                       ext4   ROOT-A        
├─mmcblk0p5   5G part                          ext4   ROOT-B        
├─mmcblk0p6 256M part  /var                    ext4   VAR           
├─mmcblk0p7 256M part                          ext4   VAR-B         
└─mmcblk0p8 233G part  /home                   ext4   HOME
nvme0n1    512.1G disk                                                
├─nvme0n1p1  64M part  /efi                    vfat   EFI           
├─nvme0n1p2  32M part                          vfat   EFI-B         
├─nvme0n1p3 256M part                          ext4   ROOT-B        
├─nvme0n1p4   5G part  /                       ext4   ROOT-A        
├─nvme0n1p5   5G part                          ext4   ROOT-B        
├─nvme0n1p6 256M part  /var                    ext4   VAR           
├─nvme0n1p7 256M part                          ext4   VAR-B         
└─nvme0n1p8 511G part  /home                   ext4   HOME
```

O Deck com SSD NVMe mostra `nvme0n1` como disco principal. As partições revelam o esquema de atualização A/B do SteamOS: `/` (raiz) tem duas cópias idênticas de 5GB (`ROOT-A` e `ROOT-B`), junto com `/var` em partição separada. `/home` leva quase todo o espaço restante — é lá que os jogos ficam, dentro de `~/.local/share/Steam/`.

O nome `nvme0n1` significa: controlador NVMe número 0, namespace 1. Se houvesse um segundo SSD (via hub USB-C, por exemplo), seria `nvme1n1`.

## `nvme list`: o inventário do NVMe

O pacote `nvme-cli` traz ferramentas específicas para discos NVMe. O mais simples é o inventário:

```terminal
$ sudo nvme list
Node                  Generic               SN                   Model                                    Namespace  Usage                      Format           FW Rev
--------------------- --------------------- -------------------- ---------------------------------------- ---------- -------------------------- ---------------- --------
/dev/nvme0n1          /dev/ng0n1            XXXXXXXXXXXXXXXX     KBG40ZNV512G KIOXIA                       1         512.11  GB / 512.11  GB    512   B +  0 B   AEGA0102
```

Aqui o SSD é um KIOXIA (antiga Toshiba Memory) de 512GB, modelo KBG40ZNV512G. O campo `Usage` mostra 512.11 GB e o `Format` indica setores de 512 bytes sem proteção extra — típico de SSDs de consumo.

O `nvme` também expõe os detalhes de baixo nível:

```terminal
$ sudo nvme id-ctrl /dev/nvme0n1 | grep -E 'mn|fr|tnvmcap|mtfa|ver'
mn      : KBG40ZNV512G KIOXIA
fr      : AEGA0102
tnvmcap : 512110190592
ver     : 10300
```

`tnvmcap` é a capacidade total em bytes (512.110.190.592 = 512GB), `fr` é a revisão do firmware e `ver` a versão da especificação NVMe suportada (1.3.0).

## SMART: saúde e temperatura do SSD

SSDs NVMe têm registradores SMART (Self-Monitoring, Analysis and Reporting Technology) que contam horas de uso, dados escritos, temperatura e erros:

```terminal
$ sudo nvme smart-log /dev/nvme0n1
Smart Log for NVME device:nvme0n1 namespace-id:ffffffff
critical_warning                    : 0
temperature                         : 34 C
available_spare                     : 100%
available_spare_threshold           : 10%
percentage_used                     : 2%
data_units_read                     : 8,421,334
data_units_written                  : 5,123,088
host_read_commands                  : 234,112,445
host_write_commands                 : 187,334,221
controller_busy_time                : 1,248
power_cycles                        : 847
power_on_hours                      : 1,456
unsafe_shutdowns                    : 12
media_errors                        : 0
num_err_log_entries                 : 0
```

Os campos que pedem atenção: `critical_warning` deve ser `0` (zero = sem alertas), `temperature` deve ficar abaixo de 70°C sob carga, `percentage_used` é a vida útil consumida (2% aqui = disco quase novo), `media_errors` e `num_err_log_entries` devem ser zero. `unsafe_shutdowns` conta desligamentos bruscos (segurar o botão power ou bateria descarregada com o sistema ativo).

:::dica
Em uso intenso (instalação de jogos grandes), a temperatura do NVMe pode subir rápido. Monitore com:

```terminal
$ watch -n2 'sudo nvme smart-log /dev/nvme0n1 | grep temperature'
```
:::

## O caso eMMC de 64GB

Os Decks LCD de 64GB não têm NVMe. O armazenamento é **eMMC** (Embedded MultiMediaCard) — um chip de memória flash soldado na placa, com controlador integrado e interface mais lenta que a NVMe. O nome no sistema é `mmcblk0` em vez de `nvme0n1`:

```terminal
$ lsblk -o NAME,SIZE,ROTA,TRAN /dev/mmcblk0
NAME        SIZE ROTA TRAN
mmcblk0   58.2G    0 mmc
```

`ROTA=0` confirma que é flash (não rotacional), `TRAN=mmc` revela a interface. Esses modelos têm desempenho de leitura sequencial na casa dos 300-400 MB/s, contra os 2000-3500 MB/s do NVMe. O `nvme` CLI não funciona com eMMC; você usa `lsblk` e `smartctl` (do smartmontools) para diagnóstico.

:::info
Embora o eMMC não seja NVMe, ele também usa o barramento e a mesma pilha de blocos do kernel. O caminho `/sys/block/mmcblk0/` expõe estatísticas de I/O idênticas às de um NVMe.
:::

## Resumo

- O Deck usa SSD M.2 2230 NVMe (PCIe Gen 3 x4) ou eMMC de 64GB nos modelos LCD de entrada.
- `lsblk` exibe o layout de partições A/B do SteamOS, com `/home` ocupando a maior parte.
- O comando `nvme list` e `nvme id-ctrl` mostram modelo, firmware e capacidade do NVMe.
- `nvme smart-log` expõe temperatura, porcentagem de vida útil gasta, erros de mídia e ciclos de energia.
- eMMC aparece como `mmcblk0` e não responde ao CLI `nvme`; use `lsblk` e `smartctl`.
- Trocar o SSD exige formato 2230, desconexão da bateria e compatibilidade PCIe Gen 3.

## Exercícios

1. Identifique seu disco com `lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINT`. É `nvme` ou `mmcblk`?
2. Rode `sudo nvme list` (ou `lsblk` se for eMMC) e anote modelo, capacidade e firmware.
3. Execute `sudo nvme smart-log /dev/nvme0n1` e interprete `percentage_used` e `temperature`. Seu SSD está saudável?
4. Liste o espaço em disco: `df -h /home`. Quantos GB os jogos ocupam? Compare com o tamanho total da partição em `lsblk`.
5. **Desafio.** Se seu Deck for de 64GB eMMC, pesquise no `dmesg` quantos MB/s o kernel reporta para o barramento mmc: `sudo dmesg | grep -i mmc`. Se for NVMe, faça o mesmo: `sudo dmesg | grep -i nvme`. A velocidade declarada no boot bate com a medida com `hdparm -t /dev/nvme0n1`?