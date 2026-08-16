Até aqui falamos de "Flathub" como se fosse sinônimo de Flatpak. Mas o Flatpak como tecnologia suporta múltiplos *remotes* — repositórios remotos que servem aplicativos e runtimes. O Flathub é o maior e mais conhecido deles, mas não é o único. E no SteamOS, a configuração de remotes tem particularidades importantes que afetam diretamente o que o Discover mostra.

Entender a arquitetura de remotes é o que permite instalar aplicativos que não estão no Flathub, adicionar repositórios corporativos internos ou até mesmo montar seu próprio remote Flatpak. O Discover traduz essa arquitetura em uma interface simples, mas você precisa saber o que está acontecendo por baixo.

:::objetivos
- Listar e inspecionar remotes Flatpak configurados no SteamOS
- Entender o que é o Flathub e por que ele é o único remote padrão
- Adicionar e remover remotes pelo terminal e pelo Discover
- Reconhecer a diferença entre remotes de aplicativos e de runtimes
:::

## O que é um remote Flatpak

Um remote Flatpak é um servidor HTTP que serve dois tipos de conteúdo:

1. **Resumos** — índices assinados que descrevem quais aplicativos e runtimes estão disponíveis, com versões, checksums e metadados
2. **Objetos** — os arquivos binários propriamente ditos, organizados em formato OSTree (o mesmo usado pelo Fedora Silverblue e pelo rpm-ostree)

Quando você abre o Discover e ele mostra aplicativos, você está vendo o índice do Flathub, que foi baixado silenciosamente em background e armazenado em cache em `/var/lib/flatpak/repo/`. O índice é assinado com GPG — o Flatpak verifica a assinatura antes de confiar nos metadados.

```terminal
$ flatpak remotes
Nome    Opções
flathub system
```

No SteamOS, a lista de remotes é enxuta: `flathub` como remote de sistema. O sufixo `system` indica que ele está configurado no escopo de sistema (em `/var/lib/flatpak/`), não no escopo de usuário (em `~/.local/share/flatpak/`). Isso significa que todos os usuários do Steam Deck compartilham o mesmo remote e as mesmas instalações de sistema.

Para ver mais detalhes:

```terminal
$ flatpak remote-list -d
flathub (system)
  URL: https://dl.flathub.org/repo/
  Title: Flathub
  Comment: Central repository of Flatpak applications
  Filter: 
  Priority: 1
  Options: 
```

O campo `Priority` define a ordem de consulta quando há mais de um remote. O campo `Filter` permite restringir quais aplicativos de um remote são visíveis — útil em ambientes corporativos que querem expor apenas um subconjunto do Flathub aos funcionários.

## Flathub: o remote universal

Flathub é o repositório oficial do projeto Flatpak, mantido pela comunidade e hospedado pela GNOME Foundation. Ele distribui mais de 2.500 aplicativos e é o que a grande maioria das distribuições Linux que adotam Flatpak configuram como padrão.

O Flathub opera com dois remotes lógicos:

- `flathub` — aplicativos estáveis, versão `stable`
- `flathub-beta` — canal beta, para quem quer testar versões de desenvolvimento

No SteamOS, apenas o `flathub` (estável) vem configurado. Se você quiser testar betas:

```terminal
$ flatpak remote-add --if-not-exists flathub-beta https://flathub.org/beta-repo/flathub-beta.flatpakrepo
$ flatpak remotes
Nome        Opções
flathub     system
flathub-beta user
```

Note que `flathub-beta` aparece como `user` — ele foi adicionado no escopo do usuário, não no de sistema. Para adicionar como sistema, use `flatpak remote-add --system`.

:::info
O Flathub não é mantido pela Valve nem pelo KDE. É um projeto independente, governado por um comitê com membros da GNOME, KDE, Red Hat e outros. O SteamOS o adota como fonte padrão porque é a solução de distribuição de aplicativos mais madura do ecossistema Flatpak.
:::

## Adicionando remotes adicionais

Nem todo aplicativo está no Flathub. Alguns projetos mantêm seus próprios remotes:

