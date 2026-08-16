O Steam Deck é um computador completo que passa a maior parte do tempo ocioso em modo portátil ou na dock. Essa APU de 15 W, com Ethernet (via dock), SSD e um Linux estável, é um mini servidor perfeitamente viável: servidor de arquivos, de mídia, de VPN, de automação residencial. Com containers, você transforma o console em máquina de serviços domésticos sem "sujar" o SteamOS — e sem precisar comprar um Raspberry Pi ou um NUC só para isso.

:::objetivos
- Avaliar quando faz sentido usar o Deck como servidor (e quando não faz)
- Rodar serviços de longa duração com Podman e restart automático
- Configurar um servidor de mídia (Jellyfin) e de arquivos (Samba) em containers
- Persistir dados de serviços em volumes e gerenciar atualizações
- Lidar com o modo de suspensão e a durabilidade do hardware como servidor

:::
## O Deck como servidor: vale a pena?

Um servidor doméstico precisa de três coisas: rodar 24/7, ter armazenamento e estar na rede. O Deck entrega as três, com ressalvas. O ponto forte é o custo marginal zero — você já tem o hardware. O ponto fraco é o gerenciamento de energia: o Deck foi desenhado para dormir, não para ficar ligado eternamente.

```terminal
$ systemd-analyze
Startup finished in 6.402s (firmware) + 12.104s (loader) + 14.889s (kernel) + 20.118s (userspace) = 53.513s
```

O boot em ~53 s é rápido para um servidor que você liga sob demanda. Mas a decisão fundamental é **quando** o Deck fica ligado. Dois modelos fazem sentido:

- **Servidor "on-demand"**: ligado só quando você está em casa ou quando precisa (transmissão de mídia, sincronização de arquivos). O ideal para um Deck, que consome ~15 W ociosos.
- **Servidor 24/7**: exige desativar a suspensão e aceitar o desgaste contínuo — viável, mas não é o uso para o qual o hardware foi otimizado.

:::atencao
Deixar o Deck 24/7 com a tela ligada no brilho máximo é receita para desgastar o painel e esquentar sem motivo. Em modo servidor, desligue a tela (`brightnessctl set 0` ou nas configurações de energia) e, se for usar headless, configure o boot para iniciar os serviços sem login gráfico. A tela é o componente mais delicado de um servidor que passa preso na dock.
:::

## Serviços de longa duração com Podman

Para um serviço que deve reiniciar sozinho após uma queda, o segredo é a flag `--restart` combinada com systemd. O Podman moderno usa o driver do systemd para gerenciar o ciclo de vida:

```terminal
$ podman run -d --name jellyfin \
    --restart=always \
    -p 8096:8096 \
    -v ~/lab/jellyfin-config:/config \
    -v ~/Videos:/media \
    jellyfin/jellyfin
8b3c9f2e1d4a7b6c5d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c
```

A flag `--restart=always` faz o container reiniciar se cair ou quando o Deck ligar. Para ativar o restart **no boot**, gere uma unit systemd de usuário:

```terminal
$ podman generate systemd --name jellyfin --new > ~/.config/systemd/user/jellyfin.service
$ systemctl --user daemon-reload
$ systemctl --user enable --now jellyfin
Created symlink /home/deck/.config/systemd/user/default.target.wants/jellyfin.service → /home/deck/.config/systemd/user/jellyfin.service
```

A partir daí, o Jellyfin sobe automaticamente ao ligar o Deck — sem pedir login, se você habilitar o *lingering* do usuário:

```terminal
$ loginctl enable-linger deck
```

O comando `enable-linger` mantém os serviços `--user` rodando mesmo sem o usuário logado, que é exatamente o que um servidor precisa.

## Servidor de mídia: Jellyfin

O Jellyfin é um servidor de mídia open-source, auto-hospedado, que organiza e transmite filmes, séries e músicas pela rede. Ele roda perfeitamente na APU do Deck, inclusive com transcode por hardware via VAAPI (a APU tem codificador VCN).

```terminal
$ podman run -d --name jellyfin \
    --restart=always \
    --device /dev/dri \
    --group-add video \
    -p 8096:8096 \
    -v ~/lab/jellyfin-config:/config \
    -v ~/Videos:/media:ro \
    jellyfin/jellyfin
```

O `--device /dev/dri` habilita o transcode por GPU (útil para reduzir resolução em dispositivos mais fracos). Depois de subir, acesse `http://localhost:8096` no navegador do Deck para a configuração inicial. O volume `~/Videos:/media:ro` monta sua pasta de vídeos como somente leitura, preservando seus arquivos.

