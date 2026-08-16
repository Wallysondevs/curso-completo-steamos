Quatro frentes foram apresentadas: swap, swappiness, huge pages e TRIM/VRAM. Agora é hora de separar o que cada uma de fato altera no comportamento do sistema do que é mito de fórum. Nem todo tweak mexe no que você acha que mexe, e alguns "ganhos" reportados na internet são na verdade efeito colateral de outra coisa — ou simplesmente placebo. Esta seção constrói o mapa causal: se você mexer aqui, é *isso* que muda ali.

:::objetivos
- Mapear a cadeia causal de cada tweak até o sintoma visível
- Diferenciar efeito direto, efeito colateral e placebo
- Entender por que benchmarks de FPS médio escondem melhorias reais
- Reconhecer interações entre tweaks que podem se anular
- Avaliar quando um tweak é seguro de aplicar e quando é arriscado
:::

## O mapa causal, de ponta a ponta

Cada ajuste age numa camada do sistema. O erro comum é achar que "aumentar swap = mais FPS". A cadeia real é mais longa, e cada elo tem um custo:

| Tweak | Primeiro efeito | Cadeia até o sintoma |
|---|---|---|
| Aumentar zram | Mais espaço de troca comprimido | Menos OOM → menos travadas, mas mais CPU de compressão |
| Diminuir swappiness | Kernel preserva memória anônima, descarta menos cache | Menos stutter de recarga de textura, mas RAM mais pressionada |
| THP `always` | Mais páginas de 2 MB promovidas | Menos TLB miss, mas mais trabalho do `khugepaged` |
| TRIM agendado | Blocos mortos do SSD liberados | Escrita mais rápida com o tempo, sem efeito imediato no FPS |
| VRAM/UMA baixo | Mais RAM livre para o sistema | Menos swap, possivelmente melhor 1% low |

Repare que **nenhum desses elos termina diretamente em "FPS médio maior"**. O que eles afetam é a *consistência* — os 1% low, os micro-engasgos, a ausência de travadas fatais. Um FPS médio que sobe de 59 para 60 é menos valioso que um 1% low que sobe de 25 para 40.

## Trem, não carro: o efeito é no pior frame

Quando alguém diz "ganhei 5 FPS com CryoUtilities", quase sempre está citando um número de benchmark médio ou máximo. Mas o sistema de memória não governa o FPS médio — a GPU e a CPU governam. A memória governa os **pior casos**: o frame que trava porque o cache foi descartado, o momento em que o OOM quase matou o processo, a rajada de compactação do `khugepaged` no meio de uma cena.

```terminal
$ mangohud glxinfo 2>/dev/null | grep -i fps
```

