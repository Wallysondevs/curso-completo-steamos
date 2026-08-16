O Cemu emula o Wii U, o console que mais depende de shaders compilados em tempo real — e isso molda toda a experiência no Steam Deck. A primeira vez que você joga um título, ele engasga enquanto o emulador compila os shaders; da segunda em diante, o cache está pronto e o jogo flui. Entender esse ciclo, e a pasta onde o cache vive, é a chave para transformar o Cemu de "travado" em "liso". O projeto também viveu uma transição importante nos últimos anos, e saber qual versão você usa evita armadilhas.

:::objetivos
- Instalar o Cemu e compreender a transição para builds nativas de Linux
- Configurar o backend gráfico Vulkan e o graphic pack
- Dominar o cache de shaders e o modo assíncrono
- Mapear o GamePad do Wii U no controle do Deck
- Diagnosticar stutter de primeira execução versus bug real
:::

## Duas eras do Cemu

O Cemu nasceu como projeto de código fechado para Windows, o que o deixou décadas atrasado no Linux. Em 2022 o autor abriu o código, e desde então surgiram builds nativas de Linux (e, no SteamOS, o Flatpak). É essencial saber que a versão atual do seu Deck é a nativa, e não uma versão antiga rodando via Wine.

```terminal
$ flatpak run net.kuribo64.cemu --version
Cemu 2.0 (experimental)
```

A mudança importante da versão 2.0 em diante: além do Linux nativo, o suporte a **Vulkan** virou o backend recomendado, substituindo progressivamente o OpenGL que era a única opção antiga.

## Backend e graphic packs

Em *Options → Graphics*, escolha **Vulkan** e a resolução interna. O recurso que substitui as configurações de aumento de resolução é o **graphic pack** — um pacote de modificações (textura, resolução, correções de câmera) que você ativa por jogo.

```terminal
$ flatpak run net.kuribo64.cemu
[Graphics] Vulkan backend selected
[GraphicPacks] Loaded 3 packs for 00050000101c9500
```

O graphic pack moderno é descrito em `rules.txt` e pode subir a resolução, destravar o FPS e aplicar filtros. É a forma recomendada de melhorar o visual no Deck, em vez de mexer manualmente nas opções.

| Ajuste | Valor recomendado |
|---|---|
| Graphics API | Vulkan |
| Scaled Resolution | 1920×1080 (via graphic pack) |
| Async Shader Compile | ON |
| VSync | ON |

## O cache de shaders e o modo assíncrono

O Wii U carrega shaders específicos que não podem ser pré-compilados integralmente, então o Cemu os compila sob demanda. No primeiro contato com cada efeito, há uma pausa — o famoso stutter. O cache salvo transforma as execuções seguintes em experiência limpa.

```terminal
$ ls ~/.var/app/net.kuribo64.cemu/data/cemu/shaderCache/
00050000101c9500.bin
```

A opção **Async Shader Compile** (`async`) muda esse comportamento: em vez de pausar o jogo para compilar, o Cemu compila em segundo plano e o efeito aparece quando fica pronto. Isso remove quase todo o stutter, ao custo de ver alguns objetos "pipando" por um instante na primeira vez.

:::dica
O cache de shaders é **por build do Cemu** e por driver. Se você atualizar o Cemu ou o driver de vídeo, o cache pode ser invalidado e o stutter da primeira execução volta. Por isso, jogar o tutorial de um título após uma atualização é normal — não é regressão.
:::

## Mapeando o GamePad

O Wii U exigia o GamePad — o controle com tela — para muitos jogos. No Steam Deck, a tela do GamePad é emulada como uma janela ou sobreposição, e o controle físico do aparelho vira o GamePad lógico.

```terminal
$ flatpak run net.kuribo64.cemu
[Input] GamePad emulated via Steam Deck controller
```

O toque na tela do GamePad (necessário em jogos como *Super Mario Maker* ou *Nintendo Land*) é simulado pelo toque da tela **touch** do próprio Deck no modo Desktop, ou pelo touchpad no modo Gaming. Mapeie o botão de *TV/GamePad switch* para alternar a visão entre as duas telas.

:::atencao
No modo Gaming do Steam Deck, a tela é única e pequena para caber "TV + GamePad" lado a lado. A maioria das pessoas usa o modo Desktop para jogos de Wii U que dependem do GamePad, onde dá para controlar a janela e o toque com mais precisão.
:::

## Diagnóstico: stutter vs bug

O erro mais comum de iniciantes no Cemu é confundir stutter de shader com bug de desempenho. A distinção prática: o stutter de shader acontece **uma vez por efeito** e desaparece ao revisitar a mesma cena; o bug de desempenho se repete sempre, no mesmo lugar.

```terminal
$ flatpak run net.kuribo64.cemu 2>&1 | grep -iE 'shader|compile'
```

Se a linha de compilação aparece a cada execução no mesmo efeito, o cache não está sendo salvo (permissão de escrita no Flatpak). Se o FPS cai sempre no mesmo local sem compilação em curso, aí é ajuste de resolução ou graphic pack pesado demais.

## Resumo

- O Cemu migrou de código fechado para nativo no Linux, e a versão 2.0 traz Vulkan como backend recomendado.
- Os graphic packs substituem os ajustes manuais e sobem resolução, corrigem câmera e destravam FPS.
- O stutter de primeira execução vem da compilação de shaders; o cache salvo elimina nas execuções seguintes.
- O modo assíncrono compila em segundo plano e remove a pausa, ao custo de efeitos que "pipam" por instante.
- O cache é invalidado por build e por driver; stutter após atualização é normal, não regressão.

## Exercícios

1. Verifique a versão do seu Cemu e confirme que é uma build nativa (2.0+), não uma antiga via Wine.
2. Jogue a primeira fase de um título duas vezes seguidas e compare o stutter entre as duas execuções.
3. Ative e desative o *Async Shader Compile* e descreva a diferença no comportamento visual.
4. Localize a pasta `shaderCache` e identifique qual arquivo corresponde ao seu jogo.
5. **Desafio.** Atualize o Cemu e observe o retorno do stutter. Explique, a partir do ciclo de compilação de shaders, por que o cache antigo não pode ser reutilizado e por que isso não significa que o emulador "piorou".
