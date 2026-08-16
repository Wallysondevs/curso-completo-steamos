Editar vídeo parece uma tarefa pesada demais para um PC portátil, mas o Kdenlive — o editor de vídeo não-linear da comunidade KDE — surpreende no Steam Deck. Ele combina a interface franca dos editores profissionais (linha do tempo, múltiplas faixas, transições, efeitos) com um recurso essencial para hardware modesto: arquivos proxy. Gravar clipes no Deck e montá-los no próprio Deck, com dock e monitor externo, é um fluxo real e produtivo.

:::objetivos
- Instalar o Kdenlive e entender o conceito de edição não-linear por faixas
- Importar mídia, cortar clipes e montar uma sequência na linha do tempo
- Aplicar transições, títulos e exportar para distribuição
- Configurar arquivos proxy para editar vídeos pesados na APU
:::

## Instalação e fluxo não-linear

O Kdenlive está no Flathub e é mantido pelo time do KDE:

```terminal
$ flatpak install flathub org.kde.kdenlive
Looking for matches…
org.kde.kdenlive/x86_64/stable       24.08.1   flathub
Proceed with these changes to the system? [Y/n]: y
Installation complete.
```

Um editor não-linear significa que você trabalha com **clipes** (pedaços de vídeo) organizados numa **linha do tempo** (timeline), sem alterar os arquivos originais. Cada faixa (`V1`, `V2` para vídeo; `A1`, `A2` para áudio) empilha clipes; o que estiver numa faixa superior cobre o que está nas faixas inferiores. É o mesmo paradigma do Premiere, do Final Cut e do DaVinci Resolve.

A interface do Kdenlive tem três zonas principais: **Project Bin** (biblioteca de mídia, à esquerda), **Monitores** (visualização do clipe e do resultado, à direita) e **Timeline** (embaixo). No modo portátil, a tela fica apertada; com dock + monitor externo em 1080p, é confortável.

## Importando e cortando clipes

O fluxo básico de qualquer edição:

1. **Importe a mídia:** Arraste arquivos de vídeo para o Project Bin ou use `[[Ctrl+I]]`. O Kdenlive aceita MP4, MKV, MOV, WebM e praticamente qualquer formato que o FFmpeg entenda.
2. **Crie a sequência:** Arraste um clipe do Bin para a timeline. O Kdenlive pergunta se quer criar um projeto com as configurações do clipe — aceite.
3. **Corte:** Posicione a cabeça de leitura (playhead) onde quiser cortar e pressione `[[S]]` (split). O clipe se divide em dois; selecione e delete as partes indesejadas.

```terminal
$ ls -lh clipes/
total 2.3G
-rw-r--r-- 1 deck deck 820M Mar 15 10:01 cena-01.mp4
-rw-r--r-- 1 deck deck 740M Mar 15 10:05 cena-02.mp4
-rw-r--r-- 1 deck deck 810M Mar 15 10:12 cena-03.mp4
```

Vídeos gravados no Deck (OBS, Spectacle ou o modo de gravação da Steam) têm alta taxa de bits e resolução 1280×800 ou 1920×1080. Para a edição fluir, esses arquivos grandes são exatamente o caso de uso dos proxies.

:::dica
Para mover um clipe na timeline sem criar buracos: arraste com o mouse. Para aparar a ponta de um clipe (trim), passe o mouse sobre a borda dele até o cursor virar uma seta dupla e arraste. Para zoom na timeline, use `[[Ctrl+Scroll]]`.
:::

## Transições, títulos e efeitos

**Transições** suavizam a mudança entre dois clipes. Arraste o clipe de cima ligeiramente sobre o de baixo na faixa `V2` — a sobreposição cria a área da transição. Clique nela e escolha "Dissolve" (fade) no painel de propriedades. O fade é a transição mais usada e a mais barata em processamento.

**Títulos** adicionam texto (título do vídeo, créditos, legendas). Vá em Project → Add Title Clip (`[[Ctrl+T]]`). O editor de títulos abre com fontes, cores e animações. Escreva, feche e arraste o clipe de título para a faixa `V2`, acima do vídeo.

