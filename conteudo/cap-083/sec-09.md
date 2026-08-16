Quando tudo o mais falha — um volante que o kernel reconhece mas o jogo não enxerga, um controle cujas permissões somem a cada reinicialização, um periférico que trava o sistema ao plugar — a resposta está no udev, o gerenciador de dispositivos. Escrever regras udev e ler o `dmesg` corretamente é o último recurso, e também o mais poderoso, para domar periféricos no SteamOS.

:::objetivos
- Entender o papel do udev no ciclo de vida dos dispositivos
- Escrever regras udev para fixar permissões e nomes
- Diagnosticar periféricos que travam ou somem usando `dmesg`
- Recarregar regras e testar mudanças sem reiniciar

:::

## O que o udev faz

O udev é o daemon que reage a cada dispositivo que aparece e some. Quando você pluga um controle, o kernel cria o nó em `/dev`, e o udev — monitorando o barramento — aplica as regras: dá permissão, cria links simbólicos legíveis em `/dev/input/by-id`, monta os pontos de entrada. Sem ele, os nós existiriam, mas ninguém teria permissão e os nomes amigáveis não existiriam.

As regras do sistema vivem em `/usr/lib/udev/rules.d/`; as regras do usuário, em `/etc/udev/rules.d/`, que têm prioridade. A regra de ouro: **nunca edite um arquivo em `/usr/lib`, crie um arquivo novo em `/etc`**.

```terminal
$ ls /usr/lib/udev/rules.d/ | grep -iE 'input|hid|bluetooth|wacom|logitech'
60-input-id.rules
70-joystick.rules
80-libinput-device-grouping.rules
```

