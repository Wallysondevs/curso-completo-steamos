Se você só pode escrever em `/home` e a raiz é imutável, como instalar um navegador, um editor de código ou um player de mídia? A resposta oficial — e a única que sobrevive a atualizações — é o Flatpak. Esta seção explica por que o Flatpak foi escolhido, como usá-lo por terminal e como ele se integra ao resto do sistema sem quebrar o contrato do SteamOS.

:::objetivos
- Entender por que o Flatpak é a via oficial de apps no SteamOS
- Listar, instalar e remover aplicativos com `flatpak`
- Diferenciar entre instalação system-wide e no perfil do usuário
- Comparar Flatpak com pacman e entender a vantagem da sandbox
:::

## Por que Flatpak, e por que agora

O SteamOS herda o pacman do Arch, mas herdá-lo não significa usá-lo como ferramenta de usuário final. A Valve precisava de uma forma de instalar aplicativos que não tocasse na raiz do sistema. O Flatpak entrega exatamente isso: cada aplicativo roda numa **sandbox**, isolado do sistema hospedeiro, com suas próprias bibliotecas (as *runtimes*), sem escrever em `/usr` ou `/etc`.

Isso significa que você instala o Firefox ou o VLC sem alterar nenhum arquivo do sistema. Quando o SteamOS recebe uma atualização A/B, a build nova não precisa saber o que você instalou — os Flatpaks estão em `/home` (ou em `/var/lib/flatpak`) e seguem funcionando.

```terminal
$ flatpak remote-list
Name    Options
flathub system

$ flatpak list --app | head -10
Nome                       ID da aplicação                     Versão     Ramo
Firefox                    org.mozilla.firefox                 125.0.2    stable
VLC                        org.videolan.VLC                    3.0.21     stable
Discord                    com.discordapp.Discord               0.0.53     stable
Spotify                    com.spotify.Client                   1.2.35     stable
```

A primeira coluna dá o nome amigável; a segunda, o identificador do Flatpak, que é o que você usa nos comandos. O remoto `flathub` é o repositório padrão configurado pela Valve, e em um Deck novo é a única fonte de aplicativos.

## Flatpak por linha de comando

O Discover é o caminho gráfico, mas quem quer automação ou diagnóstico prefere o terminal. O comando base é `flatpak`, com subcomandos que lembram o `apt` ou o `dnf` — `search`, `install`, `remove`, `update`, `list`.

```terminal
$ flatpak search libreoffice
Nome           Descrição                            ID da aplicação                 Versão    Ramo
LibreOffice     LibreOffice suite                   org.libreoffice.LibreOffice     24.2.3    stable
$ flatpak install org.libreoffice.LibreOffice
Looking for matches…
Found similar ref(s) for ‘org.libreoffice.LibreOffice’ in remote ‘flathub’ (system).
Use this remote? [Y/n]: Y

        ID                               Ramo            Op        Remoto    Download
 1. [✓] org.libreoffice.LibreOffice.Locale stable         i        flathub    < 1,0 MB (partial)
 2. [✓] org.libreoffice.LibreOffice     stable            i        flathub   < 346,9 MB

Installation complete.
```

O `flatpak install` baixa o aplicativo e sua runtime (o conjunto de bibliotecas base). Uma runtime é como um "mini sistema operacional" que o Flatpak usa para rodar o app sem depender do que está em `/usr`. A instalação pode levar minutos no primeiro app (por causa da runtime), mas os apps seguintes que usam a mesma runtime instalam rápido.

```terminal
$ flatpak remove org.libreoffice.LibreOffice
        ID                               Ramo            Op
 1. [-] org.libreoffice.LibreOffice     stable            r
 2. [-] org.libreoffice.LibreOffice.Locale stable         r

Uninstall complete.
```

O `flatpak remove` desinstala o app. Note que ele não remove automaticamente a runtime — outros apps podem depender dela. Para limpar runtimes órfãs, use `flatpak uninstall --unused`.

:::dica
Para rodar um Flatpak pelo terminal (útil para ver erros de inicialização), use `flatpak run` seguido do ID:

```terminal
$ flatpak run org.mozilla.firefox
```

