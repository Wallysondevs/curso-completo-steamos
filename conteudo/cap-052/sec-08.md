O FBNeo é o núcleo que você vai usar 90% do tempo para arcade no Steam Deck, e a razão é simples: ele foi feito para isso. Leve, rápido, com menos input lag e um conjunto de *Core Options* pensado para jogos de Neo Geo, CPS e shooters, ele é a antítese do "configurar para funcionar" do MAME. Mas essa simplicidade tem armadilhas próprias — especialmente em relação à versão do romset e à pasta de BIOS.

:::objetivos
- Instalar e ativar o núcleo FBNeo no RetroArch
- Entender a relação entre núcleo FBNeo e a versão do romset
- Configurar BIOS e modo Neo Geo pelas Core Options
- Ajustar opções de desempenho e overclock específicas do FBNeo
- Resolver incompatibilidades de romset e diretório de sistema
:::

## Instalando e ativando o núcleo

O FBNeo chega pelo mesmo caminho de qualquer núcleo no RetroArch, mas com um cuidado de nomenclatura: às vezes aparece como `fbneo` e às vezes como `fbneo_libretro`. Ambos são o mesmo projeto.

```terminal
$ # No RetroArch:
$ # Main Menu > Online Updater > Core Downloader > Arcade > FinalBurn Neo
```

Depois de instalar, carregue o núcleo e anote a **versão**. É ela que determina qual romset você deve baixar — o FBNeo atualiza com frequência e, como vimos, o CRC precisa bater.

```terminal
$ flatpak run org.libretro.RetroArch --verbose 2>&1 | grep -i fbneo
[INFO] fbneo: FinalBurn Neo v1.0.0.03 (libretro)
```

## Onde o FBNeo procura ROMs e BIOS

Diferente do MAME, o FBNeo **não** usa um `mame.ini`. A localização das ROMs é ditada pelas configurações do próprio RetroArch: as *Core Options* "System > BIOS" apontam para o diretório de sistema, e o diretório de conteúdo padrão é a sua pasta de ROMs do RetroArch.

A pasta de BIOS padrão no flatpak é:

```terminal
$ ls ~/.var/app/org.libretro.RetroArch/config/retroarch/system/
neogeo.zip
qsound.zip
pgm.zip
```

O FBNeo procura a BIOS primeiro nessa pasta `system/`. Se preferir manter tudo junto das ROMs, há uma opção de *Core* para isso.

```terminal
$ # Quick Menu > Options > Neo-Geo > System Files in Content Directory: ON
```

:::dica
Mantenha as BIOS em `system/` e as ROMs em um diretório separado. Isso separa "firmware de plataforma" de "jogo" e evita misturar `neogeo.zip` com os romsets ao sincronizar a coleção.
:::

## Configurando Neo Geo pelas Core Options

O FBNeo concentra tudo em *Quick Menu > Options*. As opções relevantes para a família Neo Geo são:

| Opção | Recomendado | Efeito |
|---|---|---|
| Neo-Geo mode | DIPSWITCH | Deixa a UniBIOS decidir MVS/AES |
| Neo-Geo BIOS | UniBIOS 4.0 | Firmware com menu de serviço |
| Diagnostic Input | Hold Start | Abre menu de serviço segurando Start |
| Use CD audio | OFF | Evita busca por imagens que não existem |

```terminal
$ # Quick Menu > Options (FBNeo):
$ #   System > Neo-Geo mode: DIPSWITCH
$ #   System > Neo-Geo BIOS: UniBIOS 4.0
$ #   Diag. Input: Hold Start
```

Após escolher, use *Quick Menu > Core Overrides > Save Core Overrides* para aplicar a todos os jogos Neo Geo.

## Desempenho e overclock no FBNeo

O FBNeo expõe opções de desempenho que não existem no MAME libretro. As mais úteis para o Steam Deck:

- **CPU overclock** (Neo Geo) — acelera a CPU para eliminar *slowdown* em jogos como *Metal Slug* quando a tela enche de inimigos.
- **Audio filter** — aplica um filtro para suavizar o áudio original.
- **Blitter delay** — ajusta a fidelidade do blitter (processador gráfico), com impacto em compatibilidade de sombras.

```terminal
$ # Quick Menu > Options:
$ #   Neo-Geo > CPU overclock: 200%
$ #   Audio > Audio filter: Low-pass (smoother)
```

O overclock de 200% é seguro e elimina a lentidão clássica dos jogos Neo Geo mais pesados. Se causar instabilidade em um título específico, volte para 100% apenas para aquele jogo via *Game Override*.

:::atencao
Overclock de CPU em jogos de luta competitivos pode alterar o *timing* e afetar a justiça de um combo *frame-perfect*. Para jogo casual, sem problema; para campeonato, mantenha 100%.
:::

## A armadilha da versão do romset

O erro mais comum com FBNeo é ter um romset do MAME (ou de uma versão antiga do FBNeo) e esperar que funcione. O log deixa claro o que aconteceu:

```terminal
$ flatpak run org.libretro.RetroArch --verbose 2>&1 | grep -iE "rom|missing|error"
[libretro ERROR] fbneo: mslug ROM set is for a different version
[libretro ERROR] fbneo: expected CRC differs (found xxxxxxxxxx)
```

A solução é sempre a mesma: baixar o romset **correspondente à versão do seu núcleo** (por exemplo, "FBNeo v1.0.0.03 romset"). Usar o DAT da versão errada na verificação vai perpetuar o problema, não resolvê-lo.

```terminal
$ # O DAT correto acompanha a release do FBNeo:
$ ls ~/lab/fbneo/
fbneo-v1.0.0.03.dat
```

Esse `.dat` é o arquivo que a próxima seção usa para verificar e reorganizar os romsets.

## Resumo

- O FBNeo se instala via *Online Updater* e não usa `mame.ini`; a configuração é toda pelas *Core Options*.
- O núcleo procura BIOS em `system/` por padrão, com opção de manter junto às ROMs.
- Modo Neo Geo, BIOS e input de diagnóstico são configurados em *Quick Menu > Options*.
- O overclock de CPU elimina *slowdown* em jogos Neo Geo pesados, mas altera o timing competitivo.
- O romset precisa ser da mesma versão do núcleo FBNeo, indicada no log de inicialização.

## Exercícios

1. Instale o FBNeo, anote a versão exibida no log e confirme que o seu romset corresponde a ela.
2. Configure a UniBIOS via *Core Options*, salve um *Core Override* e acesse o menu de serviço segurando Start durante o jogo.
3. Ative o CPU overclock em 200% em *Metal Slug* e compare a fluidez nas cenas de tela cheia com e sem o overclock.
4. Coloque um `neogeo.zip` na pasta `system/` e outro junto das ROMs, e teste a opção *System Files in Content Directory* ligada e desligada.
5. **Desafio.** Explique por que um romset "MAME merged" baixado em um site genérico costuma falhar no FBNeo mesmo quando o jogo é o mesmo — e proponha o procedimento correto de download e verificação usando o `.dat` da release.