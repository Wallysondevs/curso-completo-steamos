Navegar no Modo Desktop sem teclado nem mouse é a experiência mais "console" que o Steam Deck oferece. Os dois touchpads sob os polegares se transformam em cursores independentes, e os gatilhos viram botões esquerdo e direito. Quem vem do console estranha; quem vem do notebook estranha também. Mas em poucos minutos a coordenação motor fina se ajusta, e a partir daí o Deck se comporta como um notebook de bolso.

:::objetivos
- Configurar a sensibilidade e o comportamento dos touchpads como mouse
- Entender por que cada touchpad controla um cursor independente
- Usar os gatilhos como cliques e o Steam como modificador
- Ajustar a rolagem, arraste e clique direito no touchpad
:::

## Dois touchpads, dois cursores

No Modo Desktop, cada touchpad projeta um cursor na tela — o esquerdo com uma seta, o direito com uma seta ou ponto diferente, dependendo da versão do SteamOS. Eles são independentes: você pode apontar para dois alvos ao mesmo tempo. Na prática, porém, só um deles "ativa" a interação: o último que se moveu é o que efetivamente clica.

Esse desenho veio do Modo Jogo, onde o touchpad direito costuma mirar e o esquerdo acessa menus radiais. No Desktop, o comportamento padrão é que o primeiro toque no touchpad define qual cursor "fala" — e o outro fica em segundo plano até ser movido.

```text
Mexer touchpad direito  →  cursor direito ativo  →  R2 clica com ele
Mexer touchpad esquerdo →  cursor esquerdo ativo →  R2 clica com ele
```

Você pode testar a independência movendo os dois ao mesmo tempo: os cursores se cruzam na tela sem conflito. É uma sensação estranha no começo, mas bastante útil para ações como arrastar de um touchpad e soltar com o outro, embora a maioria opte por usar apenas um dos lados como mouse principal.

:::nota
O comportamento dual-cursor é configurável. Nas configurações de entrada do Steam (dentro do Modo Desktop, o Steam em modo Big Picture), você pode forçar que apenas um dos touchpads funcione como mouse, liberando o outro para rolagem ou atalhos.
:::

## Gatilhos e clique

Os gatilhos são intuitivos: `[[R2]]` é o clique esquerdo (selecionar, abrir, apertar botões) e `[[L2]]` é o clique direito (menus de contexto). O clique não depende do touchpad — você pode posicionar o cursor com o touchpad e, mantendo o dedo sobre ele, pressionar o gatilho.

```text
Cursor sobre ícone  →  R2  →  seleciona / abre
Cursor sobre ícone  →  L2  →  menu de contexto do Plasma
```

No caso de telas sensíveis ao toque, o toque direto também funciona como clique esquerdo, e toque longo abre o menu de contexto (como um clique direito). Os dois modos — toque e touchpad — convivem; você pode tocar para abrir o menu e usar o touchpad para selecionar um item.

:::dica
Para "clicar e arrastar", pressione `[[R2]]` e, mantendo-o segurado, arraste o dedo sobre o touchpad. O Plasma arrasta o ícone ou a janela. Ao soltar o gatilho, o arraste termina. Praticar esse movimento com um ícone da área de trabalho é o melhor treino.
:::

## Ajustes de sensibilidade

Os touchpads do Deck oferecem dois ajustes principais: a **sensibilidade** (quanto o cursor se move por milímetro de dedo) e a **inércia** (se o cursor para imediatamente quando o dedo para ou desliza um pouco). Ambos são ajustáveis nas configurações de entrada:

```text
systemsettings  →  Dispositivos de Entrada  →  Touchpad
```

Dentro das configurações do KDE, a seção de Touchpad mexe na aceleração e na sensibilidade. O Steam também tem suas próprias configurações, acessíveis pelo ícone do Steam na bandeja, que oferecem mais granularidade — ajustes por jogo, mapeamento de regiões do touchpad e atalhos de tecla.

```terminal
$ systemsettings
```

Ao executar, o `systemsettings` abre a janela de configuração. Navegue para *Input Devices* → *Touchpad*. Há um controle de velocidade de ponteiro e um de aceleração. No Deck, a aceleração baixa e a velocidade média costumam dar o melhor equilíbrio entre precisão e agilidade na tela de 7 polegadas.

