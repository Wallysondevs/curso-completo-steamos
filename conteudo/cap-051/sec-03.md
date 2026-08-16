Tudo no SRM gira em torno do parser: é ele que decide quais arquivos são jogos, a qual plataforma pertencem e qual comando deve lançá-los. Sem entender o parser, você fica refém das configurações prontas e não consegue nem diagnosticar uma ROM que não aparece, nem criar suporte para uma plataforma nova. Esta seção abre a caixa-preta e mostra exatamente o que um parser faz, campo por campo.

:::objetivos
- Entender o que é um parser e qual problema ele resolve
- Identificar os três blocos de um parser: fonte, casamento e comando
- Usar glob para casar extensões e nomes de ROM
- Montar o comando de lançamento com placeholders do SRM
- Testar um parser isoladamente antes de aplicá-lo
:::

## A anatomia de um parser

Um parser responde a três perguntas sobre cada arquivo que o SRM encontra numa pasta:

1. **Este arquivo é um jogo?** — decidido pelo padrão de casamento (`glob`, no jargão técnico, um padrão de nome de arquivo).
2. **De qual plataforma ele é?** — uma etiqueta que herda o nome do emulador e, indiretamente, o conjunto de arte.
3. **Como eu o lanço?** — o comando completo a ser gravado no atalho do Steam.

Na interface do SRM, cada parser é uma caixa com dezenas de campos, mas a esmagadora maioria deles pertence a esses três blocos. O restante são opções de apresentação (que título mostrar, que categoria usar) e de automação de arte.

Um parser "preenchido" para SNES, por exemplo, diz em essência: *"todo arquivo `.sfc`, `.smc` ou `.fig` dentro da pasta de ROMs de SNES é um jogo de Super Nintendo, e o comando para lançá-lo é `retroarch -L cores/snes9x_libretro.so "<arquivo>"`"*.

## O bloco de casamento: glob

O SRM usa **glob** para casar arquivos, não expressão regular. Glob é o mesmo mecanismo do shell: `*` casa qualquer sequência de caracteres, `?` casa um caractere, e `[abc]` casa um de um conjunto. É mais simples que regex e, para o trabalho de "achar arquivos por extensão", é exatamente o que se precisa.

Os padrões de glob mais comuns em parsers de ROM:

| Glob | O que casa |
|---|---|
| `*.sfc` | qualquer arquivo `.sfc` diretamente na pasta |
| `*.{sfc,smc,fig}` | uma das três extensões, em qualquer base |
| `**/*.sfc` | `.sfc` também em subpastas (recursivo) |
| `*.zip` | ROMs comprimidas em ZIP |

```terminal
$ ls ~/Emulation/roms/snes/
Super Mario World.sfc  Zelda - A Link to the Past.sfc  F-Zero.smc
```

Um parser com glob `*.{sfc,smc}` casa os três arquivos acima. Repare que o nome-base vira o título provisório do jogo: "Super Mario World", "Zelda - A Link to the Past" e "F-Zero". Essa transformação de "arquivo de ROM" em "título de jogo" é a primeira mágica visível do parser.

:::nota
O SRM também aceita **regex** em campos específicos (geralmente para limpar o título ou filtrar versões regionais), mas o casamento primário de arquivo é sempre por glob. Não confunda: glob acha o arquivo, regex lapida o nome depois.
:::

## O bloco de comando e os placeholders

O campo mais crítico do parser é o **executable** e os **argumentos**. É aqui que você monta a linha que o Steam vai executar. Para não ter que escrever um comando por jogo, o SRM oferece placeholders — pedaços de texto que ele substitui pelo valor real de cada jogo na hora de gerar o atalho.

Os placeholders mais usados:

| Placeholder | O que vira |
|---|---|
| `${filePath}` | caminho absoluto completo da ROM |
| `${fileName}` | nome do arquivo, sem caminho |
| `${title}` | o título processado do jogo |
| `${os:pwd}` | diretório de trabalho do parser |
| `${retroarchPath}` | caminho do executável do RetroArch |