A regra `70-joystick.rules` é a que marca aparelhos como joystick — é ela que define a propriedade `ID_INPUT_JOYSTICK=1` que vimos no [capítulo de diagnóstico](#/cap-083/sec-05).

## Lendo o dmesg de um periférico problemático

Antes de escrever qualquer regra, colete a verdade do kernel. O `dmesg` guarda as últimas mensagens do anel do kernel, e filtrar por um aparelho específico revela por que ele falhou.

```terminal
$ sudo dmesg | tail -25
[ 1245.331204] usb 1-3: USB disconnect, device number 7
[ 1245.512300] usb 1-3: new full-speed USB device number 8 using xhci_hcd
[ 1245.678901] usb 1-3: device descriptor read/64, error -71
[ 1245.829003] usb 1-3: unable to enumerate USB device
```

O erro `-71` (protocol error) e `unable to enumerate` são assinaturas clássicas de **cabo ruim, porta com problema elétrico ou hub sem energia suficiente**. Não é falha do controle nem do driver — é física. Trocar o cabo ou a porta resolve.

:::dica
Decore dois erros de `dmesg`: `error -71` (protocol/electrical problem) indica cabo ou porta falha; `over-current condition` indica que o aparelho puxa mais energia do que a porta fornece. Ambos apontam para hardware, não software, e dispensam horas de reinstalação.
:::

## Escrevendo uma regra udev

Suponha que você tem um volante que o kernel reconhece, mas o `udev` entrega com permissão `root:root` e o jogo (rodando como usuário `ana`) não consegue abrir. A solução é uma regra que fixe a permissão no nó do aparelho. Crie o arquivo:

```conf
# /etc/udev/rules.d/99-meu-volante.rules
SUBSYSTEM=="input", ATTRS{idVendor}=="046d", ATTRS{idProduct}=="c24f", MODE="0666"
```

A regra casa com qualquer nó do subsistema `input` cujo USB tenha vendedor `046d` e produto `c24f` (os IDs do Logitech G29) e aplica `MODE="0666"` — qualquer usuário lê e escreve. Para descobrir os IDs exatos do seu aparelho:

```terminal
$ lsusb
Bus 001 Device 005: ID 046d:c24f Logitech, Inc. G29 Driving Force Racing Wheel
```

Os IDs estão no formato `ID vendedor:produto`, em minúsculas na regra.

## Recarregando e testando a regra

Renomeie o arquivo com prefixo numérico alto (`99-`) para ele vencer as regras do sistema. Depois, recarregue o udev e dispare o reconhecimento do aparelho sem reiniciar:

```terminal
$ sudo udevadm control --reload-rules
$ sudo udevadm trigger
$ ls -l /dev/input/event7
crw-rw-rw- 1 root root 13, 71 Jan 1 09:00 /dev/input/event7
```

O `trigger` reexecuta todas as regras sobre os dispositivos já presentes. A saída `crw-rw-rw-` confirma que a permissão `0666` foi aplicada. Para depurar por que uma regra não casou, rode o `udevadm test`:

```terminal
$ sudo udevadm test /sys/class/input/event7 2>&1 | grep -iE 'meu-volante|MODE|ID_INPUT'
```

O `udevadm test` imprime, linha a linha, cada regra que casou com aquele nó — a ferramenta definitiva para descobrir por que sua regra foi ignorada (geralmente um `ATTRS` errado ou um namespace `ATTR` no lugar de `ATTRS`).

## Fixando nomes e evitando nós que mudam

Um periférico pode trocar de número `event*` a cada boot dependendo da ordem em que os aparelhos são enumerados. Para scripts e configs estáveis, crie um **link simbólico com nome fixo**:

```conf
# /etc/udev/rules.d/99-meu-volante.rules
SUBSYSTEM=="input", ATTRS{idVendor}=="046d", ATTRS{idProduct}=="c24f", SYMLINK+="input/volante-g29"
```

Agora, em vez de caçar `event7`, você usa sempre o caminho estável:

```terminal
$ ls -l /dev/input/volante-g29
lrwxrwxrwx 1 root root 6 Jan 1 09:00 /dev/input/volante-g29 -> event7
```

:::atencao
`SYMLINK+` cria um atalho, não renomeia o nó. O aparelho continua existindo como `event7` (ou outro número); o link `/dev/input/volante-g29` aponta para ele a cada boot. Use o link nos seus scripts, mas saiba que o jogo continua vendo o `event*` original via `/dev/input/by-id` ou pela enumeração normal.
:::

## O ciclo completo de diagnóstico

Junta tudo: quando um periférico não se comporta, siga esta ordem, do mais barato ao mais invasivo:

1. `dmesg` — o kernel reconheceu? Há erro elétrico (`-71`, `over-current`)?
2. `lsusb` — o aparelho aparece com IDs corretos?
3. `udevadm info` — está marcado como `ID_INPUT=1`?
4. `evtest` — os eventos crus chegam?
5. Se sim aos quatro e o jogo não vê: é mapeamento (Steam Input) ou permissão — aí entra a regra udev.

Uma regra udev é cirúrgica: só escreva depois de confirmar que o problema está na camada de permissão ou nomeação, nunca por reflexo.

## Resumo

- O udev aplica regras a cada dispositivo que aparece, definindo permissões e nomes.
- Regras do usuário em `/etc/udev/rules.d/` vencem as do sistema em `/usr/lib/udev/rules.d/`.
- `dmesg` com `error -71` ou `over-current` indica problema físico (cabo/porta/energia).
- Uma regra casa com `SUBSYSTEM`, `ATTRS{idVendor}` e `ATTRS{idProduct}` para o aparelho certo.
- `udevadm control --reload-rules` + `udevadm trigger` aplicam sem reiniciar.
- `SYMLINK+` cria um caminho estável para o nó que muda de número a cada boot.

## Exercícios

1. Rode `lsusb` e anote o par `ID vendedor:produto` do seu controle ou volante.
2. Escreva uma regra em `/etc/udev/rules.d/` que fixe `MODE="0666"` para o seu aparelho e aplique com `udevadm trigger`. Confirme com `ls -l`.
3. Adicione um `SYMLINK+="input/meu-controle"` à mesma regra e verifique o link criado.
4. Forçe um erro físico: desconecte o cabo no meio de um `evtest` e capture a linha de `dmesg` que aparece. Que mensagem o kernel imprime ao perder o dispositivo?
5. **Desafio.** Use `sudo udevadm test /sys/class/input/eventX` no seu aparelho e percorra a saída até achar a linha que mostra sua regra sendo aplicada. Explique por que uma regra com `ATTR` (em vez de `ATTRS`) não casa com o `idVendor` do pai USB.
