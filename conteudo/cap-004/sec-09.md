Depois de oito seções esmiuçando cada componente, a pergunta prática permanece: qual comprar? A resposta depende de cenário, orçamento e do que você valoriza, mas o conhecimento técnico acumulado permite responder com fundamento. Esta seção fecha o capítulo aplicando tudo o que você aprendeu a uma decisão de compra e a um roteiro de diagnóstico que resume o conteúdo inteiro.

Aqui você transforma os dados de tela, bateria, processador, Wi-Fi, armazenamento, peso e refrigeração em critérios de escolha — e elabora um script de diagnóstico completo.

:::objetivos
- Mapear cada característica técnica a um critério de decisão de compra
- Comparar os modelos por cenário de uso (viagem, TV, jogos leves, AAA)
- Elaborar um roteiro de diagnóstico que distingue LCD e OLED em 4 comandos
- Avaliar edições de armazenamento e o custo-benefício do upgrade
- Decidir com fundamento, e não com marketing
:::

## Quando cada modelo faz sentido

O Steam Deck LCD e o OLED atendem a públicos diferentes, e a escolha não é binária "OLED sempre melhor". Organize os critérios pelo que eles representam na prática:

**Tela.** O OLED entrega pretos reais, HDR e 90 Hz. Se você joga títulos escuros (horror, ficção científica, aventura noturna) ou valoriza os 90 Hz, o OLED é claramente superior. O LCD é IPS 60 Hz, 400 nits — honesto, mas sem HDR nem contraste OLED. Se a tela for o critério número 1, a escolha é OLED.

**Bateria.** 50 Wh contra 40 Wh, com consumo menor. O OLED rende de 30% a 50% mais em uso leve, e a diferença é sentida em viagens longas, voos e uso desplugado. Para quem joga principalmente na tomada, a bateria do LCD é suficiente.

**Wi-Fi e conectividade.** Wi-Fi 6E (OLED) importa se você tem roteador compatível e baixa muitos jogos ou faz streaming local (Steam Link, Moonlight, Chiaki). Com roteador Wi-Fi 5, o ganho de rádio é modesto. O Bluetooth do OLED é mais estável.

**Processador e desempenho.** O desempenho de jogo é praticamente idêntico. A escolha não deve se apoiar nesse critério.

**Armazenamento e preço.** O OLED de entrada (512 GB) é mais caro que o LCD de entrada (64 GB), mas o LCD de 64 GB tem eMMC lento, exigindo upgrade ou microSD. O OLED de 1 TB é o topo e custa mais. O custo-benefício depende do preço de mercado no momento da compra.

**Usado ou novo.** No mercado de usados, o LCD de 512 GB (NVMe, vidro antirreflexo) costuma ser o melhor custo-benefício. O LCD de 64 GB (eMMC) é o mais barato, mas exige upgrade ou convivência com mídia lenta. O OLED usado é caro, mas entrega tela e bateria de ponta.

:::exemplo
**Cenário real.** Ana viaja de ônibus 3 horas por dia e joga Hades, Hollow Knight e Elden Ring. Ela quer autonomia e tela boa para jogos escuros. O OLED de 512 GB atende: bateria de 50 Wh cobre o trajeto, HDR realça as cavernas e os pretos, e 90 Hz deixam Hades ainda mais fluido. O LCD de 512 GB serviria, mas a autonomia menor obrigaria a carregar um powerbank, e o contraste IPS não entrega o mesmo nas cenas escuras de Hollow Knight.
:::

## O roteiro de diagnóstico em 4 comandos

Ao longo do capítulo você acumulou ferramentas para identificar o modelo. O que era diagnóstico espalhado agora vira um roteiro coeso: quatro comandos que respondem "qual Steam Deck é este" com confiança.

**Passo 1 — bateria.** A capacidade de projeto em `/sys/class/power_supply/BAT1/energy_full_design` separa 40 Wh (LCD) de 50 Wh (OLED). É o sinal mais direto e confiável.

