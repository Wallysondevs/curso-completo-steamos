A maior decisão de personalização no Steam Deck não é *qual* aplicativo instalar, mas *por qual* mecanismo. De um lado, o **Flatpak** (via loja Discover) entrega aplicações que sobrevivem às atualizações do sistema; de outro, o **Pacman** dá acesso a milhares de pacotes do Arch, mas tudo se perde no próximo update. Entender esse confronto — e onde cada um vence — é o que separa um Deck que "funciona bem" de um que "dá trabalho a cada update".

:::objetivos
- Comparar Flatpak e Pacman nos eixos de persistência, atualização e risco
- Entender o papel do Discover e do Aura no SteamOS
- Identificar o trade-off de segurança do modelo sandbox do Flatpak
- Escolher o mecanismo certo para cada tipo de aplicação
:::

## Dois gerenciadores, duas filosofias

O SteamOS habilita dois sistemas de instalação em paralelo, e eles têm filosofias opostas:

- **Flatpak** distribui aplicações empacotadas com suas próprias dependências e runtime, rodando em um sandbox. Elas instalam em `/var/lib/flatpak` (sistema) ou `~/.local/share/flatpak` (usuário), ambos **fora** da partição de imagem — logo, sobrevivem a updates. É o caminho oficial e recomendado pela Valve.
- **Pacman** é o gerenciador nativo do Arch, com acesso a todo o repositório (core, extra, community). Instala em `/usr`, dentro da imagem — logo, **some** a cada atualização de sistema.

A tabela resume o que importa:

| Eixo | Flatpak | Pacman |
|---|---|---|
| Persistência pós-update | Sim | Não (apagado) |
| Tamanho do catálogo | Aplicações desktop (menor) | Todo o Arch (gigante) |
| Isolamento/sandbox | Sim (cada app numa bolha) | Não (acesso total ao sistema) |
| Risco ao sistema | Quase nulo | Alto (pode quebrar `mesa`/`glibc`) |
| Necessita jailbreak | Não | Sim |

## O Discover e o Aura

No modo Desktop do SteamOS, as aplicações são instaladas pelo **Discover**, que é o front-end gráfico do Flatpak (por trás, usa o backend Flatpak). Você pesquisa, clica em instalar e pronto — o app aparece no menu.

```terminal
$ flatpak remote-list
Name    Options
flathub system
```

O repositório `flathub` é a fonte padrão. Toda aplicação instalada pelo Discover vem de lá (ou de um remote que você adicionar manualmente). O Discover no SteamOS com o KDE também pode listar pacotes de distro, mas esses são justamente os que exigem o modo leitura desabilitado.

Já o **Aura** é uma loja alternativa de flatpaks de terceiros, mantida pela comunidade do Deck, que agrega aplicações otimizadas para o Steam Deck que ainda não estão no flathub oficial — coisas como launchers especializados e utilitários de ajuste. Ela é adicionada como um remote extra:

```terminal
$ flatpak remote-add --if-not-exists aura https://repos.aura.com/aura.flatpakrepo
```

:::atencao
Adicionar remotes de terceiros (Aura, ou qualquer repo comunitário) expande o que você pode instalar, mas transfere a confiança: os pacotes dali não passam pela revisão do flathub. Instale de um remote externo só quando confiar no mantenedor, e preste atenção às permissões que o Flatpak pede no momento da instalação.
:::

## Instalando e inspecionando Flatpaks

Pela linha de comando, o fluxo é direto:

```terminal
$ flatpak install flathub org.mozilla.firefox
Looking for matches…
Required runtime for org.mozilla.firefox/x86_64/stable found in remote flathub
Do you want to install it? [Y/n] y
```

E para listar e inspecionar o que está instalado:

```terminal
$ flatpak list --app
Name                Application ID                 Version    Branch
Firefox             org.mozilla.firefox            128.0       stable
```

Uma característica essencial do Flatpak é a **permissão**. Cada aplicação declara, no momento da instalação, quais recursos ela pode acessar (rede, home, USB, etc.). Você pode inspecionar e até aumentar/restringir essas permissões:

```terminal
$ flatpak permissions org.mozilla.firefox
```

Isso é poder — e é também a principal vantagem de segurança do Flatpak sobre o Pacman: um aplicativo via Pacman roda como se fosse parte do sistema, com acesso total; um Flatpak vive numa bolha com acesso limitado ao que declarou.

## Quando o Pacman é a escolha certa

O Flatpak cobre bem aplicações *desktop* — navegador, editor, ferramentas gráficas. Mas há categorias onde ele não alcança, e é aí que o Pacman brilha (mesmo com o custo do jailbreak):

- **Ferramentas de linha de comando** que você quer disponíveis globalmente (`rsync`, `htop`, `git`, `zsh`).
- **Bibliotecas e compiladores** que programas locais precisam (`gcc`, `make`, `pkg-config`).
- **Software de sistema** que não existe como Flatpak (certos daemons, drivers).

A regra prática: instale como Flatpak tudo que é aplicação interativa; recorra ao Pacman apenas para o que não tem equivalente Flatpak e que você aceita reinstalar a cada update (vide [seção 3](#/cap-081/sec-03)).

:::dica
Se um CLI que você quer também existe como Flatpak mas você prefere um binário "solto", uma terceira via é baixar um binário estático e colocá-lo em `~/bin/` (que fica na home e sobrevive a updates). Isso evita tanto o sandbox do Flatpak quanto a efemeridade do Pacman — perfeito para ferramentas simples de um único executável.
:::

## O modelo híbrido na prática

Um Deck bem configurado não escolhe um lado — combina os três mecanismos conforme a natureza de cada coisa:

```terminal
$ # 1. Aplicações interativas -> Flatpak (sobrevive a updates)
$ flatpak install flathub org.mozilla.firefox net.davidotek.pupgui2

$ # 2. Ferramentas de sistema essenciais -> Pacman (reinstalar após update)
$ sudo pacman -S htop rsync git

$ # 3. Binários isolados -> ~/bin (persistente, sem sandbox)
$ mkdir -p ~/bin
$ curl -L https://exemplo.com/ferramenta -o ~/bin/ferramenta && chmod +x ~/bin/ferramenta
```

Esse modelo híbrido maximiza persistência (Flatpak e `~/bin` sobrevivem) enquanto aceita o custo pontual de reinstalar poucos pacotes de sistema. A seção 9 transforma essa estratégia em um script automatizado.

## Resumo

- Flatpak instala em `/var` ou `~/.local` e sobrevive a updates; Pacman instala em `/usr` e é apagado a cada update.
- O Discover é o front-end do Flatpak; o Aura é um remote comunitário para apps otimizados ao Deck.
- Flatpak oferece sandbox e permissões inspecionáveis (`flatpak permissions`); Pacman dá acesso total ao sistema.
- Use Flatpak para apps interativos, Pacman para CLIs/bibliotecas sem equivalente, e `~/bin` para binários isolados persistentes.
- O modelo ideal é híbrido: cada mecanismo para a categoria de software que ele atende melhor.

## Exercícios

1. Liste seus remotes Flatpak (`flatpak remote-list`) e as aplicações instaladas (`flatpak list --app`). Quantos vieram do flathub e quantos de outro remote?
2. Instale uma aplicação via Discover e outra via `flatpak install` na linha de comando. Compare a experiência — ambas chegam ao mesmo lugar?
3. Inspecione as permissões de uma aplicação Flatpak com `flatpak permissions <app-id>` e `flatpak info --show-permissions <app-id>`. Que recursos ela acessa?
4. Adicione o remote Aura (`flatpak remote-add --if-not-exists aura <url>`) e instale uma aplicação comunitária de lá. Depois remova o remote com `flatpak remote-delete aura`. O que acontece com o app instalado?
5. **Desafio.** Escolha uma ferramenta CLI (como `rsync`) e justifique, por escrito, qual dos três mecanismos (Flatpak, Pacman ou `~/bin`) é o mais adequado para ela *na sua* configuração — considerando persistência, sandbox e facilidade de reinstalação. Compare sua resposta com a de um colega ou com a recomendação de um guia confiável.