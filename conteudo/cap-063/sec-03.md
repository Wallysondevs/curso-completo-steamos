A Valve não vende Windows, mas fornece os drivers para que ele funcione no Deck. Sem eles, o Windows enxerga uma tela de 800p, não tem Wi-Fi, o áudio não sai e o controle não é reconhecido. Todo o resto do capítulo depende de ter os drivers certos na hora certa — e alguns deles têm ordem de instalação.

:::objetivos
- Baixar o pacote completo de drivers da Valve para o Steam Deck
- Instalar os drivers na ordem correta para evitar conflito
- Entender por que a APU (processador gráfico) é o driver mais crítico
- Identificar qual driver é o Wi-Fi em cada modelo de Deck (LCD vs OLED)
- Diagnosticar falhas de driver pelo Gerenciador de Dispositivos
:::

## Onde estão os drivers e o que cada um cobre

A Valve mantém uma página oficial com todos os drivers do Steam Deck para Windows. O endereço é fixo e atualizado conforme saem novas versões de firmware e hardware — o pacote cobre tanto o modelo LCD quanto o OLED.

Os drivers que você precisa:

| Driver | Componente | Consequência se faltar |
|---|---|---|
| APU (chipset + gráfico) | CPU, GPU, PCIe | Resolução travada em 800p, sem aceleração 3D |
| Wi-Fi | Wireless (Qualcomm Atheros no LCD, Mediatek no OLED) | Sem rede sem fio |
| Bluetooth | Rádio BT (mesmo chip do Wi-Fi) | Sem pareamento de controles ou fones |
| Áudio 1 (cs35l41) | Amplificador dos alto-falantes | Som fraco ou inexistente |
| Áudio 2 (nau88l21) | Codec de áudio nos fones | Sem som no conector P2 |
| Leitor de cartão SD | Bayhub / Genesys Logic | Cartão microSD não aparece |

Baixe todos de uma vez, extraia num diretório separado e mantenha o pendrive por perto: se precisar reinstalar em outro momento, os drivers são o primeiro passo pós-instalação.

```terminal
$ mkdir -p ~/deck-drivers && cd ~/deck-drivers
$ ls
APU_Driver.cmd
WiFi_Driver.cab
Bluetooth_Driver.cab
Audio_CS35L41.cab
Audio_NAU88L21.cab
SD_Card_Reader.cab
```

:::nota
Os drivers de áudio são fornecidos como dois pacotes separados, e ambos precisam ser instalados. O CS35L41 é o amplificador classe D que comanda os falantes embutidos; o NAU88L21 é o codec que serve o conector de fone de ouvido. Um sem o outro resulta em som que funciona em um lugar e falha no outro.
:::

## Ordem de instalação: a APU primeiro

A ordem importa porque a APU expõe o PCIe, e os demais drivers (Wi-Fi, Bluetooth, leitor SD) dependem desse barramento para serem detectados. Instalar a APU depois de outros drivers pode quebrar associações que o Windows criou com drivers genéricos.

O passo a passo recomendado:

1. **APU** — execute `APU_Driver.cmd` como administrador (clique com botão direito, "Executar como administrador"). A tela pisca uma ou duas vezes enquanto a resolução salta de 800p para 1280x800, e o Windows detecta a GPU Aerith (Van Gogh / Mendocino no OLED).
2. **Wi-Fi** — o arquivo `.cab` do Wi-Fi pode ser instalado clicando com botão direito e escolhendo "Instalar". Sem ele, o Gerenciador de Dispositivos mostra um "Dispositivo de rede" com ícone amarelo.
3. **Bluetooth** — mesma mecânica: `.cab`, botão direito, "Instalar".
4. **Áudio** — instale o CS35L41 primeiro e o NAU88L21 em seguida. Reinicie.
5. **Leitor SD** — último. Se houver um cartão inserido, ejete antes de instalar.

