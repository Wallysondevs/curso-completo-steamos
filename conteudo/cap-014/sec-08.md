Nem toda entrada precisa ser um botão que dispara um comando. O Steam Input tem uma família de recursos mais abstratos — **radial menus**, **mouse regions**, **touch menus** e **modos de clique** — que transformam os touchpads em interfaces completas. Com eles, você pode controlar uma barra de atalhos de MMO, posicionar um cursor numa área específica da tela ou fazer o touchpad se comportar como um teclado direcional físico.

:::objetivos
- Construir um radial menu com labels e sub-menus
- Usar mouse region para confinar o cursor a uma área da tela
- Configurar touch menu em grade (grid)
- Ajustar modos de clique do touchpad (d-pad, joystick e cursor)
:::

## Radial menus, agora a sério

Você já viu o radial menu de relance na seção dos touchpads. Agora o detalhe que o torna poderoso: cada fatia pode ter um **label** visível, um **ícone**, e — mais importante — pode abrir um **sub-menu aninhado**. Isso permite uma árvore de comandos: uma fatia "Itens" que abre um segundo anel com poções, bombas e comida.

```terminal
$ cat ~/.local/share/Steam/config/controller_configs/255120/SteamControllerGamepad.vdf 2>/dev/null | grep -A 30 '"radial"' | head -34
"radial_menu"
{
    "menu_style"        "radial"
    "slices"            "6"
    "on_screen_display" "1"
    "slice_0"   { "binding" "key_press 1" "label" "Poção" }
    "slice_1"   { "binding" "key_press 2" "label" "Bomba" }
    "slice_2"   { "binding" "key_press 3" "label" "Mapa" }
    "slice_3"
    {
        "label" "Itens"
        "sub_menu"
        {
            "slice_0" { "binding" "key_press 4" "label" "Barra de Fome" }
            "slice_1" { "binding" "key_press 5" "label" "Kit Médico" }
        }
    }
    "slice_4"   { "binding" "key_press 8" "label" "Montaria" }
    "slice_5"   { "binding" "key_press 9" "label" "Diário" }
}
```

Esse exemplo (AppID 255120, um título de mundo aberto) tem um radial de 6 fatias, uma das quais — "Itens" — carrega um `sub_menu` inteiro com duas fatias próprias. O `on_screen_display` ligado faz o deck desenhar o anel na tela enquanto você o segura, com os labels aparecendo e destacando a fatia sob o polegar. É a interface de um console de verdade, construída por software.

## Mouse regions: cursor confinado

Num jogo de estratégia ou MOBA, parte da tela é um minimapa, uma barra de habilidades ou um painel fixo. A **mouse region** reserva uma área retangular da tela como se fosse um touchpad virtual: quando o recurso está ativo, o toque no touchpad mapeia direto para aquela região, em coordenadas absolutas.

O caso de amor clássico é o **minimapa do Dota 2 ou League of Legends**: normalmente o mapa vive no canto da tela, e clicar nele exige arrastar o mouse até lá e voltar. Com mouse region, você dedica (por exemplo) o touchpad esquerdo à região do minimapa — encostou, o cursor já está lá; clicou, já deu o comando; soltou, volta ao centro da tela.

```terminal
$ cat << 'EOF'
Exemplo de mouse region para minimapa (canto inferior esquerdo, 25% x 25% da tela):
  mode:           absolute_mouse_region
  region_left:    0.00   (0 a 1, fração da largura)
  region_top:     0.75
  region_width:   0.25
  region_height:  0.25
EOF
```

As coordenadas da região são frações da tela, de 0 a 1. `region_left = 0.00` + `region_top = 0.75` com `width/height = 0.25` descreve o quadrante inferior esquerdo. O Steam Input interpola a posição do dedo no touchpad para a posição correspondente *dentro* dessa região — então o touchpad inteiro vira o minimapa inteiro.

