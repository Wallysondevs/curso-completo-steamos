Todas as peças do capítulo estão na sua frente: arquitetura da pilha, sinks e sources, volume por aplicativo, Bluetooth, codecs, perfis de hardware, logs. O que falta é juntá-las na sequência certa para resolver os problemas que de fato aparecem no dia a dia de um Steam Deck. Esta seção é um roteiro de troubleshooting: os oito cenários mais comuns de áudio quebrado, com a lista de comandos na ordem exata de aplicação e o raciocínio por trás de cada um.

:::objetivos
- Diagnosticar "sem som" seguindo uma cadeia de verificação da saída ao driver
- Resolver conflito entre fone com fio, Bluetooth e alto-falantes
- Corrigir microfone mudo ou que ninguém escuta em chamadas
- Recuperar Bluetooth que pareia mas não toca áudio
- Integrar os comandos do capítulo inteiro num único fluxo de troubleshooting
:::

## O algoritmo do "sem som"

Quando não sai som nenhum, seguir uma ordem de verificação evita perder tempo no lugar errado. A cadeia lógica vai do mais externo (volume e mudo) ao mais interno (driver e hardware):

**Passo 1 — O básico visível.** Rode `wpctl status` e olhe o sink marcado com `*`. Ele está com `[vol: 0.00]` ou `MUTED`? Se estiver, `wpctl set-volume @DEFAULT_AUDIO_SINK@ 0.60` e `wpctl set-mute @DEFAULT_AUDIO_SINK@ 0`.

**Passo 2 — O stream silencioso.** O som pode estar saindo no sink mas não do aplicativo. Rode `pactl list sink-inputs` e veja se o aplicativo aparece e com qual volume. Se o volume do stream estiver 0% ou mudo, `pactl set-sink-input-volume <índice> 70%`.

**Passo 3 — O sink errado.** O `*` no `wpctl status` aponta para a saída certa? Se o padrão for o fone e você quer os alto-falantes, rode `pactl set-default-sink <nome-do-sink-dos-falantes>`.

**Passo 4 — Perfil da placa.** `pactl list cards | grep "Active Profile"` — o perfil inclui saída? Se for `off`, rode `pactl set-card-profile <card> output:stereo-fallback+input:stereo-fallback`.

**Passo 5 — Serviços de pé.** `systemctl --user status pipewire pipewire-pulse wireplumber | grep Active` — os três estão `running`? Se não, `systemctl --user restart pipewire pipewire-pulse wireplumber`.

**Passo 6 — Driver no fundo.** `aplay -l` — sua placa de som aparece? Se não listar nenhum dispositivo, o problema é anterior ao PipeWire: o kernel não reconheceu o hardware, e aí é `sudo dmesg | grep -i audio` para ver o que aconteceu no boot.

Cada passo elimina uma camada. Raramente você passa do passo 4, mas a sequência está pronta para quando o raro acontece.

```terminal
$ aplay -l
**** List of PLAYBACK Hardware Devices ****
card 0: acp5x [acp5x], device 0: Playback HiFi-0 (*) []
  Subdevices: 1/1
  Subdevice #0: subdevice #0
```

Se essa saída estiver vazia, o ALSA não viu a placa. É raro no Deck com hardware íntegro, mas acontece após atualizações de kernel que quebram o módulo `snd_acp5x`.

:::dica
Crie um script de diagnóstico de três linhas que você roda sempre que o som falha. Algo como:

```bash
#!/bin/bash
echo "=== WPCTL STATUS ===" && wpctl status | grep -E "Sinks|Sources|vol|MUTED" -A5
echo "=== SYSTEMCTL ===" && systemctl --user status pipewire pipewire-pulse wireplumber | grep Active
echo "=== APLAY ===" && aplay -l | grep card
```

Bata três comandos e você já sabe em qual camada cavar — em menos de dez segundos.
:::

## Conflito de múltiplas saídas

O Deck lida com três saídas simultâneas (alto-falantes, jack, Bluetooth), e o WirePlumber decide o padrão com regras que nem sempre batem com o que você quer. O cenário típico: você pluga um fone no jack para jogar, mas o som continua nos alto-falantes.

A cadeia de verificação — e lembre-se: tudo roda como `deck` no `steamdeck`:

```terminal
$ whoami && hostname
deck
steamdeck
$ pactl list sinks short
46	alsa_output.pci-0000_04_00.5-platform-acp5x_mach.0.HiFi__hw_acp5x_1__sink	PipeWire	float32le 2ch 48000Hz	RUNNING
57	alsa_output.pci-0000_04_00.5-platform-acp5x_mach.0.HiFi__hw_acp5x_2__sink	PipeWire	float32le 2ch 48000Hz	IDLE
58	bluez_output.E8_78_29_4F_3B_1A.1	PipeWire	s16le 2ch 48000Hz	RUNNING
```

Três sinks, dois em RUNNING. O jogo está tocando no sink `46` (alto-falantes) e o Bluetooth `58` está ativo. Para rotear o jogo para o fone com fio (`57`), o comando é o `move-sink-input` da seção 4 ou, se quiser mudar o padrão, o `set-default-sink` da seção 2.

Se o problema for o contrário — o fone plugado "roubou" o som e você quer os alto-falantes de volta — basta desconectar o fone que o WirePlumber retorna ao padrão anterior. Caso não retorne, force: `pactl set-default-sink <sink-dos-falantes>`.

