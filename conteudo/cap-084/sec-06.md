O *drift* do analógico é a doença crônica mais comum de qualquer gamepad, e o Steam Deck não está imune. A causa está na tecnologia do componente original: potenciômetros de película de carbono que se desgastam pelo atrito e começam a ler uma posição "mentirosa". Os analógicos **hall effect** curam isso trocando o contato físico por um campo magnético — e são o upgrade de maior impacto na longevidade dos controles. Entender a física por trás evita comprar gato por lebre.

:::objetivos
- Explicar por que potenciômetros de carbono sofrem drift
- Entender o princípio do efeito Hall e por que ele não desgasta
- Comparar precisão, curso e sensação ao dedo dos dois tipos
- Reconhecer os modelos hall effect compatíveis com LCD e OLED
- Separar fatos de marketing na hora de escolher um stick
:::

## Por que o analógico original deriva

Um analógico tradicional é dois potenciômetros em miniatura, um para o eixo X e outro para o Y. Um cursor de metal desliza sobre uma trilha de carbono resistiva; o atrito dessas duas peças, ao longo de milhares de horas, desgasta a trilha e muda a resistência medida na posição central. O resultado é o *drift*: o jogo interpreta um leve movimento contínuo onde não há nenhum.

```terminal
$ evtest /dev/input/event3
Event: type 3 (EV_ABS), code 0 (ABS_X), value 1842
Event: type 3 (EV_ABS), code 1 (ABS_Y), value -129
```

Num stick saudável, o repouso de `ABS_X` e `ABS_Y` lê perto de zero. Valores persistentes de centenas (como `1842` acima) indicam que o desgaste já deslocou o "centro elétrico" do potenciômetro. O SteamOS disfarça com uma zona morta maior, mas isso rouba precisão e só adia o inevitável.

## O efeito Hall: medir sem tocar

O efeito Hall é uma consequência da eletromagnética: quando um campo magnético atravessa um condutor percorrido por corrente, surge uma tensão perpendicular proporcional à intensidade do campo. No joystick, um pequeno **ímã** se move junto com a alavanca, enquanto um **sensor Hall** fixo no PCB mede o campo. Como não há contato físico entre ímã e sensor, não existe atrito — e nada se desgasta.

```terminal
$ cat /sys/class/i2c-adapter/*/name 2>/dev/null | grep -i -E 'hall|mag|sensor'
```

A leitura acima ilustra o tipo de sensor que você pode investigar no barramento i2c do sistema: alguns módulos hall effect expõem o chip como um dispositivo i2c legível. Na prática diária, porém, o hall effect é invisível ao usuário — o kernel o enxerga como mais um eixo analógico, e nenhum driver especial é necessário.

:::nota
A precisão do hall effect não é mágica: ela depende do alinhamento do ímã com o sensor e da resolução do conversor analógico-digital (ADC). Um stick hall effect mal calibrado pode ter *jitter* (ruído no centro) tão incômodo quanto drift — por isso a calibração pós-instalação é essencial, como veremos adiante.
:::

## Precisão, resolução e "zona morta"

Os sticks hall effect costumam ter resolução igual ou superior ao original: a diferença prática não é um salto brutal de sensação, e sim a **estabilidade ao longo do tempo**. O benefício se acumula: depois de 500 horas, o stick original já está desgastando enquanto o hall effect continua idêntico ao primeiro dia.

```terminal
$ evtest /dev/input/event3
Event: type 3 (EV_ABS), code 0 (ABS_X), value 3
Event: type 3 (EV_ABS), code 0 (ABS_X), value 0
```

Observe a diferença com o exemplo de drift: aqui o repouso oscila entre `3` e `0`, praticamente colado no centro. É o que você espera de um hall effect bem instalado — leituras que retornam à origem com desvio mínimo, permitindo zona morta quase nula e mira mais fina.

## Modelos compatíveis e o que desconfiar

Os kits mais conhecidos são da **Gulikit** (linha de sticks magnéticos) e de outras marcas como Anbernic/Thunotar, sempre vendidos em pares e **separados por modelo**: os sticks do Deck LCD e do OLED têm espessuras e tamanhos de módulo ligeiramente diferentes. Comprar o par errado resulta em peça que não encaixa no suporte ou que toca a tampa.

```terminal
$ cat /proc/device-tree/model 2>/dev/null || sudo dmidecode -s system-product-name
Steam Deck
```

Confirme seu modelo antes de comprar. O resultado acima é genérico; a diferença LCD/OLED se confirma pela etiqueta traseira (número do modelo) e pela tela. Na dúvida, procure o kit que menciona explicitamente o seu modelo na descrição, e evite vendedores que prometem "serve para todos".

:::perigo
Sticks hall effect genéricos "universais" sem especificação de modelo são aposta arriscada: podem exigir solda, trazer PCB com furação incompatível ou ter sensores de resolução inferior. Verifique a compatibilidade com seu modelo específico antes de pagar — e desconfie de preço muito abaixo do par reconhecido.
:::

## Resumo

- O drift vem do desgaste da trilha de carbono do potenciômetro pelo atrito do cursor.
- O efeito Hall mede campo magnético entre ímã e sensor, sem contato e sem desgaste.
- `evtest` revela o repouso dos eixos: perto de zero é saudável; valores persistentes indicam drift.
- Hall effect não elimina a necessidade de calibração — mal calibrado, pode apresentar jitter no centro.
- Kits são vendidos por modelo (LCD vs OLED); "universal" é sinal de alerta.

## Exercícios

1. Com `evtest`, meça o repouso de `ABS_X` e `ABS_Y` do seu analógico atual em cinco tentativas. Registre o desvio máximo e mínimo.
2. Movimente o stick em círculos lentos e observe os valores em `evtest`. Há saltos bruscos ou os números variam de forma contínua? O que isso sugere sobre a trilha do potenciômetro?
3. Pesquise o preço de um par de sticks hall effect para o seu modelo específico (LCD ou OLED) e compare com o preço do par original. Qual o custo-benefício em horas de uso?
4. Identifique seu modelo exato com `sudo dmidecode -s system-product-name` e confira pela etiqueta traseira. Registre-o para não errar na compra.
5. **Desafio.** Explique, com base no efeito Hall, por que um ímã externo forte (por exemplo, um suporte magnético de celular) poderia interferir na leitura de um stick hall effect — e relacione isso com o que o `evtest` mostraria nessa situação.
