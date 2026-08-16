O Obsidian é o campeão de popularidade, mas o formato que ele usa é puro Markdown — e nisso ele não está sozinho. O Joplin e o Zotero resolvem duas outras necessidades complementares: notas com sincronização via nuvem que funcionam em qualquer plataforma, e referências bibliográficas acadêmicas que o Obsidian sozinho não gerencia bem. Ambos estão disponíveis como flatpaks e rodam no Steam Deck sem atritos.

:::objetivos
- Instalar o Joplin e entender seu modelo de notas sincronizadas
- Comparar Joplin e Obsidian quanto à filosofia de armazenamento
- Instalar o Zotero e conectar ao LibreOffice Writer
- Inserir citações e gerar bibliografia automaticamente no Deck
- Conhecer o Zettlr como alternativa híbrida entre notas e referências
:::

## Joplin: notas com sincronização embutida

O Joplin nasceu como alternativa open source ao Evernote, e sua premissa é clara: você cria cadernos (notebooks) com notas dentro, tudo encriptado opcionalmente, e sincroniza via OneDrive, Nextcloud, WebDAV ou o serviço pago Joplin Cloud. Diferentemente do Obsidian, as notas não são arquivos Markdown soltos — elas vivem num banco SQLite local e, quando exportadas, viram uma pasta de `.md` com subpastas.

```terminal
$ flatpak install flathub net.cozic.joplin_desktop
Looking for matches…

 1) app/net.cozic.joplin_desktop/x86_64/stable

net.cozic.joplin_desktop permissions:
    ipc       network       x11       wayland       dri

        ID                              Branch    Op     Remote      Download
 1. [✓] net.cozic.joplin_desktop        stable    i      flathub     < 112,3 MB
```

O fluxo no Deck é quase idêntico ao do Obsidian: escreva em Markdown, use `[]()` para links, três crases para código. A interface é dividida em três colunas (cadernos → lista de notas → editor), o que funciona bem no monitor externo 1080p.

A principal diferença filosófica:

| Característica | Obsidian | Joplin |
|---|---|---|
| Armazenamento | Arquivos `.md` soltos na pasta | Banco SQLite + recursos em subpastas |
| Sincronização | Você providencia (Syncthing, Git) | Embutida (OneDrive, Nextcloud, etc.) |
| Links | `[[wiki]]` com backlinks automáticos | Links Markdown tradicionais |
| Criptografia | A do sistema de arquivos | End-to-end via opção de encriptação |
| Plugins | Ecossistema enorme e ativo | Menor, mas com temas e web clipper |

:::dica
Se você já tem notas no Evernote, o Joplin importa arquivos `.enex` nativamente: **File → Import → Evernote Export File**. É a rota de migração mais suave de um aplicativo proprietário para uma pilha open source no Deck.
:::

## O web clipper do Joplin

Um recurso que o Obsidian não tem de fábrica é o **web clipper** — uma extensão de navegador que captura páginas inteiras como Markdown, preservando imagens e formatação básica. No Firefox do Deck (ou no Chrome via flatpak), instale a extensão "Joplin Web Clipper" e configure-a para apontar para o aplicativo local.

```terminal
$ flatpak run net.cozic.joplin_desktop
```

Com o Joplin aberto, o web clipper envia a página diretamente para o caderno escolhido. A captura simplificada (sem anúncios, barras laterais e scripts) é o que torna o recurso útil para pesquisa — você coleciona fontes que permanecem legíveis mesmo offline.

Ele também funciona em modo de serviço silencioso:

```terminal
$ flatpak run net.cozic.joplin_desktop --headless
```

Nesse modo o Joplin escuta requisições do clipper sem abrir a janela principal. Útil se seu monitor externo já está ocupado e você só quer capturar páginas enquanto navega.

## Zotero: referências que o Writer entende

O Zotero é o padrão de fato para gestão de referências acadêmicas no Linux. Ele armazena metadados de artigos, livros e páginas web, captura PDFs associados e — crucialmente — insere citações no LibreOffice Writer e gera a bibliografia formatada automaticamente.

```terminal
$ flatpak install flathub org.zotero.Zotero
Looking for matches…

 1) app/org.zotero.Zotero/x86_64/stable

org.zotero.Zotero permissions:
    ipc       network       x11       dri

        ID                        Branch      Op       Remote      Download
 1. [✓] org.zotero.Zotero         stable      i        flathub     < 98,4 MB
```

Depois de instalar, você precisa de dois passos extras que não estão na instalação:

