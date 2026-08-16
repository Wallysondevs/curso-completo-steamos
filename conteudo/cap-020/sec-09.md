Tudo o que foi apresentado neste capítulo — painel, menu, bandeja, áreas de trabalho, widgets, atalhos — converge num objetivo prático: transformar o Modo Desktop do Steam Deck num ambiente que trabalhe a seu favor, não contra você. Esta seção fecha o arco com a personalização essencial, aquela que dá resultado imediato com pouca configuração, e ensina a tornar suas escolhas **portáveis** entre reinstalações.

:::objetivos
- Aplicar um tema e um esquema de cores confortável para a tela pequena do deck
- Ajustar DPI e tamanho de fonte para a resolução do aparelho
- Automatizar ajustes do Plasma com um script de inicialização
- Fazer backup e restauração da configuração do Plasma
- Consolidar os comandos de reinício e diagnóstico aprendidos no capítulo
:::

## Temas e cores

O Plasma separa **tema** (a aparência dos widgets e painéis) de **esquema de cores** (a paleta de texto e fundo) e **decoração de janela** (as bordas e botões de fechar). Mexer nesses três de forma coordenada é o que deixa o desktop com cara própria.

O módulo de configuração de aparência abre pela linha de comando:

```terminal
$ systemsettings kcm_style
```

Ali você troca o tema de widgets, o estilo de decoração e o esquema de cores. Para uma tela pequena e de alto contraste como a do deck, um esquema escuro (o padrão **Breeze Dark**) já é sensato, mas vale experimentar fontes maiores e bordas mais grossas nas janelas — ajudam no toque com o dedo.

O tema escolhido é registrado e dá para consultá-lo nos arquivos de configuração:

```terminal
$ grep -i "theme\|LookAndFeel" ~/.config/kdeglobals
```

O `kdeglobals` é o arquivo global de aparência do KDE, e o parâmetro `LookAndFeelPackage` (ou `Name` na seção de tema) aponta para o pacote de aparência ativo. É um bom ponto de partida para scripts que replicam seu tema.

## DPI e fontes

Por ser um aparelho de 7 polegadas com resolução 1280×800, o Steam Deck já vem com um fator de escala razoável. Mas se você conectar num monitor externo, ou se quiser texto maior para leitura, o ajuste de **DPI e fontes** vira necessidade.

O comando abaixo abre o módulo de fontes, onde você define o tamanho das fontes de todo o desktop:

```terminal
$ systemsettings kcm_fonts
```

Para o ajuste fino de escala por tela, o módulo de display:

```terminal
$ systemsettings kcm_screen
```

Os valores também são graváveis via arquivo. Alterar o DPI global do X11, por exemplo:

```terminal
$ kwriteconfig5 --file kdeglobals --group General --key "Xft.dpi" 120
```

O valor `120` corresponde a um DPI de 120 (maior que os 96 padrão), o que amplia texto e elementos. Depois de mudar, é preciso reaplicar a sessão gráfica para o efeito valer em todos os aplicativos — um logout/relogin ou `plasmashell --replace &` para o shell.

:::atencao
Mudar o DPI do X11 afeta **todos** os aplicativos da sessão, não só o Plasma, e alguns jogos em modo Big Picture podem ficar deslocados se o valor destoar do que o Steam espera. Se mexer no DPI, teste o modo gaming logo em seguida e, se algo quebrar, restaure o valor original e faça logout.
:::

## Automatizando com um script de inicialização

Repetir ajustes a cada reinstalação é trabalho que um script elimina. Você pode consolidar suas preferências num único arquivo executável que roda uma vez e aplica tema, área de trabalho, atalhos e chaves de configuração.

```bash
## plasma-setup.sh — aplica a personalização essencial do Plasma
kwriteconfig5 --file kwinrc --group Desktops --key Number 3
kwriteconfig5 --file kwinrc --group Desktops --key Name_1 "Trabalho"
kwriteconfig5 --file kwinrc --group Desktops --key Name_2 "Jogos"

kwriteconfig5 --file plasmarc --group General --key ToolTipDelay 400

qdbus org.kde.KWin /KWin reconfigure
plasmashell --replace &
```

Torne o script executável e rode-o numa instalação limpa:

```terminal
$ chmod +x ~/lab/plasma-setup.sh
$ ~/lab/plasma-setup.sh
```

O script é a versão "de verdade" de tudo o que foi feito ao longo do capítulo via interface: cada linha é uma preferência que antes era um clique. Mantê-lo versionado significa que seu desktop viaja com você.

:::dica
Guarde esse script no `~/lab` e, se você usa o deck com frequência, faça dele parte do seu repositório pessoal de dotfiles. Assim, após qualquer formatação ou troca de aparelho, um único comando recompõe o ambiente inteiro.
:::

## Backup e restauração

A configuração do Plasma inteira — painéis, widgets, temas, atalhos — vive em `~/.config` e em alguns arquivos de `~/.local/share`. Um backup é simplesmente copiar a pasta relevante:

```terminal
$ mkdir -p ~/lab/backup
$ cp ~/.config/plasma-org.kde.plasma.desktop-appletsrc ~/lab/backup/
$ cp ~/.config/kwinrc ~/lab/backup/
$ cp ~/.config/kglobalshortcutsrc ~/lab/backup/
$ cp ~/.config/kdeglobals ~/lab/backup/
```

Restaurar é copiar de volta e recarregar o shell e o KWin:

```terminal
$ cp ~/lab/backup/plasma-org.kde.plasma.desktop-appletsrc ~/.config/
$ qdbus org.kde.KWin /KWin reconfigure
$ plasmashell --replace &
```

Esses quatro arquivos (`desktop-appletsrc`, `kwinrc`, `kglobalshortcutsrc`, `kdeglobals`) cobrem a esmagadora maioria da personalização: layout dos painéis, áreas de trabalho, atalhos e aparência. É um backup enxuto e suficiente para recompor a identidade do seu desktop.

## Resumo

- Tema, esquema de cores e decoração de janela são ajustados em `systemsettings kcm_style` e registrados no `kdeglobals`.
- DPI global (`Xft.dpi`) e fontes ajustam a legibilidade na tela pequena e em monitores externos.
- Um script com `kwriteconfig5` + `qdbus` + `plasmashell --replace` automatiza e versiona a personalização.
- O backup essencial cobre `desktop-appletsrc`, `kwinrc`, `kglobalshortcutsrc` e `kdeglobals`.
- Reaplicar configuração exige recarregar KWin (`reconfigure`) e o shell (`--replace`).

## Exercícios

1. Troque o esquema de cores para **Breeze Dark** em `systemsettings kcm_style` e confirme a mudança no `kdeglobals`.
2. Aumente o tamanho da fonte em `systemsettings kcm_fonts` e observe a diferença no painel e no Kickoff.
3. Escreva um script `plasma-setup.sh` que defina 3 áreas de trabalho nomeadas e um ToolTipDelay, e rode-o.
4. Faça o backup dos quatro arquivos essenciais para `~/lab/backup/` e mexa em alguma preferência, depois restaure.
5. **Desafio.** Integre tudo: escreva um script que faça o backup, aplique um tema via `kwriteconfig5`, recarregue KWin e shell, e ao final dispare um `notify-send "Plasma" "Personalização aplicada"`. Rode-o de ponta a ponta e valide cada etapa.