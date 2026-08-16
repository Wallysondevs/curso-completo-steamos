O cursor que você vê na tela, os ícones dos aplicativos no menu e os emblemas das pastas do Dolphin são peças soltas que o Plasma gerencia em módulos separados. Trocá-los individualmente é o que transforma um tema "bom o suficiente" em algo que parece pensado para o Steam Deck — com cursores maiores que o padrão e ícones que não se perdem na grade do Application Launcher.

:::objetivos
- Aplicar temas de cursor pela interface gráfica e pela linha de comando
- Ajustar tamanho do cursor para o touchscreen do Deck
- Navegar e alternar temas de ícones no módulo de Appearance
- Entender onde os temas de cursor e ícones ficam armazenados no disco
- Corrigir inconsistências de cursor entre aplicativos Qt e GTK
:::

## Cursores: tema e tamanho

O KDE gerencia cursores em **Appearance & Style → Colors & Themes → Cursors**. O tema padrão no SteamOS é o *Breeze*, limpo e escalável. Mas o que mais importa no Deck é o tamanho: um cursor de 24 px, que é o padrão, pode ser pequeno numa tela pequena de alta densidade quando seus dedos estão nos touchpads e você precisa acertar um alvo.

```terminal
$ kcmshell6 cursortheme
```

O módulo abre com uma galeria de temas instalados e um controle deslizante de tamanho. Aumentar para 36 ou 48 px deixa o ponteiro visível em movimento rápido, algo que acontece o tempo todo no Deck quando se alterna entre touchscreen e touchpad.

Pela linha de comando, a configuração fica em `kdeglobals`:

```terminal
$ grep -i cursor ~/.config/kdeglobals
cursorTheme=Breeze_Light
```

No Plasma 6, a chave `cursorTheme` (sem underline entre "cursor" e "Theme") define o tema, e a chave `cursorSize` define o tamanho em pixels. Se `cursorSize` não estiver presente, o sistema usa o tamanho padrão do tema.

```terminal
$ kwriteconfig6 --file kdeglobals --group General --key cursorSize 36
$ kwriteconfig6 --file kdeglobals --group General --key cursorTheme breeze_cursors
```

O tema `breeze_cursors` é o nome interno, diferente do nome bonito que aparece na interface (*Breeze*). Para descobrir o nome interno de um tema de cursor, cheque a pasta onde ele está instalado:

```terminal
$ ls /usr/share/icons/
breeze_cursors  breeze-dark  breeze  breeze-dark_cursors  ...
```

Temas de cursor geralmente têm sufixo `_cursors` quando são empacotados separadamente. Se você não acertar o nome interno, o Plasma cai para o cursor padrão X11 — uma seta preta básica.

## Onde os cursores moram

Os temas de cursor são diretórios de imagens XCursor (arquivos em formato binário) mais um arquivo `index.theme`. Os locais onde o Plasma procura:

```terminal
$ ls /usr/share/icons/breeze_cursors/
arrow  base_arrow_down  base_arrow_up  ...  wait  xterm
$ ls ~/.local/share/icons/
```

Se você baixar um tema de cursor (de sites como gnome-look.org), extraia-o para `~/.local/share/icons/` e ele aparece na galeria do módulo de cursores após um `kcmshell6 cursortheme` fechar e reabrir.

:::atencao
Aplicativos GTK (como o próprio Steam, que usa toolkit GTK na interface do cliente) consultam a configuração de cursor por um caminho diferente do Qt. O Plasma tem uma página de sincronização em **Appearance & Style → Application Style → Configure GNOME/GTK Application Style** que replica o tema de cursor para as variáveis de ambiente que o GTK lê. Se o cursor muda nos apps do KDE mas não no Steam, é essa sincronização que está faltando.
:::

## Ícones

O módulo de ícones em **Appearance & Style → Icons** controla o conjunto visual usado nos menus, na bandeja do sistema, no Dolphin e no Application Launcher. O SteamOS traz o *Breeze* (ícones coloridos modernos) e o *Breeze Dark* (variante com tons mais escuros). A diferença é sutil: o Breeze Dark usa ícones monocromáticos em botões de barra, mas mantém os ícones coloridos onde o contraste com fundo escuro é baixo.

