Rotacionar, comprimir e limitar — os logs crescem enquanto o sistema funciona, e sem uma política de rotação o SSD de 64 GB encheria em semanas. O `journald.conf` e o `logrotate` são as ferramentas que mantêm o diário do sistema enxuto, com arquivos previsíveis e tamanho controlado. No Steam Deck, onde cada megabyte conta, configurar corretamente o ciclo de vida dos logs é uma tarefa de manutenção essencial.

:::objetivos
- Entender como o journald gerencia tamanho, compressão e retenção
- Configurar `journald.conf` para limites adequados ao Steam Deck
- Usar `logrotate` para logs tradicionais fora do journal
- Inspecionar e podar logs acumulados manualmente
:::

## O que o journald controla

O `systemd-journald` é regido por um arquivo único: `/etc/systemd/journald.conf`. Nele você define quanto espaço o journal pode ocupar, se os arquivos são comprimidos, por quanto tempo são mantidos e se as entradas antigas são descartadas ou arquivadas. No Steam Deck, a configuração padrão do Arch/SteamOS tende a ser conservadora, mas vale inspecionar.

```terminal
$ cat /etc/systemd/journald.conf
[Journal]
#Storage=auto
#Compress=yes
#SystemMaxUse=
#RuntimeMaxUse=
#MaxFileSec=1month
```

As linhas comentadas mostram os defaults: `Storage=auto` (persiste se o diretório existir), `Compress=yes` (comprime por padrão), e limites de tamanho sem valor explícito, o que significa que o journald usará até 10% do sistema de arquivos.

## Ajustando limites para o Steam Deck

O default de 10% do sistema de arquivos pode significar 6 GB num deck de 64 GB — espaço demais para logs. Ajustar `SystemMaxUse` para algo como 100 M ou 200 M mantém um histórico útil para diagnóstico (semanas de mensagens) sem sacrificar o espaço que os jogos precisam.

```terminal
$ sudo nano /etc/systemd/journald.conf
# Descomente e ajuste:
SystemMaxUse=100M
RuntimeMaxUse=50M
MaxFileSec=2week
MaxRetentionSec=1month
```

Depois de editar, reinicie o serviço para aplicar:

```terminal
$ sudo systemctl restart systemd-journald
$ journalctl --disk-usage
Archived and active journals take up 32.0M in the file system.
```

Os 32 M já ocupados caem abaixo do novo teto de 100 M — o journald não apaga logs imediatamente, mas passa a respeitar o novo limite quando precisar escrever novas entradas.

:::atencao
Não configure `SystemMaxUse=0` achando que "desliga" o journal. Zero desabilita o limite, e o journal pode consumir o disco inteiro. Se quiser um limite mínimo, use `SystemMaxUse=10M`.
:::

## Comprimindo e arquivando

A compressão (`Compress=yes`) é ativada por padrão, mas você pode verificar se os arquivos estão de fato comprimidos. Os journals arquivados ficam em `/var/log/journal/<machine-id>/` com nomes como `system@xxxxx.journal` (ativos) e `system@xxxxx-xxxxx.journal` (arquivados). Um arquivo comprimido tem tamanho menor que o esperado e o `file` o identifica como `Journal file, compressed`.

```terminal
$ ls -lh /var/log/journal/*/
-rw-r----- 1 root systemd-journal 8.0M fev 20 10:00 system.journal
-rw-r----- 1 root systemd-journal 4.2M fev 18 08:00 system@0005a8f...journal
```

No exemplo, o arquivo ativo tem 8 M; o arquivado, 4.2 M — a compressão está funcionando. Se a compressão estivesse desligada, ambos teriam tamanhos próximos.

## Fora do journal: syslog, pacman, Steam

Nem tudo vai para o journal. Logs tradicionais como os do `pacman` (gerenciador de pacotes), do servidor X.org e do próprio Steam ficam em arquivos texto sob `/var/log/` e `~/.local/share/`. O `logrotate` cuida da rotação desses arquivos: renomeia, comprime e descarta versões antigas conforme regras escritas em `/etc/logrotate.conf` e `/etc/logrotate.d/`.

```terminal
$ ls /var/log/
Xorg.0.log  btmp  faillog  lastlog  pacman.log  wtmp
```

