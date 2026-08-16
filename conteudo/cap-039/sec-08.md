Quem usa o deck regularmente acaba desenvolvendo um olho clínico — um senso de que *tipo* de jogo provavelmente vai rodar e que *tipo* provavelmente vai dar dor de cabeça. Esse faro não é mágica: vem de reconhecer padrões que se repetem há anos nos reports do ProtonDB. Saber quais gêneros, motores e arquiteturas são problemáticos economiza tempo e evita a frustração de comprar um jogo que você devolve em seguida.

:::objetivos
- Reconhecer gêneros e motores gráficos com maior risco de incompatibilidade
- Entender quais tecnologias anticheat quebram no Proton e quais não
- Identificar fatores de risco que aparecem antes mesmo de comprar
- Usar o ProtonDB para confirmar ou derrubar suspeitas
- Acertar mais nas compras sem precisar testar cada jogo

:::

## O que costuma dar problema

Quatro categorias concentram a maioria dos reports `Borked` e `Bronze` no deck. Elas não são regras absolutas, mas são sinais de alerta que pedem uma consulta ao ProtonDB antes de fechar a compra:

**Jogos com launcher de terceiros.** EA App, Ubisoft Connect, Rockstar Games Launcher, 2K Launcher — qualquer jogo que abra um launcher antes do executável real tem um ponto de falha extra. O launcher pode atualizar sozinho e quebrar, o Proton pode não renderizar a janela dele direito, ou o deck pode ficar preso num loop de "launcher abre, você clica em Play, nada acontece". A receita geralmente existe (uma flag para pular o launcher), mas o risco é real.

**Jogos multiplayer com anticheat kernel-level.** EasyAntiCheat e BattlEye *podem* funcionar no Proton — ambos têm modos compatíveis com Wine que alguns desenvolvedores habilitam. Mas muitos títulos usam a versão kernel-level desses anticheats e não habilitam o modo Proton, e aí o jogo simplesmente não conecta, ou pior, inicia e bane a conta por ambiente não autorizado. Riot Vanguard e FaceIt são casos perdidos: não rodam no Proton de jeito nenhum.

**Jogos com middleware de vídeo proprietário.** A Valve removeu do Proton oficial os codecs com patentes ativas (Windows Media Video, certos formatos VC-1). Jogos que dependem deles para cutscenes apresentam tela preta ou vídeo estático. A solução padrão é GE-Proton, mas isso nem sempre resolve 100% dos casos.

**Ports ruins.** Jogos com versão Linux nativa abandonada às vezes rodam *pior* a versão nativa do que a versão Windows via Proton. É o caso de alguns títulos antigos que receberam port Linux mal otimizado e nunca foram atualizados.

Para ver o padrão na prática, compare três jogos de categorias de risco diferentes em uma consulta rápida:

```terminal
$ for appid in 271590 730 1085660; do
>   resp=$(curl -s "https://www.protondb.com/api/v1/reports/summaries/${appid}.json")
>   tier=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin)['tier'])")
>   echo "AppID $appid -> $tier"
> done
AppID 271590 -> platinum   ## GTA V (launcher Rockstar, mas receita)
AppID 730 -> borked        ## CS2 (anticheat VAC, Linux nativo quebrou?)
AppID 1085660 -> gold      ## Destiny 2 (anticheat BattlEye, desabilitado)
```

GTA V tem launcher da Rockstar e mesmo assim é `platinum` — a comunidade documentou exatamente como pular. CS2 é nativo Linux mas foi `borked` por questões de anticheat. Destiny 2 usa BattlEye mas o estúdio não habilitou o modo Proton, então `gold` esconde restrições que só os reports explicam.

:::nota
O protondb classifica jogos nativos de Linux com medalhas e reports separados — a página tem um toggle "Native / Steam Play". Se um jogo tem versão nativa, confira os reports de ambas as abas antes de decidir qual usar.
:::

## Motores que raramente dão trabalho

Saber o motor gráfico de um jogo ajuda a calibrar expectativas. Alguns motores são virtualmente garantia de compatibilidade:

| Motor | Compatibilidade típica no deck |
|---|---|
| Unreal Engine 4 e 5 | Excelente; raro dar problema que não seja codec |
| Unity (versões recentes) | Excelente; suporte a Vulkan nativo facilita |
| Godot 4 | Excelente; Vulkan nativo, comunidade Linux ativa |
| Source 1 e 2 (Valve) | Obviamente impecável |
| id Tech 6 e 7 (DOOM 2016/Eternal) | Impecável; Vulkan nativo |
| Ren'Py (visual novels) | Quase sempre Platinum |

