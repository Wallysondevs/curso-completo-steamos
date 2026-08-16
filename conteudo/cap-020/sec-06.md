Widgets são os blocos de LEGO do Plasma: relógio, calendário, monitor de sistema, notas adesivas, previsão do tempo — qualquer um deles pode ir para o painel ou para a própria área de trabalho. No Steam Deck, os widgets transformam uma tela pequena e limitada num painel de controle sob medida: um medidor de CPU aqui, uma nota de lembrete ali, tudo ao alcance do dedo (ou do trackpad).

:::objetivos
- Explorar a galeria de widgets do Plasma
- Adicionar widgets à área de trabalho e ao painel
- Configurar widgets individuais e seus tamanhos
- Descobrir a origem dos widgets (Plasma, applets, terceiros)
- Remover e reorganizar widgets de forma segura
:::

## A galeria de widgets

A galeria de widgets se abre pelo modo de edição do desktop: clique com o botão direito na área de trabalho e escolha **Adicionar widgets** (Add Widgets), ou use o atalho do painel. Na galeria, os widgets do Plasma vêm organizados em categorias, e há dezenas deles instalados por padrão.

Alguns que brilham no deck:

| Widget | O que faz |
|---|---|
| Relógio digital | Hora e data, com calendário ao clicar |
| Monitor do sistema | Gráficos de CPU, memória e rede em tempo real |
| Notas adesivas | Lembretes que ficam na área de trabalho |
| Notificações | Fila de avisos do sistema |
| Bateria e brilho | Carga restante e controle de brilho |
| Previsão do tempo | Clima da sua região (precisa de configuração) |

Cada widget é, na verdade, um pequeno programa escrito com a tecnologia de *applets* do Plasma. Eles não são "imagens": rodam código e reagem a eventos, alguns consumindo recursos. Vários widgets de monitor, por exemplo, fazem polling de leituras do sistema e têm um custo pequeno mas real.

## Adicionando e posicionando

Para adicionar um widget à área de trabalho: entre no modo de edição e arraste o widget da galeria para a posição desejada. No painel, o processo é o mesmo — entre no modo de edição do painel e arraste. O Plasma oferece "ímãs" de alinhamento para encaixar os widgets numa grade organizada.

Do lado do arquivo de configuração, cada widget adicionado ganha uma entrada em `~/.config/plasma-org.kde.plasma.desktop-appletsrc`. Dá para ver os applets instalados e suas identificações:

```terminal
$ grep -E "^\[Containments\]|plugin=" ~/.config/plasma-org.kde.plasma.desktop-appletsrc | head -20
```

Aqui aparece a estrutura de **containments** (os contêineres, como o desktop e cada painel) e os **applets** (os widgets) ligados a cada um. Entender essa hierarquia de arquivo ajuda a diagnosticar widget que "sumiu" ou duplicou.

:::nota
No vocabulário interno do Plasma, o termo técnico para widget é **plasmoid** ou **applet**. O desktop em si é um *containment* de tipo `desktop`, e o painel é um *containment* de tipo `panel`. Quando você lê documentação ou mensagens de erro, "plasmoid" = "widget".
:::

## Configurando um widget

Todo widget tem uma janela de configuração própria, acessível pelo botão direito → **Configurar** (Configure). Nela você ajusta, por exemplo, o fuso horário do relógio, os sensores do monitor de sistema, ou o tamanho dos botões. As opções variam conforme o widget.

Parte dessa configuração também é gravada em arquivo. O relógio digital, por exemplo, guarda o formato de hora na própria configuração do applet:

```terminal
$ kwriteconfig5 --file plasma-org.kde.plasma.desktop-appletsrc \
    --group "Containments" --group "1" --group "Applets" --group "10" \
    --group "Configuration" --group "Appearance" --key "use24hFormat" true
```

