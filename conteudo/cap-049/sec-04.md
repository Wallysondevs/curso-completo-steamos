O Dolphin é, disparado, o emulador mais polido desta lista: roda GameCube e Wii com precisão altíssima, recursos que os consoles originais nunca tiveram e uma comunidade ativa há quase duas décadas. No Steam Deck ele se destaca por aceitar resolução interna generosa e por entregar 60 FPS na imensa maioria dos títulos sem esforço. A parte que exige atenção não é desempenho, e sim o mapeamento dos dois controles diferentes — o do GameCube e o do Wii — num único hardware.

:::objetivos
- Configurar o Dolphin para GameCube e Wii no Steam Deck
- Escolher o backend gráfico e a resolução interna adequados
- Mapear o controle do GameCube e os controles de movimento do Wii
- Usar texturas de alta resolução e recursos de precisão
- Aproveitar saves e o netplay em cenários reais
:::

## Primeira execução e backend gráfico

O Dolphin instala via Flatpak e abre direto na lista de jogos, desde que você adicione as pastas de ROMs. Os jogos de GameCube/Wii são normalmente imagens `.iso`, `.gcm` ou `.rvz` — este último é o formato comprimido recomendado que o processa sem perda e economiza espaço significativo (um ISO de Wii de 4,7 GB pode virar 1 GB sem perda de qualidade). Para converter um `.iso` existente:

```terminal
$ flatpak run org.DolphinEmu.dolphin-emu --convert
[File] Convert ISO to RVZ: 4.7 GB → 1.3 GB, lossless
```

Em *Graphics → General*, o backend a escolher no Deck é **Vulkan** (ou OpenGL como alternativa estável, útil quando o Vulkan apresenta artefatos em drivers beta). O Dolphin não pede BIOS — é o mais "bota-e-roda" dos emuladores desta lista, o que explica sua popularidade. A resolução interna pode ir mais alto do que no PCSX2 porque o hardware original é mais simples: **3x** é seguro para quase tudo e já deixa a imagem nítida na tela de 800p.

| Ajuste | Valor recomendado |
|---|---|
| Backend | Vulkan |
| Internal Resolution | 3x (ou 4x para Wii simples) |
| Aspect Ratio | Auto |
| Anti-Aliasing | MSAA 2x (opcional) |

## Dois consoles, dois controles

O GameCube e o Wii são radicalmente diferentes no controle, e o Dolphin mapeia cada um separadamente. No Steam Deck, o controle do GameCube casa bem com o layout físico: o botão A grande vira o A do Steam Deck (que emula um controle Xbox), e o stick C vira o analógico direito. Os gatilhos analógicos do GameCube — que no console real tinham curso físico — são traduzidos para os triggers do Deck, que também são analógicos.

```terminal
$ flatpak run org.DolphinEmu.dolphin-emu
[Input] GameCube controller 1 configured as "Steam Deck"

[... 7 linhas omitidas ...]
[Input] Wii Remote 1 configured via Bluetooth passthrough
```

No modo GameCube, o mapeamento é direto e raramente exige ajuste. O Dolphin reconhece o controle do Deck como um *Standard Controller* e preenche os botões corretos.

Para o Wii, a questão é o *pointer* (apontador) e o *motion* (movimento). O apontador você resolve com o touchpad direito do Deck, que vira um mouse embutido com sensibilidade ajustável; o giroscópio do Deck também pode ser lido como sensor de movimento, e o Dolphin expõe essa opção em *Motion Simulation* — mapeie o acelerômetro do Deck para o do Wii Remote.

:::dica
No Dolphin, os controles de Wii são configurados em *Controllers → Emulate the Wii's Bluetooth adapter*, criando um "Wii Remote emulado". Marque *Sideways Wii Remote* para os jogos que usam o controle de lado (como *WarioWare*) e *Upright* para os demais. A alternativa é o *Bluetooth passthrough*: com um Wii Remote real pareado ao Deck, o Dolphin fala com ele diretamente, e o e movimento reproduzem o comportamento exato do console.
:::

## Texturas de alta resolução e gecko

O recurso que mais transforma jogos antigos é o *custom texture* (pacotes de textura redesenhadas pela comunidade). Você baixa um pacote `.zip`/`.dds`, habilita em *Graphics → Advanced → Load Custom Textures* e o Dolphin troca as texturas originais pelas de alta resolução na memória, sem mexer no jogo.

```terminal
$ ls ~/.var/app/org.DolphinEmu.dolphin-emu/data/dolphin-emu/Load/Textures/
GZLE01/
```

A pasta `Load/Textures` guarda os pacotes, organizados pelo ID de cada jogo (`GZLE01` é o identificador de um título de GameCube). Além das texturas, o Dolphin suporta códigos **Gecko** (o equivalente a cheats/patches, aplicados por um sistema de códigos hexadecimais) e o **AR codes**, para desde correções de bugs até desbloqueio de conteúdo.

## Saves e netplay

Dois recursos fecham o ciclo de uso: a gestão de saves e o jogo em rede. Os saves ficam na pasta de dados do Flatpak e são compatíveis com os formatos do console original, o que permite migrar entre Deck e GameCube físico com o `GCI Folder`.

```terminal
$ ls ~/.var/app/org.DolphinEmu.dolphin-emu/data/dolphin-emu/Wii/title/
```

O *netplay* usa as funcionalidades do Dolphin para sincronizar dois emuladores rodando o mesmo jogo, com todos os jogadores usando o mesmo ISO e a mesma build — requisito obrigatório para não dessincronizar.

:::atencao
Netplay exige **builds idênticas** nos dois lados. Se um jogador está numa versão mais nova do Dolphin que o outro, a sessão dessincroniza silenciosamente minutos depois. Confirme a versão dos dois antes de começar.
:::

## Resumo

- Dolphin cobre GameCube e Wii com precisão e aceita resolução interna alta sem perda de FPS.
- Backend Vulkan e resolução 3x são a configuração-padrão confortável no Deck.
- GameCube é mapeado direto no layout; o Wii exige configurar apontador (touchpad) e movimento (giroscópio).
- Pacotes de textura customizada e códigos Gecko elevam o visual e corrigem bugs sem alterar o jogo.
- Saves usam o formato do console original, o que permite migração; netplay exige builds idênticas.

## Exercícios

1. Adicione sua pasta de ROMs ao Dolphin e confirme que os jogos aparecem na lista com capas.
2. Mapeie o controle do GameCube e teste num jogo de plataforma; depois mapeie o Wii Remote emulado e teste num jogo de apontador.
3. Baixe um pacote de textura customizada, coloque em `Load/Textures` e compare o jogo com o recurso ligado e desligado.
4. Altere a resolução interna entre 2x e 4x e observe o impacto no FPS de um jogo de Wii.
5. **Desafio.** Crie um save no formato `GCI Folder` e explique, com base no que você viu sobre o boot em seções anteriores, por que esse formato (e não um `.sav` genérico) permite que o save volte para um GameCube físico.
