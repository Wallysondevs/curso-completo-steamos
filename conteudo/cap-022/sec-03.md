A fonte que você lê nos menus, nas barras de título e nos diálogos do KDE é a mesma que o terminal exibe quando você abre o Konsole: a família Noto Sans no SteamOS, ou alguma variante que você escolheu. Fontes não são cosmética — tamanho, DPI e hinting definem se você força os olhos depois de duas horas lendo tooltips no Deck ou se a leitura flui naturalmente. E, numa tela de 800p com densidade modesta, cada pixel de renderização de fonte conta.

:::objetivos
- Navegar pela página de fontes do System Settings e entender cada campo
- Identificar a fonte padrão do SteamOS com `grep font ~/.config/kdeglobals`
- Ajustar anti-aliasing, hinting e DPI para o painel do Steam Deck
- Instalar fontes adicionais pelo gerenciador de pacotes ou manualmente em `~/.local/share/fonts/`
- Diagnosticar fontes ilegíveis ou renderizadas com serrilhado
:::

## A página de fontes

Abra **Appearance & Style → Fonts** no System Settings. A tela mostra uma lista de papéis: *General*, *Fixed width*, *Small*, *Toolbar*, *Menu*, *Window title*. Cada um controla a fonte usada em um elemento específico da interface. O *General* é a fonte base de todos os widgets Qt; *Fixed width* é a do terminal; *Window title* é a barra de título de cada janela.

Para cada papel, você escolhe a família, o estilo (regular, bold, italic) e o tamanho em pontos (pt). O que o Plasma faz ao clicar em "Apply" é gravar essas escolhas no arquivo `kdeglobals`.

```terminal
$ grep font ~/.config/kdeglobals
font=Noto Sans,10,-1,5,50,0,0,0,0,0,Regular
fixed=Hack,10,-1,5,50,0,0,0,0,0,Regular
smallestReadableFont=Noto Sans,8,-1,5,50,0,0,0,0,0,Regular
toolBarFont=Noto Sans,9,-1,5,50,0,0,0,0,0,Regular
menuFont=Noto Sans,10,-1,5,50,0,0,0,0,0,Regular
activeFont=Noto Sans,10,-1,5,75,0,0,0,0,0,Bold
```

Cada linha é uma string composta por 11 campos separados por vírgula: família, tamanho em pontos, um marcador `-1` (que indica que o tamanho é em pontos, não pixels), peso (50 = normal, 75 = bold), itálico (0 = não), sublinhado, strikeout, um código de charset, tipo de espaçamento e o nome do estilo. A fonte padrão do SteamOS é Noto Sans a 10 pt para corpo de texto e 9 pt para barras de ferramentas — uma escolha que cabe bem nos 800p do Deck sem consumir área útil demais.

## Anti-aliasing, hinting e DPI

A mesma página de fontes tem um botão **Configure...** que abre um diálogo com ajustes globais de renderização:

- **Anti-aliasing**: suaviza as bordas dos glifos, eliminando o efeito "escada". Ligado por padrão, com subpixel RGB (típico de telas LCD, que é o painel do Deck original).
- **Hinting**: ajusta os glifos à grade de pixels. *Slight* é o padrão do SteamOS — um meio-termo entre nitidez e fidelidade ao desenho.
- **Force DPI**: útil quando o Plasma detecta errado o tamanho físico da tela. O Deck LCD tem ~215 DPI; o OLED, ~204 DPI. Forçar um valor errado pode deixar tudo minúsculo ou gigante.

```terminal
$ grep -i -E 'dpi|ForceFontDPI|Xft' ~/.config/kdeglobals
```

Se não houver saída, o Plasma está usando a detecção automática de DPI — normalmente o comportamento correto. Se houver uma linha `ForceFontDPI=192` ou similar, alguém ajustou manualmente e você pode mudar ali ou voltar ao automático removendo a chave.

:::nota
A configuração de DPI do Plasma é independente do `xrandr --dpi` do X11. No Wayland (padrão do SteamOS 3.6), o Plasma usa o protocolo `wp-fractional-scale` para negociar o escalonamento com o compositor, e a configuração via `kdeglobals` é o ponto de controle correto. Ajustes manuais em `~/.Xresources` não têm efeito numa sessão Wayland pura.
:::

## Instalando fontes adicionais

O SteamOS já vem com a família Noto (Sans, Sans Mono, Serif) e algumas outras como Hack para terminal. Mas instalar fontes TrueType ou OpenType extras é trivial.

