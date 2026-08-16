Bluetooth é o ponto mais frágil da experiência de áudio do Deck e, ao mesmo tempo, o mais libertador — sair do cabo num console portátil faz diferença. O PipeWire emparelha e gerencia headsets Bluetooth diretamente, sem camada extra, mas a negociação de codecs e a alternância entre perfis (headset com microfone versus fone estéreo de alta qualidade) são uma fonte frequente de frustração. Esta seção cobre o ciclo completo: pareamento, seleção de codec e os dois perfis que dividem o Bluetooth em dois.

:::objetivos
- Parear um dispositivo Bluetooth com `bluetoothctl`
- Listar dispositivos pareados e seus endereços MAC
- Selecionar o codec de áudio entre SBC, AAC e aptX
- Entender o dilema HSP/HFP versus A2DP nos perfis de headset
- Conectar e desconectar um headset sem abrir a interface gráfica
:::

## O básico do `bluetoothctl`

O PipeWire gerencia áudio, mas o pareamento e a conexão são assunto do **BlueZ**, o stack Bluetooth do Linux. A ferramenta de linha de comando para falar com ele é o `bluetoothctl`, que opera em modo interativo ou com comandos diretos.

Para um pareamento novo, você precisa de três passos: ligar o dispositivo em modo de pareamento, escanear, e conectar. O modo interativo é mais prático porque o scan devolve vários resultados antes de você decidir:

```terminal
$ bluetoothctl
[bluetooth]# power on
Changing power on succeeded
[bluetooth]# scan on
Discovery started
[NEW] Device E8:78:29:4F:3B:1A WH-1000XM5
[bluetooth]# pair E8:78:29:4F:3B:1A
Attempting to pair with E8:78:29:4F:3B:1A
[CHG] Device E8:78:29:4F:3B:1A Paired: yes
Pairing successful
[bluetooth]# connect E8:78:29:4F:3B:1A
Attempting to connect to E8:78:29:4F:3B:1A
[CHG] Device E8:78:29:4F:3B:1A Connected: yes
[bluetooth]# trust E8:78:29:4F:3B:1A
[CHG] Device E8:78:29:4F:3B:1A Trusted: yes
[bluetooth]# exit
```

O comando `trust` é opcional, mas recomendado: ele faz com que o dispositivo reconecte automaticamente quando ligado e dentro do alcance. Sem `trust`, você precisa conectar manualmente toda vez.

Para listar dispositivos já conhecidos, o comando é rápido e não precisa de scan. Repare que o prompt mostra o usuário `deck` no host `steamdeck`:

```terminal
$ whoami
deck
$ hostname
steamdeck
$ bluetoothctl devices
Device E8:78:29:4F:3B:1A WH-1000XM5
Device 30:50:75:9A:C2:33 Anker Soundcore
```

Para reconectar um dispositivo que já foi pareado e perdeu a conexão:

```terminal
$ bluetoothctl connect E8:78:29:4F:3B:1A
Attempting to connect to E8:78:29:4F:3B:1A
[CHG] Device E8:78:29:4F:3B:1A Connected: yes
```

## Onde o headset aparece no PipeWire

Assim que a conexão Bluetooth é estabelecida, o WirePlumber detecta o novo dispositivo e cria um sink e uma source para ele. Você confere o resultado com o `pactl list sinks`:

```terminal
$ pactl list sinks short | grep blue
58	bluez_output.E8_78_29_4F_3B_1A.1	PipeWire	s16le 2ch 48000Hz	IDLE
```

A saída `short` do `pactl` (com a flag `short` no lugar de `list` completa) é uma tabela compacta: índice, nome, driver, formato e estado. O prefixo `bluez_output` denuncia o dispositivo Bluetooth, e o endereço MAC com underscores é o identificador. Para definir esse sink como padrão:

```terminal
$ pactl set-default-sink bluez_output.E8_78_29_4F_3B_1A.1
```

A partir desse momento, áudio novo vai para o headset. Repare no `.1` no final do nome: ele indica o perfil ativo, que é o assunto seguinte.

:::atencao
Se o headset aparecer no `bluetoothctl devices` mas não aparecer no `pactl list sinks`, o problema está no WirePlumber, não no BlueZ. Tente reiniciá-lo com `systemctl --user restart wireplumber` e refaça a lista de sinks. O PipeWire precisa dessa reinicialização para enxergar dispositivos que o BlueZ já viu.
:::

## A2DP versus HSP/HFP: o dilema dos dois perfis

O Bluetooth de áudio é dividido em dois perfis que não podem ser usados ao mesmo tempo no mesmo dispositivo:

- **A2DP** (Advanced Audio Distribution Profile): estéreo de alta qualidade, com codecs como SBC, AAC e aptX. Ideal para ouvir música e jogar, mas **sem microfone** — ou melhor, o microfone fica desabilitado.
- **HSP/HFP** (Headset Profile / Hands-Free Profile): mono, qualidade de telefone (8 kHz ou 16 kHz), mas com **microfone funcionando**. É o perfil usado em chamadas de voz.

A troca entre perfis é automática em teoria: quando um aplicativo abre o microfone (Discord, Steam Chat), o PipeWire tenta chavear para HSP. Mas na prática essa transição é frágil e às vezes falha, deixando o headset mudo ou o microfone inacessível.

