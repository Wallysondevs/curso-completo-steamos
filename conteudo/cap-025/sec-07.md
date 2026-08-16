Nem toda conexão de monitor no SteamOS é plug-and-play. Monitores que somem ao desconectar o dock, telas piscando sem motivo, ou o cursor que atravessa "pelo alto" em vez de pelo lado: esses são os três problemas mais relatados desde o lançamento do deck. Esta seção vai direto ao diagnóstico — o que checar, em que ordem, e qual comando usar.

A filosofia aqui não é "tentar coisas e ver se resolve", mas sim isolar a camada do problema: física (cabo/dock/power), kernel (DRM/EDID), ou userspace (KScreen/configuração).

:::objetivos
- Diagnosticar um monitor que não aparece com `kscreen-doctor -o` e `dmesg`
- Corrigir tela piscando por refresh rate fora do esperado
- Resolver o "monitor sumiu após desconectar" sem reiniciar
- Reparar geometria quebrada em monitores com orientação trocada
- Resetar a configuração inteira do KScreen para voltar ao estado limpo
:::

## Monitor não aparece: isole a camada

O fluxograma do diagnóstico segue três perguntas. Primeiro: o sistema viu o monitor? Se não aparece no `kscreen-doctor -o` nem no `xrandr`, a falha está na detecção de hardware. Segundo: o sistema viu, mas não ativou? Isso costuma ser o KScreen escolhendo "não usar" a saída. Terceiro: o sistema ativou, mas a tela está preta? Aí o problema é o cabo, o dock ou o link.

Comece pelo `kscreen-doctor -o`:

```terminal
$ kscreen-doctor -o | head -3
Output: 1 eDP-1
	priority 2
	Modes:  9:1280x800@60*!
```

Se a sua saída HDMI/DP não aparece, vá ao `dmesg`:

```terminal
$ sudo dmesg | grep -i drm | tail -10
[  12.401138] [drm] DP-1: disconnected
[  12.534201] [drm] HDMI-A-1: disconnected
[  15.672103] [drm] HDMI-A-1: connected -> hpd detected
[  15.873440] [drm] EDID read for HDMI-A-1: 256 bytes
```

A linha `EDID read` é o divisor de águas: se ela existe, o kernel enxergou o monitor e leu seus modos. Se ela não existe mesmo com o cabo plugado, o problema é físico — cabo, dock ou porta.

## Tela piscando ou "pisca-pisca" aleatório

A causa mais comum de flicker (piscada rápida e intermitente) é uma incompatibilidade de refresh rate entre o deck e o monitor. O KScreen às vezes escolhe um modo de taxa fracionária (59.94 Hz) que o painel não tolera bem, especialmente em docks baratos.

O diagnóstico é direto: force a taxa inteira mais próxima:

```terminal
$ kscreen-doctor output.HDMI-A-1.modes
Output: 2 HDMI-A-1
	Modes:  1:1920x1080@60*  2:1920x1080@59.94  3:1920x1080@50
$ kscreen-doctor output.HDMI-A-1.mode.1920x1080@60
```

Se o flicker parar imediatamente, o `59.94` era o culpado. Se continuar, teste o `@50` — alguns monitores europeus foram fabricados para 50 Hz como taxa nativa e ficam instáveis em 60.

Outra fonte comum de flicker é o **VRR** (Variable Refresh Rate, taxa de atualização variável). O `kscreen-doctor -o` informa o estado:

```terminal
$ kscreen-doctor -o
Output: 2 HDMI-A-1
	...
	Vrr: Automatic
```

`Automatic` significa que o KScreen tenta negociar VRR — recurso ótimo para jogos, mas que pode causar flicker em monitores que não implementam bem o padrão. Para desligar:

```terminal
$ kscreen-doctor output.HDMI-A-1.vrr.never
```

:::atencao
Flicker em modo desktop com VRR ativo é conhecido em alguns monitores Samsung e LG de entrada. Se o problema some com `vrr.never`, o monitor não é "defeituoso" — ele só não implementa VRR corretamente no firmware, e desligar resolve sem perda de qualidade visual.
:::

## Monitor sumiu após desconectar o dock

É o bug mais irritante: você tira o dock, e a tela interna não volta — ou volta deslocada, com escala errada. O KScreen "lembra" do setup anterior e tenta aplicar a geometria antiga.

