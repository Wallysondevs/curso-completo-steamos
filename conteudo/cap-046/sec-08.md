O GameCube e o Wii representam, juntos, o auge da emulação prática no Steam Deck: a biblioteca é vasta, o Dolphin é maduro, e a máquina entrega 60 FPS (e até mais, via patches de framerate) com espaço de sobra para upscale. Mas o diabo está nos detalhes — conteúdo em HD do Wii, controles de movimento, periféricos — e é isso que esta seção destrincha.

:::objetivos
- Entender a relação GameCube/Wii e por que um único emulador cobre os dois
- Configurar o Dolphin para resolução interna e upscale no Deck
- Aplicar patches de framerate 60 FPS e cheats sem instabilidade
- Lidar com controles de movimento e periféricos do Wii no formato portátil
- Resolver os problemas comuns de áudio e cache de shaders
:::

## Dois consoles, um mesmo DNA

O Wii é, na prática, um GameCube turbinado: compartilha a arquitetura da CPU (PowerPC "Gekko" evoluído para "Broadway") e da GPU, e o Wii roda jogos de GameCube nativamente, com os mesmos controles e slots de memory card. Esse parentesco é o que permite ao Dolphin emular os dois com um único código-base, trocando apenas o modo.

Isso tem uma consequência prática bonita: aprender a configurar o Dolphin para GameCube te dá o Wii de graça, e vice-versa. As opções de vídeo, áudio e desempenho são as mesmas.

```terminal
$ flatpak install -y flathub org.DolphinEmu.dolphin-emu
$ flatpak run org.DolphinEmu.dolphin-emu --version
Dolphin 2407
```

:::nota
O Dolphin usa uma numeração de versão baseada em data (`2407` = julho de 2024), típica de projetos com releases contínuas. Não se assuste com números "saltitantes": versões novas saem toda semana com correções, e o Flatpak as entrega automaticamente, mantendo sua biblioteca sempre na ponta.
:::

## Resolução interna e o salto de qualidade

A mágica mais visível do Dolphin é o upscale. O GameCube renderizava nativamente em 480p; o Dolphin pode renderizar internamente em 2x, 3x ou 4x essa resolução e reescalar para a tela do Deck, transformando um jogo "borrado" numa imagem quase de remaster.

```terminal
$ flatpak run org.DolphinEmu.dolphin-emu 2>&1 | grep -i -E 'video backend|adapter' | head -3
[Video] Backend: Vulkan
[Video] Adapter: AMD AMD Custom GPU 0405
```

O backend **Vulkan** com a GPU do Deck é o par recomendado, e a resolução interna (em Graphics → General → Internal Resolution) de **2x a 3x** é o ponto ideal: mantém 60 FPS na maioria dos títulos sem empurrar a GPU ao limite. Jogos leves aceitam 3x sem piscar; os mais pesados pedem 2x.

:::dica
O Dolphin permite configurar resolução **por jogo** (botão direito no jogo → Properties), que é superior a mudar o valor global. Assim você deixa 3x para os títulos leves e 2x para os pesados, e o emulador aplica cada um automaticamente ao iniciar. Combinado com a política de [backup e organização de saves](#/cap-046/sec-09), isso vira uma biblioteca realmente personalizada.
:::

## Patches de 60 FPS e o cache de shaders

Muitos jogos de GameCube/Wii foram travados em 30 FPS no hardware original. O Dolphin suporta **patches de framerate** — códigos que destravam os 60 FPS — aplicados por jogo. Nem todos os jogos têm patch estável, e a regra é testar antes de confiar.

O custo oculto de emular essas plataformas é o **cache de shaders**. A GPU do jogo original usa um pipeline que o Deck não reproduz igual, então shaders são recompilados na primeira ocorrência, causando micro-travadas. O Dolphin pode pré-compilar ("Compile Shaders Before Starting" e o modo "Ubershaders"), que elimina as travadas ao custo de um carregamento inicial mais longo.

```terminal
$ du -sh ~/.var/app/org.DolphinEmu.dolphin-emu/config/dolphin-emu/Cache/ 2>/dev/null
172M	~/.var/app/org.DolphinEmu.dolphin-emu/config/dolphin-emu/Cache/
```

Manter esse cache em backup é barato e evita que cada reinstalação te devolva as travadas de compilação. O Dolphin também tem um modo "Ubershaders (hybrid)" que compila em segundo plano enquanto renderiza com um shader universal, trocando a travada por uma queda fina de FPS.

:::atencao
Patches de 60 FPS às vezes quebram a lógica de física ou a temporização de um jogo (cutscenes dessincronizadas, velocidade dobrada). Se um título apresentar comportamento estranho após o patch, desative-o primeiro antes de culpar qualquer outra configuração — o patch é a variável nova mais provável.
:::

## O Wii: movimento e periféricos no formato portátil

Emular o Wii traz uma camada extra: os jogos foram desenhados para o Wii Remote, com apontamento e movimento. No Deck, o analógico direito pode simular o apontar do cursor, e os giroscópios nativos do Deck cobrem parte do movimento — mas o conforto varia muito por jogo.

Para jogos de movimento pesado, você pode parear controles de Wii reais via Bluetooth (usando uma barra de sensor, ou uma vela acesa como truque clássico da comunidade para a luz infravermelho), ou aceitar o mapeamento híbrido. A decisão depende do gênero: um jogo de plataforma que usa só o apontar para menus é tranquilo no analógico; um de movimento puro pede o controle real.

```terminal
$ flatpak run org.DolphinEmu.dolphin-emu 2>&1 | grep -i -E 'wiimote|bluetooth' | head -3
[Core] Wiimote real detected: connecting via Bluetooth...
```

O Dolphin gerencia Wiimotes reais e emulados lado a lado. O mapeamento do Wiimote emulado (analógico como cursor, Deck como nunchuk) se faz no menu de controles, com perfis salvos por jogo.

:::info
O "truque da barra de sensor com velas" existe porque o Wii Remote usa luz infravermelha emitida pela barra para se localizar no espaço. Duas velas acesas separadas pela largura da TV emitem o mesmo infravermelho e substituem a barra. É um hack real, útil quando não há barra disponível — e um bom exemplo de como a emulação preserva até as gambiarras da época.
:::

## Resumo

- O Wii é um GameCube evoluído; o Dolphin emula os dois com um código-base, trocando apenas o modo.
- O backend Vulkan com a GPU do Deck e resolução interna de 2x a 3x é o ponto ideal de upscale.
- A resolução pode ser configurada por jogo (Properties), permitindo 3x nos leves e 2x nos pesados.
- Patches de 60 FPS destravam o framerate, mas podem quebrar física/temporização — teste por jogo.
- O cache de shaders causa micro-travadas iniciais; Ubershaders e pré-compilação as eliminam, e o cache merece backup.
- Jogos de Wii com movimento pedem Wiimote real (Bluetooth + barra de sensor) ou mapeamento híbrido no analógico.

## Exercícios

1. Instale o Dolphin e confirme o backend Vulkan e a GPU no log de execução.
2. Configure resolução interna 2x globalmente e 3x num jogo leve via Properties, registrando o FPS em cada um.
3. Aplique um patch de 60 FPS a um jogo que o suporte e valide que a física/cutscenes seguem corretas.
4. Meça o tamanho do diretório de cache com `du -sh` antes e depois de jogar, e explique por que vale preservá-lo.
5. **Desafio.** Pareie um Wiimote real (ou configure o emulado) num jogo de Wii com movimento e documente a diferença de conforto entre cursor no analógico e apontamento real, ligando com a camada de Steam Input da seção de controles.
