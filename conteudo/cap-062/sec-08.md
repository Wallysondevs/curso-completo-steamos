O dual boot, um dia, deixa de fazer sentido: você voltou a jogar tudo no SteamOS, o Windows deixou de ser necessário ou simplesmente quer o espaço de volta. Desfazer é mais delicado do que montar, porque o objetivo é remover um sistema inteiro preservando o outro — e recuperar centenas de gigas no `home`. A ordem das operações importa, e o `rm` aqui é destrutivo.

:::objetivos
- Planejar a remoção segura de um sistema preservando o SteamOS
- Remover as entradas de boot do sistema eliminado com `efibootmgr`
- Apagar as partições do sistema e os arquivos `.efi` da ESP
- Redimensionar o `home` para reincorporar o espaço liberado
- Verificar a integridade do SteamOS após a remoção
:::

## Antes de qualquer `rm`: planeje e confirme

A remoção de um sistema é um passe de ida. Antes de executar, confirme três coisas que evitam arrependimento:

1. **Qual sistema você está removendo, mesmo.** Anote os números de partição do alvo com `sudo parted print` e confira duas vezes. O disco não pergunta "tem certeza?" na segunda leitura.
2. **O que você precisa preservar.** Saves, configs, arquivos do Windows ou da distro que serão perdidos. Copie-os para fora antes (`rsync`).
3. **Onde está o boot do sistema que fica.** Você não quer apagar a ESP ou a entrada do SteamOS junto com a do Windows.

A regra de ouro, igual à do particionamento, continua valendo:

:::perigo
Apagar uma partição é **definitivo**. Não há lixeira no `parted`. Apagar a partição errada (a `home`, a `rootfs`, a ESP) pode tornar o SteamOS ininicializável ou destruir sua biblioteca inteira. Faça backup, anote os números e valide o alvo antes de cada comando destrutivo.
:::

## Entendendo o que será apagado

Num dual boot Windows + SteamOS típico, o layout tem três camadas de resíduos a limpar:

```terminal
$ sudo parted /dev/nvme0n1 print
Number  Start   End     Size    File system  Name  Flags
 1      4096B   68,7MB  68,7MB  fat32             esp   boot, esp
 ...
 8      11,1GB  270GB   259GB   ext4              home
 9      270GB   470GB   200GB   ntfs              win_games
10      470GB   471GB   512MB   ntfs              win_recovery
```

Note que o Windows costuma criar uma partição de recuperação extra (`win_recovery`), além da principal (`win_games`). Ambas devem ser removidas para liberar todo o espaço. A partição `esp` (1) é compartilhada — **não se apaga a ESP**; apenas se remove a pasta do Windows de dentro dela.

## Removendo o boot do sistema eliminado

Comece pela NVRAM, antes de tocar no disco. Se a ordem for invertida (apagar partição e depois a entrada), o firmware pode tentar iniciar um boot loader que já não existe e ficar em loop.

```terminal
## Liste as entradas e localize a do Windows
$ sudo efibootmgr
BootOrder: 0003,0000,0001
Boot0000* SteamOS
Boot0001* Windows Boot Manager
Boot0003* rEFInd

## Remova a entrada do sistema eliminado
$ sudo efibootmgr -b 0001 -B
```

Se o sistema eliminado era o padrão (primeiro do `BootOrder`), reordene para que o SteamOS ou o rEFInd assumam:

```terminal
$ sudo efibootmgr -o 0000,0003
```

Depois, limpe a pasta do Windows de dentro da ESP:

```terminal
$ esp
$ sudo rm -rf /mnt/EFI/Microsoft
$ unesp
```

Deixar a pasta `Microsoft` na ESP não quebra nada, mas consumia ~10 MB dos seus 64 MB — e é bom limpar para ganhar folga.

## Apagando as partições

Com a NVRAM e a ESP limpas, é hora de remover as partições do espaço. O `parted rm` remove pela numeração:

```terminal
## Remova as partições do sistema eliminado (da maior para a menor,
## ou em qualquer ordem, desde que os números estejam corretos)
$ sudo parted /dev/nvme0n1 rm 10
$ sudo parted /dev/nvme0n1 rm 9
```

Confira o resultado:

```terminal
$ sudo parted /dev/nvme0n1 print
Number  Start   End     Size    File system  Name  Flags
 1      4096B   68,7MB  68,7MB  fat32             esp   boot, esp
 ...
 8      11,1GB  270GB   259GB   ext4              home
```

