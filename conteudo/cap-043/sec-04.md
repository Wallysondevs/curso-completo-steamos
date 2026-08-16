O Heroic Games Launcher virou o padrão de facto para jogar títulos da Epic e GOG no Steam Deck. Ele está no Discover, é Flatpak, recebe atualizações constantes e tem uma comunidade ativa. Mas a instalação padrão não é otimizada — alguns ajustes transformam a experiência de "funciona" para "funciona bem".

:::objetivos
- Instalar o Heroic via Flatpak pelo Discover e pela linha de comando
- Configurar pastas de instalação no SSD interno e no microSD
- Selecionar e gerenciar versões do Wine-GE e Proton-GE por jogo
- Ajustar DXVK, VKD3D e variáveis de ambiente para performance
- Integrar jogos do Heroic na Steam com um clique
:::

## Instalação via Discover e Flatpak CLI

O caminho mais simples é abrir o Discover (a loja do KDE), buscar por "Heroic" e clicar em Instalar. A versão Flatpak é a recomendada porque sandboxa o Heroic e evita conflitos com bibliotecas do sistema.

Se preferir o terminal:

```terminal
$ flatpak install flathub com.heroicgameslauncher.hgl
Looking for matches…
Found ref ‘app/com.heroicgameslauncher.hgl/x86_64/stable’
Do you want to install it? [y/n]: y
$ flatpak run com.heroicgameslauncher.hgl
```

Depois de aberto, o Heroic mostra duas abas no canto superior esquerdo: **Epic Games** e **GOG**. Clique em cada uma e faça login. Para a Epic, o Heroic abre um WebView com a página oficial de login — você digita email e senha uma única vez. Para GOG, o fluxo é similar.

```terminal
$ ls ~/.var/app/com.heroicgameslauncher.hgl/config/heroic/
GamesConfig/  heroic.db  tools/  legendary_config.ini  gogdl_config.ini
```

O arquivo `legendary_config.ini` armazena tokens de autenticação da Epic. O `gogdl_config.ini` faz o mesmo para GOG. Se você precisar migrar o Heroic para outro Deck, copie essa pasta inteira.

:::dica
O Heroic Flatpak tem acesso limitado ao sistema de arquivos por padrão. Para instalar jogos no microSD, você precisa dar permissão explícita: `flatpak override com.heroicgameslauncher.hgl --filesystem=/run/media/deck` ou usar o Flatseal para ajustar graficamente.
:::

## Escolhendo pastas e versões de Wine

Na tela de configurações do Heroic (ícone de engrenagem), defina a **Default Installation Path**. Recomendo criar uma estrutura organizada:

```
~/Games/Heroic/          → SSD interno, jogos que você joga sempre
/run/media/deck/microsd/Heroic/  → microSD, jogos grandes ou menos frequentes
```

Na mesma tela, a seção **Wine** controla qual runner será usado por padrão. As opções mais relevantes:

| Runner | Quando usar |
|---|---|
| Proton (Steam) | Melhor compatibilidade, usa o Proton instalado com a Steam |
| Wine-GE | Builds comunitárias com patches extras (recomendado para jogos Epic) |
| Proton-GE | Proton com patches da comunidade, inclui codecs de mídia |
| Kron4ek Vanilla | Wine puro, sem patches da Valve — use só se souber o que está fazendo |

```terminal
$ ls ~/.config/heroic/tools/wine/
Proton-GE-9-12.tar.xz  Wine-GE-8-26.tar.xz
$ ls ~/.config/heroic/tools/wine/Wine-GE-8-26/
bin/  lib/  lib64/  share/
```

O Heroic baixa essas versões sob demanda ao selecioná-las no dropdown. Você pode ter várias versões instaladas e escolher uma diferente por jogo.

:::nota
O Proton da Steam só aparece como opção se a Steam estiver instalada no mesmo usuário. O Heroic detecta automaticamente os diretórios `~/.steam/steam/steamapps/common/` e `~/.steam/steam/compatibilitytools.d/`. Se você usa Flatpak para a Steam também, o caminho é diferente e o Heroic pode não encontrá-lo automaticamente.
:::

## Ajustes de performance: DXVK, VKD3D e GameMode

Na página de configurações de cada jogo (clique no jogo → engrenagem), há uma seção **Advanced** com toggles importantes:

- **DXVK** — traduz DirectX 9/10/11 para Vulkan. Ative sempre, a não ser que o jogo tenha renderização nativa Vulkan.
- **VKD3D** — traduz DirectX 12 para Vulkan. Essencial para jogos modernos.
- **Use GameMode** — ativa o Feral GameMode, que ajusta o governor da CPU para performance e desativa notificações.
- **Esync / Fsync** — sincronização de eventos no Wine que reduz overhead de CPU. Fsync é mais rápido e requer kernel com suporte a `futex2` (SteamOS tem).

