Instalar os dois sistemas é metade do caminho. A outra metade é escolher, a cada ligada, qual deles vai carregar. O SteamOS e o Windows disputam a mesma partição EFI e cada um quer ser o dono da fila de boot — entender quem manda ali evita a frustração de "sumiu o SteamOS" depois da instalação.

:::objetivos
- Entender como o firmware UEFI escolhe o sistema operacional
- Configurar o bootloader do SteamOS e o do Windows
- Priorizar o SteamOS ou o Windows conforme sua preferência
- Usar um gerenciador de boot gráfico (rEFInd) para escolher no arranque
- Recuperar o boot do SteamOS quando o Windows o sobrescrever

:::

## A fila de boot da UEFI

Modernamente, quem escolhe o sistema é o firmware UEFI, não o disco. O firmware lê uma lista ordenada de entradas — cada uma apontando para um arquivo `.efi` numa partição especial FAT32 (a ESP, *EFI System Partition*). O SteamOS registra uma entrada apontando para o seu `systemd-boot`; o Windows registra outra, apontando para o `bootmgfw.efi`.

```terminal
$ efibootmgr
BootCurrent: 0001
BootOrder: 0004,0001,0000
Boot0000* SteamOS
Boot0001* Windows Boot Manager
Boot0004* UEFI OS
```

O campo `BootOrder` decide a prioridade. A entrada `SteamOS` (do `systemd-boot`) e a `Windows Boot Manager` (do Windows) coexistem na mesma ESP — em partições diferentes ou na mesma, dependendo de como a instalação aconteceu. Rodar `efibootmgr` no SteamOS mostra o estado real da fila.

:::info
O SteamOS usa `systemd-boot`, não GRUB. O menu que você vê (ou não vê) ao ligar é do `systemd-boot`, e ele respeita a `BootOrder` da UEFI. Já o Windows usa o *Windows Boot Manager*. Ambos são apenas arquivos `.efi` na partição ESP — é por isso que "apagar o bootloader" quase nunca apaga dados, só desliga a referência.
:::

## Priorizando um dos sistemas

O jeito mais simples de controlar qual sistema inicia por padrão é mexer na ordem da UEFI — dentro do SteamOS ou do Windows.

No SteamOS, com `efibootmgr`:

```terminal
$ sudo efibootmgr -o 0000,0001
```

Isso coloca o SteamOS (0000) na frente. Para zerar a preferência e deixar o menu aparecer, muitos preferem manter o SteamOS como padrão e, quando quiserem Windows, segurar [[Volume Down]] ao ligar para abrir o menu de boot manual — a mesma tecla da instalação.

No Windows, o equivalente é configurar a ordem pelo `bcdedit`, mas mexer na ordem da UEFI pelo SteamOS costuma ser mais transparente.

:::dica
O menu de boot manual (Volume Down + power) é o truque mais subestimado do capítulo inteiro. Em vez de manter um gerenciador gráfico ocupando espaço e adicionando segundos ao boot, deixe o SteamOS como padrão e use a tecla quando precisar do Windows. É rápido e não quebra nada.
:::

## Instalando um gerenciador gráfico com rEFInd

Se você alterna com frequência e quer um menu bonito a cada ligada, o **rEFInd** é a opção madura. Ele varre a ESP, encontra as entradas do Windows e do SteamOS automaticamente e desenha um menu com ícones, sem exigir configuração manual.

A instalação no SteamOS (que é Arch-based) pode ser feita com o pacote `refind` e o script `refind-install`:

```terminal
$ sudo pacman -S refind
$ sudo refind-install
```

Depois de instalar, o rEFInd se registra na UEFI e passa a carregar primeiro. A ordem dos sistemas e o timeout são controlados no arquivo `refind.conf`, na ESP. É especialmente útil em dual boot de substituição — quando não há SteamOS para chamar o menu.

:::atencao
O SteamOS tem sistema de arquivos somente leitura em `/usr` fora do usuário `deck` no modo padrão. Instalar pacotes com `pacman` diretamente pode ser bloqueado ou ser revertido na próxima atualização do sistema. Para instalar rEFInd (ou qualquer pacote) de forma persistente, use o ambiente de desenvolvimento com o filesystem desbloqueado ou instale manualmente os binários na ESP. Não trate o SteamOS como um Arch comum.
:::

## Recuperando o boot do SteamOS

O cenário mais temido: você instala o Windows, e ao ligar o Deck o SteamOS simplesmente não aparece — o Windows colocou o seu `bootmgfw.efi` na frente e o `systemd-boot` sumiu da lista.

A entrada do SteamOS quase sempre continua lá, só perdeu a prioridade. Recuperar é reordenar:

```terminal
$ sudo efibootmgr -o 0000,0001
```

Se a própria entrada `SteamOS` foi apagada (mais raro), recrie-a apontando para o `.efi` do `systemd-boot` na ESP e adicione-a de volta à `BootOrder`. Em último caso, o *recovery image* da Valve reconstrói a partição EFI inteira sem tocar em `home` — por isso o backup do recovery que você fez na seção 2 vale ouro.

## Resumo

- A UEFI escolhe o sistema por uma lista ordenada de entradas `.efi` na ESP.
- O SteamOS usa `systemd-boot`; o Windows usa o *Windows Boot Manager*.
- `efibootmgr -o` reordena a prioridade de boot no SteamOS.
- O menu manual (Volume Down + power) evita a necessidade de gerenciador gráfico.
- rEFInd dá um menu gráfico, mas instalar no SteamOS exige filesystem desbloqueado.

## Exercícios

1. Rode `sudo efibootmgr` no SteamOS e anote o `BootOrder` e cada entrada. Qual sistema inicia por padrão hoje?
2. Altere a ordem com `efibootmgr -o` para priorizar o SteamOS. Reinicie para confirmar, e depois volte à configuração anterior.
3. Teste o menu manual: desligue, segure Volume Down e ligue. Liste as entradas que aparecem e compare com o `BootOrder`.
4. Explique, em prosa, a diferença entre "apagar o bootloader" e "apagar a entrada da UEFI". Por que o primeiro quase nunca destrói dados?
5. **Desafio.** Identifique na ESP qual arquivo `.efi` corresponde ao `systemd-boot` do SteamOS e qual corresponde ao `bootmgfw.efi` do Windows, e proponha um comando `efibootmgr` para recriar uma entrada `SteamOS` se ela fosse apagada.