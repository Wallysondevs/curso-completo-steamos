Abrir um Steam Deck sem preparação é o caminho mais curto para transformar um reparo barato em uma placa-mãe morta. Antes de tocar em qualquer chave de fenda, você precisa entender que este é um aparelho de consumo construído com tolerâncias apertadas, parafusos que se espanam com facilidade e componentes que morrem com uma simples descarga eletrostática. Esta seção estabelece a base de segurança e organização para todo o capítulo: sem ela, as seções de tela, bateria e ventoinha viram uma loteria.

:::objetivos
- Montar o kit de ferramentas mínimo para reparo físico do Steam Deck
- Preparar a bancada de trabalho e aplicar o checklist antes de abrir o aparelho
- Drenar a bateria até um nível seguro antes da intervenção
- Compreender o conceito de ESD e como evitar danos por descarga eletrostática
- Identificar corretamente a revisão do hardware (LCD vs OLED e revisão de placa)
:::

## Kit de ferramentas e preparação da bancada

O Steam Deck usa parafusos Phillips de cabeça pequena (tamanhos PH0 e PH00) em todo o chassi, com uma exceção importante: os parafusos internos da blindagem usam Torx T6. Um kit genérico de celular resolve, mas uma chave com ponta magnética e cabo mais comprido dá muito mais controle nos parafusos profundos perto da dobradiça. A lista mínima que recomendo:

- Chave Phillips **PH00** (principal) e **PH0** (parafusos maiores da carcaça)
- Chave **Torx T6** para a blindagem interna
- Espátulas de plástico (*spudgers*) para soltar clipes sem arranhar a carcaça
- Pinça de precisão com ponta fina (para cabos flex e conectores)
- Pulseira antiestática (ESD) ligada a um ponto de aterramento
- Tapete de silicone ou bandeja magnética organizadora de parafusos

