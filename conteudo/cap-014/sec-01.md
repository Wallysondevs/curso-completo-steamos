O Steam Deck tem a ergonomia de um console, mas o cérebro de um PC. Isso só funciona porque a Valve desenhou uma camada de software inteira — o Steam Input — para traduzir cada botão, alavanca, touchpad e giroscópio em comandos que qualquer jogo entenda. Sem essa camada, jogar um jogo feito para teclado e mouse num controle seria quase impossível. Entender essa arquitetura é a chave para destravar tudo o que o deck oferece.

:::objetivos
- Distinguir o Steam Input de controles convencionais como o XInput do Xbox
- Compreender por que o Steam Input é uma camada de tradução, não um driver de periférico
- Identificar os dois modos de compatibilidade: Steam Input API e emulação XInput
- Localizar os arquivos de configuração de controles no disco do SteamOS
:::

## O problema que o Steam Input resolve

Num PC tradicional, um controle fala com o jogo através de um driver e de uma API de sistema. O padrão de mercado é o **XInput**, criado pela Microsoft para o Xbox 360 e mantido até hoje: ele define um conjunto fixo de botões (A, B, X, Y, gatilhos, alavancas e oito direções de D-pad) e pronto. O jogo lê aquilo e não pergunta mais nada.

O problema é que esse vocabulário é pobre. Ele não conhece touchpads, não conhece giroscópio, não conhece botões traseiros. Todo controle que existe "fora do molde Xbox" acaba reduzido, pelo driver, a uma imitação de controle de Xbox — e metade do hardware que ele realmente tem é simplesmente descartada.

A Valve atacou isso por outro ângulo. Em vez de inventar outro driver que fosse a mesma coisa com outro nome, criou o **Steam Input**, uma camada de software que fica *entre* o controle e o jogo. O controle manda a leitura bruta de todos os seus componentes, e o Steam Input traduz isso para qualquer coisa: teclas de teclado, movimentos de mouse, comandos de controle de Xbox, atalhos, cadeias de comandos.

```terminal
$ find ~/.local/share/Steam/steamapps/common -name "*.vdf" 2>/dev/null | head -20
/home/deck/.local/share/Steam/steamapps/common/Steam Linux Runtime/run.sh.vdf
/home/deck/.local/share/Steam/steamapps/common/SteamOS Device Support/controller.vdf
/home/deck/.local/share/Steam/controller_base/workshop.vdf
```

Os arquivos `.vdf` (formato *KeyValues* da Valve) aparecem espalhados por toda a instalação do Steam e guardam configuração, incluindo boa parte do que diz respeito a controles. A simples presença de um diretório chamado `controller_base` na raiz da instalação já diz muito: o suporte a controles não é um acessório, é parte estrutural do cliente Steam.

## Steam Input API versus emulação XInput

Existem dois caminhos diferentes pelos quais um comando do seu controle chega ao jogo, e eles determinam muita coisa.

**Pela Steam Input API.** Se o jogo foi compilado com o SDK da Valve, ele conversa diretamente com o Steam Input. Nesse caso o jogo recebe ações semânticas — "pular", "atirar", "abrir mapa" — em vez de números de botão. Isso permite que o mesmo jogo entenda seu controle independentemente do modelo físico: um Steam Controller, um DualSense, um Switch Pro e o controle do próprio deck podem todos funcionar de forma nativa.

**Pela emulação XInput.** A grande maioria dos jogos *não* conhece o Steam Input. Para esses, o Steam Input finge ser um controle de Xbox: o jogo acha que está falando com um XInput legítimo, e nunca percebe que existe um touchpad ou um giroscópio sendo traduzido por trás. É isso que faz o Steam Deck rodar praticamente qualquer jogo de controle sem nenhuma configuração manual.

