Peso, ergonomia e acabamento são os aspectos que definem se um portátil é usável por horas ou vira enfeite. O Steam Deck foi elogiado desde o lançamento justamente por ergonomia, mas o OLED conseguiu melhorar o que já era bom: ficou mais leve, com melhor distribuição e uma tela ligeiramente maior sem aumentar o volume. Parte dessas diferenças é física, mas o modelo exato também pode ser confirmado por software, via identificação de firmware.

Nesta seção você aprende a comparar as dimensões físicas e a obter os identificadores de firmware que confirmam o modelo pela linha de comando.

:::objetivos
- Comparar peso, dimensões e construção do LCD e do OLED
- Entender como a distribuição de peso afeta a ergonomia em sessões longas
- Obter o modelo e a versão de firmware com `dmidecode`
- Interpretar o codinome do produto (`Jupiter`, `Galileo`) e a revisão
- Relacionar a física do aparelho com o conforto real de uso
:::

## O que mudou na casca

O Steam Deck LCD pesa cerca de **669 gramas**. O OLED, apesar de trazer bateria maior (50 Wh contra 40 Wh), ficou mais **leve** — por volta de **640 gramas** — graças a um chassi redesenhado e a uma bateria de química e empacotamento mais eficientes. A diferença de cerca de 30 gramas parece pequena, mas soma-se à melhor distribuição para aliviar a fadiga em sessões longas.

As dimensões externas mudaram pouco nas duas gerações: o aparelho tem aproximadamente 298 mm de comprimento e 117 mm de altura, com espessura parecida. O que cresceu foi a tela — de 7,0" para 7,4" — ocupando melhor a face frontal e reduzindo a moldura visível, o que dá uma sensação de aparelho mais moderno sem aumento significativo de volume total.

O conjunto de controles é idêntico em ambos: dois analógicos, os trackpads duplos característicos, o D-pad, o ABXY e os gatilhos. A Valve não mudou o leiaute entre gerações, o que preserva a memória muscular de quem migra do LCD para o OLED.

:::nota
O Steam Deck é, na prática, um "notebook com cara de controle": o peso (mais de 600 g) e a pegada larga fazem dele um dos portáteis mais pesados do mercado, contra rivais na casa dos 300–450 g. O aparelho compensa com os trackpads e a aderência, mas ninguém segura um Deck acima da cabeça por uma hora. Para uso na cama ou em viagem, um apoio ou uma superfície plana ajudam mais do que qualquer acessório caro.
:::

## Modelo e firmware via `dmidecode`

O `dmidecode` lê a tabela SMBIOS/DMI que o firmware grava na memória, com informações sobre o fabricante, a placa-mãe, o produto e a BIOS/UEFI. É a forma mais confiável de confirmar o modelo e a revisão por software:

```terminal
$ sudo dmidecode -s system-product-name
Jupiter
$ sudo dmidecode -s system-manufacturer
Valve
$ sudo dmidecode -s bios-version
F7A0120
$ sudo dmidecode -s system-serial-number
FWVA2345678
```

As opções `-s` extraem um único campo de cada vez. O `system-product-name` retorna `Jupiter` — o codinome interno da Valve para a placa do Steam Deck. O `system-manufacturer` devolve `Valve`, e o `bios-version` mostra a versão do firmware (aqui `F7A0120`, típica de unidades OLED mais recentes). O serial (`system-serial-number`) começa com `FW`, o prefixo das unidades da Valve.

O `dmidecode` completo, sem `-s`, imprime toda a tabela — útil para uma visão detalhada, mas longa:

```terminal
$ sudo dmidecode | head -30
# dmidecode 3.5
Getting SMBIOS data from sysfs.
SMBIOS 3.3.0 present.

Handle 0x0001, DMI type 1, 27 bytes
System Information
	Manufacturer: Valve
	Product Name: Jupiter
	Version: 1
	Serial Number: FWVA2345678
	UUID: 4a1c0e2b-...
	Wake-up Type: Power Switch
	SKU Number: 1
	Family: Steam Deck

Handle 0x0002, DMI type 2, 15 bytes
Base Board Information
	Manufacturer: Valve
	Product Name: Jupiter
	Version: 1
	...
```

Aqui aparece o `Family: Steam Deck` e o `Product Name: Jupiter` de novo. É importante entender o que `Jupiter` significa: é o codinome da **plataforma** (a família de placas), não a distinção entre LCD e OLED. Ambas as gerações reportam `Jupiter`, porque compartilham a arquitetura de placa — o que muda entre elas é a revisão interna e o firmware, não o nome do produto exposto no SMBIOS.

:::atencao
Não espere o `dmidecode` escrever "LCD" ou "OLED" em campo algum. O SMBIOS do Steam Deck é genérico de propósito: `Jupiter` vale para as duas gerações. Para separar LCD de OLED por software, confie nos sinais já vistos — capacidade de bateria (40 vs 50 Wh), padrão do Wi-Fi (802.11ac vs ax) e a presença de modos de 90 Hz na tela. O `dmidecode` serve para confirmar o produto e a revisão de firmware, não para rotular a geração.
:::

