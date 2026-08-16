O comando `rclone copy` resolve o envio pontual, mas espelhar pastas inteiras de forma confiável exige um degrau a mais de conhecimento. Esta seção mostra como usar `rclone sync`, `rclone bisync` para bidirecional e como montar remotos como se fossem pastas locais — além do truque que une tudo com cron ou systemd timers para que o Deck sincronize mesmo sem você lembrar.

:::objetivos
- Entender a diferença operacional entre `copy` e `sync`
- Dominar `rclone sync` com filtros de inclusão e exclusão
- Usar `rclone bisync` para sincronização bidirecional com conflito
- Montar um remote como sistema de arquivos local com `rclone mount`
- Automatizar a sincronização com systemd timer ou cron
:::

## `rclone sync`: destino como espelho

O `rclone sync` é a ferramenta certa quando você quer que uma pasta remota seja uma cópia exata da local. Ele sobe arquivos novos e modificados e, crucialmente, **remove** do destino o que não existe mais na origem.

```terminal
## Antes de sync, SEMPRE veja o que vai acontecer
$ rclone sync ~/sync/saves gdrive:Saves/ --dry-run --verbose
2025/08/15 12:00:01 NOTICE: zelda.srm: Copied (new)
2025/08/15 12:00:01 NOTICE: metroid.srm: Skipped (size same)
2025/08/15 12:00:01 NOTICE: antigo.srm: Deleted
2025/08/15 12:00:01 INFO  : There was nothing to transfer
2025/08/15 12:00:01 INFO  : Transferred: 0 B / 0 B, Checks 3, Deleted 1

## Depois de confirmar que a saída está correta, execute sem --dry-run
$ rclone sync ~/sync/saves gdrive:Saves/ --progress
Transferred:       34.234 KiB / 34.234 KiB, 100%, 0 B/s, ETA -
Transferred:            1 / 1, 100%
Elapsed time:         2.1s
```

A bandeira `--verbose` mostra o que cada arquivo sofreu (`Copied`, `Skipped`, `Deleted`). `--progress` exibe uma barra de progresso que funciona bem no terminal. Para sincronizações agendadas, `--quiet` suprime tudo exceto erros.

### Filtros: escolhendo o que espelhar

Nem toda pasta merece ser espelhada por inteiro. O rclone tem um sistema de filtros poderoso.

```terminal
## Sincronizar só saves de GBA e SNES, ignorando o resto
$ rclone sync ~/sync/saves gdrive:Saves/ \
    --include "*.srm" \
    --include "*.sav" \
    --include "*.state" \
    --exclude "*" \
    --dry-run
```

A ordem dos filtros importa: o rclone avalia do primeiro ao último e aplica o primeiro que casa. Por isso `--exclude "*"` vem por último: ele exclui tudo que não foi incluído pelos `--include` anteriores. Sempre verifique com `--dry-run` se a lógica está correta.

```terminal
## Outra estratégia: excluir padrões que sabemos serem lixo
$ rclone sync ~/sync/saves gdrive:Saves/ \
    --exclude "*.log" \
    --exclude ".Trash*/**" \
    --exclude "**/.cache/**" \
    --exclude "*.tmp" \
    --dry-run
```

:::dica
O rclone suporta arquivos de filtro (`--filter-from arquivo.txt`), o que é muito mais limpo para regras com mais de três linhas. Cada linha do arquivo é um filtro: `+ *.srm` para incluir, `- *.log` para excluir. Isso é o `.stignore` do rclone.
:::

## `rclone bisync`: bidirecional com regras de conflito

Até agora só falamos de espelhamento unidirecional. O `rclone bisync` foi introduzido para cenários onde dois lados podem ser alterados e você quer convergir. É o mais próximo de um Syncthing CLI que o rclone oferece.

```terminal
$ rclone bisync ~/sync/saves gdrive:Saves/ --resync --dry-run
2025/08/15 12:10:01 NOTICE: bisync: resync is set. 
The destination will be overwritten.
```

`bisync` é mais novo e tem ressalvas importantes: ele não usa watcher de sistema de arquivos (é sempre pontual), e a resolução de conflitos é mais limitada que a do Syncthing. Ainda assim, para um cenário simples ("terminou de jogar, rode o bisync, tudo converge"), funciona.

```terminal
## bisync com resolução de conflito: renomeia a versão "perdedora"
$ rclone bisync ~/sync/saves gdrive:Saves/ --conflict-resolve newer
```

