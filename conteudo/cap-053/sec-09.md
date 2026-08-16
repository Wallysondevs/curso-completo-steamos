O Switch é apenas um dos consoles modernos que o Steam Deck emula com maestria. 3DS, Wii U, PlayStation Vita e até PlayStation 3 rodam na mesma APU, cada um com seu emulador e suas peculiaridades de configuração. Esta seção expande o que você aprendeu com Yuzu/Ryujinx para um ecossistema completo de emulação moderna no Deck.

:::objetivos
- Conhecer os emuladores modernos além do Switch (Citra, Cemu, Vita3K, RPCS3, Dolphin)
- Entender o estado de maturidade de cada plataforma emulada
- Configurar os emuladores mais relevantes no SteamOS
- Reaproveitar padrões de configuração aprendidos com Yuzu/Ryujinx
:::

## O panorama dos consoles modernos

A emulação moderna abrange dezenas de sistemas, mas alguns emuladores se destacam pela maturidade e pela sinergia com o hardware do Deck.

| Emulador | Plataforma | Estado no Deck | Destaques |
|---|---|---|---|
| **Citra** (forks) | Nintendo 3DS | Excelente, descontinuado mas aforkado | Upscaling 3x–6x, ambos os screens |
| **Cemu** | Nintendo Wii U | Excelente, 60 FPS estável | Vulkan maduro, graphic packs, BOTW a 60 FPS |
| **Vita3K** | PlayStation Vita | Bom, em evolução | Compatibilidade crescente |
| **RPCS3** | PlayStation 3 | Variável, CPU-intensivo | Exige os 8 threads do Deck |
| **Dolphin** | GameCube / Wii | Referência absoluta | Emulação perfeita, 4K nativo |
| **Xemu** / **Cxbx-Reloaded** | Xbox / Xbox 360 | Bom / em evolução | Depende de BIOS original |

O Dolphin, em particular, é o padrão-ouro que serve de referência para entender o que "emulação madura" significa — mas ele já foi bem coberto em outras partes do curso. O foco aqui são os emuladores de consoles lançados a partir de 2004, cujos padrões de configuração se assemelham aos do Switch.

## Citra e a tela dupla do 3DS

O 3DS tem duas telas, e o emulador precisa renderizá-las em uma única tela do Deck. O Citra oferece modos de exibição: tela grande em cima com a inferior pequena (padrão), lado a lado, ou a tela inferior escondida até você tocar um botão.

```terminal
$ flatpak install flathub org.citra_emu.citra
$ flatpak run org.citra_emu.citra
```

A configuração central fica em **Emulation → Configure → Graphics**, onde você escolhe o layout das telas e a resolução interna (2x a 6x, dado que o painel do 3DS tem apenas 240p — o upscaling transforma a imagem).

Diferente do Switch, o 3DS não exige firmware completo, mas precisa das chaves `aes_keys.txt` para descriptografar ROMs (extraídas do seu 3DS desbloqueado). O processo é análogo ao do Switch: dump legal do seu console, sem downloads de terceiros.

:::dica
Para jogos de 3DS que usam a tela inferior continuamente (inventário, mapa), mapeie um dos touchpads do Deck para controlar o touchscreen da tela inferior. O Citra converte o touchpad em toque.
:::

## Cemu e a potência do Wii U

O Cemu emula o Wii U com desempenho excepcional no Deck, especialmente em Vulkan. É a opção preferida para *The Legend of Zelda: Breath of the Wild* e *Twilight Princess HD* a 60 FPS, graças aos graphic packs da comunidade que destravam o frame rate e aplicam melhorias visuais.

```terminal
$ flatpak install flathub info.cemu.Cemu
$ flatpak run info.cemu.Cemu
```

Recursos que o Cemu oferece e o Yuzu também tem — o que valida os padrões desta parte do curso:
- **Graphic packs** (análogos aos mods do Yuzu): resolução, desbloqueio de FPS, qualidade
- **Async shader compilation** (idêntico ao async shader building do Yuzu)
- **Vulkan vs OpenGL** como backend, com Vulkan preferível no Deck

O Wii U usa arquivos WUX, RPX ou formatos de "loadline" (estrutura de pastas com `code/app.xml`). Assim como no Switch, você precisa de keys — nesse caso, os `otp.bin` e `seeprom.bin` do seu Wii U, extraídos via homebrew.

