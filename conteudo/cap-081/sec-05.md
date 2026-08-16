Quando um jogo da sua biblioteca não roda bem com o Proton padrão da Valve, a comunidade tem uma resposta: versões alternativas de Proton, como o **GE-Proton**, ou camadas mais exóticas como o **Luxtorpeda**. O **ProtonUp-Qt** é a ferramenta gráfica que instala e gerencia tudo isso sem tocar no modo leitura do sistema. Este é o homebrew de compatibilidade — e provavelmente o que mais impacto prático tem no dia a dia de quem joga no Deck.

:::objetivos
- Entender a diferença entre o Proton da Valve e as versões comunitárias
- Instalar o ProtonUp-Qt via Flatpak ou AppImage
- Adicionar o GE-Proton à biblioteca de ferramentas do Steam
- Gerenciar camadas de compatibilidade e entender onde elas vivem
:::

## Proton, GE-Proton e a cadeia de quem faz o quê

O **Proton** é uma camada de compatibilidade que a Valve constrói sobre o Wine, traduzindo chamadas de Windows para o Linux. Ele é o que permite rodar a imensa maioria dos jogos da Steam no Deck. Mas a Valve distribui o Proton de forma conservadora: a versão oficial só inclui componentes que a Valve pode redistribuir legalmente e testar em escala.

Ficam de fora codecs proprietários de vídeo, fontes do Windows e patches específicos de jogos. É aí que entra o **GE-Proton** (GloriousEggroll Proton), mantido por um desenvolvedor da comunidade. Ele empilha, por cima do Proton oficial, esses extras de mídia e correções pontuais que fazem certos títulos — principalmente cutscenes em vídeo e jogos antigos — funcionarem onde o Proton padrão falha.

Há ainda camadas totalmente diferentes do Proton:

- **Luxtorpeda** — roda jogos usando motores nativos open-source em vez de Wine (ex.: jogos de `id Tech` rodando no `gzwrap`/`DoomRunner`).
- **Boxtron** — roda jogos de DOS através do DOSBox.
- **Roberta** — roda jogos no motor ScummVM para aventuras point-and-click clássicas.

Todas essas camadas são instaladas na sua home, dentro do Steam, sem qualquer alteração em `/usr`.

## Instalando o ProtonUp-Qt

O ProtonUp-Qt é uma interface gráfica escrita em Qt que centraliza a instalação dessas camadas. A forma recomendada é via Flatpak — já disponível no Discover do Deck:

```terminal
$ flatpak install flathub net.davidotek.pupgui2
Looking for matches…
Required runtime for net.davidotek.pupgui2/x86_64/stable (runtime/org.kde.Platform/x86_64/6.7) found in remote flathub
Do you want to install it? [Y/n] y
```

Depois de instalado, ele aparece no menu de aplicativos do modo Desktop. Ao abrir, você vê uma lista das ferramentas compatíveis (Proton, GE-Proton, Luxtorpeda, Boxtron, Roberta e outras) e um botão de instalação para cada uma. Cada instalação baixa a versão escolhida e a registra automaticamente no Steam, pronta para ser selecionada por jogo.

## Onde essas camadas vivem

O segredo da sobrevivência é o diretório de destino. Tudo é instalado em `~/.local/share/Steam/compatibilitytools.d/`:

```terminal
$ ls ~/.local/share/Steam/compatibilitytools.d/
GE-Proton9-20/
GE-Proton8-31/
Luxtorpeda/
Boxtron/
Roberta/
```

Cada pasta é uma "ferramenta de compatibilidade" que o Steam reconhece e oferece no menu de propriedades de cada jogo. Esse diretório fica na `/home`, então **nada é apagado por atualização do sistema**. Quando a Valve lança um update, seus GE-Protons, Luxtorpeda e afins permanecem ali intactos.

```terminal
$ ls ~/.local/share/Steam/compatibilitytools.d/GE-Proton9-20/
compatibilitytool.vdf
files/
toolmanifest.vdf
```

Os dois arquivos VDF são o que comunicam ao Steam que aquela pasta é uma ferramenta. O `compatibilitytool.vdf` descreve o nome, a versão e como executar o Proton personalizado; o `toolmanifest.vdf` lista o conteúdo. Sem esses arquivos, o Steam ignora a pasta.

## Selecionando uma camada por jogo

Depois de instalar o GE-Proton no ProtonUp-Qt, o fluxo é:

1. No Steam, clique com o botão direito no jogo → Propriedades → Compatibilidade.
2. Marque "Forçar o uso de uma ferramenta de compatibilidade específica".
3. Escolha `GE-Proton9-20` (ou a versão que você instalou) na lista.
4. Feche e inicie o jogo.

