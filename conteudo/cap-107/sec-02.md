O Steam Deck saiu em fevereiro de 2022 numa versão única. Em novembro de 2023, a Valve lançou uma revisão profunda — o Steam Deck OLED — que corrigiu as três maiores críticas do modelo original: a tela, a bateria e o Wi-Fi. Entender as duas versões é essencial porque elas continuam coexistindo no mercado, com o LCD ocupando a faixa de entrada e o OLED a faixa premium. Esta seção compara os dois modelos em detalhe.

:::objetivos
- Distinguir as diferenças de hardware entre Steam Deck LCD e OLED
- Compreender o impacto da tela OLED na experiência e no consumo
- Comparar bateria, conectividade e resfriamento entre os dois modelos
- Identificar qual versão faz sentido para cada orçamento
:::

## O que mudou de verdade na revisão OLED

Ao contrário do que o nome sugere, a revisão de 2023 não foi só uma troca de painel. A Valve fez uma re-engenharia ampla do dispositivo, mantendo a mesma APU (o Aerith, agora chamado Sephiroth na versão de 6 nm) para preservar compatibilidade de desempenho. As mudanças se concentraram em oito frentes:

| Componente | Steam Deck LCD | Steam Deck OLED |
|---|---|---|
| Tela | 7" LCD, 1280×800, 60 Hz, ~400 nits, sRGB 67% | 7,4" OLED, 1280×800, 90 Hz, 1000 nits HDR, DCI-P3 110% |
| APU | AMD Aerith, 7 nm | AMD Sephiroth, 6 nm (mesma arquitetura) |
| Bateria | 40 Wh | 50 Wh |
| Wi-Fi | Wi-Fi 5 (802.11ac) | Wi-Fi 6E (802.11ax) |
| Bluetooth | 5.0 | 5.3 |
| Peso | 669 g | 640 g |
| Ventoinha | maior e mais barulhenta | menor e mais silenciosa |
| Armazenamento | 64 GB eMMC / 256–512 GB NVMe | 512 GB / 1 TB NVMe |

A APU Sephiroth é o Aerith fabricado no processo de 6 nm da TSMC. A arquitetura é idêntica — 4 núcleos Zen 2, 8 CUs RDNA 2 —, mas o nó menor reduz o consumo em ~10% na mesma frequência, o que soma com a bateria maior para uma autonomia bem superior.

## A tela: a mudança mais visível

O painel OLED é a transformação mais impactante na percepção de uso. O LCD original sofria de três defeitos: pretos acinzentados (típico de IPS sem *local dimming*), cores lavadas (cobertura de apenas ~67% do espaço sRGB) e brilho limitado. O OLED resolve os três de uma vez.

- **Pretos verdadeiros.** Cada pixel emite a própria luz, então preto é pixel apagado — contraste efetivamente infinito. Em jogos com cenas noturnas (como *Control* ou *Resident Evil*), a diferença é dramática.
- **Gama DCI-P3 a 110%.** Cobre um espaço de cor muito maior que o sRGB do LCD, com cores vibrantes sem saturação artificial.
- **Brilho de 1000 nits em HDR.** O LCD atingia ~400 nits e não tinha HDR. O OLED suporta HDR10, e jogos com suporte (como *Ori and the Will of the Wisps*) ganham especularidades reais.
- **90 Hz.** O LCD é 60 Hz. Os 90 Hz do OLED tornam a rolagem e jogos leves mais fluidos, embora poucos jogos AAA atinjam 90 FPS no Deck.

O custo disso em consumo é pequeno: em cenas escuras o OLED consome *menos* que o LCD, porque apaga pixels. Em cenas claras consome ligeiramente mais. A bateria maior (50 Wh vs 40 Wh) mais que compensa.

## Bateria e autonomia: a crítica resolvida

A maior reclamação do Steam Deck LCD era a bateria. Em jogos AAA a 15 W, a autonomia ficava entre 1h30 e 2h. O OLED ataca o problema em quatro frentes combinadas:

1. **Bateria 25% maior** (50 Wh contra 40 Wh).
2. **APU em 6 nm**, que consome menos para o mesmo trabalho.
3. **Tela OLED** mais eficiente em cenas escuras.
4. **Memória mais rápida** (LPDDR5 6400 MT/s, contra 5500 no LCD), reduzindo gargalos que prolongavam o *frametime* e, indiretamente, o tempo sob carga.

