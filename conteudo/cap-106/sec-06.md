Parte do que torna o Steam Deck especial é que ele é um console que você pode modificar. Não no sentido de trocar peças (embora isso também seja possível), mas de alterar a interface, o comportamento do sistema e a experiência de uso. Esta seção cobre as três ferramentas que lideram essa categoria: Decky Loader para plugins de interface, EmuDeck para emulação e CryoUtilities para ajustes de desempenho no nível do sistema operacional.

:::objetivos
- Instalar e configurar o Decky Loader com plugins essenciais
- Entender o que o EmuDeck faz e como ele organiza a emulação no Deck
- Conhecer as otimizações do CryoUtilities e quando aplicá-las
- Avaliar o impacto real de cada ferramenta em vez de aplicar tudo cegamente
:::

## Decky Loader: a loja de plugins do Deck

O [Decky Loader](https://deckyloader.org) é a plataforma que injeta plugins na interface Steam do modo de jogo. Ele adiciona um ícone no menu lateral (o "QAM", Quick Access Menu) com acesso a uma loja de plugins mantidos pela comunidade. A instalação é manual — um script de shell — porque o Decky mexe com a interface Steam em runtime, e não é empacotado como Flatpak.

```terminal
$ curl -L https://github.com/SteamDeckHomebrew/decky-loader/raw/main/dist/install_prerelease.sh | sh
```

Depois de reiniciar, o Decky aparece no menu lateral com acesso à loja de plugins. Os mais populares em 2025 incluem:

**PowerTools** — controle fino de clocks de CPU/GPU, número de *threads* ativas e política de governador. Útil para jogos *CPU-bound* que se beneficiam de desligar SMT (hyper-threading). **Animation Changer** — troca a animação de boot. **CSS Loader** — temas visuais para a interface Steam. **ProtonDB Badges** — exibe o rating do ProtonDB diretamente nos cards dos jogos. **SteamGridDB** — troca artes de capa sem sair do modo de jogo. **Fantastic** — tweaks de performance e FSR por jogo.

:::atencao
O Decky Loader modifica a interface Steam injetando código em runtime. Cada atualização do SteamOS pode quebrar plugins. Após um update grande do sistema, espere o Decky ser atualizado antes de reinstalar — a comunidade costuma corrigir em horas, mas correr para instalar no dia do update pode deixar a interface instável.
:::

## EmuDeck: emulação sem dor

O [EmuDeck](https://www.emudeck.com) não é um emulador — é um instalador e configurador de emuladores. Ele detecta seu hardware (Steam Deck LCD ou OLED, resolução nativa), baixa e configura dezenas de emuladores (RetroArch, Dolphin, PCSX2, Yuzu/Ryujinx, Cemu, PPSSPP), cria a estrutura de pastas para ROMs, BIOS e saves e integra tudo com o Steam ROM Manager — gerando atalhos com arte na sua biblioteca Steam.

A instalação é um script que você roda uma vez:

```terminal
$ curl -L https://raw.githubusercontent.com/EmuDeck/emudeck.github.io/main/install.sh | bash
```

O EmuDeck faz três escolhas inteligentes que poupam horas de configuração manual: unifica os diretórios de saves em `~/Emulation/saves`, configura os controles de cada emulador para mapear corretamente no gamepad do Deck e expõe a biblioteca de ROMs na Steam com arte baixada automaticamente. O resultado é que você navega por Super Mario World ao lado de Elden Ring, na mesma interface.

:::dica
Se você tem seus saves de emulador espalhados pelo disco, o EmuDeck consegue migrá-los para a estrutura unificada. A opção aparece no instalador. Mas faça backup antes — a migração automática é confiável na maioria dos casos, mas perder um save de 80 horas de RPG não é risco que valha a pena.
:::

## CryoUtilities: swap, compactação e mais

O [CryoUtilities](https://github.com/CryoByte33/steam-deck-utilities), criado por CryoByte33 (seção 2), é um utilitário de ajustes no nível do sistema. Ele mexe em parâmetros que afetam todos os jogos igualmente: tamanho do arquivo de swap, política de compactação de memória, *swappiness*, *huge pages* e limites de cache.

A recomendação mais conhecida — aumentar o swap de 1 GB para 16 GB e reduzir o swappiness para 1 — foi popularizada por ele e tem como base o fato de que o Steam Deck tem 16 GB de RAM compartilhados entre CPU e GPU. Jogos que tocam o limite de memória podem travar quando o swap padrão é insuficiente.

```terminal
$ sudo systemctl stop cryoutilities
$ sudo systemctl start cryoutilities
$ cat /proc/sys/vm/swappiness
1
```

O programa tem interface gráfica, mas os ajustes que ele faz são parâmetros do kernel, visíveis no `/proc`. A utilidade dele é reunir esses ajustes num só lugar e explicar o trade-off de cada um.

:::perigo
Nem todo ajuste do CryoUtilities é benéfico para todo jogo. Aumentar o swap para 16 GB com swappiness 1 pode melhorar a estabilidade de um jogo que estoura a RAM, mas reduz a velocidade de E/S porque mais páginas são forçadas a permanecer em swap em vez de serem recarregadas do cache de sistema de arquivos. Teste jogo a jogo, como o próprio CryoByte33 recomenda em seus vídeos. Não aplique o "recomendado" cegamente.
:::

## Quando aplicar cada uma

Decky Loader, EmuDeck e CryoUtilities atacam camadas diferentes. O Decky mexe na interface e no controle fino de hardware por jogo; o EmuDeck resolve a emulação de forma integrada; o CryoUtilities toca em parâmetros globais do kernel. Você pode usar os três simultaneamente, mas entenda o que cada um faz para não culpar a ferramenta errada quando algo der problema — especialmente depois de um update do SteamOS que sobrescreva ajustes.

## Resumo

- Decky Loader adiciona uma loja de plugins à interface Steam, acessível no modo de jogo.
- PowerTools, CSS Loader e ProtonDB Badges estão entre os plugins mais úteis do Decky.
- EmuDeck configura e integra dezenas de emuladores, unificando saves e arte na Steam.
- CryoUtilities ajusta swap, swappiness e compactação de memória no nível do kernel.
- Teste cada ajuste individualmente e conheça o trade-off antes de aplicar.

## Exercícios

1. Instale o Decky Loader e adicione dois plugins da loja: ProtonDB Badges e CSS Loader. Aplique um tema visual e observe como a loja Steam agora mostra os ratings do ProtonDB.
2. Instale o EmuDeck, configure a estrutura de pastas e adicione uma ROM de domínio público (ou um homebrew). Execute-a pelo Steam ROM Manager e confirme que o controle responde.
3. Instale o CryoUtilities, anote os valores atuais de swap e swappiness (`swapon --show`, `cat /proc/sys/vm/swappiness`) e compare com os valores recomendados. Aplique os ajustes e meça se um jogo que você conhece bem teve diferença perceptível.
4. Após instalar o Decky, entre no plugin PowerTools e limite as threads da CPU para metade enquanto roda um jogo CPU-bound. O desempenho mudou? O consumo de bateria mudou?
5. **Desafio.** Combine duas ferramentas desta seção: instale um emulador via EmuDeck, importe o ROM para a Steam e use o Decky (PowerTools) para ajustar o perfil de CPU do emulador. Documente se houve diferença na emulação de um jogo que empurra o hardware (PS2, GameCube ou superior).