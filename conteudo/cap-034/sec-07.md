Nem todo mundo que conecta o Deck num monitor externo quer escrever um romance ou uma tese. Às vezes a tarefa é abrir um PDF, ler um artigo, destacar parágrafos e fechar. O SteamOS traz o Okular como leitor padrão do KDE, mas o ecossistema de PDFs no Linux vai muito além — do minimalista Evince ao poderoso LibreOffice Draw como editor de páginas. E quando você quer ler um EPUB no Deck, as opções são igualmente boas.

:::objetivos
- Dominar o Okular: anotações, seleção de texto e modo de apresentação
- Conhecer o Evince como alternativa leve para leitura rápida
- Converter documentos para PDF direto do terminal com `libreoffice --headless`
- Abrir EPUBs no Deck com Foliate e Calibre
- Extrair páginas, juntar PDFs e reduzir tamanho com ferramentas de linha de comando
:::

## Okular: o leitor que já veio com o KDE

O Okular é o visualizador padrão do KDE Plasma e já está instalado no modo desktop do SteamOS. Ele lê PDF, EPUB, CBZ (quadrinhos), DJVU, Markdown e até PostScript. Mas lê-los é só metade: o Okular também **anota**.

Abra um PDF, pressione `[[F6]]` para abrir a barra de anotações e escolha entre destaque, sublinhado, nota adesiva ou desenho livre. Todas as anotações são salvas **dentro do próprio PDF** (no padrão PDF annotations) ou, se você preferir, num arquivo separado `.okular.xml` na pasta `~/.local/share/okular/docdata/`.

```terminal
$ okular ~/Documents/artigo-2025.pdf
```

O Okular abre rápido porque não carrega o documento inteiro na memória — ele renderiza sob demanda. Num PDF de 200 páginas, o consumo de RAM fica em torno de 80 MB.

| Atalho | Função |
|---|---|
| `[[Ctrl+1]]` | Modo de navegação (mão) |
| `[[Ctrl+2]]` | Seleção de texto |
| `[[F6]]` | Abre/fecha barra de anotações |
| `[[Ctrl+Shift+S]]` | Salvar como (com anotações incorporadas) |
| `[[Ctrl+L]]` | Modo de apresentação (tela cheia, slides) |

:::dica
No modo de apresentação (`[[Ctrl+L]]`), o Okular esconde barras e avança páginas como slides. Com o Deck conectado a um projetor via dock, você pode apresentar slides em PDF sem precisar de PowerPoint ou Impress — ideal para reuniões rápidas.
:::

## Evince: o minimalista que abre tudo

O Evince (também chamado de "Document Viewer" do GNOME) é o oposto do Okular em filosofia: ele faz uma coisa só e faz rápido. Abrir um PDF de 500 páginas no Evince é instantâneo, e a interface desaparece quase por completo — só a barra de título e os botões de página.

```terminal
$ flatpak install flathub org.gnome.Evince
Looking for matches…

 1) app/org.gnome.Evince/x86_64/stable

        ID                   Branch     Op       Remote      Download
 1. [✓] org.gnome.Evince     stable     i        flathub     < 4,2 MB
```

Quatro megabytes. É o flatpak mais leve de toda a suíte de produtividade deste capítulo. Para leitura linear — abrir, ler, fechar — o Evince é imbatível. Ele também suporta anotações, mas num conjunto bem mais enxuto que o Okular (destacar e adicionar notas de texto, basicamente).

A escolha entre Okular e Evince se resume a isto:

| Critério | Okular | Evince |
|---|---|---|
| Tamanho instalado | ~15 MB (vem com o KDE) | ~4 MB (flatpak) |
| Formatos suportados | PDF, EPUB, CBZ, DJVU, Markdown, PS | PDF, PS, DJVU, TIFF, XPS |
| Anotações | Ricas (adesivo, linha, carimbo, desenho) | Básicas (destaque, nota) |
| Melhor para | Estudo e revisão de documentos | Leitura linear rápida |

Ambos coexistem sem conflito. Instale os dois e use cada um onde brilha.

## Converter qualquer documento para PDF pelo terminal

O LibreOffice instalado como flatpak também expõe uma interface de linha de comando. O comando `--headless` (sem janela) converte documentos em lote:

```terminal
## Converter um único arquivo .odt para PDF:
$ flatpak run --command=libreoffice org.libreoffice.LibreOffice \
    --headless --convert-to pdf ~/Documents/relatorio.odt
convert /home/deck/Documents/relatorio.odt -> /home/deck/Documents/relatorio.pdf

## Converter todos os .docx de uma pasta:
$ flatpak run --command=libreoffice org.libreoffice.LibreOffice \
    --headless --convert-to pdf ~/Documents/projeto/*.docx
convert /home/deck/Documents/projeto/cap1.docx -> /home/deck/Documents/projeto/cap1.pdf
convert /home/deck/Documents/projeto/cap2.docx -> /home/deck/Documents/projeto/cap2.pdf
```

