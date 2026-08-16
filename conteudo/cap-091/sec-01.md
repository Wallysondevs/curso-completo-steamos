O Steam Deck é um console portátil de arquitetura x86 disfarçado de PC, e como todo PC ele pode, um dia, se recusar a iniciar. Para esse cenário a Valve distribui uma imagem de recuperação que cabe num pendrive e transforma qualquer Deck com problema de boot em uma máquina capaz de se consertar sozinha — ou, no pior caso, de voltar ao estado de fábrica. O modo de recuperação não é um menu escondido do GRUB nem um atalho de teclado do KDE: é um sistema operacional completo, baseado no próprio SteamOS, que roda exclusivamente a partir do USB.

:::objetivos
- Entender o que é a imagem de recovery e como ela difere do SteamOS normal
- Saber quando usar o modo de recuperação em vez de outras ferramentas de reparo
- Identificar os quatro caminhos que a imagem oferece e o que cada um preserva ou apaga
- Compreender a relação entre a imagem de recovery e o particionamento do disco
:::

## O que a imagem de recovery realmente é

A imagem de recovery é um arquivo `.img`, comprimido em `.bz2` ou `.zip`, que pesa aproximadamente 2,5 GiB comprimido e se expande para cerca de 7,7 GiB quando descompactado. Ela não é um instalador tradicional com etapas e assistentes: é um sistema SteamOS completo, com kernel, systemd, servidor X11 e ambiente KDE Plasma, configurado para inicializar diretamente em uma sessão de reparo.

```terminal
$ file steamdeck-recovery-4.img
steamdeck-recovery-4.img: DOS/MBR boot sector; partition 1: ID=0x83, start-CHS (0x0,32,33), end-CHS (0x3,130,4), startsector 2048, 15728640 sectors
```

A imagem contém três partições: uma EFI de boot, uma raiz com o sistema de recuperação e scripts de reparo. Quando o Deck inicializa por ela, o kernel carrega drivers para o NVMe interno, monta as partições do disco e executa o ambiente de desktop — tudo sem tocar no sistema instalado, a menos que você escolha explicitamente uma operação de escrita.

:::nota
A Valve mantém um repositório público de imagens históricas no endereço `steamdeck-images.steamos.cloud/recovery`. Isso significa que é possível baixar versões anteriores para testes de compatibilidade ou para restaurar um Deck a uma versão específica do sistema — útil em diagnósticos de regressão.
:::

## Quando o modo de recuperação é a resposta certa

Nem todo problema exige recovery. Um Deck que trava no logo de inicialização pode estar apenas com um update mal aplicado; um que entra em loop pode ter corrupção em `/var`; um que simplesmente não liga pode ter bateria descarregada ou falha de hardware. A imagem de recovery é o caminho certo quando:

- O sistema não completa o boot e nenhuma intervenção por `chroot` ou `fsck` manual resolveu.
- O particionamento foi danificado por uma instalação de dual-boot mal feita.
- Você quer apagar tudo e recomeçar, inclusive removendo sistemas operacionais paralelos.
- O Deck será enviado para RMA ou vendido e você precisa de uma limpeza garantida.

Repare que a imagem de recovery **não diagnostica hardware**. Se o SSD NVMe falhou fisicamente, a imagem pode nem enxergar o disco. Se a tela não acende, o modo de recuperação também não aparecerá — nesse caso o problema é da tela, não do sistema.

Quando você inicializa por ela, o sistema se identifica como uma cópia do SteamOS rodando a partir do dispositivo removível, não do disco interno:

```terminal
$ uname -a
Linux steamdeck-recovery 6.5.0-valve22-1-neptune-65-gn181b18b6f4c #1 SMP PREEMPT_DYNAMIC Wed Dec  4 20:08:22 PST 2024 x86_64 GNU/Linux
$ cat /etc/os-release | grep -E 'NAME|VERSION='
NAME="SteamOS"
VERSION="3.6.20 (recovery)"
```

O hostname `steamdeck-recovery` e o sufixo `(recovery)` na versão deixam claro que você está no ambiente de reparo, não no sistema instalado — um detalhe útil quando se está mexendo em discos de mais de uma unidade.

## Os quatro ícones da área de trabalho de recuperação

