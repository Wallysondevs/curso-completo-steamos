Quando você aperta o botão de energia do Deck e a tela apaga, o kernel não está simplesmente "descansando". Ele entra num estado padronizado pela especificação ACPI do firmware da placa-mãe: o **S3**, conhecido como *suspend to RAM*. A Valve depende desse estado de energia como fundação para uma das funcionalidades mais elogiadas do aparelho, e entender o que está acontecendo no hardware enquanto o Deck "dorme" evita confusões comuns sobre consumo, calor e retomada.

:::objetivos
- Compreender o estado ACPI S3 e seu lugar na hierarquia de estados de energia
- Verificar qual modo de suspensão o kernel está usando no Deck
- Interpretar os arquivos do sysfs que controlam a política de suspensão
- Diferenciar `s2idle` de `deep` no contexto do Deck
:::

## A hierarquia ACPI

O firmware ACPI define seis estados globais, de S0 (máquina acordada, tudo funcionando) até S5 (desligada, sem nenhuma energia residual). Cada estado desliga mais componentes que o anterior:

| Estado | Nome | RAM | CPU | Dispositivos |
|---|---|---|---|---|
| S0 | Working | Ligada | Ligada | Ligados |
| S1 | Sleep | Ligada | Clock parado | Parados |
| S2 | — (raro) | Ligada | Desligada | Parados |
| S3 | Suspend to RAM | Ligada (refresh) | Desligada | Desligados (exceto wake) |
| S4 | Hibernate | Salva no disco | Desligada | Desligados |
| S5 | Soft off | Apagada | Desligada | Desligados |

O Deck usa **S3**. A CPU deixa de executar instruções, as ventoinhas param, a GPU se cala, o áudio some, o Wi-Fi pode ou não continuar ativo dependendo da configuração. A RAM, porém, permanece no modo *self-refresh*: um circuito simples dentro do chip de memória reescreve cada célula periodicamente para que os bits não se deteriorem. Sem esse truque, a RAM perderia o conteúdo em frações de segundo.

```terminal
$ cat /sys/power/mem_sleep
[s2idle] deep
```

Esse arquivo é a chave para entender qual variante do S3 está em uso. O valor entre colchetes é o modo ativo: `s2idle` é o suspend-to-idle (mais rápido no acordar, mas menos econômico), enquanto `deep` é o S3 tradicional, mais eficiente. O kernel escolhe um default, mas você pode trocar.

## Deep vs. s2idle: a escolha que importa

No `s2idle`, o kernel congela os processos de usuário e coloca os dispositivos nos estados de baixo consumo mais profundos que suportam, mas o processador continua ativo o suficiente para receber interrupções e reagir rapidamente. É o que muitos notebooks x86 modernos usam porque a Microsoft pressionou por tempos de retomada cada vez menores.

No `deep` (S3 clássico), a CPU realmente desliga. Só a RAM e um circuito mínimo de *wake* (o controlador de interrupções) continuam energizados. A diferença de consumo entre os dois pode ser de 0,5 W a 2 W, dependendo do hardware — pouco numa tomada, mas relevante na bateria de 40 Wh do Deck.

```terminal
$ echo deep | sudo tee /sys/power/mem_sleep
deep
$ cat /sys/power/mem_sleep
s2idle [deep]
```

A troca é imediata: você escreve o modo desejado e a partir daí toda suspensão usa a nova política. O SteamOS 3.6 já entrega o Deck configurado com o modo mais adequado para o hardware customizado da Valve (APU Aerith/Sephiroth), mas vale saber como inspecionar.

:::dica
Se um dia você notar que o Deck está drenando bateria mais rápido do que o esperado durante a suspensão, verifique `cat /sys/power/mem_sleep`. Um kernel recém-atualizado pode ter trocado o default de `deep` para `s2idle`, e isso explicaria o consumo maior.
:::

## Quem acorda o Deck

Com a CPU desligada, alguém precisa acionar o "despertador". O hardware reserva um punhado de fontes de *wakeup*: dispositivos que, mesmo com o sistema em S3, continuam monitorando o mundo externo e podem disparar uma interrupção que religa tudo. O botão de energia é uma delas, claro, mas não é a única.

