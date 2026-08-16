Abrir aplicativos é o gesto mais repetido de qualquer sessão de desktop, e no Steam Deck ele tem particularidades: a tela pequena, os touchpads e a ausência de teclado mudam o que é "rápido". Esta seção cobre o menu de aplicativos, o gerenciador de arquivos e o navegador, e como esses três se combinam para transformar o Deck numa estação de trabalho portátil.

:::objetivos
- Navegar pelo menu de aplicativos e pelo KRunner com eficiência
- Entender o papel do Dolphin como gerenciador de arquivos
- Localizar e abrir o navegador e os ajustes do sistema
- Reconhecer a estrutura básica de diretórios do usuário `deck`
:::

## O menu e o KRunner

Você já conhece os dois caminhos para abrir programas: o menu de aplicativos (canto inferior esquerdo) e o KRunner (`[[Alt+Espaço]]`). A diferença de característica entre eles merece ênfase: o menu organiza por categorias e é melhor para *descobrir* o que existe; o KRunner busca por nome e é melhor para *abrir rápido* o que você já conhece.

```text
Descobrir apps  →  menu de aplicativos  →  categorias  →  clicar
Abrir rápido    →  Alt+Espaço  →  digitar nome  →  Enter
```

O menu do Plasma também responde à busca: ao abrir, o foco já cai na barra de busca do topo, então você pode começar a digitar (ou ativar o teclado virtual) imediatamente. Em telas pequenas, essa busca costuma ser mais rápida que desfilar por categorias.

:::dica
O KRunner faz mais do que abrir apps: ele calcula, converte unidades, e casa com comandos. Digite `300*7` e ele resolve; digite `altura steam deck` e pode buscar. É uma ferramenta subestimada — vale explorar além de "abrir o Firefox".
:::

## O Dolphin e os arquivos

O **Dolphin** é o gerenciador de arquivos padrão do KDE. É a primeira ferramenta a conhecer quando você precisa copiar ROMs, ver capturas de tela ou organizar downloads. Ele mantém a mesma lógica de qualquer gerenciador — painel lateral com atalhos, área central com o conteúdo, barra de endereço no topo.

O diretório pessoal do usuário `deck` tem uma estrutura padrão, herdada do Linux:

```terminal
$ ls ~/
Desktop  Documents  Downloads  Music  Pictures  Public  Templates  Videos
$ ls ~/Desktop/
Return to Gaming Mode.desktop
```

A primeira linha lista as pastas padrão, no padrão *XDG user directories*. A segunda mostra que o ícone de retorno ao Modo Jogo é, na verdade, um arquivo `.desktop` na pasta `Desktop` — os atalhos da área de trabalho do Linux são arquivos de texto que descrevem um aplicativo ou ação.

:::nota
Arquivos `.desktop` são o mecanismo padrão do FreeDesktop.org para atalhos e entradas de menu em todo o Linux. Dentro deles há campos como `Name=`, `Exec=` (o comando executado) e `Icon=`. Você pode abrir um deles num editor para ver exatamente o que o atalho dispara.
:::

## O navegador e a internet

O SteamOS 3.6 traz um navegador de fábrica (o Firefox no Desktop, em versões recentes) acessível pelo menu ou pelo atalho do painel. Com ele você baixa aplicativos, consulta documentação e acessa o Steam pelo navegador. A navegação segue os mesmos padrões do desktop: aba, barra de endereço, favoritos — tudo acionável por toque ou touchpad.

Um detalhe prático: ao baixar um arquivo, ele cai em `~/Downloads` por padrão, e de lá você pode movê-lo com o Dolphin. Fazer a ponte "navegador baixa → Dolphin organiza → terminal executa" é o fluxo de trabalho central do Modo Desktop.

```terminal
$ ls ~/Downloads/
steamos-update-3.6.tar.gz
```

Aqui, um arquivo fictício baixado aparece na pasta de downloads. Verificar esse diretório após um download é um hábito que evita a pergunta "para onde foi meu arquivo?".

## Os ajustes do sistema

As Configurações do Sistema — o `systemsettings` — concentram aparência, rede, energia, dispositivos de entrada e muito mais. É o ponto de partida para personalizar o Deck: mudar o wallpaper, ajustar o brilho em modo desktop, configurar o Wi-Fi manualmente, escolher o comportamento do touchpad.

```terminal
$ systemsettings
```

A janela abre com uma barra lateral de categorias: *Aparência*, *Espaço de Trabalho*, *Hardware* e *Administração do Sistema*, cada uma com subitens. Para quem está começando, é mais útil saber *que existe* e *onde fica* do que decorar cada opção — a maioria dos ajustes é descritiva o suficiente para ser entendida ao abrir.

:::atencao
O SteamOS protege o sistema com um modelo de raiz somente-leitura (imagens A/B). Por isso, algumas opções do `systemsettings` que mexem em arquivos do sistema podem não surtir efeito ou exigir reinicialização especial. Ajustes do *usuário* (wallpaper, tema, comportamento do mouse) funcionam normalmente; alterações profundas do sistema devem ser feitas pelas ferramentas oficiais do SteamOS.
:::

## Resumo

- O menu de aplicativos serve para descobrir; o KRunner (`[[Alt+Espaço]]`) para abrir rápido.
- O Dolphin é o gerenciador de arquivos, com as pastas padrão do usuário `deck`.
- Atalhos da área de trabalho são arquivos `.desktop`, inclusive o de retorno ao Modo Jogo.
- Downloads caem em `~/Downloads` por padrão; o Dolphin ajuda a organizá-los.
- `systemsettings` centraliza aparência, rede, energia e dispositivos de entrada.
- Alterações do usuário funcionam normalmente, mas o sistema é somente-leitura por design.

## Exercícios

1. Descubra três aplicativos novos no menu de aplicativos e abra cada um deles ao menos uma vez.
2. Abra o Dolphin e navegue até `~/Downloads`; crie ali uma pasta chamada `organizar` usando o menu de contexto (`[[L2]]` ou toque longo).
3. No Firefox, faça um download de qualquer imagem e confirme que ela apareceu em `~/Downloads` com `ls`.
4. Abra o `systemsettings` e localize a opção de mudar o wallpaper; aplique um tema diferente e depois reverta.
5. **Desafio.** Abra o arquivo `~/Desktop/Return to Gaming Mode.desktop` num editor de texto (pode ser o Kate, pelo menu) e identifique o campo `Exec=`. Explique, com uma frase, o que acontece quando você clica nesse ícone, relacionando com o que aprendeu sobre sessões no início do capítulo.