Quem nunca usou o recovery espera um menu azul com setinhas de teclado. A realidade é diferente: a imagem inicializa numa sessão KDE Plasma com quatro ícones grandes na área de trabalho, e a interação é por touchscreen (o controle do Deck não funciona nesse ambiente). Cada ícone corresponde a um script que executa uma operação específica:

| Ícone | O que faz | Apaga dados? |
|---|---|---|
| **Reimage Steam Deck** | Restauração completa de fábrica, recriando todas as partições e regravando o sistema | Sim, tudo |
| **Reinstall SteamOS** | Reescreve os arquivos do sistema sem tocar em `/home` | Tenta preservar |
| **Clear local user data** | Apaga apenas os dados de usuário (jogos, saves locais, configurações) | Só `/home` |
| **Terminal with repair tools** | Abre um terminal com ferramentas de diagnóstico e reparo | Não (manual) |

A escolha entre eles é o tema central deste capítulo, e cada um será detalhado nas seções seguintes. A ordem importa: se você só quer corrigir um pacote quebrado, o terminal de reparo é suficiente; se vai vender o Deck, a reimagem completa é a única opção que garante que o comprador não encontre seus arquivos.

:::atencao
Reimage e Reinstall são palavras parecidas com consequências radicalmente diferentes. Reimage = formatar tudo, partições incluídas. Reinstall = reescrever o sistema sobre as partições existentes, mantendo `/home`. Confundir os dois custa seus dados.
:::

## O que acontece com o disco durante cada operação

O SteamOS usa um esquema de partições A/B para atualizações atômicas — uma das duas partições raiz está sempre ativa, a outra serve como destino da próxima atualização. A reimagem recria esse layout do zero, incluindo as tabelas de partição GPT, as partições EFI, as duas raízes (`rootfs-A` e `rootfs-B`), a `/home` separada e a `/var`. Já a reinstalação preserva a tabela de partições e reescreve apenas as raízes do sistema.

```terminal
$ lsblk /dev/nvme0n1
NAME        MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
nvme0n1     259:0    0 953.9G  0 disk 
├─nvme0n1p1 259:1    0    64M  0 part 
├─nvme0n1p2 259:2    0    32M  0 part 
├─nvme0n1p3 259:3    0    32M  0 part 
├─nvme0n1p4 259:4    0     5G  0 part 
├─nvme0n1p5 259:5    0     5G  0 part 
├─nvme0n1p6 259:6    0   256M  0 part 
├─nvme0n1p7 259:7    0   256M  0 part 
├─nvme0n1p8 259:8    0 938.5G  0 part /home
```

Esse layout com partições A e B é a razão pela qual a reinstalação consegue preservar dados: as partições de sistema são independentes da `/home`. Uma reinstalação bem-sucedida reescreve `p4` e `p5` (ou as partições equivalentes), atualiza `p6` e `p7` (EFI) e deixa `p8` (`/home`) intocada.

## Resumo

- A imagem de recovery é um SteamOS mínimo que roda do USB, com kernel, KDE Plasma e scripts de reparo.
- Ela está disponível em `store.steampowered.com/steamos/download` e no repositório de imagens históricas da Valve.
- O modo de recuperação é indicado quando o sistema não inicia e ferramentas como `chroot` ou `fsck` não bastam.
- Quatro opções: reimagem (tudo apagado, partições recriadas), reinstalação (sistema regravado, `/home` mantida), limpeza de dados locais (só `/home` apagada) e terminal de reparo.
- O particionamento A/B do SteamOS permite reinstalar o sistema sem tocar nos arquivos do usuário.

## Exercícios

1. Descreva, com suas palavras, a diferença entre a imagem de recovery e o SteamOS instalado no disco do Deck. O que uma tem que a outra não tem?
2. Acesse `steamdeck-images.steamos.cloud/recovery` pelo navegador e liste as três versões mais recentes disponíveis. Qual é a mais nova e qual parece ser a mais antiga?
3. Imagine que seu Deck entrou em boot loop após instalar um tema de GRUB. Você consegue entrar no modo desktop com `chroot` a partir do recovery? Qual dos quatro ícones você usaria primeiro?
4. Explique por que o layout A/B de partições do SteamOS permite a reinstalação preservando `/home`.
5. **Desafio.** Monte a imagem de recovery com `losetup` e liste as partições internas dela com `fdisk -l`. Quantas partições a imagem contém, qual o tipo de cada uma e qual é o sistema de arquivos da partição raiz?