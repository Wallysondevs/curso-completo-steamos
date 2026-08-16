Diagnosticar um servidor de áudio que não responde é diferente de ajustá-lo. Quando o som some, o fone não é detectado ou o Bluetooth se recusa a conectar, você precisa de ferramentas que mostrem o estado interno dos processos, seus logs e o caminho que o áudio percorre. Esta seção é sobre isso: verificar se o PipeWire está de pé, ler seus logs e inspecionar o roteamento com uma abordagem de investigação.

:::objetivos
- Verificar saúde dos três serviços com `systemctl --user status`
- Ler os logs do PipeWire e WirePlumber com `journalctl --user`
- Rastrear o grafo de nós do PipeWire com `pw-dump` e `pw-top`
- Entender mensagens de erro comuns nos logs de áudio
- Reiniciar a pilha de áudio inteira sem reiniciar o Deck
:::

## O check-up rápido: três serviços, três estados

A primeira pergunta quando o som para é: o servidor está rodando? O comando que você já conhece da seção 1 é o ponto de partida, mas agora você o lê com olhos de diagnóstico:

```terminal
$ whoami && hostname
deck
steamdeck
$ systemctl --user status pipewire pipewire-pulse wireplumber
```

Os três devem estar `active (running)`. Se um deles estiver `failed` ou `inactive`, você achou o culpado. Mas há nuances: o WirePlumber pode estar rodando e ainda assim não ter detectado um dispositivo, e o `pipewire-pulse` pode estar ativo mas o protocolo PulseAudio não estar aceitando conexões. Por isso, depois do comando de status, confirme que o protocolo está ouvindo:

```terminal
$ pactl info | head -1
Server String: /run/user/1000/pulse/native
```

Se essa linha aparecer, o `pipewire-pulse` está ouvindo no socket esperado. Se o comando `pactl info` devolver erro de conexão, o protocolo está quebrado mesmo com o serviço `active`.

## Lendo os logs: o que o PipeWire tem a dizer

Os logs da pilha de áudio não vão para `/var/log/syslog` diretamente — eles passam pelo journal do systemd, e o filtro por unidade de usuário os isola com precisão. O comando-base é o `journalctl --user`, com o `-u` para filtrar por unidade:

```terminal
$ journalctl --user -u pipewire --no-pager -n 20
jun 09 10:12:31 steamdeck pipewire[831]: spa.alsa: 'front:acp5x,1' playback open 'front:acp5x,1': Success
jun 09 10:12:31 steamdeck pipewire[831]: pw.node: (alsa_output.pci-0000_04_00.5-36) created
jun 09 10:12:31 steamdeck pipewire[831]: pw.node: (alsa_output.pci-0000_04_00.5-36) -> registered
jun 09 10:12:31 steamdeck pipewire[831]: pw.node: (alsa_output.pci-0000_04_00.5-36) -> activated
```

Essas quatro linhas contam o ciclo de vida de uma saída de áudio ALSA sendo descoberta pelo PipeWire: o `spa.alsa` abre o dispositivo (`playback open`), o nó é criado (`created`), registrado (`registered`) e ativado (`activated`). Se uma dessas linhas falhasse, você saberia o passo exato em que a detecção quebrou.

Para o WirePlumber, o filtro equivalente:

```terminal
$ journalctl --user -u wireplumber --no-pager -n 20
jun 09 10:12:31 steamdeck wireplumber[848]: [string "alsa.lua"]: <debug> Found 1 cards
jun 09 10:12:31 steamdeck wireplumber[848]: [string "alsa.lua"]: <debug> Card 'alsa_card.pci-0000_04_00.5-platform-acp5x_mach.0' created
jun 09 10:12:31 steamdeck wireplumber[848]: [string "alsa.lua"]: <debug> Creating node for 'alsa_output.pci-0000_04_00.5...'
jun 09 10:12:31 steamdeck wireplumber[848]: selecting best profile for card
```

Aqui o WirePlumber conta que achou uma placa (`card`), criou um nó de saída para ela e selecionou o melhor perfil automaticamente. É o que acontece no boot e toda vez que um dispositivo é plugado.

:::dica
Para ver os logs em tempo real enquanto você pluga um dispositivo — o "modo investigação" mais produtivo — use `journalctl --user -u wireplumber -f`. A flag `-f` faz o journal seguir o arquivo como um `tail -f`, mostrando cada nova linha assim que aparece. Conecte o fone e observe.
:::

## O grafo de nós do PipeWire

O PipeWire organiza tudo — dispositivos, streams, sinks, sources — como um grafo de **nós** conectados por **links**. Visualizar esse grafo é a forma mais direta de entender por onde o áudio está fluindo. O `pw-dump` exporta o grafo inteiro em JSON:

