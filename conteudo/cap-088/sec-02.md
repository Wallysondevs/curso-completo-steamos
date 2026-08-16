O APU (Accelerated Processing Unit) que equipa o Steam Deck é uma peça da AMD com CPU Zen 2 e GPU RDNA 2 no mesmo die de silício, e isso significa que a temperatura do processador e da placa gráfica são faces da mesma moeda. Saber ler cada sensor do APU — e entender as diferenças entre as métricas — permite separar o normal do preocupante. Esta seção foca nos sensores específicos do chip AMD e nas armadilhas comuns de interpretação.

:::objetivos
- Ler a temperatura do APU via `k10temp`, `zenpower` e `amdgpu`
- Distinguir Tctl, Tdie, edge e junction
- Entender o offset térmico em chips AMD
- Medir temperatura durante carga real com `stress` e `s-tui`
- Relacionar temperatura do APU com consumo em watts
:::

## O sensor k10temp e suas temperaturas

O `k10temp` é o driver oficial do kernel para a família de processadores AMD desde a arquitetura K10 (2007). No Steam Deck, ele expõe duas ou três temperaturas, dependendo da versão do kernel do SteamOS:

```terminal
$ sensors k10temp-pci-00c3
k10temp-pci-00c3
Adapter: PCI adapter
Tctl:         +54.0°C
Tdie:         +54.0°C
Tccd1:        +52.0°C
```

`Tctl` é a temperatura de controle: é o valor que o firmware da placa usa para decisões de throttling e acionamento da ventoinha. Nos APUs mobile como os do Deck, `Tctl` e `Tdie` são iguais porque a AMD não aplica offset nessa linha — mas em CPUs de desktop Ryzen, há um deslocamento fixo (ex.: 10 °C) para padronizar o comportamento dos coolers.

`Tccd1` (temperature of compute core die) é uma leitura do CCD (core complex die), indisponível em alguns kernels mais antigos. Quando presente, reflete a temperatura média dos núcleos de CPU, enquanto `Tdie` é a temperatura do die como um todo (CPU + GPU + controlador de memória).

## O sensor amdgpu e a GPU

A GPU integrada também aparece como um sensor `hwmon` separado, gerenciado pelo driver `amdgpu`. Ele reporta no mínimo duas temperaturas:

```terminal
$ sensors amdgpu-pci-0400
amdgpu-pci-0400
Adapter: PCI adapter
edge:         +49.0°C
junction:     +53.0°C
slowPPT:       8.50 W
```

A `edge` é a borda da GPU (temperatura da superfície do die, mais baixa e mais lenta para subir). A `junction` é a temperatura de junção interna da GPU, medida por um sensor dentro do bloco gráfico — esse é o valor que a GPU usa para decidir se reduz clocks, e costuma ser o mais quente sob carga intensa. A diferença entre `edge` e `junction` raramente passa de 5 °C em operação normal; uma diferença superior a 10 °C em idle pode indicar problema de pasta térmica ou montagem do dissipador.

:::dica
Em sessões de gaming, a GPU esquenta mais que a CPU. O Steam Deck foi projetado para cargas mistas, mas jogos que saturam a GPU (shaders pesados, rotação de cena) elevam `junction` até o teto térmico antes mesmo de os núcleos Zen 2 atingirem o máximo.
:::

## Consumo e temperatura andam juntos

O APU consome entre 4 e 15 watts — o TDP configurável vai de 4 a 15 W no Deck. A temperatura sobe proporcionalmente à potência dissipada, mas com um atraso: o die aquece em segundos; a carcaça, em minutos. Medir o consumo simultâneo dá contexto para cada leitura de temperatura:

```terminal
$ cat /sys/class/hwmon/hwmon*/power1_input
8500000
```

Em `amdgpu`, o arquivo `power1_input` entrega o consumo em **microwatts** (µW). Os 8.500.000 µW acima equivalem a 8,5 W — valor típico de um Deck em idle no modo Desktop com brilho médio.

:::info
SteamOS 3.6 permite ajustar o TDP via interface do modo Gaming (menu Performance), mas o kernel expõe o consumo real independentemente do limite configurado. O que o menu limita é o **teto**, não o consumo efetivo, que depende da carga.
:::

## Gerando carga para testar

Para ver como a temperatura sobe e a ventoinha responde, você pode provocar uma carga controlada. O pacote `stress` (disponível via `pacman`) é uma opção, mas a ferramenta `s-tui` (Flatpak) oferece interface de terminal com gráficos:

```terminal
$ stress --cpu 8 --timeout 30s &
stress: info: [12345] dispatching hogs: 8 cpu, 0 io, 0 vm, 0 hdd
$ sensors k10temp-pci-00c3 | grep Tdie
Tdie:         +87.0°C
```

Aqui, saturar os 8 threads Zen 2 durante 30 segundos já eleva o die de ~54 °C para ~87 °C — a ventoinha audível a partir de 65 °C confirma que o controle térmico está agindo. Aos 90 °C, o firmware começa a reduzir clock; passaremos a isso no [capítulo sobre throttling](#/cap-088/sec-06).

:::atencao
Rodar `stress` no máximo por períodos muito longos (minutos) pode elevar a temperatura até o ponto de throttling agressivo. Em bancada, use intervalos curtos e monitore no mesmo terminal, com `watch -n 1 sensors`.
:::

## Resumo

- O driver `k10temp` expõe `Tctl` (controle), `Tdie` (die) e opcionalmente `Tccd1` (núcleos CPU).
- O driver `amdgpu` expõe `edge` (borda) e `junction` (junção interna) da GPU integrada.
- O consumo do APU é medido pelo arquivo `power1_input` do `amdgpu`, em microwatts.
- A diferença entre `edge` e `junction` acima de 10 °C em idle sugere problema de contato térmico.
- Cargas sintéticas como `stress` permitem testar a rampa de temperatura da ventoinha e o ponto de throttling.

## Exercícios

1. Com o Deck em idle por pelo menos 2 minutos, anote `Tctl`, `Tdie`, `edge` e `junction`. Depois abra um jogo leve e repita.
2. Compare `power1_input` em idle, durante um jogo e durante `stress --cpu 4 --timeout 20s`. Converta os microwatts para watts.
3. Identifique se o seu kernel expõe `Tccd1`. Se sim, compare-o com `Tdie` sob carga — a diferença é grande?
4. Rode `watch -n 1 'sensors | grep -E "Tdie|junction"'` e dispare `stress --cpu 8 --timeout 20s`. Anote o pico e o tempo que levou para atingi-lo.
5. **Desafio.** Escreva um script que monitore `Tdie` a cada segundo e grave um CSV com timestamp e temperatura. Reproduza uma carga de jogo por 5 minutos e identifique o instante exato em que a ventoinha audível entrou em ação, cruzando com a temperatura registrada.