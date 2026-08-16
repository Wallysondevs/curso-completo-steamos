O áudio do Steam Deck depende de uma pilha de software relativamente nova e muito mais simples do que a que reinou no Linux por anos. Enquanto as distribuições mais antigas empilhavam ALSA, PulseAudio e meia dúzia de camadas incompatíveis entre si, o SteamOS adotou o **PipeWire**, um único servidor multimídia que cuida de áudio e vídeo ao mesmo tempo. Entender essa arquitetura logo no começo evita que você procure um "PulseAudio" que não existe mais e explica por que alguns comandos antigos ainda funcionam.

:::objetivos
- Entender o papel do PipeWire, do pipewire-pulse e do WirePlumber
- Listar os processos de áudio em execução com `systemctl --user`
- Enxergar a compatibilidade com o PulseAudio como camada de emulação
- Reconhecer por que o ALSA ainda existe por baixo do PipeWire
- Verificar a saúde da pilha de áudio em uma única olhada
:::

## ALSA, PulseAudio e o vazio que o PipeWire preencheu

Durante quase duas décadas, o áudio no Linux seguiu um roteiro de três camadas. No fundo ficava o **ALSA** (Advanced Linux Sound Architecture), o driver que fala diretamente com o hardware. Em cima dele vinha o **PulseAudio**, um servidor de usuário que resolvia o que o ALSA não sabia fazer sozinho: misturar vários aplicativos tocando ao mesmo tempo, rotear cada um para uma saída diferente e lembrar do volume entre reinicializações.

O problema era que esse arranjo deixava de fora o vídeo e o Bluetooth ficava cheio de remendos. O PipeWire nasceu para unificar tudo: ele é o servidor que os aplicativos usam, fala com o ALSA por baixo, gerencia o Bluetooth nativamente e ainda transporta fluxos de vídeo (como a captura de tela do OBS ou a saída do gamescope) pelo mesmo mecanismo.

No SteamOS, o PipeWire assumiu de vez. Você não tem o PulseAudio rodando como daemon separado — tem uma camada de **compatibilidade** chamada `pipewire-pulse` que finge ser um PulseAudio para os programas que ainda não foram migrados.

:::nota
Quando um tutorial antigo manda reiniciar o PulseAudio com `pulseaudio -k` ou `systemctl --user restart pulseaudio`, ignore: no SteamOS essas unidades não existem. A unidade se chama `pipewire`, e a compatibilidade com o protocolo PulseAudio roda dentro dela como `pipewire-pulse`.
:::

## Os três processos que cuidam do som

O áudio no seu deck não é um único programa e sim três, cada um com uma função bem definida e gerenciados pelo **systemd** dentro da sua sessão de usuário. Você confirma isso com um único comando:

```terminal
$ systemctl --user status pipewire pipewire-pulse wireplumber
● pipewire.service - PipeWire Multimedia Service
     Loaded: loaded (/usr/lib/systemd/user/pipewire.service; enabled; preset: enabled)
     Active: active (running) since Mon 2025-06-09 10:12:31 -03; 2h 14min ago
   Main PID: 831 (pipewire)
      Tasks: 3 (limit: 9124)
     Memory: 14.2M
        CPU: 1min 18.462s

● pipewire-pulse.service - PipeWire PulseAudio
     Loaded: loaded (/usr/lib/systemd/user/pipewire-pulse.service; enabled; preset: enabled)
     Active: active (running) since Mon 2025-06-09 10:12:31 -03; 2h 14min ago
   Main PID: 836 (pipewire-pulse)

● wireplumber.service - Multimedia Service Session Manager
     Loaded: loaded (/usr/lib/systemd/user/wireplumber.service; enabled; preset: enabled)
     Active: active (running) since Mon 2025-06-09 10:12:31 -03; 2h 14min ago
   Main PID: 848 (wireplumber)
```

As três unidades sobem juntas, na mesma fração de segundo do login, e as três aparecem como `active (running)`. Esse trio tem funções que não se sobrepõem:

- **`pipewire`** é o servidor propriamente dito. Recebe os fluxos de áudio, mistura, aplica volume e entrega ao hardware via ALSA.
- **`pipewire-pulse`** é o tradutor. Expondo o protocolo do PulseAudio, faz com que `pactl`, `pavucontrol` e jogos antigos continuem funcionando sem saber que o servidor mudou.
- **`wireplumber`** é o gerente de sessão. É ele quem detecta o fone plugado no jack, pareia o headset Bluetooth, decide qual saída é a padrão e aplica as regras de roteamento.

## Por que o `pactl` ainda funciona

Se o PulseAudio morreu, como você ainda digita `pactl list sinks` e recebe uma resposta? Porque os autores do PipeWire fizeram uma escolha pragmática: implementaram o protocolo do PulseAudio dentro do servidor, então qualquer cliente que fale essa língua é atendido pela `pipewire-pulse`. É emulação de protocolo, não de daemon.