:::dica
Mouse region brilha em jogos com mapas/minimapas fixos, mas só funciona bem se a resolução do jogo for fixa. Se você joga em janela redimensionável ou muda resolução com frequência, a região se desalinha e os cliques caem no lugar errado. Nesse caso, prefira um radial menu.
:::

## Touch menu em grade

O radial é ótimo para até ~8 opções. Para mais que isso, o **touch menu** em grade (grid) é superior: ele desenha uma matriz de células (ex.: 3×3 ou 4×2) sobre o touchpad, e cada célula dispara uma ação. A posição do dedo determina a célula.

É a ferramenta certa para barras de habilidades de MMO — jogos onde você tem 9, 12 ou 20 habilidades que normalmente seriam as teclas de 1 a 9, Shift+1..9, e assim por diante. Você pode ter um menu de 12 células (4×3) mapeado para as 12 primeiras teclas, e um segundo menu com Shift para as 12 seguintes.

```terminal
$ grep -i "menu_style\|grid\|columns\|rows" ~/.local/share/Steam/config/controller_configs/*/SteamControllerGamepad.vdf 2>/dev/null | head -10
"menu_style"    "grid"
"columns"       "4"
"rows"          "3"
```

Esses campos aparecem quando você usa touch menu em grade: `menu_style` vira `grid`, e `columns`/`rows` definem a matriz — 4 colunas por 3 linhas dá 12 células. O toque é resolvido em linha e coluna, e a célula correspondente dispara seu `binding`.

## Modos de clique do touchpad

Além de mouse e radial, o touchpad pode operar como:

- **D-Pad:** Divide a superfície em zonas direcionais (4 ou 8). O clique central costuma ser uma quinta/na nona ação. Bom para jogos de luta e plataformas retrô.
- **Joystick:** O touchpad emula um analógico — o dedo empurra a partir do centro e a posição vira a direção. Útil quando o jogo insiste em ler um analógico e não aceita mouse.
- **Cursor (absoluto):** O touchpad mapeia 1:1 a tela inteira, como um trackpad de notebook em modo absoluto (menos comum em jogos, útil em menus).

```terminal
$ # Teste de resposta do touchpad em modo d-pad (4 zonas)
$ sudo timeout 5 evtest /dev/input/event3 2>&1 | grep -c "EV_ABS"
240
```

Ao posicionar o dedo nas quatro zonas, o kernel continua reportando o mesmo fluxo de `EV_ABS` — o que muda para "d-pad" não acontece no hardware, e sim na interpretação que o Steam Input faz das coordenadas. Isso volta ao princípio do capítulo: o hardware entrega posição; o software decide se aquilo é mouse, radial, d-pad ou analógico.

## Resumo

- Radial menus com sub-menus aninhados criam árvores de comandos acessíveis sem mover o polegar.
- Mouse region confina o cursor a uma área da tela em coordenadas fracionárias (0 a 1), ideal para minimapas.
- Touch menu em grade (grid) escala melhor que radial para muitas opções, usando matriz colunas×linhas.
- O touchpad pode operar como mouse, radial, d-pad, joystick ou cursor absoluto — a diferença é de software, não de hardware.
- A leitura crua via `evtest` é a mesma (`EV_ABS`) independentemente do modo configurado.

## Exercícios

1. Crie um radial de 4 fatias com um sub-menu em uma delas (2 itens) num RPG e navegue por ele sem olhar para a tela após dez repetições.
2. Configure uma mouse region no touchpad esquerdo para o minimapa de um MOBA ou estratégia. Confirme os cliques caindo na região certa.
3. Construa um touch menu em grade 4×3 para as 12 primeiras habilidades de um jogo e jogue uma sessão usando apenas ele.
4. Alterne o touchpad entre modo d-pad e modo mouse no mesmo jogo e registre qual parece mais natural para navegação de menus.
5. **Desafio.** Combine o que você aprendeu sobre action layers (seção anterior) com mouse region: crie uma layer que, enquanto `[[L1]]` estiver segurado, transforme o touchpad direito numa mouse region sobre o inventário. Descreva como a layer herda o resto do layout e o que muda ao soltar L1.