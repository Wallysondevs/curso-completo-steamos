Você tem o emulador rodando, mas os jogos ainda não entregam fluidez. O pulo de qualidade vem da configuração gráfica: escolher o backend certo, calibrar resolução, ativar upscaling e entender o custo de cada opção na APU limitada do Deck. Esta seção mostra como extrair o máximo de desempenho sem sacrificar a estabilidade.

:::objetivos
- Escolher entre os backends Vulkan e OpenGL com critério
- Dominar resolução, upscaling FSR e filtros de pós-processamento
- Usar o MangoHud e o controle de TDP para avaliar e conter o consumo
- Aplicar `gamemoderun` para priorizar o emulador
:::

## Vulkan vs OpenGL: a decisão que mais importa

Os dois emuladores suportam dois backends gráficos. O **OpenGL** foi o padrão histórico em PC, mas no Switch ele é traduzido internamente de chamadas comuns. O **Vulkan** é mais próximo do que a GPU RDNA 2 do Deck entende nativamente, com menor overhead de driver e melhor uso de múltiplos núcleos de CPU.

| Backend | Quando usar | Custo em CPU | Estabilidade |
|---|---|---|---|
| **Vulkan** | Padrão recomendado no Deck, quase sempre mais rápido | Menor | Alta, com pequenos glitches visuais em alguns jogos |
| **OpenGL** | Fallback quando Vulkan glitcha um jogo específico | Maior | Alta em jogos mais antigos |

No Yuzu, a configuração fica em **Emulation → Configure → Graphics → API**. No Ryujinx, em **Options → Settings → Graphics → Graphics Backend**.

```terminal
$ MANGOHUD=1 flatpak run org.yuzu_emu.yuzu
...
FPS: 58.2  GPU: 72%  CPU: 41%  TDP: 11.4W
```

O MangoHud sobreposto confirma na prática: o mesmo jogo pode subir de 45 para 58 FPS ao trocar de OpenGL para Vulkan no Deck, simplesmente porque o driver AMD tem um caminho Vulkan mais otimizado.

:::dica
Regra prática: comece sempre em Vulkan. Só volte para OpenGL se encontrar artefatos visuais, telas pretas ou crashes que somem ao trocar de backend — isso indica bug no driver Vulkan daquele jogo específico.
:::

## Resolução e upscaling: o segredo para 60 FPS

O Switch roda a maioria dos jogos a 720p no modo portátil (a resolução nativa da tela do Deck) e até 1080p no dock. O emulador pode renderizar na resolução nativa ou multiplicá-la.

Os parâmetros centrais no Yuzu, em **Graphics**:

```text
Resolution = 1x (720p/1080p)   # Multiplicador da resolução interna
Window Adapting Filter = FSR    # Upscaler aplicado na saída
FSR Sharpness = 45%             # Nitidez do FSR
```

O Ryujinx usa a mesma lógica com **Resolution Scale** (1x, 2x, 3x) e um filtro de pós-processamento.

Por que manter 1x em vez de almejar 2x ou 3x? A APU do Deck tem folga para 2x em jogos leves, mas títulos pesados perdem FPS rapidamente quando você multiplica a carga de pixels. O FSR (FidelityFX Super Resolution) então re-escala a imagem de baixa resolução para a tela com nitidez, dando aparência de alta resolução sem o custo de renderizar nela.

```terminal
$ # Jogo leve (Hollow Knight) rodando a 2x com FSR
MANGOHUD=1 yuzu
Resolution = 2x  →  FPS: 60  GPU: 68%
```

:::atencao
Upscaling FSR não é mágica: ele melhora a percepção de nitidez, mas não recupera detalhe que não foi renderizado. Em jogos pesados, priorize FPS sobre resolução — a fluidez importa mais que o detalhe na tela de 7 polegadas.
:::

## Cache de shaders: por que os primeiros minutos gaguejam

Cada jogo compila shaders na primeira vez que encontra uma cena nova. Esse processo gera "stutter" (micro-travadas) que desaparecem conforme o cache esquenta. O Yuzu tem uma opção **Asynchronous Shader Building** (habilite) que move a compilação para fora do frame principal, reduzindo o stutter.

O cache fica em:

```terminal
$ ls ~/.local/share/yuzu/shader/
01006f8002326000.bin   # um cache por título
```

O Ryujinx faz o mesmo automaticamente e guarda em `~/.config/Ryujinx/games/<titleID>/cache/`. Deixe o cache acumular — apagar ele "para economizar espaço" só faz o stutter voltar do zero.

## Contendo o consumo com TDP e gamemode

O Steam Deck tem um TDP ajustável via interface, e o emulador responde bem a isso. Reduzir o TDP economiza bateria em jogos 2D; em jogos pesados, você quer o TDP máximo para não estrangular a CPU.

O `gamemoderun` (parte do pacote `gamemode`) prioriza o emulador, desliga o governor de economia e otimiza o escalonador:

```terminal
$ gamemoderun flatpak run org.yuzu_emu.yuzu
```

No Ryujinx, o `gamemode` também ajuda, especialmente quando o jogo disputa CPU com outros processos do SteamOS.

:::info
O MangoHud e o gamemode são pré-instalados no SteamOS. Se não estiverem, instale com `sudo pacman -S mangohud gamemode` no modo desktop (o SteamOS usa pacman, herdado do Arch, não apt).
:::

## Um fluxo de tune de 5 passos

1. **Backend**: Vulkan primeiro, OpenGL como fallback.
2. **Resolução**: 1x como base, suba para 2x em jogos leves.
3. **Shader**: habilite async shader building.
4. **Medição**: ative MangoHud e anote FPS/GPU/CPU.
5. **TDP**: ajuste TDP para cima em jogos pesados, para baixo em jogos leves.

```terminal
$ gamemoderun MANGOHUD=1 flatpak run org.yuzu_emu.yuzu
## Rode o jogo por 5 minutos e observe: FPS estável? GPU saturado? CPU saturada?
FPS: 31.0  GPU: 98%  CPU: 45%  TDP: 15.0W
```

Uma GPU a 98% com CPU a 45% indica gargalo de GPU: reduza a resolução. Uma CPU saturada com GPU ociosa indica gargalo de CPU — incomum no Deck, mas possível em jogos de mundo aberto.

## Resumo

- Vulkan é mais rápido no Deck; use OpenGL apenas como fallback para glitches específicos.
- Mantenha resolução 1x por padrão e use FSR para upscaling perceptual sem custo de renderização.
- Cache de shaders causa stutter inicial; habilite async shader building e não apague o cache.
- MangoHud revela onde está o gargalo (GPU vs CPU) para orientar o ajuste.
- `gamemoderun` e o controle de TDP equilibram desempenho e bateria.

## Exercícios

1. Rode um jogo pesado em Vulkan e OpenGL, anotando o FPS médio de cada um com MangoHud. Qual a diferença percentual?
2. Teste as resoluções 1x, 2x e 3x em um jogo 2D leve. Em qual delas o FPS cai abaixo de 60?
3. Ative e desative o async shader building no Yuzu e descreva a diferença de fluidez nos primeiros 2 minutos de um jogo novo.
4. Use `gamemoderun` e compare o FPS com e sem ele em um cenário aberto (não uma cutscene).
5. **Desafio.** Ajuste o TDP para o menor valor que ainda mantém 60 FPS em um jogo 2D. Anote o TDP e o consumo de energia estimado em uma sessão de 30 minutos.