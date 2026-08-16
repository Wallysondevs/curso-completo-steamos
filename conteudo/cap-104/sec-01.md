O Steam Deck não pede manutenção como um carro — ele não avisa quando o cache está lotado, quando há pacotes órfãos ou quando o journalctl acumulou gigabytes de log. Mas a ausência de aviso não significa ausência de problema: a degradação de desempenho é lenta, silenciosa, e só se torna perceptível quando já custou semanas de uso abaixo do ideal. Uma rotina semanal de 10 minutos, se executada com disciplina, é o que separa um Deck que "ainda funciona" de um que continua tão rápido quanto no primeiro dia.

:::objetivos
- Estabelecer uma checklist semanal de manutenção do SteamOS
- Automatizar verificações com scripts simples e agendamento via systemd timer
- Identificar os indicadores de saúde do sistema: espaço, temperatura, logs
- Executar limpeza de cache, logs e pacotes de forma segura
- Criar o hábito de revisar o `journalctl` como parte da rotina
:::

## Por que semanal, e não mensal

A frequência importa mais do que a profundidade de cada verificação. Uma limpeza profunda a cada três meses deixa o Deck acumular lixo por semanas; uma rotina curta toda semana impede que o lixo se forme. O critério não é "parece sujo?", mas sim "faz sete dias". A disciplina remove a subjetividade.

No SteamOS, os vilões silenciosos são três: o cache do pacman que cresce a cada atualização, os logs do systemd que nunca expiram sozinhos, e o cache de shader dos jogos que ocupa gigabytes mesmo depois que o jogo é desinstalado. Cada um desses será tratado em seções específicas deste capítulo; aqui eles entram como itens da checklist.

:::dica
Marque um dia fixo na semana — sábado de manhã, por exemplo — e execute a rotina sempre no mesmo dia. Associar a manutenção a um gatilho fixo do calendário é mais eficaz do que depender da memória ou da "sensação de lentidão".
:::

## A checklist semanal em sete itens

Cada item é um comando ou um script que você executa e interpreta. O objetivo não é que todos encontrem problema toda semana — é que nenhum problema passe despercebido por mais de sete dias.

```terminal
$ df -h | grep -E '^/dev|Filesystem'
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p4  456G  289G  144G  67% /
/dev/nvme0n1p1  511M   34M  478M   7% /boot
```

O `df -h` é o primeiro comando da rotina. Se a raiz passar de 80%, é hora de agir — e a seção 7 deste capítulo mostra exatamente como descobrir o que está ocupando espaço.

O segundo item é `journalctl --disk-usage`. O journal do systemd é persistente no SteamOS e, sem limite configurado, pode ultrapassar 4 GB:

```terminal
$ journalctl --disk-usage
Archived and active journals take up 3.1G in the file system.
```

Abaixo de 500 MB é saudável; acima de 2 GB merece um `sudo journalctl --vacuum-size=500M`. A seção 8 detalha como configurar limites permanentes.

O terceiro item é verificar atualizações pendentes com `pacman -Qu` (no modo leitura-escrita) ou `flatpak update --dry-run`. A seção 4 mostra como aplicar atualizações com segurança. O importante aqui é saber que elas existem — um Deck com 47 pacotes pendentes há duas semanas é um Deck que está acumulando vulnerabilidades.

O quarto item é `sudo pacman -Sc` (apenas verificar, sem limpar ainda) para listar o tamanho do cache de pacotes. A seção 3 cobre a limpeza completa.

## Automatizando com um script e um timer

A checklist não precisa ser lembrada: ela pode ser executada automaticamente e enviar um resumo para um arquivo que você consulta. Um script em `~/bin/checkup` faz o trabalho:

```bash
#!/bin/bash
# checkup — snapshot de saúde semanal do Steam Deck

OUT="$HOME/lab/checkups/$(date +%Y-%m-%d).log"
mkdir -p "$(dirname "$OUT")"

{
  echo "=== checkup $(date) ==="
  echo
  echo "--- DISK ---"
  df -h / /home /boot
  echo
  echo "--- JOURNAL ---"
  journalctl --disk-usage
  echo
  echo "--- TEMP ---"
  sensors 2>/dev/null | grep -E 'Package|temp1'
  echo
  echo "--- UPDATES ---"
  flatpak update --dry-run 2>&1 | tail -5
} > "$OUT"
```

