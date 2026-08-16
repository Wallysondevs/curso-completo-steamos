A interface gráfica do Steam deixou de expor qualquer controle fino sobre Cloud saves já em 2018, quando removeu a aba "Cloud" das propriedades do jogo. Hoje tudo o que você tem é um indicador binário na biblioteca: sincronizado ou não. Mas o cliente Steam expõe uma API local e, com o SteamCMD — a ferramenta de linha de comando oficial da Valve — você consegue consultar o estado remoto dos seus saves, listar arquivos pendentes e até disparar sincronizações manuais sem abrir a interface.

:::objetivos
- Instalar e autenticar o SteamCMD no Steam Deck
- Consultar o status de Cloud saves de qualquer jogo via `cloud_status`
- Listar arquivos remotos e comparar com o `remotecache.vdf` local
- Automatizar a verificação de sincronização em scripts
- Entender as limitações da API de Cloud do SteamCMD
:::

## SteamCMD: o que é e como instalar

SteamCMD é o cliente Steam para servidores e desenvolvedores. Ele não renderiza interface, não executa jogos e não tem loja — mas consegue autenticar na sua conta, consultar informações de jogos e acessar o Steam Cloud remotamente. É a ferramenta que servidores de TF2, ARK e CS2 usam para baixar atualizações, e é mantida oficialmente pela Valve.

No SteamOS, o SteamCMD está disponível como pacote do repositório Arch (que o SteamOS usa como base), mas o sistema de pacotes é read-only por padrão. A alternativa é instalar via Flatpak ou baixar o tarball oficial:

```terminal
$ mkdir -p ~/steamcmd && cd ~/steamcmd
$ wget https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz
$ tar -xvzf steamcmd_linux.tar.gz
$ ./steamcmd.sh +quit
Redirecting stderr to '/home/deck/Steam/logs/stderr.txt'
[  0%] Checking for available updates...
[----] Verifying installation...
Steam Console Client (c) Valve Corporation - version 1744157190
-- type 'quit' to exit --
Loading Steam API...OK

Connecting anonymously to Steam Public...OK
Waiting for client config...OK
OK
```

A primeira execução baixa as atualizações e fecha. O comando `+quit` diz ao SteamCMD para executar o comando `quit` logo após iniciar — sem isso, ele fica esperando comandos interativamente.

:::info
SteamCMD tem dois modos de autenticação: anônimo (suficiente para baixar servidores dedicados) e com login (necessário para acessar Cloud saves da sua conta). Para Cloud saves, você **precisa** logar com sua conta Steam. O SteamCMD pedirá o Steam Guard — o código chega no seu e-mail ou aplicativo.
:::

## Autenticando e consultando Cloud saves

Com o SteamCMD instalado, você pode autenticar e usar o comando `cloud_status` para ver o estado da sincronização de qualquer jogo da sua biblioteca:

```terminal
$ ./steamcmd.sh +login ana steamguard_code +cloud_status 730 +quit
Logging in user 'ana' to Steam Public...
This computer has not been authenticated for your account yet.
Enter the Steam Guard code from your email: 4B8XK
OK
Waiting for client config...OK

AppID 730: "Counter-Strike 2"
  Cloud: enabled (2 files)
  Synced: yes
  Cloud quota: 95.41 MB / 5.00 GB
  Files:
    cfg/config.cfg (4 KB) - synced
    cfg/video.txt (1 KB) - synced
```

O comando `cloud_status <AppID>` retorna se o Cloud está habilitado, quantos arquivos são monitorados, se está sincronizado e o uso de cota. Se houver arquivos pendentes de upload, o status muda:

```terminal
$ ./steamcmd.sh +login ana steamguard_code +cloud_status 1245620 +quit
AppID 1245620: "ELDEN RING"
  Cloud: enabled (1 files)
  Synced: no (1 pending upload)
  Cloud quota: 149.87 KB / 5.00 GB
  Files:
    ER0000.sl2 (149 KB) - local modified, needs upload
```

:::dica
O SteamCMD mantém a sessão autenticada por alguns dias. Use `+login ana` (sem o código Steam Guard) nas execuções seguintes — ele reutiliza o token guardado em `~/.local/share/Steam/config/config.vdf`. Se pedir o código de novo, é porque o token expirou.
:::

## Automatizando a verificação

A saída do `cloud_status` é texto puro, desenhada para humanos, não para máquinas. Mas com `grep` e um pouco de corte, você extrai o que interessa para scripts:

```terminal
$ cat check_cloud.sh
#!/bin/bash
STEAMCMD=~/steamcmd/steamcmd.sh
APPID="$1"

"$STEAMCMD" +login ana +cloud_status "$APPID" +quit 2>/dev/null | \
    grep -E "Synced:|Cloud:|pending"
$ ./check_cloud.sh 730
  Cloud: enabled (2 files)
  Synced: yes
$ ./check_cloud.sh 1245620
  Cloud: enabled (1 files)
  Synced: no (1 pending upload)
```

