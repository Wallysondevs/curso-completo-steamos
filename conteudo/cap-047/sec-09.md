Tudo o que o EmuDeck faz por botão também pode ser feito — e inspecionado — pela linha de comando. Conhecer o lado CLI do conjunto tem dois valores: primeiro, automatizar tarefas repetitivas; segundo, entender de verdade o que aconteceu sob a interface quando algo deu errado. Esta seção final costura o capítulo com ferramentas que vão além do botão de instalar.

:::objetivos
- Entender como os Flatpaks rodam isolados via bwrap e portal
- Manipular os arquivos de configuração do EmuDeck por script
- Automatizar a varredura de ROMs com ferramentas de linha de comando
- Consultar o Steam e seus atalhos fora da interface
- Escrever um pequeno script de pós-instalação idempotente
:::

## Flatpak e o isolamento por baixo

Cada emulador Flatpak roda numa sandbox criada pelo `bwrap` (bubblewrap), e é por isso que os caminhos dentro do app às vezes não batem com os do sistema. Ver o processo real ajuda a entender as restrições — e por que o EmuDeck precisa "furar" o sandbox para acessar `~/Emulation`.

```terminal
$ ps aux | grep bwrap | grep -v grep | head -3
deck 12345 ... bwrap --args ... org.libretro.RetroArch
deck 12346 ... bwrap --ro-bind / / --bind ~/.var/app/... ...
```

O `bwrap` remonta o sistema de arquivos para o processo filho: diretórios só de leitura (`--ro-bind`) e pontos de montagem próprios (`--bind`). A pasta `~/Emulation` normalmente é exposta ao emulador via `--bind`, ou pelo portal de arquivos do Flatpak. Quando um jogo "não acha" a ROM, a causa frequentemente é essa exposição que não foi feita.

```terminal
$ flatpak run --command=bash org.libretro.RetroArch -c 'ls ~/Emulation/roms'
```

Esse atalho abre um shell **dentro** da sandbox do RetroArch. Se o `ls` ali dentro não enxergar suas ROMs, enquanto o sistema as enxerga, o problema está na exposição de diretórios — não no caminho nem na ROM. É a checagem definitiva para o sintoma "o emulador não acha meus arquivos".

## Os arquivos de configuração sob o capô

O EmuDeck guarda seu estado em arquivos JSON no diretório `~/.config/EmuDeck/`. Entender a estrutura desses arquivos permite inspecionar e até corrigir a instalação sem reabrir a interface — útil em scripts ou quando a janela gráfica não abre.

```terminal
$ ls ~/.config/EmuDeck/backend/ | head -8
appRetroArch.json
appPPSSPP.json
emulatorInit.json
romManager.json
settings.json
```

Com o `jq`, você consulta esses arquivos de forma legível e dispara validações. Por exemplo, conferir se o caminho de ROMs registrado bate com o real:

```terminal
$ jq -r '.romDirectory // .storage.roms // empty' ~/.config/EmuDeck/backend/settings.json
/run/media/deck/emudeck/Emulation/roms
```

O `jq` extrai o campo de diretório de ROMs sem tossir se ele estiver aninhado de formas diferentes (o `// empty` encadeia alternativas). Esse tipo de consulta é a base de qualquer automação de sanity-check pós-instalação.

## Automatizando a varredura e a classificação

O SRM tem interface, mas a lógica de "qual extensão vai em qual pasta" pode ser conferida e até estendida por script. Listar as extensões que cada parser aceita, por exemplo, evita colocar a ROM na pasta errada.

```terminal
$ jq -r '.parsers[] | select(.title|test("SNES";"i")) | .fileExtensionsWithDot[]?' ~/.config/EmuDeck/backend/steam_rom_manager_parsers.json 2>/dev/null
$ file ~/Downloads/*.sfc ~/Downloads/*.smc 2>/dev/null
```

O primeiro comando mostra as extensões que o parser de SNES aceita; o segundo usa `file` (da seção 8) para conferir o tipo real dos arquivos. Juntando os dois, você escreve um script que move cada ROM para a pasta certa pela detecção de tipo, não pela extensão — a forma robusta de organizar coleções grandes.

```terminal
$ for f in ~/Downloads/*.gba; do
>   mkdir -p ~/Emulation/roms/gba
>   [[ $(file -b "$f") == *"Game Boy Advance"* ]] && mv "$f" ~/Emulation/roms/gba/
> done
```

