A temperatura é a métrica que mais rapidamente destrói o desempenho quando ignorada. Todo hardware moderno se protege: quando o chip aquece demais, ele reduz a velocidade automaticamente — o *throttling* — para não se danificar. No Steam Deck, que concentra CPU e GPU num único chip, entender a curva de temperatura é entender por que um jogo que começou a 60 FPS às vezes despenca depois de vinte minutos.

:::objetivos
- Entender o que é throttling térmico e por que ele existe
- Ler as temperaturas da CPU e da GPU no overlay
- Conhecer as faixas de temperatura seguras do Steam Deck
- Diagnosticar queda de desempenho causada por calor
:::

## Por que o chip reduz a velocidade

O throttling térmico é uma proteção, não um defeito. O silício da APU do Deck tem uma temperatura máxima de operação segura — na casa dos 100 °C para o ponto de emergência. Antes de chegar lá, o firmware começa a reduzir os clocks (a velocidade) gradualmente para segurar a temperatura numa faixa sustentável. Se a proteção não existisse, o chip superaqueceria e falharia.

O ponto crítico para entender: **o throttling é gradual e silencioso**. Não há aviso na tela. O jogo simplesmente começa a rodar mais devagar, e o FPS cai sem que nenhuma configuração tenha mudado. Por isso a queda de desempenho "gratuita" — aquela que aparece com o tempo de jogo — quase sempre é térmica.

```terminal
$ # Sintoma classico de throttling:
$ # t=0 min  : FPS 60 | temperatura GPU 68 C
$ # t=20 min : FPS 58 | temperatura GPU 92 C   <- subindo
$ # t=40 min : FPS 41 | temperatura GPU 96 C   <- throttling ativo
```

Repare que a temperatura sobe aos poucos, e o FPS cai depois dela, não antes. A sequência temporal — temperatura no teto, depois queda de FPS — é a assinatura do throttling.

## Lendo as temperaturas no overlay

No nível 3 em diante, o overlay mostra ao menos duas temperaturas: a da CPU e a da GPU (às vezes uma terceira, do SSD, no nível 4). Elas aparecem em graus Celsius, como `CPU 78 °C` ou `GPU 82 °C`.

```terminal
$ # Leitura tipica do overlay com calor:
$ # CPU 82 C | GPU 85 C | FPS 47
$ #
$ # Leitura saudavel em carga pesada:
$ # CPU 71 C | GPU 73 C | FPS 58
```

Na APU unificada, as temperaturas de CPU e GPU tendem a andar juntas, porque compartilham o mesmo die e o mesmo dissipador. Uma diferença grande e persistente entre elas é menos comum no Deck do que num PC com chips separados.

:::nota
No Modo Desktop, as mesmas temperaturas vêm dos sensores `hwmon`, expostos pelo kernel. O comando para lê-las é direto:

```terminal
$ sensors
amdgpu-pci-0400
Adapter: PCI adapter
edge:         +73.0°C  (crit = +100.0°C, hyst = +90.0°C)

k10temp-pci-00c3
Adapter: PCI adapter
Tctl:         +72.5°C
```

O `edge` da `amdgpu` é a temperatura da GPU; o `Tctl` da `k10temp` é a da CPU. O campo `crit` mostra o ponto de emergência: 100 °C.
:::

## Faixas de temperatura: o que é normal

Para interpretar qualquer leitura, você precisa de referências. No Steam Deck, as faixas práticas são:

| Faixa | Temperatura | Situação |
|---|---|---|
| Fria | Abaixo de 45 °C | Idle / jogo leve |
| Normal em jogo | 60–85 °C | Uso típico, sem problema |
| Quente | 85–95 °C | Alto, limite do que é recomendável manter |
| Crítico | Acima de 95 °C | Throttling forte, próximo do teto |

```terminal
$ # Tendências saudaveis:
$ # - Jogo leve:    55-70 C (fresco)
$ # - Jogo AAA:     75-88 C (normal para o Deck)
$ # - Pico curto:   pode tocar 90 C sem dano
$ # - Sustentado em 95+ : throttling, resfriamento insuficiente
```

