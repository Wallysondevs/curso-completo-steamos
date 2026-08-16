Containers não servem apenas para desenvolver — eles também são a forma mais limpa de rodar ferramentas e até jogos no Deck sem se preocupar com dependências. Um emulador precisa de uma versão específica de biblioteca? Um script de build exige Python 3.11? Um servidor de jogo precisa de glibc mais nova? Tudo isso cabe num container, isolado do SteamOS imutável. Esta seção mostra como usar Podman e Distrobox para rodar ferramentas de desenvolvimento, servidores de jogos e aplicativos utilitários de forma reproduzível.

:::objetivos
- Rodar ferramentas de linha de comando em containers descartáveis
- Hospedar um servidor de jogo (ex.: Minecraft) num container Podman
- Compilar e executar jogos e emuladores dentro de containers com GPU passthrough
- Montar volumes para persistir saves e configurações fora do container
- Entender o que é isolamento de GPU e por que nem tudo pode rodar em container

:::
## Ferramentas descartáveis: containers "usar e jogar fora"

Uma das utilidades mais práticas de containers no Deck é rodar uma ferramenta que você não quer instalar de forma permanente. O Podman baixa a imagem, executa e você descarta:

```terminal
$ podman run --rm -it python:3.11-alpine python -c "import sys; print(sys.version)"
Python 3.11.11 (main, Feb  5 2025, 15:54: (GCC) 13.2.1 20231014
```

A flag `--rm` apaga o container ao sair. Sem instalar Python 3.11 no sistema, você tem um interpretador específico por alguns segundos. O mesmo vale para `node`, `golang`, `rust`, ou qualquer toolchain:

```terminal
$ podman run --rm -v "$PWD":/trabalho -w /trabalho rust:1.80 rustc --version
rustc 1.80.1 (3f5fd8dd4 2024-08-06)
```

Aqui aparecem duas flags novas e fundamentais: `-v "$PWD":/trabalho` monta o diretório atual do Deck dentro do container em `/trabalho`, e `-w /trabalho` define esse diretório como o de trabalho. Assim o container compila arquivos que ficam no seu `/home`, mas usa o toolchain do container, não o do sistema.

:::nota
A sintaxe `-v origem:destino` (volume bind) é a ponte entre o filesystem do Deck e o do container. Mapeamentos convenientes: `-v ~/lab:/lab` para código, `-v ~/Downloads:/downloads` para arquivos, `-v ~/.config:/config` para configurações. O que você escreve num bind mount persiste no host; o que escreve fora dele, some com o container.
:::

## Servidor de jogo em container

Servidores de jogos são o caso de uso perfeito para containers: imagem imutável, configuração versionada, fácil de derrubar e refazer. O Minecraft (servidor Java) é o exemplo mais clássico:

```terminal
$ podman pull itzg/minecraft-server
$ podman run -d --name mc \
    -e EULA=TRUE \
    -e MEMORY=4G \
    -p 25565:25565 \
    -v ~/lab/mc-data:/data \
    itzg/minecraft-server
398f3a2b11c7be6ac83a70c9c1e91e4d32a6f5b91c0a2f3c4d5e6f7a8b9c0d1e
```

O que cada flag faz:

- `-d`: roda em segundo plano (detached).
- `-e EULA=TRUE`: aceita o EULA da Mojang, obrigatório para iniciar.
- `-e MEMORY=4G`: limita o servidor a 4 GB de RAM (a APU tem 16 GB compartilhados, então não exagere).
- `-p 25565:25565`: publica a porta TCP 25565 do container na mesma porta do Deck.
- `-v ~/lab/mc-data:/data`: persiste o mundo e a config em `~/lab/mc-data`.

Acompanhe o servidor:

```terminal
$ podman logs mc
[init] Running as uid=1000 gid=1000 with /data as 'drwxr-xr-x 1000 1000'
[init] Checking for JSON files...
[init] Setting initial memory to 4G and max to 4G
[init] Starting the Minecraft server...
[Server] Done (3.21s)! For help, type "help"
```

Quando quiser parar: `podman stop mc`. O mundo fica salvo em `~/lab/mc-data` — destrua o container à vontade, seus dados sobrevivem no bind mount.

:::atencao
Ao expor portas com `-p`, lembre-se de que o SteamOS não tem firewall com regras ricas por padrão, então o serviço escuta em todas as interfaces. Para servidor de jogo apenas local (só você e a rede da casa), é melhor publicar em endereço de loopback ou na interface LAN específica: `-p 192.168.1.50:25565:25565`. Expor um `0.0.0.0` sem necessidade é porta aberta para a internet se seu roteador encaminhar a porta.
:::

