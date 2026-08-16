Save, save state e memory card são três coisas diferentes, e confundi-las é a origem da maioria das dores de cabeça com jogos de emulador. O save é o progresso gravado *dentro* do jogo; o save state é um congelamento da memória feito pelo emulador num instante qualquer; o memory card é o arquivo que simula o cartão de memória físico de consoles como PS1 e PS2. Cada um vive num lugar próprio, e o EmuDeck centraliza todos sob `Emulation/saves/` usando *symlinks*.

:::objetivos
- Distinguir save, save state e memory card
- Entender como o EmuDeck centraliza os saves com symlinks
- Localizar onde cada emulador grava seu progresso
- Reconhecer os formatos `.srm`, `.state` e `.ps2`/`.mcd`
- Fazer cópia manual de um save específico
:::

## Três conceitos que não são o mesmo

- **Save** — o jogo grava ao passar de fase ou ao salvar no menu. É permanente e controlado pelo próprio título. No RetroArch, vira um arquivo `.srm` (SRAM).
- **Save state** — o emulador tira um "snapshot" da RAM e das CPUs naquele instante, permitindo voltar a qualquer ponto, até no meio de uma animação. É um arquivo `.state`.
- **Memory card** — para consoles de disco, o progresso vive num arquivo que imita o cartão físico: `.mcd` (DuckStation), `.ps2` (PCSX2), `.raw` (Dolphin).

A distinção prática: apagar um save state não apaga o save, e vice-versa. Um save state feito numa versão antiga do emulador pode não carregar numa versão nova, enquanto o save `.srm` quase sempre sobrevive a atualizações.

## Onde os saves realmente ficam

O EmuDeck faz algo engenhoso: em vez de deixar cada emulador gravar onde bem entende, ele cria a pasta central `Emulation/saves/` e **linka** os diretórios reais dos emuladores para lá. Você acessa tudo por um lugar só:

```terminal
$ ls -1 /run/media/mmcblk0p1/Emulation/saves/
retroarch/
duckstation/
pcsx2/
dolphin/
yuzu/
```

Dentro de `retroarch/`, os dois grandes grupos aparecem:

```terminal
$ ls -1 saves/retroarch/
saves/
states/
```

A pasta `saves/retroarch/saves/` guarda os `.srm`; a `states/` guarda os `.state`. Os emuladores standalone têm seus próprios subdiretórios. A sacada do symlink é que, ao navegar por `Emulation/saves/`, você vê os mesmos arquivos que o emulador usa internamente — mexer ali é mexer no arquivo real.

## Enxergando o symlink

Para confirmar que a centralização é por link simbólico, use `ls -l`:

```terminal
$ ls -l ~/.var/app/org.duckstation.DuckStation/data/duckstation/
memcards -> /run/media/mmcblk0p1/Emulation/saves/duckstation/memcards
```

A seta `->` mostra o destino real. Isso significa que, se você fizer backup de `Emulation/saves/`, está copiando o conteúdo autêntico — não uma cópia desatualizada. É o que torna o [backup de saves](#/cap-050/sec-06) seguro.

## Encontrando o save de um jogo específico

Cada emulador nomeia os arquivos de save de um jeito. O RetroArch usa o *mesmo nome do arquivo da ROM*, trocando a extensão:

```terminal
$ ls saves/retroarch/saves/
Chrono Trigger.srm
Mega Man X.srm
$ ls saves/retroarch/states/
Chrono Trigger.state1
Mega Man X.state
```

Com isso, localizar um save é direto: procure o nome do jogo. Já no DuckStation, tudo fica num único `.mcd` por "cartão":

```terminal
$ ls saves/duckstation/memcards/
shared_card_1.mcd
shared_card_2.mcd
```

O `shared_card_1.mcd` concentra os saves de todos os jogos daquele cartão — apagá-lo apaga tudo de uma vez, daí a importância de saber o que é cada arquivo antes de mover.

:::perigo
Um `.mcd` ou `.ps2` contém o progresso de *vários* jogos. Copiá-lo inteiro para outro lugar é seguro; mas apagar ou sobrescrever o arquivo destrói o save de vários títulos simultaneamente, sem aviso. Faça cópia antes de qualquer mudança.
:::

## Resumo

- Save (progresso no jogo), save state (snapshot da RAM) e memory card (cartão virtual) são distintos.
- O EmuDeck centraliza tudo em `Emulation/saves/` por meio de symlinks para os diretórios reais.
- No RetroArch, saves são `.srm` em `saves/` e states são `.state` em `states/`.
- Emuladores standalone usam arquivos agregados como `.mcd` (DuckStation) e `.ps2` (PCSX2).
- Backups de `Emulation/saves/` copiam o arquivo real, graças aos symlinks.

## Exercícios

1. Liste `Emulation/saves/` e identifique, para cada emulador que você usa, qual subpasta guarda saves e qual guarda states.
2. Abra um jogo no RetroArch, salve dentro do jogo e tire um save state; depois localize os dois arquivos novos em `saves/` e `states/`.
3. Use `ls -l` para mostrar o symlink que liga o diretório de memcards do DuckStation à pasta central.
4. Faça uma cópia de segurança de `shared_card_1.mcd` para `~/backup/` e confira o tamanho com `ls -lh`.
5. **Desafio.** Escreva um comando que copie só os `.srm` e `.state` mais recentes que 7 dias (`find ... -mtime -7`) para um diretório de backup, preservando a estrutura de subpastas.