O Deck foi projetado para trabalhar quente — é um aparelho portátil sem ventoinha grande. Temperaturas na casa dos 80 °C em jogo pesado são normais e não indicam defeito. O sinal de alerta é a *combinação* de temperatura alta persistente com queda de desempenho.

:::dica
Picos momentâneos de 90 °C não danificam o silício; o que desgasta e incomoda é o **calor sustentado**. Prefira monitorar a tendência em 10–15 minutos de jogo do que reagir a um pico isolado. Se a temperatura fica acima de 92 °C por vários minutos seguidos, algo está errado — ventoinha suja, saída de ar obstruída ou pasta térmica vencida.
:::

## Diagnosticando throttle com o journal

Além do número de temperatura, o SteamOS registra eventos relacionados ao gamescope no log do sistema. O `journalctl` permite confirmar se o throttling (ou outros eventos) aconteceu de verdade.

```terminal
$ journalctl -u gamescope --since "10 minutes ago" | grep -i -E 'throttl|thermal|clock' | tail -20
[... 3 linhas omitidas ...]
```

Nem sempre o gamescope emite linhas explícitas de "throttle" — muito do gerenciamento térmico é feito pelo firmware da APU, fora do alcance do log. Mas o `journalctl -u gamescope` ainda é útil para ver reinícios, erros de composição e falhas de frame que acompanham o aquecimento.

:::atencao
Não confunda a queda de FPS do throttling com a queda por **limite de potência TDP** que você mesmo configura. Se você baixou o TDP manualmente para economizar bateria, a queda de desempenho é esperada e não térmica. A forma de distinguir: suba o TDP de volta ao máximo por um minuto — se o FPS voltar, era limite de potência; se continuar baixo com temperatura no teto, é throttling térmico.
:::

## Mitigando o calor

Quando o throttling é confirmado, as ações são simples, em ordem de custo crescente:

- **Verifique o fluxo de ar.** A saída de ar do Deck fica em cima (perto dos gatilhos). Cobertores, almofadas e capas grossas bloqueiam essa saída — a causa número um de superaquecimento em uso portátil.
- **Reduza o TDP ou o limite de FPS.** Menos potência gera menos calor; travar a 40 FPS reduz a temperatura mais do que qualquer configuração gráfica.
- **Limpe a ventoinha.** Poeira acumulada reduz a eficiência do dissipador com o tempo.

```terminal
$ # Sempre que jogar deitado ou no sofa, confira se a grade superior
$ # (onde fica a saida de ar, junto aos gatilhos) esta livre.
$ # Um bom teste: segure o Deck no ar vs. apoiado numa almofada
$ # e compare a temperatura em 5 minutos de jogo.
```

## Resumo

- Throttling térmico é a redução automática de clocks para proteger o chip do superaquecimento.
- O sintoma característico é FPS caindo gradualmente depois de 20–40 minutos de jogo, com temperatura no teto.
- O Steam Deck trabalha normalmente entre 60 e 85 °C em jogo; picos de 90 °C são aceitáveis, mas 95 °C sustentado é alerta.
- No Modo Desktop, `sensors` lê as temperaturas da APU via `hwmon`.
- A causa mais comum de superaquecimento é a saída de ar obstruída em uso portátil.

## Exercícios

1. Rode um jogo AAA por 15 minutos e anote a temperatura a cada 5 minutos. Ela estabiliza ou segue subindo?
2. Compareção: jogue o mesmo jogo com o Deck apoiado numa almofada e depois no ar. A temperatura muda?
3. No Modo Desktop, rode `sensors` e identifique as linhas `Tctl` (CPU) e `edge` (GPU).
4. Trave o FPS em 40 num jogo pesado e observe quanto a temperatura cai em 10 minutos em relação a 60 FPS ilimitado.
5. **Desafio.** Combine o que aprendeu nesta seção com a leitura de frametime: durante um throttling, o frametime sobe uniformemente ou aparecem espinhos? Justifique ligando a queda de clock à natureza da desaceleração térmica.
