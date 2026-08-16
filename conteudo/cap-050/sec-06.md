Centenas de horas de progresso cabem em poucos megabytes — e, por isso mesmo, são fáceis de perder numa formatação, numa troca de cartão ou num `rm` descuidado. O EmuDeck já centraliza os saves, o que transforma o backup numa tarefa de "copiar um caminho". Esta seção mostra como automatizar essa cópia, indo do backup manual pontual até uma rotina agendada.

:::objetivos
- Entender por que `Emulation/saves/` é o único alvo essencial de backup
- Fazer backup manual com `rsync` e `tar`
- Agendar backups com `systemd` timers ou `cron`
- Versionar backups para manter várias "fotos" no tempo
- Restaurar um save perdido com segurança
:::

## O que vale a pena copiar

Você não precisa de backup de ROMs — elas são reobtíveis e ocupam muito espaço. O insubstituível é o save. Como a [seção sobre saves](#/cap-050/sec-04) mostrou, tudo converge para `Emulation/saves/` via symlinks. Logo, um único alvo resolve quase tudo:

```terminal
$ du -sh /run/media/mmcblk0p1/Emulation/saves/
312M	/run/media/mmcblk0p1/Emulation/saves/
```

Alguns emuladores — os de `storage/` (Yuzu, Ryujinx) — guardam save dentro do próprio NAND. Para esses, inclua também `Emulation/storage/yuzu/nand/user/save/` no backup. Mas, para 95% dos casos, `saves/` e `bios/` bastam.

## Backup manual com rsync

O `rsync` copia só o que mudou e preserva a estrutura, sendo ideal para rodar de novo e de novo:

```terminal
$ rsync -av --delete /run/media/mmcblk0p1/Emulation/saves/ ~/backup/saves/
sending incremental file list
./
retroarch/saves/Chrono Trigger.srm
duckstation/memcards/shared_card_1.mcd
sent 3.2M bytes  received 1.4K bytes  6.4M bytes/sec
total size is 312.0M  speedup is 89.12
```

A opção `--delete` faz o destino espelhar o origem: arquivos que você apagou do Deck também somem do backup. Se preferir nunca apagar nada, use `rsync -av` sem `--delete` para apenas acrescentar.

:::perigo
Cuidado com a barra final. `rsync -av origem/ destino/` copia o *conteúdo* de `origem` para dentro de `destino`; sem a barra final (`origem destino/`), cria `destino/origem/saves/`, aninhando uma pasta extra. Verifique o resultado com `ls` antes de confiar.
:::

## Snapshot compactado com tar

Para guardar "fotos" datadas e transferir com facilidade, o `tar` com compactação é melhor:

```terminal
$ tar -czf ~/backup/saves-$(date +%F).tar.gz -C /run/media/mmcblk0p1/Emulation saves/
$ ls -lh ~/backup/
-rw-r--r-- 1 deck deck 84M saves-2024-12-15.tar.gz
```

O `$(date +%F)` insere a data no nome, então cada execução gera um arquivo novo, formando um histórico natural. O `-C` troca de diretório antes de empacotar, mantendo o caminho interno limpo (`saves/...` em vez de `run/media/...`).

## Automatizando com systemd

Rodar isso à mão cansa. O SteamOS é baseado em Arch e usa `systemd`; um *timer* agenda o backup sem depender de o Deck ficar ligado em horário fixo (o que raramente acontece). Um serviço simples:

```bash
#!/usr/bin/env bash
# /home/deck/.config/backup/backup-saves.sh
BACKUP_DIR="/home/deck/backup"
SAVES="/run/media/mmcblk0p1/Emulation/saves"
mkdir -p "$BACKUP_DIR"
tar -czf "$BACKUP_DIR/saves-$(date +%F-%H%M).tar.gz" -C "${SAVES%/..}" saves/
```

O detalhe do `${SAVES%/..}` é deliberado: ele sobe um diretório para que o caminho dentro do tar continue sendo `saves/`. Teste sempre o script manualmente antes de agendar.

:::dica
Muitos usuários preferem a simplicidade do `cron` pelo Flatpak `org.gnome.DejaDup` ou pelo próprio EmuDeck **Backup Tool**, que empacota saves, BIOS e configurações num único `.zip` ou `.tar.gz` com um clique. Se a automação com `systemd` parecer demais, a ferramenta do EmuDeck já cobre o essencial.
:::

## Restaurando um save

Restaurar é descompactar por cima — mas nunca sobre um arquivo que ainda existe e pode ser o certo. Faça uma cópia do estado atual antes:

```terminal
$ cp -r /run/media/mmcblk0p1/Emulation/saves ~/backup/saves-antes-de-restaurar
$ tar -xzf ~/backup/saves-2024-12-15.tar.gz -C /run/media/mmcblk0p1/Emulation/
```

Como o tar foi criado com caminho interno `saves/`, extrair na raiz de `Emulation/` repõe a estrutura no lugar original. Confira uma amostra com `ls` e abra o jogo para validar.

## Resumo

- O alvo essencial de backup é `Emulation/saves/` (e a NAND de `storage/` para Switch/3DS).
- `rsync -av --delete` sincroniza de forma incremental; `tar -czf` gera snapshots datados.
- A barra final no caminho do `rsync` muda o resultado — confira sempre.
- `systemd` timers ou `cron` automatizam; a Backup Tool do EmuDeck é a alternativa com um clique.
- Antes de restaurar, copie o estado atual para evitar sobrescrever um save mais novo.

## Exercícios

1. Gere um snapshot com `tar -czf` usando `date` no nome e confira o tamanho com `ls -lh`.
2. Rode `rsync -av --delete` para um diretório de backup e compare a árvore resultante com a original.
3. Crie um script de backup e execute-o manualmente; observe se o caminho interno do tar ficou como `saves/...`.
4. Simule uma restauração: apague (em cópia) um `.srm` e recupere-o do seu tar.
5. **Desafio.** Configure um `systemd` timer que rode o backup a cada 2 dias e verifique o agendamento com `systemctl list-timers`, adaptando o caminho aos seus diretórios reais.