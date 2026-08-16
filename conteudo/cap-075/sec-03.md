A animação de boot é o vídeo que o Steam Deck exibe entre o momento em que o sistema operacional assume e o menu do Game Mode aparecer. O Animation Changer mostra uma galeria bonita, mas cada item daquela galeria é, na prática, um arquivo de vídeo com um formato específico, uma resolução e um codec. Entender essas três coisas é a diferença entre baixar qualquer tema e conseguir fazer o seu próprio funcionar de primeira.

:::objetivos
- Identificar os formatos de vídeo aceitos pela animação de boot
- Compreender por que WebM e VP9 dominam o ecossistema do Steam Deck
- Ler os metadados de um vídeo de boot com `ffprobe`
- Diferenciar a animação de boot da tela estática de fallback
:::

## Por que WebM

O SteamOS escolhe o **WebM** como formato principal de animação de boot, com o codec **VP9** (e, em alguns casos, VP8). A razão é histórica e prática: WebM é um contêiner de código aberto, sem royalties, que a Valve já adota em outras frentes e que funciona nativamente no ambiente gráfico do deck sem depender de codecs proprietários.

O formato importa porque o gamescope, o compositor que exibe a animação, não tem os mesmos codecs que um navegador comum. Ele lê um conjunto restrito de codecs, e WebM/VP9 está no topo dessa lista. Um MP4 com H.264 pode funcionar, mas não é garantido em todas as versões do SteamOS — por isso a recomendação quase universal é WebM.

```terminal
$ ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate \
    -of default=noprint_wrappers=1 deck_startup.webm
codec_name=vp9
width=1280
height=800
r_frame_rate=60/1
```

O `ffprobe` (parte do projeto FFmpeg) lê os metadados do vídeo sem precisar reproduzi-lo. Na amostra acima: codec `vp9`, resolução `1280×800` (a resolução nativa da tela do deck) e 60 quadros por segundo. Quando uma animação de boot "trava" ou "pisca", o primeiro suspeito é uma dessas três propriedades fora do esperado.

## A resolução importa mais do que parece

A tela do Steam Deck LCD tem resolução nativa de **1280×800**. O modelo OLED tem **1280×800** também (com outra tecnologia de painel). Uma animação de boot em 1920×1080 funciona, mas custa mais para decodificar no momento em que a CPU ainda está subindo serviços e o disco está ocupado. O resultado é o sintoma clássico: a animação começa engasgando e só "engata" quando o boot já terminou.

```terminal
$ ffprobe -v error -select_streams v:0 -show_entries stream=width,height \
    -of csv=p=0 deck_startup.webm
1280,800
```

A regra prática da comunidade: mantenha a animação em **1280×800**, 60 FPS no máximo, e duração entre 1 e 10 segundos. Animações mais longas que o próprio boot não chegam a terminar — o gamescope as corta assim que o menu está pronto.

:::dica
Prefira `1280×800` exato. Vídeos em `1280×720` (16:9) deixam barras pretas no topo e na base, porque a tela é 16:10. A diferença de 80 pixels na vertical é o que separa um tema "bem acabado" de um com faixas visíveis.
:::

## Onde a configuração de boot é registrada

A animação de boot tem um ponto de entrada no sistema que o plugin escreve. Embora o Animation Changer oculte o caminho, você pode inspecioná-lo diretamente:

```terminal
$ ls -la /etc/deck/ 2>/dev/null | grep -i animation
-rw-r--r-- 1 root root  512 Mar  1 12:00 animation.json
```

A configuração é um simples JSON (ou, em versões mais antigas, um trecho num `.vdf`) que aponta para o arquivo de vídeo. A estrutura típica:

```json
{
  "boot": {
    "enabled": true,
    "path": "/home/deck/homebrew/plugins/AnimationChanger/animations/deck_startup.webm",
    "randomize": false
  }
}
```

