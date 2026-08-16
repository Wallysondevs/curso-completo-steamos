Tudo o que cobrimos até aqui converge para uma pergunta prática: como depurar um problema real com o Gamescope? Jogo que não abre, tela preta, performance inexplicavelmente ruim, flickering ou cores erradas — cada sintoma tem um caminho de diagnóstico diferente, e a capacidade de seguir esse caminho sem se perder em logs irrelevantes é a habilidade que transforma o usuário frustrado em power user.

:::objetivos
- Diagnosticar falhas de inicialização de jogos dentro do Gamescope
- Corrigir problemas de flickering e artefatos visuais
- Resolver conflitos entre o Gamescope e outros compositores
- Otimizar jogos específicos com combinações de flags
- Estabelecer um fluxo de diagnóstico sistemático para problemas gráficos no Steam Deck
:::

## Tela preta ao iniciar um jogo: o roteiro de diagnóstico

O sintoma mais comum: você clica em "Play", a tela fica preta por 10 segundos, e você volta para a Steam UI. Ou pior: a tela fica preta e não volta. O primeiro instinto — reiniciar o Deck — resolve o sintoma, mas não a causa. Vamos seguir o rastro de evidências.

**Passo 1: O jogo chegou a iniciar?** O Gamescope pode estar funcionando perfeitamente, mas o jogo crashou antes de renderizar o primeiro frame.

```terminal
$ journalctl -b | grep -i 'steam\|gamescope' | grep -i -E 'crash|segfault|abort|signal' | tail -20
```

Se houver um segfault ou abort do processo do jogo, o problema não é o Gamescope — é o jogo ou o Proton. O Gamescope, nesse caso, fez o trabalho dele: recebeu o sinal de que o filho morreu e devolveu o controle para a Steam UI.

**Passo 2: O Gamescope está com o DRM bloqueado?** Se algum processo segurou o DRM antes do Gamescope, ele falha ao obter o master do DRM:

```terminal
$ sudo cat /sys/kernel/debug/dri/0/clients
```

Este pseudo-arquivo lista todos os clientes do DRM. Se houver outro processo com `master` ativo (como `kwin_wayland` ou um `plymouth` zumbi), o Gamescope não consegue controlar o painel.

**Passo 3: A GPU está respondendo?** Uma falha de hardware ou um lockup do driver AMDGPU pode fazer o Gamescope congelar aguardando um fence do kernel:

```terminal
$ sudo dmesg | grep -i -E 'amdgpu|ring.*stall|gpu.*hang|fence.*timeout' | tail -10
[18453.442] amdgpu 0000:04:00.0: amdgpu: ring gfx_0.0.0 timeout, signaled seq=18453, emitted seq=18455
[18453.442] amdgpu 0000:04:00.0: amdgpu: GPU reset begin!
```

A mensagem `ring gfx timeout` seguida de `GPU reset` indica que o hardware da GPU travou e o kernel tentou reiniciá-la. Durante o reset (~1-3 segundos), o Gamescope fica congelado. Se o reset falhar, o sistema inteiro pode precisar de reboot.

:::perigo
Um `GPU reset` é um evento sério. Ele indica que a GPU encontrou um estado inválido e o kernel precisou reiniciar o hardware. Se isso acontecer com frequência (mais de uma vez por semana), pode indicar defeito de hardware, overclock instável ou bug no driver. No Steam Deck, o TDP e as frequências são travados pela Valve, então a causa mais comum é bug em jogo específico (shader corrompendo estado da GPU) ou superaquecimento.
:::

## Flickering e artefatos: caça aos fantasmas

Flickering (piscadas intermitentes) e artefatos (glitches visuais, como polígonos pretos ou texturas coloridas piscando) têm causas variadas que podem ou não envolver o Gamescope:

```terminal
$ gamescope -w 1280 -h 800 -W 1280 -H 800 --immediate-flips --adaptive-sync -- %command%
```

A flag `--immediate-flips` pode eliminar flickering causado por buffers de swapchain dessincronizados. Ela instrui o Gamescope a apresentar o frame assim que ele estiver pronto, em vez de esperar o vblank. O custo é potencial tearing, mas combinado com `--adaptive-sync`, o VRR elimina o tearing.

```terminal
$ MANGOHUD_CONFIG=gpu_temp,cpu_temp,throttling,junction_temp MANGOHUD=1 gamescope -w 1280 -h 800 -- %command%
```

Artefatos que aparecem apenas após alguns minutos de jogo são quase sempre térmicos. Monitore `junction_temp` (temperatura de junção, mais precisa que a temperatura do die) e `throttling`. Se os artefatos começarem quando a junção passa de 90°C, você tem um problema de resfriamento, não de software.

:::info
A temperatura de junção (junction ou hotspot) é medida por sensores dentro do die da GPU e é tipicamente 10-15°C mais alta que a temperatura de borda (edge). O Steam Deck começa a fazer throttling térmico a aproximadamente 85-90°C de temperatura de borda, o que corresponde a ~100°C de junção. O MangoHud pode mostrar ambas com `gpu_temp` (borda) e `junction_temp` (junção).
:::

## Conflito com o Modo Desktop: dois compositores não dançam

