Toda janela do Plasma tem uma moldura: a barra de título com os botões de minimizar, maximizar e fechar. Quem desenha essa moldura é o **motor de decoração de janelas**. No KDE existem dois motores bem diferentes — o Breeze (desenhado em código C++ nativo) e o Aurorae (desenhado a partir de arquivos SVG editáveis). Escolher entre eles determina o quanto você consegue personalizar a borda das janelas no Steam Deck.

:::objetivos
- Entender a diferença entre os motores Breeze e Aurorae para decoração de janelas
- Configurar o tema de decoração pela interface e pela linha de comando
- Explorar os arquivos de configuração da decoração em `~/.config`
- Ajustar o tamanho e a posição dos botões de janela no título
- Aplicar um tema Aurorae personalizado com SVG
:::

## Dois motores, duas filosofias

O motor **Breeze** desenha as barras de título programaticamente, com código C++ otimizado. É rápido, nítido em qualquer resolução e tem visual consistente — mas oferece pouca personalização além de tamanho dos botões e posição deles (esquerda ou direita).

O motor **Aurorae** funciona de outro jeito: a decoração inteira é descrita por arquivos SVG, que são gráficos vetoriais editáveis em qualquer ferramenta como o Inkscape. Isso permite temas com bordas arredondadas, sombras personalizadas, cores degradê e formatos que o Breeze não reproduz.

```terminal
$ kcmshell6 kwindecoration
```

O comando acima abre o módulo de decoração de janelas diretamente. Nele, um seletor no topo escolhe o motor (Breeze ou Aurorae), e abaixo aparece a galeria de temas para o motor selecionado.

## Configuração pela interface

Na página **Appearance & Style → Colors & Themes → Window Decorations**, você escolhe o tema e, no ícone de lápis, edita detalhes. No Breeze, os ajustes principais são:

- **Tamanho dos botões** — pequeno, médio, grande ou gigante;
- **Posição dos botões** — à esquerda (estilo macOS) ou à direita (padrão Windows/KDE);
- **Desenhar um traço ao redor da janela** — reforça a borda em casos de pouco contraste entre janelas sobrepostas.

No Deck, com touchscreen, botões grandes são mais fáceis de acertar com o dedo ou o touchpad. Vale aumentar do padrão para "grande" se você usa muito o Modo Desktop pelo toque.

## Ajuste pela linha de comando

Assim como cores e temas, a decoração também responde ao `kwriteconfig6`, mas com um arquivo e uma chave específicos:

```terminal
$ kwriteconfig6 --file kdeglobals --group "KWin" --key "plugin" org.kde.breeze
$ kwriteconfig6 --file kwinrc --group "org.kde.kdecoration2" --key "BorderSize" Normal
```

A primeira linha define o motor de decoração; a segunda ajusta o tamanho da borda no arquivo `kwinrc`, onde o gerenciador de janelas KWin guarda suas preferências. Depois de mudar, reinicie o KWin para aplicar:

```terminal
$ kwin_x11 --replace &
```

No Wayland (padrão do SteamOS), o KWin é o próprio compositor e não pode ser "substituído" de forma independente do jeito do X11; nesse caso o caminho é trocar o tema na interface, que notifica o KWin sem reiniciar a sessão.

:::atencao
No SteamOS 3.6, a sessão gráfica do Modo Desktop roda sobre Wayland por padrão. O truque clássico `kwin_x11 --replace &` só faz sentido se você logou numa sessão X11 (disponível na tela de login). Em Wayland, prefira a interface gráfica para trocas de decoração, que são aplicadas sem interromper o compositor.
:::

## Onde a decoração mora

A configuração de decoração se espalha por mais de um arquivo. Vale conhecer os principais para depurar:

```terminal
$ grep -i -E 'plugin|BorderSize|ButtonsOn' ~/.config/kwinrc
Plugin=org.kde.breeze
BorderSize=Normal
ButtonsOnLeft=CHM
```

