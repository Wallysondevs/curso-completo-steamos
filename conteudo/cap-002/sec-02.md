Se você veio de um Linux convencional, a primeira surpresa concreta do SteamOS aparece quando você tenta escrever em `/usr` ou em `/etc` e recebe um "read-only file system". A raiz do SteamOS é imutável por padrão: montada somente para leitura, e qualquer mudança que você faça nela é descartada na próxima atualização. Esta seção explica o porquê dessa decisão e o que ela muda no seu dia a dia.

:::objetivos
- Entender por que a Valve torna a raiz do sistema somente leitura
- Verificar o estado de leitura com `steamos-readonly`
- Identificar quais partes do sistema são graváveis e quais não são
- Conhecer o modelo A/B de partições e seu papel na imutabilidade
:::

## Por que travar a raiz

Num console de jogos, o sistema operacional é uma peça de infraestrutura, não um brinquedo de personalização. A Valve quer que um Steam Deck ligado por uma avó, por um filho de 8 anos ou por um entusiasta se comporte da mesma forma, sem depender de "o que o dono andou instalando". Travar a raiz traz três ganhos.

**Previsibilidade.** Se o sistema imutável funciona num Deck, funciona em todos os Decks com a mesma build. Bugs ficam reproduzíveis e o suporte fica factível.

**Resistência a dano.** Usuário comum não consegue apagar `libc`, corromper o `/etc` ou estragar o boot com um `rm` mal diglado.

**Atualização limpa.** Como veremos na próxima seção, o SteamOS atualiza trocando a partição inteira, não mesclando arquivos. Uma raiz que ninguém mexeu é trivial de substituir com segurança.

```terminal
$ steamos-readonly status
Filesystem is readonly at this time.
$ touch /etc/teste
touch: cannot touch '/etc/teste': Read-only file system
```

O comando `touch` tenta criar um arquivo vazio e falha porque `/etc` — como quase toda a raiz — está montado somente leitura. Essa é a experiência real de quem tenta personalizar o sistema "do jeito antigo".

## Onde ainda dá para escrever

A imutabilidade não é total. O SteamOS separa deliberadamente o que é "sistema" (imutável) do que é "você" (gravável). As áreas que você pode, e deve, escrever são poucas e claras.

```terminal
$ findmnt -no TARGET,OPTIONS / /home /var
/            rw,relatime
/home        rw,relatime
/var         rw,relatime
```

A saída mostra a raiz montada como `rw` (read-write) num primeiro momento — mas repare que isso é o estado *antes* de o SteamOS aplicar suas regras. Na prática, o usuário comum escreve em `/home` (seus jogos, saves, configurações de apps Flatpak) e em `/var` (logs, cache, dados de aplicativos). O resto — `/usr`, `/bin`, `/lib`, `/etc` — é o território da Valve.

:::nota
O SteamOS não usa um único overlay imutável como o Fedora Silverblue (que usa `rpm-ostree`). A abordagem da Valve é mais simples: partições físicas separadas, montadas com flags de somente leitura, e trocadas inteiras na atualização. É imutabilidade "de pobre", mas atende perfeitamente a um aparelho de função única.
:::

## O comando steamos-readonly

O `steamos-readonly` é a ferramenta oficial para inspecionar — e, temporariamente, alterar — o estado de leitura da raiz. Ele é específico do SteamOS; você não o encontra em Arch ou Debian.

```terminal
$ steamos-readonly status
Filesystem is readonly at this time.
$ steamos-readonly disable
Removing readonly flag from root filesystem...
$ steamos-readonly status
Filesystem is writable at this time.
```

Com `disable`, a raiz fica gravável e você pode, por exemplo, instalar algo com `pacman`, editar um arquivo de configuração em `/etc` ou adicionar uma fonte de sistema. O `enable` faz o inverso, religando a proteção.

A palavra-chave aqui é **temporariamente**. Essa liberdade tem prazo de validade: a próxima atualização do sistema restaura a raiz para o estado somente leitura e descarta o que foi alterado.

:::atencao
Desativar a proteção de leitura não é "virar root de verdade". É abrir uma janela de escrita que se fecha sozinha no próximo update. Se você precisa que algo sobreviva a atualizações, colocar na raiz é o caminho errado — a via correta é Flatpak (apps) ou o diretório pessoal (configurações). Voltaremos a isso na seção sobre o pacman.
:::

## A raiz e as partições A/B

A imutabilidade anda de mãos dadas com o esquema de partições A/B. Em vez de um único sistema que é modificado no lugar, o SteamOS guarda duas cópias completas do sistema: `rootfs-A` e `rootfs-B` (dentro do layout que o `lsblk` expõe com nomes como `steamdeck-rootfs`).

```terminal
$ lsblk -o NAME,SIZE,FSTYPE,LABEL
NAME        SIZE FSTYPE LABEL
nvme0n1   931.5G
├─nvme0n1p1  1M
├─nvme0n1p2  32M         efi
├─nvme0n1p3  32M         efi-A
├─nvme0n1p4  32M         efi-B
├─nvme0n1p5   5G ext4    rootfs-A
├─nvme0n1p6   5G ext4    rootfs-B
├─nvme0n1p7 256M ext4    var-A
├─nvme0n1p8 256M ext4    var-B
└─nvme0n1p9 900.8G ext4  home
```

Olhe o padrão: quase tudo tem versão `A` e `B` — o EFI, a raiz (`rootfs`), o `/var`. Só o `/home` é único, porque é o seu território, que não deve ser tocado pela troca de sistema. Quando uma atualização chega, ela é gravada na partição *inativa* e, no reboot, o sistema passa a dar boot por ela. A partição ativa vira reserva, pronta para servir de rollback.

Por isso a imutabilidade importa tanto: se você pudesse escrever livremente em `rootfs-A` e `rootfs-B`, o modelo de "trocar a partição inteira" deixaria de ser confiável — ninguém saberia o que está em cada uma delas.

## Resumo

- A raiz do SteamOS é somente leitura por padrão: tentar escrever em `/usr` ou `/etc` falha com "read-only file system".
- A imutabilidade dá previsibilidade, resistência a dano e atualizações limpas.
- As áreas graváveis para o usuário são `/home` e `/var`; o resto pertence à Valve.
- `steamos-readonly status` mostra o estado; `disable`/`enable` alternam a proteção temporariamente.
- A alteração na raiz se perde na próxima atualização, que restaura o estado imutável.
- O esquema A/B guarda duas cópias do sistema (`rootfs-A`/`rootfs-B`), e a atualização troca de partição inteira.

## Exercícios

1. Rode `steamos-readonly status` e copie a saída. Depois tente `touch /usr/teste` e anote a mensagem de erro exata.
2. Use `findmnt -no TARGET,OPTIONS / /home /var` e explique, com suas palavras, por que `/home` e `/var` são montados graváveis enquanto a raiz não.
3. Liste as partições com `lsblk -o NAME,SIZE,FSTYPE,LABEL`. Identifique qual é `rootfs-A`, qual é `rootfs-B` e quais partições não têm versão duplicada.
4. Desative a proteção com `steamos-readonly disable`, confira com `status`, crie um arquivo em `/tmp` (que não afeta a raiz) e depois religue com `enable`. Explique a diferença entre `/tmp` e a raiz.
5. **Desafio.** Com a proteção ativa, tente descobrir como o kernel enxerga o estado de montagem: execute `mount | grep ' on / '`. Interprete a flag que aparece e relacione-a com o resultado de `steamos-readonly status`. Por que os dois comandos podem parecer divergir?
