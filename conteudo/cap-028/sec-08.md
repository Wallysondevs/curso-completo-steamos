Uma pergunta que todo usuário de Steam Deck acaba fazendo: os jogos da Steam também são Flatpak? A resposta curta é não — a Steam (o cliente) é um aplicativo Flatpak, mas os jogos que ela baixa usam um mecanismo totalmente diferente, o Steam Runtime. Esta seção esclarece a relação entre os dois mundos e explica como o Flatpak interage (e não interage) com o ecossistema de jogos do deck.

:::objetivos
- Distinguir o cliente Steam (Flatpak) do Steam Runtime (usado pelos jogos)
- Entender por que jogos não são empacotados como Flatpak
- Localizar onde os jogos são instalados no Steam Deck
- Explicar o papel do Proton e sua relação com runtimes
- Reconhecer como a sandbox do Flatpak afeta (ou não) os jogos

:::

## Steam cliente vs. Steam Runtime

Quando você abre "Steam" no desktop mode do Steam Deck, o que você está abrindo é o cliente Steam — o aplicativo que mostra a biblioteca, a loja, o chat, as conquistas. Esse cliente, no SteamOS, é distribuído como um Flatpak.

```terminal
$ flatpak list | grep -i steam
Steam    com.valvesoftware.Steam    1.0.0.81    stable    system
```

O ID `com.valvesoftware.Steam` é o aplicativo Flatpak que você está rodando. Ele é mantido pela própria Valve e publicado no Flathub com selo ✓. Mas quando você baixa e roda um *jogo*, o que acontece é outra história.

O jogo não é um Flatpak. Quando o cliente Steam instala um jogo, ele usa o **Steam Runtime** — um ambiente de execução próprio da Valve, independente do Flatpak. O Steam Runtime é uma coleção de bibliotecas (`libstdc++`, `SDL`, drivers de áudio, etc.) que a Valve mantém especificamente para garantir que jogos rodem de forma idêntica em qualquer distribuição Linux.

:::info
O Steam Runtime cumpre, para os jogos, um papel análogo ao que os runtimes Flatpak cumprem para os aplicativos: entregar um conjunto estável de bibliotecas, idêntico em qualquer máquina. São dois sistemas de runtime coexistindo no mesmo dispositivo, cada um no seu domínio — aplicativos de desktop usam Flatpak; jogos usam Steam Runtime.
:::

## Onde os jogos ficam

Os jogos da Steam são instalados num diretório totalmente separado dos aplicativos Flatpak. O local padrão é uma pasta dentro do diretório do próprio cliente Steam:

```terminal
$ ls ~/.var/app/com.valvesoftware.Steam/data/Steam/steamapps/
common/          appmanifest_*.acf   libraryfolders.vdf
$ ls ~/.var/app/com.valvesoftware.Steam/data/Steam/steamapps/common/ | head -5
Counter-Strike Global Offensive/
Dead Cells/
Hades/
Portal 2/
Stardew Valley/
```

Repare no detalhe importante: a pasta dos jogos está dentro de `~/.var/app/com.valvesoftware.Steam/`. Isso é a estrutura padrão de dados do Flatpak — o cliente Steam é um aplicativo Flatpak, então os dados dele (incluindo os jogos) ficam sob `~/.var/app/com.valvesoftware.Steam/`.

Essa é uma consequência prática que vale entender: se você remover o aplicativo Steam com `flatpak remove --delete-data com.valvesoftware.Steam`, você apaga **junto** todos os jogos instalados, porque eles vivem nos dados do aplicativo. Para desinstalar só o cliente sem perder os jogos, preserve o diretório `steamapps` antes, ou use a interface da própria Steam para "mover" os jogos para um cartão SD.

```terminal
$ df -h ~/.var/app/com.valvesoftware.Steam/
Filesystem      Size  Used  Avail Use% Mounted on
/home            245G  138G  107G  56% /home
```

No Steam Deck, muitos usuários movem os jogos para um cartão microSD para economizar o SSD interno. O caminho do cartão SD aparece na Steam como mais uma "library folder" (pasta de biblioteca), e você pode mover jogos livremente entre elas pela interface gráfica.

## O papel do Proton

Nenhuma conversa sobre SteamOS e jogos está completa sem o Proton. O Proton é a camada de compatibilidade que permite rodar jogos **Windows** no Linux — ele combina Wine, DXVK (DirectX para Vulkan), VKD3D (Direct3D 12 para Vulkan) e outros componentes.

O Proton não é um Flatpak, nem um runtime Flatpak. Ele é distribuído pela própria Steam, dentro do Steam Runtime, e cada jogo pode usar uma versão diferente de Proton. A relação com o Flatpak é apenas indireta: o Proton roda **dentro** do ambiente do cliente Steam (que por sua vez é um Flatpak), mas o Proton em si não tem relação com o `flatpak` CLI.

```terminal
$ ls ~/.var/app/com.valvesoftware.Steam/data/Steam/compatibilitytools.d/ 2>/dev/null
$ flatpak list --app | grep -i proton
```

