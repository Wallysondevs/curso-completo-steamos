Um codec (codificador/decodificador) é o algoritmo que comprime o vídeo para que ele caiba no seu enlace e volte a ser imagem na tela. A escolha errada de codec se paga de duas formas: fps mais baixo no host (se o encode pesar na CPU) ou borrões e travadas no cliente (se o decode não acompanhar). No SteamOS e no Steam Remote Play, três codecs dominam o jogo: H.264, HEVC e AV1, cada um com um ponto ótimo diferente.

:::objetivos
- Entender o que um codec de vídeo comprime e por que ele custa hardware
- Comparar H.264, HEVC e AV1 em eficiência, custo e compatibilidade
- Identificar qual codec o hardware do Steam Deck codifica e decodifica por hardware
- Reconhecer quando vale a pena usar um codec em vez de outro
:::

## Por que comprimir custa tão caro

Um frame 1080p sem compressão tem cerca de 1920 × 1080 pixels, cada um com 3 bytes de cor, ou seja, perto de 6 MB por frame. A 60 FPS isso são 360 MB por segundo — quase 3 Gbps, inviável para qualquer rede doméstica. O codec reduz isso duas ordens de grandeza explorando duas ideias.

A primeira é a **redundância espacial**: dentro de um frame, uma região de céu tem milhares de pixels quase idênticos, que não precisam ser descritos um a um. A segunda é a **redundância temporal**: entre um frame e o próximo, quase tudo continua igual; só a diferença muda. O codec envia um frame-chave completo (I-frame) de vez em quando e, entre eles, apenas as deltas (P-frames e B-frames).

O preço é computacional. Encontrar esses padrões exige bilhões de operações por segundo. A CPU consegue, mas a um custo de energia e de frame rate. Por isso o que interessa de verdade é a aceleração por **hardware**: GPU, APU ou um bloco dedicado (ASIC) que faz encode/decode sem roubar a potência do jogo.

## H.264: o coringa universal

O H.264, também chamado AVC (Advanced Video Coding), é o denominador comum do streaming desde os anos 2000. Está em praticamente tudo: toda APU e GPU das últimas gerações decodifica, e a maioria também codifica, por hardware.

A vantagem é compatibilidade total e exigência baixa. O lado negativo é a eficiência: para uma mesma qualidade visual, ele consome mais bitrate que os codecs modernos. Num enlace apertado ou com interferência, o H.264 é o primeiro a mostrar artefatos de compressão — os blocos e o "borrão" nas áreas de movimento rápido.

No Remote Play, o H.264 costuma ser a escolha segura de fallback: funciona em qualquer cliente, de um Raspberry Pi a uma TV antiga. Se o cliente for fraco demais para HEVC/AV1, o H.264 garante que pelo menos a sessão roda, mesmo que com mais bitrate.

## HEVC: metade do bitrate, custo médio

O HEVC, ou H.265, foi desenhado para entregar a mesma qualidade do H.264 gastando aproximadamente **metade do bitrate**. Isso é a diferença entre uma cena movimentada a 60 FPS sair limpa ou cheia de blocos quando o enlace está perto do limite.

O custo é duplo. Primeiro, o **encode por hardware** só existe em GPUs e APUs mais recentes; em hardware antigo, codificar HEVC cai na CPU e derruba o fps do jogo. Segundo, há questão de **licenciamento**: o HEVC tem patentes e históricos de royalties, o que um dia vetou seu suporte nativo em alguns players e navegadores.

No Steam Deck, a APU (baseada em AMD Van Gogh, com arquitetura RDNA 2) possui blocos dedicados para encode e decode de HEVC. Isso faz do HEVC a escolha natural de quem joga com o Deck como host e quer qualidade boa com metade do tráfego do H.264.

:::info
No ecossistema Valve, o suporte a HEVC apareceu como opção do Remote Play e virou destaque em updates do cliente Steam. A regra prática é: se o host **e** o cliente suportam encode/decode por hardware de HEVC, use HEVC; o ganho de qualidade por bit é imediato.
:::

## AV1: eficiência máxima, exigência máxima

O AV1 é o codec mais novo dos três, aberto e livre de royalties, desenhado para superar o HEVC em compressão. Em paridade de bitrate, costuma entregar a melhor qualidade — alguns pontos percentuais de ganho sobre o HEVC em certas cenas.

A pegadinha está no **encode em tempo real**. Codificar AV1 por hardware só existe em GPUs bem recentes (geometria RDNA 3, Ada Lovelace e equivalentes). O Steam Deck, com RDNA 2, **decodifica** AV1 por hardware, mas **não codifica** AV1 com aceleração dedicada — para gerar o fluxo, a máquina ou usa a GPU de forma ineficiente ou despeja o trabalho na CPU, o que é inviável para uma sessão de jogo em tempo real.

Na prática, o AV1 brilha onde o encode é feito uma vez e distribuído por hardware parrudo: streaming de plataformas, arquivamento de vídeo. Para Remote Play ao vivo entre um Deck e outro Deck, ele hoje não é a ferramenta certa.

```terminal
$ vainfo | grep -iE "VAProfileH26|VAProfileHEVC|VAProfileAV1"
      VAProfileH264ConstrainedBaseline: VAEntrypointVLD
      VAProfileH264Main               : VAEntrypointVLD
      VAProfileH264High               : VAEntrypointVLD
      VAProfileHEVCMain               : VAEntrypointVLD
      VAProfileHEVCMain10             : VAEntrypointVLD
      VAProfileAV1Profile0            : VAEntrypointVLD
```

