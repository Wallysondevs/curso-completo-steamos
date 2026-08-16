Nem todo aplicativo no Steam Deck é um cidadão Qt do KDE. Jogos, utilitários Flatpak e o próprio cliente Steam usam toolkits diferentes que se comportam como convidados na festa do Plasma. A página **Application Style** é o lugar onde você ensina o KDE a tratar bem esses convidados, definindo como cada família de aplicativos desenha seus botões, menus e barras de rolagem.

:::objetivos
- Configurar o widget style do Qt (Breeze, Fusion, kvantum) e entender quando cada um brilha
- Ajustar transparência e animações de menus e dicas de tela
- Sincronizar a aparência do Plasma com aplicativos GTK2 e GTK3
- Identificar qual toolkit um aplicativo usa com `ldd` e `grep`
- Diagnosticar inconsistências visuais entre aplicativos nativos e Flatpaks
:::

## Widget style do Qt

Em **Appearance & Style → Application Style**, a primeira seção se chama *Widget Style*. É aqui que você escolhe o motor que desenha os botões, barras de rolagem, campos de texto e abas de todos os aplicativos Qt nativos. As opções padrão:

| Estilo | Descrição |
|---|---|
| Breeze | O padrão do KDE. Limpo, moderno e bem integrado com o esquema de cores ativo |
| Fusion | Motor do Qt base. Mais simples, mas garantido em qualquer ambiente que rode Qt |
| MS Windows 9x | Aparência retrô — útil só para nostalgia ou teste de regressão |

```terminal
$ kcmshell6 style
```

O módulo de estilo abre direto na escolha do widget style. A troca é instantânea: ao aplicar o Fusion, você nota botões mais quadrados e um visual "genérico", sem a identidade do Breeze. Voltar ao Breeze restaura o visual padrão.

Por baixo, o estilo ativo fica no `kdeglobals`:

```terminal
$ grep -i widgetStyle ~/.config/kdeglobals
widgetStyle=Breeze
```

O Fusion existe por um bom motivo: é o fallback universal. Se você está depurando um aplicativo Qt que renderiza errado com o Breeze (mais comum em programas compilados contra versões antigas do Qt), trocar para Fusion isola se o problema é do motor Breeze ou do aplicativo.

:::dica
Em versões mais antigas do Plasma 5, o estilo padrão era o mesmo, mas a chave era `widgetStyle=org.kde.breeze` — com o nome completo. No Plasma 6, simplificou-se para `Breeze`. Se você encontrar referências antigas na internet, não estranhe a diferença.
:::

## Transparência e efeitos visuais

Abaixo do seletor de estilo, um botão **Configure...** abre ajustes finos que, dependendo do estilo, variam. Para o Breeze, os controles mais relevantes são:

- **Semi-transparent background of menus** — ativa transparência nos menus de contexto;
- **Semi-transparent background of tooltips** — transparência nas dicas de tela flutuantes.

No Steam Deck, menus semitransparentes podem deixar o texto ilegível dependendo do que está por trás. A transparência é um efeito bonito, mas consome um pouco mais de GPU — algo a considerar num dispositivo com bateria limitada.

```terminal
$ kwriteconfig6 --file breezestyleconfig --group "Misc" --key "MenuOpacity" 0.90
$ kwriteconfig6 --file breezestyleconfig --group "Misc" --key "ToolTipOpacity" 0.85
```

Os valores vão de `0.0` (totalmente transparente) até `1.0` (totalmente opaco). O padrão costuma ficar entre 0.90 e 0.95 — transparência sutil que não atrapalha a leitura.

O arquivo `breezestyleconfig` (em `~/.config/`) é exclusivo do estilo Breeze; o Fusion, por ser genérico, não tem arquivo de configuração separado.

## Sincronizando com aplicativos GTK

O Steam, o Firefox e muitos utilitários instalados via Flatpak usam GTK (GIMP Toolkit), não Qt. Sem sincronização, eles podem aparecer com tema claro enquanto o Plasma está no escuro, ou com cursor minúsculo enquanto o Plasma usa 36 px.

A página **Application Style → Configure GNOME/GTK Application Style** resolve isso:

```terminal
$ kcmshell6 gtkstyle
```