## Versão de BIOS e a lógica de atualização

O campo `bios-version` que você leu segue um esquema com significado. Versões como `F7A0120` começam com uma letra e um dígito que indicam a geração/família de firmware; a Valve atualiza esse número com o tempo para corrigir bugs, melhorar a gestão de energia e, no caso do OLED, ajustar o comportamento da tela HDR.

O firmware do Steam Deck é atualizado junto com o sistema — não é preciso baixar um arquivo separado como em PCs. Quando o SteamOS aplica uma atualização de imagem, ele pode incluir um novo firmware, que é gravado no próximo boot. Por isso, manter o aparelho atualizado também mantém a BIOS em dia, com impacto direto no consumo e na estabilidade.

```terminal
$ sudo dmidecode -s bios-version
F7A0120
$ sudo dmidecode -s bios-release-date
11/15/2023
```

A `bios-release-date` mostra quando aquele firmware foi compilado. Uma data de 11/2023, por exemplo, coincide com a janela de lançamento do OLED — mas a data do firmware não prova qual é o hardware, apenas quando aquele binário foi gerado. Firmwares mais antigos em aparelhos usados podem indicar que o dono nunca atualizou.

:::dica
O mesmo dado do `dmidecode` pode ser lido sem `sudo` diretamente nos arquivos do kernel, em `/sys/class/dmi/id/`:

```terminal
$ cat /sys/class/dmi/id/product_name
Jupiter
$ cat /sys/class/dmi/id/bios_version
F7A0120
```

É mais conveniente para scripts e não exige permissão de root.
:::

## A física que o software não conta

Nenhum comando mede conforto. O que o terminal entrega — modelo, firmware, serial — é a identificação objetiva; a ergonomia é a soma de peso, distribuição e tamanho que você sente. O OLED melhorou o que o LCD já acertava: manteve os controles e a pegada, reduziu o peso e melhorou o equilíbrio, já que a bateria redesenhada ocupa melhor o espaço interno.

Na prática, a diferença de 30 gramas é menos notada que a melhora de distribuição: o OLED tende a "sentar" melhor nas mãos em sessões longas. Mas ambos continuam pesados para o padrão portátil, e a decisão de qual comprar raramente se apoia só nisso — o peso é um dos últimos critérios, atrás de tela, bateria e preço, como a seção final discute.

| Característica | LCD | OLED |
|---|---|---|
| Peso | ~669 g | ~640 g |
| Tela | 7,0" | 7,4" |
| Codinome SMBIOS | Jupiter | Jupiter |
| Prefixo serial | FW | FW |
| Firmware típico | F7A0105 e anteriores | F7A0120 e posteriores |

A conclusão que o `dmidecode` e o `/sys/class/dmi/id/` permitem: você confirma que a máquina é um Steam Deck autêntico da Valve, com seu serial e revisão de firmware — e usa os sinais de bateria e rede, das seções anteriores, para fechar o diagnóstico de geração. O hardware físico, por fim, explica por que as duas versões são tão parecidas por fora.

## Resumo

- LCD pesa ~669 g; OLED ~640 g, mais leve apesar da bateria maior, graças ao chassi redesenhado.
- A tela cresceu de 7,0" para 7,4" mantendo praticamente as mesmas dimensões externas.
- `sudo dmidecode -s system-product-name` devolve `Jupiter`; `-s bios-version` retorna a versão do firmware.
- `dmidecode` completo mostra fabricante, produto, serial e família (`Steam Deck`).
- Os mesmos dados, sem root, ficam em `/sys/class/dmi/id/product_name` e `bios_version`.
- O SMBIOS não distingue LCD de OLED; use bateria (40/50 Wh) e Wi-Fi (ac/ax) para rotular a geração.

## Exercícios

1. Rode `sudo dmidecode -s system-product-name` e `-s system-serial-number`, anotando o produto e o serial.
2. Leia `/sys/class/dmi/id/product_name` e `bios_version` e confirme que batem com o `dmidecode`.
3. Use `sudo dmidecode -s bios-release-date` e estime a janela de fabricação do firmware. Ele é da época do LCD (2022) ou do OLED (fim de 2023)?
4. Liste todos os campos disponíveis em `/sys/class/dmi/id/` com `ls` e leia três deles que você ainda não tinha visto.
5. **Desafio.** Produza um relatório de identificação completa cruzando: produto e firmware (`dmidecode`/`/sys`), geração por bateria (`energy_full_design`) e por Wi-Fi (`lspci`), e a edição por armazenamento (`lsblk`). Conclua, num parágrafo, exatamente qual Steam Deck é a unidade e com que vidro/acabamento ela foi vendida.
