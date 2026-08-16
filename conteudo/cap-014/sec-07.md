Um mesmo jogo tem momentos radicalmente diferentes: navegar menus, dirigir um veículo, atirar a pé, pilotar, customizar equipamento. Um layout único obriga você a espremer tudo isso nos mesmos botões, com compromissos ruins. Os **action sets** resolvem isso permitindo que você defina *vários* layouts completos para o mesmo jogo, e troque entre eles com um toque. As **action layers** vão além: sobrepõem mudanças temporárias sobre o layout base sem trocá-lo inteiro.

:::objetivos
- Distinguir action set (conjunto de ações) de action layer (camada de ações)
- Criar e alternar entre action sets com um botão ou ativador
- Aplicar uma action layer temporária com um gatilho (hold layer)
- Entender como sets e layers aparecem no arquivo `.vdf`
:::

## Sets trocam o layout; layers trocam parte dele

Um **action set** é um layout completo e autocontido. Você pode ter, por exemplo, três sets para um jogo de mundo aberto:

- **Default (a pé):** analógicos para mover/câmera, gatilhos para atirar, botões para interagir.
- **Driving (dirigindo):** gatilhos viram acelerador/freio, analógico esquerdo vira direção.
- **Menu (navegação):** o touchpad direito vira mouse, o esquerdo vira scroll, e os botões viram Enter/Esc.

Trocar de set reconstrói o mapa inteiro de controles de uma vez. Já uma **action layer** é uma *sobreposição*: enquanto estiver ativa, ela altera apenas os botões que você definiu, mantendo o resto exatamente como estava. É a ferramenta certa para mudanças pontuais e temporárias — por exemplo, segurar `[[L2]]` para que os quatro grips virem os comandos de mira/imobilização, e soltar para voltar ao normal.

```terminal
$ grep -i "action_set\|action_layer" ~/.local/share/Steam/logs/controller_ui.txt 2>/dev/null | tail -8
[Steam Input] Action set "Default" active
[Steam Input] Action set "Driving" activated by L4
[Steam Input] Action layer "Aim" applied (hold L2)
[Steam Input] Action layer "Aim" released
```

O log mostra a semântica com clareza: um set é "ativado" (uma troca), uma layer é "aplicada" e "liberada" (uma sobreposição temporária). A diferença de verbos não é acidente — reflete como o Steam Input gerencia as duas coisas por baixo.

## Criando action sets e o comando de troca

Na interface, você adiciona um action set tocando no nome do set atual e escolhendo **Add Action Set**. Depois nomeia cada set. A troca entre sets é feita, ela própria, por um comando: o comando **Change Action Set** (trocar conjunto de ações).

```terminal
$ cat ~/.local/share/Steam/config/controller_configs/271590/SteamControllerGamepad.vdf 2>/dev/null | grep -A 20 '"action_sets"' | head -24
"action_sets"
{
    "Default"
    {
        "button_L4"     { "bindings" { "binding" "change_action_set Driving" } }
    }
    "Driving"
    {
        "button_L4"     { "bindings" { "binding" "change_action_set Default" } }
    }
    "Menu"
    {
        "button_L4"     { "bindings" { "binding" "change_action_set Default" } }
    }
}
```

Aqui, no AppID 271590 (GTA V), o botão `L4` em cada set aponta de volta para o set `Default` — exceto no próprio `Default`, onde `L4` troca para `Driving`. Isso cria um ciclo mínimo: você cai no carro, aperta L4, dirige, aperta L4 de novo e volta a andar. O mesmo botão em sets diferentes faz coisas diferentes, porque cada set define seus próprios mapeamentos, incluindo o mapeamento de troca.

:::nota
O `change_action_set` também aceita os valores especiais `Next` e `Previous` para ciclar por todos os sets em ordem, além de nomes específicos de set para troca direta. Para dois ou três sets, apontar nomes explícitos é mais previsível do que ciclar.
:::

## Action layers com "hold"

Enquanto o set é uma troca, a layer é quase sempre uma sobreposição *sob pressão*. O padrão mais comum é o **hold layer**: manter um botão pressionado ativa a camada; soltar, desativa.