Esses dois comandos retornam vazio — o primeiro porque o Proton padrão vive num diretório interno da Steam (não em `compatibilitytools.d`, que é para ferramentas de compatibilidade customizadas como o Proton-GE), e o segundo porque o Proton não é um aplicativo Flatpak instalado no sistema. Isso reforça o ponto: a pilha de jogos da Valve é paralela ao mundo Flatpak, não parte dele.

## A sandbox do Flatpak e os jogos

Como o cliente Steam é um Flatpak, a sandbox do Flatpak afeta, sim, a experiência de jogo — mas de forma sutil e, na maioria das vezes, já resolvida pela Valve.

O Flatpak do Steam tem permissões de sandbox mais abertas do que um aplicativo típico, porque um launcher de jogos precisa de acesso amplo: aos controles (via `/dev/uinput`), à GPU (via `device=dri`), aos cartões SD (via `filesystem`), e a alguns sockets.

```terminal
$ flatpak info --show-permissions com.valvesoftware.Steam
[Context]
shared=network;ipc;
sockets=x11;wayland;pulseaudio;session-bus;
devices=dri;input;all;
filesystems=xdg-run/app/com.discordapp.Discord:create;~/Downloads:create;...;
```

O `devices=input` dá acesso aos dispositivos de entrada (controles), e o `devices=all` é uma concessão ampla que permite aos jogos acessar dispositivos como gamepads. Essas permissões são deliberadas — a Valve as define no manifesto do Flatpak para que os jogos funcionem sem fricção.

:::nota
Há um caso especial que gera dúvida: jogos que usam anticheat no nível do kernel (EAC, BattlEye) às vezes têm problemas em ambientes sandbox. Isso é uma característica do Steam Runtime e do Proton, não do Flatpak do cliente — o Flatpak do Steam já é configurado para não interferir, mas a compatibilidade de anticheat depende da Valve e dos desenvolvedores de cada jogo, não do formato de empacotamento do cliente.
:::

## Instalando launchers terceiros via Flatpak

Além da Steam, outros launchers de jogos podem ser instalados como Flatpak no Steam Deck — e é aqui que o Flatpak brilha como via oficial. O Heroic Games Launcher (para Epic e GOG), o Lutris, o Bottles e o próprio itch.io têm aplicativos Flatpak verificados no Flathub:

```terminal
$ flatpak search heroic
Name                  Description                       Application ID            Version  Branch
Heroic Games Launcher Open source games launcher        com.heroicgameslauncher.hgl 2.15.2  stable
$ flatpak install flathub com.heroicgameslauncher.hgl
```

Milhões de usuários de Steam Deck usam o Heroic para acessar suas bibliotecas da Epic Games Store e GOG, e o Lutris para rodar jogos fora da Steam. Todos esses são aplicativos Flatpak porque, no SteamOS imutável, é a única forma suportada de instalar software adicional. Eles vivem no mesmo mundo Flatpak que o Firefox e o GIMP, com sandbox e atualizações via `flatpak update`.

:::dica
Se você usa Heroic ou Lutris no Steam Deck, os jogos baixados por eles também vão para a pasta de dados do aplicativo (`~/.var/app/com.heroicgameslauncher.hgl/...`). Ao planejar a movimentação para cartão SD, configure o caminho da "library" *dentro* do aplicativo, apontando para o diretório montado do cartão — assim os jogos ficam fora do SSD interno.
:::

## Resumo

- O cliente Steam é um Flatpak (`com.valvesoftware.Steam`); os jogos usam o Steam Runtime, que é independente.
- Jogos são instalados em `~/.var/app/com.valvesoftware.Steam/data/Steam/steamapps/`.
- O Proton (Wine + DXVK + VKD3D) roda dentro do Steam Runtime e não é um Flatpak.
- O Flatpak do Steam tem permissões de sandbox ampliadas (dispositivos, GPU) para os jogos funcionarem.
- Launchers terceiros (Heroic, Lutris, Bottles) são instalados como Flatpak, a via oficial no SteamOS.

## Exercícios

1. Confirme que o cliente Steam é um Flatpak com `flatpak list | grep -i steam` e depois inspecione suas permissões com `flatpak info --show-permissions com.valvesoftware.Steam`.
2. Navegue até `~/.var/app/com.valvesoftware.Steam/data/Steam/steamapps/common/` e liste os jogos instalados. Compare com a lista mostrada na interface da Steam.
3. Verifique o espaço ocupado pelos jogos com `du -sh ~/.var/app/com.valvesoftware.Steam/data/Steam/steamapps/` e veja se o SSD interno está apertado.
4. Procure no Flathub (`flatpak search heroic` ou `flatpak search lutris`) um launcher terceiro e instale-o. Rode `flatpak ps` com ele aberto e identifique o runtime.
5. **Desafio.** Investigue como o Proton gerencia versões: procure a pasta de versões do Proton dentro de `~/.var/app/com.valvesoftware.Steam/data/Steam/` e liste as versões disponíveis. Depois explique, em duas frases, por que o Proton não poderia simplesmente ser "um Flatpak como outro qualquer".