- `Plugin` — o motor de decoração ativo (em `kdeglobals` no Plasma 6, ou em `kwinrc` em versões antigas);
- `BorderSize` — o tamanho da borda;
- `ButtonsOnLeft` / `ButtonsOnRight` — quais botões aparecem e a ordem. Os códigos são letras: `H` = help, `I` = minimize (de *iconify*), `A` = maximize, `X` = maximize+minimize, `C` = close, `M` = menu.

A string `CHM` acima significa: Close, Help, Minimize(Iconify), da esquerda para a direita.

## Criando um tema Aurorae próprio

Com o motor Aurorae, um tema é uma pasta dentro de `~/.local/share/aurorae/themes/` contendo, no mínimo, um arquivo `metadata.desktop` e um SVG `decoration.svg`.

```terminal
$ ls ~/.local/share/aurorae/themes/
DeckRounded/
$ ls ~/.local/share/aurorae/themes/DeckRounded/
decoration.svg   metadata.desktop
```

O `metadata.desktop` declara nome, autor e o tipo de bordas (redimensionável por pixel ou por "nine-slice"). O `decoration.svg` contém camadas nomeadas (`top-left`, `top`, `top-right`, `left`, `right`, `bottom-left`, `bottom`, `bottom-right`, e os elementos de botão `close`, `maximize`, `minimize` em estados normal/ativo/hover). Ao salvar um SVG editado, o tema relê na hora.

```terminal
$ cat ~/.local/share/aurorae/themes/DeckRounded/metadata.desktop
[Desktop Entry]
Name=DeckRounded
Comment=Decoração arredondada para o Steam Deck
X-KDE-PluginInfo-Name=DeckRounded
X-KDE-PluginInfo-Author=ana
X-KDE-PluginInfo-Version=1.0
X-KDE-PluginInfo-Category=aurorae
```

:::dica
A forma mais rápida de começar um tema Aurorae próprio não é criar do zero: copie uma pasta de tema existente de `/usr/share/aurorae/themes/` para `~/.local/share/aurorae/themes/`, renomeie e edite o SVG. Você herda uma estrutura íntegra e só ajusta o que quer.
:::

## Resumo

- A decoração de janelas é desenhada por dois motores: Breeze (nativo, rápido, pouca personalização) e Aurorae (SVG, totalmente editável).
- `kcmshell6 kwindecoration` abre o módulo de decoração; ali você escolhe motor, tema, tamanho e posição dos botões.
- O motor ativo fica na chave `Plugin` de `kdeglobals` (Plasma 6), e detalhes como `BorderSize` em `kwinrc`.
- Os códigos de botão (H, I, A, X, C, M) definem a ordem dos botões na barra de título.
- Temas Aurorae ficam em `~/.local/share/aurorae/themes/` e se resumem a um `metadata.desktop` mais um `decoration.svg`.
- No Wayland (padrão do SteamOS), troque decoração pela interface para evitar mexer no compositor.

## Exercícios

1. Liste os temas de decoração instalados com `ls /usr/share/aurorae/themes/` e compare com a galeria do módulo de decoração. O Breeze aparece na pasta Aurorae? Por quê?
2. Abra `kcmshell6 kwindecoration` e alterne o tamanho dos botões para "grande". Observe a mudança nas janelas abertas e localize a chave alterada com `grep -i border ~/.config/kwinrc`.
3. Mude a posição dos botões de janela de direita para esquerda na interface e identifique a mudança com `grep -i buttons ~/.config/kwinrc`.
4. Copie um tema Aurorae de `/usr/share/aurorae/themes/` para `~/.local/share/aurorae/themes/`, renomeie a pasta e o `Name=` no `metadata.desktop`, e aplique-o na interface.
5. **Desafio.** Abra o `decoration.svg` de um tema Aurorae em um editor de texto e encontre o elemento que define a cor da barra de título. Altere essa cor, salve e recarregue o tema. Depois explique a diferença conceitual entre mudar uma cor no SVG do Aurorae e mudar um papel de cor no color scheme da seção 4.