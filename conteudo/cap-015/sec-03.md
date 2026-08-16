O radial menu é a tradução literal de "menu radial" para a interface do SteamInput: um círculo dividido em fatias, centrado no touchpad, onde cada setor dispara uma ação diferente. Ele transforma o gesto de deslizar o polegar em **escolha instantânea entre até 20 comandos**, sem olhar para a tela, sem menu linear.

:::objetivos
- Criar um radial menu funcional no touchpad direito
- Entender os dois modos: disparo ao soltar e disparo imediato
- Personalizar ícones, cores e quantidade de setores
- Comparar radial menu e touch menu para escolher o certo em cada situação
- Inspecionar eventos do touchpad que o radial menu interpreta
:::

## Por que um círculo é mais rápido que uma lista

Menus lineares (listas, grades) exigem que você mire um alvo visual específico. Um círculo usa um atalho biológico: seu cérebro sabe em que ângulo está o polegar sem processamento consciente. O gesto é "arrastar para cima e para a esquerda", não "encontrar o terceiro ícone da linha 2". A diferença é medida em milissegundos e, em jogos competitivos, milissegundos contam.

O radial menu do SteamInput usa os dois eixos do touchpad (`ABS_X` e `ABS_Y`) para calcular o ângulo do seu polegar:

```text
      0° (cima)
90° ───┼─── 270° (esquerda/direita depende da orientação)
      180° (baixo)
```

Com 4 setores, cada um ocupa 90°; com 8, 45° cada; com 12, 30° cada. A sensação é de um "dial" que você gira com o polegar.

## Criando um radial menu do zero

No editor do SteamInput, selecione o touchpad direito (ou o analógico esquerdo, se preferir) e mude o comportamento de **"Trackpad"** para **"Radial Menu"**. O fluxo completo:

```text
Botão: Trackpad Direito
  → Comportamento: Radial Menu
  → Número de setores: 8
  → Para cada setor:
      Nome: "Avançar", Ícone: seta, Comando: W
      Nome: "Recuar",  Ícone: seta para trás, Comando: S
      Nome: "Esquerda", Ícone: seta esquerda, Comando: A
      Nome: "Direita", Ícone: seta direita, Comando: D
      ...
```

O SteamOS renderiza o menu circular na tela enquanto seu dedo está no touchpad, mostrando qual setor está ativo. Soltou o dedo — o comando é disparado.

:::dica
Para jogos de estratégia e RPGs com dezenas de habilidades, um radial menu de 12 ou 16 setores no touchpad direito é o que mais se aproxima da velocidade de um teclado, sem teclado. O polegar direito vira um "mouse de habilidade".
:::

## Dois modos de disparo

O radial menu tem dois comportamentos no gatilho de ativação:

| Modo | Como dispara | Use quando |
|---|---|---|
| `On Release` (ao soltar) | Dispara só quando o dedo sai do pad | Você quer "pré-visualizar" o setor antes de confirmar |
| `Immediate` (imediato) | Dispara assim que entra no setor | Você já tem memória muscular das direções |

O modo `Immediate` é um nível acima de fluência: você nem espera o menu aparecer na tela — faz o gesto e o comando já foi. Mas requer prática e muitos setores (12+) podem causar disparo acidental se o pad for sensível demais.

```terminal
## Para ver a zona morta e sensibilidade do touchpad que afetam o radial:
$ cat ~/.local/share/Steam/config/config.vdf | grep -A 5 -i 'trackpad'
"Trackpad"
{
    "Deadzone"    "8000"
    "Sensitivity"    "150"
    "TrackpadMode"    "2"
}
## Deadzone em unidades do touchpad (~8000), Sensitivity em percentagem. Quanto
## menor a deadzone, mais sensível o radial fica a pequenos movimentos do polegar.
```

Para confirmar como o touchpad reporta as coordenadas que o radial menu consome, o `evtest` mostra os valores brutos:

