Uma IDE dá o ambiente, mas sem as ferramentas certas o fluxo não anda. Git, compiladores, debuggers, ferramentas de build — tudo isso precisa estar ao alcance da mão. No SteamOS, essas ferramentas chegam por três canais principais: o Flatpak do próprio aplicativo (que já traz dependências), o SDK do freedesktop (para compilação em shell) e — o que muita gente não conhece — o metapacote `steamos-devkit`, pensado exatamente para transformar o Deck numa estação de desenvolvimento sem violentar o root imutável.

:::objetivos
- Instalar e configurar Git no Steam Deck para fluxos de versionamento
- Explorar o conteúdo do pacote `steamos-devkit` e as ferramentas que ele desbloqueia
- Entender a diferença entre toolchain do SDK Flatpak e toolchain de contêiner
- Configurar chaves SSH para GitHub/GitLab a partir do Deck
- Compilar um programa multi-arquivo com Make dentro do SDK
:::

## Git no Steam Deck

O Git vem pré-instalado no SteamOS. O suporte básico está lá, e você confere na hora:

```terminal
$ git --version
git version 2.43.0
$ which git
/usr/bin/git
```

O `git` está no sistema base (não é Flatpak), mas é parte da imagem read-only e sobrevive às atualizações. Para configurar o básico:

```terminal
$ git config --global user.name "Ana Desenvolvedora"
$ git config --global user.email "ana@exemplo.com"
$ git config --global init.defaultBranch main
$ git config --list
user.name=Ana Desenvolvedora
user.email=ana@exemplo.com
init.defaultBranch=main
```

A configuração vai para `~/.gitconfig`, em `/home`, então persiste normalmente. O que **não** persiste é instalar plugins ou complementos do Git via `pacman` — mas para o fluxo normal (clone, commit, push, pull) o Git de fábrica basta.

:::dica
Se você programa em modo portátil, ative o `git commit --verbose` como padrão (`git config --global commit.verbose true`). Ele mostra o diff inteiro dentro do editor de commit, o que ajuda bastante quando você está sem monitor externo e precisa revisar mudanças no espaço de uma tela pequena.
:::

## SSH: da chave ao push

Quase todo repositório remoto hoje pede autenticação por chave SSH. Gerar o par de chaves no Deck é igual a qualquer Linux:

```terminal
$ ssh-keygen -t ed25519 -C "ana@exemplo.com"
Generating public/private ed25519 key pair.
Enter file in which to save the key (/home/deck/.ssh/id_ed25519): 
Enter passphrase (empty for no passphrase): 
Enter same passphrase again: 
Your identification has been saved in /home/deck/.ssh/id_ed25519
Your public key has been saved in /home/deck/.ssh/id_ed25519.pub
The key fingerprint is:
SHA256:z4P0Kq1Ml2VrXtYwN7bH8jK5pQ3aD9fE6gWxR1cU0oA ana@exemplo.com
```

O algoritmo `ed25519` é mais curto e mais rápido que RSA — ideal para a APU do Deck. Depois de gerar, adicione a chave ao agente:

```terminal
$ eval "$(ssh-agent -s)"
Agent pid 3741
$ ssh-add ~/.ssh/id_ed25519
Identity added: /home/deck/.ssh/id_ed25519 (ana@exemplo.com)
```

Agora é só copiar a chave pública (`cat ~/.ssh/id_ed25519.pub`) para GitHub, GitLab ou seu servidor Git. A chave privada fica em `/home`, segura e persistente.

```terminal
$ ssh -T git@github.com
Hi ana! You've successfully authenticated, but GitHub does not provide shell access.
```

## O tesouro escondido: steamos-devkit

O SteamOS tem um metapacote oficial chamado `steamos-devkit` no repositório de pacotes do sistema. Ele agrupa headers, ferramentas de compilação e dependências comuns de desenvolvimento — mas, dado o root imutável, ele não foi pensado para ser instalado da forma tradicional. Em vez disso, ele é usado **dentro de containers** ou como base para ambientes de build.

```terminal
$ pacman -Si steamos-devkit
Repository      : steamos
Name            : steamos-devkit
Version         : 1.0-1
Description     : SteamOS development metapackage
Architecture    : x86_64
Depends On      : base-devel  gcc  make  git  cmake  meson  ninja
                  pkg-config  autoconf  automake  libtool
                  linux-api-headers  glibc  glibc-headers
```