O script não modifica nada — só coleta. Você decide o que fazer com os dados. Para agendá-lo, um systemd timer é mais confiável que um cron (que depende do sistema estar ligado na hora exata):

```ini
# ~/.config/systemd/user/checkup.service
[Unit]
Description=Snapshot de saúde semanal do Steam Deck

[Service]
Type=oneshot
ExecStart=%h/bin/checkup
```

```ini
# ~/.config/systemd/user/checkup.timer
[Unit]
Description=Dispara checkup toda segunda às 9h

[Timer]
OnCalendar=Mon 09:00
Persistent=true

[Install]
WantedBy=timers.target
```

```terminal
$ systemctl --user enable checkup.timer
$ systemctl --user start checkup.timer
$ systemctl --user list-timers --no-pager
NEXT                        LEFT       LAST PASSED  UNIT
Mon 2026-07-13 09:00:00 -03 5 days left -    -      checkup.timer
```

Com `Persistent=true`, se o Deck estiver desligado na segunda às 9h, o timer dispara assim que ele ligar. Você nunca perde uma execução.

## O que fazer com os resultados

Um arquivo de log por semana não serve para nada se você nunca lê. Mas também não é preciso ler todos: o hábito é abrir o último, uma vez por semana, e passar 30 segundos nele. Espaço estável, temperatura normal, zero atualizações críticas? Fechou, missão cumprida. Algo mudou? Aí sim você investiga.

```terminal
$ cat ~/lab/checkups/2026-07-06.log
=== checkup Sun Jul  6 09:00:01 -03 2026 ===

--- DISK ---
/dev/nvme0n1p4  456G  310G  123G  72% /
/dev/nvme0n1p1  511M   34M  478M   7% /boot

--- JOURNAL ---
Archived and active journals take up 488.0M in the file system.

--- TEMP ---
Package id 0:  +42.3°C

--- UPDATES ---
 1. org.freedesktop.Platform.GL.default  24.08
```

Quatro linhas bastam para saber que está tudo bem — exceto pelo espaço que subiu de 67% para 72% em relação à semana anterior. É um sinal para investigar antes que chegue a 80%.

:::nota
Compare o checkup desta semana com o da semana passada. Tendências importam mais que valores absolutos. Um disco que sobe 2% por semana vai bater 90% em dois meses — você quer enxergar isso com antecedência, não na véspera do estouro.
:::

## Resumo

- Uma rotina semanal de 10 minutos impede a degradação silenciosa do Steam Deck.
- A checklist mínima cobre espaço em disco, logs do systemd, temperatura e atualizações pendentes.
- Automatize a coleta com um script agendado via systemd timer, não com cron.
- Use `Persistent=true` no timer para não perder execuções quando o Deck estiver desligado.
- Compare tendências entre semanas; o valor absoluto de hoje só faz sentido contra o de ontem.
- O script não deve modificar o sistema — ele coleta dados; as ações corretivas ficam para você.

## Exercícios

1. Rode `df -h`, `journalctl --disk-usage` e `sensors` (se disponível) e anote os três valores. Este é seu baseline da semana zero.
2. Escreva um script `~/bin/checkup` que gere um arquivo de log com a saída desses três comandos. Execute-o manualmente e confira se o arquivo foi criado.
3. Configure um systemd timer para executar o script toda segunda-feira às 9h e verifique com `systemctl --user list-timers` que ele está agendado.
4. Simule uma semana de intervalo: espere um dia, rode o script de novo e compare os dois arquivos com `diff`. Há alguma mudança? Se sim, ela é esperada?
5. **Desafio.** Adicione ao script uma seção que conta quantos snapshots do Btrfs existem (use `sudo btrfs subvolume list / | wc -l`) e emite um alerta no log se houver mais de 30 snapshots acumulados. Teste com `sudo btrfs subvolume list / | head` para ver se o comando funciona no seu Deck.