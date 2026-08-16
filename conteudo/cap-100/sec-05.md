Quando a comunidade já discutiu, testou e concordou, o conhecimento vira documentação — e é aí que entram as wikis. O Steam Deck tem um ecossistema de wikis surpreendentemente maduro, que complementa a documentação oficial da Valve com o que só a experiência coletiva produz: guias de reparo, tabelas de compatibilidade, configurações testadas e truques que nenhum manual oficial documenta.

:::objetivos
- Identificar as principais wikis e bases de conhecimento do Steam Deck
- Distinguir wiki comunitária de documentação oficial e de guia editorial
- Avaliar a confiabilidade e a atualização de uma página de wiki
- Contribuir de volta para a base de conhecimento
:::

## O mapa das wikis

O termo "wiki" aqui cobre três coisas diferentes que convém separar:

- **A wiki do r/SteamDeck** — mantida pela comunidade do subreddit, com FAQs, glossário, links de reparo e recursos oficiais agregados. É o ponto de entrada canônico para iniciantes.
- **O Steam Deck HQ** — tecnicamente um site editorial, mas que funciona como base de conhecimento: guias aprofundados de undervolt, troca de SSD, fix de software e desempenho. É o mais próximo de "documentação técnica independente".
- **A documentação oficial da Valve** — a página de suporte do Steam Deck e as notas de versão do SteamOS. Autoridade total, porém enxuta.
- **Wikis de projetos vizinhos** — a wiki do Bazzite, do ChimeraOS e do EmuDeck, essenciais quando você opera esses sistemas no Deck.

Cada uma responde a um tipo de pergunta diferente, e misturá-las gera confusão.

```terminal
$ # onde cada pergunta encontra resposta:
$ echo "como faço X no steamOS?       -> docs oficiais + steam deck hq"
$ echo "por que X quebrou depois do update? -> reddit wiki + topicos"
$ echo "como configuro o bazzite?    -> wiki do bazzite"
$ echo "como configuro o emudeck?    -> wiki do emudeck"
```

## A wiki do r/SteamDeck em detalhe

A wiki do subreddit é modesta em volume mas alta em curadoria. Ela não tenta ensinar tudo; ela **aponta para o melhor recurso** de cada assunto, filtrado pela comunidade. Isso é valioso exatamente porque evita que você tropece nos mil guias ruins que existem soltos.

Seus blocos típicos: FAQ (as perguntas que lotavam o subreddit), glossário de termos (Proton, shader cache, TDP, VRS), links para reparo oficial (iFixit), guias de troca de SSD e tela, e recursos para desenvolvedores. A lógica é de **curadoria**, não de autoria.

:::dica
Sempre que for iniciar numa tarefa nova no Deck (trocar SSD, configurar EmuDeck, fazer undervolt), comece pela wiki do subreddit para achar o guia que a comunidade considera o melhor, em vez de jogar o termo no Google e cair no primeiro resultado patrocinado.
:::

## O Steam Deck HQ como referência técnica

O Steam Deck HQ merece menção à parte porque ocupa o papel que, em outros ecossistemas, seria da documentação oficial: guias técnicos detalhados, com passo a passo, capturas e — o diferencial — **resultados de benchmark** medidos. O site publica, por exemplo, configurações de TDP por jogo com a economia de bateria e o ganho de FPS medidos de fato.

Essa característica torna o Steam Deck HQ a fonte preferida para otimização de desempenho e modificação de hardware. Onde a wiki do subreddit aponta, o Steam Deck HQ aprofunda.

:::nota
Conteúdo editorial não é wiki no sentido técnico (você não edita a página), mas cumpre a mesma função de conhecimento consolidado. Ao avaliar um guia desses, olhe a **data de publicação** e se ele cita a versão do SteamOS: um guia de undervolt de 2022 pode estar desatualizado para o SteamOS 3.6.
:::

## Avaliando confiabilidade e atualidade

Wikis envelhecem, e no Steam Deck elas envelhecem rápido — o sistema muda a cada atualização, e o Proton evolui toda semana. Uma página de wiki tem três perguntas obrigatórias antes de você confiar nela:

1. **Quando foi atualizada pela última vez?** Wikis sérias mostram histórico. Página imutável há dois anos em um ecossistema que muda todo mês é bandeira vermelha.
2. **Qual versão do sistema ela assume?** Uma instrução para SteamOS 3.4 pode falhar no 3.6. Página que cita a versão é sinal de cuidado.
3. **Quem a mantém?** Histórico de edição ativo e múltiplos autores é bom sinal; página órfã de autor único é frágil.

```terminal
$ # verificando quando uma pagina foi alterada (github, ilustrativo):
$ curl -s "https://api.github.com/repos/SteamDeckHomebrew/decky-loader/commits?per_page=1" \
    | python3 -c "import json,sys; d=json.load(sys.stdin); print(d[0]['commit']['committer']['date'])"
2024-12-11T14:02:33Z
```

A data de último commit de um projeto relacionado é um bom indicador de atividade geral. Projetos ativos tendem a ter wikis e documentação vivos.

:::atencao
Não confunda "wiki bem escrita" com "wiki atual". Uma página impecavelmente formatada pode estar tecnicamente obsoleta. A checagem da versão do SteamOS/Proton citada vale mais que a aparência.
:::

## Contribuindo de volta

A razão de essas wikis existirem é que alguém, um dia, escreveu o que aprendeu. Devolver valor fecha o ciclo. As portas de entrada são variadas:

- **Wiki do subreddit** — contribuição via moderação (pedindo para adicionar/revisar um link).
- **Wikis de projetos open source** (Bazzite, ChimeraOS, EmuDeck) — são repositórios Git; você corrige erro de digitação ou adiciona seção via pull request.
- **iFixit e guias de reparo** — plataformas que aceitam guias e correções da comunidade.

```terminal
$ # contribuicao tipica numa wiki hospedada em git:
$ git clone https://github.com/algum-projeto/wiki.git
$ cd wiki
$ # edite, depois:
$ git add .
$ git commit -m "corrige passo da troca de ssd"
$ git push
```

Corrigir um passo errado ou adicionar uma nota de "isto mudou na versão 3.6" é uma contribuição pequena e de alto impacto — exatamente o tipo de coisa que salva a próxima pessoa que cair no mesmo buraco que você.

:::exemplo
Um guia de undervolt ganhou uma nota de rodapé de um usuário: *"na 3.6, o arquivo de configuração mudou para /etc/... — o comando abaixo não funciona mais"*. Essa única linha, adicionada por alguém que perdeu uma hora descobrindo o problema, economizou essa hora de centenas de leitores. É assim que a base de conhecimento se mantém viva.
:::

## Resumo

- As wikis do Steam Deck dividem-se em: wiki do subreddit (curadoria), Steam Deck HQ (guia técnico), docs oficiais (autoridade) e wikis de projetos vizinhos.
- A wiki do subreddit aponta para o melhor recurso de cada assunto; o Steam Deck HQ aprofunda com benchmarks medidos.
- Antes de confiar, pergunte: quando foi atualizada, qual versão assume e quem mantém.
- Projetos ativos têm wikis vivas; a data de último commit é um bom indicador.
- Devolver valor — corrigir um passo ou adicionar uma nota de versão — mantém o ecossistema saudável.

## Exercícios

1. Visite a wiki do r/SteamDeck e liste as cinco seções (ou categorias) que ela organiza.
2. Escolha um guia do Steam Deck HQ sobre desempenho e anote a versão do SteamOS que ele assume e a data de publicação.
3. Num projeto open source de wiki (Bazzite ou EmuDeck), encontre a data do último commit usando a API do GitHub, como no exemplo desta seção.
4. Compare a página oficial de suporte da Valve sobre um assunto com a página equivalente da wiki do subreddit: o que uma tem que a outra não tem?
5. **Desafio.** Identifique uma instrução desatualizada em alguma wiki (ou invente uma plausível) e escreva, como se fosse um editor, a edição que a atualizaria — incluindo a nota de versão que contextualiza a mudança.
