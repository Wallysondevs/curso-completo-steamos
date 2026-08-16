Agora que você conhece as quatro famílias, a pergunta que importa é prática: qual versão do Proton selecionar para um jogo específico? A resposta segue uma regra de precedência simples — começando sempre pela Stable e só subindo de grau quando há um problema concreto.

:::objetivos
- Aplicar a regra de precedência na escolha do Proton para um jogo
- Alterar a versão do Proton nas propriedades de compatibilidade
- Verificar qual versão está de fato rodando para um jogo
- Identificar sinais de que a versão errada está em uso
:::

## A regra de precedência

Existe uma ordem lógica para escolher. Comece pela base e só avance quando tiver um motivo:

1. **Proton Stable** — sempre a primeira tentativa. Cobre a vasta maioria dos jogos verificados e jogáveis.
2. **Proton Experimental** — quando o jogo é recém-lançado, usa uma API nova, ou a Stable tem um bug conhecido para ele.
3. **Proton Hotfix** — quando existe uma regressão específica já reconhecida pela Valve.
4. **Proton GE** — quando nada acima funciona e o problema é codec patenteado, vídeo quebrado ou patch comunitário específico.

A regra de ouro: **não troque de versão sem um sintoma**. Se o jogo roda bem na Stable, deixe na Stable. Cada família mais "avançada" troca estabilidade por novidade, e você só quer pagar esse preço quando compensa.

Existe uma nuance importante nessa ordem: o Hotfix e o GE não competem entre si. O Hotfix resolve *um* problema reconhecido pela Valve e nada além disso; o GE é um pacote amplo de melhorias da comunidade. Você não escolhe entre os dois por preferência, mas por diagnóstico: se há uma regressão oficialmente reconhecida, o Hotfix é o alvo certo; se o problema é obscuro e específico da comunidade (como um codec patenteado), o GE é o caminho. A ordem da lista reflete não só a estabilidade, mas o grau de especificidade da correção que cada um oferece.

:::exemplo
*Persona 3 Reload* sai hoje. Na Stable 9.0 ele abre, mas os vídeos da abertura ficam pretos (codec). Você sobe para o GE, que resolve o vídeo. Um mês depois, a Valve lança um patch no Experimental que também resolve; você migra para o Experimental. Quando a Stable absorver tudo, você volta para ela. Essa escadinha ilustra o fluxo completo de decisão.
:::

## Alterando a versão para um jogo

A troca acontece sempre na mesma tela, independente de qual versão você escolheu:

1. Clique com o botão direito no jogo → **Propriedades**
2. Aba **Compatibilidade**
3. Marque **"Forçar o uso de uma ferramenta específica de compatibilidade"**
4. Selecione a versão desejada

No Steam Deck, o caminho é o menu **Options** (botão com três linhas) do controle → Properties → Compatibility, com o mesmo comportamento.

O Steam grava essa escolha por jogo no `config.vdf`, na seção `CompatToolMapping`:

```terminal
$ grep -A3 CompatToolMapping ~/.steam/steam/config/config.vdf
"CompatToolMapping"
{
    "438100"
    {
        "name"        "proton_experimental"
        "config"      ""
        "priority"    "250"
    }
}
```

O número `438100` é o AppID do jogo (neste exemplo, *Borderlands 2*), e `proton_experimental` é o nome interno da ferramenta escolhida. O campo `priority` define a ordem quando mais de uma ferramenta poderia se aplicar.

## Confirmando a versão em uso

Nem sempre o menu mostra o que está rodando de fato — por exemplo, se um launcher ou um script intermediou o processo. Para confirmar, consulte os logs do Steam filtrados pelo AppID:

```terminal
$ journalctl -u steam --since "5 min ago" | grep -i "438100"
Mar 18 14:30:11 steamdeck steam[984]: GameAction [AppID 438100, ActionID 1] : LaunchApp changed task to StartingVR with ""
Mar 18 14:30:12 steamdeck steam[984]: proton: Launching app 438100 with proton_experimental
```

A linha `Launching app ... with proton_experimental` é a confirmação definitiva de qual versão está sendo usada naquele processo de inicialização.

Se você quer auditar todos os jogos e as ferramentas que eles usam de uma só vez, extraia os pares AppID → ferramenta do `config.vdf`:

```terminal
$ grep -E '"[0-9]{5,}"|"name"' ~/.steam/steam/config/config.vdf | grep -A1 -E '"[0-9]{5,}"' | head -12
"12900"
    "name"        "proton_experimental"
"438100"
    "name"        "proton_9.0"
"570"
    "name"        "proton_9.0"
```

O `grep` primeiro captura as linhas de AppID (números com cinco dígitos ou mais) e as linhas `name`, depois exibe cada AppID junto da ferramenta associada. O resultado é um mapa rápido de qual versão cada jogo está usando, sem navegar menu por menu.

:::atencao
Mudar a versão do Proton para um jogo **reinicia o processo de criação do prefixo Wine** se a versão for de uma família diferente. O Steam pode mostrar "Preparando para iniciar o jogo" por mais tempo, e a primeira execução após a troca costuma recompilar shaders (o cache de Vulkan precisa ser reconstruído). Isso é esperado, não é bug.
:::

## Resumo

- A regra de precedência é: Stable → Experimental → Hotfix → GE, subindo apenas com um sintoma concreto.
- Não se troca de versão sem motivo; cada família mais avançada troca estabilidade por novidade.
- A troca é feita em Propriedades → Compatibilidade e gravada no `CompatToolMapping` do `config.vdf`.
- O `journalctl` mostra a linha `Launching app ... with <tool>` que confirma a versão real em uso.
- Trocar de família pode recriar o prefixo Wine e recompilar shaders na primeira execução.

## Exercícios

1. Escolha um jogo e verifique, no `config.vdf`, qual versão está mapeada para o AppID dele.
2. Mude a compatibilidade de um jogo para uma versão diferente e confirme a troca com `grep -A3 CompatToolMapping`.
3. Lance o jogo e capture a linha `Launching app ... with` no `journalctl` para validar a versão ativa.
4. Monte a "escadinha" de decisão da seção em um texto curto, aplicando-a a um jogo real do seu catálogo.
5. **Desafio.** Encontre um jogo que funcione na Stable, um que precise de Experimental e (se tiver) um que só rode no GE. Documente a regra de precedência aplicada a cada caso, comprovando suas escolhas com logs.