## Microfone que ninguém escuta

O microfone é a segunda maior fonte de chamados, depois de "sem som". O fluxo é: `pactl list sources` → conferir a source padrão → ajustar ganho → testar com `pw-record`.

Se a source não aparecer, o perfil da placa provavelmente não inclui entrada. Verifique com `pactl list cards | grep "Active Profile"` e troque para um perfil que tenha `input` e `output`. Se a source aparecer mas a gravação sair com silêncio, o ganho está zerado ou o mute está ligado:

```terminal
$ pactl list sources | grep -E "Name:|Volume:|Mute:"
	Name: alsa_input.pci-0000_04_00.5-platform-acp5x_mach.0.HiFi__hw_acp5x_1__source
	Mute: yes
	Volume: front-left: 0 /   0% / -inf dB,   front-right: 0 /   0% / -inf dB
```

Mute `yes` e volume 0%: o microfone está duplamente silenciado. `pactl set-source-mute @DEFAULT_SOURCE@ 0` e `pactl set-source-volume @DEFAULT_SOURCE@ 75%` resolvem.

:::atencao
Em headsets Bluetooth, lembre-se: o perfil A2DP **não tem microfone**. Se você está em chamada e o microfone não aparece, troque o perfil para `headset-head-unit` com `pactl set-card-profile`. A qualidade do áudio de saída vai cair, mas o microfone funciona.
:::

## Bluetooth: pareou, conectou, mas não toca

Este é o cenário mais frustrante porque tudo parece certo: o `bluetoothctl` mostra o dispositivo `Connected: yes`, mas o som não sai. A bateria de verificações:

1. O sink Bluetooth aparece em `pactl list sinks short | grep blue`? Se não, `systemctl --user restart wireplumber`.
2. O sink é o padrão (`*` no `wpctl status`)? Se não, `pactl set-default-sink bluez_output.<MAC>`.
3. O perfil é `a2dp-sink` (estéreo) e não `headset-head-unit` (HSP/HFP)? Confira com `pactl list cards | grep "Active Profile"`.
4. O codec negociado aparece em `pactl list sinks | grep "bluetooth.codec"`? Se estiver ausente, a negociação falhou.
5. O volume do sink Bluetooth não está zerado? `wpctl get-volume` no sink correto.

A quinta verificação é a mais comum: o sink Bluetooth recém-conectado herda volume zero.

## Resumo da integração

A tabela seguinte condensa as oito seções do capítulo em um único mapa de referência. Quando algo falhar, ache o sintoma e siga a coluna:

| Sintoma | Verificar com | Corrigir com |
|---|---|---|
| Sem som total | `wpctl status`, `systemctl --user status` | `wpctl set-volume`, restart pipewire |
| Som no sink errado | `pactl list sinks short` | `pactl set-default-sink` |
| Um app mudo | `pactl list sink-inputs` | `pactl set-sink-input-volume` |
| Microfone não capta | `pactl list sources` | `pactl set-source-volume`, trocar perfil |
| Bluetooth não aparece | `bluetoothctl devices`, `pactl list sinks short` | `systemctl --user restart wireplumber` |
| Bluetooth sem qualidade | `pactl list cards \| grep Profile` | `pactl set-card-profile a2dp-sink` |
| Bluetooth sem microfone | `pactl list cards \| grep Profile` | `pactl set-card-profile headset-head-unit` |
| Áudio com estalos | `pw-top` | Ajustar buffer ou reiniciar pipewire |
| Dispositivo não detectado | `journalctl --user -u wireplumber -f` | Reconectar, reiniciar wireplumber |

## Resumo

- A cadeia "sem som" vai do volume do sink ao driver ALSA, passando por stream, perfil e serviço.
- Conflito entre alto-falantes, jack e Bluetooth se resolve com `pactl list sinks` e `set-default-sink` ou `move-sink-input`.
- Microfone mudo geralmente é ganho zerado, mute ligado ou perfil sem entrada.
- Bluetooth conectado mas sem áudio exige verificar sink, perfil, codec e volume — nessa ordem.
- Um script de três comandos (`wpctl status`, `systemctl --user status`, `aplay -l`) cobre 80% dos diagnósticos.

## Exercícios

1. Siga o algoritmo do "sem som" completo, mesmo que seu som esteja funcionando. Em cada passo, anote o que você vê e por que o som estaria ou não quebrado ali.
2. Crie o script de diagnóstico de três comandos sugerido e execute-o. Ele está cobrindo todas as camadas?
3. Cause um problema proposital: silencie o sink padrão e depois use o script para encontrar o problema em menos de dez segundos.
4. Plugue um fone e um headset Bluetooth ao mesmo tempo. Com `pactl list sinks short` e `move-sink-input`, faça com que dois streams diferentes saiam em saídas diferentes. Qual é o índice de cada um?
5. **Desafio.** Combine o que você aprendeu neste capítulo e no [capítulo sobre systemd](#/cap-007/sec-05) (serviços de usuário) para criar um serviço systemd de usuário que, ao ser iniciado, restaure o volume do sink padrão para 50%, dessilencie e registre a ação no journal com `logger`. Teste com `systemctl --user start` e confira os logs.