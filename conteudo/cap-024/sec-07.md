Até aqui você aprendeu a trocar de saída, ajustar volume por aplicativo e parear headsets. Mas o PipeWire guarda uma camada de ajuste fino que a interface não mostra: os **perfis de hardware** e os controles de ganho por canal, que vão desde escolher qual conector físico usar até definir o equilíbrio entre esquerdo e direito. Esta seção cobre esses controles avançados que completam o domínio da saída de áudio.

:::objetivos
- Listar perfis de hardware disponíveis com `pactl list cards`
- Trocar o perfil ativo de uma placa de som com `pactl set-card-profile`
- Ajustar volume por canal (esquerdo/direito) separadamente
- Entender os modos "HiFi" do chip ACP5x do Deck
- Usar o `pavucontrol` como ferramenta gráfica complementar de diagnóstico
:::

## Perfis de hardware: o que a placa realmente sabe fazer

Toda placa de som — inclusive o chip AMD ACP5x do Steam Deck — expõe mais de uma configuração possível. Essas configurações são os **perfis** (profiles), e cada perfil habilita um subconjunto dos conectores e conversores do chip. A placa do Deck, por exemplo, sabe operar em vários modos: só alto-falantes, só fone, ambos ao mesmo tempo, com ou sem microfone.

O comando para ver os perfis disponíveis é o `pactl list cards`. Ele lista as placas de som do sistema com seus perfis e o perfil ativo — tudo dentro da sessão do usuário `deck`:

```terminal
$ whoami
deck
$ pactl list cards
Card #44
	Name: alsa_card.pci-0000_04_00.5-platform-acp5x_mach.0
	Driver: alsa
	Owner Module: n/a
	Properties:
		device.description = "Family 17h/19h HD Audio Controller"
		device.profile-set = "acp5x.conf"
	Profiles:
		off: Desligado (sinks: 0, sources: 0)
		output:stereo-fallback: Saída Estéreo (sinks: 1, sources: 0)
		input:stereo-fallback: Entrada Estéreo (sinks: 0, sources: 1)
		input:mono-fallback: Entrada Mono (sinks: 0, sources: 1)
		output:stereo-fallback+input:stereo-fallback: Saída Estéreo + Entrada Estéreo (sinks: 1, sources: 1)
	Active Profile: output:stereo-fallback+input:stereo-fallback
```

Os nomes são autoexplicativos. O perfil ativo `output:stereo-fallback+input:stereo-fallback` significa que a placa está usando saída estéreo (alto-falantes ou fone) e entrada estéreo (microfone) simultaneamente. O perfil `off` desliga completamente a placa — raramente desejável, mas útil para testes.

Para trocar de perfil, o comando usa o nome da placa (campo `Name` da saída acima):

```terminal
$ pactl set-card-profile alsa_card.pci-0000_04_00.5-platform-acp5x_mach.0 output:stereo-fallback
$ pactl list sinks short
46	alsa_output.pci-0000_04_00.5-platform-acp5x_mach.0.HiFi__hw_acp5x_1__sink	PipeWire	float32le 2ch 48000Hz	IDLE
```

Agora só existe um sink (sem a source), porque escolhemos o perfil `output:stereo-fallback`. Se você precisar do microfone de volta, retorne ao perfil combinado.

:::atencao
Trocar para um perfil que não inclui o microfone **remove a source do sistema**. Se um aplicativo estiver com o microfone aberto, ele receberá um erro. Antes de trocar, feche chamadas e gravadores para evitar perda de captura.
:::

## Volume por canal: estereofonia fina

O controle de volume que você usou até agora (`wpctl set-volume`, `pactl set-sink-volume`) aplica o mesmo valor aos dois canais. Mas o PipeWire permite tratar cada canal separadamente, o que resolve o caso de um fone desbalanceado ou um falante mais baixo que o outro:

```terminal
$ pactl set-sink-volume @DEFAULT_SINK@ 80% 50%
$ pactl list sinks | grep -A1 "Volume:"
	Volume: front-left: 52429 /  80% / -5.81 dB,   front-right: 32768 /  50% / -18.06 dB
```

