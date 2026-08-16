As seções anteriores deram as peças soltas: o codec que comprime, o bitrate que alimenta a imagem, a latência que a rede impõe e as ferramentas que medem tudo isso. Esta seção amarra as peças num único fluxo de otimização ponta a ponta — do fio na tomada até a tela do cliente — e dá uma ordem prática de trabalho para transformar uma sessão ruim em uma sessão limpa.

:::objetivos
- Aplicar uma ordem de diagnóstico do enlace físico ao codec
- Escolher codec, resolução e bitrate como uma decisão única e coerente
- Reconhecer os gargalos dominantes e priorizar o que tem maior retorno
- Consolidar um checklist final de otimização do Remote Play
:::

## A ordem certa de ataque

Otimizar fora de ordem é a causa número um de frustração: você mexe no bitrate enquanto o cabo está a 100 Mb/s, ou troca o codec quando o problema é power save no Wi-Fi. A sequência correta segue a direção do dado, da camada mais física à mais lógica.

**Primeiro, o enlace físico.** Confirme que a Ethernet está em Gigabit full-duplex e que o Wi-Fi está na banda certa com sinal forte. Sem isso resolvido, tudo o que vier depois é tapar o sol com a peneira.

**Segundo, o rádio e o jitter.** Desligue power save, confirme o canal menos congestionado e meça o jitter de verdade com `iperf3 -u`. Jitter alto mata mais do que throughput baixo.

**Terceiro, o teto de capacidade.** Meça o throughput sustentado e, a partir dele, calcule a folga. Só então faz sentido falar de bitrate.

**Quarto, codec, resolução e bitrate.** Escolha os três juntos, coerentes entre si e com a capacidade medida.

```terminal
$ ethtool eth0 | grep -E "Speed|Duplex"
        Speed: 1000Mb/s
        Duplex: Full
$ iw dev wlan0 link | grep -E "freq:|signal:"
        freq: 5180
        signal: -52 dBm
$ iperf3 -c 192.168.1.20 -u -b 30M -t 10
[ ID] Interval           Transfer     Bitrate         Jitter    Lost/Total Datagrams
[  5]   0.00-10.00  sec  35.8 MBytes  30.0 Mbits/sec  0.31 ms   0/21454 (0%)
```

Pressuponha que as três verificações passam: Gigabit, 5 GHz a -52 dBm, e 30 Mbps sem perda e com jitter mínimo. Só agora a configuração de streaming tem base para ser feita com segurança.

## Codec, resolução e bitrate como decisão única

As três variáveis formam um tripé: escolher cada uma isoladamente gera combinações incoerentes. Antes de decidir, vale registrar o estado consolidado que você já levantou nos passos anteriores — para ter o cenário inteiro numa única tela:

```terminal
$ ip -br addr show eth0 wlan0
eth0             UP             192.168.1.20/24
wlan0            UP             192.168.1.15/24
$ iw dev wlan0 link | grep -E "freq:|signal:"
        freq: 5180
        signal: -52 dBm
```

Com as duas interfaces ativas, Ethernet Gigabit e Wi-Fi a 5 GHz com sinal de -52 dBm, você sabe exatamente em que terreno está pisando. O fluxo de decisão é top-down, a partir do elo mais fraco.

1. **Defina a resolução pelo cliente.** Qual a tela do cliente? Um Deck (800p) não precisa de 4K; uma TV 4K pode até usar, se o enlace permitir. Resolução acima do que a tela e o enlace suportam é desperdício.

2. **Escolha o codec pela aceleração de hardware.** Se host e cliente codificam/decodificam HEVC por hardware, ele é o padrão: mesma qualidade com metade do bitrate. Confirmou com `vainfo`? Use HEVC.

