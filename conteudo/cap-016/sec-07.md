O gamescope é o compositor do SteamOS, mas é muito mais que um desenhista de janelas: ele controla o refresh rate do painel, gerencia a taxa de apresentação e é o intermediário entre o jogo e a tela. Saber falar com ele pelo terminal — especialmente com a flag `-r` — te dá o controle do refresh rate que o menu esconde.

:::objetivos
- Entender o papel do gamescope no SteamOS
- Ajustar o refresh rate via gamescope com `-r`
- Inspecionar o log do gamescope para diagnosticar problemas de exibição
- Relacionar gamescope, VRR e limitador de FPS no Modo Jogo
:::

## O compositor que é bem mais que compositor

No Linux tradicional, o compositor cuida do que está na tela — janelas, efeitos, transparências — e expõe quadros para a GPU. O gamescope, criado pela Valve, faz isso em modo **embedded**: ele foi projetado para uma interface só, fullscreen, e toma decisões que no desktop caberiam a vários componentes.

Em particular, o gamescope negocia diretamente com o DRM (Direct Rendering Manager) do kernel para alterar o refresh rate do painel sem depender de `xrandr` ou de extensões X11. Ele também pode aplicar filtros como FSR (FidelityFX Super Resolution) e lidar com upscaling, mas seu papel mais importante para este capítulo é estabelecer o ritmo em que os quadros chegam à tela.

```terminal
$ journalctl -u gamescope --since '5 min ago' | head -16
jan 15 18:30:00 steamdeck gamescope[781]: [gamescope] wlserver: [xwayland/server.c
jan 15 18:30:00 steamdeck gamescope[781]: [gamescope] wlserver: Running compositor on pid 781
jan 15 18:30:00 steamdeck gamescope[781]: [gamescope] Display Info:
jan 15 18:30:00 steamdeck gamescope[781]: [gamescope]   connector: eDP-1
jan 15 18:30:00 steamdeck gamescope[781]: [gamescope]   physical size: 160x100 mm
jan 15 18:30:00 steamdeck gamescope[781]: [gamescope]   mode: 1280x800 @ 90Hz
jan 15 18:30:00 steamdeck gamescope[781]: [gamescope]   preferred mode: 90Hz
jan 15 18:30:00 steamdeck gamescope[781]: [gamescope]   vrr: supported
```

O log confirma que o gamescope está no controle: ele identifica o conector (`eDP-1`), o modo ativo de 90 Hz e o suporte a VRR. Qualquer alteração de refresh rate passa por ele, e seus logs são o primeiro lugar a olhar quando uma configuração de taxa "não pega".

## A flag `-r`: refresh rate pela linha de comando

Fora do Modo Jogo — ou quando você quer lançar um jogo com refresh rate específico sem mexer no menu — a flag `-r` do gamescope é o comando direto. Ela define a taxa com que o compositor apresenta os quadros, e funciona tanto na linha de comando de um lançador quanto em scripts.

```terminal
$ gamescope -r 40 -- mangohud %command%
```

Isso inicia o jogo dentro de uma sessão gamescope travada em 40 Hz. Combinado com o `fps_limit` do mangohud no mesmo valor (como na seção anterior), você replica exatamente o que o Modo Jogo faz pelo menu.

A flag `-r` aceita qualquer inteiro de taxa: `-r 30`, `-r 40`, `-r 45`, `-r 60`, `-r 90`. Se a taxa não for suportada pelo painel, o gamescope cai para o modo mais próximo que encontrar, e registra o fallback no log.

```terminal
$ gamescope -r 40 -W 1280 -H 800 -- %command%
```

Aqui o `-W` e `-H` definem a resolução do gamescope (úteis para títulos que não reconhecem 1280x800 nativamente). A ordem das flags importa pouco, mas `-r` antes do `--` é obrigatório, porque tudo após `--` pertence ao comando do jogo.

:::dica
No Steam Deck, você pode criar um atalho de jogo na Steam que use `gamescope -r 40` no campo de opções de lançamento, forçando 40 Hz para aquele título sem mexer na configuração global do Modo Jogo.
:::

## O que acontece quando o refresh não cola

Nem sempre o `-r` surte efeito. O gamescope negocia o modo com o kernel via ioctls do DRM, e se o modo não estiver na lista de modos do conector, a negociação falha silenciosamente — o compositor continua na taxa anterior. Os motivos mais comuns:

- O painel não tem o modo desejado na EDID.
- O conector (HDMI, DisplayPort) não transporta o modo.
- O usuário `deck` não tem permissão para ioctls de modo (raro no SteamOS, comum em distros genéricas).

```terminal
$ journalctl -u gamescope | grep -i 'fallback\|failed\|mode'
jan 15 18:34:01 steamdeck gamescope[781]: [gamescope] Failed to find mode 1920x1080 @ 120Hz, falling back to 60Hz
```

A mensagem `Failed to find mode ... falling back to` é a assinatura de um `-r` rejeitado. A solução é escolher um modo da lista de `xrandr --query` ou, quando viável, usar um monitor que exponha a taxa desejada.

## Gamescope, VRR e o triângulo final

Com o gamescope no controle, o triângulo que fecha a fluidez no Deck tem três vértices. O primeiro é o **limitador de FPS** (mangohud ou menu), que impede a GPU de ultrapassar o teto e a saturar. O segundo é o **refresh rate** (gamescope `-r` ou menu), que garante o ciclo da tela no divisor certo. O terceiro é o **VRR** (quando disponível, em monitor externo), que sincroniza os dois anteriores dinamicamente.

A combinação mais estável em cada cenário:

| Cenário | Configuração |
|---|---|
| Painel Deck OLED, jogo pesado | 40 FPS (menu), gamescope a 40 Hz |
| Painel Deck LCD, jogo pesado | 30 FPS (menu), gamescope a 60 Hz com divisor |
| Monitor externo FreeSync 48–144 Hz | Limitador a 60, gamescope com VRR ativo |
| Jogo leve, qualquer painel | 60 ou 90 FPS, sem limite |

## Resumo

- O gamescope é o compositor do SteamOS e gerencia refresh rate, modos e VRR.
- `gamescope -r 40 -- %command%` inicia um jogo com painel travado em 40 Hz.
- `-r` combinado com `fps_limit` do mangohud replica o que o Modo Jogo faz.
- A flag `-W` e `-H` controlam resolução; `--` separa flags do gamescope do comando do jogo.
- `journalctl -u gamescope | grep fallback` revela quando o modo desejado foi rejeitado.
- O triângulo fluidez completa envolve limitador de FPS, refresh rate e VRR.

## Exercícios

1. Inspecione o log do gamescope com `journalctl -u gamescope --since '1 hour ago'` e identifique o conector, o modo ativo e se o painel suporta VRR.
2. Lance um jogo com `gamescope -r 40 -- %command%` e confira se o refresh do painel mudou, olhando o log ou sentindo a diferença de fluidez.
3. Combine `gamescope -r 40` com `MANGOHUD_CONFIG=fps_limit=40 mangohud %command%` e verifique se o frame pacing fica perfeito.
4. Se tiver um monitor externo, rode `gamescope -r 60` e `gamescope -r 144` (se suportado) e compare o comportamento com o painel embutido.
5. **Desafio.** Escreva um script curto de shell que, dado um argumento (ex.: `40`), lance um jogo com gamescope naquela taxa e mangohud no mesmo fps_limit, e verifique que o Modo Jogo obtém o mesmo resultado pelo menu.