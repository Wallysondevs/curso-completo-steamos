Ter perfis por jogo é útil; saber encontrá-los rapidamente entre dezenas ou centenas de títulos é essencial. As tags, coleções e a organização da biblioteca do Steam são a camada que une os perfis ao ato de jogar — você marca os jogos que receberam ajuste, cria coleções por perfil aplicado e usa o terminal para cruzar tags com configurações gravadas. Esta seção mostra como estruturar sua biblioteca em função dos perfis de desempenho.

:::objetivos
- Criar tags e coleções no Steam para agrupar jogos por perfil de desempenho
- Associar visualmente um jogo ao tipo de ajuste que ele recebeu
- Usar o terminal para cruzar AppIDs com tags de coleção
- Planejar uma taxonomia de desempenho pessoal (bateria, desempenho, equilíbrio)
- Manter a organização mesmo após reinstalações e atualizações
:::

## Por que organizar por perfil?

Com 20 ou 30 jogos instalados, fica impossível lembrar de cabeça qual tem perfil individual e qual usa o global. Pior: você acaba recriando perfis que já existiam ou ajustando o global sem querer para um jogo que já estava bem configurado. Tags e coleções resolvem isso: cada jogo recebe uma etiqueta que indica o tipo de perfil aplicado (ex.: "Bateria", "Desempenho", "Equilibrado", "Perfil Comunidade").

O Steam organiza coleções em `~/.local/share/Steam/userdata/<ID>/7/remote/sharedconfig.vdf`, um arquivo no formato VDF que descreve exatamente quais AppIDs pertencem a quais coleções. Saber ler esse arquivo permite cruzar a lista de jogos com os perfis de desempenho sem abrir interface nenhuma.

## Lendo as coleções no disco

O `sharedconfig.vdf` agrupa coleções por nome e lista os AppIDs dentro de cada uma. Um `grep` estratégico mapeia a estrutura:

```terminal
$ cat ~/.local/share/Steam/userdata/182745653/7/remote/sharedconfig.vdf
"UserCollections"
{
	"0"
	{
		"name"		"Bateria"
		"id"		"bateria"
		"added"
		{
			"0"		"1730680"
			"1"		"413080"
			"2"		"105600"
		}
	}
	"1"
	{
		"name"		"Desempenho"
		"id"		"desempenho"
		"added"
		{
			"0"		"570"
			"1"		"730"
		}
	}
}
```

A coleção "Bateria" agrupa três AppIDs; "Desempenho", dois. Com essa lista em mãos, você pode cruzar com o `localconfig.vdf` para ver se cada um desses AppIDs realmente tem o perfil que a coleção sugere.

## Cruzando coleções com perfis

O script abaixo é só uma ideia, mas mostra a lógica: para cada AppID numa coleção, verifique se o `localconfig.vdf` tem um bloco `PerformanceProfile`:

```terminal
$ for appid in 1730680 413080 105600 570 730; do echo -n "$appid "; grep -c "\"$appid\"" ~/.local/share/Steam/userdata/182745653/config/localconfig.vdf; done
1730680 4
413080 2
105600 1
570 3
730 1
```

O loop `for` itera sobre cada AppID; `echo -n` imprime o número sem quebra de linha; `grep -c` conta quantas vezes ele aparece no `localconfig.vdf`. Um AppID com contagem `1` pode estar referenciado apenas como chave de bloco, sem perfil; contagens maiores (`3`, `4`) sugerem que o bloco tem subchaves — provavelmente incluindo `PerformanceProfile`. Esse cruzamento rápido revela quais jogos da coleção realmente têm perfil.

:::dica
Crie a coleção **"Sem perfil"** com os jogos que ainda não foram ajustados. Ela serve como lista de tarefas: cada título nela é um candidato a ganhar perfil individual, e você vai riscando conforme configura.
:::

## Taxonomia pessoal de desempenho

