Um jogo de 100 GB baixado num Wi-Fi de hotel é problema suficiente. Agora imagine baixar 1,2 GB de sistema a cada atualização, mesmo quando a mudança real foi de 50 MB. É para isso que existem os *delta updates*: em vez de baixar a imagem inteira, você baixa só a diferença entre o que já tem e o que vai receber. Um detalhe técnico que economiza tempo e — num plano de dados limitado — dinheiro.

:::objetivos
- Entender o que é um delta update e por que ele reduz o download
- Compreender como o SteamOS calcula a diferença entre versões
- Medir quanto de fato foi economizado numa atualização
- Relacionar delta updates com o esquema de partições A/B
:::

## O problema de baixar a imagem inteira

Se a atualização do SteamOS baixasse sempre a imagem completa do sistema, toda correção de um bugzinho custaria mais de 1 GB de download. Isso é caro em três frentes: tempo de espera, consumo de dados (importante em conexões móveis ou limitadas) e carga nos servidores da Valve.

A solução clássica da indústria é o **delta**. Em vez de mandar o arquivo novo inteiro, o servidor manda apenas a **diferença** entre o arquivo que você já tem (a imagem atual) e o arquivo que você quer (a imagem nova). Se a versão 3.6.21 difere da 3.6.20 em apenas alguns arquivos do driver gráfico e uma correção no kernel, o delta entre elas é pequeno — talvez 40, 80 ou 200 MB — em vez de 1,2 GB.

O princípio está por trás de muita coisa que você já usa: patches de jogos (em vez de baixar o jogo de novo), o protocolo `rsync` (que transfere só pedaços que mudaram), e sistemas de controle de versão como o Git. Delta update é o mesmo conceito aplicado a imagens de sistema operacional.

## Como o delta é calculado

Existem duas formas de calcular a diferença entre versões, e vale distingui-las:

- **Delta por blocos**: a imagem é dividida em blocos de tamanho fixo (por exemplo, 4 KB). O servidor compara o hash de cada bloco da versão nova com os blocos da versão anterior e envia apenas os blocos que mudaram (ou cujos hashes não batem). É robusto e independente do formato interno da imagem.

- **Delta binário** (`bsdiff` e afins): compara os arquivos byte a byte e produz um *patch* que, aplicado sobre o arquivo antigo, gera o novo. Produz deltas menores que o por blocos, mas depende de o arquivo de origem ser exatamente o esperado.

O SteamOS, por ser baseado em imagens assinadas e estruturadas, se beneficia de uma combinação: a imagem é segmentada, cada segmento recebe um hash, e o processo de atualização baixa só os segmentos cujo hash difere. Se a imagem nova reusa 95% dos segmentos da antiga, o download cai para ~5% do tamanho total.

Na prática, isso significa que uma atualização incremental (3.6.20 → 3.6.21) baixa muito menos que uma atualização "limpa" de canal (trocar Stable → Preview, por exemplo, que pode baixar quase a imagem inteira porque as imagens divergem bastante).

## Vendo a economia na prática

A saída do `steamos-update` e o journal revelam o tamanho baixado, o que permite comparar com o tamanho total da imagem:

```terminal
$ journalctl -u steamos-update | grep -iE 'download|delta|segment'
Nov 12 21:03:01 steamdeck steamos-update[1510]: Computing delta against build 20241105.100...
Nov 12 21:03:04 steamdeck steamos-update[1510]: 148 segments of 3410 need download (4.3%)
Nov 12 21:03:04 steamdeck steamos-update[1510]: Downloading 148 segments (182 MB)...
Nov 12 21:05:11 steamdeck steamos-update[1510]: Download complete (182 MB)
```

Leia com calma: a linha `Computing delta against build ...` mostra que o sistema comparou a imagem nova com o `build_id` que você já tem (`20241105.100`). A linha seguinte informa que só `148` de `3410` segmentos precisam ser baixados — `4.3%` do total. O download final foi de `182 MB`, contra os ~1,2 GB da imagem inteira.

