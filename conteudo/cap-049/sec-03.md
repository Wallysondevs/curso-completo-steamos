O PlayStation 2 foi o console mais vendido da história, e essa biblioteca gigantesca — de títulos de PS2 a muito jogo de PS1 via retrocompatibilidade — é uma das melhores razões para ter um Steam Deck. O PCSX2 é hoje um projeto maduro e rápido, e no Deck ele entrega a maioria dos jogos a 60 FPS com resolução acima da nativa. O segredo não está em baixar a versão certa, mas em acertar o renderizador, o upscaling e o modo de compatibilidade de cada título.

:::objetivos
- Instalar e executar o PCSX2 no Steam Deck
- Selecionar a BIOS e organizar as imagens de jogo
- Configurar o renderizador Vulkan e o upscaling correto
- Aplicar patches e ajustes por jogo
- Diagnosticar quedas de FPS e problemas de áudio típicos
:::

## Primeira execução e BIOS

Na primeira execução, o PCSX2 abre um assistente pedindo a BIOS. A tela de seleção fica vazia até você copiar o arquivo para a pasta correta (vista na [seção anterior](#/cap-049/sec-02)). Depois de aparecer na lista, selecione a BIOS mais recente que você tiver — a convenção é preferir uma revisão alta e de região compatível com seus jogos.

```terminal
$ flatpak run net.pcsx2.PCSX2
[GameList] Scanning /home/ana/Emulation/roms/ps2 ...
[GameList] 3 game images loaded
```

Os jogos de PS2 são tipicamente imagens no formato `.iso` ou `.chd`. O `.chd` é um contêiner comprimido sem perdas que reduz muito o tamanho — um jogo de 3 GB vira 1 GB — e o PCSX2 lê direto, então é o formato recomendado para economizar espaço no SSD do Deck.

## Renderizador e upscaling

O PCSX2 moderno usa **Vulkan** por padrão, e você deve mantê-lo: em GPU AMD, ele é a diferença entre 60 FPS travado e stutter. O segundo ajuste que mais impacta é o *internal resolution* (resolução interna), a resolução em que o emulador renderiza antes de escalar para a tela.

```terminal
$ flatpak run net.pcsx2.PCSX2 --fullscreen
```

Em *Settings → Graphics → Rendering*, os valores que funcionam bem no Deck são:

| Ajuste | Valor recomendado |
|---|---|
| Renderer | Vulkan |
| Internal Resolution | 2x–3x (~720p–1080p) |
| Aspect Ratio | Widescreen (16:9) com patch |
| Texture Filtering | Bilinear |

Resolução interna 3x já dá uma imagem nítida na tela de 800p do Deck, e o hardware aguenta na maioria dos títulos. Jogos mais pesados (como *Shadow of the Colossus*) você baixa para 2x. O *widescreen* depende de patch, porque o PS2 renderizava em 4:3 e esticar a imagem distorce; o patch corrige posição de câmera para preencher 16:9 sem deformar.

:::dica
Para jogo com problemas, mantenha o botão de *performance overlay* ligado (FPS no canto). Ele mostra em tempo real se a queda vem da CPU (EE/GS a 100%) ou da GPU (GPU a 100%), e essa divisão muda o ajuste certo — destravar a CPU é reduzir EE emulation; destravar a GPU é baixar resolução interna.
:::

## Patches por jogo e banco de compatibilidade

O título joga melhor quando você usa as configurações que a comunidade já descobriu para ele. O PCSX2 tem dois recursos que operam por jogo:

- **Patches de widescreen e correções**: habilitados em *Settings → Graphics*, aplicam automaticamente quando o jogo correspondente é detectado.
- **Configurações por jogo** (*per-game settings*): clique direito no jogo na lista e ajuste um perfil que só vale para aquele título.

```terminal
$ flatpak run net.pcsx2.PCSX2
[Patches] Loaded 2 widescreen patches for SLUS-20915
```

A linha mostra o patch sendo carregado pelo código do jogo (`SLUS-20915` é um identificador de catálogo). Quando você adiciona ajustes por jogo, eles ficam salvos num arquivo separado e não afetam os outros títulos da lista.

:::atencao
O site de compatibilidade do PCSX2 classifica jogos em *Playable*, *In-game* e *Broken*. Antes de gastar uma hora mexendo em renderizador, confira a classificação do seu título: alguns jogos são simplesmente imaturos na emulação e nenhum ajuste seu vai salvar.
:::

## Diagnóstico de FPS e áudio

Dois sintomas dominam os pedidos de ajuda: áudio estalando e quedas de FPS em cenas específicas. O áudio estalando quase sempre é sintoma de jogo rodando abaixo da velocidade real — o emulador estica o buffer sonoro para acompanhar e o resultado é um estalo. Corrigir o FPS corrige o áudio.

```terminal
$ flatpak run net.pcsx2.PCSX2 2>&1 | grep -iE 'slow|drop|vsync'
```

As opções de velocidade afetam isso: *Frame Pacing* e *VSync* travam a taxa para manter o timing do jogo correto. Se o jogo estiver a 45 FPS e o áudio estalando, a solução não é mexer no áudio — é baixar a resolução interna ou ativar o *frame skip* leve, até o emulador sustentar os 60 (ou 50, em títulos PAL).

## Resumo

- PCSX2 usa Vulkan por padrão e esse renderizador é o ideal para a GPU AMD do Deck.
- Reservolução interna de 2x–3x equilibra nitidez e desempenho; jogos pesados pedem 2x.
- Imagens `.chd` comprimem sem perda e são o formato certo para economizar SSD.
- Patches de widescreen corrigem a câmera para 16:9 sem distorcer a imagem.
- Áudio estalando é sintoma de FPS abaixo do alvo, e não um problema de áudio em si.

## Exercícios

1. Instale o PCSX2 e configure a BIOS; confirme que a tela de seleção deixa de ficar vazia.
2. Carregue um jogo em `.iso` e outro em `.chd` e compare o tempo de carregamento e o espaço em disco de cada um.
3. Alterne a resolução interna entre 2x e 3x num jogo pesado e anote o FPS exibido em cada caso.
4. Habilite um patch de widescreen num título 4:3 e descreva a diferença visual e o efeito na câmera.
5. **Desafio.** Use o performance overlay para identificar se a queda de FPS de um jogo se deve à CPU (EE/GS) ou à GPU, e justifique qual ajuste — reduzir resolução ou reduzir EE — é o correto para aquele gargalo.
