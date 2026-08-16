Por trás de boa parte da acessibilidade visual do SteamOS existe um único programa: o **gamescope**, o micro-compositor da Valve que renderiza o Modo Jogo. Ele controla resolução, escala, *framerate* e pós-processamento — e é nele que vivem recursos de acessibilidade que vão muito além do menu: `upscaling` (redimensionamento que melhora a nitidez em telas pequenas) e o **AMD FSR**, que reconstrói a imagem em qualidade superior. Entender o gamescope é entender por que certas opções se comportam como se comportam.

:::objetivos
- Explicar o papel do gamescope como compositor do Modo Jogo
- Distinguir upscaling de resolução nativa e seu efeito na legibilidade
- Inspecionar o estado de execução do gamescope pelo terminal
- Entender o FSR (FidelityFX Super Resolution) e quando ele ajuda
- Diagnosticar falhas de renderização que afetam a acessibilidade
:::

## O que o gamescope faz

O gamescope é um compositor minimalista escrito pela Valve em C/C++, usando o protocolo **Wayland** internamente. Sua função no SteamOS é assumir o controle total do display durante o Modo Jogo: ele cria uma superfície de desenho, recebe a imagem do jogo, aplica pós-processamento e empurra o resultado para o painel — tudo sem depender do KWin do desktop.

Essa arquitetura é o que permite coisas impossíveis num desktop comum: alternância instantânea de resolução, "fixação" de framerate e, para nós, o controle fino de escala e filtros. É também por isso que as opções de acessibilidade do Modo Jogo (contraste, filtro de cor) são aplicadas pelo gamescope na imagem final — a mesma razão pela qual elas não vazam para o desktop, como vimos na seção 1.

Para confirmar que o gamescope está em execução com um dado conjunto de flags, o processo aparece na lista:

```terminal
$ ps aux | grep gamescope | grep -v grep
deck      842  2.1  1.9 1734944 312640 ?  Ssl  09:12   0:41 /usr/bin/gamescope -W 1280 -H 800 -r 60 --backend drm
```

As flags importam: `-W 1280 -H 800` definem a superfície de composição; `-r 60` trava o framerate em 60 FPS; `--backend drm` escolhe o modo de renderização direto via DRM (Direct Rendering Manager), o mais próximo do hardware. É essa combinação que faz a interface parecer fluida e nítida.

## Upscaling e nitidez numa tela pequena

Uma confusão recorrente: rodar o jogo numa resolução **abaixo** da nativa e "esticar" para preencher a tela. Isso embaça a imagem — o efeito oposto ao que queremos em acessibilidade. O gamescope resolve com **upscaling** com filtros que suavizam a interpolação.

O aspecto-chave para legibilidade: quando o jogo roda em 1280×800 (nativo do painel), cada pixel do jogo casa com um pixel do painel — nitidez máxima. Quando roda em 800×500, por exemplo, o gamescope precisa "inventar" pixels intermediários, e qualquer filtro de interpolação é uma aproximação que degrada bordas, e portanto, texto.

Isso conecta diretamente com a seção de fonte: **a nitidez do texto é afetada pela resolução de renderização do jogo**, não apenas pelo tamanho de fonte. Um texto com fonte grande mas renderizado em resolução baixa continua borrado até nas bordas grandes.

Você pode verificar a resolução atual de saída do gamescope no próprio log:

```terminal
$ journalctl -u gamescope --no-pager | grep -i "output\|modeset" | tail -4
gamescope[842]: drm: connector eDP-1 connected
gamescope[842]: drm: selecting mode 1280x800@60.00Hz
```

A linha `selecting mode 1280x800@60.00Hz` confirma que a saída está na resolução nativa. Se aparecer outra resolução, o jogo (ou uma configuração) está forçando um modo abaixo do nativo.

## AMD FSR: reconstruindo qualidade

O **FidelityFX Super Resolution** (FSR) é a tecnologia de upscaling da AMD, e o gamescope a integra de forma transparente. A lógica: o jogo renderiza numa resolução **menor** (economizando GPU, liberando framerate) e o FSR reconstrói a imagem para a resolução de saída com um algoritmo mais inteligente que mera interpolação bilinear.

O FSR no gamescope é ativado por flag, e sua presença pode ser vista na lista de processos ou no log de inicialização:

