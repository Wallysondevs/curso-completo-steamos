Muitos jogos modernos detectam se há uma placa NVIDIA presente e, ao encontrar, liberam recursos exclusivos: DLSS (upscaling por IA), Reflex (redução de latência) e alguns efeitos visuais. O Proton, por padrão, *esconde* a identidade da GPU do jogo — ele se apresenta como uma GPU AMD genérica. A variável `PROTON_ENABLE_NVAPI` revela ao jogo que é possível conversar com a NVIDIA através da NVAPI, desbloqueando esses recursos em títulos que os usam.

:::objetivos
- Entender o papel da NVAPI e por que o Proton a bloqueia por padrão
- Ativar DLSS e recursos NVIDIA com `PROTON_ENABLE_NVAPI`
- Reconhecer os parâmetros auxiliares `PROTON_ENABLE_NGX_UPDATER` e `WINE_HIDE_NVIDIA_GPU`
- Diagnosticar quando o DLSS não aparece no menu do jogo
- Saber os limites dessa tecnologia em GPUs AMD do Steam Deck
:::

## O que a NVAPI faz, de verdade

NVAPI é a interface privada que a NVIDIA expõe aos jogos para além do Direct3D. É por ela que um título pergunta "existe DLSS disponível?" ou "posso usar Reflex?". No Proton, essa interface é traduzida por uma ponte fornecida pelo próprio Wine/NVIDIA, mas ela **não é ativada sozinha**, porque em GPUs que não são NVIDIA (como o APU AMD do Steam Deck) prometer recursos de NVIDIA pode quebrar o jogo ou causar travamentos.

Deixar `PROTON_ENABLE_NVAPI` desligado é, portanto, o comportamento seguro. A variável só deve ser ligada quando o jogo tem um benefício concreto — normalmente em desktops com GPU NVIDIA, onde o DLSS tem ganho real.

```text
PROTON_ENABLE_NVAPI=1 %command%
```

No Steam Deck, a utilidade é mais limitada, mas existe: alguns jogos usam a presença da NVAPI para liberar opções de upscaling genéricas ou para deixar o menu de gráficos menos travado. É raro, porém, e costuma valer mais em desktops Linux com GPU NVIDIA.

:::nota
Na comunidade Linux, há quem use `PROTON_ENABLE_NVAPI=1` junto com `dxvk-nvapi` para tentar extrair DLSS até em GPUs AMD — isso **não funciona**. O DLSS é um recurso de hardware NVIDIA. Em GPU AMD, o equivalente a explorar é o FSR, que é aberto e independe da NVAPI.
:::

## Ativando e desativando com segurança

A forma mais limpa de testar é ligar a variável só no jogo que você quer, deixando o padrão intacto para o resto. A linha completa, para os casos em que o jogo precisa também do atualizador de componentes NGX (usado pelo DLSS na versão do framegame):

```bash
PROTON_ENABLE_NVAPI=1 PROTON_ENABLE_NGX_UPDATER=1 %command%
```

`PROTON_ENABLE_NGX_UPDATER` autoriza o Proton a baixar os componentes NGX da NVIDIA que o DLSS precisa em tempo de execução. Sem ele, alguns jogos exibem o DLSS no menu mas ele fica inativo.

Há também o lado oposto — *ocultar* a GPU NVIDIA deliberadamente. Isso é útil quando o jogo detecta a NVIDIA e assume features que não existem no ambiente real, causando crash:

```text
WINE_HIDE_NVIDIA_GPU=1 %command%
```

`WINE_HIDE_NVIDIA_GPU=1` é o padrão implícito do Proton em placas não NVIDIA: ele esconde a identidade NVIDIA do jogo. Ligá-lo explicitamente serve para forçar esse ocultamento em setups híbridos (notebooks com dual-GPU, por exemplo).

Para ver como a Steam interpreta essas variáveis em conjunto, você pode listá-las enquanto o Proton inicia:

```terminal
$ PROTON_LOG=1 PROTON_ENABLE_NVAPI=1 WINE_HIDE_NVIDIA_GPU=0 steam -applaunch 1234560
$ grep -iE "nvapi|nvidia" ~/steam-1234560.log | head -5
info:  nvapi:  NVAPI enabled
info:  nvapi:  NVIDIA GPU detection bypassed
```

Aqui `WINE_HIDE_NVIDIA_GPU=0` desliga a ocultação explicitamente, e o log registra que a detecção foi liberada. É um exemplo de como duas variáveis opostas (`ENABLE` e `HIDE`) podem brigar se você as deixar em estados conflitantes.

