Quando o DXVK traduz uma chamada Direct3D 11 para Vulkan, ele precisa compilar um *shader* — um pequeno programa que roda na GPU. Essa compilação, se acontecer no meio da partida, gera as famosas travadas de *stutter*. O SteamOS ataca isso de duas formas: o cache de shaders pré-compilados que a Valve distribui, e o `DXVK_ASYNC`, que adia a compilação para depois do quadro. Entender os dois é a chave para eliminar engasgos.

:::objetivos
- Entender por que a compilação de shaders causa travadas
- Distribuir a diferença entre cache de shaders e compilação assíncrona
- Ativar `DXVK_ASYNC` e medir seu efeito
- Localizar e gerenciar o cache de shaders no disco
- Saber as limitações e os riscos da compilação assíncrona
:::

## Por que o jogo engasga na primeira execução

Um shader precisa ser compilado para a GPU específica antes de rodar. No Windows, os drivers fazem isso em segundo plano ou vêm com o jogo já pré-compilado. No Proton, a compilação acontece sob demanda: na primeira vez que um efeito aparece na tela, o DXVK compila o shader na hora, e o quadro congela por alguns milissegundos. Isso é o *shader stutter* — pior nos primeiros minutos e em cenas nunca vistas.

O Steam Deck mitiga o problema com um **cache compartilhado**: a Valve pré-compila shaders para o APU do Deck e baixa esse cache junto com o jogo, como um pacote separado. Quando funciona, o jogo roda liso desde a primeira execução.

```terminal
$ du -sh ~/.local/share/Steam/steamapps/shadercache/ 2>/dev/null
8.4G	/home/deck/.local/share/Steam/steamapps/shadercache/
```

Esse diretório guarda os shaders compilados. O tamanho cresce conforme você instala jogos; está na ordem de gigabytes mesmo em bibliotecas modestas. É normal e, na verdade, é o que mantém os jogos fluidos.

:::nota
O cache de shaders do Deck é específico para a GPU do Deck (uma RDNA2 AMD). O mesmo cache não serve para um desktop com outra placa, por isso a Valve o distribui por plataforma. Em GPUs diferentes, o DXVK simplesmente recompila.
:::

## O que o `DXVK_ASYNC` muda

`DXVK_ASYNC=1` altera a estratégia: em vez de compilar o shader na hora e travar o quadro, o DXVK **desenha o quadro sem o efeito** (ou com um shader vazio) e compila o shader em uma thread separada. Quando o shader fica pronto, os quadros seguintes já o usam. O resultado é que a primeira exibição de um efeito pode ficar temporariamente incompleta (texturas pretas, efeito faltando), mas o jogo não congela.

```text
DXVK_ASYNC=1 %command%
```

O ganho é mais perceptível em jogos com muitos shaders novos aparecendo em sequência (mundos abertos, partículas). A desvantagem é exatamente a de um efeito que "pisca" ou aparece atrasado por alguns frames — um compromisso entre fluidez e fidelidade.

:::atencao
O `DXVK_ASYNC` só funciona com o fork `dxvk-async`, que não vem em todas as builds do Proton do SteamOS. No Proton upstream recente, a opção foi removida por violar a especificação Vulkan e causar artefatos. Teste e, se não surtir efeito, confie no cache de shaders da Valve, que é o caminho suportado no Deck.
:::

## Medindo o efeito na prática

A forma de ver o engasgo e a compilação acontecendo é ligar o HUD de shaders do DXVK, que imprime no console cada compilação:

```terminal
$ DXVK_HUD=pipelines %command%
```

O `DXVK_HUD=pipelines` mostra, no canto da tela, quantos pipelines (shaders) foram compilados naquela sessão. Comparando uma execução com e sem `DXVK_ASYNC=1`, você vê se a compilação deixou de bloquear o quadro:

```terminal
$ DXVK_HUD=pipelines DXVK_ASYNC=1 %command%
```

Na primeira execução de um jogo, o contador sobe rápido (centenas de pipelines nos primeiros minutos). Nas execuções seguintes, com o cache quente, o número quase não cresce — sinal de que o cache está fazendo o trabalho dele.

## Gerenciando o cache

O cache de shaders pode crescer demais, principalmente se você instala e desinstala muitos jogos. O SteamOS tem uma interface para isso, mas dá para inspecionar por terminal:

```terminal
$ ls ~/.local/share/Steam/steamapps/shadercache/ | head -5
1085660
1086940
1091500
1174180
1245620
```

Cada diretório é nomeado pelo `appid` do jogo. Para descobrir qual é qual, basta cruzar com o manifest:

```terminal
$ grep -l "1174180" ~/.local/share/Steam/steamapps/*.acf
/home/deck/.local/share/Steam/steamapps/appmanifest_1174180.acf
$ grep "name" ~/.local/share/Steam/steamapps/appmanifest_1174180.acf
	"name"		"Elden Ring"
```

O `appid` aparece tanto no nome do diretório de shaders quanto no `appmanifest`, onde o campo `name` revela o título. Apagar o diretório de um jogo desinstalado libera espaço, e ele será rebaixado se você reinstalar.

:::dica
Não apague o cache de shaders de um jogo que você joga com frequência só para "liberar espaço": você estará trocando alguns gigabytes por minutos de engasgo na próxima execução. Apague apenas de jogos que você já desinstalou.
:::

## Resumo

- O *shader stutter* acontece quando o DXVK compila um shader no meio do quadro.
- O SteamOS distribui um cache de shaders pré-compilado específico para o APU do Deck.
- `DXVK_ASYNC=1` adia a compilação para uma thread separada, evitando a travada ao custo de efeitos temporariamente incompletos.
- `DXVK_HUD=pipelines` mostra quantos pipelines foram compilados na sessão, útil para medir o efeito.
- O cache vive em `~/.local/share/Steam/steamapps/shadercache/`, organizado por `appid`.

## Exercícios

1. Rode um jogo pela primeira vez e observe os engasgos dos primeiros minutos. Depois rode de novo e compare.
2. Ative `DXVK_HUD=pipelines` e anote quantos pipelines são compilados numa sessão nova frente a uma com o cache quente.
3. Teste `DXVK_ASYNC=1` e descreva a diferença: houve efeitos "piscando" ou texturas temporariamente pretas?
4. Localize o diretório de shaders do seu jogo pelo `appid` e veja o tamanho dele com `du -sh`.
5. **Desafio.** Relacione o cache de shaders com o que você aprendeu sobre `%command%` e variáveis de ambiente: proponha uma linha que ligue o HUD de pipelines e o modo assíncrono ao mesmo tempo, e explique a ordem dos termos.