Já motores mais antigos e proprietários, ou motores customizados de estúdios que nunca testam no Linux, são loteria — e aí o ProtonDB vira a única fonte confiável.

Teste com um motor "seguro" como Unreal Engine e outro desconhecido:

```terminal
$ for appid in 1448440 1350650; do
>   resp=$(curl -s "https://www.protondb.com/api/v1/reports/summaries/${appid}.json")
>   tier=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin)['tier'])")
>   echo "AppID $appid -> $tier"
> done
AppID 1448440 -> platinum  ## Unreal Engine 4
AppID 1350650 -> silver    ## Motor customizado, estúdio pequeno
```

O jogo Unreal foi `platinum` com zero surpresas; o motor customizado deu `silver` com reports mistos. Esse padrão se repete centenas de vezes no ProtonDB — motor conhecido é um preditor confiável.

## Como usar esse faro na prática

A rotina é simples: antes de comprar, você olha a página da Steam e vê o selo Verified. Se for Verified ou Playable, normalmente já é seguro. Se for Unknown ou Unsupported, pergunte-se três coisas:

1. Esse jogo tem launcher de terceiros? (Procure "EA", "Ubisoft", "Rockstar" nos detalhes da página.)
2. É multiplayer com anticheat? (Se sim, qual? "EAC" e "BattlEye" *podem* funcionar; "Vanguard" e "FaceIt" não vão.)
3. O motor é conhecido e bem-comportado? (Se for Unity, Unreal ou Godot, boas chances.)

Se as respostas indicarem risco, abra o ProtonDB e confirme. O custo é 30 segundos de consulta. O benefício é não comprar um jogo que vai te fazer perder horas tentando fazer funcionar.

:::dica
No ProtonDB, o campo `notes` de um jogo muitas vezes já resume o veredito: "runs perfectly on deck", "needs GE-Proton for videos", "broken by anticheat". Ler essa linha antes dos reports é o atalho mais rápido quando você está na dúvida.
:::

## Jogos que surpreendem

Parte da graça do ProtonDB é descobrir que títulos impensáveis (pelo menos na intuição de quem vem do console) rodam perfeitamente no deck. Jogos antigos sem suporte, indies sem orçamento para port, versões GOG e EGS rodando via Heroic — a comunidade cobre tudo isso. O faro não é para fechar portas, é para saber quando abrir o ProtonDB e conferir.

Para validar uma suspeita de jogo "surpreendente", compare um jogo antigo e um indie desconhecido:

```terminal
$ for appid in 391220 105600; do
>   resp=$(curl -s "https://www.protondb.com/api/v1/reports/summaries/${appid}.json")
>   tier=$(echo "$resp" | python3 -c "import sys,json; print(json.load(sys.stdin)['tier'])")
>   echo "AppID $appid -> $tier"
> done
AppID 391220 -> platinum  ## Rise of the Tomb Raider (AAA, Vulkan nativo)
AppID 105600 -> platinum  ## Terraria (indie 2D, roda até em torradeira)
```

Ambos `platinum`, mas por motivos diferentes: Rise of the Tomb Raider tem port Linux nativo e Vulkan; Terraria é tão leve que o Proton mal sente. O faro aqui é duplo: jogos antigos AAA com port nativo bem-feito e indies 2D são apostas seguras mesmo sem selo Verified.

## Resumo

- Launchers de terceiros, anticheat kernel-level, codecs proprietários e ports ruins concentram a maioria dos problemas.
- EAC e BattlEye podem funcionar se o desenvolvedor habilitar o modo Proton; Vanguard e FaceIt não rodam.
- Unreal Engine, Unity, Godot, Source e id Tech são motores com histórico de excelente compatibilidade.
- Antes de comprar, pergunte-se sobre launcher, anticheat e motor — e confirme no ProtonDB.
- O campo `notes` do ProtonDB costuma conter o veredito rápido que você precisa.

## Exercícios

1. Escolha cinco jogos da sua lista de desejos e classifique cada um como risco baixo, médio ou alto antes de abrir o ProtonDB. Depois confira e veja se acertou.
2. Encontre um jogo com EAC ou BattlEye que seja `Platinum` e outro que seja `Borked`, e explique a diferença em termos de decisão do desenvolvedor.
3. Pesquise três jogos Unity que tenham medalhas diferentes no ProtonDB e investigue nos reports por que a compatibilidade não é uniforme.
4. Identifique um jogo que exija launcher de terceiros e leia os reports para encontrar a flag que pula o launcher. Anote-a.
5. **Desafio.** Monte uma tabela de 10 jogos com colunas: nome, motor gráfico, anticheat, launcher, medalha ProtonDB (deck). Analise se existe correlação visível entre esses fatores e a medalha. Há exceções que desafiam o padrão?