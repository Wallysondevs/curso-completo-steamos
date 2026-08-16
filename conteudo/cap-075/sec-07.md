A galeria de temas é vasta, mas nenhum deles é exatamente o que você queria. A cor não bate, a duração é longa demais, ou você simplesmente quer um vídeo que ninguém mais tem. Criar a própria animação de boot no Steam Deck é mais um exercício de FFmpeg do que de ilustração, e esta seção cobre o pipeline completo: do vídeo ou imagem que você já tem até o `.webm` pronto, integrado e funcionando no boot do deck.

:::objetivos
- Converter qualquer vídeo para o formato WebM/VP9 otimizado para o Steam Deck
- Redimensionar, cortar e ajustar FPS com `ffmpeg`
- Criar uma animação de boot a partir de uma imagem estática (ken burns reverso)
- Emitir uma animação de boot e uma de suspend autorais
:::

## O pipeline de criação

Criar uma animação de boot autoral segue cinco etapas, independente do material de partida:

1. **Escolher a fonte** — um vídeo, uma imagem, uma sequência de frames.
2. **Redimensionar para 1280×800** — a resolução nativa da tela.
3. **Definir duração e FPS** — entre 2 e 10 segundos a 30 ou 60 FPS.
4. **Codificar em VP9** — o codec que o gamescope entende nativamente.
5. **Empacotar em WebM** — e copiar para a pasta de temas.

Os passos 2 a 5 são um único comando `ffmpeg`, e é nele que se gasta o tempo de aprendizado. O resto é decisão criativa.

```terminal
$ ffmpeg -i fonte.mp4 \
    -vf "scale=1280:800:force_original_aspect_ratio=increase,crop=1280:800" \
    -c:v vp9 -b:v 2M -r 30 -an \
    -t 5 meuboot.webm
```

Vamos dissecar o comando. `-i fonte.mp4` é a entrada. `-vf` aplica dois filtros: `scale` redimensiona o vídeo para caber em 1280×800 preservando proporção (barra aparecerá se o aspect ratio não bater, e o `crop` seguinte corta o excesso). `-c:v vp9` seleciona o codec VP9. `-b:v 2M` fixa o bitrate de vídeo em 2 Mbps — qualidade suficiente sem gerar arquivos imensos. `-r 30` força 30 FPS. `-an` remove o áudio (boot não tem som separado). `-t 5` limita a 5 segundos de duração.

## Escolhendo FPS e bitrate

A escolha entre 30 FPS e 60 FPS é prática, não ideológica:

| Parâmetro | A favor | Contra |
|---|---|---|
| 30 FPS | Arquivo menor, decodificação mais leve | Menos fluido em animações rápidas |
| 60 FPS | Animação suave, nativa do display | Arquivo maior, CPU mais ocupada no boot |

Para uma animação de logo com fade-in suave, 30 FPS é suficiente. Para um vídeo com movimentos rápidos de câmera, 60 FPS faz diferença. A regra de bolso: se você tem que perguntar, use 30.

O bitrate (`-b:v`) é um trade-off direto entre qualidade e tamanho:

```terminal
$ ffmpeg -i fonte.mp4 -c:v vp9 -b:v 1M -r 30 -an -t 5 boot_1mbps.webm
$ ffmpeg -i fonte.mp4 -c:v vp9 -b:v 3M -r 30 -an -t 5 boot_3mbps.webm
$ ls -lh boot_*.webm
-rw-r--r-- 1 deck deck 1.2M Mar  1 12:00 boot_1mbps.webm
-rw-r--r-- 1 deck deck 3.5M Mar  1 12:00 boot_3mbps.webm
```

1 Mbps gera ~1,2 MB para 5 segundos; 3 Mbps gera ~3,5 MB. Para a tela de 7 polegadas do deck, 1,5–2 Mbps é o ponto doce. Acima disso, o arquivo cresce sem ganho visual perceptível naquele painel pequeno.

:::dica
Se sua animação tem áreas escuras grandes (comum em logos sobre fundo preto), o VP9 em baixo bitrate pode gerar banding — faixas visíveis entre tons escuros. Isso não é defeito do `ffmpeg`, é compressão insuficiente. Para resolver, suba o bitrate ou aplique o filtro `gradients` se disponível na sua build.
:::

## De uma imagem estática a uma animação

O caso mais comum: você tem um PNG bonito e quer que ele seja o boot animado. O `ffmpeg` pode gerar um vídeo a partir de uma única imagem com movimento de câmera lento (o "efeito Ken Burns"):

