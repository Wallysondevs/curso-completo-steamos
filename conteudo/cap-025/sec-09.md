As sete seções anteriores cobriram o caminho feliz — dock compatível, cabo decente, monitor obediente. Agora é a vez do que acontece quando a cadeia quebra. Esta seção é um guia de sobrevivência: os três sintomas mais severos de problema de vídeo externo no deck, como lê-los nos logs do kernel e do KScreen, e o que cada mensagem realmente significa.

O objetivo aqui não é "consertar tudo" — alguns problemas são de hardware e exigem troca de peça. O objetivo é saber **qual** peça trocar, e ter certeza disso antes de gastar dinheiro.

:::objetivos
- Diagnosticar queda de sinal (hotplug falso) pelo log do kernel DRM
- Decifrar mensagens de erro do KScreen no journalctl
- Entender a diferença entre "modo rejeitado" e "modo não listado"
- Interpretar timings de link training e por que eles falham
- Saber quando o problema é o cable, o dock ou o monitor — e provar
:::

## Queda de sinal e hotplug falso

O sintoma: a tela externa apaga por um segundo, volta, apaga de novo. Nos logs, aparece como uma sequência de `disconnected` → `connected` em loop rápido.

```terminal
$ sudo dmesg -w | grep -i drm
[  120.341] [drm] HDMI-A-1: disconnected
[  120.845] [drm] HDMI-A-1: connected -> hpd detected
[  123.112] [drm] HDMI-A-1: disconnected
[  123.598] [drm] HDMI-A-1: connected -> hpd detected
```

Esse padrão de conectar/desconectar a cada poucos segundos é chamado de **hotplug oscilante** e quase sempre é o cabo. O pino HPD (Hot Plug Detect) do HDMI faz contato intermitente, e cada microdesconexão dispara uma renegociação completa do link.

O diagnóstico diferencial é fácil: troque o cabo. Se o problema persistir com cabo novo, o próximo suspeito é a porta HDMI do dock (mal soldada, pinos sujos). Se com dock diferente o problema some, você já sabe quem é o culpado.

## Mensagens de erro do KScreen decifradas

O `journalctl -u kscreen` é o diário do daemon. Estas são as mensagens mais frequentes e o que cada uma significa:

```terminal
$ journalctl -u kscreen --since "5 minutes ago"
... kscreen.kded: config applied for output HDMI-A-1
... kscreen.kded: requested mode not available -> falling back
... kscreen.kded: output DP-1 failed to apply config: timeout
... kscreen.kded: EDID checksum invalid, using fallback mode
... kscreen.kded: HDR not supported by sink
```

| Mensagem | Significado |
|---|---|
| `config applied` | Tudo certo; o daemon aplicou a configuração e o monitor aceitou. |
| `requested mode not available` | Você pediu um modo que a EDID do monitor não lista. Use `cvt` + `xrandr --newmode` para forçar. |
| `failed to apply config: timeout` | O monitor não respondeu ao comando de mudança de modo no tempo limite. Cabo ou dock suspeito. |
| `EDID checksum invalid` | O bloco EDID veio corrompido. Geralmente é dock quebrando a comunicação I²C. |
| `HDR not supported by sink` | O monitor não anuncia HDR na EDID, ou está com HDR desligado no OSD. |

A mensagem mais séria é `EDID checksum invalid` — quando a EDID é ilegível, o KScreen aplica um modo "seguro" (800x600 ou 1024x768), o que explica aquela resolução horrível que às vezes aparece do nada.

## Link training: a negociação que ninguém vê

Antes de transmitir um único pixel, o transmissor e o receptor negociam a integridade elétrica do link numa fase chamada **link training**. Se ela falha, o modo não sobe — e o log do kernel conta o que aconteceu:

```terminal
$ sudo dmesg | grep -i "link\|training\|CR\|EQ"
[  15.230] [drm] DP-1: link training failed: CR failed (voltage swing 0, pre-emphasis 0)
[  15.231] [drm] DP-1: link training failed, retrying (attempt 1/4)
[  15.450] [drm] DP-1: link training passed at attempt 2
```

`CR` (Clock Recovery) e `EQ` (Channel Equalization) são as duas fases do treinamento. `CR failed` na primeira tentativa é comum e esperado — o sistema testa níveis de voltagem até achar o certo. Mas se `EQ` falha em todas as tentativas (`attempt 4/4`), o link não sobe e o monitor fica preto mesmo aparecendo listado.

