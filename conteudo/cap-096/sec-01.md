Toda vez que o Steam Deck liga, o primeiro programa que entra em execução não é o Steam, nem o desktop, nem o shell: é o `systemd`, que recebe o PID 1 e passa a governar o boot, os serviços, os logs e o desligamento. Quem usa o terminal profissionalmente esbarra nele em horas — para ver por que um serviço não subiu, para desligar em modo "limpo" ou para ler o que aconteceu no último boot. Esta seção começa pelo começo: o que o `systemd` é, por que substituiu o `init` tradicional e como ele enxerga o sistema.

:::objetivos
- Entender o papel do PID 1 e por que o `systemd` substituiu o `init`
- Identificar o `systemd` como o gestor de serviços, logs e boot do SteamOS
- Listar as unidades em execução com `systemctl`
- Verificar a árvore de processos a partir do PID 1
- Relacionar o `systemd` com os logs e timers que virão nas próximas seções
:::

## O processo 1 e o problema do boot

No Unix, o processo de PID 1 é especial: é o primeiro a nascer (o próprio kernel o executa) e o pai adotivo de todo processo que ficar órfão. Nas décadas de 1980 e 1990, esse papel era exercido por scripts de *init* — o SysV init fazia o boot executando scripts de shell em ordem, um por um, com números em `/etc/rc.d` ou `/etc/init.d`. Funcionava, mas era lento e frágil: não havia paralelismo, um script travado parava o boot inteiro e cada serviço era iniciado por um jeito diferente.

O `systemd`, aparecido por volta de 2010, reformulou isso. Em vez de scripts soltos, tudo vira uma **unidade** (unit) declarativa com dependências. O `systemd` lê essas dependências, inicia as coisas em paralelo quando possível e sabe reiniciar um serviço que morre. Quase todas as distribuições atuais — Arch (base do SteamOS), Ubuntu, Fedora — adotaram o `systemd` como PID 1.

```terminal
$ ps -p 1 -o pid,ppid,user,comm
    PID    PPID USER     COMMAND
      1       0 root     systemd
```

A saída confirma a regra de ouro: o PID 1 tem `PPID 0` (não tem pai, foi criado pelo kernel), roda como `root` e é o `systemd`. Nada mais ocupa esse lugar.

## O que o systemd administra

O nome "systemd" assusta um pouco porque é um guarda-chuva: não é um único programa, mas uma coleção de ferramentas que conversam entre si através de um *daemon* (processo em segundo plano) central. Vale separar os atores antes de avançar:

- **`systemd`** — o PID 1, orquestrador do sistema inteiro.
- **`systemctl`** — a ferramenta que você usa para falar com ele (ligar, desligar, habilitar).
- **`journald`** — coleta os logs; você os lê com `journalctl`.
- **`systemd-timer` / `systemd-logind` / `systemd-udevd`** — subsistemas com responsabilidades próprias.

Um dos motivos de o `systemd` ter vencido é a padronização: todo serviço se declara num arquivo de unidade com o mesmo formato, e o `systemctl` comanda todos eles. Isso torna o diagnóstico uniforme — a mesma sintaxe serve para o Wi-Fi, para o SSH e para um script seu.

Para ver o tamanho da coisa, liste quantas unidades estão ativas:

```terminal
$ systemctl list-units --type=service --no-pager --no-legend | wc -l
212
```

São 212 serviços sob gestão do `systemd`, cada um com estado, ativação e logs próprios. Nem todos rodam o tempo todo; muitos ficam adormecidos e sobem sob demanda (é o caso dos timers e de serviços ativados por soquete).

:::nota
O `systemd` é o PID 1, mas não faz *tudo* sozinho: ele delega tarefas a processos filhos. Por exemplo, o `journald` é um filho do `systemd` que recebe os logs. Isso explica por que, se você matar o `systemd`, o kernel entra em pânico e reinicia — ninguém fica para adotar os órfãos.
:::

## Uma olhada na árvore a partir do 1

Como todo processo descende do PID 1, olhar a árvore de processos revela a hierarquia do sistema. O `pstree` desenha isso de forma visual:

```terminal
$ pstree -p 1
systemd(1)─┬─systemd-journal(312)
           ├─systemd-udevd(398)
           ├─systemd-logind(782)
           ├─NetworkManager(833)─┬─{NetworkManager}(1225)
           │                     └─wpa_supplicant(1103)
           ├─steam(940)─┬─{steam}(1541)
           │            └─{steam}(1560)
           ├─dbus-daemon(766)
           ├─sshd(899)
           └─bash(2901)───pstree(3201)
```

Cada ramo mostra quem é filho de quem. O `systemd-journal` (que guarda os logs), o `NetworkManager` (a rede) e o `steam` (o cliente da Valve) pendem todos do mesmo tronco. O comando que você acabou de digitar, o `pstree`, também aparece — filho do seu `bash`, que por sua vez veio de um login gerenciado pelo `systemd-logind`. Quando um serviço trava e volta, é essa árvore que o `systemd` rearruma.

:::dica
Em vez de decorar dezenas de comandos, guarde a metáfora: `systemd` é o maestro, `systemctl` é a batuta, e units são os músicos com partitura. As próximas seções apenas afiam a batuta — a lógica é sempre "olhar o estado, pedir uma ação, conferir o resultado".
:::

## Onde isso se conecta com o resto do curso

O `systemd` aparece em capítulos anteriores do curso disfarçado. Quando você fez a atualização do SteamOS, o serviço `steamos-update` era uma unit controlada por `systemctl`; o `journalctl` que mostrou o resultado era o `journald`; e o desligamento "limpo" do aparelho é um target que pede a cada serviço que encerre com dignidade.

Neste capítulo, a progressão é esta: entender o que é o `systemd` (esta seção), reconhecer os tipos de unidade e seus estados, comandar serviços, e então mergulhar em logs, timers e targets. Feche esta seção sabendo responder uma pergunta simples e útil: **quem é o PID 1 e o que ele gerencia?** A resposta é o fio que costura as oito seções seguintes.

## Resumo

- O PID 1 é o primeiro processo, criado pelo kernel, sem pai (`PPID 0`) e responsável por adotar órfãos.
- O `systemd` substituiu o SysV init, trocando scripts sequenciais por unidades declarativas com dependências e paralelismo.
- `systemd` é o orquestrador; `systemctl` é a ferramenta de comando; `journald`/`journalctl` cuidam dos logs.
- `ps -p 1 -o pid,ppid,user,comm` e `pstree -p 1` revelam, respectivamente, o PID 1 e a árvore descendente dele.
- O `systemd` já apareceu no curso (atualização, desligamento, logs) e é o fio condutor das próximas seções.

## Exercícios

1. Rode `ps -p 1 -o pid,ppid,user,comm` e escreva, em uma frase, o que significam as colunas `PPID` e `COMM`.
2. Execute `systemctl --version` e identifique a versão do `systemd` no seu aparelho, comparando com a versão da base do SteamOS.
3. Liste os serviços ativos com `systemctl list-units --type=service --no-pager` e conte quantos há, descontando as linhas de rodapé.
4. Desenhe (ou descreva) os três primeiros níveis da árvore mostrada por `pstree -p 1` e localize nela o seu próprio shell.
5. **Desafio.** Use `systemd-analyze` (que será detalhado mais adiante) para medir quanto tempo o boot levou e tente explicar, a partir da árvore de processos, por que alguns serviços não atrasam o boot (dica: paralelismo e ativação sob demanda).
