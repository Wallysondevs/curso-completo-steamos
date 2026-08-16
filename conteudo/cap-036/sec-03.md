O Docker mudou a forma como software é empacotado e distribuído, mas a licença e o modelo de negócio do Docker Engine empurraram o ecossistema Linux para alternativas. O SteamOS — como uma distribuição moderna baseada em Arch — adota o Podman como substituto direto do Docker, com uma vantagem crucial: ele roda sem daemon, sem root e se integra melhor com systemd. Para quem programa no Deck, entender Podman é ter um laboratório de containers que isola experimentos sem nunca tocar no sistema imutável.

:::objetivos
- Entender por que Podman (e não Docker) é a escolha natural no SteamOS
- Instalar e verificar o Podman no Deck
- Rodar o primeiro container e inspecionar seus logs e camadas
- Comparar Docker e Podman nos comandos do dia a dia
- Gerenciar imagens e containers sem acumular lixo em disco
:::

## Por que Podman, não Docker

O Docker Engine depende de um daemon (`dockerd`) que roda como root, escutando num socket. Isso é um ponto único de falha e um risco de segurança: qualquer processo que fale com o daemon tem, na prática, acesso root à máquina. O Podman adota o modelo **fork-exec**: cada container é um processo filho direto do comando `podman`, no namespace do usuário. Sem daemon, sem socket privilegiado.

No SteamOS, isso importa ainda mais. Como o root é imutável, instalar o Docker Engine e seu daemon seria uma batalha contra o design do sistema. O Podman está disponível via Flatpak (como `io.podman_desktop.PodmanDesktop`) e também pode ser instalado como parte do `steamos-devkit` dentro de um contêiner de desenvolvimento.

```terminal
$ which podman
/usr/bin/podman
$ podman --version
podman version 5.4.1
```

Na instalação padrão do SteamOS, o `podman` pode vir ou não pré-instalado. Se não estiver presente, a rota mais simples é:

```terminal
$ flatpak install flathub io.podman_desktop.PodmanDesktop
```

O Podman Desktop é a interface gráfica, mas o binário `podman` de linha de comando também fica disponível. Para uso avançado em script e CI, prefira o Podman puro, que você instala dentro do ambiente de desenvolvimento — o que veremos com Distrobox mais adiante.

## Primeiro container: alpine mínimo

A prova de fogo de qualquer runtime de containers é rodar uma imagem mínima e interagir com ela. O Alpine Linux tem menos de 8 MB e é o teste de sanidade perfeito:

```terminal
$ podman run -it alpine
Resolving "alpine" using unqualified-search registries (/etc/containers/registries.conf)
Trying to pull docker.io/library/alpine:latest...
Getting image source signatures
Copying blob 0540e0c7f0b3 done   |
Copying config 37f9c1d4a9 done   |
Writing manifest to image destination
/ # cat /etc/os-release
NAME="Alpine Linux"
ID=alpine
VERSION_ID=3.20.3
/ # uname -m
x86_64
/ # exit
```

O processo é idêntico ao `docker run -it alpine`. As flags `-it` alocam um terminal interativo — o mesmo significado do Docker. Dentro do container, você está como root (do container, não do host), e o sistema de arquivos é um overlay montado sobre a imagem.

Para ver o container depois de sair:

```terminal
$ podman ps -a
CONTAINER ID  IMAGE                            COMMAND   CREATED        STATUS                    PORTS  NAMES
fa3bc1209d7b  docker.io/library/alpine:latest  /bin/sh   2 minutes ago  Exited (0) 30 seconds ago         confident_bose
```

O nome aleatório (`confident_bose`) é um toque do Podman — o Docker faz o mesmo. Se quiser um nome específico, passe `--name meu-alpine` no `podman run`.

## O mapeamento de comandos Docker → Podman

Quem vem do Docker encontra o Podman com um grau elevado de compatibilidade — os comandos são praticamente os mesmos. A tabela cobre o essencial:

| Ação | Docker | Podman |
|---|---|---|
| Rodar container | `docker run` | `podman run` |
| Listar em execução | `docker ps` | `podman ps` |
| Listar todos | `docker ps -a` | `podman ps -a` |
| Parar | `docker stop` | `podman stop` |
| Remover | `docker rm` | `podman rm` |
| Pull de imagem | `docker pull` | `podman pull` |
| Listar imagens | `docker images` | `podman images` |
| Executar em running | `docker exec` | `podman exec` |
| Logs | `docker logs` | `podman logs` |
| Build | `docker build` | `podman build` |
| Compose | `docker compose` | `podman-compose` (pacote extra) |

```terminal
$ podman images
REPOSITORY                TAG         IMAGE ID      CREATED       SIZE
docker.io/library/alpine  latest      37f9c1d4a9e2  4 days ago    8.1 MB
$ podman ps -a --format "table {{.ID}} {{.Image}} {{.Names}} {{.Status}}"
CONTAINER ID  IMAGE                            NAMES              STATUS
fa3bc1209d7b  docker.io/library/alpine:latest  confident_bose     Exited (0) 3 minutes ago
```

:::dica
Para economizar digitação, a maioria dos usuários de Podman cria um alias `alias docker=podman` no `~/.bashrc`. A compatibilidade de CLI é tão alta que em pelo menos 90% dos casos funciona sem ajustes. Mas atenção: `docker compose` não é `podman compose` — use `podman-compose` ou `podman play kube` para orquestração.
:::

## Limpando a casa: imagens e containers órfãos

Em máquinas com pouco armazenamento (o Deck de 64 GB, especialmente), containers acumulam camadas rápido. O Podman tem ferramentas de faxina:

```terminal
$ podman system df
TYPE           TOTAL       ACTIVE      SIZE        RECLAIMABLE
Images         2           1           165.2 MB    82.6 MB (50%)
Containers     3           0           8.2 kB      8.2 kB (100%)
Local Volumes  0           0           0 B         0 B (0%)
$ podman system prune -a
WARNING! This will remove:
  - all stopped containers
  - all networks not used by at least one container
  - all unused images
Are you sure you want to continue? [y/N] y
Deleted Containers:
fa3bc1209d7b...
Deleted Images:
37f9c1d4a9e2...
Total reclaimed space: 82.6 MB
```

O `podman system df` é o equivalente ao `docker system df` — mostra o espaço ocupado e quanto pode ser recuperado. O `prune -a` faz a faxina pesada. Para containers que você usa sempre, prefira `podman rm` seletivo.

:::atencao
O Deck de 64 GB usa eMMC, que é mais lento que NVMe. Além de limpar imagens, mantenha o diretório de volumes do Podman em `/home` e não em `/var/lib/containers` — no Podman rootless o padrão já é `~/.local/share/containers`, então você está seguro. Se usar Podman como root, as imagens vão para `/var/lib/containers` e podem encher a partição do sistema.
:::

## Resumo

- O Podman substitui o Docker com o mesmo vocabulário de comandos, mas sem daemon e sem root.
- `podman run -it alpine` baixa e executa uma imagem mínima de 8 MB como prova de funcionamento.
- `podman ps`, `podman images`, `podman logs`, `podman build`: a migração do Docker é um alias de distância.
- `podman system df` e `podman system prune` controlam o uso de disco, crítico no Deck de 64 GB.
- O Podman rootless armazena tudo em `~/.local/share/containers`, preservando a integridade do sistema imutável.

## Exercícios

1. Rode `podman run -it alpine` e, dentro do container, execute `apk add neofetch && neofetch`.
2. Puxe a imagem do Nginx com `podman pull nginx:alpine`, rode com `podman run -d -p 8080:80 nginx:alpine` e acesse `http://localhost:8080` do navegador do Deck.
3. Faça `podman system df` antes e depois de remover todos os containers parados com `podman system prune`.
4. Compare a saída de `podman ps -a` e `podman images` com os comandos Docker equivalentes (se tiver outra máquina com Docker) — liste duas diferenças de saída.
5. **Desafio.** Crie um `Dockerfile` mínimo (FROM alpine, RUN apk add curl) e execute `podman build -t meu-alpine-curl .`. Depois rode o container e, dentro dele, use `curl` para acessar uma API pública. Qual camada da sua imagem ocupa mais espaço?