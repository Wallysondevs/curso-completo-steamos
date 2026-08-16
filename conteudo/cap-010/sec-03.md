Nem toda execução do Gamescope precisa tomar conta do painel inteiro. Durante o desenvolvimento, o debugging e — para nós — o estudo, é muito mais conveniente rodar o Gamescope dentro de uma janela do seu ambiente gráfico normal. Essa capacidade, chamada de *modo janela aninhado* (*nested mode*), transforma o Gamescope de uma barreira entre você e o sistema num laboratório controlado onde dá para testar flags, resoluções e filtros sem sair do Modo Desktop.

:::objetivos
- Entender o conceito de compositor aninhado e como o Gamescope implementa o modo nested
- Lançar o Gamescope como janela X11/Wayland com a flag `-n`
- Rodar aplicações Vulkan e OpenGL dentro do ambiente aninhado
- Diagnosticar o comportamento da GPU entre o compositor hospedeiro e o Gamescope
- Usar o modo nested como ferramenta de desenvolvimento e teste
:::

## Dois compositores na mesma máquina

No Modo Desktop do SteamOS, o KWin é o compositor ativo: ele fala com o DRM, gerencia o painel e cuida das janelas. Quando você lança o Gamescope com `-n` (de *nested*), ele não briga com o KWin pelo controle do DRM. Em vez disso, ele se comporta como uma aplicação comum — abre uma janela no KWin e, dentro dessa janela, age como um compositor Wayland independente com seu próprio servidor XWayland, seu próprio loop de renderização e seus próprios filtros.

```terminal
$ gamescope -n -w 960 -h 600 -W 960 -H 600 -- glxgears
```

Neste exemplo, o Gamescope abre uma janela de 960×600 no KWin. Dentro dessa janela, `glxgears` roda num servidor XWayland gerenciado pelo Gamescope. As engrenagens giram exatamente como girariam no Modo Jogo, mas tudo fica contido numa janela que você pode mover, redimensionar e fechar com `[[Alt+F4]]`.

O par `-w`/`-h` igual a `-W`/`-H` significa que não há upscaling — o framebuffer interno tem o mesmo tamanho da janela de saída. O `-n` é o que faz tudo acontecer como janela em vez de tomar o DRM.

## O que roda e o que não roda no modo nested

Quase tudo que funciona no Modo Jogo funciona no modo nested, com uma exceção importante: você não tem acesso direto ao DRM. Isso significa que certas flags como `--generate-drm-mode`, `--adaptive-sync` e `--hdr-enabled` não surtem efeito, porque elas dependem de negociar modos de vídeo diretamente com o kernel — e no modo nested, quem faz essa negociação é o KWin, não o Gamescope.

```terminal
$ gamescope -n -w 1280 -h 800 --fsr -- vkmark --benchmark 60
wlserver: [backend/headless/backend.c:68] Creating headless backend
vblank: Using timerfd
```

As mensagens `headless backend` e `timerfd` indicam que o Gamescope está operando sem DRM: ele usa um backend headless do wlroots e simula os intervalos de vblank com um timer. Para testes de upscaling, isso é perfeitamente adequado. Para medições precisas de latência, não — porque o caminho até o painel inclui o buffer extra do KWin.

:::atencao
No modo nested, o Gamescope usa o backend **headless** do wlroots. Isso significa que ele não tem aceleração de hardware para a composição final — a janela do Gamescope no KWin é atualizada por CPU via memória compartilhada (DMA-BUF quando disponível). Para benchmarks de performance, o modo nested introduz uma penalidade variável; prefira o Modo Jogo para medições confiáveis.
:::

## Debugando aplicações com o modo nested

A maior vantagem do modo nested para desenvolvimento é poder inspecionar o que está acontecendo sem perder o controle do sistema. Se uma aplicação trava no Modo Jogo, você pode perder a sessão inteira e cair para o SDDM. No modo nested, a aplicação trava dentro da janela, e você continua com terminal, navegador e ferramentas de diagnóstico abertas.

```terminal
$ gamescope -n -w 1280 -h 800 --fsr -- vkcube
Selected GPU 0: AMD Radeon Graphics (RADV VANGOGH), type: IntegratedGpu
vblank: Using timerfd
[gamescope] vkEnumeratePhysicalDevices returned 1 devices
```

O log do Gamescope no terminal mostra qual GPU foi selecionada, qual driver Vulkan está em uso (RADV, o driver open-source da AMD) e como o vblank está sendo gerenciado. Se algo der errado, você vê a mensagem de erro no terminal imediatamente, sem precisar catar logs no `journalctl`.

:::dica
Combine o modo nested com `MANGOHUD=1` para ver o overlay de performance mesmo no Modo Desktop. Como o Gamescope é o pai do processo, o MangoHud funciona normalmente — ele detecta o Vulkan ou OpenGL da aplicação filha e injeta o overlay.
:::

## Aninhando múltiplos Gamescopes

Uma curiosidade do modo nested é que você pode aninhar Gamescopes recursivamente — um dentro do outro, como bonecas russas. Cada nível adiciona seu próprio buffer, seu próprio XWayland e seu próprio loop de composição:

```terminal
$ gamescope -n -w 1024 -h 768 -W 1024 -H 768 -- gamescope -n -w 800 -h 600 -W 800 -H 600 -- glxgears
```

Isso não tem utilidade prática no Steam Deck (a não ser para entender a arquitetura), mas demonstra um ponto importante: cada Gamescope é um compositor completo, e eles são independentes. O de fora não sabe que o de dentro está rodando outro Gamescope — para ele, é só uma aplicação Wayland comum.

## Resumo

- O modo nested (`-n`) faz o Gamescope rodar como janela dentro do compositor hospedeiro (KWin), sem tomar o DRM.
- No modo nested, o Gamescope usa o backend headless do wlroots: sem aceleração de composição por hardware, vblank via timerfd.
- Flags que dependem de DRM (`--hdr-enabled`, `--adaptive-sync`) não funcionam no modo nested.
- O modo nested é a ferramenta ideal para testar flags, resoluções e aplicações sem risco de perder a sessão gráfica.
- É possível aninhar Gamescopes recursivamente, mas sem utilidade prática além da demonstração arquitetural.

## Exercícios

1. No Modo Desktop do Steam Deck, execute `gamescope -n -w 800 -h 600 -W 800 -H 600 -- glxgears`. Mova a janela e redimensione-a. O que acontece com as engrenagens?
2. Lance `gamescope -n -w 640 -h 400 -W 1280 -H 800 --fsr -- vkmark` e compare a qualidade visual com a execução sem `--fsr`. A diferença é perceptível no modo nested?
3. Abra dois terminais. No primeiro, execute `gamescope -n -w 1024 -h 768 -- vkcube`. No segundo, execute `pstree -p $(pgrep gamescope)`. Identifique o XWayland e o `vkcube` na árvore.
4. No modo nested, tente usar `--hdr-enabled`. Leia o erro no terminal e explique por que o DRM é necessário para HDR.
5. **Desafio.** Aninhe dois Gamescopes e, no mais interno, execute `vulkaninfo --summary`. Compare o output com `vulkaninfo --summary` rodando diretamente no KWin. Existem diferenças nas capacidades Vulkan reportadas? Investigue o motivo.