As opções de conflito: `newer` (escolhe o mais recente), `older`, `larger`, `smaller` e `path1`/`path2` (favorece um lado). Quando nenhuma resolve, o `bisync` renomeia o arquivo com `.path1.` ou `.path2.` e deixa você decidir.

## `rclone mount`: a nuvem como pasta local

Montar um remote faz com que ele apareça no sistema de arquivos como se fosse uma pasta comum.

```terminal
$ rclone mount gdrive:Saves ~/CloudSaves --daemon
$ ls ~/CloudSaves/
zelda.srm  metroid.srm  mario.sav
$ df -h ~/CloudSaves
Filesystem      Size  Used Avail Use% Mounted on
gdrive:Saves    15G  3.8G   12G  24% /home/deck/CloudSaves
```

O `--daemon` devolve o controle do terminal imediatamente. Sem ele, o rclone mantém o processo em primeiro plano e você precisa de outro terminal. Para desmontar:

```terminal
$ fusermount -u ~/CloudSaves
```

A montagem é útil para jogos ou aplicativos que esperam acessar arquivos em uma pasta local específica: você monta o remote no caminho que o jogo espera e o rclone lida com upload/download transparente.

:::atencao
Montagens `rclone mount` têm latência de rede — não é como ler de um SSD local. Jogos que acessam saves constantemente podem sofrer micro-pausas ou corrupção se o arquivo for grande e a rede lenta. Prefira `rclone copy`/`sync` periódicos e mantenha saves locais durante o jogo.
:::

## Automatizando: do comando manual ao timer

Um comando `rclone sync` é inútil se você esquecer de rodá-lo. A solução é um timer systemd que dispara a sincronização em intervalos regulares.

```ini
# ~/.config/systemd/user/rclone-sync.service
[Unit]
Description=Sincronizar saves com rclone

[Service]
Type=oneshot
ExecStart=/usr/bin/rclone sync %h/sync/saves gdrive:Saves/ --quiet --log-file=%h/.cache/rclone-sync.log
```

```ini
# ~/.config/systemd/user/rclone-sync.timer
[Unit]
Description=Disparar rclone sync a cada 30 minutos

[Timer]
OnCalendar=*:0/30
Persistent=true

[Install]
WantedBy=timers.target
```

```terminal
$ systemctl --user daemon-reload
$ systemctl --user enable --now rclone-sync.timer
$ systemctl --user status rclone-sync.timer
● rclone-sync.timer
   Active: active (waiting) since Fri 2025-08-15 12:00:00 -03; 1min ago
   Trigger: Fri 2025-08-15 12:30:00 -03; 28min left
```

Com isso, o rclone roda a cada 30 minutos, mesmo em modo jogo, desde que o systemd de sessão do usuário `deck` esteja ativo. A seção 8 aprofunda esse padrão com mais tipos de timer e condições de disparo.

## Resumo

- `rclone sync` espelha a origem no destino e **deleta** o que falta no destino; sempre use `--dry-run` primeiro.
- Filtros (`--include`, `--exclude`, `--filter-from`) controlam o que entra no espelho.
- `rclone bisync` faz bidirecional com resolução de conflito (`newer`, `older`, rename).
- `rclone mount --daemon` monta o remote como pasta local; ideal para apps que esperam caminho fixo.
- Systemd timers (`rclone-sync.timer`) disparam sincronização periódica sem intervenção manual.

## Exercícios

1. Execute `rclone sync ~/sync/saves gdrive:teste-sync/` com `--dry-run` e depois sem, e confirme que os arquivos chegaram com `rclone ls`.
2. Crie um arquivo no destino que não existe localmente e execute outro `sync`. O arquivo foi deletado? Repita com `rclone copy` e explique a diferença.
3. Monte o remote com `rclone mount gdrive:teste-sync ~/mnt-teste --daemon` e crie um arquivo diretamente em `~/mnt-teste`. Desmonte e confirme que ele aparece no remote.
4. Escreva um arquivo de filtros com 5 regras (3 inclusões, 2 exclusões) e execute `sync` com `--filter-from`.
5. **Desafio.** Implemente um sync bidirecional com `bisync` entre uma pasta local e o remote, faça alterações conflitantes nos dois lados e documente como o `bisync` resolveu cada caso. Depois troque `--conflict-resolve newer` por `--conflict-resolve path1` e veja a diferença.