```terminal
$ cat /proc/acpi/wakeup
Device  S-state   Status   Sysfs node
GPP0      S4    *enabled   pci:0000:00:01.0
GPP3      S4    *enabled   pci:0000:00:02.0
XHC0      S4    *enabled   pci:0000:05:00.4
GBE       S4    *disabled  pci:0000:04:00.0
```

Cada linha é um dispositivo que pode acordar o sistema. O `S-state` indica em qual estado ele pode gerar wakeup (`S4` significa que funciona tanto em suspensão quanto em hibernação). O asterisco antes de `enabled` ou `disabled` mostra se está habilitado. `XHC0`, por exemplo, é o controlador USB — com ele habilitado, conectar um hub USB-C pode acordar o Deck. O `GBE` (Gigabit Ethernet) está desabilitado porque o Deck não tem porta ethernet nativa.

:::atencao
Se o Deck está acordando sozinho dentro da case, um dispositivo USB-C com algum sinal elétrico residual pode ser o culpado. Desabilite a fonte de wakeup suspeita com `echo disabled | sudo tee /proc/acpi/wakeup` no nó correspondente e teste novamente.
:::

## O papel do firmware da Valve

A Valve não usa uma BIOS de PC comum — o Deck tem firmware próprio, baseado em coreboot com um payload UEFI, ajustado milímetro a milímetro para o hardware da placa. Isso inclui as tabelas ACPI que descrevem quais estados de energia o hardware suporta e como entrar e sair deles. É por isso que a experiência de suspensão do Deck é tão mais polida do que a de um notebook Linux genérico: o firmware foi escrito sabendo exatamente qual APU, qual controlador de memória e qual PCIe estão presentes.

```terminal
$ sudo dmesg | grep -i acpi | head -6
[    0.324578] ACPI: Core revision 20230628
[    0.328901] ACPI: 1 ACPI AML tables successfully acquired and loaded
[    0.331245] ACPI: EC: EC started
[    0.331248] ACPI: EC: interrupt blocked
[    0.332456] ACPI: \_SB_.PCI0.LPC0.EC0_: Boot ECDT EC used to handle transactions
[    0.334892] ACPI: bus type USB registered
```

As mensagens de boot mostram que o kernel carregou as tabelas ACPI do firmware do Deck (`1 ACPI AML tables successfully acquired and loaded`) e inicializou o *embedded controller* (EC), o microcontrolador que gerencia carga da bateria, ventoinha, botão de energia e, crucialmente, os sinais de wakeup por pressão do botão.

## Resumo

- S3 (suspend to RAM) desliga CPU, GPU e dispositivos; só a RAM em self-refresh e um circuito de wake continuam alimentados.
- `/sys/power/mem_sleep` mostra o modo ativo: `s2idle` (mais rápido, menos econômico) ou `deep` (S3 verdadeiro, mais eficiente).
- Você pode trocar o modo com `echo deep | sudo tee /sys/power/mem_sleep`.
- `/proc/acpi/wakeup` lista quais dispositivos podem acordar o sistema e se estão habilitados.
- O firmware coreboot do Deck tem tabelas ACPI otimizadas para o hardware específico, o que explica a fluidez do suspend/resume.

## Exercícios

1. Leia `/sys/power/mem_sleep` e registre qual modo está ativo no seu Deck. Anote também a data do teste.
2. Liste as fontes de wakeup com `cat /proc/acpi/wakeup`. Identifique pelo menos três dispositivos e pesquise o que cada um controla.
3. Compare o conteúdo de `/sys/power/mem_sleep` com `cat /sys/power/state`. Qual a relação entre os dois arquivos?
4. Use `sudo dmesg | grep -i "acpi:"` para extrair as mensagens de inicialização ACPI e encontre a versão da especificação que o firmware do Deck implementa.
5. **Desafio.** Altere temporariamente o modo de suspensão para `s2idle`, suspenda o Deck por uma hora e meça a queda de bateria. Depois volte para `deep`, repita o teste e compare. A diferença é compatível com o que a teoria prevê?