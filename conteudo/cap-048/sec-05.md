Um jogo de console antigo não foi feito para a tela nítida e perfeita de um Steam Deck. Ele foi desenhado para um CRT de fósforo, com varredura de linhas, brilho suave e certa imprecisão de cor que os artistas levavam em conta na hora de compor cada sprite. Os **shaders** do RetroArch existem para devolver essa cara ao jogo — e o paraíso dos shaders é justamente recriar o visual dos televisores de tubo.

:::objetivos
- Entender o que é um shader e por que ele muda a aparência da emulação
- Baixar shaders pelo Online Updater e navegar pela biblioteca `.slang`
- Aplicar e ajustar um shader CRT clássico (scanlines + máscara de fósforo)
- Salvar a preferência de shader via override por núcleo
- Diferenciar shaders simples de cadeias (*chain*) de passadas múltiplas
:::

## Por que um shader muda tudo

O RetroArch renderiza o jogo numa resolução nativa baixa (por exemplo 256×224 no SNES) e depois a amplia para a tela de 1280×800 do Deck. Sem shader, essa ampliação usa um filtro bilinear que borra a imagem ou um *nearest-neighbor* que deixa os pixels duros. O shader é um programa que roda na GPU e decide, pixel a pixel, como apresentar a imagem final.

O ganho não é só nostálgico. Um shader CRT faz três coisas que os artistas da época já esperavam: adiciona **scanlines** (as linhas escuras entre as linhas de varredura), aplica uma **máscara de fósforo** (o padrão de pontos RGB do tubo) e adiciona brilho e *bloom* suaves. O resultado é a imagem "como ela foi pensada".

```terminal
$ ls ~/.var/app/org.libretro.RetroArch/config/retroarch/shaders/shaders_slang/
crt/    handheld/   misc/   presets/
```

No Deck, o formato usado é o **Slang** (`.slang`), que casa com o driver Vulkan — o recomendado para o aparelho.

## Baixando a biblioteca de shaders

Os shaders não vêm na instalação; são baixados pelo *Online Updater > Update Slang Shaders*. Dependendo da quantidade, o download pode levar alguns minutos, porque são centenas de arquivos.

```terminal
$ du -sh ~/.var/app/org.libretro.RetroArch/config/retroarch/shaders/shaders_slang/
184M	shaders_slang/
```

Dentro de `crt/` moram os clássicos: `crt-easymode`, `crt-geom`, `crt-royale`, `crt-aperture` e outros. Cada um é um arquivo `.slangp` (um *preset*) que pode apontar para uma ou mais passadas.

```terminal
$ ls shaders_slang/crt/
crt-aperture.slangp   crt-easymode.slangp  crt-geom.slangp
crt-lottes.slangp     crt-royale.slangp    crt-hyllian.slangp
```

:::dica
Para um primeiro contato, `crt-easymode` ou `crt-geom` são ótimos: leves, bonitos e sem requerer configuração. O `crt-royale` é o mais fiel, mas pesa mais na GPU — no Deck 1280×800 ele ainda roda bem.
:::

## Shaders portáteis versus tela do Deck

O Deck tem tela de 7 polegadas a 1280×800. Numa tela pequena e densa assim, a diferença entre um crt pesado e um leve é menos visível do que num monitor de 27 polegadas — mas a curvatura e a máscara de fósforo continuam perceptíveis, sobretudo em jogos com sprites grandes e cores chapadas.

```terminal
$ cat shaders_slang/handheld/lcd-grid-v2.slangp
shaders = "1"
shader0 = "shaders_slang/handheld/shaders/lcd-grid-v2.slang"
```

Há também a categoria `handheld/`, pensada para consoles portáteis: ela emula a grade de pixels das telas LCD do Game Boy e do GBA, que é outro tipo de "visual CRT" — o de matriz passiva, com linhas e pontos bem visíveis.

## Aplicando e ajustando um shader CRT

Com um jogo aberto, o caminho é *Quick Menu > Shaders > Load*. Navegue até `shaders_slang/crt/crt-geom.slangp` e veja a tela mudar na hora. A partir daí, certos parâmetros são ajustáveis dentro do próprio menu de shader, como a intensidade das scanlines.

```terminal
$ cat ~/.var/app/org.libretro.RetroArch/config/retroarch/shaders/shaders_slang/crt/crt-geom.slangp | head -5
shaders = "1"
shader0 = "shaders_slang/crt/shaders/crt-geom.slang"
scale_type0 = "viewport"
scale0 = "1.0"
```

O `.slangp` é só um arquivo de texto que declara quantas passadas a cadeia tem e quais arquivos `.slang` executar. A cadeia `crt-royale`, por exemplo, encadeia quatro ou cinco passadas — por isso é mais cara.

:::atencao
Para o shader aplicar corretamente, o *Settings > Video > Scaling > Integer Scale* importa: se a escala inteira estiver desligada, as scanlines podem "bater" torto no pixel. Ligue a escala inteira para uma imagem CRT limpa.
:::

## Salvando o shader por núcleo

Shaders também entram no sistema de overrides da seção anterior. O ideal é definir um shader de SNES e não deixá-lo vazar para o Game Boy, que tem aspecto e resolução diferentes.

```text
Quick Menu > Shaders > Load (crt-geom) > Overrides > Save Core Overrides
```

Depois disso, todo jogo daquele núcleo abre com o shader, sem precisar aplicar de novo. O shader fica gravado no override do núcleo como `video_shader_enable` e o caminho do `.slangp`.

:::dica
Crie um *global* para um "shader padrão seguro" e overrides por núcleo para as exceções. Assim o primeiro jogo de um console novo já sai com visual decente e você só afina os casos especiais.
:::

## Resumo

- Shaders são programas na GPU que recriam a aparência original, incluindo scanlines e máscara de fósforo.
- No SteamOS o formato é Slang (`.slang`/`.slangp`) e casa com o driver Vulkan.
- A biblioteca de shaders é baixada por *Online Updater > Update Slang Shaders*.
- `crt-geom` e `crt-easymode` são boas portas de entrada; `crt-royale` é o mais fiel e pesado.
- Salve o shader via *Save Core Overrides* para que ele valha só para aquele emulador.

## Exercícios

1. Baixe a biblioteca de shaders Slang e navegue até a pasta `crt/` pelo terminal para listar os presets disponíveis.
2. Aplique `crt-geom` a um jogo de SNES e observe a diferença ligando e desligando a escala inteira.
3. Experimente `crt-royale` e compare o custo visual e de desempenho com o `crt-geom`.
4. Salve um shader CRT como core override para o SNES e confirme o campo `video_shader` no arquivo de override.
5. **Desafio.** Monte um shader próprio de scanlines a partir de uma cadeia simples e ajuste um parâmetro (intensidade ou curvatura) editando os valores no menu para deixá-lo "do seu jeito".
