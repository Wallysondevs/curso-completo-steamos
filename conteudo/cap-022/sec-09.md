O Steam Deck tem uma tela de 7 a 7,4 polegadas, dois touchpads, touchscreen e controles físicos. O Modo Desktop foi projetado para mouse e teclado — mas você não precisa aceitar essa premissa. Combinando tudo o que este capítulo ensinou, é possível criar um ambiente visual que respeita o espaço apertado da tela, os métodos de entrada do Deck e a alternância constante entre jogo e desktop.

:::objetivos
- Montar uma configuração visual pensada para a tela e os controles do Steam Deck
- Selecionar tamanhos de fonte e cursor adequados para 800p em 7-7,4"
- Otimizar o look and feel para uso com touchscreen e touchpads
- Escrever um script de restauração visual pós-atualização do SteamOS
- Criar um snapshot completo antes de mudanças drásticas no visual
:::

## O perfil "Deck Desktop"

O SteamOS vem configurado para funcionar, não para brilhar no desktop. Aplicando o que vimos nas seções anteriores, o perfil ideal para o Deck no Modo Desktop combina estas escolhas:

| Elemento | Escolha recomendada | Por quê |
|---|---|---|
| Tema global | Breeze Dark | Padrão, estável, não instala plasmoids de terceiros |
| Fonte geral | Noto Sans 11 pt | Um ponto acima do padrão para compensar a densidade |
| Fonte monoespaçada | Hack 10 pt | Legível no Konsole sem consumir largura demais |
| Cursor | Breeze 36 px | Alvo fácil no touchscreen e visível no touchpad |
| Decoração | Breeze, botões grandes | Botões grandes de fechar/minimizar; dedos agradecem |
| Transparência | Desativada ou 95% opaca | Economiza GPU e melhora legibilidade |

Aplicar isso é uma sequência de comandos que você já conhece:

```terminal
$ lookandfeeltool -a org.kde.breezedark.desktop
$ kwriteconfig6 --file kdeglobals --group General --key font "Noto Sans,11,-1,5,50,0,0,0,0,0,Regular"
$ kwriteconfig6 --file kdeglobals --group General --key fixed "Hack,10,-1,5,50,0,0,0,0,0,Regular"
$ kwriteconfig6 --file kdeglobals --group General --key cursorSize 36
$ kwriteconfig6 --file kwinrc --group "org.kde.kdecoration2" --key BorderSize Large
$ kwriteconfig6 --file breezestyleconfig --group "Misc" --key MenuOpacity 0.95
$ plasmashell --replace &
```

Cada linha corresponde a uma seção deste capítulo. Juntas, elas transformam o visual do Deck em menos de um minuto, sem navegar por sete módulos diferentes do System Settings.

## Snapshot antes da mudança drástica

Antes de aplicar um tema novo, trocar o motor Aurorae ou experimentar ícones de terceiros, tire um snapshot do estado atual:

```terminal
$ mkdir -p ~/snapshots/kde-$(date +%Y%m%d-%H%M%S)
$ cp ~/.config/kdeglobals ~/snapshots/kde-$(date +%Y%m%d-%H%M%S)/
$ cp ~/.config/kwinrc ~/snapshots/kde-$(date +%Y%m%d-%H%M%S)/
$ cp ~/.config/breezestyleconfig ~/snapshots/kde-$(date +%Y%m%d-%H%M%S)/
$ cp ~/.config/plasmashellrc ~/snapshots/kde-$(date +%Y%m%d-%H%M%S)/
```

O `$(date +%Y%m%d-%H%M%S)` insere um carimbo de data e hora no nome da pasta, então cada snapshot fica com um identificador único: `kde-20250114-153022`, por exemplo. Se a experiência der errado, restaurar é copiar tudo de volta e recarregar.

## Script de restauração pós-atualização

Quando o SteamOS recebe uma atualização grande, o sistema preserva seu home, mas às vezes reaplica configurações padrão do Plasma — especialmente se a Valve mexer no tema padrão ou na versão do KDE. Um script de restauração que vive no home resolve:

```bash
#!/bin/bash
# restore-kde-look.sh — Restaura as preferências visuais do KDE no Steam Deck
set -e

BACKUP_DIR="$HOME/backup-kde-config"
if [ ! -d "$BACKUP_DIR" ]; then
    echo "Diretório de backup $BACKUP_DIR não encontrado."
    exit 1
fi

echo "Restaurando configurações do KDE..."
cp "$BACKUP_DIR/kdeglobals" "$HOME/.config/"
cp "$BACKUP_DIR/kwinrc" "$HOME/.config/"
cp "$BACKUP_DIR/breezestyleconfig" "$HOME/.config/"

# Temas extras
[ -d "$BACKUP_DIR/color-schemes" ] && cp -r "$BACKUP_DIR/color-schemes" "$HOME/.local/share/"
[ -d "$BACKUP_DIR/aurorae" ] && cp -r "$BACKUP_DIR/aurorae" "$HOME/.local/share/"
[ -d "$BACKUP_DIR/icons" ] && cp -r "$BACKUP_DIR/icons" "$HOME/.local/share/"

echo "Recarregando o shell do Plasma..."
plasmashell --replace &

echo "Pronto."
```

