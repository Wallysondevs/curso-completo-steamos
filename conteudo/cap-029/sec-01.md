O Steam Deck é um console de jogos, mas também é um computador Linux completo. Quando você troca para o Modo Desktop, a Valve oferece um gerenciador de aplicativos gráfico que resolve talvez a tarefa mais corriqueira para qualquer pessoa: instalar programas. Em vez de linhas de comando e repositórios obscuros, você vai usar o Discover — a loja de aplicativos do KDE Plasma.

O Discover é o frontend gráfico que integra tudo o que pode ser instalado com um clique no SteamOS: pacotes Flatpak do Flathub, complementos do Plasma, fontes e temas. Ele é a ponte entre o usuário final e o ecossistema de empacotamento que o Flatpak representa no SteamOS.

:::objetivos
- Entender o que é o Discover e qual o seu papel no ecossistema KDE
- Abrir o Discover pelo menu de aplicativos e pelo atalho de sistema
- Reconhecer que no SteamOS ele é essencialmente uma vitrine do Flathub
- Saber quando usar o Discover e quando recorrer ao terminal
:::

## O Discover no ecossistema KDE

O Discover é um dos componentes centrais do KDE Plasma desde a versão 5. Ele nasceu para unificar, numa única interface, várias fontes de software diferentes. Antes dele, o usuário do KDE precisava abrir o Muon, depois o Plasma Add-On Installer, depois o navegador para buscar um tema — cada coisa em um lugar. O Discover juntou tudo.

Por trás da interface gráfica, o Discover usa a biblioteca **libdiscover**, que age como uma camada de abstração sobre os chamados *backends*. Cada backend é responsável por uma fonte de software diferente:

- **FlatpakBackend** — pacotes Flatpak do Flathub (e de qualquer outro remote configurado)
- **PackageKitBackend** — pacotes nativos `.deb` ou `.rpm` via PackageKit
- **KNSBackend** (*KDE New Stuff*) — complementos, papéis de parede, temas, widgets do Plasma
- **FwupdBackend** — atualizações de firmware de dispositivos

No SteamOS, a situação é particular. A partição do sistema (`/usr`) é imutável e somente-leitura, então **não existe gerenciador de pacotes nativo tradicional** — nada de `apt`, `dpkg` ou `rpm` para instalar programas. O PackageKitBackend fica essencialmente inativo para instalação de aplicativos (embora ainda esteja presente para atualizações pontuais de componentes do sistema). Quem carrega o peso é o FlatpakBackend.

## Abrindo o Discover

A forma mais direta de abrir o Discover no Steam Deck é pelo menu de aplicativos. No Modo Desktop, clique no ícone do menu no canto inferior esquerdo (o logotipo do Steam, por padrão) e digite "discover". O ícone azul com uma sacola de compras aparece nos resultados.

No terminal, o Discover é lançado com:

```terminal
$ plasma-discover
adding local source "/home/deck/.local/share/discover/local-apps"
adding flatpak source "flathub"
kf.newstuff.core: Could not find kns registry file for "plasma-themes.knsrc"
```

As mensagens de inicialização mostram quais backends foram carregados. A linha `adding flatpak source "flathub"` confirma que o Flathub está ativo e pronto. O aviso sobre `kns` na terceira linha é normal — o SteamOS não envia todos os arquivos de registro do KNS na imagem padrão, mas isso não impede o funcionamento.

Se você quiser abrir o Discover diretamente numa página específica, pode passar o nome de um aplicativo como argumento:

```terminal
$ plasma-discover --application org.videolan.VLC
```

Note que o Discover é um processo gráfico: ele não "termina" e devolve o prompt enquanto a janela estiver aberta. O comando fica em primeiro plano até você fechar a janela (ou matá-lo). Para confirmar que ele está rodando em segundo plano, abra outro terminal e consulte:

```terminal
$ pgrep -a plasma-discover
4214 /usr/bin/plasma-discover
```

:::dica
O Discover também pode ser acessado pelo atalho do system tray: clique no ícone de atualizações (seta verde apontando para baixo) que aparece na bandeja do sistema quando há atualizações disponíveis. Isso abre o Discover já na aba de atualizações.
:::

## O que você vai encontrar

Ao abrir o Discover no Steam Deck, você verá uma página inicial com aplicativos em destaque, categorias e uma barra de busca no topo. A página "Explorar" mostra uma seleção curada de aplicativos populares: navegadores, suítes de escritório, editores de imagem, jogos open source.

A barra lateral esquerda organiza o acesso em:

- **Explorar** — página inicial com destaques e categorias
- **Instalado** — lista de tudo que já está no sistema
- **Atualizações** — notificações de novas versões disponíveis
- **Configurações** — preferências do próprio Discover (frequência de verificação, fontes)

Na parte inferior da barra lateral, um link "Sobre" mostra a versão do Discover e da libdiscover. Na versão de referência do SteamOS 3.6, você deve encontrar algo como `plasma-discover 5.27.x` com `libdiscover` compatível.

:::info
O Discover no SteamOS é instalado como Flatpak. Você pode verificar com `flatpak list --app | grep discover`. A decisão da Valve de empacotar o Discover como Flatpak reforça a filosofia: tudo o que não é parte imutável do sistema roda em contêiner.
:::

## Quando usar o Discover e quando usar o terminal

O Discover cobre perfeitamente o caso de uso diário: instalar, atualizar e remover aplicativos do Flathub. Para a maioria das pessoas, é a única ferramenta de que vão precisar.

Mas há cenários em que o terminal ainda é necessário:

- Instalar algo de um remote Flatpak que não seja o Flathub (você precisa adicionar o remote antes com `flatpak remote-add`)
- Diagnosticar falhas de instalação com `flatpak install --verbose`
- Instalar versões específicas com `flatpak install flathub//24.08`
- Gerenciar permissões finas de sandbox com `flatpak override`

Pense no Discover como a vitrine da loja e no `flatpak` do terminal como o almoxarifado: 95% do trabalho se resolve na vitrine, mas quando você precisa de algo muito específico, vai ao almoxarifado.

## Resumo

- O Discover é o gerenciador gráfico de aplicativos do KDE Plasma, com backends para Flatpak, PackageKit, KNS e fwupd.
- No SteamOS, o Discover funciona essencialmente como frontend do Flathub, já que o sistema de arquivos raiz é imutável.
- O comando `plasma-discover` lança a interface gráfica; mensagens na saída mostram quais backends foram ativados.
- A interface organiza-se em Explorar, Instalado, Atualizações e Configurações.
- Para 95% das tarefas o Discover é suficiente, mas o terminal (`flatpak`) é necessário para operações avançadas.

## Exercícios

1. Abra o Discover pelo menu de aplicativos e identifique na tela inicial pelo menos três aplicativos que você reconhece do mundo Windows ou macOS. Anote os nomes e os respectivos identificadores (ex.: `org.mozilla.firefox`).
2. No terminal, execute `plasma-discover` e observe a saída. Anote a versão da libdiscover e confirme se o backend Flatpak foi carregado.
3. Na barra lateral do Discover, clique em "Instalado" e compare a lista com a saída de `flatpak list --app` no terminal. Elas batem?
4. Abra as Configurações do Discover e encontre a seção de fontes de software. Anote quais remotes Flatpak aparecem lá e compare com `flatpak remotes`.
5. **Desafio.** Feche o Discover, execute `flatpak update` no terminal e depois abra o Discover novamente na aba de Atualizações. O Discover mostra algo diferente? Explique por que pode haver divergência entre o que o Flatpak do terminal vê e o que o Discover (rodando como Flatpak ele mesmo) consegue enxergar.