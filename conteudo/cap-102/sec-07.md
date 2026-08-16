O Steam Deck é um console disfarçado de PC, e consoles têm uma propriedade que desktops não têm: a garantia de que o sistema **sempre** liga, mesmo depois de uma atualização malfeita. Essa garantia vem de três decisões encadeadas — o root de leitura-penas, a atualização atômica e o esquema A/B com rollback. Entender como o Deck atualiza a si mesmo é entender por que ele não vira um "tijolo" como tantos PCs viram após uma atualização de sistema que deu errado no meio.

:::objetivos
- Entender por que o root do Deck é somente-leitura e como contornar isso
- Compreender a atualização atômica e o esquema A/B com rollback
- Diferenciar ostree, RAUC e o esquema próprio do SteamOS
- Inspecionar o estado da atualização com `rauc status` e `steamos-update`
- Verificar a integridade da imagem e o estado read-only da raiz
:::

## Imutabilidade e read-only root

A **imutabilidade** no SteamOS significa uma coisa muito concreta: a partição raiz (o `/`) é montada **somente-leitura**. O squashfs que [vimos na seção de sistema de arquivos](#/cap-102/sec-06) é compactado e imutável por natureza — você não consegue editar um arquivo dentro de uma imagem squashfs. A Valve escolheu esse caminho por três motivos que se reforçam.

Primeiro, **estabilidade**: se ninguém — nem você, nem um processo mal comportado, nem um malware — consegue modificar `/usr` ou `/etc`, então o sistema nunca sai de um estado conhecido e testado pela Valve. Segundo, **rollback**: como a imagem original nunca é alterada, voltar para ela é trivial. Terceiro, **menos superfície de corrupção**: um desligamento brusco no meio de uma gravação pode corromper um sistema de arquivos mutável; uma imagem readonly não tem gravação para interromper.

```terminal
$ steamos-readonly status
Read-only filesystem status: enabled
$ mount | grep ' / '
overlay on / type overlay (rw,relatime,lowerdir=/dev/nvme0n1p2,upperdir=/var/lib/overlay/upper,workdir=/var/lib/overlay/work)
```

O `steamos-readonly status` confirma que o modo read-only está **ligado**. Repare que o `mount` mostra a raiz como `overlay` em `rw` — mas isso é o overlayfs de que falamos antes: o *lower* é o squashfs (imutável), e o *upper*, em `/var`, absorve as alterações efêmeras. O "read-only" refere-se à imagem de base, não ao ponto de montagem que você enxerga.

Enquanto o read-only estiver ligado, tentativas de mexer em `/usr` falham. Para contornar, existe o comando explícito:

```terminal
$ sudo steamos-readonly disable
$ sudo steamos-readonly status
Read-only filesystem status: disabled
```

Com o read-only desabilitado, o overlay ganha escrita sobre o *lower*, e você pode instalar pacotes ou editar `/etc`. Isso é essencial para desenvolvimento ou troubleshooting avançado — mas tem um preço, que vem logo adiante.

:::atencao
Desabilitar o read-only é uma faca de dois gumes. Toda alteração que você fizer em `/usr` e `/etc` no estado "disabled" vive no upper do overlay e **some** na próxima atualização de sistema da Valve, que recria o overlay a partir do novo squashfs. Além disso, alterar a imagem de base anula a garantia de rollback limpo. Só desabilite quando realmente precisar, e reabilite com `sudo steamos-readonly enable` depois.
:::

## Atualização atômica e o esquema A/B

Uma **atualização atômica** é aquela que, do ponto de vista do sistema, ou **aplica inteira** ou **não aplica nada**. Não existe estado intermediário: nunca acontece o cenário clássico de "o disco desligou no meio e sobrou um sistema metade velho, metade novo". Isso é uma consequência direta do modelo de imagem: a Valve não edita arquivos um a um dentro do seu root vivo — ela monta um root **completo e novo** numa partição separada e troca o apontador do boot.

O mecanismo que viabiliza a troca é o **A/B update**. Você tem duas partições de sistema (`root-A` e `root-B`), como vimos na seção 6. O sistema ativo é o `A`. Quando sai uma atualização, ela é gravada **inteira** na partição `B` (a inativa). Terminada a gravação e verificada a imagem, o bootloader passa a apontar para `B`. No próximo reboot, você sobe no sistema novo. Se algo der errado no boot, o firmware detecta e volta para `A`.

```terminal
$ lsblk -f
NAME        FSTYPE   FSVER LABEL     UUID                                 MOUNTPOINTS
nvme0n1
├─nvme0n1p1 vfat     FAT32 esp       67E3-2FD1                            /efi
├─nvme0n1p2 squashfs 4.0   rootfs-a  3f2b91ac-77de-4c15-9f0e-4a2d1c8b5e71 /
├─nvme0n1p3 squashfs 4.0   rootfs-b  a1c4d8e2-33bf-41a7-9d10-7e6f3a5b2c91
├─nvme0n1p4 ext4     1.0   var        d9e2b4f1-88ac-4e3d-9b50-1c7f8a4d2e36 /var
└─nvme0n1p5 ext4     1.0   home       5a3c7f1e-99bd-4f2a-b3d1-8e4c6a9b2d77 /home
```

Note que `rootfs-a` está montada em `/` e `rootfs-b` está vazia, sem ponto de montagem. É exatamente essa a imagem da "próxima atualização esperando". Nada do que você joga ou baixa toca essas partições — `/home` e a biblioteca Steam ficam numa partição separada, intactos por qualquer atualização.

## RAUC, ostree e o que o SteamOS usa de verdade

Quem executa o A/B no Deck é o **RAUC** (*Robust Auto-Update Controller*), um framework de atualização A/B para sistemas embarcados. O RAUC gerencia os *slots* (as partições), a gravação da imagem nova na inativa, a verificação de integridade e a decisão de marcar um boot como "bem-sucedido" ou não. Ele é o vigia que garante que a troca seja atômica e reversível.

```terminal
$ rauc status
=== System Info ===
Compatible:     steamos
Booted from:    rootfs.0 (A)
Activated:      rootfs.0 (A)

=== Slot States ===
  [rootfs.0] (/dev/nvme0n1p2, squashfs, inactive)
      bootname: A
      boot status: good

  [rootfs.1] (/dev/nvme0n1p3, squashfs, active)
      bootname: B
      boot status: good
```

O `rauc status` mostra o estado real dos dois slots: de onde você deu boot (`Booted from`), qual está ativado (`Activated`) e o `boot status` de cada um. O status `good` significa que aquele slot já produziu um boot bem-sucedido; é essa a marcação que o RAUC usa para decidir se o slot novo "vingou" ou se precisa voltar para o anterior.

Já o **ostree** é uma coisa diferente e merece uma distinção clara no glossário. O ostree é um sistema de versionamento de **árvore de arquivos**, num modelo que lembra o Git: cada versão do sistema é um *commit* numa árvore de diretórios, com deduplicação por conteúdo entre versões. Ele é a espinha dorsal dos *atomic desktops* como Fedora Silverblue e openSUSE MicroOS. O SteamOS, porém, **não usa ostree** — a Valve montou um esquema próprio de A/B com **squashfs** e o RAUC por cima. Guarde: ostree = árvore versionada com dedup; SteamOS = duas imagens squashfs trocadas pelo RAUC.

:::nota
A confusão "imutável = ostree" é comum, porque Silverblue e MicroOS são os exemplos mais famosos de sistema imutável no desktop Linux. Mas imutabilidade é uma ideia; ostree é uma implementação específica dela. O SteamOS implementa imutabilidade de outra forma. Ver ambos como "formas de manter o sistema readonly e atualizável" é a chave correta.
:::

## steamos-update e delta updates

O comando de atualização do SteamOS é o **`steamos-update`**. Ele é o frontend que você usa para checar, baixar e disparar a atualização — enquanto o RAUC e o A/B fazem o trabalho pesado por baixo. Os subcomandos principais são intuitivos:

```terminal
$ steamos-update check
Checking for updates...
An update is available. Version 3.6.20.

$ steamos-update os
Downloading update...
Applying update to inactive slot...
Update applied. Reboot to activate.
```

O `steamos-update check` apenas consulta se há versão nova, sem baixar nada. O `steamos-update os` faz o ciclo completo: baixa, grava na partição inativa e avisa que a troca acontece no próximo reboot. Essa divisão entre "gravar na inativa" e "trocar no reboot" é o ritual do A/B em ação.

Por trás do download, entra o conceito de **delta updates**: em vez de baixar o rootfs inteiro a cada versão, o cliente baixa só a **diferença** entre a versão que você tem e a nova. Como o squashfs é uma imagem comprimida, aplicar um delta significa reconstruir apenas os blocos que mudaram. Para um aparelho com frequência de atualização quinzenal, essa economia de banda (e de tempo de download) é o que torna o ciclo suportável.

:::info
O delta exige que a versão anterior esteja íntegra e conhecida, pois o patch é calculado contra ela. Por isso o Deck mantém a verificação de integridade (hashes e assinaturas) como pré-requisito: se a imagem base estiver corrompida ou adulterada, o delta não fecha, e o sistema recai para um download completo — ou, em último caso, para o rollback.
:::

## Rollback e verificação de integridade

O **rollback** é a rede de segurança final: voltar para a versão anterior quando a nova falha. No Deck, o RAUC marca cada boot. Se um slot recém-ativado não conseguir concluir o boot (ou se falhar a verificação de integridade), o bootloader não confirma aquele slot como "good" e, na prática retorna para o slot anterior. Para o usuário, o ritual se resume a reiniciar: se a máquina toca num slot ruim, ela rebota sozinha de volta para o estável.

De forma manual, dá para selecionar a partição B no menu de boot do Deck. As duas partições root são rotuladas `rootfs-a` e `rootfs-b`, e o firmware lista as duas; escolher a anterior é um rollback feito à mão.

```terminal
$ df -h /
Filesystem      Size  Used Avail Use% Mounted on
overlay         4.6G  4.6G     0 100% /
```

O `df -h /` confirma o que já sabíamos: a raiz é um overlay cujo *lower* squashfs está 100% cheio — sinal de que é uma imagem readonly completa, não um diretório solto. Junto com o `rauc status`, esses dois comandos bastam para diagnosticar em qual slot você está e se ele está saudável.

A **verificação de integridade** fecha o ciclo. Antes de ativar um slot, o RAUC confere **hashes** da imagem (para detectar corrupção por disco ruim ou download truncado) e **assinaturas** (para garantir que a imagem veio da Valve e não foi adulterada). É essa checagem que transforma o A/B de "duas cópias" em "duas cópias confiáveis": o sistema só troca para um slot cujo conteúdo ele pode provar que é íntegro e autêntico.

:::exemplo
Digamos que uma atualização baixou pela metade e você forçou um reboot. No boot, o RAUC vê que o hash do slot B não bate com o esperado, recusa o slot e sobe de novo pelo A. Você volta exatamente ao estado de antes da atualização, com a biblioteca de jogos intacta em `/home`. Esse é o fluxo que distingue um console de um desktop: a falha degrada em reboot, nunca em "reinstala o sistema".
:::

## Resumo

- A raiz do Deck é squashfs somente-leitura; o overlayfs dá uma camada writable efêmera por cima.
- `steamos-readonly disable` libera escrita em `/usr` e `/etc`, mas as mudanças somem na próxima atualização.
- Atualização atômica significa "ou aplica inteira, ou não aplica"; o A/B grava na partição inativa e troca no reboot.
- O RAUC gerencia os slots A/B, a gravação, a verificação e a marcação de boot bem-sucedido.
- O SteamOS não usa ostree; usa esquema próprio de A/B com squashfs. Delta updates baixam só a diferença entre versões.
- `steamos-update check`/`os` disparam o ciclo; o rollback volta ao slot anterior, com integridade garantida por hashes e assinaturas.

## Exercícios

1. Rode `steamos-readonly status` e `mount | grep ' / '`. Explique, na sua máquina, por que o mount mostra `rw` mesmo com o read-only habilitado.
2. Execute `rauc status` e identifique: de qual slot você deu boot, qual está ativado e qual o `boot status` de cada um.
3. Rode `lsblk -f` e confirme qual partição squashfs está montada em `/` e qual está sem montagem. O que isso diz sobre a próxima atualização?
4. Execute `steamos-update check`. A sua versão está atualizada? Compare com a versão mostrada em `rauc status`.
5. **Desafio.** Desabilite o read-only com `sudo steamos-readonly disable`, crie um arquivo em `/etc/teste-persistente`, depois reabilite com `sudo steamos-readonly enable`. Sem atualizar o sistema, explique em que camada (lower ou upper) aquele arquivo vive e por que ele é efêmero — relacionando com o overlayfs da seção de sistema de arquivos.
