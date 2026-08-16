Você baixou o romset, instalou os núcleos e configurou as BIOS. O que resta é a parte que separa uma coleção que "às vezes funciona" de uma que abre sempre, sem surpresa: verificar a integridade dos romsets contra o catálogo oficial, gerar playlists para o RetroArch e organizar os arquivos de forma que o *Steam ROM Manager* e a navegação do Deck façam sentido. Este é o acabamento do capítulo.

:::objetivos
- Verificar integridade de romsets com DAT e ferramentas de auditoria
- Gerar as playlists do RetroArch a partir dos jogos verificados
- Organizar pastas por sistema e por núcleo para o Steam Deck
- Corrigir romsets incompletos ou com CRC errado
- Integrar a biblioteca final com o Steam ROM Manager
:::

## DAT: o catálogo que manda em tudo

Um **DAT** é um arquivo de texto (no formato XML do *ClrMamePro* ou do *Logiqx*) que descreve, para uma versão específica do emulador, exatamente quais arquivos cada romset deve conter e qual o CRC/SHA-1 de cada um. É a "lista de verificação" contra a qual você audita sua coleção.

Cada projeto publica o seu DAT ao lado de cada release. O MAME gera um DAT interno; o FBNeo publica o seu.

```terminal
$ ls ~/lab/dat/
MAME_0.261.dat
fbneo-v1.0.0.03.dat
```

A regra inflexível: o DAT precisa ser da **mesma versão** do núcleo instalado. Auditar com DAT de outra versão produz falsos "faltando/corrompido".

## Ferramentas de verificação

Duas ferramentas dominam o cenário de auditoria de romsets:

- **ClrMamePro** — o padrão histórico, em Windows (roda bem via Proton/Wine no Deck).
- **RomCenter** — alternativa gráfica com interface mais amigável.

Ambas fazem o mesmo trabalho: comparam sua pasta de ROMs com o DAT e geram um relatório de *missing*, *corrompido* e *desconhecido*.

```terminal
$ # ClrMamePro sob Proton no Steam Deck:
$ # 1. Crie um "Profile" apontando o DAT do FBNeo
$ # 2. Set > ROM-Paths > adicione ~/lab/arcade
$ # 3. Scanner... > New Scan
$ # Resultado: missing / bad dump / fixed
```

A linha de comando também resolve com ferramentas mais enxutas, como o `igir` (gerenciador de romsets moderno), que gera playlists e valida contra DAT sem interface gráfica.

```terminal
$ npx igir --dat ~/lab/dat/fbneo-v1.0.0.03.dat \
    --input ~/lab/downloads/ \
    --output ~/lab/arcade/ \
    --single
```

O `igir` (via Node) move, renomeia, filtra e valida romsets em lote, e ainda pode emitir playlists do RetroArch — juntando duas etapas numa só.

## Gerando playlists no RetroArch

Uma **playlist** é o arquivo `.lpl` que faz o RetroArch enxergar os jogos no menu. Ela liga um título a um romset e a um núcleo. Existem duas formas de gerá-las:

1. **Manual scan** — *Main Menu > Import Content > Scan*, apontando para a pasta de ROMs. Funciona bem quando o seu romset tem os nomes e CRCs que o núcleo espera.
2. **DAT-driven** — com o `igir`, que gera playlists precisas a partir do DAT, evitando depender do banco de dados interno do RetroArch.

```terminal
$ # Gerar playlists com igir:
$ npx igir --dat ~/lab/dat/fbneo-v1.0.0.03.dat \
    --input ~/lab/arcade/ \
    --output ~/lab/arcade/ \
    --single --dir-letter --no-bios
```

A playlist resultante fica em `~/.var/app/org.libretro.RetroArch/config/retroarch/playlists/` e é reconhecida automaticamente na próxima abertura do RetroArch.

:::dica
Ao gerar playlists, desmarque a inclusão de clones e BIOS se você usa o formato non-merged ou quer uma lista enxuta. Jogos "duplicados" no menu quase sempre são clones sem filtro.
:::

## Organizando pastas por sistema

Uma boa organização evita o caos de ter centenas de `.zip` num só diretório. Separe por família/placa, que é o recorte que o FBNeo e o MAME usam internamente.

```terminal
$ tree ~/lab/arcade/ -L 1
~/lab/arcade/
├── cps1/
├── cps2/
├── cps3/
├── neogeo/
├── sega/
└── shooters/
```

Essa separação também ajuda o *Steam ROM Manager*, que pode usar parsers por pasta para aplicar capas e categorias coerentes.

## Integrando com o Steam ROM Manager

O passo final é levar os jogos verificados para a biblioteca Steam. O [capítulo 51](#/cap-051/sec-01) cobre o *Steam ROM Manager* em detalhe; aqui, apenas o recorte de arcade:

```terminal
$ # No Steam ROM Manager, crie um parser por núcleo:
$ #   Parser: FBNeo — glob "neogeo/*.zip", emulator fbneo_libretro.so
$ #   Parser: MAME — glob "cps3/*.zip", emulator mame_libretro.so
```

Aponte cada parser para o núcleo certo (FBNeo para Neo Geo/CPS-1/2, MAME para o que só ele roda) e gere os atalhos. Como discutimos, ter a coleção em estado non-merged elimina quebras por clone sem parent.

:::atencao
Só adicione à Steam os jogos **já verificados**. Um atalho para um romset corrompido abre, volta para o menu e polui a biblioteca com entradas que parecem "quebradas".
:::

## Resumo

- O DAT descreve o conteúdo e os CRCs esperados para uma versão específica do emulador.
- ClrMamePro, RomCenter e igir validam a coleção contra o DAT e corrigem/nomeiam arquivos.
- Playlists `.lpl` ligam título, romset e núcleo; são geradas por *scan* ou via ferramentas DAT-driven.
- Organizar por família de placa (cps1, cps2, neogeo…) simplifica o Steam ROM Manager.
- Só leve para a biblioteca Steam os romsets que passaram na verificação.

## Exercícios

1. Baixe o DAT da versão do seu FBNeo e rode uma verificação com `igir` ou ClrMamePro; anote quantos romsets estão íntegros, faltando ou corrompidos.
2. Gere uma playlist do RetroArch com `igir --no-bios` e confirme que os jogos aparecem no menu com título correto.
3. Reorganize sua pasta de ROMs por família de placa e ajuste os *glob* do Steam ROM Manager para refletir a nova estrutura.
4. Identifique um romset "corrompido" no relatório de verificação e explique, com base no CRC, por que a ferramenta o marcou como ruim.
5. **Desafio.** Monte um fluxo completo de "baixar → verificar → gerar playlist → levar à Steam" para três jogos de famílias diferentes (um Neo Geo, um CPS-2 e um shooter), documentando cada etapa e o comando/DAT usado em cada uma.