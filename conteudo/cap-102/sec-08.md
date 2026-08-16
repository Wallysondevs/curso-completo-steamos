O Steam Deck não é só um Linux com um cliente Steam em cima. Grande parte da mágica de "funciona, é só clicar em jogar" vem de uma camada de software que a Valve construiu especialmente para o hardware: o **Steam Input**, o **Steam Cloud** e o **shader cache**. Essas três peças resolvem, respectivamente, o problema do controle, o problema de manter seus saves em dia, e o problema da primeira execução gaguejando. Entender as três é entender por que um jogo de PC "só funciona" num portátil.

:::objetivos
- Compreender o Steam Input como camada universal de mapeamento de controle
- Navegar pelo Big Picture Mode e a relação com o modo de jogo do Deck
- Entender o Steam Cloud, seus limites e conflitos
- Localizar o shader cache e o pipeline cache na biblioteca Steam
- Diferenciar Steam Play e ferramentas de compatibilidade por AppID
:::

## Steam Input e o layout de controle do Deck

O **Steam Input** é a camada de configuração de controle universal da Steam. Em vez de cada jogo implementar suporte a cada gamepad do mercado, o Steam Input fica **entre** o jogo e o hardware: ele recebe a entrada bruta (de um controle qualquer, teclado, ou dos controles embutidos do Deck) e a reescreve, em tempo real, como a entrada que o jogo espera — seja XInput (o padrão Xbox), teclado ou mouse.

A palavra-chave aqui é **virtualização de controle**. O jogo acha que está vendo um controle Xbox padrão; o que ele recebe, na verdade, é o resultado de um mapeamento que você (ou a comunidade) definiu. Cada mapeamento é um **layout**, e a Steam hospeda layouts comunitários que qualquer pessoa pode publicar e compartilhar.

O **Steam Deck controller layout** é o mapeamento padrão que o Steam Input aplica aos controles físicos do Deck: dois analógicos, um D-pad, quatro botões de face (A/B/X/Y), quatro gatilhos/botões de ombro (L1/R1, L2/R2), **dois touchpads**, o **giroscópio**, os botões traseiros (L4/R4/L5/R5) e os botões de sistema (Steam e opções "…"). São 14 entradas discretas mais os touchpads e o giro, e o Steam Input mapeia cada uma para o que o jogo pedir.

:::dica
Com o jogo rodando, aperte o botão **Steam** e entre no menu de controle. Lá você troca o layout ativo, edita o mapeamento por botão e ativa o **giroscópio** — que pode ser exposto ao jogo como mouse (ideal para mira fina) ou como analógico direito, dependendo do gênero.
:::

## Big Picture Mode e o modo de jogo

