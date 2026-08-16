A palavra "emulador" esconde uma miríade de decisões de engenharia: cada console tem uma arquitetura própria, e nem sempre o melhor programa para um é o melhor para o outro. O EmuDeck monta um menu onde você escolhe o que instalar, mas escolher bem exige entender a diferença entre um núcleo do RetroArch e um emulador standalone — e quais opções dominam cada plataforma hoje.

:::objetivos
- Distinguir núcleo do RetroArch de emulador standalone
- Identificar o emulador de referência para os consoles mais populares
- Entender o papel da BIOS em cada plataforma
- Reconhecer sistemas que exigem arquivos extras (BIOS e chaves)
- Avaliar desempenho e compatibilidade antes de escolher
:::

## Núcleo versus standalone: a decisão fundamental

O RetroArch é um único programa com muitos "núcleos" (cores). Cada núcleo é um emulador compilado como biblioteca plugável: o `Snes9x` emula SNES, o `Gambatte` emula Game Boy, o `Genesis Plus GX` emula Mega Drive. Todos compartilham a mesma interface, o mesmo menu de *hotkeys* e o mesmo sistema de saves — daí a conveniência de concentrar tudo nele.

Os **standalone** são programas separados, cada um com interface e atalhos próprios. Historicamente, alguns consoles ganharam emuladores dedicados tão superiores aos núcleos do RetroArch que deixou de fazer sentido usar o núcleo. O PPSSPP (PSP), o PCSX2 (PS2) e o Dolphin (GameCube/Wii) são os três casos clássicos: mantêm times de desenvolvimento próprios, recebem atualizações mais rápidas e, em muitos jogos, simplesmente rodam melhor do que qualquer alternativa integrada.

A regra que o EmuDeck adota por padrão é esta: **consoles antigos e simples (até a geração 16/32 bits) via RetroArch; consoles 3D mais recentes via standalone**. Há exceções que a tabela abaixo organiza.

| Console | Referência padrão | Tipo |
|---|---|---|
| NES | Mesen (RetroArch) | núcleo |
| SNES | Snes9x (RetroArch) | núcleo |
| Mega Drive | Genesis Plus GX (RetroArch) | núcleo |
| Game Boy / GBC / GBA | Gambatte / mGBA (RetroArch) | núcleo |
| N64 | Mupen64Plus (RetroArch) | núcleo |
| PSP | PPSSPP | standalone |
| PS2 | PCSX2 | standalone |
| GameCube / Wii | Dolphin | standalone |
| Nintendo DS | melonDS | standalone |
| Dreamcast | Flycast | núcleo/standalone |

## Onde cada núcleo aparece

Dentro do RetroArch, a lista de núcleos instalados fica disponível pelo menu principal, e o EmuDeck já baixa os mais comuns segundo o modo de instalação. No disco, eles aparecem como arquivos `.so` dentro do diretório de núcleos do Flatpak.

```terminal
$ ls ~/.var/app/org.libretro.RetroArch/config/retroarch/cores | head -12
genesis_plus_gx_libretro.so
gambatte_libretro.so
mupen64plus_next_libretro.so
snes9x_libretro.so
nestopia_libretro.so
mgba_libretro.so
flycast_libretro.so
...
```

Cada arquivo `_libretro.so` é um núcleo carregável. O nome já entrega o console: `genesis_plus_gx` é Mega Drive, `gambatte` é Game Boy, `mupen64plus_next` é Nintendo 64. Saber esses nomes ajuda a diagnosticar quando um jogo abre com o núcleo errado — problema comum indicado por tela preta ou controles que não respondem.

## O papel da BIOS

Muitos emuladores precisam de um arquivo de **BIOS** — o firmware original do console — para funcionar. Isso vale sobretudo para sistemas com uma ROM de boot proprietária: PlayStation (a `scph1001.bin` e variantes), PlayStation 2, Sega Saturn e, no caso do GBA, o `gba_bios.bin`. Sem esses arquivos, o emulador freqüentemente nem inicia, ou trava logo após o logo.

