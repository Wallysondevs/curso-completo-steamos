Número de série, versão de firmware, identificação exata do modelo — quando você abre um chamado de suporte ou compra uma peça de reposição, essas informações são o que separa "meu deck não liga" de "meu deck OLED 512 GB, revisão 3, firmware 110". O Steam Deck expõe esses dados via comandos padrão do Linux (`dmidecode`, `lspci`, `lsusb`) e via interfaces específicas do SteamOS. Esta seção ensina a extrair esse mapa de identidade.

:::objetivos
- Extrair número de série, modelo e revisão do hardware
- Identificar versão do firmware (BIOS/EFI), controladora e bootloader
- Listar o hardware interno com precisão (SSD, Wi-Fi, Bluetooth, tela)
- Documentar o sistema para um chamado de garantia ou RMA
:::

## Identificação do sistema com dmidecode

O `dmidecode` lê as tabelas SMBIOS/DMI que o firmware grava na memória — as mesmas que a Valve usa para identificar o aparelho. É o comando número um quando o suporte pergunta "qual seu número de série?".

```terminal
$ sudo dmidecode -t system
System Information
    Manufacturer: Valve
    Product Name: Jupiter
    Version: 1
    Serial Number: FVAA12345678
    UUID: a1b2c3d4-...
    Family: Steam Deck
```

O `Product Name: Jupiter` é o codinome da placa-mãe; o `Serial Number` é o número de série físico que a Valve vincula à sua conta. Esse serial é diferente do serial da caixa — o do `dmidecode` é o que o suporte consulta.

```terminal
$ sudo dmidecode -t baseboard
Base Board Information
    Manufacturer: Valve
    Product Name: Jupiter
    Version: 3
```

A versão da placa-base (`Version: 3`) indica a revisão do hardware. Steam Decks originais (LCD) usam revisões 1–3; o OLED usa revisões diferentes. Saber a revisão é útil para comprar peças de reposição compatíveis (a tela do LCD rev. 1 não é igual à do rev. 3).

:::nota
`dmidecode` requer privilégios de root porque acessa `/dev/mem`. No SteamOS, use `sudo`.
:::

## Firmware e bootloader

O Steam Deck usa firmware UEFI e um bootloader próprio que a Valve mantém. A versão do firmware aparece tanto no `dmidecode` quanto na interface de boot (acessível segurando Volume+ ao ligar).

```terminal
$ sudo dmidecode -t bios
BIOS Information
    Vendor: Valve
    Version: F7A0123
    Release Date: 01/15/2025
    Firmware Revision: 1.10
```

A `Version` do BIOS (`F7A0123`) é o build do firmware da Valve. Você pode cruzar essa versão com as notas de atualização do SteamOS para saber se está rodando o firmware mais recente — a Valve frequentemente emparelha novas versões do SteamOS com atualizações de firmware.

```terminal
$ efibootmgr -v
BootCurrent: 0000
Timeout: 2 seconds
BootOrder: 0000,0001,0002
Boot0000* SteamOS	HD(1,GPT,...)/File(\EFI\steamos\grubx64.efi)
```

O `efibootmgr` mostra as entradas de boot UEFI. SteamOS usa GRUB2 como bootloader; a partição EFI montada em `/boot/efi` contém o kernel e o initramfs.

## O SSD e o modelo exato de armazenamento

Os Steam Decks vieram com diferentes configurações de armazenamento: eMMC de 64 GB (modelo base LCD), NVMe de 256 GB, NVMe de 512 GB e NVMe de 1 TB (OLED). Saber qual é o seu — e especialmente se é o original ou um que você trocou — é vital para diagnóstico e RMA.

```terminal
$ lsblk -d -o NAME,SIZE,TYPE,TRAN,MODEL,SERIAL
NAME    SIZE TYPE TRAN   MODEL              SERIAL
mmcblk0 58.2G disk mmc   eMMC 64GB         0x00001234
```

O parâmetro `TRAN` (transport) mostra `mmc` para eMMC e `nvme` para NVMe. O modelo e serial são identificadores exatos do componente. Se o seu deck tem um SSD trocado, o modelo aqui será diferente do que o suporte da Valve espera — informação que você deve declarar no chamado.

```terminal
$ sudo nvme list 2>/dev/null || echo "NVMe not present or nvme-cli not installed"
Node                  SN                   Model                Namespace Usage
/dev/nvme0n1         S1234567890          SSD 256GB            1          256.06 GB
```

O `nvme-cli` (instalável via `sudo pacman -S nvme-cli`) fornece detalhes adicionais para SSDs NVMe, incluindo firmware do disco e saúde (SMART).

## Rede sem fio e Bluetooth

