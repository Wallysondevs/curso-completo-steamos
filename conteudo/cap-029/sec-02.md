A tela inicial do Discover no Steam Deck exibe uma grade de aplicativos em destaque — navegadores, editores, utilitários — mas a verdadeira força da ferramenta está na barra de busca. Em poucos caracteres você filtra um catálogo com milhares de entradas, e o Discover responde com ícones, descrições e avaliações. Saber usar bem a busca é a diferença entre perder cinco minutos scrollando e achar o que precisa em cinco segundos.

A busca do Discover não faz uma consulta textual simples. Ela usa o backend do Flathub (e, se disponível, do KNS) para casar o termo digitado contra nomes, descrições, categorias e palavras-chave. O resultado é ordenado por relevância, e cada entrada mostra o ícone do aplicativo, o nome, uma nota de avaliação e a fonte de onde ele vem.

:::objetivos
- Dominar a busca textual do Discover com termos em inglês e português
- Filtrar resultados por fonte (Flatpak, sistema, KDE)
- Reconhecer os metadados de cada entrada: nota, tamanho, versão, fonte
- Comparar a busca do Discover com `flatpak search` no terminal
:::

## Como o Discover resolve a busca

Quando você digita "firefox", o Discover não está varrendo uma lista local de pacotes. Ele consulta os metadados que o Flatpak baixou do Flathub na última atualização do catálogo. Esses metadados incluem:

- **Nome** (display name) — o nome legível, como "Firefox"
- **ID da aplicação** — o identificador reverso, como `org.mozilla.firefox`
- **Resumo** — uma frase curta de descrição
- **Categorias** — tags como `Network`, `WebBrowser`, `Office`
- **Avaliações** — notas dadas por usuários do Flathub (que podem ser habilitadas no Discover)

O Discover normaliza a busca: "firefox", "Firefox", "FIREFOX" e "fİrefox" produzem o mesmo resultado. Ele também faz busca por substring, então "fox" traria Firefox, LibreWolf e até FoxyProxy, se estiverem no catálogo. Mas a busca não é semântica — digitar "navegador" não vai necessariamente trazer o Firefox se a palavra não aparecer nos metadados em português. Prefira usar o nome do aplicativo em inglês para resultados mais previsíveis.

```terminal
$ flatpak search firefox
Firefox          org.mozilla.firefox        stable  flathub
LibreWolf        io.gitlab.librewolf-community stable  flathub
FoxyProxy        org.getfoxyproxy.FoxyProxy stable  flathub
```

A mesma busca no terminal, com `flatpak search`, retorna o identificador exato e o remote de origem. Compare com o Discover: os três aplicativos apareceriam na mesma ordem, mas o Discover exibe ícones, descrições e a nota.

## Filtrando pela fonte

No Discover, abaixo da barra de busca, há um seletor de fonte que permite restringir os resultados. As opções típicas no SteamOS são:

- **Todas as fontes** — padrão; inclui Flatpak e complementos KDE
- **Flatpak (Flathub)** — apenas aplicativos do Flathub
- **KDE Store** — complementos, temas, widgets

Filtrar por Flatpak é útil quando você quer instalar um aplicativo de fato e não quer ver temas na lista. Filtrar por KDE Store é útil quando você quer personalizar a aparência do Plasma sem poluir os resultados com navegadores e suítes de escritório.

No terminal, você pode emular essa filtragem com:

```terminal
$ flatpak search --columns=name,description,application gimp
GIMP            Create images and edit photographs
Glimpse         A photo and image editing application based on GNU Image Manipulation Program
```

O parâmetro `--columns` permite selecionar quais campos aparecem. No Discover, essa informação aparece visualmente distribuída nos cards de resultado: nome, descrição, avaliação com estrelas e um botão "Instalar".

