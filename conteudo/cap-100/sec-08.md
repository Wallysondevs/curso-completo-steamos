Há uma comunidade inteira rodando o Steam Deck fora do SteamOS oficial: pessoas que instalam distribuições alternativas, plug-ins que o sistema não prevê e configurações que a Valve não endossa. Essa bolha — Bazzite, ChimeraOS, Decky Loader, EmuDeck, Proton-GE — tem fontes de apoio próprias, e saber navegar nelas muda completamente a experiência de quem quer ir além do estoque.

:::objetivos
- Mapear o ecossistema de software comunitário do Steam Deck
- Identificar as fontes de suporte de cada projeto alternativo
- Avaliar os riscos do software não oficial e quando ele vale a pena
- Encontrar a versão certa de componentes como Proton-GE

:::

## O ecossistema além do estoque

O SteamOS que vem no Deck é ótimo, mas propositalmente restrito. A comunidade preencheu as lacunas com um ecossistema rico:

- **Distribuições alternativas** — Bazzite e ChimeraOS são as mais populares. Bazzite troca o sistema imutável da Valve por um Fedora com foco em jogos; ChimeraOS é uma "SteamOS alternativa" focada em HTPC. Ambas rodam no Deck.
- **Emulação** — EmuDeck e RetroDECK, que instalam e configuram dezenas de emuladores de uma vez.
- **Customização de sistema** — Decky Loader, um carregador de plug-ins que adiciona funcionalidades à interface do SteamOS.
- **Camadas de compatibilidade** — Proton-GE (GloriousEggroll), versões não oficiais do Proton com codecs e correções que a Valve ainda não liberou.

Cada um desses projetos tem repositório, documentação e canal de suporte próprios. É um erro pedir ajuda no subreddit genérico quando o problema é especificamente do Bazzite.

```terminal
$ # onde mora o suporte de cada projeto:
$ echo "bazzite   -> github.com/bazzite-org/bazzite + discord proprio"
$ echo "emudeck   -> emudeck.github.io + subreddit r/EmuDeck"
$ echo "decky     -> github.com/SteamDeckHomebrew/decky-loader"
$ echo "proton-ge -> github.com/GloriousEggroll/proton-ge-custom"
```

## Fontes de suporte de cada projeto

Projetos comunitários maduros têm uma cadeia de suporte previsível, nesta ordem de preferência:

1. **Documentação oficial do projeto** — o README e a wiki do repositório. É onde a resposta canônica vive.
2. **Issue tracker no GitHub** — para bugs. Pesquise antes de abrir uma issue nova.
3. **Discord ou subreddit próprio** — para dúvidas e ajuda em tempo real.
4. **Fórum genérico da comunidade** — só na falta das opções acima.

Seguir essa ordem evita o constrangimento de perguntar no lugar errado e chega na resposta mais rápido.

```terminal
$ # abrindo o issue tracker de um projeto (ilustrativo):
$ curl -s "https://api.github.com/repos/GloriousEggroll/proton-ge-custom/releases/latest" \
    | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['tag_name'], '|', d['published_at'])"
GE-Proton9-22 | 2024-11-30T18:21:44Z
```

A saída acima mostra a versão mais recente do Proton-GE e quando saiu. Saber a versão exata que você usa é o primeiro dado de qualquer pedido de suporte nesse ecossistema.

## O Proton-GE em particular

O Proton-GE merece um destaque porque é o componente alternativo mais usado e menos compreendido. Ele não substitui o Proton oficial; **complementa**, adicionando codecs de vídeo protegidos por patente e correções experimentais que a Valve ainda não incorporou. É instalado por ferramentas como ProtonUp-Qt e fica disponível na lista de compatibilidade da Steam.

```terminal
$ # listando versoes de proton instaladas (arquivos no home):
$ ls ~/.steam/root/compatibilitytools.d/ 2>/dev/null
GE-Proton9-20/
GE-Proton9-22/
$ flatpak list | grep -i protonup
ProtonUp-Qt   ...
```

A regra de ouro: use o Proton oficial primeiro; recorra ao GE-Proton quando um jogo específico precisa de codec ou de correção que a versão oficial não tem. Não troque tudo para GE "por precaução" — você perde as otimizações e testes da Valve.

:::atencao
Versões alternativas do Proton e distribuições não oficiais **não têm suporte da Valve**. Se algo quebra usando GE-Proton ou Bazzite, a Valve não é responsável nem vai te ajudar. O suporte desses projetos é a comunidade dos próprios projetos.
:::

## Avaliando o custo-benefício do não oficial

Software comunitário não é inferior por definição — muito do que hoje é padrão (o próprio Proton evolui muito pela comunidade) começou não oficial. Mas cada camada extra de customização tem um custo de manutenção e de isolamento que você precisa aceitar de olhos abertos.

Antes de instalar algo não oficial, pergunte:

1. **O que ele resolve que o oficial não resolve, concretamente?** Se a resposta for vaga ("deixa melhor"), reconsidere.
2. **Como eu desfaço se der errado?** Projeto maduro tem caminho de volta documentado.
3. **A comunidade dele é ativa?** Último commit recente e canal de suporte vivo são bons sinais.

```terminal
$ # checando a atividade de um projeto pelo ultimo commit (ilustrativo):
$ curl -s "https://api.github.com/repos/SteamDeckHomebrew/decky-loader/commits?per_page=1" \
    | python3 -c "import json,sys; print(json.load(sys.stdin)[0]['commit']['committer']['date'])"
2024-12-09T11:30:05Z
```

Projeto com último commit antigo e sem respostas no issue tracker é projeto abandonado — e no SteamOS, que atualiza o tempo todo, software abandonado quebra rápido.

:::exemplo
O Decky Loader quebra a cada atualização grande do Steam porque ele injeta código na interface do cliente Steam, que é fechada. A comunidade do Decky costuma corrigir em dias, mas quem instalou sem saber disso leva susto quando o menu some após um update do sistema. Conhecer o **mecanismo** por trás do software — e não só o botão de instalar — é o que evita o susto.
:::

## Resumo

- O ecossistema comunitário inclui distribuições (Bazzite, ChimeraOS), emulação (EmuDeck), customização (Decky) e camadas de compatibilidade (Proton-GE).
- Cada projeto tem cadeia de suporte própria, na ordem: docs → issue tracker → Discord/subreddit → fórum genérico.
- O Proton-GE complementa, não substitui, o Proton oficial; use oficial primeiro.
- Software não oficial não tem suporte da Valve — o suporte é a comunidade de cada projeto.
- Antes de instalar, avalie: o que resolve concretamente, como desfaz, e se a comunidade é ativa.

## Exercícios

1. Liste as versões de Proton instaladas no seu Deck com `ls ~/.steam/root/compatibilitytools.d/` e identifique quais são oficiais e quais são GE.
2. Consulte a API do GitHub para achar a versão mais recente do Proton-GE e a data de publicação.
3. Escolha um projeto (Bazzite, Decky ou EmuDeck) e mapeie sua cadeia de suporte: onde está a doc, onde está o issue tracker e se há Discord.
4. Verifique a data do último commit de um projeto comunitário que você usa e avalie, com base nela, se ele está ativo.
5. **Desafio.** Escreva uma análise de custo-benefício (o que resolve, o que arrisca, como desfaz) para instalar um software não oficial de sua escolha no Deck, aplicando as três perguntas desta seção.
