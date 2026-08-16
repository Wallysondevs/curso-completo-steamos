O painel é a âncora de tudo o que você faz no Modo Desktop: é onde ficam o menu de aplicativos, os programas abertos, o relógio e a bandeja. Por padrão, no SteamOS ele fica ocioso na parte de baixo da tela, discreto, esperando interação. Entender a anatomia desse painel é o primeiro passo para dominar o restante do capítulo, porque quase toda personalização que você fizer mais adiante ocorre sobre os mesmos blocos que vamos dissecar agora.

:::objetivos
- Mapear os componentes que formam o painel padrão do Plasma
- Usar o modo de edição do painel e seus controles
- Adicionar, remover e reposicionar widgets no painel
- Configurar largura, altura e comportamento do painel
- Criar e remover painéis extras
:::

## A anatomia do painel padrão

O painel do Plasma não é uma peça única: ele é um **contêiner** que hospeda uma sequência de **widgets**. Os quatro que vêm de fábrica no SteamOS, da esquerda para a direita, são:

1. O **Menu de aplicativos** (o Kickoff) — o ícone/launcher no canto esquerdo.
2. O **Gerenciador de tarefas** (uma barra com ícone de cada janela aberta).
3. O **Área de ícones de bandeja** — o agrupamento de relógio, rede, som e bateria.
4. O **Relógio digital**, que na verdade fica dentro da bandeja no layout padrão.

Isso fica evidente quando você entra no modo de edição. Clique com o botão direito no painel e escolha **Enter Edit Mode** (ou **Entrar no modo de edição**) e passe o cursor sobre cada região: o Plasma contorna, com uma linha tracejada, cada widget individualmente, revelando que o "painel" é na verdade uma grade de blocos.

## Editando o painel

O modo de edição é o coração da personalização, e vale a pena dominá-lo antes de qualquer configuração profunda. Há dois caminhos para entrar nele: o clique-direito no painel, ou a tela "Add Widgets" pelo canto. Quando você entra, uma barra de opções aparece na parte superior com controles como **Add widgets**, **Add spacer** (espaçador) e as opções de alinhamento.

| Ação | Onde clicar |
|---|---|
| Adicionar widget | Barra de edição → *Add widgets* |
| Mover widget | Arraste-o com o botão esquerdo |
| Remover widget | Clique-direito no widget → *Remove* |
| Espaço flexível | *Add spacer* e arraste para onde quiser |
| Redimensionar | Arraste as bordas do widget no modo edição |

O **spacer** merece destaque: ele é um bloco invisível que "empurra" o conteúdo para os lados. Colocar um espaçador entre o gerenciador de tarefas e a bandeja, por exemplo, faz a bandeja (relógio e ícones) colar no canto direito, deixando os ícones de janelas centralizados ou à esquerda — um truque clássico para reproduzir o visual de outros desktops.

## Ajustando o painel em si

Além dos widgets, o próprio painel tem propriedades. Clique com o botão direito e escolha **Edit Panel** (ou acesse pelas configurações) para abrir um painel de preferências com opções como:

- **Location/Screen edge**: em qual borda o painel fica (em baixo por padrão; pode ir para cima, esquerda ou direita).
- **Alignment / Width**: alinhamento e largura do painel (ele pode ser fixo, encolher conforme o conteúdo ou se ajustar).
- **Height**: a altura em pixels (padrão em torno de 44–48 px no deck).
- **Visibility**: se fica sempre visível, se oculta automaticamente ou se some quando uma janela está maximizada.

Tudo isso também é configurável por arquivo, usando o `kwriteconfig5` que você já conheceu:

```terminal
$ kwriteconfig5 --file plasma-org.kde.plasma.desktop-appletsrc --group "PlasmaViews" \
    --group "Panel 2" --group "Defaults" --key "panelHeight" 56
```

O arquivo `plasma-org.kde.plasma.desktop-appletsrc` é onde o Plasma registra os painéis e o layout de cada widget. Um detalhe importante: depois de editar esse arquivo manualmente, é preciso reler a configuração.

