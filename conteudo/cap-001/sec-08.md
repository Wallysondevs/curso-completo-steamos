O Steam Deck não inventou o PC gaming portátil, mas redefiniu a categoria. Antes dele, existiam os handhelds chineses com Windows que mal rodavam a própria interface, e depois dele surgiu uma leva de concorrentes — ASUS ROG Ally, Lenovo Legion Go, MSI Claw e outros. Entender o ecossistema e onde o Deck se posiciona ajuda a decidir se ele é a escolha certa para você e, principalmente, por que o SteamOS é um diferencial tão grande.

:::objetivos
- Mapear os principais concorrentes e suas propostas
- Entender o que diferencia o Steam Deck no mercado: software, preço e controles
- Comparar a abordagem Linux do Deck com a abordagem Windows dos concorrentes
- Avaliar as escolhas da Valve à luz da história dos handhelds x86
- Discutir o impacto do Deck na indústria de jogos para Linux
:::

## O panorama antes do Deck

PCs portáteis para jogos existiam muito antes de 2022. A GPD, a AYA e a AYN vendiam handhelds x86 com Windows desde meados de 2010. Eram máquinas competentes, mas sofriam de três males: preço alto (US$ 800–1200), suporte instável e um sistema operacional que jamais foi pensado para telas de 7 polegadas e controles embutidos.

A Valve entrou com duas vantagens que nenhum desses fabricantes tinha: escala de produção e um sistema operacional. O Steam Deck foi anunciado a partir de US$ 399 — metade do preço de um GPD Win equivalente — porque a Valve podia subsidiar o hardware com a receita do Steam. E o SteamOS, com sua interface Big Picture adaptada a gamepad, resolvia o problema da interação que o Windows nunca resolveu para telas pequenas.

```terminal
$ systemd-analyze
Startup finished in 3.856s (firmware) + 1.412s (loader) + 2.834s (kernel) + 5.234s (userspace) = 13.336s 
graphical.target reached after 5.123s in userspace.
```

Um boot completo do SteamOS, do firmware à interface, em ~13 segundos. Um handheld com Windows, nas mesmas condições, demora de 25 a 45 segundos — e ainda pode ser interrompido por uma atualização obrigatória do Windows Update quando você só queria jogar. A diferença é filosófica: o Deck acorda rápido como um console, porque foi projetado para isso.

## Concorrentes diretos: ROG Ally, Legion Go e cia.

A resposta da indústria veio em 2023. A ASUS lançou o **ROG Ally** com Windows 11, APU Ryzen Z1 Extreme (Zen 4 + RDNA 3, 8 núcleos) e tela 1080p 120 Hz. A Lenovo seguiu com o **Legion Go**, tela 8,8" 2560×1600, controles destacáveis como os Joy-Con do Switch. A MSI entrou com o **Claw**, usando chip Intel Core Ultra em vez de AMD.

Todos têm vantagens de hardware: processadores mais novos, telas de resolução mais alta, mais RAM em alguns modelos. Mas todos compartilham um problema: rodam Windows. E o Windows num portátil de 7–9 polegadas, sem teclado, é uma experiência de atrito constante.

O Steam Deck responde com três coisas que os concorrentes não replicaram:

- **SteamOS com modo de jogo:** interface de console que nunca te joga numa tela de login do Windows.
- **Touchpads duplos:** nenhum concorrente oferece dois pads hápticos programáveis — essenciais para jogos de mouse e teclado no sofá.
- **Preço:** mesmo em 2025, o LCD de 256 GB é mais barato que qualquer concorrente com especificação equivalente.

:::info
O ROG Ally X (2024) melhorou bateria e memória, mas manteve o Windows. A Valve, enquanto isso, anunciou que o SteamOS será liberado para outros fabricantes — a Lenovo já confirmou um Legion Go S com SteamOS. Ou seja, o software criado para o Deck está virando uma plataforma, não mais um exclusivo.
:::

## Por que Linux num mundo de Windows

A escolha da Valve pelo Linux não foi ideológica — foi estratégica. A Microsoft controla o Windows, e a Valve, como dona da maior loja de jogos do planeta, não quer depender de um concorrente que também tem sua própria loja (Microsoft Store / Game Pass). Se o Windows um dia priorizasse o ecossistema Microsoft no boot do portátil, a Valve estaria refém.