O loop percorre os `.gba`, e só move aqueles cujo tipo real é "Game Boy Advance". É um mini-classificador que usa tudo que o capítulo construiu: detecção de tipo, pasta convencional e automação de shell.

## Consultando o Steam fora da interface

Os atalhos gerados pelo SRM vivem no `shortcuts.vdf`, que é ilegível à vista desarmada, mas processável. Contar quantos atalhos de emulação existem e checar se o Steam os carregou é uma automação útil.

```terminal
$ grep -c '"appname"' ~/.steam/steam/userdata/*/config/shortcuts.vdf
$ grep -o '"Exe"[[:space:]]*"[^"]*"' ~/.steam/steam/userdata/*/config/shortcuts.vdf | head -5
```

O primeiro conta quantas entradas de atalho existem; o segundo lista os executáveis apontados por cada atalho — confirmando que todos apontam para os Flatpaks/AppImages certos, e não para um executável antigo depois de uma migração.

:::info
O `shortcuts.vdf` não é um formato que o `jq` entenda (é VDF, parente do JSON de chaves sem vírgulas), então se usa `grep` e expressões regulares para extrair campos. Para manipulações complexas vale a pena ler sobre a estrutura VDF ou usar o próprio SRM como fonte de verdade.
:::

## Um script de pós-instalação idempotente

O valor do conhecimento de CLI se materializa num script que você roda após cada reinstalação ou mudança de armazenamento, e que **não quebra se rodado duas vezes** (idempotência). Ele cria pastas, valida BIOS e confere caminhos.

```bash
#!/usr/bin/env bash
set -euo pipefail

ROMDIR="${1:-$HOME/Emulation/roms}"
BIOSDIR="${1:+$(dirname "$1")/bios}"
BIOSDIR="${BIOSDIR:-$HOME/Emulation/bios}"

for d in gb gba snes ps2 psp; do
  mkdir -p "$ROMDIR/$d"
done

echo "== BIOS ausentes ou vazias =="
find "$BIOSDIR" -type f -size 0 -print 2>/dev/null || true

echo "== ROMs fora do lugar (extensão vs tipo) =="
find "$ROMDIR" -maxdepth 2 -type f \( -iname '*.gba' -o -iname '*.sfc' \) \
  -exec file -b {} \; -exec echo "  ↑ {}" \;
```

O script cria as pastas padrão, lista BIOS vazias (candidatas a problema) e percorre ROMs consolidando tipo e caminho numa só varredura. Como só adiciona e inspeciona, rodar de novo é inofensivo — a marca de uma boa automação.

## Resumo

- Flatpaks rodam via `bwrap`; a pasta `~/Emulation` é exposta à sandbox por bind ou portal.
- `flatpak run --command=bash <app>` abre um shell dentro da sandbox para testar visibilidade de arquivos.
- O estado do EmuDeck vive em JSONs em `~/.config/EmuDeck/backend/`, consultáveis com `jq`.
- `file` detecta o tipo real de uma ROM, permitindo classificação por conteúdo e não por extensão.
- O `shortcuts.vdf` é VDF (não JSON) e se inspeciona com `grep`, não com `jq`.
- Scripts idempotentes (criar pastas, validar BIOS, varrer ROMs) automatizam a pós-instalação.

## Exercícios

1. Rode `flatpak run --command=bash org.libretro.RetroArch -c 'pwd; ls ~'` e compare a visão interna da sandbox com a do seu home real.
2. Use `jq` para extrair o diretório de ROMs registrado em `~/.config/EmuDeck/backend/settings.json` e confira se ele corresponde ao caminho real.
3. Escreva um loop `for` que liste todas as extensões aceitas pelos parsers de três consoles diferentes usando `jq`.
4. Conte quantos atalhos existem no seu `shortcuts.vdf` e confirme via `grep` que todos os `Exe` apontam para caminhos válidos (use `test -e`).
5. **Desafio.** Escreva um script idempotente completo que: crie as pastas de ROMs, detecte e relate BIOS vazias, e classifique ROMs por tipo usando `file`, movendo cada uma para a pasta correta apenas se ainda não estiver lá. Rode duas vezes seguidas e demonstre que a segunda execução não altera nada.
