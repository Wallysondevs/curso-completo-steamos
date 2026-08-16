Você já tem uma biblioteca detectada e sabe medir desempenho. Agora vem a pergunta que divide a comunidade: usar o RetroArch para tudo, ou instalar os emuladores "standalone" para as plataformas em que eles são superiores? A resposta não é dogmática — é uma decisão por plataforma, guiada por maturidade, precisão e recursos específicos. Esta seção te dá os critérios para escolher bem.

:::objetivos
- Comparar RetroArch e emuladores standalone em maturidade, recursos e precisão
- Decidir por plataforma qual abordagem adotar no Deck
- Entender por que Dolphin, PCSX2 e RPCS3 costumam vencer como standalone
- Identificar onde os cores do RetroArch ainda são a melhor escolha
- Conviver com as duas abordagens dentro de um mesmo fluxo de trabalho
:::

## O trade-off central: integração versus especialização

O RetroArch vende **uniformidade**: um único menu, uma única configuração, save states e filtros idênticos para dezenas de consoles. Um emulador standalone vende **profundidade**: menus e opções desenhados especificamente para aquele hardware, com recursos que o core genérico nem sempre expõe.

O custo da uniformidade é a indireção. O core do RetroArch é uma adaptação do código original do emulador para a API libretro, e essa adaptação nem sempre acompanha no mesmo ritmo o projeto upstream. O custo da especialização é a fragmentação: cada standalone tem seu próprio menu de configuração, seus próprios atalhos e suas próprias pastas, e a experiência deixa de ser coesa.

:::nota
"Maturidade" de um core não depende só da idade do projeto, e sim de quão ativamente o core libretro é mantido em relação ao emulador standalone correspondente. Um core pode existir há anos e ainda assim estar atrás do upstream em correções e recursos. Por isso a escolha precisa ser revista por plataforma, não decidida uma vez para sempre.
:::

## Onde o RetroArch vence sem discussão

Para as plataformas de 8 e 16 bits e para a maioria das de 5ª geração, o RetroArch é a escolha natural, e há motivos objetivos para isso. Primeiro, esses consoles têm hardware simples o suficiente para que os cores alcancem precisão total; segundo, a experiência unificada de save states, run-ahead, filtros e o menu de rede (netplay para multiplayer) brilha exatamente nessa faixa em que o desempenho sobra.

```terminal
$ flatpak run org.libretro.RetroArch --menu 2>&1 | grep -i core | head -5
[INFO] [Core]: Loading dynamic libretro core from: "/home/deck/.var/app/org.libretro.RetroArch/config/retroarch/cores/snes9x_libretro.so"
[INFO] [Core]: Version of libretro API: 1
[INFO] [Core]: Compiled against API: 1
```

A saída mostra como um core é uma biblioteca dinâmica (`snes9x_libretro.so`) carregada em runtime. Para essa faixa de plataformas, o core é tão bom quanto o emulador standalone de origem — o `snes9x` standalone e o `snes9x_libretro` vêm do mesmo código-base.

Para confirmar que os cores estão instalados e prontos, um simples `find` dentro do diretório do Flatpak lista tudo o que está disponível:

```terminal
$ find ~/.var/app/org.libretro.RetroArch/config/retroarch/cores/ -name '*.so' 2>/dev/null | sort
.../cores/bsnes_libretro.so
.../cores/fbneo_libretro.so
.../cores/gambatte_libretro.so
.../cores/genesis_plus_gx_libretro.so
.../cores/mesen_libretro.so
.../cores/mgba_libretro.so
.../cores/mupen64plus_next_libretro.so
.../cores/snes9x_libretro.so
.../cores/swanstation_libretro.so
```

Cada `.so` é um console diferente, mas todos são carregados pelo mesmo executável. É por isso que no RetroArch você troca de SNES para GBA sem fechar o programa — o front-end descarrega um core e carrega outro, mantendo a sessão viva.

:::dica
Use o RetroArch para toda a faixa de 8/16 bits e para PS1 (core `beetle-psx` ou `swanstation`), GBA (`mGBA`) e arcade (`FinalBurn Neo`, `MAME`). Nesses casos, a uniformidade de configuração e o netplay valem mais que qualquer recurso que um standalone teria.
:::

## Por que os standalone vencem nas plataformas pesadas