A métrica que revela o valor real de um tweak de memória é o **1% low** e o **0.1% low** — o percentil dos piores frames. Um jogo pode rodar a 60 FPS médios e ainda assim "engasgar", porque 1% dos frames demora o dobro. É exatamente aí que swap e huge pages atuam. O [capítulo de medição](#/cap-076/sec-08) detalha como capturar isso sem se enganar.

:::nota
O percentil 1% low é calculado ordenando os tempos de todos os frames e pegando o valor do pior 1%. Ele descreve a fluidez percebida muito melhor que a média, porque o cérebro humano nota o frame lento ocasional, não a fração de milissegundo ganha na média.
:::

## Efeito direto, colateral e placebo

Vale classificar cada alegação de melhoria em três categorias, que ajudam a ler qualquer fórum com desconfiança:

- **Efeito direto:** a mudança que o parâmetro provoca, mecanicamente, no subsistema. Ex.: `swappiness=1` *de fato* faz o kernel priorizar memória de processo sobre cache.
- **Efeito colateral:** consequências não óbvias, às vezes benéficas, às vezes nocivas. Ex.: `swappiness=1` também faz o cache de página demorar mais a ser liberado, o que *pode* estourar memória e causar stutter em outro cenário.
- **Placebo:** melhoria relatada que não vem do tweak. Ex.: o usuário fez o tweak *e* atualizou o SteamOS no mesmo dia; o ganho veio do patch, não do tweak.

A maioria dos "benchmarks milagrosos" de otimização ignora a categoria placebo e o efeito colateral. Um relato anedótico de um usuário num jogo específico não é evidência — é um ponto de dados com variáveis incontroladas.

## Interações que se anulam (ou somam)

Tweaks de memória não vivem em ilhas. Mexer em dois ao mesmo tempo pode produzir resultados que nenhum deles teria sozinho:

```terminal
$ sysctl vm.swappiness
vm.swappiness = 1
$ cat /sys/kernel/mm/transparent_hugepage/enabled
[always] madvise never
```

Com `swappiness=1` **e** THP `always`, você diz ao kernel: "não troque memória de processo" e "promova tudo a páginas grandes sem restrição". O resultado combinado pode ser pior que cada um isolado: a memória anônima nunca sai para o swap, o cache nunca é liberado, e o `khugepaged` ainda compete por CPU tentando compactar um sistema já apertado. O kernel pode acabar recorrendo ao OOM killer — mata o jogo silenciosamente.

Quando isso acontece, a evidência fica registrada no buffer do kernel, acessível via `dmesg`:

```terminal
$ sudo dmesg -T | grep -i -A4 'oom-kill'
[Mon Jan 20 20:14:05 2025] game invoked oom-killer: gfp_mask=0x100cca(GFP_HIGHUSER_MOVABLE), order=0
[Mon Jan 20 20:14:05 2025] oom-kill:constraint=CONSTRAINT_NONE, oom_score_adj=0
[Mon Jan 20 20:14:05 2025] Memory cgroup out of memory: Killed process 8123 (game) total-vm:9421328kB, anon-rss:5233120kB
```

A linha `oom-kill` revela o processo sacrificado e quanto de memória anônima (`anon-rss`) ele segurava. Se você vê isso num jogo após aplicar tweaks agressivos, o culpado provavelmente não é o jogo — é a combinação de parâmetros que estrangulou o escape do sistema.

É por isso que a [seção final](#/cap-076/sec-09) insiste em mudar **uma variável por vez** e reverter por completo antes de testar a próxima. Combinações só podem ser avaliadas depois que cada peça foi isolada.

:::atencao
Aplicar todos os tweaks de uma vez, como os presets "agressivo" de algumas ferramentas, é a forma mais comum de "piorar o que já estava bom" e não saber o porquê. Presets são pontos de partida para teste, não verdades absolutas.
:::

## Quando é seguro, quando é arriscado

Uma regra prática útil para avaliar cada tweak antes de aplicar:

- **Seguro (reversível e sem efeito imediato):** TRIM agendado. Pode ser ligado/desligado sem risco; o benefício é de longo prazo e não afeta o jogo da sessão atual.
- **Reversível, mas de efeito imediato:** swappiness e THP. Mudam na hora, são desfeitos na hora; o risco é de sintoma sutil que demora a aparecer.
- **Requer reinício e mexe em hardware:** VRAM/UMA na BIOS. Alto impacto, mas precisa de boot, e o efeito interage com o resto do sistema.

O TRIM é quase sempre uma boa ideia (é manutenção de hardware). Swappiness e THP dependem do jogo e devem ser medidos. VRAM/UMA deve ser mexido com anotação do valor original e compreensão do trade-off de memória unificada.

## Resumo

- Cada tweak age numa camada específica e tem uma cadeia causal longa até o sintoma visível.
- Tweaks de memória afetam a *consistência* (1% low), não o FPS médio.
- Alegações de melhoria se dividem em efeito direto, efeito colateral e placebo.
- Tweaks podem interagir e se anular; mudar um por vez é obrigatório.
- TRIM é manutenção segura; swappiness/THP dependem do jogo; VRAM/UMA exige reboot e cuidado.

## Exercícios

1. Escolha dois tweaks do capítulo e desenhe, em texto, a cadeia causal de cada um desde o parâmetro até o sintoma no jogo.
2. Num fórum de otimização, encontre uma alegação de "ganho de FPS" e classifique-a como efeito direto, colateral ou placebo, justificando.
3. Aplique `swappiness=1` sozinho e jogue 20 minutos; registre o 1% low. Reverta e compare com o baseline anotado.
4. Aplique THP `always` sozinho e repita a medição do exercício 3. Os dois tweaks isolados deram o mesmo resultado que combinados?
5. **Desafio.** Explique o risco de OOM-killer no cenário "swappiness baixo + THP always + zram pequeno", conectando os três parâmetros numa única explicação causal.