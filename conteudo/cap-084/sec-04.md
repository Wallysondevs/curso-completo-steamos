Abrir o Steam Deck não exige coragem — exige método. Os oito parafusos traseiros são Phillips comuns e a Valve desenhou as presilhas para abrir com uma piolet, não para arrancar. Mas há dois inimigos invisíveis entre você e um upgrade bem-sucedido: a **eletricidade estática**, capaz de queimar um componente sem deixar marca, e a **bateria ainda energizada**, capaz de curto-circuitar a placa se uma ferramenta escorregar. Neutralizar os dois antes de tocar em qualquer peça é a regra número um.

:::objetivos
- Preparar a bancada e as ferramentas corretas para a desmontagem
- Drenar a bateria e entrar no Battery Storage Mode
- Aterrar-se contra eletricidade estática (ESD)
- Remover os parafusos traseiros e abrir as presilhas sem danos
- Desconectar a bateria como primeiro passo interno obrigatório
:::

## Bancada, ferramentas e preparação

Você precisa de pouca coisa, mas da coisa certa. Uma chave Phillips **PH0** (alguns preferem PH1 para os parafusos traseiros), uma piolet ou espátula de plástico para as presilhas, uma pinça para cabos flat, e uma superfície limpa e sem tapete. Uma pulseira antiestática é barata e elimina a maior parte do risco de ESD; na falta dela, toque num metal aterrado antes de começar.

```terminal
$ upower -i /org/freedesktop/UPower/devices/battery_BAT1 | grep -E 'percentage|state'
    percentage:          100%
    state:               fully-charged
```

Antes de abrir, registre o estado da bateria com `upower`. O ideal é trabalhar com a carga **abaixo de 25%**, porque uma bateria com pouca energia tem potencial químico menor caso algo dê errado. Melhor ainda é fazê-la entrar no modo de armazenamento, que a desconecta eletricamente.

## Battery Storage Mode: a bateria "desligada"

O Battery Storage Mode é um estado em que o circuito de proteção da bateria corta a saída, deixando a placa sem tensão. Ele é acionado pela BIOS e é a forma correta de preparar o Deck para ficar aberto. Sem ele, os trilhos da placa continuam energizados mesmo com o aparelho "desligado" pelo sistema.

```terminal
$ systemctl poweroff
```

Desligue normalmente. Depois, com o Deck desligado, segure `[[Volume+]]` e ligue no botão de energia para entrar no menu da BIOS. Navegue até **Setup Utility → Power → Battery storage mode** e confirme. O aparelho desliga de vez e a bateria para de alimentar a placa até que você conecte o carregador de novo.

:::perigo
Nunca abra o Deck com o cabo de energia conectado e a bateria ainda alimentando a placa. Uma chave de fenda que escorrega sobre componentes energizados pode causar curto e danificar a placa-mãe de forma permanente. Battery Storage Mode + cabo removido é a combinação obrigatória.
:::

## ESD: a estática que você não sente

Uma descarga de algumas centenas de volts é imperceptível no seu dedo, mas suficiente para romper a porta nanométrica de um circuito. A RAM e a APU são soldadas e vulneráveis. A mitigação é simples: toque periodicamente numa superfície metálica aterrada (o gabinete de um PC ligado, por exemplo) e evite roupas de lã ou movimentos de esfregar sobre o tapete.

```terminal
$ cat /proc/cpuinfo | grep -m1 'model name'
model name : AMD Custom APU 0405
```

A APU AMD do Deck concentra CPU e GPU no mesmo die — um único componente que, se danificado por ESD, exige placa-mãe inteira nova. Saber onde ela está (você a verá sob um dissipador de cobre ao abrir) ajuda a direcionar a cautela: mãos e ferramentas longe dela a menos que necessário.

:::dica
Trabalhe sobre uma superfície de madeira ou com um tapete antiestático. Evite diretamente sobre carpete. Se não tem pulseira antiestática, encoste a ponta dos dedos no parafuso aterrado do ponto de energia da sua casa (a própria tomada, no pino metálico, quando houver aterramento) logo antes de tocar a placa.
:::

## Removendo os parafusos e abrindo a carcaça

São oito parafusos na traseira: quatro curtos nos cantos e four longos no centro. Guarde-os separados — misturá-los pode fazer um parafuso longo pressionar a placa por dentro ao remontar. Vire o Deck de frente para você e insira a piolet no vão entre a carcaça frontal e a traseira, começando pelo canto superior, deslizando com *leveza* até as presilhas soltarem.

```terminal
$ ls /sys/class/power_supply/BAT1/charge_full
5200000
```

O `charge_full` em microampères-hora (aqui 5.200.000 µAh = 5.200 mAh) confirma que a bateria está no estado esperado. Depois de abrir, o primeiro componente que você vê é justamente a bateria, que ocupa metade da área interna — e é dela que o conector precisa sair primeiro.

## Desconectando a bateria: o passo zero interno

Antes de qualquer peça, desconecte o **conector da bateria** da placa-mãe. Ele é um conector flexível preto, geralmente coberto por uma fita adesiva ou uma aba plástica. Puxe pelo conector (nunca pelos fios) com a pinça, de forma reta e lenta. Com o conector solto, a placa fica de fato sem energia e o restante da operação vira só mecânica.

```terminal
$ cat /sys/class/power_supply/BAT1/status
Not charging
```

Com o conector da bateria removido, qualquer leitura de status vira `Not charging` ou simplesmente desaparece do barramento. É a sua confirmação de que a placa não está mais recebendo tensão da bateria. A partir daqui, SSD, analógicos e botões são território seguro.

## Resumo

- Use Phillips PH0/PH1, piolet de plástico e pinça; trabalhe sobre superfície antiestática.
- Trabalhe com a bateria abaixo de 25% e ative o Battery Storage Mode pela BIOS antes de abrir.
- ESD pode matar a APU sem deixar marca; aterrar-se é obrigatório.
- São oito parafusos (quatro curtos, quatro longos) que devem ser guardados separados.
- Desconectar o conector da bateria é o primeiro passo interno, antes de tocar em qualquer outra peça.

## Exercícios

1. Com `upower -i`, registre porcentagem e estado da bateria. Descarregue até abaixo de 25% e registre de novo.
2. Reúna as ferramentas da seção e confira se tem PH0/PH1, piolet e pinça. Se faltar alguma, anote onde consegue antes de prosseguir.
3. Entre na BIOS ([[Volume+]] + ligar) e localize a opção Power → Battery storage mode. Descreva o caminho exato de menus que você percorreu.
4. Consulte `cat /sys/class/power_supply/BAT1/charge_full` e converta o valor em mAh. Compare com o especificado para seu modelo (LCD ou OLED).
5. **Desafio.** Explique por que "desligar pelo sistema" não é suficiente para trabalhar com segurança na placa, relacionando isso com o conceito de trilho energizado e com o que o Battery Storage Mode faz fisicamente no circuito de proteção.
