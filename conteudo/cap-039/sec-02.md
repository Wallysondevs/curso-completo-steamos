A medalha que o ProtonDB estampa no topo de cada jogo não é uma nota aleatória — é uma escala de compatibilidade com critérios bem definidos, e decorar o que cada nível significa muda completamente a forma como você lê o site. Um jogo "Gold" pode ser melhor compra do que um "Platinum" para o seu caso específico, e um "Silver" às vezes vira "Platinum" com um único parâmetro de lançamento que só aparece nos reports.

:::objetivos
- Entender a escala completa de Platinum a Borked
- Saber o que cada medalha significa em termos práticos de jogo
- Interpretar o percentual de reports por medalha na barra de um jogo
- Relacionar a medalha ao esforço necessário para jogar
- Evitar a confusão entre medalha baixa e jogo ruim

:::

## A escala inteira, do topo ao fundo

O ProtonDB define sete níveis. Eles refletem o esforço que o jogador médio vai ter para jogar aquele título, não a qualidade do jogo em si. Do melhor para o pior:

| Medalha | Significado |
|---|---|
| `Platinum` | Roda perfeitamente, sem nenhum ajuste |
| `Gold` | Roda perfeitamente após uma pequena configuração |
| `Silver` | Roda com problemas menores, mas é jogável |
| `Bronze` | Roda, mas costuma ter falhas ou problemas que atrapalham |
| `Borked` | Não roda de jeito nenhum ou falha imediatamente |

Repare que não existe "medalha de jogo ruim". Um jogo `Borked` pode ser uma obra-prima simplesmente incompatível com o Proton naquele momento; e um jogo `Platinum` pode ser tecnicamente trivial mas você achar chato. A medalha mede *compatibilidade*, e só isso.

A versão consolidada de um jogo Platinum típico mostra como a API reflete essa unanimidade:

```terminal
$ curl -s "https://www.protondb.com/api/v1/reports/summaries/413150.json" | python3 -m json.tool
{
    "confidence": "high",
    "n": 312,
    "tier": "platinum",
    "trendingTier": "platinum",
    "bestReportedTier": "platinum",
    "score": 93.7,
    "rollingScore": 93.7,
    "stats": {
        "numReports": 312,
        "numVisibleReports": 42,
        "tierPercentages": {
            "platinum": 96.0,
            "gold": 3.0,
            "silver": 1.0
        }
    }
}
```

`confidence: high`, 312 reports e 96% `platinum`: é o cenário ideal. Compare com o exemplo da seção — em que `confidence` era `low` com apenas 9 reports. O número de reports e a confiança andam juntos.

:::nota
Historicamente a escala tinha níveis intermediários com nomes como "Native" (jogos com versão Linux nativa) e divisões por sistema. A versão atual que você vê no site concentrou tudo na escala de cinco níveis para o Steam Deck e para o desktop Linux, mantendo a mesma lógica de esforço do jogador.
:::

## O que "roda perfeitamente" quer dizer

O salto entre `Platinum` e `Gold` parece pequeno, mas é a diferença mais importante da escala. `Platinum` significa que você instala e joga, do início ao fim, sem tocar em nada — os reports confirmam cutscenes, áudio, saves e a tela inteira funcionando. `Gold` significa que o jogo *exige* uma mexida para chegar lá: talvez um vídeo codec que precisa ser instalado, um launcher que pede uma flag para pular, ou a troca de uma linha de configuração.

Essa distinção importa por dois motivos. Primeiro, porque no Steam Deck você quer minimizar trabalho: um `Gold` pode pedir algo que é trivial no desktop mas desconfortável de fazer sem teclado. Segundo, porque o próprio site documenta *qual* é essa mexida — então `Gold` raramente significa "problema", e sim "tem receita pronta".

## Lendo a barra de distribuição

Além da medalha única, cada página mostra uma barra empilhada com a proporção de reports em cada nível. É uma leitura mais honesta do que a medalha sozinha, porque revela o grau de acordo (ou desacordo) entre quem testou. A API entrega esses números prontos no campo `tierPercentages`:

