O botão `[[Steam]]` é mais que um "menu": é um modificador. Pressionado sozinho, abre o menu Steam; **combinado** com outros botões, dispara atalhos de sistema que funcionam em qualquer lugar do Modo Jogo, dentro ou fora de um jogo. São os atalhos de "chord" (acorde), uma ideia emprestada dos controles de console. Quem os domina navega pelo Deck sem nunca tirar o polegar do gamepad.

:::objetivos
- Entender o conceito de modificador de teclas no gamepad
- Memorizar os atalhos de captura, brilho e teclado
- Abrir o teclado virtual e o navegador embutido do Steam
- Forçar o fechamento de um jogo travado pelo atalho de sistema
- Consultar a configuração de atalhos nos arquivos do Steam
:::

## O que é um "chord" de botão

No teclado, `[[Ctrl]]` não faz nada sozinho — modifica o que você digita junto. O botão `[[Steam]]` cumpre o mesmo papel no gamepad: é o **modificador**. Enquanto você o segura, o significado dos demais botões muda temporariamente. Esse padrão é chamado de *chording* pela Valve, e aparece em todas as interfaces de gamepad dela.

A vantagem do chord é a densidade: com oito botões físicos e um modificador, você dobra o número de ações sem precisar de mais hardware. A desvantagem é a curva de aprendizado — por isso os atalhos mais importantes estão impressos na própria tela do menu Steam e podem ser consultados por um `help` contextual.

## O mapa dos atalhos essenciais

Segurando `[[Steam]]`, as combinações mais úteis do Steam Deck são:

| Combinação | Ação |
|---|---|
| `[[Steam]]` + `[[A]]` | Confirma/entra no item do menu (uso interno) |
| `[[Steam]]` + `[[B]]` | Cancela/volta |
| `[[Steam]]` + `[[X]]` | Abre o **teclado virtual** |
| `[[Steam]]` + `[[Y]]` | Alterna filtro/atalho contextual |
| `[[Steam]]` + `[[L1]]` | Diminui brilho em passos |
| `[[Steam]]` + `[[R1]]` | Aumenta brilho em passos |
| `[[Steam]]` + `[[L2]]`/`[[R2]]` | Captura de tela (screenshot) com feedback visual |
| `[[Steam]]` + `[[↑/↓/←/→]]` | Navega submenu/volume em alguns contextos |
| `[[Steam]]` (segurar ~5 s) | Menu de **alternância de nível** do gamepad |

A combinação de captura de tela (`[[Steam]]` + gatilho) é a que mais gera confusão, porque em algumas builds ela é `[[Steam]]`+`[[R1]]` (captura) e em outras `[[Steam]]`+`[[R2]]`. A regra prática: o gatilho de **screenshot** é o `[[R2]]` (ou `[[L2]]`+`[[R2]]` juntos em versões antigas). As capturas vão parar num diretório específico por conta, que você pode inspecionar:

```terminal
$ ls ~/.steam/steam/userdata/76561198000000000/760/remote/
```

O número `760` é o *appid* reservado do Steam para **screenshots/salvaguarda de capturas**. Dentro dele, um subdiretório por `appid` de jogo guarda os `.jpg`/`.png`. Esse é o destino real dos seus prints, e entender isso permite recuperá-los no Modo Desktop sem depender do visualizador do Steam.

## O teclado virtual e onde o Steam o guarda

`[[Steam]]` + `[[X]]` abre o teclado virtual (OSK, *on-screen keyboard*) em qualquer campo de texto. Ele é desenhado pelo próprio Steam (não pelo Gamescope), e tem duas variantes: o teclado completo (QWERTY com setas) e um teclado compacto. O tema do teclado pode ser alterado nas configurações, e essa escolha é persistida no `localconfig.vdf`.

Um detalhe técnico que importa: o teclado virtual só aparece quando um campo de texto *do Steam* está em foco. Em jogos que implementam seus próprios campos de texto, nem sempre ele sobe automaticamente — nesses casos, segure `[[Steam]]`+`[[X]]` manualmente. Isso acontece porque o OSK do Steam escuta o evento de foco do cliente, e um jogo rodando via Proton pode não emitir esse evento.

```terminal
$ ls ~/.local/share/Steam/ 2>/dev/null || echo "não existe — o cliente usa ~/.steam/steam"
```

