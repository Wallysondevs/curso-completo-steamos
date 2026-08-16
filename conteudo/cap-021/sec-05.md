Abrir um arquivo para decidir se é o certo — e só então copiá-lo, apagá-lo ou renomeá-lo — é um ciclo repetido centenas de vezes por dia por quem organiza arquivos. O Dolphin ataca esse problema com o painel de pré-visualização, que exibe o conteúdo de um arquivo selecionado sem abrir o aplicativo associado. Para imagens, vídeos, áudios, PDFs e texto, isso poupa segundos preciosos.

:::objetivos
- Ativar o painel de pré-visualização com `[[F11]]` e interpretar seu conteúdo
- Compreender quais tipos de arquivo têm preview nativo e quais dependem de plugins
- Diferenciar pré-visualização de ícones com miniatura de pré-visualização de conteúdo
- Instalar e remover plugins de preview via linha de comando
- Usar o preview para encontrar rapidamente o arquivo correto sem abrir aplicativos
:::

## O painel de informação e preview

O Dolphin tem um painel lateral direito, acionado por `[[F11]]`, que faz duas coisas: mostrar **metadados** do arquivo selecionado (nome, tamanho, tipo, data, permissões) e fazer **preview** do conteúdo. Dependendo do tipo, você vê uma imagem ampliada, o início de um texto, a capa de um PDF ou os controles de um arquivo de áudio.

```terminal
$ dolphin ~/lab
## Selecione uma imagem .png com as setas do teclado
## Pressione F11
## O painel direito mostra metadados (resolução, tamanho) e uma miniatura ampliada
## Selecione um .txt; o painel mostra as primeiras linhas do conteúdo
```

O preview de texto é truncado — você vê as primeiras linhas, o suficiente para identificar o conteúdo sem abrir o arquivo. Para arquivos de código-fonte, a sintaxe não é colorida, mas a quebra de linha e a indentação são preservadas.

```terminal
$ dolphin ~/lab
## Selecione um arquivo de áudio .mp3
## Se o preview de áudio estiver instalado, o painel exibe controles de play/pause
## A arte do álbum (se houver nos metadados ID3) aparece como miniatura
```

A pré-visualização de áudio depende de um pacote extra chamado `kio-audiothumbnail`, e a de vídeo depende dos codecs do sistema. No SteamOS padrão, imagens, texto e PDF são pré-visualizados nativamente; áudio e vídeo podem exigir instalação adicional.

## Miniaturas vs preview

É importante separar dois conceitos que o Dolphin trata de forma distinta. As **miniaturas** (thumbnails) são imagens pequenas que aparecem como ícone do arquivo no modo Ícones — elas são geradas em lote pelo sistema e ficam em cache. O **preview** é sob demanda: só é gerado para o arquivo selecionado no momento e aparece no painel lateral ou numa janela pop-up.

```terminal
$ ls ~/.cache/thumbnails/
fail  large  normal  x-large
```

O diretório `~/.cache/thumbnails/` guarda miniaturas em três tamanhos (`normal`, `large`, `x-large`) e uma pasta `fail` para arquivos cuja miniatura não pôde ser gerada (codec ausente, arquivo corrompido). Isso explica por que alguns arquivos nunca ganham miniatura: o cache registrou uma falha e não tenta de novo até que o cache expire ou seja limpo.

:::dica
Se um arquivo de vídeo ou imagem não exibe miniatura mesmo tendo o codec instalado, limpe o cache com `rm -r ~/.cache/thumbnails/fail/*` e reinicie o Dolphin. O sistema vai tentar gerar a miniatura novamente na próxima exibição da pasta.
:::

## Plugins de preview

O preview do Dolphin é extensível por plugins da KDE Frameworks. Cada tipo de arquivo que tem preview é coberto por um módulo específico, instalado como pacote do sistema.