A escolha fica registrada por jogo e por usuário. É possível, e comum, ter jogos diferentes usando camadas diferentes — um usando o Proton oficial, outro o GE, outro o Luxtorpeda.

Estrutura do registro de compatibilidade de um jogo:

```terminal
$ cat ~/.local/share/Steam/config/config.vdf | grep -A4 "CompatToolMapping"
```

:::nota
O registro de qual ferramenta cada jogo usa fica no `config.vdf`, dentro da instalação do Steam na home. É ilegível à primeira vista por ser VDF aninhado, mas a informação está lá. Na prática você não edita isso à mão — a interface de Propriedades faz o trabalho. Saber que existe, porém, ajuda a entender por que reinstalar o Steam (ou trocar de conta) "esquece" suas escolhas de compatibilidade.
:::

## A primeira execução e os prefixos

Cada camada nova cria, na primeira vez que um jogo roda com ela, um **prefixo** (uma instalação isolada de Windows) em `compatdata/`:

```terminal
$ ls ~/.local/share/Steam/steamapps/compatdata/ | head -5
105600/
440/
730/
$ ls ~/.local/share/Steam/steamapps/compatdata/105600/
pfx/
```

O `pfx/` é o prefixo Wine — o "Disco C:" virtual do jogo. Trocar um jogo de Proton oficial para GE-Proton geralmente cria um prefixo novo ou reutiliza o existente, dependendo de como o jogo foi configurado. Se um jogo passa a travar depois de trocar a camada, muitas vezes apagar o prefixo antigo (com o jogo fechado) resolve, obrigando uma reconfiguração limpa.

:::atencao
Apagar um prefixo em `compatdata/<appid>/pfx/` também apaga os saves que o jogo guarda dentro do seu "Disco C:" virtual (alguns jogos salvam no prefixo, não no Steam Cloud). Antes de apagar, verifique na [seção sobre saves não-Steam](#/cap-072/sec-05) se o jogo grava ali. Faça um backup do prefixo inteiro antes de qualquer remoção destrutiva.
:::

## Mantendo tudo atualizado

O ProtonUp-Qt resolve a parte trabalhosa de acompanhar versões novas. Cada vez que você o abre, ele compara a versão instalada com a mais recente disponível no GitHub e oferece atualização com um clique. O mesmo vale para remoção: ferramentas antigas podem ser desinstaladas para liberar espaço, já que cada GE-Proton ocupa centenas de megabytes.

```terminal
$ du -sh ~/.local/share/Steam/compatibilitytools.d/GE-Proton9-20/
542M	/home/deck/.local/share/Steam/compatibilitytools.d/GE-Proton9-20/
```

Ferramentas antigas acumuladas consomem gigabytes. Uma limpeza periódica — mantendo só a versão atual e a anterior de reserva — é uma boa prática que a seção 9 retoma.

## Resumo

- O GE-Proton estende o Proton oficial com codecs e patches que a Valve não pode redistribuir; camadas como Luxtorpeda e Boxtron usam motores nativos/DOSBox.
- O ProtonUp-Qt é uma GUI (Flatpak) que instala e atualiza todas essas camadas com um clique.
- As camadas vivem em `~/.local/share/Steam/compatibilitytools.d/` — na home, logo imunes a atualizações do sistema.
- Cada jogo escolhe sua camada em Propriedades → Compatibilidade; o registro fica no `config.vdf`.
- A primeira execução cria um prefixo Wine em `compatdata/<appid>/pfx/`, que pode conter saves do jogo.
- Cada GE-Proton ocupa centenas de MB; limpeza periódica evita acúmulo de versões velhas.

## Exercícios

1. Instale o ProtonUp-Qt (`flatpak install flathub net.davidotek.pupgui2`) e, por ele, instale a versão mais recente do GE-Proton. Confirme com `ls ~/.local/share/Steam/compatibilitytools.d/`.
2. Escolha um jogo da sua biblioteca que não esteja rodando bem e force o GE-Proton nele. Compare o comportamento antes e depois; anote se cutscenes ou vídeos passaram a funcionar.
3. Liste o tamanho de cada camada com `du -sh ~/.local/share/Steam/compatibilitytools.d/*`. Quanto espaço as versões antigas estão consumindo?
4. Localize o prefixo de um jogo cuja camada você trocou (`compatdata/<appid>/pfx`) e verifique se o jogo guarda saves ali (`find ... -iname '*.sav' -o -iname '*.dat'`).
5. **Desafio.** Instale também o Luxtorpeda e rode um jogo com motor open-source nativo (por exemplo, um jogo baseado em `id Tech`) usando-o. Explique a diferença arquitetural entre o Luxtorpeda (motor nativo) e o GE-Proton (Wine) — e por que o Luxtorpeda pode oferecer performance e fidelidade melhores quando o título é suportado.