Esse script pode ser colocado como hook de desligamento: rode antes de `systemctl poweroff` e, se algum jogo tiver `Synced: no`, avise ou impeça o desligamento. O Steam Deck não faz isso nativamente — muita gente já perdeu save por desligar o deck logo após fechar um jogo, sem dar tempo para a sincronização completar.

Um script mais completo poderia percorrer todos os AppIDs instalados:

```terminal
$ cat check_all_clouds.sh
#!/bin/bash
STEAMCMD=~/steamcmd/steamcmd.sh
for manifest in ~/.local/share/Steam/steamapps/appmanifest_*.acf; do
    appid=$(basename "$manifest" | grep -oP '\d+')
    name=$(grep '"name"' "$manifest" | head -1 | grep -oP '"\K[^"]+(?="$)')
    status=$("$STEAMCMD" +login ana +cloud_status "$appid" +quit 2>/dev/null | \
        grep "Synced:" | grep -oP '(yes|no)')
    printf "%-40s %-6s %s\n" "$name" "[$appid]" "${status:-N/A}"
done
$ ./check_all_clouds.sh
Counter-Strike 2                         [730]   yes
ELDEN RING                               [1245620] no
Hades                                    [1145360] yes
Stardew Valley                           [413150] yes
Balatro                                  [2254740] yes
```

## Limitações do SteamCMD para Cloud

O SteamCMD não foi projetado como gerenciador de saves — ele é um cliente de servidor. Isso impõe limitações importantes:

1. **Ele não baixa saves.** Você pode ver o status e listar arquivos, mas não há comando `cloud_download`. Para baixar remotamente, você precisaria usar a API Web do Steam (que requer chave de API de desenvolvedor) ou deixar o cliente Steam fazer isso.
2. **Ele não resolve conflitos.** O `cloud_status` mostra que há conflito, mas a resolução ainda depende da interface gráfica do Steam ou de edição manual do `remotecache.vdf`.
3. **A cota é por jogo, não por conta.** Os 5 GB são por AppID, definidos pelo desenvolvedor — a Valve paga o armazenamento. Alguns jogos têm cotas ridiculamente pequenas (10 MB para saves pesados) e lotam rápido.
4. **SteamCMD expõe apenas o que o Steamworks expõe.** Se o desenvolvedor não configurou o Cloud pelo Steamworks, o `cloud_status` retorna "Cloud: not supported" — e não há o que fazer.

:::atencao
Usar SteamCMD logado na sua conta principal em scripts automatizados é arriscado. O token de sessão fica em texto plano no `config.vdf`. Se o script vazar (log compartilhado, tela gravada, backup em nuvem), alguém pode usar esse token para fazer login na sua conta. Para automação, prefira a abordagem de ler o `remotecache.vdf` local — que não requer autenticação.
:::

## Resumo

- SteamCMD é o cliente oficial de linha de comando da Valve, disponível como tarball em `steamcdn-a.akamaihd.net`.
- O comando `cloud_status <AppID>` mostra se o Cloud está habilitado, sincronizado e quantos arquivos estão pendentes.
- A consulta pode ser automatizada com scripts bash para verificar todos os jogos antes de desligar o sistema.
- SteamCMD não faz download de saves nem resolve conflitos; é uma ferramenta de diagnóstico, não de gerenciamento.
- O token de autenticação do SteamCMD fica em `config.vdf` — proteja esse arquivo se for usar em scripts.

## Exercícios

1. Instale o SteamCMD no seu Steam Deck e autentique-se com sua conta. Execute `cloud_status` para três jogos diferentes: um com Cloud ativo, um sem Cloud e um que você nunca tenha jogado.
2. Escreva um script que, dado um AppID, compara o que o `cloud_status` reporta (remoto) com o que o `remotecache.vdf` local contém. Eles batem? Se houver divergência, emita um alerta.
3. Use o SteamCMD para listar seus 5 jogos com maior cota de Cloud (`cloud_quota`). O tamanho dos saves corresponde ao que você esperava?
4. Crie um hook de systemd (`systemctl --user`) que execute um script de verificação de Cloud sync ao receber o sinal de desligamento e bloqueie o `poweroff` se houver saves pendentes.
5. **Desafio.** Explore a Web API do Steam (documentação em `partner.steamgames.com`) e descubra qual endpoint lista os arquivos remotos de Cloud Save para um AppID. Implemente uma chamada `curl` autenticada com sua chave de API (você precisará registrá-la no Steamworks).