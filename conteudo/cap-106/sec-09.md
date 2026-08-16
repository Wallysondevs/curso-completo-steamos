Ao fim deste capítulo, você tem uma lista de canais, sites, ferramentas e comunidades. Mas uma lista consumida de forma passiva vira ruído em uma semana. O passo final — e o que separa quem se mantém atualizado de quem coleciona assinaturas — é montar um sistema pessoal de informação: poucas fontes, verificadas por critério, consumidas sob demanda e não sob notificação. Esta seção fecha o capítulo ensinando a construir esse radar.

:::objetivos
- Montar um sistema de informação mínimo e sustentável com poucas fontes
- Usar RSS e alertas para consumir sob demanda em vez de ser consumido por notificação
- Estabelecer um ritual de verificação antes de aplicar qualquer recomendação
- Avaliar e podar fontes periodicamente
:::

## Menos fontes, mais profundidade

A primeira regra é contra-intuitiva: um radar bom tem *poucas* fontes, e não muitas. Cinco fontes lidas com atenção valem mais que cinquenta scroladas. O erro clássico é assinar tudo que aparece neste capítulo e, em duas semanas, ignorar todas porque o volume é insustentável.

Escolha uma fonte por categoria, no máximo:

- **Notícias:** GamingOnLinux (site + RSS).
- **Desempenho/configuração:** Steam Deck Gaming ou SteamDeckHQ.
- **Referência:** ProtonDB (consulta sob demanda, não assinatura).
- **Comunidade:** r/SteamDeck ou um Discord de projeto específico.
- **Contexto/opinião:** Gardiner Bryant ou Deck Ready.

Cada fonte responde a uma pergunta diferente. Se duas fontes respondem à mesma pergunta, você mantém a melhor e poda a outra. O objetivo não é saber de tudo, é saber onde encontrar tudo.

## Consumir sob demanda, não sob notificação

O algoritmo de uma rede social quer o seu tempo, não o seu aprendizado. Notificações push, "recomendados para você" e feeds infinitos treinam consumo reativo. Um radar de informação deliberado inverte isso: você decide *quando* consultar, e o conteúdo espera por você.

