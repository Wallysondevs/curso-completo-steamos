Um script é disparado por você; um serviço systemd é disparado pelo tempo ou pelo login. Mas há uma terceira classe de automação que reage ao mundo físico: as regras de udev. Quando você pluga um dock, conecta um gamepad, insere um SSD externo ou carrega via USB-C, o kernel anuncia o evento no udev — e com a regra certa, você pode responder automaticamente: montar disco, mudar o perfil de energia, iniciar um serviço. Numa máquina como o Steam Deck, que vive sendo ligada e desligada de periféricos, o udev é o sistema nervoso da automação de hardware.

:::objetivos
- Entender o modelo de eventos do udev: o que são, como são emitidos e como são casados por regras
- Inspecionar dispositivos com `udevadm info` e `monitor`
- Escrever regras que reagem a conexão/desconexão de hardware
- Diferenciar quando uma ação deve ir no nível do udev versus no nível do systemd
- Conhecer o impacto da imutabilidade do SteamOS na edição de regras em `/etc/udev/rules.d/`
:::

## O modelo de eventos do udev

Tudo no udev gira em torno de eventos. Quando qualquer dispositivo aparece, muda ou some, o kernel emite um evento com atributos (vendor, model, serial, subsistema...) e o udev o compara contra um conjunto de regras. Cada regra é um padrão `match` + uma ação. O primeiro match decide o tratamento.

Há quatro "ações" fundamentais que uma regra pode capturar:

| Ação | Significado | Gatilho típico |
|---|---|---|
| `add` | dispositivo conectado/detectado | plugar SSD, gamepad, dock |
| `remove` | dispositivo desconectado | puxar o cabo |
| `change` | atributo alterado (ex.: estado de carregamento) | passar a carregar, mudar Hz da tela |
| `bind`/`unbind` | driver associado/desassociado | baixo nível |

Para ver os eventos em tempo real, use o monitor:

```terminal
$ sudo udevadm monitor
monitor will print the received events for:
UDEV - the event which udev sends out after rule processing
KERNEL - the kernel uevent

KERNEL[1234.567] change   /devices/pci0000:00/.../power_supply/AC
UDEV  [1234.568] change   /devices/pci0000:00/.../power_supply/AC
```

Conecte um SSD externo ou um gamepad e observe: cada ação física gera uma sequência de eventos `add`/`change` no KERNEL e no UDEV.

## Inspecionando um dispositivo

Antes de escrever uma regra, você precisa dos atributos exatos do dispositivo. O `udevadm info` fornece a "carteira de identidade":

```terminal
$ udevadm info -a -n /dev/sda | head -40

looking at device '/devices/pci0000:00/0000:00:08.1/.../block/sda':
    KERNEL=="sda"
    SUBSYSTEM=="block"
    DRIVER==""
    ATTR{size}=="500118192"
    ATTR{model}=="My Passport 260D"
    ATTR{serial}=="WX12A3B4C5D6"
    ATTR{vendor}=="WD"
```

Cada bloco `looking at` corresponde a um "pai" na árvore do dispositivo. Os atributos que importam para uma regra são os do bloco mais próximo (o dispositivo em si, com `vendor`, `model`, `serial`) e, às vezes, de um pai (o controlador USB). A chave para uma regra estável é usar atributos **únicos e estáveis** — `serial` é ouro, `model` é prata, `KERNEL` (como `sda`) é areia movediça porque muda conforme a ordem de conexão.

```terminal
$ udevadm info -a -n /dev/sda | grep -E 'ATTR\{(serial|model|vendor)\}'
    ATTR{serial}=="WX12A3B4C5D6"
    ATTR{model}=="My Passport 260D"
    ATTR{vendor}=="WD"
```

## Anatomia de uma regra

Uma regra udev vive em um arquivo `.rules` e tem esta forma:

```terminal
$ cat /etc/udev/rules.d/99-backup-disk.rules
ACTION=="add", SUBSYSTEM=="block", ATTR{serial}=="WX12A3B4C5D6", RUN+="/usr/local/bin/mount-backup-disk"
```

Os componentes:

- **Matches** (`==`): filtram o evento. Aqui a regra só dispara quando `ACTION` é `add`, o `SUBSYSTEM` é `block` (disco) e o `serial` bate. Todas precisam ser verdadeiras.
- **Ação** (`=` ou `+=`): o que fazer. `RUN+=` executa um comando; `SYMLINK+=` cria um link em `/dev`; `TAG+="systemd"` marca para integração com systemd.

O operador `==` casa, o operador `=` atribui. A confusão entre eles é o erro mais comum ao ler regras de terceiros.

```terminal
SUBSYSTEM=="block", ATTR{serial}=="WX12A3B4C5D6", SYMLINK+="disk/backup"
```

Esta variante, em vez de rodar um comando, cria um link simbólico estável `/dev/disk/backup` — imune à reordenação de `sda`/`sdb`. Você passa a referir o disco pelo nome simbólico, nunca mais pelo `sda`.

:::atencao
Regras em `/etc/udev/rules.d/` exigem root para serem criadas e, no SteamOS imutável, vivem no overlay de `/etc/` — ou seja, **sobrevivem a atualizações**, mas apenas se a Valve não sobrescrever o mesmo caminho. Use numeração alta (`99-...`) para garantir que suas regras vençam as padrão da distribuição, que usam prefixos menores.
:::

## Executando comandos e o problema do `RUN`

O `RUN+=` parece simples, mas esconde duas armadilhas. A primeira: o comando roda num ambiente isolado, sem seu PATH, sem variáveis e em paralelo com outros eventos. A segunda, e mais séria: `RUN` **não deve fazer trabalho bloqueante** — se o comando demora, ele segura o processamento do udev.

A solução recomendada pela própria documentação do udev é **desacoplar**: a regra só marca o evento, e um serviço systemd faz o trabalho de verdade. É o padrão `TAG+="systemd"` + `ENV{SYSTEMD_WANTS}`:

```terminal
$ cat /etc/udev/rules.d/99-backup-disk.rules
ACTION=="add", SUBSYSTEM=="block", ATTR{serial}=="WX12A3B4C5D6", \
    TAG+="systemd", ENV{SYSTEMD_WANTS}="backup-disk-mount.service"
```

Aqui a regra não roda nada — ela apenas diz ao systemd "quando este dispositivo aparecer, inicie `backup-disk-mount.service`". O serviço, por sua vez, faz a montagem com toda a robustez do systemd (dependências, logs, repetição):

```terminal
$ cat /etc/systemd/system/backup-disk-mount.service
[Unit]
Description=Monta o disco de backup quando conectado

[Service]
Type=oneshot
ExecStart=/usr/local/bin/mount-backup-disk
```

Essa divisão — udev detecta, systemd executa — é o padrão ouro para automação de hardware no Linux moderno e no SteamOS.

:::dica
Se o `RUN` for realmente necessário para algo minúsculo (um beep, um blink), mantenha-o não-bloqueante e com caminho absoluto. Qualquer coisa que envolva rede, disco ou processos longos deve ir para um serviço systemd.
:::

## Casos reais no Steam Deck

**Caso 1 — SSD externo para jogos.** O Steam Deck aceita instalar jogos num SD/SSD externo, mas a montagem automática do sistema pode montá-los com opções que não combinam com jogos (ex.: `noexec`). Uma regra que dispara uma montagem controlada:

```terminal
$ cat /etc/udev/rules.d/99-games-ssd.rules
ACTION=="add", SUBSYSTEM=="block", ENV{ID_FS_UUID}=="a1b2c3d4-...", \
    TAG+="systemd", ENV{SYSTEMD_WANTS}="games-ssd-mount.service"
```

**Caso 2 — carregador conectado.** O Deck muda o regime de energia ao plugar na tomada. Você pode reagir ao `change` da fonte `AC`:

```terminal
$ cat /etc/udev/rules.d/99-ac-power.rules
SUBSYSTEM=="power_supply", ATTR{type}=="Mains", ACTION=="change", \
    RUN+="/usr/local/bin/power-state-changed"
```

**Caso 3 — gamepad específico.** Ligar um perfil de controles quando um controle específico (pelo VID/PID USB) é conectado:

```terminal
$ cat /etc/udev/rules.d/99-custom-pad.rules
ACTION=="add", SUBSYSTEM=="input", ATTRS{idVendor}=="1234", ATTRS{idProduct}=="5678", \
    TAG+="systemd", ENV{SYSTEMD_WANTS}="custom-pad-profile.service"
```

Repare no `ATTRS{}` (plural) — ele busca nos "pais" do dispositivo, porque o `idVendor`/`idProduct` vive no controlador USB, não no nó de input em si.

## Recarregando e testando regras

Após criar uma regra, force o udev a reler e teste sem reconectar o dispositivo:

```terminal
$ sudo udevadm control --reload-rules
$ sudo udevadm trigger
```

O par `control --reload-rules` + `trigger` recarrega e re-dispara os eventos, aplicando a nova regra a dispositivos já presentes. Para testar uma regra em particular sem bagunçar o sistema, use o modo de simulação:

```terminal
$ udevadm test /devices/pci0000:00/.../block/sda 2>&1 | grep -E 'backup-disk|SYSTEMD_WANTS'
```

O `udevadm test` processa as regras contra aquele caminho e mostra o que casaria — essencial para depurar um match que "não funciona".

:::info
`udevadm test` mostra o resultado **antes** do `trigger`, sem executar efeitos colaterais reais (como `RUN`) por padrão. É seguro e é o seu amigo na hora de ver por que uma regra não dispara: ele imprime cada atributo disponível, para você conferir se o `ATTR{serial}` que digitou bate com o real.
:::

## Udev vs systemd: quem faz o quê

Resumindo a fronteira que esta seção traçou:

| Tarefa | Mecanismo |
|---|---|
| Detectar que um disco apareceu (match de atributos) | regra udev |
| Criar um link estável `/dev/disk/backup` | `SYMLINK+=` na regra |
| Montar o disco com lógica e dependências | `TAG+="systemd"` → serviço |
| Rodar um comando trivial não-bloqueante | `RUN+=` na regra |
| Agendar algo periódico | timer systemd (seção anterior) |

A regra de bolso: **udev casa e classifica; systemd executa e gerencia**. Misturar os dois (fazer o udev montar disco ou iniciar daemon) é o caminho para travamentos e dor de cabeça.

## Resumo

- O udev recebe eventos do kernel (`add`, `remove`, `change`) e os casa contra regras em `/etc/udev/rules.d/`.
- `udevadm info -a` obtém atributos; `udevadm monitor` observa eventos ao vivo; `ATTR{serial}` é o match mais estável.
- Regras casam com `==` e agem com `=`/`+=`; `RUN+=` roda comandos, `SYMLINK+=` cria links estáveis.
- O padrão recomendado é desacoplar: a regra marca com `TAG+="systemd"` + `ENV{SYSTEMD_WANTS}` e um serviço executa.
- No SteamOS imutável, regras em `/etc/udev/rules.d/` sobrevivem via overlay; use prefixo `99-` para vencer as padrão.
- `udevadm control --reload-rules` + `trigger` aplica; `udevadm test` valida o match sem efeitos colaterais.

## Exercícios

1. Rode `sudo udevadm monitor` e conecte/desconecte um SSD ou gamepad. Anote as ações (`add`/`remove`/`change`) e o subsistema de cada evento.
2. Com `udevadm info -a -n /dev/sdX` (do seu disco), identifique `serial`, `model` e `vendor`. Qual deles é o mais confiável para uma regra estável?
3. Crie uma regra com `SYMLINK+=` para dar um nome estável ao seu disco em `/dev/disk/`. Aplique com `reload-rules` + `trigger` e confirme com `ls -l /dev/disk/`.
4. Escreva uma regra `TAG+="systemd"` + `ENV{SYSTEMD_WANTS}` que inicie um serviço `oneshot` (que só loga no journal) ao conectar um dispositivo. Verifique o disparo no `journalctl`.
5. **Desafio.** Use `udevadm test` para depurar uma regra que não casa. Compare os atributos que o teste lista com os que sua regra espera e corrija o match. Documente a diferença entre `ATTR{}` e `ATTRS{}` com um exemplo real do seu hardware.
