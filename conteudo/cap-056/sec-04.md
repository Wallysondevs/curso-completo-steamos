O exFAT é a ponte entre mundos. É o único dos três sistemas de arquivos que Windows, macOS e Linux leem nativamente, sem drivers extras. Para um cartão que viaja entre o Steam Deck e um PC Windows — para transferir ROMs, backups, mods ou jogos não-Steam — o exFAT é muitas vezes a escolha certa, desde que você conheça suas limitações.

:::objetivos
- Entender o papel do exFAT como formato de intercâmbio entre sistemas
- Formatar o cartão em exFAT no SteamOS
- Conhecer as limitações do exFAT para jogos Proton
- Avaliar quando exFAT é a escolha certa (e quando não é)
- Alternar entre exFAT e ext4/Btrfs com segurança
:::

## Quando exFAT faz sentido

O exFAT foi criado pela Microsoft para mídia removível (SDXC, pen drives), substituindo o FAT32 e removendo seu limite de 4 GB por arquivo. Os cenários em que ele brilha no Deck:

- **Transferir jogos/ROMs entre Deck e Windows/macOS**: plugar o cartão num PC e ler/escrever sem ferramenta extra.
- **Cartão de mídia**: armazenar ISOs, vídeos, filmes e ROMs que você acessa em múltiplas máquinas.
- **Backups manuais**: copiar arquivos para um PC Windows de tempos em tempos.

O cenário em que ele **não** é ideal: como armazenamento primário da biblioteca Steam com jogos Proton. O motivo está nas limitações abaixo.

## Limitações do exFAT para jogos

- **Sem permissões Unix**: não há `chmod`/`chown` reais. Executáveis e scripts Linux não preservam a bit de execução do jeito esperado.
- **Sem case-folding maduro**: jogos Proton que assumem sistema case-insensitive podem falhar a encontrar arquivos.
- **Sem hardlinks/symlinks`: alguns títulos (e o próprio Steam em certas operações) usam symlinks ou hardlinks que o exFAT não suporta plenamente.
- **Journaling mais fraco**: menos robusto a quedas de energia e remoção abrupta do cartão — risco de corrupção.

Em conjunto, isso torna o exFAT arriscado como destino de instalação de jogos nativos Linux ou Proton. Para ROMs e mídia (arquivos de dados puros), essas limitações não importam.

:::atencao
Há relatos na comunidade de jogos Steam instalados em exFAT que quebram, corrompem saves ou simplesmente não iniciam por causa de case-sensitivity e falta de symlinks. Se você vai instalar jogos Steam/Proton, prefira ext4 (Modo Jogo). Use exFAT para transferência e mídia, não como biblioteca principal.
:::

## Formatando em exFAT

No SteamOS, o exFAT é suportado pelas ferramentas `exfatprogs` (ou `exfat-utils`, dependendo da versão). Verifique e instale se necessário:

```terminal
## Instalar ferramentas exFAT (se ainda não houver)
$ sudo pacman -S exfatprogs
```

Para formatar:

```terminal
$ sudo mkfs.exfat -L MEDIA /dev/mmcblk0p1
```

O rótulo `-L MEDIA` (ou o nome que preferir) identifica o cartão ao plugar em qualquer sistema. O limite de tamanho de arquivo no exFAT é enorme (exabytes), então não há o problema dos 4 GB do FAT32.

## Compartilhando dados entre Deck e Windows

O fluxo típico de intercâmbio:

```terminal
## Montar (o SteamOS monta automaticamente via udisks no Modo Desktop)
$ lsblk -o NAME,LABEL,MOUNTPOINT
NAME        LABEL MOUNTPOINT
mmcblk0p1   MEDIA /run/media/deck/MEDIA

## Copiar ROMs ou backups para o cartão
$ cp -r ~/roms/gba /run/media/deck/MEDIA/
```

Depois, ejete com segurança antes de remover, para não corromper o volume:

```terminal
$ sync
$ sudo umount /run/media/deck/MEDIA
```

:::dica
Sempre use `sync` (ou a opção "Ejetar" do gerenciador de arquivos) antes de puxar o cartão. Remover um exFAT em plena escrita é a causa mais comum de corrupção em mídia removível.
:::

## exFAT vs. ext4/Btrfs: tabela de decisão

| Necessidade | Sistema recomendado |
|-------------|---------------------|
| Só jogar no Deck (Steam/Proton) | ext4 (Modo Jogo) |
| Snapshots/compressão/rollback | Btrfs |
| Transferir arquivos para Windows/macOS | exFAT |
| Cartão de ROMs/mídia multi-SO | exFAT |
| Biblioteca Steam + intercâmbio ocasional | ext4 no Deck + transferir via rede/USB, ou dois cartões |

## Pontos-chave

- exFAT é o formato de intercâmbio universal (Windows/macOS/Linux), sem o limite de 4 GB do FAT32.
- Formatá-lo: `sudo mkfs.exfat -L MEDIA /dev/mmcblk0p1` (pacote `exfatprogs`).
- Não é ideal para jogos Proton: sem permissões Unix, symlinks ou case-folding maduro.
- Sincronize (`sync`) e ejete antes de remover um cartão exFAT.
- Use exFAT para transferência/mídia; ext4 para biblioteca Steam primária.

## Exercícios

1. Formate um cartão em exFAT com `sudo mkfs.exfat -L MEDIA` e confirme com `blkid` (TYPE="exfat").
2. Copie alguns arquivos grandes (maiores que 4 GB) para o cartão e confirme que cabem (diferente do FAT32).
3. Liste as limitações do exFAT que afetam jogos Proton.
4. Monte o cartão, escreva um arquivo, rode `sync` e ejete corretamente com `umount`.
5. **Desafio.** Tente criar um symlink dentro de um volume exFAT e observe o erro; relacione isso com o motivo de jogos Steam falharem no exFAT.