A correção rápida é forçar a tela interna ao estado padrão:

```terminal
$ kscreen-doctor output.eDP-1.enable
$ kscreen-doctor output.eDP-1.position.0,0
$ kscreen-doctor output.eDP-1.mode.1280x800@60
$ kscreen-doctor output.eDP-1.scale.1
```

Essa sequência reativa o painel, posiciona na origem, aplica modo e escala padrão. Quatro comandos que resolvem 90% dos casos de "tela interna não voltou".

Se nem isso funcionar, o KScreen pode estar travado. Mate o daemon e o deixe renascer:

```terminal
$ systemctl --user restart plasma-kscreen.service
$ kscreen-doctor -o
```

O `plasma-kscreen.service` é a unidade systemd (escopo de usuário) que mantém o daemon. Reiniciá-la equivale a desligar e ligar o gerenciador de telas, sem reboot.

## Resetando toda a configuração do KScreen

Quando nada funciona — geometria maluca que persiste entre reconexões, modos que somem — o último recurso é zerar o banco de configurações do KScreen e deixá-lo reaprender do zero:

```terminal
$ rm ~/.local/share/kscreen/*
```

Esse diretório guarda arquivos de estado de cada combinação de monitores já vista. Apagar tudo é seguro: na próxima conexão, o KScreen age como se nunca tivesse visto aquele monitor antes e aplica as heurísticas padrão de novo, zerando geometria, escala e modos.

:::perigo
O `rm` com glob (`*`) não pede confirmação. Antes de executar, liste o conteúdo com `ls ~/.local/share/kscreen/` para ter certeza de que está no diretório certo. Um `rm` acidental em outro lugar pode ser catastrófico.
:::

## O "cursor que some pela borda errada"

Sintoma: você move o mouse para a direita e ele desaparece; ele está entrando num monitor que o KScreen posicionou acima ou abaixo. A coordenada `y` está errada. Corrija a posição relativa com o vocabulário natural do `xrandr`:

```terminal
$ xrandr --output HDMI-A-1 --auto --right-of eDP-1
$ xrandr --query | grep -E 'connected (primary )?\d+x'
eDP-1 connected primary 1280x800+1920+0
HDMI-A-1 connected 1920x1080+0+0
```

Aqui `+1920+0` na linha do eDP significa que a tela interna está à direita do HDMI (posição `+0+0` do HDMI + 1920 de largura dele). O cursor atravessa na horizontal, sem degrau vertical.

:::dica
O `--right-of` sempre alinha pelo topo (mesma coordenada `y=0`). Se os monitores têm alturas físicas diferentes, você pode querer um alinhamento pelo centro ou pela base — nesse caso, use posição absoluta com coordenada `y` calculada: `kscreen-doctor output.eDP-1.position.1920,160` (160 = 1080 − 800 para centralizar a tela do deck num monitor 1080p).
:::

## Resumo

- Monitor não aparece: `kscreen-doctor -o` primeiro; se ausente, `sudo dmesg | grep drm` para ver se o kernel leu a EDID.
- Flicker: force taxa inteira (`@60`, não `@59.94`) e desative VRR com `vrr.never`.
- Tela interna não volta após dock: sequência `enable` + `position.0,0` + `mode.1280x800@60` + `scale.1`.
- Daemon travado: `systemctl --user restart plasma-kscreen.service`.
- Configuração corrompida: `rm ~/.local/share/kscreen/*` zera o histórico e deixa o KScreen reaprender.
- Cursor na borda errada: use `--right-of` no `xrandr` ou ajuste a coordenada `y` na posição absoluta.

## Exercícios

1. Desconecte o monitor de surpresa e veja se a tela interna volta sozinha. Se não, aplique a sequência `enable` + `position` + `mode`.
2. Force `59.94` num monitor 1080p e observe se há flicker. Depois volte para `60` e registre a diferença.
3. Rode `ls ~/.local/share/kscreen/` e identifique quantos arquivos de estado o KScreen já acumulou.
4. Reinicie o `plasma-kscreen.service` e veja o que acontece com as telas durante o restart.
5. **Desafio.** Simule um "estado quebrado": altere a posição do monitor para `5000,5000` com `kscreen-doctor output.HDMI-A-1.position.5000,5000`, faça o cursor "sumir", depois restaure com `rm ~/.local/share/kscreen/*` seguido de reconexão. Documente cada passo e o resultado.