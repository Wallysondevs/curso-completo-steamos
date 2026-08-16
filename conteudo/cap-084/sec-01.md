O Steam Deck foi desenhado pela Valve para ser aberto, e isso não é discurso de marketing: os parafusos são Phillips comuns, as peças são modulares e a própria empresa publicou um teardown oficial esmiuçando cada componente. Trocar o SSD, os analógicos ou os botões é o caminho mais barato para um aparelho que joga como novo — ou melhor que novo. Mas upgrade não é loteria: cada peça tem uma janela de compatibilidade, e errar o modelo certo pode significar um componente que não encaixa ou um aparelho que não liga.

:::objetivos
- Identificar quais componentes do Steam Deck são substituíveis pelo usuário
- Distinguir upgrade de reparo e onde um termina e o outro começa
- Entender a arquitetura modular do Deck e suas peças-chave
- Reconhecer os riscos de garantia e dano de cada troca
- Planejar uma sequência segura de upgrade de hardware
:::

## O que a Valve deixou aberto de propósito

Abra o Steam Deck e você não encontra solda irreversível nos pontos que mais importam. O armazenamento é um **SSD M.2 2230** em slot padrão NVMe, preso por um único parafuso. Os dois analógicos são módulos inteiros conectados por cabos flat e parafusos, não soldados direto na placa-mãe. Botões e D-pad são peças plásticas que descansam sobre membranas de borracha condutiva, encaixadas na carcaça. Essa modularidade é o que torna o upgrade viável para quem tem um chaveiro em casa.

```terminal
$ lsblk -d -o NAME,MODEL,SIZE,TRAN
NAME   MODEL                          SIZE TRAN
nvme0n1 KINGSTON OM3PDP3512B-A01    476.9G nvme
```

O comando acima mostra o SSD de fábrica de um Deck LCD de 512 GB: um `KINGSTON OM3PDP3` no formato 2230. É exatamente o tipo de peça que vamos substituir — e o `lsblk` serve como inventário antes e depois da troca.

A lista do que dá para trocar sem estação de retrabalho é curta e honesta: **SSD 2230**, **módulos de analógico**, **botões e D-pad** (incluindo membranas e molas), **grips/carcaças traseiras** e **ventoinha** — este último tratado com profundidade no capítulo sobre refrigeração. Ficam de fora, por envolverem solda ou ferramentas especializadas, a APU, a RAM (soldada) e a porta USB-C.

## Upgrade versus reparo: por que você está abrindo?

É útil separar as duas motivações porque elas mudam a ordem e a compra das peças. **Upgrade** é trocar algo que funciona por algo melhor: um SSD maior ou um analógico hall effect que nunca sofre *drift*. **Reparo** é substituir algo que quebrou: um stick que driftou, um botão que afundou, um `L1` que parou de clicar. No primeiro caso você compra antes de abrir; no segundo, abre primeiro para diagnosticar e só então compra.

```terminal
$ evtest /dev/input/event3
Select the device event number [0-31]: 
Event: time 1734000000.000001, type 3 (EV_ABS), code 0 (ABS_X), value 32044
```

`evtest` lendo um analógico revela o problema clássico: se o valor de repouso de um eixo (`ABS_X` ou `ABS_Y`) não fica perto do centro, você tem *drift*. Num stick hall effect, esse desvio praticamente não existe. Diagnosticar antes de comprar evita gastar com peça errada.

:::nota
*Drift* é o desvio de leitura de um eixo quando o stick está solto e parado: o personagem "anda sozinho". Ele ocorre porque os potenciômetros de carbono do analógico original se desgastam com o atrito. O hall effect mede campo magnético sem contato físico e, teoricamente, não desgasta.
:::

## As três peças deste capítulo

O resto do capítulo se organiza em torno de três upgrades. O **SSD 2230** é o que mais muda a experiência: mais espaço sem depender de microSD, e possivelmente mais velocidade. Os **analógicos hall effect** eliminam o *drift* e, em alguns modelos, aumentam a precisão. Os **botões** são o upgrade estético e tátil — trocar membranas gastas ou personalizar a cor dos botões de face.

A troca do SSD é a mais invasiva (exige reinstalar o sistema ou clonar), a dos analógicos é a mais delicada mecanicamente (cabos flat frágeis), e a dos botões é a mais barata e reversível. Elas compartilham um pré-requisito comum: abrir o Deck com segurança, que começa por drenar a bateria e aterrar a estática — assunto do próximo bloco de seções.

## Garantia e o que você assume

A Valve, via página "Steam Deck Repair", reconhece que abrir o aparelho não anula a garantia por si só — desde que o defeito em questão não tenha sido causado pela sua intervenção. Na prática: se você furar um cabo flat trocando o stick e a tela parar de responder, esse dano é seu. Se a ventoinha falhar sozinha depois do upgrade de SSD, a garantia dela continua valendo.

```terminal
$ sudo dmidecode -s system-serial-number
FVFAXXXX12345
```

Anote o número de série antes de qualquer intervenção. Ele está na BIOS, na caixa e atrás do aparelho, e é a chave para peças de reposição corretas e para acionar a assistência. Modelos LCD e OLED têm números de peça e dimensões internas diferentes — um analógico de LCD **não** encaixa no OLED e vice-versa.

## Resumo

- O Steam Deck é modular por projeto: SSD, analógicos, botões e ventoinha são substituíveis sem solda.
- Upgrade troca peça funcional por melhor; reparo substitui peça defeituosa — e a ordem de compra muda.
- SSD 2230, analógicos hall effect e botões são os três upgrades centrais deste capítulo.
- `lsblk` inventaria o SSD, `evtest` diagnostica *drift* e `dmidecode` revela o número de série.
- A garantia resiste a abrir o aparelho, mas não cobre danos causados pela intervenção.

## Exercícios

1. Rode `lsblk -d -o NAME,MODEL,SIZE,TRAN` e registre modelo e capacidade do seu SSD atual. Pesquise se ele é 2230 e qual geração PCIe suporta.
2. Com `evtest` (escolha o nó do controlador), mova cada analógico até o fim e solte. O valor de repouso volta exatamente ao centro? Anote o desvio máximo em cada eixo.
3. Liste `/dev/input` antes e depois de plugar um gamepad externo. Quantos nós novos surgem e o que isso diz sobre a pilha de input?
4. Obtenha o número de série com `sudo dmidecode -s system-serial-number` e confira se bate com o da etiqueta física atrás do aparelho.
5. **Desafio.** Sem olhar a próxima seção, proponha um critério (baseado em `lsblk`, `df` e no que você já sabe de NVMe) para decidir entre comprar um SSD de 1 TB ou um microSD de 1 TB — considere custo, velocidade e a dificuldade da troca.
