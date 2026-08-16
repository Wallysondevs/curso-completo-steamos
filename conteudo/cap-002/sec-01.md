Toda distribuição Linux se apoia em uma base que decide o formato dos pacotes, o gerenciador de pacotes e o ritmo de lançamento. No SteamOS, essa base é o Arch Linux — mas com um tempero próprio: uma camada chamada Holo, feita pela Valve, que transforma o Arch em algo que se comporta de forma bem diferente da distribuição original. Entender essa relação é o primeiro passo para não cair nas armadilhas que assombram quem trata o SteamOS como "Arch com Steam instalado".

:::objetivos
- Entender por que o SteamOS usa o Arch Linux como base
- Identificar o que é o repositório Holo e qual o seu papel
- Ler o `/etc/os-release` e interpretar cada campo
- Distinguir o SteamOS do Arch Linux "puro"
:::

## Por que Arch, e não Debian ou Fedora

O SteamOS 1.0 e 2.0, lançados entre 2013 e 2015, eram construídos sobre o Debian. A Valve descobriu na prática o problema de basear um hardware de jogos em uma distribuição com lançamentos espaçados e congelados: a pilha gráfica (kernel, Mesa, drivers de GPU) evolui rápido demais, e um jogo novo que exige um driver recente não podia esperar o próximo lançamento do Debian.

O Arch resolve isso com o modelo *rolling release*: não existem "versões" do Arch que você instala do zero a cada seis meses. O sistema é atualizado continuamente, pacote a pacote, sempre apontando para as versões mais novas do kernel, do Mesa e dos drivers. Para um console de jogos, em que cada atualização de driver pode destravar desempenho ou corrigir um bug crítico de um título recém-lançado, isso é exatamente o que se quer.

```terminal
$ cat /etc/os-release
NAME="SteamOS"
PRETTY_NAME="SteamOS 3.6"
VERSION="3.6"
VERSION_ID="3.6"
ID="steamos"
ID_LIKE="arch"
HOME_URL="https://www.steamos.com/"
BUILD_ID="20240926.1"
VARIANT_ID="steamdeck.holo"
```

O campo que entrega a história é o `ID_LIKE="arch"`: ele declara que o SteamOS é *compatível com o Arch*, mas não é o Arch. O `VARIANT_ID="steamdeck.holo"` aponta para a camada que faz a diferença.

## O que é o Holo

Holo é o nome que a Valve dá ao conjunto de modificações que ela aplica sobre o Arch para produzir o SteamOS. Ele não é um simples repositório de pacotes extras: é uma visão de produto inteira — firmware, kernel com patchs específicos para o hardware do Steam Deck, o compositor Gamescope, o script de boot, o esquema de partições A/B e a política de imutabilidade.

Na prática, os pacotes do Holo chegam pelo seu próprio repositório, com nomes prefixados de `holo/` no `pacman`. Quando você lista os pacotes instalados, os que começam com `holo/` são exatamente os que a Valve mantém, e não o Arch upstream.

```terminal
$ pacman -Q | grep '^linux' | head -5
linux-neptune 6.5.0-2
linux-neptune-headers 6.5.0-2
linux-firmware-neptune 20240115-1
```

O kernel que roda no Steam Deck não é o `linux` genérico do Arch. É o `linux-neptune`, um kernel mantido pela Valve com o codinome do hardware (o Steam Deck tinha o codinome interno "Neptune" antes do lançamento). Esse kernel carrega correções para o gerenciamento de energia do Aerith, o APU customizado da AMD que equipa o Deck.

:::nota
O nome "Holo" remonta ao SteamOS 3.0 original, lançado junto do Steam Deck em fevereiro de 2022. "Neptune" era o codinome do próprio console. Esses nomes internos vazam para os nomes de pacotes e repositórios, e saber lê-los ajuda a identificar de onde vem cada componente do sistema.
:::

## O `os-release` por dentro

O arquivo `/etc/os-release` é o padrão moderno (substituiu o antigo `/etc/lsb-release`) para declarar a identidade de uma distribuição. Ferramentas de terceiros — instaladores, scripts de detecção, o próprio Steam — leem esse arquivo para saber "onde estou rodando".

