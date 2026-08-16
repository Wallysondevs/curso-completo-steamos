O Steam Deck tem uma tela sensível ao toque de 7 polegadas, suporte a caneta stylus capacitiva e GPU suficiente para lidar com telas de pintura digital de alta resolução. Parece um ambiente improvável para desenho digital, mas o Krita — o ilustrador profissional do KDE — transforma o Deck em um sketchbook portátil. Conectado a um monitor externo e uma mesa digitalizadora via dock, ele vira uma estação de ilustração completa.

:::objetivos
- Instalar o Krita e configurar a interface para a tela pequena do Deck
- Entender camadas, pincéis e seleções no fluxo de desenho digital
- Conectar uma mesa digitalizadora via USB e configurar sensibilidade de pressão
- Exportar arte em formatos adequados para publicação e impressão
:::

## Instalação e adaptação da interface

O Krita está no Flathub e é mantido pela própria equipe do KDE. A instalação é direta:

```terminal
$ flatpak install flathub org.kde.krita
Looking for matches…
org.kde.krita/x86_64/stable           5.2.6     flathub
Proceed with these changes to the system? [Y/n]: y
Installation complete.
```

Na primeira execução, o Krita abre com a área de trabalho padrão: tela em branco no centro, caixa de ferramentas à esquerda, painéis de camadas e pincéis à direita. Na tela de 1280×800 do Deck, essa disposição ocupa muito espaço. Ajuste:

1. Vá em Configurações → Gerenciador de temas e selecione um tema escuro (consome menos brilho e é mais confortável para desenhar).
2. Em Configurações → Barras de ferramentas, desabilite as barras que você não usa.
3. Use a tecla [[Tab]] para alternar entre o modo "interface cheia" e "só a tela" — no modo compacto, todos os painéis somem e você vê apenas a arte, como no modo de apresentação.

O touchscreen do Deck responde bem ao Krita. Deslizar com o dedo pinta com o pincel selecionado; pinça com dois dedos dá zoom e rotaciona a tela. Para precisão, no entanto, dedo não substitui caneta — a ponta do dedo é larga demais para traços finos.

## Camadas, pincéis e o básico do fluxo

O Krita é um editor de pintura digital baseado em camadas — como o Photoshop, mas especializado em ilustração e concept art. Cada camada é uma folha transparente empilhada sobre as outras, e o resultado final é a soma visível de todas elas.

Os conceitos essenciais que você usa em toda sessão:

- **Camada de pintura (`Paint Layer`):** a camada comum, onde você pinta com pincéis.
- **Camada de vetor (`Vector Layer`):** texto, formas geométricas e curvas Bézier, redimensionáveis sem perda.
- **Máscara de camada (`Filter Mask` / `Transparency Mask`):** esconde partes da camada sem apagá-las — pintar de preto na máscara torna a região transparente.
- **Modo de mesclagem (`Blending Mode`):** controla como a camada interage com as de baixo. "Multiply" escurece (útil para sombras), "Screen" clareia, "Overlay" aumenta contraste.

O Krita vem com dezenas de pincéis prontos — o seletor de pincéis (atalho [[F6]]) mostra ícones com o traço de cada um. Os mais usados:

| Pincel | Uso |
|---|---|
| `b) Basic-5 Size` | Traço padrão, sensível a pressão |
| `i) Ink-3 Gpen` | Line art, traço firme |
| `k) Blender Basic` | Esfumar, suavizar transições |
| `p) Pencil-2` | Esboço a lápis |
| `w) Wet Circle` | Tinta úmida, mistura cores |

:::dica
Se você não tem mesa digitalizadora, use o touchpad direito do Deck como área de desenho. No modo Desktop, configure o touchpad como mouse e use o gatilho `R2` para clicar e arrastar — é rudimentar, mas funciona para esboços rápidos. Para traços mais longos, o touchscreen com o dedo é mais natural.
:::

## Mesa digitalizadora no Deck

