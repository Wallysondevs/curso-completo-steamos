O configurador de controles do Steam Deck não trata os botões como teclas fixas — trata cada entrada como um **ativador** (activator), e cada ativador pode disparar comandos diferentes conforme o tipo de pressão. Um mesmo botão pode fazer uma coisa no toque leve, outra na pressão completa, outra no clique duplo e ainda outra quando segurado. Essa granularidade é o que separa uma configuração "funcional" de uma que parece feita sob medida para o jogo.

:::objetivos
- Entender os tipos de ativador: Regular Press, Long Press, Double Press, Start Press, Release Press
- Configurar múltiplos comandos num mesmo botão
- Usar ativadores para ações contextuais (ex.: toque = mirar, pressão = atirar)
- Verificar a estrutura de ativadores num arquivo `.vdf`
:::

## O que é um ativador (activator)

Pense num ativador como uma cláusula "quando... então...": **quando** o botão é pressionado por completo, **então** dispara a tecla espaço; **quando** o mesmo botão recebe um clique duplo, **então** abre o mapa. O Steam Input avalia todas essas cláusulas a cada quadro e dispara a que combinar com a situação.

O configurador expõe cinco tipos:

| Ativador | O que detecta |
|---|---|
| Regular Press | Pressão completa do botão |
| Long Press | Botão segurado por tempo acima do limiar |
| Double Press | Dois toques consecutivos em intervalo curto |
| Start Press | O exato momento em que o botão começa a ser pressionado |
| Release Press | O exato momento em que o botão é solto |

Combinar três ou mais desses tipos num mesmo botão é possível. Na prática, dois ou três por botão já cobrem quase todos os cenários reais; mais do que isso fica difícil de lembrar durante o jogo.

```terminal
$ grep -A 30 '"activators"' ~/.local/share/Steam/config/controller_configs/730/SteamControllerGamepad.vdf 2>/dev/null | head -35
"activators"
{
    "Full_Press"
    {
        "bindings"  { "binding" "key_press 1, Primary Weapon" }
    }
    "Long_Press"
    {
        "bindings"  { "binding" "key_press G, Drop Weapon" }
        "delay"     "350"
    }
    "Double_Press"
    {
        "bindings"  { "binding" "key_press E, Interact" }
        "gap"       "200"
    }
}
```

Cada ativador carrega seu `binding` (o comando) e parâmetros extras conforme o tipo: `Long_Press` tem `delay` (tempo em milissegundos que o botão precisa ficar pressionado para disparar), e `Double_Press` tem `gap` (intervalo máximo entre os dois toques). O Steam Input processa isso na ordem: primeiro avalia `Double_Press` (se houver um segundo toque), depois `Long_Press` (se o tempo de hold for atingido) e, por fim, `Regular Press` na hora de soltar.

## Caso clássico: tocar para mirar, pressionar para atirar

Num FPS, o gatilho direito (`[[R2]]`) é o botão de atirar. Mas você pode querer que o mesmo dedo, ao encostar de leve no gatilho (sem apertar até o fim), ative o modo de mira. Isso usa dois ativadores:

- **Soft Pull** (puxada leve): aciona a ação "Mirar" (`key_press MOUSE2`).
- **Full Pull** (puxada completa): aciona a ação "Atirar" (`key_press MOUSE1`).

```terminal
$ cat << 'EOF'
Exemplo: gatilho R2 com dois níveis
  Soft Pull  -> key_press MOUSE2 (mirar)
  Full Pull  -> key_press MOUSE1 (atirar)
  Soft Pull threshold: 60 (de 0 a 255)
  Full Pull threshold: 200
EOF
```

O gatilho analógico do deck reporta valores de 0 a 255 (8 bits de resolução). O Steam Input permite definir dois limiares: um para considerar "puxada leve" e outro para "puxada completa". Entre 60 e 200, o gatilho está mirando; acima de 200, mirando E atirando. Essa separação é uma das configurações mais transformadoras para quem migrou de controle comum.

:::dica
Para jogos que já têm um botão dedicado de mira (mirar com arma), você pode usar o ativador **Release Press** no R2 para recarregar: soltou o gatilho, recarregou. É uma pequena economia de botão que, com o tempo, vira memória muscular.
:::

