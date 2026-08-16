Se você roda jogos do Windows no SteamOS, já tropeçou no Proton: a camada de compatibilidade que traduz chamadas do Windows para Linux e faz a maioria dos títulos da Steam funcionar no Deck. O Proton oficial que a Valve envia junto com o Steam é excelente, mas tem uma limitação estrutural: ele não pode embarcar certos codecs de mídia cuja distribuição é restrita por patente. É aí que entram o ProtonUp-Qt e o Proton-GE.

O ProtonUp-Qt é uma pequena ferramenta gráfica que faz uma única coisa muito bem: baixar, instalar, atualizar e remover **builds alternativas do Proton**. Entre essas builds, a mais popular de longe é o Proton-GE, mantido pela comunidade em torno do GloriousEggroll. Esta seção prepara o terreno: você vai entender o que cada peça faz antes de instalar qualquer coisa.

:::objetivos
- Entender a diferença entre o Proton oficial da Valve e as builds da comunidade
- Identificar o que o ProtonUp-Qt gerencia e o que ele não gerencia
- Saber onde as builds alternativas ficam instaladas no Deck
- Reconhecer quando uma build GE resolve um problema real
:::

## O Proton oficial e o seu limite

Toda vez que você instala um jogo de Windows no SteamOS e ele roda, há uma versão do Proton trabalhando por baixo. Essa versão aparece em **Propriedades do jogo → Compatibilidade** e também na lista de ferramentas configuráveis nas configurações globais do Steam. A Valve mantém versões numeradas — Proton 8, Proton 9, Proton Experimental — que ela distribui junto com o cliente.

O Proton oficial tem uma característica que pouca gente percebe: ele é construído para ser redistribuível sem problemas jurídicos. Isso significa que a Valve **não inclui** certos componentes de mídia protegidos por patentes de software, como o decodificador de Windows Media Foundation (WMF) usado por muitas cutscenes e codecs de vídeo em jogos. O resultado prático é que alguns jogos abrem, mas as cenas de vídeo ficam pretas, o áudio falha ou o jogo nem inicia.

É um problema real e recorrente. A solução da comunidade foi compilar o Proton novamente, adicionando esses codecs, e publicar o resultado: nasceu o Proton-GE.

## O que é (e o que não é) o Proton-GE

O Proton-GE (a sigla vem de **G**lorious**E**ggroll, o pseudônimo do mantenedor Thomas Crider) é uma recompilação do Proton com uma pilha de patches e extras que a Valve não pode distribuir. Na prática:

- **Traz os codecs patenteados** (WMF e outros) que destravam vídeos em muitos jogos.
- **Aplica correções "bleeding edge"** que ainda não chegaram ao Proton oficial — útil para jogos recém-lançados que quebram no Proton estável.
- **Inclui ferramentas extras**, como versões mais novas do DXVK e do VKD3D-Proton (as camadas que traduzem DirectX para Vulkan).

Duas confusões comuns precisam ficar claras desde já. Primeiro: o Proton-GE **não é um fork** no sentido de "outro projeto paralelo" — ele é o Proton da Valve compilado com extras, e acompanha o upstream de perto. Segundo: ele **não substitui** o Proton oficial automaticamente; você escolhe quando e em qual jogo usá-lo.

:::nota
DXVK traduz Direct3D 9/10/11 para Vulkan, e VKD3D-Proton faz o mesmo para Direct3D 12. Eles são o coração da performance do Proton, e o GE costuma embarcar builds mais recentes deles do que a versão estável da Valve.
:::

## Onde as builds vivem no disco

É importante saber o destino final de tudo o que o ProtonUp-Qt baixa, porque isso te dá independência da ferramenta. Cada build alternativa de Proton é instalada como uma pasta dentro de um diretório específico do Steam:

```terminal
$ ls ~/.steam/steam/compatibilitytools.d/
GE-Proton9-20
GE-Proton9-25
umu-proton-9.0-3.2
```