```terminal
$ curl -s "https://www.protondb.com/api/v1/reports/summaries/532840.json" | python3 -m json.tool
{
    "confidence": "low",
    "n": 9,
    "tier": "borked",
    "trendingTier": "borked",
    "bestReportedTier": "gold",
    "score": 9.3,
    "rollingScore": 9.3,
    "stats": {
        "numReports": 9,
        "numVisibleReports": 4,
        "tierPercentages": {
            "gold": 22.0,
            "silver": 11.0,
            "bronze": 11.0,
            "borked": 56.0
        }
    }
}
```

Note a mensagem que esse JSON conta: `tier` é `borked` (a maioria não conseguiu rodar), mas `bestReportedTier` é `gold` — alguém fez o jogo rodar bem. Com apenas 9 reports e `confidence` `low`, a conclusão é "provável que não rode, mas existe um caminho". Esse tipo de leitura é o que separa quem apenas espia a medalha de quem entende o site.

Uma barra quase toda `Platinum` com um punhado de `Borked` também é informativa: os `Borked` podem ser de uma versão antiga do Proton, de um hardware específico ou de um erro de quem testou — e os reports desses casos costumam dizer isso nos comentários.

## Medalha é um instantâneo no tempo

O Proton e os jogos mudam constantemente. Um jogo `Borked` em 2022 pode ter virado `Gold` em 2024 depois que o Proton ganhou suporte a um recurso de anticheat; um `Platinum` pode se degradar depois de uma atualização quebrou algo. Por isso o campo `trendingTier` e o `rollingScore` existem: eles pesam mais os reports recentes. A medalha consolidada é o resumo; o `trending` é a tendência. Quando os dois divergem, vale prestar atenção nos reports mais novos.

Veja um caso real em que a tendência melhorou mas a medalha consolidada ainda não acompanhou — jogo com `trendingTier` acima do `tier`:

```terminal
$ curl -s "https://www.protondb.com/api/v1/reports/summaries/1244090.json" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(f'tier:          {d[\"tier\"]}')
print(f'trendingTier:  {d[\"trendingTier\"]}')
print(f'score:         {d[\"score\"]}')
print(f'rollingScore:  {d[\"rollingScore\"]}')
"
tier:          silver
trendingTier:  gold
score:         55.2
rollingScore:  78.5
```

O `tier` histórico é `silver`, mas o `trendingTier` — que pesa apenas reports recentes — já subiu para `gold`, e o `rollingScore` de 78.5 está bem acima do `score` histórico de 55.2. Isso é sinal de que o jogo melhorou e a medalha deve subir se a tendência se mantiver.

:::dica
Use `rollingScore` em vez de `score` para decidir compras. O `score` é a média histórica, que pode estar contaminada por reports antigos de um Proton desatualizado; o `rollingScore` reflete só a janela recente, que é a realidade atual do jogo no seu deck.
:::

## Resumo

- A escala vai de Platinum (roda sem ajustes) a Borked (não roda), passando por Gold, Silver e Bronze.
- A medalha mede o esforço do jogador para rodar o título, não a qualidade do jogo.
- `Gold` difere de `Platinum` por exigir uma configuração pequena, geralmente documentada.
- A barra de distribuição e o campo `tierPercentages` mostram o acordo entre os reports.
- `bestReportedTier` revela o melhor resultado já alcançado, mesmo quando a maioria falhou.
- `trendingTier` e `rollingScore` pesam reports recentes e capturam mudanças ao longo do tempo.

## Exercícios

1. Lista, com as palavras da legenda do site, o que diferencia `Platinum` de `Gold` e `Silver` de `Bronze`.
2. Na página de um jogo que você conhece, identifique a medalha consolidada e a barra de distribuição, e explique se os reports concordam entre si.
3. Consulte via API um jogo com `confidence` baixo e explique o que isso significa para a confiabilidade da medalha.
4. Compare `tier` e `trendingTier` de três jogos. Em quais deles a tendência contradiz a medalha consolidada?
5. **Desafio.** Encontre um jogo `Borked` cujo `bestReportedTier` seja `Gold` ou superior e leia um dos reports positivos para descobrir o que a pessoa fez para rodar. Relacione esse achado com o conceito de "receita de compatibilidade" que você verá nas seções de tweaks.
