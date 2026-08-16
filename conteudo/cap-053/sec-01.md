O Steam Deck não é apenas um console de PC gaming — é um emulador portátil excepcional. Sua APU AMD com arquitetura x86-64 permite rodar emuladores de Nintendo Switch com desempenho que rivaliza ou até supera o hardware original em títulos bem otimizados. Antes de mergulhar na instalação, é essencial entender o que cada emulador oferece, o que a lei diz e por que o Deck é a plataforma ideal para esse tipo de emulação.

:::objetivos
- Entender o estado atual da emulação de Nintendo Switch com Yuzu e Ryujinx
- Diferenciar as abordagens e os pontos fortes de cada emulador
- Conhecer as implicações legais de firmware, keys e ROMs
- Avaliar a viabilidade de cada categoria de jogo no Steam Deck
:::

## Dois emuladores, duas filosofias

A emulação de Nintendo Switch no PC gira em torno de dois projetos principais: Yuzu e Ryujinx. Ambos são emuladores de código aberto escritos em C++, ambos exigem firmware e chaves criptográficas extraídas de um console real, e ambos alcançam compatibilidade excelente com a maioria do catálogo comercial. As diferenças estão na abordagem.

**Yuzu** focou desde o início em desempenho e em recursos de conveniência. Tem suporte nativo a Vulkan, upscaling por FSR, filtros de pós-processamento, Discord Rich Presence e uma interface otimizada para gamepads. Sua base de código prioriza a experiência de "clicou, rodou", com early-access de builds pagos que depois se tornavam públicos. O projeto principal foi descontinuado em março de 2024 após um acordo judicial com a Nintendo, mas forks comunitários como Suyu mantêm builds compiláveis.

**Ryujinx** adotou uma abordagem mais conservadora e focada em precisão. Por muito tempo foi o único a rodar certos títulos que o Yuzu não conseguia, especialmente jogos com física complexa ou anti-aliasing não convencional. Sua interface é mais técnica, com logs detalhados e opções de depuração que o Yuzu esconde. Também foi descontinuado em outubro de 2024, mas seu código continua disponível.

:::info
Nenhum dos emuladores inclui firmware, chaves criptográficas ou jogos. Ambos exigem que você forneça arquivos extraídos de um console Nintendo Switch que você possui. Esta distinção é o que mantém os projetos na esfera legal — o código do emulador em si não viola direitos autorais.
:::

## Por que o Steam Deck é ideal para emulação de Switch

O Switch original usa um SoC NVIDIA Tegra X1 com CPU ARM Cortex-A57 de 4 núcleos a 1.02 GHz e GPU Maxwell com 256 núcleos CUDA. O Steam Deck, mesmo no modelo LCD básico, entrega CPU Zen 2 de 4 núcleos / 8 threads a até 3.5 GHz e GPU RDNA 2 com 8 unidades computacionais. A diferença bruta de potência é de aproximadamente 4 a 6 vezes.

Emulação não é tradução direta de instruções — há um custo de tradução de ARM para x86-64 e de GPU Maxwell para Vulkan —, mas a folga de hardware é suficiente para que a maioria dos títulos rode a 60 FPS com upscaling para 1080p. Jogos como *Super Mario Odyssey*, *The Legend of Zelda: Breath of the Wild* e *Mario Kart 8 Deluxe* são perfeitamente jogáveis do início ao fim.

```terminal
$ lscpu | grep -E 'Model name|CPU\(s\)|Thread|Core'
Model name:                      AMD Custom APU 0405
CPU(s):                          8
Thread(s) per core:              2
Core(s) per socket:              4
```

Os 8 threads do Deck são o dobro dos 4 núcleos ARM do Switch, e a arquitetura Zen 2 entrega muito mais instruções por ciclo. A GPU RDNA 2 é gerações à frente da Maxwell do Tegra X1.

## O que esperar por categoria de jogo

Nem todo jogo de Switch roda bem no Deck. A tabela abaixo resume a experiência típica com os dois emuladores:

