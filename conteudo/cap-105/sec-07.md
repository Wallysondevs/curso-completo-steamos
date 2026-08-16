Áudio e vídeo estão no "meio" do Steam Deck: o som sai pelo PipeWire (a nova camada de áudio que substituiu o PulseAudio), o vídeo é composto pelo Gamescope (no Modo Jogo) ou pelo KDE (no Desktop), e a saída externa depende de um dock USB-C com DisplayPort alt-mode. Quando um desses três elos quebra, o sintoma é confuso — "sem som", "tela distorcida", "HDMI não dá imagem" — mas a causa costuma estar num lugar bem específico. Esta seção desfaz o nó.

O ponto crítico que poucos sabem: o **stream de vídeo e o de áudio são independentes** no USB-C. Você pode ter imagem na TV mas som saindo do alto-falante do Deck (rota de áudio errada), ou som na TV e imagem presa no Deck (rota de vídeo errada). Tratar os dois como um único "problema de dock" é o erro que faz você procurar no lugar errado.

:::objetivos
- Diagnosticar "sem som" percorrendo a cadeia PipeWire (sink, mute, rota)
- Separar problema de vídeo interno (painel) de vídeo externo (docks/hdmi)
- Corrigir resolução, refresh e distorção na saída externa com xrandr
- Entender o modelo de roteamento de áudio e vídeo do SteamOS
- Saber quando é problema de cabo/dock/adapter em vez de software
:::

## Tabela de áudio e vídeo

| Sintoma | Causa provável | Solução |
|---|---|---|
| Sem som nenhum, em lugar nenhum | Sink mudo, serviço pipewire parado, volume zerado | `wpctl status` vê o sink; `wpctl set-volume @DEFAULT_AUDIO_SINK@ 0.5`; `systemctl --user status pipewire` |
| Som sai do alto-falante, não da TV (no dock) | Rota de áudio não mudou para o sink HDMI/USB | Selecione o sink correto no Quick Access ou `wpctl set-default <sink>` |
| Som corta/estala periodicamente | Buffer pipewire pequeno, interferência, sample rate | Ajuste `default.clock.rate`/quantum; teste outro cabo/dock |
| Tela interna com listras/artefatos | Driver amdgpu com modo errôneo, overclock de GPU | Volte o GPU clock ao padrão; `sudo dmesg | grep amdgpu`; reinicie |
| Tela externa preta ou "sem sinal" | Dock sem alt-mode DP, cabo ruim, mão errada de display | Teste outro dock/cabo; `xrandr --query` para ver se o monitor é listado |
| Resolução errada ou esticada no monitor externo | EDID mal lido, modo personalizado | `xrandr --output HDMI-1 --mode 1920x1080`; force com o modo certo |
| Imagem tremendo/flickering no externo | Refresh incompatível, VRR ligado em monitor sem suporte | Desligue VRR; ajuste refresh para 60 Hz; teste outro cabo |
| HDR quebrado/com cores lavadas | HDR ativo em pipeline sem suporte | Desligue HDR no Quick Access; verifique suporte do monitor/dock |
| Mouse/cursor invisível ou desalinhado | Escala DPI errada em monitor externo | Ajuste escala; no Desktop use `xrandr --scale` ou as configs KDE |

## Sem som: percorrendo a cadeia PipeWire

O "sem som" raramente é um único ponto. O áudio no SteamOS vive numa cadeia: aplicação → **PulseAudio/PipeWire** → **sink** (alto-falante, HDMI, Bluetooth) → hardware. Percorra de trás para frente:

```terminal
# Passo 1: o PipeWire está rodando (no usuário, não no root)?
$ systemctl --user status pipewire pipewire-pulse
● pipewire.service - PipeWire Multimedia Service
     Active: active (running)
```

Se estiver `inactive` ou `failed`, reinicie o stack:

```terminal
$ systemctl --user restart pipewire pipewire-pulse wireplumber
```

```terminal
# Passo 2: qual sink está ativo e qual o volume?
$ wpctl status
Audio
 ├─ Devices:
 │      45. Built-in Audio            [alsa]
 ├─ Sinks:
 │  *   48. Built-in Audio Analog Stereo [vol: 0.42]
```

O asterisco (`*`) marca o **sink padrão**. Se ele aponta para `HDMI`/`USB` mas o som deveria sair no alto-falante (ou vice-versa), mude o padrão:

```terminal
$ wpctl set-default 48        # usa o ID do sink desejado
$ wpctl set-volume 48 0.6     # ajusta o volume
```

```terminal
# Passo 3: está mutado globalmente?
$ wpctl get-volume @DEFAULT_AUDIO_SINK@
Volume: 0.42
```

O volume 0.00 ou um estado `MUTED` explica o "sem som" num instante. O `wireplumber` é o gerenciador de política que decide qual device aparece quando: se o dock não aparece como sink, o `wireplumber` pode estar com o profile errado.

:::dica
O atalho mental: **"sem som em tudo" = sink/volume/PipeWire; "som no lugar errado" = rota de sink; "som que corta" = buffer/interferência.** Isso cobre quase todo caso.
:::

## Vídeo externo: o nó do USB-C alt-mode

