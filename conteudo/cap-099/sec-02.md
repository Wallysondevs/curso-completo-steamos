Antes de trocar peça ou mexer em configuração, você precisa de um número que responda "o meu sistema, agora, sem mudança nenhuma, é assim". Esse número é o **baseline**. Sem ele, você não tem contra o que comparar; pior, você pode achar que seu ajuste melhorou algo quando o valor "antes" que você lembrava estava errado. Esta seção ensina a metodologia para obter um baseline que sobreviva ao escrutínio.

:::objetivos
- Criar um protocolo de medição que controle variáveis externas
- Aplicar repetição estatística com warm-up e descarte
- Isolar o sistema de ruído durante a medição
- Documentar o baseline de forma reprodutível
- Entender o papel do `nice` e dos governadores de CPU
:::

## O protocolo: ambiente, aquecimento, repetição

Um baseline decente tem três pernas. **Ambiente** controlado significa: modo avião ligado (sem notificações, sem sincronia de nuvem), Steam fechado se ela não for o alvo do teste, serviços em segundo plano anotados, carregador plugado para eliminar economia de energia da bateria. Se você está medindo disco, desmonte partições que não interessam e garanta que nenhum *daemon* esteja varrendo arquivos.

```terminal
$ systemctl --user list-units --state=running | grep -i -E 'steam|index|sync|baloo|tracker'
$ echo $?
```

Verificar quais serviços de usuário estão rodando antes de medir evita que um indexador de arquivos coma 30% de disco bem no meio do teste de E/S.

**Aquecimento** é rodar a carga-alvo pelo menos uma vez e descartar o resultado. Na primeira execução o kernel carrega páginas do disco, aloca buffers, o cache de CPU está frio e o processador pode estar em frequência baixa por inatividade. A segunda execução já parte de um estado mais estável.

**Repetição** é rodar o benchmark de 3 a 5 vezes, descartar o valor mais extremo e trabalhar com a mediana. Mediana é mais robusta que média quando há *outliers* — e sempre há outliers em máquina real.

```terminal
$ for i in $(seq 1 6); do
>   echo "Rodada $i:"
>   time -p sha256sum ~/lab/steam.img >/dev/null 2>> /tmp/bench_times.txt
> done
$ cat /tmp/bench_times.txt
Rodada 1: real 4.21
Rodada 2: real 3.82
Rodada 3: real 3.85
Rodada 4: real 3.79
Rodada 5: real 3.83
Rodada 6: real 3.81
```

A rodada 1 (4.21 s) é visivelmente mais alta — é o warm-up. Descarte-a. Das cinco restantes (3.82, 3.85, 3.79, 3.83, 3.81), a mediana é 3.82 s. Esse é o baseline de hash SHA-256 do arquivo `steam.img`. Não é "o número verdadeiro", é um número com baixa incerteza sob condições que você documentou.

## Controlando a frequência da CPU

O maior fator de variância em hardware móvel é a frequência dinâmica. O kernel do SteamOS usa o governador `schedutil` (ou `powersave` em certos kernels), que ajusta a frequência centenas de vezes por segundo conforme a carga. Isso é ótimo para bateria, mas para benchmark é um pesadelo — duas execuções com a mesma carga podem começar com frequências diferentes.

```terminal
$ cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor
schedutil
$ cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_available_governors
performance powersave schedutil
$ cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq
1400000
```

A leitura do governador atual, da lista de governadores disponíveis e da frequência atual mostra o estado. Para um benchmark de CPU você pode fixar o governador em `performance` durante o teste, o que mantém o clock no máximo:

```terminal
$ sudo cpupower frequency-set -g performance
Setting cpu: 0
Setting cpu: 1
...
$ cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor
performance
$ cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq
2795000
```

Note que a frequência saltou de 1.4 GHz para 2.8 GHz. Qualquer benchmark feito antes e depois dessa mudança mediria o governador, não o sistema.

