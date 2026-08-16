A troca do case — o shell traseiro ou o conjunto completo — é a intervenção mais profunda da personalização física do Steam Deck. É onde a estética se encontra com a engenharia reversa do aparelho: você vai remover quase todos os componentes internos e transplantá-los para uma carcaça nova. Um erro aqui não quebra só a aparência; quebra a máquina. Esta seção explica o que está envolvido, qual o nível de comprometimento necessário e o que observar para não transformar um upgrade estético num prejuízo.

:::objetivos
- Entender a diferença entre troca de back shell e troca completa
- Conhecer os principais fornecedores de cases para cada modelo
- Planejar a migração de componentes passo a passo
- Reconhecer os riscos do manuseio da bateria, do dissipador e do display
- Executar uma verificação térmica e funcional após a remontagem
:::

## Back shell vs. shell completo

O Steam Deck se divide em três camadas mecânicas: o *front shell* (onde ficam a tela, os botões e os analógicos), a placa-mãe (com tudo soldado) e o *back shell* (a tampa traseira, com os grips e os botões traseiros L4/R4/L5/R5).

Trocar **apenas o back shell** é a porta de entrada mais comum: não mexe na tela, não mexe na placa-mãe além do que já se mexe para trocar botões. Basta remover os parafusos traseiros, soltar os clipes e encaixar o case novo. O risco é equivalente ao da troca de botões (que vimos na [seção anterior](#/cap-089/sec-05)) mais a atenção extra com os conectores dos botões traseiros.

Trocar o **shell completo** — incluindo o front shell — é uma reconstrução do aparelho. A tela precisa ser descolada (vem com adesivo térmico), os botões, os analógicos, o touchpad e a placa de áudio migram para a nova carcaça, e o dissipador pode precisar ser removido e limpo. É o tipo de intervenção que um guia da iFixit classifica como "difícil" e que leva entre 2 e 4 horas para um iniciante atento.

:::perigo
Descolar a tela para trocar o front shell é um ponto sem retorno. O display usa um adesivo forte que amolece com calor controlado, mas o LCD é frágil nas bordas. Trincar o painel durante a remoção é um erro comum que custa o preço de uma tela nova. Se você nunca fez isso, a recomendação é começar pelo back shell e ganhar familiaridade com o interior do aparelho antes de tocar na tela.
:::

## Fornecedores e compatibilidade de modelo

Cases transparentes, coloridos e com grip aprimorado são vendidos por marcas como eXtremeRate, JSAUX e alguns fornecedores diretos. A regra número um, repetida porque é a causa número um de devoluções: o case **precisa** ser compatível com o seu modelo exato.

```terminal
$ cat /sys/devices/virtual/dmi/id/board_name
Jupiter
$ cat /sys/devices/virtual/dmi/id/product_sku
LCD-512GB
```

`Jupiter` indica o Steam Deck LCD original. `Galileo` é o OLED. `Sephiroth` é o modelo de 2024. Cada um tem roscas, encaixes e conectores internos diferentes, e um case feito para `Jupiter` não fecha num `Galileo`.

Antes de comprar, confira também o número SKU do produto (armazenamento e variante), pois modelos com 64 GB e 512 GB podem ter diferenças no escudo térmico.

## O transplante, etapa por etapa

O espírito da troca é transplantar componentes do case velho para o novo. Não se trata de "montar do zero": você desmonta o aparelho inteiro e remonta dentro da carcaça nova, reaproveitando todos os componentes eletrônicos. O roteiro conceitual:

1. **Desligar, esfriar e fotografar.** O aparelho deve estar completamente frio — o adesivo da bateria e o da tela soltam melhor a frio (ou a morno, para o display).
2. **Remover o back shell** e os botões traseiros (L4/R4/L5/R5), que ficam presos por mola.
3. **Desconectar a bateria, os flex do display, touchpad e áudio**, e remover a placa-mãe com o dissipador acoplado.
4. **Transferir os botões, analógicos e touchpads** para o novo front shell (ou, se só trocar o back, pular para os botões traseiros).
5. **Se for trocar o front shell, remover a tela** com calor controlado e paciência, usando ventosa e espátula fina.
6. **Reassentar a placa-mãe**, reconectar os flex na ordem inversa, **reconectar a bateria por último**.
7. **Fechar e testar** antes de apertar todos os parafusos.

Fotografe cada flex antes de desconectar. A ordem de reconexão importa menos que a certeza de que cada cabo foi encaixado e travado.

## Cuidados com a bateria

A bateria do Steam Deck é um pacote de lítio colado ao chassi com adesivo forte. Durante a troca do back shell, o risco de perfurá-la com a espátula é real — e uma célula de lítio perfurada pode incendiar. A técnica segura é usar álcool isopropílico (99%) para amolecer o adesivo, nunca alavancar a bateria com força.

```terminal
$ upower -i $(upower -e | grep -i battery) | grep -E "model|percentage|capacity" | head -5
  model:          UXE-CP9332
  percentage:     78%
  capacity:       40.6 Wh
```

`upower` no modo desktop mostra o modelo e a capacidade da bateria; anote-os antes de começar e compare depois da remontagem — qualquer mudança brusca na capacidade ou na temperatura indica problema.

:::atencao
A bateria nunca deve ser dobrada, amassada ou pressionada com objetos pontiagudos. Se o adesivo não ceder, continue aplicando álcool isopropílico aos poucos; o processo pode levar vários minutos. Paciência aqui é literalmente segurança contra incêndio.
:::

## Verificações pós-transplante

Depois de remontado, o aparelho merece uma bateria de verificações antes de ser considerado funcional. Além dos controles (cobertos na [seção anterior](#/cap-089/sec-05)), você precisa confirmar que o sistema térmico está operante.

```terminal
$ sensors 2>/dev/null | grep -E "temp|fan" | head -8
nvme-pci-0300
Adapter: PCI adapter
Composite:    +39.9°C  (low  = -273.1°C, high = +81.8°C)
acpitz-acpi-0
Adapter: ACPI interface
temp1:        +42.0°C  (crit = +105.0°C)
```

A temperatura ociosa após a remontagem deve estar na mesma faixa de antes (30–50 °C). Uma temperatura anormalmente alta logo após o boot sugere que o dissipador não está assentado — talvez pasta térmica precisando de reaplicação, talvez os parafusos do cooler estejam frouxos.

A ventoinha também merece atenção: se o sistema relata 0 RPM com temperatura subindo, o conector da ventoinha pode estar solto.

```terminal
$ cat /sys/class/hwmon/hwmon*/fan1_input 2>/dev/null
3500
```

A linha acima lê a rotação da ventoinha via `hwmon`. Um valor entre 2000 e 5000 RPM é típico em ocioso; 0 RPM com o aparelho ligado é sinal de alerta.

## Resumo

- A troca de back shell é menos invasiva e não envolve a tela; a troca completa é uma reconstrução.
- Modelos LCD (`Jupiter`), OLED (`Galileo`) e 2024 têm cases incompatíveis entre si.
- O transplante move componentes eletrônicos do case velho para o novo; nada é soldado.
- A bateria é colada e não deve ser alavancada com força — use álcool isopropílico para soltar.
- Verificações pós-montagem incluem controles, temperatura (`sensors`) e rotação da ventoinha.
- Trabalhe sempre com o aparelho desligado e a bateria desconectada antes de tocar em qualquer placa.

## Exercícios

1. Identifique seu modelo (`board_name`), anote a capacidade da bateria (`upower`) e registre a temperatura ociosa (`sensors`) como referência de "antes".
2. Pesquise no catálogo de um fornecedor (eXtremeRate ou JSAUX) e encontre um case compatível com o seu modelo. Anote o SKU e confira se a página menciona `Jupiter`, `Galileo` ou `Sephiroth`.
3. Assista a um guia de desmontagem do seu modelo e cronometre cada etapa. Escreva qual etapa demandou mais tempo e por quê.
4. Liste as ferramentas adicionais (além das da troca de botões) que você precisaria para remover o display e explique para que serve cada uma.
5. **Desafio.** Monte um plano de validação pós-transplante que cubra, em sequência: controles, tela, áudio, Wi-Fi, temperatura e rotação da ventoinha. Para cada item, indique o comando ou interface que você usaria para conferir.