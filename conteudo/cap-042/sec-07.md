Cada problema de Proton resolvido nas seções anteriores envolvia mexer em uma peça por vez: versão do Proton, runtime, codec, variável de ambiente. Mas boa parte dos problemas **já está catalogada**. Os bancos comunitários ProtonDB e o rastreador de bugs do Proton no GitHub são os dois instrumentos de navegação que transformam horas de tentativa-e-erro em uma consulta rápida antes de instalar. Saber lê-los é um multiplicador de eficiência.

:::objetivos
- Interpretar os ratings do ProtonDB (Platinum, Gold, Silver, Bronze, Borked)
- Ler e contribuir relatórios de usuários do ProtonDB
- Navegar o rastreador de issues do Proton no GitHub
- Filtrar problemas por versão de Proton e hardware
- Conciliar relatórios contraditórios sobre o mesmo título
:::

## ProtonDB: o que a comunidade já descobriu

ProtonDB (protondb.com) é um agregador comunitário que cruza dados da Steam com relatórios de usuários. Cada jogo ganha um selo de status — Platinum (funciona perfeitamente), Gold (funciona com ajustes), Silver (funciona com problemas), Bronze (roda mas é ingrato), Borked (nem abre). Esses selos são calculados a partir de relatórios recentes, ponderados por data e utilidade.

A leitura de um relatório não é binária. Veja o que extrair de cada entrada:

- **Versão do Proton** usada (se o relatório diz que "Silver com Proton 7.0" e você usa o 9.0 o dado pode estar obsoleto).
- **Hardware** do relator — um relatório "Platinum" num desktop com NVIDIA RTX 4090 pode não refletir a APU do Deck.
- **Tweaks descritos**: flags de launch, `protontricks`, parâmetros de inicialização.
- **Data do relatório**: quanto mais recente, mais relevante.

:::dica
Crie o hábito de abrir o ProtonDB **antes** de comprar um jogo novo, especialmente no Deck. A informação sobre anticheat (EAC/BattlEye) e compatibilidade com a APU AMD Van Gogh poupa arrependimento e pedido de reembolso.
:::

## Lendo um relatório com olho crítico

Um relatório típico no ProtonDB contém uma estrutura que você deve avaliar em camadas. O exemplo abaixo é uma reprodução do que você encontra na página de um título:

> **Proton 9.0-2 | Steam Deck OLED | Gold**
> Game runs at stable 40 FPS after setting shadow quality to Low. No crashes in 15 hours.
> Needed `PROTON_NO_ESYNC=1` on launch otherwise freeze on startup.

Esse relatório ensina três coisas: o título funciona (Gold), o ajuste crítico é `PROTON_NO_ESYNC=1`, e a versão testada é a 9.0-2. A utilidade depende da data: um relatório de 2023 com Proton 7.0 pode já ser história, mas o tweak de `ESYNC` provavelmente ainda se aplica.

Para jogos com muitos relatórios, filtre pela aba **Steam Deck** (não qualquer Linux) e leia os 5 mais recentes. Em títulos com poucos relatórios, leia todos e procure um padrão: se três relatórios mencionam "tela preta no primeiro launch resolvida esperando 2 minutos", o padrão é real e você ganhou 120 segundos de paciência.

## O que fazer quando os relatórios se contradizem

Não é raro ver um relatório "Platinum — roda perfeito" ao lado de um "Borked — nem abre" para o mesmo título. A contradição quase sempre tem explicação:

- **Versão de Proton diferente** entre os dois.
- **Steam Deck LCD vs OLED**: componentes internos idênticos, mas versões de firmware e BIOS podem divergir.
- **Proton GE vs oficial**: um usa codecs patenteados, o outro não.
- **Prefixos antigos**: quem arrastou o prefixo de uma versão beta do Proton pode carregar lixo que um prefixo limpo não teria.
- **Atualização do jogo**: o dev lançou patch que quebrou (ou consertou) a compatibilidade.

Sua ferramenta para resolver contradições é testar com prefixo limpo e a versão de Proton mais recente possível, usando os tweaks que o relatório mais recente e específico recomendar.

## Issues do Proton no GitHub

Além do ProtonDB, o rastreador oficial de bugs do Proton fica em `github.com/ValveSoftware/Proton/issues`. É o lugar onde os desenvolvedores da Valve e da comunidade debatem bugs confirmados. Para seu uso como diagnosticador, interessa:

```terminal
## Traduzindo os rótulos mais importantes
| Rótulo | Significado |
|---|---|
| `Game compatibility` | Bug de compatibilidade com título específico |
| `Regression` | Algo que funcionava e quebrou numa versão nova |
| `Fixed in next` | Corrigido na branch de desenvolvimento |
| `Needs investigation` | Ainda não confirmado pela Valve |
```

A busca no GitHub funciona com `is:issue is:open <nome-do-jogo>`, e filtrar por `sort:updated` mostra os mais recentes. Se o seu jogo tem uma issue aberta, você descobre se já existe workaround, se a Valve confirmou o bug, ou se ele é específico da sua configuração.

Para demonstrar, veja como um grep do log combinado com a busca do GitHub fecha o diagnóstico de forma eficaz:

```terminal
$ PROTON_LOG=1
$ grep -iE 'err:|fixme:|dxvk' ~/steam-1245620.log | tail -10
fixme: vulkan:X11DRV_vkCreateWin32SurfaceKHR
err:   DxvkInstance: Failed to create instance
err:   D3D11CreateDevice: Failed to create device (0x887a0001)
## Busca no GitHub: "is:issue is:open A Short Hike D3D11CreateDevice"
## Resultado: issue #7021 — Fixed in Proton Experimental, merge pendente na Stable.
```

O fluxo completo levou 2 minutos: log capturou o erro, o erro apontou para `D3D11CreateDevice`, e a busca no GitHub mostrou que a correção já existe na Experimental. Sem o rastreador, você teria tentado meia dúzia de coisas antes de descobrir que era só esperar o merge ou trocar de versão.

:::info
O Proton não corrige bugs de jogo — corrige bugs **na camada de compatibilidade**. Se um título tem crash que também ocorre no Windows, o problema não é do Proton nem será tratado no rastreador. A diferença é sutil, mas é a primeira coisa que a Valve verifica ao triar issues.
:::

## Montando seu próprio mini-relatório

Quando você descobre um workaround que funciona mas não está documentado, publique um relatório no ProtonDB. Um bom relatório contém:

- **Plataforma:** "Steam Deck LCD, SteamOS 3.6, Proton 9.0-2"
- **Sintoma:** "Tela preta por 30s no launch depois da logo do estúdio"
- **Workaround:** "PROTON_NO_ESYNC=1 %command%"
- **Resultado:** "Jogo abre em 5s, sem efeitos colaterais visíveis"
- **Extra:** se você usou `protontricks` ou `mf-install`, mencione o comando exato.

Quatro linhas assim salvam a próxima pessoa de repetir sua saga de duas horas. A qualidade do ProtonDB depende inteiramente de quem reporta.

```terminal
## Exemplo de mini-relatório que você escreveria
Plataforma: Steam Deck LCD, SteamOS 3.6, Proton 9.0-2
Sintoma: Crash imediato após logo do estúdio.
Log: grep -iE 'err:|import_dll' ~/steam-2195250.log
      err: module:import_dll Loading library VCRUNTIME140.dll failed
Workaround: protontricks 2195250 vcrun2022
Resultado: Jogo abre normalmente, 60 FPS estável no tutorial.
```

## Resumo

- ProtonDB classifica jogos de Platinum a Borked com base em relatórios comunitários.
- Filtre sempre por Steam Deck e leia os 5 relatórios mais recentes.
- Contradições entre relatórios geralmente se explicam por versão do Proton, tipo de prefixo ou atualização do jogo.
- O rastreador oficial em `github.com/ValveSoftware/Proton/issues` separa bugs de compatibilidade, regressões e issues de jogo.
- Um bom relatório de ProtonDB contém plataforma, sintoma, workaround e resultado em meia dúzia de linhas.

## Exercícios

1. Abra o ProtonDB, pesquise um jogo seu e anote o rating, a versão de Proton mais recomendada e dois tweaks mencionados.
2. Compare dois relatórios contraditórios do mesmo título e levante três possíveis explicações para a divergência.
3. Acesse `github.com/ValveSoftware/Proton/issues` e busque por um jogo que você tem. Existe issue aberta? O rótulo é `Game compatibility`, `Regression` ou outro?
4. Escreva um mini-relatório para um jogo seu, seguindo o modelo de 5 campos (plataforma, sintoma, log, workaround, resultado).
5. **Desafio.** Pegue um jogo classificado como Silver ou Bronze no ProtonDB e use o que aprendeu neste capítulo para elevá-lo a Gold. Documente cada passo, publique o relatório e anote o link.