**Passo 2 — Wi-Fi.** `lspci | grep -i network` mostra `802.11ac` (LCD, Wi-Fi 5) ou `802.11ax` (OLED, Wi-Fi 6E). Confirmação cruzada com a bateria.

**Passo 3 — armazenamento.** `lsblk -d -o NAME,SIZE,TRAN` revela a mídia: `nvme` (SSD) ou `mmc` (eMMC/microSD). Junto com o tamanho, identifica a edição (64 GB eMMC, 256/512 GB NVMe, 1 TB NVMe).

**Passo 4 — firmware.** `cat /sys/class/dmi/id/product_name` devolve `Jupiter` (confirma que é Steam Deck) e `bios_version` informa a revisão do firmware, que pode sugerir fabricação mais antiga (LCD) ou recente (OLED).

Antes de juntar tudo, vale confirmar cada passo isoladamente. A bateria e o Wi-Fi são os dois pilares do diagnóstico:

```terminal
$ cat /sys/class/power_supply/BAT1/energy_full_design
40000000
$ lspci | grep -i network
01:00.0 Network controller: Realtek Semiconductor Co., Ltd. RTL8822CE 802.11ac PCIe Wireless Network Adapter
```

A bateria de `40000000` µWh (40 Wh) fecha o LCD, e o `802.11ac` confirma o Wi-Fi 5 do modelo de 2022. Se os dois números discordassem, valia a pena checar de novo — algo estaria errado na leitura ou no aparelho.

Os quatro comandos integrados num bloco:

```terminal
$ cat /sys/class/power_supply/BAT1/energy_full_design
40000000
$ lspci | grep -i network
01:00.0 Network controller: Realtek Semiconductor Co., Ltd. RTL8822CE 802.11ac PCIe Wireless Network Adapter
$ lsblk -d -o NAME,SIZE,TRAN
NAME      SIZE TRAN
nvme0n1 476.9G nvme
$ cat /sys/class/dmi/id/product_name
Jupiter
```

A leitura é imediata: bateria de 40 Wh (`40000000` µWh), Wi-Fi `802.11ac` e SSD NVMe de 512 GB confirmam um **Steam Deck LCD de 512 GB com vidro antirreflexo**. O firmware `Jupiter` fecha a identificação.

A beleza do roteiro é que ele funciona em qualquer Steam Deck, novo ou usado, sem instalar nada além do que já vem no sistema. Com esses quatro comandos você elimina a dúvida de "qual modelo é esse" em segundos.

:::dica
Guarde esse roteiro como um script de uma linha ou um arquivo de notas. Ao avaliar um Steam Deck usado (OLX, marketplace, loja física), peça ao vendedor que rode esses comandos ou mostre o menu de sistema. Se o vendedor se recusar, a unidade pode não ser o que ele anuncia.
:::

## Edições de armazenamento e o custo do upgrade

A decisão de compra também passa pelo armazenamento. A edição de 64 GB (LCD) parece atraente pelo preço, mas o eMMC é lento e o espaço é minúsculo — um único AAA pode ocupar mais de 100 GB. O upgrade para NVMe de 2230 é possível, mas exige abrir o aparelho, reinstalar o SteamOS e ter um SSD compatível.

Já as edições NVMe (256 GB, 512 GB, 1 TB) não precisam de upgrade na maioria dos cenários. O microSD serve de complemento barato: um cartão de 512 GB ou 1 TB resolve o espaço sem abrir o aparelho, com carregamentos só um pouco mais lentos.

Para enxergar a diferença entre disco interno e cartão, o par `lsblk`/`df` resolve num relance:

```terminal
$ lsblk -d -o NAME,SIZE,TRAN
NAME      SIZE TRAN
mmcblk0 119.1G mmc
nvme0n1 476.9G nvme
$ df -h | grep -E 'overlay|microsd'
overlay            476G  321G  136G   71% /
/dev/mmcblk0p2     114G   21G   93G   19% /run/media/deck/microsd
```