```terminal
$ pacman -Ss kde-thumbnailer
extra/kde-thumbnailer-exr 24.12.2-1
    EXR thumbnailer for KDE
extra/kde-thumbnailer-ffmpeg 24.12.2-1
    FFmpeg-based thumbnailer for KDE
extra/kde-thumbnailer-openexr 24.12.2-1
    OpenEXR thumbnailer for KDE
```

No SteamOS (base Arch), os thumbnailers são prefixados `kde-thumbnailer-`. O pacote `kde-thumbnailer-ffmpeg` é o que habilita miniaturas e preview de praticamente qualquer formato de vídeo suportado pelo FFmpeg. Para instalá-lo:

```terminal
$ sudo pacman -S kde-thumbnailer-ffmpeg
```

Após a instalação, reinicie o Dolphin e os arquivos de vídeo passam a exibir miniatura e preview no painel. O mesmo vale para formatos exóticos como EXR (imagens de alto alcance dinâmico), que dependem de `kde-thumbnailer-openexr`.

:::info
No SteamOS, os pacotes do KDE vêm pré-instalados como parte da base Plasma. Miniaturas de imagem (PNG, JPEG, GIF, WebP) e texto funcionam sem qualquer instalação extra. Apenas formatos de mídia (áudio, vídeo) e formatos especializados (RAW de câmera, EXR, PSD) podem exigir pacotes adicionais.
:::

## Preview sem o painel lateral

Existe uma forma ainda mais rápida de pré-visualizar um arquivo: selecione-o e pressione `[[Ctrl+Shift+P]]`. Isso abre uma janela flutuante de preview que ocupa o centro da tela e fecha com `[[Esc]]`. É mais rápido que o painel lateral porque não redesenha a janela inteira — apenas sobrepõe o conteúdo.

```terminal
$ dolphin ~/lab
## Selecione um arquivo com as setas
## Pressione Ctrl+Shift+P
## O preview abre em janela flutuante
## Esc para fechar
```

A janela de preview flutuante exibe o mesmo conteúdo do painel, mas em tamanho maior e com menos distrações. Para imagens, ela mostra a imagem em resolução quase cheia; para PDFs, renderiza a primeira página; para vídeos, exibe um frame inicial com botão de reprodução.

## Resumo

- `[[F11]]` abre o painel lateral de informação, que mostra metadados e preview do arquivo selecionado.
- Miniaturas são geradas em lote e cacheadas em `~/.cache/thumbnails/`; o preview é sob demanda para o arquivo selecionado.
- O cache de falhas (`~/.cache/thumbnails/fail/`) armazena arquivos cuja miniatura não pôde ser gerada e impede novas tentativas até a limpeza.
- `kde-thumbnailer-ffmpeg` habilita preview de vídeo para a maioria dos formatos suportados pelo FFmpeg.
- `[[Ctrl+Shift+P]]` abre o preview em janela flutuante, fechável com `[[Esc]]`.

## Exercícios

1. No Dolphin, navegue até uma pasta com imagens e pressione `[[F11]]`. Selecione cada imagem com as setas e observe como o preview muda. Que metadados aparecem além da imagem?
2. Execute `ls ~/.cache/thumbnails/` e liste os arquivos dentro de `normal` e `large`. Escolha um, copie para `~/lab` com extensão `.png` e veja se o Dolphin reconhece o thumbnail cru como imagem.
3. Verifique se o `kde-thumbnailer-ffmpeg` está instalado com `pacman -Q | grep kde-thumbnailer`. Se não estiver, veja que tipos de vídeo ainda geram miniatura sem ele.
4. Selecione um arquivo de texto e pressione `[[Ctrl+Shift+P]]`. Compare a janela flutuante com o painel `[[F11]]`: qual mostra mais conteúdo? Qual é mais rápida de abrir e fechar?
5. **Desafio.** Gere um arquivo de vídeo curto de teste (use `ffmpeg` se disponível ou baixe um pequeno), limpe o cache `~/.cache/thumbnails/fail/`, abra a pasta e veja se a miniatura aparece. Caso não apareça, instale `kde-thumbnailer-ffmpeg` e repita.