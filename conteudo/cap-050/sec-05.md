Uma pasta cheia de ROMs com nomes como `Super Mario World (USA).sfc` é funcional, mas nada amigável na hora de navegar pela biblioteca. O EmuDeck traz duas ferramentas para transformar isso em uma coleção visual: o *scraping* (buscar capas, nomes bonitos e descrições na internet) e o Steam ROM Manager (que adiciona os jogos à biblioteca do Steam, com arte oficial). Esta seção percorre as duas, do mais simples ao mais personalizado.

:::objetivos
- Entender a diferença entre a biblioteca do Steam e a do EmulationStation
- Renomear ROMs para nomes legíveis sem quebrar os saves
- Executar o scraping de mídia e metadados
- Adicionar ROMs à biblioteca do Steam com o Steam ROM Manager
- Compreender o papel dos arquivos `gameslist.xml`
:::

## Dois modos de navegar pela coleção

O EmuDeck oferece dois caminhos para abrir jogos:

- **EmulationStation-DE** (ES-DE): um front-end dedicado, muito usado em handhelds, que lê as pastas de ROMs e mostra capas, caixas e descrições.
- **Steam ROM Manager** (SRM): gera "atalhos" que colocam cada jogo na biblioteca normal do Steam, então você inicia pelo modo jogo do Deck.

Os dois se alimentam da mesmíssima pasta `Emulation/roms/`. A diferença é onde os metadados (nome, arte, descrição) ficam e como o jogo é mostrado. Entender isso evita o clássico "o jogo apareceu duplicado": uma entrada do Steam por jogo, mais uma do ES-DE, mas tudo apontando para a mesma ROM.

## Renomeação inteligente de ROMs

Nomes de dump como `Chrono Trigger (USA) [!].sfc` deveriam virar `Chrono Trigger`. Renomear é seguro — desde que você ajuste o save junto, porque o RetroArch nomeia o `.srm` pelo nome do arquivo da ROM.

```terminal
$ mv "roms/snes/Chrono Trigger (USA) [!].sfc" "roms/snes/Chrono Trigger.sfc"
```

Se o save antigo chamava `Chrono Trigger (USA) [!].srm`, o emulador não o achará mais. A solução é renomear o save também, mantendo a correspondência:

```terminal
$ mv "saves/retroarch/saves/Chrono Trigger (USA) [!].srm" "saves/retroarch/saves/Chrono Trigger.srm"
```

O EmuDeck inclui um *scraper* que faz a renomeação em massa analisando o conteúdo da ROM contra uma base de dados, mas fazer à mão em poucos jogos é mais controlável.

## Scraping de capas e metadados

O scraping consulta um serviço (ScreenScraper, o mais usado) que devolve nome oficial, capa, screenshot e descrição a partir de uma "impressão digital" da ROM (checksum). O ES-DE tem o scraper embutido:

```terminal
$ ls roms/snes/media/miximages/
chronotrigger.png
marioworld.jpg
```

As imagens baixadas ficam em subpastas `media/` junto das ROMs, e os metadados vão para um arquivo `gameslist.xml` dentro da pasta do sistema:

```terminal
$ ls roms/snes/
gameslist.xml
media/
```

O `gameslist.xml` guarda, para cada jogo, o `<path>`, o `<name>` e a localização da imagem. É o "índice" que o ES-DE lê para montar a tela bonita que você vê.

:::nota
O ScreenScraper exige conta (gratuita) e chave de API para volumes maiores. Sem a chave, o scraping fica limitado a uma quantidade pequena por dia. As credenciais são configuradas dentro do próprio ES-DE.
:::

## Levando a coleção para o Steam

O Steam ROM Manager varre as pastas de ROMs, aplica um *parser* para cada sistema e gera entradas no Steam com arte oficial:

```terminal
$ ls tools/launchers/
Steam-ROM-Manager.AppImage
```

O fluxo é: escolher os *parsers* (os sistemas que você quer), clicar **Preview**, conferir a lista gerada e **Save to Steam**. Cada jogo vira um atalho apontando para o emulador com o comando certo:

```terminal
"/run/media/mmcblk0p1/Emulation/tools/launchers/retroarch.sh" "Chrono Trigger"
```

O atalho chama um *launcher* (script) que, por sua vez, inicia o RetroArch com a ROM. Isso é o que permite que um jogo de SNES apareça no modo jogo do Deck como se fosse um título nativo.

:::dica
Depois de adicionar ROMs novas, sempre rode o SRM de novo e reconfirme o **Save to Steam**, ou os jogos novos não aparecem. Acrescentar ROM não atualiza a biblioteca do Steam sozinho.
:::

## Resumo

- ES-DE e Steam ROM Manager usam a mesma pasta de ROMs, mas produzem bibliotecas diferentes.
- Renomear uma ROM exige renomear também o save correspondente, ou o progresso "some".
- O scraper (ScreenScraper) baixa capas e metadados para pastas `media/` e um `gameslist.xml`.
- O SRM gera atalhos no Steam chamando um *launcher* que inicia o emulador com a ROM.
- Novas ROMs só entram na biblioteca do Steam após rodar o SRM e confirmar o Save to Steam.

## Exercícios

1. Abra um `gameslist.xml` de um sistema seu e leia os campos `<path>` e `<name>` de dois jogos.
2. Renomeie uma ROM para um nome limpo e renomeie o `.srm` correspondente em `saves/`.
3. Rode o scraper do ES-DE em um sistema pequeno e confira que as imagens apareceram em `media/`.
4. Rode o Steam ROM Manager em modo Preview e observe como cada ROM vira um atalho; não salve ainda.
5. **Desafio.** Compare a biblioteca do Steam com a do ES-DE para um mesmo jogo e explique, a partir dos arquivos (`gameslist.xml` e os atalhos do Steam), por que há duas entradas e como evitá-las.