Veja a prova. O comando `pactl info` continua devolvendo os metadados que todo client PulseAudio espera, mas repare no campo que denuncia a troca por baixo:

```terminal
$ pactl info
Server String: /run/user/1000/pulse/native
Library Protocol Version: 35
Server Protocol Version: 35
Is Local: yes
Client Index: 60
Tile Size: 65472
User Name: deck
Host Name: steamdeck
Server Name: PulseAudio (on PipeWire 1.0.7)
Server Version: 15.0.0
Default Sample Specification: float32le 2ch 48000Hz
Default Sink: alsa_output.pci-0000_04_00.5-platform-acp5x_mach.0.HiFi__hw_acp5x_1__sink
```

A linha `Server Name: PulseAudio (on PipeWire 1.0.7)` é a confissão: o que atende você é o PipeWire, fingindo ser PulseAudio versão 15.0.0. O campo `Default Sink` já adianta o próximo assunto do capítulo — qual saída está selecionada — e o nome do dispositivo revela que o chip de áudio é um AMD ACP5x, o codec embutido do processador do Deck.

## Mapeando a pilha em uma frase

Fixar a imagem certa poupa dúvidas depois:

| Camada | Responsável | Comando para inspecionar |
|---|---|---|
| ALSA | Falar com o chip de áudio real | `aplay -l` |
| PipeWire | Misturar e rotear fluxos | `systemctl --user status pipewire` |
| pipewire-pulse | Compatibilidade com PulseAudio | `pactl info` |
| WirePlumber | Detectar dispositivos e definir padrões | `systemctl --user status wireplumber` |

O ALSA, no fundo da pilha, também tem o que dizer. O `aplay -l` lista as placas de som reconhecidas diretamente pelo kernel, sem intermediação do PipeWire:

```terminal
$ aplay -l
**** List of PLAYBACK Hardware Devices ****
card 0: acp5x [acp5x], device 0: Playback HiFi-0 (*) []
  Subdevices: 1/1
  Subdevice #0: subdevice #0
card 0: acp5x [acp5x], device 1: Playback HiFi-1 (*) []
  Subdevices: 1/1
  Subdevice #0: subdevice #0
```

A placa `acp5x` é o chip de áudio do Deck. Os dois dispositivos (`device 0` e `device 1`) correspondem a caminhos de hardware diferentes — tipicamente alto-falantes e jack — e é com eles que o PipeWire conversa para criar os sinks que você viu no `pactl`.

A regra prática: para ligar, desligar e rotear, você usa o `pactl` ou o `wpctl`; para diagnosticar por que um fone não apareceu, olha o WirePlumber; e para conferir se o servidor está de pé, consulta o `systemctl --user`.

:::dica
Há duas ferramentas de linha de comando que dominam o mesmo servidor: o `pactl` (herdado do PulseAudio) e o `wpctl` (nativo do PipeWire via WirePlumber). Elas coexistem de propósito. O `wpctl` costuma ter saídas mais enxutas e uma sintaxe mais direta para volume; o `pactl` tem opções mais ricas para inspecionar fluxos. Este capítulo usa os dois, cada um onde rende mais.
:::

## Resumo

- O SteamOS trocou o PulseAudio pelo PipeWire, um servidor único para áudio e vídeo.
- Três unidades systemd formam a pilha: `pipewire`, `pipewire-pulse` e `wireplumber`.
- O `pipewire-pulse` implementa o protocolo do PulseAudio, mantendo `pactl` e jogos antigos funcionando.
- O ALSA continua existindo por baixo como o driver que fala com o chip de áudio.
- `systemctl --user status pipewire pipewire-pulse wireplumber` confirma a saúde das três camadas de uma vez.
- `pactl info` denuncia a troca na linha `Server Name: PulseAudio (on PipeWire ...)`.

## Exercícios

1. Rode `systemctl --user status pipewire pipewire-pulse wireplumber` e anote, para cada uma das três unidades, se o `Active` está em `running`.
2. Execute `pactl info` e localize a linha `Server Name`. O que ela revela sobre o servidor que está atendendo seus comandos?
3. Liste os dispositivos de áudio reconhecidos pelo driver com `aplay -l`. Quantos dispositivos ALSA aparecem e qual deles corresponde aos alto-falantes do Deck?
4. Compare a saída de `pactl info` com a de `wpctl status` e identifique, em ambas, qual é a saída de áudio padrão (`Default Sink`).
5. **Desafio.** Pare temporariamente a unidade `wireplumber` com `systemctl --user stop wireplumber` e veja, com `wpctl status`, que os dispositivos deixam de ser gerenciados (não desligue o áudio todo). Depois suba de novo com `start` e explique, em uma frase, por que o WirePlumber é o "cérebro de roteamento" da pilha.