Não existe uma classificação universal — cada pessoa joga coisas diferentes. Mas uma taxonomia de três a cinco categorias cobre a maioria dos cenários:

| Coleção | Critério | Perfil típico |
|---|---|---|
| **Bateria** | Jogos leves ou longos, uso fora de casa | FPS 30, TDP 6-8 |
| **Equilibrado** | Meio-termo, jogos medianos | FPS 40, TDP 9-11 |
| **Desempenho** | AAA, competitivo, ligado à tomada | FPS 60, TDP 12-15 |
| **Comunidade** | Perfis importados, ainda em teste | Variável, revisão pendente |
| **Indies** | Quase não usa GPU, horas de bateria | FPS 60, TDP 4-6 |

Cada jogo na sua biblioteca pode ser classificado em uma dessas, e o perfil correspondente aplicado. A taxonomia vira um atalho mental: em vez de "qual TDP mesmo eu botei no Hollow Knight?", você olha a coleção "Indies" e já sabe.

## Mantendo a organização com o tempo

O Steam sincroniza coleções pela nuvem (Steam Cloud), mas o `localconfig.vdf` **não** sobe para a nuvem — ele é local. Isso significa que, se você reinstalar o SteamOS ou trocar de Deck, as coleções voltam, mas os perfis de desempenho, não. Sua organização de biblioteca sobrevive; os valores de TDP e FPS precisam ser reaplicados.

:::atencao
O `localconfig.vdf` é local e **não faz parte do Steam Cloud**. Se você formatar o Deck, perderá todos os perfis de desempenho — mesmo que as coleções e os jogos voltem. Faça backup manual desse arquivo junto com suas personalizações importantes.
:::

## Backup das tags e perfis

Já que o `localconfig.vdf` não sobe para a nuvem, um backup manual resolve:

```terminal
$ cp ~/.local/share/Steam/userdata/182745653/config/localconfig.vdf ~/backups/localconfig-$(date -I).vdf
$ cp ~/.local/share/Steam/userdata/182745653/7/remote/sharedconfig.vdf ~/backups/sharedconfig-$(date -I).vdf
```

O `date -I` gera a data no formato ISO (`2026-01-15`), criando arquivos como `localconfig-2026-01-15.vdf`. Esse par de arquivos — configuração de desempenho + coleções — é tudo que você precisa para restaurar a organização inteira após uma reinstalação. Copie para um pendrive, nuvem externa ou outro Deck.

## Resumo

- Coleções do Steam são armazenadas em `sharedconfig.vdf`, com AppIDs agrupados por nome.
- Cruze AppIDs de coleções com `localconfig.vdf` usando `grep -c` para ver quais realmente têm perfil.
- Uma taxonomia de 4-5 categorias (Bateria, Equilibrado, Desempenho, Comunidade, Indies) cobre a maioria dos cenários.
- O Steam Cloud sincroniza coleções mas **não** sincroniza perfis de desempenho.
- Faça backup manual de `localconfig.vdf` e `sharedconfig.vdf` com `cp` e `date -I`.

## Exercícios

1. Crie três coleções no Steam: "Bateria", "Equilibrado" e "Desempenho". Classifique 5 jogos seus entre elas.
2. Abra o `sharedconfig.vdf` e confirme que os AppIDs que você classificou aparecem nas coleções corretas.
3. Use o loop `for` para cruzar os AppIDs das suas coleções com o `localconfig.vdf` e identifique quais já têm `PerformanceProfile`.
4. Faça backup do seu `localconfig.vdf` e `sharedconfig.vdf` seguindo o modelo com `date -I`.
5. **Desafio.** Crie um pequeno script (`organiza-perfis.sh`) que leia o `sharedconfig.vdf`, extraia os AppIDs de cada coleção e imprima: "Coleção X: Y jogos, Z com perfil de desempenho". Isso integra leitura de VDF da [seção 1](#/cap-013/sec-01), herança da [seção 3](#/cap-013/sec-03) e importação da [seção 7](#/cap-013/sec-07).