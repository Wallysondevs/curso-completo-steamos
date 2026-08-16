O ProtonDB funciona bem no navegador, mas a graça mesmo é integrá-lo ao fluxo do Steam Deck, onde você não quer largar o controle para pegar o celular toda vez que vai decidir um jogo. Felizmente a comunidade já criou ferramentas que trazem medalhas, scores e badges para dentro da biblioteca da Steam, do modo jogo e até do terminal. Esta seção fecha o capítulo com um mapa do que existe para você instalar agora.

:::objetivos
- Instalar e configurar o plugin ProtonDB Badges via Decky Loader
- Entender como usar o protondb-cli no terminal do deck
- Conhecer extensões de navegador que adicionam medalhas à Steam Store
- Integrar consultas da API em scripts próprios
- Montar um fluxo completo: comprar, instalar, conferir e jogar

:::

## Decky Loader + ProtonDB Badges

O Decky Loader é o gerenciador de plugins do Steam Deck — ele injeta extensões no Game Mode e permite instalar e atualizar plugins por uma interface integrada. O ProtonDB Badges é um dos mais baixados: ele coloca a medalha do ProtonDB (e um selinho indicando o nível) logo abaixo do banner de cada jogo na sua biblioteca, ao lado do selo Verified da Valve.

A instalação, uma vez que o Decky Loader esteja no sistema, é de dois cliques:

```terminal
$ xdg-open https://github.com/SteamDeckHomebrew/decky-loader
## Baixe o .desktop, execute e depois, no Game Mode, abra o menu Decky (ícone de plug).
```

Com o Decky Loader rodando, vá até a loja de plugins (ícone da lojinha), procure "ProtonDB Badges" e instale. Reinicie o Game Mode. A partir daí, cada jogo na biblioteca mostra o badge: um círculo colorido que replica a medalha (`Platinum` azul, `Gold` dourado, `Silver` prata, `Bronze` bronze, `Borked` vermelho).

:::dica
O badge respeita o filtro de Steam Deck: ele mostra a medalha calculada apenas com reports de deck, não a global. É a informação certa no lugar certo, sem você precisar abrir navegador nenhum.
:::

## `protondb-cli`: terminal como central de consulta

Para quem gosta de resolver coisas no terminal (ou quer automatizar checagens em lote), existe o `protondb-cli`, um wrapping da API em linha de comando. Ele é um pacote Python ou AUR dependendo de como você instalou; no SteamOS, o caminho mais simples é via `pipx`:

```terminal
$ pipx install protondb-cli
$ protondb-cli --help
Usage: protondb-cli [OPTIONS] COMMAND [ARGS]...

  Search and view ProtonDB game reports from the command line.

Options:
  --version  Show the version and exit.
  --help     Show this message and exit.

Commands:
  search   Search for a game by name
  show     Show report summary for a game by AppID
```

Para consultar um jogo por AppID:

```terminal
$ protondb-cli show 1145360
Name: Hades
Tier: Platinum ⭐
Score: 75.1
Confidence: high
Reports: 145 total
Deck reports: good track record for Steam Deck
```

E para buscar jogos por nome (o que é útil quando você não tem o AppID de cabeça):

```terminal
$ protondb-cli search "elden ring"
1245620 - ELDEN RING (Platinum)
```

O `protondb-cli` também tem opções para filtrar por deck e exibir reports individuais, embora a visualização no terminal seja mais enxuta que o site.

## Extensões de navegador

Se você compra jogos pelo computador desktop (e não direto pelo deck), as extensões de navegador são o complemento natural. A mais popular é a **Augmented Steam**, que adiciona uma camada de informações — preço histórico, nota do OpenCritic, e medalhas do ProtonDB — direto na página da Steam Store. O ProtonDB também mantém uma extensão própria e mais leve que faz só isso: injetar a medalha abaixo do preço.

Com a extensão instalada, cada página de jogo na Steam passa a mostrar, logo abaixo das informações de compra, a medalha do ProtonDB com o link para a página completa. É o mesmo dado do site, mas sem sair da loja.

## Scripts próprios com a API

A API pública resolve a maioria das necessidades de automação. Um loop simples em shell já cobre o caso de "consultei meus desejos antes da sale":

```terminal
$ for appid in 1145360 1245620 292030 1091500 1174180; do
>   resp=$(curl -s "https://www.protondb.com/api/v1/reports/summaries/${appid}.json")
>   tier=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin)['tier'])")
>   score=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin)['score'])")
>   echo "$appid | $tier | $score"
> done
1145360 | platinum | 75.1
1245620 | platinum | 82.3
292030 | gold | 65.7
1091500 | platinum | 88.4
1174180 | borked | 12.0
```

O mesmo se resolve com Python ou qualquer linguagem que saiba parsear JSON. O ponto é: você pode ter sua própria "pré-sale checklist" rodando em segundos.

:::atencao
Se for disparar muitas consultas, coloque um `sleep` entre elas — a API não tem rate limit documentado, mas a boa prática do ProtonDB pede moderação. Para uma lista de dezenas de jogos, um `sleep 1` entre requests é razoável.
:::

## Seu fluxo final

Com todas as peças no lugar, o fluxo de decisão fica integrado ao ecossistema, sem abrir o celular nem sair do deck:

1. Na Steam Store, a extensão mostra a medalha na página do jogo. Selo Verified + medalha ProtonDB lado a lado.
2. Na dúvida, `protondb-cli` ou um `curl` rápido confirmam pelo terminal.
3. Na biblioteca do deck, o badge do ProtonDB Badges mostra a medalha filtrada por deck.
4. Se o jogo precisar de tweaks, você consulta os reports filtrados e aplica as flags no campo de Launch Options.

Da descoberta à execução, o ProtonDB está ali — e agora você sabe usar cada pedaço dele.

## Resumo

- ProtonDB Badges (Decky Loader) injeta a medalha filtrada por deck na biblioteca do Game Mode.
- `protondb-cli` traz consultas de AppID e busca por nome no terminal do SteamOS.
- Extensões de navegador (Augmented Steam, ProtonDB) mostram medalhas na página da Steam Store.
- Scripts com `curl` + `jq` ou `python3 -m json.tool` automatizam consultas em lote.
- O fluxo completo junta o selo Verified (Valve) + medalha ProtonDB + reports + tweaks.
- Moderação nas consultas: respeite a API e adicione `sleep` entre chamadas em lote.

## Exercícios

1. Instale o Decky Loader e o ProtonDB Badges (se ainda não tiver) e verifique se as medalhas aparecem na biblioteca.
2. Rode `protondb-cli show` para três jogos do seu deck e compare o `tier` do terminal com o que o badge mostra.
3. Escreva um script de 5 linhas que recebe uma lista de AppIDs e imprime nome + medalha + score em formato tabular.
4. Instale a extensão Augmented Steam no seu navegador desktop e navegue por uma página da Steam Store para ver a medalha integrada.
5. **Desafio.** Combine o que aprendeu neste capítulo com o capítulo sobre Heroic/GOG: monte um script que, dado um AppID de um jogo que você tem no Heroic, consulte o ProtonDB, exiba a medalha e sugira qual Proton usar com base nos reports filtrados por deck.