Isso é útil para automação: um script que, toda sexta-feira, converte todos os `.odt` de uma pasta em PDFs arquiváveis. O `--headless` não abre interface gráfica, então roda até no Gaming Mode via SSH — se você tiver ativado o acesso remoto.

## EPUB no Deck: Foliate e Calibre

O Okular abre EPUB, mas a experiência de leitura de livro digital pede um aplicativo especializado. O **Foliate** é o melhor leitor de EPUB para Linux em 2025: paginação contínua ou em colunas, dicionário integrado, tradução inline e modo noturno.

```terminal
$ flatpak install flathub com.github.johnfactotum.Foliate
```

Para gerenciar uma biblioteca inteira de eBooks — converter entre formatos, editar metadados, transferir para um Kindle — o **Calibre** é a ferramenta canônica. Ele é pesado (~300 MB de flatpak), mas insubstituível se você lida com dezenas de livros:

```terminal
$ flatpak install flathub com.calibre_ebook.calibre
```

O Calibre converte entre EPUB, MOBI, AZW3, PDF e uma dúzia de outros formatos, e sua interface de "biblioteca" mostra capas, autores e etiquetas como o Steam mostra jogos — curiosa coincidência num dispositivo que é, antes de tudo, um console.

## PDFs pelo terminal: juntar, partir e comprimir

O SteamOS 3.6 herda do Ubuntu Noble as ferramentas `poppler-utils`, que incluem utilitários de linha de comando para manipular PDFs sem abrir interface gráfica:

```terminal
## Juntar dois PDFs num só:
$ pdfunite parte1.pdf parte2.pdf completo.pdf

## Extrair páginas 5 a 12 de um PDF:
$ pdfseparate -f 5 -l 12 documento.pdf pagina-%d.pdf

## Ver quantas páginas tem um PDF:
$ pdfinfo documento.pdf | grep Pages
Pages:          47

## Reduzir PDF com Ghostscript (comprimir imagens):
$ gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook \
     -dNOPAUSE -dQUIET -dBATCH \
     -sOutputFile=comprimido.pdf original.pdf
$ ls -lh original.pdf comprimido.pdf
-rw-r--r-- 1 deck deck 12M jan 14 14:10 original.pdf
-rw-r--r-- 1 deck deck 2,4M jan 14 14:11 comprimido.pdf
```

A última linha é particularmente útil: um PDF com imagens pesadas encolhe de 12 MB para 2,4 MB sem perda perceptível de qualidade, apenas reduzindo a resolução das imagens para 150 dpi (`/ebook`). Para texto puro, `/screen` comprime ainda mais.

:::perigo
Não use `pdfseparate` ou `pdfunite` para substituir o arquivo original com redirecionamento (`pdfunite a.pdf b.pdf > a.pdf`) — o arquivo de entrada e o de saída não podem ser o mesmo, e você perderá os dados. Sempre escreva a saída num arquivo de nome diferente e renomeie depois.
:::

## Resumo

- O Okular (padrão do KDE) lê PDF, EPUB e CBZ, com anotações salvas dentro do PDF ou em arquivo XML externo.
- O Evince (`org.gnome.Evince`) pesa 4 MB e é imbatível para leitura linear rápida.
- `libreoffice --headless --convert-to pdf` converte documentos em lote sem interface gráfica.
- Foliate (`com.github.johnfactotum.Foliate`) é o melhor leitor de EPUB; Calibre gerencia bibliotecas e converte formatos.
- `pdfunite`, `pdfseparate` e `gs` manipulam PDFs pelo terminal — juntam, partem e comprimem.

## Exercícios

1. Abra um PDF no Okular, destaque três parágrafos, adicione uma nota adesiva e salve. Reabra no Evince: as anotações sobreviveram?
2. Instale o Evince, abra o mesmo PDF e meça o tempo com `time flatpak run org.gnome.Evince arquivo.pdf`. Compare a sensação de leveza com o Okular.
3. Escreva um script de uma linha que converta todos os `.odt` de `~/Documents/` para PDF usando `libreoffice --headless`. Rode e confira os arquivos gerados.
4. Instale o Foliate, abra um EPUB gratuito do Projeto Gutenberg e ajuste o tema para modo noturno. Depois faça o mesmo EPUB abrir no Okular — a paginação é igual?
5. **Desafio.** Pegue um PDF de 50 páginas, extraia as páginas 10–20 com `pdfseparate`, junte-as de volta com `pdfunite` e comprima o resultado com `gs /ebook`. Compare tamanhos e qualidade visual da primeira página do original com a do comprimido.