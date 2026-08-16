Até aqui, cada parâmetro foi apresentado isoladamente. Mas o mundo real pede combinações: você quer FSR ativo, Fsync ligado, o MangoHud medindo e talvez uma flag do RADV. A boa notícia é que todas essas variáveis convivem na mesma linha antes do `%command%` — desde que estejam na ordem certa e você saiba limitar o que está testando. Esta seção fecha o capítulo mostrando como juntar tudo de forma segura, reverter mudanças e criar um fluxo pessoal de ajuste por jogo.

:::objetivos
- Combinar múltiplos parâmetros numa única linha de inicialização
- Entender a ordem correta: variáveis de ambiente, comandos envoltórios, `%command%`
- Criar um checklist de teste incremental para cada jogo
- Documentar e versionar as linhas usadas
- Reconhecer combinações que se anulam ou são redundantes
:::

## A ordem importa

A linha de inicialização da Steam é executada por um shell comum. O que o shell lê da esquerda para a direita é: primeiro as variáveis de ambiente (como `PROTON_ENABLE_NVAPI=1`), depois os comandos envoltórios (como `gamemoderun` e `mangohud`) e por último o `%command%`. Inverter isso produz erro.

A forma canônica:

```text
VARIAVEIS... COMANDO_ENVOLTORIO... %command%
```

Exemplo concreto com vários parâmetros discutidos neste capítulo:

```bash
WINEFSYNC=1 WINE_FULLSCREEN_FSR=1 DXVK_HUD=fps gamemoderun mangohud %command%
```

O shell lê `WINEFSYNC=1` e define a variável. Depois `WINE_FULLSCREEN_FSR=1` e `DXVK_HUD=fps`. Essas variáveis são exportadas para os processos filhos. Em seguida, executa o `gamemoderun`, que por sua vez executa o `mangohud`, que executa o jogo real (via `%command%`). Cada envoltório é um programa que recebe as variáveis, faz seu ajuste e chama o próximo na cadeia.

```terminal
$ cat ~/params-elden.txt
# Elden Ring: FSR + Fsync + MangoHud
WINEFSYNC=1 WINE_FULLSCREEN_FSR=1 gamemoderun mangohud %command%
```

Manter um arquivo `params-<jogo>.txt` por jogo é uma prática simples que resolve o problema de esquecer qual combinação estava ativa. Uma linha, um jogo, documentado.

## Combinações que se anulam ou são redundantes

Nem toda combinação faz sentido. Algumas são inofensivas mas desperdiçam caracteres; outras podem causar conflito:

| Combinação | Resultado |
|---|---|
| `WINE_FULLSCREEN_FSR=1` + jogo em 1280×800 | FSR sem efeito (resolução igual à nativa) |
| `RADV_PERFTEST=aco,gpl` | Redundante se o Mesa já ativa ambos por padrão |
| `DXVK_ASYNC=1` + Proton sem suporte ao fork async | Variável ignorada silenciosamente |
| `mangohud %command%` + `MANGOHUD=1` | MangoHud carregado duas vezes, mas sem problema |
| FSR do Proton + FSR 2.0 do jogo | Imagem degradada: dois upscalers em cascata |

A regra prática: **junte apenas o que você testou isoladamente primeiro**. Se você nunca testou `WINEFSYNC=1` sozinho, não faz sentido testar `WINEFSYNC=1 WINE_FULLSCREEN_FSR=1 RADV_PERFTEST=gpl gamemoderun` — você nunca saberá qual dos três ajudou (ou atrapalhou).

:::atencao
A forma mais comum de perder horas depurando é adicionar cinco parâmetros de uma vez, ver que o FPS subiu e assumir que todos ajudaram. Teste sempre um por vez, meça com o MangoHud, anote. Depois, quando souber o que cada um faz isoladamente, combine dois e confirme que não há interferência.
:::

## O fluxo incremental

Para qualquer jogo novo, siga esta sequência:

1. **Baseline.** Rode o jogo sem parâmetro nenhum, com MangoHud ligado, por 5–10 minutos. Anote FPS médio, 1% baixo, uso de GPU e temperatura.
2. **Gargalo.** Determine se o limitante é CPU ou GPU.
3. **Um parâmetro.** Se GPU-bound, teste `WINE_FULLSCREEN_FSR=1` ([seção sobre FSR](#/cap-041/sec-06)). Se CPU-bound, teste `WINEFSYNC=1` ([seção sobre Fsync](#/cap-041/sec-07)).
4. **Medição.** Meça de novo e compare com o baseline. Se houve ganho, mantenha. Se não, descarte.
5. **Polimento.** Adicione `gamemoderun` para consistência de quadro e flags do RADV se houver *stutter* residual.
6. **Documentação.** Escreva a linha final no `params-<jogo>.txt`.

O fluxo não é dogma — adapte-o. Mas a estrutura (baseline → gargalo → um parâmetro → medição → decisão) evita que você caia na tentação de empilhar tudo de uma vez.

```terminal
$ mangohud %command%
## fase 1: baseline — anote os números
$ WINEFSYNC=1 mangohud %command%
## fase 2: CPU-bound? teste Fsync
$ WINE_FULLSCREEN_FSR=1 mangohud %command%
## fase 3: GPU-bound? teste FSR
```

Cada linha é uma fase. Entre uma e outra, jogue por alguns minutos para estabilizar a medição.

Para registrar as três fases num histórico reprodutível, capture a saída do MangoHud ou do log a cada execução:

```terminal
$ mangohud %command% 2>&1 | tee ~/lab/fase1.log
$ WINEFSYNC=1 mangohud %command% 2>&1 | tee ~/lab/fase2.log
$ WINE_FULLSCREEN_FSR=1 mangohud %command% 2>&1 | tee ~/lab/fase3.log
```

O `tee` grava a saída em um arquivo enquanto ainda a exibe na tela, e o `2>&1` junta stderr ao stdout para nada se perder. No fim, você tem três arquivos comparáveis (`fase1.log`, `fase2.log`, `fase3.log`) com os números de cada fase — a base do relatório de otimização.

## Parametrizando entre jogos e perfis

Uma vez que você tem as combinações que funcionam, o próximo passo é evitar digitar tudo de novo a cada jogo. Alguns usuários criam pequenos scripts em `/home/deck/lab/` que encapsulam as combinações comuns:

```bash
#!/bin/bash
# /home/deck/lab/launch-balanced.sh
# Perfil balanceado: FSR + Fsync + GameMode + MangoHud
export WINEFSYNC=1
export WINE_FULLSCREEN_FSR=1
exec gamemoderun mangohud "$@"
```

Com esse script salvo e com permissão de execução (`chmod +x`), você escreve no campo de inicialização da Steam:

```text
/home/deck/lab/launch-balanced.sh %command%
```

Isso centraliza os parâmetros em um lugar só e permite trocar de "perfil" sem reescrever o campo de cada jogo. É uma evolução natural de quem já passou da fase de testes isolados.

:::dica
Você não precisa de script nenhum para usar os parâmetros. O campo de inicialização da Steam aceita a linha completa, e para a maioria das pessoas isso é suficiente. O script é útil quando você tem muitos jogos e quer aplicar a mesma combinação a todos.
:::

## Resumo

- A ordem canônica é `VARIAVEIS... COMANDO_ENVOLTORIO... %command%`: variáveis de ambiente primeiro, depois envoltórios, depois o curinga.
- Teste um parâmetro por vez: baseline → gargalo → parâmetro isolado → medição → decisão.
- Combinações como `DXVK_ASYNC` + FSR raramente conflitam, mas testar isolado primeiro sempre paga o investimento.
- Documente a linha final em `params-<jogo>.txt` ou em scripts reutilizáveis.
- MangoHud é o companheiro de todas as fases — sem números, otimização é achismo.

## Exercícios

1. Escreva uma linha única que combine `WINE_FULLSCREEN_FSR=1`, `WINEFSYNC=1`, `gamemoderun` e `mangohud` e teste-a num jogo.
2. Para um jogo que você conhece bem, execute o fluxo incremental completo: baseline, diagnóstico, mudança, medição.
3. Crie um script `/home/deck/lab/perfil-teste.sh` que exporte duas variáveis e use o `mangohud`.
4. Identifique uma combinação que você acreditava ser útil e descubra, medindo, se ela de fato melhora algo.
5. **Desafio.** Monte três perfis diferentes para o mesmo jogo (economia de bateria, equilibrado, desempenho máximo) usando apenas as variáveis e comandos deste capítulo. Meça FPS, 1% low e consumo (Watt) de cada perfil e apresente os resultados.