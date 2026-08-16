Com o tempo, uma biblioteca de emulação acumula ROMs duplicadas, dumps corrompidos, BIOS erradas e saves órfãos. O capítulo inteiro construiu a estrutura; esta seção fecha o ciclo ensinando a **migrar** a biblioteca entre mídias, **validar** a integridade dos arquivos e **manter** a casa em ordem com rotinas simples de verificação.

:::objetivos
- Planejar e executar uma migração segura entre cartão e SSD
- Validar ROMs por checksum contra um conjunto `.dat`
- Detectar duplicatas e arquivos corrompidos
- Compreender o nome de dump e o conjunto no-intro/redump
- Consolidar uma rotina de manutenção recorrente
:::

## Migrando a biblioteca com segurança

A migração apareceu em [cartão SD e sistema de arquivos](#/cap-050/sec-08); aqui ela vira procedimento completo. O fluxo seguro tem quatro passos, nesta ordem:

1. **Backup de saves** (e BIOS) — o insubstituível, como na seção 6.
2. **Fechar emuladores** e sair do uso do cartão.
3. **Copiar integralmente** com `rsync` para o destino novo.
4. **Apontar os configs** para o caminho novo (ou usar a ferramenta do EmuDeck, que faz isso).

```terminal
$ rsync -avh --info=progress2 /run/media/mmcblk0p1/Emulation/ /home/deck/Emulation/
sending incremental file list
Emulation/
Emulation/bios/
Emulation/roms/psx/
          1.03G  42%    42.1MB/s    0:00:24
```

O `--info=progress2` mostra o progresso global, útil em transferências longas. Ao final, **confira e não confie**: rode um `diff` de contagem de arquivos entre origem e destino antes de apagar qualquer coisa.

## Validando ROMs com checksum e `.dat`

Para saber se um dump está completo e íntegro, você compara seu checksum com os valores de referência de um conjunto como **No-Intro** (cartuchos) ou **Redump** (discos). Esses projetos publicam arquivos `.dat` (XML) com o hash correto de cada ROM conhecida. Ferramentas como `romvault`, `clrmamepro` ou `igir` leem o `.dat` e varrem sua pasta:

```terminal
$ igir copy --dat no-intro-snes.dat --input roms/snes/ --output verified/
Checking 1,234 files against No-Intro (SNES)...
```

O relatório separa o joio do trigo: arquivos que batem (verified), os que não estão no conjunto (unmatched) e os corrompidos (wrong checksum). Isso também revela o que está com nome de dump "sujo", pronto para limpeza.

:::nota
O nome de dump segue convenções: `(USA)`, `(Europe)`, `(Japan)` indicam região; `[!]` marca um dump "bom conhecido"; `[b]` marca um dump ruim (bad). Reconhecer esses sufixos ajuda a saber, de cara, se você está com a ROM ideal ou com uma cópia corrompida.
:::

## Caçando duplicatas e corrompidos

Duplicatas surgem quando o mesmo jogo aparece em `.chd` e `.cue/.bin`, ou em várias regiões numa mesma pasta. O `fdupes` localiza arquivos idênticos por conteúdo:

```terminal
$ fdupes -r roms/psx/ | head
roms/psx/game.chd
roms/psx/game.cue
roms/psx/game.bin
```

Como `game.chd` e `game.cue`/`game.bin` têm conteúdo distinto, o `fdupes` não os agrupa — mas o `igir` (e o bom senso) já sinalizaram o `game` duplicado indiretamente. Para corrompidos silenciosos, o checksum contra o `.dat` é a única prova confiável.

## Saves órfãos

Quando você apaga uma ROM, o `.srm` correspondente continua lá, ocupando pouco mas acumulando bagunça:

```terminal
$ ls saves/retroarch/saves/*.srm
Chrono Trigger.srm
Mario RPG.srm
removed-game.srm
```

Uma varredura que cruza ROMs com saves revela órfãos: se `removed-game.srm` não tem ROM correspondente em `roms/`, ele é candidato a limpeza (ou a um arquivamento, se houver memória afetiva). Um `for` simples faz esse cruzamento.

## Rotina de manutenção

Consolide uma rotina mensal curta, que custa pouco e evita caos:

1. Rodar o validador `.dat` e descartar/corrigir o que falhou.
2. Rodar `fdupes` para achar duplicatas.
3. Cruzar saves × ROMs para achar órfãos.
4. Fazer um snapshot de saves (`tar` datado).
5. Rodar o Steam ROM Manager para refletir mudanças na biblioteca.

```terminal
$ tar -czf ~/backup/saves-$(date +%F).tar.gz -C /run/media/mmcblk0p1/Emulation saves/
$ fdupes -r roms/ | wc -l
7
```

Com esses cinco passos, sua biblioteca permanece íntegra, navegável e — o mais importante — com progresso garantido em backup.

## Resumo

- Migração segura = backup de saves + copiar com `rsync` + apontar configs + conferir antes de apagar.
- Arquivos `.dat` (No-Intro/Redump) fornecem o checksum de referência para validar ROMs.
- Sufixos de dump como `[!]` (bom) e `[b]` (ruim) indicam a qualidade da ROM de relance.
- `fdupes` acha duplicatas; cruzar saves com ROMs acha órfãos.
- Uma rotina mensal de validação + snapshot mantém a coleção saudável.

## Exercícios

1. Anote o significado de três sufixos de dump que você encontra nas suas ROMs (`[!]`, `[b]`, região).
2. Rode `fdupes -r` numa pasta de ROMs sua e liste os arquivos duplicados encontrados.
3. Baixe um `.dat` No-Intro de um sistema que você usa e valide suas ROMs com uma ferramenta de validação.
4. Escreva um loop `for` que liste saves `.srm` sem ROM correspondente na pasta do sistema.
5. **Desafio.** Execute a rotina de manutenção completa de ponta a ponta em um dos seus sistemas (validação, duplicatas, órfãos, snapshot e atualização da biblioteca no Steam) e documente, em poucas linhas, o que mudou.