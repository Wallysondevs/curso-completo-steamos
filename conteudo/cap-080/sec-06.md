O Gamescope é a peça de engenharia da Valve que mais gente usa sem saber que existe. É ele que desenha o modo Gaming do Steam Deck e de qualquer distro que adote a sessão de jogo, e é ele que decide como seu jogo aparece na tela — resolução, taxa de quadros, HDR, upscaling. Entender o que ele faz por dentro e como configurá-lo fora do SteamOS é o que separa "o jogo abre" de "o jogo abre bem".

:::objetivos
- Entender o Gamescope como compositor Wayland e sua função na sessão
- Reconhecer as flags principais de resolução, FPS e escala
- Ativar HDR e VRR quando o hardware permitir
- Diferenciar Gamescope (compositor) de Steam Big Picture (aplicativo)
- Diagnosticar problemas comuns de renderização
:::

## O que o Gamescope realmente é

O Gamescope é um **compositor Wayland** — o processo que controla a saída de vídeo, montando a imagem final a partir das janelas e superfícies que os aplicativos desenham. O que o torna especial é o foco em jogo: ele foi escrito pela Valve especificamente para resolver os problemas que um compositor de desktop comum não resolve.

Esses problemas são concretos. Um jogo rodando em janela numa resolução menor que a da tela precisa de alguém que **reescale** para tela cheia sem borrar ou esticar errado. Um jogo que espera uma tela de 60 Hz, mas a sua é de 144 Hz, precisa de alguém que **negocie** a taxa. E o HDR — tão sensível a qualquer etapa errada no pipeline — precisa de um dono único que saiba tratar o fluxo de cor de ponta a ponta.

```terminal
$ gamescope --help | head -20
usage: gamescope [options...] -- [command...]
Options:
  -w, --width <n>      Output width
  -h, --height <n>     Output height
  -r, --refresh <n>    Refresh rate (Hz)
  -f, --frameshot <n>  Number of frames held
  -S, --scaler <name>  Scaling filter (linear, nearest, integer, fit)
```

Note o `-- [command...]`: o Gamescope pode **embrulhar** a execução de um jogo, de um app Steam, ou de uma sessão inteira. É essa natureza de "invólucro" que o torna útil tanto pelo sistema (a sessão de jogo) quanto manualmente, na linha de comando.

## A sessão de jogo em cima do compositor

Quando o modo Gaming inicia, quem sobe primeiro é o Gamescope, e o Steam Big Picture entra *dentro* dele como um cliente. A tela inteira que você vê — o launcher, as transições, o overlay FPS — é o Gamescope compondo. O Steam é só mais um aplicativo sendo apresentado.

Essa hierarquia explica uma confusão frequente:

| Camada | O que é | Papel |
|---|---|---|
| Gamescope | Compositor Wayland | Dono da tela, resolução, FPS, HDR |
| Steam Big Picture | Aplicativo | Interface de navegação e lançamento |
| Sessão de jogo | Serviço | Levanta Gamescope + Steam no boot |

Separar essas três camadas é o primeiro passo para diagnosticar qualquer problema. Quando "a tela fica preta", a pergunta certa é: falhou o compositor, o aplicativo, ou o serviço que os orquestra?

```terminal
$ systemctl status gamescope-session --no-pager | grep -E 'Active|Loaded'
     Loaded: loaded (/usr/lib/systemd/system/gamescope-session.service; enabled)
     Active: active (running) since Mon 2025-01-06 19:12:04 -03
```

## Flags que valem conhecer

Fora do Steam Deck, o Gamescope deixa de ser automático e passa a aceitar configuração explícita. As flags mais usadas controlam justamente o que o compositor decide sobre a tela:

```terminal
$ gamescope -w 1920 -h 1080 -r 60 -S integer -- steam
```

Aqui, `-w`/`-h` fixam a resolução de saída em 1080p, `-r 60` trava a taxa em 60 Hz, e `-S integer` escolhe o **scaler inteiro** — que reescala por múltiplos exatos, preservando pixels nítidos em jogos retro e em 2D. Para FPS modernos, o scaler `fit` ou `integer` vão depender do jogo.

Outra flag central é a de FSR, o upscaling da AMD que o Gamescope embute:

```terminal
$ gamescope -w 2560 -h 1440 -U -- steam
```

A opção `-U` (upscaling via FSR) faz o jogo renderizar numa resolução interna menor e o Gamescope subir para a resolução de saída, ganhando desempenho com perda mínima de nitidez. É o mesmo motor de FSR que o Steam Deck usa nos jogos que rodam em resolução reduzida.

```terminal
$ gamescope --hdr-enabled --hdr-itm-enable -- steam
```

As flags `--hdr-enabled` e `--hdr-itm-enable` ligam o HDR e a correção de tom, respectivamente — úteis em telas que suportam HDR, mas que só fazem efeito se o jogo também emitir em HDR.

## HDR e VRR: o teste de fogo

Duas tecnologias separam um painel de entrada de um painel gamer: **HDR** (maior faixa de luminância e cor) e **VRR** (taxa de atualização variável, que sincroniza a tela com o FPS do jogo e elimina *tearing*). Ambas são exatamente o tipo de coisa que um compositor genérico estraga e que o Gamescope se propõe a preservar.

O VRR no Gamescope depende de a tela negociar com o kernel e o driver AMD. A conexão precisa estar certa de ponta a ponta:

```terminal
$ gamescope -w 1920 -h 1080 --adaptive-sync -- steam
```

A flag `--adaptive-sync` pede ao Gamescope que ative o VRR. Se o painel não suportar, ele simplesmente não negocia — sem erro visível —, e o sintoma é *tearing* ou engasgos em FPS flutuante.

:::atencao
HDR e VRR são a dupla mais propensa a "funcionar em silêncio até não funcionar". Se o VRR parece ativo mas há *tearing*, confira se o jogo está em tela cheia exclusiva *dentro* do Gamescope e se o cabo/porta é DisplayPort ou HDMI 2.1. HDMI antigo, adaptador barato ou um hub USB-C capado são causas clássicas de VRR morto.
:::

## Diagnóstico rápido

Quando a tela falha no modo Gaming, isole pela hierarquia: primeiro o compositor, depois o aplicativo, depois o serviço.

```terminal
$ gamescope -w 1280 -h 720 -- glxinfo -B
name of display: gamescope-0
```

Se um comando mínimo dentro do Gamescope renderiza, o compositor está são e o problema está no jogo ou no Steam. Se nem isso desenha, suspeite do driver, do kernel ou do hardware.

```terminal
$ journalctl -u gamescope-session -b | grep -iE 'error|fail|hdr|vrr' | tail -15
```

O `journalctl` da unidade `gamescope-session` é o primeiro lugar a olhar: mensagens sobre falha de HDR, de modo de vídeo ou de DRM aparecem ali, com carimbo de boot.

## Resumo

- Gamescope é o compositor Wayland da Valve que controla tela, resolução, FPS, HDR e VRR no modo Gaming.
- O Steam Big Picture roda *dentro* do Gamescope como aplicativo; a sessão de jogo orquestra os dois.
- Flags como `-w/-h/-r`, `-S integer`, `-U` (FSR) e `--adaptive-sync` configuram o compositor manualmente.
- `--hdr-enabled`/`--hdr-itm-enable` ligam HDR; o VRR depende de painel, cabo e driver AMD corretos.
- Para diagnosticar, isole compositor → aplicativo → serviço, e leia `journalctl -u gamescope-session`.

## Exercícios

1. Rode `gamescope --help` e explique, em uma frase, o papel de quatro flags à sua escolha.
2. Lance um app simples dentro do Gamescope em 720p com scaler inteiro e observe o resultado: `gamescope -w 1280 -h 720 -S integer -- glxgears`.
3. Teste o FSR: rode um jogo leve em resolução interna baixa com `-U` e compare nitidez versus rodar em resolução nativa. Descreva a diferença.
4. Verifique se o VRR está ativo usando `gamescope --adaptive-sync` e uma tela compatível. Se houver *tearing*, investigue o cabo e a porta com base na dica da seção.
5. **Desafio.** Force uma sessão de jogo manual sem o serviço: pare o `gamescope-session`, e suba `gamescope -w 1920 -h 1080 -- steam -gamepadui` na mão. Observe a ordem de inicialização e confirme, com `ps`, quem é processo pai de quem.