A saída de vídeo do Deck usa **DisplayPort alt-mode** sobre USB-C. Isso tem duas implicações práticas: nem todo dock suporta alt-mode (alguns são só para carregar/dados), e nem todo cabo USB-C transporta vídeo (cabos "só carga" existem e são comuns).

```terminal
# O monitor externo aparece para o sistema?
$ xrandr --query
Screen 0: minimum 16 x 16, current 1280 x 800, maximum 32767 x 32767
eDP-1 connected primary 1280x800+0+0 (normal left inverted right) ...
HDMI-1 connected 1920x1080+1280+0 (normal left inverted right) ...
```

Se o monitor **não aparece** no `xrandr`, o problema está entre o Deck e o monitor: cabo, dock ou suporte a alt-mode. Troque os componentes nesta ordem (do mais barato para o mais caro): cabo → adaptador → dock.

Se o monitor aparece mas com **resolução/refresh errado**, force o modo:

```terminal
$ xrandr --output HDMI-1 --mode 1920x1080 --rate 60
```

Para que a saída reflita o painel do Deck (espelhado) ou estenda, use o atalho do SteamOS ou:

```terminal
$ xrandr --output HDMI-1 --same-as eDP-1      # espelhar
$ xrandr --output HDMI-1 --right-of eDP-1     # estender
```

O **flickering** num monitor externo quase sempre é refresh/resolução fora do suportado ou VRR mal-negoceado. Desligue o VRR (Quick Access → Desempenho) e fixe 60 Hz antes de suspeitar de hardware.

## Tela interna com artefatos

Listras, cores erradas ou "neve" na **tela interna** (não externa) têm outra natureza: é o painel ou o driver de GPU, não o dock. As causas mais prováveis:

1. **Overclock/undervolt mal configurado** — se você mexeu em APU tuning (cap. 77), reverta para o padrão.
2. **Driver amdgpu em modo incorreto** — um update de kernel pode ter trocado o modo de exibição; reinicie e veja se some.
3. **Cabo interno do painel** — se os artefatos aparecem já no BIOS (antes do SteamOS carregar), é hardware (cabo flex ou tela), não driver.

```terminal
$ sudo dmesg | grep -i 'amdgpu\|drm'
[ ...] amdgpu 0000:04:00.0: [drm] Fence fallback timer expired on ring gfx
```

Mensagens como `ring gfx` ou `GPU reset` no `dmesg` apontam para o driver/GPU, não para o painel. Se os artefatos reaparecem mesmo após reboot limpo e BIOS, o problema é físico — veja o capítulo de troca de tela.

:::atencao
Um teste rápido para separar driver de hardware: **entre na BIOS segurando `Volume+` ao ligar**. Se a tela da BIOS já mostra listras/artefatos, o problema é o painel ou o cabo (hardware). Se a BIOS aparece limpa e os artefatos só surgem no SteamOS, é driver/configuração (software).
:::

## HDR e cores

O SteamOS (no OLED) tem suporte a HDR. O HDR quebrado se manifesta como cores lavadas, branco estourado ou a imagem "cinza". As causas mais comuns:

- **HDR ligado num pipeline sem suporte** (dock que não passa HDR, monitor SDR).
- **Faixa dinâmica negociada errada** entre o amdgpu e o Gamescope.

Desligue o HDR no Quick Access → Desempenho e reinicie o jogo. Se o problema é na TV externa, o monitor precisa declarar suporte a HDR via EDID — um dock antigo entre o Deck e a TV pode "esconder" essa informação, degradando para SDR.

:::nota
Referências aprofundadas: som e dispositivos de áudio (cap. 24), monitores externos/dock/multimonitor (cap. 25), e o cap. 10 para o Gamescope (compositor do Modo Jogo).
:::

## Resumo

- "Sem som" percorre a cadeia PipeWire: serviço → sink → volume. Use `wpctl` em cada etapa.
- "Som no lugar errado" é rota de sink; troque o default com `wpctl set-default`.
- Vídeo externo depende de alt-mode DP sobre USB-C: cabo/dock errado é a causa nº 1.
- Flickering/resolução errada no externo = refresh, VRR ou EDID; force 60 Hz e desligue VRR.
- Artefatos na tela interna: teste a BIOS para separar driver (software) de painel/cabo (hardware).

## Exercícios

1. Execute `wpctl status` e identifique o sink padrão (asterisco). Liste todos os sinks disponíveis. Qual é o de alto-falante e qual seria o de HDMI?
2. Mude o volume e o sink pelo terminal: `wpctl set-volume @DEFAULT_AUDIO_SINK@ 0.3`. O som deu para perceber a mudança sem tocar na GUI?
3. Conecte um monitor externo (via dock) e execute `xrandr --query`. O monitor aparece? Qual a resolução/refresh negociados? Compare com o nativo do monitor.
4. Force uma resolução no monitor externo com `xrandr --output ... --mode ...` (use `xrandr --query` para achar o nome exato da saída). A imagem mudou corretamente?
5. **Desafio.** Entre na BIOS (`Volume+` ao ligar) e observe a tela: ela está limpa ou com artefatos? Registre o que isso diz sobre a saúde do painel versus a do driver.