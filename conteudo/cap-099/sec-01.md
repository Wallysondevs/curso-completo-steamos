Trocar uma peça, desativar um serviço ou aplicar uma configuração nova no Steam Deck sem medir nada é dirigir no escuro: você sente que "ficou mais rápido", mas não consegue provar, e o viés de confirmação faz qualquer mudança parecer uma melhoria. Benchmarking é exatamente o antídoto disso — transformar uma impressão subjetiva em número comparável, medido sob condições controladas. Nesta seção você entende o que faz uma medição valer alguma coisa antes de aprender qualquer ferramenta específica.

:::objetivos
- Entender a diferença entre latência, vazão e tempo de execução
- Identificar quando um benchmark é útil e quando ele engana
- Reconhecer fontes de variância que corrompem uma medição
- Escolher a métrica certa para cada tipo de mudança
- Preparar a mentalidade de "medir antes, mudar depois"
:::

## As três grandezas que importam

Quase todo resultado de desempenho cai em uma destas três categorias: **latência**, **vazão** e **tempo de execução**. Saber qual delas a sua mudança pretende melhorar é o primeiro filtro.

**Latência** é o tempo que uma única operação leva para completar — o atraso entre pedir algo e receber a resposta. Carregar um jogo, abrir um menu, iniciar uma leitura de 4 KB num SSD: tudo isso é latência. Ela se mede em milissegundos, microssegundos ou nanossegundos, e o que importa nela quase nunca é a média, mas o **pior caso** e a **variação** (os "p99", percentil 99). Uma média de 5 ms que às vezes salta para 80 ms é percebida pelo usuário como travamento.

**Vazão** (ou *throughput*) é a quantidade de trabalho processada por unidade de tempo: megabytes por segundo copiados, quadros por segundo renderizados, operações por segundo completadas. É a métrica dos workloads que tem um volume grande e contínuo de trabalho, como copiar um backup ou comprimir arquivos.

**Tempo de execução** é a medida mais bruta e a mais fácil de enganar: quantos segundos algo leva do início ao fim. Serve bem para tarefas determinísticas (comprimir um arquivo, rodar um script), mas esconde a composição interna — o mesmo tempo pode vir de CPU lenta ou de disco lento.

```terminal
$ time sha256sum steam.img
3e9a2f1b7c4d0e8a5f6b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4  steam.img

real	0m3.842s
user	0m3.721s
sys	0m0.118s
```

O `time` já separa três tempos: `real` é o relógio de parede (o que você sente), `user` é o tempo gasto em espaço de usuário e `sys` em chamadas de sistema. Se `real` é muito maior que `user + sys`, o gargalo não é CPU — é espera de disco, rede ou outra tarefa no meio.

## Quando medir vale a pena

Benchmark mal usado gera conclusão errada com aparência de rigor. A regra prática: **meça quando a variável que você mudou tem uma relação causal plausível com a métrica que você coleta**. Ativar uma opção de compressão no sistema de arquivos afeta latência de E/S e uso de CPU — medir FPS de um jogo que não depende de disco é ruído. Desativar serviços em segundo plano afeta CPU e memória disponíveis — medir velocidade de rede não diz nada.

Também é preciso separar **benchmark** de **teste de estabilidade**. Benchmark responde "quão rápido?". Teste de estabilidade responde "aguenta?". São complementares: um sistema pode ser o mais rápido do mundo quando está frio e travar depois de quinze minutos sob carga térmica. Você só descobre isso rodando os dois tipos de teste, como verá nas seções finais deste capítulo.

:::dica
Anote sempre **o que você mudou, quando, e qual o resultado antes e depois**. Um caderno de benchmarks — mesmo que seja um arquivo `.md` no `~/lab` — vale mais que a memória. Daqui a três meses, quando algo regredir, você quer o número antigo para comparar, não a lembrança de que "estava bom".
:::

## Variância: a inimiga invisível

A lição mais importante deste capítulo inteiro aparece antes de qualquer ferramenta: **uma única medição não prova nada**. Toda medida tem ruído — o escalonador do kernel decide rodar outra coisa no meio, o processador muda de frequência por causa de temperatura, um *daemon* de índice dispara em segundo plano, o SSD faz coleta de lixo interna.

No Steam Deck isso é ainda mais sensível porque a máquina é compacta e a gestão de energia é agressiva. O processador não fica numa frequência fixa; ele sobe e desce conforme carga, temperatura e limite de potência. Duas execuções idênticas do mesmo comando, com segundos de diferença, podem variar vários por cento.

