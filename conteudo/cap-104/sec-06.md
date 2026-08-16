Backup é a promessa de que seus dados sobrevivem a você mesmo — ao erro de digitar `rm -rf` numa pasta errada, à atualização que corrompeu o sistema, ao SSD que morreu sem avisar. No Steam Deck, com 512 GB (ou menos), o desafio não é encontrar ferramenta de backup: é fazer caber. A estratégia certa combina snapshots locais (para recuperação instantânea) com cópias externas (para sobreviver a falha de hardware), e trata cada categoria de dado com o peso que ela merece.

:::objetivos
- Diferenciar backup de snapshot e entender quando cada um resolve o problema
- Configurar uma política de snapshots Btrfs com snapper
- Sincronizar dados importantes com `rsync` para mídia externa
- Definir o que copiar (dados, configuração) e o que ignorar (cache, downloads)
- Praticar restauração para validar que o backup realmente funciona
:::

## Snapshot vs. backup: são coisas diferentes

Um **snapshot** é um retrato do sistema no mesmo disco, tirado em segundos e quase sem custo de espaço (graças ao copy-on-write do Btrfs). Ele protege contra erro humano — deletou o arquivo errado, instalou um pacote que corrompeu a configuração. Mas não protege contra falha do SSD: se o disco físico morrer, o snapshot morre junto.

Um **backup** é uma cópia em mídia separada — SD card, SSD externo, NAS, nuvem. Protege contra falha de hardware. Leva mais tempo e ocupa o dobro do espaço (os dados + a cópia).

A estratégia completa usa os dois: snapshots no disco para recuperação rápida, backups externos para desastre real.

```terminal
$ sudo btrfs subvolume list / | head -5
ID 256 gen 102415 top level 5 path @
ID 257 gen 102415 top level 5 path @home
ID 258 gen 102415 top level 5 path @root
ID 259 gen  84512 top level 5 path @snapshots/2026-07-12-pre-update
```

Os subvolumes `@`, `@home` e `@root` são a estrutura padrão do SteamOS. Snapshots criados no caminho `@snapshots/` ficam isolados e não aparecem na árvore normal de diretórios, mas podem ser acessados via montagem.

## Snapshots automáticos com snapper

O `snapper` automatiza a criação e a rotação de snapshots. Ele cria pares pré/pós sempre que o pacman executa uma operação, e também snapshots agendados por hora, dia ou semana. A configuração recomendada para o Deck:

```terminal
$ sudo snapper -c root create-config /
$ sudo snapper -c root set-config "TIMELINE_CREATE=yes"
$ sudo snapper -c root set-config "TIMELINE_LIMIT_HOURLY=3"
$ sudo snapper -c root set-config "TIMELINE_LIMIT_DAILY=5"
$ sudo snapper -c root set-config "TIMELINE_LIMIT_WEEKLY=3"
$ sudo snapper -c root set-config "TIMELINE_LIMIT_MONTHLY=2"
```

Com essa política, você tem no máximo 13 snapshots (3 horários + 5 diários + 3 semanais + 2 mensais), cada um ocupando só os blocos que mudaram. Quando o limite é atingido, o mais antigo é automaticamente removido.

```terminal
$ sudo snapper -c root list
 # │ Type  │ Pre # │ Date                     │ Cleanup │ Description
───┼───────┼───────┼──────────────────────────┼─────────┼────────────────────
 1 │ single│       │ Sat Jul 12 09:00:00 2026 │ number  │ timeline
 2 │ pre   │       │ Sat Jul 12 14:22:10 2026 │         │ pacman -Syu
 3 │ post  │     2 │ Sat Jul 12 14:23:05 2026 │         │ pacman -Syu
```

Para restaurar um arquivo específico sem um rollback completo, monte o snapshot e copie:

```terminal
$ sudo mount -o subvol=@snapshots/1/snapshot /dev/nvme0n1p4 /mnt/restore
$ cp /mnt/restore/home/deck/lab/notas.md ~/lab/notas-restauradas.md
$ sudo umount /mnt/restore
```

Um único arquivo, recuperado em segundos, sem precisar reiniciar o sistema.

## Backup de dados com rsync

O `rsync` é a ferramenta de backup mais confiável do ecossistema Linux: copia apenas o que mudou, preserva permissões e timestamps, e funciona localmente ou via rede. Para o Deck, o destino prático é um SSD externo montado em `/run/media/deck/backup`.

```terminal
$ rsync -av --delete \
  /home/deck/lab \
  /home/deck/Documents \
  /home/deck/.config \
  /run/media/deck/backup/deck-home/
sending incremental file list
./
lab/
lab/notas.md
lab/checkups/
lab/checkups/2026-07-06.log
Documents/
.config/

[... 234 files transferred ...]
```

As flags: `-a` (archive — preserva tudo), `-v` (verbose — mostra o progresso), `--delete` (remove do destino o que não existe mais na origem). Esse último é poderoso e perigoso: se você deletou algo por engano na origem, o `--delete` deleta também no backup. Use com consciência.