A lista de dependências revela o que ele empacota: `base-devel` (o grupo Arch completo), mais `cmake`, `meson`, `ninja`, `pkg-config` e os headers do kernel e da glibc. É essencialmente o "build-essential do Arch", no formato SteamOS.

:::info
O `steamos-devkit` está disponível apenas no repositório `steamos`, que é específico da Valve e diferente dos repositórios do Arch Linux. Para usá-lo sem violar o root, a estratégia é construir um contêiner Distrobox ou Podman baseado na imagem do SteamOS e instalá-lo lá dentro — assunto das próximas seções.
:::

:::atencao
Não tente instalar o `steamos-devkit` direto na raiz com `sudo pacman -S steamos-devkit` depois de rodar `sudo steamos-readonly disable`. O `pacman` do SteamOS é deliberadamente não-suportado como gerenciador de pacotes do sistema: qualquer pacote instalado na raiz imutável será **apagado na próxima atualização** A/B, deixando órfãs suas dependências e podendo quebrar o boot. A forma correta de ter o `steamos-devkit` — e todo o `base-devel` — é dentro de um contêiner Distrobox ou Podman, onde o `pacman` funciona plenamente sem tocar no sistema.
:::

## Compilação multi-arquivo com Make no SDK

O SDK do freedesktop não é só um shell com GCC — é um ambiente de build completo. Dentro dele, você tem Make, Autotools, pkg-config e pode compilar projetos com estrutura de diretórios.

```terminal
$ flatpak run --command=bash org.freedesktop.Sdk//23.08
[📦 org.freedesktop.Sdk//23.08 ~]$ mkdir projetinho && cd projetinho
[📦 org.freedesktop.Sdk//23.08 projetinho]$ cat > lib.c << 'EOF'
#include <stdio.h>
void saudacao(const char *nome) {
    printf("Olá, %s! O Deck compilou esse código.\n", nome);
}
EOF
[📦 org.freedesktop.Sdk//23.08 projetinho]$ cat > main.c << 'EOF'
void saudacao(const char *nome);
int main() {
    saudacao("mundo");
    return 0;
}
EOF
[📦 org.freedesktop.Sdk//23.08 projetinho]$ cat > Makefile << 'EOF'
CFLAGS=-Wall -O2
all: prog
prog: main.o lib.o
	$(CC) -o $@ $^
clean:
	rm -f *.o prog
EOF
[📦 org.freedesktop.Sdk//23.08 projetinho]$ make
cc -Wall -O2   -c -o main.o main.c
cc -Wall -O2   -c -o lib.o lib.c
cc -o prog main.o lib.o
[📦 org.freedesktop.Sdk//23.08 projetinho]$ ./prog
Olá, mundo! O Deck compilou esse código.
```

As ferramentas do SDK rodam no sandbox do Flatpak, então os arquivos compilados ficam em `~/.var/app/org.freedesktop.Sdk/...` ou no diretório corrente (se ele for acessível). Para projetos que você quer manter fora do sandbox, crie os fontes em `~/lab` e acesse o diretório de dentro do shell do SDK.

## Resumo

- O Git está pré-instalado no SteamOS (`git version 2.43.0`) e configurável normalmente via `~/.gitconfig`.
- Chaves SSH com `ed25519` são o padrão recomendado para autenticar no GitHub e GitLab a partir do Deck.
- O `steamos-devkit` é o metapacote oficial da Valve que agrupa GCC, Make, CMake, Meson, headers e `base-devel`.
- Dentro do SDK do freedesktop, `make`, `gcc`, `pkg-config` e o ecossistema de build estão todos disponíveis.
- A compilação no SDK não toca no sistema: os binários ficam no seu home ou dentro do sandbox Flatpak.

## Exercícios

1. Configure seu nome e email no Git do Deck e clone um repositório público qualquer com `git clone`.
2. Gere uma chave SSH ed25519 (`ssh-keygen -t ed25519`), adicione ao agente e registre a chave pública no GitHub.
3. Dentro do shell do SDK (`flatpak run --command=bash org.freedesktop.Sdk//23.08`), compile um programa simples com `gcc` e depois com `make`.
4. Inspecione as dependências do `steamos-devkit` com `pacman -Si steamos-devkit` e liste 5 pacotes do `base-devel` que são úteis para compilação C.
5. **Desafio.** Por que o `git` do sistema base funciona normalmente (instalado na raiz read-only), mas um pacote instalado com `sudo pacman -S` na raiz não sobrevive? A resposta envolve a diferença entre "instalação de fábrica" e "instalação pós-fábrica" no esquema A/B de atualização do SteamOS.