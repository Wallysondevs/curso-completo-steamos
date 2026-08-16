O que torna o Steam Deck um console e não apenas um PC portátil é a confiança de que o jogo vai estar lá quando você voltar. Apertar o botão de energia no meio de uma batalha de Elden Ring e retomar três horas depois como se o tempo tivesse congelado é a experiência que vendeu o aparelho. Mas o que acontece de fato com o processo do jogo enquanto a tela está apagada? O kernel congela absolutamente tudo — e "absolutamente" tem nuances importantes.

:::objetivos
- Entender como o kernel congela o processo do jogo durante S3
- Diferenciar o congelamento de usuário do congelamento de kernel
- Identificar o que pode dar errado com GPU, áudio e input na retomada
- Verificar o estado dos processos antes e depois da suspensão
:::

## Freeze: como o kernel congela um processo

Quando o systemd dispara a suspensão, a primeira etapa é o *freeze* do espaço de usuário: o kernel envia um sinal para cada processo, pedindo que ele pare de executar em um ponto seguro. Não é um `SIGSTOP` comum — é um mecanismo do *cgroup freezer*, um subsistema do kernel que congela processos no nível do escalonador. O processo não é "pausado", ele é removido da fila de tarefas elegíveis para execução.

A diferença prática: um processo congelado pelo cgroup freezer não responde a sinal nenhum, não consome CPU, não pode ser acordado acidentalmente. Ele simplesmente desaparece do radar do escalonador até o *thaw* (descongelamento) na retomada.

```terminal
$ systemd-inhibit --list
WHO            UID  USER PID  COMM            WHAT                  MODE
Steam          1000 deck 1234 steam           handle-power-key      block
Steam          1000 deck 1234 steam           handle-suspend-key    block
Steam          1000 deck 1234 steam           sleep                 delay
gamescope      1000 deck 1456 gamescope       sleep                 delay
```

A saída mostra que tanto o Steam quanto o Gamescope (o compositor de Wayland do Deck) estão registrando *inhibitors* — bloqueios que impedem a suspensão de ocorrer enquanto o jogo não estiver pronto para ser congelado. O modo `delay` significa que eles querem um tempo de preparação antes de o kernel congelar tudo. Isso evita que o jogo seja congelado no meio de uma gravação de save ou de um acesso a disco.

## GPU e Direct Rendering Manager

Congelar a CPU é simples. Congelar a GPU, nem tanto. O driver da GPU (no Deck, o `amdgpu` para a APU AMD) precisa salvar o estado do hardware gráfico — buffers de quadro, contextos de shader, texturas carregadas — e restaurá-lo na volta. Quem gerencia isso é o **DRM** (*Direct Rendering Manager*), o subsistema do kernel que dá acesso direto à GPU para aplicações como jogos.

Se o DRM falhar ao salvar ou restaurar o estado da GPU, o que você vê na retomada pode ser uma tela preta, glitches gráficos, ou o jogo rodando mas sem renderizar nada. É um dos bugs mais comuns em hardware menos testado, e um dos motivos pelos quais a Valve escreveu seus próprios hooks de suspensão integrados ao Gamescope.

```terminal
$ journalctl -u systemd-suspend --since "5 minutes ago"
ago 12 21:45:03 steamdeck systemd[1]: Starting systemd-suspend.service - System Suspend...
ago 12 21:45:03 steamdeck systemd-sleep[2104]: Suspending system...
ago 12 21:45:03 steamdeck systemd-sleep[2104]: INFO: running /usr/lib/systemd/system-sleep/gamescope-suspend pre...
ago 12 21:45:04 steamdeck gamescope-suspend[2108]: Saving GPU state for session deck
ago 12 21:45:04 steamdeck gamescope-suspend[2108]: GPU state saved.
```

O log mostra o hook `gamescope-suspend` rodando no estágio `pre`, salvando o estado da GPU. Na retomada, esse mesmo script roda no estágio `post` e restaura o que foi salvo.

