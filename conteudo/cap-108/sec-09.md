Chegamos ao fim do curso, mas não do caminho — este capítulo inteiro foi construído para mostrar que o fim do material é o começo da prática. O que diferencia quem para aqui de quem segue evoluindo não é talento nem sorte: é ter um plano. Esta seção fecha o curso ajudando você a montar um plano pessoal concreto, com metas, um portfólio e uma identidade de aprendizado que continue funcionando quando ninguém estiver te dizendo o que estudar.

:::objetivos
- Transformar o conhecimento do curso num roteiro pessoal de médio prazo
- Montar um portfólio que evidencie o que você sabe fazer
- Entender certificações e credenciais e se elas valem a pena para você
- Definir uma rotina sustentável de prática e estudo autônomo
- Estabelecer o hábito de ensinar o que aprende como motor de consolidação
:::

## O inventário honesto

Antes de planejar para frente, olhe para trás com método. O primeiro exercício do plano é um inventário: para cada grande área do curso, classifique seu domínio entre *consigo usar*, *entro em pânico* e *nem lembro que existia*.

Uma tabela para preencher, no seu `~/lab`:

| Área | Domínio atual | Próxima ação |
|---|---|---|
| Shell e scripts | | |
| systemd e serviços | | |
| Filesystem (LVM/Btrfs) | | |
| Redes e SSH | | |
| Containers | | |
| Segurança | | |
| Virtualização | | |
| Monitoramento | | |

A honestidade aqui é o filtro que evita o autoengano. É comum terminar o curso sabendo *ler* sobre nftables mas travando na hora de escrever uma regra do zero. Anotar "entro em pânico" num item não é fracasso — é informação sobre onde investir a próxima hora de estudo.

:::dica
Um truque para calibrar o inventário: o velho "se eu tivesse que explicar isso para alguém agora, conseguiria?". Se a resposta é "só se eu reler o capítulo", então é "consigo usar" no máximo, não "domino". Ensinar é o teste mais honesto de conhecimento.
:::

## Portfólio: evidência sobre afirmação

No mercado e nas comunidades, o que vale não é a lista de cursos que você fez, mas o que você construiu. Um portfólio técnico tem três formas de evidência, em ordem crescente de valor:

**Um registro escrito** — notas, cheatsheets, guias que você mantém. São úteis para você e demonstráveis para outros. Um blog ou uma coleção de notas públicas (no GitHub Pages, por exemplo) já é portfólio.

**Repositórios de código** — os scripts de automação, o `compose.yaml` do home lab, a ferramenta de linha de comando que você escreveu. Versionados no GitHub, com um README decente, viram prova viva.

**Contribuições aceitas** — um PR mesclado num projeto real (como sugerido na seção 5) vale mais que qualquer repositório próprio. É validação de terceiros: alguém que mantém código avaliou e aceitou o seu.

O ponto em comum dos três: **são públicos e revisáveis**. Um diploma de curso diz "estudou"; um repositório com um PR mesclado diz "fez". Num campo técnico, o "fez" vence.

```terminal
$ mkdir -p ~/portfolio && cd ~/portfolio
$ git init
$ git remote add origin https://github.com/seu-usuario/portfolio.git
$ touch README.md
$ git add . && git commit -m "inicio do portfolio"
$ git push -u origin main
```

Esse diretório é o berço do seu portfólio — comece hoje, adicione a cada projeto terminado, e em um ano você terá um registro que conta sua evolução melhor que qualquer currículo.

Conferir se o portfólio está público e acessível é um comando, não uma esperança:

```terminal
$ git remote get-url origin
https://github.com/seu-usuario/portfolio.git
$ curl -sI https://github.com/seu-usuario/portfolio | head -1
HTTP/2 200
```

Se o `curl` retorna `200`, o mundo pode ver. Se não, é arrumar antes de seguir adiante.

## Certificações: quando valem a pena

As certificações Linux (LPIC, LFCS, RHCSA, CompTIA Linux+) são um investimento de tempo e dinheiro que faz sentido em contextos específicos, e um desperdício noutros. A regra prática: **certificação serve para passar por filtros de contratação**, não para aprender.

- Se você busca emprego em infra/devops e a vaga lista uma certificação como requisito ou diferencial, a **LFCS (Linux Foundation Certified Sysadmin)** ou a **LPIC-1** têm o melhor custo-benefício e são amplamente reconhecidas no Brasil.
- Se você está aprendendo para uso próprio, home lab ou por curiosidade, o dinheiro rende mais investido em um upgrade de hardware (mais RAM, um SSD maior) do que numa prova.
- A **prova prática da LFCS** (mão na massa, num terminal real) é mais honesta que provas de múltipla escolha — e mais alinhada com o que este curso te treinou a fazer.

