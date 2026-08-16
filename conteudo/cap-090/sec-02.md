Todo processo de garantia começa por identificar exatamente qual aparelho você tem nas mãos. Modelo (LCD ou OLED), capacidade de armazenamento e número de série são os três dados que a Valve pede logo no começo de um ticket, e errar aqui atrasa o atendimento. O número de série também permite à Valve saber se o aparelho já passou por outro RMA e qual foi o lote de fabricação.

:::objetivos
- Localizar o número de série na etiqueta física e no sistema
- Identificar modelo, SKU e capacidade de armazenamento
- Extrair esses dados por linha de comando
- Registrar a informação de forma confiável para o chamado
:::

## Onde o serial mora

O número de série do Steam Deck está impresso em uma etiqueta na parte traseira do aparelho, geralmente perto da grade de ventilação, junto com o modelo e a capacidade de armazenamento. É o mesmo dado que o sistema expõe por software — e conferir os dois é um bom teste de sanidade antes de qualquer envio.

```terminal
$ cat /sys/class/dmi/id/product_serial
FWXXXXX1234
$ cat /sys/class/dmi/id/product_name
Jupiter
```

O nome "Jupiter" é o codinome interno da Valve para a plataforma do Steam Deck original (LCD). A versão OLED tem codinome próprio ("Galileo"), e essa diferença aparece no `product_name` e é um jeito rápido de confirmar a geração do aparelho.

## Modelo, SKU e capacidade

Além do serial, o chamado pergunta qual configuração você tem. O Steam Deck LCD foi vendido em três capacidades (64 GB eMMC, 256 GB NVMe e 512 GB NVMe), e o OLED em 512 GB e 1 TB. A capacidade de armazenamento visível no sistema nem sempre bate com a comercial (o sistema operacional e o particionamento "comem" parte do espaço), então a Valve quer a capacidade de fábrica, não o espaço livre.

```terminal
$ lsblk -d -o NAME,SIZE,MODEL
NAME    SIZE MODEL
nvme0n1  1T  WD_BLACK SN770M 1TB
```

O campo `MODEL` revela o disco instalado. Se ele for diferente do que a Valve espera para aquela SKU (alguém trocou o SSD, por exemplo), isso pode aparecer na conversa de suporte — por isso vale anotar o estado real, não o de fábrica, e ser transparente.

## Tudo reunido com dmidecode

O jeito mais limpo de coletar identificação num comando só é o `dmidecode`, que lê a tabela DMI/SMBIOS exposta pelo firmware. Ele devolve fabricante, produto, serial e versão da BIOS em uma tomada única, formato ideal para colar no formulário do suporte.

```terminal
$ sudo dmidecode -t system
Handle 0x0001, DMI type 1, 27 bytes
System Information
	Manufacturer: Valve
	Product Name: Jupiter
	Serial Number: FWXXXXX1234
	UUID: 9f0a3c2e-...
	Wake-up Type: Power Switch
	Family: A
```

Repare no `Manufacturer: Valve` e no `Family`, que identifica a revisão de hardware ("A" indica a primeira revisão do LCD). Dados como estes ajudam a Valve a saber se seu aparelho pertence a um lote com recall ou problema conhecido.

:::dica
Salve `sudo dmidecode -t system` em um arquivo de texto junto com a nota fiscal antes de qualquer contato. Se o aparelho precisar ser enviado, você terá a identificação em mãos mesmo sem o aparelho físico.
:::

## Conferindo serial e consistência

Antes de preencher o chamado, confira que o serial da etiqueta bate com o do sistema. Divergência acontece quando a carcaça foi trocada ou o dispositivo é recondicionado, e isso muda o histórico da Valve. Também vale registrar a versão do firmware (BIOS), pois atualizações dela corrigem desde fan noise até carregamento.

```terminal
$ cat /sys/class/dmi/id/bios_version
F7A0121
$ cat /sys/class/dmi/id/product_family
A
```

A combinação `product_serial` + `bios_version` + `product_family` identifica o aparelho de forma quase única. Guarde esses três valores: são exatamente o que o suporte pede para cruzar com o banco de lotes.

:::nota
O código de barras da caixa original também guarda o serial. Se a etiqueta traseira estiver ilegível (desgaste comum), a caixa é a segunda fonte oficial — e costuma ser aceita como prova de número de série.
:::

## Erros comuns na identificação

Um erro recorrente é confundir o **serial do aparelho** com o **ID da conta Steam** ou com o número de patrimônio que aparece no painel de dispositivos da conta. São coisas diferentes: a Valve quer o serial físico do hardware, não o seu login. Outro erro é copiar o serial trocando caracteres — o `O` (letra) com `0` (zero) — o que faz o sistema não encontrar o aparelho.

```terminal
$ cat /sys/class/dmi/id/product_serial | tr -d ' \n'
FWXXXXX1234
```

O `tr -d` remove espaços e quebras de linha invisíveis que podem entrar junto na hora de copiar e colar no formulário. Vale usar sempre que for transferir o serial para um ticket, evitando que um caractere fantasma invalide o número.

| Fonte | Campo | Uso |
|---|---|---|
| `/sys/class/dmi/id/product_serial` | serial | identificação do aparelho |
| `/sys/class/dmi/id/product_name` | modelo | LCD (Jupiter) vs OLED (Galileo) |
| `/sys/class/dmi/id/bios_version` | firmware | versão da BIOS |
| `dmidecode -t system` | todos | dossiê completo |

## Resumo

- O número de série aparece na etiqueta traseira, na caixa e em `/sys/class/dmi/id/product_serial`.
- `product_name` distingue a geração: "Jupiter" (LCD) e "Galileo" (OLED).
- `lsblk` revela o disco real instalado, e `dmidecode -t system` reúne toda a identificação de uma vez.
- Anote serial, versão de BIOS e família de hardware antes de abrir o chamado.
- Divergências entre etiqueta e sistema indicam carcaça trocada ou aparelho recondicionado.

## Exercícios

1. Rode `cat /sys/class/dmi/id/product_serial` e compare o resultado com a etiqueta traseira do aparelho.
2. Execute `cat /sys/class/dmi/id/product_name` e determine se seu aparelho é LCD ("Jupiter") ou OLED ("Galileo").
3. Use `lsblk -d -o NAME,SIZE,MODEL` para identificar o disco; anote modelo e capacidade e relacione com a SKU de fábrica.
4. Gere a identificação completa com `sudo dmidecode -t system` e salve a saída em um arquivo para o chamado.
5. **Desafio.** A partir dos campos `product_family` e `bios_version`, pesquise se há alguma revisão de hardware ou atualização de firmware relevante para o seu aparelho e escreva um parágrafo explicando por que a versão do firmware importa para um pedido de garantia.
