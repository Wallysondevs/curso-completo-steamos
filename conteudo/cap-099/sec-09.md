Você mede, coleta, monitora — e no fim tem uma pilha de números. A última etapa, a que separa um benchmark útil de um amontoado de dados, é a interpretação. Um resultado de benchmark só vira conhecimento quando você sabe filtrar o ruído, calcular variabilidade, decidir se uma diferença é real ou acaso, e comunicar o que descobriu. Esta seção fecha o capítulo com o método para tirar conclusões defensáveis.

:::objetivos
- Calcular mediana, média e desvio padrão de uma série de medições
- Decidir se uma diferença entre dois resultados é estatisticamente significativa
- Reconhecer vieses e armadilhas comuns de interpretação
- Construir gráficos simples de frametime a partir de CSVs
- Documentar conclusões com incerteza, não com falsa certeza

:::

## Da série de números ao resumo

Uma série de medições não se resume sozinha. As três estatísticas que você precisa saber extrair são a **mediana** (o valor central), a **média** (soma dividida pela contagem) e o **desvio padrão** (o quanto os valores se espalham ao redor da média). A mediana resiste a outliers; a média é sensível a eles — por isso mediana é a escolha correta para resumir tempo de execução.

```terminal
$ cat /tmp/tempos.txt
3.82
3.85
3.79
3.83
3.81
$ sort -n /tmp/tempos.txt | awk '{a[NR]=$1; s+=$1} END {
    printf "media=%.4f\n", s/NR
    if (NR%2) printf "mediana=%.4f\n", a[(NR+1)/2]
    else printf "mediana=%.4f\n", (a[NR/2]+a[NR/2+1])/2
  }'
media=3.8200
mediana=3.8200
```

Para desvio padrão, o `awk` fica mais longo; o `python` simplifica:

```terminal
$ python3 -c "
import statistics
d=[3.82,3.85,3.79,3.83,3.81]
print('media', round(statistics.mean(d),4))
print('mediana', round(statistics.median(d),4))
print('desvio', round(statistics.stdev(d),4))
"
media 3.82
mediana 3.82
desvio 0.0224
```

Desvio padrão de 0.0224 s sobre uma média de 3.82 s é uma variação de ~0.6%. Esse é um benchmark *apertado*: a variabilidade entre rodadas é pequena. Se o desvio fosse 10% da média, você saberia que o ambiente está instável e que qualquer comparação de "antes vs depois" com diferenças menores que 10% seria ruído.

:::dica
Uma regra de bolso honesta: se a diferença entre "antes" e "depois" é **menor que o desvio padrão** de qualquer um dos lados, ela não é confiável. Diferenças na casa de 1–2% em benchmarks com 3–5% de ruído são conclusão nenhuma, por mais que o número "depois" pareça maior.
:::

## Diferença real ou acaso?

O coração da interpretação é responder: a mudança que vejo poderia ter acontecido por acaso? Para isso você compara não dois números, mas duas **distribuições**. Execute o benchmark várias vezes antes e várias vezes depois, e compare as faixas.

```terminal
$ python3 -c "
import statistics
antes=[3.82,3.85,3.79,3.83,3.81]
depois=[3.71,3.68,3.74,3.70,3.72]
print('antes:', statistics.median(antes))
print('depois:', statistics.median(depois))
print('delta %:', round((statistics.median(depois)/statistics.median(antes)-1)*100,2))
"
antes: 3.82
depois: 3.71
delta %: -2.88
```

A mediana caiu de 3.82 para 3.71, uma melhora de ~2.9%. Isso é real? As duas faixas não se sobrepõem (todas as execuções de "depois" são menores que todas as de "antes"), o que é um bom sinal. Mas 2.9% em tempo de hash pode ser simplesmente diferença térmica, não sua otimização. A confiança cresce com mais repetições e maior distância entre as distribuições.

Para uma checagem mais rigorosa, o teste estatístico clássico é o teste-t (ou Mann-Whitney, que não assume distribuição normal):

```terminal
$ python3 -c "
from scipy import stats
antes=[3.82,3.85,3.79,3.83,3.81]
depois=[3.71,3.68,3.74,3.70,3.72]
print('p-value', stats.mannwhitneyu(antes, depois, alternative='two-sided').pvalue)
"
p-value 0.007937
```

