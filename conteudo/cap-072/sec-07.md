Nuvem é conveniente, mas toda nuvem tem três pontos de falha: o servidor pode recusar o arquivo, a conexão pode estar offline quando você mais precisa, e o provedor pode encerrar o serviço (ninguém esqueceu do Google Stadia). Backup offline — em um pendrive, HD externo, cartão microSD ou NAS local — é a camada de segurança que não depende de terceiros e que funciona até com o Wi-Fi desligado. Esta seção cobre as ferramentas e os hábitos.

:::objetivos
- Criar backups manuais com `tar` e `rsync` dos saves Steam e não-Steam
- Automatizar backups com timer systemd e scripts de `rsync` incremental
- Restaurar saves de um backup offline para o local correto
- Implementar rotação de backups com `rsnapshot`
- Proteger backups contra corrupção silenciosa com checksums
:::

## `tar`: o snapshot completo

O jeito mais simples de fazer backup é empacotar tudo em um `.tar.gz` e copiar para um destino externo. Sem dependências, sem configuração, sem servidor:

```terminal
$ tar -czf ~/saves-backup-$(date +%Y%m%d).tar.gz \
    ~/.local/share/Steam/userdata/207304170/ \
    ~/all-saves/proton/ \
    ~/all-saves/native/ \
    ~/all-saves/emulation/ \
    ~/all-saves/heroic/
$ ls -lh ~/saves-backup-20250420.tar.gz
-rw-r--r-- 1 deck deck 847M Abr 20 17:00 saves-backup-20250420.tar.gz
```

O problema do `tar` completo é que ele recria o arquivo inteiro toda vez. Para 1 GB de saves, são 1 GB de gravação diária — em um cartão microSD, isso desgasta a mídia. A alternativa é `rsync`, que só copia o que mudou.

## `rsync`: incremental e eficiente

O `rsync` compara origem e destino e transfere apenas as diferenças. É a ferramenta certa para backups diários:

```terminal
$ rsync -av --progress --delete \
    ~/all-saves/ \
    /run/media/deck/BACKUP/saves/
sending incremental file list
./
proton/
proton/1245620/
proton/1245620/ER0000.sl2
          149876 100%   50.12MB/s   0:00:00
proton/1245620/ER0000.sl2.bak
          149870 100%   48.30MB/s   0:00:00

sent 301234 bytes  received 89 bytes  60246.00 bytes/sec
total size is 892456789  speedup is 2945.12
```

As flags importantes:

| Flag | Significado |
|---|---|
| `-a` | Archive mode: preserva permissões, timestamps, symlinks e estrutura de diretórios |
| `-v` | Verbose: mostra cada arquivo transferido |
| `--progress` | Barra de progresso por arquivo |
| `--delete` | Remove do destino arquivos que não existem mais na origem (cuidado!) |

:::perigo
A flag `--delete` apaga do destino qualquer arquivo que não esteja mais na origem. Se você acidentalmente inverter origem e destino, ou se a origem estiver vazia porque o disco não montou, o `rsync` vai **apagar todo o backup**. Sempre verifique o ponto de montagem antes:

```terminal
$ mountpoint /run/media/deck/BACKUP/ || echo "NÃO MONTADO — ABORTANDO"
$ ls /run/media/deck/BACKUP/saves/ | head -3  # Confirme que a pasta existe
```
:::

## Automatizando com timer systemd

Você pode criar um timer systemd de usuário que dispara o backup todo dia às 3h da manhã (quando o deck está carregando e você está dormindo):

```terminal
$ cat > ~/.config/systemd/user/saves-backup.service << 'EOF'
[Unit]
Description=Backup de saves para mídia externa
After=local-fs.target
Wants=local-fs.target

[Service]
Type=oneshot
ExecStartPre=/bin/mountpoint -q /run/media/deck/BACKUP || exit 1
ExecStart=/usr/bin/rsync -a --delete ~/all-saves/ /run/media/deck/BACKUP/saves/
EOF

$ cat > ~/.config/systemd/user/saves-backup.timer << 'EOF'
[Unit]
Description=Timer de backup diário de saves

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
EOF

$ systemctl --user daemon-reload
$ systemctl --user enable --now saves-backup.timer
$ systemctl --user list-timers --no-pager | grep saves
Sat 2025-04-20 17:22:00 -03  saves-backup.timer  saves-backup.service
```

A linha `ExecStartPre` usa `mountpoint -q` para checar se a mídia externa está montada. Se não estiver, o serviço falha com código 1 e o backup não roda — seguro.