:::atencao
As configurações do Steam para os controles podem sobrescrever as do KDE para os touchpads. Se você ajustou a sensibilidade no `systemsettings` e nada mudou, verifique as preferências de controle dentro do Steam — provavelmente o layout "Desktop" está com valores diferentes.
:::

Vale inspecionar quais dispositivos de entrada o kernel enxerga no Deck. Isso ajuda a entender por que os touchpads aparecem como dispositivos separados dos gatilhos e dos botões:

```terminal
$ ls /dev/input/by-path | grep -iE 'touchpad|mouse|event'
platform-i2c-mouse-event
platform-i2c-mouse-mouse
platform-mouse-event-mouse
pci-0000:00:14.0-usb-0:2:1.0-event-kbd
```

As entradas `platform-i2c-mouse` são os touchpads, conectados pelo barramento interno I²C. É por isso que eles aparecem para o sistema como dispositivos do tipo *mouse*, não como dedos multitoque de um trackpad de notebook convencional — embora o software do SteamOS os traduza em cursores suaves.

Outra forma de ver o que o KWin considera dispositivo apontador é consultar as propriedades de entrada do X/Wayland:

```terminal
$ xinput list 2>/dev/null || echo "sem xinput numa sessão Wayland"
sem xinput numa sessão Wayland
```

O `xinput` é uma ferramenta do mundo X11 e, como o Desktop roda Wayland, ela não encontra o servidor X e falha silenciosamente — por isso o `|| echo` imprime o aviso. É uma boa ilustração prática de que o Deck opera sobre Wayland, e não X11, como visto na seção sobre a sessão gráfica.

## Rolagem e atalhos nos touchpads

Por padrão, as bordas dos touchpads fazem rolagem: deslizar o dedo na borda direita do touchpad direito rola a página verticalmente, e a borda inferior rola horizontalmente. Em alguns layouts, a rolagem é "circular" — girar o dedo ao redor da borda do touchpad rola sem precisar de borda específica.

Além disso, o botão `[[Steam]]` funciona como modificador no Desktop: combinado com os touchpads, ele pode disparar ações como abrir o menu de aplicativos ou mostrar as áreas de trabalho. O layout padrão "Desktop" do Steam define:

- `[[Steam]]` + touchpad esquerdo: rolagem vertical/horizontal
- `[[Steam]]` + toque no touchpad direito: clique do meio (colar texto)
- `[[Steam]]` + `[[←]]` / `[[→]]`: alternar entre áreas de trabalho virtuais

Essas combinações agilizam a navegação e compensam a ausência de teclas dedicadas. À medida que o capítulo avança, esses atalhos vão se incorporando ao repertório.

## Resumo

- Os touchpads do Deck são independentes: cada um projeta um cursor na tela.
- `[[R2]]` é o clique esquerdo; `[[L2]]` é o direito; arrastar se faz segurando `[[R2]]` e deslizando o dedo.
- A sensibilidade e a aceleração dos touchpads são ajustadas no `systemsettings` e complementadas pelo Steam.
- As bordas dos touchpads fazem rolagem; `[[Steam]]` + touchpad esquerdo também rola.
- `[[Steam]]` + toque no touchpad direito emula o clique do meio (colar).
- As configurações do Steam podem sobrescrever as do KDE; verifique ambas se o comportamento não bater.

## Exercícios

1. Com apenas o touchpad direito e `[[R2]]`, abra o menu de aplicativos e inicie o Dolphin.
2. Arraste o ícone "Retornar ao Modo de Jogo" para um canto diferente da área de trabalho usando o método "segurar R2 + deslizar".
3. Navegue por uma página longa no Firefox (ou no Discover) usando a rolagem de borda do touchpad direito; depois tente com `[[Steam]]` + touchpad esquerdo.
4. Abra o `systemsettings`, vá em Touchpad e aumente transitoriamente a velocidade do ponteiro para o máximo; navegue por 30 segundos e depois volte ao valor normal.
5. **Desafio.** Sem usar o toque na tela nem teclado físico, execute estas três ações em sequência: abrir o Konsole, digitar `ls ~/` com o teclado virtual, selecionar a saída com clique-duplo (arraste sobre o texto com touchpad e R2), copiar com `[[Steam+X]]` (fecha o teclado) + `[[Ctrl+C]]` (via teclado virtual ou botão Steam) e colar num editor de texto com clique do meio (Steam + toque no touchpad direito). Registre os passos que funcionaram e os que não funcionaram.