O Podman resolve containers, mas não resolve um problema mais sutil: quando você quer um ambiente de desenvolvimento que se comporte como uma distro normal — com `apt`, `pacman`, `dnf` — e que ainda veja seus arquivos do home. É aí que o Distrobox brilha. Ele cria containers Podman (ou Docker) que se integram com o host a ponto de exportar aplicativos gráficos, compartilhar o diretório pessoal e até lançar atalhos `.desktop`. Para o Steam Deck, é o caminho mais natural para ter um Arch, Ubuntu ou Fedora de desenvolvimento sem nunca sair do SteamOS.

:::objetivos
- Entender o que o Distrobox faz que um container comum não faz
- Criar e acessar um container Distrobox com Arch Linux
- Instalar pacotes de desenvolvimento (`base-devel`, `steamos-devkit`) dentro do container
- Exportar aplicativos gráficos do container para o menu do modo desktop
- Comparar Distrobox com Toolbox e ambientes de desenvolvimento tradicionais
:::

## Container que parece distro nativa

Um `podman run` normal te dá um shell isolado. Mas ele não vê seus arquivos do home (a menos que você monte manualmente), não acessa o som, não renderiza janelas gráficas e não se integra com o menu de aplicativos. O Distrobox resolve isso **automaticamente**: cada container já nasce com o home montado, as variáveis de ambiente herdadas, o socket do display (`$WAYLAND_DISPLAY` ou `$DISPLAY`) e o socket do PipeWire para áudio.

A mágica está no script `distrobox`, que é um wrapper sobre Podman. Ele não é um runtime novo — é uma camada de convenção que transforma containers em "distros hóspedes".

```terminal
$ which distrobox
/usr/bin/distrobox
$ distrobox --version
distrobox: 1.7.2.0
```

Se o `distrobox` não estiver pré-instalado, você pode obtê-lo como user binary ou instalá-lo dentro de um ambiente de desenvolvimento existente. A Valve o inclui em versões recentes do SteamOS como parte do conjunto de ferramentas para desenvolvedores.

## Criando um Arch Linux dentro do Deck

O SteamOS é baseado em Arch, então faz sentido criar um container Arch para ter acesso ao `pacman` e ao AUR, mas com isolamento total da raiz:

```terminal
$ distrobox create --name dev-arch --image archlinux:latest
Creating 'dev-arch' using image archlinux:latest	
Trying to pull docker.io/library/archlinux:latest...
Getting image source signatures
Copying blob 1392e1d78ee3 done   | 
Copying config 2f1ff3f9e7 done   | 
Writing manifest to image destination
Distrobox 'dev-arch' successfully created.
```

A criação baixa a imagem do Arch Linux (via Docker Hub) e configura a integração automaticamente. Em seguida, entre no container:

```terminal
$ distrobox enter dev-arch
Container dev-arch is not running.
Starting container dev-arch...
✔ Container started.
[deck@dev-arch ~]$ cat /etc/os-release | head -3
NAME="Arch Linux"
PRETTY_NAME="Arch Linux"
ID=arch
[deck@dev-arch ~]$ pwd
/home/deck
```

Repare em dois detalhes importantes: o usuário continua `deck`, não `root`, e o home é exatamente o mesmo do host. Qualquer arquivo que você editar aqui aparece no SteamOS e vice-versa. A diferença é que agora você tem `pacman` livre:

```terminal
$ sudo pacman -Syu
:: Synchronizing package databases...
 core                  139.2 KiB   181 KiB/s 00:01 [######################] 100%
 extra                   8.2 MiB  3.31 MiB/s 00:02 [######################] 100%
:: Starting full system upgrade...
 there is nothing to do
$ sudo pacman -S base-devel git cmake meson ninja
resolving dependencies...
looking for conflicting packages...

Package (34)           New Version  Net Change

  autoconf             2.72-1          0.71 MiB
  automake             1.17-1          1.64 MiB
  binutils             2.43_1-1       10.03 MiB
  ...
  cmake                3.31.6-1       48.45 MiB
  meson                1.6.1-1         2.61 MiB
  ninja                1.12.1-1        0.33 MiB

Total Installed Size:  427.69 MiB

:: Proceed with installation? [Y/n] 
```

Agora você tem `base-devel`, `cmake`, `meson`, `ninja` — essencialmente o que o `steamos-devkit` oferece, mas dentro de um container Arch que você controla totalmente.

## Instalando o steamos-devkit dentro do container