O verdadeiro salto de qualidade vem com uma mesa digitalizadora USB — Wacom, Huion, XP-Pen e Gaomon têm excelente suporte no Linux. Conecte a mesa ao dock ou diretamente à porta USB-C do Deck (com adaptador) e o kernel a reconhece como dispositivo de entrada.

```terminal
$ lsusb | grep -i wacom
Bus 003 Device 005: ID 056a:0374 Wacom Co., Ltd CTL-672
$ xsetwacom --list devices
Wacom One by Wacom M Pen stylus   id: 12  type: STYLUS
Wacom One by Wacom M Pen eraser   id: 13  type: ERASER
```

O Krita detecta automaticamente a pressão da caneta. Para verificar: vá em Configurações → Configurar o Krita → Configurações da mesa digitalizadora. Se a curva de pressão estiver muito dura ou muito mole, ajuste o gráfico ali mesmo — arraste os pontos para cima (mais sensível) ou para baixo (mais firme).

:::atencao
Mesas Wacom mais antigas (modelos Bamboo, Intuos 3) podem precisar do driver `input-wacom` ou de configuração manual via `xsetwacom`. Se a pressão não funcionar, verifique se o pacote `libwacom` está presente:

```terminal
$ flatpak run --command=sh org.kde.krita -c 'ls /run/host/usr/share/libwacom/'
```
Se o diretório existir, o Krita Flatpak enxerga as definições da mesa. Caso contrário, instale `libwacom` no sistema com `sudo apt install libwacom9`.
:::

## Exportação para publicação e impressão

O Krita salva no formato nativo `.kra`, que preserva camadas, máscaras e histórico. Para publicar ou compartilhar, você exporta para formatos planos: PNG (web, sem perda), JPEG (web, compactado) ou TIFF (impressão, sem perda, alta profundidade de cor).

Vá em Arquivo → Exportar… (`[[Ctrl+Shift+E]]`) e escolha o formato. Para impressão, configure o espaço de cor como CMYK em Imagem → Propriedades da imagem → Modelo de cor antes de começar a pintar — converter RGB para CMYK no final altera as cores.

```terminal
$ ls -lh arte-final.*
-rw-r--r-- 1 deck deck 2.4M Mar 15 14:22 arte-final.kra
-rw-r--r-- 1 deck deck 1.1M Mar 15 14:23 arte-final.png
```

O arquivo `.kra` é maior porque guarda tudo. O `.png` é achatado (sem camadas) para distribuição. Guarde sempre o `.kra` — você pode querer editar depois.

## Resumo

- O Krita é instalado com `flatpak install flathub org.kde.krita` e funciona com touchscreen e touchpad no Deck.
- O fluxo de pintura digital é baseado em camadas, máscaras e modos de mesclagem; o Krita oferece dezenas de pincéis configuráveis.
- Mesas digitalizadoras USB (Wacom, Huion, XP-Pen) são reconhecidas pelo kernel e funcionam com sensibilidade de pressão.
- Salve sempre como `.kra` (com camadas) e exporte para PNG, JPEG ou TIFF conforme o destino.
- Com dock + monitor externo + mesa digitalizadora, o Deck é uma estação de ilustração compacta e funcional.

## Exercícios

1. Instale o Krita e crie uma tela nova de 1920×1080. Experimente três pincéis diferentes (Basic, Ink, Blender) e desenhe algo simples com o touchscreen ou touchpad.
2. Crie uma ilustração com pelo menos três camadas: esboço, line art e cor. Altere o modo de mesclagem da camada de cor para "Multiply" e veja o efeito.
3. Conecte uma mesa digitalizadora via USB e verifique se a pressão funciona. Use o comando `xsetwacom --list devices` no terminal para confirmar que o dispositivo foi detectado.
4. Exporte sua arte nos formatos PNG e JPEG. Compare os tamanhos com `ls -lh` e explique por que o JPEG é menor.
5. **Desafio.** Crie uma tela em CMYK (Imagem → Propriedades da imagem → Modelo de cor), pinte algo colorido e exporte como TIFF. Depois, converta para RGB e exporte como PNG. As cores mudaram? Por quê?