O primeiro valor (`80%`) é para o canal esquerdo; o segundo (`50%`) para o direito. Para restaurar o equilíbrio:

```terminal
$ pactl set-sink-volume @DEFAULT_SINK@ 70% 70%
$ pactl list sinks | grep -A1 "Volume:"
	Volume: front-left: 45875 /  70% / -9.27 dB,   front-right: 45875 /  70% / -9.27 dB
```

O `wpctl` também suporta o ajuste por canal, embora com sintaxe diferente — usando `L` e `R` prefixando o valor:

```terminal
$ wpctl set-volume @DEFAULT_AUDIO_SINK@ 0.85 0.55
```

## O pavucontrol como diagnóstico visual

Nem tudo se resolve no terminal. O **pavucontrol** (PulseAudio Volume Control) é uma ferramenta gráfica que funciona perfeitamente com o PipeWire via pipewire-pulse. Ela expõe numa única tela as cinco abas: Reprodução (streams), Gravação (capturas), Dispositivos de saída, Dispositivos de entrada e Configuração (perfis de hardware).

Para instalá-lo no SteamOS (modo desktop), se ainda não estiver presente:

```terminal
$ sudo apt install pavucontrol
$ pavucontrol
```

O pavucontrol é útil não porque faz o que o terminal não faz, mas porque **mostra tudo ao mesmo tempo** num layout que facilita o diagnóstico. Se um som está baixo e você não sabe por quê, abrir o pavucontrol e olhar as cinco abas costuma revelar, em segundos, qual camada está com o volume baixo — o sink, o stream ou o perfil errado.

:::dica
O pavucontrol é a ferramenta de triagem rápida: se você está confuso sobre por que não sai som, abra-o e olhe a aba "Configuração" (perfil ativo) e a aba "Dispositivos de Saída" (sink certo, não mudo). Nove entre dez casos se resolvem nessa inspeção de cinco segundos, antes de qualquer comando.
:::

## Resumo

- `pactl list cards` mostra os perfis de hardware da placa de som; o perfil ativo determina quais sinks e sources existem.
- `pactl set-card-profile <card> <perfil>` alterna entre modos como só saída, só entrada ou ambos.
- `pactl set-sink-volume @DEFAULT_SINK@ <L%> <R%>` ajusta canais esquerdo e direito separadamente.
- O pavucontrol é uma ferramenta gráfica complementar que condensa streams, dispositivos e perfis em uma só tela.
- O chip ACP5x do Deck suporta perfis que combinam alto-falantes, fone e microfone de forma flexível.

## Erros comuns ao mexer em perfis

Três erros voltam a aparecer em quem começa a trocar perfis de hardware. O primeiro: trocar para um perfil que desabilita a saída enquanto um jogo toca — o som é cortado na hora. O segundo: selecionar um perfil mono para o microfone (`input:mono-fallback`) e depois estranhar que gravações em aplicativos estéreo só capturam o canal esquerdo. O terceiro: esquecer que a troca de perfil **remove sinks e sources** do grafo do PipeWire, o que pode fazer aplicativos que estavam usando o dispositivo travarem.

A regra de ouro: antes de trocar de perfil, anote o perfil atual com `pactl list cards | grep "Active Profile"` para poder voltar. E feche aplicativos que estejam usando áudio — a troca é menos traumática com o grafo em repouso.

## Exercícios

1. Liste os perfis disponíveis com `pactl list cards` e anote qual está ativo e quantos sinks/sources cada perfil oferece.
2. Troque para o perfil só de saída (`output:stereo-fallback`) e confirme com `pactl list sinks short` que o sink existe mas a source sumiu.
3. Ajuste o volume do canal direito para 20% abaixo do esquerdo e ouça um arquivo estéreo — perceba o desequilíbrio e depois restaure.
4. Instale o pavucontrol e explore as cinco abas identificando, em cada uma, o equivalente do terminal que você já conhece.
5. **Desafio.** Crie dois perfis personalizados (se o hardware permitir) alternando entre eles com um script que grave o perfil atual, troque e depois restaure — usando `pactl list cards | grep "Active Profile"` e `pactl set-card-profile`. Teste com um áudio tocando durante a troca.