Se você quiser replicar exatamente o ambiente de desenvolvimento da Valve, pode instalar o `steamos-devkit` dentro do container. Mas atenção: o repositório `steamos` não está disponível no Arch upstream — ele é exclusivo do SteamOS. A abordagem correta é usar um container baseado na própria imagem do SteamOS (quando disponível) ou instalar o equivalente pelo `base-devel` do Arch.

```terminal
$ distrobox create --name dev-steamos --image ghcr.io/steamdeckhomebrew/holo-base:latest
$ distrobox enter dev-steamos
[deck@dev-steamos ~]$ sudo pacman -S steamos-devkit
warning: steamos-devkit-1.0-1 is up to date -- reinstalling
```

:::dica
Se a imagem do SteamOS não estiver disponível como container, monte o equivalente com `--image archlinux:latest` e instale `base-devel`. O resultado prático é o mesmo: GCC, Make, CMake, Meson, headers. A diferença é que o `steamos-devkit` pode trazer alguns patches específicos da Valve — mas para 95% dos projetos, o `base-devel` resolve.
:::

## Aplicativos gráficos do container no modo desktop

O Distrobox pode exportar aplicativos do container para o menu do SteamOS. Se você instalar o VS Codium ou o Qt Creator via `pacman` dentro do container, eles aparecem no modo desktop como se fossem nativos:

```terminal
$ distrobox enter dev-arch
[deck@dev-arch ~]$ sudo pacman -S code
[deck@dev-arch ~]$ distrobox-export --app code
Application 'code' successfully exported.
```

O `distrobox-export --app` cria um arquivo `.desktop` em `~/.local/share/applications/` que referencia o binário do container. A partir daí, o aplicativo aparece no menu de aplicativos do modo desktop e pode ser fixado na barra de tarefas.

```terminal
$ ls ~/.local/share/applications/
dev-arch-code.desktop
```

O mesmo truque funciona para qualquer aplicativo gráfico: GIMP, Blender, Qt Creator, Emacs GUI. O container roda o app, mas a janela aparece no compositor Wayland do SteamOS como se fosse nativa.

:::atencao
Aplicativos exportados com `distrobox-export --app` dependem do container estar rodando. Se você desligar o container com `distrobox stop dev-arch`, os atalhos param de funcionar até você entrar de novo ou iniciar o container manualmente com `podman start dev-arch`. Para containers de uso frequente, crie um serviço systemd user com `distrobox generate-systemd --name dev-arch --start-now`.
:::

## Distrobox vs Toolbox: qual usar

A Red Hat criou o Toolbox, a Valve e a comunidade adotaram o Distrobox. Ambos fazem containers integrados, mas o Distrobox tem duas vantagens práticas importantes no SteamOS:

| Característica | Toolbox | Distrobox |
|---|---|---|
| Suporte a distribuições | Imagens Fedora/ubi | Qualquer imagem (Arch, Ubuntu, Alpine...) |
| Export de apps | Manual | `distrobox-export --app` |
| Dependência | Podman (padrão no Deck) | Podman ou Docker |
| Configuração extra | `toolbox.conf` limitado | `distrobox.ini` por container e global |

Para o Deck, onde a flexibilidade de escolher Arch, Ubuntu ou SteamOS como container de desenvolvimento importa, o Distrobox é a escolha mais alinhada.

## Resumo

- Distrobox transforma containers Podman em ambientes de desenvolvimento integrados, com home compartilhado e acesso gráfico.
- `distrobox create --name dev-arch --image archlinux:latest` cria um Arch de desenvolvimento em segundos.
- Dentro do container, `pacman -S base-devel` instala o equivalente funcional do `steamos-devkit`.
- `distrobox-export --app <binario>` leva aplicativos gráficos do container para o menu do modo desktop.
- O Distrobox supera o Toolbox no SteamOS pela flexibilidade de imagens e pela facilidade de exportação de apps.

## Exercícios

1. Crie um container Distrobox Arch (`distrobox create --name dev-arch --image archlinux:latest`), entre nele e rode `sudo pacman -Syu`.
2. Dentro do container, instale `base-devel`, crie um `ola.c` e compile com `gcc -o ola ola.c`.
3. Instale um aplicativo gráfico dentro do container (ex.: `sudo pacman -S gimp`) e exporte-o com `distrobox-export --app gimp`. Abra o GIMP pelo menu do modo desktop.
4. Compare o espaço em disco do container: use `podman system df` antes e depois de criar e popular o container.
5. **Desafio.** Crie um segundo container Ubuntu (`--image ubuntu:24.04`) e instale `build-essential` nele. Compile o mesmo `ola.c` nos dois containers (Arch e Ubuntu). Compare as versões do GCC e da glibc com `gcc --version` e `ldd ./ola`.