## Start Press e Release Press: o que acontece nas bordas

**Start Press** dispara no exato frame em que o botão começa a ser pressionado. **Release Press** dispara no frame em que ele é solto. Esses dois são menos usados, mas resolvem problemas específicos:

- **Start Press no analógico:** Ativar "correr" no exato momento em que você empurra o analógico até o fim (threshold de 90%, por exemplo), em vez de esperar um clique.
- **Release Press no gatilho:** Num jogo de carro, soltar o acelerador dispara o freio motor — ou num shooter tático, soltar o gatilho inicia a recarga.

```terminal
$ grep -B 2 -A 8 "Release_Press\|Start_Press" ~/.local/share/Steam/config/controller_configs/*/SteamControllerGamepad.vdf 2>/dev/null | head -30
```

Esse grep vasculha seus layouts salvos e mostra se (e onde) você já usou Start Press ou Release Press. A maioria das pessoas nunca configura isso, o que é curioso — porque são justamente esses dois ativadores que mais aproximam o controle do deck de um teclado bem configurado, onde cada movimento "pra baixo" e "pra cima" da tecla pode fazer algo diferente.

## Empilhamento e conflito

Quando um botão tem três ativadores diferentes, a ordem de processamento importa. O Steam Input resolve assim:

1. **Double Press** avaliado primeiro. Se o segundo toque chega dentro do `gap`, dispara e os demais são ignorados naquele ciclo.
2. **Long Press** avaliado em seguida. Se o botão está pressionado há mais tempo que o `delay`, dispara e o Regular Press é cancelado.
3. **Regular Press** dispara ao soltar o botão, **desde que** nem Double nem Long tenham sido disparados antes.
4. **Start Press** e **Release Press** disparam independentemente dos anteriores (são eventos de borda, não competem com press).

Isso quer dizer que `Regular Press + Long Press` funciona bem (toque curto faz A, toque longo faz B), mas `Regular Press + Double Press` exige cuidado: o Regular Press sempre vai disparar *junto* com o Double Press no primeiro toque, a menos que você use um delay — o que o configurador resolve sozinho, internamente bufferizando o Regular Press até ter certeza de que não vem um segundo toque.

:::atencao
Quando você mapeia Long Press num botão e sente que a resposta "normal" (Regular Press) ficou mais lenta, é porque o Steam Input está esperando o `delay` expirar para decidir se foi longa ou curta. Reduza o `delay` para 250–300 ms — tempo suficiente para diferenciar, mas rápido o bastante para não atrasar o comando curto.
:::

## Resumo

- Ativadores são cláusulas "quando... então..." que permitem comandos diferentes no mesmo botão.
- Os cinco tipos são Regular Press, Long Press, Double Press, Start Press e Release Press.
- O gatilho analógico suporta dois limiares (Soft Pull e Full Pull), ideais para mirar + atirar no mesmo dedo.
- Double Press tem precedência sobre Long Press, que tem precedência sobre Regular Press.
- Start Press e Release Press são eventos de borda e disparam independentemente dos outros ativadores.

## Exercícios

1. Num FPS, configure o gatilho R2 com Soft Pull = `MOUSE2` (mirar) e Full Pull = `MOUSE1` (atirar). Jogue uma partida e ajuste os limiares até que a transição seja natural.
2. Adicione um Long Press a um botão de ação (ex.: `[[A]]`) com delay de 300 ms e um comando diferente do Regular Press. Teste se o atraso no Regular Press é perceptível.
3. Configure Double Press no botão `[[X]]` para abrir o mapa e Regular Press para recarregar. O jogo troca de arma ao abrir o mapa? Se sim, por quê?
4. Use `grep -A 15 "activators"` num `.vdf` de um jogo seu e identifique quantos ativadores diferentes cada botão tem.
5. **Desafio.** Crie um botão com três ativadores: Regular Press (tecla `E`), Long Press (tecla `F`, delay 400 ms) e Double Press (tecla `G`). Jogue por 15 minutos. Em que situação o Steam Input "errou" qual ativador disparar? Proponha ajustes nos delays.