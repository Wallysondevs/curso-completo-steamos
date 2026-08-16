Quem abre o ProtonDB e depois compra um jogo na Steam tem na cabeça dois sistemas de avaliação diferentes, e a confusão entre eles é uma das fontes mais comuns de frustração em novatos. O selo Verified da Valve e a medalha do ProtonDB medem coisas parecidas mas com métodos, granularidade e propósitos distintos. Entender a diferença evita tanto falsas expectativas quanto alarmes injustificados.

:::objetivos
- Diferenciar o selo Verified da Valve da medalha do ProtonDB
- Saber o que cada nível do selo Valve significa na prática
- Cruzar os dois sistemas para tomar decisões mais informadas
- Entender por que um jogo Verified pode estar `Silver` no ProtonDB
- Identificar quando o desacordo entre os dois sistemas revela algo útil

:::

## O que cada sistema avalia

O programa Deck Verified da Valve é um conjunto de testes manuais executados por funcionários da empresa. Eles rodam um checklist: o jogo abre? Tem suporte nativo ao controle do deck? Os ícones e a fonte ficam legíveis a 800p? O teclado virtual aparece quando precisa? Se tudo passa, o selo é verde com um visto — "Verified". Se passa parcialmente, "Playable" (amarelo). Se falha em algo crítico, "Unsupported". Se ainda não foi testado, "Unknown".

O ProtonDB, como você já sabe, é a agregação de reports enviados por qualquer pessoa que rodou o jogo no Linux. Não tem checklist formal — a medalha é derivada da proporção de relatos bons e ruins.

A diferença fundamental: a Valve testa uma vez, com critérios editoriais definidos por ela, e o resultado é estático até que o jogo seja reavaliado. O ProtonDB testa continuamente, com milhares de olhos diferentes, e as medalhas flutuam conforme o Proton e os jogos evoluem.

Um jeito rápido de comparar os dois sistemas para um jogo é puxar o resumo do ProtonDB e olhar lado a lado com o selo da Steam:

```terminal
$ APPD=1145360
$ curl -s "https://www.protondb.com/api/v1/reports/summaries/${APPD}.json" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'ProtonDB: tier={d[\"tier\"]}, confidence={d[\"confidence\"]}, reports={d[\"n\"]}')
"
ProtonDB: tier=platinum, confidence=high, reports=145
## Agora abra a Steam Store com: xdg-open https://store.steampowered.com/app/1145360
```

Na página da Steam você verá o selo (Verified, Playable, Unsupported ou Unknown) logo abaixo do banner. O ProtonDB mostra `platinum` com 145 reports e `high` — os dois concordam que o jogo é impecável. Mas nem sempre é assim.

| Aspecto | Deck Verified (Valve) | ProtonDB (comunidade) |
|---|---|---|
| Quem testa | Funcionários da Valve | Comunidade |
| Granularidade | 4 níveis (Verified, Playable, Unsupported, Unknown) | 5 medalhas (Platinum a Borked) + score |
| Frequência | Uma vez, revisão esporádica | Contínua, reports diários |
| Foco | Experiência de console (controle, tela, teclado) | Compatibilidade técnica (roda ou não) |
| Cobertura | Fração do catálogo | Quase todos os jogos com reports |
| Tweaks | Não documentados | Documentados nos reports |

:::info
O selo Verified não é certificação técnica de compatibilidade com o Proton — é uma curadoria de experiência de deck. Um jogo pode passar no checklist da Valve e ainda ter crash depois de certa fase, ou vice-versa: ser tecnicamente impecável mas ter fonte minúscula e por isso cair para "Playable".
:::

## Por que Verified e Platinum podem discordar

O cenário que mais confunde: o jogo exibe o selo verde "Verified" na Steam, mas no ProtonDB a medalha é `Silver` ou `Bronze`. Isso não é contradição; é diferença de perspectiva.

O checklist da Valve testa uma sessão inicial e verifica itens de interface. Se o jogo passa nisso, ganha o Verified. Mas a comunidade pode ter descoberto que ele crasha na décima hora, que o multiplayer não conecta, que a DLC não carrega — e todos esses reports puxam a medalha para baixo. A Valve não reavalia a cada patch do jogo, então o selo pode ficar "congelado" enquanto a realidade muda.

O inverso também ocorre: jogos "Unsupported" que a comunidade transformou em `Gold` ou `Platinum` com tweaks (troca de Proton, flags, protontricks). O selo Valve diz "não recomendamos"; o ProtonDB diz "tem receita". Nesse caso, o ProtonDB é a única referência útil, porque o selo da Valve não captura o esforço da comunidade.

Para quantificar a divergência, compare `tier` e `bestReportedTier` — quando o segundo é muito mais alto, há receita que o selo Valve não conhece:

```terminal
$ curl -s "https://www.protondb.com/api/v1/reports/summaries/292030.json" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'tier:              {d[\"tier\"]}')
print(f'bestReportedTier:  {d[\"bestReportedTier\"]}')
print(f'confidence:        {d[\"confidence\"]}')
print(f'reports:           {d[\"n\"]}')
"
tier:              gold
bestReportedTier:  platinum
confidence:        medium
reports:           67
```

Mesmo com `tier` em `gold`, alguém atingiu `platinum` — o `bestReportedTier` denuncia que existe um caminho para a experiência perfeita. Esse é o tipo de jogo em que o selo Valve pode estar desatualizado ou nem existir, mas a comunidade já mapeou a rota.

## Cruzando as duas fontes

O fluxo recomendado quando você está na página de um jogo na Steam e quer decidir se compra:

1. Olhe o selo Deck Verified — ele garante o básico de interface: controle funciona, fonte legível. Se for "Unsupported" ou "Unknown", não descarte ainda; vá para o passo 2.
2. Abra o ProtonDB pelo AppID (copie da URL da loja) e veja a medalha *filtrada por Steam Deck*. Se for `Platinum` ou `Gold`, provavelmente vale.
3. Se a medalha for `Silver` ou `Bronze`, leia os reports filtrados. Pode ser um problema que você acha aceitável (fonte pequena num RPG que você joga dockado) ou algo contornável com tweaks.
4. Se for `Borked`, é o caso raro em que o selo e a comunidade concordam que não tem saída — ao menos por enquanto.

:::dica
Quando um jogo é "Playable" (amarelo) na Steam e `Gold` ou `Silver` no ProtonDB, leia *por que* ele é "Playable": às vezes é só "fonte pequena" ou "precisa chamar o teclado virtual manualmente", coisas que não afetam sua experiência dependendo de como você joga. Nesses casos, o selo Valve está certíssimo e o ProtonDB pode estar avaliando a parte técnica e ignorando a experiência de deck.
:::

## O caso dos jogos sem selo e sem reports

Existe um terceiro estado: o jogo não foi testado pela Valve (selo "Unknown") e também tem poucos ou nenhum report no ProtonDB. Aqui a decisão é risco calculado. Você pode olhar o motor gráfico do jogo (Unreal Engine, Unity, Godot — todos costumam rodar bem no Proton) e reports de outros títulos do mesmo estúdio. Se o motor é conhecido por boa compatibilidade e o estúdio tem histórico de jogos `Platinum`, a chance é alta. Mas não há garantia — e o primeiro report do ProtonDB para esse jogo pode ser o seu.

Para confirmar se um jogo "Unknown" tem zero reports ou poucos, a API responde com `n=0` ou um número pequeno — sinal claro de território não mapeado:

```terminal
$ curl -s "https://www.protondb.com/api/v1/reports/summaries/999999.json" | python3 -m json.tool
{
    "confidence": "unknown",
    "n": 0,
    "tier": "pending",
    "trendingTier": "pending",
    "bestReportedTier": "pending",
    "score": 0,
    "rollingScore": 0,
    "stats": {
        "numReports": 0,
        "numVisibleReports": 0,
        "tierPercentages": {}
    }
}
```

`tier: pending` significa que ninguém enviou report ainda. É um convite para ser o primeiro — e a seção 6 ensinou exatamente como fazer isso.

## Resumo

- Deck Verified é curadoria da Valve (experiência de console); ProtonDB é agregação comunitária (compatibilidade técnica).
- O selo Valve tem 4 níveis estáticos; o ProtonDB tem 5 medalhas + score que flutuam.
- Verified ≠ Platinum: a Valve testa interface e sessão inicial; a comunidade testa o jogo inteiro e descobre problemas mais profundos.
- Jogos "Unsupported" podem ter receita `Platinum` na comunidade com tweaks e Proton alternativo.
- O fluxo ideal cruza os dois: selo para interface, ProtonDB para realidade técnica.
- Jogos sem selo e sem reports são aposta: avalie pelo motor gráfico e pelo histórico do estúdio.

## Exercícios

1. Escolha três jogos da sua biblioteca e anote lado a lado o selo Deck Verified e a medalha do ProtonDB. Onde divergem?
2. Encontre um jogo "Unsupported" que o ProtonDB marque como `Gold` ou superior e leia os reports para descobrir o que fez a comunidade reverter o veredito da Valve.
3. Localize um jogo "Verified" com medalha `Silver` ou inferior no ProtonDB e explique, com base nos reports, qual é o ponto de divergência.
4. Pesquise um jogo "Unknown" na Steam que tenha pelo menos três reports no ProtonDB e tente decidir se compraria com base apenas no que leu.
5. **Desafio.** Monte uma mini-tabela com cinco jogos: motor gráfico, selo Valve, medalha ProtonDB e seu veredito pessoal (compraria ou não). Explique se o motor gráfico foi um bom preditor nos casos avaliados.