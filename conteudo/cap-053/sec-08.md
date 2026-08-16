Um emulador de Switch é uma máquina complexa: traduz ARM para x86-64 em tempo real, compila shaders sob demanda e sintetiza áudio de múltiplas fontes. Quando algo quebra — stutter persistente, crash, áudio chiado — a causa quase nunca é óbvia. Esta seção ensina um método de diagnóstico por camadas, do sintoma à correção, usando logs e ferramentas do próprio SteamOS.

:::objetivos
- Ler logs de Yuzu e Ryujinx para localizar a causa de falhas
- Diagnosticar stutter de shader vs gargalo de hardware
- Resolver problemas de áudio (chiado, latência, falta de som)
- Identificar a origem de crashes e telas pretas
:::

## Onde moram os logs

Ambos os emuladores escrevem logs detalhados a cada execução, e eles são a primeira pista quando o jogo não se comporta.

```terminal
$ ls -lh ~/.local/share/yuzu/log/
-rw-r--r-- 1 ana ana 120K Mar 12 18:40 yuzu_log.txt
$ ls -lh ~/.config/Ryujinx/logs/
-rw-r--r-- 1 ana ana  80K Mar 12 18:40 Ryujinx_20240312_18-40.log
```

O padrão inicial de um log saudável no Yuzu:

```terminal
$ head -20 ~/.local/share/yuzu/log/yuzu_log.txt
[   0.000] Frontend                    <Info>    yuzu 1743 mainline
[   0.001] Core                        <Info>    Logging initialized
[   0.004] Vulkan                      <Info>    Vulkan 1.3, driver: AMD Radeon (RADV)
[   0.010] Loader                      <Info>    Loading game (id=01006F8002326000)
[   0.120] GPU                         <Info>    Initialized graphics backend
```

Procure por linhas com `<Error>` ou `<Warning>` — elas apontam a camada que falhou.

```terminal
$ grep -E 'Error|Warning' ~/.local/share/yuzu/log/yuzu_log.txt | tail -20
```

## Stutter: shader cache vs gargalo real

O stutter (micro-travada) tem duas causas principais, e confundi-las leva a "soluções" erradas.

**Stutter de shader** — acontece nos primeiros minutos de um jogo, em cenas novas, e melhora progressivamente. O MangoHud mostra `SHADERS` subindo durante as travadas. Correção: espere o cache esquentar, ou habilite async shader building.

**Gargalo de hardware** — acontece o tempo todo, em áreas densas, e está correlacionado a GPU/CPU a 95%+. Correção: reduza resolução, ative FPS dinâmico, ajuste TDP.

```terminal
$ # MangoHud com métrica de shader visível
MANGOHUD_CONFIG=fps,gpu_load,cpu_load,core_load,ram,vram gamemoderun flatpak run org.yuzu_emu.yuzu
FPS: 33  GPU: 97%  CPU: 44%   # gargalo de GPU → baixe a resolução
```

:::dica
Rode um cenário fixo (uma cena parada, não cutscene) por 3 minutos. Se o FPS sobe e estabiliza, era shader. Se fica baixo e constante, é gargalo de hardware.
:::

## Problemas de áudio

O áudio no emulador é sintetizado a partir do serviço de áudio do Switch (`audren`), e glitches se manifestam como chiado, estouro, latência ou silêncio total.

Camadas a verificar:
1. **Backend de áudio**: no Yuzu, **Emulation → Configure → Audio**, tente SDL2 ou Cubeb. No Ryujinx, **Options → Settings → Audio**.
2. **Sample rate**: o Switch usa 48 kHz; forçar outro valor causa artefatos.
3. **Playback device**: com áudio via Bluetooth (fones), a latência aumenta e pode cortar.

```terminal
$ # Verifique o dispositivo de áudio ativo
$ pactl list short sinks
0  alsa_output.pci-0000_04_00.6.pro-output-0  PipeWire  s16le 2ch 48000Hz  RUNNING
```