Nas variáveis de ambiente, você pode ajustar flags por jogo:

```bash
DXVK_ASYNC=1                # Compila shaders em thread separada
PULSE_LATENCY_MSEC=60       # Reduz latência de áudio
PROTON_ENABLE_NVAPI=0       # Desativa NVAPI (DLSS) se não tiver GPU NVIDIA
WINEDLLOVERRIDES="winemenubuilder.exe=d"  # Impede criação de atalhos
```

```terminal
$ gamemoderun wine --version
wine-9.0 (Staging)
```

O `gamemoderun` é um wrapper que ativa o GameMode apenas durante a execução do comando. O Heroic o invoca automaticamente quando o toggle está ativo.

:::atencao
DXVK e VKD3D criam caches de shaders que ocupam espaço. Com o tempo, o diretório `~/.config/heroic/tools/dxvk/` pode acumular centenas de megabytes. Limpe periodicamente ou use `ncdu ~/.config/heroic/` para monitorar.
:::

## Adicionando jogos do Heroic à Steam

O Heroic tem uma opção nativa para isso: na página do jogo, clique no menu ⋮ e selecione **Add to Steam**. O Heroic cria um atalho `.desktop`, adiciona ao Steam e — se você quiser — baixa artwork automaticamente.

O que acontece por baixo: o Heroic gera um script de lançamento que invoca o Legendary (ou GOGDL) com os parâmetros corretos de prefixo, runner e argumentos. Esse script vai para `~/.local/share/applications/` e o Steam o detecta.

```terminal
$ cat ~/.local/share/applications/heroic_epic_celeste.desktop
[Desktop Entry]
Name=Celeste (Epic)
Exec=/home/deck/.var/app/com.heroicgameslauncher.hgl/data/heroic/run.sh epic celeste
Icon=/home/deck/Games/Heroic/Celeste/icon.png
Type=Application
Categories=Game;
```

Você pode verificar se o atalho foi criado corretamente executando o script manualmente antes de abrir a Steam:

```terminal
$ bash ~/.local/share/applications/heroic_epic_celeste.desktop
# Ou, mais precisamente:
$ bash -c "$(grep '^Exec=' ~/.local/share/applications/heroic_epic_celeste.desktop | cut -d= -f2-)"
```

Se o jogo abrir, o atalho está pronto para o Game Mode.

## Mantendo o Heroic atualizado

O Flatpak facilita as atualizações:

```terminal
$ flatpak update com.heroicgameslauncher.hgl
Looking for updates…
Nothing to do.
$ flatpak list | grep heroic
Heroic Games Launcher  com.heroicgameslauncher.hgl  2.15.0  stable  system
```

O Heroic também avisa dentro da interface quando há atualização disponível para o Legendary, GOGDL ou os runners Wine. Mantenha tudo atualizado — cada release corrige bugs de compatibilidade.

## Resumo

- Instale o Heroic pelo Discover (Flatpak) e dê permissão ao microSD com Flatseal ou `flatpak override`
- Organize os jogos em `~/Games/Heroic/` (SSD) e `/run/media/deck/microsd/Heroic/` (cartão)
- Prefira Wine-GE ou Proton-GE para jogos da Epic; use Proton da Steam para GOG quando disponível
- Ative DXVK, VKD3D, GameMode e Fsync nas configurações avançadas de cada jogo
- O botão "Add to Steam" do Heroic gera um `.desktop` que o Steam detecta automaticamente

## Exercícios

1. Instale o Heroic pelo terminal com `flatpak install`. Depois use `flatpak list | grep heroic` para confirmar a versão.
2. Configure a permissão de acesso ao microSD com `flatpak override`. Teste criando um arquivo em `/run/media/deck/microsd/` de dentro do sandbox do Heroic.
3. Escolha um jogo da Epic e compare a performance com Proton Experimental vs. Wine-GE. Use o overlay de FPS da Steam (Game Mode) para medir.
4. Ative a opção "Add to Steam" para um jogo do Heroic. Reinicie a Steam e verifique se o jogo aparece na biblioteca com o atalho correto.
5. **Desafio.** Crie um script que varre `~/.config/heroic/GamesConfig/` (onde ficam os JSONs de configuração por jogo) e gera um relatório com: nome do jogo, loja, runner Wine usado, se DXVK está ativo e tamanho do diretório de instalação. Use `jq` para parsear os JSONs.