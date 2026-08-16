Patch não-oficial. Correção de comunidade. Tradução por fãs. Essas três categorias de modificação representam a fronteira entre "jogo quebrado" e "jogo jogável" em centenas de títulos — especialmente ports japoneses, jogos antigos e abandonware. E todas funcionam no Steam Deck, com uma vantagem inesperada: o sistema de arquivos do Linux torna muito mais fácil reverter patches do que no Windows.

:::objetivos
- Aplicar patches de comunidade (`.exe`, `.xdelta`, `.ips`, `.bep`) no Steam Deck
- Localizar e instalar traduções feitas por fãs dentro do prefixo Wine
- Usar patches não-oficiais para corrigir bugs que o Proton não resolve
- Reverter patches usando o sistema de snapshot/backup do prefixo
- Entender o ecossistema de patching: PCGamingWiki, Community Patch Hub, Special K
:::

## O que patches de comunidade resolvem

Patches de comunidade não são mods — eles não adicionam conteúdo novo, apenas corrigem o que o desenvolvedor abandonou. Exemplos clássicos:

- **Widescreen fix**: jogos 4:3 que esticam em 16:10. O patch corrige FOV, HUD e renderização.
- **4 GB patch (Large Address Aware)**: jogos 32-bit que crasham ao alocar mais de 2 GB de RAM. O patch altera o header do executável para suportar até 4 GB.
- **DSfix (Dark Souls)**: desbloqueia resolução, framerate e texturas que o port original não expõe.
- **SilentPatch (GTA)**: coleção de correções para bugs de missão, física e memória nos GTA 3D.
- **Unofficial Patch (Skyrim, Fallout, Oblivion)**: centenas de correções de quest, item e script acumuladas por anos.

No Steam Deck, esses patches caem em duas categorias: os que são instaladores `.exe` (roda via ProtonTricks) e os que são substituição de arquivos (copia para a pasta do jogo).

## Instaladores .exe via ProtonTricks

Muitos patches vêm como instalador Windows. O procedimento é idêntico ao de instalar um runtime — mas com uma precaução extra:

```terminal
## Backup obrigatório antes de patchar
$ cp -r ~/.steam/steam/steamapps/compatdata/211420 ~/backups/prefix-dark-souls-$(date +%Y%m%d)

## Execute o instalador dentro do prefixo
$ protontricks -c 'wine "Z:\home\deck\Downloads\DSfix-2.4.exe"' 211420
```

O caminho `Z:\` é o mapeamento que o Wine faz da raiz Linux (`/`). Isso permite acessar qualquer arquivo do Deck sem precisar copiá-lo para dentro do prefixo.

Para patches que exigem que você aponte a pasta do jogo durante a instalação, o caminho dentro do prefixo será:

```terminal
C:\Program Files (x86)\Steam\steamapps\common\Dark Souls Prepare to Die Edition\DATA\
```

## Patches de arquivo: `.xdelta`, `.ips`, `.bep`

Patches de arquivo modificam binários existentes (o `.exe` principal, um `.dll`, um arquivo `.dat`). Os três formatos mais comuns e suas ferramentas Linux:

| Formato | Ferramenta | Comando típico |
|---|---|---|
| `.xdelta` | `xdelta3` | `xdelta3 -d -s original.bin patch.xdelta novo.bin` |
| `.ips` | `flips` | `flips --apply patch.ips original.rom novo.rom` |
| `.bep` (beat) | `beat` | `beat patcher patch.bep original.bin novo.bin` |

Exemplo real — aplicando um patch de widescreen a um jogo antigo:

```terminal
$ sudo apt install xdelta3 flips
$ cd ~/.steam/steam/steamapps/compatdata/123456/pfx/drive_c/Program\ Files/Game/

## Backup do executável original
$ cp game.exe game.exe.original

