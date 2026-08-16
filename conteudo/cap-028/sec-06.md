Se o Flatpak é a via oficial de instalação no SteamOS, o Flathub é a estrada. É de lá que vêm os aplicativos, os runtimes e as atualizações. Esta seção explica o que é o Flathub, como ele se relaciona com o Flatpak, como o SteamOS configura o repositório e como você pode verificar a procedência de um aplicativo antes de instalar.

:::objetivos
- Entender o que é o Flathub e como ele se diferencia do Flatpak (formato vs. repositório)
- Verificar quais repositórios Flatpak estão configurados no SteamOS
- Buscar aplicativos e inspecionar metadados antes de instalar
- Distinguir aplicativos verificados (✓) de aplicativos comunitários
- Conhecer repositórios alternativos e quando usá-los

:::

## Flatpak é o formato, Flathub é a loja

É fácil confundir os dois, e a confusão atrapalha. Flatpak é o **formato de empacotamento** e o **conjunto de ferramentas** (`flatpak` CLI) que instala, roda e gerencia aplicativos. Flathub é um **repositório de aplicativos Flatpak** — um servidor que hospeda os pacotes e os distribui para quem pedir.

A relação é análoga a "pacote Debian" (`*.deb`) e "repositórios do Ubuntu". O `*.deb` é o formato; o repositório do Ubuntu é um lugar onde milhares desses pacotes estão organizados. Flatpak e Flathub têm a mesma relação: o Flatpak é o trem, o Flathub é a estação de embarque. E a boa notícia é que você pode adicionar quantas estações quiser — embora, para o usuário comum, o Flathub seja a única de que você precisa.

```terminal
$ flatpak remote-list
Name    Options
flathub system
```

No SteamOS recém-instalado, o `flatpak remote-list` mostra apenas o Flathub, configurado como repositório de sistema (`system`). Isso significa que qualquer `flatpak install` sem especificar o repositório usa o Flathub automaticamente.

