A garantia do Steam Deck não é uma só para o mundo inteiro: ela varia por região, por legislação local e até por onde você comprou o aparelho. Um brasileiro que importou dos EUA está em situação diferente de um alemão que comprou direto na loja europeia. Entender a jurisdição que cobre seu aparelho evita frustração e, em alguns casos, revela direitos que você nem sabia ter.

:::objetivos
- Entender as diferenças de garantia entre as principais regiões de venda
- Saber o que a lei local acrescenta à garantia contratual da Valve
- Identificar a situação do aparelho importado ou comprado de terceiros
- Conhecer os prazos mínimos legais do Brasil, UE e demais mercados
:::

## As regiões de venda e suas regras

A Valve vende Steam Deck oficialmente em três grandes regiões: América do Norte (EUA e Canadá), União Europeia e Reino Unido, e alguns países da Ásia-Pacífico (Japão, Coreia do Sul, Taiwan, Hong Kong). Cada região tem prazos e coberturas próprias, que partem do mínimo legal local e são acrescidas pela política contratual da Valve.

```terminal
$ cat /etc/timezone
America/Sao_Paulo
```

Seu fuso horário não deveria importar para garantia, mas na prática importa: o país onde você está fisicamente define a lei aplicável, e o país onde o aparelho foi comprado define a garantia contratual. São duas camadas diferentes.

## O CDC e o caso brasileiro

No Brasil, o Código de Defesa do Consumidor (CDC) estabelece que produtos duráveis têm garantia legal de 90 dias, que se soma à garantia contratual oferecida pelo fabricante. Além disso, se a Valve vendeu o aparelho para você diretamente (via loja oficial que entrega no Brasil), aplicam-se também os arts. 18 e 26 do CDC, que cobrem vícios ocultos e estendem prazos a partir do momento em que o defeito se manifesta.

```terminal
$ ls /sys/class/dmi/id/product_serial
FWXXXXX1234
```

Ter o serial registrado na nota fiscal brasileira (ou na declaração de importação), com data, é o que vincula seu aparelho à lei local. Sem nota, você depende da boa vontade da política contratual da Valve para o país de origem do produto.

:::info
A Valve não tem loja oficial no Brasil, mas vende por meio de distribuidores parceiros e pelo site com entrega internacional. O suporte tende a honrar a política da região onde o aparelho foi comprado; guarde o comprovante original, mesmo que digital.
:::

## A diretiva europeia e o Reino Unido

Na União Europeia, a Diretiva 2019/771 estabelece uma garantia legal mínima de dois anos para bens de consumo, e o vendedor (não o fabricante) é o responsável primário. No Reino Unido, regime pós-Brexit similar vale por até seis anos em alguns casos, embora o ônus da prova se inverta após seis meses. Isso significa que um Steam Deck comprado na loja europeia tem no mínimo dois anos de cobertura legal, além do que a Valve oferece contratualmente.

```terminal
$ cat /sys/class/dmi/id/product_name
Jupiter
```

A região de venda está implícita em vários metadados do aparelho e é confirmada pelo serial. A Valve sabe, pelo código do serial, qual SKU regional foi vendida — por isso é inútil tentar acionar garantia europeia para um aparelho comprado nos EUA.

:::nota
Aparelhos comprados por terceiros (revendedor não autorizado, usado de particular) geralmente perdem a garantia contratual da Valve, mas podem manter a garantia legal em países onde ela é vinculada ao produto (e não ao comprador original). É uma área cinza que depende de jurisprudência local.
:::

## Mercados sem venda oficial

Em países onde a Valve não vende oficialmente — e o Brasil se encaixa aqui —, o cenário comum é o aparelho importado por terceiros ou trazido de viagem. Nesse caso, a garantia contratual da Valve para a região de origem (EUA ou Europa) pode ser acionada, mas o frete e o trâmite de envio internacional correm por conta do comprador.

```terminal
$ curl -s -o /dev/null -w "%{http_code}\n" https://help.steampowered.com/pt-br/steamdeck/
200
```

A central de suporte existe em português e atende brasileiros, ainda que a venda oficial não opere aqui. Isso significa que você pode abrir um ticket e obter orientação, mesmo que o envio para RMA precise cruzar fronteiras — esteja preparado para prazos e custos de frete maiores.

## Erros comuns sobre garantia regional

O mal-entendido mais comum é achar que a garantia contratual da Valve se aplica no mundo todo, como se fosse "global". Não é: a política dos EUA cobre 12 meses, e acioná-la da América do Sul exige enviar o aparelho para os EUA. Outro erro é presumir que o prazo legal europeu de dois anos vale para aparelhos comprados nos EUA — não vale.

```terminal
$ curl -s https://help.steampowered.com/pt-br/ | grep -i "termos"
```

A página de termos e condições de hardware muda conforme a região e a data. Acessá-la diretamente na data em que você precisa acionar a garantia é a única forma segura de saber o que está valendo agora, não o que valia quando alguém escreveu um tutorial.

| Região | Prazo contratual típico | Legislação local adicional |
|---|---|---|
| EUA / Canadá | 12 meses | Varia por estado |
| União Europeia | 12 meses (contratual) | +2 anos garantia legal (diretiva) |
| Reino Unido | 12 meses | Até 6 anos em certos casos |
| Ásia-Pacífico | 12 meses | Varia por país |
| Importação (sem venda oficial) | Política do país de origem | Lei do país do comprador pode não se aplicar |

## Resumo

- A garantia varia por região de venda: a lei local se sobrepõe à política contratual da Valve.
- No Brasil, o CDC estabelece 90 dias de garantia legal somados à contratual e cobre vícios ocultos.
- Na UE, a garantia legal mínima é de dois anos; no Reino Unido, regime similar pós-Brexit.
- Aparelhos importados ou comprados de terceiros podem ter frete e trâmite internacionais por sua conta.
- Sem nota fiscal ou comprovante, você fica restrito à política contratual do país de origem.

## Exercícios

1. Consulte a legislação de defesa do consumidor do seu país e anote, em uma frase, o prazo de garantia legal para produtos duráveis.
2. Descreva a diferença entre "garantia legal" e "garantia contratual" para um Steam Deck comprado na UE.
3. Rode `cat /etc/timezone` e relacione o resultado com a jurisdição que provavelmente cobre seu aparelho.
4. Explique por que um aparelho comprado de um revendedor não autorizado pode perder a garantia contratual da Valve.
5. **Desafio.** Pesquise os arts. 18 e 26 do CDC brasileiro e redija um parágrafo explicando como eles se aplicariam a um defeito de tela que aparece 100 dias após a compra de um Steam Deck importado.