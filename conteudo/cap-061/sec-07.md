Com shader cache limpo, prefixos órfãos removidos e Downloads varridos, a última grande alavanca é a própria biblioteca de jogos. Nem sempre a solução é desinstalar — às vezes você quer mover um título pesado para o microSD ou para um SSD externo sem perder saves e sem quebrar a detecção do Steam. Esta seção mostra como mover jogos com segurança dentro e fora do ecossistema Steam.

:::objetivos
- Criar e gerenciar múltiplas bibliotecas Steam no mesmo Deck
- Mover jogos entre bibliotecas pela interface do Steam e por linha de comando
- Entender o formato `.acf` (appmanifest) e como restaurar jogos depois de copiá-los
- Mover pastas de emuladores (`~/Emulation`) para o microSD com links simbólicos
- Medir o ganho de espaço após redistribuir jogos entre SSD e microSD
:::

## Bibliotecas Steam no SteamOS

Cada instalação Steam pode ter múltiplas **bibliotecas** — pastas onde os jogos são de fato instalados. A biblioteca principal é `steamapps` dentro de `.local/share/Steam`. Bibliotecas adicionais são criadas em outros volumes, como o microSD:

```terminal
## Biblioteca principal (SSD)
$ ls ~/.local/share/Steam/steamapps/common/
Elden Ring/   Portal 2/   Hades/   The Witcher 3/

## Biblioteca secundária (microSD)
$ ls /run/media/deck/0f1b2c3d/SteamLibrary/steamapps/common/
Cyberpunk 2077/   Baldur's Gate 3/   Stardew Valley/
```

Para criar uma nova biblioteca pelo modo Desktop: Steam → Settings → Storage → Add Drive. O Steam detecta o microSD automaticamente e oferece criar a `SteamLibrary` nele.

## Movendo jogos pela interface do Steam

O caminho mais seguro e oficial é usar a própria interface do Steam, disponível tanto no Game Mode quanto no Desktop:

1. Steam → Settings → Storage
2. Selecione o jogo na lista do drive atual
3. Clique em "Move" e escolha o drive de destino

Isso move os arquivos do jogo **e** atualiza o `appmanifest`, mantendo saves e configurações. Internamente, o Steam copia a pasta do jogo em `common/`, atualiza o caminho no arquivo `.acf` e limpa a origem.

## O appmanifest: entendendo o que está por trás

Cada jogo instalado tem um arquivo `appmanifest_<AppID>.acf` dentro de `steamapps`. É um arquivo em formato KeyValues (não JSON) que descreve o estado da instalação:

```terminal
$ cat ~/.local/share/Steam/steamapps/appmanifest_730.acf
"AppState"
{
	"appid"		"730"
	"Universe"		"1"
	"name"		"Counter-Strike 2"
	"StateFlags"		"4"
	"installdir"		"Counter-Strike Global Offensive"
	"LastUpdated"		"1723501201"
	"SizeOnDisk"		"75864253007"
	"StagingSize"		"0"
	"buildid"		"15300000"
	"LastOwner"		"76561198123456789"
	"BytesToDownload"		"0"
	"BytesDownloaded"		"0"
	"BytesToStage"		"0"
	"AutoUpdateBehavior"		"0"
	"AllowOtherDownloadsWhileRunning"		"0"
	"ScheduledAutoUpdate"		"0"
}
```

Os campos críticos para mover manualmente são `appid` (identificador), `installdir` (nome da pasta dentro de `common/`) e `SizeOnDisk` (tamanho em bytes). Se você copiar a pasta do jogo para outro disco **e** copiar o appmanifest correspondente, o Steam reconhece o jogo na nova localização ao reiniciar.

## Movendo manualmente (modo cirúrgico)

Se a interface gráfica falhar ou você quiser automatizar:

```terminal
## 1. Crie a biblioteca no destino
$ TARGET="/run/media/deck/0f1b2c3d/SteamLibrary/steamapps"
$ mkdir -p "$TARGET/common"

## 2. Mova a pasta do jogo
$ mv ~/.local/share/Steam/steamapps/common/Elden\ Ring "$TARGET/common/"

## 3. Mova o arquivo appmanifest
$ mv ~/.local/share/Steam/steamapps/appmanifest_1245620.acf "$TARGET/"

## 4. Reinicie o Steam
$ steam -shutdown
```

Na reinicialização, o Steam lê os `appmanifest` de todas as bibliotecas conhecidas e detecta Elden Ring no microSD. O jogo aparece como instalado e pronto para jogar.

:::perigo
Mover manualmente só funciona com o Steam **fechado**. Se o Steam estiver rodando, ele pode detectar o jogo como "desinstalado" antes de você recriar o appmanifest e iniciar um download novo, desperdiçando banda e bagunçando o estado. Sempre feche o Steam primeiro: no Game Mode, vá em Steam → Power → Switch to Desktop; no Desktop, clique com botão direito no ícone da bandeja e "Exit".
:::

## Movendo ROMs e emulação para o microSD

Os diretórios de emulação (`~/Emulation` do EmuDeck) também podem ser movidos. A técnica é copiar, testar e depois substituir por um link simbólico:

```terminal
## 1. Copie tudo para o microSD (ou mova, se quiser)
$ cp -a ~/Emulation /run/media/deck/0f1b2c3d/

## 2. Teste se o EmulationStation/RomManager enxerga as ROMs no novo caminho
##    configurando o caminho nos emuladores

## 3. Remova a pasta original e crie o symlink
$ mv ~/Emulation ~/Emulation.bak
$ ln -s /run/media/deck/0f1b2c3d/Emulation ~/Emulation
```

O EmuDeck recente já suporta configurar o caminho de ROMs no microSD durante a instalação. Se você refizer a instalação, escolha o microSD como destino das ROMs desde o início.

:::dica
Mover ROMs para o microSD é uma das decisões de maior ROI em espaço: bibliotecas de PS2, GameCube e Wii facilmente somam 100 GB ou mais. Elas não exigem latência de SSD (jogos antigos leem linearmente), então o microSD é a casa ideal para elas.
:::

## Resumo

- O Steam gerencia múltiplas bibliotecas; cada uma tem seu `steamapps` com `common/` e `appmanifest_*.acf`.
- A interface do Steam (Storage → Move) é o método mais seguro de mover jogos entre bibliotecas.
- Para mover manualmente, copie a pasta do jogo e o `.acf` correspondente, com o Steam fechado.
- Diretórios de emulação (`~/Emulation`) podem ser movidos por symlink para o microSD.
- MicroSD é ideal para ROMs e jogos antigos; SSD é para jogos modernos que exigem carregamento rápido.

## Exercícios

1. Liste todas as bibliotecas Steam do seu Deck: uma em `~/.local/share/Steam` e quantas houver em microSDs.
2. Mova um jogo pequeno (menos de 5 GB) do SSD para o microSD pela interface do Steam e confira o novo caminho.
3. Inspecione o `appmanifest_*.acf` de um jogo qualquer e identifique os campos `installdir` e `SizeOnDisk`.
4. Mova manualmente um jogo (com Steam fechado) copiando pasta + `.acf` e verificando que o Steam o reconhece ao reabrir.
5. **Desafio.** Mova `~/Emulation` inteiro para o microSD via symlink, ajuste as configurações de um emulador (ex.: PCSX2) para refletir o novo caminho e teste com uma ROM.