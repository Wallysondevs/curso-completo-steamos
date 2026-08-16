Quando falamos de "SDK do SteamOS", estamos falando de mais de uma coisa, e confundi-las é uma fonte comum de erro. Existe o **SDK do freedesktop** (um runtime Flatpak genérico), o **steamos-devkit** (o metapacote de desenvolvimento da Valve), e o **Steam Runtime SDK** (o toolchain específico para compilar jogos que rodam no Steam). Cada um serve a um público diferente. Esta seção esclarece o mapa completo e mostra como montar um toolchain de desenvolvimento de verdade no Deck.

:::objetivos
- Distinguir os três significados de "SDK" no ecossistema SteamOS
- Entender o papel do Steam Runtime e por que jogos precisam de um toolchain específico
- Instalar e usar o toolchain GNU (gcc, binutils, glibc) num ambiente de build
- Compilar um programa dinâmico e inspecionar as dependências com `ldd`
- Configurar um ambiente de build reproduzível com variáveis de ambiente

## Três SDKs, três propósitos

A palavra "SDK" aparece em três contextos distintos no universo SteamOS:

| Nome | O que é | Para quem |
|---|---|---|
| `org.freedesktop.Sdk` | Runtime Flatpak com GCC, Make, headers | Desenvolver apps Linux genéricos |
| `steamos-devkit` | Metapacote da Valve (base-devel + toolchain) | Programar no Deck via containers |
| Steam Runtime SDK | Toolchain oficial para compilar jogos Steam | Desenvolvedores de jogos comerciais |

O primeiro você já usou nas seções anteriores: é o shell de compilação via Flatpak. O segundo é o pacote do repositório `steamos`. O terceiro é um ambiente completo baixado via Docker (`registry.gitlab.steamos.cloud/steamrt/sniper/sdk`) e é o que a Valve e os estúdios usam para garantir que um binário rode em **toda** instalação de Steam, independente da distro.

:::info
O Steam Runtime existe porque jogos são binários distribuídos: você compila hoje e eles precisam rodar daqui a anos, em milhares de máquinas diferentes. A solução da Valve é congelar um conjunto de bibliotecas (`scout`, `soldier`, `sniper` são as três gerações do runtime) e compilar os jogos contra elas. O jogo não depende da sua glibc — depende da glibc do runtime, que viaja junto com o jogo.
:::

## O toolchain GNU no ambiente de build

Um toolchain completo é um conjunto de ferramentas que transformam código-fonte em executável: o compilador (`gcc`), o montador (`as`/`ld`), o gerador de bibliotecas (`ar`), o depurador (`gdb`) e a biblioteca C (`glibc`). Você pode inspecionar todas essas peças dentro do SDK:

```terminal
$ flatpak run --command=bash org.freedesktop.Sdk//23.08
[📦 org.freedesktop.Sdk//23.08 ~]$ gcc --version | head -1
gcc (GCC) 13.2.0
[📦 org.freedesktop.Sdk//23.08 ~]$ ld --version | head -1
GNU ld (GNU Binutils) 2.41
[📦 org.freedesktop.Sdk//23.08 ~]$ gdb --version | head -1
GNU gdb (GDB) 14.1
```

Cada uma dessas ferramentas tem uma tarefa específica no pipeline:

1. `gcc` pré-processa e compila C → assembly (e chama o `as`).
2. `as` monta assembly → objeto `.o`.
3. `ld` liga objetos + bibliotecas → executável.
4. `gdb` ajuda a debugar o executável resultante.

Para ver esse pipeline em ação com o modo verboso:

```terminal
[📦 org.freedesktop.Sdk//23.08 ~]$ gcc -v -o ola ola.c 2>&1 | tail -12
 /usr/lib/gcc/x86_64-unknown-linux-gnu/13/cc1 -quiet -v ola.c ...
 GNU C17 (GCC) version 13.2.0 (x86_64-unknown-linux-gnu)
COLLECT_GCC_OPTIONS='-v' '-o' 'ola' ...
 as -v --64 -o /tmp/ccX3kQa.o /tmp/ccA8bF2.s
GNU assembler version 2.41
COLLECT_GCC_OPTIONS=...
 /usr/lib/gcc/x86_64-unknown-linux-gnu/13/collect2 ... -o ola ...
GNU ld (GNU Binutils) 2.41
```

O `-v` revela a sequência real: o `cc1` (o compilador C de fato) gera assembly, o `as` monta, e o `collect2` (envoltório do `ld`) liga. Ver isso desmistifica a "caixa preta" da compilação.

## Inspecionando dependências com ldd

Um executável raramente é autocontido — ele depende de bibliotecas compartilhadas (`.so`) que só existem no ambiente onde ele roda. O `ldd` lista essas dependências:

```terminal
[📦 org.freedesktop.Sdk//23.08 ~]$ gcc -o ola ola.c
[📦 org.freedesktop.Sdk//23.08 ~]$ ldd ./ola
	linux-vdso.so.1 (0x00007fff3f1fd000)
	libc.so.6 => /usr/lib/x86_64-linux-gnu/libc.so.6 (0x00007f8b1a2b4000)
	/lib64/ld-linux-x86-64.so.2 (0x00007f8b1a4a2000)
```

Três dependências, todas fundamentais: o `linux-vdso.so.1` (trampolim para chamadas de sistema, virtual), a `libc.so.6` (a glibc) e o `ld-linux-x86-64.so.2` (o **carregador** dinâmico, que roda antes do programa). O carregador é a peça que resolve esses símbolos em tempo de execução.

O `ldd` também responde à pergunta "este binário vai rodar no meu Deck, fora do SDK?":