Ali você escolhe qual tema GTK será usado e se ele deve herdar cores, ícones e cursor do Plasma. Marcar todas as caixas (*Apply colors to non-Qt applications*, *Apply Plasma's icon theme* e *Apply Plasma's cursor theme*) é a configuração recomendada para consistência.

O que isso faz por trás? Escreve arquivos de configuração GTK no seu home:

```terminal
$ cat ~/.config/gtk-3.0/settings.ini
[Settings]
gtk-theme-name=Breeze
gtk-icon-theme-name=breeze
gtk-font-name=Noto Sans, 10
gtk-cursor-theme-name=breeze_cursors
gtk-cursor-theme-size=36
```

Para GTK4, o arquivo equivalente é `~/.config/gtk-4.0/settings.ini`. O KDE sincroniza ambos quando você aplica as configurações.

:::atencao
Aplicativos Flatpak rodam em sandbox e podem não enxergar `~/.config/gtk-3.0/settings.ini` porque o diretório do usuário dentro do Flatpak é diferente. Para que um Flatpak veja o tema GTK correto, você precisa instalar o tema correspondente **como Flatpak** (ex.: `flatpak install org.gtk.Gtk3theme.Breeze`) ou sobrescrever as configurações com `flatpak override --filesystem=~/.config/gtk-3.0`.
:::

## Descobrindo qual toolkit um app usa

Para entender por que um aplicativo não responde aos ajustes do Plasma, o primeiro passo é descobrir o toolkit dele:

```terminal
$ ldd /usr/bin/steam 2>/dev/null | grep -i -E 'libQt|libgtk'
libQt5XcbQpa.so.5 => /usr/lib/libQt5XcbQpa.so.5
```

No caso do Steam, a saída mostra que ele linka com Qt5, mas na verdade o cliente Steam é uma mistura — a interface principal é GTK, e certos componentes usam Qt. Por isso a sincronização GTK é importante mesmo para um app que parece "do KDE".

```terminal
$ ldd /usr/bin/dolphin | grep -i -E 'libQt|libgtk'
libQt6Core.so.6 => /usr/lib/libQt6Core.so.6
```

Já o Dolphin é Qt6 puro — ele responde diretamente ao widget style e ao color scheme do Plasma, sem precisar de sincronização GTK.

## Resumo

- O widget style do Qt (Breeze, Fusion) controla como botões, barras e campos são desenhados em aplicativos nativos.
- A chave `widgetStyle` em `kdeglobals` guarda a escolha; o Breeze tem arquivo de config próprio em `breezestyleconfig`.
- Transparência de menus e tooltips pode ser desativada ou ajustada com `MenuOpacity` e `ToolTipOpacity`.
- A página *GTK Application Style* sincroniza cor, ícone, cursor e fonte com apps não-Qt; grava `settings.ini` do GTK3 e GTK4.
- Flatpaks em sandbox podem ignorar configurações GTK do host — instale o tema GTK como Flatpak para resolver.
- `ldd` seguido de `grep` identifica qual toolkit um binário usa, ajudando a diagnosticar inconsistências.

## Exercícios

1. Abra `kcmshell6 style`, alterne entre Breeze e Fusion e observe um aplicativo Qt (Dolphin) para notar as diferenças visuais. Qual chave do `kdeglobals` mudou?
2. Ative a transparência de menus e tooltips no estilo Breeze, ajuste a opacidade para 0.80 e confira a mudança com um clique direito no desktop e com um tooltip na bandeja do sistema.
3. Abra `kcmshell6 gtkstyle`, marque todas as opções de sincronização e verifique o conteúdo de `~/.config/gtk-3.0/settings.ini` após aplicar.
4. Use `ldd` em três binários da `/usr/bin/` e classifique-os como Qt, GTK ou ambos. Qual deles seria o mais problemático de sincronizar visualmente?
5. **Desafio.** Instale um aplicativo GTK via Flatpak (como `flatpak install org.gnome.eog`), abra-o e compare o visual com um nativo do KDE. Depois instale o tema GTK Breeze como Flatpak (`flatpak install org.gtk.Gtk3theme.Breeze`) e veja se a aparência do Flatpak melhorou. Explique por que o Flatpak precisou de um passo extra que o nativo não precisou.