O Steam Deck é, antes de tudo, um console de jogos — mas por baixo da interface do modo jogo vive um Linux completo, baseado em Arch, com acesso a um repositório de aplicativos enorme via Flatpak. Quando você troca para o modo desktop, a máquina vira um computador portátil de verdade: navegador, player de vídeo, editor de código, tudo isso instala em segundos. Neste capítulo você monta o "kit básico" que transforma o Deck numa estação de trabalho leve, além das ferramentas específicas do ecossistema, como ProtonUp-Qt e Decky Loader.

:::objetivos
- Entender por que o SteamOS usa Flatpak como mecanismo padrão de instalação de aplicativos
- Executar a instalação de aplicativos Flatpak pela linha de comando
- Listar e inspecionar os aplicativos instalados no sistema
- Abrir um aplicativo Flatpak a partir do terminal
- Planejar um conjunto inicial de ferramentas essenciais para o modo desktop
:::

## Por que Flatpak

O SteamOS é uma distribuição chamada Arch Linux fortemente modificada pela Valve. Nos computadores convencionais, você instala programas com o gerenciador de pacotes da distro (no Arch, o `pacman`). O problema: esses pacotes dependem de bibliotecas compartilhadas na própria raiz do sistema, e a Valve torna a raiz **somente leitura** entre atualizações do sistema. Instalar pacotes do Arch direto no Deck é possível, mas quebra ou é desfeito a cada update.

O Flatpak resolve isso colocando cada aplicativo numa **sandbox** própria, com as bibliotecas de que ele precisa embutidas num *runtime*. O aplicativo não toca na raiz do sistema; ele vive em `/var/lib/flatpak` e na sua pasta `~/.var/app`. Por isso ele sobrevive às atualizações do SteamOS e pode ser atualizado de forma independente.

:::nota
O Flatpak usa o conceito de *runtime*, um conjunto base de bibliotecas compartilhadas entre vários aplicativos da mesma "família". Assim, o Firefox e o GIMP, por exemplo, podem compartilhar um runtime GNOME em vez de cada um embarcar uma cópia idêntica do GTK. A Valve mantém seu próprio runtime otimizado para o Deck.
:::

## O comando que instala tudo

A ferramenta de linha de comando do Flatpak se chama `flatpak`. A instalação de um aplicativo tem sempre a mesma forma:

```terminal
$ flatpak install org.mozilla.firefox
Looking for matches…
Found similar ref(s) for 'org.mozilla.firefox' in remote 'flathub' (system).
Use this remote? [Y/n]: Y
Required runtime for org.mozilla.firefox/x86_64/stable (runtime/org.freedesktop.Platform/x86_64/23.08) found in remote flathub
Do you want to install it? [Y/n]: Y

org.mozilla.firefox permissions:
    ipc                 network              cups                  pcsc
    pulseaudio          x11                  dri
    ssh-auth            fallback-x11         wayland

        ID                                             Branch          Op           Remote           Download
 1. [✓] org.freedesktop.Platform.Locale                23.08           i            flathub          17,2 kB / 17,3 kB
 2. [✓] org.mozilla.firefox.Locale                     stable          i            flathub         564,4 kB / 564,6 kB
 3. [✓] org.mozilla.firefox                            stable          i            flathub          77,2 MB / 77,4 MB

Installation complete.
```

O identificador `org.mozilla.firefox` é um **App ID**, um nome único e reverso de domínio que identifica cada aplicativo no Flathub — o repositório central de aplicativos Flatpak. Repare que o instalador resolveu sozinho o *runtime* `org.freedesktop.Platform` e baixou tudo que faltava antes de instalar o aplicativo em si.

## Como descobrir o App ID certo

Você não precisa decorar os App IDs de cabeça. O Flatpak tem uma busca integrada ao Flathub:

```terminal
$ flatpak search torrent
Name               Description                                     Application ID                  Version     Branch      Remotes
qBittorrent        A libre, feature-rich Bittorrent client         org.qbittorrent.qBittorrent     5.0.6       stable      flathub
Fragments          A BitTorrent client for GNOME                   de.haeckerfelix.Fragments       3.0.2       stable      flathub
Transmission       A Fast, Easy, and Free BitTorrent Client        com.transmissionbt.Transmission 4.1.1       stable      flathub
KTorrent           BitTorrent program for KDE                      org.kde.Ktorrent                24.08.4     stable      flathub
```

A coluna `Application ID` é exatamente o que você passa para o `flatpak install`. A maior parte dos aplicativos de que você vai precisar no Deck está no Flathub, então a busca quase sempre resolve suas dúvidas de nome.

:::dica
Na primeira vez que roda num sistema novo, o `flatpak` precisa adicionar o remoto do Flathub. Se o comando `flatpak search` responder com "No remote found", registre o repositório oficial antes de continuar:

```terminal
$ flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
```
:::

## Listando o que está instalado

Depois de instalar alguns apps, você quer conferir o que tem na máquina. O comando `flatpak list` mostra os aplicativos, e a flag `--app` filtra só aqueles que têm interface gráfica (ignorando runtimes e bibliotecas):

```terminal
$ flatpak list --app
Name                 Application ID                  Version           Branch        Installation
Firefox              org.mozilla.firefox             137.0.2           stable        system
VLC                  org.videolan.VLC                3.0.21            stable        system
qBittorrent          org.qbittorrent.qBittorrent     5.0.6             stable        system

$ flatpak run org.mozilla.firefox
```

O `flatpak run` lança o aplicativo pelo terminal, que é útil para ver mensagens de erro quando algo não abre. No dia a dia, porém, você usa o menu Iniciar do modo desktop, que já indexa os aplicativos Flatpak instalados automaticamente — sem precisar de configuração nenhuma.

## Montando o seu kit

Não existe resposta única para "quais apps instalar", mas um conjunto mínimo costuma cobrir o uso mais comum do modo desktop. Ao longo deste capítulo você instala, um a um: Firefox (navegação), VLC (vídeo e música), VS Codium (código), GIMP (imagem), qBittorrent (torrent), OBS Studio (captura) e Discord (comunicação). No final, fecha com ProtonUp-Qt e Decky Loader, que são partes do próprio ecossistema Steam e ficam fora do esquema Flatpak convencional.

:::info
O SteamOS instala alguns Flatpak de fábrica para o modo desktop, mas a lista varia entre versões. Não se assuste se o Firefox ou outro app já vier pré-instalado na sua máquina — as versões do Flathub costumam ser mais novas e mais bem integradas que as empacotadas pela Valve, então vale atualizar.
:::

## Resumo

- O SteamOS mantém a raiz do sistema somente leitura, então aplicativos são instalados via Flatpak, que isola cada app num sandbox.
- `flatpak install <App ID>` instala um aplicativo do Flathub, resolvendo runtime e dependências sozinho.
- `flatpak search <termo>` encontra o App ID correto de um aplicativo no Flathub.
- `flatpak list --app` mostra os aplicativos instalados; `flatpak run <App ID>` abre um deles pelo terminal.
- Aplicativos Flatpak aparecem automaticamente no menu do modo desktop após a instalação.

## Exercícios

1. Rode `flatpak remote-list` e escreva, para cada remoto, o nome e a URL. Qual deles é o Flathub?
2. Use `flatpak search` para encontrar o App ID de um leitor de PDF e de um editor de texto simples. Anote os dois App IDs encontrados.
3. Instale o Firefox com `flatpak install org.mozilla.firefox` e confirme que ele aparece em `flatpak list --app`.
4. Abra o Firefox pelo terminal com `flatpak run org.mozilla.firefox` e pressione [[Ctrl+C]] ainda aberto. Observe em que momento o processo termina e o que é impresso no terminal.
5. **Desafio.** Execute `flatpak list --app --columns=name,application,version` e compare com `flatpak list --app`. Depois, usando `flatpak info org.mozilla.firefox`, descubra de qual runtime o Firefox depende e confirme se ele já está instalado na sua máquina.
