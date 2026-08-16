A tela "Explorar" do Discover não é apenas um mosaico aleatório de aplicativos. Ela é organizada em categorias temáticas que funcionam como uma curadoria editorial: as seções de destaque são mantidas pelo time do KDE e do Flathub, e as categorias técnicas seguem a especificação AppStream do freedesktop.org. Entender essa organização ajuda a descobrir software que você nem sabia que existia — e a entender por que certos aplicativos aparecem onde aparecem.

Categorias bem definidas são um dos fatores que separam uma loja de aplicativos madura de um amontoado de pacotes. O Discover herda essa estrutura do Flathub e a complementa com a curadoria da comunidade KDE.

:::objetivos
- Navegar pelas categorias do Discover e entender sua origem (AppStream)
- Diferenciar curadoria editorial das listas automáticas por categoria
- Identificar aplicativos verificados e sandboxed no Flathub
- Explorar categorias pelo terminal com `flatpak remote-ls` e filtros
:::

## A especificação AppStream

Antes de existir uma loja de aplicativos, distribuições Linux organizavam seus pacotes em seções como "Games", "Development", "Office". Mas cada distribuição usava seus próprios nomes — o Debian chamava "libs" o que o Fedora chamava "System Environment/Libraries". Para unificar isso, surgiu o padrão **AppStream**, mantido pelo freedesktop.org.

O AppStream define uma taxonomia fixa de categorias e subcategorias que todo aplicativo pode declarar em seus metadados. Exemplos:

| Categoria AppStream | Subcategorias típicas |
|---|---|
| `Network` | WebBrowser, Email, FileTransfer, InstantMessaging |
| `AudioVideo` | AudioVideoEditing, Music, Video, TV |
| `Development` | IDE, WebDevelopment, Building, Debugging |
| `Game` | ActionGame, AdventureGame, Simulation, StrategyGame |
| `Office` | WordProcessor, Spreadsheet, Presentation, Finance |
| `Graphics` | 2DGraphics, 3DGraphics, Photography, VectorGraphics |
| `System` | FileManager, Monitor, PackageManager, Emulator |
| `Utility` | TextEditor, Calculator, Archiving, Terminal |

O Discover renderiza essas categorias na tela "Explorar" como seções navegáveis. Um aplicativo que declara `Categories: Network;WebBrowser;` no seu metadado Flatpak vai aparecer na seção "Internet" do Discover.

## A página Explorar no Steam Deck

Ao abrir o Discover e clicar em "Explorar", você vê:

1. **Destaques do editor** — uma fileira horizontal no topo, curada manualmente. São aplicativos que o time do KDE/Flathub considera relevantes para novos usuários: Firefox, LibreOffice, Kdenlive, OBS Studio.

2. **Categorias** — grade de ícones coloridos: "Internet", "Multimídia", "Escritório", "Desenvolvimento", "Jogos", "Gráficos", "Sistema", "Utilitários".

3. **Aplicativos recomendados** — seleção algorítmica baseada em popularidade e avaliações.

Clicar numa categoria leva você a uma página com subcategorias e os aplicativos mais populares daquela área. Em "Multimídia", por exemplo, você encontra subdivisões como "Editores de Vídeo", "Players de Música" e "Streaming".

```terminal
$ flatpak remote-ls flathub --category | head -20
org.gnome.Maps              Maps
org.mozilla.firefox         Firefox
org.libreoffice.LibreOffice LibreOffice
...
```

O `flatpak remote-ls` lista todos os aplicativos de um remote, mas não oferece filtragem nativa por categoria. Para isso, existe o comando `flatpak remote-info` que exibe os metadados completos de um app específico:

```terminal
$ flatpak remote-info flathub org.mozilla.firefox 2>/dev/null | grep categories
categories: Network;WebBrowser;
```

## Aplicativos verificados e o selo do Flathub

O Flathub implementa um sistema de verificação: quando o desenvolvedor oficial do aplicativo é quem publica o pacote (e não um terceiro), o aplicativo ganha um selo azul de verificado — parecido com o checkmark do Twitter ou do GitHub.

