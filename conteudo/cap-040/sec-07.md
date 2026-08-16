Uma build GE não é algo que você instala uma vez e esquece para sempre. O Proton avança rápido — a Valve lança updates constantes, e o GloriousEggroll acompanha com releases novas numa cadência semelhante. Deixar de atualizar significa rodar jogos recém-lançados com correções antigas, justamente onde o GE costuma fazer mais diferença. Esta seção trata de manter suas builds em dia.

Atualizar aqui não tem o mecanismo automático de um pacote de sistema: o ProtonUp-Qt não roda em segundo plano baixando novidades. A atualização é uma **ação consciente**, que troca uma build por uma mais nova — e exige uma decisão sobre o que fazer com a antiga.

:::objetivos
- Atualizar uma build GE para uma versão mais recente
- Entender que atualizar instala uma build nova, sem remover a antiga automaticamente
- Reapontar jogos e o padrão global para a nova versão
- Reconhecer quando voltar a uma versão anterior é a saída
:::

## Atualizar é baixar de novo

Não existe "patch" incremental numa build GE. Cada release é um pacote completo e autocontido — atualizar significa **baixar a build nova e instalá-la ao lado da antiga**. É o mesmo fluxo do download que você fez antes, com uma consequência importante: a versão velha continua no disco até você removê-la.

Abra o ProtonUp-Qt, clique em **Add version**, e escolha a versão mais recente da linha (por exemplo, de `GE-Proton9-25` para `GE-Proton9-27`). Depois do download, o diretório passa a ter as duas:

```terminal
$ ls -1 ~/.steam/steam/compatibilitytools.d/
GE-Proton9-25
GE-Proton9-27
```

A build nova está pronta para uso imediato. A antiga segue funcional e disponível nos menus de compatibilidade — o que é, na verdade, uma rede de segurança valiosa, como você verá.

## Reapontando jogos e o padrão

O ProtonUp-Qt instala a build nova, mas **não toca nas suas configurações**. Jogos forçados a `GE-Proton9-25` continuam apontando para ela, e o padrão global também. Cabe a você decidir migrar.

Para o padrão global, é só trocar a seleção em **Configurações → Compatibilidade**. Para jogos com escolha individual, entre em **Propriedades → Compatibilidade** e mude a versão — um por um, ou apenas nos que você quer migrar. Essa distinção é o que permite um padrão híbrido: alguns jogos ficam na versão antiga que funciona, outros migram para a nova.

:::dica
Se você quer migrar vários jogos de uma vez, não há atalho nativo no Steam — a seleção é individual. Mas como a build antiga continua instalada, você pode migrar com calma, testando cada jogo na nova antes de consolidar.
:::

## Testando antes de consolidar

A boa prática é nunca apagar a build velha no mesmo dia em que baixa a nova. Use a nova por um tempo, em alguns jogos, e observe. O Proton pode sofrer regressões: uma versão corrige um jogo e, por acidente, quebra outro que estava perfeito.

O teste concreto é forçar a build nova em um jogo problemático e ver o resultado, mantendo a antiga intacta:

```terminal
$ grep -i 'proton' ~/.local/share/Steam/logs/console-linux.txt | tail -3
/bin/sh -c /home/deck/.steam/steam/compatibilitytools.d/GE-Proton9-27/proton run /home/deck/.local/share/Steam/steamapps/common/MyGame/MyGame.exe
```

O log mostra `GE-Proton9-27` rodando — e, se algo quebrar, você simplesmente volta a seleção do jogo para `GE-Proton9-25` em dois cliques. Por isso manter duas versões durante a transição é recomendado, e não um desperdício.

## Quando voltar a uma versão anterior

Regressões são raras, mas reais. Se um jogo funcionava em `GE-Proton9-25` e parou em `GE-Proton9-27`, a resposta correta é **voltar** a seleção para a antiga e aguardar um release que corrija o problema — não insistir na nova.

Veja o fluxo completo de uma regressão típica:

- Você migra um jogo para `GE-Proton9-27`.
- O jogo passa a travar na abertura ou a perder vídeo.
- Você desfaz a seleção, retornando para `GE-Proton9-25`.
- O jogo volta a funcionar como antes.
- Você acompanha as notas de release para saber quando a correção chegar.

Nada disso exige desinstalar qualquer coisa: as duas builds convivem, e a troca é só de ponteiro na config do jogo.

:::info
As notas de mudanças (changelog) de cada release GE estão no [repositório do Proton-GE](https://github.com/GloriousEggroll/proton-ge-custom/releases) no GitHub. O ProtonUp-Qt também exibe um resumo ao selecionar a versão — vale ler antes de atualizar, sobretudo as menções a codecs e regressões conhecidas.
:::

## Resumo

- Builds GE não têm patch incremental; atualizar é baixar uma release nova completa ao lado da antiga.
- O ProtonUp-Qt instala a versão nova mas não altera suas configurações de jogo nem o padrão global.
- Reapontar o padrão e os jogos para a nova build é uma ação manual e consciente.
- Manter a versão antiga durante a transição é recomendado; ela é sua rede de segurança.
- Regressões existem: voltar a seleção para a versão anterior é a solução correta, sem desinstalar nada.
- O changelog no GitHub (ou no app) informa correções e regressões antes de você atualizar.

## Exercícios

1. No ProtonUp-Qt, verifique qual é a versão GE mais recente disponível e compare com a que você tem instalada (`ls ~/.steam/steam/compatibilitytools.d/`).
2. Baixe a versão mais nova e confirme, com `ls`, que agora há pelo menos duas builds GE convivendo no disco.
3. Migre **um** jogo para a build nova pela aba Compatibilidade e rode-o, confirmando pelo log `console-linux.txt` que ele passou a usar a nova versão.
4. Leia as notas de release da build nova no GitHub e resuma em uma frase o que mudou de relevante (codecs, DXVK, correções).
5. **Desafio.** Simule uma regressão: mantenha as duas builds instaladas e alterne um jogo entre a antiga e a nova três vezes, registrando no log a mudança de versão a cada tentativa. Depois explique por que isso tudo foi possível sem nenhum download adicional.