Ao final, o Gerenciador de Dispositivos deve estar limpo — nenhum ícone de atenção amarelo. Se houver, o *Hardware ID* do dispositivo revela qual driver falta.

```terminal
$ # No PowerShell como administrador:
Get-PnpDevice -PresentOnly | Where-Object {$_.Problem -ne 0}
```

## Diagnosticando pelo Gerenciador de Dispositivos

O ícone de alerta amarelo dentro do Gerenciador de Dispositivos é o primeiro sintoma de driver ausente ou errado. Clique com botão direito no dispositivo, vá em **Propriedades → Detalhes → IDs de hardware**, e o valor começa com algo como `PCI\VEN_14E3&DEV_0608` — o VENdor e o DEVice são os códigos que você joga no Google ou no banco de *Device Hunt* para descobrir qual é a peça.

| Ícone | Significado |
|---|---|
| Triângulo amarelo | Driver ausente ou incompatível |
| "X" vermelho | Dispositivo desabilitado |
| Triângulo azul | Atualização de driver disponível via Windows Update |

:::perigo
Não use o Windows Update para atualizar drivers de chipset e APU depois de instalar os da Valve. O Windows Update às vezes empurra uma versão genérica da AMD que sobrescreve ajustes específicos do Deck, e você perde o controle de brilho ou o modo tablet. Prefira o instalador da Valve quando houver conflito.
:::

## A diferença de Wi-Fi entre LCD e OLED

O Deck LCD usa um chip Qualcomm Atheros QCA6174 (Wi-Fi 5). O OLED usa um Mediatek MT7922 (Wi-Fi 6/6E). Os drivers são diferentes, e instalar o driver errado (ou deixar o Windows Update escolher) causa desconexões constantes e latência de rede errática.

Se o Wi-Fi do seu Deck OLED não estabiliza, confirme no Gerenciador de Dispositivos que o driver listado é o da Mediatek, não o da Qualcomm. A troca de fabricante entre os modelos é uma das causas mais comuns de confusão em fóruns.

No PowerShell, é possível listar os drivers de rede instalados e o fabricante:

```terminal
$ Get-NetAdapter | Select-Object Name, InterfaceDescription, DriverFileName
Name     InterfaceDescription               DriverFileName
------   --------------------               --------------
Wi-Fi    Qualcomm Atheros QCA61x4A          Qcamain10x64.sys
```

Se a coluna `InterfaceDescription` diz Qualcomm mas seu Deck é OLED, você está com o driver errado — a correção é reinstalar o pacote da Mediatek.

## Resumo

- A Valve fornece drivers para APU, Wi-Fi, Bluetooth, áudio duplo e leitor SD.
- Instale a APU primeiro; os demais dependem dela para acessar o PCIe.
- Os dois drivers de áudio (CS35L41 para falantes, NAU88L21 para fone) são independentes.
- O Gerenciador de Dispositivos revela drivers faltantes pelo ícone amarelo.
- O Deck LCD usa Qualcomm para Wi-Fi; o OLED usa Mediatek — drivers distintos.

## Exercícios

1. Acesse a página de drivers da Valve e baixe o pacote completo. Confira se todos os arquivos `.cab` e `.cmd` estão presentes.
2. Instale os drivers na ordem recomendada. Antes e depois de cada etapa, abra o Gerenciador de Dispositivos e anote quais ícones sumiram.
3. No PowerShell, execute `Get-PnpDevice` e localize o dispositivo de Wi-Fi. Qual é o *FriendlyName* e o *InstanceId* dele?
4. Simule: um Deck OLED está com Wi-Fi caindo a cada 5 minutos. Que driver está provavelmente instalado no lugar do correto? Como você confirmaria?
5. **Desafio.** Extraia o conteúdo de um arquivo `.cab` com `expand` no PowerShell e identifique, pelo nome do `.inf`, qual hardware ele atende. Compare com o Hardware ID que aparece no Gerenciador de Dispositivos.