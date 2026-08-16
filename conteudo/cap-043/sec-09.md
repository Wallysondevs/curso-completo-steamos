Você já sabe adicionar jogos não-Steam, instalar via Heroic e Lutris, resgatar da Prime Gaming e baixar artwork com o SRM. O que falta é unificar tudo numa biblioteca que pareça nativa: capas consistentes, categorias organizadas, atalhos que abrem direto no jogo sem launchers intermediários e uma experiência tão fluida no Game Mode quanto a dos jogos comprados na Steam.

:::objetivos
- Criar categorias Steam para organizar jogos por loja de origem
- Consolidar atalhos diretos (sem Heroic/Lutris intermediário) para performance
- Aplicar artwork consistente em toda a biblioteca
- Validar que cada atalho funciona no Game Mode
- Criar um script de reconstrução para restaurar tudo após formatar o Deck
:::

## Categorias: organizando a biblioteca mista

Com dezenas de jogos de cinco lojas diferentes, a biblioteca da Steam vira uma sopa de títulos. A solução é usar as **categorias** da Steam — coleções que agrupam jogos por critério que você define.

No Modo Desktop, clique com botão direito num jogo → **Adicionar a** → **Nova coleção**. Crie categorias como:

- **GOG** — jogos instalados via GOG (Heroic ou offline)
- **Epic** — jogos da Epic Games Store via Heroic
- **Prime** — jogos resgatados da Amazon Prime Gaming
- **Itch.io** — jogos independentes da plataforma itch.io
- **Humble** — jogos da Humble Bundle/Trove
- **Emulação** — ROMs e emuladores (capítulos futuros)

O SRM pode atribuir categorias automaticamente durante a geração de atalhos — nos seus parsers, configure o campo **Steam Category** com o nome desejado.

```terminal
$ cat ~/.steam/steam/userdata/*/config/localconfig.vdf | grep -A2 "Categories"
"Categories"
{
  "GOG"       { "added" "2025-01-15" }
  "Epic"      { "added" "2025-01-15" }
  "Prime"     { "added" "2025-01-15" }
}
```

O `localconfig.vdf` armazena as categorias no formato KeyValues da Valve. Você pode editá-lo manualmente, mas criar as coleções pela interface é mais seguro.

:::dica
Crie também coleções dinâmicas baseadas em filtros. Exemplo: uma coleção "Não-Steam" que agrupa automaticamente todo jogo cujo AppID é negativo. Vá em **Biblioteca → Coleções → Criar coleção dinâmica** e use o filtro "Origem" ou "Plataforma".
:::

## Atalhos diretos: cortando intermediários

O atalho que o Heroic gera invoca o Flatpak do Heroic, que invoca o Legendary, que invoca o Proton, que invoca o jogo. São camadas desnecessárias que adicionam latência e pontos de falha.

A alternativa é criar atalhos que vão direto ao ponto. Para jogos do Heroic, você já sabe que o comando real é algo como:

```terminal
$ cat ~/.local/share/applications/heroic_epic_celeste.desktop | grep Exec
Exec=/home/deck/.var/app/com.heroicgameslauncher.hgl/data/heroic/run.sh epic celeste
```

O script `run.sh` do Heroic é um wrapper. Você pode extrair dele o comando Wine final e criar um atalho que o chama diretamente:

```terminal
$ WINEPREFIX="/home/deck/Games/Heroic/Prefixes/Celeste" \
  WINE="/home/deck/.var/app/com.heroicgameslauncher.hgl/data/heroic/tools/wine/Wine-GE-8-26/bin/wine" \
  /home/deck/.var/app/com.heroicgameslauncher.hgl/data/heroic/tools/wine/Wine-GE-8-26/bin/wine \
  "/home/deck/Games/Heroic/Celeste/Celeste.exe"
```

Coloque esse comando num script shell em `~/bin/launch-celeste.sh` e aponte o atalho Steam para ele. O ganho de performance é modesto (1-2 segundos a menos de abertura), mas a confiabilidade melhora — menos intermediários significa menos coisas que podem quebrar com atualizações.

:::atencao
Cada vez que o Heroic atualiza o Wine-GE (ex.: de 8-26 para 8-27), o caminho do binário muda. Seus atalhos diretos quebram. Para resolver: crie um symlink estável (`~/bin/wine-ge-stable → .../Wine-GE-8-26`) e use-o nos scripts. Atualize o symlink manualmente depois de validar que a nova versão funciona com seus jogos.
:::

## Artwork consistente em toda a biblioteca

Ter artwork bonito não basta — ele precisa ser **consistente**. Se um jogo usa capa estilo 2D e outro usa capa 3D com logo gigante, a biblioteca parece um álbum de figurinhas colado por três pessoas diferentes.

Estabeleça um padrão visual e mantenha-o. Exemplos de padrões comuns no SteamGridDB:

- **Steam 600×900 (Standard)** — o visual padrão da Steam, limpo e reconhecível
- **Alternate** — arte alternativa, geralmente com logo proeminente
- **White Logo** — fundo branco com logo centralizado
- **Animated** — capa animada (WebM)

No SRM, nas configurações de artwork, você pode definir a ordem de preferência dos tipos. Coloque "Steam 600×900" primeiro se quiser consistência com os jogos nativos da Steam.

