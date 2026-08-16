O EmuDeck não apenas instala emuladores; ele entrega um conjunto de parsers do SRM já apontados para as pastas certas e com os comandos de cada emulador pré-configurados. Isso transforma o fluxo de "configurar tudo na mão" em "ligar uma opção e gerar". Esta seção mostra como aproveitar esses parsers prontos, ajustá-los e entender o que acontece por baixo de cada um.

:::objetivos
- Entender o que o EmuDeck pré-configura no SRM
- Habilitar parsers do EmuDeck para RetroArch, Dolphin e emuladores standalone
- Corrigir caminhos quando a estrutura do EmuDeck muda
- Excluir parsers desnecessários sem quebrar o conjunto
- Reconhecer a origem de cada comando pré-montado
:::

## O que o EmuDeck deixa pronto

O EmuDeck segue uma convenção rígida de pastas. Cada emulador é instalado num local previsível, e cada plataforma recebe uma subpasta de ROMs:

```terminal
$ ls ~/Emulation/roms/
genesis/  gba/  gbc/  nes/  n64/  psx/  snes/  switch/
$ ls ~/Emulation/tools/
launchers/  srm/
```

Quando o EmuDeck instala o SRM, ele grava um perfil com parsers para cada uma dessas plataformas. Isso significa que, assim que você colocar ROMs na pasta correta, o parser correspondente já sabe:

- **A pasta** de onde ler (`~/Emulation/roms/snes/`).
- **O glob** de extensões daquela plataforma.
- **O emulador** e o comando exato para lançar.
- **A fonte de arte** padrão (geralmente o SteamGridDB para a plataforma).

O seu trabalho, na imensa maioria dos casos, reduz-se a duas ações: ligar o parser e clicar em gerar.

:::nota
O EmuDeck mantém dois "perfis" de integração com o Steam: o **modo app** (cada emulador vira um atalho) e o **modo jogo** (cada ROM vira um atalho individual). Este capítulo trata do modo jogo, que é onde os parsers de ROM entram.
:::

## RetroArch e os seus cores

O RetroArch concentra dezenas de plataformas num único executável, e cada parser do EmuDeck para RetroArch aponta o mesmo binário, mudando apenas o **core** (o módulo que interpreta a plataforma) e a pasta de ROMs.

```terminal
$ flatpak info org.libretro.RetroArch | grep -i location
Location: /home/deck/.var/app/org.libretro.RetroArch
```

O comando gravado em cada atalho segue o padrão que você viu na seção anterior:

```text
/home/deck/.var/app/org.libretro.RetroArch/.../retroarch -L "/home/deck/.../cores/snes9x_libretro.so" "/home/deck/Emulation/roms/snes/Super Mario World.sfc"
```

Repare que o caminho do RetroArch é absoluto e aponta para dentro do sandbox do Flatpak (`~/.var/app/...`). Isso é uma consequência de o EmuDeck instalar o RetroArch como Flatpak — e é a razão de um erro comum: se você trocar o RetroArch de Flatpak para uma versão nativa (ou vice-versa), todos os atalhos gerados com o caminho antigo quebram e precisam ser regenerados.

| Plataforma | Core do RetroArch | Pasta de ROMs |
|---|---|---|
| SNES | `snes9x_libretro.so` | `roms/snes/` |
| NES | `nestopia_libretro.so` | `roms/nes/` |
| Mega Drive | `genesis_plus_gx_libretro.so` | `roms/genesis/` |
| GBA | `mgba_libretro.so` | `roms/gba/` |
| PSX | `swanstation_libretro.so` | `roms/psx/` |

## Emuladores standalone: Dolphin e companhia

Nem toda plataforma passa pelo RetroArch. O Dolphin (GameCube/Wii), o PCSX2 (PS2) e o Yuzu (Switch) são emuladores **standalone**, cada um com executável e linha de comando próprios. O EmuDeck também gera parsers para eles, com comandos distintos:

```text
## Dolphin (GameCube)
/home/deck/.var/app/org.DolphinEmu.dolphin-emu/.../dolphin-emu -b -e "/home/deck/Emulation/roms/gamecube/Super Smash Bros. Melee.iso"
```

Onde `-b` (batch) abre o jogo direto sem a interface do Dolphin, e `-e` passa o arquivo ISO. Cada emulador standalone tem suas próprias flags, e é por isso que você normalmente *não* escreve esses comandos na mão — o EmuDeck já os conhece.

