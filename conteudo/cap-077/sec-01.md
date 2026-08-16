A APU do Steam Deck combina CPU e GPU no mesmo chip, e a AMD entrega esse conjunto com margens de tensão e potência conservadoras para caber em qualquer lote de silicone. Ajustar esses limites — abaixando tensão, elevando tetos de potência ou remexendo no relógio — é o caminho mais barato para ganhar performance sem trocar hardware. A porta de entrada para esse mundo é o **Smokeless UMAF**, um firmware que desbloqueia opções ocultas do menu BIOS da AMD.

:::objetivos
- Entender o que é o Smokeless UMAF e por que ele desbloqueia opções ausentes na BIOS de fábrica
- Preparar um pendrive bootável com o Smokeless UMAF
- Navegar pelas telas principais e localizar as opções de potência da APU
- Salvar alterações de forma segura e reverter para os padrões de fábrica
:::

## O que é e por que ele existe

O Steam Deck usa uma BIOS da AMD com boa parte das opções avançadas escondida do usuário. A Valve ajustou o console para ser "à prova de erros", então coisas como limites de potência, tensão da APU e até a curva de ventoinha ficaram fora do menu visível. O **Smokeless UMAF** (UEFI Menu Advanced Features) é um firmware alternativo, construído sobre o núcleo da própria BIOS da AMD, que reexpõe essas configurações num menu textual ao estilo dos utilitários de BIOS clássicos.

Ele não substitui o firmware da Valve por inteiro: é um boot independente a partir de um pendrive. Você inicializa, mexe no que precisa, salva e volta a usar o SteamOS normalmente. As alterações ficam gravadas na NVRAM da BIOS, então persistem entre reinicializações mesmo sem o pendrive conectado.

:::nota
O Smokeless UMAF é um projeto comunitário (de David S95, também autor do RyzenAdj) e é distribuído como imagem de inicialização. Não exige instalação permanente nem deixa resíduo no disco do Deck quando você o usa pelo pendrive.
:::

## Preparando o pendrive

O processo é parecido com o de criar um pendrive de instalação do Linux. Você baixa a imagem `R7xxx_BIOS_Smokeless_UMAF` e a grava num cartão microSD ou pendrive USB.

```terminal
# lsblk -o NAME,SIZE,TYPE,MOUNTPOINT | head -10
NAME        SIZE TYPE MOUNTPOINT
sda        28.7G disk
└─sda1     28.7G part
nvme0n1   465.8G disk
├─nvme0n1p1   64M part /esp
├─nvme0n1p2   64G part /rootfs
...
```

Aqui `sda` é o pendrive e `nvme0n1` é o SSD interno do Deck. Grave a imagem descompactada no pendrive inteiro, não numa partição:

```terminal
# xz -d Smokeless_UMAF_v1.0.9.zip
# dd if=Smokeless_UMAF_v1.0.9.img of=/dev/sda bs=4M status=progress oflag=sync
```

:::perigo
O `dd` grava byte a byte sobre o dispositivo indicado. Digitar o nome errado em `of=` — por exemplo `/dev/nvme0n1` no lugar de `/dev/sda` — destrói o sistema instalado no Deck de forma irrecuperável. Confira duas vezes o caminho com `lsblk` antes de executar.
:::

Depois de gravar, reinicie o Deck segurando o botão de **Volume −** enquanto liga para entrar no menu de boot e escolha o pendrive.

O menu de boot lista as opções de inicialização disponíveis naquele momento:

```terminal
Boot Menu
 ────────────────────────────────
 1. SteamOS (nvme0n1)
 2. UEFI: Generic USB Flash Disk
 3. UEFI: SanDisk USB 3.0
 ────────────────────────────────
 Selecione com as setas e Enter
```

Escolha a entrada que corresponde ao seu pendrive (aqui, `Generic USB Flash Disk` ou o nome do fabricante). O Smokeless UMAF assume em poucos segundos e mostra a tela principal de configuração.

