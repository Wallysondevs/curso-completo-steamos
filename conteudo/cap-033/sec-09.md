O capítulo começou dizendo que o navegador é a porta de entrada para o que não tem aplicativo nativo no Deck — e nada encarna isso melhor que o streaming de jogos e os web apps. Xbox Cloud Gaming, GeForce NOW e Amazon Luna não têm cliente para SteamOS; eles rodam inteiros dentro do navegador, transformando o Deck em um terminal fino que transmite jogos da nuvem. Ao mesmo tempo, ferramentas como Google Docs, Figma e Notion viram "aplicativos de verdade" via PWA (Progressive Web App), com ícone no menu e janela própria. É o fechamento natural de tudo o que este capítulo ensinou.

:::objetivos
- Instalar serviços de streaming como web apps (PWA) no Deck
- Configurar o navegador para o Xbox Cloud Gaming e o GeForce NOW
- Entender as limitações de input e fullscreen no modo desktop
- Descartar o que não funciona e manter apenas o que agrega
:::

## Web apps como aplicativos instaláveis

Um PWA é um site que se registra como aplicativo no navegador, ganhando ícone, janela própria e comportamento offline parcial. No Chrome, o atalho é menu de três pontos → "Save and share" → "Install page as app". No Firefox, o recurso ficou menos visível, então a experiência melhor fica com o Chrome/Chromium.

```terminal
$ flatpak run com.google.Chrome 'https://www.xbox.com/play'
```

Abrindo o Xbox Cloud Gaming no Chrome e instalando como app, o site ganha entrada própria no menu KDE:

```terminal
$ ls ~/.local/share/applications/ | grep -i xbox
chrome-xbox-cloud-gaming.desktop
```

O arquivo `.desktop` é o mesmo formato que o KDE usa para qualquer atalho. Ao instalar o PWA, o Chrome gera esse arquivo apontando para o navegador com o URL como argumento. A partir daí, você pode até adicionar o atalho à Steam como "jogo não Steam" e lançar o streaming direto do modo Gaming.

:::dica
Depois de instalar um PWA, ele roda numa janela sem barra de endereço, o que libera pixels de tela no painel de 7 polegadas. Para o Xbox Cloud Gaming, isso significa menos interface de navegador e mais jogo na tela. Use a tecla `[[F11]]` no modo desktop para alternar entre janela e tela cheia num PWA comum.
:::

## Xbox Cloud Gaming no Deck

O Xbox Cloud Gaming exige um gamepad conectado e uma conexão estável de pelo menos 10 Mbps. No Deck, o controle nativo funciona direto, porque o navegador repassa os eventos de joystick pelo padrão HID — o mesmo que o SteamOS já usa para o controle físico.

```terminal
$ flatpak run --socket=pulseaudio --device=all com.google.Chrome \
  --kiosk 'https://www.xbox.com/play'
```

A flag `--kiosk` abre o Chrome em modo quiosque, sem bordas nem menu, ideal para uma sessão focada de jogo. O `--device=all` garante que o navegador veja o controle. Mas atenção: no modo desktop, os botões do Deck disparam atalhos do Steam (`[[Steam]]` abre o menu Big Picture), então jogue em tela cheia para minimizar conflitos.

:::atencao
O Xbox Cloud Gaming detecta latência de gamepad e ajusta o streaming, mas jogos competitivos sofrem com o delay de rede. Para single-player é ótimo; para FPS online, o input lag da nuvem vai te penalizar. O GeForce NOW tem o mesmo comportamento — a latência é física, não configurável.
:::

## GeForce NOW e o caso do login

O GeForce NOW roda no navegador de forma similar, mas com uma pegadinha de login: o serviço exige cookies de terceiros para autenticar via conta NVIDIA. Se o navegador bloquear cookies de terceiros (como o Firefox no modo Estrito faz), o login cai num loop.

```terminal
$ flatpak run com.google.Chrome 'https://play.geforcenow.com'
```

No Chrome, abra Configurações → Privacidade e segurança → Cookies → permita cookies de terceiros para `geforcenow.com` e `nvidia.com`. No Firefox, a mesma configuração fica em Proteções → Cookies. Sem isso, você fica preso na tela "Sign in" sem conseguir avançar.

## O que descartar

Nem todo web app vale a pena instalar como PWA. Algo como o Google Docs, que você abre raramente e no qual não precisa de atalho dedicado, ocupa um `.desktop` no menu sem retorno. Uma régua simples: instale como PWA apenas se você usar o serviço **toda semana** ou se ele for um jogo que você lança pelo modo Gaming.

```terminal
$ flatpak list
Name                    Application ID                Version          Branch   Installation
Firefox                 org.mozilla.firefox           128.0.3          stable   system
Chrome                  com.google.Chrome             126.0.6478.126   stable   system
Xbox Cloud Gaming       chrome-xbox-cloud-gaming      1.0              system
```

Vale lembrar que o modo Gaming do Deck não lista Flatpaks automaticamente. Para lançar o Xbox Cloud Gaming direto do Big Picture, você precisa adicionar o navegador (com a flag do URL) como um jogo não Steam na Steam library. Alguns Decks já têm o `chrome-xbox` aparecendo, mas isso varia com a versão do SteamOS.

## Resumo

- PWA transforma sites como Xbox Cloud Gaming e GeForce NOW em aplicativos com ícone no menu KDE.
- O Chrome gera um arquivo `.desktop` em `~/.local/share/applications/` ao instalar um PWA.
- A flag `--kiosk` abre o navegador em modo quiosque, sem barras, ideal para streaming.
- Cookies de terceiros precisam estar liberados para o login do GeForce NOW funcionar.
- Instale como PWA só serviços de uso semanal ou jogos lançados pelo modo Gaming.

## Exercícios

1. Instale o Xbox Cloud Gaming como PWA no Chrome e localize o arquivo `.desktop` gerado em `~/.local/share/applications/`.
2. Lance o Xbox Cloud Gaming em modo quiosque com `--kiosk` e jogue por 5 minutos. Anote a latência percebida.
3. Configure os cookies de terceiros para `geforcenow.com` e `nvidia.com` e faça login no GeForce NOW.
4. Adicione o atalho do Xbox Cloud Gaming à biblioteca Steam como jogo não Steam e tente lançá-lo do modo Gaming.
5. **Desafio.** Compare a latência e a qualidade de imagem do Xbox Cloud Gaming no Chrome com o modo desktop e no Firefox. Documente qual navegador performa melhor no seu Deck e proponha uma explicação baseada nas seções anteriores sobre codecs e aceleração por hardware.