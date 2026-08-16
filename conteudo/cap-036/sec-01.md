Quando o assunto é programar no Steam Deck, a primeira reação de muita gente é achar que não dá: "o SteamOS travou o root, então não posso instalar nada". A premissa está certa pela metade. É verdade que o sistema de arquivos raiz é somente leitura e que qualquer pacote instalado na raiz some fora do sistema de atualização. Mas a conclusão — de que o Deck não é uma máquina de desenvolvimento — é falsa. Ele é um computador Linux x86_64 comum, com APU AMD, 16 GB de RAM e um teclado virtual para quando você está longe de um dock. Toda a pilha de programação cabe nele; só muda a porta de entrada.

:::objetivos
- Entender por que o root imutável não impede desenvolvimento, apenas muda onde os programas vivem
- Instalar uma IDE Flatpak como porta de entrada para programar no Deck
- Distinguir o que roda no host (Flatpak) do que roda isolado (SDK e containers)
- Usar o Flatpak do SDK do freedesktop como ambiente de compilação sem tocar no sistema
- Conhecer o pacote `steamos-devkit` e o que ele desbloqueia
:::

## O root imutável, explicado pela metade certa

O SteamOS divide o disco em partições com propósitos diferentes. A raiz (`/`) vive numa imagem read-only que é substituída inteira a cada atualização de sistema — o mecanismo A/B de atualização. Isso mantém o Deck robusto, mas significa que um `pacman -S` clássico ali dentro é uma aposta perdida: o pacote até instala, mas desaparece na próxima atualização e ainda pode deixar o sistema inconsistente.

O que muita gente lê como "não dá para programar" é, na verdade, "não dá para usar o sistema do jeito Arch". E isso é uma restrição bem menos grave do que parece, porque existem três caminhos consolidados que **não** mexem na raiz:

- **Flatpak**: aplicativos autocontidos, instalados em `/home` ou em `/var/lib/flatpak`, separados do sistema.
- **SDK do freedesktop via Flatpak**: um ambiente de compilação completo (toolchain GCC, headers) entregue como um runtime, não como pacotes de sistema.
- **Containers (Podman/Distrobox)**: uma distro cliente inteira num contêiner, com o `pacman` ou `apt` dela própria.

```terminal
$ mount | grep -E ' / | /var '
/dev/nvme0n1p4 on / type ext4 (ro,relatime)
/dev/nvme0n1p6 on /var type ext4 (rw,relatime)
```

Repare no `ro` (read-only) do ponto de montagem `/`, enquanto `/var` e `/home` seguem graváveis. É por isso que o Flatpak pode se instalar em `/var/lib/flatpak` sem nunca escrever na raiz imutável.

:::atencao
Resista à tentação de rodar `sudo steamos-readonly disable` para "liberar" o `pacman`. O `pacman` **não é** o gerenciador de pacotes do SteamOS — ele existe no repositório de desenvolvedor apenas para casos muito específicos, e o que você instalar com ele na raiz será **descartado na próxima atualização** do sistema, quebrando dependências no processo. Para quase tudo, Flatpak ou contêiner resolvem sem esse preço.
:::

## A porta de entrada: uma IDE com Flatpak

A forma mais rápida de começar a programar no Deck é instalar uma IDE como Flatpak. O Flatpak já vem habilitado no SteamOS e aponta para o Flathub, então o fluxo é idêntico ao de instalar qualquer outro aplicativo.

```terminal
$ flatpak install org.gnome.Builder
Looking for matches…
Remotes found with refs similar to 'org.gnome.Builder':

   1) 'flathub' (system)
   2) 'flathub' (user)

Which do you want to use (0 to abort)? [0-2]: 1

        ID                    Branch           Op          Remote          Download
 1. [✓] org.gnome.Builder    stable           i           flathub          4.1 MB / 4.1 MB

Installation complete.
```

O GNOME Builder é só um exemplo — o mesmo comando serve para o VS Codium, um editor mais parecido com o Visual Studio Code:

```terminal
$ flatpak install com.vscodium.codium
        ID                         Branch          Op          Remote          Download
 1. [✓] com.vscodium.codium       stable          i           flathub        92.7 MB / 92.7 MB

Installation complete.
```

