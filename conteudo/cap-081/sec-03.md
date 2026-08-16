Com o modo leitura desabilitado, o SteamOS se transforma em um Arch Linux quase comum — e o `pacman` é o seu gerenciador de pacotes. Mas "quase" é a palavra-chave: o SteamOS usa repositórios próprios da Valve, uma cadeia de chaves própria e políticas de atualização que diferem do Arch puro. Instalar um pacote aqui é, na maior parte, igual ao Arch; *atualizar* o sistema com `pacman -Syu` é onde o perigo mora.

:::objetivos
- Entender a estrutura de repositórios do SteamOS (holo, jupiter, archlinux)
- Inicializar e populá-lo o keyring do pacman com `pacman-key`
- Instalar e remover pacotes de forma segura
- Compreender por que `pacman -Syu` completo é arriscado no Deck
:::

## Os repositórios do SteamOS

O SteamOS 3.6 é baseado no Arch Linux, mas não é um Arch comum. Ele combina repositórios da comunidade Arch com repositórios internos da Valve:

```terminal
$ grep -vE '^#|^$' /etc/pacman.conf
[holo]
Include = /etc/pacman.d/mirrorlist
[jupiter]
Include = /etc/pacman.d/mirrorlist
[core]
Include = /etc/pacman.d/mirrorlist
[extra]
Include = /etc/pacman.d/mirrorlist
[community]
Include = /etc/pacman.d/mirrorlist
[multilib]
Include = /etc/pacman.d/mirrorlist
[holo-rel]
Include = /etc/pacman.d/mirrorlist
```

Cada seção `[nome]` é um repositório. Os dois primeiros — `holo` e `jupiter` — são da Valve: o `holo` guarda os pacotes do sistema base customizado (incluindo o Gamescope, o compositor de jogo), e o `jupiter` traz o hardware do Deck (drivers, firmware do controle, configurações de TDP). Já `core`, `extra`, `community` e `multilib` são os repositórios oficiais do Arch Linux, espelhados para dar acesso a milhares de aplicações e bibliotecas.

O `holo-rel` no fim é o que mais confunde: é o repositório de *releases* da Valve, contendo a versão em imagem do sistema. Ele não é pensado para ser atualizado manualmente — ele acompanha o esquema A/B de imagem. Isso explica por que um `pacman -Syu` pode puxar versões de `holo-rel` conflitantes com a imagem já instalada.

## O keyring: por que o primeiro `pacman -S` falha

Se você tentar instalar algo logo após desabilitar o modo leitura, esbarra em erros de assinatura:

```terminal
$ sudo pacman -S htop
error: htop: signature from "SteamOS <...>" is unknown trust
:: File /var/cache/pacman/pkg/htop-3.3.0-1-x86_64.pkg.tar.zst is corrupted (invalid or corrupted package (PGP signature)).
```

O pacman exige que cada pacote tenha uma assinatura PGP válida de uma chave confiável. Num sistema recém-destravado, o keyring ainda não tem as chaves públicas dos mantenedores, então nada é confiável. A solução é inicializar e popular o keyring:

```terminal
$ sudo pacman-key --init
$ sudo pacman-key --populate archlinux holo
```

O `--init` gera o diretório de chaves local e a chave mestra. O `--populate archlinux holo` importa as chaves oficiais do Arch e as da Valve, marcando-as como confiáveis. Cada chave evita que um pacote adulterado (de um mirror malicioso ou de um ataque man-in-the-middle) seja instalado silenciosamente.

:::info
O keyring do Arch precisa ser atualizado periodicamente, porque os mantenedores trocam chaves e as antigas expiram. O pacote `archlinux-keyring` é o responsável. Num Deck, porém, você raramente vai precisar se preocupar com isso — o sistema é atualizado por imagem, e o keyring vem junto. Só re-popule quando o erro de confiança reaparecer após instalar algo.
:::

## Instalando e removendo pacotes

Com o keyring configurado, o fluxo é o padrão do Arch:

```terminal
$ sudo pacman -S htop nano git
resolving dependencies...
looking for conflicting packages...

Packages (3) htop-3.3.0-1  nano-8.0-1  git-2.47.0-1

Total Download Size:   9.51 MiB
Total Installed Size:  47.21 MiB

:: Proceed with installation? [Y/n] y
```

Primeiro um `pacman -Sy` (sincronizar metadados), depois a instalação. A remoção segue os mesmos moldes:

```terminal
$ sudo pacman -Rns htop nano
checking dependencies...

Packages (3) htop-3.3.0-1  nano-8.0-1  git-2.47.0-1

Total Removed Size:  47.21 MiB

:: Do you want to remove these packages? [Y/n] y
```

A opção `-Rns` remove o pacote (`-R`), suas dependências não usadas (`-s`) e os arquivos de configuração (`-n`). Para consultar o que já está instalado e que veio de fora da imagem, o `pacman -Q` é o mapa:

```terminal
$ pacman -Q | grep -vE 'holo|jupiter|steam|gamescope' | head -10
htop 3.3.0-1
nano 8.0-1
git 2.47.0-1
```

Essa lista — os pacotes que você adicionou manualmente — é a sua "receita de restauração" após um update. Guarde-a.

:::atencao
`pacman -Sy` (sincronizar) seguido de `pacman -S nome` sem passar por `-u` cria um estado conhecido como *partial upgrade*: alguns metadados ficam mais novos que os pacotes instalados, e dependências podem divergir. No Arch isso é fortemente desaconselhado. No SteamOS, a regra é ainda mais rígida: **não rode `-Syu` completo**. Prefira `pacman -S nome` (que já sincroniza e instala sem forçar upgrade de todo o sistema).
:::

## O perigo do `pacman -Syu` no Deck

A tentação é grande: num Arch comum, `sudo pacman -Syu` é o ritual semanal de deixar tudo em dia. No Steam Deck, ele é a receita para um sistema quebrado. Há três razões:

1. **O SteamOS é atualizado por imagem, não por pacote.** Quando a Valve publica um update, ele substitui a imagem inteira. Puxar versões novas via `pacman -Syu` cria um descompasso: seu sistema fica "mais novo" que a imagem, e o próximo update da Valve sobrescreve tudo de novo, gerando cacos.
2. **Bibliotecas sensíveis.** `mesa`, `glibc` e `gamescope` estão em versões exatas testadas em conjunto. Um upgrade parcial de `mesa` pode quebrar a renderização; de `glibc`, o boot.
3. **O `holo-rel`.** Como ele espelha a imagem de release, sincronizá-lo manualmente pode puxar a imagem seguinte sem o ritual A/B, e o sistema fica inconsistente.

:::perigo
Se um `pacman -Syu` já foi executado e o Deck começa a travar no boot, a recuperação não é trivial: baixe a imagem de recuperação do SteamOS, crie um pendrive bootável e reinstale o sistema (preservando a `/home` se escolher essa opção). Não há um "undo" simples para um upgrade de sistema que deu errado — o modo leitura protege exatamente contra esse cenário, e desabilitá-lo transfere a responsabilidade para você.
:::

## Estratégia para quem quer usar pacman mesmo assim

É possível usar o `pacman` de forma contida e segura. A receita:

- **Nunca rode `-Syu` completo.** Instale pacotes pontuais com `pacman -S nome`.
- **Instale poucos pacotes de sistema** (ferramentas que você realmente precisa fora do Flatpak).
- **Salve sua receita.** Guarde `pacman -Qq --explicit` num arquivo em `/home/deck` para reinstalar tudo após update.
- **Prefira Flatpak** para a grande maioria das aplicações — é o caminho oficial e sobrevive a updates.

```terminal
$ pacman -Qq --explicit > ~/meus-pacotes.txt
$ cat ~/meus-pacotes.txt
htop
nano
git
```

Com esse arquivo, após uma atualização de sistema você reaplica três linhas: desabilitar o modo leitura, popular o keyring e rodar `sudo pacman -S - < ~/meus-pacotes.txt`. A seção 9 automatiza exatamente isso.

## Resumo

- O SteamOS combina repositórios da Valve (`holo`, `jupiter`, `holo-rel`) com os oficiais do Arch (`core`, `extra`, `community`, `multilib`).
- `pacman-key --init` seguido de `--populate archlinux holo` resolve os erros de assinatura do primeiro uso.
- `pacman -S nome` instala; `pacman -Rns nome` remove pacote, dependências órfãs e arquivos de configuração.
- `pacman -Qq --explicit` lista os pacotes que você instalou manualmente — sua receita de restauração.
- `pacman -Syu` completo é arriscado: o SteamOS é atualizado por imagem, e um upgrade parcial de `mesa`/`glibc` pode quebrar o sistema.

## Exercícios

1. Liste seus repositórios com `grep -vE '^#|^$' /etc/pacman.conf` e identifique quais são da Valve e quais são do Arch. O que cada grupo fornece?
2. Execute `sudo pacman-key --init` e `sudo pacman-key --populate archlinux holo`. Depois instale um pacote pequeno (`htop` ou `neofetch`). O erro de assinatura sumiu?
3. Compare `pacman -Qq --explicit` com `pacman -Q | grep -vE 'holo|jupiter'`. Qual delas revela o que *você* instalou versus o que veio da imagem?
4. Instale dois pacotes, remova um com `-Rns` e verifique se as dependências órfãs foram limpas (`pacman -Qtdq` deve estar vazio).
5. **Desafio.** Cite uma versão de biblioteca sensível (ex.: `pacman -Q mesa`) *antes* de qualquer intervenção e guarde o valor. Explique por que atualizar essa biblioteca isoladamente, sem o resto do sistema, é mais perigoso do que instalar uma aplicação qualquer — e o que você faria para reverter se o jogo parasse de renderizar.