```terminal
$ sudo evtest /dev/input/event11 | head -12
Input driver version is 1.0.1
Input device ID: bus 0x3 vendor 0x28de product 0x1205 version 0x111
Input device name: "Steam Deck TrackPad R"
Supported events:
  Event type 0 (EV_SYN)
  Event type 1 (EV_KEY): BTN_LEFT BTN_RIGHT
  Event type 3 (EV_ABS): ABS_X ABS_Y
    Min      0
    Max   16384
```

O touchpad direito reporta valores entre 0 e 16384 nos dois eixos. O radial menu traduz esses valores em ângulo (via `atan2(ABS_Y, ABS_X)`) e seleciona o setor correspondente. Saber disso não muda como você usa o menu, mas ajuda a entender por que o canto do touchpad às vezes é mais confiável que o centro — os valores extremos são mais estáveis.

## Personalização visual: ícones e cores

Cada setor pode ter ícone próprio da biblioteca do Steam (300+ ícones: setas, espadas, poções, teclas de piano, símbolos de veículo) e uma cor de fundo. A combinação de cor + ícone é o que torna o menu usável sem precisar ler texto:

```text
Setor 1 (cima):      Verde, ícone de avançar,     tecla W
Setor 2 (cima-esq):  Azul,  ícone de escudo,       tecla Q (defesa)
Setor 3 (esquerda):  Cinza, ícone de girar,         tecla A
... 
```

Ícone + cor formam um atalho visual que seu cérebro registra em minutos. Depois de internalizado, o menu pode até ficar invisível — você faz só o gesto.

:::nota
A biblioteca de ícones do SteamInput vem do design system da Valve, o mesmo usado na UI do gamepad da Steam Controller e nos menus do Big Picture. Ícones não são imagens carregadas do disco — são glifos vetoriais embutidos no cliente Steam.
:::

## Radial menu vs. touch menu

O SteamInput oferece outra variante: o **touch menu**, que é uma grade retangular de botões (tipo 3×3 ou 4×4) renderizada sobre o touchpad. Visualmente é como um teclado numérico, onde cada célula é um botão. A escolha depende da tarefa:

| Característica | Radial Menu | Touch Menu |
|---|---|---|
| Representação | Círculo com setores angulares | Grade com células (N×M) |
| Máximo prático | 20 setores | 16 células (4×4) |
| Melhor para | Escolha rápida por gesto (direção) | Paleta de ferramentas (posição) |
| Precisão | Angular: quanto mais setores, mais estreito cada um | Cartesian: cada célula é um alvo fixo |
| Ícones e nomes | Sim, no círculo | Sim, na grade |

Regra prática: **se as opções formam um espectro (direções, armas, modos), use radial. Se são itens discretos de uma paleta (ferramentas de desenho, comandos de edição), use touch menu.** 

## Resumo

- O radial menu transforma o touchpad num seletor circular com até 20 setores, acionado por gesto angular.
- Ele usa os eixos `ABS_X`/`ABS_Y` do touchpad para calcular em qual setor seu dedo está.
- O modo `On Release` dispara ao soltar; o `Immediate` dispara na entrada do setor.
- Ícones e cores tornam o menu aprendível em minutos e usável sem olhar.
- O touch menu é a alternativa em grade (N×M), melhor para paletas de ferramentas discretas que para gestos direcionais.
- O arquivo `config.vdf` guarda parâmetros de sensibilidade e dead zone que afetam ambos os menus.

## Exercícios

1. Crie um radial menu de 8 setores no touchpad direito mapeado para `W/A/S/D` e diagonais (`WA`, `WD`, etc.). Teste num jogo em primeira pessoa.
2. Mude o modo de `On Release` para `Immediate` e descreva a diferença concreta de sensação.
3. Crie um touch menu de 3×3 para comandos de edição (`Ctrl+Z`, `Ctrl+C`, `Ctrl+V`, etc.) e compare a precisão com o radial.
4. Inspecione os eventos do touchpad com `sudo evtest /dev/input/event11` enquanto faz um gesto de 0° a 180°. Relacione os valores de `ABS_Y` com o setor ativo.
5. **Desafio.** Projete um layout híbrido: radial menu no touchpad direito para habilidades e touch menu no touchpad esquerdo para itens de inventário. Explique por que cada tipo combina com sua tarefa.