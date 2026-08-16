Todo jogo que roda no Steam Deck passa pelo Proton antes de chegar à tela. Mas o Proton faz muito mais que traduzir chamadas gráficas: ele cria um ambiente Windows completo, com registro, DLLs e estrutura de diretórios. Isso significa que a grande maioria dos mods, patches e ferramentas criadas para Windows também funciona no Deck — desde que você saiba onde colocar cada arquivo e como executar os instaladores dentro do prefixo.

:::objetivos
- Compreender como o prefixo Wine organiza o "disco C:" de cada jogo
- Navegar até a pasta `compatdata` e localizar o prefixo de um jogo pelo AppID
- Instalar mods manuais copiando arquivos para dentro do prefixo
- Usar o `protontricks` para executar instaladores `.exe` no contexto correto
- Diferenciar mods que exigem script extenders dos que só precisam de substituição de arquivos
:::

## O prefixo Wine como "Disco C:" virtual

Cada jogo instalado pelo Steam no Deck ganha uma pasta dentro de `~/.steam/steam/steamapps/compatdata`. O nome da pasta é o AppID numérico do jogo — aquele mesmo número que aparece na URL da loja (`store.steampowered.com/app/1086940`). Dentro dela mora o prefixo Wine:

```terminal
$ ls ~/.steam/steam/steamapps/compatdata/ | head -6
1086940
1091500
1245620
1593500
1623730
1938090
```

Dentro de cada prefixo, a subpasta `pfx/` contém a estrutura clássica de um Windows:

```terminal
$ ls ~/.steam/steam/steamapps/compatdata/1086940/pfx/
dosdevices/
drive_c/
system.reg
user.reg
userdef.reg
```

O diretório `drive_c/` é o "Disco C:" daquele jogo. Ali dentro você encontra `Program Files`, `Program Files (x86)`, `ProgramData` e `users`. É neste ponto que os mods entram: se um mod pede para você "copiar os arquivos para a pasta de instalação do jogo", o destino é algo como:

```terminal
$ ls ~/.steam/steam/steamapps/compatdata/1086940/pfx/drive_c/Program\ Files\ \(x86\)/Steam/steamapps/common/
Baldurs\ Gate\ 3/
```

Perceba que o Steam cria uma hierarquia espelhada: o prefixo contém seu próprio `steamapps/common/` interno, com os arquivos reais do jogo.

:::dica
No SteamOS 3.6, o caminho base é `/home/deck/.steam/steam` (SD Card) ou `/run/media/mmcblk0p1/steamapps` (cartão SD). Para descobrir o AppID de qualquer jogo, clique com o botão direito na biblioteca Steam, vá em Propriedades > Atualizações e veja o campo "App ID".
:::

## Instalando mods por substituição de arquivos

A forma mais simples de mod funciona assim: você baixa um `.zip`, extrai e copia os arquivos para a pasta do jogo. No Deck, o processo é o mesmo, mas o destino está dentro do prefixo. Veja o exemplo com Stardew Valley (AppID 413150):

```terminal
$ cd ~/Downloads
$ unzip "Stardew Valley Expanded.zip"
Archive:  Stardew Valley Expanded.zip
  inflating: StardewModdingAPI.exe
  inflating: Mods/StardewValleyExpanded/
  inflating: Mods/StardewValleyExpanded/manifest.json
  [... 48 arquivos omitidos ...]

$ GAMEDIR="$HOME/.steam/steam/steamapps/compatdata/413150/pfx/drive_c/Program Files (x86)/Steam/steamapps/common/Stardew Valley"
$ cp -r StardewModdingAPI.exe Mods/ "$GAMEDIR/"
```

Depois da cópia, o jogo precisa saber que deve executar o mod loader em vez do executável original. Isso se resolve nas opções de inicialização do Steam:

```terminal
WINEDLLOVERRIDES="StardewModdingAPI.exe=n,b" %command%
```

A variável `WINEDLLOVERRIDES` instrui o Wine a carregar o executável do SMAPI como se fosse uma DLL. Para mods que só trocam arquivos de dados (texturas, modelos, áudio), a cópia simples resolve — sem precisar mexer nas opções de inicialização.

## Script extenders e mod managers manuais

Muitos mods exigem um *script extender* — um programa que amplia a engine do jogo com funções novas, expostas aos mods via API. Exemplos famosos: SKSE (Skyrim), F4SE (Fallout 4) e NVSE (Fallout: New Vegas). Eles vêm como `.exe` e `.dll` que precisam ficar ao lado do executável principal.

```terminal
$ ls -1 "$GAMEDIR/"
FalloutNV.exe
FalloutNVLauncher.exe
nvse_loader.exe
nvse_1_4.dll
nvse_steam_loader.dll
Data/
```

A instalação é igual à de qualquer mod: extraia o `.zip` do script extender e copie tudo para a pasta do jogo. A diferença está nas opções de inicialização do Steam. Em vez de iniciar `FalloutNV.exe`, o Proton precisa executar `nvse_loader.exe`, e você faz isso com:

```terminal
$ protontricks -c 'wine "C:\Program Files (x86)\Steam\steamapps\common\Fallout New Vegas\nvse_loader.exe"' 22380
```

Ou, mais simples, use o campo "Launch Options" do Steam:

```
PROTON_SET_GAME_DRIVE=1 %command% --launcher-skip
```

O parâmetro `--launcher-skip` é específico do Fallout e evita o launcher original. Para outros jogos, o padrão é usar `protontricks -c` com o caminho Windows do executável desejado.

:::atencao
Nem todo script extender funciona no Proton. O SKSE64 (Skyrim Special Edition) funciona bem; já o F4SE tem histórico de quebras a cada atualização do Proton. Sempre consulte o [ProtonDB](https://www.protondb.com) e a página do mod no Nexus antes de assumir compatibilidade.
:::

## Resumo

- Todo jogo Steam tem um prefixo Wine em `compatdata/<AppID>/pfx/drive_c/`, que age como "Disco C:".
- Mods de substituição de arquivos são os mais simples: extraia o `.zip` e copie para a pasta correta dentro do prefixo.
- Script extenders precisam ser copiados para a pasta do jogo e executados via `protontricks -c` ou opções de inicialização.
- `WINEDLLOVERRIDES` e `PROTON_SET_GAME_DRIVE` são as variáveis principais para controlar a inicialização de mods.
- Nem todo mod ou extender feito para Windows funciona no Proton; consulte sempre o ProtonDB.

## Exercícios

1. Localize o AppID de três jogos que você tem instalados e liste o conteúdo de `drive_c/Program Files (x86)/Steam/steamapps/common/` dentro de cada prefixo.
2. Baixe um mod simples de textura para um jogo que aceite substituição de arquivos, extraia-o e copie os arquivos para o local correto dentro do prefixo. Confirme no jogo que o mod carregou.
3. Configure o SKSE para Skyrim Special Edition no Deck: baixe o extender, copie os arquivos e ajuste as opções de inicialização.
4. Use `protontricks -c` para abrir um `cmd.exe` dentro do prefixo de um jogo e navegue pelas pastas com `dir`. Compare a estrutura com o que você vê pelo terminal Linux.
5. **Desafio.** Combine um script extender, um mod manager manual e um ENB/Reshade no mesmo jogo, documentando a ordem de carregamento e testando se todos funcionam simultaneamente.