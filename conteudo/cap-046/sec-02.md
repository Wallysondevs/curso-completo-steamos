Uma ROM não vale nada sem um programa que a leia, e o RetroArch resolve isso do jeito mais elegante possível: em vez de instalar dez emuladores separados, você instala um único aplicativo que funciona como casca, ou front-end, e baixa os motores de emulação — os **cores** — como plugins. Nesta seção você entende essa arquitetura, instala o RetroArch no Deck via Flatpak e faz o primeiro reconhecimento da plataforma.

:::objetivos
- Entender a arquitetura front-end + cores do RetroArch e a separação do libretro
- Instalar o RetroArch no Steam Deck via Flatpak no Modo Desktop
- Baixar e ativar cores de emulação pelo menu de conteúdo
- Identificar os diretórios de configuração e de sistema que o RetroArch usa
- Habilitar o RetroArch no Game Mode como jogo não-Steam
:::

## A arquitetura libretro explicada

O RetroArch é, na verdade, duas coisas acopladas. Existe o **libretro**, que é uma API (interface de programação) que define como um core de emulação conversa com o mundo exterior, e existe o **RetroArch**, que é a interface gráfica que consome essa API. Cada core é um arquivo `.so` (biblioteca dinâmica no Linux) que implementa um console — `snes9x`, `mupen64plus`, `gambatte`, `genesis_plus_gx` e muitos outros.

Isso gera um benefício imediato: a configuração de entrada, vídeo, áudio, salvamento de estado e filtros é única, feita no RetroArch, e vale para todos os cores. Você configura o mapeamento do D-pad uma vez e ele serve para SNES, Mega Drive e Game Boy da mesma forma. É o oposto do modelo "um emulador por console, cada um com seu menu".

```terminal
$ ls /var/lib/flatpak/app/org.libretro.RetroArch/current/active/files/lib/libretro/ 2>/dev/null || echo "cores instalados via menu, não no pacote"
cores instalados via menu, não no pacote
```

O diretório acima costuma vir vazio no pacote Flatpak: os cores são baixados sob demanda pelo próprio RetroArch, então não espere encontrar uma pasta cheia de `.so` logo após a instalação.

:::nota
Nem todo emulador vive dentro do RetroArch. O Dolphin, o PCSX2 e o RPCS3, por exemplo, são projetos independentes com interface própria e costumam ser usados "standalone", fora do front-end. A escolha entre RetroArch e standalone é o tema de uma seção inteira adiante; aqui o foco é dominar o RetroArch, que concentra a maior parte das plataformas antigas.
:::

## Instalando via Flatpak

No Deck, o caminho recomendado é o Flatpak do Flathub, tanto porque ele é sandbox (não suja o sistema, o que protege o sistema de arquivos somente-leitura do SteamOS) quanto porque se atualiza sozinho. O SteamOS 3.6 já vem com o Flathub configurado, então a instalação é direta.

```terminal
$ flatpak install -y flathub org.libretro.RetroArch
Looking for matches…
Required runtime for org.libretro.RetroArch/x86_64/stable (runtime/org.kde.Platform/x86_64/6.6) found in remote flathub
Do you want to install it? [Y/n]: y
org.libretro.RetroArch permissions:
    ipc         network         pulseaudio         wayland         x11
    dri         file access [1] dbus access [2]   devices
    [1] host
    [2] org.freedesktop.Flatpak
        ID                                        Branch        Op        Remote        Download
 1. [✓] org.kde.Platform                         6.6           i         flathub       363.1 MB / 363.1 MB
 2. [✓] org.libretro.RetroArch                   stable        i         flathub       264.8 MB / 264.8 MB
Installation complete.
```

Repare no "runtime" `org.kde.Platform`: o Flatpak do RetroArch usa a plataforma KDE (a mesma do desktop do SteamOS), e por isso o download total vem maior que o emulador em si. Isso é normal e é uma dependência compartilhada — outros Flatpaks KDE reutilizam esse mesmo runtime.

Depois de instalar, confirme que o comando está acessível:

```terminal
$ flatpak list | grep -i retroarch
RetroArch	org.libretro.RetroArch	stable	system	flathub
```

:::dica
Instale Flatpaks no Modo Desktop, não no Game Mode. O Discover (a loja gráfica do KDE) faz exatamente o mesmo que o `flatpak install`, mas mostra capturas e avaliações. Se preferir a linha de comando, o `flatpak install` é mais rápido e reproduzível — ideal para automatizar depois.
:::

## Primeiro acesso e o menu de cores

