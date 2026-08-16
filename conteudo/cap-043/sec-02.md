A GOG (Good Old Games) é a loja da CD Projekt RED que vende jogos sem DRM. Nenhum launcher é obrigatório para jogar — você baixa o instalador, roda e o jogo é seu. Isso é perfeito para o Steam Deck, onde cada camada extra de software consome recursos. Mas também traz um desafio: sem um gerenciador central, cada jogo exige um ritual próprio de instalação.

:::objetivos
- Baixar instaladores offline da GOG e transferi-los para o Steam Deck
- Extrair instaladores com `innoextract` sem depender do Windows
- Configurar prefixos Wine para jogos GOG manualmente
- Instalar o GOG Galaxy via Proton quando necessário
- Gerenciar saves e configurações de jogos GOG offline
:::

## O modelo GOG e por que ele importa no Deck

Diferente da Steam, que exige o cliente rodando para autenticar e baixar jogos, a GOG entrega arquivos `.exe` ou `.sh` autocontidos. Depois de baixados, você pode copiá-los para um pendrive, um microSD ou um NAS — o jogo roda sem telefonar para servidor nenhum.

No Steam Deck isso significa três coisas práticas: você não gasta RAM com launcher em segundo plano, o jogo funciona offline em viagens longas e, se você formatar o Deck, basta ter os instaladores guardados para reconstruir tudo.

O lado menos bom: atualizações são manuais (você precisa baixar o patch), cloud saves não existem na versão offline e cada jogo precisa de um prefixo Wine configurado individualmente.

```terminal
$ ls -lh ~/Downloads/setup_stardew_valley_1.6.9.exe
-rw-r--r-- 1 deck deck 340M Jan 12 10:22 setup_stardew_valley_1.6.9.exe
$ file ~/Downloads/setup_stardew_valley_1.6.9.exe
setup_stardew_valley_1.6.9.exe: PE32 executable (GUI) Intel 80386, for MS Windows, InnoSetup installer
```

O `file` confirma que é um instalador InnoSetup — o formato mais comum entre os jogos GOG. Isso nos leva à primeira ferramenta importante.

## `innoextract`: extrair sem executar

Executar um `.exe` dentro do Wine só para extrair arquivos é como usar um martelo para abrir uma porta destrancada: funciona, mas é pesado e desnecessário. O `innoextract` resolve isso — ele descompacta instaladores InnoSetup nativamente no Linux, sem Wine, sem Proton, sem nada.

```terminal
$ sudo apt install innoextract
$ mkdir -p ~/Games/stardew-valley
$ innoextract -d ~/Games/stardew-valley ~/Downloads/setup_stardew_valley_1.6.9.exe
Extracting "Stardew Valley"
 - "app/" (227 files, 388 MiB)
 - "tmp/" (2 files, 12 KiB)
 - "data" (42 MiB)
Done.
$ ls ~/Games/stardew-valley/app/
Stardew Valley.exe  Content/  Mods/
```

Pronto. O jogo está extraído. Agora você precisa de um prefixo Wine para executá-lo. O `innoextract` suporta a maioria dos instaladores InnoSetup, mas alguns jogos GOG usam instaladores customizados ou baseados em NSIS — nesses casos, a extração com Wine é inevitável.

:::dica
Instaladores GOG no formato `.sh` são scripts de shell que extraem um tarball embutido. Você pode executá-los diretamente no SteamOS ou, melhor ainda, extraí-los com `bash setup_jogo.sh -- --extract` (a sintaxe exata varia — verifique com `--help`).
:::

## Criando um prefixo Wine para jogos GOG

Com os arquivos extraídos, o próximo passo é criar um ambiente Wine onde o jogo vai viver. Cada jogo merece seu próprio prefixo — isso isola dependências, versões de DirectX e configurações.

```terminal
$ export WINEPREFIX=~/Games/prefix/stardew-valley
$ export WINEARCH=win64
$ wineboot -u
$ winecfg
```

O `winecfg` abre uma janela gráfica de configuração. Defina a versão do Windows como Windows 10, ajuste a resolução e, na aba **Drives**, confirme que `C:` aponta para dentro do prefixo. Em seguida, copie o jogo extraído para dentro do prefixo e execute:

```terminal
$ cp -r ~/Games/stardew-valley/app/* "$WINEPREFIX/drive_c/Program Files/Stardew Valley/"
$ cd "$WINEPREFIX/drive_c/Program Files/Stardew Valley/"
$ wine "Stardew Valley.exe"
```

