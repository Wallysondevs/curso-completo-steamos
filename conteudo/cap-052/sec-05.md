A Neo Geo é a joia da coroa do arcade doméstico. Lançada em 1990 pela SNK, a placa MVS (Multi Video System) permitia ao operador enfiar até seis cartuchos em um único gabinete, enquanto a versão AES (Advanced Entertainment System) vendia o mesmo hardware como console de luxo. Essa arquitetura unificada — o mesmo jogo roda idêntico nos dois — faz da emulação da Neo Geo uma experiência particularmente limpa no RetroArch, desde que a BIOS esteja no lugar certo e as opções certas estejam ligadas.

:::objetivos
- Entender a arquitetura MVS/AES e suas implicações na emulação
- Configurar a BIOS Neo Geo (padrão, regional ou UniBIOS) no RetroArch
- Alternar entre modo fliperama e modo console
- Resolver o erro "neogeo.zip not found" de uma vez por todas
- Ajustar latência, overclock e som em jogos Neo Geo
:::

## MVS e AES: o mesmo jogo, dois modos

A SNK projetou a placa MVS primeiro; o AES, que é um MVS com um slot só e saída de TV, veio depois. O software é literalmente o mesmo ROM. A diferença está no comportamento em runtime: o modo MVS mostra contagem de créditos, libera acesso a *dip switches* e exige ficha virtual; o modo AES mostra tela de título, limite de continues e saves de progresso.

No RetroArch (tanto via MAME quanto FBNeo), a escolha entre MVS e AES é feita no nível da BIOS ou nas opções do núcleo — não é uma ROM diferente.

```terminal
$ ls ~/lab/arcade/neogeo.zip
neogeo.zip
$ unzip -l ~/lab/arcade/neogeo.zip | head -12
000-lo.lo
sfx.sfx
sfix.sfix
sp-s2.sp1
sp-s.sp1
uni-bios.rom
```

O arquivo `uni-bios.rom` é a Universe BIOS; os demais (`000-lo.lo`, `sfx.sfx`, `sfix.sfix` e os `.sp1`) compõem a BIOS oficial da SNK.

## A Universe BIOS e por que ela resolve tudo

A *Universe BIOS* (UniBIOS) é um firmware alternativo criado pela comunidade que adiciona um menu de configuração acessível durante o jogo. Ao pressionar uma combinação de botões (por padrão `[[Start+Select]]` ou `[[A+B+C]]`), você abre um menu verde sobre o jogo com opções de região, modo (MVS/AES), *dip switches*, cheats e até *overclock* da CPU.

:::dica
No Steam Deck, mapeie a combinação da UniBIOS para um botão de trás (R4 ou L4) via Steam Input — isso evita conflito com os controles do jogo e dá acesso instantâneo ao menu de serviço.
:::

Para usar a UniBIOS, basta que o `neogeo.zip` contenha o arquivo `uni-bios.rom` e que a opção de BIOS no núcleo esteja configurada para ela.

```terminal
$ # No RetroArch, navegue para:
$ # Quick Menu > Options > Neo Geo BIOS > UniBIOS
```

Salve o *Core Override* após selecionar, e todos os jogos Neo Geo passarão a usar a UniBIOS automaticamente.

## Configuração no FBNeo

O FBNeo é o núcleo recomendado para Neo Geo no Steam Deck. Ele oferece controle fino das opções específicas da placa.

```terminal
$ # Core Options do FBNeo para Neo Geo:
$ # System > Neo Geo mode: DIPSWITCH (deixa a UniBIOS decidir)
$ # System > Neo Geo BIOS: UniBIOS 4.0
$ # Diag. > Diagnostic Input: Hold Start (abre menu a qualquer momento)
```

O modo *DIPSWITCH* delega a escolha MVS/AES ao menu da BIOS, que é o comportamento mais flexível.

## Configuração no núcleo MAME

No MAME libretro, o caminho é diferente: a seleção de BIOS e região é feita por meio de um menu interno do próprio MAME, acessível por `[[Tab]]` durante o jogo, ou por opções específicas de linha de comando.

```terminal
$ # No MAME (dentro do jogo), pressione Tab e vá em:
$ # Machine Configuration > BIOS > UniBIOS 4.0
$ # System > Region > Japan/USA/Europe
```

O MAME persiste essas preferências em um arquivo `.cfg` por jogo, o que permite ter configurações diferentes para cada título.

## Ajustando latência e áudio

Jogos de luta Neo Geo exigem resposta precisa. O FBNeo oferece opções para reduzir *input lag*:

- **Runahead** — calcula frames à frente para compensar a latência (compatível com Neo Geo).
- **Hard GPU Sync** — sincronia rígida com a GPU, ao custo de mais CPU.
- **Frame Delay** — adia a chamada de GPU até o último momento possível.

```terminal
$ # RetroArch Settings > Latency:
$ #   Hard GPU Sync: ON
$ #   Hard GPU Sync Frames: 1
$ #   Frame Delay: 2
```

No Steam Deck, esses valores são seguros para a maioria dos jogos Neo Geo. Se houver gagueira, reduza `Frame Delay` para 1 ou desligue `Hard GPU Sync`.

:::atencao
O *Runahead* com Neo Geo pode consumir bateria mais rápido porque efetivamente renderiza o dobro de frames. Em sessões longas longe da tomada, avalie desligá-lo.
:::

## Resumo

- MVS (fliperama) e AES (console) compartilham a mesma ROM; a diferença é o modo de operação.
- A UniBIOS é o firmware mais flexível e recomendado: troca de região e modo sem trocar arquivo.
- O FBNeo é o núcleo preferível para Neo Geo no Steam Deck por ser mais leve.
- No MAME, a configuração de BIOS é por jogo; no FBNeo, é global via *Core Options*.
- Opções de latência como *Frame Delay* e *Hard GPU Sync* melhoram a resposta em jogos de luta.

## Exercícios

1. Configure a UniBIOS no seu núcleo preferido e acesse o menu verde durante o jogo; altere a região do Japão para USA e confirme a mudança na tela de título.
2. Compare o mesmo jogo Neo Geo no modo MVS e AES e liste três diferenças visíveis no comportamento (telas, créditos, continues).
3. Habilite `Hard GPU Sync` e `Frame Delay` e meça a diferença no input lag percebido em um jogo de luta.
4. Liste o conteúdo de dois `neogeo.zip` diferentes com `unzip -l`, compare os CRCs com `cksum` e determine qual deles é compatível com a UniBIOS 4.0.
5. **Desafio.** Explique por que o áudio de *Metal Slug* pode estalar em certas configurações e relacione isso com o underclock do chip de som Z80 que o FBNeo permite ajustar nas *Core Options*.