```terminal
$ pw-dump | jq '.[] | select(.type == "PipeWire:Interface:Node") | {id: .id, name: .props."node.name", media: .info.props."media.class"}'
```

Isso devolve cada nó com seu ID, nome e classe. Um nó com `media.class` igual a `Audio/Sink` é uma saída; `Audio/Source` é uma entrada; `Stream/Output/Audio` é um aplicativo reproduzindo. Com essa informação você consegue rastrear exatamente qual aplicativo está ligado a qual saída.

Para uma visão dinâmica — o equivalente a um `htop` do áudio — use o `pw-top`:

```terminal
$ pw-top
```

A tela é dividida por nó, com colunas de latência, taxa de amostragem e estado. É a ferramenta para diagnosticar *crackling* (estalos) e *underruns* (quando o buffer esvazia): se a latência de um nó ficar oscilando muito, o buffer está subdimensionado e o áudio trinca.

## Erros comuns nos logs e o que fazer

Algumas mensagens aparecem com frequência e não são graves; outras são sinais de problema real:

| Mensagem | Gravidade | O que fazer |
|---|---|---|
| `Failed to load module: module-alsa-card` | Alta | O ALSA não reconheceu a placa. Confira com `aplay -l` |
| `bluetooth: connect failed: Device or resource busy` | Média | Dispositivo já conectado em outro perfil; desconecte e reconecte |
| `suspending node ... due to idle timeout` | Baixa | PipeWire desligou um nó ocioso para economizar energia. Normal |
| `No output formats available` | Alta | Codec ou perfil incompatível com o dispositivo; troque o perfil com `pactl set-card-profile` |
| `could not create memory map` | Média | Falta de memória ou permissão; confira os limites com `ulimit -l` |

A linha que realmente acende o alerta é `Failed to load module`, porque indica que o PipeWire não está conseguindo subir um driver essencial — e aí o dispositivo simplesmente não aparece.

## Reiniciando a pilha de áudio

Quando o diagnóstico falha e você só quer o som de volta, o reinício da pilha inteira é a última cartada antes de reiniciar o Deck. A ordem importa: o WirePlumber depende do PipeWire, e o pipewire-pulse depende de ambos. O comando composto resolve:

```terminal
$ systemctl --user restart pipewire pipewire-pulse wireplumber
$ systemctl --user status pipewire pipewire-pulse wireplumber | grep Active
     Active: active (running) since ... 
     Active: active (running) since ... 
     Active: active (running) since ... 
```

Os três voltam com `active (running)`. Depois do restart, confira com `pactl list sinks short` e `wpctl status` se os dispositivos reapareceram. Se um dispositivo Bluetooth não voltar, reconecte-o com `bluetoothctl connect <MAC>`.

:::perigo
Reiniciar o PipeWire derruba **todo o áudio** da sessão do usuário. Jogos, chamadas e gravações perdem o som e precisam ser reabertos ou reconfigurados. Só faça isso se o diagnóstico apontar um problema que o restart resolve.
:::

## Resumo

- `systemctl --user status pipewire pipewire-pulse wireplumber` é o check-up inicial; os três devem estar `active (running)`.
- `journalctl --user -u pipewire -n 20` e `-u wireplumber` mostram a detecção de dispositivos e erros.
- `journalctl --user -u wireplumber -f` segue os logs em tempo real — ideal para depurar conexões de dispositivo.
- `pw-top` é o monitor de desempenho; `pw-dump` exporta o grafo de nós em JSON.
- `systemctl --user restart pipewire pipewire-pulse wireplumber` reinicia a pilha inteira, derrubando todo o áudio momentaneamente.

## Exercícios

1. Execute `systemctl --user status pipewire pipewire-pulse wireplumber` e inspecione a coluna `Active`. Há algum em estado diferente de `running`?
2. Rode `journalctl --user -u wireplumber -n 50` e identifique uma linha de criação de card e uma de criação de sink.
3. Abra `pw-top` e observe a latência dos nós enquanto você dispara um áudio com `pw-play`. A latência sobe ou se mantém estável?
4. Reinicie a pilha de áudio com `systemctl --user restart pipewire pipewire-pulse wireplumber` e, em seguida, confira com `pactl list sinks short` se todos os dispositivos voltaram.
5. **Desafio.** Use `pw-dump | jq` para construir um mapa dos nós ativos: liste cada nó com seu `id`, `node.name` e `media.class`. Depois, plugue um fone e refaça o comando, comparando a diferença — qual nó novo apareceu?