```terminal
$ mkdir -p ~/.local/share/fonts
$ cp ~/Downloads/MinhaFonte.ttf ~/.local/share/fonts/
$ fc-cache -fv ~/.local/share/fonts/
```

O `fc-cache` reconstrói o cache do fontconfig, a biblioteca que o Plasma (e todo aplicativo que usa fontconfig) consulta para saber quais fontes estão disponíveis. A flag `-f` força a atualização mesmo que o cache atual pareça recente, e `-v` mostra cada fonte que foi indexada.

Para fontes disponíveis nos repositórios do Arch (a base do SteamOS), você pode usar o `pacman` no modo de escrita (com `sudo steamos-readonly disable` antes e `sudo steamos-readonly enable` depois). Para fontes Google, o pacote `ttf-google-fonts-git` cobre a biblioteca inteira, mas pesa mais de 2 GB — na prática, instalar manualmente as poucas fontes que interessam é mais leve num Deck de 64 GB.

```terminal
$ fc-list | head -6
/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf: Noto Sans:style=Regular
/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf: Noto Sans:style=Bold
/usr/share/fonts/truetype/noto/NotoSans-Italic.ttf: Noto Sans:style=Italic
/usr/share/fonts/truetype/hack/Hack-Regular.ttf: Hack:style=Regular
/usr/share/fonts/truetype/noto/NotoSerif-Regular.ttf: Noto Serif:style=Regular
/usr/share/fonts/truetype/noto/NotoSansMono-Regular.ttf: Noto Sans Mono:style=Regular
```

O `fc-list` lista todas as fontes conhecidas pelo sistema. O caminho completo do arquivo `.ttf` à esquerda e o nome da família à direita — esse nome é o que aparece no seletor do System Settings.

## Diagnosticando fontes ilegíveis

Se as fontes do Plasma parecem borradas ou com serrilhado excessivo, comece pelo diagnóstico:

```terminal
$ kcmshell6 fonts
```

O módulo de fontes abre com os ajustes de anti-aliasing. Verifique se o subpixel rendering está em RGB (e não BGR, que inverte a ordem dos canais e produz um halo colorido nas bordas). Confira também se o Steam Deck está no modo desktop com a resolução nativa de 1280×800 — qualquer resolução inferior ou escalonada vai degradar a renderização.

:::dica
Se você sente que as fontes do Plasma são pequenas demais no Deck, aumentar o tamanho geral de 10 pt para 11 pt costuma resolver de forma mais natural do que mexer no DPI global, porque só afeta os elementos de interface e não o conteúdo dos aplicativos.
:::

## Resumo

- A página de fontes do System Settings controla família, tamanho e estilo para cada papel da interface (general, fixed, toolbar, menu, window title).
- `grep font ~/.config/kdeglobals` exibe as configurações atuais no formato de 11 campos separados por vírgula.
- Anti-aliasing com subpixel RGB e hinting *slight* são os padrões ideais para o painel LCD do Steam Deck.
- O fontconfig gerencia o cache com `fc-cache`; `fc-list` lista todas as fontes instaladas.
- Fontes manuais vão em `~/.local/share/fonts/` e são ativadas com `fc-cache -fv`.

## Exercícios

1. Execute `grep font ~/.config/kdeglobals` e identifique qual fonte está configurada para cada papel. Troque a fonte de *Fixed width* para uma monoespaçada diferente na interface e confirme a mudança com o mesmo comando.
2. Abra `kcmshell6 fonts`, clique em "Configure..." e alterne entre os modos de anti-aliasing. Observe visualmente a diferença nos textos do System Settings após clicar em Apply.
3. Instale uma fonte TrueType qualquer no diretório `~/.local/share/fonts/`, rode `fc-cache -fv` e confirme com `fc-list | grep -i <nomedafonte>` que ela foi indexada. Depois selecione-a no System Settings.
4. Execute `grep -oP '^\w+(?=Font)' ~/.config/kdeglobals` e liste todos os papéis de fonte configurados. Algum papel usa fonte diferente da Noto Sans?
5. **Desafio.** Crie um arquivo `~/.config/fontconfig/fonts.conf` que defina uma fonte preferencial para toda a interface sem modificar o `kdeglobals`. Teste com `fc-match sans` antes e depois. Isso é diferente de configurar pelo System Settings — explique a diferença entre a configuração do fontconfig e a do Plasma.