:::nota
O Flathub é mantido pela comunidade e governado por um comitê independente. A Valve não controla o Flathub, mas colabora com ele: muitos aplicativos no Flathub têm builds testados especificamente no Steam Deck e no SteamOS. O site oficial é [flathub.org](https://flathub.org).
:::

## Como o SteamOS configura o Flathub

O SteamOS adiciona o Flathub como repositório padrão durante a instalação. Você pode verificar os detalhes dessa configuração inspecionando o arquivo de definição do repositório:

```terminal
$ flatpak remotes --show-details
Name    Title   URL                                     Collection ID  Subset  Filter  Priority
flathub Flathub https://dl.flathub.org/repo/            org.flathub.Stable      -       -       1
$ cat /var/lib/flatpak/repo/config
[core]
repo_version=1
[remote "flathub"]
url=https://dl.flathub.org/repo/
gpg-verify=true
gpg-verify-summary=true
collection-id=org.flathub.Stable
xa.title=Flathub
```

A URL `https://dl.flathub.org/repo/` é o endpoint principal do Flathub. O campo `gpg-verify=true` indica que todas as assinaturas são verificadas: o Flatpak confere a assinatura GPG de cada pacote antes de instalar, garantindo que o que você baixou é realmente o que o mantenedor publicou — e não algo injetado no meio do caminho.

O `collection-id` é um identificador usado pelo OSTree para agrupar repositórios. E a `Priority` (prioridade) determina qual repositório ganha quando dois repositórios oferecem o mesmo aplicativo — o número menor vence.

## Buscando aplicativos pelo terminal

A interface gráfica Discover (do KDE) mostra os aplicativos do Flathub com ícones, descrições e avaliações. Mas o terminal é mais rápido e expõe metadados que a interface esconde. O comando `flatpak search` é a porta de entrada:

```terminal
$ flatpak search firefox
Name              Description                                          Application ID               Version           Branch  Remotes
Firefox           Browse the web                                       org.mozilla.firefox           133.0.3           stable  flathub
Firefox ESR       Extended Support Release of Firefox                  org.mozilla.firefox.BaseApp   128.5.1esr        stable  flathub
LibreWolf         Community version of Firefox, focused on privacy       io.gitlab.librewolf-community 132.0.2-1        stable  flathub
```

A saída traz cinco colunas: nome amigável, descrição curta, ID do aplicativo (o identificador canônico), versão, branch e repositório. O ID é o que você usa com `flatpak install` e `flatpak run`.

Antes de instalar, você pode inspecionar os metadados do aplicativo sem baixá-lo:

```terminal
$ flatpak remote-info flathub org.mozilla.firefox
Firefox - Browse the web

        ID: org.mozilla.firefox
       Ref: app/org.mozilla.firefox/x86_64/stable
      Arch: x86_64
    Branch: stable
Collection: org.flathub.Stable
  Download: 73.9 MB
  Installed: 243.1 MB
   Runtime: org.freedesktop.Platform/x86_64/24.08
```

Aqui vemos o tamanho do download (73.9 MB comprimidos) e o tamanho instalado (243.1 MB descomprimidos), além do runtime que será puxado como dependência. Isso ajuda a decidir se vale a pena instalar, especialmente em modelos de 64 GB.

## Aplicativos verificados e selo azul

No Flathub, alguns aplicativos exibem um selo azul com ✓ e a palavra "Verified". Esse selo significa que o aplicativo é mantido **pelo desenvolvedor original** ou por alguém autorizado por ele — não por um empacotador terceiro.

Um Firefox com selo ✓ é publicado diretamente pela Mozilla. Um Firefox sem selo seria empacotado por um voluntário da comunidade — o que não significa que seja ruim, mas o canal oficial de suporte é o empacotador, não a Mozilla. Para aplicativos críticos (navegador, gerenciador de senhas, editor de texto que você usa para trabalhar), prefira versões verificadas.

```terminal
$ flatpak remote-info flathub org.mozilla.firefox 2>/dev/null | grep -i verified
$ flatpak search firefox
```

O comando `flatpak search` não mostra o selo ✓ (a CLI não tem esse campo), mas no site do Flathub (flathub.org) e na interface Discover o selo aparece. No terminal, você pode inferir a procedência pelo `Application ID`: IDs com domínio do desenvolvedor (`org.mozilla.firefox`, `com.spotify.Client`) geralmente indicam que o próprio desenvolvedor publica.

## Repositórios alternativos

O Flathub é o repositório padrão e cobre a vasta maioria dos aplicativos de desktop, mas não é o único. Existem cenários onde você pode querer adicionar outros repositórios:

```terminal
$ flatpak remote-add --if-not-exists flathub-beta https://flathub.org/beta-repo/flathub-beta.flatpakrepo
$ flatpak remote-list
Name          Options
flathub       system
flathub-beta  system
```

O `flathub-beta` é o mesmo Flathub, mas com a branch `beta` dos aplicativos — útil para testar versões novas antes do lançamento estável. Outros repositórios notáveis incluem o `gnome-nightly` (builds diários do GNOME) e repositórios de empresas como o `fedora` (que distribui Flatpaks do Fedora).

:::atencao
Adicionar repositórios de terceiros é como adicionar PPAs no Ubuntu: você está confiando que o mantenedor do repositório não vai distribuir software malicioso. Verifique sempre a procedência. No SteamOS, a recomendação oficial é manter apenas o Flathub, a menos que você tenha um motivo específico e confie na fonte.
:::

## Instalando e removendo

O ciclo completo de um aplicativo Flatpak pelo Flathub é:

```terminal
$ flatpak search gimp
$ flatpak install flathub org.gimp.GIMP
$ flatpak run org.gimp.GIMP
$ flatpak remove org.gimp.GIMP
```

Entre `install` e `remove`, o aplicativo fica disponível como qualquer outro — aparece no menu de aplicativos do desktop mode e pode ser fixado na Steam Library como atalho não-Steam.

O `flatpak install` aceita várias fontes: você pode instalar de um arquivo `.flatpakref` local (que é um link para o repositório), de um `.flatpak` compilado localmente, ou diretamente do Flathub pelo ID. O mais comum é o ID direto.

## Resumo

- Flatpak é o formato e a ferramenta; Flathub é o repositório central e gratuito de aplicativos Flatpak.
- O SteamOS configura o Flathub como repositório padrão com verificação GPG ativada.
- `flatpak search` e `flatpak remote-info` permitem inspecionar aplicativos antes de instalar.
- O selo ✓ (Verified) indica que o desenvolvedor original publica o aplicativo diretamente.
- Repositórios alternativos existem, mas adicione apenas fontes confiáveis.

## Exercícios

1. Liste os repositórios configurados com `flatpak remotes --show-details` e anote a URL e a prioridade de cada um.
2. Busque três aplicativos de categorias diferentes com `flatpak search` e, para cada um, rode `flatpak remote-info flathub <id>` para ver tamanho e runtime.
3. Instale um aplicativo pequeno pelo terminal (ex.: `org.gnome.Calculator`), confirme que ele aparece no menu, e depois remova com `flatpak remove`.
4. Visite flathub.org, procure um aplicativo com selo ✓ e um sem selo. Compare quem publica cada um (autor original vs. comunidade).
5. **Desafio.** Adicione o repositório `flathub-beta` com `flatpak remote-add`, busque a versão beta de um aplicativo e compare a versão da branch beta com a estável usando `flatpak remote-info`. Depois remova o repositório beta com `flatpak remote-delete flathub-beta`.