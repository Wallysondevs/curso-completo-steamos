A hierarquia de diretórios de um sistema Linux não é um emaranhado aleatório — ela segue o Filesystem Hierarchy Standard (FHS), um conjunto de convenções com décadas de idade que determina onde cada coisa deve ficar. No Steam Deck, conhecer essa estrutura não é pedantismo: é o que permite encontrar arquivos de configuração sem vasculhar tudo, mover dados para o SSD externo sem quebrar atalhos e saber exatamente onde seus experimentos do `~/lab` terminam e o sistema começa.

:::objetivos
- Compreender a lógica do FHS e as pastas que importam no SteamOS
- Definir uma convenção pessoal para projetos, scripts e backups em `~/lab`
- Separar dados de usuário, cache e configuração dentro do `$HOME`
- Utilizar links simbólicos para redirecionar pastas grandes para mídia externa
- Manter o diretório home limpo com uma política de nomes consistente
:::

## A árvore que o SteamOS usa

O SteamOS, como derivado do Arch Linux, segue o FHS com adaptações mínimas. As pastas que você encontra ao digitar `ls /` têm papéis bem definidos:

| Diretório | Conteúdo | Modificável? |
|---|---|---|
| `/bin` | Binários essenciais (link para `/usr/bin`) | Não |
| `/boot` | Kernels e initramfs | Cuidado |
| `/dev` | Dispositivos (virtual) | Kernel decide |
| `/etc` | Configurações do sistema | Sim, via sudo |
| `/home` | Dados dos usuários | Sim |
| `/run` | Dados voláteis em RAM | Não persiste |
| `/tmp` | Arquivos temporários | Limpo no boot |
| `/usr` | Programas, bibliotecas, docs | Pacotes decidem |
| `/var` | Logs, cache, spool | Parcialmente |

No Steam Deck, `/home/deck` é onde sua vida digital acontece. `/etc` guarda desde a configuração do pacman até as regras do udev. `/var/log` (ou melhor, o journal binário) concentra os diagnósticos. E `/run/media/deck` aparece quando você insere um SD card — é o ponto de montagem automática para mídia removível.

```terminal
$ ls -1 /
bin@
boot/
dev/
etc/
home/
lib@
lib64@
lost+found/
mnt/
opt/
proc/
root/
run/
sbin@
srv/
sys/
tmp/
usr/
var/
$ ls -1 /home/deck
Desktop/
Documents/
Downloads/
Music/
Pictures/
Videos/
lab/
.local/
.config/
.cache/
```