As partições 9 e 10 sumiram, e o espaço delas virou "espaço livre" no fim do disco.

:::atencao
O `parted rm` apaga a entrada da tabela GPT, mas **não** grava zeros nos setores. Os dados ficam tecnicamente recuperáveis até serem sobrescritos. Se você vai vender ou doar o Deck, rode um *wipe* antes: `sudo dd if=/dev/zero of=/dev/nvme0n1 bs=1M seek=<início> count=<tamanho>` — mas entenda que isso é só para privacidade, não para a remoção funcional.
:::

## Recuperando o espaço no `home`

Apagar as partições libera espaço no disco, mas ele fica fora do `home`. Para a biblioteca do SteamOS voltar a usar esses gigas, o `home` precisa ser redimensionado para ocupar o espaço livre — o inverso do encolhimento da [seção de particionamento](#/cap-062/sec-02).

O crescimento é mais seguro que o encolhimento porque é feito **com a partição montada** e os dados no lugar (para ext4):

```terminal
## O home está montado e em uso — cresça a partição até o fim
$ sudo parted /dev/nvme0n1 resizepart 8 100%
$ sudo resize2fs /dev/nvme0n1p8
```

O `resize2fs` sem argumentos expande o sistema de arquivos até o tamanho da partição. Note a ordem: primeiro a partição (`resizepart`), depois o sistema de arquivos (`resize2fs`) — o contrário do encolhimento.

```terminal
## Confirme o novo tamanho
$ df -h /home
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p8  450G  312G  123G  72% /home
```

Se preferir uma interface gráfica, o `gparted` faz esse crescimento com uns poucos cliques e é mais difícil de errar.

:::dica
Se o espaço livre não estiver **imediatamente depois** da partição `home` (porque o Windows ficava no meio do disco e você removeu só uma das partições), o `resizepart` não consegue crescer contiguamente. Nesse caso, mova as partições intermediárias com `gparted` (operação lenta) ou reorganize o setup. Por isso, deixa-se o segundo sistema sempre no fim do disco ao instalar.
:::

## Verificando a integridade do SteamOS

Depois de apagar partições e redimensionar, reinicie e verifique se o SteamOS continua íntegro:

```terminal
## 1) boot normal? abra o shell e chegue o partitionamento
$ sudo parted /dev/nvme0n1 print

## 2) o sistema de arquivos home está limpo?
$ sudo e2fsck -f /dev/nvme0n1p8

## 3) a NVRAM está sem fantasmas?
$ sudo efibootmgr

## 4) o SteamOS abre os jogos e o modo jogo volta?  
```

Se algum jogo ou Flatpak se comportar estranho após o redimensionamento, um `steamos-update` + reboot costuma assentar bibliotecas que dependiam do layout anterior. Raramente algo quebra no redimensionamento do `home`, mas a verificação fecha o ciclo com segurança.

## Resumo

- Anote os números de partição do alvo e faça backup antes de qualquer comando destrutivo.
- Remova primeiro a entrada da NVRAM (`efibootmgr -b X -B`) e a pasta `.efi` da ESP, depois as partições (`parted rm`).
- Apague todas as partições do sistema removido, inclusive a de recuperação auxiliar.
- Para devolver o espaço ao SteamOS, cresça o `home` com `resizepart 8 100%` + `resize2fs`.
- Reinicie e valide `parted print`, `e2fsck`, `efibootmgr` e o modo jogo.

## Exercícios

1. Num pendrive, crie duas partições, simule um dual boot e execute `parted rm` numa delas observando o espaço virar "free".
2. Liste as entradas NVRAM com `efibootmgr`, identifique uma de teste e remova com `-b X -B`, confirmando a ausência.
3. Monte a ESP, crie uma pasta fictícia `Microsoft`, remova com `rm -rf` e verifique o espaço recuperado com `du -sh /mnt/EFI/*`.
4. Com um sistema real ou simulado, execute o crescimento de uma partição ext4 (`resizepart` + `resize2fs`) e confira com `df -h`.
5. **Desafio.** Documente o passo a passo completo da remoção do seu dual boot (se houver) em um arquivo de texto, incluindo os valores reais de `parted print` e `efibootmgr`, e execute apenas a etapa de backup — depois proponha, sem executar, a sequência destrutiva completa.