Clonar o disco inteiro é a rede de segurança máxima, mas é pesado demais para rodar todo dia. Para o que realmente importa no uso cotidiano — seus saves, configurações e bibliotecas — existe um caminho mais leve e frequente: o backup seletivo. Esta seção mostra onde o Steam guarda saves e dados do Proton, e como usar o `rsync` para manter uma cópia atualizada de tudo isso.

:::objetivos
- Localizar onde o Steam e o Deck guardam saves e configurações
- Entender o papel do Steam Cloud e suas limitações
- Fazer backup incremental com `rsync` para um destino externo
- Preservar os `compatdata` do Proton nos backups
- Automatizar com uma lista de exclusão para não copiar os jogos
:::

## Onde vivem os saves e configurações

O Steam Desktop organiza quase tudo sob `~/.local/share/Steam`. Os três subdiretórios que importam para backup:

```terminal
$ ls ~/.local/share/Steam/
config/  steamapps/  userdata/  ...
```

- **`userdata/`** — organização por ID de usuário; dentro de cada um, a pasta `remote/` guarda os saves que fazem cloud sync, e pastas por `appid` guardam saves locais de alguns jogos.
- **`steamapps/compatdata/`** — um diretório por `appid` contendo o prefixo Wine/Proton do jogo. Os saves de jogos não-nativos (Windows via Proton) costumam viver aqui, dentro de `pfx/drive_c/users/steamuser/Documents` e caminhos semelhantes.
- **`steamapps/common/`** — os arquivos dos jogos em si (regeneráveis, grandes; normalmente ficam fora do backup).

Além disso, jogos nativos Linux costumam gravar saves em `~/.config`, `~/.local/share` (fora da pasta Steam) ou na própria pasta do jogo. Ferramentas como o EmuDeck guardam ROMs, bios e saves em `~/Emulation/`.

:::nota
O **Steam Cloud** sincroniza automaticamente os saves dos jogos que o suportam, mas tem limite de tamanho por jogo e **não cobre** todos os títulos, nem jogos não-Steam, nem o conteúdo dos `compatdata`. Não conte só com ele como backup.
:::

## Fazendo backup do que importa com `rsync`

O `rsync` é a ferramenta certa porque copia só o que mudou, preserva permissões e pode espelhar diretórios. Um backup básico do diretório do Steam:

```terminal
$ rsync -av --delete ~/.local/share/Steam/userdata/ /mnt/backup/steam/userdata/
sending incremental file list
./
760/
760/remote/
760/remote/winui_settings.txt
...
sent 12.4M bytes  received 38 bytes  24.8M bytes/sec
total size is 12.4M  speedup is 1.00
```

`-a` (archive) preserva permissões e timestamps; `-v` mostra o que foi copiado; `--delete` remove no destino o que sumiu na origem, mantendo o espelho fiel. Na primeira execução copia tudo; nas seguintes, só as mudanças.

:::atencao
`--delete` apaga do destino qualquer arquivo que não esteja mais na origem. Pode ser desastroso se o destino também guardar outras coisas. Aponte `rsync` para um subdiretório dedicado do disco de backup, nunca para uma pasta compartilhada com outros usos.
:::

## Preservando os `compatdata` e excluindo os jogos

O `compatdata` guarda saves de jogos Windows e deve entrar no backup, mas os jogos em si (`common/`) são grandes e regeneráveis. O `rsync` permite excluir e incluir seletivamente:

```terminal
$ rsync -av --delete \
    --exclude='steamapps/common/' \
    --exclude='steamapps/shadercache/' \
    ~/.local/share/Steam/ /mnt/backup/steam/
```

Aqui copiamos a pasta Steam inteira, exceto os jogos (`common`) e os caches de shader (`shadercache`), que podem ser reconstruídos. O resultado inclui `userdata`, `config`, e os `compatdata` — todo o estado que não dá para reinstalar.

Para capturar também saves fora do Steam e do EmuDeck, some os diretórios do usuário:

```terminal
$ rsync -av --delete ~/.config/ /mnt/backup/home/.config/
$ rsync -av --delete ~/Emulation/saves/ /mnt/backup/emulation/saves/
$ rsync -av --delete ~/Emulation/bios/ /mnt/backup/emulation/bios/
```

:::dica
Mantenha uma lista de exclusão num arquivo para não repetir os argumentos toda vez. Crie `~/.rsync-exclude` com uma entrada por linha (`steamapps/common/`, `steamapps/shadercache/`, `Cache/`...) e use `--exclude-from=~/.rsync-exclude`.
:::

## Restaurando um backup seletivo

A restauração é o `rsync` na direção inversa, e é aqui que o backup mostra seu valor. Suponha que você perdeu o `home` e reinstalou o SteamOS; para trazer de volta seus dados:

```terminal
$ rsync -av /mnt/backup/steam/ ~/.local/share/Steam/
$ rsync -av /mnt/backup/home/.config/ ~/.config/
```

Confirme o caminho de destino antes de rodar: invertendo fonte e destino inadvertidamente, o `--delete` pode apagar o backup em vez de restaurá-lo. Depois de restaurar, valide com o Steam se os saves aparecem — e, se o jogo suporta, deixe o Steam Cloud re-sincronizar.

## Definindo uma rotina de salvamento

O ideal é automatizar o backup seletivo num horário fixo. Um script simples, executado via `cron`, conecta o disco, roda o `rsync` e desconecta. O esqueleto:

```bash
#!/usr/bin/env bash
DEST="/mnt/backup/steam"
mkdir -p "$DEST"
rsync -av --delete \
  --exclude='steamapps/common/' \
  --exclude='steamapps/shadercache/' \
  ~/.local/share/Steam/ "$DEST"
```

Agendando diariamente às 3h da manhã, via `cron`:

```terminal
$ crontab -e
## adicione a linha abaixo
0 3 * * * /home/deck/bin/backup-steam.sh >> /home/deck/backup.log 2>&1
```

A automatização completa, com verificação de checksum e retenção, é aprofundada na [seção 9](#/cap-060/sec-09).

## Resumo

- Saves vivem em `~/.local/share/Steam/userdata/` e nos `compatdata/` do Proton.
- O Steam Cloud não cobre tudo; não dependa só dele.
- `rsync -av --delete` espelha diretórios copiando apenas as mudanças.
- `--exclude` remove jogos e caches regeneráveis do backup.
- Aponte sempre o `rsync` para um subdiretório dedicado; `--delete` é perigoso no sentido errado.
- Automatize com um script + `cron` para backups frequentes.

## Exercícios

1. Liste os jogos que têm pasta em `~/.local/share/Steam/userdata/<id>/remote/` e os que não têm, para saber quais dependem só de you.
2. Faça um backup completo de `~/.config/` com `rsync -av` para um destino externo e confira a saída.
3. Crie um arquivo de exclusão e refaça o backup do Steam excluindo `common/` e `shadercache/`.
4. Simule uma restauração: copie para um diretório temporário e use `diff -r` para confirmar que origem e cópia batem.
5. **Desafio.** Escreva o script de backup com `rsync` + log, adicione ao `cron` e verifique no dia seguinte que o log registrou a execução.