Um caso muito usado: num shooter com sistema de mira, segurar `[[L2]]` muda a sensibilidade do giroscópio (a layer "Aim" reduz a sensibilidade para mira precisa) e ainda reconfigura os grips para comandos táticos. Você solta o gatilho e tudo volta ao comportamento de movimento normal.

```terminal
$ cat ~/.local/share/Steam/config/controller_configs/730/SteamControllerGamepad.vdf 2>/dev/null | grep -A 18 '"action_layers"' | head -22
"action_layers"
{
    "Aim"
    {
        "activation"    "hold_L2"
        "gyro"
        {
            "sensitivity"   "1.20"
        }
        "button_R4"     { "bindings" { "binding" "key_press R, Reload" } }
        "button_R5"     { "bindings" { "binding" "key_press Q, Toggle Sight" } }
    }
}
```

A layer `Aim` tem `activation` do tipo `hold_L2`: enquanto o gatilho esquerdo estiver segurado, ela vale. Dentro dela, apenas três coisas se alteram: a sensibilidade do giroscópio cai para `1.20`, e os grips R4 e R5 ganham comandos que não existiam no layout base. Todo o resto — analógicos, botões frontais, gatilho direito — permanece herdado do set Default.

Esse é o ponto-chave das layers: elas só mexem no que você declarar. O "resto" não é apagado, é *herdado*. Isso as torna muito mais baratas de manter do que um set inteiro duplicado.

:::dica
Use set quando o contexto muda de verdade (a pé vs. dirigindo vs. menu). Use layer quando você só precisa de um ajuste temporário por cima (mira, sprint, modo criativo). Regra de bolso: se a mudança "mata" o estado anterior por completo, é set; se só "pinta por cima", é layer.
:::

## A precedência entre layer e set

Quando uma layer está ativa sobre um set, o Steam Input resolve a ambiguidade dando **precedência à layer**: se um botão está definido na layer, vale a layer; se não, vale o set. Isso gera uma consequência sutil que vale registrar.

Se a layer `Aim` define `button_R5`, e o set Default também define `button_R5`, o comando da layer vence enquanto ela estiver ativa. Ao liberar, volta o do set. É exatamente o comportamento que você quer — mas é fácil esquecer que uma layer "copiou" um botão em algum momento e passar minutos caçando por que o grip está fazendo coisa diferente só quando você segura o gatilho.

```terminal
$ grep -c "binding" ~/.local/share/Steam/config/controller_configs/730/SteamControllerGamepad.vdf 2>/dev/null
89
```

Contar os `binding` de um `.vdf` dá a dimensão do mapa: 89 comandos distintos entre set base e layers. À medida que sets e layers se multiplicam, esse número sobe e a configuração vira um pequeno programa. A recomendação é manter um arquivo de anotações (ou comentários dentro do configurador) do que cada set e layer fazem — senão, daqui a três meses, você mesmo não reconhece a própria configuração.

## Resumo

- Action set é um layout completo e alternável; action layer é uma sobreposição temporária sobre o layout base.
- A troca de set é feita pelo comando `change_action_set`, mapeado em qualquer botão.
- A layer mais comum é o "hold layer": ativada enquanto um botão é segurado.
- Layers só alteram o que definem; tudo o mais é herdado do set, e a layer tem precedência sobre o set quando ambos definem o mesmo botão.
- Sets são para mudanças de contexto; layers para ajustes temporários.

## Exercícios

1. Num jogo de mundo aberto, crie os sets "A pé" e "Dirigindo" e troque entre eles com `L4` usando `change_action_set`. Jogue e registre se esqueceu algum botão no set secundário.
2. Crie uma action layer "Mira" com hold em `[[L2]]` que reduza a sensibilidade do giroscópio. Compare a precisão em tiroteio com e sem a layer.
3. Use `grep -A 20 "action_sets"` e `grep -A 20 "action_layers"` num `.vdf` para listar os sets e layers que um jogo seu já tem.
4. Adicione um terceiro set "Menu" e volte sempre ao "A pé" com `change_action_set`. Verifique o comportamento ao trocar de set durante uma cutscene.
5. **Desafio.** Combine set e layer num mesmo jogo: um set "Dirigindo" e, dentro dele, uma layer "Turbo" com hold em `[[R2]]` que remapeie o freio. Explique por que o turbo está na layer e não num terceiro set, e descreva o que acontece quando você segura R2 estando no set "A pé".