```terminal
$ ldd ./ola
	linux-vdso.so.1 (0x00007ffdb7f1c000)
	libc.so.6 => /usr/lib/libc.so.6 (0x00007f5d0c2b4000)
	/lib64/ld-linux-x86-64.so.2 (0x00007f5d0c4a2000)
```

Se o binário compilado no SDK encontrar a `libc` no host (`/usr/lib/libc.so.6`), ele roda fora do sandbox. É aqui que entra a motivação do Steam Runtime: binários compilados contra uma glibc mais nova **não** rodam num sistema com glibc mais velha — o runtime resolve isso congelando versões.

:::atencao
Se um binário compilado no SDK falhar com `error while loading shared libraries: ... GLIBC_2.38 not found`, você esbarrou exatamente no problema que o Steam Runtime resolve. A versão da glibc do SDK é mais nova que a do SteamOS, e símbolos novos não existem no host. Para código que deve rodar no próprio Deck, compile contra a glibc do alvo, ou empacote como Flatpak, ou use o Steam Runtime SDK.
:::

## O Steam Runtime SDK na prática

Para quem quer compilar jogos que rodem dentro do runtime da Valve, o caminho oficial é o SDK `sniper` (a geração mais recente). Ele é distribuído como imagem Docker, que você roda via Podman:

```terminal
$ podman run --rm -it \
    -v "$PWD":/work \
    registry.gitlab.steamos.cloud/steamrt/sniper/sdk:latest
[root@sniper-sdk /]# gcc --version | head -1
gcc (GCC) 14.2.0
[root@sniper-sdk /]# cat /etc/os-release | head -3
NAME="Steam Runtime"
VERSION="3 (sniper)"
ID=steamrt
```

Dentro desse container, o toolchain é configurado para compilar contra as bibliotecas **do runtime**, não do host. O resultado é um binário que a Valve garante rodar em qualquer distro com o Steam instalado, porque o runtime viaja com o jogo.

```terminal
[root@sniper-sdk work]# gcc -o meu-jogo meu-jogo.c $(pkg-config --cflags --libs sdl2)
[root@sniper-sdk work]# ldd meu-jogo
	libSDL2-2.0.so.0 => /usr/lib/x86_64-linux-gnu/libSDL2-2.0.so.0 (0x...)
	libc.so.6 => /usr/lib/x86_64-linux-gnu/libc.so.6 (0x...)
```

Note que as bibliotecas resolvem para `/usr/lib` **do container** (o runtime), não do Deck. É esse o contrato de compatibilidade.

:::dica
Para projetos de jogo amadores, você não precisa do Steam Runtime SDK completo — o SDK do freedesktop ou um container Distrobox com `base-devel` + SDL2 resolvem 99% dos casos. O Steam Runtime SDK importa quando você quer distribuir um binário na Steam Store ou garantir compatibilidade com o runtime da Valve. Escolha a ferramenta pelo objetivo de distribuição, não pela complexidade.
:::

## Um ambiente de build reproduzível

Para que um build dê o mesmo resultado sempre (em qualquer Deck, em qualquer dia), você precisa fixar o ambiente: versões exatas das ferramentas e caminhos bem definidos. Num container, isso se resolve com um Dockerfile:

```dockerfile
FROM registry.gitlab.steamos.cloud/steamrt/sniper/sdk:latest
RUN pacman -Sy --noconfirm sdl2 sdl2_image cmake ninja
WORKDIR /work
CMD [ "/bin/bash" ]
```

```terminal
$ podman build -t meu-toolchain .
$ podman run --rm -it -v "$PWD":/work meu-toolchain
[root@cnp-build /work]# cmake -S . -B build && cmake --build build -j5
```

Builds reproduzíveis eliminam a variável "funciona na minha máquina" — o que, num hardware heterogêneo como o Deck (cada unidade pode ter um estado de partição e versão diferente), é uma vantagem enorme para o trabalho em equipe e CI.

## Resumo

- "SDK" no SteamOS significa três coisas: freedesktop SDK, `steamos-devkit` e Steam Runtime SDK.
- O Steam Runtime congela bibliotecas (`scout`/`soldier`/`sniper`) para que jogos compilados rodem em qualquer distro com Steam.
- O toolchain GNU é um pipeline: `gcc` (cc1) → `as` → `ld`/`collect2`, visível com `gcc -v`.
- `ldd` lista as dependências compartilhadas e o carregador dinâmico de um executável.
- Binários compilados contra glibc mais nova falham no host com "GLIBC_X not found"; Flatpak, container ou Steam Runtime resolvem.
- O Steam Runtime SDK `sniper` é obtido como imagem e provê build reproduzível via Dockerfile + Podman.

## Exercícios

1. Dentro do SDK (`flatpak run --command=bash org.freedesktop.Sdk//23.08`), rode `gcc -v -o ola ola.c` e identifique as três ferramentas do pipeline no log.
2. Compile `ola.c` e inspecione com `ldd ./ola`; liste as dependências e explique o papel do `ld-linux-x86-64.so.2`.
3. Puxe o Steam Runtime SDK (`podman run --rm -it registry.gitlab.steamos.cloud/steamrt/sniper/sdk:latest`), rode `gcc --version` e compare com o GCC do SDK freedesktop.
4. Crie um `Dockerfile` baseado no SDK sniper que instale `sdl2` e `cmake`, faça `podman build` e compile um projeto CMake dentro dele.
5. **Desafio.** Compile um mesmo `ola.c` no SDK freedesktop e no Steam Runtime SDK. Use `ldd` e `readelf -V ./ola | grep GLIBC` para comparar a versão da glibc requerida em cada um e explique por que um roda no Deck e o outro não.