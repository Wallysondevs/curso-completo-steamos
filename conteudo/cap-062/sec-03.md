Instalar Windows no Steam Deck é uma receita que funciona, mas tem temperos que um PC comum não tem: a ESP apertada, o Secure Boot desligado de fábrica e drivers que o instalador oficial da Microsoft não traz por padrão. Feito com cuidado, o resultado é um dual boot funcional com Windows rodando em desempenho nativo.

:::objetivos
- Preparar um pendrive de instalação do Windows compatível com o Deck
- Selecionar a partição correta durante o instalador sem apagar o SteamOS
- Instalar os drivers Wi-Fi, áudio e GPU da Valve no Windows
- Lidar com o problema da entrada EFI que sequestra o boot
- Configurar BitLocker com TPM no firmware do Deck
:::

## Preparando o pendrive de instalação

O Media Creation Tool oficial da Microsoft gera um ISO que o Deck não lê bem por USB direto. A ferramenta de consenso é o **Ventoy**, que cria um pendrive multi-boot e não exige regravar o ISO a cada tentativa.

```terminal
$ ventoy -i /dev/sda
$ cp ~/Downloads/Win11_23H2.iso /run/media/deck/Ventoy/
```

O Ventoy coloca um boot loader no pendrive e, ao ligar com ele, apresenta um menu com os ISOs copiados. Basta escolher o Windows e começar a instalação.

Outra rota é o **WoeUSB** ou o `mkusb` — mas o Ventoy se tornou o caminho mais simples para quem não usa Windows como sistema de preparação.

:::dica
O Deck usa tela rotacionada em modo retrato no hardware e gira no software. Durante a instalação do Windows, a tela pode aparecer de lado. Gire fisicamente o aparelho ou, se o instalador permitir, tecle `Alt+Right Arrow` repetidamente até o vídeo se corrigir. Depois que o driver de vídeo da Valve for instalado, isso some.
:::

## O passo crítico: escolhendo a partição certa

O instalador do Windows mostra uma lista de partições numeradas. Elas **não** têm etiquetas amigáveis — são blocos com tamanho e tipo. É aqui que o dedo errado apaga o SteamOS.

Antes de iniciar o instalador, anote num papel os números e tamanhos da saída do `parted` (ou do `lsblk`) no SteamOS. No instalador, localize a partição NTFS que você criou — ela vai aparecer como "Unallocated space" ou como uma partição formatável. **Não toque** nas partições `esp`, `efi-a`, `efi-b`, `rootfs-a`, `rootfs-b`, `var-a`, `var-b` nem na `home`.

```text
# Mapa antes de instalar (exemplo)
p1   64MB  fat32  ESP    ← NÃO mexer
p2   33MB         efi-a  ← NÃO mexer
p3   33MB         efi-b  ← NÃO mexer
p4    5GB  ext4   rootfs ← NÃO mexer
...  (demais intocáveis)
p8  260GB  ext4   home   ← NÃO mexer
p9  200GB  ntfs          ← >>> INSTALE AQUI <<<
```

No instalador, selecione a partição 9, clique em "Formatar" e depois em "Avançar". O Windows criará partições auxiliares (MSR, Recovery) **dentro do espaço livre**, mas não deve tocar nas partições marcadas como ocupadas.

:::perigo
O instalador do Windows 11 em modo "Instalação Personalizada" **mostra e permite apagar** qualquer partição do disco, inclusive as do SteamOS. Leia os tamanhos; se tiver dúvida entre p8 e a destinada ao Windows, cancele e confira de novo. Uma partição apagada de 260 GB com `home` escrito é um dia de downloads perdido.
:::

## O problema do boot sequestrado

Terminada a instalação, o Deck liga direto no Windows e o SteamOS some. Isso acontece porque o instalador do Windows sobescreve o `BootOrder` da NVRAM com `Windows Boot Manager` em primeiro lugar.

A correção é simples: entre no menu de boot do firmware segurando **vol-** ao ligar, escolha **Boot from file**, navegue pela `ESP/EFI/steamos/steamcl.efi` e o SteamOS volta. Depois, de dentro do SteamOS, restaure a ordem:

```terminal
$ efibootmgr
## anote o número do Windows (ex.: 0001)
$ sudo efibootmgr -o 0000,0001
```