## Aplicar patch xdelta
$ xdelta3 -d -s game.exe.original widescreen-fix.xdelta game.exe
## Patch aplicado com sucesso. Novo arquivo: game.exe
```

Se o patch falhar ("checksum mismatch"), é porque a versão do arquivo não corresponde à esperada pelo patch. Nesse caso, verifique no PCGamingWiki se há múltiplas versões do patch para diferentes builds do jogo.

:::atencao
Alguns patches `.xdelta` são distribuídos para a versão GOG do jogo, que frequentemente difere da versão Steam. A assinatura do executável não bate e o patch rejeita. A solução é procurar uma versão do patch específica para Steam ou, em último caso, comprar a versão GOG para jogos antigos com forte dependência de patches.
:::

## Traduções de fãs

Traduções para português brasileiro de jogos que nunca receberam localização oficial são um dos usos mais práticos de patching. O Game Modding BR e o Fórum PXB mantêm catálogos extensos.

A maioria das traduções substitui arquivos de texto (`.txt`, `.json`, `.xml`) ou recursos empacotados (`.pak`, `.dat`). O processo típico:

```terminal
$ cd ~/Downloads
$ unzip "Traducao-PTBR-Jogo.zip"
Archive:  Traducao-PTBR-Jogo.zip
  inflating: data/localization/brazilian.pak
  inflating: LEIAME.txt

$ cp data/localization/brazilian.pak \
  ~/.steam/steam/steamapps/compatdata/789012/pfx/drive_c/Program\ Files/Game/data/localization/
```

Para traduções que vêm como instalador `.exe`:

```terminal
$ protontricks -c 'wine "Z:\home\deck\Downloads\Traducao-PTBR-Setup.exe"' 789012
```

:::dica
Muitas traduções brasileiras usam instaladores NSIS ou InnoSetup. Esses instaladores funcionam perfeitamente no Wine. Se o instalador pedir para localizar a pasta do jogo, o caminho é o Windows dentro do prefixo: `C:\Program Files (x86)\Steam\steamapps\common\NomeDoJogo`.
:::

## Special K e patches de runtime

O Special K (Kaldaien's Special K) merece menção própria. Ele é um framework de injeção que corrige problemas de framepacing, input lag, borderless window e vsync em centenas de jogos. No Proton, ele funciona como wrapper:

```terminal
$ protontricks -c 'wine "Z:\home\deck\SpecialK\SpecialK.exe"' 292030
```

O Special K injeta-se no processo do jogo e aplica as correções em tempo de execução. Ele é especialmente relevante no Deck porque resolve problemas de framepacing que o Gamescope às vezes não corrige — e o framepacing é crítico na tela de 90 Hz do Deck OLED.

## Revertendo patches

A vantagem do Linux: reverter um patch é tão simples quanto restaurar o backup. Sem registro bagunçado, sem DLL fantasma no System32:

```terminal
## Restaurar um único arquivo
$ cp game.exe.original game.exe

## Restaurar o prefixo inteiro
$ rm -rf ~/.steam/steam/steamapps/compatdata/211420
$ cp -r ~/backups/prefix-dark-souls-20250315 ~/.steam/steam/steamapps/compatdata/211420
```

Esta é uma das razões pelas quais o backup antes de cada patch é mandatório — e não opcional.

## Resumo

- Patches de comunidade corrigem bugs que desenvolvedores abandonaram e funcionam no Deck via ProtonTricks ou substituição de arquivos.
- Instaladores `.exe` rodam com `protontricks -c 'wine "Z:\home\deck\..."'`.
- Patches binários (`.xdelta`, `.ips`, `.bep`) aplicam-se com `xdelta3`, `flips` e `beat`.
- Traduções de fãs substituem arquivos de localização ou rodam instaladores dentro do prefixo.
- O Special K corrige framepacing e input lag em tempo de execução.
- O sistema de arquivos do Linux torna a reversão de patches trivial via restauração de backup.

## Exercícios

1. Aplique um patch de widescreen (`.xdelta`) a um jogo antigo da sua biblioteca. Confira se a resolução nativa do Deck (1280×800) é suportada.
2. Instale uma tradução PT-BR de fã em um jogo que não tem localização oficial. A tradução sobreviveu a uma verificação de integridade dos arquivos pelo Steam?
3. Use o Special K em um jogo com problemas conhecidos de framepacing. Compare o frametime graph antes e depois.
4. Aplique três patches diferentes a um mesmo jogo, um após o outro, revertendo cada um para confirmar que a reversão funciona.
5. **Desafio.** Pegue um jogo sem suporte nativo a 16:10, aplique um patch de widescreen, uma tradução PT-BR e um patch de áudio (restauração de trilha sonora). Documente a ordem de aplicação e eventuais conflitos.