O campo `path` é o coração de tudo. Ele diz ao SteamOS qual vídeo carregar. O campo `randomize` é uma funcionalidade do plugin: quando ativo, o Animation Changer sorteia um vídeo diferente a cada boot a partir de uma pasta. Isso muda o `path` a cada inicialização.

:::info
Em versões diferentes do SteamOS, o caminho e o formato da configuração mudam. No 3.6 (Noble, a referência do curso), o plugin escreve num arquivo JSON sob `/etc/deck/`. Em releases anteriores, usava um `vdf`. Se você rodar a seção 7 e a animação não trocar, a primeira coisa a conferir é se a versão do plugin bate com a versão do SteamOS.
:::

## Boot estático vs. boot animado

Nem toda personalização de boot precisa ser um vídeo em movimento. O SteamOS também aceita uma imagem estática como splash — útil para quem quer algo discreto e de boot instantâneo. A diferença prática:

| Tipo | Formato | Custo no boot | Uso típico |
|---|---|---|---|
| Animação | WebM (VP9) | Alto (decodifica vídeo) | Logo animado, intros autorais |
| Imagem estática | PNG / JPEG | Baixo (renderiza um frame) | Logo fixo, minimalismo |

A escolha é de gosto, mas tem consequência técnica: um PNG de 1280×800 carrega em milissegundos e libera a CPU na hora. Um WebM de 10 segundos a 60 FPS mantém o decodificador ocupado durante uma fase em que o sistema está competindo por recursos.

```terminal
$ ffprobe -v error -show_entries stream=codec_name,width,height \
    -of default=noprint_wrappers=1 deck_background.png
codec_name=png
width=1280
height=800
```

O mesmo `ffprobe` serve para a imagem: ele reporta `codec_name=png` e as dimensões. Para quem vem de edição de vídeo, vale a regra de ouro: teste o arquivo no deck em boot real antes de distribuir — o comportamento no preview do plugin nem sempre reflete o comportamento no boot completo.

## Validando um vídéo antes de aplicar

Antes de aplicar qualquer tema baixado, vale uma inspeção rápida que evita a frustração de reiniciar e ver tela preta:

```terminal
$ ffmpeg -v error -i tema_baixado.webm -f null -
$ echo $?
0
```

O comando decodifica o vídeo inteiro e descarta a saída (`-f null -`). Se o código de retorno (`$?`) é `0`, o arquivo está íntegro e decodificável. Se der erro, o download veio corrompido ou o codec não é suportado — e o lugar de corrigir é antes do boot, não depois.

## Resumo

- A animação de boot usa WebM com codec VP9, que o gamescope decodifica nativamente.
- A resolução nativa é 1280×800 (16:10); 1280×720 deixa barras pretas.
- `ffprobe` lê codec, resolução e FPS de um vídeo sem reproduzi-lo.
- A configuração de boot aponta para um arquivo via um JSON (ou VDF) sob `/etc/deck/`.
- Uma imagem estática PNG substitui o vídeo com custo de boot muito menor.
- `ffmpeg -v error -i arquivo -f null -` valida a integridade antes de aplicar.

## Exercícios

1. Baixe duas animações de boot da galeria e compare seus metadados com `ffprobe`. Qual a resolução e o codec de cada uma? Alguma delas está fora de 1280×800?
2. Aplique uma animação e localize, com `find`, o arquivo `.webm` correspondente no disco. Confirme o caminho registrado no arquivo de configuração de boot.
3. Usando `ffmpeg`, valide a integridade de uma animação baixada e explique o que o código de retorno `0` significa na prática.
4. Crie uma imagem PNG de 1280×800 com qualquer editor, coloque-a como splash estático, e compare o tempo até o menu aparecer com e sem animação de vídeo. Houve diferença perceptível?
5. **Desafio.** Pegue uma animação WebM que veio em 1920×1080 e reencode-a para 1280×800 com `ffmpeg`, preservando o codec VP9. Verifique o resultado com `ffprobe` e descreva o impacto da mudança no tamanho do arquivo final.