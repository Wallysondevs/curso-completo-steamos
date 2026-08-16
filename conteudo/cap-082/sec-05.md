A ergonomia do Steam Deck é boa, mas não é perfeita para todo mundo: as mãos de ana podem achar os analógicos muito altos, os cantos do gabinete podem marcar depois de meses de uso, e uma queda da mesa para o chão pode transformar um Deck funcional em peso de papel. Cases, grips e capas protetoras atacam exatamente esses três problemas, e a escolha certa depende de como você usa o aparelho no dia a dia.

:::objetivos
- Diferenciar skins, cases rígidas, grips de silicone e capas híbridas
- Entender como um case afeta a dissipação de calor e a temperatura
- Identificar os tipos de proteção que cada acessório realmente oferece
- Inspecionar temperaturas do sistema antes e depois de instalar um case
- Escolher proteção física baseada no seu padrão de uso real
:::

## Tipos de proteção e o que cada uma resolve

O mercado oferece camadas de proteção que vão da fina à blindada. A tabela resume o que cada tipo entrega:

| Tipo | Protege contra | Afeta ergonomia? | Afeta calor? |
|---|---|---|---|
| Skin (adesivo) | Arranhões cosméticos | Não | Não |
| Case de silicone | Arranhões e pequenas quedas | Sim — mais aderência | Levemente |
| Grip rígido | Impactos laterais e ergonomia | Sim — muda o encaixe | Pouco |
| Capa híbrida (TPU + PC) | Quedas médias | Sim | Moderadamente |
| Estojo de transporte | Quedas em mochila/maleta | Não (só fora de uso) | Não |

A decisão começa por uma pergunta honesta: você já derrubou o Deck? Se a resposta for sim, ou se você joga em pé no metrô, uma capa híbrida se paga na primeira queda evitada. Se o Deck nunca sai da mesa de cabeceira num grip com suporte, o silicone fino já resolve.

```terminal
$ sensors | grep -E 'edge|Tdie|Composite' | head -4
nvme-pci-0300
Composite:    +43.9°C
iwlwifi_1-virtual-0
temp1:        +37.0°C
```

O `sensors` mostra temperaturas de componentes internos em repouso. O `Composite` do NVMe a ~44 °C é normal. Por que isso importa? Um case de silicone grosso ou uma capa totalmente fechada reduzem a dissipação, e essas temperaturas sobem.

## Medindo o impacto térmico de um case

A traseira do Deck — onde fica a entrada de ar do cooler — não pode ser obstruída. Cases bem projetados têm recortes precisos nessa região e em torno das grades. Os mal projetados são um cobertor térmico.

```terminal
$ sensors
amdgpu-pci-0400
Adapter: PCI adapter
vddgfx:      760.00 mV
fan1:        3154 RPM
edge:         +67.0°C
```

Com o Deck sob carga (um jogo rodando), a APU marca `edge: +67.0°C` e o cooler gira a 3154 RPM. Instale um case e refaça a medição:

```terminal
$ sensors
amdgpu-pci-0400
Adapter: PCI adapter
vddgfx:      775.00 mV
fan1:        3982 RPM
edge:         +73.8°C
```

Com o case, a temperatura subiu quase 7 °C e a ventoinha acelerou 25%. Não é um desastre — a APU desliga só perto de 100 °C —, mas o sistema está trabalhando mais quente e mais barulhento. O case que causou isso tinha saída de ar parcialmente bloqueada.

:::atencao
Antes de confiar num case, faça o teste térmico: rode `sensors` sob carga sem o case por 5 minutos, anote a temperatura estabilizada, repita com o case instalado. Se a diferença passar de 5 °C, o case está prendendo calor. Devolva ou troque por um modelo com recortes maiores.
:::

## A ergonomia do grip

O Deck pesa entre 640 g e 669 g. Não parece muito, mas em sessões de 2 horas com os cotovelos no ar, o cansaço bate. Um grip de silicone — como os da marca dbrand e afins — resolve três coisas: engrossa a pegada para mãos grandes, adiciona textura antiderrapante e cria um ressalto na palma que redistribui o peso.

Grips rígidos com alça (estilo controle de console) vão além: você prende o Deck num suporte e segura só o controle leve. Mas aí o acessório vira quase um periférico separado, e o peso do Deck some da equação.

```terminal
$ cat /sys/devices/virtual/thermal/thermal_zone0/temp
49590
```

A zona térmica 0 da carcaça, em miligraus Celsius, mostra 49,6 °C na superfície. Com um grip de silicone de 2 mm, a temperatura da superfície externa cai sensivelmente ao toque porque o silicone isola. Isso é conforto, mas o calor que não sai pela carcaça precisa sair pelo cooler — mais um motivo para o teste térmico da seção anterior.

:::dica
Se o Deck esquenta suas mãos a ponto de incomodar, experimente um grip de silicone com textura perfurada — os sulcos criam um colchão de ar entre a mão e o gabinete, reduzindo a sensação térmica sem bloquear a ventilação forçada.
:::

## Estojo de transporte: o seguro contra a mochila

O estojo que vem na caixa do Deck (modelo LCD e alguns OLED) é decente: protege os analógicos, o D-pad e a tela contra pressão. Mas ele é volumoso e não cabe em mochilas pequenas. Alternativas slim de terceiros (Tomtoc, JSAUX) trocam um pouco de amortecimento por um perfil mais fino.

A decisão entre estojo rígido e slim depende de quanto o Deck viaja na mochila com outros objetos duros — uma garrafa de água, um carregador, um notebook. Se o Deck divide espaço com objetos pontiagudos, o rígido é seguro.

:::exemplo
Ana usa o Deck no ônibus todo dia. Ela colocou um grip de silicone para o trajeto, uma película temperada na tela, e transporta o aparelho num estojo slim dentro da mochila. Em 12 meses, zero arranhões e zero sustos. O custo total dos três acessórios ficou abaixo de 10% do preço do Deck — um seguro barato.
:::

## Resumo

- Skins protegem cosmética, casos de silicone protegem de arranhões e pequenas quedas, capas híbridas seguram impacto médio, e estojos protegem durante transporte.
- Cases e grips podem reduzir dissipação; o teste é rodar `sensors` antes e depois sob carga.
- Grips melhoram ergonomia ao redistribuir o peso e engrossar a pegada; silicone isola termicamente a superfície.
- O estojo original é bom; estojos slim sacrificam amortecimento por portabilidade.
- Um conjunto de grip + película + estojo custa menos que 10% do Deck e cobre a imensa maioria dos acidentes.

## Exercícios

1. Liste o que protege atualmente seu Deck (película, case, estojo) e classifique cada um na tabela de tipos desta seção.
2. Rode `sensors` sob carga por 5 minutos sem case e com case, e anote a temperatura da APU (`edge`) e a rotação do cooler (`fan1`). A diferença passou de 5 °C?
3. Inspecione a traseira do seu case ou grip. O recorte coincide com a entrada de ar do Deck? Tire uma foto e compare com a posição da ventoinha (visível pelo topo).
4. Segure o Deck por 10 minutos sem grip, depois mais 10 minutos com grip (se tiver). Anote quais dedos cansam primeiro em cada configuração.
5. **Desafio.** Usando `sensors` e `watch -n 2 sensors`, monitore as temperaturas (`edge` e `Composite`) durante 10 minutos de jogo com o case colocado e depois mais 10 minutos com o Deck "pelado". Calcule a média de cada período e explique, com base na física de dissipação, por que a diferença existe (ou por que ela é tão pequena).