```terminal
$ grep -i controller ~/.local/share/Steam/logs/controller_ui.txt 2>/dev/null | tail -12
[Steam Input] Device "Steam Deck Controller" connected, slot 0
[Steam Input] Translating game actions for "Steam Deck Controller"
[Steam Input] Config loaded: 1389032 (official Steam Deck template)
[Steam Input] Device "Steam Deck Controller" assigned to XInput slot 0
[Steam Input] HID device opened: /dev/hidraw3
[Steam Input] Gyro calibrated, drift 0.0012
```

Nessa amostra de log, dá para ver o fluxo completo. O controle do deck é reconhecido pelo nome, recebe um *slot*, carrega um config oficial (identificado pelo ID numérico `1389032`), é atribuído a um *slot* XInput e, por fim, o giroscópio é calibrado. A linha do XInput expõe o mecanismo: para o jogo, o deck é "só mais um controle de Xbox".

:::nota
Quando um jogo usa a Steam Input API, o `controller_ui.txt` mostra linhas de "game actions" em vez de "XInput slot". É um jeito rápido de saber, sem abrir o jogo, qual dos dois caminhos está em uso.
:::

## Onde mora a configuração

Cada layout que você cria, baixa ou edita vive em arquivos dentro do seu perfil de usuário. O diretório raiz de tudo que envolve controle é:

```terminal
$ ls ~/.local/share/Steam/config/controller_configs 2>/dev/null
274190
438700
1172470
personalization
```

Cada diretório numerado acima é um **AppID** de jogo — o identificador numérico do jogo na loja do Steam. Dentro de cada um ficam as configurações de controle específicas daquele jogo. O diretório `personalization` guarda preferências que valem para todos os jogos, como a ordenação dos seus layouts salvos.

```terminal
$ ls ~/.local/share/Steam/config/controller_configs/1172470 2>/dev/null
SteamControllerGamepad.vdf
workshop
$ head -c 400 ~/.local/share/Steam/config/controller_configs/1172470/SteamControllerGamepad.vdf 2>/dev/null
"controller_mappings"
{
        "version"               "3"
        "revision"              "9"
        "title"                 "Official Layout"
        "description"           "Recommended layout for this game"
        "creator"               "76561198000000000"
        "controller_type"       "controller_steamcontroller_gordon"
```

O arquivo `SteamControllerGamepad.vdf` descreve, numa estrutura hierárquica, o mapeamento de cada botão para cada ação. Manipular esses arquivos à mão é possível, mas raramente necessário — a interface faz isso por você. Ainda assim, saber que eles existem importa: é para lá que você olha para fazer backup, para copiar um layout de uma conta para outra ou para comparar duas versões.

## Resumo

- O Steam Input é uma camada de tradução que fica entre o controle e o jogo, e não um driver de periférico.
- O XInput é o padrão de controle do Xbox e conhece apenas botões, gatilhos, alavancas e D-pad.
- Jogos com Steam Input API recebem ações semânticas; os demais recebem um XInput emulado.
- A emulação XInput é o que permite rodar qualquer jogo de controle no deck, sem configuração manual.
- As configurações vivem em arquivos `.vdf` sob `~/.local/share/Steam/config/controller_configs/<AppID>/`.

## Exercícios

1. Rode `ls ~/.local/share/Steam/config/controller_configs` e anote quantos AppIDs de jogos estão presentes. Identifique pelo menos um deles.
2. Execute `grep -i controller ~/.local/share/Steam/logs/controller_ui.txt | tail -30` e identifique se algum jogo usou Steam Input API (game actions) ou se caiu na emulação XInput.
3. Use `find ~/.local/share/Steam/steamapps/common -iname "*.vdf" | wc -l` para contar quantos arquivos `.vdf` existem na sua biblioteca de jogos instalados.
4. Abra um arquivo `SteamControllerGamepad.vdf` com `head -c 800` e localize os campos `title` e `creator`. O que o `creator` (um número SteamID) pode te dizer sobre a origem do layout?
5. **Desafio.** Compare o conteúdo de dois diretórios de `controller_configs` de jogos diferentes. Um deles tem um subdiretório `workshop` e o outro não. Usando `ls -R`, explique em prosa o que a presença de `workshop` indica sobre a origem dos layouts daquele jogo.