O Steam Deck LCD usa um chip Wi-Fi/Bluetooth diferente do OLED, e saber qual é o seu importa para diagnóstico de conectividade — um problema de Wi-Fi pode ser driver errado ou incompatibilidade de firmware, e o primeiro passo é identificar o hardware.

```terminal
$ lspci | grep -i network
01:00.0 Network controller: Qualcomm QCNFA765 Wireless Network Adapter (rev 01)
```

O modelo LCD usa Qualcomm QCNFA765 (Wi-Fi 6E); o OLED usa MediaTek MT7921 ou similar, dependendo da revisão. O `lspci` te diz o chip exato. Para Bluetooth (que geralmente é função do mesmo chip), use `lsusb`.

```terminal
$ lsusb | grep -i bluetooth
Bus 003 Device 002: ID 13d3:3553 IMC Networks Qualcomm Atheros Bluetooth
```

A combinação `lspci` + `lsusb` cobre a conectividade sem fio inteira. Se o Wi-Fi está instável e o `dmesg` mostra erros de firmware, saber o modelo do chip permite buscar o arquivo de firmware correto.

## Tela e controlador de áudio

A tela do Steam Deck é identificada pelo painel EDID (Extended Display Identification Data), que o kernel lê e expõe. Para áudio, o chip codec aparece no `lspci` e no `aplay`.

```terminal
$ cat /sys/class/drm/card0-eDP-1/edid | xxd | head -n 4
00000000: 00ff ffff ffff ff00 06af ed19 0101 0101
```

O EDID é binário e contém o fabricante, resolução nativa, taxa de atualização e ano de fabricação. O comando `xxd` mostra os primeiros bytes; ferramentas como `edid-decode` (do pacote `edid-decode`) traduzem para texto legível.

```terminal
$ sudo pacman -S edid-decode
$ cat /sys/class/drm/card0-eDP-1/edid | edid-decode
Manufacturer: VLV (Valve)
Model: 0x19ed
Made in: 2024
...
```

Para áudio, o chip aparece no perfil de som:

```terminal
$ aplay -l | head -n 10
card 0: acp5x [acp5x], device 0: ...
```

O `acp5x` é o codec de áudio da APU Van Gogh, integrado ao SoC. Problemas de áudio (som falhando, chiado) podem ser diagnosticados sabendo que o hardware de áudio é parte da APU, não um chip separado.

## Documentando tudo para RMA

Para um chamado de garantia, você precisa de um "dossiê de identidade" do aparelho. Uma página de terminal com os comandos certos produz tudo que o suporte precisa.

```terminal
$ echo "=== SYSTEM ===" > ~/deck-info.txt
$ sudo dmidecode -t system >> ~/deck-info.txt 2>/dev/null
$ echo "=== BIOS ===" >> ~/deck-info.txt
$ sudo dmidecode -t bios >> ~/deck-info.txt 2>/dev/null
$ echo "=== STORAGE ===" >> ~/deck-info.txt
$ lsblk -d -o NAME,SIZE,TYPE,TRAN,MODEL,SERIAL >> ~/deck-info.txt
$ echo "=== NETWORK ===" >> ~/deck-info.txt
$ lspci | grep -i network >> ~/deck-info.txt
$ echo "=== USB ===" >> ~/deck-info.txt
$ lsusb >> ~/deck-info.txt
```

O resultado é um arquivo com as informações essenciais de hardware — o complemento ideal ao pacote de logs gerado pelo `steam-logs`. Juntos, esses dois arquivos dão ao suporte da Valve a fotografia completa do seu sistema.

## Resumo

- `dmidecode -t system` extrai fabricante, modelo e número de série físico.
- `dmidecode -t bios` mostra versão do firmware; cruze com as notas de atualização do SteamOS.
- `lsblk -d -o TRAN,MODEL,SERIAL` identifica o tipo e modelo exato do armazenamento (eMMC vs NVMe).
- `lspci | grep network` e `lsusb | grep Bluetooth` identificam os chips de conectividade sem fio.
- Consolide todas as informações de hardware em um arquivo para anexar ao chamado de RMA.

## Exercícios

1. Execute `sudo dmidecode -t system` e anote o número de série e a revisão da placa-base.
2. Rode `lsblk -d -o NAME,SIZE,TYPE,TRAN,MODEL,SERIAL` e identifique o tipo e modelo exato do seu armazenamento.
3. Identifique seu chip Wi-Fi com `lspci | grep network` e seu chip Bluetooth com `lsusb | grep Bluetooth`.
4. Execute `sudo dmidecode -t bios` e confira se a versão do firmware é a mais recente, comparando com as notas de atualização do SteamOS.
5. **Desafio.** Monte um "dossiê de identidade" completo (sistema, BIOS, armazenamento, rede, USB, áudio, tela) em um arquivo `deck-info.txt`, simule a abertura de um chamado de garantia e escreva um parágrafo justificando cada bloco de informação.