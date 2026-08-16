Com dois ou mais sistemas instalados, a primeira coisa que você nota é que cada instalador quer ser dono do boot: o Windows rebaixa o SteamOS, o GRUB esconde o Windows, e ninguém apresenta um menu único. O rEFInd resolve isso com elegância — um boot manager visual que detecta sozinho tudo o que há para iniciar, sem você manter listas de configuração.

:::objetivos
- Instalar o rEFInd na ESP do Steam Deck
- Entender a detecção automática de kernels e `.efi` do rEFInd
- Personalizar o menu com `refind.conf` (temas, ícones, timeout)
- Mascarar entradas indesejadas e definir um sistema padrão
- Diagnosticar por que o rEFInd não aparece no boot
:::

## O que o rEFInd faz de diferente

O rEFInd é um **boot manager puro**, na definição que fixamos [na seção de fundamentos](#/cap-062/sec-01). Ele não carrega kernel por conta própria: procura, em toda ESP e em partições com kernel Linux, quais sistemas existem, e entrega o controle ao `.efi` ou ao kernel escolhido.

Essa detecção acontece a cada boot. O rEFInd lê:

- arquivos `.efi` dentro de todas as partições ESP do disco;
- kernels `vmlinuz-*` e `bzImage-*` em partições Linux, montando-as só para ler;
- a NVRAM do firmware para entradas `Windows Boot Manager`.

Isso significa que, ao instalar um sistema novo, ele aparece no rEFInd sem nenhuma edição — o oposto do GRUB, que exige o `update-grub` e o `os-prober`.

## Instalando o rEFInd

No SteamOS, o root é imutável, então a instalação do rEFInd é feita manualmente, copiando os arquivos direto para a ESP. O pacote pode ser baixado como binário ZIP do site oficial (roddsbooks.com/refind) ou instalado a partir de um live Linux.

```terminal
## Monte a ESP
$ sudo mount /dev/nvme0n1p1 /mnt

## Copie o conteúdo do pacote rEFInd
$ sudo cp -r /run/media/deck/refind-bin-0.14.2/* /mnt/EFI/refind/

## Crie a entrada na NVRAM apontando para o rEFInd
$ sudo efibootmgr -c -d /dev/nvme0n1 -p 1 -L rEFInd -l '\EFI\refind\refind_x64.efi'
```

O último comando grava uma nova entrada `rEFInd` na NVRAM, com o caminho do `.efi` entre aspas simples e barras invertidas — o `efibootmgr` exige o caminho no formato Windows/EFI, não no formato Unix.

Para o rEFInd aparecer primeiro:

```terminal
## Descubra o número da nova entrada (ex.: 0004)
$ sudo efibootmgr
$ sudo efibootmgr -o 0004,0000,0001
```

:::dica
O rEFInd também funciona sem entrada na NVRAM: ele se instala em `ESP/EFI/BOOT/bootx64.efi`, o caminho que **todo** firmware UEFI tenta executar por padrão. Se você colocar o `refind_x64.efi` renomeado para esse caminho, o rEFInd carrega mesmo que a NVRAM seja apagada — é o truque de resiliência que sobrevive a atualizações de Windows que reescrevem o `BootOrder`.
:::

## Configurando o `refind.conf`

O comportamento do rEFInd é controlado por `refind.conf`, que fica na ESP, em `EFI/refind/refind.conf`. Ele lê em texto simples, e a maioria das linha vem comentada com `#`.

```ini
## refind.conf no Steam Deck

## atraso antes de iniciar a entrada padrão
timeout 5

## resolução e tema
resolution 1280 800
use_graphics_for linux,windows

## mostrar ícones dos sistemas
showtools shutdown,reboot

## qual sistema inicia se nada for escolhido
default_selection SteamOS
```

O `default_selection` aceita o rótulo exato do sistema ("SteamOS", "Windows"), ou um *substring* — `default_selection Windows` ativa qualquer entrada que contenha "Windows".

Para um tema com ícones grandes e legível na tela de 7/7.4 polegadas, baixe um tema como `rEFInd-minimal` e aponte no arquivo:

```ini
include themes/rEFInd-minimal/theme.conf
```

Os arquivos de tema também vivem na ESP, dentro de `EFI/refind/themes/`.

## Mascarando entradas indesejadas

A detecção automática do rEFInd é uma faca de dois gumes: ele exibe **tudo**, inclusive as entradas `efi-a` e `efi-b` do mecanismo A/B do SteamOS e kernels antigos que você não quer ver. O `dont_scan_volumes` e o `dont_scan_dirs` limpam o menu.

```ini
## esconder partições e arquivos específicos
dont_scan_volumes "efi-a","efi-b","var-a","var-b"
dont_scan_dirs ESP:/EFI/refind
dont_scan_files shimx64.efi,mmx64.efi
```

Uma alternativa mais fina é criar um arquivo `boot/refind_linux.conf` dentro da ESP com os parâmetros de kernel que você quer oferecer para o SteamOS, e usar `dont_scan_volumes` para esconder as varreduras automáticas que geram duplicatas.

Para esconder uma entrada específica de uma vez só, o menu tem o atalho: selecione o ícone, tecle `Delete`, e confirme. O rEFInd grava a decisão e deixa de exibir aquele item.

:::atencao
Mascarar pelo rótulo via `dont_scan_dirs` e `dont_scan_volumes` usa o **nome da partição ou do diretório**, não o nome exibido. Para descobrir o nome que o rEFInd enxerga, ative temporariamente `textmode` (1) no `refind.conf` e observe as entradas; lá aparece o path interno que você deve mascarar.
:::

## O que fazer quando o rEFInd não aparece

Se após a instalação o Deck continua indo direto para o SteamOS ou o Windows, o diagnóstico segue três caminhos em ordem:

```terminal
## 1) a entrada foi gravada?
$ sudo efibootmgr | grep -i refind

## 2) o arquivo .efi existe no caminho esperado?
$ sudo ls -l /mnt/EFI/refind/refind_x64.efi

## 3) o caminho na NVRAM bate com o arquivo?
$ sudo efibootmgr -v
```

O erro mais comum é gravar o caminho com barras erradas. O `efibootmgr` quer `\EFI\refind\refind_x64.efi`, mas muita gente grava `/EFI/refind/refind_x64.efi`, que o firmware não resolve. Confira com `efibootmgr -v` e regrave se necessário.

```terminal
## Corrija a entrada apagando e recriando
$ sudo efibootmgr -b 0004 -B
$ sudo efibootmgr -c -d /dev/nvme0n1 -p 1 -L rEFInd -l '\EFI\refind\refind_x64.efi'
```

Outra causa frequente: a ESP do Deck está cheia (64 MB) e a cópia do rEFInd foi truncada. Limpe ícones de temas desnecessários ou mova o rEFInd para uma ESP maior.

## Resumo

- rEFInd é um boot manager puro: detecta kernels e `.efi` a cada boot, sem `update-grub`.
- Instala-se copiando os arquivos para a ESP e criando uma entrada com `efibootmgr -c`.
- O `default_selection` e o `timeout` controlam o sistema padrão e o atraso no `refind.conf`.
- `dont_scan_volumes` e `dont_scan_dirs` mascararam entradas duplicadas e indesejadas.
- Instalar em `EFI/BOOT/bootx64.efi` torna o rEFInd resiliente até a NVRAM ser zerada.

## Exercícios

1. Baixe o binário do rEFInd, monte a ESP e copie os arquivos para `EFI/refind/`.
2. Crie a entrada de boot com `efibootmgr -c` e confirme com `efibootmgr -v` o caminho gravado.
3. Edite o `refind.conf` para definir `timeout 5`, um tema e `default_selection SteamOS`.
4. Use `dont_scan_volumes` para esconder `efi-a` e `efi-b` do menu e reinicie para confirmar.
5. **Desafio.** Instale o rEFInd em `EFI/BOOT/bootx64.efi`, apague a entrada da NVRAM (`-b X -B`), reinicie e prove que o rEFInd continua carregando pelo caminho de fallback do firmware.