:::atencao
Editar `plasma-org.kde.plasma.desktop-appletsrc` na mão é poderoso, mas frágil: o Plasma reescreve esse arquivo quando você mexe no layout pela interface. Se você editar o arquivo com o Plasma aberto, suas mudanças podem ser sobrescritas. Prefira a interface para mexer em layout e reserve o `kwriteconfig5` para chaves isoladas, como a altura do painel.
:::

## Reiniciando só o painel

Depois de editar o arquivo de configuração, ou quando o painel ficar em um estado estranho, o caminho é reiniciar o `plasmashell` — o processo que desenha o painel. Você já viu isso na seção anterior, mas agora com um comando mais específico:

```terminal
$ plasmashell --replace &
```

A flag `--replace` é o jeito recomendado de reiniciar o shell: ela instrui a nova instância a assumir o lugar da anterior de forma limpa, reaproveitando a configuração. O `&` no final joga o processo para background para que o terminal não fique travado observando o `plasmashell`. Depois disso o painel pisca e retorna recarregado.

Para confirmar que um novo processo subiu, compare o PID antes e depois:

```terminal
$ pgrep -x plasmashell
1777
$ plasmashell --replace &
$ pgrep -x plasmashell
1852
```

O PID mudou de `1777` para `1852`, o que prova que a instância antiga saiu e uma nova a substituiu.

:::dica
Se você for editar o arquivo `plasma-org.kde.plasma.desktop-appletsrc` manualmente, faça um backup antes: `cp ~/.config/plasma-org.kde.plasma.desktop-appletsrc ~/.config/plasma-org.kde.plasma.desktop-appletsrc.bak`. Assim, qualquer estado ruim é revertido em um comando.
:::

## Criando e removendo painéis

O Plasma permite mais de um painel ao mesmo tempo — útil no deck para ter, por exemplo, um painel inferior com tarefas e um painel lateral fino só com atalhos de widgets. Pelo modo de edição: clique-direito em qualquer painel e escolha **Add Panel** → **Empty Panel**, depois posicione e arraste widgets para ele.

Para remover um painel, clique-direito nele e escolha **Remove Panel**. Se preferir fazer isso por linha de comando de forma previsível, vale usar o `systemsettings` (as preferências do sistema) navegando até Workspace → Workspace Behavior, mas a remoção via modo de edição é mais direta.

```terminal
$ systemsettings kcm_kwinoptions
```

O comando acima abre diretamente um módulo de configuração (KCM, *KDE Config Module*) das opções do gerenciador de janelas. É uma habilidade que rende adiante: cada módulo do `systemsettings` tem um "atalho" de linha de comando que o abre direto, útil para construir tutoriais e scripts.

## Resumo

- O painel é um contêiner de widgets; no SteamOS ele reúne Kickoff, gerenciador de tarefas, bandeja e relógio.
- O modo de edição revela cada widget e permite mover, remover, adicionar e espaçar os blocos.
- O espaçador empurra conteúdo para os lados; altura, largura, borda e visibilidade são configuráveis por painel.
- O layout dos painéis vive em `~/.config/plasma-org.kde.plasma.desktop-appletsrc`.
- `plasmashell --replace &` reinicia o shell de forma limpa; `systemsettings kcm_*` abre módulos de configuração direto.

## Exercícios

1. Abra o painel em modo de edição e identifique, pelo contorno tracejado, os quatro widgets principais do layout padrão.
2. Adicione um espaçador entre o gerenciador de tarefas e a bandeja e observe o relógio "colar" no canto direito.
3. Altere a altura do painel para 56 px pela interface e confirme a mudança lendo a chave correspondente no arquivo `plasma-org.kde.plasma.desktop-appletsrc`.
4. Crie um painel lateral vazio, coloque nele um widget de relógio e depois remova o painel inteiro.
5. **Desafio.** Faça um `cp` de backup do `plasma-org.kde.plasma.desktop-appletsrc`, mude a altura do painel via interface, e depois restaure o backup com `plasmashell --replace &`. Explique por que restaurar o arquivo sozinho não bastou — foi preciso reiniciar o shell.