Na 6ª geração em diante, a balança pende para o standalone por um motivo prático: os projetos líderes — Dolphin (GameCube/Wii), PCSX2 (PS2), RPCS3 (PS3), Cemu (Wii U) — são programas grandes, em desenvolvimento ativo, com interfaces gráficas próprias que expõem opções de compatibilidade por jogo que um core genérico não consegue.

O Dolphin é o exemplo canônico. Ele mantém um banco de compatibilidade por título, permite configurar "game INIs" (arquivos de ajuste por jogo) e parâmetros de upscale, e recebe correções semanais. O core libretro do Dolphin existe, mas não é o caminho recomendado pelos próprios desenvolvedores do emulador.

```terminal
$ flatpak list | grep -i -E 'dolphin|pcsx2|rpcs3|cemu'
Dolphin Emulator	org.DolphinEmu.dolphin-emu	system	flathub
PCSX2	net.pcsx2.PCSX2	system	flathub
RPCS3	net.rpcs3.RPCS3	system	flathub
```

Instalar os standalone como Flatpaks separados dá a cada um seu sandbox, suas pastas e suas atualizações. A desvantagem de fragmentação é real, mas é mitigada pelo EmuDeck, que os instala e configura em lote e os publica no Steam Rom Manager como atalhos com arte — você nem percebe que são programas diferentes.

:::atencao
Não tente forçar um jogo de PS2 no core do RetroArch "para ter tudo em um lugar só" se ele rodar melhor no PCSX2 standalone. A pergunta correta é "qual implementação roda este jogo melhor hoje", não "qual aplicativo já está aberto". Compatibilidade por jogo é um alvo móvel; verifique o wiki de compatibilidade do emulador antes de apostar em uma rota.
:::

## Uma decisão por plataforma, na prática

A tabela a seguir resume a escolha recomendada no Deck para as plataformas mais comuns. Ela não é lei — é o ponto de partida da comunidade emuladora, validado em volume.

| Plataforma | Abordagem recomendada | Emulador / core |
|---|---|---|
| NES, SNES, Mega Drive, GB/GBC/GBA | RetroArch | `mesen`, `snes9x`/`bsnes`, `genesis_plus_gx`, `mGBA` |
| PS1 | RetroArch | `swanstation` (ou `beetle-psx`) |
| N64, Saturn | RetroArch ou standalone | `mupen64plus` / `parallel-n64`; Saturn: `beetle-saturn` |
| GameCube / Wii | Standalone | Dolphin |
| PS2 | Standalone | PCSX2 |
| PS3 | Standalone | RPCS3 |
| Wii U | Standalone | Cemu |
| Arcade | RetroArch | `fbneo`, `mame` |

Repare que a fronteira não é exata: N64 e Saturn ficam no meio, e a escolha ali depende mais do jogo e do quão confortável você está com cada interface do que de uma régua técnica rígida.

:::info
A conveniência de ter tudo no RetroArch tem um limite suave: quando o core fica meses atrás do standalone em correções críticas para um jogo específico, a uniformidade deixa de compensar. A regra de bolso da comunidade é: **até PS1, RetroArch; de GameCube em diante, standalone; N64/Saturn, tanto faz — teste os dois.**
:::

## Resumo

- RetroArch oferece uniformidade (um menu, uma config); standalone oferece profundidade e recursos específicos do hardware.
- A maturidade de um core depende de quão ativamente ele acompanha o emulador upstream, não da idade do projeto.
- Até a 5ª geração (e arcade), os cores do RetroArch são a escolha natural e suficientes em precisão.
- De GameCube em diante, Dolphin, PCSX2, RPCS3 e Cemu standalone vencem por compatibilidade por jogo e interface própria.
- O EmuDeck mitiga a fragmentação dos standalone, instalando-os em lote e publicando-os com arte no Steam Rom Manager.
- A decisão é por plataforma (e às vezes por jogo), revisada contra os wikis de compatibilidade dos emuladores.

## Exercícios

1. Liste com `flatpak list` quais emuladores standalone você tem instalados e classifique-os pela geração que emulam.
2. Para a plataforma PS1, compare em texto as opções de core (`swanstation` vs `beetle-psx`) e escolha uma justificando.
3. Abra o wiki de compatibilidade do Dolphin e anote a classificação de três títulos que você pretende jogar.
4. Rode o mesmo jogo de N64 no core do RetroArch e, se possível, num standalone, registrando qual teve melhor FPS no seu Deck.
5. **Desafio.** Escreva uma "política de emulação" pessoal em uma linha por plataforma (qual abordagem e por quê), relacionando cada escolha com o mapa de faixas de geração da seção anterior.