Duas ferramentas tornam isso concreto. **RSS** agrega posts de sites e canais num leitor que você abre quando quer — o GamingOnLinux, por exemplo, tem feed limpo. Leitores como o [Miniflux](https://miniflux.app), o [FreshRSS](https://freshrss.org) ou o próprio [Feedly](https://feedly.com) centralizam isso. **Alertas de versão** via GitHub Releases (usando o recurso de "Watch → Releases only" nos repositórios das ferramentas que você usa) te avisam precisamente quando uma ferramenta atualiza — sem ruído de post de blog.

```terminal
$ gh repo view CryoByte33/steam-deck-utilities --json releases
```

Se você usa o GitHub CLI, comandos como esse consultam as releases de um projeto sob demanda. Para automatizar a verificação de várias ferramentas com um único comando, crie uma lista de repositórios e itere:

```terminal
$ for repo in CryoByte33/steam-deck-utilities SteamDeckHomebrew/decky-loader dragoonDorise/EmuDeck; do
>   echo "=== $repo ==="
>   gh release list -R "$repo" -L 1 2>/dev/null
> done
=== CryoByte33/steam-deck-utilities ===
v3.0.1  Latest  (v3.0.1)  2025-02-10T18:32:01Z
=== SteamDeckHomebrew/decky-loader ===
v3.1.0  Latest  (v3.1.0)  2025-02-12T21:15:44Z
=== dragoonDorise/EmuDeck ===
v4.0.3  Latest  (v4.0.3)  2025-02-01T14:08:33Z
```

Esse script de três linhas é seu "balanço de ferramentas": em segundos ele te diz se alguma das ferramentas essenciais atualizou e você não viu. O `2>/dev/null` silencia erros de repositórios sem acesso ou renomeados — é o `gh` sendo educado quando o GitHub fica de fora.

Para o feed RSS, você pode usar o leitor gráfico (Feedly, FreshRSS) ou puxar o RSS do terminal com `curl` se quiser minimalismo puro:

```terminal
$ curl -s "https://www.gamingonlinux.com/feeds/latest.xml" | head -30
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>GamingOnLinux Latest Articles</title>
...
```

O RSS é XML cru — legível o suficiente para um grep rápido, e estruturado o bastante para ser parseado por qualquer leitor. A combinação `gh` + `curl` cobre, respectivamente, alerta de ferramenta e alerta de notícia, sem nenhum aplicativo além do terminal e um leitor RSS opcional.

:::dica
Crie uma "página inicial de consulta" com no máximo dez links: ProtonDB, AreWeAntiCheatYet, GamingOnLinux, seu leitor RSS, os repositórios das ferramentas que você usa e o subreddit de dúvidas. Consulte essa página com intenção, não por hábito.
:::

## Um ritual de verificação

Antes de aplicar qualquer recomendação — de um vídeo, um post ou um artigo — rode um checklist mental curto. Ele integra todo o critério deste capítulo e protege contra mudanças que quebram sua máquina.

1. **Data:** quando foi publicado? O que era verdade em 2023 pode não ser no SteamOS 3.6.
2. **Fonte:** é primária (desenvolvedor, documentação) ou secundária (agregador, opinião)?
3. **Versão:** o conteúdo cita a versão de SteamOS, Proton ou da ferramenta? Se não cita, desconfie.
4. **Trade-off:** o texto menciona desvantagens e riscos, ou só benefícios? Recomendação sem contra-indicação é anúncio.
5. **Reprodutibilidade:** eu conseguiria reproduzir o resultado com uma medição, ou é só "deu certo aqui"?

Esse ritual de cinco perguntas — que ecoa a disciplina de benchmarking do capítulo anterior — vira reflexo em semanas se você o aplicar toda vez.

## Podar e revisar o radar

Épocas mudam e fontes morrem. Um canal que era excelente em 2023 pode ter parado de publicar, mudado de foco ou perdido rigor. A cada três meses, revise o radar com três perguntas:

- **Ainda publica?** Fonte parada há dois meses em área que muda toda semana (anti-cheat, Proton) é fonte morta.
- **Ainda é primária?** O autor ainda é quem está por trás da informação, ou virou apenas repassador?
- **Ainda responde à minha pergunta?** Se sua necessidade mudou (você parou de emular, começou a competir online), a fonte pode ter ficado irrelevante para *você* mesmo permanecendo relevante para outros.

Poda é sinal de maturidade, não de desistência.

## Resumo

- Um radar bom tem poucas fontes; uma por categoria, respondendo a perguntas distintas.
- Consumir sob demanda (RSS, alertas de release) supera consumo reativo por notificação.
- Mantenha uma "página inicial de consulta" com no máximo dez links de referência.
- Aplique o ritual de cinco perguntas (data, fonte, versão, trade-off, reprodutibilidade) antes de seguir qualquer recomendação.
- Revise e pode o radar a cada três meses.

## Exercícios

1. Escreva sua seleção de fontes (uma por categoria, no máximo cinco) e justifique cada escolha em uma frase. Quais fontes deste capítulo você deixou de fora e por quê?
2. Configure um leitor RSS e assine o feed do GamingOnLinux. Abra-o uma vez por dia, em horário fixo, e anote quantos itens você realmente leu versus quantos ignorou.
3. No GitHub, "assista" os repositórios de duas ferramentas que você usa, no modo "Releases only". Desative notificações de tudo o mais.
4. Aplique o ritual de cinco perguntas a uma recomendação recente que você viu num vídeo. Ela passa em todas? Onde falha?
5. **Desafio.** Monte sua "página inicial de consulta" (um arquivo `.md` ou uma página de favoritos) com no máximo dez links, junto de uma frase explicando quando consultar cada um. Use-a por uma semana e, ao final, revise: algum link nunca foi aberto? Alguma necessidade ficou sem fonte?