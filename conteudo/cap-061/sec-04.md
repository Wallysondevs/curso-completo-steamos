A pasta `Downloads` é o canto esquecido de todo sistema operacional. No SteamOS, ela é o destino padrão de ROMs baixadas, instaladores `.run`, imagens ISO, patches de tradução e capturas de tela. Somado a arquivos temporários que programas deixam para trás e ao `~/.Trash` que o modo Desktop enche, o lixo acumulado pode facilmente somar dezenas de gigabytes. Esta seção ensina a encontrar e eliminar arquivos que ninguém lembra que estão lá.

:::objetivos
- Medir e limpar a pasta `Downloads` com estratégia de arquivos antigos
- Encontrar arquivos grandes esquecidos com `find` e filtros de tamanho e idade
- Esvaziar a lixeira corretamente no modo Desktop do SteamOS
- Identificar extensões de arquivos que costumam ser lixo (`.run`, `.iso`, `.tmp`, `.log`)
- Configurar um script de limpeza manual que não precise de cron
:::

## Downloads e a regra dos seis meses

O diretório `~/Downloads` é planejado como área de trânsito: baixou, instalou/moveu, apagou. Na prática, vira depósito:

```terminal
$ du -sh ~/Downloads
8.9G   Downloads

$ ls -lhS ~/Downloads | head -8
-rw-r--r-- 1 deck deck 2.1G Mai  5 21:14 emudeck-installer.desktop.run
-rw-r--r-- 1 deck deck 1.3G Fev 12 14:31 archlinux-2024.02.01-x86_64.iso
-rw-r--r-- 1 deck deck 855M Abr 22 10:08 SMBBBPB00.7z
-rw-r--r-- 1 deck deck 430M Jan  3 19:44 portal2_coop_maps.zip
-rw-r--r-- 1 deck deck 312M Mar 17 01:56 ResidentEvil4_PTBR.xdelta
```

Para decidir o que apagar, o critério mais útil é a idade do arquivo. Não faz sentido manter o instalador do EmuDeck de maio se você já está com a instalação pronta:

```terminal
## Arquivos de Downloads com mais de 6 meses (180 dias)
$ find ~/Downloads -maxdepth 1 -type f -mtime +180 -exec ls -lh {} \;
```

A flag `-mtime +180` seleciona arquivos cujo conteúdo não é modificado há mais de 180 dias. O `-maxdepth 1` evita descer em subpastas caso existam. Para agir:

```terminal
## Mostra o que será apagado e o tamanho total
$ find ~/Downloads -maxdepth 1 -type f -mtime +180 -exec du -ch {} + 2>/dev/null | tail -1
4.7G   total

## Remove esses arquivos
$ find ~/Downloads -maxdepth 1 -type f -mtime +180 -delete
```

:::atencao
`find -delete` apaga *imediatamente*, sem lixeira e sem confirmação. A ordem das opções importa: `find caminho -delete` roda antes de qualquer filtro, então coloque `-delete` sempre **depois** de `-type` e `-mtime`. E nunca combine `-delete` com `-exec` na mesma expressão — o `find` pode tentar acessar arquivos que já apagou e disparar erros. Rode primeiro uma versão sem `-delete` para conferir a lista.
:::

## Arquivos grandes esquecidos pelo sistema

Downloads são fáceis de achar. O problema maior são arquivos grandes espalhados pela home que você nem lembra que criou. O `find` com filtro de tamanho resolve:

```terminal
## Top 10 maiores arquivos na home, ignorando .steam e .local (biblioteca)
$ find ~/ -type f -size +500M -not -path '*/.steam/*' -not -path '*/.local/share/Steam/*' \
    -exec ls -lh {} \; 2>/dev/null | sort -k5 -hr | head -10
```

Com uma versão mais agressiva, você lista os verdadeiros gigantes:

```terminal
$ find ~/ -type f -size +1G -exec ls -lh {} \; 2>/dev/null
/home/deck/Emulation/roms/ps2/FF12.iso  3.8G
/home/deck/Emulation/roms/ps2/DQVIII.iso  2.9G
/home/deck/Emulation/roms/gc/MarioSmash_US.md  1.3G
```

ROMs de PS2 e GameCube em `.iso` bruto são os maiores infratores. Converter para formatos comprimidos como `.chd` ou `.rvz` pode reduzir o tamanho pela metade — [ver o capítulo sobre organização de ROMs](#/cap-052/sec-06).

## A lixeira do modo Desktop

O modo Desktop do SteamOS (KDE Plasma) tem lixeira — e ela **não** esvazia sozinha. Arquivos apagados via `Del` ou "mover para lixeira" vão para `~/.local/share/Trash`:

```terminal
$ du -sh ~/.local/share/Trash 2>/dev/null
1.4G   Trash

$ ls ~/.local/share/Trash/files/ | head -5
$ ls ~/.local/share/Trash/info/  | head -5
```

A estrutura é simples: `files/` contém os arquivos removidos, `info/` contém metadados de restauração. Para esvaziar sem abrir o Dolphin (gerenciador de arquivos do KDE):

```terminal
$ rm -rf ~/.local/share/Trash/files/*
$ rm -rf ~/.local/share/Trash/info/*
```

:::dica
O KDE Plasma tem uma configuração de limite de lixeira (padrão: 10% da partição). Quando bate o limite, arquivos antigos são removidos automaticamente. Mas 10% de 512 GB são 51 GB — um exagero. Em System Settings → Trash, ajuste para 2% ou 5 GB fixo.
:::

## Arquivos temporários e caches avulsos

Além dos suspeitos habituais, uma varredura de extensões revela acumuladores comuns:

```terminal
## Arquivos .tmp e .temp com mais de 30 dias
$ find ~/ -type f \( -iname '*.tmp' -o -iname '*.temp' -o -iname '*.bak' -o -iname '*~' \) \
    -mtime +30 -exec du -ch {} + 2>/dev/null | tail -1

## Logs enormes deixados por aplicativos
$ find ~/ -type f -iname '*.log' -size +10M -exec ls -lh {} \; 2>/dev/null
```

Logs de aplicativos Flatpak e do EmuDeck podem crescer a níveis surpreendentes:

```terminal
$ du -sh ~/.var/app/*/data/*.log ~/.var/app/*/data/logs 2>/dev/null | sort -hr | head -5
```

## Resumo

- `~/Downloads` acumula instaladores, ISOs e ROMs; encontrar por idade (`-mtime +180`) é a estratégia mais prática.
- Arquivos grandes esquecidos na home se acham com `find ~/ -type f -size +500M`.
- A lixeira do KDE em `~/.local/share/Trash` não esvazia sozinha e pode acumular gigabytes.
- Extensões `.tmp`, `.bak`, `.log` e `*~` são quase sempre seguras de remover.
- `find com -delete` é rápido, mas sempre rode antes sem `-delete` para conferir o que vai sumir.

## Exercícios

1. Liste quantos GB há em `~/Downloads` com mais de 90 dias e compare com o tamanho total da pasta.
2. Localize os 5 maiores arquivos da sua home fora das pastas de jogos (`.steam`/`.local/share/Steam`).
3. Verifique o tamanho de `~/.local/share/Trash` e, se houver algo, esvazie-a manualmente.
4. Rode uma busca por `*.log` com mais de 10 MB e anote de qual aplicativo cada um veio.
5. **Desafio.** Escreva um script de uma linha que encontre arquivos com mais de 180 dias em Downloads, mostre o nome e tamanho, e grave a lista em `~/limpeza_plan.txt` — sem apagar nada. Depois decida manualmente o que remover.