```terminal
$ ffmpeg -loop 1 -i meu_logo.png \
    -vf "scale=1280:800:force_original_aspect_ratio=increase,crop=1280:800,zoompan=z='min(zoom+0.001,1.1)':d=150:s=1280x800:fps=30" \
    -c:v vp9 -b:v 2M -r 30 -an -t 5 boot_image.webm
```

O filtro `zoompan` faz um zoom lento na imagem (de 1× até 1.1× em 5 segundos). O parâmetro `d=150` controla quantos frames dura o efeito (`30 FPS × 5 s = 150 frames`). Para uma animação mais simples, sem zoom:

```terminal
$ ffmpeg -loop 1 -i meu_logo.png \
    -vf "scale=1280:800:force_original_aspect_ratio=increase,crop=1280:800" \
    -c:v vp9 -b:v 1M -r 30 -an -t 3 boot_simples.webm
```

Aqui não há `zoompan` — é só a imagem estática convertida em 3 segundos de vídeo. A decodificação é mínima: o VP9 trata cada frame como o mesmo e comprime agressivamente. Um PNG de 800 KB vira um WebM de 200 KB.

## Criando a animação de suspend

O mesmo pipeline serve para suspend, com o lembrete que a duração precisa ser curta (2–3 segundos) para o canal de dormir:

```terminal
$ ffmpeg -i fonte.mp4 \
    -vf "scale=1280:800:force_original_aspect_ratio=increase,crop=1280:800" \
    -c:v vp9 -b:v 2M -r 30 -an -t 2 sleep.webm
```

A diferença principal está no `-t 2` (2 segundos) e no nome do arquivo (`sleep.webm`). Fora isso, o pipeline de encode é idêntico — o mesmo conhecimento se aplica aos dois canais.

## Instalando a animação no deck

Com o `.webm` pronto, o último passo é colocá-lo no lugar. Você pode usar o próprio Animation Changer (ele tem uma opção "Importar" em algumas versões) ou fazer a cópia manual:

```terminal
$ cp meuboot.webm ~/homebrew/plugins/AnimationChanger/animations/deck_startup.webm
$ cp sleep.webm ~/homebrew/plugins/AnimationChanger/animations/sleep.webm
```

Depois da cópia, reinicie o deck ou use a opção "Test Boot Animation" no plugin para conferir. Se o vídeo não carrega (tela preta no boot), o diagnóstico é sempre o mesmo: valide com `ffprobe`, confira o codec (`vp9`), a resolução (`1280×800`) e a integridade com `ffmpeg -v error -i arquivo -f null -`.

:::perigo
Antes de substituir o `deck_startup.webm` atual, faça uma cópia de segurança. Se sua animação falhar e o arquivo original estiver perdido, o SteamOS mostra uma tela preta no boot — não é dano permanente, mas é desagradável e requer boot em modo desktop para consertar:

```terminal
$ cp ~/homebrew/plugins/AnimationChanger/animations/deck_startup.webm \
     ~/backup_deck_startup.webm.bak
```
:::

## Resumo

- O pipeline completo: fonte → redimensionar 1280×800 → VP9 → WebM → copiar para `animations/`.
- O comando `ffmpeg` faz tudo em uma linha: resize, crop, encode, e empacotamento.
- 30 FPS e 1,5–2 Mbps de bitrate são o ponto doce para a tela de 7 polegadas do deck.
- Uma imagem estática vira animação com `zoompan` (movimento de câmera) ou apenas como vídeo estático.
- Suspensão pede vídeos de 2–3 segundos (`-t 2`); boot aceita mais.
- Sempre faça backup do `deck_startup.webm` atual antes de instalar o seu.

## Exercícios

1. Pegue um vídeo qualquer (MP4 comum) e converta-o para WebM/VP9 a 30 FPS, 1280×800, bitrate 2 Mbps. Valide com `ffprobe` e compare tamanhos.
2. A partir de um PNG de 1280×800, crie uma animação de boot de 5 segundos com efeito `zoompan` sutil. Teste a animação com `pw-play` (só para ver se o vídeo foi gerado) e depois instale-a no deck.
3. Crie duas versões da mesma animação: uma a 30 FPS e outra a 60 FPS. Compare o tamanho dos arquivos e a percepção de fluidez no boot real do deck.
4. Crie uma animação de suspend (`sleep.webm`) de 2 segundos a partir de uma imagem PNG, instale-a e confirme que o vídeo aparece por completo antes de o deck dormir.
5. **Desafio.** Crie um script que receba um vídeo qualquer, converta para boot e suspend em uma única execução, e instale ambos nos caminhos corretos, fazendo backup dos originais primeiro. Teste o script com três fontes diferentes.