```terminal
$ ps aux | grep gamescope | grep -v grep
deck      842  1.7  1.9 1735271 312992 ?  Ssl  09:12   0:39 /usr/bin/gamescope -W 1280 -H 800 -r 60 --fsr --backend drm
```

A flag `--fsr` liga o upscaling FSR. O resultado é uma imagem que "parece" de resolução mais alta do que a resolução real de renderização — importante para quem precisa de texto nítido mas não tem GPU sobrando para rodar o jogo em 1280×800.

:::info
O FSR é diferente de um mero filtro de nitidez. Ele usa dados de profundidade e movimento para reconstruir arestas (especialmente as de texto e geometria), mas com um custo computacional baixo. É por isso que ele se tornou popular em hardware portátil como o Steam Deck, onde cada watt de GPU importa.
:::

## Diagnóstico de falhas de renderização

Quando a tela pisca, trava ou um filtro não aplica, o log do gamescope é o primeiro lugar a olhar. Erros de Vulkan, de backend DRM ou de alocação de memória aparecem aqui:

```terminal
$ journalctl -u gamescope --no-pager | grep -iE "error|fail|vulkan|drm" | tail -8
gamescope[842]: vk: failed to create vulkan instance: VK_ERROR_INCOMPATIBLE_DRIVER
gamescope[842]: Failed to initialize backend
gamescope[842]: gamescope: exiting
```

A sequência `VK_ERROR_INCOMPATIBLE_DRIVER` → `Failed to initialize backend` → `exiting` é o padrão clássico de GPU sem driver Vulkan compatível — comum após uma atualização de sistema que deixou o driver `mesa`/`radv` num estado inconsistente. Nesse cenário, nenhuma acessibilidade visual funciona, porque o próprio compositor não sobe.

:::atencao
Se o gamescope cair e reiniciar em loop, o Modo Jogo pode alternar para um "fallback" de baixa resolução. A imagem fica granulada e os filtros (cor, contraste) param de aplicar porque não há superfície compatível. Nos logs, procure por `exiting` seguido de um novo `Running compositor` com modo de saída reduzido — isso indica que o sistema está operando em modo de emergência visual.
:::

## Acessibilidade além do menu, via gamescope

O ponto mais importante desta seção: parte da acessibilidade do SteamOS **não tem botão no menu** — ela é consequência das flags do gamescope. FSR, resolução de saída correta e framerate estável são recursos de acessibilidade *de facto*, porque determinam se o texto é legível e se a imagem não causa fadiga.

Por isso, ao diagnosticar "o texto está borrado" ou "a tela pisca", não procure apenas nas opções de Acessibilidade — investigue o gamescope. Muitas vezes a correção está em reconduzir o jogo à resolução nativa ou ativar o FSR, não em aumentar ainda mais a fonte.

## Resumo

- O gamescope é o compositor Wayland que renderiza o Modo Jogo e aplica filtros visuais na imagem final.
- As flags `-W/-H` definem a superfície, `-r` trava o framerate e `--backend drm` escolhe renderização direta.
- Rodar o jogo abaixo da resolução nativa embaça o texto; `journalctl` mostra o modo de saída selecionado.
- O FSR (`--fsr`) reconstrói qualidade de resoluções menores, economizando GPU com perda mínima de nitidez.
- Falhas de Vulkan/DRM no log (`VK_ERROR_INCOMPATIBLE_DRIVER`) derrubam o compositor e toda acessibilidade visual.

## Exercícios

1. Rode `ps aux | grep gamescope | grep -v grep` e anote as flags `-W`, `-H`, `-r` e o backend. Explique cada uma.
2. Verifique a resolução de saída com `journalctl -u gamescope | grep -i "selecting mode"` e confirme se é 1280×800 nativo.
3. Ative a flag `--fsr` (se aplicável à sua versão) e compare a nitidez de texto num jogo rodando abaixo da resolução nativa, com e sem FSR.
4. Procure por erros com `journalctl -u gamescope | grep -iE "error|fail"`. Se houver, classifique cada um como driver, memória ou modo de saída.
5. **Desafio.** Force um jogo a rodar em 800×500 e observe o texto da interface. Depois reconduza-o a 1280×800 e ative o FSR. Descreva, com base no que aprendeu sobre upscaling, por que a combinação "resolução nativa + FSR" é ideal para legibilidade em telas pequenas, e relacione isso com as seções de fonte do capítulo.