Para abrir o RetroArch no desktop, use o Flatpak ou o atalho que o Discover cria:

```terminal
$ flatpak run org.libretro.RetroArch
```

Na primeira execução, o RetroArch monta suas pastas dentro do diretório do usuário, que no Flatpak fica isolado da árvore normal do sistema. Os caminhos que importam são:

| Caminho (dentro do usuário) | Conteúdo |
|---|---|
| `~/.var/app/org.libretro.RetroArch/config/retroarch/` | Configurações e playlists |
| `~/.var/app/org.libretro.RetroArch/config/retroarch/system/` | BIOS e firmware dos cores |
| `~/.var/app/org.libretro.RetroArch/config/retroarch/saves/` | Saves nativos dos jogos |
| `~/.var/app/org.libretro.RetroArch/config/retroarch/states/` | Save states (instantâneos) |

Para instalar cores, acesse **Main Menu → Online Updater → Core Downloader** e selecione o core do console desejado. Depois, em **Main Menu → Load Core**, o core aparece na lista. Atualizar o índice de cores pela primeira vez é um bom teste de que a rede do Deck está configurada.

:::atencao
A pasta `system/` é onde você coloca arquivos de BIOS (por exemplo, a BIOS de um console modded ou o firmware de um arcade). Ela é **diferente** da pasta de ROMs. Colocar a BIOS na pasta de ROMs é o erro mais comum de quem não consegue ligar um jogo de PlayStation 1 ou de arcade: o core procura a BIOS em `system/`, não em `roms/`.
:::

## Levando o RetroArch para o Game Mode

Rodar emulador no Modo Desktop é útil para configurar, mas jogar se faz no Game Mode, onde o controle e o overlay de desempenho funcionam bem. O caminho é adicionar o RetroArch como um "jogo não-Steam": abra a Steam, vá em **Add a Game → Add a Non-Steam Game** e selecione o RetroArch na lista (ele aparece depois de instalado via Flatpak).

```terminal
$ cat ~/.local/share/Steam/userdata/*/config/shortcuts.vdf | grep -i -A2 retroarch
"appname"		"RetroArch"
"exe"			"/usr/bin/flatpak"
"LaunchOptions"		"run org.libretro.RetroArch"
```

O trecho acima mostra o que o Steam grava quando você adiciona o Flatpak: o executável é o próprio `flatpak`, e o "argumento de execução" é o comando `run org.libretro.RetroArch`. É por isso que um atalho não-Steam de Flatpak funciona no Game Mode mesmo sem um binário dedicado.

:::info
No Game Mode, o RetroArch herda o controle do Steam Input, o que significa que o mapeamento padrão já envia os botões corretos. Mas para plataformas específicas (por exemplo, um gamepad de Nintendo 64) vale fazer um perfil de controle próprio dentro do RetroArch, com o controle **desligado do Steam Input** ou com o template correspondente. Esse ajuste fino é retomado quando falarmos de mapeamento por plataforma.
:::

## Resumo

- O RetroArch é um front-end sobre a API libretro, e cada console é um core (biblioteca `.so`) baixado sob demanda.
- A configuração de vídeo, áudio, entrada e saves é única e vale para todos os cores — você configura uma vez.
- A instalação no Deck é via Flatpak (`flatpak install flathub org.libretro.RetroArch`), que usa o runtime KDE.
- As pastas importantes ficam em `~/.var/app/org.libretro.RetroArch/config/retroarch/`, com BIOS em `system/`.
- Cores são baixados em Online Updater → Core Downloader; BIOS vai em `system/`, nunca em `roms/`.
- Para jogar no Game Mode, adicione o RetroArch como jogo não-Steam; o Steam o registra como `flatpak run ...`.

## Exercícios

1. Instale o RetroArch via Flatpak e liste o pacote com `flatpak list | grep -i retroarch` para confirmar a origem `flathub`.
2. Abra o RetroArch, acesse o Core Downloader e baixe dois cores de plataformas diferentes (ex.: `snes9x` e `gambatte`).
3. Explore `~/.var/app/org.libretro.RetroArch/config/retroarch/` e escreva o papel de cada uma das quatro subpastas principais.
4. Adicione o RetroArch como jogo não-Steam e verifique, no Game Mode, se o controle responde; volte ao desktop se algo falhar.
5. **Desafio.** Coloque um arquivo qualquer na pasta `system/` e use o menu de informações de um core para descobrir como o RetroArch resolve o caminho da BIOS — relacionando com a diferença entre `system/` e `roms/` que o comando `find` pode comprovar.
