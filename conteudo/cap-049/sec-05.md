O PlayStation 3 era uma máquina bizarra: um processador Cell com uma CPU principal e sete núcleos auxiliares (os SPUs), além de uma GPU da NVIDIA. Emular isso é um dos problemas mais difíceis da emulação moderna, e o RPCS3 enfrenta esse desafio com uma maturidade impressionante — mas está sempre no limite do que o Steam Deck aguenta. Aqui, mais do que em qualquer outro emulador deste capítulo, você trabalha jogo a jogo, consultando listas de compatibilidade e ajustando o compilador dos SPUs.

:::objetivos
- Instalar o firmware do PS3 e preparar o RPCS3
- Entender por que o Cell/SPU torna a emulação tão exigente
- Escolher o recompilador LLVM e configurar os SPUs
- Consultar a lista de compatibilidade antes de cada jogo
- Ajustar resolução e TDP para títulos específicos no Deck
:::

## Firmware e estrutura de arquivos

Diferente do PCSX2, o RPCS3 não lê uma BIOS solta: ele instala o firmware completo do PS3 e constrói um sistema de arquivos virtual chamado `dev_hdd0`, que reproduce o disco rígido interno do console. Esse é o primeiro passo, sem o qual nenhum jogo executa.

```terminal
$ flatpak run net.rpcs3.RPCS3
[RPCS3] Firmware 4.90 installed successfully
```

Depois da instalação, os jogos entram numa pasta (geralmente com o ID de catálogo, como `BLUS31553`) em formato de *disc dump* (pasta com a estrutura `PS3_GAME`) ou como arquivo `.iso`/`.pkg`. O RPCS3 aceita ainda `.pkg` de jogos digitais da PSN. A organização recomendada no Deck é um diretório `~/Emulation/roms/ps3/` com uma subpasta por jogo, porque o emulador lê o ID de catálogo para buscar patches e configurações automáticas da comunidade.

```terminal
$ ls ~/Emulation/roms/ps3/
BLUS31553/
BCUS98174/
```

Os jogos de PS3 são grandes — 20 a 50 GB cada, quando extraídos. Isso torna o microSD uma quase obrigação para montar uma coleção, e torna a escolha do formato (`.iso` comprimido versus pasta extraída) uma decisão relevante de armazenamento no Deck, cujo SSD interno lota rápido com meia dúzia de títulos.

## O Cell e por que pesa tanto

O Cell tem uma CPU principal (PPE) e oito SPUs, dos quais sete ficam disponíveis para os jogos. Esses SPUs eram programados à mão e, em títulos pesados, cada um é usado até o limite. Na emulação, cada SPU vira atividade intensa de CPU — e aí está o gargalo: o Steam Deck tem CPU forte o suficiente para muitos títulos, mas poucos jogos de PS3 atingem 60 FPS nele.

```terminal
$ flatpak run net.rpcs3.RPCS3 2>&1 | grep -iE 'SPU|PPU'
[PPU] Threads: 4 | [SPU] Threads: 6
```

A configuração que mais move a agulha é o **SPU Decoder**: a opção **LLVM Recompiler** (em vez de *Interpreter*) compila o código dos SPUs para código nativo e multiplica a velocidade.

| Ajuste | Valor recomendado |
|---|---|
| CPU → SPU Decoder | LLVM Recompiler |
| CPU → SPU Block Size | Safe (ou Mega para títulos simples) |
| GPU → Renderer | Vulkan |
| GPU → Resolution Scale | 720p (100%) ou menos |

:::atencao
O *SPU Block Size* em "Mega" ganha speedup significativo mas pode quebrar jogos. Comece em "Safe" e suba apenas se o título for conhecidamente estável na lista de compatibilidade. Também vale deixar o *Preferred SPU Threads* automático: prender o valor errado (por exemplo, 6 threads) em jogos que usam apenas 2 SPUs desperdiça CPU em sincronização sem ganho real.
:::

## A lista de compatibilidade é o seu mapa

O RPCS3 mantém uma das listas de compatibilidade mais detalhadas da emulação, com quatro níveis: *Playable*, *In-game*, *Intro* e *Nothing*. A diferença entre um jogo *Playable* e um *In-game* é decisiva — o primeiro chega ao final jogável, o segundo boots mas trava ou apresenta bugs bloqueadores.

```terminal
$ flatpak run net.rpcs3.RPCS3 2>&1 | grep -i 'Compatibility'
```

Antes de investir em qualquer ajuste, procure seu jogo na lista oficial. Os títulos *Playable* mais leves (como *Persona 5*, embora extenso, ou jogos de PS2 Classics) rodam razoavelmente no Deck; os *In-game* você tenta por diversão, sem expectativa.

## Ajustando para o Deck

No hardware do Deck, a ordem de prioridade é: primeiro garantir que a CPU sustenta o jogo, depois mexer na GPU. Como o gargalo é quase sempre o Cell/SPU, o correto é:

1. Deixar a resolução em 100% (720p) para não sobrecarregar a GPU desnecessariamente.
2. Ligar o **LLVM Recompiler** e testar *SPU Block Size*.
3. Usar o *FPS limit* do próprio Steam Deck (modo Desktop) para estabilizar o frame time.

```terminal
$ flatpak run net.rpcs3.RPCS3 --no-gui
[RPCS3] Booted BLUS31553 (Persona 5)
```

:::dica
Em jogos que ficam oscilando, travar o FPS a 30 no painel do Deck dá uma experiência mais constante do que 60 FPS "pulando". Emulação de PS3 raramente sustenta 60 no aparelho, e 30 travado costuma ser a meta realista. Jogos de PS2 Classics (que rodam sobre um emulador embutido no firmware do PS3) tendem a ser mais leves e são boa porta de entrada para testar o RPCS3 no Deck.
:::

## Resumo

- RPCS3 instala o firmware completo do PS3 e reproduz o `dev_hdd0`, sem o qual nada roda.
- O Cell com seus SPUs torna a emulação de PS3 limitada por CPU no Steam Deck.
- O recompilador LLVM para SPU é o ajuste individual de maior impacto no desempenho.
- A lista de compatibilidade (Playable/In-game/Intro/Nothing) define o que vale a pena tentar.
- Meta realista no Deck é 30 FPS travado para títulos pesados, não 60.

## Exercícios

1. Instale o firmware do PS3 no RPCS3 e confirme a mensagem de sucesso no log.
2. Localize na lista oficial de compatibilidade o status de um jogo seu e registre a versão de firmware recomendada.
3. Rode o mesmo jogo com *SPU Decoder* em "Interpreter" e depois em "LLVM Recompiler"; compare o FPS.
4. Varie o *SPU Block Size* entre "Safe" e "Mega" e observe se o jogo continua estável.
5. **Desafio.** Explique, usando o conceito de recompilador JIT que você viu na [seção sobre emuladores standalone](#/cap-049/sec-01), por que o "Interpreter" é tão mais lento que o "LLVM Recompiler" e por que blocos maiores ("Mega") ganham velocidade mas arriscam compatibilidade.