```terminal
$ cat /etc/os-release
NAME="SteamOS"
ID=steamos
ID_LIKE=arch
PRETTY_NAME="SteamOS 3.6"
VERSION_ID=3.6
VERSION_CODENAME=holo
BUILD_ID=20240926.1
VARIANT_ID=steamdeck.holo
```

Repare no `BUILD_ID=20240926.1`. Ele obedece ao formato `AAAAMMDD.n` e muda a cada atualização do sistema — é muito mais preciso para saber "qual SteamOS está instalado" do que o `VERSION_ID`, que só conta a família (3.6). Se você já diagnosticou um problema e precisou dizer à comunidade exatamente qual build roda no seu Deck, o `BUILD_ID` é o que importa.

O `VERSION_CODENAME=holo` difere do Arch, que não usa codinomes de lançamento (rolling release não tem "Noble" nem "Jammy"). Isso reforça que, apesar do `ID_LIKE=arch`, o SteamOS versiona sua própria pilha.

## Arch "por baixo", mas não igual

Uma confusão frequente é achar que, porque a base é o Arch e o `pacman` está presente, tudo o que vale para o Arch vale para o SteamOS. Não vale. A Valve não quer que você trate o sistema como um Arch convencional; ela quer um sistema fechado, previsível e atualizado de forma atômica.

```terminal
$ steamos-readonly status
Filesystem is readonly at this time.
```

Esse comando — que não existe em nenhum Arch do mundo — mostra a divisão de águas. No Arch, a raiz do sistema é gravável e o usuário tem liberdade total para instalar, remover e quebrar. No SteamOS, a raiz é somente leitura por padrão. Você até pode desativar essa proteção, mas ela volta no próximo update, e qualquer pacote que você instalou aí se perde.

O que sobra do Arch no SteamOS é o esqueleto: o `pacman`, o layout de diretórios, o `systemd` como gerenciador de serviços, o `/etc/pacman.conf`. Mas a política de uso foi deliberadamente invertida.

:::atencao
Não confunda "base Arch" com "posso usar o Arch como no Arch". O contrato que você tem com o SteamOS é diferente: a Valve controla a raiz, e você controla um espaço limitado de personalização — essencialmente os apps via Flatpak e os dados em `/home`. Esse contrato é o tema de todo este capítulo.
:::

## Resumo

- O SteamOS trocou o Debian (versão 1 e 2) pelo Arch por causa do modelo rolling release, ideal para a pilha gráfica.
- Holo é a camada de personalização da Valve sobre o Arch: kernel `linux-neptune`, Gamescope, boot e partições A/B.
- O `ID_LIKE="arch"` no `/etc/os-release` declara compatibilidade com Arch, não identidade com ele.
- O kernel do Steam Deck é o `linux-neptune`, com patchs para o APU AMD Aerith.
- O `BUILD_ID` (formato `AAAAMMDD.n`) é o identificador mais preciso de qual build está instalada.
- Apesar da base Arch, o SteamOS inverte a política: a raiz é somente leitura por padrão (`steamos-readonly`).

## Exercícios

1. Rode `cat /etc/os-release` e anote, em uma frase, o que os campos `ID_LIKE`, `VERSION_CODENAME` e `BUILD_ID` revelam sobre o seu sistema.
2. Execute `pacman -Q | grep '^linux'` e identifique o nome do kernel instalado. Ele é o `linux` genérico do Arch ou o `linux-neptune`?
3. Com `steamos-readonly status`, verifique o estado de leitura da raiz. Anote a saída exata e explique por que ela não apareceria em um Arch convencional.
4. Compare mentalmente: o que uma distribuição rolling release oferece a um console de jogos que uma distribuição de lançamento fixo (como o Debian) não oferece? Escreva dois argumentos.
5. **Desafio.** Já que a base é Arch, investigue se o `pacman.conf` do SteamOS tem configurações diferentes do padrão: leia `/etc/pacman.conf` com `cat` (funciona mesmo em modo somente leitura) e procure por linhas comentadas ou repositórios `holo/`. Relacione o que encontrar com o papel do Holo explicado aqui.
