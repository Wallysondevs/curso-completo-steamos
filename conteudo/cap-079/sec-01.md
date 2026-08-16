O Steam Deck é, debaixo do modo de jogo e da interface da Valve, um computador Linux completo. E computador Linux completo significa que quase tudo o que você faz de forma repetitiva no teclado ou no mouse pode ser transformado em um script. Este capítulo é sobre dominar esse lado: levar o Deck de "console que roda Linux" para "estação de trabalho que você automatiza do seu jeito". Vamos cobrir Bash, serviços do usuário com systemd, regras de udev para responder a dispositivos, autostart e tudo que conecta essas peças num fluxo de automação confiável.

:::objetivos
- Entender o modelo de usuário e de processos do SteamOS (por que `deck` é seu usuário e por que isso importa para automação)
- Mapear os lugares onde a automação "mora": scripts, unit files, regras de udev e diretórios de autostart
- Conhecer o que o SteamOS já automatiza por baixo dos panos, para não reinventar a roda nem brigar com o sistema
- Definir a fronteira entre o que roda no modo Desktop e o que roda no Gaming Mode
- Preparar o terreno: diretórios, permissões e binários essenciais que as próximas seções usam
:::

## Um Linux (quase) comum

O SteamOS 3 é construído sobre um Arch Linux com algumas modificações da Valve. Isso tem uma consequência direta e prática: a maior parte do conhecimento e das ferramentas de automação do mundo Linux vale aqui. `bash`, `systemd`, `udev`, `cron` (via systemd timers) e os diretórios de autostart do XDG funcionam da mesma forma que em qualquer distro com systemd.

A grande particularidade é a **imutabilidade básica** do sistema. A partição raiz (`/`) é somente-leitura e controlada por imagens A/B assinadas. Você não instala pacotes com `pacman -S` diretamente na raiz (o SteamOS 3.0 a 3.4 permitia, mas era sobrescrito na atualização; versões mais novas adotaram um esquema mais fechado). O que isso significa para a automação:

```terminal
$ mount | grep " / "
/dev/nvme0n1p4 on / type btrfs (ro,relatime,ssd,space_cache,subvolid=5,subvol=/@)
```

A raiz montada como `ro` (read-only). Isso não impede automação — na verdade a direciona. Tudo que é seu vive em `/home/deck/` e `/var/`, que são graváveis. Scripts pessoais, unit files de usuário, regras de udev customizadas e configurações de autostart devem ficar no espaço do usuário ou em `/etc/` onde o sistema permite overlay.

:::info
Nas versões mais recentes do SteamOS, a Valve adota um modelo de **overlay** para `/etc/`: arquivos de configuração são gravados numa camada superior que sobrevive às atualizações do sistema, enquanto o restante da raiz volta ao estado de fábrica a cada versão. É por isso que `systemctl --user` (espaço do usuário, em `/home`) é a via preferida para automação: nada ali é apagado quando o SteamOS atualiza.
:::

## Onde a automação mora

Existem quatro mecanismos principais, cada um com um propósito e um "gatilho" diferente. Saber qual usar para cada tarefa é metade do trabalho:

| Mecanismo | Onde vive | O que dispara | Uso típico |
|---|---|---|---|
| **Script shell** | qualquearquivo `.sh` executável | invocação manual, alias, outro script | tarefas pontuais ou compostas |
| **systemd user service/timer** | `~/.config/systemd/user/` | boot, login, agendamento, eventos | serviços persistentes e agendados |
| **udev rule** | `/etc/udev/rules.d/` | conexão/desconexão de hardware | reagir a dock, gamepad, SSD externo |
| **Autostart XDG** | `~/.config/autostart/` | início da sessão gráfica | apps que precisam abrir na GUI |

Há uma frase que resume a escolha: *"se roda uma vez e termina, é script; se roda para sempre, é serviço; se reage a um fio plugado, é udev; se aparece na tela, é autostart."*

```terminal
$ ls ~/.config/
systemd/  autostart/  ...
$ ls ~/.config/systemd/user/ 2>/dev/null
$ ls /etc/udev/rules.d/
```

No SteamOS recém-formatado, `~/.config/systemd/user/` costuma estar vazio (ou nem existir). É um espaço seu, pronto para preencher.

## O que o SteamOS já automatiza para você

Antes de escrever qualquer automação, vale ver o que já roda — tanto para aprender padrões quanto para não duplicar. O SteamOS usa serviços systemd próprios no nível do sistema:

```terminal
$ systemctl list-units --type=service --state=running | grep -i "steam\|gamescope"
  gamescope-session.service     loaded active running  Gamescope compositing session
  steam-webhelper.service       loaded active running  Steam Web Helper
  steamos-offload.target        loaded active active    SteamOS offload target
```