No Discover, esse selo aparece na página de detalhes do aplicativo, ao lado do nome. Ele é um indicador importante de confiança: um aplicativo verificado significa que a Mozilla publica o Firefox, a KDE publica o Kdenlive, a OBS Project publica o OBS Studio. Um aplicativo não verificado pode ser perfeitamente seguro e bem mantido, mas o empacotador é um voluntário da comunidade, não o autor original.

```terminal
$ flatpak remote-info flathub org.mozilla.firefox 2>&1 | head -10
        ID: org.mozilla.firefox
       Ref: app/org.mozilla.firefox/x86_64/stable
      Arch: x86_64
    Branch: stable
Collection: org.flathub.Stable
  Download: 74.9 MB
 Installed: 198.5 MB
   Runtime: org.freedesktop.Platform/x86_64/24.08
```

No terminal, não há indicação visual de verificação, mas você pode conferir no site do Flathub: `https://flathub.org/apps/org.mozilla.firefox`.

:::dica
Prefira aplicativos verificados sempre que existir uma alternativa. O selo azul significa que o binário que você está instalando vem diretamente do autor, empacotado por ele, e não de um terceiro que você precisa confiar adicionalmente.
:::

## Curadoria da comunidade KDE

Além das categorias AppStream, o Discover integra o **KDE Store** (antigo "KDE-Look" e "Get Hot New Stuff"). Essa é uma loja separada, mantida pela comunidade, que distribui:

- **Temas do Plasma** — pacotes visuais que mudam painéis, ícones, cursores
- **Widgets (Plasmoids)** — miniaplicativos que rodam no painel ou no desktop
- **Decorações de janela** — bordas, botões e barras de título
- **Papéis de parede** — coleções de wallpapers
- **Scripts do KWin** — extensões que alteram o comportamento do gerenciador de janelas

Para acessar essa curadoria, mude o filtro de fonte para "KDE Store" na busca. O Discover então exibe conteúdo da comunidade KDE, com miniaturas, avaliações e contagem de downloads.

:::atencao
Itens da KDE Store não passam por revisão de segurança automatizada como os Flatpaks do Flathub. Temas e widgets podem conter scripts. Instale apenas de autores com boa reputação e muitas avaliações positivas.
:::

## Resumo

- As categorias do Discover seguem a especificação AppStream do freedesktop.org; cada aplicativo declara suas categorias nos metadados Flatpak.
- A página Explorar mistura curadoria manual (destaques do editor) com listas automáticas por categoria e por popularidade.
- O selo de verificado do Flathub indica que o desenvolvedor oficial publica o pacote; prefira esses aplicativos.
- O KDE Store distribui temas, widgets e scripts da comunidade; não possui a mesma auditoria de segurança dos Flatpaks.
- `flatpak remote-ls flathub` lista todos os aplicativos do remote; `flatpak remote-info` mostra os metadados completos de um app específico.

## Exercícios

1. No Discover, navegue até "Explorar" e anote as 5 categorias principais. Depois, clique em "Jogos" e liste três aplicativos que aparecem por lá — todos são verificados?
2. No terminal, execute `flatpak remote-info flathub org.gimp.GIMP 2>/dev/null | grep categories`. A categoria bate com onde o GIMP aparece no Discover?
3. Filtre o Discover por "KDE Store" e explore a seção de temas do Plasma. Instale um tema (pode ser qualquer um), aplique-o via Configurações do Sistema e depois remova-o. Anote o nome do tema e se a remoção foi limpa.
4. Compare `flatpak remote-ls flathub | wc -l` com o número de aplicativos que você estima ver ao scrollar o Discover na fonte "Flatpak (Flathub)". A quantidade é similar? Por que pode haver diferença?
5. **Desafio.** Escolha um aplicativo **não verificado** do Flathub que você usa ou consideraria usar. Pesquise quem é o mantenedor (`flatpak remote-info flathub <id> | grep -i maintainer` ou no site do Flathub). Depois, leia o manifesto de build no GitHub do pacote (geralmente linkado na página do Flathub). Você confiaria em instalar esse aplicativo? Escreva um parágrafo justificando sua decisão.