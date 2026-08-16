Arcade é o único cenário da emulação em que um único arquivo não basta para jogar. Diferente de um cartucho de console, que você despeja e obtém um `.nes` ou um `.smc` autocontido, um fliperama é um computador proprietário cujo software vinha espalhado por vários chips de ROM, cada um com uma função específica. O resultado é o *romset* — um conjunto de arquivos que, juntos, reconstituem uma placa. Entender o que é um romset e por que ele precisa "casar" com uma versão específica do emulador é a base de tudo que vem depois neste capítulo.

:::objetivos
- Entender o que é um romset e por que ele difere de uma ROM de console
- Reconhecer a função dos diferentes chips dentro de uma placa de arcade
- Explicar o papel do CRC e da versão do romset
- Identificar a estrutura de arquivos de um romset típico em disco
- Relacionar romset, emulador e a necessidade de casar versões
:::

## De uma ROM para um romset

Nos consoles, a mídia é um único chip trocável: o cartucho. O programa inteiro vive ali, e despejá-lo produz um arquivo único. Uma placa de arcade é diferente: ela era fabricada em lotes, atualizada ao longo dos meses por *manutenções* do fabricante, e costumava separar o código do processador dos dados gráficos e de som em chips distintos, cada um com o seu *dump* (a cópia binária do conteúdo do chip).

:::info
Um **dump** é a cópia exata do conteúdo de um chip de memória, feita lendo-o diretamente do hardware. Em arcade, cada chip vira um arquivo separado; o conjunto deles é o romset.
:::

Assim, um único jogo como *Street Fighter II* não é "um arquivo", mas uma pasta contendo várias ROMs — muitas vezes com nome de região ou de tipo de dado.

```terminal
$ ls -1 ~/lab/arcade/sf2.zip | head
sf2_9.12a
sf2_7.12f
sf2-1m.3a
sf2-3m.5a
sf2.6a
```

Repare: as extensões não são `.rom`, mas nomes técnicos como `12a`, `12f`, `3a` — posições na placa. O emulador não se importa com a extensão; ele identifica cada arquivo pelo seu conteúdo, não pelo nome.

## Por que o nome não importa (e o CRC sim)

Quando você renomeia uma ROM de *Street Fighter II* para `qualquer-coisa.zip`, o MAME continua a reconhecendo. Isso acontece porque a identificação é feita por **CRC** (o código de verificação cíclica, uma espécie de "assinatura" de 32 bits calculada sobre os bytes do arquivo) e por **SHA-1**, um hash criptográfico.

O emulador carrega uma tabela interna (o *romset definition*) que diz: "o jogo `sf2` precisa de um arquivo cujo CRC é `X`, outro cujo CRC é `Y`...". Se o byte de qualquer um deles mudar — por exemplo, um dump mal feito ou uma ROM pirateada adulterada — o CRC não confere e o emulador recusa.

```terminal
$ flatpak run org.libretro.RetroArch --verbose 2>&1 | grep -i "sf2"
[libretro INFO] sf2: romset sf2 needs file sf2_9.12a (CRC 3f6a0f6a)
[libretro ERROR] sf2: sf2_9.12a not found or wrong CRC
```

O CRC é o motivo pelo qual **a versão importa tanto** em arcade. A equipe do MAME redumps jogos, corrige dumps antigos e re-organiza os arquivos a cada release; quando isso acontece, o CRC esperado muda. Uma ROM que funcionava no MAME 0.250 pode não funcionar no 0.260.

## Onde os romsets vivem

No RetroArch, cada núcleo de arcade procura as ROMs em uma pasta configurável. O ponto que mais confunde iniciantes é que **o romset deve ficar dentro de um arquivo `.zip`**, com o conteúdo comprimido mas íntegro — o emulador lê o ZIP diretamente, sem extrair.

```terminal
$ ls -la ~/lab/arcade/
drwxr-xr-x  ana  total 0
-rw-r--r--  ana  4.2M  sf2.zip
-rw-r--r--  ana  3.1M  dkong.zip
-rw-r--r--  ana  2.8M  neogeo.zip
```

Cada `.zip` é um romset. O nome do arquivo (antes do `.zip`) precisa bater com o *short name* interno do emulador — `sf2`, `dkong`, `neogeo`. O `neogeo.zip` ali não é um jogo: é a BIOS da família Neo Geo, que entra como dependência dos jogos da placa (assunto da próxima seção).

## Versão do romset versus versão do núcleo

O emparelhamento é a regra de ouro do arcade. O núcleo `mame` do RetroArch corresponde a uma release específica do MAME upstream, e o FBNeo tem o seu próprio ritmo de releases. O romset precisa ser da mesma versão do núcleo, ou os CRCs não batem.

:::atencao
Baixar "a ROM do jogo" em um site aleatório raramente funciona com o núcleo que você instalou. O correto é baixar o **romset completo da versão certa** (por exemplo, o *MAME 0.261 merged*) ou, ao menos, garantir que cada arquivo venha dessa mesma versão.
:::

Uma forma de confirmar a versão que o seu núcleo espera é consultar o próprio emulador na linha de comando.

```terminal
$ flatpak run org.libretro.RetroArch --verbose 2>&1 | grep -i -E "mame|version"
[INFO] mame: MAME 0.261 (libretro)
```

Daqui em diante, tudo o que você fizer com BIOS, formatos merged/split, Neo Geo e CPS depende de dominar essa trinca: **romset, CRC e versão**.

## Resumo

- Um romset é um conjunto de arquivos (um por chip) que reconstitui uma placa, não um arquivo único.
- Cada ROM é identificada por CRC e SHA-1, não pelo nome de arquivo.
- Os romsets ficam em `.zip`, com o *short name* do jogo como nome.
- A versão do romset precisa casar com a versão do núcleo de emulação.
- `neogeo.zip` é uma dependência de BIOS, não um jogo.

## Exercícios

1. Liste o conteúdo de um romset que você tenha com `unzip -l sf2.zip` e identifique, pelos nomes, quais arquivos parecem ser de programa e quais parecem ser de dados gráficos.
2. Calcule o CRC de uma ROM com `cksum` e explique por que uma diferença de um único byte invalidaria o romset.
3. Descubra a versão do núcleo MAME instalado com `flatpak run org.libretro.RetroArch --verbose 2>&1 | grep -i mame` e anote o número da release.
4. Pesquise o *short name* de três jogos que você deseja jogar e confirme que os arquivos `.zip` no seu diretório seguem esse padrão.
5. **Desafio.** Explique, usando o conceito de CRC, por que "atualizar o emulador" sem "atualizar o romset" costuma quebrar jogos que funcionavam antes — e proponha o processo correto para manter os dois em sincronia.