:::dica
Se você usa um cartão microSD como destino (comum no Steam Deck), lembre-se de que microSDs montam com `nosuid,nodev,noexec` por padrão e que o ponto de montagem pode variar (`/run/media/deck/<UUID>` ou `/run/media/deck/<LABEL>`). Dê um label ao cartão com `fatlabel` ou `e2label` para garantir um ponto de montagem previsível:

```terminal
$ sudo fatlabel /dev/mmcblk0p1 BACKUP
$ ls /run/media/deck/BACKUP/
```
:::

## `rsnapshot`: rotação de snapshots

Para quem quer manter múltiplas versões do backup sem duplicar arquivos idênticos, o `rsnapshot` usa hard links para criar snapshots incrementais eficientes. Ele não está no Flathub, mas você pode instalá-lo no ambiente de desenvolvimento ou via `pacman` após desbloquear o sistema de arquivos:

```terminal
$ sudo steamos-readonly disable
$ sudo pacman -S rsnapshot
$ sudo steamos-readonly enable
```

Com o `rsnapshot`, você configura intervalos de retenção no `/etc/rsnapshot.conf`:

```terminal
$ grep -E "^retain|^backup" /etc/rsnapshot.conf
retain  daily   7
retain  weekly  4
retain  monthly 3
backup  /home/deck/all-saves/   localhost/
```

E então roda manualmente ou via cron/timer:

```terminal
$ rsnapshot daily
$ ls /var/cache/rsnapshot/
daily.0/  daily.1/  daily.2/  daily.3/
$ du -sh /var/cache/rsnapshot/daily.*/
1.2G    /var/cache/rsnapshot/daily.0/
 12M    /var/cache/rsnapshot/daily.1/
 8.4M   /var/cache/rsnapshot/daily.2/
 4.1M   /var/cache/rsnapshot/daily.3/
```

Repare: `daily.0` ocupa 1.2 GB, mas as versões mais antigas ocupam poucos megabytes. Isso acontece porque arquivos que não mudaram são representados como hard links para o mesmo inode no disco — ocupam espaço uma única vez. O `rsnapshot` é ideal para ambientes com pouco espaço, como o SSD interno de 64 GB dos decks de entrada.

## Restaurando um backup

O processo inverso: o SSD pifou, você reinstalou o SteamOS e precisa trazer os saves de volta:

```terminal
# Backup via tar:
$ tar -xzf /run/media/deck/BACKUP/saves-backup-20250420.tar.gz -C ~/
# Backup via rsync (invertendo origem e destino):
$ rsync -av /run/media/deck/BACKUP/saves/ ~/all-saves/
# Backup via rsnapshot:
$ cp -a /var/cache/rsnapshot/daily.0/localhost/all-saves/ ~/
```

Depois de restaurar, **abra cada jogo uma vez** para que o Steam Cloud reconcilie as versões. Se você restaurou um save local que é mais antigo que o remoto, o Steam vai baixar a versão remota e sobrescrever a sua recém-restaurada — nesse caso, feche o Steam, restaure o save de novo, e apague o `remotecache.vdf` (como visto na [seção sobre restauração](#/cap-072/sec-02)).

## Resumo

- `tar -czf` cria um snapshot completo; `rsync -a --delete` faz backup incremental apenas das diferenças.
- Um timer systemd de usuário com `OnCalendar=daily` automatiza o backup sem depender de cron.
- `mountpoint -q` no `ExecStartPre` evita que o backup rode com o destino desmontado.
- `rsnapshot` cria snapshots incrementais com hard links, economizando espaço no disco.
- Restaurar é a operação inversa da ferramenta usada; depois da restauração, reconcilie com o Steam Cloud.

## Exercícios

1. Crie um backup manual com `tar -czf` de todos os saves mapeados nos exercícios anteriores. Quanto tempo levou? Qual o tamanho do `.tar.gz`?
2. Configure um timer systemd que execute `rsync -a --delete` todo dia às 3h. Deixe rodar por dois dias e verifique se os arquivos novos foram copiados.
3. Simule uma restauração: mova a pasta `~/all-saves/` para outro lugar, depois restaure do backup com `rsync`. Confira se os saves voltaram exatamente iguais (use `diff -r`).
4. Instale e configure o `rsnapshot` com retenção `daily 7` e `weekly 4`. Execute `rsnapshot daily` três vezes e observe como o espaço em disco cresce.
5. **Desafio.** Escreva um script `pre-backup-check.sh` que, antes de cada backup, verifica: (a) destino montado, (b) espaço livre suficiente, (c) nenhum arquivo de save com tamanho zero. Integre ao timer systemd como `ExecStartPre` e faça o backup abortar se qualquer condição falhar.