Se o PipeWire reporta um sample rate diferente de 48000 Hz, o áudio do jogo sofrerá reamostragem forçada — o que causa chiado. Alinhe o sample rate do jogo e do servidor.

:::atencao
Áudio via Bluetooth (AirPods, fone BT) frequentemente corta em jogos de Switch porque o codec A2DP não lida bem com o buffer curto do emulador. Teste com fone cabeado antes de culpar o emulador.
:::

## Crashes e telas pretas

Um crash deixa rastros no log. As causas mais comuns e suas assinaturas:

| Sintoma | Assinatura no log | Correção provável |
|---|---|---|
| Tela preta na abertura | `Loader` não acha chave/firmware | Reinstalar keys e firmware |
| Crash ao entrar no jogo | `VK_ERROR_DEVICE_LOST` | Trocar Vulkan → OpenGL |
| Crash aleatório após horas | `Out of memory` / `Guest caught SIGSEGV` | Reduzir resolução, fechar apps em background |
| Travamento na cutscene | `Audio` erro no stream | Trocar backend de áudio |

```terminal
$ grep -iE 'device lost|out of memory|sigsegv|fatal' ~/.local/share/yuzu/log/yuzu_log.txt
```

O erro `VK_ERROR_DEVICE_LOST` é o mais comum e quase sempre é resolvido trocando para OpenGL, que usa um caminho de driver mais estável para aquele jogo.

## Versões e rollback

Muitas regressões aparecem entre versões do emulador. Se um jogo rodava e parou após uma atualização, anote a versão que funcionava e faça rollback.

```terminal
$ # Flatpak: liste versões antigas disponíveis
$ flatpak remote-info --log flathub org.yuzu_emu.yuzu
$ # Instale uma versão específica (exemplo)
$ flatpak update --commit=<commit-do-flatpak-que-funcionava> org.yuzu_emu.yuzu
```

Com binário standalone, o rollback é simplesmente manter o `.AppImage` antigo em `~/Applications/` — uma das vantagens de não usar Flatpak.

:::info
Cada título tem revisões conhecidas de "última versão boa". A comunidade compila isso em planilhas e fóruns. Antes de depurar às cegas, pesquise "jogo + versão do emulador + crash" — o bug provavelmente já é conhecido.
:::

## Um fluxo de diagnóstico em 4 passos

1. **Reproduza** o sintoma com MangoHud e anote FPS/GPU/CPU/VRAM.
2. **Leia o log** filtrado por `Error`/`Warning` da última execução.
3. **Isole a camada**: gráfico (troque backend/resolução), áudio (troque backend/sample rate), input (veja seção de controles).
4. **Rollback** da versão se a mudança recente introduziu o problema.

## Resumo

- Logs em `yuzu/log/` e `Ryujinx/logs/` são a primeira pista; filtre por `<Error>` e `<Warning>`.
- Stutter de shader melhora com o tempo; gargalo de hardware é constante e correlacionado a GPU/CPU saturada.
- Áudio chiado vem de sample rate divergente, backend errado ou Bluetooth; 48 kHz é o valor do Switch.
- `VK_ERROR_DEVICE_LOST` indica instabilidade Vulkan — troque para OpenGL.
- Rollback de versão resolve regressões introduzidas por atualização.

## Exercícios

1. Rode um jogo novo por 5 minutos com MangoHud exibindo shaders e classifique o stutter como "shader" ou "hardware".
2. Filtre os erros do log da última execução e explique cada um deles em uma frase.
3. Reproduza áudio chiado forçando um sample rate errado, depois corrija alinhando para 48 kHz.
4. Force um `VK_ERROR_DEVICE_LOST` alternando para Vulkan num jogo que só funciona em OpenGL, e confirme no log.
5. **Desafio.** Correlacione um crash aleatório com a pressão de memória usando `journalctl` e o MangoHud de VRAM, e proponha uma correção que mantenha o jogo jogável (redução de resolução, de texturas ou de mods).