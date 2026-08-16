O software livre que você usou durante todo o curso — do kernel ao Gamescope, do systemd ao Btrfs — é mantido por pessoas comuns que, em algum momento, decidiram corrigir um bug, melhorar uma documentação ou reportar um problema. Contribuir é tanto a forma mais eficaz de aprofundar o que você aprendeu quanto o caminho mais curto para ganhar reconhecimento num campo técnico. Você não precisa ser mantenedor de nada para começar: a porta de entrada é mais baixa do que parece.

:::objetivos
- Entender os diferentes níveis de contribuição, do bug report à pull request
- Configurar um fluxo de trabalho com Git e GitHub via fork e branch
- Escrever issues reprodutíveis e pull requests que mantenedores aceitam
- Ler e seguir guidelines de contribuição de projetos reais
- Contribuir com a comunidade SteamOS e Linux de forma consistente
:::

## As portas de entrada da contribuição

Existe um mito de que contribuir com código exige ser um programador experiente. Na prática, a grande maioria das primeiras contribuições não é código — e isso é bom, porque essas portas estão sempre abertas:

**Reportar bugs.** Fazer uma issue bem descrita, com passos de reprodução, versão do software e logs, é trabalho valioso. Um bug report ruim custa tempo do mantenedor; um bom economiza horas.

**Melhorar documentação.** A Wiki do Arch, a documentação do Gamescope, o README de projetos que você usa: corrigir um erro de digitação, adicionar um exemplo que faltava, traduzir. É a contribuição de menor barreira e uma das mais subestimadas.

**Traduzir.** Projetos como o SteamOS, o KDE e o GNOME têm equipes de tradução sempre precisando de mão. Se você domina inglês e português, ajudar a localizar interfaces é uma contribuição de alto impacto e baixo risco.

**Responder dúvidas.** Em fóruns, Reddit, GitHub Discussions e nos canais do curso: responder quem está começando consolida seu conhecimento e constrói reputação.

**Código.** Só depois das anteriores: corrigir um bug pequeno, implementar uma feature marcada como `good first issue`.

:::dica
Procure no GitHub a etiqueta `good first issue` ou `help wanted` nos repositórios que você usa (Gamescope, Heroic, Lutris, MangoHud). São issues pré-selecionadas pelos mantenedores exatamente para receber gente nova. Uma delas é o seu ponto de partida ideal.
:::

## O fluxo fork + branch + pull request

O fluxo de contribuição padrão do GitHub é um ciclo de cinco passos. Suponha que você vai corrigir um erro de digitação no README de um projeto hipotético `exampleorg/steamtools`.

**1. Fork** — cria uma cópia do repositório na sua conta:

```terminal
$ git clone https://github.com/seu-usuario/steamtools.git
$ cd steamtools
$ git remote -v
origin  https://github.com/seu-usuario/steamtools.git (fetch)
origin  https://github.com/seu-usuario/steamtools.git (push)
```

**2. Branch** — nunca trabalhe direto na `main`; crie uma branch descritiva:

```terminal
$ git checkout -b fix-readme-typo
Switched to a new branch 'fix-readme-typo'
```

**3. Commit** — uma mudança atômica, com mensagem clara:

```terminal
$ git add README.md
$ git commit -m "docs: corrige typo 'recieve' -> 'receive'"
[fix-readme-typo a93f2c1] docs: corrige typo 'recieve' -> 'receive'
 1 file changed, 1 insertion(+), 1 deletion(-)
```

A convenção do Conventional Commits (`docs:`, `fix:`, `feat:`) é adotada por quase todos os projetos e sinaliza que você conhece as regras.

**4. Push** — envia a branch para o seu fork:

```terminal
$ git push origin fix-readme-typo
Enumerating objects: 5, done.
To https://github.com/seu-usuario/steamtools.git
 * [new branch]      fix-readme-typo -> fix-readme-typo
```

**5. Pull request** — no site do GitHub, crie o PR da sua branch para o repositório original, descrevendo o que e por quê.

:::nota
Antes de abrir o PR, leia o arquivo `CONTRIBUTING.md` do projeto. Ele existe justamente para dizer como os mantenedores preferem receber contribuições — se pedem commit assinado com GPG, se exigem teste, se têm um template de PR. Ignorar essas instruções é o caminho mais rápido para um PR ser fechado sem ler.
:::

## A issue que ninguém ignora

Um bom bug report responde, logo de cara, as perguntas que o mantenedor faria. O formato mínimo:

```markdown
**Versão do software**: steamtools 1.4.2
**Distro/ambiente**: SteamOS 3.6 stable, kernel 6.8.0-valve

**O que aconteceu**
Ao rodar `steamtools sync --watch`, o processo trava após ~2 min.

**O que eu esperava**
Sincronização contínua sem travar.

**Passos para reproduzir**
1. Instalar steamtools 1.4.2
2. Rodar `steamtools sync --watch ~/lab`
3. Deixar rodando por 2 minutos
4. O processo para de responder

**Logs**
https://gist.github.com/... (ou colo abaixo)

```

As três partes que fazem a diferença entre "report" e "report útil": **versão exata** (sem "a última"), **passos reproduzíveis** (alguém precisa conseguir chegar ao mesmo estado) e **o que você esperava vs. o que aconteceu** (ajuda a classificar entre bug e comportamento intencional).

```terminal
$ steamtools --version && uname -r
steamtools 1.4.2
6.8.0-valve2-1-neptune-65
```

Estes dois comandos numa linha já fornecem o contexto de versão que 90% dos reports omitem.

## Git avançado para contribuir bem

Duas habilidades de Git que separam o contribuidor ocasional do confiável: **rebase interativo** (para limpar o histórico antes do PR) e **squash** (para juntar commits).

Manter o fork sincronizado com o upstream:

```terminal
$ git remote add upstream https://github.com/exampleorg/steamtools.git
$ git fetch upstream
$ git checkout main
$ git merge upstream/main
$ git push origin main
```

Rebase interativo para reorganizar os commits do seu PR:

```terminal
$ git rebase -i upstream/main
```

Isso abre um editor listando seus commits, onde você pode reordenar, renomear (`reword`), juntar (`squash`) ou descartar (`drop`). Um PR com três commits "wip", "ajustes" e "corrige de novo" vira um commit limpo e atômico — muito mais fácil de revisar, muito mais provável de ser aceito.

:::atencao
O `git rebase -i` reescreve o histórico. Se você já fez `push` da branch e alguém mais trabalhou nela, rebase gera conflito de histórico. Em PR individual, o padrão é seguro: `git push --force-with-lease` depois do rebase, que só sobrescreve se ninguém mudou a branch remota enquanto isso.
:::

## Para onde apontar sua primeira contribuição

No ecossistema SteamOS/Linux, alguns alvos concretos para começar:

- **Gamescope** (github.com/ValveSoftware/gamescope) — o compositor de jogos do SteamOS, com issues marcadas para iniciantes
- **MangoHud** (github.com/flightlessmango/MangoHud) — overlay de desempenho que você usou no capítulo 99
- **Heroic Games Launcher** (github.com/Heroic-Games-Launcher/HeroicGamesLauncher) — tem etiqueta de tradução e documentação
- **Proton** e **ProtonDB** — reportar compatibilidade de jogos é contribuição direta para a comunidade Steam
- **A Wiki do Arch** — o guia de contribuição é aberto e a barreira é baixa; corrigir uma página é um PR de minutos

Comece por aquele que você de fato usa. A familiaridade com o software faz sua contribuição ser naturalmente mais precisa — você reporta um bug com contexto de quem vive o problema, não de quem só leu a issue.

## Resumo

- Contribuir não exige código: reportar bugs, melhorar documentação, traduzir e responder dúvidas são portas sempre abertas.
- Procure issues `good first issue` e `help wanted` nos repositórios que você já usa.
- Fluxo padrão: fork → branch descritiva → commit atômico com Conventional Commits → push → pull request.
- Leia o `CONTRIBUTING.md` antes de abrir qualquer PR; ignorá-lo é o caminho mais curto para a rejeição.
- Um bom bug report traz versão exata, passos reproduzíveis e "esperado vs. acontecido" com logs.
- Use `git rebase -i` para limpar o histórico antes do PR e `git push --force-with-lease` para atualizar a branch com segurança.

## Exercícios

1. Escolha um repositório que você usa (Gamescope, MangoHud, Heroic) e leia o `CONTRIBUTING.md` inteiro. Anote os três pontos que você não esperava encontrar.
2. Encontre uma issue marcada `good first issue` nesse repositório e escreva (num arquivo, sem enviar) o esboço da sua solução: o que mudar, onde, e como testar.
3. Faça um fork de um repositório pequeno qualquer, crie uma branch e faça um commit corrigindo um typo no README. Complete o fluxo até abrir o PR (pode fechá-lo em seguida se preferir).
4. Escreva um bug report completo (formato da seção) sobre um problema real que você já encontrou em algum software no Deck, incluindo versão e passos de reprodução.
5. **Desafio.** Reporte ou resolva de verdade: abra uma issue real num repositório do ecossistema SteamOS, ou envie um PR real corrigindo uma página da Arch Wiki. Compartilhe o link com a comunidade do curso como registro da sua primeira contribuição.