## Como eu sei que ligou

O teste mais direto é abrir o menu de gráficos do jogo e procurar a opção **DLSS** ou **NVIDIA Reflex**. Se aparecer, a ponte NVAPI funcionou. Para confirmar por baixo, rode o jogo com o log do Proton ativo e procure menções a `nvapi`:

```terminal
$ PROTON_LOG=1 PROTON_ENABLE_NVAPI=1 steam -applaunch 1234560
$ tail -20 ~/steam-1234560.log | grep -i nvapi
info:  nvapi:  NVAPI enabled
info:  nvapi:  DLSS entry points found
```

`PROTON_LOG=1` faz o Proton gravar um arquivo `steam-<appid>.log` no diretório home do usuário (`/home/deck`). O `applaunch` inicia o jogo pelo ID de app (aqui `1234560`, um exemplo ilustrativo — troque pelo ID real do seu jogo na URL da loja). As linhas com `nvapi` confirmam que a ponte foi carregada.

:::dica
Nem todo jogo grava o menu de gráficos da mesma forma. Se o DLSS não aparecer mesmo com a variável ligada, confirme no `steam-<appid>.log` se o Proton relatou `NVAPI enabled`. Se não relatou, a variável não chegou ao processo — releia [a seção sobre variáveis de ambiente e `%command%`](#/cap-041/sec-01).
:::

Um teste complementar para ver se o Proton está carregando a ponte NVAPI de fato (e não apenas aceitando a variável) é inspecionar as bibliotecas nvapi no processo em execução. Com o jogo aberto, localize o PID e confira os mapeamentos de memória:

```terminal
$ pgrep -f "wine64-preloader" | head -1
5180
$ grep -i nvapi /proc/5180/maps | head -3
7f3a1c000000-7f3a1c005000 r--p 00000000 08:02 123456  /usr/lib/x86_64-linux-gnu/nvapi/nvapi64.so
```

A presença de `nvapi64.so` no mapa de memória (`/proc/PID/maps`) confirma que a biblioteca de tradução foi carregada no espaço de endereçamento do jogo. É o mesmo princípio do `/proc/PID/environ` visto na primeira seção: ler o estado real do processo, não o que foi digitado.

## Quando vale a pena e quando não vale

Num desktop com NVIDIA, `PROTON_ENABLE_NVAPI=1` costuma ser um bom investimento: destrava DLSS e Reflex em muitos títulos. No Steam Deck, o ganho raramente compensa, porque a GPU é AMD e o DLSS não está disponível; o FSR cumpre o papel do upscaling. O custo de ligar a variável sem necessidade é baixo, mas não é zero: alguns jogos mudam o comportamento ao detectar "NVIDIA" e podem introduzir artefatos ou consumo extra.

A regra prática: teste `PROTON_ENABLE_NVAPI` quando o jogo oferece DLSS/Reflex e você está em GPU NVIDIA. No Deck, prefira FSR ([ver a seção sobre `WINE_FULLSCREEN_FSR`](#/cap-041/sec-06)) e deixe a NVAPI desligada.

## Resumo

- `PROTON_ENABLE_NVAPI=1` revela ao jogo a ponte NVAPI, destravando DLSS e Reflex em GPUs NVIDIA.
- O padrão do Proton é ocultar a NVIDIA (`WINE_HIDE_NVIDIA_GPU=1`), que é o comportamento seguro.
- `PROTON_ENABLE_NGX_UPDATER=1` autoriza o download dos componentes NGX que o DLSS exige.
- `PROTON_LOG=1` grava um log onde `nvapi: NVAPI enabled` confirma a ativação.
- Em GPU AMD (Steam Deck), DLSS não funciona; o equivalente aberto é o FSR.

## Exercícios

1. Adicione `PROTON_ENABLE_NVAPI=1 %command%` a um jogo e observe se o menu de gráficos passou a exibir DLSS ou Reflex.
2. Rode o mesmo jogo com `PROTON_LOG=1 PROTON_ENABLE_NVAPI=1 steam -applaunch <appid>` e procure por `nvapi` no log gerado.
3. Compare o comportamento com `WINE_HIDE_NVIDIA_GPU=1` e descreva a diferença no menu do jogo.
4. Explique por que, no Steam Deck, o DLSS não aparece mesmo com a variável ligada.
5. **Desafio.** Investigue um jogo com DLSS e um sem DLSS. Para cada um, anote se `PROTON_ENABLE_NVAPI` mudou algo e proponha uma regra de quando ligar a variável com base no que observou.