Um p-value de ~0.008 (abaixo do limiar usual de 0.05) sugere que a diferença provavelmente não é acaso. Mas não confunda significância estatística com importância prática: 2.9% pode ser estatisticamente real e ainda assim irrelevante para o usuário. As duas coisas precisam andar juntas.

:::atencao
Não caia na armadilha do p-value baixo como selo de "verdade". Com repetições suficientes, até diferenças minúsculas viram "significativas". A pergunta que importa no fim é: **essa diferença muda a experiência de alguém?** Um ganho de 2% em carregamento de jogo raramente vale o risco de uma configuração nova.
:::

## Visualizando frametimes

Para dados de GPU coletados em CSV (como o MangoHud da seção 6), um histograma de frametime vale mais que mil médias. Ele revela *stutter* que a média esconde:

```terminal
$ python3 -c "
import csv, collections
from statistics import mean
rows = list(csv.reader(open('/tmp/bench.csv')))
hdr = rows[0]; data = rows[1:]
ft = [float(r[hdr.index('frametime')]) for r in data]
buckets = collections.Counter(round(f,1) for f in ft)
for k in sorted(buckets): print(f'{k:5.2f}ms', '#'*int(buckets[k]/max(buckets.values())*40))
print('média', round(mean(ft),2), 'ms  |  max', max(ft), 'ms')
"
 8.00ms ########################################
 8.10ms #################
16.00ms ##
16.50ms #
33.00ms #
```

Aqui a maioria dos frames leva ~8 ms (≈120 FPS), mas há respingos ocasionais em 16.5 ms e 33 ms — os *stutters*. A média de frametime ficaria em ~8.2 ms e reportaria "115 FPS", escondendo completamente o fato de que a cena engasga esporadicamente. Olhar o histograma (ou o percentil 99) é a diferença entre "roda liso" e "roda com engasgos".

## A conclusão que você pode defender

Uma conclusão de benchmark defensável tem três partes: **o número** (com sua incerteza), **as condições** (que já vêm do baseline da seção 2) e **a limitação**. Um bom exemplo:

> "Comprime 1 GB em 3.71 s (mediana de 5 execuções, desvio 0.02 s), contra 3.82 s antes da mudança, uma melhora de ~2.9% mantida com carregador conectado e governador schedutil. Limitação: medi apenas SHA-256, que não representa cargas de E/S ou GPU; não posso extrapolar para jogos."

Repare que a conclusão declara o alcance do que foi medido e, explicitamente, o que **não** foi provado. Esse é o hábito que converte benchmarking de passatempo em disciplina de engenharia.

:::info
Ferramentas como o `hyperfine` (benchmark de linha de comando) fazem exatamente o protocolo que você aprendeu aqui automaticamente: warm-up, múltiplas execuções e relatório com desvio padrão. Vale instalá-lo (`sudo apt install hyperfine`) e usá-lo como atalho nos casos de benchmark de comando único.
:::

## Resumo

- Resuma séries com mediana (robusta) e desvio padrão (mede o espalhamento), não só com média.
- Diferença menor que o desvio padrão entre antes/depois não é confiável — é ruído.
- Compare distribuições inteiras, não dois números; o teste de Mann-Whitney quantifica a chance de acaso.
- Significância estatística não é importância prática: pergunte se a diferença muda a experiência.
- Histograma de frametime revela *stutter* que a média de FPS esconde; veja também o percentil 99.
- Conclusão defensável junta o número, as condições e, explicitamente, a limitação do alcance.

## Exercícios

1. Gere 10 tempos de um benchmark curto, calcule mediana, média e desvio padrão (à mão, com `awk`, ou `python`). Qual estatística é mais próxima da maioria dos valores?
2. Rode o mesmo benchmark 5 vezes "antes" e 5 vezes "depois" de uma mudança pequena (ex.: nice -n -20 vs padrão). Compare as medianas e as faixas — a diferença é maior que o desvio padrão?
3. Use `python3` com `scipy.stats.mannwhitneyu` nas duas séries da questão anterior. O p-value sugere diferença real?
4. A partir de um CSV de frametime (MangoHud), monte um histograma em texto como o modelo da seção. Identifique o valor modal e quaisquer picos de *stutter*.
5. **Desafio.** Escreva um parágrafo de conclusão completo (número + incerteza + condições + limitação) sobre os resultados que você acumulou neste capítulo, seguindo o modelo da seção. Depois instale o `hyperfine` e rode o mesmo benchmark nele, comparando se o `hyperfine` chegou à mesma mediana que o seu protocolo manual.