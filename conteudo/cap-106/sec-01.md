O Steam Deck tem um ecossistema de informação que cresceu mais rápido do que o próprio aparelho. Canais de YouTube, sites especializados, ferramentas open-source, comunidades no Reddit e Discord — em 2025, a oferta de conteúdo é tanta que o problema deixou de ser "não tem material" e virou "não sei por onde começar". Este capítulo existe para resolver esse segundo problema: ele é um mapa curado do que realmente vale o seu tempo.

A diferença entre um recurso recomendado e um aleatório é o mesmo que separa um guia escrito por quem já quebrou a máquina três vezes de um tutorial copiado de outro tutorial. O ecossistema Steam Deck tem uma característica rara: muitos dos criadores mais relevantes são também desenvolvedores das ferramentas que você usa. Quem fez o CryoUtilities aparece no YouTube explicando *swap*. Quem mantém o ProtonDB escreve sobre anti-cheat no GamingOnLinux. Essa circularidade entre criação de software e produção de conteúdo é o que torna o ecossistema confiável — e é nela que este capítulo se apoia.

:::objetivos
- Identificar os canais, sites e ferramentas mais relevantes do ecossistema Steam Deck
- Distinguir fontes primárias (desenvolvedores, documentação oficial) de secundárias (curadoria)
- Montar um radar pessoal de informação que não dependa de algoritmo de rede social
- Conhecer as ferramentas que resolvem os problemas mais comuns sem reinventar a roda
- Saber onde buscar ajuda quando o diagnóstico automático falha
:::

## Curadoria não é gatekeeping

Existe uma diferença entre recomendar algo e dizer que o resto não presta. Este capítulo não é uma lista exaustiva de "tudo que existe sobre Steam Deck" — seria impossível e inútil, porque metade estaria desatualizada em seis meses. É uma seleção do que se mostrou consistente ao longo de vários ciclos de atualização do SteamOS, com critérios claros:

**Frequência de atualização.** Um blog que publicou três artigos em 2022 e nunca mais voltou não entra. O ecossistema muda rápido — kernel novo, versão de Proton, firmware do Deck, anti-cheat que quebra da noite para o dia — e fonte parada é fonte morta.

**Proximidade com a fonte.** Desenvolvedores de software relevante, testers do beta do SteamOS, moderadores de comunidades grandes: essas pessoas têm acesso a informação que o resto do ecossistema só replica dias depois. Priorizamos fontes próximas da origem.

**Rigor técnico.** "Deu certo na minha máquina" não é artigo; é anedota. Os recursos recomendados aqui explicam o *porquê*, mostram a saída dos comandos e sabem diferenciar correlação de causalidade — a mesma disciplina que este curso inteiro pratica.

**Transparência de interesses.** Patreon, affiliate links, sponsored content: nada disso desqualifica um criador. O que desqualifica é esconder. Os melhores do ecossistema declaram seus vínculos abertamente.

:::dica
Se você só tem cinco minutos por dia para se manter atualizado, escolha **uma** fonte primária de notícias (GamingOnLinux), **um** canal de YouTube focado em desempenho (Steam Deck Gaming ou Deck Ready) e **uma** comunidade para dúvidas pontuais (r/SteamDeck). Três pontos de contato bem escolhidos cobrem 90% do que você precisa saber.
:::

## Como este capítulo está organizado

As oito seções seguintes percorrem quatro categorias de recursos:

**Seções 2 e 3 — Quem assistir e o que ler.** Canais de YouTube, sites de notícias, portais de referência técnica. Aqui você encontra os nomes mais confiáveis para acompanhar o ecossistema sem cair em clickbait.

**Seções 4 a 7 — Ferramentas que resolvem problemas.** Launchers para jogos fora da Steam, plugins para customizar a interface, utilitários de desempenho, monitores de sistema. Cada ferramenta é apresentada com o problema que resolve, não com a lista de features.

**Seção 8 — Onde pedir ajuda.** Comunidades no Reddit, Discord e fóruns oficiais. Saber *como* perguntar é tão importante quanto saber *onde*.

**Seção 9 — Seu radar pessoal.** Como combinar essas fontes num sistema de informação que funcione para o seu perfil, sem virar refém de notificação infinita.

O capítulo é autocontido: você pode lê-lo de ponta a ponta ou pular direto para a categoria que interessa. Cada seção funciona como uma recomendação independente, mas todas compartilham o mesmo critério de curadoria.

## Um aviso sobre links e mudanças

Um capítulo de recursos recomenda serviços externos, e serviços externos mudam de nome, de dono ou desaparecem. A comunidade Linux gamer já viu isso acontecer mais de uma vez — um fork substitui o original, um projeto é arquivado no GitHub, um canal muda de foco. Por isso, trate cada link deste capítulo como ponto de partida, não como verdade permanente.

