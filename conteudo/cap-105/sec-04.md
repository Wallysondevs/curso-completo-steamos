"O jogo rodava liso na semana passada e agora está travando." Se você já disse (ou pensou) isso, esta é a sua seção. Queda súbita de desempenho em um aparelho que não mudou de hardware é quase sempre uma de três coisas: **throttling térmico**, **um processo comendo recursos em segundo plano**, ou **uma configuração que foi revertida** (TDP limit, FPS cap, governor). A tabela abaixo separa esses cenários.

O Steam Deck tem um perfil de desempenho ajustável que é uma bênção e uma maldição: ele permite economizar bateria ou destravar tudo, mas é fácil esquecer que uma dessas chaves ficou limitada. Antes de desmontar o aparelho, verifique as alavancas de software.

:::objetivos
- Identificar throttling térmico versus gargalo de CPU versus gargalo de GPU
- Usar `sensors`, `mangohud` e os overlays para ver o que está limitando o FPS
- Restaurar configurações de TDP, FPS cap e governor que foram revertidas
- Caçar e matar processos que consomem recurso em segundo plano
- Saber quando a queda de desempenho indica hardware com problema real
:::

## Tabela de desempenho

| Sintoma | Causa provável | Solução |
|---|---|---|
| FPS caiu mas nada mudou | Throttling térmico (> 90 °C), limiar de TDP, paste térmica seca | `sensors` vê a temperatura; limpe a ventoinha, abaixe TDP ou FPS cap; se >95 °C constante, repaste (cap. manutenção) |
| Stutter/microtravadas periódicas | Shader cache sendo compilado em runtime, GC de jogo, frame pacing | Deixe "Precompile shaders" ligado; rode o jogo alguns minutos para cache estabilizar; use `gamemode` |
| Desempenho boa no começo, degrada com o tempo | Vazamento de memória do jogo, swap entrando, RAM cheia | `free -h` e `top`; feche overlays, desligue apps de fundo; reinicie o jogo |
| O aparelho esquenta muito e a ventoinha dispara | Paste térmica, poeira, perfil de TDP alto, ventilação obstruída | Limpe as grelhas; verifique `sensors`; reduza TDP para algo sustentável (8–12 W) |
| O FPS trava num valor fixo (30/40/60) | Limitador de FPS/refresh está ativo | Abra Quick Access → Desempenho e desligue o FPS limit; cheque refresh rate (40/60/90 Hz) |
| CPU 100% mas GPU ociosa | Jogo CPU-bound, processo de fundo, governor errado | `top` acha o culpado; `sudo cpupower frequency-info` confere governor |
| GPU 100% mas FPS baixo | Jogo GPU-bound acima da capacidade; upscaling desligado | Ligue FSR/NIS; reduza resolução ou preset gráfico |
| Ventoinha sempre no máximo mesmo ocioso | Curva de ventoinha bugada, sensor preso, serviço de fan | `johnjay`/`steamdeck-dock` reiniciar; se persistir, suspeite do hardware térmico |

## Lendo a temperatura e o throttle

O primeiro gesto diante de desempenho ruim é olhar a temperatura. O Steam Deck tem vários sensores expostos pelo subsistema `hwmon`; o utilitário `sensors` agrega:

```terminal
$ sensors
amdgpu-pci-0400
Adapter: PCI adapter
vddgfx:       +0.85 V
edge:         +78.0°C
junction:     +88.0°C
mem:          +76.0°C
power1:       18.00 W

BAT1-acpi-0
Adapter: ACPI interface
temp1:        +41.0°C
```

As leituras-chave são a **junction** (a temperatura do die, o número que importa para throttling) e a **edge** (borda do chip). A APU começa a reduzir clocks para se proteger perto dos 95–100 °C; se a junction está acima de 90 °C de forma sustentada durante jogo pesado, o throttling térmico é o suspeito número um.

```terminal
$ sudo cat /sys/class/hwmon/hwmon*/temp1_input | awk '{print $1/1000 " °C"}'
```

O caminho do sysfs acima varia conforme o modelo (LCD usa nomes de hwmon diferentes do OLED). Prefira o `sensors` se estiver disponível.

:::atencao
Temperatura alta **em idle** (aparelho parado na tela inicial, sem jogo) — digamos 70 °C sem fazer nada — não é throttling, é **problema térmico real**: ventoinha travada, pasta seca ou dissipador deslocado. Isso aponta para o capítulo de manutenção física, não para ajuste de software.
:::

## O FPS travado num número redondo

Se o FPS está preso em 30, 40 ou 60 sem flutuar, a explicação mais provável é simplesmente o **limitador de FPS** que você (ou uma atualização) deixou ligado. O path é:

1. Abra o **Quick Access Menu** (`…`).
2. Vá em **Desempenho** (ícone de bateria/raio).
3. Olhe o **Limitador de FPS** e a **Taxa de atualização**.

O casamento entre refresh rate e limitador define o comportamento. O Steam Deck OLED tem taxas de 90 Hz; se você limitou FPS a 40 mas o painel está em 60 Hz, o frame pacing fica irregular (40 não divide 60). O ideal é manter o limitador em um divisor inteiro do refresh: 30 ou 60 para painel 60 Hz; 45 ou 90 para painel 90 Hz.