3. **Calcule o bitrate da resolução + codec**, pela tabela do [capítulo de bitrate](#/cap-069/sec-03), e compare com o teto medido. Se não couber com folga, desça a resolução — nunca suba o bitrate além da capacidade.

```terminal
$ vainfo | grep -i "HEVCMain" 
      VAProfileHEVCMain               : VAEntrypointVLD
      VAProfileHEVCMain               : VAEntrypointEncSlice
```

A presença de `EncSlice` para HEVC confirma encode por hardware, fechando o tripé: host codifica HEVC, cliente decodifica HEVC, e o bitrate de 1080p@60 HEVC (15 a 25 Mbps) cabe no enlace medido com folga.

## Os gargalos dominantes e seus sinais

Cada gargalo tem uma assinatura distinta. Aprender a reconhecê-la evita mexer na coisa errada.

| Sintoma | Gargalo provável | Verificação |
|---|---|---|
| Imagem bonita mas congela e "conexão lenta" | Bitrate acima do enlace | `iperf3` com perda/jitter alto |
| Imagem blocada mas sem travar | Bitrate baixo demais para a resolução | Aumentar bitrate ou baixar resolução |
| RTT baixo mas mdev alto em picos | Wi-Fi disputado / power save | `iw dev wlan0 link` + power_save |
| FPS do jogo cai no host | Encode sem aceleração (codec errado) | `vainfo` procurando EncSlice |
| Queda intermitente da sessão | Cabo/dock com carrier flapping | `ethtool -S` carrier_changes |

O ganho mais barato quase sempre está no enlace físico e no power save — são correções rápidas e de alto impacto. Só depois de esgotá-las vale afinar codec e bitrate.

:::dica
Otimize até o "bom o suficiente", não até a perfeição. Uma sessão com RTT < 10 ms, jitter < 5 ms, perda < 1% e bitrate com 15% de folga já é visualmente impecável. Perseguir o último milissegundo tem retorno decrescente e rouba tempo.
:::

## O host no cabo, o client no Wi-Fi, o resto na medição

Se existe uma única regra que resume o capítulo inteiro, é esta: **mantenha o host no cabo**. O host é o lado que codifica e envia o fluxo contínuo; sujeitá-lo ao jitter do Wi-Fi multiplica os soluços. O cliente pode ficar no Wi-Fi 5 GHz, perto do roteador, com power save desligado.

E a única forma de saber se está certo é medir, não acreditar. Toda configuração deste capítulo se apoia em número: `ping` para o dia a dia, `iperf3` para a verdade do enlace, `ethtool` e `iw` para o diagnóstico físico. Configure, meça, ajuste, e meça de novo.

:::atencao
Cuidado com a memória de confirmação: você ajusta o bitrate, a sessão melhora, e você atribui a melhora à mudança errada. Sempre isole uma variável por vez e meça antes e depois. Dois ajustes simultâneos não revelam qual deles funcionou — e pioram o aprendizado.
:::

## O checklist final

Consolide tudo numa lista que você pode percorrer do início ao fim de cada diagnóstico:

1. `ethtool eth0` → Gigabit full-duplex, `Link detected: yes`, sem erros de CRC.
2. `iw dev wlan0 link` → banda 5 GHz, sinal melhor que -60 dBm, power save off.
3. `ping -c 100 -i 0.2` ao roteador → RTT < 10 ms, mdev pequeno.
4. `iperf3 -c <host> -u -b <bitrate-alvo>` → jitter < 5 ms, perda < 1%.
5. `vainfo` no host e no cliente → codec com encode/decode por hardware dos dois lados.
6. Steam client → resolução pela tela, bitrate fixo com 15% de folga do teto medido.

Cada item corresponde a uma seção deste capítulo. Se a sessão degra­dar, percorra a lista de novo: o problema quase sempre reacende um desses itens.

## Resumo

- Otimize na ordem do dado: enlace físico, rádio/jitter, teto de capacidade, e por fim codec/resolução/bitrate.
- Resolução, codec e bitrate formam um tripé e devem ser escolhidos juntos, a partir do elo mais fraco.
- Cada gargalo tem uma assinatura própria; reconhecê-la evita corrigir a causa errada.
- A regra-ouro é host no cabo e client no Wi-Fi 5 GHz, com power save desligado.
- Configure, meça, ajuste e meça de novo; isole uma variável por vez.

## Exercícios

1. Percorra o checklist completo da seção na sua casa e anote o resultado de cada um dos seis itens.
2. Identifique, pelo quadro de gargalos, qual é o gargalo dominante do seu setup atual e qual verificação o confirma.
3. Escolha a configuração ideal (codec, resolução, bitrate) para o seu enlace e justifique cada valor, citando a medição que o sustenta.
4. Aplique uma única otimização por vez, medindo `iperf3 -u` e `ping` antes e depois, e registre qual teve o maior impacto.
5. **Desafio.** Monte um documento de diagnóstico para um amigo: a ordem de ataque, os comandos com as saídas esperadas e os limiares de "bom/ruim". Inclua links internos para as seções de codec, bitrate, cabo × Wi-Fi, `ping`, `iperf3`, `ethtool`/`ip addr` e `iw`/`iwconfig`, fechando o ciclo do capítulo inteiro.