Cada pasta contém uma versão completa da ferramenta de compatibilidade (o binário do Proton, as bibliotecas, os scripts de integração). O Steam descobre qualquer pasta ali dentro automaticamente: abrindo o menu de compatibilidade, as versões aparecem listadas sem precisar reiniciar nada além do cliente.

Esse detalhe tem duas consequências práticas. A primeira é que o ProtonUp-Qt é "descartável" — ele só organiza o download; depois de instalar, a build vive no diretório acima e funciona mesmo que você apague o ProtonUp-Qt. A segunda é que você pode inspecionar e até remover builds manualmente, embora o ProtonUp-Qt faça isso com mais segurança, como você verá nas próximas seções.

```terminal
$ du -sh ~/.steam/steam/compatibilitytools.d/*
1.1G    GE-Proton9-20
1.2G    GE-Proton9-25
1.1G    umu-proton-9.0-3.2
```

Repare no tamanho: cada versão é pesada, na casa de 1 GB. Isso vai justificar a seção sobre limpeza de versões antigas — ter dez builds acumuladas pode comer mais de 10 GB do SSD do Deck, e o espaço ali é precioso.

## Quando vale a pena usar GE

Nem todo jogo precisa de Proton-GE, e perder isso de vista leva a um Deck cheio de builds que você não usa. O Proton oficial cobre a imensa maioria hoje. A community build vira prioridade em cenas bem específicas:

- Cutscenes e vídeos **pretos ou sem áudio** num jogo que de resto funciona.
- Jogos **muito recentes** que ainda não foram corrigidos no Proton estável.
- Títulos que a própria comunidade já mapeou como "funciona só com GE" — informação que costuma circular em discussões no [ProtonDB](https://www.protondb.com).

O fluxo recomendado é sempre tentar o Proton oficial primeiro e guardar o GE como plano B. Vinte minutos de experimentação resolvem mais do que baixar três versões por impulso. Nas seções seguintes você instala a ferramenta e começa a baixar a primeira build.

## Resumo

- O Proton oficial da Valve não embarca codecs patenteados (WMF e outros), o que quebra vídeos em vários jogos.
- O Proton-GE é uma recompilação do Proton com esses codecs e patches mais recentes, mantida por GloriousEggroll.
- O ProtonUp-Qt baixa, instala, atualiza e remove builds alternativas de Proton; ele não é necessário depois que a build está instalada.
- Builds alternativas ficam em `~/.steam/steam/compatibilitytools.d/`, e o Steam as detecta automaticamente.
- Cada versão GE ocupa cerca de 1 GB, então acumular builds consome espaço valioso do SSD.
- Proton-GE é plano B: tente o Proton oficial primeiro, use GE para vídeos quebrados ou jogos recém-lançados.

## Exercícios

1. Liste o conteúdo de `~/.steam/steam/compatibilitytools.d/` na sua máquina (se a pasta não existir, simplesmente crie-a vazia com `mkdir -p` e observe que ela será usada mais tarde).
2. Na interface do Steam, abra **Propriedades** de qualquer jogo → **Compatibilidade** e identifique qual versão do Proton está selecionada. Descreva o que significa "usar a versão padrão" nesse menu.
3. Consulte o ProtonDB de um jogo seu que enfrente problemas com vídeo e verifique se a comunidade recomenda Proton-GE para ele.
4. Explique, com suas palavras, por que a Valve não pode simplesmente "copiar" os codecs que o GE usa — qual é a diferença jurídica entre os dois projetos?
5. **Desafio.** Estime quanto espaço as builds atuais do seu Deck ocupam somando via `du -sh ~/.steam/steam/compatibilitytools.d/*`. Depois, responda: esse espaço ficaria livre se você desinstalasse o ProtonUp-Qt? Justifique com base no que aprendeu sobre onde as builds vivem.