Isso acontece quando o cabo é longo demais para a taxa pedida. Um cabo HDMI de 5 metros pode sustentar 1080p@60 perfeitamente, mas falhar em 4K@60. A correção: cabo mais curto, cabo certificado para a versão HDMI necessária, ou reduza a resolução/taxa.

## Isolando cabo, dock e monitor

Quando tudo parece "meio quebrado" e não há erro claro, use o método de substituição única: troque **uma** variável por vez e observe.

1. **Mesmo dock, cabo diferente**: se resolveu, era o cabo.
2. **Mesmo cabo, porta diferente do dock** (HDMI → DP): se resolveu, a porta antiga tem problema.
3. **Mesmo dock e cabo, monitor diferente**: se sumiu o sintoma, o monitor não tolera bem o sinal que o deck entrega.
4. **Deck sozinho → monitor direto (USB-C para DP/HDMI, sem dock)**: se o problema some, o dock é o culpado.

Esse último teste — bypass do dock — é o mais poderoso para isolar o dock. Com um adaptador USB-C → HDMI barato, você conecta o monitor direto ao deck e elimina toda a complexidade do dock. Se o monitor funciona perfeitamente assim, o problema está no dock, não no deck nem no monitor.

```terminal
$ kscreen-doctor -o
## Sem dock, monitor via adaptador USB-C → HDMI
Output: 1 eDP-1
	...
Output: 2 HDMI-A-1
	Modes:  1:3840x2160@60*!
```

Repare que mesmo sem dock, a saída ainda é `HDMI-A-1` — o adaptador USB-C para HDMI é "transparente" ao sistema, que vê uma porta HDMI como se ela tivesse saído do deck.

:::dica
Guarde um adaptador USB-C → HDMI simples na mochila do deck. Ele serve não só como monitor reserva, mas como ferramenta de diagnóstico: se o monitor funciona com o adaptador e não com o dock, você não perde tempo caçando problema no sistema operacional.
:::

## Quando a culpa é do monitor (e como provar)

Alguns monitores, especialmente TVs e modelos chineses baratos, anunciam modos na EDID que não sustentam de verdade — um "4K@60" que na prática só funciona a 30. O sintoma: o modo aparece na lista, você aplica, e a tela fica preta.

```terminal
$ kscreen-doctor output.HDMI-A-1.mode.3840x2160@60
## Tela preta...
$ kscreen-doctor output.HDMI-A-1.mode.1920x1080@60
## Tela volta ao normal
```

Se o 4K@30 funciona e o 4K@60 não, e você já trocou cabo e dock, o monitor está mentindo na EDID. Não há correção de software: ou você usa 4K@30 ou troca o monitor.

Para provar definitivamente: conecte o mesmo monitor a outro computador (Windows, Mac, outro Linux) e tente 4K@60. Se falhar lá também, o monitor é a causa raiz.

## Resumo

- Hotplug oscilante (loop `connected`/`disconnected`) é cabo ou porta HPD com mau contato.
- `EDID checksum invalid` indica EDID corrompida; o KScreen aplica modo de segurança de baixa resolução.
- Link training tem duas fases: Clock Recovery (CR) e Equalization (EQ); falha em EQ indica cabo longo ou de baixa qualidade.
- O diagnóstico de isolamento troca uma variável por vez: cabo, porta, dock, monitor.
- Um adaptador USB-C → HDMI (sem dock) é a ferramenta mais rápida para isolar se o problema é o dock.
- Monitor que anuncia modo que não sustenta só se prova com outro computador; não há correção de software.

## Exercícios

1. Rode `sudo dmesg | grep -i "link training"` e registre se houve falhas de CR ou EQ no boot atual.
2. Simule um problema de cabo: use um HDMI velho e fino e veja se o `journalctl -u kscreen` registra `failed to apply config: timeout`.
3. Com o dock conectado, rode `kscreen-console get` e examine a EDID indiretamente pelo campo `modes` do JSON. Compare com os modos listados no `kscreen-doctor`.
4. Faça o teste de bypass: conecte o monitor com adaptador USB-C → HDMI (sem dock) e registre o `kscreen-doctor -o`. Algum comportamento mudou em relação ao dock?
5. **Desafio.** Reproduza o diagnóstico completo de um monitor "mentiroso": encontre um modo que a EDID anuncia mas o monitor não sustenta, documente o `dmesg` durante a falha, force a volta com o modo seguro, e conclua com o teste cross-machine (mesmo monitor, outro PC) para selar o veredito.