A bancada deve estar limpa, seca e sem tapetes de tecido (que geram estática ao esfregar). Se você mora em região de clima seco, um umidificador ajuda a reduzir o acúmulo de carga. O documento de referência obrigatório para qualquer reparo é o [guia oficial do iFixit para o Steam Deck](https://pt.ifixit.com/Device/Steam_Deck), que traz fotos passo a passo e indica exatamente onde ficam os clipes e os comprimentos de parafuso.

Antes de começar, verifique o estado do seu firmware e anote a revisão do aparelho para poder consultar a seção correta do guia:

```terminal
$ cat /sys/class/dmi/id/product_name
Steam Deck
$ cat /sys/class/dmi/id/product_version
1000
```

O campo `product_version` entrega a revisão do hardware. No modelo **Jupiter** (a primeira geração, LCD), você verá valores como `1000`; no **Galileo** (modelo OLED), o valor é `1030` ou superior. Esse mesmo dado aparece no rótulo traseiro, perto do código de barras — sempre confira os dois e anote antes de abrir.

## Checklist antes de abrir e drenagem da bateria

O Steam Deck não tem um conector físico de bateria trivial de remover sem abrir, então a forma segura de deixá-lo "morto" é drenar a carga e ainda assim acionar o **modo de armazenamento** (*shipping mode*), que desliga o circuito de proteção da bateria. O procedimento correto reduz — mas não zera — o risco de curto ao manusear a placa.

```terminal
## desliga completamente o aparelho
$ sudo systemctl poweroff

## aguarda a luz de status apagar por completo
$ sleep 10

## mantém pressionado o botão de volume "-" (menos) e o de power
## solta quando o menu de boot aparecer; escolhe "Setup Utility"
$ printf 'entre no Setup Utility e deixe a bateria drenar até ~25%%\n'
entre no Setup Utility e deixe a bateria drenar até ~25%
```

:::perigo
Nunca abra o aparelho com a bateria cheia ou conectada ao carregador. Um único toque de chave entre um pino de energia e o terra da placa-mãe pode queimar o circuito de carga e matar o aparelho de forma irreversível. A bateria do Steam Deck não é removível pelo usuário sem abrir a carcaça: trate qualquer exposição da placa como área sob tensão.
:::

Alguns reparadores optam por usar uma bateria externa ou um "descarregador" para levar a carga a zero antes de abrir. Isso funciona, mas lembre-se de que o firmware da bateria (BMS — *Battery Management System*) registra o histórico e pode recusar carregar se a tensão celular cair demais. Drenar até uns 20–25% é o ponto ideal: baixo o suficiente para reduzir risco, alto o suficiente para o BMS não entrar em proteção profunda.

## ESD: por que sua mão pode custar uma placa

**ESD** (*Electrostatic Discharge*, descarga eletrostática) é a transferência repentina de carga entre dois objetos com potenciais diferentes. Você já sentiu o choque ao tocar uma maçaneta em dia seco — são alguns milhares de volts. A maioria dos circuitos tolera bem isso, mas os componentes do Steam Deck (memória, controlador de vídeo, chips de alimentação) operam em frações de volt e são destruídos por descargas que você nem sente.

O pior cenário é o **dano latente**: a peça não para de funcionar na hora, mas fica enfraquecida e morre semanas depois. Por isso a pulseira antiestática não é opcional — ela iguala o potencial do seu corpo ao da bancada, drenando carga continuamente. Se não tiver pulseira, toque em uma superfície metálica aterrada (como o chassi de um gabinete ligado à tomada) antes de mexer na placa e evite se movimentar sobre carpetes.

```text
Regras práticas de ESD na bancada
---------------------------------
1. Use pulseira antiestática presa ao terra.
2. Trabalhe sobre tapete de ESD (dissipativo), nunca sobre plástico comum.
3. Segure a placa pelas bordas, nunca pelos chips ou conectores.
4. Guarde a placa em saco antiestático quando fizer pausas.
5. Não use mangas de lã nem roupas sintéticas soltas.
```

:::dica
Se o orçamento está apertado, uma folha de papel-alumínio aterrada já reduz drasticamente o acúmulo de estática em comparação com uma mesa de madeira envernizada. Não substitui o tapete de ESD, mas é melhor que nada em um reparo emergencial.
:::

## Identificando a revisão correta do hardware

Reparos de tela, bateria e ventoinha dependem críticamente da revisão do aparelho, porque as peças **não são intercambiáveis** entre LCD e OLED. A tela do modelo LCD usa um cabo flex de 40 pinos e vidro colado com adesivo; o modelo OLED muda o painel, o cabo e até a posição dos conectores. Tentar montar a peça errada é a causa número um de telas mortas pós-reparo em fóruns.

Use a linha de comando para identificar com precisão o modelo antes de comprar qualquer peça:

```terminal
$ sudo dmidecode -s system-product-name
Steam Deck
$ sudo dmidecode -s system-version
Galileo
$ cat /sys/class/dmi/id/board_name
Jupiter
$ lspci -nn | grep -i 'amd.*vga\|display controller'
04:00.0 VGA compatible controller [0300]: Advanced Micro Devices, Inc. [AMD/ATI] VanGogh [1002:163f]
```

A saída acima é de um aparelho **OLED (Galileo)** montado sobre placa **Jupiter**. Repare que `system-version` e `board_name` trazem informações diferentes: a versão do sistema se refere ao chassi/geração, enquanto o nome da placa identifica a revisão física da PCB. O iFixit separa os guias por essas duas chaves, e cada peça de reposição lista a compatibilidade explicitamente.

```terminal
## consulta o modelo de forma legível pelo firmware
$ cat /sys/firmware/devicetree/base/model; echo
Galileo
## confere o total de memória para diferenciar revisões (LCD 64GB vs OLED 512GB+)
$ free -h | awk '/Mem:/ {print $2}'
15.5Gi
```

:::nota
O Steam Deck OLED também muda a posição e o tamanho dos parafusos externos em relação ao LCD. Não use a numeração de parafusos de um guia no outro: confirme sempre `system-version` antes de escolher o passo a passo.
:::

A revisão da placa (PCB *revision*) pode ser lida fisicamente, impressa em serigrafia perto do slot do SSD ou do conector da bateria. Ela costuma ter formato como `F7A` ou `F7B` e importa porque algumas revisões trocam controladores de energia e exigem peças de ventoinha com conectores diferentes.

```text
Mapeamento rápido de revisões (referência comum em campo)
---------------------------------------------------------
System version   Modelo   Painel        Ventoinha        Bateria
1000/1005        LCD      LCD 7"        Conector A       40.56 Wh
1030+            OLED     OLED 7.4"     Conector B       50.04 Wh
---------------------------------------------------------
```

## Resumo
- O kit mínimo exige Phillips PH00/PH0, Torx T6, espátulas, pinça e pulseira antiestática.
- Drene a bateria até ~20–25% e desligue o aparelho antes de abrir a carcaça.
- ESD pode causar **dano latente** que só aparece semanas depois do reparo.
- A pulseira antiestática iguala o potencial do seu corpo ao da bancada.
- `system-version` (LCD `1000` vs OLED `1030+`) define quais peças comprar; `board_name` indica a revisão da PCB.
- Peças entre LCD e OLED **não são intercambiáveis** — confirme sempre antes de comprar.

## Exercícios
1. Liste os quatro tipos de chave necessários (com tamanhos) para desmontar completamente um Steam Deck LCD e explique em que etapa cada uma é usada.
2. Descreva, passo a passo, o procedimento correto para deixar a bateria em condição segura antes de abrir o aparelho, incluindo o uso do Setup Utility.
3. Explique a diferença entre `system-version` e `board_name` e por que ambos importam na compra de peças de reposição.
4. Simule em texto a identificação de um aparelho: escreva os comandos que você executaria e a saída esperada para um Steam Deck OLED, e diga qual tela e qual bateria você compraria.
5. Desafio integrador: elabore um "protocolo de bancada" completo para um técnico que fará troca da ventoinha, incluindo checklist de ferramentas, preparação ESD, drenagem da bateria, identificação da revisão e o plano de desmontagem até a ventoinha — justificando cada decisão com base nos riscos desta seção.