```terminal
$ for i in 1 2 3 4 5; do sha256sum steam.img | cut -d' ' -f1 >/dev/null; done
$ time sha256sum steam.img >/dev/null
real	0m3.84s
$ time sha256sum steam.img >/dev/null
real	0m3.97s
$ time sha256sum steam.img >/dev/null
real	0m3.79s
```

Três execuções, três números diferentes. Nenhum deles é "o verdadeiro"; juntos eles descrevem uma faixa. Por isso a prática correta é **sempre repetir** e olhar para a mediana ou a média das repetições, nunca para a primeira execução. A primeira execução, aliás, costuma ser descartável: ela aquece cache, inicializa bibliotecas e paga custos que as seguintes não pagam — fenômeno conhecido como *warm-up*.

:::atencao
O cenário mais comum de benchmark furado é comparar uma execução "fria" (primeira rodada, cache vazio, máquina recém-ligada) contra uma "quente" (quinta rodada, tudo em cache) e atribuir a diferença à sua mudança. Se você vai comparar antes/depois, mantenha o **estado térmico e de cache o mais parecido possível** nos dois lados.
:::

## Métrica certa para a mudança certa

A escolha da métrica não é cosmética; uma métrica errada leva à conclusão errada mesmo que a medição seja perfeita. Alguns emparelhamentos clássicos:

| Mudança | Métrica que importa |
|---|---|
| Trocar SSD por um mais rápido | Latência de leitura aleatória 4K + vazão sequencial |
| Ajustar configuração gráfica de um jogo | Tempo de quadro (frametime) médio e p99 |
| Desativar serviços em segundo plano | Uso de CPU ociosa + latência de resposta |
| Overclock / undervolt | Vazão de CPU + estabilidade sob carga longa |
| Compressão de sistema de arquivos | Vazão de E/S + uso de CPU |

Note que várias dessas mudanças pedem **duas** métricas: quase toda otimização é uma troca. Compressão dá mais espaço mas custa CPU; undervolt economiza energia mas pode reduzir estabilidade. Medir um lado só é legitimar a troca sem enxergá-la.

Para fixar com um exemplo concreto, compare o custo de CPU de duas operações de disco que parecem equivalentes:

```terminal
$ time dd if=/dev/zero of=/tmp/teste bs=1M count=512 conv=fdatasync
536870912 bytes (537 MB) copied, 0.8421 s, 637 MB/s
real    0m0.842s
user    0m0.002s
sys     0m0.198s
$ time dd if=/dev/zero of=/tmp/teste bs=1M count=512 oflag=direct
536870912 bytes (537 MB) copied, 2.1423 s, 250 MB/s
real    0m2.142s
user    0m0.003s
sys     0m0.213s
```

A diferença de `real` é enorme (0.84 s vs 2.14 s), e a explicação está no que você não vê olhando só para o relógio: com `fdatasync`, o sistema escreve em RAM e sincroniza ao final; com `direct`, cada bloco vai direto ao disco sem cache. Medir apenas o tempo (`real`) sem saber qual regime de cache está em uso é tirar conclusões sobre o disco quando se está medindo RAM.

## Resumo

- Desempenho se mede em latência, vazão ou tempo de execução; escolha a que sua mudança realmente afeta.
- O `time` separa `real`, `user` e `sys`, revelando se o gargalo é CPU ou espera de E/S.
- Benchmark mede "quão rápido"; teste de estabilidade mede "aguenta"; os dois são necessários.
- Nenhuma medição isolada tem valor: variância térmica e de escalonamento exige repetição.
- A primeira execução (fria) não é comparável às seguintes (quentes) por causa de cache e warm-up.
- Compare antes e depois com o mesmo estado térmico e de cache, não números de contextos diferentes.

## Exercícios

1. Use `time` para medir `sha256sum` de um arquivo grande e identifique, na saída, qual parte é CPU (`user`/`sys`) e qual é espera (diferença para `real`).
2. Rode o mesmo `sha256sum` cinco vezes seguidas e anote os cinco tempos. Calcule a média e a diferença percentual entre o maior e o menor valor.
3. Identifique no seu Deck um processo que aparece no `top` durante a ociosidade e estime, em prosa, se ele afeta mais latência ou vazão — e justifique.
4. Escolha uma mudança que você pretende fazer no sistema e escreva, antes de executá-la, qual métrica (latência, vazão ou tempo) ela deve afetar e por quê.
5. **Desafio.** Rode `time` num arquivo logo após ligar o Deck (frio) e de novo depois de rodar o comando três vezes (quente). Explique a diferença entre os dois e proponha um protocolo de três passos que torne futuras comparações justas.
