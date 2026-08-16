O Proton Experimental é o laboratório da Valve. Toda semana ele recebe mudanças que ainda não foram validadas o suficiente para entrar na linha Stable — correções de desempenho, traduções de novas APIs, workarounds para jogos recém-lançados e atualizações do Wine e do DXVK. É nele que você vai quando um jogo novo não funciona na Stable.

:::objetivos
- Entender o propósito do Proton Experimental como canal *bleeding edge*
- Ativar e usar o Experimental para um jogo específico
- Acompanhar o changelog e entender o que mudou entre builds
- Saber quando voltar para a Stable depois de testar
:::

## Por que o Experimental existe

O desenvolvimento do Proton funciona em camadas. Os engenheiros da Valve e colaboradores externos propõem patches que vão primeiro para o Experimental. Se nenhum problema grave aparece depois de algumas semanas de uso público, esses patches são promovidos para a próxima build Stable. Isso permite que a Valve receba feedback de milhares de jogadores sem arriscar quebrar a experiência de todo mundo.

O Experimental também serve como campo de testes para atualizações grandes de componentes internos — como uma nova versão maior do DXVK ou do VKD3D-Proton. Essas trocas podem melhorar o desempenho em 20% num jogo e quebrar outro completamente; o Experimental isola o risco.

```terminal
$ cat ~/.steam/steam/steamapps/common/Proton\ Experimental/version
experimental-9.0.20250317
```

O número `20250317` é a data da build no formato AAAAMMDD — 17 de março de 2025. Isso significa que o Experimental é atualizado com frequência semanal ou até maior durante eventos como a Steam Next Fest, quando dezenas de demos são lançadas de uma vez.

É importante não confundir "bleeding edge" com "instável". O Experimental não é um código sem testes — ele passa pelo CI da Valve e por testes automatizados antes de chegar ao público. A diferença para a Stable é o *volume* de mudanças e a *janela de validação*: enquanto a Stable muda um punhado de coisas a cada dois meses, o Experimental muda muitas coisas toda semana. Isso faz com que a chance de uma regressão — embora baixa — seja maior no Experimental, simplesmente porque mais código novo entra por unidade de tempo.

## Ativando o Experimental para um jogo

O Experimental não é o padrão global — você precisa selecioná-lo manualmente. O caminho mais comum é:

1. Clique com o botão direito no jogo na biblioteca
2. Vá em **Propriedades** → **Compatibilidade**
3. Marque "Forçar o uso de uma ferramenta de compatibilidade"
4. Selecione "Proton Experimental" na lista suspensa

No Steam Deck, o fluxo é o mesmo: botão **Options** (três linhas) sobre o jogo → Properties → Compatibility.

:::nota
A seleção de compatibilidade é **por jogo**, não global. Você pode ter *Baldur's Gate 3* rodando no Experimental enquanto *Hades II* usa a Stable 9.0. O Steam armazena essa preferência no arquivo `config.vdf`, na seção `CompatToolMapping`.
:::

Para listar quais jogos já estão apontados para o Experimental, o mesmo `config.vdf` responde:

```terminal
$ grep -B1 -A3 'proton_experimental' ~/.steam/steam/config/config.vdf
"12900"
{
    "name"        "proton_experimental"
    "config"      ""
    "priority"    "250"
}
```

Cada bloco com `"name" "proton_experimental"` corresponde a um AppID cujo jogo foi configurado para usar o Experimental. É uma forma rápida de auditar, pelo terminal, quais títulos já estão no canal de testes sem abrir a interface gráfica. O campo `priority` com valor `250` indica que foi uma escolha manual — escolhas automáticas do Steam têm prioridade mais baixa, e essa diferença permite identificar quais jogos você deliberadamente migrou para o Experimental.

## Lendo o changelog do Experimental

Toda build do Experimental vem com notas de alteração públicas. Você pode acessá-las pelo GitHub oficial do Proton ou diretamente pelo cliente Steam, na seção de Ferramentas da biblioteca. As notas são técnicas, mas úteis para saber se um problema que você está enfrentando foi resolvido:

```terminal
$ journalctl -u steam --since "10 min ago" | grep -i proton
Mar 18 14:22:07 steamdeck steam[1241]: proton: Updating Proton Experimental to build 20250317
Mar 18 14:22:07 steamdeck steam[1241]: proton: changelog: Fix Cyberpunk 2077 raytracing on AMD GPUs.
Mar 18 14:22:07 steamdeck steam[1241]: proton: changelog: Fix controller hotplug in Elden Ring.
```

O `journalctl` mostra as atualizações que o Steam baixa em segundo plano. As mensagens com `proton: changelog:` são um resumo das mudanças mais relevantes daquela build.

:::dica
Quando um patch novo do Experimental resolve seu problema, você tem duas opções: continuar no Experimental até a próxima Stable absorver a correção (recomendado para jogos em lançamento) ou voltar para a Stable assim que a build com o fix for promovida (recomendado para jogos consolidados).
:::

## Resumo

- O Experimental é o canal *bleeding edge* onde a Valve valida correções antes de promovê-las à Stable.
- Sua numeração usa a data da build (`experimental-9.0.20250317`, AAAAMMDD).
- A seleção é feita por jogo, em Propriedades → Compatibilidade, e gravada no `CompatToolMapping`.
- O `journalctl -u steam` registra atualizações e o resumo do changelog de cada build.
- Após a correção ser absorvida pela Stable, convém voltar o jogo para a linha estável.

## Exercícios

1. Ative o Proton Experimental para um jogo que hoje roda na Stable e lance-o; observe se o comportamento muda.
2. Com o jogo em execução, confirme a versão com `journalctl -u steam --since "2 min ago" | grep -i "launching app"`.
3. Leia o `cat version` do Experimental e traduza a data embutida no número para o formato dia/mês/ano.
4. Acompanhe as atualizações em tempo real com `journalctl -u steam -f` e gere uma atualização (ou aguarde a próxima) para ver as mensagens `proton: changelog:`.
5. **Desafio.** Jogue um título por 30 minutos no Experimental e depois volte para a Stable. Registre se houve diferença de desempenho percebida e, usando o changelog, tente explicar o porquê — ou concluir que não houve mudança relevante.