## Vita3K: a Vita no Deck

O Vita3K é mais jovem e menos maduro que o Cemu, mas evolui rápido. Ele exige firmware e certos módulos do seu PlayStation Vita, mas a instalação no Deck segue o mesmo fluxo flatpak.

```terminal
$ flatpak install flathub org.vita3k.Vita3K
$ flatpak run org.vita3k.Vita3K
```

A configuração gráfica tem menos opções que o Yuzu, mas o padrão Vulkan + upscaling se aplica. Jogos 2D e indies da Vita rodam a 60 FPS com folga; títulos 3D pesados variam.

:::nota
O Vita3K não usa "keys" no sentido do Switch; ele precisa do firmware (arquivos `os0`/`vs0`) extraídos do console, o que também exige uma Vita desbloqueada com henkaku. O princípio legal é o mesmo: dump do hardware que você possui.
:::

## RPCS3 e o limite da CPU

O RPCS3 (PS3) é o caso mais exigente: a arquitetura Cell do PS3, com 1 PPE + 7 SPEs, torna a emulação pesada em CPU. O Deck roda títulos leves e médios bem, mas jogos AAA de PS3 raramente atingem 60 FPS — espere 30 FPS em títulos otimizados.

```terminal
$ flatpak install flathub net.rpcs3.RPCS3
$ flatpak run net.rpcs3.RPCS3
```

O RPCS3 precisa do firmware do PS3 (o "PS3UPDAT.PUP" oficial da Sony, legalmente distribuído). Diferente do Switch, não há "keys" a extrair — o firmware é baixado da própria Sony e instalado no emulador. Isso o torna, paradoxalmente, o emulador moderno de mais simples preparação legal.

A configuração de CPU (SPU/PPU threads) é onde o Deck mostra seus 8 threads. O padrão do RPCS3 já aloca bem, mas em jogos pesados você pode ajustar **SPU Decoder** e **Preferred SPU Threads**.

## Reaproveitando o que você aprendeu

Todo o conhecimento das seções anteriores transfere-se quase 1:1 para esses emuladores:
- **Backend Vulkan primeiro** vale para Cemu, Citra, Vita3K e RPCS3 igualmente.
- **Perfis por jogo, mods, cache de shaders e MangoHud para diagnóstico** são padrões universais.
- **A regra legal** (dump do seu console) aplica-se a todos, com exceção parcial do RPCS3 (firmware distribuído pela própria Sony).

```terminal
$ # Um comando para ver todos os emuladores flatpak instalados
$ flatpak list | grep -iE 'citra|cemu|vita3k|rpcs3|dolphin|yuzu|ryujinx'
Citra       org.citra_emu.citra        2004      flathub  user
Cemu        info.cemu.Cemu             2.0       flathub  user
RPCS3       net.rpcs3.RPCS3            0.0.32    flathub  user
```

## Resumo

- Citra, Cemu, Vita3K, RPCS3 e Dolphin expandem a emulação do Deck para todo o console gaming moderno.
- Cemu é a referência de desempenho em Vulkan, com graphic packs análogos aos mods do Yuzu.
- Citra (3DS) e Vita3K (Vita) exigem firmware/keys extraídos de console próprio, como o Switch.
- RPCS3 (PS3) é CPU-intensivo e limita-se a títulos leves/médios no Deck, mas usa firmware distribuído pela Sony.
- Os padrões de configuração aprendidos com Yuzu/Ryujinx (Vulkan, perfis, shaders, MangoHud) transferem-se integralmente.

## Exercícios

1. Instale o Cemu via Flatpak e rode um jogo de Wii U em Vulkan, anotando o FPS com MangoHud.
2. Configure o layout de tela dupla no Citra para um jogo que usa a tela inferior frequentemente (ex.: *Animal Crossing*).
3. Extraia o firmware da sua Vita e instale no Vita3K, verificando a versão detectada.
4. Teste o RPCS3 com um jogo leve (ex.: *Persona 4 Arena*) e depois com um pesado (ex.: *The Last of Us*), comparando o FPS.
5. **Desafio.** Crie um único perfil no EmulationStation DE (ou no Steam ROM Manager) que reúna jogos de 3DS, Wii U, Vita e Switch com a arte de capa correta, e valide que cada sistema inicializa no emulador certo com as configurações por jogo que você já definiu.