Abrir o Steam Deck é o momento de maior risco do processo inteiro, e também o mais simples quando feito com método. A tampa traseira do LCD sai com 8 parafusos e alguns clipes; o interior já expõe SSD, ventoinha e dissipador. O objetivo desta seção é tirar a tampa e chegar ao interior sem danificar nada — e desligar o aparelho corretamente antes de qualquer parafuso.

:::objetivos
- Desligar o Deck de forma segura antes de abrir
- Remover o microSD e identificar os 8 parafusos da tampa
- Soltar os clipes sem forçar o plástico
- Navegar com segurança pelo interior (SSD, ventoinha, dissipador)
- Reconectar e fechar corretamente ao final
:::

## Desligamento seguro e preparação

Nunca abra o Deck ligado ou em suspensão. O modo de suspensão mantém energia nos componentes; abrir com a placa energizada pode causar curto. Desligue de verdade e espere o LED apagar.

```terminal
$ sudo shutdown -h now
```

No modo Desktop, `shutdown -h now` (ou o botão Desligar da Steam UI) derruba o sistema por completo. Alternativamente, no modo de jogo, mantenha o botão liga/desliga e escolha "Desligar". Confirme que não há mais luz ou som de ventoinha.

Antes de abrir, **remova o cartão microSD**. O slot fica na parte inferior; se esquecer e forçar a tampa, você pode partir o cartão e danificar o leitor.

```terminal
$ lsblk | grep mmcblk
mmcblk0   179:0    0   476.9G  0 disk
```

Se `lsblk` ainda mostra um `mmcblk0` (o microSD), ele não foi ejetado. Ejetar pelo sistema antes de remover fisicamente evita corrupção de dados.

## Os 8 parafusos da tampa traseira

Com o Deck de tela para baixo, sobre pano macio, você vê 8 parafusos na tampa traseira: quatro no topo, quatro na base. No LCD são Phillips #00/#0. No OLED a disposição é parecida; confira o guia do seu modelo.

Remova todos os 8 e etiquete por posição (use a caixa de ovos do passo anterior). Os parafusos têm comprimentos **muito próximos**, então posição importa.

```terminal
$ for p in 1 2 3 4 5 6 7 8; do echo "parafuso $p -> celula $p"; done
parafuso 1 -> celula 1
parafuso 2 -> celula 2
parafuso 3 -> celula 3
parafuso 4 -> celula 4
parafuso 5 -> celula 5
parafuso 6 -> celula 6
parafuso 7 -> celula 7
parafuso 8 -> celula 8
```

:::dica
Vire os parafusos com a cabeça para baixo numa ordem que siga o contorno (sentido horário). Na remontagem, desfaça na ordem inversa. Isso distribui a tensão uniformemente e evita empenar a tampa.
:::

## Soltando os clipes

Depois dos parafusos, a tampa é presa por clipes plásticos ao longo da fenda entre a tampa e o chassi. Insira a picareta plástica na fenda perto de um canto e deslize gentilmente, soltando clipe a clipe. Nunca faça alavanca com força — o clipe cede com pouco esforço.

Comece por um canto superior, siga pela borda, e por fim a parte inferior. Ao soltar o último clipe, levante a tampa devagar: há cabos e a própria tampa pode ter um conector? No LCD, a tampa traseira **não tem cabo** — sai limpa. (No OLED, há um cabo da ventoinha perto da tampa, cuidado extra.)

```terminal
$ # após abrir, o interior fica exposto:
$ sudo lspci | grep -i nvme
```

O primeiro componente visível sob a tampa é o **escudo metálico do SSD**, preso por parafusos adicionais. É a troca mais comum e dispensa remover mais nada do interior.

## Mapa do interior

Uma vez aberto, você verá, do topo para a base:

- **Ventoinha (fan)** — no canto, com conector próprio de 3/4 pinos.
- **Dissipador + heatpipe** — cobrindo a APU.
- **SSD** — sob escudo metálico, formato M.2 2230.
- **Bateria** — ocupando a maior parte da metade inferior, com conector.
- **Sticks analógicos** — laterais, fixados por parafusos e um flat cable cada.

```terminal
$ sudo sensors | grep -iE 'fan|temp1'
```

O pacote `lm-sensors` (comando `sensors`) lê os sensores da placa. Com o Deck aberto e o cooler à mostra, você pode correlacionar o que vê (poeira, ventoinha parada) com o que o sistema reporta (RPM zerado, temperatura alta).

:::atencao
Assim que abrir, **desconecte a bateria** antes de tocar em qualquer componente. O conector da bateria fica perto da placa; solte-o com o spudger puxando o plug (nunca pelos fios). Isso zera a energia da placa e evita curto acidental.
:::

## Reconectar e fechar

A remontagem é o espelho da desmontagem:

1. Reconecte a bateria (último conector a entrar, com o aparelho ainda "morto").
2. Recoloque o escudo do SSD e seus parafusos.
3. Encaixe a tampa começando pelos clipes inferiores, pressionando até ouvir o clique.
4. Recoloque os 8 parafusos na ordem inversa, torque leve.
5. Reinsira o microSD.

```terminal
$ sudo dmesg | tail -20
```

Depois de fechar, ligue e rode `dmesg` para ver o boot limpo e conferir que SSD, ventoinha e entrada aparecem sem erros. Um `dmesg` sem `error`/`fail` relevante é o seu "aprovado" pós-abertura.

:::dica
Teste tudo **antes** de recolocar os 8 parafusos finais: ligue com a tampa apenas encaixada e confira se o sistema sobe, o SSD é reconhecido e a ventoinha gira. Fechar o aparelho todo para descobrir um cabo esquecido é o erro mais frustrante do reparo.
:::

Com o Deck aberto e o método dominado, o passo seguinte é saber *o que* está quebrado — o diagnóstico físico da próxima seção.
