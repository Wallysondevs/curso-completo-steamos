O Blender é o canivete suíço da computação gráfica 3D: modelagem, escultura, animação, simulação de física, renderização e edição de vídeo — tudo num aplicativo só. A pergunta natural é: "roda no Steam Deck?" A resposta é sim, e com mais competência do que o hardware modesto sugere. A APU AMD Zen 2 + RDNA 2 tem quatro núcleos de CPU e oito unidades de computação gráfica — é a mesma arquitetura dos consoles da geração atual, em escala reduzida.

:::objetivos
- Instalar o Blender e configurar a viewport para desempenho no Deck
- Navegar na interface 3D com os controles do Deck ou teclado e mouse
- Entender as limitações da APU e configurar o Cycles para renderização viável
- Modelar, texturizar e renderizar uma cena simples
:::

## Instalação e primeiras impressões

O Blender está disponível como Flatpak oficial, mantido pela Blender Foundation:

```terminal
$ flatpak install flathub org.blender.Blender
Looking for matches…
org.blender.Blender/x86_64/stable     4.2.1     flathub
Proceed with these changes to the system? [Y/n]: y
Installation complete.
```

Ao abrir, o Blender exibe sua cena padrão: um cubo cinza, uma luz pontual e uma câmera, tudo sobre um grid. A interface é densa — botões em todos os cantos — e na tela de 7 polegadas do Deck ela fica espremida. A primeira configuração que você deve fazer é em Edit → Preferences → Interface → Resolution Scale: reduza para 0.8 ou 0.9. Os ícones e fontes diminuem, mas a viewport ganha espaço.

Para navegar na cena 3D, os controles essenciais dependem de teclado e mouse com três botões — exatamente o que você tem com um dock. No modo portátil, a experiência é viável para tarefas simples (ajustar uma cena existente, verificar um modelo), mas modelagem séria pede monitor, teclado e mouse.

## Navegação 3D: o básico que você usa sempre

O Blender tem uma lógica de navegação que assusta no início, mas vira memória muscular em poucos dias:

| Ação | Atalho |
|---|---|
| Rotacionar a vista | `[[Botão do meio]]` + arrastar |
| Mover a vista (pan) | `[[Shift+Botão do meio]]` + arrastar |
| Zoom | Roda do mouse (`[[Scroll]]`) |
| Selecionar objeto | `[[Botão esquerdo]]` |
| Menu de contexto | `[[Botão direito]]` |
| Alternar vista ortográfica/perspectiva | `[[5]]` (teclado numérico) |
| Vista frontal / lateral / topo | `[[1]]` / `[[3]]` / `[[7]]` (teclado numérico) |

Se você não tem teclado numérico (teclados compactos, como a maioria dos teclados Bluetooth usados com Deck), vá em Edit → Preferences → Input → Keyboard e ative "Emulate Numpad". Isso faz as teclas numéricas comuns (`1`, `3`, `7`, etc.) funcionarem como as do numpad.

No modo portátil (sem teclado), segure o botão Steam e use o touchpad direito como mouse. O `D-Pad` pode ser mapeado para vistas comuns via Edit → Preferences → Keymap.

## Modelagem de uma cena simples

Vamos construir algo concreto: uma caneca sobre uma mesa. Os passos ilustram o fluxo básico do Blender:

1. **Apague o cubo padrão:** selecione com `[[Botão esquerdo]]`, `[[X]]` → Delete.
2. **Adicione um cilindro:** `[[Shift+A]]` → Mesh → Cylinder. No painel inferior esquerdo, ajuste Vertices para 64 (bordas mais suaves).
3. **Modele a caneca:** entre em Edit Mode (`[[Tab]]`), selecione a face superior (`[[3]]` para Face Select, clique na face do topo), `[[I]]` para Inset (cria um anel interno), `[[E]]` para Extrude e empurre para baixo (cria o interior oco).
4. **Adicione a alça:** `[[Shift+A]]` → Mesh → Torus. Posicione com `[[G]]` (grab/move), `[[R]]` (rotate), `[[S]]` (scale).
5. **Adicione um plano para a mesa:** `[[Shift+A]]` → Mesh → Plane, `[[S]]` para escalar.

```terminal
$ ls -lh caneca.blend
-rw-r--r-- 1 deck deck 1.4M Mar 15 15:30 caneca.blend
```

O arquivo `.blend` é autocontido: guarda geometria, materiais, texturas, iluminação e configurações de render — tudo num único arquivo binário.

