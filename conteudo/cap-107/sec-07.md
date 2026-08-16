Chegamos ao coração do capítulo. Uma APU mais rápida e uma tela maior importam menos do que uma decisão fundamental que separa o Steam Deck de quase todos os concorrentes: **qual sistema operacional roda no aparelho**. O Steam Deck roda SteamOS (Linux com Proton); Ally, Legion Go e Claw rodam Windows 11. Esta seção compara os dois mundos de forma honesta, mostrando onde cada um vence — e onde perde feio.

:::objetivos
- Entender as diferenças estruturais entre SteamOS e Windows num handheld
- Avaliar a experiência de suspender e retomar (resume) em cada sistema
- Comparar compatibilidade de jogos, incluindo anti-cheat e Game Pass
- Conhecer alternativas como Bazzite que levam o SteamOS aos concorrentes
:::

## O modelo de cada sistema

O SteamOS 3 foi desenhado *do zero* para o formato portátil. É uma distribuição Linux imutável (base Arch), com uma interface própria chamada Game Mode que cobre o sistema operacional por completo — você navega na biblioteca, ajusta TDP, acessa configurações e gerencia downloads, tudo com o controle, sem nunca ver uma janela de desktop. Por baixo, existe um modo Desktop (KDE Plasma) para tarefas avançadas.

O Windows 11, ao contrário, é um sistema de desktop genérico *adaptado* ao portátil. Os fabricantes (Asus, Lenovo, MSI) cobrem o Windows com um launcher — Armoury Crate, Legion Space, MSI Center — que tenta reproduzir a experiência de console, mas o Windows continua lá embaixo, com suas atualizações, notificações, área de trabalho e prompt de licença.

A diferença central é essa: **no SteamOS, o jogo vive no sistema; no Windows, o sistema vive em cima do jogo.**

## Suspender e retomar: a fronteira da experiência

A *feature* que mais separa os dois sistemas é o **suspend/resume** — a capacidade de pausar o jogo no meio, suspender o aparelho e retomar exatamente de onde parou, em segundos, dias depois.

No Steam Deck, isso funciona como num console: aperte o botão de energia, o jogo congela, o aparelho adormece; aperte de novo e você está de volta em menos de 2 segundos, no mesmo frame.

```terminal
$ # Experiência de suspend/resume
$ # Steam Deck: <power> .... jogo pausado, tela apaga
$ #            <power> .... ~1,5s .... de volta no mesmo frame
$ systemd-inhibit --list
# (SteamOS usa inibidores de suspensão gerenciados pelo gamescope)
```

No Windows, a suspensão com um jogo 3D aberto é um tiro no escuro. O padrão é: o jogo trava, o driver gráfico reinicia, o áudio dessincroniza ou simplesmente o processo crasha ao retomar. É o motivo número um pelo qual donos de Ally e Legion Go relatam frustração — a rotina de "jogar 20 minutos no ônibus" é quebrada pela impossibilidade de confiar na pausa.

O ROG Ally tem uma *solução* parcial chamada de "hibernate" (hibernação), que grava o estado em disco e desliga. É mais confiável que o *sleep* comum, mas muito mais lento para retomar (10–30 segundos contra 1,5), e ainda falha em alguns jogos.

:::nota
Essa diferença não é cosmética. Para o gamer que joga em sessões curtas e interrompidas — no transporte, na pausa do almoço, entre compromissos —, o suspend/resume confiável do SteamOS *é* a experiência. O Windows transforma cada interrupção em um ritual de fechar, salvar e reabrir.
:::

## Compatibilidade de jogos: Proton contra nativo

O Steam Deck joga jogos feitos para Windows por meio do **Proton**, a camada de compatibilidade da Valve (baseada em Wine). Isso cria uma pergunta natural: "se o Deck precisa traduzir jogos de Windows, não seria melhor rodar Windows de verdade?"

A resposta é matizada. O Proton é extraordinariamente maduro em 2025, com a maioria dos títulos da Steam funcionando de forma transparente. Mas existem dois buracos:

1. **Anti-cheat em kernel.** Jogos com anti-cheat de nível kernel (como *Fortnite*, *Destiny 2*, *Valorant*, *Call of Duty: Warzone*, *FIFA/EA FC*) simplesmente não rodam no Proton, porque o anti-cheat exige acesso profundo ao kernel Windows que o Proton não pode emular. É a maior limitação do Steam Deck.
2. **Launchers de terceiros.** Jogos que exigem launchers próprios (Ubisoft Connect, EA app, Rockstar) funcionam mas com atrito ocasional de login.

O Windows, por outro lado, roda *tudo* — qualquer jogo, qualquer loja, qualquer anti-cheat. Essa é a vantagem estrutural do Windows nos handhelds concorrentes.

```terminal
$ # Compatibilidade (regra geral, 2025)
$ echo "Steam Deck (Proton):  ~80-85% da Steam verificável"
$ echo "  - não roda: anti-cheat kernel (Fortnite, Valorant...)"
$ echo "Windows (Ally/Go):     ~100% de compatibilidade"
Steam Deck (Proton):  ~80-85% da Steam verificável
  - não roda: anti-cheat kernel (Fortnite, Valorant...)
Windows (Ally/Go):     ~100% de compatibilidade
```