Ou defina SteamOS como primeira opção para sempre:

```terminal
$ sudo efibootmgr -n 0000
```

Isso resolve o sintoma, mas não a doença de fundo: se o Windows se atualizar, pode reescrever o `BootOrder` de novo. O antídoto real é instalar um boot manager (rEFInd ou Clover) que sobreviva a essas intervenções, como veremos na [seção sobre rEFInd](#/cap-062/sec-05).

## Drivers da Valve para o Windows

O Windows recém-instalado não tem driver de Wi-Fi, áudio, Bluetooth nem do acelerômetro do Deck. A Valve publica o pacote de drivers oficiais em:

`https://help.steampowered.com/en/faqs/view/6121-ECCD-D643-BAA8`

São arquivos `.exe` que você transporta por pendrive (porque o Wi-Fi ainda não funciona) e instala na ordem:

1. FCHP e SD Host Controller (chipset)
2. RTL8119 (ethernet via hub USB-C)
3. Wi-Fi (Qualcomm Atheros ou Realtek, dependendo da revisão)
4. Áudio (CS35L41)
5. GPU (AMD APU)

Após o reboot, o Wi-Fi aparece e o resto sai do Windows Update.

```terminal
## No SteamOS, copie os drivers para um pendrive FAT32:
$ monta_pendrive() {
  sudo mount /dev/sdb1 /mnt
  cp ~/Downloads/SteamDeck-Drivers/*.exe /mnt/
  sudo umount /mnt
  }
```

Com tudo instalado, o Windows no Deck fica funcional como num laptop: Wi-Fi, Bluetooth, som, GPU com aceleração DirectX completa, e a tela a 60 Hz (ou 90 Hz, no modelo OLED).

## BitLocker e firmware

O Steam Deck tem TPM 2.0 ativado no firmware, então o BitLocker funciona. O Windows 11 Home vem com criptografia de dispositivo ligada por padrão, mas a chave fica associada à conta Microsoft. Se quiser controle total, use o BitLocker gerenciado:

```terminal
## No Windows, como administrador:
C:\> manage-bde -on C: -usedspaceonly -recoverypassword
```

A opção `-usedspaceonly` acelera a criptografia inicial porque só cifra os blocos ocupados, não o disco inteiro. A chave de recuperação de 48 dígitos deve ser anotada ou guardada num gerenciador de senhas.

:::atencao
Se você desativar o Secure Boot no firmware (ele vem desligado no Deck), o Windows 11 funciona, mas jogos com anti-cheat no kernel (Vanguard, FaceIt, Easy Anti-Cheat nível kernel) podem exigir Secure Boot ligado. Ativar Secure Boot no Deck não quebra o SteamOS 3.6+, que assina seus binários com chave da Microsoft. Se estiver numa versão anterior, verifique a documentação da Valve antes de mudar essa chave.
:::

## Resumo

- Use Ventoy para criar um pendrive de instalação; copie o ISO do Windows para dentro.
- Identifique a partição NTFS de destino pelo tamanho; nunca mexa nas partições do SteamOS.
- Após instalar, o Windows sequestra o boot order — entre pelo menu de firmware e restaure com `efibootmgr`.
- Instale os drivers oficiais da Valve (chipset, Wi-Fi, áudio, GPU) na ordem documentada.
- BitLocker funciona com o TPM 2.0 do Deck; Secure Boot é desligado de fábrica mas pode ser ativado.

## Exercícios

1. Enumere os tamanhos das partições do seu Deck (`sudo parted print`) e simule em papel qual número você escolheria no instalador do Windows.
2. Crie um pendrive com Ventoy, copie um ISO de live Linux e teste o boot no Deck pelo menu de firmware.
3. Após uma instalação real ou simulada, use `efibootmgr` para identificar a entrada do Windows Boot Manager e mude a ordem com `-o`.
4. Acesse a página de drivers da Valve e baixe todos para um pendrive; identifique pelo nome do `.inf` qual driver corresponde a cada dispositivo.
5. **Desafio.** Instale o Windows de verdade (ou em VM com disco pass-through), ative o BitLocker, reinicie três vezes e confirme que a chave de recuperação está anotada fora do dispositivo.