:::dica
Se você sabe exatamente o que quer instalar, abra o Discover e cole o identificador direto na busca: `org.videolan.VLC`, `com.obsproject.Studio`, `org.libreoffice.LibreOffice`. É mais rápido do que digitar "vlc" e ter que distinguir entre vários resultados.
:::

## Lendo a página de detalhes

Ao clicar em qualquer resultado da busca, o Discover abre a página de detalhes daquele aplicativo. Essa página contém:

- **Capturas de tela** — carrossel de imagens do aplicativo em execução
- **Descrição longa** — texto explicativo fornecido pelo mantenedor
- **Avaliações e comentários** — se habilitados nas configurações
- **Informações técnicas**: versão disponível, tamanho do download, licença, site do projeto
- **Permissões** — o que o Flatpak terá acesso (rede, sistema de arquivos, dispositivos)
- **Botão "Instalar"** — com tamanho estimado do download

A seção de permissões merece destaque. Cada aplicativo Flatpak declara quais recursos do sistema ele precisa. O Discover mostra isso de forma legível:

```terminal
$ flatpak info org.videolan.VLC | grep -A 20 "[Permissions]"
```

A saída do terminal é mais crua, mas mostra exatamente as mesmas permissões que o Discover exibe na interface. Saber ler essas permissões é importante porque nem todo aplicativo do Flathub é bem-comportado — alguns pedem acesso completo ao sistema de arquivos sem necessidade.

:::atencao
O Discover não mostra todas as permissões de um Flatpak — ele exibe um resumo. Para ver as permissões completas, inclusive as que foram sobrescritas localmente, use `flatpak info --show-permissions org.videolan.VLC`. Pode haver permissões que o Discover omite.
:::

## Comparando Discover e flatpak search

| Critério | Discover | `flatpak search` |
|---|---|---|
| Velocidade | Imediato após catálogo carregado | Imediato |
| Ícones e screenshots | Sim | Não |
| Avaliações | Sim (configurável) | Não |
| Filtro por remote | Sim (seletor) | Sim (`--filter`) |
| Busca em descrição | Sim | Sim |
| Funciona offline | Parcial (catálogo cacheado) | Parcial (catálogo cacheado) |
| Precisa de GUI | Sim | Não |

A tabela deixa claro: o Discover é superior para exploração visual, mas o terminal é imbatível quando você sabe o identificador exato ou está escrevendo um script de provisioning.

## Resumo

- A busca do Discover consulta metadados cacheados do Flathub, não uma base local de pacotes.
- O Discover normaliza maiúsculas/minúsculas e busca por substring; termos em inglês dão resultados mais previsíveis.
- O filtro por fonte (Flatpak, KDE Store) restringe os resultados e evita poluição.
- A página de detalhes mostra capturas, descrição, versão, tamanho e permissões do aplicativo.
- `flatpak search` no terminal retorna resultados brutos; o Discover enriquece com ícones e avaliações.

## Exercícios

1. No Discover, busque "browser" e depois "navegador". Os resultados são diferentes? Anote quais aplicativos aparecem em cada busca.
2. Filtre a busca por "Flatpak (Flathub)" e procure "office". Compare os resultados com `flatpak search office` no terminal. Todos os identificadores batem?
3. Clique em três aplicativos diferentes e leia a seção de permissões de cada um. Qual deles pede acesso mais amplo ao sistema? Anote os identificadores e as permissões que mais chamaram atenção.
4. Busque um aplicativo pelo identificador exato: `org.kde.kdenlive`. A página de detalhes mostra o tamanho do download e a versão. Compare com `flatpak info org.kde.kdenlive` no terminal — as informações são consistentes?
5. **Desafio.** Escolha um aplicativo que você nunca instalou. No Discover, leia as permissões dele. Depois, execute `flatpak install --dry-run flathub <id>` e compare o que o Flatpak diz que vai baixar com o que o Discover estima. Os tamanhos são iguais? Se não forem, investigue com `flatpak info --show-metadata <id>` qual runtime o aplicativo depende e se o Discover já o considera instalado.