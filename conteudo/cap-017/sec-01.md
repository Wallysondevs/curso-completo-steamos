Poucas coisas definem tanto a experiência de um console portátil quanto a capacidade de apertar o botão de energia, guardar o aparelho no bolso e, minutos ou dias depois, retomar o jogo exatamente de onde parou. No Steam Deck isso não é um truque de software da Valve: é o sistema de gerenciamento de energia do próprio Linux, exposto pelo systemd e pelo kernel, trabalhando em conjunto com a RAM do aparelho. Entender essa mecânica é o primeiro passo para diagnosticar quando a "mágica" falha.

:::objetivos
- Entender o que significa suspender um computador e por que o Deck faz isso em segundos
- Distinguir suspensão de desligamento completo
- Identificar o papel da RAM na retomada instantânea
- Conhecer os comandos que disparam e verificam a suspensão
:::

## O que é "suspender", afinal

Suspender é colocar a máquina num estado de baixíssimo consumo de energia sem perder o que está na memória. Diferente de desligar — que apaga a RAM e, na próxima ligada, recarrega o sistema do zero —, suspender congela o estado atual e deixa uma pequena corrente elétrica alimentar os chips de memória para que nada se perca. Quando você acorda a máquina, o processador retoma a execução do mesmo ponto onde parou, e em menos de um ou dois segundos o jogo está de volta na tela.

A grande diferença prática entre os dois caminhos está no tempo e no custo. Um desligamento completo no Deck demora alguns segundos para encerrar processos e, ao religar, precisa passar pelo firmware, pelo bootloader, pelo kernel e pelo Steam em modo desktop ou gaming antes de o jogo voltar. A suspensão pula quase tudo isso.

```terminal
$ systemctl suspend
```

Esse comando único pede ao systemd que coordene a suspensão do sistema. Você não vê muita coisa no terminal, porque a tela desliga logo em seguida — mas por trás, uma sequência ordenada de hooks é executada para garantir que disco, rede e gráficos entrem em suspensão com segurança.

## Por que a RAM é a estrela aqui

Num computador desligado, a RAM perde todo o conteúdo instantaneamente: sem energia, os transistores que armazenam cada bit se descarregam. É por isso que "desligar" e "perder o jogo" sempre andaram juntos na história dos PCs. A suspensão quebra essa regra mantendo os módulos de memória alimentados com uma fração mínima da energia normal.

Pense na RAM como uma lousa de giz. Desligar é apagar a lousa e jogar fora a caixa de giz; religar é desenhar tudo de novo do zero. Suspender é cobrir a lousa com um pano e escurecer a sala, mas deixar o giz lá, pronto para continuar a escrita. A lousa continua no mesmo lugar, com o mesmo desenho — só a iluminação mudou.

```terminal
$ free -h
               total        used        free      shared  buff/cache   available
Mem:            15Gi       4.1Gi       7.9Gi       1.2Gi       3.4Gi        9.8Gi
```

A linha `Mem:` mostra que, num Deck com 16 GiB, o jogo em execução ocupa alguns GiB da `used`. É exatamente esse conteúdo que a suspensão preserva. Por isso a retomada é instantânea: o jogo nunca saiu da memória, apenas ficou "congelado" junto com o resto do sistema.

## Suspend, hibernação e suas diferenças

Existe um primo mais radical da suspensão: a **hibernação** (`hibernate`). Em vez de manter a RAM alimentada, a hibernação grava o conteúdo inteiro da memória no disco e então desliga a máquina por completo — consumo zero. Ao religar, o kernel lê esse arquivo de volta para a RAM e o sistema retoma como se nada tivesse acontecido.

A troca é clara: hibernar gasta menos energia (na verdade, nada) mas demora mais para entrar e sair, porque gravar e ler vários GiB do SSD leva tempo. Suspender é instantâneo nos dois sentidos, mas consome um pouco de bateria por hora. No portátil, o Deck prioriza a suspensão justamente pelo retorno imediato — a característica que tornou o aparelho famoso.

```terminal
$ cat /sys/power/state
freeze mem disk
```

Essa linha lista os estados de energia que o seu kernel suporta: `freeze` (suspend-to-idle, o mais leve), `mem` (suspensão para a RAM, o S3 clássico) e `disk` (hibernação). A presença de `mem` é o que garante que o suspend do Deck funciona como você espera.

:::nota
O termo "suspend to RAM" vem exatamente da ideia de que a máquina suspende **para** a memória RAM: o estado do sistema fica residindo ali, e só a RAM continua recebendo energia. Daí a sigla tradicional **S3** que aparece em documentações de hardware e no ACPI, a interface de energia do firmware.
:::

## Quem orquestra tudo

A mágica não é um único programa, mas uma orquestração. O systemd coordena o processo, chamando uma unidade chamada `systemd-suspend.service`, que por sua vez executa scripts de hook antes e depois de o kernel entrar no estado de baixo consumo. A Valve acrescenta as próprias regras para desligar o brilho, pausar o áudio e desconectar o Bluetooth conforme necessário.

```terminal
$ systemctl status systemd-suspend.service
● systemd-suspend.service - System Suspend
     Loaded: loaded (/usr/lib/systemd/system/systemd-suspend.service; static)
     Active: inactive (dead)
       Docs: man:systemd-suspend.service(8)
```

O status `inactive (dead)` aqui não é erro: a unidade só "vive" durante o instante da suspensão. Ela nasce, executa os hooks, e morre assim que o kernel congela. Quando você acorda a máquina, uma unidade gêmea, `systemd-resume.service`, roda os hooks de retomada.

## Resumo

- Suspender congela o estado do sistema e mantém a RAM alimentada, permitindo retomada em segundos.
- Desligar apaga a RAM; religar recarrega tudo do zero. São caminhos fundamentalmente diferentes.
- `systemctl suspend` dispara a suspensão coordenada pelo systemd.
- `/sys/power/state` lista os estados suportados: `freeze`, `mem` (S3) e `disk` (hibernação).
- Hibernação grava a RAM no disco e consome zero energia, mas é mais lenta nos dois sentidos.
- A unidade `systemd-suspend.service` coordena os hooks que preparam o sistema antes de congelar.

## Exercícios

1. Rode `cat /sys/power/state` e copie a saída. Identifique se o seu sistema suporta `mem` (S3) e `disk` (hibernação).
2. Use `systemctl status systemd-suspend.service` e explique por que ele aparece como `inactive (dead)` mesmo com a suspensão funcionando.
3. Com `free -h`, anote quanta memória está em uso com um jogo aberto. Relacione esse número com o que fica "congelado" durante a suspensão.
4. Pesquise a diferença entre `freeze`, `mem` e `disk` na documentação de energia do kernel (`/sys/power/state`) e escreva um parágrafo explicando cada um.
5. **Desafio.** Sem ler as próximas seções, proponha por que um jogo online pode se comportar diferente de um jogo offline ao retomar da suspensão. Depois avance para as seções seguintes e compare sua hipótese com o conteúdo real sobre redes e timers.