A prática recomendada é simples e se repete em todo o livro: **verifique antes de confiar.** Se um link quebrar ou um projeto parecer abandonado, volte às fontes primárias — o GitHub do projeto, a documentação oficial, a comunidade — e procure o sucessor. O ecossistema se autorregula exatamente assim: quando uma ferramenta morre, a comunidade aponta coletivamente para a que a substituiu, e essa informação aparece primeiro nos espaços descritos na seção 8.

:::nota
Como os recursos mudam, o valor duradouro deste capítulo não está nos nomes — está no método de curadoria e no ritual de verificação que você aprende aqui. Nomes mudam; o hábito de filtrar fontes por critério e de medir antes de adotar uma recomendação permanece.
:::

## Saiba sua versão antes de confiar num tutorial

O critério mais decisivo da curadoria é também o mais fácil de verificar: a versão do sistema operacional. Um tutorial escrito para o SteamOS 3.2 pode recomendar passos que não existem mais no 3.6. Portanto, antes de seguir *qualquer* procedimento — inclusive os das ferramentas recomendadas nas próximas seções — confirme em qual sistema você está.

No modo desktop, abra um terminal e rode:

```terminal
$ cat /etc/os-release
NAME="SteamOS"
VERSION="3.6.20 (20250214.1)"
ID=steamos
PRETTY_NAME="SteamOS 3.6.20"
VERSION_CODENAME=noble
$ uname -r
6.8.0-valve1-1
```

A linha `VERSION` diz qual release do SteamOS você roda, e o `VERSION_CODENAME=noble` confirma que ele é construído sobre o Ubuntu 24.04 (Noble Numbat) — informação útil para saber a qual família de base sua máquina pertence. O `uname -r` mostra o kernel da Valve, que difere do kernel upstream do Ubuntu. Com esses três dados em mãos, você consegue julgar se um tutorial de seis meses atrás ainda se aplica a você.

```terminal
$ flatpak --version
Flatpak 1.14.6
$ flatpak list | head -5
Name                         Application ID                        Version        Branch
ProtonUp-Qt                  net.davidotek.pupgui2                 2.11.2         stable
Heroic Games Launcher        com.heroicgameslauncher.hgl          2.15.2         stable
```

O mesmo raciocínio vale para as ferramentas: quase tudo que este capítulo recomenda é distribuído como Flatpak, e conhecer a versão instalada (`flatpak list`) é o primeiro passo para saber se você está numa versão compatível com o guia que está lendo. Confira também se há atualização pendente para não seguir recomendação baseada em versão antiga:

```terminal
$ flatpak update --check
```

Anote sua versão do SteamOS, do kernel e das ferramentas num lugar fácil — esse registro "de base" é o que transforma uma lista de recursos em um sistema de verificação funcional.

## A categoria que você não esperava: a própria Valve

Uma fonte que quase todo mundo esquece é a oficial. As notas de release do SteamOS — publicadas pela Valve no fórum da Steam Community e no blog — são a fonte mais confiável sobre o que mudou em cada update, e são surpreendentemente detalhadas: listam correções de hardware, mudanças de Proton e novos recursos com precisão que nenhum agregador reproduz integralmente.

```terminal
$ curl -s https://store.steampowered.com/news/app/1675200 | head -20
```

O ID 1675200 é o app do próprio Steam Deck na Steam. As notas oficiais vivem na seção de notícias desse app, e lê-las diretamente — em vez da interpretação de terceiros — é o hábito que fecha o círculo da curadoria: fontes primárias primeiro, secundárias como contexto.

## Resumo

- O ecossistema Steam Deck tem abundância de conteúdo; o desafio é filtrar o que é confiável.
- Os melhores criadores costumam ser também desenvolvedores das ferramentas que recomendam.
- Curadoria se baseia em quatro critérios: frequência, proximidade com a fonte, rigor técnico e transparência.
- Três pontos de contato bem escolhidos (notícias, desempenho, comunidade) cobrem a maioria das necessidades.
- Este capítulo organiza os recursos em quatro categorias: canais/sites, ferramentas, comunidades e radar pessoal.

## Exercícios

1. Liste três canais de YouTube ou sites que você já segue sobre Steam Deck. Para cada um, responda: com que frequência publicam? Quem são as pessoas por trás? Você confiaria numa recomendação técnica deles sem verificar em outra fonte?
2. Acesse o [ProtonDB](https://www.protondb.com/) e procure um jogo que você joga. Compare o rating da Valve (Deck Verified) com os reports da comunidade. Eles concordam?
3. Entre no [r/SteamDeck](https://reddit.com/r/SteamDeck) e leia os 10 posts mais votados da semana. Quantos são notícias, quantos são dúvidas técnicas, quantos são humor/memes? Essa proporção combina com o que você esperava?
4. Escolha uma ferramenta mencionada nas próximas seções que você nunca usou, instale-a e configure-a. Documente o processo em três frases.
5. **Desafio.** Monte seu próprio "radar de informação" com no máximo cinco fontes (entre canais, sites e comunidades). Explique por que cada uma entrou e o que você espera obter dela que as outras não entregam.