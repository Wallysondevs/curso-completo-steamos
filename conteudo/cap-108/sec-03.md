O próximo salto natural depois de rodar um serviço diretamente no sistema é empacotar esse serviço num container. Containers isolam dependências, tornam cada aplicação portável entre máquinas e permitem subir e derrubar serviços inteiros com um comando. No Steam Deck, com seus 16 GB de RAM e SSD NVMe, dá para rodar uma pilha completa de home lab: servidor de mídia, agregador de RSS, wiki pessoal, banco de dados, fila de mensagens — tudo coexistindo sem conflito de pacotes.

:::objetivos
- Instalar e configurar uma engine de containers no SteamOS
- Escrever arquivos Compose que descrevem um serviço inteiro como código
- Gerenciar volumes persistentes e redes entre containers
- Expor serviços com proxy reverso e subdomínios locais
- Adotar boas práticas de backup e atualização de containers
:::

## Engine de container no SteamOS

O SteamOS não traz Docker pré-instalado, e instalar o Docker "a la Arch" (`pacman -S docker`) esbarra na raiz somente leitura. As duas opções limpas:

- **Podman** — nativo do ecossistema Red Hat, roda containers *rootless* (sem privilégio), e é o mais indicado para o Deck por não exigir daemon privilegiado. O curso já o apresentou nos capítulos sobre containers.
- **Docker dentro do distrobox** — você cria um container como ambiente e instala o Docker ali, isolando todo o ecossistema do sistema base.

Para a maioria dos cenários, o Podman rootless é a resposta. Instalando dentro de um distrobox Arch-based:

```terminal
$ distrobox-create --name lab --image archlinux:latest
$ distrobox-enter lab
$ sudo pacman -S podman podman-compose
```

Fora do distrobox, no sistema SteamOS, o Podman também está disponível quando o modo de desenvolvimento é ativado, mas a versão empacotada pode estar atrasada. O distrobox isola essa preocupação.

```terminal
$ podman --version
podman version 5.1.1
$ podman run --rm hello-world
Resolved "hello-world" as an alias (/etc/containers/registry.conf)
Trying to pull docker.io/library/hello-world:latest...
Getting image source signatures
Copying blob sha256:a5e8ccab622b...
Hello from Podman!
```

Como o Podman roda rootless, os containers tocam como seu usuário (`ana`), e qualquer `-v` que você montar usa suas permissões — sem a bagunça de `chown` de quando o Docker roda como root.

## Compose: serviço como código

O arquivo `compose.yaml` descreve todo o serviço: imagem, portas, volumes, variáveis de ambiente, política de reinício. É infraestrutura declarativa — você versiona o arquivo no Git e recria o serviço em qualquer máquina.

Exemplo com um wiki pessoal (Wiki.js) e seu banco de dados PostgreSQL:

```yaml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: wiki
      POSTGRES_USER: wiki
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - db-data:/var/lib/postgresql/data

  wiki:
    image: ghcr.io/requarks/wiki:2
    restart: unless-stopped
    depends_on:
      - db
    environment:
      DB_TYPE: postgres
      DB_HOST: db
      DB_PORT: 5432
      DB_USER: wiki
      DB_PASS: ${DB_PASSWORD}
      DB_NAME: wiki
    ports:
      - "3000:3000"
    volumes:
      - wiki-data:/wiki/data

volumes:
  db-data:
  wiki-data:
```

O segredo da senha fica fora do arquivo — numa variável de ambiente `${DB_PASSWORD}` que você exporta ou põe num arquivo `.env`:

```terminal
$ cat .env
DB_PASSWORD=troque-por-uma-senha-forte
$ podman-compose up -d
podman-compose version: 1.0.6
podman create --name=lab_db_1 ...
podman create --name=lab_wiki_1 ...
podman start lab_db_1
podman start lab_wiki_1
```

As palavras-chave `restart: unless-stopped` garantem que, se o Deck reiniciar, os containers sobem sozinhos — o equivalente da diretiva `Restart` do systemd, mas gerenciada pela engine de container.

## Volumes e persistência: o que sobrevive

O erro mais caro do iniciante em containers é guardar dados no filesystem efêmero do próprio container. Se você destrói e recria o container, perde tudo. A regra é uma só: **tudo que deve sobreviver vai num volume nomeado** (ou num bind mount).

```terminal
$ podman volume ls
DRIVER      VOLUME NAME
local       lab_db-data
local       lab_wiki-data
$ podman volume inspect lab_db-data
[
     {
          "Name": "lab_db-data",
          "Driver": "local",
          "Mountpoint": "/home/ana/.local/share/containers/storage/volumes/lab_db-data/_data",
          ...
     }
]
```

O `Mountpoint` revela onde os dados realmente ficam no seu disco. Fazer backup é copiar esse diretório (com os containers parados, para consistência):