```terminal
$ ls /usr/share/icons/breeze/
actions  animations  apps  categories  devices  emblems  ...
$ ls /usr/share/icons/breeze-dark/
actions  apps  categories  devices  ...
```

Cada tema de ícone é uma árvore de diretórios cheia de arquivos `.svg` e `.png`. Os tamanhos são organizados em subpastas numéricas (`16x16`, `22x22`, `32x32` etc.), e o `index.theme` na raiz declara quais tamanhos o tema suporta e a herança (um tema pode herdar ícones de outro, cobrindo só os ícones diferentes).

## Trocando ícones pela linha de comando

```terminal
$ kwriteconfig6 --file kdeglobals --group Icons --key Theme breeze-dark
$ kwriteconfig6 --file kdeglobals --group Icons --key Theme breeze
```

Depois de trocar, nem sempre todos os aplicativos abertos se atualizam sozinhos. O Dolphin e o menu de aplicativos costumam responder na hora; outros podem precisar ser fechados e reabertos. Se tudo falhar, um `plasmashell --replace &` força a recarga completa da shell.

:::dica
No Steam Deck, o tema de ícones *Breeze* padrão funciona bem, mas se você instalar aplicativos Flatpak (muito comum no Deck), eles podem vir com ícones próprios que não seguem o tema do sistema e destoam. Isso não é culpa do Plasma — cada Flatpak pode empacotar seus próprios ícones. Para minimizar o contraste, prefira temas de ícones com paleta neutra, como o próprio Breeze.
:::

## Ícones personalizados e emblemas

Temas de ícones novos se instalam em `~/.local/share/icons/`. Basta copiar a pasta do tema e ele aparece na galeria. Já os **emblemas** do Dolphin (aquelas sobreposições de ícone como um cadeado ou um "check" verde) não são controlados pelo tema de ícones do Plasma, e sim pelo próprio Dolphin nas configurações internas de cada pasta. Isso é assunto para o capítulo de gerenciamento de arquivos, não de aparência do sistema.

## Resumo

- `kcmshell6 cursortheme` abre o módulo de cursores; tamanho e tema são as duas alavancas principais.
- A chave `cursorTheme` e `cursorSize` em `kdeglobals` controlam cursor pela linha de comando.
- Temas de cursor ficam em `/usr/share/icons/` (sistema) e `~/.local/share/icons/` (usuário); o nome interno é o nome da pasta.
- Aplicativos GTK precisam de sincronização explícita via Application Style para herdar o cursor do Plasma.
- Ícones seguem o mesmo esquema de pastas em `/usr/share/icons/`; a chave no `kdeglobals` é `Theme` no grupo `Icons`.
- `plasmashell --replace &` é o último recurso para forçar ícones e cursores novos em toda a shell.

## Exercícios

1. Liste os temas de cursor disponíveis com `ls /usr/share/icons/*_cursors/ 2>/dev/null` e compare com a galeria de `kcmshell6 cursortheme`. A quantidade de resultados bate?
2. Aumente o tamanho do cursor para 48 px via `kwriteconfig6`, confirme a chave com `grep cursorSize ~/.config/kdeglobals` e observe a diferença prática no touchscreen.
3. Troque o tema de ícones para `breeze-dark` com `kwriteconfig6` e verifique se o menu de aplicativos e o Dolphin respondem sem reiniciar nada.
4. Instale um tema de ícones baixado da internet em `~/.local/share/icons/` e confirme que ele aparece na galeria após um `kcmshell6 icons` (nome interno do módulo: `icons`).
5. **Desafio.** Conecte-se via SSH ao Steam Deck a partir de outro computador, troque o tema de cursor com `kwriteconfig6` remotamente e observe se a mudança se propaga para a sessão gráfica ativa. Por que a mudança pode precisar de `plasmashell --replace` para ser percebida?