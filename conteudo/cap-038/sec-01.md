O Proton é a camada que faz jogos de Windows rodarem no SteamOS sem que você precise configurar nada — mas ele não é uma peça única. Existem várias versões do Proton disponíveis no Steam Deck e em qualquer instalação do SteamOS, cada uma com um propósito diferente: estabilidade, novidades, compatibilidade comunitária ou correção urgente. Saber qual versão escolher para cada jogo é uma das habilidades mais práticas do dia a dia com o SteamOS.

:::objetivos
- Identificar as quatro famílias principais do Proton: Stable, Experimental, GE e Hotfix
- Entender o ciclo de releases numeradas e o que significam os números de versão
- Listar as versões instaladas no seu sistema com comandos de terminal
- Saber quando usar cada família e como trocar entre elas
:::

## O que é o Proton e por que ele tem versões

O Proton é um fork do Wine mantido pela Valve com patches específicos para jogos, integrado ao Steam Play. Ele traduz chamadas da API do Windows (Direct3D, XInput, etc.) para APIs nativas do Linux (Vulkan, SDL) em tempo real. A tradução não é trivial: cada jogo faz coisas diferentes, e um patch que melhora o desempenho de *Elden Ring* pode quebrar *Cyberpunk 2077*.

Por isso o Proton não segue o modelo "uma versão para todos". A Valve mantém ramificações paralelas: versões estáveis numeradas para o público geral, uma versão *bleeding edge* chamada Experimental, e ainda aceita que a comunidade distribua forks como o GE. O Hotfix, por sua vez, é uma versão pontual que resolve uma regressão específica sem esperar o ciclo normal de release.

```terminal
$ ls ~/.steam/steam/steamapps/common/ | grep Proton
Proton 8.0
Proton 9.0
Proton Experimental
Proton Hotfix
```

A saída acima mostra quatro pastas típicas de uma instalação do SteamOS. Cada pasta contém um `proton` binário, as bibliotecas Wine traduzidas e um arquivo `version` que identifica exatamente qual build está em uso.

Por que existir mais de uma versão ao mesmo tempo, ocupando dezenas de megabytes cada? A resposta é **isolamento**. Se existisse uma única versão, qualquer correção para um jogo teria o potencial de quebrar todos os outros. Ao manter várias versões instaladas lado a lado, o Steam permite que cada jogo seja ancorado numa versão que sabidamente funciona, enquanto outros jogos migram para versões mais novas em seu próprio ritmo. O custo é espaço em disco; o benefício é que um patch ruim para *um* jogo não derruba a biblioteca inteira.

:::exemplo
Um caso real de isolamento: em março de 2025, um patch do Proton 9.0-4 introduziu um problema de shader em *Elden Ring* em GPUs RDNA2. Quem estava na 9.0-3 e não atualizou não viu o problema. Quem deixou o Steam atualizar automaticamente para a 9.0-4 passou a ter artefatos. A Valve publicou um Hotfix em menos de 24 horas, mas quem tinha a 8.0 como fallback sequer percebeu — pôde continuar jogando na versão antiga enquanto a correção chegava. Isso é isolamento na prática.
:::

## As quatro famílias em resumo

Antes de mergulhar nos detalhes de cada uma, vale fixar o papel de cada família:

| Família | Propósito | Atualização |
|---|---|---|
| **Proton Stable** (8.0, 9.0) | Uso diário, testado pela Valve | A cada 2–4 meses |
| **Proton Experimental** | Testar correções antes de promovê-las a Stable | Semanal |
| **Proton GE** (GloriousEggroll) | Patches da comunidade, codecs patenteados | Sob demanda |
| **Proton Hotfix** | Corrigir uma regressão urgente em um jogo específico | Pontual, temporário |

:::dica
Se você está começando agora, use sempre a versão Stable mais recente (hoje, Proton 9.0). As outras famílias existem para resolver problemas específicos — não são "melhores" que a Stable, apenas diferentes.
:::

## Onde o Proton mora no disco

O Steam armazena as versões oficiais dentro da própria instalação. O diretório principal de cada versão contém o binário `proton`, as bibliotecas Wine compiladas, e os metadados que o Steam usa para reconhecer a ferramenta:

```terminal
$ ls -la ~/.steam/steam/steamapps/common/Proton\ 9.0/
total 8
drwxr-xr-x  5 deck deck  150 Oct  3 14:22 .
drwxr-xr-x 12 deck deck  280 Nov 15 09:41 ..
-rw-r--r--  1 deck deck 1216 Oct  3 14:22 compatibilitytool.vdf
drwxr-xr-x  2 deck deck  120 Oct  3 14:22 dist
drwxr-xr-x  3 deck deck   60 Oct  3 14:22 files
-rw-r--r--  1 deck deck   23 Oct  3 14:22 version
```

O arquivo `compatibilitytool.vdf` é o que registra essa versão como uma ferramenta de compatibilidade disponível no menu do Steam. Já as versões instaladas manualmente, como o Proton GE, ficam em outro diretório:

```terminal
$ ls ~/.steam/steam/compatibilitytools.d/
GE-Proton9-23
```

A separação é importante: o Steam nunca sobrescreve o que está em `compatibilitytools.d`, então suas versões GE sobrevivem a atualizações do cliente.

É útil distinguir também os dois papéis que o Proton desempenha. Por um lado, ele é uma **camada de compatibilidade**: transforma chamadas de Windows em equivalentes do Linux. Por outro, ele é um **componente do Steam Play**: é o Steam que decide, jogo a jogo, qual versão usar, baseado na sua configuração. As duas coisas se separam quando você percebe que você pode ter o Proton 9.0 instalado sem nunca usá-lo — a instalação é uma coisa, a seleção é outra. É por isso que o mesmo jogo pode mudar de comportamento apenas mudando a versão selecionada, sem reinstalar nada.

## Resumo

- O Proton é um fork do Wine mantido pela Valve, integrado ao Steam Play, que traduz APIs do Windows para o Linux.
- Existem quatro famílias: Stable (numerada), Experimental (bleeding edge), GE (comunitário) e Hotfix (urgente).
- A Stable cobre a maioria dos casos; as demais resolvem problemas específicos, não são "melhores".
- As versões oficiais ficam em `steamapps/common/` e as manuais em `compatibilitytools.d/`.
- O arquivo `version` dentro de cada pasta identifica a build exata instalada.

## Exercícios

1. Rode `ls ~/.steam/steam/steamapps/common/ | grep Proton` e anote quais famílias estão instaladas na sua máquina.
2. Para cada pasta `Proton*`, leia o `cat version` e classifique cada versão numa das quatro famílias.
3. Verifique se você tem o diretório `~/.steam/steam/compatibilitytools.d` e liste o conteúdo — há alguma versão GE instalada?
4. Abra o `compatibilitytool.vdf` de uma das versões e identifique o nome interno da ferramenta.
5. **Desafio.** Sem abrir a interface gráfica, use apenas `cat version` e o nome das pastas para escrever uma frase explicando qual das quatro famílias é a mais antiga e como você chegou a essa conclusão.