## Containers com GPU e o que fica de fora

Nem todo container pode acessar a GPU da APU. O isolamento de containers é bom para CPU, rede e filesystem, mas a GPU exige passthrough explícito — e nem sempre é trivial. Para a GPU AMD do Deck, você passa os nós de dispositivo `/dev/dri` ao container:

```terminal
$ podman run --rm -it \
    --device /dev/dri \
    --group-add video \
    archlinux:latest bash
```

Dentro do container, a renderização via Vulkan/Mesa pode funcionar se a biblioteca GL do host estiver acessível. Isso é avançado e frágil; para a maioria dos jogos e ferramentas **gráficas**, o Distrobox resolve melhor que Podman puro, porque ele cuida do passthrough do socket Wayland e do PipeWire automaticamente.

```terminal
$ distrobox enter dev-arch
[deck@dev-arch ~]$ sudo pacman -S retroarch
[deck@dev-arch ~]$ distrobox-export --app retroarch
Application 'retroarch' successfully exported.
```

O RetroArch (emulador multi-sistema) exportado assim aparece no menu do modo desktop e renderiza via Wayland nativo — com aceleração da APU — porque o Distrobox compartilha o socket do display. É o caminho certo para "ferramenta gráfica num container".

:::info
Para jogos e emuladores que usam contêineres **Flatpak** (como o próprio RetroArch no Flathub), o GPU passthrough já é resolvido pelo runtime do Flatpak — o Flatpak do Steam tem permissões de GPU embutidas. Container (Podman) e Flatpak são tecnologias relacionadas mas com modelos de GPU diferentes: Flatpak expõe `/dev/dri` e drivers num runtime compartilhado; Podman exige configuração manual.
:::

## Compondo uma pilha de ferramentas

O cenário mais avançado é combinar vários containers: um banco de dados, um serviço e uma ferramenta CLI, tudo orquestrado. Para quem prefere `docker compose`, o Podman oferece `podman-compose` como pacote extra.

```yaml
services:
  db:
    image: postgres:16-alpine
    env_file: .env
    volumes:
      - ~/lab/pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

```terminal
$ podman-compose up -d
Creating network "lab_default" with the default driver
Creating lab_db_1    ... done
Creating lab_redis_1 ... done
$ podman ps
CONTAINER ID  IMAGE                              STATUS        PORTS                    NAMES
2b7f3c8a1d90  docker.io/library/postgres:16-alpine  Up 10 seconds  0.0.0.0:5432->5432/tcp  lab_db_1
9a1c4e6f0b21  docker.io/library/redis:7-alpine     Up 10 seconds  0.0.0.0:6379->6379/tcp  lab_redis_1
```

Essa pilha local (Postgres + Redis) é exatamente o que um projeto web de desenvolvimento precisa, rodando toda no Deck sem tocar no sistema. Para derrubar tudo: `podman-compose down`. Se você não tem `podman-compose`, `podman play kube` aceita YAML Kubernetes e faz papel similar.

## Resumo

- `podman run --rm` executa ferramentas descartáveis (Python, Rust, Node) sem instalar nada no sistema.
- `-v origem:destino` e `-w` conectam o filesystem do Deck ao container para persistir dados.
- Servidores de jogo (Minecraft, etc.) rodam bem em containers com `-e`, `-p` e bind mounts persistentes.
- O GPU passthrough via Podman exige `--device /dev/dri`; via Distrobox e Flatpak é automático.
- `podman-compose` orquestra pilhas multi-container (banco + cache + app) reproduzíveis.

## Exercícios

1. Rode `podman run --rm -it python:3.11-alpine python -c "print(3*7)"` e confirme a versão do Python no container.
2. Suba um servidor Minecraft com o comando da seção, veja `podman logs mc`, pare com `podman stop mc` e confirme que o mundo ficou em `~/lab/mc-data`.
3. Monte o diretório atual com `-v` e compile um arquivo `.c` dentro de um container `gcc:13` sem instalar GCC no host.
4. Exporte o RetroArch via Distrobox com `distrobox-export --app retroarch` e abra-o pelo modo desktop.
5. **Desafio.** Escreva um `docker-compose.yml` com Postgres e Redis, suba com `podman-compose up -d`, conecte no Postgres (`podman exec -it lab_db_1 psql -U postgres`) e crie uma tabela. Depois `podman-compose down -v` e confirme que os bind mounts persistiram.