O EmuDeck cria a pasta `~/Emulation/bios` e espera que você coloque cada firmware com o **nome de arquivo exato** que o emulador procura. Uma letra trocada significa "a BIOS não existe" para o programa.

```terminal
$ ls ~/Emulation/bios
scph1001.bin  scph5501.bin  gba_bios.bin  dc_boot.bin
```

:::atencao
As BIOS são protegidas por copyright e não acompanham o EmuDeck nem os emuladores. Obtê-las de um console que você possui, via dump, é a via legal; baixá-las de sites aleatórios, além de ilegal, é a forma mais fácil de instalar um arquivo malicioso disfarçado de firmware. Nomes de arquivo são tudo nessa pasta — não renomeie à vontade.
:::

## Consoles com requisitos especiais

Alguns sistemas vão além da BIOS. O **Nintendo Switch** (quando suportado) exige não só firmware, mas *prod.keys* e *title.keys* extraídas de um aparelho real, por criptografia. O **Sega Saturn** e o **CD-i** são notórios por exigirem arquivos de BIOS específicos por região. E o **arcade** (MAME e FinalBurn Neo) depende de *ROM sets* versionados: um jogo só roda se a ROM corresponder exatamente à versão do núcleo.

```terminal
$ ls ~/Emulation/roms/arcade | head -6
sf2.zip
kof98.zip
neogeo.zip
```

No arcade, cada jogo é um `.zip` com os chips do cartucho dentro, e o arquivo `neogeo.zip` contém a BIOS do sistema Neo Geo, compartilhada por todos os jogos da plataforma. Se a versão do `neogeo.zip` não casar com a do núcleo FinalBurn Neo instalado, nada abre — erro clássico de "ROM set desatualizado".

## Escolhendo pelo desempenho

Para consoles 3D, a escolha do emulador também é uma escolha de desempenho. A APU do Deck é capaz, mas emulação de PS2 e GameCube não é grátis: resolução interna, shaders e *upscaling* consomem GPU rapidamente. O PCSX2 e o Dolphin expõem esses ajustes, e o EmuDeck escreve valores iniciais conservadores.

```terminal
$ cat ~/.var/app/net.pcsx2.PCSX2/config/PCSX2/inis/GS.ini | grep -i resolution
upscale_multiplier = 2
```

Aqui o PCSX2 está configurado para renderizar a 2x a resolução nativa do PlayStation 2 — um bom ponto de partida no Deck, que equilibra nitidez e fluidez. Subir para 3x ou 4x em jogos pesados pode derrubar os frames, e é justamente esse tipo de trade-off que a seção sobre desempenho explora com mais profundidade.

## Resumo

- Núcleos do RetroArch e emuladores standalone são entregas diferentes do mesmo tipo de software.
- O EmuDeck usa RetroArch para consoles antigos e standalone para os 3D recentes (PSP, PS2, GC/Wii).
- Cada núcleo aparece como arquivo `_libretro.so` no diretório de cores do RetroArch.
- BIOS são firmwares proprietários que o usuário precisa fornecer, com nome de arquivo exato.
- Arcade (MAME/FBNeo) exige ROM sets versionados e um `neogeo.zip` de BIOS.
- Resolução interna é o principal ajuste de desempenho dos emuladores 3D.

## Exercícios

1. Liste os núcleos instalados com `ls ~/.var/app/org.libretro.RetroArch/config/retroarch/cores` e identifique a qual console cada um pertence.
2. Para cada console que você pretende emular, pesquise qual BIOS é necessária e anote o nome de arquivo exato esperado.
3. Abra o menu do RetroArch e localize a opção `Load Core`; observe quais núcleos o Easy Mode já deixou disponíveis.
4. Crie a estrutura de uma ROM de arcade de teste (`sf2.zip` vazio) e explique por que ela não abrirá sem o `neogeo.zip` correto e sem conteúdo legítimo.
5. **Desafio.** Compare o consumo de dois emuladores para o mesmo console (ex.: núcleo mGBA vs mGBA standalone) rodando o mesmo jogo e medindo FPS ou uso de CPU com `top` aberto em paralelo. Relate qual teve melhor desempenho e proponha uma hipótese para a diferença.
