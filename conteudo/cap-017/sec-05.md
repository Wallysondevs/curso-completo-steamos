Deixar jogos baixando durante a noite é um hábito universal. Mas o que acontece quando você aperta o botão de energia para suspender o Deck no meio de um download de 90 GiB? A resposta curta: o download para. A resposta completa envolve o systemd-inhibit, a política de energia do Steam, e uma decisão de design da Valve que surpreende muita gente.

:::objetivos
- Entender por que a rede desliga durante a suspensão
- Verificar como o Steam sinaliza que não quer ser suspenso durante downloads
- Conhecer o mecanismo de inhibitors que impede a suspensão automática
- Avaliar as opções para baixar sem interrupção
:::

## Rede e S3: uma incompatibilidade fundamental

Quando a CPU desliga em S3, não há ninguém processando pacotes IP. O controlador de rede pode até manter a conexão física e um buffer pequeno, mas o servidor do outro lado percebe o silêncio e, depois de alguns segundos sem confirmação (ACK), considera a conexão morta e a derruba. É o mesmo principio que explica a queda de jogos online — discutida com detalhe na seção sobre kick.

Para um download, a consequência é direta: o cliente Steam continua recebendo os dados que já chegaram, mas não pode confirmar o recebimento nem solicitar os próximos chunks. O download congela no ponto exato em que você suspendeu.

```terminal
$ systemd-inhibit --list --mode=block
WHO   UID  USER PID  COMM  WHAT                MODE
Steam 1000 deck 1234 steam sleep               block
```

O Steam, quando tem downloads ativos, registra um inhibitor com `MODE=block`: ele está dizendo ao systemd "não me suspenda agora, deixe meu trabalho terminar". É o mesmo mecanismo que um player de vídeo usa para não apagar a tela enquanto você assiste, ou que um gravador de disco usa para não interromper uma gravação.

:::info
Existem dois inibidores distintos que se confundem facilmente. O `WHAT=handle-lid-switch` impede a suspensão quando você fecha a tampa de um notebook; o `WHAT=sleep` impede a suspensão por qualquer motivo (tampa, botão, timer de inatividade). O Steam usa `sleep` durante downloads justamente para cobrir todos os gatilhos.
:::

## O que o Steam realmente faz

Na prática, o comportamento do Deck é assim: se você tem um download em andamento e aperta o botão de energia, o Steam — que segura o inhibitor `sleep block` — cancela a suspensão e mantém a máquina acordada, com a tela desligada ou em baixo brilho, para deixar o download concluir. A Valve escolheu esse caminho para que o usuário não seja pego de surpresa com um download pela metade.

Mas há limites. O inhibitor bloqueia a suspensão **automática** (timer de inatividade no modo desktop, por exemplo). Uma pressão explícita no botão de energia ainda pode forçar a suspensão, dependendo de como o Steam decide negociar aquele instante específico. Na maior parte dos casos, o download simplesmente continua.

```terminal
$ systemd-inhibit --list
WHO            UID  USER PID  COMM            WHAT                MODE
Steam          1000 deck 1234 steam           sleep               block
Steam          1000 deck 1234 steam           handle-power-key    block
```

Note a segunda linha: `handle-power-key`. O Steam também bloqueia a *ação padrão* do botão de energia enquanto baixa. Isso significa que, ao apertar o botão, em vez de suspender, o sistema pode apenas apagar a tela — o download segue rolando em background.

:::atencao
O inhibitor do Steam **não** sobrevive a uma ordem direta de suspensão pelo terminal. Se você rodar `systemctl suspend` manualmente (como fez em seções anteriores), está passando por cima do inhibitor? Não — o systemd respeita os inhibitors de `block` e recusará a suspensão com um erro. Para forçar, existe `systemctl suspend -i`, que ignora inibidores. Use com consciência.
:::

## Inspecionando um download ativo

Enquanto o Steam segura o inibidor, você pode confirmar o estado a qualquer momento. O comando `systemd-inhibit --list` mostra os inibidores ativos; para ver se algo está bloqueando a suspensão agora:

```terminal
$ systemd-inhibit --list
WHO            UID  USER PID  COMM            WHAT          MODE
Steam          1000 deck 1234 steam           sleep         block
2 inhibitors listed.
```

A presença de `sleep block` indica que, neste instante, uma suspensão seria recusada. Quando o download termina, o Steam remove o inibidor e a linha desaparece. É um ciclo de vida automático: o inibidor nasce com o primeiro byte e morre com o último.

Para observar o comportamento em tempo real, abra dois terminais. Num deles inicie um download no Steam; no outro:

```terminal
$ watch -n 2 systemd-inhibit --list
```

O `watch` reexecuta o comando a cada 2 segundos, permitindo ver o inibidor aparecer e sumir conforme você inicia e pausa o download.

## Suas opções para baixar sem sofrência

**Opção 1 — Deixar na tomada com Wi-Fi.** A mais óbvia: manter o Deck conectado e acordado, com a tela desligada. O Steam cuida do resto. É o cenário para o qual a Valve otimizou.

**Opção 2 — Usar o modo desktop.** No modo desktop, o gerenciador de energia do KDE tem regras próprias de inatividade. Você pode configurá-lo para nunca suspender enquanto há rede: `Settings → Power Management → Suspend Session → Automatically suspend` desativado.

**Opção 3 — Desativar a suspensão automática por completo.** Para quem faz downloads longos com frequência, desativar o timer de inatividade evita interrupções acidentais:

```terminal
$ systemd-inhibit --what=idle --why="Download em andamento" sleep 8h &
```

Esse comando, em background, segura um inibidor de `idle` por 8 horas. Enquanto ele viver, o sistema não suspende por inatividade. Para encerrar antes, mate o processo com `kill` ou simplesmente `fg` e `[[Ctrl+C]]`.

## Resumo

- A rede não funciona durante S3; sem processamento de pacotes, o servidor encerra a conexão.
- O Steam registra um inhibitor `sleep block` enquanto há downloads ativos, impedindo a suspensão automática.
- `systemd-inhibit --list` mostra os inibidores ativos; `handle-power-key` bloqueia a ação padrão do botão.
- `systemctl suspend -i` ignora inibidores e força a suspensão; use com cuidado.
- Manter o Deck na tomada com Wi-Fi é o caminho recomendado para downloads noturnos.

## Exercícios

1. Inicie um download no Steam e, em paralelo, rode `systemd-inhibit --list`. Capture o inibidor que aparece e seu `MODE`.
2. Pare o download e observe, com `watch -n 2 systemd-inhibit --list`, em quanto tempo o inibidor desaparece.
3. Rode `systemd-inhibit --what=idle --why="teste" sleep 60 &` e, durante essa janela, tente acionar a suspensão por inatividade. Explique o resultado.
4. Tente `systemctl suspend` enquanto um download está ativo e registre a mensagem de erro. Depois compare com o comportamento de `systemctl suspend -i`.
5. **Desafio.** Crie um script que verifique `systemd-inhibit --list`, e se houver um inibidor `sleep` ativo do Steam, espere ele sumir e só então execute `systemctl suspend`. Isso simula um "suspender depois que o download terminar".