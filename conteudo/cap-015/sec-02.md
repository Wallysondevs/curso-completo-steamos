Um conjunto de ação diz *o que* o botão faz; uma **camada de ação** (action layer) diz *quanto a mais* ele pode fazer, empilhado por cima de um conjunto. Em vez de trocar a página inteira do livro para usar cinco funções extras, você sobrepõe uma folha transparente que muda só alguns botões — e, ao soltar o gatilho, a folha some.

:::objetivos
- Entender a diferença entre action set (troca de página) e action layer (sobreposição parcial)
- Criar uma camada de ação ativada por um botão mantido pressionado
- Configurar múltiplas camadas que não conflitam entre si
- Reconhecer casos em que camada é melhor que conjunto de ação
:::

## Por que sobrepor em vez de trocar

Conjuntos de ação trocam tudo de uma vez, e trocar tem um custo: você precisa de um botão dedicado só para alternar, e corre o risco de "esquecer em que página está". A camada resolve o caso mais comum de mapeamento avançado — uma **função temporária** que você usa por segundos.

O exemplo clássico é o *sprint* em jogos de tiro: você mantém `L5` (um dos botões traseiros) pressionado para correr. Enquanto segura, os botões de ombro `L1`/`R1` mudam de "arremessar granada" para "espiar por cima/por baixo". Soltou o `L5`, tudo volta ao normal, sem nunca trocar de conjunto.

```text
Conjunto "In Game" (base)
  ├─ A = pular
  ├─ L1 = granada
  └─ R1 = recarregar

Camada "Correndo" (sobreposta, ativa enquanto L5 pressionado)
  ├─ L1 = espiar por cima
  └─ R1 = espiar por baixo
  (demais botões: inalterados)
```

Repare que só `L1` e `R1` mudam. O `A` continua pulando. É isso que torna a camada tão barata: você não precisa re-mapear o que não muda.

:::nota
No jargão da Valve, o gatilho que liga uma camada é um *chord* (acorde). Manter `L5` enquanto aperta outra tecla é um acorde de duas teclas — por analogia com piano, onde você toca duas notas ao mesmo tempo.
:::

## Criando uma camada no editor do SteamInput

O editor do SteamOS (acessível pelo menu `...` → *Editar layout*) tem uma aba própria para camadas. O fluxo é: definir a camada, listar quais botões ela altera e apontar qual botão a ativa.

```text
Menu do editor de layout
  |-- Action Sets (conjuntos)
  |-- Action Layers (camadas)
  |      |-- Adicionar camada → "Correndo"
  |      |      |-- L1 → espiar por cima
  |      |      |-- R1 → espiar por baixo
  |      |      |-- Trigger: L5 (segurar)
  |-- Dead zones / outros
```

A opção de gatilho mais útil em camadas é **"mantendo pressionado"** (*hold*). Existem outros modos, como a camada que liga ao tocar o touchpad ou ao disparar um evento, mas o *hold* cobre 90% dos casos reais.

:::dica
Sempre que uma função for "só enquanto eu seguro alguma coisa", pense em camada, não em conjunto. Camadas empilham e se anulam sem estado: não dá para "esquecer" uma camada ligada, porque ela morre no instante em que você solta o botão.
:::

## Múltiplas camadas sem conflito

Você pode ter várias camadas ao mesmo tempo, desde que cada uma altere botões diferentes — ou que você defina a prioridade. Cenas de voo em simuladores usam isso com elegância: uma camada para "pousar" (muda o acelerador e o flap), outra para "combate" (muda as armas).

Quando duas camadas quiserem mudar o mesmo botão, vence a que tiver prioridade maior. O editor deixa você reordenar as camadas; a que está mais acima na lista tem precedência:

```text
Camadas (ordem = prioridade, de cima para baixo)
  1. Combate     → R1 = disparar míssil
  2. Pouso       → R1 = acionar freio aerodinâmico

R1 pressionado com as duas ativas → "disparar míssil" (Camada 1 vence)
```

Na prática, porém, o melhor arranjo é **não sobrepor nada**: distribua as funções para que cada camada mexa em botões distintos. Menos ambiguidade, menos bug.

## Inspecionando camadas no arquivo VDF

No nível do arquivo, camadas vivem dentro do bloco `layer` de um VDF, com seus próprios `bindings`. É possível vê-las usando `grep` em um layout que use camadas:

```terminal
$ grep -n -i 'layer' ~/.local/share/Steam/controller_base/templates/handheld_neptune.vdf | head -8
8:      "bind_lower_layer"    "button_X"
9:      "bind_upper_layer"    "button_Y"
22:     "layer"    "button_A"
```

Aqui o `bind_lower_layer` e `bind_upper_layer` mostram que até o template oficial usa camadas para os botões traseiros: os *grip buttons* (botões de pegada, os `L4`/`L5`/`R4`/`R5`) invocam uma camada que altera o que o rosto faz. É a prova de que camada é recurso de primeira classe, não um truque obscuro.

Para ver a configuração completa de camadas de um layout personalizado, o `grep` com contexto revela a estrutura aninhada:

```terminal
$ find ~/.local/share/Steam/userdata -name '*.vdf' -path '*local*' -exec grep -l 'action_layers' {} \; 2>/dev/null
## Lista os arquivos que definem camadas de ação explicitamente.

$ grep -A 5 'action_layers' ~/.local/share/Steam/userdata/*/config/controller_configs/*/local/*.vdf 2>/dev/null | head -15
"action_layers"
{
    "0"
    {
        "title"     "Correndo"
        "use_activator"     "1"
    }
}
```

O bloco `action_layers` enumera as camadas por índice numérico (`"0"`, `"1"`, …). A chave `use_activator` indica que a camada é ativada por um activator (botão de hold), e não por troca manual de conjunto.

:::atencao
Editar o VDF na mão é a forma mais rápida de quebrar um layout: um par de chaves desbalanceado faz o Steam descartar a configuração inteira e voltar ao padrão. Use o editor gráfico, e trate o `grep`/`cat` apenas como leitura e inspeção.
:::

## Resumo

- Action set troca a página inteira; action layer sobrepõe mudanças parciais por cima do conjunto ativo.
- Camadas são ideais para funções temporárias acionadas com um botão mantido (*hold*).
- O gatilho que liga uma camada é chamado de *chord* (acorde de teclas).
- Múltiplas camadas podem coexistir; em conflito, vence a de prioridade maior na lista.
- Até o template oficial `handheld_neptune.vdf` usa camadas para os botões traseiros.
- Nunca edite `.vdf` manualmente; use o editor do Steam e o terminal só para ler.

## Exercícios

1. No editor de layout, crie uma camada chamada "Teste" que troque `A` para `B` e ative ela segurando `R5`. Confirme que, soltando o `R5`, o `A` volta ao normal.
2. Crie duas camadas que alterem o mesmo botão e reordene-as. Anote qual delas vence quando as duas estão ativas e confirme no jogo.
3. Inspecione um template com `grep -n 'layer'` e descreva, em uma frase, o que a camada faz ali.
4. Pense em um jogo seu com modo "correr/andar". Projete (no papel) uma camada *hold* que mude apenas os botões de ombro e explique por que camada é melhor que conjunto aqui.
5. **Desafio.** Combine o que aprendeu na seção anterior: use `sudo evtest` para ver os eventos do `L5` enquanto segura e solta, e relacione o par de eventos (press/release) com o início e o fim da camada.
