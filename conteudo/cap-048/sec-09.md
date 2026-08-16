As seções anteriores mostraram as peças — cores, shaders, overrides, conquistas e netplay — cada uma funcionando isolada. Esta seção fecha o capítulo amarrando tudo num fluxo só: diretórios de conteúdo bem organizados, playlists que viram bibliotecas navegáveis, save states e saves com nome certo, e uma rotina de diagnóstico para quando algo falha. É o passo que separa quem "abre ROM solta" de quem tem uma coleção que funciona como um console de verdade.

:::objetivos
- Configurar um diretório de conteúdo para ROMs e BIOS no Deck
- Gerar e manter playlists por sistema via scanner e por arquivo manual
- Entender a diferença entre savefile e savestate e onde cada um fica
- Montar uma rotina de diagnóstico apoiada no retroarch.log
- Consolidar cores, overrides e shaders num fluxo final coerente
:::

## Organizando o conteúdo

O RetroArch não exige uma pasta específica, mas sua vida melhora muito se você criar uma convenção. Um diretório para ROMs, um para BIOS e um para *system* evita a bagunça de `.zip` e `.sfc` espalhados.

```terminal
$ mkdir -p ~/Games/roms/{nes,snes,genesis,psx,arcade}
$ mkdir -p ~/Games/bios
$ ls ~/Games/roms/
arcade/  genesis/  nes/  psx/  snes/
```

Dentro do RetroArch, aponte *Settings > Directory > File Browser* para `~/Games` e *Settings > Directory > System/BIOS* para `~/Games/bios` (ou mantenha as BIOS em `system/`, como já vimos). Ter os caminhos cadastrados faz o navegador abrir direto na coleção.

:::dica
Mantenha as BIOS no diretório `system/` do RetroArch E registrado o caminho, mas não misture ROMs com BIOS na mesma pasta. Separar os dois evita que o scanner tente interpretar uma `scph5501.bin` como jogo.
:::

## Playlists: de arquivos soltos a biblioteca

Uma **playlist** (`.lpl`) é um arquivo JSON/texto que lista jogos de um sistema, com o core a usar e o caminho de cada ROM. É o que transforma sua pasta de ROMs na biblioteca navegável do menu, com caixinhas e arte.

O jeito automático é o *Scanner*, em *Main Menu > Import Content > Scan Directory*. Ele lê a pasta, casa cada arquivo com as *databases* e gera a playlist.

```terminal
$ ls ~/.var/app/org.libretro.RetroArch/config/retroarch/playlists/
Nintendo\ -\ Super\ Nintendo\ Entertainment\ System.lpl
Sega\ -\ Mega\ Drive\ -\ Genesis.lpl
```

O scanner, porém, só reconhece ROMs que batem com um banco conhecido e com a extensão esperada. Para nomes alternativos, traduções ou hacks, o jeito é a **playlist manual** (um `.lpl` que você mesmo monta).

:::atencao
O scanner não reconhece ROMs fora do padrão (nomes esquisitos, hacks, regiões não catalogadas). Se um jogo não aparece, não insista no scanner — monte a playlist manualmente apontando caminho e core.
:::

## Savefile versus savestate

É importante não confundir os dois. O **savefile** (`.srm`) é o save *dentro do jogo* — aquele que o cartucho teria, escrito pela própria lógica do jogo. O **savestate** (`.state`) é um retrato instantâneo de toda a RAM da emulação, criado pelo RetroArch a qualquer momento, com o atalho [[F2]] para salvar e [[F4]] para carregar.

```terminal
$ ls ~/.var/app/org.libretro.RetroArch/config/retroarch/saves/
Super\ Mario\ World.srm
$ ls ~/.var/app/org.libretro.RetroArch/config/retroarch/savestates/
Super\ Mario\ World.state
```

O savestate é prático, mas não sobrevive a trocas de core e, como vimos, é desligado no modo hardcore das conquistas. O savefile é o que importa de verdade para continuar o progresso.

:::dica
Use savefile (save do jogo) como fonte de progresso real e savestate apenas como conveniência de "quicksave" durante uma sessão. Para trocar de emulador, exporte o savefile, não o savestate.
:::

## A rotina de diagnóstico

Quando algo falha, o `retroarch.log` em `logs/` é o primeiro lugar a olhar. Uma rotina eficiente em três passos cobre a maioria dos problemas:

```terminal
$ tail -40 ~/.var/app/org.libretro.RetroArch/config/retroarch/logs/retroarch.log
RetroAchievements: Game not found in database (hash mismatch)
```

Passo 1: confirme o core certo e a extensão da ROM. Passo 2: verifique a BIOS no lugar certo, com o nome exato (para sistemas de CD). Passo 3: abra o log e procure por `error`, `fail` ou `not found` — a última linha relevante quase sempre nomeia a peça faltante.

:::nota
Se o log não estiver sendo gravado, ligue *Settings > Logging > Logging Verbosity* e reinicie o RetroArch. Nível maior de verbosidade ajuda, mas deixa o arquivo grande — use só enquanto investiga.
:::

## Um fluxo final coeso

Juntando tudo: defina os diretórios, baixe os cores e BIOS, gere as playlists, aplique um shader CRT por núcleo, ligue o runahead nos cores leves, autentique o RetroAchievements e deixe o netplay pronto para as máquinas que jogam junto. Com a base organizada, cada novo jogo entra em segundos — e é aí que o "canivete suíço" mostra seu valor.

```terminal
$ ls ~/.var/app/org.libretro.RetroArch/config/retroarch/
assets/  cores/  playlists/  saves/  savestates/  shaders/  system/
```

## Resumo

- Organize ROMs e BIOS em pastas separadas e cadastre os caminhos em *Settings > Directory*.
- Playlists transformam uma pasta de ROMs na biblioteca navegável; o scanner é automático, a playlist manual cobre hacks e nomes alternativos.
- Savefile (`.srm`) é o save do jogo; savestate (`.state`) é retrato de RAM, e não troca de core.
- O `retroarch.log` é a primeira parada do diagnóstico; procure `error`, `fail` e `not found`.
- Um fluxo coeso (diretórios → cores → playlists → shaders → runahead → conquistas) deixa o RetroArch pronto para cada jogo novo.

## Exercícios

1. Crie a árvore de diretórios proposta, aponte o File Browser para ela e gere uma playlist com o scanner.
2. Monte uma playlist manual para uma ROM que o scanner não reconheceu (hack ou tradução) e confira se aparece na biblioteca.
3. Distinga, no seu diretório, um `.srm` de um `.state` e explique o que cada um preserva.
4. Ligue a verbosidade do log, reproduza um erro proposital e identifique a linha que revela a causa.
5. **Desafio.** Monte do zero um fluxo completo para um console de CD: BIOS no lugar, imagem `.cue`/`.chd`, playlist, shader CRT por núcleo e save — documentando cada etapa e o resultado final no menu.