O caminho acima serve para ilustrar uma pegadinha: em muitos guias de Linux você vê `~/.local/share/Steam`, mas no Steam Deck a instalação vive em `~/.steam/steam`. Confirmar o caminho certo evita que você procure as capturas ou configs no lugar errado.

## O navegador embutido e as páginas especiais

O Steam tem um **navegador web embutido** (baseado em CEF, o Chromium Embedded Framework) usado pela loja, pelas notícias e pelo chat. Fora da loja, você pode acessar páginas internas do Steam digitando URLs `steam://` ou `http://localhost` em jogos que aceitam texto. Algumas páginas especiais úteis no Deck:

| URL interna | O que abre |
|---|---|
| `steam://open/bigpicture` | Força o Modo Jogo / big picture |
| `steam://url/StoreApp/<appid>` | Abre a página de um jogo na loja |
| `http://localhost:8080` | Interface web do Steam em modo *family* (quando habilitada) |

O `steam://open/bigpicture` é exatamente o que o atalho de sair para o Modo Jogo dispara por trás. Você pode testá-lo no Modo Desktop:

```terminal
$ steam -bigpicture
```

Esse comando sobe o Steam direto na interface de gamepad, mesmo no desktop — é o modo "big picture" clássico que existia no PC muito antes do Deck. No SteamOS ele é quase redundante, porque o boot já cai no Modo Jogo, mas é a demonstração mais clara de que o Modo Jogo **é** o big picture do PC com um compositor dedicado por cima.

## Forçando o fechamento de um jogo travado

Existe um atalho de emergência que todo dono de Deck precisa saber: quando um jogo congela e nem `[[B]]` resolve, **segure o botão `[[Steam]]`** para abrir o menu de sistema. De lá, a opção **Encerrar jogo** (ou "Force quit") mata o processo do título sem desligar o Deck. Por trás, é o cliente Steam que envia um sinal de término ao processo do jogo — essencialmente um `kill` no processo filho:

```terminal
$ ps aux | grep -iE 'reaper|gameoverlay' | grep -v grep
deck    5610  0.1  0.4  123456  98765 ?  S   09:30   0:00 reaper 413150
```

O `reaper` é um processo-zelador do Steam que monitora o jogo (`413150`, o Stardew Valley do exemplo) e pode derrubá-lo quando você pede pelo menu. Se o "Encerrar jogo" não responder, o recurso final é segurar o **botão de energia** por ~10 segundos para desligar por hardware — mas isso é a última linha de defesa, não um atalho de navegação.

:::perigo
Segurar o botão de energia por 10+ segundos corta a alimentação sem desmontar o sistema de arquivos. Use apenas quando o Deck estiver completamente travado e o "Encerrar jogo" não funcionar. Em uso normal, prefira o caminho do menu Steam → Energia → Desligar.
:::

## Resumo

- O botão `[[Steam]]` é um modificador: segurando-o, os demais botões ganham significados novos (chording).
- `[[Steam]]`+`[[X]]` abre o teclado virtual; os gatilhos ajustam brilho e capturam tela.
- Capturas de tela são salvas por appid, sob `userdata/<steamid>/760/remote/`.
- O Steam Web Browser (CEF) alimenta loja, notícias e chat com URLs `steam://`.
- `steam -bigpicture` reproduz a interface de gamepad no desktop; o Modo Jogo é isso + Gamescope.
- O "Encerrar jogo" do menu Steam mata o processo via um zelador (`reaper`), sem desligar o Deck.

## Exercícios

1. Em qualquer tela, abra o teclado virtual com `[[Steam]]`+`[[X]]` e digite uma busca na loja; feche com `[[Steam]]`.
2. Ajuste o brilho para o mínimo usando os gatilhos em chord e confirme o valor resultante no sysfs (`/sys/class/backlight/*/brightness`).
3. Capture uma tela no Modo Jogo e localize o arquivo gerado em `userdata/<steamid>/760/remote/` no Modo Desktop.
4. No desktop, rode `steam -bigpicture` e descreva as diferenças (se houver) em relação ao Modo Jogo de verdade.
5. **Desafio.** Congele intencionalmente um processo de teste (ex.: abra um jogo e envie um sinal de pausa com `kill -STOP <pid>` pelo desktop) e use o "Encerrar jogo" do menu Steam para derrubá-lo. Explique por que o Steam consegue matá-lo se o processo está parado, conectando com o conceito de processo-zelador.
