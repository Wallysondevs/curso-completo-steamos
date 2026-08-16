Chegamos à ferramenta que amarra o capítulo inteiro. Enquanto `lsblk` e `df -h` mostram o disco cru e o `steamos-update` executa as atualizações, é o `rauc status` que responde à pergunta que importa de verdade em qualquer momento: em qual partição estou, e para onde posso voltar se algo der errado? Esta seção encerra o capítulo com o diagnóstico definitivo do esquema A/B.

:::objetivos
- Interpretar a saída completa do `rauc status`
- Distinguir a partição ativa da partição inativa pelo estado reportado
- Entender a marcação do slot "bom" (o alvo de fallback)
- Integrar todas as ferramentas do capítulo num diagnóstico único
:::

## O que é o RAUC

RAUC (*Robust Auto-Update Controller*) é o componente que o SteamOS usa por baixo do `steamos-update` para gerenciar as partições A/B e a troca entre elas. É um software consagrado na indústria de sistemas embarcados e atualização atômica, e a Valve o adotou justamente porque ele já resolvia exatamente o problema que o Steam Deck tinha: manter dois slots, marcar qual é bom, e controlar a troca segura.

Enquanto o `steamos-update` é a interface amigável ("verifique", "aplique", "reverta"), o `rauc` é a máquina que executa. O `steamos-update` traduz seus subcomandos em operações RAUC. E o `rauc status` expõe o estado interno dessa máquina — as duas partições, seus estados e qual é a referência de segurança.

## Lendo o rauc status

A saída completa é onde todas as peças do capítulo se encontram:

```terminal
$ sudo rauc status
=== System Info ===
Compatible:  steamos-wayland
Variant:    steamos
Booted from: boot-A (A)

=== Bootloader ===
Activated: boot-A (A)

=== Slot States ===
o [rootfs-A]         (/dev/nvme0n1p3, ext4, inactive)
x [rootfs-B]         (/dev/nvme0n1p6, ext4, booted)

=== Slot States ===
o [var-A]            (/dev/nvme0n1p4, ext4, inactive)
x [var-B]            (/dev/nvme0n1p6, ext4, booted)
```

Vamos dissecar cada bloco. `Booted from: boot-A (A)` diz de qual slot o sistema subiu **agora**: o A. `Activated: boot-A (A)` confirma que o bootloader está apontando para o A como o slot a iniciar. Depois vêm os estados dos slots, numa notação importante:

- `x` (um "x" à esquerda) marca o slot **booted** — aquele que subiu e está em uso.
- `o` (um "o" à esquerda) marca o slot **inactive** — o outro, parado, pronto para atualização ou fallback.

No exemplo acima, `rootfs-A` e `var-A` estão **inactive** (`o`), e `rootfs-B`/`var-B` estão **booted** (`x`). Mas repare na contradição aparente: `Booted from: boot-A (A)` diz A, enquanto os slots `booted` são B. Isso acontece porque o rótulo "A" no bootloader e o nome da partição podem divergir entre versões/nomes internos. O campo que você deve confiar para "onde estou agora" é o `x` (booted) nos slots — e, quando houver divergência entre o nome lógico e a partição física, o `rauc` lista o dispositivo real (`/dev/nvme0n1p6`), que é a fonte da verdade.

:::atencao
Não assuma que "A" sempre aponta para a mesma partição física. Nomes lógicos (boot-A, rootfs-A) e dispositivos (`/dev/nvme0n1pN`) podem se deslocar. Quando precisar de certeza absoluta, cruze o `sudo rauc status` com o `lsblk` e o `df -h` — o trio não deixa dúvida sobre qual partição está montada em `/`.
:::

## O estado "good": a rede de segurança

Numa atualização em funcionamento pleno, o `rauc status` mostra um campo extra que ainda não apareceu: a marcação de slot "bom" (*good*). É o slot que o bootloader usará como fallback se o slot atual falhar ao subir. Na prática:

```terminal
$ sudo rauc status
=== System Info ===
Compatible:  steamos-wayland
Booted from: boot-B (B)

=== Slot States ===
o [rootfs-A]  (/dev/nvme0n1p3, ext4, inactive, good)
x [rootfs-B]  (/dev/nvme0n1p6, ext4, booted, good)
```

Aqui os **dois** slots estão `good`: o B porque acabou de subir com sucesso (e se confirmou bom), e o A porque é a versão anterior comprovadamente estável. É o estado ideal — você tem rede de segurança dos dois lados.

O que o `steamos-update rollback` faz, em termos de RAUC, é simplesmente trocar o `Activated` para o outro slot: marca o slot anterior como o próximo a iniciar. E o mecanismo de rollback automático por falha de boot usa a marcação `good` para decidir para onde voltar.

## Integrando o diagnóstico completo

Agora monte o retrato completo da sua máquina com cinco comandos que você já conhece do capítulo:

```terminal
$ sudo rauc status
=== System Info ===
Compatible:  steamos-wayland
Booted from: boot-A (A)

=== Slot States ===
x [rootfs-A]  (/dev/nvme0n1p3, ext4, booted, good)
o [rootfs-B]  (/dev/nvme0n1p6, ext4, inactive)
```

```terminal
$ cat /etc/os-release | grep -E 'BUILD_ID|PRETTY_NAME'
PRETTY_NAME="SteamOS 3.6"
BUILD_ID=20241105.100
```

```terminal
$ steamos-update check
Checking for available updates...
Current branch: stable
The system is up to date.
```

Lendo os três juntos: o `rauc status` diz que você subiu pelo slot A (que está `good`), o `/etc/os-release` diz que a imagem ativa é a `20241105.100` (SteamOS 3.6), e o `steamos-update check` confirma que, no canal stable, essa é a versão mais recente — não há o que baixar. Num único olhar você sabe **onde** está, **o que** está rodando e **se** há algo novo. É assim que um administrador de sistema de verdade confirma o estado de uma atualização.

Um último detalhe de completude: se quiser saber o espaço e o estado físico da partição de sistema, feche com o `btrfs` ou o `lsblk` conforme a base da sua máquina:

```terminal
$ lsblk -o NAME,SIZE,MOUNTPOINTS | grep -E '/$|/var|/home'
nvme0n1p3      5G    /
nvme0n1p4      5G    /var
nvme0n1p8  456.4G    /home
```

## Resumo

- `rauc status` é o comando que expõe o estado interno das partições A/B (RAUC = o controlador de atualização).
- As marcas `x` (booted) e `o` (inactive) mostram qual slot está em uso e qual está parado.
- A marcação `good` indica o slot confiável de fallback para o rollback.
- Cruze `rauc status` + `/etc/os-release` + `steamos-update check` para um diagnóstico completo.
- Nomes lógicos (A/B) e dispositivos físicos (`/dev/nvme0n1pN`) podem divergir; confie no trio com `lsblk`/`df -h`.

## Exercícios

1. Rode `sudo rauc status` e identifique: o slot booted, o inactive e (se houver) os marcados `good`.
2. Cruze a saída do `rauc status` com `lsblk` e `df -h`. A partição marcada `booted` é a mesma montada em `/`?
3. Leia `PRETTY_NAME` e `BUILD_ID` em `/etc/os-release` e relacione com o slot ativo do `rauc status`.
4. Execute `steamos-update check` e conclua, com base em `rauc status` + `os-release` + `check`, se sua máquina está estável e em dia.
5. **Desafio.** Faça um "laudo de atualização" completo da sua máquina em um único documento: use `sudo rauc status`, `lsblk`, `df -h`, `cat /etc/os-release`, `steamos-update check` e `journalctl -u steamos-update -n 10`. Interprete cada bloco e responda, em uma frase final: há algo nesta máquina que impede uma atualização segura agora? Justifique com o que cada comando revelou.