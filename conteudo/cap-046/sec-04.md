Nem toda plataforma emula igual, e a régua mais honesta para medir o que o Steam Deck aguenta é a divisão por gerações de console. Das máquinas de 8 bits, que rodam em qualquer coisa, até Switch, que começa a empurrar a APU ao limite, existe um degrau de exigência que muda completamente o que você configura. Esta seção mapeia esse espectro e ensina a prever, antes de baixar qualquer ROM, se o jogo vai rodar bem.

:::objetivos
- Dividir as plataformas por geração e entender a exigência de cada uma no Deck
- Associar cada faixa de plataformas ao core ou emulador adequado
- Usar o overlay de desempenho para medir frames e consumo em tempo real
- Associar a CPU ao gargalo nas plataformas pesadas
- Escolher resolução e filtros coerentes com a geração emulada
:::

## A régua das gerações

A exigência de um emulador depende principalmente de **quantos hardwares diferentes ele precisa reproduzir ao mesmo tempo** e de **quão preciso** precisa ser. Plataformas antigas têm um único processador simples, um chip de som e um de vídeo, tudo cronometrado por um clock baixo; emulá-las com precisão custa pouco. Plataformas recentes têm CPUs multi-núcleo, GPUs programáveis e arquiteturas de memória complexas, e aí o custo cresce de forma não linear.

Uma divisão prática para o Deck:

| Faixa | Plataformas | Custo no Deck | Observação |
|---|---|---|---|
| 8/16 bits | NES, SNES, Mega Drive, Game Boy (Color/Advance), Master System | Mínimo | Roda dezenas de vezes mais rápido que o original |
| 5ª geração | PS1, N64, Saturn | Baixo a médio | PS1 é leve; N64 e Saturn variam por jogo |
| 6ª geração | Dreamcast, PS2, GameCube | Médio | Dolphin e PCSX2 muito maduros no Deck |
| 7ª geração | Wii, PS3 | Alto | Wii ok; PS3 depende de CPU e shaders |
| 8ª geração | Wii U, Switch | Muito alto | Nem tudo roda; exige ajuste por jogo |

Onde a régua corta, a experiência muda de "roda tudo sem pensar" para "roda por jogo, após configurar". A transição acontece na 6ª para a 7ª geração.

:::nota
"Geração de console" não é uma medida técnica, e sim histórica: agrupa máquinas contemporâneas por era de lançamento. É útil como heurística de exigência, mas dois consoles da mesma geração podem ter níveis de exigência bem diferentes — o Saturn, por exemplo, é notoriamente mais difícil de emular que o PS1, ambos da 5ª.
:::

## As faixas baixas: onde o Deck é rei

Para as plataformas de 8 e 16 bits, o Deck é um exagero em potência. Um core como `snes9x` ou `genesis_plus_gx` roda um jogo centenas de vezes mais rápido que o console original, então o desafio deixa de ser desempenho e passa a ser **qualidade de imagem**: filtros, shaders de CRT, proporção e latência.

É aqui que você deve aproveitar o headroom para ligar recursos que as plataformas pesadas não conseguem. Um shader de CRT que simula a tela de tubo, por exemplo, custa GPU — mas sobra GPU de sobra nessa faixa.

```terminal
$ flatpak run org.libretro.RetroArch --verbose 2>&1 | grep -i -m1 'video driver'
[INFO] [Video]: Video driver: gl
```

A saída mostra o driver de vídeo padrão. Para shaders de CRT e filtros, trocar para o driver Vulkan (`vulkan`) costuma dar acesso a um catálogo maior de shaders e a menor latência. Isso se faz em **Settings → Video → Output → Video Driver**.

:::dica
Nas plataformas de 8/16 bits, limite o jogo à resolução nativa (o RetroArch faz isso por padrão) e gaste recursos em **shaders e run-ahead** (processamento antecipado para reduzir latência), não em upscale. Upscalar um pixel art além do necessário só borra a imagem; o shader de CRT é o que devolve a estética original.
:::

## Medindo com o overlay de desempenho

O Steam Deck tem um overlay de desempenho nativo (tecla `[[...]]` → aba de desempenho) que mostra FPS, uso de CPU/GPU, temperatura e consumo. É a sua ferramenta número um para decidir se uma plataforma "está sobrando" ou "está no limite".

