Com o pendrive pronto e os drivers baixados, chega a hora de criar a partição e instalar o Windows no SSD interno. É aqui que a maioria das pessoas quebra o SteamOS sem querer: o instalador do Windows não entende o esquema de partições do SteamOS e, se você não escolher o espaço certo, apaga tudo.

:::objetivos
- Preparar espaço no SSD para o Windows sem tocar nas partições do SteamOS
- Reconhecer as partições que o SteamOS cria e preservá-las
- Instalar o Windows na partição correta
- Entender por que o tipo (NTFS/APFS/ext4) das partições se confunde no instalador
- Finalizar a instalação e a configuração inicial

:::

## Mapeando o disco antes de tocar em nada

O SteamOS particiona o SSD em um layout que o instalador do Windows exibe de forma pouco amigável. Antes de reiniciar, entenda o que está no disco — no terminal do SteamOS:

```terminal
$ lsblk -o NAME,SIZE,FSTYPE,PARTLABEL
NAME         SIZE FSTYPE PARTLABEL
nvme0n1    931.5G
├─nvme0n1p1   64M vfat   efi
├─nvme0n1p2   32M        spares
├─nvme0n1p3  128M        efi
├─nvme0n1p4  256M        rootfs-a
├─nvme0n1p5  256M        rootfs-b
├─nvme0n1p6    5G ext4   var-a
├─nvme0n1p7    5G ext4   var-b
└─nvme0n1p8 920.6G ext4   home
```

O SteamOS usa um esquema A/B (pares `rootfs-a`/`rootfs-b` e `var-a`/`var-b`) — é assim que ele aplica atualizações atômicas e oferece rollback. A partição grande `home` é onde ficam jogos, saves e os dados do usuário. Nada daqui deve ser apagado se você quer manter o SteamOS.

As partições a preservar em um dual boot: **todas** do SteamOS, exceto o espaço que você vai encolher de `home`. Em substituição total, o disco inteiro será recriado do zero.

## Encolhendo a partição `home`

Para um dual boot, você precisa criar espaço vazio. O método mais limpo é reduzir a partição `home` ainda dentro do SteamOS, deixando o espaço livre **não alocado** para o instalador do Windows.

O SteamOS não tem GParted pré-instalado, mas o modo Desktop permite usar o `parted`. O caminho recomendado, porém, é reiniciar e encolher já no instalador do Windows: ele tem uma ferramenta de partição simples, e reduzir ali evita incompatibilidade de ferramentas.

:::perigo
Nunca deixe o instalador do Windows "usar o espaço livre automaticamente" sem antes confirmar quais partições ele vai apagar. O assistente costuma marcar o disco inteiro, incluindo as partições A/B do SteamOS. Se você confirmar sem ler, o SteamOS morre — e só o *recovery image* da Valve o trará de volta.
:::

## O diálogo de partições do instalador

No instalador do Windows, a tela de particionamento lista o disco e as partições existentes. As partições do SteamOS aparecem sem rótulo amigável — o Windows não lê `ext4` nem entende o esquema A/B, então mostra "Unallocated Space" ao lado de entradas de tipo "Unknown".

O procedimento para dual boot:

1. Escolha o espaço **não alocado** que você deixou ao encolher `home`.
2. Clique em **New** e defina o tamanho (ex.: 120 GB = 122880 MB).
3. O Windows cria automaticamente suas partições de sistema (EFI, MSR, recuperação) + a partição principal NTFS.
4. Instale na partição **Primary** (a NTFS grande), nunca nas pequenas de sistema.

Substituição total é diferente: apague **todas** as partições, selecione o espaço não alocado inteiro e clique em **Next** — o Windows recria a tabela do zero.

O resultado, visto de volta pelo SteamOS depois, revela o que o instalador criou no lugar do antigo `home`:

```terminal
$ lsblk -o NAME,SIZE,FSTYPE,PARTLABEL
NAME         SIZE FSTYPE PARTLABEL
nvme0n1    931.5G
├─nvme0n1p1  100M vfat   SYSTEM
├─nvme0n1p2   16M        MSR
├─nvme0n1p3  919.4G ntfs  OS
└─nvme0n1p4  972M ntfs  WINRETOOLS
```

O Windows usa três partições de sistema (EFI, MSR e recuperação) mais a principal `OS` em NTFS. O `ext4` e o esquema A/B do SteamOS desapareceram porque o disco foi reformatado por inteiro — é a diferença irreversível entre "substituir" e "conviver".

```terminal
$ # Duas ou três reinicializações depois, o Windows pede conta, região e rede.
$ # No OOBE (out-of-box experience), pule a rede se quiser criar conta local.
```

:::dica
O instalador do Windows 11 costuma exigir conexão e conta Microsoft na configuração inicial. Para criar uma conta local sem truques extras, desconecte o Wi-Fi no OOBE — em muitas builds isso libera a opção "Não tenho internet" e permite criar o usuário local com senha em vez de PIN.
:::

## O seguinte código mostra a gravação do Windows na partição NTFS:

```terminal
$ # No PowerShell como administrador, identifique o disco antes:
$ Get-Disk | Where-Object {$_.BusType -eq "NVMe"}
Number Friendly Name       Serial Number         HealthStatus  OperationalStatus
------ ----------------    ------------------    -----------   -----------------
0      KINGSTON SNV2S1000G 50026B7684A1BCDE      Healthy        OK
```

Depois do primeiro boot

O primeiro boot no Windows é o momento de instalar os drivers (seção 3), nesta ordem, antes de qualquer outra coisa. A tela fica em 800p e sem toque, o que torna a navegação trabalhos — use o touchpad do Deck ou um teclado/mouse USB.

Logo em seguida, ajuste a resolução para `1280x800` (a nativa do painel) e desligue o dimensionamento de DPI se os textos ficarem minúsculos. O Windows detecta o painel como uma tela de tablet; o ajuste de orientação automática pode girar a imagem — desative a rotação automática nas configurações de exibição se isso incomodar.

## Resumo

- O SteamOS usa layout A/B; `home` é a partição grande com jogos e saves.
- Para dual boot, encolha `home` e instale no espaço não alocado.
- O instalador do Windows não rotula partições ext4; confirme antes de apagar.
- Deixe o Windows criar suas partições de sistema, e instale na NTFS principal.
- Instale os drivers da Valve logo após o primeiro boot, na ordem correta.

## Exercícios

1. No SteamOS, rode `lsblk -o NAME,SIZE,FSTYPE,PARTLABEL` e desenhe o layout do seu disco. Marque quais partições são do esquema A/B.
2. No instalador do Windows, identifique visualmente qual entrada corresponde à partição `home` do SteamOS. Qual pista você usou para reconhecê-la?
3. Faça um dual boot com uma partição de 120 GB. Documente cada clique da tela de particionamento.
4. Explique a diferença entre "espaço não alocado" e "partição formatada" do ponto de vista do instalador.
5. **Desafio.** Depois de instalar, no SteamOS confira se as partições A/B continuam intactas com `lsblk`. Proponha um comando para validar que o par `rootfs-a`/`rootfs-b` tem tamanho idêntico — e diga por que essa simetria é o sinal de que o esquema atômico sobreviveu.