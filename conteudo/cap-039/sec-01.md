A página de um jogo na Steam não te diz se ele roda no seu Steam Deck. O selo "Verified" da Valve ajuda, mas é uma avaliação binária e genérica; o que separa um jogo que abre do jogo que você realmente joga por 40 horas são os detalhes — um vídeo que não renderiza, um launcher que não fecha, uma fonte que fica ilegível a 800p. É exatamente esse detalhe que o ProtonDB documenta de forma colaborativa, e é a primeira coisa que qualquer dono de deck consulta antes de comprar um jogo.

:::objetivos
- Entender o que é o ProtonDB e de onde saem os dados dele
- Distinguir ProtonDB (comunidade) do selo Verified da Valve
- Localizar a página de um jogo pelo nome ou pelo AppID da Steam
- Interpretar a barra de progresso e a distribuição de medals de um título
- Consultar a API pública com `curl` para obter dados programaticamente
:::

## O que o ProtonDB resolve

O ProtonDB nasceu de uma limitação estrutural do Steam Play. O Proton permite rodar jogos Windows no Linux, mas a compatibilidade não é previsível pela ficha técnica: dois jogos do mesmo motor gráfico podem ter resultados opostos, e um jogo que "roda" no desktop Linux pode ser injogável na tela de 7 polegadas do deck. A Valve mantém um programa oficial de testes (o Deck Verified), mas ele cobre uma fração do catálogo e emite apenas três estados verificáveis. A comunidade precisava de um mapa mais granular — e foi isso que o ProtonDB se tornou.

Na prática, o site agrega **reports**: cada pessoa que roda um jogo pela Steam no Linux (com Proton) pode enviar um relato dizendo se funcionou, qual hardware usou, quais ajustes precisou e que nota dá. O sistema junta esses reports por jogo e produz uma **medalha** consolidada, de `Platinum` a `Borked`, além de um placar com a proporção de relatos bons e ruins. Como cada report carrega a configuração de quem enviou, dá para filtrar e ver especificamente o que os donos de Steam Deck estão dizendo.

:::nota
O ProtonDB usa o **mesmo texto que aparece na Steam** para o botão "Play" — quando você marca um jogo como testado, ele decide a medalha a partir de uma escala pré-definida. Isso não é adivinhação: a classificação segue um critério editorial claro, descrito na própria página de cada jogo.
:::

## Como chegar até um jogo

A forma mais direta é digitar o nome na busca do site. Mas o ProtonDB tem um atalho que todo mundo que consulta muito decora: a URL aceita o **AppID** da Steam, o mesmo número que aparece na URL da loja. O jogo usado como exemplo aqui, o *Hades* da Supergiant Games, tem AppID `1145360` — então `https://www.protondb.com/app/1145360` leva direto à página dele.

```terminal
$ xdg-open https://www.protondb.com/app/1145360
```

Ao abrir a página, o topo mostra a medalha consolidada e uma barra com a distribuição dos reports, seguida da lista de relatos individuais. Cada relato exibe a versão do Proton usada, o sistema operacional, a GPU, a data e — se for o caso — os passos que a pessoa executou para fazer o jogo rodar.

## A API pública

Tudo o que o site mostra em HTML também está disponível como JSON numa API simples e sem autenticação. Ela é útil para consultas rápidas via terminal e para automatizar checagens antes de instalar uma leva de jogos. O endpoint de resumo tem o formato:

```text
https://www.protondb.com/api/v1/reports/summaries/<appid>.json
```

O comando a seguir busca o resumo do *Hades*:

```terminal
$ curl -s "https://www.protondb.com/api/v1/reports/summaries/1145360.json"
```

A saída é um JSON compacto, mas se você quiser lê-la com indentação, é só encadear com `python3 -m json.tool`:

```terminal
$ curl -s "https://www.protondb.com/api/v1/reports/summaries/1145360.json" | python3 -m json.tool
{
    "confidence": "high",
    "n": 145,
    "tier": "platinum",
    "trendingTier": "platinum",
    "bestReportedTier": "platinum",
    "score": 75.1,
    "rollingScore": 75.1,
    "stats": {
        "numReports": 145,
        "numVisibleReports": 28,
        "tierPercentages": {
            "platinum": 94.0,
            "gold": 3.0
        }
    }
}
```

Cada campo conta uma história. `tier` é a medalha consolidada; `score` é uma nota de 0 a 100 ponderando reports recentes; `bestReportedTier` é a melhor medalha alcançada por algum report. O objeto `stats.tierPercentages` mostra que 94% dos relatos deram Platinum e 3% deram Gold — os 3% restantes são níveis inferiores que não chegaram a ser listados no recorte. O campo `confidence` (`high`, `medium` ou `low`) reflete quantos reports sustentam aquela medalha.

:::dica
Guarde o AppID numa variável para consultar vários jogos em sequência sem decorar números:

```terminal
$ APPID=1145360
$ curl -s "https://www.protondb.com/api/v1/reports/summaries/${APPID}.json" | python3 -m json.tool | grep -E '"tier"|"score"'
```

O ProtonDB pede que você use termos de serviço dela e a API com moderação — não dispare centenas de requisições por minuto.
:::

## Onde isso entra no seu fluxo do deck

Consultar o ProtonDB antes da compra é só a metade. A outra metade acontece depois, dentro do próprio deck, quando um jogo Verified dá problema ou quando você quer saber se vale tentar rodar um título sem selo nenhum. O ProtonDB vira referência de cabeceira: a medalha diz *se* provavelmente funciona, e os reports dizem *como* fazer funcionar, com as flags de lançamento e os tweaks que a comunidade descobriu. As próximas seções detalham cada uma dessas peças.

## Resumo

- ProtonDB é um site comunitário que agrega reports de compatibilidade de jogos Windows rodando via Proton.
- A medalha consolidada vai de Platinum (roda perfeitamente) a Borked (não roda), com base em reports individuais.
- O selo Verified da Valve é uma avaliação oficial e separada dos reports da comunidade.
- Cada jogo é endereçado pelo AppID da Steam, usado direto na URL `protondb.com/app/<appid>`.
- A API pública responde em JSON: `<appid>.json` devolve `tier`, `score`, `confidence` e percentuais por medalha.
- O valor real do ProtonDB está nos reports: eles explicam os tweaks que fizeram o jogo rodar.

## Exercícios

1. Abra `https://www.protondb.com/app/1145360` e localize, no topo da página, a medalha consolidada e o percentual de reports Platinum.
2. Consulte a API do mesmo jogo com `curl` e confirme, no JSON, quais campos correspondem à medalha (`tier`) e à confiança (`confidence`).
3. Escolha um jogo seu da biblioteca, encontre o AppID dele na URL da loja Steam e busque a página correspondente no ProtonDB.
4. Pegue três jogos diferentes e capture o `tier` de cada um via API num único loop de shell, comparando os resultados na tela.
5. **Desafio.** Escreva um pequeno script que recebe uma lista de AppIDs, consulta o resumo de cada um e imprime apenas `AppID | medalha | score`, pulando silenciosamente os que retornarem erro. Compare com o que o site mostra e explique por que a medalha pode diferir do `score`.
