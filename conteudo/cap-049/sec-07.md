O Xbox original e o Xbox 360 ocupam as pontas opostas do espectro de emulação: o primeiro é um PC customizado com chip Intel, bem documentado, e o segundo é uma arquitetura IBM PowerPC com GPU ATI, bem mais complexa. Os emuladores que os cobrem — Xemu e Xenia, respectivamente — estão em estágios de maturidade muito diferentes. Este capítulo os coloca juntos para que você entenda o que funciona bem, o que é experimental e como decidir se vale a pena emular cada biblioteca no Deck.

:::objetivos
- Instalar e configurar o Xemu para Xbox clássico
- Fornecer a BIOS, o MCPX e o disco de boot corretos
- Compreender o estado atual do Xenia no SteamOS
- Configurar o backend Vulkan no Xemu
- Decidir com realismo quais jogos rodam em cada emulador
:::

## Xemu — o Xbox clássico com dignidade

O Xemu é focado, bem documentado e funciona direito no Deck. Ele emula o hardware completo do Xbox original: CPU Pentium III, GPU NVIDIA NV2A, chipset Intel. O desempenho é bom na maioria dos títulos porque o hardware original é modesto e a APU do Deck o engole com folga.

```terminal
$ flatpak install -y app.xemu.xemu
$ flatpak run app.xemu.xemu
```

O Xemu pede três arquivos: a BIOS do Xbox (`Complex_4627.bin`), o `mcpx_1.0.bin` (o processador de mídia e comunicação da placa-mãe) e um disco de boot (pode ser um jogo ou um disco de sistema). Sem os três, ele não inicia.

```terminal
$ ls ~/.var/app/app.xemu.xemu/data/xemu/
Complex_4627.bin
mcpx_1.0.bin
xbox_hdd.qcow2
```

O arquivo `xbox_hdd.qcow2` é o disco rígido virtual do Xbox, no formato QCOW2 que o Xemu gerencia. Jogos podem ser carregados de uma pasta de `.iso` ou da própria máquina virtual — este segundo método é o mais estável, porque copia o jogo para dentro do disco virtual exatamente como ele ficaria no console real.

| Ajuste | Valor recomendado |
|---|---|
| Backend gráfico | Vulkan |
| Resolução interna | 3x–4x (Xbox original roda folgado) |
| Áudio | Default |
| Disco rígido | Arquivo QCOW2 ou pasta de jogos |

A biblioteca do Xbox original é relativamente enxuta e focada em títulos de ação e corrida (Halo, Forza, Burnout, Ninja Gaiden, Fable), o que a torna perfeita para sessões curtas no Deck. Como o hardware original é um Pentium III com GeForce 3, a APU moderna emula com margem enorme.

:::dica
Biblioteca de Xbox é pequena comparada com PS2/GameCube e o hardware é simples. Depois de configurado, o Xemu é o mais "fire and forget" desta lista: a maioria dos títulos roda em resolução alta sem ajuste extra.
:::

## Jogos e estrutura do Xbox

O Xbox original tem jogos em formato `.iso` direto ou extraídos para pasta com o executável `default.xbe`. O Xemu lê ambos, e a cópia para o disco virtual resolve a maioria dos problemas:

```terminal
$ flatpak run app.xemu.xemu
[Xemu] Booted game: Halo: Combat Evolved
```

Um cuidado específico do Xbox: o relógio do console é emulado também e pode precisar de ajuste. O capacitor de clock é notório entre fãs do Xbox original por vazar e estragar placas-mãe; no emulador, ele é irrelevante, mas o erro de relógio ainda aparece na primeira execução e some com um clique na tela de boot.

O gerenciamento de saves no Xbox também é peculiar: tudo vive dentro do disco virtual `xbox_hdd.qcow2`, então o backup é simples — copie o arquivo QCOW2 inteiro, e você leva jogos, saves e configuração de uma vez. Não há save state separado como no PCSX2 ou Dolphin.

```terminal
$ du -h ~/.var/app/app.xemu.xemu/data/xemu/xbox_hdd.qcow2
8.0G    xbox_hdd.qcow2
```

## Xenia — o 360 ainda experimental

O Xenia é o único emulador deste capítulo sem build oficial para Linux. No Steam Deck, ele roda através do Proton (a mesma camada de tradução de jogos de Windows), e o desempenho cai bastante em relação ao Windows nativo. A GPU do emulador, que no Windows usa Direct3D 12, precisa passar por uma camada de tradução para Vulkan, o que soma latência e overhead.

```terminal
$ flatpak run --command=bash net.lutris.Lutris
```

A realidade honesta em meados de 2025: poucos títulos de Xbox 360 são confortáveis no Deck. *Lost Odyssey* e alguns títulos Arcade rodam, mas a maioria pesada (como *Red Dead Redemption* de 360 ou *Halo 3*) engasga ou apresenta bugs visuais graves. O Xenia também exige os arquivos de firmware do 360, obtidos pelo mesmo princípio de dump do seu próprio console, embora a barreira maior seja o desempenho, não a obtenção dos arquivos.

| Situação | No Deck |
|---|---|
| Jogos leves / Arcade | OK, 30–60 FPS |
| Títulos AAA pesados | Lento, bugs visuais |
| Live Arcade / indies | Boa chance |

:::atencao
Xenia no Deck é para quem já sabe que está em território experimental. Se for sua primeira aventura na emulação, foque no Xemu, PCSX2 e Dolphin, que entregam experiência sólida. Volte ao Xenia quando a biblioteca amadurecer.
:::

## Backend Vulkan no Xemu

O Xemu, por ser um projeto mais novo, já incorpora Vulkan como backend principal desde cedo, e é ele que você usa. As opções gráficas se resumem a resolução interna e filtro de textura — não há a complexidade dos emuladores de PS2 ou PS3 porque o hardware original já é mais próximo de um PC.

```terminal
$ flatpak run app.xemu.xemu
[Graphics] Vulkan renderer selected at 3x scale
```

## Resumo

- Xemu é o emulador de Xbox clássico, estável e leve, que roda bem 4x de resolução no Deck.
- Xenia emula Xbox 360 sem build oficial para Linux; roda via Proton, com compatibilidade baixa e FPS limitado.
- O Xemu exige três arquivos: BIOS, MCPX e disco de boot — sem os três, não abre.
- O Xemu usa Vulkan e é o emulador mais simples de configurar deste capítulo.
- Encare Xenia como experimental; para uma primeira experiência de emulação, foque em Xemu entre os Xbox.

## Exercícios

1. Instale o Xemu e forneça os três arquivos de sistema; confirme que a tela de boot aparece corretamente.
2. Carregue um `.iso` de Xbox e examine o log para confirmar qual GPU backend está em uso.
3. Varie a resolução interna do Xemu entre 1x e 4x e anote a diferença de FPS em cenas pesadas.
4. Pesquise na página do projeto Xenia quantos títulos de Xbox 360 estão em estado "playable" e compare com o Xemu.
5. **Desafio.** Explique por que o Xbox (arquitetura x86, GPU NVIDIA) é mais fácil de emular que o Xbox 360 (PowerPC, GPU ATI), usando o que você aprendeu sobre arquitetura de hardware nas seções anteriores.