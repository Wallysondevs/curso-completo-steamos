O `vm.swappiness` é o parâmetro de kernel mais mal-entendido entre quem otimiza Linux. A crença popular é "abaixe para 1 e o sistema usará menos swap", mas a verdade é mais sutil: esse número não diz *se* o sistema troca memória, e sim *o quão agressivamente* ele prefere trocar em vez de descartar cache. Num Steam Deck, decidir esse valor corretamente exige entender cache de página e a diferença entre RAM "suja" e "limpa".

:::objetivos
- Entender o que `vm.swappiness` mede de fato, além do mito
- Diferenciar cache de página, memória anônima e o papel de cada um
- Ler e alterar o swappiness em tempo real
- Avaliar o valor certo para jogos no Steam Deck
- Relacionar swappiness com zram e com o trabalho do OOM
:::

## O mito que não morre

Se você perguntar num fórum "como liberar RAM no Linux", a resposta automática será `vm.swappiness=10`. A ideia implícita é que o número é um botão de "quanto swap usar": 100 usaria tudo, 0 usaria nada. Não é assim.

O que o swappiness controla é a **balança** entre duas fontes de memória que o kernel pode sacrificar quando a RAM aperta: a *memória anônima* (dados de processos, como heap e pilhas — o que chamamos de "memória do jogo") e o *cache de página* (arquivos lidos do disco que ficam guardados em RAM para acelerar o próximo acesso).

Um swappiness alto (perto de 100) diz ao kernel: "prefira tirar a memória de processos para o swap e manter o cache". Um valor baixo (perto de 0) diz: "prefira descartar cache antes de tocar na memória dos processos". Nenhum dos dois *proíbe* o swap.

```terminal
$ sysctl vm.swappiness
vm.swappiness = 100
```

O SteamOS 3.6, seguindo o padrão do Ubuntu, entrega `swappiness=100`. Isso assusta quem acha que 100 é "ruim", mas faz sentido para um dispositivo com zram veloz: o kernel não tem medo de trocar, porque "trocar" aqui é comprimir em RAM, barato.

## Cache de página e memória anônima

Para ler o swappiness direito, você precisa distinguir os dois tipos de memória que ele arbitra:

- **Cache de página (page cache)** é o conteúdo de arquivos que o sistema já leu — texturas de jogos, bibliotecas do Proton, shaders. Ele pode ser *descartado* instantaneamente (basta relê-lo do disco quando precisar). Nada é perdido, no máximo um acesso a disco depois.
- **Memória anônima** é o estado vivo dos processos — variáveis, buffers do jogo, pilhas. Não há um arquivo "por trás" para reler: se sair da RAM, vai para o swap.

A decisão do kernel é, então, uma troca de custos: descartar cache custa um futuro acesso ao disco; enviar memória anônima ao zram custa CPU de compressão agora. O swappiness define o ponto de equilíbrio.

:::info
O cache de página não é "memória desperdiçada". É por isso que o `free` mostra tanto espaço em `buff/cache` mesmo após fechar programas. Esse cache é o que faz o segundo carregamento de um nível ser mais rápido que o primeiro. Descartá-lo agressivamente pode causar micro-travadas em jogos que realimentam texturas constantemente.
:::

## Alterando o valor em tempo real

O swappiness pode ser lido e escrito sem reiniciar, diretamente no `/proc`:

```terminal
# echo 1 > /proc/sys/vm/swappiness
# cat /proc/sys/vm/swappiness
1
```

Esse ajuste vale até o próximo boot. Para torná-lo persistente, o caminho padrão é um arquivo em `/etc/sysctl.d/`:

```bash
echo "vm.swappiness=1" | sudo tee /etc/sysctl.d/99-deck-custom.conf
sudo sysctl --system
```

Lembre-se de que no SteamOS o `/etc` pode estar em modo somente leitura, exigindo `steamos-readonly disable` primeiro — assunto já tratado na [seção de abertura do capítulo](#/cap-076/sec-01). O `sysctl --system` recarrega todos os arquivos da pasta sem reiniciar.

O CryoUtilities recomenda `swappiness=1`. O raciocínio é: num jogo, você quer que o cache de texturas permaneça em RAM o máximo possível, porque relê-lo do disco causa *stutter* (engasgo). Mantendo a memória anônima fora do swap, você preserva o working set do jogo.

:::atencao
`swappiness=1` tem um efeito colateral que muita gente não percebe: o cache de página cresce sem freio e só é descartado quando não houver mais alternativa. Em jogos muito pesados, isso pode levar o sistema a um ponto onde ele descarta uma rajada de cache de uma vez — exatamente o stutter que você tentava evitar. O valor ideal é contexto-dependente, não um dogma.
:::

## Swappiness com zram muda a conta

Quando o "swap" é o zram, o swappiness alto deixa de ser o vilão. Trocando memória anônima para o zram, o custo é CPU de compressão — muito menor que o custo de reler texturas do SSD. Por isso o padrão `100` do SteamOS é defensável: com zram rápido, trocar agressivamente e *preservar o cache de página* costuma dar mais fluidez do que baixar o swappiness para 1 e manter a memória dos processos parada enquanto o cache inunda a RAM.

```terminal
$ free -h
               total        used        free      shared  buff/cache   available
Mem:            15Gi       8.8Gi       1.1Gi       510Mi       5.3Gi       5.4Gi
Swap:          8.0Gi       1.2Gi       6.8Gi
```

Nesta saída, com `swappiness=100`, há 1,2 GB já no zram e 5,3 GB de cache preservado. Para um jogo que acabou de carregar texturas, esse perfil é geralmente bom: o cache fica disponível para relê-las sem tocar no SSD.

:::dica
Em vez de adotar `1` ou `100` por fé, teste três valores (1, 60 e 100) numa mesma cena do jogo e compare 1% low FPS com o MangoHud. A [seção de medição](#/cap-076/sec-08) ensina como fazer isso sem cair em ruído estatístico.
:::

## Resumo

- `vm.swappiness` não proíbe swap; ele balanceia entre trocar memória anônima e descartar cache de página.
- Swappiness alto prefere preservar cache (relê-lo do disco causa stutter em jogos); baixo prefere manter a memória dos processos.
- O SteamOS usa `100`, coerente com um zram de compressão barata.
- O valor é alterável em tempo real via `/proc/sys/vm/swappiness` e persistente via `sysctl.d`.
- Com zram, "trocar" é comprimir em RAM, o que muda o cálculo e torna o `1` menos universal do que parece.

## Exercícios

1. Rode `sysctl vm.swappiness` e explique, com suas palavras, o que o valor atual está dizendo ao kernel.
2. Use `free -h` num jogo aberto e cataloge quanto há de `buff/cache` e quanto de `Swap` em uso. O que isso sugere sobre a pressão de memória?
3. Mude o swappiness para 1 com `echo 1 | sudo tee /proc/sys/vm/swappiness` e depois volte para o original. Confirme a mudança com `cat`.
4. Crie um arquivo persistente em `/etc/sysctl.d/` com um valor de teste, aplique com `sysctl --system` e verifique. Depois remova o arquivo.
5. **Desafio.** Relacione swappiness, cache de página e OOM-killer: explique por que um swappiness muito baixo *junto com* um zram pequeno pode aumentar a chance de o kernel matar o processo do jogo.