```terminal
$ file ~/.steam/steam/userdata/*/config/grid/*.jpg | head -5
-1234567890p.jpg: JPEG image data, 600x900
-1234567890.jpg: JPEG image data, 920x430
-1234567890_icon.jpg: JPEG image data, 32x32
```

Se algum jogo ficou sem artwork ou com arte borrada, você pode substituir manualmente: baixe a imagem do SteamGridDB e salve com o nome correto no diretório grid.

## Testando tudo no Game Mode

O Game Mode é o teste definitivo. O que funciona no Modo Desktop às vezes falha no Game Mode: controles não respondem, overlay não aparece, o jogo fecha sozinho. Para cada jogo não-Steam, valide:

1. O jogo abre e fecha corretamente no Game Mode
2. O overlay da Steam (`[[Steam]]`) funciona (frame rate, TDP, captura de tela)
3. O controle do Deck é reconhecido (às vezes é preciso reordenar controles no Steam Input)
4. O som sai pelos alto-falantes (sem redirect para HDMI fantasma)
5. Suspender/retomar funciona sem crash

Jogos que falham em algum desses itens precisam de ajustes específicos — que variam por jogo e estão documentados no ProtonDB e no fórum do Steam Deck.

```terminal
$ cat ~/Games/steam-compatibility-log.txt
2025-01-15: Celeste (Itch) → OK, Game Mode, Proton Exp.
2025-01-15: Hollow Knight (GOG) → OK, Game Mode, Proton 9.0
2025-01-16: Dead Cells (Epic) → Falhou overlay. Fix: disable Steam Input.
```

Mantenha esse log — ele é sua memória de compatibilidade. Quando formatar o Deck, você reinstala tudo seguindo o log, não redescobrindo cada problema.

## Script de reconstrução

Formatou o Deck? Trocou o SSD? Compre um Deck novo? O script de reconstrução restaura sua biblioteca não-Steam:

```bash
#!/bin/bash
# rebuild-nonsteam.sh — reconstrói biblioteca não-Steam
# Requer: lista de jogos em ~/Documents/nonsteam-inventory.json

echo "=== Rebuild Non-Steam Library ==="

# 1. Instalar Flatpaks necessários
flatpak install -y flathub com.heroicgameslauncher.hgl net.lutris.Lutris com.steamgriddb.SteamRomManager

# 2. Restaurar saves e configurações
rsync -av /run/media/deck/backup/saves/ ~/Games/

# 3. Reinstalar jogos Heroic/Epic
for game in $(jq -r '.heroic[]' ~/Documents/nonsteam-inventory.json); do
    echo "Reinstalando $game..."
    legendary install "$game" --platform epic
done

# 4. Rodar SRM para recriar atalhos e artwork
flatpak run com.steamgriddb.SteamRomManager --no-ui --save

echo "Reconstrução concluída. Reinicie a Steam."
```

Para que isso funcione, você precisa manter um inventário atualizado:

```terminal
$ cat ~/Documents/nonsteam-inventory.json
{
  "heroic": ["celeste", "hades", "hollow-knight"],
  "lutris": ["stardew-valley-gog", "into-the-breach-gog"],
  "itch": ["a-short-hike", "minit"],
  "amazon": ["the-messenger", "blasphemous"],
  "manual": ["doom-3-gog"]
}
```

Atualize esse JSON sempre que instalar um jogo novo. É um investimento de 30 segundos que poupa horas numa reconstrução futura.

:::dica
Para automatizar o inventário: agende um script que varre `~/Games/` e `~/.local/share/applications/` e gera o JSON automaticamente. Combine com `git` num repositório privado e você tem controle de versão da sua biblioteca não-Steam.
:::

## Resumo

- Categorias Steam organizam jogos por loja de origem; o SRM as atribui automaticamente
- Atalhos diretos (sem Heroic/Lutris como intermediário) são mais rápidos e confiáveis, mas exigem manutenção de paths
- Artwork consistente (mesmo estilo, mesma resolução) transforma a biblioteca mista em algo coeso
- Valide cada jogo no Game Mode: abertura, overlay, controle, som, suspender/retomar
- Mantenha `nonsteam-inventory.json` e um script de reconstrução para restaurar tudo após formatar

## Exercícios

1. Crie categorias Steam para cada loja de origem (GOG, Epic, Prime, Itch, Humble) e organize seus jogos não-Steam nelas.
2. Escolha um jogo do Heroic e crie um atalho direto com o comando Wine sem passar pelo Heroic. Meça a diferença de tempo de abertura com `time`.
3. Substitua manualmente a artwork de um jogo que ficou com capa feia. Use o SteamGridDB para baixar e salvar no diretório `grid/`.
4. Teste todos os seus jogos não-Steam no Game Mode. Anote os resultados num arquivo `compatibility-log.txt`.
5. **Desafio.** Crie o script `rebuild-nonsteam.sh` completo, incluindo: instalação de Flatpaks, reinstalação de jogos Heroic/Lutris, restauração de saves, execução do SRM e verificação final (cada jogo tem arquivo `.desktop` e artwork). Execute o script num ambiente limpo (ou simule com `echo` em modo dry-run) e documente o que funcionou e o que quebrou.