Você inspeciona qual perfil está ativo com o `pactl list cards`, que agrupa sinks e sources sob um mesmo dispositivo:

```terminal
$ pactl list cards | grep -A10 "bluez"
Card #47
	Name: bluez_card.E8_78_29_4F_3B_1A
	Driver: pipewire
	Owner Module: n/a
	Properties:
		device.description = "WH-1000XM5"
		device.routes = "2"
	Active Profile: a2dp-sink
	Profiles:
		a2dp-sink: Alça de sumidouro de áudio estéreo (sinks: 1, sources: 0)
		headset-head-unit: Headset Head Unit (HSP/HFP) (sinks: 1, sources: 1)
```

O `Active Profile` mostra `a2dp-sink` — áudio de alta qualidade, sem microfone. Para trocar para o perfil de headset (com microfone), use o `pactl set-card-profile`:

```terminal
$ pactl set-card-profile bluez_card.E8_78_29_4F_3B_1A headset-head-unit
$ pactl list cards | grep -A2 "Active Profile"
	Active Profile: headset-head-unit
```

A troca é audível: o som fica mono e com qualidade reduzida, mas o microfone passa a funcionar. Para voltar ao estéreo:

```terminal
$ pactl set-card-profile bluez_card.E8_78_29_4F_3B_1A a2dp-sink
```

## Codecs: o que o Deck suporta

O codec padrão do Bluetooth é o **SBC**, obrigatório em todos os dispositivos. É o que você está usando se nunca mexeu nisso. O Steam Deck também suporta **AAC** (usado pela Apple e por muitos fones modernos) e, dependendo do hardware do headset, variantes do **aptX** da Qualcomm.

A seleção de codec no PipeWire é configurada num arquivo do WirePlumber, não por comando. O arquivo é `/usr/share/wireplumber/main.lua.d/50-alsa-config.lua`, e você pode sobrescrevê-lo em `~/.config/wireplumber/main.lua.d/51-bluetooth-codec.lua` para forçar um codec preferido:

```terminal
$ mkdir -p ~/.config/wireplumber/main.lua.d
$ cat > ~/.config/wireplumber/main.lua.d/51-bluetooth-codec.lua << 'EOF'
bluez_monitor.properties = {
  ["bluez5.codecs"] = "[ sbc aac aptx ]",
  ["bluez5.a2dp.aac.encoder"] = "/usr/lib/pipewire-0.3/libspa-codec-bluez5-aac.so"
}
EOF
$ systemctl --user restart wireplumber
```

A ordem entre colchetes (`sbc aac aptx`) define a prioridade: o PipeWire tenta negociar o primeiro codec da lista e vai descendo até achar um que o headset aceite. Para conferir qual codec está de fato em uso, o `pactl list sinks` exibe uma propriedade `bluetooth.codec`:

```terminal
$ pactl list sinks | grep -E "Description|codec"
	Description: WH-1000XM5
	bluetooth.codec = "AAC"
```

Aqui o codec ativo é o AAC. Se a linha mostrar `SBC`, o AAC não foi negociado — seja porque o headset não suporta, seja porque a configuração de codecs não incluiu o AAC.

:::dica
O SBC tem má fama por culpa de implementações ruins no passado, mas a implementação moderna do PipeWire (SBC-XQ) é decente. Se seu headset não suporta AAC ou aptX, o SBC com bitpool alto no PipeWire não é o gargalo que as pessoas imaginam. Antes de culpar o codec, verifique se o perfil não é o HSP/HFP — aí sim a qualidade despenca.
:::

## Resumo

- `bluetoothctl` é a ferramenta de linha de comando para parear (`pair`), conectar (`connect`) e confiar (`trust`) dispositivos.
- `bluetoothctl devices` lista os dispositivos já conhecidos pelo BlueZ.
- Sinks Bluetooth aparecem como `bluez_output.<MAC>` no `pactl list sinks`; o perfil ativo define se são estéreo (A2DP) ou headset com microfone (HSP/HFP).
- `pactl set-card-profile` alterna entre `a2dp-sink` (alta qualidade sem mic) e `headset-head-unit` (mic ativo, qualidade reduzida).
- Os codecs suportados (SBC, AAC, aptX) são configurados em arquivo WirePlumber; o codec em uso aparece em `bluetooth.codec` no sink.
- `systemctl --user restart wireplumber` resolve o caso de um dispositivo pareado que o `pactl` não enxerga.

## Exercícios

1. Entre no modo interativo `bluetoothctl` e execute `devices`. Há headsets pareados? Se não, faça o pareamento de um fone Bluetooth com `scan on` e `pair <MAC>`.
2. Conecte seu headset e localize o sink com `pactl list sinks short | grep blue`. Anote o nome completo do sink.
3. Verifique o perfil ativo com `pactl list cards | grep "Active Profile"`. Se for `a2dp-sink`, troque para `headset-head-unit` e ouça a diferença.
4. Descubra qual codec está em uso com `pactl list sinks | grep "bluetooth.codec"`.
5. **Desafio.** Conecte um headset Bluetooth e um fone com fio ao mesmo tempo. Usando `pactl move-sink-input`, faça com que um arquivo de áudio (tocado via `pw-play`) saia nos alto-falantes do Deck, outro no fone com fio e um terceiro no headset Bluetooth — três streams, três saídas diferentes, simultaneamente.