| Categoria | Exemplos | Desempenho típico | Observações |
|---|---|---|---|
| Plataforma 2D | *Celeste*, *Hollow Knight*, *Dead Cells* | 60 FPS sólidos | Sem ressalvas |
| First-party 3D | *Mario Odyssey*, *Mario Kart 8*, *Luigi's Mansion 3* | 50–60 FPS | Pequenos stutters de shader nos primeiros minutos |
| Mundo aberto pesado | *Zelda Tears of the Kingdom*, *Xenoblade 3* | 25–35 FPS nativo, 30–40 com mods | Exigem otimização por jogo e paciência |
| Motor Unreal Engine 4 | *Octopath Traveler II*, *Shin Megami Tensei V* | 40–60 FPS | Depende da versão do UE4 |
| Exclusivos de terceiros | *Astral Chain*, *Bayonetta 3* | 30–50 FPS | Variam bastante |

Jogos 2D e first-party otimizados são a regra, não a exceção. Os títulos pesados de mundo aberto exigem ajustes que você vai aprender nas próximas seções.

Para ter uma noção concreta do que a APU do Deck entrega, execute o Yuzu e observe a janela de status com um jogo rodando:

```terminal
$ flatpak run org.yuzu_emu.yuzu &> /dev/null &
## Inicie um jogo e depois verifique o uso de recursos
$ ps aux | grep yuzu | head -1
ana      18492  142  8.1 5234824 665432 ?     Sl   14:22  0:45 yuzu
$ free -h
               total    used    free    shared  buff/cache   available
Mem:           14Gi    5.2Gi   3.1Gi    1.4Gi        6.2Gi       8.0Gi
Swap:          1.0Gi     0.0B    1.0Gi
```

Os 14 GB de RAM do Deck LCD — ou 16 GB no OLED — dão ampla margem: mesmo o jogo mais pesado raramente ocupa mais de 6 GB de RAM do sistema com o emulador em execução.

Para confirmar o suporte a Vulkan (essencial para desempenho), verifique o driver AMD:

```terminal
$ vulkaninfo --summary 2>/dev/null | head -12
==========
VULKANINFO
==========

Vulkan Instance Version: 1.3.280

Device Properties and Extensions:
==================================
GPU0:
  deviceName     = AMD Radeon Graphics (RADV VANGOGH)
  apiVersion     = 1.3.280
  driverVersion  = 24.0.99
```

O driver `RADV VANGOGH` é o driver Vulkan de código aberto para a APU do Deck — o mesmo que Yuzu e Ryujinx usam quando você seleciona o backend Vulkan. `apiVersion 1.3.280` indica suporte completo a Vulkan 1.3, pré-requisito para o pipeline gráfico de ambos os emuladores.

:::dica
Se um jogo específico não está rodando bem, consulte a [compatibility list da comunidade](https://yuzu-emu.org/game/) (arquivada) ou o fórum do Ryujinx — quase sempre alguém já encontrou a combinação certa de configurações.
:::

## Resumo

- Yuzu e Ryujinx são emuladores de Switch maduros que rodam no Steam Deck com desempenho de 4 a 6 vezes acima do hardware original.
- Yuzu prioriza desempenho e conveniência; Ryujinx prioriza precisão e compatibilidade com títulos complexos.
- Ambos foram descontinuados, mas o código-fonte e forks comunitários permanecem disponíveis.
- Jogos 2D e first-party 3D rodam a 60 FPS; títulos de mundo aberto exigem otimização por jogo.
- O Steam Deck é ideal para emulação de Switch por ter CPU x86-64 potente, GPU RDNA 2 com Vulkan nativo e controles integrados.

## Exercícios

1. Pesquise no histórico de commits do GitHub do Suyu (fork do Yuzu) a última alteração feita no backend Vulkan. Em que data foi?
2. Liste as especificações do Tegra X1 (CPU, GPU, RAM, largura de banda) e compare com a APU Aerith do Steam Deck em uma tabela.
3. Abra o Discover no Steam Deck e procure por "yuzu" e "ryujinx". Ambos aparecem nos repositórios Flatpak? Anote a versão disponível.
4. Escolha três jogos do seu interesse e procure vídeos de gameplay deles no Steam Deck com Yuzu ou Ryujinx. Anote as configurações usadas e o FPS médio.
5. **Desafio.** Explique por que a arquitetura ARM do Switch exige tradução dinâmica de instruções (JIT) para rodar no Deck, e por que isso torna a emulação de Switch mais pesada que a de consoles x86 como o Xbox original.