Se o jogo depender de DirectX 9/10/11, instale o DXVK dentro do prefixo. O jeito mais direto é usar o `protontricks` mesmo fora da Steam, apontando para o prefixo manual:

```terminal
$ WINEPREFIX=~/Games/prefix/stardew-valley protontricks 1234567890 --gui
```

:::atencao
Jogos GOG mais antigos (anteriores a 2010) podem precisar de componentes adicionais: `vcrun2019`, `directx9`, `xact`. Use `winetricks` diretamente no prefixo para instalá-los: `WINEPREFIX=~/Games/prefix/meujogo winetricks vcrun2019 directx9`.
:::

## Instalando o GOG Galaxy via Proton

Para quem prefere a experiência de um launcher — com cloud saves, atualizações automáticas e biblioteca unificada — o GOG Galaxy pode ser instalado como jogo não-Steam e executado via Proton.

O processo: baixe o instalador do GOG Galaxy (`setup_galaxy.exe`) do site oficial, adicione-o como jogo não-Steam, force Proton Experimental na aba Compatibilidade e execute. O instalador roda dentro do prefixo Proton criado automaticamente. Depois de instalado, volte nas Propriedades do atalho e mude o Destino para apontar para o `GalaxyClient.exe` dentro do prefixo.

```terminal
$ ls ~/.steam/steam/steamapps/compatdata/*/pfx/drive_c/Program\ Files\ \(x86\)/GOG\ Galaxy/GalaxyClient.exe
/home/deck/.steam/steam/steamapps/compatdata/1234567890/pfx/drive_c/Program Files (x86)/GOG Galaxy/GalaxyClient.exe
```

A partir daí, o GOG Galaxy abre como se estivesse no Windows. Você instala jogos de dentro dele, e cada jogo ganha seu próprio atalho. O contra é o consumo de RAM: o Galaxy é pesado, baseado em Chromium, e deixa o Deck mais lento quando está em segundo plano.

:::nota
O GOG Galaxy tem uma versão nativa para Linux em beta há anos, mas ela nunca saiu do limbo. A comunidade mantém projetos como o MiniGalaxy (Flatpak) e o Heroic Games Launcher — este último cobre GOG e Epic e será detalhado na [seção 3](#/cap-043/sec-03).
:::

## Gerenciando saves entre máquinas

Como a GOG offline não sincroniza saves, você precisa de uma estratégia. A mais comum no Steam Deck é usar o diretório `~/.local/share/` como ponto central de saves e fazer backup com `rsync` ou Syncthing.

Muitos jogos GOG salvam em `%APPDATA%` (que no Wine mapeia para `drive_c/users/steamuser/AppData/Roaming/`). Identifique onde cada jogo salva usando o [PCGamingWiki](https://www.pcgamingwiki.com) e crie um script de backup:

```bash
#!/bin/bash
# backup-gog-saves.sh
rsync -av ~/Games/prefix/*/drive_c/users/steamuser/AppData/Roaming/ \
        /run/media/deck/microsd/backup/saves/
echo "Saves copiados para o microSD."
```

## Resumo

- A GOG vende jogos sem DRM como instaladores `.exe` (InnoSetup) ou `.sh` — baixe uma vez, jogue para sempre
- `innoextract` extrai instaladores InnoSetup nativamente no Linux sem precisar de Wine
- Cada jogo GOG deve ter seu próprio prefixo Wine isolado em `~/Games/prefix/`
- O GOG Galaxy pode rodar via Proton como jogo não-Steam, mas consome RAM significativa
- Saves ficam espalhados — documente onde cada jogo salva e faça backup com `rsync`

## Exercícios

1. Baixe um instalador GOG no formato `.exe`. Use `file` para confirmar que é InnoSetup e extraia com `innoextract` em `~/Games/`.
2. Crie um prefixo Wine 64-bit para o jogo extraído e execute-o. O jogo abre? Se não, instale as dependências faltantes com `winetricks`.
3. Instale o GOG Galaxy como jogo não-Steam e execute-o via Proton Experimental. Quanto de RAM ele consome? Use `htop` para verificar.
4. Localize o diretório de saves de um jogo GOG que você tem instalado. Crie um script de backup com `rsync` e teste-o.
5. **Desafio.** Extraia três jogos GOG diferentes com `innoextract`. Dois vão funcionar; o terceiro provavelmente não (por ser NSIS ou customizado). Para esse terceiro, instale-o via Wine e depois mova o prefixo para `~/Games/prefix/`. Automatize o processo com um script que detecta o tipo de instalador antes de decidir a estratégia.