## Navegando pelas telas

O Smokeless UMAF se parece com uma BIOS de notebook dos anos 2000: fundo azul, navegação por setas e teclado. As telas que importam para o tuning da APU vivem sob **AMD CBS** e **AMD PBS**.

```text
SMOKELESS UMAF
├── Device Manager
│   ├── AMD Overclocking
│   │   ├── Precision Boost Overdrive (PBO)
│   │   └── Curve Optimizer
│   ├── AMD CBS
│   │   ├── SMU Common Options
│   │   ├── NBIO Common Options
│   │   └── FCH Common Options
│   └── AMD PBS
```

O caminho mais usado é `Device Manager → AMD Overclocking → Precision Boost Overdrive`, onde ficam os limites de potência (PPT, TDC, EDC) e o `Curve Optimizer`, onde se faz o undervolting. Use as setas para mover, `Enter` para abrir um item e `Esc` para voltar. A tecla `F10` salva e sai; `Esc` sem salvar descarta as mudanças.

:::atencao
O menu não tem mouse. Tudo é por teclado. Caso você acione uma opção sem querer, pressione `Esc` repetidamente até voltar à tela raiz — e só confirme a gravação quando tiver certeza do que alterou.
:::

## Primeira visita: só observe

Antes de mexer em qualquer número, a prática mais segura é entrar, anotar os valores atuais e sair sem salvar. Os padrões de fábrica do Deck ficam em `AMD Overclocking → Precision Boost Overdrive`, no modo `Auto`, e valem como referência para qualquer retrocesso futuro.

Anote, por exemplo, que em `SMU Common Options → System Configuration` dá para ver a versão do firmware SMU e o TDP nominal da APU (15 W no modelo original, customizável até ~25 W no OLED).

## Onde ficam as opções-chave

| Opção | Local | O que controla |
|---|---|---|
| PPT / TDC / EDC | AMD Overclocking → PBO | Tetos de potência, corrente e térmica da APU |
| Curve Optimizer | AMD Overclocking | Deslocamento de tensão por núcleo |
| GPU Clock Frequency | AMD CBS → NBIO | Relógio da GPU integrada (Vega/RDNA) |
| Fan control | FCH Common Options | Modo da curva de ventoinha |

Cada uma dessas opções é detalhada nas seções seguintes deste capítulo. O importante agora é memorizar o caminho e a ordem: **PBO** para limites, **Curve Optimizer** para tensão, **NBIO** para GPU.

## Resumo

- O Smokeless UMAF reexpõe opções ocultas da BIOS da AMD sem substituir o firmware da Valve.
- Ele roda a partir de um pendrive, mas as alterações gravadas persistem na NVRAM após reiniciar.
- A gravação da imagem no pendrive usa `dd`; errar o dispositivo de destino destrói o SSD.
- PBO, Curve Optimizer e NBIO concentram as opções de potência, tensão e relógio da GPU.
- Antes de qualquer ajuste, anote os valores de fábrica para poder reverter.

## Exercícios

1. Liste os discos do sistema com `lsblk` e identifique, pela capacidade, qual seria o pendrive de 32 GB num Deck com SSD de 512 GB.
2. Baixe a imagem do Smokeless UMAF e grave-a num pendrive; anote o tamanho exato em bytes do arquivo `.img` antes de gravar.
3. Entre no Smokeless UMAF, navegue até `AMD Overclocking → Precision Boost Overdrive` e anote os três valores exibidos no modo `Auto` — saia sem salvar.
4. Localize em `SMU Common Options` a versão do firmware SMU e compare com a versão visível no SteamOS (veja a seção sobre RyzenAdj).
5. **Desafio.** Sem mexer em nada, descreva em um parágrafo qual caminho você seguiria para ajustar apenas o teto de potência (PPT) e por que deixaria TDC/EDC em `Auto` na primeira tentativa. Relacione sua resposta à próxima seção.
