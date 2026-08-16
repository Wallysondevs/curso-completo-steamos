A tela do Steam Deck tem 7 polegadas e resolução de 1280×800 pixels — compacta e nítida, mas também um desafio para quem tem baixa visão. Texto pequeno demais, botões com bordas sutis ou ícones que se confundem com o fundo tornam a navegação frustrante. É por isso que o SteamOS oferece um modo de **alto contraste** e opções de tema que redesenham a paleta da interface para maximizar a legibilidade sem depender de correção externa.

:::objetivos
- Ativar o modo de alto contraste no Modo Jogo e no desktop KDE
- Entender como o contraste altera a renderização dos elementos de UI
- Verificar a escala de brilho e contraste do painel pelo terminal
- Avaliar a legibilidade com comandos rápidos de inspeção de tema
- Comparar o contraste do Modo Jogo com as opções de tema escuro e claro
:::

## O modo de alto contraste do SteamOS

No menu de Acessibilidade do Modo Jogo, a opção **Alto contraste** (ou *High Contrast*) troca a paleta da interface. Ela substitui cores suaves e gradientes por combinações binárias — texto branco sobre fundo preto, ícones com bordas grossas, linhas de separação bem definidas. O resultado visual é mais duro, mas muito mais fácil de distinguir.

A ativação é imediata e não exige reinicialização. Por baixo, a chave `SteamUIHighContrast` grava a escolha no mesmo `config.vdf`:

```terminal
$ grep -i "contrast\|HighContrast" ~/.local/share/Steam/config/config.vdf
"SteamUIHighContrast"		"1"
```

Quando ativado, o SteamOS ajusta não só cores mas também elementos estruturais: as bordas dos cartões de jogo ganham stroke; os menus laterais exibem separadores entre linhas; thumbnails ganham outline quando selecionados. É um pacote completo, não apenas um filtro de cor.

## Contraste na Área de Trabalho: tema do KDE

Fora do Modo Jogo, o KDE Plasma oferece temas que vão do suave Breeze Claro ao Breeze Escuro, e uma opção de alto contraste (*Breeze High Contrast*) que aplica a mesma lógica de cores binárias. A troca é feita em **Configurações do Sistema → Aparência → Tema Global**.

Para inspecionar o tema atual pelo terminal, o KDE expõe a configuração via `kreadconfig5`, que lê o arquivo `~/.config/kdeglobals`:

```terminal
$ kreadconfig5 --group KDE --key widgetStyle
Breeze
$ grep HighContrast ~/.config/kdeglobals
```
A segunda linha em branco (sem saída) indica que o tema de alto contraste **não** está ativo — é o estado padrão. Quando ativado, o arquivo `kdeglobals` registra um `widgetStyle` diferente e paletas customizadas na seção `[Colors:Window]`.

:::nota
O **Breeze Dark** é o tema padrão do SteamOS na Área de Trabalho — mas ele não é um tema de alto contraste, e sim um tema escuro comum. O contraste dele é suficiente para ambientes com pouca luz, mas insuficiente para quem precisa de divisão nítida entre elementos. Não confunda "tema escuro" com "alto contraste".
:::

## Brilho e contraste do display: além da UI

O painel LCD do Steam Deck também tem ajuste de brilho por software, exposto via `sysfs`. Embora o brilho máximo seja gerenciado pelo Modo Jogo com um slider, o valor real pode ser lido — e até escrito — pelo terminal:

```terminal
$ cat /sys/class/backlight/amdgpu_bl0/brightness
128
$ cat /sys/class/backlight/amdgpu_bl0/max_brightness
255
```

O caminho exato depende do driver. No Steam Deck, o driver `amdgpu` expõe o backlight em `amdgpu_bl0`. O valor `128` representa 50% do brilho máximo (`255`). Ajustá-lo manualmente não é recomendado durante o Modo Jogo, pois o gamescope assume o controle, mas no desktop pode ser útil.

Se o display tiver mais de uma entrada, o `xrandr` lista resoluções e pode ajudar a entender se o modo de saída está degradando a nitidez:

```terminal
$ xrandr | head -6
Screen 0: minimum 16 x 16, current 1280 x 800, maximum 32767 x 32767
eDP-1 connected primary 1280x800+0+0 (normal left inverted right x axis y axis) 150mm x 90mm
   1280x800      60.01*+
   1024x768      60.00
   800x600       60.32
```

A linha de `current` confirma a resolução nativa. Se o `xrandr` mostrar `1280x720` ou `1024x768` como modo atual, o sistema está rodando abaixo da resolução do painel — isso embaça texto e degrada o contraste percebido, independentemente das opções de acessibilidade.

## Quando o contraste não basta: escala de cinza

Uma camada extra, útil em situações de fotossensibilidade ou fadiga visual severa, é o modo de **escala de cinza** (grayscale) do compositor. Ele não está no menu de Acessibilidade padrão em todas as versões do SteamOS, mas o gamescope suporta shaders de pós-processamento que podem drenar toda a cor da tela.

No ambiente desktop, o KWin também oferece um efeito similar via **Configurações do Sistema → Acessibilidade → Efeito de escala de cinza**. Se você precisa ativá-lo programaticamente, o KWin expõe opções via D-Bus — algo para a seção de diagnóstico.

:::dica
Se o texto continua difícil de ler mesmo com alto contraste, combine esta opção com o **redimensionamento de fonte** — assunto da seção 5. O contraste resolve a *diferenciação*, o tamanho resolve a *distância*, e juntos cobrem quase todos os cenários de baixa visão moderada.
:::

## Resumo

- O modo de alto contraste do SteamOS altera cores, bordas e estrutura da UI, indo além de um simples filtro de cor.
- A chave `SteamUIHighContrast` em `config.vdf` persiste a escolha.
- No desktop KDE, o tema *Breeze High Contrast* é o equivalente; não confunda com Breeze Dark comum.
- O brilho real do painel pode ser lido em `/sys/class/backlight/amdgpu_bl0/brightness`.
- Uma resolução abaixo da nativa degrada o contraste percebido; `xrandr` confirma se o display está no modo correto.

## Exercícios

1. Ative o alto contraste no Modo Jogo e navegue pela biblioteca e loja. Anote pelo menos duas mudanças visuais específicas (além das cores).
2. Rode `grep "HighContrast" ~/.local/share/Steam/config/config.vdf` com a opção ligada e depois desligada, comparando os valores.
3. No desktop, alterne entre Breeze Dark e Breeze High Contrast. Verifique o `widgetStyle` com `kreadconfig5` em cada modo.
4. Leia o brilho atual com `cat /sys/class/backlight/amdgpu_bl0/brightness` e calcule a porcentagem usando o `max_brightness`.
5. **Desafio.** Simule baixa visão: reduza o brilho para 30%, desligue o alto contraste e tente navegar pela biblioteca. Depois religue o alto contraste e ative a escala de cinza no desktop. Descreva qual combinação de ajustes foi mais eficaz e por quê.