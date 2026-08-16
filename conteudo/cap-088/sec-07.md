Entre o die do APU e o dissipador de cobre existe uma camada finíssima de material que faz mais diferença do que parece: a pasta térmica. Ela preenche as imperfeições microscópicas das duas superfícies, porque ar parado é um isolante terrível e nenhuma superfície é perfeitamente plana. Com o tempo, a pasta resseca, perde condutividade e vira o vilão silencioso do superaquecimento em aparelhos usados. Esta seção explica o que a pasta faz, como ela degrada e quando (e como) vale a pena trocar.

:::objetivos
- Entender a função da interface térmica (TIM) entre die e dissipador
- Conhecer tipos de pasta e a importância da condutividade (W/m·K)
- Reconhecer os sinais de pasta degradada pelo comportamento térmico
- Conhecer o procedimento seguro de troca no Steam Deck
- Entender riscos e quando procurar assistência
:::

## Por que existe pasta térmica

Se você encostar o dissipador diretamente no die do APU, o contato real entre os metais será mínimo: sob microscópio, as duas superfícies têm picos e vales, e o espaço entre eles fica cheio de ar. O ar conduz calor cerca de 0,026 W/m·K — péssimo. O metal dissolve o calor com 100 a 400 W/m·K.

A pasta térmica (ou TIM, thermal interface material) resolve isso preenchendo os vales. Sua condutividade (tipicamente 4 a 12 W/m·K para pastas comuns) é muito pior que a do metal, mas **muito** melhor que a do ar. Como a camada é fina, o resultado geral é fluxo de calor eficiente do die para o dissipador.

:::nota
A frase-chave é "camada fina": pasta demais é tão ruim quanto pasta de menos. A função é só eliminar o ar, não criar uma "almofada" — camadas grossas adicionam resistência térmica porque a pasta continua sendo pior condutora que o metal.
:::

## Tipos de interface térmica

Nem toda interface é a tradicional pasta em seringa:

| Tipo | Condutividade típica | Notas |
|---|---|---|
| Pasta de silicone (comum) | 4–8 W/m·K | Barata, fácil, seca com anos |
| Pasta com metal líquido | 40–80 W/m·K | Excelente, corrosiva e condutora de eletricidade |
| Thermal pad (espuma) | 1–6 W/m·K | Usada em gaps maiores, menos eficiente |
| Metal líquido (aplicação OEM) | ~40–80 W/m·K | O Steam Deck usa pasta, não liquid metal |

O Steam Deck OLED e o LCD saem de fábrica com pasta térmica padrão, não metal líquido — o que torna a troca, quando necessária, mais simples e segura. Metal líquido exige técnica avançada e é condutor de eletricidade: um vazamento pode curto-circuitar componentes.

## Sinais de pasta degradada

A pasta térmica não falha de um dia para o outro; ela **resseca** e perde a maleabilidade ao longo de anos, especialmente sob ciclos de aquecimento intenso. Os sintomas que sugerem troca:

- Temperatura elevada em idle (acima de 60 °C) mesmo com a ventoinha girando
- Diferença entre `edge` e `junction` da GPU acima de 10 °C (contato desigual)
- Throttling em jogos leves que antes rodavam sem ele
- Ventoinha a máximo o tempo todo sem conseguir derrubar a temperatura

O sinal mais mensurável é a diferença edge‑junction. Com a pasta íntegra, as duas leituras andam próximas:

```terminal
$ sensors amdgpu-pci-0400
amdgpu-pci-0400
Adapter: PCI adapter
edge:         +78.0°C
junction:     +82.0°C
```

A diferença de 4 °C é normal. Quando a pasta está seca ou mal distribuída, a junção sobe muito mais que a borda porque o calor se acumula em pontos específicos do die sem conseguir atravessar.

:::atencao
Antes de culpar a pasta, descarte as causas baratas: grade de ar bloqueada, aletas com poeira e curva de ventoinha alterada. A troca de pasta é invasiva (exige abrir o aparelho) e não deve ser o primeiro palpite.
:::

## Quando e como trocar

A troca de pasta no Steam Deck envolve abrir a carcaça, remover o dissipador, limpar o die e o cobre com álcool isopropílico, aplicar uma quantidade do tamanho de um grão de arroz e remontar com a pressão uniforme dos parafusos. É um procedimento bem documentado na comunidade, mas **invalida aspectos da garantia** e envolve risco de dano aos conectores.

```terminal
## Antes da troca, registre a linha de base para comparar depois
$ sensors k10temp-pci-00c3 | grep Tdie
Tdie:         +68.0°C
```

Registrar a temperatura de base antes e depois permite medir objetivamente se a troca valeu a pena. Uma queda de 5 a 15 °C sob a mesma carga é o resultado esperado de uma troca bem-sucedida em um Deck com pasta ressecada.

```terminal
## Depois da troca, mesma carga de stress de 60 segundos:
$ sensors k10temp-pci-00c3 | grep Tdie
Tdie:         +57.0°C
```

A diferença de 11 °C (de 68 °C para 57 °C) é típica de uma unidade onde a pasta original já estava seca e a nova camada restabeleceu o contato entre o die e o dissipador.

:::perigo
Desconecte a bateria antes de abrir o Deck e evite ferramentas metálicas sobre a placa. Curto-circuito em um aparelho com bateria conectada pode danificar permanentemente componentes. Se não tem experiência com reparo de eletrônicos, procure um técnico.
:::

## Resumo

- A pasta térmica preenche as imperfeições entre o die e o dissipador, eliminando ar (péssimo condutor).
- A condutividade da pasta (W/m·K) é o principal parâmetro; pastas comuns ficam entre 4 e 12 W/m·K.
- Camada fina e uniforme é essencial; pasta em excesso adiciona resistência térmica.
- O Steam Deck usa pasta padrão de fábrica, não metal líquido.
- Sinais de degradação incluem idle quente, diferença edge/junction alta e throttle em jogos antes tranquilos.

## Exercícios

1. Meça `Tdie` e `junction` em idle e registre os valores como linha de base da sua unidade.
2. Identifique, pela especificação, qual o tipo de interface térmica o seu modelo de Deck usa (LCD ou OLED).
3. Calcule a diferença entre `edge` e `junction` em idle e sob um jogo. Ela ultrapassa 10 °C?
4. Pesquise (documentação da comunidade, iFixit) o procedimento de troca de pasta do seu modelo e liste as ferramentas necessárias.
5. **Desafio.** Explique, em termos de condutividade térmica e área de contato, por que trocar a pasta pode reduzir a temperatura em 10 °C num Deck ressecado, mas **não** pode fazer o silício operar abaixo da temperatura ambiente.