A Valve mantém uma classificação oficial — "Deck Verified" (verificado), "Playable" (jogável), "Unsupported" (não suportado) — que aparece na biblioteca e orienta o usuário. O Windows não precisa disso porque roda tudo.

## Game Pass, lojas e o "ecossistema além da Steam"

O Windows ganha de lavada num quesito: **lojas e serviços**. O Game Pass da Microsoft é um argumento de compra importante para o Ally e o Legion Go — centenas de jogos por assinatura, muitos deles com anti-cheat que o Steam Deck não roda de jeito nenhum.

O Steam Deck é, por definição, um aparelho centrado na Steam. Você pode instalar Heroic (para GOG/Epic), Lutris, e rodar alguns outros launchers, mas a experiência é visivelmente pior fora da Steam, e o Game Pass nativo (com instalação de jogos) é impossível sem Windows — apenas o streaming (xCloud) é acessível via navegador.

| Recurso | SteamOS (Deck) | Windows (Ally/Go/Claw) |
|---|---|---|
| Steam | Nativo, perfeito | Nativo, bom |
| Game Pass (instalação) | ✗ (só streaming) | ✓ nativo |
| GOG / Epic | Via Heroic (razoável) | ✓ nativo |
| Anti-cheat kernel | ✗ | ✓ |
| Emulação | Excelente (EmuDeck) | Boa (RetroArch etc.) |
| Mods e launchers | Com atrito | Nativo |

## Desempenho no mundo real: Linux é mais eficiente

Há um capítulo escondido nessa história: o Linux/SteamOS é mais leve que o Windows, e isso se traduz em FPS no TDP baixo que importa para um portátil.

O Windows 11 tem serviços em segundo plano (Windows Update, Defender, telemetria, Cortana) que consomem CPU e RAM continuamente. Num desktop com 32 GB de RAM e fonte de 650 W, isso é irrelevante. Num handheld com 16 GB e bateria de 40 Wh a 10 W, cada watt importa — e o Windows "rouba" uma fração dele.

```terminal
$ # Overhead aproximado em idle (dados de referência)
$ echo "Windows 11 idle:  ~2,5-3,5 GB RAM, 3-8% CPU"
$ echo "SteamOS (Game Mode) idle: ~0,8-1,2 GB RAM, <1% CPU"
Windows 11 idle:  ~2,5-3,5 GB RAM, 3-8% CPU
SteamOS (Game Mode) idle: ~0,8-1,2 GB RAM, <1% CPU
```

Essa folga se reflete no desempenho em TDP baixo. É uma das razões pelas quais o Deck (APU tecnicamente inferior) compete de igual para igual com o Ally a 10–15 W, como visto na [seção 6](#/cap-107/sec-06).

## Bazzite: o SteamOS dos concorrentes

Para quem quer o melhor dos dois mundos — hardware do Ally/Legion Go + experiência SteamOS — existe o **Bazzite**, uma distribuição Linux imutável (base Fedora) que reproduz a interface e o comportamento do SteamOS em hardware de terceiros.

O Bazzite é mantido pela comunidade (Universal Blue) e oferece a mesma experiência de Game Mode, suspend/resume confiável e Proton. Ele roda no Ally, no Legion Go e em vários handhelds, com suporte cada vez mais maduro para TDP, RGB e controles. A [seção 8](#/cap-107/sec-08) menciona o ferramental de instalação.

A ressalva: Bazzite não é suportado oficialmente pelos fabricantes, perde acesso ao anti-cheat kernel (como qualquer Linux) e exige algum conforto com instalação de sistema. Mas para o entusiasta, é a ponte entre os dois mundos.

## Resumo

A divisão SteamOS vs Windows é mais decisiva que qualquer especificação de hardware. O SteamOS oferece experiência de console — suspend/resume instantâneo, interface nativa para controle, overhead mínimo e eficiência em TDP baixo —, mas não roda anti-cheat kernel nem Game Pass nativo. O Windows roda tudo e abraça todas as lojas, mas cobra o preço em suspensão não confiável, overhead de sistema e a necessidade de launchers por cima. O Bazzite tenta unir os dois, com as ressalvas de qualquer Linux alternativo.

## Exercícios

1. Explique, com suas palavras, a diferença entre "sistema feito para o jogo" (SteamOS) e "jogo rodando em cima do sistema" (Windows). Dê um exemplo concreto de cada.
2. Liste três jogos populares que não rodam no Steam Deck por causa de anti-cheat kernel. Pesquise se algum deles hoje roda via Proton.
3. Descreva a diferença entre *sleep* (suspensão) e *hibernate* (hibernação) no contexto do ROG Ally. Por que a hibernação é mais confiável, porém mais lenta?
4. Compare o consumo de RAM em idle do Windows 11 e do SteamOS. Explique por que essa diferença é irrelevante num desktop, mas decisiva num handheld de 16 GB.
5. **Desafio.** Pesquise o Bazzite e explique o modelo "imutável" (atomic/ostree) que ele herda do Fedora Silverblue. Por que imutabilidade ajuda num handheld que o usuário pode desligar a qualquer momento?