O equivalente em linha de comando, para medir de forma reprodutível, é o `mangohud` ou o contador do próprio emulador. O RetrArch tem um medidor de FPS interno que sai no terminal quando habilitado:

```terminal
$ flatpak run org.libretro.RetroArch --verbose 2>&1 | grep -E 'FPS|frame time'
[INFO] [Video]: Average monitor Hz: 60.00
[INFO] [Video]: Frame time: 16.66 ms
[INFO] [Video]: FPS: 60.0
```

FPS cravado em 60 com frame time estável de 16,66 ms é o sinal de que o jogo está "empoeirado", com folga. Quando o FPS cai e o frame time flutua, você encontrou o limite daquela configuração para aquele jogo.

:::atencao
Não confunda FPS baixo por **gargalo de CPU** com FPS baixo por **limite térmico**. Nas plataformas pesadas (PS3, Switch), a CPU atinge 100% e o FPS cai por falta de instruções executadas; já num jogo leve com shader pesado, é a GPU que satura. O overlay mostra as duas curvas separadas — olhar qual delas está em 100% é o primeiro passo de qualquer diagnóstico de emulação.
:::

## As faixas altas: o jogo muda

Na 7ª e 8ª geração, sobre o Deck, você não emula "a plataforma", e sim "jogos específicos". O RPCS3 (PS3) roda alguns títulos a 60 FPS e engasga em outros, porque a emulação precisa recompilar dinamicamente o código de uma CPU CELL e a GPU RSX, e cada jogo usa capacidades diferentes.

O sintoma clássico de entrada nessa faixa é a **compilação de shaders**: na primeira vez que um efeito aparece, o emulador compila o shader e o jogo dá uma travada momentânea. Depois que o cache é construído, a fluidez volta.

```terminal
$ du -sh ~/.var/app/net.rpcs3.RPCS3/config/rpcs3/caches/ 2>/dev/null
214M	~/.var/app/net.rpcs3.RPCS3/config/rpcs3/caches/
```

O diretório de cache cresce conforme você joga. Um cache de 214 MB aqui é normal para alguns títulos de PS3 e é exatamente o que você deve preservar em backups — perder o cache significa voltar a sofrer as travadas de compilação.

:::info
A divisão por faixa também orienta a escolha de resolução. Até a 5ª geração, o nativo é o ideal; na 6ª, o Dolphin e o PCSX2 aceitam upscale interno de 2x ou 3x sem custo proibitivo; na 7ª/8ª, upscale vira luxo, e manter a resolução original (ou 720p) é o que salva o FPS. O upscale é um multiplicador de carga de GPU, e a GPU do Deck tem limite.
:::

## Resumo

- A exigência de emulação cresce por geração, com corte prático entre a 6ª (média) e a 7ª (alta).
- Nas plataformas de 8/16 bits, o Deck sobra; o foco é qualidade de imagem (shaders, run-ahead), não desempenho.
- O overlay de desempenho (e o contador do RetroArch) mede FPS, frame time e uso de CPU/GPU para diagnosticar gargalo.
- PS1 é leve; Saturn e N64 variam por jogo; Dolphin e PCSX2 são muito maduros e aceitam upscale 2x.
- PS3, Wii U e Switch trabalham "por jogo", com CPU saturando e compilação de shaders causando travadas iniciais.
- O cache de shaders do RPCS3 deve ser preservado em backup para evitar retrabalho de compilação.

## Exercícios

1. Abra o overlay de desempenho no Game Mode e rode um jogo de 16 bits, anotando FPS, uso de CPU/GPU e consumo.
2. Use o contador do RetroArch (`--verbose`) para registrar FPS e frame time em um jogo de SNES e em um de N64, comparando.
3. Classifique cinco plataformas (à sua escolha) pela faixa de exigência definida na tabela, justificando cada uma.
4. Localize o diretório de caches do RPCS3 (ou do Dolphin) com `du -sh` e registre o tamanho antes e depois de jogar.
5. **Desafio.** Em um jogo pesado (PS3 ou Switch), identifique pelo overlay se o limite é CPU ou GPU, e proponha um ajuste (resolução, shader, clock) que ataque exatamente o recurso saturado.