O disco interno é NVMe de 512 GB (`nvme`); o microSD é `mmc` de 128 GB. Detalhe essencial para usados: o espaço "total" visível soma interno e cartão, mas performance e risco de upgrade diferem — não se deixe enganar por um "512 GB" que é um cartão inserido.

A tabela de custo-benefício (com preços de mercado variáveis) ajuda a raciocinar, não a cravar valores:

| Edição | Mídia | Espaço útil | Upgrade necessário? | Para quem |
|---|---|---|---|---|
| LCD 64 GB | eMMC | ~46 GB | quase sempre | quem quer abrir e trocar SSD |
| LCD 256 GB | NVMe | ~238 GB | microSD basta | orçamento apertado, uso casual |
| LCD 512 GB | NVMe | ~476 GB | raramente | melhor custo-benefício usado |
| OLED 512 GB | NVMe | ~476 GB | não | tela + bateria premium |
| OLED 1 TB | NVMe | ~931 GB | não | biblioteca grande, sem microSD |

:::atencao
Cuidado ao comprar usado: o que o vendedor anuncia como "512 GB" pode ser um LCD de 64 GB com microSD de 512 GB inserido. O `lsblk` e o `df` que você domina desde a seção de armazenamento revelam a verdade. Sempre confira o tipo de transporte (`nvme` vs `mmc`) e o tamanho do disco interno, não o total de espaço "visto" pelo sistema com o cartão.
:::

## O veredito final

O Steam Deck LCD foi o portátil que inaugurou a categoria com força. O OLED refinou o que já funcionava, melhorando onde mais importava (tela, bateria, silêncio) sem mexer no que já estava certo (desempenho, controles, compatibilidade).

Se você já tem um LCD, o OLED é um upgrade real — mas não essencial. Para o primeiro Deck, o OLED de 512 GB é o ponto ideal; o LCD de 512 GB usado é o herói do custo-benefício. E agora você tem o diagnóstico de terminal para confirmar, com comandos, se o aparelho na sua mão é exatamente o que pagou para ter.

## Resumo

- O OLED vence em tela (HDR, 90 Hz), bateria (50 Wh) e silêncio; o LCD empata em desempenho e é mais barato.
- Bateria (40 vs 50 Wh) e Wi-Fi (ac vs ax) são os dois sinais de terminal que separam as gerações com segurança.
- O roteiro de diagnóstico (bateria + Wi-Fi + armazenamento + firmware) identifica o modelo e a edição em 4 comandos.
- A edição de 64 GB (eMMC) exige upgrade; as NVMe (256 GB+) resolvem com microSD.
- Usados: confirme o tipo de mídia (`lsblk`) e a saúde da bateria (`upower`) antes de fechar negócio.
- O OLED de 512 GB é o ponto ideal para o primeiro Deck; o LCD de 512 GB usado é o melhor custo-benefício.

## Exercícios

1. Monte o roteiro de diagnóstico na sua unidade: execute os 4 comandos e escreva um parágrafo identificando geração e edição.
2. Verifique a saúde da bateria com `upower` e estime quantos ciclos a unidade tem. Se for usada, a saúde ainda é boa (>90%)?
3. Calcule o espaço livre real com `df -h` e estime quantos jogos AAA (~100 GB cada) cabem no disco interno e no microSD.
4. Pesquise o preço atual de um SSD M.2 2230 de 1 TB e compare com o custo de um microSD de 1 TB. Qual o custo por GB de cada um?
5. **Desafio.** Produza um relatório de compra completa: (a) identifique sua unidade com o roteiro de 4 comandos; (b) avalie bateria (`upower`), armazenamento (`lsblk`, `df`) e conectividade (`lspci`); (c) escreva um veredito em prosa — se esta unidade fosse colocada à venda hoje, qual seria o preço justo e por quê, considerando todos os critérios do capítulo.