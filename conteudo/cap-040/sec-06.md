O arranjo mais precioso do Proton no SteamOS é a escolha **por jogo**: você mantém o Proton oficial como padrão e só aponta o Proton-GE para os títulos que realmente precisam dele. Isso te dá precisão cirúrgica — um jogo quebrado por causa de codec ganha o GE, enquanto os demais continuam no oficial, estável e sem surpresas.

Esta seção mostra como forçar uma build (GE ou qualquer outra) para um único jogo, como confirmar que a escolha pegou e como lidar com as duas armadilhas mais comuns desse caminho.

:::objetivos
- Forçar uma build específica de Proton para um único jogo
- Entender a precedência da escolha individual sobre o padrão global
- Confirmar pela interface e pelo disco qual versão está ativa por jogo
- Desfazer uma escolha individual e voltar ao padrão
:::

## Onde a escolha individual mora

A configuração por jogo não fica nas Configurações globais — fica nas **Propriedades** de cada título. Clique com o botão direito (ou com o trackpad esquerdo, no Deck) sobre o jogo na biblioteca, escolha **Propriedades**, e abra a aba **Compatibilidade**.

Ali há um interruptor chamado **"Forçar o uso de uma ferramenta de compatibilidade específica do Steam Play"**. Ele vem desligado para a maioria dos jogos, o que significa "use o padrão global". Ao ligá-lo, aparece a lista suspensa com todas as builds disponíveis — a mesma lista que você viu no padrão global.

Selecione a build desejada, por exemplo `GE-Proton9-25`. O efeito é imediato para aquele jogo, sem precisar reiniciar o Steam inteiro (apenas feche o jogo se ele estiver aberto e o reabra).

## A regra de precedência em ação

O menu de Compatibilidade por jogo encarna a hierarquia que você conheceu: a escolha individual **vence** o padrão global. Isso significa três estados possíveis para cada jogo:

| Estado | Interruptor | Resultado |
|---|---|---|
| Usa o padrão | Desligado | Segue o campo "Executar outros títulos com" |
| Forçado a uma build | Ligado + versão escolhida | Usa essa build, ignorando o padrão |
| Nativo Linux | — | Roda sem Proton, exibe "versão nativa" |

Essa tabela é a resposta para a dúvida recorrente "mudei o padrão mas esse jogo não mudou": provavelmente ele tem o interruptor ligado com uma versão explícita.

:::dica
Você pode ter dezenas de jogos configurados individualmente sem se perder. O interruptor fica visível na aba Compatibilidade e, com a versão escolhida ao lado, funciona como um lembrete visível do que cada um está usando.
:::

## Confirmando que a escolha pegou

Depois de forçar a build, rode o jogo uma vez e confirme pelo log qual Proton ele usou de fato. O caminho na linha de execução não mente:

```terminal
$ grep -i 'proton' ~/.local/share/Steam/logs/console-linux.txt | tail -5
GameAction [AppID 1234567, ActionID 1] : LaunchApp changed task to ProcessingInstallScript with ""
/bin/sh -c /home/deck/.steam/steam/compatibilitytools.d/GE-Proton9-25/proton run /home/deck/.local/share/Steam/steamapps/common/MyGame/MyGame.exe
```

O trecho `GE-Proton9-25/proton run` confirma que foi a build forçada. Compare com um jogo sem configuração individual, cujo log mostrará o caminho da build padrão global — essa diferença nos logs é a prova visível da precedência.

## Desfazendo ou trocando a escolha

Reverter é desligar o interruptor **"Forçar o uso de..."** na aba Compatibilidade — o jogo volta a seguir o padrão global. Se quiser apenas trocar para outra build, deixe o interruptor ligado e mude a seleção na lista.

Um detalhe que confunde: desligar o interruptor **não desinstala** a build GE do disco. A build continua em `compatibilitytools.d`, disponível para outros jogos e para o padrão global. Removê-la de verdade é assunto da seção sobre desinstalação.

```terminal
$ ls -1 ~/.steam/steam/compatibilitytools.d/
GE-Proton9-25
```

A pasta segue ali depois de você desligar o interruptor do jogo — e é exatamente isso que permite reutilizá-la em outro título sem baixar de novo.

## Um fluxo de decisão rápido

Para não virar um ciclo de tentativa e erro infinito, siga esta ordem quando um jogo der problema:

1. Rode no padrão oficial e observe o sintoma (vídeo preto? crash? não inicia?).
2. Olhe o log por sinais de codec (`mfplat`, `winegstreamer`).
3. Se parecer codec ou jogo muito recente, force o GE **só nesse jogo**.
4. Teste. Se resolveu, mantenha; se não, desligue o interruptor e investigue driver/GPU.

Esse fluxo mantém sua biblioteca limpa e sua cabeça tranquila — você nunca "suja" a configuração global por causa de um único título.

:::atencao
Alguns jogos com anticheat (especialmente de nível kernel ou de servidores competitivos) podem se comportar diferente ou não inicializar sob builds alternativas. Se um jogo online parar de funcionar após forçar o GE, desligue o interruptor e volte ao Proton oficial antes de concluir qualquer outra coisa.
:::

## Resumo

- A escolha por jogo fica em **Propriedades → Compatibilidade**, no interruptor "Forçar o uso de...".
- O interruptor desligado significa "usa o padrão global"; ligado com versão escolhida, sobrescreve o padrão.
- Jogos nativos Linux não passam por Proton algum.
- `grep -i proton console-linux.txt` revela o caminho da build usada, provando qual venceu.
- Desligar o interruptor não remove a build do disco; ela continua disponível para outros jogos.
- Antes de forçar GE, confirme pelo log se o problema é mesmo de codec ou recência.

## Exercícios

1. Escolha um jogo de Windows que hoje use o padrão global e force nele a build `GE-Proton9-25` pela aba Compatibilidade.
2. Rode o jogo e confirme, via `console-linux.txt`, que agora ele usa `GE-Proton9-25`. Registre a linha exata do log.
3. Compare o log desse jogo com o de um jogo sem configuração individual e mostre por que um aponta para o GE e o outro para o padrão.
4. Desligue o interruptor do primeiro jogo e verifique (com `ls`) que a build GE continua presente no disco. Reflita sobre o que isso significa.
5. **Desafio.** Crie uma tabela com três dos seus jogos: um forçado ao GE, um seguindo o padrão e um nativo Linux. Valide cada linha pelo log de execução e explique, para cada um, qual regra de precedência determinou a escolha.