O comando acima é ilustrativo da estrutura profunda e aninhada: `Containments` → containment 1 → applet 10 → sua configuração. Na prática, mexer direto num nível tão fundo do arquivo é arriscado, então prefira a interface para configurar widget e reserve o arquivo para leitura e backup.

:::atencao
Os números de applet no `desktop-appletsrc` (como o `10` do exemplo) são atribuídos pelo Plasma conforme a ordem de criação e **não são estáveis** entre máquinas. Nunca hardcode um número desses num script esperando que funcione em outro deck — confira sempre lendo o arquivo do seu próprio perfil.
:::

## Onde os widgets são instalados

Os widgets do Plasma vivem em diretórios de *applets*, e dá para listá-los:

```terminal
$ ls /usr/share/plasma/plasmoids/ | head -15
org.kde.desktopcontainment
org.kde.plasma.analogclock
org.kde.plasma.battery
org.kde.plasma.digitalclock
org.kde.plasma.notes
org.kde.plasma.systemmonitor
...
```

Cada pasta é um plasmoid, identificado por um nome reverso de domínio (`org.kde.plasma.*`). Widgets de terceiros (instalados via `pacman` ou baixados) também aparecem aqui ou em `~/.local/share/plasma/plasmoids/`. Para recarregar a galeria após instalar um widget novo manualmente:

```terminal
$ kbuildsycoca5 --noincremental
$ plasmashell --replace &
```

O primeiro reconstrói o cache de serviços (que indexa os plasmoids), o segundo recarrega o shell para que a galeria reflita o que há de novo.

## Removendo e reorganizando

Remover um widget é feito no modo de edição: botão direito → **Remover**. Isso não apaga o plasmoid do disco — apenas tira aquela instância do desktop/painel. Para rearranjar, arraste. Se o layout ficou bagunçado demais, dá para recomeçar restaurando o layout padrão do desktop:

```terminal
$ kquitapp5 plasmashell && rm ~/.config/plasma-org.kde.plasma.desktop-appletsrc && kstart plasmashell
```

Esse encadeamento mata o shell, apaga o arquivo de layout (o que reseta o desktop ao padrão) e relança. É o "reset de fábrica" dos widgets — radical, então faça backup antes.

:::perigo
O comando acima usa `rm` sobre o arquivo de layout do desktop. Ele apaga a posição de todos os seus painéis e widgets, retornando ao padrão de fábrica. É destrutivo para a sua personalização: faça um `cp ...bak` do arquivo antes de executar, e só rode se realmente quiser recomeçar do zero.
:::

## Resumo

- Widgets (plasmoids) são blocos reutilizáveis que vão para o desktop e para o painel, da galeria do Plasma.
- O desktop e o painel são "containments"; cada widget é um "applet" com identificador reverso (`org.kde.plasma.*`).
- O layout inteiro vive em `~/.config/plasma-org.kde.plasma.desktop-appletsrc`.
- Widgets instalados ficam em `/usr/share/plasma/plasmoids/` e `~/.local/share/plasma/plasmoids/`.
- `kbuildsycoca5 --noincremental` + `plasmashell --replace` recarregam a galeria; apagar o `desktop-appletsrc` reseta o layout ao padrão.

## Exercícios

1. Adicione o widget **Monitor do sistema** à área de trabalho e configure-o para mostrar CPU e memória.
2. Adicione um **Relógio digital** ao painel e ajuste o formato de 24 horas na configuração do widget.
3. Liste os plasmoids instalados com `ls /usr/share/plasma/plasmoids/` e identifique três que você ainda não usou.
4. Faça um backup do `desktop-appletsrc`, mova um widget de lugar e compare o arquivo antes e depois com `diff`.
5. **Desafio.** Instale (ou copie manualmente para `~/.local/share/plasma/plasmoids/`) um plasmoid de terceiros, recarregue com `kbuildsycoca5 --noincremental` e faça-o aparecer na galeria. Explique por que copiar o arquivo sozinho não basta sem o rebuild do cache.