:::dica
O Blender tem um sistema de undo virtualmente infinito: `[[Ctrl+Z]]` desfaz até onde a RAM aguentar. No Deck, com cenas leves, você pode desfazer centenas de passos. Para refazer: `[[Ctrl+Shift+Z]]`.
:::

## Renderização: Cycles no Deck

O Blender oferece dois motores de renderização: **Eevee** (tempo real, rápido, baseado em rasterização) e **Cycles** (traçado de raios, foto-realista, pesado). A recomendação para o Deck é clara: use Eevee para a viewport e para renders de teste; só mude para Cycles quando a cena estiver pronta para o render final.

No Cycles, a APU do Deck renderiza usando a GPU via HIP (AMD ROCm). Para ativar: Edit → Preferences → System → Cycles Render Devices, marque "AMD Radeon Graphics (HIP)". O Blender Flatpak já inclui o backend HIP.

```terminal
$ flatpak run org.blender.Blender --debug-cycles 2>&1 | grep -i 'device\|hip\|gpu'
Found device: AMD Radeon Graphics (RADV VANGOGH) (HIP)
```

Com HIP ativado, uma cena de 500 mil triângulos renderiza em Cycles a 128 samples em cerca de 3 a 5 minutos — comparado a 20–30 minutos usando só a CPU. Não é rápido (uma GPU dedicada faria em segundos), mas é perfeitamente usável para aprendizado e projetos pessoais.

:::atencao
Cenas com muitos objetos, texturas 8K ou simulações de física (fluidos, tecidos, fumaça) podem consumir toda a RAM do Deck e travar o sistema. O Blender não tem limite rígido de memória — ele usa o que precisar até o kernel matar o processo (OOM Killer). Monitore com `htop` durante renders pesados. Se a RAM passar de 14 GB, cancele (`[[Esc]]`) e otimize a cena.
:::

## Configurações que fazem diferença no Deck

Algumas escolhas têm impacto desproporcional no desempenho:

- **Tamanho dos tiles de render:** Em Performance → Tiles, use 32×32 ou 64×64 pixels para GPU — tiles pequenos mantêm a APU ocupada sem estourar a VRAM.
- **Simplify:** Em Render Properties → Simplify, ative e defina um limite de subdivisão (Max Subdivision: 2 ou 3). Isso reduz a complexidade geométrica durante o render sem alterar o modelo.
- **Light bounces:** Reduza o número de ricochetes de luz no Cycles. O padrão é 12; valores entre 4 e 6 são quase indistinguíveis visualmente na maioria das cenas e cortam o tempo de render pela metade.
- **Texturas:** Use resoluções de 2K (2048×2048) em vez de 4K ou 8K. A tela do Deck tem 800p e monitores comuns são 1080p — texturas 8K só fariam diferença em close-ups extremos ou renders para impressão.

## Resumo

- O Blender é instalado com `flatpak install flathub org.blender.Blender` e funciona tanto no modo portátil quanto com dock.
- A navegação 3D depende de mouse com botão do meio, teclado e atalhos do numpad (emuláveis nas teclas comuns).
- Use Eevee para previews e Cycles para renders finais; ative o backend HIP para usar a GPU integrada do Deck.
- Limite subdivisões (Simplify), reduza light bounces e use texturas 2K para manter o desempenho sob controle.
- Com dock + monitor + teclado, o Deck é uma estação 3D de entrada; sem dock, serve para ajustes e visualização.

## Exercícios

1. Instale o Blender e apague o cubo padrão. Adicione um cilindro, uma esfera e um plano. Pratique mover (`[[G]]`), rotacionar (`[[R]]`) e escalar (`[[S]]`) cada objeto.
2. Ative o backend HIP em Edit → Preferences → System e verifique se a GPU do Deck é detectada como dispositivo Cycles. Rode o comando `flatpak run org.blender.Blender --debug-cycles 2>&1 | grep -i hip` para confirmar.
3. Modele uma caneca como descrito na seção (cilindro + torus + plano). Aplique um material de cor sólida e renderize com Eevee (`[[F12]]`). Quanto tempo levou?
4. Renderize a mesma cena com Cycles a 64 samples (Render Properties → Sampling → Render). Compare o tempo com o render do Eevee. A diferença visual compensa?
5. **Desafio.** Baixe um modelo gratuito do Sketchfab (formato `.blend`) e abra no Deck. Verifique a contagem de triângulos (barra inferior, clique em "Faces" para alternar para "Triangles"). Se passar de 1 milhão, ative Simplify com Max Subdivision 2 e renderize com Cycles a 32 samples. O Deck deu conta ou travou?