:::atencao
A flag `--delete` apaga arquivos no destino que não estão mais na origem. Se você acidentalmente deletar um diretório importante e rodar o `rsync --delete` antes de perceber, perdeu no backup também. Para mitigar isso, crie snapshots do destino ou use `rsync` sem `--delete` em backups críticos, acumulando versões manualmente. Ou use `--backup --backup-dir` para mover os arquivos deletados para uma pasta separada em vez de apagá-los definitivamente.
:::

Um script de backup encapsula a lógica e garante consistência:

```bash
#!/bin/bash
# ~/bin/backup-home — backup incremental do home para mídia externa

DEST="/run/media/deck/backup/deck-home"
[ -d "$DEST" ] || { echo "Mídia não montada em $DEST"; exit 1; }

rsync -av --delete --exclude '.cache' --exclude 'Steam' \
  /home/deck/lab "$DEST/" && echo "Backup concluído em $(date)"
```

O `--exclude` pula o cache (que pode ser reconstruído) e a pasta Steam (que é gigante e merece backup separado via Steam Cloud ou ferramenta própria). O resultado é um backup enxuto, que cabe num SD card comum.

## O que copiar, o que ignorar

A disciplina de backup começa pela categorização dos dados — a mesma da seção 2:

| Categoria | Caminhos típicos | Backup? |
|---|---|---|
| Dados pessoais | `~/lab`, `~/Documents`, `~/Pictures` | Sempre |
| Configuração | `~/.config`, `/etc` | Sempre |
| Saves de jogos | `~/.local/share/Steam` (app-specific) | Steam Cloud cobre |
| Cache | `~/.cache` | Nunca |
| Downloads | `~/Downloads` | Só se tiver algo raro |
| Sistema | `/usr`, `/bin` | Snapshots bastam |

Saves de jogos, em particular, são um caso à parte. A maioria dos jogos no Steam sincroniza saves pela Steam Cloud. Para os que não o fazem, vale conferir o site [PCGamingWiki](https://www.pcgamingwiki.com) que lista, jogo a jogo, o caminho exato dos saves.

```terminal
$ find ~/.local/share/Steam/steamapps/compatdata -name '*.sav' -type f | head
/home/deck/.local/share/Steam/steamapps/compatdata/374320/pfx/drive_c/users/steamuser/Saved Games/game/save001.sav
```

Se você movimenta compatdata com links simbólicos (seção 2), garanta que seu `rsync` segue esses links com a flag `-L` ou que o destino do link também está no backup.

## Testando a restauração (sem isso, não há backup)

O backup só existe de verdade depois que você restaurou com sucesso. Um arquivo `.tar.gz` que nunca foi aberto, um `rsync` que nunca teve seus arquivos conferidos, um snapshot que nunca foi montado — tudo isso é fé, não backup.

```terminal
$ mkdir -p /tmp/teste-restore
$ rsync -av /run/media/deck/backup/deck-home/lab/ /tmp/teste-restore/
$ diff -r ~/lab /tmp/teste-restore && echo "Backup íntegro"
Backup íntegro
```

O `diff -r` compara recursivamente a origem e a restauração. Se não houver diferença, o backup é fiel. Se houver, você descobre antes de precisar de verdade — e corrige.

:::exemplo
A história real de quem aprendeu tarde: um desenvolvedor fazia `rsync` diário do `~/projetos` para um HD externo. O HD externo foi roubado junto com a mochila. "Tudo bem, tenho backup" — só que ele nunca tinha testado a restauração. O HD externo tinha setores ilegíveis, e metade dos arquivos `.sqlite` estava truncada. O backup existia, mas estava corrompido há meses. A lição: uma restauração simulada, uma vez por mês, impede essa descoberta no pior momento possível.
:::

## Resumo

- Snapshots Btrfs protegem contra erro humano; backups em mídia externa protegem contra falha de hardware.
- `snapper` automatiza snapshots com política de retenção horária, diária, semanal e mensal.
- `rsync -av --delete` sincroniza dados importantes com mídia externa; cuidado com `--delete`.
- Dados pessoais e configuração merecem backup; cache e downloads, não.
- Saves de jogos estão na compatdata; para os que o Steam Cloud não cobre, inclua no `rsync`.
- Teste a restauração com `diff -r` periodicamente; backup não validado é só promessa.

## Exercícios

1. Configure o `snapper` para o volume raiz, com retenção de 3 horários, 5 diários e 2 semanais. Liste os snapshots criados após 24 horas.
2. Crie um script `~/bin/backup-home` que use `rsync` para copiar `~/lab`, `~/Documents` e `~/.config` para um SD card ou SSD externo, excluindo `.cache`.
3. Execute o script e depois restaure um arquivo específico para `/tmp` usando `cp`. Confirme com `diff` que ele é idêntico ao original.
4. Simule uma perda de dados: apague um diretório de teste no `~/lab`, execute o `rsync` e perceba o efeito do `--delete`. Depois, recupere o arquivo de um snapshot do `snapper` sem `--delete` ativado.
5. **Desafio.** Adicione ao `backup-home` a flag `--backup --backup-dir=/run/media/deck/backup/deletados` e crie intencionalmente um arquivo, faça o backup, depois apague o arquivo e rode o backup de novo. Verifique se o arquivo deletado foi parar em `deletados/`. Explique como essa técnica protege contra exclusões acidentais.