1. Instalar o conector do Zotero para Firefox (ou Chrome). É a extensão que, com um clique, captura os metadados do artigo que você está lendo.
2. Instalar a extensão do Zotero para LibreOffice. No Zotero: **Edit → Preferences → Cite → Word Processors → Install LibreOffice Add-in**. Se o botão não funcionar pelo Flatpak, rode manualmente:

```terminal
$ flatpak run --command=zotero org.zotero.Zotero
```

Dentro do Zotero, reinstale o plugin do Writer. Depois de reiniciar o LibreOffice, a barra de ferramentas do Zotero aparece com botões para **Add/Edit Citation** e **Add/Edit Bibliography**.

:::atencao
A comunicação entre o Zotero (Flatpak) e o LibreOffice (Flatpak) pode precisar de um ajuste de sandbox. Se o plugin não carregar, verifique se ambos os flatpaks têm permissão de `--filesystem=home` com `flatpak override --user --filesystem=home org.zotero.Zotero`. No SteamOS 3.6 essa configuração já costuma vir como padrão, mas vale confirmar.
:::

## Citando no Writer com o Zotero ativo

Com um artigo importado no Zotero (via web connector ou arrastando um PDF), vá ao Writer, clique em **Add Citation** e digite o nome do autor ou o título. O Zotero busca na sua biblioteca e insere a citação no estilo escolhido (ABNT, APA, Vancouver, etc.). No fim do documento, **Add Bibliography** gera a lista completa, já formatada.

O formato é configurável em **Edit → Preferences → Cite → Styles → Style Manager**. Baixe o estilo ABNT (NBR 10520/6023) pesquisando por "ABNT" no repositório de estilos — ele é mantido pela comunidade e cobre teses, artigos e capítulos de livro.

```terminal
## Seu diretório do Zotero com a biblioteca:
$ ls ~/Zotero/
data/   locate/   pipes/   storage/   styles/
$ ls ~/Zotero/storage/ | head -5
3F8AK2MQ/  7J1BN9K4/  9XQPR5WV/  AB12CD34/  EF56GH78/
```

Os PDFs ficam em `storage/`, cada um numa subpasta com nome aleatório de 8 caracteres. Você nunca precisa abrir essas pastas manualmente: o Zotero gerencia tudo pela interface.

## Zettlr: o meio-termo para quem escreve artigos

Se você acha o Obsidian bom para notas e o Zotero bom para referências, o Zettlr junta os dois num único aplicativo: ele escreve Markdown, linka notas como wiki, e se conecta ao Zotero para inserir citações com `[@autorAno]`. É o editor preferido de quem escreve teses e dissertações em Markdown que depois serão convertidas para LaTeX ou Word.

```terminal
$ flatpak install flathub com.zettlr.Zettlr
```

No Deck, o Zettlr faz sentido se você está na fase de escrita de um trabalho acadêmico longo — a combinação de notas Zettelkasten (o método de cartões interligados que deu nome ao aplicativo) com citações automáticas do Zotero é única no ecossistema open source. Para o dia a dia de notas soltas, o Obsidian ou o Joplin são mais leves.

## Resumo

- Joplin (`net.cozic.joplin_desktop`) oferece sincronização nativa com nuvem e criptografia E2E; suas notas vivem num banco SQLite.
- O web clipper do Joplin captura páginas como Markdown, recurso que o Obsidian não tem nativamente.
- Zotero (`org.zotero.Zotero`) é o gestor de referências que insere citações no LibreOffice Writer e formata bibliografia.
- O plugin do Zotero para Writer adiciona botões de "Add Citation" e "Add Bibliography" diretamente na interface do Writer.
- Zettlr (`com.zettlr.Zettlr`) une notas estilo wiki com citações do Zotero, ideal para textos acadêmicos longos.

## Exercícios

1. Instale o Joplin, sincronize com um serviço de nuvem (Nextcloud ou OneDrive) e capture uma página da Wikipedia com o web clipper. Verifique se as imagens foram preservadas.
2. Crie uma nota no Joplin e localize o arquivo correspondente no banco SQLite (dica: o banco fica em `~/.var/app/net.cozic.joplin_desktop/`). Por que o Joplin escolheu banco em vez de arquivos soltos?
3. Instale o Zotero, capture 3 artigos do Google Scholar com o conector do Firefox e insira citações deles num documento do Writer.
4. Troque o estilo de citação para ABNT e regere a bibliografia. As referências mudaram de ordem e formato?
5. **Desafio.** Instale o Zettlr, conecte-o ao Zotero e escreva um mini-artigo de 2 parágrafos com 3 citações. Exporte para PDF via Pandoc (que o Zettlr chama internamente) e para `.odt`. Compare o resultado dos dois formatos.