:::perigo
Fixar o governador em `performance` esquenta a máquina e drena bateria. Use **apenas durante o benchmark** e volte ao `schedutil` depois. Para testes de estabilidade (seção 7), você **quer** que a frequência flutue, porque o comportamento sob throttling térmico faz parte do que está sendo testado.
:::

Se você não pode ou não quer mexer no governador, a alternativa é garantir que a carga de aquecimento seja longa o suficiente para o processador já estar na frequência máxima estável quando o teste real começar.

## Isolando processos e usando nice

Quanto mais processos competindo por CPU e disco durante o benchmark, maior a variância. O ideal é reduzir o sistema ao essencial. No Steam Deck, o modo Desktop já carrega vários serviços gráficos; você pode criar um *tmpfiles* de benchmark com um ambiente mínimo.

Para o caso comum de benchmark de CPU, você pode dar ao processo sob teste prioridade máxima de escalonamento:

```terminal
$ sudo nice -n -20 sysbench cpu --threads=8 --time=30 run
sysbench 1.0.20 (using bundled LuaJIT 2.1.0-beta3)

Running the test with following options:
Number of threads: 8
Prime numbers limit: 10000
Maximum execution time: 30s

CPU speed:
    events per second: 12847.32

General statistics:
    total time:                          30.0000s
    total number of events:              385436
```

O `nice -n -20` garante que o processo não vai ser preterido pelo escalonador. Mas, de novo, isso é um teste de "capacidade bruta", não um teste de "como o sistema se comporta no mundo real". Os dois cenários são válidos e diferentes — seu baseline precisa documentar qual deles você escolheu.

## O documento de baseline

O baseline não é um número solto; é um pequeno relatório. Crie um arquivo `~/lab/baseline-$(date -I).md` com este formato:

```text
## CPU
sysbench cpu --threads=8 --time=30: 12847 eventos/segundo (mediana de 5, governador schedutil)

## Disco
fio randread 4K: 48.2 MB/s, 11789 IOPS (mediana de 3, fsync=1)

## Memória
sysbench memory --memory-block-size=1M --memory-total-size=4G: 8134 MB/s

## Condições
- SteamOS 3.6.20, kernel 6.8
- Modo Desktop, Wi-Fi desligado, carregador conectado
- Temperatura ambiente ~23 °C
- Serviços em segundo plano: pipewire, kdeconnect (anotados)
```

:::dica
Inclua no baseline a versão exata do sistema (`cat /etc/os-release | grep VERSION`) e a data. Quando você repetir o benchmark daqui a três meses, vai querer saber se o sistema era o mesmo ou se uma atualização entrou no meio e explica a diferença.
:::

## Resumo

- Baseline é a medição do estado atual, antes de qualquer mudança, sob condições documentadas.
- O protocolo exige ambiente controlado, warm-up com descarte e repetição com uso da mediana.
- O governador de CPU `schedutil` introduz variância; fixe-o em `performance` apenas durante benchmark.
- `nice -n -20` isola o processo para medir capacidade bruta, mas não representa uso real do dia a dia.
- Documente o baseline com versão do sistema, condições ambientais e serviços ativos.

## Exercícios

1. Liste os serviços de usuário rodando no seu Deck com `systemctl --user list-units --state=running`. Identifique dois que poderiam interferir num benchmark de disco e explique por quê.
2. Leia o governador atual e a frequência de todos os núcleos com `cat /sys/devices/system/cpu/cpu*/cpufreq/scaling_cur_freq`. Há variação entre núcleos ociosos? Anote a maior e a menor.
3. Escolha um benchmark simples (`sha256sum` ou `dd`) e execute o protocolo completo: aquecimento, cinco rodadas, descarte da primeira, mediana das quatro restantes. Documente o ambiente.
4. Compare o resultado do mesmo benchmark com `nice -n -20` e sem ele. A diferença é maior ou menor do que a variância entre rodadas consecutivas?
5. **Desafio.** Crie um baseline completo do seu Deck em `~/lab/baseline-$(date -I).md` com CPU, disco e memória, e deixe o arquivo pronto para comparação futura. Inclua na documentação o governador usado e se o carregador estava conectado.