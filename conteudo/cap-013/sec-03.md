A herança entre perfil global e perfil individual é o mecanismo que decide, a cada jogo aberto, qual valor de TDP, FPS ou FSR realmente vale. Entender essa resolução evita o comportamento "meus ajustes não estão sendo aplicados" e permite usar o global como uma base inteligente em vez de configurar jogo por jogo à força bruta. Aqui você aprende as regras de precedência, com exemplos de como o Steam resolve conflitos.

:::objetivos
- Entender a ordem de resolução global → jogo com precisão
- Distinguir valor herdado de valor sobrescrito
- Inspecionar quais campos um perfil herda ou define
- Aplicar a herança para economizar configuração em lote
- Diagnosticar por que um ajuste não está sendo aplicado
:::

## Como a precedência funciona

Quando você inicia um jogo, o Steam monta o perfil efetivo combinando duas fontes: o **perfil global** (a base) e o **perfil individual** (a sobreposição). A regra é a de sempre: para cada campo, o valor do jogo vence se existir; senão, vale o do global. Não existe "média" nem "negociação" — é substituição pura, campo a campo.

Isso significa que um perfil individual **não precisa** definir todos os campos. Se você só quer mudar o limite de FPS de um jogo, define só isso; o TDP, o clock de GPU e o FSR continuam vindo do global. É exatamente essa granularidade que torna a herança tão útil.

:::nota
A herança do Steam é um caso de *override por camada* (o termo em inglês é *layered overrides*). O mesmo padrão aparece em sistemas de configuração como o systemd (onde `/etc` sobrescreve `/usr/lib`) e em temas de editores. Decorar a ideia ajuda a entender dezenas de outros sistemas Linux.
:::

## Visualizando a combinação no VDF

O `localconfig.vdf` guarda o perfil individual, mas eu posso confirmar a ausência de um campo para saber se ele será herdado. Quando uma chave não aparece no bloco do jogo, o Steam olha para o global. O `grep` permite checar se um determinado ajuste existe ou não para um AppID:

```terminal
$ grep -c "tdpLimit" ~/.local/share/Steam/userdata/182745653/config/localconfig.vdf
3
```

O `-c` conta as ocorrências de `tdpLimit` no arquivo inteiro. Se o número for maior que o de jogos que você configurou explicitamente, significa que o campo aparece também no bloco global (ou em outros lugares), e jogos sem o campo estão herdando aquele valor. Interpretar essa contagem exige conhecer a estrutura dos blocos, mas é um primeiro sinal de onde a herança atua.

## Um caso concreto de conflito

Suponha o global configurado com `fpsLimit 30` e um jogo específico sem perfil individual. O jogo roda a 30 FPS. Agora você cria um perfil para esse jogo definindo apenas `tdpLimit 12`, sem tocar em FPS. O que acontece?

```text
Global:    fpsLimit=30, tdpLimit=8
Jogo X:    (perfil define) tdpLimit=12   ->  efetivo: fpsLimit=30, tdpLimit=12
```

O FPS continua vindo do global (o jogo não definiu), e o TDP passa a ser `12` (o jogo sobrescreveu). Essa tabela mental — o que veio de onde — é o ponto central desta seção.

:::exemplo
A `ana` mantém o global em 30 FPS para economizar bateria e deixa o TDP global baixo. Para o jogo de estratégia que ela joga deitada no sofá, cria um perfil só com `tdpLimit 11`. Resultado: o jogo continua a 30 FPS herdado do global, mas ganha mais energia de CPU por causa do TDP maior — sem que ela tenha configurado nada manualmente a mais.
:::

## Herança na prática com vários jogos

A herança brilha quando você tem dezenas de títulos. Em vez de configurar cada um, você define uma base conservadora no global e usa perfis individuais só para as exceções — os poucos jogos pesados ou competitivos que precisam de mais. O padrão recomendado fica assim:

- **Global:** limite de FPS 40, TDP moderado, FSR ligado quando fizer sentido — uma base que funciona para a maioria.
- **Por jogo (exceções pesadas):** FPS 30 e TDP mais alto, para títulos que engasgam na base.
- **Por jogo (exceções leves):** FPS 60 desbloqueado e TDP baixo, para indies e emuladores que sobram desempenho.

Com essa base, alterar o global depois ajusta rapidamente *todos* os jogos que não têm perfil individual — um único slider muda dezenas de títulos de uma vez.

Para confirmar quais jogos estão herdando cada ajuste, você pode combinar a lista de AppIDs instalados com o que aparece ou não no `localconfig.vdf`:

```terminal
$ grep -Eo '"20[0-9]{4}"' ~/.local/share/Steam/userdata/182745653/config/localconfig.vdf | sort -u | head -10
"105600"
"1730680"
"413080"
"570"
"730"
$ for id in 1730680 570 730; do echo -n "$id: "; grep -c "\"PerformanceProfile\"" ~/.local/share/Steam/userdata/182745653/config/localconfig.vdf; done
1730680: 1
570: 1
730: 0
```

O `grep -Eo '"20[0-9]{4}"'` extrai todos os AppIDs que aparecem no `localconfig.vdf` (padrão de 5 dígitos numéricos entre aspas). O `for` então cruza cada AppID com a presença de `PerformanceProfile`: `730` retornou `0`, o que significa que esse jogo está herdando **todos** os campos do global — ele não tem perfil próprio.

## Quando a herança atrapalha

Há um caso que costuma confundir: você muda o global achando que vai afetar um jogo, mas ele já tem perfil individual, então o valor do global é ignorado naquele título. É o inverso do erro da seção 1.

```terminal
$ grep -B2 -A8 '"PerformanceProfile"' ~/.local/share/Steam/userdata/182745653/config/localconfig.vdf | head -30
			"570"
			{
				"PerformanceProfile"
				{
					"fpsLimit"		"60"
					"tdpLimit"		"15"
				}
			}
```

Esse jogo (`570`) tem perfil próprio com `fpsLimit 60`. Qualquer mudança que você fizer no global **não** vai afetá-lo, porque o campo já está sobrescrito aqui. O `grep -B2 -A8` mostra o contexto ao redor do `PerformanceProfile`, revelando de uma vez o AppID e os campos que ele define.

:::atencao
Antes de reclamar que "o deck não obedece", pergunte-se: esse jogo tem perfil próprio? Se tiver, o ajuste que você tentou mudar no global foi ignorado justamente porque a herança priorizou o jogo. É comportamento correto — não um bug.
:::

## Resumo

- O perfil efetivo é a combinação por substituição: o valor do jogo vence, senão vale o global.
- Um perfil individual não precisa definir todos os campos; os ausentes são herdados do global.
- `grep -c` em uma chave como `tdpLimit` dá um sinal de quantos blocos definem aquele campo.
- Manter uma base conservadora no global e exceções por jogo reduz o trabalho de configuração em lote.
- Mudar o global não afeta jogos que já têm o campo sobrescrito no perfil individual.

## Exercícios

1. Identifique, no global, três campos que você configuraria como base (FPS, TDP, FSR) e escreva por que escolheu esses valores.
2. Crie um perfil individual que defina apenas `fpsLimit` para um jogo e confirme com `grep` que `tdpLimit` continua ausente no bloco dele.
3. Use `grep -c "fpsLimit" .../localconfig.vdf` e explique o número, relacionando com quantos jogos você configurou e o global.
4. Simule no papel: global `fpsLimit 30`, jogo A sem perfil, jogo B com perfil `fpsLimit 60`. Qual FPS cada um exibe e por quê?
5. **Desafio.** Altere uma única configuração no global e preveja, antes de testar, quais dos seus jogos serão afetados. Depois confira com `grep` os blocos com `PerformanceProfile` e veja se sua previsão bate — integrando a leitura de VDF da [seção 1](#/cap-013/sec-01) e a criação de perfis da [seção 2](#/cap-013/sec-02).
