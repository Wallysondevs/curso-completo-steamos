Um tweak sem medição é um desejo. Para saber se o `swappiness=1` ou o THP `always` realmente fizeram diferença, você precisa de uma linha de base, de repetições, e de uma métrica que capture os piores frames em vez da média. Esta seção ensina um método reproduzível para medir o impacto real de qualquer ajuste de memória no Steam Deck, usando as ferramentas que o próprio sistema já oferece.

:::objetivos
- Escolher métricas que revelam o efeito de tweaks de memória (1% low)
- Construir uma linha de base confiável com repetições
- Usar o MangoHud e ferramentas de linha de comando para capturar dados
- Interpretar variação entre execuções e eliminar ruído estatístico
- Documentar cada teste para poder comparar antes/depois

:::

## Por que média engana e percentil não

Duas medições podem ter o mesmo FPS médio e ainda assim uma ser objetivamente pior de jogar. A média esconde os picos de latência. O número que importa para fluidez é o **1% low** (o pior 1% dos tempos de frame) e o **0.1% low** (os piores casos extremos) — como a [seção anterior](#/cap-076/sec-07) já introduziu.

Um tweak de memória não faz a GPU renderizar mais rápido; ele evita que a GPU *pare* esperando dados. Portanto, o efeito aparece na cauda da distribuição de frames, não na média. Se você só olha o contador de FPS médio no canto da tela, vai concluir "não mudou nada" mesmo quando o tweak eliminou dez engasgos por minuto.

```terminal
$ nproc
8
$ cat /proc/loadavg
1.35 1.22 1.18 3/812 18421
```

Antes de medir, deixe o sistema em estado estável: feche aplicativos em segundo plano, espere o load cair (aqui ~1.3 com 8 núcleos está tranquilo) e desative downloads do Steam. Ruído de fundo é o maior inimigo de uma comparação limpa.

## Montando a linha de base

O princípio é: você não compara "antes" que está na sua memória com "depois" medido na hora — você compara dois números registrados, no mesmo cenário, com o mesmo número de repetições. O procedimento:

1. Escolha uma cena **fixa** e reproduzível do jogo (um trecho de benchmark embutido ou um caminho que você repete igual).
2. Rode o cenário **3 a 5 vezes** e registre os 1% low de cada execução.
3. Use a **mediana** das execuções (não a média), que resiste a um outlier isolado.

O MangoHud (instalado via Flatpak ou pelo Decky Loader) mostra 1% low em tempo real e grava um log. Para automação, o `mangohud` com a opção de logging gera um arquivo CSV com o tempo de cada frame:

```terminal
$ MANGOHUD_CONFIG=fps_limit=60,output_file=/tmp/frames.csv mangohud %command%
```

O `%command%` é o placeholder que o Steam substitui pela linha de comando do jogo. O arquivo `/tmp/frames.csv` conterá, ao fim, uma coluna com o tempo de cada frame — matéria-prima para calcular percentis.

:::info
Nem todo jogo embute benchmark. Para jogos sem benchmark, use o **mesmo caminho manual** (andar do ponto A ao B, olhar para a mesma direção) em todas as execuções. A repetição humana é imperfeita, por isso mais repetições (5+) compensam a variação.
:::

## Calculando os percentis de verdade

Depois de gerar o CSV de tempos de frame, você pode calcular os percentis com um pequeno script. A ferramenta que acompanha o MangoHud exporta os tempos; filtrar e ordenar exige só um pouco de shell ou Python:

```bash
# extrai a coluna de tempo de frame do CSV e calcula percentis
awk -F',' 'NR>1 {print $2}' /tmp/frames.csv | sort -n > /tmp/frames_sorted.txt
python3 - <<'EOF'
import statistics
times = [float(x) for x in open('/tmp/frames_sorted.txt')]
times.sort()
def pct(p):
    idx = int(len(times) * (1 - p))
    return times[idx] if idx < len(times) else times[-1]
avg = sum(times)/len(times)
print(f"média  : {1000/avg:6.1f} fps")
print(f"1% low : {1000/pct(0.01):6.1f} fps")
print(f"0.1%low: {1000/pct(0.001):6.1f} fps")
EOF
```

A saída te dá três números que contam a história toda: a média (que você já conhecia) e os dois percentis que revelam fluidez. Um tweak de memória que "melhorou" deve mover o 1% low para cima, mesmo que a média não se mexa.

```terminal
$ python3 /tmp/percentis.py
média  :   58.7 fps
1% low :   38.2 fps
0.1%low:   21.4 fps
```

## Dominando a variação

Entre uma execução e outra, o próprio sistema introduz ruído: o shader cache sendo compilado no primeiro minuto, o carregamento em segundo plano, a temperatura mudando o boost da APU. Para reduzir isso:

- **Aqueça o sistema primeiro:** rode a cena uma vez e descarte o resultado (primeira execução compila shaders).
- **Intercale os testes:** em vez de "todo o antes, depois todo o depois", alterne (A, B, A, B). Isso dilui qualquer deriva de temperatura.
- **Registre o contexto:** temperatura, clock e carga podem mudar de uma sessão para outra.

```terminal
$ sensors | grep -E 'Tctl|edge'
Tctl:         +68.5°C
edge:         +68.0°C
```

Anote a temperatura antes de cada rodada. Se o "antes" foi medido a 60°C e o "depois" a 80°C (porque você acumulou execuções), o resultado está contaminado pelo throttling térmico, não pelo tweak.

:::atencao
O maior erro de medição é comparar execuções em dias diferentes sem anotar temperatura, carga e versão do jogo. Uma atualização do jogo entre o antes e o depois invalida a comparação por completo. Sempre mantenha o jogo, o Proton e o SteamOS na mesma versão durante um teste A/B.
:::

## O protocolo completo, em passos

Junte tudo num protocolo que você pode repetir para qualquer tweak deste capítulo:

1. Capture o baseline com o estado **original**: 5 execuções, mediana dos 1% low anotada.
2. Aplique **um único** tweak (por exemplo, `swappiness=1`).
3. Repita as 5 execuções no mesmo cenário, mesma temperatura de partida.
4. Calcule a mediana do "depois" e compare com o "antes".
5. Reverta o tweak e confirme que o valor voltou ao original.

Só uma variação consistente, acima da faixa de ruído entre execuções, justifica manter o tweak. Uma diferença de 1-2 FPS no 1% low, dentro da flutuação natural, é ruído — não ganho.

:::dica
Se você quiser levar a medição a sério, o módulo **FrameView**/PresentMon ou o `mangohud` com `frametime` grafado ajudam a enxergar os engasgos como picos num gráfico, em vez de números soltos. Ver o gráfico de frame time é mais informativo que qualquer média.
:::

## Resumo

- FPS médio esconde engasgos; use 1% low e 0.1% low para avaliar tweaks de memória.
- Linha de base confiável exige cenário fixo, 3-5 repetições e mediana (não média).
- O MangoHud com `output_file` gera o CSV de tempos de frame para calcular percentis.
- Descartar a primeira execução (compilação de shader) e anotar temperatura eliminam viés.
- Alterne A/B/A/B e mantenha as versões fixas para comparações válidas.

## Exercícios

1. Configure o MangoHud para gravar tempos de frame num arquivo CSV e rode uma cena de benchmark 3 vezes. Calcule média e 1% low de cada execução.
2. Compare a primeira execução com as seguintes: há diferença sistemática (compilação de shader)? O que isso ensina sobre descartá-la?
3. Aplique um tweak de memória (ex.: `swappiness=1`) e repita o protocolo de 5 execuções. A mediana do 1% low mudou além do ruído?
4. Calcule o 0.1% low antes e depois. Onde o tweak teve mais efeito: na cauda extrema ou no 1% low?
5. **Desafio.** Repita o teste em dois jogos diferentes (um leve e um pesado) e explique por que o mesmo tweak pode dar resultado positivo num e neutro/negativo no outro, ligando com o que a [seção de causalidade](#/cap-076/sec-07) descreveu.