Se o Firefox não abre pelo Discover mas funciona com `flatpak run`, o problema está no atalho do desktop, não no Flatpak. Diagnóstico rápido e certeiro.
:::

## O que Flatpak significa para o SteamOS

A decisão pelo Flatpak não é um detalhe técnico secundário — é uma decisão de arquitetura tão importante quanto a imutabilidade. Ela define o que o usuário pode e o que não pode tocar.

```terminal
$ flatpak info org.mozilla.firefox
Firefox - Fast, Private & Safe Web Browser

          ID: org.mozilla.firefox
         Ref: app/org.mozilla.firefox/x86_64/stable
        Arch: x86_64
      Branch: stable
     License: MPL-2.0
       Origin: flathub
   Collection: org.flathub.Stable
Installation: system
   Installed: 218,4 MB
     Runtime: org.freedesktop.Platform/x86_64/23.08
         Sdk: org.freedesktop.Sdk/x86_64/23.08

      Commit: 7d3cf1...
      Parent: 9a2e4b...
   Installed: 15 abr 2025, 10:45:22
```

O campo `Runtime` mostra qual runtime o app usa (`org.freedesktop.Platform 23.08`). Isso é a pilha de bibliotecas que o Flatpak fornece. O app NÃO está usando o `glibc` e o `libstdc++` do sistema — está usando os que vieram na runtime, isolados. É por isso que o Flatpak sobrevive ileso a atualizações de sistema.

:::info
A Valve inclui o Flatpak de fábrica no SteamOS e pré-configura o Flathub. Mas não impede você de adicionar outros remotos. Se um app está disponível em Flatpak mas não no Flathub, você pode adicionar o remoto com `flatpak remote-add` e instalá-lo de lá. A sandbox continua valendo.
:::

## Flatpak vs pacman: o resumo tático

| Característica | Flatpak | pacman |
|---|---|---|
| Onde escreve | `/home` e `/var/lib/flatpak` | `/usr`, `/etc`, `/bin` |
| Sobrevive a updates do SteamOS? | Sim | Não |
| Sandbox (isolamento)? | Sim | Não |
| Integra com Discover? | Sim | Não |
| Pode quebrar o boot? | Não | Sim |

Essa tabela não é "Flatpak é melhor que pacman". É "Flatpak é a ferramenta correta para o contrato do SteamOS". O `pacman` existe, mas é ferramenta da Valve para construir a imagem do sistema, não do usuário para instalar apps. Cada coluna da tabela é uma consequência direta da imutabilidade e das atualizações A/B.

## Resumo

- Flatpak é a via oficial de instalação de aplicativos no SteamOS; o Flathub é o repositório padrão.
- Aplicativos Flatpak rodam em sandbox com runtimes próprias, sem tocar na raiz do sistema.
- `flatpak search`, `install`, `remove`, `list` e `run` cobrem todas as operações do dia a dia.
- Flatpaks sobrevivem a atualizações A/B porque vivem em `/home` e `/var`, não na partição de sistema.
- O `pacman` está disponível mas é a ferramenta da Valve para construir imagens; instalar com ele quebra na próxima atualização.
- O Discover (KDE) é o front-end gráfico do Flatpak para o usuário comum.

## Exercícios

1. Rode `flatpak remote-list` e anote os repositórios configurados. Depois use `flatpak search` para procurar um aplicativo que você usa no dia a dia.
2. Instale um aplicativo pequeno com `flatpak install` e confira a instalação com `flatpak list --app`. Anote o ID do Flatpak, o tamanho e a runtime.
3. Execute `flatpak info <id-do-app>` e copie os campos `Runtime` e `Installation`. Explique por que o app instalado como `system` não quebra a regra da imutabilidade.
4. Remova o aplicativo com `flatpak remove`, depois execute `flatpak uninstall --unused` para limpar runtimes órfãs. O que `--unused` faz?
5. **Desafio.** Compare o tamanho em disco de um app instalado via Flatpak (`flatpak info` mostra) com o tamanho que ele teria se fosse instalado via `pacman` (calcule estimando pelo número de dependências). Explique o conceito de "runtime compartilhada" e por que o primeiro app Flatpak consome mais espaço que o segundo app do mesmo tipo.