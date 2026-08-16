O Steam Deck não tem teclado físico, e cedo ou tarde você vai precisar digitar uma senha, um endereço de site ou um comando no terminal. Para resolver isso, a Valve integrou um teclado virtual ao sistema, acionável por um atalho que vale decorar: `[[Steam+X]]`. Dominar esse teclado — quando ele abre sozinho, como forçá-lo e como ajustá-lo — é requisito para quase tudo que você fará no Modo Desktop.

:::objetivos
- Acionar o teclado virtual com o atalho `[[Steam+X]]`
- Entender quando o teclado abre automaticamente e quando precisa ser forçado
- Usar os touchpads e o giroscópio para digitar com precisão
- Ajustar o tamanho e a posição do teclado na tela
:::

## Por que um teclado virtual

Num notebook, o teclado é um dispositivo físico ligado ao barramento; cada tecla gera um evento que o sistema traduz. No Deck, não há esse dispositivo. A Valve implementou um teclado virtual que roda como um overlay — uma camada desenhada por cima do aplicativo — e que converte toques na tela ou seleções por touchpad em eventos de teclado.

Esse teclado não é específico do Modo Desktop: ele também aparece no Modo Jogo, por exemplo, na busca da loja. A boa notícia é que o comportamento é o mesmo nos dois lugares; quem aprende num, sabe no outro.

:::nota
O teclado virtual do SteamOS é conhecido internamente como *steamos-keyboard* e usa o recurso de overlay do Gamescope e do compositor. Ele não é o "teclado virtual" padrão do KDE (o `qtvirtualkeyboard`); é uma solução própria da Valve, integrada ao atalho `[[Steam+X]]`.
:::

## O atalho universal

O jeito mais confiável de abrir o teclado é segurar o botão `[[Steam]]` e tocar em `[[X]]`. Vale em qualquer lugar do sistema, com ou sem campo de texto selecionado:

```text
Segure Steam  +  toque em X  →  teclado virtual abre sobre o app
```

Quando você clica num campo de texto (a barra de busca do navegador, o prompt do terminal, a senha do Wi-Fi), o teclado costuma abrir **sozinho**. Mas isso depende do aplicativo; alguns programas não avisam o compositor de que precisam de teclado, e aí ele não aparece. Por isso o atalho manual é indispensável: ele funciona sempre, independentemente do aplicativo.

```text
Campo de texto focado  →  teclado abre (na maioria dos apps)
App com campo, mas sem teclado  →  Steam+X força a abertura
```

:::dica
Se o teclado abrir por cima de algo que você precisa ver, toque fora dele ou use `[[Steam+X]]` de novo para descartá-lo. Ele é um overlay, então não "fecha" o app — apenas sai da frente.
:::

## Digitando com precisão

Há três formas de usar o teclado virtual, e a melhor depende do texto:

1. **Toque na tela** (modelos com touchscreen): rápido, bom para palavras curtas e URLs.
2. **Touchpads**: cada touchpad move um cursor próprio; quando os dois apontam para a mesma tecla, ela destaca, e `[[R2]]` (ou tocar no touchpad) confirma. É o método mais comum no Modo Jogo.
3. **Giroscópio**: inclinar o Deck move o cursor como se a tela fosse um plano; combinado com um touchpad, dá precisão fina para textos longos.

O toque é imbatível para velocidade, mas os touchpads evitam "dedo gordo" em alvos pequenos. Para digitar comandos no terminal, geralmente se prefere conectar um teclado físico; mas a seção de terminal adiante mostra que, com prática, o virtual também serve.

```terminal
$ echo "digitado com o teclado virtual"
digitado com o teclado virtual
```

O comando acima apenas demonstra o resultado: o que foi teclado no virtual chega ao terminal como se viesse de um teclado físico, caractere por caractere. Para o sistema, não há diferença.

## Ajustes de tamanho e posição

O teclado pode ser redimensionado e movido, o que ajuda muito numa tela de 7 polegadas. No Modo Desktop, arraste a borda ou o canto do teclado para mudar o tamanho, e arraste a área de título para reposicioná-lo. Algumas versões permitem até fixá-lo na parte de baixo ou de cima.

Ao configurar, pense na ergonomia: um teclado ocupando metade da tela deixa pouco espaço para ver o que você digita. Para comandos curtos no terminal, um teclado encolhido no canto costuma ser suficiente; para escrever um texto longo, vale maximizá-lo momentaneamente.

:::atencao
Alguns aplicativos — especialmente jogos em tela cheia dentro do Desktop — podem "capturar" a entrada e impedir que o teclado virtual apareça por cima. Nesses casos, saia do modo tela cheia (`[[Alt+Enter]]` em muitos apps) antes de acionar `[[Steam+X]]`.
:::

## Configuração pelo sistema

O comportamento do teclado tem ajustes nas Configurações do Sistema, na categoria de entrada. Você pode conferir e alterar preferências como a posição padrão e o idioma do layout, que afeta onde ficam acentos e símbolos como `ç` e `~`.

```terminal
$ systemsettings
```

O comando `systemsettings` abre a central de configurações do KDE. Dentro dela, a seção de **Entrada** (ou *Input Devices*) reúne teclado, touchpads e o teclado virtual. É o mesmo ponto usado para configurar a orientação dos touchpads, assunto da próxima seção.

Vale lembrar que o layout do teclado virtual acompanha o layout do sistema. Se você configurar o Deck para português do Brasil, o teclado virtual passa a oferecer `ç` e acentos na primeira camada — essencial para digitar em português com fluência.

Também dá para conferir qual layout está ativo pela linha de comando, lendo o estado do `systemd-localed`:

```terminal
$ localectl status
   System Locale: LANG=pt_BR.UTF-8
       VC Keymap: us
      X11 Layout: br
       X11 Model: pc105
    X11 Variant: thinkpad
```

A linha `System Locale` mostra o idioma do sistema, e `X11 Layout: br` indica o layout de teclado configurado (que o Wayland herda). Quando você troca o layout no `systemsettings`, é esse estado que muda por baixo — e é ele que o teclado virtual consulta para decidir onde ficam `ç`, os acentos e o `~`.

## Resumo

- `[[Steam+X]]` abre e fecha o teclado virtual em qualquer aplicativo do SteamOS.
- Em campos de texto focados, o teclado costuma abrir sozinho; o atalho manual é o fallback universal.
- Há três métodos de digitação: toque, touchpads e giroscópio.
- O teclado é um overlay, podendo ser movido e redimensionado.
- O layout do teclado virtual acompanha o layout de idioma configurado no sistema.
- `systemsettings` abre a central de configurações, onde se ajusta entrada e teclado.

## Exercícios

1. Em um campo de texto do navegador, deixe o teclado abrir sozinho; depois feche e force com `[[Steam+X]]`. Compare os dois comportamentos.
2. Digite, usando apenas os touchpads, a frase "Steam Deck com teclado virtual" no terminal e confirme com Enter.
3. Redimensione o teclado para um quarto da tela e reposicione-o no canto; em seguida, volte ao tamanho padrão.
4. Altere o layout de idioma para português do Brasil em `systemsettings` e verifique se `ç` e acentos aparecem no teclado virtual.
5. **Desafio.** Com o teclado virtual, abra o terminal e execute três comandos desta seção (`whoami`, `hostname`, `echo $XDG_SESSION_TYPE`) sem usar toque na tela — apenas touchpads e gatilhos — e registre seus resultados.