- **Fedora Flatpaks** — `https://registry.fedoraproject.org/` (aplicativos empacotados pelo Fedora)
- **Element** — `https://packages.element.io/flatpak/` (cliente Matrix oficial)
- **WineHQ** — remotes mantidos pela comunidade para rodar aplicativos Windows

Para adicionar um remote, use o arquivo `.flatpakrepo`:

```terminal
$ flatpak remote-add --system fedora https://registry.fedoraproject.org/repo/stable.flatpakrepo
$ flatpak remotes
Nome        Opções
fedora      system
flathub     system
```

No Discover, vá em Configurações → Fontes de Software. Você verá a lista de remotes configurados. O Discover permite adicionar novos remotes colando a URL do `.flatpakrepo` ou selecionando de uma lista pré-configurada. Para remover, clique no remote e escolha "Remover".

:::perigo
Adicionar um remote de terceiros é confiar no mantenedor daquele remote. Um remote Flatpak malicioso pode servir aplicativos com permissões abusivas ou código alterado. Só adicione remotes cuja origem você confia e cuja URL você verificou diretamente.
:::

## Remotes de runtime vs. remotes de aplicativo

Existe uma distinção importante: o Flathub não serve apenas aplicativos; ele também serve **runtimes** — os ambientes base sobre os quais os aplicativos rodam.

Quando você instala qualquer aplicativo do Flathub, ele declara dependência de um runtime:

```terminal
$ flatpak info org.gimp.GIMP | grep Runtime
Runtime: org.gnome.Platform/x86_64/47
```

Esse runtime (`org.gnome.Platform`) também é baixado do Flathub. Se você adicionar um remote de terceiros que serve aplicativos baseados num runtime diferente, esse runtime precisa estar acessível em algum remote configurado, ou a instalação falha.

Na prática, para o usuário do Steam Deck, essa arquitetura é invisível — o Discover resolve as dependências automaticamente. Mas se você estiver montando um ambiente offline ou com rede restrita, precisa garantir que os remotes de runtime estejam acessíveis.

```terminal
$ flatpak list --runtime
org.freedesktop.Platform/x86_64/24.08
org.kde.Platform/x86_64/6.7
org.gnome.Platform/x86_64/47
```

Runtimes instalados não são aplicativos — você não os abre. Eles são as bibliotecas e serviços que os aplicativos usam. Pense neles como o "sistema operacional dentro do contêiner".

## Resumo

- Remotes Flatpak são servidores HTTP que distribuem índices assinados e binários em formato OSTree.
- O SteamOS vem com o Flathub configurado como remote de sistema; `flatpak remotes` lista os remotes ativos.
- O Flathub é o repositório oficial do projeto Flatpak, com mais de 2.500 aplicativos, mantido pela comunidade.
- Remotes adicionais podem ser adicionados com `flatpak remote-add` ou pelo Discover em Configurações → Fontes de Software.
- Runtimes também vêm de remotes; sem o remote do runtime, aplicativos que dependem dele não instalam.

## Exercícios

1. Execute `flatpak remotes` e `flatpak remote-list -d`. Anote a URL, a prioridade e o título de cada remote configurado na sua máquina.
2. No Discover, navegue até Configurações → Fontes de Software e confirme que a lista bate com a saída do terminal. Se houver um remote que você não reconhece, investigue sua origem.
3. Adicione o remote flathub-beta com `flatpak remote-add --user flathub-beta https://flathub.org/beta-repo/flathub-beta.flatpakrepo`. Abra o Discover e veja se ele aparece. Depois, remova-o com `flatpak remote-delete flathub-beta`.
4. Liste os runtimes instalados com `flatpak list --runtime`. Quantos runtimes diferentes você tem? Cada um ocupa quanto espaço? (Use `flatpak list --runtime --columns=name,size`.)
5. **Desafio.** Simule um ambiente com dois remotes: instale um aplicativo do flathub e depois adicione o remote do Fedora (`https://registry.fedoraproject.org/repo/stable.flatpakrepo`). Tente instalar um aplicativo do Fedora (`fedora:org.gnome.Weather`). Funcionou? O runtime usado pelo aplicativo do Fedora é o mesmo do Flathub ou é diferente? Investigue com `flatpak info`.