Essa economia se reflete diretamente no tempo: 182 MB num Wi-Fi de 50 Mbps leva segundos; 1,2 GB levaria minutos. E no jornal do sistema você sempre pode reconstruir quanto foi economizado:

```terminal
$ journalctl -u steamos-update --since "2 days ago" | grep -iE 'complete|segments|delta'
...
```

:::dica
Se você tem plano de dados limitado (roteador de celular, conexão de hotel, internet móvel), é mais econômico **deixar a atualização automática ativa** e baixar deltas incrementais frequentes do que ficar semanas sem atualizar e acumular uma diferença enorme — que pode virar um download próximo da imagem inteira.
:::

## Delta e a partição inativa

O delta se encaixa perfeitamente no esquema A/B. A partição inativa já contém a versão **anterior** do sistema. Para aplicar o delta, o processo pode usar essa partição como ponto de partida: ele lê os segmentos que continuam iguais da partição inativa (ou da imagem atual) e grava sobre ela apenas os segmentos novos baixados.

É por isso que a atualização não precisa apagar nada de antemão: a partição inativa já tem, em sua maioria, os bytes certos, e o processo só corrige o que mudou. Depois de montada e verificada, a partição inativa passa a conter exatamente a imagem nova.

Há uma implicação sutil que conecta tudo: se a partição inativa estiver corrompida ou contiver uma versão muito antiga, o delta não bate (os hashes dos segmentos não correspondem aos esperados). Nesse caso, o `steamos-update` recua para um download maior, reconstruindo o que for necessário. Ou seja, o delta é uma **otimização**, não uma obrigação: o sistema sempre consegue completar a atualização, pagando em download se o delta não puder ser aproveitado.

O log de uma dessas atualizações mais pesadas denuncia o que aconteceu:

```terminal
$ journalctl -u steamos-update | grep -iE 'delta|fallback|full'
Nov 18 14:02:11 steamdeck steamos-update[1610]: Computing delta against build 20241020.95...
Nov 18 14:02:11 steamdeck steamos-update[1610]: Delta mismatch: 2187 of 3410 segments differ.
Nov 18 14:02:11 steamdeck steamos-update[1610]: Falling back to full download (1,2 GB)...
Nov 18 14:09:44 steamdeck steamos-update[1610]: Full download complete.
```

`Delta mismatch` seguido de `Falling back to full download`: o sistema tentou o delta, viu que a maioria dos segmentos não batia (64% de divergência) e recuou para o download da imagem inteira. Isso é esperado quando o build de origem está muito distante — seja por tempo, seja por troca de canal — e não indica erro. É o mecanismo de degradação graciosa em ação.

## Resumo

- Delta update baixa apenas a diferença entre a imagem atual e a nova, economizando tempo e dados.
- O SteamOS compara segmentos por hash e baixa só os que mudaram (ex.: 148 de 3410, ~4,3%).
- Deltas são uma otimização: se a partição de origem não bate, o sistema recua para um download maior.
- A partição inativa serve de base para o delta, já que contém a versão anterior.
- Atualizações incrementais frequentes geram deltas menores; grandes saltos de versão aproximam o download da imagem inteira.

## Exercícios

1. Inspecione a última atualização com `journalctl -u steamos-update | grep -iE 'delta|segment|download'` e anote quantos segmentos e quantos MB foram baixados.
2. Calcule a porcentagem de economia da sua última atualização: (segmentos baixados / total de segmentos) × 100. Quanto o delta evitou de download?
3. Compare dois `BUILD_ID` consecutivos (use `journalctl` para achar o anterior e o atual). A diferença entre eles foi grande (muitos segmentos) ou pequena?
4. Pesquise a opção de atualização automática nas configurações do modo Gaming. Ela está ligada ou desligada na sua máquina? Relacione isso com a dica sobre planos de dados.
5. **Desafio.** Combine delta updates com o esquema A/B da seção 3: se a partição inativa contém o build anterior, explique por que uma atualização de Stable 3.6.20 → 3.6.21 baixa menos dados do que uma troca de canal Stable → Preview. O que muda nos hashes dos segmentos entre esses dois cenários?