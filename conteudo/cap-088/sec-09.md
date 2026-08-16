Monitorar a temperatura pontualmente resolve um problema; monitorar de forma contínua evita que ele apareça. O modo Gaming do SteamOS tem um overlay de desempenho embutido (o MangoHud), e o modo Desktop oferece ferramentas de linha de comando para acompanhar temperatura, clock e consumo em tempo real. Esta seção encerra o capítulo juntando monitoramento contínuo com os tweaks de potência — TDP limit, undervolt — que mudam a relação entre calor e desempenho.

:::objetivos
- Ativar e interpretar o overlay de desempenho (MangoHud) no modo Gaming
- Monitorar temperatura e clock em tempo real no Desktop
- Ajustar o limite de TDP como estratégia térmica
- Entender undervolt e seus riscos no Deck
- Registrar histórico de temperatura para análise de longo prazo
:::

## O overlay de desempenho no modo Gaming

O SteamOS traz o **MangoHud** integrado ao modo Gaming. Acesse o menu Performance (`...` → ícone de raio) e ative o "Performance Overlay". O nível 1 exibe FPS; os níveis 2 e 3 adicionam CPU/GPU, uso, clock, consumo e temperatura:

| Nível | Informação exibida |
|---|---|
| 1 | FPS apenas |
| 2 | FPS, uso e clocks de CPU/GPU |
| 3 | Inclui temperatura, consumo e frequência detalhados |
| 4 | Todas as métricas, incluindo gráficos |

No nível 3, você verá a temperatura do APU subindo junto com o clock durante cenas pesadas. É o jeito mais rápido de flagrar um jogo que leva o Deck ao throttling — sem sair do jogo.

:::dica
O overlay é sua ferramenta de "cinta térmica" cotidiana. Ao testar um jogo novo, rode os primeiros 10 minutos com o overlay no nível 3 e anote a temperatura de regime. Se ela estaciona nos 90 °C, o jogo vai sofrer throttle em sessões longas.
:::

## Monitoramento no modo Desktop

No Desktop, a linha de comando oferece o mesmo acompanhamento. O `sensors` em loop com `watch` é o mínimo; o `s-tui` (Flatpak) entrega gráficos em terminal, e o `nvtop` mostra GPU/CPU em tempo real com cores:

```terminal
$ watch -n 1 'sensors | grep -E "Tdie|junction|fan"'
Every 1s: sensors | grep -E "Tdie|junction|fan"

Tdie:         +72.0°C
junction:     +75.0°C
fan1:        4200 RPM
```

Para histórico, registre em CSV e analise depois. Um cronômetro simples com `date` resolve, ou um serviço `systemd` que grave a cada 30 segundos:

```bash
while true; do
  echo "$(date +%s),$(cat /sys/class/hwmon/hwmon0/temp1_input)" >> ~/lab/temp.log
  sleep 30
done
```

Converta depois para °C dividindo por 1000, e plote com qualquer ferramenta para enxergar a evolução ao longo de horas de uso.

## Limitando TDP como estratégia térmica

Uma das formas mais eficazes de controlar temperatura é reduzir o limite de potência (TDP) no menu Performance. Menos watts dissipados = menos calor, à custa de alguns FPS em jogos pesados. Num aparelho portátil, essa troca muitas vezes vale a pena pela bateria e pelo silêncio.

O mesmo ajuste pode ser feito por software no Desktop:

```terminal
$ cat /sys/class/hwmon/hwmon*/power1_cap
15000000
```

O `power1_cap` do `amdgpu` guarda o teto de potência em microwatts. Os 15.000.000 µW correspondem ao TDP máximo de 15 W do Deck. Reduzir esse valor limita o consumo — e, indiretamente, a temperatura — sem tocar na curva de ventoinha.

A diferença de temperatura entre 15 W e 10 W sob a mesma carga é clara:

```terminal
$ stress --cpu 8 --timeout 30s
## TDP em 15 W (padrão)
$ sensors k10temp-pci-00c3 | grep Tdie
Tdie:         +87.0°C
## TDP reduzido para 10 W no menu Performance
$ sensors k10temp-pci-00c3 | grep Tdie
Tdie:         +74.0°C
```

Treze graus a menos, com a ventoinha bem mais silenciosa — o custo é tempo de cálculo em picos curtos, algo que a maioria dos jogos portáteis mal percebe.

:::info
Reduzir o TDP não é o mesmo que undervolt. Limitar TDP apenas segura o teto de potência; o chip continua usando a tensão normal até o limite. Undervolt reduz a tensão para a mesma frequência, gerando menos calor por operação.
:::

## Undervolt e seus riscos

Undervolt é a prática de fornecer menos tensão ao chip para a mesma frequência, o que reduz calor e consumo sem perder desempenho — em tese. Cada chip tem margens diferentes, e tensão baixa demais causa travamentos e instabilidade. No Steam Deck, o undervolt exige acesso a ferramentas de terceiros e não é exposto oficialmente pela interface.

:::perigo
Undervolt agressivo provoca congelamentos, corrupção de estado e reinicializações aleatórias que parecem "defeito de hardware". O APU do Deck já sai com tensão de fábrica ajustada pela Valve; o ganho térmico do undervolt raramente compensa o risco de instabilidade num aparelho de uso diário. Prefira TDP limit e uma boa limpeza.
:::

## Resumo

- O MangoHud (overlay de desempenho) do modo Gaming mostra FPS, clock, consumo e temperatura em tempo real.
- No Desktop, `watch`+`sensors`, `s-tui` e `nvtop` cobrem o monitoramento contínuo.
- Gravar temperatura em CSV permite análise de longo prazo e detecção de degradação gradual.
- Limitar o TDP (`power1_cap`) reduz calor de forma previsível, à custa de FPS em cargas pesadas.
- Undervolt reduz calor sem perder clock, mas arrisca instabilidade e não é recomendado no Deck de uso diário.

## Exercícios

1. Ative o overlay de desempenho no nível 3 e jogue por 10 minutos. Anote a temperatura de regime e o clock máximo atingido.
2. Configure um loop que grave temperatura e clock em CSV a cada 15 segundos durante uma sessão de 30 minutos.
3. No menu Performance, reduza o TDP de 15 W para 10 W e rode `stress --cpu 8 --timeout 60s`. Compare a temperatura com o TDP máximo.
4. Leia `power1_cap` e `power1_input` do `amdgpu` e escreva a diferença entre o teto e o consumo real em idle.
5. **Desafio.** Construa, com os dados do CSV do exercício 2, um gráfico simples (qualquer ferramenta) da temperatura ao longo da sessão. Identifique os momentos de pico e relacione-os ao que você fazia no jogo. Proponha um ajuste (TDP ou curva) para manter a temperatura abaixo de 85 °C nesses picos.