O padrão é o mesmo para qualquer IDE: `flatpak install <id-do-aplicativo>`. Depois, `flatpak run <id>` abre o programa, e ele aparece também no menu de aplicativos (modo desktop).

## Para onde vão os arquivos

Uma diferença prática importante: aplicativos Flatpak rodam num sandbox. Nem sempre eles veem todo o seu `/home` por padrão, e o caminho interno é diferente do externo. Se o editor não achar um diretório, o provável culpado é a permissão de acesso.

```terminal
$ flatpak override --user --filesystem=home com.vscodium.codium
```

Esse comando concede ao VS Codium acesso total ao seu diretório pessoal. Para o Builder, troque o ID no final. Quando o problema for a **porta USB** do seu microcontrolador (Arduino, ESP32, RP2040), é outro tipo de acesso — veja [a seção seguinte sobre ferramentas e SDK](#/cap-036/sec-02).

:::dica
Se o teclado virtual do modo portátil atrapalha na hora de digitar código, use um dock com teclado e mouse, ou ative o modo desktop e conecte um teclado Bluetooth. Programar no Deck é infinitamente mais confortável em modo desktop com periféricos reais.
:::

## O SDK como ambiente de compilação

Para quem não quer uma IDE completa, existe um caminho mais direto: o **SDK do freedesktop**, um runtime Flatpak que empacota toda uma toolchain — GCC, Make, Autotools, headers de desenvolvimento. Ele vira um "shell de compilação" isolado do sistema.

```terminal
$ flatpak install flathub org.freedesktop.Sdk//23.08
        ID                               Branch          Op          Remote          Download
 1. [✓] org.freedesktop.Sdk//23.08       23.08           i           flathub        1.2 GB / 1.2 GB
 2. [✓] org.freedesktop.Sdk.Debug//23.08 23.08           i           flathub        486.5 MB / 486.5 MB

Installation complete.
```

O `//23.08` é a versão do runtime — parece sintaxe de URL, mas é apenas a forma como o Flatpak referencia uma *branch*. Uma vez instalado, você entra num shell com toda a toolchain à disposição:

```terminal
$ flatpak run --command=bash org.freedesktop.Sdk//23.08
[📦 org.freedesktop.Sdk//23.08 ~]$ gcc --version | head -1
gcc (GCC) 13.2.0
[📦 org.freedesktop.Sdk//23.08 ~]$ which make gcc ld
/usr/bin/make
/usr/bin/gcc
/usr/bin/ld
```

Dentro desse shell você compila C, C++ e qualquer coisa que dependa só da toolchain, sem poluir o SteamOS. É a ponte entre "eu quero só compilar um programa" e "eu quero uma distro inteira" — que é onde os contêineres entram, nas próximas seções.

## Resumo

- O root do SteamOS é read-only e substituído a cada atualização; `/home` e `/var` continuam graváveis.
- Desenvolver no Deck é viável via Flatpak, SDK do freedesktop ou containers — nada disso toca na raiz.
- `flatpak install <id>` instala IDEs como `org.gnome.Builder` e `com.vscodium.codium`.
- `flatpak override --user --filesystem=home <id>` libera o acesso do app ao seu diretório pessoal.
- O SDK `org.freedesktop.Sdk//23.08` traz GCC, Make e headers, acessível via `flatpak run --command=bash`.
- O `pacman` do repositório de dev não deve ser usado na raiz: o que ele instala some na atualização.

## Exercícios

1. Instale o GNOME Builder com `flatpak install org.gnome.Builder` e abra-o pelo modo desktop.
2. Instale o VS Codium e rode `flatpak override --user --filesystem=home com.vscodium.codium`; confirme que agora ele enxerga seu `/home`.
3. Entre no shell do SDK com `flatpak run --command=bash org.freedesktop.Sdk//23.08` e rode `gcc --version`, `make --version` e `git --version`.
4. Dentro do shell do SDK, crie um `ola.c` com um `printf("oi\n")`, compile com `gcc -o ola ola.c` e execute `./ola`.
5. **Desafio.** Explique, com base na saída de `mount`, por que o Flatpak consegue instalar um runtime de 1,2 GB num sistema de root read-only — e identifique em qual partição esse runtime provavelmente ficou.