O `vainfo` (do pacote `libva-utils`) lista os perfis suportados pela API de aceleração de vídeo. A coluna `VAEntrypointVLD` indica **decodificação**; se aparecesse `VAEntrypointEncSlice` ao lado de um perfil, seria encode. Repare que o Deck expõe H.264, HEVC e AV1 todos como VLD — ou seja, decodifica os três — mas nenhum com entrada de encode para AV1.

## Decisão na prática

Monte a matriz mental:

| Codec | Eficiência | Encode no Deck | Decode no Deck | Usar quando |
|---|---|---|---|---|
| H.264 | Baixa | Sim | Sim | Cliente fraco ou compatibilidade máxima |
| HEVC | Alta | Sim | Sim | Host e cliente modernos, enlace apertado |
| AV1 | Máxima | Não (hardware) | Sim | Distribuição/plataforma, não Remote Play ao vivo |

:::atencao
Cuidado com a armadilha do "codec mais novo sempre é melhor". Escolher AV1 para Remote Play entre dois Steam Decks joga o encode na CPU, derruba o fps no host e entrega uma sessão pior do que HEVC ou até H.264 fariam. O codec certo é o que o par host/cliente consegue acelera por hardware dos dois lados.
:::

Também pesa o cenário. Num enlace local com cabo e folga de banda, a diferença entre H.264 e HEVC pode ser quase invisível — com 50 Mbps de sobra, ninguém sofre. É quando o enlace aperta (Wi-Fi distante, banda compartilhada, cliente remoto pela internet) que a eficiência do HEVC vira a diferença entre uma imagem decente e uma parede de blocos.

## Verificando o que o cliente enxerga

Para confirmar a cadeia inteira sem abrir o cliente, use `` `vainfo` `` no host para saber o que ele codifica, e repita no cliente para saber o que ele decodifica. Se os dois lados expõem o mesmo perfil, a escolha é segura. Você pode consultar a lista completa de perfis de um codec específico filtrando a saída:

```terminal
$ vainfo | grep -i "h264\|hevc\|av1"
      VAProfileH264ConstrainedBaseline: VAEntrypointVLD
      VAProfileH264Main               : VAEntrypointVLD
      VAProfileH264Main               : VAEntrypointEncSlice
      VAProfileH264High               : VAEntrypointVLD
      VAProfileH264High               : VAEntrypointEncSlice
      VAProfileHEVCMain               : VAEntrypointVLD
      VAProfileHEVCMain               : VAEntrypointEncSlice
      VAProfileHEVCMain10             : VAEntrypointVLD
      VAProfileHEVCMain10             : VAEntrypointEncSlice
      VAProfileAV1Profile0            : VAEntrypointVLD
```

Cada perfil aparece duas vezes quando há encode: uma com `VLD` (decode) e outra com `EncSlice` (encode). H.264 e HEVC exibem as duas entradas, confirmando a aceleração nos dois sentidos; AV1 aparece só como `VLD`, o que fecha o diagnóstico: decode sim, encode não.

```terminal
$ sudo apt install -y vainfo
$ vainfo
libva info: VA-API version 1.20.0
vainfo: Driver version: Mesa Gallium driver 24.0.3 for AMD Radeon Graphics
vainfo: Supported profile and entrypoints
      VAProfileH264Main               : VAEntrypointVLD
      VAProfileH264Main               : VAEntrypointEncSlice
      VAProfileHEVCMain               : VAEntrypointVLD
      VAProfileHEVCMain               : VAEntrypointEncSlice
      VAProfileAV1Profile0            : VAEntrypointVLD
```

A presença de `VAEntrypointEncSlice` para H.264 e HEVC confirma que essa APU **codifica** os dois por hardware, mas só **decodifica** AV1. É exatamente o perfil do Steam Deck. Essa é a evidência concreta por trás da recomendação de usar HEVC como padrão no Remote Play local entre hardware moderno.

## Resumo

- Codec comprime explorando redundância espacial e temporal; o custo é computacional, mitigado por encode/decode em hardware.
- H.264 é universal e barato, mas gasta mais bitrate para a mesma qualidade.
- HEVC entrega qualidade parecida com cerca de metade do bitrate e tem encode por hardware no Steam Deck.
- AV1 é o mais eficiente, mas o Deck decodifica sem codificar por hardware, o que o torna impraticável para Remote Play ao vivo.
- O codec certo é aquele que host e cliente aceleram por hardware nos dois sentidos; confirme com `vainfo`.

## Exercícios

1. Instale o `libva-utils` e rode `vainfo`. Liste quais perfis têm `VAEntrypointEncSlice` (encode) e quais têm só `VAEntrypointVLD` (decode).
2. Usando a saída do exercício 1, determine se a sua máquina codifica AV1 por hardware e justifique se ela seria escolhida como host de Remote Play.
3. Compare H.264 e HEVC no enlace da sua casa: escreva, em uma frase, em que cenário o ganho de metade de bitrate do HEVC realmente importa.
4. Explique, com base no custo de encode, por que um codec mais eficiente pode piorar a sessão se o host não o acelerar por hardware.
5. **Desafio.** Rode `vainfo` no host e no cliente (por SSH, se for o caso). Monte a tabela de suporte dos dois lados e proponha a combinação de codec ideal para uma sessão entre eles, justificando com a interseção de perfis de encode e decode — e relacione com o bitrate que você vai definir na próxima seção.