```terminal
$ flatpak list --app | grep -iE 'dolphin|pcsx2|yuzu|duckstation'
Dolphin Emulator  org.DolphinEmu.dolphin-emu
PCSX2             net.pcsx2.PCSX2
DuckStation       org.duckstation.DuckStation
```

A regra prática: plataformas cobertas por RetroArch usam um parser de RetroArch; cada emulador standalone usa seu próprio parser. A distinção importa porque o comando, a pasta e o glob mudam de um para outro.

## Habilitar e desabilitar parsers

O EmuDeck pode ter criado parsers para plataformas que você não usa. Deixá-los ligados não atrapalha se a pasta estiver vazia (o glob não casa nada), mas polui a lista e pode levar a varreduras lentas. O ideal é ligar só o que você tem ROM.

No SRM, cada parser tem um controle de **on/off**. O fluxo recomendado:

1. Coloque ROMs nas pastas das plataformas que você quer.
2. Ligue apenas os parsers dessas plataformas.
3. Rode o parse e confira o preview.
4. Desligue parsers de plataformas sem ROM.

```terminal
$ for d in snes nes gba genesis; do
>   n=$(ls ~/Emulation/roms/$d/* 2>/dev/null | wc -l)
>   echo "$d: $n arquivos"
> done
snes: 3 arquivos
nes: 0 arquivos
gba: 12 arquivos
genesis: 0 arquivos
```

Esse levantamento no terminal diz, antes mesmo de abrir o SRM, quais parsers fazem sentido ligar (SNES e GBA, no exemplo) e quais devem ficar desligados (NES e Mega Drive).

:::atencao
Não confunda "desligar parser" com "apagar parser". Desligado, ele apenas não participa da varredura e pode ser religado depois. Apagado, você perde a configuração e terá que recriá-la (ou pedir ao EmuDeck para regenerar o perfil).
:::

## Quando o caminho muda

A estrutura do EmuDeck é estável, mas duas situações quebram os caminhos pré-configurados: migrar as ROMs para um cartão microSD e reinstalar um emulador fora do Flatpak.

No primeiro caso, o EmuDeck oferece a opção de mover as ROMs para o SD; ao fazê-lo, os parsers precisam apontar para o novo caminho (tipicamente `/run/media/mmcblk0p1/Emulation/roms/...`). Confirme a montagem do SD antes:

```terminal
$ ls /run/media/ 2>/dev/null
mmcblk0p1
$ df -h /run/media/mmcblk0p1 | tail -1
/dev/mmcblk0p1   477G  2.1G  450G   1% /run/media/mmcblk0p1
```

Se o SRM estiver apontando para `~/Emulation/roms/` e as ROMs estiverem no SD, o preview vem vazio — e a causa é o caminho, não o glob nem o emulador.

:::dica
Antes de gerar atalhos, abra um terminal e confirme os dois fatos que mais quebram o fluxo: (1) as ROMs estão onde o parser espera, e (2) o emulador correspondente está instalado. Um `flatpak list --app` resolve o segundo em segundos e evita gerar uma biblioteca inteira de atalhos que abrem para um emulador inexistente.
:::

## Resumo

- O EmuDeck pré-configura parsers do SRM apontando para `~/Emulation/roms/<plataforma>`.
- Plataformas RetroArch usam um parser por core (mesmo binário, core diferente).
- Emuladores standalone (Dolphin, PCSX2, DuckStation) usam parsers próprios com flags específicas.
- Ligue só os parsers das plataformas que têm ROM; desligar é reversível, apagar não é.
- O caminho do RetroArch Flatpak vive em `~/.var/app/...` e quebra se você trocar a forma de instalação.
- Migrar ROMs para o microSD exige atualizar o caminho da fonte nos parsers.

## Exercícios

1. Liste as pastas de ROMs do seu EmuDeck e, para cada uma, conte os arquivos com um loop `for`. Anote quais plataformas estão prontas.
2. Abra o SRM e identifique quais parsers o EmuDeck criou. Compare a lista com a sua de plataformas com ROM e ligue/desligue conforme o caso.
3. Inspecione o comando de um parser de RetroArch e de um parser do Dolphin, e aponte a diferença estrutural entre os dois.
4. Confirme com `flatpak list --app` se os emuladores dos parsers que você ligou estão de fato instalados.
5. **Desafio.** Mova uma ROM de teste para um local diferente e veja o parser falhar em encontrá-la no preview. Depois, explique que único campo do parser você mudaria para corrigir — e por que o glob não precisaria mudar.