```terminal
# Como ver a taxa de atualização atual (Modo Desktop):
$ xrandr | grep ' connected'
eDP-1 connected primary 1280x800+0+0 (normal left inverted right) 256mm x 160mm
   800x1280      60.00*+  90.00
```

O asterisco no `60.00*+` mostra a taxa ativa. Se o jogo deveria rodar a 90 mas o painel está em 60, o refresh foi revertido — ajuste nas configurações de vídeo do SteamOS.

## CPU vs GPU: onde está o gargalo

Um FPS baixo pode ter causas totalmente diferentes. Saber qual componente está no limite orienta a solução correta:

| Observação | Gargalo | Ajuste que ajuda |
|---|---|---|
| GPU perto de 99%, CPU folgada | GPU-bound | Reduza resolução/preset, ligue FSR/NIS, baixe sombras/SSAO |
| CPU perto de 99% em poucos núcleos, GPU folgada | CPU-bound | Reduza draw distance, física, NPCs; aumente TDP e clock de CPU |
| Nem CPU nem GPU no limite, mas FPS cai | Frame pacing, shader compile, I/O | Desligue FPS limit, ligue precompile, use `gamemode` |

O MangoHud (já instalado no SteamOS) mostra CPU e GPU em barras lado a lado durante o jogo — a forma mais rápida de ver qual está no teto:

```terminal
$ MANGOHUD=1 gamemoderun %command%
```

O parâmetro `%command%` é a opção de inicialização do jogo dentro do Steam; `MANGOHUD=1` ativa o overlay, `gamemoderun` aplica o perfil de desempenho temporário.

## Caçando o processo de fundo

Nem todo problema de desempenho é térmico ou de GPU. Às vezes é um processo de fundo — um download do Steam, uma varredura do indexador de arquivos, um Flatpak mal comportado — comendo CPU ou I/O sem você saber.

```terminal
$ top -o %CPU
top - 21:03:44 up 3 days,  4:12,  1 user, ...
  PID USER      PR  NI    VIRT    RES    SHR S  %CPU  %MEM     TIME+ COMMAND
 2871 deck      20   0 3021508 1.2g 585132 S  78.3   8.0  12:41.22 steam
 1204 deck      20   0 4119320 640m 380412 S  45.2   4.1   3:55.10 gamescope
 37101 deck     20   0  118m   42m  30m S  12.9   0.3   0:08.44 flatpak-update
```

O `top` ordenado por `%CPU` revela o vilão em segundos. Dois padrões clássicos:

- **`steam` em 70–90% de CPU com o aparelho em idle** — é quase sempre download/instalação comprimindo ou descomprimindo, ou o steam "processing shaders". Espere terminar.
- **`baloo_file` ou indexador do KDE** — na primeira indexação de um microSD grande, come CPU e disco. Você pode desligar em Configurações → Busca.

```terminal
# Encontrar os 10 processos que mais usam memória:
$ ps aux --sort=-%mem | head -11
```

Se um processo está fora de controle e não é do sistema, mate com `kill -TERM <pid>` (gentil) e `kill -KILL <pid>` (bruto) se não parar.

:::nota
Referências aprofundadas: perfil de desempenho e TDP (cap. 12–13), overlay e MangoHud (cap. 11), throttle tavel e refrigeração (cap. 88), e o cap. 42 para problemas de desempenho específicos do Proton.
:::

## Resumo

- Queda súbita de FPS = throttling térmico, processo de fundo ou configuração revertida. Nessa ordem.
- `sensors` revela a temperatura; junction acima de 90 °C sustentada indica throttling.
- FPS preso em número redondo é limitador/refresh; mantenha-os múltiplos inteiros.
- GPU no teto → reduza gráfico; CPU no teto → reduza lógica de mundo e aumente TDP.
- `top` e `ps --sort=-%mem` caçam o processo de fundo; `MANGOHUD=1` mostra o gargalo ao vivo.

## Exercícios

1. Rode um jogo pesado com `MANGOHUD=1 gamemoderun %command%` e anote, durante o gameplay, os percentuais de CPU e GPU. Qual deles estava no teto?
2. Com o jogo rodando, execute `sensors` em outro terminal (ou via SSH) e registre a temperatura de junction. Ela chegou perto de 90 °C?
3. Teste três perfis de desempenho no mesmo jogo: TDP 8 W, 12 W e sem limite. Meça o FPS médio de cada um com MangoHud. Qual oferece o melhor custo-benefício?
4. Abra o `top` e ordene por `%CPU`. Deixe o Deck em idle por 2 minutos. Algum processo está consumindo CPU sem motivo aparente? Identifique-o.
5. **Desafio.** Configure o FPS limit em 40 com refresh 60 Hz e jogue 5 minutos. Depois mude para refresh 40 Hz (mantendo FPS 40) e jogue mais 5. Descreva a diferença de fluidez. Explique por que 40/40 é mais suave que 40/60.