O erro mais frustrante para quem está experimentando: você está no Modo Desktop, abre um terminal e digita `gamescope -f -- vkcube`, e recebe uma mensagem de erro enigmática sobre DRM:

```terminal
$ gamescope -f -w 1280 -h 800 -- vkcube
wlserver: [backend/drm/backend.c:202] DRM universal planes: primary, cursor
wlserver: [backend/drm/drm.c:280] connector eDP-1: No CRTC found
Failed to initialize backend
```

Isso acontece porque o KWin já é o master do DRM. O Gamescope não pode tomar o controle enquanto o KWin estiver ativo. A solução é simples: no Modo Desktop, sempre use `-n` (modo nested):

```terminal
$ gamescope -n -w 1280 -h 800 -- vkcube
```

Se você realmente precisa de DRM direto no Modo Desktop (para testar HDR, por exemplo), precisa parar o KWin antes. Isso pode ser feito trocando para um TTY virtual:

```terminal
## No TTY (Ctrl+Alt+F3 após logar)
$ sudo systemctl stop sddm
$ gamescope -f -w 1280 -h 800 -O ,eDP-1 -- vkcube
```

Mas essa manobra é arriscada — se o Gamescope falhar, você fica sem interface gráfica. Para o dia a dia, o modo nested resolve 95% dos casos.

## Um fluxo de diagnóstico sistemático

Quando um problema aparece, a ordem de investigação importa. Seguir um fluxo evita o diagnóstico aleatório que consome horas:

1. **Isolar**: o problema acontece com qualquer jogo ou só com um? Acontece no modo nested e no Modo Jogo? Acontece com `vkcube`?
2. **Logs**: `journalctl -b | grep gamescope` e `dmesg | grep -iE 'amdgpu|error|fail' | tail -20`.
3. **Ambiente**: o Gamescope está rodando com as flags esperadas? (`cat /proc/$(pgrep gamescope)/cmdline`).
4. **GPU**: Vulkan está respondendo? (`vulkaninfo --summary`). DRM está livre? (`sudo cat /sys/kernel/debug/dri/0/clients`).
5. **Térmicas**: a GPU está em throttling? (`MANGOHUD_CONFIG=throttling,gpu_temp`).
6. **Regressão**: o problema começou após uma atualização? (`journalctl --since "2024-11-01" | grep -i -E 'upgrade|update|gamescope'`).

```terminal
$ journalctl --since "2024-11-01" | grep -i -E 'upgrade|update|gamescope' | head -10
Nov 03 14:22:01 steamdeck pacman[987]: upgraded gamescope (3.15.0 -> 4.0.0)
```

Essa linha conta uma história clara: o Gamescope foi atualizado da versão 3.15.0 para 4.0.0. Se o problema começou em novembro, essa atualização é a principal suspeita.

:::dica
Mantenha um "diário de bordo" do Steam Deck: um arquivo de texto simples onde você anota datas de atualizações, mudanças de configuração e problemas encontrados. Quando algo quebra, o diário reduz o tempo de diagnóstico de horas para minutos. Um template mínimo: `~/deck-log.md` com entradas no formato `YYYY-MM-DD: o que mudou | o que observei`.
:::

## Resumo

- Tela preta ao iniciar jogo: verifique se o jogo crashou (`journalctl | grep segfault`), se o DRM está livre (`/sys/kernel/debug/dri/0/clients`) e se a GPU não sofreu reset (`dmesg | grep amdgpu`).
- Flickering pode ser corrigido com `--immediate-flips`; artefatos que surgem com o tempo indicam problema térmico.
- No Modo Desktop, sempre use `-n`; `-f` sem `-n` conflita com o KWin.
- Um fluxo sistemático (isolar → logs → ambiente → GPU → térmicas → regressão) resolve a maioria dos problemas em menos de 10 minutos.
- `journalctl --since` com data específica permite rastrear regressões introduzidas por atualizações do sistema.

## Exercícios

1. Provoque uma falha controlada: no Modo Desktop, execute `gamescope -f -w 1280 -h 800 -- vkcube` sem `-n`. Leia o erro e explique, com suas palavras, por que o DRM rejeitou o Gamescope.
2. No Modo Jogo, abra um jogo e monitore `sudo dmesg -w | grep amdgpu` por 10 minutos. Algum `ring timeout` ou `GPU reset` apareceu?
3. Simule um cenário de flickering: execute `vkmark --benchmark 60` dentro do Gamescope sem `--adaptive-sync` e observe se há tearing. Adicione `--adaptive-sync` e compare.
4. Crie um arquivo `~/deck-log.md` com as últimas 3 atualizações do sistema (`journalctl --since "2 weeks ago" | grep -i upgraded | grep -E 'gamescope|mesa|kernel'`). Há correlação entre alguma atualização e um problema que você notou?
5. **Desafio.** Escreva um script de diagnóstico (`deck-diag.sh`) que execute os 6 passos do fluxo sistemático automaticamente e produza um relatório Markdown. Inclua: flags atuais do Gamescope, clientes DRM, temperatura da GPU, throttling status, versão do RADV, últimas 5 atualizações do sistema e status do journal para gamescope nas últimas 24 horas.