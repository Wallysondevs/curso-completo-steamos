O Steam Deck tem armazenamento limitado — o modelo base vem com 64 GB, e mesmo os de 256 GB ou 512 GB enchem rápido com jogos AAA. Baixar ISOs de Linux, ROMs legais para emulador, ou distribuições via torrent é comum entre usuários de Deck, mas fazer isso sem um cliente dedicado é doloroso. O qBittorrent é livre, leve e tem um Flatpak bem mantido.

:::objetivos
- Instalar o qBittorrent pelo Flathub e configurar o diretório de downloads
- Ajustar limites de velocidade para não saturar a rede do Deck
- Usar a interface web para controlar downloads remotamente
- Integrar o qBittorrent com buscas automáticas via plugins
:::

## Instalação e primeira configuração

O qBittorrent está no Flathub como `org.qbittorrent.qBittorrent`:

```terminal
$ flatpak install org.qbittorrent.qBittorrent
Looking for matches…
Found similar ref(s) for 'org.qbittorrent.qBittorrent' in remote 'flathub' (system).
Use this remote? [Y/n]: Y

        ID                                          Branch          Op           Remote           Download
 1. [✓] org.qbittorrent.qBittorrent                stable          i            flathub          35,4 MB / 35,5 MB

Installation complete.
```

Na primeira execução, o qBittorrent pergunta onde salvar os downloads. No Deck, o melhor lugar costuma ser um cartão SD montado em `/run/media/deck/<sd-label>` ou uma pasta em `~/Downloads` se você for mover os arquivos depois:

```terminal
$ flatpak run org.qbittorrent.qBittorrent
# Ferramentas > Opções > Downloads > Pasta padrão de salvamento
# Exemplo: /run/media/deck/1TB-SD/torrents
```

:::atencao
O qBittorrent Flatpak, por padrão, só tem acesso a `~/Downloads` e `~/Videos`. Se você quiser salvar no cartão SD, use o Flatseal para adicionar o caminho do SD (`/run/media/deck/*`) à lista de `filesystems` com permissão de leitura e escrita. Sem isso, o download falha com "Permission denied".
:::

## Controlando a velocidade

O Wi-Fi do Deck é bom, mas torrents podem saturar a rede e prejudicar partidas online. O qBittorrent tem um agendador de velocidade embutido que alterna entre limites diurnos e noturnos:

```terminal
$ flatpak run org.qbittorrent.qBittorrent --profile=deck
```

Dentro da interface, em Ferramentas > Opções > Velocidade, você define:

| Modo | Download | Upload |
|---|---|---|
| Global | 5 MiB/s | 1 MiB/s |
| Alternativo | ilimitado | 2 MiB/s |

O modo alternativo pode ser ativado manualmente num clique do ícone de velocímetro (canto inferior direito) ou programado por horário — por exemplo, liberando banda total entre 2h e 8h da manhã, quando ninguém está jogando.

## A interface web: controle remoto de verdade

Uma das melhores funcionalidades do qBittorrent é a interface web. Você ativa em Ferramentas > Opções > Interface web e define porta e credenciais. Depois, de qualquer navegador na mesma rede — inclusive do celular — acessa o Deck e gerencia os torrents:

```terminal
$ flatpak run org.qbittorrent.qBittorrent
# A interface web fica em http://localhost:8080
# Para acessar de outro dispositivo: http://<ip-do-deck>:8080
```

Para descobrir o IP do Deck:

```terminal
$ ip addr show wlan0 | grep 'inet ' | awk '{print $2}'
192.168.1.42/24
```

Assim você adiciona torrents do celular e eles baixam direto no Deck, sem precisar sair do sofá.

:::dica
A interface web do qBittorrent é responsiva e funciona bem em telas de celular. Combine com um servidor de mídia como o Jellyfin (também disponível no Flathub) e você tem o Deck funcionando como NAS improvisado enquanto está na dock.
:::

## Plugins de busca

O qBittorrent tem um sistema de plugins de busca que encontra arquivos em sites públicos sem você abrir o navegador:

```terminal
$ flatpak run org.qbittorrent.qBittorrent
# Ferramentas > Plugins > Buscar atualizações
# Depois: Ver > Motor de busca (ou Ctrl+Shift+F)
```

Os plugins baixam a lista de rastreadores suportados (The Pirate Bay, 1337x, etc.) e você busca diretamente de dentro do aplicativo. Como o Flatpak isola o processo, qualquer plugin malicioso fica contido no sandbox, o que é uma camada extra de segurança num aplicativo que lida com fontes nem sempre confiáveis.

:::perigo
Baixar material protegido por direitos autorais sem licença é ilegal em muitos países. Use torrents apenas para distribuir software livre, ISOs de Linux, conteúdo em domínio público ou material que você tem direito legal de baixar. O qBittorrent é uma ferramenta legítima; o uso que se faz dela é responsabilidade sua.
:::

## Mantendo a rede saudável e os arquivos organizados

Além dos limites de velocidade, o qBittorrent oferece duas configurações que valem ouro num portátil: a **priorização de arquivos** e a **escolha seletiva de conteúdo**. Ao abrir um torrent com vários arquivos (uma coleção de ISOs, por exemplo), você pode marcar apenas os arquivos que quer e pular o resto — economizando banda e espaço em disco.

```terminal
$ flatpak run org.qbittorrent.qBittorrent
# Na janela "Adicionar novo torrent", aba "Conteúdo"
# Desmarque os arquivos que não quer baixar e clique em OK
```

Outro ponto importante é a pasta de downloads. Com o cartão SD liberado via Flatseal, defina uma subpasta dedicada só para torrents em andamento e mova os concluídos para outro lugar quando terminar. Isso evita misturar arquivos incompletos (`.part`) com os finalizados na mesma pasta — um problema clássico de quem baixa muita coisa num só diretório.

## Resumo

- O qBittorrent instala com `flatpak install org.qbittorrent.qBittorrent` e é um cliente torrent leve e completo.
- Para salvar downloads no cartão SD, use o Flatseal para liberar `filesystems=/run/media/deck/*`.
- Limites de velocidade (modo global × alternativo) evitam que torrents atrapalhem partidas online.
- A interface web (padrão em `localhost:8080`) permite controlar downloads remotamente do celular.
- Plugins de busca integram rastreadores públicos dentro do próprio aplicativo, contidos pelo sandbox Flatpak.

## Exercícios

1. Instale o qBittorrent, configure a pasta de downloads para `~/Downloads/torrents` e baixe uma ISO de Linux (Ubuntu, Fedora ou Arch) por torrent.
2. Ative a interface web, acesse `http://localhost:8080` pelo Firefox Flatpak e confirme que a interface lista os mesmos torrents que a janela principal.
3. Configure o agendador de velocidade: limite global de 500 KiB/s de download durante o dia (8h–22h) e modo alternativo sem limites à noite.
4. Instale os plugins de busca e execute uma pesquisa por uma distribuição Linux dentro do qBittorrent.
5. **Desafio.** Configure o qBittorrent para iniciar minimizado no system tray do KDE ao ligar o Deck. Dica: o KDE Plasma gerencia a sessão com `~/.config/autostart/` e você pode apontar para o arquivo `.desktop` exportado pelo Flatpak em `~/.local/share/applications/`.