Note que diretórios como `/proc`, `/sys` e `/dev` não existem no disco — são sistemas de arquivos virtuais mantidos pelo kernel, exatamente como visto no [capítulo sobre o kernel](#/cap-001/sec-01). Não perca tempo procurando arquivos reais ali.

## O `~/lab` como centro de operações

Ao longo deste curso, você usou `~/lab` como diretório de experimentos. Manter essa prática depois do curso é o primeiro hábito de organização: tudo que é volátil, experimental ou descartável vive em `~/lab`. Scripts que você quer preservar ficam em `~/bin`. Projetos maiores ganham subdiretórios com nome descritivo e data.

```terminal
$ tree -L 1 ~/lab
/home/deck/lab/
├── backups/
├── benchmarks/
├── checkups/
├── downloads/
├── scripts/
├── notas.md
└── README.md
```

A convenção importa mais que a estrutura exata. O que não funciona é misturar ISOs baixadas com scripts de backup e notas de aula num mesmo diretório sem ordem. Dê nomes que um estranho entenderia: `benchmark-2026-07`, não `teste2`.

:::dica
Crie um `README.md` na raiz do `~/lab` explicando o que cada subdiretório contém. Em seis meses, quando você voltar a um projeto interrompido, esse arquivo vai ser a diferença entre retomar em 30 segundos ou desistir em 5 minutos.
:::

## Separando configuração, cache e dados

O `$HOME` de um sistema Linux moderno acumula três tipos de arquivo, e misturá-los mentalmente é a origem de muita confusão:

**Dados** são seus: documentos, fotos, saves de jogos, scripts, projetos. Eles ficam em `~/Documents`, `~/Pictures`, `~/lab`, `~/bin`. Se você formatar o sistema, são esses que você quer preservar.

**Configuração** são arquivos que os programas escrevem para lembrar suas preferências. Ficam em `~/.config` (a maioria) ou em `~/.local/share`. São importantes, mas regeneráveis ou restauráveis de backup.

**Cache** são arquivos que os programas baixam e recalculam à vontade. Ficam em `~/.cache`. Podem ser apagados a qualquer momento sem perda de dados — no máximo, o programa fica mais lento na próxima execução enquanto reconstrói o cache.

```terminal
$ du -sh ~/.cache ~/.config ~/.local
4.2G	/home/deck/.cache
892M	/home/deck/.config
1.3G	/home/deck/.local
```

O cache costuma ser o maior dos três. A seção 3 deste capítulo mostra como limpá-lo com segurança. Por ora, o hábito é saber que ele existe e não confundi-lo com dados importantes.

## Links simbólicos: movendo sem quebrar

O SSD interno do Steam Deck tem capacidade limitada. Cedo ou tarde você vai querer mover a compatdata do Proton, os shaders compilados ou uma biblioteca Steam inteira para um cartão SD. A ferramenta para isso é o link simbólico: um atalho que engana os programas, fazendo-os acreditar que o diretório ainda está no lugar original.

```terminal
$ du -sh ~/.local/share/Steam/steamapps/compatdata
12G	/home/deck/.local/share/Steam/steamapps/compatdata
$ mv ~/.local/share/Steam/steamapps/compatdata /run/media/deck/sdcard/compatdata
$ ln -s /run/media/deck/sdcard/compatdata ~/.local/share/Steam/steamapps/compatdata
$ ls -la ~/.local/share/Steam/steamapps/ | grep compatdata
lrwxrwxrwx 1 deck deck 44 Jul 12 14:02 compatdata -> /run/media/deck/sdcard/compatdata
```

O programa continua acessando o caminho de sempre, mas o kernel redireciona a operação para o SD card. Isso funciona com qualquer diretório, desde que o SD card esteja montado no momento do acesso.

:::atencao
Mover um diretório para mídia removível com link simbólico só funciona se a mídia estiver sempre montada no mesmo ponto. Se você esquecer de inserir o SD card e tentar abrir um jogo cujo `compatdata` está lá, o jogo falha. A convenção é usar `/run/media/deck/NOME_DO_CARTÃO` e nunca remover o cartão durante o uso. Para dados que você realmente não pode perder, prefira um SSD externo com ponto de montagem fixo em `/etc/fstab`.
:::

## Convenção de nomes: o hábito mais barato

Nomes consistentes de arquivos e diretórios são a forma mais barata de organização — custam zero bytes e economizam horas de busca. Algumas regras que sobrevivem a qualquer ferramenta:

- **Sem espaços nos nomes de scripts e projetos.** Use `hifens` ou `snake_case`. `meu-script.sh` é melhor que `meu script.sh`, que exige aspas ou escape no terminal.
- **Datas no formato ISO 8601.** `2026-07-12` ordena alfabeticamente e ninguém confunde mês com dia. `12-07-2026` não ordena e confunde tudo.
- **Prefixo numérico para ordenação forçada.** `01-introducao.md`, `02-instalacao.md` garantem a ordem que você quer, não a ordem alfabética dos títulos.
- **Extensão que indica o conteúdo.** `.sh` para bash, `.md` para markdown, `.conf` para configuração. O sistema não exige extensão, mas você, humano, precisa dela.

```terminal
$ ls -1 ~/lab/backups/
01-home-2026-07-01.tar.gz
02-etc-2026-07-01.tar.gz
03-flatpak-list-2026-07-01.txt
```

Essa lista se explica sozinha, mesmo um ano depois.

## Resumo

- O FHS organiza o sistema em `/etc`, `/usr`, `/var`, `/home`; conheça a função de cada um antes de fuçar.
- `~/lab` é seu espaço de experimentação; `~/bin` guarda scripts úteis; `~/.config` e `~/.cache` são dos programas.
- Dados, configuração e cache são três coisas diferentes — saiba qual é qual na hora de fazer backup.
- Links simbólicos (`ln -s`) movem diretórios grandes para mídia externa sem quebrar programas.
- Nomes consistentes com datas ISO, snake_case e extensões explícitas são o hábito de organização mais barato que existe.

## Exercícios

1. Mapeie seu `$HOME`: execute `du -sh ~/* ~/.* 2>/dev/null | sort -h` e liste os cinco maiores diretórios. Para cada um, classifique como dados, configuração ou cache.
2. Crie um `README.md` no seu `~/lab` descrevendo a estrutura atual. Se ainda não tem estrutura, defina uma com pelo menos três subdiretórios e documente.
3. Escolha um diretório grande de cache ou compatdata e mova-o para um SD card usando `mv` seguido de `ln -s`. Teste se o jogo ou programa correspondente ainda funciona.
4. Renomeie cinco arquivos ou diretórios seus que tenham espaços ou datas ambíguas para a convenção ISO 8601 com snake_case. Anote o antes e o depois.
5. **Desafio.** Escreva um script `~/bin/symlink-report` que lista todos os links simbólicos dentro do seu `$HOME` que apontam para fora do `$HOME` e mostra se o destino ainda existe. Use `find ~ -type l -exec test ! -e {} \; -print` para achar links quebrados.