**Efeitos** vão no painel Effect/Composition (lista à esquerda da timeline). Os essenciais: "Fade in/out" (para áudio), "Crop" (recorte), "Speed" (acelera/desacelera), "Volume" (ajuste de áudio) e "Color Correction" (correção de cor). Arraste o efeito para o clipe e ajuste os parâmetros no painel de propriedades.

:::atencao
Aplique efeitos pesados (estabilização, redução de ruído, chroma key) com parcimônia no Deck. Cada efeito exige reprocessamento do quadro, e a APU lida com uma quantidade limitada de efeitos em tempo real. Se a pré-visualização começar a travar, use o botão "Preview" na timeline ou desative temporariamente os efeitos (ícone de olho no clipe).
:::

## Arquivos proxy: a chave para editar pesado no Deck

O segredo para editar vídeos 1080p ou 4K na APU do Deck são os **proxies** — cópias de baixa resolução que o Kdenlive usa durante a edição e substitui pelos originais na hora de exportar.

Configure em Project → Project Settings → Proxy Clips:

```terminal
$ # No menu Project Settings → Proxy Clips:
# Encoding profile:  H.264
# Resolution:        640
# Generate proxies for videos larger than: 1280 px
```

Com isso, o Kdenlive gera automaticamente proxies de 640 pixels para clipes maiores que 1280 px. A geração leva alguns minutos (ela usa o FFmpeg em segundo plano, aproveitando os múltiplos núcleos), mas depois a edição flui suave — você edita os proxies leves e o export usa os originais em alta qualidade.

:::info
O Kdenlive usa MLT e FFmpeg por baixo dos panos. A aceleração por hardware na APU do Deck acontece via VA-API, que o Kdenlive usa automaticamente para decodificar H.264 em tempo real. Isso é o que torna a pré-visualização fluida mesmo sem proxies para clipes leves.
:::

## Exportando o resultado

Quando a edição estiver pronta, exporte com Project → Render (`[[Ctrl+Return]]`). Escolha o perfil na aba "Presets":

- **Web / Social media:** MP4 H.264, resolução igual à da sequência. Ideal para YouTube, Instagram, Twitter.
- **Universal:** MP4 H.264 com AAC, o formato mais compatível.
- **Lossless:** formato sem perdas (FFV1 ou ProRes em contêiner MOV), para arquivamento ou pós-processamento posterior.

```terminal
$ kdenlive_render --help 2>/dev/null | head -3
```

O export de um vídeo de 5 minutos a 1080p leva de 3 a 8 minutos no Deck, dependendo da complexidade e dos efeitos. Durante o render, o uso da CPU chega perto de 100% nos quatro núcleos — deixe o Deck no dock, ventilado e conectado à energia para evitar throttling térmico.

## Resumo

- O Kdenlive é um editor de vídeo não-linear por faixas, instalado com `flatpak install flathub org.kde.kdenlive`.
- O fluxo básico é importar, cortar com `[[S]]`, montar na timeline e exportar com `[[Ctrl+Return]]`.
- Transições (fade), títulos (`[[Ctrl+T]]`) e efeitos são arrastados para os clipes na timeline.
- Arquivos proxy (resolução ~640 px) permitem editar vídeos 1080p/4K fluidamente na APU do Deck.
- A exportação usa os originais em alta qualidade; vídeos de 5 min levam alguns minutos para renderizar no Deck.

## Exercícios

1. Instale o Kdenlive e grave (ou baixe) três clipes de vídeo. Importe-os para o Project Bin e monte uma sequência com cortes em `[[S]]`.
2. Adicione uma transição "Dissolve" entre dois clipes sobrepostos na faixa `V2`. Varie a duração do fade e veja o efeito na pré-visualização.
3. Crie um título com `[[Ctrl+T]]`, escreva "Introdução" e posicione-o sobre o primeiro clipe. Ajuste fonte e cor.
4. Ative os proxies em Project Settings → Proxy Clips e configure a resolução para 640. O Kdenlive gerou os proxies? A edição ficou mais fluida?
5. **Desafio.** Exporte o projeto em dois perfis: H.264 1080p e 720p. Compare os tamanhos com `ls -lh` e os tempos de render. Depois, integre uma captura de tela feita com o Spectacle (seção 7) como clipe de abertura do vídeo.