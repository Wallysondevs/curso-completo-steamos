Ter o RetroArch instalado é só metade do caminho — sem cores, ele não emula nada. O **core** é o emulador propriamente dito, e a primeira tarefa de quem usa o RetroArch é baixar e organizar um core para cada console que pretende rodar. Esta seção ensina a usar o Core Updater, a entender as extensões de arquivo que cada core aceita e a lidar com as BIOS que alguns sistemas exigem para funcionar.

:::objetivos
- Baixar e atualizar cores pelo Core Updater
- Associar cada core aos formatos de ROM e extensões que ele aceita
- Entender o papel das BIOS e onde colocá-las em `system/`
- Diagnosticar o erro "No core" e o "Failed to load content"
- Escolher o core certo quando vários emulam o mesmo sistema
:::

## O Core Updater

O Core Updater é a loja de emuladores do RetroArch. Ele puxa os `.so` já compilados e compatíveis com a sua versão, poupando o trabalho de procurar builds na internet. O caminho é *Main Menu > Online Updater > Core Downloader*.

```terminal
$ ls ~/.var/app/org.libretro.RetroArch/config/retroarch/cores/
fbneo_libretro.so          genesis_plus_gx_libretro.so
snes9x_libretro.so         mesen_libretro.so
```

Cada entrada do menu mostra o nome do core e, quando o *Core Info Files* está atualizado, uma descrição curta. Baixar é instantâneo — a maioria tem poucos megabytes.

:::dica
Antes de baixar dezenas de cores, baixe apenas os que vai usar. O RetroArch testa todos os cores instalados ao carregar um arquivo, e uma lista gigante só deixa o "Load Core" mais poluído.

Mesmo com só quatro ou cinco cores, você já cobre NES, SNES, Mega Drive, Game Boy e PlayStation — o grosso do catálogo retrô. Cada core baixado adiciona uma entrada no diretório `cores/` e um `.info` correspondente, que o menu usa para mostrar nome, autor e recursos suportados.
:::

## Extensões e formatos de ROM

Cada core aceita um conjunto de formatos. Quando você tenta abrir um arquivo, o RetroArch tenta descobrir qual core combina com a extensão. Um `.sfc` aponta para SNES; um `.nes` para NES; um `.chd` para CD-ROM. A tabela ajuda a não confundir:

| Console | Extensões comuns |
|---|---|
| NES | `.nes`, `.unf` |
| SNES | `.sfc`, `.smc`, `.fig` |
| Mega Drive | `.md`, `.gen`, `.bin` |
| Game Boy | `.gb`, `.gbc`, `.gba` |
| PlayStation | `.cue` + `.bin`, `.chd`, `.pbp` |
| Arcade (FBNeo) | `.zip` (romset) |

O caso do Arcade merece atenção: as ROMs do FinalBurn Neo vêm como `.zip` que **não devem ser descompactados** — o próprio core lê o conteúdo interno. Descompactar quebra a detecção.

:::atencao
Um erro clássico é baixar uma ROM no formato errado e ver `Failed to load content`. Verifique a extensão e se o core correspondente está instalado antes de culpar o arquivo.
:::

Há ainda o caso dos formatos de imagem de CD. Um jogo de PlayStation normalmente vem como um `.cue` (um arquivo de texto que descreve as faixas) acompanhado de um ou mais `.bin` (os dados e o áudio). O RetroArch abre o `.cue`, não o `.bin`. Já o `.chd` é uma imagem única, comprimida e sem `cue` separado, e virou o formato preferido por economizar espaço:

```terminal
$ ls "Final Fantasy VII (USA)"/
Final Fantasy VII (USA).cue
Final Fantasy VII (USA) (Track 01).bin
Final Fantasy VII (USA) (Track 02).bin
Final Fantasy VII (USA) (Track 03).bin
```

Com `.chd`, os três `.bin` viram um único arquivo de poucas centenas de megabytes, sem perda de qualidade — o core consegue ler as trilhas de dentro do container.

## BIOS: o "sistema operacional" de cada console

Alguns consoles têm, além da ROM do jogo, um **firmware interno** — a BIOS. É o caso do PlayStation (a `scph5501.bin`), do Saturn, do PC Engine CD e de vários sistemas de CD. Sem a BIOS no lugar certo, o core falha com uma mensagem curta e seca.

No RetroArch, essas BIOS ficam em `system/`, na raiz de configuração:

```terminal
$ ls ~/.var/app/org.libretro.RetroArch/config/retroarch/system/
scph5500.bin  scph5501.bin  scph5502.bin
```

O core `beetle_psx`, por exemplo, procura `scph5501.bin` (região NTSC) dentro de `system/`. O nome do arquivo precisa ser **exato** — as BIOS são identificadas por nome, não por conteúdo.

:::dica
Para descobrir qual BIOS um core pede e com qual nome, abra *Main Menu > Online Updater > Core Downloader*, selecione o core e leia a descrição; muitos cores também exibem essa informação em *Information > Core Information > Firmware*.
:::

## Diagnosticando "No core" e falhas de carga

Dois erros dominam a vida de quem começa. O primeiro, `No core`, aparece quando você tenta carregar conteúdo sem ter nenhum core ativo. O segundo, `Failed to load content`, indica que um core foi carregado mas não conseguiu processar o arquivo — falta BIOS, extensão errada ou ROM corrompida.

```terminal
$ retroarch -L cores/genesis_plus_gx_libretro.so rom.md
```

Rodar pelo terminal com `-L` (que aponta explicitamente para o core) ajuda a isolar o problema: se funciona via linha de comando, o problema é de associação no menu; se falha também, é o arquivo ou a BIOS.

:::nota
O RetroArch grava um log em `logs/retroarch.log`. Quando um jogo não carrega, abrir esse arquivo e procurar por `error` quase sempre revela a causa exata — nome de BIOS, versão de romset ou core ausente.
:::

## Resumo

- O Core Updater baixa emuladores já compilados e compatíveis com a sua versão do RetroArch.
- Cada core aceita extensões específicas; `.sfc`→SNES, `.chd`/`.cue`→CD, `.zip`→Arcade (não descompactar).
- BIOS vão em `system/` com o nome exato que o core procura (ex.: `scph5501.bin` para PlayStation).
- `No core` = nenhum emulador ativo; `Failed to load content` = arquivo/BIOS incompatíveis.
- O log em `logs/retroarch.log` é o melhor amigo para diagnosticar cargas que falham.

## Exercícios

1. Baixe pelo Core Updater os cores `snes9x`, `genesis_plus_gx` e `beetle_psx` e confirme os três `.so` em `cores/`.
2. Liste as extensões de ROM suportadas por um core lendo a informação exibida em *Core Information*.
3. Coloque uma BIOS de PlayStation em `system/` com o nome correto e teste abrir uma imagem `.cue` pelo core `beetle_psx`.
4. Provocar (de propósito) um `Failed to load content` abrindo uma ROM com o core errado e depois leia o `retroarch.log` para ver o erro registrado.
5. **Desafio.** Baixe uma ROM de arcade no formato `.zip` do romset correto do FBNeo e carregue-a. Se falhar, use o log e a documentação do core para descobrir se o romset bate com a versão do core instalada.