O **Big Picture Mode** é a interface de TV/console da Steam, projetada originalmente para quem liga um PC na sala. Fontes grandes, navegação por controle, tudo pensado para a distância do sofá. O Deck usa uma versão dele como a **UI principal do modo de jogo** (o *gamemode*): quando você liga o aparelho e cai na tela da Steam, aquilo é o Big Picture adaptado ao aparelho, tocado pelo Gamescope que [vimos na seção de compositor](#/cap-102/sec-05).

A distinção é entre dois modos do Deck. O **modo de jogo** roda o Big Picture por cima do Gamescope, em fullscreen, otimizado para o controle. O **modo desktop** roda o KDE Plasma convencional, com teclado e mouse, onde a Steam vira uma janela normal. Toda a experiência de console — gerenciar biblioteca, ajustar performance, configurar controles — acontece no modo de jogo.

```terminal
$ ps aux | grep -i steam | head -3
deck       511  8.9  2.4 3124552 198000 ?  SLsl 12:01  0:32 steam
deck      1210  3.1  1.1 1524000 92000 ?  Sl   12:01  0:11 /home/deck/.local/share/Steam/ubuntu12_32/steam -bigpicture
```

A flag `-bigpicture` no processo do Steam confirma que ele foi lançado direto no Big Picture, sem passar pelo desktop. É essa linha de comando — montada pela sessão de jogo do SteamOS — que faz o aparelho "nascer console".

## Steam Cloud: saves e configs sincronizados

O **Steam Cloud** sincroniza seus saves e configurações entre dispositivos. Quando um jogo que suporta Cloud é fechado, a Steam envia os arquivos de save para os servidores da Valve; quando você abre o mesmo jogo em outra máquina (outro Deck, um PC), eles são baixados antes do início. O resultado é a continuidade: você continua no Deck de onde parou no desktop.

Os limites são por jogo: cada desenvolvedor decide **quais arquivos** entram no Cloud (quase sempre saves e configs, raramente a instalação inteira) e há um **quota** de tamanho por título. Arquivos além da quota simplesmente não sobem. Por isso alguns jogos com saves gigantes (capturas, dados de replay) ficam fora do Cloud automaticamente.

Conflitos acontecem quando o mesmo jogo é usado em dois lugares sem sincronizar: você joga offline no Deck, avança, e depois abre no PC que também tinha um save mais antigo. A Steam detecta a divergência e oferece um diálogo para você escolher qual versão manter — local ou na nuvem.

```terminal
$ ls ~/.local/share/Steam/userdata/
1234567
$ ls ~/.local/share/Steam/userdata/1234567/config/
localconfig.vdf
```

Os dados do Cloud são organizados por **SteamID** (a pasta `1234567` é um id de usuário de exemplo). Dentro dela, `config/localconfig.vdf` guarda suas configurações locais. Os saves em si ficam espalhados por `steamapps/common/<AppID>/`, mas o controle de sincronização e o estado do Cloud vivem por aqui.

:::atencao
O Steam Cloud **não** é um backup completo da sua biblioteca — ele não guarda a instalação do jogo, só os arquivos que o desenvolvedor marcou. Jogos sem suporte a Cloud não têm save na nuvem de jeito nenhum. Para garantir um save de um jogo assim no Deck, copie os arquivos manualmente de `~/.local/share/Steam/steamapps/compatdata/<AppID>/` ou do prefixo Proton correspondente.
:::

## Shader cache, DXVK pipeline cache e a primeira execução

O **shader cache** é um cache de **shaders já compilados**. Um shader é um programinha que roda na GPU para colorir cada pixel; quando o jogo encontra um shader pela primeira vez, ele precisa **compilá-lo** na hora para a GPU da sua máquina. Essa compilação em tempo real é cara, e é a razão pela qual jogos "gaguejam" no primeiro run e vão suavizando conforme você joga.

O cache resolve isso guardando o shader já compilado. Na segunda vez, ele é carregado do disco em vez de recompilado, e a gagueira some. No Deck, onde todo mundo tem a mesma GPU (a APU AMD Van Gogh), a Valve pode ir além: ela **pré-compila** shaders na nuvem e os entrega prontos via download — é o chamado pre-cache. Assim, mesmo no primeiro run, o Deck já tem os shaders prontos.

Para jogos **Vulkan**, existe também o **DXVK state cache / pipeline cache**. O DXVK (a camada que traduz Direct3D para Vulkan, [vista na seção de Proton](#/cap-102/sec-03)) compila *pipelines* — combinações de estado gráfico — que são o verdadeiro gargalo do stutter. O *pipeline cache* guarda essas combinações; o projeto **Fossilize** serializa e reutiliza esses caches entre execuções. O resultado é o mesmo princípio do shader cache, aplicado ao estado do DXVK.

```terminal
$ ls ~/.local/share/Steam/steamapps/shadercache/
1074100
730
570
```

Cada pasta é o **AppID** de um jogo (o `1074100` é o Elden Ring, o `730` é o CS2, o `570` é o Dota 2). Dentro delas moram os shaders compilados para aquela GPU. É um diretório que pode crescer bastante — e que às vezes vale a pena limpar quando o espaço aperta.

## AppID, compatdata e a organização da biblioteca

Todo jogo na Steam tem um **AppID** — um número inteiro que o identifica unicamente no catálogo da Valve. Não é vaidade: é esse número que organiza tudo no disco. Os arquivos do jogo ficam em `steamapps/common/<AppID>/` (na verdade, o nome da pasta costuma ser o nome "limpo" do jogo, mas todo o restante usa o número), e os dados de compatibilidade do Proton ficam em `steamapps/compatdata/<AppID>/`.

```terminal
$ ls ~/.local/share/Steam/steamapps/
appmanifest_570.acf
common
compatdata
libraryfolders.vdf
shadercache
$ ls ~/.local/share/Steam/steamapps/compatdata/ | head -5
1074100
1172470
1245620
730
813780
```

Cada pasta em `compatdata/<AppID>/` é o **prefixo Wine** daquele jogo — o "disco C:" virtual onde o Proton instala as bibliotecas Windows e onde os saves de jogos Windows costumam morar. O `appmanifest_*.acf` é o arquivo de manifesto que registra a instalação; o `libraryfolders.vdf` descreve onde suas bibliotecas estão.

O **Steam Play / compatibility tools** é o menu, por jogo, que escolhe **qual** ferramenta de compatibilidade (leia-se: **qual versão do Proton**) vai rodar aquele título. Em vez de um Proton global, cada jogo pode pinar uma versão específica — útil quando um jogo quebra na versão mais nova do Proton.

```terminal
$ steam --reset
```

O `steam --reset` reinicia o cliente limpo, recarregando configurações e re-varrendo a biblioteca. Quando um jogo some da lista, o Cloud se perde ou o shader cache fica inconsistente, esse comando é o primeiro socorro: ele relê os manifestos (`appmanifest_*.acf`) e reconstrói o estado do cliente.

:::nota
O **giroscópio** (gyro) é um sensor de movimento no Deck que mede rotação. O Steam Input o expõe ao jogo como mouse ou analógico, permitindo "mirar" inclinando o aparelho. É uma das entradas mais subestimadas do Deck: combinada com o touchpad, dá precisão de mouse sem mouse. Nas configurações de controle, a aba do giroscópio define quando ele fica ativo (sempre, só ao mirar, só ao tocar o capo) e o eixo de resposta.
:::

## Resumo

- O Steam Input fica entre o hardware e o jogo, virtualizando qualquer controle como XInput, teclado ou mouse, via layouts comunitários.
- O layout do Deck mapeia analógicos, D-pad, botões, gatilhos, dois touchpads, giroscópio e botões traseiros.
- O Big Picture Mode é a interface de console da Steam; o modo de jogo do Deck roda uma versão dele sobre o Gamescope.
- O Steam Cloud sincroniza saves e configs por SteamID, com quota por jogo e resolução de conflitos.
- Shader cache pré-compilado (Vulkan) e DXVK pipeline cache (Fossilize) eliminam a gagueira da primeira execução.
- Cada jogo tem um AppID; os dados ficam em `steamapps/common/` e `compatdata/<AppID>/`, com Proton escolhido por jogo.

## Exercícios

1. Rode `ls ~/.local/share/Steam/steamapps/` e liste os três tipos de conteúdo que você encontra. O que é `appmanifest_*.acf` e o que é `compatdata`?
2. Entre no modo de jogo, abra um jogo e veja o menu de controle (botão Steam). Identifique a qual função o giroscópio está mapeado por padrão.
3. Execute `ls ~/.local/share/Steam/steamapps/shadercache/` e anote os AppIDs. Confirme, pela pasta `common/`, quais jogos eles correspondem.
4. Localize o prefixo Proton de um jogo com `ls ~/.local/share/Steam/steamapps/compatdata/<AppID>/`. Quais subdiretórios do "disco C:" aparecem?
5. **Desafio.** Rode `steam --reset` e observe a re-varredura da biblioteca. Relacione os manifestos com o shader cache e o Cloud: se um jogo sumir da lista, qual componente explica os saves, qual explica os shaders e qual explica a entrada do jogo em si?
