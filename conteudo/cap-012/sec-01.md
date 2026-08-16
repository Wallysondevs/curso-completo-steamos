Antes de mexer em qualquer botão de energia, você precisa entender uma sigla que aparece em toda discussão sobre o Steam Deck: TDP, o *Thermal Design Power*. É ela que determina quanto calor a APU pode dissipar, quantos watts a bateria entrega e, no fim das contas, quantos FPS você enxerga na tela. Este capítulo inteiro gira em torno dessa única ideia — então vale a pena gastar uma seção inteira construindo-a com calma.

:::objetivos
- Entender o que é TDP e como ele se relaciona com calor e bateria
- Conhecer a APU Aerith, que equipa o Deck de LCD
- Encontrar e ler a especificação de 15 W da APU no próprio sistema
- Distinguir a APU da Steam Deck da de qualquer outro PC x86
:::

## A ideia por trás do TDP

Todo chip elétrico transforma energia em dois resultados: trabalho útil e calor. O **TDP** é o número, medido em watts, que diz quanta potência térmica um chip foi projetado para dissipar de forma contínua, sem superaquecer. Não é o consumo máximo nem o consumo típico — é um alvo de engenharia: "este processador, rodando no pior caso realista, precisa caber em X watts de calor".

Num notebook ou num mini-PC, o TDP vira a régua do fabricante da ventoinha e do dissipador. Quem projeta o arrefecimento usa esse número para dimensionar aletas, heatpipes e o tamanho da ventoinha. Se a placa-mãe não entregar energia suficiente ou o cooler não dissipar calor suficiente para sustentar o TDP, o chip precisa desacelerar sozinho para não fritar — é exatamente isso que acontece quando um jogo pesado faz a temperatura disparar e o clock despenca.

No Steam Deck a situação é mais refinada. O TDP **não é um valor fixo que a Valve impõe**; ele é um limite **ajustável** que o usuário controla pelo menu rápido. Baixar o TDP significa dizer ao chip "trabalhe com menos watts", o que reduz calor, ruído de ventoinha e consumo de bateria — ao custo de algum FPS. Subir o TDP devolve desempenho, mas cobra em temperatura e autonomia.

:::nota
O TDP é um contrato de projeto, não uma medição. Dois chips com o mesmo TDP de 15 W podem consumir correntes diferentes na prática, porque o TDP fala de **dissipação térmica esperada**, não de um limite elétrico rígido. A Valve mede o orçamento térmico inteiro do Deck — APU, memória, tela — para decidir até onde deixar o usuário ir.
:::

## A APU Aerith

O coração do Steam Deck é uma **APU** (*Accelerated Processing Unit*), ou seja, CPU e GPU integradas no mesmo silício. A unidade original, usada nos Decks de LCD, atende pelo codinome **Aerith**. Ela combina quatro núcleos de CPU da arquitetura Zen 2 com uma GPU RDNA 2 de oito unidades de computação (CU), fabricada em 7 nm pela TSMC.

Essa configuração de quatro núcleos é deliberada. A Valve e a AMD perceberam que, com TDP tão apertado, oito núcleos disputariam os mesmos watts e acabariam com clocks baixos em todos. Quatro núcleos bem alimentados entregam mais FPS em jogos do que oito núcleos famintos — uma decisão que vira para o usuário uma regra prática: em jogos limitados por CPU, forçar o TDP para cima ajuda pouco se o gargalo é outro.

Aqui está o ponto central deste capítulo: **o TDP máximo da Aerith é de 15 W**. É esse teto que o menu rápido do Modo Jogo usa como valor máximo quando você arrasta o controle deslizante até o fim. Tudo o que você aprendeu sobre watts, calor e bateria converge para esse número.

## Lendo a APU no sistema

Você não precisa confiar na caixa do produto para saber qual APU está rodando. O Linux expõe a identidade do processador de forma direta:

```terminal
$ lscpu | grep -i 'model name'
Model name:                           AMD Custom APU 0405
$ grep -m1 'model name' /proc/cpuinfo
model name	: AMD Custom APU 0405
```

A string `AMD Custom APU 0405` é a assinatura da Aerith. A Valve não usa a nomenclatura comercial (como "Ryzen 5 5500U"); ela encomendou um chip personalizado, o *0405*, que aparece assim no sistema. Saber ler isso evita confusão quando você compara seu Deck com artigos que citam o produto comercial equivalente.

Para confirmar todos os detalhes físicos da APU de uma vez, o `/proc/cpuinfo` revela os núcleos, threads e flags de instruções:

```terminal
$ grep -E 'vendor_id|model name|cpu MHz|cache size|siblings|cpu cores' /proc/cpuinfo | head -12
vendor_id       : AuthenticAMD
model name      : AMD Custom APU 0405
cpu MHz         : 1600.000
cache size      : 512 KB
siblings        : 8
cpu cores       : 4
vendor_id       : AuthenticAMD
model name      : AMD Custom APU 0405
cpu MHz         : 2800.000
cache size      : 512 KB
siblings        : 8
cpu cores       : 4
```

O campo `cpu cores: 4` e `siblings: 8` confirmam os quatro núcleos físicos com SMT ativo, e o `cpu MHz` mostra o clock instantâneo de cada thread lógica — que nunca é o mesmo porque o kernel redistribui a carga e o clock dinamicamente.

O número de núcleos e threads vem do mesmo `lscpu`:

```terminal
$ lscpu | grep -E '^(CPU\(s\)|Thread|Core|Socket)'
CPU(s):                             8
Thread(s) per core:                 2
Core(s) per socket:                 4
Socket(s):                          1
```

Quatro núcleos físicos, duas threads por núcleo, totalizando oito CPUs lógicas. O SMT (*Simultaneous Multi-Threading*) da AMD aparece como `Thread(s) per core: 2`. Quando um jogo usa bem múltiplas threads, as oito CPUs lógicas ajudam; quando o jogo é mono-thread, só um dos quatro núcleos trabalha de verdade e o TDP sobra nos demais — outro indício de que TDP alto não é sempre a resposta.

:::dica
A APU do Deck de OLED é uma revisão da Aerith em 6 nm, com o mesmo codinome na saída do `lscpu`. A diferença prática é eficiência: dissipa menos calor para o mesmo trabalho. Os comandos desta seção funcionam idênticos nas duas.
:::

## Por que limitar o TDP

Se mais watts normalmente significam mais FPS, qual o motivo de alguém **querer** limitar o TDP? Três respostas práticas:

- **Bateria.** Um Deck puxando 15 W na APU drena a bateria em pouco mais de uma hora de jogo pesado. Travar em 10 W pode estender a autonomia sensivelmente, com perda pequena de FPS em jogos leves.
- **Calor e ruído.** Menos watts, menos calor, ventoinha mais lenta e mais silenciosa. Em jogos indie ou retro, o TDP cheio é desperdício puro — a máquina aquece à toa.
- **Consistência.** Sem limite, o clock da APU oscila conforme a carga e a temperatura, causando quedas de FPS irregulares. Um TDP travado dá um comportamento previsível, importante para quem grava gameplay ou faz benchmark.

O inverso também vale: subir o TDP destrava desempenho, mas o menu do Modo Jogo já chega no teto de 15 W. Para ir além dele é preciso pular para o território do overclock por software, que você verá nas seções seguintes — com os devidos avisos sobre estabilidade e temperatura.

## Resumo

- TDP é a potência térmica que um chip foi projetado para dissipar de forma contínua, medida em watts.
- A APU original do Steam Deck é a Aerith, uma unidade AMD personalizada de CPU Zen 2 e GPU RDNA 2.
- O TDP máximo da Aerith é 15 W, o teto que o menu rápido do Modo Jogo permite configurar.
- `lscpu` e `/proc/cpuinfo` revelam a assinatura "AMD Custom APU 0405" e os quatro núcleos com SMT.
- Limitar o TDP economiza bateria, reduz calor e ruído, e torna o desempenho mais previsível.

## Exercícios

1. Rode `lscpu | grep -i 'model name'` e anote a string exata da sua APU. Ela aparece como `0405` ou algo diferente?
2. Calcule quantas CPUs lógicas o SMT entrega usando `lscpu | grep -E '^(CPU\(s\)|Thread|Core)'` e explique por que o total é o dobro dos núcleos físicos.
3. Abra o menu rápido no Modo Jogo e localize o controle deslizante de TDP. Anote o valor mínimo, o máximo e o valor padrão exibidos.
4. Compare `lscpu` com o conteúdo de `cat /proc/cpuinfo | head -20`. Qual informação aparece em um e não no outro?
5. **Desafio.** Com `lscpu` aberto, identifique o campo que mostra o clock atual e o clock máximo da CPU. Depois, relacione esse limite de clock com o TDP de 15 W: por que limite de watts, e não de GHz, é a trava mais importante para a bateria?
