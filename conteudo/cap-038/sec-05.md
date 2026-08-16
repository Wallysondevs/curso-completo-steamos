O Proton Hotfix é a versão "bombeiro" do Proton: uma build pontual e temporária que corrige uma regressão urgente em um jogo específico, publicada entre os ciclos normais da Stable. Ela existe para você não precisar esperar semanas pela próxima versão numerada quando um patch recém-lançado quebra um título popular.

:::objetivos
- Entender o que distingue o Hotfix da Stable e da Experimental
- Identificar quando uma regressão justifica o uso do Hotfix
- Localizar e interpretar o identificador da build Hotfix
- Saber por que o Hotfix é temporário e como ele é descontinuado
:::

## O que é uma regressão

Uma **regressão** é quando um software que funcionava volta a quebrar depois de uma atualização. No contexto do Proton, acontece assim: a Valve publica uma nova build Stable ou Experimental, e algum jogo que rodava bem passa a travar na tela de carregamento, exibir artefatos gráficos ou nem abrir. A causa quase sempre é uma mudança em alguma biblioteca interna que tinha um efeito colateral imprevisto naquele jogo.

Quando a regressão afeta um jogo muito popular — ou vários jogos ao mesmo tempo — a Valve acelera uma correção e a distribui como Hotfix, em vez de esperar o ciclo normal de meses.

```terminal
$ cat ~/.steam/steam/steamapps/common/Proton\ Hotfix/version
hotfix-20250314-eldenring
```

Repare no formato do identificador: a data da build (`20250314`) seguida de um rótulo que aponta o alvo (`eldenring`). O Hotfix é construído para resolver um problema concreto e identificável, não para trazer melhorias gerais.

## Quando recorrer ao Hotfix

O Hotfix não é algo que você escolhe proativamente. Ele aparece no menu de compatibilidade apenas quando existe uma regressão ativa e a Valve já publicou a correção. O fluxo realista é:

1. Um jogo para de funcionar após um update do Proton
2. Você verifica os fóruns ou o changelog e descobre que é uma regressão conhecida
3. A Valve publica um Hotfix direcionado
4. Você seleciona "Proton Hotfix" nas Propriedades → Compatibilidade do jogo

Antes de mexer, confirme que a versão Hotfix está de fato instalada e disponível:

```terminal
$ ls -d ~/.steam/steam/steamapps/common/Proton\ Hotfix 2>/dev/null && cat ~/.steam/steam/steamapps/common/Proton\ Hotfix/version
hotfix-20250314-eldenring
```

O `ls -d` com `2>/dev/null` silencia o erro caso a pasta não exista — se nada for impresso, é porque o Steam ainda não baixou o Hotfix para o problema que você está enfrentando.

:::atencao
Não mantenha o Hotfix depois de o problema ser corrigido. A build Hotfix é frequentemente uma versão da Stable com um único patch revertido — e pode carregar outros artefatos. Assim que a próxima Stable absorver a correção (o que costuma levar de semanas a um par de meses), volte o jogo para a Stable.
:::

## Acompanhando o ciclo de um Hotfix

O `journalctl` registra quando o Steam baixa um Hotfix, o que ajuda a entender o que está acontecendo em segundo plano mesmo sem abrir o cliente:

```terminal
$ journalctl -u steam --since "30 min ago" | grep -i -E "hotfix|regress"
Mar 18 09:12:44 steamdeck steam[984]: proton: Applying Hotfix for Elden Ring (shader regression on RDNA2).
Mar 18 09:12:44 steamdeck steam[984]: proton: This Hotfix backports the revert of a DXVK change.
```

A segunda linha é reveladora: o Hotfix faz um *backport*, ou seja, pega uma versão anterior de um componente interno e a aplica sobre a build atual, revertendo o trecho que causou o problema, sem desfazer as demais melhorias.

Na prática, um Hotfix é uma "cirurgia de emergência": ele abre a build Stable atual, localiza o commit problemático (geralmente no DXVK ou no VKD3D), reverte apenas ele, re-empacota e publica. O resto da build — incluindo correções de segurança e melhorias para outros jogos — permanece igual. É exatamente por ser tão cirúrgico que o Hotfix não deve ser mantido por mais tempo que o necessário: uma vez que o commit original é corrigido e republicado na Stable, o Hotfix se torna redundante e pode até conter uma versão ligeiramente inferior de outros componentes.

:::info
O Proton Hotfix é relativamente novo no ecossistema da Valve — foi introduzido para dar agilidade à resposta a regressões sem desestabilizar a linha Stable. Antes dele, a Valve acumulava correções urgentes e as liberava só na próxima build mensal, deixando os jogadores afetados sem alternativa a não ser o Experimental ou o GE.

Uma consequência prática do Hotfix ser pontual: ele não tem ciclo de atualização próprio. Diferente da Stable, que ganha builds regulares, o Hotfix é publicado uma única vez para um problema e depois fica congelado até ser absorvido ou removido. Isso reforça a regra de não deixá-lo selecionado indefinidamente — um jogo preso num Hotfix antigo pode, ironicamente, começar a apresentar incompatibilidades quando o Steam e os drivers evoluírem ao redor dele.
:::

## Resumo

- O Hotfix é uma build pontual e temporária que corrige uma regressão urgente em um jogo específico.
- Uma regressão é quando um jogo que funcionava volta a quebrar após um update do Proton.
- O identificador da build traz data e alvo (`hotfix-20250314-eldenring`).
- O Hotfix faz *backport*, revertendo o trecho que causou o problema sem desfazer outras melhorias.
- Ele deve ser abandonado assim que a correção for absorvida pela Stable.

## Exercícios

1. Leia o `version` do Proton Hotfix (se instalado) e traduza a data e o alvo embutidos no identificador.
2. Procure no `journalctl -u steam` mensagens com `hotfix` ou `regress` e explique o que cada uma indica.
3. Escolha um jogo seu que teve regressão histórica e pesquise, no changelog do Proton, em qual build a correção entrou.
4. Liste todas as versões instaladas e identifique quais são temporárias (Hotfix) em oposição às permanentes.
5. **Desafio.** Simule o ciclo completo: configure um jogo para o Hotfix, jogue por um tempo, e depois migre-o de volta para a Stable. Documente em que momento da "escada" você poderia abandonar o Hotfix com segurança.