Um comando típico de RetroArch para SNES fica assim no campo de argumentos:

```text
-L ${retroarchPath}/cores/snes9x_libretro.so "${filePath}"
```

Quando o SRM processa a ROM `Super Mario World.sfc`, o trecho `${filePath}` é substituído pelo caminho completo, e o atalho gravado vira:

```text
/home/deck/.var/app/org.libretro.RetroArch/config/retroarch/cores/snes9x_libretro.so "/home/deck/Emulation/roms/snes/Super Mario World.sfc"
```

A combinação de *caminho fixo do core* + *placeholder da ROM* é o que permite um único parser servir para centenas de jogos.

## Plataforma e emulador

O terceiro pilar é a **especificação da plataforma/emulador**. Ela não muda o comando diretamente, mas determina:

- Quais **categorias** o SRM sugere no Steam (a "coleção" de atalhos).
- Qual **fonte de arte** padrão é consultada (por plataforma, não por jogo).
- Que **ícone** e **cor** identificam aquela coleção.

Dois parsers podem apontar para o mesmo RetroArch mas com cores diferentes (SNES e Mega Drive), só para que a biblioteca fique visualmente separada. É um detalhe cosmético, mas é o que faz a diferença entre uma biblioteca organizada e uma sopa de atalhos.

```text
Runner: RetroArch
Core:    snes9x
Category: SNES
```

O campo *runner* indica qual emulador executa; o *core* indica qual módulo dentro do RetroArch; a *categoria* é o rótulo no Steam.

## Testando um parser isoladamente

O SRM deixa você testar a varredura sem gravar nada. Depois de configurar um parser novo, rode o **parse** e confira, na aba de preview, se o número de jogos encontrados bate com o número de ROMs na pasta:

```terminal
$ ls ~/Emulation/roms/snes/*.sfc | wc -l
3
```

Se a pasta tem três ROMs `.sfc` mas o preview mostra zero, o problema está no glob — provavelmente o caminho da fonte está errado ou a extensão não casa. Se mostra cinco, o glob está casando arquivos extras (como patches `.sfc` de tradução ou arquivos de conversão) que você precisa filtrar.

:::atencao
Um erro clássico é apontar a fonte do parser para a pasta errada. No EmuDeck as ROMs ficam em `~/Emulation/roms/<plataforma>`, e cada parser aponta para a subpasta da *sua* plataforma. Apontar o parser de SNES para `~/Emulation/roms/` (a raiz) faz o glob `*.sfc` não casar nada, porque os arquivos estão um nível abaixo.
:::

## Resumo

- Um parser decide se um arquivo é jogo, de qual plataforma e qual comando o lança.
- O casamento de arquivo é feito por glob (`*.sfc`, `*.{sfc,smc}`, `**/*.sfc`), não por regex.
- O comando de lançamento é montado com placeholders como `${filePath}`, `${title}` e `${retroarchPath}`.
- Um único parser serve para muitas ROMs porque o placeholder é substituído por jogo.
- Plataforma/emulador controla categoria, fonte de arte e cor da coleção, não o comando.
- Testar o parse isoladamente (sem gravar) é a forma de validar glob e contagem de ROMs.

## Exercícios

1. Crie um parser para SNES com glob `*.{sfc,smc,fig}` apontando para a pasta correta. Rode o parse e confirme a contagem contra `ls | wc -l`.
2. Altere o glob para `**/*.{sfc,smc}` e observe quantos arquivos a mais aparecem (ROMs em subpastas). Explique a diferença.
3. No campo de argumentos, monte o comando `-L "<core>" "${filePath}"` e inspecione no preview o comando completo de um jogo específico.
4. Mude o nome da categoria do parser e verifique, ainda no preview, se o rótulo de coleção muda junto.
5. **Desafio.** Adicione um padrão `*.zip` no glob do mesmo parser e veja o que o SRM propõe como título para um ZIP. Depois, proponha uma razão para preferir ou evitar ROMs zipadas no seu caso, considerando que nem todo emulador lê ZIP nativo.