:::dica
O diretório `/usr/lib/systemd/system-sleep/` contém scripts executados por `systemd-suspend` em dois momentos: com o argumento `pre`, antes de suspender, e `post`, ao acordar. Você pode escrever o seu próprio script ali para, por exemplo, pausar um servidor local antes da suspensão. Basta que seja executável e siga a convenção de receber dois argumentos: `$1` é `pre` ou `post`, `$2` é `suspend`, `hibernate` ou `hybrid-sleep`.
:::

## A RAM é o repositório do jogo

Durante a suspensão S3, o conteúdo da memória física não muda. Cada byte que o jogo alocou — texturas, modelos 3D, saves não gravados, o estado interno da engine — permanece exatamente no mesmo endereço físico. O circuito de self-refresh da RAM garante que os bits não decaiam. Quando a CPU religa, o kernel encontra a memória intacta e simplesmente retoma o escalonador de onde parou.

Por isso a retomada é independente do tamanho do jogo. Seja um jogo indie de 200 MiB ou um AAA que ocupa 8 GiB de RAM, o tempo de acordar é essencialmente o mesmo: o kernel não está recarregando nada do disco, só está religando a CPU e restaurando os estados dos dispositivos.

```terminal
$ uptime -s
2025-08-12 14:22:11
$ uptime
 21:45:30 up 7:23, 2 users, load average: 0.87, 0.64, 0.52
```

O `uptime -s` informa desde quando o sistema está "acordado" — mas repare: ele mostra o boot, não a última retomada. Se você suspendeu e acordou várias vezes, `uptime` exclui o tempo em S3. Para ver quantas vezes a máquina passou por S3, o `journalctl` é mais útil.

## O que não sobrevive (e não deveria)

Nem tudo é preservado automaticamente. Conexões de rede TCP expiram — o servidor do outro lado não sabe que você suspendeu e, depois de alguns segundos sem resposta, fecha a conexão. Timers de kernel continuam contando enquanto o sistema está em S3? Não; o relógio de parede (`CLOCK_REALTIME`) é restaurado na retomada, mas timers baseados em monotonic time (`CLOCK_MONOTONIC`) não avançam durante S3, porque a CPU não está gerando ticks.

Isso tem uma consequência prática: se seu jogo exibe um cronômetro interno baseado em `CLOCK_MONOTONIC`, ele não terá "contado" o tempo em que o Deck esteve suspenso. Jogos que usam `CLOCK_REALTIME`, por outro lado, podem perceber um salto no relógio. A maioria das engines modernas (Unity, Unreal, Godot) lida com isso detectando o evento de retomada e recalibrando.

## Resumo

- O kernel congela processos com o cgroup freezer, removendo-os da fila do escalonador.
- `systemd-inhibit --list` mostra quais programas bloqueiam ou atrasam a suspensão.
- O DRM salva o estado da GPU antes da suspensão; scripts em `/usr/lib/systemd/system-sleep/` executam hooks `pre` e `post`.
- A RAM mantém o jogo intacto durante S3; a retomada não depende do tamanho do jogo.
- Conexões de rede TCP expiram durante S3; timers de `CLOCK_MONOTONIC` não avançam.

## Exercícios

1. Com um jogo aberto, execute `systemd-inhibit --list` e identifique quais inibidores estão ativos. Qual o modo de cada um e por quê?
2. Inspecione o diretório `/usr/lib/systemd/system-sleep/` e liste pelo menos três scripts. Leia um deles e descreva o que faz.
3. Use `uptime -s` antes e depois de uma suspensão curta. O valor mudou? Explique por quê.
4. Rode `journalctl -u systemd-suspend --since "1 hour ago"` e encontre as mensagens de `pre` e `post`. Colete os nomes dos scripts executados.
5. **Desafio.** Escreva seu próprio script em `/usr/lib/systemd/system-sleep/` que grave um log em `/tmp/suspend-log.txt` com a data e hora de cada suspensão e retomada. Suspenda o Deck, acorde-o e verifique se o log foi gerado corretamente.