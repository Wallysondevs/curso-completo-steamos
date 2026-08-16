Se o VLC resolve a reprodução de arquivos avulsos, o Kodi resolve a organização da sua coleção inteira. Ele transforma o Steam Deck em uma central de mídia completa: indexa filmes e séries com pôsteres e sinopses, entende bibliotecas de música, mostra fotos e aceita addons que expandem suas capacidades para streaming, IPTV, rádio e muito mais. Conectado a um dock com HDMI, o Deck + Kodi vira o coração multimídia da sala.

:::objetivos
- Instalar o Kodi e configurar o idioma para português do Brasil
- Adicionar fontes de mídia (pastas locais, NAS, pendrive) e indexar a biblioteca
- Instalar addons de streaming, legendas e temas
- Navegar com os controles do Deck e com controle remoto via Kodi Remote
:::

## Instalação e primeiros passos

O Kodi está disponível como Flatpak. A instalação é limpa e não conflita com outros aplicativos de mídia.

```terminal
$ flatpak install flathub tv.kodi.Kodi
Looking for matches…
tv.kodi.Kodi/x86_64/stable             21.1     flathub
Proceed with these changes to the system? [Y/n]: y
Installation complete.
```

Na primeira execução, o Kodi abre em inglês. Para traduzir: clique no ícone de engrenagem (Settings) → Interface → Regional → Language, selecione "Portuguese (Brazil)" e confirme. A interface se adapta instantaneamente.

A navegação com os controles do Deck é natural: o direcional esquerdo (`D-Pad`) move entre os itens, `A` confirma, `B` volta. O touchpad direito move o cursor como mouse — útil para addons que não foram desenhados para controle remoto. O layout padrão do Kodi (Estuary) já é pensado para TV e funciona perfeitamente na tela de 7 polegadas do Deck.

## Fontes de mídia e biblioteca

Para o Kodi mostrar seus filmes com capas, sinopses e elenco, você precisa primeiro dizer onde eles estão. Isso se chama **adicionar uma fonte**.

Vá em Filmes → Entrar na seção de arquivos → Adicionar vídeos… → Procurar. Navegue até a pasta onde estão seus arquivos. Pode ser:

- Uma pasta no SSD interno (`/home/deck/Vídeos`)
- Um cartão microSD montado em `/run/media/deck/mmcblk0p1`
- Um pendrive ou HD externo conectado ao dock
- Um compartilhamento de rede (SMB/NFS) — o Kodi tem suporte nativo

Depois de escolher a pasta, defina o tipo de conteúdo: Filmes, Séries ou Videoclipes. O Kodi pergunta se você quer indexar (scan) a fonte agora — diga sim. Ele consulta o TheMovieDB ou TheTVDB (você escolhe o scraper), baixa metadados e monta a biblioteca.

```terminal
$ ls ~/Vídeos/
O Poderoso Chefao (1972).mkv     Matrix (1999).mkv
A Rede Social (2010).mkv          Blade Runner 2049 (2017).mkv
```

O Kodi reconhece os nomes se seguirem o padrão `Título (Ano).ext`. Para séries, a estrutura esperada é `Série/Season 01/Episódio S01E01.mkv`. Se algum filme não for identificado, clique com o botão direito (ou mantenha `A` pressionado) e escolha "Buscar no banco de dados" para digitar o título manualmente.

:::dica
Para acessar arquivos num NAS ou PC da rede, vá em Adicionar fonte → Procurar → Adicionar local de rede. O Kodi suporta SMB (Windows), NFS (Linux/NAS) e UPnP/DLNA. Autenticação com usuário e senha funciona em todos.
:::

## Addons essenciais

O Kodi tem uma loja de addons integrada. Vá em Add-ons → Baixar e explore as categorias. Alguns addons que fazem diferença no Deck:

- **Legendas:** Complementos → Legendas → OpenSubtitles.org. Depois de configurar (é grátis, só requer cadastro), o Kodi baixa legendas automaticamente para qualquer filme.
- **YouTube:** Complementos → Add-ons de vídeo → YouTube. Permite navegar canais, playlists e histórico diretamente no Kodi, com controle remoto.
- **Plex / Jellyfin:** Se você já tem um servidor de mídia rodando em casa, os addons oficiais conectam o Kodi à sua biblioteca existente.
- **Temas (skins):** Aparência → Skins. O tema padrão Estuary é leve e rápido na APU; temas pesados como Aeon Nox consomem mais GPU e podem engasgar no Deck.

:::atencao
Addons de terceiros que prometem filmes e séries por streaming não-oficial (os famosos "addons piratas") costumam quebrar com frequência e podem depender de dependências externas instáveis. Prefira os addons do repositório oficial do Kodi — eles são mantidos e atualizados automaticamente.
:::

## Controle remoto e segunda tela

Com o Deck no dock conectado à TV, você não quer levantar do sofá para mexer no touchpad. O Kodi tem um servidor web integrado que aceita comandos remotamente.

Vá em Configurações → Serviços → Controle → Permitir controle remoto via HTTP. Anote a porta (padrão 8080) e, se quiser, defina usuário e senha.

No celular, instale o aplicativo **Kore** (Android, gratuito e oficial) ou **Kodi Remote** (iOS). Conecte-o ao IP do Deck na rede local e você controla toda a navegação do sofá — inclusive com teclado virtual para buscas.

```terminal
$ ip -br addr show wlan0
wlan0    UP     192.168.1.42/24
```

O IP mostrado é o que você coloca no aplicativo remoto. Se o Deck estiver no dock com Ethernet, use o IP da interface `eth0` ou `enp0s31f6`.

O Kodi também aceita controle via CEC (Consumer Electronics Control): se sua TV suporta HDMI-CEC e o dock passa o sinal, o controle remoto da TV controla o Kodi sem configurar nada. No Steam Deck, isso depende do chip do dock — hubs USB-C genéricos nem sempre passam CEC corretamente.

## Resumo

- Instale o Kodi com `flatpak install flathub tv.kodi.Kodi` e configure o idioma para português.
- Adicione fontes de mídia (pastas locais, microSD, rede SMB/NFS) e defina o tipo de conteúdo para indexar filmes e séries com metadados.
- Addons oficiais fornecem legendas (OpenSubtitles), YouTube, Plex, Jellyfin e skins alternativas.
- O controle remoto funciona via aplicativo Kore (Android) ou Kodi Remote (iOS) pelo servidor HTTP na porta 8080.
- Com dock + TV, o Deck vira uma central de mídia de sala; a navegação por controle remoto ou D-Pad dispensa mouse e teclado.

## Exercícios

1. Instale o Kodi, mude o idioma para português e adicione uma pasta com pelo menos três arquivos de vídeo como fonte do tipo "Filmes". O Kodi baixou as capas e sinopses corretamente?
2. Configure o addon OpenSubtitles.org e teste o download automático de legenda para um filme em inglês.
3. Conecte o Kodi a um compartilhamento de rede (pode ser uma pasta compartilhada do Windows ou um servidor SMB no Linux). Adicione o conteúdo de lá como fonte.
4. Ative o servidor web de controle remoto e conecte o aplicativo Kore (Android) ou Kodi Remote ao Deck. Navegue pela biblioteca usando o celular.
5. **Desafio.** Crie uma biblioteca de música: adicione uma pasta com MP3 ou FLAC, defina o tipo como "Música" e veja se o Kodi baixou as capas dos álbuns. Depois, ative o modo de visualização de festa (Party Mode) e explique por que o Kodi é mais interessante que o VLC para coleções musicais grandes.