Salve como `~/restore-kde-look.sh`, dê permissão de execução e use após cada grande atualização do sistema:

```terminal
$ chmod +x ~/restore-kde-look.sh
$ ~/restore-kde-look.sh
Diretório de backup /home/ana/backup-kde-config não encontrado.
```

Ah — esquecemos de criar o backup. Mas você não vai cometer esse erro depois de ler a seção 8.

## Ajustes finos de touchscreen

No Steam Deck, o touchscreen é o método de entrada mais direto, mas o Plasma não foi desenhado para dedos — foi desenhado para ponteiro de mouse. Alguns ajustes específicos ajudam:

- **Botões de janela à direita e grandes**: dedos curtos alcançam melhor o canto superior direito que o esquerdo;
- **Sem transparência em tooltips**: o dedo cobre o texto quando você toca, então tooltips já são de pouca ajuda; a transparência só piora;
- **Painel inferior com altura ligeiramente maior**: arraste a borda do painel para aumentar uns 6-8 px extras — o espaço perdido é mínimo e o alvo de toque melhora muito.

```terminal
$ kwriteconfig6 --file kdeglobals --group General --key cursorSize 40
```

Um cursor de 40 px parece exagero no monitor externo, mas na tela do Deck, com touchpad, é a diferença entre acertar e errar o alvo.

## Quando o visual quebra: checklist de resgate

Se o Modo Desktop acordar com aparência quebrada (sem barras de título, cores padrão feias, ícones ausentes), siga esta ordem:

```terminal
## 1. Confirme que o Plasma está rodando normalmente
$ pgrep -la plasmashell
3840 plasmashell

## 2. Aplique o tema padrão do SteamOS
$ lookandfeeltool -a org.kde.breezedark.desktop

## 3. Reinicie o shell
$ plasmashell --replace &

## 4. Se mesmo assim não resolveu, verifique o kdeglobals
$ kreadconfig6 --file kdeglobals --group General --key ColorScheme

## 5. Último recurso: restaure do seu snapshot
$ cp ~/snapshots/kde-20250114-153022/*.rc ~/snapshots/kde-20250114-153022/*globals ~/.config/
$ plasmashell --replace &
```

Em 90% dos casos, o passo 2 resolve. Os outros 10% são temas de terceiros que deixaram rastros no `kdeglobals` que o `lookandfeeltool` não sobrescreve, e aí o snapshot salva.

:::info
O SteamOS usa um sistema de arquivos somente-leitura para a raiz (`/`). As personalizações do KDE vivem no home (`/home/deck`), que é gravável, então nenhuma atualização do sistema apaga seus arquivos de configuração. O que pode acontecer é a Valve mudar o tema padrão do sistema, fazendo seu `kdeglobals` referenciar um tema que não existe mais. Nesse caso, o Plasma cai de volta para o padrão de fábrica até você reaplicar seu backup.
:::

## Resumo

- O perfil "Deck Desktop" combina Breeze Dark, Noto Sans 11 pt, cursor 36 px e botões de janela grandes — tudo aplicável em 7 comandos.
- Snapshot do estado do KDE com carimbo de data/hora permite experimentar sem medo.
- Um script de restauração em `~/restore-kde-look.sh` resolve a reconfiguração pós-atualização do SteamOS com um comando.
- Ajustes finos de touchscreen (botões à direita, sem transparência, painel mais alto) melhoram a experiência no Deck.
- A checklist de resgate de visual quebrado começa com `lookandfeeltool -a` e termina no snapshot.

## Exercícios

1. Aplique o perfil "Deck Desktop" completo com os 7 comandos listados e reinicie o plasma. Use o Deck no Modo Desktop por 10 minutos e anote o que melhorou e o que ainda incomoda.
2. Crie um snapshot do estado atual do KDE com `date` no nome da pasta. Depois troque o tema global para um de terceiros e restaure o snapshot.
3. Escreva seu próprio script `~/restore-kde-look.sh` (não copie o do texto — escreva do zero com os arquivos que você julga essenciais) e teste-o.
4. Simule uma "quebra": renomeie o arquivo `kdeglobals` para `kdeglobals.broken`, recarregue o plasma e observe o caos. Depois restaure o arquivo original e recarregue novamente.
5. **Desafio.** Com base no script de restauração, crie um script `toggle-deck-mode.sh` que alterna entre o perfil "Desktop otimizado para Deck" (cursor grande, fonte aumentada, botões grandes) e o perfil "Desktop para monitor externo" (cursor 24 px, fonte 10 pt, botões normais) detectando automaticamente se há um monitor externo conectado via `kscreen-doctor --outputs`. Use `kwriteconfig6` para alternar cada chave relevante.