```terminal
$ podman-compose stop
$ tar -czf backup-$(date +%F).tar.gz \
    ~/.local/share/containers/storage/volumes/lab_db-data/_data \
    ~/.local/share/containers/storage/volumes/lab_wiki-data/_data
$ podman-compose start
```

Para bancos de dados, `tar` sobre arquivos abertos pode gerar backup inconsistente. O método confiável é usar a ferramenta de dump do próprio banco (`pg_dump` para PostgreSQL, `mysqldump` para MySQL):

```terminal
$ podman exec lab_db_1 pg_dump -U wiki wiki > wiki-backup-$(date +%F).sql
```

:::atencao
Nunca rode `podman rm` ou `podman volume rm` sem antes confirmar que o backup correspondente existe. O comando destrói o volume e todo o conteúdo dele, sem lixeira. Adote o ritual: backup antes de qualquer operação destrutiva.
:::

## Rede e subdomínios locais

Com vários serviços, cada um escutando numa porta aleatória (`3000`, `8080`, `9090`), acessar tudo por porta vira um pesadelo de memorização. A solução é um proxy reverso que roteia por nome de host: `wiki.lab.local`, `rss.lab.local`, `grafana.lab.local`.

O padrão de referência é o **Traefik** ou o **Caddy** — ambos integram com Docker/Podman e geram certificados HTTPS automaticamente (mesmo locais, via auto-signed). O Caddy é o mais simples:

```yaml
services:
  caddy:
    image: docker.io/library/caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy-data:/data
```

```text
wiki.lab.local {
    reverse_proxy wiki:3000
}
rss.lab.local {
    reverse_proxy rss:80
}
```

Para `*.lab.local` resolver no Deck, adicione entradas no `/etc/hosts` (ou use um DNS local como o Pi-hole, que você mesmo pode hospedar no Deck):

```terminal
$ cat /etc/hosts
127.0.0.1   localhost
127.0.0.1   wiki.lab.local
127.0.0.1   rss.lab.local
127.0.0.1   grafana.lab.local
```

Agora você acessa `http://wiki.lab.local` em vez de `http://localhost:3000`. Escala melhor e parece (porque é) um ambiente de produção de verdade.

## Um home lab em cinco minutos

Uma pilha comum que cabe com folga no Deck, só para você ter uma referência do que é possível:

| Serviço | Imagem | Função |
|---|---|---|
| **Pi-hole** | `pihole/pihole` | DNS local com bloqueio de anúncios |
| **Miniflux** | `miniflux/miniflux` | Agregador de RSS leve |
| **Jellyfin** | `jellyfin/jellyfin` | Servidor de mídia |
| **Gitea** | `gitea/gitea` | Git autohospedado |
| **Portainer** | `portainer/portainer-ce` | Dashboard para gerenciar containers |
| **Uptime Kuma** | `louislam/uptime-kuma` | Monitor de disponibilidade |

O Portainer merece destaque: é uma interface web que lista, monitora e gerencia containers sem tocar no terminal. Para quem está começando, diminui a curva; para quem já sabe, agiliza a inspeção. Instalar é um `podman run` com volume e porta `9443`.

:::dica
Comece o home lab por **um único serviço que você realmente use**. Se você lê RSS, o Miniflux. Se assiste mídia local, o Jellyfin. Um serviço que você abre todo dia ensina mais sobre containers (atualização, backup, solução de problema) do que dez serviços que sobem e ficam abandonados.
:::

## Resumo

- No SteamOS, prefira Podman rootless (via distrobox) em vez de Docker com daemon privilegiado.
- Um `compose.yaml` descreve o serviço como código: imagem, portas, volumes, variáveis e política de reinício.
- Dados que devem sobreviver vão em volumes nomeados; `podman volume inspect` mostra onde eles ficam no disco.
- Backup de banco de dados usa dump (`pg_dump`/`mysqldump`), não `tar` sobre arquivos abertos.
- Proxy reverso (Caddy/Traefik) roteia por nome de host, eliminando a memorização de portas.
- Um home lab útil começa com um serviço que você usa diariamente — não com uma pilha enorme que fica abandonada.

## Exercícios

1. Crie um distrobox chamado `lab` e instale Podman + podman-compose nele. Confirme a versão com `podman --version`.
2. Escreva um `compose.yaml` para subir o Uptime Kuma com volume persistente e `restart: unless-stopped`. Suba com `podman-compose up -d` e acesse na porta 9443.
3. Destrua e recrie o container do Uptime Kuma (`podman-compose down && podman-compose up -d`). Confirme que as configurações sobreviveram graças ao volume.
4. Configure o Caddy como proxy reverso e adicione uma entrada no `/etc/hosts` para acessar o Uptime Kuma via `kuma.lab.local` em vez de `localhost:9443`.
5. **Desafio.** Monte uma pilha de três serviços (ex.: Pi-hole + Miniflux + Gitea) com um único `compose.yaml`, todos com volumes e backups documentados. Escreva um script que faça backup dos três automaticamente e agende-o com um timer systemd (capítulo 36).