O resultado prático medido pela Valve e confirmado por reviews independentes:

```terminal
$ cat /tmp/autonomia.txt
# Autonomia aproximada (Steam Deck OLED, brilho 200 nits)
Elden Ring (15W) ...... 2h45  (vs 1h50 no LCD)
Stardew Valley (5W) .. 8h+   (vs 6h no LCD)
Hades (9W) ........... 5h30  (vs 4h no LCD)
Vampire Survivors (7W) 7h07  (vs 5h15 no LCD)
```

Em títulos leves como *Stardew Valley*, o OLED passa de 8 horas — autonomia que o LCD nunca conseguiu. A diferença é menos dramática em jogos que puxam os 15 W constantes, mas ainda assim ronda 45–55 minutos extras.

## Conectividade e áudio

O salto de Wi-Fi 5 para Wi-Fi 6E é relevante para quem usa *streaming* local. O Steam Deck é frequentemente usado como cliente de *streaming* — via Steam Remote Play, Moonlight ou Sunshine — e o Wi-Fi 6E reduz a latência de forma mensurável.

```terminal
$ # Latência de ping no streaming local (Moonlight), rede doméstica
$ ping -c 5 192.168.1.50
# LCD (Wi-Fi 5): média 12 ms
# OLED (Wi-Fi 6E): média 4 ms
```

O Bluetooth 5.3 também melhora a latência de áudio com fones sem fio — importante num dispositivo que depende tanto de fones. Fora isso, a Valve reduziu o peso em 29 g e trocou a ventoinha, que ficou visivelmente mais silenciosa sob carga.

## LCD ou OLED: qual comprar?

Com o OLED no mercado, o LCD não desapareceu — ele virou o produto de entrada. A Valve descontinuou as versões LCD de 64 GB e 512 GB, mantendo apenas o de 256 GB como opção econômica.

```terminal
$ # Configurações oficiais (MSRP, EUA, 2025)
$ echo "Steam Deck LCD 256GB   - US$ 399"
$ echo "Steam Deck OLED 512GB  - US$ 549"
$ echo "Steam Deck OLED 1TB    - US$ 649"
Steam Deck LCD 256GB   - US$ 399
Steam Deck OLED 512GB  - US$ 549
Steam Deck OLED 1TB    - US$ 649
```

A recomendação é direta: **se o orçamento permitir, escolha o OLED.** As melhorias — tela, bateria, Wi-Fi — tocam justamente os pontos que limitavam a experiência diária, e o preço adicional de US$ 150 se paga em cada sessão longe da tomada. O LCD de 256 GB só vale para quem tem orçamento muito apertado ou planeja trocar a tela/SSD de qualquer forma.

:::nota
O LCD de 256 GB usa o mesmo SSD M.2 2230 dos modelos maiores, permitindo upgrade fácil para 1 TB ou 2 TB. A [seção 6](#/cap-107/sec-06) detalha opções de armazenamento em todos os handhelds.
:::

## Resumo

A revisão OLED de 2023 resolveu as três maiores críticas do Steam Deck original — tela fraca, bateria curta e conectividade defasada — mantendo a mesma APU para preservar compatibilidade. A nova tela traz pretos verdadeiros, 90 Hz e HDR; a bateria cresceu para 50 Wh e soma com a APU em 6 nm para autonomia 40–50% maior. O LCD sobrevive apenas como opção de entrada a US$ 399, mas o OLED justifica o adicional de preço para quase todos os perfis.

## Exercícios

1. Monte uma tabela comparando os oito componentes listados na tabela desta seção entre os dois modelos. Qual mudança você considera a mais impactante e por quê?
2. Explique por que o OLED pode consumir *menos* energia que o LCD em cenas escuras, mesmo tendo brilho máximo muito maior.
3. Calcule: se o LCD dura 1h50 em *Elden Ring* com bateria de 40 Wh, qual é o consumo médio em watts? Repita o cálculo para o OLED (2h45, 50 Wh). Os números fazem sentido com os 15 W de TDP?
4. Liste três situações concretas em que o Wi-Fi 6E do OLED faz diferença para um usuário de Steam Deck.
5. **Desafio.** A memória mais rápida do OLED (6400 vs 5500 MT/s) reduz o tempo de *frametime*. Pesquise o que é *frametime* e explique por que latência de memória o afeta — mesmo sem aumentar o FPS médio.