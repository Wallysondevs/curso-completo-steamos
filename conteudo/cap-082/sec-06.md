A tela é o componente mais caro e mais exposto do Steam Deck. Uma substituição de painel custa centenas de reais e deixa o aparelho semanas no conserto. Uma película de vidro temperado custa o preço de um lanche e é instalada em 2 minutos. A matemática é simples, mas a escolha entre os tipos de película, e entre o vidro e o plástico, exige entender o que cada material entrega — e o que ele pode estragar.

:::objetivos
- Diferenciar películas de vidro temperado, PET e TPU
- Entender o impacto da película na imagem do painel LCD e OLED
- Escolher a película certa para o tipo de tela do seu Deck
- Instalar corretamente e diagnosticar bolhas ou descolamento
- Saber quando uma película precisa ser trocada
:::

## O que cada material entrega

Três tipos de película dominam o mercado para o Steam Deck:

| Tipo | Material | Proteção contra | Impacto na imagem | Durabilidade |
|---|---|---|---|---|
| Vidro temperado | Vidro tratado (~0,3 mm) | Quedas, riscos de objetos duros | Mínimo (AR opcional) | 1-2 anos |
| PET | Poliéster (~0,15 mm) | Riscos leves, poeira | Quase nenhum | 6-12 meses |
| TPU / hidrogel | Poliuretano flexível (~0,2 mm) | Riscos, auto-regenera marcas | Pode dar "efeito laranja" (OLED) | 12-18 meses |

Para o painel LCD do Deck (7"), o vidro temperado é a escolha quase unânime: o brilho do painel antirreflexo original é mediano, e uma boa película de vidro pode até melhorar a nitidez percebida. Para o modelo OLED (7,4"), a conversa muda — o painel OLED já tem um tratamento antirreflexo de fábrica e é mais sensível a camadas extras.

```terminal
$ cat /sys/class/drm/card0-eDP-1/edid | xxd | head -4
00000000: 00ff ffff ffff ff00 06af 3d75 0000 0000  ..........=u....
00000010: 0120 0104 a51e 1178 03d0 7594 5c53 8e27  . .....x..u.\S.'
00000020: b454 0000 0001 0101 0101 0101 0101 0101  .T..............
00000030: 0101 0101 0101 0eb0 32a0 9265 1756 ce05  ........2..e.V..
```

O bloco EDID do painel interno confirma que o display é detectado como `eDP-1`. Não há como ler "que película está instalada" por comando, mas você pode verificar se a tela tem algum artefato de imagem — e o EDID é o primeiro passo para confirmar que o painel está saudável.

## A questão OLED: vidro temperado ou hidrogel?

O painel OLED do Steam Deck tem um revestimento antirreflexo mais sofisticado que o LCD. Colocar uma película de vidro temperado barata por cima pode anular esse revestimento com um brilho extra que o OLED não tinha. Além disso, algumas películas de vidro para OLED introduzem um padrão de difração (efeito arco-íris microscópico) visível em fundos brancos.

A película de hidrogel (TPU) é mais fina e flexível, e preserva melhor o antirreflexo original do painel OLED. O custo é durabilidade menor e, em alguns modelos, um "efeito casca de laranja" visível sob luz forte.

:::dica
Para o Deck OLED, a ordem de prioridade é: película com camada antirreflexo (AR) > hidrogel de boa procedência > vidro temperado genérico. Evite película "privacy" (ângulo reduzido) — o Deck é um portátil pessoal.
:::

## Instalação e diagnóstico

Uma película mal instalada é pior que película nenhuma. Bolhas que não saem, bordas que descolam e poeira aprisionada entre a película e o vidro criam distração e, com o tempo, pontos de pressão que podem arranhar a tela de verdade (a poeira vira lixa).

```terminal
$ xrandr | grep eDP
eDP-1 connected primary 1280x800+0+0 (normal left inverted right x axis y axis) 286mm x 179mm
```

Depois de instalar a película, use um fundo branco (abra o navegador ou um bloco de notas em tela cheia) e inspecione visualmente. O `xrandr` confirma que a resolução nativa está ativa e que o painel está reportando normalmente — se a película causasse desconexão de toque (no LCD com touchscreen, rara mas possível), o painel ainda reportaria `connected`.

:::atencao
Não pressione com força para remover bolhas — o painel do Deck é flexível e pressionar demais pode danificar os cristais líquidos (LCD) ou criar manchas de pressão permanente (OLED). Use um cartão de plástico envolto num pano de microfibra e empurre as bolhas para a borda mais próxima com leveza.
:::

## Quando trocar

Uma película não é eterna. Trincas visíveis, descolamento nas bordas que acumula poeira, ou o efeito "oleoso" que não sai com limpeza, são sinais de que a película cumpriu seu papel e está na hora de substituir. Pior que uma película velha é arrancar e não repor.

```terminal
$ ls /sys/class/backlight/
amdgpu_bl0
$ cat /sys/class/backlight/amdgpu_bl0/brightness
109
```

O backlight reporta brilho 109 (num range de 0 a 255 para o painel LCD). Com o brilho no máximo (`255`), inspecione a tela sob luz ambiente normal. Marcas de uso excessivo, arranhões ou pontos de desgaste no oleophobic coating (a camada que repele gordura dos dedos) são visíveis em fundo escuro com brilho alto. Se a película original não tiver a mesma camada oleofóbica, a sujeira gruda mais — é normal, não é defeito, mas é um critério de escolha na hora de comprar a próxima.

:::exemplo
Ana comprou uma película de vidro temperado de R$ 25 para o Deck LCD. Instalou no primeiro dia e, 8 meses depois, a película estava com uma trinca fina no canto — provavelmente de uma batida na quina da mesa. A tela por baixo estava intacta. A película fez exatamente o que deveria fazer: absorveu o impacto. Substituir custou mais R$ 25 e 3 minutos.
:::

## Resumo

- Películas de vidro temperado protegem contra quedas e riscos; PET e hidrogel (TPU) são mais finas mas menos resistentes a impacto.
- No Deck OLED, prefira película com antirreflexo (AR) ou hidrogel para preservar o revestimento original do painel.
- A instalação exige ambiente limpo; bolhas e poeira presas causam pontos de pressão e arranhões reais.
- `xrandr` e `/sys/class/drm/` confirmam que o painel está saudável; não detectam a película, mas detectam anomalias de display.
- Troque a película a cada 12-18 meses ou ao primeiro sinal de trinca, descolamento ou perda oleofóbica.

## Exercícios

1. Identifique o tipo de película que está no seu Deck (ou, se não tiver, classifique o painel puro). O painel é LCD ou OLED? Isso influencia sua escolha de película?
2. Inspecione visualmente sua tela com fundo branco e brilho máximo. Há bolhas, trincas, ou marcas de desgaste oleofóbico?
3. Leia o EDID do painel com `cat /sys/class/drm/card0-eDP-1/edid | xxd` e localize os primeiros 8 bytes (cabeçalho EDID). O que o cabeçalho confirma sobre o painel?
4. Se tiver uma película instalada, pressione levemente cada borda com a unha. Alguma está descolando? Descreva o que acontece com poeira acumulada numa borda descolada ao longo de semanas.
5. **Desafio.** Compare duas situações de iluminação: brilho máximo com fundo branco e brilho mínimo com fundo preto. Em cada cenário, observe reflexos e artefatos visuais da película. Com base no que você sabe sobre o painel (LCD ou OLED) e o material da película, explique por que certos artefatos aparecem mais num cenário que no outro.