O `gamescope-session` é particularmente importante: é o compositor que fica atrás do Gaming Mode. Entender que ele é apenas um serviço systemd muda a forma como você pensa sobre automação no Deck — você pode, em teoria, encadear sua própria lógica ao redor dele, como veremos na seção 7.

```terminal
$ systemctl --user list-timers --no-pager | head
NEXT                        LEFT          LAST                        PASSED    UNIT                       ACTIVATES
Thu 2025-05-01 03:00:00 UTC 7h left       Wed 2025-04-30 03:00:00 UTC 16h ago   systemd-tmpfiles-clean.timer systemd-tmpfiles-clean.service
```

O próprio systemd já tem timers padrão ativos (como a limpeza de arquivos temporários). Você constrói sobre a mesma infraestrutura, com as mesmas ferramentas.

## Modo Desktop vs Gaming Mode

Uma distinção que atravessa o capítulo inteiro. O Steam Deck tem dois "rostos":

- **Gaming Mode (Gamescope):** a interface de console, onde o jogo roda em tela cheia e você navega com os controles. Aqui não há desktop, não há terminal visível — mas processos e serviços continuam rodando em segundo plano.
- **Desktop Mode (KDE Plasma):** um desktop Linux pleno, com Konsole, Dolphin e liberdade total.

A automação precisa saber em qual dos dois ela vai operar. Um serviço de usuário do systemd roda **nos dois**, porque o systemd de usuário (`systemd --user`) inicia no login e independe do ambiente gráfico. Já um item de autostart XDG só faz sentido no Desktop Mode — lá existe uma sessão gráfica com um desktop que pode exibir janelas.

```terminal
$ systemctl --user status | head -1
● steamdeck
    State: running
```

Repare: mesmo dentro do Gaming Mode, o `systemd --user` está ativo. Isso é o que permite, por exemplo, um serviço que monitora o estado do jogo e loga em segundo plano enquanto você joga — tema das seções 6 e 7.

:::atencao
Não confunda os três níveis de inicialização. O **boot do sistema** (`systemctl` sem `--user`) roda como root e começa no kernel; o **login do usuário** (`systemctl --user`) começa quando a sessão do usuário `deck` abre; e a **sessão gráfica** (autostart XDG) começa quando o Plasma sobe. Cada um tem um escopo de quando e com que permissões a automação roda.
:::

## Preparando o terreno

As próximas seções assumem alguns diretórios e hábitos. Crie-os agora:

```terminal
$ mkdir -p ~/bin ~/.config/systemd/user ~/.config/autostart
$ echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
$ source ~/.bashrc
```

- `~/bin` é onde ficam seus scripts executáveis, fora de `~/.local/bin` (que algumas ferramentas também usam). Escolha um e seja consistente.
- `~/.config/systemd/user` é o lar dos unit files de usuário.
- `~/.config/autostart` é o lar dos arquivos `.desktop` de autostart.

Verifique as ferramentas-base:

```terminal
$ bash --version | head -1
GNU bash, version 5.2.15(1)-release (x86_64-pc-linux-gnu)
$ systemctl --version | head -1
systemd 255 (255.4-1-arch)
$ udevadm --version
255
```

Se qualquer comando falhar, a automação terá de contornar essa ausência — mas no SteamOS padrão todos eles estão presentes.

## Resumo

- O SteamOS é um Arch Linux com raiz imutável; a automação vive no espaço do usuário (`/home/deck`) e em `/etc/`.
- Quatro mecanismos cobrem quase tudo: script shell, serviço/timer systemd de usuário, regra udev e autostart XDG.
- O systemd de usuário roda no Desktop **e** no Gaming Mode; o autostart XDG só no Desktop.
- O SteamOS já roda serviços próprios (gamescope, webhelper, timers padrão) que servem de referência.
- Preparar `~/bin`, os diretórios de systemd/autostart e conferir Bash/systemd/udev é o passo zero.

## Exercícios

1. Rode `mount | grep " / "` e confirme que a raiz está montada como somente leitura (`ro`). O que isso implica para onde você deve colocar seus scripts?
2. Liste os timers ativos do seu sistema com `systemctl --user list-timers` e com `systemctl list-timers`. Anote quais pertencem ao usuário e quais ao sistema.
3. Crie `~/bin`, `~/.config/systemd/user` e `~/.config/autostart`, e adicione `~/bin` ao `PATH`. Confirme com `which` que um script colocado lá é encontrado.
4. Inicie o Gaming Mode, abra um terminal via SSH (se habilitado) e rode `systemctl --user status`. O sistema de usuário está rodando fora do Desktop? O que isso permite?
5. **Desafio.** Investigue os unit files do SteamOS com `systemctl cat gamescope-session.service`. Quais dependências (`After=`, `Requires=`) esse serviço declara? O que elas revelam sobre a ordem de inicialização do Gaming Mode?
