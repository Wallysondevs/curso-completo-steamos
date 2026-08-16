No Steam Deck, os jogos não são os únicos programas: emuladores, navegadores, editores de texto e utilitários chegam como **Flatpak**. Esse formato resolve um problema antigo do Linux — o conflito de bibliotecas — empacotando o aplicativo junto com tudo o que ele precisa e isolando-o do sistema host. Entender o modelo app + runtime + sandbox explica por que o modo desktop do Deck é tão estável mesmo com dezenas de apps de origens diferentes.

:::objetivos
- Entender o modelo Flatpak de app, runtime e sandbox
- Distinguir os runtimes org.freedesktop, org.gnome e org.kde
- Inspecionar e ajustar permissões com `flatpak override` e Flatseal
- Navegar pelos dados de apps em `~/.var/app/`
- Diferenciar Flatpak de BaseApp e Flathub dos repositórios da distro
:::

## Flatpak: app + runtime + sandbox

Um Flatpak é um aplicativo empacotado para ser independente do sistema onde roda. Em vez de depender das bibliotecas instaladas na máquina, cada app declara um **runtime** — uma base comum — e é executado dentro de uma **sandbox** que controla o que ele enxerga do host. A ideia central: o desenvolvedor empacota uma vez, e o app roda igual no Deck, num laptop com Arch ou num desktop com Fedora.

No Steam Deck, o **Discover** (a loja gráfica do KDE) instala e atualiza Flatpaks como se fossem apps de uma loja. Quem configura o Deck pela primeira vez no modo desktop encontra nele navegadores como o Firefox, emuladores e utilitários como o próprio **Flatseal**. Todos chegam no mesmo formato.

```terminal
$ flatpak list
Name                        Application ID                       Branch  Installation
Firefox                     org.mozilla.firefox                  stable  system
Freedesktop Platform        org.freedesktop.Platform             24.08   system
Mesa                        org.freedesktop.Platform.GL.default  24.08   system
KDE Application Platform    org.kde.Platform                     6.8     system
Flatseal                   com.github.tchx84.Flatseal            stable  system
```

A coluna `Installation` diz `system` quando o app foi instalado para todos os usuários e `user` quando ficou só na conta `deck`. É comum ver tanto o app quanto seu runtime e as extensões de driver listados — a linha `Mesa` é a implementação Vulkan/OpenGL que o Flatpak usa para falar com a GPU, entregue separadamente do runtime.

## Runtime: a base comum que os apps compartilham

O **runtime** é o conjunto de bibliotecas de base que vários Flatpaks compartilham. Em vez de cada app trazer sua própria cópia da glibc, do GTK ou do Qt, eles dependem de um runtime já instalado. Os três principais, pelo ID, são `org.freedesktop.Platform` (a base de todos), `org.gnome.Platform` (apps feitos para GNOME) e `org.kde.Platform` (apps feitos para KDE Plasma).

Como o modo desktop do Deck usa **KDE Plasma**, os apps que você instala pelo Discover tendem a puxar o runtime KDE. Um app Qt instalado no Deck compartilha o `org.kde.Platform`, então o segundo e o terceiro apps baixam menos: a base já está presente.

```terminal
$ flatpak info org.kde.Platform
          ID: org.kde.Platform
         Ref: runtime/org.kde.Platform/x86_64/6.8
        Arch: x86_64
      Branch: 6.8
     License: LGPL-2.1+
      Origin: flathub
  Collection: org.flathub.Stable
Installation: system
   Installed: 1.2 GB
    Runtime: org.freedesktop.Platform
```

O campo `Runtime` mostra uma hierarquia: o KDE Platform é construído em cima do Freedesktop Platform. Quando um app roda, ele vê as bibliotecas do runtime, não as do seu sistema — e isso elimina a clássica "dependência quebrada" de repositórios distro.

## Sandbox: o que o app vê, e o que não vê

A **sandbox** é o isolamento que o Flatpak impõe ao aplicativo. Tecnicamente, ela é feita por **Bubblewrap** (o comando `bwrap`), que monta um ambiente mínimo: um novo namespace de arquivos, uma visão limitada do sistema e filtros de rede e dispositivos. O app **não** enxerga seu `~/.config` inteiro, não acessa dispositivos USB por padrão e não lê arquivos fora do que foi autorizado.

Na prática, cada app recebe um diretório próprio de configuração, em `~/.var/app/<ID-do-app>/`. Se um app quer ler a pasta de downloads, ele precisa da permissão explícita de acesso ao sistema de arquivos — concedida via **portal** ou declarada no manifesto.

```terminal
$ ls ~/.var/app/
org.mozilla.firefox
com.github.tchx84.Flatseal
org.kde.kcalc
$ ls ~/.var/app/org.mozilla.firefox/
cache
config
data
```

Dentro de `~/.var/app/<app>/`, os três diretórios espelham os clássicos do Linux: `config` (configurações), `data` (dados e saves do app) e `cache`. Quando você apaga um Flatpak, esses diretórios geralmente ficam para trás à espera de um `flatpak uninstall --delete-data`.

:::atencao
A sandbox do Flatpak não é uma máquina virtual nem um container completo. É isolamento por namespaces e permissões, bem mais leve. Por isso um app Flatpak abre na mesma velocidade de um nativo — não há boot de sistema operacional, só o arranque do processo com um sistema de arquivos restrito.
:::

## Flathub: o repositório central

