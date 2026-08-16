Se há um diretório no Steam Deck que realmente pertence a você, é `/home/deck`. É o único ponto onde jogos, saves, configurações e arquivos pessoais vivem de forma permanente, fora da imagem imutável. Quase tudo que importa — da biblioteca Steam aos documentos — está debaixo dessa pasta, então vale conhecer sua anatomia em detalhe.

:::objetivos
- Localizar a partição que hospeda o `/home`
- Interpretar a estrutura de subdiretórios de `/home/deck`
- Entender onde jogos e salvamentos são armazenados
- Identificar o que é seguro apagar e o que não é
:::

## Onde fica e quanto espaço tem

No `lsblk` da primeira seção, o `/home` apareceu montado numa partição grande (`mmcblk0p8`, no exemplo com 43 GB). É a maior fatia do disco de propósito: ela guarda o conteúdo que cresce sem limite — jogos de dezenas de gigabytes, shaders compilados e caches. Confirme a montagem:

```terminal
$ findmnt /home
TARGET SOURCE        FSTYPE OPTIONS
/home  /dev/mmcblk0p8 ext4   rw,relatime
```

O comando `findmnt` resume origem, tipo e opções numa linha limpa — mais direto que `mount` quando você quer olhar um único ponto. A opção `rw` confirma que este é território de escrita livre. Diferente do root imutável, aqui não há proteção contra você mesmo: apagar um arquivo em `/home` é apagar de verdade.

## A anatomia de /home/deck

A conta do Steam Deck chama-se `deck`, e o SteamOS organiza seus arquivos de usuário em subdiretórios que seguem a convenção XDG. Muitos começam com um ponto, o que os torna ocultos no `ls` comum:

```terminal
$ ls -a /home/deck
.              .config       .local        .steam
..             .cache        .ssh          Desktop
.bashrc        .flatpak      .pokemmo      Documents
.bash_profile  .gaming       .steamos      Downloads
```

Cada um tem um papel:

| Diretório | Conteúdo |
|---|---|
| `.steam` | Instalação do cliente Steam, bibliotecas e Proton |
| `.local` | Dados de aplicações, Flatpak e arquivos de desktop |
| `.config` | Configurações de aplicativos individuais |
| `.cache` | Arquivos temporários volumosos (shaders, thumbnails) |
| `.flatpak` | Controle/registro do Flatpak e seus runtimes |
| `Documents` | Documentos e com frequência os saves de jogos não-Steam |
| `Downloads` | Arquivos baixados pelo navegador |

Note que a maioria das pastas segue o padrão **XDG Base Directory**: `.config`, `.cache` e `.local/share` formam a espinha dorsal de onde os programas guardam estado. É um padrão comum a qualquer Linux, mas no SteamOS ele ganha peso redobrado por ser um dos poucos lugares graváveis.

## A biblioteca de jogos em steamapps

A instalação de fato dos jogos não fica espalhada — ela fica em `steamapps`, que por padrão mora dentro de `.steam/steam`. Listando por tamanho você vê logo quem é o dono do disco:

```terminal
$ ls ~/.steam/steam/steamapps
appmanifest_*.acf   common/          libraryfolders.vdf   shadercache/
```

- `common/` — diretório raiz de cada jogo instalado, um subdiretório por título.
- `appmanifest_*.acf` — arquivos de manifest que descrevem cada jogo instalado.
- `libraryfolders.vdf` — registra as pastas de biblioteca (permite adicionar um SD card).
- `shadercache/` — cache de shaders compilados pelo Vulkan, que pode ocupar vários GB.

Aqui vale uma distinção importante: os **jogos** ficam em `common/`, mas os **saves** costumam ir para um lugar totalmente diferente — dentro de `steamapps/compatdata` (quando rodam via Proton) ou em `~/.local/share` (para nativos). Confundir os dois é uma das causas mais comuns de "perdi meu save".

:::dica
Um cartão SD inserido no Steam Deck aparece como uma biblioteca extra e pode ser configurado dentro do Steam. O caminho dele é algo como `/run/media/deck/...`. Você pode mover jogos entre bibliotecas sem reinstalar, usando a interface do Steam em vez de copiar os arquivos na mão.
:::

## O que pesa e o que pode ser limpo

O `/home` enche rápido, e nem sempre é por jogos. Caches e shaders podem superar facilmente a soma dos títulos leves. Veja os maiores consumidores com `du`:

```terminal
$ du -sh ~/.steam/steam/steamapps/common/* 2>/dev/null | sort -h | tail -5
1.2G    /home/deck/.steam/steam/steamapps/common/Stardew Valley
4.8G    /home/deck/.steam/steam/steamapps/common/Slime Rancher 2
12G     /home/deck/.steam/steam/steamapps/common/DOOM Eternal
38G     /home/deck/.steam/steam/steamapps/common/Apex Legends
```

O `du -sh` soma o tamanho de cada pasta e o `sort -h` ordena por tamanho "humano" (não alfabético). Combinados com `tail`, você fica apenas com os cinco maiores. Shaders são limpos com segurança pela interface do Steam (em Configurações → Downloads), nunca apagando `shadercache` na mão se não souber o que está fazendo.

:::atencao
Não apague arquivos dentro de `steamapps` manualmente para "desinstalar" um jogo — isso deixa o manifest `.acf` órfão e o Steam pode ficar confuso. Desinstale sempre pela interface do Steam, que remove jogo e manifest juntos.
:::

## Resumo

- O `/home` fica numa partição própria e grande, montada com `rw`.
- `/home/deck` segue o padrão XDG, com `.config`, `.cache`, `.local` e `.steam`.
- Os jogos ficam em `~/.steam/steam/steamapps/common`, descritos por arquivos `.acf`.
- Saves ficam em `compatdata` (Proton) ou `~/.local/share` (nativos), não junto aos jogos.
- `du -sh` e `sort -h` revelam os maiores consumidores de espaço do disco.

## Exercícios

1. Rode `findmnt /home` e escreva a FSTYPE e as opções. Por que aqui a opção é `rw` e não `ro`?
2. Liste os subdiretórios de `/home/deck` com `ls -a` e classifique cada um como XDG ou específico do SteamOS.
3. Descubra o seu maior jogo com `du -sh ~/.steam/steam/steamapps/common/* | sort -h | tail -1`.
4. Compare o tamanho de `~/.steam/steam/steamapps/shadercache` com o total de `/home`. O cache é proporcionalmente grande?
5. **Desafio.** Localize a pasta de saves de um jogo nativo (não-Proton) usando `ls ~/.local/share`. Depois explique por que ela não está dentro de `common/`.