```terminal
$ podman logs jellyfin | tail -5
[07:12:01] [INF] [1] Main: Jellyfin version: 10.10.3
[07:12:02] [INF] [1] Main: Environment Variables: ...
[07:12:03] [INF] [1] Main: Kestrel listening on 0.0.0.0
[07:12:04] [INF] [1] Main: Running startup tasks
[07:12:05] [INF] [1] Main: Startup complete 0:00:04.2
```

## Servidor de arquivos: Samba + Avahi

Para compartilhar arquivos com outros computadores da casa (Windows, macOS, Linux), o Samba é o padrão. O container `dperson/samba` simplifica bastante a configuração:

```terminal
$ podman run -d --name samba \
    --restart=always \
    -p 139:139 -p 445:445 \
    -v ~/Publico:/mount \
    -e USERNAME=ana \
    -e PASSWORD=secretna \
    -e SHARE=publico \
    dperson/samba
```

Isso cria um compartilhamento `publico` acessível com usuário `ana` e senha `secretna`. No Windows, o compartilhamento aparece como `\\steamdeck\publico`; no macOS/Linux, via `smb://steamdeck/publico`.

Para o compartilhamento ser **descoberto automaticamente** na rede, o Avahi (mDNS/Bonjour) anuncia o serviço — muitos containers já o incluem, ou você roda um `avahi` no host. Sem ele, os outros dispositivos precisam do IP ou do nome manualmente.

:::dica
Troque `PASSWORD=secretna` por uma senha forte e, idealmente, use um arquivo de variáveis (`--env-file`) em vez de expor credenciais na linha de comando, que fica gravada no histórico do shell. Para produção, prefira `--secret` ou um arquivo `.env` fora do controle de versão.
:::

## Atualizando serviços sem perder dados

Serviços em container seguem um ciclo limpo: baixar imagem nova, recriar o container, manter o volume. O processo de atualização do Jellyfin ilustra:

```terminal
$ podman pull jellyfin/jellyfin
$ podman stop jellyfin
jellyfin
$ podman rm jellyfin
jellyfin
$ podman run -d --name jellyfin \
    --restart=always \
    --device /dev/dri \
    -p 8096:8096 \
    -v ~/lab/jellyfin-config:/config \
    -v ~/Videos:/media:ro \
    jellyfin/jellyfin
```

Como a configuração e a mídia vivem em volumes (`~/lab/jellyfin-config`, `~/Videos`), recriar o container não perde nada — só a "casca" do serviço é trocada. Para automatizar, há o `podman auto-update` com o label `io.containers.autoupdate=registry`.

```terminal
$ podman run -d --label "io.containers.autoupdate=registry" ...
$ podman auto-update
Trying to pull docker.io/library/jellyfin...
```

O **watchtower** (container que atualiza outros containers) é outra opção, mas para um Deck usado como servidor, o `podman auto-update` nativo costuma bastar e é mais simples de auditar.

## Resumo

- O Deck é um mini servidor viável, especialmente no modelo "on-demand" (~15 W ocioso), não 24/7 com tela ligada.
- `--restart=always` + `podman generate systemd` + `loginctl enable-linger deck` mantêm serviços no boot sem login.
- O Jellyfin organiza e transmite mídia, com transcode por GPU via `--device /dev/dri`.
- O Samba (`dperson/samba`) compartilha pastas na rede; o Avahi garante descoberta automática.
- Atualizar um serviço = puxar imagem nova e recriar o container, preservando os volumes de dados.

## Exercícios

1. Suba o Jellyfin com o comando da seção e complete a configuração inicial em `http://localhost:8096`.
2. Gere a unit systemd (`podman generate systemd --name jellyfin --new`), habilite com `systemctl --user enable --now jellyfin` e reinicie o Deck para confirmar que o serviço volta sozinho.
3. Ative o lingering (`loginctl enable-linger deck`) e explique, em uma frase, o que ele muda para serviços de usuário.
4. Compartilhe uma pasta com `dperson/samba` e acesse de outro dispositivo da rede via `smb://steamdeck`.
5. **Desafio.** Atualize o Jellyfin sem perder a biblioteca: puxe a imagem nova, recrie o container e confirme que suas configurações e mídia continuam presentes. Depois descreva como faria o mesmo processo com `podman auto-update` usando o label de autoupdate.