O **Flathub** é o repositório central e comunitário de Flatpaks, de onde o Discover baixa os apps por padrão. Ele publica apps com curadoria e verificação: desenvolvedores podem marcar seus apps como verificados, indicando que o pacote é mantido pelo próprio autor do software. Um repositório distro entrega pacotes compilados **contra** aquela versão do sistema, enquanto o Flathub entrega apps **independentes** e atualizados no seu próprio ritmo — ideal para o sistema imutável do Deck.

```terminal
$ flatpak remotes
Name    Options
flathub system
```

O comando `flatpak remotes` lista os repositórios configurados. No Deck, apenas `flathub` costuma aparecer. Adicionar um remoto de terceiro é possível, mas o modelo de verificação do Flathub é motivo suficiente para preferir ficar só com ele.

## Portal e permissões: a porta da bolha

O **Portal** (implementado por `xdg-desktop-portal`) é o intermediário que permite a um app sandboxed acessar recursos fora da bolha de forma controlada. Em vez de o app abrir um diálogo de arquivo por conta própria, ele pede ao portal, que mostra o seletor do sistema e devolve um "passe" para aquele arquivo específico. O usuário escolhe; o app nunca ganha acesso total à pasta.

O mesmo vale para captura de tela, impressão e notificações. O portal intermedeia: o app pede "quero abrir um arquivo", o portal pergunta a você qual, e só aquele arquivo é liberado.

Para **inspecionar e ajustar permissões**, existem dois caminhos. Pelo terminal, o `flatpak override` mostra e altera permissões; pela interface, o **Flatseal** faz o mesmo.

```terminal
$ flatpak override --show org.mozilla.firefox
[Context]
filesystems=/home/deck/Downloads;

[Session Bus Policy]
org.freedesktop.portal.*=talk

[Environment]
MOZ_ENABLE_WAYLAND=1
```

Cada seção controla um eixo: `filesystems` lista os caminhos que o app pode acessar (além do seu próprio diretório), `Session Bus Policy` regula com quais serviços o app conversa no barramento de sessão, e `Environment` injeta variáveis de ambiente. Aqui o Firefox ganhou acesso a `~/Downloads` e foi configurado para usar Wayland.

```terminal
$ flatpak run org.mozilla.firefox
```

O `flatpak run <ID>` inicia o app e é útil para diagnóstico: se um app não abre pela interface, rodar pelo terminal expõe os erros reais.

## BaseApp vs Flatpak: a exceção interna da Valve

**BaseApp** é uma estratégia alternativa de empacotamento usada pela Valve internamente, fora do modelo Flathub. Ela reaproveita a ideia de um ambiente de runtime, mas é montada e distribuída pela própria Valve para os componentes do Steam e do sistema — não é baixada do Flathub pelo usuário. Você não instala "um BaseApp" como instala um Flatpak do Discover; o BaseApp é uma peça da infraestrutura que a Valve controla.

A confusão nasce porque os dois nomes soam parecidos e resolvem o mesmo problema (evitar conflito de bibliotecas). A diferença prática: Flatpak é o formato aberto, com Flathub, portal e sandbox, usado por você para instalar apps. BaseApp é interno à Valve, usado para as próprias ferramentas do SteamOS. Num glossário: Flatpak é o que você toca; BaseApp é o que a Valve usa por baixo do capô.

```terminal
$ ls ~/.local/share/Steam/steamapps/common/ | grep -i runtime
SteamLinuxRuntime_sniper
SteamLinuxRuntime_soldier
```

Os "runtimes" da Steam (Soldier, Sniper) que [vimos na seção sobre Proton](#/cap-102/sec-03) são a contraparte na camada do Steam — uma ideia irmã do BaseApp, não do Flatpak do usuário. Guardar essa distinção evita procurar no Discover o que só existe dentro do Steam.

:::dica
Para liberar espaço, rode `flatpak uninstall --unused` de tempos em tempos: ele remove runtimes e extensões que não são mais referenciados por nenhum app. No Deck, onde o armazenamento é disputado entre jogos e apps, isso recupera gigabytes sem tocar em nada que você usa.
:::

## Resumo

- Flatpak empacota o app junto com as dependências e o isola do host; o Discover do Deck instala e atualiza esses apps.
- O runtime é a base compartilhada (`org.freedesktop.Platform`, `org.gnome.Platform`, `org.kde.Platform`); no Deck, apps KDE usam o KDE Platform.
- A sandbox é feita por Bubblewrap; cada app enxerga apenas seu `~/.var/app/<ID>/` e o que for autorizado.
- Flathub é o repositório central com verificação, independente dos repositórios da distro.
- O portal (xdg-desktop-portal) intermedeia acesso a arquivos, tela e dispositivos sem abrir mão da sandbox.
- `flatpak override` e o Flatseal inspecionam e ajustam permissões; BaseApp é a estratégia interna e separada da Valve.

## Exercícios

1. Rode `flatpak list` e separe mentalmente as linhas em três grupos: aplicativos, runtimes e extensões de driver. Qual runtime seus apps KDE usam?
2. Execute `flatpak info <ID-de-um-app>` e leia os campos `Runtime` e `Installed`. O app depende de qual runtime, e quanto espaço ele ocupa?
3. Inspecione as permissões de um app com `flatpak override --show <ID>` e explique, em uma frase, cada seção da saída.
4. Navegue por `~/.var/app/<ID>/` e localize onde um app guarda seus dados. Compare com `~/.config` do mesmo app instalado nativamente, se houver.
5. **Desafio.** Instale o Flatseal e modifique uma permissão de um app de sua escolha; depois confira via `flatpak override --show` que a mudança foi refletida no manifest. Relacione essa permissão com o papel do portal: ela libera acesso direto ou apenas permite que o portal intermedeie aquela ação?