O Linux, com a camada de compatibilidade Proton (baseada em Wine), resolveu o problema: a maioria dos jogos Windows roda no Deck sem intervenção. E quando não roda, a Valve tem incentivo financeiro para corrigir — cada jogo compatível a mais é um motivo para comprar o Deck em vez de um concorrente com Windows.

```terminal
$ uname -a
Linux steamdeck 6.8.0-valve1-1 #1 SMP PREEMPT_DYNAMIC Sat, 15 Feb 2025 00:00:00 +0000 x86_64 GNU/Linux
$ cat /etc/os-release
NAME="SteamOS"
VERSION_ID="3.6"
ID="steamos"
PRETTY_NAME="SteamOS 3.6 (Based on Arch Linux)"
```

O kernel traz patches da Valve (`valve1-1` no nome) que otimizam drivers de AMD, Bluetooth e controle de frequência. O SteamOS é baseado em Arch Linux, uma distribuição rolling-release, para a Valve ter liberdade de atualizar o kernel e o Proton sem esperar o ciclo de uma distribuição corporativa.

## O impacto na indústria de jogos para Linux

O lançamento do Steam Deck foi o maior experimento de jogos em Linux da história. Antes, jogos nativos para Linux eram uma fração minúscula do catálogo da Steam. Com o Proton, o catálogo de mais de 12.000 jogos compatíveis (classificados como Verified ou Playable) fez do Deck a máquina que provou que Linux funciona para jogar — não como curiosidade, mas como plataforma principal.

```terminal
$ proton --version
proton 9.0
$ ls ~/.local/share/Steam/steamapps/compatdata/ | wc -l
47
```

O Proton 9.0 é a versão empacotada pela Valve; o diretório `compatdata` contém os prefixos Wine de cada jogo — 47 no exemplo. Cada prefixo é um mini Windows virtual, com suas DLLs traduzidas para chamadas Linux. O resultado prático: 47 jogos que foram comprados para Windows rodando em Linux sem configuração adicional.

Desenvolvedores que antes ignoravam Linux agora testam no Deck, corrigem bugs do Proton e até lançam versões nativas — porque o Deck criou uma base instalada grande o suficiente para justificar o esforço. Em 2025, mais de 30% dos jogos novos na Steam têm compilação nativa para Linux, número que era abaixo de 2% antes do Deck.

:::nota
A classificação "Steam Deck Verified" (selo verde) não significa "nativo de Linux", mas "testado e aprovado pela Valve no ecossistema SteamOS + Proton". Jogos nativos podem ter o selo, mas a maioria dos verificados são binários Windows rodando via Proton. A Valve testa cada jogo em quatro categorias: input, display, seamlessness e system support. O resultado é mais confiável que boatos de fórum.
:::

## Resumo

- O Steam Deck entrou num mercado de handhelds x86 que já existia e o redefiniu com preço, controles e sistema operacional.
- Concorrentes como ROG Ally e Legion Go têm hardware mais potente, mas sofrem com a experiência Windows em telas pequenas.
- O SteamOS, baseado em Arch Linux, permite boot rápido, interface de console e atualizações independentes da Microsoft.
- O Proton traduz jogos Windows para Linux em tempo de execução, com mais de 12.000 títulos compatíveis.
- O Deck transformou o Linux de nicho em plataforma viável para jogos, com mais de 30% dos lançamentos novos oferecendo build nativa.

## Exercícios

1. Pesquise dois concorrentes do Steam Deck lançados após 2023 e compare três especificações (tela, APU, bateria) com as do Deck OLED que você viu na [seção anterior](#/cap-001/sec-07).
2. Liste os prefixos Proton no seu Deck com `ls ~/.local/share/Steam/steamapps/compatdata/` e veja quantos jogos você tem. Cada pasta (número) corresponde a um AppID Steam.
3. Execute `systemd-analyze` e anote o tempo total de boot do seu Deck. Comparado a um laptop com Windows que você tem ou conhece, qual é a diferença?
4. Leia `/etc/os-release` e identifique a distribuição-base do SteamOS. A palavra "Arch" aparece? O que isso significa para o ciclo de atualizações?
5. **Desafio.** Escolha um jogo "Unsupported" (não suportado) da sua biblioteca Steam, instale, tente rodar com Proton Experimental (selecione nas propriedades → Compatibility) e documente os resultados. O jogo rodou? Se não, qual foi o erro? Relacione com a arquitetura do Proton e proponha uma hipótese do porquê do jogo não funcionar.