O conteúdo deste curso cobre a maior parte do currículo da LFCS: filesystem, permissões, systemd, rede, containers, segurança. Se decidir tirar a certificação, o curso é sua base de estudo, não um pré-requisito vencido.

:::nota
Não confunda certificação com empregabilidade. O que abre a primeira porta em muitos casos é o portfólio + a capacidade de resolver o teste técnico da entrevista. A certificação é um reforço de sinal, não o sinal principal. Invista nela depois de ter portfólio, não antes.
:::

## A rotina que sustenta a evolução

Plano sem rotina vira intenção. Uma rotina sustentável de aprendizado autônomo tem três pilares, e todas cabem em poucas horas por semana:

**Cadência semanal fixa.** Reserve um horário fixo (ex.: domingo de manhã, 2h) para mexer no seu projeto ou estudar o próximo capítulo de uma área. A consistência importa mais que a intensidade: 2h toda semana vence 8h num sábado a cada dois meses.

**Um projeto sempre em andamento.** Não deixe o pipeline de projetos esvaziar. Quando terminar um, o início do próximo é o primeiro item da sessão seguinte. É o que mantém a prática contínua, da forma como a seção 1 recomendou.

**Ensinar para consolidar.** A cada coisa que você aprende, produza um artefato: uma nota, um post, uma resposta num fórum, um mini-guia. O exercício de explicar revela as lacunas que a leitura esconde — e fecha essas lacunas de verdade.

```terminal
$ cat ~/lab/rotina.md
Rotina de aprendizado
=====================
- Domingo 09h-11h: projeto em andamento (home lab)
- Quarta 20h-21h: estudo dirigido (área do inventário)
- A cada término: nota pública + 1 contribuição de comunidade
```

Um arquivo desses, revisitado toda semana, é a diferença entre "tenho um plano" e "sigo um plano". A revisão semanal (10 minutos) onde você marca o que avançou e ajusta a próxima sessão é o hábito mais subestimado da disciplina de aprendizado.

## O encerramento

Você não precisa dominar tudo. O curso não termina com você sabendo tudo de Linux — termina com você sabendo **aprender** qualquer coisa de Linux. Essa é a habilidade-mãe por trás de todas as seções: dado um problema, saber onde procurar, como experimentar, como verificar e como perguntar. O resto é aplicação.

Se este curso deixa um único hábito, que seja este: **quando algo não funcionar, abra o terminal e investigue em vez de desistir**. Foi isso que cada capítulo treinou, da leitura do `dmesg` no início à interpretação de métricas no fim. Continue. O sistema está aberto, a documentação está escrita, a comunidade está lá — e agora você tem as chaves das três.

:::dica
Marque esta seção e volte a ela daqui a seis meses. Refaça o inventário da subseção "O inventário honesto" e compare com o de hoje. A distância entre os dois é a medida real do que você aprendeu — e quase sempre é maior do que a sensação do dia a dia sugere.
:::

## Resumo

- Faça um inventário honesto (consigo usar / entro em pânico / nem lembro) antes de planejar o próximo passo.
- Portfólio = evidência pública: notas, repositórios e, acima de tudo, contribuições aceitas valem mais que a lista de cursos.
- Certificação serve para passar por filtros de contratação, não para aprender; a LFCS tem o melhor custo-benefício se esse for seu objetivo.
- Portfólio vem antes da certificação: construa evidência primeiro, sinalize depois.
- Rotina sustentável = cadência fixa + um projeto sempre em andamento + ensinar o que aprende.
- A habilidade-mãe do curso é aprender a aprender Linux; ao terminar, abra o terminal e investigue em vez de desistir.

## Exercícios

1. Preencha o inventário da subseção "O inventário honesto" com as grandes áreas do curso, classificando seu domínio atual com sinceridade.
2. Crie o diretório `~/portfolio`, inicialize um repositório Git e publique-o no GitHub. Adicione um `README.md` descrevendo o que você aprendeu neste curso.
3. Escolha a área do inventário onde você marcou "entro em pânico" e agende (hoje, no seu arquivo de rotina) uma sessão de retomada do capítulo correspondente para a próxima semana.
4. Pesquise o currículo da LFCS (ou LPIC-1) e liste, para cada tópico, qual capítulo deste curso cobre o assunto. Identifique os três tópicos menos cobertos.
5. **Desafio.** Escreva o seu "plano de seis meses": usando inventário + portfólio + rotina, defina uma meta de médio prazo (ex.: um home lab completo, uma certificação, uma contribuição aceita), os marcos mensais e o que você vai ensinar publicamente a cada etapa. Publique o plano no seu portfólio como o documento que encerra este curso.