O `pacman.log` registra toda instalação, atualização e remoção de pacotes. Ele cresce devagar, mas num deck com anos de uso e muitos pacotes do AUR instalados, pode chegar a dezenas de megabytes. O logrotate padrão do Arch o mantém sob controle com compressão e retenção de 4 rotações.

```terminal
$ cat /etc/logrotate.d/pacman
/var/log/pacman.log {
  compress
  missingok
  notifempty
  rotate 4
}
```

A mesma lógica se aplica a qualquer log que você queira controlar. Se um jogo em particular escreve logs enormes em `~/.local/share/Steam/logs/`, você pode criar sua própria regra de logrotate apontando para lá — ou, mais simples, limpar periodicamente.

## Podando logs manualmente

Antes de uma operação grande (como um backup, um reset de garantia ou uma liberação de espaço para um jogo novo), vale fazer uma limpeza manual. O journal oferece `--vacuum-size`, `--vacuum-time` e `--vacuum-files` para poda seletiva.

```terminal
$ sudo journalctl --vacuum-time=2weeks
Deleted archived journal /var/log/journal/.../system@0005a8f...journal.
Vacuuming done, freed 42.0M of archived journals from 2 archives.
```

Esse comando remove todos os logs arquivados com mais de duas semanas. O histórico de diagnóstico recente permanece, e o espaço ocupado cai significativamente — no exemplo, 42 M foram liberados.

```terminal
$ sudo journalctl --vacuum-size=50M
$ sudo journalctl --vacuum-files=2
```

`--vacuum-size` poda até caber no limite; `--vacuum-files` mantém apenas os N arquivos mais recentes. São três formas de dizer "mantenha o que importa, descarte o resto".

:::dica
Antes de viajar com o deck ou antes de um RMA, faça uma limpeza com `--vacuum-time=1week`. Você mantém logs recentes o suficiente para o diagnóstico e libera espaço para o que vier depois.
:::

## Logs do Steam e da Steam Runtime

O cliente Steam e seus runtimes (soldier, sniper, scout) escrevem logs volumosos em texto puro. Eles não passam pelo journal e não são rotacionados automaticamente — cabe a você gerenciá-los.

```terminal
$ du -sh ~/.local/share/Steam/logs/
128M	/home/deck/.local/share/Steam/logs/

$ ls -lh ~/.local/share/Steam/logs/
total 128M
-rw-r--r-- 1 deck deck  32M fev 20 11:00 content_log.txt
-rw-r--r-- 1 deck deck  18M fev 20 11:00 bootstrap_log.txt
-rw-r--r-- 1 deck deck  8.0M fev 20 11:00 cloud_log.txt
```

`content_log.txt` registra downloads e verificações de arquivos; `bootstrap_log.txt` registra a inicialização do Steam; `cloud_log.txt` registra sincronizações com o Steam Cloud. Se você nunca limpou essa pasta, 128 M ou mais podem estar ocupados com entradas antigas que já não interessam.

```terminal
$ gzip ~/.local/share/Steam/logs/*.txt
```

Comprimir os logs antigos e zerar os ativos é uma rotina semestral saudável. O Steam reescreve os arquivos na próxima execução, então não há risco de quebrar nada.

## Resumo

- `journald.conf` controla tamanho máximo (`SystemMaxUse`), compressão e retenção do journal.
- Ajuste os limites para 100 M–200 M no Steam Deck para equilibrar diagnóstico e espaço.
- `--vacuum-size`, `--vacuum-time` e `--vacuum-files` podam logs sob demanda.
- `logrotate` cuida da rotação de logs tradicionais (`pacman.log`, Xorg) com compressão automática.
- Logs do Steam (`~/.local/share/Steam/logs/`) não são rotacionados automaticamente e merecem atenção periódica.

## Exercícios

1. Inspecione seu `/etc/systemd/journald.conf` e verifique quais parâmetros estão ativos (descomentados).
2. Meça o uso atual do journal com `--disk-usage` e decida se um `--vacuum-size` faz sentido para seu cenário.
3. Liste os arquivos em `/etc/logrotate.d/` e leia ao menos uma regra, identificando quantas rotações são mantidas e se há compressão.
4. Verifique o tamanho de `~/.local/share/Steam/logs/` e comprima os arquivos com mais de uma semana usando `gzip`.
5. **Desafio.** Crie um script de shell que execute `journalctl --vacuum-time=4weeks`, comprima os logs do Steam com mais de 7 dias e relate o espaço liberado. Agende-o com um timer systemd.